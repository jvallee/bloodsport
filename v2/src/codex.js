// The Codex: an unlockable glossary that persists across careers. Pure.
// Rules entries unlock the first time you see something; lore unlocks when you defeat it.

import { KINDS, TRAITS, CLASSES, WEAPONS, INJURIES, BOSS_DEBUFFS, BUILDINGS, DECOR, HEAL_WEEKS, STRESS, PERKS, GEAR, TRIBUTE, FAVOR, BLOODIED, KILL_MARKS } from './data.js';
import { oracleLevel } from './ludus.js';
import { boutFor, unlockedTiers } from './run.js';

export const SECTIONS = {
  basics: 'Basics',
  kind: 'Kinds',
  trait: 'Kind traits',
  class: 'Classes',
  weapon: 'Weapon specialties',
  injury: 'Injuries',
  debuff: 'Arena rules',
  building: 'Buildings',
  perk: 'Perks',
  gear: 'Gear',
};

const LORE = {
  'kind:human': "Earth's most stubborn export. Battleworld's portals snatch humans from every century (legionaries, pit fighters, the occasional baffled accountant), and the angriest of them thrive.",
  'kind:android': "War machines built for conflicts that ended long ago, salvaged by the Emperor's engineers. They learn from every round they lose, and some never stop running.",
  'kind:elf': 'Taken from a dying forest-world, elves fight like duelists at a court dance: light on their feet, proud, and insufferable while untouched.',
  'kind:orc': "Orc clans believe a death in the arena feeds their ancestors. Their blood-priests make sure a fallen orc's house still profits from the sacrifice.",
  'class:cestus': 'Boxers in iron-studded gloves called cestus. They start slow and hit harder every round; even the Romans thought them the most brutal of the arena specialists.',
  'class:sagittarius': 'Archers. In old Rome, sagittarii were auxiliaries from the eastern provinces; on Battleworld they open every exchange with a volley, gambling on a quick lead or a crippling wound.',
  'class:ornitharius': 'Bird-handlers who fight beside hawks and ravens kept in their quarters. The birds smell blood: once their master is hurt, they go for the eyes.',
  'class:fighter': 'Weapon masters with no single tradition, just a favorite tool and a lifetime of practice with it.',
  'weapon:club': 'Crude, heavy and humiliating. A good hit leaves a champion face-down in the sand.',
  'weapon:fists': "A fist-fighter has no weapon to lose. Their specialty is taking yours away.",
  'weapon:bow': 'Range wins the opening exchanges, before a melee fighter can close the gap.',
  'weapon:spear': 'The oldest reach advantage in the world. Spearmen strike first and keep archers honest.',
  'weapon:sword': 'The gladius: short, quick, and as good at turning a blow aside as dealing one.',
  'weapon:flail': 'A ball and chain that wraps around shields and laughs at armor.',
  'weapon:gun': 'Contraband from another century. Loud, armor-piercing, and slow to reload.',
};

