// L3b monthly Fortune draft, relics, boons, returning Hall legends, and Fates' Wager.

import { createRng, deriveSeed, next, pick } from '../rng.js';
import { KINDS, CLASSES, CIRCUITS, GEAR, CONSUMABLES, FORTUNE } from '../data.js';
import { RELICS, BOONS, hasRelic, relicSum, tagCount, fortuneTitle, fortuneText } from '../fortune.js';
import { isWinter } from '../calendar.js';
import { rosterCap } from '../ludus.js';
import {
  WEAPON_IDS, createFighter, newId, remember, takenNames, clamp, clampStress, log, findFighter,
  chronicle, assertOk, effectivePower, trainGain, hasDecree, hasUnlock, tierMarketPower,
  gainXp, idleBlocker, addPrestige, clearHealedMedbay, changeFavor,
} from './helpers.js';
import { joinPlot } from './plotEngine.js';
import { season } from './roster.js';

const fortuneRng = (run) => (run.rng.fortune ??= createRng(deriveSeed(run.seed, 13)));
const fortuneTier = (run) => Math.min(run.topTier, CIRCUITS.length);

export function weighted(rng, weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  let roll = next(rng) * entries.reduce((s, [, w]) => s + w, 0);
  for (const [k, w] of entries) if ((roll -= w) < 0) return k;
  return entries.at(-1)?.[0] ?? null;
}

export function pickOf(rng, ids, rarityOf, rarity, taken) {
  const free = ids.filter((id) => !taken.includes(id));
  const same = free.filter((id) => rarityOf(id) === rarity);
  return (same.length ? pick(rng, same) : free.length ? pick(rng, free) : null);
}

export function keepUp(run, f, rarity) {
  const ranked = run.roster.map(effectivePower).sort((a, b) => b - a);
  const second = ranked[1] ?? ranked[0];
  if (second === undefined) return;
  const floor = second - FORTUNE.fighterBehind + FORTUNE.fighterPower[rarity];
  const gap = floor - effectivePower(f);
  if (gap <= 0) return;
  f.power += gap;
  f.trainedPower = (f.trainedPower ?? 0) + gap;
  f.trained = (f.trained ?? 0) + Math.ceil(gap / trainGain(run, 'power'));
}

export const relicInPool = (run, id) => !RELICS[id].locked || hasUnlock(run, `relic:${id}`);
export const fortuneCards = (run) => FORTUNE.cards + (hasUnlock(run, 'fourCards') ? 1 : 0) - (hasDecree(run, 'leanFortune') ? 1 : 0);
export const legendKey = (l) => `legend:${l.seed}:${l.id}`;
export const returningLegends = (run) => (hasUnlock(run, 'legends') ? run.setup.legends ?? [] : [])
  .filter((l) => ![...run.roster, ...run.fallen, ...(run.retired ?? [])].some((f) => f.returned === legendKey(l)));

