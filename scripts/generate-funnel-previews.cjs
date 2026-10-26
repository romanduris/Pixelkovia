// Run deliberately when public worksheet excerpts need refreshing.
// The authored worksheets remain unchanged; decoded pixels in the crop are lossless.
const fs=require('node:fs');
const sharp=require(process.env.SHARP_MODULE||'sharp');
(async()=>{
 const output='assets/sales/public-previews';fs.mkdirSync(output,{recursive:true});
 for(const[source,name]of [['assets/miky-sheet-preview.webp','signals'],['assets/printables/p2-preview.webp','decoder'],['assets/printables/p4-preview.webp','path']]){
  const {width}=await sharp(source).metadata();
  await sharp(source).extract({left:0,top:0,width,height:Math.floor(width*1.2)}).webp({lossless:true}).toFile(output+'/'+name+'.webp');
 }
 console.log('Three sharp public worksheet crops prepared without reward footers.');
})().catch(error=>{console.error(error);process.exitCode=1});
