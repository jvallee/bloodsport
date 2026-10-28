// Probe: each fight item's and signature move's match win-rate change at even Power, per Gold. Usage: node scripts/probes/item-value.js
// Value of each fight item and signature move: match win-rate change at even Power, used before Round 1.
import { createRng } from '../../src/rng.js';
import { CONSUMABLES, SIGNATURES } from '../../src/data.js';
import { createMatch, playRound, effectiveInjuries, useSignature } from '../../src/fight.js';
import { blank } from '../../tests/helpers.js';
const N = 6000;
function run(setup) {
  let won = 0, hurt = 0, hurtFoe = 0;
  for (let s = 1; s <= N; s++) {
    const m = createMatch({ a: blank({ power: 12, speed: 5 }), b: blank({ power: 12, speed: 5 }), rng: createRng(s) });
    setup(m);
    while (!m.over) playRound(m);
    won += m.result.winner === 'A'; hurt += effectiveInjuries(m.a.f); hurtFoe += effectiveInjuries(m.b.f);
  }
  return { win: won / N, hurt: hurt / N, foe: hurtFoe / N };
}
const base = run(() => {});
console.log('base', base);
for (const [k, it] of Object.entries(CONSUMABLES)) {
  if (!it.boost && !it.foe) continue;
  const r = run((m) => {
    if (it.boost) m.a.boosts = [{ ...it.boost, name: it.name, round: 1 }];
    if (it.foe) m.b.boosts = [{ ...it.foe, name: it.name, round: 1 }];
  });
  const dw = (r.win - base.win) * 100;
  console.log(`${it.name.padEnd(20)} ${String(it.price).padStart(3)}g  win ${dw >= 0 ? '+' : ''}${dw.toFixed(1)}pts  ${(dw / it.price).toFixed(2)} pts/Gold  self-injuries ${(r.hurt - base.hurt).toFixed(3)}  foe-injuries ${(r.foe - base.foe).toFixed(3)}`);
}
for (const [cls, sig] of Object.entries(SIGNATURES)) {
  const r = run((m) => { m.a.f.cls = cls; m.a.f.level = 3; if (cls === 'fighter') m.a.f.weapon = 'sword'; useSignature(m); });
  const b2 = run((m) => { m.a.f.cls = cls; m.a.f.level = 3; if (cls === 'fighter') m.a.f.weapon = 'sword'; });
  console.log(`SIG ${sig.name.padEnd(16)} win ${((r.win - b2.win) * 100).toFixed(1)}pts  foe-injuries ${(r.foe - b2.foe).toFixed(3)} self ${(r.hurt - b2.hurt).toFixed(3)}`);
}
