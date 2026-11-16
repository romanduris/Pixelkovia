// Optional authoring dependencies live outside this repository, like the
// worksheet exporter. HTML/CSS and approved character artwork are the sources.
const fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const QRCode=require(process.env.QRCODE_MODULE||'qrcode');
const root=path.resolve(__dirname,'..'),origin='https://pixelkovia.rodulab.com';
const allowed=new Set(['gift-vouchers.html','gift-vouchers.css','assets/sales/characters/guardy.webp','assets/gift-vouchers/website-qr.svg',...['Manrope-ExtraBold.ttf','DM-Sans-Medium.ttf'].map(f=>'assets/gift-vouchers/'+f)]);
(async()=>{
 const output=path.join(root,'assets/gift-vouchers');await fs.mkdir(output,{recursive:true});
 await fs.writeFile(path.join(output,'website-qr.svg'),await QRCode.toString(origin,{type:'svg',errorCorrectionLevel:'H',margin:4,color:{dark:'#000000',light:'#ffffff'}}));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:794,height:1123},deviceScaleFactor:2});
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url()),file=url.pathname.slice(1);
   if(url.origin!==origin||!allowed.has(file))return route.abort();
   const source=file.endsWith('.ttf')?'assets/social/facebook/sources/fonts/'+path.basename(file):file;
   await route.fulfill({body:await fs.readFile(path.join(root,source)),contentType:{'.html':'text/html; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.ttf':'font/ttf'}[path.extname(file)]});
  });
  await page.goto(origin+'/gift-vouchers.html');await page.emulateMedia({media:'print'});
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode()));});
  const overflow=await page.locator('.voucher').evaluateAll(cards=>cards.some(card=>card.scrollHeight>card.clientHeight+1||[...card.querySelectorAll('header,.hero,.code-panel,.redeem,footer')].some(el=>el.getBoundingClientRect().bottom>card.getBoundingClientRect().bottom-4)));
  if(overflow)throw Error('Voucher content does not fit its A4 quarter.');
  const pdf=await page.pdf({path:path.join(output,'pixelkovia-darcekove-poukazy-A4.pdf'),format:'A4',preferCSSPageSize:true,printBackground:true});
  if((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length!==1)throw Error('Expected one A4 page.');
  await page.locator('.a4').screenshot({path:'/tmp/pixelkovia-vouchers-a4.png'});
  console.log('Exported one A4 page with three gift vouchers and a blank fourth quarter. Preview: /tmp/pixelkovia-vouchers-a4.png');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
