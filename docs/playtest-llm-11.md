# Playtest LLM-11 — seed 11011 (version 5.4.0 in progress)

## 1. Summary

- **Seed 11011, full career: about 395 commands sent (379 kept in the replay file after I removed refused and read-only ones), about 80 weeks** (Martius wk 1, Y1 to Novembris wk 4, Y2). The career had not ended. I stopped at the command budget, just after my first Imperial Coliseum tournament.
- **Result:**
  - Dirt Pits Boss (Vorath, Power 7) beaten at the first try, Maius Y1 wk 4. House level 2.
  - **Bronze took 9 months and three Boss tries**, all against the same Boss, Urgulania of the Silver Wolves:
    - Sextilis Y1: Nonia 12 vs 15 (13 natural, Gladius, Crowd Favourite). Lost 1–2.
    - Novembris Y1: Agron 14 vs 15–17 with two items. Lost 1–2. Favour fell to 32.
    - Aprilis Y2: Agron 14 vs 14 (the Silver Wolves owed me a life) with five items and Cast the Net. Won 2–0. House level 3.
  - **Silver took 6 months** (Maius–October Y2): lost the T1 Final 1–2 (21 vs 20), lost the Boss Semi-final (21 vs 18) in Quintilis, won T1 (Lyra) and T2 in Sextilis/September (Agron reached that Final too but I capitulated at five injuries), then won the Boss in October. Agron killed Kroth in the Final. House level 4 the same day.
  - Imperial T1 (Novembris Y2): Agron 25 vs 27 in the Quarter-final, lost 0–2.
  - At stop: Gold 27, Prestige 56, Favour 83. #2 of 4 houses (Glory 75), far behind the Silver Wolves (164).
- **Roster at stop:**
  - Agron: Orc Retiarius, Lv 6, Power 25 (8 natural, +11 training, +2 Mighty, 3 Titles, Gladius). The house's real champion.
  - Lyra: Android Blood-Bearer, Lv 6, Power 21. Champion of the Dirt Pits and Bronze.
  - Decima: Orc Ash-Hungry, Lv 2, Power 18 (bought in Silver at 9 Gold).
  - Caelia: Orc Blood-Bearer, Lv 4, Power 16.
  - Nonia: Orc Ornitharius, Lv 4, Power 15. My first fighter, stuck far behind.
