// Current character identities, recording scripts and media.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={window:{}};vm.runInNewContext(fs.readFileSync('game-data.js','utf8'),context);const game=context.window.GAME;
assert.deepEqual(Array.from(game.characters,c=>c.name),['Piko','Miky','Pixi','Plugy','Pingy','Čipko','Guardy']);
assert.deepEqual([...Array.from(game.stages.slice(1,6),s=>s.reward),game.stages[7].finalLetter],['S','V','E','T','L','O']);
assert.equal(game.audio,'assets/Miky.mp3');assert.equal(game.plugyAudio,'assets/Plugy.mp3','current delivered recording');
assert.equal(game.recordings.miky.status,'available');assert.equal(game.recordings.miky.expectedFile,game.audio);assert.equal(game.recordings.plugy.status,'available');assert.equal(game.recordings.plugy.expectedFile,game.plugyAudio);
const names=/(?:piko|pika|pikom|pikov|pikovi|miky|mikym|mikyho|pixi|plugy|plugym|plugyho|pingy|pingym|pingyho|čipk|guardy|guardym|guardyho|kvak|šutk|iskr|lístk|lístok|kubo|kubov|ryšk)/iu;
for(const [id,script] of Object.entries(game.voiceScripts))assert.ok(!names.test(script.prompt),id+': recordable script is independent of character names');
for(const id of ['miky','plugy'])assert.ok(!names.test(game[id+'Message'].join(' ')),id+': transcript matches name-free dubbing');
assert.equal(new URL(game.mikyQr).searchParams.get('signal'),'miky');
assert.equal(new URL(game.plugyQr).searchParams.get('signal'),'plugy');
assert.equal(new URL(game.pingyQr).searchParams.get('signal'),'pingy');
for(const character of game.characters){
 assert.ok(fs.existsSync(character.image));const data=fs.readFileSync(character.image);
 assert.equal(data.subarray(1,4).toString(),'PNG');assert.equal(data[25],6,'production portrait has a real RGBA channel');
}
for(const file of [game.video,game.audio,game.plugyAudio,game.guardyAudio,game.finaleVideo])assert.ok(fs.statSync(file).size>0,'current recording exists');
const obsolete=/(?:Kvak|Šutk|Iskr|Lístok|Lístk|Kubo|Kubov|Ryšk)/u;
for(const file of ['atlas.html','site-content.js','print-materials.js','story-text.js','prep-store.js','admin/src/game-rules.mjs','admin/src/checklist.mjs','admin/public/admin.js'])assert.ok(!obsolete.test(fs.readFileSync(file,'utf8')),file+': no obsolete visible names');
console.log('PASS: seven digital identities, name-free recording scripts, real alpha portraits, new Miky and Plugy recordings, current QR names and delivered media.');
