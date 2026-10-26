// Real paged output: a hidden extra footer page is a failure, even if all content exists.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080';
const footers=['ŤAHÁK PRE RODIČA','ZÁCHRANNÝ SIGNÁL','Úloha 2 / Indícia pri okne','Úloha 3 / Indícia pod stoličkou','Úloha 4 / Indícia pri topánkach','Úloha 5 / Indícia v posteli','Úloha 6 / Indícia v chladničke','TAJOMSTVO NÁVRATOVEJ BRÁNY','DIPLOM ZÁCHRANCOV PIXELKOV'];
function pages(file){
 const r=spawnSync('python3',['-c','import json,sys;from pypdf import PdfReader;print(json.dumps([p.extract_text() for p in PdfReader(sys.argv[1]).pages]))',file],{encoding:'utf8'});
 if(r.status!==0)throw new Error(r.stderr);return JSON.parse(r.stdout);
}
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'pixelkovia-pagination-'));
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:850,height:1200}});
  for(const format of ['A4','Letter'])for(const displayHeaderFooter of [false,true]){
   await page.goto(BASE+'/printables.html');await page.evaluate(()=>document.fonts.ready);
   // Model the paper selected in the print dialog, rather than always trusting CSS A4.
   await page.addStyleTag({content:`@page{size:${format};margin:12mm}`});
   const file=path.join(dir,`${format}-${displayHeaderFooter}.pdf`);
   await page.pdf({path:file,format,preferCSSPageSize:true,printBackground:true,displayHeaderFooter});
   const text=pages(file);assert.equal(text.length,9,`${format}: one page per sheet, no blank or detached-footer pages`);
   for(const [i,footer] of footers.entries())assert.ok(text[i].includes(footer),`${format}: footer ${footer} stays with its sheet`);
   assert.ok(!/\bP[1-7]\b/.test(text.join(' ')), 'printed pages use the unified task labels');
   assert.ok(text[2].includes('KODGDM'),'P2 cipher remains on the same page as its footer');
  }
  for(const format of ['A4','Letter']){
   await page.goto(BASE+'/printables.html?sheet=p2');
   await page.addStyleTag({content:`@page{size:${format};margin:12mm}`});
   const file=path.join(dir,`${format}-p2.pdf`);
   await page.pdf({path:file,format,preferCSSPageSize:true,printBackground:true});
   const text=pages(file);assert.equal(text.length,1,`${format}: standalone P2 fits one page`);
   assert.ok(text[0].includes('KODGDM')&&text[0].includes(footers[2]));
  }
  const response=await page.request.get(BASE+'/assets/printables/vsetky-materialy.pdf');
  assert.equal(response.status(),200);
  const download=path.join(dir,'downloaded-bundle.pdf');await fs.writeFile(download,await response.body());
  const downloaded=pages(download);assert.equal(downloaded.length,9,'downloaded A4 bundle still has nine complete pages');
  for(const [i,footer] of footers.entries())assert.ok(downloaded[i].includes(footer),'downloaded footer stays on the correct page');
  console.log('PASS: nine complete pages on A4 and Letter, with/without browser headers; every footer stays with its worksheet; isolated P2 fits one page.');
 }finally{await browser.close();await fs.rm(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exit(1)});
