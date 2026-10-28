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
export const INJURY_ROLL = { perInjury: 25, perPowerGap: 5 }; // v5: was 20 (the user asked for more deaths)

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
  underdog: { name: 'Underdog', desc: '+2 Power when the opponent has 2 or more Power more.' },
  unbreakable: { name: 'Unbreakable', desc: 'The Death Gate opens at 3 injuries instead of 2.' },
  bloodlust: { name: 'Bloodlust', desc: '+1 Power once the opponent is injured.' },
  // v5 kinds
  bloodDrinker: { name: 'Blood Drinker', desc: 'Wounding the opponent heals this fighter\'s newest light wound (Flesh Wound or Distracted) taken this match.' },
  nightborn: { name: 'Nightborn', desc: '+1 Power in Round 3.' },
  mesmerize: { name: 'Mesmerize', desc: '+5% win chance in Round 1.' },
  thickHide: { name: 'Thick Hide', desc: 'Armor: −10% chance to be injured.' },
  pounce: { name: 'Pounce', desc: '+3 Speed in Round 1.' },
  rampage: { name: 'Rampage', desc: 'Each round won gives +1 Power for the rest of the match.' },
};

// Tactics: chosen before each round. Press beats Feint, Feint beats Guard, Guard beats Press (+10% win chance to the counter).
export const TACTICS = {
  steady: { name: 'Steady', icon: '•', desc: 'No change: fight your usual fight.' },
  press: { name: 'Press', icon: '🗡', desc: '+3% win chance and +5% chance to injure, but +7.5% chance to be injured.', win: 3000, injure: 5000, self: 7500 },
  guard: { name: 'Guard', icon: '🛡', desc: '−15% chance to be injured, −5% win chance.', win: -5000, self: -15000 },
  feint: { name: 'Feint', icon: '↯', desc: '+10% win chance if you strike first this round (faster fighters strike first more often).', firstStrike: 10000 },
};
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
  friend: { name: 'A Friend at Court', desc: 'Start with +15 Imperial Favor.' },
  purse: { name: "A Merchant's Purse", desc: 'Start with +10 Gold.' },
  warChest: { name: 'The War Chest', desc: 'Start with 2 War Paint and a Blessed Bandage.' },
  defector: { name: 'A Defector', desc: 'A strong fighter from a rival house joins you at the start (Power +3).' },
};

// Emperor's Decrees: optional harder rules for a career, after your first win. Each adds to the score.
export const DECREES = {
  ironBosses: { name: 'Iron Bosses', desc: 'Every Boss fights with +1 Power.', score: 30 },
  greedyEmperor: { name: 'A Greedy Emperor', desc: 'Tribute costs 50% more.', score: 20 },
  harshJudges: { name: 'Harsh Judges', desc: 'Losing or forfeiting a Boss costs 5 more Favor.', score: 20 },
};

// Fighter stories (roadmap v3, phase C). Scars come from surviving severe wounds (`vs`: 'melee' or 'ranged', the style
// of the opponent who caused it); Battle-Hardened from a Bloodied Victory. Values: power, enemy (to injure), self (to be injured).
export const SCARS = {
  afeared: { name: 'Afeared', desc: 'Against this style: −1 Power and −10% chance to injure, but fights warily (−10% chance to be injured).', power: -1, enemy: -10000, self: -10000 },
  enraged: { name: 'Enraged', desc: 'Against this style: +1 Power and +15% chance to injure, but reckless (+15% chance to be injured).', power: 1, enemy: 15000, self: 15000 },
  hardened: { name: 'Battle-Hardened', desc: 'Won bloodied and lived: −5% chance to be injured.', self: -5000 },
};
export const SCAR_CHANCE = 0.5; // chance a survived severe wound (Concussed or worse) leaves a scar
export const SEVERE = ['concussed', 'poisoned', 'maimed', 'senseless', 'blinded'];

