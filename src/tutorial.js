// Intro story and guided tutorial steps. Pure: picks the step to show from the game state.

import { STRESS } from "./data.js";
import { currentBout, trainGain } from "./run.js";
import { trainCap as trainCapFor } from "./ludus.js";
import { mortalDanger } from "./fight.js";

export const INTRO = [
  {
    title: "Another Day on Your Computer",
    body: `<p>You are scrolling, cruising, dare I say surfing the web. Suddenly the screen shimmers. A hand reaches out of it, grabs you by the head and pulls you through.</p>
      <p>You land hard on cold stone, under a sun that isn't yours. This is <b>Battleworld</b>, whose portals pull warriors from every world and century to feed the arenas of <b>Emperor Silbannacus</b>, a Roman usurper who fused magic and technology into an empire of bloodsport.</p>
      <p>Then everything goes dark.</p>`,
  },
  {
    title: "How you win",
    body: `<p>Climb four arenas, from <b>the Dirt Pits</b> to <b>the Imperial Coliseum</b>. Each arena holds a circuit: <b>Tournament 1 → Tournament 2 → Boss</b>.</p>
      <p>Beat all four Bosses, then win <b>the Grand Tournament</b>, and the Emperor names you Master of the Games.</p>
      <p>You don't fight. You recruit, train, heal and choose who to send, then make the hard calls from your box above the sand.</p>`,
  },
  {
    title: "How you lose",
    body: `<p>The Emperor watches you through <b>Imperial Favour</b>. Losing a Boss in your top arena, forfeiting, and failing to pay his <b>yearly tribute</b> all cost Favour. <b>At 0 Favour you're executed.</b></p>
      <p>You also fall if every gladiator is dead and you can't afford another, or if your miserable gladiators revolt.</p>
      <p>Your fighters are mortal. One injury is usually survivable; with <b>two injuries, losing a round can kill them</b> (the worst wounds, like Poisoned or Maimed, count as two). Between rounds you can always <b>capitulate</b> to save a fighter, at the cost of the match.</p>`,
  },
  {
    title: "Power, Speed and luck",
    body: `<p><b>Power</b> wins rounds. What counts is the gap between the fighters: +1 is 55% per round, +3 is 70%, +5 is 95%.</p>
      <p><b>Speed</b> decides who strikes first (+10% to win that round, and the first chance to wound), and being faster makes you <b>harder to wound</b>. A balanced fighter wins and stays healthy.</p>
      <p>Traits, weapons and injuries tilt the odds further. Every number is shown in the fight and explained in the <b>Codex</b>. Good luck, Lanista.</p>`,
  },
];

// The tutorial month (playtest #8: "more hand-holding for the first month"). The steward walks a new Lanista through it one
// step at a time. Each step is done when its goal is met, not by clicking "Got it"; it shows in a bar at the top (it never
// blocks the page) and `focus` makes the button to press glow. `tab`: where the step happens.
export const GUIDE = [
  {
    id: "recruit",
    when: (r) => r.roster.length < 1 && r.week === 0,
    goal: (r) => r.roster.length >= 1,
    tab: "market",
    focus: '[data-action="recruit"]',
    text: "Let's start with one gladiator. In the Market, look at each one's <b>Power</b> (the sword: wins rounds) and <b>Speed</b> (the arrow: strikes first), then press <b>Recruit</b> on at least one of them.",
  },
  {
    id: "jobs",
    when: (r) => r.roster.length > 0 && r.week === 0,
    goal: (r) => r.roster.some((f) => f.job === "trainPower" || f.job === "trainSpeed"),
    tab: "ludus",
    focus: '[data-action="job"][data-job="trainPower"]',
    text: (r) => `Now the Ludus. Every fighter does one job a week. Give your strongest fighter <b>+${trainGain(r, 'power')} Power</b>: training costs a little Gold and adds ${STRESS.train} Stress. Anyone else can <b>Rest</b> for now; one Trainer Room trains one fighter at a time.`,
  },
  {
    id: "endweek",
    when: (r) => r.week === 0 && r.roster.length > 0,
    goal: (r) => r.week > 0,
    tab: "ludus",
    focus: '[data-action="advance"]',
    // Designer's note (2026-11-01): make it explicit that someone must be training. PLACEHOLDER wording.
    text: (r) => `Jobs are set. Make sure at least one fighter is training: only a fighter on <b>Train Power</b> (+${trainGain(r, 'power')} Power) or <b>Train Speed</b> (+${trainGain(r, 'speed')} Speed) gets stronger, and an untrained house falls behind fast. Then press <b>End week</b> and the week plays out: training, rest and healing all happen at once.`,
  },
  {
    id: "tofight",
    when: (r) => r.week > 0 && !r.boutPending && !r.history.length,
    goal: (r) => r.boutPending || r.history.length > 0,
    tab: "ludus",
    focus: '[data-action="advance-tournament"]',
    text: `The last week of every month is fight day. Keep training, and rest a fighter whose Stress passes ${STRESS.overtrained - STRESS.train}: at ${STRESS.overtrained} they're overtrained and fight worse. When you're ready, <b>Skip to tournament</b> takes you straight there.`,
  },
  {
    id: "bout",
    when: (r) => r.boutPending && !r.history.length,
    goal: (r) => r.history.length > 0,
    tab: "ludus",
    focus: '[data-action="fight"]',
    text: "Fight day. Each fighter's line shows their odds, injury risk and the Power both sides will fight with. Sending one costs a little <b>Prestige</b>; winning pays it back with more. Pick your best and press <b>Send</b>.",
  },
];

