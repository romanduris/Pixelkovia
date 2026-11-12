import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';

test('Pages routes every shipped admin JS module through backend authorization',async()=>{
 const source=await readFile(new URL('../../funnel/gateway.mjs',import.meta.url),'utf8');
 const {default:gateway}=await import('data:text/javascript;base64,'+Buffer.from('const PRIVATE_FILES={},PUBLIC_FILES=[];\n'+source).toString('base64'));
 const files=(await readdir(new URL('../public/',import.meta.url))).filter(file=>file.endsWith('.js')&&file!=='login.js');
 const env={BACKEND:{async fetch(request){
  if(request.headers.get('cookie')!=='fixture-admin-session')return new Response(null,{status:303,headers:{Location:'/login'}});
  return new Response(await readFile(new URL('../public'+new URL(request.url).pathname,import.meta.url),'utf8'));
 }}};
 for(const file of files){
  const url='https://pixelkovia.rodulab.com/admin/'+file;
  const denied=await gateway.fetch(new Request(url),env);assert.equal(denied.status,303,file);assert.equal(denied.headers.get('location'),'/admin/login');
  const allowed=await gateway.fetch(new Request(url,{headers:{cookie:'fixture-admin-session'}}),env);assert.equal(allowed.status,200,file);assert.equal(await allowed.text(),await readFile(new URL('../public/'+file,import.meta.url),'utf8'));assert.match(allowed.headers.get('cache-control'),/private, no-store/);
 }
 assert.equal((await gateway.fetch(new Request('https://pixelkovia.rodulab.com/admin/unlisted.js'),env)).status,404);
});

test('social ZIP download requires an administrator and sends a private attachment',async()=>{
 const inventory=JSON.parse(await readFile(new URL('../../dist/deployment-inventory.json',import.meta.url),'utf8'));
 const route='/admin/social/Pixelkovia-prispevky-12-16-november-2026.zip',entry=inventory.protected[route];
 assert.equal(entry.role,'admin');assert.equal(entry.document,false);
 assert.ok(!Object.keys(inventory.protected).some(path=>path.startsWith('/assets/social/')));
 const source=await readFile(new URL('../../funnel/gateway.mjs',import.meta.url),'utf8');
 const {default:gateway}=await import('data:text/javascript;base64,'+Buffer.from(`const PRIVATE_FILES=${JSON.stringify({[route]:entry})},PUBLIC_FILES=[];\n`+source).toString('base64'));
 const bytes=await readFile(new URL('../../dist/funnel/_protected/'+entry.file,import.meta.url));
 let assetReads=0;
 const env={BACKEND:{async fetch(request){return new Response(null,{status:request.headers.get('cookie')==='__Host-tq-admin=fixture-valid'?200:401});}},ASSETS:{async fetch(request){
  assetReads++;assert.equal(new URL(request.url).pathname,'/_protected/'+entry.file);return new Response(bytes);
 }}};
 for(const cookie of ['', '__Host-tq-customer=fixture-buyer', '__Host-tq-admin=fixture-expired']){
  const denied=await gateway.fetch(new Request('https://pixelkovia.rodulab.com'+route,{headers:{cookie}}),env);
  assert.equal(denied.status,303);assert.equal(denied.headers.get('location'),'/admin/login');
 }
 assert.equal(assetReads,0);
 const allowed=await gateway.fetch(new Request('https://pixelkovia.rodulab.com'+route,{headers:{cookie:'__Host-tq-admin=fixture-valid'}}),env);
 assert.equal(allowed.status,200);assert.equal(allowed.headers.get('content-type'),'application/zip');
 assert.equal(allowed.headers.get('content-disposition'),'attachment; filename="'+entry.download+'"');
 assert.equal(allowed.headers.get('cache-control'),'private, no-store');
 assert.deepEqual(Buffer.from(await allowed.arrayBuffer()),bytes);assert.equal(bytes.subarray(0,2).toString(),'PK');
 assert.equal((await gateway.fetch(new Request('https://pixelkovia.rodulab.com/_protected/'+entry.file,{headers:{cookie:'__Host-tq-admin=fixture-valid'}}),env)).status,404);
});
