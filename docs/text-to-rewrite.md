# Text to rewrite in your voice

Every piece of story text in the game, with the file and line where it lives (click to open). Generated from the code on 2026-11-24, so line numbers match the current `main`. After code changes, `npm run text-index` moves every link to its text's new line and lists any text it can't find.

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
| [src/tutorial.js:13](../src/tutorial.js#L13) | (starts here, several lines) You are scrolling, cursing, dare I say surfing the web. Suddenly the screen shimmers. A hand reaches out of it, grabs you by the head and pulls you through.       You land hard on cold stone, under a sun that isn't yours. This is Battleworld, whose portals pull warriors from every world and century to feed the arenas of Emperor Silbannacus, a Roman usurper who fused magic and machinery into an empire of bloodsport.       Then everything goes dark. |
| [src/tutorial.js:17](../src/tutorial.js#L17) | **How you win** |
| [src/tutorial.js:20](../src/tutorial.js#L20) | (starts here, several lines) Climb four arenas, from the Dirt Pits to the Imperial Coliseum. Each arena holds a circuit: Tournament 1 → Tournament 2 → Boss.       Beat all four Bosses, then win the Grand Tournament, and the Emperor names you Master of the Games.       You don't fight. You recruit, train, heal and choose who to send, then make the hard calls from your box above the sand. |
| [src/tutorial.js:23](../src/tutorial.js#L23) | **How you lose** |
| [src/tutorial.js:26](../src/tutorial.js#L26) | (starts here, several lines) The Emperor watches you through Imperial Favour. Losing a Boss in your top arena, forfeiting, and failing to pay his yearly tribute all cost Favour. At 0 Favour you're executed.       You also fall if every gladiator is dead and you can't afford another, or if your miserable gladiators revolt.       Your fighters are mortal. One injury is survivable; with two injuries, losing a round can kill them. Between rounds you can always capitulate to save a fighter, at the cost of the match. |
| [src/tutorial.js:29](../src/tutorial.js#L29) | **Power, Speed and luck** |
| [src/tutorial.js:30](../src/tutorial.js#L30) | (starts here, several lines) Power wins rounds. What counts is the gap between the fighters: +1 is 55% per round, +3 is 70%, +5 is 95%.       Speed decides who strikes first (+10% to win that round, and the first chance to wound), and being faster makes you harder to wound. A balanced fighter wins and stays healthy.       Traits, weapons and injuries tilt the odds further. Every number is shown in the fight and explained in the Codex. Good luck, Lanista. |

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
| [src/plot.js:156](../src/plot.js#L156) | {f} asks to speak to you alone. "Free me. I can do more for the cause outside these walls than inside your arena." |
| [src/plot.js:32](../src/plot.js#L32) | Choice: Refuse |
| [src/plot.js:14](../src/plot.js#L14) | Choice: Free {f} |

**Thrown to the beasts** (`freeCondemned`)

| Where | Text |
|---|---|
| [src/plot.js:163](../src/plot.js#L163) | Title: Thrown to the beasts |
| [src/plot.js:166](../src/plot.js#L166) | {f} has gone pale. "They're throwing {name} to the beasts at the games today, for sedition. You have the Emperor's ear, and a key to every gate in the arena." |
| [src/plot.js:168](../src/plot.js#L168) | Choice: Do nothing |
| [src/plot.js:169](../src/plot.js#L169) | Choice: Plead for clemency (−8 Favour) |
| [src/plot.js:170](../src/plot.js#L170) | Choice: Arrange an escape |

**One of ours across the sand** (`acrossSand`)

| Where | Text |
|---|---|
| [src/plot.js:174](../src/plot.js#L174) | Title: One of ours across the sand |
| [src/plot.js:177](../src/plot.js#L177) | {f} lowers their voice. "{opp}, who fights for {house}, is one of us. If you meet in the arena, beat them if you must, but let them live." |
| [src/plot.js:179](../src/plot.js#L179) | Choice: Promise nothing |
| [src/plot.js:180](../src/plot.js#L180) | Choice: Promise to spare them |

**The forged pass** (`forgedPass`)

| Where | Text |
|---|---|
| [src/plot.js:241](../src/plot.js#L241) | Title: The forged pass |
| [src/plot.js:244](../src/plot.js#L244) | A clerk from the palace archives offers a pass bearing the Emperor's own seal. Shown at the right moment, it will send the Praetorians away once. |
| [src/plot.js:246](../src/plot.js#L246) | Choice: Decline |
| [src/plot.js:247](../src/plot.js#L247) | Choice: Buy it (8 Gold) |

**Steel for the cause** (`armBarracks`)

| Where | Text |
|---|---|
| [src/plot.js:251](../src/plot.js#L251) | Title: Steel for the cause |
| [src/plot.js:255](../src/plot.js#L255) | An old centurion asks for weapons from your storeroom. "When the day comes, the barracks must be armed. Two pieces of steel will do." |
| [src/plot.js:32](../src/plot.js#L32) | Choice: Refuse |
| [src/plot.js:258](../src/plot.js#L258) | Choice: Hand over two pieces of gear |

**The champion** (`recruitChampion`)

| Where | Text |
|---|---|
| [src/plot.js:262](../src/plot.js#L262) | Title: The champion |
| [src/plot.js:270](../src/plot.js#L270) | The rebels want a champion from your house. "When the Emperor comes to the games, the crowd must see one of their own strike the blow." They name {f}, or {g}. |
| [src/plot.js:272](../src/plot.js#L272) | Choice: Keep your fighters out of it |
| [src/plot.js:273](../src/plot.js#L273) | Choice: Sound {f} out ({fOdds}% they say yes) |
| [src/plot.js:273](../src/plot.js#L273) | Choice: Sound {g} out ({gOdds}% they say yes) |

**A curious guest** (`informer`)

| Where | Text |
|---|---|
| [src/plot.js:279](../src/plot.js#L279) | Title: A curious guest |
| [src/plot.js:282](../src/plot.js#L282) | A guest at your table asks a great many questions about where your fighters go at night. |
| [src/plot.js:284](../src/plot.js#L284) | Choice: Say nothing |
| [src/plot.js:285](../src/plot.js#L285) | Choice: Feed him a story |

**The prefect's offer** (`theOffer`)

| Where | Text |
|---|---|
| [src/plot.js:300](../src/plot.js#L300) | Title: The prefect's offer |
| [src/plot.js:303](../src/plot.js#L303) | A Praetorian prefect calls on you, alone. "The Emperor knows there are traitors in the gladiator houses. Give him their names, and he will remember your house kindly." |
| [src/plot.js:305](../src/plot.js#L305) | Choice: Know nothing |
| [src/plot.js:306](../src/plot.js#L306) | Choice: Name the names |

**The Praetorians at dawn** (`raid`)

| Where | Text |
|---|---|
| [src/plot.js:310](../src/plot.js#L310) | Title: The Praetorians at dawn |
| [src/plot.js:316](../src/plot.js#L316) | The Praetorians come at dawn and fill the yard. Their prefect wants a traitor, or a reason to leave without one. |
| [src/plot.js:318](../src/plot.js#L318) | Choice: Pay them off (15 Gold) |
| [src/plot.js:258](../src/plot.js#L258) | Choice: Hand over {f} |
| [src/plot.js:320](../src/plot.js#L320) | Choice: Show the forged pass |
| [src/plot.js:321](../src/plot.js#L321) | Choice: Bar the gates |

**Tonight the Emperor attends** (`coupEve`)

| Where | Text |
|---|---|
| [src/plot.js:326](../src/plot.js#L326) | Title: Tonight the Emperor attends |
| [src/plot.js:329](../src/plot.js#L329) | Silbannacus himself will watch the Grand Final from the imperial box. The barracks are armed. {f} is ready. Every door in the city has a broken chain on it. |
| [src/plot.js:331](../src/plot.js#L331) | Choice: Not tonight |
| [src/plot.js:326](../src/plot.js#L326) | Choice: Tonight |

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
| [src/run/plotEngine.js:68](../src/run/plotEngine.js#L68) | `${name} slips out of the city.`, 'event' |
| [src/run/plotEngine.js:112](../src/run/plotEngine.js#L112) | 'A sealed letter arrives with no name on it. Inside: a pass bearing the Emperor\'s seal.', 'event' |
| [src/run/plotEngine.js:117](../src/run/plotEngine.js#L117) | `A blessing from ${priest.name} reaches the barracks in secret. Spirits lift.`, 'good' |
| [src/run/plotEngine.js:120](../src/run/plotEngine.js#L120) | `${courier.name} sends word: the Praetorians are watching another house this month.`, 'good' |
| [src/run/plotEngine.js:127](../src/run/plotEngine.js#L127) | pick(run.rng.plot, SUSPICION_SIGNS.ready), 'event' |
| [src/run/plotEngine.js:205](../src/run/plotEngine.js#L205) | `${f.name} tried to escape over the wall, and was caught by the watch and executed.`, 'bad'); } |
| [src/run/plotEngine.js:210](../src/run/plotEngine.js#L210) | `${f.name} is taken by the Praetorians and executed in the arena at noon.`, 'bad' |
| [src/run/plotEngine.js:213](../src/run/plotEngine.js#L213) | 'Not tonight. The rebels will wait for the next Grand Tournament.', 'event' |
| [src/run/plotEngine.js:224](../src/run/plotEngine.js#L224) | 'The Praetorians break down the gates. Your house is tried for treason, and the sentence is read at the games.' |
| [src/run/plotEngine.js:235](../src/run/plotEngine.js#L235) | `On your word, the Praetorians drag ${f.name} from the barracks. They are executed at noon.`, 'bad' |
| [src/run/plotEngine.js:237](../src/run/plotEngine.js#L237) | `${c.name} is found hiding in the city, and executed.`, 'bad' |
| [src/run/plotEngine.js:244](../src/run/plotEngine.js#L244) | `A purse of ${purse} Gold arrives from the palace, with the Emperor's thanks.`, 'event' |
| [src/run/plotEngine.js:259](../src/run/plotEngine.js#L259) | run.epilogue = [...(run.epilogue ?? []), victims.length ? `Executed on your word: ${victims.join(', ')}.` : 'You gave the Emperor names. He made sure they were the right ones.'] |
| [src/run/plotEngine.js:274](../src/run/plotEngine.js#L274) | 'The signal is never given. The rebels melt back into the crowd, to wait for another day of games.', 'warn' |
| [src/run/plotEngine.js:280](../src/run/plotEngine.js#L280) | `${fighter.name} wins the Final, turns, and climbs into the imperial box. Silbannacus falls on the sand he filled with blood. The empire is yours to remake.` |
| [src/run/plotEngine.js:282](../src/run/plotEngine.js#L282) | if (freed.length) run.epilogue = [...(run.epilogue ?? []), `In the crowd, the people you freed were the first to cheer: ${freed.join(', ')}.`] |
| [src/run/plotEngine.js:299](../src/run/plotEngine.js#L299) | run.epilogue = [...(run.epilogue ?? []), 'The signal never came: the wrong fighter won the Final, and the moment passed. Somewhere, a chalk mark fades.'] |
| [src/run/plotEngine.js:304](../src/run/plotEngine.js#L304) | `${fighter.name} falls in the Final, and the rising dies with them. The broken chain is scrubbed from every door, but the city remembers.` |

End-screen titles and closing lines:

| Where | Text |
|---|---|
| [src/ui/views.js:164](../src/ui/views.js#L164) | const ENDING_TITLES = { coup: '⛓ The Tyrant Falls', martyr: '⛓ The Rising Fails', treason: '⚖ Tried for Treason' } |
| [src/ui/views.js:166](../src/ui/views.js#L166) | 'Some say a different house could have changed the empire.' |
| [src/ui/views.js:167](../src/ui/views.js#L167) | 'The Emperor remembers your loyalty. So does everyone else.' |

## 5. Career endings (all careers)

| Where | Text |
|---|---|
| [src/run/tournaments.js:833](../src/run/tournaments.js#L833) | 'You won the Grand Tournament. The Emperor names you Master of the Games.' |
| [src/run/helpers.js:303](../src/run/helpers.js#L303) | `The Emperor's Favour is gone. You are executed in ${formatDate(run.week)}.` |
| [src/run/unrest.js:160](../src/run/unrest.js#L160) | 'Killed in a gladiator revolt.' (7.3; was 'Your gladiators revolt and burn the Ludus.') |
| [src/run/helpers.js:310](../src/run/helpers.js#L310) | 'No fighters left and not enough Gold to buy one. Your house falls.' |
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
| [src/events.js:185](../src/events.js#L185) | A crowd has gathered at the gate to watch your gladiators train. Some are offering coins for a look. |
| [src/events.js:187](../src/events.js#L187) | Choice: Keep the gates shut |
| [src/events.js:188](../src/events.js#L188) | Choice: Open the gates |

**An imperial envoy** (`envoy`)

| Where | Text |
|---|---|
| [src/events.js:194](../src/events.js#L194) | An envoy of the Emperor arrives unannounced to inspect your house. He looks bored, and expensive. |
| [src/events.js:196](../src/events.js#L196) | Choice: Show him your discipline |
| [src/events.js:197](../src/events.js#L197) | Choice: Offer him a gift (6 Gold) |

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
| [src/ui/views.js:1092](../src/ui/views.js#L1092) | The crowd waits${esc(m.opp)}'s fate${esc(f?.name ?? 'Your fighter')} beat ${esc(m.opp)}. ${blood ? '👎 The crowd roars for blood!' : '👍 The crowd chants for mercy.'} |
| Where | Text |
|---|---|
| [src/ui/fightView.js:41](../src/ui/fightView.js#L41) | const SUSPENSE = 1; // the pause ("Steel meets steel…") before the round's winner is announced |
| [src/ui/fightView.js:182](../src/ui/fightView.js#L182) | s.champion ? row('The crowd', 'boos a champion back in the pits', 'bad') : s.crushing ? row('The crowd', 'jeers the mismatch', 'bad') : '' |
| [src/ui/fightView.js:188](../src/ui/fightView.js#L188) | s.bribed ? row('Crowd Bribe', 'the crowd forgave the capitulation', 'good') : '' |
| [src/ui/fightView.js:193](../src/ui/fightView.js#L193) | s.verdict && s.verdict === s.mercy ? row('The crowd', 'roars its approval', 'good') : '' |
| [src/ui/fightView.js:203](../src/ui/fightView.js#L203) | // Thumbs up or down: the beaten opponent's fate, with what the crowd wants. |
| [src/ui/fightView.js:210](../src/ui/fightView.js#L210) | const spare = blood ? `${favor}; ${house} will owe you a life (−1 Power against you)` : `${favor}, +${MERCY.crowdRenown} Renown, +${MERCY.crowdMorale} Morale (the crowd agrees)` |
| [src/ui/fightView.js:211](../src/ui/fightView.js#L211) | const kill = blood ? `+${MERCY.killRenown + MERCY.crowdRenown} Renown, +${MERCY.crowdMorale} Morale, a kill (the crowd agrees)` : `+${MERCY.killRenown + MERCY.infamyRenown} Renown (infamy), a kill${m.house ? `; ${house} will swear a feud` : ''}` |
| [src/ui/fightView.js:334](../src/ui/fightView.js#L334) | const pre = mortalDanger(m.a) ? `⚠ MORTAL DANGER from the first round: ${esc(m.a.f.name)} enters with ${effectiveInjuries(m.a.f)} injur${effectiveInjuries(m.a.f) === 1 ? 'y' : 'ies'}. Losing Round 1: about ${Math.round(deathRisk(m) * 100)}% chance of death. Capitulating is only possible between rounds.` : '' |
| [src/ui/fightView.js:338](../src/ui/fightView.js#L338) | const alert = danger ? `⚠ MORTAL DANGER: ${esc(m.a.f.name)} has ${effectiveInjuries(m.a.f)} injur${effectiveInjuries(m.a.f) === 1 ? 'y' : 'ies'} and can die if they lose the next round. Fighting on: about ${Math.round(deathRisk(m) * 100)}% chance of death this round${canThrowTowel(m) ? '' : ' (and the Emperor forbids capitulating)'}.` : '' |
| [src/ui/fightView.js:410](../src/ui/fightView.js#L410) | ${last ? `Your round chance ${fmtPct(last.win.chance)}${animate ? `Steel meets steel…` : ''}${roundBanner(m, last, reveal)}` : 'The crowd roars. Three rounds; first to two wins.'} |

## 9. The house log (read all the time)

Lines the house steward writes each week. The plot's lines are in section 4.

| Where | Text |
|---|---|
| [src/run/weekly.js:101](../src/run/weekly.js#L101) | `You take charge of a bottom-tier Ludus in ${arenaName(1)}.` |
| [src/run/roster.js:196](../src/run/roster.js#L196) | `${fighter.name} joins the Ludus.` |
| [src/run/roster.js:215](../src/run/roster.js#L215) | `${f.name} is released from the Ludus. Their gear and decor return to the storeroom.` |
| [src/run/helpers.js:251](../src/run/helpers.js#L251) | `${f.name} leaves the Medbay fully healed.`, 'good' |
| [src/run/weekly.js:221](../src/run/weekly.js#L221) | `${f.name} is overtrained (Stress ${f.stress}). Rest them before a fight.`, 'warn' |
| [src/run/weekly.js:222](../src/run/weekly.js#L222) | `${f.name} is mutinous and refuses to fight.`, 'bad' |
| [src/run/unrest.js:90](../src/run/unrest.js#L90) | `The barracks seethe: unrest ${run.unrest}/${UNREST.threshold}. Calm your Mutinous fighters, or the chains will break.`, 'bad' (7.3) |
| [src/run/weekly.js:251](../src/run/weekly.js#L251) | 'The stranger in the Medbay slipped away before dawn.', 'event'); } |
| [src/run/weekly.js:252](../src/run/weekly.js#L252) | `The Emperor's tribute of ${tributeDue(run)} Gold is due at the start of winter.`, 'warn' |
| [src/run/weekly.js:262](../src/run/weekly.js#L262) | `Tournament week in ${unlockedTiers(run).length > 1 ? `${unlockedTiers(run).length} arenas` : arenaName(run.topTier)}.`, 'event' |
| [src/run/weekly.js:330](../src/run/weekly.js#L330) | `You pay the Emperor's tribute early: ${due} Gold.`, 'event' |
| [src/run/weekly.js:339](../src/run/weekly.js#L339) | `The year-end purse: your house finished #${rank + 1} of ${run.houses.length + 1} in Glory${purse ? ` and is paid ${purse} Gold` : ', and is paid nothing'}.`, purse ? 'good' : 'warn' |
| [src/run/weekly.js:347](../src/run/weekly.js#L347) | 'The Emperor\'s collectors find your tribute already paid.', 'event' |
| [src/run/weekly.js:351](../src/run/weekly.js#L351) | `You pay the Emperor's tribute: ${due} Gold.`, 'event' |
| [src/run/weekly.js:354](../src/run/weekly.js#L354) | `You can't pay the ${due} Gold tribute. The Emperor takes what you have, and remembers.`, 'bad' |
| [src/run/helpers.js:293](../src/run/helpers.js#L293) | `Imperial Favour ${delta > 0 ? '+' : ''}${delta} (${why}): now ${run.favor}.`, delta > 0 ? 'good' : 'bad' |
| [src/run/helpers.js:207](../src/run/helpers.js#L207) | `${f.name} reaches level ${f.level}! Choose a perk.`, 'event' |
| [src/run/roster.js:620](../src/run/roster.js#L620) | `Sold a ${GEAR[key].name} for ${sellPrice(key)} Gold.` |
| [src/run/roster.js:733](../src/run/roster.js#L733) | `${f.name} wakes with a ${AUGMENTS[key].name}. The crowd mutters about machines.`, 'event' |
| [src/run/roster.js:758](../src/run/roster.js#L758) | `${f.name} retires to the Hall of Champions. +${RETIRE.prestige} Prestige, and the roster takes heart.`, 'good' |
| [src/run/tournaments.js:356](../src/run/tournaments.js#L356) | `You skip ${bout.name}: +${ECONOMY.skipGold} Gold, and the roster rests.` |
| [src/run/tournaments.js:776](../src/run/tournaments.js#L776) | `${fighter.name} has ${fighter.kills} kills and earns the mark ${summary.mark}: ${marks.at(-1).desc}`, 'event' |
| [src/run/tournaments.js:470](../src/run/tournaments.js#L470) | `The crowd boos ${fighter.name}, a champion of this arena picking on its newcomers.`, 'warn' |
| [src/run/tournaments.js:473](../src/run/tournaments.js#L473) | `The crowd jeers ${fighter.name} for crushing a much weaker opponent.`, 'warn' |
| [src/run/tournaments.js:629](../src/run/tournaments.js#L629) | `${fighter.name} claims a ${GEAR[summary.loot].name} from the defeated ${opp.name}.`, 'good' |
| [src/run/tournaments.js:586](../src/run/tournaments.js#L586) | `${fighter.name} is scarred: ${SCARS[id].name} against ${vs} fighters.`, 'warn' |
| [src/run/tournaments.js:599](../src/run/tournaments.js#L599) | `${fighter.name} died in ${bout.name}. The house mourns; their gear returns to the storeroom.`, 'bad' |
| [src/run/helpers.js:243](../src/run/helpers.js#L243) | `House Prestige level ${run.prestigeLevel}! New buildings and room plots unlocked.`, 'event' |
| [src/run/tournaments.js:689](../src/run/tournaments.js#L689) | `${fighter.name} wins the ${round} of ${bout.name}. On to the ${next}.`, 'good' |
| [src/run/tournaments.js:734](../src/run/tournaments.js#L734) | `Overnight, every chalk mark on your doors is washed away.`, 'warn' |
| [src/run/tournaments.js:770](../src/run/tournaments.js#L770) | `Thumbs down: ${fighter.name} finishes ${opp}.`, 'warn' |
| [src/run/tournaments.js:776](../src/run/tournaments.js#L776) | `${fighter.name} has ${fighter.kills} kills and earns the mark ${out.mark}: ${marks.at(-1).desc}`, 'event' |
| [src/run/tournaments.js:790](../src/run/tournaments.js#L790) | `The crowd roars its approval for ${fighter.name}.`, 'good' |
| [src/run/tournaments.js:857](../src/run/tournaments.js#L857) | `${opp.name} will remember this, and will be waiting for you.`, 'warn' |

## 10. Tutorial and coach tips

The tutorial month (`GUIDE`): the steward's five steps for a new Lanista. Tags like <b> are dropped here; keep them in the code.

| Where | Text |
|---|---|
| [src/tutorial.js:46](../src/tutorial.js#L46) | Tutorial month, step 1: Let's start with one gladiator. In the Market, look at each one's Power (the sword: wins rounds) and Speed (the arrow: strikes first), then press Recruit on at least one of them. |
| [src/tutorial.js:54](../src/tutorial.js#L54) | Tutorial month, step 2: Now the Ludus. Every fighter does one job a week. Give your strongest fighter +1 Power: training costs a little Gold and adds ${STRESS.train} Stress. The other can Rest for now; one Trainer Room trains one fighter at a time. |
| [src/tutorial.js:63](../src/tutorial.js#L63) | Tutorial month, step 3: Jobs are set. Make sure at least one fighter is training: only a fighter on Train Power (+1 Power) or Train Speed (+3 Speed) gets stronger, and an untrained house falls behind fast. Then press End week and the week plays out: training, rest and healing all happen at once. |
| [src/tutorial.js:71](../src/tutorial.js#L71) | Tutorial month, step 4: The last week of every month is fight day. Keep training, and rest a fighter whose Stress passes ${STRESS.overtrained - STRESS.train}: at ${STRESS.overtrained} they're overtrained and fight worse. When you're ready, Skip to tournament takes you straight there. |
| [src/tutorial.js:79](../src/tutorial.js#L79) | Tutorial month, step 5: Fight day. Each fighter's line shows their odds, injury risk and the Power both sides will fight with. Sending one costs a little Prestige; winning pays it back with more. Pick your best and press Send. |
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
| [src/hints.js:29](../src/hints.js#L29) | { text: `Tournament week: send a fighter to ${arenaName(run.topTier)} (or skip it). Odds are on the right.`, tone: 'event' } |
| [src/hints.js:34](../src/hints.js#L34) | { text: `Optional: send a free fighter to ${open.map(arenaName).join(' or ')} for extra Gold and XP, or end the week.` } |
| [src/hints.js:37](../src/hints.js#L37) | { text: `${injured.name} is injured: set their job to Medbay so they heal.`, tone: 'warn' } |
| [src/hints.js:40](../src/hints.js#L40) | { text: `Save Gold: the ${due} Gold tribute is due in ${weeks} week${weeks === 1 ? '' : 's'} and you have ${run.gold}.`, tone: 'bad' } |
| [src/hints.js:57](../src/hints.js#L57) | { text: `${restless.name} is Discontented (Morale ${restless.morale}): place decor or upgrade their quarters.`, tone: 'warn' } |
| [src/hints.js:59](../src/hints.js#L59) | { text: `${idle.name} is resting with Stress ${idle.stress}: they could train this week.` } |
| [src/hints.js:60](../src/hints.js#L60) | { text: 'Jobs are set. End the week (Space) or skip to the tournament (T).' } |

## 11. Codex lore

| Where | Text |
|---|---|
| [src/codex.js:25](../src/codex.js#L25) | 'kind:human': "Earth's most stubborn export. Battleworld's portals snatch humans from every century (legionaries, pit fighters, the occasional baffled accountant), and the angriest of them thrive." |
| [src/codex.js:26](../src/codex.js#L26) | 'kind:android': "War machines built for conflicts that ended long ago, salvaged by the Emperor's engineers. They learn from every round they lose, and some never stop running." |
| [src/codex.js:27](../src/codex.js#L27) | 'kind:elf': 'Taken from a dying forest-world, elves fight like duelists at a court dance: light on their feet, proud, and insufferable while untouched.' |
| [src/codex.js:28](../src/codex.js#L28) | 'kind:orc': "Orc clans believe a death in the arena feeds their ancestors. Their blood-priests make sure a fallen orc's house still profits from the sacrifice." |
| [src/codex.js:29](../src/codex.js#L29) | 'class:cestus': 'Boxers in iron-studded gloves called cestus. They start slow and hit harder every round; even the Romans thought them the most brutal of the arena specialists.' |
| [src/codex.js:30](../src/codex.js#L30) | 'class:sagittarius': 'Archers. In old Rome, sagittarii were auxiliaries from the eastern provinces; on Battleworld they open every exchange with a volley, gambling on a quick lead or a crippling wound.' |
| [src/codex.js:31](../src/codex.js#L31) | 'class:ornitharius': 'Bird-handlers who fight beside hawks and ravens kept in their quarters. The birds smell blood: once their master is hurt, they go for the eyes.' |
| [src/codex.js:32](../src/codex.js#L32) | 'class:fighter': 'Weapon masters with no single tradition, just a favourite tool and a lifetime of practice with it.' |
| [src/codex.js:33](../src/codex.js#L33) | 'kind:vampire': 'Pale nobles from a world without a sun. The Emperor bought them by the shipload; they fight best when the sand is soaked and the torches burn low.' |
| [src/codex.js:34](../src/codex.js#L34) | 'kind:basa': 'Beast-folk from the jungle moons, sold only by the Stables. Hide like boiled leather, a pounce that clears half the arena, and a rage that grows with every round they win.' |
| [src/codex.js:37](../src/codex.js#L37) | 'class:retiarius': 'The net-fighter of old Rome: a trident, a weighted net, and no helmet. Win an exchange and the net flies, leaving the opponent tangled and slow.' |
| [src/codex.js:38](../src/codex.js#L38) | 'class:ashHungry': 'A cult of fire-eaters who believe every wound they cause feeds the flame inside them. The longer a fight runs, the hotter they burn.' |
| [src/codex.js:39](../src/codex.js#L39) | 'class:bloodBearer': 'Dual-wielders. Lose an exchange to a Blood-Bearer and the second blade is already coming.' |
| [src/codex.js:40](../src/codex.js#L40) | 'class:thornBlade': 'Duelists who fight with a barbed blade and a cruel patience. Every exchange they win leaves something in the wound that slows the next.' |
| [src/codex.js:41](../src/codex.js#L41) | 'class:samnite': 'The oldest gladiators of Rome, armed like the Samnite warriors Rome defeated: a big shield, a short sword, and a wall-like calm even when their head is ringing.' |
| [src/codex.js:42](../src/codex.js#L42) | 'weapon:club': 'Crude, heavy and humiliating. A good hit leaves a champion face-down in the sand.' |
| [src/codex.js:43](../src/codex.js#L43) | 'weapon:fists': "A fist-fighter has no weapon to lose. Their specialty is taking yours away." |
| [src/codex.js:44](../src/codex.js#L44) | 'weapon:bow': 'Range wins the opening exchanges, before a melee fighter can close the gap.' |
| [src/codex.js:45](../src/codex.js#L45) | 'weapon:spear': 'The oldest reach advantage in the world. Spearmen strike first and keep archers honest.' |
| [src/codex.js:46](../src/codex.js#L46) | 'weapon:axe': 'A heavy, honest weapon. It does not wound so much as open.' |
| [src/codex.js:47](../src/codex.js#L47) | 'weapon:dagger': 'For fighters who strike before the other has drawn breath: a knife is fastest when it is already moving.' |
| [src/codex.js:48](../src/codex.js#L48) | 'weapon:sword': 'The gladius: short, quick, and as good at turning a blow aside as dealing one.' |
| [src/codex.js:49](../src/codex.js#L49) | 'weapon:flail': 'A ball and chain that wraps around shields and laughs at armour.' |
| [src/codex.js:50](../src/codex.js#L50) | 'weapon:gun': 'Contraband from another century. Loud, armour-piercing, and slow to reload.' |

The hidden Rebellion section:

| Where | Text |
|---|---|
| [src/codex.js:133](../src/codex.js#L133) | ['mark', 'The broken chain', 'The rebels\' sign, chalked on doors across the city. Copy it, and they know you have answered.'] |
| [src/codex.js:134](../src/codex.js#L134) | ['political', 'Political prisoners', 'Some of the Liaison\'s prisoners were locked up for what they said, not what they did. Their prison records give them away to anyone who reads closely, and they always come cheap: someone pays to place them in a house.'] |
| [src/codex.js:135](../src/codex.js#L135) | ['officer', 'The Officer', 'A former centurion. Freed, an officer arms your barracks for the rising without costing you any gear.'] |
| [src/codex.js:136](../src/codex.js#L136) | ['scribe', 'The Scribe', 'A clerk from the palace archives. Freed, a scribe sometimes sends a forged imperial pass, good for one visit from the Praetorians.'] |
| [src/codex.js:137](../src/codex.js#L137) | ['priest', 'The Priest', 'A priest of a forbidden god. Freed, a priest\'s blessing lifts every fighter\'s Morale each month.'] |
| [src/codex.js:138](../src/codex.js#L138) | ['courier', 'The Courier', 'A runner who knows every alley. Freed, a courier keeps the Praetorians looking elsewhere: suspicion falls each month.'] |
| [src/codex.js:139](../src/codex.js#L139) | ['suspicion', 'The Emperor\'s eye', 'Every favour you do the rebels draws the palace\'s attention, and so does every prisoner and every freed contact. A Praetorian taking notes, Favour slipping for no reason, a curious guest: these are the signs. Ignore them and the Praetorians come at dawn.'] |
| [src/codex.js:140](../src/codex.js#L140) | ['freed', 'The freed', 'Everyone you free becomes a contact outside the Ludus. When the day comes, they will be in the crowd: each one a voice cheering your champion (+5% win chance, up to +20%). The armed barracks rise with them (+10%).'] |
| [src/codex.js:141](../src/codex.js#L141) | ['usurper', 'Silbannacus', 'He took the throne with a knife and a bribed legion, and he has feared knives ever since. The rebels say a usurper can be usurped.'] |
| [src/codex.js:142](../src/codex.js#L142) | ['coup', 'The day of the games', 'When the barracks are armed, the rebels trust you, and your champion is ready, the Emperor will come to watch the Grand Final. If your champion wins it, the empire changes hands.'] |

## 12. Names, flavour and descriptions (lower priority)

Short, everywhere. Some carry rules: keep the numbers accurate.

| Where | Text |
|---|---|
| [src/data.js:592](../src/data.js#L592) | Fighter name pool |
| [src/data.js:145](../src/data.js#L145) | Rival houses |
| [src/data.js:166](../src/data.js#L166) | Patrons |
| [src/data.js:177](../src/data.js#L177) | Emperor's Decrees |
| [src/data.js:263](../src/data.js#L263) | Kinds and their traits |
| [src/data.js:273](../src/data.js#L273) | Classes |
| [src/data.js:286](../src/data.js#L286) | Signature moves |
| [src/data.js:452](../src/data.js#L452) | Buildings |
| [src/data.js:321](../src/data.js#L321) | Decor |
| [src/data.js:534](../src/data.js#L534) | Fight items |
| [src/data.js:414](../src/data.js#L414) | Gods' Days (festivals) |
| [src/data.js:568](../src/data.js#L568) | Boss arena rules |
| [src/data.js:217](../src/data.js#L217) | Scars |

## 13. New in 5.2.0 and 5.3.0 (first drafts, marked PLACEHOLDER in the code)

Every line below is a first draft. The rows show the code around the words; change only the words inside the quotes.

**Nemeses**

| Where | Text |
|---|---|
| [src/data.js:654](../src/data.js#L654) | Epithets: epithets: ['the Butcher', 'Bonebreaker', 'the Jackal', 'Sandreaper', 'the Grinning', 'Widowmaker', 'the Patient', 'Ironhide', 'the Mocking', 'Gravedigger', 'the Smiling Knife', 'Lionheart'], |
| [src/run/houses.js:305](../src/run/houses.js#L305) | `${n.name} ${n.nemesis.epithet} is back, in ${arenaName(bout.tier)}. They remember your house.`, 'warn' |
| [src/run/houses.js:319](../src/run/houses.js#L319) | `${opp.name} will be remembered in your house as ${opp.name} ${n.nemesis.epithet}.`, 'warn' |
| [src/run/houses.js:337](../src/run/houses.js#L337) | `Beat the house's nemesis, ${opp.name} ${opp.nemesis.epithet}${opp.nemesis.victims.length ? `, who had killed ${opp.nemesis.victims.join(' and ')}` : ''}.` |
| [src/run/houses.js:338](../src/run/houses.js#L338) | `${fighter.name} beats ${opp.name} ${opp.nemesis.epithet}! +${gold} Gold, +${NEMESIS.renown} Renown. The house breathes again.`, 'good' |

**The Emperor's demands** (`say` is his line; `goal` is the rule, keep it accurate)

| Where | Text |
|---|---|
| [src/data.js:642](../src/data.js#L642) | topWin: { goal: 'Win a match in your top arena', say: 'My guests are bored, Lanista. Give them a victory in your top arena this month.' }, |
| [src/data.js:643](../src/data.js#L643) | bloodied: { goal: 'Win a Bloodied Victory (a win with 2+ injuries)', say: 'I want to see blood on a winner. Win me a bloody victory this month.' }, |
| [src/data.js:644](../src/data.js#L644) | kill: { goal: 'Finish a beaten opponent (thumbs down)', say: 'The crowd grows soft. Give them a death this month.' }, |
| [src/data.js:645](../src/data.js#L645) | spare: { goal: 'Spare a beaten opponent (thumbs up)', say: 'The Senate calls me cruel. Show them my clemency: spare someone in the arena this month.' }, |
| [src/data.js:646](../src/data.js#L646) | twoArenas: { goal: 'Win in two different arenas on fight day', say: 'Show me the depth of your house. Win in two of my arenas this month.' }, |
| [src/main.js:199](../src/main.js#L199) | scene = { id: 'demand', beat: 0, beats: [{ speaker: 'emperor', text: DEMANDS[run.demand.id].say }, { speaker: 'steward', text: `The Emperor's demand: ${DEMANDS[run.demand.id].goal}, by the end of this month's fight day. Meet it and he pays in Favour and Gold; miss it and he remembers.` }] }; |
| [src/run/houses.js:537](../src/run/houses.js#L537) | `The Emperor demands: ${DEMANDS[run.demand.id].goal}, by the end of this month's fight day.`, 'event' |

**The Patron Lounge** (policy names, and their rules text)

| Where | Text |
|---|---|
| [src/data.js:621](../src/data.js#L621) | breadAndCircuses: { name: 'Bread and Circuses', cost: 3, lean: 'loyalist', desc: 'Every purse pays 25% more.' }, |
| [src/data.js:622](../src/data.js#L622) | edictOfMercy: { name: 'Edict of Mercy', cost: 2, lean: 'reformist', desc: 'Sparing a beaten opponent earns Favour in every arena, not just your top one.' }, |
| [src/data.js:623](../src/data.js#L623) | lowerTribute: { name: 'Lower the Tribute', cost: 4, lean: 'reformist', desc: 'This year\'s tribute is 30% lower.' }, |
| [src/data.js:624](../src/data.js#L624) | unleashLions: { name: 'Unleash the Lions', cost: 3, lean: 'loyalist', desc: 'Bosses fight with +1 Power, but beating one pays double Prestige.' }, |
| [src/data.js:625](../src/data.js#L625) | grainToLudus: { name: 'Grain to the Ludus', cost: 2, lean: 'neutral', desc: '+5 comfort for every fighter.' }, |
| [src/data.js:626](../src/data.js#L626) | purgePrisons: { name: 'Purge the Prisons', cost: 2, lean: 'loyalist', desc: 'No political prisoners are offered while it lasts.' }, |
| [src/data.js:627](../src/data.js#L627) | amnesty: { name: 'Amnesty', cost: 2, lean: 'reformist', desc: 'Political prisoners are twice as common while it lasts.' }, |
| [src/run/houses.js:491](../src/run/houses.js#L491) | `Senators dine at your table${star ? ` and admire ${star.name}` : ''}. +${gain} Influence (now ${run.influence}).`, 'event' |
| [src/run/houses.js:514](../src/run/houses.js#L514) | `The Senate passes ${p.name}: ${p.desc}`, 'event' |

**Bonds and betting**

| Where | Text |
|---|---|
| [src/run/houses.js:434](../src/run/houses.js#L434) | for (const [x, y] of [[a, b], [b, a]]) chronicle(run, x, `Bonded with ${y.name}.` |
| [src/run/houses.js:435](../src/run/houses.js#L435) | `${a.name} and ${b.name} have become fast friends: each is happier while the other is in the house.`, 'good' |
| [src/run/houses.js:464](../src/run/houses.js#L464) | `Grieved for ${f.bond.name}.` |
| [src/run/houses.js:465](../src/run/houses.js#L465) | `${f.name} grieves for ${f.bond.name}.`, 'bad' |
| [src/run/tournaments.js:309](../src/run/tournaments.js#L309) | `You bet ${stake} Gold on ${match.a.f.name} at ×${odds.toFixed(2)}: a win returns ${match.bet.payout} Gold (+${match.bet.payout - stake}).`, 'event' |
| [src/run/tournaments.js:330](../src/run/tournaments.js#L330) | `The bookmakers pay out ${match.bet.payout} Gold on your ${match.bet.stake} Gold bet: +${match.bet.payout - match.bet.stake} profit.`, 'good' |
| [src/run/tournaments.js:337](../src/run/tournaments.js#L337) | } else log(run, `The ${match.bet.stake} Gold bet is lost.`, 'bad' |

**The steward's news**

| Where | Text |
|---|---|
| [src/dialogue.js:379](../src/dialogue.js#L379) | news.push(`Your house has reached level ${after.level}. ${opened.length ? `New in the Estate: ${opened.join(', ')}.` : 'There are new plots to build on in the Estate.'}` |
| [src/dialogue.js:382](../src/dialogue.js#L382) | news.push('New gladiators have arrived in the Market.' |
| [src/dialogue.js:384](../src/dialogue.js#L384) | if (after.liaison && after.liaison !== before.liaison) news.push('The Liaison has a new prisoner on offer.' |
| [src/dialogue.js:385](../src/dialogue.js#L385) | if (after.armourer && after.armourer !== before.armourer && run.armourerStock.length) news.push('The Armourer has new stock.' |
| [src/dialogue.js:387](../src/dialogue.js#L387) | for (const f of raisable(run).filter((x) => !(before.bodies ?? '').split(',').includes(x.id))) news.push(`The priests of Vulcan have taken ${f.name}'s body. They can raise them as a Revenant, for a price (the Market tab).` |

**The Unnatural Temple of Vulcan and Revenants** (5.3.0; the name is yours to change too)

| Where | Text |
|---|---|
| [src/data.js:115](../src/data.js#L115) | deathless: { name: 'Deathless', desc: 'Already died once: the Death Gate opens one injury later.' }, |
| [src/data.js:116](../src/data.js#L116) | graveChill: { name: 'Grave Chill', desc: 'The opponent has −5% win chance every round: nobody wants to fight the dead.' }, |
| [src/data.js:117](../src/data.js#L117) | cinderHeart: { name: 'Cinder Heart', desc: '+1 Power in Rounds 2 and 3: the forge-fire inside wakes slowly.' }, |
| [src/data.js:270](../src/data.js#L270) | revenant: { name: 'Revenant', basePower: 5, traits: ['deathless', 'graveChill', 'cinderHeart'], exotic: true }, |
| [src/data.js:467](../src/data.js#L467) | vulcan: { unique: true, name: 'Unnatural Temple of Vulcan', dept: 'medical', icon: 'forge', cost: [10, 16], req: [2, 3], per: [4, 12], effect: (n) => `Raises a fighter killed in the arena as a Revenant, up to ${n} weeks after their death`, extra: (lv) => (lv >= 2 ? 'Revenants come back with all their strength' : 'Revenants come back with 1 less Power') }, |
| [src/codex.js:36](../src/codex.js#L36) | 'kind:revenant': 'A gladiator who died on the sand and was carried to the Unnatural Temple of Vulcan. The smith-god\'s priests rebuild them in brass and stitched flesh. They remember every fight, and feel nothing at all.', |
| [src/run/roster.js:481](../src/run/roster.js#L481) | `Raised from the dead in the Unnatural Temple of Vulcan, ${run.week - body.diedWeek} week${run.week - body.diedWeek === 1 ? '' : 's'} after falling. ${TRAITS[f.kindTrait].name}.` |
| [src/run/roster.js:482](../src/run/roster.js#L482) | `The priests of Vulcan work through the night. ${f.name} walks out of the forge: a Revenant, brass where the wounds were${lost ? `, and a little weaker (${lost} Power)` : ''}.`, 'event' |
| [src/ui/views.js:918](../src/ui/views.js#L918) | : `<p class="sub">The priests can raise a fighter killed in the arena up to ${effectAt('vulcan', vulcanLv)} weeks after their death, for ${reanimatePrice(run)} Gold. A Revenant keeps their class, level, perks and titles${vulcanLv >= 2 ? '' : ', but comes back with 1 less Power'}. They feel nothing: their Morale settles at ${REANIMATE.morale}, never Inspired and never Discontented.</p> |
| [src/ui/views.js:919](../src/ui/views.js#L919) | ${bodies.length ? `<div class="cards two">${bodies.map((f) => fighterCard(f, { stress: false, tag: `Fell ${run.week - f.diedWeek} week${run.week - f.diedWeek === 1 ? '' : 's'} ago · keeps ${effectAt('vulcan', vulcanLv) - (run.week - f.diedWeek)} more`, actions: `<div class="actions">${button(`Raise as a Revenant · ${reanimatePrice(run)} Gold`, 'reanimate', { id: f.id }, reanimateBlocker(run, f.id), 'btn primary small')}</div>` })).join('')}</div>` : '<p class="sub">No bodies to raise. The Temple waits.</p>'}`; |

**The rebel's confession** (5.3.0, src/dialogue.js `rebelScene`: the first political prisoner tells you about the rising; what they've heard depends on your record)

| Where | Text |
|---|---|
| [src/dialogue.js:255](../src/dialogue.js#L255) | if (r.sparedForBlood) heard.push(say("You have spared lives on the sand even when the crowd bayed for blood, and the risk of it was yours. People noticed.") |
| [src/dialogue.js:256](../src/dialogue.js#L256) | else if (r.spared) heard.push(say(`You have shown mercy in the arena${r.spared > 1 ? ` ${r.spared} times` : ""}. The crowd forgets. We don't.`) |
| [src/dialogue.js:257](../src/dialogue.js#L257) | if (r.released) heard.push(say("You have bought fighters, and then set them free. Hardly any Lanista does that.") |
| [src/dialogue.js:258](../src/dialogue.js#L258) | if (r.killed >= 3 && !r.spared) heard.push(say(`You have turned your thumb down ${r.killed} times, and never up. They say you enjoy it. I hope they're wrong.`) |
| [src/dialogue.js:259](../src/dialogue.js#L259) | else if (r.killed) heard.push(say(`You have finished beaten fighters${r.killed > 1 ? ` ${r.killed} times` : ""}. I won't pretend that makes this easier to say.`) |
| [src/dialogue.js:260](../src/dialogue.js#L260) | if (r.morale !== null && r.morale >= 70) heard.push(say("Your fighters eat well and sleep warm. In this city, that counts for something.") |
| [src/dialogue.js:261](../src/dialogue.js#L261) | else if (r.morale !== null && r.morale < 40) heard.push(say("Your fighters are miserable, and miserable people talk. Be careful who hears this.") |
| [src/dialogue.js:262](../src/dialogue.js#L262) | if (!heard.length) heard.push(say("I don't know you yet. I'm telling you anyway, because there is no one else to tell.") |
| [src/dialogue.js:265](../src/dialogue.js#L265) | { speaker: "narrator", text: `That night, ${f.name} asks to speak with you alone.` }, |
| [src/dialogue.js:266](../src/dialogue.js#L266) | say("I am not what the guards wrote on my record. There is a rising against Silbannacus, and I am part of it. The broken chain you may see chalked on doors is ours."), |
| [src/dialogue.js:268](../src/dialogue.js#L268) | say("No one should be owned by another. Not me by you, and not you by the Emperor. We are all his slaves, Lanista. Some of us just hold keys."), |
| [src/dialogue.js:270](../src/dialogue.js#L270) | ...say(kind ? "I think you might be one of us, whether you know it or not. You'll hear from us. Watch the doors." : "I don't know what you are yet. But you'll hear from us. Watch the doors."), |
| [src/dialogue.js:272](../src/dialogue.js#L272) | { label: "I'm listening.", then: [say("Good. Say nothing to anyone, and keep your eyes open.")] }, |
| [src/dialogue.js:273](../src/dialogue.js#L273) | { label: "Why tell me?", then: [say("Because a Lanista with a ludus full of fighters is the most dangerous person in this city, if they choose to be.")] }, |
| [src/dialogue.js:274](../src/dialogue.js#L274) | { label: "Say nothing.", then: [say("Silence. Fine. Silence keeps people alive here.")] }, |

**The rebel speaks again** (src/dialogue.js `rebelStageScene`: once at each stage of the rising)

| Where | Text |
|---|---|
| [src/dialogue.js:314](../src/dialogue.js#L314) | say("You copied the sign. They saw. From now on they'll ask you for small things: a door left open, a stranger fed, a name forgotten."), |
| [src/dialogue.js:315](../src/dialogue.js#L315) | say("Do them, and they'll start to trust you. Refuse them twice, and they'll go quiet for good."), |
| [src/dialogue.js:319](../src/dialogue.js#L319) | say("They trust you now. More than they trust me, I think."), |
| [src/dialogue.js:321](../src/dialogue.js#L321) | say("A rising needs a sword in the arena: one of your fighters, standing in the Grand Tournament when the Emperor watches. And it needs the barracks armed."), |
| [src/dialogue.js:322](../src/dialogue.js#L322) | say("Choose your champion carefully, Lanista. If they fall, the rising falls with them."), |
| [src/dialogue.js:325](../src/dialogue.js#L325) | say("It's ready. The blades are oiled, the crowd knows the signal, and your champion knows what to do."), |
| [src/dialogue.js:326](../src/dialogue.js#L326) | say("When the Emperor comes to watch the Grand Tournament, win the Final. Then look up at his box. We'll do the rest."), |
| [src/dialogue.js:330](../src/dialogue.js#L330) | if (watched) lines.push(say("And be careful. Praetorians have been asking questions about your house. Every favour you do us, they notice.") |
| [src/dialogue.js:350](../src/dialogue.js#L350) | return [{ speaker: "narrator", text: `${f.name} finds you alone again.` }, ...lines]; |

**5.4.0: the rebel's slower reveal** (the confession now waits for trust; this scene comes first, after you copy the chalk sign)

| Where | Text |
|---|---|
| [src/dialogue.js:316](../src/dialogue.js#L316) | say("Who are they? Not yet. Do this well, and one day I'll tell you."), |
| [src/dialogue.js:350](../src/dialogue.js#L350) | return [{ speaker: "narrator", text: confessed ? `${f.name} finds you alone again.` : `${f.name} catches your eye across the yard, and waits until the guards have gone.` }, ...lines]; |

**5.4.0: the Emperor's demands, met and missed** (src/dialogue.js `demandMetScene`, `demandMissedScene`)

| Where | Text |
|---|---|
| [src/dialogue.js:283](../src/dialogue.js#L283) | { speaker: "emperor", text: "Good. That is what I asked for, and you gave it to me. I remember those who please me." }, |
| [src/dialogue.js:289](../src/dialogue.js#L289) | { speaker: "emperor", text: "I asked you for one thing, Lanista. One. The month is over, and I am still waiting." }, |

**5.4.0: the Emperor's spy** (an ordinary event, once a career from Year 2; src/events.js `emperorsSpy`)

| Where | Text |
|---|---|
| [src/events.js:169](../src/events.js#L169) | text: ({ f }) => `Your steward brings you a letter he found sewn into ${f}'s bedroll, addressed to the Praetorian prefect. ${f} has been reporting on your house to the palace.`, |
| [src/events.js:171](../src/events.js#L171) | { label: 'Let them be, and mind what you say', effects: { favor: 3, spy: 'keep' } }, |
| [src/run/eventsEngine.js:124](../src/run/eventsEngine.js#L124) | chronicle(run, f, 'Unmasked as the Emperor\'s spy, and executed in the yard.'); |

**5.4.0: quests** (src/quests.js: the steward's assignments, what fighters want, the cause's requests, the rival house; `goal` texts are rules, keep them accurate)

| Where | Text |
|---|---|
| [src/quests.js:18](../src/quests.js#L18) | say: 'One fighter is a hobby, Lanista. Two is a house. Find a second gladiator.' }, |
| [src/quests.js:20](../src/quests.js#L20) | say: 'Your predecessor\'s banners still hang in the yard. Nobody has cheered them in years. Win a match, and they will.' }, |
| [src/quests.js:22](../src/quests.js#L22) | say: 'The barracks smell of damp and old fear. A bird, a brazier, anything. Happy fighters train harder.' }, |
| [src/quests.js:24](../src/quests.js#L24) | say: 'We cannot grow a house in a single room. Upgrade the Quarters.' }, |
| [src/quests.js:26](../src/quests.js#L26) | say: 'Every house worth its name started in the Dirt Pits. Ours stayed there too long. Beat their Boss, and we leave.' }, |
| [src/quests.js:28](../src/quests.js#L28) | say: 'The old Lanista sold half the estate to pay his wine merchant. Build on it again.' }, |
| [src/quests.js:30](../src/quests.js#L30) | say: 'When I was a boy this house fed twenty fighters. Four would be a start.' }, |
| [src/quests.js:36](../src/quests.js#L36) | say: 'The Bronze Arena remembers our colours. Remind it.' }, |
| [src/quests.js:38](../src/quests.js#L38) | say: 'A house is known by its champions. Make one that people name in the taverns.' }, |
| [src/quests.js:40](../src/quests.js#L40) | say: 'The senators have started asking who we are. Let\'s give them a reason: reach House level 3.' }, |
| [src/quests.js:46](../src/quests.js#L46) | say: 'Your predecessor never saw the Silver Coliseum from the sand. You will.' }, |
| [src/quests.js:48](../src/quests.js#L48) | say: 'We are nearly what we were. House level 4, and I will stop counting the old days.' }, |
| [src/quests.js:52](../src/quests.js#L52) | say: 'The Emperor\'s own arena. This house has never won there. Not once.' }, |
| [src/quests.js:54](../src/quests.js#L54) | say: 'One fight left, Lanista. The one they will sing about.' }, |
| [src/quests.js:56](../src/quests.js#L56) | export const STEWARD_INTRO = 'This house was great once, before your predecessor drank it away. I kept a list of what we lost. Let\'s win it back, one thing at a time.'; |
| [src/quests.js:64](../src/quests.js#L64) | export const stewardDone = (task) => `Done: ${task.goal.charAt(0).toLowerCase()}${task.goal.slice(1)}. The house is a little more itself again.`; |
| [src/quests.js:74](../src/quests.js#L74) | ask: (w) => `${w.name} beat me, and laughed doing it. When they come back, send me. Nobody else.`, |
| [src/quests.js:75](../src/quests.js#L75) | thanks: (w) => `${w.name} won't laugh again. Thank you for trusting me with it.`, |
| [src/quests.js:76](../src/quests.js#L76) | sulk: () => 'They\'re gone, and I never got my answer.', |
| [src/quests.js:82](../src/quests.js#L82) | ask: (w) => `I have fought in ${w.arena} long enough to know I can rule it. Give me the chance to be its Champion.`, |
| [src/quests.js:83](../src/quests.js#L83) | thanks: (w) => `Champion of ${w.arena}. My mother would have wept. Then she would have bet on me.`, |
| [src/quests.js:84](../src/quests.js#L84) | sulk: () => 'I asked for one chance. The months went by, and I watched others take it.', |
| [src/quests.js:90](../src/quests.js#L90) | ask: (w) => `I don't ask for much. But a ${w.item} in my room would make these walls feel less like a cell.`, |
| [src/quests.js:91](../src/quests.js#L91) | thanks: (w) => `The ${w.item}. You remembered. I sleep better already.`, |
| [src/quests.js:92](../src/quests.js#L92) | sulk: () => 'Never mind. I didn\'t really expect it.', |
| [src/quests.js:98](../src/quests.js#L98) | ask: (w) => `${w.name} fights like nobody I've seen. If I could spar with them, even once, I'd learn more than in a year of drills.`, |
| [src/quests.js:99](../src/quests.js#L99) | thanks: (w) => `${w.name} says I have a terrible guard and a good heart. I'll fix the guard.`, |
| [src/quests.js:100](../src/quests.js#L100) | sulk: () => 'I suppose a veteran has better things to do than teach me.', |
| [src/quests.js:106](../src/quests.js#L106) | ask: () => 'I have bled for this house long enough. Let me go while I can still walk out of the gate.', |
| [src/quests.js:107](../src/quests.js#L107) | thanks: () => 'Thank you, Lanista. I\'ll tell them in the taverns that you were fair.', |
| [src/quests.js:108](../src/quests.js#L108) | sulk: () => 'So I fight on. Fine. But don\'t expect me to be glad of it.', |
| [src/quests.js:119](../src/quests.js#L119) | ask: 'We need ears in your house. Build a gallery where the walls carry voices: you\'ll hear what the guards say about you, and we\'ll know how close the rising is. It needs a free plot in your Estate.', |
| [src/quests.js:120](../src/quests.js#L120) | thanks: 'The gallery is built. Listen well, Lanista. We are.', |
| [src/quests.js:121](../src/quests.js#L121) | sulk: 'No gallery. Then we stay deaf, and so do you.', |
| [src/quests.js:127](../src/quests.js#L127) | ask: (q, lounge) => `The Senate can do more for us than any blade. Get ${q.name} passed.${lounge ? ' Your Patron Lounge gives you a seat at their table: use it.' : ' If you have no seat at their table, buy one: build a Patron Lounge.'}`, |
| [src/quests.js:128](../src/quests.js#L128) | thanks: (q) => `${q.name}. The streets heard about it before the ink was dry. Well done.`, |
| [src/quests.js:129](../src/quests.js#L129) | sulk: () => 'The Senate went home and the law never came. The cause noticed.', |
| [src/quests.js:134](../src/quests.js#L134) | export const GALLERY_INTRO = 'The walls of the Whispering Gallery carry every voice in the house to one small room.'; |
| [src/quests.js:153](../src/quests.js#L153) | named: (house, champ) => `${house} names its champion: ${champ}. "Enjoy your little house while it lasts," their Lanista sends word.`, |
| [src/quests.js:154](../src/quests.js#L154) | arrives: (house, champ) => `${champ} of ${house} is on this month's card. Their Lanista has paid the crowd to cheer.`, |
| [src/quests.js:155](../src/quests.js#L155) | beaten: (house, champ) => `${champ} is beaten. In the stands, the Lanista of ${house} leaves before the crowd does.`, |
| [src/quests.js:156](../src/quests.js#L156) | wins: (house, champ) => `${champ} of ${house} wins, and their Lanista toasts your house from across the sand.`, |
| [src/quests.js:157](../src/quests.js#L157) | killed: (house, champ) => `${champ} is dead. ${house} will name another champion, and they will want blood.`, |
| [src/quests.js:158](../src/quests.js#L158) | eyeing: (house, name) => `${house} has its eye on ${name} in the Market. Buy them this week, or they will.`, |
| [src/quests.js:159](../src/quests.js#L159) | bought: (house, name) => `${house} buys ${name} from the Market before you could.`, |

**5.4.1: new drafts** (playtest LLM-11: the steward's middle assignments, a word for assignments already done, and friendships. The pair lines are chosen by who the two fighters are; the steward's full explanation plays only for the first friendship)

| Where | Text |
|---|---|
| [src/quests.js:32](../src/quests.js#L32) | say: 'The old training posts are rotten through. Fighters can only learn as much as the yard can teach. Upgrade the Trainer Room.' }, |
| [src/quests.js:34](../src/quests.js#L34) | say: 'Before we take the Bronze Arena, let them see our colours on the winners\' rail. One tournament, Lanista.' }, |
| [src/quests.js:42](../src/quests.js#L42) | say: 'The Silver crowds pay to see real skill. Our yard can\'t teach it yet. Trainer Room, level 3.' }, |
| [src/quests.js:44](../src/quests.js#L44) | say: 'Three fights in one day, and the last against the best they have. Win one of those days, and the Silver Coliseum will know us.' }, |
| [src/quests.js:50](../src/quests.js#L50) | say: 'The Emperor watches from his box in the Imperial Coliseum. Make him learn our name: win a tournament there.' }, |
| [src/quests.js:57](../src/quests.js#L57) | export const stewardAlready = (goals) => `I was going to ask for more, but you got there first: ${goals.join('; ')}. The house is ahead of my list.`; |
| [src/quests.js:139](../src/quests.js#L139) | narrator: (a, b, how) => `${how === 'exhibition' ? `After the bout in the ring, ${a} offers ${b} a hand up.` : `That night, ${a} and ${b} share a jug of wine by the brazier.`}`, |
| [src/quests.js:142](../src/quests.js#L142) | [(b) => `${b} fights like someone I'd want at my back. Don't tell them I said so.`, (a) => `${a}? Fine. Somebody has to keep them alive.`], |
| [src/quests.js:143](../src/quests.js#L143) | [(b) => `${b} snores like a bear. But they shared their bread when I had none.`, (a) => `And ${a} never once told the others I cried after my first fight.`], |
| [src/quests.js:144](../src/quests.js#L144) | [(b) => `I owe ${b} a cup of wine for every time they've watched my back. That's a lot of wine.`, (a) => `${a} pays for none of it. I keep count anyway.`], |
| [src/quests.js:145](../src/quests.js#L145) | [(b) => `${b} and I came from opposite ends of the Empire. Turns out the sand is the same everywhere.`, (a) => `So is the bad food. ${a} can have mine.`], |
| [src/quests.js:147](../src/quests.js#L147) | stewardAgain: (a, b) => `Another friendship: ${a} and ${b}. You know what that means by now, Lanista. Keep them both alive.`, |
| [src/quests.js:148](../src/quests.js#L148) | steward: (a, b, comfort, gap) => `${a} and ${b} are friends now. Each is happier while the other is in the house (+${comfort} comfort). If one is ${gap} or more levels above the other, they'll teach them a little every week. And if one dies, the other will grieve.`, |

**5.4.2: the Emperor's summons** (src/quests.js `SUMMONS_LINES`; the steward's line states the rule, keep it accurate)

| Where | Text |
|---|---|
| [src/quests.js:186](../src/quests.js#L186) | ask: 'The games in my Coliseum have grown dull, Lanista. I want new blood on the Imperial sand. Send me one of yours on this month\'s fight day.', |
| [src/quests.js:187](../src/quests.js#L187) | steward: (favor) => `A summons, not a request. On fight day, send a fighter to the Imperial Coliseum against one of its regulars, told to yield at the Death Gate or to fight to the death. Or refuse him, and lose ${-favor} Favour.`, |
| [src/quests.js:188](../src/quests.js#L188) | refused: 'You refuse me? I will remember the name of your house, Lanista. I will remember it at every dinner.', |
| [src/quests.js:189](../src/quests.js#L189) | won: (f) => `${f} beat my champion? On my own sand? Well. Someone bring me that fighter's name, I want to say it again.`, |
| [src/quests.js:190](../src/quests.js#L190) | survived: (f) => `${f} lost, but still stood at the end. The crowd liked them. So, for a moment, did I.`, |
| [src/quests.js:192](../src/quests.js#L192) | yielded: (f) => `${f} begged for their life on my sand. I let them keep it. I will not forget the begging.`, |
| [src/quests.js:193](../src/quests.js#L193) | died: (f) => `${f} died well. That is all I asked of them.`, |

**5.4.0: the steward and the house log**

| Where | Text |
|---|---|
| [src/run/tournaments.js:508](../src/run/tournaments.js#L508) | log(run, `Reaching the Boss earns respect: the ${bout.buyIn} Prestige buy-in is returned.`, 'event'); |
| [src/run/tournaments.js:857](../src/run/tournaments.js#L857) | log(run, beatYou ? `${opp.name} will remember this, and will be waiting for you.` : `${opp.name} never had to fight you. They will be waiting next time, stronger.`, 'warn'); |
| [src/ui/views.js](../src/ui/views.js) `overtrainModal` | The steward's overtraining question: "Before you end the week: another week of training and … will be Overtrained (Stress 50+)." |

**The crowd remembers its dead** (a Revenant's first fight back)

| Where | Text |
|---|---|
| [src/ui/fightView.js:407](../src/ui/fightView.js#L407) | ${m.a.f.risen && !m.rounds?.length ? `<div class="sub chant">📣 The crowd remembers ${esc(m.a.f.name)}. They chant the name they buried: +${HYPE.risen} hype.</div>` : ''} |
| [src/run/tournaments.js:552](../src/run/tournaments.js#L552) | `Fought again, back from the dead. The crowd chanted their name.` |
| [src/run/tournaments.js:553](../src/run/tournaments.js#L553) | `The crowd chants ${fighter.name}'s name: the dead fighter walks the sand again.`, 'event' |

**Lower arenas** (5.3.0)

| Where | Text |
|---|---|
| [src/ui/views.js:778](../src/ui/views.js#L778) | If nobody from your house fights here this week, the tournament goes ahead without you and the arena moves on. |

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
| [src/data.js:330](../src/data.js#L330) | Rock Garden: Comfort for Morale and −8 Stress a week; shapes a Phlegmatic temper. On a Rest week they meditate: −10 more Stress, +1 XP, and half a step toward conquering a fear. |
| [src/data.js:331](../src/data.js#L331) | Spiky Bed: No comfort at all; shapes a Melancholic temper. A win taken with even one wound makes them Battle-Hardened (usually it takes two). |
| [src/data.js:332](../src/data.js#L332) | Skull Rack: A little comfort; shapes a Choleric temper. A severe wound scars them Enraged, never Afeared. |
| [src/data.js:336](../src/data.js#L336) | Wine Amphora: Plenty of comfort; shapes a Sanguine temper. The crowd warms to them: each fight starts with +5 Hype. |
| [src/run/roster.js:410](../src/run/roster.js#L410) | Story: `${HUMOUR_DRIFT.weeks} weeks with the ${DECOR[dom.item].name} changed their temper: now ${name}.` |
| [src/run/roster.js:411](../src/run/roster.js#L411) | `${HUMOUR_DRIFT.weeks} weeks with the ${DECOR[dom.item].name} have changed ${f.name}: now ${name}.`, 'event' |
| [src/run/roster.js:419](../src/run/roster.js#L419) | `${f.name} spends the rest day raking the Rock Garden, and comes back quieter.`, 'good' |
| [src/run/roster.js:421](../src/run/roster.js#L421) | `${f.name} sits with their fear of ${sc.vs} fighters` … `Meditated on their fear of ${sc.vs} fighters, and let it go.` |
| [src/run/tournaments.js:574](../src/run/tournaments.js#L574) | Story: 'Won wounded, then slept the night on spikes, and woke Battle-Hardened.' |
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
| [src/quests.js](../src/quests.js) `MOLE_CLUES`, `MOLE_TELLS`, `LIAISON_LINES` | The four clues, the three market tells; "Rome" became "the empire" (the setting is Battleworld). |
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

| Where | Text |
|---|---|
| [src/voices.js](../src/voices.js) `prefectPosture`, `lastWordsFor`, `backstoryScene` | The prefect's five postures; last words (by role, friend, Title, or kind and Humour); level-3 backstories for six kinds, each with two replies, and four Humour endings. |
| [src/gazette.js](../src/gazette.js) `cityHeadlines` | Word in the city: the street's headlines (rising, prefect, cousin, unrest, moles, arena feats, the fallen, the spared, Nemeses, the Senate, rival houses, festivals, winter, the first month). |
| [src/run/plotEngine.js](../src/run/plotEngine.js) `betray`, `resolveCoup` | The cousin's epilogue lines (named asker, the woman at the gate, the cousin as champion, a toast to a fallen cousin) and the spared opponent at the tunnel gate. |
