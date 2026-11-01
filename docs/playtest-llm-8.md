# Playtest LLM-8 — seed 8008 (version 5.1.0)

## 1. Summary

- **Seed 8008, 478 commands, about 87 weeks** (Martius wk 1, Y1 to November wk 4, Y2). The career had not ended; I stopped at the command budget, right after winning the first Imperial Coliseum tournament. About 40 commands were `look`, `market`, `estate` or `store`.
- **Result:**
  - Dirt Pits conquered in Maius Y1 (week 12), on the first Boss try. Wyrr won 2–1 with Maimed ×2 and Blinded, and that made House level 2.
  - Bronze Arena conquered in Aprilis Y2, on the third Boss try:
    - Sextilis Y1: capitulated at "41% chance of death".
    - November Y1: lost Round 3 on a 65% roll.
    - Aprilis Y2: Livia won 2–0 at Power 19 vs 16.
  - Silver Coliseum conquered in October Y2, on the second Boss try. In Quintilis I capitulated the Final at "21% chance of death". In October, Yssa went 6–0 in rounds through the bracket.
  - Won Silver T1 twice and Silver T2 once, and lost one Silver T2 Final.
  - Won Imperial Coliseum Tournament 1 in November Y2 (Livia, 6–0 in rounds). That made House level 5.
  - At stop: Prestige 117 (House level 5, the maximum), Gold 93, Favour 90. #1 of 4 houses: Glory 105 against House Varro's 26.
- **Roster at stop:**
  - Livia (Orc Ash-Hungry, Lv6 max, Power 26, champion of 2 arenas).
  - Yssa (Orc Cestus, Lv5, Power 25, champion of 3 arenas).
  - Zorak (Lv6, 18).
  - Gorrak (Lv5, 17).
  - Ursa (Lv3, 15, a seasoned Silver recruit).
  - Wyrr was retired in December Y1 for +5 Prestige.
- **Deaths: none of mine.** I capitulated twice with the Death Gate open (41% and 21%). One opponent died in the arena: Ulfa, at severity 182 in the Silver T2 Quarter-final.
- **Kills: 2 at the thumbs:** Grosh (Bronze Boss, my rival) and Zenna (Silver Boss, my rival). I spared every other beaten opponent, about 15 of them.
- **Shape of the run:**
  - Gold starvation and the Bronze wall, Iunius Y1 to Aprilis Y2 (11 months, more than half the run). Gold was 0–6 for most of it, including six winter weeks at 1 Gold with nothing to do.
  - Then a snowball: from Silver T1 on, Gold piled up (44 → 59 → 93) and Prestige went from 46 to 117 in seven months.
  - Silver was much easier than Bronze.
  - The new systems (Exhibition Ring, decor, Trainer Lv3/Lv4, sparing for "owes you a life") pushed my fighters well past the opposition. Livia and Yssa were at 25–26 Power by Silver's end, against regular Silver opponents at 15–20.

## 2. Where I was confused

- **Tutorial month, Martius Y1 wk 3.** An event ("An imperial envoy") blocked `end-week` in the middle of the tutorial. One of its two choices was greyed out ("Needs 6 Gold") because I had just spent my Gold on recruits. The steward said nothing about events. "Decide this week's event first" was clear, but it was the first thing the tutorial did not explain.
- **The steward's fight-day line promises a number the text port doesn't show.** It says "Each fighter's line shows their odds, injury risk and the Power both sides will fight with". In the text port, fight-day lines show only the labels: "match Favoured · Injury Low · Death None". "Power X vs Y" exists only in the web UI (`src/ui/views.js:438`). I checked the numbers with a script that calls `fightPowers`; see 4.3.
- **Same Power, different odds.**
  - Martius Y1 wk 4: Wyrr and Gorrak both had Power 6. Wyrr was "Favoured" and Gorrak an "Even fight".
  - Aprilis Y1: Gorrak was "Power 8 vs 6" (with Choleric) but labelled "Underdog". A 4,000-sample run gave 46.5%.
  - The reasons are hidden, and the preview Power doesn't reveal them: Choleric −1 in Round 3, the opponent's Sanguine Speed in Round 1, First Volley and Quantum Analyzer.
