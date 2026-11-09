// Actual gateway, Worker and isolated D1: the finale tolerates missing telemetry.
const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const {workerServer}=await import('./helpers/worker-server.mjs');
 const {first}=await import('../admin/src/db.mjs');
 const server=await workerServer(),engine=process.env.QA_BROWSER==='webkit'?webkit:chromium;
 const browser=await engine.launch({headless:true,...(engine===webkit?{env:{...process.env,WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS:'1',WEBKIT_DISABLE_COMPOSITING_MODE:'1',JSC_useJIT:'0'}}:{})});
 try{
  const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(server.url+'/Supervisor');await page.locator('#login-email').fill(server.email);await page.locator('#login-password').fill(server.customerPassword);await page.locator('#customer-login button').tap();await page.locator('#start-game').waitFor();
  for(const id of ['printed','placed','device-understood']){await page.locator(`[data-preparation="${id}"]`).check();await page.waitForFunction(()=>!document.querySelector('[data-preparation="printed"]').disabled);}
  await page.locator('#start-game').tap();await page.waitForURL('**/hra');
  const runId=await page.evaluate(()=>PIXELKOVIA_RUN.run.id);
  const sync=await page.evaluate(async()=>{const r=await fetch('/api/customer/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:PIXELKOVIA_RUN.run.id,progress:{stage:7,completed:[2,3,4,5,6]}})});return r.status;});assert.equal(sync,200);

  // Another authenticated phone cannot finish this phone's run.
  const otherContext=await browser.newContext({ignoreHTTPSErrors:true}),other=await otherContext.newPage();
  try{
   await other.goto(server.url+'/Supervisor');await other.locator('#login-email').fill(server.email);await other.locator('#login-password').fill(server.customerPassword);await other.locator('#customer-login button').click();await other.locator('#start-game').waitFor();
   assert.equal(await other.evaluate(async runId=>(await fetch('/api/customer/finish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId})})).status,runId),403);
  }finally{await otherContext.close();}
  assert.equal((await first(server.db,'SELECT status FROM game_runs WHERE id=?',runId)).status,'active');

  const openFinale=async()=>{await page.goto(server.url+'/hra?signal=navrat');await page.locator('#answer').fill('SVETLO');await page.locator('.answer-form button').tap();await page.locator('.finale-exit').waitFor();};
  await openFinale();
  assert.equal(await page.locator('.finale-exit').innerText(),'Ohodnotiť hru');
  await page.evaluate(()=>PIXELKOVIA_SAVE());
  assert.equal((await first(server.db,'SELECT COUNT(*) count FROM game_stage_progress WHERE run_id=? AND completed_at IS NOT NULL',runId)).count,6);
  assert.equal((await first(server.db,'SELECT status FROM game_runs WHERE id=?',runId)).status,'active','solving task seven does not yet finish the game');
  await page.locator('.finale-exit').tap();await page.waitForURL('**/Supervisor');assert.equal((await first(server.db,'SELECT status FROM game_runs WHERE id=?',runId)).status,'active','leaving before video end keeps the run active');
  await openFinale();

  // The real video ending queues completion, without an exit-button tap.
  await page.route('**/api/customer/sync',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Dočasný výpadok ukladania.'})}));
  await page.route('**/api/customer/finish',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Záver sa nepodarilo uložiť.'})}),{times:2});
  await page.waitForFunction(()=>{const v=document.querySelector('#finale-video');return v&&!v.paused&&v.currentTime>.1;});
  await page.locator('#finale-video').evaluate(v=>{v.playbackRate=8;});
  await page.getByRole('button',{name:/Záver sa nepodarilo uložiť.*Skúsiť znova/}).waitFor();
  assert.ok(await page.locator('#finale-video').evaluate(v=>v.ended),'a real ended event starts automatic completion');
  assert.equal(new URL(page.url()).pathname,'/hra');assert.equal((await first(server.db,'SELECT status FROM game_runs WHERE id=?',runId)).status,'active');
  assert.equal(await page.evaluate(()=>localStorage.getItem('pixelkovia-finish-'+PIXELKOVIA_RUN.run.id)),'1','video completion remains queued after a failed request');
  assert.equal(await page.evaluate(()=>!!localStorage.getItem('pixelkovia-pending-'+PIXELKOVIA_RUN.run.id)),true,'failed delivery retains the final progress snapshot');
  await page.locator('.finale-exit').tap();await page.getByRole('button',{name:/Záver sa nepodarilo uložiť.*Skúsiť znova/}).waitFor();
  await page.reload();await page.waitForFunction(()=>PIXELKOVIA_COMPLETION.status==='completed');
  assert.equal(new URL(page.url()).pathname,'/hra','restored completion does not navigate away automatically');
  assert.equal(await page.evaluate(()=>localStorage.getItem('pixelkovia-finish-'+PIXELKOVIA_RUN.run.id)),null,'successful retry removes the pending finish');
  const completed=await first(server.db,'SELECT completed_at FROM game_runs WHERE id=?',runId);
  const {customers}=await import('../admin/src/analytics.mjs');
  const analysis=await customers(server.db,new URLSearchParams({q:server.email}));
  assert.equal(analysis.rows[0].state,'completed');assert.equal(analysis.rows[0].completed_at,completed.completed_at,'admin completion time exists without pressing the exit button');
  // Watching the finale again must reuse the existing completion.
  await page.locator('#answer').fill('SVETLO');await page.locator('.answer-form button').tap();await page.locator('.finale-exit').waitFor();
  await page.waitForFunction(()=>{const v=document.querySelector('#finale-video');return v&&!v.paused&&v.currentTime>.1;});await page.locator('#finale-video').evaluate(v=>{v.playbackRate=8;});await page.waitForFunction(()=>document.querySelector('#finale-video').ended);
  assert.equal((await first(server.db,'SELECT completed_at FROM game_runs WHERE id=?',runId)).completed_at,completed.completed_at);
  await page.locator('.finale-exit').tap();await page.waitForURL('**/Supervisor#hodnotenie');await page.locator('#game-feedback').waitFor();
  assert.equal(await page.locator('.task-progress .done').count(),6);assert.equal(await page.locator('.progress-heading strong').innerText(),'6 zo 7');
  assert.equal(await page.locator('.run-statistics div').filter({has:page.locator('dt',{hasText:'Vyriešené úlohy'})}).locator('dd').innerText(),'6 / 7');
  assert.equal(await page.locator('.current-task').innerText(),'✓ Hra je ukončená.');
  assert.equal(await first(server.db,'SELECT * FROM game_stage_progress WHERE run_id=? AND stage=1 AND completed_at IS NOT NULL',runId),null);
  const entitlement=await first(server.db,'SELECT * FROM entitlements WHERE id=(SELECT entitlement_id FROM game_runs WHERE id=?)',runId);
  const repeated=await page.evaluate(async runId=>{const r=await fetch('/api/customer/finish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId})});return {status:r.status,body:await r.json()};},runId);
  assert.equal(repeated.status,200);assert.equal(repeated.body.duplicate,true);
  assert.equal((await first(server.db,'SELECT replay_until FROM entitlements WHERE id=?',entitlement.id)).replay_until,entitlement.replay_until);
  assert.equal((await first(server.db,"SELECT COUNT(*) count FROM game_events WHERE run_id=? AND type='completed'",runId)).count,1);
  await page.locator('[data-library-book="story-book-before"].is-owned').waitFor();
  await page.locator('[name="stars"][value="4"]').check({force:true});await page.locator('#feedback-comment').fill('Dokončené aj pri chýbajúcom zázname.');await page.locator('#game-feedback button').tap();await page.getByText('✓ Ďakujeme za vaše hodnotenie!').waitFor();
  await page.screenshot({path:`/tmp/finale-recovery-${engine.name()}.png`,fullPage:true});
  assert.deepEqual(errors,[]);await context.close();
  console.log(`PASS ${engine.name()}: automatic video-end completion, early exit, failed sync/finish, retry and reload, device authorization, admin completion time, honest statistics, replay, feedback and library.`);
 }finally{await browser.close();await server.mf.dispose();}
})().catch(error=>{console.error(error);process.exitCode=1;});
