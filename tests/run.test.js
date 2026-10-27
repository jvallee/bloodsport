import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { KINDS, CIRCUITS, GRAND, STRESS, ECONOMY, FAVOR, MORALE, XP, PERKS, GEAR, TRIBUTE, CONSUMABLES, BLOODIED, DECOR } from '../src/data.js';
import { autoPlay } from '../src/fight.js';
import { build, rosterCap, plotsFree } from '../src/ludus.js';
import {
  createRun, createFighter, recruit, recruitBlocker, release, setJob, jobBlocker, advanceWeek, advanceBlocker, advanceToTournament,
  buyDecor, assignDecor, assignDecorBlocker, removeDecor, buyGear, equip, unequip, surgeon, surgeonBlocker,
  startMatch, finishMatch, fightBlocker, skipBout, skipBlocker, forfeitBout, forfeitBlocker, choosePerk, perkBlocker,
  currentBout, boutFor, marketPrice, serialize, deserialize, moraleTarget, moraleState, xpFor, GRAND_TIER, SAVE_VERSION,
  matchOptions, bossLossFavor, buildRoom, recordMatchProgress, buyItem, buyItemBlocker, useItem, useItemBlocker,
  payTribute, payTributeBlocker, tributeDue, sellGear, sellGearBlocker, upcomingBouts,
} from '../src/run.js';
import { computePower, computeSpeed, computePhase2, playRound, throwTowel } from '../src/fight.js';

// A run with one recruited fighter, standing on the first tournament week.
const atBout = (seed = 1) => {
  const run = createRun(seed);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  return { run, f };
};

const fakeMatch = (run, id, { winner = 'A', reason = 'rounds', alive = true, injuries = [], tier } = {}) => {
  const m = startMatch(run, id, tier);
  m.over = true;
  m.result = { winner, reason };
  m.a.f.alive = alive;
  m.a.f.injuries = injuries;
  return m;
};

const playBout = (run, id, opts) => finishMatch(run, fakeMatch(run, id, opts));
// Resolve level-ups so the calendar can move.
const pickPerks = (run) => {
  for (const f of run.roster) while (f.pendingPerks.length) choosePerk(run, f.id, f.pendingPerks[0][0]);
};
const nextBout = (run) => {
  pickPerks(run);
  advanceToTournament(run);
};
// Win the top arena's circuit outright.
const conquerTop = (run, id) => {
  for (let i = 0; i < 3; i++) {
    if (i) nextBout(run);
    playBout(run, id);
  }
};

// ---------- Setup ----------

test('a new career: 12 Gold, 5 Prestige, Favor 50, Martius week 1, one arena, no bout yet', () => {
  const run = createRun(1);
  assert.deepEqual([run.gold, run.prestige, run.favor, run.prestigeLevel, run.week, run.topTier], [12, 5, 50, 1, 0, 1]);
  assert.deepEqual(Object.keys(run.arenas), ['1']);
  assert.equal(run.arenas[1].stage, 0);
  assert.equal(run.arenas[1].opponent.power, CIRCUITS[0].oppPower[0]);
  assert.equal(run.boutPending, false);
  assert.equal(run.market.length, 4);
  assert.equal(run.version, SAVE_VERSION);
});

test('every market includes at least one Orc, and names are unique', () => {
  for (let seed = 0; seed < 40; seed++) {
    const run = createRun(seed);
    assert.ok(run.market.some((f) => f.kind === 'orc'), `seed ${seed}`);
    const names = [...run.market, run.arenas[1].opponent].map((f) => f.name);
    assert.equal(new Set(names).size, names.length);
  }
});

test('careers are deterministic from the seed', () => {
  assert.equal(serialize(createRun(42)), serialize(createRun(42)));
});

test('created fighters follow kind rules and start fresh', () => {
  const rng = createRng(4);
  for (let i = 0; i < 200; i++) {
    const f = createFighter(rng, { id: 'x' });
    assert.equal(f.power, KINDS[f.kind].basePower);
    assert.ok(KINDS[f.kind].traits.includes(f.kindTrait));
    assert.deepEqual([f.stress, f.job, f.xp, f.level, f.renown, f.morale], [0, 'rest', 0, 1, 0, MORALE.start]);
    assert.deepEqual(f.gear, { weapon: null, armor: null });
  }
});

// ---------- Recruiting ----------

test('recruiting costs the tier price and is capped by Quarters', () => {
  const run = createRun(1);
  run.gold = 100;
  const ids = run.market.map((f) => f.id);
  recruit(run, ids[0]);
  recruit(run, ids[1]);
  assert.equal(run.gold, 100 - 2 * marketPrice(run));
  assert.match(recruitBlocker(run, ids[2]), /quarters are full/);
});

test('releasing a fighter returns their decor and gear to the storeroom', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.decor.trophy = 1;
  f.gear.weapon = 'gladius';
  release(run, f.id);
  assert.equal(run.roster.length, 0);
  assert.equal(run.inventory.decor.trophy, 1);
  assert.deepEqual(run.inventory.gear, ['gladius']);
});

// ---------- Weekly jobs ----------

test('training gives +1 Power per week, costs Gold and adds Stress', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  const [power, gold] = [f.power, run.gold];
  setJob(run, f.id, 'trainPower');
  advanceWeek(run);
  assert.deepEqual([f.power, f.trained, f.stress, run.gold], [power + 1, 1, STRESS.train, gold - 1]);
});

test('Speed trains three times as fast: +3 Speed for one training point', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  setJob(run, f.id, 'trainSpeed');
  advanceWeek(run);
  assert.deepEqual([f.speed, f.trained], [6, 1]);
});

test('training stops at the trainer cap and the fighter switches to rest', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.trained = 3;
  assert.match(jobBlocker(run, f.id, 'trainSpeed'), /cap reached/);
  f.trained = 2;
  setJob(run, f.id, 'trainSpeed');
  advanceWeek(run);
  advanceWeek(run);
  assert.deepEqual([f.trained, f.job], [3, 'rest']);
});

test('re-selecting the job a fighter already has is a no-op, even at the trainer cap', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  setJob(run, f.id, 'trainPower');
  f.trained = 3;
  assert.equal(jobBlocker(run, f.id, 'trainPower'), null);
  assert.doesNotThrow(() => setJob(run, f.id, 'trainPower'));
});

test('one Trainer Room trains one fighter at a time', () => {
  const run = createRun(1);
  const [a, b] = [recruit(run, run.market[0].id), recruit(run, run.market[0].id)];
  setJob(run, a.id, 'trainPower');
  assert.match(jobBlocker(run, b.id, 'trainPower'), /is training/);
});

