// L5 career setup, weekly tick, skip-to-tournament, and annual tribute / year-end purse.

import { createRng, deriveSeed, int, pick, randomSeed } from '../rng.js';
import {
  ECONOMY, STRESS, STARTING_BUILDINGS, XP, MORALE, FAVOR, TRIBUTE, REVOLT, INJURY_BY_TAG,
  HOUSES, PATRONS, BRACKET, SHORT, FORTUNE,
} from '../data.js';
import { RELICS, relicSum } from '../fortune.js';
import { CELL_IDS } from '../plot.js';
import { EVENT_BY_ID } from '../events.js';
import { isTournamentWeek, isMonthStart, dateOf, WEEKS_PER_YEAR } from '../calendar.js';
import { prestigeLevelFor, trainCost, healRate, stressRelief } from '../ludus.js';
import {
  SAVE_VERSION, emptyDecor, emptyItems, createFighter, newId, takenNames, clampStress, log,
  findFighter, chronicle, isTraining, releaseTalk, assertOk, decorCalm, trainStress, netTrainStress,
  unlockedTiers, arenaName, trainGain, hasDecree, hasUnlock, heatDecrees, idleBlocker,
  clearHealedMedbay, changeFavor, checkLoss,
} from './helpers.js';
import { plotActive, joinPlot, plotMonth, postponeCoup, rollPlot } from './plotEngine.js';
import {
  makeHouses, standings, rivalsCompete, drawBrackets, openArena, arenaMovesOn, archrival,
  rivalMonth, rivalPoach, bondOverFightDay, tendBonds, issueDemand, judgeDemand,
} from './houses.js';
import {
  refreshMarket, refreshLiaison, refreshArmourer, trainBlocker, switchToRest, resumeTraining, moraleTarget,
  meditate, driftHumour,
} from './roster.js';
import { checkQuests, wantsMonth, rebelQuestsMonth } from './questsEngine.js';
import { fortuneMonth, loseWager, relicInPool } from './fortuneEngine.js';
import { rollEvent } from './eventsEngine.js';
import { summonsMonth } from './tournaments.js';

// ---------- Career setup ----------

export function createRun(seed = randomSeed(), setup = {}) {
  const housesRng = createRng(deriveSeed(seed, 6));
  const run = {
    version: SAVE_VERSION,
    seed,
    setup: {
      patron: setup.patron ?? null,
      decrees: [...(setup.heat ? heatDecrees(setup.heat) : setup.decrees ?? [])],
      classes: [...(setup.classes ?? [])],
      short: Boolean(setup.short),
      daily: setup.daily ?? null,
      heat: setup.heat ?? 0,
      unlocks: [...(setup.unlocks ?? [])],
      legends: [...(setup.legends ?? [])],
      colour: setup.colour ?? null,
    },
    gold: ECONOMY.startGold + (setup.short ? SHORT.startGold : 0),
    prestige: ECONOMY.startPrestige + (setup.short ? SHORT.startPrestige : 0),
    prestigeLevel: prestigeLevelFor(ECONOMY.startPrestige + (setup.short ? SHORT.startPrestige : 0), 1),
    favor: FAVOR.start,
    week: 0,
    topTier: 1,
    arenas: {},
    bouts: null,
    boutPending: false,
    roster: [],
    fallen: [],
    market: [],
    liaisonOffers: [],
    armourerStock: [],
    inventory: { decor: emptyDecor(), gear: [], items: emptyItems() },
    buildings: [],
    status: 'active',
    endReason: null,
    inMatch: false,
    matchInfo: null,
    revoltWeeks: 0,
    history: [],
    log: [],
    actions: [],
    nextId: 1,
    rng: {
      market: createRng(deriveSeed(seed, 1)),
      opponents: createRng(deriveSeed(seed, 2)),
      fight: createRng(deriveSeed(seed, 3)),
      growth: createRng(deriveSeed(seed, 4)),
      events: createRng(deriveSeed(seed, 5)),
      houses: housesRng,
      plot: createRng(deriveSeed(seed, 8)),
      fortune: createRng(deriveSeed(seed, 13)),
    },
    relics: [],
    fortune: null,
    plot: null,
    houses: makeHouses(housesRng),
    glory: 0,
    event: null,
  };
  for (const type of STARTING_BUILDINGS) run.buildings.push({ id: newId(run, 'b'), type, level: 1 });
  if (hasUnlock(run, 'oracle')) run.buildings.push({ id: newId(run, 'b'), type: 'oracle', level: 1 });
  openArena(run, 1);
  refreshMarket(run);
  log(run, `You take charge of a bottom-tier Ludus in ${arenaName(1)}.`);
  applyPatron(run);
  archrival(run);
  return run;
}

