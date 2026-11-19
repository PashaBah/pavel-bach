// Проверка приёма заявки без Cloudflare: подменяем хранилище KV и сетевые запросы к Telegram / Resend.
//   node build/test-lead.mjs
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/lead.js';

const kv = () => { const m = new Map(); return { m, get: async (k, t) => (m.has(k) ? (t === 'json' ? JSON.parse(m.get(k)) : m.get(k)) : null), put: async (k, v) => { m.set(k, v); } }; };
let calls = [], tgFail = false;
globalThis.fetch = async (url, init) => {
  calls.push({ url: String(url), body: init && init.body ? JSON.parse(init.body) : null });
  if (String(url).includes('api.telegram.org')) return new Response('{}', { status: tgFail ? 500 : 200 });
  return new Response('{}', { status: 200 });
};
const req = (body, ip = '1.2.3.4') => new Request('https://x.test/api/lead', { method: 'POST', headers: { 'content-type': 'application/json', 'CF-Connecting-IP': ip }, body: JSON.stringify(body) });
const good = { id: 'a1b2c3d4-0000-4000-8000-000000000001', name: 'Anna', contact: '+971 50 123 4567', date: '2026-12-20', city: 'Dubai', type: 'corporate', lang: 'en', ms: 9000,
  src: { utm_source: 'instagram', utm_medium: 'paid_social', utm_campaign: 'corporate_dxb_en', utm_content: 'showreel_a', oppref: 'abc' } };
const env = { LEADS: kv(), TG_TOKEN: 't', TG_CHAT: '1', RESEND_KEY: 'r', MAIL_TO: 'p@example.com', MAIL_FROM: 'site@example.com' };
const run = async (body, e = env, ip) => { calls = []; const r = await onRequestPost({ request: req(body, ip), env: e }); return { status: r.status, ...(await r.json()) }; };

let r = await run(good);
assert.equal(r.status, 200); assert.equal(r.ok, true); assert.equal(r.id, good.id);
const card = JSON.parse(env.LEADS.m.get(`lead:${good.id}`));
assert.equal(card.src.utm_source, 'instagram'); assert.equal(card.src.oppref, 'abc'); assert.equal(card.lang, 'en'); assert.ok(card.notified); assert.equal(card.mail, 'sent');
assert.ok(calls[0].body.text.includes('Anna') && calls[0].body.text.includes('wa.me/971501234567'), 'в Telegram все поля и кликабельный контакт');
console.log('✓ заявка записана, Telegram и письмо ушли; метки и oppref в карточке');

r = await run(good);
assert.equal(r.ok, true); assert.equal(r.repeat, true); assert.equal(calls.length, 0);
console.log('✓ повтор того же id: без дубля и без второго уведомления');

r = await run({ ...good, id: 'b1b2c3d4-0000-4000-8000-000000000002', company: 'spam inc' });
assert.equal(r.ok, true); assert.equal(env.LEADS.m.has('lead:b1b2c3d4-0000-4000-8000-000000000002'), false); assert.equal(calls.length, 0);
r = await run({ ...good, id: 'c1b2c3d4-0000-4000-8000-000000000003', ms: 800 });
assert.equal(env.LEADS.m.has('lead:c1b2c3d4-0000-4000-8000-000000000003'), false);
console.log('✓ ловушка и слишком быстрое заполнение: «принято» для бота, но ничего не записано');

r = await run({ ...good, id: 'd1b2c3d4-0000-4000-8000-000000000004', contact: 'abc', type: 'party', date: '', city: '' }, env, '5.5.5.5');
assert.equal(r.status, 422); assert.deepEqual(r.fields.sort(), ['city', 'contact', 'date', 'type']);
r = await run({ ...good, id: 'e1b2c3d4-0000-4000-8000-000000000005', date: '', dateUnknown: true }, env, '5.5.5.5');
assert.equal(r.ok, true);
console.log('✓ проверка полей; «пока не знаю» вместо даты принимается');

tgFail = true;
const id6 = 'f1b2c3d4-0000-4000-8000-000000000006';
r = await run({ ...good, id: id6 }, env, '6.6.6.6');
assert.equal(r.status, 502); assert.equal(r.error, 'notify_failed');
tgFail = false;
r = await run({ ...good, id: id6 }, env, '6.6.6.6');
assert.equal(r.ok, true); assert.ok(JSON.parse(env.LEADS.m.get(`lead:${id6}`)).notified);
console.log('✓ Telegram не ответил → ошибка (сайт не скажет «отправлено»); повтор с тем же id → уведомление ушло, дубля нет');

for (let k = 0; k < 5; k++) await run({ ...good, id: `rate0000-0000-4000-8000-00000000000${k}` }, env, '9.9.9.9');
r = await run({ ...good, id: 'rate0000-0000-4000-8000-000000000009' }, env, '9.9.9.9');
assert.equal(r.status, 429);
console.log('✓ шестая заявка с одного адреса за 10 минут → 429');

r = await run(good, { TG_TOKEN: 't', TG_CHAT: '1' });
assert.equal(r.status, 502); assert.equal(r.error, 'store_failed');
console.log('✓ нет хранилища → ошибка, а не ложное «отправлено»');
console.log('все проверки прошли');
