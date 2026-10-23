import {randomInt} from 'node:crypto';
const roll=count=>Array.from({length:count},()=>randomInt(1,7));
export function freshDice(id,stake=0){return {id,kind:'liars-dice',stake,revision:0,round:1,hands:{player:roll(5),chips:roll(5)},bid:null,bids:[],reveal:null,turn:1,result:null,remark:'',error:null,latencyMs:null,settled:false};}
export function legalBids(g){const total=g.hands.player.length+g.hands.chips.length;const bids=[];for(let quantity=1;quantity<=total;quantity++)for(let face=1;face<=6;face++)if(!g.bid||quantity>g.bid.quantity||quantity===g.bid.quantity&&face>g.bid.face)bids.push({quantity,face});return bids;}
export function diceView(g,side='player'){const other=side==='player'?'chips':'player';const {hands,...visible}=g;return {...visible,dice:hands[side],opponentDiceCount:hands[other].length,legalBids:legalBids(g)};}
export function diceAction(g,side,a){
 if(g.result||g.reveal||g.turn!==side)throw Error('Wait for your turn.');
 if(a.action==='bid'){
  if(!legalBids(g).some(b=>b.quantity===a.quantity&&b.face===a.face))throw Error('Raise the quantity, or raise the face at the same quantity.');
  g.bid={quantity:a.quantity,face:a.face,side};g.bids.push({...g.bid});g.turn=side===1?2:1;
 }else if(a.action==='liar'){
  if(!g.bid)throw Error('A bid is needed before calling liar.');
  const actual=[...g.hands.player,...g.hands.chips].filter(v=>v===g.bid.face||v===1).length;
  const loser=actual>=g.bid.quantity?side:g.bid.side;
  g.reveal={hands:structuredClone(g.hands),bid:{...g.bid},actual,caller:side,loser};
  g.hands[loser===1?'player':'chips'].pop();g.turn=0;
  if(!g.hands.player.length||!g.hands.chips.length)g.result={winner:g.hands.player.length?1:2,line:[]};
 }else throw Error('Choose a bid or call liar.');
 g.revision++;g.error=null;
}
export function nextDiceRound(g){if(!g.reveal||g.result)throw Error('Finish this round first.');g.hands={player:roll(g.hands.player.length),chips:roll(g.hands.chips.length)};g.round++;g.revision++;g.bid=null;g.bids=[];g.reveal=null;g.turn=1;g.remark='';g.error=null;}
