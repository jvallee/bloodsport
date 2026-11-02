// Probe: careful-bot careers with chosen bot options and tunables. Usage:
//   node scripts/probes/bot-options.js '<bot opts JSON>' '<tunables JSON>' [careers=120] [label] [first seed=1; the check uses 1000]
// Tunables are paths into src/data.js, e.g. '{"KINDS.basa.basePower": 5, "BET.cut": 0.85}'.
// Example: node scripts/probes/bot-options.js '{"bet": false, "lounge": false}' '{}' 150 "no bets, no Lounge"
import { playCareer } from '../bots.js';
import * as D from '../../src/data.js';

const [optsJson = '{}', tuneJson = '{}', n = '120', label = '', first = '1'] = process.argv.slice(2);
for (const [path, value] of Object.entries(JSON.parse(tuneJson))) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((o, k) => o[k], D)[last] = value;
}
const opts = JSON.parse(optsJson);
const N = Number(n);
let won = 0, deaths = 0, weeks = 0, gold = 0, bets = 0, betGold = 0, hosted = 0, policies = 0;
for (let seed = Number(first); seed < Number(first) + N; seed++) {
  const r = playCareer(seed, 'careful', { oddsSamples: 100, ...opts });
  won += r.won; deaths += r.deaths; weeks += r.weeks; gold += r.run.gold;
  for (const h of r.run.history) if (h.bet) { bets++; betGold += h.bet.won ? h.bet.payout - h.bet.stake : -h.bet.stake; }
  hosted += r.run.log.filter((l) => /^Senators dine/.test(l.text)).length;
  policies += r.run.log.filter((l) => /^The Senate passes/.test(l.text)).length;
}
const f = (x) => (x / N).toFixed(2);
console.log(`${label || optsJson + ' ' + tuneJson}: careful win ${(100 * won / N).toFixed(0)}%  deaths ${f(deaths)}  weeks ${(weeks / N).toFixed(0)}  bets ${f(bets)} (net ${f(betGold)} Gold)  hosted ${f(hosted)}  policies ${f(policies)}`);
