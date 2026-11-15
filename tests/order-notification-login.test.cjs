const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const {workerServer}=await import('./helpers/worker-server.mjs'),{execute,first}=await import('../admin/src/db.mjs');
 const {orderNotificationEmail}=await import('../admin/src/order-notifications.mjs');
 const server=await workerServer(),origin=server.url,password=server.adminPassword,errors=[],queries=[];
 const order=await first(server.db,"SELECT id FROM orders WHERE external_reference='qa-episode-1'");
 await execute(server.db,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at) VALUES(?,?,?,?,?,?)','notification-order-fixture',server.email,'QA','["episode-1"]',1499,Date.now());
 await execute(server.db,'INSERT INTO checkout_orders VALUES(?,?,?)','notification-order-fixture','primary',order.id);
 const browser=await (process.env.QA_BROWSER==='webkit'?webkit:chromium).launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},ignoreHTTPSErrors:true}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{const url=new URL(request.url());if(url.pathname==='/api/admin/customers')queries.push(url.searchParams.toString());});
  const hash='#analytics?attempt=notification-order-fixture';
  await page.goto(origin+'/admin'+hash);await page.waitForURL(url=>url.pathname==='/admin/login');
  assert.equal(new URL(page.url()).hash,hash,'the HTTP redirect keeps the email destination fragment');
  await page.locator('#password').fill(password);await page.locator('#login-button').click();
  await page.waitForURL(url=>url.pathname==='/admin'&&url.hash===hash);await page.locator('#view[aria-busy="false"]').waitFor();
  assert.equal(await page.locator('#page-title').textContent(),'Herná analýza');
  assert.ok(queries.some(q=>new URLSearchParams(q).get('attempt')==='notification-order-fixture'),'analysis loads the purchase selected by the email');
  assert.equal(await page.locator('[data-row="qa-family"]').count(),1,'the selected order is visible after login');
  await page.goto(origin+'/admin/login#//untrusted.example');await page.locator('#password').fill(password);await page.locator('#login-button').click();
  await page.waitForURL(origin+'/admin#marketing');
  assert.deepEqual(errors,[]);await context.close();
  const mail=orderNotificationEmail({total_cents:1499,currency:'EUR',paid_at:Date.UTC(2026,10,15,12),email:'rodina@example.invalid',kind:'primary',attempt_id:'preview'});
  fs.writeFileSync('/tmp/pixi-order-notification.html',mail.html);
  const preview=await browser.newContext(),emailPage=await preview.newPage();await emailPage.setContent(mail.html);
  for(const width of [390,680]){await emailPage.setViewportSize({width,height:850});assert.ok(await emailPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await emailPage.screenshot({path:'/tmp/pixi-order-notification-'+width+'.png',fullPage:true});}
  await preview.close();console.log('Notification: protected email link preserves the selected game analysis through login; Pixi email checked on mobile and desktop.');
 }finally{await browser.close();await server.mf.dispose();}
})().catch(error=>{console.error(error);process.exitCode=1;});
