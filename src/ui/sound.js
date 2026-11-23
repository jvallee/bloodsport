// Synthesized WebAudio effects; browser-only and safe when audio is unavailable or muted.

let ctx = null;
let enabled = true;
let noiseBuf = null;
let noiseCtx = null;
let noiseCursor = 0;
const activeNodes = new Set();

export function stopAllSounds() {
  for (const node of activeNodes) {
    try { node.stop(); } catch { /* already stopped */ }
    try { node.disconnect(); } catch { /* ignore */ }
  }
  activeNodes.clear();
}

export const setSound = (on) => {
  enabled = on;
  if (!on) stopAllSounds();
};

function audio() {
  if (!enabled) return null;
  try {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') Promise.resolve(ctx.resume()).catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function track(node) {
  activeNodes.add(node);
  const done = () => activeNodes.delete(node);
  node.onended = done;
  return node;
}

// One cached 3-second noise buffer per AudioContext, read from advancing offsets.
function sharedNoiseBuffer(a) {
  if (noiseBuf && noiseCtx === a) return noiseBuf;
  const len = Math.max(1, Math.ceil((a.sampleRate || 44100) * 3));
  const buffer = a.createBuffer(1, len, a.sampleRate || 44100);
  const data = buffer.getChannelData(0);
  let x = 12345;
  for (let i = 0; i < data.length; i++) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    data[i] = x / 2147483648 - 1;
  }
  noiseBuf = buffer;
  noiseCtx = a;
  noiseCursor = 0;
  return buffer;
}

function tone(freq, { at = 0, dur = 0.25, type = 'sine', gain = 0.15, slide = 0 } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + at;
  const osc = track(a.createOscillator());
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

function noise({ at = 0, dur = 0.2, gain = 0.1, freq = 1200, q = 1, swell = false } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + at;
  const buffer = sharedNoiseBuffer(a);
  const src = track(a.createBufferSource());
  src.buffer = buffer;
  src.loop = true;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = a.createGain();
  g.gain.setValueAtTime(swell ? 0.0001 : gain, t);
  if (swell) g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(g).connect(a.destination);
  const bufDur = buffer.duration || 3;
  const offset = noiseCursor % bufDur;
  noiseCursor = (noiseCursor + 0.37) % bufDur;
  src.start(t, offset);
  src.stop(t + dur + 0.05);
}

export const sfx = {
  dice: (at = 0) => { for (let i = 0; i < 6; i++) noise({ at: at + i * 0.09, dur: 0.05, gain: 0.08, freq: 2500 + i * 300, q: 4 }); },
  hit: (at = 0) => { tone(140, { at, dur: 0.18, type: 'triangle', gain: 0.25, slide: -80 }); noise({ at, dur: 0.08, gain: 0.08, freq: 800 }); },
  miss: (at = 0) => noise({ at, dur: 0.12, gain: 0.04, freq: 3000, q: 0.7 }),
  parry: (at = 0) => { tone(1200, { at, dur: 0.15, type: 'square', gain: 0.05 }); tone(1800, { at: at + 0.02, dur: 0.2, gain: 0.04 }); },
  cheer: (at = 0, loud = 1) => noise({ at, dur: 1.4 + 0.6 * (loud - 1), gain: 0.07 * loud, freq: 900, q: 0.5, swell: true }),
  roar: (at = 0) => { noise({ at, dur: 2.4, gain: 0.12, freq: 500, q: 0.4, swell: true }); noise({ at: at + 0.2, dur: 2, gain: 0.06, freq: 1400, q: 0.6, swell: true }); },
  groan: (at = 0) => tone(220, { at, dur: 0.6, type: 'sawtooth', gain: 0.03, slide: -90 }),
  death: (at = 0) => { tone(110, { at, dur: 2.2, gain: 0.2 }); tone(165, { at, dur: 1.8, gain: 0.08 }); },
  fanfare: (at = 0) => [523, 659, 784, 1046].forEach((f, i) => tone(f, { at: at + i * 0.12, dur: 0.35, type: 'triangle', gain: 0.1 })),
  event: (at = 0) => { tone(392, { at, dur: 0.3, gain: 0.08 }); tone(587, { at: at + 0.15, dur: 0.4, gain: 0.08 }); },
};

// Reset cached AudioContext (used by unit tests).
export function resetAudio() {
  stopAllSounds();
  ctx = null;
  noiseBuf = null;
  noiseCtx = null;
  noiseCursor = 0;
}

export function roundSounds(m, r, { diceTime = 1.4, lineGap = 0.45, revealAt = null, blowTimes = null, hype = 0 } = {}) {
  if (!enabled) return;
  const initReason = r.initiative?.reason;
  if (initReason !== 'footwork' && initReason !== 'concussed') sfx.dice(0);
  const reveal = revealAt ?? diceTime + 0.3 + 2 * lineGap;
  if (!r.death) {
    if (r.winner === 'A') sfx.cheer(reveal, 1 + hype / 100);
    else sfx.groan(reveal);
  }
  const before = m.rounds[m.rounds.indexOf(r) - 1];
  if (r.roar && !before?.roar) sfx.roar(reveal + 0.4);
  let at = reveal;
  for (let i = 0; i < r.checks.length; i++) {
    const c = r.checks[i];
    const scheduled = Array.isArray(blowTimes) && Number.isFinite(blowTimes[i]) ? blowTimes[i] : at + lineGap;
    at = Math.max(at, scheduled);
    if (c.parry?.success) sfx.parry(scheduled);
    else if (c.hit) sfx.hit(scheduled);
    else sfx.miss(scheduled);
  }
  if (r.death) sfx.death(at + 0.3);
  if (m.over && m.result.winner === 'A' && !r.death) sfx.fanfare(at + 1);
}
