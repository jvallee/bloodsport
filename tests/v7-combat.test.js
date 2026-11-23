import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng, pick } from '../src/rng.js';
import {
  COMBAT, INJURIES, TACTICS, SIGNATURES, GEAR, CONSUMABLES, SHORT, TRAINING, LOUNGE, QUESTS, BRACKET, SUMMONS, ECONOMY, MORALE, HYPE,
} from '../src/data.js';
import {
  createMatch, playRound, computePower, computeSpeed, computePhase2, injuryCheck, matchupsFor,
  opponentTactic, opponentIntent, opponentTell, opponentOdds, suggestTactic, deathRisk,
  signatureBlocker, useSignature, opponentUnleashesNext, hypeOf, makeCombatant,
} from '../src/fight.js';
import { estimateOdds } from '../src/odds.js';
import { narrateRound, narrateStory, adviceFor } from '../src/narrate.js';
import { fighterWarnings, arenaStakes, roundStats } from '../src/explain.js';
import { createRun, recruit } from '../src/run.js';
import { Refused } from '../src/errors.js';
import { blank, injuries, scripted, e5, pct, roundRecord } from './helpers.js';

const sources = (mods) => mods.map((m) => `${m.source}:${m.value}`);

test('rng.pick on an empty list returns undefined without consuming an RNG draw', () => {
  const r = createRng(42);
  const before = r.state;
  assert.equal(pick(r, []), undefined);
  assert.equal(r.state, before);
});

test('Phlegmatic opponent after player All In never produces undefined stance or crashes', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const m = createMatch({
      a: blank({ name: 'A', power: 15, injuries: injuries('concussed', 'fleshWound') }),
      b: blank({ name: 'B', power: 5, humor: 'phlegmatic' }),
      rng: createRng(seed),
    });
    const r1 = playRound(m, { stance: 'allIn' });
    if (m.over) continue;
    assert.equal(r1.stances.A, 'allIn');
    const odds = opponentOdds(m);
    assert.equal(Object.keys(odds).includes('undefined'), false);
    assert.ok(Math.abs(Object.values(odds).reduce((a, b) => a + b, 0) - 1) < 1e-9);
    const stance = opponentTactic(m, 2);
    assert.ok(['press', 'guard', 'feint', 'steady'].includes(stance));
    const r2 = playRound(m, { stance: 'steady' });
    for (const line of [...narrateRound(m, r2), ...narrateStory(m, r2)]) {
      assert.doesNotMatch(line.text, /undefined/);
    }
  }
});

test('intent and tell helpers are pure: calling them repeatedly never mutates m.rng', () => {
  const a = createMatch({ a: blank({ name: 'A' }), b: blank({ name: 'B', humor: 'choleric' }), rng: createRng(77), oracle: 2 });
  const b = createMatch({ a: blank({ name: 'A' }), b: blank({ name: 'B', humor: 'choleric' }), rng: createRng(77), oracle: 2 });
  const stateBefore = a.rng.state;
  for (let i = 0; i < 10; i++) {
    opponentIntent(a);
    opponentTell(a);
    suggestTactic(a);
  }
  assert.equal(a.rng.state, stateBefore);
  const ra = playRound(a, { stance: 'guard' });
  const rb = playRound(b, { stance: 'guard' });
  assert.deepEqual([ra.winner, ra.roll, ra.stances, ra.tell], [rb.winner, rb.roll, rb.stances, rb.tell]);
});

