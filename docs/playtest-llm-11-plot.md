# Playtest LLM-11: the hidden plot and the 5.4.0 quests (informed), seed 11012

## 1. Summary

- **Seed 11012, full career: 256 commands, 72 weeks** (Martius Y1 to October wk 1, Y2). The career had not ended. I stopped at the Silver wall. I also played:
  - a `--short` branch from the same seed: 100 commands, 31 weeks;
  - two one-command branches off the main line: executing the Emperor's spy, and sounding the spy out as champion.
  - Total about 370 commands.
- **I rewound once.** In Quintilis Y1 I sent a Concussed Ghast into a Dirt Pits Tournament with three blind `next`s, and he died at 16% risk. That was my mistake, not the game's, so I cut those four commands and replayed.
- **How far the plot got: `ready`, in week 53 (Maius wk 2, Y2), 22 weeks after I bought the first political prisoner.** Then came:
  - the informer (wk 59, Iunius Y2);
  - the prefect's offer (wk 71, September Y2; I knew nothing);
  - a raid at suspicion 80 (wk 72, October Y2). I beat it with the forged pass that the freed scribe had sent me.
- **The coup was out of reach.** On the main line my best fighter reached Power 14–15 against Silver Finals of 19–20. I forfeited the Silver Boss and was nowhere near the Grand Tournament. The short branch reached `cause` in week 26 but lost the Bronze Boss, and the champion roll failed. **Endings seen: none.**
- **Roster at stop (main):**
  - Ghast: Orc Fighter, Lv 5, Power 14, Champion of the Dirt Pits and the Bronze Arena. He was also the Emperor's spy, and I kept him.
  - Aelia: Orc Ash-Hungry, Lv 3, Power 12.
  - Fenn: Android Ash-Hungry, Lv 3, Power 13. The political prisoner, and the sworn champion.
  - Released along the way: Eppia and Dentatus, to make room for prisoners. Freed: Nyx (political, officer) and Nocturne (bought from the cells, scribe).
- **Deaths:** none of mine on the kept line. Fenn killed Vipsania in the Dirt Pits Boss. In the execute branch, Ghast was executed as the spy.
- **The rival house:** The Brass Lions went from Glory 4 to 142 and reached the Imperial Coliseum while I sat in Silver on 25. Its champion Tessel (Power 19) turned up once, as the Final of my first Silver tournament.

**Plot timeline, main line.** Hidden state is from a read-only probe that replays my command file. Every choice went through the text UI.

| Week (date) | What happened | Trust / Suspicion after |
|---|---|---|
| 31 (Oct wk 4, Y1) | Bought Fenn from the Liaison: 2 Gold, clue "defecating on the Emperor's statue". Nothing was said. | 0 / 0 |
| 33 (Nov wk 2) | Chalk on the door: I copied the sign. Then the **favours scene** ("Who are they? Not yet.") | 1 / 0 |
| 36 | Bought Nyx (second political prisoner, 1 Gold) | 1 / 0 |
| 37 (Dec wk 2) | Blood at the gate: I hid him. Then the **confession** | 3 / 5 |
| 40 (Winter wk 1) | **Gallery request** came in, plus "A friend in the cells": I freed Nocturne for 8 Gold | 5 / 10 |
| 42 (Winter wk 3) | **The Emperor's spy** (Ghast): I let him be | 5 / 25 |
| 44 (Martius wk 1, Y2) | Pamphlets: I left them | 6 / 33 |
| 47 | House level 3; **Gallery built**; Ghast spared Morg against the crowd (+5, hidden) | 6 / 38 |
| 48 (Aprilis wk 1) | Gallery request met (+1) → stage **`cause`**, and the cause scene | 7 / 39 |
| 49 | **Free me** (Nyx): I freed him. Nyx was an officer, so the barracks counted as armed from then on | 10 / 39 |
| 52 (Maius wk 1) | **Lobby request** (Edict of Mercy): I enacted it the same week (+5 reformist) | 10 / 50 |
| 53 | Lobby met (+2, wasted: trust was capped at 10); The champion: Fenn said yes (66%) → **`ready`**, and the ready scene | 10 / 50 |
| 59 | A curious guest: I fed him a story, and it went badly | 10 / 71 |
| 65 | A cousin at the gate: I let him in | 10 / 78 |
| 71 | The prefect's offer: I knew nothing | 10 / 79 |
| 72 (Oct wk 1, Y2) | **Raid** at 80: I showed the forged pass | 10 / 40 |

