/* Draft campaign artwork. Original photographs and approved illustrations only.
   No network, website changes, scheduling or social-media publication. */
const fs=require('node:fs/promises'),path=require('node:path'),{createHash}=require('node:crypto');
const sharp=require(process.env.SHARP_MODULE||'../../../admin/node_modules/sharp');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=__dirname,root=path.resolve(out,'../../..'),W=1080;
const C={navy:'#0d1424',paper:'#f6f0e5',mint:'#ace9cf',green:'#233b33',lavender:'#cab5f4',orange:'#f2ac71',muted:'#b5c3d4'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const sha=b=>createHash('sha256').update(b).digest('hex');
const files=[
 ['2026-11-12-feed-A',1350,'product','2026-11-12','Feed A · reálny produkt'],
 ['2026-11-12-feed-B',1350,'world','2026-11-12','Feed B · fotografia a svet Pixelkov'],
 ['2026-11-13-story',1920,'prepare','2026-11-13','Story · Vytlačiť. Ukryť. Hrať.'],
 ['2026-11-14-story',1920,'clues','2026-11-14','Story · Svet plný indícií'],
 ['2026-11-15-carousel-01',1350,'paper','2026-11-15','Carousel 1/3 · Papier'],
 ['2026-11-15-carousel-02',1350,'mobile','2026-11-15','Carousel 2/3 · Mobil'],
 ['2026-11-15-carousel-03',1350,'together','2026-11-15','Carousel 3/3 · Spoločné dobrodružstvo'],
 ['2026-11-16-feed',1350,'soon','2026-11-16','Feed · Dobrodružstvo sa blíži']
];
const derivatives=[
 {name:'team-clue.webp',file:'assets/sales/real-play/play-team.webp',crop:{left:0,top:780,width:900,height:600},note:'Finger pointing at an excerpt of an authentic printed clue. QR to the right and complete worksheet/return strip below are physically excluded.'},
 {name:'phone-action.webp',file:'assets/sales/real-play/play-phone.webp',crop:{left:300,top:290,width:850,height:440},note:'Only the active memory-game area and hands. QR/background worksheets and bottom progress/answer row are outside the physical crop.'},
 {name:'paper-hands.webp',file:'assets/sales/real-play/play-paper.webp',crop:{left:80,top:100,width:1080,height:1250},note:'Authentic hands and partially covered paper wheels; no instructions, complete worksheet, QR or solution.'},
 {name:'paper-detail.webp',file:'assets/sales/real-play/play-paper.webp',crop:{left:280,top:300,width:850,height:900},note:'Macro excerpt of the same physical material, still partly covered by fingers. No complete playable puzzle.'},
 {name:'story-photo.webp',file:'assets/sales/real-play/play-story.webp',crop:{left:0,top:0,width:1040,height:1250},note:'Original still photograph of the story on a phone, not a frame extracted from video. Lower/right worksheet and handwritten return signs are physically excluded.'},
 {name:'guide-steps.png',file:'assets/social/prelaunch-2026-11-05-to-11-10/sources/parent-guide-excerpt.png',crop:{left:12,top:26,width:562,height:444},note:'Preparation steps only; QR to the right and all answer/hiding-place instructions below are outside the physical crop.'},
 {name:'room-group.webp',file:'assets/pixelkovia-room-desktop.webp',crop:{left:580,top:170,width:1020,height:730},note:'Approved illustrated living room and all seven original characters, uniformly scaled in layouts. This is brand illustration, not a customer photograph.'}
];
let data={},fontCss='',manifest={status:'draft-for-owner-approval',publication:'Not published or scheduled on social media. No website deployment.',launchDateConfirmed:false,illustrations:'Existing approved AI-generated brand illustrations; no new generated artwork. Genuine owner-supplied photographs are identified separately.',sources:[],exports:[]},serial=0;
async function prepareSources(){
 for(const item of derivatives){
  const target=path.join(out,'sources',item.name),source=path.join(root,item.file);
  try{
   const original=await fs.readFile(source);
   const p=sharp(original).extract(item.crop);
   await (item.name.endsWith('.png')?p.png():p.webp({quality:94,effort:5})).toFile(target);
   const bytes=await fs.readFile(target),m=await sharp(bytes).metadata();
   manifest.sources.push({...item,sourceSha256:sha(original),sha256:sha(bytes),width:m.width,height:m.height});
  }catch(error){if(error.code!=='ENOENT')throw error;await fs.access(target);}
 }
 for(const name of ['piko','pixi']){
  const file=`assets/characters/${name}.png`,target=path.join(out,'sources',name+'.png');
  try{const bytes=await fs.readFile(path.join(root,file));await fs.writeFile(target,bytes);manifest.sources.push({name:name+'.png',file,sha256:sha(bytes),note:'Unchanged approved transparent original, including its original metadata; uniform scaling only.'});}catch(error){if(error.code!=='ENOENT')throw error;await fs.access(target);}
 }
 for(const file of ['Manrope-ExtraBold.ttf','DM-Sans-Medium.ttf','OFL-Manrope.txt','OFL-DM-Sans.txt']){
  const target=path.join(out,'sources/fonts',file);
  try{await fs.copyFile(path.join(out,'../facebook/sources/fonts',file),target);}catch(error){if(error.code!=='ENOENT')throw error;await fs.access(target);}
 }
 for(const item of [...derivatives.map(x=>x.name),'piko.png','pixi.png']){
  const bytes=await fs.readFile(path.join(out,'sources',item));data[item]=`data:image/${item.endsWith('.png')?'png':'webp'};base64,${bytes.toString('base64')}`;
 }
 for(const [family,file]of [['Manrope','Manrope-ExtraBold.ttf'],['DM Sans','DM-Sans-Medium.ttf']])fontCss+=`@font-face{font-family:'${family}';src:url(data:font/ttf;base64,${(await fs.readFile(path.join(out,'sources/fonts',file))).toString('base64')}) format('truetype');font-weight:${family==='Manrope'?800:500};}`;
}
const rect=(x,y,w,h,fill,rx=0,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const text=(lines,x,y,size,color=C.navy,{body=false,lead=size*1.14,max=920,spacing=0,anchor='start',id=''}={})=>`<text ${id?`id="${id}"`:''} data-type="${body?'body':'heading'}" data-max-width="${max}" x="${x}" y="${y}" font-family="${body?'DM Sans':'Manrope'}" font-weight="${body?500:800}" font-size="${size}" fill="${color}" letter-spacing="${spacing}" text-anchor="${anchor}">${[].concat(lines).map((line,i)=>`<tspan x="${x}" y="${y+i*lead}">${esc(line)}</tspan>`).join('')}</text>`;
const line=(d,color=C.mint,width=3,more='')=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${more}/>`;
const star=(x,y,size,color)=>`<path d="M${x} ${y-size}Q${x} ${y} ${x+size} ${y}Q${x} ${y} ${x} ${y+size}Q${x} ${y} ${x-size} ${y}Q${x} ${y} ${x} ${y-size}" fill="${color}"/>`;
const pixels=(x,y,color)=>rect(x,y,13,13,color,3)+rect(x+18,y,13,13,color,3)+rect(x,y+18,13,13,color,3)+rect(x+18,y+18,13,13,color,3);
function brand(dark=false,story=false,label='STRATENÝ SIGNÁL'){
 const y=story?290:110,fg=dark?C.paper:C.navy;
 return pixels(80,y-25,dark?C.mint:C.green)+text('Pixelkovia',127,y,36,fg,{max:360})+text(label,80,y+58,22,dark?C.mint:C.green,{body:true,spacing:3,max:820});
}
function footer(dark=false,tag=''){
 const fg=dark?C.paper:C.navy;
 return (tag?text(tag,80,1194,32,fg,{body:true,max:900}):'')+line('M80 1234H1000',dark?'#30443c':'#d9ddcf',1.5)+text('pixelkovia.rodulab.com',80,1285,25,dark?C.mint:C.green,{body:true,max:730})+line('M956 1260l24 15-24 15M980 1275h-52',dark?C.mint:C.green,3);
}
function chip(label,x,y,w,dark=false){return rect(x,y,w,52,dark?'#24352f':'#e3e8d9',26)+text(label,x+w/2,y+34,22,dark?C.mint:C.green,{body:true,max:w-28,anchor:'middle'});}
function photo(name,x,y,w,h,angle=0,{frame=true,radius=30,position='xMidYMid',shadow=true}={}){
 const id='crop'+(++serial),pad=frame?13:0;
 return `<g transform="rotate(${angle} ${x+w/2} ${y+h/2})">${frame?rect(x-pad,y-pad,w+2*pad,h+2*pad,C.paper,radius+8,shadow?'filter="url(#shadow)"':''):''}<defs><clipPath id="${id}">${rect(x,y,w,h,'white',radius)}</clipPath></defs><image data-source="${name}" href="${data[name]}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="${position} slice" clip-path="url(#${id})"/></g>`;
}
const character=(name,x,y,size)=>`<image data-source="${name}.png" href="${data[name+'.png']}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
function signalTrail(d,color=C.green){return line(d,color,3,'stroke-dasharray="4 14" opacity=".45"');}
function storyLink(dark=false){
 const color=dark?C.paper:C.navy;
 return text('Objavte rodinné dobrodružstvo',540,1470,31,color,{body:true,anchor:'middle',max:900})+`<rect id="link-sticker-safe-area" x="220" y="1510" width="640" height="130" fill="none"/>`+text('pixelkovia.rodulab.com',540,1660,26,dark?C.mint:C.green,{body:true,anchor:'middle',max:900});
}
function template(design,H){
 serial=0;let b='',dark=['world','clues','mobile','together'].includes(design);
 b+=rect(0,0,W,H,design==='soon'?C.mint:dark?C.navy:C.paper);
 if(design==='product'){
  b+=`<ellipse cx="680" cy="840" rx="530" ry="370" fill="#e2e9da"/>`+brand()+chip('7–13 ROKOV',756,66,244);
  b+=text(['Dobrodružstvo','začína doma.'],80,300,93,C.navy,{lead:109})+text('Papierové stopy. Príbeh v mobile.',80,466,33,C.green,{body:true});
  b+=signalTrail('M70 1030C-40 760 160 540 410 585S740 510 990 590')+star(927,482,31,C.orange);
  b+=photo('phone-action.webp',557,575,420,528,7)+photo('paper-hands.webp',72,650,548,435,-7);
  b+=rect(110,1024,326,54,C.navy,27)+text('SKUTOČNÉ HRANIE',273,1060,22,C.paper,{body:true,anchor:'middle',max:300});
  b+=character('piko',762,962,220)+footer(false,'7 záhad. Jeden spoločný príbeh.');
 }
 if(design==='world'){
  b+=photo('room-group.webp',0,400,1080,810,0,{frame:false,radius:0});
  b+=rect(0,0,1080,1350,'url(#worldShade)');
  b+=brand(true)+text(['Veľký svet.','U vás doma.'],80,320,106,C.paper,{lead:121})+text('Keď sa obývačka zmení na dobrodružstvo.',80,503,31,C.mint,{body:true});
  b+=star(933,277,32,C.mint)+photo('paper-hands.webp',82,902,335,217,-9)+chip('PAPIER + MOBIL',670,1061,320,true)+footer(true,'Príbeh, do ktorého vstúpite spolu.');
 }
 if(design==='prepare'){
  b+=rect(750,430,330,900,'#e1e9d9',150)+brand(false,true,'JEDNODUCHÁ PRÍPRAVA');
  b+=text(['Vytlačiť.','Ukryť. Hrať.'],80,480,95,C.navy,{lead:110})+text(['Pripravený návod vás prevedie','celou prípravou.'],80,670,33,C.green,{body:true,lead:44});
  const steps=[['paper-hands.webp','01','Vytlačiť','Materiály na domácu tlač.'],['guide-steps.png','02','Ukryť','Indície podľa návodu.'],['phone-action.webp','03','Hrať','Vyrazte na spoločné pátranie.']];
  steps.forEach(([src,num,title,copy],i)=>{const y=790+i*205;b+=photo(src,93,y,270,160,i%2?4:-4,{radius:20})+text(num,405,y+38,26,C.green,{body:true,max:150})+text(title,405,y+104,53,C.navy,{max:580})+text(copy,405,y+157,29,C.green,{body:true,max:580});});
  b+=character('piko',802,485,177)+signalTrail('M64 792v380q0 85 90 85')+storyLink();
 }
 if(design==='clues'){
  b+=rect(0,570,1080,850,'#172d30')+brand(true,true,'SVET PLNÝ INDÍCIÍ');
  b+=text(['Každá indícia.','O krok bližšie.'],80,490,88,C.paper,{lead:106})+text('K riešeniu, ktoré objavíte spolu.',80,680,32,C.mint,{body:true});
  b+=photo('paper-detail.webp',85,755,910,590,-3,{radius:34});
  b+=line('M824 1037a170 170 0 1 0 0 340a170 170 0 1 0 0-340',C.mint,5)+line('M945 1328l55 60',C.mint,15)+star(931,707,29,C.orange);
  b+=rect(115,1194,350,54,C.navy,27)+text('DETAIL SKUTOČNEJ HRY',290,1230,21,C.mint,{body:true,anchor:'middle',max:320})+character('pixi',680,1180,228)+storyLink(true);
 }
 if(design==='paper'){
  b+=brand(false,false,'01 / 03 · PAPIER')+text(['Hľadajte','stopy.'],80,320,110,C.navy,{lead:124});
  b+=text('Príbeh sa začína mimo obrazovky.',80,524,32,C.green,{body:true})+star(907,325,56,C.orange);
  b+=photo('team-clue.webp',80,608,920,505,-3,{radius:34})+photo('paper-hands.webp',104,932,320,178,6,{radius:20})+signalTrail('M973 617q-140-110-277-42');
  b+=footer(false,'Vytlačené indície. Skutočné pátranie.');
 }
 if(design==='mobile'){
  b+=rect(550,390,530,770,'url(#tealGlow)',180)+brand(true,false,'02 / 03 · MOBIL')+text(['Odhaľujte','príbeh.'],80,320,106,C.paper,{lead:121});
  b+=text('Jeden spoločný mobil vás sprevádza hrou.',80,518,31,C.mint,{body:true});
  b+=photo('story-photo.webp',334,594,635,501,5,{radius:34,position:'xMidYMax'})+photo('phone-action.webp',90,637,420,318,-7,{radius:25})+character('piko',64,897,285)+star(906,530,34,C.lavender);
  b+=footer(true,'Správy, príbeh a interaktívne úlohy.');
 }
 if(design==='together'){
  b+=photo('room-group.webp',0,530,1080,610,0,{frame:false,radius:0})+rect(0,0,1080,1350,'url(#worldShade)')+brand(true,false,'03 / 03 · SPOLOČNÉ DOBRODRUŽSTVO');
  b+=text(['Zvládnete','všetkých'],80,302,92,C.paper,{lead:104})+text('7 záhad?',80,600,132,C.mint,{max:930});
  b+=signalTrail('M838 442q130 90 120 243',C.mint)+star(955,488,29,C.orange)+chip('KAŽDÝ NÁPAD SA POČÍTA',601,1050,400,true)+footer(true,'Papier. Mobil. A spoločné „máme to!“');
 }
 if(design==='soon'){
  b+=`<circle cx="560" cy="854" r="425" fill="#c8f2df"/><circle cx="560" cy="854" r="372" fill="none" stroke="#6ab99a" stroke-width="2"/>`+brand()+text(['Dobrodružstvo','sa blíži.'],80,310,103,C.navy,{lead:118})+text('Rodinná hra pre deti 7–13 rokov.',80,507,35,C.green,{body:true});
  b+=photo('paper-hands.webp',72,692,410,355,-10)+photo('phone-action.webp',680,665,315,365,9)+character('piko',269,565,625);
  b+=star(893,563,47,C.paper)+star(116,581,28,C.green)+footer(false,'Pripravte sa na spoločný zážitok.');
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${H}" viewBox="0 0 1080 ${H}"><title>Pixelkovia · ${esc(files.find(f=>f[2]===design)[4])}</title><desc>Autentické fotografie produktu kombinované s pôvodnými schválenými ilustráciami Pixelkov. Návrh na schválenie.</desc><style>${fontCss} text{font-synthesis:none}</style><defs><filter id="shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="17" stdDeviation="20" flood-color="#07120f" flood-opacity=".22"/></filter><linearGradient id="worldShade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${C.navy}"/><stop offset=".39" stop-color="${C.navy}" stop-opacity=".99"/><stop offset=".56" stop-color="${C.navy}" stop-opacity=".2"/><stop offset=".78" stop-color="${C.navy}" stop-opacity=".12"/><stop offset=".88" stop-color="${C.navy}" stop-opacity=".93"/><stop offset="1" stop-color="${C.navy}"/></linearGradient><radialGradient id="tealGlow"><stop stop-color="#32635b"/><stop offset="1" stop-color="${C.navy}"/></radialGradient></defs>${b}</svg>`;
}
async function main(){
 await fs.mkdir(path.join(out,'editable'),{recursive:true});await fs.mkdir(path.join(out,'previews'),{recursive:true});await prepareSources();
 const browser=await chromium.launch({headless:true});const layout=[];
 try{
  const page=await browser.newPage({viewport:{width:W,height:1920},deviceScaleFactor:1});
  page.on('pageerror',e=>{throw e;});
  for(const [name,H,design,publishDate,theme]of files){
   const svgFile=path.join(out,'editable',name+'.svg');
   const markup=process.argv.includes('--reuse-svg')?await fs.readFile(svgFile,'utf8'):template(design,H);
   await page.setViewportSize({width:W,height:H});
   await page.setContent('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:1080px;overflow:hidden}svg{display:block}</style></head><body>'+markup+'</body></html>');
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(im=>im.decode()));});
   const boxes=await page.evaluate(()=>{
    for(const el of document.querySelectorAll('text[data-max-width]')){
     const max=Number(el.dataset.maxWidth),box=el.getBBox();
     if(box.width>max){const scale=max/box.width;el.setAttribute('font-size',Math.floor(Number(el.getAttribute('font-size'))*scale));}
    }
    return [...document.querySelectorAll('text[data-type]')].map(el=>{const b=el.getBBox();return {text:el.textContent,x:b.x,y:b.y,width:b.width,height:b.height,size:Number(el.getAttribute('font-size')),type:el.dataset.type};});
   });
   for(const box of boxes){if(box.x<72||box.x+box.width>1008||box.y<55||box.y+box.height>H-55)throw Error('Text outside safe margin: '+name+' '+JSON.stringify(box));if(box.size<20)throw Error('Text too small: '+name+' '+box.text);}
   await fs.writeFile(svgFile,await page.locator('svg').evaluate(el=>el.outerHTML));
   const png=await page.screenshot({type:'png'});
   const xmp=`<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator><rdf:Seq><rdf:li>Pixelkovia</rdf:li></rdf:Seq></dc:creator><dc:description><rdf:Alt><rdf:li xml:lang="x-default">Authentic owner-supplied product photographs composited with existing approved AI-generated Pixelkovia character illustrations and editable vector typography. No synthetic customers or new generated scenes. Draft for owner approval.</rdf:li></rdf:Alt></dc:description></rdf:Description></rdf:RDF></x:xmpmeta>`;
   await sharp(png).flatten({background:C.navy}).withIccProfile('srgb').withXmp(xmp).png({compressionLevel:9,adaptiveFiltering:true}).toFile(path.join(out,name+'.png'));
   await sharp(path.join(out,name+'.png')).resize({width:360}).png().toFile(path.join(out,'previews',name+'-360.png'));
   const bytes=await fs.readFile(path.join(out,name+'.png')),meta=await sharp(bytes).metadata();
   if(meta.width!==W||meta.height!==H||meta.hasAlpha||meta.format!=='png'||meta.space!=='srgb')throw Error('Invalid export '+name);
   const sources=[...new Set(await page.locator('[data-source]').evaluateAll(els=>els.map(el=>el.dataset.source)))];
   manifest.exports.push({file:name+'.png',publishDate,theme,width:W,height:H,sha256:sha(bytes),bytes:bytes.length,sources,linkSticker:H===1920?{x:220,y:1510,width:640,height:130}:null});layout.push({file:name+'.png',text:boxes});
   console.log(name+'.png · '+W+' × '+H+' · '+Math.round(bytes.length/1024)+' KB');
  }
 }finally{await browser.close();}
 await fs.writeFile(path.join(out,'artwork.json'),JSON.stringify(manifest,null,2)+'\n');await fs.writeFile(path.join(out,'layout.json'),JSON.stringify(layout,null,2)+'\n');
 // All eight complete compositions on a single review board, not for posting.
 const layers=[],thumb=300,gap=28,margin=64,boardW=margin*2+4*thumb+3*gap,boardH=1280;
 layers.push({input:Buffer.from(`<svg width="${boardW}" height="115"><text x="64" y="45" font-family="sans-serif" font-weight="bold" font-size="30" fill="${C.navy}">Pixelkovia · kampaň 12.–16. 11. 2026</text><text x="64" y="83" font-family="sans-serif" font-size="18" fill="${C.green}">8 statických návrhov na schválenie · A alebo B je alternatíva jedného príspevku</text></svg>`),left:0,top:0});
 for(let i=0;i<files.length;i++){
  const [name,H,,,theme]=files[i],x=margin+(i%4)*(thumb+gap),y=i<4?145:785;
  const input=await sharp(path.join(out,name+'.png')).resize({width:thumb}).png().toBuffer();layers.push({input,left:x,top:y});
  layers.push({input:Buffer.from(`<svg width="300" height="75"><text x="0" y="23" font-family="sans-serif" font-size="14" fill="${C.navy}">${esc(name.replace('2026-',''))}</text><text x="0" y="48" font-family="sans-serif" font-size="12" fill="${C.green}">${esc(theme)}</text></svg>`),left:x,top:y+Math.round(H*thumb/W)+12});
 }
 await sharp({create:{width:boardW,height:boardH,channels:3,background:C.paper}}).composite(layers).jpeg({quality:91}).toFile(path.join(out,'previews/00-prehlad-vsetkych-vizualov.jpg'));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
