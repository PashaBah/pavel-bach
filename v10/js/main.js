// Движок: скролл перематывает фильм об одной ночи, тексты лежат поверх.
// Каждая сцена — клип (перематывается), кадр или сцена из разметки; между сценами — киношные склейки (см. data-tr в index.html).

// len — длина сцены в высотах экрана; base — таймкод начала; span — сколько миллисекунд «проходит» за сцену
const SCENES = [
  { id: 'cover',   len: 1.5, base: '03:33:00.000', span: 70,  name: { en: '',                ru: '' },                  loc: { en: 'After hours',      ru: 'После полуночи' } },
  { id: 'formats', len: 2.4, base: '03:33:07.100', span: 30,  name: { en: 'Three formats',   ru: 'Три формата' },       loc: { en: 'Tracklist',        ru: 'Трек-лист' } },
  { id: 'card',    len: 4.4, base: '03:41:12.400', span: 160, name: { en: '01 — Close-up',   ru: '01 — Close-up' },     loc: { en: 'Among the guests', ru: 'Среди гостей' } },
  { id: 'king',    len: 1.7, base: '03:41:12.560', span: 20,  name: { en: '01 — Close-up',   ru: '01 — Close-up' },     loc: { en: 'Among the guests', ru: 'Среди гостей' }, rail: false },
  { id: 'stage',   len: 6.2, base: '03:52:47.120', span: 160, name: { en: '02 — Stage show', ru: '02 — Шоу на сцене' }, loc: { en: 'Main stage',       ru: 'Главная сцена' } },
  { id: 'incog',   len: 2.8, base: '04:05:30.000', span: 90,  name: { en: '03 — Incognito',  ru: '03 — Инкогнито' },    loc: { en: 'The party',        ru: 'Вечеринка' } },
  { id: 'tv',      len: 3.6, base: '04:20:00.000', span: 60,  name: { en: 'Video',           ru: 'Видео' },             loc: { en: 'On air',           ru: 'В эфире' } },
  { id: 'feat',    len: 2.0, base: '04:31:00.000', span: 40,  name: { en: 'Clients',         ru: 'Клиенты' },           loc: { en: 'Featuring',        ru: 'При участии' } },
  { id: 'titles',  len: 2.2, base: '04:36:00.000', span: 40,  name: { en: 'Credits',         ru: 'Регалии' },           loc: { en: 'On the record',    ru: 'Для протокола' } },
  { id: 'geo',     len: 2.8, base: '04:38:00.000', span: 60,  name: { en: 'Map',             ru: 'География' },         loc: { en: 'On tour',          ru: 'В дороге' } },
  { id: 'rabbit',  len: 3.4, base: '04:39:00.000', span: 90,  name: { en: 'Map',             ru: 'География' },         loc: { en: 'On tour',          ru: 'В дороге' }, rail: false },
  { id: 'reviews', len: 3.6, base: '04:40:00.000', span: 90,  name: { en: 'Reviews',         ru: 'Отзывы' },            loc: { en: 'Shout-outs',       ru: 'Респект' } },
  { id: 'wine',    len: 4.8, base: '05:01:00.000', span: 160, name: { en: 'Made for you',    ru: 'Номер под вас' },     loc: { en: 'Last call',        ru: 'Последний тост' } },
  { id: 'booking', len: 2.2, base: '05:01:11.000', span: 60,  name: { en: 'Your date',       ru: 'Ваша дата' },         loc: { en: 'After the show',   ru: 'После шоу' } },
];

const FADE = 0.16;   // ширина появления/ухода текста, в высотах экрана
const DIP = 0.22;    // уход в чёрное
const XFADE = 0.5;   // растворение
const FLASH = 0.26;  // за сколько до склейки разгорается блик с зуба
const FLASH_OUT = 0.2; // за сколько после склейки он гаснет
const REVEAL = 0.45; // за сколько раскрывается круг (переход iris)
const EYEW = 0.45;   // конец влёта в карту: экран уже залит чернотой зрачка, из неё кругом раскрывается следующая сцена
const ZTAIL = 0.17;  // какую долю конца сцены камера наезжает в точку (data-zoom)
const WHIP = 0.34;   // ширина смаз-панорамы
const STROBE = 0.16; // полуширина серии вспышек папарацци
const BURN = 0.3;    // полуширина засветки плёнки
const CRT = 0.34;    // сколько гаснет телевизор
const EXP = 0.5;     // сколько раскрывается панель формата во весь экран

