# Playtest LLM-6 — seed 6006

## 1. Summary

- **Seed 6006, 463 commands, about 88 weeks** (Martius wk 1, Y1 to December wk 4, Y2). The career had not ended; I stopped at the command budget. About 70 of the commands were `look`, `ok`, `market`, `estate` or `math`.
- **Result:**
  - Dirt Pits conquered in Sextilis Y1, on my second Boss try (Unit Delta beat Sol-9).
  - Bronze Arena conquered in Quintilis Y2, on my third Boss try. Brakk beat and killed Ixa, the RIVAL who had beaten Unit Delta twice.
  - Won Silver Tournament 1 in Sextilis Y2 (Brakk, three 2–1 matches).
  - Lost the Silver T2 Final in September Y2, the Silver Boss Quarter-final in October Y2, and the Silver T1 Final in November Y2.
  - Lost the Silver T2 Final in December Y2, where Torq died.
  - At stop: Prestige 43 (House level 3, level 4 at 50), Favor 65, Gold 8 (just paid the 30 Gold tribute). #2 of 4 houses; House Severa is already in the Imperial Coliseum.
- **Roster at stop:**
  - Brakk (Human Sagittarius, Lv5, Champion of the Dirt Pits and of the Bronze Arena, my carry thanks to Underdog).
  - Elowen (Orc Blood-Bearer, Lv3, Power 18).
  - Xanthe (Orc Blood-Bearer, Lv1, Power 17).
  - Retired to the Hall of Champions: Unit Delta, Marcus, Sabina (+5 Prestige each).
  - Released: Aelia.
- **Deaths:** one. Torq (Human Fighter, Bow, Champion of the Bronze Arena) died in Round 3 of the Silver T2 Final (December Y2). The screen had shown "about 11% chance of death this round".
- **Kills: 7.**
  - Crixus (Delta), Hilarus (Marcus), Nyx (Sabina), Ixa (Brakk), Agron (Elowen), Varro (Torq): all at the crowd's call.
  - Gaius (Elowen): against the crowd, which started a feud with House Severa.
- **Shape of the run:**
  - A starved, dice-heavy first arena: Gold 0–4 for most of Aprilis–Sextilis Y1, and two upset losses as "Favored"/"Strong favorite".
  - The Bronze wall again, September Y1 to Quintilis Y2 (10 months). Opponents were Power 12–15, my fighters 9–11.
  - **What broke the wall:**
    - Retiring Unit Delta (+5 Prestige).
    - Recruiting Brakk and Torq, two Humans with the **Underdog** trait (+2 Power whenever the opponent has equal or more Power, which in this game is always).
    - Taking +1 Power Titles from the *lower* arena Bosses.
  - Silver repeated the pattern on a smaller scale: each bracket was decided by Round 3 coin flips, and two of my three Finals were lost in Round 3.

## 2. Where I was confused

- **Martius Y1, wk 2.** Marcus trained Speed only, and his card said "Power 6 (Natural and training 6)". I thought a Speed point had gone into Power.
- **Every tournament.** Opponent Power on the card does not match the fight.
  - Brutus was listed at "Power 12 · Gear: Gladius" and walked out at 14.
  - Mevia was listed at 13 and fought at 14.
  - On the Silver Boss screen (October Y2), the bracket line says "Final vs Marcus (Power 19)" while the opponent card two lines below says "Power 18".
  - The fight header just says "Power 14 (everything applied)" with no breakdown, so I could never tell whether a +1 was gear, Choleric, Scouted or the feud.
- **Scouted, every month.** The text is still "Scouted: opponent +1 Power (they fought here last month…)". I read "they" as the opponent.
- **Press beats Feint, but I didn't gain anything.**
  - Brakk vs Livia, September Y2, Round 1: I read the Feint correctly. I got "Counter (Press beats Feint) +10%", but Livia struck first and still got "Feint +10%", so the correct read netted zero.
  - Elowen vs Tetraites (November Y2, R2): the opposite. Elowen was countered but still got Feint +10% because she struck first.
  - The "X reads it" line makes it sound like a clean win for one side.
