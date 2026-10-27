// Balance gates. Each check returns { name, pass, detail }. Used by `npm run career -- --check`.
// Targets come from docs/roadmap-v2.md (B2 and C4).

import { CIRCUITS, TRAIN_GAIN } from '../src/data.js';
import { estimateOdds } from '../src/odds.js';
import { createFighter } from '../src/run.js';
import { createRng } from '../src/rng.js';
import { createMatch, autoPlay, suggestTactic } from '../src/fight.js';
import { playCareer } from './bots.js';

const avg = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;

// B2: is a balanced fighter ever best? For each Boss, split the Trainer cap between Power and Speed and score
// each split by: win chance − 0.5 × injury chance − 5 × death chance (injuries cost Medbay weeks; deaths cost fighters).
export function speedSplit({ n = 3000 } = {}) {
  const caps = [3, 5, 8, 13];
  const rows = CIRCUITS.map((c, i) => {
    const points = caps[i];
    const titles = i;
    const rng = createRng(500 + i);
    const opp = createFighter(rng, { id: 'o', power: c.oppPower[2] });
    opp.kindTrait = null; opp.cls = null; opp.weapon = null;
    opp.speed = 3 + c.tier;
    const splits = [];
    for (let k = 0; k <= points; k++) {
      const f = createFighter(rng, { id: 'p', kind: 'human' });
      f.kindTrait = null; f.cls = null; f.weapon = null;
      f.power = 5 + (c.marketPower ?? 0) + titles + (points - k) * TRAIN_GAIN.power; // a fighter bought at this tier starts stronger
      f.speed = 3 + k * TRAIN_GAIN.speed;
      const o = estimateOdds(f, opp, { n, seed: 900 + k });
      splits.push({ speedPoints: k, share: k / points, ...o, value: o.win - 0.5 * o.injury - 5 * o.death });
    }
    const best = splits.reduce((a, b) => (b.value > a.value ? b : a));
    return { boss: c.name, points, best, splits };
  });
  const balanced = rows.filter((r) => r.best.share >= 0.25 && r.best.share <= 0.6).length;
  return { rows, balanced };
}

// Phase A: do tactics matter? Equal-Power random fighters (real traits and humors), each match played with
// the same dice by a fighter who reads the opponent (as auto-play does) and by one who always fights Steady / always Presses.
export function tacticsEdge({ n = 4000 } = {}) {
  const rng = createRng(77);
  const wins = { smart: 0, steady: 0, press: 0 };
  for (let i = 0; i < n; i++) {
    const a = createFighter(rng, { id: 'a', power: 8 });
    const b = createFighter(rng, { id: 'b', power: 8 });
    for (const [policy, tactic] of [['smart', suggestTactic], ['steady', () => 'steady'], ['press', () => 'press']]) {
      const m = createMatch({ a, b, rng: createRng(10000 + i) });
      if (autoPlay(m, tactic).winner === 'A') wins[policy]++;
    }
  }
  return { smart: wins.smart / n, steady: wins.steady / n, press: wins.press / n };
}

// Top-arena Boss win rate per attempt, by tier (5 = Grand Tournament).
export function bossCurve(results) {
  const by = {};
  for (const { run } of results) {
    for (const h of run.history) {
      if (!h.boss || !h.top || h.skipped) continue;
      by[h.tier] ??= { n: 0, w: 0 };
      by[h.tier].n++;
      if (h.won) by[h.tier].w++;
    }
  }
  return Object.fromEntries(Object.entries(by).map(([t, v]) => [t, v.w / v.n]));
}

export function runGates({ careers = 200, quick = false } = {}) {
  const careful = Array.from({ length: careers }, (_, i) => playCareer(1000 + i, 'careful'));
  const reckless = Array.from({ length: careers }, (_, i) => playCareer(1000 + i, 'reckless'));
  const rate = (rs) => rs.filter((r) => r.won).length / rs.length;
  const deaths = (rs) => avg(rs.map((r) => r.deaths));
  const split = speedSplit({ n: quick ? 800 : 3000 });
  const curve = bossCurve(careful);
  const tactics = tacticsEdge({ n: quick ? 1500 : 4000 });
  const gates = [
    { name: 'Careful career win rate is 20–45%', value: rate(careful), pass: rate(careful) >= 0.2 && rate(careful) <= 0.45, fmt: 'pct' },
    { name: 'Careful wins at least as often as reckless', value: rate(careful) - rate(reckless), pass: rate(careful) >= rate(reckless), fmt: 'pctDiff' },
    { name: 'Careful loses clearly fewer fighters than reckless', value: deaths(careful) / Math.max(0.01, deaths(reckless)), pass: deaths(careful) <= 0.5 * deaths(reckless), fmt: 'ratio' },
    { name: 'Reckless loses 1–3 fighters per career', value: deaths(reckless), pass: deaths(reckless) >= 1 && deaths(reckless) <= 3, fmt: 'num' },
    { name: 'Balanced fighter (25–60% Speed) is best vs at least 2 of 4 Bosses', value: split.balanced, pass: split.balanced >= 2, fmt: 'count' },
    { name: 'Gentle start: the first Boss is won at least 55% of the time', value: curve[1] ?? 0, pass: (curve[1] ?? 0) >= 0.55, fmt: 'pct' },
    { name: 'Tactics matter: reading the opponent beats always-Steady by 3–15 points a match', value: tactics.smart - tactics.steady, pass: tactics.smart - tactics.steady >= 0.03 && tactics.smart - tactics.steady <= 0.15, fmt: 'pctDiff' },
    { name: 'No dominant tactic: always-Press does worse than reading the opponent', value: tactics.smart - tactics.press, pass: tactics.press < tactics.smart, fmt: 'pctDiff' },
    { name: 'Tough finish: the Grand Tournament is 10+ points harder than the first Boss', value: (curve[1] ?? 0) - (curve[5] ?? 1), pass: (curve[1] ?? 0) - (curve[5] ?? 1) >= 0.1, fmt: 'pctDiff' },
  ];
  return { gates, careful, reckless, split, curve, tactics };
}
