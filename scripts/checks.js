// Balance gates. Each check returns { name, pass, detail }. Used by `npm run career -- --check`.
// Targets come from docs/roadmap-v2.md (B2 and C4).

import { CIRCUITS, TRAIN_GAIN } from '../src/data.js';
import { estimateOdds } from '../src/odds.js';
import { createFighter } from '../src/run.js';
import { careerXp, levelCost, ALL_UNLOCKS } from '../src/legacy.js';
import { createRng } from '../src/rng.js';
import { createMatch, autoPlay, suggestTactic } from '../src/fight.js';

const avg = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;

// B2: is a balanced fighter ever best? For each Boss, split the Trainer cap between Power and Speed and score
// each split by: win chance − 0.5 × injury chance − 5 × death chance (injuries cost Medbay weeks; deaths cost fighters).
export function speedSplit({ n = 3000 } = {}) {
  const caps = [3, 5, 8, 13];
  // Version 6: the Bosses fight harder to match the Fortune draft's gear and relics, which this model fighter doesn't have.
  // It keeps the 5.4 gap to each Boss instead (the draft's share is the difference), so the question stays the same.
  const v5Boss = [7, 13, 19, 28];
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
      f.power = 5 + (c.marketPower ?? 0) + titles + (c.oppPower[2] - v5Boss[i]) + (points - k) * TRAIN_GAIN.power; // a fighter bought at this tier starts stronger
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

// Every career and simulation the gates need, as jobs for scripts/pool.js (all seeded: the order of play doesn't matter).
export function gateJobs({ careers = 200, quick = false } = {}) {
  // v6, the hidden plot: bots that play it (half as many careers, to keep the check quick). Short careers likewise.
  const plotN = Math.max(50, Math.round(careers / 2));
  const group = (name, n, strategy, opts = {}) => Array.from({ length: n }, (_, i) => ({ type: 'career', group: name, seed: 1000 + i, strategy, opts }));
  return [
    // The two long simulations first, so they don't finish last on their own.
    { type: 'split', group: 'split', opts: { n: quick ? 800 : 3000 } },
    { type: 'tactics', group: 'tactics', opts: { n: quick ? 1500 : 4000 } },
    ...group('careful', careers, 'careful'),
    ...group('reckless', careers, 'reckless'),
    ...group('rebel', plotN, 'careful', { plot: 'rebel' }),
    ...group('loyalist', plotN, 'careful', { plot: 'loyalist' }),
    ...group('short', plotN, 'careful', { setup: { short: true } }), // fun idea #2: winnable, and quicker than a full one
    // Version 6 (docs/plan-v6-phase3.md): every group above plays a first career; this one has every Legacy unlock.
    ...group('legacy', plotN, 'careful', { setup: { unlocks: ALL_UNLOCKS, patron: 'augur' } }),
  ];
}

// Runs the gates on every core but one (scripts/pool.js), printing progress to stderr. Same numbers as one by one.
export async function runGates({ careers = 200, quick = false, tunables = {} } = {}) {
  const { runJobs, progress } = await import('./pool.js');
  const jobs = gateJobs({ careers, quick });
  const bar = progress('Gates: ');
  bar.expect(jobs);
  const results = await runJobs(jobs, { tunables, onDone: bar.tick });
  const of = (g) => results.filter((_, i) => jobs[i].group === g);
  return gatesFrom({ careful: of('careful'), reckless: of('reckless'), rebel: of('rebel'), loyalist: of('loyalist'), short: of('short'), legacy: of('legacy'), split: of('split')[0], tactics: of('tactics')[0] });
}

export function gatesFrom({ careful, reckless, rebel, loyalist, short, legacy, split, tactics }) {
  const rate = (rs) => rs.filter((r) => r.won).length / rs.length;
  const deaths = (rs) => avg(rs.map((r) => r.deaths));
  const curve = bossCurve(careful);
  const ending = (rs, e) => rs.filter((r) => r.run.ending === e).length / rs.length;
  const weeks = (rs) => avg(rs.map((r) => r.weeks));
  // Version 6: how long a WON career takes. Harder arenas end losing careers sooner, which made the all-careers average
  // say little about how quick a season is (docs/fight-rules.md, 6.0.0-alpha.2).
  const winWeeks = (rs) => { const won = rs.filter((r) => r.won); return won.length ? avg(won.map((r) => r.weeks)) : weeks(rs); };
  // Unlock cadence: careers per Legacy level over the first five levels, from the careful bot's first-career XP.
  const sameSeeds = careful.slice(0, loyalist.length); // careful's careers on the loyalist's seeds (1000 + i, in order)
  const meanXp = avg(careful.map((r) => careerXp(r.run).total));
  const perLevel = [1, 2, 3, 4, 5].reduce((s, l) => s + levelCost(l), 0) / 5 / meanXp;
  const gates = [
    // Version 6, phase 3: the careful bot plays a first career (no unlocks); 20–45% became 15–35% (docs/plan-v6-one-more-career.md).
    { name: 'First career: careful win rate is 15–35%', value: rate(careful), pass: rate(careful) >= 0.15 && rate(careful) <= 0.35, fmt: 'pct' },
    { name: 'Full Legacy: careful win rate is 40–60%', value: rate(legacy), pass: rate(legacy) >= 0.4 && rate(legacy) <= 0.6, fmt: 'pct' },
    { name: 'Unlock cadence: each of the first five Legacy levels takes 1–2 careers', value: perLevel, pass: perLevel >= 1 && perLevel <= 2, fmt: 'num' },
    { name: 'Careful wins at least as often as reckless', value: rate(careful) - rate(reckless), pass: rate(careful) >= rate(reckless), fmt: 'pctDiff' },
    { name: 'Careful loses clearly fewer fighters than reckless', value: deaths(careful) / Math.max(0.01, deaths(reckless)), pass: deaths(careful) <= 0.5 * deaths(reckless), fmt: 'ratio' },
    { name: 'Reckless loses 1–4 fighters per career', value: deaths(reckless), pass: deaths(reckless) >= 1 && deaths(reckless) <= 4, fmt: 'num' },
    { name: 'Balanced fighter (25–60% Speed) is best vs at least 2 of 4 Bosses', value: split.balanced, pass: split.balanced >= 2, fmt: 'count' },
    { name: 'Gentle start: the first Boss is won at least 55% of the time', value: curve[1] ?? 0, pass: (curve[1] ?? 0) >= 0.55, fmt: 'pct' },
    { name: 'Tactics matter: reading the opponent beats always-Steady by 3–15 points a match', value: tactics.smart - tactics.steady, pass: tactics.smart - tactics.steady >= 0.03 && tactics.smart - tactics.steady <= 0.15, fmt: 'pctDiff' },
    { name: 'No dominant tactic: always-Press does worse than reading the opponent', value: tactics.smart - tactics.press, pass: tactics.press < tactics.smart, fmt: 'pctDiff' },
    { name: 'Tough finish: the Grand Tournament is 10+ points harder than the first Boss', value: (curve[1] ?? 0) - (curve[5] ?? 1), pass: (curve[1] ?? 0) - (curve[5] ?? 1) >= 0.1, fmt: 'pctDiff' },
    // Version 6, alpha.3: on the same seeds (the plot groups play the first half of careful's seeds), so seed luck cancels out.
    { name: 'The evil road is easier: the loyalist wins 5–20 points more often than careful (same seeds)', value: rate(loyalist) - rate(sameSeeds), pass: rate(loyalist) - rate(sameSeeds) >= 0.05 && rate(loyalist) - rate(sameSeeds) <= 0.2, fmt: 'pctDiff' },
    { name: 'The coup is rare but real: 5–25% of rebel careers', value: ending(rebel, 'coup'), pass: ending(rebel, 'coup') >= 0.05 && ending(rebel, 'coup') <= 0.25, fmt: 'pct' },
    { name: 'Short careers are winnable (careful 20–55%) and a won one is at least a fifth quicker', value: rate(short), pass: rate(short) >= 0.2 && rate(short) <= 0.55 && winWeeks(short) <= 0.8 * winWeeks(careful), fmt: 'pct' },
    { name: 'Treason stays rare: under 10% of rebel careers', value: ending(rebel, 'treason'), pass: ending(rebel, 'treason') < 0.1, fmt: 'pct' },
  ];
  return { gates, careful, reckless, split, curve, tactics, rebel, loyalist, short, legacy, meanXp };
}
