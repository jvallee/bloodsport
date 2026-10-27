# Roadmap — From MVP Toward the Final Game

**Status (2026-10-26):** M5–M8 are built and live (frozen as v1.0, playable at `/v1/`). Next steps are in `docs/roadmap-v2.md`, which supersedes M9–M11 below. See "Balance snapshot" for where the tuning stands.

The MVP (`docs/implementation-plan.md`) proves the fight engine. This plan adds the **Ludus buildings**, **progression** across a full career, and the work needed to keep the game **fun and easy to understand** as it grows.

Each milestone is playable on its own and ships to GitHub Pages when it's done. Numbers marked *placeholder* are starting points for the simulator and playtests to tune.

---

## 1. Honest look at the MVP: what's fun, what isn't

| Area | Today | Problem |
| :--- | :--- | :--- |
| Decisions between fights | Recruit, train, decorate, heal: all instant | Nothing pushes back. You spend Gold and fight. Few interesting trade-offs. |
| Injuries | Healed instantly for 2 Gold | Injuries rarely matter beyond the fight they happen in, so the roster never has to rotate. |
| Roster | 3 slots, but only one fighter is ever needed | Backups have no job unless your star dies. |
| Odds | Shown only once a round starts | You commit to a fight without knowing how risky it is. |
| Run length | 3 matches (~5 minutes) | There's no arc and nothing to build toward. |
| Cards | Long trait descriptions | Hard to scan. A new player can't tell which numbers matter. |
| Fight feed | Every roll shown as a percentage | Accurate, but dense. The drama gets lost in the math. |

**Core fix:** add **time**. When injuries take weeks to heal and training takes weeks to pay off, the roster, the Medbay and scheduling all become real decisions. Buildings and progression then hang off that calendar.

---

## 2. Design principles for "fun and easy to understand"

1. **Show the odds before every commitment.** Before you send a fighter, show win chance, injury risk and death risk in plain words ("Likely win · Low risk"). Exact numbers go one click deeper.
2. **One new idea at a time.** Prestige levels act as the tutorial: each level unlocks one or two buildings, each with a short "what's new" card.
3. **Drama first, math on demand.** The fight feed tells a story ("Livia lands a brutal blow; Varro is Poisoned!"). A "Show the math" toggle reveals the rolls. The "Why you won/lost" table stays.
4. **Every number has a reason you can see.** Hovering or tapping any stat shows where it comes from (Power 7 = base 5 + 2 training).
5. **Consistent symbols.** One icon and color each for Power, Speed, Gold, Prestige, injury and death gate, used everywhere.
6. **Meaningful choices every week.** Each calendar week, each fighter has one job: train, rest, heal or fight. Doing well should feel like good planning, not grinding.
7. **Losses teach.** After a defeat, suggest one concrete fix ("Their Gun ignored your armor; a Sword parry would have helped").
8. **Comebacks exist.** Liaison convicts, Blood Faith and cheap healing keep a bad week from ending a run with no recourse.

---

## 3. Milestones

### M5 — Clarity pass (small; do first)
Improve what exists before adding systems.
- **Pre-fight odds preview:** run the real engine 2,000 times against the opponent and show the results as "Win ~62% · Injury risk High · Death risk 0%". (Later, the Oracle gates how exact this is.)
- **Compact cards:** an icon row for Power, Speed and the death gate; traits as one-line keywords with full text on hover or tap; a different border per Kind.
- **Story-first fight feed** with a "Show the math" toggle; an **Auto-play** button, with auto-pause at the towel decision when the fighter is in Mortal Danger.
- **Coach tips on the first run:** 5–6 dismissible hints (recruit, train, send, towel, Medbay), remembered in `localStorage`.
- **Post-loss advice line** based on the round records (biggest negative modifier, Delta, injury that swung it).
- **Glossary** panel (Delta, Death Gate, Armor, Prestige).
- *Done when:* a new player completes a run without reading the rules, and can say in one sentence why they lost.

