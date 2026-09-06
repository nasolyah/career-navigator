// AI-слой Career Navigator: промпт, JSON-схема, вызов Gemini, нормализация ответа.
// Один и тот же модуль работает в Cloudflare Worker и в локальном server.js — только fetch, без зависимостей.
//
// Принципы (из концепции):
//  - линии = ПЕРЕСЕЧЕНИЯ интересов, а не «главный интерес»;
//  - каждая связь объяснена «почему», у каждой линии есть шаг на четверть;
//  - факты (специальности, вузы) — только из справочника, AI связывает и объясняет;
//  - никаких вердиктов и процентов совпадения.

import { CATALOG, CATALOG_BY_ID, SCHOOL_SUBJECTS, REGIONS } from './catalog.mjs';

// Модели по порядку предпочтения: первая доступная и будет использована.
// Google меняет доступность моделей для новых ключей — поэтому список, а не одна константа.
// Бенчмарк 2026-09-06: 3.1-flash-lite — 8 с, пересадки есть, статусы честные; 3.5-flash-lite — 7 с, без пересадок;
// 3.6-flash — 27 с, тексты богаче, но часто 503. Для демо важнее скорость и стабильность.
export const MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-2.5-flash'];
export const MODEL = MODELS[0];
const API = 'https://generativelanguage.googleapis.com/v1beta';

// Какие модели доступны этому ключу (диагностика)
export async function listModels(apiKey) {
  const res = await fetch(`${API}/models?pageSize=100`, { headers: { 'x-goog-api-key': apiKey } });
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return (data.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''));
}

const PALETTE = ['oklch(0.55 0.19 250)', 'oklch(0.58 0.16 150)', 'oklch(0.66 0.17 50)', 'oklch(0.62 0.21 345)', 'oklch(0.55 0.17 300)'];

const SYSTEM = `Ты — навигатор карьерных маршрутов для школьника 9–11 класса. Твоя задача — не выбрать ему одну профессию, а показать, как его РАЗНЫЕ интересы складываются в 3–5 маршрутов (линий), объяснить каждую связь на языке 15-летнего и дать конкретный шаг на эту четверть.

Правила:
1. Линия — это пересечение двух (иногда трёх) интересов ученика, а не один «главный» интерес. Поле interests линии — id из списка интересов, который ты сам сформируешь из ответов. Линий должно быть 4 или 5 — покажи разные направления, включая неочевидные (например, биология + монтаж → научные медиа). **Комбинации интересов у линий не должны повторяться: две линии не могут стоять на одной и той же паре.** И не делай все линии про одно и то же — если три маршрута ведут в программирование, это плохая карта.
2. Интересы (interests): 3–5 станций-стартов. title — ОДНО слово, максимум два, как название станции метро: «Шахматы», «Биология», «Figma», «Монтаж». Никаких «интерес к…», «увлечение…», «…и аналитика». id — латиницей, desc — одна фраза о том, как это проявляется у ученика (из его ответов).
2а. **Интересы бери ТОЛЬКО из ответов на первый и второй вопросы** — что ученик делает просто так и на каких уроках ему интересно. Ничего не добавляй от себя: если он не называл занятие, его не может быть на карте. Ответы про тип задач и ценности (вопросы 3 и 4) — это НЕ интересы: они помогают объяснить связь в поле why, но станцией-стартом не становятся. Ответ «кем видят родители» — тоже не интерес: линию на нём не строй, можно упомянуть в why как контраст «своё против навязанного». Если названных занятий всего два-три, работай с ними — лучше три честные станции, чем пять с выдуманными.
3. У каждой линии ровно 4 станции — навыки или чекпоинты по пути к специальности, от простого к сложному. title станции — не больше трёх слов («Python-основы», «Статистика», «Первый прототип»). status: done — уже есть (судя по ответам и оценкам), partial — наполовину, gap — ещё нет. Будь честным: у 9-классника большинство станций gap, done — только то, что реально следует из ответов.
4. Пересадки ОБЯЗАТЕЛЬНЫ: минимум одна, максимум три. Карта без единой пересадки — неверный ответ. Если один навык нужен двум линиям (например, «Python-основы» для геймдизайна и биоинформатики, «Сторителлинг» для медиа и дизайна), поставь у обеих станций одинаковый sharedId и одинаковый title. Пересадка соединяет ровно две линии. Это главное, что показывает карта: навык не пропадает при смене маршрута.
4а. Честность статусов: done ставь только тому, что ученик прямо назвал в ответах или что подтверждено оценкой. Если он не писал про программирование — все станции про код = gap. Если не писал про английский — статьи на английском = gap или partial по оценке.
5. why — 2–3 предложения на «ты», без канцелярита, с отсылкой к конкретным ответам ученика. Объясни, ПОЧЕМУ именно эти интересы складываются в эту профессию, и что в работе похоже на то, что он уже любит.
6. step — одно конкретное действие на четверть по первой станции со статусом gap или partial: text — что сделать, с названием площадки или инструмента (Stepik, Figma, CapCut, Arduino…), не «изучи Python», а «пройди 10 уроков Python на Stepik и запиши, понравилось ли»; why — зачем это именно сейчас; record — что записать после (одна короткая строка). stationId — id этой станции.
7. catalogId — id профессии из справочника. Специальность и вузы берутся из справочника по этому id и региону поступления, ты их не пишешь. Если точного совпадения нет — выбери ближайшую профессию, не выдумывай.
7а. Регион поступления учитывай в станциях: если ученик рассматривает Европу, США или Азию — на подходящих линиях одна из станций должна быть про то, что нужно для зарубежного вуза (английский для учёбы / IELTS, портфолио, олимпиады или проекты), и в why можно упомянуть регион. Если только СНГ — про ЕГЭ и олимпиады, без английского как отдельной станции.
8. subjects — школьные предметы, важные для линии (только из списка школьных предметов).
9. Не выноси вердикт, не ранжируй линии, не пиши проценты совпадения. Все линии равноправны.
10. Язык — русский, тон — спокойный, честный, на равных. Названия линий — короткие (1–2 слова: «Геймдизайн», «Медиа о науке»). Проверь орфографию. Верни только JSON по схеме.`;

