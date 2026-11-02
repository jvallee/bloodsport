# Playtest LLM-10 — seeds 10010 and 10011 (version 5.4.0 in progress)

## 1. Summary

- **Seed 10010 (full career): about 330 commands, about 68 weeks** (Martius wk 1, Y1 to Sextilis wk 1, Y2). The career had not ended. I stopped at the command budget after a third loss at the Silver Coliseum Boss. About 40 of the commands were `look`, `market`, `estate`, `store` or `houses`.
- **Seed 10011 (short career, `--short`): about 140 commands, about 56 weeks** (Martius Y1 to Aprilis wk 4, Y2). Still alive, at Favour 15 (DANGER), after two losses at the Bronze Boss.
- **Result, seed 10010:**
  - Dirt Pits Boss (Thessaly, Power 7) beaten on the first try, Maius Y1 wk 4. House level 2.
  - **Bronze took 3 months:** Tournament 1 (Iunius), Tournament 2 (Quintilis), Boss (Sextilis). I won the Bronze Boss on the first try: Scaeva at Power 12 against Vesper at 13 won 2–1. To do it I spent War Paint, Iron Tonic, a Throwing Net and Cast the Net.
  - Silver Coliseum from September Y1. I won no Silver tournament in 12 months:
    - Tournament 1 (Sept Y1): lost the Semi-final (13 vs 16).
    - Tournament 2 (Oct Y1): lost the Semi-final 1–2 (16 vs 18).
    - Boss (Nov Y1): Zarek lost the Quarter-final. I capitulated at 2 injuries.
    - Tournament 1 (Dec Y1, Saturnalia): won the Quarter-final (a Bloodied Victory), then withdrew.
    - Tournament 2 (Martius Y2): lost the Quarter-final.
    - Boss (Aprilis Y2): lost the Quarter-final.
    - Tournament 1 (Maius Y2): reached the Final, lost 1–2 to Marcia (17 vs 18).
    - Tournament 2 (Iunius Y2): lost the Quarter-final.
    - Boss (Quintilis Y2): reached the Final against the rival Grosh (20, plus 1 for Scouting) and capitulated in Round 2 at "about 57% chance of death".
  - House levels: 2 at week 12, 3 at September wk 4 Y1. **Prestige then fell from 31 to 5**, so House level 4 (60 Prestige) never came into sight. At stop: Gold 50, Prestige 5, Favour 39. I was #2 of 4 houses (Glory 52), behind House Varro (73), who were already in the Imperial Coliseum.
- **Roster at stop (seed 10010):**
  - Scaeva: Orc Retiarius, Lv5, Power 17 (6 natural, +8 training, +2 Titles, Gladius). Afeared vs melee.
  - Pertinax: Basa Sagittarius, Lv5, Power 18 (5 natural, +8 training, Juggernaut, 2 Titles, Gladius, Lion Cage).
  - Zarek: Orc Ash-Hungry (a Liaison convict), Lv3, Power 17.
  - Krell: Orc Blood-Bearer, Lv3, Power 16.
  - Unit Rho, the political prisoner: I freed him in Martius Y2.
- **Deaths:** none of mine. I made two kills at the thumbs: Gratia, in the Dirt Pits Boss as a lower arena, and Murr, for the Emperor's "kill" demand.
- **Seed 10011 (short):**
  - The Dirt Pits took 8 months. I lost T1, then the Boss, then T1 again, then the Boss again, at "Even fight" to "Strong favourite". Gold sat at 0–2 from Aprilis to Quintilis Y1. I won the Boss at the third try in October Y1.
  - That win brought House level 3, so the Trainer Room went to level 3 *while Bronze was my top arena*. This is the case the fee change is for: Juno went from 11 to 15 Power in four weeks at 2 Gold a week.
  - Bronze regulars fell easily (15–16 vs 12, twice). The Boss was lost twice to Glabra: 14 vs 14 in December Y1, then 14 vs 16 (the rival at 13 + 1, with a Gladius) in Aprilis Y2. Both losses were 0–2 or 1–2 in close rounds.
- **Shape of the run (10010):** a brisk Dirt Pits, a brisk Bronze (the wall really is lower), then a new wall at Silver. There the Trainer cap (8 points, Trainer Room level 3) stops every fighter at 16–18 Power, and Silver Finals sit at 18–21. The Prestige that would unlock Trainer level 4 drains away through buy-ins.

