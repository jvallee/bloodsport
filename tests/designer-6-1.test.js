// The designer's requests after 6.0.2 (2026-11-13): End week, a clearer first victory, renaming, and the cousin in the cells.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, recruit } from '../src/run.js';

test('the week\'s second button says "End week", not "One week" (the designer)', async () => {
  const { ludusTab } = await import('../src/ui/views.js');
  const run = createRun(5);
  recruit(run, run.market[0].id);
  const html = ludusTab(run, () => ({ win: 0.5, injury: 0.3, death: 0, n: 1 }));
  assert.ok(html.includes('End week'));
  assert.ok(!html.includes('One week'));
});

test('renaming: a new name, which costs Morale about 65% of the time, on its own dice (the designer)', async () => {
  const { rename, renameBlocker, moraleTarget } = await import('../src/run.js');
  const { RENAME } = await import('../src/data.js');
  const { MOOD_WEEKS } = await import('../src/events.js');
  let resented = 0;
  const N = 400;
  for (let seed = 1; seed <= N; seed++) {
    const run = createRun(seed);
    const f = recruit(run, run.market[0].id);
    const dice = JSON.stringify({ ...run.rng, rename: undefined });
    const before = moraleTarget(run, f).target;
    const hurt = rename(run, f.id, '  Spartacus  the Bold ');
    assert.equal(f.name, 'Spartacus the Bold', 'spaces are tidied');
    assert.ok(f.story.some((e) => e.text.includes('once called')), 'their Story remembers the old name');
    assert.equal(JSON.stringify({ ...run.rng, rename: undefined }), dice, 'no other dice are drawn');
    if (hurt) {
      resented++;
      assert.deepEqual(f.mood, { n: RENAME.morale, weeks: MOOD_WEEKS });
      assert.equal(moraleTarget(run, f).target, before + RENAME.morale);
    } else assert.ok(!f.mood || f.mood.n === 0);
  }
  assert.ok(Math.abs(resented / N - RENAME.chance) < 0.07, `resented ${resented}/${N}`);
  const run = createRun(3);
  const [a, b] = [recruit(run, run.market[0].id), recruit(run, run.market[1].id)];
  assert.match(renameBlocker(run, a.id, '   '), /empty/);
  assert.match(renameBlocker(run, a.id, 'x'.repeat(RENAME.maxLength + 1)), /at most/);
  assert.match(renameBlocker(run, a.id, b.name.toUpperCase()), /already called/);
  assert.match(renameBlocker(run, a.id, a.name), /already has/);
  assert.equal(renameBlocker(run, a.id, 'Crixus Novus'), null);
});

test('a rename is recorded with its name, so a career with one replays (the designer)', async () => {
  const { applyGameAction } = await import('../src/game.js');
  const { replay } = await import('../src/debug.js');
  const state = { run: createRun(9), match: null };
  applyGameAction(state, 'recruit', { id: state.run.market[0].id });
  const id = state.run.roster[0].id;
  applyGameAction(state, 'rename', { id, name: 'Felix' });
  const again = replay({ kind: 'bloodsport-bug-report', format: 1, version: 'x', seed: 9, actions: state.run.actions, save: { setup: state.run.setup } });
  assert.deepEqual(again.errors, []);
  assert.equal(again.state.run.roster[0].name, 'Felix');
  assert.deepEqual(again.state.run.roster[0].mood, state.run.roster[0].mood);
});

test('the house\'s first win is marked, and the fight screen celebrates it once (the designer: "make first victory more clear")', async () => {
  const { applyGameAction } = await import('../src/game.js');
  const { fightView } = await import('../src/ui/fightView.js');
  const { boutFor } = await import('../src/run.js');
  let firsts = 0;
  for (let seed = 1; seed <= 30 && firsts < 3; seed++) {
    const state = { run: createRun(seed), match: null };
    const { run } = state;
    applyGameAction(state, 'recruit', { id: run.market[0].id });
    run.roster[0].power += 30; // wins nearly every fight
    let wins = 0;
    const tidy = () => {
      for (const f of run.roster) if (f.pendingPerks.length) applyGameAction(state, 'perk', { id: f.id, perk: f.pendingPerks[0][0] });
      if (run.event) applyGameAction(state, 'event-choice', { index: 0 });
      if (run.fortune) applyGameAction(state, 'fortune-pass');
    };
    while (run.status === 'active' && wins < 2 && run.week < 60) {
      tidy();
      if (!run.bouts) { applyGameAction(state, 'advance-tournament'); continue; }
      const tier = run.topTier;
      try { applyGameAction(state, 'fight', { id: run.roster[0].id, tier }); } catch { applyGameAction(state, 'advance'); continue; }
      while (!state.match.over) applyGameAction(state, 'next-round', { stance: 'steady' });
      const s = state.match.summary;
      const html = fightView(state.match, { animateRound: 0 }, boutFor(run, tier));
      if (s.won) {
        wins++;
        assert.equal(Boolean(s.firstWin), wins === 1, `win ${wins} is ${wins === 1 ? '' : 'not '}the first`);
        assert.equal(html.includes('Your first victory'), wins === 1);
        if (wins === 1) firsts++;
      } else assert.ok(!html.includes('Your first victory'));
      if (run.mercy) applyGameAction(state, 'mercy', { choice: 'spare' });
      applyGameAction(state, 'leave-fight');
    }
  }
  assert.ok(firsts >= 3, 'first wins were seen');
});
