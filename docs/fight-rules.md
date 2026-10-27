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

### Deferred from MVP
Four Humors, Cowardly/Afeared/Enraged, Prestige levels, calendar and holidays, auctions beyond fixed price, Oracle fog of war (all opponent info is shown), buildings beyond Trainer/Medbay/decor, cyborgism, Morale.
