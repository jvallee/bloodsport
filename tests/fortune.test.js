// Version 6, phase 2: the monthly Fortune draft and the house's relics (src/fortune.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { FORTUNE, STRESS, FAVOR, GEAR } from '../src/data.js';
import { RELICS, BOONS, relicFight, tagCount, fortuneTitle, fortuneText } from '../src/fortune.js';
import { createMatch, computePower, computeSpeed, computePhase2 } from '../src/fight.js';
import {
  effectivePower,
  createRun, recruit, advanceWeek, advanceToTournament, advanceBlocker, chooseFortune, fortuneBlocker, rerollFortune, rerollBlocker, rerollPrice,
  passFortune, startMatch, finishMatch, skipBout, setJob, recruitPrice, serialize, deserialize, trainStress,
} from '../src/run.js';
import { blank } from './helpers.js';

// Every test here turns the draft on (tests/setup.js switches it off for the rest of the suite).
const on = (fn) => () => {
  FORTUNE.enabled = true;
  try { fn(); } finally { FORTUNE.enabled = false; }
};

// A house with one fighter, at the first month the draft is dealt.
function atDraft(seed = 1) {
  const run = createRun(seed);
  recruit(run, run.market[0].id);
  while (!run.fortune) {
    if (run.boutPending) skipBout(run);
    advanceWeek(run);
  }
  return run;
}

test('the draft: three cards at the start of each month from FORTUNE.fromWeek, and the month waits for a choice', on(() => {
  const run = atDraft();
  assert.equal(run.week, FORTUNE.fromWeek);
  assert.equal(run.fortune.cards.length, FORTUNE.cards);
  assert.match(advanceBlocker(run), /Fortune/);
  chooseFortune(run, 0);
  assert.equal(run.fortune, null);
  assert.equal(advanceBlocker(run), null);
}));

test('no Fortune before FORTUNE.fromWeek, and none at all when switched off', on(() => {
  const run = createRun(2);
  recruit(run, run.market[0].id);
  const step = () => { if (run.boutPending) skipBout(run); advanceWeek(run); };
  for (let w = 0; w < FORTUNE.fromWeek - 1; w++) step();
  assert.equal(run.fortune, null);
  FORTUNE.enabled = false;
  step();
  assert.equal(run.week, FORTUNE.fromWeek);
  assert.equal(run.fortune, null);
}));

test('the same seed deals the same cards; never more than two of a kind', on(() => {
  const kinds = (r) => r.fortune.cards.map((c) => `${c.kind}:${c.id}`);
  assert.deepEqual(kinds(atDraft(7)), kinds(atDraft(7)));
  for (let seed = 1; seed <= 40; seed++) {
    const run = atDraft(seed);
    for (let i = 0; i < 3; i++) {
      const count = {};
      for (const c of run.fortune.cards) count[c.kind] = (count[c.kind] ?? 0) + 1;
      assert.ok(Math.max(...Object.values(count)) <= 2, `seed ${seed}: ${kinds(run)}`);
      const ids = run.fortune.cards.map((c) => c.id);
      assert.equal(new Set(ids).size, ids.length, 'no card twice');
      run.gold = 100;
      rerollFortune(run);
    }
  }
}));

test('every card has a title and a description', on(() => {
  for (let seed = 1; seed <= 30; seed++) {
    for (const c of atDraft(seed).fortune.cards) {
      assert.ok(fortuneTitle(c), `${c.kind} ${c.id}`);
      assert.ok(fortuneText(c).length > 5, `${c.kind} ${c.id}`);
    }
  }
}));

test('a reroll costs FORTUNE.reroll Gold, rising each time; passing pays FORTUNE.pass', on(() => {
  const run = atDraft(3);
  run.gold = 30;
  for (const price of [...FORTUNE.reroll, FORTUNE.reroll.at(-1)]) {
    assert.equal(rerollPrice(run), price);
    rerollFortune(run);
  }
  assert.equal(run.gold, 30 - FORTUNE.reroll.reduce((a, b) => a + b) - FORTUNE.reroll.at(-1));
  run.gold = 0;
  assert.match(rerollBlocker(run), /Gold/);
  passFortune(run);
  assert.equal(run.gold, FORTUNE.pass);
  assert.equal(run.fortune, null);
}));

