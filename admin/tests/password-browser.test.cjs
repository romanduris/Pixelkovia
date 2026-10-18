// Opt-in end-to-end test: uses a protected file, never accepts/prints password arguments.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const base=new URL(process.env.ADMIN_BASE_URL||'');
 assert.ok(base.protocol==='https:'||['localhost','127.0.0.1'].includes(base.hostname),'Use HTTPS or a loopback test server.');
 const password=fs.readFileSync(process.env.TQ_ADMIN_PASSWORD_FILE||'/tmp/treasurequest-admin-password','utf8');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
  const errors=[];page.on('pageerror',()=>errors.push('Browser script error'));
  await page.goto(base.href);await page.waitForURL('**/login');
  await page.locator('#login-form').waitFor();
  for(const width of [320,390,1512]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Login horizontal overflow');
   assert.ok((await page.locator('#login-button').boundingBox()).height>=44);
  }
  if(process.env.QA_SCREENSHOT_DIR)await page.screenshot({path:process.env.QA_SCREENSHOT_DIR+'/treasurequest-login.png',fullPage:true});
  await page.locator('#password').fill(password);await page.locator('#login-button').click();
  await page.waitForURL(url=>url.pathname==='/',{timeout:30000});
  await page.locator('#view[aria-busy="false"]').waitFor();
  assert.equal(await page.locator('#mode-label').textContent(),'Prihlásenie heslom');
  assert.equal(await page.locator('#notice').textContent(),'');
  const cookies=await context.cookies(),session=cookies.find(c=>c.name==='__Host-tq-admin');
  assert.ok(session?.secure&&session?.httpOnly&&session?.sameSite==='Strict');
  const beforeLogoutCookie=session.name+'='+session.value;
  for(const section of ['customers','orders','analytics','emails','events','dashboard']){
   await page.locator('[data-page="'+section+'"]').click();
   await page.locator('#view[aria-busy="false"]').waitFor();
   assert.equal(await page.locator('#notice').textContent(),'','Section '+section+' error');
  }
  for(const width of [320,390,768,1512]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Dashboard horizontal overflow');
  }
  if(process.env.QA_SCREENSHOT_DIR)await page.screenshot({path:process.env.QA_SCREENSHOT_DIR+'/treasurequest-live-dashboard.png',fullPage:true});
  const links=await page.locator('#external-links a').evaluateAll(items=>items.map(a=>a.href));
  assert.equal(links.length,5);assert.ok(links.every(link=>link.includes('internalPreview=1')));
  await page.locator('#logout-button').click();await page.waitForURL('**/login');
  assert.equal((await context.request.get(new URL('/api/admin/dashboard',base).href,{headers:{cookie:beforeLogoutCookie}})).status(),401);
  await page.goto(base.href);await page.waitForURL('**/login');
  assert.deepEqual(errors,[]);await context.close();
  console.log('Password UI: login, all six sections, secure cookie, mobile/desktop layout and server-side logout passed.');
 }finally{await browser.close();}
})().catch(()=>{console.error('Password browser test failed; no credentials or session values were logged.');process.exitCode=1;});
