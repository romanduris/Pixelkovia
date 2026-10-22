// Start an HTTP server in the project root or dist/, then run with PLAYWRIGHT_MODULE set.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{}};
vm.runInNewContext(fs.readFileSync('game-data.js','utf8'),context);
const game=context.window.GAME;
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080';
const legacyAnswers=[['741296'],['HLADAJ POD STOLICKAMI'],['9'],['STOL','STÔL'],['246'],['moon,sun,star'],['SPOLU'],['SVETLO']];
assert.equal(game.stages.length,10);
assert.equal(game.stages.reduce((sum,s)=>sum+s.time.reduce((a,b)=>a+b,0),0),60);
assert.equal(new Set(game.stages.map(s=>s.id)).size,10);
assert.equal(game.characters.length,7);
assert.equal(new Set(game.stages.slice(1,7).map(s=>s.character)).size,6);
assert.equal(JSON.stringify(game.stages.slice(1,9).map(s=>s.answer)),JSON.stringify(legacyAnswers),'paper route is updated; all numeric codes and final letters stay compatible');
assert.equal(game.stages.slice(1,7).map(s=>s.reward).join(''),'SVETLO');
assert.equal(game.call,game.stages[0].story,'one source for call and introductory storyboard');
for(const s of game.stages){
  for(const field of ['action','task','materials','mobile','solution','parent','transition'])assert.ok(s[field]?.length>15,`${s.id}: ${field}`);
  for(const panel of [...s.story,...s.resolution])assert.ok(panel.length&&panel.every(l=>typeof l==='string'&&!/POZNÁMKA PRE GAME DESIGN|NASLEDUJE ÚLOHA/.test(l)));
  if(s.answer)assert.equal(s.hints.length,2);
}
for(const file of ['game-data.js','app.js','index.html','printables.html','atlas.html','README.md'])assert.ok(!/závoj/i.test(fs.readFileSync(file,'utf8')),`${file}: approved terminology`);
assert.ok(!JSON.stringify(game.call).includes('Ochranné pole'),'no explanation in the incoming call');
assert.ok(JSON.stringify(game.stages[4].resolution).includes('OCHRANA AKTÍVNA.'),'the authored twist is present');
assert.ok(JSON.stringify(game.stages[8].resolution).includes('Piko. Poď.'),'Piko is included in the safe return');
const ordered=[...game.signalRecords].sort((a,b)=>a.month-b.month||a.day-b.day||a.time.localeCompare(b.time));
assert.equal(ordered.map(r=>r.digit).join(''),'741296');
assert.notEqual(game.signalRecords.map(r=>r.digit).join(''),'741296','printed order is scrambled');
assert.equal(new Set(ordered.map(r=>`${r.month}-${r.day}-${r.time}`)).size,6,'unique chronological order');
assert.ok(Object.values(Object.groupBy(game.signalRecords,r=>r.date)).some(group=>group.length>=3),'three records require exact time comparison');
assert.equal(game.audio,'assets/KvakMessage.mpeg');
assert.ok(fs.existsSync(game.audio));
assert.equal(game.stages[0].hints.length,3);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:1100}});
 const page=await context.newPage();
 page.setDefaultTimeout(15000);
 await page.addInitScript(()=>{
   window.notificationNotes=0;
   const original=AudioContext.prototype.createOscillator;
   AudioContext.prototype.createOscillator=function(...args){window.notificationNotes++;return original.apply(this,args);};
 });
 async function finishVideo(p){
   await p.locator('video').evaluate(v=>{v.playbackRate=16;v.play().catch(()=>{});});
   await p.locator('[data-action="finish-call"]').waitFor({state:'visible'});
 }
 async function resizePlayerViewport(viewport){
   // Browser window resizing requires leaving real fullscreen first.
   await page.evaluate(()=>document.fullscreenElement?document.exitFullscreen():undefined);
   await page.setViewportSize(viewport);
 }
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function resume(p){
  if(!await p.locator('[data-action="start"]').count())await p.goto(new URL('parent.html', p.url()).href);
  for(const check of await p.locator('[data-check]').all())await check.check();
  await p.locator('[data-action="start"]').click();
 }
 async function reloadAndResume(p){
  await p.goto(new URL('parent.html', p.url()).href);await p.locator('.portal-header').waitFor();assert.equal(await p.locator('.portal-header').count(),1,'explicit customer entry preserves saved progress');
  assert.equal(await p.locator('dialog[open]').count(),0,'refresh never autoplays a saved message');
  await resume(p);
 }
 const noAtlas=async()=>assert.equal(await page.locator('a[href="atlas.html"]').count(),0,'no player atlas link before finale');
 const noOverflow=async(p,label)=>assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label);
 async function readScene(p){
  let text='',turns=0;
  if(await p.locator('.signal-connected').count())return p.locator('#kvak-transcript').textContent();
  if(!await p.locator('.scene-panel').count())return '';
  while(true){
   text+='\n'+await p.locator('.scene-panel').textContent();
   assert.ok(!(await p.locator('#app').textContent()).includes('POZNÁMKA PRE GAME DESIGN'));
   const next=p.locator('.scene-reader .btn[data-action="scene-page"]');
   if(!await next.count())break;
   assert.ok(++turns<35,'bounded scene pagination');await next.click();
  }
  return text;
 }
 await page.goto(BASE);
 await noAtlas();
 await page.screenshot({path:'/tmp/mystery-home-desktop.png',fullPage:true});
 assert.equal(await page.locator('.chapter-card').count(),0,'sales page contains no game map spoilers');
 assert.equal(await page.locator('.faq-list details').count(),9);
 assert.equal(await page.locator('.character-card').count(),7);
 // Existing progress remains usable; the new optional panel cursor persists independently.
 await page.evaluate(()=>localStorage.setItem('zahada-v1-progress',JSON.stringify({started:true,callDone:true,stage:4,completed:[1,2,3],hints:{4:1},scenePages:{'cipher:before':1}})));
 await reloadAndResume(page);
 assert.equal(await page.locator('.signal-task h1').textContent(),game.stages[4].label);
 assert.equal(await page.locator('.task-main, .task-aside, .scene-reader').count(),0,'old instruction screen is removed');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('zahada-v1-progress')).completed.length),3);
 assert.equal(await page.locator('#answer').count(),1,'task opens directly at answer input');
 await readScene(page);
 assert.equal(await page.locator('#hints p').count(),1);
 const cursor=await page.evaluate(()=>JSON.parse(localStorage.getItem('zahada-v1-progress')).scenePages['cipher:before']);
 await reloadAndResume(page);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('zahada-v1-progress')).scenePages['cipher:before']),cursor);
 // The home restart clears the entire saved journey and immediately opens a fresh incoming message.
 await page.locator('[data-action="home"]').click();
 assert.equal(await page.getByRole('button',{name:'Začať dobrodružstvo od začiatku',exact:false}).count(),1);
 await resume(page);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('zahada-v1-progress')).scenePages['cipher:before']),cursor,'continue preserves the current scene');
 assert.equal(await page.locator('#hints p').count(),1,'continue preserves hints');
 await page.locator('[data-action="home"]').click();
 await page.evaluate(()=>localStorage.setItem('zahada-prep-0','1'));
 for(const width of [320,390,768,1440]){await resizePlayerViewport({width,height:1100});await noOverflow(page,`home with restart ${width}`);}
 await page.locator('[data-action="restart-adventure"]').click();
 assert.equal(await page.locator('.message-incoming').count(),1);
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('zahada-v1-progress'))),{started:true,callDone:false,stage:0,completed:[],hints:{},scenePages:{}});
 assert.equal(await page.evaluate(()=>localStorage.getItem('zahada-prep-0')),'1','restart keeps parent preparation');
 await reloadAndResume(page);assert.equal(await page.locator('.message-incoming').count(),1,'explicit continue retains the restarted game');
 await page.locator('.message-status [data-action="close"]').click();
 assert.equal(await page.locator('.portal-header').count(),1);

 await page.evaluate(()=>localStorage.removeItem('zahada-v1-progress'));
 await page.reload();
 await page.goto(BASE+'/storyboard.html');
 assert.equal(await page.locator('.storyboard').count(),10);
 assert.equal(await page.locator('.gm-atlas').count(),0);
 assert.ok((await page.locator('#gm-cipher').textContent()).includes('OCHRANA AKTÍVNA.'));
 assert.equal(await page.locator('#gm-intro .gm-dramaturgy, #gm-envelope .gm-dramaturgy').count(),0,'first two duplicate scenarios are omitted');
 assert.equal(await page.locator('#gm-document .gm-dramaturgy').count(),1,'later dramaturgy stays available');
 // GM stage previews remain isolated from real progress.
 await page.locator('[data-action="test"][data-stage="4"]').click();await noAtlas();
 await readScene(page);await page.locator('#answer').fill('stôl');await page.locator('.answer-form button').click();
 assert.equal(await page.locator('.success-card').count(),1);
 assert.equal(await page.evaluate(()=>localStorage.getItem('zahada-v1-progress')),null);
 await page.locator('[data-action="exit-test"]').click();
 await page.locator('[data-action="test"][data-stage="0"]').click();await page.locator('.message-status [data-action="close"]').click();
 assert.equal(await page.locator('.storyboard').count(),10,'intro preview returns to GM');
 assert.equal(await page.evaluate(()=>localStorage.getItem('zahada-v1-progress')),null);
 await page.goto(BASE);
 await resume(page);
 assert.equal(await page.locator('.message-incoming').count(),1);
 assert.ok(!(await page.locator('.message-screen').textContent()).includes('kúpeľ'));
 assert.ok(await page.locator('[data-action="message-sound"]').getAttribute('aria-pressed')==='true');
 await page.waitForFunction(()=>document.fullscreenElement===document.documentElement);
 const firstNotes=await page.evaluate(()=>window.notificationNotes);
 await page.waitForFunction(n=>window.notificationNotes>=n+3,firstNotes);
 const bounds=await page.locator('.message-modal').boundingBox();
 assert.equal(bounds.width,1440);assert.equal(bounds.height,1100);
 await page.locator('[data-action="accept-call"]').click();
 assert.equal(await page.locator('video[playsinline]').count(),1);
 const notesAtOpen=await page.evaluate(()=>window.notificationNotes);
 await page.waitForTimeout(5000);
 assert.equal(await page.evaluate(()=>window.notificationNotes),notesAtOpen,'opening video stops recurring notification sounds');
 await page.locator('video').evaluate(v=>v.pause());
 await page.screenshot({path:'/tmp/piko-video-playing.png'});
 assert.ok(!(await page.locator('.message-screen').textContent()).includes('kúpeľ'));
 await finishVideo(page);
 assert.equal(await page.locator('.message-caption').textContent(),'Správa od Pika');
 assert.ok(await page.locator('.message-video-replay').isVisible(),'replay arrow remains on the video after it ends');
 await page.locator('video').evaluate(v=>{v.playbackRate=1;});
 await page.locator('.message-video-replay').click({position:{x:12,y:12}});
 await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&!v.paused&&v.currentTime<v.duration;});
 await page.locator('.message-video-replay').waitFor({state:'hidden'});
 await page.locator('.message-actions [data-action="replay-message"]').click();
 assert.equal(await page.locator('.message-opened').count(),1,'replay stays on message screen');
 await reloadAndResume(page);
 assert.equal(await page.locator('.message-opened').count(),1,'opened message restores after reload');
 await page.locator('[data-action="finish-call"]').click();
 assert.equal(await page.locator('.signal-restore').count(),1,'found envelope goes directly to QR destination');
 assert.equal(await page.locator('.task-main, .task-aside, .scan-entry').count(),0,'no intermediate task page');
 assert.equal(await page.locator('#answer').count(),1,'code input is immediately available');
 assert.equal(await page.locator('#answer').getAttribute('inputmode'),'numeric');
 assert.equal(await page.locator('#answer').getAttribute('maxlength'),'6');
 assert.equal(await page.locator('#answer').getAttribute('pattern'),'[0-9]{6}');
 await page.locator('#answer').fill('314');await page.locator('.answer-form button').click();
 assert.equal(await page.locator('.signal-restore').count(),1,'legacy code is no longer accepted');
 await page.locator('#answer').fill('000000');await page.locator('.answer-form button').click();
 assert.ok((await page.locator('#feedback').textContent()).includes('ešte nesedí'));
 assert.equal(await page.locator('.signal-restore [data-action="hint"]').count(),0,'no hints on the initial code screen');
 await reloadAndResume(page);assert.equal(await page.locator('#hints').count(),0);
 let entireJourney='';
 for(let i=1;i<=8;i++){
  await noAtlas();entireJourney+=await readScene(page);
  if(i===1){assert.equal(await page.locator('.signal-restore').count(),1);}
  if(i===6){
   assert.ok(!(await page.locator('.signal-task').textContent()).includes('dve obrazovky rozžiarili'));
   await page.locator('[data-symbol="sun"]').click();await page.locator('[data-action="verify-sequence"]').click();
   assert.ok((await page.locator('#feedback').textContent()).includes('ešte nesedí'));
   await page.locator('[data-action="clear-sequence"]').click();await page.locator('[data-symbol="moon"]').click();
   await page.locator('[data-action="hint"]').click();assert.ok((await page.locator('#sequence').textContent()).includes('☾'));
   await page.locator('[data-symbol="sun"]').click();await page.locator('[data-symbol="star"]').click();await page.locator('[data-action="verify-sequence"]').click();
  }else if(i===2){assert.equal(await page.locator('#answer').count(),0);await page.locator('[data-action="paper-found"]').click();}else{await page.locator('#answer').fill(legacyAnswers[i-1][0].toLowerCase());await page.locator('.answer-form button').click();}
  assert.equal(await page.locator('.success-card').count(),1,`stage ${i} completes`);await noAtlas();
  if(i<=6)assert.equal(await page.locator('.success-character').count(),1);
  if(i===4){await reloadAndResume(page);assert.equal(await page.locator('.success-card').count(),1,'reload preserves completed task confirmation');}
  const resolution=await readScene(page);entireJourney+=resolution;
  if(i===1){
   assert.equal(await page.locator('.signal-duo [aria-label="Piko"]').count(),1);
   assert.equal(await page.locator('.signal-duo [aria-label="Kvak"]').count(),1);
   const positions=await page.locator('.signal-duo .pixel-sprite').evaluateAll(els=>els.map(e=>getComputedStyle(e).backgroundPosition));
   assert.equal(new Set(positions).size,2,'official first and second atlas crops');
   assert.ok(resolution.includes('Kto mi lezie do signálu?!'));
   assert.ok(!resolution.includes('Pikov hlas'),'only Kvak speaks');
   assert.ok(!(await page.locator('#kvak-transcript').getAttribute('open')),'transcript starts collapsed');
   assert.equal(await page.locator('.signal-audio-controls button').count(),1,'one control handles every playback state');
   await page.waitForFunction(()=>{const a=document.querySelector('#kvak-audio');return a&&!a.paused&&a.currentTime>0;});
   assert.equal(await page.locator('.is-speaking').count(),1,'correct code automatically starts Kvak');
   assert.ok((await page.locator('[data-action="kvak-audio-toggle"]').textContent()).includes('Pozastaviť'));
   assert.equal(await page.locator('#connection-title').evaluate(e=>getComputedStyle(e).outlineStyle),'none','heading has no focus frame');
   await page.locator('[data-action="kvak-audio-toggle"]').click();
   assert.ok(await page.locator('audio').evaluate(a=>a.paused));
   const pausedTime=await page.locator('audio').evaluate(a=>a.currentTime);
   await page.locator('[data-action="kvak-audio-toggle"]').click();
   await page.waitForFunction(time=>{const a=document.querySelector('audio');return a&&!a.paused&&a.currentTime>time;},pausedTime);
   // The local server does not support byte ranges for this MPEG: finish real playback at a higher rate.
   await page.locator('audio').evaluate(a=>a.playbackRate=16);
   await page.waitForFunction(()=>document.querySelector('audio').ended);
   assert.ok((await page.locator('[data-action="kvak-audio-toggle"]').textContent()).includes('↻ Prehrať znova'));
   await page.locator('audio').evaluate(a=>a.playbackRate=1);
   await page.locator('[data-action="kvak-audio-toggle"]').click();
   await page.waitForFunction(()=>{const a=document.querySelector('audio');return a&&!a.paused&&a.currentTime<2;});
   await page.locator('[data-action="kvak-audio-toggle"]').click();
   assert.equal(await page.locator('.signal-connected').count(),1,'audio never advances automatically');
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('zahada-v1-progress')).stage),1);
   await reloadAndResume(page);assert.equal(await page.locator('.signal-connected').count(),1,'saved first puzzle restores new connection scene');
  }
  if(i>=2){
   assert.equal(await page.locator('.signal-stage-result').count(),1,'direct result confirmation');
   assert.equal(await page.locator('.signal-reward strong').textContent(),game.stages[i].reward);
   assert.equal(await page.locator('.task-main, .task-aside, .scene-reader').count(),0,'no duplicate narrative or task page');
  }
  await page.locator('[data-action="next"]').click();
 }
 assert.equal(await page.locator('.finale').count(),1);entireJourney+=await readScene(page);
 assert.ok(entireJourney.includes('bezpečne vrátili'));
 assert.equal(await page.locator('.finale .contact.connected').count(),7);
 assert.equal(await page.locator('.finale .contact small').first().textContent(),'Doma ✓');
 assert.equal(await page.locator('.atlas-cta').count(),1);
 const [bonus]=await Promise.all([page.waitForEvent('popup'),page.locator('.atlas-cta').click()]);
 await bonus.waitForLoadState();assert.ok(bonus.url().endsWith('/atlas.html'));
 assert.equal(await bonus.locator('.atlas-profile').count(),7);await bonus.close();
 await reloadAndResume(page);assert.equal(await page.locator('.atlas-cta').count(),1,'finished saved game retains bonus');
 await page.locator('[data-action="notebook"]').click();assert.equal(await page.locator('.notebook-row').count(),8);await page.locator('.dialog-close').click();
 await page.locator('[data-action="reset"]').click();await page.locator('.dialog-close').click();assert.equal(await page.locator('.finale').count(),1);
 await page.locator('[data-action="reset"]').click();await page.locator('[data-action="confirm-reset"]').click();await noAtlas();
 await page.evaluate(()=>document.fullscreenElement?document.exitFullscreen():undefined);
 // Old completion, absent MPEG, screen fallbacks and every phone width.
 const kvakContext=await browser.newContext();const kp=await kvakContext.newPage();const audioErrors=[];kp.on('pageerror',e=>audioErrors.push(e.message));
 await kp.addInitScript(()=>{Object.defineProperty(document,'fullscreenEnabled',{get(){return false;}});});
 await kp.route('**/assets/KvakMessage.mpeg',route=>route.fulfill({status:404,body:'Missing audio'}));
 await kp.goto(BASE);await kp.evaluate(()=>localStorage.setItem('zahada-v1-progress',JSON.stringify({started:true,callDone:true,stage:1,completed:[1],hints:{1:1}})));await reloadAndResume(kp);
 assert.equal(await kp.locator('.signal-connected').count(),1,'legacy first completion remains completed');
 await kp.locator('[data-action="kvak-audio-toggle"]').click();await kp.locator('#kvak-transcript[open]').waitFor();
 assert.ok((await kp.locator('#kvak-audio-status').textContent()).includes('nepodarilo'));
 assert.ok((await kp.locator('#kvak-transcript').textContent()).includes('cez deň do vášho domu prichádza svetlo'));
 await kp.locator('[data-action="next"]').click();assert.equal(await kp.locator('.signal-task h1').textContent(),game.stages[2].label);
 for(const [width,height] of [[320,640],[390,844],[844,390],[1440,1100]]){
  await kp.setViewportSize({width,height});await kp.evaluate(()=>localStorage.setItem('zahada-v1-progress',JSON.stringify({started:true,callDone:true,stage:1,completed:[],hints:{}})));await reloadAndResume(kp);
  assert.equal(await kp.locator('.signal-restore').count(),1);await noOverflow(kp,`Kvak restore ${width}`);
  const box=await kp.locator('#app').boundingBox();assert.equal(box.width,width);assert.equal(box.height,height);
  if(width===390){
   await kp.locator('#answer').focus();
   await kp.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>360});visualViewport.dispatchEvent(new Event('resize'));});
   await kp.waitForFunction(()=>{const r=document.querySelector('#answer').getBoundingClientRect(),button=document.querySelector('.answer-form button').getBoundingClientRect();return Math.abs(r.top+r.height/2-180)<3&&button.bottom<=340;});
   assert.equal(await kp.locator('#app').evaluate(e=>Math.round(e.getBoundingClientRect().height)),360,'scroller follows the keyboard-sized visual viewport');
   await kp.screenshot({path:'/tmp/kvak-input-keyboard.png',clip:{x:0,y:0,width:390,height:360}});
   await kp.locator('#answer').blur();
   await kp.evaluate(()=>{delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});
   await kp.waitForFunction(()=>!document.querySelector('#app').classList.contains('is-entering-answer'));
  }
  await kp.screenshot({path:`/tmp/kvak-restore-${width}.png`});
  await kp.locator('.signal-header [data-action="home"]').click();assert.equal(await kp.locator('.portal-header').count(),1);
  await resume(kp);await kp.locator('#answer').fill('741296');await kp.locator('.answer-form button').click();
  await noOverflow(kp,`Kvak connection ${width}`);await kp.screenshot({path:`/tmp/kvak-connection-${width}.png`});
 }
 assert.deepEqual(audioErrors,[]);await kvakContext.close();
 // Narrow phone, phone, tablet and desktop layouts.
 for(const width of [320,390,768,1440]){await resizePlayerViewport({width,height:844});await noOverflow(page,`home ${width}`);}
 await resizePlayerViewport({width:390,height:844});await page.screenshot({path:'/tmp/mystery-home-mobile.png',fullPage:true});
 await page.goto(BASE+'/parent.html');await noOverflow(page,'mobile prep');await noAtlas();
 await page.locator('[data-check="printed"]').check();await page.reload();await page.goto(BASE+'/parent.html');assert.ok(await page.locator('[data-check="printed"]').isChecked());
 await page.goto(BASE+'/storyboard.html');await noOverflow(page,'mobile GM');
 await page.locator('[data-action="test"][data-stage="6"]').click();await readScene(page);await noOverflow(page,'mobile task');await noAtlas();
 await page.screenshot({path:'/tmp/mystery-task-mobile.png',fullPage:true});
 await page.goto(BASE+'/printables.html');assert.equal(await page.locator('.sheet').count(),8);assert.equal(await page.locator('#circles svg').count(),2);await noOverflow(page,'mobile printables');
 await page.emulateMedia({media:'print'});const pdf=await page.pdf({path:'/tmp/mystery-working-print.pdf',format:'A4',printBackground:true});assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length,8,'six worksheets, diploma and adult guide fit eight pages');await page.emulateMedia({media:'screen'});
 // The first worksheet is self-contained, low-ink, and one A4 even without colour.
 await page.goto(BASE+'/printables.html?sheet=p1');
 assert.equal(await page.locator('.sheet:visible').count(),1,'player cannot see future worksheets');
 const sheet=page.locator('#p1');const text=await sheet.textContent();
 assert.ok(!text.includes('741296'),'no solution on worksheet');
 for(const copy of ['výborný sluch','Piko','VAŠA MISIA','presný čas','rovnakého roka','AKTIVOVAŤ KVAKOV SIGNÁL'])assert.ok(text.includes(copy),copy);
 assert.equal(await sheet.locator('.signal-cutout').count(),6);assert.equal(await sheet.locator('.code-boxes span').count(),6);
 assert.equal(await sheet.locator('[role="img"][aria-label*="Kvak"]').count(),1);
 assert.equal(await sheet.locator('.kvak-print-mission li').count(),5);
 const printed=await sheet.locator('.signal-cutout').evaluateAll(els=>els.map(e=>({date:e.dataset.date,time:e.dataset.time,digit:e.dataset.digit})));
 assert.equal(JSON.stringify(printed),JSON.stringify(game.signalRecords.map(r=>({date:r.date,time:r.time,digit:r.digit}))));
 await page.emulateMedia({media:'print'});
 const a4=await page.pdf({path:'/tmp/kvak-a4.pdf',format:'A4',printBackground:true});
 assert.equal((a4.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length,1,'single-sided A4');
 const geometry=await sheet.evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,bottom:e.getBoundingClientRect().bottom,footer:e.querySelector('.footer').getBoundingClientRect().bottom,bg:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color}));
 assert.ok(geometry.footer<=geometry.bottom,'footer and all content stay on A4');assert.equal(geometry.bg,'rgb(255, 255, 255)');assert.equal(geometry.color,'rgb(20, 40, 64)');
 const cutBounds=await sheet.locator('.signal-cutout').evaluateAll(els=>els.map(e=>{const a=e.getBoundingClientRect(),b=e.querySelector('.cutout-content').getBoundingClientRect();return {contained:b.left>=a.left&&b.right<=a.right&&b.top>=a.top&&b.bottom<=a.bottom,width:a.width,height:a.height,transform:getComputedStyle(e.querySelector('.cutout-content')).transform};}));
 assert.ok(cutBounds.every(b=>b.contained&&b.width>150&&b.height>150),'rotated information fits child-sized physical cutouts');
 assert.equal(new Set(cutBounds.map(b=>b.transform)).size,3,'90, 180 and minus 90 degrees');
 const darkPanels=await sheet.locator('*').evaluateAll(els=>els.filter(e=>{const s=getComputedStyle(e),c=s.backgroundColor.match(/^rgb\((\d+), (\d+), (\d+)\)$/),r=e.getBoundingClientRect();return c&&Math.max(+c[1],+c[2],+c[3])<128&&r.width*r.height>4000;}).length);
 assert.equal(darkPanels,0,'no large dark filled panels');
 await sheet.screenshot({path:'/tmp/kvak-a4-colour.png'});
 await sheet.evaluate(e=>e.style.filter='grayscale(1)');await sheet.screenshot({path:'/tmp/kvak-a4-grayscale.png'});
 assert.equal(await sheet.locator('.record-date strong').count(),6);assert.equal(await sheet.locator('.record-time strong').count(),6);assert.equal(await sheet.locator('.record-digit b').count(),6,'labels and outlines retain every meaning without colour');
 await page.emulateMedia({media:'screen'});
 // Directly shared atlas works with a fresh profile, without gameplay or JavaScript.
 const bookContext=await browser.newContext({javaScriptEnabled:false,viewport:{width:1440,height:1000}});
 const book=await bookContext.newPage();await book.goto(BASE+'/atlas.html');
 assert.equal(await book.locator('script').count(),0);
 assert.equal(await book.locator('.book-section p').count(),143,'full authored chapter');
 assert.equal(await book.locator('.atlas-profile').count(),7);
 assert.equal(await book.locator('.profile-prose p').count(),14,'all seven complete literary profiles');
 assert.ok((await book.locator('#tajny-svet').textContent()).includes('Dnes som zistil, že priatelia niekedy bývajú aj na druhej strane obrazovky.'));
 assert.ok((await book.locator('#tajny-svet').textContent()).length>9000,'long-form book, not a summary');
 const crops=await book.locator('.atlas-profile .pixel-sprite').evaluateAll(els=>els.map(e=>({pos:getComputedStyle(e).backgroundPosition,size:getComputedStyle(e).backgroundSize,image:getComputedStyle(e).backgroundImage})));
 assert.equal(new Set(crops.map(c=>c.pos)).size,7);
 assert.ok(crops.every(c=>c.size==='400% 200%'&&c.image.includes('pixelkovia-atlas.png')));
 for(const width of [320,390,768,1440]){await book.setViewportSize({width,height:1000});await noOverflow(book,`atlas ${width}`);}
 await book.screenshot({path:'/tmp/pixelkovia-atlas-desktop.png'});
 await book.locator('#piko').screenshot({path:'/tmp/pixelkovia-atlas-profile.png'});
 await book.setViewportSize({width:390,height:844});await book.goto(BASE+'/atlas.html');await book.screenshot({path:'/tmp/pixelkovia-atlas-mobile.png'});await bookContext.close();
 // Corrupt or missing local storage does not stop the game, and direct offline HTML works.
 await page.goto(BASE);await page.evaluate(()=>localStorage.setItem('zahada-v1-progress','{broken'));await page.reload();assert.equal(await page.locator('.hero').count(),1);
 const offline=await browser.newContext({offline:true});const local=await offline.newPage();await local.goto('file://'+require('node:path').resolve('index.html'));await resume(local);assert.equal(await local.locator('.message-incoming').count(),1);await local.goto('file://'+require('node:path').resolve('atlas.html'));assert.equal(await local.locator('.atlas-profile').count(),7);await offline.close();
 const restricted=await browser.newContext();await restricted.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage disabled');}});Object.defineProperty(document,'fullscreenEnabled',{get(){return false;}});});const guest=await restricted.newPage();await guest.route('**/assets/PicoVideo.mp4',route=>route.fulfill({status:404,body:'Missing video'}));const guestErrors=[];guest.on('pageerror',e=>guestErrors.push(e.message));await guest.goto(BASE);await resume(guest);await guest.locator('[data-action="accept-call"]').click();
 assert.equal(await guest.locator('[data-action="game-fullscreen"]').count(),0,'unsupported fullscreen keeps the page playable');
 await guest.locator('#message-video-status').waitFor({state:'visible'});
 assert.ok(!(await guest.locator('.message-screen').textContent()).includes('kúpeľ'));
 assert.ok(!(await guest.locator('[data-action="finish-call"]').isVisible()),'failed media does not reveal next task');
 await guest.locator('.message-status [data-action="close"]').click();
 assert.equal(await guest.locator('.portal-header').count(),1);assert.deepEqual(guestErrors,[]);await restricted.close();
 // Incoming and opened messages fill small phones and landscape without horizontal overflow.
 await page.goto(BASE);await page.evaluate(()=>localStorage.removeItem('zahada-v1-progress'));await page.reload();
 for(const [width,height] of [[320,640],[390,844],[844,390],[1440,1100]]){
   await resizePlayerViewport({width,height});await resume(page);
   await noOverflow(page,`message ${width}`);
   const box=await page.locator('.message-modal').boundingBox();assert.equal(box.width,width);assert.equal(box.height,height);
   await page.screenshot({path:`/tmp/piko-incoming-${width}.png`});
   await page.locator('[data-action="accept-call"]').click();await noOverflow(page,`video ${width}`);
   await finishVideo(page);
   await page.screenshot({path:`/tmp/piko-video-${width}.png`});
   await page.locator('.message-status [data-action="close"]').click();
   await page.evaluate(()=>localStorage.removeItem('zahada-v1-progress'));await page.reload();
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: Kvak V4 six-digit chronological code, simulated QR, official duo, MPEG playback/pause/replay and missing-audio fallback, legacy first completion, mobile fullscreen, self-contained low-ink colour/grayscale A4, parent logistics; complete eight-task journey through direct interaction screens, authored storyboard preserved, seven safe returns, V1 saves, legacy reader state, wrong answers/hints, GM isolation, finale-only atlas CTA, full static atlas without JS or gameplay, seven sprite crops, mobile/tablet/desktop, eight print pages, offline files and unavailable storage/video, full-screen message with the supplied PicoVideo.mp4, video replay, restored message and spoiler-free failures.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
