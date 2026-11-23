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

// Injury roll: d100 + perInjury × prior injuries + perPowerGap × opponent's Power advantage (design doc used +15 per injury).
export const INJURY_ROLL = { perInjury: 25, perPowerGap: 5 };

// Combat tunables (ChanceE5 except axeCleave, which adds to the d100 injury roll).
export const COMBAT = {
  firstStrike: 10000,
  tactician: 5000,
  cestusWin: 3000,
  cestusInjure: 5000,
  parry: 20000,
  swordParry: 25000,
  riposteWin: 5000,
  counterInjure: 15000,
  elvenEyesMargin: 50000,
  axeInjure: 5000,
  axeCleave: 15,
  daggerInjure: 10000,
  gunInjure: 15000,
  ornithariusBase: 5000,
};

export const INJURIES = [
  { tier: 1, min: 1, max: 25, part: 'head', tag: 'distracted', name: 'Distracted', weight: 0, desc: 'A passing daze: disables 1 random trait or class ability for the rest of the match. Doesn\'t count toward the Death Gate.' },
  { tier: 2, min: 26, max: 38, part: 'torso', tag: 'fleshWound', name: 'Flesh Wound', weight: 1, desc: '−10% chance to injure the opponent.' },
  { tier: 3, min: 39, max: 48, part: 'torso', tag: 'bleeding', name: 'Bleeding', weight: 1, desc: 'Counts as one injury. +10% chance to be injured (+5% while Guarding). A Blessed Bandage staunches it for the fight.' },
  { tier: 4, min: 49, max: 60, part: 'head', tag: 'concussed', name: 'Concussed', weight: 1, desc: 'Always strikes second.' },
  { tier: 5, min: 61, max: 74, part: 'torso', tag: 'poisoned', name: 'Poisoned', weight: 2, desc: 'Counts as two injuries.' },
  { tier: 6, min: 75, max: 84, part: 'limb', tag: 'maimed', name: 'Maimed', weight: 2, desc: 'Counts as two injuries. Disables 1 random trait or ability per prior effective injury for the rest of the match.' },
  { tier: 7, min: 85, max: 92, part: 'head', tag: 'senseless', name: 'Senseless', weight: 2, desc: 'Counts as two injuries. +10% chance to be injured per effective injury.' },
  { tier: 8, min: 93, max: 99, part: 'head', tag: 'blinded', name: 'Blinded', weight: 2, desc: 'Counts as two injuries. −2 Power; disables First Volley, Bow and Gun.' },
  { tier: 9, min: 100, max: Infinity, tag: 'death', name: 'Immediate Death', weight: 0, desc: 'Dies in the arena.' },
];

export const INJURY_BY_TAG = Object.fromEntries(INJURIES.map((i) => [i.tag, i]));

// 7.2 Wound affinities (docs/roadmap-v7.md, Phase 2). After the injury roll, a fighter's style can turn the wound into its
// signature wound. `WOUND_STYLES[style]` maps a weight to the wound of that weight. A source may only reach a wound up to
// `upWeight` heavier than the rolled one (0 for weapons, gear and decor: they steer, never add Death Gate weight); single-use
// items get upWeight 1 on hits of `minScore`+. Of the wounds a source may reach, the heaviest is used. Chance in ChanceE5.
export const WOUND_STYLES = {
  bleed: { 1: 'bleeding' },
  stun: { 1: 'concussed', 2: 'senseless' },
  maim: { 2: 'maimed' },
  blind: { 2: 'blinded' },
  poison: { 2: 'poisoned' },
  blindPowder: { 0: 'distracted', 2: 'blinded' },
};
export const AFFINITY = {
  steer: 35000, // weapon, class and gear affinities
  weapons: { dagger: 'bleed', club: 'stun', axe: 'maim', flail: 'maim', bow: 'blind' },
  classes: { cestus: 'stun', thornBlade: 'bleed', bloodBearer: 'bleed', ornitharius: 'blind' },
  gear: { serratedSpatha: 'bleed', warMaul: 'stun', executionerAxe: 'maim', hunterBow: 'blind' },
  minScore: 49, // single-use items reach one weight up only on hits this hard
  // Whetstone Rack: only bladed fighters (these weapon specialties, blades in hand, or these classes).
  bladedWeapons: ['sword', 'dagger', 'axe'],
  bladedGear: ['gladius', 'imperialGladius', 'serratedSpatha', 'executionerAxe', 'throwingAxes'],
  bladedClasses: ['bloodBearer', 'thornBlade'],
};
// Bleeding: more chance to be injured, per Bleeding wound (less while Guarding).
export const BLEEDING = { self: 10000, guarding: 5000 };

export function injuryForScore(score) {
  return INJURIES.find((i) => score >= i.min && score <= i.max) ?? INJURIES[0];
}

export const TRAITS = {
  hateful: { name: 'Hateful', desc: '+10% chance to injure the opponent.' },
  masochist: { name: 'Masochist', desc: '+1 Power per effective injury. Injuries never switch this trait off.' },
  quantumAnalyzer: { name: 'Quantum Analyzer', desc: 'Each round lost gives +1 Power for the rest of the match.' },
  alloyedSkin: { name: 'Alloyed Skin', desc: 'Armour: −10% chance to be injured.' },
  perpetualMotion: { name: 'Perpetual Motion Machine', desc: 'After winning a round: +10% win chance and +5% chance to be injured next round.' },
  firebug: { name: 'Firebug', desc: '+1 Power per Fire Brazier in quarters.' },
  footwork: { name: 'Footwork', desc: 'Strikes first automatically when faster than the opponent.' },
  egoArmour: { name: 'Ego Armour', desc: 'While uninjured: +5% win chance and armour −10% chance to be injured.' },
  elvenEyes: { name: 'Elven Eyes', desc: 'When an injury check against this fighter misses by 50%+, makes a free 15% counter-injury check.' },
  bloodFaith: { name: 'Blood Faith', desc: 'If this fighter dies in a match, the Prestige buy-in is refunded, and their clan pays the house 5 Gold per arena tier.' },
  underdog: { name: 'Underdog', desc: 'Against a stronger opponent, up to +2 Power to close the gap (+1 when they have 1 more Power, +2 when 2 or more).' },
  unbreakable: { name: 'Unbreakable', desc: 'The Death Gate opens at 3 injuries instead of 2.' },
  bloodlust: { name: 'Bloodlust', desc: '+1 Power once the opponent is injured.' },
  // v5 kinds
  bloodDrinker: { name: 'Blood Drinker', desc: 'Wounding the opponent heals this fighter\'s newest light wound (Flesh Wound or Distracted) taken this match.' },
  nightborn: { name: 'Nightborn', desc: '+1 Power in Round 3.' },
  mesmerize: { name: 'Mesmerize', desc: '+5% win chance in Round 1.' },
  thickHide: { name: 'Thick Hide', desc: 'Armour: −10% chance to be injured.' },
  pounce: { name: 'Pounce', desc: '+3 Speed in Round 1.' },
  rampage: { name: 'Rampage', desc: 'Each round won gives +1 Power for the rest of the match.' },
  // 5.3.0: Revenants, raised by the Unnatural Temple of Vulcan.
  deathless: { name: 'Deathless', desc: 'Already died once: the Death Gate opens one injury later.' },
  graveChill: { name: 'Grave Chill', desc: 'The opponent has −5% win chance every round: nobody wants to fight the dead.' },
  cinderHeart: { name: 'Cinder Heart', desc: '+1 Power in Rounds 2 and 3: the forge-fire inside wakes slowly.' },
};

// Tactics: chosen before each round. Press beats Feint, Feint beats Guard, Guard beats Press (+10% win chance to the counter).
export const TACTICS = {
  steady: { name: 'Steady', icon: '•', desc: 'Balanced stance: −2.5% chance to be injured.', self: -2500 },
  press: { name: 'Press', icon: '🗡', desc: '+1.5% win chance and +5% chance to injure, but +10% chance to be injured.', win: 1500, injure: 5000, self: 10000 },
  guard: { name: 'Guard', icon: '🛡', desc: '−15% chance to be injured, −5% win chance.', win: -5000, self: -15000 },
  feint: { name: 'Feint', icon: '↯', desc: '+10% win chance if you strike first this round (faster fighters strike first more often).', firstStrike: 10000 },
  // Version 6 (phase 4): the clutch choice, offered only at the Death Gate. Outside the counter triangle; never an opponent's
  // pick, never suggested. Words are PLACEHOLDER for the designer.
  // LLM-12/13: with only a wound risk it could be safer than fighting on; now losing the round is death (its risk is the loss chance).
  allIn: { name: 'All In', icon: '🔥', clutch: true, fallOnLoss: true, desc: 'Only at the Death Gate: +20% win chance and +10% chance to injure, but lose the round and your fighter falls. The crowd loves it.', win: 20000, injure: 10000 },
};
// The tactics of the counter triangle (what the picker offers every round, and what opponents choose from).
export const ROUND_TACTICS = Object.keys(TACTICS).filter((k) => !TACTICS[k].clutch);
export const COUNTERS = { press: 'feint', feint: 'guard', guard: 'press' }; // key beats value
export const COUNTER = { win: 10000 }; // win chance for the side whose tactic counters the other's

