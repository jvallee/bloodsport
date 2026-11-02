// Dialogue: characters who speak to you in a dialogue box (the Emperor, your steward, a narrator). Pure data, plus the
// rule for which scene is due. The words are the designer's to write: every line marked PLACEHOLDER is a first draft.
//
// A scene is a list of beats: { speaker, text } (plain text) or { speaker, title, html } (trusted HTML from our own
// files). Speakers are keys of SPEAKERS. Scenes are cosmetic: they never change the career, so replays don't record them.

import { INTRO } from "./tutorial.js";
import { FAVOR, BUILDINGS, PLOT } from "./data.js";
import { GRAND_TIER, raisable } from "./run.js";
import { WEEKS_PER_YEAR } from "./calendar.js";

export const SPEAKERS = {
  narrator: { name: "", portrait: "narrator" },
  emperor: { name: "Emperor Silbannacus", portrait: "emperor" },
  steward: { name: "Your steward", portrait: "steward" }, // a plain, neutral helper (the designer's choice)
  rebel: { name: "A prisoner", portrait: "narrator" }, // a political prisoner: their beats carry the fighter (name and face)
};

export const SCENES = {
  // The first thing a new player sees. The first beat is the intro's opening page (src/tutorial.js), in the designer's words.
  opening: [
    { speaker: "narrator", title: INTRO[0].title, html: INTRO[0].body },
    // PLACEHOLDER: the Emperor pulled you through the portal himself, and says the stakes.
    {
      speaker: "emperor",
      text: "Ah. Awake at last. Good: you will have plenty of time to sleep if you die.",
    },
    {
      speaker: "emperor",
      text: "I am Silbannacus, Emperor of Battleworld, and I pulled you here myself, out of a world of glowing screens and soft hands. You will find mine harder.",
    },
    {
      speaker: "emperor",
      text: "You are my newest Lanista: the master of a gladiator school, a Ludus. Yours is a ruin in the Dirt Pits, the lowest arena on the planet.",
    },
    {
      speaker: "emperor",
      text: "Buy fighters. Train them. Send them onto the sand. Climb my four arenas and beat their Bosses. Win my Grand Tournament, and I will name you Master of the Games.",
    },
    {
      speaker: "emperor",
      text: "Pay my tribute every winter. Keep my favour. Lose it, and the crowd will watch you die on the same sand as my gladiators.",
    },
    {
      speaker: "emperor",
      text: "I took this throne with a knife. I know exactly what a person will do to keep breathing. Show me.",
      // Your answer (playtest #8: response dialogue). PLACEHOLDER lines; flavour only, nothing in the career changes.
      replies: [
        { label: "I will.", then: [{ speaker: "emperor", text: "Good. Confidence is cheap, Lanista. Let us see what it buys." }] },
        { label: "Send me home.", then: [{ speaker: "emperor", text: "Home? Battleworld does not return what it takes. This is home now." }] },
        { label: "Say nothing.", then: [{ speaker: "emperor", text: "Silence. Wise, or terrified. Either will do." }] },
      ],
    },
    // PLACEHOLDER: the steward, plain and neutral, takes over as your guide.
    {
      speaker: "steward",
      text: "It's okay, you can relax, he's gone. I am the steward of this house. I'll tell you what you need to know to not die on your first day.",
    },
    {
      speaker: "steward",
      text: "First, gladiators. The Market has a few for sale. Let's see what your purse can buy. I know buying people might not be the most ethical choice, but you can do that or die.",
    },
  ],
  // The Emperor returns at a few turning points (PLACEHOLDER lines).
  firstBoss: [
    {
      speaker: "emperor",
      text: "One of yours has beaten a Boss. The crowd enjoyed it. So did I, briefly.",
    },
    {
      speaker: "emperor",
      text: "Do not let it go to your head, Lanista. Heads come off easily in my empire.",
    },
  ],
  tribute: [
    {
      speaker: "emperor",
      text: "Winter, and my collectors have knocked on your door. A Lanista who pays is a Lanista who lives. Remember the arithmetic.",
    },
  ],
  lowFavor: [
    {
      speaker: "emperor",
      text: "Your name came up at dinner, Lanista. Nobody enjoyed it.",
    },
    {
      speaker: "emperor",
      text: "Give me a reason to say it differently. Soon.",
    },
  ],
  grand: [
    {
      speaker: "emperor",
      text: "So. You have reached my Grand Tournament. I will be watching from my box.",
    },
    {
      speaker: "emperor",
      text: "Win, and you stand beside me. Lose, and you will have climbed a very long way to fall.",
    },
  ],
};

// The Emperor's return visits, in the order they're checked. Each plays once per career.
const RETURNS = [
  { id: "grand", when: (run) => run.topTier >= GRAND_TIER },
  {
    id: "firstBoss",
    when: (run) => run.history.some((h) => h.boss && h.top && h.won),
  },
  { id: "tribute", when: (run) => run.week >= WEEKS_PER_YEAR - 3 }, // just after the first winter's tribute is collected
  { id: "lowFavor", when: (run) => run.favor <= FAVOR.warning },
];

