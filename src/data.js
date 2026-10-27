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
  cestus: { name: 'Cestus', ability: 'Progressive Overload', desc: 'Each round: +3/6/9% win chance and +5/10/15% injure chance.' },
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

// ---- Career placeholders (docs/fight-rules.md, "Career rules"); tune with scripts/simulate.js ----

export const ECONOMY = {
  startGold: 12,
  startPrestige: 5,
  marketSize: 4,
  startSpeed: 3,
  decorCost: 1,
  surgeonCost: 5, // Emergency Surgeon: heal one injury instantly
  skipGold: 2, // reward for skipping Tournament 1 or 2
  skipStressRelief: 20,
  maxStrikes: 3,
};

export const STRESS = { train: 20, fight: 15, rest: -30, medbay: -10, overtrained: 50, max: 100 };

// Weeks an injury takes to heal in the Medbay (Medbay Lv 3 heals 2 weeks per week).
export const HEAL_WEEKS = { distracted: 1, fleshWound: 1, concussed: 2, poisoned: 2, maimed: 3, senseless: 2, blinded: 3 };

export const MONTHS = ['Martius', 'Aprilis', 'Maius', 'Iunius', 'Quintilis', 'Sextilis', 'September', 'October', 'November', 'December'];
export const CALENDAR = { weeksPerMonth: 4, winterWeeks: 4 };

export const STAGES = ['Tournament 1', 'Tournament 2', 'Boss Tournament'];

// One circuit per tier: Tournament 1 → Tournament 2 → Boss. Arrays are per stage.
export const CIRCUITS = [
  { tier: 1, name: 'The Dirt Pits', oppPower: [5, 6, 8], buyIn: [1, 1, 2], winGold: [4, 5, 8], winPrestige: [2, 3, 5], lossGold: 1, oppDecor: 1, marketPower: 0, price: 3 },
  { tier: 2, name: 'The Bronze Arena', oppPower: [8, 9, 11], buyIn: [2, 2, 4], winGold: [6, 8, 12], winPrestige: [4, 6, 10], lossGold: 2, oppDecor: 2, marketPower: 2, price: 5 },
  { tier: 3, name: 'The Silver Coliseum', oppPower: [11, 12, 14], buyIn: [3, 3, 6], winGold: [8, 11, 16], winPrestige: [6, 9, 15], lossGold: 3, oppDecor: 3, marketPower: 4, price: 7 },
  { tier: 4, name: 'The Imperial Coliseum', oppPower: [14, 15, 17], buyIn: [4, 4, 8], winGold: [10, 14, 20], winPrestige: [8, 12, 20], lossGold: 4, oppDecor: 3, marketPower: 6, price: 9 },
];

export const GRAND = { name: 'The Grand Tournament', oppPower: 19, buyIn: 10, winGold: 30, winPrestige: 30, lossGold: 5, oppDecor: 3 };

// House Prestige levels: Fibonacci room plots, doubling roster caps (design doc Tab 7). A level, once reached, is kept.
export const PRESTIGE_LEVELS = [
  { level: 1, at: 0, plots: 3, maxFighters: 3 },
  { level: 2, at: 10, plots: 5, maxFighters: 6 },
  { level: 3, at: 25, plots: 8, maxFighters: 12 },
  { level: 4, at: 50, plots: 13, maxFighters: 24 },
  { level: 5, at: 90, plots: 21, maxFighters: 48 },
];

// cost[i] / req[i]: Gold and Prestige level to reach level i + 1 (cost[0] = build). `per` = effect per level.
export const BUILDINGS = {
  quarters: { name: 'Fighter Quarters', dept: 'housing', icon: 'bed', cost: [6, 6, 10], req: [1, 1, 3], per: [2, 3, 4], effect: (n) => `Houses ${n} fighters`, extra: (lv) => `Decor up to ${lv} of each item` },
  entertainment: { name: 'Entertainment Room', dept: 'housing', icon: 'lyre', cost: [10, 12], req: [3, 4], per: [10, 20], effect: (n) => `All fighters −${n} Stress each week` },
  trainer: { name: 'Trainer Room', dept: 'training', icon: 'dumbbell', cost: [8, 6, 10, 16, 26], req: [1, 2, 3, 4, 5], per: [3, 5, 8, 13, 21], effect: (n) => `Trains 1 fighter a week, up to ${n} total points`, extra: (lv) => `Costs ${lv} Gold per training week` },
  medbay: { name: 'Medbay', dept: 'medical', icon: 'cross', cost: [8, 8, 14], req: [1, 3, 4], per: [1, 2, 3], effect: (n) => `Treats ${n} fighter${n > 1 ? 's' : ''} at a time`, extra: (lv) => (lv >= 3 ? 'Heals 2 weeks of injury per week' : 'Heals 1 week of injury per week') },
  oracle: { name: 'Oracle', dept: 'scouting', icon: 'eye', cost: [8, 12], req: [2, 3], per: [1, 2], effect: (n) => (n >= 2 ? 'Exact odds and next Boss debuff' : 'Odds to the nearest 10%') },
  liaison: { name: 'Liaison', dept: 'scouting', icon: 'chain', cost: [6, 10], req: [2, 4], per: [1, 2], effect: (n) => (n >= 2 ? 'Monthly elite prisoner of war' : 'Monthly 1-Gold condemned convict') },
};

export const DEPARTMENTS = {
  housing: 'Housing & Morale',
  training: 'Training',
  medical: 'Medical',
  scouting: 'Scouting & Politics',
};

export const STARTING_BUILDINGS = ['quarters', 'trainer', 'medbay'];

export const BOSS_DEBUFFS = {
  firstInjuryDouble: { name: 'First Blood Counts Double', desc: 'The first injury your fighter takes counts as two, opening the Death Gate at once.' },
  rainyMud: { name: 'Rainy Mud', desc: 'Your fighter has −2 Speed every round.' },
  noArmor: { name: 'Stripped of Armor', desc: "Your fighter's armor (Alloyed Skin, Ego Armour) doesn't work." },
  ironRules: { name: 'Iron Rules', desc: 'Room decor gives no bonus to your fighter.' },
  bloodMoon: { name: 'Blood Moon', desc: 'Both fighters have +10% chance to be injured.' },
  crowdFavorite: { name: 'Crowd Favorite', desc: 'The champion fights with +1 Power.' },
};

export const NAMES = [
  'Aurelia', 'Brutus', 'Cassia', 'Drusus', 'Flamma', 'Gaius', 'Hilarus', 'Ixa', 'Juno', 'Krell',
  'Livia', 'Marcus', 'Nyx', 'Octavia', 'Priscus', 'Quintus', 'Rusta', 'Spiculus', 'Tigris', 'Ursa',
  'Varro', 'Vex', 'Xanthe', 'Zorak', 'Carpophorus', 'Verus', 'Thraxa', 'Sol-9', 'Unit Kappa', 'Grosh',
];
