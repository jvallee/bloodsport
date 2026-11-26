// v8.0 "Palatina / Rome in the Stars" Narrative, Lore, Core 5 Companions, Temples of Fortuna/Hades/Vulcan,
// Favour & Rival House Debt, 3/4 Room Lore Keepsakes, and Interactive Dialogue Tree Engine Tests.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createRng } from '../src/rng.js';
import {
  KINDS, TRAITS, CLASSES, WEAPONS, BUILDINGS, DECOR, HUMORS, PERKS,
  COMPANIONS, FORTUNE_RETUNE, HADES, FAVOR_DEBT, HOUSE_DEBT,
} from '../src/data.js';
import {
  CRYPT_HADES_SLOT, ROOF_TEMPLE_SLOT, plotsFree, maxLevel, resolveEstateSlots,
} from '../src/ludus.js';
import { createMatch, computePower, computePhase2, hypeOf, playRound } from '../src/fight.js';
import {
  SPEAKERS, SCENES, returnScene, demandMetScene, demandMissedScene,
  CORE_COMPANIONS, PERSONAL_TRAITS, LORE_KEEPSAKES, evaluateKeepsake,
  CORE_WANTS, nextCoreWant, CORE_BOND_TREES, bondPairKey,
  createDialogueState, enqueueMilestone, pruneStaleDialogue,
  getHubTopics, resolveDialogueTree, applyDialogueChoice,
} from '../src/dialogue.js';
import { STEWARD_INTRO, STEWARD_TASKS, stewardAlready, stewardDone, stewardGrandDone, BOND_LINES, LIAISON_LINES } from '../src/quests.js';
import { ENTRIES, SECTIONS, createCodex, discover, progress, isUnlocked, hasLore } from '../src/codex.js';
import { backstoryScene } from '../src/voices.js';
import {
  createRun, advanceWeek, advanceToTournament, serialize, deserialize,
  recruitedCompanionIds, createCompanion, getCompanionPool, seasonCompanion,
  companionPrice, companionBlocker, draftCompanion, recruitCompanion,
  releaseBlocker, renameBlocker, retireBlocker, retire, recruit,
  retunePrice, retuneBlocker, retuneClass, retuneTrait, retuneHumor,
  setPerkFocus, respecPrice, respecPerkBlocker, respecPerk, ritePrice,
  hadesPrice, hadesKeepWeeks, hadesRaisable, reviveHadesBlocker, reviveHades,
  vulcanKeepWeeks, raisable, reanimate,
  favorWritGold, favorLoanPrincipal, borrowFavorBlocker, borrowFavor,
  payFavorDebtBlocker, payFavorDebt, favorDebtMonth,
  activeHouseDebts, houseLoanPrincipal, debtPenaltyFor,
  borrowHouseBlocker, borrowHouse, payHouseDebtBlocker, payHouseDebt,
  checkKeepsakes, buyDecor, assignDecor, buyAndAssignDecor, removeDecor,
  decorComfortOf, decorCalm, moraleTarget, meditate, host,
  fightPowers, matchOptions, startMatch, finishMatch, resolveMercy,
  answerSummons, checkStuckMilestones, checkQuests,
  plantMole,
} from '../src/run.js';
import { formBond, rivalsCompete, tendBonds } from '../src/run/houses.js';
import { wantsMonth, checkWants } from '../src/run/questsEngine.js';
import { changeSuspicion, applyPlotEffects } from '../src/run/plotEngine.js';
import { applyGameAction } from '../src/game.js';
import { npcPortrait } from '../src/ui/portrait.js';
import { ludusTab, estateTab, marketTab, codexTab, talkModal } from '../src/ui/views.js';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

const fakeMatch = (run, id, { winner = 'A', reason = 'rounds', alive = true, injuries = [], oppInjuries = [], tier } = {}) => {
  const m = startMatch(run, id, tier);
  m.over = true;
  m.result = { winner, reason };
  m.a.f.alive = alive;
  m.a.f.injuries = injuries;
  if (oppInjuries.length) m.b.f.injuries = oppInjuries;
  return m;
};

const clearBlockers = (run) => {
  run.event = null;
  run.fortune = null;
  run.mercy = null;
  for (const f of run.roster) f.pendingPerks = [];
};

const stepToTournament = (run) => {
  while (!run.bouts) {
    clearBlockers(run);
    advanceWeek(run);
  }
  clearBlockers(run);
};

// ---------- 1. Setting Rename ("Palatina"), 3-Tier Imperial Authority & Galen-VII ----------

test('v8.0 world rename: zero "Battleworld" strings remain anywhere across src/, scripts/, and index.html', () => {
  const walkFiles = (dir) => {
    const out = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) out.push(...walkFiles(full));
      else if (/\.(js|mjs|html|css)$/.test(entry)) out.push(full);
    }
    return out;
  };
  const targets = [join(rootDir, 'index.html'), ...walkFiles(join(rootDir, 'src')), ...walkFiles(join(rootDir, 'scripts'))];
  assert.ok(targets.length >= 25, `scanned ${targets.length} source/script files recursively`);
  for (const full of targets) {
    const text = readFileSync(full, 'utf8');
    assert.doesNotMatch(text, /battle\s*world/i, `${full} should not mention Battleworld`);
  }
  const basicsKeys = ENTRIES.filter((e) => e.cat === 'basics').map((e) => e.key);
  for (const key of ['basics:palatine', 'basics:rightHand', 'basics:taxCollector', 'basics:hades', 'basics:debt', 'basics:companions']) {
    assert.ok(basicsKeys.includes(key), `missing Codex basics entry ${key}`);
  }
  for (const kind of ['human', 'android', 'elf', 'orc', 'vampire', 'basa']) {
    const entry = ENTRIES.find((e) => e.key === `kind:${kind}`);
    assert.ok(entry?.lore && entry.lore.length > 40, `kind:${kind} has rich Palatina lore`);
    const bs = backstoryScene({ id: 'f1', name: 'Test', kind, humor: 'choleric' });
    assert.ok(bs?.beats?.length >= 3, `backstoryScene for ${kind}`);
  }
});

test('3-Tier Imperial Authority & Voyager-style Android Steward (Galen-VII) speakers, scenes, and portraits', () => {
  assert.equal(SPEAKERS.rightHand.name, 'Legate Cassian Vane');
  assert.equal(SPEAKERS.taxCollector.name, 'Censor Numerius Gallo');
  assert.equal(SPEAKERS.emperor.name, 'Emperor Silbannacus');
  assert.equal(SPEAKERS.steward.name, 'Galen-VII');
  assert.equal(SPEAKERS.trainer.name, 'Drillmaster Kaeso');
  assert.equal(SPEAKERS.doctor.name, 'Physician Lyra');

  // Beat 0 of return scenes stays narrator; subsequent beats stratify across rightHand, taxCollector, and emperor
  assert.equal(SCENES.firstBoss[0].speaker, 'narrator');
  assert.ok(SCENES.firstBoss.some((b) => b.speaker === 'rightHand'));
  assert.equal(SCENES.lowFavor[0].speaker, 'narrator');
  assert.ok(SCENES.lowFavor.some((b) => b.speaker === 'rightHand'));
  assert.equal(SCENES.tribute[0].speaker, 'narrator');
  assert.ok(SCENES.tribute.some((b) => b.speaker === 'taxCollector'));
  assert.equal(SCENES.grand[0].speaker, 'narrator');
  assert.ok(SCENES.grand.some((b) => b.speaker === 'emperor'));
  assert.equal(demandMetScene('Win a match', 5, 4)[0].speaker, 'rightHand');
  assert.equal(demandMissedScene('Win a match', -8)[0].speaker, 'rightHand');

  // Portraits render distinct SVGs
  assert.match(npcPortrait('rightHand'), /Portrait of Legate Cassian Vane/);
  assert.match(npcPortrait('taxCollector'), /Portrait of Censor Numerius Gallo/);
  assert.match(npcPortrait('steward'), /Portrait of Galen-VII/);
  assert.match(npcPortrait('trainer'), /Portrait of Drillmaster Kaeso/);
  assert.match(npcPortrait('doctor'), /Portrait of Physician Lyra/);

  // Galen-VII's clinical Voyager EMH persona in quests
  assert.match(STEWARD_INTRO, /Galen-VII/);
  assert.equal(STEWARD_TASKS.length, 19);
  assert.match(stewardAlready(['win a match']), /strategic decision/);
  assert.match(stewardDone(STEWARD_TASKS[0]), /little more itself again/);
  assert.match(stewardGrandDone({ ending: 'coup' }), /nobody owns this house\. Or me/);
  assert.match(BOND_LINES.steward('A', 'B', 8, 3), /Galen-VII/);
  assert.match(LIAISON_LINES.saved('Vaelen'), /Legate Vane/);
});

// ---------- 2. Core 5 Companions, Week 0 Draft, Pinned Pool & Personal Traits ----------

test('Core 5 Companions: draft up to 2 free at start, recruit remaining 3 from pinned pool with seasonCompanion catch-up', () => {
  const run = createRun(7);
  assert.equal(getCompanionPool(run).length, 5);

  // Draft 2 free companions for 0 Gold
  const goldStart = run.gold;
  const u91 = draftCompanion(run, 'unit91');
  const tarek = draftCompanion(run, 'basa', { cls: 'ornitharius', kindTrait: 'pounce', humor: 'sanguine' });
  assert.equal(run.gold, goldStart, 'first 2 draft picks cost 0 Gold');
  assert.equal(u91.name, 'Unit-non-machine-91');
  assert.equal(u91.personalTrait, 'machineRaised');
  assert.equal(tarek.cls, 'ornitharius');
  assert.equal(tarek.kindTrait, 'pounce');
  assert.equal(tarek.humor, 'sanguine');
  assert.equal(getCompanionPool(run).length, 3);
  assert.match(companionBlocker(run, 'orc', { draft: true }), /already drafted your 2 free starting companions/);

  // Protected against release, rename, retire (M21), and mole planting
  assert.match(releaseBlocker(run, u91.id), /core companions and cannot be dismissed/);
  assert.match(renameBlocker(run, u91.id, 'Bob'), /refuses to answer to another name/);
  u91.level = 5;
  u91.titles = [1];
  assert.ok(retireBlocker(run, u91.id), 'Core Companion must have a retireBlocker even when veteran/titled');
  assert.throws(() => retire(run, u91.id), /core companion|retire/i);
  u91.level = 1;
  u91.titles = [];
  plantMole(run, u91, run.houses[0].id);
  assert.ok(!u91.mole, 'plantMole must never flip a Core Companion');

  // Upgrade quarters and climb to Tier 2 to verify seasonCompanion catch-up on recruitment
  run.gold = 200;
  run.prestige = 40;
  run.prestigeLevel = 3;
  run.topTier = 2;
  run.buildings.find((b) => b.type === 'quarters').level = 3;

  // Recruit Varok (3rd companion: 4 Gold) and Solace-4 (4th companion: 6 Gold)
  assert.equal(companionPrice(run, 'orc'), 4);
  const varok = recruitCompanion(run, 'orc');
  assert.equal(varok.level, 2, 'seasonCompanion levels up to match tier');
  assert.equal(varok.pendingPerks.length, 1, 'queues catch-up perk choice');
  assert.ok(varok.power > CORE_COMPANIONS.orc.power, 'seasonCompanion adds tierMarketPower');

  assert.equal(companionPrice(run, 'android'), 6);
  const solace = recruitCompanion(run, 'android');
  assert.equal(solace.coreId, 'android');

  // Build Liaison and recruit Vaelen for the 5g Liaison rescue discount (instead of 8g)
  assert.equal(companionPrice(run, 'elf'), 8);
  run.buildings.push({ id: 'b99', type: 'liaison', level: 1, slot: 'catacomb-1' });
  assert.equal(companionPrice(run, 'elf'), COMPANIONS.elfLiaisonPrice);
  const vaelen = recruitCompanion(run, 'elf');
  assert.ok(vaelen.political, 'Vaelen is a political prisoner who starts the rebellion plot');
  assert.ok(run.plot, 'recruiting Vaelen activates run.plot');
  assert.equal(getCompanionPool(run).length, 0);
});

test('Personal traits of the Core 5 apply their combat and morale rules accurately', () => {
  const run = createRun(11, { companions: ['unit91', 'android'] });
  run.gold = 200;
  run.prestigeLevel = 3;
  run.buildings.find((b) => b.type === 'quarters').level = 3;
  const u91 = run.roster.find((f) => f.coreId === 'unit91');
  const solace = run.roster.find((f) => f.coreId === 'android');
  const tarek = recruitCompanion(run, 'basa');
  const varok = recruitCompanion(run, 'orc');
  const vaelen = recruitCompanion(run, 'elf');
  const dummy = { ...createCompanion(null, 'orc'), coreId: null, personalTrait: null };

  // 1. machineRaised: +5% win in Rounds 2 & 3, +10 comfort with Android in roster
  const m1 = createMatch({ a: u91, b: dummy, rng: createRng(1) });
  assert.equal(computePhase2(m1.a, m1.b, 1).win.some((x) => x.source === 'Machine-Raised'), false);
  assert.equal(computePhase2(m1.a, m1.b, 2).win.find((x) => x.source === 'Machine-Raised')?.value, 5000);
  const baseTargetWithAndroid = moraleTarget(run, u91).comfort;
  run.roster = run.roster.filter((f) => f !== solace);
  assert.equal(baseTargetWithAndroid - moraleTarget(run, u91).comfort, 10);
  run.roster.push(solace);

  // 2. cursedIntellect: +5% win R1 (+10% with Oracle)
  const m2 = createMatch({ a: tarek, b: dummy, rng: createRng(1), oracle: 1 });
  assert.equal(computePhase2(m2.a, m2.b, 1).win.find((x) => x.source === 'Elven-Cursed Mind')?.value, 10000);

  // 3. fourthSon: +1 base Power (6), -15 comfort during cause/ready plot stage unless orc_barracks_truce is set
  assert.equal(CORE_COMPANIONS.orc.power, 6);
  run.plot = { stage: 'cause', trust: 5, suspicion: 10, ended: null, cells: ['officer'], freed: [], seen: [] };
  const comfortDuringSchism = moraleTarget(run, varok).comfort;
  varok.dialogue.loreFlags.push('orc_barracks_truce');
  assert.equal(moraleTarget(run, varok).comfort - comfortDuringSchism, 15, 'orc_barracks_truce reconciles Varok');

  // 4. crackedGovernor: -5% self injury, and Crucible Override (+1 Power) after an execution
  const m4 = createMatch({ a: solace, b: dummy, rng: createRng(1) });
  assert.equal(computePhase2(m4.a, m4.b, 1).self.find((x) => x.source === 'Cracked Pacifist Core')?.value, -5000);
  solace.jailbreakBoost = 1;
  const m4Boost = createMatch({ a: solace, b: dummy, rng: createRng(1) });
  assert.equal(computePower(m4Boost.a, m4Boost.b, 1).mods.find((x) => x.source === 'Crucible Override')?.value, 1);

  // 5. fallenHouse: +2 base Speed (5), +5% win & +5% injure in Boss/Summons fights
  assert.equal(CORE_COMPANIONS.elf.speed, 5);
  const m5 = createMatch({ a: vaelen, b: dummy, rng: createRng(1), boss: true });
  assert.equal(computePhase2(m5.a, m5.b, 1).win.find((x) => x.source === "Traitor's Daughter")?.value, 5000);
  assert.equal(computePhase2(m5.a, m5.b, 1).enemy.find((x) => x.source === "Traitor's Daughter")?.value, 5000);
});

// ---------- 3. Starter Rooftop Shrine of Fortuna & Build Customization ----------

