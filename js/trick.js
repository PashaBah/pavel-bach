// Фокус «через экран» (сцена trick): любая пика → ближайший король → ближайшая дама → ближайшая красная карта.
// Раскладка подобрана так, что из любой пики путь приходит к семёрке червей (её Павел «положил рубашкой вверх» заранее).
// Раскладку считает и проверяет tools/trick_layout.py (запас: нужная карта минимум вдвое ближе любой другой того же вида).
// Доска — 300×400 условных единиц, карта — 34×48. Если человек ошибся и встал на другую красную карту, открываем её: фокус всё равно сходится.

const CARDS = [
  [74.7, 362.6, 0.0, 'K', 'c'], [127.1, 314.6, -7.2, 'K', 'c'], [29.4, 376.1, 2.6, 'K', 's'], [131.7, 260.0, 9.1, 'K', 's'], [31.3, 310.4, 1.5, 'Q', 's'],
  [79.5, 250.3, -7.8, 'Q', 'c'], [126.9, 362.6, -7.0, 'Q', 's'], [76.8, 305.6, -3.2, '7', 'h'], [81.2, 151.7, 4.5, 'Q', 's'], [277.1, 314.9, -7.1, 'Q', 's'],
  [16.5, 148.7, -2.1, 'Q', 's'], [165.0, 146.5, 5.4, '3', 'h'], [268.6, 258.9, 1.8, '4', 'h'], [29.4, 87.3, -8.2, '2', 'd'], [214.3, 248.5, 5.1, '10', 'h'],
  [280.8, 148.1, -0.2, '8', 'd'], [216.3, 367.0, 2.4, 'A', 's'], [219.2, 144.3, 9.4, '8', 's'], [227.4, 310.2, 8.6, '4', 's'], [118.2, 33.8, -13.7, '6', 's'],
  [275.6, 35.6, -6.4, '9', 's'], [20.6, 201.3, 10.1, '3', 's'], [166.7, 320.5, -3.1, '2', 's'], [286.0, 86.1, 4.9, 'A', 's'], [174.3, 24.6, -6.3, '4', 's'],
  [215.3, 192.0, -14.0, '5', 's'], [75.3, 19.7, 0.3, '4', 's'], [119.4, 93.1, -2.9, '2', 's'], [284.5, 370.4, 13.7, '9', 'c'], [120.1, 145.2, -7.5, 'A', 'c'],
  [15.6, 261.3, 2.2, '6', 'c'], [169.1, 265.2, -13.0, '3', 'c'], [233.9, 21.1, 12.0, '2', 'c'], [267.2, 208.8, -5.3, '4', 'c'],
].map(([x, y, r, rank, suit], i) => ({ i, x, y, r, rank, suit }));
const TARGET = CARDS.find((c) => c.rank === '7' && c.suit === 'h');

const html = document.documentElement;
const RU = html.lang === 'ru';
const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches; // мышь: «курсор», телефон: «палец»
const SUIT = { s: '♠︎', h: '♥︎', d: '♦︎', c: '♣︎' }; // ︎ — без эмодзи на айфоне
const SHOW = (r) => (RU ? { K: 'К', Q: 'Д', A: 'Т' }[r] || r : r); // в русской колоде король — К, дама — Д, туз — Т

