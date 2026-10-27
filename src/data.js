// Game tables. ChanceE5 units: 100000 = 100%, 1000 = 1%.
// Sources: design doc Tabs 4–6 and docs/fight-rules.md.

// Index = |Delta|. win = win chance for the stronger side.
const POWER_DELTA = [
  { win: 50000, winnerInjury: 10000, loserInjury: 25000 },
  { win: 55000, winnerInjury: 9000, loserInjury: 30000 },
  { win: 60000, winnerInjury: 8000, loserInjury: 40000 },
  { win: 70000, winnerInjury: 7000, loserInjury: 50000 },
  { win: 85000, winnerInjury: 6000, loserInjury: 60000 },
  { win: 95000, winnerInjury: 5000, loserInjury: 70000 },
  { win: 97500, winnerInjury: 5000, loserInjury: 80000 },
  { win: 98000, winnerInjury: 5000, loserInjury: 90000 },
  { win: 99000, winnerInjury: 5000, loserInjury: 95000 },
  { win: 99900, winnerInjury: 5000, loserInjury: 97500 },
  { win: 99999, winnerInjury: 5000, loserInjury: 99000 },
];

export const clampDelta = (delta) => Math.max(-10, Math.min(10, delta));

// Lookup from fighter A's perspective; negative deltas mirror the win chance.
export function deltaRow(delta) {
  const d = clampDelta(delta);
  const row = POWER_DELTA[Math.abs(d)];
  return { delta: d, win: d >= 0 ? row.win : 100000 - row.win, winnerInjury: row.winnerInjury, loserInjury: row.loserInjury };
}

export const INJURIES = [
  { tier: 1, min: 1, max: 25, tag: 'distracted', name: 'Distracted', weight: 1, desc: 'Disables 1 random trait or class ability for the rest of the match.' },
  { tier: 2, min: 26, max: 45, tag: 'fleshWound', name: 'Flesh Wound', weight: 1, desc: '−10% chance to injure the opponent.' },
  { tier: 3, min: 46, max: 60, tag: 'concussed', name: 'Concussed', weight: 1, desc: 'Always strikes second.' },
  { tier: 4, min: 61, max: 74, tag: 'poisoned', name: 'Poisoned', weight: 2, desc: 'Counts as two injuries.' },
  { tier: 5, min: 75, max: 84, tag: 'maimed', name: 'Maimed', weight: 1, desc: 'Disables 1 random trait or ability per effective injury for the rest of the match.' },
  { tier: 6, min: 85, max: 92, tag: 'senseless', name: 'Senseless', weight: 1, desc: '+10% chance to be injured per effective injury.' },
  { tier: 7, min: 93, max: 99, tag: 'blinded', name: 'Blinded', weight: 1, desc: '−2 Power; disables First Volley, Bow and Gun.' },
  { tier: 8, min: 100, max: Infinity, tag: 'death', name: 'Immediate Death', weight: 0, desc: 'Dies in the arena.' },
];

export const INJURY_BY_TAG = Object.fromEntries(INJURIES.map((i) => [i.tag, i]));

export function injuryForScore(score) {
  return INJURIES.find((i) => score >= i.min && score <= i.max) ?? INJURIES[0];
}

export const TRAITS = {
  hateful: { name: 'Hateful', desc: '+10% chance to injure the opponent.' },
  masochist: { name: 'Masochist', desc: '+1 Power per effective injury.' },
  quantumAnalyzer: { name: 'Quantum Analyzer', desc: 'Each round lost gives +1 Power for the rest of the match.' },
  alloyedSkin: { name: 'Alloyed Skin', desc: 'Armor: −10% chance to be injured.' },
  perpetualMotion: { name: 'Perpetual Motion Machine', desc: 'After winning a round: +10% win chance and +5% chance to be injured next round.' },
  firebug: { name: 'Firebug', desc: '+1 Power per Fire Brazier in quarters.' },
  footwork: { name: 'Footwork', desc: 'Strikes first automatically when faster than the opponent.' },
  egoArmour: { name: 'Ego Armour', desc: 'While uninjured: +5% win chance and armor −10% chance to be injured.' },
  elvenEyes: { name: 'Elven Eyes', desc: 'When an injury check against this fighter misses by 50%+, makes a free 15% counter-injury check.' },
  bloodFaith: { name: 'Blood Faith', desc: 'If this fighter dies in a match, the Prestige buy-in is refunded.' },
};

