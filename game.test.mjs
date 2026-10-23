import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshGame,drop,outcome,legalColumns} from './game.mjs';
test('gravity, full columns, and invalid input',()=>{const b=freshGame('x').board;for(let i=0;i<6;i++)assert.equal(drop(b,2,i%2+1),5-i);assert(!legalColumns(b).includes(2));assert.throws(()=>drop(b,2,1));assert.throws(()=>drop(b,-1,1));assert.throws(()=>drop(b,1.5,1));});
test('all four win directions',()=>{for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){const b=freshGame('x').board;for(let i=0;i<4;i++)b[i*dr][3+i*dc]=2;assert.equal(outcome(b).winner,2);}});
test('full board draw',()=>{const b=Array.from({length:6},(_,r)=>Array.from({length:7},(_,c)=>((c+Math.floor(r/2))%2)+1));assert.equal(outcome(b).winner,0);});
