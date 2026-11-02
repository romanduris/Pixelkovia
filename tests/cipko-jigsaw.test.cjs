const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={window:{},GAME:{cipkoPuzzle:{digits:[7,2,9,4]}}};vm.createContext(context);vm.runInContext(fs.readFileSync('cipko-game.js','utf8'),context);
const game=context.window.CIPKO_GAME;
const fresh={};const c=game.data(fresh);assert.equal(c.tiles.length,12);c.round=1;
for(let i=0;i<11;i++){game.act(fresh,'select',i);game.act(fresh,'slot',i);assert.equal(c.won,false,'all twelve pieces are required');}
game.act(fresh,'select',12);assert.equal(c.selected,null,'out-of-range selection is ignored');
game.act(fresh,'select',11);game.act(fresh,'slot',10);assert.equal(c.tiles[11],null,'a wrong position does not place the last piece');
game.act(fresh,'slot',11);assert.equal(c.won,true);assert.equal(c.tiles.length,12);
const old={completed:[1,4],cipko:{version:2,round:1,won:false,pixels:[1,2,3],tiles:[0,null,2,...Array(6).fill(null)],selected:4,matched:[],open:[],turns:[1,0,2,2,1,0,2,1,0]}};
const upgraded=game.data(old);assert.equal(upgraded.tiles.length,12);assert.ok(upgraded.tiles.every(x=>x===null));assert.equal(upgraded.round,1);assert.equal(upgraded.selected,null);assert.deepEqual(old.completed,[1,4]);assert.deepEqual(upgraded.pixels,[1,2,3]);
for(const [round,won] of [[1,true],[2,false],[3,false],[4,false]]){
 const s={cipko:{...old.cipko,round,won,tiles:[0,1,2,3,4,5,6,7,8]}};const after=game.data(s);assert.equal(after.round,round);assert.equal(after.won,won);assert.ok(after.tiles.every((v,i)=>v===i),'previously solved pictures stay solved');
}
console.log('PASS: twelve-piece solution, wrong placement and saved nine-piece progress migration.');
