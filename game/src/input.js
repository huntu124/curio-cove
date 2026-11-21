// Input: pointer and keyboard. The two pictures sit side by side, so a click's
// x decides the panel and both receive the same panel-local coordinates; keys
// H (hint), M (mute) and Enter (confirm screens) are the whole keyboard map.

import { GAME } from './config.js';
import { unlock, toggleMute } from './audio.js';

export function setupInput(canvas, handlers) {
  canvas.addEventListener('pointerdown', (event) => {
    unlock();
    const rect = canvas.getBoundingClientRect();
    const scale = GAME.width / rect.width;
    const x = (event.clientX - rect.left) * scale;
    const y = (event.clientY - rect.top) * scale;
    if (y < GAME.hudHeight) {
      handlers.onHud?.(x, y);
      return;
    }
    const panelY = y - GAME.hudHeight - GAME.panelGap / 2;
    const leftEdge = GAME.panelGap / 2;
    const rightEdge = GAME.width - GAME.panelGap / 2 - GAME.panel;
    if (x >= leftEdge && x <= leftEdge + GAME.panel) handlers.onPanel(0, x - leftEdge, panelY);
    else if (x >= rightEdge && x <= rightEdge + GAME.panel) handlers.onPanel(1, x - rightEdge, panelY);
    else handlers.onGap?.(x, panelY);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'h' || event.key === 'H') handlers.onHint();
    if (event.key === 'm' || event.key === 'M') handlers.onMute?.(toggleMute());
    if (event.key === 'Enter') handlers.onConfirm?.();
  });
}
