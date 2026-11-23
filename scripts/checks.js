// Balance gates. Each check returns { name, pass, detail }. Used by `npm run career -- --check`.
// Targets come from docs/roadmap-v2.md (B2 and C4).

import { CIRCUITS, TRAIN_GAIN, SHORT, DECOR } from '../src/data.js';
import { estimateOdds } from '../src/odds.js';
import { createFighter } from '../src/run.js';
import { careerXp, levelCost, ALL_UNLOCKS } from '../src/legacy.js';
import { createRng } from '../src/rng.js';
import { createMatch, autoPlay, suggestTactic } from '../src/fight.js';

const avg = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;

// B2 (v7 Season): is a balanced fighter ever best? For each Season Boss, split the Trainer cap between Power (+2/wk)
// and Speed (+6/wk) and score each split by: win chance − 0.5 × injury chance − 5 × death chance.
// `only`: one Boss's index, so the gates can run the four in parallel (each has its own seeds; see mergeSplits).
export function speedSplit({ n = 3000, only = null } = {}) {
  const caps = [3, 5, 8, 13];
  const pGain = Math.round(TRAIN_GAIN.power * SHORT.train);
  const sGain = Math.round(TRAIN_GAIN.speed * SHORT.train);
  const rows = CIRCUITS.map((c, i) => {
    if (only !== null && i !== only) return null;
    const points = caps[i];
    const titles = i;
    const bossPower = c.oppPower[2] + (SHORT.oppPower[i] ?? 0);
    const basePower = 5 + (c.marketPower ?? 0) + (SHORT.marketPower?.[i] ?? 0) + titles;
    const rng = createRng(500 + i);
    const opp = createFighter(rng, { id: 'o', power: bossPower });
    opp.kindTrait = null; opp.cls = null; opp.weapon = null;
    opp.speed = 3 + c.tier;
    const splits = [];
    for (let k = 0; k <= points; k++) {
      const f = createFighter(rng, { id: 'p', kind: 'human' });
      f.kindTrait = null; f.cls = null; f.weapon = null;
      f.power = basePower + (points - k) * pGain;
      f.speed = 3 + k * sGain;
      const o = estimateOdds(f, opp, { n, seed: 900 + k });
      splits.push({ speedPoints: k, share: k / points, ...o, value: o.win - 0.5 * o.injury - 5 * o.death });
    }
    const best = splits.reduce((a, b) => (b.value > a.value ? b : a));
    return { boss: c.name, points, best, splits };
  }).filter(Boolean);
  return splitSummary(rows);
}

const splitSummary = (rows) => {
  // At Season training rates (+2 Power / +6 Speed per week), 1–2 Speed weeks (12–50% of cap) is a balanced interior optimum.
  const balanced = rows.filter((r) => r.best.share >= 0.12 && r.best.share <= 0.5).length;
  return { rows, balanced };
};

// Joins per-Boss speedSplit results (in Boss order) into one.
export const mergeSplits = (parts) => splitSummary(parts.flatMap((p) => p.rows));

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

const SEASON = { short: true };
const FULL_LEGACY = { ...SEASON, unlocks: ALL_UNLOCKS, patron: 'augur' };

