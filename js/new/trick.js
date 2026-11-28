// Фокус «Ваш ход» (4-я редакция, 28.11.2026): вещи, которые гости прячут, когда входит Павел.
// Три варианта по очереди (следующий — при «Ещё раз» и при новом открытии; номер помнит браузер):
//   1) любые часы → ближайший кошелёк → ближайшее кольцо → ближайшая красная вещь = красные очки;
//   2) любое кольцо → кошелёк → телефон → часы = Apple Watch;
//   3) любой кошелёк → часы → кольцо → телефон = белый телефон.
// Загаданная вещь не уникальна (просьба Павла): есть такие же в других цветах и точно такая же в дальнем углу,
// куда цепочка взгляда никак не доходит. Загаданная вещь в каждом варианте в своём месте стола (очки — ниже и правее центра,
// часы — выше, телефон — слева посередине). Раскладки подбирает и проверяет build/trick_layouts.py.
// Финал: «нажмите на Павла» → он медленно тянет руку и сжимает кулак → все вещи, кроме загаданной, сминаются, как жестяная банка, и исчезают.
// Картинки: вещи — одна карта 8×5 (media/trick_items.jpg + маска trick_items_a.jpg), ведущий — позы media/trick_p*.jpg + маски.
// Позы — настоящие кадры Павла из видео с родинкой, переодетые в смокинг (gen/trick/presenter_v2): лицо не перерисовано.
// JPEG + маска весят в 5 раз меньше PNG; прозрачность браузер собирает сам (canvas).
// Вещь: [x, y, наклон°, масштаб, вид, клетка карты]; вид: t — загаданная, w — часы, l — кошелёк, r — кольцо, x — красное, p — телефон, o — прочее
const VARIANTS = [
  { key: 'glasses', items: [
    [151.4, 290.1, 10, 0.93, 't', 28], [24.5, 20.6, 3, 1.03, 'x', 28], [276.8, 378.4, 12, 0.97, 'x', 24], [95.9, 165.3, 5, 1.08, 'x', 25],
    [228.0, 149.0, -22, 0.96, 'x', 26], [235.9, 59.1, 9, 1.05, 'x', 27], [111.0, 29.6, -9, 0.99, 'x', 29], [162.8, 120.2, -5, 0.94, 'x', 31],
    [93.1, 305.0, -14, 0.81, 'r', 16], [200.1, 256.7, -20, 0.86, 'r', 17], [169.4, 349.6, 10, 0.82, 'r', 18], [177.4, 29.7, 20, 0.85, 'r', 19],
    [68.3, 59.1, 25, 0.74, 'r', 20], [23.4, 141.3, -25, 0.75, 'r', 21], [265.2, 136.9, 10, 0.84, 'r', 16], [274.5, 22.6, -10, 0.82, 'r', 17],
    [42.4, 262.3, -9, 1.07, 'l', 8], [279.8, 307.6, 28, 1.06, 'l', 11], [75.0, 363.2, 7, 1.14, 'l', 14], [237.5, 225.7, -25, 1.07, 'l', 9],
    [129.7, 237.4, -20, 1.15, 'l', 12], [235.7, 369.4, 12, 1.05, 'l', 15], [116.3, 357.3, 19, 0.97, 'w', 0], [218.4, 189.0, -25, 0.93, 'w', 1],
    [58.9, 194.1, 10, 1.01, 'w', 2], [93.0, 265.0, 3, 0.93, 'w', 3], [266.5, 93.9, -4, 0.93, 'w', 4], [129.1, 143.1, -18, 0.96, 'w', 6],
    [160.1, 75.1, 18, 1.04, 'w', 7], [36.0, 312.5, 6, 0.94, 'w', 0], [18.8, 58.2, -15, 1.0, 'w', 1], [252.0, 332.2, 17, 0.97, 'w', 2],
    [249.7, 263.7, 12, 1.01, 'w', 3], [162.4, 254.6, -24, 1.0, 'w', 4], [227.2, 300.2, -22, 0.97, 'o', 22], [138.2, 325.1, 4, 0.91, 'o', 32],
    [73.3, 22.3, 0, 0.93, 'o', 33], [132.6, 182.4, 26, 0.97, 'o', 34], [59.3, 155.9, -23, 1.0, 'o', 35], [228.1, 108.8, -1, 0.95, 'o', 36],
    [211.6, 337.2, 2, 1.0, 'o', 37], [90.2, 125.7, 1, 0.88, 'o', 38], [34.4, 355.3, -2, 0.98, 'o', 35], [95.3, 211.5, -3, 0.96, 'o', 36],
    [199.9, 76.3, -12, 0.94, 'o', 32], [114.6, 79.6, -10, 0.92, 'o', 33], [197.0, 377.2, -7, 0.93, 'o', 34], [280.1, 238.0, -25, 0.96, 'o', 37],
    [181.8, 314.2, 16, 0.99, 'o', 38], [18.1, 201.7, 0, 0.98, 'o', 22], [188.5, 216.6, -10, 0.95, 'o', 32], [228.7, 21.9, -6, 0.98, 'o', 33],
    [190.0, 156.9, -17, 1.02, 'o', 34], [29.4, 95.1, 17, 1.01, 'o', 35], [256.1, 187.8, 4, 0.96, 'o', 36],
  ] },
  { key: 'awatch', items: [
    [112.3, 112.5, 17, 1.0, 't', 2], [260.7, 375.8, -18, 0.98, 'w', 2], [257.3, 159.7, 5, 0.94, 'w', 0], [234.5, 246.6, -4, 1.0, 'w', 1],
    [97.9, 267.9, -4, 0.92, 'w', 3], [269.0, 36.1, -22, 0.97, 'w', 4], [161.1, 300.2, -12, 0.99, 'w', 6], [118.0, 369.0, -7, 0.97, 'w', 7],
    [47.7, 146.7, 27, 0.88, 'p', 32], [159.1, 123.6, -8, 1.02, 'p', 25], [115.0, 33.4, -16, 0.99, 'p', 33], [91.4, 340.4, -19, 0.91, 'p', 32],
    [194.2, 265.3, -12, 0.91, 'p', 25], [21.5, 378.1, -23, 0.99, 'p', 33], [235.4, 339.6, 18, 0.89, 'p', 32], [160.1, 373.4, -13, 0.99, 'p', 25],
    [275.6, 249.4, -19, 0.99, 'p', 33], [175.3, 56.3, 4, 1.13, 'l', 8], [93.8, 159.0, 22, 1.03, 'l', 11], [212.9, 139.0, 24, 1.18, 'l', 14],
    [44.3, 44.1, -6, 1.15, 'l', 9], [29.1, 202.9, 17, 1.18, 'l', 12], [101.5, 73.7, 9, 1.05, 'l', 15], [164.4, 20.6, -24, 0.76, 'r', 16],
    [73.0, 101.1, -25, 0.8, 'r', 17], [193.7, 324.3, -2, 0.85, 'r', 18], [18.4, 76.4, 4, 0.8, 'r', 19], [269.9, 115.3, -13, 0.76, 'r', 20],
    [50.7, 302.1, -6, 0.83, 'r', 21], [208.3, 74.1, 21, 0.77, 'r', 16], [269.4, 323.8, 6, 0.83, 'r', 17], [143.6, 79.9, 19, 0.75, 'r', 18],
    [175.7, 179.9, -22, 0.75, 'r', 19], [243.8, 201.8, -1, 0.76, 'r', 20], [157.2, 262.8, 5, 0.81, 'r', 21], [62.7, 372.0, 5, 0.91, 'o', 22],
    [243.2, 89.0, 19, 1.0, 'o', 24], [81.6, 195.7, 27, 1.02, 'o', 26], [74.9, 232.8, 1, 0.97, 'o', 27], [207.2, 211.6, -24, 0.98, 'o', 28],
    [281.4, 77.7, -14, 0.91, 'o', 29], [31.0, 112.3, -21, 0.92, 'o', 31], [131.7, 158.0, 15, 1.01, 'o', 34], [204.2, 361.8, -16, 0.93, 'o', 35],
    [206.2, 24.3, -15, 1.03, 'o', 36], [239.1, 289.9, -22, 1.0, 'o', 37], [120.9, 193.9, 27, 0.95, 'o', 38], [133.9, 327.6, -11, 0.98, 'o', 28],
    [281.6, 205.6, 14, 0.88, 'o', 35], [37.7, 263.2, -20, 0.95, 'o', 22], [73.8, 21.4, -24, 0.95, 'o', 22], [30.7, 342.1, -25, 0.91, 'o', 24],
    [138.2, 229.0, 0, 0.97, 'o', 26], [279.4, 286.2, -8, 0.94, 'o', 27],
  ] },
  { key: 'wphone', items: [
    [88.0, 202.4, -13, 0.9, 't', 33], [254.5, 368.4, 15, 0.93, 'p', 33], [236.3, 46.3, -2, 0.9, 'p', 32], [40.1, 21.5, 9, 0.95, 'p', 25],
    [275.5, 292.3, 4, 0.91, 'p', 32], [155.1, 22.4, -5, 0.99, 'p', 25], [24.1, 374.9, 24, 0.93, 'p', 32], [195.9, 301.9, 9, 0.95, 'p', 25],
    [156.1, 191.0, 4, 0.75, 'r', 16], [77.7, 259.5, 9, 0.85, 'r', 17], [65.0, 151.3, -3, 0.84, 'r', 18], [217.7, 79.7, -19, 0.85, 'r', 19],
    [281.5, 127.3, -5, 0.82, 'r', 20], [280.5, 254.4, 9, 0.86, 'r', 21], [166.1, 351.6, 3, 0.81, 'r', 16], [269.1, 329.3, -17, 0.76, 'r', 17],
    [187.9, 157.7, 27, 1.04, 'w', 0], [168.9, 237.3, 2, 1.02, 'w', 3], [21.8, 175.6, 1, 0.99, 'w', 7], [94.3, 92.6, 1, 1.07, 'w', 2],
    [18.1, 253.6, -10, 0.94, 'w', 6], [31.9, 318.6, 21, 0.98, 'w', 1], [128.3, 240.9, -3, 1.16, 'l', 8], [24.7, 109.8, -26, 1.06, 'l', 9],
    [273.5, 37.9, -23, 1.11, 'l', 10], [113.5, 335.4, 21, 1.09, 'l', 11], [90.4, 46.8, -4, 1.11, 'l', 12], [201.2, 371.4, 21, 1.16, 'l', 13],
    [240.3, 234.6, -4, 1.1, 'l', 14], [52.5, 286.7, -24, 1.09, 'l', 15], [189.9, 52.4, 8, 1.18, 'l', 8], [148.0, 124.5, 24, 1.02, 'l', 9],
    [228.0, 120.4, -17, 1.17, 'l', 10], [166.7, 276.5, 19, 1.01, 'o', 22], [85.5, 305.3, -22, 0.95, 'o', 24], [157.7, 313.2, -15, 0.91, 'o', 26],
    [191.2, 115.7, -1, 0.95, 'o', 27], [128.4, 280.7, 10, 0.89, 'o', 28], [66.2, 362.8, -7, 0.93, 'o', 29], [99.6, 134.6, -19, 0.92, 'o', 31],
    [204.2, 220.0, -16, 0.97, 'o', 34], [235.2, 197.8, 22, 0.9, 'o', 35], [117.5, 21.1, -21, 1.01, 'o', 36], [274.0, 190.7, -19, 0.92, 'o', 37],
    [234.2, 157.1, -21, 0.93, 'o', 38], [29.5, 71.4, -26, 0.98, 'o', 28], [270.6, 82.4, 7, 0.99, 'o', 37], [220.5, 332.2, -16, 0.91, 'o', 22],
    [117.9, 173.5, -8, 0.93, 'o', 22], [132.3, 374.0, 17, 0.9, 'o', 24], [211.5, 265.0, 6, 1.01, 'o', 26], [50.4, 232.2, 18, 0.97, 'o', 27],
    [131.8, 75.6, 5, 1.0, 'o', 28],
  ] },
];
const VKEY = 'pb_trick_v';
let vi = 0;
try { vi = (parseInt(localStorage.getItem(VKEY), 10) || 0) % VARIANTS.length; } catch (e) { /* без памяти — с первого */ }
let ITEMS = VARIANTS[vi].items;