test('firstInjuryDouble: Distracted stays weight 0 and defers doubling; Poisoned stays weight 2', () => {
  const m1 = createMatch({ a: blank(), b: blank(), rng: scripted([e5(1), pct(10), e5(1), pct(30)]), debuff: 'firstInjuryDouble' });
  const c1 = injuryCheck(m1, m1.b, m1.a, roundRecord({ winner: 'B' }), 'First strike');
  assert.equal(c1.injury.tag, 'distracted');
  assert.equal(c1.injury.weight, 0);
  assert.equal(m1.a.firstInjuryTaken, false);
  const c2 = injuryCheck(m1, m1.b, m1.a, roundRecord({ winner: 'B' }), 'Second strike');
  assert.equal(c2.injury.tag, 'fleshWound');
  assert.equal(c2.injury.weight, 2);
  assert.equal(c2.injury.doubled, true);
  assert.equal(m1.a.firstInjuryTaken, true);

  const m2 = createMatch({ a: blank(), b: blank(), rng: scripted([e5(1), pct(65), e5(1), pct(5)]), debuff: 'firstInjuryDouble' });
  const p1 = injuryCheck(m2, m2.b, m2.a, roundRecord({ winner: 'B' }), 'Poison');
  assert.equal(p1.injury.tag, 'poisoned');
  assert.equal(p1.injury.weight, 2);
  assert.equal(m2.a.firstInjuryTaken, true);
  const p2 = injuryCheck(m2, m2.b, m2.a, roundRecord({ winner: 'A' }), 'Concussed');
  assert.equal(p2.injury.tag, 'concussed');
  assert.equal(p2.injury.weight, 1);
});

test('Blood Drinker restores disabled slot when healing Distracted and heals on killing blows', () => {
  // Vampire gets Distracted (disabling class), then hits opponent and heals Distracted + restores class.
  const m = createMatch({
    a: blank({ kind: 'vampire', kindTrait: 'bloodDrinker', cls: 'cestus' }),
    b: blank({ injuries: injuries('poisoned') }),
    rng: scripted([e5(1), pct(10), 0.99, e5(1), pct(60)]),
  });
  // B hits A -> Distracted; open = ['kind', 'class'], 0.99 picks 'class'.
  injuryCheck(m, m.b, m.a, roundRecord({ winner: 'B' }), 'B hits');
  assert.deepEqual(m.a.disabled, ['class']);
  assert.equal(m.a.f.injuries[0].disabledSlot, 'class');
  // A lands a killing blow on B (60 + 50 = 110 -> death) and drinks deep, curing Distracted and restoring class.
  const r = roundRecord({ winner: 'A' });
  const kill = injuryCheck(m, m.a, m.b, r, 'Kill');
  assert.equal(kill.injury.tag, 'death');
  assert.equal(kill.drained, 'distracted');
  assert.equal(m.a.f.injuries.length, 0);
  assert.deepEqual(m.a.disabled, []);
  const mathLines = narrateRound(m, { round: 1, initiative: { first: 'A', reason: 'speed', speed: { A: { total: 3 }, B: { total: 3 } }, rolls: { A: 4, B: 2 } }, power: { A: { total: 5 }, B: { total: 5 } }, delta: 0, win: { base: 50000, modsA: [], modsB: [], chance: 50000 }, roll: 10000, winner: 'A', checks: r.checks, endEffects: [] });
  const deathIdx = mathLines.findIndex((l) => l.type === 'death');
  const drainIdx = mathLines.findIndex((l) => /Blood Drinker/.test(l.text));
  assert.ok(deathIdx >= 0 && drainIdx > deathIdx, 'Blood Drinker narrates after the kill');
  const storyLines = narrateStory(m, { round: 1, initiative: { first: 'A', reason: 'speed', speed: { A: { total: 3 }, B: { total: 3 } }, rolls: { A: 4, B: 2 } }, win: { chance: 50000 }, roll: 10000, winner: 'A', checks: r.checks, endEffects: [] });
  assert.ok(storyLines.some((l) => /drinks deep/.test(l.text)), 'Story mode renders Blood Drinker heal');
});

test('signature moves respect Fists disarm and disabled class slot on both player and opponent', () => {
  const m = createMatch({ a: blank({ cls: 'cestus', level: 3 }), b: blank({ cls: 'cestus', level: 3 }), rng: createRng(1) });
  m.a.classDisabledRound = 1;
  assert.match(signatureBlocker(m), /disarmed/);
  assert.throws(() => useSignature(m), Refused);
  m.a.classDisabledRound = null;
  assert.equal(signatureBlocker(m), null);

  m.a.roundsWon = 1;
  m.round = 1;
  m.b.classDisabledRound = 2;
  assert.equal(opponentUnleashesNext(m), false);
  const r2 = playRound(m, { stance: 'steady' });
  assert.equal(r2.signatures.some((x) => x.side === 'B'), false);
  if (!m.over) {
    assert.equal(opponentUnleashesNext(m), true, 'available again once disarm expires');
  }
});

