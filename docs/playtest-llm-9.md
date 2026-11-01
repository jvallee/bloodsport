# Playtest LLM-9 — seeds 9009 and 9010 (version 5.3.0 in progress)

## 1. Summary

- **Seed 9009 (full career): 343 commands, about 69 weeks** (Martius wk 1, Y1 to Sextilis wk 1, Y2). The career had not ended; I stopped at the command budget, just after the Silver Coliseum Boss win opened the Imperial Coliseum. About 45 commands were `look`, `market`, `estate`, `houses` or `story`.
- **Seed 9010 (short career, `--short`): 102 commands, about 24 weeks** (Martius to Sextilis Y1). Still alive, stuck at the Bronze Boss.
- **Result, seed 9009:**
  - Dirt Pits Boss (Egnatia, Power 7) beaten on the first try, Maius Y1 wk 4. House level 2.
  - Bronze Boss (Marcia) took three tries:
    - Sextilis Y1: Hruk lost 1–2 at 14 vs 17 ("Long shot").
    - November Y1 (The Emperor's Gaze, no capitulating): I sent Grosh at 13 vs 17 to get a death on purpose. He died in Round 2 at "about 66% chance of death".
    - Aprilis Y2 (First Blood Counts Double): Hruk won 2–0 at 19 vs 17.
  - Silver: won Tournament 1 (Maius Y2, 6–1 in rounds) and Tournament 2 (Iunius Y2, 6–0), then the Boss bracket in Quintilis Y2. Hruk went into the Final at the Death Gate (Senseless ×2 + Blinded = 3/3). I paid the Emergency Surgeon 16 Gold to clear the Blindness, and he won 2–0.
  - House levels: 2 at week 12, 3 at about week 28 (Sept Y1), 4 at about week 60 (Maius Y2). At stop: Prestige 95, Gold 64, Favour 75. #1 of 4 houses, Glory 76 against House Severa's 7.
- **Roster at stop (seed 9009):**
  - Hruk: Orc Retiarius, Lv6 (max), Power 24, Speed 6, 3 Titles, Renown 57.
  - Corvax: **Basa** Sagittarius, Lv4, Power 22 (5 natural, +13 training, +2 Titles, Gladius, Lion Cage).
  - Dacia: Orc Blood-Bearer, Lv3, Power 13.
  - Grosh: **Revenant** Ash-Hungry (Grave Chill), Lv4, Power 12.
  - Hadria: Human Cestus, Lv3, Power 10, the first political prisoner.
  - Tigris (the second political prisoner) asked to be freed in Sextilis Y2. I freed him.
- **Deaths:** one of mine (Grosh, deliberate, then raised). One opponent was killed mid-match (Nonia, in the Silver Boss Quarter-final).
- **Kills at the thumbs:** 2 (Egnatia, Murr). I spared about 12, most of them against a crowd calling for blood.
- **Seed 9010 (short):** House level 3 by week 8 (Dirt Pits T1 +5 Prestige, Boss +13). Then two Bronze losses at "about 78%" and "about 82% each round", and two Bronze Boss losses to Elowen (16–17 vs my 11–12). At stop: Favour 33, Gold 18, Prestige 34.
- **Shape of the run (9009):**
  - A brisk Dirt Pits.
  - Seven months of Bronze with Gold at 0–6 (Gold was 0–2 for most weeks from September to December Y1).
  - A Revenant detour in November.
  - Then a snowball once the 27-Gold nemesis win came in Martius Y2. The Silver Coliseum went down in three months, with Hruk 4–7 Power above every regular opponent.

## 2. Where I was confused

- **Martius Y1 wk 4, the first bet.** "You bet 3 Gold on Hruk at 1.2 to 1: a win pays 3 Gold." I read "1.2 to 1" as a profit of 1.2 per Gold staked. In fact a win just hands the stake back (see bug 2). The fight Result then said "+9 Gold" (6 purse + the 3 returned), which looked like profit.
- **The tutorial claims "the Power both sides will fight with"** on fight day. As in LLM-8, the text port shows only labels ("Favoured · Injury Low · Death None"). Labels are also hard to read across fighters:
  - Dacia at 8 vs 8 was "Underdog".
  - Corvax at 7 vs 7 was "Even fight".
  - Hesper at 8 vs 7 was "Underdog" (Rampage and Off-Hand on the other side).
- **Training silently stops.** "Grosh switched to Rest: another week of training would overtrain them (Stress 35)." With `to-tournament`, the fighter then rests for the rest of the month. I lost 2–3 training weeks this way before I noticed (Grosh in September Y1, Hesper in Iunius Y1 of 9010). Training also stops when Gold is short ("Needs 3 Gold; you have 2"), and nothing warns you on `end-week`.
- **The Boss promises a Title it doesn't give.** Aprilis Y2: the Bronze Boss card said "Win: a Title (+1 Power)". Hruk had already earned "Champion of the Bronze Arena" through three regular Bronze wins in December Y1, so the Boss win gave him nothing.
- **"no Favour: the Emperor wanted blood too"** appears on every spare in a lower arena too, where sparing never earns Favour anyway. It is the first reason `spareFavorWhy` checks. The Emperor never said anything; it was the crowd.
- **Building the Armourer:** "Built: Armourer. Gold 9", then the Market said "Sold out until next month". I had built it to equip Hruk for the Bronze Boss three weeks later. Nothing on the build card says stock comes only at the start of the month.
- **Short career, week 1:** "Prestige 17 (House level 1, level 2 at 12)". The Estate showed 3/3 plots, and Liaison and Vulcan were locked. Level 2 only arrived with the first win (bug 3).
- **Perks repeat and stack.** Hesper was offered Swift at Lv2 and again at Lv3 (Speed 3 → 9). Hadria got "Perks: Mighty, Mighty". Probably intended, but the card doesn't say a perk can be taken twice.
- **The Revenant still shows under "Fallen: Grosh"** on every `look`, below the living Grosh [f65].

## 3. Bugs or things that looked wrong

1. **Every Emperor's demand fails the moment it is issued.**
   - `advanceWeek` moves to the new week and calls `issueDemand` at the month start (`src/run.js:1181–1186`). Only after that does it run `judgeDemand` for the tournament week that just ended (`src/run.js:1201`).
   - So a demand issued at the start of a month is judged against no fights, marked unmet (−2 Favour) and cleared, all in one tick. The player never gets a month to meet it, and never sees the Emperor's line (`DEMANDS[*].say`).
   - Seen 4 times. 9009: "Spare a beaten opponent" (Sextilis→September Y1), "Win a match in your top arena" (Martius→Aprilis Y2), plus one silent −2 in Quintilis Y2. 9010: "Win a match in your top arena" (Maius Y1). Each time the log shows "The Emperor demands: …" followed at once by "Imperial Favour -2 (the Emperor's demand, unmet)".
   - Fix: judge before the week advances, or skip `issueDemand` in a week where `tournamentEnds` is true and the old demand hasn't been judged yet. The bot gates probably miss this because bots never look at demands.
2. **Bets on a favourite can't win anything.**
   - `placeBet` takes the stake, then pays `Math.floor(stake × odds)` on a win (`src/run.js:1829–1831`, settled at `:1852`). With `BET.cut = 0.9`, any win chance above 90% loses money. Flooring means small stakes on 1.1–1.4 odds return exactly the stake.
   - Every bet I made: 3 Gold at "1.2 to 1" paid 3, 2 at 1.2 paid 2, 2 at 1.2 paid 2, 5 at "1.1 to 1" paid 5. Net profit 0 on four winning bets.
   - "1.2 to 1" (`src/run.js:1832`) is fractional-odds wording for decimal odds.
   - The Result line adds the returned stake to "+N Gold", so a winning bet looks like profit.
   - Fix: pay the stake back plus `floor(stake × (odds − 1))`, at least 1, and print "a win returns X (Y profit)". Or round instead of flooring.
3. **Short careers start at House level 1 with level-2 Prestige.** `createRun` sets `prestigeLevel: 1` (`src/run.js:857`), though Prestige starts at 5 + `SHORT.startPrestige` 12 = 17. The level is only recomputed on the next Prestige gain (`src/run.js:2114`). The `SHORT` comment in `data.js:539` says the head start means "House level 2". Effect: no Liaison, Vulcan, Armourer or extra plots until the first win.
4. **The spare prompt promises a debt that isn't renewed.**
   - The verdict text always says "their house will owe you a life (−1 Power against you for 3 months)" (`scripts/play-text.js:244`, `src/ui/fightView.js:139`, `src/ui/views.js:776`).
   - But a debt that is still running isn't renewed (`src/run.js:2232`). The result then prints a bare "Thumbs up." (Glabra and Hilarus, Silver Y2, both House Severa while Severa already owed).
   - The prompt should say "(already owes you, N months left)".
5. **Feud and debt months are missing from the opponent line in the text port.** `scripts/play-text.js:179` prints "(OWES YOU A LIFE: −1 Power against you)" / "(FEUD: +1 Power against you)" with no months. `houses` does show "feud 3 months".
6. **The lower-arena advance is silent.** `arenaMovesOn` (`src/run.js:2332`) writes nothing to the log.
   - The Dirt Pits did move: Tullia (T1, September) → Lirien (T2, October) → Duma (Boss, November Y1), and the Bronze Arena likewise in Y2.
   - But you only notice it by comparing names month to month. A log line would help: "The Dirt Pits went ahead without you: Tullia beat X; next month, Tournament 2 vs Lirien".
7. **The Revenant's chronicle restarts.** "Maius, week 4 · Year 2: First win, in The Bronze Arena · Tournament 1" for Grosh, who already had "First win, in The Dirt Pits · Boss Tournament". The first-win check uses `h.fighterId === fighter.id` (`src/run.js:2069`), and a Revenant gets a new id. It should also check `revenantOf`.
8. **Grave Chill reads as the opponent's bonus in the math.** "Win-chance bonuses: … Progressive Overload +6% (Sol-9), Grave Chill -5% (Sol-9), Spiked Gauntlet +2% (Sol-9) …". Listed among Sol-9's own bonuses, it looks like Sol-9's trait. Better: "Grave Chill (Grosh): −5% to Sol-9".
9. **Perks are printed twice** on every fighter card in the text port ("…| Perks: Mighty" and then "Perks: Mighty"): `abilities()` at `scripts/play-text.js:136` and `extras()` at `:143`.
10. **Event results still read oddly:** "it went badly, Dacia is Flesh Wound." and "it went well, +5 Gold, Dacia +2 Renown." The lower-case "it" after a full stop is the LLM-8 bug 8 fix gone halfway, and "is Flesh Wound" is ungrammatical.
11. **Light wounds still never heal on Rest.** Vesper (9010) carried a Flesh Wound from Maius wk 4 to Sextilis wk 3, "1w to heal" all along, because the one Medbay bed was busy. Distracted now passes on its own (`src/run.js:1140`); a Flesh Wound should too, or at least heal slowly on Rest.
12. **Small things.**
    - "Unit Sigma · Elf", "Unit Omega · Basa": Android-style names on other kinds.
    - The scouting note says "your fighter fought here last month" for the Boss after a Tournament 2 in the same arena. That is correct, but Scouting a Boss you meet once a circuit feels odd.

## 4. Focus sections

### 4.1 Fun and pacing

**What kept me going**
- **The confession** (Maius Y2, the week Hadria arrived). "You have spared lives on the sand even when the crowd bayed for blood, and the risk of it was yours. People noticed. … You have finished beaten fighters 2 times. I won't pretend that makes this easier to say."
  - That is the best writing in the game so far. It made my mercy record feel seen.
  - The same night brought the chalk mark event, then pamphlets, a wounded man at the gate and "Free me" within three months. The plot finally moves at a readable pace.
- **The Revenant.** Losing Grosh at 66% and then reading "The priests of Vulcan work through the night. Grosh walks out of the forge: a Revenant, brass where the wounds were" was a strong beat. His chronicle line "Fell in The Bronze Arena … killed by Marcia" / "Raised from the dead … 0 weeks after falling. Grave Chill" is great.
- **The nemesis.** "Pavo the Grinning is back, in The Bronze Arena. They remember your house." Then Hruk beat him for +27 Gold, which ended my Gold famine in one fight.
- **The Silver Boss Final at the Death Gate**, with a 16-Gold surgeon call in between. A real decision.

**What dragged**
- **Bronze again.** It took 7 months: Iunius Y1 to Aprilis Y2, and two of my three Boss tries were long shots (14 vs 17, 13 vs 17). Gold was 0–3 for most of September to December Y1. Training cost 2 then 3 Gold a week, so "train" was often impossible.
- **Events:** about 16 in 69 weeks. Each one stops `to-tournament`. Three times in a row in October Y1 I pressed `to-tournament` and moved a single week.
- **Short career:** the Dirt Pits took 8 weeks (great), then the Bronze wall arrived just as in a full career. Opponents at 11 and a rival Boss growing 14 → 15 against my 11–13, with the Trainer cap of 5 and then 8, and no time to grind.

**Best moment:** the confession, followed by "Chalk on the door" the same week.
**Worst moment:** "The Emperor demands: Win a match in your top arena" and "Imperial Favour −2 (unmet)" on the same line of the log, before any fight (bug 1).

### 4.2 Balance and economy

**Gold track (seed 9009)**

| When | Gold | What happened |
|---|---|---|
| Martius–Aprilis Y1 | 12 → 0 | 2 recruits, Quarters Lv2 (6), training 1/week |
| Maius Y1 | 4 → 22 → 4 | Dirt Pits Boss +18; Trainer Lv2 (10), Liaison (6) |
| Iunius–Sextilis Y1 | 0–26 | Grosh (7), Armourer (10), Lion Cage (5) |
| September–November Y1 | 0–20 | Trainer Lv3 (16); training became 3/week |
| November Y1 wk 4 | 3 → 17 → 0 | Grosh died (+4 purse, +10 Blood Faith), Vulcan (10), Dirt Pits Boss (+7), raised Grosh (14) |
| December Y1 | 0 → 13 → 6 | Hruk Bronze T1; year purse +8; tribute 15 |
| Winter Y1 | 6 → 0 | Two weeks of training, then nothing for 6 weeks |
| Martius Y2 | 0 → 30 → 2 | Nemesis win +27; Exhibition (10), Lounge (12), host (6) |
| Maius–Iunius Y2 | 16 → 69 → 22 | Silver T1 +28 and Bronze +10; Trainer Lv4 (26), Entertainment (8), 2nd Trainer (8) |
| Quintilis Y2 | 46 → 64 | Silver Boss +34, surgeon (16), Quarters (6) |

- **Verdict:** still starved through Bronze, then plenty from Silver. Same shape as LLM-8, a little better because decor is pricier.
- **Silver was easy.** Hruk at 22–25 met regulars of 14–19. Corvax reached 22 at Lv4: Trainer Lv4 (13 points), +2 Titles from one lower-arena Boss win, Gladius, Lion Cage.
- **The lower-arena Boss cascade is very strong.**
  - Corvax beat the Bronze Boss as a lower arena (−2 Favour for the "crushing mismatch") and got "Champion of the Bronze Arena, Champion of the Dirt Pits": +2 Power for one fight.
  - Hadria and Dacia each picked up a Dirt Pits Title the same way, at +2 Prestige and +6 Gold.
- **Training cost.** At 3–4 Gold per fighter-week, two Trainer Rooms cost 8 Gold a week from Iunius Y2. That is fine at Silver but crippling at Bronze.
- **Rival houses are no competition.** Glory 76 vs 7. House Severa supplied nearly every Bronze and Silver opponent and "owed me a life" without a break from Martius Y2 on.

### 4.3 The features under test

**Basa in the Market and the Lion Cage (verdict: works, fair, and a good Market buy).**
- Basa appeared in 5 of 7 Markets (Corvax, Ruun, Sorg, Unit Omega, Thessaly) and often as opponents (Ennia, Juno, Cassia, Nyx, Urgulania).
- Base Power 5 confirmed ("Power 5 (Natural 5)"). The Lion Cage worked: "Power 11 (Natural 5, +5 Training, +1 Lion Cage)". Iron Rules switched it off in the Silver Boss as it should.
- Pounce (+3 Speed in Round 1) was visible every first round (Speed 6).
- At 5 Gold the cage is pricey, but on a Basa it is +1 Power and about +7 comfort. I'd buy it again.
- Corvax ended as my second-best fighter, so the 6→5 cut didn't make Basa weak.

**The Unnatural Temple of Vulcan and Revenants (verdict: fun and thematic; fair for the price; the Revenant itself is middling).**
- **Cost:** 10 Gold to build, 14 to raise at Bronze (18 at Silver). That was my whole purse at the time. Getting the Gold together inside the 4-week window was a real scramble: I had to send Dacia to the Dirt Pits Boss for +7. It worked, and that scramble was the fun of it.
- **What carried over:** level, XP, perks (Bloodthirsty, Survivor), Title, Ash-Hungry class and the signature (Feed the Ash). Power 12 → 11 (Natural 8 → 7). The kind trait changed from Blood Faith to Grave Chill. Morale "heading to 50: comfort +0, fame expects −0" in every room, as promised.
- **In the arena:** one Bronze T1 win (2–1 over Sol-9). The math showed "Grave Chill -5% (Sol-9)" every round. He also won two Exhibition bouts.
- **Balance:**
  - −1 Power is roughly cancelled by Grave Chill's −5%.
  - The fixed Morale 50 is worth more than it looks, once fame starts eating comfort: Hruk needed about 30 Gold of decor and an Entertainment Room to stay above 40.
  - So: not too strong. I'd keep the numbers.
- **Problems:**
  - "Fallen: Grosh" stays listed.
  - The chronicle restarts "First win" (bug 7).
  - The raise result line doesn't say which kind trait was replaced (Blood Faith simply vanished).
  - Nothing in the Market tells you the window ("bodies keep 4 weeks") before the Temple is built.

**Lower arenas move on without you (verdict: works; needs one log line).**
- The Dirt Pits, unattended from September to November Y1: T1 Tullia → T2 Lirien → Boss Duma → a new circuit with Hostus. The Bronze Arena did the same in Y2 (Sol-9 → Atticus → Brakk → Vaelin).
- No more frozen opponents (LLM-8 bug 10 fixed).
- It reads clearly in the "next month: Tournament 2" line, but the house log says nothing (bug 6).

**The rebel's confession (verdict: excellent).**
- Seed 9009 (Hadria, after 5 spares against the crowd, 1 with it, and 2 kills): "You have spared lives on the sand even when the crowd bayed for blood … You have finished beaten fighters 2 times."
- Seed 9010 (Thessaly, in week 9, with no record yet): "I don't know you yet. I'm telling you anyway, because there is no one else to tell."
- Both read well, and the variants clearly respond to the record. The text port answers "I'm listening." automatically (as LLM-8 bug 12 noted for the Emperor).
- The second political prisoner (Tigris) didn't repeat the confession. Good.
- **Prison records:** "Refuses to salute the Imperial standard." and "Scratched a sign on the cell wall: a broken chain" felt political. "Bears an old brand from the legions" (offered twice) did not, so I passed on it, which is the point of an ambiguous clue.
- Amnesty (2 Influence) brought a political prisoner in each of the next two months.

**No Favour for sparing when blood is wanted (verdict: works, but the wording is off).**
- Every blood-call spare said "`spare`: no Favour: the Emperor wanted blood too". A mercy-call spare in the top arena gave "+2 Favour, +1 Renown, +5 Morale" (Oenomaus).
- In lower arenas the same "Emperor wanted blood" reason appears, which is misleading (section 2).
- Because demands auto-fail (bug 1), I never saw the "Emperor demanded a death" variant.

**Feud months (verdict: half done in the text port).** `houses` shows "feud 3 months". The opponent card doesn't (bug 5).

**The tutorial month with one gladiator (verdict: fine).** "Let's start with one gladiator", then the job step. I recruited a second one anyway; the roster cap was 2.

**Nemeses (verdict: the best 5.2.0 feature).**
- Pavo beat Hruk in October Y1 and came back in Martius Y2 as "NEMESIS the Grinning (beat your house 1×; +1 Power)".
- Beating him paid +27 Gold (the purse plus 10 nemesis Gold) and +3 Favour.
- In 9010, Sol-2 became "Sol-2 Sandreaper" after an upset.
- The Result line doesn't itemise the nemesis bonus.

**Betting (verdict: broken for favourites).** See bug 2. As it stands, you can only profit at under about 70% odds, with stakes of 5+, which in the Dirt Pits means Gold you don't have.

**The Emperor's demands (verdict: currently can't be played).** See bug 1.

