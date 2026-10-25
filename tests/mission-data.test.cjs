// Parent preparation and physical clues must agree across data, printouts and UI.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync('game-data.js','utf8'),ctx);
const game=ctx.window.GAME;
const app=fs.readFileSync('site-content.js','utf8');
vm.runInNewContext(fs.readFileSync('story-text.js','utf8'),ctx);
vm.runInNewContext(fs.readFileSync('print-materials.js','utf8'),ctx);
const print=Object.values(ctx.window.PRINT_MATERIALS.sheets).join('');
const one=game.stages[1],two=game.stages[2],three=game.stages[3];
assert.match(one.parent,/iba celý P1/);
assert.ok(!one.materials.includes('P2'));
assert.match(two.materials,/P2:.*dekódovací stroj.*indícii 2 pri okne/);
assert.match(two.parent,/Okno sa neotvára a na parapet sa nelezie/);
assert.match(two.task,/KODGDM SRG VWROLFNDPL/);
assert.match(two.action,/vonkajšie D oproti vnútornému A/);
assert.match(game.stages[4].action,/P4.*12.*ŠTART/);
assert.match(three.parent,/obálke \(indícii\) Úloha 3 pod sedadlom/);
assert.match(three.parent,/P4[\s\S]*topánky[\s\S]*P5[\s\S]*posteli/);
assert.match(game.stages[6].action,/indíciu k úlohe 6 pod sedadlom/);
for(const location of ['medzi uterákmi','práčky','sušičky','elektrickým zariadeniam'])assert.ok(game.stages[0].parent.includes(location));
for(const hint of game.stages[0].hints)assert.ok(hint.length>10);
for(const label of ['Obálka (indícia) Kúpeľňa: iba celý P1','Obálka (indícia) 2: celý P2','Obálka (indícia) 3: celý pripravený P4','Obálka (indícia) 4: P6'])assert.ok(app.includes(label),label);
for(const label of ['P2 / Indícia pri okne','P4 / Indícia pri topánkach','P5 / Indícia v posteli','P6 / Indícia pod stoličkou'])assert.ok(print.includes(label),label);
assert.ok(!JSON.stringify(game.stages.slice(3)).includes('obálke 2 na stole'));
assert.ok(fs.readFileSync('scripts/prepare-static.mjs','utf8').includes('signal-print.css'));
assert.ok(!/obálk[ay] 1[^.]*rozstrihan/i.test(app));
console.log('PASS: parent preparation, safe hiding places, envelope numbering, sealed later clues and current task logistics agree.');

// The physical puzzles produce the same destinations, with Pixi decoding and delivery routing.
const sheets=ctx.window.PRINT_MATERIALS.sheets;
const encoded=sheets.p2.match(/data-ciphertext="([^"]+)"/)[1],shift=Number(sheets.p2.match(/data-shift="([^"]+)"/)[1]);
const decoded=[...encoded].map(letter=>/[A-Z]/.test(letter)?String.fromCharCode(65+(letter.charCodeAt(0)-65+shift+26)%26):letter).join('');
assert.equal(decoded,'HLADAJ POD STOLICKAMI');assert.ok(two.answer.includes(decoded));
assert.ok(sheets.p2.includes('id="circles"'));assert.ok(!sheets.p4.includes('id="circles"'));
assert.match(sheets.p4,/delivery-map/);assert.equal(game.stages[4].paperAnswer,'POSTELI');
// Old paper confirmations cannot silently attest the new worksheets, and game saves are retained.
assert.equal(two.paperOnly,true);assert.equal(two.narrative.after.length,0);assert.equal(game.pixiQr,undefined);assert.ok(!/QR|naskenujte|zadajte[^.]*telefón/i.test(sheets.p2));assert.ok(sheets.p3.includes('assets/plugy-qr.svg'));assert.equal(three.label,'Úloha 3 – Pod stoličkou');assert.match(three.parent,/P6 a P7 zostávajú pod inou stoličkou/);
const saved=new Map([['zahada-v1-progress','existing-game'],['zahada-prep-0','1'],['zahada-prep-1','1'],['zahada-prep-2','1'],...['printed','cut-p2','envelope-2','symbols','table','supplies'].map(id=>['zahada-prep-v5-'+id,'1'])]);
const prepContext={window:{},localStorage:{getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)}};
vm.runInNewContext(fs.readFileSync('prep-store.js','utf8'),prepContext);const prep=prepContext.window.PREP_STORE;
for(const id of ['printed','cut-p4','envelope-2','symbols','table'])assert.equal(prep.read(id),false,id+': new paper preparation must be confirmed');
assert.equal(prep.read('supplies'),true);assert.equal(prep.ready(),false);
for(const step of prep.steps)prep.write(step.id,true);prep.write('device-understood',true);assert.equal(prep.ready(),true);
assert.equal(saved.get('zahada-v1-progress'),'existing-game');assert.equal(saved.get('zahada-prep-v5-cut-p2'),'1');
console.log('PASS: Pixi decoder → HĽADAJ POD STOLIČKAMI; delivery route → POSTELI; updated preparation requires confirmation and preserves saved games.');

// Child-facing clues stay distinct from physical packaging in the adult guide.
// P4 uses drawn envelope icons for collecting letters, distinct from physical packaging.
for(const stage of game.stages)assert.ok(!/obálk/i.test(JSON.stringify(stage.narrative).replace(stage.id==='cipher'?'v obálkach':'__no_icon__','')),stage.id+': use indícia for physical clues');
for(const [id,sheet] of Object.entries(sheets))assert.ok(!/obálk/i.test(sheet.replace(id==='p4'?/(?:v obálkach|pri obálke|z obálok)/g:/__no_icon__/g,'')),id+': printable child copy uses indícia for physical clues');
for(const script of Object.values(game.voiceScripts))assert.ok(!/obálk/i.test(script.prompt));
const riddle=game.plugyMessage.join(' ');
assert.match(riddle,/cestovateľov[\s\S]*jazyk[\s\S]*nohami/);
assert.ok(!/topán|na stole|pásik|písmeno E/i.test(riddle),'Plugy gives a riddle without naming the hiding place or next mechanic');
assert.match(game.stages[4].parent,/do čistej suchej topánky/);
assert.match(game.stages[3].parent,/P5[\s\S]*posteli/);
assert.ok(prep.steps.some(step=>step.id==='shoes'));
assert.ok(!sheets.p4.includes('assets/pingy-qr.svg'));assert.ok(sheets.p5.includes('assets/cipko-qr.svg'));
assert.equal(new URL(game.pingyQr).searchParams.get('signal'),'listok');
console.log('PASS: shoe clue, separate P5 in the bed, child terminology and spoiler-free Plugy riddle agree.');