const html = document.documentElement;
const RU = html.lang === 'ru';
const VER = html.dataset.v || '';
const ROOT = html.dataset.root || '';
const V = (u) => `${ROOT}${u}${VER ? `?v=${VER}` : ''}`;

const TX = RU ? {
  label: 'Фокус сквозь экран', step: (n) => `Шаг ${n} из 4`, last: 'Последний шаг',
  intro: ['Павел угадает, что вы сделаете', 'На столе — вещи, которые гости прячут первыми, когда в зал входит Павел. Выбирать будете только взглядом.'],
  tap: ['Запомнили? Теперь нажмите на Павла', 'И не сводите глаз со своей вещи.'],
  start: 'Начать', next: 'Дальше →', back: '← Назад', host: 'Павел: нажмите, чтобы он сжал кулак',
  v: {
    glasses: { steps: [
      ['Выберите взглядом любые часы', 'Любые. Никому не говорите какие.'],
      ['Теперь переведите взгляд на ближайший кошелёк', 'Самый близкий к вашим часам.'],
      ['С него — на ближайшее кольцо', 'Самое близкое к кошельку.'],
      ['И последнее — на ближайшую красную вещь', 'Запомните её.'],
    ], reveal: ['Красные очки?', 'Всё остальное исчезло. Осталась только ваша вещь. Представьте, что будет вживую.'] },
    awatch: { steps: [
      ['Выберите взглядом любое кольцо', 'Любое. Никому не говорите какое.'],
      ['Теперь переведите взгляд на ближайший кошелёк', 'Самый близкий к вашему кольцу.'],
      ['С него — на ближайший телефон', 'Самый близкий к кошельку.'],
      ['И последнее — на ближайшие часы', 'Запомните их.'],
    ], reveal: ['Apple Watch?', 'Всё остальное исчезло. Остались только ваши часы. Представьте, что будет вживую.'] },
    wphone: { steps: [
      ['Выберите взглядом любой кошелёк', 'Любой. Никому не говорите какой.'],
      ['Теперь переведите взгляд на ближайшие часы', 'Самые близкие к вашему кошельку.'],
      ['С них — на ближайшее кольцо', 'Самое близкое к часам.'],
      ['И последнее — на ближайший телефон', 'Запомните его.'],
    ], reveal: ['Белый телефон?', 'Всё остальное исчезло. Остался только ваш телефон. Представьте, что будет вживую.'] },
  },
} : {
  label: 'A trick through the screen', step: (n) => `Step ${n} of 4`, last: 'Last step',
  intro: ['Pavel will guess what you are about to do', 'On the table: the things guests hide first when Pavel walks in. You will choose with your eyes only.'],
  tap: ['Got it? Now tap Pavel', 'And keep your eyes on your thing.'],
  start: 'Start', next: 'Next →', back: '← Back', host: 'Pavel: tap to make him clench his fist',
  v: {
    glasses: { steps: [
      ['Pick any watch with your eyes', 'Any one. Don’t tell anyone which.'],
      ['Now move your eyes to the nearest wallet', 'The one closest to your watch.'],
      ['From there, to the nearest ring', 'The one closest to that wallet.'],
      ['And last: the nearest red thing', 'Remember it.'],
    ], reveal: ['The red sunglasses?', 'Everything else is gone. Only your thing is left. Imagine it live.'] },
    awatch: { steps: [
      ['Pick any ring with your eyes', 'Any one. Don’t tell anyone which.'],
      ['Now move your eyes to the nearest wallet', 'The one closest to your ring.'],
      ['From there, to the nearest phone', 'The one closest to that wallet.'],
      ['And last: the nearest watch', 'Remember it.'],
    ], reveal: ['The Apple Watch?', 'Everything else is gone. Only your watch is left. Imagine it live.'] },
    wphone: { steps: [
      ['Pick any wallet with your eyes', 'Any one. Don’t tell anyone which.'],
      ['Now move your eyes to the nearest watch', 'The one closest to your wallet.'],
      ['From there, to the nearest ring', 'The one closest to that watch.'],
      ['And last: the nearest phone', 'Remember it.'],
    ], reveal: ['The white phone?', 'Everything else is gone. Only your phone is left. Imagine it live.'] },
  },
};
const STEP_MS = 7000; // каждый шаг идёт сам (Павел попросил на 30 % медленнее); «Дальше» — для быстрых, «Назад» — если не успели