// Cyborg surgery (Medbay Lv 2+): replace a Maimed limb or Blinded eye. The crowd distrusts machines.
export const AUGMENTS = {
  arm: { name: 'Cyborg Arm', from: 'maimed', desc: '+1 Power. Replaces a Maimed limb.', power: 1 },
  eye: { name: 'Cyborg Eye', from: 'blinded', desc: '+1 Power, and can never be Blinded again. Replaces a Blinded eye.', power: 1 },
};
export const SURGERY = { cost: 10, perTier: 4, renown: -1, medbay: 2 }; // playtest #3: was 15 + 5/tier and −2 Renown, never worth it

// Retiring a veteran (level 4+ or a Title) to the Hall of Champions.
export const RETIRE = { level: 4, prestige: 5, morale: 10 };

// Brackets (playtester request): from the Silver Coliseum up, a tournament is three matches in a row for one fighter.
// The Quarter- and Semi-final opponents are weaker than the listed (Final) opponent by `power`; each early win pays `purse` Gold × tier.
// Early (Quarter- and Semi-final) wins pay `purse` × tier Gold and `prestige` flat Prestige. Prestige drives House level and
// the Trainer cap, so it snowballs: +1 per early win added ~15 points of careful win rate, and refunding the buy-in on a
// lost Final ~9. Playtest #6's "brackets pay nothing" is answered with Gold instead (purse 2 → 3).
export const BRACKET = { fromTier: 3, rounds: ['Quarter-final', 'Semi-final', 'Final'], power: [-4, -3, 0], purse: 3, prestige: 0, earlyBossLoss: 0.5 };
// prestige: × tier for each early win (swept: 1 took careful careers from 41% to 54%, so it's off); earlyBossLoss: share of the Boss-loss Favor for losing before the Final. // swept: -3/-2 took careful careers to 22%, -4/-3 to 28%

// Kill marks: earned for opponents killed in the arena (fighters keep a tally).
// Underdog (Human trait): +2 Power when the opponent has at least `gap` more (playtest #6: at 0 a cheap Human was the best fighter).
export const UNDERDOG = { gap: 2 };

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
  // Exotic: only from the Stables.
  basa: { name: 'Basa', basePower: 6, traits: ['thickHide', 'pounce', 'rampage'], exotic: true },
};

export const CLASSES = {
  cestus: { name: 'Cestus', ability: 'Progressive Overload', desc: 'Each round: +3/6/9% win chance and +5/10/15% injure chance.' },
  sagittarius: { name: 'Sagittarius', ability: 'First Volley', desc: 'Each round (unless Blinded): coin flip for +10% win chance or +10% injure chance.' },
  ornitharius: { name: 'Ornitharius', ability: 'Birds of Prey', desc: 'Once injured: +5% injure chance per Bird in quarters.' },
  fighter: { name: 'Fighter', ability: 'Weaponsmaster', desc: 'Fights with a weapon specialty.' },
  retiarius: { name: 'Retiarius', ability: 'Net and Trident', desc: 'Winning a round entangles the opponent: −3 Speed next round.' },
  ashHungry: { name: 'Ash-Hungry', ability: 'Ash Stacks', desc: 'Each injury they inflict: +1 Power and +5% chance to injure for the rest of the match.' },
  bloodBearer: { name: 'Blood-Bearer', ability: 'Off-Hand', desc: '+5% win chance; losing a round gives a free 15% off-hand strike at the winner.' },
  // Legacy classes: they appear in the market once a past career has unlocked them (src/legacy.js).
  thornBlade: { name: 'Thorn-Blade', ability: 'Thorn Lash', desc: 'Winning a round gives the opponent −2 Speed and −1 Power next round.', legacy: true },
  samnite: { name: 'Samnite', ability: 'Shield Wall', desc: '20% chance to parry an injury with the shield; Concussed never costs them the first strike.', legacy: true },
};

