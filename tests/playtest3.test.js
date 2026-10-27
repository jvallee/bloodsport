// Fixes from LLM playtest #3 (docs/playtest-llm-3.md), test-first.
import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateOdds } from '../src/odds.js';
import { createRng } from '../src/rng.js';
import { createFighter, createRun, recruit, advanceToTournament, advanceWeek, boutFor, matchOptions, startMatch, finishMatch, moraleTarget, chooseEvent, houseForArena } from '../src/run.js';
import { createMatch, playRound, suggestTactic } from '../src/fight.js';
import { stakesText, EVENT_BY_ID } from '../src/events.js';
import { narrateRound } from '../src/narrate.js';
import { blank } from './helpers.js';

test('odds include Gods\' Days, feuds and vengeance', () => {
  const rng = createRng(5);
  const f = createFighter(rng, { id: 'a', power: 8 });
  const opp = createFighter(rng, { id: 'b', power: 8 });
  f.cls = 'sagittarius';
  opp.cls = 'cestus';
  const plain = estimateOdds(f, opp, { n: 600 }).win;
  assert.ok(estimateOdds(f, opp, { n: 600, festival: 'apollo' }).win > plain + 0.02, 'ranged +1 Power on Ludi Apollinares');
  assert.ok(estimateOdds(f, opp, { n: 600, grudge: 1 }).win < plain - 0.05, 'a feud gives them +1 Power');
  assert.ok(estimateOdds(f, opp, { n: 600, vengeance: true }).win > plain + 0.02, 'vengeance +5%');
});

test('every event choice spells out its stakes', () => {
  assert.equal(stakesText(EVENT_BY_ID.injuredDog.choices[0].effects), '−2 Gold; them: +15 Morale for 4 weeks, −10 Stress');
  assert.equal(stakesText(EVENT_BY_ID.beast.choices[1].effects), '60%: +6 Gold, them: +2 Renown; otherwise: them: Flesh Wound');
  assert.equal(stakesText(EVENT_BY_ID.beast.choices[0].effects), 'Nothing happens');
});

test('event Morale lasts: it shifts where Morale is heading for 4 weeks', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  const base = moraleTarget(run, f).target;
  run.event = { id: 'injuredDog', f: f.id };
  run.gold = 10;
  chooseEvent(run, 0);
  assert.equal(moraleTarget(run, f).target, Math.min(100, base + 15));
  for (let i = 0; i < 4; i++) {
    run.boutPending = false;
    run.bouts = null;
    run.event = null;
    advanceWeek(run);
  }
  assert.equal(moraleTarget(run, f).target, base);
});

test('scouting fades over the winter and when you move up an arena', () => {
  const run = createRun(2);
  const f = recruit(run, run.market[0].id);
  f.topStreak = 1;
  run.week = 39; // the last week before winter
  run.bouts = null;
  advanceWeek(run);
  assert.equal(f.topStreak, 0, 'winter');
  f.topStreak = 1;
  run.week = 3;
  run.bouts = { 1: 'open' };
  run.boutPending = true;
  run.arenas[1].stage = 2;
  const m = startMatch(run, f.id, 1);
  m.over = true;
  m.result = { winner: 'A', reason: 'rounds' };
  finishMatch(run, m);
  assert.equal(run.topTier, 2);
  assert.equal(matchOptions(run, f, 2).scouted, 0, 'a new arena has not scouted you');
});

test('a settled festival week previews next month\'s bout without the festival', () => {
  const run = createRun(3);
  recruit(run, run.market[0].id);
  run.week = 11; // Maius tournament week: Floralia
  run.bouts = { 1: 'done' };
  assert.equal(boutFor(run, 1).festival, null);
  run.bouts = { 1: 'open' };
  assert.equal(boutFor(run, 1).festival, 'floralia');
});

test('the suggested tactic counts Gods\' Days: Press during the Armilustrium beats a coin-flip opponent', () => {
  const m = createMatch({ a: blank(), b: blank({ humor: 'sanguine' }), rng: createRng(1), festival: 'mars' });
  assert.equal(suggestTactic(m), 'press'); // Press beats their Feint, and Mars adds +5%
  const plain = createMatch({ a: blank(), b: blank(), rng: createRng(1), festival: 'mars' });
  assert.equal(suggestTactic(plain), 'press', 'no habits: take the festival bonus');
});

test('disarm narration names who did it', () => {
  const m = createMatch({ a: blank({ name: 'Decima', cls: 'fighter', weapon: 'fists', power: 15 }), b: blank({ name: 'Gannicus' }), rng: createRng(1) });
  const r = playRound(m);
  const text = narrateRound(m, r).map((l) => l.text).join(' ');
  if (r.winner === 'A') assert.match(text, /Gannicus is disarmed by Decima's Fists/);
});

test('names of the dead never return', () => {
  const run = createRun(4);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  const dead = run.arenas[1].opponent.name;
  const m = startMatch(run, f.id, 1);
  m.over = true;
  m.result = { winner: 'A', reason: 'death' };
  finishMatch(run, m);
  assert.ok(run.graveyard.includes(dead));
  for (let i = 0; i < 30; i++) {
    run.boutPending = false; run.bouts = null; run.event = null;
    for (const x of run.roster) x.pendingPerks = [];
    advanceWeek(run);
    assert.ok(![...run.market, ...Object.values(run.arenas).map((a) => a.opponent)].some((x) => x?.name === dead));
  }
});

test('opponents in higher arenas fight for houses that have climbed there (or the leader)', () => {
  const run = createRun(5);
  run.houses[0].glory = 30;
  run.houses[0].tier = 3;
  for (let i = 0; i < 10; i++) assert.equal(houseForArena(run, 3).id, run.houses[0].id);
  const low = houseForArena(run, 1);
  assert.ok(run.houses.includes(low), 'any house fights in the Dirt Pits');
});

test('upsets and crushing wins are judged on the Power actually fought with (decor, augments, feuds)', async () => {
  const { fightPowers } = await import('../src/run.js');
  const run = createRun(7);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  const opp = run.arenas[1].opponent;
  opp.kindTrait = 'firebug';
  opp.decor.fireBrazier = 3;
  const { mine, theirs } = fightPowers(run, f, 1);
  assert.equal(theirs - mine, opp.power + 3 - f.power);
  // A fight where their braziers made them the stronger side counts as an upset when you win.
  f.power = opp.power + 1;
  const m = startMatch(run, f.id, 1);
  playRound(m, { stance: 'steady' });
  m.over = true;
  m.result = { winner: 'A', reason: 'rounds' };
  const s = finishMatch(run, m);
  assert.ok(s.favor > 0 || s.renown >= 3, 'counted as an upset');
});
