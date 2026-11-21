// The four scenes of Curio Cove. Every painter builds the SAME item list twice
// (panel A and panel B of a round); puzzle.js then mutates a handful of items
// on panel B, and the painter draws whatever it is given — so a "difference"
// is just an item whose fields changed.

import { mulberry32, pick, range, shuffled } from './rng.js';

// ---- shared item painters ------------------------------------------------

export const KINDS = {
  cloud(ctx, it) {
    ctx.fillStyle = it.c;
    for (const [dx, dy, r] of [[-22, 4, 16], [0, -6, 22], [22, 4, 16], [0, 8, 18]]) {
      ctx.beginPath();
      ctx.arc(it.x + dx * it.s, it.y + dy * it.s, r * it.s, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  gull(ctx, it) {
    ctx.strokeStyle = it.c;
    ctx.lineWidth = 3 * it.s;
    ctx.beginPath();
    ctx.arc(it.x - 9 * it.s, it.y + 4 * it.s, 9 * it.s, Math.PI, Math.PI * 1.75);
    ctx.arc(it.x + 9 * it.s, it.y + 4 * it.s, 9 * it.s, Math.PI, Math.PI * 1.75);
    ctx.stroke();
  },
  starfish(ctx, it) {
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rot || 0);
    if (it.flip) ctx.scale(-1, 1);
    ctx.fillStyle = it.c;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const b = a + Math.PI / 5;
      ctx.lineTo(Math.cos(a) * 20 * it.s, Math.sin(a) * 20 * it.s);
      ctx.lineTo(Math.cos(b) * 9 * it.s, Math.sin(b) * 9 * it.s);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },
  fish(ctx, it) {
    ctx.save();
    ctx.translate(it.x, it.y);
    if (it.flip) ctx.scale(-1, 1);
    ctx.fillStyle = it.c;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16 * it.s, 9 * it.s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-14 * it.s, 0);
    ctx.lineTo(-26 * it.s, -8 * it.s);
    ctx.lineTo(-26 * it.s, 8 * it.s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },
  boat(ctx, it) {
    ctx.save();
    ctx.translate(it.x, it.y);
    if (it.flip) ctx.scale(-1, 1);
    ctx.fillStyle = it.c;
    ctx.beginPath();
    ctx.moveTo(-26 * it.s, 0);
    ctx.lineTo(26 * it.s, 0);
    ctx.lineTo(16 * it.s, 12 * it.s);
    ctx.lineTo(-18 * it.s, 12 * it.s);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-2 * it.s, -34 * it.s, 3 * it.s, 34 * it.s);
    ctx.fillStyle = '#f6f2e8';
    ctx.beginPath();
    ctx.moveTo(2 * it.s, -32 * it.s);
    ctx.lineTo(24 * it.s, -6 * it.s);
    ctx.lineTo(2 * it.s, -6 * it.s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },
  book(ctx, it) {
    ctx.fillStyle = it.c;
    ctx.fillRect(it.x - 9 * it.s, it.y - 26 * it.s, 18 * it.s, 52 * it.s);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(it.x - 6 * it.s, it.y - 20 * it.s, 12 * it.s, 3 * it.s);
  },
  pot(ctx, it) {
    ctx.fillStyle = '#b0713f';
    ctx.beginPath();
    ctx.moveTo(it.x - 16 * it.s, it.y);
    ctx.lineTo(it.x + 16 * it.s, it.y);
    ctx.lineTo(it.x + 11 * it.s, it.y + 22 * it.s);
    ctx.lineTo(it.x - 11 * it.s, it.y + 22 * it.s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = it.c;
    ctx.lineWidth = 5 * it.s;
    for (const [dx, dy] of it.leaves) {
      ctx.beginPath();
      ctx.moveTo(it.x, it.y);
      ctx.quadraticCurveTo(it.x + dx * it.s * 0.6, it.y + dy * it.s * 0.6, it.x + dx * it.s, it.y + dy * it.s);
      ctx.stroke();
    }
  },
  horse(ctx, it) {
    ctx.save();
    ctx.translate(it.x, it.y);
    if (it.flip) ctx.scale(-1, 1);
    ctx.fillStyle = it.c;
    // body
    ctx.beginPath();
    ctx.ellipse(0, 6 * it.s, 23 * it.s, 12 * it.s, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // neck up to a small head
    ctx.beginPath();
    ctx.moveTo(14 * it.s, -2 * it.s);
    ctx.quadraticCurveTo(22 * it.s, -16 * it.s, 30 * it.s, -20 * it.s);
    ctx.lineTo(36 * it.s, -14 * it.s);
    ctx.quadraticCurveTo(26 * it.s, -10 * it.s, 20 * it.s, 2 * it.s);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(34 * it.s, -18 * it.s, 8 * it.s, 5 * it.s, 0.5, 0, Math.PI * 2);
    ctx.fill();
    // legs
    ctx.strokeStyle = it.c;
    ctx.lineWidth = 3 * it.s;
    for (const dx of [-14, -4, 8, 16]) {
      ctx.beginPath();
      ctx.moveTo(dx * it.s, 14 * it.s);
      ctx.lineTo(dx * it.s + (dx > 0 ? 3 : -2) * it.s, 30 * it.s);
      ctx.stroke();
    }
    // tail
    ctx.beginPath();
    ctx.moveTo(-22 * it.s, 0);
    ctx.quadraticCurveTo(-34 * it.s, 6 * it.s, -30 * it.s, 20 * it.s);
    ctx.stroke();
    // saddle
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, -2 * it.s, 9 * it.s, 5 * it.s, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
  bulb(ctx, it) {
    ctx.fillStyle = it.c;
    ctx.beginPath();
    ctx.arc(it.x, it.y, 6 * it.s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(it.x - 2 * it.s, it.y - 2 * it.s, 2 * it.s, 0, Math.PI * 2);
    ctx.fill();
  },
  bubble(ctx, it) {
    ctx.strokeStyle = it.c;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(it.x, it.y, 10 * it.s, 0, Math.PI * 2);
    ctx.stroke();
  },
  shell(ctx, it) {
    ctx.strokeStyle = it.c;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(it.x, it.y + 6 * it.s, 10 * it.s, Math.PI, 0);
    ctx.stroke();
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(it.x, it.y + 6 * it.s);
      ctx.lineTo(it.x + i * 5 * it.s, it.y - 4 * it.s);
      ctx.stroke();
    }
  },
  crate(ctx, it) {
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rot || 0);
    if (it.flip) ctx.scale(-1, 1);
    ctx.fillStyle = it.c;
    ctx.fillRect(-20 * it.s, -16 * it.s, 40 * it.s, 32 * it.s);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.strokeRect(-20 * it.s, -16 * it.s, 40 * it.s, 32 * it.s);
    ctx.restore();
  },
};

export function drawItem(ctx, it) {
  KINDS[it.kind](ctx, it);
}

// ---- scenes ---------------------------------------------------------------

function coveScene(seed) {
  const rng = mulberry32(seed);
  const items = [];
  const cloudCols = ['#ffffff', '#f4f9ff', '#ffe9e0'];
  for (let i = 0; i < 4; i++) {
    items.push({ kind: 'cloud', id: `cloud${i}`, x: 60 + i * 120, y: 50 + range(rng, -20, 40), s: range(rng, 0.7, 1.25), c: pick(rng, cloudCols), r: 40 });
  }
  for (let i = 0; i < 3; i++) {
    items.push({ kind: 'gull', id: `gull${i}`, x: range(rng, 90, 480), y: range(rng, 90, 160), s: range(rng, 0.8, 1.2), c: '#456', r: 22 });
  }
  for (let i = 0; i < 4; i++) {
    items.push({ kind: 'fish', id: `fish${i}`, x: 60 + i * 118 + range(rng, -30, 30), y: 300 + range(rng, -22, 22), s: range(rng, 0.8, 1.1), c: pick(rng, ['#3fa8a0', '#e2b13a', '#c96f4a']), flip: rng() > 0.5, r: 24 });
  }
  for (let i = 0; i < 3; i++) {
    items.push({ kind: 'starfish', id: `star${i}`, x: range(rng, 70, 470), y: range(rng, 430, 500), s: range(rng, 0.7, 1.1), c: pick(rng, ['#e2703a', '#d9585e', '#f0a24a']), rot: range(rng, -0.6, 0.6), r: 26 });
  }
  for (let i = 0; i < 4; i++) {
    items.push({ kind: 'shell', id: `shell${i}`, x: range(rng, 60, 480), y: range(rng, 450, 510), s: range(rng, 0.8, 1.2), c: pick(rng, ['#f6f2e8', '#e8c9c9', '#cfe3f5']), r: 16 });
  }
  items.push({ kind: 'boat', id: 'boat0', x: 150, y: 262, s: 0.9, c: '#e2703a', flip: false, r: 40 });
  items.push({ kind: 'boat', id: 'boat1', x: 420, y: 250, s: 0.7, c: '#3fa8a0', flip: true, r: 34 });
  items.push({ kind: 'crate', id: 'crate0', x: 470, y: 470, s: 0.8, c: '#c9a36a', rot: -0.12, r: 30 });
  return { items, background: drawCoveBackground };
}

function drawCoveBackground(ctx, palette) {
  const g = ctx.createLinearGradient(0, 0, 0, 540);
  g.addColorStop(0, palette.sky[0]);
  g.addColorStop(1, palette.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 540, 290);
  ctx.fillStyle = palette.sea;
  ctx.fillRect(0, 290, 540, 160);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let i = 0; i < 5; i++) ctx.fillRect(0, 302 + i * 30, 540, 3);
  ctx.fillStyle = palette.sand;
  ctx.fillRect(0, 450, 540, 90);
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.ellipse((i * 71) % 540, 460 + (i * 37) % 70, 26, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function atticScene(seed) {
  const rng = mulberry32(seed);
  const items = [];
  const bookCols = ['#c96f4a', '#4a7ba6', '#5b8c5a', '#b5485e', '#e2b13a', '#7d5ba6'];
  for (let row = 0; row < 2; row++) {
    let x = 46;
    while (x < 250) {
      const h = 0.55 + rng() * 0.25;
      items.push({ kind: 'book', id: `book${row}-${x}`, x, y: 400 - row * 118, s: h, c: pick(rng, bookCols), r: 20 });
      x += 18 + Math.floor(rng() * 12);
    }
  }
  for (let i = 0; i < 3; i++) {
    items.push({ kind: 'crate', id: `box${i}`, x: 340 + i * 54 + range(rng, -8, 8), y: 452 - (i === 2 ? 34 : 0), s: range(rng, 0.7, 1), c: pick(rng, ['#c9a36a', '#a8815a', '#8b6d4a']), rot: range(rng, -0.08, 0.08), r: 30 });
  }
  for (let i = 0; i < 4; i++) {
    items.push({ kind: 'shell', id: `knick${i}`, x: 300 + i * 62, y: 210, s: range(rng, 0.7, 1.1), c: pick(rng, ['#f4c95d', '#cfe3f5', '#e8c9c9']), r: 14 });
  }
  for (let i = 0; i < 3; i++) {
    items.push({ kind: 'gull', id: `moth${i}`, x: range(rng, 320, 470), y: range(rng, 280, 330), s: range(rng, 0.5, 0.8), c: '#2c2338', r: 16 });
  }
  items.push({ kind: 'starfish', id: 'clockhand', x: 455, y: 130, s: 0.85, c: '#f4c95d', rot: 0.3, r: 26 });
  return { items, background: drawAtticBackground };
}

function drawAtticBackground(ctx, palette) {
  ctx.fillStyle = palette.wall;
  ctx.fillRect(0, 0, 540, 430);
  ctx.fillStyle = palette.floor;
  ctx.fillRect(0, 430, 540, 110);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (let i = 0; i < 6; i++) ctx.fillRect(0, 436 + i * 16, 540, 2);
  ctx.fillStyle = '#332a42';
  ctx.fillRect(30, 290, 250, 130);
  ctx.fillRect(30, 150, 250, 14);
  ctx.fillRect(30, 268, 250, 14);
  ctx.fillStyle = 'rgba(244,201,93,0.14)';
  ctx.beginPath();
  ctx.moveTo(430, 40);
  ctx.lineTo(430, 250);
  ctx.lineTo(300, 470);
  ctx.lineTo(240, 470);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2c2338';
  ctx.beginPath();
  ctx.arc(455, 90, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4a3b57';
  ctx.beginPath();
  ctx.arc(455, 90, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#332a42';
  ctx.fillRect(435, 0, 40, 34);
}

function greenhouseScene(seed) {
  const rng = mulberry32(seed);
  const items = [];
  for (let i = 0; i < 5; i++) {
    items.push({ kind: 'pot', id: `pot${i}`, x: 60 + i * 106 + range(rng, -14, 14), y: range(rng, 400, 440), s: range(rng, 0.8, 1.15), c: pick(rng, ['#4caf6d', '#7bc47f', '#2e8b57', '#5aa84f']), leaves: [[-24, -34], [0, -48], [24, -34], [-14, -20]], r: 40 });
  }
  for (let i = 0; i < 6; i++) {
    items.push({ kind: 'bubble', id: `bub${i}`, x: range(rng, 60, 480), y: range(rng, 90, 330), s: range(rng, 0.6, 1.3), c: '#9fd8e8', r: 16 });
  }
  for (let i = 0; i < 3; i++) {
    items.push({ kind: 'bulb', id: `led${i}`, x: 300 + i * 46, y: 480, s: 1, c: pick(rng, ['#4caf6d', '#e2b13a', '#d9585e']), r: 10 });
  }
  for (let i = 0; i < 3; i++) {
    items.push({ kind: 'gull', id: `vine${i}`, x: 490 + i * 18, y: 150 + i * 80, s: 1.1, c: '#2e8b57', r: 16 });
  }
  for (let i = 0; i < 3; i++) {
    items.push({ kind: 'fish', id: `tomato${i}`, x: 130 + i * 120 + range(rng, -16, 16), y: 352, s: 0.55, c: '#d9585e', flip: rng() > 0.5, r: 18 });
  }
  items.push({ kind: 'starfish', id: 'alienflower', x: 250, y: 140, s: 0.9, c: '#d9585e', rot: 0.4, r: 26 });
  items.push({ kind: 'crate', id: 'seedbox', x: 120, y: 300, s: 0.7, c: '#8b6d4a', rot: 0.15, r: 26 });
  return { items, background: drawGreenhouseBackground };
}

function drawGreenhouseBackground(ctx, palette) {
  const g = ctx.createLinearGradient(0, 0, 0, 540);
  g.addColorStop(0, palette.space[0]);
  g.addColorStop(1, palette.space[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 540, 540);
  ctx.fillStyle = '#e8d9a0';
  ctx.beginPath();
  ctx.arc(430, 110, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.arc(400, 90, 20, 0, Math.PI * 2);
  ctx.arc(455, 130, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = palette.glass;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(270, 300, 240, Math.PI * 0.85, Math.PI * 2.15);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(159,216,232,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 470);
  ctx.lineTo(60, 220);
  ctx.moveTo(480, 470);
  ctx.lineTo(480, 190);
  ctx.moveTo(30, 480);
  ctx.lineTo(510, 480);
  ctx.stroke();
  ctx.fillStyle = '#1d2a3f';
  ctx.fillRect(280, 460, 120, 46);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.strokeRect(280, 460, 120, 46);
}

function carouselScene(seed) {
  const rng = mulberry32(seed);
  const items = [];
  const horseCols = ['#f2e6d8', '#e2b13a', '#3fa8a0', '#d9585e', '#8e5ba6', '#e2703a'];
  for (let i = 0; i < 4; i++) {
    items.push({ kind: 'horse', id: `horse${i}`, x: 100 + i * 112 + range(rng, -10, 10), y: 300 + range(rng, -24, 24), s: range(rng, 0.85, 1.1), c: pick(rng, horseCols), flip: i % 2 === 1, r: 34 });
  }
  for (let i = 0; i < 10; i++) {
    items.push({ kind: 'bulb', id: `bulb${i}`, x: 62 + i * 46, y: 150 + (i % 2 ? 12 : 0), s: 1, c: '#ffd76e', r: 10 });
  }
  for (let i = 0; i < 3; i++) {
    items.push({ kind: 'shell', id: `flag${i}`, x: 90 + i * 160, y: 100, s: range(rng, 0.8, 1.2), c: pick(rng, ['#d9585e', '#3fa8a0', '#ffd76e']), r: 14 });
  }
  for (let i = 0; i < 4; i++) {
    items.push({ kind: 'bubble', id: `spark${i}`, x: range(rng, 70, 470), y: range(rng, 380, 470), s: range(rng, 0.5, 0.9), c: '#ffd76e', r: 12 });
  }
  items.push({ kind: 'starfish', id: 'topper', x: 270, y: 60, s: 1, c: '#ffd76e', rot: 0.2, r: 24 });
  return { items, background: drawCarouselBackground };
}

function drawCarouselBackground(ctx, palette) {
  ctx.fillStyle = palette.night;
  ctx.fillRect(0, 0, 540, 540);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 40; i++) {
    const x = (i * 97 + 31) % 540;
    const y = (i * 53 + 17) % 220;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.fillStyle = '#e8e3d0';
  ctx.beginPath();
  ctx.arc(470, 80, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.night;
  ctx.beginPath();
  ctx.arc(482, 72, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.tent;
  ctx.fillRect(20, 170, 500, 320);
  ctx.fillStyle = palette.tentAlt;
  for (let i = 0; i < 7; i += 2) ctx.fillRect(20 + i * 71, 170, 71, 320);
  ctx.fillStyle = '#20142c';
  ctx.fillRect(0, 490, 540, 50);
  ctx.strokeStyle = palette.bulb;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(30, 150);
  ctx.quadraticCurveTo(270, 200, 510, 150);
  ctx.stroke();
}

export const SCENES = {
  cove: coveScene,
  attic: atticScene,
  greenhouse: greenhouseScene,
  carousel: carouselScene,
};

export function buildScene(key, seed) {
  return SCENES[key](seed);
}
