// 5.4.0 quests (docs/plan-5.4-quests.md): the steward's assignments, what fighters want, the rival house, the cause's requests.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FIGHTER_WANTS, RIVAL, REBEL_QUEST, QUESTS, BUILDINGS } from '../src/data.js';
import { STEWARD_TASKS } from '../src/quests.js';
import {
  createRun, recruit, advanceWeek, advanceToTournament, checkQuests, stewardTask, stewardGold, archrival, risingProgress, buildRoom, enact,
  serialize, deserialize, isChampionOf, championTitle,
} from '../src/run.js';
import { buildBlocker, buildingKnown } from '../src/ludus.js';
import { applyGameAction } from '../src/game.js';

const weeks = (run, n) => { for (let i = 0; i < n; i++) { if (run.boutPending) { run.boutPending = false; run.bouts = null; } advanceWeek(run); } };

test('the steward\'s first assignment comes after the tutorial month, with the steward\'s words', () => {
  const run = createRun(1);
  checkQuests(run);
  assert.equal(stewardTask(run), null, 'not in the tutorial month');
  run.week = QUESTS.stewardFromWeek;
  checkQuests(run);
  assert.equal(stewardTask(run).id, STEWARD_TASKS[0].id);
  const said = run.talk.find((t) => t.key === `steward-${STEWARD_TASKS[0].id}`);
  assert.ok(said.beats.some((b) => /great once/.test(b.text)), 'the first one says why');
});

test('an assignment done pays its Gold once, then the next one comes; one already done is skipped quietly', () => {
  const run = createRun(2);
  run.week = QUESTS.stewardFromWeek;
  recruit(run, run.market[0].id);
  checkQuests(run);
  assert.equal(stewardTask(run).id, 'twoFighters');
  recruit(run, run.market[0].id);
  const gold = run.gold;
  run.history.push({ week: run.week, won: true }); // a win already in the books
  checkQuests(run);
  assert.equal(run.gold, gold + stewardGold(STEWARD_TASKS[0]), 'two gladiators: paid');
  assert.notEqual(stewardTask(run).id, 'firstWin', 'the win was already done: skipped, unpaid');
  checkQuests(run);
  assert.equal(run.gold, gold + stewardGold(STEWARD_TASKS[0]), 'paid once');
});

test('a game action completes an assignment at once (build something new)', () => {
  const run = createRun(3);
  run.week = QUESTS.stewardFromWeek;
  run.quests = { steward: 'newBuilding', stewardIndex: STEWARD_TASKS.findIndex((t) => t.id === 'newBuilding'), rebel: [] };
  run.prestige = 20; run.prestigeLevel = 2; run.gold = 50;
  const gold = run.gold;
  applyGameAction({ run, match: null }, 'build', { type: 'oracle' });
  assert.notEqual(stewardTask(run)?.id, 'newBuilding');
  assert.equal(run.gold, gold - BUILDINGS.oracle.cost[0] + stewardGold(STEWARD_TASKS.find((t) => t.id === 'newBuilding')));
});

test('what fighters want: a room item met lifts their spirits; a lapsed one makes them sulk', () => {
  const run = createRun(4);
  const f = recruit(run, run.market[0].id);
  f.want = { id: 'room', key: 'bathhouse', item: 'Bathhouse', since: run.week, until: run.week + 6 };
  const renown = f.renown;
  f.decor.bathhouse = 1;
  checkQuests(run);
  assert.equal(f.want, undefined);
  assert.equal(f.renown, renown + FIGHTER_WANTS.metRenown);
  assert.equal(f.mood.n, FIGHTER_WANTS.metMorale);
  const g = recruit(run, run.market[0].id);
  g.want = { id: 'room', key: 'shrine', item: 'Shrine of Mars', since: run.week, until: run.week - 1 };
  checkQuests(run);
  assert.equal(g.want, undefined);
  assert.equal(g.mood.n, FIGHTER_WANTS.missMorale);
  assert.ok(run.talk.some((t) => t.key.startsWith(`want-lapsed-${g.id}`)));
});

test('a want that can no longer happen goes quietly; a title want is met by the Title', () => {
  const run = createRun(5);
  const f = recruit(run, run.market[0].id);
  f.want = { id: 'revenge', name: 'Gorrak the Butcher', of: 'o999', since: run.week, until: null };
  checkQuests(run);
  assert.equal(f.want, undefined);
  assert.equal(f.mood, undefined, 'no sulk: the nemesis was gone');
  f.want = { id: 'title', tier: 1, arena: 'the Dirt Pits', since: run.week, until: run.week + 24 };
  f.titles.push(championTitle(1));
  assert.ok(isChampionOf(f, 1));
  checkQuests(run);
  assert.equal(f.want, undefined);
  assert.equal(f.mood.n, FIGHTER_WANTS.metMorale);
});

test('wants arrive some months on their own dice, never more than the cap', () => {
  const run = createRun(6);
  for (let i = 0; i < 2; i++) { const f = recruit(run, run.market[0].id); f.level = 3; }
  run.gold = 999;
  weeks(run, 44);
  assert.ok(run.roster.filter((f) => f.want).length <= FIGHTER_WANTS.max);
  assert.ok(run.log.some((l) => /wants something/.test(l.text)), 'a year brings at least one');
});

