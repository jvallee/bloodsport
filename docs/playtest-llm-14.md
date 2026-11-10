# Playtest LLM-14 — seed 14014 (version 6.0.0-beta-dev.2, a season)

## 1. Summary

- **Seed 14014, a season (the default career). 388 commands in the replay file**, about 395 sent (I removed four refused ones; two harmless refusals, such as an `ok` with no card, are still in the file). Scratch file: `/private/tmp/claude-501/-Users-jasonvallee-Documents-claude-practice/d3ee2cd5-29bc-4ee0-8c57-535e7685b65e/scratchpad/pt14/commands.txt`.
- **47 weeks played**, Martius wk 1, Y1 to Martius wk 4, Y2: twelve months plus the winter.
- **Result: won.** Master of the Games at the first try of the Grand Tournament. 31 wins and 5 losses, none of my fighters died, 8 kills. Favour went from 50 to 100.
- **Legacy XP: +108** (A career +10, 4 arenas climbed +20, 5 Bosses beaten +15, 8 kills +8, 5 Titles +15, Master of the Games +40). By the code that is Legacy level 2 (48 of 75 XP into it) and unlocks "The Hall Remembers". The text port doesn't say so (bug 6).
- **The climb, arena by arena:**
  - **Dirt Pits, 2 months.** Ithil (10) beat Zorak (7) in Martius. Iunia (13) beat the Boss Eppia (8) in Aprilis, Poisoned, for a Bloodied Victory.
  - **Bronze, 2 months.**
    - Maius: Ithil (18) beat Nocturne (21) at "Underdog ~30%" for +26 Gold.
    - Iunius: Pavo (22, a free Fortune fighter) beat the Boss Caelan (22, the Emperor's Gaze). He used four items, was Poisoned in Round 1 and won Round 3 at 70%.
  - **Silver, 4 months, one Boss loss.**
    - Quintilis: Ithil (31, Speed 3) lost the T1 Quarter-final 0–2 at Delta +2, on rounds of 48% and 45%.
    - Sextilis: Pavo (29) lost the Boss Quarter-final 1–2 to Corvina; Round 3 was 20% at Delta 0. −10 Favour.
    - September: Ithil, now Speed 15 after two Speed weeks, won T1. In the Final he beat Fulvia, the rival champion (35), 2–1 with Cast the Net in Round 3 at 44%.
    - October: the Boss rematch came back at Power 20/21/24 instead of about 31/32/35 (bug 1). Pavo (41) walked through it.
  - **Imperial, 2 months.**
    - November: Liora (Natural **34**) came free from the Fortune draft. Pavo (46) won T1 against 46, 47 and 50.
    - December: Marcia (Natural **41**) came free from the draft. Pavo (52) beat the Boss Urgulania (53). The Semi-final's third round was won on a roll of 90 against 91.
  - **The Grand Tournament, after the winter.** Pavo (59, Speed 15) was shown at 97% for the whole tournament and won 2–0, 2–1 and 2–0 against Jovan (55).
- **Roster at the end:**
  - **Pavo:** Android Cestus, Lv 6, Power 59, Speed 15. Natural 12 from a common Fortune card in Maius. 5 Titles.
  - **Liora:** Basa Retiarius, Lv 5, Power 58, Speed 15. Natural 34 from a Fortune card in November. 3 Titles, won in one Boss bracket.
  - **Marcia:** Basa Ornitharius, Lv 4, Power 52+, Speed 21. Natural 41 from a Fortune card in December.
  - **Ithil:** Orc Retiarius, Lv 6, Power 48, Speed 15. My first Market buy (Natural 7).
  - **Iunia:** Human Retiarius, Lv 4, Power 31. Bought in the first Market (Natural 5).
- **Relics (5/6):** the Butcher's Hook, Mars's Whetstone, the Trophy Wall, Aesculapius's Spring, the Bronze Aegis.
- **The shape of the run:**
  - A fast and tense first four months: Bronze was conquered in month 4, with two real upsets.
  - A Gold famine from Aprilis to September Y1. About ten weekly screens showed 1 or 2 Gold, mostly in Quintilis and Sextilis, when the training fee rose to 4 Gold per fighter-week.
  - A real Silver wall that fell to Speed training.
  - Then three Fortune fighters (Natural 12, 34, 41) turned the second half into a procession. The Grand Tournament was a formality.

## 2. Where I was confused

- **The Trainer cap is in "points", but each point is a week worth +2 Power or +6 Speed.** "Can train up to 3 points" gave Iunia +6 Power, and the log said "Trainer cap reached (3 points)" next to "+6 Training". Say "3 training weeks (+6 Power or +18 Speed)".
- **The Emperor's demands hide their stakes until it's too late.**
  - The banner names the task, but the reward (+2 Favour and 4–8 Gold) appears only once it is met, and the cost (−4 Favour) only once it is missed. `quests` doesn't list the demand at all.
  - It also produced a gamey sum: a jeered Champion win in the Dirt Pits (−3 Favour) to meet "win in two arenas" (+2) beat missing it (−4).
- **Titles cascade.** Liora won the Silver Boss and got three Titles at once (Silver, Bronze, Dirt Pits: +3 Power). Marcia got two from the Bronze Boss.
  - Meanwhile Liora's three match wins in a Silver T1 bracket gave her no Title, though the rule says "Win 3 times here".
  - I couldn't tell what counts as a win for Champion purposes.
- **"Pavo has 2 injuries"** while his card listed three (Distracted, Flesh Wound, Blinded). It counts effective injuries, but the line doesn't say so.
- **A fighter quest said "I have fought in the Bronze Arena long enough to know I can rule it"** in the first week of Bronze, from Iunia, who had never fought there. Ithil said the same after one fight (`src/quests.js:76`).
- **Pavo asked to retire** ("Retire them to the Hall of Champions", 12 weeks) while he was my best fighter. Nothing told me that the Hall feeds the next career (the "Hall Remembers" unlock), so it read as a pure loss.
- **The Fortune fighter card says "Power 34, Speed 3, level 3".** It doesn't say that this is *Natural* Power, with the full Trainer cap (21 points, +42) still to come. I only understood what Liora was when she joined.
- **Floralia:** the listed purse already includes the +50% (I checked `src/run.js:158`), but nothing on the card says so. Same as LLM-12.

## 3. Bugs

1. **A lost Boss comes back at the base Power, without the season's arena offset.**
   - `src/run.js:3306–3307` sets the rival to `CIRCUITS[tier-1].oppPower[2] + 1`, which ignores `SHORT.oppPower` (+12 in Silver) and `SHORT.grandPower`.
   - What I saw:
     - The Silver Boss Final, Lentulus, dropped from 35 to 24.
     - Because `bracketFor` (`src/run.js:202–207`) builds the Quarter- and Semi-finals relative to the Final, the whole rematch bracket was 20/21/24.
     - Iunia (20) was suddenly "Favoured ~70%" in a Silver Boss Quarter-final.
   - So losing a Boss makes the next try about 11 Power easier: the opposite of "waiting for you, stronger".
   - **The same base-only pattern appears twice more:**
     - The Championship want's reach check (`src/run.js:680`). This is why Iunia (14) was offered "Become Champion of the Bronze Arena" against a 22 Boss.
     - The Emperor's summons opponent (`src/run.js:451`). I wasn't summoned, so this one is untested.
2. **"RIVAL (beat you before, now stronger)" was shown for a Boss who never fought me and was 11 weaker** (`scripts/play-text.js:188`). The log correctly said "Lentulus never had to fight you". The label should follow that line.
3. **The suggested tactic is always Guard at the Death Gate** (`src/fight.js:127`, `if (mortalDanger(m.a)) return 'guard'`).
   - Against Rakka ("means to Feint… about 92%") and Lentulus (92% Feint) it suggested Guard, the one tactic that *loses* to Feint.
   - A new player who trusts the ★ at the most dangerous moment is steered into the worst counter.
4. **Flat +1 bonuses can switch Underdog off, so they cost Iunia Power** (`src/fight.js:236` compares the opponent with her Power *after* other modifiers).
   - Iunia (16) against Thalen (19): with Mars's Whetstone (+1, Round 1) and then the crowd (+1, Round 3) the gap fell below 2, Underdog's +2 vanished, and she fought at 18 instead of 19. Net −1 Power, twice in one match.
   - She lost that Round 3 at 37%.
5. **A countered Feint keeps its +10%** (`src/fight.js:595` adds the tactic's first-strike bonus whether or not it was read).
   - Pressing a faster Feinter is the correct read, but it nets only +3 against their +20 (First Strike +10, Feint +10).
   - Examples: Ithil against Ulfa (48%, Delta +2, read right), and Pavo against Corvina (47%, Delta +1, read right).
   - Of everything I saw, this most made correct reads feel worthless.
6. **The text port's end screen shows the XP but not the Legacy level or unlocks** (`scripts/play-text.js:306–308`).
   - `recordCareer` computes `from`, `to`, `unlocked` and `newHeat` (`src/legacy.js:171–179`), but the text port prints only "+108". I had to read `levelFor(108)` to learn that I'd reached level 2 and what it unlocks.
7. **The screen after "CAREER OVER" still reads like an active career.** It shows "Tribute 30 Gold due… (in 37 weeks)", "Grand Tournament in 4 weeks (Aprilis)", "Send fighters to other open arenas", and full odds for four lower arenas (`scripts/play-text.js:302` onwards).
8. **The Emperor's opening speech printed again** on the week-2 screen (after the first `end-week`), word for word.
9. **Minor:**
   - Win chances print as "99.999%". "≈100%" would be cleaner.
   - The Delta prints capped at "+10" when the gap was 21 ("Power 42 vs 21: Delta +10").

### Fixed since LLM-12 (confirmed)

- **All In narrates properly:** "Pavo goes All In; Rakka Guards." There was no "undefined" anywhere.
- **The opponent's signature is telegraphed:** "WARNING: Caelan is gathering for Cast the Net: it comes this round." It came every time it was warned.
- **The crowd's payout is shown:** "the crowd's hype 70: +2 Renown, +1 Gold".
- **The tell and the humour are merged** into one number ("Weighing the tell against their temper: about 45% they Guard"), as suggested in LLM-12.
- **"1 month left"** is singular now.
- **The text port prints Legacy XP at the end** (only the total, though: bug 6).

## 4. Focus: what changed in 6.0.0-beta-dev.2

### The faster season (+2 Power or +6 Speed a week; stronger arenas)

- **Yes, it's quicker.** Bronze was conquered in month 4 and the whole career won in 47 weeks. In LLM-12 I'd only reached the Imperial T1 after 17 months.
- **The first four months were tense in a good way.** Each new arena opened 3–4 Power above my best fighter:
  - Nocturne was 21 against Ithil's 18.
  - Caelan was 22 against Pavo's 22, but with the Emperor's Gaze and four perks.
  - Two weeks of training closed half the gap, and items and reads did the rest.
- **The Silver jump is steep.** The Bronze Boss is 22; the Silver T1 field is 30/31/34 and its Boss bracket 31/32/35. My best fighters were 31 and 29, at a Trainer cap of 13 points that I couldn't afford to use (fees of 4 Gold per fighter-week, with 1–2 Gold in the purse).
- **What got me over the Silver wall was Speed, not Power.**
  - Two Speed weeks took Ithil from Speed 3 to 15. His rounds at Delta +2 went from 48% and 45% (July) to 83%, 88% and 78% (September), because he always struck first and his Feints always landed.
  - In the December Boss preview, at similar Power:
    - Ithil (46, Speed 15): 81% to win the Quarter-final.
    - Marcia (48, Speed 3): 45%.
    - Liora (44, Speed 3): 14%.
  - At +6 a week, one Speed week is worth two or three Power weeks against Silver and Imperial fields (Speed 7–13).
- **Do flat bonuses still matter? Mostly yes:**
  - **Titles were the best flat bonus,** partly because they cascade. Pavo ended with 5 (+5 Power), and Liora got +3 in one afternoon.
  - **Mars's Whetstone (+1 in Round 1)** decided at least one round I remember (Delta +2 instead of +1 against Sylvar).
  - **The crowd's +1** was real in about nine fights.
  - **But:**
    - +1 can be *negative* for an Underdog fighter (bug 4).
    - Past a Delta of +5, Power stops mattering while the opponent's bonuses still subtract. Pavo at Delta +23 still lost a round at 89%.

### Legacy XP

- I earned +108: A career +10, 4 arenas +20, 5 Bosses +15, 8 kills +8, 5 Titles +15, Master of the Games +40.
- The breakdown is clear and satisfying: I can see that the win was worth 40 and that kills are capped.
- What's missing is what it *buys*.
  - The text port doesn't show my level (2), the progress to the next (48/75), what I unlocked ("The Hall Remembers") or what's next ("The Loaded Dice").
  - Without that, +108 is just a score.
  - And since nobody told me that a retired Pavo would come back as a legend, I never retired anyone.
- **Would I start another at once?** Yes, mostly to see whether the draft hands me another Natural-41 fighter. That's a worrying reason (see below).

### The Fortune draft (fighters arrive at most 2 behind your second-best)

- **The fighters were the decisive cards of the run, and the new rule makes them too good.**
  - `keepUp` (`src/run.js:1857–1863`) raises the fighter's *Natural* Power to your second-best's *total* Power, minus 2, plus the rarity bonus (common 0, rare +2).
  - So the recruit arrives level with your second-best, with an untouched Trainer cap still ahead.
- **The three I drafted:**
  - **Pavo** (Maius, common): Natural 12 against Iunia's total of 14. My own recruits were Natural 5–7.
  - **Liora** (November, rare): Natural 34 against Ithil's total of 34. With 21 points of training (+42) still ahead, she could reach about 76.
  - **Marcia** (December, rare): Natural 41. She was the best fighter in the house within two weeks.
- **The Market became irrelevant.** At the Imperial tier it sold Power 11–12 fighters for 9–13 Gold.
- **From November my three Fortune fighters were my three best**, and the Grand Tournament was 97%.
- **Fix:** peg the recruit's total Power rather than Natural Power, and give them only the headroom your second-best has left. For example: Natural = second-best's Natural + rarity, plus pre-trained points so that the total is second-best − 2.
- **The other cards:**
  - **Relics:** good while slots were free. I took five.
  - **Wagers:** three times the Fates' Wager was offered when losing it (−9 to −12 Gold) would have broken me, and in Martius Y2 it was offered for a career that would end with the tournament.
  - **"A Purse of Coin, +9 Gold"** at the end of a 108-Gold career is filler.

### The fights

- **The crowd meter.**
  - It reached the 35 mark in about 9 of 36 fights, against 1 in 30 in LLM-12.
  - Correct reads and wounds now fill it as well as Press: Ithil's correct Feint plus a wound took it from 0 to 50 in one round against Nocturne.
  - The payout line is shown. It feels alive now.
  - The one sour note is bug 4.
- **Oracle tells.**
  - At level 1 the merged forecast was mostly "about 45%" or "about 92%".
    - "45%" means "the tell disagrees with the temper, so you know nothing". It was common, and honest, but flat.
    - "92%" was usually right.
  - At level 2 ("67%" or "96%") they drove every choice. Two 96–97% calls were wrong (Octavia), which hurt, but that's the dice.
  - The Phlegmatic "counters your last tactic" pattern was the most readable thing in the game. I beat it every time I remembered it.
- **All In at the Death Gate.**
  - **It came up 13 times.**
    - Seven times the screen offered All In at 0–3% death against 5–12% for fighting on. These were huge favourites at the Gate (Pavo at Delta +20, Liora at +12). All In was strictly better, so I took it, and won all seven rounds.
    - In the close cases it was strictly worse. Iunia against Sol-9: 18% steady against 29% All In, then 24% against 40%. Pavo against Caelan: 16% against 53%. I capitulated Iunia rather than risk her.
  - **So it's never a dilemma:** it's free when you're far ahead and suicidal when you're close.
  - Combined with bug 3 (the suggestion says Guard), the Death Gate's best moment is mostly arithmetic.
- **Round 3 is where you lose.** The opponent's signature ("Used when behind, or in Round 3"), Closer, and my Choleric's −1 in Round 3 stacked up. Pavo against Corvina at Delta 0 went from 65% in Round 2 to 20% in Round 3. Every close loss I had was a Round 3.

## 5. FUN rubric

### Moments I wanted to keep playing

- **Maius Y1: Ithil (18) against Nocturne (21), "Underdog ~30%".**
  - A correct Feint read and a Maim in Round 1, then the crowd at 50 (+1).
  - He lost Round 2 and won Round 3 at 65% with a Senseless wound.
  - +26 Gold when I had 1. The best first-month fight I've had in this game.
- **Iunius Y1: the Bronze Boss.**
  - Pavo 22 against Caelan 22 under the Emperor's Gaze (no capitulating), Poisoned in Round 1 with the Death Gate open.
  - I saw "WARNING: Caelan is gathering for Cast the Net" and guarded, then won Round 3 on a Press read at 70%. Real relief.
- **September Y1: Ithil beats Fulvia, the Silver Wolves' champion, in the Final.**
  - He lost Round 1 at 82%, which hurt. He won Round 2 with Counterpuncher and Iron Tonic.
  - In Round 3 both signatures went off at once: my Cast the Net against her Aimed Shot, at 44%.
  - Won, +41 Gold, the rival lost 5 Glory. Gold went from 2 to 58, and the whole economy opened up.
- **December Y1: Pavo's Imperial Boss Semi-final.** Calyx Blinded him in Round 2. Round 3 was 91%, and I rolled 90.
- **The two big Fortune fighters arriving.** Honestly thrilling for a moment ("Natural 41, free?"), then deflating once I saw that the game was over.

### Dead stretches

- **Quintilis wk 2 to Sextilis wk 3, Y1 (about six weeks).**
  - The fee rose to 4 Gold per fighter-week at Silver and my purse sat at 1–2 Gold. Nobody trained.
  - Pavo and Ithil sat at 29 and 31 against a Silver field of 30–35.
  - I ended weeks, took the one event a week, and waited for fight day.
- **After the November draft.** Once Liora and then Marcia arrived, every fight outside the Boss Finals was a formality, and the Grand Tournament preview said 97%. The winter's eight weeks were only "set training jobs, `end-week`".

### Decisions that felt meaningful

- **Who goes where on fight day:**
  - keeping my Boss fighter out of T1 so he wasn't Scouted;
  - sending a non-Champion to a lower-arena Boss for a Title;
  - finding a rookie for the Dirt Pits purse.
- **Speed or Power with my scarce training weeks.** It was the most important decision of the run, and the game never hints at it.
- **Capitulating Iunia** at 24% death in a lower-arena Boss, with the Title one round away.
- **Thumbs up or down with consequences:** a spare buys "owes you a life" (−1 Power for 3 months), and a kill can start a feud.
  - The Lions killed Cobalt, and House Varro swore a feud even though it wasn't my thumb.
  - Two kills made Ithil "Dreaded" (+5% win chance).
- **Items on Boss day.** Spending four in Round 1 to win the Bronze Boss, or saving the Haymaker for Round 3.

### Decisions that felt fake or obvious

- **All In** (see above): always 0–3% or obviously worse.
- **The Fortune draft once a fighter card was showing.** A free fighter level with my second-best, with a full Trainer cap ahead, is never the wrong pick.
- **Perks:** Mighty or Juggernaut whenever offered, otherwise Survivor or Iron Will before a Boss.
- **Lower-arena Champions:** "−3 Favour, −10 Morale" makes them dead weight, except to meet an Emperor's demand.

### Would I start another career straight away? Why?

- **Yes, but for a slightly wrong reason.** The first four months are the best this game has been: fast, tense, with upsets I earned through reads.
- But this run was won by the draft. I'd start another to see whether a Natural-34 card shows up again, which means the draft, not my house, decides the career.
- And +108 XP with no level, unlock or "next" shown in the text port gave me nothing to aim for.
- With bug 1 fixed (no free rematch), Fortune fighters pegged to total Power, and the Legacy level and next unlock shown at the end, this would be a genuine "one more career".

## 6. Top 10 suggestions (most important first)

1. **Fix the rival rematch Power** (`src/run.js:3306`) to include `SHORT.oppPower` and `SHORT.grandPower`. Also fix the summons opponent (`src/run.js:451`) and the Championship reach (`src/run.js:680`). As it stands, losing a Boss makes the rematch bracket about 11 Power weaker: 35 became 24, and the Semi-final opponent 21.
2. **Peg drafted fighters to total Power, not Natural.**
   - Liora (Natural 34) and Marcia (Natural 41) both had a full 21-point cap ahead, against house fighters of Natural 5–12. They became my best fighters within weeks.
   - Give them the headroom your second-best has left. Also show "Natural X, Y training points left" on the card.
3. **Ease the Silver-tier famine.** Training cost 4–5 Gold per fighter-week, against purses of 6 (a loss) to 22 (a T1 win), and I spent about six weeks at 1–2 Gold with nobody training. Options:
   - Pay the bracket's Quarter- and Semi-final wins sooner (they pay 9–12, which is good: make that clear).
   - Hold the fee at 3 until the Imperial tier.
   - Add a small stipend for a top-arena loss.
4. **Strip a countered Feint of its +10%** (`src/fight.js:595`). A correct Press against a faster Feinter should win the round more often than not. Today it nets about −7.
5. **Make the Death Gate suggestion read the tell** (`src/fight.js:127`), and make All In a real gamble. For example, fix its win bonus at +10%, or make its death chance a flat "lose the round and 50% they fall", so it's never 0% when you're far ahead.
6. **Compute Underdog from Power before flat bonuses** (`src/fight.js:236`), so the crowd, the Whetstone and War Paint never cost an Underdog fighter Power.
7. **Show Legacy progress in the text port's end screen**, and during the run: level, XP to the next level, what unlocked, what's next, and that retiring a fighter feeds the Hall. Right now "+108" is a number with no destination.
8. **Signal the Speed lever.**
   - At Silver and above, one Speed week (+6) was worth two or three Power weeks: Ithil went from rounds of 45–48% to 78–88% at the same Delta.
   - A one-line hint on the training job ("Speed 3 against this arena's 7–13: you'll rarely strike first") would turn it into a visible decision rather than a discovery.
9. **Soften the Round 3 pile-up.** The opponent's signature, Closer and humour penalties all land in Round 3, which turned Delta-0 rounds into 20%. Either stagger the signatures ("when behind" only), or give the player a Round 3 tool besides their own one-use signature.
10. **Text-port polish:**
    - The RIVAL label for a Boss who never fought you (`scripts/play-text.js:188`).
    - The post-career screen should drop the tribute, the next tournament and the arena odds.
    - The quest line "fought here long enough" (`src/quests.js:76`).
    - Show the Emperor's demand reward and penalty up front, and list them in `quests`.
    - "Trainer points" should say weeks and Power.
    - The Emperor's intro reprints on week 2.
