// Intro story and guided tutorial steps. Pure: picks the step to show from the game state.

import { STRESS } from './data.js';
import { currentBout } from './run.js';
import { mortalDanger } from './fight.js';

export const INTRO = [
  {
    title: 'Welcome to Battleworld',
    body: `<p>Battleworld is a planet that steals. Its portals pull warriors from every world and century to feed the arenas of <b>Emperor Silbannacus</b>, a Roman usurper who fused magic and machinery into an empire of bloodsport.</p>
      <p>This week the portals took <b>you</b>. The Emperor has made you <b>Lanista</b>, the manager of a bankrupt gladiator school (a <b>Ludus</b>) in the lowest arena on the planet.</p>`,
  },
  {
    title: 'How you win',
    body: `<p>Climb four arenas, from <b>the Dirt Pits</b> to <b>the Imperial Coliseum</b>. Each arena holds a circuit: <b>Tournament 1 → Tournament 2 → Boss</b>.</p>
      <p>Beat all four Bosses, then win <b>the Grand Tournament</b>, and the Emperor names you Master of the Games.</p>
      <p>You don't fight. You recruit, train, heal and choose who to send, then make the hard calls from the manager's box.</p>`,
  },
  {
    title: 'How you lose',
    body: `<p>The Emperor watches you through <b>Imperial Favor</b>. Losing a Boss in your top arena, forfeiting, and failing to pay his <b>yearly tribute</b> all cost Favor. <b>At 0 Favor you're executed.</b></p>
      <p>You also fall if every gladiator is dead and you can't afford another, or if your miserable gladiators revolt.</p>
      <p>Your fighters are mortal. One injury is survivable; with <b>two injuries, losing a round can kill them</b>. Between rounds you can always <b>throw in the towel</b> to save a fighter, at the cost of the match.</p>`,
  },
  {
    title: 'Power, Speed and luck',
    body: `<p><b>Power</b> wins rounds. What counts is the gap between the fighters: +1 is 55% per round, +3 is 70%, +5 is 95%.</p>
      <p><b>Speed</b> decides who strikes first (+10% to win that round, and the first chance to wound), and being faster makes you <b>harder to wound</b>. A balanced fighter wins and stays healthy.</p>
      <p>Traits, weapons and injuries tilt the odds further. Every number is shown in the fight and explained in the <b>Codex</b>. Good luck, Lanista.</p>`,
  },
];

