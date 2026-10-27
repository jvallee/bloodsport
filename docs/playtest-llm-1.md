# Playtest report: LLM new-player run #1

## 1. Summary

- **Seed:** 2026, text port (`scripts/play-text.js`).
- **Length:** Martius Year 1 to Sextilis week 4, Year 2. That's 67 weeks and 27 matches (24 wins, 3 losses), about 16 tournament months.
- **Ending:** **Won.** Ixa took the Grand Tournament and I was named Master of the Games, with Favor at 87 and no fighters lost.
- **Input:** about 390 command lines in total. Roughly 105 were look-ups (`look`, `market`, `estate`, `store`, `codex`) and 58 were week advances.

The first three months were the best part of the game. Gold was scarce, every training week mattered, and losing the first Boss at 76% odds (by my estimate) cut Favor from 50 to 20. That loss made the rest of Year 1 tense in a good way. Once Ixa beat the Dirt Pits Boss, though, the career snowballed. She had Swift, Tactician, a Bow and a stack of Titles, and from the Bronze Arena on she was a "Strong favorite" in every top-arena fight. I cleared Silver, the Imperial Coliseum and the Grand Tournament without ever needing a second fighter at the top. The rest of the roster existed only to farm lower arenas for Gold. I never opened a Death Gate on my own fighter and never threw in the towel, so the game's most dramatic system went untested. The rules were mostly readable from the Codex and the fight math. The difficulty curve is backwards: the hardest moment was the first Boss, and the final was about 100%.

## 2. Where I was confused

- **Martius wk 1, tutorial cards.** I recruited two fighters, then typed `ok` to dismiss what I thought was the "Recruit" card. The reply was `Dismissed "Give everyone a weekly job"`, a card I never saw. Recruiting had already advanced the queue silently, so `ok` skipped the jobs tutorial.
- **Martius wk 1, Estate.** The Trainer Room reads "Trains 1 fighter a week, up to 3 total points". I couldn't tell whether that was 3 points per week, per fighter, or for the house. It only became clear when the fighter card showed `trained 1/3` after one session. Also, Speed training gives +3 Speed for one "point" while Power gives +1, which the Trainer text never mentions. The Speed Codex entry does mention it.
- **Martius wk 3, jobs.** `job f8 trainSpeed` failed with "All 1 Trainer Room is busy" because Ixa was still on trainSpeed from the week before. I had typed her change to rest after his line, and the order mattered. I lost a training week before I noticed.
- **Aprilis wk 1, odds labels.** Carpophorus had Power 8 vs Cassia's 7 at equal Speed, but was labelled "Underdog · Injury High". A week later he was at Power 9 vs 7 and labelled only "Even fight". I assume Cestus Progressive Overload explains it, but without the Oracle the labels sometimes contradicted the visible stats.
- **Aprilis wk 4 and every tournament week after.** Once the top arena is settled, the "Fight day" block shows next month's bouts as "settled". It reads as if those fights had already happened.
- **Maius wk 4, Year 1, first Boss.** Ixa was a "Strong favorite" and lost 1–2. The rounds were 70%, 70% and 65%, and the -30 Favor took me from 50 to 20 (DANGER). The stakes were printed, so it was fair, but "Strong favorite" covered roughly a one-in-four chance of nearly ending the career.
- **September Y1, lower-arena jeer.** The arena block says "Lower arena: no Favor at stake … and the crowd jeers crushing mismatches." Then the crushing win cost -2 Favor. The Codex Favor entry does list it, so the arena text contradicts the Codex. Carpophorus's Morale also showed 32 Restless right after the jeered win, down from 42. Nothing says a jeer hurts Morale, and I'm still not sure that's what caused it.
- **Iunius Y2, "crushing" threshold.** Sol-9 was only "Favored" (65% rounds, Power 12 vs 10) and was still flagged as a crushing mismatch and jeered. I couldn't tell what counts as crushing.
- **December Y1, missed injury.** Ixa was Maimed in a fight she won 2–0, and I didn't notice. The "Injuries and the Death Gate" card only appeared two weeks later in Winter, after I'd wasted two weeks of Medbay time. To be fair, I was skimming the fight output.
- **Martius wk 4, Y2, gear.** I bought Light Greaves and ran `equip f5 0`, which equipped an old looted Hunter's Bow and unequipped her Gladius. `buy-gear` says "now in the storeroom" but not at which `#`, and the indexes shift whenever something is equipped.
- **Throughout, displayed Power.** The fighter card shows base Power plus Titles but not gear: "Power 15 · … Gear: Gladius (+1 Power.)". In the fight the number is different again, because of bow and gear. I had to work out what "Power 21" really meant before each fight.
- **Opponents with missing stats.** Some opponents were listed without a Power/Speed line, for example "Grosh · Elf Ornitharius · Lv 2" and the Grand Tournament's "Ursa · Elf Ornitharius · Lv 5". The stats appeared weeks later, and nothing said they were hidden on purpose.
- **Recycled names.** "Unit Kappa" was a Human Cestus in the market, then an Android Ornitharius opponent, then a Human Ornitharius in Bronze T1, then the Android Cestus Bronze Boss. Vex died in the arena, and a different Vex turned up the next month. Rivalry (the "RIVAL" tag on Juno) relies on names, so this undercuts it.