// Changed on purpose in phase 5 (playtest LLM-13): a full house of relics was dealt none, which flattened the draft for
// the rest of a career. Relic cards now keep coming, and taking one lays down a relic the player names.
test('a relic card adds the relic; at the relic limit, relic cards still come and taking one lays another down', on(() => {
  const run = atDraft(4);
  run.fortune.cards[0] = { kind: 'relic', id: 'aegis', rarity: 'common' };
  chooseFortune(run, 0);
  assert.deepEqual(run.relics, ['aegis']);
  run.relics = Object.keys(RELICS).filter((r) => r !== 'eagle').slice(0, FORTUNE.maxRelics);
  run.fortune = { cards: [{ kind: 'relic', id: 'eagle', rarity: 'legendary' }], rerolls: 0 };
  assert.match(fortuneBlocker(run, 0), /lay down/);
  assert.match(fortuneBlocker(run, 0, 'nonsense'), /lay down/);
  const dropped = run.relics[2];
  assert.equal(fortuneBlocker(run, 0, dropped), null);
  chooseFortune(run, 0, dropped);
  assert.equal(run.relics.length, FORTUNE.maxRelics);
  assert.ok(run.relics.includes('eagle') && !run.relics.includes(dropped));
  run.gold = 500;
  let dealt = 0;
  for (let i = 0; i < 30; i++) {
    run.fortune = { cards: [], rerolls: 0 };
    rerollFortune(run);
    dealt += run.fortune.cards.filter((c) => c.kind === 'relic').length;
  }
  assert.ok(dealt > 0, 'relic cards are still dealt at the limit');
}));

test('gear, fighter and boon cards', on(() => {
  const run = atDraft(5);
  run.fortune.cards = [{ kind: 'gear', id: 'gladius', rarity: 'common' }];
  chooseFortune(run, 0);
  assert.ok(run.inventory.gear.includes('gladius'));
  const f = run.roster[0];
  const power = f.power;
  run.fortune = { cards: [{ kind: 'boon', id: 'blessing', rarity: 'legendary', fighterId: f.id, name: f.name }], rerolls: 0 };
  chooseFortune(run, 0);
  assert.equal(f.power, power + BOONS.blessing.power, 'the gods smile on the fighter the card names');
  f.injuries = [{ tag: 'concussed', weight: 1, weeksLeft: 2 }, { tag: 'maimed', weight: 1, weeksLeft: 3 }];
  run.fortune = { cards: [{ kind: 'boon', id: 'surgeon', rarity: 'rare' }], rerolls: 0 };
  chooseFortune(run, 0);
  assert.deepEqual(f.injuries.map((i) => [i.tag, i.weeksLeft]), [['maimed', 1]]);
  const g = blank({ id: 'fz', name: 'Lucky', perks: [], pendingPerks: [], level: 1, xp: 0, titles: [], decor: {}, gear: {}, morale: 60, stress: 0, renown: 0 });
  run.fortune = { cards: [{ kind: 'fighter', id: g.id, rarity: 'common', fighter: g }], rerolls: 0 };
  const before = run.roster.length;
  chooseFortune(run, 0);
  assert.equal(run.roster.length, before + 1);
  run.roster.push(...Array.from({ length: 10 }, (_, i) => ({ ...structuredClone(g), id: `fy${i}` })));
  run.fortune = { cards: [{ kind: 'fighter', id: 'fq', rarity: 'common', fighter: { ...g, id: 'fq' } }], rerolls: 0 };
  assert.match(fortuneBlocker(run, 0), /quarters are full/);
}));

// ---------- Relics in the fight ----------

const fight = (relics, a = blank(), b = blank({ id: 'y' }), opts = {}) => {
  const run = { relics };
  return createMatch({ a, b, rng: null, relics: relicFight(run, a, opts) });
};
const powerFrom = (c, opp, round, source) => computePower(c, opp, round).mods.find((m) => m.source === source)?.value ?? 0;

test("Mars's Whetstone: +1 Power in Round 1 only; the Nets of Nemi: the opponent at −2 Speed", () => {
  const m = fight(['whetstone', 'nets']);
  assert.equal(powerFrom(m.a, m.b, 1, RELICS.whetstone.name), 1);
  assert.equal(powerFrom(m.a, m.b, 2, RELICS.whetstone.name), 0);
  assert.equal(computeSpeed(m.b, 2).mods.find((x) => x.source === RELICS.nets.name).value, -2);
  assert.ok(!computeSpeed(m.a, 2).mods.some((x) => x.source === RELICS.nets.name));
});

