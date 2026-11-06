const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browserType=process.env.QA_BROWSER==='webkit'?webkit:chromium;
const origin='https://pixelkovia.rodulab.com';
const now=Date.now();
const report={generatedAt:now,days:1,category:'',enabled:true,health:'observing',counts:{paid:2,free:1,refunded:0,failed:0,pending:1,ready:3,expired:2,unknown:0},attemptCounts:{started:3,abandoned:2,cancelled:1,error:1,successful:2,declined:0,unknown:0},page:1,pages:2,matchingTotal:105,total:105,technical:0,errors24:0,recent:[],deliveries:{failed:0,delayed:0},fulfillmentDelayed:0,lastSuccessAt:now-10000,checks:[{id:'stripe',ok:1,checked_at:now},{id:'webhook',ok:1,checked_at:now}],rows:[{id:'test-attempt',sessionId:'cs_test_admin_fixture',totalCents:1499,createdAt:now,checkedAt:now,state:'paid',products:['episode-1']}],logs:[]};
report.rows=['google_pay','apple_pay','card','free','unknown'].map((method,index)=>({...report.rows[0],id:'method-'+index,sessionId:'cs_test_admin_fixture'+index,state:method==='free'?'free':method==='unknown'?'ready':'paid',status:method==='unknown'?'started':'successful',email:'private'+index+'@example.invalid',reason:'Neznáme',method,totalCents:method==='free'?0:1499}));
(async()=>{const browser=await browserType.launch({headless:true});try{
  const context=await browser.newContext({viewport:{width:1512,height:1080}}),page=await context.newPage(),errors=[];let fail=false,attention=false;const calls=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();
    if(url.pathname==='/api/admin/context')return route.fulfill({json:{admin:'Správca',authMode:'password',environment:'production',webUrl:origin}});
    if(url.pathname==='/api/admin/products')return route.fulfill({json:[]});
    if(url.pathname==='/api/admin/payments'){
      calls.push(url.searchParams.toString());if(fail)return route.fulfill({status:503,json:{error:'Dočasne nedostupné'}});
      const data=structuredClone(report);if(url.searchParams.get('status'))data.rows=data.rows.filter(r=>r.status===url.searchParams.get('status'));if(url.searchParams.get('page')==='2')data.page=2;if(attention){Object.assign(data,{health:'attention',errors24:1,technical:1,deliveries:{failed:1,delayed:1}});data.logs=[{id:'error',source:'browser',type:'element_error',category:'technical',label:'Nepodarilo sa načítať údaje karty',code:'',method:'card',attempt_id:'test-attempt',stripe_session_id:'cs_test_admin_fixture',created_at:now}];}
      return route.fulfill({json:data});
    }
    if(url.pathname==='/api/admin/dashboard')return route.fulfill({json:{metrics:{customers:1,paidOrders:1,revenueByCurrency:{EUR:1499},purchasedGames:1,unactivated:1,activated:0,playing:0,completed:0,meanCompletionMs:null,medianCompletionMs:null},charts:{purchases:[],activations:[],completions:[]},funnel:[],cohort:''}});
    if(url.pathname==='/api/admin/feedback')return route.fulfill({json:[]});
    const files={'/admin':'index.html','/admin/':'index.html','/admin/admin.js':'admin.js','/admin/admin.css':'admin.css','/admin/payment-methods/apple-pay.svg':'payment-methods/apple-pay.svg','/admin/payment-methods/google-pay.svg':'payment-methods/google-pay.svg','/admin/payment-methods/card.svg':'payment-methods/card.svg'},file=files[url.pathname];
    if(!file)return route.fulfill({status:404,body:''});return route.fulfill({contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html',body:fs.readFileSync('admin/public/'+file)});
  });
  const ready=()=>page.waitForFunction(()=>document.querySelector('#view').getAttribute('aria-busy')==='false');
  const headers=()=>page.locator('.payment-table thead th[data-column]').evaluateAll(cells=>cells.map(c=>c.dataset.column));
  await page.goto(origin+'/admin#payments');await ready();
  assert.equal(await page.locator('#filters').isVisible(),false);
  assert.equal(await page.locator('.payment-state-chip').count(),7);
  assert.equal(await page.locator('.payment-monitor').getAttribute('open'),null);
  assert.equal(await page.locator('.payment-log-disclosure').getAttribute('open'),null);
  assert.ok(await page.locator('body.payments-nav-collapsed').count());
  assert.deepEqual(await headers(),['date','email','products','amount','status','method']);
  const baselineTable=await page.locator('#payment-table-scroll').boundingBox();
  assert.ok(baselineTable.y<320,'the table should start in the first screen: '+baselineTable.y);
  assert.ok((await page.locator('.payment-status-strip').boundingBox()).height<60);
  assert.ok((await page.locator('.payment-monitor').boundingBox()).height<50);
  for(const method of ['Google Pay','Apple Pay','Karta','Zdarma','Neznáme'])assert.ok(await page.getByRole('cell',{name:method,exact:true}).first().isVisible());
  assert.ok(await page.getByRole('cell',{name:'private0@example.invalid',exact:true}).isVisible());
  await page.screenshot({path:'/tmp/pixelkovia-payments-compact-desktop.png',fullPage:true});
  await page.locator('#payment-state-started').click();await ready();
  assert.equal(await page.locator('.payment-attempt-row').count(),1);assert.ok(calls.some(p=>p.includes('status=started')));
  assert.equal(await page.locator('#payment-state-started').getAttribute('aria-pressed'),'true');
  await page.locator('#payment-state-all').click();await ready();
  await page.locator('#payment-days').selectOption('7');await ready();assert.ok(calls.some(p=>p.includes('days=7')));
  await page.locator('[data-payment-page="1"]').click();await ready();assert.ok(calls.some(p=>p.includes('page=2')));
  assert.equal(await page.locator('.payment-pager span').innerText(),'Strana 2 / 2');
  await page.locator('#payment-days').selectOption('all');await ready();assert.ok(calls.some(p=>p.includes('days=all')&&p.includes('page=1')));

  await page.locator('#payment-column-toggle').click();
  await page.locator('#payment-column-method').uncheck();
  assert.ok(!(await headers()).includes('method'));assert.ok(await page.locator('.payment-column-options').evaluate(e=>e.open));
  await page.locator('#payment-column-reason').check();assert.ok((await headers()).includes('reason'));
  await page.locator('#payment-column-up-email').click();assert.equal((await headers())[0],'email');
  await page.locator('#payment-density').selectOption('comfortable');assert.ok(await page.locator('.density-comfortable').count());
  await page.locator('#payment-density').focus();
  const refreshed=page.waitForResponse(r=>r.url().includes('/api/admin/payments'));
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await refreshed;await ready();
  assert.ok(await page.locator('.payment-column-options').evaluate(e=>e.open));
  assert.equal(await page.locator('#payment-density').evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('Escape');assert.equal(await page.locator('.payment-column-options').evaluate(e=>e.open),false);
  assert.equal(await page.locator('#payment-column-toggle').evaluate(e=>e===document.activeElement),true);
  await page.reload();await ready();
  assert.equal((await headers())[0],'email');assert.ok(!(await headers()).includes('method'));assert.ok((await headers()).includes('reason'));
  assert.ok(await page.locator('.density-comfortable').count());
  const stored=await page.evaluate(()=>localStorage.getItem('pixelkovia-admin-payments-layout-v1'));
  assert.ok(!stored.includes('@'));assert.ok(!stored.includes('cs_test_'));assert.ok(!stored.includes('private0'));
  await page.locator('#payment-column-toggle').click();await page.locator('#reset-payment-layout').click();
  assert.deepEqual(await headers(),['date','email','products','amount','status','method']);assert.ok(await page.locator('.density-compact').count());
  await page.locator('#close-payment-columns').click();
  await page.locator('[data-payment-drag="email"]').dragTo(page.locator('[data-payment-drag="date"]'));
  assert.equal((await headers())[0],'email','native column dragging reorders columns');

  await page.locator('#payment-attempt-toggle-0').click();
  assert.ok(await page.locator('#payment-attempt-detail-0').isVisible());
  assert.ok((await page.locator('#payment-attempt-detail-0').innerText()).includes('cs_test_admin_fixture0'));
  assert.ok((await page.locator('#payment-attempt-detail-0').innerText()).includes('Dôvod zlyhania alebo zrušenia'));
  await page.locator('#payment-monitor-toggle').click();
  assert.ok((await page.locator('.payment-monitor-body').innerText()).includes('Kontrola prešla'));
  await page.locator('#refresh-payments').click();await ready();
  assert.ok(await page.locator('#payment-attempt-detail-0').isVisible());assert.ok(await page.locator('.payment-monitor').evaluate(e=>e.open));
  assert.equal((await headers())[0],'email');
  await page.locator('[data-payment-expand="method-0"]').focus();
  report.rows.unshift({...report.rows[0],id:'live-new',email:'live@example.invalid'});
  const added=page.waitForResponse(r=>r.url().includes('/api/admin/payments'));
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await added;await ready();
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.paymentExpand),'method-0','new rows never move keyboard focus to another purchase');
  assert.equal(await page.locator('[data-attempt="method-0"]').evaluate(e=>e.nextElementSibling.hidden),false);
  report.rows.shift();await page.locator('#refresh-payments').click();await ready();
  await page.locator('#payment-nav-toggle').click();assert.equal(await page.locator('body.payments-nav-collapsed').count(),0);
  await page.locator('#payment-nav-toggle').click();assert.ok(await page.locator('body.payments-nav-collapsed').count());

  report.rows.push(...['abandoned','cancelled','error','declined','unknown'].map((status,i)=>({...report.rows[0],id:'state-'+i,status,state:status==='abandoned'?'expired':'ready',reason:status==='error'?'Nepodarilo sa načítať Stripe formulár':'Neznáme',email:status==='unknown'?'<img src=x onerror=alert(1)>':'state@example.invalid'})));
  attention=true;await page.locator('#refresh-payments').click();await ready();
  assert.ok(await page.locator('.payment-monitor.attention').isVisible());
  assert.ok((await page.locator('.payment-monitor-body').innerText()).includes('Prístupové e-maily'));
  await page.locator('#payment-log-toggle').click();await page.locator('#payment-category').selectOption('technical');await ready();
  assert.ok(await page.locator('.payment-log-disclosure').evaluate(e=>e.open));await page.locator('.payment-log-body .payment-category-technical').waitFor();
  assert.equal(await page.locator('.payment-attempts td img[src=x]').count(),0);
  const errorColors=await page.locator('.payment-table .attempt-error').evaluate(e=>({background:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color}));
  assert.equal(errorColors.background,'rgb(183, 25, 50)');assert.equal(errorColors.color,'rgb(255, 255, 255)');
  await page.locator('#payment-monitor-toggle').click();await page.locator('#payment-log-toggle').click();await page.locator('#payment-attempt-toggle-0').click();
  await page.screenshot({path:'/tmp/pixelkovia-payments-compact-attention.png',fullPage:true});
  await page.locator('#payment-column-toggle').click();await page.locator('#payment-column-reason').check();await page.locator('#payment-column-reference').check();await page.keyboard.press('Escape');
  await page.setViewportSize({width:1024,height:650});
  await page.locator('#payment-table-scroll').evaluate(e=>{e.scrollLeft=100;e.scrollTop=50;});
  const scroll=await page.locator('#payment-table-scroll').evaluate(e=>({x:e.scrollLeft,y:e.scrollTop}));assert.ok(scroll.x>0);assert.ok(scroll.y>0);
  await page.locator('#refresh-payments').click();await ready();
  assert.deepEqual(await page.locator('#payment-table-scroll').evaluate(e=>({x:e.scrollLeft,y:e.scrollTop})),scroll);
  await page.locator('#payment-column-toggle').click();await page.locator('#reset-payment-layout').click();await page.keyboard.press('Escape');
  for(const width of [1144,390,320]){
    await page.setViewportSize({width,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no page overflow at '+width);
    assert.ok(await page.locator('#payment-table-scroll').isVisible());
    if(width===1144){assert.ok((await page.locator('#payment-table-scroll').boundingBox()).y<350);await page.screenshot({path:'/tmp/pixelkovia-payments-compact-1144.png',fullPage:true});}
    if(width===390){await page.screenshot({path:'/tmp/pixelkovia-payments-compact-mobile.png',fullPage:true});await page.locator('#payment-table-scroll').evaluate(e=>{e.scrollLeft=180;});await page.locator('#payment-attempt-toggle-0').click();assert.ok(await page.locator('#payment-attempt-detail-0').isVisible());
      const detailBox=await page.locator('#payment-attempt-detail-0 .payment-attempt-detail').boundingBox(),wrapBox=await page.locator('#payment-table-scroll').boundingBox();
      assert.ok(detailBox.x>=wrapBox.x-2&&detailBox.x+detailBox.width<=wrapBox.x+wrapBox.width+2,'expanded details stay readable after horizontal scrolling');await page.screenshot({path:'/tmp/pixelkovia-payments-compact-mobile-detail.png',fullPage:true});await page.locator('#payment-attempt-toggle-0').click();}
  }
  await page.setViewportSize({width:1512,height:1080});
  fail=true;await page.locator('#refresh-payments').click();await page.getByRole('heading',{name:'Stav platieb nie je overený'}).waitFor();assert.equal(await page.locator('.payment-monitor.observing').count(),0);
  fail=false;attention=false;await page.locator('#refresh-payments').click();await ready();await page.locator('.payment-monitor.observing').waitFor();
  await page.locator('[data-page=dashboard]').click();await page.locator('#payment-overview .payment-health').waitFor();
  assert.equal(await page.locator('body.payments-view').count(),0);assert.ok(await page.locator('.product-tabs').isVisible());assert.ok(await page.locator('.page-heading p').isVisible());
  assert.ok(await page.getByRole('link',{name:'Otvoriť platby a chyby →'}).isVisible());
  assert.deepEqual(errors,[]);await context.close();console.log('PASS: compact payments, first-screen table, state filters, alert/log disclosures, row details, persistent column visibility/order/density, drag/drop, keyboard, refresh/scroll preservation, safe rendering, sidebar and unchanged overview, 320/390/1024/1144/1512px.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
