# Сайт Pavel Bach: сборка и запуск на своём домене

## Как устроено

- `src/index.html` — исходник главной с обоими языками (`<span lang="en">…</span><span lang="ru">…</span>`). Руками правится только он.
- `node build/build.mjs` собирает из него отдельные страницы: `/` (EN) и `/ru/` (RU). Каждая страница содержит только свой язык, свои title, description и превью ссылки, canonical, hreflang и JSON-LD. Ещё собираются юридические страницы (`build/pages.mjs`) и 404. Номер выкладки (`version` в `build/config.json`) добавляется ко всем адресам файлов.
- `js/main.js` — фильм. `js/site.js` — метки, WhatsApp с кодом источника, заявка, пиксели, согласие на cookies.
- `functions/` — серверная часть для Cloudflare Pages: `api/lead.js` принимает заявку, `_middleware.js` ставит флаг согласия по стране и `noindex` для не боевых адресов.
- `node build/test-lead.mjs` — проверка приёма заявки без Cloudflare.

## Тестовая версия (сейчас)

GitHub Pages: https://pavelbah96.github.io/pavel-bach/ и `/ru/`. Все страницы закрыты от индексации (`noindex`).

На тестовой версии сервера нет, поэтому форма открывает WhatsApp с готовым текстом, как раньше. Для проверки есть параметры в адресе:

- `?mock=ok` и `?mock=fail` — экран «Заявка отправлена» и ошибка без сервера;
- `?cc=ES` — посетитель из ЕЭЗ (появится плашка cookies);
- `?debug=1` — события в консоли; журнал событий лежит в `PB.events`.

## Запуск на домене (Cloudflare Pages)

1. Домен покупает Паша. Подключить его к Cloudflare.
2. Pages → Create → подключить репозиторий `pavel-bach`. Настройки сборки:
   - Build command: `node build/build.mjs production https://<домен>`
   - Output directory: `dist`
   - Папку `functions/` Cloudflare подхватит сам.
3. Variables and Secrets (только на сервере):
   - `PROD_HOST=<домен без www>`. Пока эта переменная не задана, весь сайт отдаётся с `noindex`.
   - `TG_TOKEN` и `TG_CHAT` — бот в Telegram для уведомлений. Это обязательно: без уведомления заявка не считается принятой.
   - По желанию `RESEND_KEY`, `MAIL_TO`, `MAIL_FROM` — письмо о заявке.
   - По желанию `NOCODB_URL`, `NOCODB_TOKEN`, `NOCODB_TABLE` — если CRM будет NocoDB.
4. Bindings → KV namespace → имя `LEADS`. Это реестр заявок, защита от дублей и ограничение частоты.
5. В `build/config.json` заполнить:
   - `pixels.meta` и `pixels.openai` — ID пикселей;
   - `analytics.cloudflareToken` или `analytics.plausibleDomain`;
   - `analytics.needsConsent: false` — только если юрист подтвердит, что аналитику без cookies можно включать до согласия;
   - поднять `version`.
6. В Meta Events Manager выключить Automatic Advanced Matching. В OpenAI Ads Manager тоже не включать автоматическое сопоставление (это решение по ТЗ).
7. Cloudflare → Rules:
   - Bulk Redirect со второй формы домена (www или без www) и с `http://` на основную, одним 301, **с сохранением строки запроса**: в ней `utm_*` и `oppref`.
   - Always Use HTTPS. HSTS включать после проверки.
8. Web Analytics Cloudflare подключать **токеном** через `config.json`, а не автоматической вставкой. Иначе он будет грузиться до согласия.
9. Боты:
   - Security → Bots: верифицированных ботов не блокировать;
   - проверить, что на рекламных адресах с метками отдаётся 200:
     ```bash
     curl -A "OAI-AdsBot" -I "https://<домен>/?utm_source=chatgpt_ads"
     ```
     ```bash
     curl -A "facebookexternalhit/1.1" -I "https://<домен>/ru/?utm_source=instagram"
     ```
10. Search Console и Bing Webmaster: подтвердить домен и отправить `https://<домен>/sitemap.xml`.
11. После запуска тестовую версию на github.io снять или перенаправить на новый домен.

## Код источника в WhatsApp

Таблица лежит в `build/config.json` → `codes`. Код дописывается в конец готового текста, например `(#I1)`.

| Метка | Код |
| --- | --- |
| `utm_source` | `instagram` → `I`, `facebook` → `F`, `chatgpt_ads` → `A`, `google` → `G`, `agency_<имя>` → `R-<имя>` |
| `utm_content` | `showreel_a` → `1`, `showreel_b` → `2`, `showreel_c` → `3`; неизвестный креатив дописывается словом |
| без меток | `site` на EN-странице, `сайт` на RU-странице |
| только `oppref` (ChatGPT без меток) | `A` |