test('training without Gold falls back to rest', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  setJob(run, f.id, 'trainPower');
  run.gold = 0;
  const power = f.power;
  advanceWeek(run);
  assert.deepEqual([f.power, f.job], [power, 'rest']);
});

test('rest lowers Stress by 40; Stress stays within 0–100', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.stress = 60;
  advanceWeek(run);
  assert.equal(f.stress, 20);
  advanceWeek(run);
  assert.equal(f.stress, 0);
});

test('training a fighter who just became overtrained switches them to Rest, with a notice on the card', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.stress = 40;
  setJob(run, f.id, 'trainPower');
  advanceWeek(run); // 40 + 20 = 60: overtrained now
  assert.equal(f.stress, 60);
  assert.equal(f.job, 'rest');
  assert.match(f.notice, /Stress 60/);
});

test('Iron Constitution cuts training Stress by 10', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.perks.push('ironConstitution');
  setJob(run, f.id, 'trainPower');
  advanceWeek(run);
  assert.equal(f.stress, STRESS.train - 10);
});

test('the Medbay heals injuries over weeks, then sends the fighter to rest', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  assert.match(jobBlocker(run, f.id, 'medbay'), /Not injured/);
  f.injuries = [{ tag: 'concussed', weight: 1, weeksLeft: 2 }, { tag: 'fleshWound', weight: 1, weeksLeft: 1 }];
  setJob(run, f.id, 'medbay');
  advanceWeek(run);
  assert.equal(f.injuries.length, 2);
  advanceWeek(run);
  assert.deepEqual(f.injuries.map((i) => i.tag), ['fleshWound']);
  advanceWeek(run);
  assert.deepEqual([f.injuries.length, f.job], [0, 'rest']);
});

test('injuries do not heal outside the Medbay, and the Medbay has limited beds', () => {
  const run = createRun(1);
  const [a, b] = [recruit(run, run.market[0].id), recruit(run, run.market[0].id)];
  a.injuries = [{ tag: 'fleshWound', weight: 1, weeksLeft: 1 }];
  b.injuries = [{ tag: 'fleshWound', weight: 1, weeksLeft: 1 }];
  setJob(run, a.id, 'medbay');
  assert.match(jobBlocker(run, b.id, 'medbay'), /full/);
  advanceWeek(run);
  assert.equal(b.injuries.length, 1);
});

test('the Emergency Surgeon heals one injury instantly for 8 Gold in tier 1, +4 per tier', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.injuries = [{ tag: 'blinded', weight: 1, weeksLeft: 3 }];
  surgeon(run, f.id, 0);
  assert.deepEqual([f.injuries.length, run.gold], [0, 12 - 3 - 8]);
  f.injuries = [{ tag: 'blinded', weight: 1, weeksLeft: 3 }];
  assert.match(surgeonBlocker(run, f.id, 0), /needs 8 Gold/);
  run.topTier = 3;
  assert.match(surgeonBlocker(run, f.id, 0), /needs 16 Gold/);
});

// ---------- Morale ----------

test('Morale drifts toward comfort minus expectations', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  assert.equal(moraleTarget(run, f).target, MORALE.base + MORALE.perQuartersLevel);
  f.decor.trophy = 1;
  f.renown = 10;
  assert.equal(moraleTarget(run, f).target, MORALE.base + MORALE.perQuartersLevel + MORALE.perDecor - 20);
  f.morale = 90;
  advanceWeek(run);
  assert.equal(f.morale, 80, 'drifts 10 per week');
});

test('Morale states: Inspired 80+, Discontented below 40, Mutinous below 20', () => {
  assert.equal(moraleState({ morale: 85 }).id, 'inspired');
  assert.equal(moraleState({ morale: 50 }).id, 'content');
  assert.equal(moraleState({ morale: 30 }).id, 'restless');
  assert.equal(moraleState({ morale: 10 }).id, 'mutinous');
});

test('a Discontented fighter will not train', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  setJob(run, f.id, 'trainPower');
  f.morale = 30;
  const power = f.power;
  advanceWeek(run);
  assert.equal(f.power, power);
});

test('a Mutinous fighter refuses to fight', () => {
  const { run, f } = atBout();
  f.morale = 10;
  assert.match(fightBlocker(run, f.id), /mutinous/);
});

test('a house that stays below 20 average Morale for 4 weeks revolts', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  run.buildings = run.buildings.filter((b) => b.type !== 'quarters');
  f.renown = 50;
  f.morale = 0;
  for (let i = 0; i < 4 && run.status === 'active'; i++) {
    run.boutPending = false;
    advanceWeek(run);
  }
  assert.equal(run.status, 'lost');
  assert.match(run.endReason, /revolt/);
});

// ---------- Storeroom: decor and gear ----------

test('decor is bought into the storeroom, assigned up to the Quarters cap, and can be taken back', () => {
  const run = createRun(1);
  const [a, b] = [recruit(run, run.market[0].id), recruit(run, run.market[0].id)];
  buyDecor(run, 'trophy');
  buyDecor(run, 'trophy');
  assert.equal(run.inventory.decor.trophy, 2);
  assignDecor(run, a.id, 'trophy');
  assert.match(assignDecorBlocker(run, a.id, 'trophy'), /Upgrade Fighter Quarters/);
  removeDecor(run, a.id, 'trophy');
  assignDecor(run, b.id, 'trophy');
  assert.deepEqual([a.decor.trophy, b.decor.trophy, run.inventory.decor.trophy], [0, 1, 1]);
});

test('the Armourer stocks gear monthly; equipping swaps the old item back to the storeroom', () => {
  const run = createRun(1);
  run.gold = 200;
  run.prestigeLevel = 2;
  const f = recruit(run, run.market[0].id);
  build(run, 'armourer');
  advanceToTournament(run);
  run.boutPending = false;
  advanceWeek(run);
  assert.equal(run.armourerStock.length, 3);
  assert.ok(run.armourerStock.every((k) => GEAR[k].tier === 1));
  run.inventory.gear.push('gladius', 'trident');
  equip(run, f.id, run.inventory.gear.indexOf('gladius'));
  equip(run, f.id, run.inventory.gear.indexOf('trident'));
  assert.equal(f.gear.weapon, 'trident');
  assert.ok(run.inventory.gear.includes('gladius'));
  unequip(run, f.id, 'weapon');
  assert.equal(f.gear.weapon, null);
  const key = buyGear(run, 0);
  assert.ok(run.inventory.gear.includes(key));
});

// ---------- Calendar ----------

