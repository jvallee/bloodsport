# Blood and Circus 6: "one more career" (design and plan)

The designer's brief (2026-11-09): make version 6 **incredibly addictive and fun to play**; change whatever that takes.
5.4.3 stays playable at `/v5/`. Version 6 is built on `main`, in phases that each ship working.

## 1. Why 5.4 isn't yet "one more run"

From eleven LLM playtests, the designer's own notes and the balance bots:

1. **A career is a long, all-or-nothing commitment.** About 118 weeks, a few hours. Losing at week 90 throws all of it away, so
   losing feels like punishment instead of "again, smarter".
2. **Too many dead turns.** Three of every four weeks are "End week" with jobs already set. Walls (Bronze, then Silver) turn
   into months of the same loop. LLM-11: "after the first three months the steward's tasks just restate the main goal".
3. **Little carries over.** Legacy achievements unlock a few patrons and classes, but most careers end with nothing new.
4. **Fights are mostly arithmetic.** The tactic pick matters (+8 points), but the drama (comebacks, the Death Gate, the crowd)
   is told in text rather than felt.
5. **Choices are rarely exciting.** Most turns offer "train or rest"; the Market is the same few fighters; there's no chase for a
   build that breaks the game in a fun way.
6. **Reading load.** The writing is good; the amount on screen at once is not (a phone playtester, LLM-11's 13-line week).

## 2. The six pillars

| Pillar | What a player should feel | Main levers |
|---|---|---|
| **A. Pace** | Something happens every click | The month is the turn; no dead weeks; careers of ~40–60 minutes |
| **B. Choices** | "Ooh, which one?" every month | A monthly Fortune draft (pick 1 of 3); relics; rarer, better fighters |
| **C. Builds** | "This combo is broken, I love it" | Relics with synergies; perk tags; legendary fighters |
| **D. Fights** | Tension, then a roar | Crowd and momentum meter, telegraphed intent, clutch choices, juice |
| **E. Carry-over** | "I lost, but I unlocked X. Again." | Legacy XP after every career; an unlock tree; Heat levels; Hall of Legends |
| **F. Feel** | Smooth, readable, satisfying | Animation and sound on wins, kills and titles; less text; phone-first fight day |

## 3. The changes

### A. Pace: the month is the turn
- **One turn = one month.** You set jobs, shop, build and decide events, then press **Fight day**. The three training weeks run
  on their own and the month's results land as a short digest ("Torq +3 Power, Gratia healed, Stress …").
  Weekly granularity stays inside the rules (training, healing, Stress), so the systems don't change, only the clicks.
- **Weekly events become one monthly event**, decided in the planning phase.
- **Shorter careers by default:** each arena runs Tournament → Tournament → Boss once (the short career's shape) but with the
  full career's economy tuned to it. Target: about 15 months to a win, about 40–60 minutes of play. The 5.x long career stays as
  an option ("The Long Road") for players who want it.
- **Auto-plan:** a "same as last month" default, and the steward suggests jobs (rest the tired, heal the hurt, train the rest).

### B. Choices: the Fortune draft
- **Every month, pick one of three Fortune cards**, rarities common / rare / legendary:
  - a fighter (sometimes a legendary one with a unique trait);
  - a piece of gear;
  - a **relic** (below);
  - a one-off boon (a free Trainer week for everyone, a Surgeon's visit, 10 Gold, a crowd favour);
  - a gamble (double-or-nothing on the next fight).
- **Rerolls cost Gold.** The cards' pool grows with unlocks (pillar E).

### C. Builds: relics and synergies
- **Relics are house-wide passive items** (the house's trophies and secrets), at most 6 at once. Examples:
  - *The Butcher's Hook*: kills at the crowd's demand pay double Renown.
  - *Mars's Whetstone*: the first win each fight day gives +1 Power next month.
  - *A Bribed Referee*: one capitulation a career costs no Favour.
  - *Nets of Nemi*: Retiarii start every fight with the opponent Netted.
- **Perk tags** (Bloodthirsty, Guarded, Showman, Swift…) so relics and perks combine: "every Showman perk adds +5% hype".
- **Legendary fighters** (about 1 in 20 draft fighters) with a unique trait and a story.

### D. Fights: tension and release
- **A crowd meter** that fills on hits, upsets and press, and drains on caution. Full: the crowd's favour (+1 Power next round,
  bonus Renown). It makes Press vs Guard a visible gamble.
- **The opponent's intent**, shown a round ahead when you have an Oracle (or a relic). Reading the opponent becomes a skill.
- **Clutch moments**: at the Death Gate, a last-ditch choice (an all-in strike with a death risk, or capitulate) instead of only a
  towel.
- **Juice**: a hit flash, a number pop, a crowd roar that grows with hype, a screen shake on kills, confetti on Titles, a short
  slow-motion on the deciding blow. Auto-play stays for those who want speed.

### E. Carry-over: the Legacy tree and Heat
- **Legacy XP after every career, win or lose**, from what you achieved (arenas reached, Bosses beaten, kills, Titles, the plot).
  It fills a visible bar on the end screen, and every level unlocks something:
  - new relics and Fortune cards;
  - patrons;
  - starting buildings;
  - fighter kinds and classes;
  - cosmetic house colours and banners.
- **Unlocks show at the end of every career** ("New: the Butcher's Hook can now appear in your Fortune draft").
- **Heat:** the existing decrees become numbered Heat levels you choose before a career, for a higher score and better Legacy XP.
  Beating Heat N unlocks Heat N+1.
- **The Hall of Legends:** retired and fallen legends persist across careers, with their story; a legend can return once as
  a Fortune card ("an old champion offers to fight for you one last season").
- **Daily challenge** gains a streak counter and a best-score board kept in the browser.

### F. Feel: less reading, more seeing
- **Fight day is one tap away on a phone** (a sticky button); the top bar collapses into a menu; the houses table and log fold.
- **One line per reason:** repeated "can't train" lines collapse into one.
- **The month's digest** replaces the scroll of log lines.
- **Talk stays the designer's,** but no more than one scene per month turn (pillar A gives fewer, bigger moments).

## 4. Measuring "fun" (new gates)

Bots can't feel fun, but they can measure its enemies:

| Measure | Target | How |
|---|---|---|
| Career length | 12–20 months to a win (careful bot) | `career-sim` |
| Dead turns | under 15% of months with no new choice | a bot counter: no draft change, no fight, no level-up |
| Careful win rate, first career (no unlocks) | 15–35% | bots |
| Careful win rate with a full Legacy | 40–60% | bots with every unlock |
| Unlock cadence | every career, win or lose, gains Legacy XP; a level about every 1–2 careers | bots |
| Builds | no single relic in over 50% of winning careers | bots that draft greedily |
| Existing gates | tactics, deaths, Bosses, plot endings, short careers | kept, retargeted where the career's shape changes |

And people (LLM playtests with a fun rubric):
- moments they wanted to keep playing;
- dead stretches;
- decisions that felt meaningful;
- whether they'd start another career straight away, and why.

## 5. Phases (each ships working)

| Phase | What | Version |
|---|---|---|
| 1 | **Pace:** month turns, digest, auto-plan, the shorter default career, phone fight-day button, collapsed reasons | 6.0.0-alpha.1 |
| 2 | **Fortune draft** and **relics** (a first set of 15–20), perk tags | alpha.2 |
| 3 | **Legacy XP**, the unlock tree, Heat, the Hall of Legends, the end-of-career unlock screen | alpha.3 |
| 4 | **Fights:** crowd meter, intent, clutch moments, juice | alpha.4 |
| 5 | **Balance and gates** for v6, LLM fun playtests, fixes | beta |
| 6 | The designer's text pass, polish, freeze | 6.0 |

Each phase: tests first where rules change, `npm run check` with v6 gates, a browser check, a changelog entry, and a short report.

## 6. Review (by me, before building)

- **Biggest risk: the month turn.** It changes how every system is driven. *Mitigation:* the weekly engine stays as it is;
  the month turn is a driver over `advanceWeek` (the tests and bots keep working). Events, overtraining warnings and the steward
  move to the planning phase.
- **Shorter careers squeeze the hidden plot** (12 weeks after the Mark, House level 3, then the Grand Tournament).
  *Mitigation:* scale the plot's week gates to the career's length; keep the coup gate (5–25%).
- **Relics can break balance.** That's the point, within reason. *Mitigation:* the "no relic in over 50% of wins" gate; the
  strongest only from Legacy unlocks.
- **Meta-progression can make the game feel grindy** if the first career is too hard. *Mitigation:* the first-career win-rate gate
  (15–35%) and unlocks that widen choice more than raw power.
- **Save compatibility:** version 6 changes the save shape. *Mitigation:* `SAVE_VERSION` 4; 5.x careers in progress offer to open
  in `/v5/`; the Codex and Legacy carry over (Legacy XP is granted for past careers recorded in Legacy).
- **The designer's text:** all new words are PLACEHOLDER and listed in `docs/text-to-rewrite.md`, as before.
- **Scope:** this is several sessions of work. Each phase is useful alone, so it can stop at any phase and still be better.
- **Order check:** pace before choices (a draft every month is only fun if months are quick); carry-over before fight juice (it
  changes what a lost career feels like, the biggest problem in section 1).
