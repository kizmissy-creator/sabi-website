const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const pages = [[0,1],[1,1],[18,1],[2,2],[3,2],[4,1],[5,1],[6,1],[19,1],[12,2],[11,1],[10,1],[7,1],[8,1],[13,1],[14,1],[9,1],[17,1],[16,1]];
    const output = path.resolve('test-artifacts');
    fs.mkdirSync(output, { recursive: true });
    for (const width of [320,390,1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [section,count] of pages) {
        for (let question=0; question<count; question++) {
          await page.goto(`http://127.0.0.1:5193/follow-up/#section=${section}&question=${question}`);
          await page.locator('main').waitFor();
          const audit = await page.evaluate(() => {
            const visible = element => element.getClientRects().length > 0;
            const inputs = [...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(visible);
            return {
              overflow: document.documentElement.scrollWidth > innerWidth,
              missingLabels: inputs.filter(el => !el.labels?.length && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')).map(el=>el.outerHTML.slice(0,160)),
              brokenImages: [...document.images].filter(visible).filter(el => el.complete && !el.naturalWidth).map(el=>el.src),
              mainText: document.querySelector('main').innerText.length,
            };
          });
          assert.equal(audit.overflow,false,`overflow: ${width}/${section}/${question}`);
          assert.deepEqual(audit.missingLabels,[],`labels: ${width}/${section}/${question}`);
          assert.deepEqual(audit.brokenImages,[],`images: ${width}/${section}/${question}`);
          assert.ok(audit.mainText>60);
          if ([1,3,9,14].includes(section) && question===0 && width!==1280)
            await page.screenshot({path:path.join(output,`launch-${section}-${width}.png`),fullPage:true});
        }
      }
    }
    await page.goto('http://127.0.0.1:5193/follow-up/#section=17&question=0');
    await page.locator('#reviewNotes').fill('LOCAL MOCK ONLY: final client-mode check.');
    await page.reload();
    assert.equal(await page.locator('#reviewNotes').inputValue(),'LOCAL MOCK ONLY: final client-mode check.');
    let payload;
    await page.route('**/api/follow-up-submit', async route => {
      payload = JSON.parse(route.request().postData());
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,submissionId:payload.submissionId})});
    });
    await page.getByRole('button',{name:'Send follow-up to SABI',exact:true}).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('heading',{name:/received|thank|sent/i}).waitFor();
    assert.equal(payload.testMode,false);
    assert.equal(payload.answers.reviewNotes,'LOCAL MOCK ONLY: final client-mode check.');
    assert.deepEqual(errors,[]);
    console.log('PASS: 22 pages at 320/390/1280px; labels, images, overflow, saved draft reload and keyboard client-mode mock submission.');
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