// Every career and simulation the gates need, as jobs for scripts/pool.js (all seeded: the order of play doesn't matter).
export function gateJobs({ careers = 200, quick = false } = {}) {
  const plotN = Math.max(quick ? 25 : 50, Math.round(careers / 2));
  const oddsOpts = quick ? { oddsSamples: 50 } : {};
  const group = (name, n, strategy, opts = {}) => Array.from({ length: n }, (_, i) => ({ type: 'career', group: name, seed: 1000 + i, strategy, opts: { ...oddsOpts, ...opts } }));
  return [
    // The two long simulations first, so they don't finish last on their own.
    ...CIRCUITS.map((_, i) => ({ type: 'split', group: 'split', opts: { n: quick ? 800 : 3000, only: i } })),
    { type: 'tactics', group: 'tactics', opts: { n: quick ? 1500 : 4000 } },
    // v6/v7: Seasons are the default career; Long Road keeps a gate of its own.
    ...group('careful', careers, 'careful', { setup: SEASON }),
    ...group('reckless', careers, 'reckless', { setup: SEASON }),
    ...group('rebel', plotN, 'careful', { plot: 'rebel', setup: SEASON }),
    ...group('loyalist', plotN, 'careful', { plot: 'loyalist', setup: SEASON }),
    ...group('long', plotN, 'careful', { setup: { short: false } }),
    // Full Legacy at Heat 0, Heat 1, and Heat 3 (same seeds so seed luck cancels out).
    ...group('legacy', plotN, 'careful', { setup: FULL_LEGACY }),
    ...group('heat1', plotN, 'careful', { setup: { ...FULL_LEGACY, heat: 1 } }),
    ...group('heat3', plotN, 'careful', { setup: { ...FULL_LEGACY, heat: 3 } }),
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
  return gatesFrom({
    careful: of('careful'), reckless: of('reckless'), rebel: of('rebel'), loyalist: of('loyalist'),
    long: of('long'), legacy: of('legacy'), heat1: of('heat1'), heat3: of('heat3'),
    split: mergeSplits(of('split')), tactics: of('tactics')[0],
  });
}

export function gatesFrom({ careful, reckless, rebel, loyalist, long, legacy, heat1 = [], heat3 = [], split, tactics }) {
  const rate = (rs) => rs.filter((r) => r.won).length / rs.length;
  const deaths = (rs) => avg(rs.map((r) => r.deaths));
  const curve = bossCurve(careful);
  const ending = (rs, e) => rs.filter((r) => r.run.ending === e).length / rs.length;
  const weeks = (rs) => avg(rs.map((r) => r.weeks));
  const winWeeks = (rs) => { const won = rs.filter((r) => r.won); return won.length ? avg(won.map((r) => r.weeks)) : weeks(rs); };
  const sameSeeds = careful.slice(0, loyalist.length);
  const meanXp = avg(careful.map((r) => careerXp(r.run).total));
  const wonMonths = careful.filter((r) => r.won).length ? avg(careful.filter((r) => r.won).map((r) => r.fightMonths)) : 99;
  const dead = careful.reduce((n, r) => n + r.deadMonths, 0) / Math.max(1, careful.reduce((n, r) => n + r.months, 0));
  const pool = [...careful, ...legacy];
  const wins = pool.filter((r) => r.won);
  const losses = pool.filter((r) => !r.won);
  const share = (rs, id) => (rs.length ? rs.filter((r) => r.relics.includes(id)).length / rs.length : 0);
  const relicIds = [...new Set(wins.flatMap((r) => r.relics))];
  const [topRelic, topShare] = relicIds.map((id) => [id, share(wins, id)]).sort((a, b) => b[1] - a[1])[0] ?? ['none', 0];
  const [liftRelic, topLift] = relicIds.map((id) => [id, share(wins, id) - share(losses, id)]).sort((a, b) => b[1] - a[1])[0] ?? ['none', 0];
  const perLevel = [1, 2, 3, 4, 5].reduce((s, l) => s + levelCost(l), 0) / 5 / meanXp;
  // 7.1: no Temperament piece is in more than 55% of winning careful houses (none becomes mandatory).
  const wonCareful = careful.filter((r) => r.won);
  const holds = (r, k) => r.run.roster.some((f) => f.decor?.[k] > 0);
  const [topDecor, decorShare] = Object.keys(DECOR).filter((k) => DECOR[k].group === 'temperament')
    .map((k) => [k, wonCareful.length ? wonCareful.filter((r) => holds(r, k)).length / wonCareful.length : 0]).sort((a, b) => b[1] - a[1])[0];
  const gates = [
    { name: 'First career: careful win rate is 15–35%', value: rate(careful), pass: rate(careful) >= 0.15 && rate(careful) <= 0.35, fmt: 'pct' },
    { name: 'Full Legacy: careful win rate is 40–60%', value: rate(legacy), pass: rate(legacy) >= 0.4 && rate(legacy) <= 0.6, fmt: 'pct' },
    { name: 'Unlock cadence: each of the first five Legacy levels takes 1–2 careers', value: perLevel, pass: perLevel >= 1 && perLevel <= 2, fmt: 'num' },
    { name: 'Careful wins at least as often as reckless', value: rate(careful) - rate(reckless), pass: rate(careful) >= rate(reckless), fmt: 'pctDiff' },
    { name: 'Careful loses clearly fewer fighters than reckless', value: deaths(careful) / Math.max(0.01, deaths(reckless)), pass: deaths(careful) <= 0.5 * deaths(reckless), fmt: 'ratio' },
    { name: 'Reckless loses 1–4 fighters per career', value: deaths(reckless), pass: deaths(reckless) >= 1 && deaths(reckless) <= 4, fmt: 'num' },
    { name: 'Balanced fighter (12–50% Speed in Season) is best vs at least 2 of 4 Bosses', value: split.balanced, pass: split.balanced >= 2, fmt: 'count' },
    { name: 'Gentle start: the first Boss is won at least 55% of the time', value: curve[1] ?? 0, pass: (curve[1] ?? 0) >= 0.55, fmt: 'pct' },
    { name: 'Tactics matter: reading the opponent beats always-Steady by 3–15 points a match', value: tactics.smart - tactics.steady, pass: tactics.smart - tactics.steady >= 0.03 && tactics.smart - tactics.steady <= 0.15, fmt: 'pctDiff' },
    { name: 'No dominant tactic: always-Press does worse than reading the opponent', value: tactics.smart - tactics.press, pass: tactics.press < tactics.smart, fmt: 'pctDiff' },
    { name: 'Tough finish: the Grand Tournament is 10+ points harder than the first Boss', value: (curve[1] ?? 0) - (curve[5] ?? 1), pass: (curve[1] ?? 0) - (curve[5] ?? 1) >= 0.1, fmt: 'pctDiff' },
    { name: 'The evil road is easier: the loyalist wins 5–20 points more often than careful (same seeds)', value: rate(loyalist) - rate(sameSeeds), pass: rate(loyalist) - rate(sameSeeds) >= 0.05 && rate(loyalist) - rate(sameSeeds) <= 0.2, fmt: 'pctDiff' },
    { name: 'The coup is rare but real: 5–25% of rebel careers', value: ending(rebel, 'coup'), pass: ending(rebel, 'coup') >= 0.05 && ending(rebel, 'coup') <= 0.25, fmt: 'pct' },
    { name: 'The Long Road is winnable (careful 15–45%) and a won season is at least a fifth quicker', value: rate(long), pass: rate(long) >= 0.15 && rate(long) <= 0.45 && winWeeks(careful) <= 0.8 * winWeeks(long), fmt: 'pct' },
    { name: 'Season length: a won season takes 12–20 fight months', value: wonMonths, pass: wonMonths >= 12 && wonMonths <= 20, fmt: 'num' },
    { name: 'Dead turns: under 15% of fight months end with nothing new', value: dead, pass: dead < 0.15, fmt: 'pct' },
    { name: `No dominant Temperament decor: none is in more than 55% of winning careful houses (most: ${DECOR[topDecor].name})`, value: decorShare, pass: decorShare <= 0.55, fmt: 'pct' },
    { name: `No dominant relic: none is held in 20+ points more of won careers than of lost ones (top: ${liftRelic}; most held: ${topRelic}, ${Math.round(100 * topShare)}% of wins)`, value: topLift, pass: topLift < 0.2, fmt: 'pctDiff' },
    { name: 'Treason stays rare: under 10% of rebel careers', value: ending(rebel, 'treason'), pass: ending(rebel, 'treason') < 0.1, fmt: 'pct' },
    ...(heat1.length ? [{ name: 'Heat 1 bites: Full Legacy at Heat 1 wins 5+ points less often than at Heat 0 (same seeds)', value: rate(legacy) - rate(heat1), pass: rate(legacy) - rate(heat1) >= 0.05 && rate(heat1) >= 0.15, fmt: 'pctDiff' }] : []),
    ...(heat3.length ? [{ name: 'Heat 3 climbs further yet stays winnable: tougher than Heat 1 and at least 8% win rate', value: rate(heat3), pass: rate(heat3) < rate(heat1) && rate(heat3) >= 0.08, fmt: 'pct' }] : []),
  ];
  return { gates, careful, reckless, split, curve, tactics, rebel, loyalist, long, legacy, heat1, heat3, meanXp, wonMonths, dead };
}
