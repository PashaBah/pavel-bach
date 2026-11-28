// Фокус «Ваш ход» (3-я редакция, 28.11.2026): вещи, которые гости прячут, когда входит Павел.
// Взглядом: любые часы → ближайший кошелёк → ближайшее кольцо → ближайшая красная вещь = красные очки.
// Принцип — как в AGT (мячи → слоны → ангелы → красное): стол плотный, часы, кольца и красные вещи — по всему столу,
// кошельки — широкой полосой по середине; из любых часов цепочка приходит к красным очкам (худшее соотношение расстояний 0.58).
// Очки, а не помада: на столе есть ещё чёрные и черепаховые очки, так что «красные очки» не бросаются в глаза.
// Финал (по просьбе Павла): никакого конверта. «Нажмите на Павла» → он щёлкает пальцами → всё, кроме очков, рассыпается в пепел.
// Раскладку подбирает и проверяет build/trick_items_layout.py. Доска 300×400 условных единиц.
// Картинки: вещи — одна карта 8×5 (media/trick_items.jpg + маска trick_items_a.jpg), ведущий — позы media/trick_p*.jpg + маски.
// Позы — настоящие кадры Павла из видео с родинкой, переодетые в смокинг (gen/trick/presenter_v2): лицо не перерисовано.
// JPEG + маска весят в 5 раз меньше PNG; прозрачность браузер собирает сам (canvas).
// [x, y, наклон°, масштаб, вид, клетка карты]; вид: t — красные очки (загаданная вещь), w — часы, l — кошелёк, r — кольцо, x — красное, o — прочее
const ITEMS = [
  [208.1, 227.9, -19, 1.0, 't', 28], [207.8, 302.4, 2, 1.0, 'w', 0], [147.6, 365.5, 4, 0.93, 'w', 1], [281.1, 71.0, 21, 0.97, 'w', 2],
  [64.7, 326.2, -12, 0.88, 'w', 3], [23.1, 212.1, -2, 1.0, 'w', 4], [83.5, 146.0, 1, 0.94, 'w', 6], [20.1, 83.0, 27, 1.0, 'w', 7],
  [100.5, 64.6, 11, 0.91, 'w', 0], [163.4, 185.4, -26, 0.93, 'w', 1], [127.8, 258.9, -8, 0.87, 'w', 2], [215.1, 122.4, -17, 1.02, 'w', 3],
  [279.9, 309.3, -1, 0.95, 'w', 4], [198.0, 377.3, 19, 1.15, 'l', 8], [181.6, 272.6, 7, 1.11, 'l', 9], [264.2, 238.9, 0, 1.05, 'l', 10],
  [105.1, 321.9, 13, 1.06, 'l', 11], [117.2, 180.2, 11, 1.11, 'l', 14], [273.5, 370.7, 17, 1.13, 'l', 15], [244.1, 290.1, 23, 0.58, 'r', 16],
  [142.3, 223.9, 15, 0.55, 'r', 17], [263.0, 171.1, -26, 0.61, 'r', 18], [52.2, 108.3, 6, 0.54, 'r', 19], [154.4, 61.2, -6, 0.62, 'r', 20],
  [266.1, 26.9, -23, 0.53, 'r', 21], [88.2, 26.3, -12, 0.57, 'r', 16], [252.0, 118.0, 23, 0.55, 'r', 17], [23.9, 36.4, 6, 1.04, 'x', 25],
  [97.8, 379.9, 22, 0.91, 'x', 26], [229.0, 25.5, 16, 0.96, 'x', 27], [142.5, 106.7, -1, 1.03, 'x', 24], [22.0, 161.1, 21, 0.94, 'x', 29],
  [30.0, 276.7, -23, 0.94, 'x', 31], [135.9, 21.0, 16, 0.8, 'x', 26], [99.9, 225.8, -8, 0.68, 'o', 22], [63.8, 59.8, 25, 0.99, 'o', 32],
  [179.9, 102.8, 19, 0.94, 'o', 33], [192.8, 33.8, 22, 1.02, 'o', 34], [165.5, 315.5, 12, 0.93, 'o', 35], [73.8, 195.0, -28, 1.0, 'o', 36],
  [38.8, 368.1, 27, 0.88, 'o', 37], [233.4, 341.2, -4, 0.98, 'o', 38], [238.2, 202.2, 12, 0.73, 'o', 22], [77.7, 287.6, 25, 0.97, 'o', 32],
  [70.5, 250.6, 9, 0.88, 'o', 33], [126.5, 142.8, -21, 0.94, 'o', 34], [21.2, 316.4, 13, 0.99, 'o', 35], [194.7, 156.4, -1, 0.93, 'o', 36],
  [105.3, 102.2, 3, 0.93, 'o', 37], [231.0, 71.9, 6, 0.88, 'o', 38],
];

