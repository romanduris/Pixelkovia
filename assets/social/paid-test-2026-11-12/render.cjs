/* Cinematic artwork + editable typography. Local export only; never activates ads. */
const fs = require('node:fs/promises');
const path = require('node:path');
const {createHash} = require('node:crypto');
const sharp = require(process.env.SHARP_MODULE || '../../../admin/node_modules/sharp');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out = __dirname, root = path.resolve(out, '../../..');
const C = {navy:'#0b1428', cream:'#fff7ea', mint:'#b4efd6', lilac:'#d3bdff', cyan:'#61e4ff'};
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const input = {
  A:'sources/scene-A-room.webp', B:'sources/scene-B-phone.webp', C:'sources/scene-C-discovery.webp',
  square:'sources/scene-A-square.webp', story:'sources/scene-A-story.webp', landscape:'sources/scene-A-landscape-1_19x1.webp',
  helper:'sources/pixi-lettering.png', actual:'../../../assets/sales/game-lock-partial.webp'
};
let data = {}, fonts = '';
const manifest = {
  version:3, updated:'2026-11-13', status:'prepared-for-owner-review', socialPublication:false, adActivation:false,
  selectedConcept:'A', mode:'built-in image_gen', promptFile:'PROMPTS.json', formatPromptFile:'FORMAT-PROMPTS.json',
  provenance:'A/B/C are generated advertising illustrations, including the people, rooms and scene phones. They are not documentary customer photographs. The additional product Story alone includes the unchanged approved real game excerpt, labelled explicitly. Typography stays editable in SVG.',
  safety:'Generated paper has no original task, QR or answer. Only the deliberately approved game-lock-partial.webp is reused as a real screen. Original unredacted photographs are not embedded.',
  sources:[], exports:[]
};
async function init() {
  for (const dir of ['editable','previews']) await fs.mkdir(path.join(out,dir),{recursive:true});
  for (const [key,file] of Object.entries(input)) {
    const bytes = await fs.readFile(path.resolve(out,file));
    data[key] = `data:image/${file.endsWith('.png')?'png':'webp'};base64,${bytes.toString('base64')}`;
    manifest.sources.push({key,file,sha256:hash(bytes),bytes:bytes.length});
  }
  for (const [family,file,weight] of [
    ['Manrope','assets/social/facebook/sources/fonts/Manrope-ExtraBold.ttf',800],
    ['DM Sans','assets/social/facebook/sources/fonts/DM-Sans-Medium.ttf',500],
    ['Caveat','assets/fonts/Caveat.ttf',400]
  ]) {
    const bytes = await fs.readFile(path.join(root,file));
    fonts += `@font-face{font-family:'${family}';src:url(data:font/ttf;base64,${bytes.toString('base64')}) format('truetype');font-weight:${weight}}`;
  }
}
const rect = (x,y,w,h,fill,rx=0,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const text = (value,x,y,size,{fill=C.cream,family='Manrope',anchor='start',spacing=0,type='copy',max=952}={}) =>
  `<text data-qa="${type}" data-max="${max}" x="${x}" y="${y}" font-family="${family}" font-weight="${family==='Manrope'?800:family==='DM Sans'?500:400}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${spacing}">${esc(value)}</text>`;
const image = (key,x,y,w,h,extra='') => `<image data-source="${key}" href="${data[key]}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" ${extra}/>`;
const stroke = (d,color,width=3,extra='') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
function brand(y) {
  return `<g fill="${C.mint}">${[[64,y-28],[81,y-28],[64,y-11],[81,y-11]].map(([x,y])=>rect(x,y,11,11,C.mint,2)).join('')}</g>` +
    text('Pixelkovia',110,y,37,{type:'brand',max:400}) +
    text('STRATENÝ SIGNÁL',1016,y-3,22,{family:'DM Sans',fill:C.mint,anchor:'end',spacing:1.5,type:'brand',max:420});
}
function headline(design,offset=0,helper=true) {
  let b = '';
  if (design==='A') {
    b += text('Dnes má vaša',64,223+offset,83,{type:'headline'});
    b += text('obývačka',64,321+offset,95,{type:'headline'});
    b += text('tajomstvo.',65,425+offset,130,{family:'Caveat',fill:C.lilac,type:'headline',max:720});
    if (helper) b += image('helper',390,240+offset,390,260);
  } else if (design==='B') {
    b += text('Jeden mobil.',64,235+offset,91,{type:'headline'});
    b += text('Všetci v hre.',64,343+offset,93,{type:'headline'});
    b += text('Spolu až do finále.',66,438+offset,88,{family:'Caveat',fill:C.lilac,type:'headline'});
  } else {
    b += text('Čo ukrýva',64,238+offset,97,{type:'headline'});
    b += text('vaša obývačka?',64,355+offset,112,{family:'Caveat',fill:C.lilac,type:'headline'});
  }
  return b;
}
function facts(y) {
  return text('7 záhad',64,y,33,{fill:C.mint,type:'fact',max:230}) +
    text('7–13 rokov',420,y,33,{fill:C.cream,type:'fact',max:320}) +
    text('60–90 min',1016,y,33,{fill:C.cream,type:'fact',anchor:'end',max:300}) +
    stroke(`M330 ${y-26}v32M748 ${y-26}v32`,'#6c8294',1);
}
function cta(y,label='Odhaľte hru',center=false) {
  return rect(64,y,952,86,C.mint,16) + text(label,center?540:103,y+56,34,{fill:C.navy,max:800,type:'cta',anchor:center?'middle':'start'}) +
    stroke(`M930 ${y+43}h40m-14-14 14 14-14 14`,C.navy,3);
}
function defs(H) {
  return `<defs>
    <linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${C.navy}" stop-opacity=".88"/><stop offset=".55" stop-color="${C.navy}" stop-opacity=".5"/><stop offset="1" stop-color="${C.navy}" stop-opacity="0"/></linearGradient>
    <linearGradient id="bottom" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${C.navy}" stop-opacity="0"/><stop offset=".40" stop-color="${C.navy}" stop-opacity=".65"/><stop offset=".72" stop-color="${C.navy}" stop-opacity=".97"/><stop offset="1" stop-color="${C.navy}"/></linearGradient>
    <filter id="shadow" x="-60%" y="-40%" width="220%" height="200%"><feDropShadow dx="0" dy="20" stdDeviation="21" flood-color="#000" flood-opacity=".65"/></filter>
    <clipPath id="screen"><rect x="114" y="704" width="322" height="509" rx="13"/></clipPath>
  </defs>`;
}
function template(design,story=false,proof=false) {
  const H=story?1920:1350, offset=story?200:0;
  let b=rect(0,0,1080,H,C.navy);
  b += image(proof?'A':design,0,story?200:0,1080,1350);
  b += rect(0,0,1080,story?790:550,'url(#top)');
  b += rect(0,story?1270:1000,1080,story?650:350,'url(#bottom)');
  b += brand(story?288:88);
  b += text('RODINNÁ HRA NA DOMA',64,story?348:148,25,{family:'DM Sans',fill:C.mint,spacing:1.7,type:'category'});
  if (proof) {
    b += text('Pozrite, čo',64,425,88,{type:'headline'});
    b += text('hráte spolu.',64,532,116,{family:'Caveat',fill:C.lilac,type:'headline'});
    // A separate code-native device presents the exact approved screenshot.
    // It does not replace, retouch or pretend to be a photographed screen.
    b += `<g transform="rotate(-8 275 960)">`;
    b += rect(94,650,362,610,'#070d1b',42,'stroke="#8498ab" stroke-width="3" filter="url(#shadow)"');
    b += rect(109,665,332,580,'#10192d',29);
    b += rect(237,677,78,9,'#060b15',5);
    b += image('actual',114,704,322,509,'clip-path="url(#screen)"');
    b += rect(234,1227,82,5,'#60758b',3)+'</g>';
    b += text('Skutočný záber',520,722,51,{family:'Caveat',fill:C.mint,max:475});
    b += text('z hry',554,778,55,{family:'Caveat',fill:C.mint,max:400});
    b += stroke('M547 802Q453 823 426 868m0-20v20h21',C.mint,3);
    b += text('Ťukáte. Hľadáte.',520,1342,32,{max:496});
    b += text('Prídete na to spolu.',520,1387,32,{max:496});
  } else b += headline(design,offset);
  if (story) {
    b += facts(1469);
    b += cta(1523,proof?'Pozrite sa, ako sa hrá':'Odhaľte hru',true);
    b += text('pixelkovia.rodulab.com',540,1664,30,{family:'DM Sans',fill:C.mint,anchor:'middle',type:'url'});
    b += `<rect id="native-link-sticker-area" x="250" y="1517" width="580" height="104" fill="none"/>`;
  } else {
    b += text(design==='C'?'Hľadajte stopy. Zažite spoločné „máme to!“':'Papierové indície. Príbeh v mobile. Jeden tím.',64,1090,30,{family:'DM Sans',max:952});
    b += facts(1151);
    b += cta(1190,design==='C'?'Prijmite rodinnú misiu':'Odhaľte hru');
    b += text('pixelkovia.rodulab.com',540,1321,29,{family:'DM Sans',fill:C.mint,anchor:'middle',type:'url'});
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${H}" viewBox="0 0 1080 ${H}"><title>Pixelkovia · ${proof?'skutočný záber z hry':design==='A'?'tajomstvo v obývačke':design==='B'?'jeden mobil, celý tím':'spoločné pátranie'}</title><desc>Generovaná reklamná ilustrácia. Ľudia ani byt nie sú zákaznícka fotografia.${proof?' Samostatný telefón obsahuje nezmenenú schválenú ukážku skutočnej hry.':''} Editovateľná typografia.</desc><style>${fonts}text{font-synthesis:none}</style>${defs(H)}${b}</svg>`;
}
const formats={square:{width:1080,height:1080,ratio:'1:1'},story:{width:1080,height:1920,ratio:'9:16'},landscape:{width:1190,height:1000,ratio:'1.19:1'}};
function campaignTemplate(format) {
  const {width:W,height:H,ratio}=formats[format],story=format==='story',wide=format==='landscape';
  const margin=story?64:48,top=story?252:74,headline=story?[409,512,630]:wide?[211,305,407]:[196,283,373];
  const size=story?[86,99,132]:wide?[70,83,112]:[72,84,112];
  const category=story?312:123,factsY=story?1470:wide?834:892,ctaY=story?1523:wide?875:936,ctaH=story?86:74;
  let b=`<image data-source="${format}" href="${data[format]}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>`;
  b+=rect(0,0,W,story?760:wide?520:470,'url(#campaign-top)');
  // Translucent shading preserves the new room, including the very top/bottom.
  // Each format uses its own generated full-canvas scene; there are no padding panels.
  b+=rect(0,story?1350:wide?740:792,W,story?570:wide?260:288,'url(#campaign-bottom)');
  if(wide)b+=rect(0,100,610,650,'url(#campaign-left)');
  b+=`<g fill="${C.mint}">${[[margin,top-25],[margin+15,top-25],[margin,top-10],[margin+15,top-10]].map(([x,y])=>rect(x,y,10,10,C.mint,2)).join('')}</g>`;
  b+=text('Pixelkovia',margin+40,top,34,{type:'brand',max:380});
  b+=text('STRATENÝ SIGNÁL',W-margin,top-2,20,{family:'DM Sans',fill:C.mint,anchor:'end',spacing:1.5,type:'brand',max:370});
  b+=text('RODINNÁ HRA NA DOMA',margin,category,story?25:21,{family:'DM Sans',fill:C.mint,spacing:1.5,type:'category',max:700});
  b+=text('Dnes má vaša',margin,headline[0],size[0],{type:'headline',max:700});
  b+=text('obývačka',margin,headline[1],size[1],{type:'headline',max:700});
  b+=text('tajomstvo.',margin+1,headline[2],size[2],{family:'Caveat',fill:C.lilac,type:'headline',max:670});
  b+=story?image('helper',460,430,390,260):wide?image('helper',327,272,300,200):image('helper',392,215,300,200);
  if(wide){
    b+=text('Papierové indície.',margin,630,28,{family:'DM Sans',max:540});
    b+=text('Príbeh v mobile. Jeden tím.',margin,674,27,{family:'DM Sans',max:540});
  }else b+=text('Papierové indície. Príbeh v mobile. Jeden tím.',margin,story?1398:840,story?30:25,{family:'DM Sans',max:W-2*margin});
  b+=text('7 záhad',margin,factsY,story?33:30,{fill:C.mint,type:'fact',max:230});
  b+=text('7–13 rokov',W/2,factsY,story?33:30,{anchor:'middle',type:'fact',max:300});
  b+=text('60–90 min',W-margin,factsY,story?33:30,{anchor:'end',type:'fact',max:280});
  const gap=(W-2*margin)/3;
  b+=stroke(`M${margin+gap-12} ${factsY-25}v30M${margin+2*gap+12} ${factsY-25}v30`,'#8a9baa',1);
  b+=rect(margin,ctaY,W-2*margin,ctaH,C.mint,16);
  b+=text('Odhaľte hru',margin+34,ctaY+ctaH/2+12,story?34:32,{fill:C.navy,type:'cta',max:W-2*margin-150});
  b+=stroke(`M${W-margin-85} ${ctaY+ctaH/2}h40m-14-14 14 14-14 14`,C.navy,3);
  b+=text('pixelkovia.rodulab.com',W/2,story?1664:wide?975:1050,story?30:26,{family:'DM Sans',fill:C.mint,anchor:'middle',type:'url',max:W-2*margin});
  if(story)b+='<rect id="native-link-sticker-area" x="250" y="1517" width="580" height="104" fill="none"/>';
  const gradients=`<defs><linearGradient id="campaign-top" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${C.navy}" stop-opacity=".56"/><stop offset=".72" stop-color="${C.navy}" stop-opacity=".16"/><stop offset="1" stop-color="${C.navy}" stop-opacity="0"/></linearGradient><linearGradient id="campaign-bottom" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${C.navy}" stop-opacity="0"/><stop offset=".4" stop-color="${C.navy}" stop-opacity=".64"/><stop offset="1" stop-color="${C.navy}" stop-opacity=".72"/></linearGradient><linearGradient id="campaign-left" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${C.navy}" stop-opacity=".38"/><stop offset="1" stop-color="${C.navy}" stop-opacity="0"/></linearGradient></defs>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><title>Pixelkovia · Dnes má vaša obývačka tajomstvo. · ${ratio}</title><desc>Samostatne generovaná reklamná scéna navrhnutá pre ${ratio}, bez doplnených okrajov. Ľudia ani byt nie sú zákaznícka fotografia. Editovateľná typografia.</desc><style>${fonts}text{font-synthesis:none}</style>${gradients}${b}</svg>`;
}
async function render(page,name,design,story=false,proof=false,format=null) {
  const {width:W,height:H}=format?formats[format]:{width:1080,height:story?1920:1350};
  const svg=format?campaignTemplate(format):template(design,story,proof);
  await page.setViewportSize({width:W,height:H});
  await page.setContent('<!doctype html><html lang="sk"><head><meta charset="utf-8"><style>html,body{margin:0}svg{display:block}</style></head><body>'+svg+'</body></html>');
  await page.evaluate(async()=>{await document.fonts.ready; await Promise.all([...document.images].map(i=>i.decode()));});
  const layout=await page.locator('text[data-qa]').evaluateAll(els=>els.map(el=>{const b=el.getBBox();return {text:el.textContent,x:b.x,y:b.y,width:b.width,height:b.height,size:Number(el.getAttribute('font-size')),max:Number(el.dataset.max),type:el.dataset.qa};}));
  for(const box of layout) {
    const edge=format?(story?52:36):52;
    if(box.width>box.max+1 || box.x<edge || box.x+box.width>W-edge || box.y<(story?210:format?36:48) || box.y+box.height>H-(story?245:format?12:18)) throw Error(name+': unsafe typography '+JSON.stringify(box));
    if(box.type==='headline' && box.size<(format?68:80)) throw Error('Headline too small');
  }
  const bytes=await page.screenshot({type:'png'});
  const description=proof?'AI-generated advertising room and family with the unchanged approved real game screen in a separate product mockup.':'AI-generated advertising illustration including people, room and phones, with editable typography; not a documentary customer photograph.';
  const xmp=`<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:description><rdf:Alt><rdf:li xml:lang="x-default">${esc(description)}</rdf:li></rdf:Alt></dc:description></rdf:Description></rdf:RDF></x:xmpmeta>`;
  const filename=path.join(out,name+'.png');
  await sharp(bytes).flatten({background:C.navy}).withIccProfile('srgb').withXmp(xmp).png({compressionLevel:9}).toFile(filename);
  await fs.writeFile(path.join(out,'editable',name+'.svg'),svg);
  await fs.writeFile(path.join(out,'editable',name+'.layout.json'),JSON.stringify(layout,null,2)+'\n');
  await sharp(filename).resize({width:360}).png().toFile(path.join(out,'previews',name+'-360.png'));
  const exported=await fs.readFile(filename),meta=await sharp(exported).metadata();
  if(meta.width!==W || meta.height!==H || meta.hasAlpha || meta.space!=='srgb') throw Error('Invalid PNG');
  manifest.exports.push({file:name+'.png',width:W,height:H,bytes:exported.length,sha256:hash(exported),design,actualGameplay:proof,...format?{ratio:formats[format].ratio,sceneSource:input[format],nativeComposition:true}:{},headlines:layout.filter(b=>b.type==='headline').map(b=>b.text),linkSticker:story?{x:250,y:1517,width:580,height:104,placement:'Replace the printed CTA with a native link sticker in the social editor; set ad destination in Ads Manager.'}:null});
  console.log(name+'.png · '+W+' × '+H+' · '+Math.round(exported.length/1024)+' KB');
}
async function board(page) {
  const items=[];
  for(const [key,label,sub] of [['A','Tajomstvo v obývačke','Hlavný emocionálny motív'],['B','Jeden mobil. Celý tím.','Detail spoločného hrania'],['C','Pátranie po indícii','Zážitok, ktorý sa odohrá doma']]) {
    const bytes=await fs.readFile(path.join(out,`pixelkovia_ad_concept_${key}_feed_4x5.png`));
    items.push(`<div><img src="data:image/png;base64,${bytes.toString('base64')}"><h2>${key} · ${label}</h2><p>${sub}</p></div>`);
  }
  await page.setViewportSize({width:1440,height:840});
  await page.setContent(`<!doctype html><html lang="sk"><head><meta charset="utf-8"><style>${fonts}*{box-sizing:border-box}body{margin:0;padding:36px 42px;background:${C.navy};color:${C.cream};font:18px 'DM Sans'}h1{font:800 30px Manrope;margin:0 0 10px}header p{color:${C.mint};margin:0 0 28px}section{display:flex;gap:30px}section>div{width:432px}img{width:432px;height:540px;display:block;border-radius:8px}h2{font:800 21px Manrope;margin:18px 0 6px}p{margin:0;color:#acbdcc}</style></head><body><header><h1>Dnes má vaša obývačka tajomstvo.</h1><p>Pixelkovia · nová reklamná séria · generované ilustračné scény, editovateľné texty</p></header><section>${items.join('')}</section></body></html>`);
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  await page.screenshot({path:path.join(out,'pixelkovia_ad_concepts_overview.png')});
}
async function reviewPage() {
  const entries=[...manifest.exports.filter(e=>e.nativeComposition),...manifest.exports.filter(e=>!e.nativeComposition)];
  const html=`<!doctype html><html lang="sk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pixelkovia · reklamné vizuály</title><style>body{margin:0;background:#0b1428;color:#fff7ea;font:16px/1.55 system-ui}main{max-width:1440px;margin:auto;padding:32px 24px}h1{font-size:clamp(28px,4vw,44px);line-height:1.15}p{color:#bdcfdb}a{color:#b4efd6}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:24px}figure{margin:0;background:#101f34;padding:12px;border-radius:12px}img{display:block;width:100%;height:auto;border-radius:6px}figcaption{padding:12px 4px 6px}small{display:block;color:#bdcfdb}nav{display:flex;gap:24px;flex-wrap:wrap;margin:24px 0}</style></head><body><main><h1>Dnes má vaša obývačka tajomstvo.</h1><p>Nové finálne formáty 1:1, 9:16 a 1,19:1 majú vlastné generované scény a sadzbu. Pôvodné koncepty zostávajú nižšie. Všetky scény s rodinou sú generované reklamné ilustrácie. Produktová Story navyše ukazuje nezmenený schválený záber skutočnej hry.</p><nav><a href="README.md">Popis a texty</a><a href="FORMAT-PROMPTS.json">Nové formátové prompty</a><a href="PROMPTS.json">Pôvodné prompty</a><a href="https://pixelkovia.rodulab.com/">Otvoriť Pixelkov</a></nav><div class="grid">${entries.map(e=>`<figure><a href="${e.file}"><img src="previews/${e.file.replace('.png','-360.png')}" alt="${esc(e.headlines.join(' '))}" loading="lazy"></a><figcaption>${esc(e.headlines.join(' '))}<small>${e.width} × ${e.height} · <a href="${e.file}" download>Stiahnuť PNG</a> · <a href="editable/${e.file.replace('.png','.svg')}">Editovateľné SVG</a></small></figcaption></figure>`).join('')}</div><p>Pripravené na kontrolu vlastníkom. Reklamy ani príspevky neboli spustené alebo publikované.</p></main></body></html>`;
  await fs.writeFile(path.join(out,'OTVORIT-NAHLAD.html'),html);
}
async function main() {
  await init();
  const browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
    for(const design of ['A','B','C']) await render(page,`pixelkovia_ad_concept_${design}_feed_4x5`,design);
    await render(page,'pixelkovia_ad_final_square_1x1','A',false,false,'square');
    await render(page,'pixelkovia_ad_final_story_9x16','A',true,false,'story');
    await render(page,'pixelkovia_ad_final_landscape_1_19x1','A',false,false,'landscape');
    await render(page,'pixelkovia_ad_game_story_9x16','A',true,true);
    await board(page);
  } finally {await browser.close();}
  await fs.writeFile(path.join(out,'artwork.json'),JSON.stringify(manifest,null,2)+'\n');
  await reviewPage();
}
main().catch(error=>{console.error(error);process.exitCode=1;});
