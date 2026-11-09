// Version 6, phase 2: the Fortune draft and relics (docs/plan-v6-one-more-career.md, pillars B and C).
// Every month the house picks one of three Fortune cards: a relic, a boon, a piece of gear, a fighter, or a wager.
// Relics are house-wide trophies (at most FORTUNE.maxRelics) that bend one rule each; some count perk tags, so perks and
// relics build on each other. Pure: tables and small helpers, no dice (run.js draws the cards on its own stream).
// All names and descriptions are PLACEHOLDER (docs/text-to-rewrite.md).

import { PERKS, FORTUNE, GEAR, CONSUMABLES } from './data.js';

// Fight effects: `fight` helps your fighter, `foe` hinders the opponent. Win/injure/guard are in 1/100000 (5000 = 5%).
// `rounds` limits a bonus to some rounds; `when: 'hurt'` to a fighter with an injury; `boss` to Boss fights; `titled` to
// a fighter with a Title. `perTag` counts the fighter's perks with that tag (up to FORTUNE.tagCap).
export const RELICS = {
  whetstone: { name: "Mars's Whetstone", rarity: 'common', desc: '+1 Power in Round 1.', fight: { power: 1, rounds: [1] } },
  knucklebone: { name: 'The Lucky Knucklebone', rarity: 'common', desc: '+5% win chance in Round 3.', fight: { win: 5000, rounds: [3] } },
  aegis: { name: 'The Bronze Aegis', rarity: 'common', desc: '−5% chance to be injured.', fight: { guard: 5000 } },
  purse: { name: "A Patron's Purse", rarity: 'common', desc: '+2 Gold at the start of every month.', monthGold: 2 },
  rod: { name: "The Drillmaster's Rod", rarity: 'common', desc: 'Training adds 5 less Stress.', trainStress: 5 },
  trophyWall: { name: 'The Trophy Wall', rarity: 'common', desc: '+1 Prestige for every win.', winPrestige: 1 },
  ledger: { name: "The Old Lanista's Ledger", rarity: 'common', desc: 'Fighters cost 2 Gold less.', recruitDiscount: 2 },
  hook: { name: "The Butcher's Hook", rarity: 'rare', desc: '+5% chance to injure; a kill pays +2 Renown.', fight: { injure: 5000 }, killRenown: 2 },
  nets: { name: 'The Nets of Nemi', rarity: 'rare', desc: 'Opponents fight at −2 Speed.', foe: { speed: -2 } },
  wolfPelt: { name: "The Wolf's Pelt", rarity: 'rare', desc: '+1 Power while your fighter is hurt.', fight: { power: 1, when: 'hurt' } },
  chain: { name: "The Brute's Chain", rarity: 'rare', tag: 'brute', desc: '+3% chance to injure for each Brute perk (up to 3).', perTag: { injure: 3000 } },
  shell: { name: 'The Tortoise Shell', rarity: 'rare', tag: 'guarded', desc: '−4% chance to be injured for each Guarded perk (up to 3).', perTag: { guard: 4000 } },
  sandals: { name: "Mercury's Sandals", rarity: 'rare', tag: 'swift', desc: '+1 Speed for each Swift perk (up to 3).', perTag: { speed: 1 } },
  mask: { name: "The Showman's Mask", rarity: 'rare', tag: 'showman', desc: 'A win pays +1 Renown for each Showman perk (up to 3).', tagRenown: 1 },
  scrolls: { name: 'The Scrolls of the Masters', rarity: 'rare', desc: '+1 XP from every fight.', fightXp: 1 },
  referee: { name: 'A Bribed Referee', rarity: 'rare', desc: 'Capitulating costs no Favour or Renown.', towelFree: true },
  dice: { name: 'The Loaded Dice', rarity: 'rare', desc: 'A won bet pays half the stake again.', betBonus: 0.5 },
  spring: { name: "Aesculapius's Spring", rarity: 'rare', desc: 'The Medbay heals one more week each week.', heal: 1 },
  eagle: { name: 'The Eagle Standard', rarity: 'legendary', desc: '+1 Power and +5% win chance in Boss fights.', fight: { power: 1, win: 5000, boss: true } },
  laurel: { name: 'The Gilded Laurel', rarity: 'legendary', desc: 'A fighter with a Title: +1 Power in every round.', fight: { power: 1, titled: true } },
  proserpina: { name: "Proserpina's Coin", rarity: 'legendary', desc: 'Once: a fighter who would die in a tournament is carried out alive. Then the coin is spent.', saveLife: true },
};

// Perk tags (pillar C): which relics a perk feeds. A repeatable perk taken twice counts twice.
export const TAGS = {
  brute: { name: 'Brute' },
  guarded: { name: 'Guarded' },
  swift: { name: 'Swift' },
  showman: { name: 'Showman' },
};
export const perkTags = (perk) => PERKS[perk]?.tags ?? [];
export const tagCount = (f, tag) => Math.min(FORTUNE.tagCap, (f.perks ?? []).filter((p) => perkTags(p).includes(tag)).length);