test('the Bronze Aegis guards; the Lucky Knucklebone helps in Round 3; the Wolf\'s Pelt only while hurt', () => {
  const m = fight(['aegis', 'knucklebone', 'wolfPelt']);
  assert.equal(computePhase2(m.a, m.b, 1).self.find((x) => x.source === RELICS.aegis.name).value, -5000);
  assert.ok(!computePhase2(m.a, m.b, 1).win.some((x) => x.source === RELICS.knucklebone.name));
  assert.equal(computePhase2(m.a, m.b, 3).win.find((x) => x.source === RELICS.knucklebone.name).value, 5000);
  assert.equal(powerFrom(m.a, m.b, 1, RELICS.wolfPelt.name), 0);
  m.a.f.injuries = [{ tag: 'fleshWound', weight: 1 }];
  assert.equal(powerFrom(m.a, m.b, 1, RELICS.wolfPelt.name), 1);
});

test('the Eagle Standard only in Boss fights; the Gilded Laurel only for a fighter with a Title', () => {
  assert.equal(powerFrom(fight(['eagle']).a, blank(), 1, RELICS.eagle.name), 0);
  const boss = fight(['eagle'], blank(), blank({ id: 'y' }), { boss: true });
  assert.equal(powerFrom(boss.a, boss.b, 1, RELICS.eagle.name), 1);
  assert.equal(powerFrom(fight(['laurel']).a, blank(), 2, RELICS.laurel.name), 0);
  const champ = fight(['laurel'], blank({ titles: ['Champion of the Dirt Pits'] }));
  assert.equal(powerFrom(champ.a, champ.b, 2, RELICS.laurel.name), 1);
});

test('perk tags: tag relics count the fighter\'s tagged perks, a repeat twice, up to FORTUNE.tagCap', () => {
  assert.equal(tagCount({ perks: ['mighty', 'mighty', 'killer', 'juggernaut', 'bloodthirsty'] }, 'brute'), FORTUNE.tagCap);
  assert.equal(tagCount({ perks: ['swift', 'duelist'] }, 'swift'), 2);
  const m = fight(['chain', 'sandals', 'shell'], blank({ perks: ['killer', 'swift', 'thickSkin', 'juggernaut'] }));
  assert.equal(computePhase2(m.a, m.b, 1).enemy.find((x) => x.source === RELICS.chain.name).value, 6000);
  assert.equal(computeSpeed(m.a, 1).mods.find((x) => x.source === RELICS.sandals.name).value, 1);
  assert.equal(computePhase2(m.a, m.b, 1).self.find((x) => x.source === RELICS.shell.name).value, -8000);
  assert.equal(relicFight({ relics: ['chain'] }, blank({ perks: [] })), null, 'no tagged perks, no bonus');
});

// ---------- Relics in the house ----------

test("the Drillmaster's Rod: training adds 5 less Stress; the Ledger: fighters 2 Gold cheaper; the Purse: Gold each month", () => {
  const run = createRun(6);
  const f = recruit(run, run.market[0].id);
  const price = recruitPrice(run, run.market[0]);
  run.relics = ['rod', 'ledger', 'purse'];
  assert.equal(trainStress(run, f), STRESS.train - 5);
  assert.equal(recruitPrice(run, run.market[0]), price - 2);
  const plain = createRun(6);
  const g = recruit(plain, plain.market[0].id);
  for (const [r, x] of [[run, f], [plain, g]]) {
    setJob(r, x.id, 'trainPower');
    advanceWeek(r);
  }
  assert.equal(f.stress, g.stress - 5);
  while (run.week % 4) { if (run.boutPending) skipBout(run); advanceWeek(run); }
  assert.ok(run.log.some((l) => l.text.startsWith(`${RELICS.purse.name}: +${RELICS.purse.monthGold} Gold`)));
});

const atFight = (seed = 1) => {
  const run = createRun(seed);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  return { run, f };
};
const ended = (run, f, { winner = 'A', reason = 'rounds', alive = true, injuries = [] } = {}) => {
  const m = startMatch(run, f.id);
  Object.assign(m, { over: true, result: { winner, reason } });
  Object.assign(m.a.f, { alive, injuries });
  return finishMatch(run, m);
};

test("Proserpina's Coin: a fighter who dies is carried out alive, once; then the coin is spent", () => {
  const { run, f } = atFight(1);
  run.relics = ['proserpina'];
  const s = ended(run, f, { winner: 'B', reason: 'death', alive: false, injuries: [{ tag: 'maimed', weight: 1 }, { tag: 'concussed', weight: 1 }] });
  assert.equal(s.died, false);
  assert.equal(s.saved, true);
  assert.ok(run.roster.includes(f));
  assert.deepEqual(run.relics, []);
});