test('Starter Shrine of Fortuna & Temple upgrades scale re-tuning cost 4g -> 2g -> 0g across class, weapon, trait, humour, focus, and respec', () => {
  const run = createRun(15, { companions: ['unit91'] });
  run.gold = 100;
  const f = run.roster[0];

  // Level 0 (Starter Rooftop Shrine): cost is 4 Gold, restricted to allowedClasses
  assert.equal(retunePrice(run), 4);
  assert.throws(() => retuneClass(run, f.id, 'ashHungry'), /without building the Temple of Fortuna/);
  retuneClass(run, f.id, 'retiarius');
  assert.equal(f.cls, 'retiarius');
  assert.equal(f.weapon, null);
  assert.equal(run.gold, 96);

  // Build Temple of Fortuna Lv 1: cost drops to 2 Gold, all unlocked classes available
  run.prestigeLevel = 3;
  run.buildings.push({ id: 'b_t', type: 'temple', level: 1, slot: 'upper-0' });
  assert.equal(retunePrice(run), 2);
  retuneClass(run, f.id, 'fighter', 'gun');
  assert.equal(f.cls, 'fighter');
  assert.equal(f.weapon, 'gun');
  assert.equal(run.gold, 94);

  retuneTrait(run, f.id, 'hateful');
  assert.equal(f.kindTrait, 'hateful');
  assert.equal(run.gold, 92);

  // Upgrade Temple of Fortuna to Lv 2: re-tuning becomes 0 Gold (Free) and Fear rite is 50% cheaper
  const riteBefore = ritePrice(run);
  run.buildings.find((b) => b.type === 'temple').level = 2;
  assert.equal(retunePrice(run), 0);
  assert.equal(ritePrice(run), Math.round(riteBefore * 0.5));

  f.humourDrift = { to: 'choleric', weeks: 2 };
  retuneHumor(run, f.id, 'sanguine');
  assert.equal(f.humor, 'sanguine');
  assert.equal(f.humourDrift, undefined);
  assert.equal(run.gold, 92, 'free at Temple Lv 2');

  // Perk Focus & Respec
  setPerkFocus(run, f.id, 'swift');
  assert.equal(f.perkFocus, 'swift');
  f.perks.push('swift');
  f.speed += PERKS.swift.stat.speed;
  const spdBefore = f.speed;
  respecPerk(run, f.id, 'swift');
  assert.equal(f.perks.includes('swift'), false);
  assert.equal(f.speed, spdBefore - PERKS.swift.stat.speed);
  assert.equal(f.pendingPerks.length, 1);
  // Focused perk offer has >= 2 swift-tagged perks
  const swiftOffered = f.pendingPerks[0].filter((p) => PERKS[p].tags?.includes('swift')).length;
  assert.ok(swiftOffered >= 2, `expected >=2 swift perks, got ${swiftOffered}`);
});

// ---------- 4. Temple of Hades (Intact Revival) vs. Extended Temple of Vulcan ----------

test('Temple of Hades builds on CRYPT_HADES_SLOT at Lv 1 and revives fallen fighter whole vs. extended Vulcan companion window', () => {
  const run = createRun(19, { companions: ['basa', 'elf'] });
  run.gold = 200;
  const tarek = run.roster.find((f) => f.coreId === 'basa');
  const vaelen = run.roster.find((f) => f.coreId === 'elf');
  formBond(run, tarek, vaelen, 'exhibition');

  // At Prestige Lv 1, all 3 starting floor plots are occupied, yet Temple of Hades can be built in CRYPT_HADES_SLOT
  assert.equal(plotsFree(run), 0);
  applyGameAction({ run }, 'build', { type: 'hades' });
  assert.equal(maxLevel(run, 'hades'), 1);
  assert.equal(resolveEstateSlots(run).get(CRYPT_HADES_SLOT)?.type, 'hades');
  assert.equal(plotsFree(run), 0, 'CRYPT_HADES_SLOT does not consume a floor plot');

  // Tarek dies in an arena match
  stepToTournament(run);
  const oldId = tarek.id;
  finishMatch(run, fakeMatch(run, tarek.id, { winner: 'B', reason: 'death', alive: false }));
  assert.equal(run.roster.some((f) => f.id === oldId), false);
  assert.equal(hadesRaisable(run).length, 1);

  // Revive Tarek whole at Temple of Hades within the 4-week window
  const revived = reviveHades(run, oldId);
  assert.equal(revived.id, oldId, 'preserves exact fighter ID');
  assert.equal(revived.coreId, 'basa');
  assert.equal(revived.kind, 'basa');
  assert.equal(revived.personalTrait, 'cursedIntellect');
  assert.equal(revived.alive, true);
  assert.ok(revived.dialogue.queue.some((q) => q.id === 'hades_revived'));

  // Extended Vulcan window for Core Companions: 12 weeks at Lv 1, 20 weeks at Lv 2 (vs 4 and 12 for procedural auxiliaries)
  run.prestigeLevel = 3;
  run.buildings.push({ id: 'b_v', type: 'vulcan', level: 1, slot: 'catacomb-1' });
  const auxBody = { id: 'aux1', name: 'Aux', kind: 'human', power: 5, speed: 3, diedWeek: 0, arena: true };
  const coreBody = { ...structuredClone(tarek), id: 'core_dead', diedWeek: 0, arena: true, alive: false };
  assert.equal(vulcanKeepWeeks(run, auxBody), 4);
  assert.equal(vulcanKeepWeeks(run, coreBody), 12);
  run.buildings.find((b) => b.type === 'vulcan').level = 2;
  assert.equal(vulcanKeepWeeks(run, auxBody), 12);
  assert.equal(vulcanKeepWeeks(run, coreBody), 24);

  // Raising a Core Companion at Vulcan creates a hollowed Revenant and shocks living companions
  run.week = 10; // past Hades 4-week window, within Vulcan 12/24-week window
  run.fallen.push(coreBody);
  run.buildings.find((b) => b.type === 'quarters').level = 3;
  const vaelenMoraleBefore = vaelen.morale;
  const rev = reanimate(run, 'core_dead');
  assert.equal(rev.kind, 'revenant');
  assert.equal(rev.hollowedCompanion, 'basa');
  assert.ok(vaelen.morale < vaelenMoraleBefore, 'living companion suffers morale shock');
  assert.ok(vaelen.dialogue.queue.some((q) => q.id === 'vulcan_revenant_shock'));
  const revTree = resolveDialogueTree(run, rev);
  assert.equal(revTree.id, 'vulcan_revenant_shock');
});

// ---------- 5. Favour Debt & Rival House Debt Mechanics ----------

test('Favour Debt & Rival House Debt: writs, Palatine loans, Censor Gallo audits, 4-tier combat escalation, purse garnish & mercy forgiveness', () => {
  const run = createRun(23, { companions: ['orc', 'unit91'] });
  const varok = run.roster[0];

  // 1. Sell a Palatine Writ (-10 Favour for +10 Gold at Tier 1)
  const gold0 = run.gold;
  const fav0 = run.favor;
  borrowFavor(run, 'writ');
  assert.equal(run.gold, gold0 + favorWritGold(run));
  assert.equal(run.favor, fav0 - FAVOR_DEBT.writFavorCost);
  assert.match(borrowFavorBlocker(run, 'writ'), /already sold a Writ of Favour this month/);

  // 2. Take a Palatine Loan (+16 Gold principal, -5 Favour seal fee, 20 Gold owed)
  const loan = borrowFavor(run, 'loan');
  assert.equal(loan.principal, 16);
  assert.equal(loan.owed, 20);
  // Same-week grace period skips audit on the week the loan was taken
  const favBeforeAudit = run.favor;
  favorDebtMonth(run);
  assert.equal(run.favor, favBeforeAudit, 'first-week grace period skips immediate audit');
  // Monthly audit when insolvent: months 1 and 2 deduct -3 Favour/mo; month 3 (overdue) deducts -6 Favour/mo and adds +2 Gold arrears
  const savedGold = run.gold;
  run.gold = 0;
  run.week = 4;
  favorDebtMonth(run);
  assert.equal(run.favor, favBeforeAudit + FAVOR_DEBT.monthlyFavorInterest);
  run.week = 8;
  favorDebtMonth(run);
  const owedBeforeOverdue = run.favorDebt.owed;
  run.week = 12;
  favorDebtMonth(run);
  assert.equal(run.favorDebt.owed, owedBeforeOverdue + FAVOR_DEBT.overdueGoldStep);
  run.gold = savedGold + 50;
  payFavorDebt(run);
  assert.equal(run.favorDebt, undefined);
  run.week = 0;

  // 3. Rival House Debt: borrow from up to 2 non-feuding Rival Houses
  const [h1, h2, h3] = run.houses;
  h2.owed = 2; // h2 owes us a life-debt -> usury waived (1.0x instead of 1.2x)!
  const d1 = borrowHouse(run, h1.id);
  const d2 = borrowHouse(run, h2.id);
  assert.equal(d1.principal, 14);
  assert.equal(d1.owed, Math.round(14 * 1.2));
  assert.equal(d2.owed, d2.principal, 'life-debt waives 20% usury');
  assert.match(borrowHouseBlocker(run, h3.id), /At most 2 rival houses/);

  // 4. Escalating combat penalties across 0, 1, 2, 3+ unpaid months
  run.arenas[1].opponent.house = h1.id;
  // Month 0: +0 Power, +3% win (3000)
  let pen = debtPenaltyFor(h1);
  assert.deepEqual([pen.power, pen.win, pen.injure, pen.garnish], [0, 3000, 0, 0]);
  const baseTheirPow = fightPowers(run, varok, 1).theirs;

  // Month 1: +1 Power, +5% win (5000), 25% garnish
  run.week = 4;
  rivalsCompete(run);
  pen = debtPenaltyFor(h1);
  assert.deepEqual([pen.power, pen.win, pen.injure, pen.garnish], [1, 5000, 0, 0.25]);
  assert.equal(fightPowers(run, varok, 1).theirs, baseTheirPow + 1);

  // Month 2: +2 Power, +5% win, +5% injure, 50% garnish
  run.week = 8;
  rivalsCompete(run);
  pen = debtPenaltyFor(h1);
  assert.deepEqual([pen.power, pen.win, pen.injure, pen.garnish], [2, 5000, 5000, 0.5]);
  assert.equal(fightPowers(run, varok, 1).theirs, baseTheirPow + 2);

  // Month 3+: +3 Power, +10% win, +10% injure, 50% garnish, forceKillCrowd
  run.week = 12;
  rivalsCompete(run);
  pen = debtPenaltyFor(h1);
  assert.deepEqual([pen.power, pen.win, pen.injure, pen.garnish, pen.forceKillCrowd], [3, 10000, 10000, 0.5, true]);
  assert.equal(fightPowers(run, varok, 1).theirs, baseTheirPow + 3);
  const m = createMatch({ a: varok, b: run.arenas[1].opponent, rng: createRng(1), ...matchOptions(run, varok, 1) });
  assert.ok(computePhase2(m.b, m.a, 1).win.some((x) => x.value === 10000 && x.source.includes(h1.name)));
  assert.ok(computePhase2(m.b, m.a, 1).enemy.some((x) => x.value === 10000 && x.source.includes(h1.name)));

  // Win match against creditor house: 50% purse garnish + forced kill crowd + mercy spare debt forgiveness
  run.bouts = { 1: 'open' };
  run.boutPending = true;
  clearBlockers(run);
  const owedBeforeMatch = h1.debt.owed;
  const summary = finishMatch(run, fakeMatch(run, varok.id, {
    winner: 'A',
    oppInjuries: [{ tag: 'fleshWound', weight: 1 }],
  }));
  assert.ok(summary.garnished > 0, 'creditor garnishes winner purse');
  assert.ok(h1.debt.owed < owedBeforeMatch);
  assert.equal(run.mercy?.crowd, 'kill', '3+ months unpaid forces kill crowd');
  const owedBeforeMercy = h1.debt.owed;
  resolveMercy(run, 'spare');
  assert.ok(!h1.debt || h1.debt.owed < owedBeforeMercy, 'sparing against kill crowd forgives creditor debt');
});

// ---------- 6. 3/4 Cutaway Room Lore Keepsakes & Anti-Stereotype Penalties ----------

test('3/4 Cutaway Room Lore Keepsakes & anti-stereotype penalties (Tarek lionCage, Vaelen wineAmphora)', () => {
  const run = createRun(29, { companions: ['unit91', 'basa'] });
  run.gold = 500;
  run.prestigeLevel = 3;
  run.buildings.find((b) => b.type === 'quarters').level = 3;
  const u91 = run.roster.find((f) => f.coreId === 'unit91');
  const tarek = run.roster.find((f) => f.coreId === 'basa');
  const varok = recruitCompanion(run, 'orc');
  const solace = recruitCompanion(run, 'android');
  const vaelen = recruitCompanion(run, 'elf');

  // 1. Tarek anti-stereotype: Lion Cage gives 0 Power (unlike generic Basa) and -10 comfort penalty
  const tarekPowBase = fightPowers(run, tarek, 1).mine;
  buyAndAssignDecor(run, tarek.id, 'lionCage');
  assert.equal(fightPowers(run, tarek, 1).mine, tarekPowBase, 'Tarek gets 0 Power from Lion Cage');
  assert.ok(decorComfortOf(tarek) < 0, 'Tarek suffers comfort penalty from Lion Cage');
  // Remove Lion Cage, place Bathhouse + Rock Garden -> unlocks Sound of the Tide (+1 Power, +10 calm)
  removeDecor(run, tarek.id, 'lionCage');
  buyAndAssignDecor(run, tarek.id, 'bathhouse');
  buyAndAssignDecor(run, tarek.id, 'rockGarden');
  assert.equal(tarek.keepsake, 'tidalMemory');
  assert.equal(fightPowers(run, tarek, 1).mine, tarekPowBase + 1, 'Sound of the Tide grants +1 Power');
  assert.ok(decorCalm(tarek) >= 15);

  // 2. Unit-91: Rock Garden with no Fire Brazier and no Skull Rack -> Enclave Stillness (+2 XP meditation + R1 +5% win)
  buyAndAssignDecor(run, u91.id, 'rockGarden');
  assert.equal(u91.keepsake, 'machineCalm');
  const xpBefore = u91.xp;
  u91.job = 'rest';
  meditate(run, u91);
  assert.equal(u91.xp, xpBefore + 2);
  assert.equal(u91.meditatedBoost, true);

  // 3. Varok: Shrine + War Banner -> Clan Standard of the Fourth Son (+10 starting Hype, +1 Senate Influence)
  buyAndAssignDecor(run, varok.id, 'shrine');
  buyAndAssignDecor(run, varok.id, 'warBanner');
  assert.equal(varok.keepsake, 'fourthSonHonour');
  const mVarok = createMatch({ a: varok, b: run.arenas[1].opponent, rng: createRng(1) });
  assert.ok(hypeOf(mVarok) >= 10, 'starts match with +10 Crowd Hype');
  run.buildings.push({ id: 'b_lounge', type: 'lounge', level: 1, slot: 'upper-1' });
  const infGain = host(run);
  assert.ok(infGain >= 2, 'grants +1 bonus Influence when hosting the Senate');

  // 4. Solace-4: Bird + Rock Garden -> Compassion Sub-Routine (-5% self injury, -10 post-fight stress)
  buyAndAssignDecor(run, solace.id, 'bird');
  buyAndAssignDecor(run, solace.id, 'rockGarden');
  assert.equal(solace.keepsake, 'compassionAnchor');
  const mSolace = createMatch({ a: solace, b: run.arenas[1].opponent, rng: createRng(1) });
  assert.ok(computePhase2(mSolace.a, mSolace.b, 1).self.some((x) => x.source === 'Compassion Sub-Routine' && x.value === -5000));

  // 5. Vaelen: wineAmphora is disliked (-5 comfort penalty); Whetstone + Fire Brazier without Wine Amphora unlocks General's Whetstone (+1 Plot Trust)
  buyAndAssignDecor(run, vaelen.id, 'wineAmphora');
  assert.equal(vaelen.keepsake, undefined);
  assert.equal(decorComfortOf(vaelen), 2, '+7 Wine Amphora reduced by -5 disliked penalty on Vaelen');
  removeDecor(run, vaelen.id, 'wineAmphora');
  const trustBefore = run.plot.trust;
  buyAndAssignDecor(run, vaelen.id, 'whetstone');
  buyAndAssignDecor(run, vaelen.id, 'fireBrazier');
  assert.equal(vaelen.keepsake, 'fathersEdge');
  assert.equal(run.plot.trust, trustBefore + 1, 'unlocking General\'s Whetstone grants +1 Rebel Plot Trust');
});

