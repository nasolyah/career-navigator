// Career Navigator — прототип. Состояние, экраны, карта-метро, события.
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STORAGE_KEY = 'career-navigator-v1';

  // ---------- Время: четверть — это календарь, а не счётчик шагов ----------
  // Сентябрь–октябрь → 1-я, ноябрь–декабрь → 2-я, январь–март → 3-я, апрель–май → 4-я, лето → перед следующим классом.
  // Шаги четверть не двигают. «Записать оценки за четверть» закрывает её. Демо-панель перематывает время явно.

  const Q_START_MONTH = { 1: 8, 2: 10, 3: 0, 4: 3 }; // месяц начала четверти (0-based); 3-я и 4-я — в следующем календарном году
  function quarterOf(d) {
    const m = d.getMonth();
    if (m >= 8 && m <= 9) return 1;
    if (m >= 10) return 2;
    if (m <= 2) return 3;
    if (m <= 4) return 4;
    return 'summer';
  }
  function calendarQuarterOrFirst() { const q = quarterOf(new Date()); return q === 'summer' ? 1 : q; }
  function schoolYearOf(d) { return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; }
  function monthsBetween(from, to) { return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()); }

  // ---------- Состояние ----------

  function freshState() {
    return {
      screen: 'profile',
      profile: { name: '', grade: 9, quarter: calendarQuarterOrFirst(), role: 'student', regions: ['cis'], subjects: {} },
      diag: { idx: 0, answers: {} },
      period: { grade: 9, quarter: calendarQuarterOrFirst() },
      timeOffset: 0,        // месяцы «перемотки» — только демо и ручная поправка четверти
      startSchoolYear: null,
      model: null,          // { interests, lines, shared } — появляется после «Собрать карту»
      events: [],           // лента событий, новые сверху
      lastChange: null,     // для экрана «Карта изменилась»
      probes: [],           // проверочные шаги для интересов без пересечений
      focusLine: null,
      stepsFocus: null,
      reacting: null,       // { lineId, reaction } — пока выбирают реакцию на шаг
    };
  }

  let state = load() || freshState();
  if (!state.probes) state.probes = [];

  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* приватный режим */ } }
  function load() { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }

  // ---------- Модель ----------

  const STATUS_TEXT = { done: 'есть', partial: 'наполовину', gap: 'ещё нет' };
  const REACTION_TEXT = { liked: 'понравилось', ok: 'нормально', not_mine: 'не моё' };
  const ROLE_TEXT = { student: 'ученик', parent: 'родитель', school: 'школа' };
  const REGION_TEXT = DATA.regions || { cis: 'СНГ', europe: 'Европа', usa: 'США', asia: 'Азия' };
  function regionsOf() { const r = state.profile.regions; return Array.isArray(r) && r.length ? r : ['cis']; }

  // Вузы линии под регионы из профиля. Старый формат (массив) тоже понимаем.
  function unisByRegion(line) {
    const u = line.universities;
    if (Array.isArray(u)) return [{ region: 'cis', list: u }];
    return regionsOf().map((r) => ({ region: r, list: (u && u[r]) || [] })).filter((x) => x.list.length);
  }
  // Короткий список для карты: по одному из каждого выбранного региона по кругу, максимум max
  function unisFor(line, max = 3) {
    const groups = unisByRegion(line);
    const out = [];
    for (let i = 0; i < 3 && out.length < max; i++) groups.forEach((g) => { if (g.list[i] && out.length < max) out.push(g.list[i]); });
    return out;
  }

  function lineById(id, model = state.model) { return model.lines.find((l) => l.id === id); }

  // Станции линии с подставленными пересадками (ref → общая станция).
  function stationsOf(line, model = state.model) {
    return line.stations.map((s) => (s.ref
      ? Object.assign({ id: s.ref, shared: true }, model.shared[s.ref])
      : Object.assign({ shared: false }, s)));
  }
  function stationOf(line, id) { return stationsOf(line).find((s) => s.id === id); }
  function linesWithStation(id) { return state.model.lines.filter((l) => l.stations.some((s) => (s.ref || s.id) === id)); }
  function setStatus(id, status) {
    const m = state.model;
    if (m.shared[id]) { m.shared[id].status = status; return; }
    m.lines.forEach((l) => l.stations.forEach((s) => { if (s.id === id) s.status = status; }));
  }
  function progress(line) { const st = stationsOf(line); return { done: st.filter((s) => s.status === 'done').length, total: st.length }; }
  function nextGap(line) { return stationsOf(line).find((s) => s.status !== 'done'); }
  // «Сейчас» с учётом перемотки. День фиксируем 15-м, чтобы сдвиг месяцев не перескакивал.
  function now() { const d = new Date(); d.setDate(15); d.setMonth(d.getMonth() + (state.timeOffset || 0)); return d; }
  function computePeriod() {
    const d = now();
    const start = state.startSchoolYear ?? schoolYearOf(new Date());
    return { grade: Math.min(11, Math.max(9, 9 + (schoolYearOf(d) - start))), quarter: quarterOf(d) };
  }
  function syncPeriod() { state.period = computePeriod(); }
  function periodLabel(p = state.period) {
    return p.quarter === 'summer' ? `лето перед ${p.grade + 1} классом` : `${p.grade} класс · ${p.quarter}-я четверть`;
  }
  function periodKey(p = state.period) { return `${p.grade}-${p.quarter}`; }
  function periodLabelFromKey(key) {
    const [g, q] = String(key).split('-');
    return q === 'summer' ? `лета перед ${Number(g) + 1} классом` : `${q}-й четверти ${g} класса`;
  }
  function deadlineText() { return state.period.quarter === 'summer' ? 'до 1 сентября' : 'до конца четверти'; }
  // Старт карты: учебный год — текущий; если ученик поправил четверть вручную — сдвигаем время к её началу
  function initTime() {
    const real = new Date();
    state.startSchoolYear = schoolYearOf(real);
    state.timeOffset = 0;
    const q = Number(state.profile.quarter);
    if (q >= 1 && q <= 4 && q !== quarterOf(real)) {
      const sy = schoolYearOf(real);
      state.timeOffset = monthsBetween(real, new Date(q >= 3 ? sy + 1 : sy, Q_START_MONTH[q], 15));
    }
    syncPeriod();
  }
  function advanceMonths(n) { state.timeOffset = (state.timeOffset || 0) + n; syncPeriod(); }
  // К началу следующей четверти (после 4-й — лето, после лета — 1-я следующего класса)
  function closeQuarter() {
    const d = now();
    const q = quarterOf(d);
    const y = d.getFullYear();
    const next = q === 1 ? new Date(y, 10, 15) : q === 2 ? new Date(y + 1, 0, 15) : q === 3 ? new Date(y, 3, 15) : q === 4 ? new Date(y, 5, 15) : new Date(y, 8, 15);
    advanceMonths(monthsBetween(d, next));
  }
  function stampSteps() { // шаг помнит четверть, в которой появился, — чтобы честно показать «перенесён»
    const key = periodKey();
    state.model.lines.forEach((l) => { if (l.step && !l.step.periodKey) l.step.periodKey = key; });
  }
  function plural(n, one, few, many) { const m10 = n % 10, m100 = n % 100; return (m10 === 1 && m100 !== 11) ? one : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) ? few : many; }
  function stationsWord(n) { return `${n} ${plural(n, 'станция', 'станции', 'станций')}`; }

  function buildModel() {
    state.model = clone({ interests: DATA.interests, lines: DATA.lines, shared: DATA.shared });
    initTime();
    stampSteps();
  }

  function makeStep(station) {
    const t = DATA.nextSteps[station.id];
    const step = t ? Object.assign({ stationId: station.id }, t) : {
      stationId: station.id,
      text: `Разберись со станцией «${station.title}»: найди один курс или туториал и пройди первую часть.`,
      why: 'Это следующий пунктир на линии. Один вечер — и станет понятно, твоё это или нет.',
      record: 'Понравилось или нет.',
    };
    step.periodKey = periodKey();
    return step;
  }

  // ---------- События: здесь карта перестраивается ----------

  // Если линия целилась в станцию, которая уже закрыта, — её шаг переезжает дальше
  function moveStepPast(line, station, changes) {
    if (!line.step || line.step.stationId !== station.id) return;
    const next = nextGap(line);
    line.step = next ? makeStep(next) : null;
    if (next) changes.push({ lineId: line.id, text: `Шаг на линии «${line.title}» обновился: «${station.title}» уже пройдена, следующая станция — «${next.title}».` });
  }

  function applyEvent(ev) {
    const m = state.model;
    const changes = [];
    syncPeriod();
    ev.period = periodLabel();
    ev.ts = Date.now();

    if (ev.type === 'step_done') {
      const line = lineById(ev.lineId);
      const station = stationOf(line, ev.stationId);
      setStatus(station.id, 'done');
      changes.push({ lineId: line.id, text: `«${station.title}» — пройдено. Пунктир на линии «${line.title}» стал короче.` });

      if (station.shared) {
        linesWithStation(station.id).filter((l) => l.id !== line.id).forEach((other) => {
          changes.push({ lineId: other.id, text: `Пересадка: та же станция есть на линии «${other.title}» — там пунктир тоже закрыт. Один шаг двинул два маршрута.` });
          moveStepPast(other, station, changes);
        });
      }

      if (ev.reaction === 'liked') {
        line.strength = Math.min(3, (line.strength || 2) + 1);
        changes.push({ lineId: line.id, text: `Линия «${line.title}» стала ярче: ты написал «понравилось». Это сильнее любой оценки.` });
      } else if (ev.reaction === 'not_mine') {
        line.strength = Math.max(1, (line.strength || 2) - 1);
        changes.push({ lineId: line.id, text: `«Не моё» — тоже результат. Линия остаётся на карте, но следующий шаг по ней мы не предложим первым. Пройденное не пропадает${station.shared ? ' — станция работает на соседней линии' : ''}.` });
      }

      const next = nextGap(line);
      if (next) {
        line.step = makeStep(next);
        changes.push({ lineId: line.id, text: `Новый шаг на линии «${line.title}»: станция «${next.title}».`, isStep: true });
      } else {
        line.step = null;
        changes.push({ lineId: line.id, text: `Все станции линии «${line.title}» пройдены. Конечная: ${line.specialty}.` });
      }
      ev.title = `Ты прошёл «${station.title}» и написал «${REACTION_TEXT[ev.reaction] || 'сделано'}»`;
      // Шаг четверть не двигает: можно сделать несколько шагов за одну четверть
    }

    if (ev.type === 'grades') {
      // Оценки комментируются по правилам: у каждой линии есть предметы, которые для неё важны
      Object.assign(state.profile.subjects, ev.subjects);
      const bump = (line, delta) => { line.strength = Math.max(1, Math.min(3, (line.strength || 2) + delta)); };
      const lineSubjects = (l) => l.subjects || (DATA.lines.find((d) => d.id === l.id) || {}).subjects || [];
      Object.entries(ev.subjects).forEach(([subj, grade]) => {
        const rel = m.lines.filter((l) => lineSubjects(l).includes(subj));
        if (grade === 5) {
          if (rel.length) rel.forEach((l) => { bump(l, +1); changes.push({ lineId: l.id, text: `${subj} 5 подтверждает линию «${l.title}»: она стала крепче.` }); });
          else changes.push({ lineId: null, text: `${subj} 5 — здорово, но на текущие линии не влияет. Если это интерес, а не только оценка, добавь его в профиле — поищем пересечения.` });
        } else if (grade === 3) {
          if (rel.length) rel.forEach((l) => {
            const gap = nextGap(l);
            changes.push({ lineId: l.id, text: `${subj} 3: на линии «${l.title}»${gap ? ` станция «${gap.title}»` : ' следующие станции'} потребует больше усилий. Разобьём шаг на два — линия остаётся.` });
          });
          else changes.push({ lineId: null, text: `${subj} 3: на карте нет линий, где этот предмет нужен, — и правильно. Карта не сузилась, она честная.` });
        }
      });
      if (!changes.length) changes.push({ lineId: null, text: 'Оценки записаны, линии не изменились. Карта строится на том, что ты пробуешь, а не только на оценках.' });
      ev.title = `Оценки за ${state.period.quarter === 'summer' ? 'год' : state.period.quarter + '-ю четверть'}: ` + Object.entries(ev.subjects).map(([k, v]) => `${k} ${v}`).join(', ');
      // Оценки приходят в конце четверти — это и закрывает её
      closeQuarter();
      changes.push({ lineId: null, text: `Четверть закрыта. Сейчас ${periodLabel()}. Невыполненные шаги остаются — с пометкой, что они перенесены.` });
    }

    if (ev.type === 'new_interest') {
      const cat = ev.interestId ? DATA.interestCatalog.find((c) => c.id === ev.interestId) : null;
      const id = cat ? cat.id : 'i' + Date.now();
      const title = cat ? cat.title : String(ev.title || '').trim();
      if (!m.interests.some((i) => i.id === id)) {
        m.interests.push({ id, title, desc: cat ? cat.desc : 'Добавил сам в профиле.' });
        changes.push({ lineId: null, text: `Новая станция-старт: ${title}.` });
        if (cat) {
          cat.lines.forEach((lid) => { const l = lineById(lid); if (l && !l.interests.includes(id)) l.interests.push(id); });
          cat.strengthen.forEach((lid) => { const l = lineById(lid); if (l) l.strength = Math.min(3, (l.strength || 2) + 1); });
          if (cat.newLine && !lineById(cat.newLine.id)) {
            m.lines.push(clone(cat.newLine));
            changes.push({ lineId: cat.newLine.id, text: `Новый шаг на линии «${cat.newLine.title}»: станция «${cat.newLine.stations[0].title}».`, isStep: true });
          }
          cat.effects.forEach((text, i) => changes.push({ lineId: cat.newLine && i === 0 ? cat.newLine.id : (cat.lines[0] || cat.strengthen[0] || null), text }));
          // Интерес закрывает станцию (например, «уже пишет код» → Python есть) — шаги переезжают дальше
          (cat.markDone || []).forEach((sid) => {
            const owners = linesWithStation(sid);
            if (!owners.length) return;
            setStatus(sid, 'done');
            const st = stationOf(owners[0], sid);
            changes.push({ lineId: owners[0].id, text: `«${st.title}» — засчитано: это у тебя уже есть.` });
            owners.forEach((l) => moveStepPast(l, st, changes));
          });
          // Шаги линий переписываются под новый интерес: станция та же, действие новое
          Object.entries(cat.stepPatches || {}).forEach(([lid, patch]) => {
            const l = lineById(lid);
            if (!l || !l.step) return;
            l.step = Object.assign({}, l.step, patch);
            changes.push({ lineId: l.id, text: `Шаг на линии «${l.title}» переписан под новый интерес: «${patch.text}»`, isStep: true });
          });
          ev.highlight = cat.newLine ? cat.newLine.stations[0].id : null;
        } else {
          // Пересечений нет — даём проверочный шаг, а не молчим
          const tpl = DATA.probeStep;
          state.probes.push({ interestId: id, title, text: tpl.text.replace('{title}', title), why: tpl.why, record: tpl.record });
          changes.push({ lineId: null, text: `Пересечений «${title}» с твоими линиями AI пока не нашёл — и не выдумывает их.` });
          changes.push({ lineId: null, text: `Добавил проверочный шаг в «Мои шаги»: один осознанный вечер покажет, интерес это или любопытство. Если «понравилось» — будем искать линию.`, isStep: true });
        }
      } else {
        changes.push({ lineId: null, text: `«${title}» уже есть на карте.` });
      }
      ev.title = `Новый интерес: ${title}`;
    }

    if (ev.type === 'time') {
      // Перемотка времени — только из демо-панели
      if (ev.months) advanceMonths(ev.months); else closeQuarter();
      ev.title = `Перемотка: сейчас ${periodLabel()}`;
      const carried = m.lines.filter((l) => l.step && l.step.periodKey && l.step.periodKey !== periodKey());
      changes.push({ lineId: null, text: `Время идёт, а карта — нет: ${carried.length ? `${carried.length} ${plural(carried.length, 'шаг', 'шага', 'шагов')} не сделано, они перенесены с пометкой` : 'все шаги на месте'}.` });
      if (state.period.quarter === 1 && state.period.grade > 9) changes.push({ lineId: null, text: `${state.period.grade} класс: на конечных станциях скоро появятся требования вузов и проходные баллы.` });
    }

    if (ev.type === 'probe_done') {
      const idx = state.probes.findIndex((p) => p.interestId === ev.interestId);
      const probe = idx >= 0 ? state.probes[idx] : null;
      const title = probe ? probe.title : ev.interestId;
      if (idx >= 0) state.probes.splice(idx, 1);
      if (ev.reaction === 'not_mine') {
        m.interests = m.interests.filter((i) => i.id !== ev.interestId);
        m.lines.forEach((l) => { l.interests = l.interests.filter((i) => i !== ev.interestId); });
        changes.push({ lineId: null, text: `«Не моё» — убрал «${title}» с карты. Это тоже результат: одним вопросом меньше.` });
      } else {
        changes.push({ lineId: null, text: `«${title}» подтверждён как интерес: ты попробовал и написал «${REACTION_TEXT[ev.reaction]}». Станция остаётся, AI ищет линию — с живыми данными здесь появится новая гипотеза.` });
      }
      ev.title = `Ты проверил «${title}» и написал «${REACTION_TEXT[ev.reaction] || 'сделано'}»`;
    }

    state.events.unshift(ev);
    state.lastChange = { ev, changes };
    state.reacting = null;
    state.stepsFocus = null;
    save();
  }

  // ---------- Раскладка карты (схема метро) ----------

  const G = { W: 1280, X_INT: 160, X_MERGE: 220, X_S0: 350, DX: 160, X_T: 990, X_WRAP: 50, Y_ROW0: 60, RH: 120, Y_INT0: 120, V_DX: 70 };

  function layout(model) {
    const interests = model.interests.map((it, j) => Object.assign({}, it, {
      x: G.X_INT, y: G.Y_INT0 + G.RH * j, labelSide: 'left',
      lines: model.lines.filter((l) => l.interests.includes(it.id)).map((l) => l.id),
    }));
    const intById = Object.fromEntries(interests.map((i) => [i.id, i]));
    let wraps = 0;

    const lines = model.lines.map((ln, i) => {
      const y = G.Y_ROW0 + G.RH * i;
      const stations = stationsOf(ln, model);
      const nodes = stations.map((s, k) => {
        const x = G.X_S0 + G.DX * k;
        const upper = i > 0 ? model.lines[i - 1].stations[k] : null;
        const rises = !!(s.shared && upper && upper.ref === s.id); // общая с линией выше → поднимаемся к ней
        return Object.assign({}, s, { x, y: rises ? y - G.RH : y, rises, drawNode: !rises });
      });

      const pts = [[G.X_MERGE, y]];
      const stationIdx = [];
      nodes.forEach((n) => {
        if (n.rises) {
          pts.push([n.x - G.V_DX, y]);
          stationIdx.push(pts.length);
          pts.push([n.x, n.y]);
          pts.push([n.x + G.V_DX, y]);
        } else {
          stationIdx.push(pts.length);
          pts.push([n.x, n.y]);
        }
      });
      const termIdx = pts.length;
      pts.push([G.X_T, y]);

      const segs = [];
      let from = 0;
      stationIdx.forEach((idx, k) => { segs.push({ pts: pts.slice(from, idx + 1), status: nodes[k].status }); from = idx; });
      const allDone = nodes.every((n) => n.status === 'done');
      segs.push({ pts: pts.slice(from, termIdx + 1), status: allDone ? 'done' : 'gap' });

      const feeders = ln.interests.map((iid) => {
        const it = intById[iid];
        if (!it) return null;
        const dy = y - it.y;
        if (Math.abs(dy) <= G.RH / 2) return { pts: [[it.x, it.y], [G.X_MERGE, y]] };
        // далеко — идём кольцом вдоль левого края
        const wx = G.X_WRAP + 14 * (wraps++);
        const s = dy > 0 ? 1 : -1;
        it.labelSide = 'below'; // слева теперь идёт кольцо — подпись уводим вниз
        return { pts: [[it.x, it.y], [wx + 50, it.y], [wx, it.y + s * 50], [wx, y - s * 50], [wx + 50, y], [G.X_MERGE, y]] };
      }).filter(Boolean);

      return Object.assign({}, ln, { y, nodes, segs, feeders, allDone });
    });

    const H = Math.max(G.Y_INT0 + G.RH * (interests.length - 1) + 60, G.Y_ROW0 + G.RH * (lines.length - 1) + 60);
    return { interests, lines, H };
  }

  const d = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');

  // Длинные подписи станций — в две строки, разрыв по пробелу ближе к середине.
  function wrapLabel(title, max = 15) {
    if (title.length <= max) return [title];
    const words = title.split(' ');
    if (words.length < 2) return [title];
    let best = 1, bestDiff = Infinity;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' ').length, b = words.slice(i).join(' ').length;
      const diff = Math.abs(a - b);
      if (diff < bestDiff) { best = i; bestDiff = diff; }
    }
    return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
  }
  const halfCircle = (cx, cy, r) => `M${cx} ${cy - r} A${r} ${r} 0 0 0 ${cx} ${cy + r} Z`;
  const uniShort = (u) => u.split(',')[0].replace(/\s*\(.*?\)/, '').trim();

  function renderMapSVG(model, opts = {}) {
    const lay = layout(model);
    const out = [];
    out.push(`<svg class="metro" viewBox="0 0 ${G.W} ${lay.H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Карта маршрутов">`);

    out.push('<g class="lines">');
    lay.lines.forEach((ln, i) => {
      const w = 8 + 2 * (ln.strength || 2);
      out.push(`<g class="line${ln.candidate ? ' candidate' : ''}" data-line="${ln.id}" style="--c:${ln.color};--w:${w};--i:${i}">`);
      ln.feeders.forEach((f) => out.push(`<path d="${d(f.pts)}" class="done"/>`));
      ln.segs.forEach((s) => out.push(`<path d="${d(s.pts)}" class="${s.status}"/>`));
      out.push('</g>');
    });
    out.push('</g>');

    out.push('<g class="nodes">');
    lay.interests.forEach((it) => {
      out.push(`<g class="node interest" data-interest="${it.id}" data-lines="${it.lines.join(',')}"><circle class="core" cx="${it.x}" cy="${it.y}" r="12"/><circle class="inner" cx="${it.x}" cy="${it.y}" r="4"/></g>`);
    });
    lay.lines.forEach((ln) => {
      ln.nodes.forEach((n) => {
        if (!n.drawNode) return;
        const r = n.shared ? 12 : 10;
        const changed = opts.highlight === n.id;
        let shape = '';
        if (changed) shape += `<circle class="pulse" cx="${n.x}" cy="${n.y}" r="${r}"/>`;
        shape += `<circle class="ring" cx="${n.x}" cy="${n.y}" r="${r}"/>`;
        if (n.status === 'done') shape += `<circle class="fill" cx="${n.x}" cy="${n.y}" r="${r - 3.5}"/>`;
        else if (n.status === 'partial') shape += `<path class="fill" d="${halfCircle(n.x, n.y, r - 3.5)}"/>`;
        const owners = n.shared ? linesWithStationIn(model, n.id).map((l) => l.id).join(',') : ln.id;
        out.push(`<g class="node station${n.shared ? ' transfer' : ''}${changed ? ' is-changed' : ''}" data-station="${n.id}" data-line="${ln.id}" data-lines="${owners}" style="--c:${ln.color}">${shape}</g>`);
      });
      out.push(`<g class="node terminal${ln.allDone ? ' done' : ''}" data-line="${ln.id}" style="--c:${ln.color}"><rect x="${G.X_T - 9}" y="${ln.y - 9}" width="18" height="18" rx="4"/></g>`);
    });
    out.push('</g>');

    out.push('<g class="labels">');
    lay.interests.forEach((it) => {
      if (it.labelSide === 'below') out.push(`<text class="label interest" x="${it.x + 10}" y="${it.y + 34}" text-anchor="end">${esc(it.title)}</text>`);
      else out.push(`<text class="label interest" x="${it.x - 24}" y="${it.y + 6}" text-anchor="end">${esc(it.title)}</text>`);
    });
    lay.lines.forEach((ln) => {
      ln.nodes.forEach((n) => {
        if (!n.drawNode) return;
        const r = n.shared ? 12 : 10;
        const lines = wrapLabel(n.title);
        const baseY = n.y - r - 10;
        out.push(`<text class="label" data-line="${ln.id}" x="${n.x}" y="${baseY - 17 * (lines.length - 1)}" text-anchor="middle">${lines.map((t, i) => `<tspan x="${n.x}" dy="${i ? 17 : 0}">${esc(t)}</tspan>`).join('')}</text>`);
      });
      out.push(`<text class="label term-title" data-line="${ln.id}" x="${G.X_T + 20}" y="${ln.y - 3}">${esc(ln.title)}${ln.candidate ? ' <tspan class="badge">· гипотеза</tspan>' : ''}</text>`);
      out.push(`<text class="label term-uni" data-line="${ln.id}" x="${G.X_T + 20}" y="${ln.y + 17}">${esc(unisFor(ln).map(uniShort).join(' · '))}</text>`);
    });
    out.push('</g></svg>');
    return out.join('');
  }

  function linesWithStationIn(model, id) { return model.lines.filter((l) => l.stations.some((s) => (s.ref || s.id) === id)); }

  function setFocus(svg, ids) {
    const set = new Set(ids ? String(ids).split(',').filter(Boolean) : []);
    svg.classList.toggle('has-focus', set.size > 0);
    $$('[data-line]', svg).forEach((el) => el.classList.toggle('is-focus', set.has(el.dataset.line)));
    $$('.route', document).forEach((el) => el.classList.toggle('is-focus', set.has(el.dataset.route)));
  }

  function bindMap(svg) {
    svg.addEventListener('mouseover', (e) => {
      const it = e.target.closest('[data-interest]');
      if (it) { setFocus(svg, it.dataset.lines); return; }
      const g = e.target.closest('[data-lines], [data-line]');
      if (g) setFocus(svg, g.dataset.lines || g.dataset.line);
    });
    svg.addEventListener('mouseleave', () => setFocus(svg, null));
    svg.addEventListener('click', (e) => {
      const st = e.target.closest('[data-station]');
      if (st) { e.stopPropagation(); showStationTooltip(st.dataset.station, st.dataset.line, e); return; }
      const it = e.target.closest('[data-interest]');
      if (it) { e.stopPropagation(); showInterestTooltip(it.dataset.interest, e); return; }
      const g = e.target.closest('[data-line]');
      if (g) go('line', { line: g.dataset.line });
    });
  }

  // ---------- Подсказки ----------

  function showTooltip(html, e) {
    const tip = $('#tooltip');
    tip.innerHTML = html;
    tip.hidden = false;
    const pad = 12;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = e.clientX + 14, y = e.clientY + 14;
    if (x + w > window.innerWidth - pad) x = e.clientX - w - 14;
    if (y + h > window.innerHeight - pad) y = e.clientY - h - 14;
    tip.style.left = `${Math.max(pad, x)}px`;
    tip.style.top = `${Math.max(pad, y)}px`;
  }
  function hideTooltip() { const tip = $('#tooltip'); tip.hidden = true; }

  function showStationTooltip(id, lineId, e) {
    const line = lineById(lineId);
    const st = stationOf(line, id);
    const lines = st.shared ? linesWithStation(id) : [line];
    showTooltip(`
      <div class="tt-title">${esc(st.title)} <span class="pill ${st.status}">${STATUS_TEXT[st.status]}</span></div>
      <p class="hint" style="margin-top:6px">${esc(st.desc)}</p>
      <div class="tt-lines">${st.shared ? 'Пересадка: ' : 'Линия: '}${lines.map((l) => `<i style="background:${l.color}"></i>${esc(l.title)}`).join(' &nbsp; ')}</div>
    `, e);
  }
  function showInterestTooltip(id, e) {
    const it = state.model.interests.find((i) => i.id === id);
    const lines = state.model.lines.filter((l) => l.interests.includes(id));
    showTooltip(`
      <div class="tt-title">${esc(it.title)} <span class="pill">интерес</span></div>
      <p class="hint" style="margin-top:6px">${esc(it.desc)}</p>
      <div class="tt-lines">Ведёт на: ${lines.map((l) => `<i style="background:${l.color}"></i>${esc(l.title)}`).join(' &nbsp; ')}</div>
    `, e);
  }
  document.addEventListener('click', (e) => { if (!e.target.closest('#tooltip')) hideTooltip(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { hideTooltip(); closeDemo(); } });

  // ---------- Экраны ----------

  function go(screen, params = {}) {
    if (screen === 'home') screen = state.model ? 'map' : 'profile';
    if (['map', 'line', 'steps', 'changed'].includes(screen) && !state.model) screen = 'profile';
    state.screen = screen;
    if (params.line) state.focusLine = params.line;
    // Подсветка шага — только сразу после «Взять этот шаг», при обычном переходе сбрасывается
    state.stepsFocus = 'stepsFocus' in params ? params.stepsFocus : null;
    if (screen !== 'steps') state.reacting = null;
    save();
    render();
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  const screens = {};

  // Маршрут пользователя — показываем рядом с онбордингом, чтобы было видно, куда всё ведёт
  const JOURNEY = [
    ['Профиль', 'имя, четверть, куда поступать, оценки'],
    ['Разговор', 'пять вопросов, не тест'],
    ['Пересечения', 'AI ищет комбинации интересов'],
    ['Карта', 'линии, станции, пересадки'],
    ['Линия', 'почему это про тебя'],
    ['Шаг на четверть', 'одно действие, не план на три года'],
    ['Карта меняется', 'после каждого шага, оценок, нового интереса'],
  ];
  function rail(current) {
    return `
      <aside class="rail" aria-label="Как это устроено">
        <p class="rail-title">Как это устроено</p>
        <ol class="rail-steps">
          ${JOURNEY.map(([t, d], i) => `<li class="${i + 1 < current ? 'is-done' : i + 1 === current ? 'is-current' : ''}"><span class="n">${i + 1}</span><div><b>${t}</b><span class="d">${d}</span></div></li>`).join('')}
        </ol>
        <p class="hint rail-note">Карта не выносит вердикт. Она показывает, во что складываются твои интересы, и меняется, когда меняешься ты.</p>
      </aside>`;
  }

  function regionChips(p) {
    const on = new Set(Array.isArray(p.regions) && p.regions.length ? p.regions : ['cis']);
    return `<div class="chips">${Object.entries(REGION_TEXT).map(([k, t]) => `<button type="button" class="chip${on.has(k) ? ' is-on' : ''}" data-region="${k}">${esc(t)}</button>`).join('')}</div>`;
  }

  function gradesGrid(p) {
    return `<div class="grades">
      ${DATA.subjects.map((s) => `
        <span class="subject">${esc(s)}</span>
        <div class="seg compact" data-seg="subject" data-subject="${esc(s)}">
          ${[3, 4, 5].map((v) => `<button type="button" data-val="${v}" class="${p.subjects[s] === v ? 'is-on' : ''}">${v}</button>`).join('')}
        </div>`).join('')}
    </div>`;
  }

  // Профиль после создания карты — настоящий профиль: отсюда карта получает новые данные
  screens.profileFull = () => {
    const p = state.profile;
    const m = state.model;
    const added = new Set(m.interests.map((i) => i.id));
    const catalog = DATA.interestCatalog.filter((c) => !added.has(c.id));
    return `
      <section class="screen medium">
        <div class="screen-head">
          <div><h1>Профиль</h1><p class="lead">Всё, из чего строится карта. Изменилось что-то — обнови здесь, и карта перестроится.</p></div>
          <button class="btn btn-ghost" data-go="map" type="button">К карте</button>
        </div>
        <div class="profile-grid">
          <div>
            <section class="block" style="margin-top:0">
              <h2>Кто ты</h2>
              <div class="field" style="margin-top:12px">
                <label for="p-name">Имя</label>
                <input class="input" id="p-name" data-field="name" value="${esc(p.name)}" autocomplete="off">
              </div>
              <p class="hint" style="margin-top:12px">${esc(periodLabel())} · ${ROLE_TEXT[p.role] || 'ученик'}. Четверть идёт по школьному календарю, класс меняется 1 сентября.</p>
              <div class="field">
                <label>Куда хочешь поступать <span class="opt">можно несколько</span></label>
                ${regionChips(p)}
                <p class="hint" style="margin-top:8px">Вузы на конечных станциях подстроятся сразу.</p>
              </div>
            </section>
            <section class="block">
              <h2>Оценки за четверть</h2>
              <p class="hint" style="margin:4px 0 12px">Отметь и запиши — карта честно покажет, что изменилось. Потом это будет приходить из электронного дневника само.</p>
              ${gradesGrid(p)}
              <div class="actions" style="margin-top:16px">
                <button class="btn btn-primary" data-action="grades-submit" type="button">Записать оценки за ${state.period.quarter === 'summer' ? 'год' : state.period.quarter + '-ю четверть'}</button>
                <span class="hint">Это закроет четверть — карта перейдёт к следующей.</span>
              </div>
            </section>
          </div>
          <div>
            <section class="block" style="margin-top:0">
              <h2>Интересы</h2>
              <p class="hint">Станции-старты на карте.</p>
              <div class="chips" style="margin-top:10px">${m.interests.map((i) => `<span class="chip static">${esc(i.title)}</span>`).join('')}</div>
              <p class="hint" style="margin-top:20px">Появилось что-то новое? Добавь — AI поищет пересечения с твоими линиями.</p>
              ${catalog.length ? `<div class="chips" style="margin-top:8px">${catalog.map((c) => `<button type="button" class="chip" data-action="interest-add" data-interest="${c.id}">+ ${esc(c.title)}</button>`).join('')}</div>` : ''}
              <div class="add-row">
                <input class="input" id="p-interest" placeholder="Или своё: например, астрономия" autocomplete="off">
                <button class="btn btn-ghost" data-action="interest-add-free" type="button">Добавить</button>
              </div>
            </section>
            <section class="block history">
              <h2>Что уже произошло</h2>
              ${state.events.length ? `<ol>${state.events.slice(0, 8).map((e) => `<li><b>${esc(e.title)}</b> · ${esc(e.period)}</li>`).join('')}</ol>` : `<p class="hint">Пока ничего — карта только построена. Первый шаг всё изменит.</p>`}
            </section>
            <section class="block">
              <button class="btn btn-ghost btn-sm" data-action="diag-restart-full" type="button">Пройти разговор заново</button>
              <p class="hint" style="margin-top:8px">Если интересы поменялись сильно. Карта соберётся заново.</p>
            </section>
          </div>
        </div>
      </section>`;
  };

  screens.profile = () => {
    if (state.model) return screens.profileFull();
    const p = state.profile;
    return `
      <section class="screen onboard">
      <div>
        <h1>Давай знакомиться</h1>
        <p class="lead" style="margin-top:8px">Карта строится вокруг тебя. Сначала пара слов о том, кто ты, потом пять вопросов — и карта готова.</p>

        <div class="field">
          <label for="p-name">Как тебя зовут</label>
          <input class="input" id="p-name" data-field="name" value="${esc(p.name)}" placeholder="Имя" autocomplete="off">
        </div>
        <div class="field">
          <label>Какая сейчас четверть</label>
          <p class="hint">9 класс. По календарю сейчас ${calendarQuarterOrFirst()}-я — поправь, если у твоей школы иначе. Карта живёт по четвертям: каждый шаг — до конца текущей.</p>
          <div class="seg" data-seg="quarter">
            ${[1, 2, 3, 4].map((q) => `<button type="button" data-val="${q}" class="${(p.quarter || 1) === q ? 'is-on' : ''}">${q}-я</button>`).join('')}
          </div>
        </div>
        <div class="field">
          <label>Куда хочешь поступать <span class="opt">можно несколько</span></label>
          <p class="hint">От этого зависит, какие вузы будут на конечных станциях и что готовить заранее — например, английский для учёбы.</p>
          ${regionChips(p)}
        </div>
        <div class="field">
          <label>Оценки за прошлую четверть <span class="opt">необязательно</span></label>
          <p class="hint">Потом будем брать из электронного дневника автоматически. Сейчас — вручную, чтобы карта была честной.</p>
          ${gradesGrid(p)}
        </div>
        <div class="actions">
          <button class="btn btn-primary" data-action="profile-next" type="button">Дальше</button>
          <button class="btn btn-ghost" data-action="demo-fill-profile" type="button">Заполнить за Даню</button>
        </div>
      </div>
      ${rail(1)}
      </section>`;
  };

  function answerHTML(q, a) {
    if (!a) return '';
    const chips = (a.chips || []).map((c) => `<span class="chip">${esc(c)}</span>`).join('');
    return `<div class="answer">${a.text ? `<div>${esc(a.text)}</div>` : ''}${chips ? `<div class="chips">${chips}</div>` : ''}</div>`;
  }

  screens.diag = () => {
    const qs = DATA.questions;
    const idx = state.diag.idx;
    const past = qs.slice(0, idx).map((q) => `
      <li class="turn past">
        <div class="q"><h2>${esc(q.q)}</h2></div>
        ${answerHTML(q, state.diag.answers[q.id])}
      </li>`).join('');

    let current = '';
    if (idx < qs.length) {
      const q = qs[idx];
      const hasChips = q.type !== 'text';
      const hasText = q.type !== 'chips';
      current = `
        <li class="turn current">
          <div class="q"><h2>${esc(q.q)}</h2><p class="hint">${esc(q.hint)}</p></div>
          <div class="compose" data-q="${q.id}">
            ${hasChips ? `<div class="chips">${q.chips.map((c) => `<button type="button" class="chip" data-chip>${esc(c)}</button>`).join('')}</div>` : ''}
            ${hasText ? `<textarea class="input" data-text placeholder="${hasChips ? 'Или своими словами' : 'Своими словами'}"></textarea>` : ''}
            <div class="row">
              <span class="hint">${idx + 1} из ${qs.length}</span>
              <span class="error" hidden>Выбери хотя бы один вариант или напиши своими словами</span>
              <button type="button" class="btn btn-primary" data-action="diag-answer">Дальше</button>
            </div>
          </div>
        </li>`;
    } else {
      const a = state.diag.answers;
      const nInt = (a.free?.chips?.length || 0);
      const nSub = (a.subjects?.chips?.length || 0);
      current = `
        <li class="turn current">
          <div class="q">
            <h2>Готово. Собираю карту?</h2>
            <p class="hint">${nInt} ${plural(nInt, 'интерес', 'интереса', 'интересов')}, ${nSub} ${plural(nSub, 'предмет', 'предмета', 'предметов')}, ${(a.tasks?.chips?.length || 0)} типа задач. Дальше — ищу пересечения по справочнику профессий. Не «главный интерес», а комбинации.</p>
          </div>
          <div class="actions" style="margin-top:4px">
            <button type="button" class="btn btn-primary" data-action="diag-build">Собрать карту</button>
            <button type="button" class="btn btn-ghost" data-action="diag-restart">Ответить заново</button>
          </div>
        </li>`;
    }

    return `
      <section class="screen onboard">
      <div>
        <div class="screen-head">
          <div><h1>Разговор, а не тест</h1><p class="lead">Пять вопросов. Под каждым — зачем мы его задаём.</p></div>
          ${idx === 0 ? `<button class="btn btn-ghost btn-sm" data-action="demo-fill-diag" type="button">Ответить за Даню</button>` : ''}
        </div>
        <ol class="thread">${past}${current}</ol>
      </div>
      ${rail(idx < qs.length ? 2 : 3)}
      </section>`;
  };

  screens.building = () => `
    <section class="screen">
      <div class="building">
        <h1>Ищу пересечения</h1>
        <p class="hint" style="margin-top:8px">AI не выбирает главный интерес. Он проверяет, какие комбинации твоих интересов складываются в профессию — по справочнику, а не из головы.</p>
        <ul class="build-steps">
          ${DATA.buildSteps.map((s) => `<li><span class="tick"><svg viewBox="0 0 10 10"><path d="M1.5 5.5 L4 8 L8.5 2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>${esc(s)}</li>`).join('')}
        </ul>
      </div>
    </section>`;

  screens.map = () => {
    const m = state.model;
    const n = m.lines.length;
    const name = state.profile.name || 'твоя';
    return `
      <section class="screen">
        <div class="screen-head">
          <div>
            <h1>${state.profile.name ? `Карта ${esc(possessive(name))}` : 'Твоя карта'}</h1>
            <p class="lead">${n} ${plural(n, 'маршрут', 'маршрута', 'маршрутов')} из ${m.interests.length} ${plural(m.interests.length, 'интереса', 'интересов', 'интересов')}. AI нашёл пересечения. По какой линии ехать — решаешь ты.</p>
          </div>
          <div class="map-actions"><button class="btn btn-primary" data-go="steps" type="button">Мои шаги</button></div>
        </div>
        <div class="map-layout">
          <div class="map-canvas" id="map-canvas">${renderMapSVG(m)}</div>
          <aside class="routes" aria-label="Маршруты">
            ${m.lines.map((l) => {
              const pr = progress(l);
              return `<button type="button" class="route" data-route="${l.id}" style="--c:${l.color}">
                <span class="dot"></span>
                <span class="route-title">${esc(l.title)}${l.candidate ? '<span class="tag">гипотеза</span>' : ''}</span>
                <span class="route-link">${esc(l.link)}</span>
                <span class="route-progress">${pr.done} из ${pr.total}</span>
              </button>`;
            }).join('')}
            <p class="hint routes-note">Порядок — не рейтинг. Линии не сравниваются между собой: у каждой свой шаг.</p>
          </aside>
        </div>
        <div class="legend">
          <span>${legendIcon('done')} есть</span>
          <span>${legendIcon('partial')} наполовину</span>
          <span>${legendIcon('gap')} ещё нет — пунктир</span>
          <span>${legendIcon('transfer')} пересадка: навык для двух линий</span>
          <span>${legendIcon('interest')} твой интерес</span>
          <span>${legendIcon('terminal')} конечная: специальность и вузы</span>
        </div>
        <section class="quarter-steps">
          <div class="qs-head"><h2>Шаги на эту четверть · ${esc(periodLabel())}</h2><button class="btn btn-ghost btn-sm" data-go="steps" type="button">Все шаги</button></div>
          <ul class="qs-list">
            ${m.lines.filter((l) => l.step).map((l) => `<li style="--c:${l.color}"><span class="dot"></span><button type="button" data-action="take-step" data-line="${l.id}"><b>${esc(l.title)}</b><p>${esc(l.step.text)}</p></button></li>`).join('')}
          </ul>
        </section>
        <div class="live-row">
          <span class="hint">Изменилось что-то? Карта перестроится.</span>
          <button class="btn btn-ghost btn-sm" data-go="profile" type="button">Записать оценки за четверть</button>
          <button class="btn btn-ghost btn-sm" data-go="profile" type="button">Добавить интерес</button>
        </div>
      </section>`;
  };

  function possessive(name) {
    // Даня → Дани, Маша → Маши; для остальных имён — как есть
    if (/[ая]$/i.test(name)) return name.slice(0, -1) + 'и';
    return name;
  }

  function legendIcon(kind) {
    const c = 'var(--muted)';
    switch (kind) {
      case 'done': return `<svg viewBox="0 0 22 16"><circle cx="11" cy="8" r="6" fill="${c}" stroke="${c}" stroke-width="2"/></svg>`;
      case 'partial': return `<svg viewBox="0 0 22 16"><circle cx="11" cy="8" r="6" fill="var(--bg)" stroke="${c}" stroke-width="2"/><path d="M11 2 A6 6 0 0 0 11 14 Z" fill="${c}"/></svg>`;
      case 'gap': return `<svg viewBox="0 0 22 16"><path d="M2 8 H20" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-dasharray="0.1 7"/></svg>`;
      case 'transfer': return `<svg viewBox="0 0 22 16"><circle cx="11" cy="8" r="6" fill="var(--bg)" stroke="var(--ink)" stroke-width="2.5"/></svg>`;
      case 'interest': return `<svg viewBox="0 0 22 16"><circle cx="11" cy="8" r="6.5" fill="var(--ink)"/><circle cx="11" cy="8" r="2.2" fill="var(--bg)"/></svg>`;
      case 'terminal': return `<svg viewBox="0 0 22 16"><rect x="5" y="2" width="12" height="12" rx="3" fill="var(--bg)" stroke="${c}" stroke-width="2"/></svg>`;
    }
    return '';
  }

  screens.line = () => {
    const line = lineById(state.focusLine) || state.model.lines[0];
    const st = stationsOf(line);
    const pr = progress(line);
    const transfers = st.filter((s) => s.shared).map((s) => ({ s, others: linesWithStation(s.id).filter((l) => l.id !== line.id) }));
    return `
      <section class="screen medium" style="--c:${line.color}">
        <button class="back" data-go="map" type="button">← Карта</button>
        <div class="line-head">
          <span class="line-mark"></span>
          <div>
            <h1>${esc(line.title)}${line.candidate ? ' <span class="pill partial">гипотеза</span>' : ''}</h1>
            <p class="lead">${esc(line.link)} · пройдено ${pr.done} из ${pr.total}</p>
          </div>
        </div>

        <section class="block">
          <h2>Почему это про тебя</h2>
          <p style="max-width:62ch;text-wrap:pretty">${esc(line.why)}</p>
        </section>

        <div class="line-grid">
          <section class="block">
            <h2>Маршрут</h2>
            <ol class="route-list">
              ${st.map((s, i) => {
                const next = st[i + 1];
                const others = s.shared ? linesWithStation(s.id).filter((l) => l.id !== line.id) : [];
                return `<li class="${next && next.status === 'gap' ? 'gap-next' : ''}">
                  <span class="rl-node ${s.status}${s.shared ? ' transfer' : ''}"></span>
                  <div>
                    <div class="rl-title">${esc(s.title)} <span class="pill ${s.status}">${STATUS_TEXT[s.status]}</span></div>
                    <p class="hint">${esc(s.desc)}</p>
                    ${others.length ? `<p class="transfer-note">Пересадка: та же станция на линии ${others.map((o) => `«${esc(o.title)}»`).join(', ')}</p>` : ''}
                  </div>
                </li>`;
              }).join('')}
              <li>
                <span class="rl-node ${line.stations.every((s) => (s.ref ? state.model.shared[s.ref] : s).status === 'done') ? 'done' : ''}" style="border-radius:5px"></span>
                <div><div class="rl-title">${esc(line.specialty)}</div><p class="hint">Конечная</p></div>
              </li>
            </ol>
          </section>
          <div>
            <section class="block">
              <h2>Куда ведёт</h2>
              <p class="spec">${esc(line.specialty)}</p>
              ${unisByRegion(line).map(({ region, list }) => `<p class="uni-region">${esc(REGION_TEXT[region] || region)}</p><ul class="unis">${list.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>`).join('')}
              <p class="hint" style="margin-top:10px">Ориентир, не выбор: до вуза ещё ${state.period.grade === 9 ? 'три года' : state.period.grade === 10 ? 'два года' : 'год'}. Регион можно поменять в профиле — вузы обновятся. В 10 классе здесь появятся требования и проходные баллы.</p>
            </section>
            ${transfers.length ? `<section class="block">
              <h2>Пересадки</h2>
              ${transfers.map(({ s, others }) => `<p class="hint">«${esc(s.title)}» пригодится и на линии ${others.map((o) => `«${esc(o.title)}»`).join(', ')}. Если эта линия окажется не твоей — пройденное не пропадёт.</p>`).join('')}
            </section>` : ''}
            <section class="block step-block">
              <h2>Шаг на эту четверть</h2>
              ${line.step ? `
                <p class="step-text">${esc(line.step.text)}</p>
                <p class="hint" style="margin-top:8px">${esc(line.step.why)}</p>
                <button class="btn btn-primary" data-action="take-step" data-line="${line.id}" type="button">Взять этот шаг</button>
              ` : `<p class="hint">Все станции пройдены. Дальше — конечная.</p>`}
            </section>
          </div>
        </div>
      </section>`;
  };

  screens.steps = () => {
    const m = state.model;
    const doneEvents = state.events.filter((e) => e.type === 'step_done' || e.type === 'probe_done');
    return `
      <section class="screen medium">
        <div class="screen-head">
          <div>
            <h1>Мои шаги</h1>
            <p class="lead">${periodLabel()}. По одному шагу на линию — не план на три года, а то, что реально сделать ${deadlineText()}.</p>
          </div>
          <button class="btn btn-ghost" data-go="map" type="button">К карте</button>
        </div>
        <ol class="steps">
          ${m.lines.map((l) => {
            const s = l.step;
            const focus = state.stepsFocus === l.id;
            const reacting = state.reacting && state.reacting.lineId === l.id;
            const target = s ? stationOf(l, s.stationId) : null;
            const carried = s && s.periodKey && s.periodKey !== periodKey();
            return `<li class="step-row${focus ? ' is-focus' : ''}" style="--c:${l.color}" data-step-line="${l.id}">
              <span class="bar"></span>
              <div>
                <div class="meta"><b>${esc(l.title)}</b>${target ? `<span>→ станция «${esc(target.title)}»</span>` : ''}${l.candidate ? '<span class="pill partial">гипотеза</span>' : ''}${carried ? `<span class="pill">перенесён с ${esc(periodLabelFromKey(s.periodKey))}</span>` : ''}</div>
                ${s ? `
                  <p class="step-text">${esc(s.text)}</p>
                  <p class="hint why">${esc(s.why)}</p>
                  <div class="facts"><span>Срок: <b>${deadlineText()}</b></span><span>Записать: <b>${esc(s.record)}</b></span></div>
                  <div class="actions">
                    ${reacting ? `
                      <div class="react">
                        <span class="label">Как было?</span>
                        ${Object.entries(REACTION_TEXT).map(([k, t]) => `<button type="button" class="chip${state.reacting.reaction === k ? ' is-on' : ''}" data-action="react" data-line="${l.id}" data-reaction="${k}">${t}</button>`).join('')}
                        <button type="button" class="btn btn-primary btn-sm" data-action="step-confirm" data-line="${l.id}" ${state.reacting.reaction ? '' : 'disabled'}>Подтвердить</button>
                        <button type="button" class="btn btn-ghost btn-sm" data-action="react-cancel">Отмена</button>
                      </div>` : `
                      <button type="button" class="btn ${focus ? 'btn-primary' : 'btn-ghost'}" data-action="step-done" data-line="${l.id}">Я сделал шаг</button>
                      <button type="button" class="btn btn-ghost btn-sm" data-action="open-line" data-line="${l.id}">Открыть линию</button>`}
                  </div>
                ` : `<p class="hint" style="margin-top:6px">Все станции пройдены. Конечная: ${esc(l.specialty)}.</p>`}
              </div>
            </li>`;
          }).join('')}
        </ol>
        ${state.probes.length ? `<section class="block probes">
          <h2>Проверить новый интерес</h2>
          <p class="hint">Пересечений с линиями пока нет — один осознанный вечер покажет, стоит ли искать.</p>
          <ol class="steps">
            ${state.probes.map((p) => {
              const reacting = state.reacting && state.reacting.probe === p.interestId;
              return `<li class="step-row" style="--c:var(--ink)">
                <span class="bar"></span>
                <div>
                  <div class="meta"><b>${esc(p.title)}</b><span>→ проверочный шаг</span></div>
                  <p class="step-text">${esc(p.text)}</p>
                  <p class="hint why">${esc(p.why)}</p>
                  <div class="facts"><span>Срок: <b>${deadlineText()}</b></span><span>Записать: <b>${esc(p.record)}</b></span></div>
                  <div class="actions">
                    ${reacting ? `
                      <div class="react">
                        <span class="label">Как было?</span>
                        ${Object.entries(REACTION_TEXT).map(([k, t]) => `<button type="button" class="chip${state.reacting.reaction === k ? ' is-on' : ''}" data-action="react-probe" data-probe="${esc(p.interestId)}" data-reaction="${k}">${t}</button>`).join('')}
                        <button type="button" class="btn btn-primary btn-sm" data-action="probe-confirm" data-probe="${esc(p.interestId)}" ${state.reacting.reaction ? '' : 'disabled'}>Подтвердить</button>
                        <button type="button" class="btn btn-ghost btn-sm" data-action="react-cancel">Отмена</button>
                      </div>` : `<button type="button" class="btn btn-ghost" data-action="probe-done" data-probe="${esc(p.interestId)}">Я сделал шаг</button>`}
                  </div>
                </div>
              </li>`;
            }).join('')}
          </ol>
        </section>` : ''}
        ${doneEvents.length ? `<section class="history">
          <h2>Пройдено</h2>
          <ol>${doneEvents.map((e) => {
            if (e.type === 'probe_done') return `<li><b>${esc(e.title)}</b> · ${esc(e.period)}</li>`;
            const l = lineById(e.lineId);
            const st = l ? stationOf(l, e.stationId) : null;
            return `<li><b>${esc(st ? st.title : e.stationId)}</b> · ${esc(l ? l.title : '')} · ${REACTION_TEXT[e.reaction] || ''} · ${esc(e.period)}</li>`;
          }).join('')}</ol>
        </section>` : ''}
      </section>`;
  };

  screens.changed = () => {
    const lc = state.lastChange;
    if (!lc) return screens.map();
    const { ev, changes } = lc;
    const stepChange = changes.find((c) => c.isStep);
    const newLineId = ev.type === 'new_interest' && ev.interestId ? (DATA.interestCatalog.find((c) => c.id === ev.interestId)?.newLine?.id || null) : null;
    const stepLine = stepChange ? lineById(stepChange.lineId) : (newLineId ? lineById(newLineId) : null);
    const highlight = ev.type === 'step_done' ? ev.stationId : (ev.highlight || null);
    return `
      <section class="screen">
        <div class="screen-head">
          <div>
            <h1>Карта изменилась</h1>
            <p class="lead">Сейчас ${periodLabel()}. Карта меняется, когда меняешься ты, — вот что произошло.</p>
          </div>
          <button class="btn btn-primary" data-go="map" type="button">Открыть карту</button>
        </div>
        <div class="map-canvas hero" id="map-canvas">${renderMapSVG(state.model, { highlight })}</div>
        <div class="changed-grid">
          <div>
            <div class="event-line"><span aria-hidden="true">●</span><span>${esc(ev.title)}</span></div>
            <section class="block">
              <h2>Что перестроилось</h2>
              <ul class="changes">
                ${changes.map((c) => {
                  const l = c.lineId ? lineById(c.lineId) : null;
                  return `<li><span class="dot" style="${l ? `--c:${l.color}` : ''}"></span><span>${esc(c.text)}</span></li>`;
                }).join('')}
              </ul>
            </section>
          </div>
          <div>
            ${stepLine && stepLine.step ? `
              <section class="block next-step">
                <div class="meta">Новый шаг · ${esc(stepLine.title)} → «${esc(stationOf(stepLine, stepLine.step.stationId).title)}»</div>
                <p class="step-text">${esc(stepLine.step.text)}</p>
                <p class="hint" style="margin-top:8px">${esc(stepLine.step.why)}</p>
                <div class="actions" style="margin-top:14px"><button class="btn btn-ghost" data-go="steps" type="button">Все шаги</button></div>
              </section>` : ''}
            ${state.events.length > 1 ? `<section class="block history">
              <h2>Раньше</h2>
              <ol>${state.events.slice(1, 6).map((e) => `<li><b>${esc(e.title)}</b> · ${esc(e.period)}</li>`).join('')}</ol>
            </section>` : ''}
          </div>
        </div>
      </section>`;
  };

  // ---------- Рендер ----------

  let lastScreen = null;
  function render() {
    if (state.model) syncPeriod(); // открыли приложение в новой четверти — карта это знает
    const app = $('#app');
    const fn = screens[state.screen] || screens.profile;
    app.innerHTML = fn();
    // Анимация появления — только при смене экрана, не при каждом клике внутри него
    if (state.screen !== lastScreen) { const s = $('.screen', app); if (s) s.classList.add('enter'); }
    lastScreen = state.screen;
    const svg = $('#map-canvas .metro');
    if (svg) bindMap(svg);
    renderTop();
    renderDemoMenu();
  }

  function renderTop() {
    const nav = $('#topnav');
    const chip = $('#userchip');
    if (state.model) {
      nav.innerHTML = [['map', 'Карта'], ['steps', 'Мои шаги'], ['profile', 'Профиль']]
        .map(([s, t]) => `<button type="button" data-go="${s}" class="${state.screen === s || (s === 'map' && ['line', 'changed'].includes(state.screen)) ? 'is-on' : ''}">${t}</button>`).join('');
    } else nav.innerHTML = '';
    chip.innerHTML = state.profile.name ? `<b>${esc(state.profile.name)}</b> · ${periodLabel()}` : '';
  }

  // ---------- Сборка карты (здесь позже будет вызов AI) ----------

  // Живой AI: POST /api/map (Gemini через worker.js / server.js). Если ответа нет за 40 с
  // или он невалидный — карта Дани из data.js. Демка не ломается никогда.
  async function requestMap() {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 40000);
    try {
      const res = await fetch('/api/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: state.profile, answers: state.diag.answers }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`api ${res.status}`);
      const data = await res.json();
      if (!data.map || !Array.isArray(data.map.lines) || data.map.lines.length < 3) throw new Error('bad map');
      return data.map;
    } finally {
      clearTimeout(timer);
    }
  }

  function startBuild() {
    state.screen = 'building';
    save();
    render();
    const items = $$('.build-steps li');
    const delay = REDUCED ? 120 : 650;
    // Первые два шага — по таймеру, третий «думает», пока не ответит AI, последний — когда карта готова
    items.slice(0, -2).forEach((li, i) => setTimeout(() => li.classList.add('is-on'), delay * (i + 1)));
    const thinking = items[items.length - 2];
    if (thinking) setTimeout(() => thinking.classList.add('is-wait'), delay * (items.length - 1));
    const minWait = new Promise((r) => setTimeout(r, delay * items.length));
    const ai = requestMap().catch((e) => { console.warn('[ai] fallback:', e.message); return null; });
    Promise.all([ai, minWait]).then(([map]) => {
      if (thinking) { thinking.classList.remove('is-wait'); thinking.classList.add('is-on'); }
      if (map) {
        state.model = map;
        state.aiSource = 'gemini';
        initTime();
        stampSteps();
      } else {
        buildModel();
        state.aiSource = 'fallback';
      }
      const last = items[items.length - 1];
      if (last) {
        const n = state.model.lines.length;
        last.lastChild.textContent = `Нашёл ${n} ${plural(n, 'пересечение', 'пересечения', 'пересечений')} — строю линии`;
        last.classList.add('is-on');
      }
      setTimeout(() => go('map'), REDUCED ? 100 : 550);
    });
  }

  // ---------- Действия ----------

  const actions = {
    'profile-next': () => {
      if (!state.profile.name.trim()) { const el = $('#p-name'); el.focus(); el.style.borderColor = 'var(--danger)'; return; }
      go('diag');
    },
    'demo-fill-profile': () => {
      state.profile = clone(DATA.demoProfile);
      save(); render();
    },
    'demo-fill-diag': () => {
      fillDemoAnswers();
      go('diag');
    },
    'diag-answer': (el) => {
      const box = el.closest('.compose');
      const q = DATA.questions.find((x) => x.id === box.dataset.q);
      const chips = $$('.chip.is-on', box).map((c) => c.textContent.trim());
      const text = ($('[data-text]', box)?.value || '').trim();
      if (!chips.length && !text) { $('.error', box).hidden = false; return; }
      state.diag.answers[q.id] = { chips, text };
      state.diag.idx += 1;
      save(); render();
    },
    'diag-restart': () => { state.diag = { idx: 0, answers: {} }; save(); render(); },
    'diag-restart-full': () => { state.diag = { idx: 0, answers: {} }; state.screen = 'diag'; save(); render(); window.scrollTo(0, 0); },
    'grades-submit': () => {
      const subjects = {};
      Object.entries(state.profile.subjects).forEach(([k, v]) => { if (v) subjects[k] = v; });
      if (!Object.keys(subjects).length) { const g = $('.grades'); if (g) { g.style.outline = '2px solid var(--danger)'; g.style.outlineOffset = '6px'; g.style.borderRadius = '8px'; } return; }
      applyEvent({ type: 'grades', subjects });
      go('changed');
    },
    'interest-add': (el) => { applyEvent({ type: 'new_interest', interestId: el.dataset.interest }); go('changed'); },
    'interest-add-free': () => {
      const input = $('#p-interest');
      const title = (input?.value || '').trim();
      if (!title) { input?.focus(); return; }
      applyEvent({ type: 'new_interest', title });
      go('changed');
    },
    'diag-build': () => startBuild(),
    'take-step': (el) => go('steps', { stepsFocus: el.dataset.line }),
    'open-line': (el) => go('line', { line: el.dataset.line }),
    'step-done': (el) => { state.reacting = { lineId: el.dataset.line, reaction: null }; state.stepsFocus = el.dataset.line; save(); render(); },
    'react': (el) => { state.reacting = { lineId: el.dataset.line, reaction: el.dataset.reaction }; save(); render(); },
    'react-cancel': () => { state.reacting = null; save(); render(); },
    'probe-done': (el) => { state.reacting = { probe: el.dataset.probe, reaction: null }; save(); render(); },
    'react-probe': (el) => { state.reacting = { probe: el.dataset.probe, reaction: el.dataset.reaction }; save(); render(); },
    'probe-confirm': (el) => {
      if (!state.reacting?.reaction) return;
      applyEvent({ type: 'probe_done', interestId: el.dataset.probe, reaction: state.reacting.reaction });
      go('changed');
    },
    'step-confirm': (el) => {
      const line = lineById(el.dataset.line);
      if (!line || !line.step || !state.reacting?.reaction) return;
      applyEvent({ type: 'step_done', lineId: line.id, stationId: line.step.stationId, reaction: state.reacting.reaction });
      go('changed');
    },
    // Демо: перемотка времени
    'demo-fill': () => {
      state.profile = clone(DATA.demoProfile);
      fillDemoAnswers();
      closeDemo();
      startBuild();
    },
    'demo-step': () => {
      const line = lineById('bioinf') || state.model.lines[0];
      if (!line.step) return;
      closeDemo();
      applyEvent({ type: 'step_done', lineId: line.id, stationId: line.step.stationId, reaction: 'liked' });
      go('changed');
    },
    'demo-grades': () => { closeDemo(); applyEvent({ type: 'grades', subjects: clone(DATA.gradesEvent.subjects) }); go('changed'); },
    'demo-interest': () => { closeDemo(); applyEvent({ type: 'new_interest', interestId: 'robot' }); go('changed'); },
    'demo-quarter': () => { closeDemo(); applyEvent({ type: 'time' }); go('changed'); },
    'demo-year': () => { closeDemo(); applyEvent({ type: 'time', months: 12 }); go('changed'); },
    'demo-reset': () => { state = freshState(); save(); closeDemo(); go('profile'); },
  };

  function fillDemoAnswers() {
    state.diag = { idx: DATA.questions.length, answers: {} };
    DATA.questions.forEach((q) => { state.diag.answers[q.id] = { chips: q.demo.chips || [], text: q.demo.text || '' }; });
    save();
  }

  // Делегирование кликов
  document.addEventListener('click', (e) => {
    const goEl = e.target.closest('[data-go]');
    if (goEl) { go(goEl.dataset.go); return; }

    const act = e.target.closest('[data-action]');
    if (act) { const fn = actions[act.dataset.action]; if (fn) fn(act, e); return; }

    const chip = e.target.closest('.compose [data-chip]');
    if (chip) { chip.classList.toggle('is-on'); const err = $('.error', chip.closest('.compose')); if (err) err.hidden = true; return; }

    const regionChip = e.target.closest('[data-region]');
    if (regionChip) {
      const r = regionChip.dataset.region;
      const set = new Set(regionsOf());
      if (set.has(r)) { if (set.size > 1) set.delete(r); } else set.add(r);
      state.profile.regions = Object.keys(REGION_TEXT).filter((k) => set.has(k));
      save();
      $$('[data-region]').forEach((c) => c.classList.toggle('is-on', state.profile.regions.includes(c.dataset.region)));
      return;
    }

    const segBtn = e.target.closest('.seg button');
    if (segBtn) {
      const seg = segBtn.closest('.seg');
      const val = segBtn.dataset.val;
      if (seg.dataset.seg === 'grade') state.profile.grade = Number(val);
      else if (seg.dataset.seg === 'quarter') state.profile.quarter = Number(val);
      else if (seg.dataset.seg === 'role') state.profile.role = val;
      else if (seg.dataset.seg === 'subject') {
        const subj = seg.dataset.subject;
        state.profile.subjects[subj] = state.profile.subjects[subj] === Number(val) ? undefined : Number(val);
      }
      $$('button', seg).forEach((b) => b.classList.toggle('is-on', b === segBtn && !(seg.dataset.seg === 'subject' && state.profile.subjects[seg.dataset.subject] === undefined)));
      save();
      return;
    }

    const route = e.target.closest('.route[data-route]');
    if (route) { go('line', { line: route.dataset.route }); }
  });

  document.addEventListener('input', (e) => {
    const f = e.target.closest('[data-field]');
    if (f) { state.profile[f.dataset.field] = f.value; f.style.borderColor = ''; save(); renderTop(); }
  });

  // Наведение на карточку маршрута подсвечивает линию на карте
  document.addEventListener('mouseover', (e) => {
    const route = e.target.closest('.route[data-route]');
    const svg = $('#map-canvas .metro');
    if (route && svg) setFocus(svg, route.dataset.route);
  });
  document.addEventListener('mouseout', (e) => {
    const route = e.target.closest('.route[data-route]');
    const svg = $('#map-canvas .metro');
    if (route && svg && !e.relatedTarget?.closest?.('.route')) setFocus(svg, null);
  });

  // ---------- Демо-панель ----------

  function renderDemoMenu() {
    const menu = $('#demo-menu');
    const hasModel = !!state.model;
    const hasRobot = hasModel && state.model.interests.some((i) => i.id === 'robot');
    const bioinf = hasModel ? lineById('bioinf') : null;
    menu.innerHTML = `
      <p class="demo-title">Перемотка времени · ${esc(periodLabel())}${hasModel ? ` · AI: ${state.aiSource === 'gemini' ? 'Gemini' : 'заготовка'}` : ''}</p>
      ${hasModel ? '' : `<button type="button" data-action="demo-fill">Заполнить за Даню и собрать карту</button>`}
      <button type="button" data-action="demo-step" ${hasModel && bioinf && bioinf.step ? '' : 'disabled'}>Прошёл шаг на Биоинформатике — «понравилось»</button>
      <button type="button" data-action="demo-grades" ${hasModel ? '' : 'disabled'}>Пришли оценки — закрыть четверть</button>
      <button type="button" data-action="demo-interest" ${hasModel && !hasRobot ? '' : 'disabled'}>Новый интерес: робототехника</button>
      <hr>
      <button type="button" data-action="demo-quarter" ${hasModel ? '' : 'disabled'}>Перемотать на следующую четверть</button>
      <button type="button" data-action="demo-year" ${hasModel ? '' : 'disabled'}>Перемотать на год вперёд</button>
      <hr>
      <button type="button" class="danger" data-action="demo-reset">Сбросить всё</button>`;
  }
  function closeDemo() { const t = $('.demo-toggle'); $('#demo-menu').hidden = true; t.setAttribute('aria-expanded', 'false'); }
  $('.demo-toggle').addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = $('#demo-menu');
    const open = menu.hidden;
    menu.hidden = !open;
    e.currentTarget.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('#demo')) closeDemo(); });

  // ---------- Старт ----------

  if (state.screen === 'building') state.screen = state.model ? 'map' : 'diag';
  render();
})();