test('A Bribed Referee: capitulating costs no Favour or Renown', () => {
  const { run, f } = atFight(2);
  run.relics = ['referee'];
  const [favor, renown] = [run.favor, f.renown];
  const s = ended(run, f, { winner: 'B', reason: 'towel' });
  assert.equal(s.bribed, true);
  assert.equal(run.favor, favor);
  assert.equal(f.renown, renown);
});

test('the Trophy Wall, the Scrolls and the Butcher\'s Hook add to a win', () => {
  const plain = atFight(3);
  const base = ended(plain.run, plain.f, { reason: 'death' });
  const { run, f } = atFight(3);
  run.relics = ['trophyWall', 'scrolls', 'hook'];
  const s = ended(run, f, { reason: 'death' });
  assert.equal(s.prestige, base.prestige + 1);
  assert.equal(s.xp, base.xp + 1);
  assert.equal(s.renown, base.renown + 2);
});

test("the Fates' Wager: a won top bout pays; a skipped one costs Gold at the week's end", on(() => {
  const { run, f } = atFight(4);
  run.wager = { winGold: 5, winRenown: 2, lossGold: 3 };
  const s = ended(run, f);
  assert.deepEqual(s.wager, { won: true, gold: 5, renown: 2 });
  assert.equal(run.wager, undefined);
  const b = atFight(5);
  b.run.wager = { winGold: 5, winRenown: 2, lossGold: 3 };
  b.run.gold = 10;
  skipBout(b.run);
  b.run.fortune = null;
  advanceWeek(b.run);
  assert.equal(b.run.wager, undefined);
  assert.ok(b.run.log.some((l) => /The Fates collect: −3 Gold/.test(l.text)));
}));

test('relics and the dealt cards survive a save and load', on(() => {
  const run = atDraft(8);
  run.relics = ['aegis', 'hook'];
  const back = deserialize(serialize(run));
  assert.deepEqual(back.relics, ['aegis', 'hook']);
  assert.deepEqual(back.fortune, run.fortune);
  const old = JSON.parse(serialize(run));
  delete old.relics; delete old.fortune; delete old.rng.fortune;
  const migrated = deserialize(JSON.stringify(old));
  assert.deepEqual(migrated.relics, []);
  assert.equal(migrated.fortune, null);
}));

test('every relic and boon is described, with a known rarity', () => {
  for (const [id, r] of [...Object.entries(RELICS), ...Object.entries(BOONS)]) {
    assert.ok(['common', 'rare', 'legendary'].includes(r.rarity), id);
    assert.ok(r.name, id);
  }
  for (const r of Object.values(RELICS)) assert.ok(r.desc.endsWith('.'), r.name);
  assert.ok(Object.keys(RELICS).length >= 15 && Object.keys(RELICS).length <= 25);
  assert.ok(Object.values(GEAR).some((g) => g.tier === 3));
  assert.ok(FAVOR.max > 0);
});

test('a drafted fighter keeps up with the house: at least FORTUNE.fighterBehind below the second-best, plus rarity (LLM-13)', on(() => {
  const run = atDraft(6);
  for (const [i, f] of run.roster.entries()) f.power = 30 - i * 2;
  run.gold = 999;
  let seen = 0;
  for (let i = 0; i < 40 && seen < 5; i++) {
    run.fortune = { cards: [], rerolls: 0 };
    rerollFortune(run);
    for (const c of run.fortune.cards.filter((x) => x.kind === 'fighter')) {
      seen++;
      const second = run.roster.map(effectivePower).sort((a, b) => b - a)[1] ?? run.roster.map(effectivePower)[0];
      assert.ok(effectivePower(c.fighter) >= second - FORTUNE.fighterBehind + FORTUNE.fighterPower[c.rarity]);
      // The catch-up is training done elsewhere: it counts toward the Trainer cap (playtest LLM-14).
      assert.ok(c.fighter.trainedPower > 0 && c.fighter.trained > 0, 'the catch-up counts as training');
    }
  }
  assert.ok(seen > 0, 'fighter cards were dealt');
}));

test('the cards deal in with an animation only when asked (a redraw of the same hand stays still: the designer saw it replay on every dialogue click)', async () => {
  const { fortunePanel, fortuneDealKey } = await import('../src/ui/views.js');
  on(() => {
  const run = atDraft();
  assert.match(fortunePanel(run), /fortune-cards fresh/);
  assert.doesNotMatch(fortunePanel(run, { animate: false }), /fortune-cards fresh/);
  const key = fortuneDealKey(run);
  assert.equal(fortuneDealKey(run), key, 'the same hand keeps its key');
  rerollFortune(run);
  assert.notEqual(fortuneDealKey(run), key, 'a spin deals a new hand');
  })();
});