export const KINDS = {
  human: { name: 'Human', basePower: 5, traits: ['hateful', 'masochist'] },
  android: { name: 'Android', basePower: 5, traits: ['quantumAnalyzer', 'alloyedSkin', 'perpetualMotion'] },
  elf: { name: 'Elf', basePower: 5, traits: ['firebug', 'footwork', 'egoArmour', 'elvenEyes'] },
  orc: { name: 'Orc', basePower: 6, traits: ['bloodFaith'] },
};

export const CLASSES = {
  cestus: { name: 'Cestus', ability: 'Progressive Overload', desc: 'Each round: +5% win and +5% injure chance per round number (5/10/15%).' },
  sagittarius: { name: 'Sagittarius', ability: 'First Volley', desc: 'Each round (unless Blinded): coin flip for +10% win chance or +10% injure chance.' },
  ornitharius: { name: 'Ornitharius', ability: 'Birds of Prey', desc: 'Once injured: +5% injure chance per Bird in quarters.' },
  fighter: { name: 'Fighter', ability: 'Weaponsmaster', desc: 'Fights with a weapon specialty.' },
};

export const WEAPONS = {
  club: { name: 'Club', ability: 'Knock Prone', desc: 'Winning a round gives the opponent −2 Speed and −5% win chance next round.' },
  fists: { name: 'Fists', ability: 'Disarm', desc: "Winning a round disables the opponent's class ability next round." },
  bow: { name: 'Bow', ability: 'Pin at Range', desc: 'Rounds 1–2: +1 Power against melee-only opponents (unless Blinded).' },
  spear: { name: 'Spear', ability: 'First-Strike Reach', desc: "Round 1: +3 Speed. Negates the opponent's Bow bonus." },
  sword: { name: 'Sword', ability: 'Riposte', desc: '20% chance to parry an injury; a parry gives +3 Speed next round.' },
  flail: { name: 'Flail', ability: 'Shield-Breaker', desc: 'Injury checks ignore enemy parries and armor.' },
  gun: { name: 'Gun', ability: 'Armor-Piercing Volley', desc: 'Rounds 1 and 3 (unless Blinded): +15% injure chance, ignores armor.' },
};

export const DECOR = {
  bird: { name: 'Bird', feeds: 'Ornitharius' },
  fireBrazier: { name: 'Fire Brazier', feeds: 'Firebug' },
};

export const ECONOMY = {
  startGold: 10,
  startPrestige: 5,
  fighterCost: 3,
  trainCost: 1,
  trainCap: 3,
  decorCost: 1,
  decorCap: 3,
  healCost: 2,
  maxRoster: 3,
  marketSize: 4,
  startSpeed: 3,
};

export const TOURNAMENTS = [
  { name: 'Tournament 1 · Minor Circuit', buyIn: 1, winGold: 3, lossGold: 1, oppPower: 5, oppDecor: 1, bossDebuff: false },
  { name: 'Tournament 2 · Major Circuit', buyIn: 2, winGold: 5, lossGold: 1, oppPower: 7, oppDecor: 2, bossDebuff: false },
  { name: 'Boss Tournament', buyIn: 3, winGold: 8, lossGold: 1, oppPower: 9, oppDecor: 3, bossDebuff: true },
];

export const BOSS_DEBUFF = { name: 'First Injury Counts Double', desc: 'The first injury your fighter takes this match counts as two, opening the Death Gate at once.' };

export const NAMES = [
  'Aurelia', 'Brutus', 'Cassia', 'Drusus', 'Flamma', 'Gaius', 'Hilarus', 'Ixa', 'Juno', 'Krell',
  'Livia', 'Marcus', 'Nyx', 'Octavia', 'Priscus', 'Quintus', 'Rusta', 'Spiculus', 'Tigris', 'Ursa',
  'Varro', 'Vex', 'Xanthe', 'Zorak', 'Carpophorus', 'Verus', 'Thraxa', 'Sol-9', 'Unit Kappa', 'Grosh',
];
