const {chromium}=require(process.env.PLAYWRIGHT_PATH || '/Users/lincoln/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.BOOK_TEST_URL || 'http://127.0.0.1:5188/';
const out=process.env.BOOK_QA_DIR || '/Users/lincoln/Documents/Playground/_book_revisions/library-qa-2026-11-20';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const results=[];
 try{
  for(const width of [1440,390,320]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://fonts.googleapis.com/**',r=>r.abort());
   await page.goto(base);
   await page.locator('.bookshelf article').first().waitFor();
   if(await page.locator('.bookshelf article').count()!==2)throw Error('Missing books');
   await page.screenshot({path:path.join(out,`shelf-${width}.png`),fullPage:true});
   for(const id of ['haixiao-zhihou','ai-native-enterprise']){
    await page.goto(base+'?book='+id+'#read');
    await page.locator('.reader-body > *').first().waitFor();
    await page.waitForTimeout(200);
    const first=await page.evaluate(()=>window.BOOK.toc[0].chapters[0].id);
    await page.getByRole('button',{name:'下一页',exact:true}).click();
    await page.waitForTimeout(100);
    const saved=await page.evaluate(id=>JSON.parse(localStorage.getItem('mindsleap-book:'+id)),id);
    if(saved.pageIndex!==1)throw Error('Bookmark not saved '+JSON.stringify(saved));
    await page.reload();
    await page.locator('.reader-body > *').first().waitFor();
    await page.waitForTimeout(200);
    if(!page.url().endsWith('/page-2'))throw Error('Bookmark not restored '+page.url());
    await page.getByRole('button',{name:'字号',exact:true}).click();
    await page.getByRole('button',{name:'夜间',exact:true}).click();
    await page.getByRole('button',{name:'完成',exact:true}).click();
    if(await page.locator('html').getAttribute('data-theme')!=='night')throw Error('Theme failed');
    await page.screenshot({path:path.join(out,`${id}-night-${width}.png`)});
    await page.getByRole('button',{name:'字号',exact:true}).click();
    await page.getByRole('button',{name:'日间',exact:true}).click();
    await page.getByRole('button',{name:'完成',exact:true}).click();
    await page.getByRole('button',{name:'目录',exact:true}).click();
    await page.screenshot({path:path.join(out,`${id}-toc-${width}.png`),fullPage:true});
    const units=await page.evaluate(()=>window.BOOK.toc.flatMap(p=>p.chapters).map(c=>c.id));
    if(id==='ai-native-enterprise' && units.length!==18)throw Error('Missing manuscript units');
    for(const unit of units){
      await page.goto(base+'?book='+id+'#'+unit+'/page-1');
      await page.locator('.reader-body > *').first().waitFor();
      if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow '+id+' '+unit+' '+width);
      const text=await page.locator('.reader-body').innerText();
      if(!text.trim())throw Error('Blank chapter');
    }
    await page.goto(base+'?book='+id);
    await page.getByRole('link',{name:'返回书架',exact:true}).click();
    await page.locator('.bookshelf').waitFor();
   }
   if(errors.length)throw Error(errors.join('\n'));
   results.push({width,books:2,units:32,bookmarks:'pass',themes:'pass',navigation:'pass',errors});
   await page.close();
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify(results));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
