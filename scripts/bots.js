// Career-playing bots for balance checks (scripts/career-sim.js) and invariant tests.
// sensible: rests before fights, heals, builds, skips bad matchups, throws in the towel when in danger.
// greedy: trains Power nonstop, never rests or heals, always sends its strongest fighter, never towels.

import { STRESS, BUILDINGS } from '../src/data.js';
import { playRound, throwTowel, mortalDanger, canThrowTowel } from '../src/fight.js';
import { rosterCap, trainCap, medbaySlots, buildBlocker, build, upgradeBlocker, upgrade } from '../src/ludus.js';
import {
  createRun, currentBout, marketPrice, recruit, recruitBlocker, setJob, jobBlocker, advanceWeek, startMatch, finishMatch,
  fightBlocker, skipBlocker, skipBout, forfeitBout, surgeon, surgeonBlocker, surgeonPrice,
} from '../src/run.js';
import { estimateOdds } from '../src/odds.js';

// Spend Gold in priority order, keeping a reserve for training fees.
function spend(run, reserve) {
  const tryUp = (type) => {
    const b = run.buildings.find((x) => x.type === type && !upgradeBlocker(run, x.id));
    if (b && run.gold - BUILDINGS[type].cost[b.level] >= reserve) upgrade(run, b.id);
  };
  const tryBuild = (type) => {
    if (!buildBlocker(run, type) && run.gold - BUILDINGS[type].cost[0] >= reserve) build(run, type);
  };
  // The bot reads exact odds and never needs cheap recruits, so it skips the Oracle and Liaison
  // (those help human players, not this bot) and invests in training uptime instead.
  tryUp('trainer');
  tryBuild('entertainment');
  tryUp('medbay');
  tryUp('entertainment');
  if (run.roster.length >= rosterCap(run)) tryUp('quarters');
}

function sensibleWeek(run, opts) {
  if (opts.surgeonStar) {
    const star = [...run.roster].sort((a, b) => b.power - a.power)[0];
    while (star?.injuries.length && !surgeonBlocker(run, star.id, 0) && run.gold - surgeonPrice(run) >= 4) surgeon(run, star.id, 0);
  }
  if (opts.build !== false) spend(run, 4);
  else for (const b of run.buildings) if (b.type === 'trainer' && !upgradeBlocker(run, b.id)) upgrade(run, b.id);

  // Roster: a star plus two backups; take the strongest on offer.
  const offers = [...run.market, ...(run.liaisonOffer ? [run.liaisonOffer] : [])].sort((a, b) => b.power - a.power);
  for (const f of offers) {
    if (run.roster.length >= Math.min(3, rosterCap(run))) break;
    const price = f === run.liaisonOffer ? f.price : marketPrice(run);
    if (run.gold - price >= 2 && !recruitBlocker(run, f.id)) recruit(run, f.id);
  }

  // Jobs: heal the injured; the strongest fighter who can safely train gets the Trainer; everyone else rests.
  const byPower = [...run.roster].sort((a, b) => b.power - a.power);
  let medbayFree = medbaySlots(run);
  let trainersFree = run.buildings.filter((b) => b.type === 'trainer').length;
  for (const f of byPower) {
    let want = 'rest';
    if (f.injuries.length && medbayFree > 0) {
      want = 'medbay';
      medbayFree--;
    } else if (trainersFree > 0 && f.trained < trainCap(run) && f.stress + STRESS.train < STRESS.overtrained) {
      want = opts.speed !== false && f.speed < 5 && f.trained % 4 === 3 ? 'trainSpeed' : 'trainPower';
      trainersFree--;
    }
    if (f.job !== want) {
      if (f.job !== 'rest' && jobBlocker(run, f.id, want)) setJob(run, f.id, 'rest');
      if (!jobBlocker(run, f.id, want)) setJob(run, f.id, want);
    }
  }
}

function sensibleBout(run, n, opts) {
  const bout = currentBout(run);
  let best = null;
  for (const f of run.roster) {
    if (fightBlocker(run, f.id)) continue;
    const o = estimateOdds(f, run.opponent, { debuff: bout.debuff, overtrained: f.stress >= STRESS.overtrained, n });
    const score = o.win - 1.5 * o.death;
    if (!best || score > best.score) best = { f, o, score };
  }
  if (!best || (best.o.win < 0.35 && !bout.boss && opts.skip !== false)) {
    if (!skipBlocker(run)) return skipBout(run);
    if (!best) return forfeitBout(run);
  }
  const m = startMatch(run, best.f.id);
  while (!m.over) {
    playRound(m);
    if (!m.over && canThrowTowel(m) && mortalDanger(m.a) && m.a.roundsWon <= m.b.roundsWon && !bout.boss && opts.towel !== false) throwTowel(m);
  }
  return finishMatch(run, m);
}

function greedyWeek(run) {
  for (const b of run.buildings) if (b.type === 'trainer' && !upgradeBlocker(run, b.id)) upgrade(run, b.id);
  const best = [...run.market].sort((a, b) => b.power - a.power)[0];
  if (best && run.roster.length < 2 && !recruitBlocker(run, best.id)) recruit(run, best.id);
  const star = [...run.roster].sort((a, b) => b.power - a.power)[0];
  if (star) {
    star.injuries.forEach((_, i) => { if (!surgeonBlocker(run, star.id, 0)) surgeon(run, star.id, 0); });
    if (!jobBlocker(run, star.id, 'trainPower')) setJob(run, star.id, 'trainPower');
  }
}

function greedyBout(run) {
  const f = [...run.roster].sort((a, b) => b.power - a.power).find((x) => !fightBlocker(run, x.id));
  if (!f) return skipBlocker(run) ? forfeitBout(run) : skipBout(run);
  const m = startMatch(run, f.id);
  while (!m.over) playRound(m);
  return finishMatch(run, m);
}

export function playCareer(seed, strategy = 'sensible', { oddsSamples = 150, maxWeeks = 400, ...opts } = {}) {
  const run = createRun(seed);
  let bouts = 0;
  while (run.status === 'active' && run.week < maxWeeks) {
    if (run.boutPending) {
      bouts++;
      if (strategy === 'sensible') sensibleBout(run, oddsSamples, opts);
      else greedyBout(run);
      continue;
    }
    if (strategy === 'sensible') sensibleWeek(run, opts);
    else greedyWeek(run);
    advanceWeek(run);
  }
  const fought = run.history.filter((h) => !h.skipped && !h.forfeit);
  return {
    run,
    won: run.status === 'won',
    status: run.status,
    weeks: run.week,
    bouts,
    fought: fought.length,
    deaths: run.fallen.length,
    strikes: run.strikes,
    tier: run.grand ? 5 : run.tier,
    endReason: run.endReason,
  };
}