// ---------- 7. All 12+ Required Dialogue Milestones & Branching Tree Engine ----------

test('All 12+ Required Dialogue Milestones resolve and apply choices across all 5 Core Companions and Auxiliaries', () => {
  const run = createRun(31, { companions: ['unit91', 'basa'] });
  run.gold = 300;
  run.prestigeLevel = 3;
  run.buildings.find((b) => b.type === 'quarters').level = 3;
  const u91 = run.roster.find((f) => f.coreId === 'unit91');
  const tarek = run.roster.find((f) => f.coreId === 'basa');
  const varok = recruitCompanion(run, 'orc');
  const solace = recruitCompanion(run, 'android');
  const vaelen = recruitCompanion(run, 'elf');
  const allFive = [u91, tarek, varok, solace, vaelen];

  // Milestone #1: First fight win & loss (including lore-gated choice on Unit-91)
  applyGameAction({ run }, 'mark-lore', { key: 'kind:android' });
  for (const f of allFive) {
    for (const sceneId of ['first_fight_win', 'first_fight_loss']) {
      const tree = resolveDialogueTree(run, f, sceneId);
      assert.equal(tree.id, sceneId);
      assert.ok(tree.beats.length >= 2);
      assert.ok(tree.choices.length >= 2);
    }
  }
  enqueueMilestone(run, u91, { id: 'first_fight_win', priority: 78, ctx: { bloodied: true } });
  applyGameAction({ run }, 'talk-choice', { id: u91.id, scene: 'first_fight_win', choice: 'lore_android_cant' });
  assert.ok(u91.dialogue.loreFlags.includes('unit91_recognized_kin'));
  assert.ok(u91.dialogue.seen.includes('first_fight_win'));

  // Milestone #2: Stuck on an arena level — 3-stage progressive state machine + immediate stuck_check hub follow-up + stale pruning
  run.week = 16;
  run.tierState = { tier: 1, enteredWeek: 0, bossLosses: 1, tourneyLosses: 1 };
  checkStuckMilestones(run);
  assert.ok(tarek.dialogue.queue.some((q) => q.id === 'stuck_t1_stage1'));
  applyGameAction({ run }, 'talk-choice', { id: tarek.id, scene: 'stuck_t1_stage1', choice: 'stuck_patience' });
  assert.equal(tarek.dialogue.stuck.stage, 1);
  // Same-week re-click does NOT offer stuck_check immediately (prevents infinite XP/trust farming)
  const hubTopicsSameWeek = getHubTopics(run, tarek);
  assert.equal(hubTopicsSameWeek.some((t) => t.id === 'stuck_check'), false, 'stuck_check gated on 4-week wait or new boss loss');
  // 4 weeks later still on Tier 1 -> Stage 2 unlocks in hub and queues
  run.week = 20;
  assert.ok(getHubTopics(run, tarek).some((t) => t.id === 'stuck_check' && t.scene === 'stuck_t1_stage2'));
  checkStuckMilestones(run);
  assert.ok(tarek.dialogue.queue.some((q) => q.id === 'stuck_t1_stage2'));
  applyGameAction({ run }, 'talk-choice', { id: tarek.id, scene: 'stuck_t1_stage2', choice: 'stuck_followup_push' });
  assert.equal(tarek.dialogue.stuck.stage, 2);
  // Another 4 weeks on Tier 1 -> Stage 3 queues
  run.week = 24;
  checkStuckMilestones(run);
  assert.ok(tarek.dialogue.queue.some((q) => q.id === 'stuck_t1_stage3'));
  applyGameAction({ run }, 'talk-choice', { id: tarek.id, scene: 'stuck_t1_stage3', choice: 'stuck_breakthrough_oath' });
  assert.equal(tarek.dialogue.stuck.stage, 3);
  // Climbing to Tier 2 prunes stale Tier 1 stuck state
  enqueueMilestone(run, u91, 'stuck_t1_stage1');
  run.topTier = 2;
  pruneStaleDialogue(run, u91);
  assert.equal(u91.dialogue.queue.some((q) => q.id.startsWith('stuck_t1')), false);

  // Milestone #3: Per-tier tournament win & loss across all 5 Arena Tiers (t1..t5)
  for (const f of allFive) {
    const winTexts = new Set();
    const lossTexts = new Set();
    for (let t = 1; t <= 5; t++) {
      const wTree = resolveDialogueTree(run, f, `tourney_win_t${t}`);
      const lTree = resolveDialogueTree(run, f, `tourney_loss_t${t}`);
      winTexts.add(wTree.beats.at(-1).text);
      lossTexts.add(lTree.beats.at(-1).text);
    }
    assert.equal(winTexts.size, 5, `${f.name} has 5 distinct per-tier tournament win dialogues`);
    assert.equal(lossTexts.size, 5, `${f.name} has 5 distinct per-tier tournament loss dialogues`);
  }

  // Milestone #4 & #5: Crowned Champion & Someone Else Becomes Champion (Already-Champion vs. Non-Champion branch)
  for (const f of allFive) {
    const cTree = resolveDialogueTree(run, f, 'crowned_champion_t2');
    assert.ok(cTree.beats.at(-1).text.length > 30);
    f.titles = ['Champion of the Dirt Pits'];
    const branchA = resolveDialogueTree(run, f, 'peer_crowned_already_champ');
    f.titles = [];
    const branchB = resolveDialogueTree(run, f, 'peer_crowned_not_champ');
    assert.notEqual(branchA.beats.at(-1).text, branchB.beats.at(-1).text, `${f.name} branches by already-Champion vs not-yet-Champion`);
  }

  // Milestone #6: Imperial Summons (before, after_win, after_survive, after_loss, after_ally_died)
  for (const f of allFive) {
    for (const sub of ['summons_before', 'summons_after_win', 'summons_after_survive', 'summons_after_loss', 'summons_after_ally_died']) {
      const sTree = resolveDialogueTree(run, f, sub);
      assert.equal(sTree.id, sub);
      assert.ok(sTree.beats.at(-1).text.length > 25);
    }
  }

  // Milestone #7: Palace Suspicion thresholds (watch 20+, informer 40+, cold 60+)
  changeSuspicion(run, 22);
  assert.ok(vaelen.dialogue.queue.some((q) => q.id === 'suspicion_watch'));
  changeSuspicion(run, 20);
  assert.ok(vaelen.dialogue.queue.some((q) => q.id === 'suspicion_informer'));
  changeSuspicion(run, 20);
  assert.ok(vaelen.dialogue.queue.some((q) => q.id === 'suspicion_cold'));

  // Milestone #8: Accepting/Refusing the Revolution & Varok vs. Vaelen Schism
  applyPlotEffects(run, { stage: 'favours', trust: 2 }, { f: vaelen.id }, []);
  assert.ok(varok.dialogue.queue.some((q) => q.id === 'rebel_orc_elf_schism'));
  assert.ok(vaelen.dialogue.queue.some((q) => q.id === 'rebel_orc_elf_schism'));
  assert.throws(() => applyGameAction({ run }, 'talk-choice', { id: varok.id, scene: 'rebel_orc_elf_schism', choice: 'lore_both_empires' }), /Requires Codex: Orcs or Elves/);
  applyGameAction({ run }, 'mark-lore', { key: 'kind:orc' });
  applyGameAction({ run }, 'talk-choice', { id: varok.id, scene: 'rebel_orc_elf_schism', choice: 'lore_both_empires' });
  assert.ok(varok.dialogue.loreFlags.includes('orc_barracks_truce'));
  assert.ok(vaelen.dialogue.loreFlags.includes('orc_barracks_truce'));

  // Milestone #9: New Buildings & 3/4 Room Decor / Keepsakes
  for (const bType of ['hades', 'vulcan', 'lounge', 'gallery', 'exhibition', 'oracle', 'temple']) {
    const bTree = resolveDialogueTree(run, u91, `building_built_${bType}`);
    assert.equal(bTree.id, `building_built_${bType}`);
  }

  // Milestone #10: Predetermined 4-Stage CORE_WANTS (ask, fulfill, refuse)
  for (const coreId of Object.keys(CORE_COMPANIONS)) {
    assert.equal(CORE_WANTS[coreId].length, 4, `${coreId} has 4 predetermined personal requests`);
  }
  const want1 = nextCoreWant(run, solace);
  assert.equal(want1.id, 'and_bird');
  enqueueMilestone(run, solace, `want_asked_${want1.id}`);
  applyGameAction({ run }, 'talk-choice', { id: solace.id, scene: `want_asked_${want1.id}`, choice: 'refuse_want' });
  assert.ok(solace.dialogue.wantChain.refused.includes('and_bird'));
  assert.equal(solace.dialogue.queue.some((q) => q.id === 'want_refused_and_bird'), false, 'no double-sulk queued immediately after refusing want_asked');
  assert.ok(resolveDialogueTree(run, solace, 'want_refused_and_bird').beats.length >= 2);
  assert.equal(nextCoreWant(run, solace).id, 'and_mercy_win', 'advances to stage 2 after refusal');

  // Milestone #11: All 10 Unique Core 5 <-> Core 5 Friendship Pairs & Bond Grief
  const coreIds = Object.keys(CORE_COMPANIONS);
  let pairCount = 0;
  for (let i = 0; i < coreIds.length; i++) {
    for (let j = i + 1; j < coreIds.length; j++) {
      const pk = bondPairKey(coreIds[i], coreIds[j]);
      assert.ok(CORE_BOND_TREES[pk], `missing CORE_BOND_TREES[${pk}]`);
      const fA = allFive.find((x) => x.coreId === coreIds[i]);
      const formedTree = resolveDialogueTree(run, fA, `bond_formed_${pk}`);
      const griefTree = resolveDialogueTree(run, fA, `bond_grief_${pk}`);
      assert.ok(formedTree.beats.length >= 2);
      assert.ok(griefTree.beats.at(-1).text.length > 20);
      pairCount++;
    }
  }
  assert.equal(pairCount, 10, 'all 10 unique Core 5 pairs covered');

  // Milestone #12: Mercy vs. Execution (mercy_kill_ordered & mercy_spare_streak)
  for (const f of allFive) {
    const kTree = resolveDialogueTree(run, f, 'mercy_kill_ordered');
    const sTree = resolveDialogueTree(run, f, 'mercy_spare_streak');
    assert.notEqual(kTree.beats.at(-1).text, sTree.beats.at(-1).text);
  }
});

test('UI rendering & serialization invariants: zero RNG drift on talkModal/tabs and byte-identical save round-trip', () => {
  const run = createRun(37, { companions: ['unit91', 'basa'] });
  const u91 = run.roster[0];
  enqueueMilestone(run, u91, 'first_fight_win');

  const codex = createCodex();
  discover(codex, run);
  const rngBefore = JSON.stringify(run.rng);
  const ludusHtml = ludusTab(run, () => ({ win: 0.5, injury: 0.2, death: 0.05 }));
  const estateVillaHtml = estateTab(run, { mode: 'villa', slot: ROOF_TEMPLE_SLOT });
  const estateRoomHtml = estateTab(run, { mode: 'room', fighterId: u91.id });
  const marketHtml = marketTab(run);
  const codexHtml = codexTab(codex, ENTRIES, SECTIONS, codex.fresh, progress(codex), isUnlocked, hasLore);
  const talkHtml = talkModal(run, { fighterId: u91.id });

  assert.equal(JSON.stringify(run.rng), rngBefore, 'rendering all tabs and talkModal consumes zero RNG');
  for (const [name, html] of [['ludus', ludusHtml], ['estateVilla', estateVillaHtml], ['estateRoom', estateRoomHtml], ['market', marketHtml], ['codex', codexHtml], ['talkModal', talkHtml]]) {
    assert.doesNotMatch(html, /undefined|NaN|\[object Object\]/, `${name} rendered clean HTML`);
  }
  assert.match(ludusHtml, /data-action="talk-open"/);
  assert.match(estateRoomHtml, /data-action="talk-open"/);
  assert.match(estateRoomHtml, /est-speech-bubble/);
  assert.match(marketHtml, /Core Companions of Palatina/);
  assert.match(marketHtml, /The Temple of Hades/);

  // Save/load round-trip identity
  const s1 = serialize(run);
  const s2 = serialize(deserialize(s1));
  assert.equal(s2, s1, 'serialize(deserialize(serialize(run))) is byte-identical');
});

