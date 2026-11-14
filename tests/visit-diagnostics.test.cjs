const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin='https://pixelkovia.rodulab.com';
(async()=>{
 const {fresh}=await import('../admin/tests/support.mjs'),{default:worker}=await import('../admin/src/worker.mjs');
 const db=fresh(),env={TQ_DB:db,ENVIRONMENT:'local',MARKETING_COLLECTION_ENABLED:'true',CUSTOMER_AUTH_SECRET:'a'.repeat(64)};
 const browser=await (process.env.QA_BROWSER==='webkit'?webkit:chromium).launch({headless:process.env.QA_HEADED!=='1',...(process.env.QA_BROWSER==='webkit'?{env:{...process.env,WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS:'1',WEBKIT_DISABLE_COMPOSITING_MODE:'1',WEBKIT_DISABLE_DMABUF_RENDERER:'1',LIBGL_ALWAYS_SOFTWARE:'1',GSK_RENDERER:'cairo',JSC_useJIT:'0'}}:{})});
 const sdk='const q=window.fbq;q.callMethod=function(){};for(const args of q.queue)q.callMethod.apply(q,args);q.queue=[];';
 let sequence=0;const results=[];
 const count=async table=>(await db.prepare('SELECT count(*) n FROM '+table).first()).n;
 const latest=()=>db.prepare('SELECT * FROM marketing_diagnostics ORDER BY first_at DESC,rowid DESC LIMIT 1').first();
 const until=async(fn,message,timeout=5000)=>{const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,50));}throw Error(message);};
 async function context(options={}){
  const ctx=await browser.newContext({...(process.env.QA_BROWSER==='webkit'?devices['iPhone 13']:devices['Pixel 5']),...options.device,...options.userAgent?{userAgent:options.userAgent}:{}}),events=[],pixelRequests=[];
  const address='192.0.2.'+(++sequence);
  await ctx.route('**/*',async route=>{
   const req=route.request(),u=new URL(req.url());
   if(u.hostname==='connect.facebook.net'){pixelRequests.push(req.url());if(options.blockPixel)return route.abort();if(options.delayPixel)await new Promise(r=>setTimeout(r,options.delayPixel));return route.fulfill({contentType:'text/javascript',body:sdk}).catch(()=>{});}
   if(u.hostname==='www.facebook.com')return route.fulfill({status:200,body:''});
   if(u.origin!==origin)return route.fulfill({status:200,body:''});
   if(u.pathname.startsWith('/api/')){
    if(u.pathname==='/api/marketing/event'){const event=req.postDataJSON();events.push(event);if(options.failInternal&&event.mode==='session')return route.fulfill({status:503,json:{error:'Isolated QA failure'}});}
    const headers={...await req.allHeaders(),origin:'http://127.0.0.1','CF-Connecting-IP':address};
    if(!headers.cookie)headers.cookie=(await ctx.cookies(req.url())).map(c=>c.name+'='+c.value).join('; ');
    const response=await worker.fetch(new Request('http://127.0.0.1'+u.pathname+u.search,{method:req.method(),headers,...['GET','HEAD'].includes(req.method())?{}:{body:req.postData()}}),env);
    return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});
   }
   let file=u.pathname==='/admin'?'admin/public/index.html':u.pathname.startsWith('/admin/')?'admin/public/'+u.pathname.slice(7):u.pathname==='/'?'dist/funnel/index.html':'dist/funnel'+u.pathname;
   if(!fs.existsSync(file)&&fs.existsSync(file+'.html'))file+='.html';
   if(!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Not found'});
   if(options.slowHtml&&u.pathname==='/')await new Promise(r=>setTimeout(r,5200));
   const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
   return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
  });
  const page=await ctx.newPage();return {ctx,page,events,pixelRequests};
 }
 async function choose(page,analytics,marketing){
  await page.locator('.privacy-panel').waitFor({state:'visible'});
  await page.locator('[data-privacy="settings"]').click();
  await page.locator('[name="privacy-analytics"]').setChecked(analytics);await page.locator('[name="privacy-marketing"]').setChecked(marketing);
  await page.locator('[data-privacy="save"]').click();await page.locator('.privacy-panel').waitFor({state:'hidden'});
 }
 try{
  const first=await context();
  await first.page.goto(origin+'/?utm_source=facebook&utm_medium=paid_social&utm_campaign=qa-diagnostics&email=DO_NOT_STORE');
  assert.equal(await count('marketing_visits'),0);assert.equal(await count('marketing_diagnostics'),0);
  await first.page.locator('[data-privacy="reject"]').click();await first.page.locator('.privacy-panel').waitFor({state:'hidden'});
  assert.equal(first.events.length,0);assert.equal(first.pixelRequests.length,0);
  await first.page.locator('.privacy-settings-link').click();await first.page.locator('[name="privacy-analytics"]').check();await first.page.locator('[data-privacy="save"]').click();
  await until(async()=>await count('marketing_diagnostics')===1,'consented diagnostics');
  let row=await latest(),visit=await db.prepare('SELECT * FROM marketing_visits').first();
  assert.equal(row.internal_recorded,1);assert.equal(row.marketing_allowed,0);assert.equal(row.meta_attempted,0);assert.equal(first.pixelRequests.length,0);
  assert.equal(visit.browser,process.env.QA_BROWSER==='webkit'?'safari':'chrome');assert.equal(visit.os,process.env.QA_BROWSER==='webkit'?'ios':'android');
  assert.equal(visit.source,'facebook_ads');assert.ok(!JSON.stringify(row).includes('DO_NOT_STORE'));
  await first.page.reload();await until(async()=>await count('marketing_diagnostics')===2,'reload document');assert.equal(await count('marketing_visits'),1,'same session survives reload');
  await first.page.locator('.privacy-settings-link').click();await first.page.locator('[name="privacy-marketing"]').check();await first.page.locator('[data-privacy="save"]').click();
  await until(async()=>(await latest()).meta_attempted===1,'only actual fbq call marks an attempt');
  assert.equal(await count('marketing_diagnostics'),2,'consent and Pixel callbacks reuse the document');
  results.push('Consent refusal, analytics-only, marketing grant, UTM, reload/session deduplication');await first.ctx.close();

  for(const [name,options,url,analytics,marketing,check] of [
   ['direct',{},'/',true,false,async row=>{assert.equal(row.source,'direct');}],
   ['Audience Network',{},'/?utm_source=an&utm_medium=paid_social',true,true,async row=>{assert.equal(row.source,'unknown');assert.equal(row.entry_source,'audience_network_ads');}],
   ['blocked Pixel',{blockPixel:true},'/?utm_source=ig&utm_medium=cpc',true,true,async row=>{assert.ok(row.meta_failed||row.meta_timeout);assert.equal(row.meta_attempted,0);}],
   ['internal request failure',{failInternal:true},'/',true,false,async row=>{assert.equal(row.internal_failed,1);assert.equal(row.internal_recorded,0);}],
   ['marketing only',{},'/',false,true,async()=>{}],
   ['slow HTML',{slowHtml:true},'/',true,false,async row=>{assert.ok(row.load_ms>=5000);if(process.env.QA_BROWSER==='webkit'&&row.ttfb_ms===null)return;assert.ok(row.ttfb_ms>=5000);}],
   ['slow Pixel',{delayPixel:13000},'/',true,true,async row=>{assert.equal(row.meta_timeout,1);assert.equal(row.meta_attempted,1);}]
  ]){
   const item=await context(options),visitsBefore=await count('marketing_visits'),docsBefore=await count('marketing_diagnostics');
   await item.page.goto(origin+url);await choose(item.page,analytics,marketing);
   if(analytics){
    await until(async()=>await count('marketing_diagnostics')===docsBefore+1,name+' document');
    // WebKit may keep a blocked SDK pending without firing script.onerror.
    // The bounded timeout is a distinct supported outcome, not a delivery claim.
    if(name==='blocked Pixel')await until(async()=>{const row=await latest();return row.meta_failed===1||row.meta_timeout===1;},'blocked SDK error or timeout',15000);
    if(name==='slow Pixel'){await item.page.waitForFunction(()=>window.PixelkoviaMeta?.diagnostic.metaAttempted,{},{timeout:18000});await until(async()=>(await latest()).meta_attempted===1,'slow SDK attempt');}
    await check(await latest());
   }else{
    await item.page.waitForFunction(()=>window.PixelkoviaMeta?.diagnostic.metaAttempted);assert.equal(item.events.length,0);assert.equal(await count('marketing_diagnostics'),docsBefore);
   }
   if(name==='internal request failure'||!analytics)assert.equal(await count('marketing_visits'),visitsBefore,'diagnostic does not invent a visit');
   results.push(name);await item.ctx.close();
  }
  // These check classification only, not actual Meta application behavior.
  for(const [name,ua,expected] of [
   ['Facebook UA fixture','Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36 [FBAN/FB4A;FBAV/500.0]', 'facebook'],
   ['Instagram UA fixture','Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 350.0','instagram']
  ]){
   const item=await context({userAgent:ua});await item.page.goto(origin+'/');await choose(item.page,true,false);
   await until(async()=>(await db.prepare('SELECT in_app FROM marketing_visits ORDER BY started_at DESC LIMIT 1').first()).in_app===expected,name);
   results.push(name+' (classification only)');await item.ctx.close();
  }
  const {syncMetaAds,metaAccount}=await import('../admin/src/meta-ads.mjs'),{localDate}=await import('../admin/src/marketing-query.mjs');
  const today=localDate(Date.now());env.META_ADS_ACCESS_TOKEN='isolated-qa-token';
  env.META_ADS_FETCH=async url=>Response.json(url.pathname.endsWith('/insights')?{data:url.searchParams.get('fields').includes('reach')?[{reach:'600',impressions:'620'}]:[
   ['facebook','100','8','2','1.23'],['instagram','20','0','0','0.09'],['audience_network','500','31','0','0.33']
  ].map(([platform,impressions,clicks,views,spend])=>({account_id:metaAccount,account_currency:'EUR',campaign_id:'123',campaign_name:'QA',date_start:today,date_stop:today,publisher_platform:platform,spend,impressions,inline_link_clicks:clicks,outbound_clicks:[{action_type:'outbound_click',value:clicks}],actions:[{action_type:'landing_page_view',value:views}]}))}:{account_id:metaAccount,currency:'EUR',timezone_name:'Europe/Bratislava'});
  await syncMetaAds(env,{from:localDate(Date.now()-13*86400000),to:today});
  const admin=await context({device:{viewport:{width:1440,height:1000},isMobile:false,hasTouch:false}});
  await admin.page.goto(origin+'/admin');await admin.page.waitForFunction(()=>document.querySelector('#view')?.getAttribute('aria-busy')==='false');
  const detail=admin.page.locator('#marketing-visit-diagnostics');assert.equal(await detail.evaluate(el=>el.open),false,'new section starts collapsed');
  await admin.page.locator('#marketing-summary-visit-diagnostics').focus();await admin.page.keyboard.press('Enter');assert.equal(await detail.evaluate(el=>el.open),true);
  assert.match(await detail.innerText(),/Potvrdené prijatie PageView Metou: Nemeriame/);
  assert.match(await detail.locator('.marketing-diagnostic-meta').innerText(),/Audience Network\s+500\s+31\s+31\s+0/);
  assert.match(await detail.locator('.marketing-diagnostic-warnings').innerText(),/Audience Network má 31/);
  await admin.page.locator('#marketing-diagnostic-dimension').selectOption('browser');assert.equal(await detail.locator('[data-diagnostic-group="source"]').isVisible(),false);assert.equal(await detail.locator('[data-diagnostic-group="browser"]').isVisible(),true);
  await detail.locator('.marketing-diagnostic-days>summary').click();assert.ok(await detail.locator('.marketing-diagnostic-days table').isVisible());
  for(const width of [1440,390,320]){
   await admin.page.setViewportSize({width,height:1000});await detail.evaluate(el=>el.scrollIntoView({block:'start'}));
   assert.ok(await admin.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no document overflow at '+width);
   await admin.page.screenshot({path:'/tmp/pixelkovia-visit-diagnostics-'+width+'-'+(process.env.QA_BROWSER||'chromium')+'.png'});
  }
  results.push('Admin: collapsed default, keyboard, environment selector, days, desktop + 390/320 px');await admin.ctx.close();
  console.log(JSON.stringify({engine:process.env.QA_BROWSER||'chromium',results,physicalDevices:false,realMetaInAppBrowser:false}));
 }finally{await browser.close();db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
