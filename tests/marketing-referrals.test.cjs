// Shipped collector + real consent and marketing Worker/D1 handlers. No external services.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin='https://pixelkovia.rodulab.com';
(async()=>{
 const {fresh}=await import('../admin/tests/support.mjs'),{execute,first,hash}=await import('../admin/src/db.mjs'),{default:worker}=await import('../admin/src/worker.mjs'),{linkMarketingAttempt,marketingReport}=await import('../admin/src/marketing.mjs');
 const db=fresh(),env={TQ_DB:db,ENVIRONMENT:'local',MARKETING_COLLECTION_ENABLED:'true',WEB_URL:origin,CUSTOMER_AUTH_SECRET:'a'.repeat(64)};
 const browser=await(process.env.QA_BROWSER==='webkit'?webkit:chromium).launch({headless:process.env.QA_HEADED!=='1',...(process.env.QA_BROWSER==='webkit'?{env:{...process.env,WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS:'1',WEBKIT_DISABLE_COMPOSITING_MODE:'1',WEBKIT_DISABLE_DMABUF_RENDERER:'1',LIBGL_ALWAYS_SOFTWARE:'1',GSK_RENDERER:'cairo',JSC_useJIT:'0'}}:{})});
 const cases=[
  {referrer:'https://l.facebook.com/',path:'/',source:'facebook',purchase:true},
  {referrer:'https://lm.facebook.com/',path:'/?utm_source=facebook&utm_medium=paid_social&utm_campaign=launch-2026',source:'facebook_ads',purchase:true},
  {referrer:'https://m.facebook.com/',path:'/?fbclid=DO_NOT_STORE',source:'facebook'},
  {referrer:'',path:'/?fbclid=DO_NOT_STORE',source:'unknown'},
  {referrer:'https://l.instagram.com/',path:'/',source:'instagram'},
  {referrer:'https://l.facebook.com/',path:'/?utm_source=ig&utm_medium=paid_social',source:'instagram_ads'},
  {referrer:'https://facebook.com.attacker.invalid/',path:'/',source:'unknown'}
 ];
 try{
  for(const [index,c] of cases.entries()){
   const context=await browser.newContext({viewport:{width:index%2?1360:390,height:844},hasTouch:true}),events=[],errors=[];
   try{
    await context.route('**/*',async route=>{
     const request=route.request(),url=new URL(request.url());if(url.origin!==origin)return route.abort();
     if(url.pathname.startsWith('/api/')){
      const headers={...await request.allHeaders(),origin:'http://127.0.0.1'};
      if(!headers.cookie)headers.cookie=(await context.cookies(request.url())).map(c=>c.name+'='+c.value).join('; ');
      if(url.pathname==='/api/marketing/event')events.push(request.postDataJSON());
      const response=await worker.fetch(new Request('http://127.0.0.1'+url.pathname+url.search,{method:request.method(),headers,...(['GET','HEAD'].includes(request.method())?{}:{body:request.postData()})}),env);
      return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});
     }
     const file=url.pathname==='/'?'dist/funnel/index.html':url.pathname==='/checkout'?'dist/funnel/checkout.html':url.pathname==='/admin'?'admin/public/index.html':url.pathname.startsWith('/admin/')?'admin/public/'+url.pathname.slice(7):'dist/funnel'+url.pathname;
     if(!fs.existsSync(file))return route.fulfill({status:404,body:''});
     return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.webp')?'image/webp':'application/octet-stream',body:fs.readFileSync(file)});
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+c.path,c.referrer?{referer:c.referrer}:{});await page.locator('.privacy-panel').waitFor({state:'visible'});
    assert.equal(events.length,0);assert.equal(await page.evaluate(()=>sessionStorage.getItem('pixelkovia-funnel-session-v1')),null);
    const recorded=page.waitForResponse(r=>r.url().includes('/api/marketing/event'));
    await page.locator('[data-privacy="settings"]').click();await page.locator('[name="privacy-analytics"]').check();await page.locator('[data-privacy="save"]').click();assert.equal((await recorded).status(),200);
    assert.equal(events.at(-1).source,c.source,c.path+' ref='+c.referrer);
    const original=await page.evaluate(()=>window.PixelkoviaMarketing.context());
    const stored=await first(db,'SELECT source FROM marketing_visits WHERE id=?',original.marketingVisitId);assert.equal(stored.source,c.source);
    const checkout=page.waitForResponse(r=>r.url().includes('/api/marketing/event'));await page.goto(origin+'/checkout');assert.equal((await checkout).status(),200);
    assert.equal(events.at(-1).source,c.source);assert.deepEqual(await page.evaluate(()=>window.PixelkoviaMarketing.context()),original);
    if(c.purchase){
     const id=crypto.randomUUID(),attemptKey=crypto.randomUUID(),at=Date.now();
     await execute(db,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at,stripe_session_id) VALUES(?,?,?,?,?,?,?)',id,'fixture@example.invalid','','["episode-1"]',100,at,'cs_test_'+id.replaceAll('-',''));
     await execute(db,'INSERT INTO checkout_requests VALUES(?,?,?,?,?)',await hash(attemptKey),await hash(id),'fixture',id,1);
     await linkMarketingAttempt(env,{attemptKey,...original});
     await execute(db,'INSERT INTO payment_observations VALUES(?,?,?,?)',id,'paid',at,at);
    }
    if(index===0){
     // A second, tagged Facebook entry in the same tab keeps the earlier plain
     // referral and its paid purchase intact, and starts a separate visit.
     const next=page.waitForResponse(r=>r.url().includes('/api/marketing/event'));
     await page.goto(origin+'/?utm_source=facebook&utm_medium=paid_social&utm_campaign=second-entry',{referer:'https://l.facebook.com/'});assert.equal((await next).status(),200);
     const changed=await page.evaluate(()=>window.PixelkoviaMarketing.context());assert.notEqual(changed.marketingVisitId,original.marketingVisitId);
     assert.equal(events.at(-1).source,'facebook_ads');assert.equal((await first(db,'SELECT source FROM marketing_visits WHERE id=?',original.marketingVisitId)).source,'facebook');
     const reload=page.waitForResponse(r=>r.url().includes('/api/marketing/event'));await page.reload();assert.equal((await reload).status(),200);assert.deepEqual(await page.evaluate(()=>window.PixelkoviaMarketing.context()),changed);
    }
    assert.ok(!JSON.stringify(events).includes('DO_NOT_STORE'));assert.deepEqual(errors,[]);
   }finally{await context.close();}
  }
  const report=await marketingReport(env,new URLSearchParams({period:'today'}));
  for(const source of ['facebook','facebook_ads']){const row=report.rows.find(row=>row.source===source);assert.equal(row.purchases,1);assert.equal(row.periodPurchases,1);}
  assert.equal(report.rows.find(row=>row.source==='facebook').label,'Facebook odkaz');assert.equal(report.rows.find(row=>row.source==='instagram').label,'Instagram odkaz');
  assert.equal(report.metrics.purchases,2);
  console.log('PASS referrals: consent, Facebook/Instagram referrers, explicit ads, fbclid ambiguity, hostile domains, checkout attribution and paid-source totals ('+(process.env.QA_BROWSER||'chromium')+').');
 }finally{await browser.close();db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
