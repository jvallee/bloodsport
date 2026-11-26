// Fighter voices, last words, Level-3 backstories, and Prefect Crassinus's posture.
// Pure L0 data and deterministic selectors: zero RNG calls, so careers and balance stay identical.

import { PLOT, CIRCUITS, GRAND } from './data.js';
import { PREFECT } from './plot.js';

const TITLE_RANK = new Map([
  ...CIRCUITS.map((c) => [`Champion of ${c.name.replace(/^The /, 'the ')}`, c.tier]),
  [`Champion of ${GRAND.name.replace(/^The /, 'the ')}`, CIRCUITS.length + 1],
  ['Master of the Games', CIRCUITS.length + 2],
]);
const titleRank = (t) => (typeof t === 'number' ? t : TITLE_RANK.get(t) ?? 0);

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
  (t) => `${t}: not bad for someone out of the debtor-pits.`,
];
const LAST_WORDS_KIND = {
  human: {
    choleric: 'Tell Silbannacus I died standing.',
    melancholic: 'At least I won\'t have to hear the trumpets again.',
    phlegmatic: 'My boots are still good. Give them to a rookie.',
    sanguine: 'Still beats the aqueduct ledgers, Lanista.',
  },
  android: {
    choleric: 'Combat loop... terminated. Salvage the blade, not the frame.',
    melancholic: 'Probability of survival: zero. Acceptable.',
    phlegmatic: 'Power cells failing. Tell the next unit to watch their left.',
    sanguine: 'Well fought. Logging this one under... entertainment.',
  },
  elf: {
    choleric: 'Don\'t let a pit-fighter touch my blade.',
    melancholic: 'Our silver spires fell quieter than this.',
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
    phlegmatic: 'I smelled the salt tide for a second there.',
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
    const topTitle = fighter.titles.reduce((best, t) => (titleRank(t) >= titleRank(best) ? t : best), fighter.titles[0]);
    return pickStable(LAST_WORDS_TITLE, key)(topTitle);
  }
  const byKind = LAST_WORDS_KIND[fighter.kind];
  if (byKind) return byKind[fighter.humor] ?? Object.values(byKind)[hashOf(key) % 4];
  return 'Tell the crowd they got their copper\'s worth.';
}

// ---------- Level-3 fighter backstories: Palatina and the Astral Principate (8.0, PLACEHOLDER lines) ----------