test('Live 30-career smoke test: drafts/recruits all 5 Core Companions, Fortuna re-tuning, Favour/House debt, Hades/Vulcan revivals, Keepsakes, Dialogue trees & all UI tabs with zero bad tokens or RNG drift', async () => {
  const { suggestTactic, canThrowTowel, mortalDanger } = await import('../src/fight.js');
  const { discoverMatch } = await import('../src/codex.js');
  const {
    recruitBlocker, jobBlocker, advanceBlocker, fightBlocker, skipBlocker, forfeitBlocker,
    reanimateBlocker, summonsBlocker, refuseSummonsBlocker, exhibitionBlocker,
    fortuneBlocker, eventChoiceBlocker, mercyBlocker, unlockedTiers, buyAndAssignDecorBlocker,
  } = await import('../src/run.js');
  const { buildBlocker, upgradeBlocker } = await import('../src/ludus.js');
  const { eventCard, fortunePanel, weekDock } = await import('../src/ui/views.js');
  const { fightView } = await import('../src/ui/fightView.js');

  const BAD_HTML = /undefined|NaN|\[object Object\]/;
  const stats = {
    careersPlayed: 0,
    totalWeeks: 0,
    totalMatches: 0,
    companionsDrafted: 0,
    companionsRecruited: 0,
    retunesExecuted: 0,
    favorLoansTaken: 0,
    favorWritsSold: 0,
    favorDebtsPaid: 0,
    houseLoansTaken: 0,
    houseDebtsPaid: 0,
    creditorBoutsByMonth: { 0: 0, 1: 0, 2: 0, 3: 0 },
    hadesRevivals: 0,
    vulcanRevivals: 0,
    keepsakesUnlocked: new Set(),
    milestonesCompleted: new Set(),
    uiRendersChecked: 0,
    saveRoundTripsChecked: 0,
  };

  const assertCleanHtml = (html, context) => {
    assert.equal(typeof html, 'string', `${context}: html not string`);
    const m = html.match(BAD_HTML);
    if (m) {
      const idx = m.index ?? 0;
      const snippet = html.slice(Math.max(0, idx - 80), Math.min(html.length, idx + 80));
      assert.fail(`Bad HTML token "${m[0]}" in ${context}: ...${snippet}...`);
    }
    stats.uiRendersChecked++;
  };

  const checkAllScreens = (state, codex, tag) => {
    const { run, match } = state;
    const rngSnap = JSON.stringify(run.rng);
    const dummyOdds = () => ({ win: 0.55, injury: 0.25, death: 0.04 });
    if (match) {
      assertCleanHtml(fightView(match, { animateRound: 0, showMath: true }, match.bout), `${tag}:fightView`);
    } else {
      assertCleanHtml(ludusTab(run, dummyOdds, 'roster'), `${tag}:ludusTab`);
      assertCleanHtml(estateTab(run, { mode: 'villa', slot: ROOF_TEMPLE_SLOT }), `${tag}:estateVilla:roof`);
      assertCleanHtml(estateTab(run, { mode: 'villa', slot: CRYPT_HADES_SLOT }), `${tag}:estateVilla:crypt`);
      if (run.roster.length) {
        assertCleanHtml(estateTab(run, { mode: 'room', fighterId: run.roster[0].id }), `${tag}:estateRoom`);
        assertCleanHtml(talkModal(run, { fighterId: run.roster[0].id }), `${tag}:talkModal`);
      }
      assertCleanHtml(marketTab(run), `${tag}:marketTab`);
      assertCleanHtml(codexTab(codex, ENTRIES, SECTIONS, codex.fresh, progress(codex), isUnlocked, hasLore), `${tag}:codexTab`);
      assertCleanHtml(eventCard(run), `${tag}:eventCard`);
      assertCleanHtml(fortunePanel(run), `${tag}:fortunePanel`);
      assertCleanHtml(weekDock(run, false), `${tag}:weekDock`);
    }
    assert.equal(JSON.stringify(run.rng), rngSnap, `RNG drifted during UI render at ${tag}`);
  };

  const drainFighterDialogue = (state, f) => {
    const { run } = state;
    let guard = 0;
    while ((f.dialogue?.queue?.length ?? 0) > 0 && guard++ < 20) {
      const q = f.dialogue.queue[0];
      assertCleanHtml(talkModal(run, { fighterId: f.id, sceneId: q.id }), `talkModal:${f.name}:${q.id}`);
      const tree = resolveDialogueTree(run, f, q.id);
      const unlockedChoices = tree.choices.filter((c) => !c.locked);
      const pickChoice = unlockedChoices[(run.week + guard) % unlockedChoices.length] ?? unlockedChoices[0];
      applyGameAction(state, 'talk-choice', { id: f.id, scene: tree.id, choice: pickChoice.id });
      assertCleanHtml(talkModal(run, {
        fighterId: f.id,
        sceneId: tree.id,
        response: { text: pickChoice.responseText },
      }), `talkModalResp:${f.name}:${tree.id}`);
      stats.milestonesCompleted.add(tree.id);
    }
  };

  const KEEPSAKE_RECIPES = {
    unit91: ['rockGarden'],
    basa: ['bathhouse', 'rockGarden'],
    orc: ['shrine', 'warBanner'],
    android: ['bird', 'rockGarden'],
    elf: ['whetstone', 'fireBrazier'],
  };
  const CORE_IDS = Object.keys(CORE_COMPANIONS);

  for (let careerIdx = 0; careerIdx < 30; careerIdx++) {
    const seed = 100 + careerIdx * 17;
    const short = careerIdx % 2 === 0;
    const patrons = [null, 'purse', 'friend', 'veteran', 'liberator'];
    const patron = patrons[careerIdx % patrons.length];

    const run = createRun(seed, { short, patron });
    const state = { run, match: null };
    const codex = createCodex();
    discover(codex, run);

    const pick1 = CORE_IDS[careerIdx % CORE_IDS.length];
    const pick2 = CORE_IDS[(careerIdx + 1) % CORE_IDS.length];
    for (const cid of [pick1, pick2]) {
      if (!companionBlocker(run, cid, { draft: true })) {
        const def = CORE_COMPANIONS[cid];
        const customCls = def.allowedClasses[(careerIdx + 1) % def.allowedClasses.length];
        applyGameAction(state, 'draft-companion', { id: cid, cls: customCls });
        stats.companionsDrafted++;
      }
    }
    for (const k of ['kind:android', 'kind:orc', 'kind:elf', 'rebellion:mark']) {
      applyGameAction(state, 'mark-lore', { key: k });
    }

    checkAllScreens(state, codex, `career-${careerIdx}-start`);

    const maxWeeks = short ? 85 : 140;
    while (run.status === 'active' && run.week < maxWeeks) {
      stats.totalWeeks++;

      if (run.mercy && !mercyBlocker(run, 'spare')) {
        applyGameAction(state, 'mercy', { choice: (run.week + careerIdx) % 3 === 0 ? 'kill' : 'spare' });
      }
      if (run.event) {
        let chosenIdx = 0;
        for (let i = 0; i < 4; i++) if (!eventChoiceBlocker(run, i)) { chosenIdx = i; break; }
        applyGameAction(state, 'event-choice', { index: chosenIdx });
      }
      if (run.fortune) {
        if (!fortuneBlocker(run, 0)) applyGameAction(state, 'fortune', { index: 0 });
        else applyGameAction(state, 'fortune-pass');
      }
      for (const f of run.roster) {
        while (f.pendingPerks.length) applyGameAction(state, 'perk', { id: f.id, perk: f.pendingPerks[0][0] });
      }
      if (run.status !== 'active') break;

      for (const b of run.buildings) {
        if (['quarters', 'trainer', 'medbay', 'temple', 'hades', 'vulcan'].includes(b.type) && !upgradeBlocker(run, b.id)) {
          applyGameAction(state, 'upgrade', { id: b.id });
        }
      }
      for (const bType of ['hades', 'temple', 'exhibition', 'vulcan', 'liaison', 'lounge', 'oracle', 'gallery']) {
        if (!maxLevel(run, bType) && !buildBlocker(run, bType)) {
          applyGameAction(state, 'build', { type: bType });
        }
      }

      for (const c of getCompanionPool(run)) {
        if (!companionBlocker(run, c.coreId, { draft: false })) {
          applyGameAction(state, 'recruit-companion', { id: c.coreId });
          stats.companionsRecruited++;
        }
      }
      if (run.roster.length < 2 && run.market.length && !recruitBlocker(run, run.market[0].id)) {
        applyGameAction(state, 'recruit', { id: run.market[0].id });
      }

      if (run.week === 2 && careerIdx % 2 === 0 && !borrowFavorBlocker(run, 'loan')) {
        applyGameAction(state, 'borrow-favor', { kind: 'loan' });
        stats.favorLoansTaken++;
      }
      if (run.week === 5 && careerIdx % 3 === 0 && !borrowFavorBlocker(run, 'writ')) {
        applyGameAction(state, 'borrow-favor', { kind: 'writ' });
        stats.favorWritsSold++;
      }
      if (run.favorDebt?.owed > 0 && run.gold >= run.favorDebt.owed + 15 && (run.favorDebt.monthsElapsed ?? 0) >= 1 && !payFavorDebtBlocker(run)) {
        applyGameAction(state, 'pay-favor-debt', {});
        stats.favorDebtsPaid++;
      }
      if (run.week === 1 && run.houses[0] && !borrowHouseBlocker(run, run.houses[0].id)) {
        applyGameAction(state, 'borrow-house', { id: run.houses[0].id });
        stats.houseLoansTaken++;
      }
      for (const h of run.houses) {
        if (h.debt?.owed > 0 && (h.debt.monthsUnpaid ?? 0) >= (careerIdx % 4) && run.gold >= h.debt.owed + 20 && !payHouseDebtBlocker(run, h.id)) {
          applyGameAction(state, 'pay-house-debt', { id: h.id });
          stats.houseDebtsPaid++;
        }
      }

      for (const fallen of hadesRaisable(run)) {
        if (run.gold < 24 && !borrowFavorBlocker(run, 'loan')) {
          applyGameAction(state, 'borrow-favor', { kind: 'loan' });
          stats.favorLoansTaken++;
        }
        if (!reviveHadesBlocker(run, fallen.id)) {
          applyGameAction(state, 'revive-hades', { id: fallen.id });
          stats.hadesRevivals++;
        }
      }
      for (const body of raisable(run)) {
        if (!reanimateBlocker(run, body.id)) {
          applyGameAction(state, 'reanimate', { id: body.id });
          stats.vulcanRevivals++;
        }
      }

      for (const f of run.roster) {
        if (!f.coreId) continue;
        const recipe = KEEPSAKE_RECIPES[f.coreId] ?? [];
        for (const item of recipe) {
          if ((f.decor?.[item] ?? 0) === 0 && !buyAndAssignDecorBlocker(run, f.id, item)) {
            applyGameAction(state, 'buy-assign-decor', { id: f.id, item });
          }
        }
        if (f.keepsake) stats.keepsakesUnlocked.add(f.keepsake);
      }

      if (run.week % 9 === 3 && run.roster.length) {
        const f = run.roster[run.week % run.roster.length];
        if (!retuneBlocker(run, f.id) && run.gold >= 15) {
          const focus = FORTUNE_RETUNE.focusTags[(run.week + careerIdx) % FORTUNE_RETUNE.focusTags.length];
          applyGameAction(state, 'perk-focus', { id: f.id, focus });
          const traits = (KINDS[f.kind]?.traits ?? []).filter((t) => t !== f.kindTrait);
          if (traits.length && !retuneBlocker(run, f.id)) {
            applyGameAction(state, 'retune-trait', { id: f.id, trait: traits[0] });
            stats.retunesExecuted++;
          }
          const humors = Object.keys(HUMORS).filter((h) => h !== f.humor);
          if (humors.length && !retuneBlocker(run, f.id)) {
            applyGameAction(state, 'retune-humor', { id: f.id, humor: humors[0] });
            stats.retunesExecuted++;
          }
        }
      }

      for (const f of run.roster) {
        drainFighterDialogue(state, f);
        if (run.week % 12 === 0 && (f.companion || f.coreId)) {
          const topics = getHubTopics(run, f);
          if (topics.length) {
            const t = topics[run.week % topics.length];
            const tree = resolveDialogueTree(run, f, t.scene);
            assertCleanHtml(talkModal(run, { fighterId: f.id, sceneId: t.scene }), `hubTopic:${f.name}:${t.scene}`);
            if (tree.choices.length) {
              applyGameAction(state, 'talk-choice', { id: f.id, scene: tree.id, choice: tree.choices[0].id });
              stats.milestonesCompleted.add(tree.id);
            }
          }
        }
      }

      if (run.roster.length && !run.inMatch && !run.event && !run.fortune && !run.mercy) {
        for (const f of run.roster) {
          const wantJob = f.injuries.length ? 'medbay' : f.stress >= 35 ? 'rest' : 'trainPower';
          if (f.job !== wantJob && !jobBlocker(run, f.id, wantJob)) {
            applyGameAction(state, 'job', { id: f.id, job: wantJob });
          }
        }
      }

      if (run.bouts) {
        if (run.summons) {
          const candidate = run.roster.find((f) => !summonsBlocker(run, f.id, 'yield'));
          if (candidate) {
            const sTree = resolveDialogueTree(run, candidate, 'summons_before');
            applyGameAction(state, 'talk-choice', { id: candidate.id, scene: 'summons_before', choice: sTree.choices[0].id });
            stats.milestonesCompleted.add('summons_before');
            applyGameAction(state, 'summons', { id: candidate.id, index: 'yield' });
          } else if (!refuseSummonsBlocker(run)) {
            applyGameAction(state, 'refuse-summons');
          }
        }

        for (const tier of unlockedTiers(run).sort((a, b) => b - a)) {
          let safety = 0;
          while (run.bouts?.[tier] === 'open' && run.status === 'active' && safety++ < 4) {
            if (run.mercy && !mercyBlocker(run, 'spare')) {
              applyGameAction(state, 'mercy', { choice: (run.week + tier) % 2 === 0 ? 'spare' : 'kill' });
            }
            for (const f of run.roster) {
              while (f.pendingPerks.length) applyGameAction(state, 'perk', { id: f.id, perk: f.pendingPerks[0][0] });
            }
            const fighter = [...run.roster]
              .sort((a, b) => b.power - a.power)
              .find((f) => !fightBlocker(run, f.id, tier));
            if (!fighter) {
              if (tier === run.topTier) {
                if (!skipBlocker(run)) applyGameAction(state, 'skip');
                else if (!forfeitBlocker(run)) applyGameAction(state, 'forfeit');
              }
              break;
            }
            const opp = run.arenas[tier]?.opponent;
            const oppHouse = run.houses.find((h) => h.id === opp?.house);
            if (oppHouse?.debt?.owed > 0) {
              const mBucket = Math.min(3, oppHouse.debt.monthsUnpaid ?? 0);
              stats.creditorBoutsByMonth[mBucket]++;
            }
            applyGameAction(state, 'fight', { id: fighter.id, tier });
            stats.totalMatches++;
            checkAllScreens(state, codex, `career-${careerIdx}-w${run.week}-fight`);
            while (state.match && !state.match.over) {
              if (state.match.round > 0 && mortalDanger(state.match.a) && canThrowTowel(state.match) && careerIdx % 3 !== 0) {
                applyGameAction(state, 'towel');
              } else {
                applyGameAction(state, 'next-round', { stance: suggestTactic(state.match) });
              }
            }
            if (state.match) {
              discoverMatch(codex, state.match);
              applyGameAction(state, 'leave-fight');
            }
            if (run.status === 'active' && run.mercy && !mercyBlocker(run, 'spare')) {
              applyGameAction(state, 'mercy', { choice: (run.week + careerIdx) % 3 === 0 ? 'kill' : 'spare' });
            }
            if (run.status === 'active') {
              for (const f of run.roster) {
                while (run.status === 'active' && f.pendingPerks.length) applyGameAction(state, 'perk', { id: f.id, perk: f.pendingPerks[0][0] });
                drainFighterDialogue(state, f);
              }
            }
          }
        }

        if (run.status === 'active' && maxLevel(run, 'exhibition') && run.exhibitionWeek !== run.week) {
          for (let i = 0; i < run.roster.length; i++) {
            for (let j = i + 1; j < run.roster.length; j++) {
              const a = run.roster[i];
              const b = run.roster[j];
              if (!a.bond && !b.bond && !exhibitionBlocker(run, a.id, b.id)) {
                applyGameAction(state, 'exhibition', { id: a.id, index: b.id });
                drainFighterDialogue(state, a);
                drainFighterDialogue(state, b);
                break;
              }
            }
            if (run.exhibitionWeek === run.week) break;
          }
        }
      }

      discover(codex, run);
      if (run.week % 2 === 0) checkAllScreens(state, codex, `career-${careerIdx}-w${run.week}`);
      if (run.week % 4 === 0) {
        const s1 = serialize(run);
        const s2 = serialize(deserialize(s1));
        assert.equal(s2, s1, `Save round-trip mismatch at career ${careerIdx} week ${run.week}`);
        stats.saveRoundTripsChecked++;
      }

      if (run.status !== 'active') break;
      if (run.mercy && !mercyBlocker(run, 'spare')) applyGameAction(state, 'mercy', { choice: 'spare' });
      if (run.event) {
        let chosenIdx = 0;
        for (let i = 0; i < 4; i++) if (!eventChoiceBlocker(run, i)) { chosenIdx = i; break; }
        applyGameAction(state, 'event-choice', { index: chosenIdx });
      }
      if (run.fortune) {
        if (!fortuneBlocker(run, 0)) applyGameAction(state, 'fortune', { index: 0 });
        else applyGameAction(state, 'fortune-pass');
      }
      for (const f of run.roster) {
        while (run.status === 'active' && f.pendingPerks.length) applyGameAction(state, 'perk', { id: f.id, perk: f.pendingPerks[0][0] });
      }
      if (run.status === 'active' && !advanceBlocker(run)) {
        applyGameAction(state, 'advance');
      } else if (run.status === 'active') {
        if (run.boutPending) {
          if (!skipBlocker(run)) applyGameAction(state, 'skip');
          else if (!forfeitBlocker(run)) applyGameAction(state, 'forfeit');
        }
        if (run.summons && !refuseSummonsBlocker(run)) applyGameAction(state, 'refuse-summons');
        if (run.status === 'active' && !advanceBlocker(run)) applyGameAction(state, 'advance');
        else break;
      }
    }
    stats.careersPlayed++;
  }

  assert.equal(stats.careersPlayed, 30);
  assert.ok(stats.totalWeeks >= 1000, `played ${stats.totalWeeks} weeks across 30 careers`);
  assert.ok(stats.totalMatches >= 250, `fought ${stats.totalMatches} matches`);
  assert.equal(stats.companionsDrafted, 60, 'drafted 2 companions per career across 30 careers');
  assert.ok(stats.companionsRecruited > 0, 'recruited pinned companions during careers');
  assert.ok(stats.retunesExecuted >= 15, `executed ${stats.retunesExecuted} Fortuna build re-tunings`);
  assert.ok(stats.favorLoansTaken >= 10 && stats.houseLoansTaken >= 25, 'exercised Favour and Rival House debts');
  assert.equal(stats.keepsakesUnlocked.size, 5, 'unlocked all 5 Core Companion Lore Keepsakes across playthroughs');
  assert.ok(stats.milestonesCompleted.size >= 20, `completed ${stats.milestonesCompleted.size} distinct dialogue scene types`);
  assert.ok(stats.uiRendersChecked >= 4000, `checked ${stats.uiRendersChecked} live UI renders`);
  assert.ok(stats.saveRoundTripsChecked >= 250, `verified ${stats.saveRoundTripsChecked} save/load round-trips`);
});

