// Dialogue: characters who speak to you in a dialogue box (the Emperor, your steward, a narrator). Pure data, plus the
// rule for which scene is due. The words are the designer's to write: every line marked PLACEHOLDER is a first draft.
//
// A scene is a list of beats: { speaker, text } (plain text) or { speaker, title, html } (trusted HTML from our own
// files). Speakers are keys of SPEAKERS. Scenes are cosmetic: they never change the career, so replays don't record them.

import { INTRO } from "./tutorial.js";
import { FAVOR, BUILDINGS } from "./data.js";
import { GRAND_TIER, raisable } from "./run.js";
import { WEEKS_PER_YEAR } from "./calendar.js";

export const SPEAKERS = {
  narrator: { name: "", portrait: "narrator" },
  emperor: { name: "Emperor Silbannacus", portrait: "emperor" },
  steward: { name: "Your steward", portrait: "steward" }, // a plain, neutral helper (the designer's choice)
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
