# Playtest 3 (LLM): seed 777, text interface, v3 features

## 1. Summary

- **Seed:** 777, played with `node scripts/play-text.js --seed 777`.
- **Commands:** 396 (including about 15 stray `next` or `look` lines that only printed "Can't do that: No match in progress.").
- **Time played:** Martius week 1, Year 1 to Sextilis week 4, Year 2. That is about 68 weeks, including one 4-week winter.
- **Result:** I stopped at the command cap with the career still running, and it was clearly headed for a loss. Favor was 33/100. I had lost the Imperial Coliseum Boss twice (−25 Favor each time), and Vex is "RIVAL (beat you before, now stronger)". The next Imperial Boss in October would take Favor to 8.
- **Roster at the end:** Torq (Elf Ornitharius, Lv 5, about 28 Power in a fight with 2 Fire Braziers), Fulvia (Orc Cestus, Lv 4, scarred Afeared vs ranged *and* vs melee), and Kaeso (Orc Cestus, Lv 4, Cyborg Eye, Afeared vs melee).
  - Decima died to Vex in the Imperial Boss (Quintilis week 4, Year 2).
  - I retired Gaius to the Hall of Champions in Sextilis, Year 2.
- **Shape of the run:**
  - **Very fast first year.** I beat the Dirt Pits Boss in Maius Y1 (Kaeso, 2–1), the Bronze Boss in Sextilis Y1 (Decima, a 40% underdog, won 2–0 by countering both rounds) and the Silver Boss in November Y1 (Fulvia, 70%).
  - **Then a hard wall at the Imperial Coliseum.** Bosses there are Power 23–24 plus +2 from gear, plus feud and scouting. In a fight that came to 27–28, while my best fighters sat at about 24–26.
  - **Year 2 was a grind.** I farmed lower-arena titles and gold to close the gap, fed by Favor I had banked at 100. The Imperial T1/T2 bouts became winnable (Torq beat Crixus and Grosh), but the Boss stayed out of reach.

## 2. Where I was confused

- **Martius week 2, Y1: the first event card.** The spy card offered "Hand him to the Emperor's guard" and "Ransom him back" with no numbers. The Codex (`codex basics:events`) promises "Each card offers a choice with visible stakes". I only learned the stakes afterwards ("+6 Gold", later "+3 Favor").
- **Martius week 3, Y1: one Trainer Room.** `job f5 trainPower` failed with "Fulvia is training (1 Trainer Room)" because I set the jobs in the wrong order. It's clear once you see it, but a swap command (or "switch Fulvia to rest and train Decima?") would help.
- **Martius week 4, Y1: math mode vs. the Oracle.** With `math` on and no Oracle built, I still saw exact numbers ("Fulvia wins this round 71% of the time"), while the bout preview said "Build an Oracle to see exact percentages." Math mode makes the Oracle's level 1 pointless.
- **Maius week 4, Y1, and onwards: Scouted.** Decima was "Scouted: opponent +1 Power (they fought here last month...)" in the Silver Coliseum, which she had never entered. She had fought the *Bronze* Boss the month before. Kaeso also kept "Scouted" across the whole winter (December Y1 to Martius Y2). See Bugs.
- **Every fight: what the win % is made of.** Math mode shows the Power gap and the final %, but not the modifiers in between. Some examples I couldn't explain:
  - "Power 9 vs 7: Delta +2. Kaeso wins this round 37%" (Maius Y1).
  - "Power 13 vs 11: Delta +2 ... Torq reads it ... 42%" (October Y1).
  - "Power 27 vs 27: Delta 0. Decima wins this round 10%" (Quintilis Y2).

  The tip says "Nothing is hidden", but the breakdown is hidden in the text port.
- **Displayed Power vs fight Power.** The fighter card shows Power without gear, Fire Braziers or the Cyborg Eye. It does include titles and perks.
  - Torq's card said 11 while he fought at 13–14.
  - After `augment f13 0` ("Kaeso wakes with a Cyborg Eye"), the card still said "Power 18".
  - Equipping a Gladius doesn't change the card either.

  More than once I thought an upgrade had failed.
- **Phlegmatic tell (December Y1).** The tell is "Guards first, then counters your last tactic", but Barca (Phlegmatic) Feinted in Round 1, and so did Mevia and Duma. In code, Round 1 is a 50/25/25 roll (`src/data.js:80`), not "Guards first".
- **"Your house has grown" tutorial (October Y1).** It appeared while I was still at House level 3 (48 Prestige), one level-up late.
- **Tutorial ★.** "The ★ marks what auto-play would pick" (`src/tutorial.js:67`), but the text port shows no ★, only "Suggested: X".