test('Maimed disables 1 slot at 0-1 prior injuries and 2 slots at 2+ prior injuries', () => {
  const m0 = createMatch({ a: blank(), b: blank({ kindTrait: 'hateful', cls: 'cestus' }), rng: scripted([e5(1), pct(80), 0]) });
  injuryCheck(m0, m0.a, m0.b, roundRecord({ winner: 'B' }), 'x');
  assert.equal(m0.b.disabled.length, 1);

  const m2 = createMatch({ a: blank(), b: blank({ kindTrait: 'hateful', cls: 'cestus', injuries: injuries('poisoned') }), rng: scripted([e5(1), pct(30), 0, 0]) });
  injuryCheck(m2, m2.a, m2.b, roundRecord({ winner: 'B' }), 'x');
  assert.deepEqual([...m2.b.disabled].sort(), ['class', 'kind']);
});

test('matchupsFor respects Stripped of Armour, guard > 0, and disabled class slot', () => {
  const club = makeCombatant(blank({ cls: 'fighter', weapon: 'club' }), 'A');
  const greaves = makeCombatant(blank({ gear: { armor: 'lightGreaves' } }), 'B');
  assert.equal(matchupsFor(club, greaves).length, 1, 'Light Greaves has guard > 0');
  const stripped = makeCombatant(blank({ gear: { armor: 'bronzeCuirass' } }), 'B', 'noArmor');
  assert.equal(matchupsFor(club, stripped).length, 0, 'Stripped of Armour removes armor matchup');
  club.disabled.push('class');
  assert.equal(computePhase2(club, greaves, 1).enemy.some((m) => m.source === 'Crushes armour'), false);
});

test('suggestTactic accounts for Concussed and Footwork', () => {
  const conc = createMatch({
    a: blank({ speed: 20, injuries: injuries('concussed') }),
    b: blank({ speed: 1, humor: 'melancholic' }),
    rng: createRng(1),
  });
  // Melancholic loves Guard (70%); Feint counters Guard, but Concussed forces pFirst=0.
  // Even so Feint's counter EV beats Guard, whereas against Choleric/Sanguine with equal speed Footwork boosts Feint.
  const foot = createMatch({
    a: blank({ speed: 4, kindTrait: 'footwork' }),
    b: blank({ speed: 3, humor: 'melancholic' }),
    rng: createRng(1),
  });
  assert.equal(suggestTactic(foot), 'feint');
  // Against an opponent who Presses 70% (Choleric) while A is Concussed and speed 20, Guard still beats Press.
  const vsCholeric = createMatch({
    a: blank({ speed: 20, injuries: injuries('concussed') }),
    b: blank({ speed: 1, humor: 'choleric' }),
    rng: createRng(1),
  });
  assert.equal(suggestTactic(vsCholeric), 'guard');
});

test('hypeOf clamps per round to HYPE.max so a later Guard still drains below max', () => {
  const wound = { attacker: 'A', injury: { tag: 'fleshWound' } };
  const bigRound = { winner: 'A', win: { chance: 20000 }, checks: [wound, wound, wound, wound], stances: { A: 'allIn' }, counter: 'A' };
  const guardRound = { winner: 'B', win: { chance: 50000 }, checks: [], stances: { A: 'guard' } };
  assert.equal(hypeOf({ rounds: [bigRound] }), HYPE.max);
  assert.equal(hypeOf({ rounds: [bigRound, guardRound] }), HYPE.max + HYPE.guard);
});