const $ = (s) => document.querySelector(s);
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
const SAFARI = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent); // Safari плохо применяет SVG-фильтр к целой странице

// ── холст для блика ──
const fx = $('#glintFx'), fctx = fx.getContext('2d');
let fxDpr = 1;

// Раскладка считается от видимой высоты окна (vh), а прокрутка — от «большой» высоты экрана (SH, единица lvh):
// на айфоне панель Safari при скролле сворачивается, видимая высота прыгает, и без этого фильм дёргался бы.
const probe = document.createElement('div');
probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100lvh;visibility:hidden;pointer-events:none';
document.body.appendChild(probe);
let vh = window.innerHeight || 1, vw = window.innerWidth || 1, SH = 0, lastW = 0, barH = 60;
const barTop = $('.bar-top'), barBottom = $('.bar-bottom');
let footH = 34; // высота нижней рейки глав
let placeAll = () => {};
function layout() {
  const keep = SH ? window.scrollY / SH : null; // место в фильме при смене высоты сохраняем
  vh = window.innerHeight || 1; // панель может открыться с нулевой высотой
  vw = window.innerWidth || 1;
  const big = probe.offsetHeight || (!SH || vw !== lastW ? vh : SH); // где lvh нет — фиксируем высоту до поворота экрана
  lastW = vw;
  if (big !== SH) {
    SH = big;
    scrollSpace.style.height = `${(TOTAL + 1) * SH}px`;
    if (keep !== null && Math.abs(keep * SH - window.scrollY) > 2) window.scrollTo(0, keep * SH);
  }
  html.style.setProperty('--vh', `${vh / 100}px`);
  barH = barTop.offsetHeight || clamp(0.09 * vh, 54, 86);
  footH = barBottom.offsetHeight || 34;
  fxDpr = Math.min(2, window.devicePixelRatio || 1);
  fx.width = Math.round(vw * fxDpr); fx.height = Math.round(vh * fxDpr);
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
let fetching = 0;
function pump() {
  while (fetching < 2) {
    let best = null, bd = Infinity;
    for (const src in clips) {
      const c = clips[src];
      if (c.state !== 'idle') continue;
      const d = c.at >= cur - 0.5 ? c.at - cur : (cur - c.at) * 3 + 2; // сначала то, что впереди
      if (d < bd) { bd = d; best = src; }
    }
    if (!best) return;
    const c = clips[best];
    c.state = 'loading'; fetching++;
    fetch(best).then((r) => (r.ok ? r.blob() : Promise.reject(new Error(r.status))))
      .then((b) => { c.url = URL.createObjectURL(b); c.state = 'ready'; })
      .catch(() => { c.state = 'failed'; })
      .then(() => { fetching--; pump(); });
  }
}
// Раскадровка: лёгкие кадры клипа (каждые 0,8 с). Пока ролик не показывает картинку — качается, или телефон не дал его запустить, —
// в кадре листаются они, так что сцена читается в любом случае.
const FRAMES = {};
fetch('media/frames/index.json').then((r) => (r.ok ? r.json() : {})).then((d) => Object.assign(FRAMES, d)).catch(() => {});
function flipbook(sh, p) {
  const F = FRAMES[sh.name], v = sh.video;
  if (!F || (v && v._primed && v.readyState >= 2)) return;
  const k = Math.min(F.n - 1, Math.round(rampAt(sh.ramp, p) * F.dur / F.step));
  if (!sh.fr) sh.fr = [];
  for (const n of [k, k + 1]) { // нужный кадр и следующий за ним
    if (n >= F.n || sh.fr[n]) continue;
    const im = new Image();
    im.decoding = 'async'; im.onload = () => { im.ok = true; };
    im.src = `media/frames/${sh.name}/${n}.jpg`;
    sh.fr[n] = im;
  }
  let n = k;
  while (n >= 0 && !(sh.fr[n] && sh.fr[n].ok)) n--;
  if (n >= 0 && sh.frShown !== n) { sh.frShown = n; sh.poster.src = sh.fr[n].src; }
}
const posterOf = (src, pre = '') => src.replace(/([^/]+)\.mp4$/, `posters/${pre}$1.jpg`);

// Айфон не подгружает кадры ролика, пока тот хоть раз не запущен, поэтому каждый ролик запускаем без звука и сразу ставим на паузу.
// В режиме энергосбережения автозапуск запрещён: тогда показываем подсказку и оживляем ролики по первому касанию.
let blocked = false;
const tapVideo = $('#tapVideo');
const stuck = (e) => { // только настоящий запрет автозапуска; прерванный запуск (ролик убрали из кадра) — не в счёт
  if (e && e.name !== 'NotAllowedError') return;
  blocked = true; tapVideo.hidden = false;
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
    v._direct = true; v.src = src; v.load();
    if (v._play) playV(v); else prime(v);
  });
  v.src = url;
  return v;
}
function dropVideo(v) { v.pause(); v.removeAttribute('src'); v.load(); v.remove(); }
const filmVideos = () => [...document.querySelectorAll('#film video')];
function unlock() {
  if (!blocked) return;
  blocked = false; tapVideo.hidden = true;
  filmVideos().forEach((v) => { if (v._play) playV(v); else if (!v._primed) prime(v); });
}
['touchend', 'click', 'keydown'].forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));
document.addEventListener('visibilitychange', () => { // вкладку свернули и вернули: айфон мог выгрузить ролики
  if (document.visibilityState !== 'visible') return;
  filmVideos().forEach((v) => { if (v._play) playV(v); else if (IOS) prime(v); });
});

