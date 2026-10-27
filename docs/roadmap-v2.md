# Roadmap v2 — Fighters You Care About, A World That Pushes Back

v1 (tag `v1.0`, playable at `/v1/`) proved the career loop: weekly jobs, the estate, four tiers and the Grand Tournament. v2 acts on the first full playthrough's feedback (2026-10-26). Each phase ships on its own and is re-tuned with `npm run career` before it goes live.

---

## Playtest feedback → plan

| Feedback | Plan | Phase |
| :--- | :--- | :---: |
| "Slave market" wording; awkward "Orcs are sturdy" tip | Renamed to Market; tip simplified | ✅ done |
| More tutorial and exposition: how you win and fail, what Power is | Intro story, then a guided first month that explains each step as it happens | A |
| Glossary that unlocks as you encounter things; define Orc, Sagittarius, etc. | **Codex** tab: rules entries unlock on first encounter (free); deeper lore unlocks by defeating that kind/class. Persists across careers. | A |
| Unclear what decor does | Every decor button says what it does for *this* fighter, or that it does nothing; in B, all decor also feeds Morale | A → B |
| Wins should give fighters bonuses | **XP and levels:** each level-up offers a choice of 3 perks | B |
| Fighter Morale and Renown; better rooms → better Morale; fame raises expectations | **Renown** grows with wins; **Morale** = comfort (decor, Quarters, Entertainment) vs expectations (Renown) | B |
| Pass decor/items between fighters (especially from the dead); own inventory; Armourer | **House inventory:** decor and gear belong to the house and are assigned to fighters; returned on death. **Armourer** building sells/crafts gear; beaten opponents sometimes drop theirs. | B |
| Fight in lower divisions, several fights at once | **Multi-arena tournament weeks:** one fighter per unlocked arena each tournament week; easy wins in lower arenas earn less and anger the crowd | C |
| Harder game, enemies too | Opponents gain levels, perks, gear and Titles by tier; named rival champions recur | C |
| A failure metric other than three losses | **Imperial Favor** meter (0 = executed) plus a **yearly tribute** due each winter | C |
| Is a balanced fighter ever right? | Today: barely (see below). Give Speed its own job: **evasion** | B |

---

## Is a balanced fighter ever better? (analysis, 2026-10-26)

Measured with the real engine (`estimateOdds`, 6,000 fights per row) against each Boss, splitting the Trainer's points between Power (+1 each) and Speed (+2 each):

| Split | Tier 2 Boss (5 pts) win / injured | Tier 3 Boss (8 pts) | Tier 4 Boss (13 pts) |
| :--- | :--- | :--- | :--- |
| All Power | 49% / 41% | 56% / 46% | **87%** / 33% |
| 1–2 points Speed | 50% / **36%** | 54% / **35%** | 66–74% / 41% |
| Half and half | 47% / 48% | 48% / 47% | 48% / 47% |
| All Speed | 14% / 77% | 4% / 94% | 3% / 99% |

**What it shows:**
- A little Speed (enough to match the opponent) costs nothing in wins and slightly lowers injuries at Tiers 2–3. That's the only case for a mix.
- Beyond that, **Speed is dead weight.** It only decides who strikes first, and once you reliably do, more adds nothing.
- By Tier 4, all-Power wins outright. Power and Speed do the same job (win rounds); Speed is just the weaker version.

**Fix (Phase B): give each stat its own role.**
- **Power wins rounds.** No change.
- **Speed keeps you alive (new):** *Evasion*. Each point of Speed above the opponent's lowers your chance to be injured by 3% (up to −15%). Being slower gives no penalty beyond striking second.
- Result:
  - all-Power fighters win but bleed injuries, which means Medbay weeks, Death Gate risk and Morale loss
  - all-Speed fighters survive but lose
  - a **balanced fighter wins and stays healthy**
- Perks (Phase B) reinforce this with a few that need both stats ("Duelist: needs Power 10 and Speed 10").

**Success test (simulator):** against at least two of the four Bosses, the best split puts 25–60% of points into Speed. All-Power wins the most rounds but loses noticeably more fighters per career.

---

## Phase A — Clarity: tutorial, Codex, decor (start now)

### A1. Intro and guided first month
- **New career intro**, 4 short pages, skippable:
  1. You've been pulled into Battleworld and handed a failing Ludus.
  2. **How you win:** climb four arenas and win the Grand Tournament.
  3. **How you lose:** three Imperial Strikes (Boss losses), or no fighters and no Gold. *(Changes to Imperial Favor in Phase C.)*
  4. Power, Speed and the Death Gate in one picture.
- **Guided tutorial:** a step card that explains *what is happening right now*:
  - recruit → set jobs → end the week → fight day and odds → Round 1 (Delta and First Strike)
  - between rounds (the towel) → after the match (rewards and injuries) → Medbay → first level-up of the house → first Boss
