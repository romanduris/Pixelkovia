// Browser cookie behavior through the real Pages gateway, Worker and isolated D1.
const fs=require('node:fs'),assert=require('node:assert/strict');
const https=require('node:https'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const password='browser-session-test-password-84931';
(async()=>{
 const {fresh}=await import('../admin/tests/support.mjs');
 const {makePasswordSecrets}=await import('../admin/src/password-auth.mjs');
 const {default:worker}=await import('../admin/src/worker.mjs');
 const source=fs.readFileSync('funnel/gateway.mjs','utf8');
 const {default:gateway}=await import('data:text/javascript;base64,'+Buffer.from('const PRIVATE_FILES={},PUBLIC_FILES=["/index.html"];\n'+source).toString('base64'));
 const certDir=fs.mkdtempSync(path.join(os.tmpdir(),'pixelkovia-session-test-'));
 try{
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',path.join(certDir,'key.pem'),'-out',path.join(certDir,'cert.pem'),'-days','1','-subj','/CN=localhost'],{stdio:'ignore'});
 for(const browserType of [chromium,webkit]){
  const browser=await browserType.launch({headless:true});
  const db=fresh(),secrets=await makePasswordSecrets(password);
  const assets={async fetch(request){
   const path=new URL(request.url).pathname;
   const file=path==='/'?'index.html':path==='/login'? 'login.html':path.slice(1);
   if(!/^[a-z-]+\.(html|css|js)$/.test(file))return new Response(null,{status:404});
   return new Response(fs.readFileSync('admin/public/'+file),{headers:{'Content-Type':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html'}});
  }};
  const env={ENVIRONMENT:'production',ADMIN_AUTH_MODE:'password',TQ_DB:db,ASSETS:assets,...secrets};
  const gatewayEnv={BACKEND:{fetch:request=>worker.fetch(request,env)},ASSETS:{fetch:()=>new Response('<a href="/admin">Administrácia</a>',{headers:{'Content-Type':'text/html'}})}};
  let submissions=0,externalAdminCookie;
  const errors=[];
  function attach(context){
   context.on('page',page=>{
    page.on('pageerror',error=>errors.push(error.message));
    if(process.env.QA_DEBUG)page.on('console',message=>{if(message.type()==='error')console.error(message.text());});
   });
  }
  let origin,outside;
  const server=https.createServer({key:fs.readFileSync(path.join(certDir,'key.pem')),cert:fs.readFileSync(path.join(certDir,'cert.pem'))},async(incoming,outgoing)=>{
   try{
    const url=new URL(incoming.url,'https://'+incoming.headers.host),headers=incoming.headers;
    if(url.origin===outside){outgoing.writeHead(200,{'Content-Type':'text/html'});outgoing.end('<a href="'+origin+'/admin">Administrácia</a>');return;}
    const chunks=[];for await(const chunk of incoming)chunks.push(chunk);const body=Buffer.concat(chunks);
    if(url.pathname==='/api/admin/login')submissions++;
    if(url.pathname==='/admin'&&headers.referer?.startsWith(outside))externalAdminCookie=headers.cookie||'';
    const response=await gateway.fetch(new Request(url,{method:incoming.method,headers,...(body.length?{body}: {})}),gatewayEnv);
    if(process.env.QA_DEBUG)console.log(browserType.name(),url.pathname,response.status);
    outgoing.writeHead(response.status,Object.fromEntries(response.headers));outgoing.end(Buffer.from(await response.arrayBuffer()));
   }catch(error){errors.push(error.message);outgoing.writeHead(500);outgoing.end();}
  });
  await new Promise(resolve=>server.listen(0,resolve));
  origin='https://127.0.0.1:'+server.address().port;outside='https://localhost:'+server.address().port;
  let context;
  try{
   context=await browser.newContext({viewport:{width:1440,height:1000},ignoreHTTPSErrors:true});attach(context);
   let page=await context.newPage();
   await page.goto(origin+'/admin');await page.waitForURL(origin+'/admin/login');
   await page.locator('#password').fill(password);await page.locator('#login-button').click();
   await page.waitForURL(origin+'/admin#marketing');await page.locator('#marketing-logout').waitFor();
   const session=(await context.cookies()).find(c=>c.name==='__Host-tq-admin');
   assert.ok(session?.secure&&session.httpOnly&&session.expires>Date.now()/1000+29*86400,'persistent protected session');
   assert.equal(await page.evaluate(()=>document.cookie.includes('__Host-tq-admin=')),false,'JavaScript cannot read the session');
   await page.reload();await page.locator('#marketing-logout').waitFor();assert.equal(new URL(page.url()).pathname,'/admin');
   await page.close();page=await context.newPage();await page.goto(origin+'/admin');await page.locator('#marketing-logout').waitFor();
   await page.goto(outside);await page.locator('a').click();
   await page.waitForURL(url=>url.pathname==='/admin');await page.locator('#marketing-logout').waitFor();
   assert.ok(externalAdminCookie.includes('__Host-tq-admin='),'external top-level link sends the session');
   assert.equal(session.sameSite,'Lax');
   // Simulate browser restart with persisted cookies, without browser storage credentials.
   const storage=await context.storageState();await context.close();
   context=await browser.newContext({storageState:storage,ignoreHTTPSErrors:true});attach(context);page=await context.newPage();
   await page.goto(origin+'/admin');await page.locator('#marketing-logout').waitFor();
   assert.equal(submissions,1,'refresh, reopening and external links require no password');
   // Existing Strict cookies must recover on the login page's same-origin recheck.
   await context.addCookies([{...session,sameSite:'Strict'}]);
   await page.goto(outside);await page.locator('a').click();
   await page.waitForURL(origin+'/admin#marketing',{timeout:8000});await page.locator('#marketing-logout').waitFor();
   assert.equal(externalAdminCookie.includes('__Host-tq-admin='),false,'reproduces the old Strict cookie omission');
   assert.equal(submissions,1,'legacy Strict sessions recover without another password');
   const crossSiteLogout=await context.request.post(origin+'/api/admin/logout',{headers:{Origin:outside}});
   assert.equal(crossSiteLogout.status(),403,'cross-origin mutations stay blocked');
   await page.locator('#marketing-logout').click();await page.waitForURL(origin+'/admin/login');
   assert.equal((await context.request.get(origin+'/api/admin/context')).status(),401);
   await page.reload();await page.locator('#login-form').waitFor();assert.equal(new URL(page.url()).pathname,'/admin/login');
   assert.deepEqual(errors,[]);
   console.log(browserType.name()+': login, refresh, reopen, persisted cookies, external link, legacy session, CSRF and logout passed.');
  }catch(error){
   if(process.env.QA_DEBUG){console.error('Page errors:',errors);for(const page of context?.pages()||[])console.error('Notice:',await page.locator('#notice').textContent().catch(()=>''));}
   throw error;
  }finally{if(context)await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));db.close();}
 }
 }finally{fs.rmSync(certDir,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
