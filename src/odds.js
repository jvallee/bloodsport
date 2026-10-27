// Pre-fight odds: simulate the real engine many times on copies. Uses its own RNG,
// so previewing never changes the career's fight rolls. Pure.

import { createRng } from './rng.js';
import { createMatch, autoPlay } from './fight.js';

export function estimateOdds(fighter, opponent, { debuff = null, overtrained = false, scouted = 0, n = 500, seed = 12345 } = {}) {
  const rng = createRng(seed);
  let win = 0;
  let hurt = 0;
  let death = 0;
  for (let i = 0; i < n; i++) {
    const m = createMatch({ a: fighter, b: opponent, rng, debuff, overtrained, scouted });
    autoPlay(m);
    if (m.result.winner === 'A') win++;
    if (!m.a.f.alive) death++;
    else if (m.a.f.injuries.length > fighter.injuries.length) hurt++;
  }
  return { win: win / n, injury: (hurt + death) / n, death: death / n };
}

export function winLabel(p) {
  if (p >= 0.75) return 'Strong favorite';
  if (p >= 0.55) return 'Favored';
  if (p >= 0.45) return 'Even fight';
  if (p >= 0.25) return 'Underdog';
  return 'Long shot';
}

export function riskLabel(p, { high, some }) {
  if (p >= high) return 'High';
  if (p >= some) return 'Some';
  return p > 0 ? 'Low' : 'None';
}

// The Oracle sharpens the numbers: words only → nearest 10% → exact.
export function describeOdds(odds, oracle = 0) {
  const fmt = (p) => {
    if (oracle >= 2) return p > 0 && p < 0.005 ? '<1%' : `${Math.round(p * 100)}%`;
    if (oracle === 1) return p > 0 && p < 0.05 ? '<10%' : `~${Math.round(p * 10) * 10}%`;
    return null;
  };
  return {
    win: winLabel(odds.win),
    winPct: fmt(odds.win),
    injury: riskLabel(odds.injury, { high: 0.5, some: 0.25 }),
    injuryPct: fmt(odds.injury),
    death: riskLabel(odds.death, { high: 0.1, some: 0.02 }),
    deathPct: fmt(odds.death),
  };
}
