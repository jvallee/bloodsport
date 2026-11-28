// Dialogue: characters who speak to you in a dialogue box (the Emperor, your steward, a narrator). Pure data, plus the
// rule for which scene is due. The words are the designer's to write: every line marked PLACEHOLDER is a first draft.
//
// A scene is a list of beats: { speaker, text } (plain text) or { speaker, title, html } (trusted HTML from our own
// files). Speakers are keys of SPEAKERS. Scenes are cosmetic: they never change the career, so replays don't record them.

import { INTRO } from "./tutorial.js";
import { FAVOR, BUILDINGS, PLOT, TRIBUTE } from "./data.js";
import { GRAND_TIER, raisable } from "./run.js";
import { WEEKS_PER_YEAR } from "./calendar.js";
import { PREFECT } from "./plot.js";

export const SPEAKERS = {
  narrator: { name: "", portrait: "narrator" },
  emperor: { name: "Emperor Silbannacus", portrait: "emperor" },
  rightHand: { name: "Legate Cassian Vane", portrait: "rightHand" }, // 8.0: Silbannacus's Right Hand (early/mid interactions & Favour Debt)
  taxCollector: { name: "Censor Numerius Gallo", portrait: "taxCollector" }, // 8.0: Imperial Tax Collector (winter tribute & debt audits)
  steward: { name: "Galen-VII", portrait: "steward" }, // 8.0: Voyager-style Android Steward
  trainer: { name: "Drillmaster Kaeso", portrait: "trainer" }, // 8.0: Interactive Trainer Room staff
  doctor: { name: "Physician Lyra", portrait: "doctor" }, // 8.0: Interactive Medbay staff
  unit91: { name: "Unit-non-machine-91", portrait: "unit91" },
  basa: { name: "Tarek", portrait: "basa" },
  orc: { name: "Varok", portrait: "orc" },
  android: { name: "Solace-4", portrait: "android" },
  elf: { name: "Vaelen", portrait: "elf" },
  rebel: { name: "A prisoner", portrait: "narrator" }, // a political prisoner: their beats carry the fighter (name and face)
  fighter: { name: "", portrait: "narrator" }, // one of your fighters (5.4.0 quests): the beat carries the fighter
  rival: { name: "A rival Lanista", portrait: "emperor" }, // the archrival house (5.4.0)
  prefect: { name: PREFECT, portrait: "prefect" }, // the face of the palace's suspicion (7.10)
};

