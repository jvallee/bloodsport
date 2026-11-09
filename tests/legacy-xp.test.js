// Version 6, phase 3: Legacy XP, levels and unlocks, Heat, the Hall's returning legends, the daily streak
// (docs/plan-v6-phase3.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { FORTUNE, LEGACY, LEGACY_LEVELS, HEAT, CIRCUITS } from '../src/data.js';
import { RELICS, fortuneTitle, fortuneText } from '../src/fortune.js';
import {
  createRun, recruit, advanceWeek, advanceBlocker, skipBout, chooseFortune, rerollBlocker, rerollFortune, boutFor, hasDecree,
  fortuneCards, relicInPool, returningLegends, serialize, deserialize, retire,
} from '../src/run.js';
import {
  createLegacy, loadLegacy, careerXp, levelFor, levelCost, legacyUnlocks, nextUnlock, recordCareer, careerSetup, returningFor,
  dailyStreak, unlockedPatrons, houseColours, ALL_UNLOCKS, careerScore,
} from '../src/legacy.js';

const on = (fn) => () => {
  FORTUNE.enabled = true;
  try { fn(); } finally { FORTUNE.enabled = false; }
};
// The first Fortune deal, then a fresh deal each call after (a re-spin, paid for).
function toDraft(run) {
  if (run.fortune) {
    run.gold = 1e6;
    rerollFortune(run);
    return run.fortune;
  }
  while (!run.fortune) {
    if (run.boutPending) skipBout(run);
    advanceWeek(run);
  }
  return run.fortune;
}
const lost = (run) => Object.assign(run, { status: 'lost', endReason: 'Executed.' });

test('Legacy XP: every career earns some, and more for arenas, Bosses, kills, Titles, a win and the plot', () => {
  const x = LEGACY.xp;
  const first = lost(createRun(1));
  assert.equal(careerXp(first).total, x.career, 'a career that got nowhere still earns XP');
  const run = createRun(2);
  recruit(run, run.market[0].id);
  recruit(run, run.market[0].id);
  Object.assign(run, { topTier: 3, status: 'won', ending: 'coup' });
  run.history.push({ boss: true, won: true, tier: 1 }, { boss: true, won: true, tier: 2 }, { boss: true, won: true, tier: 2 }, { boss: true, won: false, tier: 3 }); // each arena's Boss counts once
  Object.assign(run.roster[0], { kills: 3, titles: ['The Unbroken'] });
  run.roster[1].titles = ['The Unbroken']; // the same Title twice counts once
  const xp = careerXp(run);
  assert.equal(xp.total, x.career + 2 * x.arena + 2 * x.boss + 3 * x.kill + x.title + x.won + x.coup);
  assert.ok(xp.lines.every((l) => l.label && l.xp > 0));
  run.roster[0].kills = 99;
  assert.equal(careerXp(run).total, x.career + 2 * x.arena + 2 * x.boss + x.maxKills * x.kill + x.title + x.won + x.coup, 'kills are capped');
});

test('Heat adds HEAT.xpPerHeat × the level to the XP', () => {
  const run = lost(createRun(3, { heat: 2 }));
  run.topTier = 2;
  const base = LEGACY.xp.career + LEGACY.xp.arena;
  assert.equal(careerXp(run).total, base + Math.round(base * HEAT.xpPerHeat * 2));
});

test('a returning legend\'s old kills and Titles earn nothing again', () => {
  const run = createRun(4);
  recruit(run, run.market[0].id);
  lost(run);
  Object.assign(run.roster[0], { kills: 5, titles: ['Old', 'New'], carried: { kills: 4, titles: 1 } });
  assert.equal(careerXp(run).total, LEGACY.xp.career + LEGACY.xp.kill + LEGACY.xp.title);
});