const BASICS = [
  ['power', 'Power', 'Decides who wins each round. What matters is the difference (Delta): +1 gives 55%, +3 gives 70%, +5 gives 95% per round. Being out-powered also makes injuries worse.'],
  ['speed', 'Speed', 'Decides who strikes first each round (Speed + a d6 roll). The first striker gets +10% to win the round and rolls to injure before the other can hit back. Speed trains at +3 a week, and every point faster than your opponent is −4% to be injured (up to −20%).'],
  ['rounds', 'Rounds and matches', 'A match is best of 3 rounds. Each round: strike order (Speed + a die), then Power, then trait bonuses, then a roll for the round winner. Then BOTH fighters try to injure each other, whoever won: the round loser is much easier to hurt (25% vs 10% at even Power, more as the gap grows), and the first striker swings first.'],
  ['champions', 'Championships', 'A fighter becomes Champion of an arena by beating its Boss or winning 3 matches there (+1 Power, one Title per arena). Champions are too famous for lower arenas: a Champion who fights back in one earns no Prestige or Renown, loses Morale, and costs a little Favor. Rookies (under 5 Renown) are never jeered.'],
  ['deathGate', 'The Death Gate', 'A fighter with fewer than 2 injuries can never die (3 for an Unbreakable Orc). At 2 or more (Poisoned counts as 2), losing a round and being hit can be fatal. Capitulate between rounds to guarantee survival.'],
  ['bloodied', 'Bloodied Victory', `Winning a match with 2+ injuries is a Bloodied Victory: the crowd loves it. +${FAVOR.spectacleWin} Favor, +${BLOODIED.renown} Renown, +${BLOODIED.xp} XP and +${BLOODIED.morale} Morale on top of the usual win.`],
  ['kills', 'Kills and marks', `Fighters keep a tally of opponents they kill. ${KILL_MARKS.map((k) => `${k.at} kills earns the mark ${k.name} (${k.desc})`).join('; ')}.`],
  ['towel', 'Capitulating', 'Between rounds you can forfeit the match. You lose the buy-in and the match, but your fighter is guaranteed to survive.'],
  ['stress', 'Stress', `Training (+${STRESS.train}) and fighting (+${STRESS.fight}) raise it; rest (${STRESS.rest}) lowers it. At ${STRESS.overtrained}+ a fighter is overtrained: no training, and −1 Power with one ability lost in the arena.`],
  ['armor', 'Armor', 'Alloyed Skin and Ego Armour lower your chance to be injured. Gun (rounds 1 and 3) and Flail ignore armor, but not Speed evasion.'],
  ['prestige', 'Prestige and House level', "Your house's reputation. Staked as tournament buy-ins and won back with interest. Reaching 10 / 25 / 50 / 90 raises your House level for good, unlocking room plots and buildings."],
  ['favor', 'Imperial Favor', 'The Emperor\'s opinion of your house (0–100). Boss wins, upsets and Bloodied Victories raise it. Losing or forfeiting a Boss in your top arena, capitulating there, crushing weak opponents in lower arenas, and unpaid tribute lower it. At 0 you are executed.'],
  ['scouted', 'Scouted', 'Opponents study fighters who keep fighting in your top arena. A fighter who fought there last tournament week faces +1 opponent Power there this time. Sit them out of the top arena for a month (lower arenas are fine) and the scouting fades.'],
  ['tribute', 'Tribute', `Each winter the Emperor collects tribute: ${TRIBUTE.perYear} Gold × the year. You can pay early from the week panel. If you can't pay, he takes all your Gold and ${-FAVOR.unpaidTribute} Favor. It only ends the career if Favor reaches 0.`],
  ['arenas', 'Arenas and divisions', 'Every arena you have reached holds a bout each tournament week, and you may send one fighter to each. Your highest arena is your top arena: only its Bosses move you up and only it affects Favor. Lower arenas pay less Prestige, and crushing a much weaker opponent there angers the crowd.'],
  ['growth', 'Levels and perks', 'Fighters earn XP from every match (more for wins, Bosses and upsets). Each level lets you choose 1 of 3 perks: stat boosts, combat edges, or combo perks that need both Power and Speed.'],
  ['renown', 'Renown', 'Fame. Wins (especially Bosses and upsets) raise it; capitulating lowers it. Every 5 Renown adds +1 Gold to a fighter\'s winnings, but famous fighters expect better rooms.'],
  ['morale', 'Morale', 'Drifts each week toward comfort (Quarters level, decor, Entertainment Room) minus expectations (Renown). 80+: Inspired, +5% win chance. Below 40: Restless, won\'t train. Below 20: Mutinous, refuses to fight. A house that stays below 20 on average for 4 weeks revolts.'],
  ['items', 'Fight items', 'Single-use items from the Apothecary (in the Market): War Paint, Adrenaline Draught, Blessed Bandage, Crowd Bribe. Use one before Round 1 or between rounds, at most one per fight. Boosts last the next round only.'],
  ['gear', 'Gear and the storeroom', 'Each fighter has a weapon and an armor slot. Gear and decor belong to the house: buy them, hand them out, take them back. A fallen or released fighter\'s things return to the storeroom. Beaten opponents sometimes drop their gear (Bosses always do). Spare gear sells back for half its price.'],
  ['decor', 'Room decor', `Items for a fighter's quarters. Every item adds comfort (Morale). ${Object.values(DECOR).map((d) => `${d.name}: ${d.effect}`).join(' ')}`],
];

