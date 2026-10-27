import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { KINDS, CIRCUITS, GRAND, STRESS, ECONOMY } from '../src/data.js';
import { autoPlay } from '../src/fight.js';
import { build, rosterCap, plotsFree } from '../src/ludus.js';
import {
  createRun, createFighter, recruit, recruitBlocker, release, setJob, jobBlocker, advanceWeek, advanceBlocker, advanceToTournament,
  buyDecor, decorBlocker, surgeon, surgeonBlocker, startMatch, finishMatch, fightBlocker, skipBout, skipBlocker, forfeitBout, forfeitBlocker,
  currentBout, marketPrice, serialize, deserialize,
} from '../src/run.js';

// A run with one recruited fighter, standing on the first tournament week.
const atBout = (seed = 1) => {
  const run = createRun(seed);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  return { run, f };
};

const fakeMatch = (run, id, { winner = 'A', reason = 'rounds', alive = true, injuries = [] } = {}) => {
  const m = startMatch(run, id);
  m.over = true;
  m.result = { winner, reason };
  m.a.f.alive = alive;
  m.a.f.injuries = injuries;
  return m;
};

// Win (or lose) bouts until the circuit reaches the given stage.
const playBout = (run, id, opts) => finishMatch(run, fakeMatch(run, id, opts));
const nextBout = (run) => advanceToTournament(run);

// ---------- Setup ----------

test('a new career: 12 Gold, 5 Prestige, level 1, Martius week 1, Tier 1 circuit, no bout yet', () => {
  const run = createRun(1);
  assert.deepEqual([run.gold, run.prestige, run.prestigeLevel, run.week, run.tier, run.stage, run.strikes], [12, 5, 1, 0, 1, 0, 0]);
  assert.equal(run.boutPending, false);
  assert.equal(run.market.length, 4);
  assert.equal(run.opponent.power, CIRCUITS[0].oppPower[0]);
  assert.ok(run.debuff);
});

test('every market includes at least one Orc, and names are unique', () => {
  for (let seed = 0; seed < 40; seed++) {
    const run = createRun(seed);
    assert.ok(run.market.some((f) => f.kind === 'orc'), `seed ${seed}`);
    const names = [...run.market, run.opponent].map((f) => f.name);
    assert.equal(new Set(names).size, names.length);
  }
});

test('careers are deterministic from the seed', () => {
  assert.equal(serialize(createRun(42)), serialize(createRun(42)));
});

test('created fighters follow kind rules and start rested', () => {
  const rng = createRng(4);
  for (let i = 0; i < 200; i++) {
    const f = createFighter(rng, { id: 'x' });
    assert.equal(f.power, KINDS[f.kind].basePower);
    assert.ok(KINDS[f.kind].traits.includes(f.kindTrait));
    assert.deepEqual([f.stress, f.job, f.titles], [0, 'rest', []]);
  }
});

// ---------- Recruiting ----------

test('recruiting costs the tier price and is capped by Quarters', () => {
  const run = createRun(1);
  run.gold = 100;
  const ids = run.market.map((f) => f.id);
  recruit(run, ids[0]);
  recruit(run, ids[1]);
  assert.equal(run.gold, 100 - 2 * marketPrice(run));
  assert.match(recruitBlocker(run, ids[2]), /quarters are full/);
});

test('releasing a fighter frees a slot', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  release(run, f.id);
  assert.equal(run.roster.length, 0);
});

// ---------- Weekly jobs ----------

test('training gives +1 stat per week, costs Gold and adds Stress', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  const [power, gold] = [f.power, run.gold];
  setJob(run, f.id, 'trainPower');
  advanceWeek(run);
  assert.deepEqual([f.power, f.trained, f.stress, run.gold], [power + 1, 1, STRESS.train, gold - 1]);
});

test('training stops at the trainer cap and the fighter switches to rest', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.trained = 3;
  assert.match(jobBlocker(run, f.id, 'trainSpeed'), /cap reached/);
  f.trained = 2;
  setJob(run, f.id, 'trainSpeed');
  advanceWeek(run);
  advanceWeek(run);
  assert.deepEqual([f.trained, f.job], [3, 'rest']);
});

