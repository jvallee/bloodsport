// 7.7 (review brief Phase 2): how the game feels.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMatch, autoPlay, suggestTactic } from '../src/fight.js';
import { createRng } from '../src/rng.js';
import { blank } from './helpers.js';

test('2.1 Quick pace plays a round in well under half the time; the deciding round keeps its slow pause', async () => {
  const { roundTiming, setFightPace } = await import('../src/ui/fightView.js');
  const m = createMatch({ a: blank({ name: 'A', power: 7 }), b: blank({ id: 'b', name: 'B' }), rng: createRng(4) });
  autoPlay(m, suggestTactic);
  const first = m.rounds[0];
  const last = m.rounds.at(-1);
  setFightPace('full');
  const full = roundTiming(m, first).end;
  const fullDecider = roundTiming(m, last);
  setFightPace('quick');
  const quick = roundTiming(m, first).end;
  const quickDecider = roundTiming(m, last);
  setFightPace('full');
  assert.ok(quick < full * 0.5, `quick ${quick} vs full ${full}`);
  // The decider's suspense (the pause before the winner) is the same in both paces.
  const pause = (t) => t.reveal - t.delays[Math.max(0, t.lines.findIndex((l) => l.type === 'roll') - 1)];
  assert.ok(quickDecider.reveal < fullDecider.reveal);
  assert.ok(pause(quickDecider) >= 2 - 1e-9, `decider pause ${pause(quickDecider)}`);
});

test('2.2 first-strike chance: exact over two d6 (ties split), with Concussed and Footwork', async () => {
  const { firstStrikeChance } = await import('../src/fight.js');
  const match = (a, b) => createMatch({ a: blank({ name: 'A', ...a }), b: blank({ id: 'b', name: 'B', ...b }), rng: createRng(1) });
  assert.equal(firstStrikeChance(match({}, {})), 0.5);
  // Speed +1: A wins on d(A)+1 > d(B), i.e. P(dA >= dB) = 21/36, and half the ties of dA+1 = dB (5/36).
  const p = firstStrikeChance(match({ speed: 4 }, { speed: 3 }));
  assert.ok(Math.abs(p - (15 / 36 + 6 / 36 + 0.5 * 5 / 36)) < 1e-9, String(p));
  assert.ok(Math.abs(firstStrikeChance(match({ speed: 3 }, { speed: 4 })) - (1 - p)) < 1e-9, 'symmetric');
  assert.equal(firstStrikeChance(match({ injuries: [{ tag: 'concussed', weight: 1 }] }, {})), 0, 'Concussed always strikes second');
  assert.equal(firstStrikeChance(match({ kindTrait: 'footwork', kind: 'elf', speed: 4 }, { speed: 3 })), 1, 'Footwork and faster');
  assert.equal(firstStrikeChance(match({ speed: 20 }, { speed: 3 })), 1);
});

test('2.2 the fight screen shows the first-strike chance for both fighters before a round', async () => {
  const { fightView } = await import('../src/ui/fightView.js');
  const m = createMatch({ a: blank({ name: 'Aulus', speed: 4 }), b: blank({ id: 'b', name: 'Brutus', speed: 3 }), rng: createRng(1) });
  const html = fightView(m, { animateRound: 0, showMath: false }, { name: 'Test', tier: 1 });
  assert.match(html, /Strikes first: Aulus about <b>65%<\/b> · Brutus about <b>35%<\/b>/);
});

test('2.3 hints: a Mutinous fighter, a mole\'s clues, and a covert op still to run come before the idle-fighter hint', async () => {
  const { nextHint } = await import('../src/hints.js');
  const { createRun, recruit, espState } = await import('../src/run.js');
  const run = createRun(77);
  const f = recruit(run, run.market[0].id);
  f.morale = 10;
  run.unrest = 3;
  assert.match(nextHint(run).text, new RegExp(`${f.name} is Mutinous \\(Morale 10\\)[^]*refuse to fight[^]*unrest \\(3/8\\)`));
  f.morale = 60;
  espState(run).clues = [{ week: 1, text: 'x' }];
  assert.match(nextHint(run).text, /mole[^]*[Ii]nvestigate/);
  espState(run).clues = [];
  run.buildings.push({ id: 'bl', type: 'liaison', level: 1 });
  const { weeksUntilTournament } = await import('../src/calendar.js');
  while (weeksUntilTournament(run.week) !== 1) run.week += 1; // the week before fight day
  assert.match(nextHint(run).text, /covert op|agents/);
});

