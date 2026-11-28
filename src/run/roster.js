// L2 roster, market, Liaison, Armourer, jobs, morale, perks, Temple, Vulcan, Exhibition, inventory, Surgeon, retirement, and renaming.

import { createRng, deriveSeed, int, next, pick } from '../rng.js';
import {
  ECONOMY, STRESS, HEAL_WEEKS, KINDS, TRAITS, CLASSES, WEAPONS, BUILDINGS, CIRCUITS, XP, PERKS, MORALE, GEAR, DECOR,
  CONSUMABLES, AUGMENTS, SURGERY, RETIRE, RENAME, LIAISON, RECRUIT, EXHIBITION, BOND, REANIMATE, FEAR, deltaRow,
  HUMORS, HUMOUR_DRIFT, MEDITATION, COUSIN, COMPANIONS, FORTUNE_RETUNE, HADES,
} from '../data.js';
import { relicSum } from '../fortune.js';
import { Refused } from '../errors.js';
import { WANTS, LIAISON_LINES, COUSIN_LINES } from '../quests.js';
import { meleeOnly } from '../fight.js';
import { MOOD_WEEKS } from '../events.js';
import {
  rosterCap, trainerRooms, trainCap, trainCost, medbaySlots, decorCap, liaisonLevel, maxLevel, effectAt, build, upgrade,
  ensureRoomLayout, roomSlotById, decorZoneOf,
} from '../ludus.js';
import {
  JOBS, emptyDecor, createFighter, newId, remember, takenNames, clamp, log, findFighter, chronicle, bumpMorale,
  isTraining, jobCount, monthOf, talk, assertOk, decorComfortOf, dislikedDecorItems, trainStress, netTrainStress, effectivePower,
  arenaName, trainGain, hasPolicy, tierMarketPower, liaisonOffer, recruitPrice, cleanName, winsOf,
  foughtThisWeek, perkOffer, gainXp, idleBlocker, isInActiveBracket, addPrestige, clearHealedMedbay,
  removeFighter, changeFavor, queueMilestone, CORE_COMPANIONS, LORE_KEEPSAKES, createDialogueState, ensureDialogueState, evaluateKeepsake,
} from './helpers.js';
import { markPolitical, joinPlot } from './plotEngine.js';
import { currentBout, bondmate, formBond } from './houses.js';

// ---------- Market, Liaison, Armourer, Estate ----------

export function season(run, rng, f) {
  const level = pick(rng, RECRUIT.levels[Math.min(run.topTier, CIRCUITS.length) - 1]);
  for (let l = 2; l <= level; l++) {
    const pool = Object.keys(PERKS).filter((p) => (PERKS[p].repeatable || !f.perks.includes(p)) && (!PERKS[p].req || PERKS[p].req(f)));
    const perk = pick(rng, pool);
    f.perks.push(perk);
    for (const [stat, n] of Object.entries(PERKS[perk].stat ?? {})) f[stat] += n;
    if (PERKS[perk].stat?.power) f.perkPower = (f.perkPower ?? 0) + PERKS[perk].stat.power;
  }
  Object.assign(f, { level, xp: level > 1 ? XP.levels[level - 2] : 0 });
  return f;
}

export function refreshMarket(run) {
  const rng = run.rng.market;
  const bonus = tierMarketPower(run);
  const market = [];
  const make = (kind) => season(run, rng, createFighter(rng, { id: newId(run, 'f'), kind, bonusPower: bonus, takenNames: takenNames({ ...run, market: [] }, market), classes: run.setup?.classes }));
  for (let i = 0; i < ECONOMY.marketSize - 1; i++) market.push(make());
  market.splice(int(rng, 0, market.length), 0, make('orc'));
  run.market = market;
  remember(run, ...run.market);
}

// One Liaison prisoner, rolled on `rng`: a condemned convict, or with Liaison Lv 2 an elite prisoner of war.
function liaisonPrisoner(run, rng, lv, others) {
  const elite = lv >= 2;
  const natural = (kind) => KINDS[kind].basePower + tierMarketPower(run);
  const f = createFighter(rng, { id: newId(run, 'f'), takenNames: takenNames(run, others), classes: run.setup?.classes });
  f.power = elite ? Math.max(natural(f.kind), currentBout(run).oppPower + LIAISON.elitePower) : natural(f.kind);
  const prior = Math.max(0, f.power - natural(f.kind));
  Object.assign(f, { trained: Math.ceil(prior / trainGain(run, 'power')), trainedPower: prior });
  f.injuries = [{ tag: elite ? 'concussed' : 'fleshWound', weight: 1, weeksLeft: HEAL_WEEKS[elite ? 'concussed' : 'fleshWound'] }];
  f.stress = elite ? 30 : 40;
  f.morale = elite ? 40 : 30;
  season(run, rng, f);
  f.price = (elite ? LIAISON.elitePrice + LIAISON.elitePerTier * Math.min(run.topTier, CIRCUITS.length) : LIAISON.convictPrice) + RECRUIT.perLevel * (f.level - 1);
  f.origin = elite ? 'Prisoner of war' : 'Condemned convict';
  return f;
}

export function refreshLiaison(run) {
  const lv = liaisonLevel(run);
  const kept = cousinOffer(run); // the cousin waits in the cells until bought or executed (7.9)
  run.liaisonOffers = [];
  if (!lv) return;
  for (let i = 0; i < LIAISON.offers[Math.min(lv, LIAISON.offers.length) - 1]; i++) {
    const f = liaisonPrisoner(run, run.rng.market, lv, run.liaisonOffers);
    if (i === 0) markPolitical(run, f);
    else f.record = [];
    run.liaisonOffers.push(f);
  }
  remember(run, ...run.liaisonOffers);
  if (kept) run.liaisonOffers.unshift(kept);
  else offerCousin(run);
}

// ---------- The cousin in the cells (7.9, the designer: the rebel prisoner was too easy to miss) ----------
// Once the house reaches COUSIN.fromTier, and before any political prisoner has joined it, one of your fighters (or the
// steward, with no one to ask) begs you to buy their cousin out of the cells before he is executed. The cousin is a
// political prisoner, offered by the Liaison until bought or COUSIN.weeks have passed. Rolled on run.rng.plot.
const cousinOffer = (run) => (run.cousin && !run.cousin.done ? (run.liaisonOffers ?? []).find((f) => f.id === run.cousin.f) ?? null : null);
const cousinAsker = (run) => (run.cousin?.asker ? findFighter(run, run.cousin.asker) : null);
function cousinSay(run, key, text) {
  const f = cousinAsker(run);
  talk(run, `cousin-${key}`, [f ? { speaker: 'fighter', fighterId: f.id, text: text.fighter } : { speaker: 'steward', text: text.steward }], { now: true });
}

function offerCousin(run) {
  const c = run.cousin;
  const lv = liaisonLevel(run);
  if (!c || c.done || c.f || !lv) return;
  const f = liaisonPrisoner(run, run.rng.plot, lv, run.liaisonOffers ?? []);
  markPolitical(run, f, { force: true });
  f.cousinOf = cousinAsker(run)?.name ?? null;
  c.f = f.id;
  c.name = f.name;
  remember(run, f);
  run.liaisonOffers = [f, ...(run.liaisonOffers ?? [])];
  cousinSay(run, 'found', { fighter: COUSIN_LINES.found(f.name), steward: COUSIN_LINES.foundSteward(f.name) });
}

export function cousinWeek(run) {
  if (run.status !== 'active') return;
  const c = run.cousin;
  if (!c) {
    if (run.plot || run.topTier < COUSIN.fromTier || hasPolicy(run, 'purgePrisons') || run.roster.some((f) => f.political)) return;
    const asker = run.roster.find((f) => f.alive !== false && !f.political && f.kind !== 'revenant' && !f.mole) ?? null;
    run.cousin = { asker: asker?.id ?? null, week: run.week, until: run.week + COUSIN.weeks, f: null, name: null, done: null };
    const built = liaisonLevel(run) > 0;
    cousinSay(run, 'ask', { fighter: COUSIN_LINES.ask(built), steward: COUSIN_LINES.askSteward(built) });
    offerCousin(run);
    return;
  }
  if (c.done || run.week < c.until) return;
  c.done = 'executed';
  run.liaisonOffers = (run.liaisonOffers ?? []).filter((f) => f.id !== c.f);
  const asker = cousinAsker(run);
  if (asker) {
    bumpMorale(run, asker, COUSIN.missMorale);
    chronicle(run, asker, `Their cousin${c.name ? `, ${c.name},` : ''} was executed in the city cells.`);
  }
  log(run, `${c.name ?? 'The prisoner'} is executed in the city cells${asker ? ` (${asker.name} ${COUSIN.missMorale} Morale)` : ''}.`, 'bad');
  cousinSay(run, 'executed', { fighter: COUSIN_LINES.executed, steward: COUSIN_LINES.executedSteward });
}

