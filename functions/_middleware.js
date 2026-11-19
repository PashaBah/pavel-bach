// Общая прослойка Cloudflare Pages для всех страниц (ТЗ: «Согласие на cookies», «Стейджинг закрыт от индексации»).
//   • Посетителям из ЕЭЗ, Великобритании и Швейцарии (и тем, чью страну не определить) в HTML вставляется window.NEEDS_CONSENT=1 —
//     тогда js/site.js показывает плашку и не грузит пиксели до согласия. Остальные (в том числе ОАЭ) плашку не видят.
//     Флаг ставится на каждый запрос (страна из request.cf.country), поэтому кеш HTML не перемешивает страны.
//   • Превью-сборки (*.pages.dev) и любой не боевой адрес получают X-Robots-Tag: noindex, чтобы Google не нашёл дубль.
//   • Рекламных и поисковых ботов (OAI-AdsBot, facebookexternalhit и т. д.) прослойка не трогает: они получают ту же страницу, что и человек.
export const EEA = new Set('AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO GB CH'.split(' '));
export const needsConsent = (country) => !country || country === 'XX' || country === 'T1' || EEA.has(country);

export async function onRequest(ctx) {
  const res = await ctx.next();
  const url = new URL(ctx.request.url);
  const type = res.headers.get('content-type') || '';
  const prodHost = ctx.env.PROD_HOST; // боевой домен без www, например pavelbach.com (переменная окружения)
  const isProd = prodHost && (url.hostname === prodHost || url.hostname === `www.${prodHost}`);
  if (!type.includes('text/html')) {
    if (isProd) return res;
    const r = new Response(res.body, res);
    r.headers.set('X-Robots-Tag', 'noindex');
    return r;
  }
  const country = (ctx.request.cf && ctx.request.cf.country) || ctx.request.headers.get('CF-IPCountry') || '';
  const out = needsConsent(country)
    ? new HTMLRewriter().on('script#pb-boot', { element(el) { el.before('<script>window.NEEDS_CONSENT=1</script>', { html: true }); } }).transform(res)
    : new Response(res.body, res);
  out.headers.set('Cache-Control', 'private, no-cache');
  if (!isProd) out.headers.set('X-Robots-Tag', 'noindex');
  return out;
}