function applyPatron(run) {
  const p = run.setup.patron;
  if (!p || !PATRONS[p]) return;
  const rng = createRng(deriveSeed(run.seed, 7));
  if (p === 'purse') run.gold += 10;
  if (p === 'friend') run.favor = Math.min(FAVOR.max, run.favor + 15);
  if (p === 'warChest') {
    run.inventory.items.warPaint += 2;
    run.inventory.items.blessedBandage += 1;
  }
  if (p === 'veteran' || p === 'defector') {
    const f = createFighter(rng, { id: newId(run, 'f'), bonusPower: p === 'defector' ? 3 : 2, takenNames: takenNames(run), classes: run.setup.classes });
    if (p === 'veteran') Object.assign(f, { level: 3, xp: XP.levels[1], perks: ['thickSkin', 'killer'], speed: f.speed + 3, renown: 4 });
    else Object.assign(f, { renown: 5, origin: pick(rng, run.houses).name });
    run.roster.push(f);
    chronicle(run, f, p === 'veteran' ? 'A veteran sent by your patron.' : `Defected from ${f.origin}.`);
  }
  if (p === 'augur') {
    const pool = Object.keys(RELICS).filter((r) => RELICS[r].rarity !== 'common' && relicInPool(run, r));
    const cards = [];
    while (cards.length < FORTUNE.cards && pool.length) cards.push({ kind: 'relic', id: pool.splice(int(rng, 0, pool.length - 1), 1)[0] });
    for (const c of cards) c.rarity = RELICS[c.id].rarity;
    run.fortune = { cards, rerolls: 0, augur: true };
  }
  if (p === 'liberator') {
    const f = createFighter(rng, { id: newId(run, 'f'), takenNames: takenNames(run), classes: run.setup.classes });
    f.political = { cell: pick(run.rng.plot, CELL_IDS) };
    f.origin = 'Sent by friends of the rising';
    run.roster.push(f);
    chronicle(run, f, 'Arrived at night, with a broken chain tattooed on one wrist.');
    joinPlot(run, f);
  }
  log(run, `Your patron: ${PATRONS[p].name}. ${PATRONS[p].desc}`, 'event');
}

// ---------- Weekly progression ----------

export function advanceBlocker(run) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (run.event) return `Decide this week's event first: "${EVENT_BY_ID[run.event.id].title}".`;
  if (run.fortune) return "Choose this month's Fortune first.";
  const midBracket = Object.entries(run.brackets ?? {}).find(([t, b]) => b.fighterId && b.round > 0 && run.bouts?.[t] === 'open');
  if (midBracket) return `${findFighter(run, midBracket[1].fighterId)?.name ?? 'Your fighter'} is through to the ${BRACKET.rounds[midBracket[1].round]} in ${arenaName(Number(midBracket[0]))}: fight on, or withdraw.`;
  if (run.summons && run.bouts) return "The Emperor's summons: send a fighter to the Imperial Coliseum, or refuse him.";
  if (run.boutPending) return `Tournament week: send a fighter to ${arenaName(run.topTier)}, or skip the bout first.`;
  if (run.roster.some((f) => f.pendingPerks.length)) return 'A fighter levelled up: choose their perk first.';
  return null;
}