// Bought: the asker is grateful (recruit).
function cousinSaved(run, f) {
  const c = run.cousin;
  if (!c || c.done || c.f !== f.id) return;
  c.done = 'saved';
  const asker = cousinAsker(run);
  if (asker) {
    bumpMorale(run, asker, COUSIN.savedMorale);
    chronicle(run, asker, `You bought their cousin, ${f.name}, out of the cells.`);
  }
  cousinSay(run, 'saved', { fighter: COUSIN_LINES.saved, steward: COUSIN_LINES.savedSteward(f.name) });
}

export function refreshArmourer(run) {
  const lv = maxLevel(run, 'armourer');
  if (!lv) {
    run.armourerStock = [];
    return;
  }
  const pool = Object.keys(GEAR).filter((k) => GEAR[k].tier <= lv);
  run.armourerStock = Array.from({ length: effectAt('armourer', lv) }, () => pick(run.rng.market, pool));
}

export function buildRoom(run, type, slot = null) {
  const b = build(run, type, slot);
  if (type === 'armourer') refreshArmourer(run);
  if (type === 'liaison') refreshLiaison(run);
  for (const f of run.roster ?? []) {
    queueMilestone(run, f, { id: `building_built_${type}`, priority: 52, ctx: { type, name: BUILDINGS[type]?.name } });
  }
  return b;
}

export function upgradeRoom(run, id) {
  return upgrade(run, id);
}

// ---------- v8.0 Core 5 Companions (Week 0 Draft & Pinned Pool Recruitment) ----------

export function recruitedCompanionIds(run) {
  const seen = new Set(run?.recruitedCompanions ?? []);
  for (const f of [...(run?.roster ?? []), ...(run?.fallen ?? []), ...(run?.retired ?? [])]) {
    if (f?.coreId) seen.add(f.coreId);
    if (f?.hollowedCompanion) seen.add(f.hollowedCompanion);
  }
  return [...seen];
}

export function createCompanion(run, coreId, overrides = {}) {
  const def = Object.hasOwn(CORE_COMPANIONS ?? {}, coreId) ? CORE_COMPANIONS[coreId] : null;
  if (!def) throw new Refused('Unknown core companion.');
  if (overrides.cls) {
    if (!Object.hasOwn(CLASSES, overrides.cls)) throw new Refused('Unknown class.');
    const templeLv = run ? maxLevel(run, 'temple') : 0;
    const allowed = def.allowedClasses ?? [];
    if (!allowed.includes(overrides.cls)) {
      if (templeLv < 1) throw new Refused(`${def.name} cannot train as a ${CLASSES[overrides.cls].name} without building the Temple of Fortuna.`);
      if (CLASSES[overrides.cls].legacy && !(run?.setup?.classes ?? []).includes(overrides.cls)) {
        throw new Refused(`${CLASSES[overrides.cls].name} is a Legacy class not unlocked in this career.`);
      }
    }
  }
  const cls = (overrides.cls && Object.hasOwn(CLASSES, overrides.cls)) ? overrides.cls : def.cls;
  if (cls === 'fighter' && overrides.weapon && !Object.hasOwn(WEAPONS, overrides.weapon)) {
    throw new Refused('Unknown weapon specialty.');
  }
  const weapon = cls === 'fighter' ? ((overrides.weapon && Object.hasOwn(WEAPONS, overrides.weapon)) ? overrides.weapon : (def.weapon || 'spear')) : null;
  if (overrides.kindTrait && !KINDS[def.kind]?.traits.includes(overrides.kindTrait)) {
    throw new Refused(`${KINDS[def.kind]?.name ?? def.kind} fighters cannot take that trait.`);
  }
  const kindTrait = (overrides.kindTrait && KINDS[def.kind]?.traits.includes(overrides.kindTrait)) ? overrides.kindTrait : def.kindTrait;
  if (overrides.humor && !Object.hasOwn(HUMORS, overrides.humor)) {
    throw new Refused('Unknown temperament.');
  }
  const humor = (overrides.humor && Object.hasOwn(HUMORS, overrides.humor)) ? overrides.humor : def.humor;
  const decor = emptyDecor();
  const f = {
    id: overrides.id ?? (run ? newId(run, 'f') : `core_${coreId}`),
    coreId,
    companion: true,
    name: def.name,
    handle: def.handle ?? null,
    kind: def.kind,
    kindTrait,
    personalTrait: def.personalTrait,
    cls,
    weapon,
    humor,
    power: def.power ?? KINDS[def.kind].basePower,
    speed: def.speed ?? ECONOMY.startSpeed,
    trained: 0,
    trainedPower: 0,
    decor,
    injuries: [],
    alive: true,
    stress: def.stress ?? 0,
    job: 'rest',
    titles: [],
    xp: 0,
    level: 1,
    perks: [],
    pendingPerks: [],
    renown: def.renown ?? 0,
    morale: def.morale ?? MORALE.start,
    gear: { weapon: null, armor: null },
    topStreak: 0,
    dialogue: createDialogueState(coreId),
  };
  if (def.political) {
    f.political = { cell: typeof def.political === 'object' ? def.political.cell : (def.cell || 'officer') };
  }
  return f;
}

export function getCompanionPool(run) {
  const taken = new Set(recruitedCompanionIds(run));
  return Object.keys(CORE_COMPANIONS ?? {})
    .filter((coreId) => !taken.has(coreId))
    .map((coreId) => createCompanion(null, coreId, { id: coreId }));
}

export function seasonCompanion(run, f) {
  const rawBonus = tierMarketPower(run);
  const basePow = CORE_COMPANIONS?.[f.coreId]?.power ?? KINDS[f.kind].basePower;
  if (rawBonus > 0) {
    const gain = trainGain(run, 'power');
    const maxBonus = trainCap(run) * gain;
    const bonus = Math.min(rawBonus, maxBonus);
    const trainedWeeks = Math.min(trainCap(run), Math.ceil(bonus / gain));
    f.power = basePow + bonus;
    f.trained = trainedWeeks;
    f.trainedPower = bonus;
  }
  const targetLevel = Math.min(3, Math.max(1, Math.min(run.topTier ?? 1, CIRCUITS.length)));
  if (targetLevel > (f.level ?? 1)) {
    f.xp = Math.max(f.xp ?? 0, XP.levels[targetLevel - 2]);
    while (f.level < targetLevel) {
      f.level += 1;
      f.pendingPerks.push(perkOffer(run, f));
    }
  }
  return f;
}

export function freeDraftPicks(run) {
  if (!run || run.status !== 'active' || run.week !== 0) return null;
  const freeLeft = Math.max(0, COMPANIONS.startPicks - recruitedCompanionIds(run).length);
  const hasPatronFighter = ['veteran', 'defector', 'liberator'].includes(run.setup?.patron);
  const extraBunk = hasPatronFighter && (run.patronBunk ?? 0) < 1 ? 1 : 0;
  const bedsLeft = Math.max(0, rosterCap(run) + extraBunk - (run.roster?.length ?? 0));
  const poolCount = getCompanionPool(run).length;
  const remaining = Math.min(freeLeft, bedsLeft, poolCount);
  return remaining > 0 ? { remaining, freeLeft, bedsLeft, poolCount } : null;
}

export function companionPrice(run, coreId, { draft = false } = {}) {
  const count = recruitedCompanionIds(run).length;
  if (draft && (run?.week ?? 0) === 0 && count < COMPANIONS.startPicks) return 0;
  if (coreId === 'elf' && liaisonLevel(run) >= 1) {
    return Math.max(1, COMPANIONS.elfLiaisonPrice - relicSum(run, 'recruitDiscount'));
  }
  const idx = Math.max(0, Math.min(COMPANIONS.prices.length - 1, count - COMPANIONS.startPicks));
  return Math.max(1, COMPANIONS.prices[idx] - relicSum(run, 'recruitDiscount'));
}

export function companionBlocker(run, coreId, { draft = false } = {}) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!Object.hasOwn(CORE_COMPANIONS ?? {}, coreId)) return 'No such companion.';
  const taken = recruitedCompanionIds(run);
  if (taken.includes(coreId)) return `${CORE_COMPANIONS[coreId].name} has already joined your house.`;
  if (draft && (run.week ?? 0) > 0) {
    return 'Starter companion draft is only available in Week 0 before your first week ends. Recruit remaining companions for Gold.';
  }
  if (draft && taken.length >= COMPANIONS.startPicks) {
    return `You have already drafted your ${COMPANIONS.startPicks} free starting companions. Recruit the rest for Gold.`;
  }
  const isFreeDraft = draft && (run.week ?? 0) === 0 && taken.length < COMPANIONS.startPicks;
  const hasPatronFighter = ['veteran', 'defector', 'liberator'].includes(run.setup?.patron);
  const canUsePatronBunk = isFreeDraft && hasPatronFighter && (run.patronBunk ?? 0) < 1;
  if (!canUsePatronBunk && run.roster.length >= rosterCap(run)) {
    return `Your quarters are full (${rosterCap(run)} fighters). Build or upgrade Fighter Quarters.`;
  }
  const price = companionPrice(run, coreId, { draft: isFreeDraft });
  if (run.gold < price) return `Needs ${price} Gold.`;
  return null;
}

