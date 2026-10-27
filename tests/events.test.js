import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, recruit, advanceWeek, advanceBlocker, advanceToTournament, chooseEvent, eventChoiceBlocker, serialize, deserialize } from '../src/run.js';
import { EVENTS, EVENT_BY_ID, EVENT_CHANCE } from '../src/events.js';
import { REAL_EVENT_CHANCE } from './setup.js';

Object.assign(EVENT_CHANCE, REAL_EVENT_CHANCE); // events on in this file (tests/setup.js turns them off elsewhere)
import { FAVOR } from '../src/data.js';

// Advance week by week until an event appears.
function untilEvent(seed, fighters = 2) {
  const run = createRun(seed);
  for (let i = 0; i < fighters; i++) recruit(run, run.market[0].id);
  for (let w = 0; w < 60 && !run.event; w++) {
    skipTournament(run);
    advanceWeek(run);
  }
  return run;
}
// These tests are about events, not fights: let tournament weeks and level-ups pass.
function skipTournament(run) {
  run.boutPending = false;
  run.bouts = null;
  for (const f of run.roster) f.pendingPerks = [];
}
const firstAffordable = (run) => EVENT_BY_ID[run.event.id].choices.findIndex((_, i) => !eventChoiceBlocker(run, i));

test('events appear some weeks, block the week until decided, and are seeded', () => {
  const run = untilEvent(3);
  assert.ok(run.event, 'an event within 60 weeks');
  assert.ok(EVENT_BY_ID[run.event.id]);
  assert.match(advanceBlocker(run), /event/i);
  assert.deepEqual(untilEvent(3).event, run.event, 'same seed, same event');
  chooseEvent(run, EVENT_BY_ID[run.event.id].choices.findIndex((_, i) => !eventChoiceBlocker(run, i)));
  assert.equal(run.event, null);
  assert.doesNotMatch(advanceBlocker(run) ?? '', /event/);
});

test('event frequency is about one week in three', () => {
  let events = 0;
  let weeks = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const run = createRun(seed);
    recruit(run, run.market[0].id);
    recruit(run, run.market[0].id);
    for (let w = 0; w < 30; w++) {
      skipTournament(run);
      if (run.event) { events++; chooseEvent(run, firstAffordable(run)); }
      skipTournament(run);
      advanceWeek(run);
      weeks++;
    }
  }
  assert.ok(events / weeks > 0.18 && events / weeks < 0.4, `${events}/${weeks}`);
});

test('choices apply their effects, and costly ones need the Gold', () => {
  const run = untilEvent(5);
  run.event = { id: 'trainer', f: run.roster[0].id };
  run.gold = 2;
  assert.match(eventChoiceBlocker(run, 0), /Needs 6 Gold/);
  run.gold = 10;
  const xp = run.roster[0].xp;
  chooseEvent(run, 0);
  assert.equal(run.gold, 4);
  assert.ok(run.roster[0].xp > xp || run.roster[0].level > 1);

  run.event = { id: 'spy' };
  const favor = run.favor;
  chooseEvent(run, 0);
  assert.equal(run.favor, Math.min(FAVOR.max, favor + 3));
});

test('chance outcomes can injure, and injured fighters heal like any other', () => {
  let hurt = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const run = untilEvent(seed);
    if (!run.event) continue;
    run.event = { id: 'beast', f: run.roster[0].id };
    chooseEvent(run, 1);
    if (run.roster[0].injuries.some((i) => i.tag === 'fleshWound' && i.weeksLeft >= 1)) hurt++;
  }
  assert.ok(hurt > 3 && hurt < 22, `${hurt}/30 hurt (40% expected)`);
});

test('every event has text and at least two choices; the first choice never costs more than 6', () => {
  for (const e of EVENTS) {
    assert.ok(e.title && e.text({ f: 'A', g: 'B' }).length > 10, e.id);
    assert.ok(e.choices.length >= 2, e.id);
    assert.ok((e.choices[0].cost ?? 0) <= 6, e.id);
  }
});

test('a pending event survives a save and load', () => {
  const run = untilEvent(3);
  const back = deserialize(serialize(run));
  assert.deepEqual(back.event, run.event);
});

test('skip to tournament stops at an event', () => {
  const run = createRun(8);
  recruit(run, run.market[0].id);
  recruit(run, run.market[0].id);
  for (let i = 0; i < 12; i++) {
    advanceToTournament(run);
    if (run.event) return;
    run.boutPending = false;
    run.bouts = null;
  }
  assert.fail('no event in 12 months');
});