const NAME_RU = { 2: 'двойка', 3: 'тройка', 4: 'четвёрка', 5: 'пятёрка', 6: 'шестёрка', 7: 'семёрка', 8: 'восьмёрка', 9: 'девятка', 10: 'десятка' };
const NAME_EN = { 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten' };
const cardName = (c) => (RU
  ? `${NAME_RU[c.rank][0].toUpperCase()}${NAME_RU[c.rank].slice(1)} ${c.suit === 'h' ? 'червей' : 'бубен'}`
  : `The ${NAME_EN[c.rank]} of ${c.suit === 'h' ? 'Hearts' : 'Diamonds'}`);

const TX = RU ? {
  step: (n) => `Шаг ${n} из 4`,
  intro: ['Павел уже выбрал одну карту', 'Она лежит рубашкой вверх и ждёт конца фокуса. Дальше выбираете только вы.'],
  steps: [
    FINE ? ['Наведите курсор на любую пику ♠︎', 'Любую, какая нравится. Держите курсор на ней.'] : ['Поставьте палец на любую пику ♠︎', 'Любую, какая нравится. Палец не отрывайте.'],
    FINE ? ['Переведите курсор на ближайшего короля', 'Король — карта с буквой К. Самый близкий к вам.'] : ['Не отрывая пальца, переведите его на ближайшего короля', 'Король — карта с буквой К. Самый близкий к пальцу.'],
    ['Теперь — на ближайшую даму', 'Дама — карта с буквой Д. Самая близкая.'],
    ['И последний ход — на ближайшую красную карту', 'Червы ♥︎ или бубны ♦︎. Самая близкая.'],
  ],
  wrong: ['Это не пика. Ищите карту со знаком ♠︎', 'Это не король. Ищите карту с буквой К', 'Это не дама. Ищите карту с буквой Д', 'Эта карта не красная. Нужны червы ♥︎ или бубны ♦︎'],
  reveal: (c) => [`${cardName(c)}?`, 'Эта карта лежала здесь рубашкой вверх с самого начала. Павел знал, где вы остановитесь. На вашем вечере такое будет происходить у гостей прямо в руках.'],
  start: 'Начать', here: 'Я на месте →', again: 'Ещё раз', book: 'Проверить дату', next: 'Смотреть дальше', pred: 'Предсказание Павла', close: 'Закрыть',
} : {
  step: (n) => `Step ${n} of 4`,
  intro: ['Pavel has already chosen one card', 'It is lying face down until the end of the trick. From here on, every choice is yours.'],
  steps: [
    FINE ? ['Point your cursor at any spade ♠︎', 'Any one you like. Keep the cursor on it.'] : ['Put your finger on any spade ♠︎', 'Any one you like. Keep your finger on the screen.'],
    FINE ? ['Move the cursor to the nearest King', 'Kings are the cards marked K. The one closest to you.'] : ['Without lifting your finger, slide it to the nearest King', 'Kings are the cards marked K. The one closest to your finger.'],
    ['Now to the nearest Queen', 'Queens are the cards marked Q. The closest one.'],
    ['Last move: to the nearest red card', 'Hearts ♥︎ or diamonds ♦︎. The closest one.'],
  ],
  wrong: ['That is not a spade. Look for the ♠︎ sign', 'That is not a King. Look for the letter K', 'That is not a Queen. Look for the letter Q', 'That card is not red. You need hearts ♥︎ or diamonds ♦︎'],
  reveal: (c) => [`${cardName(c)}?`, 'This card has been lying here face down from the very start. Pavel knew where you would stop. At your event, this happens right in your guests’ hands.'],
  start: 'Start', here: 'I’m there →', again: 'Again', book: 'Check availability', next: 'Keep watching', pred: 'Pavel’s prediction', close: 'Close',
};

// ── карта на столе ──
function face(c) {
  const court = c.rank === 'K' || c.rank === 'Q';
  const mid = court
    ? `<span class="tcrown" aria-hidden="true"></span><span class="tbig">${SHOW(c.rank)}</span>`
    : `<span class="tpip${c.rank === 'A' ? ' ace' : ''}">${SUIT[c.suit]}</span>`;
  return `<span class="tix">${SHOW(c.rank)}<i>${SUIT[c.suit]}</i></span>${mid}<span class="tix btm">${SHOW(c.rank)}<i>${SUIT[c.suit]}</i></span>`;
}
function cardEl(c) {
  const el = document.createElement('div');
  el.className = `tcard ${c.suit === 'h' || c.suit === 'd' ? 'red' : 'black'}${c.rank === 'K' || c.rank === 'Q' ? ' court' : ''}`;
  el.style.left = `${(c.x / 300) * 100}%`;
  el.style.top = `${(c.y / 400) * 100}%`;
  el.style.setProperty('--r', `${c.r}deg`);
  el.dataset.i = c.i;
  el.innerHTML = face(c);
  return el;
}
function fillBoard(board) {
  board.replaceChildren(...CARDS.map(cardEl));
}

// заставка в самой сцене (фильм): тот же стол, нажимать нельзя
const teaser = document.getElementById('trickTeaser');
if (teaser) fillBoard(teaser);

// ── окно с фокусом ──
const box = document.getElementById('trick');
const go = document.getElementById('trickGo');
if (box && go) {
  const board = document.getElementById('trickBoard');
  const stepEl = document.getElementById('trickStep'), sayEl = document.getElementById('trickSay'), subEl = document.getElementById('trickSub');
  const nextBtn = document.getElementById('trickNext'), againBtn = document.getElementById('trickAgain');
  const ends = document.getElementById('trickEnds');
  const pred = document.getElementById('trickPred'), predFace = document.getElementById('trickFace');
  fillBoard(board);
  const els = [...board.children];
  const want = [(c) => c.suit === 's', (c) => c.rank === 'K', (c) => c.rank === 'Q', (c) => c.suit === 'h' || c.suit === 'd'];
  const HOLD = 650;       // сколько нужно продержаться на нужной карте, чтобы пошёл следующий шаг
  const WRONG = 2200;     // через сколько подсказать, если стоит не на той карте

  let step = -1, on = null, since = 0, timer = 0, last = null, lastFrom = null, hinted = false;

  const say = (n, [a, b], hint = false) => {
    stepEl.textContent = n > 0 ? TX.step(n) : TX.pred;
    sayEl.textContent = a;
    subEl.textContent = b;
    subEl.classList.toggle('hint', hint);
    box.dataset.step = n;
  };
  const track = (detail) => window.dispatchEvent(new CustomEvent('pb:trick', { detail }));

  function setStep(n) {
    step = n; hinted = false;
    since = performance.now();
    if (n === 0) {
      say(0, TX.intro);
      nextBtn.textContent = TX.start; nextBtn.hidden = false;
      ends.hidden = true;
      return;
    }
    if (n <= 4) {
      say(n, TX.steps[n - 1]);
      nextBtn.textContent = TX.here; nextBtn.hidden = false;
      sayEl.classList.remove('pop'); void sayEl.offsetWidth; sayEl.classList.add('pop'); // новая команда — заметно
      return;
    }
    // открытие: если человек стоит на красной карте — это и есть «предсказание», иначе та, к которой ведёт раскладка
    const c = last && want[3](last) ? last : TARGET;
    predFace.innerHTML = face(c);
    predFace.className = `pface tcard ${c.suit === 'h' || c.suit === 'd' ? 'red' : 'black'}`;
    say(5, TX.reveal(c));
    stepEl.textContent = TX.pred;
    nextBtn.hidden = true; ends.hidden = false;
    box.classList.add('done');
    setTimeout(() => pred.classList.add('open'), 350);
    track({ step: 'done', card: `${c.rank}${c.suit}`, forced: c === TARGET });
  }

  // где палец или курсор: карта под ним (или рядом, если чуть промахнулись мимо края)
  function cardAt(x, y) {
    const el = document.elementFromPoint(x, y);
    const t = el && el.closest('.tcard');
    if (t && board.contains(t)) return CARDS[+t.dataset.i];
    return null;
  }
  function onMove(e) {
    if (step < 1 || step > 4) return;
    const c = cardAt(e.clientX, e.clientY);
    if (c !== on) { on = c; since = performance.now(); }
    if (c) last = c;
  }
  function tick() {
    if (box.hidden) return;
    if (step >= 1 && step <= 4) {
      const held = performance.now() - since;
      if (on && want[step - 1](on) && held > HOLD && on !== lastFrom) { lastFrom = on; setStep(step + 1); }
      else if (on && on !== lastFrom && !want[step - 1](on) && held > WRONG && !hinted) { hinted = true; say(step, [TX.steps[step - 1][0], TX.wrong[step - 1]], true); }
    }
    timer = requestAnimationFrame(tick);
  }

  function open() {
    box.hidden = false;
    html.classList.add('trick-open');
    box.classList.remove('done'); pred.classList.remove('open');
    on = null; last = null; lastFrom = null;
    setStep(0);
    cancelAnimationFrame(timer); timer = requestAnimationFrame(tick);
    nextBtn.focus({ preventScroll: true });
    track({ step: 'open' });
  }
  function close() {
    if (box.hidden) return;
    box.hidden = true;
    html.classList.remove('trick-open');
    cancelAnimationFrame(timer);
    go.focus({ preventScroll: true });
  }

  go.addEventListener('click', open);
  document.getElementById('trickClose').addEventListener('click', close);
  nextBtn.addEventListener('click', () => {
    if (step === 0) { setStep(1); track({ step: 'start' }); return; }
    if (step >= 1 && step <= 4) { lastFrom = on; setStep(step + 1); }
  });
  againBtn.addEventListener('click', () => { box.classList.remove('done'); pred.classList.remove('open'); on = null; last = null; lastFrom = null; setStep(1); });
  ends.querySelectorAll('a').forEach((a) => a.addEventListener('click', close)); // «Проверить дату» и «Смотреть дальше» ведут по фильму (js/main.js)
  board.addEventListener('pointermove', onMove);
  board.addEventListener('pointerdown', onMove);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  // пока фокус открыт, фильм под ним стоит: ни колесо, ни палец его не листают
  const side = box.querySelector('.trick-side');
  const hold = (e) => { if (!side.contains(e.target) || side.scrollHeight <= side.clientHeight + 1) e.preventDefault(); };
  box.addEventListener('wheel', hold, { passive: false });
  box.addEventListener('touchmove', hold, { passive: false });
}
