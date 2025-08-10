// App.jsx
import React, { useMemo, useState, useEffect } from 'react';
import './ui.css';

/**
 * SORA Sticker Prompt Builder — RU UI → EN prompt (pure React, single file)
 * Особенности:
 *  - Режимы: Объекты / Надписи
 *  - Форматы: 3-up / 6-up / 9-up (1..3 строки; в каждой строке 3 вариации)
 *  - Выбор объектов (Основные / Второстепенные / Декор), ракурс и поворот
 *  - Общий декор (мультивыбор) для v2/v3 с управлением вероятности (%)
 *  - Акварельный стиль + палитры: вручную либо «конструктор» (тема + акценты)
 *  - Seed + «замок» для рандомайзера (не менять seed при 🎲)
 *  - Чекбокс «уникальность вариаций» → инъекция в negative
 *  - Пресеты: сохранить/загрузить (JSON), автосохранение в LocalStorage
 *  - Экспорт текущего промпта в TXT
 *  - Счётчик длины промпта
 */

/* ==========================
   RU → EN словарь объектов
   ========================== */
const RU_EN = {
  // Основные
  'Стопка книг': 'stack of books',
  'Ноутбук': 'laptop',
  'Чашка кофе/чая': 'cup of coffee or tea',
  'Глобус': 'school globe',
  'Рюкзак': 'school backpack',
  'Настольная лампа': 'desk lamp',
  'Стакан с карандашами': 'pencil holder',
  'Атлас/карта': 'world atlas',
  'Учебник (мягкий переплёт)': 'softcover textbook',
  'Открытая книга': 'open book',
  // Второстепенные
  'Открытый планер': 'open planner',
  'Очки (круглые)': 'round glasses',
  'Наушники': 'headphones',
  'Линейка и транспортир': 'ruler and protractor',
  'Пенал': 'pencil case',
  'Калькулятор': 'calculator',
  'Лист с формулами': 'sheet of paper with formulas',
  'Коробка цветных карандашей': 'box of colored pencils',
  'Конверт с письмом': 'envelope with letter',
  'Блокнот с резинкой': 'closed notebook with elastic band',
  // Декор
  'Лист клёна': 'maple leaf',
  'Лист дуба': 'oak leaf',
  'Лист берёзы': 'birch leaf',
  'Лампочка': 'light bulb',
  'Закладка-лента': 'ribbon bookmark',
  'Закладка-стикер': 'sticky note bookmark',
  'Стопка заметок': 'small stack of notes',
  'Лента с булавкой': 'ribbon with pin',
  'Скрепки (пара)': 'pair of paperclips',
  'Календарь: 1 сентября': "calendar page '1 September'",
};

/* ==========================
   Группы для выпадающих списков
   ========================== */
const GROUPS = {
  main: [
    'Стопка книг',
    'Ноутбук',
    'Чашка кофе/чая',
    'Глобус',
    'Рюкзак',
    'Настольная лампа',
    'Стакан с карандашами',
    'Атлас/карта',
    'Учебник (мягкий переплёт)',
    'Открытая книга',
  ],
  secondary: [
    'Открытый планер',
    'Очки (круглые)',
    'Наушники',
    'Линейка и транспортир',
    'Пенал',
    'Калькулятор',
    'Лист с формулами',
    'Коробка цветных карандашей',
    'Конверт с письмом',
    'Блокнот с резинкой',
  ],
  decor: [
    'Лист клёна',
    'Лист дуба',
    'Лист берёзы',
    'Лампочка',
    'Закладка-лента',
    'Закладка-стикер',
    'Стопка заметок',
    'Лента с булавкой',
    'Скрепки (пара)',
    'Календарь: 1 сентября',
  ],
};

/* ==========================
   Ракурсы/повороты
   ========================== */
const ANGLES_RU_EN = {
  'Фронтально': 'front view',
  '¾ слева': 'three-quarter view from left',
  '¾ справа': 'three-quarter view from right',
  'Сверху': 'top view',
  'Перспектива': 'slight perspective view',
};
const ROTATIONS = ['-15°', '0°', '+15°'];

/* ==========================
   Вариации по умолчанию (EN)
   ========================== */
