// Движок: скролл перематывает фильм об одной ночи, тексты лежат поверх.
// Каждая сцена — клип (перематывается), кадр или сцена из разметки; между сценами — киношные склейки (см. data-tr в index.html).

// len — длина сцены в высотах экрана; base — таймкод начала; span — сколько миллисекунд «проходит» за сцену
const SCENES = [
  { id: 'cover',   len: 1.15, base: '03:33:00.000', span: 70,  name: { en: '',                ru: '' },                  loc: { en: 'After hours',      ru: 'После полуночи' } },
  { id: 'formats', len: 1.3, base: '03:33:07.100', span: 30,  name: { en: 'Three formats',   ru: 'Три формата' },       loc: { en: 'Tracklist',        ru: 'Трек-лист' } },
  { id: 'card',    len: 4.4, base: '03:41:12.400', span: 160, name: { en: '01 — Close-up',   ru: '01 — Close-up' },     loc: { en: 'Among the guests', ru: 'Среди гостей' } },
  { id: 'king',    len: 1.7, base: '03:41:12.560', span: 20,  name: { en: '01 — Close-up',   ru: '01 — Close-up' },     loc: { en: 'Among the guests', ru: 'Среди гостей' }, rail: false },
  { id: 'stage',   len: 6.2, base: '03:52:47.120', span: 160, name: { en: '02 — Stage show', ru: '02 — Шоу на сцене' }, loc: { en: 'Main stage',       ru: 'Главная сцена' } },
  { id: 'incog',   len: 2.8, base: '04:05:30.000', span: 90,  name: { en: '03 — Incognito',  ru: '03 — Инкогнито' },    loc: { en: 'The party',        ru: 'Вечеринка' } },
  { id: 'tv',      len: 3.6, base: '04:20:00.000', span: 60,  name: { en: 'Video',           ru: 'Видео' },             loc: { en: 'On air',           ru: 'В эфире' } },
  { id: 'feat',    len: 2.0, base: '04:31:00.000', span: 40,  name: { en: 'Clients',         ru: 'Клиенты' },           loc: { en: 'Featuring',        ru: 'При участии' } },
  { id: 'titles',  len: 2.2, base: '04:36:00.000', span: 40,  name: { en: 'Credits',         ru: 'Регалии' },           loc: { en: 'On the record',    ru: 'Для протокола' } },
  { id: 'geo',     len: 2.8, base: '04:38:00.000', span: 60,  name: { en: 'Map',             ru: 'География' },         loc: { en: 'On tour',          ru: 'В дороге' } },
  { id: 'reviews', len: 3.6, base: '04:40:00.000', span: 90,  name: { en: 'Reviews',         ru: 'Отзывы' },            loc: { en: 'Shout-outs',       ru: 'Респект' } },
  { id: 'wine',    len: 3.4, base: '05:01:00.000', span: 160, name: { en: 'Your date', ru: 'Ваша дата' },     loc: { en: 'Last call',        ru: 'Последний тост' }, rail: false },
  { id: 'booking', len: 2.2, base: '05:01:11.000', span: 60,  name: { en: 'Your date',       ru: 'Ваша дата' },         loc: { en: 'After the show',   ru: 'После шоу' } },
];
// «Ваш ход» — фокус через экран (js/trick.js), сцена между обложкой и форматами.
// Пока Павел её не утвердил, она есть только по ссылке с ?trick; для всех — data-trick="on" у <html> (build/build.mjs, config.json → trick)
const TRICK = /[?&]trick\b/.test(location.search) || document.documentElement.dataset.trick === 'on';
if (TRICK) {
  SCENES.splice(1, 0, { id: 'trick', len: 1.7, base: '03:33:04.000', span: 20, name: { en: 'Your move', ru: 'Фокус для вас' }, loc: { en: 'Interactive', ru: 'Интерактив' } });
  const f = document.querySelector('.shot[data-scenes="formats"]');
  if (f) f.dataset.tr = 'wash'; // блик с зуба теперь ведёт в «Ваш ход», а форматы проявляются из стола с картами
} else {
  document.querySelectorAll('[data-scenes="trick"], [data-scene="trick"], #trick, #mole, #moleGoWrap').forEach((el) => el.remove());
}

const FADE = 0.16;   // ширина появления/ухода текста, в высотах экрана
const DIP = 0.22;    // уход в чёрное
const XFADE = 0.5;   // растворение
const FLASH = 0.26;  // за сколько до склейки разгорается блик с зуба
const FLASH_OUT = 0.2; // за сколько после склейки он гаснет
const REVEAL = 0.45; // за сколько раскрывается круг (переход iris)
const EYEW = 0.3;    // конец влёта в карту: экран уже чёрный, из черноты быстро проявляется следующая сцена
const BLK = [0.64, 0.8]; // на этом отрезке сцены king глаз короля уходит в полную черноту
const D_END = 0.8;   // к этой доле сцены king радужка заливает экран целиком
const ZTAIL = 0.17;  // какую долю конца сцены камера наезжает в точку (data-zoom)
const WHIP = 0.34;   // ширина смаз-панорамы
const STROBE = 0.16; // полуширина серии вспышек папарацци
const BURN = 0.3;    // полуширина засветки плёнки
const CRT = 0.34;    // сколько гаснет телевизор
const EXP = 0.5;     // сколько раскрывается панель формата во весь экран

const $ = (s) => document.querySelector(s);
// номер выкладки (data-v у <html>): с ним каждый файл — новый адрес, и телефон не показывает старый ролик из своей памяти
const VER = document.documentElement.dataset.v || "";
// 30-я редакция: у каждого языка своя страница (/ — английская, /ru/ — русская), а файлы общие. data-root у <html> — путь от страницы к корню сайта ("" или "../")
const ROOT = document.documentElement.dataset.root || "";
const V = (u) => {
  if (!u || /^(https?:|blob:|data:|\/)/.test(u)) return u;
  const p = ROOT + u;
  return VER ? `${p}${p.includes("?") ? "&" : "?"}v=${VER}` : p;
};
// Всё тяжёлое (ролики, постеры сцен) начинает качаться, только когда первый экран уже показан (событие load) или человек начал листать:
// иначе ролик обложки отнимал сеть у первой картинки и на телефоне в мобильной сети первый экран появлялся позже.
let go = false;
const goQueue = [];
function startHeavy() { if (go) return; go = true; document.documentElement.classList.add('ld'); goQueue.splice(0).forEach((f) => f()); }
if (document.readyState === 'complete') setTimeout(startHeavy, 0);
else window.addEventListener('load', () => setTimeout(startHeavy, 0), { once: true });
for (const t of ['scroll', 'pointerdown', 'keydown', 'wheel', 'touchstart']) window.addEventListener(t, startHeavy, { once: true, passive: true });
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const inOut = (q) => { q = clamp(q); return q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2; };

// рапид и ускорение (data-ramp="p:t,..."): доля сцены → доля клипа, по ломаной
function rampAt(r, p) {
  if (!r) return p;
  for (let k = 1; k < r.length; k++) {
    if (p <= r[k][0]) return r[k - 1][1] + (r[k][1] - r[k - 1][1]) * (p - r[k - 1][0]) / (r[k][0] - r[k - 1][0] || 1);
  }
  return r[r.length - 1][1];
}

// ── разметка маршрута ───────────────────────────
let acc = 0;
for (const s of SCENES) {
  s.start = acc; acc += s.len;
  const [h, m, sec] = s.base.split(':');
  s.baseMs = (+h * 3600 + +m * 60 + parseFloat(sec)) * 1000;
}
const TOTAL = acc;
const byId = Object.fromEntries(SCENES.map((s, i) => [s.id, i]));
const html = document.documentElement;
const scrollSpace = $('#scrollSpace');
const coarse = window.matchMedia('(pointer: coarse)').matches; // телефон: эффекты попроще
const TALL = window.matchMedia('(max-aspect-ratio: 3/4)').matches; // вертикальный экран при загрузке: берём ролики, достроенные вниз
const PACE = coarse ? 0.85 : 0.72; // сколько экранов прокрутки уходит на один «экран» фильма: меньше — скролл чувствительнее
const SAFARI = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent); // Safari плохо применяет SVG-фильтр к целой странице

// ── холст для блика ──
const fx = $('#glintFx'), fctx = fx.getContext('2d');
let fxDpr = 1;

// Раскладка считается от видимой высоты окна (vh), а прокрутка — от «большой» высоты экрана (SH, единица lvh):
// на айфоне панель Safari при скролле сворачивается, видимая высота прыгает, и без этого фильм дёргался бы.
const probe = document.createElement('div');
probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100lvh;visibility:hidden;pointer-events:none';
document.body.appendChild(probe);
let vh = window.innerHeight || 1, vw = window.innerWidth || 1, SH = 0, bigH = 0, lastW = 0, barH = 60;
const barTop = $('.bar-top'), barBottom = $('.bar-bottom');
let footH = 34; // высота нижней рейки глав
let placeAll = () => {};
function layout() {
  const keep = SH ? window.scrollY / SH : null; // место в фильме при смене высоты сохраняем
  vh = window.innerHeight || 1; // панель может открыться с нулевой высотой
  vw = window.innerWidth || 1;
  const big = probe.offsetHeight || (!bigH || vw !== lastW ? vh : bigH); // где lvh нет — фиксируем высоту до поворота экрана
  lastW = vw;
  if (big !== bigH) {
    bigH = big; SH = big * PACE;
    scrollSpace.style.height = `${TOTAL * SH + big}px`;
    if (keep !== null && Math.abs(keep * SH - window.scrollY) > 2) window.scrollTo(0, keep * SH);
  }
  html.style.setProperty('--vh', `${vh / 100}px`);
  barH = barTop.offsetHeight || clamp(0.09 * vh, 54, 86);
  footH = barBottom.offsetHeight || 34;
  fxDpr = Math.min(2, window.devicePixelRatio || 1);
  fx.width = Math.round(vw * fxDpr); fx.height = Math.round(vh * fxDpr);
  fx.style.width = `${vw}px`; fx.style.height = `${vh}px`; // холст ровно по видимому экрану: на айфоне 100vh выше него, и блик съезжал с зуба на подбородок
  placeAll();
}
layout();
window.addEventListener('resize', layout);
if (window.visualViewport) window.visualViewport.addEventListener('resize', layout); // панель Safari свернулась или развернулась
let cur = window.scrollY / SH; // где мы в фильме, в «экранах»

