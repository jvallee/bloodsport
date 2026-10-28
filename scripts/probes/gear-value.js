// Probe: each gear piece's win-rate and injury change at even Power, valued per Gold (an avoided injury = 3 points per 0.1). Usage: node scripts/probes/gear-value.js
import { createRng } from '../../src/rng.js';
import { GEAR } from '../../src/data.js';
import { createMatch, playRound, effectiveInjuries } from '../../src/fight.js';
import { blank } from '../../tests/helpers.js';
const N = 5000;
function run(gear) {
  let won = 0, hurt = 0;
  for (let s = 1; s <= N; s++) {
    const m = createMatch({ a: blank({ power: 14, speed: 5, gear: { weapon: null, armor: null, ...gear } }), b: blank({ power: 14, speed: 5 }), rng: createRng(s) });
    while (!m.over) playRound(m);
    won += m.result.winner === 'A'; hurt += effectiveInjuries(m.a.f);
  }
  return { win: won / N, hurt: hurt / N };
}
const base = run({});
for (const [k, g] of Object.entries(GEAR)) {
  const r = run({ [g.slot]: k });
  const dw = (r.win - base.win) * 100, dh = r.hurt - base.hurt;
  const value = dw - dh * 30; // an injury avoided ≈ 3 points per 0.1
  console.log(`T${g.tier} ${g.name.padEnd(18)} ${String(g.price).padStart(3)}g win ${dw >= 0 ? '+' : ''}${dw.toFixed(1)} injuries ${dh >= 0 ? '+' : ''}${dh.toFixed(3)}  value ${value.toFixed(1)}  per Gold ${(value / g.price).toFixed(2)}`);
}
