// Справочник профессий и вузов — источник фактов для AI.
// Модель выбирает catalogId, названия вузов берутся отсюда, а не генерируются.
// На хакатоне — ручная база; дальше — парсинг вузов и требований.

export const SCHOOL_SUBJECTS = ['Биология', 'Математика', 'Физика', 'Информатика', 'Английский', 'Русский', 'Химия', 'История', 'Литература', 'География', 'Обществознание'];

export const CATALOG = [
  { id: 'bioinformatics', profession: 'Биоинформатик', specialty: 'Биоинформатика / прикладная математика и информатика', universities: ['МГУ, ФББ', 'ИТМО', 'ВШЭ, ФКН'] },
  { id: 'gamedesign', profession: 'Геймдизайнер', specialty: 'Геймдизайн / разработка игр', universities: ['ВШЭ Школа дизайна', 'ИТМО', 'Scream School'] },
  { id: 'scimedia', profession: 'Научный журналист / автор научных медиа', specialty: 'Медиакоммуникации / научная журналистика', universities: ['ВШЭ, Медиакоммуникации', 'МГУ, журфак', 'ИТМО'] },
  { id: 'motion', profession: 'Моушн-дизайнер / графический дизайнер', specialty: 'Дизайн / коммуникационный дизайн', universities: ['ВШЭ Школа дизайна', 'Британка', 'СПбГУ'] },
  { id: 'productdesign', profession: 'Продуктовый дизайнер (UX/UI)', specialty: 'Дизайн цифровых продуктов', universities: ['ВШЭ Школа дизайна', 'Британка', 'ИТМО'] },
  { id: 'bioeng', profession: 'Биомедицинский инженер', specialty: 'Биомедицинская инженерия', universities: ['МГТУ им. Баумана', 'ИТМО', 'МФТИ'] },
  { id: 'software', profession: 'Разработчик ПО', specialty: 'Программная инженерия', universities: ['ИТМО', 'ВШЭ, ФКН', 'МФТИ'] },
  { id: 'datascience', profession: 'Аналитик данных / data scientist', specialty: 'Прикладная математика и информатика / анализ данных', universities: ['ВШЭ, ФКН', 'МФТИ', 'МГУ, ВМК'] },
  { id: 'medicine', profession: 'Врач', specialty: 'Лечебное дело', universities: ['Сеченовский университет', 'РНИМУ им. Пирогова', 'ПСПбГМУ им. Павлова'] },
  { id: 'biotech', profession: 'Биотехнолог', specialty: 'Биотехнология', universities: ['МГУ, биофак', 'РХТУ им. Менделеева', 'ИТМО'] },
  { id: 'robotics', profession: 'Инженер-робототехник', specialty: 'Мехатроника и робототехника', universities: ['МГТУ им. Баумана', 'ИТМО', 'Университет Иннополис'] },
  { id: 'architecture', profession: 'Архитектор', specialty: 'Архитектура', universities: ['МАРХИ', 'СПбГАСУ', 'ВШЭ Школа дизайна'] },
  { id: 'psychology', profession: 'Психолог', specialty: 'Психология', universities: ['МГУ, психфак', 'ВШЭ', 'СПбГУ'] },
  { id: 'economics', profession: 'Экономист / предприниматель', specialty: 'Экономика / бизнес', universities: ['ВШЭ', 'РЭШ', 'МГУ, экономфак'] },
  { id: 'film', profession: 'Режиссёр / кинопродюсер', specialty: 'Режиссура кино и телевидения', universities: ['ВГИК', 'Московская школа кино', 'СПбГИКиТ'] },
  { id: 'linguistics', profession: 'Лингвист / переводчик', specialty: 'Лингвистика', universities: ['МГЛУ', 'ВШЭ', 'СПбГУ'] },
  { id: 'urban', profession: 'Урбанист', specialty: 'Городское планирование', universities: ['ВШЭ, Высшая школа урбанистики', 'Шанинка', 'МАРХИ'] },
  { id: 'education', profession: 'Педагог / EdTech-методист', specialty: 'Педагогическое образование', universities: ['МГПУ', 'ВШЭ, Институт образования', 'РГПУ им. Герцена'] },
  { id: 'chemistry', profession: 'Химик / материаловед', specialty: 'Химия / материаловедение', universities: ['МГУ, химфак', 'МФТИ', 'РХТУ им. Менделеева'] },
  { id: 'physics', profession: 'Физик / инженер-исследователь', specialty: 'Физика / прикладная физика', universities: ['МФТИ', 'МГУ, физфак', 'НИЯУ МИФИ'] },
  { id: 'law', profession: 'Юрист', specialty: 'Юриспруденция', universities: ['МГУ, юрфак', 'ВШЭ', 'МГЮА'] },
  { id: 'sound', profession: 'Саунд-дизайнер / звукорежиссёр', specialty: 'Звукорежиссура', universities: ['СПбГИКиТ', 'РАМ им. Гнесиных', 'Московская школа кино'] },
];

export const CATALOG_BY_ID = Object.fromEntries(CATALOG.map((c) => [c.id, c]));
