const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8083';
(async()=>{const browser=await chromium.launch();try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE+'/parent.html');
  assert.equal(await page.locator('[data-check]').count(),14);
  const start=page.locator('[data-action=start]');assert.ok(await start.isDisabled());
  assert.deepEqual(await page.locator('[data-library-book]').evaluateAll(cards=>cards.map(c=>c.dataset.libraryBook)),['story-book-before','story-book-after']);
  assert.equal(await page.locator('#kniznica a[href="atlas.html"]').count(),1);
  assert.equal(await page.locator('.bundle-card').count(),0);
  for(const id of ['p1','p2','p3','p4','p5','p6','p7','rodicovsky-navod','diplom','vsetky-materialy']){
   const response=await page.request.get(BASE+`/assets/printables/${id}.pdf`);assert.equal(response.status(),200);assert.equal((await response.body()).subarray(0,5).toString(),'%PDF-');
  }
  for(const checkbox of await page.locator('[data-check]:not([data-check="device-understood"])').all())await checkbox.check();
  assert.ok(await start.isDisabled());await page.locator('[data-check="device-understood"]').check();assert.ok(await start.isEnabled());
  await page.reload();assert.equal(await page.locator('[data-check]:checked').count(),14);assert.ok(await start.isEnabled());
  await page.locator('[data-check="bathroom"]').uncheck();assert.ok(await start.isDisabled());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS: current parent preparation, 14 required confirmations, saved checks, three current products and ten downloadable PDFs.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exit(1)});
