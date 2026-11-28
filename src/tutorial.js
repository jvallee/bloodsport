// Intro story and guided tutorial steps. Pure: picks the step to show from the game state.

import { STRESS, MORALE, UNREST, ESPIONAGE } from "./data.js";
import { currentBout, boutFor, bossLossFavor, trainGain, tributePaid, espState } from "./run.js";
import { weeksUntilWinter } from "./calendar.js";
import { trainCap as trainCapFor } from "./ludus.js";
import { mortalDanger } from "./fight.js";

export const INTRO = [
  {
    title: "Another Day on Your Computer",
    body: `<p>You are scrolling, cruising, dare I say surfing the web. Suddenly the screen shimmers. A hand reaches out of it, grabs you by the head and pulls you through.</p>
      <p>You land hard on cold stone beneath an amber orbital mirror, on the floor of a decaying Roman villa. This is <b>Palatina</b>, capital of the Astral Principate, ruled by <b>Emperor Silbannacus</b>, a 3rd-century Roman usurper granted near-immortality by an ancient machine buried beneath the palace, who built a star-spanning empire of bloodsport.</p>
      <p>Then everything goes dark.</p>`,
  },
  {
    title: "How you win",
    body: `<p>Climb four arenas, from <b>the Dirt Pits</b> to <b>the Imperial Coliseum</b>. Each arena holds a circuit: <b>Tournament → Boss</b> in a season (or <b>Tournament 1 → Tournament 2 → Boss</b> on the Long Road).</p>
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

const firstBossDone = (r) => Boolean(r?.arenas?.[1]?.conquered)
  || (r?.history ?? []).some((h) => h.tier === 1 && Boolean(h.boss || h.forfeit));
// True on the house's first fight day once a bout has been fought (8.0.1: it was "at most two bouts so far", which
// said "your first fight is done" again after Tournament 2 on the Long Road).
const firstFightDay = (r) => {
  const fought = (r?.history ?? []).filter((h) => !h.skipped && !h.forfeit);
  return fought.length > 0 && fought.every((h) => h.week === r.week);
};

// The tutorial month & guide through the first Boss. The steward walks a new Lanista through it one step at a time.
// Each step is done when its goal is met, not by clicking "Got it"; it shows in a bar at the top (it never blocks the page)
// and `focus` makes the button to press glow. `tab`: where the step happens.
export const GUIDE = [
  {
    id: "recruit",
    label: "Recruit",
    when: (r) => (r.roster.length < 1 || (r.roster.length === 1 && r.roster[0].companion)) && r.week === 0,
    goal: (r) => r.roster.length >= (r.roster.some((f) => f.companion) ? 2 : 1),
    tab: "market",
    focus: '[data-action="draft-companion"], [data-action="recruit"]',
    text: "Let's start with a gladiator. In the Market, you may <b>draft up to two Core Companions for free</b> in Week 0, or recruit from the general rail. Look at each fighter's <b>Power</b> (the sword: wins rounds) and <b>Speed</b> (the arrow: strikes first). Higher is better, and dearer.",
  },
  {
    id: "jobs",
    label: "Assign jobs",
    when: (r) => r.roster.length > 0 && r.week === 0,
    goal: (r) => r.roster.some((f) => f.job === "trainPower" || f.job === "trainSpeed"),
    tab: "ludus",
    focus: '[data-action="job"][data-job="trainPower"]',
    text: (r) => `Now the Ludus. Every fighter does one job a week. Give your strongest fighter <b>+${trainGain(r, 'power')} Power</b>: training costs a little Gold and adds ${STRESS.train} Stress. Anyone else can <b>Rest</b> for now; one Trainer Room trains one fighter at a time.`,
  },
  {
    id: "endweek",
    label: "End Week 0",
    when: (r) => r.week === 0 && r.roster.length > 0,
    goal: (r) => r.week > 0,
    tab: "ludus",
    focus: '[data-action="advance"]',
    // Designer's note (2026-11-01): make it explicit that someone must be training. PLACEHOLDER wording.
    text: (r) => `Jobs are set. Make sure at least one fighter is training: only a fighter on <b>Train Power</b> (+${trainGain(r, 'power')} Power) or <b>Train Speed</b> (+${trainGain(r, 'speed')} Speed) gets stronger, and an untrained house falls behind fast. Then press <b>End week</b> and the week plays out: training, rest and healing all happen at once.`,
  },
  {
    id: "tofight",
    label: "To fight day",
    when: (r) => r.week > 0 && !r.boutPending && !r.history.length,
    goal: (r) => r.boutPending || r.history.length > 0,
    tab: "ludus",
    focus: '[data-action="advance-tournament"]',
    text: `The last week of every month is fight day. Keep training, and rest a fighter whose Stress passes ${STRESS.overtrained - STRESS.train}: at ${STRESS.overtrained} they're overtrained and fight worse. When you're ready, <b>⚔ To fight day</b> takes you straight there.`,
  },
  {
    id: "bout",
    label: "First bout",
    when: (r) => r.boutPending && !r.history.length,
    goal: (r) => r.history.length > 0,
    tab: "ludus",
    focus: '[data-action="fight"]',
    text: "Fight day. Each fighter's line shows their odds (Favoured, Even fight, Underdog), the risk of injury and death, and the Power both sides bring. Sending one costs a little <b>Prestige</b>; winning pays it back with more. Pick your best and press <b>Send</b>. You'll watch from the box and choose a tactic each round.",
  },
  {
    id: "firstweekend",
    label: "First month's end",
    when: (r) => firstFightDay(r) && Boolean(r.bouts) && !firstBossDone(r),
    goal: (r) => !r.bouts,
    tab: "ludus",
    focus: '[data-action="advance"]',
    text: "Your first fight is done. Win or lose, it paid Gold and XP. If anyone came back hurt, set their job to <b>Medbay</b>: wounds stay until they heal. Then <b>End week</b>: a new month brings new gladiators to the Market and a new tournament. From here on, you're the Lanista; I'll only speak up when there's something new.",
  },
  // Guided to the first Boss (8.0.1). PLACEHOLDER wording in Galen-VII's voice.
  // `settles`: the step is about a card or choice that blocks everything else. It is shown first (nextGuideStep),
  // whenever that happens before the first Boss (its goal is only met once it no longer applies, so it is never
  // marked done), it joins the checklist only while it is on show, and the bar does not also say "First: ..." about
  // it. `covers`: tips (STEPS ids) the step replaces, marked done the moment it is shown.
  {
    id: "eventcard",
    label: "House event",
    settles: "event",
    when: (r) => !firstBossDone(r) && Boolean(r.event),
    goal: (r) => !r.event,
    tab: "ludus",
    focus: '[data-action="event-choice"]',
    text: "A card has come in from the house. Each choice says what it costs and what it gives, in plain numbers. Choose one. The week waits until you do.",
  },
  {
    id: "fortunehand",
    label: "Fortune",
    settles: "fortune",
    covers: ["fortune"],
    when: (r) => !firstBossDone(r) && Boolean(r.fortune),
    goal: (r) => !r.fortune,
    tab: "ludus",
    focus: '[data-action="fortune"], [data-action="fortune-pass"]',
    text: "The month turns, and Fortune deals a hand. Take one card, spin again up to three times for rising Gold, or pass for a little coin. The week waits until you decide.",
  },
  {
    id: "perkchoice",
    label: "Level up",
    settles: "perk",
    when: (r) => !firstBossDone(r) && !r.fortune && r.roster.some((f) => f.pendingPerks?.length),
    goal: (r) => !r.roster.some((f) => f.pendingPerks?.length),
    tab: "ludus",
    focus: '[data-action="perk"]',
    text: "One of ours has levelled up. Pick a perk on their card before the week can proceed. Several stronger perks expect both Power and Speed, which is my quiet argument for balance.",
  },
  {
    id: "bossprep",
    label: "Boss prep",
    when: (r) => !firstBossDone(r) && !r.fortune && !r.boutPending && r.history.length > 0 && !r.roster.some((f) => f.pendingPerks?.length) && Boolean(r.arenas?.[1]) && boutFor(r, 1).boss,
    goal: (r) => firstBossDone(r) || (r.boutPending && Boolean(r.arenas?.[1]) && boutFor(r, 1).boss),
    tab: "ludus",
    focus: '[data-action="advance-tournament"]',
    text: (r) => `Next on the Dirt Pits card is the <b>Boss Tournament</b>. Bosses cannot be skipped, and a loss costs <b>${Math.abs(bossLossFavor(1, r))} Imperial Favour</b>. Mend any wounds, rest anyone nearing ${STRESS.overtrained} Stress, and advance to fight day when you are ready.`,
  },
  {
    id: "bossday",
    label: "First Boss",
    when: (r) => !firstBossDone(r) && r.boutPending && Boolean(r.arenas?.[1]) && boutFor(r, 1).boss,
    goal: (r) => firstBossDone(r),
    tab: "ludus",
    focus: '[data-action="fight"]',
    text: (r) => `Boss day in the Dirt Pits. Read the odds before you commit: a win earns a <b>Title</b> (+1 Power) and opens the Bronze Arena, while a loss costs <b>${Math.abs(bossLossFavor(1, r))} Imperial Favour</b>. Send your steadier hand.`,
  },
];

// Pure: the guide step to show now, or null. A step that settles a blocking card or choice is tried before the rest,
// so the bar says what to do this minute; otherwise the steps run in their written order.
export function nextGuideStep(done, run) {
  return nextStep(GUIDE.filter((g) => g.settles), done, run) ?? nextStep(GUIDE.filter((g) => !g.settles), done, run);
}

// Pure: walks the guide past every step whose goal is already met. Returns the step to show (or null) and the ids to
// mark done: each finished step, and the tips covered by a step the moment it is shown. The page and the text client
// both use this.
export function advanceGuide(done, run) {
  const seen = [...(Array.isArray(done) ? done : [])];
  const completed = [];
  const mark = (ids) => { for (const id of ids) if (!seen.includes(id)) { seen.push(id); completed.push(id); } };
  for (;;) {
    const step = nextGuideStep(seen, run);
    if (step) mark(step.covers ?? []);
    if (!step || !step.goal(run)) return { step, completed };
    mark([step.id]);
  }
}

// Pure: what must be settled before the guide's button will work (a verdict, an event card, a Fortune hand or a
// pending perk), or null. Nothing is said when the step on show is the one that settles it.
// The page and the text client both put "First: " before the line, so the line does not say it again.
const GUIDE_BLOCKERS = {
  mercy: "Decide the beaten opponent's fate: spare or kill.",
  event: 'Settle the house event card.',
  fortune: 'Choose a Fortune card, or pass.',
  perk: "Pick the pending level-up perk on your fighter's card.",
};
export function guideBlocker(run, step = null) {
  if (!run || run.status !== 'active') return null;
  const pending = run.mercy ? 'mercy'
    : run.event ? 'event'
      : run.fortune ? 'fortune'
        : (run.roster ?? []).some((f) => f.pendingPerks?.length) ? 'perk' : null;
  if (!pending || step?.settles === pending) return null;
  return GUIDE_BLOCKERS[pending];
}

// Pure: step counter and compact checklist for the guide. The checklist is the written steps, ticked up to the one
// the walk is at. A step that settles a card or choice joins it only while it is on show, just before that one.
// Between two written steps (a card comes in after the first month's end and before Boss prep applies) the walk is
// at the step after the last one whose goal is met, so the counter never runs to the end and back.
export function guideProgress(run, done = []) {
  const doneList = Array.isArray(done) ? done : [];
  const written = GUIDE.filter((g) => !g.settles);
  const current = nextGuideStep(doneList, run);
  const resume = current?.settles ? nextStep(written, doneList, run) : current;
  let reached = written.length - 1;
  while (current && reached >= 0 && !written[reached].goal(run)) reached -= 1;
  const at = resume ? written.indexOf(resume) : reached + 1;
  const items = written.map((g, i) => ({ id: g.id, label: g.label ?? g.id, done: doneList.includes(g.id) || i < at, current: current?.id === g.id }));
  if (current?.settles) items.splice(at, 0, { id: current.id, label: current.label ?? current.id, done: false, current: true });
  const currentIdx = items.findIndex((x) => x.current);
  return { index: currentIdx >= 0 ? currentIdx + 1 : items.length, total: items.length, items };
}

// Pure: normalises saved tutorial preferences and keeps prior "Skip tutorial" choices skipped across newly added steps.
const LEGACY_GUIDE_IDS = ['recruit', 'jobs', 'endweek', 'tofight', 'bout', 'firstweekend'];
export function migrateTutorialPrefs(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const list = Array.isArray(src.tutorial)
    ? [...new Set(src.tutorial.filter((x) => typeof x === 'string'))]
    : [];
  const allLegacySkipped = LEGACY_GUIDE_IDS.every((id) => list.includes(id))
    && STEPS.every((s) => list.includes(s.id))
    && FIGHT_STEPS.every((s) => list.includes(s.id));
  const tutorialOff = typeof src.tutorialOff === 'boolean' ? src.tutorialOff : allLegacySkipped;
  return { ...src, tutorial: list, tutorialOff };
}

// Ludus steps, in order; the first one whose condition holds (and isn't done) is shown.
export const STEPS = [
  {
    id: "trainerCap",
    when: (r) => r.roster.some((f) => f.trained >= trainCapFor(r)),
    title: "The Trainer cap",
    body: "A fighter has learned everything this Trainer Room can teach. Upgrade the <b>Trainer Room</b> in the Estate to raise the cap (3 → 5 → 8 → 13 → 21 training weeks per fighter). Each level also raises the weekly fee by 1 Gold per trainee, so plan your Gold. Until then, a capped fighter is better off resting, fighting, or teaching by example.",
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
    title: "The house remembers",
    body: "The <b>house log</b> on the left keeps everything that happens, <b>Word in the city</b> tracks what the street is saying about you, and each fighter's <b>Story</b> keeps their own chapters. I read all three. Someone should.",
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
    body: "Every match earns XP, a win more than a loss. When a fighter levels up, pick <b>one of three perks</b> on their card; the week can't end until you do. Some perks need both Power and Speed, which is a reason to build balanced fighters. At level 3 a fighter learns a <b>signature move</b>: once a fight, at a moment you choose.",
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
    id: "event",
    when: (r) => !r.event && (r.recentEvents ?? []).length > 0,
    title: "The house has a life of its own",
    body: "That won't be the last surprise. Most months something happens in a house like this: a visitor, a quarrel, an offer. Each card says what every choice costs and gives, in plain numbers. Where it says <b>a gamble</b>, it means it. And some cards aren't what they seem; I'd read the prison records, if I were you.",
  },
  {
    id: "fortune",
    when: (r) => Boolean(r.fortune),
    title: "Fortune's wheel",
    body: "At the start of some months the wheel of Fortune turns for your house. Take <b>one card</b>: a boon, gear, a fighter, a wager, or a <b>relic</b> that stays with the house. You may spin again up to three times for rising Gold, or pass for a little coin, though the next hand might be worse. Fortune is like that.",
  },
  {
    id: "tribute",
    when: (r) => weeksUntilWinter(r.week) > 0 && weeksUntilWinter(r.week) <= 8 && !tributePaid(r),
    title: "The Emperor's tribute",
    body: "Winter is coming, and with it the Emperor's yearly <b>tribute</b>; the Ludus shows how much and when. Pay it early if you like. If the strongbox is short when it falls due, it costs <b>Imperial Favour</b>, and at 0 Favour he executes you. I keep a little aside. You should too.",
  },
  {
    id: "mutinous",
    when: (r) => r.roster.some((f) => f.morale < MORALE.mutinous),
    title: "A Mutinous fighter",
    body: `A fighter below Morale ${MORALE.mutinous} is <b>Mutinous</b>: they won't fight, they stir up <b>unrest</b>, and some nights they brawl, steal or go over the wall. If unrest reaches ${UNREST.threshold}, the chains break: a revolt in your own barracks. Calm them with decor, a better room, or an Entertainment Room.`,
  },
  {
    id: "mole",
    when: (r) => espState(r).clues.length > 0,
    title: "Someone is talking",
    body: `A clue: someone in your house sends word to a rival, or the palace. Every week a mole stays, they sell what they learn. Investigate a fighter from their card for <b>${ESPIONAGE.investigate} Gold</b>; the wrong one will resent it. The Estate keeps the clues together.`,
  },
  {
    id: "liaison",
    when: (r) => (r.liaisonOffers ?? []).length > 0,
    title: "Prisoners for sale",
    body: "The Liaison buys prisoners out of the city cells: cheap fighters, often hurt, always grateful, or so they say. Read their <b>prison records</b> before you buy. Not every prisoner is what the guards wrote down.",
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
    body: "Before each round, pick a <b>tactic</b>. <b>Press</b> beats Feint, <b>Feint</b> beats Guard, <b>Guard</b> beats Press: guess right and you get +10% to win the round. Every fighter has a <b>humour</b> (temperament) that hints at what they'll do: a Choleric opponent loves to Press, so Guard against them. The ★ marks what auto-play would pick.",
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
    body: 'Open <b>"Show the round-by-round maths"</b> to see every number: Power, the gap, each bonus, and the roll. Nothing is hidden.',
  },
];

// A step's text: some depend on the career (a season trains faster).
export const stepText = (step, run) => (typeof step.text === 'function' ? step.text(run) : step.text);

export function nextStep(steps, done, subject) {
  return steps.find((s) => !done.includes(s.id) && s.when(subject)) ?? null;
}
