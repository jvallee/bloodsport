// v6, the hidden plot (docs/roadmap-v6.md): political prisoners, the rebels' cells, clues and the plot's encounter cards.
// Pure data. src/run.js runs the plot; the cards reuse the weekly event card (src/events.js) so they look like any other.
//
// All story text here is placeholder, to be rewritten in the designer's voice.
//
// Encounter fields (on top of the event format in src/events.js):
//   plot: true · stages: the plot stages it can appear in · target(run, rng): { f, g, name, house, opp } or null when
//   it can't happen now · when(run): extra condition · forced: shown as soon as it's possible (raids).
// repeat: can come back after it has been seen (the Cause's must-haves: arms and a champion).
// Choice flags: help (counts as helping the rebels: resets the refusal count; the rebel bot picks these),
//   refuse (counts toward going cold), betray (the Loyalist choice), needs(run, ev): why it can't be chosen, or null.
// Plot effects (never shown on the buttons): trust, suspicion, stage, contact ('new' or 'asker'), freeAsker,
//   execute ('f'), reveal, hide (Medbay weeks), pass, usePass, armed, champion ('f'), mark, crowd (weeks), coup,
//   cold, betray, treason, askedFree. `chance.p` may be a function (run, ev) => p.

import { PLOT, NAMES, CIRCUITS } from './data.js';
import { pick } from './rng.js';

// A political prisoner's role in the rebellion. Each opens its own encounters and pays back in its own way once freed.
export const CELLS = {
  officer: { name: 'Officer', desc: 'a former centurion of the legions' },
  scribe: { name: 'Scribe', desc: 'a clerk from the palace archives' },
  priest: { name: 'Priest', desc: 'a priest of a forbidden god' },
  courier: { name: 'Courier', desc: 'a runner who knows every alley in the city' },
};
export const CELL_IDS = Object.keys(CELLS);

// Clues on a prisoner's record (shown on the Liaison's card, and in their Story once recruited).
// Telling clues only ever appear on political prisoners; ambiguous ones appear on anyone.
export const CLUES = {
  telling: [
    'Refuses to salute the Imperial standard.',
    'Was found with a pamphlet sewn into his tunic.',
    'Scratched a sign on the cell wall: a broken chain.',
    'Arrested in the forum for defecating on the Emperor\'s statue.', // the designer's line (2026-11-01)
    'The guards say visitors ask for them by a name that isn\'t on the record.',
  ],
  ambiguous: [
    'Kept apart from the other prisoners, on orders from the palace.',
    'Can read and write, which is rare in the cells.',
    'Says nothing about where they were taken.',
    'Bears an old brand from the legions.',
    'Prays to no god the guards recognise.',
  ],
};

// What the house can see of the Emperor's suspicion, and of a rising that is ready and waiting (house log lines).
export const SUSPICION_SIGNS = {
  low: ['A Praetorian watched training today, and wrote something down.', 'A stranger asked the water-seller which gladiators go out at night.'],
  mid: ['Praetorians stopped your steward in the market and searched his basket.', 'Someone has been through the papers in your office. Nothing is missing.', 'The guards at the arena gate know your fighters\' names now.'],
  high: ['A Praetorian prefect sits in your box at the games, watching you, not the sand.', 'Your steward says a man has been standing across the street for three days.', 'An invitation to the palace was withdrawn without a word.'],
  ready: ['The chalk marks are everywhere now, and nobody scrubs them off.', 'In the barracks, blades are oiled at night that nobody will admit to owning.', 'The city is waiting for the Emperor\'s games.'],
};

