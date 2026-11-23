// 7.2 Blood and venom: Bleeding, wound affinities and their Death Gate guardrail (docs/roadmap-v7.md, Phase 2).
import test from 'node:test';
import assert from 'node:assert/strict';
import { INJURY_BY_TAG, CONSUMABLES, DECOR, AFFINITY, BLEEDING, HEAL_WEEKS, injuryForScore, isBladed } from '../src/data.js';
import { createMatch, injuryCheck, computePhase2, makeCombatant, affinitySources } from '../src/fight.js';
import { narrateRound } from '../src/narrate.js';
import { blank, scripted, e5, pct, roundRecord } from './helpers.js';

// X (side A) lands a blow on B: hit roll, severity roll, then one steer roll per source that could change the wound.
function strike(a, { roll, steer = [], b = blank({ id: 'b' }), boosts = [], debuff = null } = {}) {
  const m = createMatch({ a, b, rng: scripted([e5(1), pct(roll), ...steer.map(e5)]), debuff });
  m.a.boosts = boosts.map((x) => ({ ...x, round: 1 }));
  const chk = injuryCheck(m, m.a, m.b, { ...roundRecord({ winner: 'A' }), initiative: { first: 'B' } }, 'Strike');
  return { m, inj: chk.injury, chk };
}
const item = (k) => ({ ...CONSUMABLES[k].boost, name: CONSUMABLES[k].name });

test('Bleeding: weight 1, rolls 39–48, heals like a Flesh Wound', () => {
  assert.equal(INJURY_BY_TAG.bleeding.weight, 1);
  assert.equal(injuryForScore(39).tag, 'bleeding');
  assert.equal(injuryForScore(48).tag, 'bleeding');
  assert.equal(injuryForScore(38).tag, 'fleshWound');
  assert.equal(injuryForScore(49).tag, 'concussed');
  assert.equal(HEAL_WEEKS.bleeding, 1);
  // The heavy bands (61–99) are unchanged, so Death Gate odds hold.
  assert.equal(injuryForScore(61).tag, 'poisoned');
  assert.equal(injuryForScore(99).tag, 'blinded');
});

test('Bleeding: +10% chance to be injured per wound, +5% while Guarding; a staunched wound does nothing', () => {
  const f = blank({ injuries: [{ tag: 'bleeding', weight: 1 }, { tag: 'bleeding', weight: 1 }] });
  const c = makeCombatant(f, 'A');
  const opp = makeCombatant(blank(), 'B');
  const bleed = (cc) => computePhase2(cc, opp, 1).self.find((x) => x.source === 'Bleeding')?.value ?? 0;
  assert.equal(bleed(c), 2 * BLEEDING.self);
  c.stance = 'guard';
  assert.equal(bleed(c), 2 * BLEEDING.guarding);
  c.stance = null;
  c.f.injuries[0].suppressed = true;
  assert.equal(bleed(c), BLEEDING.self);
});

test('a weapon steers a wound of the same weight, 35% of the time', () => {
  const club = () => blank({ cls: 'fighter', weapon: 'club' });
  assert.equal(strike(club(), { roll: 30, steer: [AFFINITY.steer] }).inj.tag, 'concussed', 'Flesh Wound -> Concussed');
  assert.equal(strike(club(), { roll: 30, steer: [AFFINITY.steer + 1] }).inj.tag, 'fleshWound', 'the roll failed');
  const heavy = strike(club(), { roll: 70, steer: [1] }).inj;
  assert.equal(heavy.tag, 'senseless', 'Poisoned -> Senseless (same weight)');
  assert.deepEqual(heavy.steered, { from: 'Poisoned', source: 'Club' });
});

