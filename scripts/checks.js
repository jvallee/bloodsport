// Balance gates. Each check returns { name, pass, detail }. Used by `npm run career -- --check`.
// Targets come from docs/roadmap-v2.md (B2 and C4).

import { CIRCUITS, TRAIN_GAIN } from '../src/data.js';
import { estimateOdds } from '../src/odds.js';
import { createFighter } from '../src/run.js';
import { createRng } from '../src/rng.js';
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
      f.power = 5 + titles + (points - k) * TRAIN_GAIN.power;
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

export function runGates({ careers = 200, quick = false } = {}) {
  const careful = Array.from({ length: careers }, (_, i) => playCareer(1000 + i, 'careful'));
  const reckless = Array.from({ length: careers }, (_, i) => playCareer(1000 + i, 'reckless'));
  const rate = (rs) => rs.filter((r) => r.won).length / rs.length;
  const deaths = (rs) => avg(rs.map((r) => r.deaths));
  const split = speedSplit({ n: quick ? 800 : 3000 });
  const gates = [
    { name: 'Careful career win rate is 30–45%', value: rate(careful), pass: rate(careful) >= 0.3 && rate(careful) <= 0.45, fmt: 'pct' },
    { name: 'Careful wins at least as often as reckless', value: rate(careful) - rate(reckless), pass: rate(careful) >= rate(reckless), fmt: 'pctDiff' },
    { name: 'Careful loses clearly fewer fighters than reckless', value: deaths(careful) / Math.max(0.01, deaths(reckless)), pass: deaths(careful) <= 0.5 * deaths(reckless), fmt: 'ratio' },
    { name: 'Reckless loses 1–3 fighters per career', value: deaths(reckless), pass: deaths(reckless) >= 1 && deaths(reckless) <= 3, fmt: 'num' },
    { name: 'Balanced fighter (25–60% Speed) is best vs at least 2 of 4 Bosses', value: split.balanced, pass: split.balanced >= 2, fmt: 'count' },
  ];
  return { gates, careful, reckless, split };
}
