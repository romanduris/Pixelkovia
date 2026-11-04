// Draft artwork only. Original illustrations + the sales page's existing fonts.
// Usage: node assets/social/facebook/render-covers.cjs
const fs = require('node:fs/promises');
const path = require('node:path');
const {createHash} = require('node:crypto');
const sharp = require(process.env.SHARP_MODULE || '../../../admin/node_modules/sharp');
const out = __dirname;
const root = path.resolve(out, '../../..');
const W = 1640, H = 720;
const palette = {navy:'#0d1424',paper:'#f6f0e5',mint:'#ace9cf',lavender:'#cab5f4',soft:'#b5c3d4',green:'#233b33'};
const fonts = {
  heading: {family:'Manrope ExtraBold',file:path.join(out,'sources/fonts/Manrope-ExtraBold.ttf')},
  body: {family:'DM Sans Medium',file:path.join(out,'sources/fonts/DM-Sans-Medium.ttf')}
};
const variants = ['A','B','C'];
const textBounds = {A:[],B:[],C:[]};
const cPhotoBounds = [];
const escape = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const svg = markup => Buffer.from(markup);
const fullSvg = content => svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${content}</svg>`);
const canvas = color => sharp({create:{width:W,height:H,channels:3,background:color}});
const source = name => path.join(root,name);

async function text(str, size, color, kind = 'heading') {
  const font = fonts[kind];
  return sharp({text:{text:`<span foreground="${color}">${escape(str)}</span>`,font:`${font.family} ${size}`,fontfile:font.file,rgba:true,dpi:72}})
    .png().toBuffer({resolveWithObject:true});
}
async function addText(layers, variant, str, x, y, size, color, kind = 'heading') {
  const rendered = await text(str,size,color,kind);
  layers.push({input:rendered.data,left:x,top:y});
  textBounds[variant].push({text:str,x,y,width:rendered.info.width,height:rendered.info.height,font:fonts[kind].family,size,color});
}
async function save(variant, layers, background = palette.navy) {
  await canvas(background).composite(layers).withIccProfile('srgb')
    .png({compressionLevel:9,adaptiveFiltering:true}).toFile(path.join(out,`cover-${variant}.png`));
}
async function rounded(input, width, height, radius) {
  return sharp(input).ensureAlpha().composite([{input:svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="white"/></svg>`),blend:'dest-in'}]).png().toBuffer();
}

async function coverA() {
  // The left-hand portion of the approved room contains no characters.
  const room = await sharp(source('assets/pixelkovia-room-desktop.webp'))
    .extract({left:0,top:0,width:700,height:900}).resize(1000,720,{fit:'cover',position:'centre'}).png().toBuffer();
  const layers = [{input:room,left:640,top:0}];
  layers.push({input:fullSvg(`<defs><linearGradient id="shade"><stop offset="0" stop-color="${palette.navy}"/><stop offset=".43" stop-color="${palette.navy}"/><stop offset=".64" stop-color="${palette.navy}" stop-opacity=".8"/><stop offset=".87" stop-color="${palette.navy}" stop-opacity=".12"/><stop offset="1" stop-color="${palette.navy}" stop-opacity=".25"/></linearGradient></defs><rect width="1640" height="720" fill="url(#shade)"/>`),left:0,top:0});
  // One uniform scale of the approved bust, with no redraw or color treatment.
  const piko = await sharp(source('assets/characters/piko.png'))
    .extract({left:180,top:30,width:900,height:1000}).resize(540,600).png().toBuffer();
  layers.push({input:piko,left:920,top:70});
  await addText(layers,'A','PIXELKOVIA · STRATENÝ SIGNÁL',230,126,24,palette.mint,'body');
  await addText(layers,'A','VÁŠ DOMOV.',228,198,76,palette.paper);
  await addText(layers,'A','ICH DOBRODRUŽSTVO.',228,300,62,palette.mint);
  await addText(layers,'A','Interaktívna rodinná hra plná záhad',230,410,30,palette.paper,'body');
  await save('A',layers);
}

async function coverB() {
  // Integer translation only. All seven original characters remain together.
  const room = await sharp(source('assets/pixelkovia-room-desktop.webp'))
    .extract({left:70,top:170,width:1530,height:720}).png().toBuffer();
  const layers = [{input:room,left:0,top:0}];
  layers.push({input:fullSvg(`<defs><linearGradient id="left" x1="0" x2="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${palette.navy}" stop-opacity=".98"/><stop offset=".6" stop-color="${palette.navy}" stop-opacity=".94"/><stop offset="1" stop-color="${palette.navy}" stop-opacity="0"/></linearGradient><linearGradient id="right" x1="1480" x2="1530" gradientUnits="userSpaceOnUse"><stop stop-color="${palette.navy}" stop-opacity="0"/><stop offset="1" stop-color="${palette.navy}"/></linearGradient></defs><rect width="620" height="720" fill="url(#left)"/><rect x="1480" width="50" height="720" fill="url(#right)"/>`),left:0,top:0});
  await addText(layers,'B','PIXELKOVIA · STRATENÝ SIGNÁL',230,86,22,palette.mint,'body');
  await addText(layers,'B','OBJAVTE',228,160,64,palette.paper);
  await addText(layers,'B','TAJNÝ SVET',228,239,64,palette.lavender);
  await addText(layers,'B','PIXELKOV',228,334,64,palette.paper);
  await addText(layers,'B','Dobrodružstvo sa začína',230,434,30,palette.paper,'body');
  await addText(layers,'B','u vás doma.',230,477,30,palette.paper,'body');
  await save('B',layers);
}