// ── фильм ───────────────────────────────────────
const shots = [...document.querySelectorAll('.shot')].map((el) => {
  const ids = el.dataset.scenes.split(' ');
  const first = SCENES[byId[ids[0]]], last = SCENES[byId[ids[ids.length - 1]]];
  const sh = {
    el, id: ids[0], tr: el.dataset.tr || '', fade: parseFloat(el.dataset.fade || XFADE), zoomer: el.classList.contains('zoomer'),
    cx: el.dataset.cx || '50%', cy: el.dataset.cy || '50%', mx: parseFloat(el.dataset.mx || 50) / 100, dx: el.dataset.dx || '0%', bs: el.dataset.bs || 1,
    ramp: el.dataset.ramp ? el.dataset.ramp.split(',').map((q) => q.split(':').map(Number)) : null,
    zoom: null, from: first.start, to: last.start + last.len, video: null, shown: -1, clip: '', tx: 0, crt: false,
    live: el.hasAttribute('data-live'),                                   // клип не перематывается скроллом, а играет по кругу
    mx2: el.dataset.mx2 ? parseFloat(el.dataset.mx2) / 100 : null,        // на вертикальном экране кадр панорамирует от data-mx к data-mx2
    pan: (el.dataset.pan || '0.4,0.7').split(',').map(Number), mxNow: -1, w: 0, h: 0, shift: 0, dive: null, fit: null, on: false,
    onAt: parseFloat(el.dataset.on || 0.66),                              // с какой доли сцены то, что внутри кадра, можно нажимать
  };
  // влёт в карту: data-card="cx,cy,w,rot" — где в последнем кадре клипа лежит карта (центр и ширина в % кадра, наклон в градусах)
  if (el.dataset.card) {
    const [cx, cy, cw, rot] = el.dataset.card.split(',').map(parseFloat);
    const k = SCENES[byId.king];
    sh.dive = { cx: cx / 100, cy: cy / 100, cw: cw / 100, rot, from: k.start, to: k.start + k.len, d: -1 };
    sh.dive.pupil = el.querySelector('.pupil');
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
  const src = el.dataset.src;
  if (src && /\.mp4$/.test(src)) {
    sh.src = src;
    sh.name = src.replace(/^.*\/|\.mp4$/g, '');
    clipOf(src, sh.from);
    const img = new Image();
    img.alt = ''; img.className = 'poster'; img.decoding = 'async';
    img.src = posterOf(src);
    el.prepend(img);
    sh.poster = img;
  } else if (src) {
    sh.imgSrc = src; // картинку сцены грузим, когда до неё недалеко или когда клипы уже скачаны
  }
  return sh;
});
shots.forEach((sh, k) => { sh.next = shots[k + 1]; sh.prev = shots[k - 1]; });
const NOVIDEO = /[?&]novideo/.test(location.search); // для проверки: сайт без роликов, на одной раскадровке (как на телефоне, который не запустил видео)
function arm(sh) { // ролик сцены встаёт в кадр поверх постера
  const c = clips[sh.src];
  if (NOVIDEO || sh.video || !c || c.state !== 'ready') return;
  const v = makeVideo(sh.src, c.url, sh.live);
  sh.poster.after(v);
  sh.video = v;
  if (sh.live) playV(v); else prime(v);
}
function disarm(sh) { if (sh.video) { dropVideo(sh.video); sh.video = null; } }
function stock() { // что держать наготове: ролики и картинки ближайших сцен
  const idle = fetching === 0;
  for (const sh of shots) {
    const d = cur < sh.from ? sh.from - cur : cur > sh.to ? cur - sh.to : 0;
    if (sh.src) {
      if (!LAZY || d < 1.3) arm(sh); else if (d > 1.6) disarm(sh);
    }
    if (d < 2 || idle) {
      if (sh.imgSrc && !sh.img) { sh.img = new Image(); sh.img.alt = ''; sh.img.onload = () => sh.el.prepend(sh.img); sh.img.src = sh.imgSrc; }
      if (!sh.lazyDone) { sh.lazyDone = true; sh.el.querySelectorAll('img[data-src]').forEach((im) => { im.src = im.dataset.src; }); }
    }
  }
}

// Кадр 16:9 накрывает экран. На вертикальном экране видна только его часть — data-mx говорит, какую точку держать в центре.
// На широком экране кадр можно сдвинуть и укрупнить (data-dx, data-bs), чтобы герой не оказался под текстом.
const KAR = 1260 / 1726; // пропорции картинки карты (media/king.jpg)
const PUPIL = 0.0071;   // радиус зрачка короля в долях ширины карты
const EYE = [0.4988, 0.2222]; // куда на карте влетает камера: глаз короля за стеклом очков (доли ширины и высоты картинки карты)
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
    D.ax = D.cx * sh.w + ox * Math.cos(a) - oy * Math.sin(a);
    D.ay = D.cy * sh.h + ox * Math.sin(a) + oy * Math.cos(a);
    el.style.transformOrigin = `${D.ax.toFixed(1)}px ${D.ay.toFixed(1)}px`;
    D.px = left0 - sh.shift + D.ax; // где эта точка на экране до наезда (без учёта панорамы --shift)
    D.py = top0 + D.ay;
    D.s1 = Math.max(0.75 * vw, 0.75 * vh) / cwp; // к середине влёта карта шире экрана: видно только лицо короля
    D.pr = PUPIL * cwp;                          // радиус зрачка в кадре до наезда
    D.pupil.style.left = `${D.ax.toFixed(1)}px`; D.pupil.style.top = `${D.ay.toFixed(1)}px`;
    D.pupil.style.width = D.pupil.style.height = `${(2 * D.pr).toFixed(2)}px`;
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
    case 'eye': return +(cur >= sh.from - EYEW);
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
    case 'eye': return 1 - smooth((cur - (sh.to - 0.08)) / 0.08);
    case 'wash': return +(cur < sh.to + n.fade);
    default: return 1 - smooth((cur - (sh.to - DIP)) / DIP);
  }
}

