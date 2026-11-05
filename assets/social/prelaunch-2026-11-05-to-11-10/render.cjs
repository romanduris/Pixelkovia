// Authoring only: original Pixelkovia artwork + editable, deterministic typography.
// Run: node assets/social/prelaunch-2026-11-05-to-11-10/render.cjs
// No website writes, network access or publication.
const fs = require('node:fs/promises');
const path = require('node:path');
const {createHash} = require('node:crypto');
const sharp = require(process.env.SHARP_MODULE || '../../../admin/node_modules/sharp');
const out = __dirname, root = path.resolve(out, '../../..');
const W = 1080, H = 1350, margin = 80;
const C = {navy:'#0d1424',paper:'#f6f0e5',mint:'#ace9cf',lavender:'#cab5f4',green:'#233b33',muted:'#b5c3d4'};
const fonts = {
  heading:{family:'Manrope ExtraBold',file:path.join(out,'../facebook/sources/fonts/Manrope-ExtraBold.ttf')},
  body:{family:'DM Sans Medium',file:path.join(out,'../facebook/sources/fonts/DM-Sans-Medium.ttf')}
};
const source = file => path.join(root,file);
const xml = text => text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const svg = (markup,w=W,h=H) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${markup}</svg>`);
const specs = [
  {file:'post-01-objavte-tajny-svet-pixelkov.png',date:'2026-11-05',design:'world',dark:true,
    title:['OBJAVTE','TAJNÝ SVET','PIXELKOV'],size:90,leading:110,accent:[2],
    subtitle:['Dobrodružstvo sa začína','u vás doma'],subY:540},
  {file:'post-02-slide-01-ako-funguje.png',date:'2026-11-06',design:'how',slide:1,
    title:['AKO FUNGUJE','PIXELKOVIA?'],size:80,leading:99,accent:[1],
    subtitle:['Rodinné dobrodružstvo','krok za krokom'],subY:410},
  {file:'post-02-slide-02-rodic-pripravi.png',date:'2026-11-06',design:'prepare',slide:2,
    title:['1. RODIČ','PRIPRAVÍ HRU'],size:80,leading:99,accent:[1],
    subtitle:['Vytlačí materiály a ukryje','indície po byte'],subY:410},
  {file:'post-02-slide-03-deti-patraju.png',date:'2026-11-06',design:'search',slide:3,
    title:['2. DETI PÁTRAJÚ','A RIEŠIA HÁDANKY'],size:66,leading:88,accent:[1],
    subtitle:['Každá indícia ich posunie ďalej'],subY:390},
  {file:'post-02-slide-04-velke-tajomstvo.png',date:'2026-11-06',design:'discovery',slide:4,dark:true,
    title:['3. SPOLOČNE OBJAVIA','VEĽKÉ TAJOMSTVO'],size:66,leading:88,accent:[1],
    subtitle:['A pomôžu Pikovi nájsť','stratených kamarátov'],subY:390},
  {file:'post-03-piko-potrebuje-pomoc.png',date:'2026-11-08',design:'piko',dark:true,
    title:['PIKO POTREBUJE','VAŠU POMOC'],size:78,leading:100,accent:[1],
    subtitle:['Jeho kamaráti sa stratili'],subY:410},
  {file:'post-04-jeden-telefon-sedem-indicii.png',date:'2026-11-09',design:'adventure',dark:true,
    title:['JEDEN TELEFÓN.','SEDEM INDÍCIÍ.','JEDNO','DOBRODRUŽSTVO.'],size:66,leading:82,accent:[1,3],
    subtitle:['Pixelkovia premenia váš domov','na miesto plné záhad'],subY:525,subSize:36},
  {file:'post-05-slide-01-co-dostanete.png',date:'2026-11-10',design:'contents',slide:1,
    title:['ČO DOSTANETE','PO ZAKÚPENÍ?'],size:78,leading:99,accent:[1],
    subtitle:['Všetko, čo potrebujete na rodinné','dobrodružstvo doma'],subY:410,subSize:36},
  {file:'post-05-slide-02-pribeh-v-mobile.png',date:'2026-11-10',design:'story',slide:2,
    title:['INTERAKTÍVNY','PRÍBEH V MOBILE'],size:72,leading:94,accent:[1],
    subtitle:['Piko vás bude sprevádzať','celým dobrodružstvom'],subY:410},
  {file:'post-05-slide-03-pracovne-listy.png',date:'2026-11-10',design:'worksheets',slide:3,
    title:['7 PRACOVNÝCH','LISTOV A INDÍCIÍ'],size:74,leading:96,accent:[1],
    subtitle:['Hádanky, stopy a úlohy','na domáce pátranie'],subY:410},
  {file:'post-05-slide-04-navod-a-diplom.png',date:'2026-11-10',design:'guide',slide:4,
    title:['RODIČOVSKÝ NÁVOD,','NÁPOVEDY A DIPLOM'],size:63,leading:86,accent:[1],
    subtitle:['Príprava zaberie len chvíľu.','Zážitok ostane dlho.'],subY:390}
];
const layouts = [];

async function text(str,size,color,kind='heading') {
  const f=fonts[kind];
  const settings={font:`${f.family} ${size}`,fontfile:f.file,rgba:true,dpi:72};
  const raw=await sharp({text:{...settings,text:`<span foreground="${color}">${xml(str)}</span>`}}).png().toBuffer({resolveWithObject:true});
  // Invisible reference glyphs establish the same baseline for accented and
  // unaccented lines. Physically exclude their width from the exported layer.
  const referenced=await sharp({text:{...settings,text:`<span foreground="${color}">${xml(str)}</span><span foreground="#00000000"> Ágj</span>`}}).png().toBuffer({resolveWithObject:true});
  const result=await sharp(referenced.data).extract({left:0,top:0,width:raw.info.width,height:referenced.info.height}).png().toBuffer({resolveWithObject:true});
  const raster=await sharp(result.data).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let left=raster.info.width,top=raster.info.height,right=-1,bottom=-1;
  for(let y=0;y<raster.info.height;y++)for(let x=0;x<raster.info.width;x++){
    if(raster.data[(y*raster.info.width+x)*4+3]>0){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  }
  result.ink={left,top,width:right-left+1,height:bottom-top+1};
  return result;
}
async function addText(layers,layout,str,x,y,size,color,kind='heading') {
  const t=await text(str,size,color,kind);
  const box={text:str,x:x+t.ink.left,y:y+t.ink.top,width:t.ink.width,height:t.ink.height,size,font:fonts[kind].family,color};
  if(box.x<margin||box.x+box.width>W-margin||box.y<60||box.y+box.height>H-60)throw Error(`Text outside safe margins: ${layout.file}: ${str}: ${JSON.stringify(box)}`);
  layers.push({input:t.data,left:x,top:y}); layout.text.push(box);
}
async function image(file,w,h,crop) {
  let p=sharp(source(file));if(crop)p=p.extract(crop);
  return p.resize(w,h,{fit:'cover',position:'centre'}).png().toBuffer();
}
async function mask(input,radius) {
  const {width,height}=await sharp(input).metadata();
  return sharp(input).ensureAlpha().composite([{input:svg(`<rect width="${width}" height="${height}" rx="${radius}" fill="white"/>`,width,height),blend:'dest-in'}]).png().toBuffer();
}
async function photo(layers,layout,file,x,y,w,h,crop) {
  layers.push({input:await mask(await image(file,w,h,crop),28),left:x,top:y});
  layout.artwork.push({source:file,x,y,width:w,height:h,crop:crop||null});
}
async function paper(layers,layout,file,x,y,w,h,angle=0,crop) {
  const original=await image(file,w,h,crop);
  // The source itself is already a physical excerpt. No hidden full worksheet.
  const padding=16;
  const framed=await sharp({create:{width:w+padding*2,height:h+padding*2,channels:4,background:'#fffdf7'}})
    .composite([{input:original,left:padding,top:padding}]).rotate(angle,{background:'#00000000'}).png().toBuffer();
  const {width,height}=await sharp(framed).metadata();
  const shadow=await sharp(framed).ensureAlpha().recomb([[0,0,0],[0,0,0],[0,0,0]])
    .composite([{input:svg(`<rect width="${width}" height="${height}" fill="white" opacity=".18"/>`,width,height),blend:'dest-in'}])
    .blur(9).png().toBuffer();
  layers.push({input:shadow,left:x+7,top:y+13},{input:framed,left:x,top:y});
  layout.artwork.push({source:file,x,y,width,height,angle,crop:crop||null});
}
async function piko(layers,layout,x,y,size) {
  const file='assets/characters/piko.png';
  // Uniform scale of the approved original, including its existing alpha channel.
  const data=await sharp(source(file)).trim().resize(size,size,{fit:'contain',background:'#00000000'}).png().toBuffer();
  layers.push({input:data,left:x,top:y});layout.artwork.push({source:file,x,y,width:size,height:size,operation:'trim transparent edges; uniform scale only'});
}
function ornament(layers,markup) {layers.push({input:svg(markup),left:0,top:0});}
const guide='assets/social/prelaunch-2026-11-05-to-11-10/sources/parent-guide-excerpt.png';
const diploma='assets/social/prelaunch-2026-11-05-to-11-10/sources/diploma-excerpt.png';
const decoder='assets/sales/public-previews/decoder.webp';
const signals='assets/sales/public-previews/signals.webp';
const route='assets/sales/public-previews/path.webp';

async function artwork(s,layers,layout) {
  switch(s.design) {
    case 'world': {
      const room=await sharp(source('assets/pixelkovia-room-mobile.webp')).resize({width:W}).extract({left:0,top:565,width:W,height:H}).png().toBuffer();
      layers.push({input:room,left:0,top:0});
      layout.artwork.push({source:'assets/pixelkovia-room-mobile.webp',operation:'uniform width 1080, then crop y=565, h=1350'});
      ornament(layers,`<defs><linearGradient id="shade" x2="0" y2="1"><stop stop-color="${C.navy}" stop-opacity=".99"/><stop offset=".36" stop-color="${C.navy}" stop-opacity=".90"/><stop offset=".57" stop-color="${C.navy}" stop-opacity=".58"/><stop offset=".70" stop-color="${C.navy}" stop-opacity="0"/><stop offset=".87" stop-color="${C.navy}" stop-opacity="0"/><stop offset="1" stop-color="${C.navy}" stop-opacity=".97"/></linearGradient></defs><rect width="1080" height="1350" fill="url(#shade)"/>`);
      break;
    }
    case 'how':
      ornament(layers,`<circle cx="563" cy="880" r="294" fill="${C.mint}"/><circle cx="320" cy="730" r="11" fill="${C.green}"/><path d="M155 1010q-50-260 142-370 M825 668q190 130 62 365" fill="none" stroke="${C.green}" stroke-opacity=".19" stroke-width="3" stroke-dasharray="8 13"/>`);
      await piko(layers,layout,255,552,620);
      break;
    case 'prepare':
      ornament(layers,`<ellipse cx="590" cy="918" rx="428" ry="246" fill="#e1e9db"/>`);
      await paper(layers,layout,guide,92,600,750,482,-3);
      await paper(layers,layout,decoder,650,840,270,324,6,{left:0,top:210,width:703,height:633});
      break;
    case 'search':
      await photo(layers,layout,'assets/sales/family-code-mobile.webp',80,535,920,650,{left:0,top:260,width:760,height:700});
      break;
    case 'discovery':
      await photo(layers,layout,'assets/pixelkovia-room-desktop.webp',80,555,920,613,{left:640,top:260,width:960,height:640});
      break;
    case 'piko':
      ornament(layers,`<defs><radialGradient id="glow"><stop stop-color="#1b525c"/><stop offset="1" stop-color="${C.navy}"/></radialGradient></defs><ellipse cx="555" cy="890" rx="475" ry="360" fill="url(#glow)"/><path d="M120 875h140m30 0h28m430 0h40m30 0h140" stroke="${C.mint}" stroke-width="5" stroke-linecap="round" opacity=".5"/><circle cx="145" cy="713" r="6" fill="${C.lavender}"/><circle cx="898" cy="1053" r="8" fill="${C.mint}"/>`);
      await piko(layers,layout,220,520,680);
      break;
    case 'adventure':
      layers.push({input:await image('assets/sales/family-code-mobile.webp',1080,705,{left:0,top:180,width:1200,height:1100}),left:0,top:645});
      layout.artwork.push({source:'assets/sales/family-code-mobile.webp',x:0,y:645,width:1080,height:705,crop:{left:0,top:180,width:1200,height:1100}});
      ornament(layers,`<defs><linearGradient id="bottom" x2="0" y2="1"><stop offset=".88" stop-color="${C.navy}" stop-opacity="0"/><stop offset="1" stop-color="${C.navy}" stop-opacity=".96"/></linearGradient></defs><rect width="1080" height="1350" fill="url(#bottom)"/>`);
      break;
    case 'contents':
      ornament(layers,`<ellipse cx="480" cy="900" rx="350" ry="265" fill="${C.mint}"/>`);
      await paper(layers,layout,route,605,625,300,360,7);
      await paper(layers,layout,signals,565,775,320,384,-6);
      await piko(layers,layout,80,625,530);
      break;
    case 'story':
      await photo(layers,layout,'assets/sales/family-opening-mobile.webp',80,565,920,620,{left:0,top:250,width:1200,height:1000});
      break;
    case 'worksheets':
      ornament(layers,`<ellipse cx="540" cy="935" rx="425" ry="255" fill="#e1e9db"/>`);
      await paper(layers,layout,route,535,630,380,456,6);
      await paper(layers,layout,decoder,108,610,430,516,-5);
      break;
    case 'guide':
      ornament(layers,`<ellipse cx="555" cy="919" rx="425" ry="250" fill="#e1e9db"/>`);
      await paper(layers,layout,guide,95,562,740,475,-3);
      await paper(layers,layout,diploma,463,855,470,290,5);
      break;
    default:throw Error('Unknown design '+s.design);
  }
}
async function render(s) {
  const layers=[],layout={file:s.file,date:s.date,slide:s.slide||null,text:[],artwork:[]};
  await artwork(s,layers,layout);
  const ink=s.dark?C.paper:C.navy,accent=s.dark?C.mint:C.green;
  await addText(layers,layout,'PIXELKOVIA',80,69,30,ink);
  const episode=await text('Stratený signál',25,accent,'body');
  await addText(layers,layout,'Stratený signál',W-margin-episode.info.width,73,25,accent,'body');
  ornament(layers,`<path d="M80 128H1000" stroke="${ink}" stroke-opacity=".23" stroke-width="1.5"/>`);
  for(let i=0;i<s.title.length;i++)await addText(layers,layout,s.title[i],80,177+i*s.leading,s.size,s.accent.includes(i)?accent:ink);
  for(let i=0;i<s.subtitle.length;i++)await addText(layers,layout,s.subtitle[i],80,s.subY+i*50,s.subSize||38,ink,'body');
  await addText(layers,layout,'pixelkovia.rodulab.com',80,1253,25,s.dark?C.paper:C.green,'body');
  if(s.slide){
    ornament(layers,Array.from({length:4},(_,i)=>`<circle cx="${872+i*35}" cy="1276" r="${s.slide===i+1?7:4}" fill="${accent}" opacity="${s.slide===i+1?1:.35}"/>`).join(''));
    await addText(layers,layout,`${s.slide} / 4`,750,1253,25,accent,'body');
  }
  await sharp({create:{width:W,height:H,channels:3,background:s.dark?C.navy:C.paper}}).composite(layers)
    .removeAlpha().withIccProfile('srgb').png({compressionLevel:9,adaptiveFiltering:true}).toFile(path.join(out,s.file));
  layouts.push(layout);
}
async function previews() {
  const layers=[],cw=360,ch=450,gap=24,top=88,row=500;
  for(let i=0;i<specs.length;i++){
    const x=gap+(i%3)*(cw+gap),y=top+Math.floor(i/3)*row;
    layers.push({input:await sharp(path.join(out,specs[i].file)).resize(cw,ch).png().toBuffer(),left:x,top:y});
    const label=await text(specs[i].file.replace('.png',''),13,C.navy,'body');
    layers.push({input:label.data,left:x,top:y+ch+10});
  }
  const title=await text('Pixelkovia · 5.–10. november 2026',26,C.navy);
  layers.push({input:title.data,left:24,top:26});
  await sharp({create:{width:1176,height:2088,channels:3,background:'#e7e3dc'}}).composite(layers)
    .withIccProfile('srgb').jpeg({quality:92,chromaSubsampling:'4:4:4'}).toFile(path.join(out,'previews/contact-sheet.jpg'));
}
async function main() {
  const manifest=JSON.parse(await fs.readFile(path.join(out,'artwork.json'),'utf8'));
  for(const [file,expected] of Object.entries(manifest.sourceSha256)){
    const actual=createHash('sha256').update(await fs.readFile(source(file))).digest('hex');
    if(actual!==expected)throw Error('Original source changed: '+file);
  }
  await fs.mkdir(path.join(out,'previews'),{recursive:true});
  for(const spec of specs)await render(spec);
  await previews();
  await fs.writeFile(path.join(out,'layout.json'),JSON.stringify({canvas:{width:W,height:H,profile:'sRGB',opaque:true},textSafeMargins:{horizontal:margin,vertical:60},posts:layouts},null,2)+'\n');
  for(const spec of specs){
    const m=await sharp(path.join(out,spec.file)).metadata();
    if(m.width!==W||m.height!==H||m.hasAlpha||m.format!=='png'||!m.icc)throw Error('Invalid final export: '+spec.file);
  }
  console.log('Verified 11 opaque sRGB PNGs, 1080 × 1350; text bounds and source hashes passed. No publication.');
}
main().catch(error=>{console.error(error);process.exitCode=1});
