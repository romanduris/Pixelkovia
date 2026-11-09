const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin='https://pixelkovia.rodulab.com';
(async()=>{
 const {fresh}=await import('../admin/tests/support.mjs'),{execute,first}=await import('../admin/src/db.mjs'),{default:worker}=await import('../admin/src/worker.mjs');
 const db=fresh(),env={TQ_DB:db,ENVIRONMENT:'local',WEB_URL:origin,CUSTOMER_AUTH_SECRET:'a'.repeat(64)};
 await execute(db,'UPDATE marketing_state SET started_at=?',Date.now()-30*86400000);
 const browser=await (process.env.QA_BROWSER==='webkit'?webkit:chromium).launch({headless:process.env.QA_HEADED!=='1',...(process.env.QA_BROWSER==='webkit'?{env:{...process.env,WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS:'1',WEBKIT_DISABLE_COMPOSITING_MODE:'1',WEBKIT_DISABLE_DMABUF_RENDERER:'1',LIBGL_ALWAYS_SOFTWARE:'1',GSK_RENDERER:'cairo',JSC_useJIT:'0'}}:{})});
 const context=await browser.newContext({viewport:{width:1512,height:1080}}),errors=[],events=[],calls=[];let fail=false;
 try{
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());if(url.origin!==origin)return route.abort();
   if(url.pathname.startsWith('/api/')){
    if(url.pathname==='/api/admin/marketing'&&fail)return route.fulfill({status:503,json:{error:'Dočasný výpadok'}});
    if(url.pathname==='/api/admin/marketing')calls.push(url.searchParams.toString());
    if(url.pathname==='/api/marketing/event')events.push(request.postDataJSON());
    const headers={...request.headers(),origin:'http://127.0.0.1'};
    const response=await worker.fetch(new Request('http://127.0.0.1'+url.pathname+url.search,{method:request.method(),headers,...(['GET','HEAD'].includes(request.method())?{}:{body:request.postData()})}),env);
    return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});
   }
   const file=url.pathname==='/admin'?'admin/public/index.html':url.pathname.startsWith('/admin/')?'admin/public/'+url.pathname.slice(7):url.pathname==='/'?'dist/funnel/index.html':url.pathname==='/checkout'?'dist/funnel/checkout.html':'dist/funnel'+url.pathname;
   if(!fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});
   return route.fulfill({contentType:file.endsWith('.html')?'text/html':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':'application/octet-stream',body:fs.readFileSync(file)});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const ready=()=>page.waitForFunction(()=>document.querySelector('#view')?.getAttribute('aria-busy')==='false');
  await page.goto(origin+'/admin#marketing');await ready();
  assert.equal(await page.locator('[data-page]').count(),3);assert.equal(await page.locator('#page-title').innerText(),'Predajný funnel');
  assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').first().innerText(),'Nedostupné');
  assert.ok(await page.locator('.marketing-empty').isVisible());assert.equal(await page.locator('.marketing-stages').count(),0);
  assert.ok(await page.locator('.marketing-kpis').evaluate(el=>el.getBoundingClientRect().top<document.querySelector('#marketing-filters').getBoundingClientRect().top),'KPIs precede the filters');
  assert.equal(await page.locator('.marketing-table-wrap tbody tr').count(),9);
  assert.ok(!(await page.locator('.marketing-dashboard').innerText()).includes('420'));
  await page.goto(origin+'/?utm_source=facebook&utm_medium=paid_social&utm_campaign=launch-2026');
  assert.equal(events.length,0);assert.equal(await page.evaluate(()=>localStorage.getItem('pixelkovia-marketing-visitor-v1')),null);
  for(const [width,height] of [[1440,900],[390,844],[320,568]]){
   await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));
   for(const choice of ['yes','no']){const box=await page.locator(`[data-choice=${choice}]`).boundingBox();assert.ok(box&&box.y>=0&&box.y+box.height<=height&&box.x>=0&&box.x+box.width<=width,'consent choice visible without scrolling at '+width);}
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'consent fits '+width);
   await page.screenshot({path:'/tmp/pixelkovia-consent-visible-'+width+'.png'});
  }
  await page.setViewportSize({width:1512,height:1080});
  await page.locator('[data-choice=no]').click();await page.reload();assert.equal(events.length,0);
  await page.locator('.analytics-consent-settings').click();const granted=page.waitForResponse(r=>r.url().includes('/api/marketing/event'));await page.locator('[data-choice=yes]').click();
  await granted;
  assert.equal(events.length,1);assert.equal(events[0].source,'facebook_ads');
  const ids=await page.evaluate(()=>window.PixelkoviaMarketing.context());assert.ok(ids.marketingVisitId);
  const reloaded=page.waitForResponse(r=>r.url().includes('/api/marketing/event'));await page.reload();await reloaded;
  assert.equal((await first(db,'SELECT count(*) n FROM marketing_visits')).n,1);
  const checkout=page.waitForResponse(r=>r.url().includes('/api/marketing/event'));await page.goto(origin+'/checkout');
  await page.waitForFunction(()=>!!window.PixelkoviaMarketing);await checkout;
  assert.equal((await first(db,'SELECT count(*) n FROM marketing_visits WHERE checkout_at IS NOT NULL')).n,1);
  assert.deepEqual(await page.evaluate(()=>window.PixelkoviaMarketing.context()),ids);
  // A real server-observed paid Session, with no fabricated visits/purchases in UI.
  const at=Date.now();await execute(db,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at,stripe_session_id) VALUES(?,?,?,?,?,?,?)','marketing-browser-fixture','private@example.invalid','Private','["episode-1"]',1499,at,'cs_test_marketingbrowser');
  await execute(db,'INSERT INTO marketing_attribution VALUES(?,?,?)','marketing-browser-fixture',ids.marketingVisitId,at);
  await execute(db,'INSERT INTO payment_observations VALUES(?,?,?,?)','marketing-browser-fixture','paid',at,at);
  await page.goto(origin+'/admin#marketing');await ready();
  assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(0).innerText(),'1');
  assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(1).innerText(),'1');
  assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(2).innerText(),'1');
  assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(3).innerText(),'100 %');
  const row=page.locator('.marketing-table-wrap tbody tr').filter({hasText:'Facebook reklama'});assert.equal(await row.locator('td').nth(2).innerText(),'100 %');
  await page.locator('[name=source]').selectOption('instagram_ads');await page.getByRole('button',{name:'Použiť filtre'}).click();await ready();assert.ok(calls.at(-1).includes('source=instagram_ads'));assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(2).innerText(),'0');
  await page.locator('[name=source]').selectOption('');await page.locator('[name=product]').selectOption('game');await page.getByRole('button',{name:'Použiť filtre'}).click();await ready();assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').first().innerText(),'Nedostupné');
  await page.locator('[name=product]').selectOption('');await page.getByRole('button',{name:'Použiť filtre'}).click();await ready();
  for(const width of [1512,1024,768,390,320]){
   await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page overflow '+width);
   assert.ok(await page.locator('#marketing-filters').isVisible());assert.ok(await page.locator('.marketing-table-wrap').isVisible());
   await page.screenshot({path:'/tmp/pixelkovia-marketing-'+width+'-'+(process.env.QA_BROWSER||'chromium')+'.png',fullPage:true});
   if(width===390)await page.screenshot({path:'/tmp/pixelkovia-marketing-mobile-viewport.png'});
  }
  await page.locator('[name=period]').selectOption('custom');assert.equal(await page.locator('[name=from]').isEnabled(),true);
  await page.locator('[name=from]').fill('2026-10-01');await page.getByRole('button',{name:'Použiť filtre'}).click();await ready();assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(3).innerText(),'100 %');assert.match(await page.locator('.marketing-kpis .marketing-kpi').nth(3).innerText(),/Iba nameraná časť obdobia/);
  fail=true;await page.getByRole('button',{name:'Obnoviť',exact:true}).click();await ready();assert.ok((await page.locator('#notice').innerText()).includes('Dočasný výpadok'));fail=false;
  await page.goto(origin+'/checkout');await page.waitForFunction(()=>!!window.PixelkoviaMarketing);
  await page.locator('.analytics-consent-settings').click();await page.locator('[data-choice=no]').click();
  const before=events.length;assert.deepEqual(await page.evaluate(()=>window.PixelkoviaMarketing.context()),{});await page.reload();assert.equal(events.length,before);assert.equal(await page.evaluate(()=>localStorage.getItem('pixelkovia-marketing-visit-v1')),null);
  assert.deepEqual(errors,[]);
  console.log('PASS marketing: real API/D1 aggregation, unavailable data, consent/reject/revoke, refresh dedupe, UTM and checkout linkage, cohort conversion, filters, date range, error state, 320–1512px ('+(process.env.QA_BROWSER||'chromium')+').');
 }finally{await context.close();await browser.close();db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
