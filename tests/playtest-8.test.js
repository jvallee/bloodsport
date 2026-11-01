// The designer's playthrough notes (2026-10-31): Prestige through tournaments, gradual Morale, Merciful, Masochist,
// Blood Faith, the Power preview, gear and event results.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ECONOMY, BRACKET, CIRCUITS, PERKS } from '../src/data.js';
import { createRun, recruit, advanceToTournament, boutFor, startMatch, finishMatch, resolveMercy, fightPowers, createFighter } from '../src/run.js';
import { createMatch, playRound } from '../src/fight.js';
import { createRng } from '../src/rng.js';
import { ludusTab, resultModal } from '../src/ui/views.js';
import { blank } from './helpers.js';

const fakeOdds = () => ({ win: 0.5, injury: 0.3, death: 0, n: 1 });

test('a win in a lower arena always earns some Prestige (playtest: it rounded down to 0)', () => {
  const run = createRun(1);
  recruit(run, run.market[0].id);
  advanceToTournament(run);
  for (const t of [2, 3]) run.arenas[t] = { ...structuredClone(run.arenas[1]), tier: t, stage: 0, conquered: t < 3 };
  run.arenas[1].conquered = true;
  run.topTier = 3;
  const dirt = boutFor(run, 1);
  assert.equal(dirt.below, 2);
  assert.ok(Math.floor(CIRCUITS[0].winPrestige[dirt.stage] * ECONOMY.lowerArenaPrestige ** 2) === 0, 'the halving alone would give nothing');
  assert.equal(dirt.winPrestige, ECONOMY.lowerArenaMinPrestige);
});

test('every win in a tournament earns a little Prestige, so a lost Final is not a total loss', () => {
  assert.ok(BRACKET.prestige >= 1);
});

test('Merciful: sparing always wins the crowd over, even when it called for blood', () => {
  const run = createRun(2);
  const f = recruit(run, run.market[0].id);
  f.perks = ['merciful'];
  const morale = f.morale;
  run.mercy = { fighterId: f.id, opp: 'Varro', house: null, crowd: 'kill', tier: 1, top: true, at: 0 };
  run.history.push({});
  const out = resolveMercy(run, 'spare');
  assert.ok(f.morale > morale, 'the crowd bonus applies');
  assert.ok(PERKS.merciful);
  assert.ok(out);
});

test('Masochist: an injury never switches the trait off (another trait can be)', () => {
  const disabledKind = (trait) => {
    let n = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const m = createMatch({ a: blank({ id: 'a', kindTrait: trait, cls: 'fighter', weapon: 'sword' }), b: blank({ id: 'b', power: 12 }), rng: createRng(seed) });
      while (!m.over) playRound(m);
      if (m.a.disabled.includes('kind')) n++;
    }
    return n;
  };
  assert.ok(disabledKind('hateful') > 0, 'injuries do switch other traits off');
  assert.equal(disabledKind('masochist'), 0);
});

test('Blood Faith: an Orc who dies in a match earns the house their clan\'s Gold', () => {
  const run = createRun(4);
  const f = recruit(run, run.market[0].id);
  Object.assign(f, { kind: 'orc', kindTrait: 'bloodFaith' });
  advanceToTournament(run);
  const m = startMatch(run, f.id);
  m.over = true;
  m.result = { winner: 'B', reason: 'death' };
  m.a.f.alive = false;
  m.round = 1;
  const s = finishMatch(run, m);
  assert.equal(s.bloodFaith, true);
  assert.equal(s.gold, boutFor(run, run.topTier).lossGold + ECONOMY.bloodFaithGold * run.topTier);
});

test('the fight-day preview shows the Power each side really fights with', () => {
  const run = createRun(3);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  f.topStreak = 2; // scouted: the opponent gets more Power against this fighter
  const { mine, theirs } = fightPowers(run, f, run.topTier);
  assert.match(ludusTab(run, fakeOdds), new RegExp(`Power ${mine} vs ${theirs}`));
});