// ── клипы ───────────────────────────────────────
// Клип целиком скачивается в память: перемотка не зависит от сети, один файл качается один раз.
// Качаем по два, начиная с ближайшей к зрителю сцены; пока клипа нет, в кадре стоит его первый кадр (постер).
const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const LAZY = coarse || IOS; // на телефоне держим только ролики ближайших сцен: видеодекодеров и памяти у него мало
const clips = {};           // адрес → { url, state: idle | loading | ready | failed, at: где в фильме он нужен }
function clipOf(src, at) {
  if (!clips[src]) clips[src] = { url: '', state: 'idle', at };
  else clips[src].at = Math.min(clips[src].at, at);
  return clips[src];
}
// 26-я редакция. Каждый ролик лежит в трёх кодеках: H.264 (играет везде), HEVC (айфоны, маки, часть андроидов) и AV1 (новые андроиды, Chrome).
// HEVC и AV1 в 2–3 раза легче при том же виде. Берём их, только если устройство раскодирует их аппаратно (иначе перемотка станет рывками).
const CODECS = { hevc: 'hvc1.1.6.L93.B0', av1: 'av01.0.05M.08' };
let CODEC = 'h264', codecKnown = false;
async function pickCodec() {
  const forced = location.search.match(/[?&]codec=(h264|hevc|av1)/);
  if (forced) return forced[1];
  const probe = document.createElement('video');
  for (const c of (IOS || SAFARI ? ['hevc', 'av1'] : ['av1', 'hevc'])) {
    const type = `video/mp4; codecs="${CODECS[c]}"`;
    if (probe.canPlayType(type) !== 'probably') continue;
    if (!navigator.mediaCapabilities) { if (c === 'hevc') return c; continue; }
    try {
      const r = await navigator.mediaCapabilities.decodingInfo({ type: 'file', video: { contentType: type, width: 1280, height: 720, bitrate: 1500000, framerate: 24 } });
      if (r.supported && r.smooth && r.powerEfficient) return c;
    } catch (e) { /* не знает такого запроса — пробуем следующий */ }
  }
  return 'h264';
}
Promise.race([pickCodec(), new Promise((r) => setTimeout(() => r('h264'), 500))]).catch(() => 'h264').then((c) => { CODEC = c; codecKnown = true; html.dataset.codec = c; pump(); });
const wantCodec = () => (wcMode ? 'h264' : CODEC); // холст с кадрами (режим энергосбережения айфона) разбирает только H.264
// 33-я редакция: загрузка подстраивается под сеть (как авто-качество на YouTube).
//   • Скорость сети известна: до первого ролика — по тому, как пришли картинка первого экрана и скрипты, дальше — по самим роликам.
//   • Медленная сеть: берём «лёгкие» копии роликов (<имя>_l…, около 40 % веса, tools/enc33l.sh), по одному, в порядке фильма.
//     Сцена на экране без ролика получает всю полосу (загрузки дальних сцен прерываются), превью в панелях форматов ждут своей очереди.
//     Когда всё лёгкое скачано, дальние сцены по одной докачиваются в полном качестве и подменяются, пока их нет в кадре.
//   • Быстрая сеть: полные ролики, по два, как раньше.
//   • Оборвалась загрузка (метро, лифт) — ролик пробуется ещё дважды, а не остаётся стоп-кадрами до конца.
const NET = navigator.connection || {};
const SAVE = !!NET.saveData || /(^|-)2g$/.test(NET.effectiveType || '');
const SLOW = 600000;  // меньше 600 КБ/с (~5 Мбит/с): по одному ролику, приоритет сцене на экране
const LITE = 350000;  // меньше 350 КБ/с (~2,8 Мбит/с): лёгкие копии
const forcedNet = (location.search.match(/[?&]net=(slow|fast)/) || [])[1]; // для проверки: ?net=slow — вести себя как на медленной сети
let netBps = 0, netGuessed = false; // оценка скорости сети, байт/с
let focusSrc = null; // медленная сеть: ролик сцены на экране, которому отдана вся полоса (см. stock)
function netGuess() { // до первого ролика: с какой скоростью пришли картинка первого экрана, шрифты и скрипты
  let best = 0;
  try {
    for (const e of performance.getEntriesByType('resource')) {
      const dt = (e.responseEnd - e.responseStart) / 1000, sz = e.transferSize || 0;
      if (sz > 25000 && dt > 0.04) best = Math.max(best, sz / dt);
    }
  } catch (err) { /* браузер не даёт замеров */ }
  if (!best && NET.downlink) best = NET.downlink * 125000; // Chrome на андроиде знает оценку сам (Мбит/с)
  return best;
}
const ensureNet = () => { if (!netGuessed && go) { netGuessed = true; if (!netBps) netBps = netGuess(); } }; // первая оценка — когда первый экран уже загружен
const slowNet = () => { ensureNet(); return forcedNet ? forcedNet === 'slow' : netBps > 0 && netBps < SLOW; };
const liteNet = () => { ensureNet(); return forcedNet ? forcedNet === 'slow' : netBps > 0 && netBps < LITE; };
let hiPending = false; // медленная сеть: большая картинка надписи (700 КБ) ждёт, пока скачаются ролики
const clipFile = (src, codec, lite) => { const s = lite ? src.replace(/\.mp4$/, '_l.mp4') : src; return codec === 'h264' ? s : s.replace(/\.mp4$/, `.${codec}.mp4`); };
// Ролик скачивает сам браузер (r.blob()), а не скрипт по кусочкам: на слабом телефоне, когда страница занята, загрузка не притормаживает.
const toBlob = (r) => { if (!r.ok) throw Object.assign(new Error(String(r.status)), { http: r.status }); return r.blob(); };
const inFlight = new Set(); // загрузки роликов, идущие сейчас: если их две, каждая получает половину полосы
function fetchClip(src, done) {
  const c = clips[src], codec = wantCodec(), lite = !c.noLite && liteNet();
  const id = (c.fid = (c.fid || 0) + 1), rec = { t0: performance.now(), multi: inFlight.size > 0 };
  inFlight.forEach((x) => { x.multi = true; });
  inFlight.add(rec);
  c.state = 'loading';
  c.ctl = window.AbortController ? new AbortController() : null;
  fetch(V(clipFile(src, codec, lite)), c.ctl ? { signal: c.ctl.signal } : {})
    .then(toBlob)
    .then((b) => {
      inFlight.delete(rec);
      if (c.fid !== id) return; // эту загрузку прервали и начали заново
      const s = (performance.now() - rec.t0) / 1000;
      if (b.size > 100000 && s > 0.03) { const v = (b.size / s) * (rec.multi ? 2 : 1); netBps = netBps ? netBps * 0.4 + v * 0.6 : v; }
      c.blob = b; c.url = URL.createObjectURL(b); c.codec = codec; c.lite = lite; c.state = 'ready'; c.fails = 0;
    })
    .catch((e) => {
      inFlight.delete(rec);
      if (c.fid !== id) return;
      if (lite && e.http) { c.noLite = true; c.state = 'idle'; return; } // лёгкой копии нет — берём полную
      c.fails = (c.fails || 0) + 1;
      if (c.fails >= 3) { c.state = 'failed'; return; }
      c.state = 'wait'; setTimeout(() => { if (c.fid === id && c.state === 'wait') { c.state = 'idle'; pump(); } }, 1200 * c.fails);
    })
    .then(done);
}
function dropFetch(c) { // прервать загрузку (ролик дальней сцены на медленной сети): позже начнётся заново
  if (c.state !== 'loading' || !c.ctl) return;
  c.fid++; c.state = 'idle'; c.ctl.abort();
}
// Загрузка по сценам: сразу качается только то, что нужно в ближайшие экраны (LOOK). Остальное — по одному ролику, в порядке фильма,
// когда первый экран уже показан и фильм начали листать; при экономии трафика фоновой догрузки нет вовсе.
const LOOK = 3.2, BG_AFTER = performance.now() + 3000;
// 30-я редакция: дальние сцены докачиваются в фоне, только когда человек начал листать фильм. Кто открыл и смотрит первый экран
// (или закрыл страницу), не качает весь фильм — это бережёт мобильный трафик и не занимает телефон в первые секунды.
let bgOk = false;
window.addEventListener('scroll', () => { bgOk = true; }, { once: true, passive: true });
let fetching = 0;
const inUse = (src) => shots.some((sh) => sh.src === src && (sh.video || (cur > sh.from - 2 && cur < sh.to + 2))) || panels.some((q) => q.src === src && q.v);
function upgradeOne() { // всё лёгкое скачано и сеть свободна: дальняя сцена получает полное качество (подмена — пока её нет в кадре)
  if (SAVE || fetching || !bgOk) return;
  if (hiPending) { hiPending = false; hiLogo(true); }
  for (const src in clips) {
    const c = clips[src];
    if (c.state !== 'ready' || !c.lite || c.upTried || inUse(src)) continue;
    c.upTried = true; fetching++;
    const codec = wantCodec();
    fetch(V(clipFile(src, codec, false))).then(toBlob).then((b) => {
      if (inUse(src) || c.state !== 'ready') { c.upTried = false; return; } // сцена успела подойти — попробуем позже
      URL.revokeObjectURL(c.url); c.blob = b; c.url = URL.createObjectURL(b); c.codec = codec; c.lite = false;
    }).catch(() => { /* останется лёгкий */ }).then(() => { fetching--; pump(); });
    return;
  }
}
function pump() {
  if (!codecKnown || !go) return;
  ensureNet();
  if (focusSrc) { // медленная сеть, сцене на экране не хватает ролика: качаем только его
    const c = clips[focusSrc];
    if (c && c.state === 'idle') { fetching++; fetchClip(focusSrc, () => { fetching--; pump(); }); }
    return;
  }
  const slow = slowNet(), par = slow ? 1 : 2; // на медленной сети по одному: ближайший ролик готов вдвое раньше
  while (fetching < par) {
    let best = null, bd = Infinity;
    for (const low of slow ? [false, true] : [true]) { // на медленной сети превью панелей (low) — только когда ролики сцен скачаны
      for (const src in clips) {
        const c = clips[src];
        if (c.state !== 'idle' || (c.low && !low)) continue;
        const d = c.at >= cur - 0.5 ? c.at - cur : (cur - c.at) * 3 + 2; // сначала то, что впереди
        if (d < bd) { bd = d; best = src; }
      }
      if (best) break;
    }
    if (!best) { upgradeOne(); return; }
    if (bd > LOOK && (SAVE || !bgOk || fetching > 0 || performance.now() < BG_AFTER)) return; // дальние сцены — в фоне, по одной, когда фильм начали листать
    fetching++;
    fetchClip(best, () => { fetching--; pump(); });
  }
}
// Раскадровка: лёгкие кадры клипа (каждые 0,8 с). Пока ролик не показывает картинку — качается, или телефон не дал его запустить, —
// в кадре листаются они, так что сцена читается в любом случае.
const FRAMES = {};
fetch(V('media/frames/index.json')).then((r) => (r.ok ? r.json() : {})).then((d) => Object.assign(FRAMES, d)).catch(() => {});
function flipbook(sh, p) {
  const F = FRAMES[sh.name], v = sh.video;
  if (!go || !F || (v && v._primed && v.readyState >= 2)) return;
  const k = Math.min(F.n - 1, Math.round(rampAt(sh.ramp, p) * F.dur / F.step));
  if (!sh.fr) sh.fr = [];
  const slow = slowNet(); // на медленной сети — один кадр за раз: полоса нужнее самому ролику
  for (const n of slow ? [k] : [k, k + 1]) { // нужный кадр и следующий за ним
    if (n >= F.n || sh.fr[n] || (slow && sh.frBusy)) continue;
    const im = new Image();
    im.decoding = 'async'; im.onload = () => { im.ok = true; sh.frBusy = false; }; im.onerror = () => { sh.frBusy = false; };
    sh.frBusy = true;
    im.src = V(`media/frames/${sh.name}/${n}.jpg`);
    sh.fr[n] = im;
  }
  let n = k;
  while (n >= 0 && !(sh.fr[n] && sh.fr[n].ok)) n--;
  if (n >= 0 && sh.frShown !== n) { sh.frShown = n; sh.poster.src = sh.fr[n].src; }
}
const posterOf = (src, pre = '') => src.replace(/([^/]+)\.mp4$/, `posters/${pre}$1.jpg`);

// Айфон не подгружает кадры ролика, пока тот хоть раз не запущен, поэтому каждый ролик запускаем без звука и сразу ставим на паузу.
// В режиме энергосбережения автозапуск запрещён: тогда ролики оживают по первому нажатию (без подсказки — она мешала), а до того сцены идут по кадрам.
let blocked = false;
const stuck = (e) => { // только настоящий запрет автозапуска; прерванный запуск (ролик убрали из кадра) — не в счёт
  if (e && e.name !== 'NotAllowedError') return;
  blocked = true;
  if (WC_OK && !wcMode) { // переходим на показ кадров холстом: ролики, которые не запустились, пересоздаются
    wcMode = true;
    for (const sh of shots) if (sh.video && !sh.video._wc && !sh.video._primed) disarm(sh);
  }
};
function prime(v) {
  const p = v.play();
  if (p) p.then(() => { v._primed = true; setTimeout(() => { if (!v._play) v.pause(); }, 120); }).catch(stuck); // даём декодеру стартовать и ставим на паузу
}
function playV(v) {
  v._play = true;
  const p = v.play();
  if (p) p.then(() => { v._primed = true; }).catch(stuck);
}
function makeVideo(src, url, loop) {
  const v = document.createElement('video');
  v.muted = true; v.defaultMuted = true; v.playsInline = true; v.loop = !!loop; v.preload = 'auto'; v.disableRemotePlayback = true;
  v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
  v.addEventListener('error', () => { // ролик из памяти не открылся — берём файл напрямую с сервера
    if (v._direct || !src) return;
    CODEC = 'h264'; // этот кодек устройство не потянуло: и этот ролик, и следующие берём в H.264
    v._direct = true; v.src = V(src); v.load();
    if (v._play) playV(v); else prime(v);
  });
  v.src = url;
  return v;
}
function dropVideo(v) { if (v._wc) { v._wc.close(); v.remove(); return; } v.pause(); v.removeAttribute('src'); v.load(); v.remove(); }
const filmVideos = () => [...document.querySelectorAll('#film video')];
function unlock() {
  if (!blocked) return;
  blocked = false;
  filmVideos().forEach((v) => { if (v._play) playV(v); else if (!v._primed) prime(v); });
}
['touchend', 'click', 'keydown'].forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));
document.addEventListener('visibilitychange', () => { // вкладку свернули и вернули: айфон мог выгрузить ролики
  if (document.visibilityState !== 'visible') return;
  filmVideos().forEach((v) => { if (v._play) playV(v); else if (IOS) prime(v); });
});