- **The humor tells.** Choleric opponents ("loves to Press") Feinted in Round 1 against Gorrak twice in a row: Iulia (Iunius Y1) and Hector and Jovan (Iunius Y2).
  - Phlegmatic opponents ("usually Guards first") Pressed in Round 1 three times: Unit Omega (Dirt Pits Boss), Euryale and Hector.
  - The data says 70/15/15 (`src/data.js:85–88`), so this is within the odds, but "loves to" reads as near-certain.
  - With only 2–3 rounds, one wrong read decides the match. Iulia's Round 1 was "Gorrak wins this round 5% of the time" (Delta 0, a guessed Guard against an unexpected Feint).
- **Prestige in brackets.**
  - The Quarter-final result says "+1 Prestige", yet the top bar dropped by 2: the 3 buy-in is taken at the Quarter-final and only paid back if you win the Final.
  - A lost Final says "−3 Prestige", though that buy-in was already gone.
  - The whole Silver T2 in Iunius Y2 (QF and SF won, Final lost) came to −1 Prestige, which is right under the new rule, but the per-match lines never add up to it.
- **Win Gold on the preview is lower than what you get.** Bronze T1 (September Y1) said "Win: +10 Gold" and paid +12. Bronze T2 (Martius Y2) said +13 and paid +15. The Renown bonus (`src/run.js:1682`) isn't in the preview.
- **Seasoned recruits in the text port.** The Market header says "5 Gold each" (Bronze) or "7 Gold each" (Silver). A Lv2 recruit costs 2 more, and I only found that out from "Can't do that: Needs 7 Gold". The recruit's perks aren't listed either (Ursa had Bloodthirsty, which I saw only after buying her).
- **"Bosses always drop their gear"** (the Armourer text and `codex.js:83`). The Dirt Pits Boss, Unit Omega, had no gear, so nothing dropped. It should say "Bosses always drop gear they carry".
- **Medbay full.** "Can't do that: The Medbay is full" was clear. What was not clear: an injured fighter left on Rest never heals (see bug 5). Gorrak carried a Flesh Wound for 5 weeks.
- **Entertainment Room.** The Estate says only "All fighters −15 Stress each week". It is also +10 Morale comfort per level (`MORALE.perEntertainmentLevel`), and that turned out to be its main value.

## 3. Bugs or things that looked wrong

1. **A disabled Unbreakable still holds the Death Gate.** Dirt Pits Boss, Maius Y1 wk 4.
   - Wyrr took Maimed ×2, and the narration said "Disabled: Knock Prone, Unbreakable" and "lost for this match: …, Unbreakable".
   - With 2 effective injuries he should have been at the Death Gate, but no MORTAL DANGER line appeared. It only appeared at 3 injuries.
   - Cause: `deathGateAt` (`src/fight.js:20`) checks `f.kindTrait === 'unbreakable'` and ignores `c.disabled`. Either the trait should really switch off, or the narration shouldn't list it.
2. **Feed the Ash does nothing while Ash Stacks is disabled, but is still spent.** Silver Boss Semi-final, Quintilis Y2.
   - Livia had Maimed ×2 (Ash Stacks disabled). I used `signature`, and it printed "★ Livia unleashes Feed the Ash!", but her Power stayed 21.
   - Cause: the signature adds to `c.ash` (`src/fight.js:485`), but Ash Stacks only count when the class ability is active (`src/fight.js:190`, `:220`).
   - Fix: refuse the signature when the ability is off, or make the signature's stack count anyway.
