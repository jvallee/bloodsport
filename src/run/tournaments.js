// L4 tournaments, matches, brackets, betting, consumables, Emperor's summons, mercy verdicts, and arena progression.

import { createRng, deriveSeed, next, pick } from '../rng.js';
import {
  ECONOMY, STRESS, HEAL_WEEKS, CIRCUITS, STAGES, XP, RENOWN, MORALE, GEAR, DECOR, FAVOR,
  INJURY_BY_TAG, CONSUMABLES, BLOODIED, FESTIVAL_BY_ID, HOUSES, SCARS, SCAR_CHANCE, SCAR_AFEARED, SPIKY_HARDENED_AT,
  SEVERE, BRACKET, MERCY, SHORT, BET, HYPE, SUMMONS,
} from '../data.js';
import { hasRelic, relicSum, relicFight } from '../fortune.js';
import { CELL_IDS } from '../plot.js';
import { SUMMONS_LINES } from '../quests.js';
import {
  createMatch, kindActive, effectiveInjuries, killMarks, meleeOnly, deathGateAt, hypeOf,
  playRound, throwTowel, canThrowTowel, mortalDanger, suggestTactic,
} from '../fight.js';
import { estimateOdds } from '../odds.js';
import { festivalOn, isWinter } from '../calendar.js';
import {
  GRAND_TIER, DEBUFF_IDS, createFighter, newId, remember, takenNames, clampStress, log,
  findFighter, chronicle, bumpMorale, talk, assertOk, effectivePower, arenaName, isChampionOf,
  crownChampion, isShort, hasDecree, hasPolicy, bossLossFavor, winsOf, foughtThisWeek, xpFor,
  gainXp, activeModalOrPendingBlocker, nextStage, addPrestige, clearHealedMedbay,
  removeFighter, changeFavor, checkLoss,
} from './helpers.js';
import { plotActive, changeSuspicion, addContact, resolveCoup } from './plotEngine.js';
import {
  arenaPower, boutFor, currentBout, hasBracket, bracketFor, bracketOf, crushingGapFor,
  opponentFor, opponentSpeed, seasonOpponent, newOpponent, openArena, restartCircuit,
  houseOf, houseForArena, houseTier, matchOptions, recordNemesis, nemesisFalls,
  rivalChampionResult, rivalChampionKilled,
} from './houses.js';
import { faceFear } from './roster.js';
import { relicRewards, settleWager } from './fortuneEngine.js';

// ---------- The Emperor's summons ----------

export const SUMMONS_ORDERS = ['yield', 'death'];

export function summonsMonth(run) {
  if (run.summons || run.summonsDone || run.week < SUMMONS.fromWeek || run.arenas[SUMMONS.tier] || isWinter(run.week)) return;
  run.rng.summons ??= createRng(deriveSeed(run.seed, 12));
  if (next(run.rng.summons) >= SUMMONS.chance) return;
  run.summons = { week: run.week };
  log(run, `The Emperor summons one of your fighters to ${arenaName(SUMMONS.tier)} on this month's fight day. Send someone, or refuse him (${SUMMONS.refuseFavor} Favour).`, 'warn');
  talk(run, `summons-${run.week}`, [{ speaker: 'emperor', text: SUMMONS_LINES.ask }, { speaker: 'steward', text: SUMMONS_LINES.steward(SUMMONS.refuseFavor) }], { now: true });
}

export function summonsBlocker(run, id, order) {
  const blocked = activeModalOrPendingBlocker(run);
  if (blocked) return blocked;
  if (!run.summons) return 'The Emperor has summoned nobody.';
  if (!run.bouts) return 'The summons is for fight day.';
  if (!SUMMONS_ORDERS.includes(order)) return 'Tell them to yield at the Death Gate, or to fight to the death.';
  const f = findFighter(run, id);
  if (!f) return 'Choose a fighter from your roster.';
  if (foughtThisWeek(run).includes(id)) return `${f.name} already fought this week.`;
  if (f.pendingPerks.length) return `${f.name} levelled up: choose a perk first.`;
  if (f.morale < MORALE.mutinous) return `${f.name} is mutinous and refuses to fight.`;
  return null;
}