// One-off boons. `tiered` amounts are multiplied by the arena tier (1–4). `needs` hides a boon that would do nothing.
export const BOONS = {
  gold: { name: 'A Purse of Coin', rarity: 'common', gold: 1, goldPerTier: 2 },
  calm: { name: 'A Day at the Baths', rarity: 'common', stress: -30 },
  items: { name: "A Trader's Crate", rarity: 'common', items: 2 },
  favour: { name: "A Senator's Nod", rarity: 'common', favor: 5 },
  prestige: { name: 'Word in the Forum', rarity: 'rare', prestige: 1, prestigePerTier: 1 },
  sparring: { name: 'A Visiting Champion', rarity: 'rare', xp: 2 },
  surgeon: { name: "A Greek Surgeon's Visit", rarity: 'rare', heal: 2, needs: 'hurt' },
  blessing: { name: 'The Gods Smile', rarity: 'legendary', power: 1, one: true }, // on one fighter, named when the card is dealt
};

export const RARITIES = ['common', 'rare', 'legendary'];

export const hasRelic = (run, id) => (run.relics ?? []).includes(id);
export const relicsWith = (run, key) => (run.relics ?? []).filter((id) => RELICS[id]?.[key]).map((id) => RELICS[id]);
// The sum of a numeric relic key across the house's relics (e.g. 'monthGold').
export const relicSum = (run, key) => relicsWith(run, key).reduce((s, r) => s + r[key], 0);

// The fight bonuses the house's relics give this fighter in this bout: { a: mods for them, b: mods for the opponent }.
// Static conditions (Boss, Title, perk tags) are settled here; `rounds` and `when` are left for the fight engine.
export function relicFight(run, f, { boss = false } = {}) {
  const a = [];
  const b = [];
  for (const id of run.relics ?? []) {
    const r = RELICS[id];
    if (!r) continue;
    if (r.fight && (!r.fight.boss || boss) && (!r.fight.titled || f.titles?.length)) {
      const { boss: _b, titled: _t, ...mod } = r.fight;
      a.push({ ...mod, name: r.name });
    }
    if (r.foe) b.push({ ...r.foe, name: r.name });
    if (r.perTag) {
      const n = tagCount(f, r.tag);
      if (n) a.push({ ...Object.fromEntries(Object.entries(r.perTag).map(([k, v]) => [k, v * n])), name: r.name });
    }
  }
  return a.length || b.length ? { a, b } : null;
}

// The relic bonuses active for a combatant this round (used by computePower, computeSpeed and computePhase2).
export const relicMods = (c, round, injured) => (c.relics ?? []).filter((m) => (!m.rounds || m.rounds.includes(round)) && (m.when !== 'hurt' || injured));

// ---------- What a card says (PLACEHOLDER text) ----------

const pct = (v) => `${v / 1000}%`;
export function gearLine(id) {
  const g = GEAR[id];
  const bits = [];
  if (g.power) bits.push(`${g.power > 0 ? '+' : ''}${g.power} Power`);
  if (g.speed) bits.push(`${g.speed > 0 ? '+' : ''}${g.speed} Speed`);
  if (g.win) bits.push(`+${pct(g.win)} win chance`);
  if (g.injure) bits.push(`+${pct(g.injure)} chance to injure`);
  if (g.guard) bits.push(`−${pct(g.guard)} chance to be injured`);
  return `${g.slot === 'weapon' ? 'Weapon' : 'Armour'}: ${bits.join(', ')}.`;
}

export function fortuneTitle(card) {
  if (card.kind === 'relic') return RELICS[card.id].name;
  if (card.kind === 'gear') return GEAR[card.id].name;
  if (card.kind === 'fighter') return card.fighter.name;
  if (card.kind === 'wager') return "The Fates' Wager";
  return BOONS[card.id].name;
}

export function fortuneText(card) {
  if (card.kind === 'relic') return RELICS[card.id].desc;
  if (card.kind === 'gear') return `Free. ${gearLine(card.id)}`;
  if (card.kind === 'fighter') {
    const f = card.fighter;
    return `${f.legend ? 'A legend of the arena joins' : 'Joins'} for free: Power ${f.power}, Speed ${f.speed}, level ${f.level}${f.legend ? `, ${f.renown} Renown` : ''}.`;
  }
  if (card.kind === 'wager') return `Win your top bout this month: +${card.winGold} Gold and +${card.winRenown} Renown. Lose or skip it: −${card.lossGold} Gold.`;
  const b = BOONS[card.id];
  if (b.gold) return `+${card.gold} Gold.`;
  if (b.prestige) return `+${card.prestige} Prestige.`;
  if (b.favor) return `+${b.favor} Imperial Favour.`;
  if (b.stress) return `Every fighter: ${b.stress} Stress.`;
  if (b.items) return `${card.items.map((k) => CONSUMABLES[k].name).join(' and ')}.`;
  if (b.xp) return `Every fighter: +${b.xp} XP.`;
  if (b.heal) return `Every wound in the house heals ${b.heal} weeks sooner.`;
  if (b.power) return `${card.name ?? 'One fighter'}: +${b.power} Power, for good.`;
  return '';
}

// What a card is, in one word (for its label).
export const KIND_LABELS = { relic: 'Relic', boon: 'Boon', gear: 'Gear', fighter: 'Fighter', wager: 'Wager' };
