const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const jsQR=require(process.env.JSQR_MODULE||'jsqr');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080';
(async()=>{
 for(const engine of [chromium,webkit]){
 const browser=await engine.launch();try{
  const page=await browser.newPage({viewport:{width:850,height:1200}});await page.goto(BASE+'/printables.html');await page.emulateMedia({media:'print'});
  const typography=await page.evaluate(()=>Array.from(document.querySelectorAll('.miky-sheet .quest-story p,.story-sheet .quest-story p,.miky-print-mission li,.worksheet-mission p,.miky-print-controls p,.equation-result p,.maze-phone-panel p,.paper-reward p')).map(n=>({sheet:n.closest('.sheet').id,size:parseFloat(getComputedStyle(n).fontSize),family:getComputedStyle(n).fontFamily})));
  assert.ok(typography.length>30);for(const item of typography){assert.ok(Math.abs(item.size-12)<.1,item.sheet+': equivalent primary text prints at 9pt');assert.match(item.family,/Arial/);}
  for(const id of ['p1','p2','p3','p4','p5','p6','p7']){
   const size=await page.locator('#'+id+' h2').evaluate(n=>parseFloat(getComputedStyle(n).fontSize));assert.ok(Math.abs(size-28)<.1,id+': consistent main heading size');
  }
  for(const selector of ['#p1 .qr-mockup img','#p3 .worksheet-entry-qr img','#p5 .worksheet-entry-qr img','#p6 .worksheet-entry-qr img']){
   const size=await page.locator(selector).evaluate(n=>({w:parseFloat(getComputedStyle(n).width),h:parseFloat(getComputedStyle(n).height)}));
   assert.ok(Math.abs(size.w-32*96/25.4)<.1&&Math.abs(size.h-size.w)<.1,'every printed QR is a 32mm square');
  }
  const captions=await page.locator('#p1 .qr-mockup small,#p3 .worksheet-entry-qr small').evaluateAll(nodes=>nodes.map(n=>parseFloat(getComputedStyle(n).fontSize)));
  for(const size of captions)assert.ok(Math.abs(size-7*96/72)<.1,'equivalent QR captions print at 7pt');
  // Read the actual SVG pixels, including their format bits, rather than checking a generator setting alone.
  for(const [file,key] of [['miky','mikyQr'],['plugy','plugyQr'],['pingy','pingyQr'],['cipko','mazeQr'],['guardy','guardyQr']]){
   const qr=await page.evaluate(async file=>{
    const source=await fetch('assets/'+file+'-qr.svg').then(r=>r.text());
    const svg=new DOMParser().parseFromString(source,'image/svg+xml').documentElement;
    const side=Number(svg.getAttribute('viewBox').split(' ')[2]),scale=6;
    const img=new Image();img.src='assets/'+file+'-qr.svg';await img.decode();
    const canvas=document.createElement('canvas');canvas.width=side*scale;canvas.height=side*scale;
    const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),matrix=side-8;
    const dark=(row,col)=>pixels.data[(Math.floor((row+4.5)*scale)*canvas.width+Math.floor((col+4.5)*scale))*4]<128;
    let formatBits=0;for(let i=0;i<15;i++){const row=i<6?i:i<8?i+1:matrix-15+i;if(dark(row,8))formatBits|=1<<i;}
    const level=((formatBits^0x5412)>>13)&3;
    let quiet=true;for(let i=0;i<side;i++)for(let m=0;m<4;m++)if(dark(m-4,i-4)||dark(side-1-m-4,i-4)||dark(i-4,m-4)||dark(i-4,side-1-m-4))quiet=false;
    const clean=Array.from(pixels.data);
    // Simulate a small dirty/erased patch in the real encoded area, away from finder corners.
    ctx.fillStyle='white';ctx.fillRect(Math.floor(side/2-3)*scale,Math.floor(side/2-3)*scale,7*scale,7*scale);
    return {side:canvas.width,level,quiet,clean,damaged:Array.from(ctx.getImageData(0,0,canvas.width,canvas.height).data)};
   },file);
   assert.equal(qr.level,2,file+': actual QR format bits encode level H');assert.equal(qr.quiet,true,file+': four clear modules on every side');
   const target=await page.evaluate(key=>GAME[key],key);
   for(const variant of ['clean','damaged'])assert.equal(jsQR(new Uint8ClampedArray(qr[variant]),qr.side,qr.side)?.data,target,file+': '+variant+' QR retains its current destination');
  }
  await page.emulateMedia({media:'screen'});await page.setViewportSize({width:390,height:844});
  for(const id of ['p1','p3','p5','p6']){await page.goto(BASE+'/printables.html?sheet='+id);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+': larger QR does not overflow the phone view');}
  console.log('PASS '+engine.name()+': shared 9pt primary copy/21pt titles, 32mm QRs, actual H format bits, quiet zones, decoding with an erased patch, unchanged URLs and phone layout.');
 }finally{await browser.close();}}
})().catch(e=>{console.error(e);process.exit(1)});