// Signature moves: from level 3, once per fight, a fighter can unleash their class's move for the next round.
// Seasoned opponents (SIGNATURE.level) use theirs too: when they fall behind, or in Round 3. Values in ChanceE5 like the rest.
// `level`: when your fighters unlock theirs. Opponents: `bossLevel` in a Boss tournament (every round, from the Bronze
// Arena); `opponentLevel` otherwise, and then only in a tournament's Final, not its Quarter- or Semi-final (playtest #6:
// every Silver regular firing one was too much; none at all made careers too easy).
export const SIGNATURE = { level: 3, bossLevel: 3, opponentLevel: 3 };
export const SIGNATURES = {
  cestus: { name: 'Haymaker', desc: 'Next round: +2 Power, but +10% chance to be injured.', boost: { power: 2, self: 10000 } },
  sagittarius: { name: 'Aimed Shot', desc: 'Next round: +10% win chance and +20% chance to injure.', boost: { win: 10000, injure: 20000 } },
  ornitharius: { name: 'Hawk Strike', desc: 'Next round: +5% win chance, +10% chance to injure, and the opponent −3 Speed.', boost: { win: 5000, injure: 10000 }, foe: { speed: -3 } },
  fighter: { name: "Champion's Blow", desc: 'Next round: +15% win chance.', boost: { win: 15000 } },
  retiarius: { name: 'Cast the Net', desc: 'Next round: the opponent −5 Speed and −10% win chance.', foe: { speed: -5, win: -10000 } },
  ashHungry: { name: 'Feed the Ash', desc: 'One Ash Stack now: +1 Power and +5% to injure for the rest of the match.', ash: 1 },
  bloodBearer: { name: 'Twin Fangs', desc: 'Next round: +10% win chance and +10% chance to injure.', boost: { win: 10000, injure: 10000 } },
  thornBlade: { name: 'Thorn Storm', desc: 'Next round: the opponent −2 Power and −2 Speed.', foe: { power: -2, speed: -2 } },
  samnite: { name: 'Shield Bash', desc: 'Next round: −20% chance to be injured and +10% win chance.', boost: { self: -20000, win: 10000 } },
};

// Thumbs up or down: after a win over a wounded opponent, you decide their fate.
// The crowd calls for blood against a feuding house or a beaten fighter at the Death Gate; otherwise for mercy.
// Doing what the crowd wants earns +1 Renown and +5 Morale on top, and a kill the crowd demanded starts no feud
// (the crowd's will is law); killing against its wishes does.
// Going against the crowd is a real choice: sparing a fighter it wanted dead ends their house's feud and makes the house
// owe you a life (−1 Power against you for HOUSES.feudMonths); killing one it wanted spared adds infamy (+Renown) and a feud.
// Sparing gives Favor only in your top arena (only it affects Favor).
export const MERCY = { minInjuries: 1, spareFavor: 2, killRenown: 2, infamyRenown: 2, crowdRenown: 1, crowdMorale: 5 };

export const WEAPONS = {
  club: { name: 'Club', ability: 'Knock Prone', desc: 'Winning a round gives the opponent −2 Speed and −5% win chance next round.' },
  fists: { name: 'Fists', ability: 'Disarm', desc: "Winning a round disables the opponent's class ability next round." },
  bow: { name: 'Bow', ability: 'Pin at Range', desc: 'Rounds 1–2: +1 Power against melee-only opponents (unless Blinded).' },
  spear: { name: 'Spear', ability: 'First-Strike Reach', desc: "Round 1: +3 Speed. Negates the opponent's Bow bonus." },
  sword: { name: 'Sword', ability: 'Riposte', desc: '20% chance to parry an injury; a parry gives +3 Speed next round.' },
  flail: { name: 'Flail', ability: 'Shield-Breaker', desc: 'Injury checks ignore enemy parries and armor.' },
  gun: { name: 'Gun', ability: 'Armor-Piercing Volley', desc: 'Rounds 1 and 3 (unless Blinded): +15% injure chance, ignores armor.' },
  axe: { name: 'Axe', ability: 'Cleave', desc: 'Wounds they inflict are worse: +15 on the injury roll.' },
  dagger: { name: 'Dagger', ability: 'Backstab', desc: 'Striking first: +10% chance to injure that round.' },
};

