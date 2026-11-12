/* Photo-led ad artwork. No generation, network calls, publishing or ad changes. */
const fs=require('node:fs/promises'),path=require('node:path'),{createHash}=require('node:crypto');
const sharp=require(process.env.SHARP_MODULE||'../../../admin/node_modules/sharp');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=__dirname,root=path.resolve(out,'../../..'),W=1080;
const C={navy:'#101c2d',cream:'#f6f0e5',mint:'#b2e8cf',green:'#285b4d',amber:'#e8b477'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const hash=b=>createHash('sha256').update(b).digest('hex');
let data={},fonts='',serial=0;
const manifest={status:'prepared-for-owner-review',socialPublication:false,adActivation:false,selectedConcept:'A',photography:'Genuine owner-supplied still photos. Cropping, rotation and normal exposure correction only. No synthetic people, screens or gameplay.',illustrations:'Concept C only: unchanged approved AI-generated Piko portrait. A/final use no added character or scene illustration.',review:{existingAssetImagesAtStart:138,originalPhotos:6,scope:'All pre-existing raster images under assets, before creating this folder.'},sources:[],exports:[]};
const sourceFiles={
 paper:'assets/social/prelaunch-2026-11-12-to-16/sources/paper-hands.webp',
 piko:'assets/characters/piko.png'
};
async function sources(){
 await fs.mkdir(path.join(out,'sources'),{recursive:true});
 // Straighten the real device, then physically remove handwritten answers,
 // QR/background sheets and the lower in-game progress/code strip.
 const raw=await fs.readFile(path.join(root,'assets/Photo/20261108_193537.jpg'));
 const oriented=await sharp(raw).rotate().toBuffer();
 const device=await sharp(oriented).extract({left:1330,top:800,width:1050,height:1220}).png().toBuffer();
 const straight=await sharp(device).rotate(22,{background:C.cream}).resize({width:1600}).png().toBuffer();
 const phone=await sharp(straight).extract({left:432,top:160,width:672,height:824}).modulate({brightness:1.06}).webp({quality:95}).toBuffer();
 await fs.writeFile(path.join(out,'sources/phone-upright.webp'),phone);
 manifest.sources.push({key:'phone',file:'sources/phone-upright.webp',original:'assets/Photo/20261108_193537.jpg',originalSha256:hash(raw),sha256:hash(phone),recipe:{orient:true,initialCrop:{left:1330,top:800,width:1050,height:1220},rotationDegrees:22,workingWidth:1600,physicalCrop:{left:432,top:160,width:672,height:824}},safety:'Only device top, memory cards and hands. QR, handwritten background answers and lower progress/code strip are physically absent.'});
 data.phone='data:image/webp;base64,'+phone.toString('base64');
 for(const [key,file]of Object.entries(sourceFiles)){
  const bytes=await fs.readFile(path.join(root,file));data[key]=`data:image/${file.endsWith('.png')?'png':'webp'};base64,${bytes.toString('base64')}`;
  manifest.sources.push({key,file,sha256:hash(bytes),safety:key==='paper'?'Hands partly cover the paper wheels; no complete instructions, QR or solution.':'Unchanged approved portrait; uniform scaling only.'});
 }
 for(const [family,file,weight]of [['Manrope','Manrope-ExtraBold.ttf',800],['DM Sans','DM-Sans-Medium.ttf',500]]){
  const filePath='assets/social/facebook/sources/fonts/'+file,bytes=await fs.readFile(path.join(root,filePath));
  fonts+=`@font-face{font-family:'${family}';src:url(data:font/ttf;base64,${bytes.toString('base64')}) format('truetype');font-weight:${weight};}`;
 }
}
const rect=(x,y,w,h,fill,rx=0,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const text=(lines,x,y,size,color=C.navy,{body=false,lead=size*1.16,max=952,spacing=0,anchor='start',type='copy'}={})=>`<text data-qa="${type}" data-max="${max}" x="${x}" y="${y}" font-family="${body?'DM Sans':'Manrope'}" font-weight="${body?500:800}" font-size="${size}" fill="${color}" letter-spacing="${spacing}" text-anchor="${anchor}">${[].concat(lines).map((line,i)=>`<tspan x="${x}" y="${y+i*lead}">${esc(line)}</tspan>`).join('')}</text>`;
const line=(d,color,width=2,extra='')=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" ${extra}/>`;
const arrow=(x,y,color=C.navy)=>line(`M${x-38} ${y}h38m-14-14 14 14-14 14`,color,3);
function brand(y,dark=false){
 const fg=dark?C.cream:C.navy;
 return rect(64,y-26,12,12,dark?C.mint:C.green,2)+rect(81,y-26,12,12,dark?C.mint:C.green,2)+rect(64,y-9,12,12,dark?C.mint:C.green,2)+rect(81,y-9,12,12,dark?C.mint:C.green,2)+text('Pixelkovia',110,y,34,fg,{max:380,type:'brand'})+text('STRATENÝ SIGNÁL',1016,y-3,23,dark?C.mint:C.green,{body:true,anchor:'end',spacing:1.5,max:430,type:'brand'});
}
function photo(key,x,y,w,h,{rx=22,fit='xMidYMid',border=0}={}){
 const id='photo-'+(++serial);
 return (border?rect(x-border,y-border,w+border*2,h+border*2,C.cream,rx+border):'')+`<defs><clipPath id="${id}">${rect(x,y,w,h,'white',rx)}</clipPath></defs><image data-source="${key}" href="${data[key]}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="${fit} slice" clip-path="url(#${id})"/>`;
}
function pairedPhotos(y,h,story=false){
 const left=story?72:64,total=story?936:952,paperW=story?550:568,phoneW=total-paperW-16;
 return photo('paper',left,y,paperW,h)+photo('phone',left+paperW+16,y,phoneW,h);
}
function metrics(y,dark=false){return text('7 záhad  ·  7–13 rokov  ·  60–90 min',540,y,31,dark?C.cream:C.navy,{body:true,anchor:'middle',max:936});}
function feedFooter(dark=false){
 return metrics(1118,dark)+rect(64,1162,952,86,dark?C.mint:C.navy,14)+text('Pozrite sa, ako sa hrá',112,1218,32,dark?C.navy:C.cream,{max:800})+arrow(966,1205,dark?C.navy:C.cream)+text('pixelkovia.rodulab.com',540,1301,28,dark?C.mint:C.green,{body:true,anchor:'middle',max:900,type:'url'});
}
function template(design,story=false){
 serial=0;const H=story?1920:1350;let b='';
 if(design==='A'){
  b+=rect(0,0,W,H,C.cream)+brand(story?300:95);
  b+=text('RODINNÁ HRA NA DOMA',story?72:64,story?369:175,27,C.green,{body:true,spacing:1.5,max:936});
  b+=text(['Papierové stopy.','Príbeh v mobile.'],story?72:64,story?485:285,83,C.navy,{lead:101,type:'headline'});
  b+=line(story?'M74 611h580':'M66 411h580',C.mint,11);
  b+=text('7 záhad. Jeden spoločný príbeh.',story?72:64,story?666:461,31,C.green,{body:true,max:936});
  b+=pairedPhotos(story?721:506,story?621:548,story);
  if(story){
   b+=metrics(1428)+text('Pozrite sa, ako sa hrá.',540,1501,35,C.navy,{anchor:'middle',max:936});
   b+=`<rect id="native-link-sticker-area" x="250" y="1530" width="580" height="95" fill="none"/>`+text('pixelkovia.rodulab.com',540,1662,30,C.green,{body:true,anchor:'middle',max:936,type:'url'});
  }else b+=feedFooter();
 }
 if(design==='B'){
  b+=rect(0,0,W,H,C.navy)+photo('paper',0,240,1080,900,{rx:0})+rect(0,0,W,H,'url(#photo-shade)')+brand(95,true);
  b+=text(['Dobrodružstvo','začína doma.'],64,260,91,C.cream,{lead:110,type:'headline'});
  b+=text('Rodinná hra pre deti 7–13 rokov.',64,438,32,C.mint,{body:true});
  b+=photo('phone',670,625,340,448,{border:8,rx:20})+text('Papier. Mobil. Spoločné pátranie.',64,1138,31,C.cream,{body:true});
  b+=rect(64,1180,952,80,C.mint,14)+text('Objavte hru',112,1233,32,C.navy,{max:800})+arrow(966,1218)+text('pixelkovia.rodulab.com',540,1301,28,C.mint,{body:true,anchor:'middle',type:'url'});
 }
 if(design==='C'){
  b+=rect(0,0,W,H,C.navy)+rect(825,70,255,450,'#1b3c40',80)+brand(95,true);
  b+=text(['7 záhad.','Jeden tím.'],64,278,105,C.cream,{lead:119,type:'headline'})+text('Rodinné dobrodružstvo doma.',64,466,32,C.mint,{body:true});
  b+=line('M40 620h32m950 0h28v330h-32',C.mint,3,'stroke-dasharray="6 10" opacity=".55"');
  b+=`<circle cx="348" cy="793" r="290" fill="${C.mint}"/>`+photo('paper',72,517,552,552,{rx:276})+`<g transform="rotate(6 831 803)">`+photo('phone',654,566,354,474,{border:8})+'</g>';
  b+=`<image data-source="piko" href="${data.piko}" x="842" y="970" width="170" height="170" preserveAspectRatio="xMidYMid meet"/>`+feedFooter(true);
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${H}" viewBox="0 0 1080 ${H}"><title>Pixelkovia · ${story?'finálna Story':design==='A'?'papier a mobil':design==='B'?'rodinný zážitok':'spoločné záhady'}</title><desc>Reálne dodané fotografie hry. Návrh platenej kreatívy na schválenie vlastníkom.</desc><style>${fonts}text{font-synthesis:none}</style><defs><linearGradient id="photo-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.navy}"/><stop offset=".34" stop-color="${C.navy}" stop-opacity=".93"/><stop offset=".52" stop-color="${C.navy}" stop-opacity=".04"/><stop offset=".75" stop-color="${C.navy}" stop-opacity=".14"/><stop offset=".88" stop-color="${C.navy}" stop-opacity=".95"/><stop offset="1" stop-color="${C.navy}"/></linearGradient></defs>${b}</svg>`;
}
async function render(page,name,design,story=false){
 const H=story?1920:1350,svg=template(design,story);
 await page.setViewportSize({width:W,height:H});
 await page.setContent('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:1080px}svg{display:block}</style></head><body>'+svg+'</body></html>');
 await page.evaluate(()=>document.fonts.ready);
 const layout=await page.locator('text[data-qa]').evaluateAll(els=>els.map(el=>{const b=el.getBBox();return {text:el.textContent,x:b.x,y:b.y,width:b.width,height:b.height,size:Number(el.getAttribute('font-size')),max:Number(el.dataset.max),type:el.dataset.qa};}));
 for(const b of layout){
  if(b.width>b.max+1||b.x<52||b.x+b.width>1028||b.y<(story?250:50)||b.y+b.height>H-(story?245:35))throw Error(name+': text outside safe area '+JSON.stringify(b));
  if(b.type==='headline'&&b.size<80)throw Error('Headline too small');
 }
 const bytes=await page.screenshot({type:'png'});
 const description=design==='C'?'Genuine owner-supplied product photos with an existing approved AI-generated Piko portrait. No generated people or scenes.':'Genuine owner-supplied product photos; vector layout and editable typography. No generated people, scenes, screens or added illustrations.';
 const xmp=`<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:description><rdf:Alt><rdf:li xml:lang="x-default">${esc(description)}</rdf:li></rdf:Alt></dc:description></rdf:Description></rdf:RDF></x:xmpmeta>`;
 await sharp(bytes).flatten({background:C.cream}).withIccProfile('srgb').withXmp(xmp).png({compressionLevel:9,adaptiveFiltering:true}).toFile(path.join(out,name+'.png'));
 await fs.writeFile(path.join(out,'editable',name+'.svg'),svg);
 await sharp(path.join(out,name+'.png')).resize({width:360}).png().toFile(path.join(out,'previews',name+'-360.png'));
 const exported=await fs.readFile(path.join(out,name+'.png')),meta=await sharp(exported).metadata();
 if(meta.width!==1080||meta.height!==H||meta.hasAlpha||meta.space!=='srgb')throw Error('Invalid export');
 manifest.exports.push({file:name+'.png',width:1080,height:H,bytes:exported.length,sha256:hash(exported),design,sources:await page.locator('[data-source]').evaluateAll(els=>[...new Set(els.map(el=>el.dataset.source))]),headline:layout.find(b=>b.type==='headline').text,linkSticker:story?{x:250,y:1530,width:580,height:95}:null});
 await fs.writeFile(path.join(out,'editable',name+'.layout.json'),JSON.stringify(layout,null,2)+'\n');
 console.log(name+'.png · 1080 × '+H+' · '+Math.round(exported.length/1024)+' KB');
}
async function board(){
 const layers=[],names=['A','B','C'];
 for(let i=0;i<3;i++){
  const x=48+i*408;
  layers.push({input:await sharp(path.join(out,`pixelkovia_ad_concept_${names[i]}_feed_4x5.png`)).resize({width:368}).png().toBuffer(),left:x,top:155});
  const labels=[['A · Produkt','Papier + mobil. Jasné za pár sekúnd.'],['B · Zážitok','Skutočné hranie a domáca atmosféra.'],['C · Značka','Reálne dôkazy s pôvodným Pikom.']][i];
  layers.push({input:Buffer.from(`<svg width="368" height="88"><text x="0" y="28" fill="${C.navy}" font-family="sans-serif" font-size="23" font-weight="bold">${labels[0]}</text><text x="0" y="61" fill="${C.green}" font-family="sans-serif" font-size="17">${labels[1]}</text></svg>`),left:x,top:638});
 }
 layers.push({input:Buffer.from(`<svg width="1280" height="130"><text x="48" y="55" fill="${C.navy}" font-family="sans-serif" font-size="35" font-weight="bold">Pixelkovia · 3 predajné smery</text><text x="48" y="99" fill="${C.green}" font-family="sans-serif" font-size="21">Reálne fotografie. Tri rôzne kompozície. Návrhy na schválenie.</text></svg>`),left:0,top:0});
 await sharp({create:{width:1280,height:750,channels:3,background:C.cream}}).composite(layers).png().toFile(path.join(out,'pixelkovia_ad_concepts_overview.png'));
}
async function main(){
 for(const dir of ['sources','editable','previews'])await fs.mkdir(path.join(out,dir),{recursive:true});
 await sources();const browser=await chromium.launch({headless:true});
 try{const page=await browser.newPage({viewport:{width:W,height:1920},deviceScaleFactor:1});
  for(const design of ['A','B','C'])await render(page,`pixelkovia_ad_concept_${design}_feed_4x5`,design);
  await board();
  if(!process.argv.includes('--concepts-only')){await render(page,'pixelkovia_ad_final_feed_4x5','A');await render(page,'pixelkovia_ad_final_story_9x16','A',true);}
 }finally{await browser.close();}
 await fs.writeFile(path.join(out,'artwork.json'),JSON.stringify(manifest,null,2)+'\n');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
