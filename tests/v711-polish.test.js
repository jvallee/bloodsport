// 7.11.0 (from an independent review of 7.10.0): bug fixes, factual accuracy, Word in the city, fighter last words,
// Level-3 backstories, spared-opponent callbacks, the prefect's posture. (The review's interface overhaul is not in 7.11.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { PLOT, COUSIN, MORALE, UNREST, HUMORS } from '../src/data.js';
import {
  createRun, recruit, createFighter, advanceToTournament, startMatch, finishMatch,
  choosePerk, freeFightDay, crownChampion, moraleState, cousinWeek, resolveMercy,
  risingProgress, checkQuests, checkBackstories, answerSummons, serialize, deserialize,
} from '../src/run.js';
import { betray, resolveCoup } from '../src/run/plotEngine.js';
import { lastWordsFor, backstoryScene, prefectPosture } from '../src/voices.js';
import { cityHeadlines } from '../src/gazette.js';
import { nextHint } from '../src/hints.js';
import { STEPS } from '../src/tutorial.js';
import { ENTRIES } from '../src/codex.js';
import { freeFightModal, ludusTab } from '../src/ui/views.js';
import { fightView } from '../src/ui/fightView.js';
import { createSession } from '../scripts/play-text.js';

function prepFightDay(seed = 10) {
  const run = createRun(seed);
  run.gold = 100;
  run.prestige = 30;
  run.topTier = 2;
  run.arenas[2] = { stage: 0, opponent: createFighter(createRng(seed + 1), { id: 'o2', power: 6 }), debuff: null, conquered: false };
  recruit(run, run.market[0].id);
  recruit(run, run.market[0].id);
  const [a, b] = run.roster;
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  advanceToTournament(run);
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  run.bouts = { 1: 'open', 2: 'done' };
  run.boutPending = false;
  return { run, a, b };
}

test('freeFightDay ignores injured fighters and lower-arena Champions, keeping healthy rookies', () => {
  const { run, a, b } = prepFightDay(11);
  a.injuries = [{ tag: 'fleshWound', weight: 1, weeksLeft: 2 }];
  crownChampion(b, 1);
  assert.equal(freeFightDay(run), null, 'injured fighter + lower-arena Champion should not trigger freeFightDay');
  a.injuries = [{ tag: 'distracted', weight: 0, weeksLeft: 1 }];
  const free = freeFightDay(run);
  assert.deepEqual(free.tiers, [1]);
  assert.deepEqual(free.fighters.map((f) => f.id), [a.id]);
});

