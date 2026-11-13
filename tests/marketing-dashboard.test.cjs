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
  await page.goto(origin+'/admin');await ready();
  assert.equal(await page.locator('[data-page]').count(),3);assert.equal(await page.locator('#page-title').innerText(),'Predajný funnel');
  assert.equal(await page.locator('[data-page]').first().getAttribute('data-page'),'marketing','funnel is the first navigation item and the default view');
  assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').first().innerText(),'Nedostupné');
  assert.ok(await page.locator('.marketing-empty').isVisible());assert.equal(await page.locator('.marketing-kpis .marketing-kpi').count(),7);assert.equal(await page.locator('.marketing-stages').count(),0);assert.match(await page.locator('.marketing-quality').textContent(),/Čakáme na prvú/);
  assert.equal(await page.locator('#marketing-filter-toggle').getAttribute('aria-expanded'),'false');assert.equal(await page.locator('#marketing-filter-panel').isVisible(),false);
  assert.equal(await page.locator('.marketing-table-wrap tbody tr:visible').count(),3);assert.equal(await page.locator('#marketing-all-sources').count(),0);
  assert.ok(!(await page.locator('.marketing-dashboard').innerText()).includes('420'));
  assert.equal(await page.locator('.marketing-source-segment').count(),0,'no colored funnel for missing or zero data');
  await page.locator('.marketing-quality>summary').click();assert.ok(await page.locator('.marketing-period-note').isVisible());await page.keyboard.press('Escape');assert.equal(await page.locator('.marketing-period-note').isVisible(),false);
  await page.locator('#marketing-unique').check();assert.match(await page.locator('.marketing-chart-empty').innerText(),/Zatiaľ bez údajov/);assert.equal(await page.locator('.marketing-chart-svg').count(),0);await page.locator('#marketing-unique').uncheck();
  // The studio has independent anonymous daily totals, with no source groups.
  const {localDate}=await import('../admin/src/marketing-query.mjs'),studioAt=Date.now();
  await execute(db,'UPDATE studio_traffic_state SET started_at=?',studioAt-3*86400000);
  for(const [time,count]of [[studioAt-86400000,3],[studioAt,7]])await execute(db,'INSERT INTO studio_traffic_daily VALUES(?,?)',localDate(time),count);
  await page.locator('#refresh-marketing').click();await ready();
  await page.locator('#marketing-summary-charts').click();assert.equal(await page.locator('#marketing-charts').evaluate(el=>el.open),false);
  await page.locator('[data-traffic-site="rodulab"]').click();
  assert.ok(await page.locator('#marketing-charts').evaluate(el=>el.open),'switch opens the graph');
  assert.equal(await page.locator('#marketing-unique').isVisible(),false);
  assert.equal(await page.locator('[data-marketing-count]').textContent(),'7');
  assert.equal(await page.locator('[data-marketing-studio-total]').textContent(),'10');
  assert.equal(await page.locator('.marketing-title h1').textContent(),'Návštevnosť rodulab.com');
  for(const selector of ['.marketing-funnel','.marketing-overview-grid','.marketing-quality','#marketing-filter-toggle','#marketing-filter-panel'])assert.equal(await page.locator(selector).isVisible(),false,'studio hides Pixelkovia '+selector);
  assert.match(await page.locator('.marketing-studio-summary').textContent(),/Iba úvodná stránka rodulab.com/);
  assert.match(await page.locator('.marketing-studio-note').textContent(),/mená ani jednotlivé návštevy sa neukladajú/);
  assert.equal(await page.locator('.marketing-chart-legend').count(),0);
  assert.equal(await page.locator('.chart-source-studio').count(),2);
  await page.locator('[data-chart-step="-1"]').click();assert.equal(await page.locator('[data-marketing-count]').textContent(),'3');
  await page.locator('[data-chart-step="1"]').click();
  await page.reload();await ready();assert.equal(await page.locator('[data-traffic-site="rodulab"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-marketing-count]').textContent(),'7');
  assert.equal(await page.locator('.marketing-funnel').isVisible(),false,'studio isolation survives reload');
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.locator('.marketing-dashboard').screenshot({path:'/tmp/rodulab-daily-chart-'+width+'.png'});
  }
  await page.setViewportSize({width:1440,height:900});await page.locator('[data-traffic-site="pixelkovia"]').click();
  assert.equal(await page.locator('.marketing-funnel').isVisible(),true);
  assert.equal(await page.locator('.marketing-overview-grid').isVisible(),true);
  assert.equal(await page.locator('.marketing-title h1').textContent(),'Predajný funnel');
  assert.equal(await page.locator('[data-marketing-studio-total]').count(),0);
  assert.ok(await page.locator('#marketing-unique').isVisible());assert.equal(await page.locator('.marketing-chart-empty').count(),1);
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
  assert.equal((await first(db,'SELECT count(*) n FROM marketing_checkout_opens')).n,2);
  await page.setViewportSize({width:1512,height:1080});
  // A real server-observed paid Session, with no fabricated visits/purchases in UI.
  const at=Date.now();await execute(db,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at,stripe_session_id) VALUES(?,?,?,?,?,?,?)','marketing-browser-fixture','private@example.invalid','Private','["episode-1"]',1499,at,'cs_test_marketingbrowser');
  await execute(db,'INSERT INTO marketing_attribution VALUES(?,?,?)','marketing-browser-fixture',ids.marketingVisitId,at);
  await execute(db,'INSERT INTO payment_observations VALUES(?,?,?,?)','marketing-browser-fixture','paid',at,at);
  await page.goto(origin+'/admin#marketing');await ready();
  assert.equal(await page.locator('#marketing-kpi-visits strong').innerText(),'1');
  assert.equal(await page.locator('#marketing-kpi-checkout strong').innerText(),'2');
  assert.equal(await page.locator('#marketing-kpi-purchases strong').innerText(),'1');
  assert.equal(await page.locator('#marketing-kpi-conversion strong').innerText(),'100 %');
  assert.deepEqual(await page.locator('.marketing-kpi-label').evaluateAll(els=>els.map(el=>el.firstChild.textContent)),['Zobrazenia','Stránka','Checkout','Nákupy','Konverzia','Tržby','Zisk']);
  assert.match(await page.locator('[data-marketing-detail="kpi-checkout"] .marketing-step-detail').textContent(),/Platobné pokusy: 1/);
  assert.match(await page.locator('#marketing-kpi-revenue strong').innerText(),/15,0/);
  assert.match(await page.locator('#marketing-kpi-revenue small').innerText(),/Reklama: Nedostupné/);
  assert.equal(await page.locator('#marketing-kpi-profit strong').innerText(),'Nedostupné');
  await page.locator('#marketing-overview-unique').check();
  assert.equal(await page.locator('#marketing-kpi-checkout strong').innerText(),'1');
  assert.equal(await page.locator('#marketing-unique').isChecked(),false,'overview toggle is independent of the chart');
  await page.reload();await ready();assert.ok(await page.locator('#marketing-overview-unique').isChecked());
  assert.equal(await page.locator('#marketing-kpi-checkout strong').innerText(),'1');
  await page.locator('#marketing-overview-unique').uncheck();
  assert.equal(await page.locator('#marketing-kpi-checkout strong').innerText(),'2');
  assert.equal(await page.locator('[data-marketing-period]').count(),5);
  assert.ok(await page.locator('#marketing-charts').evaluate(el=>el.open));
  assert.equal(await page.locator('.marketing-chart-svg').count(),1);
  assert.deepEqual(await page.locator('.marketing-chart-legend li>span').allTextContents(),['Facebook','Instagram','Others']);
  // Mixed sources exercise all three stacks with actual report aggregation and day readouts.
  const chartFixtures=[];
  for(const source of ['facebook','instagram_ads','instagram','meta','direct','unknown','organic','influencer']){
    const id=crypto.randomUUID();chartFixtures.push(id);const time=Date.now();
    await execute(db,'INSERT INTO marketing_visits VALUES(?,?,?,?,?,?,?,?,?)',id,'chart-'+id,source,'chart-fixture','mobile',time,null,time,'browser-'+id);
  }
  await page.locator('#refresh-marketing').click();await ready();
  const latestDay=page.locator('.marketing-chart-day').last();
  assert.deepEqual(await latestDay.locator('.chart-bar').evaluateAll(els=>els.map(el=>el.getAttribute('class'))),['chart-bar chart-source-facebook','chart-bar chart-source-instagram','chart-bar chart-source-other']);assert.equal(await page.locator('[data-marketing-day-count]').last().textContent(),'9');
  // Mixed data stays isolated: nine Pixelkovia sessions do not increase ten studio opens.
  const pixelkoviaOverview=await page.locator('.marketing-funnel').innerText(),pixelkoviaParams=calls.at(-1);
  await page.locator('[data-traffic-site="rodulab"]').click();
  assert.equal(await page.locator('[data-marketing-studio-total]').textContent(),'10');
  assert.equal(await page.locator('.marketing-funnel').isVisible(),false);
  assert.equal(await page.locator('.marketing-chart-legend').count(),0);
  assert.ok(!(await page.locator('.marketing-dashboard').innerText()).includes('Nákupy'));
  await page.locator('#refresh-marketing').click();await ready();
  assert.equal(await page.locator('[data-marketing-studio-total]').textContent(),'10');
  assert.equal(calls.at(-1),pixelkoviaParams,'switching preserves Pixelkovia filters');
  await page.locator('[data-traffic-site="pixelkovia"]').click();
  assert.equal(await page.locator('.marketing-funnel').innerText(),pixelkoviaOverview,'Pixelkovia overview is unchanged after a studio refresh');
  assert.equal(await page.locator('[data-marketing-day-count]').last().textContent(),'9');
  assert.deepEqual(await page.locator('[data-marketing-detail="kpi-visits"] [data-funnel-source] b').allTextContents(),['1','1','7']);
  const webWidths=await page.locator('.marketing-funnel-step:not(:first-child) .marketing-source-track').evaluateAll(els=>els.map(el=>parseFloat(el.style.width)));
  assert.ok(Math.abs(webWidths[1]/webWidths[0]-2/9)<.001);assert.ok(Math.abs(webWidths[2]/webWidths[0]-1/9)<.001,'bar lengths use volumes, not decorative steps');
  await page.locator('#marketing-kpi-visits').click();assert.ok(await page.locator('[data-marketing-detail="kpi-visits"] .marketing-source-counts').isVisible());await page.keyboard.press('Escape');
  await latestDay.focus();assert.deepEqual(await page.locator('.marketing-chart-legend li').evaluateAll(els=>els.map(el=>el.getAttribute('aria-label'))),['Facebook: 2','Instagram: 2','Others: 5']);
  assert.equal(await page.locator('[data-marketing-count]').last().textContent(),'9');
  await page.locator('#marketing-unique').check();await latestDay.focus();assert.equal(await page.locator('[data-marketing-count]').last().textContent(),'9');assert.deepEqual(await page.locator('.marketing-chart-legend li').evaluateAll(els=>els.map(el=>el.getAttribute('aria-label'))),['Facebook: 2','Instagram: 2','Others: 5']);
  await page.locator('#marketing-unique').uncheck();
  await page.locator('#marketing-group-other').click();assert.equal(await page.locator('#marketing-source-meta').isVisible(),true);
  await page.locator('#marketing-charts').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/pixelkovia-three-source-chart-'+(process.env.QA_BROWSER||'chromium')+'.png',fullPage:true});
  await page.locator('#marketing-group-other').click();
  for(const id of chartFixtures)await execute(db,'DELETE FROM marketing_visits WHERE id=?',id);
  await page.locator('#refresh-marketing').click();await ready();

  assert.equal(await page.locator('.marketing-advanced,.marketing-chart-stats,.marketing-chart-data,#marketing-availability,#marketing-methodology,#marketing-units,#marketing-quality-more').count(),0);
  assert.equal(await page.locator('[data-marketing-count]').count(),1);assert.equal(await page.locator('[data-marketing-day]').count(),14);
  assert.equal(await page.locator('[data-marketing-count]').last().textContent(),'1');
  await page.locator('#marketing-unique').check();
  assert.match(await page.locator('.marketing-chart figcaption').innerText(),/Unikátne prehliadače/);
  assert.equal(await page.locator('[data-marketing-count]').last().textContent(),'1');
  const day=page.locator('.marketing-chart-day[tabindex="0"]').first();await day.focus();await page.keyboard.press('End');
  assert.equal(await page.locator('[data-marketing-count]').textContent(),'1');assert.match(await page.locator('.marketing-chart-total').innerText(),/Unikátne prehliadače/);
  await page.locator('#marketing-summary-charts').click();await page.locator('#refresh-marketing').click();await ready();
  assert.equal(await page.locator('#marketing-charts').evaluate(el=>el.open),false);
  await page.reload();await ready();assert.equal(await page.locator('#marketing-charts').evaluate(el=>el.open),false);
  await page.locator('#marketing-summary-charts').click();assert.ok(await page.locator('#marketing-unique').isChecked());
  await page.locator('#marketing-unique').uncheck();
  assert.ok(await page.locator('#marketing-charts').evaluate(el=>el.open),'unique checkbox does not collapse the chart');
  await page.locator('[data-chart-step="-1"]').click();assert.equal(await page.locator('[data-marketing-count]').textContent(),'0');
  await page.locator('[data-chart-step="1"]').click();assert.equal(await page.locator('[data-marketing-count]').textContent(),'1');
  await page.locator('.marketing-purchase-link').click();await page.waitForURL('**/admin#payments?**');await page.locator('.payment-funnel-scope').waitFor();await ready();
  assert.ok(await page.locator('.payment-funnel-scope').isVisible());assert.equal(await page.locator('.payment-attempt-row').count(),1);
  assert.match(await page.locator('.payment-table-heading').innerText(),/1/);assert.ok(await page.locator('#payment-days').isDisabled());
  await page.reload();await ready();assert.equal(await page.locator('.payment-attempt-row').count(),1);
  await page.getByRole('link',{name:'Späť na funnel'}).click();await page.locator('.marketing-dashboard').waitFor();await ready();
  const row=page.locator('[data-marketing-root=group-facebook]');assert.equal(await row.locator('td').nth(2).innerText(),'100 %');
  // Networks are collapsed summaries with two detail rows, independently persistent.
  assert.equal(await page.locator('#marketing-group-facebook').getAttribute('aria-expanded'),'false');
  assert.equal(await page.locator('#marketing-source-facebook_ads').isVisible(),false);
  assert.equal(await page.locator('.marketing-table-wrap').getByText('Influencer',{exact:true}).count(),0);
  await page.locator('#marketing-group-facebook').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#marketing-group-facebook').getAttribute('aria-expanded'),'true');
  assert.ok(await page.locator('#marketing-source-facebook_ads').isVisible());assert.ok(await page.locator('#marketing-source-facebook').isVisible());
  assert.equal(await page.locator('#marketing-source-facebook_ads th').innerText(),'Reklama');assert.equal(await page.locator('#marketing-source-facebook th').innerText(),'Bežný príspevok');
  await page.locator('#marketing-group-other').click();
  for(const [source,label] of [['direct','Bez informácie o pôvode'],['unknown','Neznámy alebo iný zdroj'],['organic','Neplatená návštevnosť']]){
   assert.ok(await page.locator('#marketing-source-'+source).isVisible());assert.equal(await page.locator('#marketing-source-'+source+' th').innerText(),label);
  }
  assert.equal(await page.locator('[data-marketing-root=meta]').count(),0);assert.ok(await page.locator('#marketing-source-meta').isVisible());assert.equal(await page.locator('#marketing-source-meta th').innerText(),'Meta (UTM)');assert.match(await page.locator('#marketing-group-other').innerText(),/Others/);
  await page.reload();await ready();assert.equal(await page.locator('#marketing-group-other').getAttribute('aria-expanded'),'true');
  await page.locator('#marketing-group-other').click();
  await page.locator('#marketing-group-instagram').click();
  assert.equal(await page.locator('.marketing-table-wrap tbody tr:visible').count(),7);
  await page.reload();await ready();
  for(const network of ['facebook','instagram']){assert.equal(await page.locator('#marketing-group-'+network).getAttribute('aria-expanded'),'true');assert.ok(await page.locator('#marketing-source-'+network+'_ads').isVisible());}
  await page.locator('#marketing-sort-visits').click();await page.locator('#refresh-marketing').click();await ready();
  assert.ok(await page.locator('#marketing-source-facebook').isVisible());
  for(const network of ['facebook','instagram'])await page.locator('#marketing-group-'+network).click();
  assert.equal(await page.locator('.marketing-table-wrap tbody tr:visible').count(),3);
  assert.match(await page.locator('.marketing-health-status').innerText(),/nedostupné/);
  await page.locator('#marketing-kpi-conversion').focus();await page.keyboard.press('Enter');assert.ok(await page.locator('.marketing-kpi[open]').count());assert.match(await page.locator('.marketing-kpi[open]').innerText(),/Nákupy priradené/);
  await page.keyboard.press('Escape');assert.equal(await page.locator('.marketing-kpi[open]').count(),0);
  await page.locator('#marketing-summary-funnel-details').click();await page.locator('#marketing-summary-attribution').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('.marketing-table-wrap tbody tr:visible').count(),3);assert.equal(await page.locator('#marketing-period-purchases,[data-marketing-sort-header=periodPurchases]').count(),0);
  await page.locator('#marketing-sort-label').click();await page.locator('#marketing-sort-label').click();assert.equal(await page.locator('[data-marketing-sort-header=label]').getAttribute('aria-sort'),'ascending');
  await page.locator('#refresh-marketing').click();await ready();
  assert.equal(await page.locator('#marketing-attribution').evaluate(el=>el.open),true);assert.equal(await page.locator('#marketing-funnel-details').evaluate(el=>el.open),true);
  assert.equal(await page.locator('.marketing-table-wrap tbody tr:visible').count(),3);assert.equal(await page.locator('[data-marketing-sort-header=label]').getAttribute('aria-sort'),'ascending');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'refresh-marketing');
  // Date selection belongs in the toolbar and works with the filters panel closed.
  assert.ok(await page.locator('.marketing-toolbar #marketing-since').isVisible());
  const sinceDate=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit'}).format(Date.now());
  await page.locator('#marketing-since').fill(sinceDate);await page.locator('#marketing-since').blur();await ready();
  assert.match(calls.at(-1),/period=since/);assert.ok(calls.at(-1).includes('from='+sinceDate));assert.ok(!calls.at(-1).includes('to='));
  assert.equal(await page.locator('#marketing-kpi-purchases strong').innerText(),'1');
  await page.locator('#marketing-filter-toggle').click();
  await page.locator('[name=source]').selectOption('facebook_ads');await page.locator('[name=campaign]').selectOption('launch-2026');await page.getByRole('button',{name:'Použiť filtre'}).click();await ready();
  await page.reload();await ready();
  assert.equal(await page.locator('#marketing-since').inputValue(),sinceDate);assert.match(calls.at(-1),/period=since/);assert.match(calls.at(-1),/source=facebook_ads/);assert.match(calls.at(-1),/campaign=launch-2026/);
  assert.equal(await page.locator('#marketing-filter-panel').isVisible(),true);assert.equal(await page.locator('#marketing-attribution').evaluate(el=>el.open),true);assert.equal(await page.locator('#marketing-funnel-details').evaluate(el=>el.open),true);
  assert.equal(await page.locator('[data-marketing-sort-header=label]').getAttribute('aria-sort'),'ascending');
  const cookie=(await context.cookies(origin+'/admin')).find(c=>c.name==='pixelkovia-admin-marketing-layout-v1');
  assert.ok(cookie);assert.equal(cookie.path,'/admin');assert.equal(cookie.secure,true);assert.equal(cookie.sameSite,'Strict');assert.ok(cookie.expires>Date.now()/1000+300*86400);
  const saved=JSON.parse(decodeURIComponent(cookie.value));assert.equal(saved.selected.period,'since');assert.equal(saved.selected.from,sinceDate);assert.equal(saved.selected.to,undefined);assert.ok(!JSON.stringify(saved).includes('private'));assert.ok(cookie.value.length<4096);
  await page.locator('.marketing-purchase-link').click();await page.waitForURL('**/admin#payments?**');await page.locator('.payment-funnel-scope').waitFor();await ready();assert.equal(await page.locator('.payment-attempt-row').count(),1);
  await page.getByRole('link',{name:'Späť na funnel'}).click();await page.locator('.marketing-dashboard').waitFor();await ready();assert.equal(await page.locator('#marketing-since').inputValue(),sinceDate);
  await page.locator('#marketing-since').fill('');await page.locator('#marketing-since').blur();await ready();assert.match(calls.at(-1),/period=14/);assert.match(calls.at(-1),/source=facebook_ads/);
  await page.locator('#marketing-reset').click();await ready();await page.reload();await ready();assert.equal(await page.locator('#marketing-since').inputValue(),'');assert.match(calls.at(-1),/period=14/);
  await page.locator('[name=source]').selectOption('instagram_ads');await page.getByRole('button',{name:'Použiť filtre'}).click();await ready();assert.ok(calls.at(-1).includes('source=instagram_ads'));assert.equal(await page.locator('#marketing-kpi-purchases strong').innerText(),'0');
  assert.equal(await page.locator('#marketing-kpi-conversion strong').innerText(),'Nedostupné');assert.ok(await page.locator('#marketing-chip-source').isVisible());assert.equal(await page.locator('#marketing-attribution').evaluate(el=>el.open),true);
  await page.locator('#marketing-chip-source').click();await ready();assert.equal(await page.locator('#marketing-chip-source').count(),0);assert.equal(await page.locator('#marketing-kpi-purchases strong').innerText(),'1');
  await page.locator('[name=campaign]').selectOption('launch-2026');await page.locator('[name=device]').selectOption('desktop');await page.getByRole('button',{name:'Použiť filtre'}).click();await ready();assert.match(calls.at(-1),/campaign=launch-2026/);assert.match(calls.at(-1),/device=desktop/);
  await page.locator('#marketing-reset').click();await ready();assert.equal(await page.locator('.marketing-filter-chips').count(),0);assert.equal(await page.locator('[data-marketing-period="14"]').getAttribute('aria-pressed'),'true');
  await page.locator('[name=source]').selectOption('');await page.locator('[name=product]').selectOption('game');await page.getByRole('button',{name:'Použiť filtre'}).click();await ready();assert.equal(await page.locator('.marketing-kpis .marketing-kpi strong').first().innerText(),'Nedostupné');
  await page.locator('[name=product]').selectOption('');await page.getByRole('button',{name:'Použiť filtre'}).click();await ready();
  await page.locator('#marketing-summary-attribution').click();await page.locator('#marketing-summary-funnel-details').click();
  await page.locator('#marketing-sort-visits').click();
  for(const period of ['today','7','14','30','90','14']){await page.locator('[data-marketing-period="'+period+'"]').click();await ready();assert.match(calls.at(-1),new RegExp('period='+period));}
  await page.setViewportSize({width:320,height:900});
  for(const period of ['today','7','14','30','90']){
   await page.locator('[data-marketing-period="'+period+'"]').tap();await ready();
   assert.ok(await page.locator('[data-marketing-day]').count()<=(period==='today'?1:Number(period)));assert.equal(await page.locator('[data-marketing-day-count]').count(),await page.locator('[data-marketing-day]').count());
   await page.mouse.move(0,0);await page.locator('.marketing-chart-day[tabindex="0"]').focus();await page.keyboard.press('Home');
   assert.equal(await page.locator('[data-chart-step="-1"]').isDisabled(),true);await page.keyboard.press('End');
   assert.equal(await page.locator('[data-chart-step="1"]').isDisabled(),true);
   assert.ok(await page.locator('.marketing-chart-plot').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  }
  await page.locator('[data-marketing-period="14"]').tap();await ready();await page.setViewportSize({width:1440,height:900});
  await page.locator('#marketing-filter-toggle').click();
  for(const width of [1440,1920,768,480,430,390,375,360,320]){
   await page.setViewportSize({width,height:width===1920?1080:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page overflow '+width);
   assert.equal(await page.locator('#marketing-filter-toggle').isVisible(),width>750);assert.ok(await page.locator('#marketing-since').isVisible());assert.equal(await page.locator('#marketing-filter-panel').isVisible(),false);assert.ok(await page.locator('.marketing-table-wrap').isVisible());
   if(width>=1440){const positions=await page.locator('.marketing-steps .marketing-kpi').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().top));assert.ok(positions.every((top,i)=>!i||top>positions[i-1]),'four horizontal funnel rows on desktop');assert.ok(await page.locator('#marketing-charts').isVisible(),'charts are placed before source and commercial summaries');}
   await page.waitForFunction(()=>{const plot=document.querySelector('.marketing-chart-plot'),svg=plot?.querySelector('svg');return plot&&svg&&Math.abs(Number(svg.getAttribute('width'))-plot.clientWidth)<2;});
   assert.ok(await page.locator('.marketing-chart-plot').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'chart fits its container '+width);
   if(width<=750){const height=(await page.locator('#marketing-charts').boundingBox()).height;assert.ok(height<360,'compact phone chart with website switch '+width+' ('+height+'px)');}
   await page.locator('#marketing-charts').screenshot({path:'/tmp/pixelkovia-slim-bars-'+width+'-'+(process.env.QA_BROWSER||'chromium')+'.png'});
   assert.ok(await page.locator('#marketing-overview-unique').isVisible());
   assert.equal(await page.locator('#marketing-kpi-checkout small').count(),0);assert.ok(await page.locator('#marketing-kpi-revenue small').isVisible());
   const overview=await page.locator('.marketing-funnel').boundingBox();assert.ok(overview.height<(width<=1100?480:440),'compact four-step funnel and unchanged financial results '+width+' height '+overview.height);
   await page.locator('.marketing-funnel').screenshot({path:'/tmp/pixelkovia-overview-'+width+'-'+(process.env.QA_BROWSER||'chromium')+'.png'});
   if(width<=750){
    assert.equal(await page.locator('#marketing-logout').isVisible(),false);
    await page.locator('#marketing-funnel-details').evaluate(el=>el.open=true);
    assert.equal(await page.locator('#marketing-funnel-details').isVisible(),false,'saved open explanation stays hidden on phones');
    await page.locator('#marketing-funnel-details').evaluate(el=>el.open=false);
    const toolbar=await page.locator('.marketing-toolbar').boundingBox(),periods=await page.locator('.marketing-period-buttons').boundingBox(),calendar=await page.locator('.marketing-since-date').boundingBox();
    const periodButtons=await page.locator('[data-marketing-period]').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width,height:r.height};}));
    for(let i=0;i<periodButtons.length;i++){assert.ok(periodButtons[i].width>=40&&periodButtons[i].height>=40,'period touch target '+width);if(i)assert.ok(periodButtons[i].x>=periodButtons[i-1].right+2,'period buttons have distinct spacing '+width);}
    assert.equal(await page.locator('[data-marketing-period][aria-pressed="true"]').count(),1);
    assert.ok(toolbar.height<130,'compact phone toolbar '+width);assert.ok(Math.abs(periods.y-calendar.y)<4,'calendar shares period row '+width);assert.ok(calendar.x>=periods.x+periods.width,'calendar is at the right of periods');
    await page.locator('#marketing-since').fill(sinceDate);await page.locator('#marketing-since').blur();await ready();assert.match(calls.at(-1),/period=since/);
    await page.locator('[data-marketing-period="14"]').tap();await ready();assert.match(calls.at(-1),/period=14/);
    await page.locator('#marketing-group-facebook').tap();assert.ok(await page.locator('#marketing-source-facebook').isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.locator('#marketing-group-other').tap();assert.ok(await page.locator('#marketing-source-direct').isVisible());assert.ok(await page.locator('#marketing-source-organic').isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.locator('#marketing-sources-title').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/pixelkovia-social-groups-'+width+'-'+(process.env.QA_BROWSER||'chromium')+'.png'});
    await page.locator('#marketing-group-other').tap();await page.locator('#marketing-group-facebook').tap();}
   await page.screenshot({path:'/tmp/pixelkovia-marketing-after-'+width+'-'+(process.env.QA_BROWSER||'chromium')+'.png',fullPage:true});
   if(width===375)await page.screenshot({path:'/tmp/pixelkovia-marketing-mobile-viewport.png'});
  }
  await page.setViewportSize({width:1440,height:900});
  await page.locator('#marketing-filter-toggle').click();await page.locator('[name=period]').selectOption('custom');assert.equal(await page.locator('[name=from]').isEnabled(),true);
  await page.locator('[name=from]').fill('2026-10-01');await page.getByRole('button',{name:'Použiť filtre'}).click();await ready();assert.equal(await page.locator('#marketing-kpi-conversion strong').innerText(),'100 %');assert.match(await page.locator('.marketing-period-note').textContent(),/Iba nameraná časť obdobia/);
  // Server-verified fixtures exercise mixed date semantics and ratios above 100%.
  const addPayment=async(id,visit)=>{const time=Date.now();await execute(db,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at,stripe_session_id) VALUES(?,?,?,?,?,?,?)',id,'fixture@example.invalid','Fixture','["episode-1"]',1499,time,'cs_test_'+id);await execute(db,'INSERT INTO payment_observations VALUES(?,?,?,?)',id,'paid',time,time);if(visit)await execute(db,'INSERT INTO marketing_attribution VALUES(?,?,?)',id,visit,time);};
  await addPayment('marketing-unattributed',null);await page.locator('#refresh-marketing').click();await ready();assert.equal(await page.locator('#marketing-kpi-purchases strong').innerText(),'2');assert.equal(await page.locator('#marketing-kpi-conversion strong').innerText(),'100 %');
  await page.locator('#marketing-group-other').click();
  const unknown=page.locator('#marketing-source-unknown');assert.equal(await unknown.locator('td').count(),3);assert.equal(await unknown.locator('td').nth(1).innerText(),'0');
  await addPayment('marketing-second',ids.marketingVisitId);await page.locator('#refresh-marketing').click();await ready();assert.equal(await page.locator('#marketing-kpi-conversion strong').innerText(),'200 %');assert.match(await page.locator('[data-marketing-detail="kpi-checkout"] .marketing-step-detail').textContent(),/Platobné pokusy: 3/);
  for(const id of ['marketing-unattributed','marketing-second']){await execute(db,'DELETE FROM marketing_attribution WHERE attempt_id=?',id);await execute(db,'DELETE FROM payment_observations WHERE attempt_id=?',id);await execute(db,'DELETE FROM checkout_attempts WHERE id=?',id);}
  await execute(db,'INSERT INTO payment_monitor_checks VALUES(?,?,?)','stripe',0,Date.now());await page.locator('#refresh-marketing').click();await ready();assert.ok(await page.locator('.marketing-health.has-issues').isVisible());assert.match(await page.locator('.marketing-health-status').innerText(),/Vyžaduje pozornosť/);
  await execute(db,'UPDATE payment_monitor_checks SET ok=1,checked_at=?',Date.now()-1900000);await page.locator('#refresh-marketing').click();await ready();assert.match(await page.locator('.marketing-health-status').innerText(),/nedostupné/);
  await execute(db,'INSERT INTO payment_monitor_checks VALUES(?,?,?)','webhook',1,Date.now());await page.locator('#refresh-marketing').click();await ready();assert.match(await page.locator('.marketing-health-status').innerText(),/neaktuálne/);
  await execute(db,'UPDATE payment_monitor_checks SET checked_at=?',Date.now());await page.locator('#refresh-marketing').click();await ready();assert.match(await page.locator('.marketing-health-status').innerText(),/aktuálne/);assert.equal(await page.locator('.marketing-health.has-issues').count(),0);
  await page.clock.fastForward(360001);assert.equal(await page.locator('.marketing-freshness').getAttribute('role'),'alert');assert.match(await page.locator('.marketing-freshness').innerText(),/5 minút/);
  fail=true;await page.getByRole('button',{name:'Obnoviť',exact:true}).click();await ready();assert.ok((await page.locator('#notice').innerText()).includes('Dočasný výpadok'));assert.ok(await page.locator('.topbar').isVisible());fail=false;await page.locator('#retry-marketing').click();await ready();assert.ok(await page.locator('.marketing-dashboard').isVisible());
  // Ads controls use actual worker handlers and D1, with only Meta transport substituted.
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('#marketing-metric-costs').click();assert.ok(await page.locator('#marketing-sync-ads').isDisabled());
  env.META_ADS_ACCESS_TOKEN='browser-fixture-secret';
  let metaFailure=false;
  env.META_ADS_FETCH=async url=>{
    if(metaFailure)return Response.json({error:{code:190,error_subcode:463,message:'not returned to browser'}},{status:400});
    const day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit'}).format(Date.now());
    return Response.json(url.pathname.endsWith('/insights')?{data:[{account_id:'1141555698571585',account_currency:'EUR',campaign_id:'123',campaign_name:'Launch <campaign>',date_start:day,date_stop:day,publisher_platform:'facebook',spend:'12.34',impressions:'1234'}, {account_id:'1141555698571585',account_currency:'EUR',campaign_id:'123',campaign_name:'Launch <campaign>',date_start:day,date_stop:day,publisher_platform:'instagram',spend:'0.00',impressions:'500'}, {account_id:'1141555698571585',account_currency:'EUR',campaign_id:'123',campaign_name:'Launch <campaign>',date_start:day,date_stop:day,publisher_platform:'messenger',spend:'0.00',impressions:'66'}]}:{account_id:'1141555698571585',currency:'EUR',timezone_name:'Europe/Bratislava'});
  };
  await page.locator('[data-marketing-period="14"]').click();await ready();
  await page.locator('#marketing-sync-ads').click();await page.waitForResponse(r=>r.url().includes('/api/admin/marketing?'));await ready();
  assert.equal(await page.locator('#marketing-kpi-impressions strong').innerText(),'1\u00a0800');assert.match(await page.locator('#marketing-metric-costs strong').innerText(),/12,34/);assert.match(await page.locator('#marketing-kpi-revenue small').innerText(),/Reklama − 12,3/);assert.equal(await page.locator('#marketing-metric-cac strong').innerText(),'Nedostupné');
  assert.match(await page.locator('#marketing-kpi-profit strong').innerText(),/2,7/);
  assert.ok(await page.locator('[data-marketing-detail="kpi-profit"]').evaluate(el=>el.classList.contains('is-positive')));
  // Presentation uses original cents once, including zero, negative and unavailable costs.
  for(const [cost,expected,tone] of [[2000,'-5,0','is-negative'],[1499,'0,0',null],[0,'15,0','is-positive'],[1234,'2,7','is-positive']]){
   await execute(db,"UPDATE meta_ads_spend SET spend_cents=? WHERE platform='facebook'",cost);
   await page.locator('#refresh-marketing').click();await ready();
   assert.ok((await page.locator('#marketing-kpi-profit strong').innerText()).includes(expected));
   assert.match(await page.locator('#marketing-kpi-revenue strong').innerText(),/15,0/);
   assert.equal(await page.locator('#marketing-kpi-conversion strong').innerText(),'100 %');
   assert.equal(await page.locator('[data-marketing-detail="kpi-profit"]').evaluate((el,tone)=>tone?el.classList.contains(tone):!el.matches('.is-positive,.is-negative'),tone),true);
  }
  assert.equal((await page.locator('.marketing-ads-campaign label').innerText()).replace(/\s+/g,' '),'Launch <campaign> (123)');
  await page.locator('.marketing-ads-campaign input').fill('launch-2026');await page.locator('.marketing-ads-campaign button').click();
  await page.waitForResponse(r=>r.url().includes('/api/admin/marketing?'));await ready();
  assert.match(await page.locator('#marketing-metric-cac strong').innerText(),/12,34/);
  await page.reload();await ready();assert.equal(await page.locator('.marketing-ads-campaign input').inputValue(),'launch-2026');
  for(const width of [1440,375,320]){
    await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'ads controls fit '+width);
    await page.locator('#marketing-metric-costs').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/pixelkovia-meta-ads-'+width+'-'+(process.env.QA_BROWSER||'chromium')+'.png'});
  }
  assert.deepEqual(await page.locator('[data-marketing-detail="kpi-impressions"] [data-funnel-source] b').allTextContents(),['1\u00a0234','500','66']);
  await page.locator('.marketing-funnel').evaluate(el=>{const badge=document.createElement('p');badge.id='qa-fixture-label';badge.textContent='TESTOVACIE ÚDAJE · QA';badge.style.cssText='padding:6px 10px;color:#ffe0a3;font-size:11px;font-weight:700';el.prepend(badge);});
  for(const width of [1440,430,390,360,320]){
   await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert.ok(await page.locator('.marketing-source-segment>span').evaluateAll(els=>els.every(el=>/^[\d\s]+$/.test(el.textContent))),'segments show only numbers');
   assert.equal(await page.locator('.marketing-funnel-method').count(),0,'method is available only inside metric details');
   await page.locator('.marketing-toolbar').screenshot({path:'/tmp/pixelkovia-funnel-toolbar-'+width+'-'+(process.env.QA_BROWSER||'chromium')+'.png'});
   const rows=await page.locator('.marketing-funnel-step>summary').evaluateAll(els=>els.map(el=>[...el.children].map(child=>{const r=child.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};})));
   for(const row of rows){assert.ok(row[0].right<=row[1].x+1&&row[1].right<=row[2].x+1,'name, bar, number fit one row '+width);assert.ok(Math.abs(row[1].x-rows[0][1].x)<1,'shared bar start '+width);assert.ok(Math.abs(row[2].right-rows[0][2].right)<1,'shared count end '+width);}
   assert.ok(await page.locator('.marketing-source-segment>span').evaluateAll(els=>els.every(el=>getComputedStyle(el).visibility==='hidden'||el.getBoundingClientRect().width<=el.parentElement.clientWidth-6)),'labels fit their segments');
   assert.ok(await page.locator('.marketing-funnel-legend').evaluate(el=>el.getBoundingClientRect().top>=document.querySelector('.marketing-steps').getBoundingClientRect().bottom),'legend is below all bars');
   const box=await page.locator('.marketing-funnel').boundingBox();
   await page.locator('.marketing-funnel').screenshot({path:'/tmp/pixelkovia-fb-ig-funnel-'+width+'-'+(process.env.QA_BROWSER||'chromium')+'.png'});
   const qaHeight=(await page.locator('#qa-fixture-label').boundingBox()).height;assert.ok(box.height-qaHeight<(width<=750?470:440),'compact measured FB/IG funnel '+width+' height '+(box.height-qaHeight));
  }
  await page.locator('.marketing-funnel').evaluate(root=>{const sizes=[...root.querySelectorAll('*')].map(el=>[el,parseFloat(getComputedStyle(el).fontSize)]);for(const[el,size]of sizes)el.style.fontSize=(size*2)+'px';});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'funnel fits with 200% text at 320px');
  assert.ok(await page.locator('#marketing-kpi-impressions strong').isVisible());assert.ok(await page.locator('#marketing-kpi-revenue strong').isVisible());
  const enlarged=await page.locator('.marketing-results .marketing-kpi').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().top));assert.ok(enlarged[1]>enlarged[0],'financial results stack when enlarged text needs more room');
  await page.locator('.marketing-funnel').screenshot({path:'/tmp/pixelkovia-fb-ig-text200-320-'+(process.env.QA_BROWSER||'chromium')+'.png'});
  metaFailure=true;await execute(db,'UPDATE meta_ads_state SET last_attempt_at=0');
  await page.locator('#marketing-sync-ads').click();await page.waitForResponse(r=>r.url().includes('/api/admin/marketing?'));await ready();
  assert.equal(await page.locator('#marketing-metric-costs strong').innerText(),'Nedostupné');assert.equal(await page.locator('#marketing-metric-cac strong').innerText(),'Nedostupné');assert.match(await page.locator('[data-marketing-detail="metric-costs"]').innerText(),/190 \/ 463/);
  assert.equal(await page.locator('#marketing-kpi-profit strong').innerText(),'Nedostupné');
  assert.equal((await first(db,'SELECT sum(spend_cents) n FROM meta_ads_spend')).n,1234);
  assert.ok(!(await page.locator('.marketing-dashboard').innerHTML()).includes('browser-fixture-secret'));
  env.META_ADS_ACCESS_TOKEN='';
  env.MARKETING_COLLECTION_ENABLED='false';await page.reload();await ready();
  assert.match(await page.locator('.marketing-quality').textContent(),/vypnutý/);
  assert.equal(await page.locator('#marketing-kpi-conversion strong').innerText(),'Nedostupné');
  assert.equal(await page.locator('#marketing-kpi-purchases strong').innerText(),'1');
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
  console.log('PASS marketing: real API/D1 aggregation, unavailable data, explicit analytics consent and server cookie validation, refresh/checkout deduplication, disabled collection switch, UTM and verified payments, cohort versus period payments, uncapped 200% conversion, filter chips/reset/quick/custom/since dates, admin-scoped cookie preferences and reload restoration, keyboard disclosures and state restoration, sorting and expandable social totals with persistent children, hidden influencer, four-column source table, aligned volume rows and adaptive FB/IG labels, positive/negative/zero/unavailable profit from original cents, unchanged conversion/revenue/CAC, unique source deduplication, 200% text and independent period attempts, missing/stale/failed checks, five-minute warning, error state, 320–1920px ('+(process.env.QA_BROWSER||'chromium')+').');
 }finally{await context.close().catch(()=>{});await browser.close().catch(()=>{});db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
