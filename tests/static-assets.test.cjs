const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
let count=0;
for(const name of fs.readdirSync('dist').filter(name=>name.endsWith('.html'))){
 const html=fs.readFileSync(path.join('dist',name),'utf8');
 for(const [,url] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)){
  const pathname=url.split(/[?#]/)[0];
  if(!/^[\w.-]+\.(js|css)$/.test(pathname))continue;
  const content=fs.readFileSync(path.join('dist',pathname));
  const version=crypto.createHash('sha256').update(content).digest('hex').slice(0,12);
  assert.equal(url,pathname+'?v='+version,name+': local resources match their current content');count++;
 }
}
assert.ok(count>30);
const player=fs.readFileSync('dist/game.html','utf8');
for(const file of ['app','game-data','cipko-game'])assert.match(player,new RegExp(file+'\\.js\\?v=[a-f0-9]{12}'));
assert.match(fs.readFileSync('dist/game-data.js','utf8'),/"plugyAudio": "assets\/Plugy.mp3"/);
assert.ok(!fs.readFileSync('dist/cipko-game.js','utf8').includes('na papieri P5'));
console.log('PASS: '+count+' published script/style URLs match their exact current content, including Plugy audio configuration and player code.');
