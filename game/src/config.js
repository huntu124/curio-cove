// Curio Cove — a spot-the-difference game about little curiosities hiding in
// plain sight. Four hand-tuned scene sets, each procedurally drawn, each hiding
// a fresh batch of differences on every visit.

export const GAME = {
  width: 1200,
  height: 760,
  panel: 540, // each picture is a square panel
  panelGap: 40,
  hudHeight: 180,
  maxClickRadius: 34, // forgiving hit radius around a curiosity, in px
  penaltySeconds: 5, // wrong click costs time, not points
  hintCooldownSeconds: 12,
  hintPenaltySeconds: 8,
};

// Every level: its painter lives in scenes.js under the same key.
// `count` differences, `time` seconds, `palette` drives the shared look.
export const LEVELS = [
  {
    key: 'cove',
    name: 'Driftwood Cove',
    tagline: 'The tide keeps rearranging things.',
    count: 6,
    time: 90,
    palette: { sky: ['#aee3f5', '#e8f7ff'], sea: '#2f9ec4', sand: '#f0dcb0', accent: '#e2703a' },
  },
  {
    key: 'attic',
    name: 'Lamplight Attic',
    tagline: 'Someone was here. Someone always is.',
    count: 7,
    time: 80,
    palette: { wall: '#4a3b57', floor: '#2e2438', lamp: '#f4c95d', accent: '#c96f4a' },
  },
  {
    key: 'greenhouse',
    name: 'Orbital Greenhouse',
    tagline: 'Tomatoes, in orbit, somehow.',
    count: 8,
    time: 75,
    palette: { space: ['#0b1030', '#1a2340'], glass: '#9fd8e8', leaf: '#4caf6d', accent: '#e2b13a' },
  },
  {
    key: 'carousel',
    name: 'Midnight Carousel',
    tagline: 'It only spins when nobody counts the horses.',
    count: 9,
    time: 70,
    palette: { tent: '#8e2f4f', tentAlt: '#f2e6d8', night: '#141031', bulb: '#ffd76e', accent: '#3fa8a0' },
  },
];

export const STARS = {
  3: 3, // finishing with more than 60% time left = 3 stars
  2: 0.25, // more than 25% left = 2 stars
};