// Four Humors: every fighter's temperament. Small round-by-round effects, and the tactics they lean towards
// (what an opponent picks; `adapts` counters the tactic you used last round).
export const HUMORS = {
  choleric: { name: 'Choleric', tell: 'loves to Press', desc: 'Hot-blooded: +1 Power in Round 1, −1 Power in Round 3. Loves to Press.', power: { 1: 1, 3: -1 }, leans: { press: 70, feint: 15, guard: 15 } },
  sanguine: { name: 'Sanguine', tell: 'loves to Feint', desc: 'Quick tempo: +3 Speed in Round 1. Loves to Feint.', speed: { 1: 3 }, leans: { feint: 70, press: 15, guard: 15 } },
  melancholic: { name: 'Melancholic', tell: 'prefers to Guard', desc: 'Stoic: −5% chance to be injured; +1 Power in Round 3. Prefers to Guard.', self: -5000, power: { 3: 1 }, leans: { guard: 70, press: 15, feint: 15 } },
  phlegmatic: { name: 'Phlegmatic', tell: 'usually Guards first, then counters your last tactic', desc: 'Studies the opponent: +5% win chance in Rounds 2 and 3. Guards first, then counters the tactic you used last round.', win: { 2: 5000, 3: 5000 }, leans: { guard: 70, press: 15, feint: 15 }, adapts: 70 },
};

// Rival houses (roadmap v3, phase B3). Every opponent fights for one. Glory ranks the houses: a win is worth
// `win` × the arena tier (`boss` × tier for a Boss, `grand` for the Grand Tournament); a house loses `beaten` when you beat its fighter.
// Rivals climb an arena tier at each `climb` threshold of Glory. Kills start feuds that last `feudMonths` tournament weeks.
export const HOUSES = {
  rivals: 3,
  names: [
    { name: 'House Varro', color: '#b5543c', motto: 'Blood pays its debts.' },
    { name: 'The Red Hand', color: '#c0362c', motto: 'We do not forget.' },
    { name: 'The Silver Wolves', color: '#9fb3c8', motto: 'The pack hunts together.' },
    { name: 'House Corvinus', color: '#5a6b8a', motto: 'Ravens feast on the proud.' },
    { name: 'The Brass Lions', color: '#d9b45a', motto: 'Roar, and the crowd roars back.' },
    { name: 'House Severa', color: '#7a5a8a', motto: 'Discipline before glory.' },
  ],
  glory: { win: 1, boss: 3, grand: 20, beaten: 1 },
  climb: [8, 20, 40],
  feudMonths: 3,
  vengeanceWin: 5000,
  yearPurse: [8, 4, 0, 0], // Gold × the year, paid at the start of winter to the top two houses (swept: 30/20/10 took careful careers to 48%)
};

// Legacy (src/legacy.js): patrons and decrees chosen when a career starts (run.setup).
// Patrons: one per career, chosen when it starts.
export const PATRONS = {
  veteran: { name: 'The Old Veteran', desc: 'Start with a level-3 veteran in your roster.' },
  friend: { name: 'A Friend at Court', desc: 'Start with +15 Imperial Favour.' },
  purse: { name: "A Merchant's Purse", desc: 'Start with +10 Gold.' },
  warChest: { name: 'The War Chest', desc: 'Start with 2 War Paint and a Blessed Bandage.' },
  defector: { name: 'A Defector', desc: 'A strong fighter from a rival house joins you at the start (Power +3).' },
  liberator: { name: 'Friends of the Rising', desc: 'Start with a political prisoner in your roster. The rebels remember your house.' }, // v6, secret
  augur: { name: 'The Augur', desc: 'Open the career with a pick of three rare or legendary relics.' }, // version 6: a Legacy level unlock
};

// Emperor's Decrees: optional harder rules for a career, after your first win. Each adds to the score.
export const DECREES = {
  ironBosses: { name: 'Iron Bosses', desc: 'Every Boss fights with +1 Power.', power: 1, score: 30 },
  greedyEmperor: { name: 'A Greedy Emperor', desc: 'Tribute costs 50% more.', score: 20 },
  harshJudges: { name: 'Harsh Judges', desc: 'Losing or forfeiting a Boss costs 5 more Favour, and falling before its Final costs the full amount.', score: 20 }, // phase 5 (LLM-13): the halving for an early loss made Heat 1 barely felt
  leanFortune: { name: 'Lean Fortunes', desc: 'Fortune deals one card fewer each month.', score: 25 }, // version 6
  hungryLions: { name: 'Hungry Lions', desc: 'Every opponent fights with +1 Power.', power: 1, score: 40 }, // version 6
};

// Version 6, Heat (docs/plan-v6-phase3.md): numbered levels of the decrees, each adding one rule to the last.
// Winning a career at Heat N unlocks Heat N+1. Legacy XP gains `xpPerHeat` × the Heat level.
export const HEAT = { decrees: ['harshJudges', 'greedyEmperor', 'hungryLions', 'leanFortune', 'ironBosses'], xpPerHeat: 0.2 };

// Version 6, Legacy XP and the unlock tree (src/legacy.js). Level 2 needs `first` XP; each level after needs `step` more.
// Past level 12 a level still comes, but unlocks nothing new.
export const LEGACY = {
  first: 60, step: 15, // 6.0.0-beta: was 70 and 10; the XP for each level through 6 is the same or lower (60/135/225/330/450 against 70/150/240/340/450)
  // Bosses and Titles count once each (every Boss win and every Title took careful careers to about 140 XP).
  xp: { career: 10, arena: 5, boss: 3, kill: 1, maxKills: 10, title: 3, maxTitles: 5, won: 40, coup: 40, martyr: 25, loyalist: 20 },
  legendsKept: 6, // how many Hall legends a career's setup may deal as Fortune cards
};
// One unlock a level (the index + 2 is the level). Past it, levels unlock nothing more. Names and words are PLACEHOLDER for the designer.
export const LEGACY_LEVELS = [
  { id: 'legends', name: 'The Hall Remembers', desc: 'A retired legend from an earlier career can return, once, as a Fortune card.' },
  { id: 'relic:dice', name: 'The Loaded Dice', desc: 'Can now appear in your Fortune draft.' },
  { id: 'colour:purple', name: 'Imperial Purple', desc: 'A house colour.' },
  { id: 'oracle', name: 'A Seer in the House', desc: 'Every career starts with an Oracle.' },
  { id: 'relic:scrolls', name: 'The Scrolls of the Masters', desc: 'Can now appear in your Fortune draft.' },
  { id: 'patron:augur', name: 'The Augur', desc: 'A new patron: open the career with a pick of three rare or legendary relics.' },
  { id: 'relic:laurel', name: 'The Gilded Laurel', desc: 'Can now appear in your Fortune draft.' },
  { id: 'colour:verdigris', name: 'Verdigris', desc: 'A house colour.' },
  { id: 'fourCards', name: 'A Generous Wheel', desc: 'Fortune deals four cards each month.' },
  { id: 'relic:proserpina', name: "Proserpina's Coin", desc: 'Can now appear in your Fortune draft.' },
  { id: 'relic:eagle', name: 'The Eagle Standard', desc: "Can now appear in your Fortune draft (until then, only the Emperor's friends carry it)." },
  { id: 'colour:gold', name: 'Imperial Gold', desc: 'A house colour, for a lanista of legend.' },
];
export const HOUSE_COLOURS = { crimson: 'Crimson', purple: 'Imperial Purple', verdigris: 'Verdigris', gold: 'Imperial Gold' };

// Fighter stories (roadmap v3, phase C). Scars come from surviving severe wounds (`vs`: 'melee' or 'ranged', the style
// of the opponent who caused it); Battle-Hardened from a Bloodied Victory. Values: power, enemy (to injure), self (to be injured).
export const SCARS = {
  afeared: { name: 'Afeared', desc: 'Against this style: −1 Power and −10% chance to injure, but fights warily (−10% chance to be injured). Two wins against the style they fear conquer it; the Temple of Fortuna can lift it for Gold.', power: -1, enemy: -10000, self: -10000 },
  enraged: { name: 'Enraged', desc: 'Against this style: +1 Power and +15% chance to injure, but reckless (+15% chance to be injured).', power: 1, enemy: 15000, self: 15000 },
  hardened: { name: 'Battle-Hardened', desc: 'Won bloodied and lived: −5% chance to be injured.', self: -5000 },
};
export const SCAR_CHANCE = 0.5; // chance a survived severe wound (Concussed or worse) leaves a scar
// The chance a scar is Afeared, by humour (else Enraged). 5.4.0, the designer: Afeared was half of all scars, then about 1 in 5;
// 5.4.2 (the designer again): about 1 in 10.
export const SCAR_AFEARED = { choleric: 0, melancholic: 0.25, other: 0.05 };
// Overcoming Afeared (5.4.2): `conquerWins` wins against the style they fear, or a rite at the Temple of Fortuna
// (`ritePrice` + `ritePerTier` × arena tier Gold).
export const FEAR = { conquerWins: 2, ritePrice: 6, ritePerTier: 2 };
export const SEVERE = ['concussed', 'poisoned', 'maimed', 'senseless', 'blinded'];

