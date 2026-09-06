// Career Navigator — презентация защиты. Хакатон IMPACT EDTECH, кейс 2.
const pptxgen = require('pptxgenjs');
const ONLY = Number(process.argv[2]) || 0;
let slideNo = 0;
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5
pres.author = 'Career Navigator';
pres.title = 'Career Navigator';

// Палитра — цвета схемы метро, как в самом продукте
const C = {
  dark: '0E2A33',
  teal: '0B5D6E',
  tealLight: 'A9C9D2',
  ink: '16242A',
  muted: '5A7078',
  surface: 'F0F5F6',
  white: 'FFFFFF',
  blue: '2B6BE4',
  green: '2E9E5B',
  orange: 'E08A2E',
  pink: 'D6428F',
};
const HEAD = 'Cambria';
const BODY = 'Arial';
const LINK = 'career-navigator.markingmark33.workers.dev';

const S = pres.ShapeType;

// ---------- помощники ----------
const title = (s, text, opts = {}) => s.addText(text, Object.assign({
  x: 0.75, y: 0.5, w: 11.9, h: 0.8, fontFace: HEAD, fontSize: 34, bold: true,
  color: C.ink, isTextBox: true, margin: 0, valign: 'top',
}, opts));

const sub = (s, text, opts = {}) => s.addText(text, Object.assign({
  x: 0.75, y: 1.32, w: 11.0, h: 0.4, fontFace: BODY, fontSize: 15,
  color: C.muted, isTextBox: true, margin: 0,
}, opts));

const card = (s, x, y, w, h, fill) => s.addShape(S.roundRect, {
  x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill, width: 0 },
});

const dot = (s, cx, cy, d, color) => s.addShape(S.ellipse, {
  x: cx - d / 2, y: cy - d / 2, w: d, h: d, fill: { color }, line: { color, width: 0 },
});

// станция метро: белый круг с цветным кольцом
const station = (s, cx, cy, color, d = 0.2) => s.addShape(S.ellipse, {
  x: cx - d / 2, y: cy - d / 2, w: d, h: d, fill: { color: C.white }, line: { color, width: 2 },
});

const hline = (s, x1, x2, y, color, th = 0.075) => s.addShape(S.rect, {
  x: x1, y: y - th / 2, w: x2 - x1, h: th,
  fill: { color }, line: { color, width: 0 },
});

// ================= 1. Титул =================
{
  slideNo++; if (ONLY && slideNo !== ONLY) { } else { const s = pres.addSlide();
  s.background = { color: C.dark };
  s.addText('IMPACT EDTECH HACKATHON  ·  КЕЙС 2', {
    x: 0.75, y: 0.6, w: 8, h: 0.3, fontFace: BODY, fontSize: 11, bold: true,
    color: C.tealLight, charSpacing: 2, isTextBox: true, margin: 0,
  });
  s.addText('Career Navigator', {
    x: 0.75, y: 1.35, w: 11.5, h: 1.2, fontFace: HEAD, fontSize: 58, bold: true,
    color: C.white, isTextBox: true, margin: 0,
  });
  s.addText('Живая карта, которая показывает девятикласснику, как его разные интересы складываются в маршруты — и что сделать уже в этой четверти.', {
    x: 0.75, y: 2.75, w: 8.6, h: 1.1, fontFace: BODY, fontSize: 19,
    color: C.tealLight, isTextBox: true, margin: 0, lineSpacingMultiple: 1.25,
  });

  // мотив продукта: линия с четырьмя станциями
  const y = 5.25;
  const xs = [1.0, 3.9, 6.8, 9.7];
  hline(s, xs[0], xs[3], y, C.teal, 0.07);
  const labels = ['Интересы', 'Профессии', 'Навыки', 'Университет'];
  xs.forEach((cx, i) => {
    station(s, cx, y, C.tealLight, 0.26);
    s.addText(labels[i], {
      x: cx - 0.02, y: y + 0.24, w: 2.6, h: 0.3, fontFace: BODY,
      fontSize: 12, color: C.tealLight, isTextBox: true, margin: 0,
    });
  });

  s.addText(LINK, {
    x: 0.75, y: 6.55, w: 11.9, h: 0.3, fontFace: BODY, fontSize: 13,
    color: C.white, isTextBox: true, margin: 0,
  });
  s.addNotes('Career Navigator. Мы сделали не тест на профессию, а живую карту, которая ведёт девятиклассника три года до поступления. Прототип работает вживую — покажем в конце.');
} }