- Each step has Next / Skip tutorial, and "Replay tutorial" lives in How to play.
- The fight screen gets its own tutorial callouts, since that's where the most new ideas land.

### A2. Codex (unlockable glossary)
- New **Codex** tab with sections:
  - Basics (always open)
  - Kinds, Kind traits, Classes, Weapons, Injuries
  - Arena rules (Boss debuffs), Buildings
- **Rules entry:** unlocks the first time you see the thing (market, roster, opponent, injury, debuff, building). Free, because players need rules to make decisions.
- **Lore entry:** unlocks when you *defeat* a fighter of that Kind or Class.
- Locked entries show "???" with a hint ("Meet one in the arena").
- Progress shown as "23/41 discovered". New entries are flagged in the tab.
- Persists across careers (`localStorage`), so knowledge carries over.
- Pure module `src/codex.js` + tests.

### A3. Decor clarity
- Each decor button states its effect for *this* fighter ("+Bird: Birds of Prey gets +5% injure chance"), or shows "No decor helps this fighter yet."
- Opponent decor shows the same explanation on hover.

---

## Phase B — Fighters you care about

### B1. XP, levels and perks
- XP per match: win 3, loss 1, Boss ×2; more for beating a stronger opponent.
- Levels at 3 / 8 / 15 / 25 / 40 XP. On level-up, **pick 1 of 3 perks**:
  - stat perks (+1 Power, +2 Speed)
  - survival perks (Thick Skin: −5% injury chance)
  - morale perks
  - combo perks needing both stats (Duelist, Brute, Showman)
- Fighters stay distinct and growing even after the Trainer cap.

### B2. Speed as evasion
- As above, gated by the simulator test.

### B3. Renown and Morale
- **Renown** (fame), per fighter: + per win, more for upsets and Bosses; − for towels and losses to weaker opponents. Renown raises Prestige and Gold earned (Star Power, from the design doc).
- **Morale** (0–100), per fighter, drifts weekly toward **Comfort − Expectations**:
  - Comfort = Quarters level + decor items + Entertainment Room.
  - Expectations grow with Renown: a famous fighter wants a better room.
- Effects:
  - Inspired (80+): +5% win chance.
  - Restless (<40): no training gains.
  - Mutinous (<20): may refuse to fight and could desert.
- Shown as one readable status with the reason ("Restless: wants a better room").

### B4. House inventory, gear and the Armourer
- Decor and gear move to a **house inventory**; assign or unassign freely between weeks. A dead fighter's items return to the inventory.
- **Gear:** 2 slots (weapon, armor). Small, readable effects (+1 Power, −5% injury chance, +1 Speed, a tag such as Spiked: +5% injure).
- **Armourer building** (Prestige level 2):
  - sells a rotating stock monthly
  - level 2 lets you upgrade gear
- Beaten opponents sometimes drop an item ("claim equipment from the defeated foe", design doc Tab 4).

---

## Phase C — A bigger world that pushes back

### C1. Multi-arena tournament weeks
- On tournament week, **every arena you've unlocked** holds a bout at its current stage. Send **at most one fighter per arena**, so several fight the same week, each match played in turn.
- **Fighting below your top tier:**
  - lower Prestige (−50% per tier below)
  - no Renown if your fighter is far stronger
  - Morale −10 ("the crowd jeers")
- Imperial Strikes and Favor losses come only from your **top** tier.
- This gives the whole roster jobs, and it directly counters the one-star strategy the v1 simulator found dominant.

### C2. Tougher opponents
- Opponents by tier get levels, perks, gear and Titles.
- **Named rival champions** recur across the career and remember you.
- Boss rules that punish a lone star (e.g. "Crowd wants blood: −10 Morale if you towel").

### C3. Imperial Favor and tribute (replaces three Strikes)
- **Imperial Favor (0–100, start 50).**
  - Down: Boss losses −20, forfeits −25, easy wins in low arenas −2, towels in the top tier −5.
  - Up: Boss wins +15, upsets +5, spectacle (a win at the Death Gate) +5.
  - **0 = execution.** A warning shows at 25.
- **Yearly tribute** due at the start of winter, rising each year. Unpaid tribute costs Favor.
- House-wide revolt (average Morale < 20 for a month) is a third failure path, introduced last.

### C4. Re-tune
- New bot behaviors (multi-arena, perks, gear).
- Targets:
  - careful bot ≥ reckless bot in career wins, and clearly fewer deaths
  - careful career win rate 30–45% (harder than v1's 33–47% spread)
  - 1–3 fighter deaths per career for reckless play

---

## Order of work
A1 → A2 → A3 (ship) → B2 + B1 (ship, re-tune) → B3 → B4 (ship) → C1 → C3 → C2 (ship, full re-tune).
