const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const {workerServer}=await import('./helpers/worker-server.mjs'),{default:worker}=await import('../admin/src/worker.mjs');
 const server=await workerServer(),browser=await (process.env.QA_BROWSER==='webkit'?webkit:chromium).launch({headless:process.env.QA_HEADED!=='1',...(process.env.QA_BROWSER==='webkit'?{env:{...process.env,WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS:'1',WEBKIT_DISABLE_COMPOSITING_MODE:'1',WEBKIT_DISABLE_DMABUF_RENDERER:'1',LIBGL_ALWAYS_SOFTWARE:'1',GSK_RENDERER:'cairo',JSC_useJIT:'0'}}:{})});
 const base=process.env.QA_BROWSER==='webkit'?'https://pixelkovia.test':server.url;
 const sessionId='cs_test_browserconsentpurchase12345',id=crypto.randomUUID(),sessions=new Map();
 const env={TQ_DB:server.db,ENVIRONMENT:'production',MARKETING_COLLECTION_ENABLED:'true',STRIPE_PUBLISHABLE_KEY:'pk_test_fixture',STRIPE_CLIENT:{checkout:{sessions:{async retrieve(key){return sessions.get(key);}}}}};
 const stubSdk=`window.__metaCalls=[];const q=window.fbq; q.callMethod=function(){window.__metaCalls.push(Array.from(arguments));};for(const args of q.queue)q.callMethod.apply(q,args);q.queue=[];`;
 const sdk=process.env.META_SDK_PATH?`window.__metaCalls=window.fbq.queue.map(args=>Array.from(args));`+require('node:fs').readFileSync(process.env.META_SDK_PATH,'utf8')+`;{const original=window.fbq.callMethod;window.fbq.callMethod=function(){window.__metaCalls.push(Array.from(arguments));return original.apply(this,arguments);};}`:stubSdk;
 let blocked=false,delayConsent=0;const errors=[],metaRequests=[];
 try{
  const context=await browser.newContext({ignoreHTTPSErrors:true,...devices['iPhone 13']});
  await context.route('**/api/**',async route=>{
   const request=route.request(),url=new URL(request.url()),requestHeaders=await request.allHeaders();
   if(delayConsent&&url.pathname==='/api/privacy/consent'&&request.method()==='GET')await new Promise(resolve=>setTimeout(resolve,delayConsent));
   // WebKit exposes routed headers before its cookie jar is attached to the network request.
   if(!requestHeaders.cookie)requestHeaders.cookie=(await context.cookies(request.url())).map(c=>c.name+'='+c.value).join('; ');
   const response=await worker.fetch(new Request(url,{method:request.method(),headers:requestHeaders,...(['GET','HEAD'].includes(request.method())?{}:{body:request.postData()})}),env);
   if(process.env.DEBUG_CONSENT&&url.pathname==='/api/privacy/consent')console.log(JSON.stringify({method:request.method(),status:response.status,hasCookie:!!requestHeaders.cookie,choice:(await response.clone().json()).choice}));
   return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});
  });
  if(base!==server.url)await context.route(base+'/**',async route=>{
   const url=new URL(route.request().url());if(url.pathname.startsWith('/api/'))return route.fallback();
   const response=await context.request.get(server.url+url.pathname+url.search);return route.fulfill({response});
  });
  await context.route('https://connect.facebook.net/**',route=>{metaRequests.push(route.request().url());return blocked?route.abort():!route.request().url().endsWith('/fbevents.js')?route.continue():route.fulfill({contentType:'text/javascript',body:sdk});});
  await context.route('https://www.facebook.com/**',route=>{const sent=route.request().url()+(route.request().postData()||'');assert.ok(!sent.includes('DO_NOT_SEND')&&!sent.includes(sessionId)&&!sent.includes('secret%40'),'no checkout secrets in Meta requests');metaRequests.push(route.request().url());return route.fulfill({status:200,body:''});});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/?utm_source=facebook&utm_medium=paid_social&utm_campaign=consent-qa');
  await page.locator('.privacy-panel').waitFor({state:'visible'});
  assert.equal(metaRequests.length,0);assert.equal((await server.db.prepare('SELECT count(*) n FROM marketing_visits').first()).n,0);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('pixelkovia-funnel-session-v1')),null);
  await page.screenshot({path:'/tmp/pixelkovia-consent-phone.png',fullPage:false});
  await page.locator('[data-privacy="reject"]').click();
  if(process.env.DEBUG_CONSENT){await page.waitForTimeout(500);console.log(JSON.stringify({status:await page.locator('.privacy-status').innerText(),cookies:(await context.cookies()).map(({name,domain,secure,httpOnly})=>({name,domain,secure,httpOnly})),choice:await page.evaluate(()=>window.PixelkoviaConsent.choice)}));}
  await page.locator('.privacy-panel').waitFor({state:'hidden'});
  assert.equal(metaRequests.length,0);assert.equal(await page.locator('iframe[src="/assets/meta-pixel"]').count(),0);
  const cookie=(await context.cookies()).find(c=>c.name==='__Host-pixelkovia-consent');assert.ok(cookie.httpOnly&&cookie.secure);assert.ok(!cookie.value.includes('true'));
  const recorded=page.waitForResponse(r=>r.url().includes('/api/marketing/event'));
  await page.locator('.privacy-settings-link').click();await page.locator('[name="privacy-analytics"]').check();await page.locator('[data-privacy="save"]').click();
  await page.waitForFunction(()=>window.PixelkoviaConsent.allows('analytics'));
  await recorded;
  assert.equal(metaRequests.length,0);assert.equal((await server.db.prepare('SELECT count(*) n FROM marketing_visits').first()).n,1);
  assert.equal((await server.db.prepare('SELECT source FROM marketing_visits').first()).source,'facebook_ads');
  await page.locator('.privacy-settings-link').click();await page.locator('[name="privacy-analytics"]').uncheck();await page.locator('[name="privacy-marketing"]').check();await page.locator('[data-privacy="save"]').click();
  await page.waitForFunction(()=>window.PixelkoviaConsent.allows('marketing'));
  const pixel=()=>page.frames().find(f=>f.url().endsWith('/assets/meta-pixel'));
  await page.waitForFunction(()=>document.querySelector('iframe[src="/assets/meta-pixel"]'));
  await page.waitForFunction(()=>{try{return document.querySelector('iframe[src="/assets/meta-pixel"]')?.contentWindow.__metaCalls?.some(c=>c[0]==='track'&&c[1]==='PageView');}catch{return false;}});
  const calls=await pixel().evaluate(()=>window.__metaCalls);assert.ok(calls.some(c=>c[0]==='init'&&c[1]==='1141555698571585'));assert.ok(calls.some(c=>c[0]==='set'&&c[1]==='autoConfig'&&c[2]===false));
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('pixelkovia-funnel-session-v1')),null);
  const at=Date.now();
  await server.db.prepare('INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at,stripe_session_id,gift_game) VALUES(?,?,?,?,?,?,?,?)').bind(id,'secret@example.invalid','Secret','["episode-1","atlas-pixelkov"]',2498,at,sessionId,1).run();
  sessions.set(sessionId,{id:sessionId,client_reference_id:id,mode:'payment',amount_total:2498,currency:'eur',livemode:false,status:'complete',payment_status:'paid',payment_intent:{id:'pi_consentbrowser',status:'succeeded'}});
  delayConsent=250; // Payment status may arrive before a remembered consent is loaded.
  const actualPurchase=process.env.META_SDK_PATH?page.waitForRequest(r=>{const u=new URL(r.url());return u.hostname==='www.facebook.com'&&(u.searchParams.get('ev')==='Purchase'||new URLSearchParams(r.postData()||'').get('ev')==='Purchase');},{timeout:15000}):null;
  await page.goto(base+'/checkout?session_id='+sessionId+'&client_secret=DO_NOT_SEND&email=DO_NOT_SEND');
  await page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('Platba je potvrdená'));
  await page.waitForFunction(()=>document.querySelector('iframe[src="/assets/meta-pixel"]'));
  await page.waitForFunction(()=>{try{return document.querySelector('iframe[src="/assets/meta-pixel"]')?.contentWindow.__metaCalls?.some(c=>c[0]==='track'&&c[1]==='Purchase');}catch{return false;}});
  if(actualPurchase)await actualPurchase;delayConsent=0;
  const paidCalls=await pixel().evaluate(()=>({calls:window.__metaCalls,url:location.href,referrer:document.referrer}));
  const purchase=paidCalls.calls.find(c=>c[1]==='Purchase');assert.equal(purchase[2].value,24.98);assert.equal(purchase[2].currency,'EUR');assert.equal(purchase[3].eventID,'purchase-'+id);
  assert.equal(paidCalls.referrer,'');assert.ok(!JSON.stringify(paidCalls).includes('DO_NOT_SEND'));assert.ok(!JSON.stringify(paidCalls).includes(sessionId));assert.ok(!JSON.stringify(paidCalls).includes('secret@'));
  assert.ok(paidCalls.calls.some(c=>c[1]==='InitiateCheckout'));
  await page.reload();await page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('Platba je potvrdená'));
  await page.waitForTimeout(300);assert.equal((await server.db.prepare('SELECT count(*) n FROM meta_pixel_purchases').first()).n,1);
  assert.equal((await pixel().evaluate(()=>window.__metaCalls||[])).filter(c=>c[1]==='Purchase').length,0,'reload does not repeat Purchase');
  const second=await context.newPage();await second.goto(base+'/');await second.waitForFunction(()=>window.PixelkoviaConsent?.allows('marketing'));
  await page.locator('.privacy-settings-link').click();await page.locator('[data-privacy="reject"]').click();await page.locator('.privacy-panel').waitFor({state:'hidden'});
  if(process.env.QA_BROWSER==='webkit')await second.bringToFront();
  await second.waitForFunction(()=>!window.PixelkoviaConsent.allows('marketing'));
  assert.equal(await second.locator('iframe[src="/assets/meta-pixel"]').count(),0);assert.equal(await page.locator('iframe[src="/assets/meta-pixel"]').count(),0);
  await second.close();
  blocked=true;const before=(await server.db.prepare('SELECT count(*) n FROM meta_pixel_purchases').first()).n;
  await page.locator('.privacy-settings-link').click();await page.locator('[data-privacy="accept"]').click();await page.locator('.privacy-panel').waitFor({state:'hidden'});await page.waitForTimeout(300);
  assert.equal((await server.db.prepare('SELECT count(*) n FROM meta_pixel_purchases').first()).n,before,'blocked SDK never claims a purchase');
  if(process.env.QA_BROWSER==='webkit'){await page.reload();await page.waitForFunction(()=>window.PixelkoviaConsent?.allows('marketing'));}
  for(const width of (process.env.QA_BROWSER==='webkit'?[390]:[320,390,1366])){
   await page.setViewportSize({width,height:width<700?844:900});await page.locator('.privacy-settings-link').click();
   await page.waitForTimeout(60);
   const box=await page.locator('.privacy-panel').boundingBox();assert.ok(box.x>=-1&&box.width<=width+1&&box.y>=-1&&box.height<=page.viewportSize().height+1,JSON.stringify({width,box,viewport:page.viewportSize(),actual:await page.evaluate(()=>({width:innerWidth,height:innerHeight,visual:visualViewport?.height}))}));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.locator('.privacy-panel').screenshot({path:`/tmp/pixelkovia-consent-settings-${width}.png`});await page.locator('[data-privacy="close"]').click();
  }
  assert.deepEqual(errors,[]);
  await context.close();console.log('PASS: explicit granular consent, server cookie gates, revocation across tabs, no optional storage before consent, UTM, clean isolated Pixel URL, configured ID, verified gift Purchase once across reload, blocked SDK, and consent UI ('+(process.env.QA_BROWSER||'chromium')+').');
 }finally{await browser.close();await server.mf.dispose();}
})().catch(error=>{console.error(error);process.exitCode=1});