### M6 — Calendar and time (the backbone)
- **Weeks, not days.** Each of the 10 Roman months has 4 weeks (40 weeks a year, then the Winter Dead Season). Days are too fine-grained to be fun; weeks keep the *Princess Maker* scheduling feel with fewer clicks. *This changes the design doc; see Decisions.*
- **Weekly scheduling:** each fighter gets one assignment per week: **Train** (stat gain, +Stress), **Rest** (−Stress), **Medbay** (heals over time), or **Fight** (on tournament weeks).
- **Stress and tapering** (design doc Tab 7): entering a fight with Stress ≥ 50 applies Distracted. Rest the week before a fight to taper.
- **Injuries heal over time:** Distracted 1 week, Flesh Wound 1, Concussed 2, Blinded/Maimed 3, Poisoned 2 *(placeholders, scaled down from the doc's days)*. Medbay level speeds this up. Instant healing goes away, or becomes an expensive emergency option.
- **Tournament weeks** are fixed on the calendar. You choose who fights (or **skip** Tournaments 1 and 2 for a reward, as in the design doc).
- **Calendar screen:** a month grid with a row of assignments per fighter and an advisor warning box ("Brutus's stress is rising…"), as in the *Princess Maker 2* reference.
- New module `src/calendar.js` (pure) plus tests.
- *Done when:* injuries force you to rotate fighters, and a simulated bot with only one fighter does clearly worse than one with three.

### M7 — Ludus buildings and estate layout
- **Estate screen:** a cross-section of the villa, a CSS grid of **room plots** grouped into the four departments from the design doc (Housing, Training, Medical, Scouting & Faith).
  - Empty plots show **"Build here"**. Built rooms show level pips, what the room does now, and what the next upgrade adds.
  - The number of plots follows the Fibonacci room caps: **3 → 5 → 8 → 13 → 21** by Prestige level.
- **MVP buildings and effects** *(placeholder costs)*:

| Building | Unlock | Levels | Effect |
| :--- | :---: | :---: | :--- |
| Fighter Quarters | P1 | 1–3 | Houses 2 fighters; decor slots per level (Bird, Fire Brazier, Trophy) |
| Trainer Room | P1 | 1–5 | Lets 1 fighter train per week; trainer level sets the stat cap (3 / 5 / 8 / 13 / 21 total points) |
| Medbay | P1 | 1–3 | Heals 1 / 2 / 3 fighters at a time; Lv 2+ heals faster; Lv 2–3 unlock cyborg surgery (later milestone) |
| Oracle | P2 | 1–2 | Lv 1 shows opponent odds brackets; Lv 2 shows exact odds and the next Boss debuff |
| Liaison | P2 | 1–2 | Lv 1 sells 1 Gold convicts; Lv 2 sells elite POWs with trauma |
| Entertainment Room | P3 | 1–2 | −Stress house-wide each week |
| Temple | P2 | 1–2 | Holiday blessings (with M10) |

- **Building is a decision, not a checklist:** plots are limited, so building a Medbay can mean no second Trainer Room. Building and upgrading take Gold, and upgrades need a Prestige level.
- Roster cap ties to Quarters (2 fighters per Quarters) instead of a flat 3.
- New module `src/ludus.js` (pure) plus tests. UI split into `src/ui/` views (estate, roster, calendar, fight) as `main.js` passes ~300 lines.
- *Done when:* two playtesters build noticeably different estates and can explain why.

### M8 — Progression: Prestige levels, arena tiers, careers
- **Career structure** (Balatro model, design doc Tab 2):
  - Spring → Tier 1 circuit, Summer → Tier 2, Autumn → Tier 3, then the Winter Dead Season (big building projects, surgery).
  - Year 2 Spring → Tier 4, then the **Grand Tournament**. Beating it wins the career (~13 matches, roughly 60–90 minutes).
  - Each circuit is Tournament 1 → Tournament 2 → **Boss** with a debuff drawn from a pool. Losing the Boss repeats the circuit at a Prestige cost instead of ending the run outright *(placeholder)*.
- **Prestige levels 1–5:** reached at 10 / 25 / 50 / 100 Prestige *(placeholder)*. A level, once reached, is never lost, so buy-ins can't de-level you. Each level unlocks buildings, room plots and roster size as in the design doc's Tab 7.
- **Fighter careers:**
  - XP from fights; levels raise the personal stat cap.
  - At Trainer Lv 3, a fighter gains a **second class or trait slot** (build-craft).
  - **Titles** from Boss wins ("Champion of the Dirt Pits": +1 Star Power, more Prestige per win).
- **Boss debuff pool (6–8):** First Injury Counts Double, Rainy Mud (−2 Speed), No Armor, Blood Moon (+10% injury both sides), Crowd Favorite (towel costs double), Iron Rules (no decor bonuses).
- **Stronger opponents at higher tiers:** more Power, more traits, decor, and sometimes injuries.
- **Save and load** (`localStorage` autosave each week plus export/import) becomes essential here, since runs reach an hour.
- *Done when:* a simulated "sensible" bot wins about 30–50% of careers, and a career takes 45–90 minutes.

### M9 — Talent market and rival houses
- **Static blind bidding** (design doc's default mode): 4–6 lots a month, sorted by hidden Desirability, against 2–3 rival houses with personalities (thrifty, reckless, collector).
- Liaison convicts and POWs as a second pipeline.
- Rival houses also appear as named opponents, which gives a sense of a living world.

### M10 — Depth: Humors, traumas, holidays
- Four Humors (pacing curves across the 3 rounds), Afeared/Enraged/Cowardly traumas, Gods' Days with Star Power multipliers and Temple blessings, and cyborg surgery in the Medbay.
- Each one is added only if the simulator and playtests show it adds decisions without making things murky.

### M11 — Presentation polish
- Layered portraits (Kind base + class overlay + injury overlay), as planned in the design doc.
- Audio stingers, card flip and screen-shake tuning, a settings menu (speed, sound, reduced motion).
- Season digests in the *King of Dragon Pass* style ("Last spring, House Vallee…").

---

## 4. Keeping it fun: how we'll check

- **Whole-career bots in `scripts/simulate.js`:** a *sensible* bot (rests before fights, heals, rotates) and a *greedy* bot (always fights the best fighter). Targets:
  - the sensible bot clearly beats the greedy one
  - the sensible bot wins 30–50% of careers
  - 1–3 fighter deaths per career (death should be dramatic, not constant)
  - no softlocks (always a legal move or a clear loss)
- **Run-level invariant tests:** across 200 seeds, a run always ends, Gold and Prestige never go negative, and a fighter is never in two places in the same week.
- **A 5-minute playtest script per milestone,** run with someone new:
  - Did they understand what to do next without help?
  - Could they explain one loss?
  - Did they make at least one choice they had to think about?
  - Did they want to play again?

---

## 5. Technical notes
- New pure modules: `calendar.js`, `ludus.js`, `progression.js`, `market.js`. The fight engine stays as is; new effects plug in as modifiers.
- `run.js` becomes a thin coordinator. Run state gets a `version` field for save migrations.
- The UI moves into `src/ui/*.js` views with a small shared `components.js` (card, button, tooltip).
- Icons: inline SVG. *Note:* game-icons.net is **CC BY 3.0** (attribution required), not CC0 as the design doc says, so we'd add a credits page.
- Each milestone updates `docs/fight-rules.md` (rules and placeholders) and adds tests before UI.

## 6. Decisions (made 2026-10-26)

1. **Calendar unit: weeks.** Each week is one meaningful decision per fighter. Days would mean many clicks with nothing changing, a classic pacing trap in management games. Assignments persist from week to week, and a **"Skip to tournament"** button covers quiet stretches, so time costs clicks only when something can happen. Roman months stay as labels (4 weeks each, 10 months), followed by a 4-week **Winter Dead Season** with no tournaments.
2. **Career length: 4 tiers + Grand Tournament.** A long arc gives buildings and progression time to matter. To keep it from dragging, there's one tournament every 4 active weeks (≈13 tournaments, ~50 weeks), skip-to-tournament, and autosave so a career can be played across sessions.
3. **Losing a Boss: a Strike, then the circuit repeats.** Losing an hour of play to one unlucky roll feels unfair, but a loss with no consequence feels pointless. A Boss loss gives an **Imperial Strike**, costs the buy-in, and restarts that tier's circuit against new opponents and a new debuff. **Three Strikes and you're executed** (the design doc's "fall behind and you're executed"). Losing hurts and the stakes build, but there's always a way back.
4. **Estate look: villa cross-section grid.** Seeing rooms as places, not rows, is what makes management games feel like *yours* (Darkest Dungeon's Hamlet, Book of Hours). Plots are a limited, visible resource, so each build choice is a real trade-off.
5. **Instant healing: kept, as an expensive Emergency Surgeon (5 Gold per injury).** Removing it entirely would cost the player a choice, and choices are what make a strategy game fun. At 5 Gold it's a deliberate trade between Gold and time, not the default. The Medbay (free, takes weeks) is the normal way to heal.
6. **Cestus: nerfed now to +3/6/9% win chance** (injure bonus stays +5/10/15%). It led every Kind by a wide margin, and a dominant pick narrows the choices players feel they have. The change gets re-checked with the simulator.

Detailed placeholder numbers for M5–M8 live in `docs/fight-rules.md` ("Career rules").

## Balance snapshot (2026-10-26, after M5–M8)

`npm run career 300` (whole careers by bots) and `npm run simulate 2000`:

| Bot | Career wins | Reach the Grand Tournament | Fighter deaths per career | Strikes per career | Weeks |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Careful (rests, heals, builds, towels, skips bad matchups) | 33% | 51% | 0.14 | 2.6 | 69 |
| Reckless (trains one star nonstop, Surgeon only, never towels) | 47% | 55% | 1.01 | 2.0 | 63 |

What the simulator caught, and what changed as a result:
1. **Stress didn't matter** (losing one ability was a weak penalty), so nonstop training was strictly best. Overtrained fighters now can't train and fight at −1 Power; rest went to −40.
2. **Speed was a trap** (+1 Power ≈ +2 Speed). Added First Strike (+10% win chance), made Speed train at +2, and gave opponents more Speed at higher tiers.
3. **Buildings were a trap:** Gold was too scarce, and duplicate Oracles/Liaisons/Entertainment Rooms silently did nothing. Purses were roughly doubled, those three became one per estate, and Entertainment and Medbay Lv 2 unlock earlier.
4. **Death wasn't scary enough** (about 5% per round at the Death Gate), so throwing in the towel was usually wrong. Injury rolls now add +20 per prior injury, and the Surgeon costs 8 Gold +4 per tier.
5. **The finale was an anticlimax** (a capped fighter beat the Tier 4 Boss 91% of the time). Raised Tier 4 and the Grand Tournament.

Still open (next tuning pass):
- **The reckless style still wins more often**, though it pays in fighters and has the only total wipeouts. Careful play should edge ahead. Candidates: more injury carry-over into the next fight, Boss debuffs that punish a single overtrained star, or making Titles transferable to the house.
- **Power is king.** Bots that never train Speed still do as well or better; Speed's value levels off.
- **Bots don't value the Oracle or Liaison** (they read exact odds and don't need cheap recruits). Their value to human players needs playtesting.