async function coverC() {
  const layers = [];
  const photos = [
    {file:'assets/sales/family-opening-mobile.webp',crop:{left:0,top:200,width:1200,height:1000},x:270},
    {file:'assets/sales/family-code-mobile.webp',crop:{left:0,top:420,width:700,height:582},x:645},
    {file:'assets/sales/family-code-mobile.webp',crop:{left:650,top:420,width:550,height:458},x:1020}
  ];
  for (const photo of photos) {
    const image = await sharp(source(photo.file)).extract(photo.crop).resize(350,270,{fit:'cover'}).png().toBuffer();
    layers.push({input:await rounded(image,350,270,18),left:photo.x,top:395});
    cPhotoBounds.push({source:photo.file,x:photo.x,y:395,width:350,height:270});
  }
  await addText(layers,'C','PIXELKOVIA · STRATENÝ SIGNÁL',302,88,22,palette.green,'body');
  await addText(layers,'C','DOBRODRUŽSTVO',300,142,72,palette.navy);
  await addText(layers,'C','U VÁS DOMA',300,232,72,palette.green);
  await addText(layers,'C','7 záhad • 45–60 minút • Pre deti 7–13 rokov',302,332,28,palette.green,'body');
  await save('C',layers,palette.paper);
}

async function mobile(variant) {
  return sharp(path.join(out,`cover-${variant}.png`))
    .extract({left:180,top:0,width:1280,height:720}).resize(640,360).png().toBuffer();
}
async function profileOverlay(input) {
  const diameter = 208;
  const profile = await sharp(path.join(out,'profile-A.png')).resize(diameter-12,diameter-12).png().toBuffer();
  const masked = await sharp(profile).ensureAlpha().composite([{input:svg(`<svg xmlns="http://www.w3.org/2000/svg" width="196" height="196"><circle cx="98" cy="98" r="98" fill="white"/></svg>`),blend:'dest-in'}]).png().toBuffer();
  const border = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="208" height="208"><circle cx="104" cy="104" r="104" fill="#fff"/></svg>`);
  return sharp({create:{width:640,height:464,channels:3,background:'#ffffff'}})
    .composite([{input,left:0,top:0},{input:border,left:216,top:256},{input:masked,left:222,top:262}]).png().toBuffer();
}

async function comparison(kind, width, height, makePreview, subtitle) {
  const boardWidth = width+80, rowHeight = height+58, boardHeight = 112+3*rowHeight+20;
  const layers = [];
  const title = await text('Pixelkovia · porovnanie titulných obrázkov',23,palette.navy);
  const sub = await text(subtitle,14,'#586274','body');
  layers.push({input:title.data,left:40,top:26},{input:sub.data,left:40,top:66});
  for (let i=0;i<variants.length;i++) {
    const label = await text({A:'A · Hlavná predajná verzia',B:'B · Tajný svet Pixelkov',C:'C · Skutočný zážitok z hry'}[variants[i]],17,palette.navy);
    const y = 112+i*rowHeight;
    layers.push({input:label.data,left:40,top:y},{input:await makePreview(variants[i]),left:40,top:y+30});
  }
  await sharp({create:{width:boardWidth,height:boardHeight,channels:3,background:palette.paper}})
    .composite(layers).withIccProfile('srgb').png({compressionLevel:9,adaptiveFiltering:true})
    .toFile(path.join(out,`cover-previews-${kind}.png`));
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(path.join(out,'covers-artwork.json'),'utf8'));
  for (const [file, expected] of Object.entries(manifest.sourceSha256)) {
    const actual = createHash('sha256').update(await fs.readFile(source(file))).digest('hex');
    if (actual !== expected) throw Error(`Original source changed: ${file}`);
  }
  await coverA(); await coverB(); await coverC();
  await comparison('desktop',820,312,variant => sharp(path.join(out,`cover-${variant}.png`)).extract({left:0,top:48,width:1640,height:624}).resize(820,312).png().toBuffer(),'Desktop · 820 × 312 px · stredový vertikálny výrez');
  await comparison('mobile',640,360,mobile,'Mobil · 640 × 360 px · stredový horizontálny výrez');
  await comparison('mobile-profile',640,464,async variant => profileOverlay(await mobile(variant)),'Mobil · modelové prekrytie návrhom profilovej fotografie A');
  await fs.writeFile(path.join(out,'cover-layout.json'),JSON.stringify({canvas:{width:W,height:H},safeArea:{x:180,y:48,width:1280,height:624},variantSafeAreas:{C:{x:260,y:48,width:1120,height:624}},textBounds,photoBounds:{C:cPhotoBounds},avatar:{preview:'profile-A.png',mobileBounds:{x:216,y:256,width:208,height:208},sourceEquivalent:{cx:820,cy:720,r:208}},cropSimulationOnly:true},null,2)+'\n');
  console.log('Saved cover-A/B/C.png (1640 × 720), three comparison sheets and measured text bounds. No deployment.');
}
main().catch(error => {console.error(error); process.exitCode=1;});
