# Playtest LLM-5 — seed 2024

## 1. Summary

- **Seed 2024, 399 commands, about 104 weeks** (Martius Y1 to Iunius wk 4, Y3). The career had not ended; I stopped at the command budget.
- **Result:** Dirt Pits conquered in Nov Y1 (third try). Bronze Arena conquered in Martius Y3 (fourth Boss attempt). Won Silver Coliseum Tournament 2 (a full three-match bracket). Lost the Silver Boss Quarter-final. Favor 36, Prestige 42 (House level 3), Gold 22. #2 of 4 houses; House Corvinus is already in the Imperial Coliseum.
- **Roster at stop:** Iulia (Basa Cestus, Lv5, Champion of the Bronze Arena, my carry), Drusus (Orc Ash-Hungry), Brakk (Human Ash-Hungry), Dask (Vampire Fighter, Sword), Wyrr (Orc Fighter, Bow). Kaeso (Orc Retiarius) retired to the Hall of Champions.
- **Deaths:** none of mine. One kill: Iulia killed the Bronze Boss Morg, my three-time nemesis, in Round 3. My fighters reached Mortal Danger about 4 times and were hit twice inside the gate, but neither hit was fatal.
- **Shape of the run:**
  - Fast, fun first arena: Speed training made Kaeso and Dask nearly unwoundable.
  - Then an 11-month wall at the Bronze Arena. Opponents were Power 12–16; my fighters were capped at about 11 by Trainer cap 5. I lost four Bronze Bosses or T1s in a row, and Prestige leaked down.
  - I broke out by retiring Kaeso (+5 Prestige) and winning one Ludi Romani T2 (+9 Prestige) to reach House level 3. Trainer cap 8 then fixed everything within a month.
  - Silver repeated the pattern: T2 Final at Power 17, Boss Final at Power 22.

## 2. Where I was confused

- **Martius Y1, wk 1.** `help` lists `buy-item <warPaint|adrenaline|blessedBandage|crowdBribe>`. The five new items are missing, so I only found them through `market`.
- **Aprilis Y1.** I could not tell why opponent Power changed from round to round (Rusta 7→6, Ilithya 7→6→5). Their humor (Choleric: +1 Power in R1, −1 in R3) causes it, but text mode shows only the opponent's humor tell ("loves to Press"), never the stat effect. The round header says "Power 7 (everything applied)" with no breakdown.
- **Scouted (every month).** "opponent +1 Power (they fought here last month…)": the "they" reads as the opponent, but it means my fighter. Several times I sent my best fighter to the Boss straight after a T2 and ate +1.
- **Quintilis Y2.** I did not realise Morg was the **Bronze Boss**. In the `look` listing the Boss line is easy to miss among the stacked Bronze, Dirt Pits and rule blocks. I typed `skip` and got "Bosses cannot be skipped".
- **Martius Y1 → Sextilis Y1.** The Estate plot trap. At House level 2 I used a plot for a second Fighter Quarters (the only way to fit a Basa) and the Stables. That left no plot for an Armourer or Oracle until House level 3, a year later. Nothing warns you that plots are this scarce, and you cannot demolish.
- **Aprilis Y3.** Storeroom indices shift after `equip`. `equip f46 0` swapped Iulia's Gladius into the store; `sell-gear 0` then sold the wrong item (Light Greaves, bought 30 seconds earlier).
- **Iunius Y3.** The odds label is per Quarter-final, not for the bracket. Iulia was "Strong favorite" for a Silver T2 whose Final opponent had more Power than she did.
- **October Y2.** The Lions in the Arena rule makes 1 injury lethal. The tip still says "Your fighter has two or more injuries…" and the alert says "Iulia has 1 injuries".

## 3. Bugs or things that looked wrong