test('one Trainer Room trains one fighter at a time', () => {
  const run = createRun(1);
  const [a, b] = [recruit(run, run.market[0].id), recruit(run, run.market[0].id)];
  setJob(run, a.id, 'trainPower');
  assert.match(jobBlocker(run, b.id, 'trainPower'), /busy/);
});

test('training without Gold falls back to rest', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  setJob(run, f.id, 'trainPower');
  run.gold = 0;
  const power = f.power;
  advanceWeek(run);
  assert.deepEqual([f.power, f.job], [power, 'rest']);
});

test('rest lowers Stress; Stress stays within 0–100', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.stress = 50;
  advanceWeek(run);
  assert.equal(f.stress, 20);
  advanceWeek(run);
  assert.equal(f.stress, 0);
});

test('the Medbay heals injuries over weeks, then sends the fighter to rest', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  assert.match(jobBlocker(run, f.id, 'medbay'), /Not injured/);
  f.injuries = [{ tag: 'concussed', weight: 1, weeksLeft: 2 }, { tag: 'fleshWound', weight: 1, weeksLeft: 1 }];
  setJob(run, f.id, 'medbay');
  advanceWeek(run);
  assert.equal(f.injuries.length, 2);
  advanceWeek(run);
  assert.deepEqual(f.injuries.map((i) => i.tag), ['fleshWound']);
  advanceWeek(run);
  assert.deepEqual([f.injuries.length, f.job], [0, 'rest']);
});

test('injuries do not heal outside the Medbay', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.injuries = [{ tag: 'fleshWound', weight: 1, weeksLeft: 1 }];
  advanceWeek(run);
  assert.equal(f.injuries.length, 1);
});

test('the Medbay has limited beds', () => {
  const run = createRun(1);
  const [a, b] = [recruit(run, run.market[0].id), recruit(run, run.market[0].id)];
  a.injuries = b.injuries = [{ tag: 'fleshWound', weight: 1, weeksLeft: 1 }];
  setJob(run, a.id, 'medbay');
  assert.match(jobBlocker(run, b.id, 'medbay'), /full/);
});

test('the Emergency Surgeon heals one injury instantly for 5 Gold', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.injuries = [{ tag: 'blinded', weight: 1, weeksLeft: 3 }];
  surgeon(run, f.id, 0);
  assert.deepEqual([f.injuries.length, run.gold], [0, 12 - 3 - 5]);
  f.injuries = [{ tag: 'blinded', weight: 1, weeksLeft: 3 }];
  assert.match(surgeonBlocker(run, f.id, 0), /needs 5 Gold/);
});

test('decor is capped by the Quarters level', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  buyDecor(run, f.id, 'bird');
  assert.match(decorBlocker(run, f.id, 'bird'), /Upgrade Fighter Quarters/);
});

// ---------- Calendar ----------

test('week 4 of each month is a tournament week that must be resolved', () => {
  const run = createRun(1);
  recruit(run, run.market[0].id);
  assert.equal(advanceToTournament(run), 3);
  assert.equal(run.boutPending, true);
  assert.match(advanceBlocker(run), /Tournament week/);
});

test('the market and Liaison refresh at the start of each month', () => {
  const { run, f } = atBout();
  const before = run.market.map((x) => x.id);
  playBout(run, f.id);
  advanceWeek(run);
  assert.ok(run.market.every((x) => !before.includes(x.id)));
});

test('the Liaison offers a cheap injured convict once built', () => {
  const run = createRun(1);
  run.prestigeLevel = 2;
  run.gold = 100;
  build(run, 'liaison');
  advanceToTournament(run);
  run.boutPending = false;
  advanceWeek(run);
  assert.equal(run.liaisonOffer.price, 1);
  assert.equal(run.liaisonOffer.injuries[0].tag, 'fleshWound');
  const id = run.liaisonOffer.id;
  recruit(run, id);
  assert.equal(run.liaisonOffer, null);
  assert.ok(run.roster.some((x) => x.id === id));
});

