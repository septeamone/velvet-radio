// Помощники для описания станций (общие для всех файлов стран).
// qualities — по возрастанию kbps; в каждом urls[] — основной поток и резервные зеркала того же качества.
// kbps — заявленный битрейт (замер не нужен, см. ADDING-STATIONS.md). hide: true — качество не показывается кнопкой,
// а используется только как «страховка» при падении потока.
export const q = (kbps, ...urls) => ({ kbps, urls });
export const hid = (kbps, ...urls) => ({ kbps, urls, hide: true });
export const hls = (kbps, url) => ({ kbps, urls: [url], hls: true });
export const HR = (host, path) => [`https://${host}/${path}`, `http://${host}/${path}`]; // один сервер по https и по http
