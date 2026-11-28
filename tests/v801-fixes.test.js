import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createRun, recruit, draftCompanion, recruitCompanion, advanceWeek, advanceToTournament,
  startMatch, finishMatch, skipBlocker, fightPowers, buyDecorBlocker, assignDecorBlocker,
  buyAndAssignDecorBlocker, moveDecorBlocker, removeDecorBlocker, buyItemBlocker, useItemBlocker,
  enactBlocker, covertOpBlocker, espionageWeek, reanimate, buildRoom,
  chooseEvent, applyDialogueChoice, markPolitical, hasBracket, bracketOf,
} from '../src/run.js';
import { resolveMole } from '../src/run/espionage.js';
import { buildBlocker } from '../src/ludus.js';
import { playRound, createMatch } from '../src/fight.js';
import { createRng } from '../src/rng.js';
import { marketTab } from '../src/ui/views.js';
import { MORALE, STRESS } from '../src/data.js';
import { MOLE_CLUES } from '../src/quests.js';
import { createSession } from '../scripts/play-text.js';
import { readFileSync, readdirSync } from 'node:fs';
import {
  fightBlocker, withdrawBlocker, withdraw, advanceBlocker, choosePerk, resolveMercy, resolveDialogueTree, serialize,
  lockedIntoBracket, bracketLegOptions, demandSender, deserialize,
} from '../src/run.js';
import { issueDemand, judgeDemand } from '../src/run/houses.js';
import { DEMAND } from '../src/data.js';
import { computePower } from '../src/fight.js';
import { ludusTab } from '../src/ui/views.js';

test('v8.0.1 Slice 1: post-Week-0 Market renders paid recruit-companion buttons even with < 2 drafted', () => {
  const run = createRun(7);
  draftCompanion(run, 'orc');
  advanceWeek(run);
  assert.equal(run.week, 1);
  const html = marketTab(run);
  assert.match(html, /data-action="recruit-companion"/, 'renders paid recruit-companion action after Week 0');
  assert.doesNotMatch(html, /data-action="draft-companion"/, 'no longer renders disabled Week-0 free draft buttons');
  assert.match(html, /Recruit Companion · \d+ Gold/);
});

test('v8.0.1 Slice 1: recruitCompanion validates options before deducting Gold', () => {
  const run = createRun(11);
  run.gold = 30;
  advanceWeek(run);
  const goldBefore = run.gold;
  assert.throws(() => recruitCompanion(run, 'orc', { cls: 'notAClass' }), /class/i);
  assert.equal(run.gold, goldBefore, 'invalid class option must not deduct Gold');
  assert.equal(run.roster.length, 0);
});

test('v8.0.1 Slice 1: prototype keys (constructor / __proto__) rejected across all blockers without NaN', () => {
  const run = createRun(3);
  run.gold = 50;
  run.prestige = 50;
  run.prestigeLevel = 5;
  run.influence = 20;
  const f = recruit(run, run.market[0].id);
  buildRoom(run, 'lounge');
  buildRoom(run, 'liaison');
  for (const bad of ['constructor', '__proto__', 'toString']) {
    assert.match(buyDecorBlocker(run, bad), /Unknown decor/);
    assert.match(assignDecorBlocker(run, f.id, bad), /Unknown decor/);
    assert.match(buyAndAssignDecorBlocker(run, f.id, bad), /Unknown decor/);
    assert.match(moveDecorBlocker(run, f.id, bad, 'wall-left'), /not in their room/);
    assert.match(removeDecorBlocker(run, f.id, bad), /Nothing to remove/);
    assert.match(buyItemBlocker(run, bad), /Unknown item/);
    assert.match(enactBlocker(run, bad), /Unknown policy/);
    assert.match(covertOpBlocker(run, bad), /Unknown covert op/);
    assert.match(buildBlocker(run, bad), /Unknown building/);
    assert.match(buildBlocker(run, 'quarters', bad), /Unknown plot/);
  }
  const m = createMatch({ a: f, b: run.arenas[1].opponent, rng: createRng(1) });
  run.inMatch = true;
  for (const bad of ['constructor', '__proto__']) {
    assert.match(useItemBlocker(run, m, bad), /Unknown item/);
    assert.throws(() => playRound(m, { stance: bad }), /Unknown tactic/);
  }
  assert.ok(Number.isFinite(run.gold) && run.gold >= 0);
  assert.ok(Number.isFinite(run.influence));
});