test('week 4 of each month is a tournament week that must be resolved', () => {
  const run = createRun(1);
  recruit(run, run.market[0].id);
  assert.equal(advanceToTournament(run), 3);
  assert.equal(run.boutPending, true);
  assert.match(advanceBlocker(run), /Tournament week/);
});

test('the market and Liaison refresh at the start of each month', () => {
  const { run, f } = atBout();
  const before = run.market.map((x) => x.id);
  playBout(run, f.id);
  pickPerks(run);
  advanceWeek(run);
  assert.ok(run.market.every((x) => !before.includes(x.id)));
});

test('the Liaison offers a cheap injured convict once built', () => {
  const run = createRun(1);
  run.prestigeLevel = 2;
  run.gold = 100;
  build(run, 'liaison');
  advanceToTournament(run);
  run.boutPending = false;
  advanceWeek(run);
  assert.equal(run.liaisonOffer.price, 1);
  assert.equal(run.liaisonOffer.injuries[0].tag, 'fleshWound');
  const id = run.liaisonOffer.id;
  recruit(run, id);
  assert.equal(run.liaisonOffer, null);
  assert.ok(run.roster.some((x) => x.id === id));
});

test('tribute is paid at the start of winter; unpaid tribute costs Favor', () => {
  const run = createRun(1);
  recruit(run, run.market[0].id);
  run.week = 39;
  run.gold = 100;
  advanceWeek(run);
  assert.equal(run.gold, 100 - TRIBUTE.perYear);
  const poor = createRun(2);
  recruit(poor, poor.market[0].id);
  poor.week = 39;
  poor.gold = 3;
  advanceWeek(poor);
  assert.deepEqual([poor.gold, poor.favor], [0, FAVOR.start + FAVOR.unpaidTribute]);
});

// ---------- Tournaments ----------

test('fights only happen on tournament weeks and cost the buy-in', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  assert.match(fightBlocker(run, f.id), /tournament weeks/);
  advanceToTournament(run);
  startMatch(run, f.id);
  assert.equal(run.prestige, 5 - CIRCUITS[0].buyIn[0]);
});

test('a fighter with Stress 50+ enters overtrained', () => {
  const { run, f } = atBout();
  f.stress = STRESS.overtrained;
  const m = startMatch(run, f.id);
  assert.equal(m.preMatch[0]?.source, 'Overtrained');
});

test('a win pays Gold, Prestige, XP and Renown, raises Morale, and moves to Tournament 2', () => {
  const { run, f } = atBout();
  const [gold, prestige, morale] = [run.gold, run.prestige, f.morale];
  f.power = run.arenas[1].opponent.power; // an even match, so no upset bonuses
  const s = playBout(run, f.id);
  assert.deepEqual([s.gold, s.prestige, s.xp, s.renown], [CIRCUITS[0].winGold[0], CIRCUITS[0].winPrestige[0], XP.win, 2]);
  assert.deepEqual([run.gold, run.prestige, run.arenas[1].stage, run.boutPending], [gold + CIRCUITS[0].winGold[0], prestige + CIRCUITS[0].winPrestige[0], 1, false]);
  assert.deepEqual([f.stress, f.renown, f.morale], [STRESS.fight, 2, morale + MORALE.win]);
  assert.equal(run.arenas[1].opponent.power, CIRCUITS[0].oppPower[1]);
});

test('Renown adds +1 Gold per 5 to a fighter\'s winnings', () => {
  const { run, f } = atBout();
  f.renown = 10;
  assert.equal(playBout(run, f.id).gold, CIRCUITS[0].winGold[0] + 2);
});

test('XP: wins 3, losses 1, Bosses double, upsets +2', () => {
  assert.deepEqual([xpFor(true, false, false), xpFor(false, false, false), xpFor(true, true, false), xpFor(true, false, true)], [3, 1, 6, 5]);
});

test('levelling up offers 3 perks; the week cannot end until one is chosen', () => {
  const { run, f } = atBout();
  playBout(run, f.id);
  assert.equal(f.level, 2);
  assert.equal(f.pendingPerks[0].length, 3);
  assert.match(advanceBlocker(run), /choose their perk/);
  assert.match(perkBlocker(run, f.id, 'nope'), /not on offer/);
  const offer = f.pendingPerks[0];
  const pick = offer.includes('mighty') ? 'mighty' : offer[0];
  const power = f.power;
  choosePerk(run, f.id, pick);
  assert.ok(f.perks.includes(pick));
  if (pick === 'mighty') assert.equal(f.power, power + 1);
  assert.equal(advanceBlocker(run), null);
});

test('combo perks are only offered to fighters who meet them', () => {
  for (let seed = 0; seed < 60; seed++) {
    const { run, f } = atBout(seed);
    f.power = 4 + (seed % 12);
    f.speed = 3 + (seed % 9);
    playBout(run, f.id);
    for (const p of f.pendingPerks.flat()) if (PERKS[p].req) assert.ok(PERKS[p].req(f), `${p} offered to P${f.power} S${f.speed}`);
  }
});

test('injuries from a match get healing times', () => {
  const { run, f } = atBout();
  playBout(run, f.id, { winner: 'B', injuries: [{ tag: 'blinded', weight: 1 }] });
  assert.deepEqual(f.injuries, [{ tag: 'blinded', weight: 1, weeksLeft: 3 }]);
});

test('skipping Tournament 1 gives Gold and rest, but Bosses cannot be skipped', () => {
  const { run, f } = atBout();
  f.stress = 40;
  skipBout(run);
  assert.deepEqual([run.gold, f.stress, run.arenas[1].stage], [12 - 3 + ECONOMY.skipGold, 20, 1]);
  nextBout(run);
  skipBout(run);
  nextBout(run);
  assert.equal(currentBout(run).boss, true);
  assert.match(skipBlocker(run), /cannot be skipped/);
  assert.equal(forfeitBlocker(run), null);
});

test('beating your top Boss grants a Title, Favor and the next arena; the old arena stays open', () => {
  const { run, f } = atBout();
  playBout(run, f.id);
  nextBout(run);
  playBout(run, f.id);
  nextBout(run);
  const favor = run.favor;
  const bossPower = run.arenas[1].opponent.power;
  f.power = bossPower; // not an upset, so only the Boss bonus applies
  const s = playBout(run, f.id);
  assert.match(s.title, /Champion of the Dirt Pits/);
  assert.equal(f.power, bossPower + 1, 'the Title adds +1 Power');
  assert.equal(s.favor, FAVOR.bossWin);
  assert.equal(run.favor, favor + FAVOR.bossWin);
  assert.equal(run.topTier, 2);
  assert.deepEqual(Object.keys(run.arenas), ['1', '2']);
  assert.equal(run.arenas[1].conquered, true);
  assert.equal(run.arenas[1].stage, 0);
});

