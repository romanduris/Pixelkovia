// Run: PLAYWRIGHT_MODULE=/path/to/playwright node tests/prototype.test.cjs
// A local server must be running at BASE_URL (default http://127.0.0.1:8080).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync('game-data.js','utf8'),context);
const game=context.window.GAME;
assert.equal(game.stages.length,10);
assert.equal(game.stages.reduce((sum,s)=>sum+s.time.reduce((a,b)=>a+b,0),0),60);
assert.equal(new Set(game.stages.map(s=>s.id)).size,10);
assert.equal(game.characters.length,7);
assert.equal(new Set(game.stages.slice(1,7).map(s=>s.character)).size,6);
const legacyAnswers=[['314'],['OKNO','POD OKNOM'],['9'],['STOL','STÔL'],['246'],['moon,sun,star'],['SPOLU'],['SVETLO']];
assert.equal(JSON.stringify(game.stages.slice(1,9).map(s=>s.answer)),JSON.stringify(legacyAnswers),'V1 answers remain compatible');
assert.ok(!/Viktor|STRÁŽCA/.test(JSON.stringify(game)),'entire story uses Pixelkovia');
assert.equal(game.stages.slice(1,7).map(s=>s.reward).join(''),'SVETLO');
for(const s of game.stages){for(const field of ['story','action','task','materials','mobile','solution','parent','transition'])assert.ok(s[field]?.length>15,`${s.id}: ${field}`);assert.equal(s.time.length,3);}
assert.equal('VWRO'.split('').map(c=>String.fromCharCode(c.charCodeAt(0)-3)).join(''),'STOL');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8080');
  await page.screenshot({path:'/tmp/mystery-home-desktop.png',fullPage:true});
  assert.equal(await page.locator('.chapter-card').count(),8);
  assert.equal(await page.locator('.chapter-card:disabled').count(),8);
  assert.equal(await page.locator('.character-card').count(),7);
  // A saved game from the original story resumes at the same task with matching contacts.
  await page.evaluate(()=>localStorage.setItem('zahada-v1-progress',JSON.stringify({started:true,callDone:true,stage:4,completed:[1,2,3],hints:{4:1}})));
  await page.reload();
  assert.ok((await page.locator('.task-main h1').textContent()).includes('Lístkov'));
  assert.equal(await page.locator('.contact.connected').count(),3);
  assert.equal(await page.locator('#hints p').count(),1);
  await page.evaluate(()=>localStorage.removeItem('zahada-v1-progress'));
  await page.reload();
  await page.locator('.site-header [data-view="designer"]').click();
  assert.equal(await page.locator('.storyboard').count(),10);
  // Stage tests are isolated from real progress.
  await page.locator('[data-action="test"][data-stage="4"]').click();
  await page.locator('#answer').fill('stôl');
  await page.locator('.answer-form button').click();
  assert.ok(await page.locator('.success-card').count());
  assert.equal(await page.evaluate(()=>localStorage.getItem('zahada-v1-progress')),null);
  await page.locator('[data-action="exit-test"]').click();
  await page.locator('[data-action="test"][data-stage="0"]').click();
  await page.locator('.dialog-close').click();
  await page.locator('.site-header [data-view="player"]').click();
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="accept-call"]').click();
  for(let i=0;i<game.call.length;i++)await page.locator('[data-action="call-next"]').click();
  await page.locator('[data-action="finish-call"]').click();
  // Incorrect answers do not advance. Hints preserve typed input and persist.
  await page.locator('#answer').fill('000');
  await page.locator('.answer-form button').click();
  assert.ok((await page.locator('#feedback').textContent()).includes('ešte nesedí'));
  await page.locator('[data-action="hint"]').click();
  assert.equal(await page.locator('#answer').inputValue(),'000');
  await page.reload();
  assert.equal(await page.locator('#hints p').count(),1);
  const answers=['314','okno','9','STÔL','246',null,'spolu','svetlo'];
  for(let i=1;i<=8;i++){
    if(i===6){
      assert.ok(!(await page.locator('.task-main').textContent()).includes('ochranného režimu'),'reveal hidden before answer');
      await page.locator('[data-symbol="sun"]').click();
      await page.locator('[data-action="verify-sequence"]').click();
      assert.ok((await page.locator('#feedback').textContent()).includes('ešte nesedí'));
      await page.locator('[data-action="clear-sequence"]').click();
      await page.locator('[data-symbol="moon"]').click();
      await page.locator('[data-action="hint"]').click();
      assert.ok((await page.locator('#sequence').textContent()).includes('☾'));
      await page.locator('[data-symbol="sun"]').click();
      await page.locator('[data-symbol="star"]').click();
      await page.locator('[data-action="verify-sequence"]').click();
    }else{
      await page.locator('#answer').fill(answers[i-1]);
      await page.locator('.answer-form button').click();
    }
    assert.equal(await page.locator('.success-card').count(),1,`stage ${i} completes`);
    if(i<=6) assert.equal(await page.locator('.success-character').count(),1);
    if(i===6) assert.ok((await page.locator('.success-card').textContent()).includes('ochranného režimu'),'reveal shown after answer');
    await page.locator('[data-action="next"]').click();
  }
  assert.equal(await page.locator('.finale').count(),1);
  await page.reload();assert.equal(await page.locator('.finale').count(),1);
  assert.equal(await page.locator('.finale .contact.connected').count(),6);
  assert.equal(await page.locator('.finale .contact small').first().textContent(),'Doma ✓');
  await page.locator('[data-action="notebook"]').click();
  assert.equal(await page.locator('.notebook-row').count(),8);
  await page.locator('.dialog-close').click();
  await page.locator('[data-action="reset"]').click();
  await page.locator('.dialog-close').click();
  assert.equal(await page.locator('.finale').count(),1,'cancel reset preserves game');
  await page.locator('[data-action="reset"]').click();
  await page.locator('[data-action="confirm-reset"]').click();
  assert.equal(await page.locator('.hero').count(),1);
  // Mobile: no sideways scroll in all principal screens or digital task.
  await page.setViewportSize({width:390,height:844});
  const noOverflow=async(label)=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label);
  await noOverflow('mobile home');
  await page.setViewportSize({width:320,height:760});await noOverflow('small mobile home');
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'/tmp/mystery-home-mobile.png',fullPage:true});
  await page.locator('.site-header [data-view="prep"]').click();await noOverflow('mobile prep');
  await page.locator('[data-check="0"]').check();await page.reload();assert.equal(await page.locator('.hero').count(),1);
  await page.locator('.site-header [data-view="prep"]').click();assert.ok(await page.locator('[data-check="0"]').isChecked());
  await page.locator('.site-header [data-view="designer"]').click();await noOverflow('mobile designer');
  await page.locator('[data-action="test"][data-stage="6"]').click();await noOverflow('mobile digital');
  await page.screenshot({path:'/tmp/mystery-task-mobile.png',fullPage:true});
  await page.goto((process.env.BASE_URL || 'http://127.0.0.1:8080')+'/printables.html');
  assert.equal(await page.locator('.sheet').count(),7);assert.equal(await page.locator('#circles svg').count(),2);
  await noOverflow('mobile printables');
  await page.emulateMedia({media:'print'});
  await page.pdf({path:'/tmp/mystery-working-print.pdf',format:'A4',printBackground:true});
  // Corrupt storage must not break startup.
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8080');
  await page.evaluate(()=>localStorage.setItem('zahada-v1-progress','{broken'));
  await page.reload();assert.equal(await page.locator('.hero').count(),1);
  // Direct HTML opening works without a server or a network connection.
  const offline=await browser.newContext({offline:true});
  const local=await offline.newPage();
  await local.goto('file://'+require('node:path').resolve('index.html'));
  await local.locator('[data-action="start"]').click();
  await local.locator('[data-action="accept-call"]').click();
  assert.ok((await local.locator('.call-line').textContent()).includes('Haló'));
  await offline.close();
  // A disabled localStorage must not stop the game.
  const restricted=await browser.newContext();
  await restricted.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage disabled');}}));
  const guest=await restricted.newPage();
  const guestErrors=[];guest.on('pageerror',e=>guestErrors.push(e.message));
  await guest.goto(process.env.BASE_URL || 'http://127.0.0.1:8080');
  await guest.evaluate(()=>{GAME.audio='assets/not-recorded.mp3';});
  await guest.locator('[data-action="start"]').click();
  await guest.locator('[data-action="accept-call"]').click();
  await guest.locator('#audio-slot').getByText('Zvuk sa nepodarilo načítať.',{exact:false}).waitFor();
  for(let i=0;i<game.call.length;i++)await guest.locator('[data-action="call-next"]').click();
  await guest.locator('[data-action="finish-call"]').click();
  assert.equal(await guest.locator('#answer').count(),1);
  assert.deepEqual(guestErrors,[]);
  await restricted.close();
  assert.deepEqual(errors,[]);
  await browser.close();
  console.log('PASS: Pixelkovia contacts, V1 progress compatibility, reveal timing, content, complete 8-task journey, call, wrong answers, hints, diacritics, persistence, isolated previews, reset, mobile layouts, print assets, offline HTML, disabled storage and missing audio.');
})().catch(e=>{console.error(e);process.exit(1);});