test('v8.0.1 Slice 1: skipBlocker forbids skipping mid-bracket after winning Round 1', () => {
  const run = createRun(5, { short: false });
  run.prestige = 20;
  const f = draftCompanion(run, 'orc');
  run.topTier = 3;
  run.arenas[3] = { ...run.arenas[1], tier: 3, stage: 0 };
  advanceToTournament(run);
  assert.equal(hasBracket(run.topTier), true);
  run.brackets ??= {};
  run.brackets[run.topTier] = { round: 1, fighterId: f.id, buyIn: 0, foes: [run.arenas[run.topTier].opponent, run.arenas[run.topTier].opponent] };
  assert.match(skipBlocker(run), /already in the bracket/i);
});

// ---------- The Morale floor (8.0.1): only for a fighter who cannot withdraw, on every path ----------

// A real bracket in a lower arena under the Emperor's Gaze. `winLeg` plays one leg through the engine's own
// startMatch / finishMatch, then settles the perk and mercy choices the win raised.
function gazeBracket(seed = 5) {
  const run = createRun(seed, { short: false });
  run.prestige = 60;
  run.gold = 100;
  run.prestigeLevel = 4;
  buildRoom(run, 'quarters');
  const f = draftCompanion(run, 'orc');
  const mate = draftCompanion(run, 'basa');
  const spare = recruit(run, run.market[0].id);
  run.topTier = 4;
  run.arenas[2] = { ...run.arenas[1], tier: 2, stage: 0 };
  run.arenas[3] = { ...run.arenas[1], tier: 3, stage: 2, debuff: 'emperorsGaze' };
  run.arenas[4] = { ...run.arenas[1], tier: 4, stage: 0 };
  advanceToTournament(run);
  const settle = () => {
    for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
    if (run.mercy) resolveMercy(run, 'spare');
  };
  const winLeg = () => {
    const m = startMatch(run, f.id, 3);
    m.over = true;
    m.result = { winner: 'A', reason: 'rounds' };
    finishMatch(run, m);
    settle();
  };
  return { run, f, mate, spare, winLeg, settle };
}

// The queued scene's first reply that costs Morale, chosen through the same call the page makes.
function sayTheHarshThing(run, f) {
  const tree = resolveDialogueTree(run, f);
  const harsh = tree.choices.find((c) => (c.effects?.morale ?? 0) < 0);
  assert.ok(harsh, `the ${tree.id} scene offers a reply that costs Morale`);
  applyDialogueChoice(run, f.id, tree.id, harsh.id);
  return harsh.effects.morale;
}

test('8.0.1: a harsh word cannot turn a fighter Mutinous once they are locked into a Final (real bracket, real talk-choice)', () => {
  const { run, f, winLeg } = gazeBracket();
  winLeg();
  winLeg();
  assert.equal(bracketOf(run, 3).round, 2, 'two real wins put the fighter through to the Final');
  assert.match(withdrawBlocker(run, 3), /cannot withdraw/);
  assert.equal(lockedIntoBracket(run, f.id), true);
  f.morale = MORALE.mutinous + 2;
  const cost = sayTheHarshThing(run, f);
  assert.ok(cost < -2, 'the reply would have taken them below the line');
  assert.equal(f.morale, MORALE.mutinous, 'held at the Mutinous line');
  assert.equal(fightBlocker(run, f.id, 3), null, 'so the Final can still be fought and the week can end');
});

