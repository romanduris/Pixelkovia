// Real authorized player route: every Čipko board stays usable without scrolling.
const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const {workerServer}=await import('./helpers/worker-server.mjs'),server=await workerServer();
 const engine=process.env.QA_BROWSER==='webkit'?webkit:chromium;
 const browser=await engine.launch({headless:true,...(engine===webkit?{env:{...process.env,WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS:'1',WEBKIT_DISABLE_COMPOSITING_MODE:'1',JSC_useJIT:'0'}}:{})});
 try{
  const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:390,height:664},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(server.url+'/Supervisor');await page.locator('#login-email').fill(server.email);await page.locator('#login-password').fill(server.customerPassword);await page.locator('#customer-login button').tap();await page.locator('#start-game').waitFor();
  for(const id of ['printed','placed','device-understood']){await page.locator(`[data-preparation="${id}"]`).check();await page.waitForFunction(()=>!document.querySelector('[data-preparation="printed"]').disabled);}
  await page.locator('#start-game').tap();await page.waitForURL('**/hra');await page.goto(server.url+'/hra?signal=cipko');await page.locator('.cipko-pixels').waitFor();
  const seed=await page.evaluate(()=>JSON.parse(localStorage.getItem('pixelkovia-run-'+PIXELKOVIA_RUN.run.id)));
  const settle=async()=>{await page.waitForTimeout(350);await page.waitForLoadState('networkidle');};
  const reset=async(round,won=false)=>{
   await settle();
   await page.evaluate(({seed,round,won})=>{const s=structuredClone(seed);CIPKO_GAME.data(s);s.cipko.round=round;s.cipko.won=won;localStorage.setItem('pixelkovia-run-'+PIXELKOVIA_RUN.run.id,JSON.stringify(s));},{seed,round,won});
   await page.reload();await page.locator('.cipko-screen').waitFor();await page.evaluate(()=>document.fonts.ready);
  };
  // Render actual game templates for the size matrix without repeatedly navigating
  // away from an in-flight progress sync. Real interactions are exercised below.
  const sprite=await page.locator('.signal-content>.pixel-sprite').evaluate(e=>e.outerHTML);
  const previewLayout=async(round,won=false)=>{
   await page.evaluate(({seed,sprite,round,won})=>{const s=structuredClone(seed);CIPKO_GAME.data(s);s.cipko.round=round;s.cipko.won=won;document.querySelector('.cipko-screen .signal-content').innerHTML=sprite+CIPKO_GAME.render(s);},{seed,sprite,round,won});
   await page.evaluate(()=>document.fonts.ready);
  };
  async function fits(label){
   const fit=await page.evaluate(()=>{const root=document.querySelector('#app'),screen=document.querySelector('.cipko-screen');return {horizontal:root.scrollWidth<=root.clientWidth+1,vertical:root.scrollHeight<=root.clientHeight+1,rootHeight:root.clientHeight,contentHeight:root.scrollHeight,targets:[...screen.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();return {width:r.width,height:r.height,top:r.top,bottom:r.bottom};})};});
   assert.ok(fit.horizontal&&fit.vertical,label+': '+JSON.stringify(fit));
   assert.ok(fit.targets.every(t=>t.width>=44&&t.height>=44&&t.top>=0&&t.bottom<=fit.rootHeight+1),label+': visible touch targets of at least 44px: '+JSON.stringify(fit.targets));
  }
  for(const [width,height] of [[320,480],[320,568],[360,640],[390,664],[390,844],[430,932]]){
   await page.setViewportSize({width,height});
   for(let round=0;round<4;round++){
    await previewLayout(round);await fits(`${width}x${height}, round ${round+1}`);
    if(width===320||width===390&&height===664)await page.screenshot({path:`/tmp/cipko-fit-${engine.name()}-${width}-${height}-round-${round}.png`});
    if(round<3){await previewLayout(round,true);await fits(`${width}x${height}, result ${round+1}`);}
   }
   await previewLayout(4);await fits(`${width}x${height}, paper handoff`);
   if(width===320||width===390&&height===664)await page.screenshot({path:`/tmp/cipko-reward-${engine.name()}-${width}-${height}.png`});
  }
  await page.setViewportSize({width:320,height:568});await reset(1);
  const from=page.locator('[data-kind="select"][data-index="2"]'),to=page.locator('[data-kind="slot"][data-index="2"]');
  if(engine===chromium){
   const a=await from.boundingBox(),b=await to.boundingBox(),cdp=await context.newCDPSession(page);
   const x=a.x+a.width/2,y=a.y+a.height/2,dx=b.x+b.width/2-x,dy=b.y+b.height/2-y;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let k=1;k<=10;k++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*k/10,y:y+dy*k/10}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
  }else await from.dragTo(to);
  assert.equal(await page.locator('.cipko-slot.placed').count(),1,'dragging between the side-by-side boards places a tile');
  await settle();await page.reload();assert.equal(await page.locator('.cipko-slot.placed').count(),1,'the placed tile survives reload');
  await reset(0);
  // The complete touch flow checks all mechanics after resizing, including wrong answers.
  await require('./helpers/cipko.cjs')(page);await fits('completed touch flow');
  await settle();await page.reload();assert.equal(await page.locator('.cipko-finished').count(),1,'completion survives reload');
  const portal=await page.evaluate(()=>fetch('/api/customer/portal').then(r=>r.json()));assert.equal(portal.run.status,'active');assert.ok(portal.run.stages.some(s=>s.stage===5&&s.completed_at!==null),'Čipko completion saves without a close-window button');
  // Guardy also saves automatically and leaves the message available.
  const finishRequests=[];page.on('request',r=>{if(new URL(r.url()).pathname==='/api/customer/finish')finishRequests.push(r.url());});
  await page.setViewportSize({width:390,height:844});
  await page.goto(server.url+'/hra?signal=guardy');await page.locator('#answer').fill('3615724');await page.locator('.answer-form button').tap();await page.locator('.guardy-result').waitFor();
  assert.equal(await page.locator('[data-action="close-window"]').count(),0,'Guardy has no close-window button');
  await page.waitForFunction(()=>{const a=document.querySelector('#guardy-audio');return a&&!a.paused&&a.currentTime>.1;});
  await page.locator('[data-action="guardy-audio-toggle"]').tap();
  await page.locator('[data-action="read-guardy-message"]').tap();assert.match(await page.locator('dialog[open]').innerText(),/pod gaučom/);await page.locator('dialog[open] [data-action="close"]').tap();
  await page.screenshot({path:`/tmp/guardy-without-close-${engine.name()}.png`});
  await settle();await page.reload();await page.locator('.guardy-result').waitFor();
  const saved=await page.evaluate(()=>fetch('/api/customer/portal').then(r=>r.json()));assert.equal(saved.run.status,'active');assert.ok(saved.run.stages.some(s=>s.stage===6&&s.completed_at!==null),'Guardy completion saves without closing the page');
  assert.match(await page.locator('.task-completion-note').innerText(),/telefón odložiť/);
  assert.deepEqual(finishRequests,[],'completing Guardy never finishes the whole game');
  assert.deepEqual(errors,[]);await context.close();
  console.log(`PASS ${engine.name()}: four boards, result screens and paper handoff fit 320x480–430x932; touch controls, complete gameplay, saved progress and Guardy message playback preserved without close-window buttons.`);
 }finally{await browser.close();await server.mf.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