// ================= 2. Проблема =================
{
  slideNo++; if (ONLY && slideNo !== ONLY) { } else { const s = pres.addSlide();
  title(s, 'В 15 лет от школьника ждут большого решения', { fontSize: 36 });
  sub(s, 'Четыре вопроса, на которые он не может ответить один');

  const items = [
    ['«Кем я хочу стать?»', 'Интересов много, но непонятно, какие из них превращаются в профессию.'],
    ['«Что выбрать?»', 'Названия специальностей ничего не говорят о реальной работе после выпуска.'],
    ['«Что мне развивать?»', 'Неясно, какие знания, навыки и проекты нужны уже сейчас.'],
    ['«Куда поступать?»', 'Тысячи вузов и программ делают выбор сложным и случайным.'],
  ];
  const xs = [0.75, 6.95];
  const ys = [2.15, 4.15];
  items.forEach((it, i) => {
    const x = xs[i % 2], y = ys[Math.floor(i / 2)];
    card(s, x, y, 5.6, 1.8, C.surface);
    s.addText(it[0], {
      x: x + 0.4, y: y + 0.28, w: 4.8, h: 0.4, fontFace: HEAD, fontSize: 19, bold: true,
      color: C.teal, isTextBox: true, margin: 0,
    });
    s.addText(it[1], {
      x: x + 0.4, y: y + 0.78, w: 4.8, h: 0.8, fontFace: BODY, fontSize: 14,
      color: C.ink, isTextBox: true, margin: 0, lineSpacingMultiple: 1.2,
    });
  });

  s.addText('Времени вроде много — и именно поэтому решение откладывается до 11 класса, когда выбирать уже поздно.', {
    x: 0.75, y: 6.25, w: 11.9, h: 0.5, fontFace: BODY, fontSize: 16, bold: true,
    color: C.teal, isTextBox: true, margin: 0,
  });
  s.addNotes('Четыре вопроса прямо из кейса. Важно: в 9 классе времени как будто много, и поэтому решение откладывают — а в 11 классе на него уже нет времени.');
} }

// ================= 3. ЦА =================
{
  slideNo++; if (ONLY && slideNo !== ONLY) { } else { const s = pres.addSlide();
  title(s, 'Даня, 15 лет, 9 класс', { fontSize: 36 });
  sub(s, 'Не пустой — просто не видит, как склеить свои увлечения во что-то одно');

  const rows = [
    [C.blue, 'Шахматы', 'разбирает партии гроссмейстеров'],
    [C.orange, 'Монтаж', 'режет ролики друзьям в CapCut'],
    [C.green, 'Биология', 'единственный, кому интересно на уроке'],
    [C.pink, 'Figma', 'рисует вечерами просто так'],
  ];
  rows.forEach((r, i) => {
    const y = 2.2 + i * 0.78;
    station(s, 1.0, y + 0.16, r[0], 0.3);
    s.addText([
      { text: r[1], options: { bold: true, color: C.ink } },
      { text: '  ' + r[2], options: { color: C.muted } },
    ], {
      x: 1.35, y, w: 5.4, h: 0.4, fontFace: BODY, fontSize: 15, isTextBox: true, margin: 0, valign: 'middle',
    });
  });

  card(s, 7.1, 2.1, 5.5, 2.3, C.teal);
  s.addText('«У меня много всего, что мне нравится, но я не понимаю, что из этого про меня, а что просто развлечение. И что мне с этим делать прямо сейчас».', {
    x: 7.45, y: 2.35, w: 4.8, h: 1.8, fontFace: BODY, fontSize: 16, italic: true,
    color: C.white, isTextBox: true, margin: 0, lineSpacingMultiple: 1.25,
  });
  s.addText('Родители давят: «определяйся». Школа: один классный час и тест из 90-х.', {
    x: 7.1, y: 4.6, w: 5.5, h: 0.6, fontFace: BODY, fontSize: 14,
    color: C.muted, isTextBox: true, margin: 0, lineSpacingMultiple: 1.2,
  });

  card(s, 0.75, 5.5, 11.85, 1.3, C.surface);
  s.addText([
    { text: 'Ключевой инсайт.  ', options: { bold: true, color: C.teal } },
    { text: 'У девятиклассника есть ресурс, которого нет у одиннадцатиклассника, — время. Три года можно пробовать, ошибаться и передумывать. Все существующие решения этот ресурс игнорируют: они решают судьбу за один вечер.', options: { color: C.ink } },
  ], {
    x: 1.15, y: 5.72, w: 11.05, h: 0.9, fontFace: BODY, fontSize: 15,
    isTextBox: true, margin: 0, lineSpacingMultiple: 1.25,
  });
  s.addNotes('Мы выбрали одного пользователя, а не «всех школьников». Главный аргумент за 9 класс — время: это единственный класс, где ещё можно попробовать и передумать.');
} }

// ================= 4. Почему не работают =================
{
  slideNo++; if (ONLY && slideNo !== ONLY) { } else { const s = pres.addSlide();
  title(s, 'Почему существующие решения ему не помогают');

  const rows = [
    ['Профтесты', 'Выдают ярлык «человек–техника» без «почему» и без «что дальше». Одноразово.'],
    ['Карьерный консультант', '$50–150 за сессию, разово, не сопровождает три года.'],
    ['Родители и учителя', 'Советуют из своего опыта и своих страхов: «иди в айти, там деньги».'],
    ['ChatGPT и поиск', 'Ответит один раз, но не помнит о тебе и не вернётся через месяц.'],
    ['Агрегаторы вузов', 'Отвечают «куда поступать», а не «кем быть». Для 9 класса рано.'],
  ];
  rows.forEach((r, i) => {
    const y = 1.95 + i * 0.82;
    if (i % 2 === 0) card(s, 0.75, y - 0.14, 11.85, 0.72, C.surface);
    s.addText(r[0], {
      x: 1.15, y, w: 3.0, h: 0.44, fontFace: BODY, fontSize: 15, bold: true,
      color: C.teal, isTextBox: true, margin: 0, valign: 'middle',
    });
    s.addText(r[1], {
      x: 4.35, y, w: 7.9, h: 0.44, fontFace: BODY, fontSize: 14,
      color: C.ink, isTextBox: true, margin: 0, valign: 'middle',
    });
  });

  card(s, 0.75, 6.05, 11.85, 0.95, C.teal);
  s.addText('Все дают вердикт один раз. А нужен спутник, который ведёт три года и пересобирает маршрут, когда ученик меняется.', {
    x: 1.15, y: 6.25, w: 11.05, h: 0.55, fontFace: BODY, fontSize: 17, bold: true,
    color: C.white, isTextBox: true, margin: 0, valign: 'middle',
  });
  s.addNotes('Общий провал у всех один: вердикт выдаётся один раз. Отсюда наша идея — не тест, а спутник.');
} }