test('playRound attaches pre-round r.before snapshot untouched by round mutations', () => {
  const m = createMatch({
    a: blank({ power: 15, injuries: injuries('fleshWound') }),
    b: blank({ power: 5, injuries: injuries('poisoned') }),
    rng: createRng(7),
  });
  const r = playRound(m, { stance: 'press' });
  assert.ok(r.before);
  assert.equal(r.before.a.alive, true);
  assert.equal(r.before.b.alive, true);
  assert.equal(r.before.a.roundsWon, 0);
  assert.equal(r.before.b.roundsWon, 0);
  assert.equal(r.before.a.injuries.length, 1);
  assert.equal(r.before.b.injuries.length, 1);
  assert.equal(r.before.a.power.total, 15);
  assert.equal(r.before.a.speed, 3);
  assert.ok(m.a.roundsWon + m.b.roundsWon === 1, 'live state advanced while r.before stayed 0-0');
});

test('Contract D combat rules: Axe +5% injure, Viper Venom +15 severity, COMBAT & data tunables', () => {
  assert.equal(COMBAT.swordParry, 25000);
  assert.equal(COMBAT.riposteWin, 5000);
  assert.equal(COMBAT.axeInjure, 5000);
  assert.equal(COMBAT.ornithariusBase, 5000);
  assert.equal(INJURIES.find((i) => i.tag === 'blinded').weight, 2);
  assert.deepEqual(SHORT.oppPower, [2, 4, 9, 12]);
  assert.equal(SHORT.grandPower, 19);
  assert.equal(SHORT.purse, 1.6);
  assert.deepEqual(SHORT.marketPower, [0, 2, 6, 10]);
  assert.deepEqual(TRAINING, { fullFeeFrom: 4, cheapFee: 2, midTier: 3, midFee: 3 });
  assert.equal(LOUNGE.hostGold, 2);
  assert.equal(QUESTS.goldScale, 0.5);
  assert.equal(BRACKET.earlyBossLoss, 0.75);
  assert.equal(BRACKET.earlyBossLossGold, 0);
  assert.equal(SUMMONS.sweptFavor, -5);
  assert.equal(ECONOMY.decorCost, undefined);
  assert.equal(MORALE.perDecor, undefined);
  assert.deepEqual(SIGNATURES.cestus.boost, { power: 2, self: 5000 });
  assert.deepEqual(SIGNATURES.retiarius.foe, { speed: -4, win: -5000 });
  assert.deepEqual(SIGNATURES.sagittarius.boost, { win: 12000, injure: 20000 });
  assert.deepEqual(TACTICS.steady.self, -2500);
  assert.deepEqual(TACTICS.press.win, 1500);
  assert.deepEqual(TACTICS.press.self, 10000);
  assert.deepEqual(CONSUMABLES.viperVenom.boost, { injure: 15000, severity: 15 });
  assert.equal(GEAR.hunterBow.win, 3000);
  assert.equal(GEAR.lightGreaves.guard, 3000);
  assert.equal(GEAR.loricaSegmentata.guard, 15000);
  assert.equal(GEAR.lionPelt.win, 6000);

  const axe = makeCombatant(blank({ cls: 'fighter', weapon: 'axe' }), 'A');
  const opp = makeCombatant(blank(), 'B');
  assert.ok(sources(computePhase2(axe, opp, 1).enemy).includes('Axe:5000'));

  // Viper Venom adds +15 to severity roll: d100(35) + 15 = 50 -> Concussed.
  const mv = createMatch({ a: blank(), b: blank(), rng: scripted([e5(1), pct(35)]) });
  mv.a.boosts = [{ ...CONSUMABLES.viperVenom.boost, name: CONSUMABLES.viperVenom.name, round: 1 }];
  const chk = injuryCheck(mv, mv.a, mv.b, roundRecord({ winner: 'A' }), 'Venom strike');
  assert.equal(chk.injury.roll, 50);
  assert.equal(chk.injury.tag, 'concussed');
});

test('estimateOdds forwards oracle, uses signatures when enabled, and ignores weight-0 Distracted', () => {
  const f = blank({ cls: 'fighter', weapon: 'sword', level: 3, power: 6 });
  const o = blank({ power: 6, humor: 'choleric' });
  const withSig = estimateOdds(f, o, { useSignatures: true, n: 600 });
  const noSig = estimateOdds(f, o, { useSignatures: false, n: 600 });
  assert.ok(withSig.win > noSig.win, `withSig ${withSig.win} > noSig ${noSig.win}`);
  const noOracle = estimateOdds(blank({ power: 6 }), blank({ power: 6, humor: 'sanguine' }), { oracle: 0, n: 800 });
  const oracle2 = estimateOdds(blank({ power: 6 }), blank({ power: 6, humor: 'sanguine' }), { oracle: 2, n: 800 });
  assert.ok(oracle2.win >= noOracle.win, `oracle2 ${oracle2.win} >= noOracle ${noOracle.win}`);
});