## 2. Where I was confused

- **The cheap training did nothing for me in the main career, and I couldn't tell.** The Ludus header said "training costs 2 Gold a week" in Bronze, which was simply Trainer level 2's normal fee. The "(2 until you reach the Silver Coliseum)" note appears only on a Trainer Room of level 3 or more (`src/data.js:345`). I couldn't build one in Bronze, because level 3 needs House level 3 (30 Prestige), and I reached that a week after leaving Bronze. When I reached Silver, the header still said 2 until I upgraded, then 3.
- **Odds labels felt unreliable** without an Oracle (I never had a free plot for one):
  - Scaeva 17 vs 17 was "Long shot" (Silver Boss Quarter-final, Aprilis Y2), but Zarek 16 vs 16 on the same card was "Underdog".
  - Pertinax 18 vs 17 was "Strong favourite" (Silver T2, Iunius Y2), and he lost 1–2 at 17 vs 17 once his Afeared scar applied.
  - In the short career Juno at 9 vs 7 was "Strong favourite" and lost. Castor at 8 vs 7 was "Even fight".
  - The match Advice line said "An even fight that went the other way" at Delta −3 (Scaeva 13 vs Sorg 16).
- **The Emperor's demand doesn't show when it's met.** In December Y1, Scaeva won a Silver Quarter-final with Concussed and Poisoned (3 injuries). I assumed "Win a Bloodied Victory" was done. The status line still said "⚜ THE EMPEROR DEMANDS: Win a Bloodied Victory", with no tick. At the week's end: "Imperial Favour −4 (the Emperor's demand, unmet)" (bug 1).
- **"Grosh will remember this"** after the November Y1 Silver Boss, though Zarek lost to Ixa in the Quarter-final and never met Grosh. Grosh then came back as "RIVAL (beat you before, now stronger)" at 20 (bug 3).
- **Withdrawing made a nemesis:** "Tigris will be remembered in your house as Tigris Sandreaper" after I withdrew Scaeva *before* the Semi-final against Tigris (bug 2).
- **The spare reason contradicts the demand.** In Aprilis Y2 the Emperor demanded "Spare a beaten opponent". Krell beat Drogga in the Dirt Pits Boss, and the prompt said "`spare`: no Favour: the Emperor wanted blood too". Sparing then met the demand (+3 Favour, +9 Gold). The prompt meant the crowd, and the lower arena, not the Emperor (bug 4).
- **The rebel recruitment card:** "choose 2: Sound Pertinax out (54% they say yes) → A chance: the other: joins the cause". "the other" is the event's internal role name leaking through (bug 5).
- **Training still stops silently for the rest of the month.** "Switched to Rest: another week of training would overtrain them" sets the job to Rest, and `to-tournament` keeps them resting. I lost 1–2 training weeks per fighter per month this way in Bronze. The log line is there now, which helps, but the job doesn't come back on.
- **Scouting in Silver brackets.** "Scouted: opponent +1 Power" applies to every match of a three-match bracket when the fighter fought the top arena last month. With one fighter good enough for Silver, they are almost always scouted. Every Silver Final I reached was against 19–21.
- **Text port, `--last`:** for the first month, the Emperor's opening monologue reprints at the top of every status block (`look`, `to-tournament`). In a full replay it appears once, so this is an artefact of `--last`.

## 3. Bugs or things that looked wrong

1. **Bracket wins never count as Bloodied Victories.**
   - `finishBracketMatch` (`src/run.js:2153–2161`) builds its summary without a `bloodied` field. `DEMAND_MET.bloodied` checks `x.bloodied` (`src/run.js:353`), so a Quarter-final or Semi-final won with 2+ injuries never meets the demand.
   - Seen in December Y1: Scaeva won the Silver Quarter-final 2–0 with Concussed + Poisoned. The demand was judged unmet (−4 Favour).
   - The same gap means bracket wins also miss the Bloodied Victory Favour, Renown and Morale, and the Battle-Hardened scar (`src/run.js:1970–2102` only runs for the single-match path).
   - From Silver on, every top-arena tournament is a bracket, so "Win a Bloodied Victory" can be met only in a Final or a lower arena.