3. **Pre-fight odds ignore `boss` and `earlyRound`.**
   - `estimateOdds` (`src/odds.js:7`) doesn't take `boss`, `earlyRound` or `rebels`, though `matchOptions` passes them (`scripts/play-text.js:118`).
   - Result: Quarter- and Semi-final odds assume the opponent can fire a signature. Under `opponentHasSignature` (`src/fight.js:497`) regulars only do that in Finals.
   - Boss odds use the regular-opponent signature rule, not `SIGNATURE.bossLevel`.
4. **The text port's Market hides the seasoned-recruit price and perks.**
   - The header uses `marketPrice` (`scripts/play-text.js:283`); the web uses `recruitPrice` (`views.js:569`).
   - `abilities()` (`scripts/play-text.js:128–132`) prints the kind trait and class only, never `f.perks`.
5. **Injuries heal only in the Medbay, Distracted included.**
   - `advanceWeek` only lowers `weeksLeft` under `f.job === 'medbay'` (`src/run.js:941–953`).
   - Wyrr's Distracted (the changelog's "passing daze") sat at "1w to heal" from September wk 4 to November wk 1, Y1, while he rested.
   - Either Rest should heal light wounds, or Distracted should clear on its own after a week.
6. **The Gold preview leaves out the Renown bonus.** `boutFor().winGold` (`src/run.js:139`) against `bout.winGold + floor(renown / goldPer)` (`src/run.js:1682`). Bug-sized, since the preview is meant to be exact.
7. **Thumbs-down text drops the Morale.**
   - `scripts/play-text.js:611` prints "Thumbs down. +3 Renown." The prompt had promised "+3 Renown, +5 Morale, a kill".
   - Spare now prints Morale, so this is LLM-6 bug 7 in reverse.
8. **Event results capitalize mid-sentence.**
   - Examples: "+10 Gold, It went badly, −8 Favour." (senator, November Y1) and "Livia +3 XP, Zorak +3 XP, It went well." (sparring, Iunius Y1).
   - Source: `src/run.js:1108` pushes 'It went well' / 'It went badly' into a comma-joined list.
9. **The Death Gate display caps at the gate.** Livia with two Maimed ×2 (4 effective) showed "Death Gate 3/3 OPEN", while the fight's MORTAL DANGER line said "4 injuries". The cap is the `Math.min(gate, …)` at `scripts/play-text.js:157`.
10. **The Dirt Pits circuit is frozen.**
    - The Dirt Pits listed "Tournament 2 · OPEN this week" with the same opponent (Tigris, Power 6) every month from October Y1 to November Y2, 13 months.
    - The circuit seems to advance only when someone fights there, and every fighter of mine was jeered or a Champion there.
    - Harmless, but the "Coming up" text for that arena is wrong all year.
11. **Name reuse is worse than in LLM-6.**
    - "Skarn" was three different fighters in three months: an Android Phlegmatic with Quantum Analyzer (Silver T1 SF, Sextilis Y2), an Elf Choleric Firebug (Silver T2 SF, September Y2), and an Elf Fighter in the Imperial Market (October Y2).
    - Fulvia, Ulfa, Lirien, Quintus, Sol-4, Pollux, Orbilia and Ferrum all appeared in my Market and later fought for rival houses as different kinds or classes.
    - "Varro" is both a house and a fighter. Crixus, Ursa, Tetraites and Marcus are back from LLM-6.
12. **The text port always answers the Emperor "I will."** It prints "(You could answer: … You say: "I will.")" through `withReplies` (`scripts/play-text.js:84`), so the new reply choice can't be tested in text.
13. **Small things.**
    - "House level 4 … up to 24 fighters" while Quarters Lv3 houses 5 (Estate header).
    - The "Level up!" tutorial card showed twice in one week (Maius Y1 wk 4).
    - The "Watch the Stress bar" card first appeared in September Y2, a year after Livia had already overtrained to Stress 60 (Sextilis Y1).

## 4. Focus sections

### 4.1 Fun and pacing