// ── панели «трёх форматов»: живые клипы поверх постеров ──
const panels = [...document.querySelectorAll('.panel')].map((a) => {
  const src = a.dataset.video;
  clipOf(src, SCENES[byId.formats].start);
  const img = new Image();
  img.alt = ''; img.className = 'poster';
  img.src = posterOf(src, 'p_');
  a.prepend(img);
  return { a, src, img, v: null };
});
function panelsLive(on) {
  for (const p of panels) {
    const c = clips[p.src];
    if (on && !p.v && c.state === 'ready') { p.v = makeVideo(p.src, c.url, true); p.img.after(p.v); }
    if (!p.v) continue;
    if (on) { if (p.v.paused) playV(p.v); } else if (LAZY) { dropVideo(p.v); p.v = null; } else if (!p.v.paused) { p.v._play = false; p.v.pause(); }
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
    v.poster = `${CLOUD}w_360,q_auto:low,so_${b.dataset.so || 0}/${b.dataset.mp4}.jpg`; // тот же кадр, что стоит на экране в клипе
    v._src = `${CLOUD}w_360,q_auto:low,so_${b.dataset.so || 0},du_8,ac_none/${b.dataset.mp4}.mp4`;
    v.style.objectPosition = `50% ${b.dataset.oy || '50%'}`;
    t.appendChild(v);
    screensLive.push(v);
  } else if (b.dataset.yt) {
    const img = new Image();
    img.alt = '';
    img.src = `https://i.ytimg.com/vi/${b.dataset.yt}/hqdefault.jpg`;
    t.appendChild(img);
  }
  tubes.appendChild(t);
});
const tvShot = shots.find((sh) => sh.id === 'tv');
// география: маршрут рисуется по мере прокрутки, по нему летит самолёт, города загораются, когда он до них долетел
const geoShot = shots.find((sh) => sh.id === 'geo');
const geo = { path: null, plane: null, len: 0, cities: [], q: -1 };
fetch('media/map.svg').then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status)))).then((svg) => {
  const box = $('#geoMap');
  box.innerHTML = svg;
  geo.path = box.querySelector('#geoRoute'); geo.plane = box.querySelector('#geoPlane'); geo.len = geo.path.getTotalLength();
  const N = 500, pts = [];
  for (let k = 0; k <= N; k++) pts.push(geo.path.getPointAtLength(geo.len * k / N));
  geo.cities = [...box.querySelectorAll('.city')].map((g) => { // на какой доле маршрута стоит город
    const c = g.querySelector('circle'), x = +c.getAttribute('cx'), y = +c.getAttribute('cy');
    let best = 0, bd = Infinity;
    pts.forEach((pt, k) => { const d = (pt.x - x) ** 2 + (pt.y - y) ** 2; if (d < bd) { bd = d; best = k; } });
    return { g, t: best / N };
  });
}).catch(() => { /* карты нет — остаётся текст */ });
const GEO_LINES = {
  ru: ['Ваш вечер?', 'Или здесь?', 'Он успеет и туда, и туда.', 'Хватит гонять самолёт — проверьте дату.'],
  en: ['Your event?', 'Or here?', 'He can do both.', 'Stop flying the plane and check your date.'],
};
const SVGNS = 'http://www.w3.org/2000/svg';
function geoReset() { // ушли со сцены — карта снова ведёт самолёт по маршруту
  if (!geo.free) return;
  geo.free = false; geo.q = -1; geo.hops = 0;
  if (geo.anim) cancelAnimationFrame(geo.anim);
  geo.path.ownerSVGElement.querySelectorAll('.hop, .pin').forEach((n) => n.remove());
}
$('#geoMap').addEventListener('click', (e) => {
  if (!geo.path || !geoShot || geoShot.shown < 0.6) return;
  const svg = geo.path.ownerSVGElement, pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const to = pt.matrixTransform(svg.getScreenCTM().inverse());
  const from = geo.pos || geo.path.getPointAtLength(clamp(geo.q) * geo.len);
  const dx = to.x - from.x, dy = to.y - from.y, dist = Math.hypot(dx, dy);
  if (dist < 12) return;
  const cx = (from.x + to.x) / 2 + dy * 0.22, cy = (from.y + to.y) / 2 - Math.abs(dx) * 0.22 - 20; // дуга выгнута вверх
  svg.querySelectorAll('.pin').forEach((n) => n.remove());
  const trail = document.createElementNS(SVGNS, 'path');
  trail.setAttribute('class', 'hop');
  trail.setAttribute('d', `M${from.x.toFixed(1)},${from.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${to.x.toFixed(1)},${to.y.toFixed(1)}`);
  trail.setAttribute('pathLength', '1');
  svg.insertBefore(trail, geo.plane);
  geo.free = true;
  if (geo.anim) cancelAnimationFrame(geo.anim);
  const t0 = performance.now(), T = clamp(dist * 2.2, 500, 1300);
  const step = (now) => {
    const k = inOut(clamp((now - t0) / T)), m = 1 - k;
    const x = m * m * from.x + 2 * m * k * cx + k * k * to.x, y = m * m * from.y + 2 * m * k * cy + k * k * to.y;
    const tx = 2 * m * (cx - from.x) + 2 * k * (to.x - cx), ty = 2 * m * (cy - from.y) + 2 * k * (to.y - cy);
    geo.pos = { x, y };
    geo.plane.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(Math.atan2(ty, tx) * 180 / Math.PI + 90).toFixed(1)}) scale(1.5)`);
    trail.style.strokeDashoffset = (1 - k).toFixed(3);
    if (k < 1) { geo.anim = requestAnimationFrame(step); return; }
    const lines = GEO_LINES[lang], pin = document.createElementNS(SVGNS, 'g');
    pin.setAttribute('class', 'pin');
    const side = to.x > 1150 ? 'end' : to.x < 450 ? 'start' : 'middle';
    pin.innerHTML = `<circle cx="${to.x.toFixed(1)}" cy="${to.y.toFixed(1)}" r="8"/><text x="${to.x.toFixed(1)}" y="${(to.y + (to.y > 780 ? -22 : 40)).toFixed(1)}" text-anchor="${side}">${lines[Math.min(geo.hops || 0, lines.length - 1)]}</text>`;
    svg.appendChild(pin);
    geo.hops = (geo.hops || 0) + 1;
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
    if (on) { if (!v.getAttribute('src')) v.src = v._src; if (v.paused) playV(v); }
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
const MENU_OF = { formats: 'formats', card: 'formats', king: 'formats', stage: 'formats', incog: 'formats', tv: 'tv', feat: 'feat', titles: 'titles', geo: 'geo', rabbit: 'geo', reviews: 'reviews', wine: 'booking', booking: 'booking' };

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
let lang = 'en', sceneNow = -1;
function setLang(l) {
  lang = l;
  html.dataset.lang = l;
  html.lang = l;
  document.title = l === 'ru' ? 'Павел Бах — иллюзионист для частных и корпоративных событий' : 'Pavel Bach — Magician for private and corporate events';
  sceneNow = -1; // перерисовать подписи
  try { localStorage.setItem('lang', l); } catch (e) { /* хранилище недоступно — не страшно */ }
}
let saved = null;
try { saved = localStorage.getItem('lang'); } catch (e) { /* то же */ }
setLang(saved || ((navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en'));
$('#langToggle').addEventListener('click', () => setLang(lang === 'en' ? 'ru' : 'en'));

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
  const F = tall ? [0, H * 0.075] : [W * 0.2, -H * 0.02];
  const G = tall ? [W * 0.04, -H * 0.2] : [-W * 0.2, -H * 0.1]; // папка в руках организаторов: оттуда вылетают карты
  const DIP = (tall ? 0.05 : 0.2) * H, R0 = (tall ? 0.05 : 0.07) * Math.min(W, H);
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
    const wob = Math.sin(t * 1.1 + j * 2) * 1.5;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${(y + wob * 2 * sc).toFixed(1)}px, 0) scale(${sc.toFixed(4)}) rotateY(${(ry + wob).toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) rotateZ(${(rz + wob * 0.3).toFixed(2)}deg)`;
    el.style.opacity = clamp(op).toFixed(3);
    el.style.zIndex = 200 - Math.round(Math.abs(u) * 10);
    // объём: карта, повёрнутая от света, темнее; дальние и пролетающие мимо — не в фокусе
    const shade = clamp(Math.abs(ry) / 110 + Math.abs(rx) / 160), blur = u <= 0 ? -u * 7 : clamp((u - 1.2) * 0.5, 0, 2.5) / Math.max(sc, 0.2); // размытие задано до масштаба
    const look = `${shade.toFixed(2)}|${blur.toFixed(1)}`;
    if (look !== el._look) { el._look = look; el.style.setProperty('--sh', shade.toFixed(2)); el.style.filter = blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : ''; }
    el.classList.toggle('front', Math.abs(u) < 0.5);
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
      sh.el.style.setProperty('--p', p.toFixed(4)); // по нему CSS проявляет то, что лежит внутри кадра
      if (sh.video && !sh.live && sh.video.readyState >= 1 && !sh.video.seeking && sh.video.duration) {
        const t = rampAt(sh.ramp, p) * (sh.video.duration - 0.05);
        if (Math.abs(sh.video.currentTime - t) > 0.02) sh.video.currentTime = t;
      }
      if (sh.src) flipbook(sh, p);
      if (sh.video && !sh.live && sh.video.readyState < 2 && now - (sh.video._kick || 0) > 1500) { sh.video._kick = now; if (!blocked) prime(sh.video); }
      if (sh.mx2 !== null) { // вертикальный экран: кадр едет от героя к тому, на что он показывает
        const m = sh.mx + (sh.mx2 - sh.mx) * smooth((p - sh.pan[0]) / (sh.pan[1] - sh.pan[0]));
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
          const a = smooth(d / 0.45), b = Math.pow(clamp((d - 0.3) / 0.45), 1.5), m = smooth(d / 0.4);
          const t = clamp((d - 0.46) / 0.27);                                         // подлёт к зрачку
          const st = sh.el.style, z = Math.exp(Math.log(D.s1) * a + Math.log(2.6) * b) * (1 + 2.4 * t * t); // у самого глаза камера ускоряется (картинку там уже закрывает зрачок)
          st.setProperty('--z', z.toFixed(4));
          st.setProperty('--out', (t * t * t).toFixed(3)); // размытие — только у самого зрачка
          st.setProperty('--rot', `${(-D.rot * smooth(d / 0.4)).toFixed(3)}deg`);
          st.setProperty('--ax', `${((vw / 2 - D.px - sh.shift) * m).toFixed(1)}px`);
          st.setProperty('--ay', `${((vh / 2 - D.py) * m).toFixed(1)}px`);
          st.setProperty('--d', d.toFixed(4));
          st.setProperty('--kick', Math.sin(Math.PI * clamp(d / 0.16)).toFixed(3)); // камера срывается с места: короткий смаз
          st.setProperty('--ko', smooth((d - 0.05) / 0.05).toFixed(3));              // в смазе поверх карты из клипа встаёт чёткая
          st.setProperty('--th', (1 - smooth((d - 0.1) / 0.16)).toFixed(3));         // вырез под большой палец закрывается, когда палец ушёл из кадра
          // зрачок короля: камера летит прямо в него, и его чернота заливает экран
          const full = Math.hypot(vw, vh) * 0.75, r0 = D.pr * z;
          const rs = r0 * Math.pow(full / r0, Math.pow(t, 1.25));
          D.pupil.style.transform = `translate(-50%, -50%) scale(${(rs / r0).toFixed(3)})`;
          D.pupil.style.opacity = smooth(t / 0.12).toFixed(3);
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
    // влёт в глаз: следующая сцена сначала видна в зрачке (центр экрана), растёт вместе с наездом и занимает весь экран
    let mask = '';
    if (sh.tr === 'eye' && cur >= sh.from - EYEW && cur < sh.from) {
      // сцена целиком умещается в зрачке (уменьшенная, по центру экрана) и растёт вместе с кругом; к концу встаёт на своё место
      const q = (cur - (sh.from - EYEW)) / EYEW;
      const R = Math.hypot(vw, vh) * 0.66 * Math.pow(q, 1.5); // круг раскрывается из черноты зрачка
      const z = clamp(R * 2.15 / sh.h, 0.06, 1), e = smooth((q - 0.5) / 0.5); // кадр всегда чуть выше круга: в зрачке не видно его прямых краёв
      const ax = (vw / 2 - sh.cx) * (1 - e), ay = (vh / 2 - sh.cy) * (1 - e);
      const lx = sh.w / 2 + (vw / 2 - sh.cx - ax) / z, ly = sh.h / 2 + (vh / 2 - sh.cy - ay) / z;
      mask = `radial-gradient(circle ${(R / z).toFixed(1)}px at ${lx.toFixed(1)}px ${ly.toFixed(1)}px, #000 68%, transparent 100%)`;
      const st = sh.el.style;
      st.setProperty('--z', z.toFixed(4)); st.setProperty('--ax', `${ax.toFixed(1)}px`); st.setProperty('--ay', `${ay.toFixed(1)}px`);
      sh.eyeZ = true;
    } else if (sh.eyeZ) {
      const st = sh.el.style;
      st.setProperty('--z', 1); st.setProperty('--ax', '0px'); st.setProperty('--ay', '0px');
      sh.eyeZ = false;
    }
    if (mask !== (sh.mask || '')) { sh.mask = mask; sh.el.style.webkitMaskImage = mask || 'none'; sh.el.style.maskImage = mask || 'none'; }

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
  if (glintDrawn) drawGlint(0, 0, 0, 0);
  whiteout.style.opacity = smooth((flashA - 0.7) / 0.3).toFixed(3);
  // вспышки папарацци и засветка плёнки
  strobeEl.style.opacity = (strobe * 0.92).toFixed(3);
  burnEl.style.opacity = Math.pow(burn, 0.8).toFixed(3);
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
function openModal(title, { yt, mp4 }) {
  tvTitle.textContent = title;
  screen.replaceChildren();
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
}
const label = (b) => (b.querySelector('b') || b).innerText.trim();
document.querySelectorAll('.scr, .play').forEach((b) => b.addEventListener('click', () => {
  openModal(label(b), { mp4: b.dataset.mp4, yt: b.dataset.yt || b.dataset.video });
}));
const closeModal = () => { modal.hidden = true; screen.replaceChildren(); };
$('#tvClose').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// ── заявка: открывает WhatsApp Павла с готовым сообщением (своего сервера у сайта нет) ──
const WA = '34627084012';
const NOTE = {
  bad: { en: 'Please add your name and the date or city.', ru: 'Укажите имя и дату или город.' },
  ok: { en: 'Opening WhatsApp with your message ready — just press send. If it did not open, write to +34 627 084 012.',
        ru: 'Открываю WhatsApp с готовым сообщением — останется нажать «Отправить». Если он не открылся, напишите на +34 627 084 012.' },
};
$('#bookForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget, v = (n) => f[n].value.trim();
  const valid = v('name') && (v('event') || v('email') || v('phone'));
  $('#formNote').textContent = NOTE[valid ? 'ok' : 'bad'][lang];
  if (!valid) return;
  const ru = lang === 'ru';
  const lines = [
    ru ? 'Здравствуйте, Павел! Хочу узнать, свободна ли дата.' : 'Hi Pavel! I would like to check if you are free on our date.',
    `${ru ? 'Имя' : 'Name'}: ${v('name')}`,
    v('event') && `${ru ? 'Событие' : 'Event'}: ${v('event')}`,
    v('email') && `E-mail: ${v('email')}`,
    v('phone') && `${ru ? 'Телефон' : 'Phone'}: ${v('phone')}`,
  ].filter(Boolean);
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
});

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