test('guardrail: weapons, gear and decor never add Death Gate weight', () => {
  // A Distracted graze (weight 0) can't become a weight-1 wound; a weight-1 wound can't become weight 2.
  assert.equal(strike(blank({ cls: 'fighter', weapon: 'dagger' }), { roll: 10, steer: [1] }).inj.tag, 'distracted');
  // The Axe's Cleave adds 15 to the roll: 40 + 15 = 55 is Concussed (weight 1), 46 + 15 = 61 is Poisoned (weight 2).
  assert.equal(strike(blank({ cls: 'fighter', weapon: 'axe' }), { roll: 40, steer: [1] }).inj.tag, 'concussed', 'Axe only Maims a weight-2 wound');
  assert.equal(strike(blank({ cls: 'fighter', weapon: 'axe' }), { roll: 46, steer: [1] }).inj.tag, 'maimed');
});

test('single-use items reach one weight up, but only on hard hits (49+)', () => {
  const venom = [item('viperVenom')];
  assert.equal(strike(blank(), { roll: 55, steer: [1], boosts: venom }).inj.tag, 'poisoned', 'Concussed -> Poisoned');
  assert.equal(strike(blank(), { roll: 40, steer: [1], boosts: venom }).inj.tag, 'bleeding', 'a light hit stays light');
  assert.equal(strike(blank(), { roll: 80, steer: [1], boosts: venom }).inj.tag, 'poisoned', 'Maimed -> Poisoned');
  // Blood Thinner: light wounds bleed; a Distracted graze never becomes a wound (the guardrail wins).
  const thin = [item('bloodThinner')];
  assert.equal(strike(blank(), { roll: 30, steer: [1], boosts: thin }).inj.tag, 'bleeding');
  assert.equal(strike(blank(), { roll: 20, steer: [1], boosts: thin }).inj.tag, 'distracted');
});

test('Blinding Powder: a hard hit Blinds, a light one only Distracts; a Cyborg Eye shrugs it off', () => {
  const powder = [item('blindingPowder')];
  assert.equal(strike(blank(), { roll: 55, steer: [1], boosts: powder }).inj.tag, 'blinded');
  assert.equal(strike(blank(), { roll: 30, steer: [1], boosts: powder }).inj.tag, 'distracted');
  const eye = strike(blank(), { roll: 55, steer: [1], boosts: powder, b: blank({ id: 'b', augments: ['eye'] }) }).inj;
  assert.equal(eye.tag, 'fleshWound');
  assert.equal(eye.deflected, 'Cyborg Eye');
});

test('Cyborg Arm: a blow that would Maim becomes a Flesh Wound', () => {
  const inj = strike(blank(), { roll: 80, b: blank({ id: 'b', augments: ['arm'] }) }).inj;
  assert.equal(inj.tag, 'fleshWound');
  assert.equal(inj.deflected, 'Cyborg Arm');
});

test('only the first source that succeeds turns the wound; sources that could not change it do not roll', () => {
  // Cestus (class, stun) with Viper Venom: the item rolls first and fails, the class succeeds.
  const r = strike(blank({ cls: 'cestus' }), { roll: 55, steer: [99999, 1], boosts: [item('viperVenom')] });
  assert.equal(r.inj.tag, 'concussed', 'Concussed already: the Cestus has nothing to change');
  const s = strike(blank({ cls: 'cestus' }), { roll: 30, steer: [99999, 1], boosts: [item('viperVenom')] });
  assert.equal(s.inj.tag, 'fleshWound', 'Venom could not reach Poison on a light hit, so it never rolled; the Cestus roll (99999) failed');
});

