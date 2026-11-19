// 30-я редакция (ТЗ «маркетинг, трекинг, скорость»): всё, что связывает сайт с рекламой и заявками. Фильм (js/main.js) этот файл не трогает.
//   • метки: utm_* и oppref запоминаются при первом заходе (sessionStorage) и уходят в заявку; переключатель языка их сохраняет;
//   • WhatsApp: готовый текст на языке страницы + код источника в конце, например «(#I1)»; номер на странице не показывается;
//   • заявка: своя форма → POST на серверную функцию (functions/api/lead.js); «Заявка отправлена» — только после ответа «записано»;
//     пока сервера нет (github.io), форма открывает WhatsApp с готовым сообщением, как раньше;
//   • пиксели Meta и OpenAI и лёгкая аналитика: файлы грузятся после отрисовки страницы (load → requestIdleCallback ≤ 3 с или первое касание),
//     для ЕЭЗ, Великобритании и Швейцарии — только после согласия; события — только по фактам (клик в мессенджер, заявка записана).
// Настройки (номер, ID пикселей, адрес сервера, таблица кодов источника) — в build/config.json, сборка кладёт их в window.PB_CFG.
const CFG = window.PB_CFG || {};
const html = document.documentElement;
const LANG = html.dataset.lang === 'ru' ? 'ru' : 'en';
const ROOT = html.dataset.root || '';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const T = (en, ru) => (LANG === 'ru' ? ru : en);
const store = (kind) => { try { return window[kind]; } catch (e) { return null; } };
const SS = store('sessionStorage'), LS = store('localStorage');
const get = (st, k) => { try { return JSON.parse(st.getItem(k)); } catch (e) { return null; } };
const put = (st, k, v) => { try { st.setItem(k, JSON.stringify(v)); } catch (e) { /* хранилище закрыто — работаем без него */ } };
const params = new URLSearchParams(location.search);
const DEBUG = CFG.staging && params.has('debug');

// ── события: одна точка, откуда они расходятся по пикселям и аналитике. PB.events — журнал для проверки (в консоли: PB.events) ──
const PB = (window.PB = window.PB || {});
PB.events = PB.events || [];

// ── 1. метки ──────────────────────────────────────────────────────────────
const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'oppref'];
function captureSource() {
  const fromUrl = {};
  for (const k of KEYS) { const v = params.get(k); if (v) fromUrl[k] = v.slice(0, 200); }
  let src = SS ? get(SS, 'pb_src') : null;
  // первый заход в этой сессии — запоминаем; новые метки в адресе (другая реклама) — тоже, они точнее
  if (!src || Object.keys(fromUrl).length) {
    let ref = '';
    try { const r = document.referrer && new URL(document.referrer); if (r && r.host !== location.host) ref = r.origin + r.pathname; } catch (e) { /* пустой реферер */ }
    src = { ...fromUrl, ref: (src && src.ref) || ref, landing: location.pathname, at: new Date().toISOString() };
    if (SS) put(SS, 'pb_src', src);
  }
  return src;
}
const SRC = captureSource();

// код источника для текста WhatsApp: utm_source → буква, utm_content → номер креатива (таблица в build/config.json); без меток — «сайт»
function sourceCode() {
  const C = CFG.codes || {};
  const s = (SRC.utm_source || '').toLowerCase(), c = (SRC.utm_content || '').toLowerCase();
  let code = '';
  if (s.startsWith('agency_')) code = `${C.agencyPrefix || 'R'}-${s.slice(7, 23)}`;
  else if (s) code = (C.source && C.source[s]) || s.replace(/[^a-z0-9]/g, '').slice(0, 3).toUpperCase();
  else if (SRC.oppref) code = (C.source && C.source.chatgpt_ads) || 'A';
  if (code && c) code += (C.content && C.content[c]) || `-${c.replace(/[^a-z0-9_]/g, '').slice(0, 16)}`;
  return code || ((C.none && C.none[LANG]) || T('site', 'сайт'));
}
const CODE = sourceCode();
const WA = String(CFG.whatsapp || '').replace(/\D/g, '');
const waLink = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
const waHello = () => `${T("Hi Pavel! I'd like to check availability for my event.", 'Здравствуйте, Павел! Хочу узнать, свободна ли дата для моего события.')} (#${CODE})`;
$$('[data-wa]').forEach((a) => { a.href = waLink(waHello()); });