**What kept me going**
- **The first Boss.**
  - Wyrr opened the Dirt Pits Boss 1–0, then took a 5%-chance Maimed ×2 and a Blinded.
  - I fought on at "15% chance of death" and won Round 3 2–1 with a correct Press read.
  - Then came Champion of the Dirt Pits, House level 2 and the Emperor's line about heads coming off easily. A strong opening month and a half.
- **The rival.**
  - Grosh (Bronze Boss, Hateful, Spiked Gauntlet, Feed the Ash) beat me twice: a capitulation at "41% chance of death" under First Blood Counts Double, and a 65% Round 3 roll.
  - Coming back in Aprilis Y2 with Livia at Power 19, beating him 2–0 and killing him at the crowd's call was the best moment of the run.
- **Bracket tournaments with the "whole tournament" odds.** Watching "next match Strong favourite · whole tournament Favoured ~60%" turn into a 6–0 run was satisfying.
- **Capitulating felt like a real, informed choice.** The death percentage made it easy to decide, and I never lost a fighter I wasn't willing to lose.

**What dragged**
- **Bronze took 11 of my 20 months.**
  - Bronze opponents were 11–12 Power, against my 9–10 in Iunius Y1, because the Trainer cap was 3 and then 5.
  - The Bronze Boss was 14 Power plus Choleric, Hateful, Killer Instinct and a Spiked Gauntlet, under First Blood Counts Double. That is the same wall LLM-5 and LLM-6 reported.
- **Gold 0–6 for about 9 months.**
  - In winter Y1 I had 1 Gold for 6 weeks. Training cost 3 a week, and there were no tournaments, so I could only press `to-tournament`.
  - The Lv3 Trainer upgrade (16 Gold) took my whole purse in December. Then the 30-Gold Y2 tribute appeared the next week.
- **The last quarter was too easy.** After Silver T1 (Maius Y2) I won 6 of 7 bracket tournaments I entered.
  - The regular Silver opponent was 15–20 Power. Livia and Yssa grew to 24–26 with the Trainer cap of 13, titles from the cascade and the "owes you a life" −1.
  - The Imperial T1 Final was the first even fight in months (26 vs 26).
- **Events:** about one every other week in Y1, and fewer in Y2 (October Y2 had none in 4 weeks, which was nice). Each one still stops `to-tournament`.

**Best moment:** "★ Livia unleashes Feed the Ash!" in the Bronze Boss rematch, then the kill on the rival who had beaten me twice.
**Worst moment:** Iulia, Bronze T1, Iunius Y1: "Gorrak wins this round 5% of the time" at Delta 0 because of one wrong guess.

### 4.2 Balance and economy

**Gold track**

| When | Gold | What happened |
|---|---|---|
| Martius Y1 | 12 → 3 | 2 recruits (3 each), training 1 a week |
| Aprilis Y1 | 9 → 14 → 4 | Spy ransom +6, Quarters Lv2 (6), Zorak (3) |
| Maius Y1 (Dirt Boss) | 8 → 26 → 6 | Boss +18 (Floralia). Trainer Lv2 (10), Exhibition Ring (10) |
| Iunius–Quintilis Y1 | 1–13 | Livia (5), Medbay Lv2 (8). "Needs 2 Gold" stopped training twice |
| Sextilis–October Y1 | 3–24 | Armourer (10), 2 Gladius (7 each), Light Greaves (12) |
| December Y1 | 21 → 6 → 5 | Tribute 15 paid early, then Trainer Lv3 (16) |
| Winter Y1 | 1 for 6 weeks | Nothing to do |
| Martius–Aprilis Y2 | 1–20 | Temple (8), prayers (3 each) |
| Maius Y2 (Silver T1 win) | 1 → 44 | Second Trainer (8), Entertainment (8), Quarters Lv3 (10), decor (about 7), Yssa (7) |
| Sextilis–September Y2 | 33 → 56 | Trainer Lv4 (26), Oracle (8), Liaison (6), Ursa (9), tribute 30 |
| November Y2 | 93 | Imperial T1 win (+25 plus 2 × 12) |