## 3. Rules the tutorial or Codex failed to explain

- **Trainer upgrades raise the weekly training cost.** The cost went 1 → 2 → 3 → 4 → 5 Gold a week. The upgrade line only says "Upgrade to Lv 2 (Trains 1 fighter a week, up to 5 total points) for 10 Gold". After upgrading at 4 Gold left, I found I could afford one training week before the Boss.
- **The training cap is per fighter and set by your best Trainer Room.** A second Trainer Room adds a second weekly slot, even at Lv 1 ("up to 3 total points"). Fighters already past 3 points kept training to the Lv 5 cap, and each trainee paid the top room's cost. I only learned this by building one and testing it.
- **Building an Armourer mid-month gives no stock** ("Sold out until next month"). The build text doesn't warn you, so I spent 10 Gold and couldn't buy anything for the Boss.
- **Lower-arena circuits only advance when you fight them.** The Dirt Pits stayed on "Tournament 2" for several months while I skipped it.
- **Lower-arena Boss wins give no Title.** Carpophorus beat the Bronze Boss and Hilarus beat the Silver Boss as lower arenas, and neither got a Title or Favor. I guessed this from "only its Bosses move you up", but the Boss tutorial says "Win and your fighter earns a Title".
- **Max level is 6.** Ixa hit "max level" around month 13. Nothing warns you, and XP after that does nothing.
- **Fighters on the Medbay job heal for free.** That's fine, but the Medbay is never priced or explained beyond its capacity.
- **Decor caps per Quarters level.** The Estate says "Decor up to 1 of each item" and later "2" and "3", but the decor merchant never says so. Each item gave a flat +5 Morale target, and each Quarters level about +10. I found that by trial.
- **Whether gear replaces a Fighter's weapon specialty.** I worried that equipping a Hunter's Bow on Sol-9, a Gun Fighter, would replace the Gun specialty. It didn't. The gear Codex entries were locked until I owned the items.
- **"Stripped of Armor" and armor-slot gear.** It's unclear whether Light Greaves or Scale Mail count as "armor" under the rule. The rule text names only "Alloyed Skin, Ego Armour".
- **How Speed initiative interacts with "Concussed: always strikes second".** This was fine, and the fight log explained it in the moment ("Juno is Concussed, so Ixa strikes first").

## 4. Meaningful decisions vs. busywork

**Choices that felt like real trade-offs:**
- **Year 1 Gold.** In month 2 I chose a Trainer upgrade (10) over decor, quarters or an Oracle. Then I found I couldn't afford to use it. That's a real squeeze, if partly an unfair one (see the hidden cost above).
- **Which fighter to send.** Early on, giving Carpophorus the easy Tournament 1 for XP while saving Ixa for the Boss felt like managing a stable.
- **Lower-arena farming.** Trading -2 Favor for +6 to +12 Gold was an interesting dial, especially with tribute due and Favor at 33.
- **Stress scheduling (train, train, rest) before the Entertainment Room.** Planning around 50 Stress on fight day was satisfying.
- **First perks.** Swift vs Crowd Pleaser vs Thick Skin, then Tactician on a fast fighter, were clear and flavourful choices.

**Choices that were repetitive or had an obvious answer:**
- **Speed training.** +3 Speed per point against +1 Power, plus up to -20% to be injured, made Speed the obvious first buy. Once a fighter is several points faster, extra Speed barely matters, and then Power is the only answer.
- **Perks after level 3.** Swift or Tactician on whoever strikes first, then Duelist or Killer. Survivor and Iron Constitution never looked worth it.
- **Decor.** Buy bird, brazier and trophy for each fighter every time Quarters goes up. It's 4 Gold per set with no interesting choice (except Firebug Elves, which I never had).
- **Entertainment Room.** Once built (8 Gold), Stress stopped mattering. Training netted +5 Stress a week, so the train/train/rest rhythm disappeared.
- **Mid-to-late tournament weeks.** These were the same routine: Ixa takes the top arena, two others take a non-crushing lower bout, three `next`s each, pick perks. After Year 1 the top fight was never in doubt.
- **Winter.** Seven weeks with no tournaments. All I did was set training jobs and end the week.
- **Unused systems.** I never used the Liaison, Medbay upgrades, the Emergency Surgeon, the towel or the Death Gate.

**Commands per week:** a quiet week took 1–3 commands (job changes plus `end-week`, or a single `to-tournament`). A tournament week took 8–20 commands: three fights at 3–4 commands each, perks, shopping and equipping.

## 5. Pacing

