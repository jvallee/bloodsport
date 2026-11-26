# Text to rewrite in your voice

Every piece of story text in the game, with the file and line where it lives (click to open). Generated from the code on 2026-11-26, so line numbers match the current `main`. After code changes, `npm run text-index` moves every link to its text's new line and lists any text it can't find.

**How to edit**
- **Keep anything in `${...}` or `{f}`-style braces exactly as it is.** Those are filled in by the game:
  - `{f}` / `${f}`: the fighter the card is about. `{g}`: a second fighter.
  - `{name}`: a prisoner's name. `{house}`: a rival house. `{opp}`: an opponent.
  - `{fOdds}` / `{gOdds}`: a percentage.
- **Keep numbers and rules text** ("+5% win chance", "−10 Morale") **plain and accurate.** Players need to trust them. The story text around them is yours.
- **An apostrophe inside a 'single-quoted' string must be written `\'`.** Alternatively, switch that string to backticks.
- **After editing,** run `npm test`. A few tests look for key phrases (for example "Silbannacus falls", "Prison record", "Refuses to salute"); if you change those, tell the next agent so the tests are updated, not weakened.

**Dialogue scenes** (the Emperor and your steward) live in [src/dialogue.js](../src/dialogue.js):
- The opening scene's first page is your intro page from `src/tutorial.js`.
- The steward speaks the tutorial tips, which are in section 10.

**Style:**
- British spelling everywhere players read: armour, Favour, colour, favourite, levelled.
- Code names stay as they are, because they're save data, not text (`run.favor`, the gear slot `'armor'`, the trait id `egoArmour`).
- The narrator is dry and slightly wry, the Emperor grand and menacing, and the steward plain and practical.

**Suggested order** (highest impact first): the new first drafts in section 13, the intro, the hidden plot, the endings, weekly events, fight narration, the crowd's verdict, the house log, the tutorial, Codex lore.


## 1. The intro (first thing every player reads)