// Cyborg surgery (Medbay Lv 2+): replace a Maimed limb or Blinded eye. The crowd distrusts machines.
export const AUGMENTS = {
  arm: { name: 'Cyborg Arm', from: 'maimed', desc: '+1 Power. Replaces a Maimed limb, and a blow that would Maim becomes only a Flesh Wound.', power: 1 },
  eye: { name: 'Cyborg Eye', from: 'blinded', desc: 'Replaces a Blinded eye. +1 Power in every fight, and a blow that would Blind becomes only a Flesh Wound.', power: 1 },
};
export const SURGERY = { cost: 10, perTier: 4, renown: -1, medbay: 2 }; // playtest #3: was 15 + 5/tier and −2 Renown, never worth it

// Retiring a veteran (level 4+ or a Title) to the Hall of Champions.
export const RETIRE = { level: 4, prestige: 5, morale: 10 };

// Renaming a fighter (the designer, 6.0.3): free, but `chance` of the time they resent it: `morale` Morale for MOOD_WEEKS
// weeks (like an event's). Names are 1 to `maxLength` characters and can't be anyone else's.
export const RENAME = { chance: 0.65, morale: -10, maxLength: 20 };

// Brackets (playtester request): from the Silver Coliseum up, a tournament is three matches in a row for one fighter.
// The Quarter- and Semi-final opponents are weaker than the listed (Final) opponent by `power`; each early win pays `purse` Gold × tier.
// Early (Quarter- and Semi-final) wins pay `purse` × tier Gold and `prestige` flat Prestige. Prestige drives House level and
// the Trainer cap, so it snowballs: +1 per early win added ~15 points of careful win rate, and refunding the buy-in on a
// lost Final ~9. Playtest #6's "brackets pay nothing" is answered with Gold instead (purse 2 → 3).
// A Championship also crowns every arena below it (playtest #7). cascadePower: Power for each lower Title gained that way.
export const TITLES = { cascade: true, cascadePower: 1 };
export const BRACKET = { fromTier: 3, rounds: ['Quarter-final', 'Semi-final', 'Final'], power: [-4, -3, 0], purse: 3, prestige: 1, prestigeTopOnly: false, earlyBossLoss: 0.75, earlyBossLossGold: 0, bossFinalRefund: 1 };

// Underdog tops up to the Power gap, up to `gap` (+2).
export const UNDERDOG = { gap: 2 };

// Kill marks: earned for opponents killed in the arena (fighters keep a tally).
export const KILL_MARKS = [
  { id: 'dreaded', at: 2, name: 'Dreaded', desc: '+5% win chance: opponents fear a proven killer.' },
  { id: 'reaper', at: 5, name: 'Reaper', desc: '+5% chance to injure.' },
];

export const KINDS = {
  human: { name: 'Human', basePower: 5, traits: ['hateful', 'masochist', 'underdog'] },
  android: { name: 'Android', basePower: 5, traits: ['quantumAnalyzer', 'alloyedSkin', 'perpetualMotion'] },
  elf: { name: 'Elf', basePower: 5, traits: ['firebug', 'footwork', 'egoArmour', 'elvenEyes'] },
  orc: { name: 'Orc', basePower: 6, traits: ['bloodFaith', 'unbreakable', 'bloodlust'] },
  vampire: { name: 'Vampire', basePower: 5, traits: ['bloodDrinker', 'nightborn', 'mesmerize'] },
  basa: { name: 'Basa', basePower: 5, traits: ['thickHide', 'pounce', 'rampage'] },
  revenant: { name: 'Revenant', basePower: 5, traits: ['deathless', 'graveChill', 'cinderHeart'], exotic: true },
};

export const CLASSES = {
  cestus: { name: 'Cestus', ability: 'Progressive Overload', desc: 'Each round: +3/6/9% win chance and +5/10/15% injure chance.' },
  sagittarius: { name: 'Sagittarius', ability: 'First Volley', desc: 'Each round (unless Blinded): coin flip for +10% win chance or +10% injure chance.' },
  ornitharius: { name: 'Ornitharius', ability: 'Birds of Prey', desc: '+5% injure chance, plus +5% per Bird in quarters.' },
  fighter: { name: 'Fighter', ability: 'Weaponsmaster', desc: 'Fights with a weapon specialty.' },
  retiarius: { name: 'Retiarius', ability: 'Net and Trident', desc: 'Winning a round entangles the opponent: −3 Speed next round.' },
  ashHungry: { name: 'Ash-Hungry', ability: 'Ash Stacks', desc: 'Each injury they inflict: +1 Power and +5% chance to injure for the rest of the match.' },
  bloodBearer: { name: 'Blood-Bearer', ability: 'Off-Hand', desc: '+5% win chance; losing a round gives a free 15% off-hand strike at the winner.' },
  thornBlade: { name: 'Thorn-Blade', ability: 'Thorn Lash', desc: 'Winning a round gives the opponent −2 Speed and −1 Power next round.', legacy: true },
  samnite: { name: 'Samnite', ability: 'Shield Wall', desc: '20% chance to parry an injury with the shield; Concussed never costs them the first strike.', legacy: true },
};

export const SIGNATURE = { level: 3, bossLevel: 3, opponentLevel: 3 };
export const SIGNATURES = {
  cestus: { name: 'Haymaker', desc: 'Next round: +2 Power, but +5% chance to be injured.', boost: { power: 2, self: 5000 } },
  sagittarius: { name: 'Aimed Shot', desc: 'Next round: +12% win chance and +20% chance to injure.', boost: { win: 12000, injure: 20000 } },
  ornitharius: { name: 'Hawk Strike', desc: 'Next round: +5% win chance, +10% chance to injure, and the opponent −3 Speed.', boost: { win: 5000, injure: 10000 }, foe: { speed: -3 } },
  fighter: { name: "Champion's Blow", desc: 'Next round: +15% win chance.', boost: { win: 15000 } },
  retiarius: { name: 'Cast the Net', desc: 'Next round: the opponent −4 Speed and −5% win chance.', foe: { speed: -4, win: -5000 } },
  ashHungry: { name: 'Feed the Ash', desc: 'One Ash Stack now: +1 Power and +5% to injure for the rest of the match.', ash: 1 },
  bloodBearer: { name: 'Twin Fangs', desc: 'Next round: +10% win chance and +10% chance to injure.', boost: { win: 10000, injure: 10000 } },
  thornBlade: { name: 'Thorn Storm', desc: 'Next round: the opponent −2 Power and −2 Speed.', foe: { power: -2, speed: -2 } },
  samnite: { name: 'Shield Bash', desc: 'Next round: −20% chance to be injured and +10% win chance.', boost: { self: -20000, win: 10000 } },
};

export const MERCY = { minInjuries: 1, spareFavor: 2, killRenown: 2, infamyRenown: 2, crowdRenown: 1, crowdMorale: 5 };

export const WEAPONS = {
  club: { name: 'Club', ability: 'Knock Prone', desc: 'Winning a round gives the opponent −2 Speed and −5% win chance next round.' },
  fists: { name: 'Fists', ability: 'Disarm', desc: "Winning a round disables the opponent's class ability next round." },
  bow: { name: 'Bow', ability: 'Pin at Range', desc: 'Rounds 1–2: +1 Power against melee-only opponents (unless Blinded).' },
  spear: { name: 'Spear', ability: 'First-Strike Reach', desc: "Round 1: +3 Speed. Negates the opponent's Bow bonus." },
  sword: { name: 'Sword', ability: 'Riposte', desc: '25% chance to parry an injury; a parry gives +3 Speed and +5% win chance next round.' },
  flail: { name: 'Flail', ability: 'Shield-Breaker', desc: 'Injury checks ignore enemy parries and armour.' },
  gun: { name: 'Gun', ability: 'Armour-Piercing Volley', desc: 'Rounds 1 and 3 (unless Blinded): +15% injure chance, ignores armour.' },
  axe: { name: 'Axe', ability: 'Cleave', desc: '+5% chance to injure; wounds they inflict are worse (+15 on the injury roll).' },
  dagger: { name: 'Dagger', ability: 'Backstab', desc: 'Striking first: +10% chance to injure that round.' },
};

