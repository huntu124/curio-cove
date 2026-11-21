// Curio Cove — main loop. State machine over menu → play → set cleared/failed →
// tour complete, one puzzle per set from a fixed seed (so the photomode and a
// normal visit to a set see the same hiding places), streak scoring, a hint that
// costs time, and a pause-safe clock. The two pictures sit side by side under
// the HUD band, exactly how a spot-the-difference hunt wants them.

import { GAME, LEVELS } from './config.js';
import { buildPuzzle, applyDiffs } from './puzzle.js';
import { drawScene, drawHud, drawMarker, drawOverlay } from './render.js';
import { setupInput } from './input.js';
import { sounds } from './audio.js';

const canvas = document.getElementById('cove');
const ctx = canvas.getContext('2d');

const state = {
  phase: 'menu', // menu | play | cleared | failed | complete
  levelIndex: 0,
  puzzle: null,
  panelB: null,
  found: [], // indices into puzzle.diffs
  secondsLeft: 0,
  hintReady: true,
  hintIndex: undefined,
  hintTimer: 0,
  score: 0,
  combo: 0,
  effects: [],
  stars: 0,
  frozen: false, // photomode stills freeze the clock
};

function levelSeed(level) {
  let h = 5381;
  for (const ch of level.key) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return h;
}

function startLevel(index, keepScore = true) {
  const level = LEVELS[index];
  const puzzle = buildPuzzle(level.key, levelSeed(level));
  state.phase = 'play';
  state.levelIndex = index;
  state.puzzle = puzzle;
  state.panelB = applyDiffs(puzzle.scene.items, puzzle.diffs);
  state.found = [];
  state.secondsLeft = level.time;
  state.hintReady = true;
  state.hintIndex = undefined;
  state.combo = 0;
  state.effects = [];
  if (!keepScore) state.score = 0;
}

// where a difference lives, after its mutation moved or resized it
function diffPoint(diff) {
  const it = diff.mutation.kind === 'gone' ? diff.item : { ...diff.item, ...diff.mutation.patch };
  return { x: it.x, y: it.y };
}

function onPanel(panelIndex, x, y) {
  if (state.phase !== 'play') return;
  for (let i = 0; i < state.puzzle.diffs.length; i++) {
    if (state.found.includes(i)) continue;
    const p = diffPoint(state.puzzle.diffs[i]);
    if (Math.hypot(p.x - x, p.y - y) <= GAME.maxClickRadius) {
      findDifference(i, p);
      return;
    }
  }
  missClick(x, y);
}

function findDifference(i, p) {
  state.found.push(i);
  state.combo += 1;
  state.score += 100 * state.combo;
  state.effects.push({ type: 'found', x: p.x, y: p.y, t: 0 });
  sounds.found(state.combo);
  if (state.found.length === state.puzzle.diffs.length) clearSet();
}

function missClick(x, y) {
  state.combo = 0;
  state.secondsLeft = Math.max(0.5, state.secondsLeft - GAME.penaltySeconds);
  state.effects.push({ type: 'wrong', x, y, t: 0 });
  sounds.wrong();
}

function useHint() {
  if (state.phase !== 'play' || !state.hintReady) return;
  const remaining = state.puzzle.diffs.map((d, i) => i).filter((i) => !state.found.includes(i));
  if (!remaining.length) return;
  state.hintReady = false;
  state.secondsLeft = Math.max(0.5, state.secondsLeft - GAME.hintPenaltySeconds);
  state.hintIndex = remaining[0];
  state.hintTimer = 4; // the dashed shimmer shows for 4 seconds
  sounds.hint();
}

function advance() {
  if (state.phase === 'cleared') {
    if (state.levelIndex + 1 < LEVELS.length) startLevel(state.levelIndex + 1);
    else {
      state.phase = 'complete';
      sounds.clear();
    }
  } else if (state.phase === 'failed' || state.phase === 'complete' || state.phase === 'menu') {
    startLevel(0, false);
  }
}

function clearSet() {
  state.phase = 'cleared';
  const frac = state.secondsLeft / LEVELS[state.levelIndex].time;
  state.stars = frac > 0.6 ? 3 : frac > 0.25 ? 2 : 1;
  state.score += 250 + Math.round(state.secondsLeft) * 5;
  sounds.clear();
}

function failSet() {
  state.phase = 'failed';
  state.combo = 0;
  sounds.timeout();
}

function update(dt) {
  for (const fx of state.effects) fx.t += dt * 2.2;
  state.effects = state.effects.filter((fx) => fx.t < 1);
  if (state.phase !== 'play' || state.frozen) return;
  state.secondsLeft -= dt;
  if (!state.hintReady && state.hintTimer > 0) state.hintTimer -= dt;
  else if (!state.hintReady && state.hintTimer <= 0) state.hintIndex = undefined;
  if (state.secondsLeft <= 0) failSet();
}

function hudState() {
  return {
    level: LEVELS[state.levelIndex],
    found: state.found.length,
    total: state.puzzle ? state.puzzle.diffs.length : 0,
    secondsLeft: Math.max(0, state.secondsLeft),
    hintReady: state.hintReady,
    score: state.score,
    combo: state.combo,
  };
}