- **Phlegmatic tells.**
  - Ixa ("usually Guards first") Pressed in Round 1 (November Y1).
  - Mevia ("counters your last tactic") Guarded after I Feinted (Iunius Y2).
  - "Usually" is fine, but with only 2–3 rounds, two misreads decide the match.
- **Discontent.** Brakk (Renown 23) went Discontented in October Y2 with 2 Birds, a Shrine and a War Banner. `job f53 trainPower` was refused, two days before a Boss.
  - It was not obvious that each decor item is worth only +5 Morale.
  - It was also not obvious that the expectation is 2 per Renown (`MORALE.expectationPerRenown`), so a star fighter needs an Entertainment Room or Quarters level, not more trinkets.
- **Brackets pay nothing until the Final.**
  - Silver Quarter-final and Semi-final wins showed "+6 Gold · +0 Prestige", and losing the Final cost the 3 buy-in.
  - Elowen in November Y2: QF win, SF win, Final loss, for −3 Prestige and two light wounds. That felt punishing, and I did not expect it.
- **`to-tournament` overtrains.** Twice (Aelia in Sextilis Y1, Elowen in October Y2) a 3-week skip left a fighter on Train for three weeks and Overtrained (Stress 50–60) on fight day.

## 3. Bugs or things that looked wrong

1. **The Power breakdown labels Speed training as Power.** `src/run.js:78`: the label is `trained || !f.trained ? 'Natural' : 'Natural and training'`. A fighter who trained only Speed (`trainedPower` 0, `trained` > 0) shows "Natural and training 6". This happened to Marcus, Delta, Sabina and Aelia all through Y1.
2. **Perk Power is hidden inside "Natural".**
   - Mighty and Juggernaut add to `f.power` (`src/run.js:876`), and `powerParts` (`src/run.js:75–86`) has no Perks entry.
   - Brakk shows "Natural 8" (7 plus Mighty), and Sabina "Natural 7" (6 plus Mighty).
3. **Opponent Power excludes gear; everything else includes it.**
   - `scripts/play-text.js:145` prints `Power ${f.power}` for opponents.
   - The bracket line (`:165`) and my own cards (`:130`) use `effectivePower`.
   - Result: "Final vs Marcus (Power 19)" next to "Power 18" on the same screen.
4. **My cards don't show gear or perk Speed.** `scripts/play-text.js:130` prints `Speed ${f.speed}`. Brakk with a Hunter's Bow (+2) and Swift (+3) shows "Speed 6", but enters fights at 8.
5. **`gearText` drops the `win` stat.** `src/codex.js:106–113`.
   - Spiked Gauntlet is listed as "+10% chance to injure", but the fight math shows "Spiked Gauntlet +2%" (win).
   - Wooden Buckler (+2% win) and Lion Pelt (+5% win, `src/data.js:400`) are under-described in the Armourer as well.
6. **The heal log uses raw tags.** `src/run.js:622`: `inj.tag === 'fleshWound' ? 'Flesh Wound' : inj.tag` gives "Brakk's blinded has healed", "Elowen's poisoned has healed" and "Marcus's senseless has healed". It should use `INJURY_BY_TAG[tag].name`.
7. **Thumbs-up text is inconsistent.**
   - `scripts/play-text.js:545`: Spare prints "+2 Favor. The crowd roars its approval. " (with a trailing space) and never mentions the +1 Renown and +5 Morale it also gave.
   - Kill prints the combined "+3 Renown".
8. **The first-kill chronicle always says "at the crowd's verdict".** `src/run.js:1492`, even for a kill against the crowd's mercy chant.
9. **Name reuse is still present.**
   - My retired fighter "Marcus" became the Silver Boss of House Severa ("Final vs Marcus").
   - "Ursa" was an Orc Cestus (December Y1) and then an Android Cestus (Iunius Y2).
   - "Ilithya" and "Morg" are back in the market.