// ================= 5. Концепция: карта =================
{
  slideNo++; if (ONLY && slideNo !== ONLY) { } else { const s = pres.addSlide();
  title(s, 'Не список профессий, а карта маршрутов');
  sub(s, 'Интересы — станции старта. Профессии — линии. Навыки — остановки. Чего не хватает — пунктир.');

  const lines = [
    [C.blue, 'Шахматы + Figma', 'Геймдизайн', 'ВШЭ Школа дизайна · ИТМО'],
    [C.green, 'Шахматы + Биология', 'Биоинформатика', 'МГУ, ФББ · ИТМО'],
    [C.orange, 'Биология + Монтаж', 'Медиа о науке', 'ВШЭ · МГУ'],
    [C.pink, 'Монтаж + Figma', 'Моушн-дизайн', 'ВШЭ Школа дизайна · Британка'],
  ];
  const ys = [2.35, 3.05, 3.75, 4.45];
  const xStart = 3.55, xEnd = 8.9;
  const stops = [4.15, 5.35, 6.55, 7.75];

  lines.forEach((ln, i) => {
    const y = ys[i];
    s.addText(ln[1], {
      x: 0.75, y: y - 0.2, w: 2.6, h: 0.4, align: 'right', fontFace: BODY, fontSize: 12.5,
      bold: true, color: C.ink, isTextBox: true, margin: 0, valign: 'middle',
    });
    hline(s, xStart, xEnd, y, ln[0], 0.08);
    stops.forEach((cx) => station(s, cx, y, ln[0], 0.2));
    // конечная — квадрат
    s.addShape(S.roundRect, {
      x: xEnd - 0.11, y: y - 0.11, w: 0.22, h: 0.22, rectRadius: 0.05,
      fill: { color: C.white }, line: { color: ln[0], width: 2.5 },
    });
    s.addText([
      { text: ln[2], options: { bold: true, color: C.ink, fontSize: 13 } },
      { text: '\n' + ln[3], options: { color: C.muted, fontSize: 11 } },
    ], {
      x: 9.25, y: y - 0.26, w: 3.4, h: 0.55, fontFace: BODY, isTextBox: true, margin: 0, valign: 'middle',
    });
  });

  // пересадка между двумя верхними линиями
  s.addShape(S.rect, {
    x: stops[1] - 0.04, y: ys[0], w: 0.08, h: ys[1] - ys[0],
    fill: { color: C.ink }, line: { color: C.ink, width: 0 },
  });
  station(s, stops[1], ys[0], C.ink, 0.26);
  station(s, stops[1], ys[1], C.ink, 0.26);
  s.addText('Python-основы — пересадка: одна станция работает на двух линиях сразу', {
    x: 0.75, y: 4.85, w: 8.5, h: 0.35, fontFace: BODY, fontSize: 13, italic: true,
    color: C.muted, isTextBox: true, margin: 0,
  });

  card(s, 0.75, 5.4, 11.85, 1.45, C.surface);
  s.addText('«Пересадку можно сделать без потери пройденного»', {
    x: 1.15, y: 5.6, w: 11.05, h: 0.45, fontFace: HEAD, fontSize: 21, bold: true,
    color: C.teal, isTextBox: true, margin: 0,
  });
  s.addText('Если через год Даня поймёт, что биоинформатика не его, он не начинает с нуля — пересаживается на соседнюю линию через общую станцию. Это ответ на его главный страх: ошибиться и потерять годы.', {
    x: 1.15, y: 6.08, w: 11.05, h: 0.6, fontFace: BODY, fontSize: 14,
    color: C.ink, isTextBox: true, margin: 0, lineSpacingMultiple: 1.2,
  });
  s.addNotes('Ключевой слайд. Профтест выбирает один главный интерес — мы связываем все в пересечения. И метафора метро объясняет главное: ошибка не стоит трёх лет, потому что есть пересадки.');
} }