## 3. Bugs or things that looked wrong

1. **Odds ignore Gods' Days, feuds and vengeance.**
   - In Quintilis Y1 (Ludi Apollinares), Kaeso's preview said "Favored ~60%" against Unit Kappa (Bow). In the fight Unit Kappa was Power 13 to Kaeso's 11, because of the festival's +1 to ranged plus Pin at Range.
   - Cause: `estimateOdds` (`src/odds.js:7`) only reads `debuff, overtrained, scouted, challenger`. `createMatch` is called without `festival`, `grudge` or `vengeance`, though `matchOptions` (`src/run.js:157-166`) passes all three.
   - Effect: during feuds (shown on screen as "FEUD: +1 Power against you") and on every festival week, the Oracle's numbers are wrong.
2. **Event choices hide their stakes.** The Codex says "visible stakes" (`src/codex.js:51`), but the text port (`scripts/play-text.js:199`) and the web UI (`src/ui/views.js:543`) both render only `choiceLabel`. "Let them keep it (2 Gold of meat)" turned out to mean "+15 Morale, −10 Stress", which I couldn't have guessed.
3. **Scouting carries across arenas and through winter.**
   - `topStreak` only resets on a tournament week where the fighter didn't fight the top arena (`src/run.js:538`).
   - Winter has no tournament weeks, so it never resets there: Kaeso fought the Imperial in December Y1 and was still "Scouted" in Martius Y2.
   - It also doesn't reset when the top arena changes after a Boss win (`src/run.js:1072-1074`). So "they fought here last month" (`src/explain.js:21`) is false for a fighter who just won the arena below.
4. **The festival bonus leaks into next month's preview.**
   - At Maius week 4, Y1 (Floralia), after the Boss, the next Bronze bout showed "Win: +15 Gold".
   - A week later it showed "+10 Gold". Iunius has no festival.
   - Cause: `boutFor` uses `festivalOn(run.week + weeksUntilTournament(run.week))` (`src/run.js:92`), which is still this week once you are on a settled tournament week.
5. **Retirement text is duplicated.** The text read "Gaius retires to the Hall of Champions. Gaius retires to the Hall of Champions. +5 Prestige, and the roster takes heart." `scripts/play-text.js:419` prefixes the name to a log line that already contains it (`src/run.js:930`).
6. **The favourite who loses a round is hit as hard as an underdog would be.**
   - Example (Silver T2, Martius Y2): Decima at Power 21 lost Round 1 to Duma (14). The narration read "Duma strikes at Decima: needs 90 or less to wound", and Decima's own wound chance was "needs 1 or less".
   - Cause: the injury table is looked up by the size of the Power gap only (`src/data.js:22-26`, used at `src/fight.js:287`). A round loser at Delta ±7 gets the 90% loser chance whichever side is the stronger one.
   - Effect: favourites who lose one round get wounded very often, and an underdog who wins a round is nearly immune. It may be intended, but it made my 80–90% favourites lose two fights and pick up three injuries in Martius–Aprilis Y2.