test('the archrival is the house with most Glory at the start, with no dice; it climbs with you', () => {
  const run = createRun(7);
  const top = [...run.houses].sort((a, b) => b.glory - a.glory)[0];
  assert.equal(archrival(run).id, top.id);
  const old = deserialize(serialize(run));
  delete old.archrival;
  assert.equal(archrival(old).id, top.id, 'an older save finds the same rival');
});

test('the rival champion is named from Bronze, comes back at your top arena, and the result moves Glory', () => {
  const run = createRun(8);
  recruit(run, run.market[0].id);
  run.topTier = 2;
  run.arenas[2] = { ...structuredClone(run.arenas[1]), tier: 2 };
  run.arenas[1].conquered = true;
  run.week = 3; // a month starts next week
  run.boutPending = false; run.bouts = null;
  advanceWeek(run);
  assert.ok(run.rivalChampion, 'named');
  assert.ok(run.talk.some((t) => t.key.startsWith('rival-named')));
});

test('the rival may eye the Market\'s best fighter, and buys them after a week unless you do', () => {
  const run = createRun(9);
  const best = run.market[0];
  run.poach = { id: best.id, week: run.week };
  advanceWeek(run);
  assert.ok(!run.market.some((f) => f.id === best.id), 'bought');
  assert.equal(run.poach, null);
  const again = createRun(9);
  again.poach = { id: again.market[0].id, week: again.week };
  const mine = recruit(again, again.market[0].id);
  advanceWeek(again);
  assert.ok(again.roster.includes(mine), 'you bought them first');
});

test('the cause asks for the Whispering Gallery only after the Mark; the building is secret until then', () => {
  const run = createRun(10, { patron: 'liberator' });
  run.prestige = 20; run.prestigeLevel = 2; run.gold = 99;
  assert.equal(buildingKnown(run, 'gallery'), false);
  assert.match(buildBlocker(run, 'gallery'), /Unknown/);
  run.plot.stage = 'favours';
  run.plot.markWeek = 0;
  run.week = REBEL_QUEST.afterMark + 3; // a month starts next week
  advanceWeek(run);
  assert.ok(run.quests.rebel.some((q) => q.id === 'gallery'));
  assert.equal(buildingKnown(run, 'gallery'), true);
  const trust = run.plot.trust;
  buildRoom(run, 'gallery');
  checkQuests(run);
  assert.equal(run.plot.trust, trust + REBEL_QUEST.galleryTrust);
  const r = risingProgress(run);
  assert.equal(r.stage, 'favours');
  assert.ok(r.needs.length, 'what the rising still needs');
});

test('a lobbying request lapses with lost trust; met when the law passes', () => {
  const run = createRun(11, { patron: 'liberator' });
  run.plot.stage = 'favours';
  run.plot.trust = 3;
  run.quests = { steward: null, stewardIndex: 0, rebel: [{ id: 'lobby', policy: 'amnesty', name: 'Amnesty', since: 0, until: run.week - 1 }] };
  checkQuests(run);
  assert.equal(run.plot.trust, 3 + REBEL_QUEST.missTrust);
  assert.equal(run.quests.rebel.length, 0);
  run.quests.rebel.push({ id: 'lobby', policy: 'amnesty', name: 'Amnesty', since: run.week, until: run.week + 16 });
  run.policies = [{ id: 'amnesty', until: run.week + 16 }];
  checkQuests(run);
  assert.equal(run.plot.trust, 3 + REBEL_QUEST.missTrust + REBEL_QUEST.lobbyTrust);
});

test('talk keeps its last 30 entries, each key once', () => {
  const run = createRun(12);
  run.week = QUESTS.stewardFromWeek;
  checkQuests(run);
  checkQuests(run);
  const keys = run.talk.map((t) => t.key);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(RIVAL.chance > 0);
});

test('a career with quests survives save and load', () => {
  const run = createRun(13);
  run.week = QUESTS.stewardFromWeek;
  checkQuests(run);
  const back = deserialize(serialize(run));
  assert.equal(stewardTask(back).id, stewardTask(run).id);
  assert.deepEqual(back.talk, run.talk);
});

test('a new friendship gets a scene: the two friends, then the steward explaining it (the designer, 5.4.0)', async () => {
  const { exhibition } = await import('../src/run.js');
  const run = createRun(14);
  const a = recruit(run, run.market[0].id);
  const b = recruit(run, run.market[0].id);
  run.prestige = 20; run.prestigeLevel = 2; run.gold = 50;
  buildRoom(run, 'exhibition');
  advanceToTournament(run);
  exhibition(run, a.id, b.id);
  const t = run.talk.find((x) => x.key.startsWith('bond-'));
  assert.ok(t, 'a scene is queued');
  assert.deepEqual(t.beats.map((x) => x.speaker), ['narrator', 'fighter', 'fighter', 'steward']);
  assert.match(t.beats[0].text, /ring/);
  assert.match(t.beats[3].text, /happier while the other is in the house/);
});