- **Deaths:** none of mine. Eight opponents died: three in the arena (Sanguis, Gorrak, Kroth), five by my thumbs.
- **Shape of the run:** a quick Dirt Pits; a Gold famine and a long Bronze wall in Y1 (Gold at 0–3 for most of Aprilis–Septembris; the fighters capped at Trainer level 2's 5 points by Quintilis); then, once Bronze fell, money arrived (Silver purses of 20–37) and Silver went faster than Bronze did. The Prestige spiral of LLM-10 didn't happen here, partly thanks to the Boss Final refund and partly to dice.

## 2. Where I was confused

- **"Can't end the week" printed after an end-week that worked.** When a fighter levels up at the start of a new week, the `end-week` output ends with "(Can't end the week: A fighter levelled up: choose their perk first.)". I read that as a refusal and deleted a successful `end-week` from my replay file (Septembris Y2). The line describes the *new* week. Something like "Before the next End week: choose Lyra's perk" would be clearer.
- **The steward's tasks after Bronze were silently skipped.** When Bronze fell I also held two Titles (Agron) and House level 3, so "Have a fighter who holds two Titles" and "Reach House level 3" never appeared and paid nothing. The next task was simply "Conquer the Silver Coliseum". The same happened with "Reach House level 4" in October Y2. Six of the fourteen tasks were skipped this way, three of them before the first one was given (`src/run.js:487`). I only found out by reading `src/quests.js`.
- **The rival champion was invisible for 17 months.** `quests` said "champion Ithil (0 wins and 0 losses against you)" from Iunius Y1 onwards, but Ithil never came. I wondered whether the feature was switched off. Then in Septembris Y2 the house log said the Dirt Pits' next opponent was "Ithil", fighting for House Corvinus at Power 6 (bug 1). Ithil the rival champion finally arrived in Novembris Y2, as the *Final* of my first Imperial tournament (Power 28).
- **Odds labels still surprise.** Nonia 12 vs Dacia 12 was "Underdog", while Agron 12 vs Dacia 12 was "Favoured" on the same card (traits explain it, but nothing on the card says which traits). Lyra at 14 vs 11 won Round 3 "Against the odds". I replayed with `math`: 70% from the Delta, then −40% from tactics and traits (Feint beats Guard +10%, First Strike +10%, Feint +10%, Phlegmatic +5%, Closer +5%, Ego Armour +5%, Off-Hand +5%, against my +10%). That is correct, but it means a +3 Power lead can be wiped out by tactic choice.
- **Emperor demands in the text port.** The changelog says he speaks the moment you meet one and when you miss one. In the text port there's only the "(done)" tag and the log line. The scenes exist only in `src/main.js:135–141`. Fine for the GUI, but a text-port player never hears him.
- **The winter line after paying early.** I paid the tribute in Decembris; at winter wk 3 the Emperor still said "my collectors have knocked on your door" (`src/dialogue.js:80`). Harmless, but it reads as if I hadn't paid.

## 3. Bugs or things that looked wrong

1. **The rival champion's name is reused for another opponent.**
   - Septembris wk 1, Y2 (after command `end-week` following the Silver T1 win): "The Dirt Pits held its Tournament 1 without your house. Next month: Tournament 2, against Ithil." That Ithil is a Human Blood-Bearer, Power 6, of House Corvinus. The Silver Wolves' champion Ithil (a Human Sagittarius) appeared two months later.
   - `takenNames` (`src/run.js:74–75`) includes the roster, the Market, the fallen, current opponents and nemeses, but not `run.rivalChampion.f`. The champion's name was only in `recentNames`, which keeps the last `NAME_MEMORY` (90) names (`src/run.js:68–71`), so it rolled out after a year.
   - Fix: add `...(run.rivalChampion ? [run.rivalChampion.f] : [])` to `takenNames`.
2. **The rival champion appears far less often than 35%.**
   - Ithil was named in Iunius Y1 (week 13). By Novembris Y2 my top arena had held about nine regular (non-Boss) tournaments that were at least 12 weeks later: Bronze Sept, Oct, Dec Y1 and Martius Y2; Silver Maius, Iunius, Sextilis, Sept Y2; Imperial Nov Y2. Ithil came once, in the last. At `RIVAL.chance` 0.35, eight misses in a row is about a 3% event.
   - I couldn't confirm the cause without instrumenting. Two things worth checking in `rivalChampionFor` (`src/run.js:617–630`): whether the bout passed in has `top: true` when the next month's opponent is drawn (for example, the first tournament of a newly opened arena is drawn while the old arena is still `topTier`), and whether another draw consumes the roll first. It may just be the dice; a seeded tally over 100 careers would settle it.
   - Also: from Silver on, `newOpponent` sets the bracket *Final*, so the champion can only be met after winning a Quarter- and Semi-final. In practice they will be rarer still.
3. **The opponent card shows a feud and a debt of mercy at once, but only the feud applies.**
   - Imperial T1 Final, Novembris Y2: "fights for The Silver Wolves (FEUD: +1 Power against you, 3 months left) (OWES YOU A LIFE: −1 Power against you, 3 months left)". The Quarter-final opponent of the same house fought with "+1 Feud" and no −1.
   - `grudge` (`src/run.js:766`) uses the feud whenever `feud > 0`, otherwise the debt. The card shouldn't list the debt while a feud overrides it (or the two should cancel).
   - How it happened: I spared Nimue (debt set) and then Agron killed Kroth in the Final, which set a feud while the debt was still running.
4. **"Become Champion of …" asks for the impossible.**
   - Novembris Y2: Nonia (Power 15) asked to become Champion of the Imperial Coliseum, whose regulars are 24–28. The want lasts 24 weeks; she can't get within 9 Power of it.
   - `wantFor` (`src/run.js:511`) checks only level ≥ 3 and the top arena. It should also check that the fighter is within reach (for example within 2–3 Power of the arena's Boss, or the house's best fighter).
5. **Room wants always ask for a Bathhouse first.**
   - All three room wants (Lyra Aprilis Y1, Nonia Sextilis Y1, Agron Aprilis Y2) were "A Bathhouse in their room". `wantFor` picks the first item in `roomItems` the fighter doesn't have (`src/run.js:513`, `FIGHTER_WANTS.roomItems` = bathhouse, shrine, trophy). So every fighter wants a Bathhouse until they own one.
   - Picking at random from the items they lack would vary it.
6. **Ludi Apollinares ignores a Hunter's Bow.** In Quintilis Y1, Livia (Basa Ash-Hungry with a Hunter's Bow) fought at 12 + 1 Choleric, without the festival's +1. The festival text says "ranged fighters (Sagittarius, or a Bow, Gun or Spear)". `meleeOnly` (`src/fight.js:129`) counts a Bow only for the Fighter class's own weapon, not bow *gear*. Either the text or the rule should change.
7. **Small things:**
   - The revenge want's log reads "got what they wanted: Face Sol-2 Gravedigger again", while `quests` showed "Beat Sol-2 Gravedigger, who beat them". The goal text is the accurate one; the label is used in the log line.
   - Two friendship scenes, two different pairs, used exactly the same lines ("fights like someone I'd want at my back. Don't tell them I said so." / "Fine. Somebody has to keep them alive.").
   - The winter tribute line after early payment (section 2).

