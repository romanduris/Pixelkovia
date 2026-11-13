// The studio is a separate public artifact. Never expose the game's files here.
const publicFiles=new Set(['/', '/index.html', '/style.css', '/studio.js', '/404.html', '/robots.txt', '/sitemap.xml', '/assets/mark.svg', '/assets/manrope.ttf', '/assets/OFL-Manrope.txt', '/assets/pixelkovia.jpg', '/assets/living-stones.jpg', '/assets/bts-flight-scaner.jpg', '/assets/social.jpg']);
const security={
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=()'
};
const secured=response=>{const result=new Response(response.body,response);for(const [key,value]of Object.entries(security))result.headers.set(key,value);return result;};
export default{async fetch(request,env){
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
  return secured(await env.ASSETS.fetch(request));
}};