// ---------- Tournaments ----------

test('fights only happen on tournament weeks and cost the buy-in', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  assert.match(fightBlocker(run, f.id), /tournament weeks/);
  advanceToTournament(run);
  startMatch(run, f.id);
  assert.equal(run.prestige, 5 - CIRCUITS[0].buyIn[0]);
});

test('a fighter with Stress 50+ enters overtrained', () => {
  const { run, f } = atBout();
  f.stress = STRESS.overtrained;
  const m = startMatch(run, f.id);
  assert.equal(m.preMatch[0]?.source, 'Overtrained');
});

test('a win pays Gold and Prestige, adds fight Stress and moves to Tournament 2', () => {
  const { run, f } = atBout();
  const [gold, prestige] = [run.gold, run.prestige];
  const s = playBout(run, f.id);
  assert.deepEqual([s.gold, s.prestige], [CIRCUITS[0].winGold[0], CIRCUITS[0].winPrestige[0]]);
  assert.deepEqual([run.gold, run.prestige, run.stage, run.boutPending], [gold + 4, prestige + 2, 1, false]);
  assert.equal(f.stress, STRESS.fight);
  assert.equal(run.opponent.power, CIRCUITS[0].oppPower[1]);
});

test('injuries from a match get healing times', () => {
  const { run, f } = atBout();
  playBout(run, f.id, { winner: 'B', injuries: [{ tag: 'blinded', weight: 1 }] });
  assert.deepEqual(f.injuries, [{ tag: 'blinded', weight: 1, weeksLeft: 3 }]);
});

test('skipping Tournament 1 gives Gold and rest, but Bosses cannot be skipped', () => {
  const { run, f } = atBout();
  f.stress = 40;
  skipBout(run);
  assert.deepEqual([run.gold, f.stress, run.stage], [12 - 3 + ECONOMY.skipGold, 20, 1]);
  nextBout(run);
  skipBout(run);
  nextBout(run);
  assert.equal(currentBout(run).boss, true);
  assert.match(skipBlocker(run), /cannot be skipped/);
  assert.equal(forfeitBlocker(run), null);
});

test('beating a Boss grants a Title (+1 Power) and opens the next tier', () => {
  const { run, f } = atBout();
  playBout(run, f.id);
  nextBout(run);
  playBout(run, f.id);
  nextBout(run);
  const power = f.power;
  const s = playBout(run, f.id);
  assert.match(s.title, /Champion of the Dirt Pits/);
  assert.equal(f.power, power + 1);
  assert.deepEqual([run.tier, run.stage, run.strikes], [2, 0, 0]);
});

test('losing a Boss gives a Strike and restarts the tier', () => {
  const { run, f } = atBout();
  skipBout(run);
  nextBout(run);
  skipBout(run);
  nextBout(run);
  const s = playBout(run, f.id, { winner: 'B' });
  assert.equal(s.strike, true);
  assert.deepEqual([run.tier, run.stage, run.strikes, run.status], [1, 0, 1, 'active']);
});

test('three Strikes and the Emperor has you executed', () => {
  const { run } = atBout();
  run.prestige = 100;
  for (let i = 0; i < 3; i++) {
    skipBout(run);
    nextBout(run);
    skipBout(run);
    nextBout(run);
    forfeitBout(run);
    if (i < 2) nextBout(run);
  }
  assert.equal(run.status, 'lost');
  assert.match(run.endReason, /Three Imperial Strikes/);
});

test('after the Tier 4 Boss comes the Grand Tournament; winning it wins the career', () => {
  const { run, f } = atBout();
  run.prestige = 500;
  run.tier = 4;
  run.stage = 2;
  playBout(run, f.id);
  assert.equal(run.grand, true);
  nextBout(run);
  assert.equal(currentBout(run).name, GRAND.name);
  assert.equal(run.opponent.power, GRAND.oppPower);
  playBout(run, f.id);
  assert.equal(run.status, 'won');
});