**Short branch:**

| Week | What happened | Trust / Suspicion |
|---|---|---|
| 11 | Bought Albia | 0 / 0 |
| 13 | Chalk mark | 1 / 0 |
| 17 | Confession (after hiding the wounded man) | 3 / 5 |
| 20 | Gallery request; built it the same week | |
| 21 | Gallery request met | 6 / 4 |
| 24 | Lobby request; I couldn't afford to host the Senate (6 Gold) | |
| 26 | `cause` | 7 / 6 |
| 30 | The champion: Eppia at 60% said no | |

There was one political prisoner in the short branch, so "Free me" never came. The Emperor's spy didn't appear in 31 weeks.

## 2. Where I was confused

- **What exactly does keeping the spy cost?** The button says "+3 Favour; Ghast: stays, and keeps writing". It actually cost +15 suspicion at once and +2 a month after that. Without the Gallery I could not have known, and nothing marks Ghast as a spy afterwards: not his card, not `story`. Three months later I had half forgotten which fighter it was.
- **The rebels named the spy as their champion.** On the champion card the rebels offered "Ghast, or Fenn". Ghast was the man I had just caught writing to the Praetorian prefect. In a branch I sounded him out (44%, failed), and nothing stops it from succeeding. That reads as a plot hole (Bug 4).
- **Two different spy events.** "A spy in the Ludus" (a rival house's man, ransom or hand over) came twice. "The Emperor's spy" came once. Seeing the old one again after the new one made me wonder whether the palace was back.
- **The Gallery readout in `favours` with nothing left to do.** In week 47, `quests` said "the rising: favours." with no "still needs" list. Every condition was met, but the stage only moves at the next month or the next plot card. I couldn't tell whether something was hidden or I just had to wait. The stage names (`favours`, `cause`, `ready`) are internal ids, not words a player has been told.
- **The Gallery needs a free plot, and the request doesn't say so.** It came in Winter wk 1, when my estate was 5/5 at House level 2. `estate` showed "blocked: No free plots", but the request itself only said "build a gallery". I could do it only after House level 3 (7 weeks later), well inside the 16-week window, but only by luck.
- **"Buy Nocturne… in the Liaison's cells".** The Liaison's actual offer that month was Tigris. Nocturne existed only on the card.
- **"You have bought fighters, and then set them free."** That's what the confession said about me. I had released Eppia to make room for Fenn. A purely practical cut was read as an act of conscience.
- **Mercy is praised and punished at once.** The confession opens with "You have spared lives… even when the crowd bayed for blood… People noticed." Each such spare in the top arena silently adds +5 suspicion (`src/run.js:2643`). In weeks 47 and 51 that was 10 of my 50 suspicion.

## 3. Bugs or things that looked wrong

(Line numbers as of my session. Week numbers are the internal `run.week`. Replay with `--seed 11012` and my command file.)

1. **The hidden stranger never takes a Medbay bed from someone already in it.** `medbaySlots` (`src/ludus.js:28`) subtracts one bed while `plot.hidden` is set. But the cap is only checked when a job is *assigned* (`src/run.js:1348`). In the short branch (week 18), Ghast was already in my one-bed Medbay with Maimed ×2. I hid the stranger, and Ghast kept healing as normal. The card's "one Medbay bed taken for 2 weeks" cost nothing.
2. **The text port only notices finished quests at the end of the week.** `src/game.js:92` calls `checkQuests` after every action. `scripts/play-text.js` never does. Placing the Bird (week 7), building the Gallery (47) and enacting the Edict (52) each showed the quest as still open until `end-week`. The web build seems fine.
3. **`help` gives away the secret building.** `scripts/play-text.js:69` lists `Object.keys(BUILDINGS)`, so "gallery" is in the build list from week 1, before the rebels ask (`buildingKnown` hides it in `estate`).
4. **The spy can become the rebels' champion.** `recruitChampion` targets the two most famous fighters (`src/plot.js:196`) and never checks `f.spy`. The spy card excludes the champion (`src/events.js:167`), but not the other way round. Seen in week 53 (branch file `bg.txt`).
5. **The spy can be your best fighter.** `emperorsSpy` picks any non-political fighter (`src/events.js:167`). Mine was Ghast, Lv 4 with two Titles. "Execute" then means losing the house's star for −15 suspicion and a body. In my game I couldn't even use the body: my estate was full, and Vulcan keeps a body for only 4 weeks. Either is legitimate drama, but it makes "keep" the default for anyone who isn't deep in the plot.
6. **The Gallery's Codex entry repeats itself:** "Shows how much… −2 a month at level 1, up to: Shows how much… −2 a month." `src/codex.js:106` prints the "up to" half even for a building with only one level.
7. **The lobby request tells you to build what you already have.** "If you have no seat at their table, buy one: build a Patron Lounge" (`src/quests.js:107`) came when my Lounge already stood.
8. **The rebels' rewards fall on a full trust bar.** Trust hit the cap of 10 in week 49 (Free me +3). The lobby's +2 in week 53 did nothing. On the main line the Gallery's +1 was the last point before `cause`, but the cause needs only 4, and I already had 6. The real gates were the 12 weeks and House level 3.
9. **A mentor want can be asked and met in the same week.** `wantsMonth` runs at the month's start (`src/run.js:1523`), and `bondOverFightDay` runs later that same week (`src/run.js:1541`). In week 48 Nyx asked "Learn from Ghast", the two bonded on fight day, and the thanks line came straight after. That's four speeches in one screen, and the want was never really a want.
10. **A revenge want can point into an arena where the fighter is Champion.** In week 24 Ghast wanted to "Face Nimue Gravedigger again", who fights in the Dirt Pits. Ghast was its Champion, where a win "costs 3 Favour and 10 Morale". When Dentatus beat Nimue instead, Ghast's want stayed open.
11. **A house that owes you a life can also have a feud with you.** In week 54 the Silver card showed The Brass Lions with both "FEUD +1" and "OWES YOU A LIFE −1" on the same opponent. They cancel out, but it's a confusing pair of labels.
12. **Re-check from playtest #7: `cousinVisit`'s `reveal` now works.** It's read in `src/ui/views.js:554` and `scripts/play-text.js:193`. I let the cousin in during week 65, though, so I couldn't see a Boss rule from it.

## 4. Focus sections

### 4.1 The slow reveal

- **The stages, main line:**
  - week 31: the purchase, with no words at all;
  - week 33: the favours scene, right after copying the chalk sign;
  - week 37: the confession, at trust 3;
  - week 48: the cause scene;
  - week 53: the ready scene.
- **Short branch:** purchase in week 11, chalk mark in week 13, confession in week 17.
- **It is a clear improvement on #7, where everything came the week of purchase.** Buying Fenn and hearing nothing was eerie in a good way. The favours scene's "Who are they? Not yet." works as a hook, and the confession lands harder after two favours.
- **But the gaps are still short.** Purchase to confession took 6 weeks (6 in the short branch too): one chalk mark and one favour. Confession to cause took 11 weeks, then only 5 more to `ready`. After the confession the information comes as fast as the gates open. The cause scene arrived in the same week as three other speeches (a want asked, a bond, a want met, the Gallery thanks: 13 lines in one `end-week`).
- **Who leads the rising, and what the rebels want afterwards, is still never said.** The Codex entry "rebellion:usurper" (unlocked in week 48) is the only lore.
- The ready scene is spoken by Fenn about "your champion", and Fenn *is* the champion. It's a small thing, but the voice slips.

### 4.2 The cause's requests

**The Gallery:**
- Asked in week 40 (7 weeks after the mark), and met in week 47 (+1 trust) once House level 3 gave me a plot.
- It was clear and cheap (10 Gold), but it needs a free plot and doesn't say so (see Confusions).
- **The readout is the best thing in 5.4.0 for the plot.** For the first time I could see suspicion as a number, with its thresholds: "suspicion 50/100 (watched at 20, informers at 40, raid at 80); the rising: cause, still needs a champion sworn". I timed the cousin card and watched the raid line approach (79 → 80 in week 72).
- **Weaknesses:**
  - it shows internal stage names;
  - it says nothing at `ready`, not even "wait for the Grand Tournament";
  - it shows "favours" with an empty needs list while it waits for the month to turn.
- **Its −2 a month barely counted.** It exactly cancelled the kept spy's +2. Suspicion rose by about +1 a month, from one prisoner and two contacts.

**The lobby:**
- Asked in week 52, when I had banked 3 Influence. Met in the same week by enacting Edict of Mercy (2 Influence).
- Enacting cost +5 suspicion and gave +2 trust that was wasted at the cap. **It was trivial because I had hosted early.** In the short branch the same ask came when I had 1–5 Gold and the host fee was 6, so it sat unmet.
- **The ask is clear.** It names the law and the place. But it doesn't say a law needs Influence, or that hosting the Senate is how you get it.
- **Neither request mattered to progress.** The Gallery's +1 happened to cross no real gate (trust 6 against the 4 needed). The lobby's +2 was lost to the cap. Missing one costs only −1 trust. So "the cause's requests" read as optional flavour, apart from the Gallery's readout, which is genuinely useful.

### 4.3 The Emperor's spy

- **The timing is right.** It came in week 42, 11 weeks after the first rebel arrived. It never appeared before then, and in the 31-week short branch (one rebel from week 11) it never appeared at all. That fits `!run.spyFound` and the need for two non-political fighters (`src/events.js:166`).
- **The text is good.** The letter sewn into the bedroll is a strong image.
- **What the button tells you:**
  - Keep: "+3 Favour; Ghast: stays, and keeps writing". The real cost was +15 suspicion at once and +2 a month for good. "Keeps writing" hints at the risk, but there's no scale, and no visible mark on Ghast afterwards.
  - Execute: "everyone −5 Morale; Ghast: executed; the body is kept". This is clear, and suspicion fell from 10 to 0 in the branch. But "the body is kept" means nothing without the Unnatural Temple. The `market` Vulcan line still says only "killed in the arena", not that the spy's body can be raised.
- **The target was my best fighter**, a double Champion. It was a dramatic choice, but a lopsided one: the Favour side looked like a free +3.
- See Bugs 4 and 5: the spy as champion, and the spy as star.

### 4.4 The freeing card

- **It works as designed.** "Free me" came in week 49, only after Nyx made two political prisoners in the house (bought in week 36) and trust reached 3+.
- In the short branch (one prisoner, trust up to 7) it never came in 20 weeks. That's correct.
- **Freeing Nyx was the most powerful single move in the plot.** It gave +3 trust (to the cap), and because Nyx was an **officer**, it armed the barracks for good (`isArmed`, `src/plot.js:72`). "Steel for the cause" never appeared, and the coup's +10% armed bonus came free. The cell is invisible until after you free them (the Codex unlocked "rebellion:officer" on release).

### 4.5 Steward, wants, rival, friendships, talk volume

- **The steward's assignments:** 7 given, 6 met in 72 weeks:
  - decor (week 4 → 7);
  - quarters (8 → 13);
  - Dirt Pits (13 → 24);
  - four fighters (24 → 25);
  - Bronze (25 → 52);
  - Silver (52 →, still open).
  - The skip-if-done rule worked (first win, two Titles and House level 3 were all skipped quietly).
  - The rewards are tiny: 1–3 Gold at `goldScale` 0.5. The "restore the house" framing is pleasant, but the goal list mostly restates the main ladder.
- **Fighters' wants:** 5 seen:
  - Eppia's Bathhouse lapsed. The sulk "Never mind. I didn't really expect it." came weeks after the ask, with no reminder.
  - Ghast's revenge want was a trap (Bug 10).
  - Nyx's mentor want was asked and met in one week (Bug 9).
  - Fenn's Bathhouse was met in a week, for 4 Gold.
  - Ghast's "Champion of the Bronze Arena" (short branch) gives a 20-week window.
  - Wants are cheap Morale wins. The room wants are a nice nudge to buy decor.
- **The rival house:** see section 1 (Glory 4 → 142, Imperial Coliseum by Y2, and Tessel turning up once as a Silver Final). Several Brass Lions events felt live: "has its eye on Bassus… Buy them this week, or they will", then "buys Ferrum… before you could". But a rival that far ahead isn't a rival any more. There was no way to strike back at them except beating whoever they sent.
- **Friendships:** 3 bonds:
  - Ghast and Dentatus (week 28);
  - Ghast and Nyx (week 48);
  - Ghast and Fenn (week 52).
  - Each scene is 4 lines. The steward's line explains the rules well.
  - The same two lines ("fights like someone I'd want at my back" / "Somebody has to keep them alive") were used all three times, so by the third they were wallpaper.
  - Releasing Dentatus and freeing Nyx broke two bonds with no word at all. Ghast's Morale target just fell.
- **Talk volume:**
  - In 72 weeks the text port printed 94 spoken lines, about 1,400 words. Fenn had 22, the steward 23, the Emperor 10.
  - That's fine on average, but it clusters. Week 48 printed 13 lines (cause scene, want ask, bond, want met, Gallery thanks), and week 52 printed 10 (lobby ask, bond, steward done and next).
  - In the text port they all come before the house view, so the actual week's news is pushed off the screen.

### 4.6 Balance notes

- **Suspicion's biggest swings came from the gambles:** the informer's −20/+20 (I lost: 51 → 71) and keeping the spy (+15). The favours themselves are +5 each.
- **At `ready` the plot asks you to keep raising suspicion for nothing.** Refusing still counts toward going cold (`PLOT.refusalsToCold`), and trust is capped. So the cousin and the pamphlets were pure risk. I reached the raid line purely by waiting (week 53 → week 72).
- **The pass from the scribe contact made the raid harmless.** I never saw the forged-pass card, because the letter came free in week 46.
- **The plot is still tied to the hardest part of the game.** I was `ready` at Silver and could not climb further in the budget, which is the same wall as LLM-7 and LLM-10.

## 5. Top-10 suggestions

1. **Make the Gallery request mention the plot** ("you'll need a free plot in the Estate"), or let the cause wait until a plot is free before asking.
2. **Show the Gallery readout in player words, and give it a `ready` line.** For example: "The rising is ready. It waits for the Emperor's games (Grand Tournament)." When every gate is met, say "the next step comes at the month's turn".
3. **Stop the rebels naming the Emperor's spy as their champion** (`src/plot.js:196`). Better: let a kept spy betray the champion's name, a real consequence for keeping them.
4. **Mark a kept spy:** a story line ("Kept on, though you know who they write to") and a small icon on the card. Spell out the hidden cost on the button: "the palace hears everything you hide".
5. **Make the rebels' requests matter.** Raise or remove the trust cap while a request is open, or let the lobby unlock something concrete (a contact, the pass, a lower raid threshold) instead of trust.
6. **Fix the Medbay check for the hidden stranger:** evict the lowest-priority patient, or apply `medbaySlots` when healing (`src/ludus.js:28`, `src/run.js:1348`).
7. **Space out the talk.** Queue at most one or two speeches a week, and push wants and bonds to the next week when a plot scene is due. Vary the bond lines.
8. **Don't let a mentor want be met in the week it's asked** (skip pairs who would bond on this fight day), and don't target a revenge want into an arena where the fighter is Champion.
9. **Give `ready` something to do.** Let the rebels stop asking favours at `ready` (or stop refusals counting), so a careful player can hold position. Or add a "keep your head down" card that lowers suspicion.
10. **Text port fixes:** call `checkQuests` after each action, hide `gallery` from `help` until it's known, and only print the "up to" half of a Codex building entry for multi-level buildings (`src/codex.js:106`).
