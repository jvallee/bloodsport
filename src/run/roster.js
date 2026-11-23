// L2 roster, market, Liaison, Armourer, jobs, morale, perks, Temple, Vulcan, Exhibition, inventory, Surgeon, retirement, and renaming.

import { createRng, deriveSeed, int, next, pick } from '../rng.js';
import {
  ECONOMY, STRESS, HEAL_WEEKS, KINDS, TRAITS, BUILDINGS, CIRCUITS, XP, PERKS, MORALE, GEAR, DECOR,
  CONSUMABLES, AUGMENTS, SURGERY, RETIRE, RENAME, LIAISON, RECRUIT, EXHIBITION, BOND, REANIMATE, FEAR, deltaRow,
} from '../data.js';
import { WANTS, LIAISON_LINES } from '../quests.js';
import { meleeOnly } from '../fight.js';
import { MOOD_WEEKS } from '../events.js';
import {
  rosterCap, trainerRooms, trainCap, trainCost, medbaySlots, decorCap, liaisonLevel, maxLevel, effectAt, build, upgrade,
} from '../ludus.js';
import {
  JOBS, createFighter, newId, remember, takenNames, clamp, log, findFighter, chronicle, bumpMorale,
  isTraining, jobCount, talk, assertOk, decorComfortOf, trainStress, netTrainStress, effectivePower,
  arenaName, trainGain, hasPolicy, tierMarketPower, liaisonOffer, recruitPrice, cleanName, winsOf,
  foughtThisWeek, perkOffer, gainXp, idleBlocker, isInActiveBracket, addPrestige, clearHealedMedbay,
  removeFighter,
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

export function refreshLiaison(run) {
  const lv = liaisonLevel(run);
  run.liaisonOffers = [];
  if (!lv) return;
  const elite = lv >= 2;
  const natural = (kind) => KINDS[kind].basePower + tierMarketPower(run);
  for (let i = 0; i < LIAISON.offers[Math.min(lv, LIAISON.offers.length) - 1]; i++) {
    const f = createFighter(run.rng.market, { id: newId(run, 'f'), takenNames: takenNames(run, run.liaisonOffers), classes: run.setup?.classes });
    f.power = elite ? Math.max(natural(f.kind), currentBout(run).oppPower + LIAISON.elitePower) : natural(f.kind);
    const prior = Math.max(0, f.power - natural(f.kind));
    Object.assign(f, { trained: Math.ceil(prior / trainGain(run, 'power')), trainedPower: prior });
    f.injuries = [{ tag: elite ? 'concussed' : 'fleshWound', weight: 1, weeksLeft: HEAL_WEEKS[elite ? 'concussed' : 'fleshWound'] }];
    f.stress = elite ? 30 : 40;
    f.morale = elite ? 40 : 30;
    season(run, run.rng.market, f);
    f.price = (elite ? LIAISON.elitePrice + LIAISON.elitePerTier * Math.min(run.topTier, CIRCUITS.length) : LIAISON.convictPrice) + RECRUIT.perLevel * (f.level - 1);
    f.origin = elite ? 'Prisoner of war' : 'Condemned convict';
    if (i === 0) markPolitical(run, f);
    else f.record = [];
    run.liaisonOffers.push(f);
  }
  remember(run, ...run.liaisonOffers);
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

export function buildRoom(run, type) {
  const b = build(run, type);
  if (type === 'armourer') refreshArmourer(run);
  if (type === 'liaison') refreshLiaison(run);
  return b;
}

export function upgradeRoom(run, id) {
  return upgrade(run, id);
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
  const comfort = MORALE.perQuartersLevel * maxLevel(run, 'quarters') + decorComfortOf(f) + (bondmate(run, f) ? BOND.comfort : 0) + (hasPolicy(run, 'grainToLudus') ? 5 : 0) + MORALE.perEntertainmentLevel * maxLevel(run, 'entertainment');
  const expects = Math.min(MORALE.maxExpectation, MORALE.expectationPerRenown * f.renown);
  const mood = f.mood?.n ?? 0;
  return { target: clamp(MORALE.base + comfort - expects + mood, 0, 100), comfort, expects, mood };
}

export function moraleState(f) {
  if (f.morale >= MORALE.inspired) return { id: 'inspired', label: 'Inspired', desc: '+5% win chance in every round.' };
  if (f.morale < MORALE.mutinous) return { id: 'mutinous', label: 'Mutinous', desc: 'Refuses to fight. Give them decor, a better room, or wins.' };
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
  sc.faced = (sc.faced ?? 0) + 1;
  if (sc.faced < FEAR.conquerWins) {
    log(run, `${f.name} beat a ${vs} fighter, the kind they fear (${sc.faced}/${FEAR.conquerWins} to conquer it).`, 'event');
    return null;
  }
  f.scars = f.scars.filter((x) => x !== sc);
  chronicle(run, f, `Faced their fear of ${vs} fighters, and beat it.`);
  log(run, `${f.name} has conquered their fear: no longer Afeared of ${vs} fighters.`, 'good');
  return `No longer Afeared (${vs})`;
}

export const ritePrice = (run) => FEAR.ritePrice + FEAR.ritePerTier * Math.min(run.topTier, CIRCUITS.length);

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

// ---------- Unnatural Temple of Vulcan ----------

export const reanimatePrice = (run) => REANIMATE.price + REANIMATE.perTier * Math.min(run.topTier, CIRCUITS.length);
export const raisable = (run) => (!maxLevel(run, 'vulcan') ? [] : run.fallen.filter((f) => (f.arena || f.body) && !f.raised && f.kind !== 'revenant' && run.week - f.diedWeek <= effectAt('vulcan', maxLevel(run, 'vulcan'))));

export function reanimateBlocker(run, id) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!maxLevel(run, 'vulcan')) return 'Build the Unnatural Temple of Vulcan first.';
  const f = run.fallen.find((x) => x.id === id);
  if (!f) return 'No such fallen fighter.';
  if (!f.arena && !f.body) return `${f.name} was executed; the Praetorians burned the body.`;
  if (f.raised || f.kind === 'revenant') return 'Vulcan cannot kindle the same body twice.';
  const keeps = effectAt('vulcan', maxLevel(run, 'vulcan'));
  if (run.week - f.diedWeek > keeps) return `${f.name} has been dead too long (a body keeps ${keeps} weeks${maxLevel(run, 'vulcan') < BUILDINGS.vulcan.per.length ? '; a bigger Temple keeps them longer' : ''}).`;
  if (run.roster.length >= rosterCap(run)) return `Your quarters are full (${rosterCap(run)} fighters).`;
  if (run.gold < reanimatePrice(run)) return `Needs ${reanimatePrice(run)} Gold.`;
  return null;
}