test('8.0.1: before the Final the fighter can still withdraw, so Morale falls as before and withdrawing is the way out', () => {
  const { run, f, winLeg } = gazeBracket();
  winLeg();
  assert.equal(lockedIntoBracket(run, f.id), false);
  assert.equal(withdrawBlocker(run, 3), null);
  f.morale = MORALE.mutinous + 2;
  sayTheHarshThing(run, f);
  assert.ok(f.morale < MORALE.mutinous, 'no floor while there is a way out');
  assert.match(fightBlocker(run, f.id, 3), /mutinous/);
  withdraw(run, 3);
  assert.doesNotMatch(advanceBlocker(run) ?? '', /through to/, 'the bracket no longer holds the week');
});

test('8.0.1: the floor holds on ally death and mole execution too, and never raises Morale', () => {
  const { run, f, mate, spare, winLeg, settle } = gazeBracket();
  winLeg();
  winLeg();
  assert.equal(lockedIntoBracket(run, f.id), true);

  // Ally death: the house's other companion dies in the top arena, through the real match flow.
  f.morale = MORALE.mutinous + 1;
  const m = startMatch(run, mate.id, 4);
  m.over = true;
  m.result = { winner: 'B', reason: 'death' };
  m.a.f.alive = false;
  finishMatch(run, m);
  settle();
  assert.equal(run.roster.some((x) => x.id === mate.id), false, 'the ally died');
  assert.equal(f.morale, MORALE.mutinous, 'ally death stops at the line');

  // Already below the line (an older save could be): a further blow changes nothing, and nothing lifts them.
  f.morale = MORALE.mutinous - 5;
  spare.mole = { master: 'palace', since: 0, clues: 1, exposed: true };
  resolveMole(run, 'execute', { f: spare.id }, []);
  assert.equal(f.morale, MORALE.mutinous - 5, 'held where it was, not lifted to the line');
});

test('8.0.1: Morale is written only by the engine\'s one writer (a new direct write has to be added here on purpose)', () => {
  const allowed = new Set([
    'src/run/helpers.js | f.morale = after;', // the writer
    'src/dialogueTrees.js | else target.morale = clamp((target.morale ?? 50) + n, 0, 100);', // only when no engine is wired in
    'src/run/roster.js | f.morale = elite ? 40 : 30;', // a new fighter's starting Morale
    'src/run/roster.js | f.morale = Math.max(f.morale ?? 50, def.morale ?? 55);', // only raises
    'src/run/unrest.js | if (UNREST.cowedMorale != null) for (const f of run.roster.filter(isMutinous)) f.morale = Math.max(f.morale, UNREST.cowedMorale);', // only raises
    'src/run/weekly.js | f.morale = f.morale < target ? Math.min(target, f.morale + MORALE.drift) : Math.max(target, f.morale - MORALE.driftDown);', // weekly drift: the week cannot end mid-bracket
    'src/run/tournaments.js | if (isInActiveBracket(run, fighter.id) && fighter.morale < MORALE.mutinous) fighter.morale = MORALE.mutinous;', // 8.0.0's own floor, only raises
    'src/run/migrations.js | if ((f.morale ?? MORALE.start) < MORALE.mutinous && lockedIntoBracket(run, f.id)) f.morale = MORALE.mutinous;', // on load: lifts an 8.0.0 save out of the softlock, only raises
    'src/run/tournaments.js | summary.morale = fighter.morale - moraleBefore;', // a result summary, not a fighter
    'src/run/tournaments.js | out.morale = MERCY.crowdMorale;', // a result summary, not a fighter
  ]);
  const base = new URL('../', import.meta.url);
  const files = readdirSync(new URL('src/', base), { recursive: true }).filter((p) => String(p).endsWith('.js')).map((p) => `src/${String(p).replaceAll('\\', '/')}`);
  assert.ok(files.length > 30, 'the scan found the source tree');
  const found = [];
  for (const file of files) {
    for (const line of readFileSync(new URL(file, base), 'utf8').split('\n')) {
      if (/[\w\])]\.morale\s*(=(?!=)|\+=|-=)/.test(line)) found.push(`${file} | ${line.trim()}`);
    }
  }
  assert.deepEqual(found.filter((x) => !allowed.has(x)), [], 'every Morale change goes through bumpMorale (src/run/helpers.js)');
  assert.deepEqual([...allowed].filter((x) => !found.includes(x)), [], 'the allow-list has no stale entries');
});

