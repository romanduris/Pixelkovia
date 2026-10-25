// Optional authoring helper. Install Playwright outside the repository and set
// PLAYWRIGHT_MODULE; root HTML/CSS and print-materials.js are the source of truth for all PDFs.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL,fileURLToPath}=require('node:url');
(async()=>{
 const root=path.resolve(__dirname,'..');
 await fs.mkdir(path.join(root,'assets/printables'),{recursive:true});
 const allIds=['rodicovsky-navod','p1','p2','p3','p4','p5','p6','p7','diplom'];
 const requestedIds=process.argv.slice(2);
 if(requestedIds.some(id=>!allIds.includes(id)))throw new Error('Unknown worksheet ID');
 const ids=requestedIds.length?requestedIds:allIds;
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:850,height:1200}});
  await page.emulateMedia({media:'print'});
  for(const id of ids){
   await page.goto(pathToFileURL(path.join(root,'printables.html')).href);
   await page.evaluate(selected=>document.querySelectorAll('.sheet').forEach(s=>s.hidden=selected==='diplom'?!s.classList.contains('diploma'):s.id!==selected),id);
   await page.evaluate(()=>document.fonts.ready);
   // Embed artwork at print resolution instead of embedding every full source PNG.
   // Canonical artwork stays unchanged; all text and puzzle geometry remain vector.
   const rasters=await page.evaluate(()=>Array.from(document.querySelectorAll('.sheet:not([hidden]) img,.sheet:not([hidden]) [role="img"],.sheet:not([hidden]) .sheet-avatar')).flatMap((node,index)=>{
    const box=node.getBoundingClientRect(),isImage=node.tagName==='IMG';
    const source=isImage?node.src:getComputedStyle(node).backgroundImage.match(/^url\(["']?(.+?)["']?\)$/)?.[1];
    if(!source||!source.endsWith('.png')||!box.width||!box.height)return [];
    node.dataset.printRaster=String(index);
    return [{index,source,isImage,width:Math.ceil(box.width*300/96),height:Math.ceil(box.height*300/96)}];
   }));
   for(const raster of rasters){
    const data=await fs.readFile(fileURLToPath(raster.source));
    await page.evaluate(async raster=>{
     const image=new Image();image.src=raster.data;await image.decode();
     const scale=Math.min(1,raster.width/image.naturalWidth,raster.height/image.naturalHeight);
     const canvas=document.createElement('canvas');canvas.width=Math.ceil(image.naturalWidth*scale);canvas.height=Math.ceil(image.naturalHeight*scale);
     canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
     const node=document.querySelector(`[data-print-raster="${raster.index}"]`),source=canvas.toDataURL('image/png');
     if(raster.isImage){node.src=source;await node.decode();}else node.style.backgroundImage=`url("${source}")`;
    },{...raster,data:'data:image/png;base64,'+data.toString('base64')});
   }
   const pdf=await page.pdf({path:path.join(root,'assets/printables',id+'.pdf'),format:'A4',printBackground:true});
   const count=(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;
   if(count!==1)throw new Error(`${id}: expected one A4 page, got ${count}`);
   if(/^p[1-7]$/.test(id))await page.locator('#'+id).screenshot({path:path.join(root,id==='p1'?'assets/miky-sheet-preview.png':`assets/printables/${id}-preview.png`)});
   console.log(`${id}: exported one A4 page`);
  }
  const result=require('node:child_process').spawnSync('python3',[path.join(root,'scripts/bundle-printables.py')],{stdio:'inherit'});
  if(result.status!==0)throw new Error('Bundle generation failed. Install the authoring dependency pypdf; see README.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
