// Exercise the deployed route layout, real Pages CSP and administrator/customer
// sessions. A plain static file server cannot catch blocked initializers.
const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const {workerServer}=await import('./helpers/worker-server.mjs'),server=await workerServer();
 const engine=process.env.QA_BROWSER==='webkit'?webkit:chromium;
 const browser=await engine.launch({headless:true,...(engine===webkit?{env:{...process.env,WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS:'1',WEBKIT_DISABLE_COMPOSITING_MODE:'1',JSC_useJIT:'0'}}:{})});
 try{
  const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1512,height:1100}}),page=await context.newPage(),errors=[],csp=[];
  const observe=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(/Content Security Policy|Refused to execute|Executing inline script/.test(m.text()))csp.push(m.text());});};observe(page);
  const get=(route,cookie='')=>server.mf.dispatchFetch(server.url+route,{headers:{cookie},redirect:'manual'});
  const previewPaths=['/assets/miky-sheet-preview.webp',...Array.from({length:6},(_,i)=>`/assets/printables/p${i+2}-preview.webp`)];
  for(const route of [...previewPaths,'/assets/supervisor-qr.svg','/printables.js','/assets/printables/vsetky-materialy.pdf','/_protected/printables.html','/printables.html'])assert.equal((await get(route)).status,404,route+' must stay private');
  assert.equal((await get('/materialy')).status,303);
  await page.goto(server.url+'/admin/login');await page.locator('#password').fill(server.adminPassword);await page.locator('#login-button').click();await page.waitForURL('**/admin');
  await page.goto(server.url+'/admin/storyboard');await page.locator('.studio-timeline').waitFor();assert.equal(await page.locator('.storyboard').count(),9);
  const previews=await page.locator('.worksheet-image img').evaluateAll(nodes=>Promise.all(nodes.map(async img=>{img.loading='eager';try{await img.decode();return {path:new URL(img.src).pathname,ok:img.naturalWidth>0};}catch{return {path:new URL(img.src).pathname,ok:false};}})));
  const printed=await context.newPage();observe(printed);const response=await printed.goto(server.url+'/materialy');
  await printed.waitForTimeout(100);console.log(JSON.stringify({browser:engine.name(),missingPreviews:previews.filter(p=>!p.ok).map(p=>p.path),renderedSheets:await printed.locator('.sheet').count(),cspViolations:csp.length}));
  assert.equal(previews.length,7);assert.deepEqual(previews.filter(p=>!p.ok),[],'all seven full storyboard previews must decode');
  assert.equal(await printed.locator('.sheet').count(),9,'parent guide, seven worksheets and diploma must render with the production CSP');
  assert.ok(!response.headers()['content-security-policy'].match(/script-src[^;]*'unsafe-inline'/));
  assert.equal(await printed.locator('.sheet').first().getAttribute('id'),'rodicovsky-navod');assert.equal(await printed.locator('#circles svg').count(),2);
  await printed.locator('.sheet img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
  const guide=printed.locator('#rodicovsky-navod');
  assert.ok(!/Nápoved/i.test(await guide.locator('.guide-stage:not([data-stage="intro"])').allInnerTexts().then(t=>t.join(' '))),'only the opening has a hint');
  assert.match(await guide.locator('[data-stage="intro"] .gm-solution').innerText(),/Indícia jedna… v kúpeľni! Rýchlo!/);assert.equal(await guide.locator('.guide-opening-hint').count(),1);
  assert.equal(await guide.locator('.guide-stage .guide-setup').count(),8);assert.equal(await guide.locator('.guide-stage .gm-solution').count(),8);assert.equal(await guide.locator('.guide-reward').count(),6);
  assert.ok(await guide.locator('.guide-piko').evaluate(img=>img.naturalWidth>0),'Piko loads in the guide header');
  assert.equal(await guide.locator('.guide-intro>section').count(),4,'four short preparation steps');
  assert.equal(await guide.locator('.guide-safety').count(),0);assert.equal(await guide.locator('.guide-tools p').count(),1);
  assert.match(await guide.locator('.guide-portal-step').innerText(),/Prihlasovacie údaje nájdete v e-maile/);
  assert.ok((await guide.locator('.guide-portal-qr a').evaluateAll(links=>links.map(a=>a.href))).every(url=>url==='https://pixelkovia.rodulab.com/Supervisor'));
  assert.ok(await guide.locator('.guide-portal-qr img').evaluate(img=>img.naturalWidth>0),'the portal QR loads through the real authorization boundary');
  await printed.evaluate(()=>{window.__printCalls=0;window.print=()=>window.__printCalls++;});await printed.getByRole('button',{name:'Vytlačiť podklady'}).click();assert.equal(await printed.evaluate(()=>window.__printCalls),1);
  const cookie=(await context.cookies(server.url)).map(c=>c.name+'='+c.value).join('; ');
  for(const id of ['rodicovsky-navod','p1','p2','p3','p4','p5','p6','p7','diplom','vsetky-materialy']){
   const pdf=await get('/assets/printables/'+id+'.pdf',cookie);assert.equal(pdf.status,200);assert.match(pdf.headers.get('content-type'),/application\/pdf/);const body=Buffer.from(await pdf.arrayBuffer());assert.equal(body.subarray(0,5).toString(),'%PDF-');assert.equal((body.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length,id==='vsetky-materialy'?9:1,id+': complete PDF page count');
  }
  await page.locator('#gm-envelope .storyboard-toggle').click();await page.locator('#gm-envelope').screenshot({path:'/tmp/pixelkovia-storyboard-materials-'+engine.name()+'.png'});
  await printed.locator('#p1').screenshot({path:'/tmp/pixelkovia-print-materials-'+engine.name()+'.png'});
  if(engine===chromium){await printed.evaluate(()=>document.fonts.ready);const pdf=await printed.pdf({format:'A4',printBackground:true});assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length,9,'browser print must retain nine complete A4 pages');}
  for(const id of ['p1','p2','p3','p4','p5','p6','p7']){
   await printed.goto(server.url+'/materialy?sheet='+id);assert.equal(await printed.locator('.sheet:visible').count(),1);assert.ok(await printed.locator('#'+id).isVisible());assert.match(await printed.locator('#pdf-download').getAttribute('href'),new RegExp('/'+id+'\\.pdf$'));
  }
  await printed.goto(server.url+'/materialy?sheet=rodicovsky-navod');
  await printed.setViewportSize({width:390,height:844});assert.ok(await printed.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const customer=await browser.newContext({ignoreHTTPSErrors:true}),portal=await customer.newPage();observe(portal);await portal.goto(server.url+'/Supervisor');await portal.locator('#login-email').fill(server.email);await portal.locator('#login-password').fill(server.customerPassword);await portal.locator('#customer-login button').click();await portal.locator('#start-game').waitFor();
  await portal.goto(server.url+'/materialy');assert.equal(await portal.locator('.sheet').count(),9,'a paid game customer also receives the complete printable set');const customerCookie=(await customer.cookies(server.url)).map(c=>c.name+'='+c.value).join('; ');assert.equal((await get('/admin/storyboard',customerCookie)).status,303);
  assert.deepEqual(errors,[]);assert.deepEqual(csp,[]);await customer.close();await context.close();
  console.log('PASS: '+engine.name()+': authorized storyboard images, all nine print pages, seven single sheets, print action, PDFs, customer access and anonymous protection under real Workers CSP.');
 }finally{await browser.close();await server.mf.dispose();}
})().catch(error=>{console.error(error);process.exitCode=1;});