test('levels: level 2 at LEGACY.first XP, each level after costing LEGACY.step more', () => {
  assert.deepEqual(levelFor(0), { level: 1, into: 0, need: LEGACY.first });
  assert.equal(levelFor(LEGACY.first - 1).level, 1);
  assert.equal(levelFor(LEGACY.first).level, 2);
  assert.equal(levelCost(2), LEGACY.first + LEGACY.step);
  assert.deepEqual(levelFor(LEGACY.first + levelCost(2) + 5), { level: 3, into: 5, need: levelCost(3) });
  const legacy = { xp: LEGACY.first + levelCost(2) };
  assert.deepEqual(legacyUnlocks(legacy), LEGACY_LEVELS.slice(0, 2).map((u) => u.id));
  assert.equal(nextUnlock(legacy).id, LEGACY_LEVELS[2].id);
  assert.equal(nextUnlock(legacy).level, 4);
  assert.equal(nextUnlock({ xp: 1e6 }), null, 'past the tree, nothing is next');
});

test('a recorded career adds its XP and lists the levels and unlocks it reached', () => {
  const legacy = createLegacy();
  legacy.xp = LEGACY.first - 1;
  const run = lost(createRun(5));
  const entry = recordCareer(legacy, run);
  assert.equal(entry.xp, LEGACY.xp.career);
  assert.equal(legacy.xp, LEGACY.first - 1 + LEGACY.xp.career);
  assert.equal(entry.xpBefore, LEGACY.first - 1);
  assert.deepEqual([entry.from, entry.to], [1, 2]);
  assert.deepEqual(entry.unlocked, [LEGACY_LEVELS[0].id]);
  assert.equal(recordCareer(legacy, run), null, 'once');
});

test('Heat: winning at Heat N unlocks N+1 (up to the last); a loss or the daily challenge unlocks nothing', () => {
  const legacy = createLegacy();
  recordCareer(legacy, lost(createRun(6)));
  assert.equal(legacy.maxHeat, 0);
  const won = (seed, setup) => Object.assign(createRun(seed, setup), { status: 'won', endReason: 'Won.' });
  assert.equal(recordCareer(legacy, won(7)).newHeat, 1);
  assert.equal(legacy.maxHeat, 1);
  recordCareer(legacy, won(8, { daily: '2026-11-09', short: true }));
  assert.equal(legacy.maxHeat, 1, 'the daily challenge never climbs Heat');
  recordCareer(legacy, won(9, { heat: 1 }));
  assert.equal(legacy.maxHeat, 2);
  recordCareer(legacy, won(10));
  assert.equal(legacy.maxHeat, 2, 'winning below your Heat keeps it');
  recordCareer(legacy, won(11, { heat: HEAT.decrees.length }));
  assert.equal(legacy.maxHeat, HEAT.decrees.length, 'capped at the last Heat');
});

test('Heat N plays the first N decrees and adds their score', () => {
  const run = createRun(12, { heat: 3 });
  assert.deepEqual(run.setup.decrees, HEAT.decrees.slice(0, 3));
  assert.ok(hasDecree(run, 'ironBosses') && !hasDecree(run, 'leanFortune'));
  const won = (r) => Object.assign(r, { status: 'won' });
  assert.equal(careerScore(won(createRun(12, { heat: 3 }))) - careerScore(won(createRun(12))), 20 + 20 + 30);
});

test('Hungry Lions (Heat 5): every opponent fights with +1 Power, Bosses with +2 (Iron Bosses too)', () => {
  const cold = createRun(13);
  const hot = createRun(13, { heat: 5 });
  assert.equal(boutFor(hot, 1).oppPower, boutFor(cold, 1).oppPower + 1);
  assert.equal(boutFor(hot, 1).oppPower, CIRCUITS[0].oppPower[0] + 1);
});