export function advanceWeek(run) {
  assertOk(advanceBlocker(run));
  const tournamentEnds = Boolean(run.bouts);
  const relief = stressRelief(run);
  for (const f of run.roster) {
    if (isTraining(f.job)) {
      const cannot = trainBlocker(run, f, { checkGold: false }) ?? (run.gold < trainCost(run) ? `not enough Gold for the trainer's fee (${trainCost(run)}).` : null);
      if (cannot) switchToRest(run, f, cannot);
    }
    if (isTraining(f.job)) {
      const cost = trainCost(run);
      const stat = f.job === 'trainPower' ? 'power' : 'speed';
      const gain = trainGain(run, stat);
      f[stat] += gain;
      f.trained += 1;
      if (stat === 'power') f.trainedPower = (f.trainedPower ?? 0) + gain;
      run.gold -= cost;
      f.stress = clampStress(f.stress + trainStress(run, f));
      log(run, `${f.name} trains: +${gain} ${stat === 'power' ? 'Power' : 'Speed'}.`, 'good');
    }
    if (f.job === 'medbay') {
      let heal = healRate(run) + relicSum(run, 'heal');
      while (heal > 0 && f.injuries.length) {
        const inj = f.injuries[0];
        const used = Math.min(heal, inj.weeksLeft);
        inj.weeksLeft -= used;
        heal -= used;
        if (inj.weeksLeft <= 0) {
          f.injuries.shift();
          log(run, `${f.name}'s ${INJURY_BY_TAG[inj.tag].name} has healed.`, 'good');
        }
      }
      f.stress = clampStress(f.stress + STRESS.medbay);
      clearHealedMedbay(run, f, { logLeave: true });
    } else if (f.job === 'rest') {
      f.stress = clampStress(f.stress + STRESS.rest);
      const light = f.injuries.find((i) => i.tag === 'fleshWound' && i.weeksLeft !== undefined);
      if (light) {
        light.weeksLeft -= 0.5;
        if (light.weeksLeft <= 0) {
          f.injuries = f.injuries.filter((i) => i !== light);
          log(run, `${f.name}'s Flesh Wound has healed with rest.`, 'good');
        }
      }
    }
    if (f.job !== 'medbay') {
      for (const inj of f.injuries.filter((i) => !i.weight)) inj.weeksLeft -= 1;
      const cleared = f.injuries.filter((i) => !i.weight && i.weeksLeft <= 0);
      if (cleared.length) {
        f.injuries = f.injuries.filter((i) => !cleared.includes(i));
        log(run, `${f.name} shakes off the daze.`, 'good');
      }
    }
    const calm = decorCalm(f);
    f.stress = clampStress(f.stress - relief - calm);
    meditate(run, f);
    driftHumour(run, f);
    const { target } = moraleTarget(run, f);
    f.morale = f.morale < target ? Math.min(target, f.morale + MORALE.drift) : Math.max(target, f.morale - MORALE.driftDown);
    if (f.mood && --f.mood.weeks <= 0) delete f.mood;
    if (isTraining(f.job)) {
      const nextBlock = trainBlocker(run, f, { checkGold: false });
      if (nextBlock) switchToRest(run, f, nextBlock);
    } else if (f.job === 'rest' && f.resume) resumeTraining(run, f);
    if (f.stress >= STRESS.overtrained) log(run, `${f.name} is overtrained (Stress ${f.stress}). Rest them before a fight.`, 'warn');
    if (f.morale < MORALE.mutinous) log(run, `${f.name} is mutinous and refuses to fight.`, 'bad');
  }
  tendBonds(run);
  const avg = run.roster.length ? run.roster.reduce((s, f) => s + f.morale, 0) / run.roster.length : 100;
  run.revoltWeeks = avg < REVOLT.morale ? run.revoltWeeks + 1 : 0;
  if (run.revoltWeeks) log(run, `The gladiators are close to revolt (${run.revoltWeeks}/${REVOLT.weeks} weeks).`, 'bad');

  if (run.bouts) for (const f of run.roster) if (f.foughtTopWeek !== run.week) f.topStreak = 0;
  if (run.bouts) for (const tier of unlockedTiers(run)) if (tier < run.topTier && run.bouts[tier] === 'open') arenaMovesOn(run, tier);
  if (tournamentEnds) judgeDemand(run);
  if (tournamentEnds && run.wager) loseWager(run, 'the house never fought its top-arena tournament');
  rivalPoach(run);
  run.bouts = null;
  run.brackets = {};
  run.week += 1;
  releaseTalk(run);
  const d = dateOf(run.week);
  const monthStart = isMonthStart(run.week);
  if (monthStart) {
    refreshMarket(run);
    refreshLiaison(run);
    refreshArmourer(run);
    plotMonth(run);
    issueDemand(run);
    summonsMonth(run);
    wantsMonth(run);
    rivalMonth(run);
    rebelQuestsMonth(run);
  }
  if (run.plot?.hidden && --run.plot.hidden <= 0) { delete run.plot.hidden; log(run, 'The stranger in the Medbay slipped away before dawn.', 'event'); }
  if (!d.winter && d.month === 'December' && d.weekOfMonth === 1) if (!tributePaid(run)) log(run, `The Emperor's tribute of ${tributeDue(run)} Gold is due at the start of winter.`, 'warn');
  if (run.week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - 4) {
    payYearPurse(run);
    collectTribute(run);
    for (const f of run.roster) f.topStreak = 0;
  }
  if (isTournamentWeek(run.week)) {
    run.bouts = Object.fromEntries(unlockedTiers(run).map((t) => [t, 'open']));
    drawBrackets(run);
    run.boutPending = true;
    log(run, `Tournament week in ${unlockedTiers(run).length > 1 ? `${unlockedTiers(run).length} arenas` : arenaName(run.topTier)}.`, 'event');
  }
  if (tournamentEnds) rivalsCompete(run);
  if (tournamentEnds) bondOverFightDay(run);
  if (tournamentEnds && plotActive(run) && run.plot.coup) postponeCoup(run);
  checkQuests(run);
  checkLoss(run);
  if (monthStart && run.status === 'active') fortuneMonth(run);
  if (run.status === 'active') {
    const recentBefore = run.recentEvents;
    const eventMonthBefore = run.eventMonth;
    rollEvent(run);
    rollPlot(run, recentBefore, eventMonthBefore);
  }
}

