/* V3 A-series: integrated image_gen characters + exact family-facing product inserts. */
const fs = require('node:fs/promises');
const path = require('node:path');
const {createHash} = require('node:crypto');
const out = __dirname, root = path.resolve(out, '../../..');
const fontConfig=path.join('/tmp',`pixelkovia-ads-fonts-${process.pid}.conf`);
process.env.FONTCONFIG_FILE = fontConfig;
const sharp = require(path.join(root, 'admin/node_modules/sharp'));
const W=1080,H=1350;
const design=require('./design.cjs');
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
function orient(q,degrees=0){
  if(!Number.isFinite(degrees))throw Error('Product rotation must be a number');
  const rotation=((degrees%360)+360)%360;
  if(rotation===0)return q;
  if(rotation===180)return[q[2],q[3],q[0],q[1]];
  throw Error('Only 0 or 180 degree product rotations are supported');
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
  if(layout.items.length!==5||layout.items.some(item=>!/^A[1-5]$/.test(item.id))||new Set(layout.items.map(item=>item.id)).size!==5)throw Error('V3 contains exactly five A-series concepts');
  await fs.mkdir(path.join(out,'editable'),{recursive:true});
  await fs.mkdir(path.join(out,'previews'),{recursive:true});
  const actual=await fs.readFile(path.join(root,'assets/sales/game-lock-partial.webp'));
  const screenMeta=await sharp(actual).metadata();
  const actualUri=data(await sharp(actual).png().toBuffer(),'image/png');
  let fontCss='';
  for(const[family,file,weight]of[['Manrope','assets/social/facebook/sources/fonts/Manrope-ExtraBold.ttf',800],['DM Sans','assets/social/facebook/sources/fonts/DM-Sans-Medium.ttf',500],['Caveat','assets/fonts/Caveat.ttf',400]]){
    const bytes=await fs.readFile(path.join(root,file));
    fontCss+=`@font-face{font-family:'${family}';src:url(${data(bytes,'font/ttf')}) format('truetype');font-weight:${weight}}`;
  }
  const manifest={date:'2026-11-26',revision:3,status:'room-v3-A-for-owner-selection',ratio:'4:5',dimensions:[W,H],mode:'built-in image_gen with integrated characters + native editable SVG layout',publication:false,adActivation:false,destination:'https://pixelkovia.rodulab.com/',roomReference:'../concepts-2026-11-26-room-v2/sources/room-anchor.webp',provenance:'Generated illustrative families in the room and amber/blue atmosphere supplied by the owner; not customer photographs or testimonials. Approved small characters are integrated into the source photographs with natural lighting, interaction and occlusion behind people or furniture. The smaller phone sits closer to the family. Original game screenshot and physically cropped original worksheet previews are inserted in perspective and oriented toward the family, with editable typography. No full worksheets, QR, answers or access credentials embedded.',screen:{source:'assets/sales/game-lock-partial.webp',sha256:hash(actual)},exports:[]};
  const thumbs=[];
  for(const item of layout.items){
    if(!['decoder','path'].includes(item.paperSource))throw Error('Only the approved cropped decoder/path previews are allowed');
    const photo=await fs.readFile(path.join(out,'sources',item.file+'.webp'));
    const paperSource='assets/sales/public-previews/'+item.paperSource+'.webp';
    const paper=await fs.readFile(path.join(root,paperSource)),pm=await sharp(paper).metadata();
    const photoUri=data(await sharp(photo).jpeg({quality:96}).toBuffer(),'image/jpeg');
    const paperUri=data(await sharp(paper).png().toBuffer(),'image/png');
    const paperMask=await paperSurface(photo);
    const meta=await sharp(photo).metadata(),scale=W/meta.width;
    if(Math.abs(meta.height*scale-H)>3)throw Error('Photograph must fill 4:5 canvas');
    // The product image rotates within the unchanged physical plane; masks and glass retain their original geometry.
    const p=mesh('real-paper',orient(item.paper,item.paperRotation??0),pm.width,pm.height),s=mesh('real-screen',orient(item.screen,item.screenRotation??0),screenMeta.width,screenMeta.height);
    const photoGroup=`<g transform="scale(${scale})"><defs><mask id="paper-surface" maskUnits="userSpaceOnUse" x="0" y="0" width="${meta.width}" height="${meta.height}"><image xlink:href="${paperMask}" width="${meta.width}" height="${meta.height}"/></mask></defs><image xlink:href="${photoUri}" width="${meta.width}" height="${meta.height}"/><g mask="url(#paper-surface)">${p.body}<polygon points="${item.paper.map(p=>p.join(',')).join(' ')}" fill="#9c6029" opacity=".055"/></g>${s.body}<polygon points="${item.screen.map(p=>p.join(',')).join(' ')}" fill="url(#glass)"/></g>`;
    const copy=layout.angles[item.angle];
    const svg=design({W,H,item,copy,fontCss,paperUri,actualUri,pm,screenMeta,productDefs:p.defs+s.defs,photoGroup,provenance:manifest.provenance});
    const svgFile='editable/'+item.file+'.svg';await fs.writeFile(path.join(out,svgFile),svg);
    const name=item.file+'.png';
    await sharp(Buffer.from(svg),{limitInputPixels:false}).flatten({background:'#0b1428'}).toColourspace('srgb').withMetadata({exif:{IFD0:{ImageDescription:'AI-generated advertising scene with naturally integrated miniature characters; original game screen and cropped worksheets face the family; no customer endorsement.'}}}).png().toFile(path.join(out,name));
    const bytes=await fs.readFile(path.join(out,name)),m=await sharp(bytes).metadata();
    if(m.width!==W||m.height!==H||m.hasAlpha||m.space!=='srgb')throw Error('Invalid final export '+name);
    await sharp(bytes).resize(360,450).jpeg({quality:88}).toFile(path.join(out,'previews',item.file+'.jpg'));
    const thumb=await sharp(bytes).resize(288,360).extend({top:42,bottom:0,left:0,right:0,background:'#0b1428'}).jpeg().toBuffer();
    thumbs.push({id:item.id,bytes:thumb});
    manifest.exports.push({id:item.id,angle:copy.name,faces:item.id.startsWith('A'),file:name,editable:svgFile,dimensions:[W,H],bytes:bytes.length,sha256:hash(bytes),photograph:hash(photo),paper:{source:paperSource,sha256:hash(paper),rotation:item.paperRotation??0},screen:{source:'assets/sales/game-lock-partial.webp',sha256:hash(actual),rotation:item.screenRotation??0},placement:item});
    console.log(item.id+': '+name);
  }
  for(const prefix of ['A']){
    const entries=thumbs.filter(x=>x.id.startsWith(prefix));
    const canvas=sharp({create:{width:1440,height:402,channels:3,background:'#0b1428'}});
    const layers=[];
    entries.forEach((entry,i)=>{layers.push({input:entry.bytes,left:i*288,top:0});layers.push({input:Buffer.from(`<svg width="288" height="42">${txt(entry.id,16,30,22)}</svg>`),left:i*288,top:0});});
    await canvas.composite(layers).png().toFile(path.join(out,'PREHLAD-'+prefix+'.png'));
  }
  const gallery=`<!doctype html><html lang="sk"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pixelkovia · V3 · 5 A návrhov</title><style>body{margin:0;background:#0b1428;color:#fff7ea;font:17px system-ui;padding:28px}h1{font-size:28px}p{max-width:900px;color:#cbd5df}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px}figure{margin:0}img{width:100%;border-radius:8px}figcaption{padding:12px 0}a{color:#b4efd6}small{display:block;margin-top:6px}</style><h1>Pixelkovia · V3, päť A návrhov</h1><p>Jeden formát 4 : 5 (1080 × 1350). Rovnaká obývačka a modro-jantárová atmosféra. Malí Pixelkovia sú prirodzene súčasťou scény: vykúkajú spoza rodiny alebo skúmajú mobil. Menší mobil je bližšie k hráčom; papiere a displej sú otočené smerom k rodine.</p><p>Ľudia, prostredia a začlenenie postavičiek sú generované reklamné scény, nie zákaznícke fotografie. Displej používa originálny schválený záber hry, papiere fyzicky orezané originálne ukážky. Texty sú samostatné editovateľné vrstvy. Reklamy neboli spustené.</p><h2>A · S tvárami rodiny</h2><section>${manifest.exports.map(e=>`<figure><a href="${e.file}"><img src="${e.file}" alt="${esc(e.id+' · '+e.angle)}"></a><figcaption><strong>${esc(e.id+' · '+e.angle)}</strong><small><a href="${e.file}" download>PNG</a> · <a href="${e.editable}">Editovateľné SVG</a></small></figcaption></figure>`).join('')}</section><p><a href="https://pixelkovia.rodulab.com/">Pixelkovia – stránka hry</a></p></html>`;
  await fs.writeFile(path.join(out,'OTVORIT-NAHLAD.html'),gallery);
  await fs.writeFile(path.join(out,'artwork.json'),JSON.stringify(manifest,null,2)+'\n');
  await fs.rm(fontConfig,{force:true});
}
main().catch(e=>{console.error(e);process.exitCode=1});
