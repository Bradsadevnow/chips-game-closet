import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
test('validated model turn, settlement, retry, stale protection, and restart persistence',async()=>{
 const testRoot=path.join(import.meta.dirname,'data','tests');await mkdir(testRoot,{recursive:true});const dir=await mkdtemp(path.join(testRoot,'run-'));let invalid=false,fail=false,calls=0;
 const model=http.createServer(async(req,res)=>{let raw='';for await(const c of req)raw+=c;const b=JSON.parse(raw);const state=JSON.parse(b.messages[1].content);calls++;if(state.kind==='liars-dice'){assert.equal(state.hands,undefined);assert.equal(state.reveal,undefined);assert.equal(state.dice.length,5);const a={action:'liar',quantity:0,face:0,remark:'Let’s see them.',revision:state.revision};res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{tool_calls:fail?[]:[{function:{name:'play_dice',arguments:JSON.stringify(a)}}]}}]}));return;}const a={column:6,remark:'A perfectly adequate move.',board_revision:state.board_revision};if(invalid){a.column=8;invalid=false;}res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{finish_reason:'tool_calls',message:{tool_calls:fail?[]:[{function:{name:'play_turn',arguments:JSON.stringify(a)}}]}}]}));});
 await new Promise(resolve=>model.listen(0,'127.0.0.1',resolve));const modelPort=model.address().port;
 const portProbe=http.createServer();await new Promise(resolve=>portProbe.listen(0,'127.0.0.1',resolve));const port=portProbe.address().port;await new Promise(resolve=>portProbe.close(resolve));
 const config=path.join(dir,'config.json');await writeFile(config,JSON.stringify({base_url:`http://127.0.0.1:${modelPort}/v1`,model:'test'}));
 let child;async function start(){child=spawn(process.execPath,['server.mjs'],{cwd:import.meta.dirname,env:{...process.env,PORT:String(port),CHIPS_DATA_DIR:dir,CHIPS_MODEL_CONFIG:config},stdio:['ignore','pipe','pipe']});let errors='';child.stderr.on('data',b=>errors+=b);await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>{if(code)reject(Error('server exit '+code+' '+errors));});});}
 async function stop(){if(child?.exitCode===null){child.kill();await new Promise(r=>child.once('exit',r));}}
 const base=`http://127.0.0.1:${port}`;async function api(route,b){const r=await fetch(base+route,b?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}:{});return {status:r.status,state:await r.json()};}
 try{
 await start();let {state:s}=await api('/api/new',{stake:10});const id=s.game.id;
 const stale=await api('/api/move',{gameId:id,revision:99,column:0});assert.equal(stale.status,409);
 invalid=true;for(let i=0;i<4;i++){const r=await api('/api/move',{gameId:id,revision:s.game.revision,column:0});assert.equal(r.status,200);s=r.state;assert.equal(s.game.error,null);}
 assert.equal(s.game.result.winner,1);assert.equal(calls,4);assert.equal(s.balances.player,1010);assert.equal(s.balances.chips,990);assert.equal(s.history.filter(x=>x.gameId===id).length,1);
 assert.equal((await api('/api/move',{gameId:id,revision:s.game.revision,column:0})).status,409);
 await stop();await start();s=(await api('/api/state')).state;assert.equal(s.balances.player,1010);assert.equal(s.game.result.winner,1);
 s=(await api('/api/new',{stake:5})).state;fail=true;s=(await api('/api/move',{gameId:s.game.id,revision:s.game.revision,column:0})).state;assert(s.game.error);assert.equal(s.game.revision,1);assert.equal(s.game.board[5][0],1);assert.equal(s.balances.player,1010);
 fail=false;s=(await api('/api/retry',{gameId:s.game.id,revision:s.game.revision})).state;assert.equal(s.game.revision,2);assert.equal(s.game.error,null);
 const world=JSON.parse(await readFile(path.join(dir,'world.json'),'utf8'));assert.equal(world.memories.length,1);
 // Finish the existing four-in-row game before switching modules.
 for(let i=0;i<3;i++)s=(await api('/api/move',{gameId:s.game.id,revision:s.game.revision,column:0})).state;
 s=(await api('/api/new',{stake:10,kind:'liars-dice'})).state;const diceId=s.game.id;assert.equal(s.game.hands,undefined);assert.equal(s.game.dice.length,5);
 assert.equal((await api('/api/new',{stake:0,kind:'four-in-row'})).status,409);
 async function ensureFalseBid(){await stop();const file=path.join(dir,'world.json');const w=JSON.parse(await readFile(file,'utf8'));w.game.hands.player[0]=2;await writeFile(file,JSON.stringify(w));await start();}
 await ensureFalseBid();fail=true;s=(await api('/api/move',{gameId:diceId,revision:s.game.revision,action:'bid',quantity:10,face:6})).state;assert(s.game.error);assert.equal(s.game.revision,1);fail=false;
 s=(await api('/api/retry',{gameId:diceId,revision:s.game.revision})).state;assert(s.game.reveal);assert.equal(s.game.reveal.loser,1);
 for(let i=1;i<5;i++){s=(await api('/api/next',{gameId:diceId,revision:s.game.revision})).state;assert.equal(s.game.reveal,null);await ensureFalseBid();s=(await api('/api/move',{gameId:diceId,revision:s.game.revision,action:'bid',quantity:s.game.dice.length+5,face:6})).state;}
 assert.equal(s.game.result.winner,2);assert.equal(s.history.filter(h=>h.gameId===diceId).length,1);assert.equal(s.balances.player+s.balances.chips,2000);
 await stop();await start();s=(await api('/api/state')).state;assert.equal(s.game.id,diceId);assert.equal(s.game.result.winner,2);assert.equal((await api('/api/retry',{gameId:diceId,revision:s.game.revision})).status,409);
 }finally{await stop();await new Promise(r=>model.close(r));}
});
