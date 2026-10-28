// v5 update requests: Power breakdown on hover, live Power in a fight, kinder tournament crowds, the round-winner reveal,
// a bigger Armourer and roomier Quarters.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { BUILDINGS, ECONOMY, PRESTIGE_LEVELS } from '../src/data.js';
import { createMatch, playRound } from '../src/fight.js';
import {
  createRun, recruit, advanceToTournament, advanceWeek, setJob, drawBrackets, crushingGapFor, effectivePower, powerParts, startMatch, finishMatch, choosePerk,
} from '../src/run.js';
import { fighterWarnings } from '../src/explain.js';
import { fighterCard } from '../src/ui/components.js';
import { fightView, revealTime, DICE_TIME } from '../src/ui/fightView.js';
import { blank } from './helpers.js';

test('the Armourer stocks 5 / 6 / 8 pieces; Quarters house 2 / 4 / 5, and a new house can hold 4', () => {
  assert.deepEqual(BUILDINGS.armourer.per, [5, 6, 8]);
  assert.deepEqual(BUILDINGS.quarters.per, [2, 4, 5]);
  assert.equal(PRESTIGE_LEVELS[0].maxFighters, 4);
});

test('Power breakdown: natural, training, Titles and gear add up to the card\'s Power', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  const natural = f.power;
  run.gold = 100;
  setJob(run, f.id, 'trainPower');
  advanceWeek(run);
  f.titles.push('Champion of the Dirt Pits');
  f.power += 1;
  f.gear.weapon = 'gladius';
  const parts = Object.fromEntries(powerParts(f).map((x) => [x.label, x.value]));
  assert.equal(parts.Natural, natural);
  assert.ok(parts.Training > 0);
  assert.equal(parts.Title, 1);
  assert.equal(powerParts(f).reduce((n, x) => n + x.value, 0), effectivePower(f));
  const html = fighterCard(f);
  assert.match(html, /title="Power \d+: [^"]*Natural \d+&#10;\+\d Training&#10;\+1 Title/);
});

test('in a fight the card shows this round\'s Power: Rampage up, Blinded down', () => {
  const m = createMatch({ a: blank({ kind: 'basa', kindTrait: 'rampage', power: 20 }), b: blank({ injuries: [{ tag: 'blinded', weight: 1 }] }), rng: createRng(1) });
  playRound(m);
  const html = fightView(m, { animateRound: 0, showMath: false }, { name: 'Test', tier: 1, buyIn: 1 });
  assert.match(html, /<b>21<\/b><span class="pdelta up">▲1<\/span>/, 'Rampage +1 after a round won');
  assert.match(html, /This round: \+1 Rampage/);
  // Blinded −2 per injury (Round 1 may have blinded them again).
  const n = m.b.f.injuries.filter((i) => i.tag === 'blinded').length;
  assert.match(html, new RegExp(`<b>${5 - 2 * n}</b><span class="pdelta down">▼${2 * n}</span>`));
  assert.match(html, new RegExp(`This round: −${2 * n} Blinded`));
});

test('the round winner is announced after the story, in a banner, and the winner\'s card glows', () => {
  const m = createMatch({ a: blank({ power: 20, name: 'Hero' }), b: blank({ name: 'Foe' }), rng: createRng(1) });
  const r = playRound(m);
  assert.equal(r.winner, 'A');
  const at = revealTime(m, r);
  assert.ok(at > DICE_TIME + 1, 'a beat of suspense after the dice');
  const html = fightView(m, { animateRound: 1, showMath: false }, { name: 'Test', tier: 1, buyIn: 1 });
  assert.match(html, /class="round-banner win late" style="animation-delay:[\d.]+s" role="status">⚔ Round 1 to Hero!<small>1–0<\/small>/);
  assert.match(html, /class="side round-won"/);
  assert.match(html, /class="side round-lost"/);
  assert.match(html, new RegExp(`class="score late" style="animation-delay:${at}s"`));
});

// A career whose top arena is the Imperial Arena, with a Silver Coliseum tournament below it.
function lowerSilver() {
  const run = createRun(2);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  for (const t of [2, 3, 4]) run.arenas[t] = { ...structuredClone(run.arenas[1]), tier: t, stage: 0, conquered: t < 4 };
  run.arenas[1].conquered = true;
  run.topTier = 4;
  run.bouts = { 1: 'open', 2: 'open', 3: 'open', 4: 'open' };
  run.boutPending = true;
  drawBrackets(run);
  run.prestige = 50;
  f.renown = 20;
  return { run, f };
}

test('tournament crowds forgive mismatches: never jeered in the Quarter- or Semi-final, only at +5 in the Final', () => {
  const { run, f } = lowerSilver();
  assert.equal(crushingGapFor(run, 1), ECONOMY.crushingGap, 'single matches keep the usual +3');
  assert.equal(crushingGapFor(run, 3), Infinity);
  f.power = effectivePower(run.arenas[3].opponent) + 4 - (effectivePower(f) - f.power); // +8 over the Quarter-final, +4 over the Final
  assert.ok(!fighterWarnings(run, f, 3).some((w) => /Crushing/.test(w.text)), 'no jeer warning before the Quarter-final');
  for (let i = 0; i < 2; i++) {
    for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
    const m = startMatch(run, f.id, 3);
    Object.assign(m, { over: true, result: { winner: 'A', reason: 'rounds' } });
    finishMatch(run, m);
  }
  assert.equal(crushingGapFor(run, 3), ECONOMY.bracketCrushingGap);
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  const m = startMatch(run, f.id, 3);
  Object.assign(m, { over: true, result: { winner: 'A', reason: 'rounds' } });
  assert.equal(finishMatch(run, m).crushing, false, '+4 in a Final is not a crushing win');
});

test('a wound from this round appears on the card only when the story reaches the blow', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const m = createMatch({ a: blank({ power: 20 }), b: blank(), rng: createRng(seed) });
    const r = playRound(m);
    if (!r.checks.some((c) => c.defender === 'B' && c.injury && c.injury.tag !== 'death')) continue;
    const html = fightView(m, { animateRound: 1, showMath: false }, { name: 'Test', tier: 1, buyIn: 1 });
    assert.match(html, /class="chip injury late" style="animation-delay:[\d.]+s"/);
    assert.doesNotMatch(fightView(m, { animateRound: 0, showMath: false }, { name: 'Test', tier: 1, buyIn: 1 }), /chip injury late/, 'shown at once after the animation');
    return;
  }
  assert.fail('no seed wounded the opponent');
});
