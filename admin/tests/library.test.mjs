import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh} from './support.mjs';
import {execute} from '../src/db.mjs';
import {createOrder} from '../src/game-service.mjs';
import {customerLibrary,readBook} from '../src/library-service.mjs';
import worker from '../src/worker.mjs';
const before='story-book-before',after='story-book-after';
async function fixture(){
  const db=fresh(),at=Date.now();
  for(const id of ['parent','other'])await execute(db,'INSERT INTO customers VALUES(?,?,?,?)',id,id+'@example.invalid',id,at);
  return {db,at};
}
test('library reads only paid valid books belonging to the authenticated customer, independently of game replay',async()=>{
 const {db,at}=await fixture();try{
  assert.deepEqual((await customerLibrary(db,'parent')).books,[{id:before,owned:false},{id:after,owned:false}]);
  await createOrder(db,{id:'paid',customerId:'parent',productId:before,at});
  await createOrder(db,{id:'foreign',customerId:'other',productId:after,at});
  assert.equal((await customerLibrary(db,'parent')).books[0].owned,true);
  const book=await readBook(db,'parent',before);assert.equal(book.stories.length,3);assert.ok(book.stories[0].paragraphs.length>10);
  await assert.rejects(()=>readBook(db,'parent',after),e=>e.status===403);
  await execute(db,'UPDATE entitlements SET replay_until=?,first_completed_at=? WHERE customer_id=?',at-1,at-86400000,'parent');
  assert.equal((await readBook(db,'parent',before)).id,before);
  for(const [sql,args] of [
   ["UPDATE orders SET status='refunded' WHERE id=?",['paid']],
   ["UPDATE entitlements SET status='revoked' WHERE customer_id=?",['parent']],
   ['UPDATE entitlements SET expires_at=? WHERE customer_id=?',[at,'parent']],
   ['UPDATE products SET content_ready=0 WHERE id=?',[before]]
  ]){
   await execute(db,"UPDATE orders SET status='paid' WHERE id='paid'");await execute(db,"UPDATE entitlements SET status='valid',expires_at=NULL WHERE customer_id='parent'");await execute(db,'UPDATE products SET content_ready=1 WHERE id=?',before);
   await execute(db,sql,...args);await assert.rejects(()=>readBook(db,'parent',before,at),e=>e.status===403);
  }
  await assert.rejects(()=>readBook(db,'parent','episode-1'),e=>e.status===404);
 }finally{db.close();}
});
test('library API authenticates reads, rejects forged identities and allows only the configured portal CORS origin',async()=>{
 const {db}=await fixture();try{
  await createOrder(db,{customerId:'parent',productId:before});
  const base='https://api.example.invalid',portal='https://portal.example.invalid';
  const env={TQ_DB:db,WEB_URL:portal,CUSTOMER_AUTH:{fetch:async request=>request.headers.get('cookie')==='session=verified'?Response.json({customerId:'parent',role:'customer'}):new Response(null,{status:401})}};
  const request=(path='',headers={},method='GET')=>worker.fetch(new Request(base+'/api/customer/library'+path,{method,headers:{origin:portal,...headers}}),env);
  const anonymous=await request('',{'X-Customer-ID':'parent'});assert.equal(anonymous.status,401);assert.equal(anonymous.headers.get('Access-Control-Allow-Origin'),portal);assert.ok(!(await anonymous.text()).includes('paragraphs'));
  const list=await request('',{cookie:'session=verified'});assert.equal(list.status,200);assert.equal(list.headers.get('Cache-Control'),'no-store');assert.equal(list.headers.get('Access-Control-Allow-Credentials'),'true');assert.equal((await list.json()).books[0].owned,true);
  const content=await request('/'+before,{cookie:'session=verified'});assert.equal(content.status,200);assert.equal((await content.json()).id,before);
  assert.equal((await request('/'+after,{cookie:'session=verified'})).status,403);
  assert.equal((await request('',{origin:'https://untrusted.example.invalid',cookie:'session=verified'})).status,403);
  assert.equal((await request('',{'Access-Control-Request-Method':'GET'},'OPTIONS')).status,204);
  assert.equal((await request('',{'Access-Control-Request-Method':'POST'},'OPTIONS')).status,403);
  assert.equal((await request('',{cookie:'session=verified'},'POST')).status,405);
  const unavailable=await worker.fetch(new Request(base+'/api/customer/library',{headers:{origin:portal}}),{TQ_DB:db,WEB_URL:portal});assert.equal(unavailable.status,501);assert.equal(unavailable.headers.get('Access-Control-Allow-Origin'),portal);
 }finally{db.close();}
});