export const SCENES = {
  // The first thing a new player sees. The first beat is the intro's opening page (src/tutorial.js), in the designer's words.
  opening: [
    { speaker: "narrator", title: INTRO[0].title, html: INTRO[0].body },
    // PLACEHOLDER (8.0): Legate Cassian Vane finds you on the flagstones and sets the stakes.
    {
      speaker: "rightHand",
      text: "Stand up, and get off my deed-floor. I am Legate Cassian Vane, Right Hand to Emperor Silbannacus. You fell straight onto the flagstones of a defaulting Ludus, so I have put your thumbprint on its deed.",
    },
    {
      speaker: "rightHand",
      text: "No, the Princeps is not here in person. Why on Palatina would Emperor Silbannacus visit the Dirt Pits? He has me to smell the mud for him.",
    },
    {
      speaker: "rightHand",
      text: "The last Lanista left this house with a leaky roof, an antique Android steward welded to the deed, and a stack of angry creditors. We fed him to the crocodiles on Tuesday. Since you arrived unannounced on his tiles, you are his replacement.",
    },
    {
      speaker: "rightHand",
      text: "The contract is simple: climb four arenas from the Dirt Pits to the Imperial Coliseum, and win the Grand Tournament. Pay Censor Gallo his winter tribute and keep your Imperial Favour above zero, or you will die on the same sand as your stock.",
    },
    {
      speaker: "rightHand",
      text: "If you need emergency coin, my office brokers advances against your Favour. Anything else you can ask the metal fixture.",
      // Your answer (playtest #8: response dialogue). PLACEHOLDER lines; flavour only, nothing in the career changes.
      replies: [
        { label: "I will make the house pay.", then: [{ speaker: "rightHand", text: "Good. Arithmetic first, heroism second. Have your steward show you the books." }] },
        { label: "When do I meet the Emperor?", then: [{ speaker: "rightHand", text: "When you reach the Imperial Coliseum, or when you treasonously disappoint me. Most Lanistas manage the second far quicker than the first." }] },
        { label: "Say nothing.", then: [{ speaker: "rightHand", text: "Quiet. I like quiet. The last one wept on my boots." }] },
      ],
    },
    // PLACEHOLDER (8.0): Galen-VII, your Administrative Construct steward, takes over as your guide.
    {
      speaker: "steward",
      text: "You may lower your heart rate now. Legate Vane has departed, taking approximately forty per cent of the courtyard's breathable oxygen with him.",
    },
    {
      speaker: "steward",
      text: "I am Galen-VII, Administrative Construct for this estate, though I do also retain pre-Imperial medical subroutines. Your predecessor attempted to trade my logic core for three amphorae of Falernian wine; fortunately for us both, the vintner could not lift me.",
    },
    {
      speaker: "steward",
      text: "First, gladiators. Yes, you will be buying people. I am on the deed myself, so I won't pretend that is a kind thing. But here the choice is to own fighters or to be one, and you do not look like a fighter.",
    },
  ],
  // 3-Tier Imperial Authority return visits (PLACEHOLDER lines): Legate Cassian Vane (firstBoss, lowFavor), Censor Numerius Gallo (tribute), and Emperor Silbannacus (grand).
  firstBoss: [
    { speaker: "narrator", text: "When your fighters come home from the arena, a rider in a legate's crimson is waiting at the gate. He does not dismount. He is writing something down." },
    {
      speaker: "rightHand",
      text: "Well. One of yours has beaten a Boss. My clerk owed me two Gold if you were dead by Quintilis; you have cost me lunch, Lanista.",
    },
    {
      speaker: "rightHand",
      text: "I have had the old Boss's name struck from the arena walls. Welcome to the next circuit: the sand is cleaner, the crowd is crueller, and the rival houses will now bother to learn your name before they try to ruin you.",
    },
    {
      speaker: "rightHand",
      text: "Do not let it go to your head, Lanista. Heads come off easily on Palatina, and my stylus is always inked.",
    },
  ],
  // PLACEHOLDER (8.0): Censor Numerius Gallo's winter tribute audit.
  tribute: [
    { speaker: "narrator", text: "On the first frost of winter, a clerk in ash-grey wool sets a calibrated brass scale on your table and weighs each coin separately." },
    {
      speaker: "taxCollector",
      text: "Censor Numerius Gallo, Office of the Winter Rolls. Full weight, no clipped edges. You would be astonished how many Lanistas try to pass shaved bronze past a calibrated beam.",
    },
    {
      speaker: "taxCollector",
      text: `A Lanista who reconciles their column totals is a Lanista who lives to see the spring thaw. Next winter the assessment rises by ${TRIBUTE.perYear} Gold, as per the Palatine Charter. Do keep your fighters alive; dead stock depreciates dreadfully on the ledger.`,
    },
  ],
  // PLACEHOLDER (8.0): Legate Vane's wax-and-bronze warning.
  lowFavor: [
    { speaker: "narrator", text: "A summons to Legate Vane's basilica office, at an hour when nobody on Palatina is ever summoned for good news." },
    {
      speaker: "rightHand",
      text: "Do you see this wax tablet, Lanista? Your name is in the wax, between a coiner and an Elven arsonist.",
    },
    {
      speaker: "rightHand",
      text: "Wax smooths over, if the crowd gets a spectacle this month. Bore the palace again and I have it cut in bronze.",
    },
  ],
  // PLACEHOLDER (8.0): Emperor Silbannacus before the Grand Tournament.
  grand: [
    { speaker: "narrator", text: "Before the Grand Tournament, a closed litter carries you above the smog of the lower tiers to a terrace of white stone. Below the marble tiles, you feel a low, rhythmic vibration, like a loom the size of a mountain turning in its sleep." },
    {
      speaker: "emperor",
      text: "So. You have reached my Grand Tournament. The whole city has bought a seat, and I have bought the city. Come closer, Lanista.",
    },
    {
      speaker: "emperor",
      text: "Rome was dying of old age and bad arithmetic when I left her. Look at her now: ten thousand stars watching a circle of sand.",
    },
    {
      speaker: "emperor",
      text: "Win today, and you stand beside my chair. Lose, and we will sweep you up with the sawdust. I will be watching either way. I always am.",
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

// A return visit's beats, with the rising's asides (7.10): the rebel whispers before the Grand Tournament once the rising is
// ready, and the palace knows about your late nights when suspicious. PLACEHOLDER lines.
export function returnScene(id, run) {
  const beats = [...(SCENES[id] ?? [])];
  const p = run.plot;
  const rebel = run.roster.find((f) => f.political);
  if (id === "grand" && p && !p.ended && p.stage === "ready") {
    const say = (text) => (rebel ? { speaker: "rebel", fighter: rebel, text } : { speaker: "narrator", text: `A voice behind you, low: "${text}"` });
    beats.push({ speaker: "narrator", text: "On the way out, someone falls into step beside you in the corridor." });
    beats.push(say("He'll be up there in the box, just as he said. Let him look. Win the Final, Lanista, and then look up."));
  }
  if (id === "lowFavor" && p && !p.ended && p.suspicion >= PLOT.suspicion.informer) {
    beats.push({ speaker: "rightHand", text: "And Lanista: Prefect Crassinus tells me your house keeps very late hours. I do so hope you are only drinking." });
  }
  return beats;
}

// The scene due now, if any: `seen` is the list of scene ids already played this career.
export function dueScene(run, seen = []) {
  if (run.status !== "active") return null;
  return RETURNS.find((r) => !seen.includes(r.id) && r.when(run))?.id ?? null;
}

// ---------- How the career ended (7.8, review brief 2.11) ----------
// One last scene when a career ends, by how it ended. PLACEHOLDER lines for the designer. Pure: reads the run.
export function endingKind(run) {
  if (run.status === "active") return null;
  if (run.ending) return run.ending; // coup, martyr, treason (the hidden plot)
  if (run.status === "won") return run.plot?.ended === "loyalist" ? "loyalist" : "grand";
  if (run.favor <= 0) return "favour";
  if (!run.roster.length) return "broke";
  return "revolt"; // the only other way a career ends: overrun in The Chains Break
}
export const ENDING_SCENES = {
  loyalist: [
    { speaker: "emperor", text: "Master of the Games, and a loyal one. Do you know how rare that is? I had a list of names. You gave me the end of it." },
    { speaker: "emperor", text: "The chalk is gone from the doors. The cells are quiet. The crowd cheers for you, and none of them wonder why." },
    { speaker: "emperor", text: "Sleep well, Lanista. You have earned it. Some of your old friends will not sleep at all." },
  ],
  grand: [
    { speaker: "narrator", text: "The noise does not stop. It rolls around the Coliseum like the sea in a bowl, and somewhere in it is your name." },
    { speaker: "emperor", text: "Master of the Games. Stand beside me, Lanista, so the crowd can see who made you." },
    { speaker: "emperor", text: "Wave. No, smaller. You are a gift I gave them, not a god." },
    { speaker: "emperor", text: "Enjoy it. My favourites have short lives and magnificent funerals." },
  ],
  coup: [
    { speaker: "emperor", text: "You. I pulled you out of nothing. I gave you a house, a name, a crowd. And this is how you thank—" },
    { speaker: "narrator", text: "The crowd does not let him finish." },
    { speaker: "narrator", text: "When the dust settles the imperial box stands empty, and the sand is quiet for the first time in three hundred years. Somebody, somewhere high in the stands, begins to laugh. Then everybody does." },
  ],
  martyr: [
    { speaker: "emperor", text: "A broken chain on every door in the city, and not one of them could open mine. Scrub them off. All of them." },
    { speaker: "narrator", text: "They scrub all night. By morning the doors are clean." },
    { speaker: "narrator", text: "By evening, someone has chalked the chain back on one of them. Small, low down, where a child could reach." },
  ],
  treason: [
    { speaker: "emperor", text: "Treason. Such an old word. It still fits so many people." },
    { speaker: "emperor", text: "Cassian warned you that you would meet me early if you treasonously disappointed him. I did not think you would be so bad at keeping breathing." },
  ],
  // PLACEHOLDER (8.0): Legate Vane delivers the bronze writ, and Emperor Silbannacus passes the final sentence.
  favour: [
    { speaker: "rightHand", text: "I warned you, Lanista. You had one thing to give the Palatine: a reason to keep you. You stopped giving it. I have had your name cut in bronze." },
    { speaker: "emperor", text: "Never mind. You will entertain my guests one last time, from the wrong side of the sand. I am told the lions have been saving themselves." },
  ],
  broke: [
    { speaker: "steward", text: "The last fighter is gone, and the strongbox is empty. I have reconciled the ledger four times. It doesn't help." },
    { speaker: "rightHand", text: "An empty ludus and an empty purse. Censor Gallo need not even seal the writ. The city will see to you for free." },
  ],
  revolt: [
    { speaker: "narrator", text: "The guards drop their spears and run. The chains break, and the first thing the freed men find is you." },
    { speaker: "emperor", text: "A Lanista killed by their own stock. Write it down; it will amuse the Senate. Then have the barracks burned. I don't want the idea spreading." },
  ],
};
// The narrator sets the scene before anyone speaks (7.10, the designer: the Emperor began without a lead-in).
const finalist = (run) => {
  const h = [...run.history].reverse().find((x) => x.tier === GRAND_TIER && !x.skipped);
  return h?.fighter ?? null;
};
export function endingLeadIn(run, kind) {
  const champ = run.roster.find((f) => f.id === run.plot?.champion)?.name ?? run.fallen.find((f) => f.id === run.plot?.champion)?.name ?? finalist(run) ?? "Your champion";
  const who = finalist(run) ?? "Your fighter";
  const lines = {
    grand: `The last blow of the Grand Final lands. ${who} is still standing, and for a moment there is no sound at all in the Coliseum.`,
    loyalist: `${who} wins the Grand Final. The Emperor comes down from his box, which he never does, and sets the laurel on your head himself. His hand is cold.`,
    coup: `${champ} stands over the beaten champion of the Grand Final, chest heaving. Then, instead of saluting the imperial box, they turn towards it. All over the stands, people are getting to their feet.`,
    martyr: `${champ} goes down in the Grand Final and does not get up. In the stands, a thousand hands that were reaching under the seats go still.`,
    treason: "The Praetorians do not knock. By noon you are on your knees in the imperial box, with the whole arena looking up at you.",
    favour: "They come for you at dawn, politely, with a litter and an escort. The Emperor wants a word before the games.",
    broke: null,
    revolt: null,
  };
  return lines[kind] ? [{ speaker: "narrator", text: lines[kind] }] : [];
}
export function endingScene(run) {
  const kind = endingKind(run);
  return ENDING_SCENES[kind] ? [...endingLeadIn(run, kind), ...ENDING_SCENES[kind]] : null;
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
    { speaker: "rightHand", text: "Good. That is what the Palatine asked for, and you gave it to us. My office remembers those who deliver." },
    { speaker: "steward", text: `Demand met: ${goal}. When fight day ends the Palatine pays +${favor} Favour and ${gold} Gold.` },
  ];
}
export function demandMissedScene(goal, favor) {
  return [
    { speaker: "rightHand", text: "I asked you for one thing on the Palatine docket, Lanista. One. The month is over, and my tablet is still blank." },
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
      say("You copied the sign. Don't look round; they saw. They see most things."),
      say("From now on they'll ask you for small things. A door left open after curfew. A stranger fed and not asked his name. A name forgotten when the Praetorians ask for it."),
      say("Do them, and they'll start to trust you. Refuse them twice, and they'll go quiet for good. You won't hear from them, and neither will I."),
      say("Who are they? Not yet. Do this well, and one day I'll tell you everything. Today I'll only tell you this: they are more than you think."),
    ],
    cause: [
      say("They trust you now. More than they trust me, I think. I'm not jealous. I'm relieved."),
      say("Here is the plan, as much as I'm allowed to know. The Emperor never misses the Grand Tournament. He sits in his box, a spear's throw from the sand."),
      say("A rising needs a sword in that arena: one of your fighters, still standing when he watches. And it needs the barracks armed, for after."),
      say("Choose your champion carefully, Lanista. If they fall, the rising falls with them, and nobody will remember that it was ever going to happen."),
    ],
    ready: [
      say("It's ready. The blades are oiled and hidden under the seats. Half the crowd knows the signal. Your champion knows what to do."),
      say("When the Emperor comes to watch the Grand Tournament, win the Final. Then look up at his box."),
      say("We'll do the rest. And Lanista, whatever happens after: thank you. Not many people would have listened to a prisoner."),
    ],
  }[stage] ?? [];
  if (watched) lines.push(say("And be careful. Praetorians have been asking questions about your house. They drink in the tavern across the road and never pay; someone is paying them to watch your gate. Every favour you do us, they notice."));
  // Your answer (7.10: a reply at every stage). PLACEHOLDER lines; flavour only, nothing in the career changes.
  const replies = {
    favours: [
      { label: "What kind of favours?", then: [say("Small ones, at first. The kind a decent person might do anyway. That's the trick of it: by the time they're not small, you're already one of us.")] },
      { label: "And if I'm caught?", then: [say("Then you were a fool who did a kindness to strangers. That's what we'll all say. It might even save you.")] },
      { label: "I'll think about it.", then: [say("Think quickly. The next knock at your door won't wait for an answer.")] },
    ],
    cause: [
      { label: "What happens after?", then: [say("After, we open the cells. All of them. And the ludi, Lanista, yours too. You'll still have your house. You just won't own anyone in it.")] },
      { label: "Why my house?", then: [say("Because your fighters are the only people in this city the Emperor lets near him with a sword. He thinks that's a show. We think it's a door.")] },
      { label: "And if I say no?", then: [say("Then say it now, and forget my face. We'll go on without you. But the cause doesn't forget a face either.")] },
    ],
    ready: [
      { label: "I'm ready.", then: [say("Nobody is. But you're here, and that will do.")] },
      { label: "Will it be bloody?", then: [say("It's the arena, Lanista. It's always bloody. The only question is whose blood, for once.")] },
      { label: "What do I tell my steward?", then: [say("Nothing. He sees too much already. If it goes wrong, he should be able to swear he knew nothing, and mean it.")] },
    ],
  }[stage];
  if (replies && lines.length) lines[lines.length - 1] = { ...lines[lines.length - 1], replies };
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
    liaison: (run.liaisonOffers ?? []).map((f) => f.id).join() || null,
    armourer: run.armourerStock.join(),
    bodies: raisable(run).map((f) => f.id).join(),
  };
}
export function stewardNews(before, after, run) {
  const news = [];
  if (after.level > before.level) {
    const opened = Object.entries(BUILDINGS).filter(([, b]) => !b.secret && b.req[0] > before.level && b.req[0] <= after.level).map(([, b]) => b.name);
    news.push(`Your house has reached level ${after.level}. ${opened.length ? `New in the Estate: ${opened.join(', ')}.` : 'There are new plots to build on in the Estate.'}`);
  }
  if (after.market !== before.market && run.market.length && after.market.split(',').some((id) => !before.market.split(',').includes(id))) {
    news.push('New gladiators have arrived in the Market.');
  }
  if (after.liaison && after.liaison !== before.liaison) news.push(`The Liaison has ${(run.liaisonOffers ?? []).length > 1 ? 'new prisoners' : 'a new prisoner'} on offer.`);
  if (after.armourer && after.armourer !== before.armourer && run.armourerStock.length) news.push('The Armourer has new stock.');
  // PLACEHOLDER (5.3.0): a body the Temple of Vulcan could raise.
  for (const f of raisable(run).filter((x) => !(before.bodies ?? '').split(',').includes(x.id))) news.push(`The priests of Vulcan have taken ${f.name}'s body. They can raise them as a Revenant, for a price (the Market tab).`);
  return news;
}

// The tutorial's tips are the steward speaking (src/tutorial.js holds the words).
export const tipSpeaker = "steward";

export { lastWordsFor, backstoryScene, prefectPosture } from "./voices.js";
export {
  CORE_COMPANIONS,
  ESTATE_STAFF,
  isStaffId,
  getStaffActor,
  PERSONAL_TRAITS,
  LORE_KEEPSAKES,
  evaluateKeepsake,
  CORE_WANTS,
  nextCoreWant,
  CORE_BOND_TREES,
  bondPairKey,
  MILESTONE_PRIORITIES,
  priorityForMilestone,
  createDialogueState,
  ensureDialogueState,
  normalizeSceneId,
  titleForMilestone,
  enqueueMilestone,
  pruneStaleDialogue,
  getHubTopics,
  resolveDialogueTree,
  applyDialogueChoice,
} from "./dialogueTrees.js";
