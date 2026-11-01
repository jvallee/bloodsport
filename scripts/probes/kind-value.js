// Probe: each kind's average win rate against random opponents of the same Power, over its traits and every class
// (its natural Power ignored), plus the same with the kind's real base Power against a Power-5 field.
// Usage: node scripts/probes/kind-value.js [matches per build=300]
import { createRng } from '../../src/rng.js';
import { KINDS, CLASSES, WEAPONS } from '../../src/data.js';
import { createMatch, autoPlay } from '../../src/fight.js';
import { createFighter } from '../../src/run.js';

const N = Number(process.argv[2]) || 300;
const rng = createRng(53);
const fighter = (kind, kindTrait, cls, weapon, power) => ({ id: 'p', name: 'P', kind, kindTrait, cls, weapon, power, speed: 3, trained: 0, decor: { bird: 0, fireBrazier: 0 }, injuries: [], alive: true, humor: 'phlegmatic' });
for (const [kind, k] of Object.entries(KINDS)) {
  const rates = { equal: [], base: [] };
  const traits = {};
  for (const trait of k.traits) {
    let tw = 0, tn = 0;
    for (const cls of Object.keys(CLASSES).filter((c) => !CLASSES[c].legacy)) {
      const weapon = cls === 'fighter' ? Object.keys(WEAPONS)[tn % 9] : null;
      for (const [key, power] of [['equal', 5], ['base', k.basePower]]) {
        let w = 0;
        for (let i = 0; i < N; i++) {
          const opp = createFighter(rng, { id: 'o', power: 5 });
          const m = createMatch({ a: fighter(kind, trait, cls, weapon, power), b: opp, rng });
          autoPlay(m);
          if (m.result.winner === 'A') w++;
        }
        rates[key].push(w / N);
        if (key === 'equal') { tw += w / N; tn++; }
      }
    }
    traits[trait] = tw / tn;
  }
  const avg = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
  console.log(`${k.name.padEnd(9)} base ${k.basePower}: equal Power ${(100 * avg(rates.equal)).toFixed(1)}%  at its base Power ${(100 * avg(rates.base)).toFixed(1)}%   ${Object.entries(traits).map(([t, r]) => `${t} ${(100 * r).toFixed(0)}%`).join(', ')}`);
}
