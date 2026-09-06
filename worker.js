// Cloudflare Worker: API карты + статика (public/ через биндинг ASSETS).
import { generateMap, listModels, MODELS } from './lib/ai.mjs';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') return json({ ok: true, v: 7, ai: Boolean(env.GEMINI_API_KEY), models: env.GEMINI_MODEL ? [env.GEMINI_MODEL, ...MODELS] : MODELS });

    if (url.pathname === '/api/models') {
      if (!env.GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY is not set' }, 503);
      try { return json({ models: await listModels(env.GEMINI_API_KEY) }); } catch (e) { return json({ error: String(e.message || e) }, 502); }
    }

    if (url.pathname === '/api/map') {
      if (request.method !== 'POST') return json({ error: 'POST only' }, 405);
      if (!env.GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY is not set' }, 503);
      let payload;
      try { payload = await request.json(); } catch (e) { return json({ error: 'bad json' }, 400); }
      try {
        // payload.model — для сравнения моделей (curl); в проде обычно не передаётся
        const model = /^gemini-[a-z0-9.-]+$/i.test(payload.model || '') ? payload.model : env.GEMINI_MODEL;
        const map = await generateMap(payload, env.GEMINI_API_KEY, { model });
        // видно в Cloudflare → Workers → Observability
        console.log(`[ai] ${map.model} | вход ${map.usage?.inputTokens} + выход ${map.usage?.outputTokens} токенов | $${map.usage?.costUsd}`);
        return json({ source: 'gemini', model: map.model, usage: map.usage, map });
      } catch (e) {
        return json({ error: String(e && e.message || e) }, 502);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