export function answerSummons(run, id, order) {
  assertOk(summonsBlocker(run, id, order));
  const fighter = findFighter(run, id);
  const r = run.rng.summons ??= createRng(deriveSeed(run.seed, 12));
  const bout = { tier: SUMMONS.tier, boss: false, oppPower: arenaPower(run, SUMMONS.tier, 0) };
  const opp = createFighter(r, { id: newId(run, 'o'), power: bout.oppPower, decorLevel: CIRCUITS[SUMMONS.tier - 1].oppDecor, takenNames: takenNames(run), classes: run.setup?.classes });
  opp.speed = opponentSpeed(run, bout);
  seasonOpponent(run, opp, bout, r);
  opp.house = houseForArena(run, SUMMONS.tier, r).id;
  remember(run, opp);
  const house = houseOf(run, opp);
  const m = createMatch({
    a: fighter, b: opp, rng: r,
    overtrained: fighter.stress >= STRESS.overtrained,
    festival: festivalOn(run.week)?.id ?? null,
    grudge: house?.feud > 0 ? 1 : house?.owed > 0 ? -1 : 0,
    vengeance: house?.vengeance > 0,
    relics: relicFight(run, fighter),
  });
  while (!m.over) {
    if (order === 'yield' && canThrowTowel(m) && mortalDanger(m.a)) throwTowel(m);
    else playRound(m, { stance: suggestTactic(m) });
  }
  const newInjuries = m.a.f.injuries.filter((i) => i.weeksLeft === undefined).map((i) => INJURY_BY_TAG[i.tag].name);
  fighter.injuries = m.a.f.injuries.map(({ suppressed, ...i }) => ({ ...i, weeksLeft: i.weeksLeft ?? HEAL_WEEKS[i.tag] }));
  fighter.alive = m.a.f.alive;
  if (order === 'yield' && !fighter.alive) {
    fighter.alive = true;
    m.result = { winner: 'B', reason: 'towel' };
  }
  const coin = !fighter.alive && hasRelic(run, 'proserpina');
  if (coin) {
    fighter.alive = true;
    run.relics = run.relics.filter((rid) => rid !== 'proserpina');
  }
  fighter.stress = clampStress(fighter.stress + STRESS.fight);
  const won = m.result.winner === 'A';
  const reason = m.result.reason;
  const name = `${arenaName(SUMMONS.tier)} · the Emperor's summons`;
  const summary = {
    week: run.week, tier: SUMMONS.tier, name, summons: true, boss: false, top: false, won, reason, rounds: m.round,
    fighter: fighter.name, fighterId: fighter.id, opponent: opp.name, oppPower: effectivePower(opp),
    died: !fighter.alive, saved: coin, kill: won && reason === 'death', gold: 0, prestige: 0, favor: 0, renown: 0,
    injuries: fighter.alive ? newInjuries : [],
  };
  if (coin) {
    chronicle(run, fighter, `Fell in ${name} and was carried out alive: Proserpina took the coin instead.`);
    log(run, `${fighter.name} falls on the Imperial sand, but is carried out alive. Proserpina's Coin is spent.`, 'event');
  }
  const favorBefore = run.favor;
  let line;
  if (won) {
    changeFavor(run, SUMMONS.winFavor, 'won on the Imperial sand at his summons');
    summary.renown = SUMMONS.winRenown;
    chronicle(run, fighter, `Summoned to ${arenaName(SUMMONS.tier)} by the Emperor, and beat ${opp.name}.`);
    line = SUMMONS_LINES.won(fighter.name);
  } else if (!fighter.alive) {
    chronicle(run, fighter, `Summoned to ${arenaName(SUMMONS.tier)} by the Emperor, and killed by ${opp.name}.`);
    removeFighter(run, fighter, { fallen: { arena: true } });
    for (const f of run.roster) bumpMorale(f, MORALE.allyDeath);
    log(run, `${fighter.name} died on the Imperial sand. The house mourns; their gear returns to the storeroom.`, 'bad');
    line = SUMMONS_LINES.died(fighter.name);
    if (house) {
      house.vengeance = HOUSES.feudMonths;
      house.since = run.week;
    }
  } else if (reason === 'towel') {
    changeFavor(run, SUMMONS.yieldFavor, 'yielded on the Imperial sand');
    chronicle(run, fighter, `Summoned to ${arenaName(SUMMONS.tier)} by the Emperor; yielded to ${opp.name} and lived.`);
    line = SUMMONS_LINES.yielded(fighter.name);
  } else if (m.round >= 3) {
    changeFavor(run, SUMMONS.surviveFavor, 'survived three rounds on the Imperial sand');
    summary.renown = SUMMONS.surviveRenown;
    chronicle(run, fighter, `Summoned to ${arenaName(SUMMONS.tier)} by the Emperor; lost to ${opp.name}, but stood to the end.`);
    line = SUMMONS_LINES.survived(fighter.name);
  } else {
    changeFavor(run, SUMMONS.sweptFavor ?? -5, 'swept in two rounds on the Imperial sand');
    chronicle(run, fighter, `Summoned to ${arenaName(SUMMONS.tier)} by the Emperor; swept by ${opp.name} in two rounds.`);
    line = SUMMONS_LINES.swept ? SUMMONS_LINES.swept(fighter.name) : `${fighter.name} barely lasted two rounds on my sand. Do not waste my afternoon again.`;
  }
  if (fighter.alive) {
    fighter.renown += summary.renown;
    gainXp(run, fighter, won ? XP.win : XP.loss);
    if (won) faceFear(run, fighter, m.b);
    if (won && reason === 'death') {
      fighter.kills = (fighter.kills ?? 0) + 1;
      run.graveyard = [...(run.graveyard ?? []), opp.name];
      if (house) {
        house.feud = HOUSES.feudMonths;
        house.since = run.week;
      }
    }
  }
  summary.favor = run.favor - favorBefore;
  pushResult(run, summary);
  run.summons = null;
  run.summonsDone = true;
  const outcome = won ? 'won' : !summary.died ? (reason === 'towel' ? 'yielded at the Death Gate' : m.round >= 3 ? 'lost, but survived three rounds' : 'swept in two rounds') : 'killed';
  log(run, `The Emperor's summons: ${fighter.name} (Power ${effectivePower(fighter)}) against ${opp.name} (Power ${summary.oppPower}): ${outcome}${fighter.alive && newInjuries.length ? `, with ${newInjuries.join(', ')}` : ''}.${[summary.favor ? ` Favour ${summary.favor > 0 ? '+' : '−'}${Math.abs(summary.favor)}` : '', summary.renown ? ` +${summary.renown} Renown` : ''].filter(Boolean).join(',')}${summary.favor || summary.renown ? '.' : ''}`, won ? 'good' : summary.died ? 'bad' : 'event');
  talk(run, `summons-done-${run.week}`, [{ speaker: 'emperor', text: line }], { now: true });
  checkLoss(run);
  return summary;
}

export function refuseSummonsBlocker(run) {
  return activeModalOrPendingBlocker(run) ?? (run.summons ? null : 'The Emperor has summoned nobody.');
}

export function refuseSummons(run) {
  assertOk(refuseSummonsBlocker(run));
  changeFavor(run, SUMMONS.refuseFavor, "refused the Emperor's summons");
  run.summons = null;
  run.summonsDone = true;
  log(run, `You refuse the Emperor's summons. Favour ${SUMMONS.refuseFavor}.`, 'bad');
  talk(run, `summons-refused-${run.week}`, [{ speaker: 'emperor', text: SUMMONS_LINES.refused }], { now: true });
  checkLoss(run);
}

// ---------- Starting matches, consumables, betting ----------

export function fightBlocker(run, id, tier = run.topTier) {
  const blocked = activeModalOrPendingBlocker(run);
  if (blocked) return blocked;
  if (!run.bouts) return 'Fights happen on tournament weeks.';
  if (run.bouts[tier] !== 'open') return run.bouts[tier] ? 'This arena is settled for the week.' : 'That arena is not open to you.';
  const f = findFighter(run, id);
  if (!f) return 'Choose a fighter from your roster.';
  const bracket = bracketOf(run, tier);
  const midBracket = bracket?.fighterId && bracket.round > 0;
  if (midBracket && bracket.fighterId !== id) return `${findFighter(run, bracket.fighterId)?.name ?? 'Another fighter'} is in the bracket here.`;
  if (!midBracket && foughtThisWeek(run).includes(id)) return `${f.name} already fought this week.`;
  if (f.pendingPerks.length) return `${f.name} levelled up: choose a perk first.`;
  if (f.morale < MORALE.mutinous) return `${f.name} is mutinous and refuses to fight.`;
  if (!midBracket && run.prestige < boutFor(run, tier).buyIn) return `Needs ${boutFor(run, tier).buyIn} Prestige for the buy-in (you have ${run.prestige}).`;
  return null;
}

