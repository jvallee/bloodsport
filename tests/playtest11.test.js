// Playtest LLM-11 fixes (docs/playtest-llm-11.md, docs/playtest-llm-11-plot.md): the rival champion, wants within reach,
// the spy, the cause's requests, talk spacing and the hidden stranger's bed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CIRCUITS, FIGHTER_WANTS, PLOT, QUESTS, REBEL_QUEST } from '../src/data.js';
import { PLOT_EVENT_BY_ID } from '../src/plot.js';
import { EVENT_BY_ID, stakesText } from '../src/events.js';
import { ENTRIES } from '../src/codex.js';
import { medbaySlots } from '../src/ludus.js';
import {
  createRun, recruit, advanceWeek, checkQuests, wantFor, chooseEvent, createFighter, championTitle, effectivePower, setJob,
} from '../src/run.js';
import { createRng } from '../src/rng.js';

function withPrisoner(seed = 1) {
  const run = createRun(seed);
  run.gold = 100;
  run.prestigeLevel = 3;
  run.buildings.push({ id: 'bl', type: 'liaison', level: 1 });
  recruit(run, run.market[0].id);
  const f = createFighter(createRng(9), { id: 'fp', takenNames: run.roster.map((x) => x.name) });
  Object.assign(f, { political: { cell: 'scribe' }, price: 1, origin: 'Condemned convict' });
  run.liaisonOffers = [f];
  recruit(run, f.id);
  return { run, f };
}
function card(run, id, index) {
  const t = PLOT_EVENT_BY_ID[id].target(run, run.rng.plot);
  run.event = { id, plot: true, ...t };
  return chooseEvent(run, index);
}

test('a Championship want only comes within reach of the arena\'s Boss', () => {
  const run = createRun(31);
  const f = recruit(run, run.market[0].id);
  f.level = 3;
  run.topTier = 4;
  const boss = CIRCUITS[3].oppPower[2];
  f.power -= effectivePower(f) - (boss - FIGHTER_WANTS.titleReach - 5);
  assert.equal(wantFor(run, f, 'title'), null, 'far below the Imperial Boss: never asked');
  f.power += 5;
  assert.ok(wantFor(run, f, 'title'), 'within reach: may be asked');
});

test('room wants vary among the items a fighter lacks', () => {
  const run = createRun(32);
  const f = recruit(run, run.market[0].id);
  const items = new Set();
  for (let w = 1; w < 10; w++) { run.week = w; items.add(wantFor(run, f, 'room').key); }
  assert.ok(items.size > 1, `always ${[...items]}`);
  for (const k of FIGHTER_WANTS.roomItems) f.decor[k] = 1;
  assert.equal(wantFor(run, f, 'room'), null);
});

test('a mentor want skips a pair who bond this week anyway; revenge skips a nemesis in an arena they are Champion of', () => {
  const run = createRun(33);
  const young = recruit(run, run.market[0].id);
  const vet = recruit(run, run.market[0].id);
  vet.level = 4;
  assert.equal(wantFor(run, young, 'mentor').of, vet.id);
  run.week = 10;
  run.history.push({ week: 9, won: true, fighterId: young.id }, { week: 9, won: true, fighterId: vet.id });
  assert.equal(wantFor(run, young, 'mentor'), null, 'both won last fight day: they become friends this week anyway');

  run.nemeses = [{ id: 'n1', name: 'Gorrak', nemesis: { epithet: 'the Butcher', tier: 1, beat: [young.id] } }];
  assert.ok(wantFor(run, young, 'revenge'));
  young.titles.push(championTitle(1));
  assert.equal(wantFor(run, young, 'revenge'), null, 'a win in the Dirt Pits would cost a Champion Favour');
});

test('the Emperor\'s spy is never your most famous fighter, and never the rebels\' champion; keeping them says what it costs', () => {
  const { run } = withPrisoner(34);
  const a = run.roster.find((x) => !x.political);
  const b = { ...structuredClone(a), id: 'fb', name: 'Second' }; // the Quarters hold two: added by hand
  const c = { ...structuredClone(a), id: 'fx', name: 'Extra' };
  run.roster.push(b, c);
  a.renown = 30; b.renown = 2; c.renown = 1;
  const pool = EVENT_BY_ID.emperorsSpy.target(run);
  assert.ok(!pool.includes(a), 'not the star');
  assert.match(stakesText({ spy: 'keep' }), /palace hears/);
  run.event = { id: 'emperorsSpy', f: b.id };
  chooseEvent(run, 0);
  assert.ok(b.spy);
  b.renown = 99;
  const champ = PLOT_EVENT_BY_ID.recruitChampion.target(run);
  assert.notEqual(champ.f, b.id);
  assert.notEqual(champ.g, b.id);
});

