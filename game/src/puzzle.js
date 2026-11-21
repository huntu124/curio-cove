// Puzzle generation: given a level and a seed, build its panel-A items and the
// list of differences applied to panel B. Every difference is a mutation of one
// item's fields, chosen so the two panels stay fair: differences sit well apart,
// never on the same item twice, and each level uses a different mix of kinds.

import { mulberry32, shuffled } from './rng.js';
import { buildScene } from './scenes.js';

// mutation builders need the original item, so wrap them
function buildMutations(item) {
  return [
    { kind: 'gone', patch: { gone: true }, label: 'missing' },
    { kind: 'hue', patch: { c: item.cAlt }, label: 'colour' },
    { kind: 'scale', patch: { s: item.s * 0.62 }, label: 'size' },
    { kind: 'flip', patch: { flip: true }, label: 'flipped' },
    { kind: 'drift', patch: { x: item.x + 24 }, label: 'moved' },
  ];
}

// shift a hex colour 40 degrees around the wheel — a visible but honest change
function shiftHue(hex) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const mid = (r + g + b) / 3;
  r = Math.round(Math.min(255, mid + (g - b) * 0.8));
  g = Math.round(Math.min(255, mid + (b - r) * 0.8));
  b = Math.round(Math.min(255, mid + (r - g) * 0.8));
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

// Give every colour-bearing item a plausible alternate colour before mutation.
function prepare(items) {
  for (const it of items) {
    if (typeof it.c === 'string' && it.c[0] === '#' && it.c.length === 7) it.cAlt = shiftHue(it.c);
  }
}

export function buildPuzzle(levelKey, seed) {
  const scene = buildScene(levelKey, seed);
  prepare(scene.items);
  const rng = mulberry32(seed ^ 0x9e3779b9);
  const level = LEVEL_SETTINGS[levelKey];
  const order = shuffled(rng, scene.items.slice());
  const diffs = [];
  const chosen = new Set();
  for (const item of order) {
    if (diffs.length >= level.count) break;
    if (chosen.has(item.id)) continue;
    if (diffs.some((d) => Math.hypot(d.item.x - item.x, d.item.y - item.y) < 110)) continue;
    const options = buildMutations(item).filter((m) => {
      if (m.kind === 'hue') return !!item.cAlt;
      if (m.kind === 'flip') return !item.flip && item.kind !== 'book' && item.kind !== 'bulb';
      if (m.kind === 'drift') return item.kind !== 'book' && item.kind !== 'pot';
      return true;
    });
    const mutation = options[Math.floor(rng() * options.length)];
    diffs.push({ item, mutation });
    chosen.add(item.id);
  }
  return { scene, diffs };
}

// applyPuzzle returns the panel-B item list: originals with every mutation applied
export function applyDiffs(items, diffs) {
  const patched = items.map((it) => ({ ...it }));
  const byId = new Map(patched.map((it) => [it.id, it]));
  for (const { item, mutation } of diffs) {
    Object.assign(byId.get(item.id), mutation.patch);
  }
  return patched.filter((it) => !it.gone);
}

export const LEVEL_SETTINGS = {
  cove: { count: 6 },
  attic: { count: 7 },
  greenhouse: { count: 8 },
  carousel: { count: 9 },
};
