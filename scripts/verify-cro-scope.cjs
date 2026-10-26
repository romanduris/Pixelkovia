// Verify the CRO task did not change authored content or commercial rules.
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const snapshot=JSON.parse(fs.readFileSync('docs/cro-audit-2026-10-26/protected-snapshot.json','utf8'));
const hash=content=>crypto.createHash('sha256').update(content).digest('hex');
for(const [file,expected] of Object.entries(snapshot.files))assert.equal(hash(fs.readFileSync(file)),expected,file+' must remain unchanged');
const context={window:{}};vm.runInNewContext(fs.readFileSync('site-config.js','utf8'),context);
const config=context.window.SITE_CONFIG;
assert.equal(JSON.stringify({products:config.products,offer:config.offer,access:config.access.mode}),JSON.stringify(snapshot.commercial),'same prices, product statuses, guarantee and access mode');
const faq=fs.readFileSync('sales-page.js','utf8').match(/const faq\s*=\s*\[[\s\S]*?\n  \];/)?.[0];
assert.ok(faq,'FAQ source found');assert.equal(hash(faq),snapshot.faqSourceSha256,'all 19 FAQ answers remain verbatim');
console.log('PASS: '+Object.keys(snapshot.files).length+' protected assets, PDFs, game, portal, administration and checkout logic match baseline SHA-256; commercial rules and all FAQ source unchanged.');