test('v8.0.1 Slice 1: applyDialogueChoice refuses ended runs and mid-match calls', () => {
  const run = createRun(23);
  const f = draftCompanion(run, 'orc');
  run.inMatch = true;
  assert.throws(() => applyDialogueChoice(run, f, 'hub', 'hub_dismiss'), /Finish the match first/);
  run.inMatch = false;
  run.status = 'lost';
  assert.throws(() => applyDialogueChoice(run, f, 'hub', 'hub_dismiss'), /run is over/);
});

// Not covered, and not true yet: an Overtrained fighter. The preview and the match roll the ability they lose from
// different dice, so the two can differ (queued; older than 8.0.1).
test('8.0.1: fightPowers counts Doctored wine and equals Round 1 of the real match for a rested fighter', () => {
  const run = createRun(29);
  const f = draftCompanion(run, 'orc');
  advanceToTournament(run);
  const opp = run.arenas[run.topTier].opponent;
  const base = fightPowers(run, f, run.topTier);
  run.espionage = { clues: [], suspects: null, opMonth: null, op: { type: 'wine', oppId: opp.id, result: 'success', variant: 'sluggish' }, leak: null };
  const before = serialize(run);
  const preview = fightPowers(run, f, run.topTier);
  assert.equal(serialize(run), before, 'previewing spends nothing: the wine is still in play');
  assert.equal(preview.theirs, base.theirs - 1, 'the preview counts the Doctored wine (-1 Power)');
  const m = startMatch(run, f.id, run.topTier);
  assert.deepEqual(preview, { mine: computePower(m.a, m.b, 1).total, theirs: computePower(m.b, m.a, 1).total }, 'and equals the real match');
});

