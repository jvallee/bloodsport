// Career-playing bots for balance checks (scripts/career-sim.js) and invariant tests.
// careful: rests and heals, builds for training and Morale, equips gear, picks perks, uses every arena,
//          skips bad matchups and throws in the towel when a fighter is in danger.
// careful also bets on clear favourites, hosts the Senate and passes policies once it has a Patron Lounge, and raises a
//          freshly fallen fighter at the Unnatural Temple of Vulcan (building it then, if it must).
// reckless: trains one star nonstop, heals only with the Surgeon, fights only the top arena, always Presses, never towels.

import { STRESS, BUILDINGS, GEAR, DECOR, ECONOMY, MORALE, CONSUMABLES, BET, LOUNGE, FORTUNE } from '../src/data.js';
import { EVENT_BY_ID } from '../src/events.js';
import { isMonthStart, isWinter } from '../src/calendar.js';
import { coupBonus } from '../src/plot.js';
import { playRound, throwTowel, mortalDanger, canThrowTowel, suggestTactic, effectiveInjuries, signatureBlocker, useSignature } from '../src/fight.js';
import { rosterCap, trainCap, medbaySlots, buildBlocker, upgradeBlocker, upgrade, decorCap, plotsFree } from '../src/ludus.js';
import {
  createRun, boutFor, unlockedTiers, marketPrice, recruit, recruitBlocker, setJob, jobBlocker, advanceWeek, startMatch, finishMatch,
  fightBlocker, skipBlocker, skipBout, forfeitBout, surgeon, surgeonBlocker, choosePerk, buyGear, buyGearBlocker,
  equip, buyDecor, buyDecorBlocker, assignDecor, assignDecorBlocker, moraleTarget, opponentFor, matchOptions, buildRoom, recruitPrice,
  buyItem, buyItemBlocker, useItem, useItemBlocker, chooseEvent, eventChoiceBlocker, withdraw, resolveMercy,
  betOdds, betCap, betBlocker, placeBet, hostBlocker, host, enactBlocker, enact, raisable, reanimateBlocker, reanimate,
  summonsBlocker, answerSummons, refuseSummons, effectivePower, chooseFortune, fortuneBlocker, passFortune,
} from '../src/run.js';
import { estimateOdds } from '../src/odds.js';
import { RELICS, perkTags } from '../src/fortune.js';

const PERK_PRIORITY = ['tactician', 'duelist', 'juggernaut', 'mighty', 'killer', 'thickSkin', 'survivor', 'closer', 'fastStart', 'swift', 'ironConstitution', 'crowdPleaser'];

// Version 6: a house holding a tag relic (src/fortune.js) takes perks with that tag first.
function pickPerks(run) {
  if (run.status !== 'active') return; // a summons can end a career (and a finished career takes no choices)
  const tags = (run.relics ?? []).map((id) => RELICS[id]?.tag).filter(Boolean);
  for (const f of run.roster) {
    while (f.pendingPerks.length) {
      const offer = f.pendingPerks[0];
      const tagged = PERK_PRIORITY.find((p) => offer.includes(p) && perkTags(p).some((t) => tags.includes(t)));
      choosePerk(run, f.id, tagged ?? PERK_PRIORITY.find((p) => offer.includes(p)) ?? offer[0]);
    }
  }
}

