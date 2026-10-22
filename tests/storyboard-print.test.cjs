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
 const bathroom=page.locator('#gm-envelope');assert.ok((await bathroom.locator('.section-kicker').first().textContent()).includes('Úloha Kúpeľňa / 6 min'));
 assert.equal(await bathroom.locator('[data-action="test"]').count(),0);
 await bathroom.locator('.storyboard-toggle').click();
 assert.equal(await bathroom.locator('.storyboard-content>div').first().getAttribute('class'),'worksheet-review');
 assert.equal(await bathroom.locator('.storyboard-content>*').last().getAttribute('class'),'material-actions storyboard-sheet-actions');
 assert.ok(!/FYZICKÁ STOPA|Nasleduje obálka|Otestovať QR|KÓD NA OBNOVENIE SPOJENIA/.test(await bathroom.locator('.worksheet-text').innerText()));
 for(const target of ['kvak-message-text','kvak-message-tts']){assert.ok(await page.locator('#'+target).isHidden());const button=page.locator('[data-target="'+target+'"]');await button.click();assert.ok(await page.locator('#'+target).isVisible());assert.equal(await button.getAttribute('aria-expanded'),'true');await button.click();assert.ok(await page.locator('#'+target).isHidden());}
 assert.equal(await page.locator('#kvak-message-tts pre').textContent(),await page.evaluate(()=>GAME.voiceScripts.kvak.prompt));
 const open=page.waitForEvent('popup');await bathroom.locator('.worksheet-image').click();const printed=await open;await printed.waitForLoadState();
 assert.equal(new URL(printed.url()).searchParams.get('internalPreview'),'1');assert.equal(new URL(printed.url()).hash,'#p1');
 assert.equal(await printed.locator('.sheet').count(),8);assert.equal(await printed.locator('.sheet:visible').count(),8);
 assert.equal(normalize(await bathroom.locator('.worksheet-text').innerText()),normalize(await printed.locator('.kvak-print-story').innerText()+' '+await printed.locator('.kvak-print-mission').innerText()));
 assert.equal(normalize((await bathroom.locator('.adult-help p').allTextContents()).join(' ')),normalize((await printed.locator('#rodicovsky-navod .adult-help[data-stage="envelope"] p').allTextContents()).join(' ')));
 assert.equal(normalize(await bathroom.locator('.storyboard-solution').innerText()),normalize(await printed.locator('#rodicovsky-navod .storyboard-solution').innerText()));
 assert.equal(await printed.locator('.sheet').first().getAttribute('id'),'rodicovsky-navod');
 assert.equal(await printed.locator('.guide-stage').count(),10);
 for(const id of await page.evaluate(()=>GAME.stages.map(stage=>stage.id))){
  const block=page.locator('#gm-'+id),toggle=block.locator('.storyboard-toggle');
  if(await toggle.getAttribute('aria-expanded')==='false')await toggle.click();
  assert.equal(normalize((await block.locator('.adult-help p').allTextContents()).join(' ')),normalize((await printed.locator(`.guide-stage[data-stage="${id}"] .adult-help p`).allTextContents()).join(' ')),id+': parent instructions match storyboard');
 }
 const guideText=await printed.locator('#rodicovsky-navod').innerText();
 assert.match(guideText,/farebne.*krajšie/);assert.match(guideText,/čiernobielou/);assert.match(guideText,/obálok alebo škatuľiek/);assert.match(guideText,/mašľou či gumičkou/);
 assert.match(guideText,/vypočujú Pikovu správu aj viackrát/);
 assert.equal(await printed.locator('header>a').getAttribute('href'),'storyboard.html');assert.equal(await printed.locator('header>a').innerText(),'Späť na storyboard');
 for(const id of ['p1','p2','p3','p4','p5','p6']){await printed.goto(BASE+'/printables.html?internalPreview=1#'+id);await printed.waitForFunction(id=>Math.abs(document.getElementById(id).getBoundingClientRect().top)<40,id);assert.equal(await printed.locator('.sheet:visible').count(),8);}
 const map={envelope:'p1',document:'p2',symbols:'p3',cipher:'p4',maze:'p5',digital:'p5',search:'p6',code:'p6'};
 for(const [stage,sheet] of Object.entries(map))assert.ok((await page.locator('#gm-'+stage+' .worksheet-image').getAttribute('href')).endsWith('#'+sheet));
 await printed.goto(BASE+'/printables.html?sheet=p1');assert.equal(await printed.locator('.sheet:visible').count(),1);assert.ok(await printed.locator('#rodicovsky-navod').isHidden());assert.ok(!(await printed.locator('#p1').innerText()).includes('741296'));
 await printed.close();
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:'/tmp/storyboard-header.png'});
 await bathroom.screenshot({path:'/tmp/storyboard-bathroom.png'});
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await bathroom.screenshot({path:'/tmp/storyboard-bathroom-phone.png'});
 assert.deepEqual(errors,[]);console.log('PASS: storyboard navigation, bathroom ordering, closed transcript/TTS controls, exact shared print text/help/solution, six anchored worksheets, private parent page and responsive layout.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exit(1);});