// ── кадры ролика на холсте (WebCodecs) ──────────
// В режиме энергосбережения айфон не даёт запустить <video> без нажатия. Раскодировать кадры и рисовать их на холсте можно и без этого:
// тогда ролик всё равно идёт за скроллом, а не листается редкими кадрами. Холст ведёт себя для движка как <video> (currentTime, readyState, duration).
const FORCE_WC = /[?&]wc=1/.test(location.search); // для проверки на компьютере: сразу этот режим
const WC_OK = typeof window.VideoDecoder === 'function' && typeof window.EncodedVideoChunk === 'function';
let wcMode = FORCE_WC && WC_OK;
function mp4Index(buf) { // таблица кадров mp4: где лежит каждый кадр, какие ключевые, параметры кодека
  const dv = new DataView(buf), u8 = new Uint8Array(buf);
  const boxes = (s, e) => {
    const out = [];
    while (s + 8 <= e) {
      let size = dv.getUint32(s), h = 8;
      const type = String.fromCharCode(u8[s + 4], u8[s + 5], u8[s + 6], u8[s + 7]);
      if (size === 1) { size = Number(dv.getBigUint64(s + 8)); h = 16; } else if (size === 0) size = e - s;
      if (size < h) break;
      out.push({ type, s: s + h, e: s + size }); s += size;
    }
    return out;
  };
  const find = (list, t) => list.find((b) => b.type === t);
  const moov = find(boxes(0, buf.byteLength), 'moov');
  if (!moov) return null;
  for (const trak of boxes(moov.s, moov.e).filter((b) => b.type === 'trak')) {
    const mdia = find(boxes(trak.s, trak.e), 'mdia');
    if (!mdia) continue;
    const mk = boxes(mdia.s, mdia.e), hdlr = find(mk, 'hdlr'), minf = find(mk, 'minf'), mdhd = find(mk, 'mdhd');
    if (!hdlr || !minf || !mdhd || String.fromCharCode(...u8.subarray(hdlr.s + 8, hdlr.s + 12)) !== 'vide') continue;
    const ts = dv.getUint32(mdhd.s + (u8[mdhd.s] === 1 ? 20 : 12));
    const stbl = find(boxes(minf.s, minf.e), 'stbl'), sb = boxes(stbl.s, stbl.e);
    const entry = boxes(find(sb, 'stsd').s + 8, find(sb, 'stsd').e)[0];
    if (!entry || entry.type !== 'avc1') return null;
    const w = dv.getUint16(entry.s + 24), h = dv.getUint16(entry.s + 26), avcC = find(boxes(entry.s + 78, entry.e), 'avcC');
    if (!avcC) return null;
    const desc = u8.slice(avcC.s, avcC.e), hex = (x) => x.toString(16).padStart(2, '0');
    const stsz = find(sb, 'stsz'), fixed = dv.getUint32(stsz.s + 4), n = dv.getUint32(stsz.s + 8), size = new Uint32Array(n);
    for (let i = 0; i < n; i++) size[i] = fixed || dv.getUint32(stsz.s + 12 + i * 4);
    const stco = find(sb, 'stco'), cb = stco || find(sb, 'co64'), nc = dv.getUint32(cb.s + 4), chunk = [];
    for (let i = 0; i < nc; i++) chunk.push(stco ? dv.getUint32(cb.s + 8 + i * 4) : Number(dv.getBigUint64(cb.s + 8 + i * 8)));
    const stsc = find(sb, 'stsc'), runs = [];
    for (let i = 0, m = dv.getUint32(stsc.s + 4); i < m; i++) runs.push([dv.getUint32(stsc.s + 8 + i * 12), dv.getUint32(stsc.s + 12 + i * 12)]);
    const off = new Float64Array(n);
    let k = 0;
    for (let r = 0; r < runs.length; r++) {
      const last = r + 1 < runs.length ? runs[r + 1][0] - 1 : nc;
      for (let c = runs[r][0]; c <= last; c++) { let o = chunk[c - 1]; for (let j = 0; j < runs[r][1] && k < n; j++) { off[k] = o; o += size[k]; k++; } }
    }
    const stss = find(sb, 'stss'), key = new Uint8Array(n);
    if (stss) { for (let i = 0, m = dv.getUint32(stss.s + 4); i < m; i++) key[dv.getUint32(stss.s + 8 + i * 4) - 1] = 1; } else key.fill(1);
    const stts = find(sb, 'stts');
    let dur = 0;
    for (let i = 0, m = dv.getUint32(stts.s + 4); i < m; i++) dur += dv.getUint32(stts.s + 8 + i * 8) * dv.getUint32(stts.s + 12 + i * 8);
    return { u8, w, h, codec: `avc1.${hex(desc[1])}${hex(desc[2])}${hex(desc[3])}`, desc, n, size, off, key, duration: dur / ts, fps: n / (dur / ts) };
  }
  return null;
}
function wcVideo(c, sh) {
  const cv = document.createElement('canvas');
  cv.className = 'wcv';
  cv._primed = true; cv.readyState = 0; cv.seeking = false; cv.duration = 0; cv.paused = true;
  cv.play = () => Promise.resolve(); cv.pause = () => {}; cv.load = () => {};
  let ix = null, dec = null, ctx = null, shown = -1, want = 0, batch = -1, busy = false, dead = false, t = 0;
  const fail = () => { // не вышло — сцена остаётся на раскадровке, как раньше
    if (dead) return;
    dead = true; cv.readyState = 0; cv._primed = false; sh.wcFailed = true;
    try { if (dec && dec.state !== 'closed') dec.close(); } catch (e) { /* уже закрыт */ }
  };
  async function run() {
    busy = true; cv.seeking = true;
    while (!dead && want !== shown) {
      const i = want;
      let k = i;
      while (k > 0 && !ix.key[k]) k--;
      batch = i;
      try {
        for (let j = k; j <= i; j++) dec.decode(new EncodedVideoChunk({ type: ix.key[j] ? 'key' : 'delta', timestamp: j * 1000, data: ix.u8.subarray(ix.off[j], ix.off[j] + ix.size[j]) }));
        await dec.flush(); // после flush следующий кусок — снова с ключевого кадра
      } catch (e) { fail(); return; }
      shown = i;
    }
    busy = false; cv.seeking = false;
  }
  const go = (i) => { want = i; if (ix && dec && !busy && !dead && want !== shown) run(); };
  Object.defineProperty(cv, 'currentTime', { get: () => t, set: (v) => { t = v; if (ix) go(clamp(Math.round(v * ix.fps), 0, ix.n - 1)); } });
  cv._wc = { close: () => { dead = true; try { if (dec && dec.state !== 'closed') dec.close(); } catch (e) { /* уже закрыт */ } } };
  c.blob.arrayBuffer().then(async (buf) => {
    if (dead) return;
    ix = mp4Index(buf);
    if (!ix) throw new Error('mp4');
    const cfg = { codec: ix.codec, description: ix.desc, codedWidth: ix.w, codedHeight: ix.h, optimizeForLatency: true,
      colorSpace: { primaries: 'bt709', transfer: 'iec61966-2-1', matrix: 'bt709', fullRange: false } }; // как помечены сами файлы: без сдвига гаммы
    const sup = await VideoDecoder.isConfigSupported(cfg);
    if (!sup.supported || dead) throw new Error('codec');
    cv.width = ix.w; cv.height = ix.h; ctx = cv.getContext('2d');
    dec = new VideoDecoder({
      output: (f) => { if (Math.round(f.timestamp / 1000) === batch && !dead) { ctx.drawImage(f, 0, 0, cv.width, cv.height); cv.readyState = 4; } f.close(); },
      error: fail,
    });
    dec.configure(cfg);
    cv.duration = ix.duration; cv.readyState = 1;
    go(clamp(Math.round(t * ix.fps), 0, ix.n - 1));
  }).catch(fail);
  return cv;
}

// ── фильм ───────────────────────────────────────
const shots = [...document.querySelectorAll('.shot')].map((el) => {
  const ids = el.dataset.scenes.split(' ');
  const first = SCENES[byId[ids[0]]], last = SCENES[byId[ids[ids.length - 1]]];
  const sh = {
    el, id: ids[0], tr: (TALL && el.dataset.trM) || el.dataset.tr || '', fade: parseFloat(el.dataset.fade || XFADE), zoomer: el.classList.contains('zoomer'),
    cx: el.dataset.cx || '50%', cy: el.dataset.cy || '50%', mx: parseFloat(el.dataset.mx || 50) / 100, dx: el.dataset.dx || '0%', bs: el.dataset.bs || 1,
    ramp: el.dataset.ramp ? el.dataset.ramp.split(',').map((q) => q.split(':').map(Number)) : null,
    zoom: null, from: first.start, to: last.start + last.len, video: null, shown: -1, clip: '', tx: 0, crt: false,
    live: el.hasAttribute('data-live'),                                   // клип не перематывается скроллом, а играет по кругу
    mx2: el.dataset.mx2 ? parseFloat(el.dataset.mx2) / 100 : null,        // на вертикальном экране кадр панорамирует от data-mx к data-mx2
    pan: (el.dataset.pan || '0.4,0.7').split(',').map(Number), mxNow: -1, w: 0, h: 0, shift: 0, dive: null, fit: null, on: false,
    onAt: parseFloat(el.dataset.on || 0.66),
    dimAt: el.dataset.dim ? SCENES[byId[el.dataset.dim]].start - 0.2 : null, // с этого места кадр темнеет под текстом (финал: под формой заявки)
    noP: el.classList.contains('girls'),                              // с какой доли сцены то, что внутри кадра, можно нажимать
  };
  // влёт в карту: data-card="cx,cy,w,rot" — где в последнем кадре клипа лежит карта (центр и ширина в % кадра, наклон в градусах)
  if (el.dataset.card) {
    const [cx, cy, cw, rot] = el.dataset.card.split(',').map(parseFloat);
    const k = SCENES[byId.king];
    sh.dive = { cx: cx / 100, cy: cy / 100, cw: cw / 100, rot, from: k.start, to: k.start + k.len, d: -1 };
    // слои глубокого влёта: рисунок карты и макро-снимки глаза, каждый лежит на своём месте карты (data-rect — доли ширины и высоты карты)
    sh.dive.layers = [el.querySelector('.kcard img'), ...el.querySelectorAll('.deepsrc img')].map((img) => ({
      img, r: (img.dataset.rect || '0,0,1,1').split(',').map(Number), src: null,
    }));
    const card = el.querySelector('.kcard');
    card.style.left = `${cx}%`; card.style.top = `${cy}%`; card.style.width = `${cw}%`; card.style.rotate = `${rot}deg`;
  }
  if (el.dataset.fit) {
    const [x0, y0, x1, y1, pa, pb] = el.dataset.fit.split(',').map(parseFloat);
    sh.fit = { x0: x0 / 100, y0: y0 / 100, x1: x1 / 100, y1: y1 / 100, pa, pb, e: -1 };
  }
  if (el.dataset.zoom) {
    const [zx, zy, zk] = el.dataset.zoom.split(',');
    sh.zoom = { k: parseFloat(zk) };
    el.style.transformOrigin = `${zx} ${zy}`;
  }
  // на вертикальном экране у некоторых сцен свой ролик: тот же кадр, достроенный вниз до квадрата (data-src-m)
  const tallM = !!el.dataset.srcM && TALL;
  if (tallM) el.classList.add('tallm');
  // вертикальный экран видит только середину кадра 16:9. Для него у сцены может быть свой ролик — только эта середина (data-src-t), крупнее и резче
  // при том же весе; data-win="x0,w" — какую часть ширины кадра он занимает
  const tallT = !tallM && !!el.dataset.srcT && TALL;
  if (tallT) { const [wx, ww] = el.dataset.win.split(',').map(Number); el.classList.add('win'); el.style.setProperty('--wx', `${wx * 100}%`); el.style.setProperty('--ww', `${ww * 100}%`); }
  const src = tallM ? el.dataset.srcM : tallT ? el.dataset.srcT : el.dataset.src;
  if (src && /\.mp4$/.test(src)) {
    sh.src = src;
    sh.name = src.replace(/^.*\/|\.mp4$/g, '');
    clipOf(src, sh.from);
    const img = new Image();
    img.alt = ''; img.className = 'poster'; img.decoding = 'async';
    sh.posterSrc = V(posterOf(src)); // постеры — за три экрана до сцены или когда сеть свободна (см. stock); у обложки сверху и так стоит резкий первый кадр (.hero)
    el.prepend(img);
    sh.poster = img;
  } else if (src) {
    sh.imgSrc = src; // картинку сцены грузим, когда до неё недалеко или когда клипы уже скачаны
  }
  return sh;
});
shots.forEach((sh, k) => { sh.next = shots[k + 1]; sh.prev = shots[k - 1]; });
if (/[?&]dbg/.test(location.search)) window.__phonk = { shots, clips, get wc() { return wcMode; }, get blocked() { return blocked; }, state: () => ({ go, codecKnown, bgOk, netBps: Math.round(netBps), slow: slowNet(), lite: liteNet(), focus: focusSrc, SAVE, fetching, cur }), pump: () => pump() }; // для проверки
const diveShot = shots.find((sh) => sh.dive);
// карта короля и снимок глаза грузятся, когда до сцены с картой два экрана или сеть свободна (см. stock): первый экран их не ждёт
const NOVIDEO = /[?&]novideo/.test(location.search); // для проверки: сайт без роликов, на одной раскадровке (как на телефоне, который не запустил видео)
function arm(sh) { // ролик сцены встаёт в кадр поверх постера
  const c = clips[sh.src];
  if (NOVIDEO || sh.video || !c || c.state !== 'ready') return;
  if (wcMode && c.codec !== 'h264' && !sh.wcFailed) { URL.revokeObjectURL(c.url); c.url = ''; c.blob = null; c.state = 'idle'; return; } // для холста нужен H.264: перекачиваем
  if (wcMode && c.blob && !sh.live && !sh.wcFailed) { const v = wcVideo(c, sh); sh.poster.after(v); sh.video = v; return; }
  const v = makeVideo(sh.src, c.url, sh.live);
  sh.poster.after(v);
  sh.video = v;
  if (sh.live) playV(v); else prime(v);
}
function disarm(sh) { if (sh.video) { dropVideo(sh.video); sh.video = null; } }
function fetchNow(src) { // ролик нужен прямо сейчас — качаем вне очереди (очередь могла быть занята дальними сценами)
  const c = clips[src];
  if (!codecKnown || !go || !c || c.state !== 'idle') return;
  fetchClip(src, () => {});
}
function warmFrames(sh) { // раскадровка сцены целиком: если ролик не успел, сцена всё равно идёт по кадрам, а не стоит на первом
  const F = FRAMES[sh.name];
  if (!F || sh.warm) return;
  sh.warm = true;
  if (!sh.fr) sh.fr = [];
  for (let n = 0; n < F.n; n++) {
    if (sh.fr[n]) continue;
    const im = new Image();
    im.decoding = 'async'; im.onload = () => { im.ok = true; };
    im.src = V(`media/frames/${sh.name}/${n}.jpg`);
    sh.fr[n] = im;
  }
}
function stock() { // что держать наготове: ролики и картинки ближайших сцен
  if (!go) return;
  // 33-я редакция, медленная сеть: сцена на экране (или в полэкрана от него) без готового ролика получает всю полосу —
  // загрузки дальних роликов прерываются (потом начнутся заново), новые не начинаются, пока её ролик не скачан
  let focus = null, fd = Infinity; const near = new Set();
  for (const sh of shots) {
    if (!sh.src) continue;
    const d = cur < sh.from ? sh.from - cur : cur > sh.to ? cur - sh.to : 0, c = clips[sh.src];
    if (d < 1) near.add(sh.src);
    if (d < 0.5 && c && c.state !== 'ready' && c.state !== 'failed' && d < fd) { fd = d; focus = sh; }
  }
  focusSrc = focus && slowNet() ? focus.src : null;
  if (focusSrc) for (const src in clips) if (!near.has(src)) dropFetch(clips[src]);
  pump();
  // «Сеть свободна» — только когда все ролики скачаны (или не скачались совсем). Раньше это считалось по счётчику очереди, и в паузе между двумя
  // роликами сайт разом запускал картинки всех будущих сцен (около 1,3 МБ) — они и отнимали сеть у ролика, который нужен прямо сейчас.
  let busy = inFlight.size > 0 || fetching > 0;
  if (!busy) for (const src in clips) { const st = clips[src].state; if (st === 'idle' || st === 'loading' || st === 'wait') { busy = true; break; } }
  const idle = !busy && !SAVE && bgOk && performance.now() > BG_AFTER;
  if (!mapAsked && (idle || cur > SCENES[byId.tv].start - 3)) { // за три экрана до телевизоров (или когда сеть свободна): превью в экранах, логотипы клиентов, карта мира
    mapAsked = true; askMap();
    document.querySelectorAll('img[data-lz]').forEach((im) => { im.src = V(im.dataset.lz); });
    document.querySelectorAll('img[data-same-as-cover]').forEach((im) => { const c = $('.chapter.cover .ice-logo'); if (c && c.currentSrc) im.src = c.currentSrc; }); // финальная надпись — та же картинка, что на обложке (уже скачана)
    document.querySelectorAll('img[data-lz2]').forEach((im) => { im.src = im.dataset.lz2; });
    screensLive.forEach((v) => { if (v._poster) v.poster = v._poster; }); // превью в телевизорах лежат на другом сервере
  }
  for (const sh of shots) {
    const d = cur < sh.from ? sh.from - cur : cur > sh.to ? cur - sh.to : 0;
    if (sh.src && d < 1.2 && !(sh.video && sh.video._primed)) {
      fetchNow(sh.src);
      // запасные кадры целиком нужны, только если видео точно не будет: автозапуск запрещён, ролик не скачался, режим проверки.
      // Пока ролик просто качается, хватает двух ближайших кадров (их берёт flipbook) — иначе на каждой сцене зря качались бы десятки картинок.
      if (blocked || NOVIDEO || clips[sh.src].state === 'failed') warmFrames(sh);
    }
    if (sh.src) {
      if (d < (LAZY ? 1.3 : 2.2)) arm(sh); else if (d > (LAZY ? 1.6 : 2.8)) disarm(sh); // и на компьютере держим 3–4 плеера, а не все двенадцать
    }
    const slow = slowNet();
    if (sh.poster && !sh.poster.src && (d < (slow ? 1.5 : 3) || idle)) sh.poster.src = sh.posterSrc;
    const clipOk = !sh.src || !slow || clips[sh.src].state === 'ready' || clips[sh.src].state === 'failed'; // медленная сеть: сначала ролик сцены, потом её большие картинки
    if ((d < 2 && clipOk) || idle) {
      if (sh.imgSrc && !sh.img) { sh.img = new Image(); sh.img.alt = ''; sh.img.onload = () => sh.el.prepend(sh.img); sh.img.src = V(sh.imgSrc); }
      if (!sh.lazyDone) { sh.lazyDone = true; sh.el.querySelectorAll('img[data-src]').forEach((im) => { im.src = V(im.dataset.src); }); }
    }
  }
}

