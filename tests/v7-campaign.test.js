// Version 7 campaign, persistence, legacy, digest, event, and game-action dispatch tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SAVE_VERSION, GRAND_TIER, createRun, recruit, recruitBlocker, recruitPrice, cheapestRecruitPrice,
  release, releaseBlocker, retire, retireBlocker, setJob, stewardPlan, advanceWeek, advanceToTournament,
  startMatch, finishMatch, recordMatchProgress, skipBout, skipBlocker, forfeitBlocker, withdraw, withdrawBlocker,
  fightBlocker, buyDecor, assignDecor, buyGear, equip, buyItem, buildRoom, upgradeRoom,
  chooseEvent, eventChoiceBlocker, chooseFortune, passFortune, mercyBlocker, resolveMercy,
  summonsBlocker, answerSummons, refuseSummonsBlocker, payTribute, tributeDue, host, enact,
  reanimate, powerParts, effectivePower, purseGold, stewardGold, summonsPower, bracketInfo,
  serialize, deserialize, validateRun, migrateV2ToV3, migrateV3ToV4, arenaPower, bossLossFavor,
  boutFor, hasBracket,
} from '../src/run.js';
import {
  STRESS, TRAINING, BRACKET, SUMMONS, PLOT, RETIRE, PRESTIGE_LEVELS, FAVOR, TRIBUTE, SHORT, CIRCUITS,
  FORTUNE, GEAR,
} from '../src/data.js';
import { BOONS } from '../src/fortune.js';
import { EVENT_BY_ID, EVENT_CHANCE } from '../src/events.js';
import { STEWARD_TASKS } from '../src/quests.js';
import { trainCost, buildBlocker, upgradeBlocker } from '../src/ludus.js';
import { createLegacy, careerXp, bestFighter, recordCareer, recordLegends } from '../src/legacy.js';
import { snapshot, monthDigest } from '../src/digest.js';
import { exportSave, importSave } from '../src/savefile.js';
import { nextFestival, isTournamentWeek, isWinter, dateOf } from '../src/calendar.js';
import { applyGameAction } from '../src/game.js';
import { playRound, throwTowel } from '../src/fight.js';
import { REAL_EVENT_CHANCE } from './setup.js';

function bracketRun(seed = 1, tier = 3) {
  const run = createRun(seed);
  run.gold = 200;
  run.prestige = 200;
  run.prestigeLevel = 5;
  const f = recruit(run, run.market[0].id);
  f.power = 25;
  f.level = 5;
  for (let t = 2; t <= tier; t++) {
    run.topTier = t;
    run.arenas[t] = { tier: t, stage: 0, debuff: 'rainyMud', opponent: structuredClone(run.arenas[1].opponent), conquered: false, rival: null };
  }
  advanceToTournament(run);
  return { run, f };
}

test('#6.1 mid-bracket release/retire are blocked and withdrawBlocker guards missing fighter', () => {
  const { run, f } = bracketRun(1, 3);
  const m = startMatch(run, f.id, 3);
  m.over = true;
  m.result = { winner: 'A', reason: 'points' };
  finishMatch(run, m); // QF won -> now mid-bracket (round 1)
  assert.equal(run.brackets[3].round, 1);
  assert.match(releaseBlocker(run, f.id), /mid-bracket/);
  assert.match(retireBlocker(run, f.id), /mid-bracket/);
  assert.equal(withdrawBlocker(run, 3), null);
  // Corrupted missing fighter check
  const savedRoster = run.roster;
  run.roster = [];
  assert.match(withdrawBlocker(run, 3), /No such fighter/);
  run.roster = savedRoster;
  withdraw(run, 3);
  assert.equal(releaseBlocker(run, f.id), null);
});

