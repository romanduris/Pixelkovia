const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080';
const normalize=value=>value.replace(/\s+/g,' ').trim();
(async()=>{const browser=await chromium.launch({headless:true});try{
 const context=await browser.newContext({viewport:{width:1512,height:1100}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(BASE+'/storyboard.html');await page.locator('.studio-header').waitFor();
 assert.ok((await page.locator('.storyboard-brand').innerText()).includes('PIXELKOVIA'));
 assert.deepEqual(await page.locator('.storyboard-top-links a').allTextContents(),['Digital Product Administration','Funnel']);
 assert.deepEqual(await page.locator('.designer-bar a').allTextContents(),['Customer page','Atlas Pixelkov','Tlačové materiály']);
 assert.ok(!/[←→↗↓↺]/.test(await page.locator('.storyboard-top-links').innerText()+await page.locator('.designer-bar').innerText()));
 assert.equal(await page.locator('[data-action="print"]').count(),0);
 assert.equal(await page.locator('.storyboard-content:not([hidden])').count(),0);
 const bathroom=page.locator('#gm-envelope');assert.match(await bathroom.locator('.storyboard-heading h2').innerText(),/Úloha 1 – Kúpeľňa/);assert.ok((await bathroom.locator('.section-kicker').first().textContent()).includes('6 min'));
 assert.equal(await bathroom.locator('.storyboard-head [data-action="test"]').count(),1);
 await bathroom.locator('.storyboard-toggle').click();
 assert.equal(await bathroom.locator('.storyboard-content>div').first().getAttribute('class'),'worksheet-review');
 assert.equal(await bathroom.locator('.storyboard-content>*').last().getAttribute('class'),'material-actions storyboard-sheet-actions');
 assert.ok(!/FYZICKÁ STOPA|Nasleduje obálka|Otestovať QR|KÓD NA OBNOVENIE SPOJENIA/.test(await bathroom.locator('.worksheet-text').innerText()));
 for(const target of ['kvak-message-text','kvak-message-tts']){assert.ok(await page.locator('#'+target).isHidden());const button=page.locator('[data-target="'+target+'"]');await button.click();assert.ok(await page.locator('#'+target).isVisible());assert.equal(await button.getAttribute('aria-expanded'),'true');await button.click();assert.ok(await page.locator('#'+target).isHidden());}
 assert.equal(await page.locator('#kvak-message-tts pre').textContent(),await page.evaluate(()=>GAME.voiceScripts.kvak.prompt));
 const sutko=page.locator('#gm-symbols');await sutko.locator('.storyboard-toggle').click();
 for(const suffix of ['text','tts']){const panel=page.locator('#sutko-message-'+suffix);assert.ok(await panel.isHidden());await page.locator('[data-target="sutko-message-'+suffix+'"]').click();assert.ok(await panel.isVisible());await page.locator('[data-target="sutko-message-'+suffix+'"]').click();}
 assert.equal(await page.locator('#sutko-message-tts pre').textContent(),await page.evaluate(()=>GAME.voiceScripts.sutko.prompt));
 assert.equal(normalize((await page.locator('#sutko-message-text>div>p').allTextContents()).join(' ')),normalize(await page.evaluate(()=>GAME.sutkoMessage.join(' '))));
 assert.equal(await sutko.locator('.studio-stage-details,.storyboard-continuation').count(),0);
 assert.equal(await sutko.locator('audio').getAttribute('src'),await page.evaluate(()=>GAME.audio));
 assert.ok((await sutko.locator('.script-status').textContent()).includes('Dočasná testovacia nahrávka: Kvak'));

 const open=page.waitForEvent('popup');await bathroom.locator('.worksheet-image').click();const printed=await open;await printed.waitForLoadState();
 assert.equal(new URL(printed.url()).searchParams.get('internalPreview'),'1');assert.equal(new URL(printed.url()).hash,'#p1');
 assert.equal(await printed.locator('.sheet').count(),8);assert.equal(await printed.locator('.sheet:visible').count(),8);
 assert.equal(normalize(await bathroom.locator('.worksheet-text').innerText()),normalize(await printed.locator('.kvak-print-story').innerText()+' '+await printed.locator('.kvak-print-mission').innerText()));
 assert.equal(normalize((await bathroom.locator('.adult-help p').allTextContents()).join(' ')),normalize((await printed.locator('#rodicovsky-navod .adult-help[data-stage="envelope"] p').allTextContents()).join(' ')));
 assert.equal(normalize(await bathroom.locator('.gm-solution').innerText()),normalize(await printed.locator('#rodicovsky-navod .guide-stage[data-stage="envelope"] .gm-solution').innerText()));
 assert.equal(await bathroom.locator('.storyboard-content>.gm-instructions').count(),1);
 assert.equal(await bathroom.locator('.storyboard-content>.adult-help').count(),0);
 assert.match(await bathroom.locator('.gm-instructions>h3').innerText(),/Inštrukcie pre Game mastra/);
 assert.ok(!/Celý list P1|vložte do obálky|previažte/.test(await bathroom.locator('.gm-instructions').innerText()));
 assert.equal(await printed.locator('.sheet').first().getAttribute('id'),'rodicovsky-navod');
 assert.equal(await printed.locator('.guide-stage').count(),9);
 for(const id of await page.evaluate(()=>GAME.stages.map(stage=>stage.id))){
  const block=page.locator('#gm-'+id),toggle=block.locator('.storyboard-toggle');
  if(await toggle.getAttribute('aria-expanded')==='false')await toggle.click();
  assert.equal(await block.locator('.storyboard-content>.gm-instructions').count(),1,id+': one shared Game master section');
  assert.equal(await block.locator('.storyboard-head [data-action="test"]').count(),id==='document'?0:1);
  assert.equal(normalize((await block.locator('.adult-help p').allTextContents()).join(' ')),normalize((await printed.locator(`.guide-stage[data-stage="${id}"] .adult-help p`).allTextContents()).join(' ')),id+': parent instructions match storyboard');
 }
 assert.equal(await page.locator('#gm-digital').count(),0,'the separate symbol puzzle is removed');
 assert.match(await printed.locator('#p5 .note').innerText(),/Úlohu 6/);
 assert.equal(normalize(await page.locator('#gm-code .worksheet-text').textContent()),normalize(await printed.locator('#p6 .card').textContent()),'final password shows the printed ordering card');
 for(const stage of await page.evaluate(()=>GAME.stages.slice(2).filter(s=>s.id!=='symbols').map(s=>({id:s.id,lines:[...s.story,...s.resolution].flat()})))){
  const toggle=page.locator(`[data-target="stage-${stage.id}-story"]`),panel=page.locator(`#stage-${stage.id}-story`);
  assert.ok(await panel.isHidden());await toggle.click();assert.ok(await panel.isVisible());
  const text=await panel.textContent();for(const line of stage.lines)assert.ok(text.includes(line),stage.id+': full authored story retained');
  await toggle.click();assert.ok(await panel.isHidden());
 }
 const guideText=await printed.locator('#rodicovsky-navod').innerText();
 assert.match(guideText,/farebne.*krajšie/);assert.match(guideText,/čiernobielou/);assert.match(guideText,/obálok alebo škatuľiek/);assert.match(guideText,/mašľou či gumičkou/);
 assert.match(guideText,/video si môžu prehrať aj viackrát/);
 assert.equal(await page.locator('#gm-intro video').count(),0,'intro uses a video button');
 assert.ok(await page.locator('#gm-intro .video-message-button svg').isVisible());
 for(const id of ['piko-message-text','piko-message-tts']){assert.ok(await page.locator('#'+id).isHidden());await page.locator(`[data-target="${id}"]`).click();assert.ok(await page.locator('#'+id).isVisible());await page.locator(`[data-target="${id}"]`).click();}
 await page.locator('#gm-intro .video-message-button').click();
 await page.waitForFunction(()=>{const video=document.querySelector('dialog video');return video&&!video.paused&&video.currentTime>0});
 assert.equal(await page.locator('dialog video').getAttribute('src'),'assets/PicoVideo.mp4');
 await page.locator('.dialog-close').click();assert.ok(await page.locator('dialog video').evaluate(video=>video.paused));
 assert.equal(await printed.locator('header>a').getAttribute('href'),'storyboard.html');assert.equal(await printed.locator('header>a').innerText(),'Späť na storyboard');
 for(const id of ['p1','p2','p3','p4','p5','p6']){await printed.goto(BASE+'/printables.html?internalPreview=1#'+id);await printed.waitForFunction(id=>Math.abs(document.getElementById(id).getBoundingClientRect().top)<40,id);assert.equal(await printed.locator('.sheet:visible').count(),8);}
 const map={envelope:'p1',document:'p2',symbols:'p3',cipher:'p4',maze:'p5',search:'p6',code:'p6'};
 for(const [stage,sheet] of Object.entries(map))assert.ok((await page.locator('#gm-'+stage+' .worksheet-image').getAttribute('href')).endsWith('#'+sheet));
 await printed.goto(BASE+'/printables.html?sheet=p1');assert.equal(await printed.locator('.sheet:visible').count(),1);assert.ok(await printed.locator('#rodicovsky-navod').isHidden());assert.ok(!(await printed.locator('#p1').innerText()).includes('741296'));
 await printed.close();
 // Every collapsed header starts a real isolated test, including the intro and bathroom.
 const saved=JSON.stringify({started:true,callDone:true,stage:4,completed:[1,2,3],hints:{4:1}});
 await page.evaluate(saved=>localStorage.setItem('zahada-v1-progress',saved),saved);await page.reload();
 for(let stage=0;stage<9;stage++){
  if(stage===2){assert.equal(await page.locator('#gm-document [data-action="test"]').count(),0);assert.equal(await page.locator('#gm-document .storyboard-continuation').count(),0);continue;}
  const button=page.locator(`.storyboard-head [data-action="test"][data-stage="${stage}"]`);
  assert.ok(await button.isVisible());assert.equal(await page.locator('.storyboard-content:visible').count(),0);
  await button.click();
  if(stage===0){await page.locator('.message-incoming').waitFor();await page.locator('.message-status [data-action="close"]').click();}
  else if(stage===1){
   assert.equal(await page.locator('#answer').getAttribute('maxlength'),'6');
   await page.locator('#answer').fill('000000');await page.locator('.answer-form button').click();assert.match(await page.locator('#feedback').innerText(),/nesedí/);
   await page.locator('#answer').fill('741296');await page.locator('.answer-form button').click();await page.locator('.signal-connected').waitFor();
   await page.locator('audio').evaluate(audio=>audio.pause());await page.locator('.signal-header [data-action="exit-test"]').click();
  }else if(stage===8){await page.locator('.finale').waitFor();assert.equal(await page.locator('.finale [data-action="reset"]').count(),0,'finale test cannot reset family progress');await page.locator('.finale [data-action="exit-test"]').click();}
  else{await page.locator('.signal-task').waitFor();await page.locator('.signal-header [data-action="exit-test"]').click();}
  assert.equal(await page.evaluate(()=>localStorage.getItem('zahada-v1-progress')),saved,'test '+stage+' preserves family progress');
 }
 await page.evaluate(()=>document.fullscreenElement?document.exitFullscreen():undefined);
 await bathroom.locator('.storyboard-toggle').click();
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:'/tmp/storyboard-header.png'});
 await bathroom.screenshot({path:'/tmp/storyboard-bathroom.png'});
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await bathroom.screenshot({path:'/tmp/storyboard-bathroom-phone.png'});
 assert.deepEqual(errors,[]);console.log('PASS: eight isolated header tests including intro/bathroom/finale, paper-only Iskra without a player test, storyboard navigation, bathroom ordering, closed transcript/TTS controls, exact shared print text/help/solution, six anchored worksheets, private parent page and responsive layout.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exit(1);});