// Кадр 16:9 накрывает экран. На вертикальном экране видна только его часть — data-mx говорит, какую точку держать в центре.
// На широком экране кадр можно сдвинуть и укрупнить (data-dx, data-bs), чтобы герой не оказался под текстом.
const KS = 1.05; // чёткая карта чуть крупнее карты из ролика: размытый край той не выглядывает из-под неё ореолом
const KAR = 1261 / 1724; // пропорции картинки карты (media/king.webp)
const EYE = [0.44256, 0.23188]; // куда на карте влетает камера: самая тёмная часть радужки левого глаза короля, ниже блика (доли ширины и высоты карты)
const R_END = 0.00317;  // в конце влёта полудиагональ экрана — это столько ширины карты (4 px рисунка): вокруг только тёмная радужка, блик уже за кадром
const PAPER = ['#cbc2b7', '#a9a095', '#877e74']; // тон бумаги карты (умножается на рисунок): свет сверху слева, к нижнему краю темнее
const GEM = [0.4806, 0.4860]; // бриллиант в зубе на последнем кадре обложки (доли кадра 16:9): из него разгорается блик
function shiftTo(sh, mx) {
  const slack = Math.max(0, (sh.w - vw) / 2);
  sh.shift = clamp((0.5 - mx) * sh.w, -slack, slack);
  sh.el.style.setProperty('--shift', `${sh.shift.toFixed(1)}px`);
}
function place(sh) {
  const el = sh.el;
  if (el.classList.contains('trip')) return;
  const shown = el.style.display;
  if (shown === 'none' || !shown) el.style.display = 'block'; // размер известен, только когда кадр показан
  sh.w = el.offsetWidth || Math.max(vw, vh * 16 / 9);
  sh.h = el.offsetHeight || sh.w * 9 / 16;
  sh.mxNow = -1;
  shiftTo(sh, sh.mx);
  const left0 = el.offsetLeft - sh.w / 2, top0 = el.offsetTop - sh.h / 2; // левый верхний угол кадра на экране (пока кадр показан)
  sh.cx = el.offsetLeft; sh.cy = el.offsetTop;                            // и его центр
  if (shown === 'none' || !shown) el.style.display = shown;
  const wide = vw / vh > 1.25;
  el.style.setProperty('--dx', wide ? sh.dx : '0%');
  el.style.setProperty('--bs', wide ? sh.bs : 1);
  if (sh.dive) {
    // точка между глаз короля в координатах кадра: вокруг неё кадр растёт и поворачивается
    const D = sh.dive, cwp = D.cw * sh.w, chp = cwp / KAR, a = D.rot * Math.PI / 180;
    const ox = (EYE[0] - 0.5) * cwp, oy = (EYE[1] - 0.5) * chp;
    // карта поверх ролика повёрнута вокруг самого глаза (transform-origin в CSS), поэтому глаз лежит на неповёрнутом смещении от центра.
    // Раньше смещение здесь поворачивалось — точка наезда уходила на 3 px, и к моменту, когда карту подхватывает холст, это вырастало в скачок на 20 px
    D.ax = D.cx * sh.w + ox;
    D.ay = D.cy * sh.h + oy;
    el.style.transformOrigin = `${D.ax.toFixed(1)}px ${D.ay.toFixed(1)}px`;
    D.px = left0 - sh.shift + D.ax; // где эта точка на экране до наезда (без учёта панорамы --shift)
    D.py = top0 + D.ay;
    D.s1 = Math.max(0.75 * vw, 0.75 * vh) / cwp; // к середине влёта карта шире экрана: видно только лицо короля
    D.cwp = cwp;
    D.zEnd = (Math.hypot(vw, vh) / 2 / R_END) / (cwp * KS); // в конце радужка шире экрана: камера внутри глаза
    D.d = -1;
  }
  if (sh.fit) {
    // рамка (стена телевизоров) должна целиком встать между полосами: на широком экране — справа от текста, на вертикальном — сверху
    const F = sh.fit, bar = barH, tall = vw / vh < 0.8;
    const bw = (F.x1 - F.x0) * sh.w, bh = (F.y1 - F.y0) * sh.h;
    const sx0 = tall ? 8 : 0.38 * vw, sx1 = vw - (tall ? 8 : 20);
    const sh_ = tall ? 0.6 * (vh - bar - footH) : vh - bar - footH - 20;
    F.k = Math.min((sx1 - sx0) / bw, sh_ / bh, 1.7);
    F.ax = (F.x0 + F.x1) / 2 * sh.w; F.ay = (F.y0 + F.y1) / 2 * sh.h;
    el.style.transformOrigin = `${F.ax.toFixed(1)}px ${F.ay.toFixed(1)}px`;
    F.px = left0 - sh.shift + F.ax; F.py = top0 + F.ay;
    F.tx = (sx0 + sx1) / 2; F.ty = tall ? bar + 8 + bh * F.k / 2 : (bar + vh - footH) / 2;
    F.e = -1;
  }
}
placeAll = () => shots.forEach(place);
placeAll();

// точка кадра (доли) → точка экрана
function onScreen(sh, fx_, fy_) {
  const r = sh.el.getBoundingClientRect();
  return [r.left + fx_ * r.width, r.top + fy_ * r.height];
}

// как сцена появляется (по своему переходу) и как уходит (по переходу следующей)
function visIn(sh, k) {
  if (k === 0) return +(cur >= sh.from);
  switch (sh.tr) {
    case 'wash': return smooth((cur - sh.from) / sh.fade);
    case 'whip': return +(cur >= sh.from - WHIP / 2);
    case 'expand': return +(cur >= sh.from - EXP);
    case 'crt': return smooth((cur - sh.from - 0.04) / DIP);
    case 'flash': case 'strobe': case 'burn': case 'iris': return +(cur >= sh.from);
    case 'eye': return smooth((cur - (sh.from - EYEW)) / EYEW); // проявляется из полной черноты
    default: return smooth((cur - sh.from) / DIP);
  }
}
function visOut(sh) {
  const n = sh.next;
  if (!n) return 1;
  switch (n.tr) {
    case 'flash': case 'strobe': case 'burn': case 'expand': case 'crt': return +(cur < sh.to);
    case 'whip': return +(cur < sh.to + WHIP / 2);
    case 'iris': return +(cur < sh.to + REVEAL);
    case 'eye': return +(cur < sh.to); // карту дальше рисует холст глубокого влёта (он гаснет сам)
    case 'wash': return +(cur < sh.to + n.fade);
    default: return 1 - smooth((cur - (sh.to - DIP)) / DIP);
  }
}

// ── панели «трёх форматов»: живые клипы поверх постеров ──
const panels = [...document.querySelectorAll('.panel')].map((a) => {
  const src = (TALL && a.dataset.videoT) || a.dataset.video; // 32-я редакция: на вертикальном экране панель — узкая полоска, ей хватает лёгкой копии 854×480
  const pc = clipOf(src, SCENES[byId.formats].start);
  if (src !== a.dataset.video) { pc.low = true; pc.noLite = true; } // отдельное превью: у него нет лёгкой копии, на медленной сети оно ждёт своей очереди
  const img = new Image();
  img.alt = ''; img.className = 'poster';
  goQueue.push(() => { img.src = V(posterOf(a.dataset.video, 'p_')); });
  a.prepend(img);
  return { a, src, img, v: null };
});
function panelsLive(on) {
  for (const p of panels) {
    const c = clips[p.src];
    if (on && !p.v && c.state === 'ready') { p.v = makeVideo(p.src, c.url, true); p.img.after(p.v); }
    if (!p.v) continue;
    if (on) { if (p.v.paused) playV(p.v); } else { dropVideo(p.v); p.v = null; }
  }
}
const tripShot = shots.find((sh) => sh.el.classList.contains('trip'));

