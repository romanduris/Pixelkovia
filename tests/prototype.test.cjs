// Start an HTTP server in the project root or dist/, then run with PLAYWRIGHT_MODULE set.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{}};
vm.runInNewContext(fs.readFileSync('game-data.js','utf8'),context);
const game=context.window.GAME;
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080';
const legacyAnswers=[['314'],['OKNO','POD OKNOM'],['9'],['STOL','STÔL'],['246'],['moon,sun,star'],['SPOLU'],['SVETLO']];
assert.equal(game.stages.length,10);
assert.equal(game.stages.reduce((sum,s)=>sum+s.time.reduce((a,b)=>a+b,0),0),60);
assert.equal(new Set(game.stages.map(s=>s.id)).size,10);
assert.equal(game.characters.length,7);
assert.equal(new Set(game.stages.slice(1,7).map(s=>s.character)).size,6);
assert.equal(JSON.stringify(game.stages.slice(1,9).map(s=>s.answer)),JSON.stringify(legacyAnswers),'V1 answers remain compatible');
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
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}});
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
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const noAtlas=async()=>assert.equal(await page.locator('a[href="atlas.html"]').count(),0,'no player atlas link before finale');
 const noOverflow=async(p,label)=>assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label);
 async function readScene(p){
  let text='',turns=0;
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
 assert.equal(await page.locator('.chapter-card').count(),8);
 assert.equal(await page.locator('.chapter-card:disabled').count(),8);
 assert.equal(await page.locator('.character-card').count(),7);
 // Existing progress remains usable; the new optional panel cursor persists independently.
 await page.evaluate(()=>localStorage.setItem('zahada-v1-progress',JSON.stringify({started:true,callDone:true,stage:4,completed:[1,2,3],hints:{4:1}})));
 await page.reload();
 assert.ok((await page.locator('.task-main h1').textContent()).includes('Lístkov'));
 assert.equal(await page.locator('.contact.connected').count(),3);
 assert.equal(await page.locator('#answer').count(),game.stages[4].story.length>1?0:1,'puzzle appears on the last before-scene panel');
 await readScene(page);
 assert.equal(await page.locator('#hints p').count(),1);
 const cursor=await page.locator('.reader-count').textContent();
 await page.reload();assert.equal(await page.locator('.reader-count').textContent(),cursor);
 // The home restart clears the entire saved journey and immediately opens a fresh incoming message.
 await page.locator('[data-action="home"]').click();
 assert.equal(await page.getByRole('button',{name:'Začať dobrodružstvo od začiatku',exact:false}).count(),1);
 await page.locator('[data-action="start"]').click();
 assert.equal(await page.locator('.reader-count').textContent(),cursor,'continue preserves the current scene');
 assert.equal(await page.locator('#hints p').count(),1,'continue preserves hints');
 await page.locator('[data-action="home"]').click();
 await page.evaluate(()=>localStorage.setItem('zahada-prep-0','1'));
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1100});await noOverflow(page,`home with restart ${width}`);}
 await page.locator('[data-action="restart-adventure"]').click();
 assert.equal(await page.locator('.message-incoming').count(),1);
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('zahada-v1-progress'))),{started:true,callDone:false,stage:0,completed:[],hints:{},scenePages:{}});
 assert.equal(await page.evaluate(()=>localStorage.getItem('zahada-prep-0')),'1','restart keeps parent preparation');
 await page.reload();assert.equal(await page.locator('.message-incoming').count(),1,'reloading retains the restarted game');
 await page.locator('.message-status [data-action="close"]').click();
 assert.equal(await page.locator('.chapter-card:disabled').count(),8);

 await page.evaluate(()=>localStorage.removeItem('zahada-v1-progress'));
 await page.reload();
 await page.locator('.site-header [data-view="designer"]').click();
 assert.equal(await page.locator('.storyboard').count(),10);
 assert.equal(await page.locator('.gm-atlas').count(),1);
 assert.ok((await page.locator('#gm-cipher').textContent()).includes('OCHRANA AKTÍVNA.'));
 assert.ok((await page.locator('.gm-dramaturgy').first().textContent()).includes('Úvod musí okamžite'));
 // GM stage previews remain isolated from real progress.
 await page.locator('[data-action="test"][data-stage="4"]').click();await noAtlas();
 await readScene(page);await page.locator('#answer').fill('stôl');await page.locator('.answer-form button').click();
 assert.equal(await page.locator('.success-card').count(),1);
 assert.equal(await page.evaluate(()=>localStorage.getItem('zahada-v1-progress')),null);
 await page.locator('[data-action="exit-test"]').click();
 await page.locator('[data-action="test"][data-stage="0"]').click();await page.locator('.message-status [data-action="close"]').click();
 assert.equal(await page.locator('.storyboard').count(),10,'intro preview returns to GM');
 assert.equal(await page.evaluate(()=>localStorage.getItem('zahada-v1-progress')),null);
 await page.locator('.site-header [data-view="player"]').click();
 await page.locator('[data-action="start"]').click();
 assert.equal(await page.locator('.message-incoming').count(),1);
 assert.ok(!(await page.locator('.message-screen').textContent()).includes('kúpeľ'));
 assert.ok(await page.locator('[data-action="message-sound"]').getAttribute('aria-pressed')==='true');
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
 await page.locator('[data-action="replay-message"]').click();
 assert.equal(await page.locator('.message-opened').count(),1,'replay stays on message screen');
 await page.reload();
 assert.equal(await page.locator('.message-opened').count(),1,'opened message restores after reload');
 await page.locator('[data-action="finish-call"]').click();await readScene(page);
 await page.locator('[data-action="reopen-message"]').click();
 await page.locator('[data-action="finish-call"]').click();
 assert.equal(await page.locator('#answer').count(),1,'reopening message preserves current stage');
 await page.locator('#answer').fill('000');await page.locator('.answer-form button').click();
 assert.ok((await page.locator('#feedback').textContent()).includes('ešte nesedí'));
 await page.locator('[data-action="hint"]').click();assert.equal(await page.locator('#answer').inputValue(),'000');
 await page.reload();assert.equal(await page.locator('#hints p').count(),1);
 let entireJourney='';
 for(let i=1;i<=8;i++){
  await noAtlas();entireJourney+=await readScene(page);
  if(i===6){
   assert.ok(!(await page.locator('.task-main').textContent()).includes('dve obrazovky rozžiarili'));
   await page.locator('[data-symbol="sun"]').click();await page.locator('[data-action="verify-sequence"]').click();
   assert.ok((await page.locator('#feedback').textContent()).includes('ešte nesedí'));
   await page.locator('[data-action="clear-sequence"]').click();await page.locator('[data-symbol="moon"]').click();
   await page.locator('[data-action="hint"]').click();assert.ok((await page.locator('#sequence').textContent()).includes('☾'));
   await page.locator('[data-symbol="sun"]').click();await page.locator('[data-symbol="star"]').click();await page.locator('[data-action="verify-sequence"]').click();
  }else{await page.locator('#answer').fill(legacyAnswers[i-1][0].toLowerCase());await page.locator('.answer-form button').click();}
  assert.equal(await page.locator('.success-card').count(),1,`stage ${i} completes`);await noAtlas();
  if(i<=6)assert.equal(await page.locator('.success-character').count(),1);
  if(i===4){await page.reload();assert.equal(await page.locator('.success-card').count(),1,'reload does not lose unread resolution');}
  const resolution=await readScene(page);entireJourney+=resolution;
  if(i===4){assert.ok(resolution.includes('OCHRANA AKTÍVNA.'));assert.ok(resolution.includes('vôbec nie je pokazené'));}
  if(i===6){assert.ok(resolution.includes('dve obrazovky rozžiarili'));assert.ok(resolution.includes('Takže to nebola porucha.'));}
  if(i===8){assert.ok(resolution.includes('Ryško prechádza ako predposledný.'));assert.ok(resolution.includes('Piko. Poď.'));}
  await page.locator('[data-action="next"]').click();
 }
 assert.equal(await page.locator('.finale').count(),1);entireJourney+=await readScene(page);
 assert.ok(entireJourney.includes('Ochranné pole obnovené'));
 assert.equal(await page.locator('.finale .contact.connected').count(),7);
 assert.equal(await page.locator('.finale .contact small').first().textContent(),'Doma ✓');
 assert.equal(await page.locator('.atlas-cta').count(),1);
 const [bonus]=await Promise.all([page.waitForEvent('popup'),page.locator('.atlas-cta').click()]);
 await bonus.waitForLoadState();assert.ok(bonus.url().endsWith('/atlas.html'));
 assert.equal(await bonus.locator('.atlas-profile').count(),7);await bonus.close();
 await page.reload();assert.equal(await page.locator('.atlas-cta').count(),1,'finished saved game retains bonus');
 await page.locator('[data-action="notebook"]').click();assert.equal(await page.locator('.notebook-row').count(),8);await page.locator('.dialog-close').click();
 await page.locator('[data-action="reset"]').click();await page.locator('.dialog-close').click();assert.equal(await page.locator('.finale').count(),1);
 await page.locator('[data-action="reset"]').click();await page.locator('[data-action="confirm-reset"]').click();await noAtlas();
 // Narrow phone, phone, tablet and desktop layouts.
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});await noOverflow(page,`home ${width}`);}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/mystery-home-mobile.png',fullPage:true});
 await page.locator('.site-header [data-view="prep"]').click();await noOverflow(page,'mobile prep');await noAtlas();
 await page.locator('[data-check="0"]').check();await page.reload();await page.locator('.site-header [data-view="prep"]').click();assert.ok(await page.locator('[data-check="0"]').isChecked());
 await page.locator('.site-header [data-view="designer"]').click();await noOverflow(page,'mobile GM');
 await page.locator('[data-action="test"][data-stage="6"]').click();await readScene(page);await noOverflow(page,'mobile task');await noAtlas();
 await page.screenshot({path:'/tmp/mystery-task-mobile.png',fullPage:true});
 await page.goto(BASE+'/printables.html');assert.equal(await page.locator('.sheet').count(),7);assert.equal(await page.locator('#circles svg').count(),2);await noOverflow(page,'mobile printables');
 await page.emulateMedia({media:'print'});const pdf=await page.pdf({path:'/tmp/mystery-working-print.pdf',format:'A4',printBackground:true});assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length,7,'seven printable sheets fit seven pages');await page.emulateMedia({media:'screen'});
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
 const offline=await browser.newContext({offline:true});const local=await offline.newPage();await local.goto('file://'+require('node:path').resolve('index.html'));await local.locator('[data-action="start"]').click();assert.equal(await local.locator('.message-incoming').count(),1);await local.goto('file://'+require('node:path').resolve('atlas.html'));assert.equal(await local.locator('.atlas-profile').count(),7);await offline.close();
 const restricted=await browser.newContext();await restricted.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage disabled');}}));const guest=await restricted.newPage();await guest.route('**/assets/PicoVideo.mp4',route=>route.fulfill({status:404,body:'Missing video'}));const guestErrors=[];guest.on('pageerror',e=>guestErrors.push(e.message));await guest.goto(BASE);await guest.locator('[data-action="start"]').click();await guest.locator('[data-action="accept-call"]').click();
 await guest.locator('#message-video-status').waitFor({state:'visible'});
 assert.ok(!(await guest.locator('.message-screen').textContent()).includes('kúpeľ'));
 assert.ok(!(await guest.locator('[data-action="finish-call"]').isVisible()),'failed media does not reveal next task');
 await guest.locator('.message-status [data-action="close"]').click();
 assert.equal(await guest.locator('.hero').count(),1);assert.deepEqual(guestErrors,[]);await restricted.close();
 // Incoming and opened messages fill small phones and landscape without horizontal overflow.
 await page.goto(BASE);await page.evaluate(()=>localStorage.removeItem('zahada-v1-progress'));await page.reload();
 for(const [width,height] of [[320,640],[390,844],[844,390],[1440,1100]]){
   await page.setViewportSize({width,height});await page.locator('[data-action="start"]').click();
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
 console.log('PASS: complete V2 dialogue journey, twist timing, seven safe returns, V1 saves, reader persistence, wrong answers/hints, GM isolation, finale-only atlas CTA, full static atlas without JS or gameplay, seven sprite crops, mobile/tablet/desktop, seven print pages, offline files and unavailable storage/video, full-screen message with the supplied PicoVideo.mp4, video replay, restored message and spoiler-free failures.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