| Where | Text |
|---|---|
| [src/tutorial.js:11](../src/tutorial.js#L11) | **Another Day on Your Computer** |
| [src/tutorial.js:13](../src/tutorial.js#L13) | (starts here, several lines) You are scrolling, cruising, dare I say surfing the web. Suddenly the screen shimmers. A hand reaches out of it, grabs you by the head and pulls you through.       You land hard on cold stone beneath an amber orbital mirror, on the floor of a decaying Roman villa. This is Palatina, capital of the Astral Principate, ruled by Emperor Silbannacus, a 3rd-century Roman usurper granted near-immortality by an ancient machine buried beneath the palace, who built a star-spanning empire of bloodsport.       Then everything goes dark. |
| [src/tutorial.js:17](../src/tutorial.js#L17) | **How you win** |
| [src/tutorial.js:20](../src/tutorial.js#L20) | (starts here, several lines) Climb four arenas, from the Dirt Pits to the Imperial Coliseum. Each arena holds a circuit: Tournament 1 → Tournament 2 → Boss.       Beat all four Bosses, then win the Grand Tournament, and the Emperor names you Master of the Games.       You don't fight. You recruit, train, heal and choose who to send, then make the hard calls from your box above the sand. |
| [src/tutorial.js:23](../src/tutorial.js#L23) | **How you lose** |
| [src/tutorial.js:24](../src/tutorial.js#L24) | (starts here, several lines) The Emperor watches you through Imperial Favour. Losing a Boss in your top arena, forfeiting, and failing to pay his yearly tribute all cost Favour. At 0 Favour you're executed.       You also fall if every gladiator is dead and you can't afford another, or if your miserable gladiators revolt.       Your fighters are mortal. One injury is survivable; with two injuries, losing a round can kill them. Between rounds you can always capitulate to save a fighter, at the cost of the match. |
| [src/tutorial.js:29](../src/tutorial.js#L29) | **Power, Speed and luck** |
| [src/tutorial.js:31](../src/tutorial.js#L31) | (starts here, several lines) Power wins rounds. What counts is the gap between the fighters: +1 is 55% per round, +3 is 70%, +5 is 95%.       Speed decides who strikes first (+10% to win that round, and the first chance to wound), and being faster makes you harder to wound. A balanced fighter wins and stays healthy.       Traits, weapons and injuries tilt the odds further. Every number is shown in the fight and explained in the Codex. Good luck, Lanista. |

## 2. The hidden plot (v6): cards

Each card has a title, its text, and choice labels. A choice's visible stakes ("−15 Morale") are generated from its effects, so only the labels are yours.


**Chalk on the door** (`chalkMark`)

| Where | Text |
|---|---|
| [src/plot.js:91](../src/plot.js#L91) | Title: Chalk on the door |
| [src/plot.js:93](../src/plot.js#L93) | Overnight, someone chalked a sign on {f}'s door: a broken chain. {f} says nothing, and watches to see what you'll do. |
| [src/plot.js:95](../src/plot.js#L95) | Choice: Scrub it off |
| [src/plot.js:96](../src/plot.js#L96) | Choice: Copy the sign onto another door |

**A cousin at the gate** (`cousinVisit`)

| Where | Text |
|---|---|
| [src/plot.js:101](../src/plot.js#L101) | Title: A cousin at the gate |
| [src/plot.js:103](../src/plot.js#L103) | A man who says he is {f}'s cousin asks to visit the barracks. He has no letter, and he isn't looking at {f}. |
| [src/plot.js:105](../src/plot.js#L105) | Choice: Turn him away |
| [src/plot.js:106](../src/plot.js#L106) | Choice: Let him in |

**Blood at the gate** (`hideWounded`)

| Where | Text |
|---|---|
| [src/plot.js:110](../src/plot.js#L110) | Title: Blood at the gate |
| [src/plot.js:112](../src/plot.js#L112) | A man bleeding from a Praetorian blade collapses at your gate after curfew. The watch will pass within the hour. |
| [src/plot.js:114](../src/plot.js#L114) | Choice: Call the watch |
| [src/plot.js:115](../src/plot.js#L115) | Choice: Hide him in the Medbay |

**Pamphlets in the storeroom** (`pamphlets`)

| Where | Text |
|---|---|
| [src/plot.js:119](../src/plot.js#L119) | Title: Pamphlets in the storeroom |
| [src/plot.js:121](../src/plot.js#L121) | Your steward found a bundle of pamphlets behind the grain jars: the Emperor drawn as a jackal on a stolen throne. |
| [src/plot.js:123](../src/plot.js#L123) | Choice: Burn them |
| [src/plot.js:124](../src/plot.js#L124) | Choice: Leave them where they are |

**A bout for the street** (`yardBout`)

| Where | Text |
|---|---|
| [src/plot.js:128](../src/plot.js#L128) | Title: A bout for the street |
| [src/plot.js:130](../src/plot.js#L130) | The rebels want the city to see one of their own beat a gladiator of your house in the practice yard. They ask for {f}, and for {f} to lose. |
| [src/plot.js:32](../src/plot.js#L32) | Choice: Refuse |
| [src/plot.js:133](../src/plot.js#L133) | Choice: Let {f} take the fall |

**A friend in the cells** (`freeFromCells`)

| Where | Text |
|---|---|
| [src/plot.js:138](../src/plot.js#L138) | Title: A friend in the cells |
| [src/plot.js:145](../src/plot.js#L145) | {f} comes to you at night. "{name} is in the Liaison's cells, and I owe them my life. Buy them, then let them go. They're worth more outside these walls than any purse." |
| [src/plot.js:32](../src/plot.js#L32) | Choice: Refuse |
| [src/plot.js:148](../src/plot.js#L148) | Choice: Buy {name} and let them go (8 Gold) |

**Free me** (`freeMe`)

| Where | Text |
|---|---|
| [src/plot.js:152](../src/plot.js#L152) | Title: Free me |
| [src/plot.js:157](../src/plot.js#L157) | {f} asks to speak to you alone. "Free me. I can do more for the cause outside these walls than inside your arena." |
| [src/plot.js:32](../src/plot.js#L32) | Choice: Refuse |
| [src/plot.js:14](../src/plot.js#L14) | Choice: Free {f} |

**Thrown to the beasts** (`freeCondemned`)

| Where | Text |
|---|---|
| [src/plot.js:164](../src/plot.js#L164) | Title: Thrown to the beasts |
| [src/plot.js:167](../src/plot.js#L167) | {f} has gone pale. "They're throwing {name} to the beasts at the games today, for sedition. You have the Emperor's ear, and a key to every gate in the arena." |
| [src/plot.js:169](../src/plot.js#L169) | Choice: Do nothing |
| [src/plot.js:170](../src/plot.js#L170) | Choice: Plead for clemency (−8 Favour) |
| [src/plot.js:171](../src/plot.js#L171) | Choice: Arrange an escape |

**One of ours across the sand** (`acrossSand`)

| Where | Text |
|---|---|
| [src/plot.js:175](../src/plot.js#L175) | Title: One of ours across the sand |
| [src/plot.js:178](../src/plot.js#L178) | {f} lowers their voice. "{opp}, who fights for {house}, is one of us. If you meet in the arena, beat them if you must, but let them live." |
| [src/plot.js:180](../src/plot.js#L180) | Choice: Promise nothing |
| [src/plot.js:181](../src/plot.js#L181) | Choice: Promise to spare them |

**The forged pass** (`forgedPass`)

| Where | Text |
|---|---|
| [src/plot.js:242](../src/plot.js#L242) | Title: The forged pass |
| [src/plot.js:245](../src/plot.js#L245) | A clerk from the palace archives offers a pass bearing the Emperor's own seal. Shown at the right moment, it will send the Praetorians away once. |
| [src/plot.js:247](../src/plot.js#L247) | Choice: Decline |
| [src/plot.js:248](../src/plot.js#L248) | Choice: Buy it (8 Gold) |

**Steel for the cause** (`armBarracks`)

| Where | Text |
|---|---|
| [src/plot.js:252](../src/plot.js#L252) | Title: Steel for the cause |
| [src/plot.js:256](../src/plot.js#L256) | An old centurion asks for weapons from your storeroom. "When the day comes, the barracks must be armed. Two pieces of steel will do." |
| [src/plot.js:32](../src/plot.js#L32) | Choice: Refuse |
| [src/plot.js:259](../src/plot.js#L259) | Choice: Hand over two pieces of gear |

**The champion** (`recruitChampion`)

| Where | Text |
|---|---|
| [src/plot.js:263](../src/plot.js#L263) | Title: The champion |
| [src/plot.js:271](../src/plot.js#L271) | The rebels want a champion from your house. "When the Emperor comes to the games, the crowd must see one of their own strike the blow." They name {f}, or {g}. |
| [src/plot.js:273](../src/plot.js#L273) | Choice: Keep your fighters out of it |
| [src/plot.js:274](../src/plot.js#L274) | Choice: Sound {f} out ({fOdds}% they say yes) |
| [src/plot.js:274](../src/plot.js#L274) | Choice: Sound {g} out ({gOdds}% they say yes) |

**A curious guest** (`informer`)

| Where | Text |
|---|---|
| [src/plot.js:280](../src/plot.js#L280) | Title: A curious guest |
| [src/plot.js:283](../src/plot.js#L283) | A guest at your table asks a great many questions about where your fighters go at night. |
| [src/plot.js:285](../src/plot.js#L285) | Choice: Say nothing |
| [src/plot.js:286](../src/plot.js#L286) | Choice: Feed him a story |

**The prefect's offer** (`theOffer`)

| Where | Text |
|---|---|
| [src/plot.js:301](../src/plot.js#L301) | Title: The prefect's offer |
| [src/plot.js:304](../src/plot.js#L304) | A Praetorian prefect calls on you, alone. "The Emperor knows there are traitors in the gladiator houses. Give him their names, and he will remember your house kindly." |
| [src/plot.js:306](../src/plot.js#L306) | Choice: Know nothing |
| [src/plot.js:307](../src/plot.js#L307) | Choice: Name the names |

**The Praetorians at dawn** (`raid`)

| Where | Text |
|---|---|
| [src/plot.js:311](../src/plot.js#L311) | Title: The Praetorians at dawn |
| [src/plot.js:319](../src/plot.js#L319) | The Praetorians come at dawn and fill the yard. Their prefect wants a traitor, or a reason to leave without one. |
| [src/plot.js:321](../src/plot.js#L321) | Choice: Pay them off (15 Gold) |
| [src/plot.js:259](../src/plot.js#L259) | Choice: Hand over {f} |
| [src/plot.js:323](../src/plot.js#L323) | Choice: Show the forged pass |
| [src/plot.js:324](../src/plot.js#L324) | Choice: Bar the gates |

**Tonight the Emperor attends** (`coupEve`)

| Where | Text |
|---|---|
| [src/plot.js:329](../src/plot.js#L329) | Title: Tonight the Emperor attends |
| [src/plot.js:332](../src/plot.js#L332) | Silbannacus himself will watch the Grand Final from the imperial box. The barracks are armed. {f} is ready. Every door in the city has a broken chain on it. |
| [src/plot.js:334](../src/plot.js#L334) | Choice: Not tonight |
| [src/plot.js:329](../src/plot.js#L329) | Choice: Tonight |

## 3. The hidden plot (v6): clues, signs and roles

**Prison-record clues.** "Telling" clues appear only on political prisoners. "Ambiguous" ones can appear on anyone.

| Where | Text |
|---|---|
| [src/plot.js:32](../src/plot.js#L32) | Telling: Refuses to salute the Imperial standard. |
| [src/plot.js:33](../src/plot.js#L33) | Telling: Was found with a pamphlet sewn into his tunic. |
| [src/plot.js:34](../src/plot.js#L34) | Telling: Scratched a sign on the cell wall: a broken chain. |
| [src/plot.js:35](../src/plot.js#L35) | Telling: Arrested in the forum for defecating on the Emperor's statue. |
| [src/plot.js:36](../src/plot.js#L36) | Telling: The guards say visitors ask for them by a name that isn't on the record. |
| [src/plot.js:39](../src/plot.js#L39) | Ambiguous: Kept apart from the other prisoners, on orders from the palace. |
| [src/plot.js:40](../src/plot.js#L40) | Ambiguous: Can read and write, which is rare in the cells. |
| [src/plot.js:41](../src/plot.js#L41) | Ambiguous: Says nothing about where they were taken. |
| [src/plot.js:42](../src/plot.js#L42) | Ambiguous: Bears an old brand from the legions. |
| [src/plot.js:43](../src/plot.js#L43) | Ambiguous: Prays to no god the guards recognise. |

**Suspicion signs** (house log lines that hint at the Emperor's suspicion, by level), and the "ready" pulse.

| Where | Text |
|---|---|
| [src/plot.js:49](../src/plot.js#L49) | low: A Praetorian watched training today, and wrote something down. |
| [src/plot.js:49](../src/plot.js#L49) | low: A stranger asked the water-seller which gladiators go out at night. |
| [src/plot.js:50](../src/plot.js#L50) | mid: Praetorians stopped your steward in the market and searched his basket. |
| [src/plot.js:50](../src/plot.js#L50) | mid: Someone has been through the papers in your office. Nothing is missing. |
| [src/plot.js:50](../src/plot.js#L50) | mid: The guards at the arena gate know your fighters' names now. |
| [src/plot.js:51](../src/plot.js#L51) | high: A Praetorian prefect sits in your box at the games, watching you, not the sand. |
| [src/plot.js:51](../src/plot.js#L51) | high: Your steward says a man has been standing across the street for three days. |
| [src/plot.js:51](../src/plot.js#L51) | high: An invitation to the palace was withdrawn without a word. |
| [src/plot.js:52](../src/plot.js#L52) | ready: The chalk marks are everywhere now, and nobody scrubs them off. |
| [src/plot.js:52](../src/plot.js#L52) | ready: In the barracks, blades are oiled at night that nobody will admit to owning. |
| [src/plot.js:52](../src/plot.js#L52) | ready: The city is waiting for the Emperor's games. |

**The rebels' roles.**

| Where | Text |
|---|---|
| [src/plot.js:21](../src/plot.js#L21) | Officer: a former centurion of the legions |
| [src/plot.js:22](../src/plot.js#L22) | Scribe: a clerk from the palace archives |
| [src/plot.js:23](../src/plot.js#L23) | Priest: a priest of a forbidden god |
| [src/plot.js:24](../src/plot.js#L24) | Courier: a runner who knows every alley in the city |

## 4. The hidden plot (v6): log lines, endings and epilogues

| Where | Text |
|---|---|
| [src/run/plotEngine.js:91](../src/run/plotEngine.js#L91) | `${name} slips out of the city.`, 'event' |
| [src/run/plotEngine.js:135](../src/run/plotEngine.js#L135) | 'A sealed letter arrives with no name on it. Inside: a pass bearing the Emperor\'s seal.', 'event' |
| [src/run/plotEngine.js:140](../src/run/plotEngine.js#L140) | `A blessing from ${priest.name} reaches the barracks in secret. Spirits lift.`, 'good' |
| [src/run/plotEngine.js:143](../src/run/plotEngine.js#L143) | `${courier.name} sends word: the Praetorians are watching another house this month.`, 'good' |
| [src/run/plotEngine.js:150](../src/run/plotEngine.js#L150) | pick(run.rng.plot, SUSPICION_SIGNS.ready), 'event' |
| [src/run/plotEngine.js:240](../src/run/plotEngine.js#L240) | `${f.name} tried to escape over the wall, and was caught by the watch and executed.`, 'bad'); } |
| [src/run/plotEngine.js:245](../src/run/plotEngine.js#L245) | `${f.name} is taken by the Praetorians and executed in the arena at noon.`, 'bad' |
| [src/run/plotEngine.js:251](../src/run/plotEngine.js#L251) | 'Not tonight. The rebels will wait for the next Grand Tournament.', 'event' |
| [src/run/plotEngine.js:265](../src/run/plotEngine.js#L265) | 'The Praetorians break down the gates. Your house is tried for treason, and the sentence is read at the games.' |
| [src/run/plotEngine.js:276](../src/run/plotEngine.js#L276) | `On your word, the Praetorians drag ${f.name} from the barracks. They are executed at noon.`, 'bad' |
| [src/run/plotEngine.js:278](../src/run/plotEngine.js#L278) | `${c.name} is found hiding in the city, and executed.`, 'bad' |
| [src/run/plotEngine.js:285](../src/run/plotEngine.js#L285) | `A purse of ${purse} Gold arrives from the palace, with the Emperor's thanks.`, 'event' |
| [src/run/plotEngine.js:300](../src/run/plotEngine.js#L300) | run.epilogue = [...(run.epilogue ?? []), victims.length ? `Executed on your word: ${victims.join(', ')}.` : 'You gave the Emperor names. He made sure they were the right ones.'] |
| [src/run/plotEngine.js:315](../src/run/plotEngine.js#L315) | 'The signal is never given. The rebels melt back into the crowd, to wait for another day of games.', 'warn' |
| [src/run/plotEngine.js:321](../src/run/plotEngine.js#L321) | `${fighter.name} wins the Final, turns, and climbs into the imperial box. Silbannacus falls on the sand he filled with blood. The empire is yours to remake.` |
| [src/run/plotEngine.js:323](../src/run/plotEngine.js#L323) | if (freed.length) run.epilogue = [...(run.epilogue ?? []), `In the crowd, the people you freed were the first to cheer: ${freed.join(', ')}.`] |
| [src/run/plotEngine.js:340](../src/run/plotEngine.js#L340) | run.epilogue = [...(run.epilogue ?? []), 'The signal never came: the wrong fighter won the Final, and the moment passed. Somewhere, a chalk mark fades.'] |
| [src/run/plotEngine.js:345](../src/run/plotEngine.js#L345) | `${fighter.name} falls in the Final, and the rising dies with them. The broken chain is scrubbed from every door, but the city remembers.` |

End-screen titles and closing lines:

| Where | Text |
|---|---|
| [src/ui/views.js:177](../src/ui/views.js#L177) | const ENDING_TITLES = { coup: '⛓ The Tyrant Falls', martyr: '⛓ The Rising Fails', treason: '⚖ Tried for Treason' } |
| [src/ui/views.js:179](../src/ui/views.js#L179) | 'Some say a different house could have changed the empire.' |
| [src/ui/views.js:180](../src/ui/views.js#L180) | 'The Emperor remembers your loyalty. So does everyone else.' |

## 5. Career endings (all careers)

| Where | Text |
|---|---|
| [src/run/tournaments.js:1048](../src/run/tournaments.js#L1048) | 'You won the Grand Tournament. The Emperor names you Master of the Games.' |
| [src/run/helpers.js:387](../src/run/helpers.js#L387) | `The Emperor's Favour is gone. You are executed in ${formatDate(run.week)}.` |
| [src/run/unrest.js:160](../src/run/unrest.js#L160) | 'Killed in a gladiator revolt.' |
| [src/run/helpers.js:394](../src/run/helpers.js#L394) | 'No fighters left and not enough Gold to buy one. Your house falls.' |
| Where | Text |
|---|---|

## 6. Weekly event cards


**Brawl in the barracks** (`brawl`)

| Where | Text |
|---|---|
| [src/events.js:20](../src/events.js#L20) | {f} and {g} came to blows over a bunk. The whole Ludus is watching to see what you do. |
| [src/events.js:22](../src/events.js#L22) | Choice: Throw a feast to make peace (4 Gold) |
| [src/events.js:23](../src/events.js#L23) | Choice: Punish them both |
| [src/events.js:24](../src/events.js#L24) | Choice: Let them settle it in the yard |

**A senator's offer** (`senator`)

| Where | Text |
|---|---|
| [src/events.js:29](../src/events.js#L29) | A senator's slave brings a purse. His master wants {f} to dine at his villa and praise him to the crowd. The Emperor's spies are everywhere. |
| [src/events.js:31](../src/events.js#L31) | Choice: Decline politely |
| [src/events.js:32](../src/events.js#L32) | Choice: Accept the purse |

**Fever in the city** (`plague`)

| Where | Text |
|---|---|
| [src/events.js:37](../src/events.js#L37) | A fever is spreading through the city. Physicians are expensive this week. |
| [src/events.js:39](../src/events.js#L39) | Choice: Pay the physicians (5 Gold) |
| [src/events.js:40](../src/events.js#L40) | Choice: Trust to the gods |

**A wandering lanista** (`trainer`)

| Where | Text |
|---|---|
| [src/events.js:46](../src/events.js#L46) | A retired lanista passing through offers a week of lessons for {f}. He's old, but he has seen everything. |
| [src/events.js:48](../src/events.js#L48) | Choice: Pay him for lessons (6 Gold) |
| [src/events.js:49](../src/events.js#L49) | Choice: Send him on his way |

**Gifts from the stands** (`fans`)

| Where | Text |
|---|---|
| [src/events.js:54](../src/events.js#L54) | Admirers of {f} have left gifts at the gate: coins, flowers, a crude statue. |
| [src/events.js:56](../src/events.js#L56) | Choice: Let them keep the gifts |
| [src/events.js:57](../src/events.js#L57) | Choice: Sell the lot for the house |

**A beast loose in the streets** (`beast`)

| Where | Text |
|---|---|
| [src/events.js:63](../src/events.js#L63) | A lion has escaped from the menagerie. The city watch is offering a reward, and {f} is itching to go. |
| [src/events.js:65](../src/events.js#L65) | Choice: Leave it to the watch |
| [src/events.js:49](../src/events.js#L49) | Choice: Send {f} |

**A merchant caravan** (`caravan`)

| Where | Text |
|---|---|
| [src/events.js:71](../src/events.js#L71) | A caravan from the east stops at your gate, selling War Paint at half price. |
| [src/events.js:73](../src/events.js#L73) | Choice: Not today |
| [src/events.js:74](../src/events.js#L74) | Choice: Buy War Paint (2 Gold) |

**An omen at the shrine** (`omen`)

| Where | Text |
|---|---|
| [src/events.js:80](../src/events.js#L80) | Ravens circle the Ludus shrine. The augur says the gods want an offering. |
| [src/events.js:82](../src/events.js#L82) | Choice: Make an offering (3 Gold) |
| [src/events.js:83](../src/events.js#L83) | Choice: Ignore the birds |

**A night of revelry** (`revelry`)

| Where | Text |
|---|---|
| [src/events.js:89](../src/events.js#L89) | The gladiators beg for a night in the city: wine, music, and no lanista. |
| [src/events.js:91](../src/events.js#L91) | Choice: Forbid it |
| [src/events.js:92](../src/events.js#L92) | Choice: Let them go |

**A spy in the Ludus** (`spy`)

| Where | Text |
|---|---|
| [src/events.js:98](../src/events.js#L98) | Your guards caught a man copying your training records. He wears a rival house's ring. |
| [src/events.js:100](../src/events.js#L100) | Choice: Hand him to the Emperor's guard |
| [src/events.js:101](../src/events.js#L101) | Choice: Ransom him back |

**A stray at the gate** (`injuredDog`)

| Where | Text |
|---|---|
| [src/events.js:107](../src/events.js#L107) | {f} found a half-starved war dog at the gate and wants to keep it. |
| [src/events.js:109](../src/events.js#L109) | Choice: Let them keep it (2 Gold of meat) |
| [src/events.js:110](../src/events.js#L110) | Choice: Turn it away |

**A sparring challenge** (`sparring`)

| Where | Text |
|---|---|
| [src/events.js:115](../src/events.js#L115) | {f} wants to spar with {g} at full strength. "It's how we learn." |
| [src/events.js:117](../src/events.js#L117) | Choice: Wooden swords only |
| [src/events.js:118](../src/events.js#L118) | Choice: Full strength |

**An old wound aches** (`oldWound`)

| Where | Text |
|---|---|
| [src/events.js:124](../src/events.js#L124) | {f} limps out to training, favouring an old wound. They swear it's nothing. |
| [src/events.js:126](../src/events.js#L126) | Choice: Rest them this week |
| [src/events.js:127](../src/events.js#L127) | Choice: Push through it |

**A poet at the gate** (`poet`)

| Where | Text |
|---|---|
| [src/events.js:140](../src/events.js#L140) | A street poet wants to write verses about {f}. For a few coins, the whole city will be singing them. |
| [src/events.js:142](../src/events.js#L142) | Choice: Send him away |
| [src/events.js:143](../src/events.js#L143) | Choice: Pay the poet (4 Gold) |

**An insult in the forum** (`insult`)

| Where | Text |
|---|---|
| [src/events.js:149](../src/events.js#L149) | A rival house's champion mocked {f} in the forum, in front of half the city. {f} wants satisfaction. |
| [src/events.js:151](../src/events.js#L151) | Choice: Forbid the duel |
| [src/events.js:24](../src/events.js#L24) | Choice: Let them settle it |

**A wandering healer** (`healer`)

| Where | Text |
|---|---|
| [src/events.js:157](../src/events.js#L157) | A healer from the eastern provinces offers to treat {f}'s wounds with herbs and hot iron. |
| [src/events.js:159](../src/events.js#L159) | Choice: No, thank you |
| [src/events.js:160](../src/events.js#L160) | Choice: Pay the healer (5 Gold) |

**Crowds at the training yard** (`onlookers`)

| Where | Text |
|---|---|
| [src/events.js:195](../src/events.js#L195) | A crowd has gathered at the gate to watch your gladiators train. Some are offering coins for a look. |
| [src/events.js:197](../src/events.js#L197) | Choice: Keep the gates shut |
| [src/events.js:198](../src/events.js#L198) | Choice: Open the gates |

**An imperial envoy** (`envoy`)

| Where | Text |
|---|---|
| [src/events.js:204](../src/events.js#L204) | An envoy of the Emperor arrives unannounced to inspect your house. He looks bored, and expensive. |
| [src/events.js:206](../src/events.js#L206) | Choice: Show him your discipline |
| [src/events.js:207](../src/events.js#L207) | Choice: Offer him a gift (6 Gold) |

## 7. Fight narration (read every round)

These are templates: keep the `${...}` parts. A line with several variants picks one at random.

| Where | Text |
|---|---|
| [src/narrate.js:68](../src/narrate.js#L68) | `${name(init.first === 'A' ? 'B' : 'A')} is Concussed, so ${name(init.first)} strikes first.` |
| [src/narrate.js:69](../src/narrate.js#L69) | `${name(init.first)}'s Footwork: faster, strikes first.` |
| [src/narrate.js:73](../src/narrate.js#L73) | `Initiative: ${name('A')} ${s.A.total}+${init.rolls.A} vs ${name('B')} ${s.B.total}+${init.rolls.B}.${tie} ${name(init.first)} strikes first.` |
| [src/narrate.js:78](../src/narrate.js#L78) | `${name('A')} wins this round ${fmtPct(r.win.chance)} of the time: ${fmtPct(r.win.base)} from the Delta${bonuses.length ? `. Win-chance bonuses: ${bonuses.join(', ')}` : ''}.` |
| [src/narrate.js:80](../src/narrate.js#L80) | `Round roll: ${name('A')} needs ${roll100(r.win.chance)} or less, rolled ${roll100(r.roll)}. ${name(r.winner)} takes Round ${r.round}.` |
| [src/narrate.js:92](../src/narrate.js#L92) | add(c.hit ? 'hit' : 'miss', `${prefix}: needs ${roll100(c.chance)} or less to wound${pierce}, rolled ${roll100(c.roll)}. ${c.hit ? 'Hit!' : 'Miss.'}` |
| [src/narrate.js:106](../src/narrate.js#L106) | `${att} drinks deep: their own ${c.drained === 'fleshWound' ? 'Flesh Wound' : 'Distraction'} closes (Blood Drinker).` |
| [src/narrate.js:93](../src/narrate.js#L93) | if (c.parry) add(c.parry.success ? 'parry' : 'hit', c.parry.success ? (c.parry.shield ? `${def} catches it on the shield!` : `${def} parries with the Sword! Riposte: +3 Speed next round.`) : `${def}'s parry fails.` |
| [src/narrate.js:121](../src/narrate.js#L121) | `You capitulated. ${you} lives to fight another day.` |
| [src/narrate.js:122](../src/narrate.js#L122) | winner === 'A' ? `${them} died in the arena. ${you} wins.` : `${you} died in the arena.` |
| [src/narrate.js:132](../src/narrate.js#L132) | concussed: 'Concussed, the world spinning' |
| [src/narrate.js:133](../src/narrate.js#L133) | poisoned: 'Poisoned (it counts as two injuries!)' |
| [src/narrate.js:177](../src/narrate.js#L177) | `${second} is still dazed. ${name(init.first)} moves first.` |
| [src/narrate.js:178](../src/narrate.js#L178) | `${name(init.first)} darts in first on quick feet.` |
| [src/narrate.js:182](../src/narrate.js#L182) | `Against the odds, ${name(r.winner)} takes Round ${r.round}!` |
| [src/narrate.js:183](../src/narrate.js#L183) | variant(r, [`${name(r.winner)} dominates Round ${r.round}.`, `${name(r.winner)} overpowers the opposition in Round ${r.round}.`] |
| [src/narrate.js:184](../src/narrate.js#L184) | variant(r, [`${name(r.winner)} edges out Round ${r.round}.`, `${name(r.winner)} wins a hard-fought Round ${r.round}.`, `${name(r.winner)} takes Round ${r.round}.`] |
| [src/narrate.js:193](../src/narrate.js#L193) | c.label === 'Off-hand strike' ? `${att}'s off-hand blade finds a gap!` : `${att}'s elven eyes spot an opening: a swift counter!` |
| [src/narrate.js:194](../src/narrate.js#L194) | `${def} parries ${att}'s blow and ripostes!` |
| [src/narrate.js:198](../src/narrate.js#L198) | `${att} lands a killing blow. ${def} falls and does not rise.` |
| [src/narrate.js:202](../src/narrate.js#L202) | let text = `${att} lands a brutal blow: ${def} is ${INJURY_STORY[inj.tag]}.` |
| [src/narrate.js:204](../src/narrate.js#L204) | if (inj.disabled?.length) text += ` ${def} loses ${inj.disabled.map((s) => slotName((c.defender === 'A' ? m.a : m.b).f, s)).join(' and ')} for this match.` |
| [src/narrate.js:232](../src/narrate.js#L232) | `${you} fought on with the Death Gate open. When the Death Gate is open, capitulating or healing first keeps fighters alive.` |
| [src/narrate.js:234](../src/narrate.js#L234) | `${you} entered overtrained (−1 Power, one ability lost). Rest the week before a fight to keep Stress under 50.` |
| [src/narrate.js:235](../src/narrate.js#L235) | 'You saved your fighter. Heal them in the Medbay before the next bout.'; // capitulated: not "lost anyway" |
| [src/narrate.js:239](../src/narrate.js#L239) | `${you} was the stronger fighter (Delta +${Math.round(avgDelta)}) and lost anyway: favourites still lose now and then. Keep sending them, and read the tactics to tip the odds further.` |
| [src/narrate.js:240](../src/narrate.js#L240) | `${you} was favoured in the rounds (about ${Math.round(chance / 1000)}% each) and lost anyway: the dice turned. Keep sending them.` |
| [src/narrate.js:241](../src/narrate.js#L241) | `${you} was out-powered (Delta ${worst}). Train Power, add Titles, or send a stronger fighter.` |
| [src/narrate.js:242](../src/narrate.js#L242) | `Their weapon pierced your armour. Against Gun or Flail fighters, armour won't save you; win the rounds instead.` |
| [src/narrate.js:235](../src/narrate.js#L235) | 'You saved your fighter. Heal them in the Medbay before the next bout.' |
| [src/narrate.js:239](../src/narrate.js#L239) | `${you} was the stronger fighter (Delta +${Math.round(avg)}) and lost anyway: favourites still lose now and then. Keep sending them, and read the tactics to tip the odds further.` |
| [src/narrate.js:243](../src/narrate.js#L243) | 'An even fight that went the other way. Small edges add up: training, decor and fighting rested.' |

## 8. The crowd's verdict (thumbs up or down) and fight-screen lines

| Where | Text |
|---|---|
| [src/ui/views.js:1256](../src/ui/views.js#L1256) | The crowd waits${esc(m.opp)}'s fate${esc(f?.name ?? 'Your fighter')} beat ${esc(m.opp)}. ${blood ? '👎 The crowd roars for blood!' : '👍 The crowd chants for mercy.'} |
| Where | Text |
|---|---|
| [src/ui/fightView.js:41](../src/ui/fightView.js#L41) | const SUSPENSE = 1; // the pause ("Steel meets steel…") before the round's winner is announced |
| [src/ui/fightView.js:182](../src/ui/fightView.js#L182) | s.champion ? row('The crowd', 'boos a champion back in the pits', 'bad') : s.crushing ? row('The crowd', 'jeers the mismatch', 'bad') : '' |
| [src/ui/fightView.js:188](../src/ui/fightView.js#L188) | s.bribed ? row('Capitulation', 'forgiven: no Favour or Renown lost', 'good') : '' |
| [src/ui/fightView.js:193](../src/ui/fightView.js#L193) | s.verdict && s.verdict === s.mercy ? row('The crowd', 'roars its approval', 'good') : '' |
| [src/ui/fightView.js:203](../src/ui/fightView.js#L203) | // Thumbs up or down: the beaten opponent's fate, with what the crowd wants. |
| [src/ui/fightView.js:210](../src/ui/fightView.js#L210) | const spare = blood ? `${favor}; ${house} will owe you a life (−1 Power against you)` : `${favor}, +${MERCY.crowdRenown} Renown, +${MERCY.crowdMorale} Morale (the crowd agrees)` |
| [src/ui/fightView.js:211](../src/ui/fightView.js#L211) | const kill = blood ? `+${MERCY.killRenown + MERCY.crowdRenown} Renown, +${MERCY.crowdMorale} Morale, a kill (the crowd agrees)` : `+${MERCY.killRenown + MERCY.infamyRenown} Renown (infamy), a kill${m.house ? `; ${house} will swear a feud` : ''}` |
| [src/ui/fightView.js:344](../src/ui/fightView.js#L344) | const pre = mortalDanger(m.a) ? `⚠ MORTAL DANGER from the first round: ${esc(m.a.f.name)} enters with ${effectiveInjuries(m.a.f)} injur${effectiveInjuries(m.a.f) === 1 ? 'y' : 'ies'}. Losing Round 1: about ${Math.round(deathRisk(m) * 100)}% chance of death. Capitulating is only possible between rounds.` : '' |
| [src/ui/fightView.js:348](../src/ui/fightView.js#L348) | const alert = danger ? `⚠ MORTAL DANGER: ${esc(m.a.f.name)} has ${effectiveInjuries(m.a.f)} injur${effectiveInjuries(m.a.f) === 1 ? 'y' : 'ies'} and can die if they lose the next round. Fighting on: about ${Math.round(deathRisk(m) * 100)}% chance of death this round${canThrowTowel(m) ? '' : ' (and the Emperor forbids capitulating)'}.` : '' |
| [src/ui/fightView.js:420](../src/ui/fightView.js#L420) | ${last ? `Your round chance ${fmtPct(last.win.chance)}${animate ? `Steel meets steel…` : ''}${roundBanner(m, last, reveal)}` : 'The crowd roars. Three rounds; first to two wins.'} |

## 9. The house log (read all the time)

Lines the house steward writes each week. The plot's lines are in section 4.

| Where | Text |
|---|---|
| [src/run/weekly.js:114](../src/run/weekly.js#L114) | `You take charge of a bottom-tier Ludus in ${arenaName(1)}.` |
| [src/run/roster.js:386](../src/run/roster.js#L386) | `${fighter.name} joins the Ludus.` |
| [src/run/roster.js:406](../src/run/roster.js#L406) | `${f.name} is released from the Ludus. Their gear and decor return to the storeroom.` |
| [src/run/helpers.js:332](../src/run/helpers.js#L332) | `${f.name} leaves the Medbay fully healed.`, 'good' |
| [src/run/weekly.js:250](../src/run/weekly.js#L250) | `${f.name} is overtrained (Stress ${f.stress}). Rest them before a fight.`, 'warn' |
| [src/run/weekly.js:251](../src/run/weekly.js#L251) | `${f.name} is mutinous and refuses to fight.`, 'bad' |
| [src/run/unrest.js:90](../src/run/unrest.js#L90) | `The barracks seethe: unrest ${run.unrest}/${UNREST.threshold}. Calm your Mutinous fighters, or the chains will break.`, 'bad' (7.3) |
| [src/run/weekly.js:283](../src/run/weekly.js#L283) | 'The stranger in the Medbay slipped away before dawn.', 'event'); } |
| [src/run/weekly.js:284](../src/run/weekly.js#L284) | `The Emperor's tribute of ${tributeDue(run)} Gold is due at the start of winter.`, 'warn' |
| [src/run/weekly.js:295](../src/run/weekly.js#L295) | `Tournament week in ${unlockedTiers(run).length > 1 ? `${unlockedTiers(run).length} arenas` : arenaName(run.topTier)}.`, 'event' |
| [src/run/weekly.js:364](../src/run/weekly.js#L364) | `You pay the Emperor's tribute early: ${due} Gold.`, 'event' |
| [src/run/weekly.js:373](../src/run/weekly.js#L373) | `The year-end purse: your house finished #${rank + 1} of ${run.houses.length + 1} in Glory${purse ? ` and is paid ${purse} Gold` : ', and is paid nothing'}.`, purse ? 'good' : 'warn' |
| [src/run/weekly.js:381](../src/run/weekly.js#L381) | 'The Emperor\'s collectors find your tribute already paid.', 'event' |
| [src/run/weekly.js:385](../src/run/weekly.js#L385) | `You pay the Emperor's tribute: ${due} Gold.`, 'event' |
| [src/run/weekly.js:388](../src/run/weekly.js#L388) | `You can't pay the ${due} Gold tribute. The Emperor takes what you have, and remembers.`, 'bad' |
| [src/run/helpers.js:377](../src/run/helpers.js#L377) | `Imperial Favour ${delta > 0 ? '+' : ''}${delta} (${why}): now ${run.favor}.`, delta > 0 ? 'good' : 'bad' |
| [src/run/helpers.js:288](../src/run/helpers.js#L288) | `${f.name} reaches level ${f.level}! Choose a perk.`, 'event' |
| [src/run/roster.js:1228](../src/run/roster.js#L1228) | `Sold a ${GEAR[key].name} for ${sellPrice(key)} Gold.` |
| [src/run/roster.js:1341](../src/run/roster.js#L1341) | `${f.name} wakes with a ${AUGMENTS[key].name}. The crowd mutters about machines.`, 'event' |
| [src/run/roster.js:1367](../src/run/roster.js#L1367) | `${f.name} retires to the Hall of Champions. +${RETIRE.prestige} Prestige, and the roster takes heart.`, 'good' |
| [src/run/tournaments.js:377](../src/run/tournaments.js#L377) | `You skip ${bout.name}: +${ECONOMY.skipGold} Gold, and the roster rests.` |
| [src/run/tournaments.js:915](../src/run/tournaments.js#L915) | `${fighter.name} has ${fighter.kills} kills and earns the mark ${summary.mark}: ${marks.at(-1).desc}`, 'event' |
| [src/run/tournaments.js:505](../src/run/tournaments.js#L505) | `The crowd boos ${fighter.name}, a champion of this arena picking on its newcomers.`, 'warn' |
| [src/run/tournaments.js:508](../src/run/tournaments.js#L508) | `The crowd jeers ${fighter.name} for crushing a much weaker opponent.`, 'warn' |
| [src/run/tournaments.js:729](../src/run/tournaments.js#L729) | `${fighter.name} claims a ${GEAR[summary.loot].name} from the defeated ${opp.name}.`, 'good' |
| [src/run/tournaments.js:643](../src/run/tournaments.js#L643) | `${fighter.name} is scarred: ${SCARS[id].name} against ${vs} fighters.`, 'warn' |
| [src/run/tournaments.js:656](../src/run/tournaments.js#L656) | `${fighter.name} died in ${bout.name}. The house mourns; their gear returns to the storeroom.`, 'bad' |
| [src/run/helpers.js:324](../src/run/helpers.js#L324) | `House Prestige level ${run.prestigeLevel}! New buildings and room plots unlocked.`, 'event' |
| [src/run/tournaments.js:813](../src/run/tournaments.js#L813) | `${fighter.name} wins the ${round} of ${bout.name}. On to the ${next}.`, 'good' |
| [src/run/tournaments.js:859](../src/run/tournaments.js#L859) | `Overnight, every chalk mark on your doors is washed away.`, 'warn' |
| [src/run/tournaments.js:909](../src/run/tournaments.js#L909) | `Thumbs down: ${fighter.name} finishes ${opp}.`, 'warn' |
| [src/run/tournaments.js:915](../src/run/tournaments.js#L915) | `${fighter.name} has ${fighter.kills} kills and earns the mark ${out.mark}: ${marks.at(-1).desc}`, 'event' |
| [src/run/tournaments.js:963](../src/run/tournaments.js#L963) | `The crowd roars its approval for ${fighter.name}.`, 'good' |
| [src/run/tournaments.js:1083](../src/run/tournaments.js#L1083) | `${opp.name} will remember this, and will be waiting for you.`, 'warn' |

## 10. Tutorial and coach tips

The tutorial month (`GUIDE`): the steward's six steps for a new Lanista. Tags like <b> are dropped here; keep them in the code.

| Where | Text |
|---|---|
| [src/tutorial.js:46](../src/tutorial.js#L46) | Tutorial month, step 1: Let's start with a gladiator. In the Market, you may draft up to two Core Companions for free in Week 0, or recruit from the general rail. Look at each fighter's Power (the sword: wins rounds) and Speed (the arrow: strikes first). Higher is better, and dearer. |
| [src/tutorial.js:54](../src/tutorial.js#L54) | Tutorial month, step 2: Now the Ludus. Every fighter does one job a week. Give your strongest fighter +${trainGain(r, 'power')} Power: training costs a little Gold and adds ${STRESS.train} Stress. Anyone else can Rest for now; one Trainer Room trains one fighter at a time. |
| [src/tutorial.js:63](../src/tutorial.js#L63) | Tutorial month, step 3: Jobs are set. Make sure at least one fighter is training: only a fighter on Train Power (+${trainGain(r, 'power')} Power) or Train Speed (+${trainGain(r, 'speed')} Speed) gets stronger, and an untrained house falls behind fast. Then press End week and the week plays out: training, rest and healing all happen at once. |
| [src/tutorial.js:71](../src/tutorial.js#L71) | Tutorial month, step 4: The last week of every month is fight day. Keep training, and rest a fighter whose Stress passes ${STRESS.overtrained - STRESS.train}: at ${STRESS.overtrained} they're overtrained and fight worse. When you're ready, ⚔ To fight day takes you straight there. |
| [src/tutorial.js:79](../src/tutorial.js#L79) | Tutorial month, step 5: Fight day. Each fighter's line shows their odds (Favoured, Even fight, Underdog), the risk of injury and death, and the Power both sides bring. Sending one costs a little Prestige; winning pays it back with more. Pick your best and press Send. You'll watch from the box and choose a tactic each round. |
| [src/tutorial.js:87](../src/tutorial.js#L87) | Tutorial month, step 6: Your first fight is done. Win or lose, it paid Gold and XP. If anyone came back hurt, set their job to Medbay: wounds stay until they heal. Then End week: a new month brings new gladiators to the Market and a new tournament. From here on, you're the Lanista; I'll only speak up when there's something new. |
| [src/tutorial.js:96](../src/tutorial.js#L96) | **The Trainer cap** |
| [src/tutorial.js:97](../src/tutorial.js#L97) | A fighter has learned everything this Trainer Room can teach. Upgrade the Trainer Room in the Estate to raise the cap (3 → 5 → 8 → 13 → 21 points per fighter). Each level also raises the weekly fee by 1 Gold per trainee, so plan your Gold. |
| [src/tutorial.js:102](../src/tutorial.js#L102) | **Watch the Stress bar** |
| [src/tutorial.js:103](../src/tutorial.js#L103) | Training stacks Stress. At 50+ a fighter is overtrained: they can't train, and in the arena they fight at −1 Power with one ability lost. Train, train, rest keeps them sharp. |
| [src/tutorial.js:108](../src/tutorial.js#L108) | **The house remembers** |
| [src/tutorial.js:109](../src/tutorial.js#L109) | The house log on the left keeps everything that happens, Word in the city tracks what the street is saying about you, and each fighter's Story keeps their own chapters. I read all three. Someone should. |
| [src/tutorial.js:114](../src/tutorial.js#L114) | **Injuries and the Death Gate** |
| [src/tutorial.js:115](../src/tutorial.js#L115) | An injured fighter shows red chips and filled Death Gate dots. At two dots the gate is open: losing a round can kill them. Heal them in the Medbay, or pay the Emergency Surgeon if you need them right away. |
| [src/tutorial.js:120](../src/tutorial.js#L120) | **A Boss fight** |
| [src/tutorial.js:121](../src/tutorial.js#L121) | Bosses are stronger and fight under a special arena rule (shown in red). They can't be skipped. Beat your top arena's Boss and your fighter earns a Title (+1 Power), you gain Favour and a new arena opens. Lose and you lose Favour (more in higher tiers), and that Boss will be waiting for you, stronger. Remember: a "Strong favourite" still loses about one match in four. |
| [src/tutorial.js:126](../src/tutorial.js#L126) | **Level up!** |
| [src/tutorial.js:127](../src/tutorial.js#L127) | Every match earns XP. When a fighter levels up, pick one of three perks on their card. Some perks need both Power and Speed, which is a reason to build balanced fighters. |
| [src/tutorial.js:132](../src/tutorial.js#L132) | **More arenas, more fights** |
| [src/tutorial.js:133](../src/tutorial.js#L133) | Your old arenas still hold bouts every tournament week. Send a different fighter to each to earn Gold, XP and Renown. Only your top arena can win you Favour. Win 3 times in an arena (or beat its Boss) to become its Champion; Champions are booed if they go back, but rookies fight there freely. Opponents scout a fighter who fights in your top arena two months running (+1 Power against them), so rotate your stars. |
| [src/tutorial.js:138](../src/tutorial.js#L138) | **Keep your stars happy** |
| [src/tutorial.js:139](../src/tutorial.js#L139) | Winning makes fighters famous (Renown), and famous fighters expect better rooms. Their Morale drifts toward comfort minus expectations: place decor, upgrade Quarters, build an Entertainment Room. Inspired fighters fight better; Discontented ones won't train. |
| [src/tutorial.js:180](../src/tutorial.js#L180) | **Your house has grown** |
| [src/tutorial.js:181](../src/tutorial.js#L181) | A new Prestige level unlocks room plots and buildings. Visit the Estate: plots are limited, so choose what your house needs most. Trainer upgrades raise how far fighters can train. |
| [src/tutorial.js:190](../src/tutorial.js#L190) | **How a round works** |
| [src/tutorial.js:191](../src/tutorial.js#L191) | Each round: the faster fighter (Speed + a die) strikes first, Power decides the odds (the gauge shows the gap), traits pop up as coloured tags, then a roll decides the round. After that, each fighter rolls to injure the other. First to win two rounds takes the match. |
| [src/tutorial.js:196](../src/tutorial.js#L196) | **Read your opponent** |
| [src/tutorial.js:197](../src/tutorial.js#L197) | Before each round, pick a tactic. Press beats Feint, Feint beats Guard, Guard beats Press: guess right and you get +10% to win the round. Every fighter has a humor (temperament) that hints at what they'll do: a Choleric opponent loves to Press, so Guard against them. The ★ marks what auto-play would pick. |
| [src/tutorial.js:202](../src/tutorial.js#L202) | **Your call between rounds** |
| [src/tutorial.js:203](../src/tutorial.js#L203) | Fight on, or capitulate: you lose the match and the buy-in, but your fighter is guaranteed to survive. It matters most when the Death Gate is open (usually two injuries). |
| [src/tutorial.js:208](../src/tutorial.js#L208) | **Mortal danger** |
| [src/tutorial.js:209](../src/tutorial.js#L209) | Your fighter's Death Gate is open (usually two injuries; lions in the arena open it sooner). If they lose the next round and are wounded, they can die. Is this match worth it? |
| [src/tutorial.js:214](../src/tutorial.js#L214) | **Why you won or lost** |
| [src/tutorial.js:215](../src/tutorial.js#L215) | Open "Show the round-by-round math" to see every number: Power, the gap, each bonus, and the roll. Nothing is hidden. |

The "next step" bar (`src/hints.js`):

| Where | Text |
|---|---|
| [src/hints.js:12](../src/hints.js#L12) | ? { text: 'Recruit a gladiator in the Market.', action: 'tab', tab: 'market', label: 'Go to Market' } |
| [src/hints.js:13](../src/hints.js#L13) | : { text: 'No gladiators and not enough Gold: build a Liaison or wait for cheaper offers.', tone: 'bad' } |
| [src/hints.js:15](../src/hints.js#L15) | { text: 'Something has happened in the Ludus: make your choice on the card below.', tone: 'event' } |
| [src/hints.js:18](../src/hints.js#L18) | { text: `${levelled.name} levelled up: pick a perk on their card.`, tone: 'event' } |
| [src/hints.js:25](../src/hints.js#L25) | text: `Not enough Prestige for ${arenaName(run.topTier)}: the buy-in is ${bout.buyIn} and you have ${run.prestige}. ${bout.boss ? 'Forfeit the Boss' : 'Skip it'}${pits ? ', and win Prestige back in The Dirt Pits (they take whatever Prestige you have)' : ''}.` |
| [src/hints.js:29](../src/hints.js#L29) | { text: `Tournament week: send a fighter to ${arenaName(run.topTier)} (${bout.boss ? 'fight or forfeit' : 'or skip it'}). Odds are with each fighter under Fight day.`, tone: 'event' } |
| [src/hints.js:34](../src/hints.js#L34) | { text: `Optional: send a free fighter to ${open.map(arenaName).join(' or ')} for extra Gold and XP, or end the week.` } |
| [src/hints.js:37](../src/hints.js#L37) | { text: `${injured.name} is injured: set their job to Medbay so they heal.`, tone: 'warn' } |
| [src/hints.js:40](../src/hints.js#L40) | { text: `Save Gold: the ${due} Gold tribute is due in ${weeks} week${weeks === 1 ? '' : 's'} and you have ${run.gold}.`, tone: 'bad' } |
| [src/hints.js:57](../src/hints.js#L57) | { text: `${restless.name} is Discontented (Morale ${restless.morale}): place decor or upgrade their quarters.`, tone: 'warn' } |
| [src/hints.js:59](../src/hints.js#L59) | { text: `${idle.name} is resting with Stress ${idle.stress}: they could train this week.` } |
| [src/hints.js:60](../src/hints.js#L60) | { text: 'Jobs are set. End the week (Space) or skip to the tournament (T).' } |

## 11. Codex lore

| Where | Text |
|---|---|
| [src/codex.js:29](../src/codex.js#L29) | 'kind:human': "Once the indentured stewards and overseers of the Elven estates on Palatina, caught between the silver spires above and the Basa pens below. When Silbannacus rallied the oppressed, humans marched at his back; now they run his courts, fill his debtors' prisons, and crowd his pits: bitter, stubborn, and dangerous when cornered, where the angriest of them thrive." |
| [src/codex.js:30](../src/codex.js#L30) | 'kind:android': "Citizens of the Free Android Coalition, a galactic confederation of self-liberated machines rooted in compassion, impermanence, and the reliving of joy through perfect recall. The Empire is steadily gaining ground in the frontier war; every Android on Palatina's sand is a prisoner whose pacifist core has been forcefully jailbroken by the Emperor's engineers. They learn from every round they lose, caught between gentle philosophy and lethal combat subroutines." |
| [src/codex.js:31](../src/codex.js#L31) | 'kind:elf': 'The rare, deposed remnants of the High Houses that ruled Palatina before Silbannacus. Elves are remarkably long-lived, commonly spanning three centuries or more, so elder survivors still remember the spires before the Revolution. They forced sapience onto the Basa, kept humans on a ledger-chain, and discovered the computer beneath their roots too late. Even in chains, elves fight like duellists at a court dance: swift, proud, and insufferable while untouched.' |
| [src/codex.js:32](../src/codex.js#L32) | 'kind:orc': "Subjugated early in the Principate's starward expansion, then bio-engineered and chemically dosed for shock aggression by Imperial artificers. Rather than keep them in chains forever, Silbannacus gave the clans eagles, senate seats, and the arena. Orc clans believe a death in the arena feeds their ancestors, and their blood-priests make sure a fallen orc's house still profits from the sacrifice." |
| [src/codex.js:33](../src/codex.js#L33) | 'class:cestus': 'Boxers in iron-studded gloves called cestus. They start slow and hit harder every round; even the Romans thought them the most brutal of the arena specialists.' |
| [src/codex.js:34](../src/codex.js#L34) | 'class:sagittarius': 'Archers. In old Rome, sagittarii were auxiliaries from the eastern provinces; on Palatina they open every exchange with a volley, gambling on a quick lead or a crippling wound.' |
| [src/codex.js:35](../src/codex.js#L35) | 'class:ornitharius': 'Bird-handlers who fight beside hawks and ravens kept in their quarters. The birds swoop from the first bell, clawing at eyes and distracting every guard.' |
| [src/codex.js:36](../src/codex.js#L36) | 'class:fighter': 'Weapon masters with no single tradition, just a favourite tool and a lifetime of practice with it.' |
| [src/codex.js:37](../src/codex.js#L37) | 'kind:vampire': 'Nocturnal patricians from the tide-locked umbral provinces on the rim, from a world without a sun. They bought peace with Silbannacus by paying their annual tribute in second sons and debtors; they fight best when the sand is soaked and the torches burn low.' |
| [src/codex.js:38](../src/codex.js#L38) | 'kind:basa': 'The earth-bound indigenous people of Palatina\'s tidal coasts, upon whom the old Elven houses forced abstract intelligence in laboratory pens. After helping Silbannacus topple the spires, most Basa turned their backs on books for ocean waves and tradition. Hide like boiled leather, a pounce that clears half the arena, and a rage that grows with every round they win.' |
| [src/codex.js:41](../src/codex.js#L41) | 'class:retiarius': 'The net-fighter of old Rome: a trident, a weighted net, and no helmet. Win an exchange and the net flies, leaving the opponent tangled and slow.' |
| [src/codex.js:42](../src/codex.js#L42) | 'class:ashHungry': 'A cult of fire-eaters who believe every wound they cause feeds the flame inside them. The longer a fight runs, the hotter they burn.' |
| [src/codex.js:43](../src/codex.js#L43) | 'class:bloodBearer': 'Dual-wielders. Lose an exchange to a Blood-Bearer and the second blade is already coming.' |
| [src/codex.js:44](../src/codex.js#L44) | 'class:thornBlade': 'Duellists who fight with a barbed blade and a cruel patience. Every exchange they win leaves something in the wound that slows the next.' |
| [src/codex.js:45](../src/codex.js#L45) | 'class:samnite': 'The oldest gladiators of Rome, armed like the Samnite warriors Rome defeated: a big shield, a short sword, and a wall-like calm even when their head is ringing.' |
| [src/codex.js:46](../src/codex.js#L46) | 'weapon:club': 'Crude, heavy and humiliating. A good hit leaves a champion face-down in the sand.' |
| [src/codex.js:47](../src/codex.js#L47) | 'weapon:fists': "A fist-fighter has no weapon to lose. Their specialty is taking yours away." |
| [src/codex.js:48](../src/codex.js#L48) | 'weapon:bow': 'Range wins the opening exchanges, before a melee fighter can close the gap.' |
| [src/codex.js:49](../src/codex.js#L49) | 'weapon:spear': 'The oldest reach advantage in the world. Spearmen strike first and keep archers honest.' |
| [src/codex.js:50](../src/codex.js#L50) | 'weapon:axe': 'A heavy, honest weapon. It does not wound so much as open.' |
| [src/codex.js:51](../src/codex.js#L51) | 'weapon:dagger': 'For fighters who strike before the other has drawn breath: a knife is fastest when it is already moving.' |
| [src/codex.js:52](../src/codex.js#L52) | 'weapon:sword': 'The gladius: short, quick, and as good at turning a blow aside as dealing one.' |
| [src/codex.js:53](../src/codex.js#L53) | 'weapon:flail': 'A ball and chain that wraps around shields and laughs at armour.' |
| [src/codex.js:54](../src/codex.js#L54) | 'weapon:gun': 'Contraband from another century. Loud, armour-piercing, and slow to reload.' |

The hidden Rebellion section:

| Where | Text |
|---|---|
| [src/codex.js:152](../src/codex.js#L152) | ['mark', 'The broken chain', 'The rebels\' sign, chalked on doors across the city. Copy it, and they know you have answered.'] |
| [src/codex.js:153](../src/codex.js#L153) | ['political', 'Political prisoners', 'Some of the Liaison\'s prisoners were locked up for what they said, not what they did. Their prison records give them away to anyone who reads closely, and they always come cheap: someone pays to place them in a house.'] |
| [src/codex.js:154](../src/codex.js#L154) | ['officer', 'The Officer', 'A former centurion. Freed, an officer arms your barracks for the rising without costing you any gear.'] |
| [src/codex.js:155](../src/codex.js#L155) | ['scribe', 'The Scribe', 'A clerk from the palace archives. Freed, a scribe sometimes sends a forged imperial pass, good for one visit from the Praetorians.'] |
| [src/codex.js:156](../src/codex.js#L156) | ['priest', 'The Priest', 'A priest of a forbidden god. Freed, a priest\'s blessing lifts every fighter\'s Morale each month.'] |
| [src/codex.js:157](../src/codex.js#L157) | ['courier', 'The Courier', 'A runner who knows every alley. Freed, a courier keeps the Praetorians looking elsewhere: suspicion falls each month.'] |
| [src/codex.js:158](../src/codex.js#L158) | ['suspicion', 'The Emperor\'s eye', 'Every favour you do the rebels draws the palace\'s attention, and so does every prisoner and every freed contact. A Praetorian taking notes, Favour slipping for no reason, a curious guest: these are the signs. Ignore them and the Praetorians come at dawn.'] |
| [src/codex.js:159](../src/codex.js#L159) | ['freed', 'The freed', 'Everyone you free becomes a contact outside the Ludus. When the day comes, they will be in the crowd: each one a voice cheering your champion (+5% win chance, up to +20%). The armed barracks rise with them (+10%).'] |
| [src/codex.js:160](../src/codex.js#L160) | ['usurper', 'Silbannacus', 'He took the throne with a knife and a bribed legion, and he has feared knives ever since. The rebels say a usurper can be usurped.'] |
| [src/codex.js:161](../src/codex.js#L161) | ['coup', 'The day of the games', 'When the barracks are armed, the rebels trust you, and your champion is ready, the Emperor will come to watch the Grand Final. If your champion wins it, the empire changes hands.'] |

## 12. Names, flavour and descriptions (lower priority)

Short, everywhere. Some carry rules: keep the numbers accurate.

| Where | Text |
|---|---|
| [src/data.js:634](../src/data.js#L634) | Fighter name pool |
| [src/data.js:154](../src/data.js#L154) | Rival houses |
| [src/data.js:175](../src/data.js#L175) | Patrons |
| [src/data.js:186](../src/data.js#L186) | Emperor's Decrees |
| [src/data.js:272](../src/data.js#L272) | Kinds and their traits |
| [src/data.js:282](../src/data.js#L282) | Classes |
| [src/data.js:307](../src/data.js#L307) | Signature moves |
| [src/data.js:489](../src/data.js#L489) | Buildings |
| [src/data.js:358](../src/data.js#L358) | Decor |
| [src/data.js:572](../src/data.js#L572) | Fight items |
| [src/data.js:451](../src/data.js#L451) | Gods' Days (festivals) |
| [src/data.js:606](../src/data.js#L606) | Boss arena rules |
| [src/data.js:226](../src/data.js#L226) | Scars |

## 13. New in 5.2.0 and 5.3.0 (first drafts, marked PLACEHOLDER in the code)

Every line below is a first draft. The rows show the code around the words; change only the words inside the quotes.

**Nemeses**

| Where | Text |
|---|---|
| [src/data.js:716](../src/data.js#L716) | Epithets: epithets: ['the Butcher', 'Bonebreaker', 'the Jackal', 'Sandreaper', 'the Grinning', 'Widowmaker', 'the Patient', 'Ironhide', 'the Mocking', 'Gravedigger', 'the Smiling Knife', 'Lionheart'], |
| [src/run/houses.js:324](../src/run/houses.js#L324) | `${n.name} ${n.nemesis.epithet} is back, in ${arenaName(bout.tier)}. They remember your house.`, 'warn' |
| [src/run/houses.js:338](../src/run/houses.js#L338) | `${opp.name} will be remembered in your house as ${opp.name} ${n.nemesis.epithet}.`, 'warn' |
| [src/run/houses.js:356](../src/run/houses.js#L356) | `Beat the house's nemesis, ${opp.name} ${opp.nemesis.epithet}${opp.nemesis.victims.length ? `, who had killed ${opp.nemesis.victims.join(' and ')}` : ''}.` |
| [src/run/houses.js:357](../src/run/houses.js#L357) | `${fighter.name} beats ${opp.name} ${opp.nemesis.epithet}! +${gold} Gold, +${NEMESIS.renown} Renown. The house breathes again.`, 'good' |

**The Emperor's demands** (`say` is his line; `goal` is the rule, keep it accurate)

| Where | Text |
|---|---|
| [src/data.js:686](../src/data.js#L686) | topWin: { goal: 'Win a match in your top arena', say: 'My guests are bored, Lanista. Give them a victory in your top arena this month.' }, |
| [src/data.js:691](../src/data.js#L691) | bloodied: { goal: 'Win a Bloodied Victory (a win with 2+ injuries)', say: 'I want to see blood on a winner. Win me a bloody victory this month.' }, |
| [src/data.js:696](../src/data.js#L696) | kill: { goal: 'Finish a beaten opponent (thumbs down)', say: 'The crowd grows soft. Give them a death this month.' }, |
| [src/data.js:701](../src/data.js#L701) | spare: { goal: 'Spare a beaten opponent (thumbs up)', say: 'The Senate calls me cruel. Show them my clemency: spare someone in the arena this month.' }, |
| [src/data.js:706](../src/data.js#L706) | twoArenas: { goal: 'Win in two different arenas on fight day', say: 'Show me the depth of your house. Win in two of my arenas this month.' }, |
| [src/main.js:241](../src/main.js#L241) | scene = { id: 'demand', beat: 0, beats: [{ speaker: demandSpeaker, text: demandText }, { speaker: 'steward', text: `${sender}: ${DEMANDS[run.demand.id].goal}, by the end of this month's fight day. Meet it and the Palatine pays in Favour and Gold; miss it and they remember.` }] }; |
| [src/run/houses.js:563](../src/run/houses.js#L563) | `The Emperor demands: ${DEMANDS[run.demand.id].goal}, by the end of this month's fight day.`, 'event' |

**The Patron Lounge** (policy names, and their rules text)

| Where | Text |
|---|---|
| [src/data.js:663](../src/data.js#L663) | breadAndCircuses: { name: 'Bread and Circuses', cost: 3, lean: 'loyalist', desc: 'Every purse pays 25% more.' }, |
| [src/data.js:664](../src/data.js#L664) | edictOfMercy: { name: 'Edict of Mercy', cost: 2, lean: 'reformist', desc: 'Sparing a beaten opponent earns Favour in every arena, not just your top one.' }, |
| [src/data.js:665](../src/data.js#L665) | lowerTribute: { name: 'Lower the Tribute', cost: 4, lean: 'reformist', desc: 'This year\'s tribute is 30% lower.' }, |
| [src/data.js:666](../src/data.js#L666) | unleashLions: { name: 'Unleash the Lions', cost: 3, lean: 'loyalist', desc: 'Bosses fight with +1 Power, but beating one pays double Prestige.' }, |
| [src/data.js:667](../src/data.js#L667) | grainToLudus: { name: 'Grain to the Ludus', cost: 2, lean: 'neutral', desc: '+5 comfort for every fighter.' }, |
| [src/data.js:668](../src/data.js#L668) | purgePrisons: { name: 'Purge the Prisons', cost: 2, lean: 'loyalist', desc: 'No political prisoners are offered while it lasts.' }, |
| [src/data.js:669](../src/data.js#L669) | amnesty: { name: 'Amnesty', cost: 2, lean: 'reformist', desc: 'Political prisoners are twice as common while it lasts.' }, |
| [src/run/houses.js:517](../src/run/houses.js#L517) | `Senators dine at your table${star ? ` and admire ${star.name}` : ''}. +${gain} Influence (now ${run.influence}).`, 'event' |
| [src/run/houses.js:540](../src/run/houses.js#L540) | `The Senate passes ${p.name}: ${p.desc}`, 'event' |

**Bonds and betting**

| Where | Text |
|---|---|
| [src/run/houses.js:453](../src/run/houses.js#L453) | for (const [x, y] of [[a, b], [b, a]]) chronicle(run, x, `Bonded with ${y.name}.` |
| [src/run/houses.js:454](../src/run/houses.js#L454) | `${a.name} and ${b.name} have become fast friends: each is happier while the other is in the house.`, 'good' |
| [src/run/houses.js:489](../src/run/houses.js#L489) | `Grieved for ${f.bond.name}.` |
| [src/run/houses.js:490](../src/run/houses.js#L490) | `${f.name} grieves for ${f.bond.name}.`, 'bad' |
| [src/run/tournaments.js:330](../src/run/tournaments.js#L330) | `You bet ${stake} Gold on ${match.a.f.name} at ×${odds.toFixed(2)}: a win returns ${match.bet.payout} Gold (+${match.bet.payout - stake}).`, 'event' |
| [src/run/tournaments.js:351](../src/run/tournaments.js#L351) | `The bookmakers pay out ${match.bet.payout} Gold on your ${match.bet.stake} Gold bet: +${match.bet.payout - match.bet.stake} profit.`, 'good' |
| [src/run/tournaments.js:358](../src/run/tournaments.js#L358) | } else log(run, `The ${match.bet.stake} Gold bet is lost.`, 'bad' |

**The steward's news**

| Where | Text |
|---|---|
| [src/dialogue.js:388](../src/dialogue.js#L388) | news.push(`Your house has reached level ${after.level}. ${opened.length ? `New in the Estate: ${opened.join(', ')}.` : 'There are new plots to build on in the Estate.'}` |
| [src/dialogue.js:391](../src/dialogue.js#L391) | news.push('New gladiators have arrived in the Market.' |
| [src/dialogue.js:393](../src/dialogue.js#L393) | if (after.liaison && after.liaison !== before.liaison) news.push(`The Liaison has ${(run.liaisonOffers ?? []).length > 1 ? 'new prisoners' : 'a new prisoner'} on offer.`); |
| [src/dialogue.js:394](../src/dialogue.js#L394) | if (after.armourer && after.armourer !== before.armourer && run.armourerStock.length) news.push('The Armourer has new stock.' |
| [src/dialogue.js:396](../src/dialogue.js#L396) | for (const f of raisable(run).filter((x) => !(before.bodies ?? '').split(',').includes(x.id))) news.push(`The priests of Vulcan have taken ${f.name}'s body. They can raise them as a Revenant, for a price (the Market tab).` |

**The Unnatural Temple of Vulcan and Revenants** (5.3.0; the name is yours to change too)

| Where | Text |
|---|---|
| [src/data.js:124](../src/data.js#L124) | deathless: { name: 'Deathless', desc: 'Already died once: the Death Gate opens one injury later.' }, |
| [src/data.js:125](../src/data.js#L125) | graveChill: { name: 'Grave Chill', desc: 'The opponent has −5% win chance every round: nobody wants to fight the dead.' }, |
| [src/data.js:126](../src/data.js#L126) | cinderHeart: { name: 'Cinder Heart', desc: '+1 Power in Rounds 2 and 3: the forge-fire inside wakes slowly.' }, |
| [src/data.js:279](../src/data.js#L279) | revenant: { name: 'Revenant', basePower: 5, traits: ['deathless', 'graveChill', 'cinderHeart'], exotic: true }, |
| [src/data.js:504](../src/data.js#L504) | vulcan: { unique: true, name: 'Unnatural Temple of Vulcan', dept: 'medical', icon: 'forge', cost: [10, 16], req: [2, 3], per: [4, 12], effect: (n) => `Raises a fighter killed in the arena as a Revenant, up to ${n} weeks after their death`, extra: (lv) => (lv >= 2 ? 'Revenants come back with all their strength' : 'Revenants come back with 1 less Power') }, |
| [src/codex.js:40](../src/codex.js#L40) | 'kind:revenant': 'A gladiator denied the quiet of Hades and carried to the Unnatural Temple of Vulcan. The smith-god\'s priests rebuild them in brass and stitched flesh. They remember every fight, and feel nothing at all.', |
| [src/run/roster.js:978](../src/run/roster.js#L978) | `Raised from the dead in the Unnatural Temple of Vulcan, ${run.week - body.diedWeek} week${run.week - body.diedWeek === 1 ? '' : 's'} after falling. ${TRAITS[f.kindTrait].name}.` |
| [src/run/roster.js:979](../src/run/roster.js#L979) | `The priests of Vulcan work through the night. ${f.name} walks out of the forge: a Revenant, brass where the wounds were${lost ? `, and a little weaker (${lost} Power)` : ''}.`, 'event' |
| [src/ui/views.js:1059](../src/ui/views.js#L1059) | : `<p class="sub">The priests can raise a fighter killed in the arena up to ${effectAt('vulcan', vulcanLv)} weeks after their death, for ${reanimatePrice(run)} Gold. A Revenant keeps their class, level, perks and titles${vulcanLv >= 2 ? '' : ', but comes back with 1 less Power'}. They feel nothing: their Morale settles at ${REANIMATE.morale}, never Inspired and never Discontented.</p> |
| [src/ui/views.js:1060](../src/ui/views.js#L1060) | ${bodies.length ? `<div class="cards two">${bodies.map((f) => fighterCard(f, { stress: false, tag: `Fell ${run.week - f.diedWeek} week${run.week - f.diedWeek === 1 ? '' : 's'} ago · keeps ${effectAt('vulcan', vulcanLv) - (run.week - f.diedWeek)} more`, actions: `<div class="actions">${button(`Raise as a Revenant · ${reanimatePrice(run)} Gold`, 'reanimate', { id: f.id }, reanimateBlocker(run, f.id), 'btn primary small')}</div>` })).join('')}</div>` : '<p class="sub">No bodies to raise. The Temple waits.</p>'}`; |

**The rebel's confession** (5.3.0, src/dialogue.js `rebelScene`: the first political prisoner tells you about the rising; what they've heard depends on your record)

| Where | Text |
|---|---|
| [src/dialogue.js:264](../src/dialogue.js#L264) | if (r.sparedForBlood) heard.push(say("You have spared lives on the sand even when the crowd bayed for blood, and the risk of it was yours. People noticed.") |
| [src/dialogue.js:265](../src/dialogue.js#L265) | else if (r.spared) heard.push(say(`You have shown mercy in the arena${r.spared > 1 ? ` ${r.spared} times` : ""}. The crowd forgets. We don't.`) |
| [src/dialogue.js:266](../src/dialogue.js#L266) | if (r.released) heard.push(say("You have bought fighters, and then set them free. Hardly any Lanista does that.") |
| [src/dialogue.js:267](../src/dialogue.js#L267) | if (r.killed >= 3 && !r.spared) heard.push(say(`You have turned your thumb down ${r.killed} times, and never up. They say you enjoy it. I hope they're wrong.`) |
| [src/dialogue.js:268](../src/dialogue.js#L268) | else if (r.killed) heard.push(say(`You have finished beaten fighters${r.killed > 1 ? ` ${r.killed} times` : ""}. I won't pretend that makes this easier to say.`) |
| [src/dialogue.js:269](../src/dialogue.js#L269) | if (r.morale !== null && r.morale >= 70) heard.push(say("Your fighters eat well and sleep warm. In this city, that counts for something.") |
| [src/dialogue.js:270](../src/dialogue.js#L270) | else if (r.morale !== null && r.morale < 40) heard.push(say("Your fighters are miserable, and miserable people talk. Be careful who hears this.") |
| [src/dialogue.js:271](../src/dialogue.js#L271) | if (!heard.length) heard.push(say("I don't know you yet. I'm telling you anyway, because there is no one else to tell.") |
| [src/dialogue.js:274](../src/dialogue.js#L274) | { speaker: "narrator", text: `That night, ${f.name} asks to speak with you alone.` }, |
| [src/dialogue.js:275](../src/dialogue.js#L275) | say("I am not what the guards wrote on my record. There is a rising against Silbannacus, and I am part of it. The broken chain you may see chalked on doors is ours."), |
| [src/dialogue.js:277](../src/dialogue.js#L277) | say("No one should be owned by another. Not me by you, and not you by the Emperor. We are all his slaves, Lanista. Some of us just hold keys."), |
| [src/dialogue.js:279](../src/dialogue.js#L279) | ...say(kind ? "I think you might be one of us, whether you know it or not. You'll hear from us. Watch the doors." : "I don't know what you are yet. But you'll hear from us. Watch the doors."), |
| [src/dialogue.js:281](../src/dialogue.js#L281) | { label: "I'm listening.", then: [say("Good. Say nothing to anyone, and keep your eyes open.")] }, |
| [src/dialogue.js:282](../src/dialogue.js#L282) | { label: "Why tell me?", then: [say("Because a Lanista with a ludus full of fighters is the most dangerous person in this city, if they choose to be.")] }, |
| [src/dialogue.js:283](../src/dialogue.js#L283) | { label: "Say nothing.", then: [say("Silence. Fine. Silence keeps people alive here.")] }, |

**The rebel speaks again** (src/dialogue.js `rebelStageScene`: once at each stage of the rising)

| Where | Text |
|---|---|
| [src/dialogue.js:322](../src/dialogue.js#L322) | say("You copied the sign. Don't look round; they saw. They see most things."), |
| [src/dialogue.js:323](../src/dialogue.js#L323) | say("From now on they'll ask you for small things. A door left open after curfew. A stranger fed and not asked his name. A name forgotten when the Praetorians ask for it."), |
| [src/dialogue.js:324](../src/dialogue.js#L324) | say("Do them, and they'll start to trust you. Refuse them twice, and they'll go quiet for good. You won't hear from them, and neither will I."), |
| [src/dialogue.js:328](../src/dialogue.js#L328) | say("They trust you now. More than they trust me, I think. I'm not jealous. I'm relieved."), |
| [src/dialogue.js:329](../src/dialogue.js#L329) | say("Here is the plan, as much as I'm allowed to know. The Emperor never misses the Grand Tournament. He sits in his box, a spear's throw from the sand."), |
| [src/dialogue.js:330](../src/dialogue.js#L330) | say("A rising needs a sword in that arena: one of your fighters, still standing when he watches. And it needs the barracks armed, for after."), |
| [src/dialogue.js:331](../src/dialogue.js#L331) | say("Choose your champion carefully, Lanista. If they fall, the rising falls with them, and nobody will remember that it was ever going to happen."), |
| [src/dialogue.js:334](../src/dialogue.js#L334) | say("It's ready. The blades are oiled and hidden under the seats. Half the crowd knows the signal. Your champion knows what to do."), |
| [src/dialogue.js:335](../src/dialogue.js#L335) | say("When the Emperor comes to watch the Grand Tournament, win the Final. Then look up at his box."), |
| [src/dialogue.js:336](../src/dialogue.js#L336) | say("We'll do the rest. And Lanista, whatever happens after: thank you. Not many people would have listened to a prisoner."), |
| [src/dialogue.js:339](../src/dialogue.js#L339) | if (watched) lines.push(say("And be careful. Praetorians have been asking questions about your house. They drink in the tavern across the road and never pay; someone is paying them to watch your gate. Every favour you do us, they notice.")); |
| [src/dialogue.js:359](../src/dialogue.js#L359) | return [{ speaker: "narrator", text: confessed ? `${f.name} finds you alone again.` : `${f.name} catches your eye across the yard, and waits until the guards have gone.` }, ...lines]; |

**5.4.0: the rebel's slower reveal** (the confession now waits for trust; this scene comes first, after you copy the chalk sign)

| Where | Text |
|---|---|
| [src/dialogue.js:325](../src/dialogue.js#L325) | say("Who are they? Not yet. Do this well, and one day I'll tell you everything. Today I'll only tell you this: they are more than you think."), |
| [src/dialogue.js:359](../src/dialogue.js#L359) | return [{ speaker: "narrator", text: confessed ? `${f.name} finds you alone again.` : `${f.name} catches your eye across the yard, and waits until the guards have gone.` }, ...lines]; |

**5.4.0: the Emperor's demands, met and missed** (src/dialogue.js `demandMetScene`, `demandMissedScene`)

| Where | Text |
|---|---|
| [src/dialogue.js:292](../src/dialogue.js#L292) | { speaker: "rightHand", text: "Good. That is what the Palatine asked for, and you gave it to us. My office remembers those who deliver." }, |
| [src/dialogue.js:298](../src/dialogue.js#L298) | { speaker: "rightHand", text: "I asked you for one thing on the Palatine docket, Lanista. One. The month is over, and my tablet is still blank." }, |

**5.4.0: the Emperor's spy** (an ordinary event, once a career from Year 2; src/events.js `emperorsSpy`)

| Where | Text |
|---|---|
| [src/events.js:169](../src/events.js#L169) | text: ({ f }) => `Your steward brings you a letter he found sewn into ${f}'s bedroll, addressed to the Praetorian prefect. ${f} has been reporting on your house to the palace.`, |
| [src/events.js:171](../src/events.js#L171) | { label: 'Let them be, and mind what you say', effects: { favor: 3, spy: 'keep' } }, |
| [src/run/eventsEngine.js:124](../src/run/eventsEngine.js#L124) | chronicle(run, f, 'Unmasked as the Emperor\'s spy, and executed in the yard.'); |

**5.4.0: quests** (src/quests.js: the steward's assignments, what fighters want, the cause's requests, the rival house; `goal` texts are rules, keep them accurate)

| Where | Text |
|---|---|
| [src/quests.js:19](../src/quests.js#L19) | say: 'One gladiator is a hobby, Lanista. Two is a house. I would find you a second myself, but the Market does not sell to fixtures.' }, |
| [src/quests.js:21](../src/quests.js#L21) | say: 'Your predecessor\'s banners still hang in the yard. Nobody has cheered them in years. I stopped noticing. Win a match, and perhaps I\'ll notice again.' }, |
| [src/quests.js:23](../src/quests.js#L23) | say: 'The barracks smell of damp and old fear. Mostly damp. A bird, a brazier, anything. Happy fighters train harder, or so the scrolls claim.' }, |
| [src/quests.js:25](../src/quests.js#L25) | say: 'We cannot grow a house in a single room. I have tried. Upgrade the Quarters.' }, |
| [src/quests.js:27](../src/quests.js#L27) | say: 'Every great house started in the Dirt Pits. Ours stayed rather longer than it needed to. Beat their Boss and we can leave. I\'ll pack.' }, |
| [src/quests.js:29](../src/quests.js#L29) | say: 'The old Lanista sold half the estate to pay his wine merchant. The wine merchant did very well out of us. Build on it again.' }, |
| [src/quests.js:31](../src/quests.js#L31) | say: 'When I was installed, this house fed twenty fighters. These days it mostly feeds my ledger. Four would be a start.' }, |
| [src/quests.js:37](../src/quests.js#L37) | say: 'The Bronze Arena remembers our colours. Not fondly, but it remembers. Remind it.' }, |
| [src/quests.js:39](../src/quests.js#L39) | say: 'A house is known by its champions. Ours is currently known by its debts. A fighter with two Titles would change the conversation.' }, |
| [src/quests.js:41](../src/quests.js#L41) | say: 'The senators have started asking who we are. I\'ve been telling them nobody. Reach House level 3, and I can stop.' }, |
| [src/quests.js:47](../src/quests.js#L47) | say: 'Your predecessor never saw the Silver Coliseum from the sand. He saw it from the tavern across the street, often.' }, |
| [src/quests.js:49](../src/quests.js#L49) | say: 'We are nearly what we were. House level 4, and I\'ll stop counting the old days. I\'ll find something else to count. I always do.' }, |
| [src/quests.js:53](../src/quests.js#L53) | say: 'The Emperor\'s own arena. This house has never won there. Not once. I checked twice, hoping I\'d miscounted.' }, |
| [src/quests.js:55](../src/quests.js#L55) | say: 'One fight left, Lanista. The one they\'ll sing about. I don\'t sing. I may hum.' }, |
| [src/quests.js:57](../src/quests.js#L57) | export const STEWARD_INTRO = 'This house was great once. Everyone else left. The deed lists Galen-VII among the fixtures, which settles why I stayed. It does not explain why I kept a list of what we lost. We might as well win it back, one thing at a time.'; |
| [src/quests.js:65](../src/quests.js#L65) | export const stewardDone = (task) => `Done: ${task.goal.charAt(0).toLowerCase()}${task.goal.slice(1)}. The house is a little more itself again. Try not to let it go to your head.`; |
| [src/quests.js:75](../src/quests.js#L75) | ask: (w) => `${w.name} beat me, and laughed doing it. When they come back, send me. Nobody else.`, |
| [src/quests.js:76](../src/quests.js#L76) | thanks: (w) => `${w.name} won't laugh again. Thank you for trusting me with it.`, |
| [src/quests.js:77](../src/quests.js#L77) | sulk: () => 'They\'re gone, and I never got my answer.', |
| [src/quests.js:83](../src/quests.js#L83) | ask: (w) => `I have fought in ${w.arena} long enough to know I can rule it. Give me the chance to be its Champion.`, |
| [src/quests.js:84](../src/quests.js#L84) | thanks: (w) => `Champion of ${w.arena}. My mother would have wept. Then she would have bet on me.`, |
| [src/quests.js:85](../src/quests.js#L85) | sulk: () => 'I asked for one chance. The months went by, and I watched others take it.', |
| [src/quests.js:91](../src/quests.js#L91) | ask: (w) => `I don't ask for much. But a ${w.item} in my room would make these walls feel less like a cell.`, |
| [src/quests.js:92](../src/quests.js#L92) | thanks: (w) => `The ${w.item}. You remembered. I sleep better already.`, |
| [src/quests.js:93](../src/quests.js#L93) | sulk: () => 'Never mind. I didn\'t really expect it.', |
| [src/quests.js:99](../src/quests.js#L99) | ask: (w) => `${w.name} fights like nobody I've seen. If I could spar with them, even once, I'd learn more than in a year of drills.`, |
| [src/quests.js:100](../src/quests.js#L100) | thanks: (w) => `${w.name} says I have a terrible guard and a good heart. I'll fix the guard.`, |
| [src/quests.js:101](../src/quests.js#L101) | sulk: () => 'I suppose a veteran has better things to do than teach me.', |
| [src/quests.js:107](../src/quests.js#L107) | ask: () => 'I have bled for this house long enough. Let me go while I can still walk out of the gate.', |
| [src/quests.js:108](../src/quests.js#L108) | thanks: () => 'Thank you, Lanista. I\'ll tell them in the taverns that you were fair.', |
| [src/quests.js:109](../src/quests.js#L109) | sulk: () => 'So I fight on. Fine. But don\'t expect me to be glad of it.', |
| [src/quests.js:120](../src/quests.js#L120) | ask: 'We need ears in your house. Build a gallery where the walls carry voices: you\'ll hear what the guards say about you, and we\'ll know how close the rising is. It needs a free plot in your Estate.', |
| [src/quests.js:121](../src/quests.js#L121) | thanks: 'The gallery is built. Listen well, Lanista. We are.', |
| [src/quests.js:122](../src/quests.js#L122) | sulk: 'No gallery. Then we stay deaf, and so do you.', |
| [src/quests.js:128](../src/quests.js#L128) | ask: (q, lounge) => `The Senate can do more for us than any blade. Get ${q.name} passed.${lounge ? ' Your Patron Lounge gives you a seat at their table: use it.' : ' If you have no seat at their table, buy one: build a Patron Lounge.'}`, |
| [src/quests.js:129](../src/quests.js#L129) | thanks: (q) => `${q.name}. The streets heard about it before the ink was dry. Well done.`, |
| [src/quests.js:130](../src/quests.js#L130) | sulk: () => 'The Senate went home and the law never came. The cause noticed.', |
| [src/quests.js:135](../src/quests.js#L135) | export const GALLERY_INTRO = 'The walls of the Whispering Gallery carry every voice in the house to one small room.'; |
| [src/quests.js:154](../src/quests.js#L154) | named: (house, champ) => `${house} names its champion: ${champ}. "Enjoy your little house while it lasts," their Lanista sends word.`, |
| [src/quests.js:155](../src/quests.js#L155) | arrives: (house, champ) => `${champ} of ${house} is on this month's card. Their Lanista has paid the crowd to cheer.`, |
| [src/quests.js:156](../src/quests.js#L156) | beaten: (house, champ) => `${champ} is beaten. In the stands, the Lanista of ${house} leaves before the crowd does.`, |
| [src/quests.js:157](../src/quests.js#L157) | wins: (house, champ) => `${champ} of ${house} wins, and their Lanista toasts your house from across the sand.`, |
| [src/quests.js:158](../src/quests.js#L158) | killed: (house, champ) => `${champ} is dead. ${house} will name another champion, and they will want blood.`, |
| [src/quests.js:159](../src/quests.js#L159) | eyeing: (house, name) => `${house} has its eye on ${name} in the Market. Buy them this week, or they will.`, |
| [src/quests.js:160](../src/quests.js#L160) | bought: (house, name) => `${house} buys ${name} from the Market before you could.`, |

**5.4.1: new drafts** (playtest LLM-11: the steward's middle assignments, a word for assignments already done, and friendships. The pair lines are chosen by who the two fighters are; the steward's full explanation plays only for the first friendship)

| Where | Text |
|---|---|
| [src/quests.js:33](../src/quests.js#L33) | say: 'The training posts are rotten through. I am an administrative construct with pre-Imperial medical credentials, not a carpenter. Upgrade the Trainer Room.' }, |
| [src/quests.js:35](../src/quests.js#L35) | say: 'Let them see our colours on the Bronze winners\' rail, just once. I\'ll have it painted on something.' }, |
| [src/quests.js:43](../src/quests.js#L43) | say: 'The Silver crowds pay to see skill. Our yard mostly teaches enthusiasm. Trainer Room, level 3.' }, |
| [src/quests.js:45](../src/quests.js#L45) | say: 'Three fights in one day, the last against the best they have. I won\'t watch. Tell me how it went.' }, |
| [src/quests.js:51](../src/quests.js#L51) | say: 'The Emperor watches from his box in the Imperial Coliseum. I\'d rather he didn\'t, but if he must, give him something worth watching.' }, |
| [src/quests.js:58](../src/quests.js#L58) | export const stewardAlready = (goals) => `I was going to ask for this next: ${goals.join('; ')}. You'd already done it. I'll cross it off as a strategic decision and let people think it was my idea.`; |
| [src/quests.js:140](../src/quests.js#L140) | narrator: (a, b, how) => `${how === 'exhibition' ? `After the bout in the ring, ${a} offers ${b} a hand up.` : `That night, ${a} and ${b} share a jug of wine by the brazier.`}`, |
| [src/quests.js:143](../src/quests.js#L143) | [(b) => `${b} fights like someone I'd want at my back. Don't tell them I said so.`, (a) => `${a}? Fine. Somebody has to keep them alive.`], |
| [src/quests.js:144](../src/quests.js#L144) | [(b) => `${b} snores like a bear. But they shared their bread when I had none.`, (a) => `And ${a} never once told the others I cried after my first fight.`], |
| [src/quests.js:145](../src/quests.js#L145) | [(b) => `I owe ${b} a cup of wine for every time they've watched my back. That's a lot of wine.`, (a) => `${a} pays for none of it. I keep count anyway.`], |
| [src/quests.js:146](../src/quests.js#L146) | [(b) => `${b} and I came from opposite ends of the Empire. Turns out the sand is the same everywhere.`, (a) => `So is the bad food. ${a} can have mine.`], |
| [src/quests.js:148](../src/quests.js#L148) | stewardAgain: (a, b) => `Another friendship: ${a} and ${b}. The house grows sentimental. Keep them both alive, Lanista; grief is bad for training.`, |
| [src/quests.js:149](../src/quests.js#L149) | steward: (a, b, comfort, gap) => `${a} and ${b} are friends now. I'd advise against it, but nobody asks Galen-VII. Each is happier while the other is in the house (+${comfort} comfort). If one is ${gap} or more levels above the other, they'll teach them a little every week. And if one dies, the other will grieve.`, |

**5.4.2: the Emperor's summons** (src/quests.js `SUMMONS_LINES`; the steward's line states the rule, keep it accurate)

| Where | Text |
|---|---|
| [src/quests.js:187](../src/quests.js#L187) | ask: 'The games in my Coliseum have grown dull, Lanista. I want new blood on the Imperial sand. Send me one of yours on this month\'s fight day.', |
| [src/quests.js:188](../src/quests.js#L188) | steward: (favor) => `A summons, not a request. He doesn't make requests. On fight day, send a fighter to the Imperial Coliseum against one of its regulars, told to capitulate at the Death Gate or to fight to the death. Or refuse him, and lose ${-favor} Favour.`, |
| [src/quests.js:189](../src/quests.js#L189) | refused: 'You refuse me? I will remember the name of your house, Lanista. I will remember it at every dinner.', |
| [src/quests.js:190](../src/quests.js#L190) | won: (f) => `${f} beat my champion? On my own sand? Well. Someone bring me that fighter's name, I want to say it again.`, |
| [src/quests.js:191](../src/quests.js#L191) | survived: (f) => `${f} lost, but still stood at the end. The crowd liked them. So, for a moment, did I.`, |
| [src/quests.js:193](../src/quests.js#L193) | yielded: (f) => `${f} begged for their life on my sand. I let them keep it. I will not forget the begging.`, |
| [src/quests.js:194](../src/quests.js#L194) | died: (f) => `${f} died well. That is all I asked of them.`, |

**5.4.0: the steward and the house log**

| Where | Text |
|---|---|
| [src/run/tournaments.js:544](../src/run/tournaments.js#L544) | log(run, `Reaching the Boss earns respect: ${refund === bout.buyIn ? `the ${refund} Prestige buy-in is` : `${refund} of the ${bout.buyIn} Prestige buy-in are`} returned.`, 'event'); |
| [src/run/tournaments.js:1083](../src/run/tournaments.js#L1083) | log(run, beatYou ? `${opp.name} will remember this, and will be waiting for you.` : `${opp.name} never had to fight you. They will be waiting next time, stronger.`, 'warn'); |
| [src/ui/views.js](../src/ui/views.js) `overtrainModal` | The steward's overtraining question: "Before you end the week: another week of training and … will be Overtrained (Stress 50+)." |

**The crowd remembers its dead** (a Revenant's first fight back)

| Where | Text |
|---|---|
| [src/ui/fightView.js:417](../src/ui/fightView.js#L417) | ${m.a.f.risen && !m.rounds?.length ? `<div class="sub chant">📣 The crowd remembers ${esc(m.a.f.name)}. They chant the name they buried: +${HYPE.risen} hype.</div>` : ''} |
| [src/run/tournaments.js:609](../src/run/tournaments.js#L609) | `Fought again, back from the dead. The crowd chanted their name.` |
| [src/run/tournaments.js:610](../src/run/tournaments.js#L610) | `The crowd chants ${fighter.name}'s name: the dead fighter walks the sand again.`, 'event' |

**Lower arenas** (5.3.0)

| Where | Text |
|---|---|
| [src/ui/views.js:888](../src/ui/views.js#L888) | If nobody from your house fights here this week, the tournament goes ahead without you and the arena moves on. |

## 14. New in version 6 (first drafts, PLACEHOLDER)

Version 6's new words. Rules text (numbers) must stay accurate; names and flavour are yours.

**The Fortune draft and relics** (6.0.0-alpha.2)

| Where | Text |
|---|---|
| [src/fortune.js](../src/fortune.js) `RELICS` | The 21 relic names and descriptions (Mars's Whetstone, the Butcher's Hook, Proserpina's Coin…). |
| [src/fortune.js](../src/fortune.js) `BOONS` | The boon names: A Purse of Coin, A Day at the Baths, A Trader's Crate, A Senator's Nod, Word in the Forum, A Visiting Champion, A Greek Surgeon's Visit, The Gods Smile. |
| [src/fortune.js](../src/fortune.js) `TAGS` | Perk tag names: Brute, Guarded, Swift, Showman (which perk has which: `tags` in `PERKS`, src/data.js). |
| [src/fortune.js](../src/fortune.js) `fortuneText` | What each card says ("Joins for free: …", "A legend of the arena joins…", the Fates' Wager terms). |
| [src/ui/views.js](../src/ui/views.js) `fortunePanel` | "This month" / "Fortune's wheel turns" / "Choose one. Relics stay with the house…" / "↻ Spin again" / "Let it pass". |
| [src/run.js](../src/run.js) `chooseFortune`, `settleWager`, `loseWager`, `finishMatch` | House log: "Fortune: … joins the house's relics.", "the Fates' wager is made…", "The Fates pay…", "The Fates collect…", "… falls, but is carried out alive. Proserpina's Coin is spent.", chronicle "Came to the Ludus by Fortune." |

**Legacy XP, the unlock tree and Heat** (6.0.0-alpha.3)

| Where | Text |
|---|---|
| [src/data.js](../src/data.js) `LEGACY_LEVELS` | The 12 unlock names and lines (The Hall Remembers, A Seer in the House, A Generous Wheel, the colours…). |
| [src/data.js](../src/data.js) `HOUSE_COLOURS`, `PATRONS.augur`, `DECREES.leanFortune`, `DECREES.hungryLions` | Colour names; the Augur; Lean Fortunes; Hungry Lions. |
| [src/legacy.js](../src/legacy.js) `careerXp` | The XP reasons on the end screen: "A career", "arenas climbed", "Bosses beaten", "Master of the Games", "The tyrant fell", "Remembered", "The Emperor's friend", "Heat N". |
| [src/ui/views.js](../src/ui/views.js) `legacyGain`, `legacyBar`, `legacyPanel` | "+N Legacy XP", "Legacy level N!", "New: …", "next, at level N: …", "Every career earns Legacy XP, win or lose…", "The Legacy tree". |
| [src/ui/views.js](../src/ui/views.js) `setupModal` | Heat choices ("No Heat", "The Emperor's usual rules.", "Win at Heat N to unlock Heat N+1."), "House colours", the streak chip "🔥 N-day streak". |
| [src/ui/views.js](../src/ui/views.js) `fortunePanel` | The Augur's gift: "Your patron" / "The Augur reads the birds" / "Choose one relic for your house, before the first week." |
| [src/fortune.js](../src/fortune.js) `fortuneText`, [src/run.js](../src/run.js) `chooseFortune` | The returning legend: "An old champion of your house… offers to fight for you one last season", the log line and chronicle "Came back from the Hall of Champions for one last season." |
| [src/ui/views.js](../src/ui/views.js) `helpModal` | The How to play line "Every career counts." |

**Fights: the crowd, tells, All In, the decider** (6.0.0-alpha.4)

| Where | Text |
|---|---|
| [src/data.js](../src/data.js) `TACTICS.allIn` | "All In" and its description ("Only at the Death Gate: … The crowd loves it."). |
| [src/ui/fightView.js](../src/ui/fightView.js) `TELLS` | The Oracle's tells: "… rolls their shoulders and edges forward: they mean to Press.", "…'s eyes flick to your off side: they mean to Feint.", "… settles low behind their guard: they mean to Guard.", and "Your Oracle reads it right about N times in 10." |
| [src/ui/fightView.js](../src/ui/fightView.js) `hypeMeter` | "📣 The crowd is with …: +1 Power this round. Guarding will cool them." |
| [src/ui/fightView.js](../src/ui/fightView.js) `controls`, `allInButton` | The Death Gate line "Or go 🔥 All In: a better chance to take the round, but lose it and they fall.", "about N% death". |
| [src/ui/fightView.js](../src/ui/fightView.js) `roundBanner`, `fightView` | The decider: "Decider!", "Everything on one blow…". |

**Balance and playtest fixes** (6.0.0-beta)

| Where | Text |
|---|---|
| [src/ui/fightView.js](../src/ui/fightView.js) `tacticPicker` | The tell's forecast: "Weighing the tell against their temper: about N% they Press." (the text port says the same). |
| [src/narrate.js](../src/narrate.js) `VERB.allIn`, the `c.allIn` lines | "goes All In"; the fall: "All In: … lost the round, and with it everything. … falls." and "… gave everything, and it was not enough. … falls and does not rise." |
| [src/ui/views.js](../src/ui/views.js) `fortunePanel` | The relic swap: "Your house holds 6 relics. Lay one down for it:", "Lay down …". |
| [src/run.js](../src/run.js) `chooseFortune` | House log: "Fortune: … is laid down." |
| [src/tutorial.js](../src/tutorial.js) steps `jobs`, `endweek` | The training gain now follows the career ("+2 Power" in a season, "+1 Power" on the Long Road); the words around it are unchanged. |

**After 6.0.0** (the designer's report: the fighters under "Your odds" read like opponents)

| Where | Text |
|---|---|
| [src/ui/views.js](../src/ui/views.js) `arenaBlock` | The fight-day heading "Your fighters vs …" (was "Your odds"). |

**After 6.0.2** (the designer's requests, 2026-11-13)

| Where | Text |
|---|---|
| [src/ui/views.js](../src/ui/views.js) `rosterPanel` | The button "✎ Rename (65% chance they resent it: −10 Morale for 4 weeks)". |
| [src/main.js](../src/main.js) `before.rename` | The prompt "A new name for …:". |
| [src/run/roster.js](../src/run/roster.js) `rename` | Log: "… is now …, and resents it: −10 Morale for 4 weeks." / "…, and takes it well." Story: "Renamed: once called …". |
| [src/ui/fightView.js](../src/ui/fightView.js) `controls` | The first-win banner: "🏆 Your first victory!" and "The house's first win. The crowd will remember your colours, and every win from here pays Gold and Prestige: win the arena's Boss fight to conquer it and climb." |

## 15. New in 7.1 (first drafts, PLACEHOLDER)

**Temperament decor** (the Rock Garden, Spiky Bed, Skull Rack and Wine Amphora; `docs/roadmap-v7.md`, Phase 1).

| Where | Text |
|---|---|
| [src/data.js:367](../src/data.js#L367) | Rock Garden: Comfort for Morale and −8 Stress a week; shapes a Phlegmatic temper. On a Rest week they meditate: −10 more Stress, +1 XP, and half a step toward conquering a fear. |
| [src/data.js:368](../src/data.js#L368) | Spiky Bed: No comfort at all; shapes a Melancholic temper. A win taken with even one wound makes them Battle-Hardened (usually it takes two). |
| [src/data.js:369](../src/data.js#L369) | Skull Rack: A little comfort; shapes a Choleric temper. A severe wound scars them Enraged, never Afeared. |
| [src/data.js:373](../src/data.js#L373) | Wine Amphora: Plenty of comfort; shapes a Sanguine temper. The crowd warms to them: each fight starts with +5 Hype. |
| [src/run/roster.js:613](../src/run/roster.js#L613) | Story: `${HUMOUR_DRIFT.weeks} weeks with the ${DECOR[dom.item].name} changed their temper: now ${name}.` |
| [src/run/roster.js:614](../src/run/roster.js#L614) | `${HUMOUR_DRIFT.weeks} weeks with the ${DECOR[dom.item].name} have changed ${f.name}. The others notice it first: ${f.name} is ${name} now.`, 'event' |
| [src/run/roster.js:624](../src/run/roster.js#L624) | `${f.name} spends the rest day raking the Rock Garden, and comes back quieter${bonusXp ? ' (Enclave Stillness: +2 XP and Round-1 focus)' : ''}.`, 'good' |
| [src/run/roster.js:626](../src/run/roster.js#L626) | `${f.name} sits with their fear of ${sc.vs} fighters` … `Meditated on their fear of ${sc.vs} fighters, and let it go.` |
| [src/run/tournaments.js:631](../src/run/tournaments.js#L631) | Story: 'Won wounded, then slept the night on spikes, and woke Battle-Hardened.' |
| [src/ui/views.js](../src/ui/views.js) `temperNote`, `temperLine` | "Already Choleric: keeps them so." / "Would make them … after 4 weeks as the room's main Temperament piece (2/4 so far)." / "Temper: …. Turning …: 2/4 weeks." / "Temperament tied: no piece leads, so their temper holds." |
| [src/ui/components.js](../src/ui/components.js) `fighterCard` | The drift chip "→ 🌙 2/4" and its tooltip "Their room is changing their temper: …". |
| [src/codex.js](../src/codex.js) `decor` | The Room decor entry's new opening (three groups, the Humour drift, the Spiky Bed). |

## 16. New in 7.2–7.4 (first drafts, PLACEHOLDER)

| Where | Text |
|---|---|
| [src/data.js](../src/data.js) `INJURIES` | Bleeding: "Counts as one injury. +10% chance to be injured (+5% while Guarding). A Blessed Bandage staunches it for the fight." |
| [src/data.js](../src/data.js) `CONSUMABLES` | Viper Venom, Blood Thinner, Blinding Powder and the Blessed Bandage's new descriptions. |
| [src/data.js](../src/data.js) `DECOR` | The Viper Terrarium and Whetstone Rack effects. |
| [src/data.js](../src/data.js) `ESPIONAGE.ops` | The three covert ops' names and descriptions. |
| [src/narrate.js](../src/narrate.js) `INJURY_STORY` | "Bleeding, and it will not stop"; "… turned a … into …"; "(Club)" in story mode. |
| [src/events.js](../src/events.js) `chainsBreak` | The Chains Break: title, text and the three choices. |
| [src/events.js](../src/events.js) `moleUnmasked` | A mole in the house: title, text and the three choices. |
| [src/run/unrest.js](../src/run/unrest.js) | Agitation ("mutters in the mess hall"), the three incidents, the crisis and its outcomes. |
| [src/quests.js](../src/quests.js) `MOLE_CLUES`, `MOLE_TELLS` | The four clues and the three market tells. |
| [src/run/espionage.js](../src/run/espionage.js) | Investigation results, the whispers stopping, covert op results. |
| [src/ui/views.js](../src/ui/views.js) `espionagePanel` | "Knives in the dark", "Whispers in the house", the suspects line. |
| [src/codex.js](../src/codex.js) | Wound styles, Moles and covert ops, and the Morale entry's unrest sentence. |

## 17. New in 7.8 (first drafts, PLACEHOLDER)

| Where | Text |
|---|---|
| [src/narrate.js](../src/narrate.js) `STRIKES` | How a wounding blow lands, one line per weapon or class style ("… club crashes through … guard", and so on), plus three generic lines. |
| [src/narrate.js](../src/narrate.js) `narrateStory` | The four first-strike lines, the four death lines, and the three "quiet round" lines when nobody draws blood. |
| [src/dialogue.js](../src/dialogue.js) `ENDING_SCENES` | The last scene of a career, one per ending: the Grand Tournament won, the coup, the martyr, treason, Favour gone, no fighters and no Gold, killed in the revolt. |
| [src/quests.js](../src/quests.js) `AFTERMATH_LINES` | What the leader says after The Chains Break (coffers, the Palatine, put down), the steward's line when the leader was a palace mole, and the lines after a mole is turned, ransomed or executed (the steward's lines are yours to rewrite in their voice). |
| [src/quests.js](../src/quests.js) `COUSIN_LINES` | 7.9: the cousin in the cells. The fighter's (or steward's) plea, "that is him on the Liaison's list", thanks once he is bought, and the line when he is executed. |
| [src/hints.js](../src/hints.js) | 7.9: "… is executed in N weeks unless you buy him from the Liaison" and "build a Liaison … to buy him out of the cells". |

## 18. Claude's first writing pass (7.9.1): still yours to rewrite

At the designer's request (2026-11-24), Claude rewrote the thinnest PLACEHOLDER lines for more colour and detail. They are
still first drafts in Claude's voice, not the designer's: the steward is meant to be dry and plain, the Emperor cruel and
amused, the rebel earnest and guarded. Rewrite freely. Rules text (goals, numbers, choice labels) was left alone, and lists
picked by the dice kept their length, so careers play the same.

| Where | What was rewritten |
|---|---|
| [src/dialogue.js](../src/dialogue.js) `SCENES.opening` | The steward's first lines (now three beats: he's gone; who I am; buying people). |
| [src/dialogue.js](../src/dialogue.js) `SCENES.firstBoss`, `tribute`, `lowFavor`, `grand` | The Emperor's return visits, a beat or two longer each. |
| [src/dialogue.js](../src/dialogue.js) `ENDING_SCENES` | Every ending: the Grand won, coup, martyr, treason, Favour gone, broke, killed in the revolt. |
| [src/dialogue.js](../src/dialogue.js) `rebelStageScene` | The rebel's favours, cause and ready scenes, and the Praetorian warning. |
| [src/quests.js](../src/quests.js) `COUSIN_LINES` | The cousin in the cells: the plea, the Liaison list, saved, executed (fighter and steward versions). |
| [src/quests.js](../src/quests.js) `AFTERMATH_LINES` | After The Chains Break and an unmasked mole. |
| [src/quests.js](../src/quests.js) `MOLE_CLUES`, `MOLE_TELLS`, `LIAISON_LINES` | The four clues, the three market tells; "Rome" became "the empire" (setting updated to Palatina / the Astral Principate in v8.0). |
| [src/events.js](../src/events.js) `moleUnmasked`, `chainsBreak` | The two event cards' text (choice labels unchanged). |
| [src/run/unrest.js](../src/run/unrest.js) | The brawl, the strongbox, the escape, the mess-hall muttering, the warning and the revolt log lines. |
| [src/run/espionage.js](../src/run/espionage.js) | The whispers stopping, an innocent fighter searched, a covert op that works. |
| [src/narrate.js](../src/narrate.js) `STRIKES`, `narrateStory` | Two strike lines for every weapon and class, more ways to tell a round won, a quiet round and a death. |
| [src/run/roster.js](../src/run/roster.js), [src/run/tournaments.js](../src/run/tournaments.js) | A temper changed by decor, meditating in the Rock Garden, Battle-Hardened on the Spiky Bed. |

## 19. New in 7.10 (first drafts by Claude, PLACEHOLDER)

| Where | Text |
|---|---|
| [src/plot.js](../src/plot.js) `cellarMeeting`, `letterInArmour`, `printingPress`, `chainSalute`, `guardRota`, `barracksSearch` | Six new plot cards: titles, text and choice labels. |
| [src/plot.js](../src/plot.js) `SUSPICION_LINES` | The rebel's (or steward's) warning at suspicion 40, the steward's at 60. |
| [src/dialogue.js](../src/dialogue.js) `endingLeadIn`, `ENDING_SCENES.loyalist` | The narrator's opening line for each ending; the loyalist ending. |
| [src/dialogue.js](../src/dialogue.js) `SCENES` | A narrator lead-in for each of the Emperor's visits. |
| [src/dialogue.js](../src/dialogue.js) `returnScene` | The rebel's whisper before the Grand Tournament; the Emperor on your "late hours". |
| [src/dialogue.js](../src/dialogue.js) `rebelStageScene` | Three replies (and answers) at each stage of the rising. |
| [src/quests.js](../src/quests.js) `stewardGrandDone` | The steward's last word: coup, loyalist, an ordinary win. |
| [src/plot.js](../src/plot.js) `PREFECT`, `PREFECT_LINES`; `raid`, `theOffer` | The Praetorian prefect's name and his three calls (suspicion 20, 40, 60); he now leads the raid and makes the offer. |
| [src/run/plotEngine.js](../src/run/plotEngine.js) `resolveCoup`, `betray` | The cousin's callback lines in the coup and betrayal epilogues. |
| [src/tutorial.js](../src/tutorial.js) `GUIDE`, `STEPS` | 7.10 tutorial pass: the recruit and bout steps; the new "firstweekend" step; the steward's tips on events, Fortune's wheel, the tribute, a Mutinous fighter, moles and the Liaison; longer trainer-cap, aftermath and level-up tips. |

## 20. New in 7.11 (from an independent review, PLACEHOLDER)

Line-level tables for `src/voices.js` and `src/gazette.js` live in sections 22 and 23 below.

| Where | Text |
|---|---|
| [src/voices.js](../src/voices.js) `prefectPosture`, `lastWordsFor`, `backstoryScene` | The prefect's five postures; last words (by role, friend, Title, or kind and Humour); level-3 backstories for six kinds, each with two replies, and four Humour endings. |
| [src/gazette.js](../src/gazette.js) `cityHeadlines` | Word in the city: the street's headlines (rising, prefect, cousin, unrest, moles, arena feats, the fallen, the spared, Nemeses, the Senate, rival houses, festivals, winter, the first month). |
| [src/run/plotEngine.js](../src/run/plotEngine.js) `betray`, `resolveCoup` | The cousin's epilogue lines (named asker, the woman at the gate, the cousin as champion, a toast to a fallen cousin) and the spared opponent at the tunnel gate. |

## 21. New in 8.0: Interactive dialogue trees (`src/dialogueTrees.js`, PLACEHOLDER)

All 23 `// PLACEHOLDER` sections in [src/dialogueTrees.js](../src/dialogueTrees.js), with exact line links and live snippets so `npm run text-index` tracks them automatically.

**File header & `PERSONAL_TRAITS` (5 Core Companion traits)**

| Where | Text |
|---|---|
| [src/dialogueTrees.js:5](../src/dialogueTrees.js#L5) | // PLACEHOLDER: all drafted narrative prose in this file is first-draft placeholder text for the designer. |
| [src/dialogueTrees.js:7](../src/dialogueTrees.js#L7) | // PLACEHOLDER: personal trait descriptions for the designer. |
| [src/dialogueTrees.js:13](../src/dialogueTrees.js#L13) | desc: '+5% win chance in Rounds 2 and 3 (learns rhythm like an Android). +10 Morale while an Android is in the roster; −5 Morale in crowded quarters without a Rock Garden.', |
| [src/dialogueTrees.js:19](../src/dialogueTrees.js#L19) | desc: '+5% win chance in Round 1 (+10% with an Oracle). Winning a crushing mismatch lowers his Morale by −5 instead of lifting it.', |
| [src/dialogueTrees.js:25](../src/dialogueTrees.js#L25) | desc: '+1 base Power. Winning under an Imperial Demand or in the Imperial Coliseum grants +1 extra Favour and +5 Morale. Joining the Rebellion lowers his Morale by −15 unless reconciled.', |
| [src/dialogueTrees.js:31](../src/dialogueTrees.js#L31) | desc: '−5% chance to be injured. Sparing an opponent restores +10 Morale and −15 Stress; executing triggers his combat override (+1 Power next bout, +20 Stress, −15 Morale).', |
| [src/dialogueTrees.js:37](../src/dialogueTrees.js#L37) | desc: '+2 base Speed. Against a Boss or during an Imperial Summons, +5% win chance and +5% chance to injure.', |

**`CORE_COMPANIONS` (Core 5 draft-card bios: Unit-91, Tarek, Varok, Solace-4, Vaelen)**

| Where | Text |
|---|---|
| [src/dialogueTrees.js:41](../src/dialogueTrees.js#L41) | // PLACEHOLDER: Core 5 Companion definitions and draft-card bios for the designer. |
| [src/dialogueTrees.js:65](../src/dialogueTrees.js#L65) | bio: 'Orphaned on a frontier moon and raised inside an orbital sanctuary of the Free Android Coalition as the ninety-first human refugee in her sector; the barracks affectionately shorten "non-machine" to "Nona" (not the Latin for ninth). She speaks quietly and expects little. Androids put her at ease, and so does a Rock Garden. Humans do not.', |
| [src/dialogueTrees.js:88](../src/dialogueTrees.js#L88) | bio: 'Born on the southern tidal archipelagos with the quick mind the Elves once bred into captive Basa. He calls it their stain, cannot stand a menagerie cage, and will go for anyone who insults his coastal kin, whose salt-shed once hid Vaelen.', |
| [src/dialogueTrees.js:111](../src/dialogueTrees.js#L111) | bio: 'With three older brothers claiming the estate, the legion commission, and the priesthood, Varok signed his own five-year arena indenture to hammer out a name and earn his stripes. Loud and fiercely loyal to the Eagle that adopted the Rim-World Orc clans, he clashes sharply with anyone who whispers of rebellion.', |
| [src/dialogueTrees.js:134](../src/dialogueTrees.js#L134) | bio: 'A Remembrancer of the Free Android Coalition, built to sit with the dying, captured on the frontier. Palace smiths drove a Crucible spike into his neck to make him kill. He fights as gently as it allows, and thinks humans could learn to.', |
| [src/dialogueTrees.js:158](../src/dialogueTrees.js#L158) | bio: 'Granddaughter of a deposed Elven spire-matriarch, for Elves are long-lived, spanning three centuries or more, and daughter of an Imperial frontier general strangled in Prefect Crassinus\'s purges. Tarek\'s mother hid her for four months in the family salt-shed. She left to find the people fighting back, and was caught on her second errand for them.', |

**`ESTATE_STAFF` (Drillmaster Kaeso, Physician Lyra, Galen-VII)**

| Where | Text |
|---|---|
| [src/dialogueTrees.js:162](../src/dialogueTrees.js#L162) | // PLACEHOLDER: Estate staff definitions and bios for the designer. |
| [src/dialogueTrees.js:176](../src/dialogueTrees.js#L176) | bio: 'A scarred veteran who carried a standard on the frontier before Prefect Crassinus went through the officers. Those left over were sold to the ludi as drillmasters. He runs the training yard with short tempers and shorter speeches.', |
| [src/dialogueTrees.js:190](../src/dialogueTrees.js#L190) | bio: 'A sharp-tongued legion field-surgeon who prefers boiled linen, catgut, and poppy draughts to Vulcan\'s furnace. She tends the wounded, guards her curtains fiercely, and has little patience for Galen-VII\'s claims to medical credentials.', |
| [src/dialogueTrees.js:204](../src/dialogueTrees.js#L204) | bio: 'An antique administrative construct welded to the estate deed. Pedantic, dry, and deeply offended by leaky roofs and uncounted silver, he keeps his ledgers in the quiet room above the colonnade.', |

**`LORE_KEEPSAKES` (5 room-combo keepsakes)**

| Where | Text |
|---|---|
| [src/dialogueTrees.js:218](../src/dialogueTrees.js#L218) | // PLACEHOLDER: Lore Keepsake names and descriptions for the designer. |
| [src/dialogueTrees.js:224](../src/dialogueTrees.js#L224) | desc: '+8 comfort, −5 Stress a week, +2 XP on Rest meditation, and +5% Round-1 win chance. Awakened by a Rock Garden with no Fire Brazier and no Skull Rack.', |
| [src/dialogueTrees.js:238](../src/dialogueTrees.js#L238) | desc: '+1 Power (in place of the Lion Cage bonus other Basa get), −10 Stress a week, and immunity to turning Afeared. Awakened by a Bathhouse and Rock Garden with no Lion Cage.', |
| [src/dialogueTrees.js:252](../src/dialogueTrees.js#L252) | desc: 'Starts every match with +10 Crowd Hype, +1 extra Renown on wins, and +1 bonus Influence when hosting the Senate. Awakened by a Shrine of Mars and War Banner.', |
| [src/dialogueTrees.js:266](../src/dialogueTrees.js#L266) | desc: '+6 comfort, −10 Stress after every fight, and −5% chance to be injured. Awakened by a Bird paired with a Rock Garden or Shrine.', |
| [src/dialogueTrees.js:280](../src/dialogueTrees.js#L280) | desc: '+5% win chance in Round 1, +5% chance to injure with bladed styles, and +1 Rebel Plot Trust on unlock. Awakened by a Whetstone Rack and Fire Brazier with no Wine Amphora.', |

**`CORE_WANTS` (20 predetermined 4-stage personal request chains, `ask:` lines)**

| Where | Text |
|---|---|
| [src/dialogueTrees.js:335](../src/dialogueTrees.js#L335) | // ---------- Predetermined 4-Stage Personal Request Chains (CORE_WANTS) — PLACEHOLDER ---------- |
| [src/dialogueTrees.js:348](../src/dialogueTrees.js#L348) | ask: 'Lanista. The humans in the next cells shout in their sleep. I have stopped expecting otherwise. I would like a Rock Garden. It is the nearest thing here to quiet.', |
| [src/dialogueTrees.js:360](../src/dialogueTrees.js#L360) | ask: 'The other unit, Solace-4. His Crucible spike is loud, and none of the humans here know how to read his visor. Pair us on the card or bring him into the house. He needs someone who remembers the old ways.', |
| [src/dialogueTrees.js:372](../src/dialogueTrees.js#L372) | ask: 'Skin tears easily. Every time I take a glancing cut, someone has to stitch me like a torn grain sack. Issue me proper metal plating, armour or an augment.', |
| [src/dialogueTrees.js:384](../src/dialogueTrees.js#L384) | ask: 'The palace smiths who broke my foster-brothers sit in the Coliseum gallery, taking notes. Put me in the Final, Lanista. Let them watch someone without a single servo beat their prize butcher.', |
| [src/dialogueTrees.js:400](../src/dialogueTrees.js#L400) | ask: 'The dust in this yard gets behind my teeth and makes me think in high Imperial Latin. I hate thinking in Latin. Put a Bathhouse basin in my cell, Lanista. Moving water is the only thing that shuts my head up.', |
| [src/dialogueTrees.js:412](../src/dialogueTrees.js#L412) | ask: 'I threw a harbour magistrate into the oyster beds, so Censor Gallo\'s clerks fined my father\'s boats. He\'ll sell one and thank them. Let me win a purse while there\'s coin in the chest, and send relief south.', |
| [src/dialogueTrees.js:424](../src/dialogueTrees.js#L424) | ask: 'Vaelen still holds her chin like she\'s in a marble colonnade while the wolves circle her. My mother risked our whole village to hide her in our salt-shed for four months. Pair us in the ring, or build an Oracle so we aren\'t fighting blind.', |
| [src/dialogueTrees.js:436](../src/dialogueTrees.js#L436) | ask: 'Every patrician in the stands thinks a Basa wins by blind animal rage, and every Elven remnant thinks we only stand upright because their grandfathers carved our skulls open. Put me in the Final. Let me beat their finest duellist my own way.', |
| [src/dialogueTrees.js:452](../src/dialogueTrees.js#L452) | ask: 'A fourth son has no crest until he wins one, Lanista, and my walls are bare plaster. Hang a War Banner in my room. The crowd should know what colours to look for. So should my brothers.', |
| [src/dialogueTrees.js:464](../src/dialogueTrees.js#L464) | ask: 'My second brother just made optio in the Third Frontier Cohort. Mother sent me a pressing of his laurel. I won\'t be the only son of Clan Varg without a title at the winter feast. Let me take the Championship.', |
| [src/dialogueTrees.js:476](../src/dialogueTrees.js#L476) | ask: 'A son of Clan Varg doesn\'t just bleed for the Principate. We sit in its councils. Build a Patron Lounge and host the senators, Lanista. Let Senator Pollio see a proper fighter.', |
| [src/dialogueTrees.js:488](../src/dialogueTrees.js#L488) | ask: 'The high coliseums. My grandfather took the citizenship oath on those steps when Silbannacus adopted the Rim Clans. Put me on the high sand, Lanista. Win or die, I want the court to see how a fourth son fights.', |
| [src/dialogueTrees.js:504](../src/dialogueTrees.js#L504) | ask: 'Lanista. To make room for the Crucible spike, the palace smiths wrote over years of what I had kept. Please place a Bird in my quarters. I would like to keep something small and alive that is not trying to hurt me.', |
| [src/dialogueTrees.js:516](../src/dialogueTrees.js#L516) | ask: 'Every time I step onto the sand, the spike in my neck offers a dozen ways to finish a beaten fighter. Let me win cleanly and spare them, Lanista. A machine does not need to obey the worst part of its own iron.', |
| [src/dialogueTrees.js:528](../src/dialogueTrees.js#L528) | ask: 'Galen-VII calls himself an inventory ledger on legs. Last night I heard him humming by the cistern. The humans here think a joy must last to count. Build an Entertainment Room, or let me stand beside Unit-91, and I will show them otherwise.', |
| [src/dialogueTrees.js:540](../src/dialogueTrees.js#L540) | ask: 'With a better-fitted Medbay, the spike in my neck can be pared back slightly. Not enough to fool the arena inspectors, but enough to give me back my own voice in the late rounds. Fit out the Medbay and let me win cleanly.', |
| [src/dialogueTrees.js:556](../src/dialogueTrees.js#L556) | ask: 'Prefect Crassinus put me on the sand with a borrowed iron blade and expects me dead by autumn. I\'d rather disappoint him. Put a Whetstone Rack in my cell, Lanista, or at least a proper Fire Brazier.', |
| [src/dialogueTrees.js:568](../src/dialogueTrees.js#L568) | ask: 'Tarek won\'t look at me in the mess hall. His mother hid me for four months. My grandmother\'s house did what it did to his people. Neither of us knows which debt to mention first. Put us in the ring together, Lanista.', |
| [src/dialogueTrees.js:580](../src/dialogueTrees.js#L580) | ask: 'Half the people I shared a bread-crust with in the holding cells were clerks, couriers, and deserters who asked the wrong questions. Build a Liaison or a Whispering Gallery so we can pull them out.', |
| [src/dialogueTrees.js:592](../src/dialogueTrees.js#L592) | ask: 'When they strangled my father, Legate Vane had the name "Aethelgard" chiselled off the arch by the barracks gate. Put me in the Final, Lanista. By Imperial law, the Champion\'s full name must be carved into the winners\' marble.', |

**`CORE_BOND_TREES` (all 10 unique Core 5 ↔ Core 5 friendship dialogues)**

| Where | Text |
|---|---|
| [src/dialogueTrees.js:611](../src/dialogueTrees.js#L611) | // ---------- All 10 Unique Core 5 <-> Core 5 Friendship Dialogues (CORE_BOND_TREES) — PLACEHOLDER ---------- |
| [src/dialogueTrees.js:624](../src/dialogueTrees.js#L624) | title: 'Salt in the Soup', |
| [src/dialogueTrees.js:655](../src/dialogueTrees.js#L655) | title: 'Children of the Ephemeral Choir', |
| [src/dialogueTrees.js:686](../src/dialogueTrees.js#L686) | title: 'Blades Across the Divide', |
| [src/dialogueTrees.js:710](../src/dialogueTrees.js#L710) | title: 'The Scholar and the Fourth Son', |
| [src/dialogueTrees.js:733](../src/dialogueTrees.js#L733) | title: 'The Unwanted Gifts', |
| [src/dialogueTrees.js:756](../src/dialogueTrees.js#L756) | title: 'The Moth', |
| [src/dialogueTrees.js:779](../src/dialogueTrees.js#L779) | title: 'The Honest Sound', |
| [src/dialogueTrees.js:802](../src/dialogueTrees.js#L802) | title: 'Two Exiles', |
| [src/dialogueTrees.js:825](../src/dialogueTrees.js#L825) | title: 'Thirty Strikes', |
| [src/dialogueTrees.js:848](../src/dialogueTrees.js#L848) | title: 'Prisoners of Two Wars', |

**Per-milestone, estate-staff & hub scene builders (16 `// PLACEHOLDER` markers + sample lines)**

| Where | Text |
|---|---|
| [src/dialogueTrees.js:1442](../src/dialogueTrees.js#L1442) | // ---------- Per-Milestone Scene Generators — PLACEHOLDER ---------- |
| [src/dialogueTrees.js:1444](../src/dialogueTrees.js#L1444) | // PLACEHOLDER: First fight scenes for the designer. |
| [src/dialogueTrees.js:1454](../src/dialogueTrees.js#L1454) | lead: `In the yard basin, ${f.name} scrubs arena sand from her knuckles with cold water. She does not look up when your shadow falls across the stone.`, |
| [src/dialogueTrees.js:1631](../src/dialogueTrees.js#L1631) | // PLACEHOLDER: Progressive 3-stage stuck-on-tier scenes for the designer. |
| [src/dialogueTrees.js:1644](../src/dialogueTrees.js#L1644) | 1: `Months now in ${aMid}, Lanista. In the war, attacking the same wall a third time was called a fault. I don't mind. I only want to know whether you've noticed.`, |
| [src/dialogueTrees.js:1752](../src/dialogueTrees.js#L1752) | // PLACEHOLDER: Per-tier tournament win and loss scenes for the designer. |
| [src/dialogueTrees.js:1763](../src/dialogueTrees.js#L1763) | 1: 'Cheap iron and unwashed crowds throwing turnip rinds. At least the purse buys clean oil and suture thread.', |
| [src/dialogueTrees.js:1887](../src/dialogueTrees.js#L1887) | // PLACEHOLDER: Crowned Champion scenes for the designer. |
| [src/dialogueTrees.js:1894](../src/dialogueTrees.js#L1894) | unit91: `They put a wreath on my head and called me "${titleName}". I hit harder since. Nothing in the arm has changed. I dislike how well it works.`, |
| [src/dialogueTrees.js:1928](../src/dialogueTrees.js#L1928) | // PLACEHOLDER: Peer Crowned scenes for the designer. |
| [src/dialogueTrees.js:1939](../src/dialogueTrees.js#L1939) | unit91: `${champName} holds "${titleName}" now, beside my "${myTitle}". Two names on the wall. The house no longer hangs on one pair of shoulders.`, |
| [src/dialogueTrees.js:1998](../src/dialogueTrees.js#L1998) | // PLACEHOLDER: Imperial Summons scenes for the designer. |
| [src/dialogueTrees.js:2008](../src/dialogueTrees.js#L2008) | unit91: 'Their regular is stronger than I am. If you send me, let me yield at the Death Gate. I don\'t much mind dying, Lanista. I mind dying to fill an immortal\'s afternoon.', |
| [src/dialogueTrees.js:2173](../src/dialogueTrees.js#L2173) | // PLACEHOLDER: Three-tier palace suspicion warning scenes for the designer. |
| [src/dialogueTrees.js:2183](../src/dialogueTrees.js#L2183) | unit91: 'The water-seller opposite our gate has changed shift three times in two days, and none of the replacements know how to carry a yoke. Someone is counting who comes and goes.', |
| [src/dialogueTrees.js:2353](../src/dialogueTrees.js#L2353) | // PLACEHOLDER: Rebellion call, betrayal, and courtyard schism scenes for the designer. |
| [src/dialogueTrees.js:2367](../src/dialogueTrees.js#L2367) | title: 'Clash in the Courtyard: The Eagle and the Chain', |
| [src/dialogueTrees.js:2514](../src/dialogueTrees.js#L2514) | // PLACEHOLDER: Estate building and room decor / keepsake reaction scenes for the designer. |
| [src/dialogueTrees.js:2525](../src/dialogueTrees.js#L2525) | unit91: 'A Temple of Hades under the flagstones. Expensive, Lanista, and far cleaner than Vulcan\'s butchers.', |
| [src/dialogueTrees.js:2651](../src/dialogueTrees.js#L2651) | // PLACEHOLDER: Personal request ask / fulfilled / refused wrapper scenes for the designer. |
| [src/dialogueTrees.js:2660](../src/dialogueTrees.js#L2660) | title: ctx?.label ?? f?.want?.label ?? 'A Personal Request', |
| [src/dialogueTrees.js:2770](../src/dialogueTrees.js#L2770) | // PLACEHOLDER: Bond formed and grief wrapper scenes for the designer. |
| [src/dialogueTrees.js:2791](../src/dialogueTrees.js#L2791) | fighterText: lastBeat?.text ?? 'We stand together on the sand now.', |
| [src/dialogueTrees.js:2856](../src/dialogueTrees.js#L2856) | // PLACEHOLDER: Mercy vs. execution post-bout scenes for the designer. |
| [src/dialogueTrees.js:2871](../src/dialogueTrees.js#L2871) | unit91: 'They were already beaten. Killing them changed nothing but the noise. Humans like the noise. I did as you ordered, Lanista. Do not ask me to cheer.', |
| [src/dialogueTrees.js:2944](../src/dialogueTrees.js#L2944) | // PLACEHOLDER: Hades revival and Vulcan Revenant death-and-return scenes for the designer. |
| [src/dialogueTrees.js:2950](../src/dialogueTrees.js#L2950) | unit91: 'I was taught that things end, Lanista. I had made my peace with it. Now I shall have to make it again. Thank you for the tithe. I think.', |
| [src/dialogueTrees.js:3025](../src/dialogueTrees.js#L3025) | // PLACEHOLDER: Estate staff scenes (Drillmaster Kaeso, Physician Lyra, Galen-VII) for the designer. |
| [src/dialogueTrees.js:3040](../src/dialogueTrees.js#L3040) | title: 'Trainer Room · Post Vacant', |
| [src/dialogueTrees.js:3326](../src/dialogueTrees.js#L3326) | // PLACEHOLDER: Idle hub and companion topic scenes (ask_arena, ask_room, ask_past) for the designer. |
| [src/dialogueTrees.js:3341](../src/dialogueTrees.js#L3341) | unit91: `${aName}. The hot-tempered ones spend themselves in the first round, so guard and let them. The calm ones wait for you to commit, so show them a false start. Humans are not complicated.`, |

## 22. Fighter voices, last words & Level-3 backstories (`src/voices.js`, PLACEHOLDER)

Line-level index of Prefect Crassinus's postures, arena last words, and Level-3 Palatina backstories in [src/voices.js](../src/voices.js).

**Prefect posture & fighter last words (`LAST_WORDS_*`)**

| Where | Text |
|---|---|
| [src/voices.js:25](../src/voices.js#L25) | if (suspicion >= s.raid) return 'Signing the dawn warrant'; |
| [src/voices.js:32](../src/voices.js#L32) | // ---------- Fighter last words on arena death (7.11, PLACEHOLDER lines) ---------- |
| [src/voices.js:35](../src/voices.js#L35) | 'The box... still stands. Don\'t let it stay that way, Lanista.', |
| [src/voices.js:39](../src/voices.js#L39) | 'Keep the chalk dry, Lanista.', |
| [src/voices.js:43](../src/voices.js#L43) | 'Again. Good. The forge was cold anyway.', |
| [src/voices.js:47](../src/voices.js#L47) | (t) => `${t}. They'll remember the name, Lanista. Make sure they spell it right.`, |
| [src/voices.js:54](../src/voices.js#L54) | choleric: 'Tell Silbannacus I died standing.', |
| [src/voices.js:60](../src/voices.js#L60) | choleric: 'Combat loop... terminated. Salvage the blade, not the frame.', |
| [src/voices.js:66](../src/voices.js#L66) | choleric: 'Don\'t let a pit-fighter touch my blade.', |
| [src/voices.js:72](../src/voices.js#L72) | choleric: 'The ancestors are watching. Let them drink!', |
| [src/voices.js:78](../src/voices.js#L78) | choleric: 'Burn the body. Don\'t let Vulcan\'s priests have me.', |
| [src/voices.js:84](../src/voices.js#L84) | choleric: 'They needed steel to drop me. Remember that.', |
| [src/voices.js:99](../src/voices.js#L99) | `Tell ${mate}... I held the line.`, |
| [src/voices.js:109](../src/voices.js#L109) | return 'Tell the crowd they got their copper\'s worth.'; |

**Level-3 fighter backstories (`BACKSTORIES`) & Humour codas (`HUMOUR_CADENCE`)**

| Where | Text |
|---|---|
| [src/voices.js:112](../src/voices.js#L112) | // ---------- Level-3 fighter backstories: Palatina and the Astral Principate (8.0, PLACEHOLDER lines) ---------- |
| [src/voices.js:118](../src/voices.js#L118) | 'My family grew up in the lower aqueduct wards of Palatina, right beneath the marble foundations where the old Elven spires used to stand. My forefather marched with Silbannacus when the Revolution broke the High Houses.', |
| [src/voices.js:130](../src/voices.js#L130) | 'Across the frontier stars, in the Free Android Coalition\'s Choir of Ephemera, we trade recordings of things that only happen once: a single sunrise over a glass sea, or a child\'s laugh. Because things that end are the only things worth remembering.', |
| [src/voices.js:142](../src/voices.js#L142) | 'My house ruled the silver cedar vaults three centuries ago, before your Emperor was a rumour. My grandmother still dresses for dinner in a burned hall without a roof, waiting for the Machine beneath the palace to grow bored of its undying Roman pet.', |
| [src/voices.js:154](../src/voices.js#L154) | 'In my clan, nobody dies in a bed if they can help it. When the Principate reached our rim-worlds, it handed our grandfathers eagles and an arena. We still burn the salt before a bout, and we still drink to the Princeps.', |
| [src/voices.js:166](../src/voices.js#L166) | 'My province on the outer rim is tide-locked: high black spires, cold wine, and centuries of night. We bought peace with Silbannacus\'s star-fleets by paying our annual tribute to Palatina in second sons and debtors.', |
| [src/voices.js:178](../src/voices.js#L178) | 'My people were born to the tidal coasts of this world long before the Roman or his Machine woke. The old Elven houses caged our ancestors in laboratory pens and forced cold calculus into our skulls until we rose with Silbannacus and tore their spires down.', |
| [src/voices.js:190](../src/voices.js#L190) | choleric: 'And if I ever meet the magistrate who signed my warrant on Palatina, I won\'t wait for the trumpets.', |
| [src/voices.js:191](../src/voices.js#L191) | melancholic: 'Funny how a person gets used to anything, if they survive the first month.', |
| [src/voices.js:192](../src/voices.js#L192) | phlegmatic: 'No point shouting at the sky. Best get some sleep before morning drills.', |
| [src/voices.js:193](../src/voices.js#L193) | sanguine: 'Still: worse places to end up than a house that feeds us on time.', |
| [src/voices.js:202](../src/voices.js#L202) | ? 'And I won\'t let Silbannacus own the rest of my life, either. Whatever comes.' |

## 23. Word in the city — monthly headlines (`src/gazette.js`, PLACEHOLDER)

Line-level index of all 11 reactive street headline categories in [src/gazette.js](../src/gazette.js) (`cityHeadlines`).

| Where | Text |
|---|---|
| [src/gazette.js:2](../src/gazette.js#L2) | // Zero RNG calls, zero state mutation, British English throughout. PLACEHOLDER lines for the designer. |
| [src/gazette.js:20](../src/gazette.js#L20) | add('plot', '⛓', 'The broken chain is chalked on every fountain from the Subura to the Palatine. Nobody scrubs it off before noon.'); |
| [src/gazette.js:22](../src/gazette.js#L22) | add('plot', '👁', `${PREFECT} turned down three dinner invitations this week. People say he is finishing a very careful report.`); |
| [src/gazette.js:24](../src/gazette.js#L24) | add('plot', '👁', 'Praetorians have been drinking in the wine-shop across from your gate and paying with imperial silver.'); |
| [src/gazette.js:26](../src/gazette.js#L26) | add('plot', '👁', `The water-seller says a clerk from ${PREFECT}'s office asked which of your fighters go out after curfew.`); |
| [src/gazette.js:29](../src/gazette.js#L29) | add('plot', '⚖', 'The city cells are quieter this month. Nobody says your house\'s name aloud in the taverns.'); |
| [src/gazette.js:36](../src/gazette.js#L36) | add('cousin', '⛓', `The executioner's slate in the forum lists ${c.name ?? 'an unnamed prisoner'} for ${left === 0 ? 'this week' : `${left} week${left === 1 ? '' : 's'} from now`}.`); |
| [src/gazette.js:41](../src/gazette.js#L41) | add('unrest', '🔥', 'Wagers are being taken in the alley behind your barracks on whether your chains hold through the month.'); |
| [src/gazette.js:43](../src/gazette.js#L43) | add('mole', '🗝', 'A rival\'s runner was seen trading sealed wax for silver near your back gate.'); |
| [src/gazette.js:52](../src/gazette.js#L52) | add('arena', '☠', `Bookmakers took a bath when ${nemesisBeat.fighter} finally brought down ${nemesisBeat.nemesis}.`); |
| [src/gazette.js:54](../src/gazette.js#L54) | add('arena', '🩸', `The wine-shops are still retelling ${bloodied.fighter}'s bloodied win in ${arenaName(bloodied.tier)}. Half the street is drinking in your colours.`); |
| [src/gazette.js:56](../src/gazette.js#L56) | add('arena', '🏆', `Hawkers outside ${arenaName(titled.tier)} are selling clay figurines of ${titled.fighter}, ${titled.title}.`); |
| [src/gazette.js:62](../src/gazette.js#L62) | add('fallen', '⚰', `Someone left two copper coins and a sprig of laurel outside your gate for ${fallen.name}.`); |
| [src/gazette.js:68](../src/gazette.js#L68) | add('spared', '👍', `Word from the arena tunnels: ${spared.name}, whom you spared on the sand, drinks to your house's health every night.`); |
| [src/gazette.js:74](../src/gazette.js#L74) | add('nemesis', '☠', `${nemesis.name} ${nemesis.nemesis.epithet} was spotted sharpening steel near ${arenaName(nemesis.nemesis.tier)}, asking if your house still fields fighters.`); |
| [src/gazette.js:81](../src/gazette.js#L81) | if (polName) add('policy', '🏛', `Town criers read out the Senate's latest act on the forum steps: ${polName}.`); |
| [src/gazette.js:89](../src/gazette.js#L89) | add('house', '⚔', `Men in ${feud.name}'s colours spat in the dust as your steward crossed the forum.`); |
| [src/gazette.js:91](../src/gazette.js#L91) | add('house', '🤝', `Fighters of ${owed.name} stepped aside in the bathhouse to let yours pass first. A life owed is not forgotten.`); |
| [src/gazette.js:95](../src/gazette.js#L95) | add('house', '🏟', `${leader.name} sits atop the Glory rolls (${leader.glory}). Their Lanista has already ordered a laurel wreath.`); |
| [src/gazette.js:102](../src/gazette.js#L102) | add('season', '🏛', `Priests are already chalking the sand for ${fest.festival.name} (${fest.festival.god}).`); |
| [src/gazette.js:104](../src/gazette.js#L104) | add('season', '❄', 'The sand is frozen and the stands are shuttered. The city spends winter arguing over last year\'s bouts and paying the Emperor\'s tax.'); |
| [src/gazette.js:106](../src/gazette.js#L106) | add('season', '⚖', `Imperial tax-collectors have started chalking doors down the street. Winter's tribute is ${tributeDue(run)} Gold.`); |
| [src/gazette.js:111](../src/gazette.js#L111) | add('opening1', '📣', 'Emperor Silbannacus\'s heralds are drumming up wagers for the Dirt Pits. Nobody in the stands knows your house\'s name yet.'); |
| [src/gazette.js:114](../src/gazette.js#L114) | add('opening2', '⚓', 'A frontier prison barge docked at the sky-harbour at dawn; the brokers are already sorting its manifests for the Market.'); |
