import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../dist/', import.meta.url));
const output = fileURLToPath(new URL('../public-dist/', import.meta.url));
const excluded = ['posts.js', 'assets/blog', 'assets/katex'];
const allowed = file => !excluded.some(entry => file === entry || file.startsWith(`${entry}/`));

if (!process.argv.includes('--check')) {
  await rm(output, {recursive: true, force: true});
  await mkdir(output, {recursive: true});
  await cp(source, output, {recursive: true, filter: file => allowed(path.relative(source, file))});
  const htmlPath = path.join(output, 'index.html');
  const html = (await readFile(htmlPath, 'utf8'))
    .replace(/^.*assets\/katex\/katex\.min\.css.*\n/gm, '')
    .replace(/^.*<script src="posts\.js".*\n/gm, '')
    .replace(/^.*data-route="blog".*\n/gm, '');
  await writeFile(htmlPath, html);
  const appPath = path.join(output, 'app.js');
  const app = (await readFile(appPath, 'utf8'))
    .replace(/function blogView\(slug\) \{[\s\S]*?(?=function cvView\()/, '')
    .replace(/, blog:\(\) => blogView\(path\.split\('\/'\)\[2\]\)/, '')
    .replace(/^.*const postTitle =.*\n/gm, '')
    .replace('${postTitle || label}', '${label}')
    .replace(" : route === 'blog' ? path.split('/')[3] : null", ' : null');
  await writeFile(appPath, app);
  const contentPath = path.join(output, 'content.js');
  await writeFile(contentPath, (await readFile(contentPath, 'utf8'))
    .replaceAll('#/blog/are-we-overthinking-one-step-generation', 'https://github.com/JaeyeonKim01/priming'));
}

async function verify(dir) {
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    const file = path.join(dir, entry.name);
    if (!allowed(path.relative(output, file))) throw new Error(`Private blog artifact in public build: ${file}`);
    if (entry.isDirectory()) await verify(file);
  }
}
await verify(output);
const publicHtml = await readFile(path.join(output, 'index.html'), 'utf8');
const publicApp = await readFile(path.join(output, 'app.js'), 'utf8');
const publicContent = await readFile(path.join(output, 'content.js'), 'utf8');
if (/posts\.js|data-route="blog"/.test(publicHtml) || /function blogView|blog:\(\)/.test(publicApp) || publicContent.includes('#/blog/')) {
  throw new Error('The public build must not expose the local blog.');
}
console.log('Public build verified: blog drafts and assets excluded.');
