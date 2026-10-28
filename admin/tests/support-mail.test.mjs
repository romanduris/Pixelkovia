import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {fresh} from './support.mjs';
import {first} from '../src/db.mjs';
import {supportWebhook,verifiedEvent} from '../src/support-mail.mjs';
import worker from '../src/worker.mjs';

const secret='whsec_'+Buffer.from('an independent test signing key').toString('base64');
const id='4ef9a417-02e9-4d39-ad75-9611e0fcc33c';
function signed(event={type:'email.received',data:{email_id:id}},options={}){
  const payload=JSON.stringify(event),timestamp=String(options.timestamp||Math.floor(Date.now()/1000)),messageId='msg_support_fixture';
  const signature=createHmac('sha256',Buffer.from(secret.slice(6),'base64')).update(messageId+'.'+timestamp+'.'+payload).digest('base64');
  return new Request('https://pixelkovia.rodulab.com/api/support/webhook',{method:'POST',body:options.payload||payload,headers:{'svix-id':messageId,'svix-timestamp':timestamp,'svix-signature':options.signature||'v1,'+signature}});
}
test('support webhook rejects forged, stale and altered requests before any provider access',async()=>{
  const original=globalThis.fetch;let calls=0;globalThis.fetch=()=>{calls++;throw Error('Unexpected network');};
  try{
    for(const req of [signed(undefined,{signature:'v1,Zm9yZ2Vk'}),signed(undefined,{timestamp:Math.floor(Date.now()/1000)-301}),signed(undefined,{timestamp:Math.floor(Date.now()/1000)+301}),signed(undefined,{payload:'{}'})]){
      const response=await worker.fetch(req,{RESEND_WEBHOOK_SECRET:secret});assert.equal(response.status,400);
    }
    assert.equal(calls,0);
    assert.deepEqual(await verifiedEvent(signed({type:'ping'}),secret),{type:'ping'});
    const rotating=signed({type:'ping'});rotating.headers.set('svix-signature','v1,%%% '+rotating.headers.get('svix-signature'));
    assert.deepEqual(await verifiedEvent(rotating,secret),{type:'ping'},'one malformed signature must not invalidate another valid rotation signature');
  }finally{globalThis.fetch=original;}
});
test('both support aliases forward privately with the requested subjects, reply-to and attachments; replay is idempotent',async()=>{
  const db=fresh(),original=globalThis.fetch,mails=[];
  const env={TQ_DB:db,RESEND_API_KEY:'re_fixture',RESEND_WEBHOOK_SECRET:secret,SUPPORT_FORWARD_TO:'owner@example.invalid'};
  const email={id,from:'Rodina <rodina@example.invalid>',to:['guardy@pixelkovia.rodulab.com','MIKY@pixelkovia.rodulab.com'],subject:'Prosba <rodina>',text:'Pôvodný text',html:'<p>Pôvodný text</p><img src="cid:photo">',attachments:[{id:'attachment',size:3}]};
  globalThis.fetch=async(url,options={})=>{
    assert.equal(options.headers?.Authorization,typeof url==='string'&&url.startsWith('https://api.resend.com')?'Bearer re_fixture':undefined);
    if(String(url).endsWith('?html_format=cid'))return Response.json(email);
    if(String(url).endsWith('/attachments'))return Response.json({data:[{filename:'obrazok.png',content_type:'image/png',content_id:'photo',download_url:'https://inbound-cdn.resend.com/fixture'}]});
    if(String(url)==='https://inbound-cdn.resend.com/fixture')return new Response(new Uint8Array([1,2,3]));
    assert.equal(url,'https://api.resend.com/emails');mails.push({mail:JSON.parse(options.body),key:options.headers['Idempotency-Key']});return Response.json({id:'sent-'+mails.length});
  };
  try{
    const response=await worker.fetch(signed(),env);assert.equal(response.status,200);assert.deepEqual((await response.json()).forwarded,['guardy','miky']);
    assert.deepEqual(mails.map(x=>x.mail.subject),['CHARGEBACK - Pixelkovia - rodina','QUESTION - Pixelkovia - rodina']);
    assert.notEqual(mails[0].key,mails[1].key);
    for(const {mail} of mails){assert.deepEqual(mail.to,['owner@example.invalid']);assert.equal(mail.reply_to,'rodina@example.invalid');assert.ok(mail.text.includes('Pôvodný text'));assert.ok(mail.html.includes('Prosba &lt;rodina&gt;'));assert.deepEqual(mail.attachments,[{filename:'obrazok.png',content:'AQID',content_type:'image/png',content_id:'photo'}]);}
    await supportWebhook(signed(),env);assert.equal(mails.length,2);
    assert.equal((await first(db,'SELECT COUNT(*) n FROM support_forwards')).n,2);
    assert.deepEqual(Object.keys(await first(db,'SELECT * FROM support_forwards')),['email_id','alias','provider_id','forwarded_at'],'no body or private destination is stored in D1');
    email.to=['unknown@pixelkovia.rodulab.com'];assert.equal((await supportWebhook(signed(),env)).ignored,true);assert.equal(mails.length,2);
    email.to=['guardy@pixelkovia.rodulab.com'];email.from='Miky <miky@pixelkovia.rodulab.com>';assert.equal((await supportWebhook(signed(),env)).ignored,true);
  }finally{globalThis.fetch=original;db.close();}
});
test('provider failure retries the same message and key without falsely recording delivery',async()=>{
  const db=fresh(),original=globalThis.fetch,env={TQ_DB:db,RESEND_API_KEY:'fixture',RESEND_WEBHOOK_SECRET:secret,SUPPORT_FORWARD_TO:'owner@example.invalid'};
  let fail=true;const keys=[];
  globalThis.fetch=async(url,options)=>{
    if(String(url).includes('/receiving/'))return Response.json({id,from:'buyer@example.invalid',to:['miky@pixelkovia.rodulab.com'],text:'Otázka'});
    keys.push(options.headers['Idempotency-Key']);return fail?new Response('',{status:503}):Response.json({id:'sent'});
  };
  try{
    await assert.rejects(()=>supportWebhook(signed(),env),e=>e.status===502);assert.equal((await first(db,'SELECT COUNT(*) n FROM support_forwards')).n,0);
    fail=false;await supportWebhook(signed(),env);assert.equal(keys[0],keys[1]);assert.equal((await first(db,'SELECT COUNT(*) n FROM support_forwards')).n,1);
  }finally{globalThis.fetch=original;db.close();}
});
test('envelope support recipients receive the message even when attachments need the private inbox',async()=>{
  const db=fresh(),original=globalThis.fetch,env={TQ_DB:db,RESEND_API_KEY:'fixture',RESEND_WEBHOOK_SECRET:secret,SUPPORT_FORWARD_TO:'owner@example.invalid'};
  const mails=[],email={id,from:'buyer@example.invalid',to:['undisclosed@example.invalid'],received_for:['miky@pixelkovia.rodulab.com'],text:'Prosím o pomoc.',attachments:[{size:16*1024*1024}]};
  let lists=0;
  globalThis.fetch=async(url,options)=>{
    if(String(url).endsWith('?html_format=cid'))return Response.json(email);
    if(String(url).endsWith('/attachments')){lists++;return Response.json({has_more:true,data:[]});}
    assert.equal(url,'https://api.resend.com/emails');mails.push(JSON.parse(options.body));return Response.json({id:'sent-'+mails.length});
  };
  try{
    await supportWebhook(signed(),env);assert.equal(lists,0);assert.equal(mails.length,1);
    assert.match(mails[0].text,/Prosím o pomoc\./);assert.ok(mails[0].text.includes('https://resend.com/emails/receiving/'+id));assert.equal(mails[0].attachments,undefined);
    email.id='5ef9a417-02e9-4d39-ad75-9611e0fcc33c';email.attachments=[{size:1}];
    await supportWebhook(signed({type:'email.received',data:{email_id:email.id}}),env);
    assert.equal(lists,1);assert.equal(mails.length,2);assert.ok(mails[1].text.includes('https://resend.com/emails/receiving/'+email.id));
  }finally{globalThis.fetch=original;db.close();}
});