// ================= 6. User Journey =================
{
  slideNo++; if (ONLY && slideNo !== ONLY) { } else { const s = pres.addSlide();
  title(s, 'Путь: от «не знаю» до конкретного шага');
  sub(s, 'На каждом шаге видно, почему система показала именно это и что делать дальше');

  const steps = [
    ['Профиль', 'имя, четверть,\nкуда поступать'],
    ['Разговор', '5 вопросов,\nне тест'],
    ['Пересечения', 'AI ищет\nкомбинации'],
    ['Карта', 'линии, станции,\nпересадки'],
    ['Линия', 'почему это\nпро тебя'],
    ['Шаг', 'одно действие\nна четверть'],
    ['Карта меняется', 'после каждого\nсобытия'],
  ];
  const y = 2.95;
  const x0 = 1.5, x1 = 11.9;
  const dx = (x1 - x0) / (steps.length - 1);
  hline(s, x0, x1, y, C.teal, 0.06);
  steps.forEach((st, i) => {
    const cx = x0 + dx * i;
    s.addText(String(i + 1), {
      shape: S.ellipse, x: cx - 0.2, y: y - 0.2, w: 0.4, h: 0.4,
      fill: { color: i === 6 ? C.orange : C.teal }, line: { color: C.white, width: 1.5 },
      align: 'center', valign: 'middle', fontFace: BODY, fontSize: 13, bold: true,
      color: C.white, isTextBox: true, margin: 0,
    });
    s.addText(st[0], {
      x: cx - 0.85, y: 2.35, w: 1.7, h: 0.35, align: 'center', fontFace: BODY, fontSize: 13.5,
      bold: true, color: C.ink, isTextBox: true, margin: 0, valign: 'bottom',
    });
    s.addText(st[1], {
      x: cx - 0.85, y: 3.32, w: 1.7, h: 0.65, align: 'center', fontFace: BODY, fontSize: 11.5,
      color: C.muted, isTextBox: true, margin: 0, lineSpacingMultiple: 1.15,
    });
  });

  // возврат: от шага 7 обратно к карте
  s.addShape(S.line, {
    x: 6.65, y: 4.3, w: 5.25, h: 0,
    line: { color: C.orange, width: 1.5, dashType: 'dash', beginArrowType: 'triangle' },
  });
  s.addText('карта пересобирается — и цикл повторяется каждую четверть', {
    x: 6.65, y: 4.4, w: 5.25, h: 0.3, align: 'center', fontFace: BODY, fontSize: 11.5,
    italic: true, color: C.orange, isTextBox: true, margin: 0,
  });

  card(s, 0.75, 5.2, 11.85, 1.5, C.surface);
  s.addText([
    { text: 'Здесь и живёт retention.  ', options: { bold: true, color: C.teal } },
    { text: 'Продукт остаётся нужным три года, потому что меняется вместе с учеником. Не план на три года сразу, а один шаг на эту четверть — и новый шаг, когда предыдущий сделан. Возврат происходит по событиям: прошёл шаг, пришли оценки, появился новый интерес.', options: { color: C.ink } },
  ], {
    x: 1.15, y: 5.45, w: 11.05, h: 1.05, fontFace: BODY, fontSize: 15,
    isTextBox: true, margin: 0, lineSpacingMultiple: 1.25,
  });
  s.addNotes('Семь шагов пути. Восьмой — возвращение: именно он отличает спутника от теста.');
} }

// ================= 7. AI-механика =================
{
  slideNo++; if (ONLY && slideNo !== ONLY) { } else { const s = pres.addSlide();
  title(s, 'Где здесь AI — и где его сознательно нет');
  sub(s, 'AI связывает и объясняет. Факты берутся из справочника, а не из головы модели.');

  s.addText('AI делает', {
    x: 0.75, y: 1.85, w: 5.9, h: 0.35, fontFace: HEAD, fontSize: 18, bold: true,
    color: C.teal, isTextBox: true, margin: 0,
  });
  const ai = [
    ['Признаки из свободных ответов', '«шахматы + биология = ищет закономерности в сложных системах»'],
    ['Пересечения, а не главный интерес', 'перебирает комбинации и сверяет со справочником профессий'],
    ['«Почему» на языке 15-летнего', 'без канцелярита, со ссылкой на его же ответы'],
    ['Пересборка после каждого события', 'шаг сделан, пришли оценки, появился новый интерес'],
  ];
  ai.forEach((it, i) => {
    const y = 2.35 + i * 0.78;
    dot(s, 0.9, y + 0.16, 0.16, C.teal);
    s.addText([
      { text: it[0] + '\n', options: { bold: true, color: C.ink } },
      { text: it[1], options: { color: C.muted, fontSize: 12.5 } },
    ], {
      x: 1.2, y, w: 5.4, h: 0.7, fontFace: BODY, fontSize: 13.5,
      isTextBox: true, margin: 0, lineSpacingMultiple: 1.15,
    });
  });

  s.addText('Код делает', {
    x: 7.1, y: 1.85, w: 5.5, h: 0.35, fontFace: HEAD, fontSize: 18, bold: true,
    color: C.ink, isTextBox: true, margin: 0,
  });
  const code = [
    ['Факты', 'специальности и вузы — из справочника на 22 профессии'],
    ['Геометрия карты', 'раскладка линий, статусы станций, пересадки'],
    ['Fallback', 'модель молчит 40 секунд → карта из локальных данных'],
  ];
  code.forEach((it, i) => {
    const y = 2.35 + i * 0.78;
    dot(s, 7.25, y + 0.16, 0.16, C.muted);
    s.addText([
      { text: it[0] + '\n', options: { bold: true, color: C.ink } },
      { text: it[1], options: { color: C.muted, fontSize: 12.5 } },
    ], {
      x: 7.55, y, w: 5.05, h: 0.7, fontFace: BODY, fontSize: 13.5,
      isTextBox: true, margin: 0, lineSpacingMultiple: 1.15,
    });
  });

  card(s, 0.75, 5.35, 11.85, 1.45, C.teal);
  s.addText('Ограничители', {
    x: 1.15, y: 5.55, w: 11.05, h: 0.35, fontFace: HEAD, fontSize: 17, bold: true,
    color: C.white, isTextBox: true, margin: 0,
  });
  s.addText('Карта никогда не сужается до одной линии. Ни одной рекомендации без «почему». Каждое событие заканчивается шагом, а не вердиктом. Решение всегда за учеником — AI снижает неопределённость, а не выбирает за него.', {
    x: 1.15, y: 5.95, w: 11.05, h: 0.7, fontFace: BODY, fontSize: 14,
    color: C.white, isTextBox: true, margin: 0, lineSpacingMultiple: 1.2,
  });
  s.addNotes('Отвечаем на главный вопрос жюри: где здесь AI, а не обёртка вокруг чата. Ответ — в разделении: модель связывает и объясняет, факты берёт код из справочника, и есть fallback.');
} }

