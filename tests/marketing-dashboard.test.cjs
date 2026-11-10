const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin='https://pixelkovia.rodulab.com';
(async()=>{
 const {fresh}=await import('../admin/tests/support.mjs'),{execute,first}=await import('../admin/src/db.mjs'),{default:worker}=await import('../admin/src/worker.mjs');
 const db=fresh(),env={TQ_DB:db,MARKETING_COLLECTION_ENABLED:'true',ENVIRONMENT:'local',WEB_URL:origin,CUSTOMER_AUTH_SECRET:'a'.repeat(64)};
 await execute(db,'UPDATE marketing_state SET started_at=?',Date.now()-30*86400000);
 const browser=await (process.env.QA_BROWSER==='webkit'?webkit:chromium).launch({headless:process.env.QA_HEADED!=='1',...(process.env.QA_BROWSER==='webkit'?{env:{...process.env,WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS:'1',WEBKIT_DISABLE_COMPOSITING_MODE:'1',WEBKIT_DISABLE_DMABUF_RENDERER:'1',LIBGL_ALWAYS_SOFTWARE:'1',GSK_RENDERER:'cairo',JSC_useJIT:'0'}}:{})});
 const context=await browser.newContext({viewport:{width:1440,height:900},hasTouch:true}),errors=[],events=[],calls=[];let fail=false;
 try{
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());if(url.origin!==origin)return route.abort();
   if(url.pathname.startsWith('/api/')){
    if(url.pathname==='/api/admin/marketing'&&fail)return route.fulfill({status:503,json:{error:'Dočasný výpadok'}});
    if(url.pathname==='/api/admin/marketing')calls.push(url.searchParams.toString());
    if(url.pathname==='/api/marketing/event')events.push(request.postDataJSON());
    const headers={...await request.allHeaders(),origin:'http://127.0.0.1'};
    // WebKit can expose routed headers before attaching its cookie jar.
    if(!headers.cookie)headers.cookie=(await context.cookies(request.url())).map(cookie=>cookie.name+'='+cookie.value).join('; ');
    const response=await worker.fetch(new Request('http://127.0.0.1'+url.pathname+url.search,{method:request.method(),headers,...(['GET','HEAD'].includes(request.method())?{}:{body:request.postData()})}),env);
    return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});
   }
   const file=url.pathname==='/admin'?'admin/public/index.html':url.pathname.startsWith('/admin/')?'admin/public/'+url.pathname.slice(7):url.pathname==='/'?'dist/funnel/index.html':url.pathname==='/checkout'?'dist/funnel/checkout.html':'dist/funnel'+url.pathname;
   if(!fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});
   return route.fulfill({contentType:file.endsWith('.html')?'text/html':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':'application/octet-stream',body:fs.readFileSync(file)});
  });
  const page=await context.newPage();await page.clock.install();page.on('pageerror',e=>errors.push(e.message));
  const ready=()=>page.waitForFunction(()=>document.querySelector('#view')?.getAttribute('aria-busy')==='false');
  await page.goto(origin+'/admin#marketing');await ready();
  assert.equal(await page.locator('[data-page]').count(),3);assert.equal(await page.locator('#page-title').innerText(),'Predajný funnel');
  assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').first().innerText(),'Nedostupné');
  assert.ok(await page.locator('.marketing-empty').isVisible());assert.equal(await page.locator('.marketing-kpis .marketing-kpi').count(),5);assert.equal(await page.locator('.marketing-stages').count(),0);assert.match(await page.locator('.marketing-quality').innerText(),/Čakáme na prvú/);
  assert.equal(await page.locator('#marketing-filter-toggle').getAttribute('aria-expanded'),'false');assert.equal(await page.locator('#marketing-filter-panel').isVisible(),false);
  assert.equal(await page.locator('.marketing-table-wrap tbody tr').count(),9);assert.equal(await page.locator('#marketing-all-sources').count(),0);
  assert.ok(!(await page.locator('.marketing-dashboard').innerText()).includes('420'));
  await page.locator('#marketing-unique').check();assert.match(await page.locator('.marketing-chart-empty').innerText(),/Zatiaľ bez údajov/);assert.equal(await page.locator('.marketing-chart-svg').count(),0);await page.locator('#marketing-unique').uncheck();
  // A fresh visitor is unmeasured until explicit analytics consent; marketing stays off.
  let ids;
  for(const path of ['/?utm_source=facebook&utm_medium=paid_social&utm_campaign=launch-2026','/checkout']){
   const recorded=page.waitForResponse(r=>r.url().includes('/api/marketing/event'));
   await page.goto(origin+path);
   if(!ids){
    await page.locator('.privacy-panel').waitFor({state:'visible'});
    assert.equal(events.length,0);assert.deepEqual(await page.evaluate(()=>window.PixelkoviaMarketing.context()),{});
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('pixelkovia-funnel-session-v1')),null);
    await page.locator('[data-privacy="settings"]').click();
    await page.locator('[name="privacy-analytics"]').check();
    await page.locator('[data-privacy="save"]').click();
   }
   assert.equal((await recorded).status(),200);
   await page.waitForFunction(()=>window.PixelkoviaConsent?.allows('analytics'));
   assert.equal(await page.evaluate(()=>window.PixelkoviaConsent.allows('marketing')),false);
   assert.equal(await page.locator('.privacy-panel').isVisible(),false);
   const current=await page.evaluate(()=>window.PixelkoviaMarketing.context());
   if(ids)assert.deepEqual(current,ids);else ids=current;
   assert.equal(await page.evaluate(()=>localStorage.getItem('pixelkovia-marketing-visitor-v1')),null);
   assert.ok(await page.evaluate(()=>sessionStorage.getItem('pixelkovia-funnel-session-v1')));
   assert.equal(events.at(-1).mode,'session');assert.match(events.at(-1).browserId,/^[a-f0-9-]{36}$/);
   assert.equal(events.at(-1).source,'facebook_ads');assert.equal(events.at(-1).campaign,'launch-2026');
   const refreshed=page.waitForResponse(r=>r.url().includes('/api/marketing/event'));await page.reload();assert.equal((await refreshed).status(),200);
   assert.deepEqual(await page.evaluate(()=>window.PixelkoviaMarketing.context()),ids);
   assert.equal((await first(db,'SELECT count(*) n FROM marketing_visits')).n,1);
   for(const width of [1440,390,320]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  }
  await page.setViewportSize({width:1512,height:1080});
  // A real server-observed paid Session, with no fabricated visits/purchases in UI.
  const at=Date.now();await execute(db,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at,stripe_session_id) VALUES(?,?,?,?,?,?,?)','marketing-browser-fixture','private@example.invalid','Private','["episode-1"]',1499,at,'cs_test_marketingbrowser');
  await execute(db,'INSERT INTO marketing_attribution VALUES(?,?,?)','marketing-browser-fixture',ids.marketingVisitId,at);
  await execute(db,'INSERT INTO payment_observations VALUES(?,?,?,?)','marketing-browser-fixture','paid',at,at);
  await page.goto(origin+'/admin#marketing');await ready();
  assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(0).innerText(),'1');
  assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(1).innerText(),'1');
  assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(3).innerText(),'1');
  assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(4).innerText(),'100 %');
  assert.equal(await page.locator('[data-marketing-period]').count(),5);
  assert.ok(await page.locator('#marketing-charts').evaluate(el=>el.open));
  assert.equal(await page.locator('.marketing-chart-svg').count(),1);
  assert.equal(await page.locator('.marketing-advanced,.marketing-chart-stats,.marketing-chart-data,#marketing-availability,#marketing-methodology,#marketing-units,#marketing-quality-more').count(),0);
  assert.equal(await page.locator('[data-marketing-count]').count(),14);
  assert.equal(await page.locator('[data-marketing-count]').last().textContent(),'1');
  await page.locator('#marketing-unique').check();
  assert.match(await page.locator('.marketing-chart figcaption').innerText(),/Unikátne prehliadače/);
  assert.equal(await page.locator('[data-marketing-count]').last().textContent(),'1');
  const day=page.locator('.marketing-chart-day[tabindex="0"]').first();await day.focus();await page.keyboard.press('End');
  assert.match(await page.locator('.marketing-chart-readout').first().innerText(),/Unikátne prehliadače: 1/);
  await page.locator('#marketing-summary-charts').click();await page.locator('#refresh-marketing').click();await ready();
  assert.equal(await page.locator('#marketing-charts').evaluate(el=>el.open),false);
  await page.reload();await ready();assert.equal(await page.locator('#marketing-charts').evaluate(el=>el.open),false);
  await page.locator('#marketing-summary-charts').click();assert.ok(await page.locator('#marketing-unique').isChecked());
  await page.locator('#marketing-unique').uncheck();
  await page.locator('.marketing-purchase-link').click();await page.waitForURL('**/admin#payments?**');await page.locator('.payment-funnel-scope').waitFor();await ready();
  assert.ok(await page.locator('.payment-funnel-scope').isVisible());assert.equal(await page.locator('.payment-attempt-row').count(),1);
  assert.match(await page.locator('.payment-table-heading').innerText(),/1/);assert.ok(await page.locator('#payment-days').isDisabled());
  await page.reload();await ready();assert.equal(await page.locator('.payment-attempt-row').count(),1);
  await page.getByRole('link',{name:'Späť na funnel'}).click();await page.locator('.marketing-dashboard').waitFor();await ready();
  const row=page.locator('.marketing-table-wrap tbody tr').filter({hasText:'Facebook reklama'});assert.equal(await row.locator('td').nth(2).innerText(),'100 %');
  assert.match(await page.locator('.marketing-health-status').innerText(),/nedostupné/);
  await page.locator('#marketing-kpi-conversion').focus();await page.keyboard.press('Enter');assert.ok(await page.locator('.marketing-kpi[open]').count());assert.match(await page.locator('.marketing-kpi[open]').innerText(),/Nákupy priradené/);
  await page.keyboard.press('Escape');assert.equal(await page.locator('.marketing-kpi[open]').count(),0);
  await page.locator('#marketing-summary-funnel-details').click();await page.locator('#marketing-summary-attribution').focus();await page.keyboard.press('Enter');
  await page.locator('#marketing-period-purchases').check();
  assert.equal(await page.locator('.marketing-table-wrap tbody tr').count(),9);assert.ok(await page.locator('[data-marketing-sort-header=periodPurchases]').isVisible());
  await page.locator('#marketing-sort-label').click();await page.locator('#marketing-sort-label').click();assert.equal(await page.locator('[data-marketing-sort-header=label]').getAttribute('aria-sort'),'ascending');
  await page.locator('#refresh-marketing').click();await ready();
  assert.equal(await page.locator('#marketing-attribution').evaluate(el=>el.open),true);assert.equal(await page.locator('#marketing-funnel-details').evaluate(el=>el.open),true);
  assert.equal(await page.locator('#marketing-period-purchases').isChecked(),true);assert.equal(await page.locator('.marketing-table-wrap tbody tr').count(),9);assert.equal(await page.locator('[data-marketing-sort-header=label]').getAttribute('aria-sort'),'ascending');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'refresh-marketing');
  // Date selection belongs in the toolbar and works with the filters panel closed.
  assert.ok(await page.locator('.marketing-toolbar #marketing-since').isVisible());
  const sinceDate=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit'}).format(Date.now());
  await page.locator('#marketing-since').fill(sinceDate);await page.locator('#marketing-since').blur();await ready();
  assert.match(calls.at(-1),/period=since/);assert.ok(calls.at(-1).includes('from='+sinceDate));assert.ok(!calls.at(-1).includes('to='));
  assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(3).innerText(),'1');
  await page.locator('#marketing-filter-toggle').click();
  await page.locator('[name=source]').selectOption('facebook_ads');await page.locator('[name=campaign]').selectOption('launch-2026');await page.getByRole('button',{name:'Použiť filtre'}).click();await ready();
  await page.reload();await ready();
  assert.equal(await page.locator('#marketing-since').inputValue(),sinceDate);assert.match(calls.at(-1),/period=since/);assert.match(calls.at(-1),/source=facebook_ads/);assert.match(calls.at(-1),/campaign=launch-2026/);
  assert.equal(await page.locator('#marketing-filter-panel').isVisible(),true);assert.equal(await page.locator('#marketing-attribution').evaluate(el=>el.open),true);assert.equal(await page.locator('#marketing-funnel-details').evaluate(el=>el.open),true);
  assert.ok(await page.locator('#marketing-period-purchases').isChecked());assert.equal(await page.locator('[data-marketing-sort-header=label]').getAttribute('aria-sort'),'ascending');
  const cookie=(await context.cookies(origin+'/admin')).find(c=>c.name==='pixelkovia-admin-marketing-layout-v1');
  assert.ok(cookie);assert.equal(cookie.path,'/admin');assert.equal(cookie.secure,true);assert.equal(cookie.sameSite,'Strict');assert.ok(cookie.expires>Date.now()/1000+300*86400);
  const saved=JSON.parse(decodeURIComponent(cookie.value));assert.equal(saved.selected.period,'since');assert.equal(saved.selected.from,sinceDate);assert.equal(saved.selected.to,undefined);assert.ok(!JSON.stringify(saved).includes('private'));assert.ok(cookie.value.length<4096);
  await page.locator('.marketing-purchase-link').click();await page.waitForURL('**/admin#payments?**');await page.locator('.payment-funnel-scope').waitFor();await ready();assert.equal(await page.locator('.payment-attempt-row').count(),1);
  await page.getByRole('link',{name:'Späť na funnel'}).click();await page.locator('.marketing-dashboard').waitFor();await ready();assert.equal(await page.locator('#marketing-since').inputValue(),sinceDate);
  await page.locator('#marketing-since').fill('');await page.locator('#marketing-since').blur();await ready();assert.match(calls.at(-1),/period=14/);assert.match(calls.at(-1),/source=facebook_ads/);
  await page.locator('#marketing-reset').click();await ready();await page.reload();await ready();assert.equal(await page.locator('#marketing-since').inputValue(),'');assert.match(calls.at(-1),/period=14/);
  await page.locator('[name=source]').selectOption('instagram_ads');await page.getByRole('button',{name:'Použiť filtre'}).click();await ready();assert.ok(calls.at(-1).includes('source=instagram_ads'));assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(3).innerText(),'0');
  assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(4).innerText(),'Nedostupné');assert.ok(await page.locator('#marketing-chip-source').isVisible());assert.equal(await page.locator('#marketing-attribution').evaluate(el=>el.open),true);
  await page.locator('#marketing-chip-source').click();await ready();assert.equal(await page.locator('#marketing-chip-source').count(),0);assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(3).innerText(),'1');
  await page.locator('[name=campaign]').selectOption('launch-2026');await page.locator('[name=device]').selectOption('desktop');await page.getByRole('button',{name:'Použiť filtre'}).click();await ready();assert.match(calls.at(-1),/campaign=launch-2026/);assert.match(calls.at(-1),/device=desktop/);
  await page.locator('#marketing-reset').click();await ready();assert.equal(await page.locator('.marketing-filter-chips').count(),0);assert.equal(await page.locator('[data-marketing-period="14"]').getAttribute('aria-pressed'),'true');
  await page.locator('[name=source]').selectOption('');await page.locator('[name=product]').selectOption('game');await page.getByRole('button',{name:'Použiť filtre'}).click();await ready();assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').first().innerText(),'Nedostupné');
  await page.locator('[name=product]').selectOption('');await page.getByRole('button',{name:'Použiť filtre'}).click();await ready();
  await page.locator('#marketing-summary-attribution').click();await page.locator('#marketing-summary-funnel-details').click();
  await page.locator('#marketing-period-purchases').uncheck();await page.locator('#marketing-sort-visits').click();
  for(const period of ['today','7','14','30','90','14']){await page.locator('[data-marketing-period="'+period+'"]').click();await ready();assert.match(calls.at(-1),new RegExp('period='+period));}
  await page.locator('#marketing-filter-toggle').click();
  for(const width of [1440,1920,768,375,320]){
   await page.setViewportSize({width,height:width===1920?1080:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page overflow '+width);
   assert.ok(await page.locator('#marketing-filter-toggle').isVisible());assert.ok(await page.locator('#marketing-since').isVisible());assert.equal(await page.locator('#marketing-filter-panel').isVisible(),false);assert.ok(await page.locator('.marketing-table-wrap').isVisible());
   if(width>=1440){const positions=await page.locator('.marketing-kpis .marketing-kpi').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().top));assert.ok(Math.max(...positions)-Math.min(...positions)<1,'five metrics in one row');assert.ok(await page.locator('#marketing-charts').isVisible(),'charts are placed before source and commercial summaries');}
   if(width<=375){await page.locator('#marketing-filter-toggle').tap();assert.equal(await page.locator('#marketing-filter-panel').isVisible(),true);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'expanded filters have no overflow');await page.locator('[name=device]').focus();await page.keyboard.press('Escape');assert.equal(await page.locator('#marketing-filter-panel').isVisible(),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'marketing-filter-toggle');}
   await page.screenshot({path:'/tmp/pixelkovia-marketing-after-'+width+'-'+(process.env.QA_BROWSER||'chromium')+'.png',fullPage:true});
   if(width===375)await page.screenshot({path:'/tmp/pixelkovia-marketing-mobile-viewport.png'});
  }
  await page.locator('#marketing-filter-toggle').click();await page.locator('[name=period]').selectOption('custom');assert.equal(await page.locator('[name=from]').isEnabled(),true);
  await page.locator('[name=from]').fill('2026-10-01');await page.getByRole('button',{name:'Použiť filtre'}).click();await ready();assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(4).innerText(),'100 %');assert.match(await page.locator('.marketing-period-note').innerText(),/Iba nameraná časť obdobia/);
  // Server-verified fixtures exercise mixed date semantics and ratios above 100%.
  const addPayment=async(id,visit)=>{const time=Date.now();await execute(db,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at,stripe_session_id) VALUES(?,?,?,?,?,?,?)',id,'fixture@example.invalid','Fixture','["episode-1"]',1499,time,'cs_test_'+id);await execute(db,'INSERT INTO payment_observations VALUES(?,?,?,?)',id,'paid',time,time);if(visit)await execute(db,'INSERT INTO marketing_attribution VALUES(?,?,?)',id,visit,time);};
  await addPayment('marketing-unattributed',null);await page.locator('#refresh-marketing').click();await ready();assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(3).innerText(),'2');assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(4).innerText(),'100 %');
  await page.locator('#marketing-period-purchases').check();
  const unknown=page.locator('.marketing-table-wrap tbody tr').filter({hasText:'Ostatné / neznáme'});assert.equal(await unknown.locator('td').last().innerText(),'1');assert.equal(await unknown.locator('td').nth(1).innerText(),'0');
  await addPayment('marketing-second',ids.marketingVisitId);await page.locator('#refresh-marketing').click();await ready();assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(4).innerText(),'200 %');assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(2).innerText(),'3');
  for(const id of ['marketing-unattributed','marketing-second']){await execute(db,'DELETE FROM marketing_attribution WHERE attempt_id=?',id);await execute(db,'DELETE FROM payment_observations WHERE attempt_id=?',id);await execute(db,'DELETE FROM checkout_attempts WHERE id=?',id);}
  await execute(db,'INSERT INTO payment_monitor_checks VALUES(?,?,?)','stripe',0,Date.now());await page.locator('#refresh-marketing').click();await ready();assert.ok(await page.locator('.marketing-health.has-issues').isVisible());assert.match(await page.locator('.marketing-health-status').innerText(),/Vyžaduje pozornosť/);
  await execute(db,'UPDATE payment_monitor_checks SET ok=1,checked_at=?',Date.now()-1900000);await page.locator('#refresh-marketing').click();await ready();assert.match(await page.locator('.marketing-health-status').innerText(),/nedostupné/);
  await execute(db,'INSERT INTO payment_monitor_checks VALUES(?,?,?)','webhook',1,Date.now());await page.locator('#refresh-marketing').click();await ready();assert.match(await page.locator('.marketing-health-status').innerText(),/neaktuálne/);
  await execute(db,'UPDATE payment_monitor_checks SET checked_at=?',Date.now());await page.locator('#refresh-marketing').click();await ready();assert.match(await page.locator('.marketing-health-status').innerText(),/aktuálne/);assert.equal(await page.locator('.marketing-health.has-issues').count(),0);
  await page.clock.fastForward(360001);assert.equal(await page.locator('.marketing-freshness').getAttribute('role'),'alert');assert.match(await page.locator('.marketing-freshness').innerText(),/5 minút/);
  fail=true;await page.getByRole('button',{name:'Obnoviť',exact:true}).click();await ready();assert.ok((await page.locator('#notice').innerText()).includes('Dočasný výpadok'));assert.ok(await page.locator('.topbar').isVisible());fail=false;await page.locator('#retry-marketing').click();await ready();assert.ok(await page.locator('.marketing-dashboard').isVisible());
  env.MARKETING_COLLECTION_ENABLED='false';await page.reload();await ready();
  assert.match(await page.locator('.marketing-quality').innerText(),/vypnutý/);
  assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(4).innerText(),'Nedostupné');
  assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').nth(3).innerText(),'1');
  const blocked=await page.evaluate(async()=>{const r=await fetch('/api/marketing/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'session',type:'visit',visitId:crypto.randomUUID(),visitorId:crypto.randomUUID()})});return r.status;});
  assert.equal(blocked,410);assert.equal((await first(db,'SELECT count(*) n FROM marketing_visits')).n,1);
  for(const view of ['payments','analytics']){await page.locator('[data-page='+view+']').click();await page.waitForFunction(view=>document.querySelector('#page-title').textContent===({payments:'Platby a chyby',analytics:'Herná analýza'})[view],view);await ready();assert.equal(await page.locator('body.marketing-view').count(),0);assert.ok(await page.locator('.topbar').isVisible());assert.equal(await page.locator('.marketing-dashboard').count(),0);assert.equal(await page.locator('#notice').innerText(),'');}
  await page.locator('[data-page=marketing]').click();await page.waitForFunction(()=>document.body.classList.contains('marketing-view'));await ready();assert.equal(await page.locator('body.marketing-view').count(),1);
  env.MARKETING_COLLECTION_ENABLED='true';
  // An expired session receives new session IDs but keeps its consented browser ID;
  const originalBrowser=events.find(event=>event.browserId).browserId;
  // storage failure does not break the page.
  await page.evaluate(()=>{const key='pixelkovia-funnel-session-v1',v=JSON.parse(sessionStorage.getItem(key));v.lastAt=Date.now()-1800001;sessionStorage.setItem(key,JSON.stringify(v));});
  const renewed=page.waitForResponse(r=>r.url().includes('/api/marketing/event'));await page.goto(origin+'/');assert.equal((await renewed).status(),200);
  assert.notDeepEqual(await page.evaluate(()=>window.PixelkoviaMarketing.context()),ids);assert.equal(events.at(-1).browserId,originalBrowser);assert.equal((await first(db,'SELECT count(*) n FROM marketing_visits')).n,2);
  const secondTab=await context.newPage();const secondVisit=secondTab.waitForResponse(r=>r.url().includes('/api/marketing/event'));
  await secondTab.goto(origin+'/');await secondVisit;assert.equal(events.at(-1).browserId,originalBrowser);await secondTab.close();
  await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Unavailable','SecurityError');};});
  const count=events.length;await page.goto(origin+'/checkout');assert.deepEqual(await page.evaluate(()=>window.PixelkoviaMarketing.context()),{});assert.equal(events.length,count);
  assert.ok(await page.locator('main').isVisible());
  assert.deepEqual(errors,[]);
  console.log('PASS marketing: real API/D1 aggregation, unavailable data, explicit analytics consent and server cookie validation, refresh/checkout deduplication, disabled collection switch, UTM and verified payments, cohort versus period payments, uncapped 200% conversion, filter chips/reset/quick/custom/since dates, admin-scoped cookie preferences and reload restoration, keyboard disclosures and state restoration, sorting and permanently expanded source list, period-payment column, unified five-metric overview and independent period attempts, missing/stale/failed checks, five-minute warning, error state, 320–1920px ('+(process.env.QA_BROWSER||'chromium')+').');
 }finally{await context.close();await browser.close();db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
