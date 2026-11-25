// Pre-fight odds: simulate the real engine many times on copies. Uses its own RNG,
// so previewing never changes the career's fight rolls. Pure.

import { createRng, deriveSeed } from './rng.js';
import { createMatch, autoPlay, suggestTactic, signatureBlocker, useSignature } from './fight.js';

export function estimateOdds(fighter, opponent, { debuff = null, overtrained = false, scouted = 0, challenger = 0, festival = null, grudge = 0, vengeance = false, boss = false, earlyRound = false, rebels = 0, relics = null, oracle = 0, useSignatures = true, n = 500, seed = 12345, boostsA = null, boostsB = null, vengeanceB = false, ashA = 0 } = {}) {
  const startInjuries = fighter.injuries.filter((i) => i.weight > 0).length;
  let win = 0;
  let hurt = 0;
  let death = 0;
  for (let i = 0; i < n; i++) {
    const rng = createRng(deriveSeed(seed, i));
    const m = createMatch({ a: fighter, b: opponent, rng, debuff, overtrained, scouted, challenger, festival, grudge, vengeance, boss, earlyRound, rebels, relics, oracle, fast: true });
    // A live match's boosts already in place (items used before Round 1, espionage) so a bet is priced on the real fight.
    if (boostsA) m.a.boosts = [...boostsA];
    if (boostsB) m.b.boosts = [...boostsB];
    if (vengeanceB) m.b.vengeance = true;
    if (ashA) m.a.ash = ashA; // Feed the Ash used before Round 1 (7.8.1)
    autoPlay(m, (match) => {
      if (useSignatures && !signatureBlocker(match) && (match.a.f.cls === 'ashHungry' || match.a.roundsWon < match.b.roundsWon || match.round >= 1)) {
        useSignature(match);
      }
      return suggestTactic(match);
    });
    if (m.result.winner === 'A') win++;
    if (!m.a.f.alive) death++;
    else if (m.a.f.injuries.filter((inj) => inj.weight > 0).length > startInjuries) hurt++;
  }
  return { win: win / n, injury: (hurt + death) / n, death: death / n };
}

export function winLabel(p) {
  if (p >= 0.75) return 'Strong favourite';
  if (p >= 0.55) return 'Favoured';
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

// 7.7: the fighter fields a fight reads (src/fight.js, src/fortune.js). The odds cache keys on these, so a job click, a
// week's Stress (which counts only through matchOptions' overtrained flag) or a story line doesn't redo the simulations.
// A field the engine starts reading must be added here (oddsKey) (tests/v77-feel.test.js checks the ones left out).
export const FIGHT_FIELDS = ['id', 'cls', 'alive', 'injuries', 'power', 'level', 'weapon', 'speed', 'kindTrait', 'gear', 'augments', 'titles',
  'perks', 'legend', 'kills', 'humor', 'decor', 'scars', 'risen', 'renown', 'name', 'morale', 'kind', 'revenantOf', 'house', 'rivalChampion'];
export const oddsKey = (f) => JSON.stringify(FIGHT_FIELDS.map((k) => f[k]));