// Version 6: the Fortune draft. Both bots take the card they value most: a fighter while the house is small, a relic
// (the rarer the better), then gear, then boons; the reckless bot loves the Fates' Wager, the careful one avoids it.
const RARITY_BONUS = { common: 0, rare: 1, legendary: 3 };
function fortuneScore(run, c, strategy) {
  if (c.kind === 'fighter' || c.kind === 'legend') return run.roster.length < 3 ? 9 : 3 + RARITY_BONUS[c.rarity];
  if (c.kind === 'relic') return 6 + RARITY_BONUS[c.rarity];
  if (c.kind === 'gear') return 3 + GEAR[c.id].tier;
  if (c.kind === 'wager') return strategy === 'careful' ? 1 : 8;
  if (c.id === 'surgeon') return run.roster.some((f) => f.injuries.length > 1) ? 7 : 3;
  if (c.id === 'favour') return run.favor < 40 ? 8 : 3;
  return { gold: 4, prestige: 5, sparring: 4, calm: 2, items: 2, blessing: 9 }[c.id] ?? 2;
}
// At the relic limit (LLM-13: relic cards keep coming), a bot lays down its least rare relic for a rarer one.
const RANK = { common: 0, rare: 1, legendary: 2 };
function swapFor(run, c) {
  if (c.kind !== 'relic' || run.relics.length < FORTUNE.maxRelics) return null;
  const worst = [...run.relics].sort((a, b) => RANK[RELICS[a].rarity] - RANK[RELICS[b].rarity])[0];
  return RANK[c.rarity] > RANK[RELICS[worst].rarity] ? worst : undefined; // undefined: not worth a swap
}
function draftFortune(run, strategy) {
  const best = run.fortune.cards.map((c, i) => {
    const drop = swapFor(run, c);
    return { i, drop, score: drop === undefined || fortuneBlocker(run, i, drop) ? -1 : fortuneScore(run, c, strategy) };
  }).sort((a, b) => b.score - a.score)[0];
  if (best.score >= 0) chooseFortune(run, best.i, best.drop);
  else passFortune(run);
}

// Value of a gear item to this bot: Power counts most, then injure/armor, then Speed.
const gearScore = (k) => (GEAR[k].power ?? 0) * 3 + (GEAR[k].injure ?? 0) / 2500 + (GEAR[k].guard ?? 0) / 2500 + (GEAR[k].speed ?? 0);

function spend(run, reserve, opts = {}) {
  const tryUp = (type) => {
    const b = run.buildings.find((x) => x.type === type && !upgradeBlocker(run, x.id));
    if (b && run.gold - BUILDINGS[type].cost[b.level] >= reserve) upgrade(run, b.id);
  };
  const tryBuild = (type) => {
    if (!buildBlocker(run, type) && run.gold - BUILDINGS[type].cost[0] >= reserve) buildRoom(run, type);
  };
  // The bot reads exact odds and never needs cheap recruits, so it skips the Oracle and Liaison.
  if (opts.plot) tryBuild('liaison'); // v6: the plot starts with the Liaison's prisoners
  // 5.4.0: a rebel answers the cause's request for the Whispering Gallery before anything else.
  if (opts.plot === 'rebel' && run.quests?.rebel?.some((q) => q.id === 'gallery') && !buildBlocker(run, 'gallery')) buildRoom(run, 'gallery');
  tryUp('trainer');
  tryBuild('entertainment');
  tryBuild('armourer');
  tryUp('quarters');
  tryUp('medbay');
  tryUp('entertainment');
  tryUp('armourer');
  if (run.roster.length >= rosterCap(run)) tryBuild('quarters');
  // The Patron Lounge (5.2.0) comes last, and only while a plot is to spare for more Fighter Quarters.
  if (opts.lounge !== false && plotsFree(run) > 1) tryBuild('lounge');
}

// The Unnatural Temple of Vulcan (5.3.0): when a fighter has just died in the arena, build the Temple if need be and raise them.
function raiseTheDead(run, opts) {
  if (opts.vulcan === false) return;
  const fresh = run.fallen.filter((f) => f.arena && !f.raised && f.kind !== 'revenant' && run.week - f.diedWeek <= BUILDINGS.vulcan.per[0]);
  if (!fresh.length) return;
  if (!buildBlocker(run, 'vulcan') && run.gold - BUILDINGS.vulcan.cost[0] >= 15) buildRoom(run, 'vulcan');
  for (const f of [...raisable(run)].sort((a, b) => b.power - a.power)) if (!reanimateBlocker(run, f.id) && run.gold >= 20) reanimate(run, f.id);
}

// The Patron Lounge: host the Senate whenever Gold allows, and keep the most useful policy in force.
// The order: richer purses, comfort, mercy that pays everywhere, a lower tribute. A rebel wants the prisoners an Amnesty brings.
const POLICY_ORDER = ['breadAndCircuses', 'grainToLudus', 'edictOfMercy', 'lowerTribute'];
function useLounge(run, opts) {
  if (opts.lounge === false) return;
  if (!hostBlocker(run) && run.gold - LOUNGE.hostGold * 4 >= 8) host(run);
  // 5.4.0: a rebel passes the law the cause asked for first.
  const asked = run.quests?.rebel?.find((q) => q.id === 'lobby')?.policy;
  const order = opts.plot === 'rebel' ? [...(asked ? [asked] : []), 'amnesty', ...POLICY_ORDER] : POLICY_ORDER;
  for (const id of order) if (!enactBlocker(run, id)) enact(run, id);
}

