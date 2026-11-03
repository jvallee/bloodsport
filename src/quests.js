// Quests (5.4.0, the designer's request): the steward's assignments to restore the house, what fighters want, and the
// resistance's requests. Pure data: src/run.js gives, checks and rewards them. Every line of dialogue here is a
// PLACEHOLDER first draft for the designer; `goal` texts are rules and must stay accurate.

import { maxLevel } from './ludus.js';
import { STARTING_BUILDINGS } from './data.js';

const conquered = (run, tier) => Boolean(run.arenas[tier]?.conquered);
const decorPlaced = (run) => run.roster.some((f) => Object.values(f.decor).some((n) => n > 0));

// ---------- The steward's assignments: restore the house to its former glory ----------
// One at a time, in order; an assignment already done when its turn comes is skipped quietly.
export const STEWARD_TASKS = [
  { id: 'twoFighters', goal: 'Have two gladiators in the house', gold: 2, test: (run) => run.roster.length >= 2,
    say: 'One fighter is a hobby, Lanista. Two is a house. Find a second gladiator.' },
  { id: 'firstWin', goal: 'Win a match', gold: 2, test: (run) => run.history.some((h) => h.won),
    say: 'Your predecessor\'s banners still hang in the yard. Nobody has cheered them in years. Win a match, and they will.' },
  { id: 'decor', goal: 'Put a piece of decor in a fighter\'s room', gold: 2, test: decorPlaced,
    say: 'The barracks smell of damp and old fear. A bird, a brazier, anything. Happy fighters train harder.' },
  { id: 'quarters', goal: 'Upgrade the Fighter Quarters', gold: 3, test: (run) => maxLevel(run, 'quarters') >= 2,
    say: 'We cannot grow a house in a single room. Upgrade the Quarters.' },
  { id: 'pits', goal: 'Conquer the Dirt Pits (beat its Boss)', gold: 3, test: (run) => conquered(run, 1),
    say: 'Every house worth its name started in the Dirt Pits. Ours stayed there too long. Beat their Boss, and we leave.' },
  { id: 'newBuilding', goal: 'Build something the house never had', gold: 3, test: (run) => run.buildings.some((b) => !STARTING_BUILDINGS.includes(b.type)),
    say: 'The old Lanista sold half the estate to pay his wine merchant. Build on it again.' },
  { id: 'fourFighters', goal: 'Have four gladiators in the house', gold: 4, test: (run) => run.roster.length >= 4,
    say: 'When I was a boy this house fed twenty fighters. Four would be a start.' },
  { id: 'bronze', goal: 'Conquer the Bronze Arena', gold: 6, test: (run) => conquered(run, 2),
    say: 'The Bronze Arena remembers our colours. Remind it.' },
  { id: 'twoTitles', goal: 'Have a fighter who holds two Titles', gold: 6, test: (run) => run.roster.some((f) => (f.titles ?? []).length >= 2),
    say: 'A house is known by its champions. Make one that people name in the taverns.' },
  { id: 'level3', goal: 'Reach House level 3', gold: 6, test: (run) => run.prestigeLevel >= 3,
    say: 'The senators have started asking who we are. Let\'s give them a reason: reach House level 3.' },
  { id: 'silver', goal: 'Conquer the Silver Coliseum', gold: 8, test: (run) => conquered(run, 3),
    say: 'Your predecessor never saw the Silver Coliseum from the sand. You will.' },
  { id: 'level4', goal: 'Reach House level 4', gold: 8, test: (run) => run.prestigeLevel >= 4,
    say: 'We are nearly what we were. House level 4, and I will stop counting the old days.' },
  { id: 'imperial', goal: 'Conquer the Imperial Coliseum', gold: 10, test: (run) => conquered(run, 4),
    say: 'The Emperor\'s own arena. This house has never won there. Not once.' },
  { id: 'grand', goal: 'Win the Grand Tournament', gold: 0, test: (run) => run.status === 'won',
    say: 'One fight left, Lanista. The one they will sing about.' },
];
export const STEWARD_INTRO = 'This house was great once, before your predecessor drank it away. I kept a list of what we lost. Let\'s win it back, one thing at a time.';
export const stewardDone = (task) => `Done: ${task.goal.charAt(0).toLowerCase()}${task.goal.slice(1)}. The house is a little more itself again.`;

