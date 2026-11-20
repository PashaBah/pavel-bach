// Приём заявки (Cloudflare Pages Function: POST /api/lead). ТЗ, раздел «P0. Заявка и WhatsApp».
// Заявка считается полученной, только когда она ЗАПИСАНА и Паша получил УВЕДОМЛЕНИЕ в Telegram. Только тогда сайт показывает «Заявка отправлена»
// и шлёт событие Lead / lead_created. Письмо на почту — второй канал: если оно не ушло, заявка всё равно засчитана (Telegram уже пришёл).
//
// Переменные окружения (Cloudflare → Pages → Settings → Variables; ключи только здесь, не в коде страницы):
//   LEADS            — привязка KV-хранилища (реестр заявок по умолчанию; бесплатно). Ключ lead:<id> → карточка заявки.
//   TG_TOKEN, TG_CHAT — бот Telegram и чат Паши (обязательно)
//   RESEND_KEY, MAIL_TO, MAIL_FROM — письмо через Resend (по желанию; адрес отправителя — на домене сайта с SPF/DKIM)
//   NOCODB_URL, NOCODB_TOKEN, NOCODB_TABLE — копия в NocoDB, если Паша выберет его как CRM (по желанию)
// Антиспам: скрытое поле-ловушка, минимальное время заполнения, не больше 5 заявок с одного адреса за 10 минут.
const TYPES = { corporate: 'Corporate / Корпоратив', wedding: 'Wedding / Свадьба', private: 'Private / Частный', other: 'Other / Другое' };
const MIN_MS = 3000; // быстрее человек форму не заполнит
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const clip = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function validate(b) {
  const d = {
    name: clip(b.name, 100), contact: clip(b.contact, 120), date: clip(b.date, 10), dateUnknown: !!b.dateUnknown,
    city: clip(b.city, 100), type: clip(b.type, 20), guests: clip(b.guests, 7).replace(/\D/g, ''), comment: clip(b.comment, 1000),
    lang: b.lang === 'ru' ? 'ru' : 'en', version: clip(b.version, 30) || 'main', page: clip(b.page, 200),
  };
  const bad = [];
  if (!d.name) bad.push('name');
  const isMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.contact), isPhone = d.contact.replace(/\D/g, '').length >= 7 && /^[+\d\s().-]+$/.test(d.contact);
  if (!isMail && !isPhone) bad.push('contact');
  if (!d.dateUnknown && !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) bad.push('date');
  if (!d.city) bad.push('city');
  if (!TYPES[d.type]) bad.push('type');
  const s = b.src && typeof b.src === 'object' ? b.src : {};
  d.src = {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'oppref', 'ref', 'landing', 'at']) if (s[k]) d.src[k] = clip(s[k], 300);
  d.contactKind = isMail ? 'email' : 'phone';
  return { d, bad };
}

async function rateLimited(env, ip) {
  if (!env.LEADS || !ip) return false;
  const key = `rate:${ip}:${Math.floor(Date.now() / 600000)}`;
  const n = Number(await env.LEADS.get(key)) || 0;
  if (n >= 5) return true;
  await env.LEADS.put(key, String(n + 1), { expirationTtl: 900 });
  return false;
}

function telegramText(c) {
  const digits = c.contact.replace(/\D/g, '');
  const contact = c.contactKind === 'phone'
    ? `<a href="https://wa.me/${digits}">${escHtml(c.contact)}</a> (WhatsApp)`
    : escHtml(c.contact);
  const src = c.src.utm_source ? `${c.src.utm_source}${c.src.utm_medium ? ` / ${c.src.utm_medium}` : ''}${c.src.utm_campaign ? ` / ${c.src.utm_campaign}` : ''}${c.src.utm_content ? ` / ${c.src.utm_content}` : ''}`
    : c.src.oppref ? 'ChatGPT Ads (oppref)' : c.src.ref ? `ref: ${c.src.ref}` : 'без меток / no tags';
  return [
    `<b>Новая заявка</b> · ${c.lang.toUpperCase()}`,
    `Имя: ${escHtml(c.name)}`,
    `Контакт: ${contact}`,
    `Дата: ${c.dateUnknown ? 'пока не знает' : c.date}`,
    `Город: ${escHtml(c.city)}`,
    `Событие: ${TYPES[c.type]}`,
    c.guests && `Гостей: ${c.guests}`,
    c.comment && `Комментарий: ${escHtml(c.comment)}`,
    `Источник: ${escHtml(src)}`,
    `Версия: ${escHtml(c.version)} · id ${c.id}`,
  ].filter(Boolean).join('\n');
}