test('losing your top Boss costs Favor, and that Boss returns stronger next circuit', () => {
  const { run, f } = atBout();
  skipBout(run);
  nextBout(run);
  skipBout(run);
  nextBout(run);
  const boss = run.arenas[1].opponent;
  playBout(run, f.id, { winner: 'B' });
  assert.equal(run.favor, FAVOR.start + bossLossFavor(1));
  assert.deepEqual([run.topTier, run.arenas[1].stage], [1, 0]);
  assert.equal(run.arenas[1].rival.name, boss.name);
  run.arenas[1].stage = 2;
  run.arenas[1].opponent = null;
  // The next time the circuit reaches its Boss, the rival is back with +1 Power.
  run.arenas[1].stage = 1;
  run.boutPending = true;
  run.bouts = { 1: 'open' };
  skipBout(run);
  assert.equal(run.arenas[1].opponent.name, boss.name);
  assert.equal(run.arenas[1].opponent.power, boss.power + 1);
});

test('forfeiting a Boss costs 5 more Favor than losing it; at 0 Favor you are executed', () => {
  const { run } = atBout();
  run.prestige = 100;
  skipBout(run);
  nextBout(run);
  skipBout(run);
  nextBout(run);
  forfeitBout(run);
  assert.equal(run.favor, FAVOR.start + bossLossFavor(1) + FAVOR.forfeitExtra);
  run.favor = 10;
  nextBout(run);
  skipBout(run);
  nextBout(run);
  skipBout(run);
  nextBout(run);
  forfeitBout(run);
  assert.equal(run.status, 'lost');
  assert.match(run.endReason, /Favor is gone/);
});

// ---------- Multiple arenas ----------

const twoArenas = () => {
  const run = createRun(3);
  run.gold = 200;
  run.prestige = 200;
  const a = recruit(run, run.market[0].id);
  const b = recruit(run, run.market[0].id);
  advanceToTournament(run);
  conquerTop(run, a.id);
  nextBout(run);
  return { run, a, b };
};

test('after conquering an arena, tournament weeks open bouts in every arena you have reached', () => {
  const { run } = twoArenas();
  assert.deepEqual(run.bouts, { 1: 'open', 2: 'open' });
  assert.equal(boutFor(run, 1).top, false);
  assert.equal(boutFor(run, 2).top, true);
});

test('each fighter can fight once a week; different fighters can take different arenas', () => {
  const { run, a, b } = twoArenas();
  playBout(run, a.id, { tier: 2 });
  assert.match(fightBlocker(run, a.id, 1), /already fought/);
  assert.equal(fightBlocker(run, b.id, 1), null);
  playBout(run, b.id, { tier: 1 });
  assert.match(fightBlocker(run, b.id, 1), /settled/);
});

test('lower arenas pay half Prestige per tier below, and only the top arena must be resolved', () => {
  const { run, a } = twoArenas();
  assert.equal(boutFor(run, 1).winPrestige, Math.floor(CIRCUITS[0].winPrestige[0] / 2));
  playBout(run, a.id, { tier: 2 });
  pickPerks(run);
  assert.equal(advanceBlocker(run), null, 'the lower arena can be left alone');
});

test('a known fighter crushing a weaker opponent in a lower arena angers the crowd: no Renown, −Morale, −Favor', () => {
  const { run, b } = twoArenas(); // b is not a champion of the Dirt Pits
  b.renown = ECONOMY.knownRenown;
  b.power = run.arenas[1].opponent.power + ECONOMY.crushingGap;
  const [favor, morale, renown] = [run.favor, b.morale, b.renown];
  const s = playBout(run, b.id, { tier: 1 });
  assert.equal(s.crushing, true);
  assert.deepEqual([b.renown, b.morale, run.favor], [renown, morale + MORALE.crowdJeers, favor + FAVOR.crushingWin]);
});

test('losing a lower-arena Boss costs no Favor and no title is re-awarded', () => {
  const { run, a, b } = twoArenas();
  run.arenas[1].stage = 2;
  const favor = run.favor;
  playBout(run, b.id, { tier: 1, winner: 'B' });
  assert.equal(run.favor, favor);
  run.arenas[1].stage = 2;
  run.bouts[1] = 'open';
  run.history = run.history.filter((h) => h.fighterId !== a.id);
  const s = playBout(run, a.id, { tier: 1 });
  assert.equal(s.title, null);
});

test('Bosses always drop their gear; loot goes to the storeroom', () => {
  const { run, a } = twoArenas();
  run.arenas[2].stage = 2;
  run.arenas[2].opponent.gear.weapon = 'gladius';
  const s = playBout(run, a.id, { tier: 2 });
  assert.equal(s.loot, 'gladius');
  assert.ok(run.inventory.gear.includes('gladius'));
});

test('after the Tier 4 Boss comes the Grand Tournament; winning it wins the career', () => {
  const { run, f } = atBout();
  run.prestige = 500;
  run.topTier = 4;
  run.arenas = { 4: run.arenas[1] };
  run.arenas[4].tier = 4;
  run.arenas[4].stage = 2;
  run.bouts = { 4: 'open' };
  playBout(run, f.id);
  assert.equal(run.topTier, GRAND_TIER);
  nextBout(run);
  assert.equal(currentBout(run).name, GRAND.name);
  assert.equal(run.arenas[GRAND_TIER].opponent.power, GRAND.oppPower);
  playBout(run, f.id, { tier: GRAND_TIER });
  assert.equal(run.status, 'won');
});

test('Prestige levels unlock as Prestige grows and add room plots', () => {
  const { run, f } = atBout();
  run.prestige = 9;
  const s = playBout(run, f.id);
  assert.equal(s.levelUp, 2);
  assert.deepEqual([run.prestigeLevel, plotsFree(run)], [2, 2]);
});

test('Blood Faith refunds the buy-in when the Orc dies, and the house mourns', () => {
  const run = createRun(1);
  const orc = recruit(run, run.market.find((x) => x.kind === 'orc').id);
  orc.kindTrait = 'bloodFaith'; // Orcs have several traits since playtest 3
  const other = recruit(run, run.market[0].id);
  orc.gear.armor = 'leatherVest';
  advanceToTournament(run);
  const morale = other.morale;
  const s = playBout(run, orc.id, { winner: 'B', reason: 'death', alive: false });
  assert.deepEqual([s.bloodFaith, run.prestige], [true, 5]);
  assert.equal(run.fallen[0].id, orc.id);
  assert.deepEqual(run.inventory.gear, ['leatherVest'], 'their gear returns to the storeroom');
  assert.equal(other.morale, morale + MORALE.allyDeath);
});

