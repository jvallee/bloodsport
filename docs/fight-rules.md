# Bloodsport — Fight Rules (Web MVP)

Combat follows Tab 4 and Tab 6 of the design doc: the Power Delta table, the 5-step round order (4A → 4B → 4C), and the Escalating Injury Table with the 2-Injury Death Gate.

## Placeholder decisions (tune after playtesting)

These are not from the design doc. They exist so the MVP can be built now. Items marked **(amended)** differ from the first draft of these placeholders; the reason is given inline.

### 1. Match win — (amended)
- Best of 3: the match ends as soon as one fighter wins 2 rounds.
- A fighter who dies loses the match immediately. Throwing in the towel is a loss.
- The towel prompt appears after Round 1, and after Round 2 only when the score is 1–1.
- *Why amended:* if all 3 rounds are always played, a fighter leading 2–0 must fight a round that can only hurt them, and throwing in the towel would forfeit a match already won. Round 3 traits (Cestus +15%, Melancholic, Phlegmatic) still matter in every 1–1 decider.

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
- The career autosaves to the browser after every action. Reloading during a match counts as throwing in the towel, so quitting can't undo a bad fight.

### Still deferred
Four Humors, Cowardly/Afeared/Enraged traumas, Gods' Days and the Temple, blind auctions and rival houses, Oracle fog of war on opponent traits (opponent cards are always shown in full), cyborg surgery, Morale, fighter XP, save export/import.