test('#6.2 migrateV2ToV3 works at topTier >= 2 without pre-existing houses or rng.houses', () => {
  const base = createRun(7);
  recruit(base, base.market[0].id);
  const v2 = JSON.parse(serialize(base));
  Object.assign(v2, { version: 2, tier: 3, stage: 1, grand: false, debuff: 'rainyMud', opponent: v2.arenas[1].opponent, strikes: 1, matchFighterId: null });
  for (const k of ['arenas', 'topTier', 'favor', 'inventory', 'armourerStock', 'revoltWeeks', 'matchInfo', 'bouts', 'houses', 'glory', 'liaisonOffers']) delete v2[k];
  delete v2.rng.houses;
  delete v2.rng.growth;
  delete v2.rng.plot;
  const loaded = deserialize(JSON.stringify(v2));
  assert.equal(loaded.version, SAVE_VERSION);
  assert.equal(loaded.topTier, 3);
  assert.ok(Array.isArray(loaded.houses) && loaded.houses.length > 0);
  assert.deepEqual(Object.keys(loaded.arenas), ['1', '2', '3']);
  assert.equal(loaded.arenas[1].conquered, true);
  assert.equal(loaded.arenas[2].conquered, true);
});

test('#6.3 mid-match reload handles dead Blood Faith Orc and missing fighter cleanly', () => {
  const run = createRun(2);
  const orc = run.market.find((x) => x.kind === 'orc');
  const f = recruit(run, orc.id);
  f.kindTrait = 'bloodFaith';
  advanceToTournament(run);
  const m = startMatch(run, f.id);
  m.round = 2;
  m.a.f.alive = false;
  m.a.disabled = [];
  recordMatchProgress(run, m);
  const loaded = deserialize(serialize(run));
  assert.equal(loaded.inMatch, false);
  assert.equal(loaded.roster.length, 0);
  assert.equal(loaded.fallen.length, 1);
  assert.equal(loaded.history.at(-1).bloodFaith, true);

  // Missing fighter in matchInfo clears inMatch cleanly
  const run2 = createRun(3);
  const f2 = recruit(run2, run2.market[0].id);
  advanceToTournament(run2);
  startMatch(run2, f2.id);
  run2.roster = [];
  const loaded2 = deserialize(serialize(run2));
  assert.equal(loaded2.inMatch, false);
  assert.equal(loaded2.matchInfo, null);
});

test('#6.4 skipBout advances straight to Boss in a short career', () => {
  const run = createRun(4, { short: true });
  recruit(run, run.market[0].id);
  advanceToTournament(run);
  assert.equal(run.arenas[1].stage, 0);
  skipBout(run);
  assert.equal(run.arenas[1].stage, 2);
});

test('#6.5 recruitDiscount applies to Liaison offers and cheapestRecruitPrice protects checkLoss', () => {
  const run = createRun(5);
  run.gold = 50;
  run.prestigeLevel = 5;
  buildRoom(run, 'liaison');
  run.relics.push('ledger'); // recruitDiscount: 2
  const offer = run.liaisonOffers[0];
  assert.ok(offer);
  const discounted = recruitPrice(run, offer);
  assert.equal(discounted, Math.max(1, offer.price - 2));
  run.gold = discounted;
  assert.equal(recruitBlocker(run, offer.id), null);
  recruit(run, offer.id);
  assert.equal(run.gold, 0);

  // Bankruptcy check respects discount (cheapestRecruitPrice)
  const run2 = createRun(6);
  run2.relics.push('ledger');
  run2.roster = [];
  run2.gold = cheapestRecruitPrice(run2);
  assert.ok(run2.gold < run2.market[0].price || run2.gold === 1);
  advanceWeek(run2);
  assert.equal(run2.status, 'active');
});