test('v8.0.1 Slice 1: play-text.js uses buildRoom, supports recruit-companion & Market listing, and warns on overtrain', () => {
  const s = createSession(1, { oddsSamples: 40 });
  s.run.gold = 50;
  s.run.prestigeLevel = 4;

  // Week 0 Market lists Core Companions as Free
  const m0 = s.exec('market');
  assert.match(m0, /Core Companions \(Week 0 free draft/);
  assert.match(m0, /\[orc\]/);

  // build armourer populates stock via buildRoom
  s.exec('build armourer');
  assert.ok(s.run.armourerStock.length > 0, 'play-text build armourer populates armourerStock via buildRoom');

  // After Week 0, Market switches to recruit-companion and command succeeds
  s.exec('draft orc');
  s.exec('end-week');
  const m1 = s.exec('market');
  assert.match(m1, /recruit-companion <coreId>/);
  const recOut = s.exec('recruit-companion basa');
  assert.match(recOut, /Recruited Tarek/);
  assert.ok(s.run.roster.some((x) => x.coreId === 'basa'));

  // Overtrain warning on end-week (bypassable with --force)
  const orc = s.run.roster.find((x) => x.coreId === 'orc');
  orc.stress = STRESS.overtrained - 5;
  s.exec(`job ${orc.id} trainPower`);
  const weekBefore = s.run.week;
  const warn = s.exec('end-week');
  assert.match(warn, /Warning: ending the week will overtrain/);
  assert.equal(s.run.week, weekBefore, 'end-week stops on overtrain warning without --force');
  s.exec('end-week --force');
  assert.equal(s.run.week, weekBefore + 1, 'end-week --force advances past overtrain warning');
});

test('8.0.1: the demand names its sender the same way on the page and in the text client', () => {
  const s = createSession(1, { oddsSamples: 20 });
  for (const t of [2, 3, 4]) s.run.arenas[t] = { ...s.run.arenas[1], tier: t, stage: 0 };
  s.run.demand = { id: 'topWin', week: s.run.week };
  for (const [tier, name] of [[1, 'The Palatine'], [3, 'The Palatine'], [4, 'The Emperor']]) {
    s.run.topTier = tier;
    assert.equal(demandSender(s.run), name);
    assert.match(ludusTab(s.run, () => ({ win: 0.5, injury: 0.2, death: 0 })), new RegExp(`<b>${name} demands:</b>`), `page banner at tier ${tier}`);
    assert.match(s.exec('look'), new RegExp(`${name.toUpperCase()} DEMANDS`), `text client at tier ${tier}`);
  }
});

test('8.0.1: both clients read bracket-leg odds options from the engine, and neither keeps its own copy', () => {
  for (const file of ['src/ui/views.js', 'scripts/play-text.js']) {
    const src = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(src, /function bracketLegOptions/, `${file} has no local copy`);
    assert.match(src, /bracketLegOptions\(run, f, tier, /, `${file} calls the shared helper`);
  }
  const { run, f } = gazeBracket();
  const opp = run.arenas[3].opponent;
  const early = bracketLegOptions(run, f, 3, opp, false);
  const final = bracketLegOptions(run, f, 3, opp, true);
  assert.equal(early.earlyRound, true);
  assert.equal(final.earlyRound, false);
  assert.deepEqual({ ...early, earlyRound: false }, final, 'only the early-round flag differs between legs against the same house');
});

for (const reason of ['rounds', 'towel']) {
  test(`8.0.1: the Final's own result is not floored (${reason === 'towel' ? 'capitulating' : 'losing'}): the lock ends once the Final is under way`, () => {
    const { run, f, winLeg } = gazeBracket();
    winLeg();
    winLeg();
    f.morale = MORALE.mutinous + 2;
    assert.equal(lockedIntoBracket(run, f.id), true, 'locked while they wait for the Final');
    const m = startMatch(run, f.id, 3);
    assert.equal(lockedIntoBracket(run, f.id), false, 'the Final is being fought');
    const before = f.morale;
    m.over = true;
    m.result = { winner: 'B', reason };
    finishMatch(run, m);
    assert.equal(hasBracket(run, 3), false, 'the bracket is over');
    assert.equal(f.morale, before + (reason === 'towel' ? MORALE.towel : MORALE.loss), 'the loss costs what a loss costs');
    assert.ok(f.morale < MORALE.mutinous, 'which here leaves them Mutinous, as in 8.0.0');
  });
}

test('8.0.1: a save already stuck (Mutinous and locked into a Final) is lifted to the line on load, and nobody else is', () => {
  const { run, f, mate, winLeg } = gazeBracket();
  winLeg();
  winLeg();
  f.morale = MORALE.mutinous - 10; // 8.0.0 could save this
  mate.morale = MORALE.mutinous - 10;
  assert.match(fightBlocker(run, f.id, 3), /mutinous/);
  assert.match(withdrawBlocker(run, 3), /cannot withdraw/);

  const loaded = deserialize(serialize(run));
  const lf = loaded.roster.find((x) => x.id === f.id);
  const lm = loaded.roster.find((x) => x.id === mate.id);
  assert.equal(lf.morale, MORALE.mutinous, 'lifted to the Mutinous line');
  assert.equal(fightBlocker(loaded, lf.id, 3), null, 'so the Final can be fought and the week can end');
  assert.equal(lm.morale, MORALE.mutinous - 10, 'a Mutinous fighter with a way out is left as saved');
  assert.equal(deserialize(serialize(loaded)).roster.find((x) => x.id === f.id).morale, MORALE.mutinous, 'loading again changes nothing');
});

test('8.0.1: a demand keeps the sender it was issued by when the house reaches the Imperial Coliseum that fight day', () => {
  let run = null;
  for (let seed = 1; seed <= 200 && !run?.demand; seed++) {
    run = createRun(seed);
    run.week = DEMAND.fromWeek;
    issueDemand(run);
  }
  assert.ok(run.demand, 'a demand was issued through the engine');
  assert.equal(run.demand.tier, 1);
  assert.match(run.log.at(-1).text, /^The Palatine demands: /);
  run.topTier = 4;
  assert.equal(demandSender(run), 'The Palatine', 'still the Palatine docket');
  judgeDemand(run);
  assert.equal(run.demandResult.tier, 1, 'and the result remembers who asked');
  assert.equal(demandSender(run), 'The Emperor', 'the next demand comes from the Emperor');
});