**Bonds (verdict: quietly good).**
- "Bonded with Corvax" after Hruk and Corvax both won on one fight day (Iunius Y1). Hruk's comfort went from +23 to +31 and Corvax's from +20 to +28.
- Grosh bonded with Dacia through the Exhibition Ring.
- I never saw grief (no bonded death) or mentoring (no gap of 3+ levels inside a bond).

**The crowd's hype (verdict: invisible in the text port).** I never saw a hype meter or a "hype pays" line. Payouts are folded into the Result Gold and Renown.

**The Patron Lounge (verdict: useful, slightly clunky).**
- Hosting cost 6, then 9 Gold, for +3 Influence each time (Hruk's Renown).
- Amnesty did its job.
- At Lounge level 1 the second host's Influence had nothing to spend on while Amnesty ran 16 weeks ("Your Lounge can keep no more policies in force"). Hosting during a policy should be flagged as banking Influence.

**Seasoned Liaison prisoners:** Hadria (Lv2 with Mighty, Power 8, 2 Gold) and Tigris (Lv2 with Swift, Power 10, 2 Gold) were bargains next to the Market's 7–9 Gold.

**Short careers (verdict: a fast and fun start, then the same Bronze wall).**
- House level 3 by week 8, and the Dirt Pits purses doubled (+24 for the Boss).
- Bronze Tournament 1 is the only fight before the Boss, so one unlucky loss at 78–82% leaves you facing the Boss under-trained.
- The rival Boss grows +1 per win over you (Elowen 14 → 15), and two Boss losses cost 30 Favour.

## 5. Top 10 suggested changes (most valuable first)

1. **Fix the Emperor's demands** (`run.js:1185` vs `:1201`): judge the old demand before issuing the new one, and show the Emperor's spoken line when it's set. Right now it's a guaranteed −2 Favour about every other month.
2. **Fix betting payouts** (`run.js:1831`): return the stake plus a profit of at least 1 on any win, and show it as "returns X (Y profit)". Keep the returned stake out of the purse line.
3. **Start short careers at the right House level** (`run.js:857`: use `prestigeLevelFor(prestige)`).
4. **Keep the Bronze rung from becoming a wall.** Both careers stalled there: 9009 for 7 months, 9010 indefinitely. Options:
   - Training at a flat 2 Gold per week below Silver.
   - The Bronze Boss's base Power 14 → 13.
   - Rival growth capped at +1 for the first two arenas.
5. **Say when training stops.** When `end-week` or `to-tournament` switches someone to Rest (overtraining or no Gold), print it in the week summary, and resume training automatically after a rest week if the job was Train.
6. **Log the lower arena moving on** (`arenaMovesOn`, `run.js:2332`), with who fought and who's next.
7. **Make the spare prompt honest:** when the house already owes you, say "already owes you a life (N months left)" (`play-text.js:244`, `fightView.js:139`, `views.js:776`). Show months on the opponent line (`play-text.js:179`). In a lower arena, give the lower-arena reason first (`run.js:2189`).
8. **Boss Titles when a fighter is already Champion:** either give the Boss winner something else (+1 Renown per tier, or a "Boss-slayer" mark), or drop "Win: a Title (+1 Power)" from the card when they already hold it.
9. **Revenant polish:** stop listing raised fighters under "Fallen". Carry `revenantOf` into the first-win and first-kill checks (`run.js:2069`). Say which kind trait was lost. Attribute Grave Chill to its owner in the math.
10. **Let a Flesh Wound heal on Rest** (slowly, 2 weeks), like Distracted now does. A 1-bed Medbay leaves light wounds sitting for months.
