# Политика конфиденциальности Velvet Radio / Privacy Policy

Последнее обновление / Last updated: 2026-10-12 (версия 1.5)

## Русский

Velvet Radio — расширение Chrome для прослушивания интернет-радио. Разработчик **не собирает, не хранит на своих серверах и не продаёт** никакие данные пользователей. У расширения нет серверов, аккаунтов, аналитики, рекламы и трекеров.

**Что хранится на вашем компьютере** (`chrome.storage`, не покидает браузер): тема оформления, язык, вид списка стран, избранные станции, порядок станций, выбранное качество, последняя станция, громкость, настройки (экономия трафика, плавные переходы, запуск при старте Chrome, синхронизация), результаты проверки станций, текущее состояние плеера (только на время сеанса).

**Синхронизация (по вашему желанию).** Если вы включите её в настройках, избранное, порядок станций, качество, тему и язык сохраняются в `chrome.storage.sync`, то есть передаются через ваш аккаунт Chrome на ваши другие компьютеры. Это делает сам Chrome по правилам Google, разработчик к этим данным доступа не имеет. По умолчанию синхронизация выключена.

**Резервная копия.** Кнопки «Сохранить» и «Загрузить» в настройках создают и читают файл на вашем компьютере. Файл никуда не отправляется.

**С кем расширение связывается.** Для воспроизведения браузер подключается к серверам радиостанций (потоки звука), для показа названия песни запрашивает публичные данные у сайтов станций (в списке станций — только пока окно открыто, примерно раз в 45 секунд), а раз в сутки, пока открыто окно, быстро проверяет, отвечают ли потоки ваших избранных станций. Эти серверы, как любой сайт, видят ваш IP-адрес и стандартные технические заголовки браузера. Расширение не отправляет им ваши личные данные, не использует cookies и не передаёт им ничего, кроме самого запроса потока или названия песни.

**Поиск песни.** Только если вы сами нажмёте на название песни, открывается новая вкладка с поиском Google по этому названию. Политика Google действует уже на этой вкладке.

**Ссылки** на Telegram и на страницу сообщения о проблеме на GitHub (кнопка «Сообщить о проблеме» у недоступной станции; в заголовок подставляются название станции и качество) открываются только по вашему клику.

Расширение не выполняет удалённый код: весь код находится внутри пакета.

Вопросы: https://github.com/septeamone/velvet-radio/issues

## English

Velvet Radio is a Chrome extension for listening to internet radio. The developer **does not collect, store on any server, or sell** any user data. The extension has no backend, accounts, analytics, ads or trackers.

**Stored locally in your browser** (`chrome.storage`, never leaves the browser): theme, favourite stations, station order, chosen quality, last station, volume, and the current player state (for the session only).

**Who the extension contacts.** To play audio, the browser connects to the radio stations' streaming servers; to show the current song it requests public data from the stations' websites. Like any website, these servers see your IP address and standard browser headers. The extension sends them no personal data, uses no cookies, and sends nothing beyond the stream or song-title request itself.

**Settings and sync.** Stored locally: theme, language, country-list view, favourites, station order, quality, volume, settings (data saver, smooth transitions, resume on Chrome start, sync) and station-check results. If you turn on **Sync** in the settings, favourites, order, quality, theme and language are stored in `chrome.storage.sync`, i.e. passed through your Chrome account to your other computers by Chrome itself; the developer has no access to them. Sync is off by default. The **Backup** buttons write and read a file on your computer only.

**Song search.** Only if you click the song title, a new tab opens with a Google search for that title. Google's policy applies on that tab.

The The **Telegram link** and the **“Report a problem”** link (opens a GitHub issue prefilled with the station name and quality) open only when you click them. The song titles in the station list are requested only while the popup is open (about every 45 seconds); once a day, while the popup is open, the extension quickly checks whether your favourite stations' streams respond.

The extension runs no remote code: all code is bundled in the package.

Questions: https://github.com/septeamone/velvet-radio/issues
