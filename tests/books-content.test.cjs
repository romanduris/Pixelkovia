const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),vm=require('node:vm');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');const manifest=require('../docs/books/content-integrity.json');
for(const key of ['before','after']){
 const bytes=fs.readFileSync('books-content/'+key+'.json');assert.equal(hash(bytes),manifest.books[key].contentSha256,'unaltered full authored text');const b=JSON.parse(bytes);
 assert.equal(b.stories.length,3);assert.deepEqual(b.stories.map(s=>s.paragraphs.length),manifest.books[key].paragraphs);
 assert.ok(b.intro.length>=2);assert.ok(b.stories.every(s=>s.paragraphs.length>=15));
 for(const s of b.stories)assert(!/741296|5817264|\bSVETLO\b|signal=|QR kód|nájdite.*(?:gauč|chladničk)/.test(s.paragraphs.join(' ')),'no actual puzzle instructions/answers');
 const publicHtml=fs.readFileSync('dist/funnel/book-'+key+'-sample.html','utf8');
 for(const s of b.stories)for(const p of s.paragraphs.slice(2))assert.ok(!publicHtml.includes(p),'sample is not the full story');
 assert.ok(!fs.existsSync('dist/funnel/book-'+key+'.html'));for(let i=1;i<=3;i++)assert.ok(!fs.existsSync(`dist/funnel/assets/books/${key}-${i}.webp`));
}
assert.equal(hash(fs.readFileSync('books-content/atlas.json')),manifest.atlas.contentSha256);assert.equal(require('../books-content/atlas.json').profiles.length,7);
const c={window:{}};vm.runInNewContext(fs.readFileSync('site-config.js','utf8'),c);const cfg=c.window.SITE_CONFIG;
assert.equal(cfg.offer.paymentsEnabled,false);assert.equal(cfg.product('episode-1').priceCents,1499);
for(const id of cfg.offer.bookIds){assert.equal(cfg.product(id).priceCents,499);assert.equal(cfg.product(id).pricing.status,'draft');assert.equal(cfg.product(id).pricing.campaign,null);assert.equal(cfg.quote([],id).totalCents,499);assert.equal(cfg.quote(['episode-1',id],id).totalCents,499);}
assert.equal(cfg.quote(cfg.offer.bookIds).totalCents,1999);assert.equal(cfg.quote(['story-book-after'],'story-book-before').totalCents,998);
for(let mask=0;mask<4;mask++){
 const ids=cfg.offer.bookIds.filter((_,i)=>mask&(1<<i)),q=cfg.quote(ids);
 assert.equal(q.totalCents,[1499,1998,1998,1999][mask]);assert.equal(q.bundleDiscountCents,mask===3?498:0);
 assert.equal(cfg.quote([...ids,...ids,'bad-id']).totalCents,q.totalCents,'duplicates and unknown IDs do not affect the quote');
}
assert.equal(cfg.product(cfg.offer.atlasId).priceCents,299);assert.equal(cfg.product('episode-1').pricing.plannedStandardPriceCents,2999);
for(const file of ['books-content','books-preview.html','game-data.js','app.js','assets/printables/vsetky-materialy.pdf'])assert(!fs.existsSync('dist/funnel/'+file));
console.log('PASS: complete 3+3 author texts, 7 Atlas profiles, draft independent SKUs, all four Early Bird combinations and public artifact boundary.');