// Comfort for Morale: 2 + price, unless an item sets its own (`comfort`).
export const decorComfort = (d) => d.comfort ?? 2 + d.price;
// Bladed fighters (Whetstone Rack, 7.2).
export const isBladed = (f) => (f.cls === 'fighter' && AFFINITY.bladedWeapons.includes(f.weapon)) || AFFINITY.bladedClasses.includes(f.cls)
  || AFFINITY.bladedGear.includes(f.gear?.weapon);
// `group` sorts the quarters drawer: comfort, temperament (shapes a fighter's Humour, 7.1) or craft (helps a build in fights).
// `helps`: the ✦ mark and the careful bot's first pick: a build-specific or combat use. Temperament pieces don't set it;
// their room line says what they would do to that fighter's temper instead.
// Temperament pieces: `humor` is where a fighter drifts after HUMOUR_DRIFT.weeks weeks with that piece dominant in their room.
export const DECOR = {
  bird: { group: 'craft', price: 1, calm: 5, name: 'Bird', feeds: 'Ornitharius', effect: 'Comfort for Morale and −5 Stress a week. Ornitharius fighters also get +5% injure chance per Bird (Birds of Prey).', helps: (f) => f.cls === 'ornitharius' },
  fireBrazier: { group: 'craft', price: 1, calm: 5, name: 'Fire Brazier', feeds: 'Firebug', effect: 'Comfort for Morale and −5 Stress a week. Elves with Firebug also get +1 Power per Fire Brazier.', helps: (f) => f.kindTrait === 'firebug' },
  trophy: { group: 'comfort', price: 2, name: 'Trophy Rack', feeds: 'Morale', effect: 'Comfort for Morale: a famous fighter likes to see their victories on the wall.', helps: () => false },
  shrine: { group: 'comfort', price: 3, calm: 10, name: 'Shrine of Mars', feeds: 'Stress', effect: 'Comfort for Morale and −10 Stress a week: prayer steadies a fighter between bouts.', helps: () => false },
  bathhouse: { group: 'comfort', price: 4, calm: 15, name: 'Bathhouse', feeds: 'Stress', effect: 'Comfort for Morale and −15 Stress a week: hot water heals more than the Medbay admits.', helps: () => false },
  lionCage: { group: 'craft', price: 5, name: 'Lion Cage', feeds: 'Basa', effect: 'Comfort for Morale. Basa fighters with a Lion Cage get +1 Power (they train with the beasts).', helps: (f) => f.kind === 'basa' },
  warBanner: { group: 'comfort', price: 4, renown: 1, name: 'War Banner', feeds: 'Renown', effect: 'Comfort for Morale, and +1 Renown for every win (per Banner): the crowd learns their colours.', helps: () => true },
  // 7.1 Temperament pieces (PLACEHOLDER words for the designer).
  rockGarden: { group: 'temperament', humor: 'phlegmatic', price: 3, comfort: 5, calm: 8, name: 'Rock Garden', feeds: 'Phlegmatic', effect: 'Comfort for Morale and −8 Stress a week; shapes a Phlegmatic temper. On a Rest week they meditate: −10 more Stress, +1 XP, and half a step toward conquering a fear.', helps: () => false },
  spikyBed: { group: 'temperament', humor: 'melancholic', price: 2, comfort: 0, name: 'Spiky Bed', feeds: 'Melancholic', effect: 'No comfort at all; shapes a Melancholic temper. A win taken with even one wound makes them Battle-Hardened (usually it takes two).', helps: () => false },
  skullRack: { group: 'temperament', humor: 'choleric', price: 3, comfort: 3, name: 'Skull Rack', feeds: 'Choleric', effect: 'A little comfort; shapes a Choleric temper. A severe wound scars them Enraged, never Afeared.', helps: () => false },
  // 7.2 Arena Craft pieces (PLACEHOLDER words): wound affinities in a fight (AFFINITY; off under Iron Rules).
  terrarium: { group: 'craft', price: 4, comfort: 4, calm: 5, calmIf: (f) => f.cls === 'ashHungry' || f.kind === 'vampire', affinity: { style: 'poison', chance: 20000 }, name: 'Viper Terrarium', feeds: 'Poison', effect: 'A little comfort. In a fight, 20% of their heavy wounds become Poison. Ash-Hungry and Vampire fighters find the vipers soothing: −5 Stress a week.', helps: (f) => f.cls === 'ashHungry' || f.kind === 'vampire' },
  whetstone: { group: 'craft', price: 4, comfort: 4, affinity: { style: 'bleed', chance: 25000, bladed: true }, name: 'Whetstone Rack', feeds: 'Bleeding', effect: 'A little comfort. Bladed fighters (Sword, Dagger, Axe, a blade in hand, Blood-Bearer, Thorn-Blade): 25% of their light wounds bleed.', helps: (f) => isBladed(f) },
  wineAmphora: { group: 'temperament', humor: 'sanguine', price: 3, comfort: 7, name: 'Wine Amphora', feeds: 'Sanguine', effect: 'Plenty of comfort; shapes a Sanguine temper. The crowd warms to them: each fight starts with +5 Hype.', helps: () => false },
};

// 7.1 Temperament drift: a dominant Temperament piece turns a fighter's Humour after `weeks` weeks (a visible count).
export const HUMOUR_DRIFT = { weeks: 4 };
// 7.1 A Rock Garden on a Rest week: extra Stress relief, XP, and progress toward conquering Afeared (in wins).
export const MEDITATION = { stress: 10, xp: 1, fear: 0.5 };
// 7.1 Hype a fighter with a Wine Amphora starts each fight with; injuries a Spiky Bed sleeper needs for Battle-Hardened.
export const AMPHORA_HYPE = 5;
export const SPIKY_HARDENED_AT = 1;

export const ECONOMY = {
  startGold: 12,
  startPrestige: 5,
  marketSize: 4,
  startSpeed: 3,
  surgeonCost: 8,
  surgeonPerTier: 4,
  skipGold: 2, // reward for skipping Tournament 1 or 2
  skipStressRelief: 20,
  lowerArenaPrestige: 0.5, // Prestige from a win shrinks by half for each tier below your top arena
  bloodFaithGold: 5, // an Orc with Blood Faith who dies in a match: their clan pays this × arena tier in Gold
  lowerArenaMinPrestige: 1, // ...but a win there always earns at least this much (playtest: a win that earned nothing felt like a loss)
  lowerArenaGold: 0.5, // and so does the purse (v5 economy pass: late careers were drowning in Gold from the lower arenas)
  lowerWinOverLoss: 2, // ...but a lower-arena win always pays at least the loss stipend + this
  crushingGap: 3, // a win with this much more Power than the opponent is a "crushing" win
  bracketCrushingGap: 5, // in a tournament Final the crowd is more forgiving (Quarter- and Semi-finals are never jeered)
  lootChance: 0.35, // chance to claim a beaten opponent's gear (Bosses always drop theirs)
  titleWins: 3, // wins in an arena that make a fighter its Champion (beating its Boss does too)
  knownRenown: 5, // fighters below this Renown (rookies) are never jeered for mismatches
  challengerRenown: 30, // top-arena opponents gain +1 Power per this much Renown of the fighter they face
  challengerMax: 2,
  challengerFromTier: 3, // Challengers only appear from the Silver Coliseum on (the late game)
  scoutedMax: 1, // opponents gain +1 Power per consecutive top-arena month a fighter has fought, up to this (swept: 2+ is too punishing)
};

// Imperial Favour replaces v1's three Strikes. At 0 you're executed.
export const FAVOR = {
  start: 50, max: 100, warning: 25,
  bossWin: 8, upsetWin: 5, spectacleWin: 5,
  bossLoss: [-10, -15, -20, -25], forfeitExtra: -5, topTowel: -5, crushingWin: -2, championReturn: -3, unpaidTribute: -25,
};

// Tribute is due at the start of each winter: perYear × the year number. Warning a month ahead.
export const TRIBUTE = { perYear: 15 };

// House revolt before 7.3: average Morale below this for `weeks` weeks in a row ended the career (kept for old saves' fields).
export const REVOLT = { morale: 20, weeks: 4 };
// 7.3 Unrest (docs/roadmap-v7.md, Phase 3). Mutinous fighters add unrest each week; at `warn` the house is warned, and at
// `threshold` (after a warning week) The Chains Break. It cools by `cool` a week while nobody is Mutinous.
// Agitation: a Restless fighter who is Choleric, overtrained or sleeps by a Skull Rack drags a bonded partner (`bondDrag`).
// Incidents: each Mutinous fighter has `incident` chance a week of a brawl, a theft (`theftPerTier` × tier Gold) or an
// escape attempt (caught: +`escapeStress` Stress). The crisis: the coffers (`coffersPerFighter` Gold a fighter: unrest 0,
// +`calmMood` Morale for 4 weeks), the guards (loyalists at Morale `loyalMorale`+ and a garrison of `garrisonPerLevel` ×
// House level, against mutineers below `mutineerMorale`: put down = the ringleader Concussed or Maimed, `putDownFavor`,
// unrest `afterPutDown`; overrun = the career ends), or the Palatine (the plot at cause or ready, once a career).
export const UNREST = {
  threshold: 8, warn: 5, cool: 2, incident: 0.25, theftPerTier: 2, escapeStress: 20, bondDrag: -3,
  coffersPerFighter: 4, calmMood: 15, garrisonPerLevel: 10, loyalMorale: 50, mutineerMorale: 30,
  putDownFavor: -6, afterPutDown: 2, palatineSuspicion: 15, palatineTrust: -1,
  moleTip: 15, // 7.4.1: a palace mole at the head of the revolt tells the palace everything
};

