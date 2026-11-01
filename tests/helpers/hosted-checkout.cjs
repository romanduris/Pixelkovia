const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin='https://pixelkovia.rodulab.com',sessionId='cs_test_checkout_fixture123456',checkoutUrl='https://checkout.stripe.com/c/pay/'+sessionId;
const engine={chromium,webkit}[process.env.QA_BROWSER||'chromium'];
async function launch(){return engine.launch({headless:true,...(engine===webkit?{env:{...process.env,WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS:'1',WEBKIT_DISABLE_COMPOSITING_MODE:'1',JSC_useJIT:'0'}}:{})});}
async function open(browser,options={}){
 const width=options.width||390,context=await browser.newContext({viewport:{width,height:844},isMobile:width<600,hasTouch:width<600});
 const page=await context.newPage(),f={posts:[],releases:[],reads:0,createLost:false,createError:0,statusError:false,releaseError:false,configError:false,enabled:true,url:checkoutUrl,state:'ready',paid:false,delivered:false,orderCount:1,totalCents:1499,labels:['Rodinná hra Pixelkovia','Atlas Pixelkov'],...options};
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({purchase,denyStorage})=>{if(denyStorage){Object.defineProperty(window,'localStorage',{get(){throw Error('Storage unavailable');}});Object.defineProperty(window,'sessionStorage',{get(){throw Error('Storage unavailable');}});}else if(purchase)localStorage.setItem('pixelkovia-checkout-attempt',JSON.stringify(purchase));},{purchase:options.purchase,denyStorage:options.denyStorage});
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.origin==='https://checkout.stripe.com')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><h1>Stripe hosted page fixture</h1></body></html>'});
  if(url.origin!==origin)return route.abort();
  if(url.pathname==='/api/checkout/config')return f.configError?route.abort():route.fulfill({json:{enabled:f.enabled,checkout:'hosted'}});
  if(url.pathname==='/api/checkout/session'){
   f.posts.push(req.postDataJSON());const input=f.posts.at(-1);
   f.totalCents=input.voucherCode==='free'?0:input.voucherCode==='1e'?100:input.baseId==='episode-1'?(input.books.length===2?1998:1499+(input.books.length?499:0))+(input.giftGame?999:0):499*(1+input.books.length);
   if(f.createLost){f.createLost=false;return route.abort();}
   if(f.createError)return route.fulfill({status:f.createError,json:{error:'Skontrolujte objednávku.',...(f.previousPaid?{code:'previous_payment_paid'}:{})}});
   return route.fulfill({json:{sessionId,checkoutUrl:f.url,totalCents:f.totalCents,state:'open'}});
  }
  if(url.pathname==='/api/checkout/status'){
   f.reads++;if(f.statusError)return route.abort();
   return route.fulfill({json:{sessionId,paid:f.paid,delivered:f.delivered,noPaymentRequired:f.totalCents===0,state:f.paid?'paid':f.state,checkoutUrl:['ready','failed'].includes(f.state)?f.url:null,totalCents:f.totalCents,labels:f.labels,orderCount:f.orderCount}});
  }
  if(url.pathname==='/api/checkout/release'){
   f.releases.push(req.postDataJSON());return f.releaseError?route.fulfill({status:409,json:{error:'Overujeme platbu.'}}):route.fulfill({json:{released:true}});
  }
  let file=url.pathname==='/'?'index.html':url.pathname.slice(1);if(!path.extname(file))file+='.html';
  const target=path.join(process.cwd(),'dist/funnel',file);
  if(!fs.existsSync(target)||!fs.statSync(target).isFile())return route.fulfill({status:404,body:''});
  return route.fulfill({contentType:{'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'}[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(target)});
 });
 await page.goto(origin+'/checkout'+(options.query||''));
 await page.waitForFunction(()=>document.querySelector('.checkout-buy').disabled===false||!document.querySelector('#payment-panel').hidden);
 async function voucher(code){await page.locator('#voucher-open').click();await page.locator('#voucher-code').fill(code);await page.locator('#voucher-form').evaluate(el=>el.requestSubmit());}
 async function start(){await page.locator('[name=email]').fill('family@example.invalid');await page.locator('.checkout-buy').click();}
 async function close(){if(errors.length)throw Error('Browser errors: '+errors.join('; '));await context.close();}
 return {page,context,f,voucher,start,close};
}
function cachedPurchase(overrides={}){const input={baseId:'episode-1',books:[],atlasIncluded:true,giftGame:false,email:'family@example.invalid',uiMode:'hosted',attemptKey:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'};return {attemptKey:input.attemptKey,input,sessionId,phase:'ready',...overrides};}
module.exports={launch,open,cachedPurchase,origin,sessionId,checkoutUrl};
