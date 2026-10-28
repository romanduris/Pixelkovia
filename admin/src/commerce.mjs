import Stripe from 'stripe';
import {HttpError} from './auth.mjs';
import {first,query,statement,execute,uuid,randomToken,hash} from './db.mjs';
import {credentials,emailAddress} from './customer-auth.mjs';
import {quote,product,offer} from './catalog.mjs';
const ORIGIN='https://pixelkovia.rodulab.com',enc=new TextEncoder();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stripe=env=>env.STRIPE_CLIENT||new Stripe(env.STRIPE_SECRET_KEY,{apiVersion:'2026-08-26.dahlia',maxNetworkRetries:2,httpClient:Stripe.createFetchHttpClient()});
export const commerceReady=env=>env.PAYMENTS_ENABLED==='true'&&!!(env.STRIPE_SECRET_KEY&&env.STRIPE_PUBLISHABLE_KEY&&env.STRIPE_WEBHOOK_SECRET&&env.CUSTOMER_AUTH_SECRET&&env.RESEND_API_KEY&&env.MAIL_DOMAIN_VERIFIED==='true');
export function checkoutConfig(env){return {enabled:commerceReady(env),publishableKey:commerceReady(env)?env.STRIPE_PUBLISHABLE_KEY:null};}
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
  const q=quote(input.books,input.baseId,input.atlasIncluded,input.voucherCode,input.giftGame),id=uuid(),at=Date.now();
  if(input.voucherCode?.trim()&&!q.voucher)throw new HttpError(400,'Tento voucher nepoznáme. Skontrolujte kód a skúste to znova.');
  const ids=[q.baseId,...q.books,...(q.atlasIncluded?[offer.atlasId]:[])];
  const prices=Object.fromEntries(ids.map(productId=>[productId,q.voucher||productId===offer.atlasId?0:product(productId).priceCents-(q.books.includes(productId)?q.bundleDiscountCents/q.books.length:0)]));
  await execute(env.TQ_DB,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at,voucher_code,item_prices,gift_game,gift_price_cents) VALUES(?,?,?,?,?,?,?,?,?,?)',id,email,name,JSON.stringify(ids),q.totalCents,at,q.voucher,JSON.stringify(prices),q.giftGame?1:0,q.giftTotalCents);
  const lines=ids.map(productId=>({price_data:{currency:'eur',product_data:{name:product(productId).name},unit_amount:prices[productId]},quantity:1}));
  if(q.giftGame)lines.push({price_data:{currency:'eur',product_data:{name:'Hra Pixelkovia – Stratený signál · pre ďalšiu rodinu'},unit_amount:q.giftTotalCents},quantity:1});
  // The approved mobile brief explicitly selects card payments, including device wallets.
  const session=await stripe(env).checkout.sessions.create({mode:'payment',ui_mode:'form',payment_method_types:['card'],adaptive_pricing:{enabled:false},customer_email:email,client_reference_id:id,line_items:lines,return_url:ORIGIN+'/checkout?session_id={CHECKOUT_SESSION_ID}',integration_identifier:'pixelkovia_'+Array.from(crypto.getRandomValues(new Uint8Array(8)),b=>String.fromCharCode(97+b%26)).join(''),metadata:{checkout_attempt:id,...(q.voucher?{voucher_code:q.voucher}:{})},expires_at:Math.floor(at/1000)+1800},{idempotencyKey:id});
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
  const text=`${data.gift?'Vaša druhá hra pre ďalšiu rodinu':'Ďakujeme za nákup Pixelkov!'}\n\n${note}\n\nRodičovský portál: ${ORIGIN}/Supervisor\nPrihlasovací e-mail: ${data.email}\nHeslo: ${data.password}\n\nKaždý nákup má vlastné heslo.\n\nAdam · Pixelkovia`;
  const html=`<!doctype html><html lang="sk"><body style="margin:0;background:#eef4f2;font-family:Arial,sans-serif;color:#142331"><table role="presentation" style="width:100%;padding:24px"><tr><td align="center"><table role="presentation" style="width:100%;max-width:520px;background:white;border-radius:18px;padding:30px"><tr><td><img src="${ORIGIN}/assets/atlas/piko.webp" alt="Piko" width="76" height="76"><h1 style="font-size:26px">${data.gift?'Hra pre ďalšiu rodinu':'Dobrodružstvo môže začať.'}</h1><p>${esc(note)}</p><table role="presentation" style="width:100%;background:#eef4f2;padding:16px;border-radius:12px"><tr><td>E-mail<br><strong>${esc(data.email)}</strong><br><br>Heslo pre tento nákup<br><strong style="font-family:monospace;font-size:18px">${esc(data.password)}</strong></td></tr></table><p style="margin:28px 0"><a href="${ORIGIN}/Supervisor" style="background:#1a6759;color:white;text-decoration:none;padding:14px 20px;border-radius:9px;display:inline-block">Otvoriť rodičovský portál →</a></p><p style="font-size:13px;color:#566676">Každý nákup má vlastné heslo. Tento e-mail si odložte.</p><p>Adam · Pixelkovia</p></td></tr></table></td></tr></table></body></html>`;
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
      const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'access/'+row.order_id},body:JSON.stringify({from:'Adam · Pixelkovia <Adam@pixelkovia.rodulab.com>',to:[data.email],reply_to:offer.contactEmail,subject:data.gift?'Vaša druhá hra Pixelkovia – na preposlanie':'Váš prístup do sveta Pixelkov',...accessEmail(data)})});
      if(!response.ok)throw Error('Email provider rejected delivery');const sent=await response.json();
      await db.batch([statement(db,"UPDATE access_deliveries SET status='sent',encrypted_message=NULL,sent_at=?,provider_reference=? WHERE order_id=?",at,sent.id,row.order_id),statement(db,"UPDATE email_events SET status='sent',sent_at=?,provider_reference=? WHERE id=?",at,sent.id,'access-'+row.order_id)]);
    }catch{await db.batch([statement(db,"UPDATE access_deliveries SET status='failed' WHERE order_id=?",row.order_id),statement(db,"UPDATE email_events SET status='failed' WHERE id=?",'access-'+row.order_id)]);}
  }
}
export async function paymentWebhook(request,env){
  if(!env.STRIPE_WEBHOOK_SECRET||!env.STRIPE_SECRET_KEY)throw new HttpError(503,'Platobné udalosti sa pripravujú.');
  const reader=request.body?.getReader(),decoder=new TextDecoder();let bytes='',size=0;
  if(reader)while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>262144){await reader.cancel();throw new HttpError(413,'Príliš veľká udalosť.');}bytes+=decoder.decode(value,{stream:true});}
  bytes+=decoder.decode();
  let event;try{event=await stripe(env).webhooks.constructEventAsync(bytes,request.headers.get('stripe-signature'),env.STRIPE_WEBHOOK_SECRET,undefined,Stripe.createSubtleCryptoProvider());}catch{throw new HttpError(400,'Neplatný podpis platobnej udalosti.');}
  if(await first(env.TQ_DB,'SELECT id FROM payment_events WHERE id=?',event.id))return {received:true};
  if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)&&(event.data.object.payment_status==='paid'||(event.type==='checkout.session.completed'&&event.data.object.payment_status==='no_payment_required')))await fulfill(env,event.data.object.id);
  if(event.type==='charge.refunded'&&event.data.object.refunded===true){await env.TQ_DB.batch([statement(env.TQ_DB,'INSERT OR IGNORE INTO payment_refunds VALUES(?,?)',event.data.object.payment_intent,Date.now()),statement(env.TQ_DB,"UPDATE orders SET status='refunded' WHERE external_reference IN(SELECT stripe_session_id FROM checkout_attempts WHERE payment_intent=?) OR id IN(SELECT co.order_id FROM checkout_orders co JOIN checkout_attempts a ON a.id=co.attempt_id WHERE a.payment_intent=?)",event.data.object.payment_intent,event.data.object.payment_intent)]);}
  await execute(env.TQ_DB,'INSERT OR IGNORE INTO payment_events VALUES(?,?,?)',event.id,event.data.object.id,Date.now());
  await sendPending(env);
  return {received:true};
}
