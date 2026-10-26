// Reproducible, local browser measurements; no analytics code is shipped to visitors.
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const phase=process.argv[2]||'before';
if(!['before','after'].includes(phase))throw new Error('Use before or after');
const output=path.resolve('docs/cro-audit-2026-10-26');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080';
fs.mkdirSync(path.join(output,phase),{recursive:true});
const viewports=[[320,568],[360,640],[390,844],[430,932],[768,1024],[1366,768],[1440,900]];
(async()=>{
 const browser=await chromium.launch();
 const rows=[];
 try{
  for(const [width,height] of viewports){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:width<600,hasTouch:width<600});
   const page=await context.newPage(),errors=[],badResponses=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(BASE))badResponses.push({url:r.url(),status:r.status()});});
   await page.addInitScript(()=>{
    window.auditPerf={lcpMs:null,cls:0,longTasks:[],events:[]};
    try{new PerformanceObserver(list=>{for(const e of list.getEntries())auditPerf.lcpMs=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});}catch{}
    try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)auditPerf.cls+=e.value;}).observe({type:'layout-shift',buffered:true});}catch{}
    try{new PerformanceObserver(list=>{for(const e of list.getEntries())auditPerf.longTasks.push({start:e.startTime,duration:e.duration});}).observe({type:'longtask',buffered:true});}catch{}
    try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(e.interactionId)auditPerf.events.push({name:e.name,duration:e.duration});}).observe({type:'event',durationThreshold:16,buffered:true});}catch{}
   });
   await page.goto(BASE,{waitUntil:'load'});
   await page.evaluate(()=>document.fonts.ready);
   await page.waitForTimeout(1800);
   const initialPerf=await page.evaluate(()=>{
    const p=performance.getEntriesByType('paint'),resources=performance.getEntriesByType('resource');
    return {...auditPerf,fcpMs:p.find(e=>e.name==='first-contentful-paint')?.startTime??null,domReadyMs:performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd,localTransferBytes:resources.filter(r=>r.name.startsWith(location.origin)).reduce((sum,r)=>sum+r.transferSize,0),tbtMs:auditPerf.longTasks.reduce((sum,t)=>sum+Math.max(0,t.duration-50),0)};
   });
   const initial=await page.evaluate(()=>{
    const bar=document.querySelector('.mobile-buy'),cta=document.querySelector('.funnel-hero .funnel-cta'),price=document.querySelector('.hero-price');
    const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect();return getComputedStyle(el).display!=='none'&&r.top>=0&&r.bottom<=innerHeight;};
    return {heroCtaFullyVisible:visible(cta),priceFullyVisible:visible(price),mobileBarVisible:visible(bar),duplicateCta:visible(cta)&&visible(bar)};
   });
   // Load every supplied still image before a full-page documentation capture.
   await page.locator('img').evaluateAll(async images=>{
    for(const img of images)img.loading='eager';
    await Promise.all(images.map(img=>img.decode().catch(()=>{})));
   });
   const layout=await page.evaluate(()=>{
    const sectionNodes=[...document.querySelectorAll('#app>section')];
    const sections=sectionNodes.map((el,index)=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {index,id:el.id||null,className:el.className,heading:(el.querySelector('h1,h2')?.textContent||'').replace(/\s+/g,' ').trim(),top:Math.round(r.top+scrollY),height:Math.round(r.height),verticalPadding:Math.round(parseFloat(s.paddingTop)+parseFloat(s.paddingBottom)),textCharacters:el.textContent.trim().length};});
    const first=document.querySelector('.funnel-hero .funnel-cta'),demo=document.querySelector('.evidence-family,.hybrid-activity'),offer=document.querySelector('#balik'),bar=document.querySelector('.mobile-buy');
    const top=el=>el?Math.round(el.getBoundingClientRect().top+scrollY):null;
    const texts=[...document.querySelectorAll('.funnel-section p,.funnel-hero-bottom>p,.funnel-hero-description,.faq-list p')].filter(el=>el.getClientRects().length);
    return {pageHeight:document.documentElement.scrollHeight,sectionCount:sections.length,sections,totalSectionPadding:sections.reduce((s,v)=>s+v.verticalPadding,0),firstCtaTop:top(first),firstAnyCtaTop:top(document.querySelector('.funnel-nav-cta')),offerCardTop:top(document.querySelector('.funnel-offer-card')),firstDemoTop:top(demo),firstDemoScreens:demo?Number((top(demo)/innerHeight).toFixed(2)):null,completeOfferTop:top(offer),horizontalOverflow:document.documentElement.scrollWidth>innerWidth,bodyTextMinPx:Math.min(...texts.map(el=>parseFloat(getComputedStyle(el).fontSize))),heroHeadingPx:parseFloat(getComputedStyle(document.querySelector('h1')).fontSize),barHeight:bar&&getComputedStyle(bar).display!=='none'?Math.round(bar.getBoundingClientRect().height):0,brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash)};
   });
   await page.screenshot({path:path.join(output,phase,`${width}x${height}-full.jpg`),fullPage:true,type:'jpeg',quality:84});
   if([390,1440].includes(width))await page.screenshot({path:path.join(output,phase,`${width}x${height}-hero.jpg`),type:'jpeg',quality:90});
   const firstFaq=page.locator('.faq-list summary').first();
   await firstFaq.click();await page.waitForTimeout(100);await firstFaq.click();
   const eventDurations=await page.evaluate(()=>auditPerf.events.map(e=>e.duration));
   const row={viewport:{width,height},...layout,initial,lab:{...initialPerf,interactionSampleMaxMs:eventDurations.length?Math.max(...eventDurations):null},errors,badResponses};
   rows.push(row);console.log(JSON.stringify({phase,width,height,pageHeight:layout.pageHeight,sections:layout.sectionCount,offerTop:layout.completeOfferTop,demoTop:layout.firstDemoTop,lcpMs:initialPerf.lcpMs,cls:initialPerf.cls}));
   await context.close();
  }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(output,`${phase}.json`),JSON.stringify({phase,method:'Local static HTTP, Chromium, fresh browser context per viewport, DPR1; no CPU/network throttling; PerformanceObserver lab samples, no field data. Heights measured with all FAQs in default closed state and supplied still images loaded.',viewports:rows},null,2)+'\n');
})().catch(e=>{console.error(e);process.exit(1);});