10. **Humor spread.** Of the 6 fighters whose humor I checked, 4 were Melancholic (Marcus, Unit Delta, Brakk, Elowen), 1 Phlegmatic (Sabina) and 1 Sanguine (Xanthe). `src/run.js:43` is a plain `pick`, so this may be seed luck, but it is the second seed in a row where it happens.
11. **The "Favored" label misleads in brackets.** It is computed for the Quarter-final only.
    - Brakk was "Strong favorite" for Silver T2 (Final opponent Power 18 plus gear) and "Favored" for the Silver Boss (lost the QF on a 74.1 roll against 73).
    - The label should be for the whole bracket. This was already noted in LLM-5 and is unchanged.
12. **Lower-arena wins pay the same Gold as losses.** In the Dirt Pits while in Silver: "Win: +2 Gold, +0 Prestige · Loss: +2 Gold". In Bronze while in Silver: win 5, loss 4. The "half per tier" rule makes the purse smaller than the loss stipend, which is probably not intended.

## 4. Signature moves

**How they played.** I used 13 signatures over about 20 matches at Lv3+, and opponents fired about 14.

- **Mine that changed a result:**
  - Twin Fangs (Sabina, Bronze T2, Martius Y2): 62% in R2.
  - Aimed Shot (Brakk, Bronze Boss R2 and Silver T1 SF/Final R3): every R3 Aimed Shot won the round.
  - Champion's Blow (Torq, Silver T2 Final R1): pushed a +2 Delta with a correct Feint to "99.999%".
- **Opponents' that changed a result:**
  - Cassia's Twin Fangs (Silver T1 SF R2).
  - Livia's Twin Fangs, which Blinded Brakk into Mortal Danger.
  - Kroth's Twin Fangs (Silver T2 Final R2), which Poisoned Torq ×2 and set up his death.
  - Tetraites' Feed the Ash (+1 Power in R3, Final lost 63/68).

**What works**

- It is clear: `signature`, a one-line effect, a ★ line in the narration, and "used this fight" afterwards. It also resets between bracket matches, which is right.
- The best moment of the run came from it. In the Bronze Boss, Round 2, at 17 vs 17, I readied Aimed Shot and the narration printed "★ Brakk unleashes Aimed Shot! ★ Ixa unleashes Aimed Shot!" back to back. I won the round, then the match, then killed my rival.
- The enemy rule ("when behind, or in Round 3") is predictable once you know it, so it is fair. In practice I could predict nearly every enemy signature.

**What doesn't**

- **The Speed-only moves are often dead.**
  - Hawk Strike: −3 enemy Speed.
  - Cast the Net: −5 enemy Speed and −5% win.
  - My Speed-trained fighters already strike first in most early fights. Marcus's Cast the Net took Hilarus to "Speed −4"; only the −5% win mattered.
  - Hawk Strike's +10% injure is the only part that ever showed.
  - Compared with Twin Fangs (+10% win, +10% injure) or Aimed Shot (+10% win, +20% injure), Ornitharius and Retiarius got the weak moves.
- **The opponent's signature isn't shown before the fight.** The opponent card lists the Kind trait and class ability but not "Signature: Twin Fangs". I learned Kroth had Twin Fangs when it blinded Torq.
- **Too common at Silver.** Every Silver regular has one and fires it. It is effectively a +10% win (and +10–20% injure) bump for them in R2 or R3 of every match, which deepens the Silver difficulty step.
- **Round 3 coin flips.** Because both sides tend to fire in R3, Round 3 often becomes "+10 vs +10". The move cancels out and the match comes down to the original Delta.
- **Auto-`next` never uses the signature.** It would be nice if `next feint sig` did both in one command.

**Verdict.** Worth having, and a good amount of drama. Slightly too strong on the enemy side at Silver, too weak for the Speed-based classes, and under-signposted.

## 5. Thumbs up or down

**How it played.** There were 12 verdicts.

