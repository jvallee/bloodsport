import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { deltaRow } from '../src/data.js';
import {
  createMatch, playRound, autoPlay, throwTowel, canThrowTowel, mortalDanger, makeCombatant,
  computePower, computeSpeed, computePhase2, initiative, injurySeverity, injuryCheck, applyRoundEnd, effectiveInjuries,
} from '../src/fight.js';
import { blank, injuries, scripted, e5, pct, roundRecord } from './helpers.js';

const pair = (a, b) => [makeCombatant(blank(a), 'A'), makeCombatant(blank(b), 'B')];
const sources = (mods) => mods.map((m) => `${m.source}:${m.value}`);

// ---- Statistical checks against the Power Delta table (fixed seeds, ±1.5%) ----

test('round-1 win rate matches the Power Delta table (plus First Strike) for Delta -10..+10', () => {
  const N = 10000;
  for (let delta = -10; delta <= 10; delta++) {
    const rng = createRng(1000 + delta);
    let wins = 0;
    for (let i = 0; i < N; i++) {
      const m = createMatch({ a: blank({ power: 15 + delta }), b: blank({ power: 15 }), rng });
      if (playRound(m).winner === 'A') wins++;
    }
    // Equal Speed: each side strikes first half the time, and First Strike is worth +10%.
    const clampWin = (x) => Math.min(99999, Math.max(1, x));
    const base = deltaRow(delta).win;
    const expected = (clampWin(base + 10000) + clampWin(base - 10000)) / 2 / 100000;
    assert.ok(Math.abs(wins / N - expected) <= 0.015, `Delta ${delta}: ${wins / N} vs ${expected}`);
  }
});

test('round-1 injury rates match the table for winners and losers', () => {
  const N = 20000;
  for (const delta of [0, 2, 4]) {
    const rng = createRng(77 + delta);
    const n = { win: 0, winHurt: 0, lose: 0, loseHurt: 0 };
    for (let i = 0; i < N; i++) {
      const m = createMatch({ a: blank({ power: 5 + delta }), b: blank(), rng });
      const r = playRound(m);
      for (const c of [m.a, m.b]) {
        const hurt = c.f.injuries.length > 0;
        if (c.side === r.winner) { n.win++; n.winHurt += hurt; } else { n.lose++; n.loseHurt += hurt; }
      }
    }
    const row = deltaRow(delta);
    assert.ok(Math.abs(n.winHurt / n.win - row.winnerInjury / 100000) <= 0.015, `winner at Delta ${delta}`);
    assert.ok(Math.abs(n.loseHurt / n.lose - row.loserInjury / 100000) <= 0.015, `loser at Delta ${delta}`);
  }
});

test('the same seed replays the same match exactly', () => {
  const run = () => {
    const m = createMatch({ a: blank({ kindTrait: 'hateful', cls: 'cestus' }), b: blank({ kindTrait: 'elvenEyes', cls: 'fighter', weapon: 'sword' }), rng: createRng(99) });
    autoPlay(m);
    return JSON.stringify(m.rounds);
  };
  assert.equal(run(), run());
});

// ---- Death gate ----

test('severity adds +20 per prior injury and +5 per point of opponent advantage', () => {
  assert.equal(injurySeverity(40, 2, 3, false).raw, 40 + 40 + 15);
});

test('fighters with fewer than 2 injuries are clamped to 99 (never die)', () => {
  for (const prior of [0, 1]) {
    const s = injurySeverity(100, prior, 10, false);
    assert.equal(s.score, 99);
    assert.equal(s.injury.tag, 'blinded');
    assert.equal(s.canDie, false);
  }
});

test('2+ injuries and a round loss can kill at 100+', () => {
  const s = injurySeverity(60, 2, 0, false);
  assert.equal(s.score, 100);
  assert.equal(s.injury.tag, 'death');
});

test('the round winner can never die, even with 2+ injuries', () => {
  const s = injurySeverity(100, 4, 10, true);
  assert.equal(s.score, 99);
  assert.notEqual(s.injury.tag, 'death');
});