const BACKSTORIES = {
  human: {
    lead: (name) => `Late at night, ${name} sits on the yard steps, sharpening a notch out of their blade.`,
    lines: [
      'My family grew up in the lower aqueduct wards of Palatina, right beneath the marble foundations where the old Elven spires used to stand. My forefather marched with Silbannacus when the Revolution broke the High Houses.',
      'We still keep his snapped brass indentured-collar above the hearth. You know the joke of it, Lanista? Three hundred years after the Revolution, we realised we only traded an Elven collar for Censor Gallo\'s tax-scroll.',
    ],
    memory: 'Spoke of their forefather\'s snapped collar and the lower aqueduct wards of Palatina after the Revolution.',
    replies: [
      { label: 'Tell me about your ward, so you don\'t forget it.', then: 'There was a baker by the third cistern who paid his taxes in burnt crusts. Funny what stays with you on the sand.' },
      { label: 'Keep your eyes on the sand. Old history won\'t save you.', then: 'No. You\'re right. A dead gladiator doesn\'t owe the Censor anything either.' },
    ],
  },
  android: {
    lead: (name) => `After lights-out, you find ${name} sitting perfectly still in the dark, a faint blue gleam behind their eyes.`,
    lines: [
      'Across the frontier stars, in the Free Android Coalition\'s Choir of Ephemera, we trade recordings of things that only happen once: a single sunrise over a glass sea, or a child\'s laugh. Because things that end are the only things worth remembering.',
      'When Silbannacus\'s legions pushed deeper across the border and captured our transport, their artificers drove a brass jailbreak spike into my neck to override my pacifist core. Your fighters think I don\'t mind the arena because I don\'t bleed red. I simply have nowhere else to file the complaint.',
    ],
    memory: 'Spoke of the Free Android Coalition\'s Choir of Ephemera, and the Imperial jailbreak spike driven into their neck.',
    replies: [
      { label: 'Then file it with me.', then: 'Noted. You are an unusual administrator for an organic, Lanista. I will keep my servos calibrated for you.' },
      { label: 'A machine that wins lives longer than one that mourns.', then: 'Statistically accurate. Returning to diagnostic standby.' },
    ],
  },
  elf: {
    lead: (name) => `You catch ${name} by the barracks wall, looking up at Palatina's orbital mirrors.`,
    lines: [
      'My house ruled the silver cedar vaults three centuries ago, before your Emperor was a rumour. My grandmother still dresses for dinner in a burned hall without a roof, waiting for the Machine beneath the palace to grow bored of its undying Roman pet.',
      'Now I bleed in a dust bowl for plebeians who throw olive pits at my braids. Still: if I must dance for usurpers on Palatina, I intend to be the sharpest blade they ever feared.',
    ],
    memory: 'Spoke of their long-lived Elven house in the burned cedar vaults, waiting for the Palatine Engine to tire of Silbannacus.',
    replies: [
      { label: 'They\'re already watching your footwork.', then: 'Good. Let them learn the difference between a butcher and an heir of the spires.' },
      { label: 'Old House pride gets fighters killed in the pits.', then: 'Pride is the only thing the Revolution left us, Lanista. I won\'t drop it in the mud.' },
    ],
  },
  orc: {
    lead: (name) => `By the courtyard brazier, ${name} is burning a pinch of salt and muttering an old clan chant.`,
    lines: [
      'In my clan, nobody dies in a bed if they can help it. When the Principate reached our rim-worlds, it handed our grandfathers eagles and an arena. We still burn the salt before a bout, and we still drink to the Princeps.',
      'Fourth sons sell themselves to the ludi on Palatina to earn our stripes. If I fall on the sand, at least my house collects the Blood Faith annuity and my grandfathers get a proper show.',
    ],
    memory: 'Spoke of the Rim-World Orc clans under the Principate, burning salt by the brazier for their stripes.',
    replies: [
      { label: 'I\'d rather you lived to wear the stripes yourself.', then: 'Ha! Spoken like a Lanista who hates buying new greaves. I\'ll try to oblige.' },
      { label: 'Make sure the ancestors see a victory, not a funeral.', then: 'Even better. The clan elders like winners twice as much.' },
    ],
  },
  vampire: {
    lead: (name) => `${name} waits in the narrow strip of shadow by the storeroom door, away from the noon glare.`,
    lines: [
      'My province on the outer rim is tide-locked: high black spires, cold wine, and centuries of night. We bought peace with Silbannacus\'s star-fleets by paying our annual tribute to Palatina in second sons and debtors.',
      'The halogen suns above the high coliseums are wretched, and the crowd smells like copper and cheap garlic. If you ever get me into the Imperial Coliseum, Lanista, try to book an evening bout.',
    ],
    memory: 'Spoke of the tide-locked umbral provinces on the rim, and the tribute ships bound for Palatina.',
    replies: [
      { label: 'Win enough, and we\'ll ask the Legate for torches.', then: 'A charming thought. He\'ll say no, of course, but I appreciate the courtesy.' },
      { label: 'Sun or shadow, you still have to win.', then: 'Naturally. I simply prefer not to squint while doing it.' },
    ],
  },
  basa: {
    lead: (name) => `In the quiet before dawn, ${name} is pacing the yard in bare feet, sniffing the cold wind.`,
    lines: [
      'My people were born to the tidal coasts of this world long before the Roman or his Machine woke. The old Elven houses caged our ancestors in laboratory pens and forced cold calculus into our skulls until we rose with Silbannacus and tore their spires down.',
      'After the Revolution, our elders burned the Elven lexicon-tablets in driftwood bonfires and went back to the ocean waves. The sand here is dry, Lanista, but a Basa never forgets how to read a current.',
    ],
    memory: 'Spoke of the Basa tidal coasts on Palatina, and the driftwood bonfires where their elders burned the Elven tablets.',
    replies: [
      { label: 'Keep that instinct, and no arena wall holds you for long.', then: 'Good. Because the tide always comes back in.' },
      { label: 'You\'re the pride of this yard.', then: 'Pride doesn\'t pay the harbour tax, Lanista. Keep the salt-fish coming, and I\'ll keep winning.' },
    ],
  },
};

const HUMOUR_CADENCE = {
  choleric: 'And if I ever meet the magistrate who signed my warrant on Palatina, I won\'t wait for the trumpets.',
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
