import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium-browser') ? '/usr/bin/chromium-browser' : undefined);
const browser = await chromium.launch({executablePath, headless:true, args:['--no-sandbox','--disable-dev-shm-usage']});
await mkdir(new URL('../qa/',import.meta.url),{recursive:true});
const errors = [];
const checks = [];
const page = await browser.newPage({viewport:{width:1440,height:1000}, deviceScaleFactor:1});
page.on('pageerror',error => errors.push(error.message));
page.on('response',response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
const screenshot = name => page.screenshot({path:new URL(`../qa/${name}.png`,import.meta.url).pathname,fullPage:true,animations:'disabled'});
async function noOverflow(label) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label}: horizontal overflow`);
  checks.push(`${label}: no horizontal overflow`);
}
try {
  await page.goto(base, {waitUntil:'networkidle'});
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator('.hero h1').textContent(),'Jaeyeon Kim');
  const firstCards = await page.locator('.research-section .paper-row').evaluateAll(items => items.slice(0,2).map(item => ({x:item.getBoundingClientRect().x,y:item.getBoundingClientRect().y})));
  assert.equal(firstCards[0].y,firstCards[1].y);
  assert(firstCards[1].x > firstCards[0].x);
  assert.equal(await page.locator('[data-paper-id="park2026overthinking"] .paper-visual img').getAttribute('src'),'assets/papers/priming_teaser.gif');
  assert.equal(await page.locator('[data-paper-id="park2026overthinking"] .paper-visual').getAttribute('href'),'https://github.com/JaeyeonKim01/priming');
  checks.push('Desktop publications have two columns; priming teaser links to Code');
  assert.equal(await page.locator('.paper-row').count(),6);
  assert.equal(await page.locator('.news-list li').count(),5);
  assert(await page.locator('.portrait').evaluate(image => image.complete && image.naturalWidth > 0));
  const sections = page.locator('.research-section, .updates, .background-section');
  const boxes = await sections.evaluateAll(items => items.map(item => ({top:item.getBoundingClientRect().top,bottom:item.getBoundingClientRect().bottom})));
  assert.equal(boxes.length,3);
  assert.deepEqual(await sections.evaluateAll(items => items.map(item => item.querySelector('h2').textContent)), ['News','Selected publications','Background']);
  assert.equal(await page.locator('.intro > p').count(),3);
  assert(!(await page.locator('main').innerText()).includes('—'));
  assert(await page.evaluate(() => document.fonts.check('300 16px Roboto')));
  const news = page.locator('.news-scroll');
  assert(await news.evaluate(el => el.scrollHeight > el.clientHeight));
  await news.focus();
  await page.keyboard.press('End');
  await page.waitForTimeout(250);
  assert(await news.evaluate(el => el.scrollTop > 0));
  await news.evaluate(el => { el.scrollTop = 0; el.blur(); });
  checks.push('Roboto loads, intro has three paragraphs without em dashes, and News scrolls with the keyboard');
  assert(boxes[0].bottom <= boxes[1].top && boxes[1].bottom <= boxes[2].top);
  assert.equal(await page.locator('.paper-visual img').count(),6);
  assert.equal(await page.locator('.research-section [data-paper-id="kim2023time"]').count(),1);
  assert(await page.locator('.paper-visual img[src$=".gif"]').count() > 0);
  checks.push('News, Publications, Background stack vertically; paper figures and GIFs are retained');
  const priming = page.locator('[data-paper-id="park2026overthinking"]');
  assert.match(await priming.locator('.authors').innerText(), /W\. Park\*, J\. Kim\*, Y\. Du, S\. Chen, B\. Han/);
  assert.equal(await priming.getByRole('link',{name:'Code',exact:true}).getAttribute('href'),'https://github.com/JaeyeonKim01/priming');
  assert.equal(await priming.locator('h3 a').count(),0);
  assert.equal(await priming.getByRole('link',{name:'Paper',exact:true}).count(),0);
  checks.push('One-Step Generation has the supplied authors, Code link, and no placeholder paper link');
  await noOverflow('Desktop home');
  await screenshot('home-desktop');
  checks.push('Home: profile, six selected publications, five news items, portrait');

  await page.locator('#main-nav a[data-route="research"]').click();
  await page.locator('main[data-page="research"]').waitFor();
  assert.equal(await page.locator('.paper-row').count(),18);
  const papers = await page.evaluate(() => window.SITE_DATA.papers);
  assert.equal(new Set(papers.map(paper => paper.id)).size, papers.length);
  for (const suffix of ['2610.05518', '2609.38806', '2608.06628', '2607.26504', '58ab04c0f94a2d3e4458f25e4810993bc5fc187d.pdf']) {
    assert.equal(papers.filter(paper => paper.paper.endsWith(suffix)).length, 1);
  }
  await page.locator('#paper-search').fill('Fréchet');
  assert.equal(await page.locator('.paper-row').count(), 1);
  await page.locator('#paper-search').fill('Self-Consistency');
  assert.match(await page.locator('.paper-row').innerText(), /M\. Lee\*, J\. Kim\*/);
  checks.push('All five requested papers appear once, with verified paper links and equal-contribution marks');
  await page.locator('#paper-search').fill('LoRA');
  assert.equal(await page.locator('.paper-row').count(),1);
  assert.match(await page.locator('.paper-row').innerText(),/LoRA Training/);
  await page.locator('#paper-search').fill('no-such-publication');
  assert.equal(await page.locator('.paper-row').count(),0);
  await page.locator('#reset-filters').click();
  assert.equal(await page.locator('.paper-row').count(),18);
  await page.locator('#paper-year').selectOption('2024');
  assert.equal(await page.locator('.paper-row').count(),2);
  assert.match(await page.locator('.paper-meta').allTextContents().then(items => items.join(' ')), /TMLR/);
  await page.locator('#paper-year').selectOption('all');
  await page.getByRole('button',{name:'Discrete diffusion',exact:true}).click();
  assert.equal(await page.locator('.paper-row').count(),8);
  await page.getByRole('button',{name:'All work',exact:true}).click();
  await screenshot('research-desktop');
  checks.push('Research: 18 papers, search, zero-results reset, year and topic filters');

  for (const route of ['collaboration','cv']) {
    await page.goto(`${base}/#/${route}`,{waitUntil:'networkidle'});
    assert.equal(await page.locator('main').getAttribute('data-page'),route);
    await noOverflow(`Desktop ${route}`);
    await screenshot(`${route}-desktop`);
  }
  assert.equal(await page.locator('.cv-section').count(),8);
  assert.equal(await page.locator('.cv-section h2').filter({hasText:/^Publications$/}).count(),0);
  const pdf = await page.request.get(`${base}/assets/Jaeyeon_CV.pdf`);
  assert.equal(pdf.status(),200);
  assert((await pdf.body()).subarray(0,4).equals(Buffer.from('%PDF')));
  const honors = page.locator('#section-2');
  await honors.locator('summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(await honors.evaluate(el => el.open), false);
  assert.equal(await honors.locator('.cv-section-body').isVisible(), false);
  await page.getByRole('link',{name:'Honors and Awards',exact:true}).click();
  assert.equal(await honors.evaluate(el => el.open), true);
  await page.waitForTimeout(600);
  assert(await page.locator('#section-2').evaluate(el => Math.abs(el.getBoundingClientRect().top-24)<15));
  assert.match(await page.locator('.cv-sections').innerText(),/Ilju Scholarship/);
  assert.match(await page.locator('.cv-sections').innerText(),/Invited talk \(scheduled\)/);
  checks.push('Collaboration, eight collapsible CV sections, keyboard toggles, jump links reopening sections, and replacement PDF');

  await page.setViewportSize({width:390,height:844});
  await page.goto(base,{waitUntil:'networkidle'});
  await noOverflow('Mobile home');
  await screenshot('home-mobile');
  await page.locator('#main-nav a[data-route="research"]').click();
  await page.locator('main[data-page="research"]').waitFor();
  assert.equal(await page.locator('.paper-row').count(),18);
  await noOverflow('Mobile research');
  await screenshot('research-mobile');
  for (const route of ['collaboration','cv']) {
    await page.goto(`${base}/#/${route}`,{waitUntil:'networkidle'});
    await noOverflow(`Mobile ${route}`);
  }
  await page.setViewportSize({width:320,height:700});
  await page.goto(base,{waitUntil:'networkidle'});
  await noOverflow('Small mobile home');
  checks.push('Mobile navigation, direct routes, and responsive layouts');

  await page.goto(`${base}/#/research?topic=Generative%20modeling`,{waitUntil:'networkidle'});
  assert.equal(await page.locator('.paper-row').count(),5);
  await page.goto(`${base}/#/about`,{waitUntil:'networkidle'});
  await page.waitForURL('**/#/');
  assert.equal(await page.locator('main').getAttribute('data-page'),'home');
  assert.equal(await page.locator('#main-nav a[data-route="about"]').count(),0);
  const background = page.locator('.background-section');
  assert.equal(await background.locator('details').count(),0);
  assert.equal(await background.locator('p').count(),1);
  assert(await background.locator('p').isVisible());
  assert.match(await background.innerText(), /Seoul National University/);
  assert.equal(await background.getByRole('link',{name:'Chanwoo Park',exact:true}).getAttribute('href'),'https://chanwoo-park-official.github.io/');
  await noOverflow('Small mobile background');
  checks.push('Background is visible as one paragraph with Chanwoo Park link');
  checks.push('Former About link redirects home; background is preserved on the homepage');
  assert.equal(await page.locator('#main-nav a[data-route="blog"]').count(),0);
  assert.equal(await page.evaluate(() => 'posts' in window.SITE_DATA),false);
  for (const route of ['blog', 'blog/are-we-overthinking-one-step-generation']) {
    await page.goto(`${base}/#/${route}`,{waitUntil:'networkidle'});
    assert.equal(await page.locator('h1').innerText(),'Page not found.');
  }
  const blogAsset = await page.request.get(`${base}/assets/blog/priming/method.png`);
  assert.equal(blogAsset.status(),404);
  checks.push('Blog navigation, routes, content, and published assets are removed');
  await page.goto(`${base}/#/research`,{waitUntil:'networkidle'});
  const ownNames = page.locator('.authors strong[title^="Jaeyeon Kim"]');
  assert.equal(await ownNames.count(),18);
  assert(await ownNames.evaluateAll(items => items.every(el => getComputedStyle(el).fontWeight === '700')));
  checks.push('Author names remain bold across all 18 publications');
  await page.goto(`${base}/#/missing`,{waitUntil:'networkidle'});
  assert.match(await page.locator('h1').innerText(),/Page not found/);
  checks.push('Topic deep links and missing-page recovery');
  assert.deepEqual(errors,[],'Browser errors or missing local assets');
  const result = {status:'passed',checks,browserErrors:errors};
  await writeFile(new URL('../qa/check-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
} finally { await browser.close(); }
