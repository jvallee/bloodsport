# Bloodsport v6: the hidden plot (design doc and implementation plan)

Status: **phases A–F built** (2026-10-28). Phases G (playtests and the designer's text pass) and H (Patron Lounge) remain. Names, story text and numbers are still placeholders; story text especially is meant to be rewritten in the designer's voice (see section 10). Code: `src/plot.js` (cards, clues, cells), the "hidden plot" section of `src/run.js`, tests in `tests/plot.test.js`.

**Decisions made** (designer, 2026-10-28):
- The recommendations in section 11 were accepted.
- **The evil road is the easy one.** The loyalist should win clearly more often than a careful player who ignores the plot. Going along with the regime is the safe way to survive. The coup is the hard, heroic road. The balance gate checks this (section 8).

**Changes from the plan while building:**
- **No save version bump.** Old saves gain `plot: null` and the plot's RNG stream as they load, like earlier additions.
- **Knocked out before the Grand Final,** the coup is postponed to the next Grand Tournament instead of failing. Only a lost Final is the Martyr ending. The coup's eve card offers "Not tonight" (postpone), not "Call it off".
- **Arming the barracks and recruiting the champion** keep coming back until done. The gear can come off your weakest fighters when the storeroom is short.
- **`throwBout` became `yardBout`:** a staged loss in the practice yard (−Renown, −Morale), not a forced capitulation in a real match.
- **Plot cards show what anyone could see happen:** a fighter leaving, an execution, a Medbay bed taken. Trust and suspicion stay hidden.
- **Not built yet:** "scouted in every arena" at suspicion 40+, a raid catching a freed contact, and the priest's Gods' Day rites (the priest gives monthly Morale instead).

## 1. The idea in one paragraph

Emperor Silbannacus took his throne by force, and a revolt is growing in the empire. Some of the prisoners the Liaison offers are secretly **political prisoners**. Nothing says so, but there are clues for players who look closely. Buying one quietly starts a chain of hidden encounters, delivered as ordinary-looking weekly event cards. If the player keeps answering, the chain builds to a **coup at the Grand Tournament**: a secret victory. Like *Papers, Please*, the player is never told there's a plot. They find it, decide how far to go, and live with what follows. Loyalty to the Emperor is a valid ending too.

## 2. Design pillars

1. **Found, not announced.** No quest log, no "new storyline" banner. The first step must look like any other event.
2. **Small, deniable steps.** Each request costs something real in the normal game (a Medbay slot, a lost bout, Favor) and pays back in something the player wants (information, Gold, an edge in a fight).
3. **Every path is a choice with weight.** Helping, ignoring and betraying the rebels all have consequences and endings.
4. **Invisible to players who never notice it.** A career that never buys a political prisoner plays exactly like v5. The balance gates must prove it.
5. **Replayable and seeded.** Who is political, which clues appear and when encounters fire all come from the career seed, so replays and bug reports still work.

## 3. The player's experience: a career told in four acts

| Act | When | What the player sees |
|---|---|---|
| **0: Seeds** | From the first week | The intro mentions how Silbannacus seized power. A few event cards and log lines mention unrest ("A statue of the Emperor was defaced in the Forum"). Pure flavor, with no plot state. |
| **1: The Mark** | 1–3 weeks after buying a political prisoner | A chalk sign on the prisoner's door: scrub it, ignore it, or copy it onto another door. Copying it is the first "yes". |
| **2: Favours** | Over the next months | 3–5 small requests, each a choice. Help them and the rebels pay back in information. Refuse them and the thread cools; refusing twice in a row ends it. |
| **3: The Cause** | Once enough trust is earned (House level 3+) | Bigger asks: arm the barracks, carry messages, recruit one of your champions. Imperial suspicion rises and raids become possible. |
| **4: The Coup** | The Grand Tournament | The Emperor attends in person. If the plot is ready, your fighter in the Grand Final can turn on the imperial box. Winning the Final with the plot ready is the secret victory. |

The whole thread takes most of a career. A player who discovers it late can still reach Act 3 but not finish it, so there's a reason to play another career.

## 4. Systems

### 4.1 Political prisoners

- **Where they come from:** the Liaison (Lv 1 convicts and Lv 2 prisoners of war). From House level 2, each Liaison offer has a `POLITICAL.chance` (placeholder 25%) of being political. A guaranteed political offer by Year 2 makes sure every career gets at least one chance.
- **Stored on the fighter:** `f.political = { cell: 'scribe' }`. It's never shown in the UI and never mentioned in text until the player has acted on the plot.
- **Cells** are each prisoner's role in the rebellion. They decide which encounters that prisoner unlocks, and give each one a short personal story.
  - `officer`: a former legionary centurion. Unlocks "arm the barracks".
  - `scribe`: a palace clerk. Unlocks "the forged pass" and early Boss information.
  - `priest`: a priest of a banned god. Unlocks the Gods' Days encounters.
  - `courier`: a street runner. Unlocks the message-carrying encounters.
- **Clues (the *Papers, Please* part).** Each political prisoner gets 1–2 clues, picked by the plot RNG from a table. No single clue gives them away, because ordinary prisoners sometimes show a "false clue" too:
  - An origin that doesn't fit the arena ("Prisoner of war, the Thracian campaign" when no campaign is listed in the world log).
  - A Story line: "Refuses to salute the Imperial standard." / "Was found with a pamphlet."
  - A price oddly low for their Power (someone is paying to get them placed).
  - A name on the Codex's "Wanted" list (see 4.6).
- **Measure discoverability.** We want roughly 1 in 3 careers to start the plot without being told. The blind LLM playtest is the instrument (section 8).

### 4.2 The thread: a hidden state machine

All plot state lives in one object, `run.plot`, which is null until a political prisoner joins:

```js
run.plot = {
  stage: 'mark',          // 'mark' → 'favours' → 'cause' → 'ready' → ended ('coup' | 'betrayed' | 'crushed' | 'cold')
  trust: 0,               // the rebels' trust in you: rises when you help, falls when you refuse
  suspicion: 0,           // the Emperor's suspicion of your house: hidden, 0–100
  refusals: 0,            // refusals in a row (2 ends the thread: 'cold')
  seen: [],               // plot encounter ids already shown
  cells: ['scribe'],      // roles you hold (from the prisoners you own)
  champion: null,         // fighter id recruited to the cause (Act 3)
  freed: [],              // contacts outside the Ludus: [{ name, cell, how, week, caught }] (section 4.3b)
  nextAt: 37,             // the earliest week the next encounter can fire
}
```

- **Delivery:** plot encounters use the existing weekly event card UI (`run.event`), with a `plot: true` flag in `src/events.js`. To the player they look like any other card.
- **Timing:** `rollEvent` first checks whether a plot encounter is due (`week >= nextAt`, stage conditions met). If so, it shows the plot encounter instead of rolling a normal event. Gaps between encounters: 3–6 weeks (placeholder). That keeps the plot a background thread, not a flood.
- **Its own RNG stream:** add `run.rng.plot = createRng(deriveSeed(seed, 8))`. **Plot rolls must never draw from the existing streams.** Otherwise a career with a political prisoner would shift every later market, fight and event, making balance runs impossible to compare.
- **If the prisoner dies or is released:** the thread survives if trust ≥ 2 (the rebels know you now). Otherwise it goes cold. A prisoner who dies under suspicion can trigger a grief and anger encounter.

### 4.3 Encounters (first draft list)

Every encounter has a cautious first choice, matching the rule for normal events, so the careful bot can always take it.

| Id | Stage | Card (placeholder) | Help | Refuse | Payoff |
|---|---|---|---|---|---|
| `chalkMark` | mark | A sign chalked on the prisoner's door | Copy it onto another door (trust +1) | Scrub it off | Starts the thread |
| `cousinVisit` | favours | A "cousin" asks to visit the barracks | Let them in: suspicion +5 | Turn them away | Next Boss's arena rule revealed (like the Oracle, Lv 2) |
| `hideWounded` | favours | A bleeding man at the gate at night | Hide him: one Medbay slot is taken for 2 weeks | Call the watch: Favor +2, trust −2 | Gold +6 (the rebels pay) |
| `throwBout` | favours | "Lose your next bout in the lower arena" | Agree: the fighter capitulates in their next lower-arena bout | Refuse | Trust +2; a marked rival-house fighter throws their next match against you |
| `pamphlets` | favours | Pamphlets hidden in the Storeroom | Keep them: suspicion +5 | Burn them | The crowd warms to your house: +Renown on wins for a month |
| `forgedPass` | cause | The scribe can forge an imperial pass | Pay 8 Gold | Decline | Halves the next raid's penalty, or skips one tribute payment |
| `armBarracks` | cause | The officer asks for weapons | Give 2 pieces of Storeroom gear | Refuse | Required for the coup; suspicion +10 |
| `courierBout` | cause | A message must reach a fighter of House X | Your fighter carries it into a bout (spare them if you win) | Refuse | Trust +2; that house stops feuding with you |
| `recruitChampion` | cause | The rebels want your best fighter | Ask them: success depends on Morale and humor | Refuse | Sets `plot.champion` (needed for the coup) |
| `informer` | any, if suspicion ≥ 40 | A guest at your table asks too many questions | Feed him lies (chance) | Stay silent | Lowers suspicion, or a raid if the lie fails |
| `theOffer` | cause or ready | A Praetorian prefect offers a pardon and a title for names | **Betray them** (ends the plot: the Loyalist ending) | Refuse | — |

That's 11 encounters in the first draft. Target 14–18 for v6.0, including a few that only appear with a particular cell (the priest's Gods' Day rites, for example).

### 4.3b Rescue requests: "Free my brother"

One of your own gladiators asks you to free another political prisoner. These are the plot's most personal cards. The person asking is someone the player has fought with, so refusing hurts.

- **Who asks:**
  - Usually a political prisoner in your roster, or your recruited champion.
  - Once the thread reaches `cause`, sometimes an ordinary fighter with a reason: a sibling, an old comrade, or a debt. The rebellion reaches beyond the people you bought.
- **Who they want freed:** a named prisoner with a cell, made by the plot RNG. If freed, they become a **contact** outside the Ludus (`plot.freed`).
- **How (one per card, picked by what's possible right now):**

| Id | The ask (placeholder) | Free them | Refuse | Notes |
|---|---|---|---|---|
| `freeFromCells` | "My brother is in the Liaison's cells. Buy him, then let him go." | Pay the prisoner's price plus a bribe. They never join your roster. Suspicion +5. | The asker's Morale −15 for 4 weeks | Needs a Liaison |
| `freeCondemned` | "They'll throw her to the beasts at your next tournament." | **Plead for clemency:** costs Favor, always works. **Arrange an escape:** a chance roll, with suspicion +15 if it fails. | The prisoner dies in the arena (a log line). The asker's Morale −20, and they may gain the Afeared scar. | Tournament weeks only |
| `freeAcrossSand` | "A friend of ours fights for House X. Spare him if you meet." | Spare that opponent when you beat them (uses the thumbs up/down system), or buy out their contract for Gold | You may still meet them, and nothing stops you killing them | Links the plot to the crowd verdict: sparing a marked rebel against the crowd's wishes is the costly choice |
| `freeMe` | "Free me. I can do more outside these walls." | Release the asker: you lose the fighter, and they become a contact. Trust +3. | Their Morale −15. Ask twice, and they may try to escape. | Political prisoners only, after trust ≥ 3 |

- **What contacts give back:** each freed prisoner pays back later, in their cell's way:
  - A freed scribe sends a forged pass for free.
  - A freed officer arms the barracks without costing you gear.
  - A freed courier lowers suspicion.
  - A freed priest gives Morale to the roster on Gods' Days.
- **At the coup:** each contact adds one more voice in the crowd during the Final (placeholder: +3% win chance each, up to +12%). Freeing people throughout the career is how the player stacks the odds for the coup.
- **Refusing:** rescue requests count toward the "2 refusals in a row" rule like any other plot card. They also cost the asker's Morale, so saying no is personal, not just a cooling of the plot.
- **Suspicion:** freeing is the riskiest kind of help. Each contact also adds +1 suspicion a month while the Emperor hunts for them, until the coup or until a raid "finds" one (a raid can name a contact who was caught, and their payback stops).
- **Endings:** the coup epilogue names the people you freed. The Loyalist ending's list of the executed includes them too, so betrayal costs more the more people you've freed.

### 4.4 Suspicion, raids and danger

- **Suspicion (0–100, hidden):**
  - Raised by helping and by holding political prisoners (+1 a month each).
  - Raised by the crowd: sparing against its wishes in the top arena.
  - Lowered by refusing, by betrayal, by paying tribute early, and by Patron Lounge loyalist policies if that building is made.
  - Decays slowly (−2 a month).
- **What the player sees (no number shown):**

  | Suspicion | Signs |
  |---|---|
  | 20+ | Log lines: "A Praetorian watched training today." |
  | 40+ | Imperial inspector events. Your fighters are scouted in every arena, not only your top one. |
  | 60+ | Favor drifts down 1 a month for no stated reason. |
  | 80+ | A **raid** event. |

- **Raid choices:**
  - Hand over a political prisoner: they're executed in the arena, a sad event, and Morale −10 for the whole roster. Suspicion −40.
  - Bribe: Gold.
  - Fight: a forced bout against Praetorians. If you lose, the career ends in **treason**.
- **Treason** is a new way to lose a career: "The Praetorians came at dawn."

### 4.5 The coup (secret victory)

- **Ready when:**
  - `stage === 'ready'` requires trust ≥ 6 (placeholder).
  - `armBarracks` is done.
  - `plot.champion` is set and still alive.
- **At the Grand Tournament:** if the plot is ready, the Grand week opens with a final plot card, "Tonight the Emperor attends", with two choices: go ahead, or call it off (the thread ends cold, and the Grand plays normally).
- **The Final:**
  - Played normally, but the Emperor's Gaze arena rule (no capitulating) always applies.
  - If your recruited champion wins: a custom ending screen. Your champion climbs into the imperial box, Silbannacus falls, and the career ends **won, with a coup**.
  - If any other fighter wins: a normal win, plus a line that the moment passed.
  - If your fighter loses: the **Martyr** ending.
- **Score:** a coup counts as a win, plus a bonus.

### 4.6 Endings

| Ending | Trigger | Career status | Notes |
|---|---|---|---|
| **The Coup** | Coup carried out and the Final won by the champion | `won`, `ending: 'coup'` | Secret victory. A new epilogue, and the Hall of Champions entry is marked "Liberator". |
| **The Loyalist** | Accepted `theOffer` | Career continues | Favor +30, a house title, and a grim end-screen epilogue listing the rebels executed. |
| **The Martyr** | Coup attempted and the Final lost | `lost`, `ending: 'martyr'` | Unlocks the Legacy achievement and the reward patron. |
| **Treason** | Lost a raid fight | `lost`, `ending: 'treason'` | A new way to lose. |
| **The Bystander** | Plot started and went cold | Whatever the career becomes | One quiet line in the end screen: "Some say a different house could have changed the empire." |

### 4.7 Legacy and the Codex (persistent across careers)

- **Achievements (`src/legacy.js`):**
  - "Chalk on the Door": start the plot.
  - "Sic Semper Tyrannis": carry out the coup.
  - "Thirty Pieces": betray the rebels.
  - "Remembered": the Martyr ending.
- **Unlocks** (pick 1–2):
  - A **Liberator** patron who starts you with a political prisoner already in your roster.
  - A **Sons of the Revolt** fighter class.
  - The "Amnesty" decree.
- **Codex:** a new **Rebellion** section that's invisible until its first entry is discovered. Entries cover the cells, the Mark, the Emperor's history and the "Wanted" list (clue names). This is where devoted players dig, and later careers become easier to read.

## 5. Interaction with existing systems

- **Liaison:** the political roll happens in `refreshLiaison` (`src/run.js`) after the prisoner is created, using `run.rng.plot`.
- **Weekly events:** plot encounters are `EVENTS` entries flagged `plot: true`. They're filtered out of the normal draw and delivered by a new `rollPlot(run)` called before `rollEvent`. Event effects are reused, plus new ones: `trust`, `suspicion`, `plot` (stage change), `medbaySlot`, `throwBout`, `reveal` (Boss rule), `giveGear` and `free` (adds a contact; for `freeMe`, removes the asker from the roster).
- **Rescue requests:** `freeAcrossSand` marks a rival-house opponent (`opp.rebel = true`). Sparing them in `resolveMercy` frees them. `freeCondemned` resolves at the end of the tournament week. Contacts' paybacks run in the monthly step.
- **Fights:** `throwBout` needs one new match flag that forces capitulation at the first chance in the next lower-arena bout. The marked rival who throws a match is a one-off opponent flag.
- **Crowd verdicts (`resolveMercy`):** sparing against the crowd in the top arena raises suspicion.
- **Grand Tournament (`advanceArena`):** an extra branch for the coup ending.
- **End screen (`endBanner`) and `careerScore`:** new endings and epilogues.
- **Patron Lounge (a later v6 phase, optional):** loyalist policies lower suspicion. "Amnesty" makes political prisoners more common. The informer encounter happens at the Lounge.

## 6. Data model and saves

- **New fields:**
  - `run.plot` (null by default).
  - `run.rng.plot`.
  - `f.political`.
  - `run.ending` (null, `'coup'`, `'martyr'`, `'treason'` or `'loyalist'`).
- **Saves:** bump `SAVE_VERSION` to 4. The migration adds `plot: null` and creates the `plot` RNG stream from the seed. Old careers simply never get political prisoners until their next Liaison offer.
- **Replays:** every plot choice goes through the existing `event-choice` game action, so replays need no new actions. The coup confirmation is an event choice too.
- **Tunables in `src/data.js`:**
  - `POLITICAL = { chance, fromLevel, guaranteeYear }`.
  - `PLOT = { gapWeeks, trustToReady, suspicion: { thresholds, decay, perPrisoner }, raid: { bribe } }`.
  - All of them recorded in `docs/fight-rules.md`.

## 7. Implementation phases

Each phase is a small set of commits, tested first, with `npm test` and `npm run check` passing before it ships.

| Phase | Scope | Tests | Done when |
|---|---|---|---|
| **A: Foundations** | `run.plot`, `run.rng.plot`, `SAVE_VERSION` 4 with migration, `POLITICAL` tunables, political roll in the Liaison, clue table and Story lines, false clues on ordinary prisoners | Political rate within tolerance over many seeds. **Plot RNG isolation:** a career with the plot on and one with it off draw identical markets, fights and events until the first plot card. Migration from v3 saves. | Gates unchanged (the plot can't fire yet) |
| **B: The thread** | `rollPlot`, the stage machine, trust and refusals, the first 6 encounters (`chalkMark` to `pamphlets`), new event effects, the rescue requests `freeFromCells` and `freeMe`, and contacts with their paybacks | One test per encounter's effects. The thread goes cold after 2 refusals. It survives the prisoner's death at trust ≥ 2. Plot cards never appear without a political prisoner. | A seeded career can reach `cause` |
| **C: Danger** | Suspicion and its visible signs, the inspector and informer events, raids (including a contact being caught), the treason ending, and the rescue requests `freeCondemned` and `freeAcrossSand` | Each threshold's sign. Raid choices. Treason ends the career. Suspicion decay. | |
| **D: The coup** | Act 3 encounters, champion recruitment, the contacts' help in the Final, the Grand Tournament branch, the coup / martyr / loyalist / bystander endings, end-screen epilogues, score | Each ending is reachable from a scripted run. The coup only happens with every requirement met. | A full scripted career ends in each ending |
| **E: Legacy and Codex** | Achievements, unlocks, the hidden Rebellion Codex section | Discovered entries persist. The section is hidden until found. | |
| **F: Bots and balance** | Teach the bots (section 8). New balance gates. Tune `PLOT` | New gates pass | All gates pass |
| **G: Playtests and text** | A blind LLM playtest (discoverability), an informed playtest (full thread), the designer's text pass | | Discovery rate is about 1 in 3. No bugs left open. |
| **H (optional): Patron Lounge** | The building, Influence, policy cards and their link to suspicion | | Its own design doc first |

## 8. Balance and measurement

- **Bots (`scripts/bots.js`, `opts.plot`):**
  - The careful bot never builds a Liaison, so it never meets the plot, and the v5 gates measure exactly what they did.
  - `rebel`: builds the Liaison, takes political prisoners, helps at every turn, and goes ahead with the coup only when its champion has at least a 40% chance in the Final.
  - `loyalist`: helps until the prefect's offer, then betrays.
  - `bystander`: takes the prisoners but always refuses (used to measure what the Liaison alone is worth).
- **New gates (`scripts/checks.js`):**
  1. **Invisible when ignored:** the careful bot's win rate with plot code on is within 1 point of the v5 baseline. The RNG isolation should make it identical.
  2. **The plot is a real gamble:** the rebel bot's normal-win rate stays within ±10 points of careful. Its coup rate falls in a target band (placeholder 10–25% of careers).
  3. **The evil road is easier** (changed at the designer's request): the loyalist wins 5–20 points more often than careful.
  4. **Treason stays rare:** under 10% of rebel careers.
  - As built, gates 1 and 2 became: the careful bot is untouched by construction (it never builds the Liaison), and the coup happens in 5–25% of rebel careers.
- **Probe:** `scripts/probes/plot-flow.js` reports which stage each rebel career reached and when, and where suspicion stood.

## 9. Playtests

- **Blind playtest:** tell the LLM tester nothing about the plot. Measure whether it notices clues, what it thinks they mean, and whether it starts the thread. This is the most important test of pillar 1.
- **Informed playtest:** tell the tester the plot exists, and ask it to reach the coup and report anything confusing, unfair or dull.
- **Report** goes to `docs/playtest-llm-N.md`, as usual.

## 10. Writing: what the designer should write

Story text is placeholder throughout. The highest-impact pieces for the designer's voice:

1. **The intro additions** (Act 0 seeds) in `INTRO`, `src/tutorial.js`.
2. **Every plot encounter card,** especially the rescue requests (spoken by your own gladiators, so they're the most personal): its title, text and choice labels. Each should read like ordinary life in the Ludus, not like a quest.
3. **The clue lines and Story lines** for political prisoners, plus false clues for ordinary ones.
4. **The suspicion signs:** log lines and inspector events.
5. **The five ending epilogues.**
6. **The Rebellion Codex entries.**

Write a one-page voice guide first (narrator, tone, a few example lines), so any text written by an agent can match it.

## 11. Open decisions for the designer

1. **How hidden?**
   - A reward for close attention (about 1 in 3 careers find it unprompted). Recommended.
   - Something most players eventually stumble into.
2. **Is the Loyalist ending a "win"?** Recommended: no. It's a grim epilogue with a big advantage, and the career goes on.
3. **Can a career fail the plot and keep going?** Recommended: yes, except after a lost raid fight (treason).
4. **The faction's name and the Emperor's history.** Placeholders: "the Unbroken", and Silbannacus the usurper.
5. **Should the coup require a specific champion,** or any of your fighters in the Final? Recommended: the recruited champion. It gives Act 3's recruitment real weight.
6. **Patron Lounge:** part of v6.0, or v6.1 after the plot ships? Recommended: v6.1.
7. **Can ordinary fighters ask for a rescue?** If so, a career without a political prisoner can still be pulled into the plot, which bends pillar 4 a little. Recommended: only once the thread reaches `cause`, so the very first step still needs a political prisoner.
8. **Should `freeMe` let a prisoner escape on their own if refused twice?** Recommended: yes, as a chance roll, with suspicion +10 if they're caught. It gives refusal a sting.