export function startMatch(run, id, tier = run.topTier) {
  assertOk(fightBlocker(run, id, tier));
  const bout = boutFor(run, tier);
  const fighter = findFighter(run, id);
  const bracket = bracketFor(run, tier);
  const buyIn = bracket?.round > 0 ? bracket.buyIn : bout.buyIn;
  if (!(bracket?.round > 0)) run.prestige -= buyIn;
  if (bracket) Object.assign(bracket, { fighterId: id, buyIn });
  run.inMatch = true;
  run.matchInfo = { fighterId: id, tier, buyIn };
  return createMatch({ a: fighter, b: opponentFor(run, tier), rng: run.rng.fight, ...matchOptions(run, fighter, tier) });
}

export function recordMatchProgress(run, match) {
  if (run.matchInfo) {
    run.matchInfo.progress = {
      injuries: structuredClone(match.a.f.injuries),
      alive: match.a.f.alive,
      round: match.round ?? 0,
      disabled: [...(match.a.disabled ?? [])],
    };
  }
}

export function useItemBlocker(run, match, key) {
  if (!run.inMatch || !match || match.over) return 'Items are used during a match.';
  if (match.itemsUsed?.includes(key)) return `Already used a ${CONSUMABLES[key]?.name ?? 'that item'} this fight (one of each kind per fight).`;
  if (!CONSUMABLES[key]) return 'Unknown item.';
  if (!run.inventory.items[key]) return `No ${CONSUMABLES[key].name} in the storeroom.`;
  return null;
}

export function useItem(run, match, key) {
  assertOk(useItemBlocker(run, match, key));
  const item = CONSUMABLES[key];
  run.inventory.items[key] -= 1;
  match.itemsUsed = [...(match.itemsUsed ?? []), key];
  if (item.boost) match.a.boosts = [...(match.a.boosts ?? []), { ...item.boost, name: item.name, round: match.round + 1 }];
  if (item.foe) match.b.boosts = [...(match.b.boosts ?? []), { ...item.foe, name: item.name, round: match.round + 1 }];
  if (item.salts) {
    for (const inj of match.a.f.injuries) if (['distracted', 'concussed'].includes(inj.tag)) inj.suppressed = true;
    match.a.disabled = match.a.disabled.filter((slot) => !match.a.distracted?.includes(slot));
  }
  if (item.bribe) match.bribe = true;
  if (item.stressAfter) match.stressAfter = item.stressAfter;
  log(run, `${match.a.f.name} uses ${item.name}.`, 'event');
}

// Bet odds are asked for several times before Round 1 (bot, blocker, bet); cache them per match, keyed by their inputs.
const betOddsCache = new WeakMap();
export function betOdds(run, match) {
  const tier = match.bout?.tier ?? run.matchInfo?.tier ?? run.topTier;
  const opts = { ...matchOptions(run, match.a.f, tier), useSignatures: false, n: 400, seed: 777 };
  const key = JSON.stringify([match.a.f, match.b.f, opts]);
  const hit = betOddsCache.get(match);
  if (hit?.key === key) return hit.odds;
  const { win } = estimateOdds(match.a.f, match.b.f, opts);
  const odds = Math.min(BET.maxOdds, BET.cut / Math.max(0.01, win));
  betOddsCache.set(match, { key, odds });
  return odds;
}

export const betCap = (run, match) => BET.perTier * Math.min(match.bout?.tier ?? run.matchInfo?.tier ?? run.topTier, CIRCUITS.length);
export const betPayout = (stake, odds) => Math.floor(stake * odds);

export function betBlocker(run, match, stake) {
  if (!run.inMatch || !match || match.over) return 'Bets are placed during a match.';
  if (match.round > 0) return 'Bets close when Round 1 begins.';
  if (match.bet) return 'You have already bet on this fight.';
  if (!(stake > 0)) return 'Choose a stake.';
  if (stake > betCap(run, match)) return `The bookmakers take up to ${betCap(run, match)} Gold here.`;
  if (run.gold < stake) return `Needs ${stake} Gold.`;
  const odds = betOdds(run, match);
  if (betPayout(stake, odds) <= stake) return `At ×${odds.toFixed(2)} a ${stake} Gold bet would win nothing: the bookmakers won't take it. Stake more, or keep your Gold.`;
  return null;
}

export function placeBet(run, match, stake) {
  assertOk(betBlocker(run, match, stake));
  const odds = betOdds(run, match);
  run.gold -= stake;
  match.bet = { stake, odds, payout: betPayout(stake, odds) };
  log(run, `You bet ${stake} Gold on ${match.a.f.name} at ×${odds.toFixed(2)}: a win returns ${match.bet.payout} Gold (+${match.bet.payout - stake}).`, 'event');
  return match.bet;
}

export const purseGold = (s) => s.gold - (s.bet?.won ? s.bet.payout + (s.bet.dice ?? 0) : 0);

function payHype(run, match, won, tier, summary) {
  const hype = hypeOf(match);
  if (!hype) return;
  const renown = Math.floor(hype / (won ? HYPE.renownPer : HYPE.lossRenownPer));
  const gold = won ? Math.floor(hype / HYPE.goldPer) * Math.min(tier, CIRCUITS.length) : 0;
  summary.hype = { hype, renown, gold };
  summary.renown += renown;
  summary.gold += gold;
}

function settleBet(run, match, won, summary) {
  if (!match.bet) return;
  summary.bet = { ...match.bet, won };
  if (won) {
    summary.gold += match.bet.payout;
    log(run, `The bookmakers pay out ${match.bet.payout} Gold on your ${match.bet.stake} Gold bet: +${match.bet.payout - match.bet.stake} profit.`, 'good');
    const dice = Math.floor(match.bet.stake * relicSum(run, 'betBonus'));
    if (dice) {
      summary.gold += dice;
      summary.bet.dice = dice;
      log(run, `The Loaded Dice: +${dice} Gold more.`, 'good');
    }
  } else log(run, `The ${match.bet.stake} Gold bet is lost.`, 'bad');
}