function ruleText(cat, id) {
  if (cat === 'kind') {
    const k = KINDS[id];
    return `Base Power ${k.basePower}. Each ${k.name} has one of these traits: ${k.traits.map((t) => TRAITS[t].name).join(', ')}.`;
  }
  if (cat === 'trait') return TRAITS[id].desc;
  if (cat === 'class') return `${CLASSES[id].ability}: ${CLASSES[id].desc}`;
  if (cat === 'weapon') return `${WEAPONS[id].ability}: ${WEAPONS[id].desc}`;
  if (cat === 'injury') {
    const i = INJURIES.find((x) => x.tag === id);
    return `${i.desc} Injury roll ${i.min}–${i.max}. Heals in ${HEAL_WEEKS[id]} Medbay week${HEAL_WEEKS[id] > 1 ? 's' : ''}.`;
  }
  if (cat === 'debuff') return BOSS_DEBUFFS[id].desc;
  if (cat === 'perk') return `${PERKS[id].desc}${PERKS[id].reqText ? ` Requires ${PERKS[id].reqText}.` : ''}${PERKS[id].repeatable ? ' Can be taken again: it stacks.' : ' Once only: never offered again after you take it.'}`;
  if (cat === 'gear') return `${gearText(GEAR[id])} ${GEAR[id].slot === 'weapon' ? 'Weapon' : 'Armor'}, ${GEAR[id].price} Gold.`;
  if (cat === 'building') {
    const b = BUILDINGS[id];
    return `${b.effect(b.per[0])} at level 1, up to: ${b.effect(b.per.at(-1))}. Build cost ${b.cost[0]} Gold.${b.unique ? ' One per estate.' : ''}`;
  }
  return '';
}

// Plain description of a gear item's effects, e.g. "+1 Power, −10% chance to be injured."
export function gearText(g) {
  const bits = [];
  if (g.power) bits.push(`${g.power > 0 ? '+' : '−'}${Math.abs(g.power)} Power`);
  if (g.speed) bits.push(`${g.speed > 0 ? '+' : '−'}${Math.abs(g.speed)} Speed`);
  if (g.injure) bits.push(`+${g.injure / 1000}% chance to injure`);
  if (g.guard) bits.push(`−${g.guard / 1000}% chance to be injured (armor)`);
  return `${bits.join(', ')}.`;
}

const nameOf = (cat, id) => ({ kind: KINDS, trait: TRAITS, class: CLASSES, weapon: WEAPONS, debuff: BOSS_DEBUFFS, building: BUILDINGS, perk: PERKS, gear: GEAR })[cat]?.[id]?.name
  ?? INJURIES.find((i) => i.tag === id)?.name;

// Every entry, grouped by section. Basics are always unlocked.
export const ENTRIES = [
  ...BASICS.map(([id, name, rules]) => ({ key: `basics:${id}`, cat: 'basics', name, rules, always: true })),
  ...Object.keys(KINDS).map((id) => ({ key: `kind:${id}`, cat: 'kind', id })),
  ...Object.keys(TRAITS).map((id) => ({ key: `trait:${id}`, cat: 'trait', id })),
  ...Object.keys(CLASSES).map((id) => ({ key: `class:${id}`, cat: 'class', id })),
  ...Object.keys(WEAPONS).map((id) => ({ key: `weapon:${id}`, cat: 'weapon', id })),
  ...INJURIES.filter((i) => i.tag !== 'death').map((i) => ({ key: `injury:${i.tag}`, cat: 'injury', id: i.tag })),
  ...Object.keys(BOSS_DEBUFFS).map((id) => ({ key: `debuff:${id}`, cat: 'debuff', id })),
  ...Object.keys(BUILDINGS).map((id) => ({ key: `building:${id}`, cat: 'building', id })),
  ...Object.keys(PERKS).map((id) => ({ key: `perk:${id}`, cat: 'perk', id })),
  ...Object.keys(GEAR).map((id) => ({ key: `gear:${id}`, cat: 'gear', id })),
].map((e) => ({ ...e, name: e.name ?? nameOf(e.cat, e.id), rules: e.rules ?? ruleText(e.cat, e.id), lore: LORE[e.key] ?? null }));