### Fixed since LLM-10 (confirmed)

- **Bloodied Victories in brackets count.** Agron's Silver Quarter-final (Maius Y2, won 2–0 while Poisoned) gave "+5 Favour … Bloodied Victory"; Lyra's Bronze bracket too.
- **The spare reason is right.** "no Favour: the crowd wanted blood (it still meets the Emperor's demand)" under a spare demand (Iunius Y2), and "no Favour: the Emperor demanded a death this month" under a kill demand (Quintilis Y2).
- **The demand shows "(done)"** in the status line as soon as it's met.
- **The Result line separates a bet** (not tested this run: I never bet).
- **Training picks up again**: "Agron switched to Rest: another week of training would overtrain them … Agron goes back to training."
- **Ludus header**: "training costs 2 Gold a week" in Bronze, 3 from Silver, 4 at Trainer level 4.
- **A lost Boss Final returns the buy-in**: "(lose the match; the buy-in comes back …)" in the Silver Boss Final.

## 4. Focus sections

### 4.1 The steward's assignments

**Counts:** 6 completed, 6 skipped silently, 1 open, for 14 Gold in all.

| Task | Given | Done | Gold |
|---|---|---|---|
| (two fighters, first win, upgrade Quarters) | skipped: done before the first task | — | 0 |
| Put a piece of decor in a fighter's room | Aprilis wk 1, Y1 | Aprilis wk 2, Y1 | 1 |
| Conquer the Dirt Pits | Aprilis wk 2, Y1 | Maius wk 4 (paid Iunius wk 1) | 2 |
| Build something the house never had | Iunius wk 1, Y1 | Iunius wk 1 (Liaison), paid wk 2 | 2 |
| Have four gladiators | Iunius wk 2, Y1 | Iunius wk 4 (paid Quintilis wk 1) | 2 |
| Conquer the Bronze Arena | Quintilis wk 1, Y1 | Aprilis wk 4, Y2 | 3 |
| (two Titles, House level 3) | skipped: done the same day as Bronze | — | 0 |
| Conquer the Silver Coliseum | Maius wk 1, Y2 | Octobris wk 4, Y2 | 4 |
| (House level 4) | skipped: done the same day as Silver | — | 0 |
| Conquer the Imperial Coliseum | Novembris wk 1, Y2 | open | (5) |

- **Do they guide you?** The first four did, a little: the decor task pointed me to Birds (Nonia is an Ornitharius), and "Build something the house never had" pushed me into the Liaison. After that the tasks just restate the main goal ("Conquer the Bronze Arena") and sit unchanged for 9 months. They never told me anything I didn't already know.
- **Too easy / too hard?** Both at once. The first four are done in 3 months, mostly by things I was doing anyway. Then one task lasts 9 months. Nothing in between: there's no "Upgrade the Trainer Room", "Build a Medbay level 2", "Win a lower-arena Title", "Win a Silver tournament", which would have been real nudges during the long Bronze and Silver stretches.
- **The rewards are noise.** 1–4 Gold, when a Silver win paid 20–37. In Y1, when 2 Gold was a training week, the 2-Gold rewards did matter once or twice.
- **Skipping loses the reward.** Six tasks were skipped without a word or a coin (`src/run.js:487`). Two of them ("two Titles", "House level 3") were the most interesting on the list. Paying (or at least acknowledging) skipped tasks in one combined line would feel better: "Done already: two Titles, House level 3. +6 Gold."
- **Noise:** low. Each assignment is two or three steward lines; a done line the next week. Never annoying.

### 4.2 Fighters' wants

**Counts:** 8 wants appeared, 6 met, 1 missed, 1 open (and unreachable).