export function draftCompanion(run, coreId, optsOrCls = {}, weapon = null, kindTrait = null, humor = null) {
  const opts = (optsOrCls && typeof optsOrCls === 'object')
    ? optsOrCls
    : { cls: optsOrCls || null, weapon, kindTrait, humor };
  assertOk(companionBlocker(run, coreId, { draft: true }));
  const f = createCompanion(run, coreId, {
    cls: opts.cls,
    weapon: opts.weapon,
    kindTrait: opts.kindTrait || opts.trait,
    humor: opts.humor,
  });
  if (run.roster.length >= rosterCap(run)) {
    run.patronBunk = (run.patronBunk ?? 0) + 1;
  }
  run.recruitedCompanions = [...new Set([...(run.recruitedCompanions ?? []), coreId])];
  run.roster.push(f);
  remember(run, f);
  chronicle(run, f, 'Joined the Ludus at the founding draft.');
  log(run, `${f.name}${f.handle ? ` (${f.handle})` : ''} joins your starting roster.`, 'good');
  joinPlot(run, f);
  return f;
}

export function recruitCompanion(run, coreId, opts = {}) {
  assertOk(companionBlocker(run, coreId, { draft: false }));
  const price = companionPrice(run, coreId, { draft: false });
  const f = createCompanion(run, coreId, {
    cls: opts.cls,
    weapon: opts.weapon,
    kindTrait: opts.kindTrait || opts.trait,
    humor: opts.humor,
  });
  run.gold -= price;
  seasonCompanion(run, f);
  run.recruitedCompanions = [...new Set([...(run.recruitedCompanions ?? []), coreId])];
  run.roster.push(f);
  remember(run, f);
  const viaLiaison = coreId === 'elf' && liaisonLevel(run) >= 1;
  chronicle(run, f, viaLiaison ? 'Bought out of the city cells via the Liaison.' : 'Recruited into the Ludus.');
  log(run, `${f.name}${f.handle ? ` (${f.handle})` : ''} joins the Ludus${viaLiaison ? ' from the city cells' : ''}.`, 'good');
  joinPlot(run, f);
  return f;
}

// ---------- Recruiting and release ----------

export function recruitBlocker(run, id) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const candidate = liaisonOffer(run, id) ?? run.market.find((f) => f.id === id);
  if (!candidate) return 'That fighter is not for sale.';
  if (run.roster.length >= rosterCap(run)) return `Your quarters are full (${rosterCap(run)} fighters). Build or upgrade Fighter Quarters.`;
  const price = recruitPrice(run, candidate);
  if (run.gold < price) return `Needs ${price} Gold.`;
  return null;
}

export function recruit(run, id) {
  assertOk(recruitBlocker(run, id));
  const fromLiaison = liaisonOffer(run, id);
  const fighter = fromLiaison ?? run.market.find((f) => f.id === id);
  const price = recruitPrice(run, fighter);
  run.gold -= price;
  if (fromLiaison) {
    run.liaisonOffers = run.liaisonOffers.filter((f) => f !== fighter);
    cousinSaved(run, fighter);
    talk(run, 'liaison-saved', [{ speaker: 'steward', text: LIAISON_LINES.saved(fighter.name) }]);
  } else {
    run.market = run.market.filter((f) => f !== fighter);
  }
  delete fighter.price;
  run.roster.push(fighter);
  chronicle(run, fighter, `Joined the Ludus${fighter.origin ? ` (${fighter.origin})` : ''}.`);
  log(run, `${fighter.name} joins the Ludus.`);
  joinPlot(run, fighter);
  return fighter;
}

export function releaseBlocker(run, id) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (f.companion) return `${f.name} is one of your core companions and cannot be dismissed.`;
  const inBracket = isInActiveBracket(run, id);
  if (inBracket) return `${f.name} is mid-bracket in ${arenaName(inBracket.tier)}: finish the bracket or withdraw first.`;
  return null;
}

export function release(run, id) {
  assertOk(releaseBlocker(run, id));
  const f = findFighter(run, id);
  removeFighter(run, f, { released: true });
  log(run, `${f.name} is released from the Ludus. Their gear and decor return to the storeroom.`);
}

// ---------- Weekly jobs ----------

export function trainBlocker(run, f, { checkGold = true } = {}) {
  if ((run.week ?? 0) < (run.staffDialogue?.trainer?.dismissedUntilWeek ?? 0)) {
    const left = run.staffDialogue.trainer.dismissedUntilWeek - (run.week ?? 0);
    return `Drillmaster post vacant (${left} week${left === 1 ? '' : 's'} remaining) — training paused.`;
  }
  if (f.trained >= trainCap(run)) return `Trainer cap reached (${trainCap(run)} training weeks). Upgrade a Trainer Room.`;
  if (f.morale < MORALE.restless) return `Discontented (Morale ${f.morale}): won't train. Raise their comfort.`;
  if (f.stress >= STRESS.overtrained) return `Stress ${f.stress}: must rest first.`;
  if (checkGold) {
    const trainees = run.roster.filter((x) => x.id !== f.id && isTraining(x.job)).length + 1;
    const fee = trainees * trainCost(run);
    if (run.gold < fee) return trainees > 1 ? `Needs ${fee} Gold for ${trainees} trainees; you have ${run.gold}.` : `Needs ${fee} Gold; you have ${run.gold}.`;
  }
  return null;
}

export function jobBlocker(run, id, job) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!JOBS.includes(job)) return 'Unknown job.';
  if (f.job === job) return null;
  if (isTraining(job)) {
    const busy = run.roster.filter((x) => x.id !== id && isTraining(x.job));
    if (busy.length >= trainerRooms(run)) {
      const who = busy.map((x) => x.name).join(' and ');
      return `${who} ${busy.length > 1 ? 'are' : 'is'} training (${trainerRooms(run)} Trainer Room${trainerRooms(run) > 1 ? 's' : ''}). Set ${busy.length > 1 ? 'one of them' : 'them'} to Rest, or build another Trainer Room.`;
    }
    const cannot = trainBlocker(run, f);
    if (cannot) return cannot;
  }
  if (job === 'medbay') {
    if (jobCount(run, 'medbay', id) >= medbaySlots(run)) return 'The Medbay is full.';
    if (!f.injuries.length) return 'Not injured.';
  }
  return null;
}

export function stewardPlanBlocker(run) {
  return idleBlocker(run) ?? (run.roster.length ? null : 'No gladiators to plan for.');
}

export function stewardPlan(run) {
  assertOk(stewardPlanBlocker(run));
  for (const f of run.roster) if (f.job !== 'rest' && !jobBlocker(run, f.id, 'rest')) f.job = 'rest';
  const out = [];
  for (const f of run.roster) {
    const hurt = f.injuries.some((i) => i.weight > 0);
    const wants = hurt ? ['medbay', 'rest'] : f.stress + netTrainStress(run, f) >= STRESS.overtrained ? ['rest'] : ['trainPower', 'trainSpeed', 'rest'];
    const job = wants.find((j) => j === 'rest' || !jobBlocker(run, f.id, j));
    if (job !== f.job) setJob(run, f.id, job);
    out.push({ id: f.id, job });
  }
  return out;
}

export function setJob(run, id, job) {
  assertOk(jobBlocker(run, id, job));
  const f = findFighter(run, id);
  f.job = job;
  f.notice = null;
  delete f.resume;
}

export function switchToRest(run, f, reason) {
  if (isTraining(f.job) && f.trained < trainCap(run)) f.resume = f.job;
  f.job = 'rest';
  f.notice = `Switched to Rest: ${reason}`;
  log(run, `${f.name} switched to Rest: ${reason}`, 'warn');
}

export function resumeTraining(run, f) {
  if (f.trained >= trainCap(run)) { delete f.resume; return; }
  if (f.stress + netTrainStress(run, f) >= STRESS.overtrained) return;
  if (run.roster.filter((x) => x !== f && isTraining(x.job)).length >= trainerRooms(run)) return;
  f.job = f.resume;
  if (trainBlocker(run, f)) { f.job = 'rest'; return; }
  delete f.resume;
  f.notice = 'Back to training: rested and ready.';
  log(run, `${f.name} goes back to training.`, 'good');
}

// ---------- Morale ----------

export function moraleTarget(run, f) {
  if (f.kind === 'revenant') return { target: REANIMATE.morale, comfort: 0, expects: 0, mood: 0, revenant: true };
  let traitComfort = 0;
  if (f.personalTrait === 'machineRaised') {
    if ((run.roster ?? []).some((x) => x.id !== f.id && x.kind === 'android') || f.job === 'medbay') traitComfort += 10;
    if ((run.roster ?? []).filter((x) => x.id !== f.id && x.kind === 'human').length >= 2 && !(f.decor?.rockGarden > 0)) traitComfort -= 5;
  }
  if (f.personalTrait === 'fourthSon' && run.plot && !run.plot.ended && ['cause', 'ready'].includes(run.plot.stage) && !f.dialogue?.loreFlags?.includes('orc_barracks_truce')) {
    traitComfort -= 15;
  }
  const comfort = MORALE.perQuartersLevel * maxLevel(run, 'quarters') + decorComfortOf(f) + traitComfort + (bondmate(run, f) ? BOND.comfort : 0) + (hasPolicy(run, 'grainToLudus') ? 5 : 0) + MORALE.perEntertainmentLevel * maxLevel(run, 'entertainment');
  const expects = Math.min(MORALE.maxExpectation, MORALE.expectationPerRenown * f.renown);
  const mood = f.mood?.n ?? 0;
  return { target: clamp(MORALE.base + comfort - expects + mood, 0, 100), comfort, expects, mood };
}