// Decor only helps specific builds (for now). `helps` says whether a fighter gets anything from it.
// Every decor item adds comfort (Morale). Birds and Fire Braziers also calm (−Stress a week) and help specific builds in combat.
export const DECOR = {
  bird: { price: 1, calm: 5, name: 'Bird', feeds: 'Ornitharius', effect: 'Comfort for Morale and −5 Stress a week. Ornitharius fighters also get +5% injure chance per Bird once injured (Birds of Prey).', helps: (f) => f.cls === 'ornitharius' },
  fireBrazier: { price: 1, calm: 5, name: 'Fire Brazier', feeds: 'Firebug', effect: 'Comfort for Morale and −5 Stress a week. Elves with Firebug also get +1 Power per Fire Brazier.', helps: (f) => f.kindTrait === 'firebug' },
  trophy: { price: 2, name: 'Trophy Rack', feeds: 'Morale', effect: 'Comfort for Morale: a famous fighter likes to see their victories on the wall.', helps: () => false },
  shrine: { price: 3, calm: 10, name: 'Shrine of Mars', feeds: 'Stress', effect: 'Comfort for Morale and −10 Stress a week: prayer steadies a fighter between bouts.', helps: () => false },
  bathhouse: { price: 4, calm: 15, name: 'Bathhouse', feeds: 'Stress', effect: 'Comfort for Morale and −15 Stress a week: hot water heals more than the Medbay admits.', helps: () => false },
  lionCage: { price: 5, name: 'Lion Cage', feeds: 'Basa', effect: 'Comfort for Morale. Basa fighters with a Lion Cage get +1 Power (they train with the beasts).', helps: (f) => f.kind === 'basa' },
  warBanner: { price: 4, renown: 1, name: 'War Banner', feeds: 'Renown', effect: 'Comfort for Morale, and +1 Renown for every win (per Banner): the crowd learns their colours.', helps: () => true },
};

// ---- Career placeholders (docs/fight-rules.md, "Career rules"); tune with scripts/simulate.js ----

