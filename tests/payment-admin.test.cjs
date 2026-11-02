const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin='https://pixelkovia.rodulab.com';
const now=Date.now();
const report={generatedAt:now,days:1,category:'',enabled:true,health:'observing',counts:{paid:2,free:1,refunded:0,failed:0,pending:1,ready:3,expired:2,unknown:0},total:9,technical:0,errors24:0,recent:[],deliveries:{failed:0,delayed:0},fulfillmentDelayed:0,lastSuccessAt:now-10000,checks:[{id:'stripe',ok:1,checked_at:now},{id:'webhook',ok:1,checked_at:now}],rows:[{id:'test-attempt',sessionId:'cs_test_admin_fixture',totalCents:1499,createdAt:now,checkedAt:now,state:'paid',products:['episode-1']}],logs:[]};
report.rows=['google_pay','apple_pay','card','free','unknown'].map((method,index)=>({...report.rows[0],id:'method-'+index,sessionId:'cs_test_admin_fixture'+index,state:method==='free'?'free':method==='unknown'?'ready':'paid',method,totalCents:method==='free'?0:1499}));
(async()=>{const browser=await chromium.launch({headless:true});try{
  const context=await browser.newContext({viewport:{width:1512,height:1080}}),page=await context.newPage(),errors=[];let fail=false,attention=false;const calls=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();
    if(url.pathname==='/api/admin/context')return route.fulfill({json:{admin:'Správca',authMode:'password',environment:'production',webUrl:origin}});
    if(url.pathname==='/api/admin/products')return route.fulfill({json:[]});
    if(url.pathname==='/api/admin/payments'){
      calls.push(url.searchParams.toString());if(fail)return route.fulfill({status:503,json:{error:'Dočasne nedostupné'}});
      const data=structuredClone(report);if(attention){Object.assign(data,{health:'attention',errors24:1,technical:1,deliveries:{failed:1,delayed:1}});data.logs=[{id:'error',source:'browser',type:'element_error',category:'technical',label:'Nepodarilo sa načítať údaje karty',code:'',method:'card',attempt_id:'test-attempt',stripe_session_id:'cs_test_admin_fixture',created_at:now}];}
      return route.fulfill({json:data});
    }
    if(url.pathname==='/api/admin/dashboard')return route.fulfill({json:{metrics:{customers:1,paidOrders:1,revenueByCurrency:{EUR:1499},purchasedGames:1,unactivated:1,activated:0,playing:0,completed:0,meanCompletionMs:null,medianCompletionMs:null},charts:{purchases:[],activations:[],completions:[]},funnel:[],cohort:''}});
    if(url.pathname==='/api/admin/feedback')return route.fulfill({json:[]});
    const files={'/admin':'index.html','/admin/':'index.html','/admin/admin.js':'admin.js','/admin/admin.css':'admin.css','/admin/payment-methods/apple-pay.svg':'payment-methods/apple-pay.svg','/admin/payment-methods/google-pay.svg':'payment-methods/google-pay.svg','/admin/payment-methods/card.svg':'payment-methods/card.svg'},file=files[url.pathname];
    if(!file)return route.fulfill({status:404,body:''});return route.fulfill({contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html',body:fs.readFileSync('admin/public/'+file)});
  });
  await page.goto(origin+'/admin#payments');await page.locator('.payment-health.observing').waitFor();
  assert.equal(await page.locator('#filters').isVisible(),false);assert.equal(await page.locator('.payment-metrics .metric').count(),6);
  assert.ok((await page.locator('#view').innerText()).includes('Zaplatené'));assert.ok((await page.locator('#view').innerText()).includes('Kontrola prešla'));
  assert.ok(await page.getByRole('columnheader',{name:'Spôsob úhrady'}).isVisible());
  for(const method of ['Google Pay','Apple Pay','Karta','Zdarma','Zatiaľ nezistené'])assert.ok(await page.getByRole('cell',{name:method,exact:true}).isVisible());
  await page.locator('#payment-days').selectOption('7');await page.waitForFunction(()=>document.querySelector('#view').getAttribute('aria-busy')==='false');assert.ok(calls.some(p=>p.includes('days=7')));
  attention=true;await page.locator('#refresh-payments').click();await page.locator('.payment-health.attention').waitFor();
  assert.ok((await page.locator('.payment-health').innerText()).includes('Prístupové e-maily'));await page.locator('#payment-category').selectOption('technical');await page.locator('.payment-category-technical').waitFor();
  await page.screenshot({path:'/tmp/pixelkovia-payments-admin-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'/tmp/pixelkovia-payments-admin-mobile.png',fullPage:true});
  fail=true;await page.locator('#refresh-payments').click();await page.getByRole('heading',{name:'Stav platieb nie je overený'}).waitFor();assert.equal(await page.locator('.payment-health.observing').count(),0);
  fail=false;attention=false;await page.locator('#refresh-payments').click();await page.locator('.payment-health.observing').waitFor();
  await page.locator('[data-page=dashboard]').click();await page.locator('#payment-overview .payment-health').waitFor();assert.ok(await page.getByRole('link',{name:'Otvoriť platby a chyby →'}).isVisible());
  assert.deepEqual(errors,[]);await context.close();console.log('PASS: private admin payment UI, counts, filters, refresh, failure/recovery, overview banner, desktop and 390px layout');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
