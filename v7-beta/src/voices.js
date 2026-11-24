// Fighter voices, last words, Level-3 backstories, and Prefect Crassinus's posture.
// Pure L0 data and deterministic selectors: zero RNG calls, so careers and balance stay identical.

import { PLOT } from './data.js';
import { PREFECT } from './plot.js';

// Stable non-negative integer hash from a string (for picking lines deterministically without touching run.rng).
function hashOf(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
const pickStable = (list, key) => list[hashOf(key) % list.length];

// Prefect Aulus Crassinus's current posture for the Whispering Gallery readout.
export function prefectPosture(suspicion = 0) {
  const s = PLOT.suspicion;
  if (suspicion >= s.raid) return 'Signing the dawn warrant';
  if (suspicion >= s.cold) return 'Writing his report';
  if (suspicion >= s.informer) return 'Dining with your neighbours';
  if (suspicion >= s.watch) return 'Making polite enquiries';
  return 'Unbothered';
}

// ---------- Fighter last words on arena death (7.11, PLACEHOLDER lines) ----------

const LAST_WORDS_CHAMPION = [
  'The box... still stands. Don\'t let it stay that way, Lanista.',
  'The chain holds a little longer. Find someone with better lungs.',
];
const LAST_WORDS_POLITICAL = [
  'Keep the chalk dry, Lanista.',
  'One more name off his ledger. Don\'t stop because of me.',
];
const LAST_WORDS_REVENANT = [
  'Again. Good. The forge was cold anyway.',
  'Tell the priests of Vulcan... leave the brass.',
];
const LAST_WORDS_TITLE = [
  (t) => `${t}. They'll remember the name, Lanista. Make sure they spell it right.`,
  (t) => `Leave ${t} on the wall. Let the next one try to take it.`,
  () => 'Not a bad crowd for the last one.',
  (t) => `${t}: not bad for someone dragged through a portal.`,
];
const LAST_WORDS_KIND = {
  human: {
    choleric: 'Tell Silbannacus I died standing.',
    melancholic: 'At least I won\'t have to hear the trumpets again.',
    phlegmatic: 'My boots are still good. Give them to a rookie.',
    sanguine: 'Still beats the office, Lanista.',
  },
  android: {
    choleric: 'Combat loop... terminated. Salvage the blade, not the frame.',
    melancholic: 'Probability of survival: zero. Acceptable.',
    phlegmatic: 'Power cells failing. Tell the next unit to watch their left.',
    sanguine: 'Well fought. Logging this one under... entertainment.',
  },
  elf: {
    choleric: 'Don\'t let a pit-fighter touch my blade.',
    melancholic: 'My forest died quieter than this.',
    phlegmatic: 'Look at the sand. So much dust for one courtier.',
    sanguine: 'At least the sky here burns properly.',
  },
  orc: {
    choleric: 'The ancestors are watching. Let them drink!',
    melancholic: 'A clean cut. Better than dying in a bed.',
    phlegmatic: 'Tell the blood-priests I paid my share.',
    sanguine: 'Good blood. Good sand. Take the purse, Lanista.',
  },
  vampire: {
    choleric: 'Burn the body. Don\'t let Vulcan\'s priests have me.',
    melancholic: 'Finally... out of this wretched sun.',
    phlegmatic: 'Cold sand. Feels almost like home.',
    sanguine: 'Not enough blood in the dirt. A pity.',
  },
  basa: {
    choleric: 'They needed steel to drop me. Remember that.',
    melancholic: 'No more cages, Lanista.',
    phlegmatic: 'I smelled the jungle for a second there.',
    sanguine: 'Leave my claws on the barracks wall.',
  },
};

export function lastWordsFor(run, fighter) {
  const key = `${fighter.id}:${fighter.name}:${run.week ?? 0}`;
  if (run.plot?.champion === fighter.id && !run.plot?.ended) return pickStable(LAST_WORDS_CHAMPION, key);
  if (fighter.political) return pickStable(LAST_WORDS_POLITICAL, key);
  if (fighter.kind === 'revenant') return pickStable(LAST_WORDS_REVENANT, key);
  if (fighter.bond && run.roster?.some((x) => x.id === fighter.bond.id)) {
    const mate = fighter.bond.name;
    return pickStable([
      `Tell ${mate}... I held the line.`,
      `Don't let ${mate} drink my wine.`,
    ], key);
  }
  if ((fighter.titles ?? []).length >= 2) {
    const topTitle = fighter.titles.at(-1);
    return pickStable(LAST_WORDS_TITLE, key)(topTitle);
  }
  const byKind = LAST_WORDS_KIND[fighter.kind];
  if (byKind) return byKind[fighter.humor] ?? Object.values(byKind)[hashOf(key) % 4];
  return 'Tell the crowd they got their copper\'s worth.';
}

// ---------- Level-3 fighter backstories: where the portal took them from (7.11, PLACEHOLDER lines) ----------

const BACKSTORIES = {
  human: {
    lead: (name) => `Late at night, ${name} sits on the yard steps, sharpening a notch out of their blade.`,
    lines: [
      'Before the portal took me, I had a small life on Earth. Rain on grey stone, a bell for supper, people who worried about the price of bread instead of the price of a throat.',
      'You know the worst part, Lanista? I\'m starting to forget the street I lived on. I remember every cut I\'ve taken on Battleworld, and I can\'t remember my mother\'s door.',
    ],
    memory: 'Spoke of Earth before the portal: rain on grey stone, and a street they are starting to forget.',
    replies: [
      { label: 'Tell me about it, so you don\'t forget.', then: 'There was a bakery on the corner. Smelled of burnt crusts every morning. Funny what stays.' },
      { label: 'Keep your eyes on the sand. The past won\'t save you.', then: 'No. You\'re right. A dead man doesn\'t remember his street either.' },
    ],
  },
  android: {
    lead: (name) => `After lights-out, you find ${name} sitting perfectly still in the dark, a faint blue gleam behind their eyes.`,
    lines: [
      'My logs begin in a war that ended three centuries before Silbannacus\'s engineers dragged me out of a crater. The empire I was built for doesn\'t even have a name left in my memory.',
      'Your fighters think I don\'t mind the arena because I don\'t bleed red. I notice every dent, Lanista. I simply have nowhere else to file the complaint.',
    ],
    memory: 'Spoke of the forgotten war they were built for, three centuries before the Emperor\'s engineers salvaged them.',
    replies: [
      { label: 'Then file it with me.', then: 'Noted. You are an unusual technician, Lanista. I will keep my servos oiled for you.' },
      { label: 'A machine that wins lives longer than one that wonders.', then: 'Statistically accurate. Returning to standby.' },
    ],
  },
  elf: {
    lead: (name) => `You catch ${name} by the barracks wall, looking up at Battleworld's wrong stars.`,
    lines: [
      'Where I came from, a duel was a courtesy. We fought under silver boughs, and the loser bowed and poured the wine. Then the forest began to wither, and the sky tore open.',
      'Now I bleed in a dust bowl for people who throw olives at me. Still: if I must dance for barbarians, I intend to be the finest dancer they have ever seen.',
    ],
    memory: 'Spoke of their dying forest court, where duels ended with a bow instead of sand and olives.',
    replies: [
      { label: 'They\'re already watching your footwork.', then: 'Good. Let them learn the difference between a butcher and a blade.' },
      { label: 'Pride gets fighters killed in the pits.', then: 'Pride is the only thing I carried through the portal, Lanista. I won\'t drop it now.' },
    ],
  },
  orc: {
    lead: (name) => `By the courtyard brazier, ${name} is burning a pinch of salt and muttering an old chant.`,
    lines: [
      'In my clan, nobody dies in a bed if they can help it. Our blood-priests say the ancestors only hear you when the iron rings and the ground drinks.',
      'The portal robbed me of my war-band, not my name. If I fall on Silbannacus\'s sand, at least my house collects the coin and my grandfathers get a show.',
    ],
    memory: 'Spoke of their clan and the blood-priests, and burned salt by the brazier for the ancestors.',
    replies: [
      { label: 'I\'d rather you lived to collect the coin yourself.', then: 'Ha! Spoken like a Lanista who hates buying new boots. I\'ll try to oblige.' },
      { label: 'Make sure the ancestors see a victory, not a funeral.', then: 'Even better. They like winners too.' },
    ],
  },
  vampire: {
    lead: (name) => `${name} waits in the narrow strip of shadow by the storeroom door, away from the noon glare.`,
    lines: [
      'My world had no sun at all: just high black spires, cold wine, and centuries to spend them in. Then the Emperor bought a shipload of us like salted fish.',
      'The torches at night are bearable. The crowd smells like copper and cheap garlic. If you ever get me into the Imperial Coliseum, Lanista, try to book an evening bout.',
    ],
    memory: 'Spoke of the sunless spires they were shipped from, and asked for evening bouts.',
    replies: [
      { label: 'Win enough, and we\'ll ask the Emperor for torches.', then: 'A charming thought. He\'ll say no, of course, but I appreciate the courtesy.' },
      { label: 'Sun or shadow, you still have to win.', then: 'Naturally. I simply prefer not to squint while doing it.' },
    ],
  },
  basa: {
    lead: (name) => `In the quiet before dawn, ${name} is pacing the yard in bare feet, sniffing the cold wind.`,
    lines: [
      'On the jungle moons, you can hear rain coming three valleys away. Here everything smells of wet limestone, horse manure and iron.',
      'The hunters thought a cage broke me. It didn\'t. The sand is just a smaller clearing, and I am still the fastest thing inside it.',
    ],
    memory: 'Spoke of the jungle moons and the smell of rain three valleys away.',
    replies: [
      { label: 'Keep that speed, and no cage holds you for long.', then: 'Good. Because I remember every bar on the last one.' },
      { label: 'You\'re the pride of this yard.', then: 'Pride doesn\'t fill a belly, Lanista. Keep the meat coming, and I\'ll keep winning.' },
    ],
  },
};

const HUMOUR_CADENCE = {
  choleric: 'And if I ever meet the man who opened that portal, I won\'t wait for the trumpets.',
  melancholic: 'Funny how a person gets used to anything, if they survive the first month.',
  phlegmatic: 'No point shouting at the sky. Best get some sleep before morning drills.',
  sanguine: 'Still: worse places to end up than a house that feeds us on time.',
};

export function backstoryScene(fighter) {
  if (!fighter || fighter.kind === 'revenant') return null;
  const tpl = BACKSTORIES[fighter.kind];
  if (!tpl) return null;
  const say = (text) => ({ speaker: 'fighter', fighterId: fighter.id, text });
  const coda = fighter.political
    ? 'And I won\'t let Silbannacus own the rest of my life, either. Whatever comes.'
    : (HUMOUR_CADENCE[fighter.humor] ?? HUMOUR_CADENCE.phlegmatic);
  const lastText = `${tpl.lines[1]} ${coda}`;
  return {
    memory: tpl.memory,
    beats: [
      { speaker: 'narrator', text: tpl.lead(fighter.name) },
      say(tpl.lines[0]),
      {
        ...say(lastText),
        replies: tpl.replies.map((r) => ({ label: r.label, then: [say(r.then)] })),
      },
    ],
  };
}

export { PREFECT };