test('a fighter starting a round with 1 injury never dies that round', () => {
  const rng = createRng(5);
  for (let i = 0; i < 5000; i++) {
    const m = createMatch({ a: blank({ power: 1, injuries: injuries('fleshWound') }), b: blank({ power: 11 }), rng });
    playRound(m);
    assert.ok(m.a.f.alive);
  }
});

test('Poisoned alone opens the death gate and outmatched fighters sometimes die', () => {
  const rng = createRng(6);
  let deaths = 0;
  for (let i = 0; i < 5000; i++) {
    const m = createMatch({ a: blank({ power: 1, injuries: injuries('poisoned') }), b: blank({ power: 11 }), rng });
    const r = playRound(m);
    if (!m.a.f.alive) {
      deaths++;
      assert.equal(r.winner, 'B', 'death only on a round loss');
      assert.deepEqual(m.result, { winner: 'B', reason: 'death' });
    }
  }
  assert.ok(deaths > 0);
});

// ---- Match flow ----

test('matches are best of 3 and end as soon as someone wins 2 rounds', () => {
  const rng = createRng(11);
  for (let i = 0; i < 500; i++) {
    const m = createMatch({ a: blank(), b: blank(), rng });
    autoPlay(m);
    assert.ok(m.over);
    if (m.result.reason === 'rounds') {
      const w = m.result.winner === 'A' ? m.a : m.b;
      assert.equal(w.roundsWon, 2);
      assert.ok(m.rounds.length === 2 || m.rounds.length === 3);
      if (m.rounds.length === 2) assert.equal(m.rounds[0].winner, m.rounds[1].winner);
    }
  }
});

test('the towel can only be thrown between rounds and counts as a loss', () => {
  const m = createMatch({ a: blank(), b: blank(), rng: createRng(3) });
  assert.equal(canThrowTowel(m), false);
  assert.throws(() => throwTowel(m));
  playRound(m);
  if (!m.over) {
    assert.equal(canThrowTowel(m), true);
    throwTowel(m);
    assert.deepEqual(m.result, { winner: 'B', reason: 'towel' });
    assert.equal(canThrowTowel(m), false);
    assert.throws(() => playRound(m));
  }
});

test('Mortal Danger shows at 2 effective injuries', () => {
  assert.equal(mortalDanger(makeCombatant(blank({ injuries: injuries('concussed') }), 'A')), false);
  assert.equal(mortalDanger(makeCombatant(blank({ injuries: injuries('poisoned') }), 'A')), true);
  assert.equal(mortalDanger(makeCombatant(blank({ injuries: injuries('concussed', 'blinded') }), 'A')), true);
});

test('the match works on copies and leaves the original fighters untouched', () => {
  const a = blank({ power: 1, injuries: injuries('poisoned') });
  const m = createMatch({ a, b: blank({ power: 11 }), rng: createRng(8) });
  autoPlay(m);
  assert.equal(a.injuries.length, 1);
  assert.equal(a.alive, true);
});

// ---- Speed and initiative ----

test('Spear gives +3 Speed in round 1 only; Prone −2; Riposte +3', () => {
  const [c] = pair({ cls: 'fighter', weapon: 'spear' }, {});
  assert.equal(computeSpeed(c, 1).total, 6);
  assert.equal(computeSpeed(c, 2).total, 3);
  c.proneRound = 2;
  c.riposteRound = 2;
  assert.deepEqual(sources(computeSpeed(c, 2).mods), ['Prone:-2', 'Riposte:3']);
});

test('Concussed always strikes second, even with Footwork', () => {
  const [A, B] = pair({ speed: 9, kindTrait: 'footwork', injuries: injuries('concussed') }, { speed: 1 });
  const init = initiative(A, B, 1, createRng(1));
  assert.equal(init.first, 'B');
  assert.equal(init.reason, 'concussed');
});