// Speed trains three times as fast as Power: Speed's edge levels off, so it needs to be cheap to be worth a week (tuned with the balanced-fighter gate).
export const TRAIN_GAIN = { power: 1, speed: 3 };

// decorCalm (5.4.0, the designer, from a bug report): a room's calming decor lowers Stress by at most this much a week (it was
// uncapped, and a furnished room took 80 a week, so training never built up Stress).
export const STRESS = { train: 20, fight: 15, rest: -40, medbay: -10, overtrained: 50, max: 100, decorCalm: 30 };

// Weeks an injury takes to heal in the Medbay (Medbay Lv 2+ heals 2 weeks per week).
export const HEAL_WEEKS = { distracted: 1, fleshWound: 1, bleeding: 1, concussed: 2, poisoned: 2, maimed: 3, senseless: 2, blinded: 3 };

export const MONTHS = ['Martius', 'Aprilis', 'Maius', 'Iunius', 'Quintilis', 'Sextilis', 'September', 'October', 'November', 'December'];
export const CALENDAR = { weeksPerMonth: 4, winterWeeks: 4 };

// Gods' Days (roadmap v3, phase B2): festivals on some months' tournament week. Each favours a style or pays out more.
export const FESTIVALS = {
  Maius: { id: 'floralia', name: 'Floralia', god: 'Flora', desc: 'Flowers, wine and a generous crowd: wins pay +50% Gold.', gold: 1.5 },
  Quintilis: { id: 'apollo', name: 'Ludi Apollinares', god: 'Apollo', desc: 'Games for the archer god: ranged fighters (Sagittarius, or a Fighter armed with a Bow, Gun or Spear) get +1 Power.', ranged: 1 },
  September: { id: 'romani', name: 'Ludi Romani', god: 'Jupiter', desc: 'The great games of Rome: wins pay +50% Prestige.', prestige: 1.5 },
  October: { id: 'mars', name: 'Armilustrium', god: 'Mars', desc: 'The god of war loves aggression: fighters who Press get +5% win chance, and every win earns +1 Renown.', tactic: { press: 5000 }, renown: 1 },
  November: { id: 'plebeii', name: 'Ludi Plebeii', god: 'Fortuna', desc: "The people's games, blessed by Fortuna: an upset win pays double Gold and double Favour.", upset: 2 },
  December: { id: 'saturnalia', name: 'Saturnalia', god: 'Saturn', desc: 'The world turned upside down: no buy-ins this tournament week.', freeEntry: true },
};
export const FESTIVAL_BY_ID = Object.fromEntries(Object.values(FESTIVALS).map((f) => [f.id, f]));

export const STAGES = ['Tournament 1', 'Tournament 2', 'Boss Tournament'];

// One circuit per tier: Tournament 1 → Tournament 2 → Boss. Arrays are per stage.
// Version 6 (alpha.2): tiers 2–4 fight 3–4 Power harder (and the Grand Tournament 4), to match the Fortune draft (docs/fight-rules.md).
// Version 6 (alpha.3): the Silver and Imperial Coliseums and the Grand Tournament +1 more, for a first career of 15–35% (docs/plan-v6-phase3.md).
export const CIRCUITS = [
  { tier: 1, name: 'The Dirt Pits', oppPower: [6, 6, 7], buyIn: [1, 1, 2], winGold: [6, 8, 12], winPrestige: [2, 3, 5], lossGold: 2, oppDecor: 1, marketPower: 0, price: 3 },
  { tier: 2, name: 'The Bronze Arena', oppPower: [14, 15, 16], buyIn: [2, 2, 4], winGold: [10, 13, 18], winPrestige: [4, 6, 10], lossGold: 4, oppDecor: 2, marketPower: 2, price: 5 },
  { tier: 3, name: 'The Silver Coliseum', oppPower: [21, 21, 22], buyIn: [3, 3, 6], winGold: [14, 18, 25], winPrestige: [6, 9, 15], lossGold: 6, oppDecor: 3, marketPower: 4, price: 7 },
  { tier: 4, name: 'The Imperial Coliseum', oppPower: [30, 31, 32], buyIn: [4, 4, 8], winGold: [18, 23, 32], winPrestige: [8, 12, 20], lossGold: 8, oppDecor: 3, marketPower: 6, price: 9 },
];

export const GRAND = { name: 'The Grand Tournament', oppPower: 35, buyIn: 10, winGold: 40, winPrestige: 30, lossGold: 10, oppDecor: 3 };

// House Prestige levels: Fibonacci room plots, doubling roster caps (design doc Tab 7). A level, once reached, is kept.
export const PRESTIGE_LEVELS = [
  { level: 1, at: 0, plots: 3, maxFighters: 4 },
  // Playtest #8: thresholds raised (were 10 / 25 / 50 / 90) to offset the +1 Prestige for every tournament win.
  { level: 2, at: 12, plots: 5, maxFighters: 6 },
  { level: 3, at: 30, plots: 8, maxFighters: 12 },
  { level: 4, at: 60, plots: 13, maxFighters: 24 },
  { level: 5, at: 110, plots: 21, maxFighters: 48 },
];

// Training costs at most cheapFee at Dirt/Bronze, midFee at Silver, and full lv from fullFeeFrom (Imperial) up.
export const TRAINING = { fullFeeFrom: 4, cheapFee: 2, midTier: 3, midFee: 3 };

// cost[i] / req[i]: Gold and Prestige level to reach level i + 1 (cost[0] = build). `per` = effect per level.
export const BUILDINGS = {
  quarters: { name: 'Fighter Quarters', dept: 'housing', icon: 'bed', cost: [6, 6, 10], req: [1, 1, 3], per: [2, 4, 5], effect: (n) => `Houses ${n} fighters`, extra: (lv) => `Decor up to ${lv} of each item` },
  entertainment: { unique: true, name: 'Entertainment Room', dept: 'housing', icon: 'lyre', cost: [8, 12], req: [2, 3], per: [15, 30], effect: (n) => `All fighters −${n} Stress each week` },
  trainer: { name: 'Trainer Room', dept: 'training', icon: 'dumbbell', cost: [8, 10, 16, 26, 40], req: [1, 2, 3, 4, 5], per: [3, 5, 8, 13, 21], effect: (n) => `Trains 1 fighter a week; each fighter can train up to ${n} weeks in total`, extra: (lv) => `Training costs ${lv} Gold per fighter-week${lv > TRAINING.cheapFee ? ` (${TRAINING.cheapFee} at Dirt/Bronze, ${Math.min(lv, TRAINING.midFee)} at Silver)` : ''}; your best Trainer Room sets the cap and the fee` },
  medbay: { name: 'Medbay', dept: 'medical', icon: 'cross', cost: [8, 8, 14], req: [1, 2, 4], per: [1, 2, 3], effect: (n) => `Treats ${n} fighter${n > 1 ? 's' : ''} at a time`, extra: (lv) => (lv >= 2 ? 'Heals 2 weeks of injury per week' : 'Heals 1 week of injury per week') },
  oracle: { unique: true, name: 'Oracle', dept: 'scouting', icon: 'eye', cost: [8, 12], req: [2, 3], per: [1, 2], effect: (n) => (n >= 2 ? 'Exact odds, next Boss debuff, and sharper opponent tactic tells' : 'Odds to the nearest 10% and opponent tactic tells') },
  armourer: { unique: true, name: 'Armourer', dept: 'training', icon: 'anvil', cost: [10, 16, 24], req: [2, 3, 4], per: [5, 6, 8], effect: (n) => `Sells ${n} pieces of gear each month, and buys your spare gear back at half price`, extra: (lv) => (lv >= 3 ? 'Stocks Imperial (tier 3) gear' : lv >= 2 ? 'Stocks fine (tier 2) gear' : 'Stocks basic (tier 1) gear') },
  // Playtest #8: pray for different perk choices; and exhibition bouts between your own fighters on tournament day.
  temple: { unique: true, name: 'Temple of Fortuna', dept: 'training', icon: 'temple', cost: [8, 12], req: [2, 3], per: [3, 1], effect: (n) => `Pray for a fighter's level-up perks: ${n} Gold for three new choices` },
  // Fun idea #7: host the Senate for Influence, and spend it on policies.
  lounge: { unique: true, name: 'Patron Lounge', dept: 'scouting', icon: 'goblet', cost: [12, 18], req: [3, 4], per: [1, 2], effect: (n) => `Host the Senate once a month for Influence; up to ${n} polic${n > 1 ? 'ies' : 'y'} in force at a time` },
  // secret: only shown once the resistance asks for it (5.4.0). The name is the designer's to change.
  gallery: { unique: true, secret: true, name: 'Whispering Gallery', dept: 'scouting', icon: 'eye', cost: [10], req: [2], per: [2], effect: (n) => `Shows how much the palace suspects your house and how close the rising is; suspicion −${n} a month` },
  exhibition: { unique: true, name: 'Exhibition Ring', dept: 'training', icon: 'swords', cost: [10], req: [2], per: [1], effect: () => 'On tournament day, two fighters who aren\'t competing can fight an exhibition bout: XP for both, Renown and Gold for the winner, and no risk of death' },
  // 5.3.0: replaces the Stables (a save with Stables gets this at the same level). Name and words are PLACEHOLDER for the designer.
  vulcan: { unique: true, name: 'Unnatural Temple of Vulcan', dept: 'medical', icon: 'forge', cost: [10, 16], req: [2, 3], per: [4, 12], effect: (n) => `Raises a fighter killed in the arena as a Revenant, up to ${n} weeks after their death`, extra: (lv) => (lv >= 2 ? 'Revenants come back with all their strength' : 'Revenants come back with 1 less Power') },
  liaison: { unique: true, name: 'Liaison', dept: 'scouting', icon: 'chain', cost: [6, 10], req: [2, 4], per: [1, 2], effect: (n) => (n >= 2 ? 'Monthly elite prisoner of war' : 'Monthly cheap condemned convict'), note: () => 'Read their prison records: not every prisoner is what the guards say.' },
};

