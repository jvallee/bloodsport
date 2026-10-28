// Probe: careful-bot career win rate with tuned values. Usage: node scripts/probes/careful-variant.js <lowerArenaGold> <opponentSignatureLevel> <spareFavor> <playerSignatureLevel> [careers=120]
// Run several at once with bash (zsh doesn't split $cfg): bash -c 'for c in "0.5 3 2 3" "0.75 4 2 3"; do node scripts/probes/careful-variant.js $c 120 & done; wait'
import { playCareer } from '../bots.js';
import * as D from '../../src/data.js';
const [gold, opp, spare, lv, N] = [Number(process.argv[2]), Number(process.argv[3]), Number(process.argv[4]), Number(process.argv[5]), Number(process.argv[6] ?? 120)];
D.ECONOMY.lowerArenaGold = gold; D.SIGNATURE.opponentLevel = opp; D.MERCY.spareFavor = spare; D.SIGNATURE.level = lv;
let won = 0, deaths = 0;
for (let seed = 1; seed <= N; seed++) { const r = playCareer(seed, 'careful', { oddsSamples: 100 }); won += r.won; deaths += r.deaths; }
console.log(`gold ×${gold} oppSig Lv${opp} spareFavor ${spare} playerSig Lv${lv}: careful win ${(100 * won / N).toFixed(0)}%  deaths ${(deaths / N).toFixed(2)}`);
