# Version 6, phase 5: balance and gates for v6, fun playtests

Part of `docs/plan-v6-one-more-career.md` (section 4, "Measuring fun"). Ships as 6.0.0-beta.

## Where it stands (alpha.4)

- **The bots measure the wrong career.** Players start a **season** by default (alpha.1), but the careful, plot and Legacy
  groups play the Long Road. Only the "short" group plays a season.
- **A won season is too long:** about 105 weeks, roughly 24 fight months, against a target of 12–20 (40–60 minutes).
- There's no gate yet for **dead turns** or for **builds** (one relic in most wins).
- First career 35% and the loyalist's lead +5 both sit on the edge of their gates.

## The changes

### 1. Gates measure the default career
- The careful, reckless, rebel, loyalist and Legacy groups play a **season**. The Long Road gets its own group and one
  gate ("the Long Road is winnable": careful 15–45%), so it keeps working for those who choose it.
- Retargeted gates keep their targets (first career 15–35%, full Legacy 40–60%, cadence 1–2, the plot's gates). Any gate
  whose meaning changes with the season (the short-career gate becomes the Long Road gate) is changed in the open, in
  `docs/fight-rules.md`.

### 2. New gates (from the plan's table)
| Gate | Target | Measured as |
|---|---|---|
| Career length | a won season in 12–20 fight months | non-winter weeks / 4, careful winners |
| Dead turns | under 15% of months | a month with no match fought, no Fortune card taken, no level-up and nothing built or bought |
| Builds | no single relic in over 50% of won careers (changed during the phase: no relic held in 20+ points more of wins than of losses; see `docs/fight-rules.md`, 6.0.0-beta) | relics held at the end of careful and Legacy careers |

### 3. Pace: a shorter season
- Find what makes a won season long (Boss retries, the Silver/Imperial walls, months spent training) from the bots'
  histories, then probe levers. Candidates: faster training in a season (`SHORT`), a Boss rematch the next month, a shorter
  Grand path, fewer arenas in a season. Opponent Power moves with any speed-up to keep the win rate.
- Pick from a table: the shortest season that keeps every gate.

### 4. Fun playtests (LLM)
- The project's usual procedure (`docs/HANDOFF.md`, section 6): general-purpose subagents play through
  `scripts/play-text.js` and write `docs/playtest-llm-12.md` (and 13), with a fun rubric added: moments they wanted to keep
  playing, dead stretches, meaningful decisions, and whether they'd start another career at once, and why.
- One plays a first career; one plays with a Legacy (several careers' unlocks) to try Heat, the Augur and relics.
- Fix the findings; write `docs/playtest-12-changes.md`.

## Review
- **Risk: moving every group to seasons shifts every number at once.** *Mitigation:* run the check once on seasons with
  no rule change, as the baseline, before touching the rules.
- **Risk: a shorter season squeezes the hidden plot** (week gates after the Mark). *Mitigation:* the coup and treason
  gates run on seasons; if the coup becomes impossible, scale the plot's week gates to the career's length.
- **Risk: "dead turn" is easy to define so it always passes.** *Mitigation:* count only real changes the player made or
  saw (a match, a pick, a level-up, a purchase); report the figure even when it passes.
- **Scope:** pace is the big one; the gates and playtests are mechanical. If no lever gets a season under 20 months
  without breaking a gate, ship the gates with the best measured season and say so.
