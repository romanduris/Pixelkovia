/* Native social layouts over real photos and generated illustrative scenes. */
const fs=require('node:fs/promises'),path=require('node:path'),{createHash}=require('node:crypto');
const out=__dirname,root=path.resolve(out,'../../..');
const fontConfig='/tmp/pixelkovia-organic-fonts-'+process.pid+'.conf';process.env.FONTCONFIG_FILE=fontConfig;
const sharp=require(path.join(root,'admin/node_modules/sharp')),scene=require('./product-scene.cjs');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const uri=(b,m)=>`data:${m};base64,${b.toString('base64')}`;
const hash=b=>createHash('sha256').update(b).digest('hex');
const cream='#fff7ea',mint='#b4efd6',lavender='#d3bdff';
const cache=new Map();
async function textBounds(t){
 const key=JSON.stringify(t.slice(0,1).concat(t.slice(3)));
 if(!cache.has(key)){
  const [text,,,size,font,weight,fill,anchor]=t;
  const b=Buffer.from(`<svg width="2200" height="400"><text x="1100" y="220" font-family="${font}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor||'start'}" fill="white">${esc(text)}</text></svg>`);
  const {data,info}=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});let x0=2200,y0=400,x1=-1,y1=-1;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>12){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
  if(x1<0)throw Error('Empty text: '+text);cache.set(key,[x0-1101,y0-221,x1-x0+3,y1-y0+3]);
 }
 const b=cache.get(key);return{text:t[0],x:t[1]+b[0],y:t[2]+b[1],width:b[2],height:b[3],fontSize:t[3]};
}
async function photo(file,x,y,w,h,position='centre'){
 const b=await fs.readFile(path.join(out,'sources',file));
 const p=await sharp(b).resize(Math.round(w),Math.round(h),{fit:'cover',position}).jpeg({quality:97}).toBuffer();
 return `<image xlink:href="${uri(p,'image/jpeg')}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
}
function bbox(q,s,x,y){const a=q.map(p=>[p[0]*s+x,p[1]*s+y]);const xx=a.map(p=>p[0]),yy=a.map(p=>p[1]);return[Math.min(...xx),Math.min(...yy),Math.max(...xx)-Math.min(...xx),Math.max(...yy)-Math.min(...yy)].map(v=>Math.round(v*100)/100)}
async function main(){
 await fs.writeFile(fontConfig,`<fontconfig><dir>${root}/assets/social/facebook/sources/fonts</dir><dir>${root}/assets/fonts</dir><cachedir>/tmp/pixelkovia-ad-font-cache</cachedir></fontconfig>`);
 let fontCss='';for(const [name,file,weight]of[['Manrope','assets/social/facebook/sources/fonts/Manrope-ExtraBold.ttf',800],['DM Sans','assets/social/facebook/sources/fonts/DM-Sans-Medium.ttf',500],['Caveat','assets/fonts/Caveat.ttf',400]])fontCss+=`@font-face{font-family:'${name}';src:url(${uri(await fs.readFile(path.join(root,file)),'font/ttf')});font-weight:${weight}}`;
 const layout=JSON.parse(await fs.readFile(path.join(out,'layouts.json'),'utf8'));
 const plan=JSON.parse(await fs.readFile(path.join(out,'content-plan.json'),'utf8'));
 const manifest={date:'2026-11-26',timezone:'Europe/Bratislava',formats:'8 feed images 1080×1350; 2 Stories 1080×1920',mode:'built-in image_gen for seven new scenes, reused A1 outpaint for26 November, two original real-play photo layouts; native editable typography and exact game pixels',publication:false,scheduling:false,verifiedProduct:plan.verifiedProduct,assets:[]};
 for(const i of layout.items){
  const W=1080,H=i.H,safeArea=H===1920?{left:76,top:288,right:1004,bottom:1536}:{left:65,top:81,right:1015,bottom:1269};
  let defs='',body='',sources={},productBounds={},geometry=null;
  if(i.collage){
   body='<rect width="1080" height="1350" fill="#0b1729"/>';
   body+=await photo('real-paper-physical-crop.webp',76,418,928,368,'centre');
   body+=await photo('real-story-physical-crop.webp',76,814,928,430,'south');
   sources={paperPhoto:{file:'assets/sales/real-play/play-paper.webp',crop:[180,270,1020,1120]},storyPhoto:{file:'assets/sales/real-play/play-story.webp',crop:[250,600,800,720]}};
   for(const f of ['real-paper-physical-crop.webp','real-story-physical-crop.webp'])sources[f]=hash(await fs.readFile(path.join(out,'sources',f)));
  }else{
   const p=await scene(i);defs=p.defs;sources=p.sources;
   const s=i.framing?.scale??Math.max(W/p.width,H/p.height),x=i.framing?.x??(W-p.width*s)/2,y=i.framing?.y??(H-p.height*s)/2;
   if(x>.01||y>.01||x+p.width*s<W-.01||y+p.height*s<H-.01)throw Error('Scene does not fill canvas: '+i.file);
   body=`<g transform="translate(${x} ${y}) scale(${s})">${p.body}</g>`;geometry={width:p.width,height:p.height,scale:s,x,y};
   if(i.paperQuad)productBounds.paper=bbox(i.visiblePaper||i.paperQuad,s,x,y);
   if(i.screenQuad)productBounds.screen=bbox(i.screenQuad,s,x,y);
   defs+='<linearGradient id="readability" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#071327" stop-opacity=".82"/><stop offset=".7" stop-color="#071327" stop-opacity=".32"/><stop offset="1" stop-color="#071327" stop-opacity="0"/></linearGradient>';
   body+=`<rect width="1080" height="${i.headerHeight||370}" fill="url(#readability)"/>`;
  }
  const texts=[],logos=[];
  function text(str,x,y,size,font='Manrope',weight=800,fill=cream,anchor='start'){
   texts.push([str,x,y,size,font,weight,fill,anchor]);return `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(str)}</text>`;
  }
  const by=H===1920?345:116;
  for(const [dx,dy]of[[0,0],[14,0],[0,14],[14,14]]){logos.push({text:'logo',x:76+dx,y:by-24+dy,width:10,height:10});body+=`<rect x="${76+dx}" y="${by-24+dy}" width="10" height="10" rx="2" fill="${mint}"/>`}
  body+=text('Pixelkovia',119,by,30);
  if(i.step)body+=text(`${i.step} / 3`,1004,116,25,'DM Sans',500,mint,'end');
  for(const t of i.texts||[])body+=text(t[0],t[1],t[2],t[3],t[4]||'Manrope',t[4]==='Caveat'?400:800,t[5]||cream,t[6]||'start');
  if(i.url)body+=text('pixelkovia.rodulab.com',76,i.url,29,'DM Sans',500,mint);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1080" height="${H}" viewBox="0 0 1080 ${H}"><title>${esc(i.title)}</title><desc>${esc(i.provenance)}. Pôvodné orezané herné podklady, bez riešení a funkčných QR. Typografia je upraviteľná.</desc><style>${fontCss}</style><defs>${defs}</defs>${body}</svg>`;
  const file=i.file+'.png',editable='editable/'+i.file+'.svg';await fs.writeFile(path.join(out,editable),svg);
  const png=await sharp(Buffer.from(svg),{limitInputPixels:false}).flatten({background:'#0b1729'}).toColourspace('srgb').withMetadata({exif:{IFD0:{ImageDescription:i.provenance+'; Pixelkovia organic content 26 Nov–3 Dec2026; no customer testimonial.'}}}).png().toBuffer();await fs.writeFile(path.join(out,file),png);
  await sharp(png).resize({width:360}).jpeg({quality:91}).toFile(path.join(out,'previews',i.file+'.jpg'));
  const bounds=[];for(const t of texts)bounds.push(await textBounds(t));bounds.push(...logos);
  const entry={date:i.date,title:i.title,file,editable,dimensions:[W,H],sha256:hash(png),bytes:png.length,provenance:i.provenance,safeArea,textBounds:bounds,sticker:i.sticker||null,productBounds,sources,photoGeometry:geometry,safePreview:'safe-area-review/'+i.file+'_kontrola.png'};
  const marks=bounds.map(b=>`<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="none" stroke="#bcf4ba" stroke-width="1.5"/>`).join('');
  const st=i.sticker?`<rect x="${i.sticker.x}" y="${i.sticker.y}" width="${i.sticker.width}" height="${i.sticker.height}" rx="12" fill="#76d9c1" fill-opacity=".18" stroke="#b4efd6" stroke-width="3" stroke-dasharray="12 8"/><text x="${i.sticker.x+i.sticker.width/2}" y="${i.sticker.y+i.sticker.height/2}" text-anchor="middle" font-family="DM Sans" font-size="28" fill="#fff7ea">${esc(i.sticker.label)} · doplniť v IG</text>`:'';
  const review=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1080" height="${H}"><image xlink:href="${uri(png,'image/png')}" width="1080" height="${H}"/><path d="M0 0H1080V${safeArea.top}H0ZM0 ${safeArea.bottom}H1080V${H}H0Z" fill="#ef5264" opacity=".34"/><rect x="${safeArea.left}" y="${safeArea.top}" width="${safeArea.right-safeArea.left}" height="${safeArea.bottom-safeArea.top}" fill="none" stroke="#b4efd6" stroke-width="3" stroke-dasharray="12 8"/>${marks}${st}</svg>`;
  await sharp(Buffer.from(review)).png().toFile(path.join(out,entry.safePreview));manifest.assets.push(entry);console.log(file);
 }
 await fs.writeFile(path.join(out,'artwork.json'),JSON.stringify(manifest,null,2)+'\n');
 for(const review of[false,true]){
  const layers=[],w=1800,h=1450;for(let n=0;n<manifest.assets.length;n++){const e=manifest.assets[n],x=(n%5)*360,y=Math.floor(n/5)*725;
   const label=`<svg width="360" height="70"><text x="14" y="25" font-family="Manrope" font-weight="800" font-size="19" fill="#fff7ea">${esc(e.date.slice(5).split('-').reverse().join('.')+' · '+e.title)}</text></svg>`;
   layers.push({input:Buffer.from(label),left:x,top:y},{input:await sharp(path.join(out,review?e.safePreview:e.file)).resize({width:332}).png().toBuffer(),left:x+14,top:y+48});
  }
  await sharp({create:{width:w,height:h,channels:3,background:'#0b1729'}}).composite(layers).jpeg({quality:94}).toFile(path.join(out,review?'PREHLAD-BEZPECNE-ZONY.jpg':'PREHLAD.jpg'));
 }
 const cards=manifest.assets.map(e=>{const p=plan.posts.find(p=>p.files.includes(e.file));return `<article><a href="${e.file}"><img src="${e.file}" data-normal="${e.file}" data-review="${e.safePreview}" width="1080" height="${e.dimensions[1]}" alt="${esc(Array.isArray(p.alt)?p.alt[p.files.indexOf(e.file)]:p.alt)}"></a><div><small>${esc(e.date)} · ${e.dimensions.join(' × ')}</small><h2>${esc(e.title)}</h2><p>${esc(e.provenance)}</p><p><a download href="${e.file}">PNG</a> · <a href="${e.editable}">Editovateľné SVG</a> · <a href="${e.safePreview}">Zóny</a></p><details><summary>Návrh popisu príspevku</summary><p>${esc(p.caption)}</p>${p.sticker?'<p>'+esc(p.sticker.note)+'</p>':''}</details></div></article>`}).join('');
 const html=`<!doctype html><html lang="sk"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pixelkovia · organický obsah 26.11.–03.12.2026</title><style>*{box-sizing:border-box}body{margin:0;padding:30px;background:#0b1729;color:#fff7ea;font:16px/1.55 system-ui}h1{font-size:32px;max-width:950px}p{max-width:1000px;color:#d1d9df}a{color:#b4efd6}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:26px;align-items:start}article{background:#142337;border:1px solid #304759;border-radius:9px;overflow:hidden}article img{display:block;width:100%;height:auto}article>div{padding:18px}h2{font-size:19px;margin:6px 0}small{color:#b4efd6}article p{font-size:14px}label{display:block;margin:24px 0}summary{cursor:pointer;color:#b4efd6}</style><h1>Pixelkovia · osem dní, desať vizuálov</h1><p>Facebook a Instagram · 26.11.–03.12.2026 · 8 feed obrázkov a 2 Stories. Tri snímky 27.11. tvoria jeden karusel v poradí 1–2–3. Všetky finály sú PNG v sRGB; texty zostávajú samostatné v SVG.</p><p>Snímky prípravy z 27.11. (krok 1) a dvojzáber z 30.11. používajú pôvodné skutočné fotografie hry. Ostatné sú generované ilustračné scény; nepredstavujú zákazníkov ani recenzie. Papier a viditeľné obrazovky obsahujú pôvodné orezané herné podklady.</p><p>Stories majú horných 15 % a spodných 20 % bez dôležitého textu. Pri publikovaní doplňte 28.11. anketu a 01.12. odkazovú nálepku na vyznačené miesto; značky sú iba v kontrolnom náhľade.</p><nav><a href="PREHLAD.jpg">Celá séria</a> · <a href="content-plan.json">Texty, alt popisy a publikačný plán</a> · <a href="prompts.json">Produkčné prompty</a> · <a href="artwork.json">Rozmery a zdroje</a> · <a href="https://pixelkovia.rodulab.com/">Web hry</a></nav><label><input type="checkbox" id="zones"> Zobraziť bezpečné zóny a miesta na nálepky</label><section>${cards}</section><p>Pripravené na ručné publikovanie. Príspevky neboli zverejnené ani naplánované.</p><script>document.getElementById('zones').addEventListener('change',e=>document.querySelectorAll('img[data-normal]').forEach(img=>img.src=e.target.checked?img.dataset.review:img.dataset.normal));</script></html>`;
 await fs.writeFile(path.join(out,'OTVORIT-NAHLAD.html'),html);await fs.rm(fontConfig,{force:true});
}
main().catch(e=>{console.error(e);process.exitCode=1});