export const DEPARTMENTS = {
  housing: 'Housing & Morale',
  training: 'Training',
  medical: 'Medical',
  scouting: 'Scouting & Politics',
};

export const STARTING_BUILDINGS = ['quarters', 'trainer', 'medbay'];

// ---- v2: growth, morale, gear ----

// Speed as evasion: each point of Speed above the opponent's lowers your chance to be injured (4%, up to 20%).
export const EVASION = { perPoint: 4000, max: 20000 };

// XP to reach levels 2..6. Each level-up offers a choice of 3 perks.
export const XP = { win: 3, loss: 1, bossMultiplier: 2, upsetBonus: 2, levels: [3, 8, 15, 25, 40] };

// `req(f)` gates combo perks; `stat` perks change the fighter once, the rest are checked in the engine or run.
export const PERKS = {
  mighty: { name: 'Mighty', desc: '+1 Power.', tags: ['brute'], stat: { power: 1 }, repeatable: true },
  swift: { name: 'Swift', desc: '+3 Speed.', tags: ['swift'], stat: { speed: 3 }, repeatable: true },
  thickSkin: { name: 'Thick Skin', desc: '−5% chance to be injured.', tags: ['guarded'] },
  killer: { name: 'Killer Instinct', desc: '+5% chance to injure.', tags: ['brute'] },
  fastStart: { name: 'Fast Starter', desc: '+5% win chance in Round 1.', tags: ['swift'] },
  closer: { name: 'Closer', desc: '+5% win chance in Round 3.', tags: ['showman'] },
  ironConstitution: { name: 'Iron Constitution', desc: 'Training adds 10 less Stress.', tags: ['guarded'] },
  crowdPleaser: { name: 'Crowd Pleaser', desc: '+1 extra Renown for every win.', tags: ['showman'] },
  merciful: { name: 'Merciful', desc: 'Sparing an opponent always wins the crowd over: the Renown and Morale bonus, even when they called for blood.', tags: ['showman'] },
  survivor: { name: 'Survivor', desc: 'Once injured: −10% chance to be injured; −20% at 2+ injuries.', tags: ['guarded'], req: (f) => f.level >= 3, reqText: 'Level 3+' },
  duelist: { name: 'Duelist', desc: '+5% win chance and +5% chance to injure.', tags: ['brute', 'swift'], req: (f) => f.power >= 9 && f.speed >= 7, reqText: 'Power 9+ and Speed 7+' },
  tactician: { name: 'Tactician', desc: 'Striking first is worth +15% instead of +10%.', tags: ['swift'], req: (f) => f.speed >= 9 && f.power >= 8, reqText: 'Speed 9+ and Power 8+' },
  bloodthirsty: { name: 'Bloodthirsty', desc: '+10% chance to injure an opponent who is already hurt.', tags: ['brute'] },
  counterpuncher: { name: 'Counterpuncher', desc: '+10% win chance in a round after losing one.', tags: ['showman'] },
  ironWill: { name: 'Iron Will', desc: 'The Death Gate opens one injury later.', tags: ['guarded'], req: (f) => f.level >= 4, reqText: 'Level 4+' },
  juggernaut: { name: 'Juggernaut', desc: '+1 Power and −5% chance to be injured.', tags: ['brute', 'guarded'], stat: { power: 1 }, req: (f) => f.power >= 12, reqText: 'Power 12+' },
};

// Version 6: the monthly Fortune draft (src/fortune.js). `rarity` weights; `kinds` weights for what a card is; rerolls cost
// Gold, rising each time in a month; `pass` is the Gold for taking nothing. PLACEHOLDER numbers (docs/fight-rules.md).
export const FORTUNE = {
  enabled: true, fromWeek: 4, cards: 3, maxRelics: 6, tagCap: 3,
  rarity: { common: 62, rare: 30, legendary: 8 },
  kinds: { relic: 4, boon: 4, gear: 2, fighter: 2, wager: 1, legend: 1 }, // legend: a returning Hall legend (a Legacy unlock)
  reroll: [3, 6, 10], pass: 2,
  fighterPower: { common: 0, rare: 2, legendary: 4 }, legendRenown: 6,
  // Phase 5 (LLM-13: every fighter card was useless from Silver on): a drafted fighter arrives at least this far behind your
  // second-best fighter's Power, before the card's rarity bonus.
  fighterBehind: 2,
  wager: { winGoldPerTier: 5, winRenown: 2, lossGoldPerTier: 3 },
};

// Bloodied Victory: winning with 2+ injuries (on top of FAVOR.spectacleWin).
export const BLOODIED = { renown: 2, xp: 2, morale: 5 };

// Renown (fame) and Morale. Comfort raises Morale; expectations grow with Renown.
export const RENOWN = { win: 2, bossWin: 3, upset: 1, towel: -1, goldPer: 5 }; // +1 Gold per 5 Renown on wins
export const MORALE = {
  start: 60, drift: 10, driftDown: 3, base: 40, perQuartersLevel: 10, perEntertainmentLevel: 10, expectationPerRenown: 2, maxExpectation: 60,
  win: 10, loss: -5, towel: -5, allyDeath: -10, crowdJeers: -10,
  inspired: 80, restless: 40, mutinous: 20, inspiredWin: 5000,
};

// Consumables: single-use, one per fight, used before or between rounds. `boost` lasts the next round only.
export const CONSUMABLES = {
  warPaint: { name: 'War Paint', price: 4, desc: '+1 Power next round.', boost: { power: 1 } },
  adrenaline: { name: 'Adrenaline Draught', price: 3, desc: '+3 Speed next round; +15 Stress after the fight.', boost: { speed: 3 }, stressAfter: 15 },
  blessedBandage: { name: 'Blessed Bandage', price: 3, desc: '−10% chance to be injured next round, and staunches one Bleeding wound for the rest of the fight.', boost: { guard: 10000 }, staunch: true },
  ironTonic: { name: 'Iron Tonic', price: 3, desc: '+5% win chance next round.', boost: { win: 5000 } },
  viperVenom: { name: 'Viper Venom', price: 3, desc: '+10% chance to injure next round; 65% of wounds it lands turn to Poison (a hard hit can make a lighter wound Poisoned).', boost: { injure: 10000, affinity: { style: 'poison', chance: 65000, upWeight: 1 } } },
  bloodThinner: { name: 'Blood Thinner', price: 3, desc: '+10% chance to injure next round; 75% of light wounds it lands bleed.', boost: { injure: 10000, affinity: { style: 'bleed', chance: 75000, upWeight: 1 } } },
  blindingPowder: { name: 'Blinding Powder', price: 4, desc: 'Next round, 60% of wounds go for the eyes: a hard hit Blinds, a light one only Distracts. A Cyborg Eye shrugs it off.', boost: { affinity: { style: 'blindPowder', chance: 60000, upWeight: 1 } } },
  berserkerMushroom: { name: 'Berserker Mushroom', price: 4, desc: '+2 Power next round, but +10% chance to be injured.', boost: { power: 2, self: 10000 } },
  throwingNet: { name: 'Throwing Net', price: 4, desc: 'The opponent has −3 Speed next round.', foe: { speed: -3 } },
  smellingSalts: { name: 'Smelling Salts', price: 3, desc: 'Clears a Distracted or Concussed wound for the rest of this fight (it still needs healing after).', salts: true },
  crowdBribe: { name: 'Crowd Bribe', price: 6, desc: 'If you capitulate this fight, the crowd forgives it: no Favour or Renown lost for capitulating (losing a Boss still counts).', bribe: true },
};