test('an event choice\'s result shows in a popup', () => {
  const html = resultModal('A stray at the gate', [{ tone: 'event', text: 'Let them keep it. −2 Gold.' }, { tone: 'good', text: 'Imperial Favour +2.' }]);
  assert.match(html, /A stray at the gate/);
  assert.match(html, /<li class="good">Imperial Favour \+2\.<\/li>/);
  assert.match(html, /data-action="result-close"/);
});

test('seasoned recruits: later arenas sell fighters above level 1, with their perks, for more Gold', async () => {
  const { RECRUIT, PERKS: P } = await import('../src/data.js');
  const { marketPrice, recruitPrice, advanceWeek } = await import('../src/run.js');
  const run = createRun(5);
  assert.ok(run.market.every((f) => f.level === 1), 'the Dirt Pits sell rookies');
  for (const t of [2, 3, 4]) run.arenas[t] = { ...structuredClone(run.arenas[1]), tier: t, stage: 0, conquered: t < 4 };
  run.topTier = 4;
  const before = run.market.map((f) => f.id).join();
  for (let i = 0; i < 8 && run.market.map((f) => f.id).join() === before; i++) { run.event = null; run.boutPending = false; run.bouts = null; advanceWeek(run); } // to the next restock
  const seasoned = run.market.filter((f) => f.level > 1);
  assert.ok(seasoned.length, 'the Imperial Market has seasoned fighters');
  for (const f of run.market) {
    assert.ok(RECRUIT.levels[3].includes(f.level), `level ${f.level}`);
    assert.equal(f.perks.length, f.level - 1, 'a perk for each level');
    assert.ok(f.perks.every((p) => P[p]));
    assert.equal(recruitPrice(run, f), marketPrice(run) + RECRUIT.perLevel * (f.level - 1));
  }
});

test('the Temple of Fortuna swaps a waiting perk choice for three new ones, for Gold', async () => {
  const { pray, prayBlocker, prayPrice } = await import('../src/run.js');
  const run = createRun(6);
  const f = recruit(run, run.market[0].id);
  f.pendingPerks = [['mighty', 'swift', 'killer']];
  assert.equal(prayBlocker(run, f.id), 'Build the Temple of Fortuna first.');
  run.buildings.push({ id: 'bt', type: 'temple', level: 1 });
  run.gold = 20;
  const offers = new Set();
  for (let i = 0; i < 4; i++) { pray(run, f.id); offers.add(f.pendingPerks[0].join()); }
  assert.equal(run.gold, 20 - 4 * prayPrice(run));
  assert.ok(offers.size > 1, 'new choices');
  assert.equal(f.pendingPerks.length, 1);
  f.pendingPerks = [];
  assert.equal(prayBlocker(run, f.id), 'No perk choice to pray over.');
});

test('the Exhibition Ring: two free fighters spar on tournament day for XP, Renown and Gold, never to the death', async () => {
  const { exhibition, exhibitionBlocker } = await import('../src/run.js');
  const run = createRun(7);
  const [a, b] = [recruit(run, run.market[0].id), recruit(run, run.market[0].id)];
  run.buildings.push({ id: 'be', type: 'exhibition', level: 1 });
  assert.equal(exhibitionBlocker(run, a.id, b.id), 'Exhibitions happen on tournament day.');
  advanceToTournament(run);
  for (const f of [a, b]) f.injuries = [];
  const gold = run.gold;
  const xp = a.xp + b.xp;
  const r = exhibition(run, a.id, b.id);
  assert.ok(run.gold > gold);
  assert.ok(a.xp + b.xp > xp);
  assert.ok(a.alive && b.alive);
  assert.ok([a.name, b.name].includes(r.winner));
  assert.equal(exhibitionBlocker(run, a.id, b.id), 'The ring has had its bout this week.');
});

