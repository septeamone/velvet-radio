# Chrome Web Store: тексты для страницы расширения (версия 1.5.0)

Загружается вручную в панели разработчика (нужен вход в аккаунт): архив `dist/velvet-radio-1.5.0.zip` (`python tools/build.py`), картинки из `docs/store/ru` и `docs/store/en`.
Имя в магазине берётся из манифеста (`_locales`), краткое описание — тоже. Остальное вставляется в поля страницы.

## Русский

**Краткое описание (до 132 символов, из манифеста):**
Velvet Radio: сотни радиостанций России и 28 стран мира в высоком качестве (до 320 kbps). Играет в фоне, пока открыт Chrome.

**Подробное описание:**

Velvet Radio — красивое радио для Chrome: больше 400 станций России и 28 стран мира, качество до 320 kbps, названия песен и мягкий интерфейс в стиле «жидкого стекла» на русском и английском.

ЧТО НОВОГО В 1.5
• Больше станций со всего мира: Россия и 28 стран (США, Великобритания, Германия, Франция, Италия, Испания, Китай, Япония, Корея, Индия, Бразилия, Украина, Казахстан и другие)
• Вкладка «Страны» с флагами: список или плитки, поиск по-русски и по-английски
• Русский и английский интерфейс
• Фильтр по жанрам, управление с клавиатуры, названия песен прямо в списке
• Плавные переходы между станциями
• Настройки: экономия трафика, ожидание перед стартом, запуск при старте Chrome, синхронизация и резервная копия избранного
• Улучшена стабильность потока

ВОЗМОЖНОСТИ
• Играет в фоне: закрыли окно, а музыка идёт
• Если поток упал, расширение само переключится на резервный и понизит качество
• Названия песен, визуализатор звука, индикатор состояния потока
• Избранное, перетаскивание станций, горячие клавиши и мультимедиа-кнопки
• Светлая и тёмная тема

ПРИВАТНОСТЬ
Никакой аналитики, рекламы и слежки. Расширение ничего не отправляет разработчику. Весь код внутри расширения, новых разрешений нет.

Неофициальный проект. Названия и логотипы станций принадлежат их владельцам. Часть станций вещает из России и может быть недоступна за рубежом.

**Обоснование разрешений:**
• `offscreen` — воспроизведение радио в фоне, пока окно расширения закрыто (скрытый документ с аудио).
• `storage` — избранное, порядок станций, качество, тема, язык и настройки; по желанию пользователя синхронизация через аккаунт Chrome.
• Доступ к сайтам радиостанций (`host_permissions`) — только чтобы показывать название текущей песни и открывать потоки HLS у этих станций. Список не менялся с версии 1.0.0.

## English

**Short description (from the manifest):**
Velvet Radio: hundreds of radio stations from Russia and 28 countries in high quality (up to 320 kbps). Plays in the background.

**Description:**

Velvet Radio is a refined radio player for Chrome: 400+ stations from Russia and 28 countries, quality up to 320 kbps, live song titles and a soft liquid-glass interface in Russian and English.

WHAT'S NEW IN 1.5
• More stations from around the world: Russia and 28 countries (USA, UK, Germany, France, Italy, Spain, China, Japan, Korea, India, Brazil, Ukraine, Kazakhstan and more)
• Countries tab with flags: list or tiles, search in English or Russian
• Russian and English interface
• Genre filter, keyboard control, song titles right in the list
• Smooth transitions between stations
• Settings: data saver, wait before playback, resume on Chrome start, sync and backup of favorites
• Improved stream stability

FEATURES
• Plays in the background: close the window and the music keeps going
• If a stream drops, the extension switches to a backup and lowers the quality automatically
• Song titles, sound visualizer, stream status indicator
• Favorites, drag-and-drop ordering, keyboard shortcuts and media keys
• Light and dark theme

PRIVACY
No analytics, ads or tracking. The extension sends nothing to the developer. All code is inside the extension; no new permissions.

Unofficial project. Station names and logos belong to their owners. Some stations broadcast from Russia and may be unavailable abroad.

**Permission justification:**
• `offscreen` — plays the radio in the background while the popup is closed (hidden audio document).
• `storage` — favorites, station order, quality, theme, language and settings; optional sync through the Chrome account if the user turns it on.
• Access to the stations' websites (`host_permissions`) — only to show the current song title and to open HLS streams of those stations. The list is unchanged since version 1.0.0.

## Картинки / Images
- Скриншоты 1280×800: `ru/store-1..5.png`, `en/store-1..5.png`
- Малая плитка 440×280: `ru/small-promo-440x280.png`, `en/small-promo-440x280.png`
- «Что нового в 1.5» (для поста, баннера и GitHub Release): `ru/whats-new-1.5.png`, `en/whats-new-1.5.png`