test('losing the Grand Tournament is a Strike and you can try again', () => {
  const { run, f } = atBout();
  run.prestige = 500;
  run.grand = true;
  playBout(run, f.id, { winner: 'B' });
  assert.deepEqual([run.grand, run.strikes, run.status], [true, 1, 'active']);
});

test('Prestige levels unlock as Prestige grows and add room plots', () => {
  const { run, f } = atBout();
  run.prestige = 9;
  const s = playBout(run, f.id);
  assert.equal(s.levelUp, 2);
  assert.deepEqual([run.prestigeLevel, plotsFree(run)], [2, 2]);
});

test('Blood Faith refunds the buy-in when the Orc dies', () => {
  const run = createRun(1);
  const orc = recruit(run, run.market.find((x) => x.kind === 'orc').id);
  advanceToTournament(run);
  const s = playBout(run, orc.id, { winner: 'B', reason: 'death', alive: false });
  assert.deepEqual([s.bloodFaith, run.prestige], [true, 5]);
  assert.equal(run.fallen[0].id, orc.id);
});

test('losing the last fighter with no Gold for another ends the career', () => {
  const { run, f } = atBout();
  run.gold = 0;
  playBout(run, f.id, { winner: 'B', reason: 'death', alive: false });
  assert.equal(run.status, 'lost');
});

// ---------- Save / load ----------

test('save and load round-trip the whole career', () => {
  const { run, f } = atBout();
  playBout(run, f.id);
  assert.equal(serialize(deserialize(serialize(run))), serialize(run));
});

test('reloading in the middle of a match counts as throwing in the towel', () => {
  const { run, f } = atBout();
  startMatch(run, f.id);
  const loaded = deserialize(serialize(run));
  assert.equal(loaded.inMatch, false);
  assert.equal(loaded.prestige, 5 - 1, 'buy-in stays lost');
  assert.equal(loaded.stage, 1);
  assert.equal(loaded.roster[0].alive, true);
});

test('saves from another version are rejected', () => {
  assert.throws(() => deserialize(JSON.stringify({ version: 1 })), /older version/);
});

// ---------- Whole-career invariants ----------

test('simple-bot careers always end, and the state stays valid every week', () => {
  for (let seed = 0; seed < 40; seed++) {
    const run = createRun(seed);
    for (let step = 0; step < 2000 && run.status === 'active'; step++) {
      if (run.roster.length < rosterCap(run) && run.market.length && !recruitBlocker(run, run.market[0].id)) recruit(run, run.market[0].id);
      for (const f of run.roster) {
        const job = f.injuries.length ? 'medbay' : f.stress >= 40 ? 'rest' : 'trainPower';
        if (!jobBlocker(run, f.id, job)) setJob(run, f.id, job);
      }
      if (run.boutPending) {
        const f = run.roster.find((x) => !fightBlocker(run, x.id));
        if (f) {
          const m = startMatch(run, f.id);
          autoPlay(m);
          finishMatch(run, m);
        } else if (!skipBlocker(run)) skipBout(run);
        else forfeitBout(run);
      } else advanceWeek(run);
      assert.ok(run.gold >= 0 && run.prestige >= 0, `seed ${seed}: negative resources`);
      assert.ok(run.roster.length <= rosterCap(run), `seed ${seed}: roster over cap`);
      assert.ok(run.roster.every((f) => f.alive && f.stress >= 0 && f.stress <= 100));
    }
    assert.ok(['won', 'lost'].includes(run.status), `seed ${seed} never ended`);
  }
});

test('re-selecting the job a fighter already has is a no-op, even at the trainer cap', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  setJob(run, f.id, 'trainPower');
  f.trained = 3;
  assert.equal(jobBlocker(run, f.id, 'trainPower'), null);
  assert.doesNotThrow(() => setJob(run, f.id, 'trainPower'));
});