// ── картинка с прозрачностью из JPEG + маски (маска — яркость) ──
const load = (src) => new Promise((ok, no) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = no; i.src = src; });
async function alphaUrl(color, mask) {
  const [c, m] = await Promise.all([load(V(color)), load(V(mask))]);
  const w = c.naturalWidth, h = c.naturalHeight;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const x = cv.getContext('2d', { willReadFrequently: true });
  x.drawImage(m, 0, 0, w, h); const a = x.getImageData(0, 0, w, h).data;
  x.clearRect(0, 0, w, h); x.drawImage(c, 0, 0); const img = x.getImageData(0, 0, w, h);
  for (let i = 3; i < a.length; i += 4) img.data[i] = a[i - 3];
  x.putImageData(img, 0, 0);
  return new Promise((ok) => cv.toBlob((b) => ok(URL.createObjectURL(b)), 'image/png'));
}

// ── стол ──
function fillBoard(board) {
  board.replaceChildren(...ITEMS.map(([x, y, r, s, k, cell], i) => {
    const el = document.createElement('i');
    el.className = `titem k${k}`;
    el.dataset.i = i;
    el.style.cssText = `left:${(x / 300) * 100}%;top:${(y / 400) * 100}%;--r:${r}deg;--s:${s};background-position:${((cell % 8) / 7) * 100}% ${(Math.floor(cell / 8) / 4) * 100}%`;
    return el;
  }));
}
const boards = [...document.querySelectorAll('.tboard')];
boards.forEach(fillBoard);
let atlasP = null, atlasImg = null;
function atlas() { // карта вещей собирается один раз, когда стол впервые нужен
  if (!atlasP) atlasP = alphaUrl('media/trick_items.jpg', 'media/trick_items_a.jpg').then(async (u) => {
    document.querySelectorAll('.tboard').forEach((b) => b.style.setProperty('--atlas', `url(${u})`));
    html.classList.add('trick-atlas');
    atlasImg = await load(u); // та же карта — для пепла (вещи рисуются на холсте)
  }).catch(() => {});
  return atlasP;
}
// позы — настоящие кадры Павла: p0 — смотрит в камеру, p1 — пальцы сведены, p2 — ладонь к зрителю, p3 — тянется к столу, p4 — руки в стороны
// (все жесты — в левую сторону кадра, поэтому на компьютере Павел стоит справа от стола и показывает на него)
const POSES = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6']; // p5 — пальцы сжимаются, p6 — кулак (те же кадры, лицо вклеено из p2)
const poseUrl = {};
let posesP = null;
function poses() {
  if (!posesP) posesP = Promise.all(POSES.map((p) => alphaUrl(`media/trick_${p}.jpg`, `media/trick_${p}_a.jpg`).then((u) => { poseUrl[p] = u; }).catch(() => {})));
  return posesP;
}
// стол в кадре фильма: картинки начинают собираться, когда страница уже показана
// картинки фокуса начинают собираться, когда страница уже показана (в кадре фильма — Павел, который зовёт на фокус)
if (document.getElementById('trickGo')) {
  const warm = () => setTimeout(() => { atlas(); poses(); }, 1500);
  if (document.readyState === 'complete') warm(); else window.addEventListener('load', warm, { once: true });
}