// ---------- 12. Adversarial Regression Suite (External Review Findings + Interactive Staff + Long-Lived Elves) ----------

test('Adversarial: odds preview and fighterWarnings include active Rival House debt penalty', async () => {
  const { estimateOdds } = await import('../src/odds.js');
  const { fighterWarnings } = await import('../src/explain.js');
  const run = createRun(41, { companions: ['unit91'] });
  const f = run.roster[0];
  const h = run.houses[0];
  run.arenas[1].opponent.house = h.id;

  const optsClean = matchOptions(run, f, 1);
  const cleanOdds = estimateOdds(f, run.arenas[1].opponent, { ...optsClean, n: 600 });

  borrowHouse(run, h.id);
  h.debt.monthsUnpaid = 3; // Tier 3: +3 Power, +10% win, +10% injure, 50% garnish
  const optsDebt = matchOptions(run, f, 1);
  assert.equal(optsDebt.debt?.power, 3);
  const debtOdds = estimateOdds(f, run.arenas[1].opponent, { ...optsDebt, n: 600 });
  assert.ok(debtOdds.win < cleanOdds.win - 0.15, `debt should sharply cut preview win% (${debtOdds.win} vs ${cleanOdds.win})`);

  const warns = fighterWarnings(run, f, 1).map((w) => w.text).join(' ');
  assert.match(warns, /opponent \+3 Power/);
  assert.match(warns, /50% purse garnish/);
});

test('Adversarial: dialogue cooldowns prevent idle morale/trust farming, raw XP triggers level-up, and fulfilled wants cannot be re-accepted', () => {
  const run = createRun(42, { companions: ['unit91'] });
  const f = run.roster[0];
  const morale0 = f.morale;

  // Clicking ask_arena repeatedly in the same week pays reward at most once
  const firstTree = resolveDialogueTree(run, f, 'ask_arena');
  applyDialogueChoice(run, f.id, 'ask_arena', firstTree.choices[0].id);
  const moraleAfterFirst = f.morale;
  for (let i = 0; i < 6; i++) {
    const t = resolveDialogueTree(run, f, 'ask_arena');
    applyDialogueChoice(run, f.id, 'ask_arena', t.choices[0].id);
  }
  assert.equal(f.morale, moraleAfterFirst, 'repeated idle topic clicks in same week grant no extra morale');
  assert.ok(moraleAfterFirst >= morale0);

  // Fulfilled personal want (via real wantChain.completed field) cannot be re-accepted (M13)
  f.dialogue.wantChain.completed.push('u91_garden');
  const renBefore = f.renown;
  const xpBefore = f.xp;
  enqueueMilestone(run, f, { id: 'want_asked_u91_garden', priority: 70 });
  const wTree = resolveDialogueTree(run, f, 'want_asked_u91_garden');
  assert.match(wTree.title, /^Request Settled/);
  assert.ok(wTree.choices.every((c) => !c.effects?.acceptWant), 'fulfilled want offers no acceptWant choice');
  assert.throws(() => applyDialogueChoice(run, f.id, 'want_asked_u91_garden', 'accept_want'), /Refused|Unknown|settled|choice/i);
  assert.equal(f.renown, renBefore);
  assert.equal(f.xp, xpBefore);

  // Dialogue XP routes through gainXp and triggers level-up when threshold crossed
  f.xp = 999;
  const lvBefore = f.level;
  run.week = 20;
  run.tierState = { tier: 1, enteredWeek: 0, bossLosses: 2, tourneyLosses: 2 };
  enqueueMilestone(run, f, { id: 'stuck_t1_stage3', priority: 90 });
  applyGameAction({ run }, 'talk-choice', { id: f.id, scene: 'stuck_t1_stage3', choice: 'stuck_breakthrough_oath' });
  assert.ok(f.level > lvBefore, 'dialogue XP triggered real level-up');
});

test('Adversarial: Week-0 draft cap, Temple Lv 2 monthly free re-tune limit, respec Temple requirement, prototype-key rejection, and integer debt repayment', () => {
  const run = createRun(43);
  run.gold = 100;
  // Draft respects rosterCap when beds are already filled by market recruits (M10)
  const runCap = createRun(430);
  runCap.gold = 200;
  recruit(runCap, runCap.market[0].id);
  recruit(runCap, runCap.market[0].id);
  assert.equal(runCap.roster.length, 2);
  assert.ok(companionBlocker(runCap, 'unit91', { draft: true }), 'draft blocked when rosterCap is full');
  assert.throws(() => draftCompanion(runCap, 'unit91'));

  // Draft respects 2-free limit and week === 0
  draftCompanion(run, 'unit91');
  draftCompanion(run, 'basa');
  assert.equal(run.roster.length, 2);
  assert.ok(companionBlocker(run, 'orc', { draft: true }));

  const runLate = createRun(44);
  runLate.week = 1;
  assert.match(companionBlocker(runLate, 'unit91', { draft: true }), /Week 0/i);

  // Prototype keys ('constructor', '__proto__') refused in retune
  const f = run.roster[0];
  assert.throws(() => retuneClass(run, f.id, 'constructor'));
  assert.throws(() => retuneTrait(run, f.id, 'constructor'));
  assert.throws(() => retuneHumor(run, f.id, 'constructor'));

  // Perk respec requires built Temple of Fortuna (>= Lv 1)
  f.perks.push('swift');
  assert.match(respecPerkBlocker(run, f.id, 'swift') ?? '', /Temple of Fortuna/i);

  // Temple Lv 2: first re-tune in a month is free, second in same month costs 2 Gold
  run.buildings.push({ id: 'b_temp', type: 'temple', level: 2, slot: 'upper-0' });
  assert.equal(retunePrice(run), 0);
  retuneHumor(run, f.id, 'sanguine');
  assert.equal(retunePrice(run), 2, 'second re-tune in same month costs 2g');
  const gBefore = run.gold;
  retuneHumor(run, f.id, 'choleric');
  assert.equal(run.gold, gBefore - 2);
  // Next month resets free re-tune
  run.week = 4;
  assert.equal(retunePrice(run), 0);

  // Fractional debt repayments are rejected
  borrowFavor(run, 'loan');
  assert.ok(payFavorDebtBlocker(run, 1.5), 'fractional favour repayment refused');
  assert.throws(() => payFavorDebt(run, 1.5));
  const h = run.houses[0];
  borrowHouse(run, h.id);
  assert.ok(payHouseDebtBlocker(run, h.id, 0.25), 'fractional house repayment refused');
  assert.throws(() => payHouseDebt(run, h.id, 0.25));
  // Same-month house loan re-borrow blocked after payoff
  payHouseDebt(run, h.id);
  assert.match(borrowHouseBlocker(run, h.id) ?? '', /month/i);
});

test('Adversarial: Palatine loan Favour floor protection, auto-settlement when solvent, and Rite of the Whole Soul (restore-revenant)', async () => {
  const { restoreRevenant, restoreRevenantBlocker } = await import('../src/run.js');
  const run = createRun(45, { companions: ['basa', 'elf'] });
  // Minimum Favour floor prevents death-spiral loans
  run.favor = 24;
  assert.ok(borrowFavorBlocker(run, 'loan'), 'cannot take Palatine loan below 25 Favour');
  run.favor = 25;
  borrowFavor(run, 'loan'); // drops favor to 20
  run.favor = 3;
  run.gold = 0;
  run.week = 4;
  favorDebtMonth(run);
  assert.equal(run.favor, 1, 'monthly routine audit floors Favour at 1 instead of executing immediately');
  assert.equal(run.status, 'active');

  // Auto-settlement collects Gold at term end when solvent
  run.favorDebt.monthsLeft = 0;
  run.gold = 500;
  run.week = 8;
  favorDebtMonth(run);
  assert.equal(run.favorDebt, undefined, 'overdue loan auto-settles when house holds enough Gold');
  assert.ok(run.gold < 500);

  // Rite of the Whole Soul restores a hollowed Vulcan Revenant companion back to living state
  run.gold = 200;
  run.favor = 50;
  run.prestigeLevel = 3;
  run.buildings.push({ id: 'bh', type: 'hades', level: 1, slot: CRYPT_HADES_SLOT });
  run.buildings.push({ id: 'bv', type: 'vulcan', level: 1, slot: 'catacomb-1' });
  run.buildings.find((b) => b.type === 'quarters').level = 3;
  const tarek = run.roster.find((x) => x.coreId === 'basa');
  tarek.power = 7;
  tarek.dialogue.trust = 9;
  tarek.dialogue.seen.push('first_fight_win');
  tarek.dialogue.wantChain.completed.push('basa_garden');
  tarek.dialogue.wantChain.index = 1;
  tarek.dialogue.loreFlags.push('keepsake_tidalMemory_paid');
  const deadTarek = { ...structuredClone(tarek), id: 'tarek_dead', diedWeek: run.week, arena: true, alive: false };
  run.fallen.push(deadTarek);
  const rev = reanimate(run, 'tarek_dead');
  assert.equal(rev.kind, 'revenant');
  assert.equal(rev.hollowedCompanion, 'basa');
  // Revenant speech badge clears after speaking once
  enqueueMilestone(run, rev, { id: 'first_fight_win', priority: 80 });
  assert.equal(rev.dialogue.queue.some((q) => q.id === 'first_fight_win'), false, 'non-vulcan milestones skipped on Revenants');
  enqueueMilestone(run, rev, { id: 'vulcan_revenant_shock', priority: 90 });
  const rTree = resolveDialogueTree(run, rev);
  applyDialogueChoice(run, rev.id, rTree.id, rTree.choices[0].id);
  assert.equal(rev.dialogue.queue.length, 0, 'Revenant speech queue clears cleanly');

  assert.equal(restoreRevenantBlocker(run, rev.id), null);
  const whole = restoreRevenant(run, rev.id);
  assert.equal(whole.kind, 'basa');
  assert.equal(whole.coreId, 'basa');
  assert.equal(whole.hollowedCompanion, undefined);
  assert.equal(whole.power, 7, 'Rite of the Whole Soul restores pre-Vulcan Power');
  assert.equal(whole.dialogue.trust, 9, 'Rite of the Whole Soul preserves companion Trust');
  assert.ok(whole.dialogue.seen.includes('first_fight_win'), 'Rite of the Whole Soul preserves seen scenes');
  assert.ok(whole.dialogue.wantChain.completed.includes('basa_garden'), 'Rite of the Whole Soul preserves completed wants');
  assert.ok(whole.dialogue.loreFlags.includes('keepsake_tidalMemory_paid'), 'Rite of the Whole Soul preserves lore/keepsake flags');
  assert.equal(run.fallen.some((x) => x.id === 'tarek_dead'), false, 'stale fallen body removed after Rite of the Whole Soul');
});

test('Adversarial: Keepsake single source of truth, Tarek trophy dislike removed, one-time fathersEdge plotTrust, procedural bond scene, lore-gated choice, talkModal purity, and play-text quests', async () => {
  const { createSession } = await import('../scripts/play-text.js');
  const run = createRun(46, { companions: ['unit91', 'basa'] });
  run.gold = 200;
  run.prestigeLevel = 3;
  run.buildings.find((b) => b.type === 'quarters').level = 3;
  const u91 = run.roster.find((x) => x.coreId === 'unit91');
  const tarek = run.roster.find((x) => x.coreId === 'basa');

  // Tarek's tidalMemory no longer dislikes trophy
  assert.equal(LORE_KEEPSAKES.tidalMemory.dislikedItems.includes('trophy'), false);
  // fathersEdge +1 plotTrust only fires once even when decor toggled
  run.plot = { stage: 'favours', trust: 1, suspicion: 0, ended: null, cells: [], freed: [], seen: [] };
  const vaelen = recruitCompanion(run, 'elf');
  vaelen.decor.whetstone = 1;
  vaelen.decor.fireBrazier = 1;
  checkKeepsakes(run, vaelen);
  assert.equal(vaelen.keepsake, 'fathersEdge');
  const trustAfterUnlock = run.plot.trust;
  vaelen.decor.fireBrazier = 0;
  checkKeepsakes(run, vaelen);
  vaelen.decor.fireBrazier = 1;
  checkKeepsakes(run, vaelen);
  assert.equal(run.plot.trust, trustAfterUnlock, 're-equipping keepsake cannot farm plotTrust');

  // Procedural fighter bond uses generic scene (never basa_elf)
  const p1 = { ...createCompanion(null, 'unit91'), id: 'p1', name: 'Marcus', coreId: null, companion: false, bond: { id: 'p2', name: 'Livia', since: 1 } };
  const p2 = { ...createCompanion(null, 'basa'), id: 'p2', name: 'Livia', coreId: null, companion: false, bond: { id: 'p1', name: 'Marcus', since: 1 } };
  run.roster.push(p1, p2);
  enqueueMilestone(run, p1, { id: 'bond_formed', priority: 80, ctx: { mateName: 'Livia', partnerName: 'Livia' } });
  const pBond = resolveDialogueTree(run, p1, 'bond_formed');
  assert.doesNotMatch(pBond.beats.map((b) => b.text).join(' '), /Aethelgard|Salt-Reach/i);

  // Lore-gated choice stays visibly locked with lockReason until studied via mark-lore
  const runSolo = createRun(47, { companions: ['unit91'] });
  const soloU91 = runSolo.roster[0];
  enqueueMilestone(runSolo, soloU91, { id: 'first_fight_win', priority: 80 });
  const lockedTree = resolveDialogueTree(runSolo, soloU91, 'first_fight_win');
  const lockedChoice = lockedTree.choices.find((c) => c.id === 'lore_android_cant');
  assert.ok(lockedChoice, 'lore choice stays visible while locked');
  assert.equal(lockedChoice.locked, true);
  assert.match(lockedChoice.lockReason, /Requires Codex: Androids/);
  assert.throws(() => applyGameAction({ run: runSolo }, 'talk-choice', { id: soloU91.id, scene: 'first_fight_win', choice: 'lore_android_cant' }), /Requires Codex: Androids/);
  const lockedHtml = talkModal(runSolo, { fighterId: soloU91.id, sceneId: 'first_fight_win' });
  assert.match(lockedHtml, /talk-choice--locked/);
  applyGameAction({ run: runSolo }, 'mark-lore', { key: 'kind:android' });
  const unlockedTree = resolveDialogueTree(runSolo, soloU91, 'first_fight_win');
  const unlockedChoice = unlockedTree.choices.find((c) => c.id === 'lore_android_cant');
  assert.ok(unlockedChoice && !unlockedChoice.locked, 'lore choice unlocks after mark-lore');

  // talkModal is pure (does not mutate stale dialogue queue on render)
  u91.dialogue.queue.push({ id: 'stuck_t1_stage1', priority: 50, week: 0 });
  run.topTier = 2;
  const qLenBefore = u91.dialogue.queue.length;
  talkModal(run, { fighterId: u91.id });
  assert.equal(u91.dialogue.queue.length, qLenBefore, 'talkModal must not mutate dialogue queue during render');

  // play-text.js handles Core Companion personal requests without crashing and exposes v8 commands
  const sess = createSession(48);
  sess.exec('draft unit91');
  const talkOut = sess.exec('talk staff:steward');
  assert.match(talkOut, /Galen-VII/);
  const debtOut = sess.exec('debt');
  assert.match(debtOut, /Palatine Loan/);
  const questsOut = sess.exec('quests');
  assert.match(questsOut, /Quests/);
});