// Gear: one weapon and one armour slot per fighter. `guard` lowers the chance to be injured (counts as armour).
export const GEAR = {
  gladius: { name: 'Gladius', slot: 'weapon', tier: 1, price: 7, power: 1 },
  spikedGauntlet: { name: 'Spiked Gauntlet', slot: 'weapon', tier: 1, price: 5, injure: 10000, win: 2000 },
  hunterBow: { name: "Hunter's Bow", slot: 'weapon', tier: 1, price: 14, speed: 1, win: 3000 },
  warMaul: { name: 'War Maul', slot: 'weapon', tier: 2, price: 12, power: 2, speed: -1 },
  trident: { name: 'Trident', slot: 'weapon', tier: 2, price: 10, power: 1, injure: 8000 },
  serratedSpatha: { name: 'Serrated Spatha', slot: 'weapon', tier: 2, price: 22, power: 1, speed: 2 },
  leatherVest: { name: 'Leather Vest', slot: 'armor', tier: 1, price: 5, guard: 5000 },
  lightGreaves: { name: 'Light Greaves', slot: 'armor', tier: 1, price: 14, speed: 1, guard: 3000 },
  bronzeCuirass: { name: 'Bronze Cuirass', slot: 'armor', tier: 2, price: 9, guard: 10000 },
  scaleMail: { name: 'Scale Mail', slot: 'armor', tier: 2, price: 16, guard: 8000, power: 1 },
  woodenBuckler: { name: 'Wooden Buckler', slot: 'armor', tier: 1, price: 7, guard: 4000, win: 2000 },
  throwingAxes: { name: 'Throwing Axes', slot: 'weapon', tier: 2, price: 17, power: 1, speed: 1, injure: 3000 },
  imperialGladius: { name: 'Imperial Gladius', slot: 'weapon', tier: 3, price: 32, power: 2, speed: 2 },
  executionerAxe: { name: "Executioner's Axe", slot: 'weapon', tier: 3, price: 22, power: 2, injure: 12000 },
  loricaSegmentata: { name: 'Lorica Segmentata', slot: 'armor', tier: 3, price: 22, guard: 15000, power: 1 },
  lionPelt: { name: 'Lion Pelt', slot: 'armor', tier: 3, price: 18, guard: 8000, win: 6000 },
};

export const BOSS_DEBUFFS = {
  firstInjuryDouble: { name: 'First Blood Counts Double', desc: 'The first injury your fighter takes counts as two, opening the Death Gate at once.' },
  rainyMud: { name: 'Rainy Mud', desc: 'Your fighter has −2 Speed every round.' },
  noArmor: { name: 'Stripped of Armour', desc: "Your fighter's armour doesn't work: Alloyed Skin, Thick Hide, Ego Armour and armour gear. Speed evasion still does." },
  ironRules: { name: 'Iron Rules', desc: 'Room decor gives no bonus to your fighter.' },
  bloodMoon: { name: 'Blood Moon', desc: 'Both fighters have +10% chance to be injured.' },
  crowdFavorite: { name: 'Crowd Favourite', desc: 'The champion fights with +1 Power.' },
  lions: { name: 'Lions in the Arena', desc: 'Hungry lions roam the sand: the Death Gate opens one injury earlier for both fighters.' },
  emperorsGaze: { name: "The Emperor's Gaze", desc: 'The Emperor is watching: no capitulating in this fight.' },
};

// Weapon and style matchups (v5): a fighter's style is their weapon if they're a Fighter, otherwise their class.
// `vs` lists opposing styles (or 'armor': any armour gear). win/injure apply to the first fighter.
export const MATCHUPS = [
  { style: 'spear', vs: ['cestus', 'fists', 'dagger'], win: 5000, why: 'Reach keeps brawlers at bay' },
  { style: 'club', vs: ['armor'], injure: 10000, why: 'Crushes armour' },
  { style: 'axe', vs: ['samnite', 'armor'], injure: 5000, why: 'Splits shields and plate' },
  { style: 'sword', vs: ['dagger', 'club'], win: 5000, why: 'Outfences short and clumsy weapons' },
  { style: 'dagger', vs: ['retiarius', 'sagittarius'], win: 5000, why: 'Inside their guard' },
  { style: 'retiarius', vs: ['sword', 'axe'], win: 5000, why: 'The net tangles a blade' },
  { style: 'bow', vs: ['retiarius'], win: 5000, why: 'Shoots before the net flies' },
  { style: 'flail', vs: ['samnite', 'sword'], injure: 5000, why: 'Swings around a guard' },
];

export const NAMES = [
  'Aurelia', 'Brutus', 'Cassia', 'Drusus', 'Flamma', 'Gaius', 'Hilarus', 'Ixa', 'Juno', 'Krell',
  'Livia', 'Marcus', 'Nyx', 'Octavia', 'Priscus', 'Quintus', 'Rusta', 'Spiculus', 'Tigris', 'Ursa',
  'Verres', 'Vex', 'Xanthe', 'Zorak', 'Carpophorus', 'Verus', 'Thraxa', 'Sol-9', 'Unit Kappa', 'Grosh',
  'Aelia', 'Bellona', 'Crixus', 'Decima', 'Eppia', 'Fulvia', 'Gannicus', 'Hector', 'Iulia', 'Kaeso',
  'Lucilla', 'Mevia', 'Naevius', 'Oenomaus', 'Pugnax', 'Rufa', 'Sabina', 'Tetraites', 'Ulfa', 'Vibia',
  'Agron', 'Barca', 'Cato', 'Duma', 'Ennia', 'Felix', 'Glabra', 'Hostus', 'Ilithya', 'Kroth',
  'Lyra', 'Morg', 'Nerva', 'Orsk', 'Pavo', 'Riva', 'Seren', 'Torq', 'Unit Delta', 'Unit Sigma',
  'Vorath', 'Wyrr', 'Yssa', 'Zenna', 'Ashka', 'Brakk', 'Celeste', 'Dask', 'Elowen', 'Fenn',
  'Atticus', 'Briseis', 'Castor', 'Dacia', 'Euryale', 'Fausta', 'Galla', 'Hadria', 'Ignatia', 'Jovan',
  'Kastra', 'Lepida', 'Maximus', 'Nonia', 'Orbilia', 'Pollux', 'Quarta', 'Remus', 'Scaeva', 'Tullia',
  'Urgulania', 'Valens', 'Gorrak', 'Hessa', 'Mordra', 'Skarn', 'Thessaly', 'Vael', 'Ysolde', 'Zarek',
  'Unit Theta', 'Unit Omega', 'Sol-4', 'Ferrum', 'Calyx', 'Nyssa', 'Ruun', 'Ghast', 'Lirien', 'Corvax',
  // Playtest #8: 60 more, so names don't come round again so soon.
  'Albia', 'Bassus', 'Caelia', 'Dentatus', 'Egnatia', 'Fabius', 'Gratia', 'Herennius', 'Iunia', 'Lentulus',
  'Marcia', 'Novius', 'Opimia', 'Pertinax', 'Rutila', 'Servius', 'Tertia', 'Varus', 'Vipsania', 'Aemilius',
  'Bragga', 'Drogga', 'Hruk', 'Kulgra', 'Murr', 'Rakka', 'Sorg', 'Thokk', 'Urza', 'Vrask',
  'Aeris', 'Caelan', 'Ithil', 'Liora', 'Maelis', 'Nimue', 'Sylvar', 'Thalen', 'Vaelin', 'Ysra',
  'Unit Lambda', 'Unit Zeta', 'Unit Rho', 'Sol-2', 'Sol-7', 'Cobalt', 'Gearwright', 'Tessel', 'Vanta', 'Axiom',
  'Morwen', 'Sanguis', 'Vesper', 'Nocturne', 'Draven', 'Ilsa', 'Corvina', 'Hesper', 'Lucan', 'Sabra',
];

// Seasoned recruits: levels per arena tier and Gold added per level above 1.
export const RECRUIT = { levels: [[1], [1, 2], [2], [2, 3]], perLevel: 2 };