test('Footwork strikes first when faster, otherwise rolls', () => {
  const [A, B] = pair({ speed: 4, kindTrait: 'footwork' }, { speed: 3 });
  assert.deepEqual([initiative(A, B, 1, createRng(1)).first, initiative(A, B, 1, createRng(1)).reason], ['A', 'footwork']);
  const [C, D] = pair({ speed: 3, kindTrait: 'footwork' }, { speed: 3 });
  assert.notEqual(initiative(C, D, 1, createRng(1)).reason, 'footwork');
});

test('initiative compares Speed + 1d6 and breaks ties with a coin flip', () => {
  const [A, B] = pair({ speed: 3 }, { speed: 4 });
  // A rolls 6 (9) vs B rolls 1 (5).
  assert.equal(initiative(A, B, 1, scripted([0.99, 0])).first, 'A');
  // A rolls 2 (5) vs B rolls 1 (5): tie, coin < 0.5 → A.
  const tie = initiative(A, B, 1, scripted([0.2, 0, 0.1]));
  assert.deepEqual([tie.first, tie.reason], ['A', 'tiebreak']);
});

// ---- Phase 1 Power ----

test('Masochist gets +1 Power per effective injury (Poisoned = +2)', () => {
  const [A, B] = pair({ kindTrait: 'masochist', injuries: injuries('poisoned', 'concussed') }, {});
  assert.deepEqual(sources(computePower(A, B, 1).mods), ['Masochist:3']);
});

test('Firebug gets +1 Power per Fire Brazier', () => {
  const [A, B] = pair({ kindTrait: 'firebug', decor: { bird: 0, fireBrazier: 2 } }, {});
  assert.equal(computePower(A, B, 1).total, 7);
});

test('Bow gives +1 Power in rounds 1–2 against melee-only opponents', () => {
  const [A, B] = pair({ cls: 'fighter', weapon: 'bow' }, { cls: 'fighter', weapon: 'club' });
  assert.equal(computePower(A, B, 1).total, 6);
  assert.equal(computePower(A, B, 2).total, 6);
  assert.equal(computePower(A, B, 3).total, 5);
  for (const opp of [{ cls: 'fighter', weapon: 'spear' }, { cls: 'fighter', weapon: 'gun' }, { cls: 'sagittarius' }]) {
    const [X, Y] = pair({ cls: 'fighter', weapon: 'bow' }, opp);
    assert.equal(computePower(X, Y, 1).total, 5, JSON.stringify(opp));
  }
  const [Z, W] = pair({ cls: 'fighter', weapon: 'bow', injuries: injuries('blinded') }, {});
  assert.deepEqual(sources(computePower(Z, W, 1).mods), ['Blinded:-2']);
});

test('Quantum Analyzer adds its stacks; Blinded is −2 per instance', () => {
  const [A, B] = pair({ kindTrait: 'quantumAnalyzer', injuries: injuries('blinded') }, {});
  A.analyzed = 2;
  assert.deepEqual(sources(computePower(A, B, 2).mods), ['Quantum Analyzer:2', 'Blinded:-2']);
});

// ---- Phase 2 percentages ----

test('Cestus Progressive Overload: +3/6/9% win, +5/10/15% injure (nerfed per roadmap)', () => {
  const [A, B] = pair({ cls: 'cestus' }, {});
  for (const round of [1, 2, 3]) {
    const p = computePhase2(A, B, round);
    assert.equal(p.win[0].value, 3000 * round);
    assert.equal(p.enemy[0].value, 5000 * round);
  }
});

test('Sagittarius First Volley follows the coin flip and is disabled when Blinded', () => {
  const [A, B] = pair({ cls: 'sagittarius' }, {});
  assert.deepEqual(sources(computePhase2(A, B, 1, { A: 'win' }).win), ['First Volley:10000']);
  assert.deepEqual(sources(computePhase2(A, B, 1, { A: 'injury' }).enemy), ['First Volley:10000']);
  A.f.injuries = injuries('blinded');
  assert.equal(computePhase2(A, B, 1, { A: 'win' }).win.length, 0);
});

