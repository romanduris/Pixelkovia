// Actual gateway + isolated Workers/D1: feedback works after a later login,
// fits phones, uses cumulative stars, and is visible from payment/player links.
const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const {workerServer}=await import('./helpers/worker-server.mjs');
 const {first,execute}=await import('../admin/src/db.mjs');
 const {saveChecklist,activate,requireRun}=await import('../admin/src/game-service.mjs');
 const {finishRun}=await import('../admin/src/customer-portal.mjs');
 const {checklist}=await import('../admin/src/checklist.mjs');
 const server=await workerServer(),engine=process.env.QA_BROWSER==='webkit'?webkit:chromium;
 const browser=await engine.launch({headless:true,...(engine===webkit?{env:{...process.env,WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS:'1',WEBKIT_DISABLE_COMPOSITING_MODE:'1',JSC_useJIT:'0'}}:{})});
 try{
  const e=await first(server.db,"SELECT * FROM entitlements WHERE product_id='episode-1'");
  await saveChecklist(server.db,'qa-family',e.id,Object.fromEntries(checklist.map(s=>[s.id,true])));
  const session=await activate(server.db,'qa-family',e.id,'feedback-mobile-test',{at:Date.now()-74*60000});
  const run=await requireRun(server.db,'qa-family',session.runId,session.deviceToken);
  // A portal already open during play scrolls to feedback on completion too.
  const watching=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true}),parent=await watching.newPage();
  await parent.goto(server.url+'/Supervisor');await parent.locator('#login-email').fill(server.email);await parent.locator('#login-password').fill(server.customerPassword);await parent.locator('#customer-login button').tap();await parent.locator('#start-game').waitFor();
  await finishRun(server.db,run,{progress:{stage:7,completed:[1,2,3,4,5,6,7]}});
  await parent.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await parent.waitForFunction(()=>{const r=document.querySelector('#hodnotenie')?.getBoundingClientRect();return scrollY>100&&r&&r.top>=0&&r.top<=20;});
  assert.equal(new URL(parent.url()).hash,'','completion also scrolls an already open portal without a fragment');await watching.close();
  const login=async page=>{await page.goto(server.url+'/Supervisor');await page.locator('#login-email').fill(server.email);await page.locator('#login-password').fill(server.customerPassword);await page.locator('#customer-login button').tap();await page.locator('#hodnotenie').waitFor();};
  const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await login(page);
  await page.goto(server.url+'/Supervisor#hodnotenie');await page.locator('#game-feedback').waitFor();
  await page.waitForFunction(()=>{const r=document.querySelector('#hodnotenie')?.getBoundingClientRect();return scrollY>100&&r&&r.top>=0&&r.top<=20;});
  assert.equal(await page.locator('.rating-stars .is-filled').count(),0);
  assert.deepEqual(await page.locator('.run-statistics dt').allTextContents(),['Celkový čas','Vyriešené úlohy']);
  assert.deepEqual(await page.locator('.run-statistics dd').allTextContents(),['74 min','7 / 7']);
  for(const [width,height]of [[320,568],[360,640],[390,844],[430,932],[1440,900]]){
   await page.setViewportSize({width,height});
   const placement=await page.locator('#hodnotenie').evaluate(el=>{const game=document.querySelector('#vasa-hra');return {after:game.nextElementSibling===el,aligned:Math.abs(game.getBoundingClientRect().left-el.getBoundingClientRect().left)<1,width:Math.abs(game.getBoundingClientRect().width-el.getBoundingClientRect().width)<1};});assert.deepEqual(placement,{after:true,aligned:true,width:true});
   if(width===1440){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`/tmp/feedback-below-game-${engine.name()}.png`,fullPage:true});}
   await page.locator('#hodnotenie').evaluate(el=>el.scrollIntoView({block:'start'}));
   const fit=await page.locator('#hodnotenie').evaluate(el=>({top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom,viewport:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,textarea:el.querySelector('textarea').getBoundingClientRect().height}));

   assert.ok(fit.top>=0&&fit.bottom<=fit.viewport,`feedback fits ${width}x${height}: ${JSON.stringify(fit)}`);
   assert.equal(fit.overflow,false);assert.ok(fit.textarea>=110);
  }
  await page.setViewportSize({width:390,height:844});await page.locator('#hodnotenie').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:`/tmp/feedback-${engine.name()}.png`});
  await page.locator('[name=stars][value="4"]').tap();assert.equal(await page.locator('.rating-stars .is-filled').count(),4);
  await page.locator('[name=stars][value="3"]').tap();assert.equal(await page.locator('.rating-stars .is-filled').count(),3);
  await page.keyboard.press('ArrowRight');assert.equal(await page.locator('.rating-stars .is-filled').count(),4);await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('.rating-stars .is-filled').count(),3);
  await page.locator('#feedback-comment').fill('Papierové šifry boli super. Menej čítania by potešilo.');
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await page.waitForTimeout(150);
  assert.equal(await page.locator('[name=stars]:checked').inputValue(),'3');
  assert.match(await page.locator('#feedback-comment').inputValue(),/Papierové/);
  await page.route('**/api/customer/feedback',route=>route.fulfill({status:503,json:{error:'Skúste odoslať znova.'}}),{times:1});
  await page.locator('#game-feedback button').tap();await page.getByText('Skúste odoslať znova.').waitFor();assert.equal(await page.locator('.rating-stars .is-filled').count(),3);
  await page.locator('#game-feedback button').tap();await page.getByText('✓ Ďakujeme za vaše hodnotenie!').waitFor();
  assert.equal((await first(server.db,'SELECT stars FROM game_feedback WHERE run_id=?',run.id)).stars,3);
  await context.close();
  // A fresh device/session only needs the purchase login, no game token.
  const later=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true}),laterPage=await later.newPage();
  await login(laterPage);await laterPage.getByText('✓ Ďakujeme za vaše hodnotenie!').waitFor();assert.equal(await laterPage.locator('.saved-rating').getAttribute('aria-label'),'3 z 5 hviezdičiek');await later.close();
  const admin=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1440,height:900}}),management=await admin.newPage();management.on('pageerror',e=>errors.push(e.message));
  await management.goto(server.url+'/admin');await management.locator('#password').fill(server.adminPassword);await management.locator('#login-button').click();await management.waitForURL('**/admin');await management.locator('.payment-workspace').waitFor();
  assert.equal(await management.locator('[data-page]').count(),2);assert.equal(await management.locator('[data-page=orders],[data-page=dashboard],#filters').count(),0);
  await management.locator('[data-page=analytics]').click();await management.locator('[data-row]').waitFor();
  assert.equal(await management.locator('.analysis-summary article').count(),4);assert.equal(await management.locator('#view select').count(),1);
  assert.match(await management.locator('.customer-status').innerText(),/1 h 14 min/);
  assert.equal(await management.locator('.step-heading.finish .step-number').innerText(),'Spätná väzba');assert.equal(await management.locator('.journey-dot.finish.done').count(),1);
  await management.screenshot({path:`/tmp/analysis-${engine.name()}.png`,fullPage:true});
  await management.locator('#expand-analysis').click();assert.equal(await management.locator('.workspace').evaluate(e=>e.getBoundingClientRect().left),0);await management.keyboard.press('Escape');assert.equal(await management.locator('body.analysis-wide').count(),0);
  await management.locator('.analysis-filter summary').click();await management.locator('#customer-state').selectOption('playing');await management.locator('#view[aria-busy=false]').waitFor();assert.equal(await management.locator('[data-row]').count(),0);assert.equal(await management.locator('.analysis-summary article').nth(2).locator('strong').innerText(),'1');
  await management.locator('#customer-state').selectOption('');await management.locator('[data-row]').waitFor();
  // Populate only the payment-report fixture, while the player lookup remains real.
  await execute(server.db,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at,stripe_session_id) VALUES(?,?,?,?,?,?,?)','feedback-link',server.email,'','["episode-1"]',1499,Date.now(),'qa-episode-1');
  await management.route('**/api/admin/payments?*',async route=>{const response=await route.fetch(),report=await response.json();report.rows=[{id:'feedback-link',email:server.email,products:['episode-1'],createdAt:Date.now(),totalCents:1499,status:'successful',method:'card',issues:[]}];report.total=report.matchingTotal=1;report.attemptCounts.successful=1;await route.fulfill({response,json:report});});
  await management.locator('[data-page=payments]').click();await management.locator('.payment-player-link').first().click();await management.locator('.inline-detail .analysis-feedback').waitFor();
  assert.match(management.url(),/#analytics\?email=/);assert.equal(await management.locator('[data-row]').count(),1);assert.equal(await management.locator('[data-journey]').getAttribute('aria-expanded'),'true');assert.match(await management.locator('.analysis-feedback').innerText(),/Papierové šifry/);
  await management.reload();await management.locator('.inline-detail .analysis-feedback').waitFor();assert.equal(await management.locator('#notice').innerText(),'');
  await management.locator('.analysis-player a').click();await management.locator('.analysis-player').waitFor({state:'detached'});await management.locator('[data-row]').waitFor();
  await admin.close();assert.deepEqual(errors,[]);
  console.log(`PASS ${engine.name()}: phone screen fit, cumulative stars, failure retry, later login, minimal admin, global totals, duration, feedback status and payment/player deep link.`);
 }finally{await browser.close();await server.mf.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