export function moraleState(f) {
  if (f.morale >= MORALE.inspired) return { id: 'inspired', label: 'Inspired', desc: '+5% win chance in every round.' };
  if (f.morale < MORALE.mutinous) return { id: 'mutinous', label: 'Mutinous', desc: 'Refuses to fight. Give them decor, a better room, or an Entertainment Room.' };
  if (f.morale < MORALE.restless) return { id: 'restless', label: 'Discontented', desc: "Won't train. Give them decor or a better room." };
  return { id: 'content', label: 'Content', desc: 'No effect.' };
}

// ---------- Perks, Temple of Fortuna, Fear ----------

export function perkBlocker(run, id, perk) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!f.pendingPerks[0]?.includes(perk)) return 'That perk is not on offer.';
  return null;
}

export function choosePerk(run, id, perk) {
  assertOk(perkBlocker(run, id, perk));
  const f = findFighter(run, id);
  f.pendingPerks.shift();
  f.perks.push(perk);
  for (const [stat, n] of Object.entries(PERKS[perk].stat ?? {})) f[stat] += n;
  if (PERKS[perk].stat?.power) f.perkPower = (f.perkPower ?? 0) + PERKS[perk].stat.power;
  log(run, `${f.name} learns ${PERKS[perk].name}.`, 'good');
}

export const prayPrice = (run) => effectAt('temple', maxLevel(run, 'temple'));

export function prayBlocker(run, id) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!maxLevel(run, 'temple')) return 'Build the Temple of Fortuna first.';
  const f = findFighter(run, id);
  if (!f?.pendingPerks.length) return 'No perk choice to pray over.';
  if (run.gold < prayPrice(run)) return `Needs ${prayPrice(run)} Gold.`;
  return null;
}

export function pray(run, id) {
  assertOk(prayBlocker(run, id));
  const f = findFighter(run, id);
  run.gold -= prayPrice(run);
  f.pendingPerks[0] = perkOffer(run, f);
  log(run, `You burn incense to Fortuna for ${f.name}. New paths open: ${f.pendingPerks[0].map((p) => PERKS[p].name).join(', ')}.`, 'event');
}

export function faceFear(run, f, oppSide) {
  const vs = meleeOnly(oppSide) ? 'melee' : 'ranged';
  const sc = (f.scars ?? []).find((x) => x.id === 'afeared' && x.vs === vs);
  if (!sc) return null;
  return fearStep(run, f, sc, 1, `${f.name} beat a ${vs} fighter, the kind they fear`, `Faced their fear of ${vs} fighters, and beat it.`);
}

// Progress toward conquering one Afeared scar (`amount` in wins); conquered at FEAR.conquerWins.
function fearStep(run, f, sc, amount, progressLine, chronicleLine) {
  sc.faced = (sc.faced ?? 0) + amount;
  if (sc.faced < FEAR.conquerWins) {
    log(run, `${progressLine} (${sc.faced}/${FEAR.conquerWins} to conquer it).`, 'event');
    return null;
  }
  f.scars = f.scars.filter((x) => x !== sc);
  chronicle(run, f, chronicleLine);
  log(run, `${f.name} has conquered their fear: no longer Afeared of ${sc.vs} fighters.`, 'good');
  return `No longer Afeared (${sc.vs})`;
}

// ---------- 7.1 Temperament: Humour drift and meditation ----------

// The Temperament piece with strictly the most copies in a fighter's room: { item, humor } or { tied: true } or null.
export function dominantTemperament(f) {
  const pieces = Object.entries(f.decor ?? {}).filter(([k, n]) => n > 0 && DECOR[k]?.humor);
  if (!pieces.length) return null;
  const top = Math.max(...pieces.map(([, n]) => n));
  const leaders = pieces.filter(([, n]) => n === top);
  if (leaders.length > 1) return { tied: true };
  return { item: leaders[0][0], humor: DECOR[leaders[0][0]].humor };
}

// A drift ends as soon as its piece stops leading the room (a tie only pauses it), so the UI never shows a stale drift.
export function syncDrift(f) {
  const dom = dominantTemperament(f);
  if (f.humourDrift && !dom?.tied && dom?.humor !== f.humourDrift.to) delete f.humourDrift;
}

// Weekly: a dominant Temperament piece for another Humour advances the drift; at HUMOUR_DRIFT.weeks the Humour changes for
// good (until reshaped). A tie pauses the drift; no piece, or one matching their Humour, clears it.
export function driftHumour(run, f) {
  if (f.kind === 'revenant') return; // a Revenant feels nothing
  const dom = dominantTemperament(f);
  if (dom?.tied) return;
  if (!dom || dom.humor === f.humor) {
    delete f.humourDrift;
    return;
  }
  f.humourDrift = f.humourDrift?.to === dom.humor ? { to: dom.humor, weeks: f.humourDrift.weeks + 1 } : { to: dom.humor, weeks: 1 };
  if (f.humourDrift.weeks < HUMOUR_DRIFT.weeks) return;
  const name = HUMORS[dom.humor].name;
  f.humor = dom.humor;
  delete f.humourDrift;
  chronicle(run, f, `${HUMOUR_DRIFT.weeks} weeks with the ${DECOR[dom.item].name} changed their temper: now ${name}.`);
  log(run, `${HUMOUR_DRIFT.weeks} weeks with the ${DECOR[dom.item].name} have changed ${f.name}. The others notice it first: ${f.name} is ${name} now.`, 'event');
}

// A Rest week with a Rock Garden: extra Stress relief, a little XP, and half a step toward conquering each fear.
export function meditate(run, f) {
  if (f.job !== 'rest' || !(f.decor?.rockGarden > 0) || f.kind === 'revenant') return;
  const bonusXp = f.keepsake === 'machineCalm' ? 1 : 0;
  if (f.keepsake === 'machineCalm') f.meditatedBoost = true;
  f.stress = clamp(f.stress - MEDITATION.stress, 0, STRESS.max);
  gainXp(run, f, MEDITATION.xp + bonusXp);
  log(run, `${f.name} spends the rest day raking the Rock Garden, and comes back quieter${bonusXp ? ' (Enclave Stillness: +2 XP and Round-1 focus)' : ''}.`, 'good');
  for (const sc of (f.scars ?? []).filter((x) => x.id === 'afeared')) {
    fearStep(run, f, sc, MEDITATION.fear, `${f.name} sits with their fear of ${sc.vs} fighters`, `Meditated on their fear of ${sc.vs} fighters, and let it go.`);
  }
}

export const ritePrice = (run) => {
  const base = FEAR.ritePrice + FEAR.ritePerTier * Math.min(run.topTier, CIRCUITS.length);
  return maxLevel(run, 'temple') >= 2 ? Math.round(base * FORTUNE_RETUNE.riteLv2Discount) : base;
};

export function riteBlocker(run, id) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!maxLevel(run, 'temple')) return 'Build the Temple of Fortuna first.';
  const f = findFighter(run, id);
  if (!f) return 'Choose a fighter from your roster.';
  if (!(f.scars ?? []).some((x) => x.id === 'afeared')) return `${f.name} isn't Afeared.`;
  if (run.gold < ritePrice(run)) return `Needs ${ritePrice(run)} Gold.`;
  return null;
}

export function rite(run, id) {
  assertOk(riteBlocker(run, id));
  const f = findFighter(run, id);
  const sc = f.scars.find((x) => x.id === 'afeared');
  run.gold -= ritePrice(run);
  f.scars = f.scars.filter((x) => x !== sc);
  chronicle(run, f, `Fortuna's priests lifted their fear of ${sc.vs} fighters.`);
  log(run, `The priests of Fortuna lift ${f.name}'s fear: no longer Afeared of ${sc.vs} fighters.`, 'good');
}

// ---------- v8.0 Customizable Builds via Starter Shrine / Temple of Fortuna ----------

export function retunePrice(run) {
  const lv = Math.min(maxLevel(run, 'temple'), FORTUNE_RETUNE.costByLevel.length - 1);
  if (lv >= 2 && run?.freeRetuneMonth === monthOf(run?.week ?? 0)) {
    return FORTUNE_RETUNE.costByLevel[1] ?? 2;
  }
  return FORTUNE_RETUNE.costByLevel[lv] ?? 4;
}

