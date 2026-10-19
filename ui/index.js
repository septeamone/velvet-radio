// Подключает анимированные элементы нового вида (React Bits, перенос на чистый JS/CSS) к окну. Вызывается один раз, только при data-ui="new".
// Каждый элемент подключается отдельно: сбой одного не должен ломать остальные.
import { initWarmTooltip } from './warm-tooltip.js';
import { initGlideSelect } from './glide-select.js';
import { initAnimatedList } from './animated-list.js';
import { initRubberAll } from './rubber.js';
import { initSquish } from './squish.js';
import { initPulseHeart } from './pulse-heart.js';
import { elasticSlider } from './elastic-slider.js';
import { numberFlow } from './number-flow.js';
import { statusMark } from './status-mark.js';
import { shinyText } from './shiny-text.js';
import { initSpotlight } from './spotlight.js';
import { initBorderGlow } from './border-glow.js';
import { initEchoText } from './echo-text.js';
import { initSplitFlap } from './split-flap.js';
import { initChromaGrid } from './chroma-grid.js';
import { initStarBorder } from './star-border.js';
import { initGlareHover } from './glare-hover.js';
import { initBlurText } from './blur-text.js';
import { initPixelSwap } from './pixel-swap.js';
import { initCallChip } from './call-chip.js';
import { initTextType } from './text-type.js';
import { initDecryptedText } from './decrypted-text.js';
import { initAnimatedContent } from './animated-content.js';
import { initCheckMark } from './check-mark.js';

export function mountNewUi($, list) {
  const mount = (f, ...args) => { try { return f(...args); } catch (e) { console.error('ui:', f.name, e); } };
  mount(initWarmTooltip);                                   // до applyStatic(): системные подсказки не должны успеть появиться
  mount(initGlideSelect, { button: $('#gbtn'), panel: $('#gpanel') });
  mount(initAnimatedList, list);
  mount(initBorderGlow, list);
  mount(initRubberAll); mount(initSquish); mount(initPulseHeart);
  mount(elasticSlider, $('#vol'), { icon: $('.vol svg') });
  mount(numberFlow, $('.vol'), $('#vol'));
  mount(statusMark, $('#dot'));
  mount(shinyText, $('#nowSub'));
  mount(initSpotlight, $('.player'));
  mount(initEchoText, $('.brand'), { avoid: $('.tools') });
  // второй раунд
  mount(initChromaGrid, list);                              // плитки стран: .list.tiles .crow
  mount(initStarBorder, $('.play'));                        // кнопка play: бегущая звезда, пока .player.loading
  mount(initGlareHover, $('.play'));
  mount(initBlurText, $('#nowTitle'));                      // название станции в плеере
  mount(initPixelSwap, $('#nowLogo'));                      // логотип станции в плеере
  mount(initCallChip, $('.player'));                        // ошибка потока: .player.err
  mount(initTextType, $('#q'));                             // placeholder поиска
  mount(initDecryptedText, list);                           // пустые состояния: .empty
  mount(initAnimatedContent, list, $('.tabs'));             // смена вкладок
  mount(initCheckMark, $('#settings'));                     // проверка станций в настройках
  return { flap: mount(initSplitFlap, $('#nowSub')) };
}
