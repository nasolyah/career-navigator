// Cloudflare Worker: API карты + статика (public/ через биндинг ASSETS).
import { generateMap, MODEL } from './lib/ai.mjs';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') return json({ ok: true, ai: Boolean(env.GEMINI_API_KEY), model: MODEL });

    if (url.pathname === '/api/map') {
      if (request.method !== 'POST') return json({ error: 'POST only' }, 405);
      if (!env.GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY is not set' }, 503);
      let payload;
      try { payload = await request.json(); } catch (e) { return json({ error: 'bad json' }, 400); }
      try {
        const map = await generateMap(payload, env.GEMINI_API_KEY);
        return json({ source: 'gemini', model: MODEL, map });
      } catch (e) {
        return json({ error: String(e && e.message || e) }, 502);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