// Patron Lounge: host the Senate for Influence, spend Influence on temporary policies.
export const LOUNGE = {
  hostGold: 2, renownPer: 10, maxInfluence: 3, weeks: 16, loyalistSuspicion: -10, reformistSuspicion: 5,
  policies: {
    breadAndCircuses: { name: 'Bread and Circuses', cost: 3, lean: 'loyalist', desc: 'Every purse pays 25% more.' },
    edictOfMercy: { name: 'Edict of Mercy', cost: 2, lean: 'reformist', desc: 'Sparing a beaten opponent earns Favour in every arena, not just your top one.' },
    lowerTribute: { name: 'Lower the Tribute', cost: 4, lean: 'reformist', desc: 'This year\'s tribute is 30% lower.' },
    unleashLions: { name: 'Unleash the Lions', cost: 3, lean: 'loyalist', desc: 'Bosses fight with +1 Power, but beating one pays double Prestige.' },
    grainToLudus: { name: 'Grain to the Ludus', cost: 2, lean: 'neutral', desc: '+5 comfort for every fighter.' },
    purgePrisons: { name: 'Purge the Prisons', cost: 2, lean: 'loyalist', desc: 'No political prisoners are offered while it lasts.' },
    amnesty: { name: 'Amnesty', cost: 2, lean: 'reformist', desc: 'Political prisoners are twice as common while it lasts.' },
  },
};

// Unnatural Temple of Vulcan: raises a fallen fighter as a Revenant.
export const REANIMATE = { price: 6, perTier: 4, power: -1, morale: 50 };

// Live crowd hype meter (0–100): at `favour` or more, your fighter gets +`favourPower` Power next round.
export const HYPE = { risen: 20, upset: 25, wound: 15, kill: 40, comeback: 20, signature: 10, press: 15, guard: -10, allIn: 25, read: 10, favour: 35, favourPower: 1, max: 100, renownPer: 35, goldPer: 50, lossRenownPer: 50 };

// Opponent tactic tells: accuracy by Oracle level.
export const INTENT = { accuracy: [0, 0.7, 0.85] };
export const BOND = { comfort: 8, mentorGap: 3, mentorXp: 1, grief: -20 };
export const DEMAND = { bloodiedKills: true, chance: 0.5, fromWeek: 8, favor: 2, goldPerTier: 2, missFavor: -4 };
export const DEMANDS = {
  topWin: { goal: 'Win a match in your top arena', say: 'My guests are bored, Lanista. Give them a victory in your top arena this month.' },
  bloodied: { goal: 'Win a Bloodied Victory (a win with 2+ injuries, or one where your opponent dies)', say: 'I want to see blood on a winner. Win me a bloody victory this month.' },
  kill: { goal: 'Finish a beaten opponent (thumbs down)', say: 'The crowd grows soft. Give them a death this month.' },
  spare: { goal: 'Spare a beaten opponent (thumbs up)', say: 'The Senate calls me cruel. Show them my clemency: spare someone in the arena this month.' },
  twoArenas: { goal: 'Win in two different arenas on fight day', say: 'Show me the depth of your house. Win in two of my arenas this month.' },
};
export const BET = { cut: 0.9, maxOdds: 5, perTier: 10, stakes: [2, 5, 10, 20] };

// Season mode (short career): Tournament -> Boss per tier, scaled purses, training, market, and opponent Power.
export const SHORT = { purse: 1.6, prestige: 2.5, startGold: 20, startPrestige: 12, train: 2, rematch: false, trainCap: 0, oppPower: [2, 4, 9, 12], grandPower: 19, marketPower: [0, 2, 6, 10], bossLoss: 1.2, rival: 1 };
export const NEMESIS = {
  returnChance: 0.35, minWeeks: 8, powerPerWin: 1, maxBonus: 3, renown: 3, goldPerTier: 5, favor: 3, max: 3,
  epithets: ['the Butcher', 'Bonebreaker', 'the Jackal', 'Sandreaper', 'the Grinning', 'Widowmaker', 'the Patient', 'Ironhide', 'the Mocking', 'Gravedigger', 'the Smiling Knife', 'Lionheart'],
};
export const EXHIBITION = { xpWin: 2, xpLoss: 1, renown: 1, goldPerTier: 1, woundChance: 0.15 };
export const LIAISON = { convictPrice: 2, elitePrice: 3, elitePerTier: 2, elitePower: -1, offers: [2, 3] };
export const POLITICAL = { chance: 0.25, guaranteeYear: 2, priceCut: 2, falseClue: 0.25 };
export const QUESTS = { stewardFromWeek: 4, goldScale: 0.5, prestige: 0, talkPerWeek: 2 };
export const FIGHTER_WANTS = { chance: 0.35, max: 2, metMorale: 10, metRenown: 2, metXp: 2, missMorale: -10, roomItems: ['bathhouse', 'shrine', 'trophy'], titleReach: 3 };
export const RIVAL = { championFrom: 2, minWeeks: 12, chance: 0.35, power: 1, maxBonus: 2, beatGold: 4, beatRenown: 3, beatGlory: 5, winGlory: 3, poachChance: 0.15, monthGlory: 2, oppShare: 0.07, earlyAtFinal: true };
export const REBEL_QUEST = { galleryTrust: 1, lobbyTrust: 2, missTrust: -1, afterMark: 4, overflowSuspicion: 5 };

// Emperor's summons: once per career before Tier 4 opens. Swept 0–2 costs sweptFavor; surviving 3 rounds earns surviveFavor/surviveRenown.
export const SUMMONS = { fromWeek: 5, chance: 0.1, refuseFavor: -40, surviveFavor: 5, surviveRenown: 3, sweptFavor: -5, winFavor: 15, winRenown: 8, yieldFavor: -5, tier: 4 };

// The Emperor's spy (5.4.0): executing them lowers the hidden plot's suspicion by `suspicion`; keeping them raises it.
// 7.4 Espionage (docs/roadmap-v7.md, Phase 4; src/run/espionage.js, its own dice). Moles: a Mutinous fighter may be flipped
// (`flip` a week) by a feuding house, or by the palace once suspicion is `palaceSuspicion`+; some months (`plant`) one Market
// fighter is a rival's mole, cheap for their Power. A mole leaves no trace their first week; then each week `clue` chance of
// a clue, and once seen, `act` chance to act: tell their house your plans (+`leakPower` Power to its fighters against you on
// the next fight day) or, for the palace, +`palaceLeak` suspicion. Investigate any fighter (`investigate` Gold) once a clue
// is found; an Oracle Lv 2 or the Whispering Gallery names two suspects. Unmasked: execute (`executeSuspicion` for a palace
// mole, or `executeGlory` from their house; `executeMorale` house-wide), turn them (`turnCost` Gold: +`falsePlaybook` Round-1
// win against their house), or ransom them back (`ransom` Gold, the feud ends). Covert ops: at most one a month, with a
// Liaison or the Whispering Gallery, against the next top-arena opponent.
export const ESPIONAGE = {
  flip: 0.25, palaceSuspicion: 40, plant: 0.15, plantDiscount: 0.5, clue: 0.5, act: 0.3, investigate: 2, offended: -5,
  leakPower: 1, palaceLeak: 3, executeSuspicion: -15, executeGlory: -3, executeMorale: -5, turnCost: 4, falsePlaybook: 10000, ransom: 8,
  caughtFavor: -5, feudMonths: 3,
  ops: {
    playbook: { name: 'Steal the Playbook', cost: 3, chance: 0.75, galleryBonus: 0.1, desc: "Read the opponent's Round-1 tactic exactly. Caught: they fight with Vengeance (+5% win)." },
    wine: { name: 'Doctor the Wine', cost: 6, chance: 0.6, agentBonus: 0.15, desc: 'The opponent arrives Bleeding, or sluggish (−1 Power). Caught: −5 Favour and a 3-month feud with their house.' },
    armourer: { name: 'Bribe the Armourer', cost: 7, chance: 0.6, desc: "The opponent's armour gear does nothing in the bout. Caught: −5 Favour, and the Gold is gone." },
  },
};

export const SPY = { suspicion: 15, perMonth: 2 }; // perMonth: suspicion each month while a spy you kept is in the house

export const PLOT = {
  gap: [3, 6], firstGap: [1, 3], refusalsToCold: 2, survivesAt: 2,
  // cause: trust, favours done and weeks since the Mark it takes (playtest #7: Acts 1–2 were over in 7 weeks); offerAfter: the
  // prefect's offer waits this long into the Cause, so betrayal has something to cost. maxTrust: trust stops piling up here.
  cause: { trust: 4, favours: 3, weeks: 12, houseLevel: 3 }, ready: { trust: 6 }, offerAfter: 15, maxTrust: 10, priestMorale: 5,
  // confessTrust (5.4.0, the designer: the rebel told everything the week they arrived): the confession waits for this much trust.
  confessTrust: 3,
  suspicion: { perPrisoner: 1, perContact: 1, decay: 2, courier: 3, watch: 20, informer: 40, cold: 60, raid: 80 },
  // armedWin: the coup Final's armed barracks rising with your champion; contactWin: each contact's voice in the crowd.
  armedWin: 10000, contactWin: 5000, contactMax: 20000, freeCost: 8, passCost: 8, bribe: 15, clemencyFavor: 8, betrayFavor: 30, betrayGold: 22, betrayRelic: 'eagle', // betrayGold: the Emperor's purse for the names, × tier
};
