const assert=require('node:assert/strict'),fs=require('node:fs/promises');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const {workerServer}=await import('./helpers/worker-server.mjs');
  for(const engine of (process.env.QA_BROWSER?[{chromium,webkit}[process.env.QA_BROWSER]]:[chromium])){
   const server=await workerServer();
   const browser=await engine.launch({headless:true,...(engine===webkit?{env:{...process.env,WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS:'1',WEBKIT_DISABLE_COMPOSITING_MODE:'1',JSC_useJIT:'0'}}:{})});
   try{
    const newContext=options=>browser.newContext({ignoreHTTPSErrors:true,...options});
    const context=await newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    const requestGet=async path=>{const cookie=(await context.cookies(server.url)).map(c=>c.name+'='+c.value).join('; ');const response=await server.mf.dispatchFetch(server.url+path,{headers:{cookie},redirect:'manual'});return {status:()=>response.status};};
    for(const route of ['/game-data.js','/assets/printables/vsetky-materialy.pdf','/_protected/game-data.js','/parent','/storyboard.html','/books-content/before.json'])assert.equal((await requestGet(route)).status(),404,route);
    assert.equal((await requestGet('/hra')).status(),303);
    await page.goto(server.url+'/Supervisor');await page.locator('#customer-login').waitFor();
    await page.locator('#login-email').fill(server.email);await page.locator('#login-password').fill(server.customerPassword);await page.locator('#customer-login button').click();await page.locator('#start-game').waitFor();assert.equal(await page.locator('#start-game').isDisabled(),true);
    await page.locator('[data-library-book="story-book-before"].is-owned').waitFor();assert.equal(await page.locator('[data-library-book="story-book-after"].is-owned').count(),0);
    assert.equal((await requestGet('/assets/printables/vsetky-materialy.pdf')).status(),200);
    assert.equal((await requestGet('/admin/storyboard')).status(),303);
    await page.locator('[data-device-help]').click();assert.equal(await page.locator('#device-help').isVisible(),true);await page.locator('[data-close-help]').last().click();
    for(const width of [390,1280]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Supervisor overflow');await page.screenshot({path:'/tmp/pixelkovia-supervisor-'+engine.name()+'-'+width+'.png',fullPage:true});}
    await page.locator('[data-preparation="printed"]').check();await page.waitForFunction(()=>!document.querySelector('#start-status').textContent.includes('Uklad'));await page.waitForTimeout(150);
    await page.locator('[data-preparation="placed"]').check();await page.waitForTimeout(150);
    await page.locator('[data-preparation="device-understood"]').check();await page.locator('#start-game:not([disabled])').waitFor();
    await page.locator('#start-game').click();await page.waitForURL('**/hra');await page.locator('.message-modal').waitFor();
    await page.goto(server.url+'/hra?signal=plugy');

    const cells=await page.evaluate(()=>GAME.plugyPuzzle.grid.flat().flatMap((v,i)=>GAME.plugyPuzzle.values.includes(v)?[i]:[]));
    for(const cell of cells)await page.locator(`[data-cell="${cell}"]`).click();await page.locator('.plugy-connected').waitFor();await page.waitForTimeout(700);
    await page.goto(server.url+'/Supervisor');await page.locator('.task-progress .done').first().waitFor();assert.ok(await page.locator('.task-progress .done').count()>=1);
    const other=await newContext({});const otherPage=await other.newPage();await otherPage.goto(server.url+'/Supervisor');await otherPage.locator('#login-email').fill(server.email);await otherPage.locator('#login-password').fill(server.customerPassword);await otherPage.locator('#customer-login button').click();await otherPage.locator('#start-game').waitFor();assert.equal(await otherPage.locator('#start-game').isDisabled(),true,'another phone cannot take over a running game');await other.close();
    await page.goto(server.url+'/hra?signal=miky');await page.locator('#answer').fill('741296');await page.locator('.answer-form button').click();await page.locator('.signal-connected').waitFor();
    await page.goto(server.url+'/hra?signal=cipko');await require('./helpers/cipko.cjs')(page,{touch:false});
    await page.goto(server.url+'/hra?signal=guardy');await page.locator('#answer').fill('5817264');await page.locator('.answer-form button').click();await page.locator('.guardy-result').waitFor();
    await page.goto(server.url+'/hra?signal=navrat');await page.locator('#answer').fill('SVETLO');await page.locator('.answer-form button').click();await page.locator('.finale-exit').waitFor();
    await page.locator('.finale-exit').click();await page.waitForURL('**/Supervisor#hodnotenie');await page.locator('#game-feedback').waitFor();assert.equal(await page.locator('.task-progress .done').count(),7);
    await page.locator('[name="stars"][value="5"]').check({force:true});await page.locator('#feedback-comment').fill('Výborné spoločné dobrodružstvo.');await page.locator('#game-feedback button').click();await page.getByText('✓ Ďakujeme za vaše hodnotenie!').waitFor();
    await page.goto(server.url+'/admin');await page.waitForURL('**/admin/login');await page.locator('#password').fill(server.adminPassword);await page.locator('#login-button').click();await page.waitForURL('**/admin');await page.locator('#view[aria-busy="false"]').waitFor();assert.equal(await page.locator('#notice').textContent(),'');
    await page.goto(server.url+'/admin/storyboard');await page.locator('.studio-timeline').waitFor();assert.equal(await page.locator('.storyboard').count(),9);
    await page.goto(server.url+'/kniznica/citat?book=story-book-after');await page.locator('.book-story').first().waitFor();
    assert.deepEqual(errors,[]);await context.close();console.log('PASS browser journey: '+engine.name());
   }finally{await browser.close();await server.mf.dispose();}
  }
  console.log('PASS: Workers/D1 authorization, login, full seven-puzzle journey, checklist, device binding, feedback, admin and storyboard.');
})().catch(e=>{console.error(e);process.exitCode=1;});