test('the first career never draws a locked relic; its unlock adds it to the pool', on(() => {
  const locked = Object.keys(RELICS).filter((r) => RELICS[r].locked);
  assert.deepEqual(locked.sort(), ['dice', 'eagle', 'laurel', 'proserpina', 'scrolls']);
  const first = createRun(14);
  assert.ok(locked.every((r) => !relicInPool(first, r)));
  const full = createRun(14, { unlocks: ALL_UNLOCKS });
  assert.ok(locked.every((r) => relicInPool(full, r)));
  // Many deals: a first career draws none of them.
  recruit(first, first.market[0].id);
  const seen = new Set();
  for (let m = 0; m < 30; m++) for (const c of toDraft(first)?.cards ?? []) if (c.kind === 'relic') seen.add(c.id);
  assert.ok(seen.size > 3, 'relics were dealt');
  assert.ok(locked.every((r) => !seen.has(r)));
}));

test('A Generous Wheel deals four cards; Lean Fortunes one fewer', on(() => {
  assert.equal(fortuneCards(createRun(15)), FORTUNE.cards);
  assert.equal(fortuneCards(createRun(15, { unlocks: ['fourCards'] })), FORTUNE.cards + 1);
  assert.equal(fortuneCards(createRun(15, { heat: 4 })), FORTUNE.cards - 1);
  const run = createRun(15, { unlocks: ['fourCards'] });
  recruit(run, run.market[0].id);
  assert.equal(toDraft(run).cards.length, FORTUNE.cards + 1);
}));

test('A Seer in the House: every career starts with an Oracle', () => {
  assert.ok(!createRun(16).buildings.some((b) => b.type === 'oracle'));
  assert.ok(createRun(16, { unlocks: ['oracle'] }).buildings.some((b) => b.type === 'oracle' && b.level === 1));
});

test('the Augur: the career opens with a pick of three rare relics, chosen before the first week', () => {
  const run = createRun(17, { patron: 'augur' });
  assert.equal(run.fortune.cards.length, FORTUNE.cards);
  assert.ok(run.fortune.cards.every((c) => c.kind === 'relic' && RELICS[c.id].rarity !== 'common' && !RELICS[c.id].locked));
  assert.equal(new Set(run.fortune.cards.map((c) => c.id)).size, FORTUNE.cards);
  assert.match(advanceBlocker(run), /Fortune/);
  run.gold = 99;
  assert.match(rerollBlocker(run), /Augur/);
  const id = run.fortune.cards[1].id;
  chooseFortune(run, 1);
  assert.deepEqual(run.relics, [id]);
  assert.equal(advanceBlocker(run), null);
  assert.ok(!unlockedPatrons(createLegacy()).includes('augur'));
  assert.ok(unlockedPatrons({ ...createLegacy(), xp: 1e6 }).includes('augur'), 'a Legacy level unlocks the Augur');
});

const legend = { name: 'Old Brutus', kind: 'human', cls: 'fighter', id: 'f3', seed: 999, kills: 4, titles: ['The Unbroken'], renown: 9, level: 4, wins: 11 };

test('the Hall remembers: a retired legend can be dealt as a Fortune card, once, and joins with their name', on(() => {
  assert.deepEqual(returningLegends(createRun(18, { legends: [legend] })), [], 'not without the unlock');
  const run = createRun(18, { unlocks: ['legends'], legends: [legend] });
  recruit(run, run.market[0].id);
  let card = null;
  for (let m = 0; m < 60 && !card; m++) card = toDraft(run)?.cards.find((c) => c.kind === 'legend');
  assert.ok(card, 'a legend was dealt');
  assert.equal(card.rarity, 'legendary');
  assert.equal(fortuneTitle(card), 'Old Brutus');
  assert.match(fortuneText(card), /one last season/);
  chooseFortune(run, run.fortune.cards.indexOf(card));
  const f = run.roster.find((x) => x.name === 'Old Brutus');
  assert.ok(f && f.returned === 'legend:999:f3' && f.legend);
  assert.deepEqual(f.titles, ['The Unbroken']);
  assert.deepEqual(returningLegends(run), [], 'never dealt twice in a career');
  // The career ends: the Legacy remembers they came back, so no later career deals them.
  const legacy = { ...createLegacy(), hall: [legend] };
  assert.equal(returningFor(legacy).length, 1);
  recordCareer(legacy, lost(run));
  assert.deepEqual(legacy.returned, ['legend:999:f3']);
  assert.deepEqual(returningFor(legacy), []);
}));