export const ECONOMY = {
  startGold: 12,
  startPrestige: 5,
  marketSize: 4,
  startSpeed: 3,
  decorCost: 1,
  surgeonCost: 8, // Emergency Surgeon: heal one injury instantly; +4 Gold per tier above 1
  surgeonPerTier: 4,
  skipGold: 2, // reward for skipping Tournament 1 or 2
  skipStressRelief: 20,
  lowerArenaPrestige: 0.5, // Prestige from a win shrinks by half for each tier below your top arena
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

// Imperial Favor replaces v1's three Strikes. At 0 you're executed.
export const FAVOR = {
  start: 50, max: 100, warning: 25,
  bossWin: 15, upsetWin: 5, spectacleWin: 5,
  bossLoss: [-10, -15, -20, -25], forfeitExtra: -5, topTowel: -5, crushingWin: -2, championReturn: -3, unpaidTribute: -25,
};

// Tribute is due at the start of each winter: perYear × the year number. Warning a month ahead.
export const TRIBUTE = { perYear: 15 };

// House revolt: average Morale below this for `weeks` weeks in a row ends the career.
export const REVOLT = { morale: 20, weeks: 4 };

// Speed trains three times as fast as Power: Speed's edge levels off, so it needs to be cheap to be worth a week (tuned with the balanced-fighter gate).
export const TRAIN_GAIN = { power: 1, speed: 3 };

export const STRESS = { train: 20, fight: 15, rest: -40, medbay: -10, overtrained: 50, max: 100 };

// Weeks an injury takes to heal in the Medbay (Medbay Lv 2+ heals 2 weeks per week).
export const HEAL_WEEKS = { distracted: 1, fleshWound: 1, concussed: 2, poisoned: 2, maimed: 3, senseless: 2, blinded: 3 };

export const MONTHS = ['Martius', 'Aprilis', 'Maius', 'Iunius', 'Quintilis', 'Sextilis', 'September', 'October', 'November', 'December'];
export const CALENDAR = { weeksPerMonth: 4, winterWeeks: 4 };

// Gods' Days (roadmap v3, phase B2): festivals on some months' tournament week. Each favours a style or pays out more.
export const FESTIVALS = {
  Maius: { id: 'floralia', name: 'Floralia', god: 'Flora', desc: 'Flowers, wine and a generous crowd: wins pay +50% Gold.', gold: 1.5 },
  Quintilis: { id: 'apollo', name: 'Ludi Apollinares', god: 'Apollo', desc: 'Games for the archer god: ranged fighters (Sagittarius, or a Bow, Gun or Spear) get +1 Power.', ranged: 1 },
  September: { id: 'romani', name: 'Ludi Romani', god: 'Jupiter', desc: 'The great games of Rome: wins pay +50% Prestige.', prestige: 1.5 },
  October: { id: 'mars', name: 'Armilustrium', god: 'Mars', desc: 'The god of war loves aggression: fighters who Press get +5% win chance, and every win earns +1 Renown.', tactic: { press: 5000 }, renown: 1 },
  November: { id: 'plebeii', name: 'Ludi Plebeii', god: 'Fortuna', desc: "The people's games, blessed by Fortuna: an upset win pays double Gold and double Favor.", upset: 2 },
  December: { id: 'saturnalia', name: 'Saturnalia', god: 'Saturn', desc: 'The world turned upside down: no buy-ins this tournament week.', freeEntry: true },
};
export const FESTIVAL_BY_ID = Object.fromEntries(Object.values(FESTIVALS).map((f) => [f.id, f]));

export const STAGES = ['Tournament 1', 'Tournament 2', 'Boss Tournament'];

// One circuit per tier: Tournament 1 → Tournament 2 → Boss. Arrays are per stage.
export const CIRCUITS = [
  { tier: 1, name: 'The Dirt Pits', oppPower: [6, 6, 7], buyIn: [1, 1, 2], winGold: [6, 8, 12], winPrestige: [2, 3, 5], lossGold: 2, oppDecor: 1, marketPower: 0, price: 3 },
  { tier: 2, name: 'The Bronze Arena', oppPower: [11, 12, 14], buyIn: [2, 2, 4], winGold: [10, 13, 18], winPrestige: [4, 6, 10], lossGold: 4, oppDecor: 2, marketPower: 2, price: 5 },
  { tier: 3, name: 'The Silver Coliseum', oppPower: [17, 18, 19], buyIn: [3, 3, 6], winGold: [14, 18, 25], winPrestige: [6, 9, 15], lossGold: 6, oppDecor: 3, marketPower: 4, price: 7 },
  { tier: 4, name: 'The Imperial Coliseum', oppPower: [24, 25, 26], buyIn: [4, 4, 8], winGold: [18, 23, 32], winPrestige: [8, 12, 20], lossGold: 8, oppDecor: 3, marketPower: 6, price: 9 },
];

export const GRAND = { name: 'The Grand Tournament', oppPower: 29, buyIn: 10, winGold: 40, winPrestige: 30, lossGold: 10, oppDecor: 3 };

// House Prestige levels: Fibonacci room plots, doubling roster caps (design doc Tab 7). A level, once reached, is kept.
export const PRESTIGE_LEVELS = [
  { level: 1, at: 0, plots: 3, maxFighters: 4 },
  { level: 2, at: 10, plots: 5, maxFighters: 6 },
  { level: 3, at: 25, plots: 8, maxFighters: 12 },
  { level: 4, at: 50, plots: 13, maxFighters: 24 },
  { level: 5, at: 90, plots: 21, maxFighters: 48 },
];

// cost[i] / req[i]: Gold and Prestige level to reach level i + 1 (cost[0] = build). `per` = effect per level.
// `unique`: only one per estate, because only the best one counts.
export const BUILDINGS = {
  quarters: { name: 'Fighter Quarters', dept: 'housing', icon: 'bed', cost: [6, 6, 10], req: [1, 1, 3], per: [2, 4, 5], effect: (n) => `Houses ${n} fighters`, extra: (lv) => `Decor up to ${lv} of each item` },
  entertainment: { unique: true, name: 'Entertainment Room', dept: 'housing', icon: 'lyre', cost: [8, 12], req: [2, 3], per: [15, 30], effect: (n) => `All fighters −${n} Stress each week` },
  trainer: { name: 'Trainer Room', dept: 'training', icon: 'dumbbell', cost: [8, 10, 16, 26, 40], req: [1, 2, 3, 4, 5], per: [3, 5, 8, 13, 21], effect: (n) => `Trains 1 fighter a week; each fighter can train up to ${n} points in total`, note: () => (VETERAN_CAP.perLevel ? `Veterans train longer: each fighter gets ${VETERAN_CAP.perLevel >= 1 ? `+${VETERAN_CAP.perLevel} training week${VETERAN_CAP.perLevel === 1 ? '' : 's'} per level` : `+1 training week every ${Math.round(1 / VETERAN_CAP.perLevel)} levels`} above level 1, on top of the room's cap.` : ''), extra: (lv) => `Training costs ${lv} Gold per fighter-week (your best Trainer Room sets the cap and the fee)` },
  medbay: { name: 'Medbay', dept: 'medical', icon: 'cross', cost: [8, 8, 14], req: [1, 2, 4], per: [1, 2, 3], effect: (n) => `Treats ${n} fighter${n > 1 ? 's' : ''} at a time`, extra: (lv) => (lv >= 2 ? 'Heals 2 weeks of injury per week' : 'Heals 1 week of injury per week') },
  oracle: { unique: true, name: 'Oracle', dept: 'scouting', icon: 'eye', cost: [8, 12], req: [2, 3], per: [1, 2], effect: (n) => (n >= 2 ? 'Exact odds and next Boss debuff' : 'Odds to the nearest 10%') },
  armourer: { unique: true, name: 'Armourer', dept: 'training', icon: 'anvil', cost: [10, 16, 24], req: [2, 3, 4], per: [5, 6, 8], effect: (n) => `Sells ${n} pieces of gear each month, and buys your spare gear back at half price`, extra: (lv) => (lv >= 3 ? 'Stocks Imperial (tier 3) gear' : lv >= 2 ? 'Stocks fine (tier 2) gear' : 'Stocks basic (tier 1) gear') },
  stables: { unique: true, name: 'Stables', dept: 'scouting', icon: 'paw', cost: [9, 14], req: [2, 3], per: [1, 2], effect: (n) => `${n} exotic Basa fighter${n === 1 ? '' : 's'} in the Market each month` },
  liaison: { unique: true, name: 'Liaison', dept: 'scouting', icon: 'chain', cost: [6, 10], req: [2, 4], per: [1, 2], effect: (n) => (n >= 2 ? 'Monthly elite prisoner of war' : 'Monthly 1-Gold condemned convict') },
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
// Veterans earn a higher training cap: each level above 1 raises that fighter's own Trainer cap by `perLevel` weeks
// (rounded down, so 0.5 means one week every second level). Market fighters always arrive at level 1 with bonus
// natural Power by arena, so without this a fresh Imperial recruit out-powers a capped veteran.
export const VETERAN_CAP = { perLevel: 1 };

// `req(f)` gates combo perks; `stat` perks change the fighter once, the rest are checked in the engine or run.
export const PERKS = {
  mighty: { name: 'Mighty', desc: '+1 Power.', stat: { power: 1 }, repeatable: true },
  swift: { name: 'Swift', desc: '+3 Speed.', stat: { speed: 3 }, repeatable: true },
  thickSkin: { name: 'Thick Skin', desc: '−5% chance to be injured.' },
  killer: { name: 'Killer Instinct', desc: '+5% chance to injure.' },
  fastStart: { name: 'Fast Starter', desc: '+5% win chance in Round 1.' },
  closer: { name: 'Closer', desc: '+5% win chance in Round 3.' },
  ironConstitution: { name: 'Iron Constitution', desc: 'Training adds 10 less Stress.' },
  crowdPleaser: { name: 'Crowd Pleaser', desc: '+1 extra Renown for every win.' },
  survivor: { name: 'Survivor', desc: 'Once injured: −10% chance to be injured; −20% at 2+ injuries.', req: (f) => f.level >= 3, reqText: 'Level 3+' },
  duelist: { name: 'Duelist', desc: '+5% win chance and +5% chance to injure.', req: (f) => f.power >= 9 && f.speed >= 7, reqText: 'Power 9+ and Speed 7+' },
  tactician: { name: 'Tactician', desc: 'Striking first is worth +15% instead of +10%.', req: (f) => f.speed >= 9 && f.power >= 8, reqText: 'Speed 9+ and Power 8+' },
  bloodthirsty: { name: 'Bloodthirsty', desc: '+10% chance to injure an opponent who is already hurt.' },
  counterpuncher: { name: 'Counterpuncher', desc: '+10% win chance in a round after losing one.' },
  ironWill: { name: 'Iron Will', desc: 'The Death Gate opens one injury later.', req: (f) => f.level >= 4, reqText: 'Level 4+' },
  juggernaut: { name: 'Juggernaut', desc: '+1 Power and −5% chance to be injured.', stat: { power: 1 }, req: (f) => f.power >= 12, reqText: 'Power 12+' },
};

// Bloodied Victory: winning with 2+ injuries (on top of FAVOR.spectacleWin).
export const BLOODIED = { renown: 2, xp: 2, morale: 5 };

// Renown (fame) and Morale. Comfort raises Morale; expectations grow with Renown.
export const RENOWN = { win: 2, bossWin: 3, upset: 1, towel: -1, goldPer: 5 }; // +1 Gold per 5 Renown on wins
export const MORALE = {
  start: 60, drift: 10, base: 40, perQuartersLevel: 10, perDecor: 5, perEntertainmentLevel: 10, expectationPerRenown: 2, maxExpectation: 60,
  win: 10, loss: -5, towel: -5, allyDeath: -10, crowdJeers: -10,
  inspired: 80, restless: 40, mutinous: 20, inspiredWin: 5000,
};

// Gear: one weapon and one armor slot per fighter. `guard` lowers the chance to be injured (counts as armor).
// Consumables: single-use, one per fight, used between rounds. `boost` lasts the next round only.
export const CONSUMABLES = {
  warPaint: { name: 'War Paint', price: 4, desc: '+1 Power next round.', boost: { power: 1 } },
  adrenaline: { name: 'Adrenaline Draught', price: 3, desc: '+3 Speed next round; +15 Stress after the fight.', boost: { speed: 3 }, stressAfter: 15 },
  blessedBandage: { name: 'Blessed Bandage', price: 3, desc: '−10% chance to be injured next round.', boost: { guard: 10000 } },
  ironTonic: { name: 'Iron Tonic', price: 3, desc: '+5% win chance next round.', boost: { win: 5000 } },
  viperVenom: { name: 'Viper Venom', price: 3, desc: '+10% chance to injure next round.', boost: { injure: 10000 } },
  berserkerMushroom: { name: 'Berserker Mushroom', price: 4, desc: '+2 Power next round, but +10% chance to be injured.', boost: { power: 2, self: 10000 } },
  throwingNet: { name: 'Throwing Net', price: 4, desc: 'The opponent has −3 Speed next round.', foe: { speed: -3 } },
  smellingSalts: { name: 'Smelling Salts', price: 3, desc: 'Clears a Distracted or Concussed wound for the rest of this fight (it still needs healing after).', salts: true },
  crowdBribe: { name: 'Crowd Bribe', price: 6, desc: 'If you capitulate this fight, the crowd forgives it: no Favor or Renown lost for capitulating (losing a Boss still counts).', bribe: true },
};

export const GEAR = {
  gladius: { name: 'Gladius', slot: 'weapon', tier: 1, price: 7, power: 1 },
  spikedGauntlet: { name: 'Spiked Gauntlet', slot: 'weapon', tier: 1, price: 5, injure: 10000, win: 2000 },
  hunterBow: { name: "Hunter's Bow", slot: 'weapon', tier: 1, price: 12, speed: 2 },
  warMaul: { name: 'War Maul', slot: 'weapon', tier: 2, price: 12, power: 2, speed: -1 },
  trident: { name: 'Trident', slot: 'weapon', tier: 2, price: 11, power: 1, injure: 5000 },
  serratedSpatha: { name: 'Serrated Spatha', slot: 'weapon', tier: 2, price: 22, power: 1, speed: 2 },
  leatherVest: { name: 'Leather Vest', slot: 'armor', tier: 1, price: 5, guard: 5000 },
  lightGreaves: { name: 'Light Greaves', slot: 'armor', tier: 1, price: 12, speed: 2 },
  bronzeCuirass: { name: 'Bronze Cuirass', slot: 'armor', tier: 2, price: 9, guard: 10000 },
  scaleMail: { name: 'Scale Mail', slot: 'armor', tier: 2, price: 16, guard: 8000, power: 1 },
  woodenBuckler: { name: 'Wooden Buckler', slot: 'armor', tier: 1, price: 7, guard: 4000, win: 2000 },
  throwingAxes: { name: 'Throwing Axes', slot: 'weapon', tier: 2, price: 17, power: 1, speed: 1, injure: 3000 },
  imperialGladius: { name: 'Imperial Gladius', slot: 'weapon', tier: 3, price: 32, power: 2, speed: 2 },
  executionerAxe: { name: "Executioner's Axe", slot: 'weapon', tier: 3, price: 24, power: 2, injure: 10000 },
  loricaSegmentata: { name: 'Lorica Segmentata', slot: 'armor', tier: 3, price: 24, guard: 12000, power: 1 },
  lionPelt: { name: 'Lion Pelt', slot: 'armor', tier: 3, price: 20, guard: 5000, win: 5000 },
};

export const BOSS_DEBUFFS = {
  firstInjuryDouble: { name: 'First Blood Counts Double', desc: 'The first injury your fighter takes counts as two, opening the Death Gate at once.' },
  rainyMud: { name: 'Rainy Mud', desc: 'Your fighter has −2 Speed every round.' },
  noArmor: { name: 'Stripped of Armor', desc: "Your fighter's armor doesn't work: Alloyed Skin, Ego Armour and armor gear. Speed evasion still does." },
  ironRules: { name: 'Iron Rules', desc: 'Room decor gives no bonus to your fighter.' },
  bloodMoon: { name: 'Blood Moon', desc: 'Both fighters have +10% chance to be injured.' },
  crowdFavorite: { name: 'Crowd Favorite', desc: 'The champion fights with +1 Power.' },
  lions: { name: 'Lions in the Arena', desc: 'Hungry lions roam the sand: the Death Gate opens one injury earlier for both fighters.' },
  emperorsGaze: { name: "The Emperor's Gaze", desc: 'The Emperor is watching: no capitulating in this fight.' },
};

// Weapon and style matchups (v5): a fighter's style is their weapon if they're a Fighter, otherwise their class.
// `vs` lists opposing styles (or 'armor': any armor gear). win/injure apply to the first fighter.
export const MATCHUPS = [
  { style: 'spear', vs: ['cestus', 'fists', 'dagger'], win: 5000, why: 'Reach keeps brawlers at bay' },
  { style: 'club', vs: ['armor'], injure: 10000, why: 'Crushes armor' },
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
  'Varro', 'Vex', 'Xanthe', 'Zorak', 'Carpophorus', 'Verus', 'Thraxa', 'Sol-9', 'Unit Kappa', 'Grosh',
  'Aelia', 'Bellona', 'Crixus', 'Decima', 'Eppia', 'Fulvia', 'Gannicus', 'Hector', 'Iulia', 'Kaeso',
  'Lucilla', 'Mevia', 'Naevius', 'Oenomaus', 'Pugnax', 'Rufa', 'Sabina', 'Tetraites', 'Ulfa', 'Vibia',
  'Agron', 'Barca', 'Cato', 'Duma', 'Ennia', 'Felix', 'Glabra', 'Hostus', 'Ilithya', 'Kroth',
  'Lyra', 'Morg', 'Nerva', 'Orsk', 'Pavo', 'Riva', 'Seren', 'Torq', 'Unit Delta', 'Unit Sigma',
  'Vorath', 'Wyrr', 'Yssa', 'Zenna', 'Ashka', 'Brakk', 'Celeste', 'Dask', 'Elowen', 'Fenn',
  'Atticus', 'Briseis', 'Castor', 'Dacia', 'Euryale', 'Fausta', 'Galla', 'Hadria', 'Ignatia', 'Jovan',
  'Kastra', 'Lepida', 'Maximus', 'Nonia', 'Orbilia', 'Pollux', 'Quarta', 'Remus', 'Scaeva', 'Tullia',
  'Urgulania', 'Valens', 'Gorrak', 'Hessa', 'Mordra', 'Skarn', 'Thessaly', 'Vael', 'Ysolde', 'Zarek',
  'Unit Theta', 'Unit Omega', 'Sol-4', 'Ferrum', 'Calyx', 'Nyssa', 'Ruun', 'Ghast', 'Lirien', 'Corvax',
];