test('Ornitharius Birds of Prey needs an injury and scales with Birds', () => {
  const [A, B] = pair({ cls: 'ornitharius', decor: { bird: 3, fireBrazier: 0 } }, {});
  assert.equal(computePhase2(A, B, 1).enemy.length, 0);
  A.f.injuries = injuries('concussed');
  assert.deepEqual(sources(computePhase2(A, B, 1).enemy), ['Birds of Prey:15000']);
});

test('Hateful adds +10% injure chance', () => {
  const [A, B] = pair({ kindTrait: 'hateful' }, {});
  assert.deepEqual(sources(computePhase2(A, B, 1).enemy), ['Hateful:10000']);
});

test('Overclocked gives +10% win and +5% self-injury only on its round', () => {
  const [A, B] = pair({ kindTrait: 'perpetualMotion' }, {});
  A.overclockedRound = 2;
  assert.equal(computePhase2(A, B, 1).win.length, 0);
  const p = computePhase2(A, B, 2);
  assert.deepEqual([sources(p.win), sources(p.self)], [['Overclocked:10000'], ['Overheating:5000']]);
});

test('Alloyed Skin and Ego Armour are armor; Ego Armour only while uninjured', () => {
  const [A, B] = pair({ kindTrait: 'alloyedSkin' }, {});
  assert.deepEqual(computePhase2(A, B, 1).self, [{ source: 'Alloyed Skin', value: -10000, armor: true }]);
  const [E, F] = pair({ kindTrait: 'egoArmour' }, {});
  assert.deepEqual(sources(computePhase2(E, F, 1).win), ['Ego Armour:5000']);
  E.f.injuries = injuries('distracted');
  const hurt = computePhase2(E, F, 1);
  assert.deepEqual([hurt.win.length, hurt.self.length], [0, 0]);
});

test('Gun pierces armor with +15% in odd rounds; Flail always pierces and ignores parry', () => {
  const [G, H] = pair({ cls: 'fighter', weapon: 'gun' }, {});
  assert.equal(computePhase2(G, H, 1).piercing, true);
  assert.equal(computePhase2(G, H, 2).piercing, false);
  assert.deepEqual(sources(computePhase2(G, H, 3).enemy), ['Armor-Piercing Volley:15000']);
  const [F, X] = pair({ cls: 'fighter', weapon: 'flail' }, {});
  const p = computePhase2(F, X, 2);
  assert.deepEqual([p.piercing, p.ignoresParry], [true, true]);
});

test('Prone is −5% win; Flesh Wound −10% injure; Senseless +10% per injury', () => {
  const [A, B] = pair({ injuries: injuries('fleshWound', 'senseless', 'poisoned') }, {});
  A.proneRound = 1;
  const p = computePhase2(A, B, 1);
  assert.deepEqual(sources(p.win), ['Prone:-5000']);
  assert.deepEqual(sources(p.enemy), ['Flesh Wound:-10000']);
  assert.deepEqual(sources(p.self), ['Senseless:40000']);
});

// ---- Injury checks (scripted rolls) ----

const matchOf = (a, b, values, debuff = null) => createMatch({ a: blank(a), b: blank(b), rng: scripted(values), debuff });

test('a hit rolls on the injury table and records the injury', () => {
  const m = matchOf({}, {}, [e5(1), pct(30)]);
  const check = injuryCheck(m, m.a, m.b, roundRecord({ winner: 'A' }), 'First strike');
  assert.equal(check.chance, 25000);
  assert.equal(check.injury.tag, 'fleshWound');
  assert.deepEqual(m.b.f.injuries, [{ tag: 'fleshWound', weight: 1 }]);
});

test('armor lowers injure chance unless the attacker pierces', () => {
  const m = matchOf({}, { kindTrait: 'alloyedSkin' }, [e5(99999)]);
  assert.equal(injuryCheck(m, m.a, m.b, roundRecord({ winner: 'A' }), 'x').chance, 15000);
  const g = matchOf({ cls: 'fighter', weapon: 'gun' }, { kindTrait: 'alloyedSkin' }, [e5(99999)]);
  const check = injuryCheck(g, g.a, g.b, roundRecord({ winner: 'A' }), 'x');
  assert.equal(check.chance, 40000);
  assert.equal(check.pierced, true);
});