function withPanel(side, paint) {
  ctx.save();
  ctx.translate(side === 0 ? GAME.panelGap / 2 : GAME.width - GAME.panel - GAME.panelGap / 2, GAME.hudHeight + GAME.panelGap / 2);
  paint(ctx);
  ctx.restore();
}

function draw(time) {
  const level = LEVELS[state.levelIndex];
  if (state.phase === 'menu') {
    drawMenu();
    return;
  }
  ctx.clearRect(0, 0, GAME.width, GAME.height);
  drawHud(ctx, hudState(), time);
  const level0 = LEVELS[state.levelIndex];
  withPanel(0, (p) => drawScene(p, state.puzzle.scene.items, state.puzzle.scene.background, level0.palette, state.effects));
  withPanel(1, (p) => drawScene(p, state.panelB, state.puzzle.scene.background, level0.palette, state.effects));
  for (let i = 0; i < state.puzzle.diffs.length; i++) {
    const p = diffPoint(state.puzzle.diffs[i]);
    const found = state.found.includes(i);
    const hinted = state.hintIndex === i;
    if (!found && !hinted) continue;
    withPanel(0, (pc) => drawMarker(pc, p.x, p.y, found, hinted, time));
    withPanel(1, (pc) => drawMarker(pc, p.x, p.y, found, hinted, time));
  }
  // footer band: which panel is which
  ctx.fillStyle = '#191423';
  ctx.fillRect(0, GAME.height - 34, GAME.width, 34);
  ctx.fillStyle = 'rgba(244,239,230,0.7)';
  ctx.font = '14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('A', GAME.panelGap / 2 + GAME.panel / 2, GAME.height - 12);
  ctx.fillText('B', GAME.width - GAME.panelGap / 2 - GAME.panel / 2, GAME.height - 12);
  ctx.textAlign = 'left';
  ctx.fillText('Curio Cove · H hint · M mute', GAME.width - 250, GAME.height - 12);

  if (state.phase === 'cleared') {
    drawOverlay(ctx, 'Set cleared!', [`You spotted all ${state.puzzle.diffs.length} curiosities.`, `Time left: ${Math.ceil(state.secondsLeft)}s · ${'★'.repeat(state.stars)}`, `Score: ${state.score}`], 'Next set (Enter)');
  } else if (state.phase === 'failed') {
    drawOverlay(ctx, 'The tide took it…', [`${state.puzzle.diffs.length - state.found.length} curiosities got away.`, `Score: ${state.score}`], 'Try again (Enter)');
  } else if (state.phase === 'complete') {
    drawOverlay(ctx, 'Tour complete!', ['Every set in the Cove is cleared.', `Final score: ${state.score}`, 'Thanks for visiting Curio Cove.'], 'Play again (Enter)');
  }
}

function drawMenu() {
  ctx.clearRect(0, 0, GAME.width, GAME.height);
  const bg = ctx.createLinearGradient(0, 0, 0, GAME.height);
  bg.addColorStop(0, '#aee3f5');
  bg.addColorStop(0.55, '#f0dcb0');
  bg.addColorStop(1, '#2f9ec4');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, GAME.width, GAME.height);
  drawOverlay(ctx, 'Curio Cove', [
    'Four little sets. Six to nine curiosities each.',
    'The two pictures differ in small ways — find them all before the tide turns.',
    'Streaks pay more. Hints cost eight seconds of tide.',
  ], 'Set sail (Enter)');
}

setupInput(canvas, {
  onPanel,
  onHint: useHint,
  onConfirm: advance,
  onHud: (x, y) => {
    // the round hint button sits at (700, 117) in the HUD
    if (Math.hypot(x - 700, y - 117) < 26) useHint();
  },
});

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  update(dt);
  draw(now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

document.addEventListener('visibilitychange', () => {
  last = performance.now(); // a hidden tab must not eat the timer in one gulp
});

// ---- photomode: ?shot=1..4 renders curated stills of the game itself ----
// The same painter, puzzle and marker code as play; only the clock is frozen.
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  const plan = {
    1: { level: 0, find: 0, left: 74 },
    2: { level: 0, find: 4, left: 61 },
    3: { level: 2, find: 3, left: 48 },
    4: { level: 3, find: 'all', left: 22 },
    5: { level: 1, find: 5, left: 33 },
    6: { level: 3, find: 6, left: 39 },
  }[Number(shot)] ?? { level: 0, find: 0, left: 60 };
  startLevel(plan.level, false);
  const total = state.puzzle.diffs.length;
  const count = plan.find === 'all' ? total : Math.min(plan.find, total);
  for (let i = 0; i < count; i++) {
    const p = diffPoint(state.puzzle.diffs[i]);
    state.found.push(i);
    state.score += 100 * (i + 1);
    state.effects.push({ type: 'found', x: p.x, y: p.y, t: 0.999 });
  }
  state.secondsLeft = plan.left;
  state.frozen = true;
  if (count === total && total > 0) {
    clearSet();
    state.stars = 3;
  }
}
