// Behavioral boundaries introduced by V5 / Etapa 1.
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // No purchases, private navigation or legacy continue buttons leak into the funnel.
    for (const [width,height] of [[320,640],[390,844],[768,1024],[1440,1000]]) {
      await page.setViewportSize({width,height});
      await page.goto(BASE);
      assert.equal(await page.locator('a[href="parent.html"],a[href="game.html"],a[href="storyboard.html"],a[href*="printables"],a[href="atlas.html"],[data-view],[data-action="start"]').count(),0);
      assert.ok(!/29,99|19,99|Bežná cena|15–20/.test(await page.locator('body').innerText()));
      const cta = page.locator('.sales-hero [data-action="purchase"]');
      const box = await cta.boundingBox();
      assert.ok(box.y >= 0 && box.y + box.height <= height,`hero purchase visible without scrolling at ${width}`);
      assert.ok((await cta.textContent()).includes('14,99 €'));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({path:`/tmp/v5-funnel-${width}.png`});
    }
    await page.evaluate(() => localStorage.setItem('zahada-v1-progress', JSON.stringify({started:true,callDone:true,stage:4,completed:[1,2,3],hints:{4:1}})));
    await page.reload();
    assert.equal(await page.locator('[data-action="start"],[data-action="restart-adventure"]').count(),0);
    const savedGame = await page.evaluate(() => localStorage.getItem('zahada-v1-progress'));
    for (const cta of await page.locator('[data-action="purchase"]').all()) {
      await cta.click();
      assert.ok((await page.locator('dialog').innerText()).includes('Predaj pripravujeme'));
      assert.equal(await page.locator('dialog a,dialog input,dialog form,[data-action="preview-customer"]').count(),0);
      await page.locator('.dialog-close').click();
    }
    assert.equal(await page.evaluate(() => localStorage.getItem('zahada-v1-progress')),savedGame);
    await page.goto(BASE+'/parent.html');
    assert.equal(await page.locator('a[href="index.html"],a[href="storyboard.html"],a[href*="admin"]').count(),0);
    const start = page.locator('[data-action="start"]');
    assert.ok(await start.isDisabled());
    // Guard the action itself, not only the disabled appearance.
    await start.evaluate(button => {button.disabled = false;button.click();});
    assert.equal(await page.locator('dialog[open]').count(),0);
    assert.equal(await page.evaluate(() => localStorage.getItem('zahada-v1-progress')),savedGame);
    for (const input of await page.locator('[data-check]:not([data-check="device-understood"])').all()) await input.check();
    assert.equal(await page.locator('#prep-progress').getAttribute('max'),'12');
    assert.equal(await page.locator('#prep-progress').evaluate(el => el.value),12);
    assert.ok(await start.isDisabled(),'all placements still require device confirmation');
    assert.ok((await page.locator('.device-notice').innerText()).includes('Hru spustite na telefóne'));
    await page.locator('[data-check="device-understood"]').check();
    assert.ok(await start.isEnabled());
    await page.reload();
    assert.equal(await page.locator('[data-check]:checked').count(),13);
    assert.ok(await start.isEnabled(),'local reload retains preparation and consent');
    await page.locator('[data-check="bathroom"]').uncheck();
    assert.ok(await start.isDisabled(),'undoing any mandatory placement relocks launch');
    await page.locator('[data-check="bathroom"]').check();
    // Check all links and actual downloads including the composed bundle.
    for (const id of ['p1','p2','p3','p4','p5','p6','diplom','vsetky-materialy']) {
      const response = await page.request.get(BASE+`/assets/printables/${id}.pdf`);
      assert.equal(response.status(),200);
      assert.equal((await response.body()).subarray(0,5).toString(),'%PDF-');
      const download = page.waitForEvent('download');
      await page.locator(`a[download][href="assets/printables/${id}.pdf"]`).click();
      assert.equal((await download).suggestedFilename(),id+'.pdf');
    }
    for (const link of await page.locator('a[href^="printables.html?sheet="]').all()) {
      const href = await link.getAttribute('href');
      const sheet = new URL(href,BASE).searchParams.get('sheet');
      const preview = await context.newPage();
      await preview.goto(new URL(href,BASE).href);
      assert.equal(await preview.locator('.sheet:visible').count(),1);
      assert.equal(await preview.locator('.sheet:visible').getAttribute('id'),sheet);
      await preview.close();
    }
    assert.equal(await page.locator('.extra-card').count(),4);
    assert.equal(await page.locator('.extra-card[data-product-state="coming-soon"]').count(),4);
    assert.deepEqual(await page.locator('.extra-card .extra-price').allTextContents(),['4,99 €','2,99 €','2,99 €','2,99 €']);
    assert.ok((await page.locator('.bundle-card .extra-price').textContent()).includes('19,99 €'));
    assert.equal(await page.locator('.extras-section button:enabled').count(),0);
    await page.setViewportSize({width:390,height:844});
    await page.locator('#spustit').scrollIntoViewIfNeeded();
    await page.screenshot({path:'/tmp/v5-launch-mobile.png'});
    await start.click();
    assert.ok(page.url().endsWith('/game.html'));
    assert.equal(await page.locator('.signal-task').count(),1,'old saved task resumes');
    assert.equal(await page.locator('a[href="index.html"],a[href="storyboard.html"]').count(),0);
    await page.locator('[data-action="home"]').click();
    assert.ok(page.url().endsWith('/parent.html'));
    // Production cannot activate from these static test adapters, even with a complete checklist.
    await page.route('**/site-config.js', async route => {
      const response = await route.fetch();
      const source = (await response.text()).replace("mode:'test'","mode:'production'");
      await route.fulfill({response,body:source});
    });
    for (const entry of ['parent.html','game.html','storyboard.html']) {
      await page.goto(BASE+'/'+entry);
      assert.ok((await page.locator('#app').innerText()).includes('serverové overenie nákupu'));
      assert.equal(await page.locator('[data-action="start"],[data-action="test"],a[download],.storyboard').count(),0);
    }
    await page.unroute('**/site-config.js');
    // Storage-disabled browsers can prepare and play in memory, without claiming persistence.
    const noStorage = await browser.newContext();
    await noStorage.addInitScript(() => Object.defineProperty(window,'localStorage',{get(){throw Error('unavailable');}}));
    const guest = await noStorage.newPage();
    await guest.goto(BASE+'/parent.html');
    for (const input of await guest.locator('[data-check]').all()) await input.check();
    assert.ok(await guest.locator('[data-action="start"]').isEnabled());
    await guest.locator('[data-action="start"]').click();
    assert.equal(await guest.locator('.message-incoming').count(),1);
    await noStorage.close();
    // Equivalent legacy checks migrate; broad old placement cannot attest every new placement.
    const legacy = await browser.newContext();
    const old = await legacy.newPage();
    await old.goto(BASE);
    await old.evaluate(() => {for(let i=0;i<6;i++)localStorage.setItem('zahada-prep-'+i,'1');});
    await old.goto(BASE+'/parent.html');
    assert.equal(await old.locator('[data-check]:checked').count(),3);
    assert.ok(await old.locator('[data-action="start"]').isDisabled());
    await legacy.close();
    assert.deepEqual(errors,[]);
    await context.close();
    console.log('PASS: mobile hero CTA, funnel isolation, one honest purchase integration, unchanged saves, 12 mandatory preparation steps plus phone confirmation, launch guard, persistent local checklist, individual and bundled downloads, configured proposals, production denial, storage fallback and legacy preparation migration.');
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exit(1);});
