# Text to rewrite in your voice

Every piece of story text in the game, with the file and line where it lives (click to open). Generated from the code on 2026-10-28, so line numbers match the current `main`.

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

**Suggested order** (highest impact first): the intro, the hidden plot, the endings, weekly events, fight narration, the crowd's verdict, the house log, the tutorial, Codex lore.


## 1. The intro (first thing every player reads)

| Where | Text |
|---|---|
| [src/tutorial.js:10](../src/tutorial.js#L10) | **Another Day on Your Computer** |
| [src/tutorial.js:11](../src/tutorial.js#L11) | (starts here, several lines) You are scrolling, cursing, dare I say surfing the web. Suddenly the screen shimmers. A hand reaches out of it, grabs you by the head and pulls you through.       You land hard on cold stone, under a sun that isn't yours. This is Battleworld, whose portals pull warriors from every world and century to feed the arenas of Emperor Silbannacus, a Roman usurper who fused magic and machinery into an empire of bloodsport.       Then everything goes dark. |
| [src/tutorial.js:16](../src/tutorial.js#L16) | **How you win** |
| [src/tutorial.js:17](../src/tutorial.js#L17) | (starts here, several lines) Climb four arenas, from the Dirt Pits to the Imperial Coliseum. Each arena holds a circuit: Tournament 1 → Tournament 2 → Boss.       Beat all four Bosses, then win the Grand Tournament, and the Emperor names you Master of the Games.       You don't fight. You recruit, train, heal and choose who to send, then make the hard calls from your box above the sand. |
| [src/tutorial.js:22](../src/tutorial.js#L22) | **How you lose** |
| [src/tutorial.js:23](../src/tutorial.js#L23) | (starts here, several lines) The Emperor watches you through Imperial Favour. Losing a Boss in your top arena, forfeiting, and failing to pay his yearly tribute all cost Favour. At 0 Favour you're executed.       You also fall if every gladiator is dead and you can't afford another, or if your miserable gladiators revolt.       Your fighters are mortal. One injury is survivable; with two injuries, losing a round can kill them. Between rounds you can always capitulate to save a fighter, at the cost of the match. |
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
| [src/plot.js:141](../src/plot.js#L141) | {f} asks to speak to you alone. "Free me. I can do more for the cause outside these walls than inside your arena." |
| [src/plot.js:32](../src/plot.js#L32) | Choice: Refuse |
| [src/plot.js:14](../src/plot.js#L14) | Choice: Free {f} |

**Thrown to the beasts** (`freeCondemned`)

| Where | Text |
|---|---|
| [src/plot.js:148](../src/plot.js#L148) | Title: Thrown to the beasts |
| [src/plot.js:151](../src/plot.js#L151) | {f} has gone pale. "They're throwing {name} to the beasts at the games today, for sedition. You have the Emperor's ear, and a key to every gate in the arena." |
| [src/plot.js:153](../src/plot.js#L153) | Choice: Do nothing |
| [src/plot.js:154](../src/plot.js#L154) | Choice: Plead for clemency (−8 Favour) |
| [src/plot.js:155](../src/plot.js#L155) | Choice: Arrange an escape |

**One of ours across the sand** (`acrossSand`)

| Where | Text |
|---|---|
| [src/plot.js:159](../src/plot.js#L159) | Title: One of ours across the sand |
| [src/plot.js:162](../src/plot.js#L162) | {f} lowers their voice. "{opp}, who fights for {house}, is one of us. If you meet in the arena, beat them if you must, but let them live." |
| [src/plot.js:164](../src/plot.js#L164) | Choice: Promise nothing |
| [src/plot.js:165](../src/plot.js#L165) | Choice: Promise to spare them |

**The forged pass** (`forgedPass`)

| Where | Text |
|---|---|
| [src/plot.js:170](../src/plot.js#L170) | Title: The forged pass |
| [src/plot.js:173](../src/plot.js#L173) | A clerk from the palace archives offers a pass bearing the Emperor's own seal. Shown at the right moment, it will send the Praetorians away once. |
| [src/plot.js:175](../src/plot.js#L175) | Choice: Decline |
| [src/plot.js:176](../src/plot.js#L176) | Choice: Buy it (8 Gold) |

**Steel for the cause** (`armBarracks`)

| Where | Text |
|---|---|
| [src/plot.js:180](../src/plot.js#L180) | Title: Steel for the cause |
| [src/plot.js:184](../src/plot.js#L184) | An old centurion asks for weapons from your storeroom. "When the day comes, the barracks must be armed. Two pieces of steel will do." |
| [src/plot.js:32](../src/plot.js#L32) | Choice: Refuse |
| [src/plot.js:187](../src/plot.js#L187) | Choice: Hand over two pieces of gear |

**The champion** (`recruitChampion`)

| Where | Text |
|---|---|
| [src/plot.js:191](../src/plot.js#L191) | Title: The champion |
| [src/plot.js:199](../src/plot.js#L199) | The rebels want a champion from your house. "When the Emperor comes to the games, the crowd must see one of their own strike the blow." They name {f}, or {g}. |
| [src/plot.js:201](../src/plot.js#L201) | Choice: Keep your fighters out of it |
| [src/plot.js:202](../src/plot.js#L202) | Choice: Sound {f} out ({fOdds}% they say yes) |
| [src/plot.js:202](../src/plot.js#L202) | Choice: Sound {g} out ({gOdds}% they say yes) |

**A curious guest** (`informer`)

| Where | Text |
|---|---|
| [src/plot.js:208](../src/plot.js#L208) | Title: A curious guest |
| [src/plot.js:211](../src/plot.js#L211) | A guest at your table asks a great many questions about where your fighters go at night. |
| [src/plot.js:213](../src/plot.js#L213) | Choice: Say nothing |
| [src/plot.js:214](../src/plot.js#L214) | Choice: Feed him a story |

**The prefect's offer** (`theOffer`)

| Where | Text |
|---|---|
| [src/plot.js:218](../src/plot.js#L218) | Title: The prefect's offer |
| [src/plot.js:221](../src/plot.js#L221) | A Praetorian prefect calls on you, alone. "The Emperor knows there are traitors in the gladiator houses. Give him their names, and he will remember your house kindly." |
| [src/plot.js:223](../src/plot.js#L223) | Choice: Know nothing |
| [src/plot.js:224](../src/plot.js#L224) | Choice: Name the names |

**The Praetorians at dawn** (`raid`)

| Where | Text |
|---|---|
| [src/plot.js:228](../src/plot.js#L228) | Title: The Praetorians at dawn |
| [src/plot.js:234](../src/plot.js#L234) | The Praetorians come at dawn and fill the yard. Their prefect wants a traitor, or a reason to leave without one. |
| [src/plot.js:236](../src/plot.js#L236) | Choice: Pay them off (15 Gold) |
| [src/plot.js:187](../src/plot.js#L187) | Choice: Hand over {f} |
| [src/plot.js:238](../src/plot.js#L238) | Choice: Show the forged pass |
| [src/plot.js:239](../src/plot.js#L239) | Choice: Bar the gates |

**Tonight the Emperor attends** (`coupEve`)

| Where | Text |
|---|---|
| [src/plot.js:244](../src/plot.js#L244) | Title: Tonight the Emperor attends |
| [src/plot.js:247](../src/plot.js#L247) | Silbannacus himself will watch the Grand Final from the imperial box. The barracks are armed. {f} is ready. Every door in the city has a broken chain on it. |
| [src/plot.js:249](../src/plot.js#L249) | Choice: Not tonight |
| [src/plot.js:244](../src/plot.js#L244) | Choice: Tonight |

## 3. The hidden plot (v6): clues, signs and roles

**Prison-record clues.** "Telling" clues appear only on political prisoners. "Ambiguous" ones can appear on anyone.

| Where | Text |
|---|---|
| [src/plot.js:32](../src/plot.js#L32) | Telling: Refuses to salute the Imperial standard. |
| [src/plot.js:33](../src/plot.js#L33) | Telling: Was found with a pamphlet sewn into his tunic. |
| [src/plot.js:34](../src/plot.js#L34) | Telling: Scratched a sign on the cell wall: a broken chain. |
| [src/plot.js:35](../src/plot.js#L35) | Telling: Arrested in the Forum on the night the Emperor's statue was defaced. |
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
| [src/run.js:376](../src/run.js#L376) | `${name} slips out of the city.`, 'event' |
| [src/run.js:418](../src/run.js#L418) | 'A sealed letter arrives with no name on it. Inside: a pass bearing the Emperor\'s seal.', 'event' |
| [src/run.js:424](../src/run.js#L424) | `A blessing from ${priest.name} reaches the barracks in secret. Spirits lift.`, 'good' |
| [src/run.js:427](../src/run.js#L427) | `${courier.name} sends word: the Praetorians are watching another house this month.`, 'good' |
| [src/run.js:435](../src/run.js#L435) | pick(run.rng.plot, SUSPICION_SIGNS.ready), 'event' |
| [src/run.js:508](../src/run.js#L508) | `${f.name} tried to escape over the wall, and was caught by the watch and executed.`, 'bad'); } |
| [src/run.js:514](../src/run.js#L514) | `${f.name} is taken by the Praetorians and executed in the arena at noon.`, 'bad' |
| [src/run.js:517](../src/run.js#L517) | 'Not tonight. The rebels will wait for the next Grand Tournament.', 'event' |
| [src/run.js:528](../src/run.js#L528) | 'The Praetorians break down the gates. Your house is tried for treason, and the sentence is read at the games.' |
| [src/run.js:547](../src/run.js#L547) | `On your word, the Praetorians drag ${f.name} from the barracks. They are executed at noon.`, 'bad' |
| [src/run.js:549](../src/run.js#L549) | `${c.name} is found hiding in the city, and executed.`, 'bad' |
| [src/run.js:556](../src/run.js#L556) | `A purse of ${purse} Gold arrives from the palace, with the Emperor's thanks.`, 'event' |
| [src/run.js:558](../src/run.js#L558) | run.epilogue = [...(run.epilogue ?? []), victims.length ? `Executed on your word: ${victims.join(', ')}.` : 'You gave the Emperor names. He made sure they were the right ones.'] |
| [src/run.js:569](../src/run.js#L569) | 'The signal is never given. The rebels melt back into the crowd, to wait for another day of games.', 'warn' |
| [src/run.js:575](../src/run.js#L575) | `${fighter.name} wins the Final, turns, and climbs into the imperial box. Silbannacus falls on the sand he filled with blood. The empire is yours to remake.` |
| [src/run.js:577](../src/run.js#L577) | if (freed.length) run.epilogue = [...(run.epilogue ?? []), `In the crowd, the people you freed were the first to cheer: ${freed.join(', ')}.`] |
| [src/run.js:580](../src/run.js#L580) | run.epilogue = [...(run.epilogue ?? []), 'The signal never came: the wrong fighter won the Final, and the moment passed. Somewhere, a chalk mark fades.'] |
| [src/run.js:585](../src/run.js#L585) | `${fighter.name} falls in the Final, and the rising dies with them. The broken chain is scrubbed from every door, but the city remembers.` |

End-screen titles and closing lines:

| Where | Text |
|---|---|
| [src/ui/views.js:105](../src/ui/views.js#L105) | const ENDING_TITLES = { coup: '⛓ The Tyrant Falls', martyr: '⛓ The Rising Fails', treason: '⚖ Tried for Treason' } |
| [src/ui/views.js:107](../src/ui/views.js#L107) | 'Some say a different house could have changed the empire.' |
| [src/ui/views.js:108](../src/ui/views.js#L108) | 'The Emperor remembers your loyalty. So does everyone else.' |

## 5. Career endings (all careers)

| Where | Text |
|---|---|
| [src/run.js:1925](../src/run.js#L1925) | 'You won the Grand Tournament. The Emperor names you Master of the Games.' |
| [src/run.js:1960](../src/run.js#L1960) | `The Emperor's Favour is gone. You are executed in ${formatDate(run.week)}.` |
| [src/run.js:1965](../src/run.js#L1965) | 'Your gladiators revolt and burn the Ludus.' |
| [src/run.js:1971](../src/run.js#L1971) | 'No fighters left and not enough Gold to buy one. Your house falls.' |
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
| [src/events.js:123](../src/events.js#L123) | {f} limps out to training, favouring an old wound. They swear it's nothing. |
| [src/events.js:125](../src/events.js#L125) | Choice: Rest them this week |
| [src/events.js:126](../src/events.js#L126) | Choice: Push through it |

**A poet at the gate** (`poet`)

| Where | Text |
|---|---|
| [src/events.js:131](../src/events.js#L131) | A street poet wants to write verses about {f}. For a few coins, the whole city will be singing them. |
| [src/events.js:133](../src/events.js#L133) | Choice: Send him away |
| [src/events.js:134](../src/events.js#L134) | Choice: Pay the poet (4 Gold) |

**An insult in the forum** (`insult`)

| Where | Text |
|---|---|
| [src/events.js:140](../src/events.js#L140) | A rival house's champion mocked {f} in the forum, in front of half the city. {f} wants satisfaction. |
| [src/events.js:142](../src/events.js#L142) | Choice: Forbid the duel |
| [src/events.js:24](../src/events.js#L24) | Choice: Let them settle it |

**A wandering healer** (`healer`)

| Where | Text |
|---|---|
| [src/events.js:148](../src/events.js#L148) | A healer from the eastern provinces offers to treat {f}'s wounds with herbs and hot iron. |
| [src/events.js:150](../src/events.js#L150) | Choice: No, thank you |
| [src/events.js:151](../src/events.js#L151) | Choice: Pay the healer (5 Gold) |

**Crowds at the training yard** (`onlookers`)

| Where | Text |
|---|---|
| [src/events.js:158](../src/events.js#L158) | A crowd has gathered at the gate to watch your gladiators train. Some are offering coins for a look. |
| [src/events.js:160](../src/events.js#L160) | Choice: Keep the gates shut |
| [src/events.js:161](../src/events.js#L161) | Choice: Open the gates |

**An imperial envoy** (`envoy`)

| Where | Text |
|---|---|
| [src/events.js:166](../src/events.js#L166) | An envoy of the Emperor arrives unannounced to inspect your house. He looks bored, and expensive. |
| [src/events.js:168](../src/events.js#L168) | Choice: Show him your discipline |
| [src/events.js:169](../src/events.js#L169) | Choice: Offer him a gift (6 Gold) |

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
| [src/ui/views.js:673](../src/ui/views.js#L673) | The crowd waits${esc(m.opp)}'s fate${esc(f?.name ?? 'Your fighter')} beat ${esc(m.opp)}. ${blood ? '👎 The crowd roars for blood!' : '👍 The crowd chants for mercy.'} |
| Where | Text |
|---|---|
| [src/ui/fightView.js:40](../src/ui/fightView.js#L40) | const SUSPENSE = 1; // the pause ("Steel meets steel…") before the round's winner is announced |
| [src/ui/fightView.js:116](../src/ui/fightView.js#L116) | s.champion ? row('The crowd', 'boos a champion back in the pits', 'bad') : s.crushing ? row('The crowd', 'jeers the mismatch', 'bad') : '' |
| [src/ui/fightView.js:118](../src/ui/fightView.js#L118) | s.bribed ? row('Crowd Bribe', 'the crowd forgave the capitulation', 'good') : '' |
| [src/ui/fightView.js:121](../src/ui/fightView.js#L121) | s.verdict && s.verdict === s.mercy ? row('The crowd', 'roars its approval', 'good') : '' |
| [src/ui/fightView.js:129](../src/ui/fightView.js#L129) | // Thumbs up or down: the beaten opponent's fate, with what the crowd wants. |
| [src/ui/fightView.js:134](../src/ui/fightView.js#L134) | const spare = blood ? `${favor}; ${house} will owe you a life (−1 Power against you)` : `${favor}, +${MERCY.crowdRenown} Renown, +${MERCY.crowdMorale} Morale (the crowd agrees)` |
| [src/ui/fightView.js:135](../src/ui/fightView.js#L135) | const kill = blood ? `+${MERCY.killRenown + MERCY.crowdRenown} Renown, +${MERCY.crowdMorale} Morale, a kill (the crowd agrees)` : `+${MERCY.killRenown + MERCY.infamyRenown} Renown (infamy), a kill${m.house ? `; ${house} will swear a feud` : ''}` |
| [src/ui/fightView.js:214](../src/ui/fightView.js#L214) | const pre = mortalDanger(m.a) ? `⚠ MORTAL DANGER from the first round: ${esc(m.a.f.name)} enters with ${effectiveInjuries(m.a.f)} injur${effectiveInjuries(m.a.f) === 1 ? 'y' : 'ies'}. Losing Round 1: about ${Math.round(deathRisk(m) * 100)}% chance of death. Capitulating is only possible between rounds.` : '' |
| [src/ui/fightView.js:218](../src/ui/fightView.js#L218) | const alert = danger ? `⚠ MORTAL DANGER: ${esc(m.a.f.name)} has ${effectiveInjuries(m.a.f)} injur${effectiveInjuries(m.a.f) === 1 ? 'y' : 'ies'} and can die if they lose the next round. Fighting on: about ${Math.round(deathRisk(m) * 100)}% chance of death this round${canThrowTowel(m) ? '' : ' (and the Emperor forbids capitulating)'}.` : '' |
| [src/ui/fightView.js:276](../src/ui/fightView.js#L276) | ${last ? `Your round chance ${fmtPct(last.win.chance)}${animate ? `Steel meets steel…` : ''}${roundBanner(m, last, reveal)}` : 'The crowd roars. Three rounds; first to two wins.'} |

## 9. The house log (read all the time)

Lines the house steward writes each week. The plot's lines are in section 4.

| Where | Text |
|---|---|
| [src/run.js:705](../src/run.js#L705) | `You take charge of a bottom-tier Ludus in ${arenaName(1)}.` |
| [src/run.js:797](../src/run.js#L797) | `${fighter.name} joins the Ludus.` |
| [src/run.js:811](../src/run.js#L811) | `${f.name} is released from the Ludus. Their gear and decor return to the storeroom.` |
| [src/run.js:939](../src/run.js#L939) | `${f.name} leaves the Medbay fully healed.`, 'good' |
| [src/run.js:956](../src/run.js#L956) | `${f.name} is overtrained (Stress ${f.stress}). Rest them before a fight.`, 'warn' |
| [src/run.js:957](../src/run.js#L957) | `${f.name} is mutinous and refuses to fight.`, 'bad' |
| [src/run.js:962](../src/run.js#L962) | `The gladiators are close to revolt (${run.revoltWeeks}/${REVOLT.weeks} weeks).`, 'bad' |
| [src/run.js:976](../src/run.js#L976) | 'The stranger in the Medbay slipped away before dawn.', 'event'); } |
| [src/run.js:977](../src/run.js#L977) | `The Emperor's tribute of ${tributeDue(run)} Gold is due at the start of winter.`, 'warn' |
| [src/run.js:987](../src/run.js#L987) | `Tournament week in ${unlockedTiers(run).length > 1 ? `${unlockedTiers(run).length} arenas` : arenaName(run.topTier)}.`, 'event' |
| [src/run.js:1140](../src/run.js#L1140) | `You pay the Emperor's tribute early: ${due} Gold.`, 'event' |
| [src/run.js:1150](../src/run.js#L1150) | `The year-end purse: your house finished #${rank + 1} of ${run.houses.length + 1} in Glory${purse ? ` and is paid ${purse} Gold` : ', and is paid nothing'}.`, purse ? 'good' : 'warn' |
| [src/run.js:1157](../src/run.js#L1157) | 'The Emperor\'s collectors find your tribute already paid.', 'event' |
| [src/run.js:1160](../src/run.js#L1160) | `You pay the Emperor's tribute: ${due} Gold.`, 'event' |
| [src/run.js:1162](../src/run.js#L1162) | `You can't pay the ${due} Gold tribute. The Emperor takes what you have, and remembers.`, 'bad' |
| [src/run.js:1171](../src/run.js#L1171) | `Imperial Favour ${delta > 0 ? '+' : ''}${delta} (${why}): now ${run.favor}.`, delta > 0 ? 'good' : 'bad' |
| [src/run.js:1193](../src/run.js#L1193) | `${f.name} reaches level ${f.level}! Choose a perk.`, 'event' |
| [src/run.js:1313](../src/run.js#L1313) | `Sold a ${GEAR[key].name} for ${sellPrice(key)} Gold.` |
| [src/run.js:1412](../src/run.js#L1412) | `${f.name} wakes with a ${AUGMENTS[key].name}. The crowd mutters about machines.`, 'event' |
| [src/run.js:1435](../src/run.js#L1435) | `${f.name} retires to the Hall of Champions. +${RETIRE.prestige} Prestige, and the roster takes heart.`, 'good' |
| [src/run.js:1536](../src/run.js#L1536) | `You skip ${bout.name}: +${ECONOMY.skipGold} Gold, and the roster rests.` |
| [src/run.js:1627](../src/run.js#L1627) | `${fighter.name} has ${fighter.kills} kills and earns the mark ${summary.mark}: ${marks.at(-1).desc}`, 'event' |
| [src/run.js:1632](../src/run.js#L1632) | `The crowd boos ${fighter.name}, a champion of this arena picking on its newcomers.`, 'warn' |
| [src/run.js:1635](../src/run.js#L1635) | `The crowd jeers ${fighter.name} for crushing a much weaker opponent.`, 'warn' |
| [src/run.js:1647](../src/run.js#L1647) | `${fighter.name} claims a ${GEAR[summary.loot].name} from the defeated ${opp.name}.`, 'good' |
| [src/run.js:1732](../src/run.js#L1732) | `${fighter.name} is scarred: ${SCARS[id].name} against ${vs} fighters.`, 'warn' |
| [src/run.js:1743](../src/run.js#L1743) | `${fighter.name} died in ${bout.name}. The house mourns; their gear returns to the storeroom.`, 'bad' |
| [src/run.js:1760](../src/run.js#L1760) | `House Prestige level ${run.prestigeLevel}! New buildings and room plots unlocked.`, 'event' |
| [src/run.js:1800](../src/run.js#L1800) | `${fighter.name} wins the ${round} of ${bout.name}. On to the ${next}.`, 'good' |
| [src/run.js:1834](../src/run.js#L1834) | `Overnight, every chalk mark on your doors is washed away.`, 'warn' |
| [src/run.js:1869](../src/run.js#L1869) | `Thumbs down: ${fighter.name} finishes ${opp}.`, 'warn' |
| [src/run.js:1875](../src/run.js#L1875) | `${fighter.name} has ${fighter.kills} kills and earns the mark ${out.mark}: ${marks.at(-1).desc}`, 'event' |
| [src/run.js:1889](../src/run.js#L1889) | `The crowd roars its approval for ${fighter.name}.`, 'good' |
| [src/run.js:1949](../src/run.js#L1949) | `${opp.name} will remember this, and will be waiting for you.`, 'warn' |

## 10. Tutorial and coach tips

| Where | Text |
|---|---|
| [src/tutorial.js:37](../src/tutorial.js#L37) | **Recruit your first gladiators** |
| [src/tutorial.js:38](../src/tutorial.js#L38) | Open the Market and recruit two fighters. Look at Power (the sword: wins rounds) and Speed (the arrow: strikes first). Every fighter has a Kind trait and a Class ability; hover over them to see what they do. |
| [src/tutorial.js:39](../src/tutorial.js#L39) | **Give everyone a weekly job** |
| [src/tutorial.js:40](../src/tutorial.js#L40) | Each fighter does one job per week: +1 Power or +3 Speed (costs Gold and adds 20 Stress), Rest (removes Stress) or Medbay (heals injuries). One Trainer Room trains one fighter at a time, and each fighter can train only up to the Trainer cap (3 points at first). Then press End week. |
| [src/tutorial.js:41](../src/tutorial.js#L41) | **The Trainer cap** |
| [src/tutorial.js:42](../src/tutorial.js#L42) | A fighter has learned everything this Trainer Room can teach. Upgrade the Trainer Room in the Estate to raise the cap (3 → 5 → 8 → 13 → 21 points per fighter). Each level also raises the weekly fee by 1 Gold per trainee, so plan your Gold. |
| [src/tutorial.js:43](../src/tutorial.js#L43) | **Watch the Stress bar** |
| [src/tutorial.js:44](../src/tutorial.js#L44) | Training stacks Stress. At 50+ a fighter is overtrained: they can't train, and in the arena they fight at −1 Power with one ability lost. Train, train, rest keeps them sharp. |
| [src/tutorial.js:45](../src/tutorial.js#L45) | **Fight day** |
| [src/tutorial.js:46](../src/tutorial.js#L46) | The last week of every month is a tournament. On the right you can see the opponent and your odds for each fighter. Sending one costs the Prestige buy-in; winning returns it with interest. You may also skip Tournaments 1 and 2 (never a Boss). |
| [src/tutorial.js:47](../src/tutorial.js#L47) | **After the fight** |
| [src/tutorial.js:48](../src/tutorial.js#L48) | Wins pay Gold and Prestige; losses pay a little Gold. Injuries stay until healed: put hurt fighters on the Medbay job. Check the house log on the left to see what happened each week. |
| [src/tutorial.js:49](../src/tutorial.js#L49) | **Injuries and the Death Gate** |
| [src/tutorial.js:50](../src/tutorial.js#L50) | An injured fighter shows red chips and filled Death Gate dots. At two dots the gate is open: losing a round can kill them. Heal them in the Medbay, or pay the Emergency Surgeon if you need them right away. |
| [src/tutorial.js:51](../src/tutorial.js#L51) | **A Boss fight** |
| [src/tutorial.js:52](../src/tutorial.js#L52) | Bosses are stronger and fight under a special arena rule (shown in red). They can't be skipped. Beat your top arena's Boss and your fighter earns a Title (+1 Power), you gain Favour and a new arena opens. Lose and you lose Favour (more in higher tiers), and that Boss will be waiting for you, stronger. Remember: a "Strong favourite" still loses about one match in four. |
| [src/tutorial.js:53](../src/tutorial.js#L53) | **Level up!** |
| [src/tutorial.js:54](../src/tutorial.js#L54) | Every match earns XP. When a fighter levels up, pick one of three perks on their card. Some perks need both Power and Speed, which is a reason to build balanced fighters. |
| [src/tutorial.js:55](../src/tutorial.js#L55) | **More arenas, more fights** |
| [src/tutorial.js:56](../src/tutorial.js#L56) | Your old arenas still hold bouts every tournament week. Send a different fighter to each to earn Gold, XP and Renown. Only your top arena can win you Favour. Win 3 times in an arena (or beat its Boss) to become its Champion; Champions are booed if they go back, but rookies fight there freely. Opponents scout a fighter who fights in your top arena two months running (+1 Power against them), so rotate your stars. |
| [src/tutorial.js:57](../src/tutorial.js#L57) | **Keep your stars happy** |
| [src/tutorial.js:58](../src/tutorial.js#L58) | Winning makes fighters famous (Renown), and famous fighters expect better rooms. Their Morale drifts toward comfort minus expectations: place decor, upgrade Quarters, build an Entertainment Room. Inspired fighters fight better; Discontented ones won't train. |
| [src/tutorial.js:59](../src/tutorial.js#L59) | **Your house has grown** |
| [src/tutorial.js:60](../src/tutorial.js#L60) | A new Prestige level unlocks room plots and buildings. Visit the Estate: plots are limited, so choose what your house needs most. Trainer upgrades raise how far fighters can train. |
| [src/tutorial.js:65](../src/tutorial.js#L65) | **How a round works** |
| [src/tutorial.js:66](../src/tutorial.js#L66) | Each round: the faster fighter (Speed + a die) strikes first, Power decides the odds (the gauge shows the gap), traits pop up as coloured tags, then a roll decides the round. After that, each fighter rolls to injure the other. First to win two rounds takes the match. |
| [src/tutorial.js:67](../src/tutorial.js#L67) | **Read your opponent** |
| [src/tutorial.js:68](../src/tutorial.js#L68) | Before each round, pick a tactic. Press beats Feint, Feint beats Guard, Guard beats Press: guess right and you get +10% to win the round. Every fighter has a humor (temperament) that hints at what they'll do: a Choleric opponent loves to Press, so Guard against them. The ★ marks what auto-play would pick. |
| [src/tutorial.js:69](../src/tutorial.js#L69) | **Your call between rounds** |
| [src/tutorial.js:70](../src/tutorial.js#L70) | Fight on, or capitulate: you lose the match and the buy-in, but your fighter is guaranteed to survive. It matters most when the Death Gate is open (usually two injuries). |
| [src/tutorial.js:71](../src/tutorial.js#L71) | **Mortal danger** |
| [src/tutorial.js:72](../src/tutorial.js#L72) | Your fighter's Death Gate is open (usually two injuries; lions in the arena open it sooner). If they lose the next round and are wounded, they can die. Is this match worth it? |
| [src/tutorial.js:73](../src/tutorial.js#L73) | **Why you won or lost** |
| [src/tutorial.js:74](../src/tutorial.js#L74) | Open "Show the round-by-round math" to see every number: Power, the gap, each bonus, and the roll. Nothing is hidden. |

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
| [src/codex.js:35](../src/codex.js#L35) | 'class:retiarius': 'The net-fighter of old Rome: a trident, a weighted net, and no helmet. Win an exchange and the net flies, leaving the opponent tangled and slow.' |
| [src/codex.js:36](../src/codex.js#L36) | 'class:ashHungry': 'A cult of fire-eaters who believe every wound they cause feeds the flame inside them. The longer a fight runs, the hotter they burn.' |
| [src/codex.js:37](../src/codex.js#L37) | 'class:bloodBearer': 'Dual-wielders. Lose an exchange to a Blood-Bearer and the second blade is already coming.' |
| [src/codex.js:38](../src/codex.js#L38) | 'class:thornBlade': 'Duelists who fight with a barbed blade and a cruel patience. Every exchange they win leaves something in the wound that slows the next.' |
| [src/codex.js:39](../src/codex.js#L39) | 'class:samnite': 'The oldest gladiators of Rome, armed like the Samnite warriors Rome defeated: a big shield, a short sword, and a wall-like calm even when their head is ringing.' |
| [src/codex.js:40](../src/codex.js#L40) | 'weapon:club': 'Crude, heavy and humiliating. A good hit leaves a champion face-down in the sand.' |
| [src/codex.js:41](../src/codex.js#L41) | 'weapon:fists': "A fist-fighter has no weapon to lose. Their specialty is taking yours away." |
| [src/codex.js:42](../src/codex.js#L42) | 'weapon:bow': 'Range wins the opening exchanges, before a melee fighter can close the gap.' |
| [src/codex.js:43](../src/codex.js#L43) | 'weapon:spear': 'The oldest reach advantage in the world. Spearmen strike first and keep archers honest.' |
| [src/codex.js:44](../src/codex.js#L44) | 'weapon:axe': 'A heavy, honest weapon. It does not wound so much as open.' |
| [src/codex.js:45](../src/codex.js#L45) | 'weapon:dagger': 'For fighters who strike before the other has drawn breath: a knife is fastest when it is already moving.' |
| [src/codex.js:46](../src/codex.js#L46) | 'weapon:sword': 'The gladius: short, quick, and as good at turning a blow aside as dealing one.' |
| [src/codex.js:47](../src/codex.js#L47) | 'weapon:flail': 'A ball and chain that wraps around shields and laughs at armour.' |
| [src/codex.js:48](../src/codex.js#L48) | 'weapon:gun': 'Contraband from another century. Loud, armour-piercing, and slow to reload.' |

The hidden Rebellion section:

| Where | Text |
|---|---|
| [src/codex.js:128](../src/codex.js#L128) | ['mark', 'The broken chain', 'The rebels\' sign, chalked on doors across the city. Copy it, and they know you have answered.'] |
| [src/codex.js:129](../src/codex.js#L129) | ['political', 'Political prisoners', 'Some of the Liaison\'s prisoners were locked up for what they said, not what they did. Their prison records give them away to anyone who reads closely, and they always come cheap: someone pays to place them in a house.'] |
| [src/codex.js:130](../src/codex.js#L130) | ['officer', 'The Officer', 'A former centurion. Freed, an officer arms your barracks for the rising without costing you any gear.'] |
| [src/codex.js:131](../src/codex.js#L131) | ['scribe', 'The Scribe', 'A clerk from the palace archives. Freed, a scribe sometimes sends a forged imperial pass, good for one visit from the Praetorians.'] |
| [src/codex.js:132](../src/codex.js#L132) | ['priest', 'The Priest', 'A priest of a forbidden god. Freed, a priest\'s blessing lifts every fighter\'s Morale each month.'] |
| [src/codex.js:133](../src/codex.js#L133) | ['courier', 'The Courier', 'A runner who knows every alley. Freed, a courier keeps the Praetorians looking elsewhere: suspicion falls each month.'] |
| [src/codex.js:134](../src/codex.js#L134) | ['suspicion', 'The Emperor\'s eye', 'Every favour you do the rebels draws the palace\'s attention, and so does every prisoner and every freed contact. A Praetorian taking notes, Favour slipping for no reason, a curious guest: these are the signs. Ignore them and the Praetorians come at dawn.'] |
| [src/codex.js:135](../src/codex.js#L135) | ['freed', 'The freed', 'Everyone you free becomes a contact outside the Ludus. When the day comes, they will be in the crowd: each one a voice cheering your champion (+5% win chance, up to +20%). The armed barracks rise with them (+10%).'] |
| [src/codex.js:136](../src/codex.js#L136) | ['usurper', 'Silbannacus', 'He took the throne with a knife and a bribed legion, and he has feared knives ever since. The rebels say a usurper can be usurped.'] |
| [src/codex.js:137](../src/codex.js#L137) | ['coup', 'The day of the games', 'When the barracks are armed, the rebels trust you, and your champion is ready, the Emperor will come to watch the Grand Final. If your champion wins it, the empire changes hands.'] |

## 12. Names, flavour and descriptions (lower priority)

Short, everywhere. Some carry rules: keep the numbers accurate.

| Where | Text |
|---|---|
| [src/data.js:440](../src/data.js#L440) | Fighter name pool |
| [src/data.js:93](../src/data.js#L93) | Rival houses |
| [src/data.js:112](../src/data.js#L112) | Patrons |
| [src/data.js:122](../src/data.js#L122) | Emperor's Decrees |
| [src/data.js:167](../src/data.js#L167) | Kinds and their traits |
| [src/data.js:177](../src/data.js#L177) | Classes |
| [src/data.js:196](../src/data.js#L196) | Signature moves |
| [src/data.js:325](../src/data.js#L325) | Buildings |
| [src/data.js:231](../src/data.js#L231) | Decor |
| [src/data.js:385](../src/data.js#L385) | Fight items |
| [src/data.js:292](../src/data.js#L292) | Gods' Days (festivals) |
| [src/data.js:416](../src/data.js#L416) | Boss arena rules |
| [src/data.js:130](../src/data.js#L130) | Scars |
