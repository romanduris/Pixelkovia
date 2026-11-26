/* Native editable ad layout. image_gen photographs + exact approved product images. */
const fs = require('node:fs/promises');
const path = require('node:path');
const {createHash} = require('node:crypto');
const out = __dirname, root = path.resolve(out, '../../..');
const fontConfig=path.join('/tmp',`pixelkovia-ads-fonts-${process.pid}.conf`);
process.env.FONTCONFIG_FILE = fontConfig;
const sharp = require(path.join(root, 'admin/node_modules/sharp'));
const W=1080,H=1350;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const hash=b=>createHash('sha256').update(b).digest('hex');
const data=(bytes,mime='image/webp')=>`data:${mime};base64,${bytes.toString('base64')}`;
const txt=(s,x,y,size,extra='')=>`<text x="${x}" y="${y}" font-family="Manrope" font-weight="800" font-size="${size}" ${extra.includes('fill=')?'':'fill="#fff7ea"'} ${extra}>${esc(s)}</text>`;
function solve(a,b){
  a=a.map((r,i)=>[...r,b[i]]);
  for(let i=0;i<b.length;i++){
    let p=i;for(let j=i+1;j<b.length;j++)if(Math.abs(a[j][i])>Math.abs(a[p][i]))p=j;
    [a[i],a[p]]=[a[p],a[i]];const k=a[i][i];if(Math.abs(k)<1e-10)throw Error('Degenerate product plane');
    for(let c=i;c<=b.length;c++)a[i][c]/=k;
    for(let r=0;r<b.length;r++)if(r!==i){const f=a[r][i];for(let c=i;c<=b.length;c++)a[r][c]-=f*a[i][c];}
  }return a.map(r=>r[b.length]);
}
function projection(q){
  const a=[],b=[];
  [[0,0],[1,0],[1,1],[0,1]].forEach(([u,v],i)=>{const[x,y]=q[i];a.push([u,v,1,0,0,0,-x*u,-x*v],[0,0,0,u,v,1,-y*u,-y*v]);b.push(x,y);});
  const h=solve(a,b);return(u,v)=>{const d=h[6]*u+h[7]*v+1;return[(h[0]*u+h[1]*v+h[2])/d,(h[3]*u+h[4]*v+h[5])/d];};
}
function mesh(id,q,sw,sh,nx=8,ny=10){
  const map=projection(q);let defs='',body='',n=0;
  const triangle=(src,dst)=>{
    const a=src.map(([x,y])=>[x,y,1]);
    const [aa,cc,ee]=solve(a,dst.map(p=>p[0]));const[bb,dd,ff]=solve(a,dst.map(p=>p[1]));
    const clip=`${id}-t${n++}`;
    // Slightly expanded clips avoid subpixel mesh seams. Geometry stays projective.
    const center=[dst.reduce((s,p)=>s+p[0],0)/3,dst.reduce((s,p)=>s+p[1],0)/3];
    const poly=dst.map(p=>{const dx=p[0]-center[0],dy=p[1]-center[1],d=Math.hypot(dx,dy);return[p[0]+dx/d*.25,p[1]+dy/d*.25].join(',');}).join(' ');
    defs+=`<clipPath id="${clip}"><polygon points="${poly}"/></clipPath>`;
    body+=`<g clip-path="url(#${clip})"><use xlink:href="#${id}" transform="matrix(${aa} ${bb} ${cc} ${dd} ${ee} ${ff})"/></g>`;
  };
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    const uv=[[x/nx,y/ny],[(x+1)/nx,y/ny],[(x+1)/nx,(y+1)/ny],[x/nx,(y+1)/ny]];
    for(const ids of [[0,1,2],[0,2,3]])triangle(ids.map(i=>[uv[i][0]*sw,uv[i][1]*sh]),ids.map(i=>map(...uv[i])));
  }
  const clip=`${id}-plane`;defs+=`<clipPath id="${clip}"><polygon points="${q.map(p=>p.join(',')).join(' ')}"/></clipPath>`;
  return{defs,body:`<g clip-path="url(#${clip})">${body}</g>`};
}
async function paperSurface(photo){
  // Select only the unprinted white physical slot; keep original hands/hair in front.
  const {data:raw,info}=await sharp(photo).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const mask=Buffer.alloc(info.width*info.height);
  const clamp=x=>Math.max(0,Math.min(1,x));
  for(let i=0;i<mask.length;i++){
    const r=raw[i*3],g=raw[i*3+1],b=raw[i*3+2];
    const bright=clamp(Math.min(r-145,g-140,b-130)/25);
    const neutral=clamp((60-(Math.max(r,g,b)-Math.min(r,g,b)))/15);
    mask[i]=Math.round(255*bright*neutral);
  }
  return data(await sharp(mask,{raw:{width:info.width,height:info.height,channels:1}}).blur(.4).png().toBuffer(),'image/png');
}
async function main(){
  const conf=`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${root}/assets/social/facebook/sources/fonts</dir><dir>${root}/assets/fonts</dir><cachedir>/tmp/pixelkovia-ad-font-cache</cachedir></fontconfig>`;
  await fs.writeFile(fontConfig,conf);
  const layout=JSON.parse(await fs.readFile(path.join(out,'layout.json'),'utf8'));
  const actual=await fs.readFile(path.join(root,'assets/sales/game-lock-partial.webp'));
  const guardy=await fs.readFile(path.join(root,'assets/sales/characters/guardy.webp'));
  const screenMeta=await sharp(actual).metadata();
  const actualUri=data(await sharp(actual).png().toBuffer(),'image/png');
  const guardyUri=data(await sharp(guardy).png().toBuffer(),'image/png');
  let fontCss='';
  for(const[family,file,weight]of[['Manrope','Manrope-ExtraBold.ttf',800],['DM Sans','DM-Sans-Medium.ttf',500]]){
    const bytes=await fs.readFile(path.join(root,'assets/social/facebook/sources/fonts',file));
    fontCss+=`@font-face{font-family:'${family}';src:url(${data(bytes,'font/ttf')}) format('truetype');font-weight:${weight}}`;
  }
  const manifest={date:'2026-11-26',status:'concepts-for-owner-selection',ratio:'4:5',dimensions:[W,H],mode:'built-in image_gen + native editable SVG layout',publication:false,adActivation:false,destination:'https://pixelkovia.rodulab.com/',provenance:'Generated illustrative families and rooms; not customer photographs or testimonials. Exact existing game screenshot and physically cropped original worksheet previews inserted in perspective as independent SVG image layers. Text is editable. No full worksheets, QR, answers or access credentials embedded.',screen:{source:'assets/sales/game-lock-partial.webp',sha256:hash(actual)},exports:[]};
  const thumbs=[];
  for(const item of layout.items){
    const photo=await fs.readFile(path.join(out,'sources',item.file+'.webp'));
    const paperSource='assets/sales/public-previews/'+item.paperSource+'.webp';
    const paper=await fs.readFile(path.join(root,paperSource)),pm=await sharp(paper).metadata();
    const photoUri=data(await sharp(photo).jpeg({quality:96}).toBuffer(),'image/jpeg');
    const paperUri=data(await sharp(paper).png().toBuffer(),'image/png');
    const paperMask=await paperSurface(photo);
    const meta=await sharp(photo).metadata(),scale=W/meta.width;
    if(Math.abs(meta.height*scale-H)>3)throw Error('Photograph must fill 4:5 canvas');
    const p=mesh('real-paper',item.paper,pm.width,pm.height),s=mesh('real-screen',item.screen,screenMeta.width,screenMeta.height);
    const photoGroup=`<g transform="scale(${scale})"><defs><mask id="paper-surface" maskUnits="userSpaceOnUse" x="0" y="0" width="${meta.width}" height="${meta.height}"><image xlink:href="${paperMask}" width="${meta.width}" height="${meta.height}"/></mask></defs><image xlink:href="${photoUri}" width="${meta.width}" height="${meta.height}"/><g mask="url(#paper-surface)">${p.body}<polygon points="${item.paper.map(p=>p.join(',')).join(' ')}" fill="#9c6029" opacity=".055"/></g>${s.body}<polygon points="${item.screen.map(p=>p.join(',')).join(' ')}" fill="url(#glass)"/></g>`;
    const copy=layout.angles[item.angle];
    const headline=copy.headline.map((line,i)=>txt(line,58,178+i*72,copy.size||65,i===copy.headline.length-1?'fill="#b4efd6"':'')).join('');
    const support=copy.support.map((line,i)=>`<text x="60" y="${copy.supportY+i*36}" font-family="DM Sans" font-weight="500" font-size="32" fill="#fff7ea">${esc(line)}</text>`).join('');
    const factsY=copy.supportY+copy.support.length*36+18;
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><title>${esc(item.id+' · '+copy.name)}</title><desc>${esc(manifest.provenance)}</desc><style>${fontCss}</style><defs><image id="real-paper" xlink:href="${paperUri}" width="${pm.width}" height="${pm.height}"/><image id="real-screen" xlink:href="${actualUri}" width="${screenMeta.width}" height="${screenMeta.height}"/>${p.defs}${s.defs}<linearGradient id="top" x2="0" y2="1"><stop stop-color="#091629" stop-opacity=".95"/><stop offset=".77" stop-color="#0b182b" stop-opacity=".74"/><stop offset="1" stop-color="#0b182b" stop-opacity="0"/></linearGradient><linearGradient id="glass" x2="0" y2="1"><stop stop-color="#fff1da" stop-opacity=".045"/><stop offset="1" stop-color="#000" stop-opacity=".045"/></linearGradient></defs>${photoGroup}<rect width="1080" height="490" fill="url(#top)"/><g fill="#b4efd6">${[[60,36],[76,36],[60,52],[76,52]].map(([x,y])=>`<rect x="${x}" y="${y}" width="11" height="11" rx="2"/>`).join('')}</g>${txt('Pixelkovia',106,64,32)}<text x="1020" y="61" text-anchor="end" font-family="DM Sans" font-size="23" fill="#b4efd6">pixelkovia.rodulab.com</text><text x="60" y="100" font-family="DM Sans" font-size="19" letter-spacing="2" fill="#b4efd6">RODINNÁ DOBRODRUŽNÁ HRA NA DOMA</text>${headline}${support}<g font-family="Manrope" font-weight="800" font-size="30" fill="#b4efd6"><text x="60" y="${factsY}">7 hádaniek</text><text x="290" y="${factsY}" fill="#fff7ea">7–13 rokov</text><text x="545" y="${factsY}" fill="#fff7ea">60–90 min</text></g><image xlink:href="${guardyUri}" x="927" y="148" width="84" height="84"/></svg>`;
    const svgFile='editable/'+item.file+'.svg';await fs.writeFile(path.join(out,svgFile),svg);
    const name=item.file+'.png';
    await sharp(Buffer.from(svg),{limitInputPixels:false}).flatten({background:'#0b1428'}).withMetadata({exif:{IFD0:{ImageDescription:'AI-generated advertising scene; original game screen and cropped worksheets composited; no customer endorsement.'}}}).png().toFile(path.join(out,name));
    const bytes=await fs.readFile(path.join(out,name)),m=await sharp(bytes).metadata();
    if(m.width!==W||m.height!==H||m.hasAlpha)throw Error('Invalid final export '+name);
    await sharp(bytes).resize(360,450).jpeg({quality:88}).toFile(path.join(out,'previews',item.file+'.jpg'));
    const thumb=await sharp(bytes).resize(288,360).extend({top:42,bottom:0,left:0,right:0,background:'#0b1428'}).jpeg().toBuffer();
    thumbs.push({id:item.id,bytes:thumb});
    manifest.exports.push({id:item.id,angle:copy.name,faces:item.id.startsWith('A'),file:name,editable:svgFile,dimensions:[W,H],bytes:bytes.length,sha256:hash(bytes),photograph:hash(photo),paper:{source:paperSource,sha256:hash(paper)},placement:item});
    console.log(item.id+': '+name);
  }
  for(const [prefix,label]of[['A','5 NÁVRHOV S TVÁRAMI'],['B','5 NÁVRHOV BEZ TVÁRÍ']]){
    const entries=thumbs.filter(x=>x.id.startsWith(prefix));
    const canvas=sharp({create:{width:1440,height:402,channels:3,background:'#0b1428'}});
    const layers=[];
    entries.forEach((entry,i)=>{layers.push({input:entry.bytes,left:i*288,top:0});layers.push({input:Buffer.from(`<svg width="288" height="42">${txt(entry.id,16,30,22)}</svg>`),left:i*288,top:0});});
    await canvas.composite(layers).png().toFile(path.join(out,'PREHLAD-'+prefix+'.png'));
  }
  const gallery=`<!doctype html><html lang="sk"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pixelkovia · 10 reklamných návrhov</title><style>body{margin:0;background:#0b1428;color:#fff7ea;font:17px system-ui;padding:28px}h1{font-size:28px}p{max-width:900px;color:#cbd5df}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px}figure{margin:0}img{width:100%;border-radius:8px}figcaption{padding:12px 0}a{color:#b4efd6}small{display:block;margin-top:6px}</style><h1>Pixelkovia · prvé kolo, 5 + 5 návrhov</h1><p>Jeden formát 4 : 5 (1080 × 1350). Rodinná hra na doma: papierové indície + príbeh v jednom mobile + spoločné objavovanie. Vyberte dva motívy; ďalšie rozmery vzniknú až po výbere.</p><p>Ľudia a prostredia sú generované reklamné scény, nie zákaznícke fotografie. Displej používa originálny schválený záber hry, papiere fyzicky orezané originálne ukážky. Texty sú samostatné editovateľné vrstvy. Reklamy neboli spustené.</p>${['A','B'].map(prefix=>`<h2>${prefix==='A'?'A · S tvárami rodiny':'B · Zozadu a ponad plece'}</h2><section>${manifest.exports.filter(e=>e.id.startsWith(prefix)).map(e=>`<figure><a href="${e.file}"><img src="${e.file}" alt="${esc(e.id+' · '+e.angle)}"></a><figcaption><strong>${esc(e.id+' · '+e.angle)}</strong><small><a href="${e.file}" download>PNG</a> · <a href="${e.editable}">Editovateľné SVG</a></small></figcaption></figure>`).join('')}</section>`).join('')}<p><a href="https://pixelkovia.rodulab.com/">Pixelkovia – stránka hry</a></p></html>`;
  await fs.writeFile(path.join(out,'OTVORIT-NAHLAD.html'),gallery);
  await fs.writeFile(path.join(out,'artwork.json'),JSON.stringify(manifest,null,2)+'\n');
  await fs.rm(fontConfig,{force:true});
}
main().catch(e=>{console.error(e);process.exitCode=1});
