// CI-only static server. Loopback only; no writes, directory listing, secrets or dependencies.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '../..');
const TYPES = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json', '.txt':'text/plain; charset=utf-8', '.xml':'application/xml', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon' };
const server = http.createServer(async (req, res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    let pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const parts = pathname.split('/').filter(Boolean);
    if (parts.some(p => p.startsWith('.') || ['node_modules','tests'].includes(p))) { res.writeHead(403); return res.end(); }
    const target = path.resolve(ROOT, '.' + pathname);
    if (!target.startsWith(ROOT + path.sep) || !TYPES[path.extname(target)]) { res.writeHead(403); return res.end(); }
    const real = await fs.realpath(target);
    if (!real.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
    const data = await fs.readFile(real);
    res.writeHead(200, { 'content-type': TYPES[path.extname(real)], 'cache-control': 'no-store', 'x-content-type-options':'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(4173, '127.0.0.1');
for (const signal of ['SIGTERM','SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