// The scene due now, if any: `seen` is the list of scene ids already played this career.
export function dueScene(run, seen = []) {
  if (run.status !== "active") return null;
  return RETURNS.find((r) => !seen.includes(r.id) && r.when(run))?.id ?? null;
}

// ---------- The rebel's confession (the designer's request, 2026-11-01) ----------
// The first political prisoner in your house takes you aside and says plainly that there is a rising, and what they have
// heard of you. What they say depends on your record. Every line is a PLACEHOLDER first draft for the designer.
// Pure: reads the run, changes nothing (scenes are cosmetic, so replays don't record them).
export function houseRecord(run) {
  const verdicts = run.history.filter((h) => h.verdict);
  const others = run.roster.filter((f) => !f.political);
  return {
    spared: verdicts.filter((h) => h.verdict === 'spare').length,
    sparedForBlood: verdicts.filter((h) => h.verdict === 'spare' && h.mercy === 'kill').length, // mercy at a cost to you
    killed: verdicts.filter((h) => h.verdict === 'kill').length, // thumbs down
    released: run.released ?? 0,
    fallen: run.fallen.length,
    morale: others.length ? Math.round(others.reduce((n, f) => n + f.morale, 0) / others.length) : null,
  };
}
export function rebelScene(run, f) {
  const r = houseRecord(run);
  const say = (text) => ({ speaker: "rebel", fighter: f, text });
  const heard = [];
  if (r.sparedForBlood) heard.push(say("You have spared lives on the sand even when the crowd bayed for blood, and the risk of it was yours. People noticed."));
  else if (r.spared) heard.push(say(`You have shown mercy in the arena${r.spared > 1 ? ` ${r.spared} times` : ""}. The crowd forgets. We don't.`));
  if (r.released) heard.push(say("You have bought fighters, and then set them free. Hardly any Lanista does that."));
  if (r.killed >= 3 && !r.spared) heard.push(say(`You have turned your thumb down ${r.killed} times, and never up. They say you enjoy it. I hope they're wrong.`));
  else if (r.killed) heard.push(say(`You have finished beaten fighters${r.killed > 1 ? ` ${r.killed} times` : ""}. I won't pretend that makes this easier to say.`));
  if (r.morale !== null && r.morale >= 70) heard.push(say("Your fighters eat well and sleep warm. In this city, that counts for something."));
  else if (r.morale !== null && r.morale < 40) heard.push(say("Your fighters are miserable, and miserable people talk. Be careful who hears this."));
  if (!heard.length) heard.push(say("I don't know you yet. I'm telling you anyway, because there is no one else to tell."));
  const kind = r.sparedForBlood || r.released || (r.spared && !r.killed) || (r.morale ?? 0) >= 70;
  return [
    { speaker: "narrator", text: `That night, ${f.name} asks to speak with you alone.` },
    say("I am not what the guards wrote on my record. There is a rising against Silbannacus, and I am part of it. The broken chain you may see chalked on doors is ours."),
    ...heard.slice(0, 2),
    say("No one should be owned by another. Not me by you, and not you by the Emperor. We are all his slaves, Lanista. Some of us just hold keys."),
    {
      ...say(kind ? "I think you might be one of us, whether you know it or not. You'll hear from us. Watch the doors." : "I don't know what you are yet. But you'll hear from us. Watch the doors."),
      replies: [
        { label: "I'm listening.", then: [say("Good. Say nothing to anyone, and keep your eyes open.")] },
        { label: "Why tell me?", then: [say("Because a Lanista with a ludus full of fighters is the most dangerous person in this city, if they choose to be.")] },
        { label: "Say nothing.", then: [say("Silence. Fine. Silence keeps people alive here.")] },
      ],
    },
  ];
}
// ---------- The Emperor's demands: met and missed (the designer, 5.4.0) ----------
// PLACEHOLDER lines: the Emperor reacts the moment a demand is met, and when its fight day ends without it.
export function demandMetScene(goal, favor, gold) {
  return [
    { speaker: "emperor", text: "Good. That is what I asked for, and you gave it to me. I remember those who please me." },
    { speaker: "steward", text: `Demand met: ${goal}. When fight day ends he pays +${favor} Favour and ${gold} Gold.` },
  ];
}
export function demandMissedScene(goal, favor) {
  return [
    { speaker: "emperor", text: "I asked you for one thing, Lanista. One. The month is over, and I am still waiting." },
    { speaker: "steward", text: `Demand missed: ${goal}. Imperial Favour ${favor < 0 ? `−${-favor}` : `+${favor}`}.` },
  ];
}

