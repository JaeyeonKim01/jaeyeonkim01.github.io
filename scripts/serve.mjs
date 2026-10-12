import http from 'node:http';
import { createReadStream, watch } from 'node:fs';
import { stat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 5173);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.gif':'image/gif','.pdf':'application/pdf','.woff2':'font/woff2','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8'};
const clients = new Set();
let timer;
const watcher = watch(root, {recursive:true}, () => {
  clearTimeout(timer);
  timer = setTimeout(() => { for (const client of clients) client.write('data: reload\n\n'); }, 180);
});
const liveScript = '<script>const previewEvents=new EventSource("/__preview_events");previewEvents.onmessage=()=>location.reload();</script>';
const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); }
  catch { res.writeHead(400); res.end('Bad request'); return; }
  if (pathname === '/__preview_events') {
    res.writeHead(200, {'Content-Type':'text/event-stream','Connection':'keep-alive'});
    res.write(': ready\n\n'); clients.add(res);
    req.on('close', () => clients.delete(res)); return;
  }
  try {
    const file = await realpath(path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`));
    if (!file.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }
    const info = await stat(file);
    if (!info.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(file);
    res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
    if (req.method === 'HEAD') { res.end(); return; }
    if (ext === '.html') {
      const { readFile } = await import('node:fs/promises');
      res.end((await readFile(file,'utf8')).replace('</body>',`${liveScript}</body>`));
    } else {
      res.setHeader('Content-Length', info.size);
      createReadStream(file).pipe(res);
    }
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use. Try PORT=5174 npm run dev.` : error); process.exit(1); });
server.listen(port, '127.0.0.1', () => console.log(`Local preview ready: http://127.0.0.1:${port}\nServing only dist/ — edit files and the preview reloads.\nPress Ctrl+C to stop.`));
function stop() { watcher.close(); clearTimeout(timer); for (const client of clients) client.end(); server.close(() => process.exit(0)); }
process.on('SIGINT',stop);
process.on('SIGTERM',stop);
