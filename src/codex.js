// The Codex: an unlockable glossary that persists across careers. Pure.
// Rules entries unlock the first time you see something; lore unlocks when you defeat it.

import { KINDS, TRAITS, CLASSES, WEAPONS, INJURIES, BOSS_DEBUFFS, BUILDINGS, DECOR, HEAL_WEEKS, STRESS } from './data.js';
import { oracleLevel } from './ludus.js';
import { currentBout } from './run.js';

export const SECTIONS = {
  basics: 'Basics',
  kind: 'Kinds',
  trait: 'Kind traits',
  class: 'Classes',
  weapon: 'Weapon specialties',
  injury: 'Injuries',
  debuff: 'Arena rules',
  building: 'Buildings',
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
  ['speed', 'Speed', 'Decides who strikes first each round (Speed + a d6 roll). The first striker gets +10% to win the round and rolls to injure before the other can hit back. Speed trains at +2 a week.'],
  ['rounds', 'Rounds and matches', 'A match is best of 3 rounds. Each round: strike order, then Power, then trait bonuses, then a roll for the round winner, then each fighter tries to injure the other.'],
  ['deathGate', 'The Death Gate', 'A fighter with fewer than 2 injuries can never die. At 2 or more (Poisoned counts as 2), losing a round and being hit can be fatal. Throw in the towel between rounds to guarantee survival.'],
  ['towel', 'Throwing in the towel', 'Between rounds you can forfeit the match. You lose the buy-in and the match, but your fighter is guaranteed to survive.'],
  ['stress', 'Stress', `Training (+${STRESS.train}) and fighting (+${STRESS.fight}) raise it; rest (${STRESS.rest}) lowers it. At ${STRESS.overtrained}+ a fighter is overtrained: no training, and −1 Power with one ability lost in the arena.`],
  ['armor', 'Armor', 'Alloyed Skin and Ego Armour lower your chance to be injured. Gun (rounds 1 and 3) and Flail ignore armor.'],
  ['prestige', 'Prestige and House level', "Your house's reputation. Staked as tournament buy-ins and won back with interest. Reaching 10 / 25 / 50 / 90 raises your House level for good, unlocking room plots and buildings."],
  ['strikes', 'Imperial Strikes', 'Every Boss you lose or forfeit is a Strike. Three Strikes and the Emperor has you executed.'],
  ['decor', 'Room decor', `Items for a fighter's quarters. ${Object.values(DECOR).map((d) => `${d.name}: ${d.effect}`).join(' ')} Other fighters get nothing from decor yet.`],
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
  if (cat === 'building') {
    const b = BUILDINGS[id];
    return `${b.effect(b.per[0])} at level 1, up to: ${b.effect(b.per.at(-1))}. Build cost ${b.cost[0]} Gold.${b.unique ? ' One per estate.' : ''}`;
  }
  return '';
}

const nameOf = (cat, id) => ({ kind: KINDS, trait: TRAITS, class: CLASSES, weapon: WEAPONS, debuff: BOSS_DEBUFFS, building: BUILDINGS })[cat]?.[id]?.name
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
  for (const f of [...run.market, ...run.roster, ...run.fallen, run.opponent, run.liaisonOffer].filter(Boolean)) {
    keys.push(...fighterKeys(f));
    for (const i of f.injuries) keys.push(`injury:${i.tag}`);
  }
  for (const [id, b] of Object.entries(BUILDINGS)) if (run.prestigeLevel >= b.req[0]) keys.push(`building:${id}`);
  if (run.debuff && (currentBout(run).boss || oracleLevel(run) >= 2)) keys.push(`debuff:${run.debuff}`);
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