test('a returned legend who retires again is not dealt again in that career', () => {
  const run = createRun(19, { unlocks: ['legends'], legends: [legend] });
  recruit(run, run.market[0].id);
  Object.assign(run.roster[0], { returned: 'legend:999:f3', level: 5 });
  run.roster[0].job = 'rest';
  retire(run, run.roster[0].id);
  assert.deepEqual(returningLegends(run), []);
});

test('careerSetup: the Legacy\'s unlocks and legends, Heat capped at what was unlocked, only unlocked colours', () => {
  const legacy = { ...createLegacy(), xp: LEGACY.first, maxHeat: 1, hall: [legend] };
  const setup = careerSetup(legacy, { heat: 4, colour: 'gold', patron: 'purse', short: false });
  assert.deepEqual(setup.unlocks, [LEGACY_LEVELS[0].id]);
  assert.equal(setup.heat, 1);
  assert.equal(setup.colour, null, 'gold is not unlocked yet');
  assert.equal(setup.legends.length, 1);
  assert.equal(setup.patron, 'purse');
  assert.equal(setup.short, false);
  assert.deepEqual(houseColours({ xp: 1e6 }), ['crimson', 'purple', 'verdigris', 'gold']);
  const run = createRun(20, careerSetup({ ...createLegacy(), xp: 1e6, maxHeat: 2 }, { heat: 2, colour: 'purple' }));
  assert.equal(run.setup.colour, 'purple');
  assert.deepEqual(run.setup.decrees, HEAT.decrees.slice(0, 2));
  assert.deepEqual(deserialize(serialize(run)).setup, run.setup);
});

test('a career saved before Heat and unlocks loads as a first career', () => {
  const run = createRun(21);
  const data = JSON.parse(serialize(run));
  for (const k of ['heat', 'unlocks', 'legends', 'colour']) delete data.setup[k];
  const back = deserialize(JSON.stringify(data));
  assert.equal(back.setup.heat, 0);
  assert.deepEqual(back.setup.unlocks, []);
});

test('an old Legacy gets XP for its past careers once, and a past win unlocks Heat 1', () => {
  const x = LEGACY.xp;
  const old = { achievements: ['champion'], careers: 12, best: 300, past: [{ topTier: 3, won: true }, { topTier: 1, won: false }], hall: [] };
  const legacy = loadLegacy(JSON.stringify(old));
  assert.equal(legacy.xp, (x.career + 2 * x.arena + x.won) + x.career + 10 * x.career);
  assert.equal(legacy.maxHeat, 1);
  assert.equal(loadLegacy(JSON.stringify(legacy)).xp, legacy.xp, 'once');
});

test('the daily streak counts days in a row, and survives until today is played', () => {
  const legacy = { daily: { '2026-11-07': 10, '2026-11-08': 20, '2026-11-05': 5 } };
  assert.equal(dailyStreak(legacy, '2026-11-08'), 2);
  assert.equal(dailyStreak(legacy, '2026-11-09'), 2, 'not broken until today ends');
  assert.equal(dailyStreak(legacy, '2026-11-10'), 0);
  assert.equal(dailyStreak({ daily: { '2026-12-31': 1, '2027-01-01': 1 } }, '2027-01-01'), 2, 'across a year');
  assert.equal(dailyStreak({}, '2026-11-09'), 0);
});

test('every unlock has a name and words; ids are unique', () => {
  assert.equal(new Set(LEGACY_LEVELS.map((u) => u.id)).size, LEGACY_LEVELS.length);
  for (const u of LEGACY_LEVELS) assert.ok(u.name && u.desc, u.id);
  for (const u of LEGACY_LEVELS.filter((l) => l.id.startsWith('relic:'))) assert.ok(RELICS[u.id.slice(6)]?.locked, u.id);
});
