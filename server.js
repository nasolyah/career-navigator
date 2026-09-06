// Career Navigator — локальный сервер для разработки и защиты (без интернета до Cloudflare).
// Запуск: node server.js  → http://localhost:8765
// Ключ Gemini: файл .env в корне со строкой GEMINI_API_KEY=... (файл в .gitignore).
// В проде то же самое делает worker.js на Cloudflare — общий код в lib/ai.mjs.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8765;
const ROOT = path.join(__dirname, 'public');

// .env без зависимостей
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
} catch (e) { /* .env нет — работаем без AI, фронт возьмёт заготовку */ }

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function sendJSON(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
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

let aiModule = null;
const ai = async () => (aiModule = aiModule || await import('./lib/ai.mjs'));

async function handleApi(req, res, url) {
  const key = process.env.GEMINI_API_KEY;
  if (url.pathname === '/api/health') { const m = await ai(); return sendJSON(res, 200, { ok: true, ai: Boolean(key), models: process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL, ...m.MODELS] : m.MODELS }); }
  if (url.pathname === '/api/models') {
    if (!key) return sendJSON(res, 503, { error: 'GEMINI_API_KEY is not set (create .env)' });
    try { const m = await ai(); return sendJSON(res, 200, { models: await m.listModels(key) }); } catch (e) { return sendJSON(res, 502, { error: String(e.message || e) }); }
  }
  if (url.pathname === '/api/map') {
    if (req.method !== 'POST') return sendJSON(res, 405, { error: 'POST only' });
    if (!key) return sendJSON(res, 503, { error: 'GEMINI_API_KEY is not set (create .env)' });
    let payload;
    try { payload = JSON.parse(await readBody(req) || '{}'); } catch (e) { return sendJSON(res, 400, { error: 'bad json' }); }
    try {
      const m = await ai();
      const started = Date.now();
      const map = await m.generateMap(payload, key, { model: process.env.GEMINI_MODEL });
      console.log(`[ai] ${map.model}: ${map.lines.length} lines, ${map.interests.length} interests, ${Date.now() - started} ms`);
      return sendJSON(res, 200, { source: 'gemini', model: map.model, map });
    } catch (e) {
      console.error('[ai] failed:', e.message);
      return sendJSON(res, 502, { error: String(e.message || e) });
    }
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
}).listen(PORT, () => console.log(`Career Navigator → http://localhost:${PORT}  (AI: ${process.env.GEMINI_API_KEY ? 'Gemini' : 'нет ключа, заготовка'})`));
