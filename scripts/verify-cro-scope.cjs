// Verify the CRO task did not change authored content or commercial rules.
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const snapshot=JSON.parse(fs.readFileSync('docs/cro-audit-2026-10-26/protected-snapshot.json','utf8'));
const hash=content=>crypto.createHash('sha256').update(content).digest('hex');
// The authorized reading toggle adds only these five head resources to atlas.html.
// Strip those exact includes before comparing the original book bytes. No story,
// encyclopedia entry, image, layout markup or original stylesheet may change.
const atlasResources=[
  '  <link rel="stylesheet" href="atlas-reading.css">\n',
  '  <script src="atlas-reading.js"></script>\n',
  '  <link rel="icon" type="image/png" sizes="32x32" href="assets/brand/piko-32.png">\n',
  '  <link rel="icon" type="image/png" sizes="192x192" href="assets/brand/piko-192.png">\n',
  '  <link rel="apple-touch-icon" sizes="180x180" href="assets/brand/piko-180.png">\n'
];
for(const [file,expected] of Object.entries(snapshot.files)){
 let bytes=fs.readFileSync(file);
 if(file==='atlas.html'){
  let html=bytes.toString();
  for(const resource of atlasResources){assert.equal(html.split(resource).length,2,'one authorized atlas resource');html=html.replace(resource,'');}
  bytes=Buffer.from(html);
 }
 assert.equal(hash(bytes),expected,file+' authored content must remain unchanged');
}
const context={window:{}};vm.runInNewContext(fs.readFileSync('site-config.js','utf8'),context);
const config=context.window.SITE_CONFIG;
assert.equal(JSON.stringify({products:config.products,offer:config.offer,access:config.access.mode}),JSON.stringify(snapshot.commercial),'same prices, product statuses, guarantee and access mode');
const faq=fs.readFileSync('sales-page.js','utf8').match(/const faq\s*=\s*\[[\s\S]*?\n  \];/)?.[0];
assert.ok(faq,'FAQ source found');assert.equal(hash(faq),snapshot.faqSourceSha256,'all 19 FAQ answers remain verbatim');
console.log('PASS: '+Object.keys(snapshot.files).length+' protected assets and authored book content, PDFs, game, portal, administration and checkout logic match baseline SHA-256; commercial rules and all FAQ source unchanged.');