export function fortuneCard(run, rng, table) {
  const rarity = weighted(rng, FORTUNE.rarity);
  const kinds = { ...FORTUNE.kinds };
  const taken = table.map((c) => c.id);
  if (run.roster.length >= rosterCap(run)) kinds.fighter = 0;
  if (isWinter(run.week) || run.wager || table.some((c) => c.kind === 'wager')) kinds.wager = 0;
  const legends = returningLegends(run).filter((l) => !table.some((c) => c.id === legendKey(l)));
  if (!legends.length || run.roster.length >= rosterCap(run)) kinds.legend = 0;
  for (const k of Object.keys(kinds)) if (table.filter((c) => c.kind === k).length >= 2) kinds[k] = 0;
  const kind = weighted(rng, kinds);
  const tier = fortuneTier(run);
  if (kind === 'relic') {
    const id = pickOf(rng, Object.keys(RELICS).filter((r) => !run.relics.includes(r) && relicInPool(run, r)), (r) => RELICS[r].rarity, rarity, taken);
    if (id) return { kind, id, rarity: RELICS[id].rarity };
  }
  if (kind === 'gear') {
    const gearTier = clamp(tier - 2 + ['common', 'rare', 'legendary'].indexOf(rarity), 1, 3);
    const id = pickOf(rng, Object.keys(GEAR).filter((g) => GEAR[g].tier === gearTier), () => rarity, rarity, taken);
    if (id) return { kind, id, rarity: ['common', 'rare', 'legendary'][gearTier - 1] };
  }
  if (kind === 'fighter') {
    const f = createFighter(rng, { id: newId(run, 'f'), bonusPower: tierMarketPower(run) + FORTUNE.fighterPower[rarity], takenNames: takenNames(run, table.map((c) => c.fighter).filter(Boolean)), classes: run.setup?.classes });
    season(run, rng, f);
    if (rarity === 'legendary') Object.assign(f, { legend: true, renown: FORTUNE.legendRenown, origin: 'A legend of the arena' });
    keepUp(run, f, rarity);
    remember(run, f);
    return { kind, id: f.id, rarity, fighter: f };
  }
  if (kind === 'legend') {
    const l = pick(rng, legends);
    const f = createFighter(rng, { id: newId(run, 'f'), kind: KINDS[l.kind] ? l.kind : undefined, bonusPower: tierMarketPower(run) + FORTUNE.fighterPower.legendary, classes: run.setup?.classes });
    season(run, rng, f);
    Object.assign(f, { name: l.name, humor: l.humor ?? f.humor, titles: [...(l.titles ?? [])], kills: l.kills ?? 0, renown: Math.max(l.renown ?? 0, FORTUNE.legendRenown), legend: true, returned: legendKey(l), carried: { kills: l.kills ?? 0, titles: l.titles?.length ?? 0 }, origin: 'Returned from the Hall of Champions' });
    if (CLASSES[l.cls]) Object.assign(f, { cls: l.cls, weapon: l.cls === 'fighter' ? f.weapon ?? pick(rng, WEAPON_IDS) : null });
    keepUp(run, f, 'legendary');
    return { kind, id: legendKey(l), rarity: 'legendary', fighter: f, wins: l.wins ?? 0 };
  }
  if (kind === 'wager') {
    const w = FORTUNE.wager;
    return { kind, id: 'wager', rarity: 'rare', tier: run.topTier, winGold: w.winGoldPerTier * tier, winRenown: w.winRenown, lossGold: w.lossGoldPerTier * tier };
  }
  const hurt = run.roster.some((f) => f.injuries.length);
  const id = pickOf(rng, Object.keys(BOONS).filter((b) => BOONS[b].needs !== 'hurt' || hurt), (b) => BOONS[b].rarity, rarity, taken) ?? 'gold';
  const b = BOONS[id];
  const card = { kind: 'boon', id, rarity: b.rarity };
  if (b.gold) card.gold = b.gold + b.goldPerTier * tier;
  if (b.prestige) card.prestige = b.prestige + b.prestigePerTier * tier;
  if (b.items) card.items = Array.from({ length: b.items }, () => pick(rng, Object.keys(CONSUMABLES)));
  if (b.one) {
    const f = pick(rng, run.roster);
    if (!f) return { kind: 'boon', id: 'gold', rarity: 'common', gold: BOONS.gold.gold + BOONS.gold.goldPerTier * tier };
    Object.assign(card, { fighterId: f.id, name: f.name });
  }
  return card;
}

export function drawFortune(run) {
  const rng = fortuneRng(run);
  const cards = [];
  for (let i = 0; i < fortuneCards(run); i++) cards.push(fortuneCard(run, rng, cards));
  return cards;
}

export function fortuneMonth(run) {
  const purse = relicSum(run, 'monthGold');
  if (purse) {
    run.gold += purse;
    log(run, `${RELICS.purse.name}: +${purse} Gold.`, 'good');
  }
  if (!FORTUNE.enabled || run.week < FORTUNE.fromWeek || run.status !== 'active') return;
  run.fortune = { cards: drawFortune(run), rerolls: 0 };
}

export const rerollPrice = (run) => FORTUNE.reroll[Math.min(run.fortune?.rerolls ?? 0, FORTUNE.reroll.length - 1)];

export function fortuneBlocker(run, index, drop = null) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const card = run.fortune?.cards[index];
  if (!card) return 'No Fortune card there.';
  if ((card.kind === 'fighter' || card.kind === 'legend') && run.roster.length >= rosterCap(run)) return `Your quarters are full (${rosterCap(run)} fighters).`;
  if (card.kind === 'relic' && run.relics.length >= FORTUNE.maxRelics && !run.relics.includes(drop)) return `The house holds ${FORTUNE.maxRelics} relics: choose one to lay down for it.`;
  if (card.fighterId && !findFighter(run, card.fighterId)) return `${card.name} is no longer in the house.`;
  return null;
}