// Betting: before Round 1, the careful bot backs a fighter it thinks is a clear favourite, with Gold it can spare.
// The bookmaker's odds come from a plain simulation; the bot's tactics, items and signature move are its edge.
function maybeBet(run, m) {
  const p = BET.cut / betOdds(run, m);
  if (p < 0.6) return;
  const stake = [...BET.stakes].reverse().find((x) => x <= betCap(run, m) && run.gold - x >= 10);
  if (stake && !betBlocker(run, m, stake)) placeBet(run, m, stake);
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
  if (opts.build !== false) spend(run, 6, opts);
  else for (const b of run.buildings) if (b.type === 'trainer' && !upgradeBlocker(run, b.id)) upgrade(run, b.id);
  if (opts.gear !== false) equipAll(run, 4);
  if (opts.morale !== false) keepHappy(run);
  useLounge(run, opts);
  raiseTheDead(run, opts);

  // Roster: enough fighters to cover every arena, plus a spare.
  const want = Math.min(rosterCap(run), unlockedTiers(run).length + 2);
  // A plot-playing bot (v6) takes any political prisoner it's offered (it can read their record better than most players).
  const offers = [...run.market, ...(run.liaisonOffers ?? [])].sort((a, b) => (opts.plot ? Number(Boolean(b.political)) - Number(Boolean(a.political)) : 0) || b.power - a.power);
  for (const f of offers) {
    if (run.roster.length >= (f.political && opts.plot ? rosterCap(run) : want)) continue;
    const price = recruitPrice(run, f);
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
function playMatch(run, f, tier, towel, items = false, tactic = 'smart', bet = false) {
  let summary = playOneMatch(run, f, tier, towel, items, tactic, bet);
  while (summary.next && run.status === 'active') {
    pickPerks(run);
    const bout = boutFor(run, tier);
    const fighter = run.roster.find((x) => x.id === f.id);
    if (towel && effectiveInjuries(fighter) >= 2 && !(bout.top && bout.boss)) return withdraw(run, tier);
    summary = playOneMatch(run, fighter, tier, towel, items, tactic, bet);
  }
  return summary;
}

function playOneMatch(run, f, tier, towel, items = false, tactic = 'smart', bet = false) {
  const bout = boutFor(run, tier);
  const m = startMatch(run, f.id, tier);
  if (bet) maybeBet(run, m);
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
  // The coup Final: the recruited champion must be the one who fights it.
  const champ = run.plot?.coup && !run.plot.ended ? run.roster.find((f) => f.id === run.plot.champion && !fightBlocker(run, f.id, top)) : null;
  if (champ) best = { f: champ, o: odds(champ, top), score: 0 };
  const bout = boutFor(run, top);
  if (!best || (best.o.win < 0.35 && !bout.boss && opts.skip !== false)) {
    if (!skipBlocker(run)) skipBout(run);
    else if (!best) forfeitBout(run);
    else playMatch(run, best.f, top, opts.towel !== false, opts.items !== false, 'smart', opts.bet !== false);
  } else {
    playMatch(run, best.f, top, opts.towel !== false, opts.items !== false, 'smart', opts.bet !== false);
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
    if (pickF) playMatch(run, pickF.f, tier, opts.towel !== false, opts.items !== false, 'smart', opts.bet !== false);
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

// v6, the hidden plot. `opts.plot`: 'rebel' helps the rebels at every turn (and goes through with the coup);
// 'loyalist' helps until the prefect's offer, then names the names; 'bystander' buys political prisoners but always refuses. Without it, a bot takes the cautious first choice
// and the plot goes cold. Returns the order to try a plot card's choices in.
function plotOrder(run, side) {
  const choices = EVENT_BY_ID[run.event.id].choices;
  const all = [...choices.keys()];
  if (run.event.id === 'raid') return [2, 0, 3, 1].filter((i) => i < choices.length); // pass, bribe, bar the gates, hand over
  if (side === 'bystander') return all; // takes the prisoners, never the plot: the cautious first choice
  if (side === 'loyalist' && run.event.id === 'coupEve') return [0]; // a loyalist never strikes
  // The coup's eve: go ahead only when the champion has a fair chance against the Final's opponent; otherwise wait a year.
  if (run.event.id === 'coupEve') {
    const champ = run.roster.find((f) => f.id === run.plot.champion);
    const final = run.arenas[run.topTier].opponent;
    const o = champ && estimateOdds(champ, final, { ...matchOptions(run, champ, run.topTier), debuff: 'emperorsGaze', rebels: coupBonus(run), n: 200 });
    return o && o.win >= 0.4 ? [1, 0] : [0, 1];
  }
  if (side === 'loyalist') {
    const betray = all.filter((i) => choices[i].betray);
    if (betray.length) return betray;
  }
  return [...all.filter((i) => choices[i].help), ...all.filter((i) => !choices[i].help && !choices[i].betray)];
}

// The Emperor's summons (5.4.2): after the house's own bouts, send the weakest fighter still free (the careful bot tells them
// to yield at the Death Gate, the reckless one to fight to the death); refuse only if nobody can go.
function answerSummonsBot(run, strategy) {
  const order = strategy === 'careful' ? 'yield' : 'death';
  const free = run.roster.filter((f) => !summonsBlocker(run, f.id, order)).sort((a, b) => effectivePower(a) - effectivePower(b));
  if (free.length) answerSummons(run, free[0].id, order);
  else refuseSummons(run);
}

// `onWeek(run)`: optional, called at every step (for economy and other probes).
// `opts.setup`: the career's setup (e.g. { short: true } for a short career).
export function playCareer(seed, strategy = 'careful', { oddsSamples = 150, maxWeeks = 400, onWeek = null, ...opts } = {}) {
  const run = createRun(seed, opts.setup ?? {});
  let bouts = 0;
  // Version 6 (phase 5): dead months, the enemy of "one more turn". A fight month is dead when it ends with nothing new:
  // no match fought, no fighter, relic, gear, item, level, perk or building gained (Gold and Stress don't count).
  const stamp = () => JSON.stringify([
    run.history.filter((h) => !h.skipped && !h.forfeit).length, run.relics ?? [], run.roster.map((f) => [f.id, f.level ?? 1, f.perks?.length ?? 0, f.gear]),
    run.buildings.map((b) => [b.type, b.level]), run.inventory, run.fallen.length,
  ]);
  let months = 0, deadMonths = 0, monthStamp = null, stampWeek = -1;
  while (run.status === 'active' && run.week < maxWeeks) {
    onWeek?.(run);
    // Stamped once a month, after the month's draft and event are settled.
    if (isMonthStart(run.week) && !isWinter(run.week) && !run.fortune && !run.event && !run.bouts && stampWeek !== run.week) {
      if (monthStamp !== null) { months++; if (stamp() === monthStamp) deadMonths++; }
      monthStamp = stamp();
      stampWeek = run.week;
    }
    if (run.fortune) {
      if (opts.fortune === false) passFortune(run);
      else draftFortune(run, strategy);
      pickPerks(run); // a Visiting Champion may level someone up
      continue;
    }
    // Events: the careful bot takes the cautious (first) choice it can afford; the reckless one the boldest.
    if (run.event) {
      const n = EVENT_BY_ID[run.event.id].choices.length;
      // The Emperor's spy (5.4.0): a rebel house executes them (a kept spy feeds the Praetorians); others take the usual order.
      const spyOrder = run.event.id === 'emperorsSpy' && opts.plot === 'rebel' && run.plot && !run.plot.ended ? [1, 0] : null;
      const order = spyOrder ?? (run.event.plot && opts.plot ? plotOrder(run, opts.plot) : strategy === 'careful' ? [...Array(n).keys()] : [...Array(n).keys()].reverse());
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
      if (run.summons && run.status === 'active') { answerSummonsBot(run, strategy); pickPerks(run); } // a win may level them up
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
    months,
    deadMonths,
    fightMonths: Array.from({ length: run.week }, (_, w) => !isWinter(w)).filter(Boolean).length / 4, // the career's length in fight months
    relics: [...(run.relics ?? [])],
    favor: run.favor,
    tier: run.topTier,
    endReason: run.endReason,
  };
}

