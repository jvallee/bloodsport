// Career state facade: re-exports all public symbols from the layered src/run/ modules.
// Keep this barrel strictly re-exporting so existing imports from './run.js' stay 100% compatible.

export {
  SAVE_VERSION, GRAND_TIER, JOBS, NAME_MEMORY,
  createFighter, decorComfortOf, decorCalm, decorCount, dislikedDecorItems, dislikedDecorPenaltyOf, keepsakeComfortOf,
  trainStress, netTrainStress, effectiveSpeed, effectivePower, powerParts, championTitle, isChampionOf, crownChampion,
  bossLossFavor, hasDecree, hasUnlock, heatDecrees, hasPolicy, unlockedTiers, isGrand,
  circuitInfo, arenaName, isShort, trainGain, marketPrice, liaisonOffer, recruitPrice,
  cheapestRecruitPrice, cleanName, winsOf, foughtThisWeek, xpFor,
  activeModalOrPendingBlocker, isInActiveBracket, bracketLockReason, lockedIntoBracket, nextStage, addPrestige,
  clearHealedMedbay, removeFighter, queueMilestone, pruneFighterDialogue,
  CORE_COMPANIONS, PERSONAL_TRAITS, LORE_KEEPSAKES, CORE_WANTS, CORE_BOND_TREES, ESTATE_STAFF,
  createDialogueState, ensureDialogueState, enqueueMilestone, pruneStaleDialogue, resolveDialogueTree, evaluateKeepsake,
} from './run/helpers.js';
import { applyDialogueChoice as baseApplyDialogueChoice } from './run/helpers.js';
import { changeSuspicion } from './run/plotEngine.js';

export function applyDialogueChoice(run, f, sceneId, choiceId, extraHooks = {}) {
  return baseApplyDialogueChoice(run, f, sceneId, choiceId, {
    onChangeSuspicion: (n) => { if (run && n) changeSuspicion(run, n); },
    ...extraHooks,
  });
}

export { markPolitical, risingProgress } from './run/plotEngine.js';

export {
  houseOf, houseForArena, standings, arenaPower, summonsPower, boutFor, currentBout,
  upcomingBouts, hasBracket, drawBrackets, crushingGapFor, bracketOf, bracketRound,
  bracketView, bracketInfo, opponentFor, opponentSpeed, matchOptions, bracketLegOptions,
  archrival, bondmate, hostPrice, hostBlocker, host, activePolicies, enactBlocker, enact,
  demandMet, demandFromEmperor, demandSender, debtPenaltyFor, favorWritGold, favorLoanPrincipal, borrowFavorBlocker, borrowFavor,
  payFavorDebtBlocker, payFavorDebt, favorDebtMonth, activeHouseDebts, houseLoanPrincipal,
  borrowHouseBlocker, borrowHouse, payHouseDebtBlocker, payHouseDebt,
} from './run/houses.js';

export {
  buildRoom, upgradeRoom, recruitedCompanionIds, createCompanion, getCompanionPool, seasonCompanion,
  freeDraftPicks, companionPrice, companionBlocker, draftCompanion, recruitCompanion,
  recruitBlocker, recruit, releaseBlocker, release,
  trainBlocker, jobBlocker, stewardPlanBlocker, stewardPlan, setJob,
  moraleTarget, moraleState, perkBlocker, choosePerk, prayPrice, prayBlocker, pray,
  ritePrice, riteBlocker, rite, retunePrice, retuneBlocker, retuneClass, retuneTrait, retuneHumor,
  setPerkFocus, respecPrice, respecPerkBlocker, respecPerk,
  hadesPrice, reviveHadesPrice, hadesKeepWeeks, hadesRaisable, reviveHadesBlocker, reviveHades,
  restoreRevenantPrice, restoreRevenantBlocker, restoreRevenant,
  vulcanKeepWeeks, reanimatePrice, raisable, reanimateBlocker, reanimate,
  exhibitionBlocker, exhibition, checkKeepsakes, buyDecorBlocker, buyDecor, assignDecorBlocker, assignDecor,
  buyAndAssignDecorBlocker, buyAndAssignDecor, moveDecorBlocker, moveDecorAnchor,
  removeDecorBlocker, removeDecor, buyGearBlocker, buyGear, equipBlocker, equip,
  sellPrice, sellGearBlocker, sellGear, unequipBlocker, unequip, unequipAllBlocker, unequipAll,
  buyItemBlocker, buyItem, surgeonPrice, surgeonBlocker, surgeon, treatFirstBlocker, treatFirst,
  augmentPrice, augmentBlocker, augment, retireBlocker, retire, renameBlocker, rename,
  dominantTemperament, driftHumour, meditate, syncDrift, cousinWeek,
} from './run/roster.js';

export {
  checkQuests, checkBackstories, stewardGold, stewardPrestige, stewardRewardText, stewardTask, wantFor,
  wantLabel, wantGoal,
} from './run/questsEngine.js';

export {
  relicInPool, fortuneCards, legendKey, returningLegends, rerollPrice, fortuneBlocker,
  chooseFortune, rerollBlocker, rerollFortune, passFortune,
} from './run/fortuneEngine.js';

export { eventNames, eventChoiceBlocker, chooseEvent } from './run/eventsEngine.js';

export {
  SUMMONS_ORDERS, summonsBlocker, answerSummons, refuseSummonsBlocker, refuseSummons,
  fightPowers, fightBlocker, startMatch, recordMatchProgress, useItemBlocker, useItem,
  betOdds, betCap, betPayout, betQuote, freeFightDay, betBlocker, placeBet, purseGold,
  skipBlocker, skipBout, forfeitBlocker, forfeitBout, keepsBuyIn, finishMatch,
  spareFavor, spareFavorWhy, owedLeft, mercyBlocker, resolveMercy,
  checkStuckMilestones, withdrawBlocker, withdraw,
} from './run/tournaments.js';

export {
  createRun, advanceBlocker, advanceWeek, overtrainedByWeek, advanceToTournament,
  tributeDue, tributePaid, payTributeBlocker, payTribute,
} from './run/weekly.js';

export {
  serialize, deserialize, validateRun, migrateV2ToV3, migrateV3ToV4, migrateV4ToV5, migrateV5ToV6, migrateV6ToV7, migrateV7ToV8,
} from './run/migrations.js';
export { isMutinous, isRestless, isAgitated, unrestFrom, ringleader, revoltSides, unrestWeek, openCrisis } from './run/unrest.js';
export { espState, moleOf, masterName, canNarrow, espionageWeek, plantMole, investigateBlocker, investigate, opTarget, opChance, covertOpBlocker, covertOp, espionageAtMatch, espionageOdds } from './run/espionage.js';

