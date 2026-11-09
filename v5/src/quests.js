// Quests (5.4.0, the designer's request): the steward's assignments to restore the house, what fighters want, and the
// resistance's requests. Pure data: src/run.js gives, checks and rewards them. Every line of dialogue here is a
// PLACEHOLDER first draft for the designer; `goal` texts are rules and must stay accurate.

import { maxLevel } from './ludus.js';
import { STARTING_BUILDINGS } from './data.js';

const conquered = (run, tier) => Boolean(run.arenas[tier]?.conquered);
// A tournament won in this arena: a single-match win, or a bracket's Final.
const tournamentWon = (run, tier) => run.history.some((h) => h.tier === tier && h.won && !h.summons && (!h.bracket || h.bracket === 'Final')); // the Emperor's summons is no tournament
const decorPlaced = (run) => run.roster.some((f) => Object.values(f.decor).some((n) => n > 0));

// ---------- The steward's assignments: restore the house to its former glory ----------
// One at a time, in order. Assignments already done when their turn comes are counted done and paid together (playtest
// LLM-11: they were skipped without a word). The middle ones give the steward something to say during a long arena.
export const STEWARD_TASKS = [
  { id: 'twoFighters', goal: 'Have two gladiators in the house', gold: 2, test: (run) => run.roster.length >= 2,
    say: 'One gladiator is a hobby, Lanista. Two is a house. I\'d find you a second myself, but nobody listens to stewards at the Market.' },
  { id: 'firstWin', goal: 'Win a match', gold: 2, test: (run) => run.history.some((h) => h.won),
    say: 'Your predecessor\'s banners still hang in the yard. Nobody has cheered them in years. I stopped noticing. Win a match, and perhaps I\'ll notice again.' },
  { id: 'decor', goal: 'Put a piece of decor in a fighter\'s room', gold: 2, test: decorPlaced,
    say: 'The barracks smell of damp and old fear. Mostly damp. A bird, a brazier, anything. Happy fighters train harder, or so the scrolls claim.' },
  { id: 'quarters', goal: 'Upgrade the Fighter Quarters', gold: 3, test: (run) => maxLevel(run, 'quarters') >= 2,
    say: 'We cannot grow a house in a single room. I have tried. Upgrade the Quarters.' },
  { id: 'pits', goal: 'Conquer the Dirt Pits (beat its Boss)', gold: 3, test: (run) => conquered(run, 1),
    say: 'Every great house started in the Dirt Pits. Ours stayed rather longer than it needed to. Beat their Boss and we can leave. I\'ll pack.' },
  { id: 'newBuilding', goal: 'Build something the house never had', gold: 3, test: (run) => run.buildings.some((b) => !STARTING_BUILDINGS.includes(b.type)),
    say: 'The old Lanista sold half the estate to pay his wine merchant. The wine merchant did very well out of us. Build on it again.' },
  { id: 'fourFighters', goal: 'Have four gladiators in the house', gold: 4, test: (run) => run.roster.length >= 4,
    say: 'When I was a boy this house fed twenty fighters. These days it mostly feeds me. Four would be a start.' },
  { id: 'trainer2', goal: 'Upgrade the Trainer Room', gold: 4, test: (run) => maxLevel(run, 'trainer') >= 2,
    say: 'The training posts are rotten through. I\'d replace them myself, but I was hired to count things, not lift them. Upgrade the Trainer Room.' },
  { id: 'bronzeWin', goal: 'Win a tournament in the Bronze Arena', gold: 4, test: (run) => tournamentWon(run, 2),
    say: 'Let them see our colours on the Bronze winners\' rail, just once. I\'ll have it painted on something.' },
  { id: 'bronze', goal: 'Conquer the Bronze Arena', gold: 6, test: (run) => conquered(run, 2),
    say: 'The Bronze Arena remembers our colours. Not fondly, but it remembers. Remind it.' },
  { id: 'twoTitles', goal: 'Have a fighter who holds two Titles', gold: 6, test: (run) => run.roster.some((f) => (f.titles ?? []).length >= 2),
    say: 'A house is known by its champions. Ours is currently known by its debts. A fighter with two Titles would change the conversation.' },
  { id: 'level3', goal: 'Reach House level 3', gold: 6, test: (run) => run.prestigeLevel >= 3,
    say: 'The senators have started asking who we are. I\'ve been telling them nobody. Reach House level 3, and I can stop.' },
  { id: 'trainer3', goal: 'Upgrade the Trainer Room to level 3', gold: 6, test: (run) => maxLevel(run, 'trainer') >= 3,
    say: 'The Silver crowds pay to see skill. Our yard mostly teaches enthusiasm. Trainer Room, level 3.' },
  { id: 'silverWin', goal: 'Win a tournament in the Silver Coliseum (its Final)', gold: 6, test: (run) => tournamentWon(run, 3),
    say: 'Three fights in one day, the last against the best they have. I won\'t watch. Tell me how it went.' },
  { id: 'silver', goal: 'Conquer the Silver Coliseum', gold: 8, test: (run) => conquered(run, 3),
    say: 'Your predecessor never saw the Silver Coliseum from the sand. He saw it from the tavern across the street, often.' },
  { id: 'level4', goal: 'Reach House level 4', gold: 8, test: (run) => run.prestigeLevel >= 4,
    say: 'We are nearly what we were. House level 4, and I\'ll stop counting the old days. I\'ll find something else to count. I always do.' },
  { id: 'imperialWin', goal: 'Win a tournament in the Imperial Coliseum (its Final)', gold: 8, test: (run) => tournamentWon(run, 4),
    say: 'The Emperor watches from his box in the Imperial Coliseum. I\'d rather he didn\'t, but if he must, give him something worth watching.' },
  { id: 'imperial', goal: 'Conquer the Imperial Coliseum', gold: 10, test: (run) => conquered(run, 4),
    say: 'The Emperor\'s own arena. This house has never won there. Not once. I checked twice, hoping I\'d miscounted.' },
  { id: 'grand', goal: 'Win the Grand Tournament', gold: 0, test: (run) => run.status === 'won',
    say: 'One fight left, Lanista. The one they\'ll sing about. I don\'t sing. I may hum.' },
];
export const STEWARD_INTRO = 'This house was great once, before your predecessor drank it away. Everyone else left. I stayed; I\'m still not sure why. I kept a list of what we lost. We might as well win it back, one thing at a time.';
export const stewardAlready = (goals) => `I was going to ask for this next: ${goals.join('; ')}. You'd already done it. I'll cross it off and let people think it was my idea.`;
export const stewardDone = (task) => `Done: ${task.goal.charAt(0).toLowerCase()}${task.goal.slice(1)}. The house is a little more itself again. Try not to let it go to your head.`;

