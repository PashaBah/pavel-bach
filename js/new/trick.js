// Фокус «Ваш ход» (4-я редакция, 28.11.2026): вещи, которые гости прячут, когда входит Павел.
// Три варианта по очереди (следующий — при «Ещё раз» и при новом открытии; номер помнит браузер):
//   1) любые часы → ближайший кошелёк → ближайшее кольцо → ближайшая красная вещь = красные очки;
//   2) любое кольцо → кошелёк → телефон → часы = Apple Watch;
//   3) любой кошелёк → часы → кольцо → телефон = белый телефон.
// Загаданная вещь не уникальна (просьба Павла): есть такие же в других цветах и точно такая же в дальнем углу,
// куда цепочка взгляда никак не доходит. Раскладки подбирает и проверяет build/trick_layouts.py (худшее соотношение 0.54–0.64).
// Финал: «нажмите на Павла» → пафосный взмах рукой → всё, кроме загаданной вещи, рассыпается в пепел. Конверта нет.
// Картинки: вещи — одна карта 8×5 (media/trick_items.jpg + маска trick_items_a.jpg), ведущий — позы media/trick_p*.jpg + маски.
// Позы — настоящие кадры Павла из видео с родинкой, переодетые в смокинг (gen/trick/presenter_v2): лицо не перерисовано.
// JPEG + маска весят в 5 раз меньше PNG; прозрачность браузер собирает сам (canvas).
// Вещь: [x, y, наклон°, масштаб, вид, клетка карты]; вид: t — загаданная, w — часы, l — кошелёк, r — кольцо, x — красное, p — телефон, o — прочее
const VARIANTS = [
  { key: 'glasses', items: [
    [133.7, 276.4, 8, 1.06, 't', 28], [276.1, 31.2, 9, 0.93, 'x', 28], [273.8, 234.4, 24, 1.03, 'x', 24], [96.7, 78.9, 19, 1.07, 'x', 25],
    [237.7, 90.9, 8, 1.0, 'x', 26], [268.8, 372.2, 22, 0.94, 'x', 27], [18.6, 374.5, -5, 1.02, 'x', 29], [196.1, 373.8, 28, 0.94, 'x', 31],
    [92.4, 295.6, -17, 0.75, 'r', 16], [110.0, 212.9, -14, 0.76, 'r', 17], [178.4, 279.9, -24, 0.74, 'r', 18], [128.8, 28.4, 6, 0.75, 'r', 19],
    [279.1, 163.7, 4, 0.86, 'r', 20], [64.4, 60.1, 15, 0.74, 'r', 21], [280.9, 335.0, 25, 0.78, 'r', 16], [276.4, 93.2, -15, 0.78, 'r', 17],
    [212.3, 39.4, -8, 0.77, 'r', 18], [37.2, 190.9, -5, 1.15, 'l', 8], [19.8, 294.7, 4, 1.13, 'l', 11], [107.6, 168.9, -12, 1.1, 'l', 14],
    [171.6, 335.0, -26, 1.01, 'l', 9], [70.6, 256.0, 4, 1.08, 'l', 12], [169.1, 186.0, -26, 1.15, 'l', 15], [138.7, 64.7, -22, 1.06, 'w', 0],
    [21.9, 94.9, 20, 1.0, 'w', 1], [206.1, 321.5, 27, 1.03, 'w', 2], [256.0, 194.7, 7, 0.98, 'w', 3], [242.2, 271.8, -3, 1.07, 'w', 4],
    [77.3, 22.3, 20, 0.97, 'w', 6], [142.8, 156.6, -1, 1.03, 'w', 7], [27.0, 335.3, -3, 1.01, 'w', 0], [175.5, 223.2, 14, 1.02, 'w', 1],
    [70.0, 163.5, -5, 1.02, 'w', 2], [135.1, 323.3, -20, 0.99, 'w', 3], [23.8, 247.3, -11, 1.02, 'w', 4], [66.8, 109.0, 17, 0.93, 'o', 22],
    [70.9, 214.9, 20, 0.88, 'o', 32], [56.0, 307.4, 15, 1.03, 'o', 33], [203.6, 113.0, -2, 0.93, 'o', 34], [259.0, 305.1, 26, 1.01, 'o', 35],
    [152.7, 371.5, -27, 0.94, 'o', 36], [61.8, 374.5, -15, 1.01, 'o', 37], [37.3, 24.7, -6, 0.91, 'o', 38], [176.1, 51.9, 12, 1.02, 'o', 35],
    [165.8, 113.4, 9, 0.88, 'o', 36], [204.2, 248.8, -18, 0.99, 'o', 32], [34.2, 141.6, -2, 1.0, 'o', 33], [87.3, 337.7, -16, 0.95, 'o', 34],
    [124.9, 115.1, 18, 0.99, 'o', 37], [212.8, 151.7, 15, 0.96, 'o', 38], [113.9, 378.3, 21, 0.95, 'o', 22], [238.6, 350.9, 20, 0.88, 'o', 32],
    [214.7, 205.8, 6, 0.9, 'o', 33], [251.0, 138.8, -16, 0.94, 'o', 34],
  ] },
  { key: 'awatch', items: [
    [113.9, 288.8, -13, 0.95, 't', 2], [272.6, 22.5, 1, 1.01, 'w', 2], [224.8, 223.2, -25, 1.04, 'w', 0], [251.9, 367.4, 17, 1.02, 'w', 1],
    [183.4, 85.2, -8, 0.96, 'w', 3], [61.9, 27.5, -17, 1.0, 'w', 4], [128.7, 142.8, -26, 1.07, 'w', 6], [272.3, 164.8, 21, 0.93, 'w', 7],
    [120.4, 239.6, 13, 0.9, 'p', 32], [156.1, 307.3, 2, 0.95, 'p', 25], [71.0, 316.8, -18, 0.89, 'p', 33], [146.8, 79.2, -13, 0.9, 'p', 32],
    [236.6, 33.9, 21, 0.93, 'p', 25], [69.4, 66.9, -8, 1.02, 'p', 33], [281.1, 107.1, -27, 1.01, 'p', 32], [207.3, 125.8, -12, 0.99, 'p', 25],
    [189.4, 369.6, -17, 1.13, 'l', 8], [78.6, 269.5, 0, 1.13, 'l', 11], [18.5, 221.4, -17, 1.19, 'l', 14], [30.1, 373.9, -21, 1.15, 'l', 9],
    [255.6, 280.1, 15, 1.06, 'l', 12], [179.4, 227.4, -12, 1.16, 'l', 15], [155.9, 27.7, -1, 0.76, 'r', 16], [106.4, 178.8, -15, 0.85, 'r', 17],
    [33.1, 94.8, -26, 0.77, 'r', 18], [93.0, 375.2, 4, 0.83, 'r', 19], [154.8, 259.3, 19, 0.74, 'r', 20], [106.9, 112.1, -10, 0.75, 'r', 21],
    [245.5, 118.6, -14, 0.76, 'r', 16], [271.1, 60.3, 20, 0.82, 'r', 17], [42.1, 260.6, 27, 0.8, 'r', 18], [32.7, 175.1, 23, 0.83, 'r', 19],
    [262.5, 234.2, 8, 0.82, 'r', 20], [276.8, 330.8, 0, 0.74, 'r', 21], [189.0, 163.8, 23, 0.96, 'o', 22], [198.7, 260.3, 0, 1.02, 'o', 24],
    [189.6, 43.9, -10, 0.95, 'o', 26], [152.9, 180.4, 19, 0.97, 'o', 27], [23.4, 314.7, -20, 0.93, 'o', 28], [225.2, 171.7, -12, 0.88, 'o', 29],
    [18.9, 37.8, 22, 0.94, 'o', 31], [224.5, 84.9, 18, 0.96, 'o', 34], [65.2, 139.1, -14, 0.98, 'o', 35], [117.2, 34.6, -19, 1.02, 'o', 36],
    [107.6, 332.3, 3, 0.99, 'o', 37], [165.0, 130.4, -11, 0.92, 'o', 38], [211.9, 328.6, 5, 0.91, 'o', 28], [141.6, 361.0, 9, 0.91, 'o', 35],
    [71.8, 192.9, 6, 0.97, 'o', 22], [26.1, 136.9, -21, 0.92, 'o', 22], [83.2, 228.9, 16, 0.9, 'o', 24],
  ] },
  { key: 'wphone', items: [
    [101.6, 267.3, 18, 0.9, 't', 33], [279.8, 29.7, 18, 1.02, 'p', 33], [199.0, 131.6, 7, 0.92, 'p', 32], [156.2, 20.4, -25, 1.01, 'p', 25],
    [280.3, 182.6, -2, 0.92, 'p', 32], [251.2, 284.5, -18, 0.91, 'p', 25], [42.2, 56.7, 2, 0.9, 'p', 32], [251.6, 377.0, 23, 1.02, 'p', 25],
    [100.8, 316.1, -10, 0.78, 'r', 16], [153.6, 245.9, -12, 0.8, 'r', 17], [42.5, 230.2, -22, 0.78, 'r', 18], [154.9, 65.0, 12, 0.82, 'r', 19],
    [75.4, 38.3, 17, 0.82, 'r', 20], [266.9, 70.7, -21, 0.82, 'r', 21], [80.8, 113.3, 2, 0.84, 'r', 16], [21.0, 369.7, 14, 0.86, 'r', 17],
    [37.8, 187.5, -5, 0.97, 'w', 0], [196.6, 313.1, -4, 1.05, 'w', 3], [224.0, 224.3, 14, 1.03, 'w', 7], [104.8, 357.0, 2, 0.96, 'w', 2],
    [114.2, 231.0, 1, 1.02, 'w', 6], [35.5, 273.9, -19, 1.01, 'w', 1], [202.6, 68.9, 2, 1.09, 'l', 8], [27.6, 327.6, 24, 1.17, 'l', 9],
    [25.0, 22.2, -2, 1.04, 'l', 10], [115.3, 78.1, -21, 1.03, 'l', 11], [269.3, 142.1, 23, 1.05, 'l', 12], [137.5, 375.9, -17, 1.17, 'l', 13],
    [145.4, 292.4, -24, 1.1, 'l', 14], [25.4, 145.7, -24, 1.07, 'l', 15], [177.6, 168.0, 18, 1.05, 'l', 8], [82.4, 187.8, -25, 1.06, 'l', 9],
    [259.4, 237.6, 3, 1.12, 'l', 10], [259.6, 339.9, 14, 1.08, 'l', 11], [210.2, 369.8, 24, 0.97, 'o', 22], [65.9, 331.1, 16, 0.9, 'o', 24],
    [226.2, 36.3, -3, 0.93, 'o', 26], [149.6, 119.9, -25, 0.9, 'o', 27], [194.9, 248.4, -18, 0.91, 'o', 28], [149.3, 199.9, -6, 0.91, 'o', 29],
    [124.0, 165.8, -9, 0.96, 'o', 31], [112.5, 35.7, -10, 1.02, 'o', 34], [140.0, 335.8, -14, 0.99, 'o', 35], [233.8, 169.9, 3, 0.92, 'o', 36],
    [79.1, 150.5, -6, 1.01, 'o', 37], [172.2, 354.3, -14, 0.97, 'o', 38], [188.1, 207.9, -12, 0.9, 'o', 28], [60.6, 370.1, -11, 0.94, 'o', 37],
    [233.1, 95.9, -6, 0.95, 'o', 22], [29.3, 101.3, 13, 0.93, 'o', 22],
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
  start: 'Начать', next: 'Дальше →', back: '← Назад', host: 'Павел: нажмите, чтобы он взмахнул рукой',
  v: {
    glasses: { steps: [
      ['Выберите взглядом любые часы', 'Любые. Никому не говорите какие.'],
      ['Теперь переведите взгляд на ближайший кошелёк', 'Самый близкий к вашим часам.'],
      ['С него — на ближайшее кольцо', 'Самое близкое к кошельку.'],
      ['И последнее — на ближайшую красную вещь', 'Запомните её.'],
    ], reveal: ['Красные очки?', 'Всё остальное рассыпалось в пепел. Осталась только ваша вещь. Представьте, что будет вживую.'] },
    awatch: { steps: [
      ['Выберите взглядом любое кольцо', 'Любое. Никому не говорите какое.'],
      ['Теперь переведите взгляд на ближайший кошелёк', 'Самый близкий к вашему кольцу.'],
      ['С него — на ближайший телефон', 'Самый близкий к кошельку.'],
      ['И последнее — на ближайшие часы', 'Запомните их.'],
    ], reveal: ['Apple Watch?', 'Всё остальное рассыпалось в пепел. Остались только ваши часы. Представьте, что будет вживую.'] },
    wphone: { steps: [
      ['Выберите взглядом любой кошелёк', 'Любой. Никому не говорите какой.'],
      ['Теперь переведите взгляд на ближайшие часы', 'Самые близкие к вашему кошельку.'],
      ['С них — на ближайшее кольцо', 'Самое близкое к часам.'],
      ['И последнее — на ближайший телефон', 'Запомните его.'],
    ], reveal: ['Белый телефон?', 'Всё остальное рассыпалось в пепел. Остался только ваш телефон. Представьте, что будет вживую.'] },
  },
} : {
  label: 'A trick through the screen', step: (n) => `Step ${n} of 4`, last: 'Last step',
  intro: ['Pavel will guess what you are about to do', 'On the table: the things guests hide first when Pavel walks in. You will choose with your eyes only.'],
  tap: ['Got it? Now tap Pavel', 'And keep your eyes on your thing.'],
  start: 'Start', next: 'Next →', back: '← Back', host: 'Pavel: tap to make him wave his hand',
  v: {
    glasses: { steps: [
      ['Pick any watch with your eyes', 'Any one. Don’t tell anyone which.'],
      ['Now move your eyes to the nearest wallet', 'The one closest to your watch.'],
      ['From there, to the nearest ring', 'The one closest to that wallet.'],
      ['And last: the nearest red thing', 'Remember it.'],
    ], reveal: ['The red sunglasses?', 'Everything else has turned to ash. Only your thing is left. Imagine it live.'] },
    awatch: { steps: [
      ['Pick any ring with your eyes', 'Any one. Don’t tell anyone which.'],
      ['Now move your eyes to the nearest wallet', 'The one closest to your ring.'],
      ['From there, to the nearest phone', 'The one closest to that wallet.'],
      ['And last: the nearest watch', 'Remember it.'],
    ], reveal: ['The Apple Watch?', 'Everything else has turned to ash. Only your watch is left. Imagine it live.'] },
    wphone: { steps: [
      ['Pick any wallet with your eyes', 'Any one. Don’t tell anyone which.'],
      ['Now move your eyes to the nearest watch', 'The one closest to your wallet.'],
      ['From there, to the nearest ring', 'The one closest to that watch.'],
      ['And last: the nearest phone', 'Remember it.'],
    ], reveal: ['The white phone?', 'Everything else has turned to ash. Only your phone is left. Imagine it live.'] },
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
const POSES = ['p0', 'p1', 'p2', 'p3', 'p4'];
const poseUrl = {};
let posesP = null;
function poses() {
  if (!posesP) posesP = Promise.all(POSES.map((p) => alphaUrl(`media/trick_${p}.jpg`, `media/trick_${p}_a.jpg`).then((u) => { poseUrl[p] = u; }).catch(() => {})));
  return posesP;
}
// стол в кадре фильма: картинки начинают собираться, когда страница уже показана
const teaser = document.getElementById('trickTeaser');
if (teaser) {
  const warm = () => setTimeout(() => { atlas(); poses(); }, 1200);
  if (document.readyState === 'complete') warm(); else window.addEventListener('load', warm, { once: true });
}

// ── взмах: звук собирается кодом (файл не нужен); играет только после нажатия ──
let actx = null;
function waveSound(at) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime + at, sr = actx.sampleRate;
    const noise = (sec) => {
      const n = Math.floor(sr * sec), b = actx.createBuffer(1, n, sr), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const s = actx.createBufferSource(); s.buffer = b; return s;
    };
    // свист взмаха: шум, полоса которого быстро уходит вверх и обратно
    const s1 = noise(0.6);
    const f1 = actx.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 1.6;
    f1.frequency.setValueAtTime(260, t); f1.frequency.exponentialRampToValueAtTime(2400, t + 0.22); f1.frequency.exponentialRampToValueAtTime(500, t + 0.55);
    const g1 = actx.createGain(); g1.gain.setValueAtTime(0.0001, t); g1.gain.exponentialRampToValueAtTime(0.75, t + 0.16); g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.58);
    s1.connect(f1).connect(g1).connect(actx.destination); s1.start(t);
    // низкий удар под конец взмаха
    const o = actx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(110, t + 0.18); o.frequency.exponentialRampToValueAtTime(42, t + 0.7);
    const g2 = actx.createGain(); g2.gain.setValueAtTime(0.0001, t + 0.18); g2.gain.exponentialRampToValueAtTime(0.5, t + 0.22); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    o.connect(g2).connect(actx.destination); o.start(t + 0.18); o.stop(t + 0.85);
    // пепел: шелест, который нарастает и уходит вверх
    const s3 = noise(2.8);
    const f3 = actx.createBiquadFilter(); f3.type = 'bandpass'; f3.Q.value = 0.8;
    f3.frequency.setValueAtTime(700, t + 0.3); f3.frequency.exponentialRampToValueAtTime(3800, t + 3.0);
    const g3 = actx.createGain(); g3.gain.setValueAtTime(0.0001, t + 0.3); g3.gain.exponentialRampToValueAtTime(0.13, t + 0.9); g3.gain.exponentialRampToValueAtTime(0.0001, t + 3.05);
    s3.connect(f3).connect(g3).connect(actx.destination); s3.start(t + 0.3);
  } catch (e) { /* без звука фокус тоже работает */ }
}

// ── пепел: каждая вещь (кроме загаданной) — свой холст на месте картинки; крупинки отрываются волной от Павла,
// вспыхивают, остывают до серого пепла и улетают. Пыль — один холст поверх окна.
// Тяжёлая часть (разобрать картинки на крупинки) — prepAsh, пока зритель читает «нажмите на Павла»; в момент щелчка — только запуск.
function prepAsh(board) {
  if (!atlasImg) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const bw = board.clientWidth, bh = board.clientHeight, u = bw / 100;
  const cw = atlasImg.naturalWidth / 8, ch = atlasImg.naturalHeight / 5;
  const Sd = Math.max(2.5, bw / 230) * dpr; // шаг крупинок в точках холста
  const sc = document.createElement('canvas'), sx = sc.getContext('2d', { willReadFrequently: true });
  const items = [...board.querySelectorAll('.titem:not(.kt)')].map((el) => {
    const [x, y, r, , , cell] = ITEMS[+el.dataset.i];
    const w = el.offsetWidth, h = el.offsetHeight, a = (r * Math.PI) / 180, cs = Math.cos(a), sn = Math.sin(a), pad = 3 * u;
    const BW = Math.abs(w * cs) + Math.abs(h * sn) + pad * 2, BH = Math.abs(w * sn) + Math.abs(h * cs) + pad * 2;
    const it = { el, cx: (x / 300) * bw, cy: (y / 400) * bh, BW, BH, W: Math.ceil(BW * dpr), H: Math.ceil(BH * dpr), pts: [],
      draw(g) { g.setTransform(dpr, 0, 0, dpr, (BW / 2) * dpr, (BH / 2) * dpr); g.rotate(a); g.drawImage(atlasImg, (cell % 8) * cw, Math.floor(cell / 8) * ch, cw, ch, -w / 2, -h / 2, w, h); g.setTransform(1, 0, 0, 1, 0, 0); } };
    sc.width = it.W; sc.height = it.H;
    it.draw(sx);
    const px = sx.getImageData(0, 0, it.W, it.H).data;
    for (let yy = Sd / 2; yy < it.H; yy += Sd) {
      for (let xx = Sd / 2; xx < it.W; xx += Sd) {
        const i = ((yy | 0) * it.W + (xx | 0)) * 4;
        if (px[i + 3] >= 10) it.pts.push(xx, yy, px[i], px[i + 1], px[i + 2], px[i + 3]); // и полупрозрачные края: иначе от вещи остаётся контур
      }
    }
    return it;
  });
  return { bw, bh, u, dpr, Sd, items };
}
function ashBoard(board, layer, from, onReveal, prep) {
  const els = [...board.querySelectorAll('.titem:not(.kt)')];
  if (!atlasImg || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach((el) => el.classList.add('gone'));
    const tm = setTimeout(onReveal, 900);
    return () => clearTimeout(tm);
  }
  if (!prep || Math.abs(prep.bw - board.clientWidth) > 1) prep = prepAsh(board); // окно меняли — разбираем заново
  const { bw, u, dpr, Sd } = prep;
  const br = board.getBoundingClientRect(), lr = layer.getBoundingClientRect();
  const ox = br.left - lr.left, oy = br.top - lr.top; // стол внутри слоя пыли
  // откуда идёт волна: от пальцев Павла
  const fx = from[0] - ox, fy = from[1] - oy;
  const maxD = prep.items.reduce((m, it) => Math.max(m, Math.hypot(it.cx - fx, it.cy - fy)), 1);
  const P = []; // крупинки: [x, y, r, g, b, t0, vx, vy, life, ph, вещь, lx, ly (угол клетки), серый, прозрачность]
  const CS = Math.ceil(Sd) + 2; // клетка, которую стираем с картинки вещи: целые точки, иначе остаются тонкие полоски
  const items = prep.items.map((it, k) => {
    const { el, cx, cy, BW, BH } = it;
    const c = document.createElement('canvas'); c.className = 'tcan';
    c.width = it.W; c.height = it.H;
    c.style.cssText = `left:${cx - BW / 2}px;top:${cy - BH / 2}px;width:${BW}px;height:${BH}px`;
    const x = c.getContext('2d');
    it.draw(x); // без тени: тень не стиралась бы вместе с вещью и оставляла тёмный силуэт
    el.after(c); el.style.visibility = 'hidden';
    // волна: чем дальше от Павла, тем позже; внутри вещи — от ближнего к Павлу края к дальнему
    const d = Math.hypot(cx - fx, cy - fy), dirX = (cx - fx) / (d || 1), dirY = (cy - fy) / (d || 1);
    const start = 0.06 + 1.15 * (d / maxD) + Math.random() * 0.16;
    let end = start;
    const half = Math.max(BW, BH) / 2, pts = it.pts;
    for (let j = 0; j < pts.length; j += 6) {
      const hx = cx - BW / 2 + pts[j] / dpr, hy = cy - BH / 2 + pts[j + 1] / dpr;
      const proj = ((hx - cx) * dirX + (hy - cy) * dirY) / half; // −1…1
      const t0 = start + 0.62 * ((proj + 1) / 2) + Math.random() * 0.22;
      if (t0 > end) end = t0;
      const sp = bw * (0.16 + Math.random() * 0.34);
      // серый: у большинства крупинок — пепел, у каждой восьмой — долгая искра
      const spark = Math.random() < 0.13;
      P.push([ox + hx, oy + hy, pts[j + 2], pts[j + 3], pts[j + 4], t0,
        dirX * sp + (Math.random() - 0.5) * 0.1 * bw, dirY * sp * 0.4 - bw * (0.08 + Math.random() * 0.16),
        0.9 + Math.random() * 0.9, Math.random() * 6.28, k, Math.floor(pts[j] - Sd / 2) - 1, Math.floor(pts[j + 1] - Sd / 2) - 1,
        spark ? 1000 : 105 + Math.random() * 85, pts[j + 5] / 255]);
    }
    return { c, x, end, gone: false };
  });
  // пыль
  const dust = document.createElement('canvas'); dust.className = 'tdust';
  // чёткость пыли: на телефоне — в 2 раза мельче точки, на большом экране — 1:1 (не больше ~1,6 млн точек, чтобы не тормозило)
  const ds = Math.max(1, Math.min(2, window.devicePixelRatio || 1, Math.sqrt(1.6e6 / Math.max(1, lr.width * lr.height))));
  const DW = Math.max(1, Math.round(lr.width * ds)), DH = Math.max(1, Math.round(lr.height * ds));
  dust.width = DW; dust.height = DH; layer.appendChild(dust);
  const dx = dust.getContext('2d'), img = dx.createImageData(DW, DH), buf = new Uint32Array(img.data.buffer);
  const rise = bw * 0.12;
  const revealAt = items.reduce((m, it) => Math.max(m, it.end), 0) + 0.25;
  let raf = 0, revealed = false, pb = [DW, DH, -1, -1];
  const t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000;
    if (pb[2] >= pb[0]) buf.fill(0, pb[1] * DW, Math.min(DH, pb[3] + 2) * DW); // стираем прошлый кадр
    let alive = 0, x0 = DW, y0 = DH, x1 = -1, y1 = -1;
    for (let n = 0; n < P.length; n++) {
      const p = P[n], age = t - p[5];
      if (age < 0) { alive++; continue; }
      if (p[13] > 0) { // отрыв: вырезаем крупинку из картинки вещи
        items[p[10]].x.clearRect(p[11], p[12], CS, CS);
        p[13] = -p[13];
      }
      if (age > p[8]) continue;
      alive++;
      const k = age / p[8];
      const go = age + age * age; // ветер подхватывает: сначала медленно, потом быстрее
      const xx = ((p[0] + p[6] * go + Math.sin(age * 5 + p[9]) * u * 1.6 * age) * ds) | 0;
      const yy = ((p[1] + p[7] * go - rise * age * age) * ds) | 0;
      if (xx < 0 || yy < 0 || xx >= DW - 1 || yy >= DH - 1) continue;
      // цвет: своя краска → вспышка углём → серый пепел
      let r, g, b;
      const ash = -p[13];
      if (age < 0.06) { const m = age / 0.06; r = p[2] + (255 - p[2]) * m; g = p[3] + (165 - p[3]) * m; b = p[4] + (70 - p[4]) * m; }
      else if (ash === 1000) { const m = Math.min(1, (age - 0.06) / 1.2); r = 255; g = 165 - 75 * m; b = 70 - 40 * m; } // искра тлеет
      else { const m = Math.min(1, (age - 0.06) / 0.26); r = 255 + (ash - 255) * m; g = 165 + (ash * 0.93 - 165) * m; b = 70 + (ash * 0.88 - 70) * m; }
      const al = (k < 0.4 ? 255 : 255 * (1 - (k - 0.4) / 0.6)) * p[14];
      const v = ((al & 255) << 24 | (b & 255) << 16 | (g & 255) << 8 | (r & 255)) >>> 0;
      const o = yy * DW + xx;
      buf[o] = v; buf[o + 1] = v; buf[o + DW] = v; buf[o + DW + 1] = v;
      if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy;
    }
    // вещь, от которой ничего не осталось, гасим (вместе с тенью)
    for (const it of items) if (!it.gone && t > it.end + 0.05) { it.gone = true; it.c.style.opacity = '0'; }
    // на холст — только та часть, где была или есть пыль
    const ux0 = Math.min(x0, pb[0]), uy0 = Math.min(y0, pb[1]), ux1 = Math.max(x1, pb[2]), uy1 = Math.max(y1, pb[3]);
    if (ux1 >= ux0 && uy1 >= uy0) dx.putImageData(img, 0, 0, ux0, uy0, ux1 - ux0 + 2, uy1 - uy0 + 2);
    pb = x1 >= 0 ? [x0, y0, x1, y1] : [DW, DH, -1, -1];
    if (!revealed && t > revealAt) { revealed = true; onReveal(); }
    if (alive) raf = requestAnimationFrame(frame); else dust.remove();
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); dust.remove(); };
}
function resetBoard(board) {
  board.querySelectorAll('.tcan').forEach((c) => c.remove());
  board.querySelectorAll('.titem').forEach((el) => { el.style.visibility = ''; el.classList.remove('gone', 'chosen'); });
  board.classList.remove('lit');
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
  const board = document.getElementById('trickBoard'), sweep = document.getElementById('trickSweep'), table = box.querySelector('.trick-table');
  let step = -1, timer = 0, want = 'p0', stopAsh = () => {}, later = [], prep = null, front = 0;
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
  // откуда идёт волна пепла: точка Павла, ближайшая к середине стола (на компьютере — его левый край, на телефоне — низ слева)
  function waveFrom() {
    const hr = host.getBoundingClientRect(), br = board.getBoundingClientRect(), lr = box.getBoundingClientRect();
    const cx = br.left + br.width / 2, cy = br.top + br.height / 2;
    const x = Math.min(Math.max(cx, hr.left + hr.width * 0.12), hr.right - hr.width * 0.12);
    const y = Math.min(Math.max(cy, hr.top + hr.height * 0.3), hr.bottom - hr.height * 0.3);
    return [x - lr.left, y - lr.top];
  }
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
      prep = null; after(150, () => { if (step === 5) atlas().then(() => { if (step === 5) prep = prepAsh(board); }); });
      return;
    }
    // пафосный взмах: замах (ладонь вверх) → руки в стороны, по столу проходит полоса света, за ней — волна пепла
    backBtn.hidden = true;
    stepEl.textContent = ''; sayEl.textContent = ''; subEl.textContent = '';
    pose('p2'); host.classList.add('windup');
    waveSound(0.28);
    after(290, () => {
      pose('p4'); host.classList.remove('windup'); host.classList.add('swing');
      sweep.classList.remove('go'); void sweep.offsetWidth; sweep.classList.add('go');
      table.classList.remove('shake'); void table.offsetWidth; table.classList.add('shake');
      try { navigator.vibrate && navigator.vibrate([12, 40, 22]); } catch (e) { /* нет вибрации */ }
    });
    after(400, () => {
      stopAsh = ashBoard(board, box, waveFrom(), () => {
        const t = board.querySelector('.titem.kt');
        board.style.setProperty('--tx', t.style.left); board.style.setProperty('--ty', t.style.top);
        board.classList.add('lit'); t.classList.add('chosen');
        after(350, () => {
          host.classList.remove('swing'); pose('p3'); say(TX.label, V2().reveal);
          ends.hidden = false; box.classList.add('done');
          saveV(vi + 1); // в следующий раз — другой вариант
          track({ step: 'done', variant: VARIANTS[vi].key });
        });
      }, prep);
    });
  }
  function fire() {
    if (step !== 5) return;
    track({ step: 'wave' });
    setStep(6);
  }
  function reset() {
    clearLater(); stopAsh(); stopAsh = () => {};
    resetBoard(board); box.classList.remove('done'); tappable(false); ends.hidden = true;
    host.classList.remove('windup', 'swing'); sweep.classList.remove('go'); prep = null;
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