// ================= 8. Рынок =================
{
  slideNo++; if (ONLY && slideNo !== ONLY) { } else { const s = pres.addSlide();
  title(s, 'Рынок: 2,7 млн девятиклассников в год в трёх странах', { fontSize: 31 });
  sub(s, 'Россия, Казахстан, Узбекистан. Все цифры — из открытых источников, ссылки внизу слайда');

  const cols = [1.05, 3.55, 5.95, 7.95];
  const wds = [2.4, 2.3, 1.9, 4.4];
  const head = ['Страна', '9 класс, 2025/26', 'Школ', 'Рынок образования, последние данные'];
  head.forEach((t, i) => s.addText(t, {
    x: cols[i], y: 1.9, w: wds[i], h: 0.3, fontFace: BODY, fontSize: 11.5, bold: true,
    color: C.muted, isTextBox: true, margin: 0,
  }));

  const rows = [
    ['Россия', '1,71 млн', '~40 000', 'EdTech — 154 млрд ₽ за 2025, +12 % за год'],
    ['Казахстан', '360 тыс.', '8 048', 'EdTech — 45 млрд ₸ за 2025 (МЦРИАП)'],
    ['Узбекистан', '622 тыс.', '11 118', 'Образование — 23,8 трлн сумов за I п/г 2026, +22,7 %'],
  ];
  rows.forEach((r, i) => {
    const y = 2.28 + i * 0.46;
    if (i % 2 === 0) card(s, 0.75, y - 0.08, 11.85, 0.44, C.surface);
    r.forEach((t, k) => s.addText(t, {
      x: cols[k], y, w: wds[k], h: 0.3, fontFace: BODY, fontSize: 12.5,
      bold: k === 0, color: k === 0 ? C.ink : C.ink, isTextBox: true, margin: 0, valign: 'middle',
    }));
  });
  const yTot = 2.28 + 3 * 0.46;
  ['Вместе', '2,69 млн', '59 000+', '29 млн школьников в трёх странах'].forEach((t, k) => s.addText(t, {
    x: cols[k], y: yTot, w: wds[k], h: 0.3, fontFace: BODY, fontSize: 12.5, bold: true,
    color: C.teal, isTextBox: true, margin: 0, valign: 'middle',
  }));

  card(s, 0.75, 4.2, 11.85, 0.5, C.teal);
  s.addText('В России профориентация обязательна во всех школах с 1 сентября 2023 года: курс «Россия — мои горизонты», еженедельно в 6–11 классах. Требование есть, инструмента нет.', {
    x: 1.1, y: 4.3, w: 11.15, h: 0.32, fontFace: BODY, fontSize: 13, bold: true,
    color: C.white, isTextBox: true, margin: 0, valign: 'middle',
  });

  s.addText('Семья уже платит', {
    x: 0.75, y: 4.9, w: 5.9, h: 0.32, fontFace: HEAD, fontSize: 17, bold: true,
    color: C.ink, isTextBox: true, margin: 0,
  });
  [
    ['5 100 ₽ в неделю', 'тратят родители девятиклассника в России на дополнительные занятия — около $250 в месяц (Superjob, 2026)'],
    ['Наши $6 в месяц', 'это примерно 2 % от того, что семья платит и так. Каждая вторая семья платит репетиторам — против 27 % в 2020-м'],
  ].forEach((it, i) => {
    const y = 5.3 + i * 0.62;
    dot(s, 0.9, y + 0.14, 0.16, C.green);
    s.addText([
      { text: it[0] + '  ', options: { bold: true, color: C.ink } },
      { text: it[1], options: { color: C.muted, fontSize: 11.5 } },
    ], { x: 1.2, y, w: 5.4, h: 0.55, fontFace: BODY, fontSize: 12.5, isTextBox: true, margin: 0, lineSpacingMultiple: 1.15 });
  });

  s.addText('Объём рынка — наш расчёт', {
    x: 7.1, y: 4.9, w: 5.5, h: 0.32, fontFace: HEAD, fontSize: 17, bold: true,
    color: C.ink, isTextBox: true, margin: 0,
  });
  [
    ['TAM  $395 млн', '8,1 млн учеников 9–11 классов трёх стран × $49 в год'],
    ['SAM  $160 млн', '40 % семей — те, кто уже платит за дополнительное образование'],
    ['SOM  $1,6 млн', '1 % SAM к третьему году плюс школьные лицензии'],
  ].forEach((it, i) => {
    const y = 5.3 + i * 0.44;
    dot(s, 7.25, y + 0.12, 0.16, C.blue);
    s.addText([
      { text: it[0] + '  ', options: { bold: true, color: C.ink } },
      { text: it[1], options: { color: C.muted, fontSize: 11.5 } },
    ], { x: 7.55, y, w: 5.05, h: 0.4, fontFace: BODY, fontSize: 12.5, isTextBox: true, margin: 0 });
  });

  s.addText('Данные по школам и ученикам — 2025/26 учебный год. Рыночные показатели — последние опубликованные, год указан у каждой цифры. Источники: Рособрнадзор и «Интерфакс» (ОГЭ-2026), Минпросвещения РФ и РК, Госкомстат Узбекистана, Smart Ranking (EdTech-2025), МЦРИАП, Superjob (опрос 3000 родителей, 2026), курс ЦБ РФ 86,9 ₽/$ на 04.09.2026. $49 — российская цена, для Казахстана и Узбекистана её нужно адаптировать, поэтому TAM — верхняя граница.', {
    x: 0.75, y: 6.72, w: 11.85, h: 0.5, fontFace: BODY, fontSize: 9.5,
    color: C.muted, isTextBox: true, margin: 0, lineSpacingMultiple: 1.1,
  });
  s.addNotes('Рынок — три страны, потому что продукт языконезависим и проблема одинаковая. Главное: 2,7 миллиона девятиклассников каждый год, и спрос со стороны школ уже создан государством — в России профориентация обязательна с 2023 года, требование есть, а инструмента нет. Второе главное: семья девятиклассника уже тратит около 250 долларов в месяц на подготовку, наши 6 долларов — это два процента. TAM, SAM и SOM — наш собственный расчёт от числа учеников, а не чужая оценка рынка, и мы честно это подписываем.');
} }