test('Sword parries 20% of hits and gains Riposte next round', () => {
  const m = matchOf({}, { cls: 'fighter', weapon: 'sword' }, [e5(1), e5(20000)]);
  const check = injuryCheck(m, m.a, m.b, roundRecord({ winner: 'A' }), 'x');
  assert.equal(check.parry.success, true);
  assert.equal(m.b.f.injuries.length, 0);
  assert.equal(m.b.riposteRound, 2);
});

test('Flail ignores parries', () => {
  const m = matchOf({ cls: 'fighter', weapon: 'flail' }, { cls: 'fighter', weapon: 'sword' }, [e5(1), pct(30)]);
  const check = injuryCheck(m, m.a, m.b, roundRecord({ winner: 'A' }), 'x');
  assert.equal(check.parry, undefined);
  assert.equal(m.b.f.injuries.length, 1);
});

test('Elven Eyes counters with 15% when a check misses by 50% or more', () => {
  const m = matchOf({}, { kindTrait: 'elvenEyes' }, [e5(90000), e5(15000), pct(30)]);
  injuryCheck(m, m.a, m.b, roundRecord({ winner: 'B' }), 'x');
  const r = m.rng; // all scripted values consumed
  assert.equal(r.script.length, 0);
  assert.deepEqual(m.a.f.injuries, [{ tag: 'fleshWound', weight: 1 }]);
  const near = matchOf({}, { kindTrait: 'elvenEyes' }, [e5(50000)]);
  const rec = roundRecord({ winner: 'B' });
  injuryCheck(near, near.a, near.b, rec, 'x');
  assert.equal(rec.checks.length, 1, 'miss by less than 50% gives no counter');
});

test('a Flesh Wound from Roll 4B immediately lowers the 4C retaliation', () => {
  const m = matchOf({}, {}, [e5(1), pct(30), e5(99999)]);
  const r = roundRecord({ winner: 'A' });
  injuryCheck(m, m.a, m.b, r, 'First strike');
  const retaliation = injuryCheck(m, m.b, m.a, r, 'Retaliation');
  assert.deepEqual(sources(retaliation.mods), ['Flesh Wound:-10000']);
  assert.equal(retaliation.mods[0].side, 'B', 'modifier belongs to the attacker who has the Flesh Wound');
  assert.equal(retaliation.chance, 0);
});

test('armor modifiers in a check are labeled with the defender', () => {
  const m = matchOf({}, { kindTrait: 'alloyedSkin' }, [e5(99999)]);
  const check = injuryCheck(m, m.a, m.b, roundRecord({ winner: 'A' }), 'x');
  assert.deepEqual(check.mods.map((x) => [x.source, x.side]), [['Alloyed Skin', 'B']]);
});

test('Distracted disables 1 slot; Maimed disables one per effective injury', () => {
  const d = matchOf({}, { kindTrait: 'hateful', cls: 'cestus' }, [e5(1), pct(10), 0]);
  injuryCheck(d, d.a, d.b, roundRecord({ winner: 'A' }), 'x');
  assert.equal(d.b.disabled.length, 1);
  const mm = matchOf({}, { kindTrait: 'hateful', cls: 'cestus', injuries: injuries('concussed') }, [e5(1), pct(55), 0, 0]); // 55 + 20 = 75 → Maimed
  injuryCheck(mm, mm.a, mm.b, roundRecord({ winner: 'B' }), 'x');
  assert.deepEqual([...mm.b.disabled].sort(), ['class', 'kind']);
  assert.equal(computePhase2(mm.b, mm.a, 1).enemy.length, 0, 'disabled traits stop firing');
});

test('a fatal roll kills a fighter on 2+ injuries who lost the round', () => {
  const m = matchOf({}, { injuries: injuries('poisoned') }, [e5(1), pct(60)]); // 60 + 40 = 100
  const check = injuryCheck(m, m.a, m.b, roundRecord({ winner: 'A' }), 'x');
  assert.equal(check.injury.tag, 'death');
  assert.equal(m.b.f.alive, false);
});

