const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080';
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addInitScript(()=>{HTMLElement.prototype.requestFullscreen=async()=>{};});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE);
  assert.equal(await page.locator('.site-header [data-view]').count(),0);
  assert.equal(await page.locator('.funnel-hero picture img').getAttribute('src'),'assets/pixelkovia-room-desktop.webp');
  assert.equal(await page.locator('.faq-list details').count(),19);
  assert.equal(await page.locator('.funnel-activity img').count(),2);
  assert.ok(!(await page.locator('#app').textContent()).includes('741296'));
  assert.equal(await page.locator('a[href="atlas.html"]').count(),0);
  assert.equal(await page.locator('a[href="parent.html"],a[href="storyboard.html"],a[href="game.html"],[data-action="start"],[data-view]').count(),0);
  assert.equal(await page.locator('.funnel-price strong').textContent(),'14,99 €');
  assert.ok(await page.locator('.funnel-cta[href="checkout.html"]').count()>=3);
  await page.locator('.funnel-hero .funnel-cta').click();
  await page.waitForURL('**/checkout.html');
  assert.ok(await page.locator('.checkout-buy').isDisabled());
  await page.goto(BASE+'/parent.html');
  assert.equal(await page.locator('.portal-header').count(),1);
  assert.equal(await page.locator('.material-card').count(),7);
  assert.equal(await page.locator('[data-check]').count(),14);
  assert.equal(await page.locator('.prep-table tbody tr').count(),6);
  assert.ok((await page.locator('.prototype-access').textContent()).includes('Nie je produkčne chránený'));
  assert.ok(await page.locator('[data-action="start"]').isDisabled());
  await page.locator('[data-check="printed"]').check();
  for(const id of ['p1','p2','p3','p4','p5','p6','p7','diplom']){
   const link=page.locator(`a[download][href="assets/printables/${id}.pdf"]`);assert.equal(await link.count(),1);
   const response=await page.request.get(BASE+'/assets/printables/'+id+'.pdf');assert.equal(response.status(),200);
   const pdf=await response.body();assert.ok(pdf.subarray(0,5).toString()==='%PDF-');
   assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length,1,id+' is one A4 page');
  }
  const downloadEvent=page.waitForEvent('download');await page.locator('a[download][href="assets/printables/p1.pdf"]').click();
  assert.equal((await downloadEvent).suggestedFilename(),'p1.pdf');
  assert.equal(await page.locator('[data-media="miky"]').count(),1,'new recording has a preview control');
  assert.match(await page.locator('.media-check').innerText(),/Otestovať Mikyho zvuk/);
  await page.goto(BASE+'/storyboard.html');
  assert.equal(await page.locator('.storyboard').count(),9);assert.equal(await page.locator('.gm-atlas').count(),0);
  const blocks=page.locator('.studio-timeline>.storyboard');
  assert.equal(await blocks.locator('.storyboard-toggle[aria-expanded="false"]').count(),9,'all stages start collapsed');
  for(const block of await blocks.all()){
   const toggle=block.locator('.storyboard-toggle');
   assert.ok(!await block.locator('.storyboard-content').isVisible(),'stage content is initially hidden');
   await toggle.click();
   assert.ok(await block.locator('.storyboard-content').isVisible());
   await toggle.click();
   assert.equal(await toggle.getAttribute('aria-expanded'),'false');
   assert.ok(!await block.locator('.storyboard-content').isVisible(),'whole stage content collapses');
   assert.ok(await block.locator('.storyboard-head h2').isVisible());
   if(['gm-document','gm-cipher'].includes(await block.getAttribute('id')))assert.equal(await block.locator('[data-action="test"]').count(),0);
   else assert.ok(await block.locator('.storyboard-head [data-action="test"]').isVisible(),'testing stays available while the stage is collapsed');
   await toggle.focus();await page.keyboard.press('Enter');
   assert.equal(await toggle.getAttribute('aria-expanded'),'true','keyboard expands the same stage');
   assert.ok(await block.locator('.storyboard-content').isVisible());
  }
  assert.equal(await page.locator('[data-tts][hidden]').count(),3,'all TTS prompts start collapsed');
  assert.equal(await page.locator('.script-copy[hidden]').count(),3,'all message transcripts start collapsed');
  assert.equal(await page.locator('.storyboard-content>.gm-instructions').count(),9);
  assert.equal(await page.locator('#gm-envelope .adult-help').count(),1);
  assert.ok(await page.locator('#miky-message-text').isHidden());assert.ok(await page.locator('#miky-message-tts').isHidden());
  await page.locator('[data-target="miky-message-tts"]').click();assert.ok(await page.locator('#miky-message-tts').isVisible());
  await page.locator('[data-target="miky-message-tts"]').click();
  assert.equal(await page.locator('.studio-stage-details,[id^="stage-"][id$="-notes"]').count(),0,'developer notes are removed from all stages');
  assert.equal(await page.getByRole('button',{name:'Vývojárske podklady',exact:true}).count(),0);
  await page.locator('[data-target="piko-message-tts"]').click();
  assert.ok(await page.locator('[data-tts="piko"] pre').isVisible(),'original prompt expands on request');
  await page.locator('[data-target="piko-message-tts"]').click();
  assert.ok(!await page.locator('[data-tts="piko"] pre').isVisible());
  assert.equal(await page.locator('[data-tts="piko"] h4').first().textContent(),'ElevenLabs v3 · cca 7 sekúnd');
  assert.equal(await page.locator('#gm-intro video').count(),0);
  assert.equal(await page.locator('#gm-envelope .miky-message-controls audio').getAttribute('src'),'assets/Miky.mp3');
  assert.equal(await page.locator('.recording-archive').count(),0);
  assert.ok((await page.locator('#gm-intro .script-status').textContent()).includes('Schválené pôvodné video'));
  const scripts=await page.evaluate(()=>GAME.voiceScripts);
  for(const id of ['piko','miky','plugy'])assert.equal(await page.locator(`[data-tts="${id}"] pre`).textContent(),scripts[id].prompt,'verbatim production direction');
  assert.ok(scripts.piko.prompt.includes('[panicked, speaking quickly] Indícia jedna… v kúpeľni! Rýchlo!'));
  assert.ok(scripts.miky.prompt.includes('[amazed] Ľudia?! Naozajstní ľudia?! Toto musím povedať nášmu sprievodcovi!'));
  assert.equal(await page.locator('#gm-intro .script-copy>div>p').count(),5);
  const speech=await page.locator('#gm-intro .script-copy>div').textContent();
  assert.ok(speech.includes('Ah—'));assert.ok(!speech.includes('[curious'));
  assert.ok((await page.locator('#gm-envelope .script-copy').textContent()).includes('Toto musím povedať nášmu sprievodcovi!'));
  assert.ok((await page.locator('#gm-envelope .worksheet-text').textContent()).includes('Prestal som počuť ostatných'));
  await page.locator('#gm-intro [data-action="preview-media"]').click();
  await page.waitForFunction(()=>{const v=document.querySelector('dialog video');return v&&!v.paused&&v.currentTime>0});
  await page.locator('.dialog-close').click();
  assert.ok(await page.locator('dialog video').evaluate(v=>v.paused));
  const printable=await page.context().newPage();await printable.goto(BASE+'/printables.html?sheet=p1');
  const normalize=s=>s.replace(/\s+/g,' ').trim();
  assert.equal(normalize(await page.locator('#gm-envelope .worksheet-text').innerText()).split('KÓD NA OBNOVENIE SPOJENIA')[0].trim(),normalize(await printable.locator('.miky-print-story').innerText()+' '+await printable.locator('.miky-print-mission').innerText()));
  await printable.emulateMedia({media:'print'});
  const layout=await printable.evaluate(()=>{
   const rect=selector=>document.querySelector(selector).getBoundingClientRect().toJSON();
   return {retained:rect('.miky-retained'),controls:rect('.miky-print-controls'),divider:rect('.miky-cut-divider'),cutouts:rect('.signal-cutouts'),sheet:rect('#p1'),footer:rect('#p1 .footer'),qrLoaded:document.querySelector('.qr-mockup img').naturalWidth>0};
  });
  assert.ok(layout.controls.bottom<=layout.retained.bottom&&layout.retained.bottom<layout.divider.top,'code and QR stay with the instructions above the cutting line');
  assert.ok(layout.cutouts.top>layout.divider.bottom,'all six cutouts remain below the cutting line');
  assert.ok(layout.footer.bottom<=layout.sheet.bottom,'the whole worksheet fits on one A4');
  assert.ok(layout.qrLoaded,'scannable QR is available in the printable');
  assert.equal(await printable.locator('.qr-mockup a').count(),0);
  assert.ok((await printable.locator('.qr-mockup').innerText()).includes('OTVORIŤ MIKYHO SIGNÁL'));
  await printable.close();
  // Bathroom and later tasks expose direct tests in their headers.
  const savedBeforeTest=await page.evaluate(()=>localStorage.getItem('zahada-v1-progress'));
  assert.equal(await page.locator('#gm-envelope .storyboard-head [data-action="test"]').count(),1);
  assert.ok(!(await page.locator('#gm-envelope').innerText()).includes('Nasleduje obálka 2'));
  // Later stage tests open only the interaction, not duplicate instruction pages.
  assert.equal(await page.locator('#gm-document [data-action="test"]').count(),0,'paper Pixi has no player test');
  assert.equal(await page.locator('#gm-document .storyboard-continuation').count(),0);
  for(let n=3;n<=7;n++){
   if(n===4)continue;
   await page.locator(`[data-action="test"][data-stage="${n}"]`).click();
   assert.equal(await page.locator('.signal-task').count(),1,'stage '+n+' opens its direct interaction');
   assert.equal(await page.locator('.task-main, .task-aside, .scene-reader, .task-instruction').count(),0);
   const answer=await page.evaluate(n=>GAME.stages[n].answer[0],n);
   if(n===3){const indexes=await page.evaluate(()=>GAME.plugyPuzzle.grid.flat().flatMap((value,index)=>GAME.plugyPuzzle.values.includes(value)?[index]:[]));for(const index of indexes)await page.locator('[data-cell="'+index+'"]').click();}
   else if(n===5){await require('./helpers/cipko.cjs')(page,{touch:false});}
   else{
    assert.equal(await page.locator('#answer').count(),1);
    await page.locator('#answer').fill(answer);await page.locator('.answer-form button').click();
   }
   if(n===3)await page.locator('.plugy-connected').waitFor();
   assert.equal(await page.locator(n===5?'.cipko-finished':'.signal-stage-result').count(),1,'stage '+n+' completes');
   assert.equal(await page.locator('.scene-reader, .task-main, .task-aside').count(),0);
   assert.equal(await page.evaluate(()=>localStorage.getItem('zahada-v1-progress')),savedBeforeTest,'stage '+n+' preview is isolated');
   await page.locator('.signal-header [data-action="exit-test"]').click();
   assert.equal(await page.locator('.studio-header').count(),1);
  }
  await page.evaluate(()=>document.fullscreenElement?document.exitFullscreen():undefined);
  // Refresh must stay on the sales page regardless of saved game, tab or hash.
  for(const saved of [
   {started:true,callDone:false,stage:0,completed:[],messageOpened:true},
   {started:true,callDone:true,stage:1,completed:[],mikyScan:true},
   {started:true,callDone:true,stage:4,completed:[1,2,3],hints:{4:1}},
   {started:true,callDone:true,stage:9,completed:[1,2,3,4,5,6,7,8]}
  ]){
   await page.evaluate(saved=>{localStorage.setItem('zahada-v1-progress',JSON.stringify(saved));location.hash='gm-envelope';scrollTo(0,1000);},saved);
   await page.goto(BASE);
   assert.equal(await page.locator('.funnel-hero').count(),1);assert.equal(await page.locator('dialog[open]').count(),0);
   assert.equal(await page.evaluate(()=>location.hash),'');assert.equal(await page.evaluate(()=>scrollY),0);
   const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('zahada-v1-progress')));assert.deepEqual(stored,saved,'refresh does not change saved progress');
  }
  await page.goto(BASE+'/parent.html');assert.ok(await page.locator('[data-check="printed"]').isChecked());
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});
   for(const view of ['sales','prep','designer']){
    await page.goto(BASE+'/'+({sales:'index.html',prep:'parent.html',designer:'storyboard.html'}[view]));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),view+' '+width);
   }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: separate entries, preserved hero, sales offer and isolated purchase state, eight PDF downloads, customer checklist, playable StoryBoard media, exact worksheet copy, exact authored ElevenLabs TTS prompts, refresh-to-home without save loss, mobile and desktop.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
