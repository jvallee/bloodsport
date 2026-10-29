// Whole-career balance report. Usage: node scripts/career-sim.js [careers] [--check]
// With --check, exits non-zero unless every gate in scripts/checks.js passes (targets: docs/roadmap-v2.md).

import { runGates } from './checks.js';

const args = process.argv.slice(2);
const check = args.includes('--check');
const N = Number(args.find((a) => /^\d+$/.test(a))) || 200;
const pct = (x) => `${(x * 100).toFixed(0)}%`;
const avg = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;

const { gates, careful, reckless, split, rebel, loyalist } = runGates({ careers: N });

for (const [name, results] of [['CAREFUL', careful], ['RECKLESS', reckless]]) {
  const wins = results.filter((r) => r.won);
  const tiers = [2, 3, 4, 5].map((t) => results.filter((r) => r.tier >= t || r.won).length / results.length);
  const reasons = {};
  for (const r of results.filter((x) => !x.won)) {
    const key = r.status === 'active' ? 'Timed out' : /Favor/.test(r.endReason) ? 'Executed (Favor)' : /revolt/.test(r.endReason) ? 'Revolt' : 'No fighters or Gold';
    reasons[key] = (reasons[key] ?? 0) + 1;
  }
  console.log(`\n${name} bot, ${results.length} careers`);
  console.log(`  Career win rate     ${pct(wins.length / results.length)}`);
  console.log(`  Reached tier 2/3/4/Grand  ${tiers.map(pct).join(' / ')}`);
  console.log(`  Weeks per career    ${avg(results.map((r) => r.weeks)).toFixed(0)} (winners ${wins.length ? avg(wins.map((r) => r.weeks)).toFixed(0) : '-'})`);
  console.log(`  Top-arena bouts     ${avg(results.map((r) => r.bouts)).toFixed(1)}  (matches fought ${avg(results.map((r) => r.fought)).toFixed(1)})`);
  console.log(`  Deaths per career   ${avg(results.map((r) => r.deaths)).toFixed(2)}`);
  console.log(`  Final Favor (avg)   ${avg(results.map((r) => r.favor)).toFixed(0)}`);
  console.log(`  Losses by cause     ${JSON.stringify(reasons)}`);
}

console.log('\nBest Power/Speed split per Boss (value = win − 0.5×injury − 5×death)');
for (const r of split.rows) {
  console.log(`  ${r.boss.padEnd(24)} ${r.points} pts → best: ${r.best.speedPoints} Speed pts (${pct(r.best.share)})  win ${pct(r.best.win)} injured ${pct(r.best.injury)} death ${(r.best.death * 100).toFixed(1)}%`);
}

const fmt = (g) => ({ pct: pct(g.value), pctDiff: `${g.value >= 0 ? '+' : ''}${(g.value * 100).toFixed(0)} pts`, ratio: `${g.value.toFixed(2)}×`, num: g.value.toFixed(2), count: `${g.value}/4` })[g.fmt];
// v6: how the plot's careers end.
const endings = (rs) => Object.entries(rs.reduce((o, r) => ({ ...o, [r.run.ending ?? (r.won ? 'won' : 'lost')]: (o[r.run.ending ?? (r.won ? 'won' : 'lost')] ?? 0) + 1 }), {})).map(([k, n]) => `${k} ${Math.round((100 * n) / rs.length)}%`).join(', ');
console.log(`\nThe hidden plot (${rebel.length} careers each)\n  Rebel     ${endings(rebel)}\n  Loyalist  ${endings(loyalist)}`);
console.log('\nGates');
for (const g of gates) console.log(`  ${g.pass ? 'PASS' : 'FAIL'}  ${g.name}: ${fmt(g)}`);
if (check && gates.some((g) => !g.pass)) {
  console.log('\nBalance check failed.');
  process.exit(1);
}