export function retuneBlocker(run, id) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (f.kind === 'revenant') return 'A Revenant is forged in brass; Fortuna cannot reshape the dead.';
  const inBracket = isInActiveBracket(run, id);
  if (inBracket) return `${f.name} is mid-bracket in ${arenaName(inBracket.tier)}: finish the bracket first.`;
  const price = retunePrice(run);
  if (run.gold < price) return `Needs ${price} Gold.`;
  return null;
}

function consumeRetuneCost(run) {
  const price = retunePrice(run);
  run.gold -= price;
  if (maxLevel(run, 'temple') >= 2 && price === 0) {
    run.freeRetuneMonth = monthOf(run.week);
  }
  return price;
}

export function retuneClass(run, id, cls, weapon = null) {
  assertOk(retuneBlocker(run, id));
  const f = findFighter(run, id);
  if (!Object.hasOwn(CLASSES, cls)) throw new Refused('Unknown class.');
  const def = f.coreId ? CORE_COMPANIONS?.[f.coreId] : null;
  if (def?.allowedClasses && maxLevel(run, 'temple') < 1 && !def.allowedClasses.includes(cls)) {
    throw new Refused(`${f.name} cannot train as a ${CLASSES[cls].name} without building the Temple of Fortuna.`);
  }
  if (CLASSES[cls].legacy && !(run.setup?.classes ?? []).includes(cls) && !def?.allowedClasses?.includes(cls)) {
    throw new Refused(`${CLASSES[cls].name} is a Legacy class not unlocked in this career.`);
  }
  if (cls === 'fighter' && weapon && !Object.hasOwn(WEAPONS, weapon)) throw new Refused('Unknown weapon specialty.');
  const nextWeapon = cls === 'fighter' ? (weapon && Object.hasOwn(WEAPONS, weapon) ? weapon : (f.weapon && Object.hasOwn(WEAPONS, f.weapon) ? f.weapon : 'sword')) : null;
  if (f.cls === cls && f.weapon === nextWeapon) {
    throw new Refused(`${f.name} already fights as ${CLASSES[cls].name}${nextWeapon ? ` (${WEAPONS[nextWeapon].name})` : ''}.`);
  }
  const price = consumeRetuneCost(run);
  f.cls = cls;
  f.weapon = nextWeapon;
  const label = `${CLASSES[cls].name}${nextWeapon ? ` (${WEAPONS[nextWeapon].name})` : ''}`;
  chronicle(run, f, `Re-tuned at Fortuna's shrine to fight as a ${label}.`);
  log(run, `Fortuna reshapes ${f.name}'s discipline: now ${label}${price ? ` (−${price} Gold)` : ' (free monthly rite at Temple Lv 2)'}.`, 'event');
  return f;
}

export function retuneTrait(run, id, trait) {
  assertOk(retuneBlocker(run, id));
  const f = findFighter(run, id);
  const allowed = KINDS[f.kind]?.traits ?? [];
  if (!Object.hasOwn(TRAITS, trait) || !allowed.includes(trait)) throw new Refused(`${KINDS[f.kind]?.name ?? f.kind} fighters cannot take that trait.`);
  if (f.kindTrait === trait) throw new Refused(`${f.name} already has ${TRAITS[trait].name}.`);
  const price = consumeRetuneCost(run);
  f.kindTrait = trait;
  chronicle(run, f, `Re-tuned at Fortuna's shrine: ${TRAITS[trait].name}.`);
  log(run, `Fortuna awakens a new aspect in ${f.name}: ${TRAITS[trait].name}${price ? ` (−${price} Gold)` : ' (free monthly rite at Temple Lv 2)'}.`, 'event');
  return f;
}

export function retuneHumor(run, id, humor) {
  assertOk(retuneBlocker(run, id));
  const f = findFighter(run, id);
  if (!Object.hasOwn(HUMORS, humor)) throw new Refused('Unknown temperament.');
  if (f.humor === humor && !f.humourDrift) throw new Refused(`${f.name} is already ${HUMORS[humor].name}.`);
  const price = consumeRetuneCost(run);
  f.humor = humor;
  delete f.humourDrift;
  chronicle(run, f, `Fortuna's incense settled their temper: now ${HUMORS[humor].name}.`);
  log(run, `Fortuna attunes ${f.name}'s temperament to ${HUMORS[humor].name}${price ? ` (−${price} Gold)` : ' (free monthly rite at Temple Lv 2)'}.`, 'event');
  return f;
}

export function setPerkFocus(run, id, focus) {
  assertOk(idleBlocker(run));
  const f = findFighter(run, id);
  if (!f) throw new Refused('No such fighter.');
  if (!FORTUNE_RETUNE.focusTags.includes(focus)) throw new Refused('Unknown perk focus.');
  if (focus === 'any') delete f.perkFocus;
  else f.perkFocus = focus;
  log(run, `${f.name}'s training focus is set to ${focus === 'any' ? 'balanced (any perk)' : focus}.`, 'info');
  return f;
}

export const respecPrice = (run) => FORTUNE_RETUNE.respecCostByLevel[Math.min(maxLevel(run, 'temple'), FORTUNE_RETUNE.respecCostByLevel.length - 1)] ?? 4;

export function respecPerkBlocker(run, id, dropPerk) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (maxLevel(run, 'temple') < 1) return 'Build the Temple of Fortuna to unbind and respec a perk.';
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!Object.hasOwn(PERKS, dropPerk) || !f.perks.includes(dropPerk)) return `${f.name} does not have that perk.`;
  if (f.pendingPerks.length) return `Choose ${f.name}'s pending perk first.`;
  const cost = respecPrice(run);
  if (run.gold < cost) return `Needs ${cost} Gold.`;
  return null;
}

export function respecPerk(run, id, dropPerk) {
  assertOk(respecPerkBlocker(run, id, dropPerk));
  const f = findFighter(run, id);
  const cost = respecPrice(run);
  run.gold -= cost;
  const idx = f.perks.indexOf(dropPerk);
  f.perks.splice(idx, 1);
  for (const [stat, n] of Object.entries(PERKS[dropPerk].stat ?? {})) f[stat] -= n;
  if (PERKS[dropPerk].stat?.power) f.perkPower = Math.max(0, (f.perkPower ?? 0) - PERKS[dropPerk].stat.power);
  f.pendingPerks.push(perkOffer(run, f));
  log(run, `Fortuna's priests unbind ${PERKS[dropPerk].name} from ${f.name}. Choose a new perk.`, 'event');
  return f;
}

// ---------- Temple of Hades (True Revival Within the Month) & Unnatural Temple of Vulcan ----------

export const hadesPrice = (run, tier = run.topTier) => HADES.price + HADES.perTier * Math.min(tier, CIRCUITS.length) - (maxLevel(run, 'hades') >= 2 ? HADES.lv2Discount : 0);
export function reviveHadesPrice(run, body = null) {
  const base = hadesPrice(run);
  const soul = typeof body === 'string'
    ? (run.fallen?.find((x) => x.id === body) ?? findFighter(run, body) ?? null)
    : body;
  const prior = Math.max(0, Number(soul?.hadesReturned) || 0);
  return Math.round(base * (1 + 0.5 * prior));
}
export const hadesKeepWeeks = (run) => effectAt('hades', maxLevel(run, 'hades'));
export const hadesRaisable = (run) => (!maxLevel(run, 'hades')
  ? []
  : run.fallen.filter((f) => (f.arena || f.body) && !f.raised && !f.revived && f.kind !== 'revenant' && run.week - f.diedWeek <= hadesKeepWeeks(run)));

export function reviveHadesBlocker(run, id) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!maxLevel(run, 'hades')) return 'Build the Temple of Hades first.';
  const f = run.fallen.find((x) => x.id === id);
  if (!f) return 'No such fallen fighter.';
  if (!f.arena && !f.body) return `${f.name} was executed; the Praetorians burned the body.`;
  if (f.raised || f.revived || f.kind === 'revenant') return `${f.name}'s soul has already been claimed.`;
  const keeps = hadesKeepWeeks(run);
  if (run.week - f.diedWeek > keeps) {
    return `${f.name} has been dead too long for Hades (${run.week - f.diedWeek} weeks; the threshold holds for ${keeps} weeks — only the Unnatural Temple of Vulcan can raise the body now).`;
  }
  if (run.roster.length >= rosterCap(run)) return `Your quarters are full (${rosterCap(run)} fighters).`;
  const price = reviveHadesPrice(run, f);
  if (run.gold < price) return `Needs ${price} Gold (take a Favour or Rival House loan if your coffers are short).`;
  return null;
}