test('#6.6 returning Hall legend must win once before retiring and never clones in Hall of Champions', () => {
  const legend = { name: 'Aurelia', kind: 'human', humor: 'bold', id: 'f9', cls: 'fighter', power: 15, titles: ['Champion of the Dirt Pits'], kills: 2, renown: 10, level: 5, wins: 6, seed: 99 };
  const legacy = createLegacy();
  legacy.hall.push(legend);
  const run = createRun(10, { unlocks: ['legends'], legends: [legend] });
  const f = recruit(run, run.market[0].id);
  Object.assign(f, { returned: 'legend:99:f9', carried: { kills: 2, titles: 1 }, titles: ['Champion of the Dirt Pits'], level: 5 });
  assert.match(retireBlocker(run, f.id), /win at least one bout/);
  run.history.push({ won: true, fighterId: f.id });
  assert.equal(retireBlocker(run, f.id), null);
  retire(run, f.id);
  const added = recordLegends(legacy, run);
  assert.deepEqual(added, []);
  assert.equal(legacy.hall.length, 1);
});

test('#6.8 reanimate strips spy, body, want, resume, notice from raised Revenants', () => {
  const run = createRun(11);
  run.gold = 100;
  run.prestigeLevel = 5;
  buildRoom(run, 'vulcan');
  const f = recruit(run, run.market[0].id);
  run.roster = [];
  run.fallen.push({ ...f, alive: false, diedWeek: run.week, body: true, spy: true, want: { id: 'room' }, resume: 'trainPower', notice: 'old' });
  const rev = reanimate(run, f.id);
  for (const k of ['spy', 'body', 'want', 'resume', 'notice', 'diedWeek', 'raised']) {
    assert.equal(rev[k], undefined, `stale key ${k} removed`);
  }
});

