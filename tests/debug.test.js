import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, serialize, deserialize, advanceBlocker } from '../src/run.js';
import { applyGameAction } from '../src/game.js';
import { buildReport, parseReport, replay, stateDigest, REPORT_KIND } from '../src/debug.js';

// Play a few months through the shared action table, the way the web UI does.
function playCareer(seed, { months = 4, reloadMidFight = false } = {}) {
  const state = { run: createRun(seed), match: null };
  const act = (name, data) => {
    try { applyGameAction(state, name, data); } catch { /* refused actions are shown and the game carries on */ }
  };
  act('recruit', { id: state.run.market[0].id });
  act('recruit', { id: 'nobody' }); // a refused action is recorded and replays as refused
  act('job', { id: state.run.roster[0].id, job: 'trainPower' });
  for (let m = 0; m < months && state.run.status === 'active'; m++) {
    for (const f of state.run.roster) while (f.pendingPerks.length) act('perk', { id: f.id, perk: f.pendingPerks[0][0] });
    act('advance-tournament');
    const f = state.run.roster.find((x) => x.alive);
    if (!f || !state.run.boutPending) break;
    act('fight', { id: f.id, tier: state.run.topTier });
    act('next-round');
    if (reloadMidFight && m === 1 && !state.match.over) {
      state.run = deserialize(serialize(state.run)); // the player reloads the page
      state.match = null;
      continue;
    }
    while (state.match && !state.match.over) act('next-round');
    act('leave-fight');
    if (state.run.mercy) act('mercy', { choice: m % 2 ? 'kill' : 'spare' }); // thumbs up or down
    if (advanceBlocker(state.run)) for (const x of state.run.roster) while (x.pendingPerks.length) act('perk', { id: x.id, perk: x.pendingPerks[0][0] });
  }
  return state;
}

test('a recorded career replays exactly from its seed', () => {
  const played = playCareer(7, { months: 5 });
  assert.ok(played.run.actions.length > 10);
  assert.ok(played.run.history.length >= 3, 'fights happened');
  const report = parseReport(JSON.stringify(buildReport(played.run, played.match)));
  const { state, errors } = replay(report);
  assert.equal(serialize(state.run), serialize(played.run));
  assert.ok(errors.some((e) => e.action === 'recruit' && e.index === 1), 'the refused recruit is replayed as refused');
});

test('reloading mid-fight is recorded and replays the same way', () => {
  const played = playCareer(11, { months: 4, reloadMidFight: true });
  assert.ok(played.run.actions.some(([name]) => name === 'reload'));
  const { state } = replay(buildReport(played.run, played.match));
  assert.equal(serialize(state.run), serialize(played.run));
});

test('replay can stop before an action, to inspect the state just before a bug', () => {
  const played = playCareer(3, { months: 2 });
  const report = buildReport(played.run, null);
  const { state } = replay(report, { stopAt: 3 });
  assert.equal(state.run.actions.length, 3);
  assert.equal(state.run.roster.length, 1);
});

test('a report carries the error, its stack, the last action and a readable save', () => {
  const played = playCareer(5, { months: 1 });
  let error;
  try { applyGameAction(played, 'equip', { id: 'f99', index: 0 }); } catch (err) { error = err; }
  const report = buildReport(played.run, played.match, error, { version: 'test', where: 'action', lastAction: ['equip', { id: 'f99', index: '0' }], notes: 'clicked equip' });
  assert.equal(report.kind, REPORT_KIND);
  assert.match(report.error.message, /No such fighter|storeroom/);
  assert.match(report.error.stack, /run\.js/);
  assert.equal(report.save.seed, played.run.seed);
  assert.equal(report.notes, 'clicked equip');
  assert.deepEqual(report.actions.at(-1), ['equip', { id: 'f99', index: '0' }]);
});

test('a report made mid-fight includes the round-by-round record', () => {
  const state = playCareer(9, { months: 0 });
  applyGameAction(state, 'advance-tournament');
  applyGameAction(state, 'fight', { id: state.run.roster[0].id });
  applyGameAction(state, 'next-round');
  const report = JSON.parse(JSON.stringify(buildReport(state.run, state.match)));
  assert.equal(report.match.rounds.length, 1);
  assert.ok(report.match.rounds[0].win.chance > 0);
});

test('careers saved before recording start recording from a snapshot, and replay from it', () => {
  const played = playCareer(13, { months: 2 });
  const old = JSON.parse(serialize(played.run));
  delete old.actions;
  const loaded = { run: deserialize(JSON.stringify(old)), match: null };
  assert.ok(loaded.run.actionsBase);
  applyGameAction(loaded, 'advance');
  const report = buildReport(loaded.run, null);
  assert.equal(report.fromSnapshot, true);
  const { state } = replay(report);
  assert.deepEqual(stateDigest(state.run), stateDigest(loaded.run));
});

test('parseReport rejects anything that is not a bug report', () => {
  assert.throws(() => parseReport('{"hello":1}'), /not a Bloodsport bug report/);
});

test('the game version matches package.json', async () => {
  const { readFileSync } = await import('node:fs');
  const { VERSION } = await import('../src/version.js');
  assert.equal(VERSION, JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version);
});