- **The crowd's call:**
  - Blood (8 times): opponent at the Death Gate, including a single Poisoned ×2, or from a feuding house.
  - Mercy (4 times).
- **What I did:**
  - I followed the crowd 11 times.
  - Once (Gaius, November Y2), I killed against a mercy chant to test the feud.

**What it pays**

- Follow a blood call: +3 Renown, +5 Morale, a kill toward Dreaded (3 kills) and Reaper (6 kills), and no feud.
- Follow a mercy call: +2 Favor, +1 Renown, +5 Morale.
- Spare against a blood call: +2 Favor only.
- Kill against a mercy call: +2 Renown, a kill, and "House Severa swears revenge: their fighters get +1 Power against you for 3 months".
  - Severa supplied about two thirds of my Bronze and Silver opponents, Bosses included.
  - That one kill made the December Silver T2 bracket and the next Boss each one Power harder.

**Is one option always right?** Yes: do what the crowd says.

- Going against a blood call costs Renown and Morale for 2 Favor. Favor sat between 51 and 75 all run and was never what I was short of.
- Going against a mercy call means taking +1 enemy Power for 3 months to gain 2 Renown.
- **Kill marks:** no fighter got close to Dreaded at 3 kills. I retired veterans for Prestige, and fresh recruits start at 0. So the long-term reason to kill never mattered.
- **Favor loophole:** sparing in a *lower* arena still grants +2 Favor (Sabina vs Juno, September Y1), although the arena text says "no Favor for winning".

**Clarity.** The prompt is clear. The "(against the crowd: their house swears a feud)" warning is very good. The only confusion was the inconsistent result text (bug 7).

**Suggestion.** Give each choice a real reason to go against the crowd:
- Spare could put a *favor owed* on the rival house (−1 Power against you, or a cheaper prisoner).
- A kill against the crowd's wishes could give double Renown or count double toward marks.
- Kill marks should come earlier (Dreaded at 2).

## 6. Economy and pricing

**Gold track**

| When | Gold | What happened |
|---|---|---|
| Martius Y1 wk 1 | 12 → 6 | 2 recruits at 3 Gold |
| Aprilis–Sextilis Y1 | 0–5 | One T2 win (+8). Training at 1 Gold a week was the only spending, and twice I could not afford it ("Needs 1 Gold; you have 0"). Quarters Lv2 (6) |
| Sextilis Y1 (Dirt Pits Boss) | 16 | Trainer Lv2 (10) took it straight back to 6 |
| November Y1 | 21 → 6 | Paid the 15 Gold tribute early |
| December Y1 | 16 → 1 | Armourer (10), swapped Aelia for Brakk (5) |
| Martius Y2 | 5 → 23 | Year-end purse was only 4 Gold for #2 place. Bronze T2 win +14 |
| Maius Y2 | 19 → 6 | Gladius (7), decor (3), training |
| Iunius Y2 | 10 → 0 | Torq (5), training at 2 a week, Medbay Lv2 (8) |
| Quintilis Y2 (Bronze Boss) | 22 → 6 | Trainer Lv3 (16) |
| Sextilis Y2 (Silver T1 win) | 0 → 29 | |
| September Y2 | 33 → 0 → 24 | Second Trainer Room (8), training at 3 a week for two fighters, decor |
| October Y2 | 25 → 1 | Entertainment Room (8), Shrine and War Banner (7) |
| December Y2 | 38 → 8 | Tribute 30 |

**Verdict: starved, all the way through.**
- I never had more than 38 Gold.
- I never bought a single Apothecary item in 88 weeks.
- I never built an Oracle, Stables or Liaison, and never upgraded the Armourer.
- The Y2 tribute (30) doubled while my income roughly doubled too. With Trainer Lv3 at 3 Gold per fighter-week, two trainees cost 6 a week, so a Silver T1 win (14) pays for about 2 weeks of training.