export function reanimate(run, id) {
  assertOk(reanimateBlocker(run, id));
  const body = run.fallen.find((x) => x.id === id);
  body.raised = true;
  run.gold -= reanimatePrice(run);
  const f = structuredClone(body);
  for (const key of ['diedWeek', 'arena', 'raised', 'bond', 'political', 'record', 'mood', 'nemesisOf', 'spy', 'body', 'want', 'resume', 'notice']) delete f[key];
  const lost = maxLevel(run, 'vulcan') >= 2 ? 0 : REANIMATE.power;
  Object.assign(f, {
    id: newId(run, 'f'), kind: 'revenant', kindTrait: pick(run.rng.growth, KINDS.revenant.traits), alive: true, injuries: [],
    stress: 0, job: 'rest', morale: REANIMATE.morale, topStreak: 0, pendingPerks: [], revenantOf: body.id, power: body.power + lost, risen: true,
  });
  run.roster.push(f);
  chronicle(run, f, `Raised from the dead in the Unnatural Temple of Vulcan, ${run.week - body.diedWeek} week${run.week - body.diedWeek === 1 ? '' : 's'} after falling. ${TRAITS[f.kindTrait].name}.`);
  log(run, `The priests of Vulcan work through the night. ${f.name} walks out of the forge: a Revenant, brass where the wounds were${lost ? `, and a little weaker (${lost} Power)` : ''}.`, 'event');
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

// ---------- Inventory: decor, gear, items ----------

export function buyDecorBlocker(run, item) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!DECOR[item]) return 'Unknown decor item.';
  if (run.gold < DECOR[item].price) return `Needs ${DECOR[item].price} Gold.`;
  return null;
}

export function buyDecor(run, item) {
  assertOk(buyDecorBlocker(run, item));
  run.gold -= DECOR[item].price;
  run.inventory.decor[item] += 1;
}

export function assignDecorBlocker(run, id, item) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!DECOR[item]) return 'Unknown decor item.';
  if (!run.inventory.decor[item]) return `No ${DECOR[item].name} in the storeroom. Buy one first.`;
  if (f.decor[item] >= decorCap(run)) return `Quarters fit ${decorCap(run)} of each item. Upgrade Fighter Quarters for more.`;
  return null;
}

export function assignDecor(run, id, item) {
  assertOk(assignDecorBlocker(run, id, item));
  run.inventory.decor[item] -= 1;
  findFighter(run, id).decor[item] += 1;
}

export function removeDecorBlocker(run, id, item) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!f.decor[item]) return 'Nothing to remove.';
  return null;
}

export function removeDecor(run, id, item) {
  assertOk(removeDecorBlocker(run, id, item));
  findFighter(run, id).decor[item] -= 1;
  run.inventory.decor[item] += 1;
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
  if (!CONSUMABLES[key]) return 'Unknown item.';
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
  for (const x of run.roster) bumpMorale(x, RETIRE.morale);
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
  f.name = cleanName(name);
  chronicle(run, f, `Renamed: once called ${old}.`);
  const resents = next(renameRng(run)) < RENAME.chance;
  if (resents) f.mood = { n: (f.mood?.n ?? 0) + RENAME.morale, weeks: MOOD_WEEKS };
  log(run, resents ? `${old} is now ${f.name}, and resents it: −${-RENAME.morale} Morale for ${MOOD_WEEKS} weeks.` : `${old} is now ${f.name}, and takes it well.`, resents ? 'bad' : 'good');
  return resents;
}
