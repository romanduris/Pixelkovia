/* Four native A4 adaptations. Safe-zone measurements use the actual font raster. */
const fs=require('node:fs/promises'),path=require('node:path'),{createHash}=require('node:crypto');
const out=__dirname,root=path.resolve(out,'../../..');
const fontConfig=path.join('/tmp',`pixelkovia-a4-format-fonts-${process.pid}.conf`);
process.env.FONTCONFIG_FILE=fontConfig;
const sharp=require(path.join(root,'admin/node_modules/sharp'));
const {buildProductScene}=require('./product-plane.cjs');
const design=require('./design.cjs');
const hash=b=>createHash('sha256').update(b).digest('hex');
const uri=(b,mime)=>`data:${mime};base64,${b.toString('base64')}`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const measurements=new Map();
async function measureText(t){
 const key=JSON.stringify([t.text,t.size,t.font,t.weight,t.anchor,t.letterSpacing]);
 if(!measurements.has(key)){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="400"><text x="1000" y="220" font-family="${esc(t.font)}" font-weight="${t.weight}" font-size="${t.size}" text-anchor="${t.anchor||'start'}" letter-spacing="${t.letterSpacing||0}" fill="white">${esc(t.text)}</text></svg>`;
  const {data,info}=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let x0=info.width,y0=info.height,x1=-1,y1=-1;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>12){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  if(x1<0)throw Error('Text did not render: '+t.text);
  measurements.set(key,{x:x0-1000-1,y:y0-220-1,width:x1-x0+3,height:y1-y0+3});
 }
 const b=measurements.get(key);return{role:t.role,text:t.text,x:t.x+b.x,y:t.y+b.y,width:b.width,height:b.height,fontSize:t.size};
}
function bounds(q,s,tx,ty){const x=q.map(p=>p[0]*s+tx),y=q.map(p=>p[1]*s+ty);return[Math.min(...x),Math.min(...y),Math.max(...x)-Math.min(...x),Math.max(...y)-Math.min(...y)].map(n=>Math.round(n*100)/100);}
function zoneReview(e,png){
 const[W,H]=e.dimensions,z=e.safeArea;
 const risks=`<path d="M0 0H${W}V${z.top}H0ZM0 ${z.bottom}H${W}V${H}H0Z" fill="#ef5264" opacity=".34"/><rect x="${z.left}" y="${z.top}" width="${z.right-z.left}" height="${z.bottom-z.top}" fill="none" stroke="#88efc8" stroke-width="3" stroke-dasharray="12 8"/>`;
 const boxes=e.textBounds.map(b=>`<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="none" stroke="#c5f7ae" stroke-width="1.5"/>`).join('');
 const labelY=z.bottom+Math.min(47,(H-z.bottom)/3);
 return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}"><image xlink:href="${uri(png,'image/png')}" width="${W}" height="${H}"/>${risks}${boxes}<text x="${W/2}" y="${labelY}" text-anchor="middle" fill="#fff5ee" font-family="DM Sans" font-size="${W===1200?25:28}">CTA / ovládanie · rezervovaných 22 %</text>${e.id==='9x16'?'<text x="540" y="145" text-anchor="middle" fill="#fff5ee" font-family="DM Sans" font-size="28">Profil / rozhranie · horných 15 %</text>':''}</svg>`;
}
async function board(entries,review=false){
 const width=1600,height=765,layers=[];
 for(let i=0;i<entries.length;i++){
  const e=entries[i],file=path.join(out,review?e.safePreview:e.file);
  const img=await sharp(file).resize({width:360}).toBuffer();
  const title=`<svg width="400" height="52"><text x="20" y="32" font-family="Manrope" font-weight="800" font-size="23" fill="#fff7ea">${esc(e.label)}</text></svg>`;
  layers.push({input:Buffer.from(title),left:i*400,top:0},{input:img,left:i*400+20,top:54});
 }
 await sharp({create:{width,height,channels:3,background:'#0b1428'}}).composite(layers).png().toFile(path.join(out,review?'PREHLAD-BEZPECNE-ZONY.png':'PREHLAD.png'));
}
async function main(){
 await fs.writeFile(fontConfig,`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${root}/assets/social/facebook/sources/fonts</dir><dir>${root}/assets/fonts</dir><cachedir>/tmp/pixelkovia-ad-font-cache</cachedir></fontconfig>`);
 const layout=JSON.parse(await fs.readFile(path.join(out,'layouts.json'),'utf8'));
 if(layout.items.length!==4)throw Error('A4 requires four native formats');
 let fontCss='';
 for(const[font,file,weight]of[['Manrope','assets/social/facebook/sources/fonts/Manrope-ExtraBold.ttf',800],['DM Sans','assets/social/facebook/sources/fonts/DM-Sans-Medium.ttf',500],['Caveat','assets/fonts/Caveat.ttf',400]]){
  const bytes=await fs.readFile(path.join(root,file));fontCss+=`@font-face{font-family:'${font}';src:url(${uri(bytes,'font/ttf')}) format('truetype');font-weight:${weight}}`;
 }
 const headerMascotUri=null;
 const original='assets/social/concepts-2026-11-26-room-v4-A/A4-mame-to.png';
 const manifest={date:'2026-11-26',sourceConcept:'A4 V4 only',source:{file:original,sha256:hash(await fs.readFile(path.join(root,original)))},mode:'built-in image_gen recomposition/outpainting + native editable SVG typography and exact product planes',adActivation:false,publication:false,destination:'https://pixelkovia.rodulab.com/',provenance:'Adaptations of the same generated illustrative family scene, not customer photographs or testimonials. Original A4 copy, family identity and room atmosphere preserved. Exact physically cropped original worksheet and game screenshot face the family. Local paper light, pen shadows and phone glass reflections retained. No full worksheets, answers or QR embedded.',safeAreaPolicy:{sides:'7%',bottom:'22%',storyTop:'15%',landscape:'same conservative 22% bottom reservation'},exports:[]};
 for(const i of layout.items){
  const scene=await buildProductScene({photo:path.join(out,'sources',i.file+'.webp'),paperQuad:i.paperQuad,screenQuad:i.screenQuad,paperRotation:180,screenRotation:180,root});
  const W=i.W,H=i.H,s=i.framing?.scale??Math.max(W/scene.width,H/scene.height),tx=i.framing?.x??(W-scene.width*s)/2,ty=i.framing?.y??(H-scene.height*s)/2;
  if(tx>0||ty>0||tx+scene.width*s<W||ty+scene.height*s<H)throw Error('Photo must fill canvas without padding: '+i.id);
  const sceneBody=`<g transform="translate(${tx} ${ty}) scale(${s})">${scene.body}</g>`;
  const artwork=design({id:i.id,W,H,fontCss,productDefs:scene.defs,sceneBody,headerMascotUri});
  const file=i.file+'.png',editable='editable/'+i.file+'.svg';
  await fs.writeFile(path.join(out,editable),artwork.svg);
  const png=await sharp(Buffer.from(artwork.svg),{limitInputPixels:false}).flatten({background:'#0b1428'}).toColourspace('srgb').withMetadata({exif:{IFD0:{ImageDescription:'Pixelkovia A4 V4 format adaptation; illustrative generated family scene, original game and cropped worksheet; CTA-safe copy.'}}}).png().toBuffer();
  await fs.writeFile(path.join(out,file),png);
  await sharp(png).resize({width:360}).jpeg({quality:90}).toFile(path.join(out,'previews',i.file+'.jpg'));
  const textBounds=[];for(const t of artwork.textRecords)textBounds.push(await measureText(t));
  for(const b of artwork.graphicBounds)textBounds.push({...b,text:b.role||'logo'});
  const e={id:i.id,label:i.label,file,editable,dimensions:[W,H],bytes:png.length,sha256:hash(png),safeArea:i.safeArea,textBounds,productBounds:{paper:bounds(i.paperQuad,s,tx,ty),screen:bounds(i.screenQuad,s,tx,ty)},paper:{source:scene.paperSource,sha256:scene.sourceHashes.paper,rotation:180},screen:{source:scene.screenSource,sha256:scene.sourceHashes.screen,rotation:180},photograph:scene.sourceHashes.photo,photoGeometry:{width:scene.width,height:scene.height,scale:s,x:tx,y:ty},safePreview:'safe-area-review/'+i.file+'_kontrola.png'};
  await sharp(Buffer.from(zoneReview(e,png))).png().toFile(path.join(out,e.safePreview));
  manifest.exports.push(e);console.log(i.id+': '+file+' · measured '+textBounds.length+' critical elements');
 }
 await fs.writeFile(path.join(out,'artwork.json'),JSON.stringify(manifest,null,2)+'\n');
 await board(manifest.exports);await board(manifest.exports,true);
 const cards=manifest.exports.map(e=>`<figure><a href="${e.file}"><img src="${e.file}" data-normal="${e.file}" data-review="${e.safePreview}" alt="A4 · ${esc(e.label)}"></a><figcaption><strong>${esc(e.label)}</strong> · ${e.dimensions.join(' × ')}<small><a href="${e.file}" download>PNG na nasadenie</a> · <a href="${e.editable}">Editovateľné SVG</a> · <a href="${e.safePreview}">Kontrola zón</a></small></figcaption></figure>`).join('');
 const html=`<!doctype html><html lang="sk"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pixelkovia A4 · 4 Meta formáty</title><style>body{margin:0;padding:28px;background:#0b1428;color:#fff7ea;font:17px/1.5 system-ui}h1{font-size:29px}p{max-width:1000px;color:#ccd7e1}a{color:#b4efd6}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:28px;align-items:start}figure{margin:0}img{display:block;width:100%;border-radius:7px}figcaption{padding:12px 0}small{display:block}label{display:block;margin:24px 0;color:#b4efd6}</style><h1>Pixelkovia · A4 V4 · štyri samostatne komponované formáty</h1><p>Rovnaký rodinný motív a texty. Sedempercentné bočné okraje, spodných 22 % rezervovaných pre CTA a rozhranie; Stories navyše ponechávajú horných 15 %. Všetky dôležité texty aj herné materiály sú nad spodnou zónou. Výstupy sú PNG v sRGB.</p><label><input type="checkbox" id="zones"> Zobraziť kontrolné zóny a skutočné hranice textov</label><section>${cards}</section><p>Rekompozícia a rozšírenie scény: vstavaný imagegen. <a href="prompts.json">Prompty</a> · <a href="artwork.json">Rozmery, bezpečné zóny a zdroje</a>. Ide o generované ilustračné reklamné scény so skutočnými orezanými podkladmi hry. <a href="https://pixelkovia.rodulab.com/">Web hry Pixelkovia</a>.</p><script>document.getElementById('zones').addEventListener('change',e=>document.querySelectorAll('img[data-normal]').forEach(img=>img.src=e.target.checked?img.dataset.review:img.dataset.normal));</script></html>`;
 await fs.writeFile(path.join(out,'OTVORIT-NAHLAD.html'),html);
 await fs.rm(fontConfig,{force:true});
}
main().catch(e=>{console.error(e);process.exitCode=1});
