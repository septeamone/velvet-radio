// Что записать в хранилище при установке и обновлении расширения. Вызывается из background.js (onInstalled); вынесено отдельно, чтобы это проверял тест.
//  install → полное обучение для нового пользователя;
//  update на другую версию → короткое «Что нового» (ui/tour.js, WHATS_NEW_STEPS): оно покажется один раз при следующем открытии окна.
// Версия, для которой подготовлены карточки «Что нового» (WHATS_NEW_STEPS в ui/tour.js и тексты wn_* в i18n.js). ПРИ КАЖДОМ ВЫПУСКЕ обновить вместе с ними:
// tools/build.py не соберёт пакет, пока эта версия не совпадёт с версией в manifest.json (правило в CLAUDE.md).
export const WHATS_NEW_FOR = '1.7.0';

export function installedPatch(details, version) {
  if (details.reason === 'install') return { tour: { v: 1, step: 0, done: false } };
  if (details.reason === 'update' && details.previousVersion && details.previousVersion !== version && version === WHATS_NEW_FOR) return { whatsNew: { v: version, from: details.previousVersion, step: 0, done: false } };
  return null;
}