const html = document.documentElement;
const RU = html.lang === 'ru';
const VER = html.dataset.v || '';
const ROOT = html.dataset.root || '';
const V = (u) => `${ROOT}${u}${VER ? `?v=${VER}` : ''}`;

const TX = RU ? {
  label: 'Фокус для вас', step: (n) => `Шаг ${n} из 4`, last: 'Последний шаг',
  intro: ['Павел попробует угадать, что вы сделаете', 'На столе — вещи, которые гости прячут первыми, когда в зал входит Павел. Выбирать будете только взглядом.'],
  steps: [
    ['Выберите взглядом любые часы', 'Любые. Никому не говорите какие.'],
    ['Теперь переведите взгляд на ближайший кошелёк', 'Самый близкий к вашим часам.'],
    ['С него — на ближайшее кольцо', 'Самое близкое к кошельку.'],
    ['И последнее — на ближайшую красную вещь', 'Запомните её.'],
  ],
  tap: ['Запомнили? Теперь нажмите на Павла', 'И не сводите глаз со своей вещи.'],
  reveal: ['Красные очки?', 'Всё остальное рассыпалось в пепел. Осталась только ваша вещь. Представьте, что будет вживую.'],
  start: 'Начать', next: 'Дальше →', host: 'Павел: нажмите, чтобы он щёлкнул пальцами',
} : {
  label: 'Your move', step: (n) => `Step ${n} of 4`, last: 'Last step',
  intro: ['Pavel will guess what you are about to do', 'On the table: the things guests hide first when Pavel walks in. You will choose with your eyes only.'],
  steps: [
    ['Pick any watch with your eyes', 'Any one. Don’t tell anyone which.'],
    ['Now move your eyes to the nearest wallet', 'The one closest to your watch.'],
    ['From there, to the nearest ring', 'The one closest to that wallet.'],
    ['And last: the nearest red thing', 'Remember it.'],
  ],
  tap: ['Got it? Now tap Pavel', 'And keep your eyes on your thing.'],
  reveal: ['The red sunglasses?', 'Everything else has turned to ash. Only your thing is left. Imagine it live.'],
  start: 'Start', next: 'Next →', host: 'Pavel: tap to make him snap his fingers',
};
const STEP_MS = 5200; // каждый шаг идёт сам; кнопка «Дальше» — для тех, кто быстрее

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
// позы — настоящие кадры Павла: p0 — смотрит в камеру, p1 — щелчок пальцами, p2 — ладонь к зрителю, p3 — тянется к столу, p4 — руки в стороны
const POSES = ['p0', 'p1', 'p2', 'p3', 'p4'];
const SNAP_AT = [0.31, 0.335]; // где сведены пальцы на позе p1 (доли кадра 570×960)
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