test('#6.9 modal blockers guard events/mercy/fights/builds, and coup/emperorsGaze withdrawal is handled safely', () => {
  const run = createRun(12);
  run.gold = 100;
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  run.event = { id: 'spy' };
  assert.match(fightBlocker(run, f.id), /event/i);
  assert.match(skipBlocker(run), /event/i);
  run.arenas[1].stage = 2;
  assert.match(forfeitBlocker(run), /event/i);
  run.summons = { week: run.week };
  assert.match(summonsBlocker(run, f.id, 'yield'), /event/i);
  assert.match(refuseSummonsBlocker(run), /event/i);
  run.mercy = { fighterId: f.id, opp: 'X', crowd: 'kill', tier: 1, top: true, at: 0 };
  assert.match(eventChoiceBlocker(run, 0), /fate/);
  assert.match(buildBlocker(run, 'oracle'), /fate/);
  assert.match(upgradeBlocker(run, run.buildings[0].id), /fate/);
  run.status = 'lost';
  assert.match(mercyBlocker(run, 'spare'), /over/);

  // Withdraw blocked on emperorsGaze Final & coup Final; QF withdrawal postpones coup instead of martyr
  const { run: gr, f: champ } = bracketRun(13, GRAND_TIER);
  gr.plot = { stage: 'ready', trust: 10, suspicion: 20, refusals: 0, seen: ['coupEve'], cells: [], champion: champ.id, freed: [], nextAt: 99, ended: null, coup: true, debuffBefore: 'rainyMud' };
  gr.arenas[GRAND_TIER].debuff = 'emperorsGaze';
  gr.brackets[GRAND_TIER].fighterId = champ.id;
  gr.brackets[GRAND_TIER].round = 2;
  assert.match(withdrawBlocker(gr, GRAND_TIER), /Emperor's Gaze|cannot withdraw/);
  gr.arenas[GRAND_TIER].debuff = 'rainyMud';
  assert.match(withdrawBlocker(gr, GRAND_TIER), /rising is set/);
  gr.brackets[GRAND_TIER].round = 1; // SF: living withdrawal postpones coup
  withdraw(gr, GRAND_TIER);
  assert.equal(gr.status, 'active');
  assert.equal(gr.ending, undefined);
  assert.equal(gr.plot.coup, false);
});

test('#6.10 removeFighter returns gear+decor and downgrades ready plot; armBarracks takes cheapest gear', () => {
  const run = createRun(14);
  run.gold = 100;
  const f = recruit(run, run.market[0].id);
  buyDecor(run, 'bird');
  assignDecor(run, f.id, 'bird');
  f.gear.weapon = 'ironGladius';
  run.plot = { stage: 'ready', trust: 10, suspicion: 10, refusals: 0, seen: [], cells: [], champion: f.id, freed: [], nextAt: 99, ended: null };
  release(run, f.id);
  assert.equal(run.inventory.decor.bird, 1);
  assert.ok(run.inventory.gear.includes('ironGladius'));
  assert.equal(run.plot.champion, null);
  assert.equal(run.plot.stage, 'cause');

  // armBarracks hands over cheapest gear first
  const run2 = createRun(15);
  const f2 = recruit(run2, run2.market[0].id);
  run2.plot = { stage: 'cause', trust: 5, suspicion: 0, refusals: 0, seen: [], cells: [], champion: null, freed: [], nextAt: 99, ended: null };
  const expensive = Object.keys(GEAR).sort((a, b) => GEAR[b].price - GEAR[a].price)[0];
  const cheap = Object.keys(GEAR).sort((a, b) => GEAR[a].price - GEAR[b].price)[0];
  run2.inventory.gear = [expensive, cheap, cheap];
  run2.event = { id: 'armBarracks', plot: true, f: f2.id };
  chooseEvent(run2, 1);
  assert.deepEqual(run2.inventory.gear, [expensive]);
});

test('#6.11 addPrestige advances prestigeLevel on retirement and Prestige Fortune boon', () => {
  const run = createRun(16);
  const f = recruit(run, run.market[0].id);
  f.level = RETIRE.level;
  run.prestige = PRESTIGE_LEVELS[1].at - 1;
  run.prestigeLevel = 1;
  retire(run, f.id);
  assert.ok(run.prestigeLevel >= 2);

  const run2 = createRun(17);
  run2.prestige = PRESTIGE_LEVELS[1].at - 1;
  run2.prestigeLevel = 1;
  run2.fortune = { cards: [{ kind: 'boon', id: 'prestige', rarity: 'rare', prestige: 5 }], rerolls: 0 };
  chooseFortune(run2, 0);
  assert.ok(run2.prestigeLevel >= 2);
});

test('#6.12 unpaid Fates Wager costs Favour and lowerTribute only discounts a single year', () => {
  const run = createRun(18);
  recruit(run, run.market[0].id);
  advanceToTournament(run);
  run.favor = 50;
  run.wager = { winGold: 10, winRenown: 2, lossGold: 10 };
  skipBout(run);
  run.gold = 2; // shortfall = 8 -> -4 Favour
  advanceWeek(run);
  assert.equal(run.gold, 0);
  assert.equal(run.favor, 46);

  // lowerTribute single-year stamp
  const run2 = createRun(19);
  run2.gold = 200;
  run2.prestigeLevel = 5;
  buildRoom(run2, 'lounge');
  run2.influence = 10;
  run2.week = 38; // Autumn Year 1 (winter starts week 40)
  enact(run2, 'lowerTribute');
  const y1Discounted = Math.round(TRIBUTE.perYear * 1 * 0.7);
  assert.equal(tributeDue(run2), y1Discounted);
  payTribute(run2);
  run2.week = 41; // Winter Year 1 -> tributeYear is now Year 2, policy still active until week 54
  assert.equal(tributeDue(run2), TRIBUTE.perYear * 2, 'Year 2 must not be discounted by the same policy');
});

test('#6.13 Medbay is vacated immediately when healer event or boon heals the last wound', () => {
  const run = createRun(20);
  run.gold = 50;
  const f = recruit(run, run.market[0].id);
  f.injuries = [{ tag: 'fleshWound', weight: 1, weeksLeft: 1 }];
  setJob(run, f.id, 'medbay');
  run.event = { id: 'healer', f: f.id };
  chooseEvent(run, 1);
  assert.equal(f.injuries.length, 0);
  assert.equal(f.job, 'rest');

  f.injuries = [{ tag: 'fleshWound', weight: 1, weeksLeft: 1 }];
  setJob(run, f.id, 'medbay');
  run.fortune = { cards: [{ kind: 'boon', id: 'surgeon', rarity: 'rare' }], rerolls: 0 };
  chooseFortune(run, 0);
  assert.equal(f.injuries.length, 0);
  assert.equal(f.job, 'rest');
});

test('#6.14 stewardPlan and advanceToTournament use net training stress (decorCalm + stressRelief)', () => {
  const run = createRun(21);
  run.gold = 100;
  const f = recruit(run, run.market[0].id);
  buyDecor(run, 'bird');
  assignDecor(run, f.id, 'bird'); // -5 calm -> netTrainStress = 25 - 5 = 20
  f.stress = STRESS.overtrained - 25; // raw +25 would hit 50, but net +20 reaches 45 (< 50)
  stewardPlan(run);
  assert.equal(f.job, 'trainPower');
  advanceToTournament(run);
  assert.ok(f.trained >= 1, 'trained instead of prematurely switching to Rest');
});

test('#6.15 save v4 validation, log cap 400, importSave guard, and recordCareer dedup beyond 10 past careers', () => {
  assert.equal(SAVE_VERSION, 7);
  assert.throws(() => deserialize('{bad json'), /corrupted/);
  assert.throws(() => deserialize('[]'), /corrupted/);
  assert.throws(() => deserialize(JSON.stringify({ version: 1 })), /older version/);
  assert.throws(() => deserialize(JSON.stringify({ version: SAVE_VERSION + 1 })), /newer version/);
  assert.throws(() => deserialize(JSON.stringify({ version: 3 })), /incomplete or corrupted/);
  assert.throws(() => deserialize(JSON.stringify({ version: 4 })), /incomplete or corrupted/);
  assert.throws(() => deserialize(JSON.stringify({ version: 5 })), /incomplete or corrupted/);
  assert.throws(() => importSave(JSON.stringify({ kind: 'bloodsport-save', career: 'bad' })), /not a Blood and Circus save/);

  // v3 migration upgrades cleanly to v4 and caps oversized log
  const run = createRun(22);
  const v3 = JSON.parse(serialize(run));
  v3.version = 3;
  v3.log = Array.from({ length: 650 }, (_, i) => ({ week: i, text: `line ${i}`, tone: 'info' }));
  const loaded = deserialize(JSON.stringify(v3));
  assert.equal(loaded.version, SAVE_VERSION);
  assert.equal(loaded.log.length, 400);
  assert.equal(loaded.log.at(-1).text, 'line 649');

  // recordCareer dedupes beyond 10 past entries, and allows distinct careers on same seed/week
  const legacy = createLegacy();
  const first = createRun(100);
  first.status = 'lost';
  first.endReason = 'Executed.';
  assert.ok(recordCareer(legacy, first));
  for (let i = 1; i <= 12; i++) {
    const other = createRun(200 + i);
    other.status = 'lost';
    other.endReason = `Loss ${i}`;
    assert.ok(recordCareer(legacy, other));
  }
  assert.equal(legacy.past.length, 10);
  assert.equal(recordCareer(legacy, first), null, 'already recorded even after leaving past.slice(0,10)');
  const retrySameSeed = createRun(100);
  retrySameSeed.status = 'won';
  retrySameSeed.endReason = 'Won!';
  assert.ok(recordCareer(legacy, retrySameSeed), 'different outcome on same seed+week is recorded');
});

test('#6.16–6.17 Revenant kills are not double-counted in careerXp and bestFighter includes retired legends', () => {
  const run = createRun(23);
  const f = recruit(run, run.market[0].id);
  f.kills = 2;
  const body = { ...structuredClone(f), id: 'f_old', kills: 2, raised: true };
  f.revenantOf = body.id;
  f.kills = 3; // 2 pre-death + 1 post-raising = 3 total kills, NOT 5
  run.fallen.push(body);
  const xp = careerXp(run);
  const killLine = xp.lines.find((l) => /kill/.test(l.label));
  assert.equal(killLine.label, '3 kills');

  // bestFighter includes retired champions
  const run2 = createRun(24);
  const star = recruit(run2, run2.market[0].id);
  star.level = 5;
  star.renown = 20;
  run2.history.push({ won: true, fighterId: star.id }, { won: true, fighterId: star.id });
  retire(run2, star.id);
  const rookie = recruit(run2, run2.market[0].id);
  assert.equal(bestFighter(run2).id, star.id);
  assert.notEqual(bestFighter(run2).id, rookie.id);
});

test('#6.19–6.22 bracket opp.rebel, purseGold dice, powerParts carried titles, fortuneMonth after loss, Boss-QF 0g, summonsPower/bracketInfo', () => {
  // #6.20 purseGold subtracts Loaded Dice bonus
  assert.equal(purseGold({ gold: 25, bet: { won: true, payout: 10, dice: 3 } }), 12);

  // #6.21 powerParts with carried.titles sums cleanly to effectivePower
  const leg = createRun(25).market[0];
  leg.titles = ['Champion of the Dirt Pits', 'Champion of the Bronze Arena'];
  leg.carried = { kills: 2, titles: 2 };
  const parts = powerParts(leg);
  assert.equal(parts.reduce((s, p) => s + p.value, 0), effectivePower(leg));
  assert.equal(parts.find((p) => p.label === 'Natural').value, leg.power);

  // #6.19 finishBracketMatch handles opp.rebel
  const { run: br, f: bf } = bracketRun(26, 3);
  br.plot = { stage: 'cause', trust: 5, suspicion: 0, refusals: 0, seen: [], cells: [], champion: null, freed: [], nextAt: 99, ended: null };
  br.brackets[3].foes[0].rebel = true;
  const bm = startMatch(br, bf.id, 3);
  bm.over = true;
  bm.result = { winner: 'A', reason: 'points' };
  finishMatch(br, bm);
  assert.equal(br.plot.freed.length, 1);

  // Boss QF loss pays 0g (earlyBossLossGold)
  const { run: br2, f: bf2 } = bracketRun(27, 3);
  br2.arenas[3].stage = 2; // Boss bracket
  const bm2 = startMatch(br2, bf2.id, 3);
  bm2.over = true;
  bm2.round = 2;
  bm2.result = { winner: 'B', reason: 'points' };
  const sum = finishMatch(br2, bm2);
  assert.equal(sum.gold, BRACKET.earlyBossLossGold ?? 0);

  // #6.22 fortuneMonth does not deal cards on a career killed by unpaid tribute
  const dead = createRun(28);
  recruit(dead, dead.market[0].id);
  dead.week = 39; // advancing to week 40 triggers month start AND winter tribute collection
  dead.gold = 0;
  dead.favor = 1;
  dead.fortune = null;
  advanceWeek(dead);
  assert.equal(dead.status, 'lost');
  assert.equal(dead.fortune, null);

  // Contract C: summonsPower & bracketInfo
  const cr = createRun(29);
  assert.equal(summonsPower(cr), arenaPower(cr, SUMMONS.tier, 0));
  assert.equal(bracketInfo(cr, 1), null);
  const bi = bracketInfo(br, 3);
  assert.equal(bi.tier, 3);
  assert.equal(bi.rounds.length, 3);
  assert.equal(bi.earlyPurse, BRACKET.purse * 3);

  // Economy tuning checks
  assert.deepEqual({ gold: BOONS.gold.gold, goldPerTier: BOONS.gold.goldPerTier }, { gold: 2, goldPerTier: 3 });
  assert.ok(stewardGold(STEWARD_TASKS[0]) >= 1);
  assert.equal(stewardGold(STEWARD_TASKS.find((t) => t.id === 'grand')), 0);
});

test('#6.22 answerSummons uses rng.summons only and supports Proserpina Coin', () => {
  const run = createRun(30);
  const f = recruit(run, run.market[0].id);
  run.week = SUMMONS.fromWeek;
  run.summons = { week: run.week };
  advanceToTournament(run);
  const oppBefore = JSON.stringify(run.rng.opponents);
  const houseBefore = JSON.stringify(run.rng.houses);
  answerSummons(run, f.id, 'yield');
  assert.equal(JSON.stringify(run.rng.opponents), oppBefore, 'rng.opponents untouched');
  assert.equal(JSON.stringify(run.rng.houses), houseBefore, 'rng.houses untouched');

  // Proserpina saves a dying fighter on the Imperial sand
  let savedCount = 0;
  for (let seed = 50; seed < 90; seed++) {
    const r = createRun(seed);
    const x = recruit(r, r.market[0].id);
    r.relics.push('proserpina');
    r.week = SUMMONS.fromWeek;
    r.summons = { week: r.week };
    advanceToTournament(r);
    const s = answerSummons(r, x.id, 'death');
    if (s.saved) {
      savedCount++;
      assert.equal(s.died, false);
      assert.ok(r.roster.includes(x));
      assert.ok(!r.relics.includes('proserpina'));
      break;
    }
  }
  assert.ok(savedCount >= 1, 'Proserpina Coin rescued a summoned fighter');
});

test('#8.9 chooseEvent logs title line first, #8.11 digest multiset & speed tone, #9 §1 event cap & state guards', () => {
  // #8.9 chooseEvent log order when effect causes a level-up
  const run = createRun(31);
  const f = recruit(run, run.market[0].id);
  f.xp = 9; // +3 XP from trainer event triggers level-up log
  run.gold = 20;
  run.event = { id: 'trainer', f: f.id };
  const mark = run.log.length;
  chooseEvent(run, 0);
  assert.match(run.log[mark].text, /^A wandering lanista:/, 'event summary is first log entry');

  // #8.11 digest multiset injury diff + speed/level good tone
  const dr = createRun(32);
  const df = recruit(dr, dr.market[0].id);
  df.injuries = [
    { tag: 'fleshWound', weight: 1, weeksLeft: 1 },
    { tag: 'fleshWound', weight: 1, weeksLeft: 2 },
  ];
  const before = snapshot(dr);
  df.injuries.shift(); // 1 of 2 duplicate Flesh Wounds healed
  const lines = monthDigest(before, dr, []);
  assert.match(lines[0].text, /healed: Flesh Wound/);
  assert.equal(lines[0].tone, 'good');

  const dr2 = createRun(33);
  const df2 = recruit(dr2, dr2.market[0].id);
  const b2 = snapshot(dr2);
  df2.speed += 2;
  const l2 = monthDigest(b2, dr2, []);
  assert.equal(l2[0].tone, 'good');

  // #9 §1 event state guards: oldWound and onlookers respect resting/0-stress fighters
  const er = createRun(34);
  const ef = recruit(er, er.market[0].id);
  ef.job = 'rest';
  ef.stress = 0;
  ef.injuries = [];
  assert.equal(EVENT_BY_ID.oldWound.when(er), false);
  assert.equal(EVENT_BY_ID.onlookers.when(er), false);
  ef.job = 'trainPower';
  assert.equal(EVENT_BY_ID.oldWound.when(er), true);
  assert.equal(EVENT_BY_ID.onlookers.when(er), true);

  // #9 §1 planning-phase <=1 non-plot event per month
  const prevChance = { ...EVENT_CHANCE };
  Object.assign(EVENT_CHANCE, { season: 1, winter: 1 });
  try {
    const cr = createRun(35);
    recruit(cr, cr.market[0].id);
    recruit(cr, cr.market[0].id);
    const byMonth = new Map();
    for (let w = 0; w < 24; w++) {
      cr.boutPending = false;
      cr.bouts = null;
      for (const x of cr.roster) x.pendingPerks = [];
      if (cr.event) {
        if (!isTournamentWeek(cr.week) && !isWinter(cr.week)) {
          const m = `${dateOf(cr.week).year}-${dateOf(cr.week).month}`;
          byMonth.set(m, (byMonth.get(m) ?? 0) + 1);
        }
        const idx = EVENT_BY_ID[cr.event.id].choices.findIndex((_, i) => !eventChoiceBlocker(cr, i));
        chooseEvent(cr, idx);
      }
      advanceWeek(cr);
    }
    for (const [m, count] of byMonth) assert.ok(count <= 1, `month ${m} had ${count} planning events`);
  } finally {
    Object.assign(EVENT_CHANCE, prevChance);
  }

  // #6.22 calendar nextFestival
  assert.ok(nextFestival(0));
});

test('src/game.js applyGameAction dispatches campaign and match actions and records run.actions', () => {
  const run = createRun(40);
  run.gold = 200;
  run.prestige = 100;
  run.prestigeLevel = 4;
  const state = { run, match: null, summary: null };

  applyGameAction(state, 'recruit', { id: run.market[0].id });
  assert.equal(run.roster.length, 1);
  const f = run.roster[0];

  applyGameAction(state, 'job', { id: f.id, job: 'trainPower' });
  assert.equal(f.job, 'trainPower');

  applyGameAction(state, 'buy-decor', { item: 'bird' });
  applyGameAction(state, 'assign-decor', { id: f.id, item: 'bird' });
  assert.equal(f.decor.bird, 1);
  applyGameAction(state, 'remove-decor', { id: f.id, item: 'bird' });
  assert.equal(f.decor.bird, 0);

  applyGameAction(state, 'buy-item', { item: 'warPaint' });
  assert.equal(run.inventory.items.warPaint, 1);

  applyGameAction(state, 'build', { type: 'armourer' });
  assert.ok(run.armourerStock.length > 0);
  applyGameAction(state, 'buy-gear', { index: 0 });
  assert.equal(run.inventory.gear.length, 1);
  applyGameAction(state, 'equip', { id: f.id, index: 0 });
  applyGameAction(state, 'unequip-all');
  assert.equal(run.inventory.gear.length, 1);
  applyGameAction(state, 'sell-gear', { index: 0 });
  assert.equal(run.inventory.gear.length, 0);

  applyGameAction(state, 'rename', { id: f.id, name: 'Cassius' });
  assert.equal(f.name, 'Cassius');

  applyGameAction(state, 'steward-plan');
  applyGameAction(state, 'pay-tribute');
  assert.equal(run.tributePaid, 1);

  applyGameAction(state, 'build', { type: 'lounge' });
  applyGameAction(state, 'host');
  assert.ok((run.influence ?? 0) >= 1);
  run.influence = 5;
  applyGameAction(state, 'enact', { policy: 'breadAndCircuses' });

  applyGameAction(state, 'upgrade', { id: run.buildings[0].id });
  applyGameAction(state, 'advance');
  applyGameAction(state, 'advance-tournament');
  assert.equal(run.boutPending, true);

  applyGameAction(state, 'fight', { id: f.id, tier: 1 });
  assert.ok(state.match);
  applyGameAction(state, 'use-item', { item: 'warPaint' });
  let res = applyGameAction(state, 'next-round', { stance: 'steady' });
  if (!state.match.over) res = applyGameAction(state, 'towel');
  assert.equal(state.match.over, true);
  assert.ok(res && typeof res.won === 'boolean');
  applyGameAction(state, 'leave-fight');
  assert.equal(state.match, null);

  run.event = { id: 'spy' };
  applyGameAction(state, 'event-choice', { index: 0 });
  assert.equal(run.event, null);

  run.fortune = { cards: [{ kind: 'boon', id: 'gold', rarity: 'common', gold: 5 }], rerolls: 0 };
  applyGameAction(state, 'fortune', { index: 0 });
  assert.equal(run.fortune, null);

  run.fortune = { cards: [{ kind: 'boon', id: 'gold', rarity: 'common', gold: 5 }], rerolls: 0 };
  applyGameAction(state, 'fortune-pass');
  assert.equal(run.fortune, null);

  applyGameAction(state, 'release', { id: f.id });
  assert.equal(run.roster.length, 0);

  assert.ok(run.actions.length >= 20);
  assert.equal(run.actions[0][0], 'recruit');
});