const DEFAULT_VARIATIONS = {
  'stack of books': [
    'clean stack, no decor',
    'stack with bookmark and maple leaf',
    'stack with reading glasses on top',
  ],
  laptop: [
    'clean laptop, closed lid',
    'laptop open with notebook beside',
    'laptop with coffee cup next to it',
  ],
  'cup of coffee or tea': [
    'clean ceramic cup',
    'cup with gentle steam',
    'cup on a small saucer with a cookie',
  ],
  'school globe': [
    'clean globe on stand',
    'globe with a small maple leaf',
    'globe with a pencil leaning on it',
  ],
  'school backpack': [
    'clean backpack, closed',
    'backpack with a small keychain',
    'backpack with books peeking out',
  ],
  'desk lamp': [
    'clean lamp, off',
    'lamp turned on with warm glow',
    'lamp with small leaf near base',
  ],
  'pencil holder': [
    'clean holder with pencils',
    'holder with ruler and scissors',
    'holder with maple leaf sticking out',
  ],
  'world atlas': [
    'closed atlas book',
    'open atlas showing continents',
    'atlas with small compass beside',
  ],
  'softcover textbook': [
    'clean closed textbook',
    'open textbook with text lines',
    'textbook with bookmark ribbon',
  ],
  'open book': [
    'double-page spread, clean',
    'underlined text and margin scribbles',
    'ribbon bookmark across the pages',
  ],
  'open planner': [
    'clean open planner with blank pages',
    'planner with dates and notes written',
    'planner with small leaf and pen on it',
  ],
  'round glasses': [
    'clean glasses with thin frame',
    'glasses with folded temples',
    'glasses resting on a paper scrap',
  ],
  headphones: [
    'clean headphones',
    'headphones with cord neatly wrapped',
    'headphones with tiny music-note doodles',
  ],
  'ruler and protractor': [
    'clean wooden ruler and protractor',
    'ruler and protractor with pencil',
    'ruler and protractor over grid paper',
  ],
  'pencil case': [
    'clean closed pencil case',
    'open pencil case with stationery inside',
    'pencil case with zipper partly open',
  ],
  calculator: [
    'clean calculator with blank display',
    'calculator with numbers displayed',
    'calculator with small pencil beside',
  ],
  'sheet of paper with formulas': [
    'clean paper with math formulas',
    'paper with chemistry formulas',
    'paper with physics diagram',
  ],
  'box of colored pencils': [
    'clean closed box',
    'open box showing pencils',
    'box with some pencils lying outside',
  ],
  'envelope with letter': [
    'clean sealed envelope',
    'envelope with letter partly visible',
    'envelope with decorative stamp',
  ],
  'closed notebook with elastic band': [
    'clean closed notebook',
    'notebook with maple leaf on cover',
    'notebook with pen attached to side',
  ],
  'maple leaf': [
    'single clean maple leaf',
    'maple leaf with light watercolor splash',
    'maple leaf with tiny ink doodle lines',
  ],
  'oak leaf': [
    'clean oak leaf',
    'oak leaf with light shadow',
    'oak leaf with ink outline accents',
  ],
  'birch leaf': [
    'single clean birch leaf',
    'birch leaf with watercolor splash',
    'birch leaf with tiny acorn next to it',
  ],
  'light bulb': [
    'clean bulb, off',
    'glowing warm yellow bulb',
    'bulb with tiny sparks and stars',
  ],
  'ribbon bookmark': [
    'clean ribbon bookmark',
    'ribbon with small tassel',
    'ribbon with maple leaf attached',
  ],
  'sticky note bookmark': [
    'clean sticky note',
    'sticky note with doodle star',
    'sticky note with exclamation mark',
  ],
  'small stack of notes': [
    'clean stack of paper',
    'stack with small doodle heart',
    'stack with paperclip attached',
  ],
  'ribbon with pin': [
    'clean ribbon pinned',
    'ribbon with doodle star',
    'ribbon with tiny maple leaf',
  ],
  'pair of paperclips': [
    'two clean silver paperclips',
    'golden paperclips with shadow',
    'paperclips with tiny note attached',
  ],
  "calendar page '1 September'": [
    'clean calendar page',
    'page with maple leaf decoration',
    'page with small doodle star',
  ],
};
// ===== Вариации v2: чистая база + атмосферные =====
const VARIATIONS_V2 = {
  'stack of books': {
    clean: [
      'standard stack of books, clean',
      'antique stack of books, worn covers, clean',
      'modern colorful stack of books, clean',
    ],
    atmo: [
      'stack of books with bookmark',
      'stack of books with reading glasses',
      'stack of books with a small cup nearby',
    ],
  },
  laptop: {
    clean: [
      'clean closed laptop',
      'clean open laptop, front view',
      'clean compact laptop (ultrabook)',
    ],
    atmo: [
      'laptop with notebook beside',
      'laptop with coffee cup next to it',
      'laptop with cable and mouse',
    ],
  },
  'cup of coffee or tea': {
    clean: [
      'clean ceramic cup',
      'tea cup with saucer, clean',
      'mug with rounded shape, clean',
    ],
    atmo: [
      'cup with gentle steam',
      'cup with cookie on saucer',
      'cup with small teaspoon',
    ],
  },
  'school globe': {
    clean: [
      'classic school globe on stand, clean',
      'vintage globe, clean',
      'minimal globe with clear oceans, clean',
    ],
    atmo: [
      'globe with a small bookmark',
      'globe with pencil leaning on it',
      'globe with tiny compass nearby',
    ],
  },
  'school backpack': {
    clean: [
      'clean backpack, closed',
      'clean backpack with front pocket',
      'clean slim school backpack',
    ],
    atmo: [
      'backpack with a small keychain',
      'backpack with books peeking out',
      'backpack with tag on handle',
    ],
  },
  'desk lamp': {
    clean: [
      'clean desk lamp, off',
      'slim desk lamp, off',
      'retro desk lamp, off',
    ],
    atmo: [
      'desk lamp turned on with warm glow',
      'desk lamp with small note under base',
      'desk lamp with cable visible',
    ],
  },
};

