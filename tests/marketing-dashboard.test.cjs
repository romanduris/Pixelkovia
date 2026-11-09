const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin='https://pixelkovia.rodulab.com';
(async()=>{
 const {fresh}=await import('../admin/tests/support.mjs'),{execute,first}=await import('../admin/src/db.mjs'),{default:worker}=await import('../admin/src/worker.mjs');
 const {marketingEvent}=await import('../admin/src/marketing.mjs');
 const db=fresh(),env={TQ_DB:db,MARKETING_COLLECTION_ENABLED:'true',ENVIRONMENT:'local',WEB_URL:origin,CUSTOMER_AUTH_SECRET:'a'.repeat(64)};
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
  await context.addInitScript(()=>localStorage.setItem('pixelkovia-analytics-consent-v1',JSON.stringify({allowed:true,at:Date.now()})));
  for(const path of ['/?utm_source=facebook&utm_medium=paid_social&utm_campaign=launch-2026','/checkout']){
   await page.goto(origin+path);assert.equal(await page.locator('.analytics-consent,.analytics-consent-panel,.analytics-consent-settings').count(),0);
   assert.equal(await page.evaluate(()=>typeof window.PixelkoviaMarketing),'undefined');assert.equal(events.length,0);
   assert.equal(await page.evaluate(()=>localStorage.getItem('pixelkovia-marketing-visitor-v1')),null);
   for(const width of [1440,390,320]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'/tmp/pixelkovia-no-consent-'+(path.startsWith('/checkout')?'checkout':'sales')+'-'+width+'.png'});}
  }
  await page.setViewportSize({width:1512,height:1080});
  // Preserved historical observations, seeded only in the isolated test D1.
  const ids={marketingVisitId:crypto.randomUUID()},visitorId=crypto.randomUUID();
  await marketingEvent(new Request(origin+'/api/marketing/event',{method:'POST'}),env,{consent:true,type:'checkout',visitId:ids.marketingVisitId,visitorId,source:'facebook_ads',campaign:'launch-2026',device:'mobile'},Date.now()-1000);
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
  env.MARKETING_COLLECTION_ENABLED='false';await page.reload();await ready();
  assert.match(await page.locator('.marketing-quality>strong').innerText(),/vypnutý/);
  assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(3).innerText(),'Nedostupné');
  assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(2).innerText(),'1');
  const blocked=await page.evaluate(async()=>{const r=await fetch('/api/marketing/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({consent:true,type:'visit',visitId:crypto.randomUUID(),visitorId:crypto.randomUUID()})});return r.status;});
  assert.equal(blocked,410);assert.equal((await first(db,'SELECT count(*) n FROM marketing_visits')).n,1);
  assert.deepEqual(errors,[]);
  console.log('PASS marketing: real API/D1 aggregation, unavailable data, removed consent UI and collector even with old opt-in, disabled cached collection, preserved historical UTM and payments, cohort conversion, filters, date range, error state, 320–1512px ('+(process.env.QA_BROWSER||'chromium')+').');
 }finally{await context.close();await browser.close();db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