// ── 2. согласие и пиксели ────────────────────────────────────────────────
// window.NEEDS_CONSENT ставит сервер по стране посетителя (functions/_middleware.js); на github.io проверяется адресом ?cc=ES (см. загрузчик в <head>)
const NEEDS = !!window.NEEDS_CONSENT;
const YEAR = 365 * 864e5;
let choice = LS ? get(LS, 'pb_consent') : null; // { ads, analytics, t } — выбор живёт 12 месяцев
if (choice && !(Date.now() - choice.t < YEAR)) choice = null;
// без выбора: вне ЕЭЗ — можно; в ЕЭЗ — нельзя, кроме аналитики без cookies, если юрист подтвердит (analyticsNeedsConsent: false в config.json)
const allowed = (kind) => (choice ? !!choice[kind] : !NEEDS || (kind === 'analytics' && CFG.analyticsNeedsConsent === false));
const adsOK = () => allowed('ads');
const anOK = () => allowed('analytics');

function inject(src, attrs = {}) {
  const s = document.createElement('script');
  s.async = true; s.src = src;
  for (const k in attrs) s.setAttribute(k, attrs[k]);
  document.head.appendChild(s);
}
const loaded = { ads: false, analytics: false };
function loadTrackers() {
  if (adsOK() && !loaded.ads) {
    loaded.ads = true;
    if (CFG.meta && window.fbq) inject('https://connect.facebook.net/en_US/fbevents.js');
    if (CFG.openai && window.oaiq) inject('https://bzrcdn.openai.com/sdk/oaiq.min.js');
  }
  if (anOK() && !loaded.analytics) {
    loaded.analytics = true;
    if (CFG.cfAnalytics) inject('https://static.cloudflareinsights.com/beacon.min.js', { defer: '', 'data-cf-beacon': JSON.stringify({ token: CFG.cfAnalytics }) });
    if (CFG.plausible) {
      window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
      inject('https://plausible.io/js/script.js', { defer: '', 'data-domain': CFG.plausible });
    }
  }
}
// как в ТЗ: после события load — в свободную минуту (не позже 3 с) или при первом касании, что раньше
let laterSet = false;
function later() {
  if (laterSet) return; laterSet = true;
  const go = () => setTimeout(loadTrackers, 0);
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 3000 }) : setTimeout(go, 2000));
  if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle, { once: true });
  for (const t of ['pointerdown', 'keydown']) window.addEventListener(t, go, { once: true, passive: true });
}

function applyChoice(c) {
  const was = choice;
  choice = { ads: !!c.ads, analytics: !!c.analytics, t: Date.now() };
  if (LS) put(LS, 'pb_consent', choice);
  if (window.fbq && CFG.meta) window.fbq('consent', choice.ads ? 'grant' : 'revoke');
  if (window.oaiq && CFG.openai) window.oaiq('consent', choice.ads); // false — пиксель OpenAI сам стирает свои cookies
  if (!choice.ads && was && was.ads) { // отозвали согласие: стираем cookies Meta
    for (const n of ['_fbp', '_fbc']) document.cookie = `${n}=; Max-Age=0; path=/; domain=${location.hostname.replace(/^www\./, '')}`;
  }
  log('consent', { ...choice });
  if (choice.ads || choice.analytics) later();
}