2. **Withdrawing creates a nemesis from someone you never fought.**
   - `withdraw` (`src/run.js:2313–2319`) calls `finishMatch` as a towel loss against the bracket's *next* opponent. `finishMatch` then calls `recordNemesis(run, opp, …)` (`src/run.js:2145`).
   - "Tigris will be remembered … as Tigris Sandreaper" after withdrawing before the Semi-final.
   - A withdrawal shouldn't mark anyone. At most it should mark the last opponent actually fought (who lost).
3. **A Boss bracket lost early still blames the Boss.**
   - `advanceArena` sets `arena.rival` from `arena.opponent` (the Final's Boss) and logs "${opp.name} will remember this" (`src/run.js:2347–2351`), whoever actually beat you.
   - Grosh "remembered" a Quarter-final loss to Ixa. Returning the Boss at base + 1 is fine as a mechanic, but the message is false. Something like "The Boss will be waiting, stronger" would be honest.
4. **`spareFavorWhy` gives the wrong reason** (`src/run.js:2211–2216`).
   - It checks `crowd === 'kill'` first, so a lower-arena spare under a blood call reads "the Emperor wanted blood too", even when this month's demand is *"Spare a beaten opponent"*. (LLM-9 suggestion 7, still open.)
   - The order should be: the lower arena first. Then a running spare demand ("the Emperor asked for mercy: this meets his demand"). Then the crowd ("the crowd wanted blood").
5. **Event effect text leaks a role name:** "A chance: the other: joins the cause" (the rebel champion card, Aprilis Y2). The `WHO` map (`src/events.js:180`) renders `g` as "the other", which makes no sense when the option names the fighter. It should say "Pertinax joins the cause".
6. **The bet's returned stake is still counted in the purse.** "You bet 4 Gold on Pertinax at ×1.46: a win returns 5 Gold (+1)" is clear now, and stakes that would win nothing are refused. That part of LLM-9 bug 2 is fixed. But the Result line said "+13 Gold" (an 8-Gold purse + 5 returned). It should say "+8 Gold, bet +1".
7. **Demands can repeat for months.** Seed 10010's Emperor RNG gave "Win a Bloodied Victory" in Quintilis, Sextilis, September and December Y1 (four of the first four demands). That is the dice, not a bug (I checked the stream `deriveSeed(seed, 9)`). But it felt like a stuck demand, especially with bug 1 making it unmeetable in a bracket.
8. **Odds labels vs Power** (see section 2). This may be intended (Speed, humours and traits), but without the Oracle the labels misled me more often than they helped. In the Silver Boss Quarter-final, Aprilis Y2, a 17 vs 17 match was "Long shot" next to a 16 vs 16 "Underdog".
9. **Small things:**
   - War Paint used before Round 1 doesn't show in that round's Power line, because the line printed before the `use`. Only the Result log says "Pertinax uses War Paint". Echoing the new Power after `use` would help.
   - The log lists "Scaeva uses Iron Tonic" but not the War Paint or Berserker Mushroom used in the same fight (Maius Y2 Final).
   - A demand was issued in the winter week before Martius in the short career ("The Emperor demands: Win in two different arenas", logged with the year-end lines). Harmless, since it is judged on the Martius fight day.

### Fixed since LLM-9 (confirmed)

- **Demands are judged at the end of fight day.** I met 4 (+9 Gold each at tier 3, +6 at tier 2) and missed 6. No demand failed on the turn it was issued.
- Short careers start at House level 2 ("Prestige 17 (House level 2…)", 5 plots).
- The spare prompt says "their house already owes you a life (3 months left): no new debt", and the opponent line shows "OWES YOU A LIFE … 2 months left".
- Lower arenas moving on are logged: "The Dirt Pits held its Tournament 1 without your house. Next month: Tournament 2, against Fulvia."
- Flesh Wounds heal on Rest ("1w to heal in the Medbay, twice that on Rest"; "Krell's Flesh Wound has healed with rest").
- Training that stops is logged ("switched to Rest: not enough Gold for the trainer's fee (2)").

## 4. Focus sections

### 4.1 Fun and pacing

**What kept me going**
- **The Bronze Boss at the first try.** Scaeva at 12 vs 13, Vesper with Twin Fangs. I spent three items and Cast the Net to win 2–1. It was a real decision and a real fight, and it was over in 3 months instead of 7.
- **The confession again.** Unit Rho: "You have spared lives on the sand even when the crowd bayed for blood, and the risk of it was yours. People noticed. You have finished beaten fighters." The plot then moved steadily: chalk on the door, a cousin at the gate, a wounded man, "Free me", the sealed pass, steel for the cause, and "Grosh … is one of us … let them live". Then I met Grosh in the Silver Boss Final. That was the best moment of the run.
- **Nemeses** pay well and feel personal. "Krell beats Ilithya the Grinning! +5 Gold … The house breathes again" ended the short career's Gold famine.
- **Lower-arena Titles** for the back of the roster (Pertinax, Unit Rho, Krell) gave the off-weeks something to aim at.

**What dragged**
- **Silver.** Twelve months and no tournament won. Every fighter hit the Trainer cap of 8 by Martius Y2, and nothing in the game could raise them further. Prestige slid from 31 to 5, so Trainer level 4 got further away with every loss. It felt like the LLM-9 Bronze wall, moved up a rung.
- **Events.** About 20 in 68 weeks, often one a week in a row (Maius–Iunius Y2: brawl, steel, fever, back to back). Each stops `to-tournament`.
- **The short career's Dirt Pits.** It took 8 months, with four losses at even or better odds. Some of that was the dice. The rival Boss's Underdog trait (+2 when 2+ Power behind) also cancelled the training lead I had built.

**Best moment:** "Grosh, who fights for House Varro, is one of us. If you meet in the arena, … let them live", then Grosh across the sand in the Silver Final.
**Worst moment:** "Imperial Favour −4 (the Emperor's demand, unmet)" the week after Scaeva won a three-injury Quarter-final for exactly that demand (bug 1).

### 4.2 Balance and economy

**Gold track (seed 10010)**

| When | Gold | What happened |
|---|---|---|
| Martius Y1 | 12 → 4 → 10 | 2 recruits; T1 win +6 |
| Aprilis Y1 | 9 → 20 → 7 | T2 +8 and a bet (+1); Quarters Lv2 (6), Krell (3) |
| Maius Y1 | 5 → 30 → 6 | Dirt Pits Boss +25; Trainer Lv2 (10), 2nd Trainer (8), Liaison (6) |
| **Iunius Y1 (Bronze)** | 2 → 0 → 23 | Zarek (2); no Gold for training for 2 weeks; senator's purse +10; Bronze T1 +11 |
| **Quintilis Y1 (Bronze)** | 19 → 19 | Training at 2/week; Bronze T2 lost (+4), Dirt Pits T2 +5 |
| **Sextilis Y1 (Bronze)** | 19 → 6 → 30 | Demand +9; items (11) for the Boss; Bronze Boss +19, Dirt Pits Boss +5 |
| September Y1 | 25 → 58 → 12 | Decor (5); Silver QF +9, Bronze +8, nemesis +9; Trainer Lv3 (16), Armourer (10), Entertainment (8), Quarters (10), Rho (2) |
| October Y1 | 6 → 0 → 23 | Training at 3/week drains it; Silver QF +9 |
| November Y1 | 17 → 3 → 17 | Gauntlet (5); Silver Boss loss +6 |
| December Y1 | 17 → 2 → 21 | Tribute 15; Saturnalia QF +9, withdraw +6 |
| Winter Y1 | 22 → 3 | Two Trainer Rooms at 3/week |
| Martius–Aprilis Y2 | 3 → 29 → 12 | Medbay Lv2 (8), healer (5), demand +9; Vulcan (10), Gladius (7) |
| Maius–Quintilis Y2 | 10 → 50 | Final reached (+33 over the bracket); demand +9; items |

**Prestige track (seed 10010):** 5 → 15 (Dirt Pits Boss) → 27 (Bronze Boss) → 31 (Sept Y1, House level 3) → 28 → 19 (two Boss losses) → 20 → 11 → 12 → 9 → **5**.
- Silver buy-ins are 3 / 3 / 6 a month. A bracket win pays +1 per round, and only a tournament win pays +6 to +15.
- Capitulating or losing a Boss costs the full buy-in.
- So a house that doesn't *win* Silver tournaments loses about 5–8 Prestige a month. In 11 months it never gets near 60.

**Bronze:**
- Gold was 0–30 through Bronze. I could train in about 9 of 12 weeks. The weeks I missed were for Gold (2 weeks in Iunius), overtraining (about 4) and the cap (Scaeva and Pertinax hit 5/5 in Quintilis).
- The binding limit in Bronze was the **Trainer cap of 5**, not Gold. Scaeva went into the Boss at 12 (6 + 5 + Title), one below Vesper.
- This matches the designer's probe note that the bots stall "for want of Power, not Gold".

**Silver:**
- Regulars in the brackets were 14–18, the Finals 18–21, and the Boss Final 19 → 20 (rival) + 1 (Scouted).
- With Trainer level 3 (cap 8), my best possible was 17–18: natural 5–6, +8, +2 Titles, +1 Gladius, +1 Lion Cage for a Basa.
- The jump from Bronze (11 / 12 / 13) to Silver (18 / 18 / 19, `src/data.js:319–320`) is +6 to +7 per stage. Dirt Pits to Bronze is +5. Every Silver match I won was against a Quarter-final or Semi-final opponent at 14–17.
- Gold was not the issue at Silver (I ended on 50). There was nothing to spend it on that adds Power: the Armourer had 1 Gladius in 4 months, and I had no free plot for an Oracle.

**Comparison with LLM-9:** that run sat in Bronze for 7 months, piling up Prestige, and reached House level 4 (Trainer cap 13) by Maius Y2. Silver then fell in 3 months. This run left Bronze after 3 months with 27 Prestige and never got the Trainer level 4 cap. **Some of the old Bronze wall was the Prestige grind that made Silver easy.** Lowering it moved the grind to Silver, where buy-ins are higher and losses cost Prestige faster.

**Short career (10011):**
- Gold 32 at the start → 0–2 from Aprilis to Quintilis Y1 (four losses at 2 Gold each) → 47 at the Dirt Pits Boss win → 31 after Trainer Lv3 (16) → 54 at stop.
- In Bronze, cheap training at Trainer level 3 was affordable every week (2 Gold × 2 fighters).

### 4.3 The features under test

**The Bronze wall (verdict: lowered, and it feels right; but the wall moved to Silver, and the fee change rarely applies).**
- **Months in Bronze:** 3 in the full career, won at the first Boss try (Iunius–Sextilis Y1). The short career has had 4 tournament months (November Y1–Aprilis Y2) with two Boss losses, and is not yet through.
- **Did the Boss feel beatable but still a real fight?** Yes.
  - 10010: 12 vs 13 with three items and a signature, won 2–1, and the second round was lost to Twin Fangs.
  - 10011: 14 vs 14 (with an owed life), lost 0–2. Then 14 vs 16 (the rival's +1 and a Gladius), lost 1–2 after winning Round 1.
  - Power 13 sits right at a capped Trainer level 2 fighter (6 + 5 + 1 Title = 12) plus an item or two. That is a good place for it.
- **Could I train every week?** Mostly. The limits were the cap and overtraining, not Gold. The famine weeks in Bronze were 2 (Iunius), against months of 0–3 Gold in LLM-9.
- **Did cheap training do anything?**
  - *Full career:* no. Trainer level 2 already costs 2. The cap (2 Gold) only bites with a Trainer Room of level 3+, which needs House level 3 (30 Prestige). I reached that only after Bronze.
  - *Short career:* yes. The Dirt Pits Boss pays +13 Prestige ×2.5, so House level 3 came with Bronze. Trainer level 3 (cap 8) at 2 Gold a week took Juno from 11 to 15 in four weeks. After that the Bronze regulars (11–12) were "Strong favourite" walkovers, twice.
  - So cheap training plus an early Trainer level 3 makes Bronze *Tournaments* trivial. The Boss still held, because the rival returns at +1 with gear.
  - It helps exactly the players who stall in Bronze long enough to reach 30 Prestige, which seems to be its purpose.
- **Is the fee change explained where you'd look?**
  - In the Estate, yes, but only on a Trainer Room of level 3+: "Training costs 3 Gold per fighter-week (2 until you reach the Silver Coliseum)".
  - The Ludus header just says "training costs 2 Gold a week" without saying why, or that it will rise. Nothing warns that the fee jumps on the day the Bronze Boss falls. My Gold went from 58 to 0 within a month of reaching Silver.
- **Does Silver now feel like a new wall?** Yes, and a harder one, because it feeds on itself. The Trainer cap 8 → 13 needs House level 4 (60 Prestige), and losing Silver brackets drains Prestige. See section 4.2.

**The Emperor's demands (verdict: now playable and fun, with one real bug).**
- Demands are judged at the end of fight day. Results: met 4 (Bloodied in Sextilis Y1 via a Dirt Pits Boss, Spare, Kill, Two arenas) for +3 Favour and +9 Gold each at Silver. Missed 6 (−4 each).
- The Emperor's line is shown in the GUI scene. The text port only logs the goal, plus the "⚜ THE EMPEROR DEMANDS" status line.
- Two problems: bracket wins can't meet "Bloodied" (bug 1), and the status line never says a demand is met.

**Betting ×odds (verdict: fixed and honest).** "At ×1.29 a 2 Gold bet would win nothing: the bookmakers won't take it" is a good refusal. "A win returns 12 Gold (+7)" at ×2.50 tempted me. Profits on favourites are still +1 per bet, so I bet four times in all, and the Result line still mixes the stake into the purse (bug 6).

**The Temple of Vulcan / Revenants (verdict: untested).** I built it in Aprilis Y2 (10 Gold; "raise 18 Gold; bodies keep 4 weeks" now shown in the Market). Nobody of mine died, as I capitulated at every Death Gate.

**Lower arenas moving on (verdict: fixed).** Every unattended tournament is logged with the next opponent. This was useful: I timed Krell's and Unit Rho's lower-arena Boss runs from those lines.

**The rebel's confession (verdict: excellent, and the follow-up events are the best thread in the game).** The variant matched my record (spares against blood, plus kills). The "one of ours across the sand" event, which ties the plot to an arena opponent, is a great idea, and I'd like more of it.

**Nemeses (verdict: still the best small feature).** Nyx Bonebreaker, Euryale Gravedigger, Sabina the Mocking, Marcia the Butcher. Beating one pays +5 Gold per tier and +3 Favour. A nemesis made by a withdrawal is the one flaw (bug 2).

**Bonds:** "Scaeva and Pertinax have become fast friends" (September Y1), and Juno and Castor in the short career. Quietly good.

## 5. Top 10 suggested changes (most valuable first)

1. **Keep Silver from becoming the new Bronze wall.** The cap (Trainer level 4, House level 4 at 60 Prestige) is out of reach while Silver losses drain Prestige. Options:
   - Allow Trainer level 4 at House level 3 once the Silver Coliseum is your top arena.
   - Or don't charge the buy-in on a bracket you lose after winning a match.
   - Or ease the regular Finals from 18 / 18 / 19 to 17 / 17 / 19, keeping the Boss.
   - Probe it the way the 5.4.0 table did, with "weeks at Silver".
2. **Count Bloodied Victories in brackets** (`src/run.js:2153`): add `bloodied: effectiveInjuries(fighter) >= 2` to the bracket summary, and apply the Favour, Renown, Morale and Battle-Hardened effects there too.
3. **Don't make a nemesis or rival from someone you never fought.** On `withdraw` (`src/run.js:2313`), skip `recordNemesis`. For an early Boss-bracket loss (`src/run.js:2351`), log that the Boss will be waiting, not that they remember you.
4. **Mark a demand as met in the status line** as soon as it is ("⚜ The Emperor's demand: Win a Bloodied Victory ✓ met"). Don't issue the same demand twice running.
5. **Fix the spare reason order** (`src/run.js:2213`): lower arena first, then a running spare demand ("this meets the Emperor's demand"), then "the crowd wanted blood".
6. **Explain the training fee in the Ludus header and on Trainer level 2:** "2 Gold a week (the Bronze rate: 3 from the Silver Coliseum)". Warn on the Bronze Boss card that the fee rises when you win.
7. **Resume training automatically** after an overtraining or no-Gold rest week, when the fighter's chosen job was Train. Or give `job` a "train when able" setting.
8. **Fix the event role text** ("A chance: the other: joins the cause", `src/events.js:180`) to name the fighter.
9. **Make the odds labels match the numbers better.** Or give one free odds hint per fight day (the Oracle competes for scarce plots with the Armourer and the Medbay). Make the Advice line's "an even fight" agree with the Delta.
10. **Itemise the bet in the Result line** ("+8 Gold, bet +1") and echo the new Power after `use <item>`.