test('Arena Craft decor: the Whetstone Rack for bladed fighters, the Viper Terrarium for anyone; off under Iron Rules', () => {
  const sword = blank({ cls: 'fighter', weapon: 'sword', decor: { whetstone: 1 } });
  assert.ok(isBladed(sword));
  assert.equal(strike(sword, { roll: 30, steer: [1] }).inj.tag, 'bleeding');
  const brawler = blank({ cls: 'fighter', weapon: 'club', decor: { whetstone: 1 } });
  assert.ok(!affinitySources(makeCombatant(brawler, 'A'), 1, 30).some((x) => x.source === 'Whetstone Rack'));
  assert.ok(isBladed(blank({ gear: { weapon: 'gladius' } })) && isBladed(blank({ cls: 'thornBlade' })));
  const keeper = blank({ decor: { terrarium: 1 } });
  assert.equal(strike(keeper, { roll: 80, steer: [1] }).inj.tag, 'poisoned');
  assert.equal(strike(keeper, { roll: 80, steer: [1], debuff: 'ironRules' }).inj.tag, 'maimed', 'Iron Rules: no decor');
  assert.equal(DECOR.terrarium.group, 'craft');
  assert.ok(DECOR.terrarium.helps({ cls: 'ashHungry' }) && DECOR.terrarium.helps({ kind: 'vampire' }) && !DECOR.terrarium.helps({ kind: 'human' }));
});

test('the narration says which style turned the wound (real seeded fights)', async () => {
  const { autoPlay, suggestTactic } = await import('../src/fight.js');
  const { createRng } = await import('../src/rng.js');
  let found = null;
  for (let seed = 1; seed < 400 && !found; seed++) {
    const m = createMatch({ a: blank({ cls: 'fighter', weapon: 'club', name: 'Aulus', power: 8 }), b: blank({ id: 'b', name: 'Brutus' }), rng: createRng(seed) });
    autoPlay(m, suggestTactic);
    for (const r of m.rounds) if (r.checks.some((c) => c.injury?.steered)) found = { m, r };
  }
  assert.ok(found, 'some Club blow was steered');
  const c = found.r.checks.find((x) => x.injury?.steered);
  assert.equal(c.injury.steered.source, 'Club');
  assert.match(JSON.stringify(narrateRound(found.m, found.r)), new RegExp(`Club turned a ${c.injury.steered.from} into ${c.injury.name}`));
});

test('the Viper Terrarium calms only Ash-Hungry and Vampire fighters', async () => {
  const { decorCalm } = await import('../src/run.js');
  assert.equal(decorCalm(blank({ decor: { terrarium: 1 } })), 0);
  assert.equal(decorCalm(blank({ cls: 'ashHungry', decor: { terrarium: 1 } })), DECOR.terrarium.calm);
  assert.equal(decorCalm(blank({ kind: 'vampire', decor: { terrarium: 1 } })), DECOR.terrarium.calm);
});

test('Blessed Bandage staunches one Bleeding wound for the fight', async () => {
  const { createRun, recruit, advanceToTournament, startMatch, useItem, choosePerk } = await import('../src/run.js');
  const run = createRun(30);
  const f = recruit(run, run.market[0].id);
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  advanceToTournament(run);
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  run.inventory.items.blessedBandage = 1;
  const m = startMatch(run, f.id, 1);
  m.a.f.injuries = [{ tag: 'bleeding', weight: 1 }, { tag: 'bleeding', weight: 1 }];
  useItem(run, m, 'blessedBandage');
  assert.equal(m.a.f.injuries.filter((i) => i.suppressed).length, 1);
  assert.equal(computePhase2(m.a, m.b, 1).self.find((x) => x.source === 'Bleeding').value, BLEEDING.self);
});

test('Blood Drinker can drink a Bleeding wound', () => {
  const vamp = blank({ kind: 'vampire', kindTrait: 'bloodDrinker', injuries: [{ tag: 'bleeding', weight: 1, weeksLeft: undefined }] });
  const { chk, m } = strike(vamp, { roll: 30 });
  assert.equal(chk.drained, 'bleeding');
  assert.equal(m.a.f.injuries.length, 0);
});

test('a Rest week heals half a week of Bleeding, like a Flesh Wound', async () => {
  const { createRun, recruit, advanceWeek } = await import('../src/run.js');
  const run = createRun(31);
  const f = recruit(run, run.market[0].id);
  f.job = 'rest';
  f.injuries = [{ tag: 'bleeding', weight: 1, weeksLeft: 1 }];
  advanceWeek(run);
  assert.equal(f.injuries[0]?.weeksLeft, 0.5);
});