// Ludus steps, in order; the first one whose condition holds (and isn't done) is shown.
export const STEPS = [
  { id: 'recruit', when: (r) => !r.roster.length, title: 'Recruit your first gladiators',
    body: 'Open the <b>Market</b> and recruit two fighters. Look at <b>Power</b> (the sword: wins rounds) and <b>Speed</b> (the arrow: strikes first). Every fighter has a Kind trait and a Class ability; hover over them to see what they do.' },
  { id: 'jobs', when: (r) => r.roster.length > 0 && r.week === 0, title: 'Give everyone a weekly job',
    body: `Each fighter does one job per week: <b>+1 Power</b> or <b>+3 Speed</b> (costs Gold and adds ${STRESS.train} Stress), <b>Rest</b> (removes Stress) or <b>Medbay</b> (heals injuries). One Trainer Room trains one fighter at a time. Then press <b>End week</b>.` },
  { id: 'stress', when: (r) => r.roster.some((f) => f.stress >= STRESS.train * 2), title: 'Watch the Stress bar',
    body: `Training stacks Stress. At <b>${STRESS.overtrained}+</b> a fighter is overtrained: they can't train, and in the arena they fight at −1 Power with one ability lost. <b>Train, train, rest</b> keeps them sharp.` },
  { id: 'bout', when: (r) => r.boutPending, title: 'Fight day',
    body: 'The last week of every month is a tournament. On the right you can see the opponent and <b>your odds</b> for each fighter. Sending one costs the <b>Prestige buy-in</b>; winning returns it with interest. You may also <b>skip</b> Tournaments 1 and 2 (never a Boss).' },
  { id: 'aftermath', when: (r) => r.history.some((h) => !h.skipped && !h.forfeit), title: 'After the fight',
    body: 'Wins pay Gold and Prestige; losses pay a little Gold. Injuries <b>stay until healed</b>: put hurt fighters on the <b>Medbay</b> job. Check the house log on the left to see what happened each week.' },
  { id: 'injury', when: (r) => r.roster.some((f) => f.injuries.length), title: 'Injuries and the Death Gate',
    body: 'An injured fighter shows red chips and filled <b>Death Gate</b> dots. At <b>two dots</b> the gate is open: losing a round can kill them. Heal them in the Medbay, or pay the Emergency Surgeon if you need them right away.' },
  { id: 'boss', when: (r) => r.boutPending && currentBout(r).boss, title: 'A Boss fight',
    body: 'Bosses are stronger and fight under a special <b>arena rule</b> (shown in red). They can\'t be skipped. Win and your fighter earns a <b>Title</b> (+1 Power), you gain Favor and a new arena opens. Lose and you lose <b>Favor</b>, and that Boss will be waiting for you, stronger.' },
  { id: 'levelup', when: (r) => r.roster.some((f) => f.pendingPerks.length), title: 'Level up!',
    body: 'Every match earns XP. When a fighter levels up, pick <b>one of three perks</b> on their card. Some perks need both Power and Speed, which is a reason to build balanced fighters.' },
  { id: 'arenas', when: (r) => Object.keys(r.arenas).length > 1, title: 'More arenas, more fights',
    body: 'Your old arenas still hold bouts every tournament week. Send a <b>different fighter to each</b> to earn Gold, XP and Renown. Only your <b>top arena</b> affects Favor, and crushing a much weaker opponent makes the crowd jeer.' },
  { id: 'morale', when: (r) => r.roster.some((f) => f.renown >= 4 || f.morale < 45), title: 'Keep your stars happy',
    body: 'Winning makes fighters famous (<b>Renown</b>), and famous fighters expect better rooms. Their <b>Morale</b> drifts toward comfort minus expectations: place decor, upgrade Quarters, build an Entertainment Room. Inspired fighters fight better; restless ones won\'t train.' },
  { id: 'estate', when: (r) => r.prestigeLevel >= 2, title: 'Your house has grown',
    body: 'A new Prestige level unlocks <b>room plots</b> and buildings. Visit the <b>Estate</b>: plots are limited, so choose what your house needs most. Trainer upgrades raise how far fighters can train.' },
];

// Fight-screen steps.
export const FIGHT_STEPS = [
  { id: 'fight-start', when: (m) => m.round === 0, title: 'How a round works',
    body: 'Each round: the faster fighter (Speed + a die) strikes first, Power decides the odds (the gauge shows the gap), traits pop up as coloured tags, then a roll decides the round. After that, each fighter rolls to injure the other. <b>First to win two rounds takes the match.</b>' },
  { id: 'fight-towel', when: (m) => m.round >= 1 && !m.over, title: 'Your call between rounds',
    body: 'Fight on, or <b>throw in the towel</b>: you lose the match and the buy-in, but your fighter is guaranteed to survive. It matters most when the <b>Death Gate</b> is open (two injuries).' },
  { id: 'fight-danger', when: (m) => !m.over && mortalDanger(m.a), title: 'Mortal danger',
    body: 'Your fighter has two or more injuries. If they lose the next round and get hit, they can die permanently. Is this match worth it?' },
  { id: 'fight-over', when: (m) => m.over, title: 'Why you won or lost',
    body: 'Open <b>"Show the round-by-round math"</b> to see every number: Power, the gap, each bonus, and the roll. Nothing is hidden.' },
];

export function nextStep(steps, done, subject) {
  return steps.find((s) => !done.includes(s.id) && s.when(subject)) ?? null;
}
