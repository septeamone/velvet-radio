// Что записать в хранилище при установке и обновлении расширения. Вызывается из background.js (onInstalled); вынесено отдельно, чтобы это проверял тест.
//  install → полное обучение для нового пользователя;
//  update на другую версию → короткое «Что нового» (ui/tour.js, WHATS_NEW_STEPS): оно покажется один раз при следующем открытии окна.
export function installedPatch(details, version) {
  if (details.reason === 'install') return { tour: { v: 1, step: 0, done: false } };
  if (details.reason === 'update' && details.previousVersion && details.previousVersion !== version) return { whatsNew: { v: version, from: details.previousVersion, step: 0, done: false } };
  return null;
}
