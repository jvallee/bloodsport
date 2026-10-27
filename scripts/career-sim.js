// Whole-career balance report. Usage: node scripts/career-sim.js [careers]
// Targets (docs/roadmap.md §4): sensible beats greedy; sensible wins 30–50%; 1–3 deaths per career.

import { playCareer } from './bots.js';

const N = Number(process.argv[2]) || 200;
const pct = (x) => `${(x * 100).toFixed(0)}%`;
const avg = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;

for (const strategy of ['sensible', 'greedy']) {
  const results = Array.from({ length: N }, (_, i) => playCareer(1000 + i, strategy));
  const wins = results.filter((r) => r.won);
  const tiers = [1, 2, 3, 4, 5].map((t) => results.filter((r) => r.tier >= t).length / N);
  const reasons = {};
  for (const r of results.filter((x) => !x.won)) {
    const key = r.status === 'active' ? 'Timed out' : /Strikes/.test(r.endReason) ? 'Three Strikes' : 'No fighters or Gold';
    reasons[key] = (reasons[key] ?? 0) + 1;
  }
  console.log(`\n${strategy.toUpperCase()} bot, ${N} careers`);
  console.log(`  Career win rate     ${pct(wins.length / N)}`);
  console.log(`  Reached tier 2/3/4/Grand  ${tiers.slice(1).map(pct).join(' / ')}`);
  console.log(`  Weeks per career    ${avg(results.map((r) => r.weeks)).toFixed(0)} (winners ${wins.length ? avg(wins.map((r) => r.weeks)).toFixed(0) : '-'})`);
  console.log(`  Bouts per career    ${avg(results.map((r) => r.bouts)).toFixed(1)}  (fought ${avg(results.map((r) => r.fought)).toFixed(1)})`);
  console.log(`  Deaths per career   ${avg(results.map((r) => r.deaths)).toFixed(2)}`);
  console.log(`  Strikes per career  ${avg(results.map((r) => r.strikes)).toFixed(2)}`);
  console.log(`  Losses by cause     ${JSON.stringify(reasons)}`);
}