// ---------- What fighters want ----------
// `eligible(run, f, ctx)` returns the want's target (or null); `met(run, f, want)` true once done. `weeks`: how long it lasts
// (null: until it can no longer happen). Lines: `ask` when it appears, `thanks` when met, `sulk` when it lapses.
export const WANTS = {
  revenge: {
    label: (w) => `Beat ${w.name}`,
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
    goal: (w) => `Make them friends with ${w.name}: spar the two in the Exhibition Ring, or have both win on the same fight day`,
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
    goal: () => 'Build the Whispering Gallery in the Estate (it needs a free plot)',
    weeks: 16,
    ask: 'We need ears in your house. Build a gallery where the walls carry voices: you\'ll hear what the guards say about you, and we\'ll know how close the rising is. It needs a free plot in your Estate.',
    thanks: 'The gallery is built. Listen well, Lanista. We are.',
    sulk: 'No gallery. Then we stay deaf, and so do you.',
  },
  lobby: {
    label: (q) => `Pass ${q.name} in the Senate`,
    goal: (q) => `Pass ${q.name} at the Patron Lounge`,
    weeks: 16,
    ask: (q, lounge) => `The Senate can do more for us than any blade. Get ${q.name} passed.${lounge ? ' Your Patron Lounge gives you a seat at their table: use it.' : ' If you have no seat at their table, buy one: build a Patron Lounge.'}`,
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
  // A pair's two lines, chosen by who they are. PLACEHOLDER.
  pairs: [
    [(b) => `${b} fights like someone I'd want at my back. Don't tell them I said so.`, (a) => `${a}? Fine. Somebody has to keep them alive.`],
    [(b) => `${b} snores like a bear. But they shared their bread when I had none.`, (a) => `And ${a} never once told the others I cried after my first fight.`],
    [(b) => `I owe ${b} a cup of wine for every time they've watched my back. That's a lot of wine.`, (a) => `${a} pays for none of it. I keep count anyway.`],
    [(b) => `${b} and I came from opposite ends of the Empire. Turns out the sand is the same everywhere.`, (a) => `So is the bad food. ${a} can have mine.`],
  ],
  stewardAgain: (a, b) => `Another friendship: ${a} and ${b}. The house grows sentimental. Keep them both alive, Lanista; grief is bad for training.`,
  steward: (a, b, comfort, gap) => `${a} and ${b} are friends now. I'd advise against it, but nobody asks the steward. Each is happier while the other is in the house (+${comfort} comfort). If one is ${gap} or more levels above the other, they'll teach them a little every week. And if one dies, the other will grieve.`,
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

// ---------- The Emperor's summons (the designer, 5.4.2) ----------
// PLACEHOLDER lines. The rules (and the steward's line) must stay accurate.
export const SUMMONS_LINES = {
  ask: 'The games in my Coliseum have grown dull, Lanista. I want new blood on the Imperial sand. Send me one of yours on this month\'s fight day.',
  steward: (favor) => `A summons, not a request. He doesn't make requests. On fight day, send a fighter to the Imperial Coliseum against one of its regulars, told to yield at the Death Gate or to fight to the death. Or refuse him, and lose ${-favor} Favour.`,
  refused: 'You refuse me? I will remember the name of your house, Lanista. I will remember it at every dinner.',
  won: (f) => `${f} beat my champion? On my own sand? Well. Someone bring me that fighter's name, I want to say it again.`,
  survived: (f) => `${f} lost, but still stood at the end. The crowd liked them. So, for a moment, did I.`,
  yielded: (f) => `${f} begged for their life on my sand. I let them keep it. I will not forget the begging.`,
  died: (f) => `${f} died well. That is all I asked of them.`,
};

// ---------- The Liaison (the designer, 5.4.2) ----------
// The first prisoner you buy: the steward points out what it means. PLACEHOLDER.
export const LIAISON_LINES = {
  saved: (f) => `${f} was on the list for the beasts, or the cross. Now they're on ours. I suppose that makes you the only Lanista in Rome who saves lives by buying them. Don't let it get about; it'll ruin your reputation.`,
};