test('a request met on a full trust bar lowers suspicion instead', () => {
  const { run } = withPrisoner(35);
  run.plot.stage = 'cause';
  run.plot.trust = PLOT.maxTrust;
  run.plot.suspicion = 40;
  run.quests = { steward: null, stewardIndex: 0, rebel: [{ id: 'lobby', policy: 'amnesty', name: 'Amnesty', since: run.week, until: run.week + 16 }] };
  run.policies = [{ id: 'amnesty', until: run.week + 16 }];
  checkQuests(run);
  assert.equal(run.plot.trust, PLOT.maxTrust);
  assert.equal(run.plot.suspicion, 40 - REBEL_QUEST.lobbyTrust * REBEL_QUEST.overflowSuspicion);
});

test('once the rising is ready, refusing favours never lets it go cold', () => {
  const { run } = withPrisoner(36);
  card(run, 'chalkMark', 1);
  run.plot.stage = 'ready';
  for (let i = 0; i < PLOT.refusalsToCold + 1; i++) card(run, 'pamphlets', 0);
  assert.equal(run.plot.ended, null);
});

test('hiding the wounded man takes the bed from a patient when the Medbay is full', () => {
  const { run } = withPrisoner(37);
  const f = run.roster.find((x) => !x.political);
  f.injuries.push({ tag: 'fleshWound', weight: 1, weeksLeft: 2 });
  const beds = medbaySlots(run);
  const patients = run.roster.slice(0, beds);
  for (const p of patients) { if (!p.injuries.length) p.injuries.push({ tag: 'fleshWound', weight: 1, weeksLeft: 2 }); setJob(run, p.id, 'medbay'); }
  card(run, 'hideWounded', 1);
  assert.equal(run.roster.filter((x) => x.job === 'medbay').length, medbaySlots(run));
});

test('scenes are spaced out: no more than QUESTS.talkPerWeek a week, the rest wait in order', () => {
  const run = createRun(38);
  const a = recruit(run, run.market[0].id);
  const n = QUESTS.talkPerWeek + 2;
  for (let i = 0; i < n; i++) a.want = null, run.roster.push({ ...structuredClone(a), id: `w${i}`, want: { id: 'room', key: 'shrine', item: 'Shrine', since: run.week, until: run.week - 1 } });
  checkQuests(run);
  assert.equal(run.talk.filter((t) => t.week === run.week).length, QUESTS.talkPerWeek);
  assert.equal(run.talkLater.length, n - QUESTS.talkPerWeek);
  run.boutPending = false;
  advanceWeek(run);
  assert.equal(run.talkLater.length, n - 2 * QUESTS.talkPerWeek);
  assert.ok(run.talk.some((t) => t.key === `want-lapsed-w${QUESTS.talkPerWeek}-${run.week - 1}`), 'the first that waited comes first');
});

test('the Codex says a one-level building\'s effect once', () => {
  const e = ENTRIES.find((x) => x.key === 'building:gallery');
  assert.ok(!/up to/.test(e.rules), e.rules);
});

test('the Liaison offers a line-up (LIAISON.offers by level), at most one political; older saves keep their one offer', async () => {
  const { LIAISON } = await import('../src/data.js');
  const { buildRoom, serialize, deserialize, advanceToTournament, upgradeRoom } = await import('../src/run.js');
  const run = createRun(41);
  run.prestige = 200; run.prestigeLevel = 4; run.gold = 200;
  buildRoom(run, 'liaison');
  assert.equal(run.liaisonOffers.length, LIAISON.offers[0]);
  upgradeRoom(run, run.buildings.find((b) => b.type === 'liaison').id);
  advanceToTournament(run); run.boutPending = false; advanceWeek(run);
  assert.equal(run.liaisonOffers.length, LIAISON.offers[1]);
  assert.ok(run.liaisonOffers.every((f) => f.origin === 'Prisoner of war'));
  assert.ok(run.liaisonOffers.slice(1).every((f) => !f.political));
  // The first prisoner bought: the steward says what it means.
  recruit(run, run.liaisonOffers[1].id);
  assert.ok([...run.talk, ...(run.talkLater ?? [])].some((t) => t.key === 'liaison-saved'));
  // A save from before 5.4.2 had one offer.
  const old = JSON.parse(serialize(run));
  old.liaisonOffer = old.liaisonOffers[0];
  delete old.liaisonOffers;
  const back = deserialize(JSON.stringify(old));
  assert.equal(back.liaisonOffers.length, 1);
  assert.equal('liaisonOffer' in back, false);
});