1. **Outdated help text.** `scripts/play-text.js:47`: `buy-item <warPaint|adrenaline|blessedBandage|crowdBribe>`. It is missing ironTonic, viperVenom, berserkerMushroom, throwingNet and smellingSalts. The decor and building lines build their lists from data; this line is hard-coded.
2. **Mortal-danger tip is wrong under Lions.** `src/tutorial.js:71`: "Your fighter has two or more injuries", shown when the gate was at 1. The alert at `scripts/play-text.js:317` / `src/ui/fightView.js:158` printed "has 1 injuries" (plural).
3. **Name reuse breaks the rivalry story.**
   - "Morg" was the Bronze Boss (Android Blood-Bearer, RIVAL) and, at the same time, a Lv1 "Vampire Retiarius" in the Dirt Pits. After I killed the Boss, a Dirt Pits Morg was still listed.
   - "Ilithya" appeared as my Android Fighter for sale, then as a Vampire Retiarius opponent, then a Human Ash-Hungry for sale, then an Elf Cestus.
   - "Thraxa" switched house and class between months.
   - With feuds and "X will remember this", names need to be unique, at least among living fighters.
4. **Entangle line after the match ends.** "Wyrr is entangled (−3 Speed next round) by Rusta's Net." printed after the deciding round (Martius Y1).
5. **Advice misattributes losses.** On Dask's first Boss loss (Maius Y1) the advice said "Dask was out-powered (Delta -2). Train Power…". He lost rounds he was 75% to win, and the cause was the dice, not Power. `src/narrate.js:153` keys on the worst delta, ignoring the actual win chance.
6. **Win chances clamp to 99.999%** at Delta +1 when First Strike, Feint, a Counter and Concussed stack: "Iulia wins this round 99.999% of the time: 55% from the Delta". This is probably intended, but a +1 Power edge should not be a lock (see Balance).
7. **"Champion of the Dirt Pits" from a Tournament 1 win** (Sept Y1) on the third arena win, before I had beaten that Boss. This is correct per `ECONOMY.titleWins`, but the log made it look like a bug. Consider a line such as "3 wins here".
8. **Minor.** All three of my first recruits rolled Melancholic, and so did most early opponents. With seed 2024 the humor spread looked odd for the first year.

## 4. Balance

**New content**
- **Basa / Stables.** I got the Stables up at Prestige level 2, and the Basa (Iulia, Cestus, Pounce) carried the whole run. The Lion Cage (+1 Power) is a good, flavorful synergy at 5 Gold. The catch is that a Basa costs the same as any market fighter, so "exotic" only means a different Kind. The Stables costs a plot plus 9 Gold, and the Quarters needed to fit the fighter cost another plot.
- **Retiarius.** The Net (−3 Speed after a won round) is strong in Dirt Pits fights, where Speed decides First Strike. Kaeso won the Dirt Pits Boss and stayed uninjured for months. Good.
- **Blood-Bearer.** The off-hand 15% counter fired often but landed rarely; it feels fair. Quantum Analyzer plus the Blood-Bearer Boss (Morg) was a memorable, escalating Boss.
- **Ash-Hungry.** Stacks barely matter: you have to wound first, and fights last only 2–3 rounds. I saw +1 once. It is weak in practice.
- **Matchups.** I saw "Shoots before the net flies +5%" (Bow vs Retiarius) and "The net tangles a blade +5%" (Retiarius vs Sword). They are readable and appear in the math, which is good. In 2 years I never saw an Axe or a Club-vs-armor case, and saw only one Dagger opponent. The new weapons are too rare to notice.
- **Items.**
  - I used Throwing Net, Adrenaline, War Paint and Iron Tonic in 3 Bronze/Silver fights and lost all 3. They cost 7–12 Gold each, while a T1 win pays 10. That is a bad trade at Bronze income: +5% or +1 Power for one round does not move a Long-shot fight.
  - The one-of-each stacking rule is a good idea, but a full stack is about 48 Gold for roughly +10% in one round.
  - Untested: Smelling Salts, Viper Venom, Berserker (bought, never used).
  - Suggestion: make items last the whole match, or halve their prices.
- **Perks.** Bloodthirsty, Counterpuncher and Tactician were offered and are fine. Tactician on a Speed-12 fighter is very strong. Iron Will was never offered across five level-4+ level-ups.
- **Boss rules.** Iron Rules, Rainy Mud, Stripped of Armor and Lions all appeared. Lions made the Bronze Boss tense in a good way. Emperor's Gaze never came up.
- **Untested:** Imperial gear (Armourer Lv1 only), Bathhouse.
- **Speed is overpowered.** +3 Speed per training point versus +1 Power. Speed 12 against a Speed 3–5 opponent gives:
  - automatic First Strike (+10%, or +15% with Tactician), plus Feint (+10%), so +20% before tactics;
  - a near-0% chance to be wounded in the early arenas ("needs 0 or less to wound").

  Dask (Power 5) was favored against a Power 8 Boss. The game is solved early by training Speed only.
