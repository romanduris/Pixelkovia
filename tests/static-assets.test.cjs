const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const inventory=JSON.parse(fs.readFileSync('dist/deployment-inventory.json','utf8')),root='dist/funnel';
const routes=JSON.parse(fs.readFileSync(root+'/_routes.json','utf8'));assert.deepEqual(routes.include,['/*']);assert.deepEqual(routes.exclude,[]);
let versioned=0;
for(const route of inventory.public){
 assert.ok(fs.existsSync(path.join(root,route)),route);
 if(!route.endsWith('.html'))continue;
 for(const [,url]of fs.readFileSync(path.join(root,route),'utf8').matchAll(/\b(?:src|href)="([^\"]+)"/g)){
  const file=url.split(/[?#]/)[0];if(!/^[\w.-]+\.(?:js|css)$/.test(file))continue;
  const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex').slice(0,12);assert.equal(url,file+'?v='+hash);versioned++;
 }
}
assert.ok(versioned>25);
for(const [route,file]of Object.entries(inventory.protected)){assert.ok(!inventory.public.includes(route));assert.ok(fs.existsSync(path.join(root,'_protected',file.file)));assert.ok(['game','run','admin','customer','book-before','book-after'].includes(file.role));}
for(const file of ['app.js','game-data.js','cipko-game.js','game-bridge.js'])assert.equal(fs.readFileSync(path.join(root,'_protected',file),'utf8'),fs.readFileSync(file,'utf8'));
for(const file of ['parent.html','game.html','storyboard.html','game-data.js','assets/printables/vsetky-materialy.pdf'])assert.ok(!fs.existsSync(path.join(root,file)));
assert.ok(fs.existsSync(root+'/_worker.js'));
console.log('PASS: exact current assets, versioned public resources, explicit roles and mandatory Worker boundary.');
