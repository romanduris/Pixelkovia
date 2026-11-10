// Shared shipped checkout + actual Worker handlers/SQLite. No real provider calls.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {launch,open}=require('./helpers/inline-checkout.cjs');
(async()=>{
 const {fresh}=await import('../admin/tests/support.mjs'),{first,execute}=await import('../admin/src/db.mjs'),{default:worker}=await import('../admin/src/worker.mjs');
 const db=fresh(),sessions=new Map(),events=[],env={TQ_DB:db,ENVIRONMENT:'local',PAYMENTS_ENABLED:'true',MAIL_DOMAIN_VERIFIED:'true',CUSTOMER_AUTH_SECRET:'a'.repeat(64),STRIPE_SECRET_KEY:'sk_test_fixture',STRIPE_PUBLISHABLE_KEY:'pk_test_fixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture',RESEND_API_KEY:'re_fixture',STRIPE_CLIENT:{checkout:{sessions:{
  async create(input){const id='cs_test_progressfixture'+sessions.size,s={...input,id,client_secret:'fixture',amount_total:input.line_items.reduce((sum,item)=>sum+item.price_data.unit_amount,0),currency:'eur',livemode:false,status:'open',payment_status:'unpaid',payment_intent:null};sessions.set(id,s);return s;},
  async retrieve(id){return sessions.get(id);}
 }}}};
 const backend=async req=>{const u=new URL(req.url()),body=req.postData();if(u.pathname==='/api/checkout/diagnostic')events.push(JSON.parse(body));return worker.fetch(new Request('http://127.0.0.1'+u.pathname+u.search,{method:req.method(),headers:{origin:'http://127.0.0.1','content-type':'application/json'},...body?{body}:{}}),env);};
 const browser=await launch();try{
  let expectedConfirmations=0,expectedLoaded=0,expectedLoads=0;
  for(const [width,product,method] of [[390,'episode-1','card'],[1360,'story-book-before','card'],[390,'story-book-after','google_pay'],[1360,'episode-1','apple_pay']]){
   const t=await open(browser,{width,wallet:method==='card'?'google_pay':method,query:product==='episode-1'?'':'?product='+product,backend});await t.start(product+method+'@example.invalid');expectedLoaded++;expectedLoads++;
   const loaded=()=>events.some(e=>e.type==='form_loaded'&&e.attemptKey===t.f.posts[0].attemptKey);
   await t.page.waitForFunction(()=>document.querySelector('#stripe-pay')&&!document.querySelector('#stripe-pay').disabled);
   if(method==='card'){
    await t.page.evaluate(()=>{inlineFixture.cardChange({empty:true,complete:false});inlineFixture.cardChange({empty:false,complete:false,value:{billingDetails:{name:'NEVER_TRANSMIT'}}});inlineFixture.cardChange({empty:false,complete:true,value:{payment_method:{id:'NEVER_TRANSMIT'}}});inlineFixture.cardChange({empty:false,complete:true});});
    await t.page.evaluate(()=>inlineFixture.validationError=true);await t.page.locator('#stripe-pay').click();await t.page.waitForFunction(()=>!document.querySelector('#stripe-pay').disabled);
    assert.equal(await t.page.evaluate(()=>inlineFixture.calls.length),0);
    await t.page.evaluate(()=>inlineFixture.validationError=false);
    await t.page.locator('#stripe-pay').evaluate(el=>{el.click();el.click();});await t.page.waitForFunction(()=>inlineFixture.calls.length===1);expectedConfirmations++;
    await t.finish({type:'error',error:{code:'paymentFailed',message:'Declined'}});await t.page.waitForFunction(()=>!document.querySelector('#stripe-pay').disabled);
    await t.page.locator('#stripe-pay').click();await t.page.waitForFunction(()=>inlineFixture.calls.length===2);expectedConfirmations++;
   }else{
    await t.page.evaluate(()=>inlineFixture.cancel());
    await t.page.getByRole('button',{name:'Fixture '+method}).click();await t.page.waitForFunction(()=>inlineFixture.calls.length===1);expectedConfirmations++;
   }
   // Persisted observations arrive independently of the payment promise.
   await t.page.waitForTimeout(150);
   assert.ok(loaded());
   const attempt=await first(db,'SELECT attempt_id FROM checkout_requests WHERE request_key=?',await (await import('../admin/src/db.mjs')).hash(t.f.posts[0].attemptKey));
   let row=await first(db,'SELECT * FROM payment_progress WHERE attempt_id=?',attempt.attempt_id);
   assert.equal(row.confirmation_count,method==='card'?2:1);assert.equal(row.last_method,method);
   if(method==='card'){assert.ok(row.fields_started&&row.fields_complete&&row.fields_validated&&row.validation_error);}else{assert.equal(row.fields_started,null);assert.ok(row.wallet_available&&row.wallet_cancelled);}
   // Refresh reuses the purchase/session and does not invent another confirmation.
   if(method==='card'){
    await t.finish({type:'error',error:{code:'paymentFailed',message:'Declined'}});await t.page.waitForFunction(()=>!document.querySelector('#stripe-pay').disabled);
    await t.page.reload();await t.page.locator('#retry-payment').click();await t.page.waitForFunction(()=>document.querySelector('#stripe-pay')&&!document.querySelector('#stripe-pay').disabled);await t.page.waitForTimeout(80);
    row=await first(db,'SELECT * FROM payment_progress WHERE attempt_id=?',attempt.attempt_id);assert.equal(row.confirmation_count,2);assert.equal(row.load_count,2);expectedLoads++;
   }
   const api=await worker.fetch(new Request('http://127.0.0.1/api/admin/payments?days=all'),env),r=await api.json();
   assert.equal(api.status,200);assert.equal(r.progress.confirmations,expectedConfirmations);assert.equal(r.progress.formLoads,expectedLoads);assert.equal(r.progress.counts.loaded,expectedLoaded);assert.equal(r.progress.counts.paid,0);
   await t.close();
  }
  assert.ok(!JSON.stringify(events).includes('NEVER_TRANSMIT'));
  // The real D1 report is also rendered on both layouts, with working filters.
  const {localDate,midnight}=await import('../admin/src/marketing-query.mjs'),today=localDate(Date.now()),boundary=midnight(today);
  const oldest=(await first(db,'SELECT id FROM checkout_attempts ORDER BY created_at LIMIT 1')).id;
  await execute(db,'UPDATE payment_progress_meta SET started_at=?',boundary-86400000);await execute(db,'UPDATE checkout_attempts SET created_at=?',boundary+1);await execute(db,'UPDATE checkout_attempts SET created_at=? WHERE id=?',boundary-1,oldest);
  const context=await browser.newContext({viewport:{width:1360,height:1000}}),page=await context.newPage();
  await context.route('**/*',async route=>{const req=route.request(),u=new URL(req.url());if(u.origin!=='https://pixelkovia.rodulab.com')return route.abort();if(u.pathname.startsWith('/api/')){const response=await worker.fetch(new Request('http://127.0.0.1'+u.pathname+u.search,{headers:{origin:'http://127.0.0.1'}}),env);return route.fulfill({status:response.status,json:await response.json()});}const file=u.pathname==='/admin'?'admin/public/index.html':'admin/public/'+u.pathname.slice(7);if(!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html',body:fs.readFileSync(file)});});
  await page.goto('https://pixelkovia.rodulab.com/admin#payments');const ready=()=>page.waitForFunction(()=>document.querySelector('#view').getAttribute('aria-busy')==='false');await ready();assert.ok(await page.locator('.payment-table-heading').isVisible());assert.equal(await page.locator('.payment-progress').evaluate(el=>el.open),false);await page.locator('#payment-progress-toggle').click();
  assert.equal(await page.locator('.payment-progress-steps li strong').nth(0).innerText(),'4');assert.equal(await page.locator('.payment-progress-steps li strong').nth(3).innerText(),'2');
  await page.locator('#payment-method').selectOption('apple_pay');await ready();assert.equal(await page.locator('.payment-progress-steps li strong').first().innerText(),'1');
  await page.locator('#payment-product').selectOption('story-book-before');await ready();assert.match(await page.locator('.payment-progress-notice').first().innerText(),/zatiaľ nie/);
  await page.locator('#payment-method').selectOption('');await ready();await page.locator('#payment-product').selectOption('');await ready();
  await page.locator('#payment-days').selectOption('custom');await ready();assert.equal(await page.locator('#payment-from').inputValue(),today);assert.equal(await page.locator('.payment-attempt-row').count(),3);assert.equal(await page.locator('.payment-progress-steps li strong').first().innerText(),'3');
  const previous=localDate(boundary-12*3600000);await page.locator('#payment-from').fill(previous);await page.locator('#payment-from').dispatchEvent('change');await ready();assert.equal(await page.locator('.payment-attempt-row').count(),4);assert.equal(await page.locator('.payment-progress-steps li strong').first().innerText(),'4');
  await page.reload();await ready();assert.equal(await page.locator('#payment-days').inputValue(),'custom');assert.equal(await page.locator('#payment-from').inputValue(),previous);assert.equal(await page.locator('.payment-attempt-row').count(),4);
  await page.evaluate(()=>location.hash='payments?scope=funnel&period=14');await ready();await page.locator('.payment-funnel-scope').waitFor();assert.ok(await page.locator('#payment-days').isDisabled());assert.equal(await page.locator('#payment-from').count(),0);
  await page.reload();await ready();await page.evaluate(()=>location.hash='payments');await ready();await page.locator('#payment-from').waitFor();assert.equal(await page.locator('#payment-days').inputValue(),'custom');assert.equal(await page.locator('#payment-from').inputValue(),previous);assert.equal(await page.locator('.payment-attempt-row').count(),4);
  for(const width of [1360,800,390,360]){await page.setViewportSize({width,height:1000});await page.waitForTimeout(150);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'progress fits '+width);if(process.env.CHECKOUT_SCREENSHOT_DIR)await page.screenshot({path:process.env.CHECKOUT_SCREENSHOT_DIR+'/payment-date-filter-'+width+'.png',fullPage:true});}
  await context.close();console.log('Checkout progress: real Worker/SQLite counts, privacy, retry, refresh, cards/books/wallets, desktop/mobile UI and filters passed.');
 }finally{await browser.close();db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