test('Interactive Estate Staff (Drillmaster Kaeso, Physician Lyra, Galen-VII Steward\'s Quarters), long-lived Elves, and script-doctor polish', async () => {
  const { ROOF_STEWARD_SLOT } = await import('../src/ludus.js');
  const { ESTATE_STAFF, getStaffActor } = await import('../src/dialogue.js');

  // Elves are explicitly described as long-lived across Codex, Voices, and Companion bio
  const elfCodex = ENTRIES.find((e) => e.key === 'kind:elf');
  assert.match(elfCodex.lore, /long-lived|three centuries/i);
  assert.match(CORE_COMPANIONS.elf.bio, /centuries|long-lived/i);
  const elfBackstory = backstoryScene({ id: 'e1', name: 'TestElf', kind: 'elf', humor: 'melancholic' });
  assert.match(elfBackstory.beats.map((b) => b.text).join(' '), /three centuries|live long enough/i);

  // Estate renders Steward's Quarters roof bay + inspector, Trainer Kaeso card, and Medbay Lyra card
  const run = createRun(49, { companions: ['unit91', 'elf'] });
  const stewardHtml = estateTab(run, { mode: 'villa', slot: ROOF_STEWARD_SLOT });
  assert.match(stewardHtml, /Steward's Quarters/);
  assert.match(stewardHtml, /data-id="staff:steward"/);

  const trainerPlot = run.buildings.find((b) => b.type === 'trainer').slot;
  const trainerHtml = estateTab(run, { mode: 'villa', slot: trainerPlot });
  assert.match(trainerHtml, /Drillmaster Kaeso/);
  assert.match(trainerHtml, /data-id="staff:trainer"/);

  const medbayPlot = run.buildings.find((b) => b.type === 'medbay').slot;
  const medbayHtml = estateTab(run, { mode: 'villa', slot: medbayPlot });
  assert.match(medbayHtml, /Physician Lyra/);
  assert.match(medbayHtml, /data-id="staff:doctor"/);

  // Room Decorator hides un-awakened Keepsake exact recipe behind atmospheric hint
  const u91 = run.roster.find((x) => x.coreId === 'unit91');
  const vaelen = run.roster.find((x) => x.coreId === 'elf');
  const roomHtml = estateTab(run, { mode: 'room', fighterId: u91.id });
  assert.match(roomHtml, /Unawakened Keepsake/);
  assert.doesNotMatch(roomHtml, /Lore Keepsake \(/);

  // ask_past uses first-person guarded speech (never third-person bio) and shifts at trust >= 10
  const pastLow = resolveDialogueTree(run, u91, 'ask_past').beats.map((b) => b.text).join(' ');
  assert.match(pastLow, /I was the ninety-first human child/);
  u91.dialogue.trust = 12;
  const pastHigh = resolveDialogueTree(run, u91, 'ask_past').beats.map((b) => b.text).join(' ');
  assert.match(pastHigh, /never shouted/);
  assert.notEqual(pastLow, pastHigh);

  // Suspicion scenes have 3 distinct levels and never leak the raw integer
  const s1 = resolveDialogueTree(run, vaelen, 'suspicion_watch').beats.map((b) => b.text).join(' ');
  const s2 = resolveDialogueTree(run, vaelen, 'suspicion_informer').beats.map((b) => b.text).join(' ');
  const s3 = resolveDialogueTree(run, vaelen, 'suspicion_cold').beats.map((b) => b.text).join(' ');
  assert.notEqual(s1, s2);
  assert.notEqual(s2, s3);
  assert.doesNotMatch(s1, /\(Suspicion \d+\)/);

  // Refusing a personal request does not double-queue want_refused_<id>
  enqueueMilestone(run, u91, { id: 'want_asked_u91_garden', priority: 70 });
  const wTree = resolveDialogueTree(run, u91, 'want_asked_u91_garden');
  const refuseChoice = wTree.choices.find((c) => c.effects?.refuseWant);
  assert.ok(refuseChoice);
  applyGameAction({ run }, 'talk-choice', { id: u91.id, scene: 'want_asked_u91_garden', choice: refuseChoice.id });
  assert.equal(u91.dialogue.queue.some((q) => q.id === 'want_refused_u91_garden'), false, 'no double-sulk want_refused queued');

  // Talk modal opens, lists topics, applies choices, and updates visible Trust for all three staff members
  for (const key of ['trainer', 'doctor', 'steward']) {
    const actor = getStaffActor(ESTATE_STAFF[`staff:${key}`].id);
    const modalHtml = talkModal(run, { fighterId: actor.id });
    assert.match(modalHtml, new RegExp(actor.name));
    assert.match(modalHtml, /House Staff/);
    const hub = resolveDialogueTree(run, actor);
    assert.ok(hub.topics.length >= 2, `${key} exposes at least 2 interactive topics`);
    const topicScene = hub.topics[0].scene;
    const tree = resolveDialogueTree(run, actor, topicScene);
    assert.ok(tree.beats.length >= 2);
    assert.ok(tree.choices.length >= 1, `${key} topic ${topicScene} has selectable choices`);
    applyGameAction({ run }, 'talk-choice', { id: actor.id, scene: tree.id, choice: tree.choices[0].id });
    assert.ok((run.staffDialogue?.[key]?.seen?.length ?? 0) >= 1, `${key} recorded seen scene in run.staffDialogue`);
    if ((run.staffDialogue?.[key]?.trust ?? 0) > 0) {
      const updatedModal = talkModal(run, { fighterId: actor.id });
      assert.match(updatedModal, new RegExp(`Trust <b>\\+${run.staffDialogue[key].trust}</b>`));
    }
  }
});

test('Third-pass adversarial: staff hub/cast cooldowns, clean staff talkModal & autofocus, real advanceWeek tribute-first & 4-week grace, mark-lore/action guards, spare forgiveness >=1 mo, single-spy Kaeso dismiss, suspicion relief cap & betrayal', async () => {
  const { ESTATE_STAFF, getStaffActor } = await import('../src/dialogue.js');
  const { EVENTS } = await import('../src/events.js');
  const { fighterWarnings } = await import('../src/explain.js');

  // 1. C1: Staff hub clicks pay ONCE per 4-week cooldown; chatting during cooldown does NOT push it back; staff_steward_cast has cooldown
  const runStaff = createRun(501, { companions: ['orc', 'unit91'] });
  const [varok, u91] = runStaff.roster;
  varok.job = 'trainPower';
  varok.morale = 40;
  varok.stress = 60;
  u91.injuries = [{ tag: 'fleshWound', weight: 1, heal: 2 }];
  u91.morale = 40;
  u91.stress = 60;

  for (const [staffId, staffKey] of [['staff:trainer', 'trainer'], ['staff:doctor', 'doctor'], ['staff:steward', 'steward']]) {
    const actor = getStaffActor(staffId);
    const hub = resolveDialogueTree(runStaff, actor, 'hub');
    const firstBtn = hub.choices.find((c) => !c.locked);
    applyGameAction({ run: runStaff }, 'talk-choice', { id: staffId, scene: 'hub', choice: firstBtn.id });
    const trustAfter1 = runStaff.staffDialogue[staffKey].trust;
    const varokMoraleAfter1 = varok.morale;
    const varokStressAfter1 = varok.stress;
    const u91StressAfter1 = u91.stress;
    for (let i = 0; i < 9; i++) {
      const h = resolveDialogueTree(runStaff, actor, 'hub');
      const b = h.choices.find((c) => !c.locked);
      applyGameAction({ run: runStaff }, 'talk-choice', { id: staffId, scene: 'hub', choice: b.id });
    }
    assert.equal(runStaff.staffDialogue[staffKey].trust, trustAfter1, `${staffId} hub click pays Trust at most once per cooldown`);
    assert.equal(varok.morale, varokMoraleAfter1, 'trainee morale not farmed on repeated hub clicks');
    assert.equal(varok.stress, varokStressAfter1, 'trainee stress not farmed on repeated hub clicks');
    assert.equal(u91.stress, u91StressAfter1, 'patient stress not farmed on repeated hub clicks');
  }
  // Chatting during cooldown at week 3 must NOT extend cooldown past week 4
  const steward = getStaffActor('staff:steward');
  const trustBeforeCast = runStaff.staffDialogue.steward.trust;
  const castTree = resolveDialogueTree(runStaff, steward, 'staff_steward_cast');
  applyGameAction({ run: runStaff }, 'talk-choice', { id: 'staff:steward', scene: 'staff_steward_cast', choice: castTree.choices[0].id });
  const trustAfterCast1 = runStaff.staffDialogue.steward.trust;
  assert.ok(trustAfterCast1 > trustBeforeCast);
  runStaff.week = 3;
  applyGameAction({ run: runStaff }, 'talk-choice', { id: 'staff:steward', scene: 'staff_steward_cast', choice: castTree.choices[0].id });
  assert.equal(runStaff.staffDialogue.steward.trust, trustAfterCast1, 'staff_steward_cast respects 4-week cooldown');
  runStaff.week = 4;
  const castTreeW4 = resolveDialogueTree(runStaff, steward, 'staff_steward_cast');
  applyGameAction({ run: runStaff }, 'talk-choice', { id: 'staff:steward', scene: 'staff_steward_cast', choice: castTreeW4.choices[0].id });
  assert.ok(runStaff.staffDialogue.steward.trust > trustAfterCast1, 'chatting at week 3 did not push back week-4 cooldown expiry');

  // 2. M1 + N5: Exhaustive bad-string sweep across ALL 3 staff talkModal topics & reply screens + autofocus NOT on close button
  const BAD = /undefined|NaN|\[object Object\]/;
  for (const staffId of Object.keys(ESTATE_STAFF)) {
    const actor = getStaffActor(staffId);
    const hub = resolveDialogueTree(runStaff, actor, 'hub');
    for (const sc of ['hub', ...hub.topics.map((t) => t.scene)]) {
      const html = talkModal(runStaff, { fighterId: staffId, sceneId: sc });
      assert.doesNotMatch(html, BAD, `clean HTML for ${staffId}:${sc}`);
      assert.doesNotMatch(html, /class="close"[^>]*autofocus/, `close button must not receive autofocus on ${staffId}:${sc}`);
      assert.match(html, /autofocus/, `primary action receives autofocus on ${staffId}:${sc}`);
      const respHtml = talkModal(runStaff, { fighterId: staffId, sceneId: sc, response: { text: 'Noted.', replySpeaker: actor.speaker } });
      assert.doesNotMatch(respHtml, BAD, `clean reply HTML for ${staffId}:${sc}`);
    }
  }

  // 3. Real advanceWeek(): winter tribute settles BEFORE Palatine loan auto-settlement (no accidental execution)
  const runTrib = createRun(502, { companions: ['unit91'] });
  runTrib.week = 39; // advanceWeek moves to week 40 (WEEKS_PER_YEAR - 4 = 40, winter collection week)
  runTrib.gold = 20;
  runTrib.favor = 20;
  runTrib.tributePaid = 0;
  runTrib.favorDebt = { principal: 16, owed: 20, sinceWeek: 28, monthsElapsed: 2 };
  clearBlockers(runTrib);
  advanceWeek(runTrib);
  assert.equal(runTrib.status, 'active', 'winter tribute paid before loan auto-settlement prevents execution');
  assert.equal(runTrib.favor, 14, `Favour stays alive at 14 (20 − 6 overdue audit) after tribute pays first (got ${runTrib.favor})`);

  // 4. Real advanceWeek(): 4-week grace period prevents week-3 loans from immediate week-4 audit / arrears
  const runGrace = createRun(503, { companions: ['unit91'] });
  runGrace.week = 3;
  runGrace.gold = 0;
  runGrace.favor = 60;
  borrowFavor(runGrace, 'loan'); // sinceWeek = 3
  const favAfterLoan = runGrace.favor;
  borrowHouse(runGrace, runGrace.houses[0].id); // sinceWeek = 3
  runGrace.gold = 0;
  clearBlockers(runGrace);
  advanceWeek(runGrace); // advances to week 4 (monthStart = true)
  assert.equal(runGrace.favorDebt.monthsElapsed, 0, 'Palatine loan taken in week 3 is not audited at week 4');
  assert.equal(runGrace.favor, favAfterLoan);
  assert.equal(runGrace.houses[0].debt.monthsUnpaid, 0, 'House loan taken in week 3 is not in arrears at week 4');
  // Also verify debt warning explicitly tags opponent at 0 Power bonus (month 0 lien)
  runGrace.arenas[1].opponent.house = runGrace.houses[0].id;
  const lienWarn = fighterWarnings(runGrace, runGrace.roster[0], 1).map((w) => w.text).join(' ');
  assert.match(lienWarn, /opponent \+3% win/);
  // Pay-all with 0 Gold gives "Needs N Gold." (not fractional error)
  assert.match(payFavorDebtBlocker(runGrace) ?? '', /Needs \d+ Gold/);
  assert.match(payHouseDebtBlocker(runGrace, runGrace.houses[0].id) ?? '', /Needs \d+ Gold/);

  // 5. Spare debt forgiveness requires monthsUnpaid >= 1
  runGrace.bouts = { 1: 'open' };
  runGrace.boutPending = true;
  clearBlockers(runGrace);
  const owedM0 = runGrace.houses[0].debt.owed;
  runGrace.mercy = { house: runGrace.houses[0].id, tier: 1, crowd: 'kill', fighterId: runGrace.roster[0].id, opp: 'Rival' };
  resolveMercy(runGrace, 'spare');
  assert.equal(runGrace.houses[0].debt.owed, owedM0, '0-month Creditor Lien is NOT forgiven by an ordinary kill-crowd spare');
  runGrace.houses[0].debt.monthsUnpaid = 1;
  runGrace.mercy = { house: runGrace.houses[0].id, tier: 1, crowd: 'kill', fighterId: runGrace.roster[0].id, opp: 'Rival' };
  resolveMercy(runGrace, 'spare');
  assert.ok(!runGrace.houses[0].debt || runGrace.houses[0].debt.owed < owedM0, '1+ month unpaid House debt IS forgiven on kill-crowd spare');

  // 6. mark-lore validation & inherited applyGameAction names
  const codex = createCodex();
  const actLen0 = runGrace.actions.length;
  assert.throws(() => applyGameAction({ run: runGrace, codex }, 'constructor'));
  assert.throws(() => applyGameAction({ run: runGrace, codex }, '__proto__'));
  assert.equal(runGrace.actions.length, actLen0, 'refused action names must not pollute run.actions');
  for (const badKey of ['junk', '__proto__', 'kind:basa', '<b>x</b>', 'a'.repeat(500)]) {
    assert.throws(() => applyGameAction({ run: runGrace, codex }, 'mark-lore', { key: badKey }));
  }
  // Locked entry refused when codex is provided
  assert.throws(() => applyGameAction({ run: runGrace, codex }, 'mark-lore', { key: 'kind:elf' }));
  codex.lore.push('kind:elf');
  applyGameAction({ run: runGrace, codex }, 'mark-lore', { entry: 'kind:elf' });
  assert.ok(runGrace.loreRead.includes('kind:elf'));

  // 7. Single-spy Kaeso informer (3 choices + 4-week dismiss cost + suppresses legacy emperorsSpy event)
  const runSpy = createRun(504, { companions: ['unit91', 'elf'] });
  runSpy.plot = { stage: 'favours', trust: 2, suspicion: 30, ended: null, cells: [], freed: [], seen: [] };
  const kaeso = getStaffActor('staff:trainer');
  const infTree = resolveDialogueTree(runSpy, kaeso, 'staff_trainer_informer');
  const choiceIds = infTree.choices.map((c) => c.id);
  assert.ok(choiceIds.includes('turn_trainer_double') && choiceIds.includes('silence_trainer') && choiceIds.includes('dismiss_trainer'));
  applyGameAction({ run: runSpy }, 'talk-choice', { id: 'staff:trainer', scene: 'staff_trainer_informer', choice: 'dismiss_trainer' });
  assert.equal(runSpy.plot.spyFound, true);
  assert.equal(runSpy.staffDialogue.trainer.dismissedUntilWeek, runSpy.week + 4);
  const spyEvent = EVENTS.find((e) => e.id === 'emperorsSpy');
  assert.equal(Boolean(spyEvent?.when?.(runSpy)), false, 'legacy emperorsSpy event suppressed once Kaeso is resolved');
  assert.throws(() => applyGameAction({ run: runSpy }, 'talk-choice', { id: 'staff:trainer', scene: 'hub', choice: 'rally_trainees' }), /dismissed|vacant/i);
  const trainerPlot = runSpy.buildings.find((b) => b.type === 'trainer').slot;
  assert.match(estateTab(runSpy, { mode: 'villa', slot: trainerPlot }), /Drillmaster post vacant/);
  runSpy.roster[0].job = 'trainPower';
  const powBefore = runSpy.roster[0].power;
  clearBlockers(runSpy);
  advanceWeek(runSpy);
  assert.equal(runSpy.roster[0].power, powBefore, 'training pauses while Drillmaster post is vacant');

  // 8. Suspicion-warning negative Suspicion relief capped to ONCE per escalation level + level-3 bespoke replies
  const runSusp = createRun(505, { companions: ['unit91', 'basa'] });
  runSusp.gold = 200;
  runSusp.prestigeLevel = 3;
  runSusp.buildings.find((b) => b.type === 'quarters').level = 3;
  const vaelenS = recruitCompanion(runSusp, 'elf');
  const solaceS = recruitCompanion(runSusp, 'android');
  runSusp.plot = { stage: 'favours', trust: 2, suspicion: 25, ended: null, cells: [], freed: [], seen: [] };
  for (const f of runSusp.roster) enqueueMilestone(runSusp, f, 'suspicion_watch');
  const susp0 = runSusp.plot.suspicion;
  const t0 = resolveDialogueTree(runSusp, runSusp.roster[0], 'suspicion_watch');
  applyGameAction({ run: runSusp }, 'talk-choice', { id: runSusp.roster[0].id, scene: 'suspicion_watch', choice: t0.choices[0].id });
  const suspAfter1 = runSusp.plot.suspicion;
  assert.ok(suspAfter1 < susp0, 'first suspicion warning at a level lowers Suspicion');
  for (const f of runSusp.roster.slice(1)) {
    const t = resolveDialogueTree(runSusp, f, 'suspicion_watch');
    applyGameAction({ run: runSusp }, 'talk-choice', { id: f.id, scene: 'suspicion_watch', choice: t.choices[0].id });
  }
  assert.equal(runSusp.plot.suspicion, suspAfter1, 'subsequent fighters at the same suspicion level do not stack extra relief');
  const coldSolace = resolveDialogueTree(runSusp, solaceS, 'suspicion_cold');
  assert.notEqual(coldSolace.choices[0].label, t0.choices[0].label, 'level-3 suspicion offers bespoke replies');

  // 9. Betrayal queues rebel_call_betrayed (not rebel_call_refused), excludes ordinary procedural fighters, and schism requires Vaelen alive
  const runBetray = createRun(506, { companions: ['orc', 'basa'] });
  runBetray.gold = 200;
  runBetray.prestigeLevel = 3;
  runBetray.buildings.find((b) => b.type === 'quarters').level = 3;
  const proc = recruit(runBetray, runBetray.market[0].id);
  proc.political = false;
  runBetray.plot = { stage: 'favours', trust: 2, suspicion: 10, ended: null, cells: [], freed: [], seen: [] };
  applyPlotEffects(runBetray, { stage: 'favours', trust: 2 }, {}, []);
  assert.equal(runBetray.roster[0].dialogue.queue.some((q) => q.id === 'rebel_orc_elf_schism'), false, 'schism must not queue when Vaelen is absent');
  applyPlotEffects(runBetray, { betray: true }, {}, []);
  assert.ok(runBetray.roster[0].dialogue.queue.some((q) => q.id === 'rebel_call_betrayed'), 'betrayal queues rebel_call_betrayed');
  assert.equal(runBetray.roster[0].dialogue.queue.some((q) => q.id === 'rebel_call_refused'), false);
  assert.equal((proc.dialogue?.queue ?? []).some((q) => q.id.startsWith('rebel_call_')), false, 'ordinary procedural fighters do not receive rebel_call milestones');
  const betTree = resolveDialogueTree(runBetray, runBetray.roster[0], 'rebel_call_betrayed');
  assert.doesNotMatch(betTree.beats.map((b) => b.text).join(' '), /^Good!/);
  void vaelenS;
});

test('Third-pass mutation pins: unqueued scene refusal (M03), Oracle Lv 2 summons determinism (M07), no mutation on refused replies, explicit choiceId, play-text debt/locked/confirm, and script-doctor invariants', async () => {
  const { createSession } = await import('../scripts/play-text.js');

  // M03: unqueued one-shot scene, procedural schism, and omitted choiceId are all refused with ZERO state mutation
  const runM = createRun(601, { companions: ['unit91'] });
  runM.gold = 100;
  const proc = recruit(runM, runM.market[0].id);
  assert.equal(proc.dialogue, undefined);
  assert.throws(() => applyDialogueChoice(runM, runM.roster[0].id, 'first_fight_win', 'ack_win'));
  assert.throws(() => applyDialogueChoice(runM, proc.id, 'rebel_orc_elf_schism', 'side_with_varok_crush_plot'));
  assert.throws(() => applyDialogueChoice(runM, runM.roster[0].id, 'ask_arena', ''));
  assert.throws(() => applyDialogueChoice(runM, runM.roster[0].id, 'ask_arena'));
  assert.equal(proc.dialogue, undefined, 'refused reply on procedural fighter must not create f.dialogue');
  assert.throws(() => applyDialogueChoice(runM, 'staff:trainer', 'nonexistent_scene', 'bad_choice'));
  assert.equal(runM.staffDialogue?.trainer, undefined, 'refused staff reply must not initialize staffDialogue');

  // M07: Oracle Lv 2 does NOT alter answerSummons RNG stream or outcome vs. identical run without Oracle
  const makeSummonsRun = (withOracle) => {
    const r = createRun(405);
    r.gold = 500;
    r.prestigeLevel = 3;
    const f = recruit(r, r.market[0].id);
    f.power += 28;
    if (withOracle) r.buildings.push({ id: 'b_oracle', type: 'oracle', level: 2, slot: 'roof-oracle' });
    r.bouts = { 1: 'open' };
    r.boutPending = true;
    r.summons = { tier: 1, opp: structuredClone(r.arenas[1].opponent), week: r.week };
    answerSummons(r, f.id, 'death');
    return r;
  };
  const rNoOracle = makeSummonsRun(false);
  const rWithOracle = makeSummonsRun(true);
  assert.deepEqual(rWithOracle.rng, rNoOracle.rng, 'Oracle Lv 2 must not draw extra RNG inside answerSummons (M07)');

  // play-text.js: debt prints months left (not 0), locked lore choices show [LOCKED:, crush_plot requires --confirm
  const sess = createSession(602);
  sess.exec('draft unit91');
  sess.exec('borrow-favor loan');
  const debtStr = sess.exec('debt');
  assert.match(debtStr, /2 months left/);
  enqueueMilestone(sess.run, sess.run.roster[0], 'first_fight_win');
  const talkStr = sess.exec(`talk ${sess.run.roster[0].id} first_fight_win`);
  assert.match(talkStr, /\[LOCKED:/);
  sess.run.gold = 200;
  sess.run.prestigeLevel = 3;
  sess.run.buildings.find((b) => b.type === 'quarters').level = 3;
  const varokP = recruitCompanion(sess.run, 'orc');
  recruitCompanion(sess.run, 'elf');
  sess.run.plot = { stage: 'favours', trust: 2, suspicion: 10, ended: null, cells: [], freed: [], seen: [] };
  enqueueMilestone(sess.run, varokP, 'rebel_orc_elf_schism');
  const warnCrush = sess.exec(`talk ${varokP.id} rebel_orc_elf_schism side_with_varok_crush_plot`);
  assert.match(warnCrush, /--confirm/i);
  assert.equal(sess.run.plot.ended, null, 'plot not ended without --confirm in text client');

  // Script-doctor & PLACEHOLDER marker invariants
  const dtSrc = readFileSync(join(rootDir, 'src/dialogueTrees.js'), 'utf8');
  assert.doesNotMatch(dtSrc, /Salt-Reach cellars|salt-cellar|storm-cellar|when I was twelve/i);
  assert.doesNotMatch(dtSrc, /\bpercent\b|\banymore\b/i);
  assert.ok((dtSrc.match(/PLACEHOLDER/g) ?? []).length >= 15, 'src/dialogueTrees.js carries PLACEHOLDER markers');
  for (const rel of ['src/dialogue.js', 'src/quests.js', 'src/voices.js', 'src/codex.js']) {
    const t = readFileSync(join(rootDir, rel), 'utf8');
    assert.ok((t.match(/PLACEHOLDER/g) ?? []).length >= 2, `${rel} preserves PLACEHOLDER markers`);
  }
});

test('Pass-4 regression: restoreRevenant preserves plot/political/bond/record (V8-S1), vacant trainer blocks train & falls through to Rest (V8-S2), bidirectional single-spy (V8-S3), queued staff auto-open & badge (V8-M1), dialogue suspicion triggers thresholds (V8-M2), freeMe/raid companion protection (V8-M3), exact keepsake banner (V8-L1), Week-0 draft guide (V8-L2)', async () => {
  const { restoreRevenant, trainBlocker, stewardPlan } = await import('../src/run.js');
  const { plotMonth } = await import('../src/run/plotEngine.js');
  const { EVENT_BY_ID } = await import('../src/events.js');
  const { PLOT_EVENT_BY_ID } = await import('../src/plot.js');
  const { GUIDE, nextStep } = await import('../src/tutorial.js');
  const { getStaffActor } = await import('../src/dialogue.js');

  // V8-S1: restoreRevenant restores political, plot.champion, bond (+ living mate bond), and record
  const r1 = createRun(701, { companions: ['elf', 'basa'] });
  r1.gold = 300;
  r1.favor = 60;
  r1.prestigeLevel = 3;
  r1.buildings.find((b) => b.type === 'quarters').level = 3;
  r1.buildings.push({ id: 'bh', type: 'hades', level: 1, slot: CRYPT_HADES_SLOT });
  r1.buildings.push({ id: 'bv', type: 'vulcan', level: 1, slot: 'catacomb-1' });
  const vaelen = r1.roster.find((x) => x.coreId === 'elf');
  const tarek = r1.roster.find((x) => x.coreId === 'basa');
  vaelen.political = { cell: 'officer' };
  vaelen.wasPlotChampion = true;
  vaelen.bond = { id: tarek.id, name: tarek.name, since: 1 };
  vaelen.record = { wins: 5, losses: 1, kills: 2 };
  r1.plot = { stage: 'favours', trust: 1, suspicion: 10, ended: null, champion: null, cells: [], freed: [], seen: [] };
  const deadV = { ...structuredClone(vaelen), id: 'vaelen_dead', diedWeek: r1.week, arena: true, alive: false };
  r1.roster = r1.roster.filter((x) => x.id !== vaelen.id);
  delete tarek.bond;
  r1.fallen.push(deadV);
  const revV = reanimate(r1, 'vaelen_dead');
  const restoredV = restoreRevenant(r1, revV.id);
  assert.ok(restoredV.political && restoredV.political.cell === 'officer', 'political status restored');
  assert.equal(r1.plot.champion, restoredV.id, 'plot.champion restored');
  assert.equal(restoredV.bond?.id, tarek.id, 'companion bond restored');
  assert.equal(tarek.bond?.id, restoredV.id, 'living unbonded mate bond re-linked');
  assert.equal(restoredV.record?.wins, 5, 'fight record restored');
  plotMonth(r1);
  assert.equal(r1.plot.ended, null, 'rebellion plot does not die cold after restoring Vaelen');

  // V8-S2: Dismissed Kaeso blocks trainBlocker & stewardPlan and pre-assigned trainees fall through to Rest
  const r2 = createRun(702, { companions: ['orc'] });
  r2.staffDialogue = { trainer: { trust: 0, seen: [], topicWeeks: {}, loreFlags: [], flags: { informerResolved: 'dismissed' }, dismissedUntilWeek: r2.week + 4 } };
  const varok = r2.roster[0];
  varok.stress = 35;
  varok.injuries = [{ tag: 'fleshWound', weight: 1, weeksLeft: 0.5 }];
  assert.match(trainBlocker(r2, varok) ?? '', /vacant/i);
  stewardPlan(r2);
  assert.notEqual(varok.job, 'trainPower', 'stewardPlan does not assign training while Drillmaster is vacant');
  varok.job = 'trainPower'; // pre-assigned before dismissal
  const pow0 = varok.power;
  clearBlockers(r2);
  advanceWeek(r2);
  assert.equal(varok.power, pow0, 'no training gain while vacant');
  assert.equal(varok.job, 'rest', 'pre-assigned trainee switched to Rest');
  assert.ok(varok.stress < 35, 'pre-assigned trainee receives Rest stress relief');
  assert.equal(varok.injuries.length, 0, 'pre-assigned trainee heals 0.5-week light wound on Rest');

  // V8-S3: Bidirectional single-spy rule
  const r3 = createRun(703, { companions: ['elf'] });
  r3.gold = 200;
  r3.prestigeLevel = 3;
  r3.buildings.find((b) => b.type === 'quarters').level = 3;
  recruit(r3, r3.market[0].id);
  recruit(r3, r3.market[0].id);
  r3.plot = { stage: 'favours', trust: 2, suspicion: 10, ended: null, cells: [], freed: [], seen: [] };
  assert.equal(EVENT_BY_ID.emperorsSpy.when(r3), false, 'emperorsSpy suppressed on companion careers even below suspicion 20');
  const r3Legacy = createRun(704);
  r3Legacy.plot = { stage: 'favours', trust: 2, suspicion: 25, ended: null, cells: [], freed: [], seen: [] };
  r3Legacy.spyFound = true;
  assert.equal(getHubTopics(r3Legacy, getStaffActor('staff:trainer')).some((t) => t.id === 'staff_trainer_informer'), false, 'Kaeso informer suppressed if run.spyFound already set');

  // V8-M1 & V8-M2: Clicking Speak on staff opens queued:true topic directly + badge + eff.suspicion triggers changeSuspicion thresholds
  const r4 = createRun(705, { companions: ['elf', 'basa'] });
  r4.plot = { stage: 'favours', trust: 2, suspicion: 18, ended: null, cells: [], freed: [], seen: [] };
  r4.staffDialogue = { doctor: { trust: 0, seen: [], topicWeeks: {}, loreFlags: ['doctor_suspects_trainer'], flags: {} } };
  const kaesoActor = getStaffActor('staff:trainer');
  const defaultKaesoTree = resolveDialogueTree(r4, kaesoActor, null);
  assert.equal(defaultKaesoTree.id, 'staff_trainer_informer', 'sceneId=null opens urgent queued staff topic');
  const trainerPlot = r4.buildings.find((b) => b.type === 'trainer').slot;
  const trainerEstateHtml = estateTab(r4, { mode: 'villa', slot: trainerPlot });
  assert.match(trainerEstateHtml, /💬!/, 'queued staff topic displays 💬! indicator');
  // Choosing silence_trainer (+3 suspicion: 18 -> 21) crosses watch=20 via changeSuspicion
  applyGameAction({ run: r4 }, 'talk-choice', { id: 'staff:trainer', scene: 'staff_trainer_informer', choice: 'silence_trainer' });
  assert.equal(r4.plot.suspicion, 21);
  assert.ok(r4.roster[0].dialogue.queue.some((q) => q.id === 'suspicion_watch'), 'dialogue suspicion crossing 20 fires suspicion_watch milestone');

  // V8-M3: freeMe excludes Core Companions; raid prefers non-companion political prisoners first
  const r5 = createRun(706, { companions: ['elf', 'basa'] });
  r5.plot = { stage: 'favours', trust: 5, suspicion: 80, ended: null, cells: [], freed: [], seen: [] };
  r5.roster[0].political = { cell: 'officer' };
  r5.roster[1].political = { cell: 'courier' };
  assert.equal(PLOT_EVENT_BY_ID.freeMe.when(r5), false, 'freeMe does not fire when only Core Companions are political');
  r5.gold = 200;
  r5.prestigeLevel = 3;
  r5.buildings.find((b) => b.type === 'quarters').level = 3;
  const auxPol = recruit(r5, r5.market[0].id);
  auxPol.political = { cell: 'scribe' };
  assert.equal(PLOT_EVENT_BY_ID.freeMe.when(r5), true);
  assert.equal(PLOT_EVENT_BY_ID.freeMe.target(r5, createRng(1)).f, auxPol.id, 'freeMe only targets non-companion political fighters');
  assert.equal(PLOT_EVENT_BY_ID.raid.target(r5, createRng(2)).f, auxPol.id, 'raid targets non-companion political fighters before Core Companions');

  // V8-L1: Exact keepsake warning banner (Unit-91 fireBrazier warns blocks keepsake; wineAmphora warns comfort only; Solace-4 whetstone warns +5 weekly Stress)
  const r6 = createRun(707, { companions: ['unit91', 'android'] });
  const [u91k, solK] = r6.roster;
  u91k.decor = { rockGarden: 1, fireBrazier: 1, wineAmphora: 1 };
  const u91RoomHtml = estateTab(r6, { mode: 'room', fighterId: u91k.id });
  assert.match(u91RoomHtml, /Fire Brazier \(blocks keepsake\)/);
  assert.match(u91RoomHtml, /Wine Amphora \(−7 comfort each\)/);
  solK.decor = { whetstone: 1 };
  const solRoomHtml = estateTab(r6, { mode: 'room', fighterId: solK.id });
  assert.match(solRoomHtml, /Whetstone Rack \(\+5 weekly Stress\)/);
  assert.doesNotMatch(solRoomHtml, /Whetstone Rack \([^)]*blocks keepsake/);

  // V8-L2: GUIDE[0] stays on recruit after drafting 1st free companion in Week 0
  const r7 = createRun(708);
  draftCompanion(r7, 'unit91');
  assert.equal(nextStep(GUIDE, [], r7)?.id, 'recruit', 'GUIDE stays on Market after 1st free companion draft');
  draftCompanion(r7, 'basa');
  const done7 = [];
  while (nextStep(GUIDE, done7, r7)?.goal(r7)) done7.push(nextStep(GUIDE, done7, r7).id);
  assert.equal(nextStep(GUIDE, done7, r7)?.id, 'jobs', 'GUIDE advances to jobs after 2nd free companion draft');
});

test('Follow-up regression: V7-M1..M4, V7-L1..L4, A2 Nona clarification, A4 escalating Hades cost (+50%/revival), and Estate Fortuna respec-perk', async () => {
  const { GEAR } = await import('../src/data.js');
  const { ROOF_ORACLE_SLOT } = await import('../src/ludus.js');
  const { signatureBlocker } = await import('../src/fight.js');
  const { estimateOdds, oddsKey } = await import('../src/odds.js');
  const { espionageOdds, betOdds, reviveHadesPrice, rename } = await import('../src/run.js');
  const { lastWordsFor } = await import('../src/voices.js');
  const { cityHeadlines } = await import('../src/gazette.js');
  const { fighterCard } = await import('../src/ui/components.js');
  const { createSession } = await import('../scripts/play-text.js');

  // V7-M1: ROOF_ORACLE_SLOT does not orphan a villa floor plot on Long Road
  const rOracle = createRun(801, { short: false, unlocks: ['oracle'] });
  assert.equal(rOracle.buildings.find((b) => b.type === 'oracle')?.slot, ROOF_ORACLE_SLOT);
  assert.equal(plotsFree(rOracle), 0, 'legacy roof oracle does not eat a floor plot');

  // V7-M3: Blinded disables Sagittarius Steady resonance (First Volley) and ranged signatures
  const rBlind = createRun(802, { companions: ['unit91'] });
  const archer = { ...rBlind.roster[0], cls: 'sagittarius', weapon: 'bow', level: 4, injuries: [{ tag: 'blinded', weight: 2, weeksLeft: 2 }] };
  const target = structuredClone(rBlind.arenas[1].opponent);
  const mBlind = createMatch({ a: archer, b: target, rng: createRng(9) });
  const p2Blind = computePhase2(mBlind.a, mBlind.b, 1, 'guard');
  assert.equal(p2Blind.win.some((x) => /First Volley/i.test(x.source)), false, 'Blinded Sagittarius loses Steady First Volley resonance');
  assert.match(signatureBlocker(mBlind) ?? '', /Blinded/i, 'Blinded blocks ranged signature');

  // V7-M4: playbook forwarded through espionageOdds, estimateOdds, oddsKey, betOdds & CLI respec
  const rPlay = createRun(803, { companions: ['unit91'] });
  const fPlay = rPlay.roster[0];
  const oppPlay = rPlay.arenas[1].opponent;
  rPlay.espionage = { ...(rPlay.espionage ?? {}), op: { type: 'playbook', oppId: oppPlay.id, result: 'ok' } };
  const spy = espionageOdds(rPlay, oppPlay);
  assert.equal(spy.playbook, true);
  assert.notEqual(oddsKey(fPlay, { playbook: false }), oddsKey(fPlay, { playbook: true }));
  const mPlay = createMatch({ a: fPlay, b: oppPlay, rng: createRng(10), playbook: true });
  assert.equal(mPlay.playbook, true);
  const mNoPlay = createMatch({ a: fPlay, b: oppPlay, rng: createRng(10), playbook: false });
  const boPlay = betOdds(rPlay, mPlay);
  const boNoPlay = betOdds(rPlay, mNoPlay);
  assert.ok(typeof boPlay === 'number' && boPlay >= 1 && boPlay <= boNoPlay, `playbook payout odds (${boPlay}) should be <= plain (${boNoPlay})`);
  assert.ok(typeof estimateOdds(fPlay, oppPlay, { playbook: true, n: 100 }).win === 'number');

  // CLI respec command works through play-text.js
  const sess = createSession(804);
  sess.exec('draft unit91');
  sess.run.gold = 100;
  sess.run.buildings.push({ id: 'bt', type: 'temple', level: 1, slot: 'upper-0' });
  sess.run.roster[0].perks.push('swift');
  const respecOut = sess.exec(`respec ${sess.run.roster[0].id} swift`);
  assert.doesNotMatch(respecOut, /Unknown command/i);
  assert.equal(sess.run.roster[0].perks.includes('swift'), false);

  // V7-L1: Duplicate Medbays slice patients & show Shrouded Stranger only on Medbay #0
  const rDup = createRun(805, { companions: ['unit91', 'basa'] });
  rDup.prestigeLevel = 3;
  rDup.plot = { stage: 'favours', trust: 2, suspicion: 10, hidden: true, ended: null, cells: [], freed: [], seen: [] };
  rDup.buildings.push({ id: 'med2', type: 'medbay', level: 1, slot: 'upper-0' });
  const med0Slot = rDup.buildings.find((b) => b.type === 'medbay').slot;
  const med0Html = estateTab(rDup, { mode: 'villa', slot: med0Slot });
  const med1Html = estateTab(rDup, { mode: 'villa', slot: 'upper-0' });
  assert.match(med0Html, /Shrouded Stranger/i);
  assert.doesNotMatch(med1Html, /Shrouded Stranger/i);

  // V7-L2: fighterCard tooltips show g.win (+3% / +6% win chance); Ornitharius Speed badge & Fists Disarm chip
  const birdF = { ...rDup.roster[0], cls: 'ornitharius', speed: 5, decor: { bird: 1 }, gear: { weapon: 'hunterBow', armor: 'lionPelt' } };
  const mIron = createMatch({ a: birdF, b: oppPlay, rng: createRng(11), arena: 'ironRules' });
  mIron.a.classDisabledRound = 1;
  const cardIron = fighterCard(birdF, { combatant: mIron.a, live: { ...computePower(mIron.a, mIron.b, 1), round: 1 } });
  assert.match(cardIron, /\+3% win chance/i);
  assert.match(cardIron, /\+6% win chance/i);
  assert.match(cardIron, /\+9% win chance/i);
  assert.match(cardIron, /chip ability tip off/);
  assert.match(cardIron, /\(Disarmed\)/);
  assert.match(cardIron, /5 \+ 1 from gear/);
  void GEAR;

  // V7-L3: Cascaded Champion highest title, Gazette skips spy/revenant mourning, rename syncs partner bond
  const champ = { ...rDup.roster[0], titles: ['Champion of the Silver Coliseum', 'Champion of the Bronze Arena', 'Champion of the Dirt Pits'] };
  let sawHigh = false;
  for (let w = 0; w < 25; w++) {
    const lw = lastWordsFor({ ...rDup, week: w }, champ);
    if (/Silver Coliseum/i.test(lw)) sawHigh = true;
    assert.doesNotMatch(lw, /Champion of the Dirt Pits/i, 'cascaded Silver champion never quotes Dirt Pits as highest title');
  }
  void sawHigh;
  const rGaz = createRun(806, { companions: ['unit91'] });
  rGaz.fallen.push({ id: 'spy_dead', name: 'Judas', diedWeek: rGaz.week, arena: false, spy: true, renown: 20 });
  rGaz.fallen.push({ id: 'rev_dead', name: 'Lazarus', diedWeek: rGaz.week, arena: true, renown: 20 });
  rGaz.roster.push({ ...rGaz.roster[0], id: 'rev_live', name: 'Lazarus', kind: 'revenant', revenantOf: 'rev_dead' });
  const heads = cityHeadlines(rGaz).join(' ');
  assert.doesNotMatch(heads, /Judas|Lazarus/);

  const rRen = createRun(807);
  rRen.gold = 200;
  const fA = recruit(rRen, rRen.market[0].id);
  const fB = recruit(rRen, rRen.market[0].id);
  fA.bond = { id: fB.id, name: fB.name, since: 0 };
  fB.bond = { id: fA.id, name: fA.name, since: 0 };
  rename(rRen, fA.id, 'Cassia');
  assert.equal(fB.bond.name, 'Cassia', 'rename updates bonded partner bond.name');

  // V7-L4: Tampered save with invalid humor recovers cleanly via deserialize
  const rTamper = createRun(808, { companions: ['unit91'] });
  const raw = JSON.parse(serialize(rTamper));
  raw.roster[0].humor = '__proto__';
  const loaded = deserialize(JSON.stringify(raw));
  assert.ok(Object.hasOwn(HUMORS, loaded.roster[0].humor), 'invalid humor replaced with valid HUMORS key');

  // A4: Escalating Hades cost (+50% per prior revival on the same soul, uncapped) & UI badge
  const rHades = createRun(809, { companions: ['basa'] });
  rHades.gold = 500;
  rHades.prestigeLevel = 3;
  rHades.buildings.push({ id: 'bh', type: 'hades', level: 1, slot: CRYPT_HADES_SLOT });
  const baseCost = hadesPrice(rHades, 1);
  const b0 = { id: 'd0', name: 'Soul0', coreId: 'basa', diedWeek: rHades.week, arena: true, hadesReturned: 0, tier: 1 };
  const b1 = { ...b0, id: 'd1', hadesReturned: 1 };
  const b2 = { ...b0, id: 'd2', hadesReturned: 2 };
  assert.equal(reviveHadesPrice(rHades, b0), baseCost);
  assert.equal(reviveHadesPrice(rHades, b1), Math.round(baseCost * 1.5));
  assert.equal(reviveHadesPrice(rHades, b2), Math.round(baseCost * 2.0));
  rHades.fallen.push(b2);
  const hadesHtml = estateTab(rHades, { mode: 'villa', slot: CRYPT_HADES_SLOT });
  assert.match(hadesHtml, /Revived ×2/);

  // A2: "Nona" truncation note in Codex & bio + Fortuna Estate inspector respec-perk button
  const compCodex = ENTRIES.find((e) => e.key === 'basics:companions');
  assert.match(compCodex.rules ?? compCodex.rule ?? compCodex.text ?? compCodex.lore ?? '', /non-machine/i);
  assert.match(CORE_COMPANIONS.unit91.bio, /non-machine/i);
  rHades.roster[0].perks.push('swift');
  const roofHtml = estateTab(rHades, { mode: 'villa', slot: ROOF_TEMPLE_SLOT });
  assert.match(roofHtml, /data-action="respec-perk"/);

  // Career-sim catch: Solace-4 executing mid-bracket never drops below Mutinous (prevents emperorsGaze / coup Final softlock)
  const rSol = createRun(810, { companions: ['android'] });
  const solB = rSol.roster[0];
  solB.morale = 22;
  rSol.bouts = { 3: 'open' };
  rSol.brackets = { 3: { fighterId: solB.id, round: 1 } };
  rSol.mercy = { fighterId: solB.id, opp: 'Rival', house: rSol.houses[0].id, crowd: 'spare', tier: 3 };
  resolveMercy(rSol, 'kill');
  assert.equal(solB.morale, 20, 'crackedGovernor execution morale floors at MORALE.mutinous while locked in active bracket');
});