// ================= 9. Бизнес-модель =================
{
  slideNo++; if (ONLY && slideNo !== ONLY) { } else { const s = pres.addSlide();
  title(s, 'За разовый тест не платят. За сопровождение — платят.', { fontSize: 31 });
  sub(s, 'Ценность растёт три года: чем дольше ученик пользуется картой, тем она точнее. Пользуется ученик — платит взрослый.');

  const payers = [
    [C.green, 'Родитель', '$6 / мес  ·  $49 / год', 'Спокойствие: у ребёнка есть план, и он им занимается. Дешевле одной сессии консультанта ($50–150).'],
    [C.blue, 'Школа', '$250 / год за класс', 'Около $8 на ученика. Карты всех девятиклассников, кабинет куратора, отчёт «куда смотрят наши ученики».'],
    [C.orange, 'Курсы и менторы', '10–20 % с продажи', 'Место на карте: курс как станция на маршруте — ровно в момент поиска шага.'],
  ];
  payers.forEach((p, i) => {
    const x = 0.75 + i * 4.15;
    card(s, x, 2.05, 3.7, 2.35, C.surface);
    station(s, x + 0.4, 2.4, p[0], 0.26);
    s.addText(p[1], {
      x: x + 0.7, y: 2.22, w: 2.8, h: 0.35, fontFace: HEAD, fontSize: 17, bold: true,
      color: C.ink, isTextBox: true, margin: 0, valign: 'middle',
    });
    s.addText(p[2], {
      x: x + 0.35, y: 2.68, w: 3.0, h: 0.35, fontFace: BODY, fontSize: 15, bold: true,
      color: p[0], isTextBox: true, margin: 0,
    });
    s.addText(p[3], {
      x: x + 0.35, y: 3.1, w: 3.0, h: 1.1, fontFace: BODY, fontSize: 12.5,
      color: C.muted, isTextBox: true, margin: 0, lineSpacingMultiple: 1.2,
    });
  });

  card(s, 0.75, 4.6, 5.75, 1.1, C.surface);
  s.addText([
    { text: 'Бесплатно\n', options: { bold: true, color: C.teal, fontSize: 14 } },
    { text: 'разговор, карта с 3–5 линиями, «почему» и один шаг', options: { color: C.ink, fontSize: 13 } },
  ], { x: 1.1, y: 4.78, w: 5.1, h: 0.8, fontFace: BODY, isTextBox: true, margin: 0, lineSpacingMultiple: 1.2 });

  card(s, 6.85, 4.6, 5.75, 1.1, C.teal);
  s.addText([
    { text: 'По подписке\n', options: { bold: true, color: C.white, fontSize: 14 } },
    { text: 'пересборка карты, шаг каждую четверть, skills tracking, AI-ментор, кабинет родителя', options: { color: C.white, fontSize: 13 } },
  ], { x: 7.2, y: 4.78, w: 5.1, h: 0.8, fontFace: BODY, isTextBox: true, margin: 0, lineSpacingMultiple: 1.2 });

  s.addText([
    { text: 'Выход на рынок — через школы: ', options: { bold: true, color: C.ink } },
    { text: 'один договор даёт класс активных учеников, а их родители — естественная база для подписки. Цены — гипотезы: проверяем интервью с родителями и пилотом в школе.', options: { color: C.muted } },
  ], {
    x: 0.75, y: 5.95, w: 11.85, h: 0.7, fontFace: BODY, fontSize: 14,
    isTextBox: true, margin: 0, lineSpacingMultiple: 1.2,
  });
  s.addNotes('Ключевой вопрос кейса — за что готовы платить. Ответ: за сопровождение, а не за тест. И начинаем со школ, потому что привлекать подростка поштучно дорого.');
} }

