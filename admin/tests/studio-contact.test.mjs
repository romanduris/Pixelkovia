import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh} from './support.mjs';
import worker from '../src/worker.mjs';
import {studioContact} from '../src/studio-contact.mjs';
const valid={name:'Návštevník',email:'visitor@example.invalid',message:'Chceli by sme nový web pre náš projekt.',requestId:'31bcb450-41ee-4c44-a181-e888da63d743'};
const request=(input=valid,options={})=>new Request('https://'+(options.host||'rodulab.com')+'/api/studio/contact',{method:'POST',headers:{Origin:options.origin||'https://rodulab.com','Content-Type':'application/json',Accept:'application/json','CF-Connecting-IP':options.ip||'192.0.2.1'},body:JSON.stringify(input)});
const env=db=>({TQ_DB:db,RESEND_API_KEY:'test-only-resend',SUPPORT_FORWARD_TO:'owner@example.invalid',CUSTOMER_AUTH_SECRET:'isolated-test-secret'});
test('studio sends only to the private configured recipient, preserves reply-to and makes identical retries idempotent',async()=>{
  const db=fresh(),original=globalThis.fetch,calls=[];
  globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');calls.push({body:JSON.parse(options.body),key:options.headers['Idempotency-Key']});return Response.json({id:'mail-fixture'});};
  try{
    for(let i=0;i<2;i++){const response=await worker.fetch(request({...valid,to:'attacker@example.invalid',from:'attacker@example.invalid'}),env(db));assert.equal(response.status,200);assert.deepEqual(await response.json(),{sent:true});}
    assert.deepEqual(calls[0].body.to,['owner@example.invalid']);assert.equal(calls[0].body.reply_to,valid.email);assert.equal(calls[0].body.from,'RoduLab <studio@pixelkovia.rodulab.com>');assert.ok(calls[0].body.text.includes(valid.message));assert.equal(calls[0].key,calls[1].key);
    assert.ok(!JSON.stringify(db.sqlite.prepare('SELECT * FROM customer_login_attempts').all()).includes(valid.email));assert.ok(!JSON.stringify(db.sqlite.prepare('SELECT * FROM customer_login_attempts').all()).includes('192.0.2.1'));
    const changed=await studioContact(request({...valid,message:valid.message+' Ďakujeme.'}),env(db));assert.deepEqual(changed,{sent:true});assert.notEqual(calls[0].key,calls[2].key);
    await assert.rejects(()=>studioContact(request(),env(db)),e=>e.status===429);assert.equal(calls.length,3);
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM customers').get().n,0);
  }finally{globalThis.fetch=original;db.close();}
});
test('studio rejects cross-origin, wrong host, header injection, malformed and oversized requests before sending',async()=>{
  const db=fresh(),original=globalThis.fetch;let sends=0;globalThis.fetch=async()=>{sends++;throw Error('Network must not run');};
  try{
    for(const [req,status]of [[request(valid,{origin:'https://evil.example'}),403],[request(valid,{host:'pixelkovia.rodulab.com'}),404],[request({...valid,email:'x@example.invalid\r\nBcc: x@evil.example'}),400],[request({...valid,message:'short'}),400],[request({...valid,name:'Injected\nname'}),400],[request({...valid,message:'x'.repeat(3001)}),400],[request({...valid,message:'x'.repeat(17000)}),413],[request({...valid,requestId:'bad'}),400]]){const response=await worker.fetch(req,env(db));assert.equal(response.status,status);}
    assert.deepEqual(await studioContact(request({website:'bot-filled-field'}),env(db)),{sent:true});assert.equal(sends,0);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM customer_login_attempts').get().n,0);
  }finally{globalThis.fetch=original;db.close();}
});
test('studio does not report provider failures as success and retries with the same idempotency key',async()=>{
  const db=fresh(),original=globalThis.fetch,keys=[];let fail=true;
  globalThis.fetch=async(url,options)=>{keys.push(options.headers['Idempotency-Key']);return fail?new Response('',{status:503}):Response.json({id:'mail-sent'});};
  try{const failed=await worker.fetch(request(),env(db));assert.equal(failed.status,502);fail=false;const success=await worker.fetch(request(),env(db));assert.equal(success.status,200);assert.equal(keys[0],keys[1]);}
  finally{globalThis.fetch=original;db.close();}
});
test('studio supports normal HTML form submission without JavaScript',async()=>{
  const db=fresh(),original=globalThis.fetch;globalThis.fetch=async()=>Response.json({id:'sent'});
  try{const r=new Request('https://rodulab.com/api/studio/contact',{method:'POST',headers:{Origin:'https://rodulab.com','Content-Type':'application/x-www-form-urlencoded',Accept:'text/html'},body:new URLSearchParams(valid)});const response=await worker.fetch(r,env(db));assert.equal(response.status,200);assert.match(response.headers.get('Content-Type'),/text\/html/);assert.match(await response.text(),/Správa je u nás/);}
  finally{globalThis.fetch=original;db.close();}
});