export function reviveHades(run, id) {
  assertOk(reviveHadesBlocker(run, id));
  const idx = run.fallen.findIndex((x) => x.id === id);
  const [f] = run.fallen.splice(idx, 1);
  const lv = maxLevel(run, 'hades');
  const weeksDead = run.week - f.diedWeek;
  run.gold -= reviveHadesPrice(run, f);
  delete f.diedWeek;
  delete f.arena;
  delete f.body;
  f.alive = true;
  f.job = 'rest';
  f.stress = lv >= 2 ? 0 : HADES.stressLv1;
  f.injuries = lv >= 2 ? [] : [{ tag: 'concussed', weight: 1, weeksLeft: HEAL_WEEKS.concussed }];
  f.hadesReturned = (f.hadesReturned ?? 0) + 1;
  if (lv >= 2) bumpMorale(run, f, HADES.lv2Morale);
  if (f.bond?.id) {
    const mate = findFighter(run, f.bond.id);
    if (mate && !mate.bond) {
      mate.bond = { id: f.id, name: f.name, since: run.week };
      bumpMorale(run, mate, 10);
    } else if (!mate || mate.bond?.id !== f.id) {
      delete f.bond;
    }
  }
  if (f.wasPlotChampion) {
    delete f.wasPlotChampion;
    if (run.plot && !run.plot.ended && !run.plot.champion) {
      run.plot.champion = f.id;
    }
  }
  checkKeepsakes(run, f);
  run.roster.push(f);
  queueMilestone(run, f, { id: 'hades_revived', priority: 100, ctx: { weeksDead, level: lv } });
  chronicle(run, f, `Ransomed back from the threshold in the Temple of Hades, ${weeksDead} week${weeksDead === 1 ? '' : 's'} after falling.`);
  log(run, `Gold coins are laid on the black altar. ${f.name} draws breath in the Temple of Hades — whole, living, and themselves${lv < 2 ? ' (Concussed from the crossing)' : ' (+15 Morale)'}.`, 'good');
  return f;
}

export const restoreRevenantPrice = (run) => Math.max(10, (HADES.restoreGold ?? 28) - (maxLevel(run, 'hades') >= 2 ? HADES.lv2Discount : 0));

export function restoreRevenantBlocker(run, id) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!maxLevel(run, 'hades')) return 'Build the Temple of Hades first.';
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (f.kind !== 'revenant' || !f.hollowedCompanion) return 'Only a hollowed Core Companion raised at Vulcan can undergo the Rite of the Whole Soul.';
  const price = restoreRevenantPrice(run);
  if (run.gold < price) return `Needs ${price} Gold.`;
  const favCost = HADES.restoreFavor ?? 4;
  if (run.favor <= favCost) return `Needs more than ${favCost} Imperial Favour.`;
  return null;
}

export function restoreRevenant(run, id) {
  assertOk(restoreRevenantBlocker(run, id));
  const f = findFighter(run, id);
  const coreId = f.hollowedCompanion;
  const def = CORE_COMPANIONS?.[coreId];
  const price = restoreRevenantPrice(run);
  const favCost = HADES.restoreFavor ?? 4;
  run.gold -= price;
  changeFavor(run, -favCost, `Rite of the Whole Soul for ${f.name} at the Temple of Hades`);
  const fallenList = run.fallen ?? [];
  let fallenIdx = f.revenantOf ? fallenList.findIndex((x) => x.id === f.revenantOf) : -1;
  if (fallenIdx < 0) fallenIdx = fallenList.findIndex((x) => x.coreId === coreId);
  const fallen = fallenIdx >= 0 ? fallenList[fallenIdx] : null;
  if (fallen) {
    if (fallen.dialogue) f.dialogue = structuredClone(fallen.dialogue);
    if (fallen.political) f.political = structuredClone(fallen.political);
    else if (def?.political) f.political = { cell: def.cell ?? 'officer' };
    if (fallen.record) f.record = structuredClone(fallen.record);
    if (fallen.bond?.id) {
      const mate = findFighter(run, fallen.bond.id);
      if (mate && mate.alive !== false && mate.kind !== 'revenant' && !mate.bond) {
        f.bond = { id: mate.id, name: mate.name, since: fallen.bond.since ?? run.week };
        mate.bond = { id: f.id, name: f.name, since: fallen.bond.since ?? run.week };
        bumpMorale(run, mate, 10);
      } else if (mate && mate.bond?.id === f.id) {
        f.bond = structuredClone(fallen.bond);
      }
    }
    if (fallen.wasPlotChampion && run.plot && !run.plot.ended && !run.plot.champion) {
      run.plot.champion = f.id;
    }
    f.power = Math.max(f.power, fallen.power ?? f.power);
    fallenList.splice(fallenIdx, 1);
  } else if (def?.political && !f.political) {
    f.political = { cell: def.cell ?? 'officer' };
  }
  delete f.hollowedCompanion;
  delete f.revenantOf;
  f.coreId = coreId;
  f.companion = true;
  f.kind = def.kind;
  f.kindTrait = f.preVulcanTrait && KINDS[def.kind]?.traits.includes(f.preVulcanTrait) ? f.preVulcanTrait : def.kindTrait;
  f.personalTrait = def.personalTrait;
  f.humor = f.preVulcanHumor ?? def.humor;
  delete f.preVulcanTrait;
  delete f.preVulcanHumor;
  f.morale = Math.max(f.morale ?? 50, def.morale ?? 55);
  f.hadesReturned = (f.hadesReturned ?? 0) + 1;
  ensureDialogueState(f);
  f.dialogue.queue = f.dialogue.queue.filter((q) => q.id !== 'vulcan_revenant_shock');
  checkKeepsakes(run, f);
  queueMilestone(run, f, { id: 'hades_revived', priority: 100, ctx: { restoredFromRevenant: true, level: maxLevel(run, 'hades') } });
  chronicle(run, f, 'Underwent the Rite of the Whole Soul in the Temple of Hades: brass shed and living soul restored.');
  log(run, `The priests of Hades unbind Vulcan's brass stitches from ${f.name}: their living soul and voice return whole!`, 'good');
  return f;
}

export function vulcanKeepWeeks(run, body = null) {
  const lv = maxLevel(run, 'vulcan');
  const base = effectAt('vulcan', lv);
  if (!lv || !(body?.companion || body?.coreId)) return base;
  return base + (lv >= 2 ? (COMPANIONS.vulcanLv2BonusWeeks ?? 12) : COMPANIONS.vulcanBonusWeeks);
}
export const reanimatePrice = (run) => REANIMATE.price + REANIMATE.perTier * Math.min(run.topTier, CIRCUITS.length);
export const raisable = (run) => (!maxLevel(run, 'vulcan') ? [] : run.fallen.filter((f) => (f.arena || f.body) && !f.raised && !f.revived && f.kind !== 'revenant' && run.week - f.diedWeek <= vulcanKeepWeeks(run, f)));

export function reanimateBlocker(run, id) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!maxLevel(run, 'vulcan')) return 'Build the Unnatural Temple of Vulcan first.';
  const f = run.fallen.find((x) => x.id === id);
  if (!f) return 'No such fallen fighter.';
  if (!f.arena && !f.body) return `${f.name} was executed; the Praetorians burned the body.`;
  if (f.raised || f.revived || f.kind === 'revenant') return 'Vulcan cannot kindle the same body twice.';
  const keeps = vulcanKeepWeeks(run, f);
  if (run.week - f.diedWeek > keeps) return `${f.name} has been dead too long (a body keeps ${keeps} weeks${maxLevel(run, 'vulcan') < BUILDINGS.vulcan.per.length ? '; a bigger Temple keeps them longer' : ''}).`;
  if (run.roster.length >= rosterCap(run)) return `Your quarters are full (${rosterCap(run)} fighters).`;
  if (run.gold < reanimatePrice(run)) return `Needs ${reanimatePrice(run)} Gold.`;
  return null;
}

export function reanimate(run, id) {
  assertOk(reanimateBlocker(run, id));
  const body = run.fallen.find((x) => x.id === id);
  const wasCompanion = Boolean(body.companion || body.coreId);
  const coreId = body.coreId ?? null;
  const oldBondId = body.bond?.id ?? null;
  const oldTrait = body.kindTrait ?? null;
  const oldHumor = body.humor ?? null;
  body.raised = true;
  run.gold -= reanimatePrice(run);
  const f = structuredClone(body);
  for (const key of ['diedWeek', 'arena', 'raised', 'bond', 'political', 'record', 'mood', 'nemesisOf', 'spy', 'body', 'want', 'resume', 'notice', 'mole', 'humourDrift', 'companion', 'coreId', 'personalTrait', 'keepsake', 'dialogue', 'wasPlotChampion']) delete f[key]; // 7.4.1: a raised mole or mid-drift death starts clean
  const lost = maxLevel(run, 'vulcan') >= 2 ? 0 : REANIMATE.power;
  Object.assign(f, {
    id: newId(run, 'f'), kind: 'revenant', kindTrait: pick(run.rng.growth, KINDS.revenant.traits), alive: true, injuries: [],
    stress: 0, job: 'rest', morale: REANIMATE.morale, topStreak: 0, pendingPerks: [], revenantOf: body.id, power: body.power + lost, risen: true,
  });
  if (wasCompanion) {
    f.hollowedCompanion = coreId;
    f.preVulcanTrait = oldTrait;
    f.preVulcanHumor = oldHumor;
    f.dialogue = createDialogueState(coreId);
    queueMilestone(run, f, { id: 'vulcan_revenant_shock', priority: 100, ctx: { coreId, name: f.name } });
    for (const mate of run.roster) {
      bumpMorale(run, mate, mate.id === oldBondId ? COMPANIONS.vulcanBondShockMorale : COMPANIONS.vulcanShockMorale);
      queueMilestone(run, mate, { id: 'vulcan_revenant_shock', priority: 100, ctx: { coreId, name: f.name } });
    }
  }
  run.roster.push(f);
  chronicle(run, f, `Raised from the dead in the Unnatural Temple of Vulcan, ${run.week - body.diedWeek} week${run.week - body.diedWeek === 1 ? '' : 's'} after falling. ${TRAITS[f.kindTrait].name}.`);
  log(run, `The priests of Vulcan work through the night. ${f.name} walks out of the forge: a Revenant, brass where the wounds were${lost ? `, and a little weaker (${lost} Power)` : ''}${wasCompanion ? ' — the living companions recoil in horror' : ''}.`, 'event');
  return f;
}