- **Months 1–3 (Dirt Pits):** tight and engaging. I had 12 Gold at the start and 1 Gold just before the first Boss. The loss at Favor 50 → 20 was a sharp spike.
- **Months 4–8 (Dirt Pits again, then Bronze):** the replayed Dirt Pits circuit, now stronger, felt fair. Bronze was easy. Gold was still tight. In December Y1 the tribute warning read "SHORT by 1: unpaid tribute costs 25 Favor", a clear and useful heads-up, and a tournament win covered it.
- **Winter Y1:** seven dead weeks.
- **Months 10–16 (Silver, Imperial, Grand Tournament):** no tension. The Silver Boss was the last fight where the edge was small on paper (Delta +1/+2 before training), and a 26-Gold Trainer upgrade plus Light Greaves turned it into a 2–0. After that, Ixa was 5+ Power above every top-arena opponent. The Oracle, built only for the last month, showed her at ~90% and then "~100%" for the final.
- **Gold:** scarce until about the Silver Coliseum, then plentiful. I had 76 spare Gold before the final. Year 2's 40 Gold tribute never came due. Each Trainer upgrade raises training costs, so the economy stays tight right up until stops mattering.
- **Prestige:** gated buildings at the right pace in Year 1. By Year 2 it was just a number that went up.
- **Favor:** the only real fail state, and it was most dangerous in the first 3 months. Every Boss win is +15 and lower-arena jeers are only -2, so Favor climbed steadily from 20 to 87.
- **Tribute:** pressing in Year 1, irrelevant after that.

## 6. What won the career

The chain was: recruit Ixa (Orc Fighter, Bow) → one Speed training plus the Swift perk gave her +6 Speed by month 2 → Tactician (+15% for striking first) → a Bow giving +1 Power in rounds 1–2 against melee opponents, and most opponents were melee → every Boss win adds a Title (+1 Power) → the Trainer cap rose from 3 to 21 points as House levels came in. She was also Inspired or Content most of the time thanks to triple decor.

The one setback, the first Boss loss, was readable. The math was on screen and the stakes said "-30 Favor". It did feel harsh: a single 24% bad roll was enough to put the career one loss from execution in month 3. After that, the win felt inevitable rather than earned. A single star fighter with the right perks scales faster than the arena tiers do. Opponents gained about 2–4 Power per tier, while Ixa gained Titles, training cap and gear on top of that. I never had to build depth, rotate stars or face the Death Gate on a fighter I cared about.

## 7. Top 5 suggestions

1. **Make the late game scale with the player's top fighter, or cap the stacking.** One fighter won all five top-arena climaxes at "Strong favorite / ~100%". Options include Boss arena rules that hit the champion's best stat (for example a rule that neutralises Bow bonuses or caps Speed initiative), Titles giving diminishing returns, or a Grand Tournament fought as a gauntlet of 2–3 fights by different fighters, so the roster matters.
2. **Soften the first Boss loss, or warn more clearly early on.** Losing a 76%-odds fight in month 3 dropped Favor 50 → 20, and two losses ended the run. Consider -15 Favor in Year 1 or tier 1. Or put the match-level odds next to the label, for example "Strong favorite (~75% match)", so players understand that "Strong favorite" still loses a quarter of the time.
3. **Fix the lower-arena Favor contradiction and define "crushing".** The arena line should say something like "No Favor for winning; crushing a much weaker opponent costs 2 Favor (and Morale?)", and the preview should show the threshold. A merely "Favored" fighter being jeered felt arbitrary.
4. **Show hidden costs and caps in the Estate and Trainer text.** Upgrade lines should show the new weekly training cost ("Costs 2 Gold per training week, was 1"). Say that the cap is per fighter and that a second Trainer Room adds a parallel slot using the best room's cap and cost. Building an Armourer should say "first stock arrives next month".
5. **Give the mid and late game a reason to use the Death Gate, towel and depth.** Right now the safest play, sending your one star, never brings them into play. Ideas: Bosses that can't be fought by the same fighter twice in a row, a fatigue or "known fighter" debuff for repeat champions, or more lower-arena events (injury-heavy arena rules for big payouts) where risking a second-string fighter is worth it.

## 8. Interface issues (text port only)

- `ok` dismisses whichever card is current. Because actions like `recruit` advance the queue silently, `ok` can dismiss a card you never saw. Print the new card when it appears, in the output of the command that triggered it.
- `buy-gear` doesn't report the storeroom `#` of the new item, and indexes shift after every `equip`. Name-based equipping (`equip f5 greaves`) or printing the index would have saved me a wrong equip.
- The fighter card's Power excludes gear but includes Titles, and the fight shows yet another number (bow, gear). A single "effective Power" line would help.
- After the top arena is settled, the "Fight day" header shows next month's bouts marked "settled".
- After the career ends, every lower arena is still listed as "OPEN this week", with "can't fight: The run is over" repeated per fighter. That's a lot of noise right under the victory line.
- `--last N` printed the full intro when N covered everything since the start (for example `--last 1` with only one command in the file). Harmless, but surprising.
- Small text bugs: "Built a Armourer", "beat the The Dirt Pits · Boss Tournament", "99.999%" shown as a round probability, and the market still says "Liaison: build one (Prestige level 2)" when you are already at House level 2 or higher.
- The "LEVEL UP" blocker ("choose their perk first") stops `end-week` but not `fight`, so a batch of week-ending commands can silently fail mid-batch. The message is clear, but a batch player can miss it.