export function chooseFortune(run, index, drop = null) {
  assertOk(fortuneBlocker(run, index, drop));
  const card = run.fortune.cards[index];
  run.fortune = null;
  const title = fortuneTitle(card);
  if (card.kind === 'relic') {
    if (run.relics.length >= FORTUNE.maxRelics) {
      run.relics = run.relics.filter((id) => id !== drop);
      log(run, `Fortune: ${RELICS[drop].name} is laid down.`);
    }
    run.relics.push(card.id);
    log(run, `Fortune: ${title} joins the house's relics. ${RELICS[card.id].desc}`, 'good');
  } else if (card.kind === 'gear') {
    run.inventory.gear.push(card.id);
    log(run, `Fortune: ${/^[AEIOU]/i.test(title) ? 'an' : 'a'} ${title} for the storeroom.`, 'good');
  } else if (card.kind === 'fighter' || card.kind === 'legend') {
    const f = card.fighter;
    run.roster.push(f);
    remember(run, f);
    if (f.returned) {
      chronicle(run, f, 'Came back from the Hall of Champions for one last season.');
      log(run, `Fortune: ${f.name} returns from the Hall of Champions to fight for your house one last season.`, 'good');
    } else {
      chronicle(run, f, f.legend ? 'Came to the Ludus by Fortune: a legend of the arena.' : 'Came to the Ludus by Fortune.');
      log(run, `Fortune: ${f.name} joins the Ludus${f.legend ? ', a legend of the arena' : ''}.`, 'good');
    }
    joinPlot(run, f);
  } else if (card.kind === 'wager') {
    run.wager = { winGold: card.winGold, winRenown: card.winRenown, lossGold: card.lossGold };
    log(run, `Fortune: the Fates' wager is made. Win this month's top-arena tournament: +${card.winGold} Gold and +${card.winRenown} Renown. Lose or skip it: −${card.lossGold} Gold.`, 'event');
  } else applyBoon(run, card, title);
  return card;
}

export function applyBoon(run, card, title) {
  const b = BOONS[card.id];
  if (card.gold) run.gold += card.gold;
  if (card.prestige) addPrestige(run, card.prestige);
  if (b.favor) changeFavor(run, b.favor, title);
  for (const k of card.items ?? []) run.inventory.items[k] += 1;
  for (const f of run.roster) {
    if (b.one && f.id !== card.fighterId) continue;
    if (b.stress) f.stress = clampStress(f.stress + b.stress);
    if (b.power) f.power += b.power;
    if (b.heal) {
      for (const inj of f.injuries) inj.weeksLeft -= b.heal;
      f.injuries = f.injuries.filter((i) => i.weeksLeft > 0);
      clearHealedMedbay(run, f);
    }
  }
  for (const f of run.roster) if (b.xp) gainXp(run, f, b.xp);
  log(run, `Fortune: ${title}. ${fortuneText(card)}`, 'good');
}

export function rerollBlocker(run) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!run.fortune) return 'No Fortune to reroll.';
  if (run.fortune.augur) return "The Augur's gift can't be re-spun.";
  if (run.gold < rerollPrice(run)) return `Needs ${rerollPrice(run)} Gold.`;
  return null;
}

export function rerollFortune(run) {
  assertOk(rerollBlocker(run));
  run.gold -= rerollPrice(run);
  run.fortune = { cards: drawFortune(run), rerolls: run.fortune.rerolls + 1 };
}

export function passFortune(run) {
  assertOk(idleBlocker(run) ?? (run.fortune ? null : 'No Fortune to pass.'));
  run.fortune = null;
  run.gold += FORTUNE.pass;
  log(run, `You let Fortune pass: +${FORTUNE.pass} Gold.`);
}

export function relicRewards(run, fighter, won, summary) {
  if (!won) return;
  summary.prestige += relicSum(run, 'winPrestige');
  if (summary.kill) summary.renown += relicSum(run, 'killRenown');
  if (hasRelic(run, 'mask')) summary.renown += RELICS.mask.tagRenown * tagCount(fighter, 'showman');
}

export function settleWager(run, won, summary) {
  if (!won) return loseWager(run, 'the top-arena tournament was lost', summary);
  const w = run.wager;
  delete run.wager;
  summary.gold += w.winGold;
  summary.renown += w.winRenown;
  summary.wager = { won: true, gold: w.winGold, renown: w.winRenown };
  log(run, `The Fates pay: +${w.winGold} Gold and +${w.winRenown} Renown.`, 'good');
}

export function loseWager(run, why, summary = null) {
  const owed = run.wager.lossGold;
  const loss = Math.min(run.gold, owed);
  const shortfall = owed - loss;
  delete run.wager;
  run.gold -= loss;
  let favorLoss = 0;
  if (shortfall > 0) {
    favorLoss = -Math.ceil(shortfall / 2);
    changeFavor(run, favorLoss, "unpaid Fates' Wager");
  }
  if (summary) summary.wager = { won: false, gold: -loss, ...(favorLoss ? { favor: favorLoss } : {}) };
  log(run, `The Fates collect: −${loss} Gold${favorLoss ? ` and ${favorLoss} Favour` : ''} (${why}).`, 'bad');
}