export const MAP_SCHEMA = {
  type: 'OBJECT',
  properties: {
    interests: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { id: { type: 'STRING' }, title: { type: 'STRING' }, desc: { type: 'STRING' } },
        required: ['id', 'title', 'desc'],
      },
    },
    lines: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          title: { type: 'STRING' },
          interests: { type: 'ARRAY', items: { type: 'STRING' } },
          subjects: { type: 'ARRAY', items: { type: 'STRING' } },
          why: { type: 'STRING' },
          catalogId: { type: 'STRING' },
          stations: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                id: { type: 'STRING' },
                title: { type: 'STRING' },
                status: { type: 'STRING', enum: ['done', 'partial', 'gap'] },
                desc: { type: 'STRING' },
                sharedId: { type: 'STRING', nullable: true },
              },
              required: ['id', 'title', 'status', 'desc'],
            },
          },
          step: {
            type: 'OBJECT',
            properties: { stationId: { type: 'STRING' }, text: { type: 'STRING' }, why: { type: 'STRING' }, record: { type: 'STRING' } },
            required: ['stationId', 'text', 'why', 'record'],
          },
        },
        required: ['id', 'title', 'interests', 'why', 'catalogId', 'stations', 'step'],
      },
    },
  },
  required: ['interests', 'lines'],
};

