// Real gateway + Worker + isolated D1: touch UI, saved preparation and purchase isolation.
const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const {workerServer}=await import('./helpers/worker-server.mjs');
 const {credentials}=await import('../admin/src/customer-auth.mjs');
 const {createOrder}=await import('../admin/src/game-service.mjs');
 const {execute}=await import('../admin/src/db.mjs');
 const server=await workerServer(),engine=process.env.QA_BROWSER==='webkit'?webkit:chromium;
 const browser=await engine.launch({headless:true,...(engine===webkit?{env:{...process.env,WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS:'1',WEBKIT_DISABLE_COMPOSITING_MODE:'1',JSC_useJIT:'0'}}:{})});
 try{
  const secondPassword='qa-only-second-purchase-password',record=await credentials(server.email,secondPassword,'a'.repeat(64)),at=Date.now();
  await execute(server.db,'INSERT INTO customers VALUES(?,?,?,?)','qa-second',server.email,'Druhá rodina',at);
  await execute(server.db,'INSERT INTO customer_credentials VALUES(?,?,?,?,?)','qa-second',record.lookup,record.salt,record.hash,at);
  for(const productId of ['episode-1','story-book-after'])await createOrder(server.db,{customerId:'qa-second',productId,externalReference:'qa-second-'+productId});
  const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const signIn=async password=>{await page.goto(server.url+'/Supervisor');await page.locator('#customer-login').waitFor();await page.locator('#login-email').fill(server.email);await page.locator('#login-password').fill(password);await page.locator('#customer-login button').tap();await page.locator('#start-game').waitFor();};
  const toggle=async key=>{await page.locator(`label[for="prep-${key}"]`).tap();await page.waitForFunction(()=>!document.querySelector('[data-preparation="printed"]').disabled);};
  const disclosure=id=>page.locator(`[aria-controls="${id}"]`);
  for(const route of ['/supervisor-preparation.json','/_protected/supervisor-preparation.json','/game-data.js','/assets/printables/vsetky-materialy.pdf'])assert.equal((await server.mf.dispatchFetch(server.url+route)).status,404,route);
  await signIn(server.customerPassword);
  assert.equal(await page.locator('.game-heading h2').innerText(),'Príprava na hru');
  assert.equal(await page.locator('#placement-details').isVisible(),false);assert.equal(await page.locator('#phone-details').isVisible(),false);
  assert.equal(await page.locator('.download-icon svg').count(),1);
  assert.equal(await page.locator('#start-game').isDisabled(),true);
  const first=await page.evaluate(()=>fetch('/api/customer/portal').then(r=>r.json()));const firstEntitlement=first.entitlement.id;
  assert.equal((await page.evaluate(()=>fetch('/supervisor-preparation.json').then(r=>r.json()))).length,7);
  await page.locator('[data-library-book="story-book-before"].is-owned').waitFor();
  for(const width of [320,360,390,430,901]){
   await page.setViewportSize({width,height:844});await page.evaluate(()=>scrollTo(0,0));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`no horizontal overflow at ${width}`);
   const targets=await page.locator('[data-expand],.download,#logout').evaluateAll(nodes=>nodes.map(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})));
   assert.ok(targets.every(t=>t.width>=44&&t.height>=44),'comfortable touch targets');
   assert.ok((await page.locator('.supervisor-hero').boundingBox()).height<130,'compact introduction');
   const labels=await page.locator('.task-progress li').evaluateAll(nodes=>nodes.map(n=>{const label=n.querySelector('span').getBoundingClientRect(),marker=n.querySelector('b').getBoundingClientRect(),item=n.getBoundingClientRect();return {markerTop:marker.top,above:label.bottom<=marker.top,inside:label.left>=item.left-.5&&label.right<=item.right+.5,unwrapped:n.querySelector('span').scrollWidth<=n.querySelector('span').clientWidth};}));assert.ok(labels.every(n=>n.above&&n.inside&&n.unwrapped),'names fit above the task markers');
   assert.ok(labels.every(n=>Math.abs(n.markerTop-labels[0].markerTop)<1),'all seven markers stay in one row at '+width+'px');
   assert.deepEqual(await page.locator('.task-location-full').allTextContents(),['Kúpeľňa','Okno','Stolička','Topánky','Posteľ','Chladnička','Gauč']);
   assert.deepEqual(await page.locator('.task-progress b').allTextContents(),['U1','U2','U3','U4','U5','U6','U7']);await page.locator('.game-progress').screenshot({path:`/tmp/progress-${engine.name()}-${width}.png`});
   await page.screenshot({path:`/tmp/portal-${engine.name()}-${width}.png`,fullPage:true});
  }
  await page.setViewportSize({width:390,height:844});
  await disclosure('phone-details').tap();assert.equal(await page.locator('#phone-details').isVisible(),true);assert.match(await page.locator('#phone-details').innerText(),/ktorý bude používať váš tím/);assert.equal(await page.locator('#phone-details p').count(),1);assert.equal(await page.locator('#phone-details a').count(),0);
  assert.equal(await page.locator('[data-preparation="device-understood"]').isChecked(),false,'expanding does not check the step');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'phone explanation reflows');await page.screenshot({path:`/tmp/portal-${engine.name()}-phone-details.png`,fullPage:true});
  await disclosure('phone-details').tap();
  await disclosure('placement-details').tap();assert.equal(await page.locator('.placement-item').count(),7);
  assert.match(await page.locator('.placement-item').first().innerText(),/medzi uteráky/);
  for(const n of [1,4,7])await toggle('placed-'+n);
  assert.equal(await page.locator('.placement-item input:checked').count(),3);
  assert.equal(await page.locator('[data-preparation="placed"]').evaluate(n=>n.indeterminate),true);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'expanded hiding places reflow');await page.screenshot({path:`/tmp/portal-${engine.name()}-placement-details.png`,fullPage:true});
  await page.reload();await page.locator('#start-game').waitFor();assert.equal(await page.locator('#placement-details').isVisible(),false);assert.equal(await page.locator('.placement-item input:checked').count(),3);
  await toggle('placed');await disclosure('placement-details').tap();assert.equal(await page.locator('.placement-item input:checked').count(),7);
  await toggle('placed-2');assert.equal(await page.locator('[data-preparation="placed"]').isChecked(),false);assert.equal(await page.locator('.placement-item input:checked').count(),6);
  await toggle('placed-2');assert.equal(await page.locator('[data-preparation="placed"]').isChecked(),true);
  await page.route('**/api/customer/checklist',route=>route.abort(),{times:1});
  await toggle('printed');assert.equal(await page.locator('[data-preparation="printed"]').isChecked(),false);assert.match(await page.locator('#start-status').innerText(),/nepodarilo uložiť/);
  await toggle('printed');await toggle('device-understood');assert.equal(await page.locator('#start-game').isEnabled(),true);
  await page.locator('[data-preparation="printed"]').focus();await page.keyboard.press('Space');await page.waitForFunction(()=>!document.querySelector('[data-preparation="printed"]').disabled);assert.equal(await page.locator('[data-preparation="printed"]').evaluate(n=>document.activeElement===n),true,'saving retains keyboard focus');await page.keyboard.press('Space');await page.locator('#start-game:not([disabled])').waitFor();
  await page.reload();await page.locator('#start-game:not([disabled])').waitFor();assert.match(await page.locator('[data-preparation-count]').innerText(),/3 z 3/);
  // Increased text and desktop composition both remain usable.
  await page.addStyleTag({content:'.supervisor-page{font-size:200%} .preparation-step strong,.preparation-step small,.download strong,.download small{font-size:1em}'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'enlarged text reflows');await page.screenshot({path:`/tmp/portal-${engine.name()}-large-text.png`,fullPage:true});
  await page.reload();await page.locator('#start-game').waitFor();
  const desktop=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1280,height:900}});await desktop.addCookies(await context.cookies());const desk=await desktop.newPage();await desk.goto(server.url+'/Supervisor');await desk.locator('#start-game').waitFor();await desk.locator('[data-library-book="story-book-before"].is-owned').waitFor();assert.ok(await desk.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await desk.screenshot({path:`/tmp/portal-${engine.name()}-desktop.png`,fullPage:true});await desktop.close();
  await page.locator('#start-game').tap();await page.waitForURL('**/hra');await page.goto(server.url+'/Supervisor');await page.getByText('Vaša hra práve prebieha.').waitFor();assert.match(await page.locator('.current-task').innerText(),/Teraz: U1 · Kúpeľňa/);
  assert.equal(await page.locator('.saved-preparation').getAttribute('open'),null);assert.equal(await page.locator('#start-game').isEnabled(),true);
  assert.equal(await page.locator('.saved-preparation summary').innerText(),'Príprava na hru');
  assert.equal(await page.locator('.preparation-checklist').isVisible(),false);assert.equal(await page.locator('#start-status').isVisible(),false);
  assert.match(await page.locator('#start-game').innerText(),/^Spustiť hru/);
  assert.ok(await page.locator('.game-card').evaluate(card=>{const details=card.querySelector('.saved-preparation'),button=card.querySelector('.start-panel'),progress=card.querySelector('.game-progress');return !!(details.compareDocumentPosition(button)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(button.compareDocumentPosition(progress)&Node.DOCUMENT_POSITION_FOLLOWING);}), 'collapsed preparation, game button and progress appear in that order');
  for(const width of [390,1280]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`/tmp/portal-${engine.name()}-active-${width}.png`,fullPage:true});}
  await page.setViewportSize({width:390,height:844});await page.locator('.saved-preparation summary').tap();assert.equal(await page.locator('.preparation-checklist').isVisible(),true);assert.equal(await page.locator('[data-preparation="printed"]').isChecked(),true);await page.locator('.saved-preparation summary').tap();
  await page.locator('#start-game').tap();await page.waitForURL('**/hra');await page.locator('.message-modal').waitFor();await page.goto(server.url+'/Supervisor');await page.locator('.saved-preparation').waitFor();
  assert.equal((await server.db.prepare('SELECT COUNT(*) count FROM game_runs').first()).count,1,'opening the started game resumes its existing run');
  await page.locator('#logout').tap();await page.locator('#customer-login').waitFor();await signIn(secondPassword);
  assert.match(await page.locator('[data-preparation-count]').innerText(),/0 z 3/);assert.equal(await page.locator('.placement-item input:checked').count(),0);
  await page.locator('[data-library-book="story-book-after"].is-owned').waitFor();assert.equal(await page.locator('[data-library-book="story-book-before"].is-owned').count(),0);
  assert.equal(await page.locator('.library-card').first().getAttribute('data-library-book'),'story-book-after','owned books first');
  const denied=await page.evaluate(async entitlementId=>(await fetch('/api/customer/checklist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entitlementId,values:{placed:false}})})).status,firstEntitlement);assert.equal(denied,403);
  await page.locator('#logout').tap();await page.locator('#customer-login').waitFor();await signIn(server.customerPassword);assert.equal(await page.locator('#start-game').isEnabled(),true,'returning to the first purchase keeps its device and game');
  await page.locator('.saved-preparation summary').tap();assert.equal(await page.locator('[data-preparation="placed"]').isChecked(),true);
  const otherContext=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true}),other=await otherContext.newPage();await other.goto(server.url+'/Supervisor');await other.locator('#login-email').fill(server.email);await other.locator('#login-password').fill(server.customerPassword);await other.locator('#customer-login button').tap();await other.locator('#start-game').waitFor();assert.equal(await other.locator('#start-game').isDisabled(),true);assert.match(await other.locator('#start-status').innerText(),/inom telefóne/);await otherContext.close();
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS ${engine.name()}: phone layout, real touch disclosures, saved individual/bulk preparation, recovery, two same-email purchases, library and device isolation.`);
 }finally{await browser.close();await server.mf.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
