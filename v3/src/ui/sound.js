// Sound (roadmap v3, phase F2): small synthesized effects, no audio files. Browser-only; every call is safe
// to make when audio is unavailable or muted. Timings follow the fight animation (DICE_TIME in fightView.js).

let ctx = null;
let enabled = true;

export const setSound = (on) => { enabled = on; };

function audio() {
  if (!enabled) return null;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// A short tone with a quick attack and an exponential decay.
function tone(freq, { at = 0, dur = 0.25, type = 'sine', gain = 0.15, slide = 0 } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + at;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// Filtered noise: dice rattle, crowd roar.
function noise({ at = 0, dur = 0.2, gain = 0.1, freq = 1200, q = 1, swell = false } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + at;
  const buffer = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
  const data = buffer.getChannelData(0);
  let x = 12345; // a tiny linear congruential generator: noise for the ear only (the game's RNG stays untouched)
  for (let i = 0; i < data.length; i++) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    data[i] = x / 2147483648 - 1;
  }
  const src = a.createBufferSource();
  src.buffer = buffer;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = a.createGain();
  g.gain.setValueAtTime(swell ? 0.0001 : gain, t);
  if (swell) g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(g).connect(a.destination);
  src.start(t);
}

export const sfx = {
  dice: (at = 0) => { for (let i = 0; i < 6; i++) noise({ at: at + i * 0.09, dur: 0.05, gain: 0.08, freq: 2500 + i * 300, q: 4 }); },
  hit: (at = 0) => { tone(140, { at, dur: 0.18, type: 'triangle', gain: 0.25, slide: -80 }); noise({ at, dur: 0.08, gain: 0.08, freq: 800 }); },
  miss: (at = 0) => noise({ at, dur: 0.12, gain: 0.04, freq: 3000, q: 0.7 }),
  parry: (at = 0) => { tone(1200, { at, dur: 0.15, type: 'square', gain: 0.05 }); tone(1800, { at: at + 0.02, dur: 0.2, gain: 0.04 }); },
  cheer: (at = 0) => noise({ at, dur: 1.4, gain: 0.07, freq: 900, q: 0.5, swell: true }),
  groan: (at = 0) => tone(220, { at, dur: 0.6, type: 'sawtooth', gain: 0.03, slide: -90 }),
  death: (at = 0) => { tone(110, { at, dur: 2.2, gain: 0.2 }); tone(165, { at, dur: 1.8, gain: 0.08 }); },
  fanfare: (at = 0) => [523, 659, 784, 1046].forEach((f, i) => tone(f, { at: at + i * 0.12, dur: 0.35, type: 'triangle', gain: 0.1 })),
  event: (at = 0) => { tone(392, { at, dur: 0.3, gain: 0.08 }); tone(587, { at: at + 0.15, dur: 0.4, gain: 0.08 }); },
};

// The sounds of one round, timed to its animation: dice, then each blow as its line appears, then the crowd.
export function roundSounds(m, r, { diceTime = 1.4, lineGap = 0.45 } = {}) {
  if (!enabled) return;
  sfx.dice(0);
  let at = diceTime + 0.3 + lineGap; // after the tactic and initiative lines
  for (const c of r.checks) {
    at += lineGap;
    if (c.parry?.success) sfx.parry(at);
    else if (c.hit) sfx.hit(at);
    else sfx.miss(at);
  }
  if (r.death) sfx.death(at + 0.3);
  else if (r.winner === 'A') sfx.cheer(at + 0.2);
  else sfx.groan(at + 0.2);
  if (m.over && m.result.winner === 'A' && !r.death) sfx.fanfare(at + 1.2);
}
