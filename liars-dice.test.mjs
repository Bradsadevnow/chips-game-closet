import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshDice,diceView,diceAction,nextDiceRound,legalBids} from './liars-dice.mjs';
test('hidden hands, strict raises, wild ones, reveal and reroll',()=>{
 const g=freshDice('test',10);g.hands={player:[1,2,3],chips:[1,5,6]};
 assert.equal(diceView(g).hands,undefined);assert.deepEqual(diceView(g).dice,[1,2,3]);assert.deepEqual(diceView(g,'chips').dice,[1,5,6]);
 assert.throws(()=>diceAction(g,1,{action:'liar'}));
 diceAction(g,1,{action:'bid',quantity:3,face:5});
 assert.throws(()=>diceAction(g,2,{action:'bid',quantity:3,face:4}));
 assert(legalBids(g).some(b=>b.quantity===4&&b.face===1));
 diceAction(g,2,{action:'liar'});assert.equal(g.reveal.actual,3);assert.equal(g.reveal.loser,2);assert.equal(g.hands.chips.length,2);assert.equal(g.reveal.hands.chips.length,3);
 assert.throws(()=>diceAction(g,1,{action:'bid',quantity:1,face:1}));
 nextDiceRound(g);assert.equal(g.round,2);assert.equal(g.hands.chips.length,2);assert.equal(g.reveal,null);assert.equal(g.turn,1);
});
test('ones count once and final die ends the match',()=>{
 const g=freshDice('test');g.hands={player:[1],chips:[6]};
 diceAction(g,1,{action:'bid',quantity:2,face:1});diceAction(g,2,{action:'liar'});
 assert.equal(g.reveal.actual,1);assert.equal(g.result.winner,2);assert.throws(()=>nextDiceRound(g));
});
