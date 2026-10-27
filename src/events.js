// Weekly events (roadmap v3, phase B1): a card with a choice, some weeks. Pure data; src/run.js applies the effects.
//
// `who`: which fighters the event is about: 'any' (random), 'famous' (most Renown), 'green' (lowest level),
//   'pair' (two different fighters). `f` and `g` in text are their names.
// `when(run)`: extra condition. Effects: { gold, favor, morale, stress, renown, xp, injury, item, chance: { p, win, lose } }.
//   morale/stress/renown/xp/injury apply to `to`: 'f', 'g', 'both' or 'all' (the whole roster).
// The first choice is the cautious one (the careful bot takes it). A choice with `cost` needs that much Gold.

export const EVENT_CHANCE = { season: 0.3, winter: 0.2 };

export const EVENTS = [
  {
    id: 'brawl', who: 'pair', title: 'Brawl in the barracks',
    text: ({ f, g }) => `${f} and ${g} came to blows over a bunk. The whole Ludus is watching to see what you do.`,
    choices: [
      { label: 'Throw a feast to make peace', cost: 4, effects: { gold: -4, morale: { to: 'both', n: 5 } } },
      { label: 'Punish them both', effects: { morale: { to: 'both', n: -10 }, stress: { to: 'both', n: -10 } } },
      { label: 'Let them settle it in the yard', effects: { chance: { p: 0.5, win: { renown: { to: 'f', n: 1 }, injury: { to: 'g', tag: 'fleshWound' } }, lose: { renown: { to: 'g', n: 1 }, injury: { to: 'f', tag: 'fleshWound' } } } } },
    ],
  },
  {
    id: 'senator', who: 'famous', title: 'A senator\'s offer',
    text: ({ f }) => `A senator's slave brings a purse: his patron wants ${f} to dine at his villa, and to praise him to the crowd. The Emperor's spies are everywhere.`,
    choices: [
      { label: 'Decline politely', effects: { favor: 2 } },
      { label: 'Accept the purse', effects: { gold: 10, chance: { p: 0.35, win: {}, lose: { favor: -8 } } } },
    ],
  },
  {
    id: 'plague', title: 'Fever in the city',
    text: () => 'A fever is spreading through the city. Physicians are expensive this week.',
    choices: [
      { label: 'Pay the physicians', cost: 5, effects: { gold: -5 } },
      { label: 'Trust to the gods', effects: { chance: { p: 0.5, win: {}, lose: { injury: { to: 'f', tag: 'distracted' }, stress: { to: 'all', n: 10 } } } } },
    ],
    who: 'any',
  },
  {
    id: 'trainer', who: 'green', title: 'A wandering lanista',
    text: ({ f }) => `A retired lanista passing through offers a week of lessons for ${f}. He's old, but he has seen everything.`,
    choices: [
      { label: 'Pay him for lessons', cost: 6, effects: { gold: -6, xp: { to: 'f', n: 4 } } },
      { label: 'Send him on his way', effects: {} },
    ],
  },
  {
    id: 'fans', who: 'famous', title: 'Gifts from the stands',
    text: ({ f }) => `Admirers of ${f} have left gifts at the gate: coins, flowers, a crude statue.`,
    choices: [
      { label: `Let them keep the gifts`, effects: { morale: { to: 'f', n: 10 } } },
      { label: 'Sell the lot for the house', effects: { gold: 4, morale: { to: 'f', n: -5 } } },
    ],
    when: (run) => run.roster.some((x) => x.renown >= 3),
  },
  {
    id: 'beast', who: 'any', title: 'A beast loose in the streets',
    text: ({ f }) => `A lion has escaped from the menagerie. The city watch is offering a reward, and ${f} is itching to go.`,
    choices: [
      { label: 'Leave it to the watch', effects: {} },
      { label: 'Send ${f}', effects: { chance: { p: 0.6, win: { gold: 6, renown: { to: 'f', n: 2 } }, lose: { injury: { to: 'f', tag: 'fleshWound' } } } } },
    ],
  },
  {
    id: 'caravan', title: 'A merchant caravan',
    text: () => 'A caravan from the east stops at your gate, selling War Paint at half price.',
    choices: [
      { label: 'Not today', effects: {} },
      { label: 'Buy War Paint (5 Gold)', cost: 5, effects: { gold: -5, item: 'warPaint' } },
    ],
    who: 'any',
  },
  {
    id: 'omen', title: 'An omen at the shrine',
    text: () => 'Ravens circle the Ludus shrine. The augur says the gods want an offering.',
    choices: [
      { label: 'Make an offering (3 Gold)', cost: 3, effects: { gold: -3, favor: 3 } },
      { label: 'Ignore the birds', effects: { morale: { to: 'all', n: -3 } } },
    ],
    who: 'any',
  },
  {
    id: 'revelry', title: 'A night of revelry',
    text: () => 'The gladiators beg for a night in the city: wine, music, and no lanista.',
    choices: [
      { label: 'Forbid it', effects: { morale: { to: 'all', n: -5 } } },
      { label: 'Let them go', effects: { morale: { to: 'all', n: 10 }, stress: { to: 'all', n: 10 } } },
    ],
    who: 'any',
  },
  {
    id: 'spy', title: 'A spy in the Ludus',
    text: () => 'Your guards caught a man copying your training records. He wears a rival house\'s ring.',
    choices: [
      { label: 'Hand him to the Emperor\'s guard', effects: { favor: 3 } },
      { label: 'Ransom him back', effects: { gold: 6 } },
    ],
    who: 'any',
  },
  {
    id: 'injuredDog', who: 'any', title: 'A stray at the gate',
    text: ({ f }) => `${f} has found a half-starved war dog at the gate and wants to keep it.`,
    choices: [
      { label: 'Let them keep it (2 Gold of meat)', cost: 2, effects: { gold: -2, morale: { to: 'f', n: 15 }, stress: { to: 'f', n: -10 } } },
      { label: 'Turn it away', effects: { morale: { to: 'f', n: -5 } } },
    ],
  },
  {
    id: 'sparring', who: 'pair', title: 'A sparring challenge',
    text: ({ f, g }) => `${f} wants to spar with ${g} at full strength. "It's how we learn."`,
    choices: [
      { label: 'Wooden swords only', effects: { xp: { to: 'both', n: 1 } } },
      { label: 'Full strength', effects: { xp: { to: 'both', n: 3 }, chance: { p: 0.7, win: {}, lose: { injury: { to: 'g', tag: 'fleshWound' } } } } },
    ],
  },
];

export const EVENT_BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

// A choice's label with the fighter names filled in.
export const choiceLabel = (choice, names) => choice.label.replace('${f}', names.f ?? '').replace('${g}', names.g ?? '');
