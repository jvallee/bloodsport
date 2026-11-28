// L4 tournaments, matches, brackets, betting, consumables, Emperor's summons, mercy verdicts, and arena progression.

import { createRng, deriveSeed, next, pick } from '../rng.js';
import {
  ECONOMY, STRESS, HEAL_WEEKS, CIRCUITS, STAGES, XP, RENOWN, MORALE, GEAR, DECOR, FAVOR,
  INJURY_BY_TAG, CONSUMABLES, BLOODIED, FESTIVAL_BY_ID, HOUSES, SCARS, SCAR_CHANCE, SCAR_AFEARED, SPIKY_HARDENED_AT,
  SEVERE, BRACKET, MERCY, SHORT, BET, HYPE, SUMMONS, HOUSE_DEBT,
} from '../data.js';
import { hasRelic, relicSum, relicFight } from '../fortune.js';
import { CELL_IDS } from '../plot.js';
import { SUMMONS_LINES } from '../quests.js';
import { lastWordsFor } from '../voices.js';
import {
  createMatch, computePower, kindActive, effectiveInjuries, killMarks, meleeOnly, deathGateAt, hypeOf,
  playRound, throwTowel, canThrowTowel, mortalDanger, suggestTactic,
} from '../fight.js';
import { estimateOdds } from '../odds.js';
import { festivalOn, isWinter } from '../calendar.js';
import { oracleLevel } from '../ludus.js';
import {
  GRAND_TIER, DEBUFF_IDS, createFighter, newId, remember, takenNames, clampStress, log,
  findFighter, chronicle, bumpMorale, talk, assertOk, effectivePower, arenaName, championTitle, isChampionOf,
  crownChampion, isShort, hasDecree, hasPolicy, bossLossFavor, winsOf, foughtThisWeek, xpFor,
  gainXp, activeModalOrPendingBlocker, isInActiveBracket, bracketLockReason, nextStage, addPrestige, clearHealedMedbay,
  removeFighter, changeFavor, checkLoss, unlockedTiers, queueMilestone, pruneFighterDialogue, createDialogueState,
} from './helpers.js';
import { plotActive, changeSuspicion, addContact, resolveCoup } from './plotEngine.js';
import {
  arenaPower, boutFor, currentBout, hasBracket, bracketFor, bracketOf, crushingGapFor,
  opponentFor, opponentSpeed, seasonOpponent, newOpponent, openArena, restartCircuit,
  houseOf, houseForArena, houseTier, matchOptions, recordNemesis, nemesisFalls,
  rivalChampionResult, rivalChampionKilled, debtPenaltyFor,
} from './houses.js';
import { espionageAtMatch } from './espionage.js';
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
  if (!SUMMONS_ORDERS.includes(order)) return 'Tell them to capitulate at the Death Gate, or to fight to the death.';
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
  const isFirstFight = !run.history.some((h) => h.fighterId === fighter.id);
  const r = run.rng.summons ??= createRng(deriveSeed(run.seed, 12));
  const bout = { tier: SUMMONS.tier, boss: false, oppPower: arenaPower(run, SUMMONS.tier, 0) };
  const opp = createFighter(r, { id: newId(run, 'o'), power: bout.oppPower, decorLevel: CIRCUITS[SUMMONS.tier - 1].oppDecor, takenNames: takenNames(run), classes: run.setup?.classes });
  opp.speed = opponentSpeed(run, bout);
  seasonOpponent(run, opp, bout, r);
  opp.house = houseForArena(run, SUMMONS.tier, r).id;
  remember(run, opp);
  const house = houseOf(run, opp);
  const debt = debtPenaltyFor(house);
  const m = createMatch({
    a: fighter, b: opp, rng: r,
    summons: true,
    overtrained: fighter.stress >= STRESS.overtrained,
    festival: festivalOn(run.week)?.id ?? null,
    grudge: house?.feud > 0 ? 1 : house?.owed > 0 ? -1 : 0,
    vengeance: house?.vengeance > 0,
    relics: relicFight(run, fighter),
    ...(debt ? { debt } : {}),
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
  delete fighter.meditatedBoost;
  delete fighter.jailbreakBoost;
  fighter.stress = clampStress(fighter.stress + STRESS.fight - (fighter.alive && fighter.keepsake === 'compassionAnchor' ? 10 : 0));
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
    changeFavor(run, SUMMONS.winFavor + (fighter.personalTrait === 'fourthSon' ? 1 : 0), 'won on the Imperial sand at his summons');
    if (fighter.personalTrait === 'fourthSon') bumpMorale(run, fighter, 5);
    summary.renown = SUMMONS.winRenown + (fighter.keepsake === 'fourthSonHonour' ? 1 : 0);
    chronicle(run, fighter, `Summoned to ${arenaName(SUMMONS.tier)} by the Emperor, and beat ${opp.name}.`);
    line = SUMMONS_LINES.won(fighter.name);
  } else if (!fighter.alive) {
    const lastWords = lastWordsFor(run, fighter);
    summary.lastWords = lastWords;
    chronicle(run, fighter, `Last words: "${lastWords}"`);
    chronicle(run, fighter, `Summoned to ${arenaName(SUMMONS.tier)} by the Emperor, and killed by ${opp.name}.`);
    const wasBondedTo = fighter.bond?.id ?? null;
    removeFighter(run, fighter, { fallen: { arena: true } });
    for (const f of run.roster) {
      bumpMorale(run, f, MORALE.allyDeath);
      queueMilestone(run, f, { id: 'summons_after_ally_died', priority: 100, ctx: { deadId: fighter.id, deadName: fighter.name, bonded: f.id === wasBondedTo || f.bond?.id === fighter.id, order } });
    }
    log(run, `${fighter.name} died on the Imperial sand. The house mourns; their gear returns to the storeroom.`, 'bad');
    line = SUMMONS_LINES.died(fighter.name);
    if (house) {
      house.vengeance = HOUSES.feudMonths;
      house.since = run.week;
    }
  } else if (reason === 'towel') {
    changeFavor(run, SUMMONS.yieldFavor, 'capitulated on the Imperial sand');
    chronicle(run, fighter, `Summoned to ${arenaName(SUMMONS.tier)} by the Emperor; capitulated to ${opp.name} and lived.`);
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
    if (isFirstFight) {
      queueMilestone(run, fighter, { id: won ? 'first_fight_win' : 'first_fight_loss', priority: 78, ctx: { tier: SUMMONS.tier, arena: arenaName(SUMMONS.tier), bloodied: effectiveInjuries(fighter) >= 2, kill: won && reason === 'death', towel: reason === 'towel', oppName: opp.name } });
    }
    if (won) queueMilestone(run, fighter, { id: 'summons_after_win', priority: 92, ctx: { oppName: opp.name, order } });
    else if (reason === 'towel' || m.round < 3) queueMilestone(run, fighter, { id: 'summons_after_loss', priority: 90, ctx: { oppName: opp.name, reason, rounds: m.round, order } });
    else queueMilestone(run, fighter, { id: 'summons_after_survive', priority: 91, ctx: { oppName: opp.name, rounds: m.round, order } });
  }
  summary.favor = run.favor - favorBefore;
  pushResult(run, summary);
  run.summons = null;
  run.summonsDone = true;
  const outcome = won ? 'won' : !summary.died ? (reason === 'towel' ? 'capitulated at the Death Gate' : m.round >= 3 ? 'lost, but survived three rounds' : 'swept in two rounds') : 'killed';
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

// A fight week you could still use (7.9.2/7.11): open arenas and healthy, non-Champion fighters who could fight there.
// Injured fighters and lower-arena Champions (who would be booed for negative Favour) never trigger the nag.
const readyForFreeFight = (run, f, t) => !fightBlocker(run, f.id, t)
  && !f.injuries.some((i) => i.weight > 0)
  && !(t < run.topTier && isChampionOf(f, t));

export function freeFightDay(run) {
  if (!run.bouts) return null;
  const tiers = unlockedTiers(run).filter((t) => run.bouts[t] === 'open' && run.roster.some((f) => readyForFreeFight(run, f, t)));
  if (!tiers.length) return null;
  const fighters = run.roster.filter((f) => tiers.some((t) => readyForFreeFight(run, f, t)));
  return { tiers, fighters };
}

export function fightPowers(run, f, tier = run.topTier) {
  const m = createMatch({ a: f, b: opponentFor(run, tier), rng: createRng(0), ...matchOptions(run, f, tier) });
  espionageAtMatch(run, m, { consume: false });
  return { mine: computePower(m.a, m.b, 1).total, theirs: computePower(m.b, m.a, 1).total };
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
  const m = createMatch({ a: fighter, b: opponentFor(run, tier), rng: run.rng.fight, ...matchOptions(run, fighter, tier) });
  espionageAtMatch(run, m);
  run.matchInfo.match = m; // 7.5.1: saved with the career, so a reload resumes the fight (deserialize)
  return m;
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
  if (!Object.hasOwn(CONSUMABLES, key)) return 'Unknown item.';
  if (match.itemsUsed?.includes(key)) return `Already used a ${CONSUMABLES[key].name} this fight (one of each kind per fight).`;
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
  if (item.staunch) {
    const bleed = match.a.f.injuries.find((inj) => inj.tag === 'bleeding' && !inj.suppressed);
    if (bleed) bleed.suppressed = true;
  }
  if (item.bribe) match.bribe = true;
  if (item.stressAfter) match.stressAfter = item.stressAfter;
  log(run, `${match.a.f.name} uses ${item.name}.`, 'event');
}

// Bet odds are asked for several times before Round 1 (bot, blocker, bet); cache them per match, keyed by their inputs.
const betOddsCache = new WeakMap();
export function betOdds(run, match) {
  const tier = match.bout?.tier ?? run.matchInfo?.tier ?? run.topTier;
  const opts = { ...matchOptions(run, match.a.f, tier), useSignatures: false, n: 400, seed: 777, boostsA: match.a.boosts ?? null, boostsB: match.b.boosts ?? null, vengeanceB: Boolean(match.b.vengeance), ashA: match.a.ash ?? 0, playbook: Boolean(match.playbook) };
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
// What the bet buttons show (7.8.1): the live odds, so an item used before Round 1 is priced in. null when bets are closed.
export function betQuote(run, match) {
  if (!match || match.round !== 0 || match.over || match.bet) return null;
  return { odds: betOdds(run, match), cap: betCap(run, match), gold: run.gold };
}

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
  const bout = currentBout(run);
  if (bout.boss) return 'Bosses cannot be skipped. Fight or forfeit.';
  if (bracketOf(run, bout.tier)?.round > 0) return 'You are already in the bracket. Fight or withdraw.';
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
  const isFirstFight = !run.history.some((h) => h.fighterId === fighter.id);
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
  delete fighter.meditatedBoost;
  delete fighter.jailbreakBoost;
  const compassionCalm = fighter.alive && fighter.keepsake === 'compassionAnchor' && decorWorks(match) ? 10 : 0;
  fighter.stress = clampStress(fighter.stress + STRESS.fight + (match.stressAfter ?? 0) - compassionCalm);

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

  let newlyCrownedTitles = [];
  if (won) {
    const fest = bout.festival ? FESTIVAL_BY_ID[bout.festival] : null;
    summary.gold = bout.winGold + Math.floor(fighter.renown / RENOWN.goldPer);
    if (upset && fest?.upset) summary.gold *= fest.upset;
    summary.prestige += bout.buyIn + (champion ? 0 : bout.winPrestige);
    if (!crushing && !champion) {
      summary.renown = RENOWN.win + (bout.boss ? RENOWN.bossWin : 0) + (upset ? RENOWN.upset : 0) + (fighter.perks.includes('crowdPleaser') ? 1 : 0)
        + (fighter.decor.warBanner ?? 0) * DECOR.warBanner.renown + (bloodied ? BLOODIED.renown : 0) + (fest?.renown ?? 0)
        + (plotActive(run) && run.plot.crowdUntil > run.week ? 1 : 0)
        + (fighter.keepsake === 'fourthSonHonour' && decorWorks(match) ? 1 : 0);
    }
    if (bloodied) bumpMorale(run, fighter, BLOODIED.morale);
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
    if (fighter.personalTrait === 'cursedIntellect' && (crushing || gap >= ECONOMY.crushingGap)) {
      bumpMorale(run, fighter, -5);
    } else {
      bumpMorale(run, fighter, crushing || champion ? MORALE.crowdJeers : MORALE.win);
    }
    if (fighter.personalTrait === 'fourthSon' && (tier === 4 || tier === GRAND_TIER || run.demand?.id === 'kill')) {
      changeFavor(run, 1, "Fourth-Son's Stripes");
      bumpMorale(run, fighter, 5);
    }
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
        newlyCrownedTitles = titles;
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
    bumpMorale(run, fighter, match.result.reason === 'towel' ? MORALE.towel : MORALE.loss);
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
      if (house.debt?.owed > 0) {
        const pen = debtPenaltyFor(house);
        if (bout.boss) {
          const rebate = Math.min(house.debt.owed, HOUSE_DEBT.bossWinRebate * Math.min(tier, CIRCUITS.length));
          house.debt.owed -= rebate;
          if (rebate > 0) log(run, `Beating ${house.name}'s Boss forces a ${rebate} Gold rebate on your debt.`, 'good');
        }
        if (pen?.garnish > 0 && summary.gold > 0 && house.debt.owed > 0) {
          const garnished = Math.min(house.debt.owed, Math.floor(summary.gold * pen.garnish));
          if (garnished > 0) {
            summary.gold -= garnished;
            summary.garnished = garnished;
            house.debt.owed -= garnished;
            log(run, `${house.name}'s bailiffs garnish ${garnished} Gold from the winner's purse toward your debt (${house.debt.owed} Gold remaining).`, 'warn');
          }
        }
        if (house.debt.owed <= 0) {
          delete house.debt;
          log(run, `Your debt to ${house.name} is paid off in full!`, 'good');
        }
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
    chronicle(run, fighter, bloodied ? 'Won bloodied and became Battle-Hardened.' : 'Won wounded, then slept the night on spikes, and woke Battle-Hardened.');
  }
  const severe = fighter.alive && newInjuries.length && match.a.f.injuries.some((i) => i.weeksLeft === undefined && SEVERE.includes(i.tag));
  if (severe && next(run.rng.growth) < SCAR_CHANCE) {
    const vs = meleeOnly(match.b ?? { f: opp }) ? 'melee' : 'ranged';
    const afeared = SCAR_AFEARED[fighter.humor] ?? SCAR_AFEARED.other;
    const roll = afeared > 0 ? next(run.rng.growth) : 1;
    const id = !(decorWorks(match) && (fighter.decor?.skullRack > 0 || fighter.keepsake === 'tidalMemory')) && roll < afeared ? 'afeared' : 'enraged';
    if (!(fighter.scars ?? []).some((sc) => sc.vs === vs)) {
      fighter.scars = [...(fighter.scars ?? []), { id, vs }];
      summary.scar = [summary.scar, `${SCARS[id].name} (${vs})`].filter(Boolean).join(', '); // keep Battle-Hardened too
      chronicle(run, fighter, `${opp.name}'s blow left a scar: ${SCARS[id].name} against ${vs} fighters.`);
      log(run, `${fighter.name} is scarred: ${SCARS[id].name} against ${vs} fighters.`, 'warn');
    }
  }
  if (!fighter.alive) {
    const lastWords = lastWordsFor(run, fighter);
    summary.lastWords = lastWords;
    chronicle(run, fighter, `Last words: "${lastWords}"`);
    chronicle(run, fighter, `Fell in ${bout.name}, killed by ${opp.name}.`);
    const fWins = winsOf(run, fighter);
    summary.eulogy = `Here lies ${fighter.name}: ${fWins} win${fWins === 1 ? '' : 's'}${fighter.kills ? `, ${fighter.kills} kill${fighter.kills === 1 ? '' : 's'}` : ''}${fighter.titles.length ? `, ${fighter.titles.join(', ')}` : ''}.`;
    summary.story = (fighter.story ?? []).slice(-4).map((e) => e.text); // 7.8: their last chapters, for the fight screen
    removeFighter(run, fighter, { fallen: { arena: true } });
    for (const f of run.roster) bumpMorale(run, f, MORALE.allyDeath);
    log(run, `${fighter.name} died in ${bout.name}. The house mourns; their gear returns to the storeroom.`, 'bad');
  } else {
    gainXp(run, fighter, summary.xp);
    summary.levels = fighter.level - levelBefore;
    if (won) summary.fearConquered = faceFear(run, fighter, match.b);
    if (isFirstFight) {
      queueMilestone(run, fighter, {
        id: won ? 'first_fight_win' : 'first_fight_loss',
        priority: 78,
        ctx: { tier, arena: arenaName(tier), bloodied, kill: match.result.reason === 'death', towel: match.result.reason === 'towel', oppName: opp.name },
      });
    }
    const tKey = Math.min(5, Math.max(1, tier));
    if (!newlyCrownedTitles.length) {
      queueMilestone(run, fighter, {
        id: `tourney_${won ? 'win' : 'loss'}_t${tKey}`,
        priority: 70,
        ctx: { tier: tKey, arena: arenaName(tier), boss: bout.boss, bracket: bracket ? BRACKET.rounds[bracket.round] : null, oppName: opp.name, reason: match.result.reason, bloodied },
      });
    }
    if (newlyCrownedTitles.length) {
      queueMilestone(run, fighter, {
        id: `crowned_champion_t${tier}`,
        priority: 85,
        ctx: { tier, title: championTitle(tier), allTitles: newlyCrownedTitles, cascaded: newlyCrownedTitles.length > 1, viaBoss: bout.boss },
      });
      // Cap peer_crowned speech badges to at most 1 housemate (bondmate first, else highest-Renown) to avoid a 5-badge modal flood.
      const peers = run.roster.filter((other) => other.id !== fighter.id && other.alive !== false && other.kind !== 'revenant');
      const featuredPeer = peers.find((other) => fighter.bond?.id === other.id)
        ?? peers.sort((a, b) => (b.renown ?? 0) - (a.renown ?? 0))[0]
        ?? null;
      if (featuredPeer) {
        const alreadyChamp = (featuredPeer.titles ?? []).length > 0;
        queueMilestone(run, featuredPeer, {
          id: alreadyChamp ? 'peer_crowned_already_champ' : 'peer_crowned_not_champ',
          priority: 80,
          ctx: {
            champId: fighter.id,
            champName: fighter.name,
            champCoreId: fighter.coreId ?? null,
            tier,
            title: championTitle(tier),
            myTitle: featuredPeer.titles?.[0] ?? null,
            allMyTitles: featuredPeer.titles ?? [],
          },
        });
      }
    }
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
  if (fighter.alive) log(run, `${fighter.name} ${won ? 'won' : 'lost'} ${bout.name}.`, won ? 'good' : 'bad'); // a death is logged once, above
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
  const isFirstFight = !run.history.some((h) => h.fighterId === fighter.id);
  const bout = boutFor(run, tier);
  const round = BRACKET.rounds[bracket.round];
  const nextRound = BRACKET.rounds[bracket.round + 1];
  const kill = match.result.reason === 'death';
  const bloodied = effectiveInjuries(fighter) >= 2;
  const summary = {
    week: run.week, tier, name: `${bout.name} · ${round}`, boss: false, top: bout.top, won: true, reason: match.result.reason, bloodied,
    fighter: fighter.name, fighterId: fighter.id, died: false, gold: BRACKET.purse * Math.min(tier, 4), prestige: BRACKET.prestigeTopOnly && !bout.top ? 0 : BRACKET.prestige, favor: 0,
    xp: XP.win, renown: 1 + (fighter.keepsake === 'fourthSonHonour' && decorWorks(match) ? 1 : 0), injuries: newInjuries, morale: 0, levels: 0, bracket: round, next: nextRound, kill, house: houseOf(run, opp)?.name ?? null,
  };
  const levelBefore = fighter.level;
  if (bloodied) {
    summary.renown += BLOODIED.renown;
    summary.xp += BLOODIED.xp;
    bumpMorale(run, fighter, BLOODIED.morale);
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
    chronicle(run, fighter, 'Won wounded, then slept the night on spikes, and woke Battle-Hardened.');
  }
  if (opp.rivalChampion) {
    rivalChampionResult(run, opp, fighter, tier, true, summary);
    if (kill) rivalChampionKilled(run, opp.name);
  }
  const house = houseOf(run, opp);
  if (house?.debt?.owed > 0) {
    const pen = debtPenaltyFor(house);
    if (pen?.garnish > 0 && summary.gold > 0) {
      const garnished = Math.min(house.debt.owed, Math.floor(summary.gold * pen.garnish));
      if (garnished > 0) {
        summary.gold -= garnished;
        summary.garnished = garnished;
        house.debt.owed -= garnished;
        log(run, `${house.name}'s bailiffs garnish ${garnished} Gold from the purse toward your debt (${house.debt.owed} Gold remaining).`, 'warn');
        if (house.debt.owed <= 0) {
          delete house.debt;
          log(run, `Your debt to ${house.name} is paid off in full!`, 'good');
        }
      }
    }
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
  if (isFirstFight) {
    queueMilestone(run, fighter, {
      id: 'first_fight_win',
      priority: 78,
      ctx: { tier, arena: arenaName(tier), bloodied, kill, towel: false, oppName: opp.name },
    });
  }
  claimLoot(run, fighter, opp, summary, false);
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
  const debtForceKill = Boolean(debtPenaltyFor(house)?.forceKillCrowd);
  const blood = Boolean(house?.feud || house?.vengeance || debtForceKill) || wounds >= deathGateAt(match.b.f, match.b.arena);
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
  const { fighterId, opp, house: houseId, crowd, tier, at, rebel = false, rivalChampion = false } = run.mercy;
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
    run.spared = [...(run.spared ?? []), { name: opp, house: house?.name ?? null, tier, week: run.week }].slice(-6);
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
    if (crowd === 'kill' && house?.debt?.owed > 0 && (house.debt.monthsUnpaid ?? 0) >= 1) {
      const forgive = Math.min(house.debt.owed, HOUSE_DEBT.spareForgiveBase + HOUSE_DEBT.spareForgivePerTier * Math.min(tier, CIRCUITS.length));
      house.debt.owed -= forgive;
      if (house.debt.owed <= 0) {
        delete house.debt;
        log(run, `${house.name} forgives the remainder of your debt in gratitude for sparing ${opp}!`, 'good');
      } else {
        log(run, `${house.name} forgives ${forgive} Gold of your debt for sparing ${opp} (${house.debt.owed} Gold remaining).`, 'good');
      }
    }
    if (fighter?.personalTrait === 'crackedGovernor') {
      bumpMorale(run, fighter, 10);
      fighter.stress = clampStress(fighter.stress - 15);
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
    if (fighter?.personalTrait === 'crackedGovernor') {
      fighter.jailbreakBoost = 1;
      fighter.stress = clampStress(fighter.stress + 20);
      bumpMorale(run, fighter, -15);
      // Prevent mid-bracket softlock (e.g. under emperorsGaze / coup Final where withdrawal is blocked).
      if (isInActiveBracket(run, fighter.id) && fighter.morale < MORALE.mutinous) fighter.morale = MORALE.mutinous;
    }
  }
  if (fighter && (fighter.companion || fighter.coreId || fighter.dialogue)) {
    fighter.dialogue ??= createDialogueState(fighter.coreId ?? null);
    fighter.dialogue.mercy ??= { spared: 0, sparedAgainstCrowd: 0, killed: 0, killedAgainstCrowd: 0, streak: 0 };
    const mLog = fighter.dialogue.mercy;
    const againstCrowd = choice !== crowd;
    if (choice === 'kill') {
      mLog.killed = (mLog.killed ?? 0) + 1;
      if (againstCrowd) mLog.killedAgainstCrowd = (mLog.killedAgainstCrowd ?? 0) + 1;
      mLog.streak = Math.min(0, mLog.streak ?? 0) - 1;
      queueMilestone(run, fighter, {
        id: 'mercy_kill_ordered',
        priority: 76,
        ctx: { oppName: opp, houseName: house?.name ?? null, crowd, againstCrowd, killsOrdered: mLog.killed },
      });
    } else {
      mLog.spared = (mLog.spared ?? 0) + 1;
      if (againstCrowd) mLog.sparedAgainstCrowd = (mLog.sparedAgainstCrowd ?? 0) + 1;
      mLog.streak = Math.max(0, mLog.streak ?? 0) + 1;
      if (mLog.streak >= 2 || (crowd === 'kill' && fighter.coreId === 'android')) {
        queueMilestone(run, fighter, {
          id: 'mercy_spare_streak',
          priority: 74,
          ctx: { oppName: opp, houseName: house?.name ?? null, crowd, againstCrowd, spareStreak: mLog.streak },
        });
      }
    }
  }
  if (choice === crowd || (choice === 'spare' && fighter.perks.includes('merciful'))) {
    out.renown += MERCY.crowdRenown;
    out.morale = MERCY.crowdMorale;
    bumpMorale(run, fighter, MERCY.crowdMorale);
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

// ---------- Withdraw, stuck milestone escalation, and arena progression ----------

export function checkStuckMilestones(run) {
  if (!run || run.status !== 'active' || run.topTier >= GRAND_TIER) return;
  const companions = (run.roster ?? []).filter((f) => f.alive !== false && (f.companion || f.coreId || f.dialogue));
  if (!companions.length) return;
  const tier = run.topTier;
  if (!run.tierState || run.tierState.tier !== tier) {
    run.tierState = { tier, enteredWeek: run.week, bossLosses: 0, tourneyLosses: 0 };
  }
  const weeksOnTier = run.week - (run.tierState.enteredWeek ?? 0);
  const threshold = isShort(run) ? 8 : 12;
  const bossLosses = run.tierState.bossLosses ?? 0;

  for (const f of companions) {
    f.dialogue ??= createDialogueState(f.coreId ?? null);
    if (!f.dialogue.stuck || f.dialogue.stuck.tier !== tier) {
      f.dialogue.stuck = { tier, stage: 0, lastTalkWeek: run.week, bossLossesAtTalk: 0 };
      pruneFighterDialogue(run, f);
    }
    const st = f.dialogue.stuck;
    const seen = f.dialogue.seen ?? [];
    const queuedIds = (f.dialogue.queue ?? []).map((q) => (typeof q === 'string' ? q : q.id));
    if (st.stage === 0) {
      if (weeksOnTier >= threshold || bossLosses >= 1) {
        const s1 = `stuck_t${tier}_stage1`;
        if (!seen.includes(s1) && !queuedIds.includes(s1)) {
          queueMilestone(run, f, { id: s1, priority: 55, ctx: { tier, arena: arenaName(tier), stage: 1, weeksOnTier, bossLosses } });
        }
      }
    } else if (st.stage === 1) {
      const s2 = `stuck_t${tier}_stage2`;
      if ((run.week - st.lastTalkWeek >= 4 || bossLosses > st.bossLossesAtTalk) && !seen.includes(s2) && !queuedIds.includes(s2)) {
        queueMilestone(run, f, { id: s2, priority: 56, ctx: { tier, arena: arenaName(tier), stage: 2, weeksOnTier, bossLosses } });
      }
    } else if (st.stage === 2) {
      const s3 = `stuck_t${tier}_stage3`;
      if ((run.week - st.lastTalkWeek >= 4 || bossLosses > st.bossLossesAtTalk) && !seen.includes(s3) && !queuedIds.includes(s3)) {
        queueMilestone(run, f, { id: s3, priority: 57, ctx: { tier, arena: arenaName(tier), stage: 3, weeksOnTier, bossLosses } });
      }
    }
  }
}

export function withdrawBlocker(run, tier) {
  const blocked = activeModalOrPendingBlocker(run);
  if (blocked) return blocked;
  const b = bracketOf(run, tier);
  if (!b?.fighterId || b.round === 0) return 'Nothing to withdraw from.';
  if (!findFighter(run, b.fighterId)) return 'No such fighter in the bracket.';
  return bracketLockReason(run, tier);
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
    if (!won && tier === run.topTier && (run.roster ?? []).some((f) => f.companion || f.coreId || f.dialogue)) {
      run.tierState ??= { tier: run.topTier, enteredWeek: 0, bossLosses: 0, tourneyLosses: 0 };
      run.tierState.tourneyLosses = (run.tierState.tourneyLosses ?? 0) + 1;
      checkStuckMilestones(run);
    }
    arena.stage = nextStage(run, tier);
    newOpponent(run, tier);
  } else if (won) {
    arena.rival = null;
    if (!arena.conquered) {
      arena.conquered = true;
      log(run, `${arenaName(tier)} conquered!`, 'event');
      const nextTier = tier + 1;
      run.topTier = nextTier;
      if (run.tierState || (run.roster ?? []).some((f) => f.companion || f.coreId || f.dialogue)) {
        run.tierState = { tier: nextTier, enteredWeek: run.week, bossLosses: 0, tourneyLosses: 0 };
      }
      for (const f of run.roster) {
        f.topStreak = 0;
        pruneFighterDialogue(run, f);
      }
      openArena(run, nextTier);
      log(run, nextTier === GRAND_TIER ? 'The Grand Tournament awaits.' : `${arenaName(nextTier)} opens its gates to you. Your old arenas still hold bouts every month.`, 'event');
    }
    restartCircuit(run, tier);
  } else {
    if (tier === run.topTier) {
      const basePower = arenaPower(run, tier) + (isShort(run) ? SHORT.rival : 1);
      arena.rival = { ...structuredClone(opp), power: basePower, renown: opp.renown + 2, rival: true, injuries: [], alive: true };
      log(run, beatYou ? `${opp.name} will remember this, and will be waiting for you.` : `${opp.name} never had to fight you. They will be waiting next time, stronger.`, 'warn');
      if ((run.roster ?? []).some((f) => f.companion || f.coreId || f.dialogue)) {
        run.tierState ??= { tier: run.topTier, enteredWeek: 0, bossLosses: 0, tourneyLosses: 0 };
        run.tierState.bossLosses = (run.tierState.bossLosses ?? 0) + 1;
        checkStuckMilestones(run);
      }
    }
    if (isShort(run) && SHORT.rematch && tier === run.topTier) {
      arena.debuff = pick(run.rng.opponents, DEBUFF_IDS);
      newOpponent(run, tier);
    } else restartCircuit(run, tier);
  }
  checkLoss(run);
}