// ================= 10. Экономика =================
{
  slideNo++; if (ONLY && slideNo !== ONLY) { } else { const s = pres.addSlide();
  title(s, 'Сколько нужно на старт и когда выходим в ноль', { fontSize: 33 });
  sub(s, 'Себестоимость посчитана по реальным тарифам Google и Cloudflare. Зарплаты — оценка, и мы это помечаем.');

  const stats = [
    ['$0,0034', 'стоит одна карта: 1 900 токенов на входе и 2 000 на выходе — счётчики самого Google, а не наша оценка'],
    ['$5 / мес', 'Cloudflare Workers — 10 млн запросов. Этого хватает на десятки тысяч учеников'],
    ['≈ $7 / мес', 'всё вместе на 1 000 активных учеников: сервер, три тысячи карт в год и домен'],
  ];
  stats.forEach((st, i) => {
    const x = 0.75 + i * 4.15;
    card(s, x, 1.85, 3.7, 1.4, C.surface);
    s.addText(st[0], {
      x: x + 0.35, y: 2.0, w: 3.0, h: 0.45, fontFace: HEAD, fontSize: 25, bold: true,
      color: C.teal, isTextBox: true, margin: 0,
    });
    s.addText(st[1], {
      x: x + 0.35, y: 2.48, w: 3.0, h: 0.7, fontFace: BODY, fontSize: 11,
      color: C.ink, isTextBox: true, margin: 0, lineSpacingMultiple: 1.15,
    });
  });

  s.addText('Сколько нужно на старт', {
    x: 0.75, y: 3.5, w: 5.9, h: 0.32, fontFace: HEAD, fontSize: 17, bold: true,
    color: C.ink, isTextBox: true, margin: 0,
  });
  [
    ['$500 — до пилота в школе', 'три месяца: сервисы, домен, юридические документы и согласия родителей. Команда работает за долю'],
    ['$9 000–15 000 — runway на полгода', 'три человека, справочник на 200 профессий с требованиями вузов, пилоты в первых школах'],
  ].forEach((it, i) => {
    const y = 3.9 + i * 0.62;
    dot(s, 0.9, y + 0.14, 0.16, C.orange);
    s.addText([
      { text: it[0] + '  ', options: { bold: true, color: C.ink } },
      { text: it[1], options: { color: C.muted, fontSize: 11.5 } },
    ], { x: 1.2, y, w: 5.4, h: 0.55, fontFace: BODY, fontSize: 12.5, isTextBox: true, margin: 0, lineSpacingMultiple: 1.15 });
  });

  s.addText('Когда выходим в ноль', {
    x: 7.1, y: 3.5, w: 5.5, h: 0.32, fontFace: HEAD, fontSize: 17, bold: true,
    color: C.ink, isTextBox: true, margin: 0,
  });
  [
    ['2 подписки', 'покрывают все сервисы на тысячу учеников. Технически продукт окупает себя почти сразу'],
    ['≈ $2 500 в месяц', 'операционные расходы, когда команда из трёх человек на зарплате'],
    ['417 подписок или 120 классов', 'это и есть точка ноль. Смешанный сценарий: 30 школ плюс 105 родителей'],
  ].forEach((it, i) => {
    const y = 3.9 + i * 0.58;
    dot(s, 7.25, y + 0.14, 0.16, C.green);
    s.addText([
      { text: it[0] + '  ', options: { bold: true, color: C.ink } },
      { text: it[1], options: { color: C.muted, fontSize: 11.5 } },
    ], { x: 7.55, y, w: 5.05, h: 0.52, fontFace: BODY, fontSize: 12.5, isTextBox: true, margin: 0, lineSpacingMultiple: 1.15 });
  });

  card(s, 0.75, 5.75, 11.85, 0.65, C.teal);
  s.addText('Карта строится один раз, а все события пересчитывает код, а не модель. Поэтому себестоимость почти не растёт с использованием — при подписке в $6 это разница между продуктом и чат-ботом.', {
    x: 1.1, y: 5.88, w: 11.15, h: 0.4, fontFace: BODY, fontSize: 13, bold: true,
    color: C.white, isTextBox: true, margin: 0, valign: 'middle',
  });

  s.addText('Тарифы на сентябрь 2026: Gemini 3.1 Flash Lite — $0,25 за млн входных и $1,50 за млн выходных токенов; Cloudflare Workers Paid — $5 в месяц за 10 млн запросов. Расход токенов приходит от Google в каждом ответе и виден в логах — среднее по трём прогонам подряд. Зарплаты и объём работ до пилота — наша оценка, а не расчёт по тарифу.', {
    x: 0.75, y: 6.55, w: 11.85, h: 0.45, fontFace: BODY, fontSize: 9.5,
    color: C.muted, isTextBox: true, margin: 0, lineSpacingMultiple: 1.1,
  });
  s.addNotes('Главное здесь: одна карта стоит треть цента, потому что модель вызывается один раз, а всю дальнейшую жизнь карты пересчитывает код. Двух платящих родителей достаточно, чтобы покрыть все сервисы на тысячу учеников. Операционный ноль с командой — около двух с половиной тысяч долларов в месяц, это 417 подписок или 30 школ. И мы честно разделяем: тарифы посчитаны, зарплаты оценены.');
} }

