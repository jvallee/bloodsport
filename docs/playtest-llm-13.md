# Playtest LLM-13: a returning player tries Heat (version 6.0.0-alpha.4)

## 1. Summary

- **Career 1:** seed 13013, `--legacy --patron augur --heat 1` (a season). **391 commands** in the replay file (a handful of refused ones left in; they change nothing). **17 months, 63 weeks** (Martius Y1 to Quintilis Y2). **Won**: Master of the Games at the first attempt at the Grand Tournament. 36 wins, 10 losses, no fighter of mine died. By my count with `careerXp` the career is worth **166 Legacy XP** (28 of them from Heat 1); score 580.
- **Career 2 (a short look):** seed 13014, same flags but `--heat 2`, **21 commands**, two months. I took the Loaded Dice and bet. I lost my first bet at 70% and lost the Dirt Pits Boss as an "80% strong favourite". At Aprilis wk 4, Y1 I had 2 Gold and Favour 35. I stopped there, at about 412 commands in all.
- **Note:** halfway through, the worktree I started in was removed, and I carried on in the main checkout. The replay gave identical results there. The main checkout has uncommitted changes (the `SHORT` season levers in `src/data.js`), but they are all off by default.

**The shape of career 1**

| Arena | What happened |
|---|---|
| Dirt Pits | 2 months. T1 Martius (Rutila, 10 vs 6); Boss Aprilis (Nocturne, 10 vs 7). Trivial. |
| Bronze | 2 months. T1 Maius was an upset (Rutila 13 vs 14, won 2–0). Boss Iunius: Rutila 15 vs 17 under the Emperor's Gaze; I won Round 2 at **18%**. |
| Silver | **The wall: 9 months, four Boss attempts.** Sextilis Y1 lost the Semi-final; T1 September won; October lost the Semi-final (2 rounds at 72% and 60% lost); T1 November lost to the rival champion Sol-2 (rolls of 97.7 and 99.8); December lost the Quarter-final at 73%; then winter. T1 Martius Y2 won (Nocturne); **Boss Aprilis Y2 won** (Rutila vs Lyra, 2–0 at 95% a round). |
| Imperial | 2 months, easy. T1 Maius Y2: Nocturne reached the Final at the Death Gate and I withdrew. Boss Iunius Y2: Rutila won 3 matches, Power 38. |
| Grand Tournament | Quintilis Y2, first try: Rutila 39 vs 37 in the Final, 2–0. |

- **Favour** never fell below 58 (after the Dirt Pits) and sat at **100/100** from Iunius Y2. **Gold:** 0–3 for much of Y1, then 137 → 232 with nothing to buy in Y2.
- **Roster at the end:**
  - **Rutila**, Elf Retiarius (Firebug), Lv 6. Power 37 (5 natural + 21 trained + 4 Titles + Imperial Gladius + Scale Mail + 3 Braziers). Master of the Games.
  - **Urza**, Basa Sagittarius, Lv 6. Power 33 (Lion Cage, 2 Titles).
  - **Nocturne**, Elf Ornitharius (Firebug), Lv 6. Power 33.
  - **Wyrr**, Orc Blood-Bearer, Lv 5. Power 24.
- **Relics (6/6):**
  - Proserpina's Coin (never spent);
  - A Bribed Referee;
  - The Trophy Wall;
  - The Wolf's Pelt;
  - Mars's Whetstone;
  - The Gilded Laurel.
- **Build:** "cheap Elves and Titles". Fire Braziers at 1 Gold each give a Firebug Elf +1 Power apiece (3 per room at Quarters level 3). The Gilded Laurel then adds +1 to every titled fighter in every round, and every Boss win hands out Titles.

## 2. The FUN rubric

### Moments where I wanted to keep playing

- **Martius Y1, minute one: the Fire Brazier discovery.** Two 3-Gold Elves plus 1-Gold Braziers gave Rutila 10 Power against 6 before the first fight. It's broken in a good way: it felt like I'd found a secret, and it shaped the whole career (I bought the second Firebug, Nocturne, because of it).
- **Iunius Y1, the Bronze Boss.**
  - Rutila was 15 against Galla's 17, and the Emperor's Gaze meant no capitulating.
  - Cast the Net plus a correct tell took Round 1 at 43%. In Round 2 the tell was wrong (Galla Guarded instead of Feinting), I was down to **18%**, and Rutila still won.
  - It was the best fight of the career, because I had made real choices and the dice still decided it.
