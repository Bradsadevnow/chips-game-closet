export const ROWS=6, COLS=7;
export function legalColumns(board){return board[0].flatMap((v,c)=>v===0?[c]:[])}
export function outcome(board){
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(board[r][c]){
  for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){
   const line=Array.from({length:4},(_,i)=>[r+i*dr,c+i*dc]);
   if(line.every(([y,x])=>y>=0&&y<ROWS&&x>=0&&x<COLS&&board[y][x]===board[r][c]))return {winner:board[r][c],line};
  }
 }
 return legalColumns(board).length?null:{winner:0,line:[]};
}
export function drop(board,column,side){
 if(!Number.isInteger(column)||column<0||column>=COLS||!legalColumns(board).includes(column))throw Error('Choose an open column.');
 for(let row=ROWS-1;row>=0;row--)if(board[row][column]===0){board[row][column]=side;return row;}
}
export function freshGame(id,stake=0){return {id,stake,revision:0,board:Array.from({length:ROWS},()=>Array(COLS).fill(0)),turn:1,result:null,lastMove:null,remark:'',error:null,latencyMs:null,settled:false};}
