// The studio is a separate public artifact. Never expose the game's files here.
const publicFiles=new Set(['/', '/index.html', '/style.css', '/studio.js', '/404.html', '/robots.txt', '/sitemap.xml', '/assets/mark.svg', '/assets/manrope.ttf', '/assets/OFL-Manrope.txt', '/assets/pixelkovia.jpg', '/assets/living-stones.jpg', '/assets/bts-flight-scaner.jpg', '/assets/social.jpg']);
const security={
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=()'
};
const secured=response=>{const result=new Response(response.body,response);for(const [key,value]of Object.entries(security))result.headers.set(key,value);return result;};
export function countableVisit(request,response){
  const url=new URL(request.url),agent=request.headers.get('User-Agent')||'';
  return url.hostname==='rodulab.com'&&url.pathname==='/'&&request.method==='GET'&&response.status===200
    &&(request.headers.get('Sec-Fetch-Dest')==='document'||request.headers.get('Accept')?.includes('text/html'))
    &&!/bot|crawl|spider|slurp|headless|preview|monitor|lighthouse/i.test(agent)
    &&!/prefetch|prerender/i.test((request.headers.get('Purpose')||'')+' '+(request.headers.get('Sec-Purpose')||''));
}
async function countVisit(env){
  const response=await env.BACKEND.fetch(new Request('https://rodulab.com/api/studio/visit',{method:'POST',headers:{'X-RoduLab-Visit':'document'}}));
  if(!response.ok)throw Error('Studio visit counter unavailable.');
}
export default{async fetch(request,env,context){
  const url=new URL(request.url);
  if(url.hostname==='www.rodulab.com')return secured(Response.redirect('https://rodulab.com'+url.pathname+url.search,308));
  if(url.pathname==='/api/contact'){
    if(request.method!=='POST')return secured(new Response(JSON.stringify({error:'Použite kontaktný formulár.'}),{status:405,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Allow':'POST'}}));
    // The backend accepts only the studio's origin. Keep the caller's headers
    // and real Cloudflare client IP; clients cannot choose a mail recipient.
    if(url.hostname!=='rodulab.com'||request.headers.get('Origin')!=='https://rodulab.com')return secured(new Response(JSON.stringify({error:'Neplatný pôvod správy.'}),{status:403,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}}));
    const target=new URL('https://rodulab.com/api/studio/contact');
    return secured(await env.BACKEND.fetch(new Request(target,request)));
  }
  if(!['GET','HEAD'].includes(request.method)||!publicFiles.has(url.pathname)){
    const target=new URL('/404.html',request.url),response=await env.ASSETS.fetch(new Request(target));
    return secured(new Response(request.method==='HEAD'?null:response.body,{status:404,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}}));
  }
  if(url.pathname==='/index.html')return secured(Response.redirect(new URL('/',request.url).href,308));
  const response=secured(await env.ASSETS.fetch(request));
  if(countableVisit(request,response)){
    const count=countVisit(env).catch(()=>console.error('studio_visit_count_failed'));
    if(context?.waitUntil)context.waitUntil(count);else await count;
  }
  return response;
}};