test('losing the last fighter with no Gold for another ends the career', () => {
  const { run, f } = atBout();
  run.gold = 0;
  playBout(run, f.id, { winner: 'B', reason: 'death', alive: false });
  assert.equal(run.status, 'lost');
});

// ---------- Save / load ----------

test('save and load round-trip the whole career', () => {
  const { run, f } = atBout();
  playBout(run, f.id);
  assert.equal(serialize(deserialize(serialize(run))), serialize(run));
});

test('reloading in the middle of a match counts as throwing in the towel', () => {
  const { run, f } = atBout();
  startMatch(run, f.id);
  const loaded = deserialize(serialize(run));
  assert.equal(loaded.inMatch, false);
  assert.equal(loaded.prestige, 5 - 1, 'buy-in stays lost');
  assert.equal(loaded.arenas[1].stage, 1);
  assert.equal(loaded.roster[0].alive, true);
});

test('a v2 save is upgraded: Strikes become Favor and the circuit becomes arenas', () => {
  const run = createRun(9);
  const f = recruit(run, run.market[0].id);
  const v2 = JSON.parse(serialize(run));
  Object.assign(v2, { version: 2, tier: 2, stage: 1, grand: false, debuff: 'rainyMud', opponent: v2.arenas[1].opponent, strikes: 1, matchFighterId: null });
  for (const k of ['arenas', 'topTier', 'favor', 'inventory', 'armourerStock', 'revoltWeeks', 'matchInfo', 'bouts']) delete v2[k];
  delete v2.rng.growth;
  for (const x of v2.roster) for (const k of ['xp', 'level', 'perks', 'pendingPerks', 'renown', 'morale', 'gear']) delete x[k];
  const loaded = deserialize(JSON.stringify(v2));
  assert.equal(loaded.version, SAVE_VERSION);
  assert.equal(loaded.favor, FAVOR.start - 15);
  assert.equal(loaded.topTier, 2);
  assert.deepEqual(Object.keys(loaded.arenas), ['1', '2']);
  assert.equal(loaded.arenas[2].stage, 1);
  assert.equal(loaded.arenas[1].conquered, true);
  assert.deepEqual(loaded.roster[0].gear, { weapon: null, armor: null });
  assert.equal(loaded.roster[0].id, f.id);
});

test('saves from version 1 are rejected', () => {
  assert.throws(() => deserialize(JSON.stringify({ version: 1 })), /older version/);
});

// ---------- Whole-career invariants ----------

test('simple-bot careers always end, and the state stays valid every week', () => {
  for (let seed = 0; seed < 30; seed++) {
    const run = createRun(seed);
    for (let step = 0; step < 3000 && run.status === 'active'; step++) {
      pickPerks(run);
      if (run.roster.length < rosterCap(run) && run.market.length && !recruitBlocker(run, run.market[0].id)) recruit(run, run.market[0].id);
      for (const f of run.roster) {
        const job = f.injuries.length ? 'medbay' : f.stress >= 40 ? 'rest' : 'trainPower';
        if (!jobBlocker(run, f.id, job)) setJob(run, f.id, job);
      }
      if (run.boutPending) {
        const f = run.roster.find((x) => !fightBlocker(run, x.id));
        if (f) {
          const m = startMatch(run, f.id);
          autoPlay(m);
          finishMatch(run, m);
        } else if (!skipBlocker(run)) skipBout(run);
        else forfeitBout(run);
      } else advanceWeek(run);
      assert.ok(run.gold >= 0 && run.prestige >= 0 && run.favor >= 0, `seed ${seed}: negative resources`);
      assert.ok(run.roster.length <= rosterCap(run), `seed ${seed}: roster over cap`);
      assert.ok(run.roster.every((f) => f.alive && f.stress >= 0 && f.stress <= 100 && f.morale >= 0 && f.morale <= 100));
    }
    assert.ok(['won', 'lost'].includes(run.status), `seed ${seed} never ended`);
  }
});

test('a returning rival is the arena\'s Boss Power +1, never compounding', () => {
  const { run, f } = atBout();
  run.prestige = 100;
  run.arenas[1].stage = 2;
  run.arenas[1].opponent.power = CIRCUITS[0].oppPower[2];
  for (let i = 0; i < 3; i++) {
    pickPerks(run);
    run.favor = 100; // three Boss losses in a row would (rightly) get you executed
    run.arenas[1].stage = 2;
    run.arenas[1].opponent = run.arenas[1].rival ?? run.arenas[1].opponent;
    run.bouts = { 1: 'open' };
    run.boutPending = true;
    run.history = [];
    playBout(run, f.id, { winner: 'B' });
    assert.equal(run.arenas[1].rival.power, CIRCUITS[0].oppPower[2] + 1, `loss ${i + 1}`);
  }
});

test('lower-arena Bosses drop gear only by chance; only the top Boss always drops', () => {
  const { run, a, b } = (() => {
    const r = createRun(3);
    r.gold = 200;
    r.prestige = 200;
    const x = recruit(r, r.market[0].id);
    const y = recruit(r, r.market[0].id);
    advanceToTournament(r);
    conquerTop(r, x.id);
    nextBout(r);
    return { run: r, a: x, b: y };
  })();
  let drops = 0;
  for (let i = 0; i < 40; i++) {
    pickPerks(run);
    a.morale = b.morale = 60; // 40 crushing wins in a row would (rightly) make them mutinous
    run.favor = 100; // and a champion re-fighting the pits 20 times would (rightly) get you executed
    run.arenas[1].stage = 2;
    run.arenas[1].opponent.gear.weapon = 'gladius';
    run.bouts = { 1: 'open', 2: 'open' };
    run.history = [];
    const s = playBout(run, (i % 2 ? a : b).id, { tier: 1 });
    pickPerks(run);
    if (s.loot) drops++;
  }
  assert.ok(drops > 0 && drops < 40, `lower Boss dropped ${drops}/40`);
});

// ---------- Playtest #1 fixes ----------

