const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const {workerServer}=await import('./helpers/worker-server.mjs'),server=await workerServer(),browser=await chromium.launch();
 try{
  const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1360,height:1100}}),page=await context.newPage();
  const routes=[['/admin/vouchers',303],['/admin/vouchers.pdf',303],['/gift-vouchers.html',404],['/gift-vouchers.css',404],['/assets/gift-vouchers/pixelkovia-darcekove-poukazy-A4.pdf',404],['/assets/gift-vouchers/website-qr.svg',404],['/_protected/gift-vouchers',404],['/_protected/assets/gift-vouchers/pixelkovia-darcekove-poukazy-A4.pdf',404]];
  for(const [route,status]of routes)assert.equal((await context.request.get(server.url+route,{maxRedirects:0})).status(),status,route);
  const customer=await context.request.post(server.url+'/api/customer/login',{headers:{Origin:server.url},data:{email:server.email,password:server.customerPassword}});assert.equal(customer.status(),200);
  for(const [route,status]of routes)assert.equal((await context.request.get(server.url+route,{maxRedirects:0})).status(),status,'paid customer: '+route);
  await page.goto(server.url+'/admin/login');await page.locator('#password').fill(server.adminPassword);await page.locator('#login-button').click();await page.waitForURL(url=>url.pathname==='/admin');
  await page.locator('#external-links a[href$="/admin/vouchers"]').waitFor({state:'attached'});
  await page.goto(server.url+'/admin/vouchers');await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  assert.deepEqual(await page.locator('.code').allTextContents(),['KOVO','SANDY','ROSOS']);assert.equal(await page.locator('.blank').innerText(),'');
  const pdf=await context.request.get(server.url+'/admin/vouchers.pdf');assert.equal(pdf.status(),200);assert.match(pdf.headers()['cache-control'],/private, no-store/);assert.match(pdf.headers()['content-type'],/application\/pdf/);
  assert.deepEqual(await pdf.body(),fs.readFileSync('assets/gift-vouchers/pixelkovia-darcekove-poukazy-A4.pdf'));
  for(const file of ['gift-vouchers.html','gift-vouchers.css','assets/gift-vouchers/pixelkovia-darcekove-poukazy-A4.pdf'])assert.ok(!fs.existsSync('dist/funnel/'+file));
  const catalog=fs.readFileSync('dist/funnel/purchase-config.js','utf8');assert.doesNotMatch(catalog,/kovo|sandy|rosos/i);
  await page.emulateMedia({media:'print'});await page.locator('.a4').screenshot({path:'/tmp/pixelkovia-vouchers-authorized.png'});
  console.log('Voucher access passed: anonymous and paid customers denied, admin page/fonts/QR/PDF load, downloaded PDF matches, no codes in public catalog.');
 }finally{await browser.close();await server.mf.dispose();}
})().catch(error=>{console.error(error);process.exitCode=1;});