// ---------- Exhibition Ring ----------

export function exhibitionBlocker(run, id, otherId) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!maxLevel(run, 'exhibition')) return 'Build the Exhibition Ring first.';
  if (!run.bouts) return 'Exhibitions happen on tournament day.';
  if (run.exhibitionWeek === run.week) return 'The ring has had its bout this week.';
  const [a, b] = [findFighter(run, id), findFighter(run, otherId)];
  if (!a || !b || a === b) return 'Choose two different fighters.';
  for (const f of [a, b]) {
    if (foughtThisWeek(run).includes(f.id)) return `${f.name} already fought this week.`;
    if (f.injuries.some((i) => i.weight > 0)) return `${f.name} is injured.`;
    if (f.morale < MORALE.mutinous) return `${f.name} is mutinous and refuses to fight.`;
  }
  return null;
}

export function exhibition(run, id, otherId) {
  assertOk(exhibitionBlocker(run, id, otherId));
  const [a, b] = [findFighter(run, id), findFighter(run, otherId)];
  const r = run.rng.fight;
  const delta = clamp(effectivePower(a) - effectivePower(b), -10, 10);
  const [winner, loser] = next(r) * 100000 < deltaRow(delta).win ? [a, b] : [b, a];
  const gold = EXHIBITION.goldPerTier * Math.min(run.topTier, CIRCUITS.length);
  run.exhibitionWeek = run.week;
  run.gold += gold;
  winner.renown += EXHIBITION.renown;
  gainXp(run, winner, EXHIBITION.xpWin);
  gainXp(run, loser, EXHIBITION.xpLoss);
  const wound = next(r) < EXHIBITION.woundChance;
  if (wound) loser.injuries.push({ tag: 'fleshWound', weight: 1, weeksLeft: HEAL_WEEKS.fleshWound });
  formBond(run, a, b, 'exhibition');
  log(run, `Exhibition: ${winner.name} beats ${loser.name} in the ring. +${gold} Gold from the crowd${wound ? `; ${loser.name} takes a Flesh Wound` : ''}.`, 'good');
  return { winner: winner.name, loser: loser.name, gold, wound };
}

// ---------- Inventory: decor, gear, items & 3/4 Room Lore Keepsakes ----------

export function checkKeepsakes(run, f, placedItem = null) {
  if (!f?.coreId) return null;
  const prev = f.keepsake ?? null;
  const evaluated = evaluateKeepsake(f);
  const nextId = typeof evaluated === 'string' ? evaluated : evaluated?.id ?? null;
  let firstUnlock = false;
  if (nextId) {
    f.keepsake = nextId;
    ensureDialogueState(f);
    const flag = `keepsake_unlocked_${nextId}`;
    if (prev !== nextId && !f.dialogue.loreFlags.includes(flag)) {
      firstUnlock = true;
      f.dialogue.loreFlags.push(flag);
      const kDef = LORE_KEEPSAKES?.[nextId];
      const kName = kDef?.name ?? nextId;
      if (nextId === 'fathersEdge' && run.plot && !run.plot.ended) {
        run.plot.trust = clamp((run.plot.trust ?? 0) + 1, 0, 10);
      }
      chronicle(run, f, `Found peace in their quarters: unlocked ${kName}.`);
      log(run, `✦ Lore Keepsake unlocked in ${f.name}'s quarters: ${kName}!`, 'good');
      queueMilestone(run, f, { id: `room_decor_placed_${placedItem || nextId}`, priority: 65, ctx: { item: placedItem, keepsake: nextId, keepsakeUnlocked: true } });
    }
  } else if (f.keepsake) {
    delete f.keepsake;
  }
  if (placedItem && !firstUnlock) {
    const disliked = dislikedDecorItems(f).includes(placedItem);
    if (disliked) {
      log(run, `${f.name} resents having a ${DECOR[placedItem].name} in their quarters.`, 'warn');
    }
    queueMilestone(run, f, { id: `room_decor_placed_${placedItem}`, priority: disliked ? 64 : 54, ctx: { item: placedItem, disliked, keepsake: null, keepsakeUnlocked: false } });
  }
  return f.keepsake ?? null;
}

export function buyDecorBlocker(run, item) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!Object.hasOwn(DECOR, item)) return 'Unknown decor item.';
  if (run.gold < DECOR[item].price) return `Needs ${DECOR[item].price} Gold.`;
  return null;
}

export function buyDecor(run, item) {
  assertOk(buyDecorBlocker(run, item));
  run.gold -= DECOR[item].price;
  run.inventory.decor[item] += 1;
}

export function assignDecorBlocker(run, id, item, slot = null) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!Object.hasOwn(DECOR, item)) return 'Unknown decor item.';
  if (!run.inventory.decor[item]) return `No ${DECOR[item].name} in the storeroom. Buy one first.`;
  if (f.decor[item] >= decorCap(run)) return `Quarters fit ${decorCap(run)} of each item. Upgrade Fighter Quarters for more.`;
  if (slot) {
    const s = roomSlotById(slot);
    if (!s) return 'Unknown room anchor.';
    if (s.zone !== decorZoneOf(item)) return `${DECOR[item].name} belongs on a ${decorZoneOf(item)} anchor.`;
  }
  return null;
}

function placeInRoomLayout(f, item, preferredSlot = null) {
  const layout = ensureRoomLayout(f);
  if (preferredSlot) {
    const s = roomSlotById(preferredSlot);
    if (s && s.zone === decorZoneOf(item)) {
      const occupant = Object.entries(layout).find(([k, sid]) => sid === preferredSlot && k !== item)?.[0];
      if (!occupant) {
        layout[item] = preferredSlot;
        f.roomLayout = layout;
        return;
      }
    }
  }
  ensureRoomLayout(f);
}

export function assignDecor(run, id, item, slot = null) {
  assertOk(assignDecorBlocker(run, id, item, slot));
  const f = findFighter(run, id);
  run.inventory.decor[item] -= 1;
  f.decor[item] += 1;
  placeInRoomLayout(f, item, slot);
  syncDrift(f);
  checkKeepsakes(run, f, item);
}

export function buyAndAssignDecorBlocker(run, id, item, slot = null) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!Object.hasOwn(DECOR, item)) return 'Unknown decor item.';
  if (f.decor[item] >= decorCap(run)) return `Quarters fit ${decorCap(run)} of each item. Upgrade Fighter Quarters for more.`;
  if (slot) {
    const s = roomSlotById(slot);
    if (!s) return 'Unknown room anchor.';
    if (s.zone !== decorZoneOf(item)) return `${DECOR[item].name} belongs on a ${decorZoneOf(item)} anchor.`;
  }
  if (!run.inventory.decor[item] && run.gold < DECOR[item].price) return `Needs ${DECOR[item].price} Gold.`;
  return null;
}

export function buyAndAssignDecor(run, id, item, slot = null) {
  assertOk(buyAndAssignDecorBlocker(run, id, item, slot));
  if (!run.inventory.decor[item]) buyDecor(run, item);
  assignDecor(run, id, item, slot);
}

export function moveDecorBlocker(run, id, item, slot) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!Object.hasOwn(DECOR, item) || !(f.decor?.[item] > 0)) return 'That decor item is not in their room.';
  const s = roomSlotById(slot);
  if (!s) return 'Unknown room anchor.';
  if (s.zone !== decorZoneOf(item)) return `${DECOR[item].name} belongs on a ${decorZoneOf(item)} anchor.`;
  return null;
}

export function moveDecorAnchor(run, id, item, slot) {
  assertOk(moveDecorBlocker(run, id, item, slot));
  const f = findFighter(run, id);
  const layout = ensureRoomLayout(f);
  const oldSlot = layout[item];
  const occupant = Object.entries(layout).find(([k, sid]) => sid === slot && k !== item)?.[0];
  if (occupant && oldSlot) layout[occupant] = oldSlot;
  layout[item] = slot;
  f.roomLayout = layout;
  checkKeepsakes(run, f);
}

export function removeDecorBlocker(run, id, item) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!Object.hasOwn(DECOR, item) || !f.decor[item]) return 'Nothing to remove.';
  return null;
}

