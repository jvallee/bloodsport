// 7.12: the new look from the 7.11 review (its interface test), and the End week dock (the designer).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, recruit, advanceToTournament, startMatch, choosePerk } from '../src/run.js';
import { ludusTab, topbar, nextBar, weekDock } from '../src/ui/views.js';
import { fightView } from '../src/ui/fightView.js';

test('UI/UX overhaul: structured topbar, smart nextBar, mobile 3-pane Ludus switcher, and fight tactic-grid', () => {
  const run = createRun(80);
  const f = recruit(run, run.market[0].id);
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  const bar = topbar(run, 'ludus', 2, true);
  assert.match(bar, /class="brand-row"/);
  assert.match(bar, /class="stats-strip"/);
  assert.match(bar, /class="icon i-ui"/);
  assert.match(bar, /data-tab="codex">Codex<span class="count"/);
  const hint = { text: 'Check the Market.', action: 'tab', tab: 'market', label: 'Open Market', tone: '' };
  assert.match(nextBar(hint, 'ludus'), /data-action="tab" data-tab="market"/, 'shows tab jump button from another tab');
  assert.doesNotMatch(nextBar(hint, 'market'), /data-action="tab" data-tab="market"/, 'omits redundant tab button when already on that tab');
  const ludusDefault = ludusTab(run, () => ({ win: 0.5, injury: 0.2, death: 0.01 }), 'invalid');
  assert.match(ludusDefault, /class="mobile-ludus-nav"/);
  assert.match(ludusDefault, /class="grid ludus" data-pane="roster"/);
  assert.doesNotMatch(ludusDefault, /class="pane-dot"/);
  advanceToTournament(run);
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  const ludusFightDay = ludusTab(run, () => ({ win: 0.5, injury: 0.2, death: 0.01 }), 'bout');
  assert.match(ludusFightDay, /class="grid ludus" data-pane="bout"/);
  assert.match(ludusFightDay, /class="pane-dot"/);
  const m = startMatch(run, f.id, 1);
  const fHtml = fightView(m, { animateRound: 0, showMath: false }, { name: 'The Dirt Pits', tier: 1 });
  assert.match(fHtml, /class="tactic-grid"/);
  assert.match(fHtml, /class="tactic-main"/);
  assert.match(fHtml, /class="icon i-tactic"/);
});

test('the End week dock: End week and To fight day between fights; on fight day it jumps to the bouts; never in a fight or after the end', () => {
  const run = createRun(81);
  recruit(run, run.market[0].id);
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  const quiet = weekDock(run);
  assert.match(quiet, /data-action="advance"/);
  assert.match(quiet, /data-action="advance-tournament"/);
  assert.equal(weekDock(run, true), '', 'hidden during a fight');
  advanceToTournament(run);
  const fightDay = weekDock(run);
  assert.match(fightDay, /data-action="jump-bout"/);
  assert.doesNotMatch(fightDay, /data-action="advance"/);
  run.boutPending = false;
  assert.match(weekDock(run), /data-action="advance"/);
  assert.doesNotMatch(weekDock(run), /advance-tournament/, 'already fight day');
  assert.equal(weekDock({ ...run, status: 'lost' }), '');
});