**Verdict: the economy is still starved through Bronze, then flips to plenty at Silver.**
- **Exhibition Ring:** 2 Gold × tier per bout, 4 at Bronze and 6 at Silver.
  - It was my steadiest income in Y1 and paid back its 10 Gold in 2.5 months.
  - It also gives 3 and 2 XP per bout, which is why Zorak and Gorrak reached Lv5–6 without top-arena fights.
- **Decor is the cheapest power in the game now.**
  - A Bird or Fire Brazier costs 1 Gold for +5 Morale comfort. Quarters Lv3 allows 3 of each of 7 items.
  - In Aprilis Y2, Livia's target was 25 ("WILL TURN DISCONTENTED"). Three items for 3 Gold made it 40, and Entertainment Lv2 made it 50.
  - Nobody went Discontented all run. Several of my fighters sat at "Inspired" (+5% win) for 1–2 Gold of birds.
  - LLM-6 found decor too weak. At these prices it is now too strong.
- **"Owes you a life" is close to permanent.**
  - House Varro supplied roughly 80% of my Bronze, Silver and Imperial opponents. Each spare after a blood call refreshes "−1 Power against you for 3 months".
  - I had Varro at −1 from October Y1 to November Y2 without a break.
  - Good design as a reason to go against the crowd, but there is no cost to repeating it.
- **The Challenger rule mattered more than anything else at Silver.** It was right to send my second-best fighter (Yssa, Renown 5–11) rather than Livia (Renown 30, +1 Challenger, often +1 Scouted). Rotating fighters to avoid Scouted and Challenger became the main roster puzzle, which I enjoyed.
- **The Trainer cap is what drives the curve.**
  - Cap 3 (Dirt Pits) and 5 (Bronze) kept me under the Bronze opponents.
  - Cap 8 (Trainer Lv3, Prestige level 3) and 13 (Lv4, level 4) put me well above Silver.
  - The Bronze wall is really "you can't reach Trainer Lv3 until 30 Prestige". I only got there by retiring Wyrr.
- **Second Trainer Room:** useless until the cap was raised, because all four fighters were capped at 5 and then 8 points. Once the cap was 13 it was essential.

### 4.3 The new features

**The tutorial month (verdict: clear and helpful, slightly too short).**
- The five steward steps (recruit two, set one to train, end the week, keep training and rest at Stress 30+, Send on fight day) each completed as I did them. None felt patronising.
- The Emperor's opening is strong. So is the steward's "you can relax, he's gone". Both have good voice.
- **Problems:**
  - An event fell inside the tutorial month (week 3) without a steward word.
  - The steward's fight-day text promises a "Power both sides will fight with" that the text port doesn't print.
  - After the tutorial month, about 15 old-style "Tutorial:" cards kept arriving for a year. Some came late: the Stress bar card in September Y2, the Trainer cap card after the first cap was reached. Some came twice: "Level up!".
  - `skip-tutorial` was never needed. The cards were short and `ok` dismissed them.

**Prestige from every tournament win and the new thresholds.**
- **House level dates:**
  - Level 2 (12): Maius Y1 wk 4, week 12 (Dirt Pits Boss).
  - Level 3 (30): December Y1 wk 4, about week 40. Only with Wyrr's +5 retirement.
  - Level 4 (60): Sextilis Y2 wk 4, about week 74.
  - Level 5 (110): November Y2 wk 4, about week 87.
- So level 2→3 took 28 weeks and level 4→5 took 13. **Too slow in Bronze, too fast at Silver and above.**
- **What a win paid:**
  - Bronze T1/T2: +4/+6 (+6 under Ludi Romani).
  - Silver T2: +9 (+14 under Ludi Romani).
  - Silver Boss: +15. Imperial T1: +8.
  - Quarter- and Semi-final wins: +1 each. They do make a lost Final feel like −1 rather than −3, which is good.