export function removeDecor(run, id, item) {
  assertOk(removeDecorBlocker(run, id, item));
  const f = findFighter(run, id);
  f.decor[item] -= 1;
  run.inventory.decor[item] += 1;
  if (f.decor[item] <= 0 && f.roomLayout) {
    delete f.roomLayout[item];
    if (!Object.keys(f.roomLayout).length) delete f.roomLayout;
  }
  syncDrift(f);
  checkKeepsakes(run, f);
}

export function buyGearBlocker(run, index) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const key = run.armourerStock[index];
  if (!key) return 'Not in stock.';
  if (run.gold < GEAR[key].price) return `Needs ${GEAR[key].price} Gold.`;
  return null;
}

export function buyGear(run, index) {
  assertOk(buyGearBlocker(run, index));
  const [key] = run.armourerStock.splice(index, 1);
  run.gold -= GEAR[key].price;
  run.inventory.gear.push(key);
  return key;
}

export function equipBlocker(run, id, index) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!findFighter(run, id)) return 'No such fighter.';
  if (!run.inventory.gear[index]) return 'No such item in the storeroom.';
  return null;
}

export function equip(run, id, index) {
  assertOk(equipBlocker(run, id, index));
  const f = findFighter(run, id);
  const [key] = run.inventory.gear.splice(index, 1);
  const slot = GEAR[key].slot;
  if (f.gear[slot]) run.inventory.gear.push(f.gear[slot]);
  f.gear[slot] = key;
}

export const sellPrice = (key) => Math.floor(GEAR[key].price / 2);

export function sellGearBlocker(run, index) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!run.inventory.gear[index]) return 'No such item in the storeroom.';
  return null;
}

export function sellGear(run, index) {
  assertOk(sellGearBlocker(run, index));
  const [key] = run.inventory.gear.splice(index, 1);
  run.gold += sellPrice(key);
  log(run, `Sold a ${GEAR[key].name} for ${sellPrice(key)} Gold.`);
  return sellPrice(key);
}

export function unequipBlocker(run, id, slot) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!f.gear[slot]) return 'Nothing equipped.';
  return null;
}

export function unequip(run, id, slot) {
  assertOk(unequipBlocker(run, id, slot));
  const f = findFighter(run, id);
  run.inventory.gear.push(f.gear[slot]);
  f.gear[slot] = null;
}

export function unequipAllBlocker(run) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!run.roster.some((f) => f.gear.weapon || f.gear.armor)) return 'Nobody has gear equipped.';
  return null;
}

export function unequipAll(run) {
  assertOk(unequipAllBlocker(run));
  const off = [];
  for (const f of run.roster) for (const slot of ['weapon', 'armor']) if (f.gear[slot]) { off.push(`${f.name}'s ${GEAR[f.gear[slot]].name}`); unequip(run, f.id, slot); }
  log(run, `Back to the storeroom: ${off.join(', ')}.`, 'info');
}

export function buyItemBlocker(run, key) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!Object.hasOwn(CONSUMABLES, key)) return 'Unknown item.';
  if (run.gold < CONSUMABLES[key].price) return `Needs ${CONSUMABLES[key].price} Gold.`;
  return null;
}

export function buyItem(run, key) {
  assertOk(buyItemBlocker(run, key));
  run.gold -= CONSUMABLES[key].price;
  run.inventory.items[key] = (run.inventory.items[key] ?? 0) + 1;
}

// ---------- Surgeon, augments, retirement, renaming ----------

export const surgeonPrice = (run) => ECONOMY.surgeonCost + ECONOMY.surgeonPerTier * (Math.min(run.topTier, CIRCUITS.length) - 1);

export function surgeonBlocker(run, id, index) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!f.injuries[index]) return 'No such injury.';
  if (run.gold < surgeonPrice(run)) return `The Emergency Surgeon needs ${surgeonPrice(run)} Gold.`;
  return null;
}

export function surgeon(run, id, index) {
  assertOk(surgeonBlocker(run, id, index));
  const f = findFighter(run, id);
  f.injuries.splice(index, 1);
  run.gold -= surgeonPrice(run);
  clearHealedMedbay(run, f);
}

export function treatFirstBlocker(run, id, index) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!f.injuries[index]) return 'No such injury.';
  return null;
}

export function treatFirst(run, id, index) {
  assertOk(treatFirstBlocker(run, id, index));
  const f = findFighter(run, id);
  const [inj] = f.injuries.splice(index, 1);
  f.injuries.unshift(inj);
  clearHealedMedbay(run, f);
}

export const augmentPrice = (run) => SURGERY.cost + SURGERY.perTier * (Math.min(run.topTier, 4) - 1);
const augmentFor = (tag) => Object.keys(AUGMENTS).find((k) => AUGMENTS[k].from === tag);

export function augmentBlocker(run, id, index) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  const inj = f.injuries[index];
  if (!inj || !augmentFor(inj.tag)) return 'Only a Maimed or Blinded wound can be replaced.';
  if (maxLevel(run, 'medbay') < SURGERY.medbay) return `Cyborg surgery needs a Medbay level ${SURGERY.medbay}.`;
  if (f.augments?.includes(augmentFor(inj.tag))) return `${f.name} already has a ${AUGMENTS[augmentFor(inj.tag)].name}.`;
  if (run.gold < augmentPrice(run)) return `Needs ${augmentPrice(run)} Gold.`;
  return null;
}

export function augment(run, id, index) {
  assertOk(augmentBlocker(run, id, index));
  const f = findFighter(run, id);
  const [inj] = f.injuries.splice(index, 1);
  const key = augmentFor(inj.tag);
  run.gold -= augmentPrice(run);
  f.augments = [...(f.augments ?? []), key];
  f.renown = Math.max(0, f.renown + SURGERY.renown);
  clearHealedMedbay(run, f);
  chronicle(run, f, `Rebuilt with a ${AUGMENTS[key].name}.`);
  log(run, `${f.name} wakes with a ${AUGMENTS[key].name}. The crowd mutters about machines.`, 'event');
}

export function retireBlocker(run, id) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (f.companion || f.coreId) return `${f.name} is one of your core companions and stays with the house until the Grand Tournament.`;
  const inBracket = isInActiveBracket(run, id);
  if (inBracket) return `${f.name} is mid-bracket in ${arenaName(inBracket.tier)}: finish the bracket or withdraw first.`;
  if (f.returned && winsOf(run, f) < 1) return 'A returning legend must win at least one bout before retiring again.';
  if (f.level < RETIRE.level && !f.titles?.length) return `Only veterans retire: level ${RETIRE.level} or a Title.`;
  return null;
}

export function retire(run, id) {
  assertOk(retireBlocker(run, id));
  const f = findFighter(run, id);
  chronicle(run, f, 'Retired to the Hall of Champions.');
  if (f.want?.id === 'retire') talk(run, `want-done-${f.id}-${f.want.since}`, [{ speaker: 'fighter', fighterId: f.id, text: WANTS.retire.thanks(f.want) }]);
  removeFighter(run, f);
  addPrestige(run, RETIRE.prestige);
  for (const x of run.roster) bumpMorale(run, x, RETIRE.morale);
  const legend = { name: f.name, kind: f.kind, humor: f.humor, id: f.id, cls: f.cls, power: f.power, titles: f.titles, kills: f.kills ?? 0, renown: f.renown, level: f.level, wins: winsOf(run, f), story: f.story, seed: run.seed, ...(f.returned ? { returned: f.returned, carried: f.carried } : {}) };
  run.retired = [...(run.retired ?? []), legend];
  log(run, `${f.name} retires to the Hall of Champions. +${RETIRE.prestige} Prestige, and the roster takes heart.`, 'good');
  return legend;
}

const renameRng = (run) => (run.rng.rename ??= createRng(deriveSeed(run.seed, 14)));

export function renameBlocker(run, id, name) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (f.companion && f.coreId) return `${f.name} refuses to answer to another name.`;
  if (name === undefined) return null;
  const n = cleanName(name);
  if (!n) return "A name can't be empty.";
  if (n.length > RENAME.maxLength) return `A name is at most ${RENAME.maxLength} characters.`;
  if (n === f.name) return `${f.name} already has that name.`;
  if (takenNames(run).some((x) => x.toLowerCase() === n.toLowerCase())) return `Someone is already called ${n}.`;
  return null;
}

export function rename(run, id, name) {
  assertOk(renameBlocker(run, id, name ?? ''));
  const f = findFighter(run, id);
  const old = f.name;
  const clean = cleanName(name);
  f.name = clean;
  for (const partner of [...run.roster, ...(run.fallen ?? [])]) {
    if (partner.bond?.id === f.id) partner.bond.name = clean;
  }
  chronicle(run, f, `Renamed: once called ${old}.`);
  const resents = next(renameRng(run)) < RENAME.chance;
  if (resents) f.mood = { n: (f.mood?.n ?? 0) + RENAME.morale, weeks: MOOD_WEEKS };
  log(run, resents ? `${old} is now ${f.name}, and resents it: −${-RENAME.morale} Morale for ${MOOD_WEEKS} weeks.` : `${old} is now ${f.name}, and takes it well.`, resents ? 'bad' : 'good');
  return resents;
}

