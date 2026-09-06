// Career Navigator — сервер. Раздаёт статику и (позже) ходит в Gemini за картой.
// Запуск: node server.js  → http://localhost:8765
// Без зависимостей: только встроенные модули Node.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8765;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function sendJSON(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function handleApi(req, res, url) {
  if (url.pathname === '/api/map' && req.method === 'POST') {
    // Здесь будет вызов Gemini. Пока — 501, фронт использует заготовленную карту.
    let body = {};
    try { body = JSON.parse(await readBody(req) || '{}'); } catch (e) { return sendJSON(res, 400, { error: 'bad json' }); }
    return sendJSON(res, 501, { error: 'ai not connected yet', received: Object.keys(body) });
  }
  return sendJSON(res, 404, { error: 'not found' });
}

function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url).catch((e) => sendJSON(res, 500, { error: String(e) }));
  serveStatic(req, res, url);
}).listen(PORT, () => console.log(`Career Navigator → http://localhost:${PORT}`));