test('Scouted: consecutive top-arena months raise the opponent\'s Power against that fighter, up to the cap; a month off resets it', () => {
  const { run, f } = atBout();
  assert.equal(matchOptions(run, f, 1).scouted, 0);
  playBout(run, f.id);
  nextBout(run);
  assert.equal(matchOptions(run, f, 1).scouted, 1);
  const m = startMatch(run, f.id);
  assert.ok(computePower(m.b, m.a, 1).mods.some((x) => x.source === 'Scouted'));
  m.over = true;
  m.result = { winner: 'A', reason: 'rounds' };
  finishMatch(run, m);
  nextBout(run);
  assert.equal(matchOptions(run, f, 1).scouted, Math.min(2, ECONOMY.scoutedMax), 'capped');
  skipBlocker(run) ? forfeitBout(run) : skipBout(run);
  nextBout(run);
  assert.equal(matchOptions(run, f, 1).scouted, 0, 'sitting out a top-arena month resets it');
});

test('Boss losses cost Favor by tier, as in the table', () => {
  assert.deepEqual([1, 2, 3, 4, GRAND_TIER].map((t) => bossLossFavor(t)), [...FAVOR.bossLoss, FAVOR.bossLoss.at(-1)]);
  const { run, f } = atBout();
  run.arenas[1].stage = 2;
  playBout(run, f.id, { winner: 'B' });
  assert.equal(run.favor, FAVOR.start + FAVOR.bossLoss[0]);
});

test('crushing and upsets count gear Power', () => {
  const { run, f } = atBout();
  const opp = run.arenas[1].opponent;
  f.renown = ECONOMY.knownRenown; // rookies are never jeered; this checks the Power comparison
  f.power = opp.power + 2;
  f.gear.weapon = 'gladius'; // +1 Power: now 3 above the opponent
  run.arenas[1].conquered = true;
  run.topTier = 2;
  run.arenas[2] = { ...run.arenas[1], tier: 2, opponent: { ...opp, id: 'oX', name: 'Zed' } };
  run.bouts = { 1: 'open', 2: 'open' };
  const s = playBout(run, f.id, { tier: 1 });
  assert.equal(s.crushing, true);
});

test('an Armourer has stock as soon as it is built', () => {
  const run = createRun(1);
  run.gold = 100;
  run.prestigeLevel = 2;
  buildRoom(run, 'armourer');
  assert.equal(run.armourerStock.length, 3);
});

test('reloading mid-match keeps the injuries taken in the rounds already played (no erasing a bad round)', () => {
  const { run, f } = atBout();
  const m = startMatch(run, f.id);
  m.a.f.injuries = [{ tag: 'concussed', weight: 1 }];
  recordMatchProgress(run, m);
  const loaded = deserialize(serialize(run));
  assert.deepEqual(loaded.roster[0].injuries.map((i) => i.tag), ['concussed']);
  assert.equal(loaded.roster[0].injuries[0].weeksLeft, 2);
});

// ---------- Championships and rookies ----------

const lowerArenaSetup = () => {
  const run = createRun(3);
  run.gold = 300;
  run.prestige = 300;
  const a = recruit(run, run.market[0].id);
  const b = recruit(run, run.market[0].id);
  advanceToTournament(run);
  conquerTop(run, a.id); // a beats the Dirt Pits Boss: Champion of the Dirt Pits
  nextBout(run);
  return { run, a, b };
};
const refight = (run, f, tier, opts = {}) => {
  pickPerks(run);
  f.morale = 60;
  run.bouts = { ...run.bouts, [tier]: 'open' };
  run.history = run.history.filter((h) => h.fighterId !== f.id);
  return playBout(run, f.id, { tier, ...opts });
};

test('three wins in an arena make a fighter its Champion (+1 Power, once per arena)', () => {
  const { run, b } = lowerArenaSetup();
  run.arenas[1].stage = 0;
  const power = b.power;
  refight(run, b, 1);
  run.arenas[1].stage = 0;
  refight(run, b, 1);
  run.arenas[1].stage = 0;
  const s = refight(run, b, 1);
  assert.match(s.title, /Champion of the Dirt Pits/);
  assert.equal(b.power, power + 1);
  run.arenas[1].stage = 0;
  assert.equal(refight(run, b, 1).title, null, 'only one title per arena');
});

test('a Champion fighting back in a lower arena gets no Prestige or Renown and loses Morale and Favor', () => {
  const { run, a } = lowerArenaSetup();
  assert.ok(a.titles.some((t) => /Dirt Pits/.test(t)));
  const [favor, renown] = [run.favor, a.renown];
  const s = refight(run, a, 1);
  assert.equal(s.champion, true);
  assert.equal(s.prestige, 0);
  assert.equal(a.renown, renown);
  assert.equal(a.morale, 60 + MORALE.crowdJeers);
  assert.equal(run.favor, favor + FAVOR.championReturn);
});

test('a rookie (under 5 Renown, no title there) is never jeered, even in a mismatch', () => {
  const { run, b } = lowerArenaSetup();
  b.renown = 0;
  b.power = run.arenas[1].opponent.power + 6;
  const favor = run.favor;
  const s = refight(run, b, 1);
  assert.equal(s.crushing, false);
  assert.equal(run.favor, favor + (s.favor ?? 0));
  assert.ok(s.renown > 0);
});

test('a known fighter (5+ Renown) crushing a weak opponent is still jeered', () => {
  const { run, b } = lowerArenaSetup();
  b.renown = 6;
  b.power = run.arenas[1].opponent.power + 6;
  assert.equal(refight(run, b, 1).crushing, true);
});

// ---------- Training never fails silently (playtest #2) ----------

test('training is not selectable when it cannot happen: Discontented, overtrained, or not enough Gold', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.morale = 30;
  assert.match(jobBlocker(run, f.id, 'trainPower'), /Discontented \(Morale 30\)/);
  f.morale = 60;
  f.stress = 55;
  assert.match(jobBlocker(run, f.id, 'trainSpeed'), /Stress 55: must rest first/);
  f.stress = 0;
  run.gold = 0;
  assert.match(jobBlocker(run, f.id, 'trainPower'), /Needs 1 Gold/);
  run.gold = 5;
  assert.equal(jobBlocker(run, f.id, 'trainPower'), null);
});

test('the Gold check covers every trainee\'s fee', () => {
  const run = createRun(1);
  run.gold = 100;
  run.prestigeLevel = 2;
  const [a, b] = [recruit(run, run.market[0].id), recruit(run, run.market[0].id)];
  run.buildings.push({ id: 'bT2', type: 'trainer', level: 1 });
  setJob(run, a.id, 'trainPower');
  run.gold = 1;
  assert.match(jobBlocker(run, b.id, 'trainPower'), /Needs 2 Gold for 2 trainees/);
});

test('a training week that fails anyway (Gold spent since) counts as Rest, and the card says so', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  setJob(run, f.id, 'trainPower');
  f.stress = 30;
  run.gold = 0;
  const power = f.power;
  advanceWeek(run);
  assert.equal(f.power, power);
  assert.equal(f.stress, 0, 'a full Rest week: 30 - 40');
  assert.equal(f.job, 'rest');
  assert.match(f.notice, /Gold/);
});