// ---------- What fighters want ----------
// `eligible(run, f, ctx)` returns the want's target (or null); `met(run, f, want)` true once done. `weeks`: how long it lasts
// (null: until it can no longer happen). Lines: `ask` when it appears, `thanks` when met, `sulk` when it lapses.
export const WANTS = {
  revenge: {
    label: (w) => `Face ${w.name} again`,
    goal: (w) => `Beat ${w.name}, who beat them`,
    weeks: null,
    ask: (w) => `${w.name} beat me, and laughed doing it. When they come back, send me. Nobody else.`,
    thanks: (w) => `${w.name} won't laugh again. Thank you for trusting me with it.`,
    sulk: () => 'They\'re gone, and I never got my answer.',
  },
  title: {
    label: (w) => `Become Champion of ${w.arena}`,
    goal: (w) => `Become Champion of ${w.arena}`,
    weeks: 24,
    ask: (w) => `I have fought in ${w.arena} long enough to know I can rule it. Give me the chance to be its Champion.`,
    thanks: (w) => `Champion of ${w.arena}. My mother would have wept. Then she would have bet on me.`,
    sulk: () => 'I asked for one chance. The months went by, and I watched others take it.',
  },
  room: {
    label: (w) => `A ${w.item} in their room`,
    goal: (w) => `Put a ${w.item} in their room`,
    weeks: 6,
    ask: (w) => `I don't ask for much. But a ${w.item} in my room would make these walls feel less like a cell.`,
    thanks: (w) => `The ${w.item}. You remembered. I sleep better already.`,
    sulk: () => 'Never mind. I didn\'t really expect it.',
  },
  mentor: {
    label: (w) => `Learn from ${w.name}`,
    goal: (w) => `Bond them with ${w.name} (an Exhibition bout, or both winning on one fight day)`,
    weeks: 12,
    ask: (w) => `${w.name} fights like nobody I've seen. If I could spar with them, even once, I'd learn more than in a year of drills.`,
    thanks: (w) => `${w.name} says I have a terrible guard and a good heart. I'll fix the guard.`,
    sulk: () => 'I suppose a veteran has better things to do than teach me.',
  },
  retire: {
    label: () => 'Retire with honour',
    goal: () => 'Retire them to the Hall of Champions',
    weeks: 12,
    ask: () => 'I have bled for this house long enough. Let me go while I can still walk out of the gate.',
    thanks: () => 'Thank you, Lanista. I\'ll tell them in the taverns that you were fair.',
    sulk: () => 'So I fight on. Fine. But don\'t expect me to be glad of it.',
  },
};

// ---------- The resistance's requests (the hidden plot) ----------
// Given by the political prisoner once the favours begin. `met(run, q)` and the trust they pay are in src/run.js.
export const REBEL_QUESTS = {
  gallery: {
    label: () => 'Build the Whispering Gallery',
    goal: () => 'Build the Whispering Gallery in the Estate',
    weeks: 16,
    ask: 'We need ears in your house. Build a gallery where the walls carry voices: you\'ll hear what the guards say about you, and we\'ll know how close the rising is.',
    thanks: 'The gallery is built. Listen well, Lanista. We are.',
    sulk: 'No gallery. Then we stay deaf, and so do you.',
  },
  lobby: {
    label: (q) => `Pass ${q.name} in the Senate`,
    goal: (q) => `Pass ${q.name} at the Patron Lounge`,
    weeks: 16,
    ask: (q) => `The Senate can do more for us than any blade. Get ${q.name} passed. If you have no seat at their table, buy one: build a Patron Lounge.`,
    thanks: (q) => `${q.name}. The streets heard about it before the ink was dry. Well done.`,
    sulk: () => 'The Senate went home and the law never came. The cause noticed.',
  },
};

// The Whispering Gallery's words (5.4.0; the name is the designer's to change).
export const GALLERY_INTRO = 'The walls of the Whispering Gallery carry every voice in the house to one small room.';

// ---------- Friendships (bonds) ----------
// When two fighters become friends (an Exhibition bout, or both winning on one fight day). PLACEHOLDER lines.
export const BOND_LINES = {
  narrator: (a, b, how) => `${how === 'exhibition' ? `After the bout in the ring, ${a} offers ${b} a hand up.` : `That night, ${a} and ${b} share a jug of wine by the brazier.`}`,
  first: (b) => `${b} fights like someone I'd want at my back. Don't tell them I said so.`,
  second: (a) => `${a}? Fine. Somebody has to keep them alive.`,
  steward: (a, b, comfort, gap) => `${a} and ${b} are friends now. Each is happier while the other is in the house (+${comfort} comfort). If one is ${gap} or more levels above the other, they'll teach them a little every week. And if one dies, the other will grieve.`,
};

// ---------- The rival house's champion and its Lanista ----------
export const RIVAL_LINES = {
  named: (house, champ) => `${house} names its champion: ${champ}. "Enjoy your little house while it lasts," their Lanista sends word.`,
  arrives: (house, champ) => `${champ} of ${house} is on this month's card. Their Lanista has paid the crowd to cheer.`,
  beaten: (house, champ) => `${champ} is beaten. In the stands, the Lanista of ${house} leaves before the crowd does.`,
  wins: (house, champ) => `${champ} of ${house} wins, and their Lanista toasts your house from across the sand.`,
  killed: (house, champ) => `${champ} is dead. ${house} will name another champion, and they will want blood.`,
  eyeing: (house, name) => `${house} has its eye on ${name} in the Market. Buy them this week, or they will.`,
  bought: (house, name) => `${house} buys ${name} from the Market before you could.`,
};
