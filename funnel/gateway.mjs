// Cloudflare Pages advanced mode. Every request crosses this authorization boundary.
// PUBLIC_FILES and PRIVATE_FILES are generated from the exact build inventories.
const notFound=()=>new Response('Stránka sa nenašla.',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
const redirect=path=>new Response(null,{status:303,headers:{Location:path,'Cache-Control':'no-store'}});
const csp=nonce=>`default-src 'self'; script-src 'self' 'nonce-${nonce}' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.stripe.com; connect-src 'self' https://*.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com; media-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self' https://*.stripe.com`;
function secured(response,privateContent=false,nonce=''){
  const r=new Response(response.body,response);
  r.headers.set('X-Content-Type-Options','nosniff');r.headers.set('Referrer-Policy','strict-origin-when-cross-origin');r.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  r.headers.set('Content-Security-Policy',csp(nonce));
  if(privateContent){r.headers.set('Cache-Control','private, no-store');r.headers.set('X-Robots-Tag','noindex, nofollow');r.headers.delete('ETag');}
  return r;
}
async function backend(env,request,path){if(!env.BACKEND)return new Response(null,{status:503});const url=new URL(request.url);if(path)url.pathname=path;return env.BACKEND.fetch(new Request(url,request));}
async function check(env,request,path){const url=new URL(request.url);url.pathname=path;url.search='';return backend(env,new Request(url,{headers:request.headers,method:'GET'}));}
export default {async fetch(request,env){
  try{
    const url=new URL(request.url),path=decodeURIComponent(url.pathname);
    if(path.includes('..')||path.includes('\\')||path.startsWith('/_')||path.includes('//'))return notFound();
    if(path.startsWith('/api/'))return secured(await backend(env,request),true);
    if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405});
    if(path==='/supervisor'||path==='/Supervisor/')return redirect('/Supervisor'+url.search);
    if(path==='/admin/'||path==='/admin/index.html')return redirect('/admin');
    const privateFile=PRIVATE_FILES[path];
    if(path==='/admin'||(path.startsWith('/admin/')&&!privateFile)){
      const mapped=path==='/admin'?'/':path.slice('/admin'.length);
      if(!['/','/login','/login.html','/login.css','/login.js','/admin.css','/admin.js'].includes(mapped))return notFound();
      const r=await backend(env,request,mapped);const result=new Response(r.body,r),location=r.headers.get('Location');
      if(location?.startsWith('/'))result.headers.set('Location',location==='/'?'/admin':'/admin'+location);
      return secured(result,true);
    }
    if(privateFile){
      let identity,admin=false,run;
      if(request.headers.get('cookie')?.includes('__Host-tq-admin=')||env.LOCAL_ADMIN==='true')admin=(await check(env,request,'/api/admin/context')).ok;
      if(!admin){
        if(privateFile.role==='admin')return path.startsWith('/admin/')?redirect('/admin/login'):notFound();
        const auth=await check(env,request,'/api/customer/access');
        if(!auth.ok)return privateFile.document?redirect('/Supervisor'):notFound();
        identity=await auth.json();
        const required=privateFile.role==='book-before'?'story-book-before':privateFile.role==='book-after'?'story-book-after':'episode-1';
        if(privateFile.role!=='customer'&&!identity.products.includes(required))return privateFile.document?redirect('/Supervisor'):notFound();
        if(privateFile.role==='run'){
          const context=await check(env,request,'/api/customer/launch-context');if(!context.ok)return redirect('/Supervisor');run=await context.json();
        }
      }
      const target=new URL(request.url);target.pathname='/_protected/'+privateFile.file.replace(/\.html$/,'');
      let response=await env.ASSETS.fetch(new Request(target,{method:request.method,headers:request.headers}));
      const nonce=crypto.randomUUID().replaceAll('-','');
      if(privateFile.document&&request.method==='GET'&&response.ok){
        const script=`<script nonce="${nonce}">window.PIXELKOVIA_ADMIN=${admin};${run?'window.PIXELKOVIA_RUN='+JSON.stringify(run).replaceAll('<','\\u003c')+';':''}</script>`;
        response=new HTMLRewriter().on('head',{element(e){e.prepend(script,{html:true});}}).transform(response);
      }
      return secured(response,true,nonce);
    }
    if(path.endsWith('.html')&&PUBLIC_FILES.includes(path))return redirect(path==='/index.html'?'/':path==='/supervisor.html'?'/Supervisor':path.slice(0,-5)+url.search);
    const publicPath=path==='/'?'/index.html':path==='/Supervisor'?'/supervisor.html':path;
    const normalized=PUBLIC_FILES.includes(publicPath)?publicPath:PUBLIC_FILES.includes(publicPath+'.html')?publicPath+'.html':null;
    if(!normalized)return notFound();
    const target=new URL(request.url);target.pathname=normalized.endsWith('.html')?normalized==='/index.html'?'/':normalized.slice(0,-5):normalized;
    return secured(await env.ASSETS.fetch(new Request(target,request)));
  }catch{return new Response('Stránku sa teraz nepodarilo načítať. Skúste to znova.',{status:503,headers:{'Cache-Control':'no-store'}});}
}};
