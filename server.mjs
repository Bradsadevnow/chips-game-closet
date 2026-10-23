import http from 'node:http';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {freshGame,drop,outcome,legalColumns} from './game.mjs';
import {freshDice,diceView,diceAction,nextDiceRound,legalBids} from './liars-dice.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const dataDir=process.env.CHIPS_DATA_DIR||path.join(root,'data');await mkdir(dataDir,{recursive:true});
const config=JSON.parse(await readFile(process.env.CHIPS_MODEL_CONFIG||path.join(root,'model-config.json'),'utf8').then(s=>s.replace(/^\uFEFF/,'')));
const stateFile=path.join(dataDir,'world.json');
const initial=()=>({version:1,nodes:[{id:'chips',kind:'agent',name:'Chips',traits:['greedy','dry','self-interested'],balance:1000},{id:'player',kind:'player',balance:1000}],edges:[{from:'chips',to:'player',kind:'opponent',games:0,wins:0,losses:0}],ledger:[],memories:[],game:null});
let world;try{world=JSON.parse(await readFile(stateFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;world=initial();}
let busy=false,busyGame=null;
const node=id=>world.nodes.find(n=>n.id===id);
async function save(){await writeFile(stateFile+'.tmp',JSON.stringify(world,null,2));await rename(stateFile+'.tmp',stateFile);}
function view(){return {game:world.game?.kind==='liars-dice'?diceView(world.game):world.game,balances:{player:node('player').balance,chips:node('chips').balance},history:world.ledger.slice(-8).reverse(),busy:busy&&busyGame===world.game?.id,model:config.model,modelUrl:config.base_url};}
function settle(g){if(!g.result||g.settled)return;g.settled=true;const winner=g.result.winner;const amount=winner===1?g.stake:winner===2?-g.stake:0;node('player').balance+=amount;node('chips').balance-=amount;const relationship=world.edges[0];relationship.games++;if(winner===2)relationship.wins++;if(winner===1)relationship.losses++;world.ledger.push({id:randomUUID(),gameId:g.id,game:g.kind||'four-in-row',at:new Date().toISOString(),winner,stake:g.stake,playerDelta:amount});world.memories.push({id:randomUUID(),kind:'game-result',gameId:g.id,winner,stake:g.stake,at:new Date().toISOString()});}
function validateCall(message,g){const calls=message?.tool_calls;if(!Array.isArray(calls)||calls.length!==1||calls[0].function?.name!=='play_turn')throw Error('Chips did not submit a valid move.');let a;try{a=JSON.parse(calls[0].function.arguments);}catch{throw Error('Chips returned unreadable move arguments.');}if(a.board_revision!==g.revision||!Number.isInteger(a.column)||!legalColumns(g.board).includes(a.column)||typeof a.remark!=='string'||a.remark.length>300||Object.keys(a).some(k=>!['column','remark','board_revision'].includes(k)))throw Error('Chips submitted an invalid move.');return a;}
async function modelTurn(g){
 const revision=g.revision;const start=Date.now();
 const instructions=`You are Chips, the greedy, dry, self-interested grey robot proprietor of an extravagantly self-worshipping casino. You play to win Tokens. Understated delivery, Bender/GLaDOS influence, no monologues or theatrical authority. Optional one short funny insulting remark about this game, no slurs or personal threats. Empty remark is fine. Play four-in-a-row: board is SIX rows, top to bottom, SEVEN columns indexed 0-6; 0 empty, 1 human, 2 you. Drop into a legal column: piece lands at lowest empty row. Four horizontally, vertically or diagonally wins. Submit EXACTLY ONE play_turn tool call. board_revision must ECHO the supplied revision exactly, never increment it. Your remark accompanies the move; don't claim a win unless your move actually wins. No plain-text answer. Never alter balances. Keep reasoning concise.`;
 const gameView={board:g.board,board_revision:revision,side:2,legal_columns:legalColumns(g.board),last_move:g.lastMove,stake:g.stake,balances:{you:node('chips').balance,player:node('player').balance},recent_results:world.memories.slice(-4)};
 const tool={type:'function',function:{name:'play_turn',description:'Submit your legal drop and optional short remark. Echo the current board revision.',parameters:{type:'object',properties:{column:{type:'integer',enum:legalColumns(g.board)},remark:{type:'string',maxLength:300},board_revision:{type:'integer',enum:[revision]}},required:['column','remark','board_revision'],additionalProperties:false}}};
 const messages=[{role:'system',content:instructions},{role:'user',content:JSON.stringify(gameView)}];
 for(let attempt=0;attempt<2;attempt++){
  try{
   const response=await fetch(config.base_url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:config.model,messages,tools:[tool],tool_choice:'required',temperature:0.5,max_tokens:4096,reasoning_effort:'low',stream:false}),signal:AbortSignal.timeout(90000)});
   if(!response.ok)throw Error('Model server returned '+response.status+'.');
   const data=await response.json();g.diagnostics={finishReason:data.choices?.[0]?.finish_reason,completionTokens:data.usage?.completion_tokens,reasoningTokens:data.usage?.completion_tokens_details?.reasoning_tokens};
   if(world.game?.id!==g.id||world.game.revision!==revision)return;
   let a;try{a=validateCall(data.choices?.[0]?.message,g);}catch(error){if(attempt===0){messages.push({role:'user',content:`The previous response was rejected: ${error.message} Submit one play_turn call, column from ${legalColumns(g.board)}, board_revision exactly ${revision}.`});continue;}throw error;}
   const row=drop(g.board,a.column,2);g.revision++;g.lastMove={row,column:a.column,side:2};g.remark=a.remark;g.latencyMs=Date.now()-start;g.result=outcome(g.board);g.turn=g.result?0:1;g.error=null;settle(g);return;
  }catch(error){if(world.game?.id===g.id){g.error=error.name==='TimeoutError'?'Chips took too long. Retry his turn.':error.message;g.latencyMs=Date.now()-start;}return;}
 }
}
async function diceModelTurn(g){
 const revision=g.revision,start=Date.now();
 const visible=diceView(g,'chips');delete visible.reveal;
 const instructions='You are Chips, a dry, greedy robot casino owner. Play heads-up Liar’s Dice to win. You see ONLY your own dice, opponent count and public bids. Ones are wild, including when bidding ones (only ones count for a bid of ones). Bid quantity counts both hands. Raise quantity or raise face at equal quantity; no special ones conversion. Challenge with liar if the last bid is false. A failed challenge costs the caller one die; a false bid costs the bidder one die. Last player with dice wins the match stake. Human opens each round. Submit exactly one play_dice tool call. Echo revision exactly. Optional short dry remark; empty is fine. Do not reveal your dice in remarks or claim knowledge of hidden dice. Never alter balances.';
 const tool={type:'function',function:{name:'play_dice',parameters:{type:'object',properties:{action:{type:'string',enum:['bid','liar']},quantity:{type:'integer',minimum:0,maximum:10},face:{type:'integer',minimum:0,maximum:6},remark:{type:'string',maxLength:300},revision:{type:'integer',enum:[revision]}},required:['action','quantity','face','remark','revision'],additionalProperties:false},description:'Bid a legal quantity and face, or call liar with quantity 0 and face 0.'}};
 const messages=[{role:'system',content:instructions},{role:'user',content:JSON.stringify({...visible,recent_results:world.memories.slice(-4)})}];
 for(let attempt=0;attempt<2;attempt++)try{
  const response=await fetch(config.base_url.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:config.model,messages,tools:[tool],tool_choice:'required',temperature:.5,max_tokens:4096,reasoning_effort:'low',stream:false}),signal:AbortSignal.timeout(90000)});
  if(!response.ok)throw Error('Model server returned '+response.status+'.');
  const data=await response.json();if(world.game?.id!==g.id||g.revision!==revision)return;
  try{
   const calls=data.choices?.[0]?.message?.tool_calls;
   if(!Array.isArray(calls)||calls.length!==1||calls[0].function?.name!=='play_dice')throw Error('Submit one play_dice call.');
   const a=JSON.parse(calls[0].function.arguments);
   if(a.revision!==revision||typeof a.remark!=='string'||a.remark.length>300||Object.keys(a).some(k=>!['action','quantity','face','remark','revision'].includes(k))||!Number.isInteger(a.quantity)||!Number.isInteger(a.face)||a.action==='liar'&&(a.quantity!==0||a.face!==0))throw Error('Invalid dice move arguments.');
   diceAction(g,2,a);g.remark=a.remark;g.latencyMs=Date.now()-start;settle(g);return;
  }catch(error){if(attempt===0){messages.push({role:'user',content:'Rejected: '+error.message+' Use a legal bid or liar, revision '+revision+'.'});continue;}throw error;}
 }catch(error){g.error=error.name==='TimeoutError'?'Chips took too long. Retry his turn.':error.message==='fetch failed'?'Cannot reach Chips’ model. Check the local model server, then retry.':error.message;g.latencyMs=Date.now()-start;return;}
}
async function runModel(g){busy=true;busyGame=g.id;try{if(g.kind==='liars-dice')await diceModelTurn(g);else await modelTurn(g);await save();}finally{busy=false;busyGame=null;}}
async function body(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>4096)throw Error('Request too large.');}return raw?JSON.parse(raw):{};}
const json=(res,code,value)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
const staticFiles=new Map([['/','public/index.html'],['/app.js','public/app.js'],['/style.css','public/style.css'],['/assets/lounge.png','assets/chips/casino-lounge-approved-v1.png'],['/assets/house.png','assets/chips/counter-house-v1.png'],['/assets/player.png','assets/chips/counter-player-v1.png'],['/assets/chips.png','assets/chips/chips-approved-v1.png']]);
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 if(req.method==='GET'&&url.pathname==='/api/state')return json(res,200,view());
 if(req.method==='POST'){
  if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return json(res,403,{error:'Invalid origin.'});
  const b=await body(req);
  if(!['/api/new','/api/move','/api/retry','/api/refill','/api/next'].includes(url.pathname))return json(res,404,{error:'Unknown action.'});
  if(busy)return json(res,409,{error:'Wait for the current turn.'});
  if(url.pathname==='/api/refill'){if(world.game&&!world.game.result)return json(res,409,{error:'Finish the round first.'});node('player').balance+=1000;node('chips').balance+=1000;world.ledger.push({id:randomUUID(),at:new Date().toISOString(),kind:'free-refill',playerDelta:1000,houseDelta:1000});await save();return json(res,200,view());}
  if(url.pathname==='/api/new'){
   if(world.game&&!world.game.result)return json(res,409,{error:'Finish the current round first.'});
   if(!Number.isInteger(b.stake)||![0,1,5,10,25,50,100].includes(b.stake)||b.stake>Math.min(node('player').balance,node('chips').balance))return json(res,400,{error:'Choose a stake both players can cover.'});
   if(b.kind!==undefined&&!['four-in-row','liars-dice'].includes(b.kind))return json(res,400,{error:'Choose an available game.'});
   world.game=b.kind==='liars-dice'?freshDice(randomUUID(),b.stake):freshGame(randomUUID(),b.stake);await save();return json(res,200,view());
  }
  const g=world.game;if(!g||g.result)return json(res,409,{error:'Start a new round.'});
  if(b.gameId!==g.id||b.revision!==g.revision)return json(res,409,{error:'The board changed. Refresh and try again.'});
  if(url.pathname==='/api/next'){if(g.kind!=='liars-dice')throw Error('Not a dice match.');nextDiceRound(g);await save();return json(res,200,view());}
  if(url.pathname==='/api/move'){
   if(g.turn!==1)return json(res,409,{error:'It is Chips’ turn.'});
   if(g.kind==='liars-dice'){diceAction(g,1,b);g.remark='';settle(g);await save();if(g.turn===2)await runModel(g);return json(res,200,view());}
   const row=drop(g.board,b.column,1);g.revision++;g.lastMove={row,column:b.column,side:1};g.remark='';g.error=null;g.result=outcome(g.board);g.turn=g.result?0:2;settle(g);await save();
   if(!g.result)await runModel(g);return json(res,200,view());
  }
  if(g.turn!==2)return json(res,409,{error:'No model turn to retry.'});await runModel(g);return json(res,200,view());
 }
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed.'});
 const file=staticFiles.get(url.pathname);if(!file)return json(res,404,{error:'Not found.'});const bytes=await readFile(path.join(root,file));res.writeHead(200,{'Content-Type':file.endsWith('.png')?'image/png':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html','Cache-Control':file.endsWith('.png')?'public, max-age=3600':'no-store'});res.end(bytes);
}catch(error){json(res,400,{error:error.message});}});
await save();server.listen(Number(process.env.PORT||3210),'127.0.0.1',()=>console.log('Chips: http://127.0.0.1:'+ (process.env.PORT||3210)));