const banner = $('#consent');
function showBanner(withOpts) {
  if (!banner) return;
  $('#cAds', banner).checked = choice ? choice.ads : false;
  $('#cAnalytics', banner).checked = choice ? choice.analytics : false;
  setOpts(withOpts);
  banner.hidden = false;
}
function setOpts(on) {
  $('#consentOpts', banner).hidden = !on;
  $('.consent-save', banner).hidden = !on;
  banner.classList.toggle('opts', on);
}
if (banner) {
  banner.addEventListener('click', (e) => {
    const b = e.target.closest('[data-consent]');
    if (!b) return;
    const a = b.dataset.consent;
    if (a === 'settings') { setOpts(true); return; }
    if (a === 'accept') applyChoice({ ads: true, analytics: true });
    else if (a === 'reject') applyChoice({ ads: false, analytics: false });
    else if (a === 'save') applyChoice({ ads: $('#cAds', banner).checked, analytics: $('#cAnalytics', banner).checked });
    banner.hidden = true;
  });
}
$$('[data-cookie-settings]').forEach((b) => b.addEventListener('click', () => showBanner(true)));
if (NEEDS && !choice) showBanner(false); // посетитель из ЕЭЗ, выбора ещё нет
if (allowed('ads') || allowed('analytics')) later();

// ── 3. события ───────────────────────────────────────────────────────────
function log(name, data) {
  PB.events.push({ name, ...data, t: Math.round(performance.now()) });
  if (DEBUG) console.log('[PB]', name, data || '');
}
const fb = (...a) => { if (CFG.meta && window.fbq && adsOK()) window.fbq(...a); };
const oai = (...a) => { if (CFG.openai && window.oaiq && adsOK()) window.oaiq(...a); };
const an = (name, props) => { if (CFG.plausible && window.plausible && anOK()) window.plausible(name, { props }); };
PB.track = function track(name, data = {}) {
  log(name, data);
  if (name === 'messenger_click') { // интерес, не заявка
    fb('track', 'Contact');
    oai('measure', 'custom', { type: 'custom' }, { custom_event_name: 'messenger_click' });
    an('messenger_click', { channel: data.channel });
  } else if (name === 'lead') { // только после ответа сервера «записано»; тот же id, что в карточке заявки (для склейки с серверной отправкой)
    fb('track', 'Lead', {}, { eventID: data.id });
    oai('measure', 'lead_created', { type: 'customer_action' }, { event_id: data.id });
    an('lead_created', { lang: LANG });
  } else if (name === 'lead_error') {
    an('lead_error', { reason: data.reason });
  } else if (name === 'video') {
    an('video_open', { id: String(data.id || '').slice(0, 60) });
  }
};
// клик в WhatsApp или Telegram — где бы ни стояла ссылка
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href*="wa.me/"], a[href*="t.me/"]');
  if (a) PB.track('messenger_click', { channel: a.href.includes('wa.me') ? 'whatsapp' : 'telegram' });
}, true);
window.addEventListener('pb:video', (e) => PB.track('video', e.detail || {}));

// ── 4. переключатель языка: та же страница другого языка, с метками из адреса и тем же местом в фильме ──
const toggle = $('#langToggle');
if (toggle) {
  const base = toggle.getAttribute('href');
  const keep = () => { const q = new URLSearchParams(location.search); q.delete('shot'); const s = q.toString(); return base + (s ? `?${s}` : ''); };
  toggle.href = keep();
  toggle.addEventListener('click', () => { toggle.href = keep(); if (SS) put(SS, 'pb_pos', { y: window.scrollY, w: innerWidth }); });
}
const pos = SS ? get(SS, 'pb_pos') : null;
if (pos) {
  try { SS.removeItem('pb_pos'); } catch (e) { /* нет хранилища */ }
  if (pos.w === innerWidth && pos.y > 0) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(() => window.scrollTo(0, pos.y)));
  }
}

// ── 5. «FAQ» в меню: на телефоне меню собирается из кнопок (js/main.js), ссылку добавляем сами ──
const faqLink = $('.menu a.menu-faq'), sheet = $('#menuSheet');
if (faqLink && sheet) sheet.appendChild(faqLink.cloneNode(true));
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href="#faq"]');
  if (!a) return;
  e.preventDefault();
  if (sheet) { sheet.hidden = true; const mb = $('#menuBtn'); if (mb) mb.setAttribute('aria-expanded', 'false'); }
  $('#faq').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ── 6. заявка ────────────────────────────────────────────────────────────