// ── телевизоры: в экранах крутятся короткие превью его роликов ──
const CLOUD = 'https://res.cloudinary.com/dl0w7cyaz/video/upload/'; // ролики Павла, те же, что на его прежнем сайте
const screensLive = [];
const tubes = $('.tubes');
document.querySelectorAll('.scr').forEach((b) => {
  const t = document.createElement('div');
  t.className = 'tube';
  t.style.cssText = b.style.cssText;
  if (b.dataset.mp4) {
    const v = makeVideo('', '', true);
    v.removeAttribute('src'); v.preload = 'none';
    v._poster = `${CLOUD}w_360,q_auto:low,so_${b.dataset.so || 0}/${b.dataset.mp4}.jpg`; // тот же кадр, что стоит на экране в клипе; ставится ближе к сцене (askLate)
    v._src = `${CLOUD}w_360,q_auto:low,so_${b.dataset.so || 0},du_8,ac_none/${b.dataset.mp4}.mp4`;
    v.style.objectPosition = `50% ${b.dataset.oy || '50%'}`;
    t.appendChild(v);
    screensLive.push(v);
  } else if (b.dataset.yt) {
    const img = new Image();
    img.alt = '';
    img.dataset.lz2 = `https://i.ytimg.com/vi/${b.dataset.yt}/hqdefault.jpg`;
    t.appendChild(img);
  }
  tubes.appendChild(t);
});
const tvShot = shots.find((sh) => sh.id === 'tv');
// география: маршрут рисуется по мере прокрутки, по нему летит самолёт, города загораются, когда он до них долетел
const geoShot = shots.find((sh) => sh.id === 'geo');
const geo = { path: null, plane: null, len: 0, cities: [], q: -1 };
let mapAsked = false; // карта мира и логотипы клиентов нужны только к своим сценам: первый экран их не ждёт (см. later() в stock)
const askMap = () => fetch(V('media/map.svg')).then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status)))).then((svg) => {
  const box = $('#geoMap');
  box.innerHTML = svg;
  geo.path = box.querySelector('#geoRoute'); geo.plane = box.querySelector('#geoPlane'); geo.len = geo.path.getTotalLength();
  const gr = box.querySelector('[data-n="Greece"]');
  if (gr) { // приглашение сыграть: пульсирующая метка, пока по карте ни разу не нажали
    const bb = gr.getBBox(), tap = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    tap.setAttribute('class', 'tapme'); tap.setAttribute('transform', `translate(${(bb.x + bb.width * 0.45).toFixed(1)} ${(bb.y + bb.height * 0.4).toFixed(1)})`);
    tap.innerHTML = '<circle r="10"/><circle class="r2" r="10"/>';
    geo.path.ownerSVGElement.insertBefore(tap, geo.plane);
  }
  const N = 500, pts = [];
  for (let k = 0; k <= N; k++) pts.push(geo.path.getPointAtLength(geo.len * k / N));
  geo.cities = [...box.querySelectorAll('.city')].map((g) => { // на какой доле маршрута стоит город
    const c = g.querySelector('circle'), x = +c.getAttribute('cx'), y = +c.getAttribute('cy');
    let best = 0, bd = Infinity;
    pts.forEach((pt, k) => { const d = (pt.x - x) ** 2 + (pt.y - y) ** 2; if (d < bd) { bd = d; best = k; } });
    return { g, t: best / N };
  });
}).catch(() => { /* карты нет — остаётся текст */ });
// ── игра на карте: нажал — самолёт летит туда, страна «открывается», идёт счёт стран и километров ──
const GEO_T = {
  ru: {
    home: ['Здесь он как дома.', 'Тут его уже знают в лицо.', 'Знакомый маршрут. Летит с закрытыми глазами.'],
    fresh: ['Здесь он ещё не выступал. Будете первыми?', 'Новая страна. Он уже пакует карты.', 'Туда его ещё не звали. Пока.', 'Отличный выбор. Чемодан уже у двери.'],
    sea: ['Посадка на воду. Он справится.', 'В море он тоже работает: яхты.', 'Чайки в восторге.'],
    again: ['Здесь вы уже были. Ему тоже понравилось.', 'Опять сюда? У вас есть вкус.'],
    city: 'Здесь он уже выступал. И не раз.',
    score: (c, km) => `Открыто стран: ${c} · налетали ${km} км`,
    goals: { 3: 'Три страны. Разогрелись.', 5: 'Пять стран — это его обычный месяц.', 8: 'Восемь. Вы летаете чаще, чем его чемодан.', 12: 'Двенадцать стран. Вам положена карта постоянного пассажира.', 20: 'Двадцать. Может, уже позовёте его к себе?', 30: 'Тридцать стран. Вы точно организатор, а не пилот?' },
  },
  en: {
    home: ['He is at home here.', 'They already know his face here.', 'A familiar route. He could fly it blindfolded.'],
    fresh: ['He has not performed here yet. Want to be the first?', 'A new country. He is already packing the cards.', 'Nobody has invited him there. Yet.', 'Good choice. The suitcase is by the door.'],
    sea: ['Water landing. He will manage.', 'He works at sea too: yachts.', 'The seagulls loved it.'],
    again: ['You have been here already. He liked it too.', 'Here again? You have taste.'],
    city: 'He has performed here. More than once.',
    score: (c, km) => `Countries opened: ${c} · ${km} km flown`,
    goals: { 3: 'Three countries. Warmed up.', 5: 'Five countries: that is his usual month.', 8: 'Eight. You fly more than his suitcase does.', 12: 'Twelve countries. You have earned a frequent-flyer card.', 20: 'Twenty. Maybe invite him to yours already?', 30: 'Thirty countries. Are you sure you are a planner, not a pilot?' },
  },
};
const SVGNS = 'http://www.w3.org/2000/svg';
const game = { seen: new Map(), km: 0, said: '', goal: 0 };   // открытые страны (название → контур), километры, последняя реплика
const geoSay = $('#geoSay'), geoScore = $('#geoScore'), geoHead = document.querySelector('.chapter.geo-head');
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
// точка карты → долгота и широта (обратная проекция из tools/geomap.py), чтобы считать настоящие километры
const GK = 1600 / 83.2, mercD = (lat) => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * 180 / Math.PI, MTOP = mercD(54.87);
const lonLat = (p) => [p.x / GK - 18.6, (2 * Math.atan(Math.exp((MTOP - p.y / GK) * Math.PI / 180)) - Math.PI / 2) * 180 / Math.PI];
function kmBetween(a, b) {
  const [lo1, la1] = lonLat(a), [lo2, la2] = lonLat(b), r = Math.PI / 180;
  const h = Math.sin((la2 - la1) * r / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin((lo2 - lo1) * r / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
function geoHud() { // счёт и реплика — в тексте главы; перерисовывается и при смене языка
  const T = GEO_T[lang];
  geoHead.classList.toggle('playing', game.km > 0);
  if (!game.km) return;
  geoScore.textContent = T.score(game.seen.size, Math.round(game.km).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US'));
  geoSay.textContent = game.goal ? T.goals[game.goal] : game.said ? (Array.isArray(T[game.said[0]]) ? T[game.said[0]][game.said[1] % T[game.said[0]].length] : T[game.said[0]]) : '';
}
function geoReset() { // ушли со сцены — карта снова ведёт самолёт по маршруту; открытые страны и счёт остаются
  if (!geo.free) return;
  geo.free = false; geo.q = -1;
  if (geo.anim) cancelAnimationFrame(geo.anim);
  geo.path.ownerSVGElement.querySelectorAll('.hop, .pin, .aim').forEach((n) => n.remove());
}
const toSvg = (svg, e) => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); };
const geoLive = () => geo.path && geoShot && geoShot.shown >= 0.6;
$('#geoMap').addEventListener('mousemove', (e) => { // на компьютере пунктир от самолёта к курсору показывает, куда он полетит
  if (!geoLive() || geo.flying) return;
  if (e.target.closest && e.target.closest('.land path[data-off]')) { const a = geo.path.ownerSVGElement.querySelector('.aim'); if (a) a.remove(); return; }
  const svg = geo.path.ownerSVGElement, to = toSvg(svg, e), from = geo.pos || geo.path.getPointAtLength(clamp(geo.q) * geo.len);
  let aim = svg.querySelector('.aim');
  if (!aim) { aim = document.createElementNS(SVGNS, 'line'); aim.setAttribute('class', 'aim'); svg.insertBefore(aim, geo.plane); }
  aim.setAttribute('x1', from.x.toFixed(1)); aim.setAttribute('y1', from.y.toFixed(1)); aim.setAttribute('x2', to.x.toFixed(1)); aim.setAttribute('y2', to.y.toFixed(1));
});
$('#geoMap').addEventListener('mouseleave', () => { const a = geo.path && geo.path.ownerSVGElement.querySelector('.aim'); if (a) a.remove(); });
$('#geoMap').addEventListener('click', (e) => {
  if (!geoLive()) return;
  const svg = geo.path.ownerSVGElement, to = toSvg(svg, e);
  const from = geo.pos || geo.path.getPointAtLength(clamp(geo.q) * geo.len);
  const dx = to.x - from.x, dy = to.y - from.y, dist = Math.hypot(dx, dy);
  if (dist < 12) return;
  const land = e.target.closest ? e.target.closest('.land path') : null;
  if (land && land.dataset.off) return; // эти страны в игре не участвуют: самолёт туда не летит
  const city = geo.cities.map((c) => c.g).find((g) => { const c = g.querySelector('circle'); return Math.hypot(+c.getAttribute('cx') - to.x, +c.getAttribute('cy') - to.y) < 26; });
  const cx = (from.x + to.x) / 2 + dy * 0.22, cy = (from.y + to.y) / 2 - Math.abs(dx) * 0.22 - 20; // дуга выгнута вверх
  svg.querySelectorAll('.pin, .aim, .tapme').forEach((n) => n.remove());
  const hops = [...svg.querySelectorAll('.hop')];
  hops.forEach((h, k) => { if (k < hops.length - 5) h.remove(); else h.classList.add('old'); }); // следы прошлых перелётов бледнеют, старые исчезают
  const trail = document.createElementNS(SVGNS, 'path');
  trail.setAttribute('class', 'hop');
  trail.setAttribute('d', `M${from.x.toFixed(1)},${from.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${to.x.toFixed(1)},${to.y.toFixed(1)}`);
  trail.setAttribute('pathLength', '1');
  svg.insertBefore(trail, geo.plane);
  geo.free = true; geo.flying = true;
  if (geo.anim) cancelAnimationFrame(geo.anim);
  const t0 = performance.now(), T = clamp(dist * 2.0, 450, 1200);
  const step = (now) => {
    const k = inOut(clamp((now - t0) / T)), m = 1 - k;
    const x = m * m * from.x + 2 * m * k * cx + k * k * to.x, y = m * m * from.y + 2 * m * k * cy + k * k * to.y;
    const tx = 2 * m * (cx - from.x) + 2 * k * (to.x - cx), ty = 2 * m * (cy - from.y) + 2 * k * (to.y - cy);
    geo.pos = { x, y };
    geo.plane.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(Math.atan2(ty, tx) * 180 / Math.PI + 90).toFixed(1)}) scale(1.5)`);
    trail.style.strokeDashoffset = (1 - k).toFixed(3);
    if (k < 1) { geo.anim = requestAnimationFrame(step); return; }
    geo.flying = false;
    // приземлился: считаем километры, открываем страну, ставим булавку с её названием
    game.km += kmBetween(from, to);
    const before = game.seen.size;
    let name = '';
    if (city) { game.said = ['city', 0]; city.classList.add('on'); }
    if (land) {
      name = land.dataset.n;
      if (game.seen.has(name)) { if (!city) game.said = ['again', game.seen.size]; }
      else { game.seen.set(name, land); land.classList.add('seen'); if (!city) game.said = [land.dataset.home ? 'home' : 'fresh', Math.floor(Math.random() * 9)]; }
    } else if (!city) game.said = ['sea', Math.floor(Math.random() * 9)];
    game.goal = game.seen.size !== before && GEO_T.ru.goals[game.seen.size] ? game.seen.size : 0;
    const pin = document.createElementNS(SVGNS, 'g');
    pin.setAttribute('class', 'pin');
    const side = to.x > 1250 ? 'end' : to.x < 350 ? 'start' : 'middle';
    pin.innerHTML = `<circle cx="${to.x.toFixed(1)}" cy="${to.y.toFixed(1)}" r="8"/>` + (land ? `<text x="${to.x.toFixed(1)}" y="${(to.y + (to.y > 760 ? -24 : 44)).toFixed(1)}" text-anchor="${side}"><tspan lang="en">${land.dataset.n}</tspan><tspan lang="ru">${land.dataset.ru}</tspan></text>` : '');
    svg.appendChild(pin);
    geoHud();
  };
  geo.anim = requestAnimationFrame(step);
});
function layGeo() {
  if (!geo.path || !geoShot) return;
  if (geoShot.shown < 0.01) { geoReset(); return; }
  const gs = SCENES[byId.geo]; // карта остаётся на экране и в следующей сцене (кролик), но маршрут рисуется только в своей
  const q = clamp(((cur - gs.start) / gs.len - 0.1) / 0.72);
  if (Math.abs(q - geo.q) < 0.0004) return;
  geo.q = q;
  geo.path.style.strokeDashoffset = (1 - q).toFixed(4);
  geo.cities.forEach((c) => c.g.classList.toggle('on', q >= c.t - 0.004));
  if (geo.free) return; // самолётом сейчас управляет зритель
  const a = geo.path.getPointAtLength(q * geo.len), b = geo.path.getPointAtLength(Math.min(geo.len, q * geo.len + 3));
  const ang = q >= 0.999 ? geo.ang || 0 : Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90;
  geo.ang = ang;
  geo.pos = a;
  geo.plane.setAttribute('transform', `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${ang.toFixed(1)}) scale(1.5)`);
}
let tvLive = false, tripLive = false;
function tubesLive(on) { // превью в телевизорах: ролики подключаются, только пока телевизоры на экране
  for (const v of screensLive) {
    if (on) {
      if (!v.getAttribute('src') && !liteNet()) v.src = v._src; // на медленной сети в телевизорах стоят кадры: полоса нужнее роликам сцен
      if (v.getAttribute('src') && v.paused) playV(v);
    }
    else { v._play = false; v.pause(); if (LAZY && v.getAttribute('src')) { v.removeAttribute('src'); v.load(); } }
  }
}
pump();

// ── переходы по сайту ───────────────────────────
function goTo(id, at = 0) { // плавно, через фильм
  const s = SCENES[byId[id]];
  window.scrollTo({ top: (s.start + at * s.len) * SH, behavior: 'smooth' });
}
const flash = $('#flash');
function jumpTo(id, at = 0.5) { // сразу, без перемотки: для «Проверить дату»
  const s = SCENES[byId[id]];
  const y = (s.start + at * s.len) * SH;
  flash.animate([{ opacity: 0 }, { opacity: 1, offset: 0.45 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], { duration: 700, easing: 'ease-in-out' });
  setTimeout(() => {
    window.scrollTo({ top: y, behavior: 'instant' });
    cur = y / SH;
    const field = $('#bookForm input');
    if (id === 'booking' && field) field.focus({ preventScroll: true });
  }, 330);
}
// Меню: фильм быстро перематывается до нужного раздела, чтобы было видно, сколько всего по дороге.
let flying = 0;
function stopFly() { if (flying) { cancelAnimationFrame(flying); flying = 0; setTimeout(() => { if (!flying) delete html.dataset.ff; }, 160); } }
function flyTo(id, at = 0.05) {
  const sc = SCENES[byId[id]];
  const y0 = window.scrollY, y1 = (sc.start + at * sc.len) * SH, dist = Math.abs(y1 - y0) / SH;
  if (dist < 0.05) return;
  if (flying) cancelAnimationFrame(flying);
  const T = clamp(0.5 + dist * 0.12, 0.8, 2.6) * 1000, t0 = performance.now();
  html.dataset.ff = y1 > y0 ? 'fwd' : 'rew';
  const step = (now) => {
    const q = clamp((now - t0) / T);
    window.scrollTo(0, y0 + (y1 - y0) * inOut(q));
    if (q < 1) flying = requestAnimationFrame(step); else stopFly();
  };
  flying = requestAnimationFrame(step);
}
['wheel', 'touchstart', 'keydown'].forEach((ev) => window.addEventListener(ev, stopFly, { passive: true })); // человек взялся за скролл сам — перемотку бросаем
const menuBtn = $('#menuBtn'), menuSheet = $('#menuSheet');
document.querySelectorAll('#menu button').forEach((b) => menuSheet.appendChild(b.cloneNode(true)));  // на телефоне те же пункты — в выезжающем списке
const menuBtns = [...document.querySelectorAll('[data-fly]')];
const closeSheet = () => { menuSheet.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); };
menuBtns.forEach((b) => b.addEventListener('click', () => { closeSheet(); flyTo(b.dataset.fly, parseFloat(b.dataset.at || 0.05)); }));
menuBtn.addEventListener('click', () => { menuSheet.hidden = !menuSheet.hidden; menuBtn.setAttribute('aria-expanded', String(!menuSheet.hidden)); });
const MENU_OF = { formats: 'formats', card: 'formats', king: 'formats', stage: 'formats', incog: 'formats', tv: 'tv', feat: 'feat', titles: 'titles', geo: 'geo', reviews: 'reviews', wine: 'booking', booking: 'booking' };

document.querySelectorAll('[data-goto]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  goTo(a.dataset.goto, parseFloat(a.dataset.at || 0));
}));
document.querySelectorAll('[data-jump]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  jumpTo(a.dataset.jump);
}));

// ── главы ───────────────────────────────────────
const chapters = [...document.querySelectorAll('.chapter')].map((el) => {
  const s = SCENES[byId[el.dataset.scene]];
  const m = vw < 761; // на телефоне у части глав другое время: текст стоит под кадром-полосой всю сцену
  const a = parseFloat((m && el.dataset.inM) || el.dataset.in), b = parseFloat((m && el.dataset.outM) || el.dataset.out);
  return { el, from: a < 0 ? -Infinity : s.start + a * s.len, to: b > 1 ? Infinity : s.start + b * s.len, shown: -1 };
});
const coverEl = $('.chapter.cover');
let lqShown = -1;

// ── рейка глав ──────────────────────────────────
const rail = $('#rail');
const railMarks = SCENES.map((s) => {
  if (s.rail === false) return null;
  const b = document.createElement('button');
  b.type = 'button';
  b.setAttribute('aria-label', s.name.en || 'Pavel Bach');
  b.appendChild(document.createElement('i'));
  b.addEventListener('click', () => goTo(s.id));
  rail.appendChild(b);
  return b;
});

// ── язык ────────────────────────────────────────
const chapterName = $('#chapterName');
// 30-я редакция: язык задан самой страницей (/ — английский, /ru/ — русский), без угадывания по языку телефона.
// Переключатель — обычная ссылка на ту же страницу другого языка (метки из адреса и место в фильме сохраняет js/site.js).
const lang = html.dataset.lang === 'ru' ? 'ru' : 'en';
let sceneNow = -1;

// ── отзывы: карты летят спиралью от двух организаторов к зрителю; ближняя карта — отзыв ──
const deck = $('#deck'), deckNav = $('#deckNav'), deckCount = $('#deckCount'), deckPrev = $('#deckPrev'), deckNext = $('#deckNext');
const N_REV = document.querySelectorAll('.rcard').length;
for (let k = 0; k < 10; k++) { // «хвост» спирали: карты рубашкой к зрителю
  const el = document.createElement('div');
  el.className = 'rcard filler';
  deck.appendChild(el);
}
const cards = [...deck.querySelectorAll('.rcard')];
const PERSP = 1400;
let deckShown = -1, cardNow = -1, deckPos = 0;
const revLocal = (k) => 0.06 + 0.86 * (k + 0.3) / N_REV; // место сцены, где карта k стоит перед зрителем
function flip(dir) {
  const k = clamp(Math.round(deckPos) + dir, 0, N_REV - 1), rs = SCENES[byId.reviews];
  window.scrollTo({ top: (rs.start + revLocal(k) * rs.len) * SH, behavior: 'smooth' });
}
deckPrev.addEventListener('click', () => flip(-1));
deckNext.addEventListener('click', () => flip(1));
// нажатие на карту с отзывом — следующий отзыв; после последнего — снова первый
deck.addEventListener('click', (e) => {
  if (deckShown < 0.6 || !e.target.closest('.rcard.front:not(.filler)')) return;
  if (Math.round(deckPos) < N_REV - 1) return flip(1);
  const rs = SCENES[byId.reviews];
  window.scrollTo({ top: (rs.start + revLocal(0) * rs.len) * SH, behavior: 'smooth' });
});
function layDeck(local, vis) {
  if (Math.abs(vis - deckShown) > 0.001) {
    deckShown = vis;
    deckNav.style.opacity = vis;
    deckNav.style.visibility = vis < 0.01 ? 'hidden' : 'visible'; // сама колода лежит внутри кадра и появляется вместе с ним
    deckNav.classList.toggle('live', vis > 0.6);
  }
  if (vis < 0.01) return;
  const q = clamp((local - 0.06) / 0.86) * N_REV;      // на каждую карту — равная доля сцены
  const k0 = Math.min(N_REV - 1, Math.floor(q));
  const pos = k0 + (k0 === N_REV - 1 ? 0 : smooth((q - k0 - 0.62) / 0.38)); // карта стоит, пока её читают, потом улетает
  deckPos = pos;
  const tall = vw / vh < 0.8;
  const W = vw, H = vh - barH - footH;  // колода занимает экран между верхней полосой и рейкой
  // F — где стоит карта с отзывом, G — откуда карты вылетают (руки девушек); координаты от центра сцены
  const F = tall ? [0, H * 0.127] : [W * 0.2, -H * 0.02];
  const G = tall ? [-W * 0.02, -H * 0.2] : [-W * 0.2, -H * 0.1]; // папка в руках организаторов: оттуда вылетают карты
  const DIP = (tall ? 0 : 0.2) * H, R0 = (tall ? 0.17 : 0.07) * Math.min(W, H);
  const t = performance.now() / 1000;
  cards.forEach((el, j) => {
    const u = j - pos;                                   // 0 — перед зрителем, >0 — ещё летит от девушек, <0 — пролетела мимо
    let x, y, sc, ry, rx, rz, op;
    if (u <= 0) {
      const n = -u;
      x = F[0] + n * W * 0.42; y = F[1] + n * H * 0.12; sc = 1 + n * 0.7;
      ry = -5 - n * 55; rx = 0; rz = n * 12; op = 1 - (n - 0.4) / 0.45; // пока карта не отлетела, она непрозрачна: иначе сквозь неё видна следующая
    } else {
      // у папки карта размером с настоящую (в двадцать раз меньше той, что перед зрителем), по дороге растёт и поворачивается лицом
      const s = 1 - Math.exp(-u / 3.6), ph = 0.6 + s * Math.PI * 3.4, near = Math.min(1, u);
      const r = R0 * Math.sin(Math.PI * s);
      x = F[0] + (G[0] - F[0]) * s + r * Math.sin(ph);
      y = F[1] + (G[1] - F[1]) * s + DIP * Math.sin(Math.PI * Math.pow(s, 0.8)) - r * Math.cos(ph); // дуга уходит вниз: лица девушек остаются открыты
      sc = 0.05 + 0.95 * Math.pow(1 - s, 1.7);
      ry = -5 + near * (30 * s + 62 * Math.sin(ph)); rx = near * 22 * Math.cos(ph); rz = near * -16 * Math.sin(ph + 1);
      op = clamp((0.97 - s) / 0.06);
    }
    el.classList.toggle('front', Math.abs(u) < 0.5);
    if (op <= 0.001) { if (el._on !== false) { el._on = false; el.style.visibility = 'hidden'; } return; } // невидимые карты браузер не трогает вовсе
    if (el._on === false) { el._on = true; el.style.visibility = ''; }
    const wob = Math.sin(t * 1.1 + j * 2) * 1.5;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${(y + wob * 2 * sc).toFixed(1)}px, 0) scale(${sc.toFixed(4)}) rotateY(${(ry + wob).toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) rotateZ(${(rz + wob * 0.3).toFixed(2)}deg)`;
    el.style.opacity = clamp(op).toFixed(3);
    const zi = 200 - Math.round(Math.abs(u) * 10);
    if (zi !== el._zi) { el._zi = zi; el.style.zIndex = zi; }
    // объём: карта, повёрнутая от света, темнее; дальние и пролетающие мимо — не в фокусе
    const shade = clamp(Math.abs(ry) / 110 + Math.abs(rx) / 160), blur = u <= 0 ? -u * 7 : clamp((u - 1.2) * 0.5, 0, 2.5) / Math.max(sc, 0.2); // размытие задано до масштаба
    const look = `${shade.toFixed(2)}|${blur.toFixed(1)}`;
    // тень поворота — фильтр яркости (раньше — переменная --sh: из-за неё карта перерисовывалась на каждом кадре); фильтр считает видеокарта
    if (look !== el._look) { el._look = look; el.style.filter = (shade > 0.02 ? `brightness(${(1 - shade * 0.6).toFixed(3)}) ` : '') + (blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : ''); }
  });
  deckNav.style.setProperty('--fx', `${F[0].toFixed(1)}px`);
  const now = Math.round(pos);
  if (now !== cardNow) {
    cardNow = now;
    deckCount.textContent = `${now + 1} / ${N_REV}`;
    deckPrev.disabled = now === 0; deckNext.disabled = now === N_REV - 1;
  }
}
// листать можно свайпом вбок и стрелками
let touch0 = null;
window.addEventListener('touchstart', (e) => { touch0 = deckShown > 0.6 ? [e.touches[0].clientX, e.touches[0].clientY] : null; }, { passive: true });
window.addEventListener('touchend', (e) => {
  if (!touch0) return;
  const dx = e.changedTouches[0].clientX - touch0[0], dy = e.changedTouches[0].clientY - touch0[1];
  if (Math.abs(dx) > 50 && Math.abs(dx) > 2 * Math.abs(dy)) flip(dx < 0 ? 1 : -1);
  touch0 = null;
}, { passive: true });
window.addEventListener('keydown', (e) => {
  if (deckShown < 0.6) return;
  if (e.key === 'ArrowRight') flip(1);
  if (e.key === 'ArrowLeft') flip(-1);
});

