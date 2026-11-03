// The designer's 5.4.0 requests: a Boss Final lost keeps the buy-in, the overtraining warning, demand alerts, a slower rebel.
import test from 'node:test';
import assert from 'node:assert/strict';
import { BRACKET } from '../src/data.js';
import {
  createRun, recruit, advanceToTournament, startMatch, finishMatch, choosePerk, drawBrackets, keepsBuyIn, boutFor, GRAND_TIER,
  overtrainedByWeek, setJob, serialize,
} from '../src/run.js';

function atBossBracket(seed, tier = 3) {
  const run = createRun(seed);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  for (let t = 2; t <= tier; t++) run.arenas[t] = { ...structuredClone(run.arenas[1]), tier: t, conquered: t < tier, stage: t === tier ? 2 : 0 };
  run.arenas[1].conquered = true;
  run.topTier = tier;
  run.bouts = Object.fromEntries(Array.from({ length: tier }, (_, i) => [i + 1, 'open']));
  run.boutPending = true;
  drawBrackets(run);
  run.prestige = 50;
  f.power = 30;
  return { run, f };
}
const play = (run, id, tier, winner = 'A', reason = 'rounds') => {
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  const m = startMatch(run, id, tier);
  m.over = true;
  m.round = 2;
  m.result = { winner, reason };
  const s = finishMatch(run, m);
  if (run.mercy) run.mercy = null;
  return s;
};

test('losing the Final of a Silver Boss tournament returns the Prestige buy-in (designer, 5.4.0)', () => {
  assert.ok(BRACKET.bossFinalRefund > 0);
  const { run, f } = atBossBracket(21);
  const start = run.prestige;
  const buyIn = boutFor(run, 3).buyIn;
  play(run, f.id, 3);
  play(run, f.id, 3);
  assert.equal(keepsBuyIn(run, 3), true, 'the Final is next');
  const afterTwo = run.prestige;
  assert.equal(afterTwo, start - buyIn + 2 * BRACKET.prestige);
  const s = play(run, f.id, 3, 'B');
  assert.equal(s.won, false);
  assert.equal(s.refund, buyIn);
  assert.equal(run.prestige, afterTwo + buyIn, 'the buy-in comes back; the early wins\' Prestige stays');
});

test('capitulating in the Boss Final returns the buy-in too', () => {
  const { run, f } = atBossBracket(22);
  const buyIn = boutFor(run, 3).buyIn;
  play(run, f.id, 3);
  play(run, f.id, 3);
  const before = run.prestige;
  const s = play(run, f.id, 3, 'B', 'towel');
  assert.equal(s.refund, buyIn);
  assert.equal(run.prestige, before + buyIn);
});

test('a Boss bracket lost before the Final, and the Grand Tournament\'s Final, still cost the buy-in', () => {
  const early = atBossBracket(23);
  const start = early.run.prestige;
  const buyIn = boutFor(early.run, 3).buyIn;
  const s = play(early.run, early.f.id, 3, 'B');
  assert.equal(s.refund, undefined);
  assert.equal(early.run.prestige, start - buyIn);
  const grand = atBossBracket(24, GRAND_TIER);
  play(grand.run, grand.f.id, GRAND_TIER);
  play(grand.run, grand.f.id, GRAND_TIER);
  assert.equal(keepsBuyIn(grand.run, GRAND_TIER), false);
});

test('the Bronze Boss (a single match) still costs its buy-in when lost', () => {
  const { run } = atBossBracket(25, 2);
  assert.equal(keepsBuyIn(run, 2), false);
});

test('End week can tell who this week\'s training would overtrain, without changing the career', () => {
  const run = createRun(31);
  const f = recruit(run, run.market[0].id);
  run.gold = 50;
  setJob(run, f.id, 'trainPower');
  f.stress = 20;
  assert.deepEqual(overtrainedByWeek(run), []);
  f.stress = 35;
  const before = serialize(run);
  assert.deepEqual(overtrainedByWeek(run).map((x) => x.id), [f.id]);
  assert.equal(serialize(run), before, 'nothing changed');
  setJob(run, f.id, 'rest');
  assert.deepEqual(overtrainedByWeek(run), []);
});

import { dueRebel, dueRebelStage } from '../src/dialogue.js';
test('the rebel reveals the rising slowly: a guarded word after the sign, the confession once trusted, then the stages', () => {
  const run = createRun(4, { patron: 'liberator' });
  const seen = [];
  assert.equal(dueRebel(run, seen), null);
  assert.equal(dueRebelStage(run, seen), null, 'nothing the week they arrive');
  run.plot.stage = 'favours';
  run.plot.trust = 1;
  const first = dueRebelStage(run, seen);
  assert.equal(first.id, 'rebel-favours');
  const text = first.beats.map((b) => b.text).join(' ');
  assert.doesNotMatch(text, /rising|Silbannacus/, 'the first word gives nothing away');
  assert.doesNotMatch(text, /again/);
  seen.push(first.id);
  assert.equal(dueRebel(run, seen), null);
  run.plot.trust = 3;
  assert.ok(dueRebel(run, seen));
  seen.push('rebel');
  run.plot.stage = 'cause';
  assert.equal(dueRebelStage(run, seen).id, 'rebel-cause');
});