// ── щелчок: звук собирается кодом (файл не нужен); играет только после нажатия ──
let actx = null;
function snapSound(at) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime + at, sr = actx.sampleRate;
    const noise = (sec, shape) => {
      const n = Math.floor(sr * sec), b = actx.createBuffer(1, n, sr), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * shape(i / n);
      const s = actx.createBufferSource(); s.buffer = b; return s;
    };
    // щелчок: короткий треск в высокой полосе + щелчок пониже — так звучат пальцы
    const s1 = noise(0.07, (k) => (1 - k) ** 7);
    const f1 = actx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 2600; f1.Q.value = 1.2;
    const g1 = actx.createGain(); g1.gain.value = 0.9;
    s1.connect(f1).connect(g1).connect(actx.destination); s1.start(t);
    const s2 = noise(0.03, (k) => (1 - k) ** 4);
    const f2 = actx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 900;
    const g2 = actx.createGain(); g2.gain.value = 0.5;
    s2.connect(f2).connect(g2).connect(actx.destination); s2.start(t);
    // пепел: шелест, который нарастает и уходит вверх
    const s3 = noise(2.8, () => 1);
    const f3 = actx.createBiquadFilter(); f3.type = 'bandpass'; f3.Q.value = 0.8;
    f3.frequency.setValueAtTime(700, t + 0.15); f3.frequency.exponentialRampToValueAtTime(3800, t + 2.9);
    const g3 = actx.createGain(); g3.gain.setValueAtTime(0.0001, t + 0.15); g3.gain.exponentialRampToValueAtTime(0.13, t + 0.8); g3.gain.exponentialRampToValueAtTime(0.0001, t + 2.95);
    s3.connect(f3).connect(g3).connect(actx.destination); s3.start(t + 0.15);
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
if (box && go) {
  const stepEl = document.getElementById('trickStep'), sayEl = document.getElementById('trickSay'), subEl = document.getElementById('trickSub');
  const nextBtn = document.getElementById('trickNext'), againBtn = document.getElementById('trickAgain'), ends = document.getElementById('trickEnds');
  const host = document.getElementById('trickHost'), bar = document.getElementById('trickBar'), board = document.getElementById('trickBoard');
  const fx = document.getElementById('trickSnap'), table = box.querySelector('.trick-table');
  let step = -1, timer = 0, want = 'p0', stopAsh = () => {}, later = [], prep = null;
  const track = (detail) => window.dispatchEvent(new CustomEvent('pb:trick', { detail }));
  const after = (ms, fn) => later.push(setTimeout(fn, ms));
  const clearLater = () => { later.forEach(clearTimeout); later = []; };

  // ведущий: поза меняется рывком, как в стоп-моушене
  function pose(p) {
    want = p;
    const u = poseUrl[p];
    if (!u) { host.style.backgroundImage = ''; return; }
    host.style.backgroundImage = `url(${u})`;
    host.dataset.pose = p;
    host.classList.remove('jump'); void host.offsetWidth; host.classList.add('jump');
  }
  const say = (label, [a, b]) => {
    stepEl.textContent = label; sayEl.textContent = a; subEl.textContent = b;
    sayEl.classList.remove('pop'); void sayEl.offsetWidth; sayEl.classList.add('pop');
  };
  // где на экране сведены пальцы (для вспышки и начала волны)
  function snapPoint() {
    const IW = 570, IH = 960, w = host.clientWidth, h = host.clientHeight, cs = getComputedStyle(host);
    let dw, dh;
    if (cs.backgroundSize === 'contain') { const k = Math.min(w / IW, h / IH); dw = IW * k; dh = IH * k; } else { dw = (w * parseFloat(cs.backgroundSize)) / 100; dh = (dw * IH) / IW; }
    const [px, py] = cs.backgroundPosition.split(' ').map((v) => parseFloat(v) / 100);
    const x = (w - dw) * px + SNAP_AT[0] * dw, y = (h - dh) * py + SNAP_AT[1] * dh;
    const r = host.getBoundingClientRect(), lr = box.getBoundingClientRect();
    return { side: [host.offsetLeft + x, host.offsetTop + y], screen: [r.left - lr.left + x, r.top - lr.top + y] };
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
    if (n === 0) {
      say(TX.label, TX.intro); pose('p0');
      nextBtn.textContent = TX.start; nextBtn.hidden = false; ends.hidden = true;
      return;
    }
    if (n <= 4) {
      say(TX.step(n), TX.steps[n - 1]); pose(['p3', 'p2', 'p3', 'p2'][n - 1]);
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
    // щелчок
    tappable(false);
    stepEl.textContent = ''; sayEl.textContent = ''; subEl.textContent = '';
    pose('p1');
    const pt = snapPoint();
    snapSound(0.22);
    after(220, () => {
      fx.style.left = `${pt.side[0]}px`; fx.style.top = `${pt.side[1]}px`;
      fx.classList.remove('go'); void fx.offsetWidth; fx.classList.add('go');
      table.classList.remove('shake'); void table.offsetWidth; table.classList.add('shake');
      try { navigator.vibrate && navigator.vibrate(18); } catch (e) { /* нет вибрации */ }
    });
    after(330, () => {
      stopAsh = ashBoard(board, box, pt.screen, () => {
        const t = board.querySelector('.titem.kt');
        board.style.setProperty('--tx', t.style.left); board.style.setProperty('--ty', t.style.top);
        board.classList.add('lit'); t.classList.add('chosen');
        after(350, () => {
          pose('p4'); say(TX.label, TX.reveal);
          ends.hidden = false; box.classList.add('done');
          track({ step: 'done' });
        });
      }, prep);
    });
  }
  function fire() {
    if (step !== 5) return;
    track({ step: 'snap' });
    setStep(6);
  }
  function reset() {
    clearLater(); stopAsh(); stopAsh = () => {};
    resetBoard(board); box.classList.remove('done'); tappable(false); fx.classList.remove('go'); ends.hidden = true;
  }
  function open() {
    box.hidden = false;
    reset();
    atlas(); poses().then(() => { if (!box.hidden) pose(want); });
    setStep(0);
    nextBtn.focus({ preventScroll: true });
    track({ step: 'open' });
  }
  function close() {
    if (box.hidden) return;
    box.hidden = true; clearTimeout(timer); reset();
    go.focus({ preventScroll: true });
  }
  go.addEventListener('click', open);
  document.getElementById('trickClose').addEventListener('click', close);
  nextBtn.addEventListener('click', () => { if (step === 0) track({ step: 'start' }); if (step >= 0 && step <= 4) setStep(step + 1); });
  host.addEventListener('click', fire);
  host.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
  againBtn.addEventListener('click', () => { reset(); setStep(1); });
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