// ── блик на зубе: звезда как от звёздного фильтра, анаморфная полоса, свечение, блики линзы ──
function spike(ctx, len, w, rgb, alpha) { // тонкий луч: яркая середина, прозрачные концы
  const g = ctx.createLinearGradient(-len, 0, len, 0);
  g.addColorStop(0, `rgba(${rgb},0)`);
  g.addColorStop(0.4, `rgba(${rgb},${(alpha * 0.25).toFixed(3)})`);
  g.addColorStop(0.5, `rgba(${rgb},${alpha.toFixed(3)})`);
  g.addColorStop(0.6, `rgba(${rgb},${(alpha * 0.25).toFixed(3)})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(0, -w); ctx.lineTo(len, 0); ctx.lineTo(0, w); ctx.closePath(); ctx.fill();
}
let glintDrawn = false;
function drawGlint(f, x, y, ang, ghosts = true) {
  const ctx = fctx;
  ctx.setTransform(fxDpr, 0, 0, fxDpr, 0, 0);
  if (glintDrawn) ctx.clearRect(0, 0, vw, vh);
  glintDrawn = f > 0.001;
  if (!glintDrawn) return;
  ctx.globalCompositeOperation = 'lighter';
  const m = Math.min(vw, vh);
  const a = Math.min(1, f * 3);
  // свечение: долго остаётся маленькой искрой на зубе, раскрывается только в самом конце
  const R = m * (0.014 + 1.15 * Math.pow(f, 3));
  const g = ctx.createRadialGradient(x, y, 0, x, y, R);
  g.addColorStop(0, `rgba(255,255,255,${(0.95 * a).toFixed(3)})`);
  g.addColorStop(0.1, `rgba(255,248,240,${(0.45 * a + 0.25 * f).toFixed(3)})`);
  g.addColorStop(0.38, `rgba(255,170,190,${(0.16 * f).toFixed(3)})`);
  g.addColorStop(1, 'rgba(255,110,150,0)');
  ctx.fillStyle = g; ctx.fillRect(x - R, y - R, 2 * R, 2 * R);
  ctx.save(); ctx.translate(x, y);
  // анаморфная полоса через весь кадр
  const late = smooth((f - 0.55) / 0.45);
  spike(ctx, vw * 0.9 * late, 0.5 + 2 * late, '170,210,255', 0.35 * late);
  // звезда: четыре длинных луча и четыре коротких, с цветной каймой
  const L = m * (0.016 + 0.32 * Math.pow(f, 2.2)), W = 0.7 + 2.4 * f;
  for (const [da, ls, ws] of [[0, 1, 1], [Math.PI / 2, 1, 1], [Math.PI / 4, 0.4, 0.55], [-Math.PI / 4, 0.4, 0.55]]) {
    ctx.save(); ctx.rotate(ang + da);
    spike(ctx, L * ls, W * ws, '255,255,255', 0.95 * a);
    ctx.restore();
  }
  ctx.restore();
  // блики линзы на линии через центр кадра (только пока блик разгорается)
  const dx = vw / 2 - x, dy = vh / 2 - y;
  if (ghosts) for (const [t, r, rgb, al] of [[0.6, 0.045, '120,255,210', 0.14], [1.3, 0.1, '180,130,255', 0.1], [1.75, 0.03, '255,210,140', 0.18], [2.2, 0.15, '120,170,255', 0.07]]) {
    const gx = x + dx * t, gy = y + dy * t, rr = m * r * (0.5 + f);
    const gg = ctx.createRadialGradient(gx, gy, rr * 0.55, gx, gy, rr);
    gg.addColorStop(0, `rgba(${rgb},${(al * f * 0.35).toFixed(3)})`);
    gg.addColorStop(0.85, `rgba(${rgb},${(al * f).toFixed(3)})`);
    gg.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(gx, gy, rr, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

function fmt(ms) {
  const p = (n, w = 2) => String(Math.floor(n)).padStart(w, '0');
  return `${p(ms / 3600000)}:${p((ms / 60000) % 60)}:${p((ms / 1000) % 60)}.${p(ms % 1000, 3)}`;
}

// ── глубокий влёт в глаз короля ──
// Когда карта легла ровно и закрыла экран, её дальше рисует холст: рисунок карты, потом макро-снимок глаза, потом макро-снимок радужки.
// Каждый следующий снимок проявляется там, где у предыдущего кончается резкость, — камера летит в глаз сама, без нарисованного зрачка.
const deepEl = $('#deep'), deepCtx = deepEl.getContext('2d');
let deepOn = false, deepDpr = 1;
function deepSize() {
  deepDpr = Math.min(2, window.devicePixelRatio || 1);
  deepEl.width = Math.round(vw * deepDpr); deepEl.height = Math.round(vh * deepDpr);
}
function feather(img) { // макро-снимок с мягким круглым краем: при наложении на предыдущий не видно квадрата
  const n = img.naturalWidth, c = document.createElement('canvas');
  c.width = c.height = n;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  x.globalCompositeOperation = 'destination-in';
  const g = x.createRadialGradient(n / 2, n / 2, n * 0.3, n / 2, n / 2, n * 0.5);
  g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, n, n);
  return c;
}
function rrect(ctx, x, y, w, h, r) { // прямоугольник со скруглёнными углами
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
// масштаб карты во влёте (логарифм): сначала карта выравнивается и встаёт во весь экран, потом одним движением — в радужку
function diveZ(D, d) { // одно движение с плавным разгоном, без остановки на полпути
  return Math.log(D.zEnd) * Math.pow(clamp(d / D_END), 1.5);
}
function deepFrame(sh, D, d) {
  const k0img = D.layers[0].img;
  const alpha = cur < D.to && k0img.complete && k0img.naturalWidth > 0 ? smooth((d - 0.31) / 0.06) : 0;
  if (alpha <= 0.001) {
    if (deepOn) { deepEl.style.display = 'none'; deepOn = false; sh.el.style.visibility = ''; }
    return;
  }
  if (!deepOn) { deepEl.style.display = 'block'; deepOn = true; }
  if (deepEl.width !== Math.round(vw * deepDpr) || deepEl.height !== Math.round(vh * deepDpr)) deepSize();
  deepEl.style.opacity = alpha.toFixed(3);
  const ctx = deepCtx, W = D.cwp * KS * Math.exp(diveZ(D, d)), H = W / KAR, cx = vw / 2, cy = vh / 2;
  ctx.setTransform(deepDpr, 0, 0, deepDpr, 0, 0);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, vw, vh);
  // где лежит слой на экране, насколько он резок (экранных точек на пиксель снимка) и закрывает ли он экран своей серединой
  const geo = D.layers.map((L) => {
    const [u0, v0, u1, v1] = L.r;
    const X0 = cx + (u0 - EYE[0]) * W, X1 = cx + (u1 - EYE[0]) * W, Y0 = cy + (v0 - EYE[1]) * H, Y1 = cy + (v1 - EYE[1]) * H;
    const ok = L.img.complete && L.img.naturalWidth > 0;
    const inner = L === D.layers[0] ? 0 : 0.2; // у макро-снимков резкая только середина (край растушёван)
    const ix = (X1 - X0) * inner, iy = (Y1 - Y0) * inner;
    return { L, X0, X1, Y0, Y1, ok, dens: ok ? ((X1 - X0) * deepDpr) / L.img.naturalWidth : 0, covers: X0 + ix <= 0 && Y0 + iy <= 0 && X1 - ix >= vw && Y1 - iy >= vh };
  });
  const al = geo.map((g, k) => (k === 0 ? 1 : g.ok && geo[k - 1].ok ? smooth((geo[k - 1].dens - 0.9) / 1.3) : 0)); // снимок глаза проявляется, пока глаз на экране ещё мал: подмены не видно
  // рисуем только саму карту со скруглёнными углами: вокруг неё остаётся кадр из ролика, чёрных уголков нет
  const c0 = geo[0], cw0 = c0.X1 - c0.X0, ins = cw0 * 0.004;
  ctx.save();
  ctx.beginPath(); rrect(ctx, c0.X0 + ins, c0.Y0 + ins, cw0 - 2 * ins, c0.Y1 - c0.Y0 - 2 * ins, cw0 * 0.047); ctx.clip();
  ctx.fillStyle = '#050304'; ctx.fillRect(0, 0, vw, vh);
  let k0 = 0;
  for (let k = geo.length - 1; k > 0; k--) if (al[k] >= 0.999 && geo[k].covers) { k0 = k; break; }
  for (let k = k0; k < geo.length; k++) {
    const g = geo[k];
    if (!g.ok || al[k] <= 0.001) continue;
    if (k > 0 && !g.L.src) g.L.src = feather(g.L.img);
    const src = k > 0 ? g.L.src : g.L.img, sw = g.L.img.naturalWidth, shh = g.L.img.naturalHeight;
    const x0 = Math.max(0, g.X0), y0 = Math.max(0, g.Y0), x1 = Math.min(vw, g.X1), y1 = Math.min(vh, g.Y1);
    if (x1 <= x0 || y1 <= y0) continue;
    const kx = sw / (g.X1 - g.X0), ky = shh / (g.Y1 - g.Y0);
    ctx.globalAlpha = al[k];
    ctx.drawImage(src, (x0 - g.X0) * kx, (y0 - g.Y0) * ky, (x1 - x0) * kx, (y1 - y0) * ky, x0, y0, x1 - x0, y1 - y0);
  }
  // тот же цвет белого поля, что у карты поверх ролика (.kcard::after)
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'multiply';
  const px0 = Math.max(0, c0.X0), py0 = Math.max(0, c0.Y0), pw = Math.min(vw, c0.X1) - px0, ph = Math.min(vh, c0.Y1) - py0;
  ctx.fillStyle = '#dad8d8'; ctx.fillRect(px0, py0, pw, ph);
  const pg = ctx.createLinearGradient(c0.X0, c0.Y0, c0.X0 + (c0.Y1 - c0.Y0) * 0.47, c0.Y1); // тот же градиент, что у .kcard::before
  pg.addColorStop(0, PAPER[0]); pg.addColorStop(0.55, PAPER[1]); pg.addColorStop(1, PAPER[2]);
  ctx.fillStyle = pg; ctx.fillRect(px0, py0, pw, ph);
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
  // глаз уходит в полную черноту; следующая сцена появится уже из неё
  const blk = smooth((d - BLK[0]) / (BLK[1] - BLK[0]));
  if (blk > 0.001) { ctx.globalAlpha = blk; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, vw, vh); ctx.globalAlpha = 1; }
  // карта закрыла экран и холст непрозрачен — сам кадр с роликом можно не рисовать
  const hide = alpha >= 0.999 && c0.covers;
  sh.el.style.visibility = hide ? 'hidden' : '';
}

// ── кадр ────────────────────────────────────────
const film = $('#film'), whiteout = $('#whiteout'), strobeEl = $('#strobe'), burnEl = $('#burn'), whipDev = $('#whipDev');
let last = performance.now();
function frame(now, snap) {
  const dt = clamp((now - last) / 1000, 0, 0.25); // при редких кадрах камера всё равно догоняет скролл за то же время
  last = now;

  const target = clamp(window.scrollY / SH, 0, TOTAL);
  if (!Number.isFinite(cur)) cur = target;
  cur += (target - cur) * (1 - Math.exp(-dt * (flying ? 20 : 7))); // инерция, как у тяжёлой камеры; при перемотке из меню — плотнее
  if (snap || Math.abs(target - cur) < 0.0004) cur = target;

  let i = SCENES.length - 1;
  while (i > 0 && cur < SCENES[i].start) i--;
  const s = SCENES[i];
  const local = clamp((cur - s.start) / s.len);

  if (!flying) stock();
  let flashA = 0, flashXY = null, flashBefore = true, whipM = 0, strobe = 0, burn = 0;
  shots.forEach((sh, k) => {
    const vis = visIn(sh, k) * visOut(sh);
    const p = clamp((cur - sh.from) / (sh.to - sh.from));
    if (vis > 0) {
      // по --p CSS проявляет то, что лежит внутри кадра. У сцены отзывов внутри 26 карт, которым --p не нужен, а браузер пересчитывал бы стили каждой на каждом кадре
      if (!sh.noP) sh.el.style.setProperty('--p', p.toFixed(4)); // по нему CSS проявляет то, что лежит внутри кадра
      if (sh.dimAt !== null) sh.el.style.setProperty('--dim', smooth((cur - sh.dimAt) / 0.45).toFixed(3));
      if (sh.video && !sh.live && sh.video.readyState >= 1 && !sh.video.seeking && sh.video.duration) {
        const t = rampAt(sh.ramp, p) * (sh.video.duration - 0.05);
        if (Math.abs(sh.video.currentTime - t) > 0.02) sh.video.currentTime = t;
      }
      if (sh.src) flipbook(sh, p);
      if (sh.video && !sh.live && sh.video.readyState < 2 && now - (sh.video._kick || 0) > 1500) { sh.video._kick = now; if (!blocked) prime(sh.video); }
      if (sh.mx2 !== null) { // вертикальный экран: кадр едет от героя к тому, на что он показывает
        let m = sh.mx + (sh.mx2 - sh.mx) * smooth((p - sh.pan[0]) / (sh.pan[1] - sh.pan[0]));
        if (sh === geoShot && geo.pos) { // 34-я редакция: на карте камера идёт за самолётом — он и нарисованный маршрут всегда в кадре
          const fx = geo.pos.x / 1600; // ширина карты в её координатах (viewBox в media/map.svg)
          if (!geo.free) sh.follow = sh.follow === undefined ? fx : sh.follow + (fx - sh.follow) * 0.12; // зритель ведёт самолёт сам — камера стоит
          if (sh.follow !== undefined) m = sh.follow;
          if (TALL && !geo.free) { // внизу карты (Кипр, Дубай) самолёт уходил под подложку текста: карта приподнимается, и он остаётся над текстом
            const lift = clamp(geo.pos.y / 900 - 0.44, 0, 0.14);
            sh.lift = sh.lift === undefined ? lift : sh.lift + (lift - sh.lift) * 0.12;
            const px = Math.round(sh.lift * sh.h);
            if (px !== sh.liftPx) { sh.liftPx = px; $('#geoMap').style.transform = px ? `translate3d(0, ${-px}px, 0)` : ''; }
          }
        }
        if (Math.abs(m - sh.mxNow) > 0.0005) { sh.mxNow = m; shiftTo(sh, m); if (sh.fit) sh.fit.e = -1; }
      }
      if (sh.fit) { // камера доехала — кадр подъезжает к телевизорам
        const F = sh.fit, e = smooth((p - F.pa) / (F.pb - F.pa));
        if (Math.abs(e - F.e) > 0.0005) {
          F.e = e;
          const st = sh.el.style;
          st.setProperty('--z', (1 + (F.k - 1) * e).toFixed(4));
          st.setProperty('--ax', `${((F.tx - F.px - sh.shift) * e).toFixed(1)}px`);
          st.setProperty('--ay', `${((F.ty - F.py) * e).toFixed(1)}px`);
        }
      }
      if (sh.dive) {
        // один непрерывный влёт: камера выравнивается по карте, карта становится чёткой, дальше — в лицо короля
        const D = sh.dive, d = clamp((cur - D.from) / (D.to - D.from));
        if (Math.abs(d - D.d) > 0.0002) {
          D.d = d;
          sh.el.classList.toggle('diving', d > 0); // размытие кадра нужно только во время влёта в карту
          const m = smooth(d / 0.3);
          const st = sh.el.style, z = Math.min(Math.exp(diveZ(D, d)), 60); // сам кадр дальше не растёт: карту уже рисует холст поверх
          st.setProperty('--z', z.toFixed(4));
          st.setProperty('--rot', `${(-D.rot * m).toFixed(3)}deg`);
          st.setProperty('--ax', `${((vw / 2 - D.px - sh.shift) * m).toFixed(1)}px`);
          st.setProperty('--ay', `${((vh / 2 - D.py) * m).toFixed(1)}px`);
          st.setProperty('--d', d.toFixed(4));
          st.setProperty('--kick', Math.sin(Math.PI * clamp(d / 0.16)).toFixed(3)); // камера срывается с места: короткий смаз
          st.setProperty('--ko', smooth((d - 0.05) / 0.05).toFixed(3));              // в смазе поверх карты из клипа встаёт чёткая
          st.setProperty('--th', (1 - smooth((d - 0.1) / 0.16)).toFixed(3));         // вырез под большой палец закрывается, когда палец ушёл из кадра
        }
      } else if (sh.zoomer) {
        sh.el.style.setProperty('--q', (p * p).toFixed(4)); // нырок в глаз короля: всё быстрее и быстрее
      } else if (sh.zoom) {
        const q = smooth((p - (1 - ZTAIL)) / ZTAIL);
        sh.el.style.setProperty('--z', (1 + q * q * (sh.zoom.k - 1)).toFixed(4)); // наезд в точку перед склейкой
      } else if (!sh.video && !sh.fit && !sh.el.classList.contains('trip')) {
        sh.el.style.setProperty('--z', (1 + p * 0.05).toFixed(4)); // кадр медленно наезжает
      }
    }

    // смаз-панорама: уходящий кадр улетает влево, новый прилетает справа
    let tx = 0;
    if (sh.tr === 'whip' && Math.abs(cur - sh.from) < WHIP / 2) {
      const q = (cur - (sh.from - WHIP / 2)) / WHIP;
      tx = (1 - inOut(q)) * vw * 1.1;
      whipM = Math.max(whipM, Math.sin(Math.PI * q));
    }
    if (sh.next && sh.next.tr === 'whip' && Math.abs(cur - sh.to) < WHIP / 2) {
      tx = -inOut((cur - (sh.to - WHIP / 2)) / WHIP) * vw * 1.1;
    }
    if (tx !== sh.tx) { sh.tx = tx; sh.el.style.setProperty('--tx', `${tx.toFixed(1)}px`); }

    // телевизор гаснет: картинка сжимается в полоску, полоска — в точку
    const crtOn = sh.next && sh.next.tr === 'crt' && cur > sh.to - CRT && cur < sh.to;
    if (crtOn) {
      const q = (cur - (sh.to - CRT)) / CRT;
      const sy = q < 0.62 ? 1 - smooth(q / 0.62) * 0.994 : 0.006;
      const sx = q < 0.62 ? 1 : 1 - smooth((q - 0.62) / 0.38);
      sh.el.style.setProperty('--sx', sx.toFixed(4));
      sh.el.style.setProperty('--sy', sy.toFixed(4));
      sh.el.style.filter = `brightness(${(1 + q * 3).toFixed(2)})`;
      sh.crt = true;
    } else if (sh.crt) {
      sh.el.style.removeProperty('--sx'); sh.el.style.removeProperty('--sy'); sh.el.style.filter = '';
      sh.crt = false;
    }

    // форма проявления: круг из глаза короля или панель формата, раскрывающаяся во весь экран
    let clip = '';
    if (sh.tr === 'iris' && cur >= sh.from && cur < sh.from + REVEAL) {
      const q = smooth((cur - sh.from) / REVEAL);
      clip = `circle(${(q * 78).toFixed(2)}% at ${sh.cx} ${sh.cy})`;
    }
    if (sh.tr === 'expand' && cur >= sh.from - EXP && cur < sh.from && sh.el.style.display !== 'none') {
      const pa = panels[0] && panels[0].a;
      if (pa) {
        const q = inOut((cur - (sh.from - EXP)) / EXP);
        const R = pa.getBoundingClientRect();
        const E = sh.el.getBoundingClientRect();
        const sc = E.width / (sh.el.offsetWidth || E.width);
        const t = R.top * (1 - q), l = R.left * (1 - q), r = vw - (vw - R.right) * (1 - q), b = vh - (vh - R.bottom) * (1 - q);
        const ins = [(t - E.top) / sc, (E.right - r) / sc, (E.bottom - b) / sc, (l - E.left) / sc].map((v) => Math.max(0, v).toFixed(1));
        clip = `inset(${ins[0]}px ${ins[1]}px ${ins[2]}px ${ins[3]}px)`;
      }
    }
    if (clip !== sh.clip) { sh.clip = clip; sh.el.style.clipPath = clip || 'none'; }
    // после влёта в глаз: камера внутри радужки, из темноты проявляется следующая сцена и чуть оседает на место
    if (sh.tr === 'eye' && cur >= sh.from - EYEW && cur < sh.from) {
      const q = smooth((cur - (sh.from - EYEW)) / EYEW);
      sh.el.style.setProperty('--z', (1 + 0.12 * (1 - q) * (1 - q)).toFixed(4));
      sh.eyeZ = true;
    } else if (sh.eyeZ) {
      sh.el.style.setProperty('--z', 1);
      sh.eyeZ = false;
    }

    if (sh.tr === 'flash') {
      // блик разгорается долго, а гаснет быстро: после склейки кадр сразу проясняется
      const d = cur - sh.from;
      const f = d < 0 ? 1 - clamp(-d / FLASH) : 1 - clamp(d / FLASH_OUT);
      if (f > flashA && sh.prev) { flashA = f; flashBefore = d < 0; flashXY = onScreen(sh.prev, parseFloat(sh.cx) / 100, parseFloat(sh.cy) / 100); }
    }
    if (sh.tr === 'strobe' && Math.abs(cur - sh.from) < STROBE) {
      for (const o of [-0.13, -0.07, -0.025, 0, 0.05, 0.1]) strobe = Math.max(strobe, 1 - clamp(Math.abs(cur - sh.from - o) / 0.022));
    }
    if (sh.tr === 'burn') burn = Math.max(burn, 1 - clamp(Math.abs(cur - sh.from) / BURN));

    if (sh.live && sh.video) { // живой клип играет, только пока его видно
      const on = vis > 0.01;
      if (on && sh.video.paused) playV(sh.video);
      if (!on && !sh.video.paused) { sh.video._play = false; sh.video.pause(); }
    }
    const on = vis > 0.01 && p > sh.onAt; // то, что внутри кадра, можно нажимать только когда камера доехала
    if (on !== sh.on) { sh.on = on; sh.el.classList.toggle('on', on); }
    if (Math.abs(vis - sh.shown) > 0.001) {
      sh.shown = vis;
      sh.el.style.opacity = vis;
      sh.el.style.display = vis < 0.01 ? 'none' : 'block'; // невидимый клип убираем совсем: спрятанное видео в Chrome может залить экран чёрным
    }
  });

  // блик на зубе: сначала маленькая звезда на улыбке, потом полоса через кадр, кадр пересвечивается в белое
  // Блик-звезду на зубе больше не рисуем (Павлу он казался нарисованным): кадр пересвечивается в белое, как от фотовспышки.
  // глубокий влёт в глаз короля рисуется на своём холсте и гаснет, когда сцена с дверью проявилась
  if (diveShot) { const D = diveShot.dive; deepFrame(diveShot, D, clamp((cur - D.from) / (D.to - D.from))); }
  // бриллиант в зубе (он есть в самом ролике обложки): когда улыбка раскрылась, камень коротко вспыхивает,
  // потом блик разгорается из него же, камера подлетает к нему, и кадр уходит в белое
  const cov = shots[0];
  let gf = 0, gxy = null;
  if (cov.shown > 0.01 && cov.el.style.display !== 'none') {
    const pc = clamp((cur - cov.from) / (cov.to - cov.from));
    const tw = 0.16 * Math.sin(Math.PI * clamp((pc - 0.74) / 0.12));
    gf = Math.max(tw, flashBefore ? flashA : 0);
    if (gf > 0.002) gxy = onScreen(cov, GEM[0], GEM[1]);
  }
  if (gxy) drawGlint(gf, gxy[0], gxy[1], 0.12 + gf * 0.5, gf > 0.3);
  else if (glintDrawn) drawGlint(0, 0, 0, 0);
  if (!!gxy !== fx._on) { fx._on = !!gxy; fx.style.display = gxy ? '' : 'none'; } // холст блика смешивается с кадром (screen): пока блика нет, слоя нет — иначе видеокарта смешивала бы пустоту на каждом кадре
  whiteout.style.opacity = smooth((flashA - 0.7) / 0.3).toFixed(3);
  // вспышки папарацци и засветка плёнки
  strobeEl.style.opacity = (strobe * 0.92).toFixed(3);
  burnEl.style.opacity = Math.pow(burn, 0.8).toFixed(3);
  if ((burn > 0.001) !== burnEl._on) { burnEl._on = burn > 0.001; burnEl.style.visibility = burnEl._on ? '' : 'hidden'; }
  burnEl.style.setProperty('--f', smooth((burn - 0.45) / 0.55).toFixed(3));
  // смаз всего кадра во время панорамы, пересвет во время блика и засветки
  whipDev.setAttribute('stdDeviation', `${(whipM * 46).toFixed(1)} 0`);
  let filt = '';
  if (whipM > 0.02) filt = coarse || SAFARI ? `blur(${(whipM * 5).toFixed(1)}px)` : 'url(#whipblur)';
  const expo = smooth((flashA - 0.35) / 0.65);
  if (expo > 0.01) filt += ` brightness(${(1 + expo * 3.2).toFixed(2)}) saturate(${(1 - expo * 0.5).toFixed(2)}) contrast(${(1 - expo * 0.35).toFixed(2)})`;
  if (burn > 0.02) filt += ` brightness(${(1 + burn * 0.9).toFixed(2)}) saturate(${(1 + burn * 0.6).toFixed(2)})`;
  filt = filt.trim();
  if (film.style.filter !== filt) film.style.filter = filt;
  const shake = Math.max(strobe * 0.6, burn * 0.25);
  film.style.transform = shake > 0.02 ? `translate(${((Math.random() - 0.5) * 12 * shake).toFixed(1)}px, ${((Math.random() - 0.5) * 8 * shake).toFixed(1)}px)` : '';

  // обложка: камера пролетает сквозь бриллиантовые буквы; имя в углу появляется, когда буквы улетели
  const cs = SCENES[0];
  const lq = clamp((cur - cs.start - 0.02 * cs.len) / (0.32 * cs.len));
  if (Math.abs(lq - lqShown) > 0.0005) {
    lqShown = lq;
    coverEl.style.setProperty('--lq', lq.toFixed(4));
    shots[0].el.style.setProperty('--hero', (1 - smooth(lq / 0.18)).toFixed(3)); // резкий первый кадр растворяется в ролике, пока улетают буквы
    coverEl.classList.toggle('fly', lq > 0.42); // размытие пролёта — только когда буквы уже близко, до того надпись чёткая и блестит
    html.dataset.logo = lq < 0.85 ? 'on' : 'off';
  }

  // живые клипы играют, только пока их видно
  const tripOn = !!tripShot && tripShot.shown > 0.01;
  if (tripOn !== tripLive || (tripOn && panels.some((p) => !p.v))) { tripLive = tripOn; panelsLive(tripOn); } // пока панели на экране, досаживаем ролики по мере загрузки
  const tvOn = !!tvShot && tvShot.shown > 0.01 && tvShot.on && modal.hidden;
  if (tvOn !== tvLive) {
    tvLive = tvOn;
    tubesLive(tvOn);
  }

  if (i !== sceneNow) {
    sceneNow = i;
    html.dataset.scene = s.id;
    chapterName.textContent = s.name[lang];
    menuBtns.forEach((b) => b.classList.toggle('on', b.dataset.fly === MENU_OF[s.id]));
  }
  railMarks.forEach((b, k) => b && b.style.setProperty('--p', clamp((cur - SCENES[k].start) / SCENES[k].len)));

  for (const c of chapters) {
    const vis = smooth((cur - c.from) / FADE + (c.from === -Infinity ? 1 : 0)) * (1 - smooth((cur - c.to) / FADE + 1));
    if (Math.abs(vis - c.shown) < 0.001) continue;
    c.shown = vis;
    const leaving = cur > c.to - FADE;
    c.el.style.opacity = vis;
    c.el.style.transform = c.el === coverEl ? '' : `translate3d(0, ${(1 - vis) * (leaving ? -26 : 26)}px, 0)`;
    c.el.style.visibility = vis < 0.01 ? 'hidden' : 'visible';
    c.el.classList.toggle('live', vis > 0.6);
  }

  layGeo();
  const rs = SCENES[byId.reviews];
  const rl = (cur - rs.start) / rs.len;
  layDeck(clamp(rl), smooth(rl / 0.06) * (1 - smooth((rl - 0.94) / 0.06)));
}
function tick(now) { frame(now); requestAnimationFrame(tick); }
// Если вкладка в фоне и кадры не идут, картинку всё равно обновляем по самому скроллу.
window.addEventListener('scroll', () => { if (performance.now() - last > 120) frame(performance.now(), true); }, { passive: true });

// ── видео целиком: кнопки «смотреть» и экраны телевизоров ──
const modal = $('#tvModal'), tvTitle = $('#tvTitle'), screen = $('#modalScreen');
function openModal(title, { yt, mp4, wide }) {
  tvTitle.textContent = title;
  screen.replaceChildren();
  screen.classList.toggle('wide', !!wide); // горизонтальный ролик (data-wide) — окно 16:9, остальные вертикальные 9:16
  if (yt) { // без куки до нажатия на play
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&playsinline=1&rel=0`;
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.title = title;
    screen.appendChild(f);
  } else if (mp4) {
    const v = document.createElement('video');
    v.src = `${CLOUD}${mp4}.mp4`;
    v.controls = true; v.autoplay = true; v.playsInline = true;
    screen.appendChild(v);
  }
  modal.hidden = false;
  $('#tvClose').focus();
  window.dispatchEvent(new CustomEvent('pb:video', { detail: { title, id: yt || mp4 } })); // для аналитики (js/site.js)
}
const label = (b) => (b.querySelector('b') || b).innerText.trim();
document.querySelectorAll('.scr, .play, .btn[data-mp4], .btn[data-yt]').forEach((b) => b.addEventListener('click', (e) => {
  e.preventDefault();
  openModal(label(b), { mp4: b.dataset.mp4, yt: b.dataset.yt || b.dataset.video, wide: 'wide' in b.dataset });
}));
const closeModal = () => { modal.hidden = true; screen.replaceChildren(); };
$('#tvClose').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// ── «Зачем это нужно?»: текст главы открывается окном поверх кадра, а не раскрывается внутри главы ──
// (раскрытая глава не помещалась в экран, а прокрутка двигает фильм — дочитать было нельзя)
const whyModal = $('#whyModal'), whyBox = $('#whyBox');
let whyFrom = null;
document.querySelectorAll('details.why').forEach((d) => {
  const sum = d.querySelector('summary');
  sum.setAttribute('aria-haspopup', 'dialog');
  sum.addEventListener('click', (e) => {
    e.preventDefault();
    const ch = d.closest('.chapter');
    $('#whyTag').textContent = ch ? ch.querySelector('.tag').textContent.trim() : '';
    $('#whyTitle').textContent = sum.textContent.trim();
    $('#whyText').replaceChildren(...[...d.querySelectorAll(':scope > p')].map((p) => p.cloneNode(true)));
    whyFrom = sum;
    whyModal.hidden = false;
    whyBox.scrollTop = 0;
    $('#whyClose').focus();
  });
});
const closeWhy = () => { if (whyModal.hidden) return; whyModal.hidden = true; if (whyFrom) whyFrom.focus({ preventScroll: true }); };
$('#whyClose').addEventListener('click', closeWhy);
whyModal.addEventListener('click', (e) => { if (e.target === whyModal) closeWhy(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeWhy(); });
// пока окно открыто, фильм под ним стоит: колесо и свайп листают только сам текст, если он длиннее окна
const holdScroll = (e) => { if (!whyBox.contains(e.target) || whyBox.scrollHeight <= whyBox.clientHeight + 1) e.preventDefault(); };
whyModal.addEventListener('wheel', holdScroll, { passive: false });
whyModal.addEventListener('touchmove', holdScroll, { passive: false });

// ── заявка, WhatsApp, метки и пиксели — в js/site.js (30-я редакция) ──

// для проверки: адрес с #at=stage:0.25 сразу открывает это место фильма
function jumpToHash() {
  const m = location.hash.match(/^#at=(\w+):([\d.]+)/);
  if (!m || byId[m[1]] === undefined) return;
  const sc = SCENES[byId[m[1]]];
  const y = (sc.start + parseFloat(m[2]) * sc.len) * SH;
  window.scrollTo({ top: y, behavior: 'instant' });
  cur = y / SH;
}
jumpToHash();
window.addEventListener('hashchange', jumpToHash);

requestAnimationFrame(tick);

// надпись на обложке: первым грузится лёгкий файл (первый экран появляется быстро), следом — в полном разрешении: при подлёте буквы остаются резкими
// 32-я редакция: на телефоне (экран до ~1100 px в ширину при 3x) надписи в покое хватает обычного файла; большой нужен, только когда камера летит
// сквозь буквы, поэтому на телефоне он качается с первым движением, а не сразу после загрузки (кто не листает — не качает 700 КБ)
const hiLogo = (force) => setTimeout(() => {
  if (!force && slowNet()) { hiPending = true; return; } // медленная сеть: сначала ролики (см. upgradeOne)
  const im = $('.chapter.cover .ice-logo'), hi = new Image();
  hi.src = V('media/ice_logo_x.webp');
  (hi.decode ? hi.decode() : Promise.resolve()).then(() => { im.removeAttribute('srcset'); im.src = hi.src; }).catch(() => { /* остаётся лёгкий */ });
}, coarse ? 0 : 800);
if (!SAVE) {
  if (coarse) window.addEventListener('scroll', () => hiLogo(), { once: true, passive: true });
  else window.addEventListener('load', () => hiLogo(), { once: true });
}