test('freeFightModal formats 1, 2, and 3+ arenas with proper comma-and grammar and verb', () => {
  const f1 = { name: 'Kroth' };
  const f2 = { name: 'Varia' };
  const one = freeFightModal({ fighters: [f1], tiers: [1] });
  assert.match(one, /<b>Kroth<\/b> could fight in The Dirt Pits, and hasn't fought yet\./);
  const three = freeFightModal({ fighters: [f1, f2], tiers: [1, 2, 3] });
  assert.match(three, /<b>Kroth<\/b> and <b>Varia<\/b> could fight in The Dirt Pits, The Bronze Arena and The Silver Coliseum, and they haven't fought yet\./);
  assert.doesNotMatch(three, /and The Bronze Arena and/);
});

test('Mutinous copy in roster, hints, and tutorial never advises winning a fight to calm a fighter who refuses to fight', () => {
  const f = createFighter(createRng(1), { id: 'f1' });
  f.morale = MORALE.mutinous - 5;
  assert.doesNotMatch(moraleState(f).desc, /\bwins?\b/i);
  const run = createRun(12);
  const r = recruit(run, run.market[0].id);
  r.morale = MORALE.mutinous - 5;
  assert.doesNotMatch(nextHint(run).text, /or a win/i);
  const step = STEPS.find((s) => s.id === 'mutinous');
  assert.doesNotMatch(step.body, /or a win/i);
});

test('Codex and tutorial factual accuracy fixes (Blinded, Humour, Melancholic scar rate, Apothecary, Ornitharius, Fortune)', () => {
  const byKey = (k) => ENTRIES.find((e) => e.key === k);
  assert.match(byKey('basics:deathGate').rules, /Blinded/);
  assert.match(byKey('basics:tactics').rules, /Humour/);
  assert.doesNotMatch(byKey('basics:tactics').rules, /\bhumor\b/);
  assert.match(byKey('basics:scars').rules, /quarter of the time/);
  assert.doesNotMatch(byKey('basics:scars').rules, /half the time/);
  assert.match(byKey('basics:items').rules, /Viper Venom.*Smelling Salts/s);
  assert.doesNotMatch(byKey('class:ornitharius').lore, /once their master is hurt/i);
  const fortune = STEPS.find((s) => s.id === 'fortune');
  assert.match(fortune.body, /three times/i);
  assert.doesNotMatch(fortune.body, /spin again once/i);
});

test('cousinWeek never picks a Revenant or active mole as the asker', () => {
  const run = createRun(13);
  run.topTier = COUSIN.fromTier;
  const rev = createFighter(createRng(2), { id: 'frev', kind: 'revenant' });
  const mole = createFighter(createRng(3), { id: 'fmole' });
  mole.mole = { by: 'palace', planted: 0 };
  run.roster = [rev, mole];
  cousinWeek(run);
  assert.equal(run.cousin.asker, null, 'falls back to steward when only Revenant and mole are in roster');
  const run2 = createRun(14);
  run2.topTier = COUSIN.fromTier;
  const clean = createFighter(createRng(4), { id: 'fclean' });
  run2.roster = [rev, mole, clean];
  cousinWeek(run2);
  assert.equal(run2.cousin.asker, clean.id, 'skips Revenant and mole to pick clean living fighter');
});

test('betray and resolveCoup cousin epilogue callbacks handle living, champion, fallen, and steward cases', () => {
  const runSteward = createRun(20);
  const cousin = createFighter(createRng(5), { id: 'fc' });
  cousin.political = { cell: 'scribe' };
  runSteward.roster = [cousin];
  runSteward.plot = { stage: 'cause', trust: 5, suspicion: 40, refusals: 0, seen: [], cells: ['scribe'], champion: null, freed: [], nextAt: 99, ended: null };
  runSteward.cousin = { asker: null, done: 'saved', f: cousin.id, name: cousin.name };
  betray(runSteward);
  assert.match(runSteward.epilogue.join(' '), /woman from the gate/);
  assert.doesNotMatch(runSteward.epilogue.join(' '), /fighter who begged/);

  const runAsker = createRun(21);
  const asker = createFighter(createRng(6), { id: 'fa' });
  const c2 = createFighter(createRng(7), { id: 'fc2', takenNames: [asker.name] });
  c2.political = { cell: 'courier' };
  runAsker.roster = [asker, c2];
  runAsker.plot = { stage: 'cause', trust: 5, suspicion: 40, refusals: 0, seen: [], cells: ['courier'], champion: null, freed: [], nextAt: 99, ended: null };
  runAsker.cousin = { asker: asker.id, done: 'saved', f: c2.id, name: c2.name };
  betray(runAsker);
  assert.match(runAsker.epilogue.join(' '), new RegExp(`${asker.name}, who begged you for his life`));

  const runChamp = createRun(22);
  const cc = createFighter(createRng(8), { id: 'fcc' });
  cc.political = { cell: 'officer' };
  runChamp.roster = [cc];
  runChamp.plot = { stage: 'ready', trust: 8, suspicion: 20, refusals: 0, seen: [], cells: ['officer'], champion: cc.id, freed: [], nextAt: 99, ended: null };
  runChamp.cousin = { asker: null, done: 'saved', f: cc.id, name: cc.name };
  resolveCoup(runChamp, cc, true, true);
  assert.match(runChamp.epilogue.join(' '), /was the one who climbed into the imperial box/);
  assert.doesNotMatch(runChamp.epilogue.join(' '), /first over the rail/);

  const runDead = createRun(23);
  const hero = createFighter(createRng(9), { id: 'fh' });
  const fallenCousin = createFighter(createRng(10), { id: 'fcd', takenNames: [hero.name] });
  runDead.roster = [hero];
  runDead.fallen = [fallenCousin];
  runDead.plot = { stage: 'ready', trust: 8, suspicion: 20, refusals: 0, seen: [], cells: ['priest'], champion: hero.id, freed: [], nextAt: 99, ended: null };
  runDead.cousin = { asker: null, done: 'saved', f: fallenCousin.id, name: fallenCousin.name };
  resolveCoup(runDead, hero, true, true);
  assert.match(runDead.epilogue.join(' '), /raised a cup.*who did not live to see it/);
});

test('summons capitulation uses "capitulated" in player-facing log and chronicle', () => {
  const run = createRun(30);
  run.gold = 100;
  const f = recruit(run, run.market[0].id);
  f.power = 2;
  f.injuries = [{ tag: 'fleshWound', weight: 1, weeksLeft: 2 }, { tag: 'concussed', weight: 1, weeksLeft: 2 }];
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  advanceToTournament(run);
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  run.summons = { week: run.week };
  const s = answerSummons(run, f.id, 'yield');
  assert.equal(s.reason, 'towel');
  const recentLog = run.log.at(-1).text;
  assert.match(recentLog, /capitulated at the Death Gate/);
  assert.doesNotMatch(recentLog, /yielded/);
  assert.match(f.story.at(-1).text, /capitulated to/);
});

test('lastWordsFor picks contextual last words (champion, political, revenant, bondmate, titled, kind+humour) and fightView renders them', () => {
  const run = createRun(40);
  const f = recruit(run, run.market[0].id);
  f.kind = 'orc';
  f.humor = 'choleric';
  assert.match(lastWordsFor(run, f), /ancestors/i);
  run.gold = 100;
  const mate = recruit(run, run.market[0].id);
  f.bond = { id: mate.id, name: mate.name };
  assert.match(lastWordsFor(run, f), new RegExp(mate.name));
  f.kind = 'revenant';
  assert.match(lastWordsFor(run, f), /forge|brass/i);
  f.political = { cell: 'scribe' };
  assert.match(lastWordsFor(run, f), /chalk|ledger/i);
  run.plot = { champion: f.id, ended: null };
  assert.match(lastWordsFor(run, f), /box|chain/i);

  const run2 = createRun(41);
  const fighter = recruit(run2, run2.market[0].id);
  for (const x of run2.roster) while (x.pendingPerks.length) choosePerk(run2, x.id, x.pendingPerks[0][0]);
  advanceToTournament(run2);
  for (const x of run2.roster) while (x.pendingPerks.length) choosePerk(run2, x.id, x.pendingPerks[0][0]);
  const m = startMatch(run2, fighter.id, 1);
  m.over = true;
  m.round = 2;
  m.result = { winner: 'B', reason: 'death' };
  m.a.f.alive = false;
  m.summary = finishMatch(run2, m);
  assert.ok(m.summary.lastWords && m.summary.lastWords.length > 8);
  const html = fightView(m, { animateRound: 0, showMath: false }, { name: 'The Dirt Pits', tier: 1 });
  assert.match(html, /class="last-words"[^]*class="eulogy"/);
});

test('Level-3 fighter backstories fire once per fighter, skip Revenants and repeat kinds, cap at 2 per career, and include player replies', () => {
  const run = createRun(50);
  run.gold = 200;
  const f1 = createFighter(createRng(51), { id: 'fb1', kind: 'human' });
  const f1Dup = createFighter(createRng(55), { id: 'fb1b', kind: 'human' });
  const f2 = createFighter(createRng(52), { id: 'fb2', kind: 'android' });
  const f3 = createFighter(createRng(53), { id: 'fb3', kind: 'elf' });
  const rev = createFighter(createRng(54), { id: 'fbrev', kind: 'revenant' });
  for (const x of [f1, f1Dup, f2, f3, rev]) { x.level = 3; x.trained = 1; }
  run.roster = [rev, f1, f1Dup, f2, f3];
  checkQuests(run);
  assert.deepEqual(run.backstories, ['fb1'], 'skips Revenant and triggers first living Level-3 fighter');
  const t1 = run.talk.find((t) => t.key === 'backstory-fb1');
  assert.ok(t1, 'talk scene queued');
  assert.equal(t1.beats.at(-1).replies.length, 2, 'backstory ends with 2 player replies');
  assert.ok(f1.story.some((e) => /lower aqueduct wards of Palatina/i.test(e.text)), 'logs 1-line memory to fighter Story');
  checkBackstories(run);
  assert.deepEqual(run.backstories, ['fb1', 'fb2'], 'skips second Human and triggers Android instead');
  checkBackstories(run);
  assert.deepEqual(run.backstories, ['fb1', 'fb2'], 'caps at 2 backstories per career');
  for (const kind of ['human', 'android', 'elf', 'orc', 'vampire', 'basa']) {
    for (const humor of Object.keys(HUMORS)) {
      const s = backstoryScene({ id: `t-${kind}`, name: 'Test', kind, humor });
      assert.ok(s?.beats.length === 3 && s.beats[2].replies.length === 2 && s.memory, `${kind}/${humor}`);
    }
  }
  assert.equal(backstoryScene({ id: 'tr', name: 'Dead', kind: 'revenant' }), null);
});

test('resolveMercy spare records run.spared, surfaces in cityHeadlines and Coup epilogue, and survives save/load', () => {
  const run = createRun(60);
  const f = recruit(run, run.market[0].id);
  run.history.push({ week: run.week, tier: 1, name: 'Test', won: true, fighter: f.name, fighterId: f.id });
  run.mercy = { fighterId: f.id, opp: 'Cassian', house: run.houses[0].id, crowd: 'spare', tier: 1, top: true, at: 0 };
  resolveMercy(run, 'spare');
  assert.equal(run.spared.length, 1);
  assert.equal(run.spared[0].name, 'Cassian');
  const back = deserialize(serialize(run));
  assert.deepEqual(back.spared, run.spared);
  const headlines = cityHeadlines(run, 5);
  assert.ok(headlines.some((h) => h.text.includes('Cassian')), 'spared opponent appears in Word in the city');
  run.plot = { stage: 'ready', trust: 8, suspicion: 10, refusals: 0, seen: [], cells: ['officer'], champion: f.id, freed: [], nextAt: 99, ended: null };
  resolveCoup(run, f, true, true);
  assert.match(run.epilogue.join(' '), /Cassian.*unlocked the tunnel gate/);
});

test('cityHeadlines reacts to state without mutating run or touching RNG, and renders in Ludus and play-text', () => {
  const run = createRun(70);
  const snap = serialize(run);
  const h1 = cityHeadlines(run);
  assert.ok(h1.length >= 2 && h1.length <= 3, 'returns 2-3 headlines at start');
  assert.ok(h1.some((h) => h.tag === 'opening1') && h1.some((h) => h.tag === 'opening2'), 'Month 1 opens with Battleworld atmosphere');
  assert.equal(serialize(run), snap, 'cityHeadlines is strictly pure');
  run.policies = [{ id: 'edictOfMercy', until: run.week + 8 }];
  assert.ok(cityHeadlines(run, 5).some((h) => h.tag === 'policy' && h.text.includes('Edict of Mercy')), 'renders real Senate policy name (never undefined)');
  run.unrest = UNREST.warn;
  run.plot = { stage: 'favours', trust: 2, suspicion: PLOT.suspicion.cold, refusals: 0, seen: [], cells: ['scribe'], champion: null, freed: [], nextAt: 99, ended: null };
  run.buildings.push({ id: 'bg', type: 'gallery', level: 1 });
  const h2 = cityHeadlines(run);
  assert.ok(h2.some((h) => h.tag === 'plot' && /report/i.test(h.text)));
  assert.ok(h2.some((h) => h.tag === 'unrest'));
  const rp = risingProgress(run);
  assert.equal(rp.prefect, 'Writing his report');
  assert.equal(prefectPosture(0), 'Unbothered');
  assert.equal(prefectPosture(PLOT.suspicion.raid), 'Signing the dawn warrant');
  const ludusHtml = ludusTab(run, () => ({ win: 0.5, injury: 0.2, death: 0.01 }));
  assert.match(ludusHtml, /Word in the city/);
  assert.match(ludusHtml, /Prefect Aulus Crassinus: <b>Writing his report<\/b>/);
  const session = createSession(71);
  assert.match(session.exec('look'), /-- Word in the city --/);
  session.run.unrest = 5;
  assert.match(session.exec('look'), /Unrest 5\/8/);
  session.run.buildings.push({ id: 'bg', type: 'gallery', level: 1 });
  session.run.plot = { stage: 'cause', trust: 4, suspicion: PLOT.suspicion.informer, refusals: 0, seen: [], cells: ['scribe'], champion: null, freed: [], nextAt: 99, ended: null };
  assert.match(session.exec('quests'), /Prefect Aulus Crassinus: Dining with your neighbours/);
});
