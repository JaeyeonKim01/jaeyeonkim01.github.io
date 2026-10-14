import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../dist/', import.meta.url));
const output = fileURLToPath(new URL('../public-dist/', import.meta.url));

if (!process.argv.includes('--check')) {
  await rm(output, {recursive: true, force: true});
  await mkdir(output, {recursive: true});
  await cp(source, output, {recursive: true});
}

const html = await readFile(path.join(output, 'index.html'), 'utf8');
const app = await readFile(path.join(output, 'app.js'), 'utf8');
const posts = await readFile(path.join(output, 'posts.js'), 'utf8');
if (!html.includes('data-route="blog"') || !app.includes('function blogView') || !posts.includes('are-we-overthinking-one-step-generation')) {
  throw new Error('The public build must include the published blog.');
}
for (const file of ['assets/katex/katex.min.css', 'assets/blog/priming/gallery.js', 'assets/blog/priming/qualitative/gallery.json']) {
  await readFile(path.join(output, file));
}
console.log('Public build verified: homepage, published blog, math, and sample playground included.');
