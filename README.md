# Curio Cove — a spot-the-difference tour

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/huntu124/curio-cove/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/huntu124/curio-cove/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

Curio Cove is a spot-the-difference game for the desktop browser. Four little
sets — a driftwood cove, a lamplit attic, an orbital greenhouse, a midnight
carousel — each drawn by the game's own code and each hiding six to nine small
changes between two near-identical pictures. Find them all before the tide
turns; a streak pays, and a hint costs eight seconds of it.

The game is plain static files under `game/` with no build step and no network
request: open `game/index.html` through any static server and play with mouse
and keyboard (`H` hint, `M` mute, `Enter` confirm).

## Run it

```sh
node serve.ts        # serves game/ on http://localhost:8080
```

To hand the entry in the way the grader does, write it to an output directory:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to `/output` (or `MAKEFUN_OUTPUT_DIR`)
and writes `dossier.json` with `buildDossier` from `vendor/makefun-game.ts`.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards</sub>