// ---------- Skip, forfeit, finish match ----------

export function skipBlocker(run) {
  const blocked = activeModalOrPendingBlocker(run);
  if (blocked) return blocked;
  if (!run.boutPending) return 'No bout to skip this week.';
  if (currentBout(run).boss) return 'Bosses cannot be skipped. Fight or forfeit.';
  return null;
}

export function skipBout(run) {
  assertOk(skipBlocker(run));
  run.gold += ECONOMY.skipGold;
  for (const f of run.roster) f.stress = clampStress(f.stress - ECONOMY.skipStressRelief);
  const bout = currentBout(run);
  run.history.push({ week: run.week, tier: bout.tier, name: bout.name, skipped: true });
  log(run, `You skip ${bout.name}: +${ECONOMY.skipGold} Gold, and the roster rests.`);
  settleBout(run, bout.tier);
  run.arenas[bout.tier].stage = nextStage(run, bout.tier);
  newOpponent(run, bout.tier);
  checkLoss(run);
}

export function forfeitBlocker(run) {
  const blocked = activeModalOrPendingBlocker(run);
  if (blocked) return blocked;
  if (!run.boutPending) return 'No bout this week.';
  if (!currentBout(run).boss) return 'Skip this tournament instead.';
  return null;
}

export function forfeitBout(run) {
  assertOk(forfeitBlocker(run));
  const bout = currentBout(run);
  run.history.push({ week: run.week, tier: bout.tier, name: bout.name, won: false, forfeit: true });
  log(run, `You forfeit ${bout.name}.`, 'bad');
  settleBout(run, bout.tier);
  changeFavor(run, bossLossFavor(bout.tier, run) + FAVOR.forfeitExtra, 'forfeited a Boss');
  if (bout.tier === GRAND_TIER) newOpponent(run, bout.tier);
  else restartCircuit(run, bout.tier);
  checkLoss(run);
}

function settleBout(run, tier) {
  if (run.bouts) run.bouts[tier] = 'done';
  if (tier === run.topTier) run.boutPending = false;
}

export const keepsBuyIn = (run, tier) => Boolean(BRACKET.bossFinalRefund) && tier !== GRAND_TIER && hasBracket(tier) && boutFor(run, tier).boss && bracketOf(run, tier)?.round === 2;

function pushResult(run, summary) {
  if (summary.won && !run.history.some((h) => h.won)) summary.firstWin = true;
  run.history.push(summary);
}

// Decor only works outside Iron Rules (the Boss debuff turns room decor off, as in the fight engine).
const decorWorks = (match) => match.a?.arena !== 'ironRules';
// Spiky Bed (7.1): a win with at least SPIKY_HARDENED_AT weight of wounds taken in this fight (old wounds don't count).
const newWoundWeight = (match) => match.a.f.injuries.filter((i) => i.weeksLeft === undefined).reduce((n, i) => n + (i.weight ?? 0), 0);
const spikyHardens = (match, fighter) => decorWorks(match) && fighter.decor?.spikyBed > 0 && newWoundWeight(match) >= SPIKY_HARDENED_AT;

