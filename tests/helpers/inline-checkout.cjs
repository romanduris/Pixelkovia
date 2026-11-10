const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin='https://pixelkovia.rodulab.com',sessionId='cs_test_inline_fixture123456';
const engine={chromium,webkit}[process.env.QA_BROWSER||'chromium'];
async function launch(){return engine.launch({headless:process.env.QA_HEADED!=='1',...(engine===webkit?{env:{...process.env,WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS:'1',WEBKIT_DISABLE_COMPOSITING_MODE:'1',WEBKIT_DISABLE_DMABUF_RENDERER:'1',LIBGL_ALWAYS_SOFTWARE:'1',GSK_RENDERER:'cairo',JSC_useJIT:'0'}}:{})});}
function install(options){
 const s=window.inlineFixture={calls:[],validated:0,destroyed:0,cardElements:0,walletElements:0,walletFailed:0,walletResolved:0,nativeReturned:false,nativeComplete:false,totalCents:1499,validationError:options.validationError||false,wrongTotal:options.wrongTotal||false,cardLoadError:options.cardLoadError||false,walletAvailable:options.walletAvailable!==false,loadError:options.loadError||false};
 window.Stripe=(key,config)=>({initCheckoutElementsSdk(init){s.init=init;s.locale=config.locale;return {
  on(type,handler){if(type==='change')s.change=handler;},
  async loadActions(){if(s.loadError)return {type:'error',error:{message:'SDK failed',code:null}};return {type:'success',actions:{
   getSession(){return {currency:'eur',minorUnitsAmountDivisor:100,total:{total:{minorUnitsAmount:s.totalCents+(s.wrongTotal?1:0)}}};},
   async validateElements(){s.validated++;return s.validationError?{type:'error',error:{code:'validation_error',message:'Validation failed',validation_errors:[{element:'payment',message:'Číslo vašej karty je neúplné.'}]}}:{type:'success'};},
   confirm(args){
    // This is the actual Checkout contract, not the older PaymentIntent error shape.
    if(args.returnUrl)throw Error('return_url is already server-owned');
    s.calls.push({redirect:args.redirect,wallet:args.expressCheckoutConfirmEvent?.expressPaymentType,hasReturnUrl:'returnUrl' in args});
    return new Promise((resolve,reject)=>{s.finish=r=>{if(r?.throw){const error=Error(r.message||'Network interrupted');error.name=r.name||'Error';reject(error);}else resolve(r);};});
   }
  }};},
  createPaymentElement(config){s.cardElements++;s.cardConfig=config;const div=document.createElement('div');div.textContent='Stripe card fields';div.style.height='150px';const events={};s.cardChange=event=>events.change?.(event);return {on(t,h){if(!['ready','change','focus','blur','escape','loaderror'].includes(t))throw Error('Unsupported Payment Element event: '+t);events[t]=h;},mount(sel){document.querySelector(sel).append(div);events[s.cardLoadError?'loaderror':'ready']?.({});},destroy(){div.remove();}};},
  createExpressCheckoutElement(config){s.walletElements++;s.walletConfig=config;const events={},button=document.createElement('button');button.type='button';button.textContent='Fixture '+options.wallet;
   const event={expressPaymentType:options.wallet,paymentFailed(){s.walletFailed++;}};
   s.confirmWallet=async()=>{s.nativeReturned=false;await events.confirm(event);s.nativeReturned=true;queueMicrotask(()=>s.nativeComplete=s.destroyed===0);};
   button.addEventListener('click',()=>{if(!options.walletDelayConfirm)void s.confirmWallet();});
   s.cancel=()=>events.cancel?.({});
   // This is Checkout's narrowed Express Element contract, not the generic
   // Elements contract. click/availablepaymentmethodschange are unsupported.
   return {on(t,h){if(!['ready','focus','blur','escape','loaderror','confirm','cancel'].includes(t))throw Error('Unsupported Checkout Express event: '+t);events[t]=h;},mount(sel){document.querySelector(sel).append(button);events.ready?.({availablePaymentMethods:s.walletAvailable?{applePay:options.wallet==='apple_pay',googlePay:options.wallet==='google_pay'}:null});},destroy(){s.destroyed++;button.remove();}};
  }
 };}});
}
async function open(browser,options={}){
 const {backend,...browserOptions}=options;
 const width=options.width||390,context=await browser.newContext({viewport:{width,height:844},isMobile:width<600,hasTouch:width<600}),page=await context.newPage();
 const f={posts:[],releases:[],diagnostics:[],reads:0,createLost:false,createError:0,statusError:false,releaseError:false,enabled:true,state:'ready',paid:false,delivered:false,totalCents:1499,labels:['Rodinná hra Pixelkovia','Atlas Pixelkov'],orderCount:1,...options};
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(install,{wallet:'google_pay',...browserOptions});
 await context.addInitScript(({purchase,denyStorage})=>{if(denyStorage){Object.defineProperty(window,'localStorage',{get(){throw Error('Storage unavailable');}});Object.defineProperty(window,'sessionStorage',{get(){throw Error('Storage unavailable');}});}else if(purchase)localStorage.setItem('pixelkovia-checkout-attempt',JSON.stringify(purchase));},{purchase:options.purchase,denyStorage:options.denyStorage});
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());if(url.origin!==origin)return route.abort();
  if(url.pathname==='/api/privacy/consent')return route.fulfill({json:{choice:{version:'2026-11-10',analytics:false,marketing:false,createdAt:Date.now(),expiresAt:Date.now()+86400000},pixelId:'1120983200688486'}});
  if(backend&&url.pathname.startsWith('/api/checkout/')){
   if(url.pathname==='/api/checkout/session')f.posts.push(req.postDataJSON());
   const response=await backend(req),data=await response.json();
   if(url.pathname==='/api/checkout/session'&&response.ok){f.totalCents=data.totalCents;await page.evaluate(total=>inlineFixture.totalCents=total,f.totalCents);}
   return route.fulfill({status:response.status,json:data});
  }
  if(url.pathname==='/api/checkout/diagnostic'){f.diagnostics.push(req.postDataJSON());return f.diagnosticError?route.abort():route.fulfill({json:{received:true}});}
  if(url.pathname==='/api/checkout/config')return route.fulfill({json:{enabled:f.enabled,checkout:'elements',publishableKey:'pk_test_fixture',wallets:{applePay:true,googlePay:true}}});
  if(url.pathname==='/api/checkout/session'){
   const input=req.postDataJSON();f.posts.push(input);
   f.totalCents=input.voucherCode==='free'?0:input.voucherCode==='1e'?100:input.baseId==='episode-1'?(input.books.length===2?1998:1499+input.books.length*499)+(input.giftGame?999:0):499*(1+input.books.length);
   await page.evaluate(total=>inlineFixture.totalCents=total,f.totalCents);
   if(f.createLost){f.createLost=false;return route.abort();}
   if(f.createError)return route.fulfill({status:f.createError,json:{error:'Skontrolujte objednávku.'}});
   return route.fulfill({json:{sessionId,uiMode:input.uiMode==='hosted'?'hosted_page':'elements',...(input.uiMode==='hosted'?{checkoutUrl:'https://checkout.stripe.com/c/pay/'+sessionId}:{clientSecret:'fixture'}),totalCents:f.totalCents,state:f.createState||'open'}});
  }
  if(url.pathname==='/api/checkout/status'){
   f.reads++;if(f.statusError)return route.abort();if(f.statusGate)await f.statusGate;
   return route.fulfill({json:{sessionId,paid:f.paid,delivered:f.delivered,noPaymentRequired:f.totalCents===0,state:f.paid?'paid':f.state,totalCents:f.totalCents,labels:f.labels,orderCount:f.orderCount}});
  }
  if(url.pathname==='/api/checkout/release'){
   f.releases.push(req.postDataJSON());return f.releaseError?route.fulfill({status:409,json:{error:'Overujeme pôvodnú platbu.'}}):route.fulfill({json:{released:true}});
  }
  let file=url.pathname==='/'?'index.html':url.pathname.slice(1);if(!path.extname(file))file+='.html';const target=path.join(process.cwd(),'dist/funnel',file);
  if(!fs.existsSync(target)||!fs.statSync(target).isFile())return route.fulfill({status:404,body:''});
  return route.fulfill({contentType:{'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'}[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(target)});
 });
 await page.goto(origin+'/checkout'+(options.query||''));
 await page.waitForFunction(()=>!document.querySelector('.checkout-buy').disabled||!document.querySelector('#payment-panel').hidden||document.querySelector('#payment-note').textContent.includes('nie sú dostupné'));
 async function voucher(code){await page.locator('#voucher-open').click();await page.locator('#voucher-code').fill(code);await page.locator('#voucher-form').evaluate(el=>el.requestSubmit());}
 async function start(email='family@example.invalid'){await page.locator('[name=email]').fill(email);await page.locator('.checkout-buy').click();try{await page.locator('#stripe-pay').waitFor();}catch(error){error.message+='\nFixture: '+JSON.stringify({query:options.query,posts:f.posts.length,totalCents:f.totalCents,status:await page.locator('#payment-status').innerText(),note:await page.locator('#payment-note').innerText(),errors});throw error;}}
 async function finish(result={type:'success'}){await page.evaluate(result=>inlineFixture.finish(result),result);}
 async function close(){if(errors.length)throw Error('Browser errors: '+errors.join('; '));await context.close();}
 return {page,context,f,voucher,start,finish,close};
}
function cachedPurchase(overrides={}){const input={baseId:'episode-1',books:[],atlasIncluded:true,giftGame:false,email:'family@example.invalid',uiMode:'elements',attemptKey:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'};return {attemptKey:input.attemptKey,input,sessionId,phase:'ready',...overrides};}
module.exports={launch,open,cachedPurchase,origin,sessionId};
