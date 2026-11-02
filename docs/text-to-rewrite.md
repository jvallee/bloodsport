# Text to rewrite in your voice

Every piece of story text in the game, with the file and line where it lives (click to open). Generated from the code on 2026-11-02, so line numbers match the current `main`. After code changes, `npm run text-index` moves every link to its text's new line and lists any text it can't find.

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
| [src/tutorial.js:10](../src/tutorial.js#L10) | **Another Day on Your Computer** |
| [src/tutorial.js:12](../src/tutorial.js#L12) | (starts here, several lines) You are scrolling, cursing, dare I say surfing the web. Suddenly the screen shimmers. A hand reaches out of it, grabs you by the head and pulls you through.       You land hard on cold stone, under a sun that isn't yours. This is Battleworld, whose portals pull warriors from every world and century to feed the arenas of Emperor Silbannacus, a Roman usurper who fused magic and machinery into an empire of bloodsport.       Then everything goes dark. |
| [src/tutorial.js:16](../src/tutorial.js#L16) | **How you win** |
| [src/tutorial.js:19](../src/tutorial.js#L19) | (starts here, several lines) Climb four arenas, from the Dirt Pits to the Imperial Coliseum. Each arena holds a circuit: Tournament 1 → Tournament 2 → Boss.       Beat all four Bosses, then win the Grand Tournament, and the Emperor names you Master of the Games.       You don't fight. You recruit, train, heal and choose who to send, then make the hard calls from your box above the sand. |
| [src/tutorial.js:22](../src/tutorial.js#L22) | **How you lose** |
| [src/tutorial.js:25](../src/tutorial.js#L25) | (starts here, several lines) The Emperor watches you through Imperial Favour. Losing a Boss in your top arena, forfeiting, and failing to pay his yearly tribute all cost Favour. At 0 Favour you're executed.       You also fall if every gladiator is dead and you can't afford another, or if your miserable gladiators revolt.       Your fighters are mortal. One injury is survivable; with two injuries, losing a round can kill them. Between rounds you can always capitulate to save a fighter, at the cost of the match. |
| [src/tutorial.js:28](../src/tutorial.js#L28) | **Power, Speed and luck** |
| [src/tutorial.js:29](../src/tutorial.js#L29) | (starts here, several lines) Power wins rounds. What counts is the gap between the fighters: +1 is 55% per round, +3 is 70%, +5 is 95%.       Speed decides who strikes first (+10% to win that round, and the first chance to wound), and being faster makes you harder to wound. A balanced fighter wins and stays healthy.       Traits, weapons and injuries tilt the odds further. Every number is shown in the fight and explained in the Codex. Good luck, Lanista. |

## 2. The hidden plot (v6): cards

Each card has a title, its text, and choice labels. A choice's visible stakes ("−15 Morale") are generated from its effects, so only the labels are yours.


**Chalk on the door** (`chalkMark`)

| Where | Text |
|---|---|
| [src/plot.js:77](../src/plot.js#L77) | Title: Chalk on the door |
| [src/plot.js:79](../src/plot.js#L79) | Overnight, someone chalked a sign on {f}'s door: a broken chain. {f} says nothing, and watches to see what you'll do. |
| [src/plot.js:81](../src/plot.js#L81) | Choice: Scrub it off |
| [src/plot.js:82](../src/plot.js#L82) | Choice: Copy the sign onto another door |

**A cousin at the gate** (`cousinVisit`)

| Where | Text |
|---|---|
| [src/plot.js:87](../src/plot.js#L87) | Title: A cousin at the gate |
| [src/plot.js:89](../src/plot.js#L89) | A man who says he is {f}'s cousin asks to visit the barracks. He has no letter, and he isn't looking at {f}. |
| [src/plot.js:91](../src/plot.js#L91) | Choice: Turn him away |
| [src/plot.js:92](../src/plot.js#L92) | Choice: Let him in |

**Blood at the gate** (`hideWounded`)

| Where | Text |
|---|---|
| [src/plot.js:96](../src/plot.js#L96) | Title: Blood at the gate |
| [src/plot.js:98](../src/plot.js#L98) | A man bleeding from a Praetorian blade collapses at your gate after curfew. The watch will pass within the hour. |
| [src/plot.js:100](../src/plot.js#L100) | Choice: Call the watch |
| [src/plot.js:101](../src/plot.js#L101) | Choice: Hide him in the Medbay |

**Pamphlets in the storeroom** (`pamphlets`)

| Where | Text |
|---|---|
| [src/plot.js:105](../src/plot.js#L105) | Title: Pamphlets in the storeroom |
| [src/plot.js:107](../src/plot.js#L107) | Your steward found a bundle of pamphlets behind the grain jars: the Emperor drawn as a jackal on a stolen throne. |
| [src/plot.js:109](../src/plot.js#L109) | Choice: Burn them |
| [src/plot.js:110](../src/plot.js#L110) | Choice: Leave them where they are |

**A bout for the street** (`yardBout`)

| Where | Text |
|---|---|
| [src/plot.js:114](../src/plot.js#L114) | Title: A bout for the street |
| [src/plot.js:116](../src/plot.js#L116) | The rebels want the city to see one of their own beat a gladiator of your house in the practice yard. They ask for {f}, and for {f} to lose. |
| [src/plot.js:32](../src/plot.js#L32) | Choice: Refuse |
| [src/plot.js:119](../src/plot.js#L119) | Choice: Let {f} take the fall |

**A friend in the cells** (`freeFromCells`)

| Where | Text |
|---|---|
| [src/plot.js:124](../src/plot.js#L124) | Title: A friend in the cells |
| [src/plot.js:131](../src/plot.js#L131) | {f} comes to you at night. "{name} is in the Liaison's cells, and I owe them my life. Buy them, then let them go. They're worth more outside these walls than any purse." |
| [src/plot.js:32](../src/plot.js#L32) | Choice: Refuse |
| [src/plot.js:134](../src/plot.js#L134) | Choice: Buy {name} and let them go (8 Gold) |

**Free me** (`freeMe`)

| Where | Text |
|---|---|
| [src/plot.js:138](../src/plot.js#L138) | Title: Free me |
| [src/plot.js:142](../src/plot.js#L142) | {f} asks to speak to you alone. "Free me. I can do more for the cause outside these walls than inside your arena." |
| [src/plot.js:32](../src/plot.js#L32) | Choice: Refuse |
| [src/plot.js:14](../src/plot.js#L14) | Choice: Free {f} |

**Thrown to the beasts** (`freeCondemned`)

| Where | Text |
|---|---|
| [src/plot.js:149](../src/plot.js#L149) | Title: Thrown to the beasts |
| [src/plot.js:152](../src/plot.js#L152) | {f} has gone pale. "They're throwing {name} to the beasts at the games today, for sedition. You have the Emperor's ear, and a key to every gate in the arena." |
| [src/plot.js:154](../src/plot.js#L154) | Choice: Do nothing |
| [src/plot.js:155](../src/plot.js#L155) | Choice: Plead for clemency (−8 Favour) |
| [src/plot.js:156](../src/plot.js#L156) | Choice: Arrange an escape |

**One of ours across the sand** (`acrossSand`)

| Where | Text |
|---|---|
| [src/plot.js:160](../src/plot.js#L160) | Title: One of ours across the sand |
| [src/plot.js:163](../src/plot.js#L163) | {f} lowers their voice. "{opp}, who fights for {house}, is one of us. If you meet in the arena, beat them if you must, but let them live." |
| [src/plot.js:165](../src/plot.js#L165) | Choice: Promise nothing |
| [src/plot.js:166](../src/plot.js#L166) | Choice: Promise to spare them |

**The forged pass** (`forgedPass`)

| Where | Text |
|---|---|
| [src/plot.js:171](../src/plot.js#L171) | Title: The forged pass |
| [src/plot.js:174](../src/plot.js#L174) | A clerk from the palace archives offers a pass bearing the Emperor's own seal. Shown at the right moment, it will send the Praetorians away once. |
| [src/plot.js:176](../src/plot.js#L176) | Choice: Decline |
| [src/plot.js:177](../src/plot.js#L177) | Choice: Buy it (8 Gold) |

**Steel for the cause** (`armBarracks`)

| Where | Text |
|---|---|
| [src/plot.js:181](../src/plot.js#L181) | Title: Steel for the cause |
| [src/plot.js:185](../src/plot.js#L185) | An old centurion asks for weapons from your storeroom. "When the day comes, the barracks must be armed. Two pieces of steel will do." |
| [src/plot.js:32](../src/plot.js#L32) | Choice: Refuse |
| [src/plot.js:188](../src/plot.js#L188) | Choice: Hand over two pieces of gear |

**The champion** (`recruitChampion`)

| Where | Text |
|---|---|
| [src/plot.js:192](../src/plot.js#L192) | Title: The champion |
| [src/plot.js:200](../src/plot.js#L200) | The rebels want a champion from your house. "When the Emperor comes to the games, the crowd must see one of their own strike the blow." They name {f}, or {g}. |
| [src/plot.js:202](../src/plot.js#L202) | Choice: Keep your fighters out of it |
| [src/plot.js:203](../src/plot.js#L203) | Choice: Sound {f} out ({fOdds}% they say yes) |
| [src/plot.js:203](../src/plot.js#L203) | Choice: Sound {g} out ({gOdds}% they say yes) |

**A curious guest** (`informer`)

| Where | Text |
|---|---|
| [src/plot.js:209](../src/plot.js#L209) | Title: A curious guest |
| [src/plot.js:212](../src/plot.js#L212) | A guest at your table asks a great many questions about where your fighters go at night. |
| [src/plot.js:214](../src/plot.js#L214) | Choice: Say nothing |
| [src/plot.js:215](../src/plot.js#L215) | Choice: Feed him a story |

**The prefect's offer** (`theOffer`)

| Where | Text |
|---|---|
| [src/plot.js:219](../src/plot.js#L219) | Title: The prefect's offer |
| [src/plot.js:222](../src/plot.js#L222) | A Praetorian prefect calls on you, alone. "The Emperor knows there are traitors in the gladiator houses. Give him their names, and he will remember your house kindly." |
| [src/plot.js:224](../src/plot.js#L224) | Choice: Know nothing |
| [src/plot.js:225](../src/plot.js#L225) | Choice: Name the names |

**The Praetorians at dawn** (`raid`)

| Where | Text |
|---|---|
| [src/plot.js:229](../src/plot.js#L229) | Title: The Praetorians at dawn |
| [src/plot.js:235](../src/plot.js#L235) | The Praetorians come at dawn and fill the yard. Their prefect wants a traitor, or a reason to leave without one. |
| [src/plot.js:237](../src/plot.js#L237) | Choice: Pay them off (15 Gold) |
| [src/plot.js:188](../src/plot.js#L188) | Choice: Hand over {f} |
| [src/plot.js:239](../src/plot.js#L239) | Choice: Show the forged pass |
| [src/plot.js:240](../src/plot.js#L240) | Choice: Bar the gates |

**Tonight the Emperor attends** (`coupEve`)

| Where | Text |
|---|---|
| [src/plot.js:245](../src/plot.js#L245) | Title: Tonight the Emperor attends |
| [src/plot.js:248](../src/plot.js#L248) | Silbannacus himself will watch the Grand Final from the imperial box. The barracks are armed. {f} is ready. Every door in the city has a broken chain on it. |
| [src/plot.js:250](../src/plot.js#L250) | Choice: Not tonight |
| [src/plot.js:245](../src/plot.js#L245) | Choice: Tonight |

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
| [src/run.js:575](../src/run.js#L575) | `${name} slips out of the city.`, 'event' |
| [src/run.js:618](../src/run.js#L618) | 'A sealed letter arrives with no name on it. Inside: a pass bearing the Emperor\'s seal.', 'event' |
| [src/run.js:624](../src/run.js#L624) | `A blessing from ${priest.name} reaches the barracks in secret. Spirits lift.`, 'good' |
| [src/run.js:627](../src/run.js#L627) | `${courier.name} sends word: the Praetorians are watching another house this month.`, 'good' |
| [src/run.js:635](../src/run.js#L635) | pick(run.rng.plot, SUSPICION_SIGNS.ready), 'event' |
| [src/run.js:708](../src/run.js#L708) | `${f.name} tried to escape over the wall, and was caught by the watch and executed.`, 'bad'); } |
| [src/run.js:714](../src/run.js#L714) | `${f.name} is taken by the Praetorians and executed in the arena at noon.`, 'bad' |
| [src/run.js:717](../src/run.js#L717) | 'Not tonight. The rebels will wait for the next Grand Tournament.', 'event' |
| [src/run.js:728](../src/run.js#L728) | 'The Praetorians break down the gates. Your house is tried for treason, and the sentence is read at the games.' |
| [src/run.js:747](../src/run.js#L747) | `On your word, the Praetorians drag ${f.name} from the barracks. They are executed at noon.`, 'bad' |
| [src/run.js:749](../src/run.js#L749) | `${c.name} is found hiding in the city, and executed.`, 'bad' |
| [src/run.js:756](../src/run.js#L756) | `A purse of ${purse} Gold arrives from the palace, with the Emperor's thanks.`, 'event' |
| [src/run.js:758](../src/run.js#L758) | run.epilogue = [...(run.epilogue ?? []), victims.length ? `Executed on your word: ${victims.join(', ')}.` : 'You gave the Emperor names. He made sure they were the right ones.'] |
| [src/run.js:769](../src/run.js#L769) | 'The signal is never given. The rebels melt back into the crowd, to wait for another day of games.', 'warn' |
| [src/run.js:775](../src/run.js#L775) | `${fighter.name} wins the Final, turns, and climbs into the imperial box. Silbannacus falls on the sand he filled with blood. The empire is yours to remake.` |
| [src/run.js:777](../src/run.js#L777) | if (freed.length) run.epilogue = [...(run.epilogue ?? []), `In the crowd, the people you freed were the first to cheer: ${freed.join(', ')}.`] |
| [src/run.js:780](../src/run.js#L780) | run.epilogue = [...(run.epilogue ?? []), 'The signal never came: the wrong fighter won the Final, and the moment passed. Somewhere, a chalk mark fades.'] |
| [src/run.js:785](../src/run.js#L785) | `${fighter.name} falls in the Final, and the rising dies with them. The broken chain is scrubbed from every door, but the city remembers.` |

End-screen titles and closing lines:

| Where | Text |
|---|---|
| [src/ui/views.js:107](../src/ui/views.js#L107) | const ENDING_TITLES = { coup: '⛓ The Tyrant Falls', martyr: '⛓ The Rising Fails', treason: '⚖ Tried for Treason' } |
| [src/ui/views.js:109](../src/ui/views.js#L109) | 'Some say a different house could have changed the empire.' |
| [src/ui/views.js:110](../src/ui/views.js#L110) | 'The Emperor remembers your loyalty. So does everyone else.' |

## 5. Career endings (all careers)

| Where | Text |
|---|---|
| [src/run.js:2407](../src/run.js#L2407) | 'You won the Grand Tournament. The Emperor names you Master of the Games.' |
| [src/run.js:2453](../src/run.js#L2453) | `The Emperor's Favour is gone. You are executed in ${formatDate(run.week)}.` |
| [src/run.js:2458](../src/run.js#L2458) | 'Your gladiators revolt and burn the Ludus.' |
| [src/run.js:2464](../src/run.js#L2464) | 'No fighters left and not enough Gold to buy one. Your house falls.' |
| Where | Text |
|---|---|

## 6. Weekly event cards


**Brawl in the barracks** (`brawl`)

| Where | Text |
|---|---|
| [src/events.js:21](../src/events.js#L21) | {f} and {g} came to blows over a bunk. The whole Ludus is watching to see what you do. |
| [src/events.js:23](../src/events.js#L23) | Choice: Throw a feast to make peace (4 Gold) |
| [src/events.js:24](../src/events.js#L24) | Choice: Punish them both |
| [src/events.js:25](../src/events.js#L25) | Choice: Let them settle it in the yard |

**A senator's offer** (`senator`)

| Where | Text |
|---|---|
| [src/events.js:30](../src/events.js#L30) | A senator's slave brings a purse. His master wants {f} to dine at his villa and praise him to the crowd. The Emperor's spies are everywhere. |
| [src/events.js:32](../src/events.js#L32) | Choice: Decline politely |
| [src/events.js:33](../src/events.js#L33) | Choice: Accept the purse |

**Fever in the city** (`plague`)

| Where | Text |
|---|---|
| [src/events.js:38](../src/events.js#L38) | A fever is spreading through the city. Physicians are expensive this week. |
| [src/events.js:40](../src/events.js#L40) | Choice: Pay the physicians (5 Gold) |
| [src/events.js:41](../src/events.js#L41) | Choice: Trust to the gods |

**A wandering lanista** (`trainer`)

| Where | Text |
|---|---|
| [src/events.js:47](../src/events.js#L47) | A retired lanista passing through offers a week of lessons for {f}. He's old, but he has seen everything. |
| [src/events.js:49](../src/events.js#L49) | Choice: Pay him for lessons (6 Gold) |
| [src/events.js:50](../src/events.js#L50) | Choice: Send him on his way |

**Gifts from the stands** (`fans`)

| Where | Text |
|---|---|
| [src/events.js:55](../src/events.js#L55) | Admirers of {f} have left gifts at the gate: coins, flowers, a crude statue. |
| [src/events.js:57](../src/events.js#L57) | Choice: Let them keep the gifts |
| [src/events.js:58](../src/events.js#L58) | Choice: Sell the lot for the house |

**A beast loose in the streets** (`beast`)

| Where | Text |
|---|---|
| [src/events.js:64](../src/events.js#L64) | A lion has escaped from the menagerie. The city watch is offering a reward, and {f} is itching to go. |
| [src/events.js:66](../src/events.js#L66) | Choice: Leave it to the watch |
| [src/events.js:50](../src/events.js#L50) | Choice: Send {f} |

**A merchant caravan** (`caravan`)

| Where | Text |
|---|---|
| [src/events.js:72](../src/events.js#L72) | A caravan from the east stops at your gate, selling War Paint at half price. |
| [src/events.js:74](../src/events.js#L74) | Choice: Not today |
| [src/events.js:75](../src/events.js#L75) | Choice: Buy War Paint (2 Gold) |

**An omen at the shrine** (`omen`)

| Where | Text |
|---|---|
| [src/events.js:81](../src/events.js#L81) | Ravens circle the Ludus shrine. The augur says the gods want an offering. |
| [src/events.js:83](../src/events.js#L83) | Choice: Make an offering (3 Gold) |
| [src/events.js:84](../src/events.js#L84) | Choice: Ignore the birds |

**A night of revelry** (`revelry`)

| Where | Text |
|---|---|
| [src/events.js:90](../src/events.js#L90) | The gladiators beg for a night in the city: wine, music, and no lanista. |
| [src/events.js:92](../src/events.js#L92) | Choice: Forbid it |
| [src/events.js:93](../src/events.js#L93) | Choice: Let them go |

**A spy in the Ludus** (`spy`)

| Where | Text |
|---|---|
| [src/events.js:99](../src/events.js#L99) | Your guards caught a man copying your training records. He wears a rival house's ring. |
| [src/events.js:101](../src/events.js#L101) | Choice: Hand him to the Emperor's guard |
| [src/events.js:102](../src/events.js#L102) | Choice: Ransom him back |

**A stray at the gate** (`injuredDog`)

| Where | Text |
|---|---|
| [src/events.js:108](../src/events.js#L108) | {f} found a half-starved war dog at the gate and wants to keep it. |
| [src/events.js:110](../src/events.js#L110) | Choice: Let them keep it (2 Gold of meat) |
| [src/events.js:111](../src/events.js#L111) | Choice: Turn it away |

**A sparring challenge** (`sparring`)

| Where | Text |
|---|---|
| [src/events.js:116](../src/events.js#L116) | {f} wants to spar with {g} at full strength. "It's how we learn." |
| [src/events.js:118](../src/events.js#L118) | Choice: Wooden swords only |
| [src/events.js:119](../src/events.js#L119) | Choice: Full strength |

**An old wound aches** (`oldWound`)

| Where | Text |
|---|---|
| [src/events.js:124](../src/events.js#L124) | {f} limps out to training, favouring an old wound. They swear it's nothing. |
| [src/events.js:126](../src/events.js#L126) | Choice: Rest them this week |
| [src/events.js:127](../src/events.js#L127) | Choice: Push through it |

**A poet at the gate** (`poet`)

| Where | Text |
|---|---|
| [src/events.js:132](../src/events.js#L132) | A street poet wants to write verses about {f}. For a few coins, the whole city will be singing them. |
| [src/events.js:134](../src/events.js#L134) | Choice: Send him away |
| [src/events.js:135](../src/events.js#L135) | Choice: Pay the poet (4 Gold) |

**An insult in the forum** (`insult`)

| Where | Text |
|---|---|
| [src/events.js:141](../src/events.js#L141) | A rival house's champion mocked {f} in the forum, in front of half the city. {f} wants satisfaction. |
| [src/events.js:143](../src/events.js#L143) | Choice: Forbid the duel |
| [src/events.js:25](../src/events.js#L25) | Choice: Let them settle it |

**A wandering healer** (`healer`)

| Where | Text |
|---|---|
| [src/events.js:149](../src/events.js#L149) | A healer from the eastern provinces offers to treat {f}'s wounds with herbs and hot iron. |
| [src/events.js:151](../src/events.js#L151) | Choice: No, thank you |
| [src/events.js:152](../src/events.js#L152) | Choice: Pay the healer (5 Gold) |

**Crowds at the training yard** (`onlookers`)

| Where | Text |
|---|---|
| [src/events.js:171](../src/events.js#L171) | A crowd has gathered at the gate to watch your gladiators train. Some are offering coins for a look. |
| [src/events.js:173](../src/events.js#L173) | Choice: Keep the gates shut |
| [src/events.js:174](../src/events.js#L174) | Choice: Open the gates |

**An imperial envoy** (`envoy`)

| Where | Text |
|---|---|
| [src/events.js:179](../src/events.js#L179) | An envoy of the Emperor arrives unannounced to inspect your house. He looks bored, and expensive. |
| [src/events.js:181](../src/events.js#L181) | Choice: Show him your discipline |
| [src/events.js:182](../src/events.js#L182) | Choice: Offer him a gift (6 Gold) |

## 7. Fight narration (read every round)

These are templates: keep the `${...}` parts. A line with several variants picks one at random.

| Where | Text |
|---|---|
| [src/narrate.js:45](../src/narrate.js#L45) | `${name(init.first === 'A' ? 'B' : 'A')} is Concussed, so ${name(init.first)} strikes first.` |
| [src/narrate.js:46](../src/narrate.js#L46) | `${name(init.first)}'s Footwork: faster, strikes first.` |
| [src/narrate.js:50](../src/narrate.js#L50) | `Initiative: ${name('A')} ${s.A.total}+${init.rolls.A} vs ${name('B')} ${s.B.total}+${init.rolls.B}.${tie} ${name(init.first)} strikes first.` |
| [src/narrate.js:55](../src/narrate.js#L55) | `${name('A')} wins this round ${fmtPct(r.win.chance)} of the time: ${fmtPct(r.win.base)} from the Delta${bonuses.length ? `. Win-chance bonuses: ${bonuses.join(', ')}` : ''}.` |
| [src/narrate.js:56](../src/narrate.js#L56) | `Round roll: ${name('A')} needs ${roll100(r.win.chance)} or less, rolled ${roll100(r.roll)}. ${name(r.winner)} takes Round ${r.round}.` |
| [src/narrate.js:63](../src/narrate.js#L63) | add(c.hit ? 'hit' : 'miss', `${prefix}: needs ${roll100(c.chance)} or less to wound${pierce}, rolled ${roll100(c.roll)}. ${c.hit ? 'Hit!' : 'Miss.'}` |
| [src/narrate.js:64](../src/narrate.js#L64) | `${att} drinks deep: their own ${c.drained === 'fleshWound' ? 'Flesh Wound' : 'Distraction'} closes (Blood Drinker).` |
| [src/narrate.js:65](../src/narrate.js#L65) | if (c.parry) add(c.parry.success ? 'parry' : 'hit', c.parry.success ? (c.parry.shield ? `${def} catches it on the shield!` : `${def} parries with the Sword! Riposte: +3 Speed next round.`) : `${def}'s parry fails.` |
| [src/narrate.js:92](../src/narrate.js#L92) | `You capitulated. ${you} lives to fight another day.` |
| [src/narrate.js:93](../src/narrate.js#L93) | winner === 'A' ? `${them} died in the arena. ${you} wins.` : `${you} died in the arena.` |
| [src/narrate.js:102](../src/narrate.js#L102) | concussed: 'Concussed, the world spinning' |
| [src/narrate.js:103](../src/narrate.js#L103) | poisoned: 'Poisoned (it counts as two injuries!)' |
| [src/narrate.js:119](../src/narrate.js#L119) | `${second} is still dazed. ${name(init.first)} moves first.` |
| [src/narrate.js:120](../src/narrate.js#L120) | `${name(init.first)} darts in first on quick feet.` |
| [src/narrate.js:124](../src/narrate.js#L124) | `Against the odds, ${name(r.winner)} takes Round ${r.round}!` |
| [src/narrate.js:125](../src/narrate.js#L125) | variant(r, [`${name(r.winner)} dominates Round ${r.round}.`, `${name(r.winner)} overpowers the opposition in Round ${r.round}.`] |
| [src/narrate.js:126](../src/narrate.js#L126) | variant(r, [`${name(r.winner)} edges out Round ${r.round}.`, `${name(r.winner)} wins a hard-fought Round ${r.round}.`, `${name(r.winner)} takes Round ${r.round}.`] |
| [src/narrate.js:131](../src/narrate.js#L131) | c.label === 'Off-hand strike' ? `${att}'s off-hand blade finds a gap!` : `${att}'s elven eyes spot an opening: a swift counter!` |
| [src/narrate.js:132](../src/narrate.js#L132) | `${def} parries ${att}'s blow and ripostes!` |
| [src/narrate.js:136](../src/narrate.js#L136) | `${att} lands a killing blow. ${def} falls and does not rise.` |
| [src/narrate.js:139](../src/narrate.js#L139) | let text = `${att} lands a brutal blow: ${def} is ${INJURY_STORY[inj.tag]}.` |
| [src/narrate.js:141](../src/narrate.js#L141) | if (inj.disabled?.length) text += ` ${def} loses ${inj.disabled.map((s) => slotName((c.defender === 'A' ? m.a : m.b).f, s)).join(' and ')} for this match.` |
| [src/narrate.js:152](../src/narrate.js#L152) | `${you} fought on with the Death Gate open. When the Death Gate is open, capitulating or healing first keeps fighters alive.` |
| [src/narrate.js:153](../src/narrate.js#L153) | `${you} entered overtrained (−1 Power, one ability lost). Rest the week before a fight to keep Stress under 50.` |
| [src/narrate.js:158](../src/narrate.js#L158) | 'You saved your fighter. Heal them in the Medbay before the next bout.'; // capitulated: not "lost anyway" |
| [src/narrate.js:159](../src/narrate.js#L159) | `${you} was the stronger fighter (Delta +${Math.round(avgDelta)}) and lost anyway: favourites still lose now and then. Keep sending them, and read the tactics to tip the odds further.` |
| [src/narrate.js:160](../src/narrate.js#L160) | `${you} was favoured in the rounds (about ${Math.round(chance / 1000)}% each) and lost anyway: the dice turned. Keep sending them.` |
| [src/narrate.js:161](../src/narrate.js#L161) | `${you} was out-powered (Delta ${worst}). Train Power, add Titles, or send a stronger fighter.` |
| [src/narrate.js:162](../src/narrate.js#L162) | `Their weapon pierced your armour. Against Gun or Flail fighters, armour won't save you; win the rounds instead.` |
| [src/narrate.js:163](../src/narrate.js#L163) | 'You saved your fighter. Heal them in the Medbay before the next bout.' |
| [src/narrate.js:165](../src/narrate.js#L165) | `${you} was the stronger fighter (Delta +${Math.round(avg)}) and lost anyway: favourites still lose now and then. Keep sending them, and read the tactics to tip the odds further.` |
| [src/narrate.js:166](../src/narrate.js#L166) | 'An even fight that went the other way. Small edges add up: training, decor and fighting rested.' |

## 8. The crowd's verdict (thumbs up or down) and fight-screen lines

| Where | Text |
|---|---|
| [src/ui/views.js:809](../src/ui/views.js#L809) | The crowd waits${esc(m.opp)}'s fate${esc(f?.name ?? 'Your fighter')} beat ${esc(m.opp)}. ${blood ? '👎 The crowd roars for blood!' : '👍 The crowd chants for mercy.'} |
| Where | Text |
|---|---|
| [src/ui/fightView.js:41](../src/ui/fightView.js#L41) | const SUSPENSE = 1; // the pause ("Steel meets steel…") before the round's winner is announced |
| [src/ui/fightView.js:117](../src/ui/fightView.js#L117) | s.champion ? row('The crowd', 'boos a champion back in the pits', 'bad') : s.crushing ? row('The crowd', 'jeers the mismatch', 'bad') : '' |
| [src/ui/fightView.js:123](../src/ui/fightView.js#L123) | s.bribed ? row('Crowd Bribe', 'the crowd forgave the capitulation', 'good') : '' |
| [src/ui/fightView.js:126](../src/ui/fightView.js#L126) | s.verdict && s.verdict === s.mercy ? row('The crowd', 'roars its approval', 'good') : '' |
| [src/ui/fightView.js:134](../src/ui/fightView.js#L134) | // Thumbs up or down: the beaten opponent's fate, with what the crowd wants. |
| [src/ui/fightView.js:142](../src/ui/fightView.js#L142) | const spare = blood ? `${favor}; ${house} will owe you a life (−1 Power against you)` : `${favor}, +${MERCY.crowdRenown} Renown, +${MERCY.crowdMorale} Morale (the crowd agrees)` |
| [src/ui/fightView.js:143](../src/ui/fightView.js#L143) | const kill = blood ? `+${MERCY.killRenown + MERCY.crowdRenown} Renown, +${MERCY.crowdMorale} Morale, a kill (the crowd agrees)` : `+${MERCY.killRenown + MERCY.infamyRenown} Renown (infamy), a kill${m.house ? `; ${house} will swear a feud` : ''}` |
| [src/ui/fightView.js:231](../src/ui/fightView.js#L231) | const pre = mortalDanger(m.a) ? `⚠ MORTAL DANGER from the first round: ${esc(m.a.f.name)} enters with ${effectiveInjuries(m.a.f)} injur${effectiveInjuries(m.a.f) === 1 ? 'y' : 'ies'}. Losing Round 1: about ${Math.round(deathRisk(m) * 100)}% chance of death. Capitulating is only possible between rounds.` : '' |
| [src/ui/fightView.js:235](../src/ui/fightView.js#L235) | const alert = danger ? `⚠ MORTAL DANGER: ${esc(m.a.f.name)} has ${effectiveInjuries(m.a.f)} injur${effectiveInjuries(m.a.f) === 1 ? 'y' : 'ies'} and can die if they lose the next round. Fighting on: about ${Math.round(deathRisk(m) * 100)}% chance of death this round${canThrowTowel(m) ? '' : ' (and the Emperor forbids capitulating)'}.` : '' |
| [src/ui/fightView.js:296](../src/ui/fightView.js#L296) | ${last ? `Your round chance ${fmtPct(last.win.chance)}${animate ? `Steel meets steel…` : ''}${roundBanner(m, last, reveal)}` : 'The crowd roars. Three rounds; first to two wins.'} |

## 9. The house log (read all the time)

Lines the house steward writes each week. The plot's lines are in section 4.

| Where | Text |
|---|---|
| [src/run.js:901](../src/run.js#L901) | `You take charge of a bottom-tier Ludus in ${arenaName(1)}.` |
| [src/run.js:993](../src/run.js#L993) | `${fighter.name} joins the Ludus.` |
| [src/run.js:1008](../src/run.js#L1008) | `${f.name} is released from the Ludus. Their gear and decor return to the storeroom.` |
| [src/run.js:1154](../src/run.js#L1154) | `${f.name} leaves the Medbay fully healed.`, 'good' |
| [src/run.js:1190](../src/run.js#L1190) | `${f.name} is overtrained (Stress ${f.stress}). Rest them before a fight.`, 'warn' |
| [src/run.js:1191](../src/run.js#L1191) | `${f.name} is mutinous and refuses to fight.`, 'bad' |
| [src/run.js:1197](../src/run.js#L1197) | `The gladiators are close to revolt (${run.revoltWeeks}/${REVOLT.weeks} weeks).`, 'bad' |
| [src/run.js:1217](../src/run.js#L1217) | 'The stranger in the Medbay slipped away before dawn.', 'event'); } |
| [src/run.js:1218](../src/run.js#L1218) | `The Emperor's tribute of ${tributeDue(run)} Gold is due at the start of winter.`, 'warn' |
| [src/run.js:1228](../src/run.js#L1228) | `Tournament week in ${unlockedTiers(run).length > 1 ? `${unlockedTiers(run).length} arenas` : arenaName(run.topTier)}.`, 'event' |
| [src/run.js:1414](../src/run.js#L1414) | `You pay the Emperor's tribute early: ${due} Gold.`, 'event' |
| [src/run.js:1424](../src/run.js#L1424) | `The year-end purse: your house finished #${rank + 1} of ${run.houses.length + 1} in Glory${purse ? ` and is paid ${purse} Gold` : ', and is paid nothing'}.`, purse ? 'good' : 'warn' |
| [src/run.js:1431](../src/run.js#L1431) | 'The Emperor\'s collectors find your tribute already paid.', 'event' |
| [src/run.js:1434](../src/run.js#L1434) | `You pay the Emperor's tribute: ${due} Gold.`, 'event' |
| [src/run.js:1436](../src/run.js#L1436) | `You can't pay the ${due} Gold tribute. The Emperor takes what you have, and remembers.`, 'bad' |
| [src/run.js:1445](../src/run.js#L1445) | `Imperial Favour ${delta > 0 ? '+' : ''}${delta} (${why}): now ${run.favor}.`, delta > 0 ? 'good' : 'bad' |
| [src/run.js:1467](../src/run.js#L1467) | `${f.name} reaches level ${f.level}! Choose a perk.`, 'event' |
| [src/run.js:1679](../src/run.js#L1679) | `Sold a ${GEAR[key].name} for ${sellPrice(key)} Gold.` |
| [src/run.js:1778](../src/run.js#L1778) | `${f.name} wakes with a ${AUGMENTS[key].name}. The crowd mutters about machines.`, 'event' |
| [src/run.js:1801](../src/run.js#L1801) | `${f.name} retires to the Hall of Champions. +${RETIRE.prestige} Prestige, and the roster takes heart.`, 'good' |
| [src/run.js:1960](../src/run.js#L1960) | `You skip ${bout.name}: +${ECONOMY.skipGold} Gold, and the roster rests.` |
| [src/run.js:2054](../src/run.js#L2054) | `${fighter.name} has ${fighter.kills} kills and earns the mark ${summary.mark}: ${marks.at(-1).desc}`, 'event' |
| [src/run.js:2059](../src/run.js#L2059) | `The crowd boos ${fighter.name}, a champion of this arena picking on its newcomers.`, 'warn' |
| [src/run.js:2062](../src/run.js#L2062) | `The crowd jeers ${fighter.name} for crushing a much weaker opponent.`, 'warn' |
| [src/run.js:2074](../src/run.js#L2074) | `${fighter.name} claims a ${GEAR[summary.loot].name} from the defeated ${opp.name}.`, 'good' |
| [src/run.js:2177](../src/run.js#L2177) | `${fighter.name} is scarred: ${SCARS[id].name} against ${vs} fighters.`, 'warn' |
| [src/run.js:2188](../src/run.js#L2188) | `${fighter.name} died in ${bout.name}. The house mourns; their gear returns to the storeroom.`, 'bad' |
| [src/run.js:2205](../src/run.js#L2205) | `House Prestige level ${run.prestigeLevel}! New buildings and room plots unlocked.`, 'event' |
| [src/run.js:2262](../src/run.js#L2262) | `${fighter.name} wins the ${round} of ${bout.name}. On to the ${next}.`, 'good' |
| [src/run.js:2315](../src/run.js#L2315) | `Overnight, every chalk mark on your doors is washed away.`, 'warn' |
| [src/run.js:2351](../src/run.js#L2351) | `Thumbs down: ${fighter.name} finishes ${opp}.`, 'warn' |
| [src/run.js:2054](../src/run.js#L2054) | `${fighter.name} has ${fighter.kills} kills and earns the mark ${out.mark}: ${marks.at(-1).desc}`, 'event' |
| [src/run.js:2371](../src/run.js#L2371) | `The crowd roars its approval for ${fighter.name}.`, 'good' |
| [src/run.js:2431](../src/run.js#L2431) | `${opp.name} will remember this, and will be waiting for you.`, 'warn' |

## 10. Tutorial and coach tips

The tutorial month (`GUIDE`): the steward's five steps for a new Lanista. Tags like <b> are dropped here; keep them in the code.

| Where | Text |
|---|---|
| [src/tutorial.js:45](../src/tutorial.js#L45) | Tutorial month, step 1: Let's start with one gladiator. In the Market, look at each one's Power (the sword: wins rounds) and Speed (the arrow: strikes first), then press Recruit on at least one of them. |
| [src/tutorial.js:53](../src/tutorial.js#L53) | Tutorial month, step 2: Now the Ludus. Every fighter does one job a week. Give your strongest fighter +1 Power: training costs a little Gold and adds ${STRESS.train} Stress. The other can Rest for now; one Trainer Room trains one fighter at a time. |
| [src/tutorial.js:62](../src/tutorial.js#L62) | Tutorial month, step 3: Jobs are set. Make sure at least one fighter is training: only a fighter on Train Power (+1 Power) or Train Speed (+3 Speed) gets stronger, and an untrained house falls behind fast. Then press End week and the week plays out: training, rest and healing all happen at once. |
| [src/tutorial.js:70](../src/tutorial.js#L70) | Tutorial month, step 4: The last week of every month is fight day. Keep training, and rest a fighter whose Stress passes ${STRESS.overtrained - STRESS.train}: at ${STRESS.overtrained} they're overtrained and fight worse. When you're ready, Skip to tournament takes you straight there. |
| [src/tutorial.js:78](../src/tutorial.js#L78) | Tutorial month, step 5: Fight day. Each fighter's line shows their odds, injury risk and the Power both sides will fight with. Sending one costs a little Prestige; winning pays it back with more. Pick your best and press Send. |
| [src/tutorial.js:87](../src/tutorial.js#L87) | **The Trainer cap** |
| [src/tutorial.js:88](../src/tutorial.js#L88) | A fighter has learned everything this Trainer Room can teach. Upgrade the Trainer Room in the Estate to raise the cap (3 → 5 → 8 → 13 → 21 points per fighter). Each level also raises the weekly fee by 1 Gold per trainee, so plan your Gold. |
| [src/tutorial.js:93](../src/tutorial.js#L93) | **Watch the Stress bar** |
| [src/tutorial.js:94](../src/tutorial.js#L94) | Training stacks Stress. At 50+ a fighter is overtrained: they can't train, and in the arena they fight at −1 Power with one ability lost. Train, train, rest keeps them sharp. |
| [src/tutorial.js:99](../src/tutorial.js#L99) | **After the fight** |
| [src/tutorial.js:100](../src/tutorial.js#L100) | Wins pay Gold and Prestige; losses pay a little Gold. Injuries stay until healed: put hurt fighters on the Medbay job. Check the house log on the left to see what happened each week. |
| [src/tutorial.js:105](../src/tutorial.js#L105) | **Injuries and the Death Gate** |
| [src/tutorial.js:106](../src/tutorial.js#L106) | An injured fighter shows red chips and filled Death Gate dots. At two dots the gate is open: losing a round can kill them. Heal them in the Medbay, or pay the Emergency Surgeon if you need them right away. |
| [src/tutorial.js:111](../src/tutorial.js#L111) | **A Boss fight** |
| [src/tutorial.js:112](../src/tutorial.js#L112) | Bosses are stronger and fight under a special arena rule (shown in red). They can't be skipped. Beat your top arena's Boss and your fighter earns a Title (+1 Power), you gain Favour and a new arena opens. Lose and you lose Favour (more in higher tiers), and that Boss will be waiting for you, stronger. Remember: a "Strong favourite" still loses about one match in four. |
| [src/tutorial.js:117](../src/tutorial.js#L117) | **Level up!** |
| [src/tutorial.js:118](../src/tutorial.js#L118) | Every match earns XP. When a fighter levels up, pick one of three perks on their card. Some perks need both Power and Speed, which is a reason to build balanced fighters. |
| [src/tutorial.js:123](../src/tutorial.js#L123) | **More arenas, more fights** |
| [src/tutorial.js:124](../src/tutorial.js#L124) | Your old arenas still hold bouts every tournament week. Send a different fighter to each to earn Gold, XP and Renown. Only your top arena can win you Favour. Win 3 times in an arena (or beat its Boss) to become its Champion; Champions are booed if they go back, but rookies fight there freely. Opponents scout a fighter who fights in your top arena two months running (+1 Power against them), so rotate your stars. |
| [src/tutorial.js:129](../src/tutorial.js#L129) | **Keep your stars happy** |
| [src/tutorial.js:130](../src/tutorial.js#L130) | Winning makes fighters famous (Renown), and famous fighters expect better rooms. Their Morale drifts toward comfort minus expectations: place decor, upgrade Quarters, build an Entertainment Room. Inspired fighters fight better; Discontented ones won't train. |
| [src/tutorial.js:135](../src/tutorial.js#L135) | **Your house has grown** |
| [src/tutorial.js:136](../src/tutorial.js#L136) | A new Prestige level unlocks room plots and buildings. Visit the Estate: plots are limited, so choose what your house needs most. Trainer upgrades raise how far fighters can train. |
| [src/tutorial.js:145](../src/tutorial.js#L145) | **How a round works** |
| [src/tutorial.js:146](../src/tutorial.js#L146) | Each round: the faster fighter (Speed + a die) strikes first, Power decides the odds (the gauge shows the gap), traits pop up as coloured tags, then a roll decides the round. After that, each fighter rolls to injure the other. First to win two rounds takes the match. |
| [src/tutorial.js:151](../src/tutorial.js#L151) | **Read your opponent** |
| [src/tutorial.js:152](../src/tutorial.js#L152) | Before each round, pick a tactic. Press beats Feint, Feint beats Guard, Guard beats Press: guess right and you get +10% to win the round. Every fighter has a humor (temperament) that hints at what they'll do: a Choleric opponent loves to Press, so Guard against them. The ★ marks what auto-play would pick. |
| [src/tutorial.js:157](../src/tutorial.js#L157) | **Your call between rounds** |
| [src/tutorial.js:158](../src/tutorial.js#L158) | Fight on, or capitulate: you lose the match and the buy-in, but your fighter is guaranteed to survive. It matters most when the Death Gate is open (usually two injuries). |
| [src/tutorial.js:163](../src/tutorial.js#L163) | **Mortal danger** |
| [src/tutorial.js:164](../src/tutorial.js#L164) | Your fighter's Death Gate is open (usually two injuries; lions in the arena open it sooner). If they lose the next round and are wounded, they can die. Is this match worth it? |
| [src/tutorial.js:169](../src/tutorial.js#L169) | **Why you won or lost** |
| [src/tutorial.js:170](../src/tutorial.js#L170) | Open "Show the round-by-round math" to see every number: Power, the gap, each bonus, and the roll. Nothing is hidden. |

The "next step" bar (`src/hints.js`):

| Where | Text |
|---|---|
| [src/hints.js:11](../src/hints.js#L11) | ? { text: 'Recruit a gladiator in the Market.', action: 'tab', tab: 'market', label: 'Go to Market' } |
| [src/hints.js:12](../src/hints.js#L12) | : { text: 'No gladiators and not enough Gold: build a Liaison or wait for cheaper offers.', tone: 'bad' } |
| [src/hints.js:14](../src/hints.js#L14) | { text: 'Something has happened in the Ludus: make your choice on the card below.', tone: 'event' } |
| [src/hints.js:16](../src/hints.js#L16) | { text: `${levelled.name} levelled up: pick a perk on their card.`, tone: 'event' } |
| [src/hints.js:23](../src/hints.js#L23) | text: `Not enough Prestige for ${arenaName(run.topTier)}: the buy-in is ${bout.buyIn} and you have ${run.prestige}. ${bout.boss ? 'Forfeit the Boss' : 'Skip it'}${pits ? ', and win Prestige back in The Dirt Pits (they take whatever Prestige you have)' : ''}.` |
| [src/hints.js:27](../src/hints.js#L27) | { text: `Tournament week: send a fighter to ${arenaName(run.topTier)} (or skip it). Odds are on the right.`, tone: 'event' } |
| [src/hints.js:31](../src/hints.js#L31) | { text: `Optional: send a free fighter to ${open.map(arenaName).join(' or ')} for extra Gold and XP, or end the week.` } |
| [src/hints.js:34](../src/hints.js#L34) | { text: `${injured.name} is injured: set their job to Medbay so they heal.`, tone: 'warn' } |
| [src/hints.js:37](../src/hints.js#L37) | { text: `Save Gold: the ${due} Gold tribute is due in ${weeks} week${weeks === 1 ? '' : 's'} and you have ${run.gold}.`, tone: 'bad' } |
| [src/hints.js:39](../src/hints.js#L39) | { text: `${restless.name} is Discontented (Morale ${restless.morale}): place decor or upgrade their quarters.`, tone: 'warn' } |
| [src/hints.js:41](../src/hints.js#L41) | { text: `${idle.name} is resting with Stress ${idle.stress}: they could train this week.` } |
| [src/hints.js:42](../src/hints.js#L42) | { text: 'Jobs are set. End the week (Space) or skip to the tournament (T).' } |

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
| [src/codex.js:130](../src/codex.js#L130) | ['mark', 'The broken chain', 'The rebels\' sign, chalked on doors across the city. Copy it, and they know you have answered.'] |
| [src/codex.js:131](../src/codex.js#L131) | ['political', 'Political prisoners', 'Some of the Liaison\'s prisoners were locked up for what they said, not what they did. Their prison records give them away to anyone who reads closely, and they always come cheap: someone pays to place them in a house.'] |
| [src/codex.js:132](../src/codex.js#L132) | ['officer', 'The Officer', 'A former centurion. Freed, an officer arms your barracks for the rising without costing you any gear.'] |
| [src/codex.js:133](../src/codex.js#L133) | ['scribe', 'The Scribe', 'A clerk from the palace archives. Freed, a scribe sometimes sends a forged imperial pass, good for one visit from the Praetorians.'] |
| [src/codex.js:134](../src/codex.js#L134) | ['priest', 'The Priest', 'A priest of a forbidden god. Freed, a priest\'s blessing lifts every fighter\'s Morale each month.'] |
| [src/codex.js:135](../src/codex.js#L135) | ['courier', 'The Courier', 'A runner who knows every alley. Freed, a courier keeps the Praetorians looking elsewhere: suspicion falls each month.'] |
| [src/codex.js:136](../src/codex.js#L136) | ['suspicion', 'The Emperor\'s eye', 'Every favour you do the rebels draws the palace\'s attention, and so does every prisoner and every freed contact. A Praetorian taking notes, Favour slipping for no reason, a curious guest: these are the signs. Ignore them and the Praetorians come at dawn.'] |
| [src/codex.js:137](../src/codex.js#L137) | ['freed', 'The freed', 'Everyone you free becomes a contact outside the Ludus. When the day comes, they will be in the crowd: each one a voice cheering your champion (+5% win chance, up to +20%). The armed barracks rise with them (+10%).'] |
| [src/codex.js:138](../src/codex.js#L138) | ['usurper', 'Silbannacus', 'He took the throne with a knife and a bribed legion, and he has feared knives ever since. The rebels say a usurper can be usurped.'] |
| [src/codex.js:139](../src/codex.js#L139) | ['coup', 'The day of the games', 'When the barracks are armed, the rebels trust you, and your champion is ready, the Emperor will come to watch the Grand Final. If your champion wins it, the empire changes hands.'] |

## 12. Names, flavour and descriptions (lower priority)

Short, everywhere. Some carry rules: keep the numbers accurate.

| Where | Text |
|---|---|
| [src/data.js:465](../src/data.js#L465) | Fighter name pool |
| [src/data.js:95](../src/data.js#L95) | Rival houses |
| [src/data.js:116](../src/data.js#L116) | Patrons |
| [src/data.js:126](../src/data.js#L126) | Emperor's Decrees |
| [src/data.js:173](../src/data.js#L173) | Kinds and their traits |
| [src/data.js:186](../src/data.js#L186) | Classes |
| [src/data.js:199](../src/data.js#L199) | Signature moves |
| [src/data.js:343](../src/data.js#L343) | Buildings |
| [src/data.js:242](../src/data.js#L242) | Decor |
| [src/data.js:410](../src/data.js#L410) | Fight items |
| [src/data.js:305](../src/data.js#L305) | Gods' Days (festivals) |
| [src/data.js:441](../src/data.js#L441) | Boss arena rules |
| [src/data.js:135](../src/data.js#L135) | Scars |

## 13. New in 5.2.0 and 5.3.0 (first drafts, marked PLACEHOLDER in the code)

Every line below is a first draft. The rows show the code around the words; change only the words inside the quotes.

**Nemeses**

| Where | Text |
|---|---|
| [src/data.js:551](../src/data.js#L551) | Epithets: epithets: ['the Butcher', 'Bonebreaker', 'the Jackal', 'Sandreaper', 'the Grinning', 'Widowmaker', 'the Patient', 'Ironhide', 'the Mocking', 'Gravedigger', 'the Smiling Knife', 'Lionheart'], |
| [src/run.js:401](../src/run.js#L401) | `${n.name} ${n.nemesis.epithet} is back, in ${arenaName(bout.tier)}. They remember your house.`, 'warn' |
| [src/run.js:416](../src/run.js#L416) | `${opp.name} will be remembered in your house as ${opp.name} ${n.nemesis.epithet}.`, 'warn' |
| [src/run.js:434](../src/run.js#L434) | `Beat the house's nemesis, ${opp.name} ${opp.nemesis.epithet}${opp.nemesis.victims.length ? `, who had killed ${opp.nemesis.victims.join(' and ')}` : ''}.` |
| [src/run.js:435](../src/run.js#L435) | `${fighter.name} beats ${opp.name} ${opp.nemesis.epithet}! +${gold} Gold, +${NEMESIS.renown} Renown. The house breathes again.`, 'good' |

**The Emperor's demands** (`say` is his line; `goal` is the rule, keep it accurate)

| Where | Text |
|---|---|
| [src/data.js:538](../src/data.js#L538) | topWin: { goal: 'Win a match in your top arena', say: 'My guests are bored, Lanista. Give them a victory in your top arena this month.' }, |
| [src/data.js:539](../src/data.js#L539) | bloodied: { goal: 'Win a Bloodied Victory (a win with 2+ injuries)', say: 'I want to see blood on a winner. Win me a bloody victory this month.' }, |
| [src/data.js:540](../src/data.js#L540) | kill: { goal: 'Finish a beaten opponent (thumbs down)', say: 'The crowd grows soft. Give them a death this month.' }, |
| [src/data.js:541](../src/data.js#L541) | spare: { goal: 'Spare a beaten opponent (thumbs up)', say: 'The Senate calls me cruel. Show them my clemency: spare someone in the arena this month.' }, |
| [src/data.js:542](../src/data.js#L542) | twoArenas: { goal: 'Win in two different arenas on fight day', say: 'Show me the depth of your house. Win in two of my arenas this month.' }, |
| [src/main.js:143](../src/main.js#L143) | scene = { id: 'demand', beat: 0, beats: [{ speaker: 'emperor', text: DEMANDS[run.demand.id].say }, { speaker: 'steward', text: `The Emperor's demand: ${DEMANDS[run.demand.id].goal}, by the end of this month's fight day. Meet it and he pays in Favour and Gold; miss it and he remembers.` }] }; |
| [src/run.js:367](../src/run.js#L367) | `The Emperor demands: ${DEMANDS[run.demand.id].goal}, by the end of this month's fight day.`, 'event' |

**The Patron Lounge** (policy names, and their rules text)

| Where | Text |
|---|---|
| [src/data.js:518](../src/data.js#L518) | breadAndCircuses: { name: 'Bread and Circuses', cost: 3, lean: 'loyalist', desc: 'Every purse pays 25% more.' }, |
| [src/data.js:519](../src/data.js#L519) | edictOfMercy: { name: 'Edict of Mercy', cost: 2, lean: 'reformist', desc: 'Sparing a beaten opponent earns Favour in every arena, not just your top one.' }, |
| [src/data.js:520](../src/data.js#L520) | lowerTribute: { name: 'Lower the Tribute', cost: 4, lean: 'reformist', desc: 'This year\'s tribute is 30% lower.' }, |
| [src/data.js:521](../src/data.js#L521) | unleashLions: { name: 'Unleash the Lions', cost: 3, lean: 'loyalist', desc: 'Bosses fight with +1 Power, but beating one pays double Prestige.' }, |
| [src/data.js:522](../src/data.js#L522) | grainToLudus: { name: 'Grain to the Ludus', cost: 2, lean: 'neutral', desc: '+5 comfort for every fighter.' }, |
| [src/data.js:523](../src/data.js#L523) | purgePrisons: { name: 'Purge the Prisons', cost: 2, lean: 'loyalist', desc: 'No political prisoners are offered while it lasts.' }, |
| [src/data.js:524](../src/data.js#L524) | amnesty: { name: 'Amnesty', cost: 2, lean: 'reformist', desc: 'Political prisoners are twice as common while it lasts.' }, |
| [src/run.js:287](../src/run.js#L287) | `Senators dine at your table${star ? ` and admire ${star.name}` : ''}. +${gain} Influence (now ${run.influence}).`, 'event' |
| [src/run.js:307](../src/run.js#L307) | `The Senate passes ${p.name}: ${p.desc}`, 'event' |

**Bonds and betting**

| Where | Text |
|---|---|
| [src/run.js:320](../src/run.js#L320) | for (const [x, y] of [[a, b], [b, a]]) chronicle(run, x, `Bonded with ${y.name}.` |
| [src/run.js:321](../src/run.js#L321) | `${a.name} and ${b.name} have become fast friends: each is happier while the other is in the house.`, 'good' |
| [src/run.js:341](../src/run.js#L341) | `Grieved for ${f.bond.name}.` |
| [src/run.js:342](../src/run.js#L342) | `${f.name} grieves for ${f.bond.name}.`, 'bad' |
| [src/run.js:1900](../src/run.js#L1900) | `You bet ${stake} Gold on ${match.a.f.name} at ×${odds.toFixed(2)}: a win returns ${match.bet.payout} Gold (+${match.bet.payout - stake}).`, 'event' |
| [src/run.js:1924](../src/run.js#L1924) | `The bookmakers pay out ${match.bet.payout} Gold on your ${match.bet.stake} Gold bet: +${match.bet.payout - match.bet.stake} profit.`, 'good' |
| [src/run.js:1925](../src/run.js#L1925) | } else log(run, `The ${match.bet.stake} Gold bet is lost.`, 'bad' |

**The steward's news**

| Where | Text |
|---|---|
| [src/dialogue.js:242](../src/dialogue.js#L242) | news.push(`Your house has reached level ${after.level}. ${opened.length ? `New in the Estate: ${opened.join(', ')}.` : 'There are new plots to build on in the Estate.'}` |
| [src/dialogue.js:245](../src/dialogue.js#L245) | news.push('New gladiators have arrived in the Market.' |
| [src/dialogue.js:247](../src/dialogue.js#L247) | if (after.liaison && after.liaison !== before.liaison) news.push('The Liaison has a new prisoner on offer.' |
| [src/dialogue.js:248](../src/dialogue.js#L248) | if (after.armourer && after.armourer !== before.armourer && run.armourerStock.length) news.push('The Armourer has new stock.' |
| [src/dialogue.js:250](../src/dialogue.js#L250) | for (const f of raisable(run).filter((x) => !(before.bodies ?? '').split(',').includes(x.id))) news.push(`The priests of Vulcan have taken ${f.name}'s body. They can raise them as a Revenant, for a price (the Market tab).` |

**The Unnatural Temple of Vulcan and Revenants** (5.3.0; the name is yours to change too)

| Where | Text |
|---|---|
| [src/data.js:71](../src/data.js#L71) | deathless: { name: 'Deathless', desc: 'Already died once: the Death Gate opens one injury later.' }, |
| [src/data.js:72](../src/data.js#L72) | graveChill: { name: 'Grave Chill', desc: 'The opponent has −5% win chance every round: nobody wants to fight the dead.' }, |
| [src/data.js:73](../src/data.js#L73) | cinderHeart: { name: 'Cinder Heart', desc: '+1 Power in Rounds 2 and 3: the forge-fire inside wakes slowly.' }, |
| [src/data.js:183](../src/data.js#L183) | revenant: { name: 'Revenant', basePower: 5, traits: ['deathless', 'graveChill', 'cinderHeart'], exotic: true }, |
| [src/data.js:356](../src/data.js#L356) | vulcan: { unique: true, name: 'Unnatural Temple of Vulcan', dept: 'medical', icon: 'forge', cost: [10, 16], req: [2, 3], per: [4, 12], effect: (n) => `Raises a fighter killed in the arena as a Revenant, up to ${n} weeks after their death`, extra: (lv) => (lv >= 2 ? 'Revenants come back with all their strength' : 'Revenants come back with 1 less Power') }, |
| [src/codex.js:36](../src/codex.js#L36) | 'kind:revenant': 'A gladiator who died on the sand and was carried to the Unnatural Temple of Vulcan. The smith-god\'s priests rebuild them in brass and stitched flesh. They remember every fight, and feel nothing at all.', |
| [src/run.js:1541](../src/run.js#L1541) | `Raised from the dead in the Unnatural Temple of Vulcan, ${run.week - body.diedWeek} week${run.week - body.diedWeek === 1 ? '' : 's'} after falling. ${TRAITS[f.kindTrait].name}.` |
| [src/run.js:1542](../src/run.js#L1542) | `The priests of Vulcan work through the night. ${f.name} walks out of the forge: a Revenant, brass where the wounds were${lost ? `, and a little weaker (${lost} Power)` : ''}.`, 'event' |
| [src/ui/views.js:649](../src/ui/views.js#L649) | : `<p class="sub">The priests can raise a fighter killed in the arena up to ${effectAt('vulcan', vulcanLv)} weeks after their death, for ${reanimatePrice(run)} Gold. A Revenant keeps their class, level, perks and titles${vulcanLv >= 2 ? '' : ', but comes back with 1 less Power'}. They feel nothing: their Morale settles at ${REANIMATE.morale}, never Inspired and never Discontented.</p> |
| [src/ui/views.js:650](../src/ui/views.js#L650) | ${bodies.length ? `<div class="cards two">${bodies.map((f) => fighterCard(f, { stress: false, tag: `Fell ${run.week - f.diedWeek} week${run.week - f.diedWeek === 1 ? '' : 's'} ago · keeps ${effectAt('vulcan', vulcanLv) - (run.week - f.diedWeek)} more`, actions: `<div class="actions">${button(`Raise as a Revenant · ${reanimatePrice(run)} Gold`, 'reanimate', { id: f.id }, reanimateBlocker(run, f.id), 'btn primary small')}</div>` })).join('')}</div>` : '<p class="sub">No bodies to raise. The Temple waits.</p>'}`; |

**The rebel's confession** (5.3.0, src/dialogue.js `rebelScene`: the first political prisoner tells you about the rising; what they've heard depends on your record)

| Where | Text |
|---|---|
| [src/dialogue.js:140](../src/dialogue.js#L140) | if (r.sparedForBlood) heard.push(say("You have spared lives on the sand even when the crowd bayed for blood, and the risk of it was yours. People noticed.") |
| [src/dialogue.js:141](../src/dialogue.js#L141) | else if (r.spared) heard.push(say(`You have shown mercy in the arena${r.spared > 1 ? ` ${r.spared} times` : ""}. The crowd forgets. We don't.`) |
| [src/dialogue.js:142](../src/dialogue.js#L142) | if (r.released) heard.push(say("You have bought fighters, and then set them free. Hardly any Lanista does that.") |
| [src/dialogue.js:143](../src/dialogue.js#L143) | if (r.killed >= 3 && !r.spared) heard.push(say(`You have turned your thumb down ${r.killed} times, and never up. They say you enjoy it. I hope they're wrong.`) |
| [src/dialogue.js:144](../src/dialogue.js#L144) | else if (r.killed) heard.push(say(`You have finished beaten fighters${r.killed > 1 ? ` ${r.killed} times` : ""}. I won't pretend that makes this easier to say.`) |
| [src/dialogue.js:145](../src/dialogue.js#L145) | if (r.morale !== null && r.morale >= 70) heard.push(say("Your fighters eat well and sleep warm. In this city, that counts for something.") |
| [src/dialogue.js:146](../src/dialogue.js#L146) | else if (r.morale !== null && r.morale < 40) heard.push(say("Your fighters are miserable, and miserable people talk. Be careful who hears this.") |
| [src/dialogue.js:147](../src/dialogue.js#L147) | if (!heard.length) heard.push(say("I don't know you yet. I'm telling you anyway, because there is no one else to tell.") |
| [src/dialogue.js:150](../src/dialogue.js#L150) | { speaker: "narrator", text: `That night, ${f.name} asks to speak with you alone.` }, |
| [src/dialogue.js:151](../src/dialogue.js#L151) | say("I am not what the guards wrote on my record. There is a rising against Silbannacus, and I am part of it. The broken chain you may see chalked on doors is ours."), |
| [src/dialogue.js:153](../src/dialogue.js#L153) | say("No one should be owned by another. Not me by you, and not you by the Emperor. We are all his slaves, Lanista. Some of us just hold keys."), |
| [src/dialogue.js:155](../src/dialogue.js#L155) | ...say(kind ? "I think you might be one of us, whether you know it or not. You'll hear from us. Watch the doors." : "I don't know what you are yet. But you'll hear from us. Watch the doors."), |
| [src/dialogue.js:157](../src/dialogue.js#L157) | { label: "I'm listening.", then: [say("Good. Say nothing to anyone, and keep your eyes open.")] }, |
| [src/dialogue.js:158](../src/dialogue.js#L158) | { label: "Why tell me?", then: [say("Because a Lanista with a ludus full of fighters is the most dangerous person in this city, if they choose to be.")] }, |
| [src/dialogue.js:159](../src/dialogue.js#L159) | { label: "Say nothing.", then: [say("Silence. Fine. Silence keeps people alive here.")] }, |

**The rebel speaks again** (src/dialogue.js `rebelStageScene`: once at each stage of the rising)

| Where | Text |
|---|---|
| [src/dialogue.js:198](../src/dialogue.js#L198) | say("You copied the sign. They saw. From now on they'll ask you for small things: a door left open, a stranger fed, a name forgotten."), |
| [src/dialogue.js:199](../src/dialogue.js#L199) | say("Do them, and they'll start to trust you. Refuse them twice, and they'll go quiet for good."), |
| [src/dialogue.js:203](../src/dialogue.js#L203) | say("They trust you now. More than they trust me, I think."), |
| [src/dialogue.js:204](../src/dialogue.js#L204) | say("A rising needs a sword in the arena: one of your fighters, standing in the Grand Tournament when the Emperor watches. And it needs the barracks armed."), |
| [src/dialogue.js:205](../src/dialogue.js#L205) | say("Choose your champion carefully, Lanista. If they fall, the rising falls with them."), |
| [src/dialogue.js:208](../src/dialogue.js#L208) | say("It's ready. The blades are oiled, the crowd knows the signal, and your champion knows what to do."), |
| [src/dialogue.js:209](../src/dialogue.js#L209) | say("When the Emperor comes to watch the Grand Tournament, win the Final. Then look up at his box. We'll do the rest."), |
| [src/dialogue.js:212](../src/dialogue.js#L212) | if (watched) lines.push(say("And be careful. Praetorians have been asking questions about your house. Every favour you do us, they notice.") |
| [src/dialogue.js:213](../src/dialogue.js#L213) | return [{ speaker: "narrator", text: `${f.name} finds you alone again.` }, ...lines]; |

**5.4.0: the rebel's slower reveal** (the confession now waits for trust; this scene comes first, after you copy the chalk sign)

| Where | Text |
|---|---|
| [src/dialogue.js:200](../src/dialogue.js#L200) | say("Who are they? Not yet. Do this well, and one day I'll tell you."), |
| [src/dialogue.js:213](../src/dialogue.js#L213) | return [{ speaker: "narrator", text: confessed ? `${f.name} finds you alone again.` : `${f.name} catches your eye across the yard, and waits until the guards have gone.` }, ...lines]; |

**5.4.0: the Emperor's demands, met and missed** (src/dialogue.js `demandMetScene`, `demandMissedScene`)

| Where | Text |
|---|---|
| [src/dialogue.js:168](../src/dialogue.js#L168) | { speaker: "emperor", text: "Good. That is what I asked for, and you gave it to me. I remember those who please me." }, |
| [src/dialogue.js:174](../src/dialogue.js#L174) | { speaker: "emperor", text: "I asked you for one thing, Lanista. One. The month is over, and I am still waiting." }, |

**5.4.0: the Emperor's spy** (an ordinary event, once a career from Year 2; src/events.js `emperorsSpy`)

| Where | Text |
|---|---|
| [src/events.js:161](../src/events.js#L161) | text: ({ f }) => `Your steward brings you a letter he found sewn into ${f}'s bedroll, addressed to the Praetorian prefect. ${f} has been reporting on your house to the palace.`, |
| [src/events.js:163](../src/events.js#L163) | { label: 'Let them be, and mind what you say', effects: { favor: 3, spy: 'keep' } }, |
| [src/run.js:1357](../src/run.js#L1357) | chronicle(run, f, 'Unmasked as the Emperor\'s spy, and executed in the yard.'); |

**5.4.0: the steward and the house log**

| Where | Text |
|---|---|
| [src/run.js:2106](../src/run.js#L2106) | log(run, `Reaching the Boss earns respect: the ${bout.buyIn} Prestige buy-in is returned.`, 'event'); |
| [src/run.js:2431](../src/run.js#L2431) | log(run, beatYou ? `${opp.name} will remember this, and will be waiting for you.` : `${opp.name} never had to fight you. They will be waiting next time, stronger.`, 'warn'); |
| [src/ui/views.js](../src/ui/views.js) `overtrainModal` | The steward's overtraining question: "Before you end the week: another week of training and … will be Overtrained (Stress 50+)." |

**The crowd remembers its dead** (a Revenant's first fight back)

| Where | Text |
|---|---|
| [src/ui/fightView.js:293](../src/ui/fightView.js#L293) | ${m.a.f.risen && !m.rounds?.length ? `<div class="sub chant">📣 The crowd remembers ${esc(m.a.f.name)}. They chant the name they buried: +${HYPE.risen} hype.</div>` : ''} |
| [src/run.js:2145](../src/run.js#L2145) | `Fought again, back from the dead. The crowd chanted their name.` |
| [src/run.js:2146](../src/run.js#L2146) | `The crowd chants ${fighter.name}'s name: the dead fighter walks the sand again.`, 'event' |

**Lower arenas** (5.3.0)

| Where | Text |
|---|---|
| [src/ui/views.js:539](../src/ui/views.js#L539) | If nobody from your house fights here this week, the tournament goes ahead without you and the arena moves on. |