export function finishMatch(run, match) {
  if (!run.inMatch) throw new Error('No match in progress.');
  if (!match.over) throw new Error('The match is not over.');
  const { tier } = run.matchInfo;
  const bout = { ...boutFor(run, tier), buyIn: run.matchInfo.buyIn ?? boutFor(run, tier).buyIn };
  const arena = run.arenas[tier];
  const fighter = findFighter(run, match.a.f.id);
  const bracket = bracketOf(run, tier);
  const opp = bracket && bracket.round < 2 ? bracket.foes[bracket.round] : arena.opponent;
  const newInjuries = match.a.f.injuries.filter((i) => i.weeksLeft === undefined).map((i) => INJURY_BY_TAG[i.tag].name);
  fighter.injuries = match.a.f.injuries.map(({ suppressed, ...i }) => ({ ...i, weeksLeft: i.weeksLeft ?? HEAL_WEEKS[i.tag] }));
  fighter.alive = match.a.f.alive;
  const coin = !fighter.alive && hasRelic(run, 'proserpina');
  if (coin) {
    fighter.alive = true;
    run.relics = run.relics.filter((id) => id !== 'proserpina');
  }
  fighter.stress = clampStress(fighter.stress + STRESS.fight + (match.stressAfter ?? 0));

  const won = match.result.winner === 'A';
  if (bracket && bracket.round < 2 && won && fighter.alive) return finishBracketMatch(run, match, fighter, opp, tier, bracket, newInjuries);

  const r1 = match.rounds?.[0]?.power;
  const gap = r1 ? r1.A.total - r1.B.total : effectivePower(fighter) - effectivePower(opp);
  const upset = gap < 0;
  const champion = tier !== GRAND_TIER && !bout.top && isChampionOf(fighter, tier);
  const crushing = won && !bout.top && !champion && fighter.renown >= ECONOMY.knownRenown && gap >= crushingGapFor(run, tier);
  const moraleBefore = fighter.morale;
  const levelBefore = fighter.level;
  if (bout.top) {
    fighter.topStreak = (fighter.topStreak ?? 0) + 1;
    fighter.foughtTopWeek = run.week;
  }
  const bloodied = won && effectiveInjuries(fighter) >= 2;
  const summary = {
    week: run.week, tier, name: bout.name, boss: bout.boss, top: bout.top, won, reason: match.result.reason,
    fighter: fighter.name, fighterId: fighter.id, died: !fighter.alive, gold: 0, prestige: -bout.buyIn, bloodFaith: false,
    title: null, favor: 0, xp: 0, renown: 0, loot: null, levelUp: null, crushing, champion: won && champion,
    injuries: fighter.alive ? newInjuries : [], morale: 0, levels: 0, bloodied, kill: false, mark: null, festival: bout.festival ?? null, saved: coin,
  };
  if (coin) {
    chronicle(run, fighter, `Fell in ${bout.name} and was carried out alive: Proserpina took the coin instead.`);
    log(run, `${fighter.name} falls, but is carried out alive. Proserpina's Coin is spent.`, 'event');
  }
  const favorBefore = run.favor;

  if (won) {
    const fest = bout.festival ? FESTIVAL_BY_ID[bout.festival] : null;
    summary.gold = bout.winGold + Math.floor(fighter.renown / RENOWN.goldPer);
    if (upset && fest?.upset) summary.gold *= fest.upset;
    summary.prestige += bout.buyIn + (champion ? 0 : bout.winPrestige);
    if (!crushing && !champion) {
      summary.renown = RENOWN.win + (bout.boss ? RENOWN.bossWin : 0) + (upset ? RENOWN.upset : 0) + (fighter.perks.includes('crowdPleaser') ? 1 : 0)
        + (fighter.decor.warBanner ?? 0) * DECOR.warBanner.renown + (bloodied ? BLOODIED.renown : 0) + (fest?.renown ?? 0)
        + (plotActive(run) && run.plot.crowdUntil > run.week ? 1 : 0);
    }
    if (bloodied) bumpMorale(fighter, BLOODIED.morale);
    if (match.result.reason === 'death') {
      const before = killMarks(fighter).length;
      fighter.kills = (fighter.kills ?? 0) + 1;
      summary.kill = true;
      const marks = killMarks(fighter);
      if (marks.length > before) {
        summary.mark = marks.at(-1).name;
        log(run, `${fighter.name} has ${fighter.kills} kills and earns the mark ${summary.mark}: ${marks.at(-1).desc}`, 'event');
      }
    }
    bumpMorale(fighter, crushing || champion ? MORALE.crowdJeers : MORALE.win);
    if (champion) {
      log(run, `The crowd boos ${fighter.name}, a champion of this arena picking on its newcomers.`, 'warn');
      changeFavor(run, FAVOR.championReturn, 'a champion fighting back in a lower arena');
    } else if (crushing) {
      log(run, `The crowd jeers ${fighter.name} for crushing a much weaker opponent.`, 'warn');
      changeFavor(run, FAVOR.crushingWin, 'a crushing win in a lower arena');
    }
    if (bout.top && bout.boss) changeFavor(run, FAVOR.bossWin, `beat ${bout.name}`);
    if (upset) changeFavor(run, FAVOR.upsetWin * (fest?.upset ?? 1), fest?.upset ? `an upset at the ${fest.name}` : 'an upset');
    if (bloodied) changeFavor(run, FAVOR.spectacleWin, 'a Bloodied Victory (won with 2+ injuries)');
    claimLoot(run, fighter, opp, summary, bout.boss && bout.top);
    if (tier !== GRAND_TIER) {
      fighter.arenaWins = { ...(fighter.arenaWins ?? {}), [tier]: (fighter.arenaWins?.[tier] ?? 0) + 1 };
      if (!isChampionOf(fighter, tier) && (bout.boss || fighter.arenaWins[tier] >= ECONOMY.titleWins)) {
        const titles = crownChampion(fighter, tier);
        summary.title = titles.join(', ');
        summary.titlePower = titles.length;
      }
    }
    if (tier === GRAND_TIER) {
      fighter.titles.push('Master of the Games');
      summary.title = 'Master of the Games';
    }
  } else {
    const earlyBoss = Boolean(bout.boss && bracket && bracket.round < 2);
    summary.gold = earlyBoss ? (BRACKET.earlyBossLossGold ?? 0) : bout.lossGold;
    bumpMorale(fighter, match.result.reason === 'towel' ? MORALE.towel : MORALE.loss);
    const bribed = (match.bribe || hasRelic(run, 'referee')) && match.result.reason === 'towel';
    summary.bribed = Boolean(bribed);
    if (match.result.reason === 'towel' && !bribed) summary.renown = RENOWN.towel;
    if (!fighter.alive && kindActive(match.a, 'bloodFaith', match.round)) {
      summary.bloodFaith = true;
      summary.gold += ECONOMY.bloodFaithGold * Math.min(tier, CIRCUITS.length);
      summary.prestige += bout.buyIn;
    }
    const refund = keepsBuyIn(run, tier) && !summary.bloodFaith ? Math.floor(bout.buyIn * BRACKET.bossFinalRefund) : 0;
    if (refund) {
      summary.prestige += refund;
      summary.refund = refund;
      log(run, `Reaching the Boss earns respect: ${refund === bout.buyIn ? `the ${refund} Prestige buy-in is` : `${refund} of the ${bout.buyIn} Prestige buy-in are`} returned.`, 'event');
    }
    const early = bracket && bracket.round < 2 && !hasDecree(run, 'harshJudges');
    if (bout.top && bout.boss) changeFavor(run, early ? Math.round(bossLossFavor(tier, run) * BRACKET.earlyBossLoss) : bossLossFavor(tier, run), early ? `lost the ${BRACKET.rounds[bracket.round]} of ${bout.name}` : `lost ${bout.name}`);
    else if (bout.top && match.result.reason === 'towel' && !bribed) changeFavor(run, FAVOR.topTowel, 'capitulated in your top arena');
  }

  const house = houseOf(run, opp);
  if (house) {
    summary.house = house.name;
    const t = tier === GRAND_TIER ? 0 : tier;
    if (won) {
      run.glory += tier === GRAND_TIER ? HOUSES.glory.grand : (bout.boss ? HOUSES.glory.boss : HOUSES.glory.win) * t;
      house.glory = Math.max(0, house.glory - HOUSES.glory.beaten);
      if (match.result.reason === 'death') {
        house.feud = HOUSES.feudMonths;
        house.since = run.week;
        run.graveyard = [...(run.graveyard ?? []), opp.name];
        summary.feud = `${house.name} swears revenge: their fighters get +1 Power against you for ${HOUSES.feudMonths} months.`;
        log(run, summary.feud, 'warn');
      }
    } else {
      house.glory += (bout.boss ? HOUSES.glory.boss : HOUSES.glory.win) * Math.max(1, t);
      house.tier = houseTier(house);
      if (!fighter.alive) {
        house.vengeance = HOUSES.feudMonths;
        house.since = run.week;
        summary.feud = `Your house wants vengeance on ${house.name}: +5% win chance against their fighters for ${HOUSES.feudMonths} months.`;
        log(run, summary.feud, 'event');
      }
    }
  }
  if (won && opp.nemesis) nemesisFalls(run, opp, fighter, tier, summary);
  if (opp.rivalChampion) {
    rivalChampionResult(run, opp, fighter, tier, won, summary);
    if (won && match.result.reason === 'death') rivalChampionKilled(run, opp.name);
  }
  settleBet(run, match, won, summary);
  payHype(run, match, won, tier, summary);
  relicRewards(run, fighter, won, summary);
  if (bout.top && run.wager) settleWager(run, won, summary);
  if (fighter.risen) {
    delete fighter.risen;
    summary.risen = true;
    chronicle(run, fighter, 'Fought again, back from the dead. The crowd chanted their name.');
    log(run, `The crowd chants ${fighter.name}'s name: the dead fighter walks the sand again.`, 'event');
  }
  summary.favor = run.favor - favorBefore;
  summary.morale = fighter.morale - moraleBefore;
  run.gold += summary.gold;
  const levelGain = addPrestige(run, summary.prestige + bout.buyIn);
  if (levelGain > 0) summary.levelUp = run.prestigeLevel;
  fighter.renown = Math.max(0, fighter.renown + summary.renown);
  summary.xp = xpFor(won, bout.boss, upset) + (bloodied ? BLOODIED.xp : 0) + relicSum(run, 'fightXp');

  if (won) {
    if (!run.history.some((h) => h.won && [fighter.id, fighter.revenantOf].includes(h.fighterId))) chronicle(run, fighter, `First win, in ${bout.name}.`);
    if (summary.kill && fighter.kills === 1) chronicle(run, fighter, `First kill: ${opp.name}${house ? ` of ${house.name}` : ''}.`);
    if (summary.title) chronicle(run, fighter, `Became ${summary.title}.`);
    if (summary.mark) chronicle(run, fighter, `Earned the mark ${summary.mark}.`);
    if (bout.boss && !summary.title) chronicle(run, fighter, `Beat the Boss ${opp.name}.`);
  }
  const hardening = bloodied || (won && spikyHardens(match, fighter));
  if (fighter.alive && hardening && !(fighter.scars ?? []).some((sc) => sc.id === 'hardened')) {
    fighter.scars = [...(fighter.scars ?? []), { id: 'hardened' }];
    summary.scar = 'Battle-Hardened';
    chronicle(run, fighter, bloodied ? 'Won bloodied and became Battle-Hardened.' : 'Won wounded, slept on spikes, and became Battle-Hardened.');
  }
  const severe = fighter.alive && newInjuries.length && match.a.f.injuries.some((i) => i.weeksLeft === undefined && SEVERE.includes(i.tag));
  if (severe && next(run.rng.growth) < SCAR_CHANCE) {
    const vs = meleeOnly(match.b ?? { f: opp }) ? 'melee' : 'ranged';
    const afeared = SCAR_AFEARED[fighter.humor] ?? SCAR_AFEARED.other;
    const roll = afeared > 0 ? next(run.rng.growth) : 1;
    const id = !(decorWorks(match) && fighter.decor?.skullRack > 0) && roll < afeared ? 'afeared' : 'enraged';
    if (!(fighter.scars ?? []).some((sc) => sc.vs === vs)) {
      fighter.scars = [...(fighter.scars ?? []), { id, vs }];
      summary.scar = `${SCARS[id].name} (${vs})`;
      chronicle(run, fighter, `${opp.name}'s blow left a scar: ${SCARS[id].name} against ${vs} fighters.`);
      log(run, `${fighter.name} is scarred: ${SCARS[id].name} against ${vs} fighters.`, 'warn');
    }
  }
  if (!fighter.alive) {
    chronicle(run, fighter, `Fell in ${bout.name}, killed by ${opp.name}.`);
    const fWins = winsOf(run, fighter);
    summary.eulogy = `Here lies ${fighter.name}: ${fWins} win${fWins === 1 ? '' : 's'}${fighter.kills ? `, ${fighter.kills} kill${fighter.kills === 1 ? '' : 's'}` : ''}${fighter.titles.length ? `, ${fighter.titles.join(', ')}` : ''}.`;
    removeFighter(run, fighter, { fallen: { arena: true } });
    for (const f of run.roster) bumpMorale(f, MORALE.allyDeath);
    log(run, `${fighter.name} died in ${bout.name}. The house mourns; their gear returns to the storeroom.`, 'bad');
  } else {
    gainXp(run, fighter, summary.xp);
    summary.levels = fighter.level - levelBefore;
    if (won) summary.fearConquered = faceFear(run, fighter, match.b);
  }
  clearHealedMedbay(run, fighter);
  run.inMatch = false;
  run.matchInfo = null;
  if (bracket) {
    summary.bracket = BRACKET.rounds[bracket.round];
    delete run.brackets[tier];
  }
  settleBout(run, tier);
  pushResult(run, summary);
  log(run, `${fighter.name} ${won ? 'won' : 'lost'} ${bout.name}.`, won ? 'good' : 'bad');
  const fought = (match.round ?? 0) > 0;
  if (!won && fought) recordNemesis(run, opp, tier, fighter, bout.boss);
  advanceArena(run, tier, won, arena.opponent, fought && opp === arena.opponent);
  if (tier === GRAND_TIER && plotActive(run) && run.plot.coup) resolveCoup(run, fighter, won, !bracket || bracket.round >= 2, match.result.reason);
  offerMercy(run, match, summary, fighter, opp, tier);
  if (won && opp.rebel && plotActive(run)) rebelBeaten(run, opp, match.result.reason === 'death' ? 'kill' : run.mercy ? null : 'spare');
  return summary;
}

