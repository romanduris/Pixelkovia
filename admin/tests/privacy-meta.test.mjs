import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh} from './support.mjs';
import {execute,first,hash} from '../src/db.mjs';
import {saveConsent,readConsent,CONSENT_VERSION,CONSENT_MS,prunePrivacy} from '../src/privacy.mjs';
import {claimMetaPurchase} from '../src/meta-purchase.mjs';
import worker from '../src/worker.mjs';
const origin='https://pixelkovia.rodulab.com';
const req=(path='/api/privacy/consent',cookie='',input,source=origin)=>new Request(origin+path,{method:input?'POST':'GET',headers:{origin:source,'content-type':'application/json',cookie},...(input?{body:JSON.stringify(input)}:{})});
async function fixture({analytics=true,marketing=true,total=2498,paid=true,gift=true,late=false}={}){
 const db=fresh(),at=Date.now(),env={TQ_DB:db,ENVIRONMENT:'production',MARKETING_COLLECTION_ENABLED:'true',STRIPE_PUBLISHABLE_KEY:'pk_test_fixture',CUSTOMER_AUTH_SECRET:'a'.repeat(64)};
 const batch=db.batch.bind(db);let queue=Promise.resolve();db.batch=statements=>{const result=queue.then(()=>batch(statements));queue=result.catch(()=>{});return result;};
 const saved=await saveConsent(req(),env,{version:CONSENT_VERSION,analytics,marketing},at-(late?500:2000)),cookie=saved.cookie.split(';')[0];
 const id=crypto.randomUUID(),sessionId='cs_test_privacypurchase'+id.replaceAll('-','');
 await execute(db,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at,stripe_session_id,gift_game,voucher_code) VALUES(?,?,?,?,?,?,?,?,?)',id,'private@example.invalid','Private','["episode-1","atlas-pixelkov"]',total,at-1000,sessionId,Number(gift),total===0?'free':null);
 const session={id:sessionId,client_reference_id:id,mode:'payment',amount_total:total,currency:'eur',livemode:false,status:paid?'complete':'open',payment_status:paid?(total?'paid':'no_payment_required'):'unpaid',metadata:total===0?{voucher_code:'free'}:{},payment_intent:paid&&total?{id:'pi_privacyfixture',status:'succeeded'}:null};
 let reads=0;env.STRIPE_CLIENT={checkout:{sessions:{async retrieve(){reads++;return session;}}}};
 return {db,env,cookie,id,sessionId,session,at,get reads(){return reads;}};
}
test('consent is server recorded, HttpOnly and versioned; refusal, expiry and withdrawal fail closed',async()=>{
 const f=await fixture();try{
  const initial=await readConsent(req('',f.cookie),f.env);assert.equal(initial.marketing,1);
  const token=f.cookie.split('=')[1];assert.equal(initial.id,await hash(token));assert.notEqual(initial.id,token);
  const response=await worker.fetch(req('/api/privacy/consent',f.cookie,{version:CONSENT_VERSION,analytics:false,marketing:false}),f.env);
  assert.equal(response.status,200);assert.match(response.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Lax; Path=\//);
  assert.equal(await readConsent(req('',f.cookie),f.env),null,'superseded token is revoked immediately');
  const cookie=response.headers.get('set-cookie').split(';')[0],state=await (await worker.fetch(req('/api/privacy/consent',cookie),f.env)).json();
  assert.equal(state.choice.analytics,false);assert.equal(state.choice.marketing,false);
  assert.equal(await readConsent(req('',cookie),f.env,Date.now()+CONSENT_MS+1),null);
  const forged=await worker.fetch(req('/api/privacy/consent','',{version:CONSENT_VERSION,analytics:true,marketing:true},'https://attacker.invalid'),f.env);assert.equal(forged.status,403);
  await prunePrivacy(f.env,Date.now()+CONSENT_MS*2+1);assert.equal((await first(f.db,'SELECT count(*) n FROM privacy_consents')).n,0);
 }finally{f.db.close();}
});
test('anonymous, marketing-only and old cached collectors cannot write analytics; granted analytics can',async()=>{
 const f=await fixture({analytics:false});try{
  const event={mode:'session',type:'visit',visitId:crypto.randomUUID(),visitorId:crypto.randomUUID(),source:'facebook_ads',campaign:'consent-qa',device:'mobile'};
  for(const cookie of ['',f.cookie])assert.equal((await worker.fetch(req('/api/marketing/event',cookie,event),f.env)).status,403);
  assert.equal((await first(f.db,'SELECT count(*) n FROM marketing_visits')).n,0);
  const saved=await saveConsent(req('',f.cookie),f.env,{version:CONSENT_VERSION,analytics:true,marketing:false}),cookie=saved.cookie.split(';')[0];
  assert.equal((await worker.fetch(req('/api/marketing/event',cookie,event),f.env)).status,200);
  assert.equal((await first(f.db,'SELECT count(*) n FROM marketing_visits')).n,1);
  assert.equal((await worker.fetch(req('/api/marketing/purchase',cookie,{sessionId:f.sessionId}),f.env)).status,403);
 }finally{f.db.close();}
});
test('verified gift payment emits one server-priced Purchase across concurrent tabs and reloads; no PII in payload',async()=>{
 const f=await fixture();try{
  const calls=await Promise.all(Array.from({length:3},()=>claimMetaPurchase(req('',f.cookie),f.env,{sessionId:f.sessionId,value:999,currency:'USD'})));
  assert.equal(calls.filter(r=>r.purchase).length,1);
  const result=calls.find(r=>r.purchase).purchase;assert.equal(result.value,24.98);assert.equal(result.currency,'EUR');assert.equal(result.eventId,'purchase-'+f.id);
  assert.ok(!JSON.stringify(result).includes('private@'));assert.ok(!JSON.stringify(result).includes('cs_test_'));
  const before=f.reads;assert.equal((await claimMetaPurchase(req('',f.cookie),f.env,{sessionId:f.sessionId})).purchase,null);assert.equal(f.reads,before);
  assert.equal((await first(f.db,'SELECT count(*) n FROM meta_pixel_purchases')).n,1);
  assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,0,'advertising never grants access');
 }finally{f.db.close();}
});
test('unpaid, free, refunded, unknown, unconsented and historic purchases never emit Purchase',async()=>{
 for(const options of [{paid:false},{total:0},{late:true},{marketing:false}]){
  const f=await fixture(options);try{
   const response=await worker.fetch(req('/api/marketing/purchase',f.cookie,{sessionId:f.sessionId}),f.env);assert.equal(response.status,options.marketing===false?403:200);
   if(response.ok)assert.equal((await response.json()).purchase,null);
   assert.equal((await first(f.db,'SELECT count(*) n FROM meta_pixel_purchases')).n,0);
  }finally{f.db.close();}
 }
 const f=await fixture();try{
  f.session.payment_intent.latest_charge={refunded:true};assert.equal((await claimMetaPurchase(req('',f.cookie),f.env,{sessionId:f.sessionId})).purchase,null);
  f.session.amount_total=1;await assert.rejects(()=>claimMetaPurchase(req('',f.cookie),f.env,{sessionId:f.sessionId}),e=>e.status===400);
  assert.equal((await claimMetaPurchase(req('',f.cookie),f.env,{sessionId:'cs_test_unknownfixture'})).purchase,null);
  await assert.rejects(()=>claimMetaPurchase(req(),f.env,{sessionId:f.sessionId}),e=>e.status===403);
 }finally{f.db.close();}
});
test('withdrawal during Stripe verification prevents a claim',async()=>{
 const f=await fixture();try{
  f.env.STRIPE_CLIENT.checkout.sessions.retrieve=async()=>{await saveConsent(req('',f.cookie),f.env,{version:CONSENT_VERSION,analytics:true,marketing:false});return f.session;};
  assert.equal((await claimMetaPurchase(req('',f.cookie),f.env,{sessionId:f.sessionId})).purchase,null);
  assert.equal((await first(f.db,'SELECT count(*) n FROM meta_pixel_purchases')).n,0);
 }finally{f.db.close();}
});

test('changing analytics preserves a continuous marketing grant, but re-granting marketing never backfills',async()=>{
 const f=await fixture();try{
  const updated=await saveConsent(req('',f.cookie),f.env,{version:CONSENT_VERSION,analytics:false,marketing:true});
  const cookie=updated.cookie.split(';')[0];
  assert.equal((await readConsent(req('',cookie),f.env)).marketing_since,f.at-2000);
  assert.equal((await claimMetaPurchase(req('',cookie),f.env,{sessionId:f.sessionId})).purchase.value,24.98);
 }finally{f.db.close();}
});
