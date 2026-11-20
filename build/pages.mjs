// Тексты отдельных страниц: политика конфиденциальности, политика cookies, правовая информация (LSSI), страница 404.
// ЧЕРНОВИКИ: перечислено только то, что стоит или встанет на сайт по ТЗ. Места, которые решает Паша, помечены <mark>[…]</mark>.
// Перед запуском — показать гестору или юристу (ТЗ, раздел «Юридические страницы»).
const TODO = (s) => `<mark>[${s}]</mark>`;
const UPDATED = { en: '19 November 2026 (draft)', ru: '19 ноября 2026 (черновик)' };

export const PAGES = {
  privacy: {
    en: {
      title: 'Privacy policy — Pavel Bach',
      h1: 'Privacy policy',
      description: 'How the Pavel Bach website handles the details you send in a booking request.',
      body: `
<p class="pg-date">Last updated: ${UPDATED.en}</p>
<h2>Who is responsible</h2>
<p>Pavel Bakhadov (Pavel Bach), Z2328844F, Bergnes de las Casas 3, ${TODO('postcode, city')}, e-mail pavelbah.magic@gmail.com.</p>
<h2>What we collect</h2>
<p>When you send a booking request: your name, a contact (WhatsApp, phone or e-mail), the event date or “not sure yet”, the city and country, the type of event and, if you add them, the number of guests and a comment.</p>
<p>Together with the request we store: the page language, the ad tags in the link you came from (utm_source, utm_medium, utm_campaign, utm_content, utm_term), the ChatGPT ad identifier (oppref) if the link had one, the website you came from, the time, and a random request number.</p>
<h2>Why</h2>
<p>To reply to your request and arrange the performance — steps taken at your request before a contract (GDPR, Art. 6(1)(b)). The ad tags show which advertising brings requests (legitimate interest, Art. 6(1)(f)). Advertising measurement in your browser runs only with your consent where the law requires it (Art. 6(1)(a)); see the <a href="../cookies/">cookie policy</a>.</p>
<h2>Where the data goes</h2>
<ul>
<li>Requests are stored in the request register of the site’s hosting (Cloudflare) and in a private Telegram chat.</li>
<li>Pavel gets a notification in Telegram (Telegram Messenger).</li>
<li>The site is hosted by Cloudflare.</li>
<li>Advertising measurement: Meta Pixel (Meta Platforms Ireland Ltd.) and the ChatGPT Ads Measurement Pixel (OpenAI). They receive no name, phone number, e-mail or text from your request — only the visit, a tap on WhatsApp or Telegram, or the fact that a request was recorded, with its random number.</li>
<li>If you write on WhatsApp or Telegram, their own privacy terms apply.</li>
</ul>
<h2>How long</h2>
<p>Requests are kept for ${TODO('period, e.g. 24 months after the last contact')}, unless a booking requires longer storage by law (invoices, taxes). Cookies — see the <a href="../cookies/">cookie policy</a>.</p>
<h2>Transfers outside the EU</h2>
<p>Meta, OpenAI, Cloudflare and Telegram may process data outside the European Economic Area. Such transfers rely on the EU–US Data Privacy Framework where the provider is certified, or on the European Commission’s Standard Contractual Clauses.</p>
<h2>Your rights</h2>
<p>You can ask for access to your data, its correction or deletion, restrict or object to its use, ask for a copy, and withdraw consent at any time (“Cookie settings” at the bottom of the main page). Write to pavelbah.magic@gmail.com. You can also complain to the Spanish Data Protection Agency (AEPD, aepd.es).</p>`,
    },
    ru: {
      title: 'Политика конфиденциальности — Павел Бах',
      h1: 'Политика конфиденциальности',
      description: 'Как сайт Павла Баха обращается с данными из заявки на выступление.',
      body: `
<p class="pg-date">Обновлено: ${UPDATED.ru}</p>
<h2>Кто отвечает за данные</h2>
<p>Pavel Bakhadov (Pavel Bach), Z2328844F, Bergnes de las Casas 3, ${TODO('индекс, город')}, e-mail pavelbah.magic@gmail.com.</p>
<h2>Что мы собираем</h2>
<p>Когда вы отправляете заявку: имя, контакт (WhatsApp, телефон или e-mail), дату события или «пока не знаю», город и страну, тип события и, если вы их указали, число гостей и комментарий.</p>
<p>Вместе с заявкой сохраняются: язык страницы, рекламные метки ссылки, по которой вы пришли (utm_source, utm_medium, utm_campaign, utm_content, utm_term), идентификатор рекламы в ChatGPT (oppref), если он был в ссылке, сайт, с которого вы перешли, время и случайный номер заявки.</p>
<h2>Зачем</h2>
<p>Чтобы ответить на заявку и договориться о выступлении — действия по вашему запросу до заключения договора (GDPR, ст. 6(1)(b)). Метки показывают, какая реклама приносит заявки (законный интерес, ст. 6(1)(f)). Измерение рекламы в браузере работает только с вашего согласия там, где этого требует закон (ст. 6(1)(a)); см. <a href="../cookies/">политику cookies</a>.</p>
<h2>Куда уходят данные</h2>
<ul>
<li>Заявки хранятся в реестре заявок хостинга сайта (Cloudflare) и в закрытом чате Telegram.</li>
<li>Павел получает уведомление в Telegram (Telegram Messenger).</li>
<li>Сайт размещён на Cloudflare.</li>
<li>Измерение рекламы: пиксель Meta (Meta Platforms Ireland Ltd.) и пиксель ChatGPT Ads (OpenAI). Они не получают имя, телефон, e-mail и текст заявки — только факт посещения, нажатия на WhatsApp или Telegram или записи заявки с её случайным номером.</li>
<li>Если вы пишете в WhatsApp или Telegram, действуют их собственные правила конфиденциальности.</li>
</ul>
<h2>Сколько хранятся</h2>
<p>Заявки хранятся ${TODO('срок, например 24 месяца после последнего контакта')}, если бронь не требует хранить дольше по закону (счета, налоги). Cookies — см. <a href="../cookies/">политику cookies</a>.</p>
<h2>Передача за пределы ЕС</h2>
<p>Meta, OpenAI, Cloudflare и Telegram могут обрабатывать данные за пределами Европейской экономической зоны. Такая передача опирается на EU–US Data Privacy Framework, если поставщик в нём сертифицирован, или на стандартные договорные условия Еврокомиссии.</p>
<h2>Ваши права</h2>
<p>Вы можете запросить доступ к своим данным, исправление или удаление, ограничить их использование или возразить против него, получить копию и в любой момент отозвать согласие («Настройки cookies» внизу главной страницы). Пишите на pavelbah.magic@gmail.com. Жалобу можно подать в испанское агентство по защите данных (AEPD, aepd.es).</p>`,
    },
  },
  cookies: {
    en: {
      title: 'Cookie policy — Pavel Bach',
      h1: 'Cookie policy',
      description: 'Which cookies and similar storage the Pavel Bach website uses, and how to change your choice.',
      body: `
<p class="pg-date">Last updated: ${UPDATED.en}</p>
<p>Visitors from the European Economic Area, the UK and Switzerland see a banner and choose: advertising and analytics files load only after “Accept” or the matching switch in “Settings”. If you say no, the site, the booking form and WhatsApp work the same. You can change your choice any time with “Cookie settings” at the bottom of the main page.</p>
<div class="pg-table"><table>
<thead><tr><th>Name</th><th>Whose</th><th>What for</th><th>How long</th><th>Type</th></tr></thead>
<tbody>
<tr><td>pb_consent <small>(local storage)</small></td><td>this site</td><td>remembers your cookie choice</td><td>12 months</td><td>necessary</td></tr>
<tr><td>pb_src, pb_lead_try, pb_leads, pb_pos <small>(session storage)</small></td><td>this site</td><td>keeps the ad tags of this visit for the booking form, prevents a request from being sent twice, keeps your place when you switch language</td><td>until you close the tab</td><td>necessary</td></tr>
<tr><td>_fbp, _fbc</td><td>Meta (Meta Pixel)</td><td>measuring Meta / Instagram ads</td><td>90 days</td><td>advertising</td></tr>
<tr><td>__oppref</td><td>OpenAI (ChatGPT Ads Measurement Pixel)</td><td>the ChatGPT ad you came from</td><td>30 days</td><td>advertising</td></tr>
<tr><td>__obref</td><td>OpenAI (ChatGPT Ads Measurement Pixel)</td><td>random browser reference for ad measurement</td><td>365 days</td><td>advertising</td></tr>
</tbody></table></div>
<p>Visit statistics: Cloudflare Web Analytics — works without cookies.</p>
<p>Videos: the showreels play from Cloudinary. The America’s Got Talent video plays from YouTube in privacy-enhanced mode and loads only after you press play; YouTube may then set its own cookies.</p>
<p>You can also delete cookies in your browser settings. More on how your data is handled — in the <a href="../privacy/">privacy policy</a>.</p>`,
    },
    ru: {
      title: 'Политика cookies — Павел Бах',
      h1: 'Политика cookies',
      description: 'Какие cookies и похожие хранилища использует сайт Павла Баха и как изменить свой выбор.',
      body: `
<p class="pg-date">Обновлено: ${UPDATED.ru}</p>
<p>Посетители из Европейской экономической зоны, Великобритании и Швейцарии видят плашку и выбирают сами: рекламные и аналитические файлы загружаются только после «Принять» или нужного переключателя в «Настроить». При отказе сайт, форма заявки и WhatsApp работают так же. Изменить выбор можно в любой момент — «Настройки cookies» внизу главной страницы.</p>
<div class="pg-table"><table>
<thead><tr><th>Название</th><th>Чьё</th><th>Зачем</th><th>Срок</th><th>Тип</th></tr></thead>
<tbody>
<tr><td>pb_consent <small>(local storage)</small></td><td>этот сайт</td><td>помнит ваш выбор по cookies</td><td>12 месяцев</td><td>необходимое</td></tr>
<tr><td>pb_src, pb_lead_try, pb_leads, pb_pos <small>(session storage)</small></td><td>этот сайт</td><td>хранит рекламные метки визита для заявки, не даёт отправить заявку дважды, сохраняет место при смене языка</td><td>до закрытия вкладки</td><td>необходимое</td></tr>
<tr><td>_fbp, _fbc</td><td>Meta (пиксель Meta)</td><td>измерение рекламы в Meta / Instagram</td><td>90 дней</td><td>реклама</td></tr>
<tr><td>__oppref</td><td>OpenAI (пиксель ChatGPT Ads)</td><td>из какой рекламы в ChatGPT вы пришли</td><td>30 дней</td><td>реклама</td></tr>
<tr><td>__obref</td><td>OpenAI (пиксель ChatGPT Ads)</td><td>случайный номер браузера для измерения рекламы</td><td>365 дней</td><td>реклама</td></tr>
</tbody></table></div>
<p>Статистика посещений: Cloudflare Web Analytics — работает без cookies.</p>
<p>Видео: шоурилы идут с Cloudinary. Ролик America’s Got Talent идёт с YouTube в режиме повышенной конфиденциальности и загружается только после нажатия на play; после этого YouTube может поставить свои cookies.</p>
<p>Cookies можно удалить и в настройках браузера. Подробнее о данных — в <a href="../privacy/">политике конфиденциальности</a>.</p>`,
    },
  },
  legal: {
    en: {
      title: 'Legal notice — Pavel Bach',
      h1: 'Legal notice',
      description: 'Owner of the Pavel Bach website (Spanish LSSI).',
      body: `
<p class="pg-date">Last updated: ${UPDATED.en}</p>
<p>Information under Spanish Law 34/2002 on information society services (LSSI-CE).</p>
<ul>
<li>Owner: Pavel Bakhadov (stage name Pavel Bach), self-employed (autónomo)</li>
<li>NIF: Z2328844F</li>
<li>Address: Bergnes de las Casas 3, ${TODO('postcode, city')}</li>
<li>E-mail: pavelbah.magic@gmail.com</li>
<li>Activity: magic and illusion performances for private and corporate events</li>
</ul>
<h2>Content</h2>
<p>Videos, photos and texts on this site belong to Pavel Bach or are used with permission. Client logos belong to their owners and are shown as references of past events. Copying the content without permission is not allowed.</p>
<h2>Personal data</h2>
<p>See the <a href="../privacy/">privacy policy</a> and the <a href="../cookies/">cookie policy</a>.</p>
<h2>Applicable law</h2>
<p>Spanish law applies.</p>`,
    },
    ru: {
      title: 'Правовая информация — Павел Бах',
      h1: 'Правовая информация',
      description: 'Владелец сайта Павла Баха (испанский закон LSSI).',
      body: `
<p class="pg-date">Обновлено: ${UPDATED.ru}</p>
<p>Сведения по испанскому закону 34/2002 об услугах информационного общества (LSSI-CE).</p>
<ul>
<li>Владелец: Pavel Bakhadov (сценическое имя Pavel Bach), автономо</li>
<li>NIF: Z2328844F</li>
<li>Адрес: Bergnes de las Casas 3, ${TODO('индекс, город')}</li>
<li>E-mail: pavelbah.magic@gmail.com</li>
<li>Деятельность: выступления с фокусами и иллюзиями на частных и корпоративных событиях</li>
</ul>
<h2>Материалы</h2>
<p>Видео, фотографии и тексты на сайте принадлежат Павлу Баху или используются с разрешения. Логотипы клиентов принадлежат их владельцам и показаны как прошедшие события. Копировать материалы без разрешения нельзя.</p>
<h2>Персональные данные</h2>
<p>См. <a href="../privacy/">политику конфиденциальности</a> и <a href="../cookies/">политику cookies</a>.</p>
<h2>Применимое право</h2>
<p>Применяется право Испании.</p>`,
    },
  },
};

export const NOT_FOUND = {
  en: { title: 'Page not found — Pavel Bach', h1: 'This page vanished.', text: 'Even for a magician, that wasn’t the plan. The site is one page — start from the beginning.', home: 'Home', wa: 'WhatsApp' },
  ru: { title: 'Страница не найдена — Павел Бах', h1: 'Эта страница исчезла.', text: 'Даже для фокусника это не входило в план. Сайт — одна страница, начните сначала.', home: 'На главную', wa: 'WhatsApp' },
};