function claimLoot(run, fighter, opp, summary, always) {
  const drops = [opp.gear?.weapon, opp.gear?.armor].filter(Boolean);
  if (!drops.length || !(always || next(run.rng.growth) < ECONOMY.lootChance)) return;
  summary.loot = pick(run.rng.growth, drops);
  run.inventory.gear.push(summary.loot);
  log(run, `${fighter.name} claims a ${GEAR[summary.loot].name} from the defeated ${opp.name}.`, 'good');
}

function finishBracketMatch(run, match, fighter, opp, tier, bracket, newInjuries) {
  const bout = boutFor(run, tier);
  const round = BRACKET.rounds[bracket.round];
  const nextRound = BRACKET.rounds[bracket.round + 1];
  const kill = match.result.reason === 'death';
  const bloodied = effectiveInjuries(fighter) >= 2;
  const summary = {
    week: run.week, tier, name: `${bout.name} · ${round}`, boss: false, top: bout.top, won: true, reason: match.result.reason, bloodied,
    fighter: fighter.name, fighterId: fighter.id, died: false, gold: BRACKET.purse * Math.min(tier, 4), prestige: BRACKET.prestigeTopOnly && !bout.top ? 0 : BRACKET.prestige, favor: 0,
    xp: XP.win, renown: 1, injuries: newInjuries, morale: 0, levels: 0, bracket: round, next: nextRound, kill, house: houseOf(run, opp)?.name ?? null,
  };
  const levelBefore = fighter.level;
  if (bloodied) {
    summary.renown += BLOODIED.renown;
    summary.xp += BLOODIED.xp;
    bumpMorale(fighter, BLOODIED.morale);
    const favorBefore = run.favor;
    changeFavor(run, FAVOR.spectacleWin, 'a Bloodied Victory (won with 2+ injuries)');
    summary.favor = run.favor - favorBefore;
    if (!(fighter.scars ?? []).some((sc) => sc.id === 'hardened')) {
      fighter.scars = [...(fighter.scars ?? []), { id: 'hardened' }];
      summary.scar = 'Battle-Hardened';
      chronicle(run, fighter, 'Won bloodied and became Battle-Hardened.');
    }
  } else if (spikyHardens(match, fighter) && !(fighter.scars ?? []).some((sc) => sc.id === 'hardened')) {
    fighter.scars = [...(fighter.scars ?? []), { id: 'hardened' }];
    summary.scar = 'Battle-Hardened';
    chronicle(run, fighter, 'Won wounded, slept on spikes, and became Battle-Hardened.');
  }
  if (opp.rivalChampion) {
    rivalChampionResult(run, opp, fighter, tier, true, summary);
    if (kill) rivalChampionKilled(run, opp.name);
  }
  settleBet(run, match, true, summary);
  relicRewards(run, fighter, true, summary);
  summary.xp += relicSum(run, 'fightXp');
  run.gold += summary.gold;
  const levelGain = addPrestige(run, summary.prestige);
  if (levelGain > 0) summary.levelUp = run.prestigeLevel;
  fighter.renown += summary.renown;
  gainXp(run, fighter, summary.xp);
  summary.levels = fighter.level - levelBefore;
  summary.fearConquered = faceFear(run, fighter, match.b);
  if (kill) {
    fighter.kills = (fighter.kills ?? 0) + 1;
    run.graveyard = [...(run.graveyard ?? []), opp.name];
  }
  claimLoot(run, fighter, opp, summary, false);
  const house = houseOf(run, opp);
  if (house) {
    run.glory += HOUSES.glory.win * Math.min(tier, 4);
    house.glory = Math.max(0, house.glory - HOUSES.glory.beaten);
  }
  bracket.round += 1;
  run.inMatch = false;
  run.matchInfo = null;
  pushResult(run, summary);
  log(run, `${fighter.name} wins the ${round} of ${bout.name}. On to the ${nextRound}.`, 'good');
  offerMercy(run, match, summary, fighter, opp, tier);
  if (opp.rebel && plotActive(run)) rebelBeaten(run, opp, kill ? 'kill' : run.mercy ? null : 'spare');
  return summary;
}