- **Difficulty curve.** Each tier jumps sharply: Dirt Pits opponents are about 6–8 Power, Bronze 12–16, and the Silver Boss 22. The Trainer cap is 5 until House level 3, which needs 25 Prestige. Losing at Bronze costs Prestige and Favor, and lower-arena wins pay half Prestige, or nothing once you are Champion there. That gives a death spiral of about 11 months. RIVAL ("beat you before, now stronger") makes it worse: each loss raises the Boss you must beat.

**Deaths**
- Too few, in my experience: 0 deaths in about 25 matches, with 2 hits landing inside the Death Gate.
- Being hit inside the gate is not the death event; the escalating severity roll also has to reach the death band. So "MORTAL DANGER" rarely pays off.
- Fighters on 2 injuries mostly heal in a week or two of Medbay before the next tournament.
- If the owner wants more deaths, the lever is not the injury roll. Raise the death chance once a hit lands inside the gate, or carry injuries into fights more often (for example, Medbay heals one wound per week, not two).

## 5. Fun

**What hooked me**
- Killing Morg, the Boss who had beaten me three times, with a Basa I bought from the Stables a year earlier. That arc (rival, "now stronger", Lions in the Arena, a 1–1 Round 3, a kill and a loot drop) is the best thing in the game.
- Phlegmatic and Choleric opponents I could read, and guessing their tactics.
- The three-match Silver bracket, which felt like a real tournament.

**What was boring**
- The Bronze wall: about 11 months of skipping T1/T2, farming the Dirt Pits for 6–8 Gold, and watching Prestige drop.
- An event almost every week, mostly the same six (spy, senator, omen, revelry, sparring, old wound). Each one blocks `to-tournament`, which slows the loop and makes them feel like chores.
- The text output repeats the four-sentence "Lower arena:" paragraph several times per screen.

**What would make me want "one more week"**
- Visible progress during the wall: a cheaper path to the next Trainer cap, or Prestige from lower-arena Bosses.
- Fights where items and tactics can turn a Long shot into an upset.
- Rival fighters with persistent, unique identities.

## 6. Top 10 suggestions (most valuable first)

1. **Smooth the arena power curve.** Either unlock Trainer cap 8 at House level 2, or cut the Bronze and Silver opponent Power jumps (Bronze T1 should be about 10, not 12; the Silver Boss at 22 against a T2 Final at 17 is too big a jump).
2. **Rebalance Speed.** Make a Speed training point +2, or cap First Strike plus Feint stacking. Speed should not also give near-total wound immunity.
3. **Make deaths happen when promised.** If a hit lands in Mortal Danger, give a clear, sizeable death chance (for example 30–50%) and show it ("Death 35%").
4. **Unique fighter names among living fighters.** Retire the names of dead Bosses so rivalries and feuds read correctly.
5. **Make items worth buying at Bronze.** Have them last the whole match, or halve their prices. Also show the expected odds change before you buy.
6. **Explain the plot economy.** Warn when the last free plot is about to be used, or allow demolishing or replacing a building.
7. **Fewer, weightier events.** Aim for about one every 2–3 weeks, and add more variety. Auto-resolve trivial ones.
8. **Text UI clarity.**
   - Fix the `help` buy-item list.
   - Collapse the repeated "Lower arena:" paragraph.
   - Mark the Boss line clearly ("BOSS — cannot skip").
   - Keep storeroom indices stable, or use ids.
   - Show the opponent humor's stat effect.
9. **Show odds for the whole bracket** (or Quarter-final, Semi-final and Final separately), not just the Quarter-final label.
10. **Make new content show up.**
    - Raise the market weight for Axe, Dagger and Club, and guarantee Iron Will can be offered.
    - Fix the Lions-rule tip and the "1 injuries" grammar.
    - Make the Ash-Hungry stacks also trigger on round wins, so the class matters.