**Great value**
- **Gladius, 7 Gold, +1 Power for good.** The best purchase in the game. I bought two and looted two.
- **Trainer upgrades.**
  - Lv2 for 10 Gold raised the cap from 3 to 5.
  - Lv3 for 16 Gold raised it to 8.
  - Both were essential. The second Trainer Room (8 Gold) was also good.
- **Retiring veterans: free +5 Prestige**, and the market then sells better fighters. At Silver a Lv1 recruit costs 7 Gold with Power 9–10. Elowen at Lv1 had Power 10 when my Lv4 veterans were at 10–11. That makes veterans disposable, which undercuts the attachment the chronicle and kill marks are trying to build.
- **Lower-arena Bosses.** They pay little Gold, but give a Title (+1 Power permanently). Marcus, Brakk and Torq all took one; it is the cheapest Power in the game.
- **Entertainment Room, 8 Gold:** +10 Morale for everyone, the only real fix for star-fighter discontent.
- **Medbay Lv2, 8 Gold:** heals 2 weeks of injury a week for 2 fighters.

**Traps, or never worth it**
- **Apothecary items, 5–12 Gold, one round.**
  - War Paint costs 7 for +1 Power, one round. A Gladius costs the same for +1 Power forever.
  - Berserker Mushroom costs 8 for +2 Power, one round, plus injury risk.
  - When a Bronze T1 win paid 10, no item ever made sense. The prices look the same as in LLM-5.
- **Hunter's Bow and Light Greaves, 12 Gold, +2 Speed.** That is 1.7 times a Gladius, and Speed is already cheap from training. The +2 is also invisible on the card (bug 4).
- **Wooden Buckler, 7 Gold, −4% to be injured.** Much worse than a Leather Vest (5 Gold, −5%), except for the hidden +2% win.
- **Decor beyond 1–2 items:** +5 Morale each, which does not keep a famous fighter (2 Morale per Renown) happy.
- **Lower-arena regular bouts after promotion.**
  - Dirt Pits at Silver: win 2, loss 2, 0 Prestige.
  - Bronze at Silver: win 5, loss 4.
  - Champions there are booed (−3 Favor), and anyone 3+ Power above is jeered.
  - So after promotion only Lv1 rookies have any reason to go back.

## 7. The Power breakdown

**Useful? Yes, and I read it every week.**
- "Power 15 (Natural 8, +5 Training, +2 Titles)" made it clear that Titles from lower Bosses were worth chasing.
- "+1 Gladius" made gear feel concrete.
- It is the clearest progress meter the game has.

**But it has holes**

| Problem | Example | Location |
|---|---|---|
| Speed training shown as Power | "Natural and training" on fighters who trained only Speed | bug 1 |
| Perk Power hidden | Mighty and Juggernaut folded into "Natural" | bug 2 |
| Opponent Power excludes gear | The opponent card disagrees with the bracket line and the fight | bug 3 |
| No breakdown in the fight header | The round modifiers that decided fights were invisible: Choleric (+1 R1), Melancholic (+1 R3), Scouted (+1), feud (+1), Underdog (+2), Quantum Analyzer (+1 per lost round), Afeared scar (−1 vs melee) | fight header |
| Speed has no breakdown | Gear and Swift are not shown in Speed at all | bug 4 |

**Suggestion.** Show the same breakdown in the fight header, for example "Power 17 = 16 base, +1 Melancholic R3, −2 Underdog lost (Blinded)", for both fighters. Use it on the opponent card too.

## 8. Fun and addictiveness

**What kept me going**
- **Rivalries.**
  - Ixa beat Unit Delta twice ("RIVAL, beat you before, now stronger").
  - Brakk, a 5-Gold Human I had swapped in for an Elf, took him down at 17 vs 17 under the Ludi Apollinares (+1 for archers), and killed him.
  - Then House level 3, the Silver Coliseum, and a Gladius drop.
