// Probe: careful-bot careers with chosen bot options and tunables, on every core but one (scripts/pool.js). Usage:
//   node scripts/probes/bot-options.js '<bot opts JSON>' '<tunables JSON>' [careers=120] [label] [first seed=1; the check uses 1000]
// Tunables are paths into src/data.js, e.g. '{"KINDS.basa.basePower": 5, "BET.cut": 0.85}'.
// Example: node scripts/probes/bot-options.js '{"bet": false, "lounge": false}' '{}' 150 "no bets, no Lounge"
import { runJobs, progress } from '../pool.js';
import { careerXp } from '../../src/legacy.js';

const [optsJson = '{}', tuneJson = '{}', n = '120', label = '', first = '1'] = process.argv.slice(2);
const opts = JSON.parse(optsJson);
const N = Number(n);
const jobs = Array.from({ length: N }, (_, i) => ({ type: 'career', group: label || 'careers', seed: Number(first) + i, strategy: 'careful', opts: { oddsSamples: 100, ...opts } }));
const bar = progress('', { every: Math.max(10, Math.round(N / 5)) });
bar.expect(jobs);
const results = await runJobs(jobs, { tunables: JSON.parse(tuneJson), onDone: bar.tick });
let won = 0, deaths = 0, weeks = 0, gold = 0, bets = 0, betGold = 0, hosted = 0, policies = 0;
for (const r of results) {
  won += r.won; deaths += r.deaths; weeks += r.weeks; gold += r.run.gold;
  for (const h of r.run.history) if (h.bet) { bets++; betGold += h.bet.won ? h.bet.payout - h.bet.stake : -h.bet.stake; }
  hosted += r.run.log.filter((l) => /^Senators dine/.test(l.text)).length;
  policies += r.run.log.filter((l) => /^The Senate passes/.test(l.text)).length;
}
const f = (x) => (x / N).toFixed(2);
const wonR = results.filter((r) => r.won);
const wonMonths = wonR.length ? (wonR.reduce((t, r) => t + r.fightMonths, 0) / wonR.length).toFixed(1) : '-';
console.log(`${label || optsJson + ' ' + tuneJson}: careful win ${(100 * won / N).toFixed(0)}%  won in ${wonMonths} fight months  deaths ${f(deaths)}  weeks ${(weeks / N).toFixed(0)}  bets ${f(bets)} (net ${f(betGold)} Gold)  hosted ${f(hosted)}  policies ${f(policies)}  Legacy XP ${(results.reduce((t, r) => t + careerXp(r.run).total, 0) / N).toFixed(0)}`);
const endings = {};
for (const r of results) { const k = r.run.ending ?? r.run.plot?.ended ?? (r.won ? 'won' : 'lost'); endings[k] = (endings[k] ?? 0) + 1; }
console.log(`  endings: ${Object.entries(endings).map(([k, v]) => `${k} ${Math.round((100 * v) / N)}%`).join(', ')}`);
