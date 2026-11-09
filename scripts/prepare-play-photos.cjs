// Deterministic edits of supplied photographs: crop, light and redact spoilers.
// Originals stay in assets/Photo and never enter the deployment artifact.
const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require(process.env.SHARP_MODULE||'sharp');
const root=path.resolve(__dirname,'..');
const photos=[
 {name:'play-phone',source:'20261108_193537.jpg',crop:{left:270,top:210,width:390,height:487.5},brightness:1.08},
 {name:'play-paper',source:'20261108_190754.jpg',crop:{left:0,top:310,width:900,height:1125},brightness:1.10},
 {name:'play-team',source:'20261108_193034.jpg',crop:{left:50,top:0,width:580,height:725},brightness:1.13},
 {name:'play-story',source:'20261108_195955.jpg',crop:{left:0,top:0,width:580,height:725},brightness:1.12},
 {name:'prepare-portal',source:'20261107_100223 1.jpg',crop:{left:235,top:125,width:640,height:480},brightness:1.08,
  paperBelow:270,phone:[[609,168],[880,317],[494,862],[217,704]]}
];
(async()=>{
 const directory=path.join(root,'assets/sales/real-play');await fs.mkdir(directory,{recursive:true});
 for(const photo of photos){
  const {data,info}=await sharp(path.join(root,'assets/Photo',photo.source)).rotate().toBuffer({resolveWithObject:true});
  const unit=info.width/900,crop=Object.fromEntries(Object.entries(photo.crop).map(([k,v])=>[k,Math.round(v*unit)]));
  const width=1200,height=photo.name==='prepare-portal'?900:1500;
  let edited=await sharp(data).extract(crop).resize(width,height,{fit:'fill'}).modulate({brightness:photo.brightness,saturation:1.02}).toBuffer();
  if(photo.redact||photo.paperBelow){
   const scale=width/photo.crop.width;
   const polygon=points=>points.map(p=>p.join(',')).join(' ');
   const region=photo.paperBelow?`<defs><mask id="paper"><rect x="0" y="${photo.paperBelow}" width="900" height="900" fill="white"/><polygon points="${polygon(photo.phone)}" fill="black"/></mask></defs><rect width="900" height="900" fill="white" mask="url(#paper)"/>`:photo.redact.map(points=>`<polygon points="${polygon(points)}" fill="white"/>`).join('');
   const mask=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter></defs><g transform="translate(${-photo.crop.left*scale},${-photo.crop.top*scale}) scale(${scale})" filter="url(#soft)">${region}</g></svg>`);
   const obscured=await sharp(edited).blur(28).composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
   edited=await sharp(edited).composite([{input:obscured}]).toBuffer();
  }
  for(const [suffix,w] of [['',1200],['-medium',960],['-small',640]]){
   await sharp(edited).resize({width:w}).webp({quality:86,effort:6}).toFile(path.join(directory,photo.name+suffix+'.webp'));
  }
  console.log(photo.name+': three cropped WebP sizes, no EXIF or original image embedded.');
 }
})();
