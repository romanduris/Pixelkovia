const assert=require('node:assert/strict'),fs=require('node:fs/promises');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const {workerServer}=await import('./helpers/worker-server.mjs');
 const server=await workerServer(),browser=await (process.env.QA_BROWSER==='webkit'?webkit:chromium).launch({headless:true,...(process.env.QA_BROWSER==='webkit'?{}:{args:['--ignore-certificate-errors']})});
 const route='/admin/social/Pixelkovia-prispevky-12-16-november-2026.zip';
 try{
  const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1280,height:900}}),page=await context.newPage();
  const denied=await context.request.get(server.url+route,{maxRedirects:0});
  assert.equal(denied.status(),303);assert.equal(denied.headers().location,'/admin/login');
  await page.goto(server.url+'/admin#analytics');await page.locator('#password').fill(server.adminPassword);await page.locator('#login-button').click();
  await page.waitForURL('**/admin');await page.goto(server.url+'/admin#analytics');await page.locator('#view[aria-busy="false"]').waitFor();
  const link=page.locator('#social-download');assert.equal(await link.getAttribute('href'),route);assert.equal(await link.isVisible(),true);
  for(const width of [1280,320]){
   await page.setViewportSize({width,height:900});await link.scrollIntoViewIfNeeded();
   const box=await link.boundingBox();assert.ok(box&&box.x>=0&&box.x+box.width<=width&&box.height>=44,'download link fits '+width+'px');
  }
  const checked=await context.request.get(server.url+route);assert.equal(checked.status(),200);assert.equal(checked.headers()['content-type'],'application/zip');
  const [download]=await Promise.all([page.waitForEvent('download'),link.click()]);
  assert.equal(download.suggestedFilename(),'Pixelkovia-prispevky-12-16-november-2026.zip');assert.equal(await download.failure(),null);
  const received=await fs.readFile(await download.path()),expected=await fs.readFile('dist/funnel/_protected/admin/social/Pixelkovia-prispevky-12-16-november-2026.zip');
  assert.deepEqual(received,expected);assert.equal(received.subarray(0,2).toString(),'PK');
  console.log('PASS social ZIP: real administrator login, visible download link, attachment filename and complete archive bytes ('+(process.env.QA_BROWSER||'chromium')+').');
 }finally{await browser.close();await server.mf.dispose();}
})().catch(error=>{console.error(error);process.exitCode=1;});