// ---------- Thumbs up or down ----------

function offerMercy(run, match, summary, fighter, opp, tier) {
  if (!summary.won || !fighter.alive || summary.kill || run.status !== 'active') return;
  const wounds = effectiveInjuries(match.b.f);
  if (wounds < MERCY.minInjuries) return;
  const house = houseOf(run, opp);
  const blood = Boolean(house?.feud || house?.vengeance) || wounds >= deathGateAt(match.b.f, match.b.arena);
  run.mercy = { fighterId: fighter.id, opp: opp.name, house: house?.id ?? null, crowd: blood ? 'kill' : 'spare', tier, top: Boolean(summary.top), at: run.history.length - 1, ...(opp.rivalChampion ? { rivalChampion: true } : {}) };
  summary.mercy = run.mercy.crowd;
}

export function spareFavor(run, mercy = run.mercy) {
  if (!mercy || mercy.crowd === 'kill' || run.demand?.id === 'kill') return 0;
  return mercy.top !== false || hasPolicy(run, 'edictOfMercy') ? MERCY.spareFavor : 0;
}

export function spareFavorWhy(run, mercy = run.mercy) {
  if (spareFavor(run, mercy)) return null;
  if (run.demand?.id === 'kill') return 'no Favour: the Emperor demanded a death this month';
  const why = mercy?.top === false && !hasPolicy(run, 'edictOfMercy') ? 'no Favour in a lower arena' : 'no Favour: the crowd wanted blood';
  return run.demand?.id === 'spare' ? `${why} (it still meets the Emperor's demand)` : why;
}

export const owedLeft = (run, mercy = run.mercy) => run.houses?.find((h) => h.id === mercy?.house)?.owed ?? 0;

export function mercyBlocker(run, choice) {
  const blocked = activeModalOrPendingBlocker(run, { allowEvent: true, allowMercy: true, allowFortune: true });
  if (blocked) return blocked;
  if (!run.mercy) return 'There is no beaten opponent waiting on your verdict.';
  if (!['spare', 'kill'].includes(choice)) return 'Thumbs up (spare) or thumbs down (kill).';
  return null;
}

function rebelBeaten(run, opp, verdict) {
  if (!verdict) { run.mercy.rebel = true; return; }
  if (verdict === 'spare') addContact(run, opp.name, pick(run.rng.plot, CELL_IDS), 'spared');
  else {
    run.plot.trust = Math.max(0, run.plot.trust - 3);
    log(run, 'Overnight, every chalk mark on your doors is washed away.', 'warn');
  }
}