export function overtrainedByWeek(run) {
  if (advanceBlocker(run)) return [];
  const copy = structuredClone(run);
  try { advanceWeek(copy); } catch { return []; }
  return run.roster.filter((f) => isTraining(f.job) && f.stress < STRESS.overtrained && (findFighter(copy, f.id)?.stress ?? 0) >= STRESS.overtrained);
}

export function advanceToTournament(run) {
  let weeks = 0;
  const guard = () => {
    for (const f of run.roster) {
      if (isTraining(f.job) && f.stress + netTrainStress(run, f) >= STRESS.overtrained) {
        switchToRest(run, f, `another week of training would overtrain them (Stress ${f.stress}).`);
      }
    }
  };
  while (!run.boutPending && run.status === 'active' && !advanceBlocker(run)) {
    guard();
    advanceWeek(run);
    weeks++;
  }
  if (run.boutPending) guard();
  return weeks;
}

// ---------- Tribute and year-end purse ----------

const tributeYear = (run) => dateOf(run.week).year + (dateOf(run.week).winter ? 1 : 0);
const tributePolicyFor = (run, year) => (run.policies ?? []).find((p) => p.id === 'lowerTribute' && p.until > run.week && (p.usedYear === undefined || p.usedYear === year));
const tributeAmount = (run, year) => Math.round(TRIBUTE.perYear * year * (hasDecree(run, 'greedyEmperor') ? 1.5 : 1) * (tributePolicyFor(run, year) ? 0.7 : 1));

export const tributeDue = (run) => tributeAmount(run, tributeYear(run));
export const tributePaid = (run) => run.tributePaid === tributeYear(run);

export function payTributeBlocker(run) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (tributePaid(run)) return "This year's tribute is already paid.";
  if (run.gold < tributeDue(run)) return `Needs ${tributeDue(run)} Gold.`;
  return null;
}

export function payTribute(run) {
  assertOk(payTributeBlocker(run));
  const year = tributeYear(run);
  const due = tributeAmount(run, year);
  const pol = tributePolicyFor(run, year);
  if (pol) pol.usedYear = year;
  run.gold -= due;
  run.tributePaid = year;
  log(run, `You pay the Emperor's tribute early: ${due} Gold.`, 'event');
}

function payYearPurse(run) {
  if (!run.houses) return;
  const rank = standings(run).findIndex((h) => h.you);
  const year = dateOf(run.week).year;
  const purse = (HOUSES.yearPurse[rank] ?? 0) * year;
  if (purse) run.gold += purse;
  log(run, `The year-end purse: your house finished #${rank + 1} of ${run.houses.length + 1} in Glory${purse ? ` and is paid ${purse} Gold` : ', and is paid nothing'}.`, purse ? 'good' : 'warn');
}

function collectTribute(run) {
  const year = dateOf(run.week).year;
  const due = tributeAmount(run, year);
  const pol = tributePolicyFor(run, year);
  if (run.tributePaid === year) {
    log(run, "The Emperor's collectors find your tribute already paid.", 'event');
  } else if (run.gold >= due) {
    if (pol) pol.usedYear = year;
    run.gold -= due;
    log(run, `You pay the Emperor's tribute: ${due} Gold.`, 'event');
  } else {
    if (pol) pol.usedYear = year;
    log(run, `You can't pay the ${due} Gold tribute. The Emperor takes what you have, and remembers.`, 'bad');
    run.gold = 0;
    changeFavor(run, FAVOR.unpaidTribute, 'unpaid tribute');
  }
}