// ---- Code review fixes (5.4.3) ----

test('room wants vary from month to month (wants come at month starts, 4 weeks apart)', () => {
  const run = createRun(51);
  const f = recruit(run, run.market[0].id);
  f.decor.trophy = 1; // two items missing
  const items = new Set();
  for (let m = 1; m < 6; m++) { run.week = m * 4; items.add(wantFor(run, f, 'room').key); }
  assert.equal(items.size, 2);
});

test('an older save\'s steward index follows its assignment by id (the list grew in 5.4.1)', async () => {
  const { STEWARD_TASKS } = await import('../src/quests.js');
  const run = createRun(52);
  recruit(run, run.market[0].id);
  run.week = QUESTS.stewardFromWeek;
  run.quests = { steward: 'level3', stewardIndex: 9, rebel: [], introduced: true }; // 9 was level3 in 5.4.0
  const gold = run.gold;
  checkQuests(run);
  assert.equal(run.quests.steward, 'level3', 'still waiting for House level 3');
  assert.equal(run.quests.stewardIndex, STEWARD_TASKS.findIndex((t) => t.id === 'level3'));
  assert.equal(run.gold, gold, 'nothing paid twice');
});

test('the archrival sends RIVAL.oppShare of the opponents where other houses fight too', async () => {
  const { RIVAL } = await import('../src/data.js');
  const { houseForArena } = await import('../src/run.js');
  const run = createRun(53);
  run.archrival = run.houses[0].id;
  for (const h of run.houses) h.tier = 2;
  const n = 1000;
  let theirs = 0;
  for (let i = 0; i < n; i++) if (houseForArena(run, 2).id === run.archrival) theirs += 1;
  assert.ok(Math.abs(theirs / n - RIVAL.oppShare) < 0.05, `${theirs} of ${n}`);
});

test('a summons win is no Imperial tournament won (the steward\'s list), and its log reads cleanly', async () => {
  const { STEWARD_TASKS } = await import('../src/quests.js');
  const run = createRun(54);
  run.history.push({ week: 9, tier: 4, won: true, summons: true });
  assert.equal(STEWARD_TASKS.find((t) => t.id === 'imperialWin').test(run), false);
  const { answerSummons } = await import('../src/run.js');
  for (let seed = 60; seed < 75; seed++) {
    const r = createRun(seed);
    recruit(r, r.market[0].id);
    r.week = 5; r.summons = { week: 5 };
    r.boutPending = false; r.bouts = null;
    const { advanceToTournament } = await import('../src/run.js');
    advanceToTournament(r);
    answerSummons(r, r.roster[0].id, 'death');
    const line = r.log.find((l) => l.text.startsWith("The Emperor's summons:")).text;
    assert.doesNotMatch(line, /\. \.|\. ,|\.\.$/, line);
  }
});

test('the rival champion drawn into an early round fights at that round\'s strength plus their bonus (when RIVAL.earlyAtFinal is off)', async () => {
  const { RIVAL } = await import('../src/data.js');
  const was = RIVAL.earlyAtFinal;
  RIVAL.earlyAtFinal = false;
  try { await earlyChampion(); } finally { RIVAL.earlyAtFinal = was; }
});
async function earlyChampion() {
  const { drawBrackets, effectivePower: ep } = await import('../src/run.js');
  let checked = 0;
  for (let seed = 1; seed < 40 && checked < 3; seed++) {
    const run = createRun(seed);
    recruit(run, run.market[0].id);
    run.topTier = 3;
    run.arenas[3] = { ...structuredClone(run.arenas[1]), tier: 3, stage: 0 };
    const final = run.arenas[3].opponent;
    Object.assign(final, { rivalChampion: true, rivalBonus: 2 });
    final.power += 2;
    const finalPower = ep(final) - 2;
    run.bouts = { 3: 'open' };
    run.brackets = {};
    drawBrackets(run);
    const b = run.brackets[3];
    const k = b.foes.findIndex((x) => x.rivalChampion);
    if (k < 0) continue;
    checked += 1;
    const other = b.foes[1 - k];
    assert.ok(ep(b.foes[k]) <= finalPower + 2 - (k === 0 ? 1 : 0), `champion ${ep(b.foes[k])} vs Final ${finalPower}`);
    assert.equal(ep(run.arenas[3].opponent), finalPower, 'the Final keeps its strength');
    assert.ok(other);
  }
  assert.ok(checked > 0, 'drew the champion early at least once');
}