// ── финал: звук собирается кодом (файл не нужен); играет только после нажатия ──
// напряжение (низкий гул нарастает, пока сжимается кулак) → хруст сминаемой жести → глухой удар
let actx = null;
function crushSound(at, hit) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime + at, th = t + hit, sr = actx.sampleRate;
    const noise = (sec) => {
      const n = Math.floor(sr * sec), b = actx.createBuffer(1, n, sr), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const s = actx.createBufferSource(); s.buffer = b; return s;
    };
    const o = actx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(48, t); o.frequency.exponentialRampToValueAtTime(92, th);
    const g = actx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.28, th - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, th + 0.08);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(th + 0.1);
    const h = noise(hit + 0.1), hf = actx.createBiquadFilter(); hf.type = 'bandpass'; hf.Q.value = 2;
    hf.frequency.setValueAtTime(300, t); hf.frequency.exponentialRampToValueAtTime(1400, th);
    const hg = actx.createGain(); hg.gain.setValueAtTime(0.0001, t); hg.gain.exponentialRampToValueAtTime(0.06, th - 0.05); hg.gain.exponentialRampToValueAtTime(0.0001, th + 0.05);
    h.connect(hf).connect(hg).connect(actx.destination); h.start(t);
    for (let i = 0; i < 9; i++) { // хруст: короткие щелчки жести вразнобой
      const ti = th + Math.random() * 0.28, c = noise(0.05), f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500 + Math.random() * 3000; f.Q.value = 3;
      const cg = actx.createGain(); cg.gain.setValueAtTime(0.0001, ti); cg.gain.exponentialRampToValueAtTime(0.5 + Math.random() * 0.4, ti + 0.004); cg.gain.exponentialRampToValueAtTime(0.0001, ti + 0.045);
      c.connect(f).connect(cg).connect(actx.destination); c.start(ti);
    }
    const k = actx.createOscillator(); k.type = 'sine'; k.frequency.setValueAtTime(120, th + 0.18); k.frequency.exponentialRampToValueAtTime(38, th + 0.6);
    const kg = actx.createGain(); kg.gain.setValueAtTime(0.0001, th + 0.18); kg.gain.exponentialRampToValueAtTime(0.6, th + 0.21); kg.gain.exponentialRampToValueAtTime(0.0001, th + 0.75);
    k.connect(kg).connect(actx.destination); k.start(th + 0.18); k.stop(th + 0.8);
  } catch (e) { /* без звука фокус тоже работает */ }
}