| Fighter | Want | Appeared | Outcome |
|---|---|---|---|
| Lyra | Bathhouse in her room | Aprilis wk 1, Y1 | Met at once (4 Gold), thanked next week |
| Nonia | Bathhouse | Sextilis wk 1, Y1 | Met the same week |
| Agron | Learn from Nonia (bond) | Octobris wk 1, Y1 | **Missed** (12 weeks; sulked winter wk 3) |
| Lyra | Beat Sol-2 Gravedigger | Novembris wk 1, Y1 | Met Martius wk 4, Y2 (Bronze T2), about 4 months later |
| Agron | Bathhouse | Aprilis wk 1, Y2 | Met the same week |
| Lyra | Beat Livia Ironhide | Maius wk 1, Y2 | Met Sextilis wk 4, Y2 (Silver T1 Final) |
| Agron | Champion of the Silver Coliseum | Quintilis wk 1, Y2 | Met Octobris wk 4, Y2 (the Boss) |
| Nonia | Champion of the Imperial Coliseum | Novembris wk 1, Y2 | Open, out of reach (bug 4) |

- **How often:** about one every 2.5 months (8 in 19 playing months), never more than two at once. A good rate.
- **Can you meet them in time?**
  - Room wants: trivially, if you have 4 Gold. In Y1 that was a real choice (Lyra's Bathhouse cost me a recruit for a week); by Y2 it was a formality.
  - Revenge wants: yes, and they were the **best** wants. Both nemeses came back within 4 months, I sent Lyra each time *because* she'd asked, and both fights were close (12 vs 13 with War Paint and Twin Fangs; 18 vs 18 in a Silver Final). Beating Livia in a Final that also won the tournament was the best moment of the run.
  - The title want: yes for Agron (he was my Boss fighter anyway). No for Nonia.
  - The mentor want: hard. With no Exhibition Ring, "both winning on one fight day" meant sending Nonia (Champion of the Dirt Pits) back to the Dirt Pits for −3 Favour and −10 Morale. I planned it for Octobris Y1, then lost Agron's Bronze match by pressing into a Guard. I built the Exhibition Ring in Septembris Y2, too late.
- **Did they matter to my choices?** Yes, more than the steward's tasks. The revenge wants decided who fought (twice), the Bathhouses decided purchases (three times), and the mentor want made me plan a fight day around two fighters.
- **Rewards:** +2 Renown, +2 XP and a mood lift are small but visible. The Renown has a cost: it raises the fighter's "fame expects", and Agron at Renown 28 needed 25 Gold of decor at once to avoid "WILL TURN DISCONTENTED".
- **Repetition:** three Bathhouse wants in a row read as a template (bug 5). The revenge and title lines are good.

### 4.3 The rival house (archrival)

**Counts:** champion named 1 time; met 0 times in a match (seen once on a card, as an Imperial Final I didn't reach); 4 poaches (Duma, Thokk, Vael, Ignatia), 4 of 4 eyed fighters bought; 0 taunts after a fight.

- **Does it feel like a rival?** The *house* does, almost too much: 23 of the 34 opponents I faced or saw on cards fought for the Silver Wolves. The Bronze Boss (Urgulania) was theirs, I killed their Boss Kroth in the Silver Final, I spared five of theirs and ran up two feuds. By Silver, "The Silver Wolves owes you a life" or "FEUD" was on almost every card. That works as flavour, but it means the archrival is the default opponent, not a special one.
- **The champion doesn't feel like a rival**, because they weren't there. One naming taunt in Iunius Y1, then nothing for 17 months except a name in `quests`, then a same-named stranger in the Dirt Pits (bug 1). When Ithil finally appeared it was as the Final at Power 28, two rounds away from a fighter at 25. See bug 2.
- **The race for the year-end purse** isn't a race: at the end of Y1 the Silver Wolves had about 3× my Glory, and 164 to 75 at stop. They reached Silver while I was in Bronze, and Imperial the same month I did. "Year-end purse 8/4/0/0" paid me 4 Gold for second place. Fine, but "keeps pace" in the changelog promises more of a contest.
- **Poaches:** "has its eye on Thokk in the Market. Buy them this week, or they will" is a good warning, but I could act on none of them: my Quarters were full three times, and in Quintilis Y1 I had 0 Gold. The eyed fighters were Market-average (Power 8–10), so losing them never hurt. Four in 17 months is a fair rate; the poach would bite more if it took the best fighter of a better Market (a seasoned Lv 2) or came when you had room.
- **Too often / too rare:** the house is too often (every second opponent); the champion is far too rare.

### 4.4 Talk scenes and friendship alerts

**Counts over 80 weeks (excluding the tutorial):**
- Steward assignments: 13 scenes (6 "done", 7 "your assignment"), 2–3 lines each.
- Wants: 15 one-line scenes (8 asks, 6 thanks, 1 sulk).
- Rival Lanista: 2 (named, arrives).
- Friendships: 2 scenes of 4 lines (Lyra & Caelia, winter Y1; Nonia & Decima, Octobris Y2, after an Exhibition bout).
- Emperor: 3 (the opening, a Boss beaten, the winter tribute).
- Events (not new, for scale): 13 choices.

**Verdict: pleasant, not too much.** About one new-feature scene every 2.5 weeks. The busiest week was Novembris wk 1, Y2: a want, the steward's done and new lines, a want met and an event, which was a lot on one screen but felt like a reward for conquering Silver. The scenes are short, and the fighters' own voices ("My mother would have wept. Then she would have bet on me.") are the best new text in the game.

**What did repeat:**
- The friendship scene is the same template for every pair, word for word, and the steward's explanation (+8 comfort, teaching, grief) repeats in full each time. Show the explanation once, and give the pair lines some variety.
- The three Bathhouse asks were identical.
- The status block (the "⚜ THE EMPEROR DEMANDS" line and the long fighter cards) reprints after every command, so the scenes themselves are a small part of the text volume. The earlier complaint about repeated text is mostly about that, not the scenes.

### 4.5 Balance and economy (briefly)

- **Y1 Gold famine.** Gold sat at 0–3 for most weeks from Aprilis to Septembris Y1. Training at 2 a week was often unaffordable; Caelia and Agron each lost 2–3 training weeks to "not enough Gold". My second Trainer Room (8 Gold) was a mistake: I couldn't afford two trainees.
- **The Bronze Boss is effectively 14–15, not 13.** Urgulania was 13 natural + Gladius (14), + Crowd Favourite (15) on the first try, and came back at 14 natural (15) after beating me. A Trainer level 2 fighter caps at natural + 5 + 1 Title = 12–14. Only Agron (natural 8) could reach it, with five items and an owed life. The wall is lower than in LLM-9, but the Boss's gear and the rival bonus keep most of it.
- **Silver felt fair.** Trainer level 3 (cap 8), a Gladius, Light Greaves and Mighty ×2 put Agron at 21–22 against Finals of 19–21. The refund of a lost Boss Final's buy-in kept Prestige from spiralling.
- **Fame upkeep** became the main Gold sink at Silver: 25 Gold of decor for Agron in one week, plus an Entertainment Room.
- **Upsets:** I lost five matches as the clear Power favourite (+2 to +4) and won two as the underdog. With tactic and trait bonuses worth ±40%, Power is less decisive than the "+3 is 70%" tutorial suggests.

## 5. Top 10 suggested changes (most valuable first)

1. **Make the rival champion show up.** Add it to `takenNames` (bug 1). Check why it appeared once in nine eligible tournaments (bug 2). In brackets, put the champion in the Quarter- or Semi-final, not always the Final, so you actually meet them. And let them appear in a lower arena you fight in, not only the top one.
2. **Make the archrival special, not the default.** Draw most regular opponents from the other houses, and keep the Silver Wolves for the champion, the Bosses and a few others. Then their Lanista's taunts and the year-end race mean something.
3. **Don't ask for an impossible Championship** (`src/run.js:511`): require the fighter to be within 2–3 Power of the arena's Boss, or to be the house's strongest.
4. **Vary room wants** (`src/run.js:513`): pick at random from the items the fighter lacks, and sometimes something that matters more (a War Banner for a showman, a Lion Cage for a Basa).
5. **Pay or announce skipped steward tasks** (`src/run.js:487`): "Already done: two Titles, House level 3. +6 Gold." Add a few mid-arena tasks (upgrade the Trainer Room, win a lower-arena Title, win a tournament in your top arena) so the steward has something to say during a 9-month Bronze.
6. **Fix the feud/debt display** (`src/run.js:766`): show only what applies, or let them cancel to 0.
7. **Make the mentor want reachable without the Exhibition Ring:** allow "both win on one fight day" in any arenas without the Champion penalty for the mentor, or say in the want how to meet it ("Build an Exhibition Ring, or…").
8. **Vary friendship scenes and show the steward's explanation only the first time.**
9. **Text port:** reword the post-level-up hint so a successful `end-week` doesn't look refused, and print the Emperor's met/missed lines (they exist in `src/dialogue.js:168–180`).
10. **Ludi Apollinares and bow gear:** count a Hunter's Bow as a Bow (`src/fight.js:129`), or change the festival text to "Sagittarius, or a Fighter with a Bow, Gun or Spear".