- **September Y1, the first Silver Final.** 23 vs 22, three matches in one fight day. Each match I spent the signature at the right moment. Winning a bracket feels much bigger than winning a single bout.
- **Novembris Y1, the Gilded Laurel card.** Rutila's whole-tournament odds jumped from **17% to 65%** on the next card. That is the Fortune draft at its best: one card that changes the plan.
- **Novembris Y1, the rival champion.**
  - Sol-2 of House Severa turned up in my Silver Semi-final and beat Rutila with two rolls of 97.7 and 99.8 against 62% and 89%.
  - Their Lanista toasted my house, and Rutila's want became "Beat Sol-2 Widowmaker".
  - I really wanted that rematch. It never came: Sol-2 next appeared in a lower-arena bracket on the week of the Grand Tournament, when Rutila couldn't go. The hook is great; the payoff didn't arrive.
- **Aprilis Y2, the Oracle foresaw "Iron Rules"** (room decor gives no bonus) for the Silver Boss. That switches off my whole Brazier build for one fight, and Urza with her Lion Cage became my best fighter. A Boss rule that counters your build, seen a month ahead, is exactly the kind of planning puzzle that makes a run feel alive.
- **Maius Y2, the Imperial T1.**
  - Nocturne won a 2–1 Semi-final at the Death Gate (3 of 3 with Iron Will).
  - The Final was 12% to win and 61% to die. I still held Proserpina's Coin: do I spend my one life-save on a 12% shot? I withdrew; the Bribed Referee made that free.
  - That was a genuine relic decision, the best one I made all game.

### Dead stretches

- **The Silver wall, Sextilis–Decembris Y1 (5 months), plus winter.**
  - Three Boss losses against the same Final (Lyra) that I never even reached. The months repeated: Fortune card, train, Boss Quarter-final, lose a coin-flip round.
  - The Gold famine made it worse. Upgrading the Trainer Room to level 4 raised the fee for **every** trainee to 4 Gold, and right after spending 26 Gold on it I couldn't afford to train for two weeks.
- **Winter (4 weeks):** one event, one Fortune card, nothing to decide.
- **From Martius Y2 on, the regular tournaments were formalities.**
  - Silver regulars stayed at 18–22 while my fighters were 25–28 ("whole tournament: 99%").
  - Every lower arena "jeers" my fighters, so the only use for the spare fighters was a 3-Gold Exhibition spar each week.
  - From Iunius Y2 Gold piled up (137, then 232) with nothing to spend it on, and Favour was 100.
- **The Fortune draft for the last 8 months.** I had 6/6 relics by Novembris Y1, and after that **no relic card is ever dealt again** (`src/run.js:1859`). The draft became Power 9–16 fighters (useless at Silver and Imperial), XP boons and purses. Five of the last six draws were obvious "+2 XP or +9 Gold" picks.

### Meaningful vs fake decisions

- **The Fortune draft was meaningful for about 6 months, then mostly fake.**
  - **Real choices:**
    - Bribed Referee vs The Gods Smile (+1 Power) in Aprilis Y1;
    - Wolf's Pelt vs +2 XP (a level-up for two fighters) in Sextilis;
    - The Gilded Laurel vs the Executioner's Axe (+2 Power, +10% to injure) in Novembris.
  - **Fake:** fighter cards. Every one of the ~15 I saw was far below my roster's level (Power 9 at Silver, 13–16 "legends" in the Imperial). The fourth card from the Legacy mostly added a second dud.
  - **Spinning** was worth it twice (3 Gold), but the reroll text and the hint both say "three cards" although four are dealt (bug 3).
- **Is one relic always the pick?**
  - **The Gilded Laurel is.** Titles come free with every Boss, all three of my main fighters had one by Bronze, and it's +1 Power in **every** round. Nothing else comes close.
  - **Mars's Whetstone** (+1 in Round 1) is a solid second.
  - **Proserpina's Coin** is safe but passive: I never spent it.
  - **The Trophy Wall** (+1 Prestige per win) is filler.
  - **The tag relics** (Sandals, Shell, Chain, Mask) never fitted. Perks come three at a time at random, so I couldn't plan a 3-Swift or 3-Guarded fighter.