// Said the first time suspicion crosses the informer and cold lines (7.10). PLACEHOLDER lines.
// The face of the palace's suspicion (7.10): a Praetorian prefect who calls as it grows. PLACEHOLDER name and lines.
export const PREFECT = 'Prefect Aulus Crassinus';
export const PREFECT_LINES = {
  watch: 'A courtesy call, Lanista, nothing more. The Emperor likes to know his gladiator houses are content. Yours seems very content. So many visitors.',
  informer: 'I dined with your neighbours last night. They speak well of you. They say you keep your lamps lit very late. I told them you must be reading. You are a great reader, I think.',
  cold: 'I will be honest with you, because I like you. I have been asked to write a report on your house. I write slowly. But I always finish.',
};
export const SUSPICION_LINES = {
  informer: 'We have been careless, Lanista. There is a new face at the water-seller\'s, and he buys nothing. For a while, do only what matters.',
  informerSteward: 'A man at the water-seller\'s has been watching our gate for a week. He buys nothing. I\'ve started buying nothing too, so we look the same.',
  cold: 'An invitation to the palace was withdrawn this morning, with no reason given. In this city, no reason is the worst kind. Whatever you are doing at night, Lanista, do less of it.',
};

const political = (run) => run.roster.filter((f) => f.political);
const anyFighter = (run) => run.roster;
const asker = (list) => (run, rng) => (list(run).length ? { f: pick(rng, list(run)).id } : null);
const freshName = (run, rng) => {
  // Nobody you could meet: your house, the market, the dead, contacts, and every arena and bracket opponent.
  const opponents = [...Object.values(run.arenas ?? {}).flatMap((a) => [a.opponent, a.rival]), ...Object.values(run.brackets ?? {}).flatMap((b) => b.foes ?? [])].filter(Boolean);
  const taken = new Set([...run.roster, ...run.market, ...run.fallen, ...opponents].map((f) => f.name)
    .concat((run.plot?.freed ?? []).map((c) => c.name), run.graveyard ?? [], (run.liaisonOffers ?? []).map((f) => f.name)));
  const free = NAMES.filter((n) => !taken.has(n));
  return pick(rng, free.length ? free : NAMES);
};
const topOpponent = (run) => run.arenas[run.topTier]?.opponent;
const houseName = (run, f) => run.houses?.find((h) => h.id === f?.house)?.name;
// Will a fighter join the cause? Content fighters are more willing (20–90%, by Morale).
export const recruitOdds = (f) => Math.round(Math.min(0.9, Math.max(0.2, (f.morale ?? 50) / 100)) * 100);
const hasContact = (run, cell) => (run.plot?.freed ?? []).some((c) => c.cell === cell && !c.caught);
const gearCount = (run) => run.inventory.gear.length + run.roster.reduce((n, f) => n + (f.gear.weapon ? 1 : 0) + (f.gear.armor ? 1 : 0), 0);
export const isArmed = (run) => Boolean(run.plot?.armed) || hasContact(run, 'officer');