- **Brakk's Silver T1 run.** Three matches, each won 2–1, each decided in Round 3, each with a signature exchange.
- **Torq's death.** A Saturnalia Final, "about 11% chance of death this round", and I fought on, even though capitulating was literally free that week ("lose the match and 0 Prestige buy-in"). He died to "severity 128". The Advice line called it exactly. A painful lesson that I earned myself, which is the best kind of loss.
- **Retire and replace,** and stacking Titles from lower Bosses, were interesting decisions.

**What was boring or frustrating**
- **The Bronze wall,** September Y1 to Quintilis Y2.
  - The first Bronze Boss was Power 15–17 against my 10.
  - At "Delta −5" I could guess the tactic correctly and still win 0.001% of the time, which makes tactics pointless.
  - LLM-5 reported the same wall, and it is still there.
- **Dice on Favored fights.**
  - Marcus lost his first two fights as "Strong favorite" and "Favored" (85% and 71% rounds).
  - The Silver Boss QF was lost on 74.1 against 73.
  - Two Finals were lost on 63 vs 68 and 46 vs 52.
  - Fine in moderation, but with Prestige leaking on every loss, a streak feels like the game punishing you rather than drama.
- **Gold starvation:** there was never a shopping moment.
- **Events:** one almost every week in Y1 (revelry twice, fever twice, the lion twice, the sparring challenge), and every one blocks `to-tournament`. Y2 was quieter, which was better.
- **Verbosity:** the four-sentence "Lower arena:" paragraph prints once per lower arena on every screen, 2–3 times per `look`.

**Best moment:** "★ Brakk unleashes Aimed Shot! ★ Ixa unleashes Aimed Shot!", then the kill.

**Worst moment:** sending Unit Delta into the November Y1 Bronze Boss at Power 10 vs 15 and seeing "wins this round 0.001% of the time" in Round 1.

## 9. Top 10 suggested changes (most valuable first)

1. **Flatten the Bronze step, or show the way over it.**
   - First Bronze opponents should be about Power 10–11, not 12–14, and the first Bronze Boss about 13, not 15 rising to 17.
   - Or show "Power needed" next to each arena.
   - At a 5-point gap, no tactic, item or signature matters.
2. **Fix the Power and Speed display** (bugs 1–4).
   - Same breakdown for opponents; include gear in opponent Power; add a Perks part.
   - Show Speed with gear.
   - Add a per-round breakdown in the fight header for both sides.
3. **Make Apothecary items worth buying.** Halve their prices, or make them last the whole match. Right now a Gladius beats every item.
4. **Fix lower-arena pay:** a win should always pay more than a loss. Pay the full purse to Rookies, or use a floor of loss pay + 2.
5. **Give the thumbs choice a real trade-off.**
   - Sparing against the crowd should earn something lasting.
   - Kill marks should come sooner (Dreaded at 2).
   - Bring kill marks or the chronicle into the retire decision, so veterans are worth keeping.
6. **Signature tuning.**
   - Show the opponent's signature on their card.
   - Give Hawk Strike and Cast the Net a non-Speed rider (for example +5% win), because Speed-down is wasted when you are already faster.
   - Consider giving signatures to only some Silver regulars (for example 50%).
7. **Make brackets pay as they go.** Give +1–2 Prestige per Quarter-final and Semi-final win, so a Final loss isn't −3 after two wins and two wounds. Make the odds label cover the whole bracket.
8. **Make "Underdog" less dominant.** It turned an average 5-Gold Human into the best fighter in the house for the whole run. Make it +1, or require the opponent to have 2+ more Power.
9. **Morale clarity.**
   - Show "expects X, gets Y" on the card.
   - Warn before a fight-week when a fighter is about to go Discontented and stop training.
   - Make `to-tournament` move a trainee to Rest before they reach Overtrained.
10. **Text polish.**
    - Fix the heal-log tags (bug 6), the spare and kill text (7), the chronicle (8) and `gearText` (5).
    - Collapse the repeated "Lower arena:" paragraph.
    - Reword Scouted to "your fighter fought here last month".
    - Make names unique among living and retired fighters (bug 9).
