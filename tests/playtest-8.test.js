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