test('choosing a new job clears the card notice', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.notice = 'Switched to Rest: something';
  setJob(run, f.id, 'trainPower');
  assert.equal(f.notice, null);
});

test('Birds and Fire Braziers calm a fighter: -5 Stress each per week; Trophy Racks do not', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.stress = 40;
  f.injuries = [{ tag: 'fleshWound', weight: 1, weeksLeft: 5 }];
  setJob(run, f.id, 'medbay'); // the Medbay week is -10 Stress, isolating the decor effect
  f.decor.bird = 1;
  f.decor.fireBrazier = 1;
  f.decor.trophy = 1;
  advanceWeek(run);
  assert.equal(f.stress, 40 - 10 - 10);
});

// ---------- Consumables (used between rounds, one per fight) ----------

const midMatch = () => {
  const { run, f } = atBout();
  run.gold = 100;
  const m = startMatch(run, f.id);
  playRound(m);
  return { run, f, m };
};

test('consumables are bought into the storeroom', () => {
  const run = createRun(1);
  run.gold = 50;
  buyItem(run, 'warPaint');
  assert.equal(run.inventory.items.warPaint, 1);
  assert.equal(run.gold, 50 - CONSUMABLES.warPaint.price);
  run.gold = 0;
  assert.match(buyItemBlocker(run, 'warPaint'), /Needs/);
});

test('War Paint gives +1 Power next round; only one item per fight, only between rounds', () => {
  const { run, m } = midMatch();
  if (m.over) return;
  run.inventory.items.warPaint = 2;
  useItem(run, m, 'warPaint');
  assert.equal(run.inventory.items.warPaint, 1);
  assert.ok(computePower(m.a, m.b, m.round + 1).mods.some((x) => x.source === 'War Paint' && x.value === 1));
  assert.equal(computePower(m.a, m.b, m.round + 2).mods.some((x) => x.source === 'War Paint'), false, 'one round only');
  assert.match(useItemBlocker(run, m, 'warPaint'), /one item per fight/);
});

test('items can be used before Round 1 (boosting Round 1), but not without one in the storeroom', () => {
  const { run, f } = atBout();
  const m = startMatch(run, f.id);
  assert.match(useItemBlocker(run, m, 'blessedBandage'), /No Blessed Bandage/);
  run.inventory.items.warPaint = 1;
  assert.equal(useItemBlocker(run, m, 'warPaint'), null);
  useItem(run, m, 'warPaint');
  assert.ok(computePower(m.a, m.b, 1).mods.some((x) => x.source === 'War Paint'));
  assert.equal(computePower(m.a, m.b, 2).mods.some((x) => x.source === 'War Paint'), false);
});

test('Adrenaline Draught: +3 Speed next round, +15 Stress after the fight', () => {
  const { run, f, m } = midMatch();
  if (m.over) return;
  run.inventory.items.adrenaline = 1;
  useItem(run, m, 'adrenaline');
  assert.ok(computeSpeed(m.a, m.round + 1).mods.some((x) => x.source === 'Adrenaline Draught' && x.value === 3));
  const stress = f.stress;
  autoPlay(m);
  finishMatch(run, m);
  if (f.alive) assert.equal(f.stress, Math.min(100, stress + STRESS.fight + 15));
});

test('Blessed Bandage: -10% chance to be injured next round (not armor, so Gun/Flail don\'t ignore it)', () => {
  const { run, m } = midMatch();
  if (m.over) return;
  run.inventory.items.blessedBandage = 1;
  useItem(run, m, 'blessedBandage');
  const self = computePhase2(m.a, m.b, m.round + 1).self.find((x) => x.source === 'Blessed Bandage');
  assert.deepEqual(self, { source: 'Blessed Bandage', value: -10000 });
});

test('Crowd Bribe: capitulating this fight costs no Favor and no Renown', () => {
  const { run, f, m } = midMatch();
  if (m.over) return;
  run.inventory.items.crowdBribe = 1;
  useItem(run, m, 'crowdBribe');
  const [favor, renown] = [run.favor, f.renown];
  throwTowel(m);
  const s = finishMatch(run, m);
  assert.equal(run.favor, favor);
  assert.equal(f.renown, renown);
  assert.equal(s.bribed, true);
});

// ---------- Difficulty curve (gentle start, tough finish) ----------

test('the Dirt Pits Boss fights without an arena rule; later Bosses keep theirs', () => {
  const run = createRun(1);
  run.arenas[1].stage = 2;
  assert.equal(boutFor(run, 1).debuff, null);
  run.topTier = 2;
  run.arenas[2] = { ...run.arenas[1], tier: 2, stage: 2, debuff: 'rainyMud' };
  assert.equal(boutFor(run, 2).debuff, 'rainyMud');
});

test('Challengers: late top-arena opponents gain +1 Power per ECONOMY.challengerRenown Renown of the fighter they face (capped)', () => {
  const { run, f } = atBout();
  // Move the career to the Silver Coliseum so Challengers apply.
  run.topTier = ECONOMY.challengerFromTier;
  run.arenas[run.topTier] = { ...run.arenas[1], tier: run.topTier, stage: 0 };
  run.bouts = { [run.topTier]: 'open' };
  run.prestige = 100;
  f.renown = ECONOMY.challengerRenown;
  assert.equal(matchOptions(run, f).challenger, 1);
  f.renown = ECONOMY.challengerRenown * 9;
  assert.equal(matchOptions(run, f).challenger, ECONOMY.challengerMax);
  const m = startMatch(run, f.id);
  assert.ok(computePower(m.b, m.a, 1).mods.some((x) => x.source === 'Challenger' && x.value === ECONOMY.challengerMax));
});

test('Challengers only appear in your top arena, and never in the first two tiers', () => {
  const early = createRun(1);
  const g = recruit(early, early.market[0].id);
  g.renown = 100;
  assert.equal(matchOptions(early, g, 1).challenger, 0);
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.renown = 100;
  run.topTier = 2;
  run.arenas[2] = { ...run.arenas[1], tier: 2 };
  assert.equal(matchOptions(run, f, 1).challenger, 0);
});

test('a busy Trainer Room says who is using it and what to do', () => {
  const run = createRun(1);
  const [a, b] = [recruit(run, run.market[0].id), recruit(run, run.market[0].id)];
  setJob(run, a.id, 'trainPower');
  assert.match(jobBlocker(run, b.id, 'trainPower'), new RegExp(`${a.name} is training`));
  assert.match(jobBlocker(run, b.id, 'trainPower'), /Rest|another Trainer Room/);
});

