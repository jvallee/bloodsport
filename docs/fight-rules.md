# Bloodsport — Fight Rules (Web MVP)

Combat follows Tab 4 and Tab 6 of the design doc: the Power Delta table, the 5-step round order (4A → 4B → 4C), and the Escalating Injury Table with the 2-Injury Death Gate.

## Placeholder decisions (tune after playtesting)

These are not from the design doc. They exist so the MVP can be built now. Items marked **(amended)** differ from the first draft of these placeholders; the reason is given inline.

### 1. Match win — (amended)
- Best of 3: the match ends as soon as one fighter wins 2 rounds.
- A fighter who dies loses the match immediately. Capitulating is a loss.
- The towel prompt appears after Round 1, and after Round 2 only when the score is 1–1.
- *Why amended:* if all 3 rounds are always played, a fighter leading 2–0 must fight a round that can only hurt them, and capitulating would forfeit a match already won. Round 3 traits (Cestus +15%, Melancholic, Phlegmatic) still matter in every 1–1 decider.

### 2. Economy — (amended)
- Start: **10 Gold, 5 Prestige.**
- Buy-ins: **1 / 2 / 3 Prestige** (Tournament 1 / Tournament 2 / Boss), paid on entry.
- Win: buy-in returned **×2** (net +1 / +2 / +3 Prestige) plus **3 / 5 / 8 Gold**.
- Loss or towel: buy-in lost, **+1 Gold** participation cut.
- Costs: fighter **3 Gold**, training **1 Gold** per +1 stat, room decor **1 Gold** per stack (max 3 per type), Medbay **2 Gold** per injury healed (instant in the MVP, since there's no calendar).
- **Morale is deferred.** Nothing in the MVP changes it, so it is not tracked or used as a loss condition.
- *Why amended:* the draft had no Prestige reward for a win, so 5 Prestige couldn't cover 1 + 2 + 3 buy-ins and the Boss was unreachable. It also gave Gold nothing to buy besides fighters.

### 3. Opponents and run structure
- One match per tournament, in the order Tournament 1 → Tournament 2 → Boss. You advance whether you win or lose; only the Boss decides the run.
- Opponent Power: **5 / 7 / 9**. Speed 3. Random Kind, Kind trait and Class (same rules as the player's fighters).
- **Boss debuff (amended):** *First Injury Counts Double*. The first injury your fighter takes in the match has weight 2, which opens the Death Gate immediately.
  - *Why:* "Rainy Mud" uses the retired initiative-pass system, and the MVP has no healing passives for "No Healing Passives" to disable.
- **Win:** beat the Boss.
- **Loss (amended during implementation):** after a match, either you have no fighters and less than 3 Gold (so you can't recruit one), or you can't afford the next buy-in.
  - *Why:* "no living fighters" alone would end the run before the first recruit. "Gold and Prestige both 0" is already covered by the buy-in check.
- **Opponent decor:** an opponent whose build uses decor (Ornitharius, Firebug) gets 1 / 2 / 3 stacks at Tournament 1 / 2 / Boss.

### 4. Stats
- Fighters start at **Power 5, Speed 3**.
- Each training action gives **+1 Power or +1 Speed** (1 Gold), up to **3 total points per fighter** (Trainer Lv 1 cap).
- Trainer Lv 1 option `P:0 S:2` corrected to **`P:0 S:3`**.

### 5. Traits — (amended)
Each fighter has **1 Kind trait + 1 Class**, rolled at recruitment:

| Kind | Kind trait pool (one rolled) |
| :--- | :--- |
| Human | Hateful, Masochist |
| Android | Quantum Analyzer, Alloyed Skin, Perpetual Motion Machine |
| Elf | Firebug, Footwork, Ego Armour, Elven Eyes |
| Orc | Blood Faith; **starts at Power 6** to make up for having no combat trait |

- Classes: Cestus, Sagittarius, Ornitharius, Fighter (with one random Weapon Specialty out of the 7).
- *Why amended:* Perpetual Motion Machine is an Android **Kind** trait, not a Class, and the worksheet's "Android/Quantum Analyzer" build already pairs Android with a Kind trait. Classes stay the 4 core ones. *Versatile Baseline* has no effect and *Specialized* only matters with multiple class slots, so both are left out of the MVP pools. Orc's Power 6 is a placeholder balance fix.
- Room decor (`Bird`, `FireBrazier`) is bought per fighter and feeds Ornitharius and Firebug.

### 6. Rule clarifications made during implementation
- **Blood Faith:** the MVP has no Titles and you advance whether you win or lose, so "keeps non-monetary rewards" becomes: if the Orc dies, the Prestige buy-in is refunded. The match still counts as a loss.
- **Armor** means the negative "chance to be injured" modifiers from Alloyed Skin and Ego Armour. Gun (in rounds 1 and 3) and Flail ignore them. Positive self-injury modifiers (Senseless, Overheating) still apply.
- **Concussed beats Footwork.** If both fighters are Concussed, they roll normally. Footwork compares current Speed, including Spear, Prone and Riposte modifiers.
- **Fists disarm** disables the opponent's class ability (or weapon specialty) for the next round, whatever their class.
- **Distracted/Maimed** disable the Kind trait and/or Class slot for the rest of the match. The injury itself persists until healed.
- **Bow** counts Sagittarius and Bow/Gun/Spear Fighters as not melee-only.
- **Injury chance** is recomputed at each roll, so an injury from Roll 4B changes the 4C retaliation in the same round. Win chance is locked at Roll 4A.
- **Chances** are clamped to 0.001%–99.999% for winning a round and 0–100% for injuries.
- **Elven Eyes** counters are a flat 15% that the target can still parry; a counter can't trigger another counter.
- **Boss debuff** applies only to your fighter, not the Boss.
- **Healing** costs 2 Gold per injury, is instant, and is available any time outside a match.

## Career rules (M5–M8; supersede sections 2–4 above where they differ)

All numbers live in `src/data.js` and were tuned with `npm run career` (see `docs/roadmap.md`, "Balance snapshot").

### Calendar
- 10 Roman months × 4 weeks, then a 4-week **Winter Dead Season** (no tournaments): 44 weeks a year.
- **Week 4 of every month is a tournament week.** You must fight, skip (Tournament 1/2 only) or forfeit (Boss) before the week can end.
- The market and Liaison refresh at the start of each month.

### Weekly jobs (one per fighter, kept until changed)
| Job | Effect |
| :--- | :--- |
| Train Power | +1 Power, +20 Stress, costs the Trainer level in Gold (1–5); needs a free Trainer Room and room under the trainer cap |
| Train Speed | +2 Speed (counts as 1 training point), same cost and Stress |
| Rest | −40 Stress |
| Medbay | Heals the oldest injury by 1 week per week (2 at Medbay Lv 2+), −10 Stress; needs a free bed |

- **Overtrained (Stress ≥ 50):** can't train (rests instead, job kept), and in the arena fights at **−1 Power** with one random ability disabled. A fight adds +15 Stress. Train, train, rest stays under the line.
- **Injury healing times (Medbay weeks):** Distracted 1, Flesh Wound 1, Concussed 2, Poisoned 2, Senseless 2, Maimed 3, Blinded 3. Injuries don't heal outside the Medbay.
- **Emergency Surgeon:** heals one injury instantly for 8 Gold (+4 per tier above 1).

### Fight changes
- **First Strike:** the first striker gets +10% win chance that round.
- **Injury roll:** d100 + **20** per prior effective injury + 5 per point of opponent Power advantage (the design doc used +15; raised so fighting on at the Death Gate is a real risk). Fatal at 100+ with 2+ injuries on a round loss, as before.
- **Boss debuff pool** (one per circuit, drawn at random): First Blood Counts Double, Rainy Mud (−2 Speed), Stripped of Armor, Iron Rules (no decor), Blood Moon (+10% injury both sides), Crowd Favorite (Boss +1 Power).
- **Cestus** nerfed to +3/6/9% win chance (injure bonus unchanged).

### Circuits and career
| Tier | Arena | Opponent Power (T1 / T2 / Boss) | Buy-in | Win Gold | Win Prestige | Market price |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | The Dirt Pits | 5 / 6 / 7 | 1 / 1 / 2 | 6 / 8 / 12 | 2 / 3 / 5 | 3 |
| 2 | The Bronze Arena | 8 / 9 / 10 | 2 / 2 / 4 | 10 / 13 / 18 | 4 / 6 / 10 | 5 |
| 3 | The Silver Coliseum | 11 / 12 / 13 | 3 / 3 / 6 | 14 / 18 / 25 | 6 / 9 / 15 | 7 |
| 4 | The Imperial Coliseum | 15 / 16 / 17 | 4 / 4 / 8 | 18 / 23 / 32 | 8 / 12 / 20 | 9 |
| — | The Grand Tournament | 20 | 10 | 40 | 30 | — |

- Losses pay 2 Gold × tier (10 for the Grand Tournament). The buy-in is lost on a loss, towel or forfeit, and returned with the win Prestige on a win.
- Opponent Speed is 3 + (tier − 1), +1 for Bosses. Opponent decor is 1 / 2 / 3 / 3 by tier. Market fighters get +0 / 2 / 4 / 6 Power by tier.
- **Skip** (Tournament 1/2): no buy-in, +2 Gold, the whole roster −20 Stress, and the circuit moves on.
- **Boss win:** the fighter earns a **Title** (+1 Power, permanent) and the next tier opens. After Tier 4 comes the Grand Tournament; winning it wins the career.
- **Boss loss or forfeit:** an **Imperial Strike**, and that tier's circuit restarts with new opponents and a new debuff. Losing the Grand Tournament is also a Strike, and you try again next month. **Three Strikes: executed (career lost).**
- **Also lost:** no fighters and not enough Gold to buy the cheapest one.

### House Prestige levels (kept once reached)
| Level | Prestige | Room plots | Max fighters |
| :---: | :---: | :---: | :---: |
| 1 | 0 | 3 | 3 |
| 2 | 10 | 5 | 6 |
| 3 | 25 | 8 | 12 |
| 4 | 50 | 13 | 24 |
| 5 | 90 | 21 | 48 |

### Estate (start: Fighter Quarters, Trainer Room, Medbay; all 3 plots used)
| Building | Build / upgrade Gold | Prestige level needed | Effect per level |
| :--- | :--- | :--- | :--- |
| Fighter Quarters | 6 / 6 / 10 | 1 / 1 / 3 | Houses 2 / 3 / 4 fighters; decor cap per item = best Quarters level |
| Trainer Room | 8 / 10 / 16 / 26 / 40 | 1 / 2 / 3 / 4 / 5 | Trainer cap 3 / 5 / 8 / 13 / 21 points; each room trains one fighter a week |
| Medbay | 8 / 8 / 14 | 1 / 2 / 4 | 1 / 2 / 3 beds; Lv 2+ heals 2 weeks per week |
| Oracle *(one only)* | 8 / 12 | 2 / 3 | Odds shown as words → ~10% → exact; Lv 2 reveals the Boss debuff early |
| Liaison *(one only)* | 6 / 10 | 2 / 4 | Monthly convict (1 Gold, weaker, Flesh Wound) → POW (4 Gold, stronger, Concussed) |
| Entertainment Room *(one only)* | 8 / 12 | 2 / 3 | All fighters −15 / −30 Stress a week |

- Roster cap = total Quarters capacity, limited by the Prestige level's max fighters.
- *One only* buildings are capped because only the best one would count; a second would be a trap.

### Saves
- The career autosaves to the browser after every action. Reloading during a match counts as capitulating, so quitting can't undo a bad fight.

## v2 rules (supersede the career rules above where they differ)

All numbers live in `src/data.js`; balance is checked with `npm run check` (see `docs/roadmap-v2.md`).

### Arenas and Favor
- **Every arena you've reached holds a bout each tournament week.** You may send one fighter to each arena, and a fighter fights at most once a week. Your highest arena is your **top arena**: only its Bosses open new arenas, and only it must be resolved before the week can end.
- **Lower arenas** pay Prestige ×½ per tier below your top. Beating a conquered arena's Boss again gives no new Title. A **crushing win** (your fighter has 3+ more Power than the opponent) in a lower arena earns no Renown, costs −10 Morale and −2 Favor.
- **Imperial Favor** (0–100, start 50) replaces Strikes:

| Event | Favor |
| :--- | :---: |
| Win your top arena's Boss | +15 |
| Win an upset (opponent had more Power) | +5 |
| Win while at the Death Gate (2+ injuries) | +5 |
| Lose your top arena's Boss | −10 / −15 / −20 / −25 by tier (Grand −25) |
| Forfeit your top arena's Boss | loss −5 |
| Capitulate in your top arena (non-Boss) | −5 |
| Crushing win in a lower arena | −2 |
| Unpaid tribute | −25 |

- **At 0 Favor you are executed.** The top bar warns at 25.
- **Tribute:** 15 Gold × the year, paid automatically at the start of winter (warning in December). If you can't pay, you lose all your Gold and 25 Favor.
- **Rivals:** a top-arena Boss who beats you returns as that arena's next Boss at the arena's Boss Power +1 (never more, however often they win).
- **Scouted:** a fighter who fought in your top arena last tournament week faces +1 opponent Power there this week. Sitting out the top arena for one tournament week resets it. Lower arenas never scout.
- **Crushing wins and upsets** compare Power including gear (the number on the fighter card).
- **Championships:** a fighter becomes Champion of an arena by beating its Boss *or* winning 3 matches there (+1 Power; one Title per arena, never for the Grand Tournament).
- **Champions in lower arenas:** a Champion who fights back in a lower arena gets no Prestige and no Renown for a win, loses 10 Morale, and costs 3 Favor ("a champion picking on newcomers").
- **Rookies:** fighters under 5 Renown are never jeered for mismatches; only known fighters (5+ Renown) crushing a weak opponent by 3+ Power are.
- **Injuries go both ways every round:** whoever wins the round, both fighters roll to injure. The round loser is much easier to hurt (25% vs 10% at even Power).
- **Gentle start, tough finish:** the Dirt Pits Boss fights without an arena rule, and Tier 1 opponents are 6 / 6 / 7.
- **Challengers:** from the Silver Coliseum on, top-arena opponents gain +1 Power per 30 Renown of the fighter they face (max +2). Famous stars draw tougher opponents. Shown on the odds and in the fight.
- **Fights show real numbers:** each fight card shows the Power and Speed that side brings to the coming round, with everything applied (gear, Titles, items, injuries, Scouted, Challenger, arena rules). Odds labels say "Match:" because they're for the whole best-of-3, not one round.
- **Training never fails silently:** training can't be chosen when it can't happen (trainer cap reached, Discontented, Stress 50+, or Gold short for every trainee's fee), and the button says why. If it can't happen anyway when the week ends, it counts as a Rest week (−40 Stress); a fighter who becomes unable to train switches to Rest at the end of the week. Either way the card shows "Switched to Rest: …".
- **Calming decor:** each Bird or Fire Brazier in a fighter's quarters gives −5 Stress a week (Trophy Racks are Morale only).
- **Fight items** (Apothecary, in the Market): War Paint (+1 Power next round, 10 Gold), Adrenaline Draught (+3 Speed next round, +15 Stress after, 8), Blessed Bandage (−10% to be injured next round, not armor, 10), Crowd Bribe (no Favor or Renown lost for capitulating this fight; a Boss loss still counts, 12). Used before Round 1 or between rounds, one per fight (changed after playtest 3; it was after Round 1 only).
- **"Throw in the towel" is now "capitulate"** in all player-facing text.
- **Reloading mid-match** counts as capitulating, but keeps any injuries (or death) from rounds already played.
- **Revolt:** if the roster's average Morale stays below 20 for 4 weeks in a row, the career is lost.

### Fighter growth
- **XP:** win 3, loss 1, ×2 for Bosses, +2 for an upset win. Levels at 3 / 8 / 15 / 25 / 40 XP (max level 6).
- **Each level** offers 3 random perks; you must choose before the week can end or that fighter can fight:
  - Mighty (+1 Power) and Swift (+3 Speed), both repeatable
  - Thick Skin, Killer Instinct, Fast Starter, Closer, Iron Constitution, Crowd Pleaser
  - Survivor (needs Level 3)
  - Duelist (Power 9+, Speed 7+), Tactician (Speed 9+, Power 8+), Juggernaut (Power 12+)
- **Renown:** win +2, Boss win +3 more, upset +1, Crowd Pleaser +1, towel −1. Every 5 Renown adds +1 Gold to that fighter's winnings.
- **Morale** (0–100, start 60) drifts 10 a week toward 40 + 10×Quarters level + 5×decor items + 10×Entertainment level − 2×Renown (expectations capped at 60). Fights: win +10, loss −5, towel −5, ally death −10.

| Morale | State | Effect |
| :---: | :--- | :--- |
| 80+ | Inspired | +5% win chance |
| 20–39 | Discontented (was "Restless") | Won't train |
| Below 20 | Mutinous | Refuses to fight |

### Speed
- Speed training gives **+3 Speed** per training point (Power gives +1).
- **Evasion:** each point of Speed above the opponent's (after Spear, Prone, Riposte, Rainy Mud and gear) is **−4% chance to be injured, up to −20%**. It is not armor, so Gun and Flail don't ignore it.

### Storeroom and gear
- **Decor** (Bird 1 Gold, Fire Brazier 1, Trophy Rack 2) is bought into the house storeroom and placed in a fighter's quarters (up to the best Quarters level per item). Every item adds Morale comfort; Birds and Braziers also feed Ornitharius and Firebug.
- **Gear:** one weapon slot and one armor slot per fighter. Tier 1 gear costs 6 Gold, tier 2 costs 14–16 Gold, and items give +Power, +Speed, +injure chance or armor (see the Codex).
- **Armourer** building (one per estate; 10 / 16 Gold; Prestige level 2 / 3): 3 / 4 items stocked each month, tier 2 gear from level 2.
- **Loot:** your top arena's Boss always drops one of its gear items. Other wins drop gear 35% of the time if the opponent had any.
- A fallen or released fighter's decor and gear return to the storeroom.

### Opponents
- Opponents get one combat perk per tier above 1 (+1 for Bosses), a weapon from Tier 2, armor from Tier 3, and tier-2 gear in Tier 4.
- **Opponent Power** (T1 / T2 / Boss by tier):
  - Tier 1: 6 / 6 / 7 (the first Boss also has no arena rule)
  - Tier 2: 12 / 13 / 14 (v3: +3 after playtest #3 found the middle too easy)
  - Tier 3: 16 / 17 / 18 (v3: +3)
  - Tier 4: 21 / 22 / 23 (v3: +2 for a harder finish)
  - Grand Tournament: 26 (v3: +2)
- The Armourer and Liaison stock up the moment they are built.

### Playtest 3 additions (placeholders, tune after playtesting)
- **New kind traits:**
  - Human **Underdog**: +2 Power when the opponent has equal or more Power (compared before Underdog itself).
  - Orc **Unbreakable**: the Death Gate opens at 3 effective injuries instead of 2.
  - Orc **Bloodlust**: +1 Power once the opponent has an injury.
- **Survivor** perk (Level 3+): once injured, −10% chance to be injured; −20% at 2+ injuries (was −10% at 2+ only).
- **Bloodied Victory:** winning with 2+ effective injuries gives +5 Favor (the old "win at the Death Gate"), plus +2 Renown, +2 XP and +5 Morale.
- **Kill marks:** fighters keep a tally of opponents they kill. 3 kills: **Dreaded** (+5% win chance). 6 kills: **Reaper** (+5% chance to injure).
- **New decor:** Shrine of Mars (3 Gold; −10 Stress a week), War Banner (4 Gold; +1 Renown per win, per Banner).
- **Selling gear:** spare storeroom gear sells for half its price (rounded down).
- **Tribute:** can be paid early from the week panel. Unpaid tribute takes all your Gold and 25 Favor; it only ends the career if Favor reaches 0.
- **Auto-play** is per match: every fight starts paused.
- **The Dirt Pits never turn a house away:** if your Prestige is below a Dirt Pits buy-in, you pay what you have (even 0). A win pays its Prestige in full, so a career can't get stuck with no affordable fight. Other arenas still need the full buy-in.
- **Fight items** can also be used before Round 1 (they boost Round 1).

## v3 rules (roadmap v3)

### Phase A: tactics and the Four Humors
- **Tactics**, chosen before every round (opponents choose theirs at the same time, from their humor):
  - **Steady:** no change.
  - **Press:** +3% win chance and +5% chance to injure, but +7.5% chance to be injured (was +10%; cut in the v3 tuning pass).
  - **Guard:** −15% chance to be injured, −5% win chance.
  - **Feint:** +10% win chance, only if you strike first that round (so it rewards Speed).
  - **Counters:** Press beats Feint, Feint beats Guard, Guard beats Press. The side whose tactic counters the other's gets **+10% win chance** that round.
- **Four Humors:** every fighter has one (fighters from older saves get one from their name, so it never changes).
  - **Choleric:** +1 Power in Round 1, −1 Power in Round 3. Picks Press 70%, Feint 15%, Guard 15%.
  - **Sanguine:** +3 Speed in Round 1. Picks Feint 70%, Press 15%, Guard 15%.
  - **Melancholic:** −5% chance to be injured every round; +1 Power in Round 3. Picks Guard 70%, Press 15%, Feint 15%.
  - **Phlegmatic:** +5% win chance in Rounds 2 and 3. Guards first (70%); from Round 2 counters the tactic you used last round 70% of the time (unless you held Steady).
- **Suggested tactic** (the ★, and what auto-play and the careful bot use): Guard at the Death Gate. Otherwise the tactic with the best expected value: ±10% for each likely counter, the tactic's own effects (wound chances at half weight), Feint's bonus times the chance to strike first, and any festival bonus. Against an opponent with no humor, the festival's favoured tactic or Steady. (Playtest #3: humor tells held only about half the time, so each humor's favourite went up from 50–60% to 70%.)
- **Gates:** reading the opponent beats always-Steady by 3–15 points a match (measured: +7) and beats always-Press (measured: +4). Press was +5% win at first; always-Press came within 2 points of reading, so it was cut to +3%. Feint was +3 Speed at first; that erased trained Speed's value (a balanced build was best vs 0 of 4 Bosses), so it became the first-strike bonus.

### Phase B: a world that moves
- **Weekly events** (`src/events.js`): after each week, a 30% chance (20% in winter) of an event card, never the same one twice in a row. The week can't end until you choose. 12 events (brawl, senator's offer, fever, wandering lanista, gifts from fans, escaped beast, merchant caravan, omen, revelry, spy, stray dog, sparring). Some choices cost Gold (they're disabled, with the reason, if you can't pay); some are a gamble. Seeded on their own stream. Measured: events move the careful win rate by −2.7 points (limit ±5).
- **Gods' Days:** festival tournaments (the month's tournament week):
  - **Floralia** (Maius): wins pay +50% Gold.
  - **Ludi Apollinares** (Quintilis): ranged fighters (Sagittarius, Bow, Gun, Spear) +1 Power.
  - **Ludi Romani** (September): wins pay +50% Prestige.
  - **Armilustrium** (Mars, October): Press gives +5% win chance, and wins +1 Renown. (Moved from Martius so a career's first tournament is plain.)
  - **Ludi Plebeii** (Fortuna, November): upset wins pay double Gold and double Favor.
  - **Saturnalia** (December): no buy-ins.
- **Rival houses:** three per career, seeded on their own stream. Every opponent fights for one (the Grand Tournament's champion for the leading rival).
  - **Glory** ranks the houses: a win is worth its arena tier (×3 for a Boss, 20 for the Grand Tournament). When you beat a house's fighter it loses 1 Glory; when its fighter beats you it gains the same as you would have.
  - After each tournament week every rival wins a bout half the time (+its tier in Glory) and climbs a tier at 8, 20 and 40 Glory.
  - **Feuds:** kill a house's fighter and its fighters get **+1 Power** against you for 3 tournament weeks. **Vengeance:** lose a fighter to a house and yours get **+5% win chance** against it for 3 tournament weeks.

### Phase C: fighter stories
- **Scars:** surviving a severe wound (Concussed or worse) has a 50% chance to leave one, against the style (melee or ranged) of the fighter who caused it, at most one per style. Choleric fighters become Enraged, Melancholic ones Afeared, others 50/50.
  - **Afeared:** −1 Power, −10% chance to injure, −10% chance to be injured against that style.
  - **Enraged:** +1 Power, +15% chance to injure, +15% chance to be injured against that style.
  - **Battle-Hardened** (first Bloodied Victory): −5% chance to be injured.
- **Cyborg surgery** (Medbay Lv 2+): replace a Maimed limb (Cyborg Arm: +1 Power) or a Blinded eye (Cyborg Eye: +1 Power, can't be Blinded again; that wound lands as a Flesh Wound). Costs 10 Gold + 4 per tier above 1, and −1 Renown (cut after playtest #3: it was never worth it).
- **Chronicle:** each fighter keeps up to 12 story lines (joined, first win, first kill, titles, marks, scars, augments, death). A death adds a eulogy to the report.
- **Retirement:** a fighter at level 4+ or with a Title can retire: +5 Prestige, +10 Morale to the roster, and they join the Hall of Champions (kept across careers).

### Phase D: a run, not just a career
- **Score:** Glory + 25 per arena tier above 1 + 10 per House level above 1 + 2 per win; a won career adds 200 plus its decrees' bonus.
- **Achievements** (kept across careers, `src/legacy.js`): First Blood (beat a Boss: patron The Old Veteran), Into the Bronze (Thorn-Blade class), Blood and Sand (a Bloodied Victory: patron A Friend at Court), A Rising House (Silver: patron A Merchant's Purse), Dreaded (a kill mark: patron The War Chest), The Gods' Favourite (win on a Gods' Day), First Among Houses (top the standings: patron A Defector), Imperial Ambitions (Imperial: Samnite class), Master of the Games (win: the Emperor's Decrees).
- **Patrons:** The Old Veteran (a level-3 fighter, +2 Power, +3 Speed, two perks), A Friend at Court (+15 Favor), A Merchant's Purse (+10 Gold), The War Chest (2 War Paint, 1 Blessed Bandage), A Defector (a +3 Power fighter).
- **Emperor's Decrees:** Iron Bosses (every Boss +1 Power; +30 score), A Greedy Emperor (tribute ×1.5; +20), Harsh Judges (Boss losses and forfeits −5 Favor more; +20).
- **Legacy classes:** **Thorn-Blade** (winning a round: opponent −2 Speed and −1 Power next round) and **Samnite** (20% shield parry; Concussed doesn't cost the first strike) join the market and opponents once unlocked.

### Phase F: look and sound
- Portraits are generated SVG (kind, humor expression, class gear, laurel for titles, wounds), from a hash of the name: cosmetic, never the game RNG.
- Sound is synthesized (Web Audio), on by default with a mute toggle in the top bar.
- Save files hold the career, the Codex and the Legacy.

### Saves
- Save format version 3. Version-2 careers are upgraded on load: Favor = 50 − 15 per Strike, the old circuit becomes the top arena, and earlier arenas count as conquered. The Codex is stored separately and is never touched by career saves.

### Still deferred
Four Humors, Cowardly/Afeared/Enraged traumas, Gods' Days and the Temple, blind auctions and rival houses, Oracle fog of war on opponent traits (opponent cards are always shown in full), cyborg surgery, save export/import.
