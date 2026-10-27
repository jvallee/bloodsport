// Balance simulator. Usage: node scripts/simulate.js [matchesPerBuild]
// 1. Win rate of every Kind trait × Class build vs random opponents at equal Power (design target: 30–70%).
// 2. Match win and death rates for a trained fighter against each tier's Boss (no debuff).

import { createRng } from '../src/rng.js';
import { KINDS, CLASSES, WEAPONS, TRAITS, CIRCUITS } from '../src/data.js';
import { createMatch, autoPlay } from '../src/fight.js';
import { createFighter } from '../src/run.js';

const N = Number(process.argv[2]) || 4000;
const rng = createRng(20261026);

function build(kind, kindTrait, cls, weapon, decor) {
  return {
    id: 'p', name: 'P', kind, kindTrait, cls, weapon, power: 5, speed: 3, trained: 0,
    decor: { bird: cls === 'ornitharius' ? decor : 0, fireBrazier: kindTrait === 'firebug' ? decor : 0 },
    injuries: [], alive: true,
  };
}

function winRate(fighter, oppPower, decorLevel) {
  let wins = 0;
  let deaths = 0;
  for (let i = 0; i < N; i++) {
    const opp = createFighter(rng, { id: 'o', power: oppPower, decorLevel });
    const m = createMatch({ a: fighter, b: opp, rng });
    autoPlay(m);
    if (m.result.winner === 'A') wins++;
    if (!m.a.f.alive) deaths++;
  }
  return { win: wins / N, death: deaths / N };
}

const pct = (x) => `${(x * 100).toFixed(1)}%`.padStart(6);
const rows = [];
for (const [kind, k] of Object.entries(KINDS)) {
  for (const trait of k.traits) {
    for (const cls of Object.keys(CLASSES)) {
      const weapons = cls === 'fighter' ? Object.keys(WEAPONS) : [null];
      for (const weapon of weapons) {
        const label = `${TRAITS[trait].name} / ${CLASSES[cls].name}${weapon ? ' ' + WEAPONS[weapon].name : ''}`;
        rows.push({ label, ...winRate(build(kind, trait, cls, weapon, 0), 5, 0) });
      }
    }
  }
}
rows.sort((a, b) => b.win - a.win);
console.log(`\nBuild win rate at equal Power 5 (no decor), ${N} matches each, vs random Power 5 opponents`);
for (const r of rows) {
  const flag = r.win > 0.7 || r.win < 0.3 ? '  <-- outside 30–70%' : '';
  console.log(`${pct(r.win)}  ${r.label}${flag}`);
}
const outside = rows.filter((r) => r.win > 0.7 || r.win < 0.3).length;
console.log(`\n${outside} of ${rows.length} builds outside the 30–70% target.`);

console.log('\nHuman fighter trained to the tier\'s Trainer cap (all Power, +1 Power per earlier Title) vs each Boss');
const caps = [3, 5, 8, 13];
for (const c of CIRCUITS) {
  let wins = 0;
  let deaths = 0;
  for (let i = 0; i < N; i++) {
    const f = createFighter(rng, { id: 'p', kind: 'human' });
    f.power += caps[c.tier - 1] + (c.tier - 1);
    const opp = createFighter(rng, { id: 'o', power: c.oppPower[2], decorLevel: c.oppDecor });
    opp.speed = 3 + c.tier;
    const m = createMatch({ a: f, b: opp, rng });
    autoPlay(m);
    if (m.result.winner === 'A') wins++;
    if (!m.a.f.alive) deaths++;
  }
  console.log(`  Power ${5 + caps[c.tier - 1] + c.tier - 1} vs ${c.name} Boss (Power ${c.oppPower[2]})`.padEnd(54) + `win ${pct(wins / N)}  death ${pct(deaths / N)}`);
}