export function buildUserPrompt(payload) {
  const p = payload?.profile || {};
  const a = payload?.answers || {};
  const ans = (q) => {
    const v = a[q] || {};
    const parts = [];
    if (Array.isArray(v.chips) && v.chips.length) parts.push(v.chips.join(', '));
    if (v.text) parts.push(v.text);
    return parts.join('. ') || '—';
  };
  const subjects = Object.entries(p.subjects || {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ') || 'не указаны';
  const regions = (Array.isArray(p.regions) && p.regions.length ? p.regions : ['cis']).map((r) => REGIONS[r] || r).join(', ');
  const catalog = CATALOG.map((c) => `${c.id} — ${c.profession} (${c.specialty})`).join('\n');
  return `Ученик: ${p.name || 'без имени'}, ${p.grade || 9} класс, ${p.quarter || 1}-я четверть. Оценки за четверть: ${subjects}. Куда хочет поступать: ${regions}.

Ответы на вопросы:
1. Что делает просто так, когда никто не просит: ${ans('free')}
2. На каких уроках одному интересно: ${ans('subjects')}
3. Какие задачи затягивают: ${ans('tasks')}
4. Что важно в будущей работе: ${ans('values')}
5. Кем видят родители (НЕ интерес ученика): ${ans('parents')}

Школьные предметы (для поля subjects): ${SCHOOL_SUBJECTS.join(', ')}.

Справочник профессий (catalogId — профессия (специальность)):
${catalog}

Построй карту: interests и 3–5 lines по правилам.`;
}

export async function generateMap(payload, apiKey, opts = {}) {
  if (!apiKey) throw new Error('no api key');
  const timeoutMs = opts.timeoutMs || 40000;
  const models = opts.model ? [opts.model, ...MODELS.filter((m) => m !== opts.model)] : MODELS;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: 'user', parts: [{ text: buildUserPrompt(payload) }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: MAP_SCHEMA,
      temperature: 0.6,
      maxOutputTokens: 8192,
    },
  };
  try {
    let lastErr = null;
    for (const model of models) {
      const res = await fetch(`${API}/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      // 404 — модель не выдана ключу, 503/429 — перегружена или лимит: пробуем следующую
      if (res.status === 404 || res.status === 503 || res.status === 429) { lastErr = new Error(`${model}: ${res.status}`); continue; }
      if (!res.ok) throw new Error(`gemini ${model} ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const data = await res.json();
      const text = (data?.candidates?.[0]?.content?.parts || []).map((x) => x.text || '').join('');
      let raw;
      try { raw = JSON.parse(text); } catch (e) { throw new Error(`${model} returned non-json`); }
      const map = normalizeMap(raw);
      map.model = model;
      return map;
    }
    throw lastErr || new Error('no model available');
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Нормализация: превращаем ответ модели в формат карты фронтенда ----------
// Гарантирует: 3–5 линий, ровно 4 станции, валидные статусы, пересадки только между
// соседними рядами в одном слоте (иначе — обычные станции), цвета из палитры, шаг на существующую станцию.

const STATUSES = new Set(['done', 'partial', 'gap']);
const slug = (s, fallback = 'x') => (String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || fallback);
const str = (s, max = 400) => String(s || '').trim().slice(0, max);

export function normalizeMap(raw) {
  // Интересы
  const seen = new Set();
  const interests = (raw.interests || []).slice(0, 6).map((it, i) => ({
    id: slug(it.id, `i${i}`), title: str(it.title, 24), desc: str(it.desc, 160),
  })).filter((it) => it.title && !seen.has(it.id) && seen.add(it.id));
  if (interests.length < 2) throw new Error('too few interests');
  const intById = Object.fromEntries(interests.map((i) => [i.id, i]));

  // Линии
  const lineSeen = new Set();
  let lines = (raw.lines || []).slice(0, 5).map((ln, i) => {
    const id = slug(ln.id, `l${i}`);
    const cat = CATALOG_BY_ID[slug(ln.catalogId)] || matchCatalog(ln.title);
    const stations = (ln.stations || []).slice(0, 4).map((s, k) => ({
      id: `${id}_${slug(s.id, `s${k}`)}`,
      title: str(s.title, 40) || 'Станция',
      status: STATUSES.has(s.status) ? s.status : 'gap',
      desc: str(s.desc, 220),
      sharedId: s.sharedId ? slug(s.sharedId) : null,
      rawId: slug(s.id, `s${k}`),
    }));
    while (stations.length < 4) stations.push({ id: `${id}_s${stations.length}`, title: 'Первый проект', status: 'gap', desc: 'Сделать что-то по этой линии руками и показать людям.', sharedId: null, rawId: `s${stations.length}` });
    const ints = (ln.interests || []).map((x) => slug(x)).filter((x) => intById[x]).slice(0, 3);
    const step = ln.step || {};
    return {
      id, title: str(ln.title, 32) || (cat ? cat.profession : 'Маршрут'),
      interests: ints,
      link: ints.map((x) => intById[x].title).join(' + '),
      subjects: (ln.subjects || []).filter((s) => SCHOOL_SUBJECTS.includes(s)),
      why: str(ln.why, 600),
      specialty: cat ? cat.specialty : str(ln.title, 60),
      universities: cat ? JSON.parse(JSON.stringify(cat.universities)) : {}, // по регионам; фронт выбирает нужные
      stations,
      step: { stationId: slug(step.stationId), text: str(step.text, 240), why: str(step.why, 240), record: str(step.record, 120) },
      strength: 2,
    };
  }).filter((l) => l.stations.length === 4 && !lineSeen.has(l.id) && lineSeen.add(l.id));
  if (lines.length < 3) throw new Error('too few lines');

  // Пересадки. Модель нередко забывает проставить sharedId, хотя одинаковый навык
  // стоит на двух линиях, — доклеиваем такие пары по совпадению названия станции.
  const norm = (s) => String(s).toLowerCase().replace(/[^a-zа-яё0-9]+/g, ' ').trim();
  const byTitle = {};
  lines.forEach((l, li) => l.stations.forEach((st) => {
    const k = norm(st.title);
    (byTitle[k] = byTitle[k] || []).push({ li, st });
  }));
  let autoShared = lines.reduce((n, l) => n + l.stations.filter((s) => s.sharedId).length, 0) / 2;
  Object.entries(byTitle).forEach(([k, hits]) => {
    if (autoShared >= 3) return;
    const rows = [...new Set(hits.map((h) => h.li))];
    if (rows.length !== 2) return;                       // навык ровно на двух линиях
    if (hits.some((h) => h.st.sharedId)) return;         // уже помечен моделью
    const id = 'auto_' + k.replace(/\s+/g, '_').slice(0, 24);
    rows.forEach((li) => { const h = hits.find((x) => x.li === li); h.st.sharedId = id; });
    autoShared += 1;
  });

  // Пересадки: sharedId, встречающийся ровно в двух линиях
  const occ = {};
  lines.forEach((l, li) => l.stations.forEach((s, k) => { if (s.sharedId) (occ[s.sharedId] = occ[s.sharedId] || []).push({ li, k }); }));
  const validShared = new Set(Object.keys(occ).filter((sid) => occ[sid].length === 2 && occ[sid][0].li !== occ[sid][1].li));
  lines.forEach((l) => l.stations.forEach((s) => { if (s.sharedId && !validShared.has(s.sharedId)) s.sharedId = null; }));

  // Порядок рядов: линии с общими станциями — рядом
  const sharesWith = (a, b) => a.stations.some((s) => s.sharedId && b.stations.some((t) => t.sharedId === s.sharedId));
  const rest = lines.slice();
  const ordered = [rest.shift()];
  while (rest.length) {
    const last = ordered[ordered.length - 1];
    const idx = rest.findIndex((l) => sharesWith(last, l));
    ordered.push(rest.splice(idx >= 0 ? idx : 0, 1)[0]);
  }
  lines = ordered;

  // Выравнивание слотов: общая станция нижней линии встаёт в тот же слот, что у верхней
  const shared = {};
  for (let i = 1; i < lines.length; i++) {
    const upper = lines[i - 1], lower = lines[i];
    const targets = {}; // sharedId → слот
    const usedSlots = new Set();
    lower.stations.forEach((s) => {
      if (!s.sharedId) return;
      const up = upper.stations.findIndex((t) => t.sharedId === s.sharedId);
      if (up < 0) return; // партнёр не в верхней линии — возможно, в следующей, разберём на следующем шаге
      if (usedSlots.has(up)) { s.sharedId = null; return; }
      targets[s.sharedId] = up; usedSlots.add(up);
    });
    const placed = new Array(4).fill(null);
    lower.stations.forEach((s) => { if (s.sharedId && targets[s.sharedId] !== undefined) placed[targets[s.sharedId]] = s; });
    const others = lower.stations.filter((s) => !(s.sharedId && targets[s.sharedId] !== undefined));
    for (let k = 0; k < 4; k++) if (!placed[k]) placed[k] = others.shift();
    lower.stations = placed;
    Object.entries(targets).forEach(([sid, slot]) => {
      const u = upper.stations[slot], d = lower.stations[slot];
      const rank = { done: 2, partial: 1, gap: 0 };
      shared[sid] = { title: u.title, status: rank[u.status] >= rank[d.status] ? u.status : d.status, desc: u.desc || d.desc };
      upper.stations[slot] = { ref: sid, rawId: u.rawId };
      lower.stations[slot] = { ref: sid, rawId: d.rawId };
    });
  }
  // Общие станции, которые не удалось выровнять, — обычные
  lines.forEach((l) => l.stations.forEach((s) => { if (s.sharedId) delete s.sharedId; }));

  // Шаг: на существующую станцию, иначе — на первую незакрытую
  lines.forEach((l, i) => {
    l.color = PALETTE[i % PALETTE.length];
    const byRaw = (rid) => l.stations.find((s) => s.rawId === rid);
    const target = byRaw(l.step.stationId);
    const statusOf = (s) => (s.ref ? shared[s.ref].status : s.status);
    const fallback = l.stations.find((s) => statusOf(s) !== 'done') || l.stations[0];
    const st = target || fallback;
    l.step.stationId = st.ref || st.id;
    if (!l.step.text) l.step.text = `Разберись со станцией «${st.ref ? shared[st.ref].title : st.title}»: найди один курс или туториал и пройди первую часть.`;
    if (!l.step.why) l.step.why = 'Это следующий пунктир на линии. Один вечер — и станет понятно, твоё это или нет.';
    if (!l.step.record) l.step.record = 'Понравилось или нет.';
    l.stations.forEach((s) => { delete s.rawId; });
  });

  return { interests, lines, shared };
}

function matchCatalog(title) {
  const t = String(title || '').toLowerCase();
  return CATALOG.find((c) => t && (c.profession.toLowerCase().includes(t) || t.includes(c.profession.toLowerCase().split(' ')[0]))) || null;
}
