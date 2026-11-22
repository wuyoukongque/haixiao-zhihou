const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/Users/lincoln/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BOOK_TEST_URL || 'http://127.0.0.1:5188/';
const out = process.env.BOOK_QA_DIR || '/private/tmp/book-entrypoint-qa';
const cases = [
  ['', 'shelf'],
  ['?book=haixiao-zhihou#read', 'reader', 'haixiao-zhihou', 'pre'],
  ['?book=ai-native-enterprise#read', 'reader', 'ai-native-enterprise', 'u0'],
  ['海啸.html', 'cover', 'haixiao-zhihou'],
  ['海啸.html#c1/page-2', 'reader', 'haixiao-zhihou', 'c1', 2],
];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const results = [];
  try {
    for (const [route, view, book, chapter, pageNumber] of cases) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.route('https://fonts.googleapis.com/**', r => r.abort());
      const result = { route, view, errors };
      try {
        const response = await page.goto(new URL(route, base).href, { waitUntil: 'networkidle', timeout: 45000 });
        result.status = response.status();
        if (view === 'shelf') await page.locator('.bookshelf article').nth(1).waitFor({ timeout: 12000 });
        else {
          await page.waitForFunction(id => window.BOOK?.id === id, book, { timeout: 12000 });
          if (view === 'cover') await page.getByRole('button', { name: '开始阅读', exact: true }).waitFor();
          else if (pageNumber > 1) {
            await page.waitForFunction(({ id, cid, n }) => {
              const saved = JSON.parse(localStorage.getItem('mindsleap-book:' + id) || 'null');
              return saved?.chapterId === cid && saved?.pageIndex === n - 1 && document.querySelector('.reader-body')?.textContent.trim();
            }, { id: book, cid: chapter, n: pageNumber }, { timeout: 12000 });
          } else await page.waitForFunction(cid => document.querySelector('.reader-body h1')?.textContent === window.BOOK?.chapterPages[cid]?.[0].title, chapter, { timeout: 12000 });
        }
        if (pageNumber && !page.url().endsWith('/page-' + pageNumber)) throw Error('Lost page location: ' + page.url());
        if (errors.length) throw Error(errors.join('; '));
        if (await page.locator('audio,video,button[aria-label="播客"]').count()) throw Error('Audio remains');
        result.pass = true;
      } catch (e) { result.pass = false; result.failure = e.message; }
      result.url = page.url();
      result.text = (await page.locator('body').innerText()).slice(0, 180);
      await page.screenshot({ path: path.join(out, `entry-${results.length}.png`), fullPage: true });
      results.push(result);
      await page.close();
    }
    fs.writeFileSync(path.join(out, 'entrypoints.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
    if (results.some(r => !r.pass)) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