// ── смятие: все вещи, кроме загаданной, дрожат, пока Павел сжимает кулак, и в один миг сминаются, как жестяная банка, и исчезают ──
// Только CSS-анимация по каждой вещи (своя задержка и поворот), холстов не нужно.
function tenseBoard(board) {
  board.querySelectorAll('.titem:not(.kt)').forEach((el) => {
    el.style.setProperty('--dl', `${(Math.random() * 0.09).toFixed(3)}s`);
    el.style.setProperty('--spin', `${Math.round((Math.random() - 0.5) * 90)}deg`);
    el.style.setProperty('--sq', (0.25 + Math.random() * 0.3).toFixed(2));
  });
  board.classList.add('tense');
}
function crushBoard(board) { board.classList.remove('tense'); board.classList.add('crush'); }
function resetBoard(board) {
  board.querySelectorAll('.titem').forEach((el) => { el.classList.remove('chosen'); });
  board.classList.remove('lit', 'tense', 'crush');
}

// ── окно с фокусом ──
const box = document.getElementById('trick');
const go = document.getElementById('trickGo');
function useVariant(i) { // раскладка на всех столах (и в заставке фильма) — того варианта, который будет сыгран
  vi = ((i % VARIANTS.length) + VARIANTS.length) % VARIANTS.length;
  ITEMS = VARIANTS[vi].items;
  boards.forEach(fillBoard);
}
const savedV = () => { try { return (parseInt(localStorage.getItem(VKEY), 10) || 0) % VARIANTS.length; } catch (e) { return vi; } };
const saveV = (i) => { try { localStorage.setItem(VKEY, String(i % VARIANTS.length)); } catch (e) { /* без памяти */ } };
if (box && go) {
  const stepEl = document.getElementById('trickStep'), sayEl = document.getElementById('trickSay'), subEl = document.getElementById('trickSub');
  const nextBtn = document.getElementById('trickNext'), backBtn = document.getElementById('trickBack');
  const againBtn = document.getElementById('trickAgain'), ends = document.getElementById('trickEnds');
  const host = document.getElementById('trickHost'), layers = [...host.querySelectorAll('.pl')], bar = document.getElementById('trickBar');
  const board = document.getElementById('trickBoard'), table = box.querySelector('.trick-table');
  let step = -1, timer = 0, want = 'p0', later = [], front = 0;
  const V2 = () => TX.v[VARIANTS[vi].key];
  const track = (detail) => window.dispatchEvent(new CustomEvent('pb:trick', { detail }));
  const after = (ms, fn) => later.push(setTimeout(fn, ms));
  const clearLater = () => { later.forEach(clearTimeout); later = []; };

  // ведущий: позы сменяются наплывом (две картинки друг над другом), в паузах он чуть «дышит» (CSS)
  function pose(p) {
    want = p;
    const u = poseUrl[p];
    if (!u || host.dataset.pose === p) return;
    host.dataset.pose = p;
    front ^= 1;
    const a = layers[front], b = layers[front ^ 1];
    a.style.setProperty('--img', `url(${u})`);
    a.classList.remove('on'); void a.offsetWidth; a.classList.add('on');
    b.classList.remove('on');
  }
  const say = (label, [a, b]) => {
    stepEl.textContent = label; sayEl.textContent = a; subEl.textContent = b;
    sayEl.classList.remove('pop'); void sayEl.offsetWidth; sayEl.classList.add('pop');
  };
  const tappable = (on) => {
    host.classList.toggle('tap', on);
    if (on) { host.setAttribute('role', 'button'); host.tabIndex = 0; host.setAttribute('aria-label', TX.host); host.removeAttribute('aria-hidden'); }
    else { host.removeAttribute('role'); host.removeAttribute('tabindex'); host.removeAttribute('aria-label'); host.setAttribute('aria-hidden', 'true'); }
  };
  function setStep(n) {
    step = n;
    clearTimeout(timer);
    box.dataset.step = n;
    bar.classList.remove('run'); void bar.offsetWidth;
    backBtn.hidden = !(n >= 2 && n <= 5);
    if (n !== 5) tappable(false);
    if (n === 0) {
      say(TX.label, TX.intro); pose('p0');
      nextBtn.textContent = TX.start; nextBtn.hidden = false; ends.hidden = true;
      return;
    }
    if (n <= 4) {
      say(TX.step(n), V2().steps[n - 1]); pose(['p3', 'p2', 'p3', 'p2'][n - 1]);
      nextBtn.textContent = TX.next; nextBtn.hidden = false;
      bar.style.setProperty('--t', `${STEP_MS}ms`); bar.classList.add('run');
      timer = setTimeout(() => setStep(n + 1), STEP_MS);
      return;
    }
    if (n === 5) { // «нажмите на Павла»: ждём нажатия, сам шаг не уходит
      say(TX.last, TX.tap); pose('p0');
      nextBtn.hidden = true; tappable(true);
      return;
    }
    // финал: Павел медленно тянет к столу раскрытую ладонь и сжимает кулак (ладонь → полусжатая → кулак);
    // пока сжимает, вещи дрожат; в миг, когда кулак сжат, они сминаются и исчезают. Остаётся одна — загаданная.
    backBtn.hidden = true;
    stepEl.textContent = ''; sayEl.textContent = ''; subEl.textContent = '';
    const HIT = 1.35; // с.: когда кулак сжат
    host.classList.add('slow', 'reach'); pose('p2');
    crushSound(0.05, HIT);
    after(250, () => tenseBoard(board));
    after(720, () => pose('p5'));
    after(HIT * 1000 - 80, () => pose('p6'));
    after(HIT * 1000, () => {
      crushBoard(board);
      table.classList.remove('shake'); void table.offsetWidth; table.classList.add('shake');
      try { navigator.vibrate && navigator.vibrate([20, 30, 40]); } catch (e) { /* нет вибрации */ }
    });
    after(HIT * 1000 + 520, () => {
      const t = board.querySelector('.titem.kt');
      board.style.setProperty('--tx', t.style.left); board.style.setProperty('--ty', t.style.top);
      board.classList.add('lit'); t.classList.add('chosen');
    });
    after(HIT * 1000 + 950, () => {
      host.classList.remove('reach'); pose('p3'); say(TX.label, V2().reveal);
      ends.hidden = false; box.classList.add('done');
      saveV(vi + 1); // в следующий раз — другой вариант
      track({ step: 'done', variant: VARIANTS[vi].key });
    });
    after(HIT * 1000 + 1600, () => host.classList.remove('slow'));
  }
  function fire() {
    if (step !== 5) return;
    track({ step: 'fist' });
    setStep(6);
  }
  function reset() {
    clearLater();
    resetBoard(board); box.classList.remove('done'); tappable(false); ends.hidden = true;
    host.classList.remove('slow', 'reach');
  }
  function open() {
    box.hidden = false;
    reset();
    if (savedV() !== vi) useVariant(savedV());
    atlas(); poses().then(() => { if (!box.hidden) { host.dataset.pose = ''; pose(want); } });
    setStep(0);
    nextBtn.focus({ preventScroll: true });
    track({ step: 'open', variant: VARIANTS[vi].key });
  }
  function close() {
    if (box.hidden) return;
    box.hidden = true; clearTimeout(timer); reset();
    go.focus({ preventScroll: true });
  }
  go.addEventListener('click', open);
  document.getElementById('trickClose').addEventListener('click', close);
  nextBtn.addEventListener('click', () => { if (step === 0) track({ step: 'start' }); if (step >= 0 && step <= 4) setStep(step + 1); });
  backBtn.addEventListener('click', () => { if (step >= 2 && step <= 5) setStep(step - 1); });
  backBtn.textContent = TX.back;
  host.addEventListener('click', fire);
  host.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
  againBtn.addEventListener('click', () => { reset(); useVariant(vi + 1); setStep(1); });
  ends.querySelectorAll('a').forEach((a) => a.addEventListener('click', close)); // «Проверить дату» и «Смотреть дальше» ведут по фильму (js/main.js)
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  // пока фокус открыт, фильм под ним стоит
  const side = box.querySelector('.trick-side');
  const hold = (e) => { if (!side.contains(e.target) || side.scrollHeight <= side.clientHeight + 1) e.preventDefault(); };
  box.addEventListener('wheel', hold, { passive: false });
  box.addEventListener('touchmove', hold, { passive: false });
}