test('Boss debuff: the player fighter’s first injury counts double, later ones do not', () => {
  const m = matchOf({}, {}, [e5(1), pct(30), e5(1), pct(10)], 'firstInjuryDouble'); // 2nd: 10 + 40 = 50 → Concussed
  injuryCheck(m, m.b, m.a, roundRecord({ winner: 'B' }), 'x');
  assert.deepEqual(m.a.f.injuries, [{ tag: 'fleshWound', weight: 2 }]);
  assert.equal(effectiveInjuries(m.a.f), 2);
  injuryCheck(m, m.b, m.a, roundRecord({ winner: 'A' }), 'x');
  assert.equal(m.a.f.injuries[1].weight, 1);
});

test('Boss debuff only affects the player side', () => {
  const m = matchOf({}, {}, [e5(1), pct(30)], 'firstInjuryDouble');
  injuryCheck(m, m.a, m.b, roundRecord({ winner: 'A' }), 'x');
  assert.equal(m.b.f.injuries[0].weight, 1);
});

// ---- Round end ----

test('round-end effects: Club, Fists, Perpetual Motion, Quantum Analyzer', () => {
  const m = createMatch({ a: blank({ cls: 'fighter', weapon: 'club', kindTrait: 'perpetualMotion' }), b: blank({ cls: 'cestus', kindTrait: 'quantumAnalyzer' }), rng: createRng(1) });
  applyRoundEnd(m, { round: 1, winner: 'A' });
  assert.equal(m.b.proneRound, 2);
  assert.equal(m.a.overclockedRound, 2);
  assert.equal(m.b.analyzed, 1);
  const f = createMatch({ a: blank({ cls: 'fighter', weapon: 'fists' }), b: blank({ cls: 'cestus' }), rng: createRng(1) });
  applyRoundEnd(f, { round: 1, winner: 'A' });
  assert.equal(computePhase2(f.b, f.a, 2).win.length, 0, 'disarmed next round');
  assert.equal(computePhase2(f.b, f.a, 3).win.length, 1, 'back in round 3');
});

// ---- Boss debuffs and Stress ----

test('Rainy Mud gives your fighter −2 Speed', () => {
  const m = createMatch({ a: blank(), b: blank(), rng: createRng(1), debuff: 'rainyMud' });
  assert.equal(computeSpeed(m.a, 1).total, 1);
  assert.equal(computeSpeed(m.b, 1).total, 3);
});

test('Stripped of Armor removes your armor only', () => {
  const m = createMatch({ a: blank({ kindTrait: 'alloyedSkin' }), b: blank({ kindTrait: 'alloyedSkin' }), rng: createRng(1), debuff: 'noArmor' });
  assert.equal(computePhase2(m.a, m.b, 1).self.length, 0);
  assert.equal(computePhase2(m.b, m.a, 1).self.length, 1);
});

test('Iron Rules turns off your decor bonuses', () => {
  const m = createMatch({ a: blank({ kindTrait: 'firebug', decor: { bird: 0, fireBrazier: 3 } }), b: blank(), rng: createRng(1), debuff: 'ironRules' });
  assert.equal(computePower(m.a, m.b, 1).total, 5);
});

test('Blood Moon raises injury chance for both fighters', () => {
  const m = createMatch({ a: blank(), b: blank(), rng: createRng(1), debuff: 'bloodMoon' });
  for (const [x, y] of [[m.a, m.b], [m.b, m.a]]) assert.deepEqual(sources(computePhase2(x, y, 1).self), ['Blood Moon:10000']);
});

test('Crowd Favorite gives the opponent +1 Power', () => {
  const m = createMatch({ a: blank(), b: blank(), rng: createRng(1), debuff: 'crowdFavorite' });
  assert.equal(computePower(m.b, m.a, 1).total, 6);
  assert.equal(computePower(m.a, m.b, 1).total, 5);
});