// ================= 11. Прототип =================
{
  slideNo++; if (ONLY && slideNo !== ONLY) { } else { const s = pres.addSlide();
  s.background = { color: C.dark };
  title(s, 'Прототип работает — это не мокап', { color: C.white });
  sub(s, 'Открывается по ссылке с любого ноутбука, без установки', { color: C.tealLight });

  const stats = [
    ['8 сек', 'карта собирается живым AI\nпод конкретного ученика'],
    ['3–5', 'линий, у каждой — объяснение\n«почему это про тебя»'],
    ['4', 'региона поступления: СНГ,\nЕвропа, США, Азия'],
  ];
  stats.forEach((st, i) => {
    const x = 0.75 + i * 4.15;
    card(s, x, 2.1, 3.7, 1.85, '17414D');
    s.addText(st[0], {
      x: x + 0.35, y: 2.3, w: 3.0, h: 0.7, fontFace: HEAD, fontSize: 40, bold: true,
      color: C.white, isTextBox: true, margin: 0,
    });
    s.addText(st[1], {
      x: x + 0.35, y: 3.05, w: 3.0, h: 0.7, fontFace: BODY, fontSize: 12.5,
      color: C.tealLight, isTextBox: true, margin: 0, lineSpacingMultiple: 1.15,
    });
  });

  const feats = [
    [C.blue, 'Разговор вместо теста', 'пять вопросов, под каждым — зачем спрашиваем'],
    [C.green, 'Карта', 'клик по станции: что это и на каких линиях нужно'],
    [C.orange, 'Мои шаги', '«Я сделал шаг» → карта перестраивается на глазах'],
    [C.pink, 'Профиль', 'оценки и новые интересы пересобирают маршруты'],
  ];
  feats.forEach((f, i) => {
    const x = i % 2 === 0 ? 0.75 : 6.9;
    const y = 4.35 + Math.floor(i / 2) * 0.82;
    station(s, x + 0.15, y + 0.18, f[0], 0.26);
    s.addText([
      { text: f[1] + '  ', options: { bold: true, color: C.white } },
      { text: f[2], options: { color: C.tealLight } },
    ], {
      x: x + 0.45, y, w: 5.5, h: 0.7, fontFace: BODY, fontSize: 13,
      isTextBox: true, margin: 0, lineSpacingMultiple: 1.15,
    });
  });

  s.addText(LINK, {
    x: 0.75, y: 6.3, w: 11.85, h: 0.45, fontFace: BODY, fontSize: 20, bold: true,
    color: C.orange, isTextBox: true, margin: 0,
  });
  s.addNotes('Здесь переходим к живой демонстрации. План: заполнить за Даню — карта от AI — открыть линию — сделать шаг — показать, как карта изменилась.');
} }

// ================= 12. Финал =================
{
  slideNo++; if (ONLY && slideNo !== ONLY) { } else { const s = pres.addSlide();
  s.background = { color: C.dark };
  s.addText('Навигатор, а не тест', {
    x: 0.75, y: 1.6, w: 11.9, h: 1.1, fontFace: HEAD, fontSize: 50, bold: true,
    color: C.white, isTextBox: true, margin: 0,
  });
  s.addText('Career Navigator отвечает не только на вопрос «кем мне стать?», но и на вопрос «что мне делать уже сейчас, чтобы туда прийти?»', {
    x: 0.75, y: 2.95, w: 9.0, h: 1.1, fontFace: BODY, fontSize: 20,
    color: C.tealLight, isTextBox: true, margin: 0, lineSpacingMultiple: 1.25,
  });

  const y = 5.0;
  hline(s, 1.0, 9.7, y, C.teal, 0.07);
  const marks = [[1.0, C.blue], [3.9, C.green], [6.8, C.orange]];
  marks.forEach(([cx, col]) => station(s, cx, y, col, 0.26));
  s.addShape(S.roundRect, {
    x: 9.7 - 0.15, y: y - 0.15, w: 0.3, h: 0.3, rectRadius: 0.06,
    fill: { color: C.dark }, line: { color: C.orange, width: 2.5 },
  });
  s.addText('интересы  →  маршруты  →  навыки  →  университет', {
    x: 1.0, y: y + 0.3, w: 9.0, h: 0.35, fontFace: BODY, fontSize: 13,
    color: C.tealLight, isTextBox: true, margin: 0,
  });

  s.addText(LINK, {
    x: 0.75, y: 6.4, w: 11.9, h: 0.4, fontFace: BODY, fontSize: 18, bold: true,
    color: C.orange, isTextBox: true, margin: 0,
  });
  s.addNotes('Финал: возвращаемся к формулировке кейса. И приглашаем жюри открыть ссылку и собрать карту на себя.');
} }

pres.writeFile({ fileName: ONLY ? `qa-${ONLY}.pptx` : 'Career-Navigator.pptx' }).then((f) => console.log('written:', f));