- **Perks:** Mighty is the pick whenever it appears (it did 7 times). Swift was right once (Rutila's Speed 4 meant opponents always struck first). Iron Will mattered (Nocturne survived the Imperial semi at 3 injuries).
- **Wants:** the revenge want (Sol-2) was great. **"Retire with honour"** came twice, from my two best fighters (Rutila in September Y1, Nocturne in Maius Y2). Saying no cost one sulky line ("So I fight on. Fine."), so it isn't a decision; it's flavour that asks for the impossible.
- **The Emperor's summons** (September Y1): I chose Wyrr and "yield", and it resolved in one line ("lost, but survived, with Blinded, Blinded. Favour +5"). The choice was real, but the fight was invisible.

### Fights: did the crowd, the tells and All In create tension?

- **Oracle tells: strong, and they make most rounds a solved puzzle.**
  - **The bonuses stack too easily.** A correct counter (+10%), plus Feint's +10% when you strike first, plus First Strike's +10%, is +30% from the tactic choice alone. Rutila had **95% at a Delta of +1** in two Boss Finals (Lyra, Aprilis Y2) and 95% at a Delta of −1 with Cast the Net. Once the Oracle is level 2, picking the counter is not a decision; it's reading.
  - **My tally of 90 tells** (parsed from the full transcript):

    | Oracle | Tells | Right | Agreeing with the temper | Contradicting it |
    |---|---|---|---|---|
    | Level 1 ("7 in 10") | 12 | 11 | – | – |
    | Level 2 ("9 in 10") | 78 | 66 (85%) | 47 of 49 (96%) | 19 of 29 (66%) |

  - **So the text misleads in exactly the interesting cases.** "Right about 9 times in 10" is true on average. But when the tell goes against the fighter's temperament, it is right only about two times in three. The suggested tactic does account for this (Bayes in `suggestTactic`, `src/fight.js:119`), which is why "Suggested: feint" sometimes contradicts "means to Feint". As a player I read that as a bug until I read the code.
  - **What works:** most of my losses came from these contradicting tells (Galla, Aeris, Carpophorus, Tessel), and those were the moments of tension. Some uncertainty is good. Make it visible.
- **The crowd meter: it never reached the mark in the whole career.**
  - In about 90 rounds the highest value was **30/100** (the mark is 35). Press is +15 and a wound is +15; Guard is −10 and a Feint is 0.
  - Following the tells means Guarding a third of the time, and best-of-three matches usually end 2–0, so there's never a third round to spend the +1 in.
  - The hype also starts again at 0 in each bracket match. In practice the meter is a number that moves and does nothing. I never once chose Press "for the crowd".
- **All In: I used it once,** at the Death Gate in the Silver T1 Quarter-final (Quintilis Y1, Rutila with Senseless ×2).
  - The game showed "fighting on: about 13% chance of death" and "All In: about 10%". **All In was both the better and the safer choice**, so there was no gamble.
  - It won (78%), and Rutila took another wound (the +45% to be injured landed), but winning the round meant it didn't matter.
  - The narration printed "Rutila **undefined**; Pavo Presses" (bug 1).
- **Signatures** (from level 3) were the best tactical layer: once per fight, timed by me. Cast the Net in the round I'm slower is a real choice.
- **Heat 1 (Harsh Judges) was invisible.**
  - It adds −5 Favour to a lost Boss, but early-round Boss losses are halved (`BRACKET.earlyBossLoss`, `src/run.js:2943`). My three Silver losses cost −12 each, so Heat 1 cost me about 8 Favour in 17 months, while Favour ended at 100.
  - **Heat 2 (the greedy tribute, 23 Gold instead of 15) bit at once** in career 2: Gold 0 in Aprilis Y1 and a lost Dirt Pits Boss put me at Favour 35. Heat 1 as the first step teaches "Heat is nothing".

### Does the Legacy make me want another career? Would I start one straight away?

- **Yes, and I did** (career 2, seed 13014, Heat 2), for one reason: **the Augur's opening pick.**
  - Starting with a choice between Proserpina's Coin, the Loaded Dice and Mercury's Sandals (or the Laurel, the Tortoise Shell and the Dice) makes month one about a build, not about buying the cheapest fighter.
  - Add the fourth Fortune card and a starting Oracle, and the first 6 months of a returning career feel noticeably richer than a first career's.
- **But I wouldn't play a second Heat 1 career to the end.** By month 10 my build was complete (6/6 relics), the Oracle had solved the fights, and the last 7 months were a formality.
- **Unlocks that didn't land:**
  - **The starting Oracle** makes the Dirt Pits even easier than before; a returning player needs harder, not easier, early fights.
  - **"Returning legends" never appeared.** In the text port `--legacy` passes no Hall (`scripts/play-text.js:839`), so this unlock can't be playtested here. The two "Retire with honour" wants hint that the designer means the Hall to be the hook. In this run I couldn't feel it.
  - **The end of a career** in the text port shows no Legacy XP, no level and no "Heat 2 unlocked" (`scripts/play-text.js:305`). The moment that should say "one more career" says nothing. (By my count: 166 XP, about two Legacy levels.)
- **The Loaded Dice** in career 2: a 5-Gold bet at ×1.28 returns +1 (+2 with the Dice). At Dirt Pits stakes the relic is worth almost nothing, and the bet message doesn't mention it.

## 3. Where I was confused

- **"Take one of the three cards below"** while four were listed, and "spin: three new cards" that dealt four (`src/hints.js:15`, `scripts/play-text.js:309`).
- **Tells vs the suggestion.** "Sabra means to Feint (7 in 10) … Suggested: feint." (Aprilis Y1.) It reads as a contradiction. The suggestion was weighing the Melancholic temper against the tell, which the text never says.
- **The Fates' Wager in a bracket.** "Win your top bout this month." I won the Silver Boss Quarter-final (October Y1), then lost the Semi-final, and "The Fates collect: −9 Gold (the top bout was lost)". The wager is settled on the tournament's last match (`src/run.js:2980`), so "top bout" means "the whole tournament".
- **A lost Boss's Favour.** The card says "Lose: −25 Favour"; losing the Semi-final cost −12. The halving for early rounds isn't on the card.
- **The Wolf's Pelt with a Distracted wound.** The fighter card listed "Injuries: #0 Distracted", but there was no Pelt bonus. Distracted weighs 0, and the Pelt counts effective injuries (`src/fight.js:217`, `src/data.js:33`). "While your fighter is hurt" should say "while they have an injury that counts toward the Death Gate".
- **"Stripped of Armour"** (the Grand Tournament): Scale Mail's +1 Power still applied, and the Buckler's +2% win chance too. The rule text says armour gear "doesn't work", but only the injury checks change (`src/fight.js:330`; the gear Power at `src/fight.js:218`).
- **The Augur says "three rare relics"** and dealt a legendary first in both careers (Proserpina's Coin; the Gilded Laurel). The pool is everything but common (`src/run.js:1447`, the description at `src/data.js:129`).
- **Raising the Trainer Room** raises the fee for all trainees (Lv 4: 4 Gold, Lv 5: 5 Gold each). The upgrade line says it, but in the moment it read as "a better trainer", and I went broke.
- **The odds before fight day** showed only the Final ("match Long shot 2%") until tournament week, when "next match / whole tournament" appears. For a month I thought 2% was my Quarter-final chance.
- **Names repeat a lot.**
  - The Dirt Pits Boss Sabra came back as a Fortune fighter.
  - Fulvia, a Fortune fighter I passed on, appeared the next month as a Silver Boss Semi-final opponent.
  - Sol-7 was offered as a recruit; Carpophorus and Rufa were in both careers' first Market.
  - It blurs who is a rival and who is a stranger.

## 4. Bugs (file:line where I could confirm)

1. **All In narrates as "undefined".** "Rutila undefined; Pavo Presses." (Quintilis Y1, Silver T1 Quarter-final). `VERB` has no `allIn` (`src/narrate.js:25`).
2. **"87.999%" and "97.999%" win chances** (Silver T1, Maius Y2). The 99.999% cap minus whole bonuses gives values that `fmtPct` prints with three decimals (`src/narrate.js:5–7`). Round to whole numbers when a value is within 0.01 of one.
3. **"Three cards" text with four cards dealt** (`src/hints.js:15`; `scripts/play-text.js:309`). It should use `fortuneCards(run)` (`src/run.js:1912`). With Lean Fortunes at Heat 4 it would be wrong the other way.
4. **"Fortune: a Imperial Gladius for the storeroom."** "a/an" is hard-coded (`src/run.js:1959`).
5. **A "[legendary gear] Leather Vest"** (career 2, Aprilis Y1). The card's rarity is the draw's rarity, but the gear tier is clamped to 1–3 (`src/run.js:1872–1875`). In the Dirt Pits a legendary draw becomes a tier-1 item still labelled legendary.
6. **The Augur's pick includes legendary relics** while the text says rare (`src/run.js:1447`, `src/data.js:129`). Either filter to `rarity === 'rare'` or say "rare or better".
7. **Stripped of Armour leaves armour gear's Power, Speed and win bonuses** (Scale Mail +1 Power in the Grand Tournament) (`src/fight.js:218` uses `gearOf` regardless; only `armorWorks` at `src/fight.js:330` checks the rule). Fix the rule or its text (`src/data.js:504`).
8. **The Wolf's Pelt ignores Distracted** although the card says "while your fighter is hurt" (`src/fight.js:217` uses `effectiveInjuries ≥ 1`; Distracted has `weight: 0`, `src/data.js:33`). Probably intended; the text should match.
9. **No relic card can ever be dealt at 6/6 relics** (`src/run.js:1859`), and there's no swap. Not a code bug, but it switches off the draft's best card type for the rest of a career (Novembris Y1 onwards in mine).
10. **All In's death estimate was lower than fighting on** (10% vs 13%, Quintilis Y1). If that's right, All In dominates at the gate whenever you're the favourite (`deathRisk` in `src/fight.js`). I'd check that the +45% self-injury chance is counted on a *lost* round as well as a won one.
11. **Text port only:** no Legacy XP, score or unlock at the end of a career (`scripts/play-text.js:305`). And `--legacy` gives the "legends" unlock with no Hall (`scripts/play-text.js:839`; `returningLegends`, `src/run.js:1915`), so legend cards can never appear.

**Fixed since LLM-11 (confirmed):**
- Steward tasks done early now pay and are announced ("I was going to ask for this next: reach House level 4. You'd already done it… +2 Gold").
- The rival champion shows up: Sol-2 in the Silver T1 Semi-final in Novembris Y1, and again in a lower bracket in Quintilis Y2.

## 5. Top 10 suggestions (most important first)

1. **Keep the relic draft alive all career.** At 6/6, still deal relic cards and let the player swap one out (say what is lost). Or add "relic upgrades" (a second Whetstone round). The Laurel moment in Novembris was the peak of the run, and after it the draft went flat for 8 months.
2. **Make the tells a resource, not a solution.** Ideas:
   - At Oracle level 1, one tell per match; at level 2, two.
   - Or: famous fighters (high Renown) face opponents who bluff more.
   - Show the honest number for the case at hand: "this goes against their temper: about 2 in 3".
   - Consider trimming the counter + Feint + First Strike stack (+30%), so a +1 Delta Boss Final isn't 95%.
3. **Make the crowd reach the mark.** In about 90 rounds it never did. Options:
   - a lower mark (25);
   - +10 for a correct counter and for a won round;
   - carry half the hype through a bracket;
   - let the crowd's favour last for the rest of the match, not one round.
   Then Press "for the crowd" against a Guard tell becomes a real gamble.
4. **Make All In a gamble.** Its death risk should be visibly higher than fighting on, with a bigger payoff: an instant +35 hype (the crowd's favour now), double Renown. Today it's both safer and better.
5. **Fortune fighters should be worth taking at your level.** Scale fighter and legend cards to your third-best fighter's Power, or make them a "veteran trainer" (+N training cap for one fighter). From Silver on, every fighter card was dead.
6. **Fix the economy curve.**
   - Y1 is a famine: the Trainer fee rises with each level and applies to every trainee.
   - Y2 is a glut: 232 Gold and nothing to buy.
   - Soften the fee jump and add late sinks: buy Prestige or Favour, a Patron's auction of rare relics, paying a retired champion to train the others, a legendary Market fighter.
7. **Heat 1 should bite.** Harsh Judges cost about 8 Favour in a winning career. Either drop the bracket halving for Heat, or start the ladder with Hungry Lions or Iron Bosses (felt in every Boss). Heat 2's greedy tribute was immediately felt; Heat 1 should be too.
8. **Shorten the formality months.** Once your best fighter is +6 over an arena's regulars, offer "challenge the Boss early" or let regular tournaments in your top arena scale up (Challenger is only +1). The Silver regulars stayed at 18–22 while I was at 28.
9. **Pay off the retirement wants and the Hall.**
   - At the end of a career, show what retiring would have given ("Rutila would return as a legend in your next career").
   - In the text port, print Legacy XP, levels and unlocks at the end, and let `--legacy` load a sample Hall so legends can be tested.
   - Ask the *second-best* fighter to retire, not the champion mid-climb.
10. **Small text fixes that keep trust in the numbers:**
    - "undefined" for All In;
    - 87.999%;
    - "three cards";
    - "a Imperial";
    - the Augur's "rare";
    - legendary tier-1 gear;
    - the Wolf's Pelt and Stripped of Armour wording;
    - the wager's "top bout" (say "this month's top-arena tournament");
    - the halved Favour for an early Boss loss on the card;
    - fewer repeated names (keep current and recent Fortune and Market names out of opponents).
