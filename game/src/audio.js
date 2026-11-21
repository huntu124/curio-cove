// Sound, synthesized with WebAudio so the game ships no audio files: a pearling
// chime when a difference is found, a low thud on a wrong click, a tick under
// ten seconds, and a small fanfare for a cleared set.

let ctxAudio = null;
let muted = false;

function ac() {
  if (!ctxAudio) ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
  return ctxAudio;
}

function tone(freq, dur, type, gain, delay = 0) {
  if (muted) return;
  const t0 = ac().currentTime + delay;
  const osc = ac().createOscillator();
  const amp = ac().createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(gain, t0);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ac().destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sounds = {
  found(combo) {
    const base = 520 + Math.min(combo, 5) * 60;
    tone(base, 0.18, 'sine', 0.22);
    tone(base * 1.5, 0.24, 'sine', 0.16, 0.07);
  },
  wrong() {
    tone(150, 0.16, 'square', 0.12);
    tone(110, 0.2, 'square', 0.1, 0.05);
  },
  hint() {
    tone(760, 0.12, 'triangle', 0.15);
    tone(980, 0.16, 'triangle', 0.12, 0.09);
  },
  tick() {
    tone(880, 0.05, 'square', 0.06);
  },
  clear() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'sine', 0.18, i * 0.11));
  },
  timeout() {
    tone(220, 0.5, 'sawtooth', 0.14);
    tone(165, 0.6, 'sawtooth', 0.12, 0.18);
  },
};

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

// resume on first gesture — browsers start audio contexts suspended
export function unlock() {
  if (ctxAudio && ctxAudio.state === 'suspended') ctxAudio.resume();
  else ac();
}
