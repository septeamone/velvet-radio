// Подключает анимированные элементы нового вида (React Bits, перенос на чистый JS/CSS) к окну. Вызывается один раз, только при data-ui="new".
import { initWarmTooltip } from './warm-tooltip.js';
import { initGlideSelect } from './glide-select.js';
import { initAnimatedList } from './animated-list.js';
import { initRubberAll } from './rubber.js';
import { initSquish } from './squish.js';
import { initPulseHeart } from './pulse-heart.js';
import { elasticSlider } from './elastic-slider.js';
import { statusMark } from './status-mark.js';
import { shinyText } from './shiny-text.js';
import { initSpotlight } from './spotlight.js';
import { initBorderGlow } from './border-glow.js';
import { initEchoText } from './echo-text.js';
import { initSplitFlap } from './split-flap.js';

export function mountNewUi($, list) {
  initWarmTooltip();                                   // до applyStatic(): системные подсказки не должны успеть появиться
  initGlideSelect({ button: $('#gbtn'), panel: $('#gpanel') });
  initAnimatedList(list);
  initBorderGlow(list);
  initRubberAll(); initSquish(); initPulseHeart();
  elasticSlider($('#vol'), { icon: $('.vol svg') });
  statusMark($('#dot'));
  shinyText($('#nowSub'));
  initSpotlight($('.player'));
  initEchoText($('.brand'), { avoid: $('.tools') });
  return { flap: initSplitFlap($('#nowSub')) };
}
