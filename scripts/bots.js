// Career-playing bots for balance checks (scripts/career-sim.js) and invariant tests.
// careful: rests and heals, builds for training and Morale, equips gear, picks perks, uses every arena,
//          skips bad matchups and throws in the towel when a fighter is in danger.
// reckless: trains one star nonstop, heals only with the Surgeon, fights only the top arena, always Presses, never towels.

import { STRESS, BUILDINGS, GEAR, DECOR, ECONOMY, MORALE, CONSUMABLES } from '../src/data.js';
import { EVENT_BY_ID } from '../src/events.js';
import { playRound, throwTowel, mortalDanger, canThrowTowel, suggestTactic, effectiveInjuries, signatureBlocker, useSignature } from '../src/fight.js';
import { rosterCap, trainCap, medbaySlots, buildBlocker, upgradeBlocker, upgrade, decorCap } from '../src/ludus.js';
import {
  createRun, boutFor, unlockedTiers, marketPrice, recruit, recruitBlocker, setJob, jobBlocker, advanceWeek, startMatch, finishMatch,
  fightBlocker, skipBlocker, skipBout, forfeitBout, surgeon, surgeonBlocker, choosePerk, buyGear, buyGearBlocker,
  equip, buyDecor, buyDecorBlocker, assignDecor, assignDecorBlocker, moraleTarget, opponentFor, matchOptions, buildRoom,
  buyItem, buyItemBlocker, useItem, useItemBlocker, chooseEvent, eventChoiceBlocker, withdraw, resolveMercy,
} from '../src/run.js';
import { estimateOdds } from '../src/odds.js';

const PERK_PRIORITY = ['tactician', 'duelist', 'juggernaut', 'mighty', 'killer', 'thickSkin', 'survivor', 'closer', 'fastStart', 'swift', 'ironConstitution', 'crowdPleaser'];

function pickPerks(run) {
  for (const f of run.roster) {
    while (f.pendingPerks.length) {
      const offer = f.pendingPerks[0];
      choosePerk(run, f.id, PERK_PRIORITY.find((p) => offer.includes(p)) ?? offer[0]);
    }
  }
}

// Value of a gear item to this bot: Power counts most, then injure/armor, then Speed.
const gearScore = (k) => (GEAR[k].power ?? 0) * 3 + (GEAR[k].injure ?? 0) / 2500 + (GEAR[k].guard ?? 0) / 2500 + (GEAR[k].speed ?? 0);

function spend(run, reserve) {
  const tryUp = (type) => {
    const b = run.buildings.find((x) => x.type === type && !upgradeBlocker(run, x.id));
    if (b && run.gold - BUILDINGS[type].cost[b.level] >= reserve) upgrade(run, b.id);
  };
  const tryBuild = (type) => {
    if (!buildBlocker(run, type) && run.gold - BUILDINGS[type].cost[0] >= reserve) buildRoom(run, type);
  };
  // The bot reads exact odds and never needs cheap recruits, so it skips the Oracle and Liaison.
  tryUp('trainer');
  tryBuild('entertainment');
  tryBuild('armourer');
  tryUp('quarters');
  tryUp('medbay');
  tryUp('entertainment');
  tryUp('armourer');
  if (run.roster.length >= rosterCap(run)) tryBuild('quarters');
}

function equipAll(run, reserve) {
  // Buy gear that beats what someone has, then hand out the storeroom best-first.
  run.armourerStock.forEach((k, i) => {
    const worst = Math.min(...run.roster.map((f) => (f.gear[GEAR[k].slot] ? gearScore(f.gear[GEAR[k].slot]) : -1)));
    if (gearScore(k) > worst && run.gold - GEAR[k].price >= reserve && !buyGearBlocker(run, i)) buyGear(run, i);
  });
  const byPower = [...run.roster].sort((a, b) => b.power - a.power);
  for (const f of byPower) {
    for (const slot of ['weapon', 'armor']) {
      const options = run.inventory.gear.map((k, i) => ({ k, i })).filter(({ k }) => GEAR[k].slot === slot);
      const best = options.sort((a, b) => gearScore(b.k) - gearScore(a.k))[0];
      if (best && (!f.gear[slot] || gearScore(best.k) > gearScore(f.gear[slot]))) equip(run, f.id, best.i);
    }
  }
}

function keepHappy(run) {
  // Place decor where Morale is heading below Inspired, preferring decor that also helps in combat.
  for (const f of run.roster) {
    for (let guard = 0; guard < 6 && moraleTarget(run, f).target < MORALE.inspired; guard++) {
      const item = Object.keys(DECOR).find((k) => DECOR[k].helps(f) && f.decor[k] < decorCap(run)) ?? Object.keys(DECOR).find((k) => f.decor[k] < decorCap(run));
      if (!item) break;
      if (!run.inventory.decor[item]) {
        if (buyDecorBlocker(run, item) || run.gold - DECOR[item].price < 6) break;
        buyDecor(run, item);
      }
      if (assignDecorBlocker(run, f.id, item)) break;
      assignDecor(run, f.id, item);
    }
  }
}