test('dialogue replies: you answer the Emperor, and his answer to your choice plays next', async () => {
  const { SCENES } = await import('../src/dialogue.js');
  const { dialogueModal } = await import('../src/ui/views.js');
  const at = SCENES.opening.findIndex((b) => b.replies);
  assert.ok(at > 0);
  const html = dialogueModal('opening', SCENES.opening, at);
  assert.match(html, /You:/);
  assert.equal((html.match(/data-action="scene-reply"/g) ?? []).length, SCENES.opening[at].replies.length);
  assert.doesNotMatch(html, /scene-next/, 'you must answer');
  for (const r of SCENES.opening[at].replies) assert.ok(r.then.length && r.then.every((b) => b.speaker && b.text));
});

// ---- Playtest #8 (LLM) fixes ----

test('playtest: a disabled Unbreakable no longer holds the Death Gate open longer', async () => {
  const { deathGateAt } = await import('../src/fight.js');
  const f = { kindTrait: 'unbreakable', perks: [] };
  assert.equal(deathGateAt(f), 3);
  assert.equal(deathGateAt(f, null, ['kind']), 2);
});

test('playtest: a signature can\'t be spent while the class ability is disabled', async () => {
  const { signatureBlocker } = await import('../src/fight.js');
  const m = createMatch({ a: blank({ id: 'a', cls: 'ashHungry', level: 3 }), b: blank({ id: 'b' }), rng: createRng(1) });
  assert.equal(signatureBlocker(m), null);
  m.a.disabled.push('class');
  assert.match(signatureBlocker(m), /disabled/);
});

test('playtest: a daze (Distracted) passes on its own in a week, whatever the job', async () => {
  const { advanceWeek } = await import('../src/run.js');
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.injuries = [{ tag: 'distracted', weight: 0, weeksLeft: 1 }];
  run.boutPending = false;
  advanceWeek(run);
  assert.equal(f.injuries.length, 0);
});

test('playtest: sparing doesn\'t renew a life a house still owes you', () => {
  const run = createRun(2);
  const f = recruit(run, run.market[0].id);
  const h = run.houses[0];
  h.owed = 1;
  run.mercy = { fighterId: f.id, opp: 'X', house: h.id, crowd: 'kill', tier: 1, top: true, at: 0 };
  run.history.push({});
  resolveMercy(run, 'spare');
  assert.equal(h.owed, 1);
});

test('playtest: every generated fighter\'s name is remembered, and no fighter shares a house\'s name', async () => {
  const { NAMES, HOUSES } = await import('../src/data.js');
  const run = createRun(3);
  for (const f of run.market) assert.ok(run.recentNames.includes(f.name), f.name);
  const houses = (HOUSES.list ?? Object.values(HOUSES).find(Array.isArray)).map((h) => h.name.replace(/^House /, ''));
  assert.deepEqual(NAMES.filter((n) => houses.includes(n)), []);
  assert.equal(new Set(NAMES).size, NAMES.length);
});

test('the Liaison\'s prisoners, convicts too, arrive seasoned in later arenas, priced by level', async () => {
  const { RECRUIT, LIAISON } = await import('../src/data.js');
  const { advanceWeek } = await import('../src/run.js');
  let seasoned = 0;
  for (let seed = 1; seed <= 12; seed++) {
    const run = createRun(seed);
    for (const t of [2, 3, 4]) run.arenas[t] = { ...structuredClone(run.arenas[1]), tier: t, stage: 0, conquered: t < 4 };
    run.topTier = 4;
    run.prestigeLevel = 2;
    run.buildings.push({ id: 'bl', type: 'liaison', level: 1 });
    for (let i = 0; i < 6 && !run.liaisonOffer; i++) { run.event = null; run.boutPending = false; run.bouts = null; advanceWeek(run); }
    const f = run.liaisonOffer;
    assert.ok(RECRUIT.levels[3].includes(f.level));
    assert.equal(f.perks.length, f.level - 1);
    assert.ok(f.price >= LIAISON.convictPrice + RECRUIT.perLevel * (f.level - 1) - 2, 'priced by level (political ones a little cheaper)');
    if (f.level > 1) seasoned++;
  }
  assert.equal(seasoned, 12, 'the Imperial Liaison never sells a level 1');
});
