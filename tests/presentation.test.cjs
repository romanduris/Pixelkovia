const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080';
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE);
  assert.equal(await page.locator('.site-header [data-view]').count(),3);
  assert.equal(await page.locator('.site-header [data-view="designer"]').textContent(),'StoryBoard VÝVOJ');
  assert.equal(await page.locator('.hero-background').getAttribute('src'),'assets/pixelkovia-room.png');
  assert.equal(await page.locator('.faq-list details').count(),6);
  assert.equal(await page.locator('.activity-story img').count(),2);
  assert.ok(!(await page.locator('#app').textContent()).includes('741296'));
  assert.equal(await page.locator('a[href="atlas.html"]').count(),0);
  await page.locator('.hero a[href="#balik"]').click();
  assert.equal(await page.locator('.offer-price strong').textContent(),'14,99 €');
  await page.locator('[data-action="purchase"]').click();
  assert.ok((await page.locator('.purchase-preview').textContent()).includes('Predaj ešte nie je spustený'));
  await page.locator('[data-action="preview-customer"]').click();
  assert.equal(await page.locator('.portal-header').count(),1);
  assert.equal(await page.locator('.material-card').count(),6);
  assert.equal(await page.locator('[data-check]').count(),6);
  assert.equal(await page.locator('.prep-table tbody tr').count(),5);
  assert.ok((await page.locator('.prototype-access').textContent()).includes('overenie nákupu ešte nie sú pripojené'));
  await page.locator('[data-check="0"]').check();
  for(const id of ['p1','p2','p3','p4','p5','p6','diplom']){
   const link=page.locator(`a[download][href="assets/printables/${id}.pdf"]`);assert.equal(await link.count(),1);
   const response=await page.request.get(BASE+'/assets/printables/'+id+'.pdf');assert.equal(response.status(),200);
   const pdf=await response.body();assert.ok(pdf.subarray(0,5).toString()==='%PDF-');
   assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length,1,id+' is one A4 page');
  }
  const downloadEvent=page.waitForEvent('download');await page.locator('a[download][href="assets/printables/p1.pdf"]').click();
  assert.equal((await downloadEvent).suggestedFilename(),'p1.pdf');
  await page.locator('[data-action="preview-media"][data-media="kvak"]').click();
  await page.waitForFunction(()=>{const a=document.querySelector('dialog audio');return a&&!a.paused&&a.currentTime>0});
  await page.locator('.dialog-close').click();
  assert.ok(await page.locator('dialog audio').evaluate(a=>a.paused));
  await page.locator('.site-header [data-view="designer"]').click();
  assert.equal(await page.locator('.storyboard').count(),10);assert.equal(await page.locator('.gm-atlas').count(),1);
  const blocks=page.locator('.studio-timeline>.storyboard');
  assert.equal(await blocks.locator('.storyboard-toggle[aria-expanded="true"]').count(),10,'all stages start expanded');
  for(const block of await blocks.all()){
   const toggle=block.locator('.storyboard-toggle');
   await toggle.click();
   assert.equal(await toggle.getAttribute('aria-expanded'),'false');
   assert.ok(!await block.locator('.storyboard-content').isVisible(),'whole stage content collapses');
   assert.ok(await block.locator('h2').isVisible());
   assert.ok(await block.locator('.storyboard-head [data-action="test"]').isVisible(),'testing remains accessible when collapsed');
   await toggle.focus();await page.keyboard.press('Enter');
   assert.equal(await toggle.getAttribute('aria-expanded'),'true','keyboard expands the same stage');
   assert.ok(await block.locator('.storyboard-content').isVisible());
  }
  assert.equal(await page.locator('details.tts-block:not([open])').count(),2,'TTS prompts start collapsed');
  assert.equal(await page.locator('.script-copy[open]').count(),2,'both spoken transcripts start expanded');
  assert.equal(await page.locator('#gm-intro .studio-stage-details, #gm-envelope .studio-stage-details').count(),0,'duplicate full scenarios are absent from the first two sections');
  assert.equal(await page.locator('#gm-document .studio-stage-details').count(),1,'later scenarios remain available');
  await page.locator('[data-tts="piko"]>summary').click();
  assert.ok(await page.locator('[data-tts="piko"] pre').isVisible(),'original prompt expands on request');
  await page.locator('[data-tts="piko"]>summary').click();
  assert.ok(!await page.locator('[data-tts="piko"] pre').isVisible());
  assert.equal(await page.locator('.tts-block h4').first().textContent(),'ElevenLabs v3 · cca 7 sekúnd');
  assert.equal(await page.locator('#gm-intro video').getAttribute('src'),'assets/PicoVideo.mp4');
  assert.equal(await page.locator('#gm-envelope audio').getAttribute('src'),'assets/KvakMessage.mpeg');
  assert.ok((await page.locator('#gm-intro .script-status').textContent()).includes('Prepis podľa dodaného zadania'));
  const scripts=await page.evaluate(()=>GAME.voiceScripts);
  for(const id of ['piko','kvak'])assert.equal(await page.locator(`[data-tts="${id}"] pre`).textContent(),scripts[id].prompt,'verbatim production direction');
  assert.ok(scripts.piko.prompt.includes('[panicked, speaking quickly] Obálka jedna… v kúpeľni! Rýchlo!'));
  assert.ok(scripts.kvak.prompt.includes('[amazed] Ľudia?! Naozajstní ľudia?! Kvak! Toto musím povedať Pikovi!'));
  assert.equal(await page.locator('#gm-intro .script-copy>div>p').count(),5);
  const speech=await page.locator('#gm-intro .script-copy>div').textContent();
  assert.ok(speech.includes('Ah—'));assert.ok(!speech.includes('[curious'));
  assert.ok((await page.locator('#gm-envelope .script-copy').textContent()).includes('Toto musím povedať Pikovi!'));
  assert.ok((await page.locator('#gm-envelope .worksheet-text').textContent()).includes('neviem sa spojiť'));
  await page.locator('#gm-intro [data-action="preview-media"]').click();
  await page.waitForFunction(()=>{const v=document.querySelector('dialog video');return v&&!v.paused&&v.currentTime>0});
  await page.locator('.dialog-close').click();
  assert.ok(await page.locator('dialog video').evaluate(v=>v.paused));
  const printable=await page.context().newPage();await printable.goto(BASE+'/printables.html?sheet=p1');
  const normalize=s=>s.replace(/\s+/g,' ').trim();
  assert.equal(normalize(await page.locator('.worksheet-text').innerText()).split('KÓD NA OBNOVENIE SPOJENIA')[0].trim(),normalize(await printable.locator('.kvak-print-story').innerText()+' '+await printable.locator('.kvak-print-mission').innerText()));
  await printable.emulateMedia({media:'print'});
  const layout=await printable.evaluate(()=>{
   const rect=selector=>document.querySelector(selector).getBoundingClientRect().toJSON();
   return {retained:rect('.kvak-retained'),controls:rect('.kvak-print-controls'),divider:rect('.kvak-cut-divider'),cutouts:rect('.signal-cutouts'),sheet:rect('#p1'),footer:rect('#p1 .footer'),qrLoaded:document.querySelector('.qr-mockup img').naturalWidth>0};
  });
  assert.ok(layout.controls.bottom<=layout.retained.bottom&&layout.retained.bottom<layout.divider.top,'code and QR stay with the instructions above the cutting line');
  assert.ok(layout.cutouts.top>layout.divider.bottom,'all six cutouts remain below the cutting line');
  assert.ok(layout.footer.bottom<=layout.sheet.bottom,'the whole worksheet fits on one A4');
  assert.ok(layout.qrLoaded,'dummy QR illustration is available in the printable');
  assert.equal(await printable.locator('.qr-mockup a').count(),0);
  assert.ok((await printable.locator('.qr-mockup').innerText()).includes('NEFUNKČNÁ'));
  await printable.close();
  // StoryBoard test is the simulated scan itself, with no extra instruction screen.
  const savedBeforeTest=await page.evaluate(()=>localStorage.getItem('zahada-v1-progress'));
  await page.locator('#gm-envelope .storyboard-toggle').click();
  await page.locator('#gm-envelope [data-action="test"]').click();
  assert.equal(await page.locator('.signal-restore').count(),1);
  assert.equal(await page.locator('.task-main, .task-aside, .scan-entry').count(),0);
  assert.equal(await page.locator('#answer').getAttribute('maxlength'),'6');
  await page.locator('#answer').fill('000000');await page.locator('.answer-form button').click();
  assert.ok((await page.locator('#feedback').textContent()).includes('ešte nesedí'));
  await page.locator('.signal-header [data-action="exit-test"]').click();
  assert.equal(await page.locator('.studio-header').count(),1,'test returns directly to StoryBoard');
  await page.locator('#gm-envelope [data-action="test"]').click();
  await page.locator('#answer').fill('741296');await page.locator('.answer-form button').click();
  assert.equal(await page.locator('.signal-connected').count(),1);
  assert.equal(await page.evaluate(()=>localStorage.getItem('zahada-v1-progress')),savedBeforeTest,'QR preview never changes family progress');
  await page.locator('.signal-header [data-action="exit-test"]').click();
  await page.evaluate(()=>document.fullscreenElement?document.exitFullscreen():undefined);
  // Later stage tests open only the interaction, not duplicate instruction pages.
  for(let n=2;n<=8;n++){
   await page.locator(`[data-action="test"][data-stage="${n}"]`).click();
   assert.equal(await page.locator('.signal-task').count(),1,'stage '+n+' opens its direct interaction');
   assert.equal(await page.locator('.task-main, .task-aside, .scene-reader, .task-instruction').count(),0);
   const answer=await page.evaluate(n=>GAME.stages[n].answer[0],n);
   if(n===6){
    for(const symbol of answer.split(','))await page.locator(`[data-symbol="${symbol}"]`).click();
    await page.locator('[data-action="verify-sequence"]').click();
   }else{
    assert.equal(await page.locator('#answer').count(),1);
    await page.locator('#answer').fill(answer);await page.locator('.answer-form button').click();
   }
   assert.equal(await page.locator('.signal-stage-result').count(),1);
   assert.equal(await page.locator('.scene-reader, .task-main, .task-aside').count(),0);
   assert.equal(await page.evaluate(()=>localStorage.getItem('zahada-v1-progress')),savedBeforeTest,'stage '+n+' preview is isolated');
   await page.locator('.signal-header [data-action="exit-test"]').click();
   assert.equal(await page.locator('.studio-header').count(),1);
  }
  await page.evaluate(()=>document.fullscreenElement?document.exitFullscreen():undefined);
  // Refresh must stay on the sales page regardless of saved game, tab or hash.
  for(const saved of [
   {started:true,callDone:false,stage:0,completed:[],messageOpened:true},
   {started:true,callDone:true,stage:1,completed:[],kvakScan:true},
   {started:true,callDone:true,stage:4,completed:[1,2,3],hints:{4:1}},
   {started:true,callDone:true,stage:9,completed:[1,2,3,4,5,6,7,8]}
  ]){
   await page.evaluate(saved=>{localStorage.setItem('zahada-v1-progress',JSON.stringify(saved));location.hash='gm-envelope';scrollTo(0,1000);},saved);
   await page.reload();
   assert.equal(await page.locator('.sales-hero').count(),1);assert.equal(await page.locator('dialog[open]').count(),0);
   assert.equal(await page.evaluate(()=>location.hash),'');assert.equal(await page.evaluate(()=>scrollY),0);
   const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('zahada-v1-progress')));assert.deepEqual(stored,saved,'refresh does not change saved progress');
  }
  await page.locator('.site-header [data-view="prep"]').click();assert.ok(await page.locator('[data-check="0"]').isChecked());
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});
   for(const view of ['sales','prep','designer']){
    await page.locator(`.site-header [data-view="${view}"]`).click();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),view+' '+width);
   }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: three tabs, preserved hero, sales offer and honest purchase state, seven PDF downloads, customer checklist, playable StoryBoard media, exact worksheet copy, exact original ElevenLabs TTS prompts, refresh-to-home without save loss, mobile and desktop.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