- "A lower-arena win always pays at least 1": confirmed. Dirt Pits wins while in Bronze paid +1 or +2, and Bronze wins while in Silver paid +2 to +5. That is enough to make a rookie's lower-arena fight worth it.
- **Suggestion:** a bigger first step (Bronze T1/T2 at +5/+7), or 25 for level 3, would cut the Bronze wall. 110 for level 5 could go up.

**Morale sinks slowly (3 a week).**
- Works as intended. Wyrr went 60 → 57 → 54 → 51 in the first month. Livia, with a target of 25, took about 10 weeks to approach 40, under a clear "WILL TURN DISCONTENTED and stop training" warning.
- The slow sink plus the warning is a big improvement: I always had time to react.
- The climb is fast (+10 a week, and a revelry or a dog jumped 42 → 57).
- The catch is that the fix (1-Gold decor) is too cheap, so Morale stopped being a decision by mid-Y1.

**Injuries and the Death Gate.**
- **Distracted no longer counts:** confirmed. "Injuries: Distracted, Flesh Wound · Death Gate 1/3" (Wyrr, Bronze T2, Quintilis Y1). But it never heals outside the Medbay (bug 5).
- **Maimed and Senseless count as two:**
  - Maimed ×2 put Wyrr at the gate in Round 1 of the Dirt Pits Boss.
  - Two Maimed ×2 put Livia at 4 in the Silver Boss Final (21% death, capitulated).
  - Yssa took Senseless ×2 plus Poisoned ×2 in one Bronze Boss win.
  - These double wounds come often at Silver: 5 Maimed or Senseless on my side in about 25 matches.
- **Deaths feel fair.** Every lethal situation came with a percentage, and capitulating was always available. No death of mine in 87 weeks. One opponent was slain mid-match (Ulfa).
- **They might feel too rare.** With IronWill/Unbreakable on 4 of 5 fighters (gate at 3), I was rarely at real risk. And the disabled-Unbreakable bug (1) makes it safer still.

**Seasoned recruits.**
- Bronze Market (December Y1): Lv2 Ulfa (Power 8, Speed 6) and Pollux at 7 instead of 5.
- Silver (Aprilis and Sextilis Y2): mostly Lv2, Power 7–10, 7–9 Gold. Ursa (Lv2, Bloodthirsty, Power 10) cost 9.
- Imperial (October Y2): four Lv2 fighters at Power 9–10 for 11 Gold, when Imperial opponents are 22–26.
- Verdict: the price rise is fine, but **one perk and +1 level is not "seasoned"** against those arenas. Ursa needed 13 training points just to reach 15. I bought them as cheap sparring partners, never as fighters.
- The text port hides both the price and the perk (bug 4).

**Temple of Fortuna.**
- 8 Gold to build; each prayer cost 3 Gold.
- Prayer 1 (Livia, Lv5, Martius Y2): gave up Mighty for Iron Constitution / Closer / **Juggernaut**. A good gamble that paid.
- Prayers 2 and 3 (Yssa): two prayers (6 Gold) just to get Swift back.
- **Problems:**
  - The result line doesn't say what it cost or describe the new perks (I had to `codex perk:juggernaut`).
  - There is no way to go back to the original three.
- Fun but marginal: on a plot-limited Estate (5/5 plots until level 3) it lost to the Armourer, and I only built it in Y2.

**Exhibition Ring.**
- One line of output ("Exhibition: Zorak beats Gorrak. +4 Gold."), no narration, no risk of death, a 15% Flesh Wound chance.
- Each spar: +2 Gold × arena tier, +3 XP for the winner, +2 for the loser, and +1 Renown.
- It became a habit every fight day (11 bouts) and paid for itself many times over.
- Possibly too good: it levels the bench almost as fast as the top-arena fighters. It also needs two idle, uninjured fighters, which pushes you to a 4–5 roster early (good).
- It deserves at least a two-line result: Power vs Power and the XP gained.