// ── фокус с родинкой (на экране заявки): ролик с подписями по времени, в конце вопрос «Есть?» ──
const mole = document.getElementById('mole'), moleGo = document.getElementById('moleGo');
if (mole && moleGo) {
  const vid = document.getElementById('moleVideo'), cap = document.getElementById('moleCap'), ask = document.getElementById('moleAsk');
  const mSay = document.getElementById('moleSay'), mSub = document.getElementById('moleSub');
  const yn = document.getElementById('moleYN'), end = document.getElementById('moleEnd');
  // подписи привязаны к движениям в ролике (секунды)
  const CAPS = RU ? [
    [0, 'Секунду…'], [1.8, 'Видите родинку у меня на руке?'], [4.2, 'Снимаю её…'], [6.0, '…и отправляю вам'], [8.2, 'Посмотрите на свою левую руку. На то же место'],
  ] : [
    [0, 'One second…'], [1.8, 'See this mole on my arm?'], [4.2, 'I take it off…'], [6.0, '…and send it to you'], [8.2, 'Now look at your left arm. Same spot'],
  ];
  const T2 = RU ? {
    q: ['Ну что, есть?', 'На левой руке, там же, где у Павла.'],
    yes: ['Ну как, не в шоке?', 'Вам только что показал фокус сайт. Представьте, что будет вживую.'],
    no: ['Взрослый человек, а в сказки верите? 😉', 'Настоящая магия — только вживую.'],
  } : {
    q: ['So, is it there?', 'On your left arm, in the same spot as Pavel’s.'],
    yes: ['Not shocked yet?', 'A website just did a trick on you. Imagine it live.'],
    no: ['A grown-up who believes in fairy tales? 😉', 'Real magic only happens live.'],
  };
  const track = (detail) => window.dispatchEvent(new CustomEvent('pb:trick', { detail }));
  let shown = -1;
  vid.addEventListener('timeupdate', () => {
    let k = 0;
    CAPS.forEach(([t], i) => { if (vid.currentTime >= t) k = i; });
    if (k !== shown) { shown = k; cap.textContent = CAPS[k][1]; cap.classList.remove('pop'); void cap.offsetWidth; cap.classList.add('pop'); }
  });
  vid.addEventListener('ended', () => {
    mSay.textContent = T2.q[0]; mSub.textContent = T2.q[1];
    ask.hidden = false; yn.hidden = false; end.hidden = true; cap.textContent = '';
  });
  const answer = (yes) => {
    const [a, b] = yes ? T2.yes : T2.no;
    mSay.textContent = a; mSub.textContent = b; yn.hidden = true; end.hidden = false;
    track({ step: yes ? 'mole_yes' : 'mole_no' });
  };
  document.getElementById('moleYes').addEventListener('click', () => answer(true));
  document.getElementById('moleNo').addEventListener('click', () => answer(false));
  function play() {
    ask.hidden = true; shown = -1;
    if (!vid.src) { vid.poster = V(vid.dataset.poster); vid.src = V(vid.dataset.src); }
    vid.currentTime = 0;
    vid.play().catch(() => {});
  }
  moleGo.addEventListener('click', () => { mole.hidden = false; play(); track({ step: 'mole_open' }); });
  document.getElementById('moleAgain').addEventListener('click', play);
  const closeMole = () => { if (mole.hidden) return; mole.hidden = true; vid.pause(); moleGo.focus({ preventScroll: true }); };
  document.getElementById('moleClose').addEventListener('click', closeMole);
  end.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMole));
  mole.addEventListener('click', (e) => { if (e.target === mole) closeMole(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMole(); });
  const holdM = (e) => e.preventDefault();
  mole.addEventListener('wheel', holdM, { passive: false });
  mole.addEventListener('touchmove', holdM, { passive: false });
}