7. **Crushing and upset checks ignore decor, augments and feuds.**
   - `effectivePower` (`src/run.js:67`) counts only base stats and gear.
   - In December Y1, Gaius won 2–1 against Mevia, who had 2 Fire Braziers (12 Power in the fight against Gaius's 14). He was still told "The crowd jeers Gaius for crushing a much weaker opponent" (−2 Favor).
   - Torq, on the other hand, fights 2 Power above his card and is never jeered for it.
8. **"1 week pass."** This appeared in Sextilis and October Y1, among others. Singular should be "passes" (`scripts/play-text.js:533`).
9. **Event results start with a lowercase letter mid-sentence.** "Let them settle it in the yard. it went well, Decima +1 Renown". The same happens with "it went badly".
10. **Juggernaut is Mighty with a requirement.** Both give "+1 Power." (`src/data.js:292` and `:303`), and Torq was offered both in the same level-up (November Y1).
11. **`help` lists only 3 decor items** ("buy-decor <bird|fireBrazier|trophy>", `scripts/play-text.js:46`). The market also sells Shrine of Mars and War Banner.
12. **Dead fighters' names come back.** Fulvia killed "Sabina of House Varro" in Quintilis Y1, and a new Sabina was in the market in December Y1. Lucilla, Wyrr, Riva, Vex and Morg were also reused for different fighters in different arenas, which made `story` and the rival "Vex will remember this" confusing.
13. **House standings are out of step with the fights.** In Aprilis Y2, The Red Hand had Glory 25 but was listed in "The Dirt Pits" (the climb thresholds are 8 and 20). Tiers only update inside `rivalsCompete` (`src/run.js:240`). Also, Imperial and Silver opponents "fight for The Red Hand" even while that house is listed in the Dirt Pits.
14. **"Disarm" narration reads backwards.** It said "Gannicus: disarmed (Fists)." for an Ornitharius. The "(Fists)" is the source, Decima's weapon, but it reads as if Gannicus lost his fists.

## 4. Balance

**Tactics: did reading the opponent matter?** Yes, though less than the "+10%" suggests. Over 86 rounds:

- **Following the suggestion (76 rounds):** I countered the opponent 37 times (49%), was countered 15 times (20%), and 24 rounds were neutral.
- **Win rate by outcome:** 78% when I countered, 54% when neutral.
- **How often opponents matched their tell:** Choleric pressed 12 of 25 times (48%), Melancholic guarded 9 of 16 (56%), Sanguine feinted 11 of 21 (52%).

So the suggestion is worth about +3% per round on average. That's real, but it's mostly "press the default". Deviating (about 10 rounds: steady, press under Armilustrium, guard vs a Melancholic) never paid off visibly.

The fight that showed tactics best was the Bronze Boss in Sextilis Y1. Decima was a 40% underdog against a Phlegmatic: I Feinted into their Round 1 Guard, then Guarded against their counter-Press, and won 2–0.

The worst case is that **Feint + first strike + counter stack to about +30%**. Kaeso won Round 1 at "Power 11 vs 13: Delta -2 ... 78%" (Quintilis Y1), and Decima had 10% at Delta 0 against Vex. Speed matters through Feint far more than the Speed tutorial lets on.

The suggestion also ignores festivals: it still says "guard" against a Choleric during Armilustrium, when Press gets +5%.

**Events: mostly noise.**
- I saw about 20 cards in about 60 active weeks.
- The repeats were heavy: "A spy in the Ludus" five times, "A beast loose" three times, "A stray at the gate" three times, "Brawl" three times.
- **Morale effects do nothing.** Morale drifts 10 a week toward its target (`MORALE.drift`, `src/run.js:523`), so "+10 Morale" (revelry) or "−10 Morale" (punish) is gone the same week. That makes "Punish them both" (−10 Morale, −10 Stress) strictly good, and "Sell the lot" (+4 Gold, −5 Morale) strictly better than keeping the gifts.
- The spy card is a free +3 Favor or +6 Gold every time.
- The only real decisions were the gambles: the senator's purse (lost 8 Favor) and sending a fighter after the lion (won twice, lost once).

**Gods' Days: they mattered.** I planned around them: Floralia gold, Ludi Plebeii doubling upset rewards, Saturnalia making a hopeless Imperial T1 free to enter (lose for +8 Gold). But the odds don't include them (Bug 1), so the Oracle actively misleads on those weeks.

**Rival houses: barely mattered.**
- The rivals stayed in the Dirt Pits or Bronze with Glory 0–40, while I reached 75.
- Feuds came from kills I didn't choose (Fulvia's and Kaeso's opponents died from 90% wounds). Their real effect was +1 Power on the next Imperial Boss, because the Boss happened to fight for The Red Hand.
- Vengeance (+5%) never showed up in a fight I noticed.
- The houses work as a modifier on fights, not as a race.

**Too easy:**
- **Dirt Pits through Silver.** Three Bosses in 9 months of Year 1.
- **Lower-arena titles are almost free.** Win 3 times or beat the Boss and get "+1 Power each". Every fighter collected 2–3 titles. A jeer costs only 2 Favor, which is nothing at Favor 100.
- **Market fighters scale up so fast** (Power 10–12 at level 1 by the Silver/Imperial tier) that early training matters less than I expected.

**Too hard: the Imperial wall.**
- Opponents jump from 15 (Silver Boss) to 21–24 plus gear (+2), and the Trainer cap is 13 until Prestige level 5 (90 Prestige). Prestige grows slowly: lower arenas pay half Prestige per tier below, and Imperial T1/T2 losses cost 4.
- So my fighters stalled at about 24–26 while Bosses were 27–28. Each failed Boss costs −25 Favor.
- **Winter is dead time.** There's no income, training costs 4 Gold per fighter-week, and I had 7 Gold. I spent 4 weeks doing nothing.

**Pointless:**
- **Augment.** It costs 30 Gold and 2 Renown for +1 Power. Training gives +1 for 4 Gold, and a Blinded wound heals in 2–3 weeks anyway. It only makes sense once a fighter is at the Trainer cap.
- **Morale decor**, beyond keeping stars out of Restless.
- **The Liaison.** I never needed it.

## 5. What was fun, and what was boring

**Fun:**
- **Mid-fight decisions.** The Bronze Boss read (Sextilis Y1) and the Silver Boss (November Y1, Fulvia won with Poisoned ×2 for a Bloodied Victory) both felt earned.
- **Decima's death.** The Round 3 call at "MORTAL DANGER: Decima has 2 injuries" was a real dilemma: capitulate and lose −25 Favor anyway, or roll a 32% round for the whole game. Losing her there hurt in a good way. The advice afterwards ("Decima fought on with the Death Gate open...") was fair.
- **Scars give fighters a personality.** Decima turned Enraged vs melee. Fulvia ended up Afeared of both styles, a nervous veteran who never got to fight the Imperial. `story <id>` reads well, for example: "Quintilis, week 4 · Year 2: Fell in The Imperial Coliseum · Boss Tournament, killed by Vex."
- **The Firebug + Fire Brazier combo on Torq.** +2 Power for 2 Gold was a satisfying find in the Market text.

**Boring or repetitive:**
- **The `look` output is huge.** Every lower arena reprints the same 400-character "Lower arena: no Favor for winning..." paragraph, plus five fighter lines of odds, each with "Champion here: a win earns no Prestige or Renown, and costs 3 Favor and 10 Morale". By Year 2 each look was about 80 lines, mostly identical.
- **Lower arenas are pure chores.** Three or four extra fights a month, each 3–4 commands, mostly ~100% favourites ending 2–0.
- **The same handful of event cards.** See the Events notes in section 4.
- **Running out of Gold for training** every month ("switched to Rest: not enough Gold for the trainer's fee (4)"), then winter.

## 6. Top 10 suggestions (most valuable first)

1. **Pass `festival`, `grudge` and `vengeance` into `estimateOdds`.** The Oracle is the game's main decision tool, and it's wrong on festival and feud weeks.
2. **Show event stakes on the card**, as the Codex promises (for example "+6 Gold" or "60%: +6 Gold, +2 Renown / 40%: Flesh Wound"). Also make morale effects stick, for example by moving morale's *target* for a few weeks instead of the current value, so those choices aren't free.
3. **Smooth the Imperial wall.** Options: drop Imperial base Power by 2–3; or make Trainer level 5 depend on reaching the Imperial instead of 90 Prestige; or let Imperial T1/T2 wins give a little Favor so the Boss's −25 isn't the only Favor event at the top.
4. **Base the round loser's injury chance on who was stronger**, or cap it when the stronger fighter loses. That way one unlucky round doesn't nearly guarantee the favourite a wound.
5. **Show a per-round modifier breakdown in `math` mode** (First Strike +10, Feint +10, Counter +10, Duelist −5...). The tactics system only teaches anything if players can see why 37% isn't 60%.
6. **Fix scouting.** Reset it on winter and on arena promotion, and word it as "your fighter fought in the top arena last month".
7. **Make the fighter card show fight Power** (gear, decor, augments), or "Power 11 (13 in the arena)". Use the same number for the crushing and upset checks.
8. **Make humors more readable.** Either sharpen the tells (Choleric pressed only 48% of the time), or show last-two-round history and a lean like "Press 60 / Feint 20 / Guard 20". Fix the Phlegmatic "Guards first" wording, and let the suggestion account for festivals.
9. **Trim `look`.** Print the lower-arena rules paragraph once (or only in `codex`). Hide fighters who can't usefully fight there, and collapse "Champion here..." to a short tag.
10. **Variety and pacing.** Add more event types and prevent repeats within a few months. Make the Gold economy less starved (for example a winter income source or cheaper training at low tiers). Stop reusing names of fighters who are dead or still active.
