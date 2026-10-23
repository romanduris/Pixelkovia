// Use external Playwright and jsQR modules, as described in README.md.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const jsQR=require(process.env.JSQR_MODULE||'jsqr');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080';
const KEY='zahada-v1-progress';
(async()=>{const browser=await chromium.launch({headless:true});try{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(()=>{HTMLElement.prototype.requestFullscreen=async()=>{};});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE+'/parent.html');
  for(const checkbox of await page.locator('[data-check]').all())await checkbox.check();
  await page.locator('[data-action="start"]').click();
  const intro=await page.locator('.quest-story').innerText();
  assert.equal(await page.locator('[data-action="read-message"],[data-action="finish-call"]').count(),0);
  await page.locator('[data-action="accept-call"]').click();
  await page.locator('video').evaluate(video=>{window.previousPikoVideo=video;video.playbackRate=16;});
  await page.waitForFunction(()=>document.querySelector('video')?.ended);
  assert.deepEqual(await page.locator('.message-actions button').allTextContents(),['▷ Prehrať znova','Späť k správe']);
  const afterVideo=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
  assert.equal(afterVideo.stage,0);assert.equal(afterVideo.callDone,false);
  await page.locator('[data-action="back-to-message"]').click();
  assert.equal(await page.locator('.quest-story').innerText(),intro);
  assert.equal(await page.locator('dialog video').count(),0);
  assert.ok(await page.evaluate(()=>window.previousPikoVideo.paused));
  assert.equal(await page.locator('.signal-restore').count(),0);
  assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).callDone,KEY),false);

  // Decode the actual printed SVG, then follow its link as a phone camera would.
  const printed=await context.newPage();await printed.goto(BASE+'/printables.html?sheet=p1');
  const pixels=await printed.locator('.qr-mockup img').evaluate(async img=>{
    await img.decode();const canvas=document.createElement('canvas');canvas.width=392;canvas.height=392;
    const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,392,392);
    return Array.from(ctx.getImageData(0,0,392,392).data);
  });
  const decoded=jsQR(new Uint8ClampedArray(pixels),392,392);
  assert.ok(decoded,'the printed QR must decode');
  assert.equal(decoded.data,await printed.evaluate(()=>GAME.kvakQr));
  const url=new URL(decoded.data),scanUrl=BASE+url.pathname+url.search;
  assert.equal(url.protocol,'https:');assert.equal(url.searchParams.get('signal'),'kvak');
  await page.goto(scanUrl);await page.locator('.signal-restore').waitFor();
  assert.equal(await page.locator('#answer').getAttribute('maxlength'),'6');
  assert.equal(await page.locator('dialog[open]').count(),0);
  await page.reload();await page.locator('.signal-restore').waitFor();
  assert.equal(await page.locator('.quest-story').count(),0);
  await page.locator('#answer').fill('741296');await page.locator('.answer-form button').click();
  assert.match(await page.locator('.signal-reward').innerText(),/S[\s\S]*zapamätajte[\s\S]*neskôr/);
  assert.equal(await page.locator('[data-action="next"],[data-action="notebook"]').count(),0);
  await printed.goto(BASE+'/printables.html?sheet=p2');
  assert.equal(await printed.locator('#p2 .worksheet-entry-qr').count(),0,'Iskra has no QR');
  assert.ok(!/QR/.test(await printed.locator('#p2').innerText()),'Iskra has no QR instructions');
  await printed.goto(BASE+'/printables.html?sheet=p3');
  assert.equal(await printed.locator('#p3 .worksheet-heading .worksheet-entry-qr').count(),0,'Sutko QR is below the paper puzzle');
  assert.ok(await printed.locator('#p3 .sutko-phone-panel .worksheet-entry-qr').isVisible());
  assert.match(await printed.locator('#p3 .worksheet-mission').innerText(),/všetky tri hodnoty[\s\S]*naskenujte QR/);
  const sutkoPixels=await printed.locator('.worksheet-entry-qr img').evaluate(async img=>{
    await img.decode();const canvas=document.createElement('canvas');canvas.width=392;canvas.height=392;
    const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,392,392);
    return Array.from(ctx.getImageData(0,0,392,392).data);
  });
  const sutko=jsQR(new Uint8ClampedArray(sutkoPixels),392,392);
  assert.equal(sutko?.data,await printed.evaluate(()=>GAME.sutkoQr),'the P3 QR must decode to Sutko');
  const sutkoUrl=new URL(sutko.data),sutkoScan=BASE+sutkoUrl.pathname+sutkoUrl.search;
  await page.goto(sutkoScan);
  assert.equal(await page.locator('.signal-content h1').innerText(),'Úloha 3 – Pod stoličkou');
  assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).completed,KEY),[1,2]);
  const advanced={started:true,callDone:true,stage:4,completed:[1,2,3],hints:{4:1},scenePages:{},messageWatched:true};
  await page.evaluate(({key,saved})=>localStorage.setItem(key,JSON.stringify(saved)),{key:KEY,saved:advanced});
  await page.goto(sutkoScan);
  assert.equal(await page.locator('.signal-content h1').innerText(),'Úloha 4 – Pri topánkach');
  assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY),advanced);

  // Legacy text-mode saves open the video, without bringing the removed option back.
  await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({started:true,callDone:false,stage:0,completed:[],messageRead:true,messageOpened:true})),KEY);
  await page.goto(BASE+'/parent.html');await page.locator('[data-action="start"]').click();
  assert.equal(await page.locator('dialog video').count(),1);
  assert.equal(await page.locator('[data-action="read-message"],[data-action="finish-call"]').count(),0);

  const fresh=await browser.newContext(),freshPage=await fresh.newPage();
  await freshPage.goto(BASE+'/game.html?signal=iskra');
  assert.equal(await freshPage.locator('[data-story-stage="document"]').count(),0,'the old Iskra URL has no task page');
  await freshPage.goto(BASE+'/game.html?signal=unknown');
  assert.equal(await freshPage.locator('.signal-restore').count(),0);
  await freshPage.goto(sutkoScan);await freshPage.locator('.signal-restore').waitFor();
  assert.deepEqual(await freshPage.evaluate(key=>JSON.parse(localStorage.getItem(key)).completed,KEY),[],'P3 cannot skip Kvak’s code');
  await fresh.close();

  for(const [width,height] of [[320,568],[390,844],[844,390]]){
    const phone=await browser.newContext({viewport:{width,height}});
    await phone.addInitScript(()=>{HTMLElement.prototype.requestFullscreen=async()=>{};});
    const preview=await phone.newPage();await preview.goto(BASE+'/storyboard.html');
    await preview.locator('[data-action="test"][data-stage="0"]').click();
    const fits=()=>preview.locator('dialog').evaluate(node=>node.scrollHeight<=node.clientHeight&&node.scrollWidth<=node.clientWidth);
    assert.ok(await fits(),`intro fits ${width}×${height}`);
    await preview.screenshot({path:`/tmp/intro-qr-${width}.png`});
    await preview.locator('[data-action="accept-call"]').click();
    await preview.locator('video').evaluate(video=>{video.playbackRate=16;});
    await preview.waitForFunction(()=>document.querySelector('video')?.ended);
    assert.ok(await fits(),`video and both actions fit ${width}×${height}`);
    await preview.screenshot({path:`/tmp/intro-qr-video-${width}.png`});
    await preview.locator('[data-action="back-to-message"]').click();
    assert.equal(await preview.locator('.message-incoming').count(),1);
    assert.equal(await preview.evaluate(key=>localStorage.getItem(key),KEY),null,'isolated intro test preserves family progress');
    await preview.goto(BASE+'/game.html?signal=kvak');
    const terminalFits=()=>preview.locator('#app').evaluate(node=>node.scrollHeight<=node.clientHeight&&node.scrollWidth<=node.clientWidth);
    assert.ok(await terminalFits(),`code terminal fits ${width}×${height}`);
    const portraits=await preview.locator('.party-sprite').evaluateAll(nodes=>nodes.map(node=>[node.getBoundingClientRect().width,node.getBoundingClientRect().height]));
    assert.deepEqual(portraits[0],portraits[1],'Piko and Kvak have equal portrait sizes');
    await preview.locator('#answer').fill('000000');await preview.locator('.answer-form button').click();
    assert.ok(await terminalFits(),`wrong-code feedback fits ${width}×${height}`);
    await preview.locator('#answer').fill('741296');await preview.locator('.answer-form button').click();
    await preview.locator('.signal-connected').waitFor();
    assert.ok(await terminalFits(),`connection and S reminder fit ${width}×${height}`);
    assert.equal(await preview.locator('[data-action="next"],[data-action="notebook"]').count(),0);
    await phone.close();
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: video ends the intro, replay/back only, P1/P3 QRs decode and start Kvak/Sutko, Iskra stays offline, old URLs and advanced progress stay compatible, phone and landscape fit.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exit(1);});
