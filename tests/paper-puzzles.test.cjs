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
assert.match(game.stages[6].parent,/chladničky/);assert.match(game.stages[7].parent,/pod gauč/);
// Match repairs by coverage, then independently decode their printed digits.
const seals=game.paperPuzzles.seals,solved=[],rejected=[];
for(const row of seals.rows){
 const choices=seals.repairs.flatMap((mask,index)=>Array.from(mask).every((bit,i)=>Number(bit)+Number(row.mask[i])===1)?[index]:[]);
 assert.ok(choices.length<=1,'a seal must have at most one exact repair');
 if(choices.length)solved.push([choices[0],row.digit]);else rejected.push(row);
}
assert.equal(rejected.length,2);assert.equal(solved.length,7);
assert.equal(solved.map(row=>row[1]).join(''),'5817264','valid messages directly form the code from top to bottom');
assert.notDeepEqual(solved.map(row=>row[0]),[0,1,2,3,4,5,6],'repair numbers identify matches without dictating the reading order');
assert.doesNotMatch(sheets.p6,/peča[ťt]|pečat|seal-code-slot|seal-code-boxes/i,'no seal terminology or result transcription on the player sheet');
assert.equal(new Set(solved.map(row=>row[0])).size,7,'every repair is used exactly once');
assert.ok(game.stages[6].answer.includes('5817264'));
assert.ok(!sheets.p6.includes('POD GAUČ'),'the hiding place is only revealed after verification');
assert.equal((sheets.p6.match(/class="seal-row"/g)||[]).length,9);
// Independently decode the ordered pairs into the single final return sign.
const signal=game.paperPuzzles.signal;
assert.equal(signal.columns,9);assert.equal(signal.rows,9);assert.equal(signal.screens.length,1);
assert.deepEqual(Array.from(signal.validPairs),['○★','△□','+◇']);
const expected='001111100/011000110/110000011/110000011/110000011/110000011/110000011/011000110/001111100';
const allowed=new Set(signal.validPairs),cells=signal.screens[0];
assert.equal(cells.length,81);
for(const reversed of ['★○','□△','◇+'])assert.ok(!allowed.has(reversed)&&cells.includes(reversed),'reversed pairs must occur as white decoys');
for(const pair of signal.validPairs)assert.ok(cells.includes(pair),'all three key pairs are used');
assert.equal(cells.map(pair=>allowed.has(pair)?'1':'0').join('').match(/.{9}/g).join('/'),expected);
assert.equal((sheets.p7.match(/<rect /g)||[]).length,81);assert.ok(!sheets.p7.includes('SVETLO'),'no plaintext final password on player sheet');
assert.ok(sheets.p6.includes('p6-pecate-portrait.png'));
assert.ok(sheets.p7.includes('p7-navrat-portrait.png'));
assert.equal(game.stages[6].reward,'');assert.equal(game.stages[7].finalLetter,'O');
assert.equal(game.stages[7].answer[0],'SVETLO');
assert.deepEqual([...Array.from(game.stages.slice(1,6),s=>s.reward),game.stages[7].finalLetter],['S','V','E','T','L','O']);
assert.equal(Object.keys(sheets).join(','),'p1,p2,p3,p4,p5,p6,p7,diplom');
console.log('PASS: 12 repairs and unique 14-bridge delivery route → POSTELI, no phone check on P4, bed clue with QR, nine messages read top to bottom → 5817264, one 9x9 pair grid → O, collected letters → SVETLO, seven paper sheets and preserved rewards.');