// Ludus steps, in order; the first one whose condition holds (and isn't done) is shown.
export const STEPS = [
  {
    id: "trainerCap",
    when: (r) => r.roster.some((f) => f.trained >= trainCapFor(r)),
    title: "The Trainer cap",
    body: "A fighter has learned everything this Trainer Room can teach. Upgrade the <b>Trainer Room</b> in the Estate to raise the cap (3 → 5 → 8 → 13 → 21 points per fighter). Each level also raises the weekly fee by 1 Gold per trainee, so plan your Gold.",
  },
  {
    id: "stress",
    when: (r) => r.roster.some((f) => f.stress >= STRESS.train * 2),
    title: "Watch the Stress bar",
    body: `Training stacks Stress. At <b>${STRESS.overtrained}+</b> a fighter is overtrained: they can't train, and in the arena they fight at −1 Power with one ability lost. <b>Train, train, rest</b> keeps them sharp.`,
  },
  {
    id: "aftermath",
    when: (r) => r.history.some((h) => !h.skipped && !h.forfeit),
    title: "After the fight",
    body: "Wins pay Gold and Prestige; losses pay a little Gold. Injuries <b>stay until healed</b>: put hurt fighters on the <b>Medbay</b> job. Check the house log on the left to see what happened each week.",
  },
  {
    id: "injury",
    when: (r) => r.roster.some((f) => f.injuries.length),
    title: "Injuries and the Death Gate",
    body: "An injured fighter shows red chips and filled <b>Death Gate</b> dots. At <b>two dots</b> the gate is open: losing a round can kill them. Heal them in the Medbay, or pay the Emergency Surgeon if you need them right away.",
  },
  {
    id: "boss",
    when: (r) => r.boutPending && currentBout(r).boss,
    title: "A Boss fight",
    body: "Bosses are stronger and fight under a special <b>arena rule</b> (shown in red). They can't be skipped. Beat your <b>top arena's</b> Boss and your fighter earns a <b>Title</b> (+1 Power), you gain Favour and a new arena opens. Lose and you lose <b>Favour</b> (more in higher tiers), and that Boss will be waiting for you, stronger. Remember: a \"Strong favourite\" still loses about one match in four.",
  },
  {
    id: "levelup",
    when: (r) => r.roster.some((f) => f.pendingPerks.length),
    title: "Level up!",
    body: "Every match earns XP. When a fighter levels up, pick <b>one of three perks</b> on their card. Some perks need both Power and Speed, which is a reason to build balanced fighters.",
  },
  {
    id: "arenas",
    when: (r) => Object.keys(r.arenas).length > 1,
    title: "More arenas, more fights",
    body: "Your old arenas still hold bouts every tournament week. Send a <b>different fighter to each</b> to earn Gold, XP and Renown. Only your <b>top arena</b> can win you Favour. Win 3 times in an arena (or beat its Boss) to become its <b>Champion</b>; Champions are booed if they go back, but rookies fight there freely. Opponents <b>scout</b> a fighter who fights in your top arena two months running (+1 Power against them), so rotate your stars.",
  },
  {
    id: "morale",
    when: (r) => r.roster.some((f) => f.renown >= 4 || f.morale < 45),
    title: "Keep your stars happy",
    body: "Winning makes fighters famous (<b>Renown</b>), and famous fighters expect better rooms. Their <b>Morale</b> drifts toward comfort minus expectations: place decor, upgrade Quarters, build an Entertainment Room. Inspired fighters fight better; Discontented ones won't train.",
  },
  {
    id: "estate",
    when: (r) => r.prestigeLevel >= 2,
    title: "Your house has grown",
    body: "A new Prestige level unlocks <b>room plots</b> and buildings. Visit the <b>Estate</b>: plots are limited, so choose what your house needs most. Trainer upgrades raise how far fighters can train.",
  },
];

// Fight-screen steps.
export const FIGHT_STEPS = [
  {
    id: "fight-start",
    when: (m) => m.round === 0,
    title: "How a round works",
    body: "Each round: the faster fighter (Speed + a die) strikes first, Power decides the odds (the gauge shows the gap), traits pop up as coloured tags, then a roll decides the round. After that, each fighter rolls to injure the other. <b>First to win two rounds takes the match.</b>",
  },
  {
    id: "fight-tactics",
    when: (m) => !m.over,
    title: "Read your opponent",
    body: "Before each round, pick a <b>tactic</b>. <b>Press</b> beats Feint, <b>Feint</b> beats Guard, <b>Guard</b> beats Press: guess right and you get +10% to win the round. Every fighter has a <b>humor</b> (temperament) that hints at what they'll do: a Choleric opponent loves to Press, so Guard against them. The ★ marks what auto-play would pick.",
  },
  {
    id: "fight-towel",
    when: (m) => m.round >= 1 && !m.over,
    title: "Your call between rounds",
    body: "Fight on, or <b>capitulate</b>: you lose the match and the buy-in, but your fighter is guaranteed to survive. It matters most when the <b>Death Gate</b> is open (usually two injuries).",
  },
  {
    id: "fight-danger",
    when: (m) => !m.over && mortalDanger(m.a),
    title: "Mortal danger",
    body: "Your fighter's Death Gate is open (usually two injuries; lions in the arena open it sooner). If they lose the next round and are wounded, they can die. Is this match worth it?",
  },
  {
    id: "fight-over",
    when: (m) => m.over,
    title: "Why you won or lost",
    body: 'Open <b>"Show the round-by-round math"</b> to see every number: Power, the gap, each bonus, and the roll. Nothing is hidden.',
  },
];

// A step's text: some depend on the career (a season trains faster).
export const stepText = (step, run) => (typeof step.text === 'function' ? step.text(run) : step.text);

export function nextStep(steps, done, subject) {
  return steps.find((s) => !done.includes(s.id) && s.when(subject)) ?? null;
}
