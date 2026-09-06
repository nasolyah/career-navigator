// Справочник профессий и вузов — источник фактов для AI.
// Модель выбирает catalogId, названия вузов берутся отсюда по региону поступления, а не генерируются.
// На хакатоне — ручная база; дальше — парсинг вузов и требований.

export const SCHOOL_SUBJECTS = ['Биология', 'Математика', 'Физика', 'Информатика', 'Английский', 'Русский', 'Химия', 'История', 'Литература', 'География', 'Обществознание'];

// Регионы поступления. Ключи используются в профиле ученика и в списках вузов.
export const REGIONS = { cis: 'СНГ', europe: 'Европа', usa: 'США', asia: 'Азия' };

export const CATALOG = [
  {
    id: 'bioinformatics', profession: 'Биоинформатик', specialty: 'Биоинформатика / прикладная математика и информатика',
    universities: { cis: ['МГУ, ФББ', 'ИТМО', 'ВШЭ, ФКН'], europe: ['ETH Zürich', 'Heidelberg', 'EPFL (Лозанна)'], usa: ['MIT', 'Stanford', 'UC Berkeley'], asia: ['NUS (Сингапур)', 'University of Tokyo', 'Tsinghua (Пекин)'] },
  },
  {
    id: 'gamedesign', profession: 'Геймдизайнер', specialty: 'Геймдизайн / разработка игр',
    universities: { cis: ['ВШЭ Школа дизайна', 'ИТМО', 'Scream School'], europe: ['Abertay (Данди)', 'Breda University (Нидерланды)', 'Cologne Game Lab'], usa: ['USC Games', 'NYU Game Center', 'DigiPen'], asia: ['DigiPen Singapore', 'Tokyo Polytechnic', 'Kyoto Seika'] },
  },
  {
    id: 'scimedia', profession: 'Научный журналист / автор научных медиа', specialty: 'Медиакоммуникации / научная журналистика',
    universities: { cis: ['ВШЭ, Медиакоммуникации', 'МГУ, журфак', 'ИТМО'], europe: ['Goldsmiths (Лондон)', 'University of Amsterdam', 'Leeds'], usa: ['NYU', 'USC Annenberg', 'Northwestern Medill'], asia: ['NUS (Сингапур)', 'Hong Kong Baptist', 'Sophia (Токио)'] },
  },
  {
    id: 'motion', profession: 'Моушн-дизайнер / графический дизайнер', specialty: 'Дизайн / коммуникационный дизайн',
    universities: { cis: ['ВШЭ Школа дизайна', 'Британка', 'СПбГУ'], europe: ['Royal College of Art (Лондон)', 'Design Academy Eindhoven', 'Aalto (Хельсинки)'], usa: ['Parsons (Нью-Йорк)', 'RISD', 'ArtCenter (Пасадена)'], asia: ['Tokyo University of the Arts', 'Hongik (Сеул)', 'LASALLE (Сингапур)'] },
  },
  {
    id: 'productdesign', profession: 'Продуктовый дизайнер (UX/UI)', specialty: 'Дизайн цифровых продуктов',
    universities: { cis: ['ВШЭ Школа дизайна', 'Британка', 'ИТМО'], europe: ['Royal College of Art (Лондон)', 'TU Delft', 'Aalto (Хельсинки)'], usa: ['Carnegie Mellon', 'Parsons (Нью-Йорк)', 'ArtCenter (Пасадена)'], asia: ['NUS (Сингапур)', 'Hongik (Сеул)', 'Tongji (Шанхай)'] },
  },
  {
    id: 'bioeng', profession: 'Биомедицинский инженер', specialty: 'Биомедицинская инженерия',
    universities: { cis: ['МГТУ им. Баумана', 'ИТМО', 'МФТИ'], europe: ['ETH Zürich', 'Imperial College (Лондон)', 'TU Munich'], usa: ['Johns Hopkins', 'MIT', 'Georgia Tech'], asia: ['NUS (Сингапур)', 'University of Tokyo', 'KAIST (Корея)'] },
  },
  {
    id: 'software', profession: 'Разработчик ПО', specialty: 'Программная инженерия',
    universities: { cis: ['ИТМО', 'ВШЭ, ФКН', 'МФТИ'], europe: ['ETH Zürich', 'TU Munich', 'EPFL (Лозанна)'], usa: ['MIT', 'Carnegie Mellon', 'Stanford'], asia: ['NUS (Сингапур)', 'Tsinghua (Пекин)', 'KAIST (Корея)'] },
  },
  {
    id: 'datascience', profession: 'Аналитик данных / data scientist', specialty: 'Прикладная математика и информатика / анализ данных',
    universities: { cis: ['ВШЭ, ФКН', 'МФТИ', 'МГУ, ВМК'], europe: ['ETH Zürich', 'University of Amsterdam', 'TU Munich'], usa: ['MIT', 'UC Berkeley', 'Carnegie Mellon'], asia: ['NUS (Сингапур)', 'Tsinghua (Пекин)', 'HKUST (Гонконг)'] },
  },
  {
    id: 'medicine', profession: 'Врач', specialty: 'Лечебное дело',
    universities: { cis: ['Сеченовский университет', 'РНИМУ им. Пирогова', 'ПСПбГМУ им. Павлова'], europe: ['Karolinska (Стокгольм)', 'Heidelberg', 'Charité (Берлин)'], usa: ['Johns Hopkins', 'Harvard', 'Stanford'], asia: ['NUS Medicine (Сингапур)', 'University of Tokyo', 'Seoul National University'] },
  },
  {
    id: 'biotech', profession: 'Биотехнолог', specialty: 'Биотехнология',
    universities: { cis: ['МГУ, биофак', 'РХТУ им. Менделеева', 'ИТМО'], europe: ['ETH Zürich', 'Wageningen (Нидерланды)', 'TU Munich'], usa: ['MIT', 'UC Berkeley', 'UC San Diego'], asia: ['NUS (Сингапур)', 'University of Tokyo', 'KAIST (Корея)'] },
  },
  {
    id: 'robotics', profession: 'Инженер-робототехник', specialty: 'Мехатроника и робототехника',
    universities: { cis: ['МГТУ им. Баумана', 'ИТМО', 'Университет Иннополис'], europe: ['ETH Zürich', 'TU Munich', 'TU Delft'], usa: ['Carnegie Mellon', 'MIT', 'Georgia Tech'], asia: ['University of Tokyo', 'KAIST (Корея)', 'NUS (Сингапур)'] },
  },
  {
    id: 'architecture', profession: 'Архитектор', specialty: 'Архитектура',
    universities: { cis: ['МАРХИ', 'СПбГАСУ', 'ВШЭ Школа дизайна'], europe: ['TU Delft', 'ETH Zürich', 'UCL Bartlett (Лондон)'], usa: ['MIT', 'Cornell', 'SCI-Arc (Лос-Анджелес)'], asia: ['University of Tokyo', 'Tongji (Шанхай)', 'NUS (Сингапур)'] },
  },
  {
    id: 'psychology', profession: 'Психолог', specialty: 'Психология',
    universities: { cis: ['МГУ, психфак', 'ВШЭ', 'СПбГУ'], europe: ['University of Amsterdam', 'Edinburgh', 'KU Leuven'], usa: ['Stanford', 'UCLA', 'Michigan'], asia: ['NUS (Сингапур)', 'HKU (Гонконг)', 'University of Tokyo'] },
  },
  {
    id: 'economics', profession: 'Экономист / предприниматель', specialty: 'Экономика / бизнес',
    universities: { cis: ['ВШЭ', 'РЭШ', 'МГУ, экономфак'], europe: ['LSE (Лондон)', 'Bocconi (Милан)', 'HEC Paris'], usa: ['Wharton (UPenn)', 'NYU Stern', 'UC Berkeley Haas'], asia: ['NUS Business (Сингапур)', 'HKUST (Гонконг)', 'Tsinghua SEM (Пекин)'] },
  },
  {
    id: 'film', profession: 'Режиссёр / кинопродюсер', specialty: 'Режиссура кино и телевидения',
    universities: { cis: ['ВГИК', 'Московская школа кино', 'СПбГИКиТ'], europe: ['La Fémis (Париж)', 'NFTS (Лондон)', 'Łódź Film School'], usa: ['USC School of Cinematic Arts', 'NYU Tisch', 'AFI Conservatory'], asia: ['Beijing Film Academy', 'Korea National University of Arts', 'Tokyo University of the Arts'] },
  },
  {
    id: 'linguistics', profession: 'Лингвист / переводчик', specialty: 'Лингвистика',
    universities: { cis: ['МГЛУ', 'ВШЭ', 'СПбГУ'], europe: ['Edinburgh', 'Leiden', 'Sorbonne (Париж)'], usa: ['MIT', 'Stanford', 'UC Berkeley'], asia: ['NUS (Сингапур)', 'HKU (Гонконг)', 'Tokyo University of Foreign Studies'] },
  },
  {
    id: 'urban', profession: 'Урбанист', specialty: 'Городское планирование',
    universities: { cis: ['ВШЭ, Высшая школа урбанистики', 'Шанинка', 'МАРХИ'], europe: ['TU Delft', 'UCL Bartlett (Лондон)', 'ETH Zürich'], usa: ['MIT', 'UC Berkeley', 'Columbia GSAPP'], asia: ['NUS (Сингапур)', 'Tongji (Шанхай)', 'University of Tokyo'] },
  },
  {
    id: 'education', profession: 'Педагог / EdTech-методист', specialty: 'Педагогическое образование',
    universities: { cis: ['МГПУ', 'ВШЭ, Институт образования', 'РГПУ им. Герцена'], europe: ['UCL Institute of Education', 'University of Helsinki', 'Utrecht'], usa: ['Teachers College, Columbia', 'Harvard GSE', 'Stanford GSE'], asia: ['NIE / NTU (Сингапур)', 'HKU (Гонконг)', 'Seoul National University'] },
  },
  {
    id: 'chemistry', profession: 'Химик / материаловед', specialty: 'Химия / материаловедение',
    universities: { cis: ['МГУ, химфак', 'МФТИ', 'РХТУ им. Менделеева'], europe: ['ETH Zürich', 'Cambridge', 'TU Munich'], usa: ['MIT', 'Caltech', 'Stanford'], asia: ['University of Tokyo', 'Tsinghua (Пекин)', 'NUS (Сингапур)'] },
  },
  {
    id: 'physics', profession: 'Физик / инженер-исследователь', specialty: 'Физика / прикладная физика',
    universities: { cis: ['МФТИ', 'МГУ, физфак', 'НИЯУ МИФИ'], europe: ['ETH Zürich', 'Cambridge', 'LMU München'], usa: ['MIT', 'Caltech', 'Princeton'], asia: ['University of Tokyo', 'Tsinghua (Пекин)', 'KAIST (Корея)'] },
  },
  {
    id: 'law', profession: 'Юрист', specialty: 'Юриспруденция',
    universities: { cis: ['МГУ, юрфак', 'ВШЭ', 'МГЮА'], europe: ['Oxford', 'Leiden', 'Sciences Po (Париж)'], usa: ['Harvard', 'Yale', 'Georgetown'], asia: ['NUS Law (Сингапур)', 'HKU (Гонконг)', 'University of Tokyo'] },
  },
  {
    id: 'sound', profession: 'Саунд-дизайнер / звукорежиссёр', specialty: 'Звукорежиссура',
    universities: { cis: ['СПбГИКиТ', 'РАМ им. Гнесиных', 'Московская школа кино'], europe: ['Berklee Valencia', 'Royal Academy of Music (Лондон)', 'Abbey Road Institute'], usa: ['Berklee (Бостон)', 'NYU Steinhardt', 'Full Sail'], asia: ['LASALLE (Сингапур)', 'Seoul Institute of the Arts', 'Tokyo School of Music'] },
  },
];

export const CATALOG_BY_ID = Object.fromEntries(CATALOG.map((c) => [c.id, c]));