import { demandMetScene, demandMissedScene } from '../src/dialogue.js';
import { advanceWeek, demandMet } from '../src/run.js';
test('a demand\'s judgement is recorded for the Emperor\'s scene: met or missed', () => {
  const run = createRun(41);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  run.demand = { id: 'topWin', week: run.week - 3 };
  const s = play(run, f.id, 1, 'B');
  assert.equal(s.won, false);
  assert.equal(demandMet(run), false);
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  advanceWeek(run);
  assert.equal(run.demandResult.met, false);
  assert.equal(run.demandResult.id, 'topWin');
  assert.ok(run.demandResult.favor < 0);
  assert.match(demandMissedScene('Win a match in your top arena', -4).map((b) => b.text).join(' '), /Demand missed: Win a match in your top arena\. Imperial Favour −4/);
  assert.match(demandMetScene('Spare a beaten opponent', 3, 6).at(-1).text, /\+3 Favour and 6 Gold/);
});

import { PLOT_EVENT_BY_ID } from '../src/plot.js';
test('a political prisoner asks to be freed only while two are in the house (designer, 5.4.0)', () => {
  const run = createRun(4, { patron: 'liberator' });
  run.plot.trust = 5;
  run.plot.stage = 'favours';
  const card = PLOT_EVENT_BY_ID.freeMe;
  assert.equal(run.roster.filter((f) => f.political).length, 1);
  assert.equal(card.when(run), false, 'the only rebel never asks to leave');
  const other = recruit(run, run.market[0].id);
  other.political = { ...run.roster.find((f) => f.political && f !== other).political };
  assert.equal(card.when(run), true);
});

import { EVENT_BY_ID } from '../src/events.js';
import { chooseEvent, raisable, buildRoom, reanimateBlocker } from '../src/run.js';
import { WEEKS_PER_YEAR } from '../src/calendar.js';
test('the Emperor\'s spy: once a career from Year 2; executing them leaves a body the Temple of Vulcan can raise', () => {
  const run = createRun(51);
  const a = recruit(run, run.market[0].id);
  recruit(run, run.market[0].id);
  const card = EVENT_BY_ID.emperorsSpy;
  assert.equal(card.when(run), false, 'not in the first year');
  run.week = WEEKS_PER_YEAR + 2;
  assert.equal(card.when(run), true);
  run.event = { id: 'emperorsSpy', f: a.id };
  chooseEvent(run, 1);
  assert.ok(!run.roster.includes(a));
  const body = run.fallen.find((x) => x.id === a.id);
  assert.ok(body.body && body.spy);
  assert.equal(card.when(run), false, 'once a career');
  run.prestige = 40; run.prestigeLevel = 3; run.gold = 100;
  buildRoom(run, 'vulcan');
  assert.ok(raisable(run).some((x) => x.id === a.id));
  assert.equal(reanimateBlocker(run, a.id), null);
});

test('keeping the spy pleases the Emperor, and they keep writing', () => {
  const run = createRun(52);
  const a = recruit(run, run.market[0].id);
  recruit(run, run.market[0].id);
  run.week = WEEKS_PER_YEAR + 2;
  const favour = run.favor;
  run.event = { id: 'emperorsSpy', f: a.id };
  chooseEvent(run, 0);
  assert.equal(run.favor, favour + 3);
  assert.equal(a.spy, true);
  assert.equal(run.spyFound, true);
});

import { decorCalm } from '../src/run.js';
import { STRESS } from '../src/data.js';
test('a room\'s decor lowers Stress by at most 30 a week (bug report: a furnished room took 80, and training never counted)', () => {
  const run = createRun(61);
  const f = recruit(run, run.market[0].id);
  f.decor = { ...f.decor, bird: 1 };
  assert.equal(decorCalm(f), 5);
  f.decor = { ...f.decor, bird: 3, fireBrazier: 3, shrine: 2, bathhouse: 2 };
  assert.equal(STRESS.decorCalm, 30);
  assert.equal(decorCalm(f), 30);
  run.gold = 50;
  setJob(run, f.id, 'trainPower');
  f.stress = 30;
  advanceWeek(run);
  assert.equal(f.stress, 30 + STRESS.train - 30, 'training now builds Stress in a furnished room only as fast as the cap allows');
});
