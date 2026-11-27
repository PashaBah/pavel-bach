// Сборка сайта (30-я редакция). Один исходник с обоими языками (src/index.html) → отдельные страницы:
//   /            — английская (основной рынок: Дубай и Европа)
//   /ru/         — русская
//   /privacy/ /cookies/ /legal/ и то же в /ru/ — юридические страницы (черновики, build/pages.mjs)
//   /404.html, /ru/404.html
// В каждой странице — только её язык (для поиска и рекламных ботов текст лежит готовым HTML), свои title/description/превью ссылки,
// canonical на себя, взаимные hreflang (en, ru, x-default → en) и разметка JSON-LD (Person, Service, VideoObject, FAQPage).
//
//   node build/build.mjs                       — тестовая версия (github.io): в корень репозитория, со стоп-тегом noindex
//   node build/build.mjs production https://<домен>  — боевая: в dist/ (+ robots.txt, sitemap.xml, _headers для Cloudflare Pages), без noindex
// Настройки — build/config.json (номер WhatsApp, ID пикселей, адрес сервера заявок, таблица кодов источника, номер выкладки).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES, NOT_FOUND } from './pages.mjs';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => fs.readFileSync(path.join(SITE, p), 'utf8');
const cfg = JSON.parse(rd('build/config.json'));
const TARGET = process.argv[2] || 'staging';
const tg = cfg.targets[TARGET];
if (!tg) throw new Error(`нет цели ${TARGET}`);
const ORIGIN = (process.argv[3] || tg.origin || '').replace(/\/$/, '');
if (!/^https:\/\//.test(ORIGIN)) throw new Error('нужен адрес сайта: node build/build.mjs production https://домен');
const BASE = new URL(`${ORIGIN}/`).pathname; // '/pavel-bach/' на github.io, '/' на своём домене
const OUT = path.resolve(SITE, tg.out);
const VER = String(cfg.version);
const PROD = TARGET === 'production';
const LANGS = ['en', 'ru'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const text = (h) => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
const write = (rel, s) => { const p = path.join(OUT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const pageUrl = (lang, sub = '') => `${ORIGIN}/${lang === 'ru' ? 'ru/' : ''}${sub}`;

// ── язык: убираем элементы с lang другого языка (с вложенностью), подставляем атрибуты data-ru-* ──
const VOID = new Set(['link', 'meta', 'img', 'input', 'br', 'source', 'hr']);
function only(src, keep) {
  const open = /<([a-zA-Z][\w-]*)\b[^>]*?\slang="(en|ru)"[^>]*>/g;
  let out = '', i = 0, m;
  while ((m = open.exec(src))) {
    const [tag, name, l] = m;
    if (name === 'html' || l === keep) continue;
    out += src.slice(i, m.index);
    let end = m.index + tag.length;
    if (!VOID.has(name.toLowerCase())) { // ищем парный закрывающий тег с учётом вложенных таких же
      const re = new RegExp(`<(/?)${name}\\b[^>]*>`, 'g');
      re.lastIndex = end;
      let depth = 1, t;
      while (depth && (t = re.exec(src))) depth += t[1] ? -1 : 1;
      if (depth) throw new Error(`не закрыт <${name}> около: ${src.slice(m.index, m.index + 80)}`);
      end = re.lastIndex;
    }
    i = end; open.lastIndex = end;
  }
  out += src.slice(i);
  // data-ru-<атрибут>: на русской странице заменяет атрибут, на английской просто убирается
  return out.replace(/<[a-zA-Z][^>]*\sdata-ru-[^>]*>/g, (t) => {
    const ru = [...t.matchAll(/\sdata-ru-([\w-]+)="([^"]*)"/g)];
    let s = t.replace(/\sdata-ru-[\w-]+="[^"]*"/g, '');
    if (keep === 'ru') for (const [, a, v] of ru) s = new RegExp(`\\s${a}="`).test(s) ? s.replace(new RegExp(`(\\s${a}=")[^"]*"`), `$1${v}"`) : s.replace(/(\s*\/?>)$/, ` ${a}="${v}"$1`);
    return s;
  });
}
// ── пути: файлы сайта — от корня (root = "" или "../"), с номером выкладки; ссылки на страницы своего языка — как есть ──
const ASSET = /^(media|css|js|fonts)\/|^favicon\.svg/;
const stamp = (u) => `${u.replace(/\?v=[^&"]*$/, '')}?v=${VER}`;
function paths(h, root) {
  const fix = (u) => (ASSET.test(u) ? root + stamp(u) : u);
  return h
    .replace(/(\s(?:src|href|data-late-src)=")([^"]+)"/g, (_, a, u) => `${a}${fix(u)}"`)
    .replace(/(\s(?:srcset|data-late-srcset)=")([^"]+)"/g, (_, a, list) => `${a}${list.split(',').map((x) => { const [u, ...r] = x.trim().split(/\s+/); return [fix(u), ...r].join(' '); }).join(', ')}"`);
}
// Типографика текста (разбор Аси): короткие слова не висят в конце строки — предлоги, союзы и частицы (до трёх букв) приклеиваются
// неразрывным пробелом к следующему слову, число — к своему слову («25 минут»), тире — к предыдущему. Только текст между тегами:
// атрибуты, скрипты, стили и <title> не трогаются.
const NB = ' ';
function typo(h, lang) {
  // предлоги, союзы, частицы: по-русски все слова из 1–2 букв и короткие служебные; по-английски — служебные слова
  const W = lang === 'ru'
    ? '[А-Яа-яЁё]{1,2}|[Дд]ля|[Бб]ез|[Пп]ри|[Пп]ро|[Пп]од|[Нн]ад|[Ии]ли|[Кк]ак|[Чч]то|[Чч]ем|[Вв]се|[Вв]ся|[Ее]го|[Ее]ё|[Ээ]то|[Уу]же|[Ее]щё'
    : 'a|an|the|of|at|in|on|to|by|or|and|for|its|his|her|our|is|as|it|we|he|so|no|be|my|up|if|I|A|An|The|Of|At|In|On|To|By|Or|And|For|It|We|He|So|No|If|Is|As';
  const short = new RegExp(`(?<=^|[ \\t\\n(«„“"'\u00a0])(${W})[ \\t\\n]+(?=\\S)`, 'gu');
  // слова через дефис тоже склеены (T-shirt, 25-minute — разбор Аси)
  // диапазоны чисел — коротким дефисом (разбор Аси), вокруг него «склейка» U+2060: Chrome иначе переносил строку после «2-»
  const fix = (t) => t.replace(/(\d)[–-](\d)/g, '$1\u2060-\u2060$2')
    .replace(/([\p{L}\d])-(?=[\p{L}\d])/gu, '$1\u2060-\u2060')
    .replace(short, `$1${NB}`)
    .replace(/(\d)[ \t\n]+(?=[A-Za-zА-Яа-яЁё×–\d])/g, `$1${NB}`)
    .replace(/[ \t\n]+([—–])[ \t\n]/g, `${NB}$1 `)
    .replace(/×[ \t\n]+/g, `×${NB}`);
  return h.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<title>[\s\S]*?<\/title>|<[^>]+>)/).map((part, i) => (i % 2 ? part : fix(part))).join('');
}
const stripComments = (h) => h.replace(/<!--(?!@)[\s\S]*?-->\n?/g, '').replace(/<[^>]*\sdata-src-only[^>]*>\n?/g, ''); // data-src-only — только для исходника (noindex на src/)

// ── тексты страниц ──
const META = {
  en: {
    title: 'Pavel Bach — Magician for Corporate Events, Dubai & Europe',
    description: 'Pavel Bach is a comedy magician and illusionist for corporate and private events in Dubai and Europe: close-up magic, a stage show and Incognito.',
    ogTitle: 'Pavel Bach — magician for corporate and private events',
    ogDescription: 'Close-up magic, a stage show and Incognito for corporate and private events in Dubai, Europe and worldwide.',
    ogAlt: 'Pavel Bach, magician',
    locale: 'en_US',
  },
  ru: {
    title: 'Павел Бах — иллюзионист на корпоратив и свадьбу',
    description: 'Павел Бах (Pavel Bach) — иллюзионист и фокусник для корпоративов, свадеб и частных событий в Европе и Дубае: микромагия, шоу на сцене, инкогнито.',
    ogTitle: 'Павел Бах — иллюзионист для корпоративных и частных событий',
    ogDescription: 'Микромагия, шоу на сцене и инкогнито для корпоративов, свадеб и частных событий в Европе, Дубае и по всему миру.',
    ogAlt: 'Павел Бах, иллюзионист',
    locale: 'ru_RU',
  },
};
// шоурилы (Cloudinary): длительность замерена ffprobe, дата загрузки — из номера версии в адресе (это время загрузки, unix)
const CLOUD = 'https://res.cloudinary.com/dl0w7cyaz/video/upload/';
const REELS = [
  { id: 'v1771244778/%D0%A8%D0%9E%D0%A3%D0%A0%D0%98%D0%9B_2_1_rncumr', dur: 22, so: 8, name: { en: 'Pavel Bach — showreel', ru: 'Павел Бах — шоурил' }, desc: { en: 'A short showreel: Pavel Bach performing at events.', ru: 'Короткий шоурил: Павел Бах на событиях.' } },
  { id: 'v1771093676/CLOSE-UP_1_oiw12t', dur: 47, so: 4, name: { en: 'Pavel Bach — close-up magic showreel', ru: 'Павел Бах — шоурил микромагии' }, desc: { en: 'Close-up magic among the guests at private and corporate events.', ru: 'Микромагия среди гостей на частных и корпоративных событиях.' } },
  { id: 'v1771094733/STAGE_MAGIC_1_go9ljb', dur: 32, so: 4, name: { en: 'Pavel Bach — stage show showreel', ru: 'Павел Бах — шоурил шоу на сцене' }, desc: { en: 'The stage show: comedy magic for the whole room.', ru: 'Шоу на сцене: комедийная магия для всего зала.' } },
];
function jsonld(lang, faq) {
  const P = `${ORIGIN}/#pavel`;
  const ru = lang === 'ru';
  const SERV = [
    { n: ru ? 'Микромагия' : 'Close-up magic', d: ru ? 'Павел переходит между небольшими группами гостей и показывает фокусы прямо у них в руках: до 60 минут на фуршете или 20–40 минут на банкете.' : "Pavel moves between small groups of guests and performs magic right in their hands: up to 60 minutes at the welcome drinks, or 20–40 minutes at dinner." },
    { n: ru ? 'Шоу на сцене' : 'Stage show', d: ru ? 'Интерактивное комедийное шоу stand-up magic для всего зала: один блок 25 минут или два блока за вечер.' : 'An interactive stand-up magic comedy show for the whole room: one 25-minute set, or two sets in one evening.' },
    { n: ru ? 'Инкогнито' : 'Incognito', d: ru ? 'Весь вечер Павел ведёт себя как обычный гость — и посреди разговора случается невозможное.' : 'All evening Pavel acts like any other guest — and mid-conversation, the impossible happens.' },
  ];
  const graph = [
    {
      '@type': 'Person', '@id': P, name: 'Pavel Bach', alternateName: ['Павел Бах'],
      jobTitle: ru ? ['Иллюзионист', 'Комедийный фокусник'] : ['Illusionist', 'Comedy magician'],
      description: META[lang].description, image: `${ORIGIN}/media/og.jpg`, url: pageUrl(lang),
      sameAs: [cfg.instagram],
      award: ru ? 'Чемпион России по иллюзионному искусству' : 'National Champion in the art of illusion',
      homeLocation: { '@type': 'Place', name: 'Barcelona' },
      knowsLanguage: ['en', 'ru'],
    },
    ...SERV.map((s) => ({ '@type': 'Service', name: s.n, description: s.d, serviceType: ru ? 'Выступление иллюзиониста' : 'Magic performance', provider: { '@id': P }, areaServed: [{ '@type': 'Country', name: 'United Arab Emirates' }, { '@type': 'Place', name: 'Europe' }] })),
    ...REELS.map((r) => ({
      '@type': 'VideoObject', name: r.name[lang], description: r.desc[lang], thumbnailUrl: `${CLOUD}so_${r.so},w_1280/${r.id}.jpg`,
      uploadDate: new Date(Number(r.id.match(/^v(\d+)/)[1]) * 1000).toISOString().replace(/\.\d+Z$/, 'Z'), duration: `PT${r.dur}S`, contentUrl: `${CLOUD}${r.id}.mp4`,
    })),
    { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ];
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`;
}
function alternates(sub) {
  return [`<link rel="alternate" hreflang="en" href="${pageUrl('en', sub)}">`, `<link rel="alternate" hreflang="ru" href="${pageUrl('ru', sub)}">`, `<link rel="alternate" hreflang="x-default" href="${pageUrl('en', sub)}">`].join('\n');
}
const robots = tg.noindex ? '<meta name="robots" content="noindex">\n' : '';
// загрузчик в <head>: настройки для js/site.js, заглушки пикселей (только очередь и init, без загрузки файлов — файлы грузит site.js после отрисовки и согласия)
function boot(lang) {
  const C = {
    staging: !PROD, lang, whatsapp: cfg.whatsapp, endpoint: tg.endpoint, meta: cfg.pixels.meta, openai: cfg.pixels.openai,
    cfAnalytics: cfg.analytics.cloudflareToken, plausible: cfg.analytics.plausibleDomain, analyticsNeedsConsent: cfg.analytics.needsConsent, codes: cfg.codes,
  };
  const EEA = 'AT|BE|BG|HR|CY|CZ|DK|EE|FI|FR|DE|GR|HU|IE|IT|LV|LT|LU|MT|NL|PL|PT|RO|SK|SI|ES|SE|IS|LI|NO|GB|CH';
  return `<script id="pb-boot">window.PB_CFG=${JSON.stringify(C)};(function(w,C){var m=C.staging&&location.search.match(/[?&]cc=([a-z]{2})(?:&|$)/i);if(m)w.NEEDS_CONSENT=/^(${EEA})$/.test(m[1].toUpperCase());`
    + `var s=null;try{s=JSON.parse(localStorage.getItem('pb_consent'))}catch(e){}if(s&&!(Date.now()-s.t<31536e6))s=null;var ok=s?!!s.ads:!w.NEEDS_CONSENT;`
    + `if(C.meta){var n=w.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!w._fbq)w._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];if(!ok)n('consent','revoke');n('set','autoConfig',false,C.meta);n('init',C.meta);n('track','PageView')}`
    + `if(C.openai){var q=w.oaiq=function(){q.q.push(arguments)};q.q=[];if(!ok)q('consent',false);var o={pixelId:C.openai};if(C.staging&&/[?&]debug/.test(location.search))o.debug=true;q('init',o)}})(window,window.PB_CFG);</script>`;
}

// ── стили: номер выкладки в адресах картинок и шрифтов (тот же, что у предзагрузки в <head>) ──
for (const f of ['css/style.css', 'css/page.css']) {
  const p = path.join(SITE, f);
  if (!fs.existsSync(p)) continue;
  const c = fs.readFileSync(p, 'utf8').replace(/url\((\.\.\/(?:media|fonts)\/[^)?]+)(\?v=[^)]*)?\)/g, (_, u) => `url(${u}?v=${VER})`);
  fs.writeFileSync(p, c);
}
// Стили главной встраиваются прямо в страницу (ТЗ: «критический CSS инлайн»): на медленной сети это минус один круг запросов до первого экрана.
// Сжатие простое и безопасное: строки и url(...) не трогаются, убираются комментарии и лишние пробелы.
function minCss(c) {
  const keep = [];
  c = c.replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\([^)]*\)|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, (m) => `\u0000${keep.push(m) - 1}\u0000`);
  c = c.replace(/\s+/g, ' ').replace(/\s*([{};,>])\s*/g, '$1').replace(/;}/g, '}').trim();
  return c.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[+i]);
}
const STYLE = minCss(rd('css/style.css'));

// ── главная ──
const SRC = rd('src/index.html');
for (const lang of LANGS) {
  const root = lang === 'ru' ? '../' : '';
  let h = only(SRC, lang);
  const faq = [...h.match(/<div class="faq">([\s\S]*?)<\/div>\s*<p class="roll-cta">/)[1].matchAll(/<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => [text(m[1]), text(m[2])]);
  const M = META[lang], url = pageUrl(lang);
  const meta = `<title>${esc(M.title)}</title>
<meta name="description" content="${esc(M.description)}">
<link rel="canonical" href="${url}">
${alternates('')}
${robots}<meta property="og:type" content="website">
<meta property="og:site_name" content="Pavel Bach">
<meta property="og:title" content="${esc(M.ogTitle)}">
<meta property="og:description" content="${esc(M.ogDescription)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/media/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(M.ogAlt)}">
<meta property="og:locale" content="${M.locale}">
<meta property="og:locale:alternate" content="${lang === 'ru' ? 'en_US' : 'ru_RU'}">
<meta name="twitter:card" content="summary_large_image">
${jsonld(lang, faq)}`;
  h = h.replace('<!--@meta-->', meta).replace('<!--@boot-->', boot(lang));
  // русская готика (купленный шрифт): включается, только если файл лежит в fonts/ — см. конец css/style.css
  const ruGoth = lang === 'ru' && fs.existsSync(path.join(SITE, 'fonts/brahms-gotisch-cyr.woff2'));
  if (ruGoth) h = h.replace('href="fonts/tinos-400-cyrillic.woff2"', 'href="fonts/brahms-gotisch-cyr.woff2"');
  h = h.replace(/<html[^>]*>/, `<html lang="${lang}" data-lang="${lang}" data-v="${VER}" data-root="${root}"${ruGoth ? ' data-rugoth="brahms"' : ''}${cfg.trick ? ' data-trick="on"' : ''}>`);
  h = h.replace(/href="@other"/g, `href="${lang === 'ru' ? '../' : 'ru/'}"`).replace(/hreflang="@otherlang"/g, `hreflang="${lang === 'ru' ? 'en' : 'ru'}"`);
  h = typo(paths(stripComments(h), root), lang);
  h = h.replace(/<link rel="stylesheet" href="[^"]*css\/style\.css[^"]*">/, () => `<style>${STYLE.replace(/url\(\.\.\//g, `url(${root}`)}</style>`);
  write(lang === 'ru' ? 'ru/index.html' : 'index.html', h);
}

// ── отдельные страницы: свой лёгкий стиль (css/page.css), без фильма и без пикселей ──
function shell(lang, { title, description, h1, body, sub, root, noindex = tg.noindex, absolute = false }) {
  const home = absolute ? `${BASE}${lang === 'ru' ? 'ru/' : ''}` : (lang === 'ru' ? `${root.replace(/^\.\.\//, '')}` || './' : root || './');
  const other = sub === null ? null : absolute ? `${BASE}${lang === 'ru' ? '' : 'ru/'}` : (lang === 'ru' ? `${root}${sub}` : `${root}ru/${sub}`);
  const r = absolute ? BASE : root;
  const nav = lang === 'ru'
    ? ['Политика конфиденциальности', 'Политика cookies', 'Правовая информация']
    : ['Privacy policy', 'Cookie policy', 'Legal notice'];
  const L = (p) => (absolute ? `${BASE}${lang === 'ru' ? 'ru/' : ''}${p}` : `${home}${p}`);
  return `<!doctype html>
<html lang="${lang}" data-lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
${description ? `<meta name="description" content="${esc(description)}">\n` : ''}${sub !== null ? `<link rel="canonical" href="${pageUrl(lang, sub)}">\n${alternates(sub)}\n` : ''}${noindex ? '<meta name="robots" content="noindex">\n' : ''}<meta name="theme-color" content="#000000">
<link rel="icon" href="${r}favicon.svg?v=${VER}" type="image/svg+xml">
<link rel="stylesheet" href="${r}css/page.css?v=${VER}">
</head>
<body>
<header class="pg-bar"><a class="brand" href="${home}">Pavel Bach</a>${other ? `<a class="lang" href="${other}" hreflang="${lang === 'ru' ? 'en' : 'ru'}"><span${lang === 'en' ? ' class="on"' : ''}>EN</span><i></i><span${lang === 'ru' ? ' class="on"' : ''}>RU</span></a>` : ''}</header>
<main class="pg">
<h1>${h1}</h1>
${body}
</main>
<footer class="pg-foot"><a href="${L('privacy/')}">${nav[0]}</a><a href="${L('cookies/')}">${nav[1]}</a><a href="${L('legal/')}">${nav[2]}</a><span>© 2026 Pavel Bach</span></footer>
</body>
</html>
`;
}
for (const [name, byLang] of Object.entries(PAGES)) {
  for (const lang of LANGS) {
    const P = byLang[lang], sub = `${name}/`;
    const root = lang === 'ru' ? '../../' : '../';
    write(`${lang === 'ru' ? 'ru/' : ''}${name}/index.html`, typo(shell(lang, { ...P, sub, root }), lang));
  }
}
// 404: адрес может быть любой глубины, поэтому пути от корня сайта
for (const lang of LANGS) {
  const N = NOT_FOUND[lang];
  const body = `<p class="pg-lede">${N.text}</p>
<p class="pg-btns"><a class="pg-btn" href="${BASE}${lang === 'ru' ? 'ru/' : ''}">${N.home}</a><a class="pg-btn ghost" href="https://wa.me/${cfg.whatsapp}" rel="noopener">${N.wa}</a></p>`;
  write(lang === 'ru' ? 'ru/404.html' : '404.html', shell(lang, { title: N.title, h1: N.h1, body, sub: null, root: '', noindex: true, absolute: true }));
}

// ── боевая сборка: копия файлов в dist/ + robots.txt, sitemap.xml, _headers ──
if (PROD) {
  for (const d of ['css', 'js', 'media', 'fonts']) fs.cpSync(path.join(SITE, d), path.join(OUT, d), { recursive: true });
  fs.copyFileSync(path.join(SITE, 'favicon.svg'), path.join(OUT, 'favicon.svg'));
  write('robots.txt', `User-agent: *\nAllow: /\n\nUser-agent: OAI-AdsBot\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
  const urls = ['', ...Object.keys(PAGES).map((n) => `${n}/`)];
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.flatMap((sub) => LANGS.map((lang) => `  <url><loc>${pageUrl(lang, sub)}</loc>${LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${pageUrl(l, sub)}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl('en', sub)}"/></url>`)).join('\n')}
</urlset>
`);
  // у всех файлов сайта в адресе номер выкладки (?v=), поэтому их можно кешировать на год; HTML — всегда свежий
  write('_headers', `/media/*
  Cache-Control: public, max-age=31536000, immutable
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/css/*
  Cache-Control: public, max-age=31536000, immutable
/js/*
  Cache-Control: public, max-age=31536000, immutable
/favicon.svg
  Cache-Control: public, max-age=31536000, immutable
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
`);
}
console.log(`${TARGET}: ${ORIGIN}/ → ${path.relative(SITE, OUT) || '.'} (v${VER})`);