const form = $('#bookForm');
const note = $('#formNote');
const sent = $('#bookSent');
const ENDPOINT = CFG.endpoint || '';
const MOCK = CFG.staging ? params.get('mock') : null; // ?mock=ok | ?mock=fail — показать экран успеха и ошибку без сервера
const TYPES = { corporate: T('Corporate event', 'Корпоратив'), wedding: T('Wedding', 'Свадьба'), private: T('Private party', 'Частный праздник'), other: T('Other', 'Другое') };
const MSG = {
  missing: (f) => T(`Please fill in: ${f}.`, `Заполните, пожалуйста: ${f}.`),
  contact: T('Please check the contact: a phone number with the country code, or an e-mail.', 'Проверьте контакт: телефон с кодом страны или e-mail.'),
  date: T('Please pick a date, or tick “not sure yet”.', 'Выберите дату или отметьте «пока не знаю».'),
  sending: T('Sending…', 'Отправляю…'),
  error: T('The request didn’t go through, your details are still here. Try again, or ', 'Заявка не ушла, данные остались в форме. Попробуйте ещё раз или '),
  errorWa: T('message Pavel on WhatsApp', 'напишите Павлу в WhatsApp'),
  rate: T('Too many attempts in a row. Please wait a minute, or ', 'Слишком много попыток подряд. Подождите минуту или '),
  wa: T('Opening WhatsApp with your message ready — just press send.', 'Открываю WhatsApp с готовым сообщением — останется нажать «Отправить».'),
  retry: T('Try again', 'Попробовать ещё раз'),
};
const LABELS = { name: T('name', 'имя'), contact: T('contact', 'контакт'), date: T('date', 'дату'), city: T('city', 'город'), type: T('type of event', 'тип события') };
const t0 = Date.now(); // время на странице до отправки: бот отправляет форму сразу, человек — нет (сервер не принимает быстрее 3 с)
let busy = false;
function values() {
  const f = form.elements, v = (n) => (f[n] ? String(f[n].value || '').trim() : '');
  return {
    name: v('name'), contact: v('contact'), date: f.dateUnknown.checked ? '' : v('date'), dateUnknown: f.dateUnknown.checked,
    city: v('city'), type: v('type'), guests: v('guests'), comment: v('comment'), company: v('company'),
  };
}
const okContact = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c) || (c.replace(/\D/g, '').length >= 7 && /^[+\d\s().-]+$/.test(c));
function validate(d) {
  const bad = [];
  for (const k of ['name', 'contact', 'city', 'type']) if (!d[k]) bad.push(k);
  if (!d.date && !d.dateUnknown) bad.push('date');
  for (const el of $$('input, select, textarea', form)) el.removeAttribute('aria-invalid');
  for (const k of bad) { const el = form.elements[k]; if (el) el.setAttribute('aria-invalid', 'true'); }
  if (bad.length) return bad.length === 1 && bad[0] === 'date' ? MSG.date : MSG.missing(bad.map((k) => LABELS[k]).join(', '));
  if (!okContact(d.contact)) { form.elements.contact.setAttribute('aria-invalid', 'true'); return MSG.contact; }
  return '';
}
function say(text, bad = false, withWa = false, data = null) {
  note.replaceChildren(text);
  note.classList.toggle('bad', bad);
  if (withWa) {
    const a = document.createElement('a');
    a.href = waLink(data ? summary(data) : waHello()); a.target = '_blank'; a.rel = 'noopener';
    a.textContent = MSG.errorWa;
    note.append(a, '.');
  }
}
function summary(d) { // текст для WhatsApp из полей формы (запасной путь и режим без сервера)
  const L = (en, ru, v) => (v ? `${T(en, ru)}: ${v}` : '');
  return [
    T('Hi Pavel! I would like to check availability for my event.', 'Здравствуйте, Павел! Хочу узнать, свободна ли дата.'),
    L('Name', 'Имя', d.name), L('Contact', 'Контакт', d.contact),
    L('Date', 'Дата', d.dateUnknown ? T('not sure yet', 'пока не знаю') : d.date), L('City', 'Город', d.city),
    L('Event', 'Событие', TYPES[d.type] || d.type), L('Guests', 'Гостей', d.guests), L('Comment', 'Комментарий', d.comment),
    `(#${CODE})`,
  ].filter(Boolean).join('\n');
}
function leadId() { // один id на заявку: повторная попытка после ошибки — тот же id, сервер не создаст дубль
  let id = SS ? get(SS, 'pb_lead_try') : null;
  if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`); if (SS) put(SS, 'pb_lead_try', id); }
  return id;
}
async function post(payload) {
  if (MOCK === 'ok') { await new Promise((r) => setTimeout(r, 600)); return { ok: true, id: payload.id }; }
  if (MOCK === 'fail') { await new Promise((r) => setTimeout(r, 600)); throw Object.assign(new Error('mock'), { reason: 'mock' }); }
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 15000);
  try {
    const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), signal: ctl.signal });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) return j;
    throw Object.assign(new Error(j.error || `http_${r.status}`), { reason: j.error || `http_${r.status}`, rate: r.status === 429 });
  } catch (e) {
    if (!e.reason) e.reason = e.name === 'AbortError' ? 'timeout' : 'network';
    throw e;
  } finally { clearTimeout(timer); }
}
if (form) {
  const dateBox = $('.fdate', form);
  form.elements.dateUnknown.addEventListener('change', (e) => {
    dateBox.classList.toggle('off', e.target.checked);
    if (e.target.checked) form.elements.date.removeAttribute('aria-invalid');
  });
  // дата не в прошлом
  try { form.elements.date.min = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10); } catch (e) { /* без ограничения */ }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return; // защита от двойного нажатия
    const d = values();
    const problem = validate(d);
    if (problem) { say(problem, true); const first = $('[aria-invalid="true"]', form); if (first) first.focus(); return; }
    // сервера ещё нет (github.io) — как раньше: WhatsApp с готовым сообщением. Это клик в мессенджер, а не заявка: Lead не отправляется.
    if (!ENDPOINT && !MOCK) {
      PB.track('messenger_click', { channel: 'whatsapp', from: 'form' });
      window.open(waLink(summary(d)), '_blank', 'noopener');
      say(MSG.wa);
      return;
    }
    const btn = $('button[type="submit"]', form);
    busy = true; btn.setAttribute('aria-busy', 'true'); btn.disabled = true;
    say(MSG.sending);
    const id = leadId();
    const payload = {
      id, ...d, lang: LANG, version: html.dataset.site || 'main', page: location.pathname,
      src: SRC, ms: Date.now() - t0,
    };
    try {
      const res = await post(payload);
      const done = (SS && get(SS, 'pb_leads')) || [];
      if (!done.includes(res.id || id)) { PB.track('lead', { id: res.id || id }); if (SS) put(SS, 'pb_leads', [...done, res.id || id]); }
      try { SS && SS.removeItem('pb_lead_try'); } catch (err) { /* нет хранилища */ }
      form.hidden = true; say(''); $('.form-legal').hidden = true;
      $$('[data-wa]', sent).forEach((a) => { a.href = waLink(waHello()); });
      sent.hidden = false; sent.focus({ preventScroll: true });
    } catch (err) {
      PB.track('lead_error', { reason: err.reason });
      say(err.rate ? MSG.rate : MSG.error, true, true, d);
      btn.querySelectorAll('span').forEach((s) => { s.textContent = s.lang === 'ru' ? 'Попробовать ещё раз' : 'Try again'; });
    } finally {
      busy = false; btn.removeAttribute('aria-busy'); btn.disabled = false;
    }
  });
}
