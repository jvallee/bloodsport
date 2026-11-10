# Version 6, phase 6: polish and the freeze

Part of `docs/plan-v6-one-more-career.md` (section 5: "The designer's text pass, polish, freeze"). Ships as 6.0.

## Where it stands (6.0.0-beta)

- The check passes 18/18 on seasons (`docs/fight-rules.md`, 6.0.0-beta). A won season is 19.9 fight months.
- Playtest LLM-14 plays a first season on the new pace (training ×2 in a season).
- Open items from LLM-12/13 (`docs/playtest-12-changes.md`, "Not changed"): the economy curve, Counter + Feint + First
  Strike stacking, repeated names, "Retire with honour" wants from the champion, bracket hype resetting each match.

## The work

### 1. The designer's text pass (theirs)
- Every new v6 line is listed in `docs/text-to-rewrite.md`, section 14, grouped by phase. The designer rewrites in their
  voice; numbers and rules text stay accurate. Nothing here is blocked on it: the freeze can be refreshed in place
  afterwards (`docs/HANDOFF.md`, section 6, "Refreshing a frozen copy").

### 2. Polish (small, no balance change unless checked)
- Fix what LLM-14 finds (bugs and confusions first).
- **Repeated names:** keep the names of your house's fighters, the Market and recent Fortune fighters out of new
  opponents' names. Changes which name is drawn, so careers on a seed change: run the check.
- **"Retire with honour":** only the second-best fighter or below asks (never the champion mid-climb), so the want is a
  real choice. Wants don't touch the fight engine, but they change careers on a seed: run the check.
- **The Fates' Wager log line** still says "top bout"; say "this month's top-arena tournament", as the card does.
- Leave for the designer (they change the game's feel or economy): the economy curve, tactic stacking, carrying hype
  through a bracket.

### 3. The freeze (6.0)
- Version 6.0.0; move "6.0.0-beta (in progress)" in `CHANGELOG.md` under "6.0.0".
- Copy into `/v6/` (keys `bloodsport.v6.*`), add `v6/README.md`, list it in `CLAUDE.md`, tag `v6.0`, push the tag
  (`docs/HANDOFF.md`, section 6).

## Review
- **Risk: freezing before the designer's text pass** puts placeholder words in `/v6/`. *Mitigation:* the copy can be
  refreshed in place on request; the freeze marks the rules and balance, which are done and checked.
- **Risk: polish that quietly shifts balance** (names and wants change the RNG draws). *Mitigation:* every such change
  runs the full check before it's pushed.
- **Scope:** polish stays small. Anything that changes how the game feels (economy, hype, stacking) goes in the report
  as a recommendation, not into 6.0.