test('an overtrained fighter starts the match with one slot disabled and −1 Power', () => {
  const m = createMatch({ a: blank({ kindTrait: 'hateful', cls: 'cestus' }), b: blank(), rng: createRng(1), overtrained: true });
  assert.equal(m.a.disabled.length, 1);
  assert.deepEqual(sources(computePower(m.a, m.b, 1).mods), ['Overtrained:-1']);
  assert.equal(m.preMatch[0].source, 'Overtrained');
  const calm = createMatch({ a: blank({ kindTrait: 'hateful' }), b: blank(), rng: createRng(1) });
  assert.equal(calm.a.disabled.length, 0);
});

test('First Strike gives the first striker +10% win chance for the round', () => {
  const m = createMatch({ a: blank({ speed: 9, kindTrait: 'footwork' }), b: blank(), rng: createRng(1) });
  const r = playRound(m);
  assert.equal(r.initiative.first, 'A');
  assert.deepEqual(sources(r.win.modsA), ['First Strike:10000']);
  assert.equal(r.win.chance, 60000);
});

// ---- v2: evasion, perks, gear, morale ----

test('Evasion: each point of Speed above the opponent is −4% to be injured, up to −20%', () => {
  const [A, B] = pair({ speed: 5 }, { speed: 3 });
  assert.deepEqual(sources(computePhase2(A, B, 1).self), ['Evasion:-8000']);
  assert.equal(computePhase2(B, A, 1).self.length, 0, 'the slower fighter gets nothing');
  const [C, D] = pair({ speed: 20 }, { speed: 3 });
  assert.deepEqual(sources(computePhase2(C, D, 1).self), ['Evasion:-20000']);
});

test('Evasion is not armor: Gun and Flail do not ignore it', () => {
  const m = matchOf({ cls: 'fighter', weapon: 'flail' }, { speed: 5 }, [e5(99999)]);
  const check = injuryCheck(m, m.a, m.b, roundRecord({ winner: 'A' }), 'x');
  assert.deepEqual(sources(check.mods), ['Evasion:-8000']);
});

test('combat perks apply in the right rounds and conditions', () => {
  const [A, B] = pair({ perks: ['thickSkin', 'killer', 'fastStart', 'closer', 'duelist'] }, {});
  const r1 = computePhase2(A, B, 1);
  assert.deepEqual(sources(r1.win), ['Fast Starter:5000', 'Duelist:5000']);
  assert.deepEqual(sources(r1.enemy), ['Killer Instinct:5000', 'Duelist:5000']);
  assert.deepEqual(sources(r1.self), ['Thick Skin:-5000']);
  assert.deepEqual(sources(computePhase2(A, B, 3).win), ['Closer:5000', 'Duelist:5000']);
  const [S, T] = pair({ perks: ['survivor'], injuries: injuries('poisoned') }, {});
  assert.deepEqual(sources(computePhase2(S, T, 1).self), ['Survivor:-10000']);
});

test('Tactician makes First Strike worth +15%', () => {
  const m = createMatch({ a: blank({ speed: 20, kindTrait: 'footwork', perks: ['tactician'] }), b: blank({ speed: 20 }), rng: createRng(1) });
  const r = playRound(m);
  assert.equal(r.initiative.first, 'A');
  assert.deepEqual(sources(r.win.modsA), ['First Strike:15000']);
});

test('gear adds Power, Speed, injure chance and armor', () => {
  const [A, B] = pair({ gear: { weapon: 'trident', armor: 'bronzeCuirass' } }, {});
  assert.deepEqual(sources(computePower(A, B, 1).mods), ['Trident:1']);
  assert.deepEqual(sources(computeSpeed(A, 1).mods), ['Bronze Cuirass:-1']);
  const p = computePhase2(A, B, 1);
  assert.deepEqual(sources(p.enemy), ['Trident:5000']);
  assert.deepEqual(p.self, [{ source: 'Bronze Cuirass', value: -10000, armor: true }]);
});

test('an Inspired fighter (Morale 80+) gets +5% win chance', () => {
  const [A, B] = pair({ morale: 85 }, { morale: 79 });
  assert.deepEqual(sources(computePhase2(A, B, 1).win), ['Inspired:5000']);
  assert.equal(computePhase2(B, A, 1).win.length, 0);
});
