// Rendering: the two panels, the markers, and every layer of feedback the game
// gives. Curio Cove marks a found difference with a cove-pearl ring that pulses
// once and settles; an unfound hint spot shimmers instead.

import { drawItem } from './scenes.js';
import { GAME } from './config.js';

const PANEL = GAME.panel;

export function drawScene(ctx, items, background, palette, effects = [], frame = true) {
  ctx.save();
  if (frame) {
    ctx.beginPath();
    ctx.roundRect(0, 0, PANEL, PANEL, 10);
    ctx.clip();
  }
  background(ctx, palette);
  for (const it of items) drawItem(ctx, it);
  for (const fx of effects) drawEffect(ctx, fx);
  ctx.restore();
  if (frame) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(1, 1, PANEL - 2, PANEL - 2, 10);
    ctx.stroke();
    ctx.restore();
  }
}

export function drawEffect(ctx, fx) {
  const t = fx.t; // 0..1 progress
  if (fx.type === 'found') {
    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${1 - t * 0.6})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(fx.x, fx.y, 16 + t * 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(255,215,110,${1 - t})`;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(fx.x + Math.cos(a) * (14 + t * 34), fx.y + Math.sin(a) * (14 + t * 34), 3.5 * (1 - t), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (fx.type === 'wrong') {
    ctx.save();
    ctx.strokeStyle = `rgba(217,88,94,${1 - t})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fx.x - 10, fx.y - 10);
    ctx.lineTo(fx.x + 10, fx.y + 10);
    ctx.moveTo(fx.x + 10, fx.y - 10);
    ctx.lineTo(fx.x - 10, fx.y + 10);
    ctx.stroke();
    ctx.restore();
  }
}

// a found marker: a steady pearl ring with a level-tinted fill
export function drawMarker(ctx, x, y, found, hinted, time) {
  ctx.save();
  if (found) {
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.fillStyle = 'rgba(255,215,110,0.28)';
    const pulse = 1 + Math.sin(time / 300) * 0.05;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(x, y, 22 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (hinted) {
    const a = 0.4 + Math.sin(time / 180) * 0.25;
    ctx.strokeStyle = `rgba(255,215,110,${a})`;
    ctx.setLineDash([5, 6]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// the whole HUD band: title, counter, timer ribbon, hint meter, score
export function drawHud(ctx, state, time) {
  const { level, found, total, secondsLeft, hintReady, score, combo } = state;
  ctx.save();
  ctx.fillStyle = '#191423';
  ctx.fillRect(0, 0, GAME.width, GAME.hudHeight);
  ctx.fillStyle = level.palette.accent;
  ctx.fillRect(0, GAME.hudHeight - 6, GAME.width, 6);

  ctx.fillStyle = '#f4efe6';
  ctx.font = '700 30px Georgia, serif';
  ctx.fillText(level.name, 28, 52);
  ctx.fillStyle = 'rgba(244,239,230,0.65)';
  ctx.font = 'italic 15px Georgia, serif';
  ctx.fillText(level.tagline, 28, 78);

  // counter of differences still to find
  ctx.fillStyle = '#f4efe6';
  ctx.font = '700 26px Georgia, serif';
  ctx.fillText(`${found} / ${total} found`, 28, 122);
  ctx.font = '16px Georgia, serif';
  ctx.fillStyle = combo > 1 ? '#ffd76e' : 'rgba(244,239,230,0.7)';
  ctx.fillText(combo > 1 ? `streak ×${combo}!` : `score ${score}`, 28, 150);

  // timer ribbon
  const frac = Math.max(0, secondsLeft / level.time);
  const w = 300;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(260, 108, w, 18);
  ctx.fillStyle = frac > 0.35 ? '#4caf6d' : frac > 0.15 ? '#e2b13a' : '#d9585e';
  ctx.fillRect(260, 108, w * frac, 18);
  ctx.fillStyle = '#f4efe6';
  ctx.font = '700 20px Georgia, serif';
  ctx.fillText(`${Math.ceil(secondsLeft)}s`, 260 + w + 14, 124);

  // hint meter
  ctx.fillStyle = hintReady ? '#ffd76e' : 'rgba(244,239,230,0.4)';
  ctx.beginPath();
  ctx.arc(700, 117, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#191423';
  ctx.font = '700 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('?', 700, 125);
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(244,239,230,0.6)';
  ctx.font = '13px Georgia, serif';
  ctx.fillText('press H (costs 8s)', 732, 122);

  ctx.restore();
}

// start and end screens share one layout
export function drawOverlay(ctx, title, lines, buttonLabel) {
  ctx.save();
  ctx.fillStyle = 'rgba(16,12,24,0.82)';
  ctx.fillRect(0, 0, GAME.width, GAME.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd76e';
  ctx.font = '700 54px Georgia, serif';
  ctx.fillText(title, GAME.width / 2, 250);
  ctx.fillStyle = '#f4efe6';
  ctx.font = '20px Georgia, serif';
  lines.forEach((line, i) => ctx.fillText(line, GAME.width / 2, 310 + i * 32));
  ctx.fillStyle = '#e2703a';
  ctx.fillRect(GAME.width / 2 - 140, 420, 280, 56);
  ctx.fillStyle = '#fff';
  ctx.font = '700 22px Georgia, serif';
  ctx.fillText(buttonLabel, GAME.width / 2, 456);
  ctx.restore();
}
