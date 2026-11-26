/* Real, physically cropped product pixels in generated editorial scenes. */
const fs=require('node:fs/promises'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../../..');
const sharp=require(path.join(root,'admin/node_modules/sharp'));
const {mesh,orient,roundedQuad,paperSurface}=require('../a1-meta-formats-2026-11-26/product-plane.cjs');
const hash=b=>createHash('sha256').update(b).digest('hex');
const uri=(b,mime)=>`data:${mime};base64,${b.toString('base64')}`;
module.exports=async function scene(item){
 const photo=await fs.readFile(path.join(__dirname,'sources',item.source));
 const meta=await sharp(photo).metadata();
 let defs='',body=`<image xlink:href="${uri(await sharp(photo).jpeg({quality:97}).toBuffer(),'image/jpeg')}" width="${meta.width}" height="${meta.height}"/>`;
 const sources={photo:hash(photo)};
 if(item.paperQuad){
  const file='assets/sales/public-previews/decoder.webp',bytes=await fs.readFile(path.join(root,file));
  const png=await sharp(bytes).png().toBuffer(),p=mesh('real-paper',orient(item.paperQuad,item.paperRotation??180),703,597);
  defs+=`<image id="real-paper" xlink:href="${uri(png,'image/png')}" width="703" height="597"/>${p.defs}<mask id="paper-surface" maskUnits="userSpaceOnUse" x="0" y="0" width="${meta.width}" height="${meta.height}"><image xlink:href="${await paperSurface(photo,sharp)}" width="${meta.width}" height="${meta.height}"/></mask>`;
  if(item.visiblePaper)defs+=`<clipPath id="visible-paper"><polygon points="${item.visiblePaper.map(p=>p.join(',')).join(' ')}"/></clipPath>`;
  body+=`<g ${item.visiblePaper?'clip-path="url(#visible-paper)"':''}><g ${item.plainPaper?'':'mask="url(#paper-surface)"'} style="mix-blend-mode:multiply">${p.body}</g></g>`;
  sources.paper={file,sha256:hash(bytes),rotation:item.paperRotation??180,physicallyCropped:true};
 }
 if(item.screenQuad){
  const file='assets/sales/game-lock-partial.webp',bytes=await fs.readFile(path.join(root,file));
  const png=await sharp(bytes).png().toBuffer(),p=mesh('real-screen',orient(item.screenQuad,180),716,1132);
  defs+=`<image id="real-screen" xlink:href="${uri(png,'image/png')}" width="716" height="1132"/>${p.defs}<clipPath id="physical-phone-glass"><path d="${roundedQuad(item.screenQuad,3)}"/></clipPath>`;
  body+=`<g clip-path="url(#physical-phone-glass)" style="mix-blend-mode:screen">${p.body}</g>`;
  sources.screen={file,sha256:hash(bytes),rotation:180};
 }
 return{defs,body,width:meta.width,height:meta.height,sources};
};