function carefulWeek(run, opts) {
  pickPerks(run);
  if (opts.build !== false) spend(run, 6);
  else for (const b of run.buildings) if (b.type === 'trainer' && !upgradeBlocker(run, b.id)) upgrade(run, b.id);
  if (opts.gear !== false) equipAll(run, 4);
  if (opts.morale !== false) keepHappy(run);

  // Roster: enough fighters to cover every arena, plus a spare.
  const want = Math.min(rosterCap(run), unlockedTiers(run).length + 2);
  const offers = [...run.market, ...(run.liaisonOffer ? [run.liaisonOffer] : [])].sort((a, b) => b.power - a.power);
  for (const f of offers) {
    if (run.roster.length >= want) break;
    const price = f === run.liaisonOffer ? f.price : marketPrice(run);
    if (run.gold - price >= 4 && !recruitBlocker(run, f.id)) recruit(run, f.id);
  }

  // Jobs: heal the injured; the strongest fighters who can safely train get the Trainer Rooms.
  const topSpeed = opponentFor(run).speed;
  const byPower = [...run.roster].sort((a, b) => b.power - a.power);
  let medbayFree = medbaySlots(run);
  let trainersFree = run.buildings.filter((b) => b.type === 'trainer').length;
  for (const f of byPower) {
    let want = 'rest';
    if (f.injuries.length && medbayFree > 0) {
      want = 'medbay';
      medbayFree--;
    } else if (trainersFree > 0 && f.trained < trainCap(run) && f.stress + STRESS.train < STRESS.overtrained && f.morale >= MORALE.restless) {
      // Keep a little faster than the top arena's opponents (evasion and First Strike); the rest goes to Power.
      want = opts.speed !== false && f.speed < topSpeed + 2 ? 'trainSpeed' : 'trainPower';
      trainersFree--;
    }
    if (f.job !== want) {
      if (f.job !== 'rest' && jobBlocker(run, f.id, want)) setJob(run, f.id, 'rest');
      if (!jobBlocker(run, f.id, want)) setJob(run, f.id, want);
    }
  }
}

// `tactic`: 'smart' reads the opponent's humor (as auto-play does); anything else is used every round.
// Plays a tournament: one match, or a whole bracket (Silver and up). A careful bot withdraws a fighter at the
// Death Gate between bracket matches (unless it's the top arena's Boss); the reckless one always fights on.
function playMatch(run, f, tier, towel, items = false, tactic = 'smart') {
  let summary = playOneMatch(run, f, tier, towel, items, tactic);
  while (summary.next && run.status === 'active') {
    pickPerks(run);
    const bout = boutFor(run, tier);
    const fighter = run.roster.find((x) => x.id === f.id);
    if (towel && effectiveInjuries(fighter) >= 2 && !(bout.top && bout.boss)) return withdraw(run, tier);
    summary = playOneMatch(run, fighter, tier, towel, items, tactic);
  }
  return summary;
}

function playOneMatch(run, f, tier, towel, items = false, tactic = 'smart') {
  const bout = boutFor(run, tier);
  const m = startMatch(run, f.id, tier);
  if (!signatureBlocker(m)) useSignature(m); // both bots open with their signature move
  while (!m.over) {
    playRound(m, { stance: tactic === 'smart' ? suggestTactic(m) : tactic });
    if (items && !m.over) {
      // In danger and not ahead: a Blessed Bandage. In a top-arena Boss fight: War Paint.
      const danger = mortalDanger(m.a) && m.a.roundsWon <= m.b.roundsWon;
      const pick = danger && run.inventory.items.blessedBandage ? 'blessedBandage' : bout.top && bout.boss && run.inventory.items.warPaint ? 'warPaint' : null;
      if (pick && !useItemBlocker(run, m, pick)) useItem(run, m, pick);
    }
    if (towel && !m.over && canThrowTowel(m) && mortalDanger(m.a) && m.a.roundsWon <= m.b.roundsWon && !bout.boss) throwTowel(m);
  }
  const summary = finishMatch(run, m);
  // Thumbs up or down: the careful bot gives the crowd what it wants; the reckless one always kills.
  if (run.mercy) resolveMercy(run, tactic === 'press' ? 'kill' : run.mercy.crowd);
  return summary;
}

