// Identity, localization and compatibility contracts for the content migration.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const context={window:{}};vm.runInNewContext(fs.readFileSync('game-data.js','utf8'),context);const game=context.window.GAME;
assert.deepEqual(Array.from(game.characters,c=>c.name),['Piko','Miky','Pixi','Plugy','Pingy','Čipko','Guardy']);
assert.deepEqual(Array.from(game.stages.slice(1,7),s=>s.reward),['S','V','E','T','L','O']);
assert.equal(game.audio,null);assert.equal(game.plugyAudio,null,'do not present archival recordings as new voices');
for(const id of ['miky','plugy'])assert.equal(game.recordings[id].status,'pending');
const names=/(?:piko|pika|pikom|pikov|pikovi|miky|mikym|mikyho|pixi|plugy|plugym|plugyho|pingy|pingym|pingyho|čipk|guardy|guardym|guardyho|kvak|šutk|iskr|lístk|lístok|kubo|kubov|ryšk)/iu;
for(const [id,script] of Object.entries(game.voiceScripts))assert.ok(!names.test(script.prompt),id+': recordable script is independent of character names');
for(const id of ['miky','plugy'])assert.ok(!names.test(game[id+'Message'].join(' ')),id+': transcript matches name-free dubbing');
assert.equal(new URL(game.mikyQr).searchParams.get('signal'),'kvak');
assert.equal(new URL(game.plugyQr).searchParams.get('signal'),'sutko');
assert.equal(new URL(game.pingyQr).searchParams.get('signal'),'listok');
for(const character of game.characters){
 assert.ok(fs.existsSync(character.image));const data=fs.readFileSync(character.image);
 assert.equal(data.subarray(1,4).toString(),'PNG');assert.equal(data[25],6,'production portrait has a real RGBA channel');
}
for(const [file,hash] of [
 ['assets/PicoVideo.mp4','07a6bf66189f7679c027e78e02a2c9f1407ffbd30af38c9d309f90580b2feb78'],
 ['assets/KvakMessage.mp3','6bb3f4ce28be7a95cb0090255bd661777e971af13e55204a356540d60742ba13'],
 ['assets/Sutko.mp3','83b957ccc902ed7c377189fd671417c0512d8d8788f1d24e426ab56b1428dcf8']
])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file+': original media bytes are preserved');
const obsolete=/(?:Kvak|Šutk|Iskr|Lístok|Lístk|Kubo|Kubov|Ryšk)/u;
for(const file of ['atlas.html','site-content.js','print-materials.js','story-text.js','prep-store.js','admin/src/game-rules.mjs','admin/src/checklist.mjs','admin/public/admin.js'])assert.ok(!obsolete.test(fs.readFileSync(file,'utf8')),file+': no obsolete visible names');
console.log('PASS: seven digital identities, name-free recording scripts, real alpha portraits, pending dubbing, unchanged QR payloads and byte-identical original media.');