**Fight-day preview "Power X vs Y".**
- I couldn't see it in the text port, so I ran `fightPowers` on the replayed state each fight day and compared it with the Round 1 fight header.
- **It matched in every case I checked:** Gorrak 9 vs 6, Livia 15 vs 17 (Bronze Boss with War Paint not yet used), Zorak 14 vs 10, Zorak 15 vs 12, Yssa 23 vs 18, Livia 26 vs 22.
- The fight header now also breaks Power down ("Power 17 (15 base, +1 Crowd Favourite, +1 Scouted, −1 Owes you a life, +1 Choleric)"). That fixes LLM-6's biggest complaint, and the opponent card now shows "Power 13 (Natural 12, +1 Gladius)".
- **Where it misleads:**
  - It is Round 1 only. A Choleric shows +1 that turns into −1 by Round 3 (Gorrak "9 vs 6" was a coin flip).
  - Bracket Finals are previewed on the Final opponent's current state. Zenna showed "Power 19" on the card, but fought at 21: Bloodlust, because Livia carried a Maimed from the Semi-final, plus the Challenger bonus.
  - It hides Speed. In about half of the rounds I lost, the deciding factor was First Strike +10% plus Feint +10%.

**Dialogue.**
- The opening is excellent.
- The Boss-win visit ("Heads come off easily in my empire") and the winter one ("A Lanista who pays is a Lanista who lives") landed well.
- The winter visit came after I had paid early, and "my collectors have knocked on your door" read oddly.
- The low-Favour visit never came: my lowest Favour was 44, in November Y1.
- The Liaison's prison records ("Arrested in the Forum on the night the Emperor's statue was defaced") hint nicely at the plot.
- Event results now come with stakes on each choice ("→ −2 Gold; them: +15 Morale for 4 weeks"), which is very clear, apart from the capitalization (bug 8).

## 5. Top 10 suggested changes (most valuable first)

1. **Flatten Bronze through Prestige and the Trainer.** Make House level 3 cost about 24, or raise Bronze tournament Prestige to +5/+7. The real wall is Trainer cap 5 against Bronze opponents at 11–14.
2. **Tone down Silver and above, or toughen it.** By Silver T2, my Trainer-13 fighters with cascaded titles were 5–8 Power above the regular opponents. Either cap Trainer Lv4 nearer 10, or make Silver regulars scale with the player's best fighter.
3. **Fix the disabled-trait inconsistencies:** Unbreakable still holding the Death Gate (`fight.js:20`), and Feed the Ash spent with no effect (`fight.js:485`).
4. **Let Rest heal light wounds** (Distracted and Flesh Wound), or let Distracted fade after a week (`run.js:941`). Otherwise the "passing daze" is a Medbay slot for weeks.
5. **Raise decor prices or lower the per-item comfort.** Birds and Braziers at 1 Gold for +5 make Morale a non-issue. Maybe 3–4 Gold, or diminishing comfort per item.
6. **Limit "owes you a life".** It shouldn't stack or refresh within its 3 months, or it should cost something: a rival house that owes you won't sell to you, or spares cost Renown.
7. **Make seasoned recruits seasoned.** At Silver and Imperial they should arrive at Lv3–4 with training already done (Power near the arena's regulars, the way prisoners of war work now), at a real price.
8. **Pass every match option into the odds,** `boss`, `earlyRound` and `rebels` included (`odds.js:7`). Also add the Renown Gold to the preview (`run.js:139`).
9. **Text-port parity:** print "Power X vs Y" per fighter on fight day, the per-fighter recruit price and perks, the Temple prayer's cost and perk descriptions, the Emperor's reply choice, and the morale part of Thumbs down.
10. **Bracket Prestige bookkeeping:** show the buy-in as "−3 (refunded if you win the Final)" on the Quarter-final line, and print a running tournament total, so +1, +1 and −3 add up on screen.