test('narration: Samnite shield parry, weight-2 injury stories, roll100 boundary misses, and death advice', () => {
  const m = createMatch({ a: blank({ name: 'A' }), b: blank({ name: 'B', cls: 'samnite' }), rng: createRng(1) });
  const r = {
    round: 1,
    initiative: { first: 'A', reason: 'speed', speed: { A: { total: 3 }, B: { total: 3 } }, rolls: { A: 4, B: 2 } },
    power: { A: { total: 5 }, B: { total: 5 } },
    delta: 0,
    win: { base: 50000, modsA: [], modsB: [], chance: 50000 },
    roll: 50040,
    winner: 'B',
    checks: [
      { attacker: 'A', defender: 'B', label: 'First strike', chance: 99999, roll: 100000, hit: false },
      { attacker: 'A', defender: 'B', label: 'Shield', chance: 50000, roll: 10000, hit: true, parry: { success: true, shield: true } },
      { attacker: 'B', defender: 'A', label: 'Blind', chance: 50000, roll: 10000, hit: true, injury: { tag: 'blinded', name: 'Blinded', raw: 95, score: 95 } },
    ],
    endEffects: [],
  };
  const math = narrateRound(m, r).map((l) => l.text).join(' ');
  assert.match(math, /needs 50 or less, rolled 50\.04/);
  assert.match(math, /needs 99\.999 or less to wound, rolled 100/);
  const story = narrateStory(m, r).map((l) => l.text).join(' ');
  assert.match(story, /catches A's blow on the shield/);
  assert.doesNotMatch(story, /ripostes/);
  assert.match(story, /Blinded \(counts as two injuries!\)/);

  const base = { a: { f: { name: 'Livia' } }, preMatch: [], result: { winner: 'B', reason: 'death' } };
  assert.match(adviceFor({ ...base, rounds: [{ checks: [{ allIn: true, defender: 'A' }] }] }), /All In/);
  assert.match(adviceFor({ ...base, debuff: 'emperorsGaze', rounds: [] }), /Emperor's Gaze/);
  assert.match(adviceFor({ ...base, debuff: 'firstInjuryDouble', rounds: [{ checks: [] }] }), /First Blood Counts Double/);
});

test('explain: harshJudges keeps bossFinalRefund note, Death Gate warns bad, roundStats previews opponent signature', () => {
  const run = createRun(5);
  const f = recruit(run, run.market[0].id);
  run.topTier = 3;
  run.arenas[3] = { ...run.arenas[1], tier: 3, stage: 2, debuff: 'lions' };
  run.setup = { decrees: ['harshJudges'] };
  const stakes = arenaStakes(run, 3);
  assert.match(stakes, /buy-in comes back/);
  assert.doesNotMatch(stakes, /if you fall before the Final/);

  // Under Lions, Death Gate opens at 1 injury!
  f.injuries = [{ tag: 'fleshWound', weight: 1, weeksLeft: 1 }];
  const warns = fighterWarnings(run, f, 3);
  assert.ok(warns.some((w) => w.tone === 'bad' && /Death Gate open/.test(w.text)));

  // roundStats previews guaranteed opponent signature without mutating match.
  const m = createMatch({ a: blank({ power: 8 }), b: blank({ cls: 'cestus', level: 3, power: 8 }), rng: createRng(1) });
  m.a.roundsWon = 1;
  m.round = 1;
  assert.equal(opponentUnleashesNext(m), true);
  const stats = roundStats(m);
  assert.equal(stats.B.power, 10, 'Haymaker +2 Power previewed');
  assert.equal(m.b.boosts, undefined, 'match not mutated');
});
