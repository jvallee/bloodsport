// Playtest #10 (LLM) fixes: bracket Bloodied Victories, withdrawals that blame nobody, the spare-Favour reason, event names.
import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOODIED, FAVOR } from '../src/data.js';
import {
  createRun, recruit, advanceToTournament, startMatch, finishMatch, withdraw, choosePerk, drawBrackets, spareFavorWhy, purseGold,
} from '../src/run.js';
import { stakesText } from '../src/events.js';
import { PLOT_EVENT_BY_ID } from '../src/plot.js';

// A career sitting at a Silver Coliseum tournament week (as in tests/brackets.test.js).
function atSilver(seed = 1, { boss = false } = {}) {
  const run = createRun(seed);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  run.arenas[2] = { ...structuredClone(run.arenas[1]), tier: 2 };
  for (const t of [1, 2]) run.arenas[t].conquered = true;
  run.topTier = 3;
  run.arenas[3] = { ...structuredClone(run.arenas[1]), tier: 3, stage: boss ? 2 : 0, conquered: false };
  run.bouts = { 1: 'open', 2: 'open', 3: 'open' };
  run.boutPending = true;
  drawBrackets(run);
  run.prestige = 50;
  f.power = 30;
  return { run, f };
}
const play = (run, id, tier, { winner = 'A', reason = 'rounds', injuries = [] } = {}) => {
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  const m = startMatch(run, id, tier);
  m.over = true;
  m.round = 2;
  m.rounds = [{}, {}];
  m.result = { winner, reason };
  m.a.f.injuries = [...m.a.f.injuries, ...injuries];
  return finishMatch(run, m);
};
const wounds = [{ tag: 'fleshWound', weight: 1 }, { tag: 'concussed', weight: 1 }];

test('a bracket Quarter-final won with 2+ injuries is a Bloodied Victory (playtest #10)', () => {
  const plain = atSilver(7);
  const p = play(plain.run, plain.f.id, 3);
  const bloody = atSilver(7);
  const favour = bloody.run.favor;
  const s = play(bloody.run, bloody.f.id, 3, { injuries: wounds });
  assert.equal(p.bloodied, false);
  assert.equal(s.bloodied, true, 'the summary marks it, so the "Bloodied Victory" demand can be met');
  assert.equal(s.renown, p.renown + BLOODIED.renown);
  assert.equal(s.xp, p.xp + BLOODIED.xp);
  assert.equal(bloody.run.favor, Math.min(100, favour + FAVOR.spectacleWin));
  assert.equal(s.favor, FAVOR.spectacleWin);
  assert.equal(s.scar, 'Battle-Hardened');
  assert.ok(bloody.run.roster[0].scars.some((x) => x.id === 'hardened'));
});

test('withdrawing from a bracket makes no nemesis of an opponent never fought (playtest #10)', () => {
  const { run, f } = atSilver(8);
  play(run, f.id, 3);
  const before = (run.nemeses ?? []).length;
  withdraw(run, 3);
  assert.equal((run.nemeses ?? []).length, before);
  assert.ok(!run.log.some((l) => /will be remembered in your house/.test(l.text)));
});

test('a Boss bracket lost before its Final doesn\'t say the Boss beat you (playtest #10)', () => {
  const { run, f } = atSilver(9, { boss: true });
  const boss = run.arenas[3].opponent;
  play(run, f.id, 3, { winner: 'B' });
  assert.equal(run.arenas[3].rival?.name, boss.name, 'the Boss still returns stronger');
  assert.ok(!run.log.some((l) => l.text.startsWith(`${boss.name} will remember this`)));
  assert.ok(run.log.some((l) => l.text.includes(boss.name) && /waiting/.test(l.text)));
});

test('the spare verdict gives the right reason for no Favour (playtest #10)', () => {
  const run = createRun(1);
  run.demand = { id: 'spare' };
  assert.equal(spareFavorWhy(run, { crowd: 'kill', top: false }), 'no Favour in a lower arena (it still meets the Emperor\'s demand)');
  assert.equal(spareFavorWhy(run, { crowd: 'kill', top: true }), 'no Favour: the crowd wanted blood (it still meets the Emperor\'s demand)');
  run.demand = null;
  assert.equal(spareFavorWhy(run, { crowd: 'kill', top: false }), 'no Favour in a lower arena');
  assert.equal(spareFavorWhy(run, { crowd: 'kill', top: true }), 'no Favour: the crowd wanted blood');
  run.demand = { id: 'kill' };
  assert.equal(spareFavorWhy(run, { crowd: 'spare', top: true }), 'no Favour: the Emperor demanded a death this month');
  assert.equal(spareFavorWhy(run, { crowd: 'spare', top: true, }), 'no Favour: the Emperor demanded a death this month');
});

test('event stakes name the fighters instead of "them" and "the other" (playtest #10)', () => {
  const card = PLOT_EVENT_BY_ID.recruitChampion ?? Object.values(PLOT_EVENT_BY_ID).find((e) => e.choices.some((c) => c.effects?.chance?.win?.champion === 'g'));
  const choice = card.choices.find((c) => c.effects?.chance?.win?.champion === 'g');
  const text = stakesText(choice.effects, '; ', { f: 'Scaeva', g: 'Pertinax' });
  assert.match(text, /Pertinax: joins the cause/);
  assert.doesNotMatch(text, /the other/);
  assert.equal(stakesText({ gold: -2, morale: { to: 'f', n: 15 } }), '−2 Gold; them: +15 Morale for 4 weeks', 'without names, the old words');
});

test('the result\'s Gold is the purse; a won bet is shown on its own (playtest #10)', () => {
  assert.equal(purseGold({ gold: 13, bet: { won: true, stake: 4, payout: 5 } }), 8);
  assert.equal(purseGold({ gold: 8, bet: { won: false, stake: 4, payout: 5 } }), 8);
  assert.equal(purseGold({ gold: 8 }), 8);
});
