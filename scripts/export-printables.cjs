// Optional authoring helper. Install Playwright outside the repository and set
// PLAYWRIGHT_MODULE; root HTML/CSS and print-materials.js are the source of truth for all PDFs.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const root=path.resolve(__dirname,'..');
 await fs.mkdir(path.join(root,'assets/printables'),{recursive:true});
 const allIds=['p1','p2','p3','p4','p5','p6','diplom','rodicovsky-navod'];
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
   const pdf=await page.pdf({path:path.join(root,'assets/printables',id+'.pdf'),format:'A4',printBackground:true});
   const count=(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;
   if(count!==1)throw new Error(`${id}: expected one A4 page, got ${count}`);
   if(/^p[1-6]$/.test(id))await page.locator('#'+id).screenshot({path:path.join(root,id==='p1'?'assets/kvak-sheet-preview.png':`assets/printables/${id}-preview.png`)});
   console.log(`${id}: exported one A4 page`);
  }
  const result=require('node:child_process').spawnSync('python3',[path.join(root,'scripts/bundle-printables.py')],{stdio:'inherit'});
  if(result.status!==0)throw new Error('Bundle generation failed. Install the authoring dependency pypdf; see README.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
