// Фокус «Ваш ход» (2-я редакция, 27.11.2026): вещи, которые гости прячут, когда входит Павел.
// Взглядом: любые часы → ближайший кошелёк → ближайшее кольцо → ближайшая красная вещь = красная помада.
// Принцип — как в AGT (мячи → слоны → ангелы → красное): стол плотный, часы, кольца и красные вещи — по всему столу,
// кошельки — широкой полосой по середине; из любых часов цепочка приходит к помаде (худшее соотношение расстояний 0.58).
// Раскладку подбирает и проверяет build/trick_items_layout.py. Доска 300×400 условных единиц.
// Картинки: вещи — одна карта 8×5 (media/trick_items.jpg + маска trick_items_a.jpg), ведущий — позы media/trick_p*.jpg + маски.
// JPEG + маска весят в 5 раз меньше PNG; прозрачность браузер собирает сам (canvas).
// [x, y, наклон°, масштаб, вид, клетка карты]; вид: t — помада (предсказание), w — часы, l — кошелёк, r — кольцо, x — красное, o — прочее
const ITEMS = [
  [208.1, 227.9, -19, 1.0, 't', 24], [207.8, 302.4, 2, 1.0, 'w', 0], [147.6, 365.5, 4, 0.93, 'w', 1], [281.1, 71.0, 21, 0.97, 'w', 2],
  [64.7, 326.2, -12, 0.88, 'w', 3], [23.1, 212.1, -2, 1.0, 'w', 4], [83.5, 146.0, 1, 0.94, 'w', 6], [20.1, 83.0, 27, 1.0, 'w', 7],
  [100.5, 64.6, 11, 0.91, 'w', 0], [163.4, 185.4, -26, 0.93, 'w', 1], [127.8, 258.9, -8, 0.87, 'w', 2], [215.1, 122.4, -17, 1.02, 'w', 3],
  [279.9, 309.3, -1, 0.95, 'w', 4], [198.0, 377.3, 19, 1.15, 'l', 8], [181.6, 272.6, 7, 1.11, 'l', 9], [264.2, 238.9, 0, 1.05, 'l', 10],
  [105.1, 321.9, 13, 1.06, 'l', 11], [117.2, 180.2, 11, 1.11, 'l', 14], [273.5, 370.7, 17, 1.13, 'l', 15], [244.1, 290.1, 23, 0.58, 'r', 16],
  [142.3, 223.9, 15, 0.55, 'r', 17], [263.0, 171.1, -26, 0.61, 'r', 18], [52.2, 108.3, 6, 0.54, 'r', 19], [154.4, 61.2, -6, 0.62, 'r', 20],
  [266.1, 26.9, -23, 0.53, 'r', 21], [88.2, 26.3, -12, 0.57, 'r', 16], [252.0, 118.0, 23, 0.55, 'r', 17], [23.9, 36.4, 6, 1.04, 'x', 25],
  [97.8, 379.9, 22, 0.91, 'x', 26], [229.0, 25.5, 16, 0.96, 'x', 27], [142.5, 106.7, -1, 1.03, 'x', 28], [22.0, 161.1, 21, 0.94, 'x', 29],
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
const GENIE = /[?&]trick=genie\b/.test(location.search); // ведущий — джинн из лампы (иначе — коллаж из поз)

const TX = RU ? {
  step: (n) => `Шаг ${n} из 4`,
  intro: ['Павел попробует угадать, что вы сделаете', 'На столе — вещи, которые гости прячут первыми, когда в зал входит Павел. Его предсказание уже в конверте. Выбирать будете только взглядом.'],
  steps: [
    ['Выберите взглядом любые часы', 'Любые. Никому не говорите какие.'],
    ['Теперь переведите взгляд на ближайший кошелёк', 'Самый близкий к вашим часам.'],
    ['С него — на ближайшее кольцо', 'Самое близкое к кошельку.'],
    ['И последнее — на ближайшую красную вещь', 'Запомните её.'],
  ],
  reveal: ['Красная помада?', 'Предсказание лежало в конверте с самого начала. Гости могут спрятать часы и кошельки, но Павел всё равно знает, на чём они остановятся. Вживую — ещё интереснее.'],
  pred: 'Предсказание Павла', card: 'Красная помада', start: 'Начать', next: 'Дальше →',
} : {
  step: (n) => `Step ${n} of 4`,
  intro: ['Pavel will guess what you are about to do', 'On the table: the things guests hide first when Pavel walks in. His prediction is already in the envelope. You will choose with your eyes only.'],
  steps: [
    ['Pick any watch with your eyes', 'Any one. Don’t tell anyone which.'],
    ['Now move your eyes to the nearest wallet', 'The one closest to your watch.'],
    ['From there, to the nearest ring', 'The one closest to that wallet.'],
    ['And last: the nearest red thing', 'Remember it.'],
  ],
  reveal: ['The red lipstick?', 'The prediction was in the envelope from the very start. Guests can hide their watches and wallets, but Pavel still knows where they will stop. Live, it is even better.'],
  pred: 'Pavel’s prediction', card: 'Red lipstick', start: 'Start', next: 'Next →',
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
  board.replaceChildren(...ITEMS.map(([x, y, r, s, k, cell]) => {
    const el = document.createElement('i');
    el.className = `titem k${k}`;
    el.style.cssText = `left:${(x / 300) * 100}%;top:${(y / 400) * 100}%;--r:${r}deg;--s:${s};background-position:${((cell % 8) / 7) * 100}% ${(Math.floor(cell / 8) / 4) * 100}%`;
    return el;
  }));
}
const boards = [...document.querySelectorAll('.tboard')];
boards.forEach(fillBoard);
let atlasP = null;
function atlas() { // карта вещей собирается один раз, когда стол впервые нужен
  if (!atlasP) atlasP = alphaUrl('media/trick_items.jpg', 'media/trick_items_a.jpg').then((u) => {
    document.querySelectorAll('.tboard, .pface').forEach((b) => b.style.setProperty('--atlas', `url(${u})`));
    html.classList.add('trick-atlas');
  }).catch(() => {});
  return atlasP;
}
const POSES = ['p0', 'p1', 'p2', 'p3', 'p4']; // p0 — показывает на зрителя, p1 — «смотрю на тебя», p2 — читает мысли, p3 — с конвертом, p4 — джинн
const poseUrl = {};
let posesP = null;
function poses() {
  if (!posesP) posesP = Promise.all(POSES.map((p) => alphaUrl(`media/trick_${p}.jpg`, `media/trick_${p}_a.jpg`).then((u) => { poseUrl[p] = u; }).catch(() => {})));
  return posesP;
}
// стол в кадре фильма: картинки начинают собираться, когда страница уже показана
const teaser = document.getElementById('trickTeaser');
if (teaser) {
  const warm = () => setTimeout(() => { atlas(); }, 1200);
  if (document.readyState === 'complete') warm(); else window.addEventListener('load', warm, { once: true });
}

// ── окно с фокусом ──
const box = document.getElementById('trick');
const go = document.getElementById('trickGo');
if (box && go) {
  const stepEl = document.getElementById('trickStep'), sayEl = document.getElementById('trickSay'), subEl = document.getElementById('trickSub');
  const nextBtn = document.getElementById('trickNext'), againBtn = document.getElementById('trickAgain'), ends = document.getElementById('trickEnds');
  const pred = document.getElementById('trickPred'), host = document.getElementById('trickHost'), bar = document.getElementById('trickBar');
  document.getElementById('trickCard').textContent = TX.card;
  box.classList.toggle('genie', GENIE);
  let step = -1, timer = 0, want = 'p3';
  const track = (detail) => window.dispatchEvent(new CustomEvent('pb:trick', { detail }));

  // ведущий: поза меняется рывком, как в стоп-моушене (джинн — одна поза, парит)
  function pose(p) {
    if (GENIE && p !== 'p3') p = 'p4';
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
  function setStep(n) {
    step = n;
    clearTimeout(timer);
    box.dataset.step = n;
    bar.classList.remove('run'); void bar.offsetWidth;
    if (n === 0) {
      say(TX.pred, TX.intro); pose('p3');
      nextBtn.textContent = TX.start; nextBtn.hidden = false; ends.hidden = true;
      return;
    }
    if (n <= 4) {
      say(TX.step(n), TX.steps[n - 1]); pose(['p0', 'p1', 'p2', 'p1'][n - 1]);
      nextBtn.textContent = TX.next; nextBtn.hidden = false;
      bar.style.setProperty('--t', `${STEP_MS}ms`); bar.classList.add('run');
      timer = setTimeout(() => setStep(n + 1), STEP_MS);
      return;
    }
    say(TX.pred, TX.reveal); pose('p3');
    nextBtn.hidden = true; ends.hidden = false;
    box.classList.add('done');
    setTimeout(() => pred.classList.add('open'), 450);
    track({ step: 'done' });
  }
  function open() {
    box.hidden = false;
    box.classList.remove('done'); pred.classList.remove('open');
    atlas(); poses().then(() => { if (!box.hidden) pose(want); });
    setStep(0);
    nextBtn.focus({ preventScroll: true });
    track({ step: 'open' });
  }
  function close() {
    if (box.hidden) return;
    box.hidden = true; clearTimeout(timer);
    go.focus({ preventScroll: true });
  }
  go.addEventListener('click', open);
  document.getElementById('trickClose').addEventListener('click', close);
  nextBtn.addEventListener('click', () => { if (step === 0) track({ step: 'start' }); if (step >= 0 && step <= 4) setStep(step + 1); });
  againBtn.addEventListener('click', () => { box.classList.remove('done'); pred.classList.remove('open'); setStep(1); });
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
