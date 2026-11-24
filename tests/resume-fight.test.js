// 7.5.1 (review brief 1.4, the designer's D1): a fight survives a reload and resumes with the same dice.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, serialize, deserialize, advanceToTournament, choosePerk } from '../src/run.js';
import { applyGameAction } from '../src/game.js';
import { buildReport, replay } from '../src/debug.js';

function atFight(seed) {
  const state = { run: createRun(seed), match: null };
  applyGameAction(state, 'recruit', { id: state.run.market[0].id });
  for (const f of state.run.roster) while (f.pendingPerks.length) choosePerk(state.run, f.id, f.pendingPerks[0][0]);
  applyGameAction(state, 'advance-tournament');
  if (state.run.fortune) { applyGameAction(state, 'fortune-pass'); applyGameAction(state, 'advance-tournament'); }
  for (const f of state.run.roster) while (f.pendingPerks.length) choosePerk(state.run, f.id, f.pendingPerks[0][0]);
  applyGameAction(state, 'fight', { id: state.run.roster[0].id, tier: state.run.topTier });
  return state;
}
const reload = (state) => {
  state.run = deserialize(serialize(state.run));
  state.match = state.run.inMatch ? state.run.matchInfo?.match ?? null : null;
};
const playOut = (state) => {
  while (state.match && !state.match.over) applyGameAction(state, 'next-round', { stance: 'steady' });
  applyGameAction(state, 'leave-fight');
};
const outcome = (run) => JSON.stringify([run.history, run.gold, run.favor, run.prestige, run.roster, run.fallen, run.rng.fight]);

test('a fight interrupted by a reload plays out exactly as if it had not been', () => {
  for (const seed of [3, 7, 12, 21]) {
    const plain = atFight(seed);
    const resumed = atFight(seed);
    applyGameAction(plain, 'next-round', { stance: 'steady' });
    applyGameAction(resumed, 'next-round', { stance: 'steady' });
    if (resumed.match.over) continue;
    reload(resumed);
    assert.ok(resumed.match, 'the fight is still on');
    assert.equal(resumed.match.round, 1);
    assert.equal(resumed.match.rng, resumed.run.rng.fight, 'the fight rolls the career\'s fight dice');
    playOut(plain);
    playOut(resumed);
    assert.equal(outcome(resumed.run), outcome(plain.run), `seed ${seed}`);
  }
});

test('a reload before Round 1 costs nothing: no Favour, no capitulation, no nemesis', () => {
  const state = atFight(5);
  const favor = state.run.favor;
  reload(state);
  assert.equal(state.run.favor, favor);
  assert.ok(state.run.inMatch && state.match && state.match.round === 0);
  assert.equal(state.run.history.length, 0);
  assert.ok(!(state.run.nemeses ?? []).length);
});

test('a replayed career with a reload mid-fight still matches', () => {
  const state = atFight(9);
  applyGameAction(state, 'next-round', { stance: 'steady' });
  reload(state);
  playOut(state);
  const { state: again } = replay(buildReport(state.run, null));
  assert.equal(serialize(again.run), serialize(state.run));
});

test('an older save with an open match but no stored fight still counts as capitulating', () => {
  const state = atFight(11);
  const old = JSON.parse(serialize(state.run));
  delete old.matchInfo.match;
  const loaded = deserialize(JSON.stringify(old));
  assert.equal(loaded.inMatch, false);
  assert.equal(loaded.history.length, 1, 'the match was settled');
  assert.equal(loaded.history[0].won, false);
});
