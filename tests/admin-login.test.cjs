const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin='https://pixelkovia.rodulab.com';
(async()=>{
 for(const browserType of [chromium,webkit]){
  const executablePath=process.env[browserType===chromium?'QA_CHROMIUM_EXECUTABLE':'QA_WEBKIT_EXECUTABLE'];
  const browser=await browserType.launch({headless:true,...(executablePath?{executablePath}:{})});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   const page=await context.newPage(),errors=[];let deny=true,submissions=0;
   page.on('pageerror',error=>errors.push(error.message));
   await context.route('**/*',async route=>{
    const request=route.request(),path=new URL(request.url()).pathname;
    if(path==='/api/admin/context')return route.fulfill({status:401,json:{error:'Vyžaduje sa heslo do administrácie.'}});
    if(path==='/api/admin/login'){
     submissions++;assert.equal(request.method(),'POST');
     assert.deepEqual(request.postDataJSON(),{password:'local-browser-fixture-password'});
     return route.fulfill({status:deny?401:200,json:deny?{error:'Heslo nie je správne.'}:{authenticated:true}});
    }
    if(path==='/admin')return route.fulfill({contentType:'text/html',body:'<h1>Predajný funnel</h1>'});
    const file={'/admin/login':'login.html','/admin/login.css':'login.css','/admin/login.js':'login.js'}[path];
    if(!file)return route.abort();
    await route.fulfill({contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html',body:fs.readFileSync('admin/public/'+file,'utf8')});
   });
   await page.goto(origin+'/admin/login#payments');
   assert.equal(await page.locator('[name=username]').getAttribute('autocomplete'),'username');
   assert.equal(await page.locator('#password').getAttribute('autocomplete'),'current-password');
   for(const width of [320,390,1512]){
    await page.setViewportSize({width,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.ok((await page.locator('#login-button').boundingBox()).height>=44);
   }
   await page.setViewportSize({width:390,height:844});
   if(process.env.QA_SCREENSHOT_DIR)await page.screenshot({path:process.env.QA_SCREENSHOT_DIR+'/admin-login-'+browserType.name()+'.png',fullPage:true});
   await page.locator('#password').fill('local-browser-fixture-password');
   await page.locator('#login-button').click();
   await page.waitForFunction(()=>document.querySelector('#login-status').textContent==='Heslo nie je správne.');
   assert.equal(await page.locator('#login-button').isEnabled(),true);
   deny=false;
   await page.locator('#login-button').click();
   await page.waitForURL(origin+'/admin#marketing');
   assert.equal(submissions,2);assert.deepEqual(errors,[]);
   await context.close();
   console.log(browserType.name()+': mobile login, failure recovery and default funnel passed.');
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