async function notifyTelegram(env, c) {
  if (!env.TG_TOKEN || !env.TG_CHAT) throw new Error('telegram_not_configured');
  const r = await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TG_CHAT, text: telegramText(c), parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  if (!r.ok) {
    // причина отказа от Telegram (например «chat not found», «Unauthorized») — без ключа; видна в ответе формы и в логах Cloudflare
    let why = ''; try { why = String((await r.json()).description || '').slice(0, 120); } catch (e) { /* не JSON */ }
    throw new Error(`telegram_${r.status}${why ? ': ' + why : ''}`);
  }
}
async function notifyMail(env, c) {
  if (!env.RESEND_KEY || !env.MAIL_TO || !env.MAIL_FROM) return 'skipped';
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env.RESEND_KEY}` },
    body: JSON.stringify({
      from: env.MAIL_FROM, to: env.MAIL_TO.split(',').map((s) => s.trim()), subject: `Заявка: ${c.name}, ${c.city}, ${c.dateUnknown ? 'дата не известна' : c.date}`,
      html: telegramText(c).replace(/\n/g, '<br>'), ...(c.contactKind === 'email' ? { reply_to: c.contact } : {}),
    }),
  });
  return r.ok ? 'sent' : `error_${r.status}`;
}
async function copyToNocoDB(env, c) {
  if (!env.NOCODB_URL || !env.NOCODB_TOKEN || !env.NOCODB_TABLE) return 'skipped';
  const r = await fetch(`${env.NOCODB_URL.replace(/\/$/, '')}/api/v2/tables/${env.NOCODB_TABLE}/records`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'xc-token': env.NOCODB_TOKEN },
    body: JSON.stringify({
      lead_id: c.id, created_at: c.createdAt, status: c.status, name: c.name, contact: c.contact, date: c.dateUnknown ? '' : c.date, date_unknown: c.dateUnknown,
      city: c.city, type: c.type, guests: c.guests, comment: c.comment, lang: c.lang, version: c.version,
      utm_source: c.src.utm_source || '', utm_medium: c.src.utm_medium || '', utm_campaign: c.src.utm_campaign || '', utm_content: c.src.utm_content || '', utm_term: c.src.utm_term || '',
      oppref: c.src.oppref || '', referrer: c.src.ref || '', landing: c.src.landing || '',
    }),
  });
  if (!r.ok) throw new Error(`nocodb_${r.status}`);
  return 'sent';
}

export async function onRequestPost({ request, env }) {
  if ((Number(request.headers.get('content-length')) || 0) > 20000) return json({ ok: false, error: 'too_large' }, 413);
  let b;
  try { b = await request.json(); } catch (e) { return json({ ok: false, error: 'bad_json' }, 400); }
  const id = /^[\w-]{8,64}$/.test(String(b.id || '')) ? String(b.id) : crypto.randomUUID();
  // ловушка для ботов и слишком быстрое заполнение: отвечаем «принято», ничего не пишем и не уведомляем
  if (clip(b.company, 100) || (Number(b.ms) || 0) < MIN_MS) return json({ ok: true, id });
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (await rateLimited(env, ip)) return json({ ok: false, error: 'rate' }, 429);
  const { d, bad } = validate(b);
  if (bad.length) return json({ ok: false, error: 'invalid', fields: bad }, 422);

  // повтор той же заявки (двойное нажатие, «Попробовать ещё раз» после ошибки сети): не создаём дубль и не шлём второе уведомление
  const key = `lead:${id}`;
  const old = env.LEADS ? await env.LEADS.get(key, 'json') : null;
  if (old && old.notified) return json({ ok: true, id, repeat: true });
  const card = old || {
    id, createdAt: new Date().toISOString(), status: 'new', ...d,
    country: (request.cf && request.cf.country) || request.headers.get('CF-IPCountry') || '',
  };
  // 1) записать
  try {
    if (env.LEADS) await env.LEADS.put(key, JSON.stringify(card));
    else if (!env.NOCODB_URL) throw new Error('no_storage');
    if (!old) await copyToNocoDB(env, card).catch((e) => { if (!env.LEADS) throw e; card.crm = String(e.message); });
  } catch (e) {
    return json({ ok: false, error: 'store_failed' }, 502);
  }
  // 2) уведомить
  try { await notifyTelegram(env, card); } catch (e) { console.log('notify_failed', e.message); return json({ ok: false, error: 'notify_failed', why: String(e.message).slice(0, 160) }, 502); }
  card.notified = new Date().toISOString();
  card.mail = await notifyMail(env, card).catch(() => 'error');
  if (env.LEADS) await env.LEADS.put(key, JSON.stringify(card));
  return json({ ok: true, id });
}

export const onRequestGet = () => json({ ok: false, error: 'method' }, 405);