// Возвращает { clean:[...], atmo:[...] } для EN‑объекта.
// ВАЖНО: верхний уровень файла, не внутри компонента/массива/JSX.
const getVariations = (en) => {
  if (VARIATIONS_V2[en]) return VARIATIONS_V2[en];

  // fallback: используем старый DEFAULT_VARIATIONS как базу
  if (DEFAULT_VARIATIONS[en]) {
    const base0 = DEFAULT_VARIATIONS[en][0] || `clean ${en}`;
    return {
      clean: [
        base0,
        `variant two of ${en}, clean`,
        `variant three of ${en}, clean`,
      ],
      atmo: [
        `${en} with small prop`,
        `${en} with different arrangement`,
        `${en} with subtle extra detail`,
      ],
    };
  }

  // общий fallback
  return {
    clean: [
      `clean ${en}`,
      `alt version of ${en}, clean`,
      `modern/minimal version of ${en}, clean`,
    ],
    atmo: [
      `${en} with small prop`,
      `${en} with tiny paper scrap`,
      `${en} with subtle extra detail`,
    ],
  };
};
/* ==========================
   Цветовые темы и акценты
   ========================== */
const COLOR_THEMES = [
  { id: 'autumn-bright', label: 'Осень (яркая)', colors: ['beige', 'ochre', 'rust red', 'olive green'], note: 'warm autumn watercolor' },
  { id: 'autumn-soft',  label: 'Осень (мягкая)', colors: ['warm sand', 'caramel', 'muted brown', 'pumpkin'], note: 'soft warm autumn' },
  { id: 'spring-pastel',label: 'Весна (пастель)', colors: ['soft mint', 'pastel pink', 'baby blue', 'lavender'], note: 'pastel watercolor' },
  { id: 'summer-fresh', label: 'Лето (свежая)', colors: ['coral', 'aqua', 'lemon yellow', 'lime'], note: 'fresh light palette' },
  { id: 'winter-cool',  label: 'Зима (холодная)', colors: ['cool gray', 'steel blue', 'icy blue', 'plum'], note: 'cool desaturated' },
  { id: 'retro-warm',   label: 'Ретро (тёплая)', colors: ['mustard', 'brick red', 'olive', 'cream'], note: 'retro warm tones' },
];

