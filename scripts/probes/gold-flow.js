// Probe: Gold held by careful bots, by top arena tier (starved under 5, hoarding over 60).
// Defaults to Season mode ({ short: true }); pass --long for Long Road.
// Usage: node scripts/probes/gold-flow.js [careers=60] [--long]
import { playCareer } from '../bots.js';
const args = process.argv.slice(2);
const long = args.includes('--long');
const N = Number(args.find((a) => /^\d+$/.test(a))) || 60;
const setup = { short: !long };
const byTier = {}; // topTier -> {n, gold, starved, rich, max}
let ends = [];
for (let seed = 1; seed <= N; seed++) {
  const res = playCareer(seed, 'careful', { oddsSamples: 60, setup, onWeek: (run) => {
    const t = byTier[run.topTier] ??= { n: 0, gold: 0, starved: 0, rich: 0, max: 0 };
    t.n++; t.gold += run.gold; if (run.gold < 5) t.starved++; if (run.gold > 60) t.rich++; t.max = Math.max(t.max, run.gold);
  } });
  ends.push(res.run.gold);
}
console.log(`Mode: ${long ? 'Long Road' : 'Season'} (${N} careful careers)`);
for (const [t, x] of Object.entries(byTier)) console.log(`tier ${t}: steps ${x.n}  avg gold ${(x.gold / x.n).toFixed(1)}  under 5: ${(100 * x.starved / x.n).toFixed(0)}%  over 60: ${(100 * x.rich / x.n).toFixed(0)}%  max ${x.max}`);
ends.sort((a, b) => a - b);
console.log('gold at career end: median', ends[Math.floor(N / 2)], 'p90', ends[Math.floor(N * 0.9)]);
