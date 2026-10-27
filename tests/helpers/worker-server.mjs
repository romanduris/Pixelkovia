// Isolated local Workers/D1 environment. Never connects to production resources.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Miniflare,convertV4MiniflareOptions} from '../../admin/node_modules/miniflare/dist/src/index.js';
import {makePasswordSecrets} from '../../admin/src/password-auth.mjs';
import {credentials} from '../../admin/src/customer-auth.mjs';
import {execute,first} from '../../admin/src/db.mjs';
import {createOrder} from '../../admin/src/game-service.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg','.mp4':'video/mp4','.pdf':'application/pdf','.ttf':'font/ttf','.ico':'image/x-icon'};
function assets(directory){return async request=>{
  const pathname=decodeURIComponent(new URL(request.url).pathname);if(pathname.includes('..'))return new Response(null,{status:404});
  let file=path.join(directory,pathname==='/'?'index.html':pathname);let content;
  for(const candidate of [file,file+'.html'])try{content=await fs.readFile(candidate);file=candidate;break;}catch{}
  if(!content)return new Response(null,{status:404});
  const headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes'};
  const range=request.headers.get('range')?.match(/^bytes=(\d+)-(\d*)$/);
  if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),content.length-1):content.length-1;if(start> end)return new Response(null,{status:416});headers['Content-Range']=`bytes ${start}-${end}/${content.length}`;return new Response(request.method==='HEAD'?null:content.subarray(start,end+1),{status:206,headers});}
  return new Response(request.method==='HEAD'?null:content,{headers});
};}
export async function workerServer(){
  const adminPassword='qa-only-administrator-password-28549',customerPassword='qa-only-customer-password-39485',secret='a'.repeat(64),email='family@example.invalid';
  const mf=new Miniflare(convertV4MiniflareOptions({host:'127.0.0.1',https:true,workers:[
    {name:'gateway',modules:true,scriptPath:path.join(root,'dist/funnel/_worker.js'),serviceBindings:{BACKEND:'backend',ASSETS:assets(path.join(root,'dist/funnel'))}},
    {name:'backend',modules:true,scriptPath:path.join(root,'admin/.build-check/worker.js'),compatibilityDate:'2026-10-18',d1Databases:{TQ_DB:'isolated-journey'},bindings:{ENVIRONMENT:'production',ADMIN_AUTH_MODE:'password',WEB_URL:'https://pixelkovia.rodulab.com',CUSTOMER_AUTH_SECRET:secret,...await makePasswordSecrets(adminPassword)},serviceBindings:{ASSETS:assets(path.join(root,'admin/public'))}}
  ]}));
  try{
    const db=await mf.getD1Database('TQ_DB','backend');
    for(const file of (await fs.readdir(path.join(root,'admin/migrations'))).filter(f=>f.endsWith('.sql')).sort())for(const sql of (await fs.readFile(path.join(root,'admin/migrations',file),'utf8')).split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
    const at=Date.now(),record=await credentials(email,customerPassword,secret);
    await execute(db,'INSERT INTO customers VALUES(?,?,?,?)','qa-family',email,'Testovacia rodina',at);
    await execute(db,'INSERT INTO customer_credentials VALUES(?,?,?,?,?)','qa-family',record.lookup,record.salt,record.hash,at);
    for(const productId of ['episode-1','story-book-before'])await createOrder(db,{customerId:'qa-family',productId,externalReference:'qa-'+productId});
    return {mf,db,url:String(await mf.ready).replace(/\/$/,'').replace('127.0.0.1','localhost'),email,customerPassword,adminPassword};
  }catch(e){await mf.dispose();throw e;}
}
