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

test('retired social ZIP and authoring assets are absent from deployment',async()=>{
 const inventory=JSON.parse(await readFile(new URL('../../dist/deployment-inventory.json',import.meta.url),'utf8'));
 const route='/admin/social/Pixelkovia-prispevky-12-16-november-2026.zip';
 assert.equal(inventory.protected[route],undefined);
 assert.ok(!Object.keys(inventory.protected).some(path=>path.startsWith('/assets/social/')));
 assert.ok(!inventory.public.some(path=>path.startsWith('/assets/social/')||path.endsWith('.zip')));
 const source=await readFile(new URL('../../funnel/gateway.mjs',import.meta.url),'utf8');
 const {default:gateway}=await import('data:text/javascript;base64,'+Buffer.from(`const PRIVATE_FILES=${JSON.stringify(inventory.protected)},PUBLIC_FILES=${JSON.stringify(inventory.public)};\n`+source).toString('base64'));
 const env={BACKEND:{fetch(){assert.fail('Retired download must not reach the backend');}},ASSETS:{fetch(){assert.fail('Retired download must not read assets');}}};
 for(const cookie of ['', '__Host-tq-customer=fixture-buyer', '__Host-tq-admin=fixture-valid']){
  for(const path of [route,'/_protected'+route]){
   const response=await gateway.fetch(new Request('https://pixelkovia.rodulab.com'+path,{headers:{cookie}}),env);
   assert.equal(response.status,404);
  }
 }
 const adminPage=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 assert.doesNotMatch(adminPage,/social-download|admin\/social\/|\.zip/i);
});