export function resolveMercy(run, choice) {
  assertOk(mercyBlocker(run, choice));
  const { fighterId, opp, house: houseId, crowd, at, rebel = false, rivalChampion = false } = run.mercy;
  if (rivalChampion && choice === 'kill') rivalChampionKilled(run, opp);
  const top = run.mercy.top ?? true;
  const favorFor = spareFavor(run);
  if (rebel && plotActive(run)) rebelBeaten(run, { name: opp }, choice);
  if (choice === 'spare' && crowd === 'kill' && top && plotActive(run)) changeSuspicion(run, 5);
  run.mercy = null;
  const fighter = findFighter(run, fighterId);
  const house = run.houses?.find((h) => h.id === houseId) ?? null;
  const out = { verdict: choice, crowd, favor: 0, renown: 0, morale: 0, kill: false, mark: null, feud: null, owed: null };
  if (choice === 'spare') {
    if (favorFor) {
      const before = run.favor;
      changeFavor(run, favorFor, `spared ${opp}`);
      out.favor = run.favor - before;
    }
    log(run, `Thumbs up: ${fighter.name} spares ${opp}.${out.favor ? ' The Emperor approves of clemency.' : crowd === 'kill' && top ? " In the imperial box, the Emperor's thumb stays down." : ''}`, 'good');
    if (crowd === 'kill' && house && !(house.owed > 0)) {
      house.feud = 0;
      house.owed = HOUSES.feudMonths;
      house.since = run.week;
      out.owed = `${house.name} owes you a life: their fighters get −1 Power against you for ${HOUSES.feudMonths} months.`;
      log(run, out.owed, 'good');
    }
  } else {
    out.renown = MERCY.killRenown + (crowd === 'spare' ? MERCY.infamyRenown : 0);
    const marksBefore = killMarks(fighter).length;
    fighter.kills = (fighter.kills ?? 0) + 1;
    out.kill = true;
    log(run, `Thumbs down: ${fighter.name} finishes ${opp}.`, 'warn');
    if (fighter.kills === 1) chronicle(run, fighter, `First kill: ${opp}${house ? ` of ${house.name}` : ''}, ${crowd === 'kill' ? "at the crowd's demand" : 'though the crowd begged mercy'}.`);
    const marks = killMarks(fighter);
    if (marks.length > marksBefore) {
      out.mark = marks.at(-1).name;
      chronicle(run, fighter, `Earned the mark ${out.mark}.`);
      log(run, `${fighter.name} has ${fighter.kills} kills and earns the mark ${out.mark}: ${marks.at(-1).desc}`, 'event');
    }
    run.graveyard = [...(run.graveyard ?? []), opp];
    if (house && crowd !== 'kill') {
      house.feud = HOUSES.feudMonths;
      house.since = run.week;
      out.feud = `${house.name} swears revenge: their fighters get +1 Power against you for ${HOUSES.feudMonths} months.`;
      log(run, out.feud, 'warn');
    }
  }
  if (choice === crowd || (choice === 'spare' && fighter.perks.includes('merciful'))) {
    out.renown += MERCY.crowdRenown;
    out.morale = MERCY.crowdMorale;
    bumpMorale(fighter, MERCY.crowdMorale);
    log(run, `The crowd roars its approval for ${fighter.name}.`, 'good');
  }
  fighter.renown += out.renown;
  const summary = run.history[at];
  if (summary) {
    Object.assign(summary, {
      verdict: choice, owed: out.owed, kill: summary.kill || out.kill, mark: out.mark ?? summary.mark ?? null, feud: out.feud ?? summary.feud,
      renown: (summary.renown ?? 0) + out.renown, favor: (summary.favor ?? 0) + out.favor, morale: (summary.morale ?? 0) + out.morale,
    });
  }
  return out;
}

// ---------- Withdraw and arena progression ----------

export function withdrawBlocker(run, tier) {
  const blocked = activeModalOrPendingBlocker(run);
  if (blocked) return blocked;
  const b = bracketOf(run, tier);
  if (!b?.fighterId || b.round === 0) return 'Nothing to withdraw from.';
  if (!findFighter(run, b.fighterId)) return 'No such fighter in the bracket.';
  const bout = boutFor(run, tier);
  if (bout.debuff === 'emperorsGaze' && b.round >= 2) return "The Emperor's Gaze is on the Final: you cannot withdraw.";
  if (tier === GRAND_TIER && run.plot?.coup && !run.plot.ended && b.round >= 2 && b.fighterId === run.plot.champion) {
    return 'The rising is set for the Final: your champion cannot withdraw now.';
  }
  return null;
}

export function withdraw(run, tier) {
  assertOk(withdrawBlocker(run, tier));
  const b = bracketOf(run, tier);
  const f = structuredClone(findFighter(run, b.fighterId));
  run.inMatch = true;
  run.matchInfo = { fighterId: f.id, tier, buyIn: b.buyIn };
  return finishMatch(run, { over: true, round: 0, rounds: [], result: { winner: 'B', reason: 'towel' }, a: { f, disabled: [], arena: null } });
}

export function advanceArena(run, tier, won, opp, beatYou = true) {
  const arena = run.arenas[tier];
  if (tier === GRAND_TIER) {
    if (won) {
      run.status = 'won';
      run.endReason = 'You won the Grand Tournament. The Emperor names you Master of the Games.';
      run.fortune = null;
      return;
    }
    newOpponent(run, tier);
  } else if (arena.stage < 2) {
    arena.stage = nextStage(run, tier);
    newOpponent(run, tier);
  } else if (won) {
    arena.rival = null;
    if (!arena.conquered) {
      arena.conquered = true;
      log(run, `${arenaName(tier)} conquered!`, 'event');
      const nextTier = tier + 1;
      run.topTier = nextTier;
      for (const f of run.roster) f.topStreak = 0;
      openArena(run, nextTier);
      log(run, nextTier === GRAND_TIER ? 'The Grand Tournament awaits.' : `${arenaName(nextTier)} opens its gates to you. Your old arenas still hold bouts every month.`, 'event');
    }
    restartCircuit(run, tier);
  } else {
    if (tier === run.topTier) {
      const basePower = arenaPower(run, tier) + (isShort(run) ? SHORT.rival : 1);
      arena.rival = { ...structuredClone(opp), power: basePower, renown: opp.renown + 2, rival: true, injuries: [], alive: true };
      log(run, beatYou ? `${opp.name} will remember this, and will be waiting for you.` : `${opp.name} never had to fight you. They will be waiting next time, stronger.`, 'warn');
    }
    if (isShort(run) && SHORT.rematch && tier === run.topTier) {
      arena.debuff = pick(run.rng.opponents, DEBUFF_IDS);
      newOpponent(run, tier);
    } else restartCircuit(run, tier);
  }
  checkLoss(run);
}
