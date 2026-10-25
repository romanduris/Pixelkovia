const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{}};
for(const f of ['game-data.js','story-text.js','print-materials.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),ctx);
const game=ctx.window.GAME,sheets=ctx.window.PRINT_MATERIALS.sheets;
const route=game.paperPuzzles.delivery;let at=route.start,word='',visited=new Set();
while(at!==route.finish){
 assert.ok(!visited.has(at),'delivery route must not loop');visited.add(at);
 const choices=route.edges.filter(e=>e.from===at&&(Number.isInteger(e.repairSlot)?route.repairKey[e.repairSlot]:e.symbol)===route.nodes[at].symbol);
 assert.equal(choices.length,1,'each visited light node has exactly one matching outgoing route');
 at=choices[0].to;word+=route.nodes[at].letter;
}
assert.equal(visited.size,14,'delivery requires fourteen bridge decisions after repairs');
assert.equal(route.nodes.length,24);
const broken=route.edges.filter(e=>Number.isInteger(e.repairSlot));assert.equal(broken.length,12);
assert.ok(broken.every(e=>!Object.hasOwn(e,'symbol')),'missing bridge shapes must not already be present');
assert.deepEqual(Array.from(route.repairKey),['○','△','□']);
assert.equal((sheets.p4.match(/class="broken-bridge"/g)||[]).length,12);
assert.ok(sheets.p4.includes('p4-svetelne-uzly.png'),'the five-friend illustration is included in the real printable');
assert.match(sheets.p4,/<section class="paper-reward"[^>]*><strong>T<\/strong>/);
assert.ok(!/stanic/i.test(sheets.p4+JSON.stringify(game.stages[4])),'light-node terminology throughout');
assert.equal(word,'POSTELI');assert.equal(game.stages[4].paperAnswer,word);
assert.equal(game.stages[4].paperOnly,true);assert.equal(game.stages[4].narrative.after.length,0);
assert.ok(!/QR|<form|data-order/.test(sheets.p4));assert.match(sheets.p4,/Ďalšia indícia sa skrýva v tvojej:/);
assert.match(sheets.p5,/cipko-qr.svg/);assert.match(game.stages[5].parent,/pod vankúš/);
// Phone rewards must decode through the actual paper key to the new destination.
const cipko=game.cipkoPuzzle,key=new Map(cipko.key.map(([digit,part])=>[digit,part]));
const destination=cipko.digits.map(digit=>key.get(digit)).join('');
assert.equal(destination,'CHLADNIČKA');
assert.equal(game.stages[5].answer.length,0,'P5 no longer verifies any phone answer');assert.ok(game.stages[5].solution.includes(destination));assert.match(sheets.p6,/guardy-qr.svg/);
assert.ok(!sheets.p5.includes('CHLADNIČKA')&&!sheets.p5.includes('class="maze"'),'paper requires phone rewards instead of printing the answer or old maze');
assert.match(game.stages[6].parent,/chladničky/);assert.match(game.stages[7].parent,/chladničky/);
// Independently decode the printable symbol pairs into the six expected glyphs.
const expected=['11111/10000/10000/11111/00001/00001/11111','10001/10001/10001/10001/10001/01010/00100','11111/10000/10000/11110/10000/10000/11111','11111/00100/00100/00100/00100/00100/00100','10000/10000/10000/10000/10000/10000/11111','01110/10001/10001/10001/10001/10001/01110'];
const allowed=new Set(['○□','□○','△◇','◇△','+★','★+']);
for(const [n,cells] of game.paperPuzzles.signal.screens.entries()){
 assert.equal(cells.length,35);const bits=cells.map(pair=>allowed.has(pair)?'1':'0').join('');
 assert.equal(bits.match(/.{5}/g).join('/'),expected[n]);
}
assert.equal((sheets.p7.match(/<rect /g)||[]).length,210);assert.ok(!sheets.p7.includes('SVETLO'),'no plaintext answer on player sheet');
assert.equal(game.stages[7].answer[0],'SVETLO');
assert.deepEqual(Array.from(game.stages.slice(1,7),s=>s.reward),['S','V','E','T','L','O']);
assert.equal(Object.keys(sheets).join(','),'p1,p2,p3,p4,p5,p6,p7,diplom');
console.log('PASS: 12 repairs and unique 14-bridge delivery route → POSTELI, no phone check on P4, bed clue with QR, six symbol grids → SVETLO, seven paper sheets and preserved rewards.');