// The fighter whose confession is due: the first political prisoner in the roster, while the plot runs. It waits
// (5.4.0, the designer: it all came out the week they were bought): first the chalk sign copied and the prisoner's
// guarded word about it (rebel-favours), then PLOT.confessTrust trust earned through favours.
export function dueRebel(run, seen) {
  const p = run.plot;
  if (run.status !== "active" || !p || p.ended || seen.includes("rebel") || !seen.includes("rebel-favours")) return null;
  if (p.stage === "favours" && p.trust < PLOT.confessTrust) return null;
  return run.roster.find((f) => f.political) ?? null;
}

// ---------- The rebel speaks again (fun idea, 5.3.0) ----------
// As the plot moves on (src/run.js advancePlot), the same prisoner takes you aside once at each stage. What they say grows
// with their trust, and warns you when the palace is watching. Every line is a PLACEHOLDER first draft for the designer.
export const REBEL_STAGES = ["favours", "cause", "ready"];
export function rebelStageScene(run, f, stage, { confessed = true } = {}) {
  const say = (text) => ({ speaker: "rebel", fighter: f, text });
  const watched = (run.plot?.suspicion ?? 0) >= 40;
  const lines = {
    favours: [
      say("You copied the sign. They saw. From now on they'll ask you for small things: a door left open, a stranger fed, a name forgotten."),
      say("Do them, and they'll start to trust you. Refuse them twice, and they'll go quiet for good."),
      say("Who are they? Not yet. Do this well, and one day I'll tell you."),
    ],
    cause: [
      say("They trust you now. More than they trust me, I think."),
      say("A rising needs a sword in the arena: one of your fighters, standing in the Grand Tournament when the Emperor watches. And it needs the barracks armed."),
      say("Choose your champion carefully, Lanista. If they fall, the rising falls with them."),
    ],
    ready: [
      say("It's ready. The blades are oiled, the crowd knows the signal, and your champion knows what to do."),
      say("When the Emperor comes to watch the Grand Tournament, win the Final. Then look up at his box. We'll do the rest."),
    ],
  }[stage] ?? [];
  if (watched) lines.push(say("And be careful. Praetorians have been asking questions about your house. Every favour you do us, they notice."));
  return [{ speaker: "narrator", text: confessed ? `${f.name} finds you alone again.` : `${f.name} catches your eye across the yard, and waits until the guards have gone.` }, ...lines];
}
// The stage scene due now, if any: { id, fighter, beats }, while the plot runs and its prisoner (or another political
// prisoner) is still in your house. The favours scene comes first, before the confession (5.4.0); the rest after it.
export function dueRebelStage(run, seen) {
  const p = run.plot;
  if (run.status !== "active" || !p || p.ended) return null;
  const f = run.roster.find((x) => x.political);
  if (!f) return null;
  const reached = REBEL_STAGES.slice(0, REBEL_STAGES.indexOf(p.stage) + 1);
  const stage = reached.find((st) => !seen.includes(`rebel-${st}`));
  if (!stage || (stage !== "favours" && !seen.includes("rebel"))) return null;
  return { id: `rebel-${stage}`, fighter: f, beats: rebelStageScene(run, f, stage, { confessed: seen.includes("rebel") }) };
}

// The steward's news (playtest #8): what changed in the house that's worth a word. Pure: compare two snapshots.
export function newsSnapshot(run) {
  return {
    level: run.prestigeLevel,
    market: run.market.map((f) => f.id).join(),
    liaison: run.liaisonOffer?.id ?? null,
    armourer: run.armourerStock.join(),
    bodies: raisable(run).map((f) => f.id).join(),
  };
}
export function stewardNews(before, after, run) {
  const news = [];
  if (after.level > before.level) {
    const opened = Object.entries(BUILDINGS).filter(([, b]) => b.req[0] > before.level && b.req[0] <= after.level).map(([, b]) => b.name);
    news.push(`Your house has reached level ${after.level}. ${opened.length ? `New in the Estate: ${opened.join(', ')}.` : 'There are new plots to build on in the Estate.'}`);
  }
  if (after.market !== before.market && run.market.length && after.market.split(',').some((id) => !before.market.split(',').includes(id))) {
    news.push('New gladiators have arrived in the Market.');
  }
  if (after.liaison && after.liaison !== before.liaison) news.push('The Liaison has a new prisoner on offer.');
  if (after.armourer && after.armourer !== before.armourer && run.armourerStock.length) news.push('The Armourer has new stock.');
  // PLACEHOLDER (5.3.0): a body the Temple of Vulcan could raise.
  for (const f of raisable(run).filter((x) => !(before.bodies ?? '').split(',').includes(x.id))) news.push(`The priests of Vulcan have taken ${f.name}'s body. They can raise them as a Revenant, for a price (the Market tab).`);
  return news;
}

// The tutorial's tips are the steward speaking (src/tutorial.js holds the words).
export const tipSpeaker = "steward";
