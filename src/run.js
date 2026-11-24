// Career state facade: re-exports all public symbols from the layered src/run/ modules.
// Keep this barrel strictly re-exporting so existing imports from './run.js' stay 100% compatible.

export {
  SAVE_VERSION, GRAND_TIER, JOBS, NAME_MEMORY,
  createFighter, decorComfortOf, decorCalm, decorCount, trainStress, netTrainStress,
  effectiveSpeed, effectivePower, powerParts, championTitle, isChampionOf, crownChampion,
  bossLossFavor, hasDecree, hasUnlock, heatDecrees, hasPolicy, unlockedTiers, isGrand,
  circuitInfo, arenaName, isShort, trainGain, marketPrice, liaisonOffer, recruitPrice,
  cheapestRecruitPrice, cleanName, winsOf, foughtThisWeek, xpFor,
  activeModalOrPendingBlocker, isInActiveBracket, nextStage, addPrestige,
  clearHealedMedbay, removeFighter,
} from './run/helpers.js';

export { markPolitical, risingProgress } from './run/plotEngine.js';

export {
  houseOf, houseForArena, standings, arenaPower, summonsPower, boutFor, currentBout,
  upcomingBouts, hasBracket, drawBrackets, crushingGapFor, bracketOf, bracketRound,
  bracketView, bracketInfo, opponentFor, opponentSpeed, fightPowers, matchOptions,
  archrival, bondmate, hostPrice, hostBlocker, host, activePolicies, enactBlocker, enact,
  demandMet,
} from './run/houses.js';

export {
  buildRoom, upgradeRoom, recruitBlocker, recruit, releaseBlocker, release,
  trainBlocker, jobBlocker, stewardPlanBlocker, stewardPlan, setJob,
  moraleTarget, moraleState, perkBlocker, choosePerk, prayPrice, prayBlocker, pray,
  ritePrice, riteBlocker, rite, reanimatePrice, raisable, reanimateBlocker, reanimate,
  exhibitionBlocker, exhibition, buyDecorBlocker, buyDecor, assignDecorBlocker, assignDecor,
  removeDecorBlocker, removeDecor, buyGearBlocker, buyGear, equipBlocker, equip,
  sellPrice, sellGearBlocker, sellGear, unequipBlocker, unequip, unequipAllBlocker, unequipAll,
  buyItemBlocker, buyItem, surgeonPrice, surgeonBlocker, surgeon, treatFirstBlocker, treatFirst,
  augmentPrice, augmentBlocker, augment, retireBlocker, retire, renameBlocker, rename,
  dominantTemperament, driftHumour, meditate, syncDrift, cousinWeek,
} from './run/roster.js';

export {
  checkQuests, stewardGold, stewardPrestige, stewardRewardText, stewardTask, wantFor,
} from './run/questsEngine.js';

export {
  relicInPool, fortuneCards, legendKey, returningLegends, rerollPrice, fortuneBlocker,
  chooseFortune, rerollBlocker, rerollFortune, passFortune,
} from './run/fortuneEngine.js';

export { eventNames, eventChoiceBlocker, chooseEvent } from './run/eventsEngine.js';

export {
  SUMMONS_ORDERS, summonsBlocker, answerSummons, refuseSummonsBlocker, refuseSummons,
  fightBlocker, startMatch, recordMatchProgress, useItemBlocker, useItem,
  betOdds, betCap, betPayout, betQuote, freeFightDay, betBlocker, placeBet, purseGold,
  skipBlocker, skipBout, forfeitBlocker, forfeitBout, keepsBuyIn, finishMatch,
  spareFavor, spareFavorWhy, owedLeft, mercyBlocker, resolveMercy,
  withdrawBlocker, withdraw,
} from './run/tournaments.js';

export {
  createRun, advanceBlocker, advanceWeek, overtrainedByWeek, advanceToTournament,
  tributeDue, tributePaid, payTributeBlocker, payTribute,
} from './run/weekly.js';

export {
  serialize, deserialize, validateRun, migrateV2ToV3, migrateV3ToV4, migrateV4ToV5, migrateV5ToV6, migrateV6ToV7,
} from './run/migrations.js';
export { isMutinous, isRestless, isAgitated, unrestFrom, ringleader, revoltSides, unrestWeek, openCrisis } from './run/unrest.js';
export { espState, moleOf, masterName, canNarrow, espionageWeek, plantMole, investigateBlocker, investigate, opTarget, opChance, covertOpBlocker, covertOp, espionageAtMatch, espionageOdds } from './run/espionage.js';