test('tribute can be paid early, and is then not collected again that winter', () => {
  const run = createRun(1);
  recruit(run, run.market[0].id);
  run.week = 10;
  run.gold = 3;
  assert.match(payTributeBlocker(run), /Needs 15 Gold/);
  run.gold = 40;
  payTribute(run);
  assert.equal(run.gold, 40 - TRIBUTE.perYear);
  assert.match(payTributeBlocker(run), /already paid/);
  run.week = 39;
  advanceWeek(run);
  assert.equal(run.gold, 40 - TRIBUTE.perYear);
  assert.equal(run.favor, FAVOR.start);
  // In winter the next tribute is next year's (and bigger).
  assert.equal(tributeDue(run), TRIBUTE.perYear * 2);
  assert.match(payTributeBlocker(run), /Needs 30 Gold/);
  run.gold = 30;
  assert.equal(payTributeBlocker(run), null);
});

// ---------- Playtest #3 ----------

test('a Bloodied Victory (winning with 2+ injuries) earns extra Favor, Renown, XP and Morale', () => {
  const clean = atBout(3);
  clean.f.morale = 50;
  const plain = playBout(clean.run, clean.f.id);
  const bloody = atBout(3);
  bloody.f.morale = 50;
  const wounds = [{ tag: 'fleshWound', weight: 1 }, { tag: 'concussed', weight: 1 }];
  const s = playBout(bloody.run, bloody.f.id, { injuries: wounds });
  assert.equal(s.bloodied, true);
  assert.equal(plain.bloodied, false);
  assert.equal(s.renown, plain.renown + BLOODIED.renown);
  assert.equal(s.xp, plain.xp + BLOODIED.xp);
  assert.equal(s.favor, plain.favor + FAVOR.spectacleWin);
  assert.equal(s.morale, plain.morale + BLOODIED.morale);
});

test('killing an opponent adds to the fighter\'s tally; 3 kills earn the Dreaded mark', () => {
  const { run, f } = atBout(5);
  f.kills = 2;
  const s = playBout(run, f.id, { reason: 'death' });
  assert.equal(f.kills, 3);
  assert.equal(s.kill, true);
  assert.equal(s.mark, 'Dreaded');
  nextBout(run);
  const s2 = playBout(run, f.id);
  assert.equal(f.kills, 3);
  assert.equal(s2.mark, null);
});

test('a War Banner in quarters adds Renown to every win', () => {
  const a = atBout(6);
  const plain = playBout(a.run, a.f.id);
  const b = atBout(6);
  b.f.decor.warBanner = 1;
  const s = playBout(b.run, b.f.id);
  assert.equal(s.renown, plain.renown + 1);
  assert.equal(DECOR.shrine.calm, 10);
});

test('spare gear sells back to the Armourer for half its price', () => {
  const run = createRun(1);
  run.inventory.gear = ['gladius', 'scaleMail'];
  run.gold = 0;
  assert.equal(sellGearBlocker(run, 5), 'No such item in the storeroom.');
  assert.equal(sellGear(run, 1), Math.floor(GEAR.scaleMail.price / 2));
  assert.deepEqual([run.inventory.gear, run.gold], [['gladius'], 8]);
});

test('old saves gain the new decor slots', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  delete run.inventory.decor.shrine;
  delete f.decor.warBanner;
  const back = deserialize(serialize(run));
  assert.equal(back.inventory.decor.shrine, 0);
  assert.equal(back.roster[0].decor.warBanner, 0);
});

// ---------- Prestige soft-lock (playtest 3 report) ----------

test('a house too poor for the buy-in can still fight in the Dirt Pits, paying what it has', () => {
  const { run, f } = atBout();
  run.prestige = 0;
  const bout = boutFor(run, 1);
  assert.equal(bout.buyIn, 0);
  assert.equal(bout.pauper, true);
  assert.equal(fightBlocker(run, f.id, 1), null);
  const s = playBout(run, f.id, { tier: 1 });
  assert.equal(s.prestige, bout.winPrestige, 'a win pays its Prestige in full');
  assert.equal(run.prestige, bout.winPrestige);
});

test('the pauper buy-in only covers what you can pay, and refunds exactly what was paid', () => {
  const { run, f } = atBout();
  run.prestige = 1;
  run.arenas[1].stage = 2; // the Dirt Pits Boss costs 2
  assert.equal(boutFor(run, 1).buyIn, 1);
  const s = playBout(run, f.id, { tier: 1, winner: 'B' });
  assert.deepEqual([s.prestige, run.prestige], [-1, 0]);
});

test('higher arenas still need the full buy-in, with the reason spelled out', () => {
  const { run, f } = atBout();
  run.arenas[1].stage = 0;
  run.prestige = 5;
  assert.equal(boutFor(run, 1).pauper, false);
  run.topTier = 2;
  run.arenas[2] = structuredClone(run.arenas[1]);
  run.arenas[2].tier = 2;
  run.bouts = { 1: 'open', 2: 'open' };
  run.prestige = 1;
  assert.equal(fightBlocker(run, f.id, 2), `Needs ${CIRCUITS[1].buyIn[0]} Prestige for the buy-in (you have 1).`);
});

test('every new fighter has a humor; fighters from older saves get a stable one', () => {
  const run = createRun(1);
  assert.ok(run.market.every((f) => ['choleric', 'sanguine', 'melancholic', 'phlegmatic'].includes(f.humor)));
  const f = recruit(run, run.market[0].id);
  delete f.humor;
  delete run.arenas[1].opponent.humor;
  const a = deserialize(serialize(run));
  const b = deserialize(serialize(run));
  assert.ok(a.roster[0].humor && a.arenas[1].opponent.humor);
  assert.equal(a.roster[0].humor, b.roster[0].humor);
});

test('the schedule lists the coming top-arena tournaments up to the Boss, with weeks to go and festivals', () => {
  const run = createRun(1);
  recruit(run, run.market[0].id);
  const s = upcomingBouts(run);
  assert.deepEqual(s.map((b) => [b.stage, b.weeks]), [['Tournament 1', 3], ['Tournament 2', 7], ['Boss Tournament', 11]]);
  assert.equal(s[2].festival, 'Floralia');
  assert.equal(s[2].boss, true);
  advanceToTournament(run);
  assert.equal(upcomingBouts(run)[0].weeks, 0, 'this week');
  skipBout(run);
  assert.deepEqual(upcomingBouts(run).map((b) => b.stage), ['Tournament 2', 'Boss Tournament']);
});