export const PLOT_EVENTS = [
  // ---- Act 1: the Mark ----
  {
    id: 'chalkMark', plot: true, stages: ['mark'], title: 'Chalk on the door',
    target: asker(political),
    text: ({ f }) => `Overnight, someone chalked a sign on ${f}'s door: a broken chain. ${f} says nothing, and watches to see what you'll do.`,
    choices: [
      { label: 'Scrub it off', refuse: true, effects: {} },
      { label: 'Copy the sign onto another door', help: true, effects: { trust: 1, stage: 'favours' } },
    ],
  },
  // ---- Act 2: favours ----
  {
    id: 'cousinVisit', plot: true, stages: ['favours', 'cause', 'ready'], title: 'A cousin at the gate',
    target: asker(political),
    text: ({ f }) => `A man who says he is ${f}'s cousin asks to visit the barracks. He has no letter, and he isn't looking at ${f}.`,
    choices: [
      { label: 'Turn him away', refuse: true, effects: {} },
      { label: 'Let him in', help: true, effects: { trust: 1, suspicion: 5, reveal: true } },
    ],
  },
  {
    id: 'hideWounded', plot: true, stages: ['favours', 'cause', 'ready'], title: 'Blood at the gate',
    target: asker(anyFighter),
    text: () => 'A man bleeding from a Praetorian blade collapses at your gate after curfew. The watch will pass within the hour.',
    choices: [
      { label: 'Call the watch', refuse: true, effects: { favor: 2, trust: -1 } },
      { label: 'Hide him in the Medbay', help: true, effects: { trust: 2, hide: 2, gold: 3, suspicion: 5 } },
    ],
  },
  {
    id: 'pamphlets', plot: true, stages: ['favours', 'cause', 'ready'], title: 'Pamphlets in the storeroom',
    target: asker(anyFighter),
    text: () => 'Your steward found a bundle of pamphlets behind the grain jars: the Emperor drawn as a jackal on a stolen throne.',
    choices: [
      { label: 'Burn them', refuse: true, effects: {} },
      { label: 'Leave them where they are', help: true, effects: { trust: 1, suspicion: 5, crowd: 4 } },
    ],
  },
  {
    id: 'yardBout', plot: true, stages: ['favours', 'cause'], title: 'A bout for the street',
    target: asker(anyFighter),
    text: ({ f }) => `The rebels want the city to see one of their own beat a gladiator of your house in the practice yard. They ask for ${f}, and for ${f} to lose.`,
    choices: [
      { label: 'Refuse', refuse: true, effects: {} },
      { label: `Let \${f} take the fall`, help: true, effects: { trust: 2, renown: { to: 'f', n: -2 }, morale: { to: 'f', n: -5 } } },
    ],
  },
  // ---- Rescue requests: one of your gladiators asks you to free a political prisoner ----
  {
    id: 'freeFromCells', plot: true, stages: ['favours', 'cause', 'ready'], title: 'A friend in the cells',
    when: (run) => run.buildings.some((b) => b.type === 'liaison'),
    // Political prisoners ask, and the sworn champion (playtest #7: an ordinary fighter's "brother" felt arbitrary).
    target: (run, rng) => {
      const list = run.roster.filter((f) => f.political || f.id === run.plot?.champion);
      return list.length ? { f: pick(rng, list).id, name: freshName(run, rng) } : null;
    },
    text: ({ f, name }) => `${f} comes to you at night. "${name} is in the Liaison's cells, and I owe them my life. Buy them, then let them go. They're worth more outside these walls than any purse."`,
    choices: [
      { label: 'Refuse', refuse: true, effects: { morale: { to: 'f', n: -15 } } },
      { label: `Buy \${name} and let them go (${PLOT.freeCost} Gold)`, help: true, cost: PLOT.freeCost, effects: { gold: -PLOT.freeCost, contact: 'new', trust: 2, suspicion: 5 } },
    ],
  },
  {
    id: 'freeMe', plot: true, stages: ['favours', 'cause'], title: 'Free me',
    // Only with two political prisoners in the house (the designer, 5.4.0): the last one never asks to leave.
    when: (run) => (run.plot?.trust ?? 0) >= 3 && political(run).length >= 2,
    target: asker(political),
    text: ({ f }) => `${f} asks to speak to you alone. "Free me. I can do more for the cause outside these walls than inside your arena."`,
    choices: [
      { label: 'Refuse', refuse: true, effects: { morale: { to: 'f', n: -15 }, askedFree: true } },
      { label: `Free \${f}`, help: true, effects: { freeAsker: true, trust: 3 } },
    ],
  },
  {
    id: 'freeCondemned', plot: true, stages: ['cause', 'ready'], title: 'Thrown to the beasts',
    when: (run) => Boolean(run.bouts),
    target: (run, rng) => (run.roster.length ? { f: pick(rng, run.roster).id, name: freshName(run, rng) } : null),
    text: ({ f, name }) => `${f}, one of your gladiators, has gone pale. "There's a prisoner in the arena cells called ${name}. Not one of this house, but one of us. They're throwing ${name} to the beasts at today's games, for sedition. You have the Emperor's ear, and a key to every gate in the arena."`,
    choices: [
      { label: 'Do nothing', refuse: true, effects: { morale: { to: 'f', n: -20 } } },
      { label: `Plead for clemency (−${PLOT.clemencyFavor} Favour)`, help: true, effects: { favor: -PLOT.clemencyFavor, contact: 'new', trust: 2 } },
      { label: 'Arrange an escape', help: true, effects: { chance: { p: 0.6, win: { contact: 'new', trust: 2 }, lose: { suspicion: 15, morale: { to: 'f', n: -10 } } } } },
    ],
  },
  {
    id: 'acrossSand', plot: true, stages: ['cause', 'ready'], title: 'One of ours across the sand',
    when: (run) => Boolean(topOpponent(run)?.house) && !topOpponent(run)?.rebel,
    target: (run, rng) => (run.roster.length ? { f: pick(rng, run.roster).id, opp: topOpponent(run).name, house: houseName(run, topOpponent(run)) } : null),
    text: ({ f, opp, house }) => `${f} lowers their voice. "${opp}, who fights for ${house ?? 'another house'}, is one of us. If you meet in the arena, beat them if you must, but let them live."`,
    choices: [
      { label: 'Promise nothing', refuse: true, effects: {} },
      { label: 'Promise to spare them', help: true, effects: { mark: true, trust: 1 } },
    ],
  },
  // ---- 7.10 (the designer): bolder requests. Each helps the cause and draws the palace's eye (suspicion is hidden). ----
  {
    id: 'cellarMeeting', plot: true, stages: ['favours', 'cause', 'ready'], title: 'A meeting in the cellar',
    target: (run, rng) => (run.roster.length ? { f: pick(rng, run.roster).id, name: freshName(run, rng) } : null),
    text: ({ f }) => `${f} brings word: twenty people need a room for one night, and your wine cellar has a door onto the back lane. "They'll be gone before the watch changes. Probably." Twenty strangers in one house is the kind of thing neighbours remember.`,
    choices: [
      { label: 'Keep the cellar locked', refuse: true, effects: {} },
      { label: 'Leave the back door unbarred', help: true, effects: { trust: 2, suspicion: 10, chance: { p: 0.5, win: { contact: 'new' }, lose: {} } } },
    ],
  },
  {
    id: 'letterInArmour', plot: true, stages: ['favours', 'cause'], title: 'A letter in the lining',
    when: (run) => run.roster.some((f) => f.gear.armor || f.gear.weapon),
    target: (run, rng) => {
      const list = run.roster.filter((f) => f.gear.armor || f.gear.weapon);
      return list.length ? { f: pick(rng, list).id } : null;
    },
    text: ({ f }) => `The rebels want a letter sewn into the lining of ${f}'s gear. A friend in the arena tunnels will cut it out on fight day. "The guards search wagons and baskets. They never search a gladiator." Not yet, anyway.`,
    choices: [
      { label: 'Refuse', refuse: true, effects: {} },
      { label: 'Sew it in', help: true, effects: { trust: 1, suspicion: 8, gold: 4 } },
    ],
  },
  {
    id: 'printingPress', plot: true, stages: ['favours', 'cause', 'ready'], title: 'A press behind the grain',
    when: (run) => run.plot?.seen.includes('pamphlets'),
    target: asker(anyFighter),
    text: () => 'The pamphlets you left alone have friends now. The rebels ask to hide a small printing press behind your grain jars and run it at night. It is not quiet, and ink does not wash off.',
    choices: [
      { label: 'No press in this house', refuse: true, effects: {} },
      { label: 'Make room behind the grain', help: true, effects: { trust: 2, suspicion: 12, crowd: 8 } },
    ],
  },
  {
    id: 'chainSalute', plot: true, stages: ['cause', 'ready'], title: 'The broken-chain salute',
    when: (run) => Boolean(run.bouts),
    target: (run) => {
      const [f] = run.roster.filter((x) => !x.spy).sort((a, b) => b.renown - a.renown || b.power - a.power);
      return f ? { f: f.id } : null;
    },
    text: ({ f }) => `Fight day. The rebels ask that ${f}, after their bout, raise a fist to the stands with a broken chain painted on the knuckles. Half the city will cheer. The other half will write it down.`,
    choices: [
      { label: 'No politics on the sand', refuse: true, effects: {} },
      { label: '${f} raises the fist', help: true, effects: { trust: 2, suspicion: 15, renown: { to: 'f', n: 3 }, crowd: 4 } },
    ],
  },
  {
    id: 'guardRota', plot: true, stages: ['cause', 'ready'], title: 'The guard rota',
    when: (run) => Boolean(run.bouts),
    target: asker(anyFighter),
    text: ({ f }) => `${f} has seen the arena guards' rota pinned up in the tunnels: who stands where when the Emperor comes. "I could copy it between bouts. If they catch me, I was looking for the latrine."`,
    choices: [
      { label: 'Too dangerous', refuse: true, effects: {} },
      { label: 'Copy it', help: true, effects: { chance: { p: 0.6, win: { trust: 2, suspicion: 5 }, lose: { suspicion: 20, morale: { to: 'f', n: -10 } } } } },
    ],
  },
  // ---- Act 3: the Cause ----
  {
    id: 'forgedPass', plot: true, stages: ['cause', 'ready'], title: 'The forged pass',
    when: (run) => !run.plot?.pass,
    target: asker(anyFighter),
    text: () => 'A clerk from the palace archives offers a pass bearing the Emperor\'s own seal. Shown at the right moment, it will send the Praetorians away once.',
    choices: [
      { label: 'Decline', refuse: true, effects: {} },
      { label: `Buy it (${PLOT.passCost} Gold)`, help: true, cost: PLOT.passCost, effects: { gold: -PLOT.passCost, pass: true, trust: 1 } },
    ],
  },
  {
    id: 'armBarracks', plot: true, repeat: true, stages: ['cause'], title: 'Steel for the cause',
    when: (run) => !isArmed(run),
    needed: (run) => !isArmed(run),
    target: asker(anyFighter),
    text: () => 'An old centurion asks for weapons from your storeroom. "When the day comes, the barracks must be armed. Two pieces of steel will do."',
    choices: [
      { label: 'Refuse', refuse: true, effects: {} },
      { label: 'Hand over two pieces of gear', help: true, needs: (run) => (gearCount(run) >= 2 ? null : 'Needs 2 pieces of gear (from the storeroom first, then off your weakest fighters).'), effects: { giveGear: 2, armed: true, suspicion: 10, trust: 1 } },
    ],
  },
  {
    id: 'recruitChampion', plot: true, repeat: true, stages: ['cause'], title: 'The champion',
    when: (run) => !run.roster.some((f) => f.id === run.plot?.champion),
    needed: (run) => !run.roster.some((f) => f.id === run.plot?.champion),
    // Your two most famous fighters; whether they'll say yes depends on their Morale (shown on the buttons).
    target: (run) => {
      const [f, g] = run.roster.filter((x) => !x.spy).sort((a, b) => b.renown - a.renown || b.power - a.power); // never the Emperor's spy
      return f ? { f: f.id, g: g?.id, fOdds: recruitOdds(f), gOdds: g ? recruitOdds(g) : null } : null;
    },
    text: ({ f, g }) => `The rebels want a champion from your house. "When the Emperor comes to the games, the crowd must see one of their own strike the blow." They name ${f}${g ? `, or ${g}` : ''}.`,
    choices: [
      { label: 'Keep your fighters out of it', refuse: true, effects: {} },
      { label: `Sound \${f} out (\${fOdds}% they say yes)`, help: true, effects: { chance: { p: (run, ev) => ev.fOdds / 100, win: { champion: 'f', trust: 1 }, lose: { morale: { to: 'f', n: -5 } } } } },
      { label: `Sound \${g} out (\${gOdds}% they say yes)`, help: true, needs: (run, ev) => (ev.g ? null : 'Only one fighter in your house.'), effects: { chance: { p: (run, ev) => ev.gOdds / 100, win: { champion: 'g', trust: 1 }, lose: { morale: { to: 'g', n: -5 } } } } },
    ],
  },
  // ---- Danger (any time after the Mark) ----
  {
    id: 'informer', plot: true, stages: ['favours', 'cause', 'ready'], title: 'A curious guest',
    when: (run) => run.plot.suspicion >= PLOT.suspicion.informer,
    target: asker(anyFighter),
    text: () => 'A guest at your table asks a great many questions about where your fighters go at night.',
    choices: [
      { label: 'Say nothing', effects: {} },
      { label: 'Feed him a story', effects: { chance: { p: 0.5, win: { suspicion: -20 }, lose: { suspicion: 20 } } } },
    ],
  },
  {
    id: 'barracksSearch', plot: true, stages: ['cause', 'ready'], title: 'A search of the barracks',
    when: (run) => Boolean(run.plot?.armed) && run.plot.suspicion >= PLOT.suspicion.informer,
    target: asker(anyFighter),
    text: () => 'Praetorians at the gate, with a writ to search the barracks "for stolen army property". The steel you gave the cause is under the floor of the mess hall.',
    choices: [
      { label: 'Let them search', effects: { chance: { p: 0.4, win: { suspicion: -10 }, lose: { disarm: true, suspicion: 10 } } } },
      { label: `Grease the sergeant (${PLOT.searchBribe} Gold)`, cost: PLOT.searchBribe, effects: { gold: -PLOT.searchBribe, suspicion: -5 } },
      { label: 'Stall them while the steel goes over the wall', help: true, effects: { chance: { p: 0.7, win: { trust: 1 }, lose: { disarm: true, suspicion: 15 } } } },
    ],
  },
  {
    id: 'theOffer', plot: true, stages: ['cause', 'ready'], title: 'The prefect\'s offer',
    when: (run) => run.week >= (run.plot?.causeWeek ?? 0) + PLOT.offerAfter,
    target: asker(anyFighter),
    text: () => `${PREFECT} calls on you, alone, and accepts a cup of wine he does not drink. "The Emperor knows there are traitors in the gladiator houses. Give him their names, and he will remember your house kindly. I will remember it too."`,
    choices: [
      { label: 'Know nothing', effects: { trust: 1 } },
      { label: 'Name the names', betray: true, effects: { betray: true } },
    ],
  },
  {
    id: 'raid', plot: true, forced: true, stages: ['mark', 'favours', 'cause', 'ready'], title: 'The Praetorians at dawn',
    when: (run) => run.plot.suspicion >= PLOT.suspicion.raid,
    target: (run, rng) => {
      const p = political(run);
      return p.length ? { f: pick(rng, p).id } : run.roster.length ? { f: pick(rng, run.roster).id } : null;
    },
    text: () => `The Praetorians come at dawn and fill the yard. ${PREFECT} stands in the middle of it, finishing an apple. He wants a traitor, or a reason to leave without one.`,
    choices: [
      { label: `Pay them off (${PLOT.bribe} Gold)`, cost: PLOT.bribe, effects: { gold: -PLOT.bribe, suspicion: -30 } },
      { label: `Hand over \${f}`, needs: (run, ev) => (run.roster.find((x) => x.id === ev.f)?.political ? null : 'No political prisoner to hand over.'), effects: { execute: 'f', suspicion: -40, trust: -3, morale: { to: 'all', n: -10 } } },
      { label: 'Show the forged pass', needs: (run) => (run.plot?.pass ? null : 'You have no forged pass.'), effects: { usePass: true, suspicion: -40 } },
      { label: 'Bar the gates', effects: { chance: { p: 0.5, win: { suspicion: -20, trust: 2 }, lose: { treason: true } } } },
    ],
  },
  // ---- Act 4: the coup ----
  {
    id: 'coupEve', plot: true, forced: true, stages: ['ready'], title: 'Tonight the Emperor attends',
    when: (run) => run.topTier === CIRCUITS.length + 1 && Boolean(run.bouts?.[run.topTier]) && run.boutPending,
    target: (run) => (run.roster.some((f) => f.id === run.plot?.champion) ? { f: run.plot.champion } : null),
    text: ({ f }) => `Silbannacus himself will watch the Grand Final from the imperial box. The barracks are armed. ${f} is ready. Every door in the city has a broken chain on it.`,
    choices: [
      { label: 'Not tonight', effects: { postpone: true } },
      { label: 'Tonight', help: true, effects: { coup: true } },
    ],
  },
];

export const PLOT_EVENT_BY_ID = Object.fromEntries(PLOT_EVENTS.map((e) => [e.id, e]));
// The win chance the coup Final adds for your champion: the armed barracks rising, plus the freed contacts' voices in the crowd.
export const coupBonus = (run) => (isArmed(run) ? PLOT.armedWin : 0) + Math.min(PLOT.contactMax, PLOT.contactWin * (run.plot?.freed ?? []).filter((c) => !c.caught).length);
