import Stripe from 'stripe';
import {HttpError} from './auth.mjs';
import {first,query,statement,execute,uuid,randomToken,hash} from './db.mjs';
import {credentials,emailAddress} from './customer-auth.mjs';
import {quote,product,offer} from './catalog.mjs';
const ORIGIN='https://pixelkovia.rodulab.com',enc=new TextEncoder();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stripe=env=>env.STRIPE_CLIENT||new Stripe(env.STRIPE_SECRET_KEY,{apiVersion:'2026-08-26.dahlia',maxNetworkRetries:2,httpClient:Stripe.createFetchHttpClient()});
export const commerceReady=env=>env.PAYMENTS_ENABLED==='true'&&!!(env.STRIPE_SECRET_KEY&&env.STRIPE_PUBLISHABLE_KEY&&env.STRIPE_WEBHOOK_SECRET&&env.CUSTOMER_AUTH_SECRET&&env.RESEND_API_KEY&&env.MAIL_DOMAIN_VERIFIED==='true');
// Wallets stay off until native-device validation is completed. Account settings are untouched.
export function checkoutConfig(env){return {enabled:commerceReady(env),publishableKey:commerceReady(env)?env.STRIPE_PUBLISHABLE_KEY:null,wallets:{applePay:false,googlePay:false}};}
const pendingMessage='Overujeme vašu platbu. Prosíme, neplaťte znova. Potvrdenie a prístup vám po úspešnej úhrade prídu e-mailom.';
const requestHash=async key=>{
  if(typeof key!=='string'||!/^[-a-zA-Z0-9_]{32,100}$/.test(key))throw new HttpError(400,'Neplatný identifikátor nákupu.');
  return hash(key);
};
function verifySession(env,session,attempt){
  if(!session||session.id!==attempt.stripe_session_id||session.client_reference_id!==attempt.id||session.mode!=='payment'||session.amount_total!==attempt.total_cents||session.currency!=='eur'||session.livemode!==env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_'))throw new HttpError(400,'Platbu sa nepodarilo priradiť k objednávke.');
  if(attempt.total_cents===0&&(attempt.voucher_code!=='free'||session.metadata?.voucher_code!=='free'))throw new HttpError(400,'Objednávku zdarma sa nepodarilo overiť.');
  if(attempt.fixed_total_voucher==='1e'&&(attempt.total_cents!==100||session.metadata?.voucher_code!=='1e'))throw new HttpError(400,'Platbu s kupónom sa nepodarilo overiť.');
}
const settledPaid=(session,attempt)=>session.status==='complete'&&(session.payment_status==='paid'||(attempt.voucher_code==='free'&&attempt.total_cents===0&&session.payment_status==='no_payment_required'));
const safelyExpired=session=>session.status==='expired'&&['unpaid','no_payment_required'].includes(session.payment_status)&&(!session.payment_intent||['canceled','requires_payment_method'].includes(session.payment_intent.status));
async function readSession(env,attempt){const session=await stripe(env).checkout.sessions.retrieve(attempt.stripe_session_id,{expand:['payment_intent.latest_charge']});verifySession(env,session,attempt);return session;}
export async function releaseCheckout(env,input){
  const row=await first(env.TQ_DB,'SELECT a.* FROM checkout_requests r JOIN checkout_attempts a ON a.id=r.attempt_id WHERE r.request_key=? AND r.active=1',await requestHash(input.attemptKey));
  if(!row)return {released:true};
  if(!row.stripe_session_id)throw new HttpError(409,pendingMessage);
  let session=await readSession(env,row);
  if(!settledPaid(session,row)&&!safelyExpired(session)){
    const intent=session.payment_intent;
    if(session.status!=='open'||!(session.payment_status==='unpaid'||(row.total_cents===0&&row.voucher_code==='free'&&session.payment_status==='no_payment_required'))||(intent&&!['requires_payment_method','canceled'].includes(intent.status)))throw new HttpError(409,pendingMessage);
    // Expiration closes the original Stripe Session before another can be created.
    await stripe(env).checkout.sessions.expire(session.id);
    session=await readSession(env,row);
    if(!safelyExpired(session))throw new HttpError(409,pendingMessage);
  }
  await execute(env.TQ_DB,'UPDATE checkout_requests SET active=0 WHERE attempt_id=?',row.id);
  return {released:true};
}
export async function verifiedCheckoutStatus(env,sessionId){
  const order=await checkoutStatus(env.TQ_DB,sessionId);
  const attempt=await first(env.TQ_DB,'SELECT * FROM checkout_attempts WHERE stripe_session_id=?',sessionId);
  if(!attempt)return {...order,state:'unknown',retryAllowed:false};
  const session=await readSession(env,attempt),intent=session.payment_intent;
  if(intent?.latest_charge?.refunded===true||(order.orderCount&&!order.paid))return {...order,paid:false,state:'refunded',retryAllowed:false};
  const paid=settledPaid(session,attempt);
  const failed=session.status==='open'&&intent?.status==='requires_payment_method'&&!!intent.last_payment_error;
  return {...order,paid:paid||order.paid,noPaymentRequired:paid?attempt.total_cents===0:order.noPaymentRequired,state:paid||order.paid?'paid':safelyExpired(session)?'expired':failed?'failed':'pending',retryAllowed:failed||safelyExpired(session),orderCount:order.orderCount||(paid?(attempt.gift_game?2:1):0)};
}
export async function createCheckout(env,input){
  if(!commerceReady(env))throw new HttpError(503,'Predaj práve pripravujeme. Platba sa nespustila.');
  const email=emailAddress(typeof input.email==='string'?input.email.trim():null),name=typeof input.name==='string'?input.name.trim().slice(0,120):'';
  if(!email)throw new HttpError(400,'Zadajte platný e-mail na doručenie prístupu.');
  const scope='checkout:'+await hash(env.CUSTOMER_AUTH_SECRET+':'+String(input.__ip||'unknown'));
  const throttle=await first(env.TQ_DB,`INSERT INTO customer_login_attempts VALUES(?,1,?) ON CONFLICT(scope_key) DO UPDATE SET attempts=CASE WHEN window_start<=? THEN 1 ELSE attempts+1 END,window_start=CASE WHEN window_start<=? THEN excluded.window_start ELSE window_start END RETURNING attempts`,scope,Date.now(),Date.now()-900000,Date.now()-900000);
  if(throttle.attempts>60)throw new HttpError(429,'Príliš veľa platobných pokusov. Skúste to neskôr.');
  if(!['episode-1',...offer.bookIds].includes(input.baseId)||!Array.isArray(input.books)||input.books.length>2||input.books.some(id=>!offer.bookIds.includes(id))||typeof input.atlasIncluded!=='boolean')throw new HttpError(400,'Neplatný výber produktov.');
  if(input.voucherCode!==undefined&&(typeof input.voucherCode!=='string'||input.voucherCode.length>64))throw new HttpError(400,'Neplatný zľavový kód.');
  if(input.giftGame!==undefined&&(typeof input.giftGame!=='boolean'||(input.giftGame&&input.baseId!=='episode-1')))throw new HttpError(400,'Druhú hru možno pridať iba k základnej hre.');
  if(input.uiMode!==undefined&&!['elements','form'].includes(input.uiMode))throw new HttpError(400,'Neplatný platobný formulár.');
  const q=quote([...input.books].sort(),input.baseId,input.atlasIncluded,input.voucherCode,input.giftGame);
  let id=uuid(),at=Date.now();
  if(input.voucherCode?.trim()&&!q.voucher)throw new HttpError(400,'Tento voucher nepoznáme. Skontrolujte kód a skúste to znova.');
  const ids=[q.baseId,...q.books,...(q.atlasIncluded?[offer.atlasId]:[])];
  // Split an odd-cent book discount deterministically; Stripe amounts are whole cents.
  const bookDiscount=productId=>{const index=q.books.indexOf(productId);return index<0?0:Math.floor(q.bundleDiscountCents/q.books.length)+(index<q.bundleDiscountCents%q.books.length?1:0);};
  const prices=Object.fromEntries(ids.map(productId=>[productId,productId===offer.atlasId?0:product(productId).priceCents-bookDiscount(productId)]));
  if(q.voucher){
    // Largest remainders preserve the exact total with whole-cent Stripe items.
    const weight=ids.reduce((sum,id)=>sum+prices[id],0);
    const allocation=ids.map((id,index)=>({id,index,cents:Math.floor(prices[id]*q.primaryTotalCents/weight),remainder:prices[id]*q.primaryTotalCents%weight}));
    const remaining=q.primaryTotalCents-allocation.reduce((sum,item)=>sum+item.cents,0);
    allocation.sort((a,b)=>b.remainder-a.remainder||a.index-b.index);
    allocation.forEach((item,index)=>{prices[item.id]=item.cents+(index<remaining?1:0);});
  }
  const requestKey=await requestHash(input.attemptKey||randomToken()),emailKey=await hash(env.CUSTOMER_AUTH_SECRET+':checkout:'+email.toLowerCase());
  const payloadHash=await hash(JSON.stringify([email.toLowerCase(),name,q.baseId,[...q.books].sort(),q.atlasIncluded,q.voucher,q.giftGame,input.uiMode||'form']));
  let existing=await first(env.TQ_DB,'SELECT * FROM checkout_requests WHERE request_key=?',requestKey);
  if(!existing){
    const active=await first(env.TQ_DB,'SELECT a.* FROM checkout_requests r JOIN checkout_attempts a ON a.id=r.attempt_id WHERE r.email_key=? AND r.active=1',emailKey)||await first(env.TQ_DB,`SELECT a.* FROM checkout_attempts a WHERE lower(a.email)=? AND a.stripe_session_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM checkout_requests r WHERE r.attempt_id=a.id) ORDER BY a.created_at DESC LIMIT 1`,email.toLowerCase());
    if(active){
      if(!active.stripe_session_id)throw new HttpError(409,pendingMessage);
      const session=await readSession(env,active);
      if(!safelyExpired(session)&&!(settledPaid(session,active)&&input.newPurchase===true)){const error=new HttpError(409,settledPaid(session,active)?'Predchádzajúca platba je potvrdená. Prístup vám príde e-mailom. Ďalšiu samostatnú objednávku vytvorte iba zámerne.':pendingMessage);if(settledPaid(session,active))error.code='previous_payment_paid';throw error;}
      await execute(env.TQ_DB,'UPDATE checkout_requests SET active=0 WHERE attempt_id=?',active.id);
    }
    try{await env.TQ_DB.batch([
      statement(env.TQ_DB,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at,voucher_code,item_prices,gift_game,gift_price_cents,fixed_total_voucher) VALUES(?,?,?,?,?,?,?,?,?,?,?)',id,email,name,JSON.stringify(ids),q.totalCents,at,q.voucher==='free'?'free':null,JSON.stringify(prices),q.giftGame?1:0,q.giftTotalCents,q.voucher==='1e'?'1e':null),
      statement(env.TQ_DB,'INSERT INTO checkout_requests(request_key,email_key,payload_hash,attempt_id) VALUES(?,?,?,?)',requestKey,emailKey,payloadHash,id)
    ]);}catch(error){
      existing=await first(env.TQ_DB,'SELECT * FROM checkout_requests WHERE request_key=?',requestKey);
      if(!existing){if(await first(env.TQ_DB,'SELECT request_key FROM checkout_requests WHERE email_key=? AND active=1',emailKey))throw new HttpError(409,pendingMessage);throw error;}
    }
  }
  if(existing){
    if(!existing.active||existing.payload_hash!==payloadHash)throw new HttpError(409,'Tento nákup už existuje. Overte pôvodnú platbu alebo bezpečne ukončite pôvodnú objednávku.');
    const saved=await first(env.TQ_DB,'SELECT * FROM checkout_attempts WHERE id=?',existing.attempt_id);
    id=saved.id;at=saved.created_at;
    if(saved.stripe_session_id){const session=await readSession(env,saved);return {clientSecret:session.client_secret,sessionId:session.id,totalCents:saved.total_cents,state:settledPaid(session,saved)?'paid':safelyExpired(session)?'expired':'open'};}
    // A lost Stripe create response is retried with the original exact request/key.
    if(saved.total_cents!==q.totalCents||saved.item_prices!==JSON.stringify(prices)||Date.now()-at>1800000)throw new HttpError(409,pendingMessage);
  }
  const lines=ids.map(productId=>({price_data:{currency:'eur',product_data:{name:product(productId).name},unit_amount:prices[productId]},quantity:1}));
  if(q.giftGame)lines.push({price_data:{currency:'eur',product_data:{name:'Hra Pixelkovia – Stratený signál · pre ďalšiu rodinu'},unit_amount:q.giftTotalCents},quantity:1});
  // Scope method exclusions to this checkout; account-wide settings stay shared.
  // Older open checkout tabs still request the original form during deployment.
  const excludedMethods=['bancontact','blik','eps','ideal','klarna','swish','kakao_pay','mb_way','naver_pay','payco','pix','samsung_pay','satispay'];
  const session=await stripe(env).checkout.sessions.create({mode:'payment',ui_mode:input.uiMode==='elements'?'elements':'form',locale:'sk',excluded_payment_method_types:excludedMethods,wallet_options:{link:{display:'never'}},adaptive_pricing:{enabled:false},customer_email:email,client_reference_id:id,line_items:lines,return_url:ORIGIN+'/checkout?session_id={CHECKOUT_SESSION_ID}',integration_identifier:'pixelkovia_'+id.replaceAll('-','').slice(0,8).split('').map(c=>String.fromCharCode(97+parseInt(c,16))).join(''),metadata:{checkout_attempt:id,...(q.voucher?{voucher_code:q.voucher}:{})},expires_at:Math.floor(at/1000)+1800},{idempotencyKey:id});
  await execute(env.TQ_DB,'UPDATE checkout_attempts SET stripe_session_id=? WHERE id=?',session.id,id);
  return {clientSecret:session.client_secret,sessionId:session.id,totalCents:q.totalCents};
}
async function encryptionKey(secret){return crypto.subtle.importKey('raw',Uint8Array.from(secret.match(/../g),x=>parseInt(x,16)),'AES-GCM',false,['encrypt','decrypt']);}
export async function seal(value,secret){const iv=crypto.getRandomValues(new Uint8Array(12));const bytes=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await encryptionKey(secret),enc.encode(JSON.stringify(value))));return btoa(String.fromCharCode(...iv,...bytes));}
export async function unseal(value,secret){const bytes=Uint8Array.from(atob(value),c=>c.charCodeAt(0));return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12)},await encryptionKey(secret),bytes.slice(12))));}
export async function fulfill(env,sessionId){
  const db=env.TQ_DB,previous=await first(db,'SELECT id FROM orders WHERE external_reference=?',sessionId);
  if(previous)return previous;
  const session=await stripe(env).checkout.sessions.retrieve(sessionId,{expand:['payment_intent.latest_charge']});
  const completedFree=session.payment_status==='no_payment_required'&&session.status==='complete'&&session.amount_total===0;
  if((session.payment_status!=='paid'&&!completedFree)||session.mode!=='payment')return null;
  const attempt=await first(db,'SELECT * FROM checkout_attempts WHERE id=? AND stripe_session_id=?',session.client_reference_id,session.id);
  if(!attempt||session.amount_total!==attempt.total_cents||session.currency!=='eur'||session.livemode!==env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_'))throw new HttpError(400,'Platbu sa nepodarilo priradiť k objednávke.');
  if(attempt.total_cents===0&&(attempt.voucher_code!=='free'||session.metadata?.voucher_code!=='free'||!completedFree))throw new HttpError(400,'Objednávku zdarma sa nepodarilo overiť.');
  if(attempt.fixed_total_voucher==='1e'&&(attempt.total_cents!==100||session.metadata?.voucher_code!=='1e'||session.payment_status!=='paid'||session.status!=='complete'))throw new HttpError(400,'Platbu s kupónom sa nepodarilo overiť.');
  const intentId=typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id||null;
  await execute(db,'UPDATE checkout_attempts SET payment_intent=? WHERE id=?',intentId,attempt.id);
  if(session.payment_intent?.latest_charge?.refunded===true)await execute(db,'INSERT OR IGNORE INTO payment_refunds VALUES(?,?)',intentId,Date.now());
  const ids=JSON.parse(attempt.selection),at=Date.now();
  // Older attempts retain their original allocation; new ones use the exact Stripe prices.
  const legacyDiscount=ids.includes('episode-1')&&offer.bookIds.every(id=>ids.includes(id))?498:0;
  const prices=attempt.item_prices?JSON.parse(attempt.item_prices):Object.fromEntries(ids.map(productId=>[productId,productId===offer.atlasId?0:product(productId).priceCents-(productId==='episode-1'?legacyDiscount:0)]));
  const primaryTotal=ids.reduce((sum,id)=>sum+prices[id],0),giftTotal=attempt.gift_price_cents;
  if(ids.some(id=>!Number.isInteger(prices[id])||prices[id]<0)||!Number.isInteger(giftTotal)||giftTotal<0||(!attempt.gift_game&&giftTotal!==0)||primaryTotal+giftTotal!==attempt.total_cents)throw new HttpError(400,'Ceny objednávky sa nepodarilo overiť.');
  const plans=[{kind:'primary',ids,prices,total:primaryTotal,reference:session.id}];
  if(attempt.gift_game)plans.push({kind:'gift',ids:['episode-1'],prices:{'episode-1':giftTotal},total:giftTotal,reference:session.id+':gift'});
  const batch=[];
  for(const plan of plans){
    const id=plan.id=uuid(),customerId=uuid(),password=randomToken().slice(0,24);
    const c=await credentials(attempt.email,password,env.CUSTOMER_AUTH_SECRET,at);
    const message=await seal({email:attempt.email,password,name:attempt.name,gift:plan.kind==='gift',products:plan.ids.map(id=>product(id).name)},env.CUSTOMER_AUTH_SECRET);
    batch.push(statement(db,'INSERT INTO customers VALUES(?,?,?,?)',customerId,attempt.email,attempt.name||attempt.email,at),statement(db,'INSERT INTO customer_credentials VALUES(?,?,?,?,?)',customerId,c.lookup,c.salt,c.hash,at),statement(db,"INSERT INTO orders SELECT ?,?,?,CASE WHEN EXISTS(SELECT 1 FROM payment_refunds WHERE payment_intent=?) THEN 'refunded' ELSE 'paid' END,?,?,?,?",id,customerId,plan.reference,intentId,plan.total,'EUR',at,at),statement(db,'INSERT INTO checkout_orders VALUES(?,?,?)',attempt.id,plan.kind,id));
    for(const productId of plan.ids){const item=uuid();batch.push(statement(db,'INSERT INTO order_items VALUES(?,?,?,?,?)',item,id,productId,1,plan.prices[productId]),statement(db,"INSERT INTO entitlements(id,customer_id,order_item_id,product_id,granted_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM orders WHERE id=? AND status='paid')",uuid(),customerId,item,productId,at,id));}
    batch.push(statement(db,"INSERT INTO access_deliveries(order_id,customer_id,encrypted_message,status) SELECT ?,?,?,'queued' WHERE EXISTS(SELECT 1 FROM orders WHERE id=? AND status='paid')",id,customerId,message,id),statement(db,"INSERT INTO email_events(id,customer_id,template_key,category,status,created_at) SELECT ?,?,'portal-access','transactional','queued',? WHERE EXISTS(SELECT 1 FROM orders WHERE id=? AND status='paid')",'access-'+id,customerId,at,id));
  }
  try{await db.batch(batch);}catch(error){const duplicate=await first(db,'SELECT id FROM orders WHERE external_reference=?',session.id);if(duplicate)return duplicate;throw error;}
  return {id:plans[0].id};
}
export async function checkoutStatus(db,session){
  const rows=await query(db,`SELECT o.status,o.total_cents,d.status delivery FROM orders o LEFT JOIN access_deliveries d ON d.order_id=o.id WHERE o.external_reference=? OR o.id IN(SELECT co.order_id FROM checkout_orders co JOIN checkout_attempts a ON a.id=co.attempt_id WHERE a.stripe_session_id=?)`,session,session);
  return {paid:rows.length>0&&rows.every(o=>o.status==='paid'),delivered:rows.length>0&&rows.every(o=>o.delivery==='sent'),noPaymentRequired:rows.length>0&&rows.every(o=>o.total_cents===0),orderCount:rows.length};
}
export function accessEmail(data){
  const note=data.gift?'Toto je samostatná hra pre ďalšiu rodinu. Tento e-mail môžete preposlať kamarátom. Obsahuje iba ich vlastný prístup k základnej hre.':'V rodičovskom portáli nájdete zakúpený obsah a prípravu hry.';
  const text=`${data.gift?'Vaša druhá hra pre ďalšiu rodinu':'Ďakujeme za nákup Pixelkov!'}\n\n${note}\n\nRodičovský portál: ${ORIGIN}/Supervisor\nPrihlasovací e-mail: ${data.email}\nHeslo: ${data.password}\n\nKaždý nákup má vlastné heslo.\n\nPiko · Pixelkovia`;
  const html=`<!doctype html><html lang="sk"><body style="margin:0;background:#eef4f2;font-family:Arial,sans-serif;color:#142331"><table role="presentation" style="width:100%;padding:24px"><tr><td align="center"><table role="presentation" style="width:100%;max-width:520px;background:white;border-radius:18px;padding:30px"><tr><td><img src="${ORIGIN}/assets/atlas/piko.webp" alt="Piko" width="76" height="76"><h1 style="font-size:26px">${data.gift?'Hra pre ďalšiu rodinu':'Dobrodružstvo môže začať.'}</h1><p>${esc(note)}</p><table role="presentation" style="width:100%;background:#eef4f2;padding:16px;border-radius:12px"><tr><td>E-mail<br><strong>${esc(data.email)}</strong><br><br>Heslo pre tento nákup<br><strong style="font-family:monospace;font-size:18px">${esc(data.password)}</strong></td></tr></table><p style="margin:28px 0"><a href="${ORIGIN}/Supervisor" style="background:#1a6759;color:white;text-decoration:none;padding:14px 20px;border-radius:9px;display:inline-block">Otvoriť rodičovský portál →</a></p><p style="font-size:13px;color:#566676">Každý nákup má vlastné heslo. Tento e-mail si odložte.</p><p>Piko · Pixelkovia</p></td></tr></table></td></tr></table></body></html>`;
  return {text,html};
}
export async function sendPending(env){
  if(!env.RESEND_API_KEY||!env.CUSTOMER_AUTH_SECRET||env.MAIL_DOMAIN_VERIFIED!=='true')return;
  const db=env.TQ_DB,rows=await query(db,`SELECT d.* FROM access_deliveries d JOIN orders o ON o.id=d.order_id WHERE d.status<>'sent' AND d.encrypted_message IS NOT NULL AND o.status='paid' AND (d.last_attempt_at IS NULL OR d.last_attempt_at<?) ORDER BY d.rowid LIMIT 10`,Date.now()-600000);
  for(const row of rows){
    const at=Date.now();
    const claim=await execute(db,"UPDATE access_deliveries SET attempts=attempts+1,last_attempt_at=? WHERE order_id=? AND status<>'sent' AND (last_attempt_at IS NULL OR last_attempt_at<?)",at,row.order_id,at-600000);if(!claim.meta.changes)continue;
    try{
      const data=await unseal(row.encrypted_message,env.CUSTOMER_AUTH_SECRET);
      const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'access/'+row.order_id},body:JSON.stringify({from:'Piko · Pixelkovia <Piko@pixelkovia.rodulab.com>',to:[data.email],reply_to:offer.contactEmail,subject:data.gift?'Vaša druhá hra Pixelkovia – na preposlanie':'Váš prístup do sveta Pixelkov',...accessEmail(data)})});
      if(!response.ok)throw Error('Email provider rejected delivery');const sent=await response.json();
      await db.batch([statement(db,"UPDATE access_deliveries SET status='sent',encrypted_message=NULL,sent_at=?,provider_reference=? WHERE order_id=?",at,sent.id,row.order_id),statement(db,"UPDATE email_events SET status='sent',sent_at=?,provider_reference=? WHERE id=?",at,sent.id,'access-'+row.order_id)]);
    }catch{await db.batch([statement(db,"UPDATE access_deliveries SET status='failed' WHERE order_id=?",row.order_id),statement(db,"UPDATE email_events SET status='failed' WHERE id=?",'access-'+row.order_id)]);}
  }
}
export async function paymentWebhook(request,env,context){
  if(!env.STRIPE_WEBHOOK_SECRET||!env.STRIPE_SECRET_KEY)throw new HttpError(503,'Platobné udalosti sa pripravujú.');
  const reader=request.body?.getReader(),decoder=new TextDecoder();let bytes='',size=0;
  if(reader)while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>262144){await reader.cancel();throw new HttpError(413,'Príliš veľká udalosť.');}bytes+=decoder.decode(value,{stream:true});}
  bytes+=decoder.decode();
  let event;try{event=await stripe(env).webhooks.constructEventAsync(bytes,request.headers.get('stripe-signature'),env.STRIPE_WEBHOOK_SECRET,undefined,Stripe.createSubtleCryptoProvider());}catch{throw new HttpError(400,'Neplatný podpis platobnej udalosti.');}
  if(await first(env.TQ_DB,'SELECT id FROM payment_events WHERE id=?',event.id))return {received:true};
  if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)&&(event.data.object.payment_status==='paid'||(event.type==='checkout.session.completed'&&event.data.object.payment_status==='no_payment_required')))await fulfill(env,event.data.object.id);
  if(event.type==='charge.refunded'&&event.data.object.refunded===true){await env.TQ_DB.batch([statement(env.TQ_DB,'INSERT OR IGNORE INTO payment_refunds VALUES(?,?)',event.data.object.payment_intent,Date.now()),statement(env.TQ_DB,"UPDATE orders SET status='refunded' WHERE external_reference IN(SELECT stripe_session_id FROM checkout_attempts WHERE payment_intent=?) OR id IN(SELECT co.order_id FROM checkout_orders co JOIN checkout_attempts a ON a.id=co.attempt_id WHERE a.payment_intent=?)",event.data.object.payment_intent,event.data.object.payment_intent)]);}
  await execute(env.TQ_DB,'INSERT OR IGNORE INTO payment_events VALUES(?,?,?)',event.id,event.data.object.id,Date.now());
  if(context?.waitUntil)context.waitUntil(sendPending(env));else await sendPending(env);
  return {received:true};
}
