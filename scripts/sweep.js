// Sweep balance levers and print a table. Mutates the in-memory tables only; nothing is saved.
// Usage: node scripts/sweep.js [careers]         difficulty: opponent Power per tier × Favor lost per Boss loss
//        node scripts/sweep.js --evasion         evasion strength vs the balanced-fighter gate

import { CIRCUITS, GRAND, FAVOR, EVASION, TRIBUTE, ECONOMY } from '../src/data.js';
import { playCareer } from './bots.js';
import { speedSplit } from './checks.js';

if (process.argv.includes('--scout')) {
  // Scouted cap (opponent Power per consecutive top-arena month, max) × Favor start. Same seeds as the gates.
  const n = Number(process.argv.find((a) => /^\d+$/.test(a))) || 150;
  const saved = [ECONOMY.scoutedMax, TRIBUTE.perYear];
  console.log(`scouted max | tribute/yr | careful win | careful deaths | reckless win | reckless deaths   (${n} careers)`);
  for (const max of [0, 1, 2, 3]) {
    for (const per of [15, 20]) {
      ECONOMY.scoutedMax = max;
      TRIBUTE.perYear = per;
      const c = Array.from({ length: n }, (_, i) => playCareer(1000 + i, 'careful'));
      const r = Array.from({ length: n }, (_, i) => playCareer(1000 + i, 'reckless'));
      const w = (rs) => `${Math.round((100 * rs.filter((x) => x.won).length) / n)}%`;
      const d = (rs) => (rs.reduce((s, x) => s + x.deaths, 0) / rs.length).toFixed(2);
      console.log(`${String(max).padStart(11)} | ${String(per).padStart(10)} | ${w(c).padStart(11)} | ${d(c).padStart(14)} | ${w(r).padStart(12)} | ${d(r).padStart(15)}`);
    }
  }
  [ECONOMY.scoutedMax, TRIBUTE.perYear] = saved;
  process.exit(0);
}

if (process.argv.includes('--favor')) {
  // Difficulty without changing any matchup: starting Favor × yearly tribute. Same seeds as the gates.
  const n = Number(process.argv.find((a) => /^\d+$/.test(a))) || 150;
  const saved = [FAVOR.start, TRIBUTE.perYear];
  console.log(`start Favor | tribute/yr | careful win | careful deaths | reckless deaths   (${n} careers)`);
  for (const start of [50, 45, 40]) {
    for (const per of [15, 20, 25]) {
      FAVOR.start = start;
      TRIBUTE.perYear = per;
      const c = Array.from({ length: n }, (_, i) => playCareer(1000 + i, 'careful'));
      const r = Array.from({ length: n }, (_, i) => playCareer(1000 + i, 'reckless'));
      const avgD = (rs) => (rs.reduce((s, x) => s + x.deaths, 0) / rs.length).toFixed(2);
      console.log(`${String(start).padStart(11)} | ${String(per).padStart(10)} | ${`${Math.round((100 * c.filter((x) => x.won).length) / n)}%`.padStart(11)} | ${avgD(c).padStart(14)} | ${avgD(r).padStart(15)}`);
    }
  }
  [FAVOR.start, TRIBUTE.perYear] = saved;
  process.exit(0);
}

if (process.argv.includes('--evasion')) {
  const saved = { ...EVASION };
  console.log('per point | max | best Speed share per Boss (T1..T4)          | balanced');
  for (const per of [3000, 4000, 5000, 6000]) {
    for (const max of [15000, 20000, 25000]) {
      Object.assign(EVASION, { perPoint: per, max });
      const s = speedSplit({ n: 2500 });
      console.log(`${String(per / 1000).padStart(8)}% | ${String(max / 1000).padStart(2)}% | ${s.rows.map((r) => `${Math.round(r.best.share * 100)}% (${r.best.speedPoints}/${r.points})`).join('  ').padEnd(44)} | ${s.balanced}/4`);
    }
  }
  Object.assign(EVASION, saved);
  process.exit(0);
}

const N = Number(process.argv.find((a) => /^\d+$/.test(a))) || 80;
const base = CIRCUITS.map((c) => [...c.oppPower]);
const baseGrand = GRAND.oppPower;
const baseLoss = FAVOR.bossLoss;
const avg = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
const pct = (x) => `${Math.round(x * 100)}%`.padStart(4);

console.log('powerUp per tier | bossLoss | careful win | careful deaths | reckless win | reckless deaths');
const tiers = process.argv.includes('--fine') ? [[0, 0, 0, 0], [0, 0, 0, 1], [0, 0, 1, 1], [0, 1, 1, 1]] : [[0, 0, 0, 0], [0, 1, 1, 2], [1, 1, 2, 2], [1, 2, 2, 3]];
const losses = process.argv.includes('--fine') ? [FAVOR.bossLoss, FAVOR.bossLoss - 5] : [-20, -25];
console.log(`Opponent Power added on top of the current table; ${N} careers per row`);
for (const perTier of tiers) {
  for (const loss of losses) {
    CIRCUITS.forEach((c, i) => { c.oppPower = base[i].map((p) => p + perTier[i]); });
    GRAND.oppPower = baseGrand + perTier[3];
    FAVOR.bossLoss = loss;
    const careful = Array.from({ length: N }, (_, i) => playCareer(2000 + i, 'careful'));
    const reckless = Array.from({ length: N }, (_, i) => playCareer(2000 + i, 'reckless'));
    const r = (rs) => rs.filter((x) => x.won).length / rs.length;
    console.log(`${JSON.stringify(perTier).padEnd(16)} | ${String(loss).padStart(8)} | ${pct(r(careful)).padStart(11)} | ${avg(careful.map((x) => x.deaths)).toFixed(2).padStart(14)} | ${pct(r(reckless)).padStart(12)} | ${avg(reckless.map((x) => x.deaths)).toFixed(2).padStart(15)}`);
  }
}
CIRCUITS.forEach((c, i) => { c.oppPower = base[i]; });
GRAND.oppPower = baseGrand;
FAVOR.bossLoss = baseLoss;
