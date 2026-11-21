// Curio Cove's hand-in program: the game itself is this directory's game/ folder
// (plain static files, no build step, no network request) and these four PNGs are
// real renders of it. This program copies both into the grader's output directory
// and writes dossier.json — the judge's view — with the vendored make.fun library.
//
// Serve the game locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// the scorer's caps (reference/gate.json); only text_max_bytes shapes the bytes —
// the others refuse an entry the scorer would refuse anyway
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(out, CAPS);
writeFileSync(join(out, 'dossier.json'), dossier);

// a short run summary: what was handed in, and from where
const shots = readdirSync(join(out, 'screenshots')).filter((f) => {
  const s = statSync(join(out, 'screenshots', f));
  return s.isFile();
});
console.log(`Curio Cove handed in: ${shots.length} screenshot(s), game/ copied, dossier.json ${dossier.length} bytes -> ${out}`);