const ACCENT_COLOR_POOL = [
  'soft teal', 'dusty pink', 'sage green', 'peach', 'lavender',
  'sky blue', 'mustard', 'terracotta', 'forest green', 'plum'
];

// Строим строку палитры по теме + акцентам (переиспользуем в билдере)
function buildPaletteString(theme, accents) {
  const t = COLOR_THEMES.find(x => x.id === theme);
  const base = t ? t.colors.join(', ') : 'beige, ochre, muted browns';
  const acc = accents && accents.length ? `, accents: ${accents.join(', ')}` : '';
  return `${t?.note || 'watercolor palette'}: ${base}${acc}.`;
}

/* ==========================
   Компонент приложения
   ========================== */ 
export default function App() {
  /* -------- базовые режимы/формат -------- */
  const [mode, setMode] = useState('objects'); // 'objects' | 'lettering'
  const [format, setFormat] = useState('6up'); // '3up' | '6up' | '9up'
  const rowsForFormat = useMemo(
    () => (format === '3up' ? 1 : format === '6up' ? 2 : 3),
    [format]
  );

  /* -------- строки объектов + ракурсы/повороты -------- */
  const [rowObjects, setRowObjects] = useState([
    GROUPS.main[0],
    GROUPS.main[1],
    GROUPS.main[2],
  ]);
  const [rowAngles, setRowAngles] = useState(['¾ слева', 'Фронтально', '¾ справа']);
  const [rowRotations, setRowRotations] = useState(['0°', '+15°', '-15°']);

  /* -------- палитры (конструктор) -------- */
  const [useTheme, setUseTheme] = useState(true);                         // включить конструктор
  const [theme, setTheme] = useState('autumn-soft');                      // текущая тема
  const [accentColors, setAccentColors] = useState(['soft teal', 'dusty pink']); // акценты

  /* -------- мелкие улучшения -------- */
  const [lockSeed, setLockSeed] = useState(false); // замок seed для рандомайзера
  const [decorRate, setDecorRate] = useState(100); // % вероятности декора в v2/v3
  const [enforceUnique, setEnforceUnique] = useState(true); // требовать уникальность вариаций

  /* -------- общий декор для v2/v3 -------- */
  const [commonDecor, setCommonDecor] = useState(['Лист клёна', 'Закладка-лента']);

  /* -------- стиль/ограничения -------- */
  const [palette, setPalette] = useState('Warm autumn palette: beige, ochre, muted browns.');
  const [padding, setPadding] = useState(10);        // % отступа от краёв
  const [borderWidth, setBorderWidth] = useState(10); // px — подсказка
  const [includeNegatives, setIncludeNegatives] = useState(true);
  const [seed, setSeed] = useState('');

  /* -------- lettering -------- */
  const [phrase, setPhrase] = useState('С Днём Знаний!');
  const [fontStyle, setFontStyle] = useState('elegant calligraphy');
  const [letteringBg, setLetteringBg] = useState('torn parchment paper');
  const [letteringDecor, setLetteringDecor] = useState('maple leaf');

  /* -------- 🎲 рандомайзер (не трогает выбранные объекты/формат) -------- */
  const randomize = () => {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const angleKeys = Object.keys(ANGLES_RU_EN);
    setRowAngles(Array.from({ length: 3 }, () => pick(angleKeys)));
    setRowRotations(Array.from({ length: 3 }, () => pick([...ROTATIONS])));
    setCommonDecor([...GROUPS.decor].sort(() => 0.5 - Math.random()).slice(0, 3));

    // если используется конструктор палитры — рандомим тему и 2 акцентных цвета
    if (useTheme) {
      setTheme(pick(COLOR_THEMES).id);
      const shuffled = [...ACCENT_COLOR_POOL].sort(() => 0.5 - Math.random());
      setAccentColors(shuffled.slice(0, 2));
    }
    // seed меняем только если замок выключен
    if (!lockSeed) setSeed(Math.random().toString(36).slice(2, 8));
  };

  /* ==========================
     Билдер промпта: ОБЪЕКТЫ
     ========================== */
	  const buildObjectsPrompt = () => {
	  // Палитра: конструктор (тема+акценты) или ручной ввод
	  const computedPalette = useTheme
		? buildPaletteString(theme, accentColors)
		: palette;

	  // EN-список декора и функция вероятности
	  const decorEN = commonDecor.map((d) => RU_EN[d]).filter(Boolean);
	  const shouldUseDecor = () => Math.random() * 100 < decorRate;

	  // Шапка
	  const header = [
		`Generate exactly ${rowsForFormat * 3} separate die-cut stickers in one image.`,
		`Canvas: A6, transparent PNG, ${padding}% safety margin around all edges.`,
		`Each sticker: isolated, non-overlapping, white border ${borderWidth} px (consistent), soft inner shadow.`,
		'Realistic soft watercolor, subtle paper grain, hand-drawn edges, soft shadow.',
		computedPalette,
		'Arrange stickers in distinct horizontal rows: each row is one object with 3 variations.',
		seed ? `SEED: ${seed}` : '',
	  ].filter(Boolean).join('\n');

	  // Строки: 1 объект → 3 вариации (все три — ЧИСТЫЕ базовые типы; декор подмешивается отдельно)
	  const rows = Array.from({ length: rowsForFormat }).map((_, idx) => {
		const ru = rowObjects[idx] || GROUPS.main[0];
		const en = RU_EN[ru] || ru;
		const angleEN = ANGLES_RU_EN[rowAngles[idx] || 'Фронтально'];
		const rot = rowRotations[idx] || '0°';

		// получаем чистые базы (и атмосферные, если захочешь использовать где-то ещё)
		const { clean /*, atmo*/ } = getVariations(en);
		const [v1base, v2base, v3base] = clean;

		// подмешиваем декор ТОЛЬКО как суффикс-подсказку
		const hint2 = decorEN.length && shouldUseDecor() ? ` (use one of: ${decorEN.join(', ')})` : '';
		const hint3 = decorEN.length && shouldUseDecor() ? ` (use one of: ${decorEN.join(', ')})` : '';

		return [
		  `ROW ${idx + 1}: ${en} — generate 3 distinct variations; ${angleEN}; slight ${rot.replace('°', ' degree')} rotation`,
		  `• Version 1 (Clean): ${v1base}`,         // чистый базовый вариант
		  `• Version 2 (Clean+Decor): ${v2base}${hint2}`, // чистый базовый + (опционально) декор
		  `• Version 3 (Clean+Decor): ${v3base}${hint3}`, // чистый базовый + (опционально) декор
		].join('\n');
	  }).join('\n');

	  // Негативы (с опцией уникальности вариаций)
	  const negatives = includeNegatives
		? '\nNegative prompts: no overlapping; no merged elements; no solid or gradient backgrounds; no logos/brands;'
		  + (enforceUnique
			  ? ' no identical or near-duplicate compositions; each variation must clearly change pose/angle/props;'
			  : '')
		  + ' no artifacts; no uneven borders.'
		: '';

	  return `${header}\n${rows}${negatives}\n\nOUTPUT: One PNG, transparent background, die-cut ready.`;
	};


  /* ==========================
     Билдер промпта: НАДПИСИ
     ========================== */
  const buildLetteringPrompt = () => {
    const computedPalette = useTheme
      ? buildPaletteString(theme, accentColors)
      : palette;

    const header = [
      'Generate exactly 3 separate die-cut stickers in one image.',
      `Canvas: A6, transparent PNG, ${padding}% safety margin around all edges.`,
      `Each sticker: isolated, non-overlapping, white border ${borderWidth} px (consistent), soft inner shadow.`,
      'Realistic soft watercolor lettering, hand-drawn edges, subtle paper grain.',
      computedPalette,
      seed ? `SEED: ${seed}` : '',
    ].filter(Boolean).join('\n');

    const body = [
      `Phrase: "${phrase}"`,
      `Font style: ${fontStyle}.`,
      'Version 1 (Clean): lettering alone, centered; front view.',
      `Version 2 (Atmospheric): lettering on ${letteringBg}.`,
      `Version 3 (Atmospheric): lettering with small ${letteringDecor}.`,
    ].join('\n');

    const negatives = includeNegatives
      ? '\nNegative prompts: no merged elements; no solid or gradient backgrounds; no artifacts; no text distortion; no uneven borders.'
      : '';

    return `${header}\n${body}${negatives}\n\nOUTPUT: One PNG, transparent background, die-cut ready.`;
  };

  /* -------- текст промпта + длина -------- */
  const promptText = useMemo(
    () => (mode === 'objects' ? buildObjectsPrompt() : buildLetteringPrompt()),
    [
      mode, format, rowObjects, rowAngles, rowRotations, commonDecor,
      useTheme, theme, accentColors, palette, padding, borderWidth,
      includeNegatives, decorRate, enforceUnique, seed,
      phrase, fontStyle, letteringBg, letteringDecor,
    ]
  );
  const promptLen = promptText.length;
  const warnLen = promptLen > 1800; // при желании подстрой порог

  /* ==========================
     PRESETS: serialize/apply
     ========================== */
  const makePreset = () => ({
    version: 1,
    // базовые
    mode, format, rowObjects, rowAngles, rowRotations, commonDecor,
    // палитры/улучшения
    useTheme, theme, accentColors, palette, padding, borderWidth,
    includeNegatives, lockSeed, decorRate, enforceUnique, seed,
    // lettering
    phrase, fontStyle, letteringBg, letteringDecor,
  });

  const applyPreset = (p) => {
    try {
      if (!p || p.version !== 1) throw new Error('Unsupported preset version');
      // базовые
      setMode(p.mode ?? 'objects');
      setFormat(p.format ?? '6up');
      setRowObjects(p.rowObjects ?? rowObjects);
      setRowAngles(p.rowAngles ?? rowAngles);
      setRowRotations(p.rowRotations ?? rowRotations);
      setCommonDecor(p.commonDecor ?? commonDecor);
      // палитры/улучшения
      setUseTheme(p.useTheme ?? true);
      setTheme(p.theme ?? 'autumn-soft');
      setAccentColors(p.accentColors ?? ['soft teal', 'dusty pink']);
      setPalette(p.palette ?? palette);
      setPadding(p.padding ?? 10);
      setBorderWidth(p.borderWidth ?? 10);
      setIncludeNegatives(!!p.includeNegatives);
      setLockSeed(!!p.lockSeed);
      setDecorRate(p.decorRate ?? 100);
      setEnforceUnique(!!p.enforceUnique);
      setSeed(p.seed ?? '');
      // lettering
      setPhrase(p.phrase ?? 'С Днём Знаний!');
      setFontStyle(p.fontStyle ?? 'elegant calligraphy');
      setLetteringBg(p.letteringBg ?? 'torn parchment paper');
      setLetteringDecor(p.letteringDecor ?? 'maple leaf');
    } catch (e) {
      alert('Не удалось применить пресет: ' + e.message);
    }
  };

  /* -------- helpers: download JSON/TXT -------- */
  const downloadJSON = (obj, filename) => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };
  const downloadTXT = (text, filename) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };
  const handleSavePreset = () => {
    downloadJSON(makePreset(), `sora-preset-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`);
  };
  const handleExportTxt = () => {
    downloadTXT(promptText, `sora-prompt-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.txt`);
  };
  const handleLoadPreset = async (file) => {
    try {
      const text = await file.text();
      applyPreset(JSON.parse(text));
    } catch (e) {
      alert('Ошибка загрузки пресета: ' + e.message);
    }
  };

  /* -------- вспомогательные UI-компоненты -------- */
  function OptGroup({ label, options }) {
    return (
      <optgroup label={label}>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </optgroup>
    );
  }
  function ObjectRow({ i }) {
    return (
      <div className="grid">
        <div className="row">
          <div className="col">
            <label>Строка {i + 1}: объект</label>
            <select
              value={rowObjects[i]}
              onChange={(e) => {
                const next = [...rowObjects]; next[i] = e.target.value; setRowObjects(next);
              }}
            >
              <OptGroup label="Основные" options={GROUPS.main} />
              <OptGroup label="Второстепенные" options={GROUPS.secondary} />
              <OptGroup label="Декор" options={GROUPS.decor} />
            </select>
          </div>
          <div className="col">
            <label>Ракурс</label>
            <select
              value={rowAngles[i]}
              onChange={(e) => {
                const next = [...rowAngles]; next[i] = e.target.value; setRowAngles(next);
              }}
            >
              {Object.keys(ANGLES_RU_EN).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div className="col">
            <label>Поворот</label>
            <select
              value={rowRotations[i]}
              onChange={(e) => {
                const next = [...rowRotations]; next[i] = e.target.value; setRowRotations(next);
              }}
            >
              {ROTATIONS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>
      </div>
    );
  }

  /* -------- самотест (тихий) -------- */
  useEffect(() => {
    try {
      const p1 = buildObjectsPrompt();
      const p2 = buildLetteringPrompt();
      if (typeof p1 !== 'string' || !p1.includes('Generate exactly')) console.warn('Self-test: objects prompt odd.');
      if (typeof p2 !== 'string' || !p2.includes('Generate exactly')) console.warn('Self-test: lettering prompt odd.');
    } catch (e) { console.error('Self-test failed:', e); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------- автозагрузка/автосохранение пресета -------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sora-preset:last');
      if (raw) {
        const p = JSON.parse(raw);
        if (p && p.version === 1) applyPreset(p);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('sora-preset:last', JSON.stringify(makePreset()));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mode, format, rowObjects, rowAngles, rowRotations, commonDecor,
    useTheme, theme, accentColors, palette, padding, borderWidth,
    includeNegatives, lockSeed, decorRate, enforceUnique, seed,
    phrase, fontStyle, letteringBg, letteringDecor
  ]);

  /* ==========================
     РЕНДЕР
     ========================== */
  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1 className="h1">Конструктор промптов SORA — стикеры</h1>
        <div className="actions">
          <span className="badge">A6 • watercolor • die-cut</span>
          <button className="btn" onClick={randomize}>🎲 Рандомизатор</button>
          <button className="btn" onClick={handleSavePreset}>💾 Сохранить пресет</button>
          <label className="btn">
            ⤓ Загрузить пресет
            <input type="file" accept="application/json" hidden
                   onChange={(e)=> e.target.files?.[0] && handleLoadPreset(e.target.files[0])}/>
          </label>
          <button className="btn" onClick={handleExportTxt}>⇩ Экспорт TXT</button>
        </div>
      </header>

      {/* Режим и формат */}
      <section className="card">
        <div className="legend">Режим и формат</div>
        <div className="row">
          <div className="actions">
            <button className={`btn ${mode==='objects'?'primary':''}`} onClick={()=>setMode('objects')}>Объекты</button>
            <button className={`btn ${mode==='lettering'?'primary':''}`} onClick={()=>setMode('lettering')}>Надписи</button>
          </div>
          <div className="actions">
            {[
              ['3up','3‑up (1 объект)'],
              ['6up','6‑up (2 объекта)'],
              ['9up','9‑up (3 объекта)'],
            ].map(([v,label])=>(
              <button key={v} className={`btn ${format===v?'primary':''}`} onClick={()=>setFormat(v)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Стиль + палитры + seed */}
      <section className="card grid grid-3">
        <div className="col">
          <label>Палитра (EN, уходит в промпт)</label>
          <input
            type="text"
            value={useTheme ? buildPaletteString(theme, accentColors) : palette}
            onChange={(e)=>setPalette(e.target.value)}
            disabled={useTheme}
          />
          <div className="row" style={{ marginTop: 8 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={useTheme} onChange={(e)=>setUseTheme(e.target.checked)} />
              Использовать конструктор палитры
            </label>
          </div>
        </div>

        <div className="col">
          <label>Padding (% отступа)</label>
          <div className="range">
            <input type="range" min={5} max={20} value={padding} onChange={(e)=>setPadding(+e.target.value)} />
            <output>{padding}%</output>
          </div>

          <label style={{ marginTop: 10 }}>% декора в v2/v3</label>
          <div className="range">
            <input type="range" min={0} max={100} value={decorRate} onChange={(e)=>setDecorRate(+e.target.value)} />
            <output>{decorRate}%</output>
          </div>
        </div>

        <div className="col">
          <label>Толщина каймы (px)</label>
          <div className="range">
            <input type="range" min={6} max={14} value={borderWidth} onChange={(e)=>setBorderWidth(+e.target.value)} />
            <output>{borderWidth}px</output>
          </div>

          <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:10 }}>
            <input type="checkbox" checked={enforceUnique} onChange={(e)=>setEnforceUnique(e.target.checked)} />
            требовать уникальность вариаций
          </label>
        </div>

        <div className="row" style={{ gridColumn:'1 / -1' }}>
          <div className="col">
            <label>Тема палитры</label>
            <select value={theme} onChange={(e)=>setTheme(e.target.value)} disabled={!useTheme}>
              {COLOR_THEMES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div className="col">
            <label>Акцентные цвета (мультивыбор)</label>
            <select multiple value={accentColors}
                    onChange={(e)=> setAccentColors(Array.from(e.target.selectedOptions).map(o=>o.value))}
                    disabled={!useTheme} style={{ height: 80 }}>
              {ACCENT_COLOR_POOL.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col">
            <label>Seed</label>
            <div className="row">
              <input type="text" value={seed} onChange={(e)=>setSeed(e.target.value)} />
              <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input type="checkbox" checked={lockSeed} onChange={(e)=>setLockSeed(e.target.checked)} />
                не менять Seed при 🎲
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Тело: Объекты или Надписи */}
      {mode === 'objects' ? (
        <section className="card">
          <div className="legend">Объекты и ракурсы</div>
          <div className="grid">
            {Array.from({ length: rowsForFormat }).map((_, i) => <ObjectRow key={i} i={i} />)}
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div className="col">
              <label>Общий декор для v2/v3 (мультивыбор)</label>
              <select
                multiple
                value={commonDecor}
                onChange={(e)=> setCommonDecor(Array.from(e.target.selectedOptions).map(o=>o.value))}
                style={{ height: 120 }}
              >
                {GROUPS.decor.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <div className="footer">v1 — всегда clean; v2/v3 — подмешивают один из выбранных декоров (с учётом %).</div>
            </div>
          </div>
        </section>
      ) : (
        <section className="card grid grid-2">
          <div className="col">
            <label>Фраза (по‑русски)</label>
            <input value={phrase} onChange={(e)=>setPhrase(e.target.value)} type="text" />
          </div>
          <div className="col">
            <label>Стиль шрифта</label>
            <select value={fontStyle} onChange={(e)=>setFontStyle(e.target.value)}>
              {['elegant calligraphy','playful brush lettering','bold serif','modern sans-serif with watercolor texture']
                .map((s)=> <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col">
            <label>Подложка (v2)</label>
            <select value={letteringBg} onChange={(e)=>setLetteringBg(e.target.value)}>
              {['torn parchment paper','light watercolor splash','folded paper scrap','notebook page with washi tape','none']
                .map((s)=> <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col">
            <label>Декор (v3)</label>
            <select value={letteringDecor} onChange={(e)=>setLetteringDecor(e.target.value)}>
              {['maple leaf','pencil','coffee cup','globe','light bulb'].map((s)=> <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </section>
      )}

      {/* Результат */}
      <section className="card">
        <div className="legend">Сгенерированный промпт (EN)</div>
        <textarea readOnly value={promptText} />
        <div className="actions" style={{ marginTop: 8 }}>
          <button className="btn primary" onClick={async()=>{ try{ await navigator.clipboard.writeText(promptText);}catch(e){console.error('Clipboard:',e);} }}>
            Скопировать
          </button>
        </div>
        <div className="footer">
          Символов: {promptLen} {warnLen && '• длинноват — можно короче.'}<br/>
          Подсказка: 3‑up — библиотека; 6‑up — пары; 9‑up — три объекта. 🎲 меняет ракурсы/повороты/декор/seed (если не заблокирован).
        </div>
      </section>

      <footer className="footer">
        © Prompt Builder • A6 • watercolor • border {borderWidth}px • padding {padding}%
      </footer>
    </div>
  );
}