export const createCodex = () => ({ seen: [], lore: [], fresh: [] });

const fighterKeys = (f) => [`kind:${f.kind}`, f.kindTrait && `trait:${f.kindTrait}`, f.cls && `class:${f.cls}`, f.weapon && `weapon:${f.weapon}`].filter(Boolean);

function unlock(codex, list, keys) {
  const added = [];
  for (const k of keys) {
    if (!codex[list].includes(k)) {
      codex[list].push(k);
      if (!codex.fresh.includes(k)) codex.fresh.push(k);
      added.push(k);
    }
  }
  return added;
}

// Everything visible in the career right now. Returns the newly unlocked keys.
export function discover(codex, run) {
  const keys = [];
  const opponents = unlockedTiers(run).map((t) => run.arenas[t].opponent);
  for (const f of [...run.market, ...run.roster, ...run.fallen, ...opponents, run.liaisonOffer].filter(Boolean)) {
    keys.push(...fighterKeys(f));
    for (const i of f.injuries) keys.push(`injury:${i.tag}`);
    for (const p of [...(f.perks ?? []), ...(f.pendingPerks ?? []).flat()]) keys.push(`perk:${p}`);
    for (const g of [f.gear?.weapon, f.gear?.armor]) if (g) keys.push(`gear:${g}`);
  }
  for (const g of [...(run.inventory?.gear ?? []), ...(run.armourerStock ?? [])]) keys.push(`gear:${g}`);
  for (const [id, b] of Object.entries(BUILDINGS)) if (run.prestigeLevel >= b.req[0]) keys.push(`building:${id}`);
  for (const t of unlockedTiers(run)) {
    if (boutFor(run, t).boss || oracleLevel(run) >= 2) keys.push(`debuff:${run.arenas[t].debuff}`);
  }
  for (const [id, b] of Object.entries(BUILDINGS)) if (run.buildings.some((x) => x.type === id)) keys.push(`building:${id}`);
  return unlock(codex, 'seen', keys);
}

// After a match: injuries both fighters took, and lore for whatever you defeated.
export function discoverMatch(codex, match) {
  const keys = [...match.a.f.injuries, ...match.b.f.injuries].map((i) => `injury:${i.tag}`);
  if (match.debuff) keys.push(`debuff:${match.debuff}`);
  const added = unlock(codex, 'seen', [...keys, ...fighterKeys(match.b.f)]);
  if (match.result?.winner === 'A') added.push(...unlock(codex, 'lore', fighterKeys(match.b.f).filter((k) => LORE[k])));
  return added;
}

export const isUnlocked = (codex, entry) => entry.always || codex.seen.includes(entry.key);
export const hasLore = (codex, entry) => codex.lore.includes(entry.key);

export function progress(codex) {
  const total = ENTRIES.filter((e) => !e.always).length + ENTRIES.filter((e) => e.lore).length;
  const found = ENTRIES.filter((e) => !e.always && isUnlocked(codex, e)).length + ENTRIES.filter((e) => e.lore && hasLore(codex, e)).length;
  return { found, total };
}

export function loadCodex(text) {
  try {
    const c = JSON.parse(text);
    if (Array.isArray(c?.seen) && Array.isArray(c?.lore)) return { seen: c.seen, lore: c.lore, fresh: Array.isArray(c.fresh) ? c.fresh : [] };
  } catch { /* fall through */ }
  return createCodex();
}