test('2.3 the Estate tab shows a dot when there are clues or a covert op to run', async () => {
  const { topbar } = await import('../src/ui/views.js');
  const { createRun, espState } = await import('../src/run.js');
  const run = createRun(78);
  assert.doesNotMatch(topbar(run, 'ludus', 0, true), /data-tab="estate">Estate<span class="dot"/);
  espState(run).clues = [{ week: 1, text: 'x' }];
  assert.match(topbar(run, 'ludus', 0, true), /data-tab="estate">Estate<span class="dot"/);
});

test('2.4 the odds cache key holds only what a fight reads: a job, Stress, XP or story change keeps it', async () => {
  const { oddsKey: fightKey, estimateOdds } = await import('../src/odds.js');
  const { createRun, recruit } = await import('../src/run.js');
  const run = createRun(79);
  const f = recruit(run, run.market[0].id);
  const opp = run.arenas[1].opponent;
  const key = fightKey(f);
  const odds = estimateOdds(f, opp, { n: 200 });
  const g = { ...structuredClone(f), job: 'trainSpeed', stress: f.stress + 17, xp: f.xp + 3, story: [...(f.story ?? []), { week: 9, text: 'x' }], mood: { n: 5, weeks: 2 } };
  assert.equal(fightKey(g), key);
  assert.deepEqual(estimateOdds(g, opp, { n: 200 }), odds, 'those fields really do not change a fight');
  assert.notEqual(fightKey({ ...g, power: g.power + 1 }), key);
  assert.notEqual(fightKey({ ...g, injuries: [{ tag: 'fleshWound', weight: 1 }] }), key);
});

test('2.8 a death: the fight screen gives the eulogy and their story; the log says it once; the end screen names the fallen', async () => {
  const { fightView } = await import('../src/ui/fightView.js');
  const { endBanner } = await import('../src/ui/views.js');
  const { createRun, recruit, advanceToTournament, startMatch, finishMatch, choosePerk } = await import('../src/run.js');
  const run = createRun(81);
  const f = recruit(run, run.market[0].id);
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  advanceToTournament(run);
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  const m = startMatch(run, f.id, 1);
  m.over = true;
  m.round = 2;
  m.result = { winner: 'B', reason: 'death' };
  m.a.f.alive = false;
  const logBefore = run.log.length;
  m.summary = finishMatch(run, m);
  const lines = run.log.slice(logBefore).map((l) => l.text ?? l);
  assert.ok(lines.some((t) => /died in/.test(t)));
  assert.ok(!lines.some((t) => new RegExp(`${f.name} lost`).test(t)), 'no "lost" straight after "died"');
  const html = fightView(m, { animateRound: 0, showMath: false }, { name: 'The Dirt Pits', tier: 1 });
  assert.match(html, /class="eulogy"[^]*Here lies[^]*Fell in/);
  run.status = 'lost';
  assert.match(endBanner(run, null), new RegExp(`class="fallen-faces"[^]*<small>${f.name}</small>`));
});

test('2.10 How to play has a second tab with the intro pages (the Power-gap rule among them)', async () => {
  const { helpModal } = await import('../src/ui/views.js');
  const { INTRO } = await import('../src/tutorial.js');
  const play = helpModal();
  assert.match(play, /data-action="help-tab" data-tab="rules"/);
  const rules = helpModal('rules');
  for (const page of INTRO.slice(1)) assert.ok(rules.includes(page.title), page.title);
  assert.match(rules, /\+1 is 55% per round, \+3 is 70%/);
});