// Before a top-arena Boss, stock one War Paint (and a Bandage for an injured star) if Gold allows.
function stockItems(run) {
  const bout = boutFor(run, run.topTier);
  if (!bout.boss) return;
  const reserve = 4;
  if (!run.inventory.items.warPaint && run.gold - CONSUMABLES.warPaint.price >= reserve && !buyItemBlocker(run, 'warPaint')) buyItem(run, 'warPaint');
  const hurtStar = run.roster.some((f) => f.injuries.length);
  if (hurtStar && !run.inventory.items.blessedBandage && run.gold - CONSUMABLES.blessedBandage.price >= reserve && !buyItemBlocker(run, 'blessedBandage')) buyItem(run, 'blessedBandage');
}

function carefulBouts(run, n, opts) {
  const odds = (f, tier) => {
    const bout = boutFor(run, tier);
    return estimateOdds(f, opponentFor(run, tier), { ...matchOptions(run, f, tier), n });
  };
  if (opts.items !== false) stockItems(run);
  // Top arena first: send whoever scores best.
  const top = run.topTier;
  let best = null;
  for (const f of run.roster) {
    if (fightBlocker(run, f.id, top)) continue;
    const o = odds(f, top);
    const score = o.win - 1.5 * o.death;
    if (!best || score > best.score) best = { f, o, score };
  }
  const bout = boutFor(run, top);
  if (!best || (best.o.win < 0.35 && !bout.boss && opts.skip !== false)) {
    if (!skipBlocker(run)) skipBout(run);
    else if (!best) forfeitBout(run);
    else playMatch(run, best.f, top, opts.towel !== false, opts.items !== false);
  } else {
    playMatch(run, best.f, top, opts.towel !== false, opts.items !== false);
  }
  if (run.status !== 'active' || opts.lowerArenas === false) return;
  // Lower arenas: send free fighters where the fight is winnable but not a crushing mismatch.
  for (const tier of unlockedTiers(run).filter((t) => t < run.topTier).sort((a, b) => b - a)) {
    pickPerks(run);
    const opp = opponentFor(run, tier);
    const candidates = run.roster.filter((f) => !fightBlocker(run, f.id, tier) && f.power - opp.power < ECONOMY.crushingGap && f.injuries.length < 2);
    let pickF = null;
    for (const f of candidates) {
      const o = odds(f, tier);
      if (o.win >= 0.5 && o.death < 0.02 && (!pickF || o.win > pickF.win)) pickF = { f, win: o.win };
    }
    if (pickF) playMatch(run, pickF.f, tier, opts.towel !== false, opts.items !== false);
    if (run.status !== 'active') return;
  }
}

function recklessWeek(run) {
  pickPerks(run);
  for (const b of run.buildings) if (b.type === 'trainer' && !upgradeBlocker(run, b.id)) upgrade(run, b.id);
  const best = [...run.market].sort((a, b) => b.power - a.power)[0];
  if (best && run.roster.length < 2 && !recruitBlocker(run, best.id)) recruit(run, best.id);
  const star = [...run.roster].sort((a, b) => b.power - a.power)[0];
  if (star) {
    while (star.injuries.length && !surgeonBlocker(run, star.id, 0)) surgeon(run, star.id, 0);
    if (!jobBlocker(run, star.id, 'trainPower')) setJob(run, star.id, 'trainPower');
  }
}

function recklessBouts(run) {
  const f = [...run.roster].sort((a, b) => b.power - a.power).find((x) => !fightBlocker(run, x.id));
  if (!f) {
    if (!skipBlocker(run)) skipBout(run);
    else forfeitBout(run);
    return;
  }
  playMatch(run, f, run.topTier, false, false, 'press');
}

// `onWeek(run)`: optional, called at every step (for economy and other probes).
export function playCareer(seed, strategy = 'careful', { oddsSamples = 150, maxWeeks = 400, onWeek = null, ...opts } = {}) {
  const run = createRun(seed);
  let bouts = 0;
  while (run.status === 'active' && run.week < maxWeeks) {
    onWeek?.(run);
    // Events: the careful bot takes the cautious (first) choice it can afford; the reckless one the boldest.
    if (run.event) {
      const n = EVENT_BY_ID[run.event.id].choices.length;
      const order = strategy === 'careful' ? [...Array(n).keys()] : [...Array(n).keys()].reverse();
      chooseEvent(run, order.find((i) => !eventChoiceBlocker(run, i)));
      continue;
    }
    pickPerks(run);
    if (run.bouts) {
      if (run.boutPending) {
        bouts++;
        if (strategy === 'careful') carefulBouts(run, oddsSamples, opts);
        else recklessBouts(run);
        continue;
      }
      pickPerks(run);
      if (run.status === 'active') advanceWeek(run);
      continue;
    }
    if (strategy === 'careful') carefulWeek(run, opts);
    else recklessWeek(run);
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
    favor: run.favor,
    tier: run.topTier,
    endReason: run.endReason,
  };
}

