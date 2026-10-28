# Playtest #6: what changed

Report: `docs/playtest-llm-6.md` (seed 6006, 463 commands, about 88 weeks). Rules and numbers are in `docs/fight-rules.md`, "Playtest #6 changes".

## Bugs fixed (from §3 of the report)

1. "Natural and training" on fighters who only trained Speed. New fighters start with `trainedPower: 0`; only older saves keep the combined label.
2. Perk Power hidden in "Natural". A Perks part (`f.perkPower`) now shows it.
3. Opponent Power without gear (text interface). It now uses the same `effectivePower` and breakdown as your cards and the bracket line.
4. Speed without gear (text interface). Speed is now shown with gear.
5. `gearText` dropped the win-chance stat. It now shows it (Spiked Gauntlet, Wooden Buckler, Lion Pelt).
6. The heal log printed raw tags. It now uses injury names.
7. The spare result text left out Renown and Morale. It now lists every gain and has no trailing space.
8. The first-kill chronicle always said "at the crowd's verdict". It now says "at the crowd's demand" or "though the crowd begged mercy".
9. Names repeated. The pool has 40 more names, retired names are reserved, and the recent-opponent memory is now 60.
11. The bracket odds label covered only the Quarter-final (text interface). It now shows the next match's odds plus the whole tournament's.
12. A lower-arena win could pay the same as a loss. It now pays at least the loss + 2.

Bug 10 (humor spread) is seed luck: `pick` is uniform.

## Design changes (from §9 of the report)

1. **The Bronze wall.**
   - Bronze opponents are 11 / 12 / 14.
   - Silver, Imperial and Grand are harder to keep the career difficulty in range.
   - The text fight header shows each round's Power breakdown, so a gap is explained.
2. **The Power and Speed display.** See bugs 1–4. The text fight header also lists every Power modifier for both sides.
3. **Items.** Half price.
4. **Lower-arena pay.** See bug 12.
5. **The thumbs trade-off.**
   - Sparing against a call for blood: their house owes you a life.
   - Killing against a mercy chant: infamy Renown.
   - Dreaded comes at 2 kills.
   - No Favor for sparing in a lower arena.
6. **Signatures.**
   - Regular opponents use theirs only in Finals; Boss tournaments use them every round.
   - Opponent cards show the move.
   - Hawk Strike and Cast the Net get stronger.
7. **Brackets.**
   - Early wins pay more Gold (3 × tier).
   - The text interface shows whole-tournament odds.
   - Prestige per win was measured and rejected: +15 points of careful win rate.
8. **Underdog.** Needs a 2-Power gap.
9. **Morale.**
   - The chip shows the target and why, and warns "Discontented soon". The text interface does the same.
   - Skip-to-tournament rests trainees before they would be overtrained.
10. **Text polish.**
    - The lower-arena paragraph prints once per screen.
    - Scouted now reads "your fighter fought here last month".
    - See bugs 5–8.

Not done: fewer events in year 1. Events are already at 25% of weeks; left for the user.

## Balance

All 9 gates pass:
- careful win 43%
- careful deaths 0.55 per career
- reckless deaths 3.21
- balanced build best vs 2 of 4 Bosses
- first Boss 71%
- tactics +8 over always-Steady
- always-Press 7 points worse than reading the opponent
- Grand 27 points harder than the first Boss

Single-change attribution is noisy (a change shifts every later dice roll), so the final values came from measuring packages against the old baseline (`scripts/probes/careful-variant.js`, plus a variant runner).
