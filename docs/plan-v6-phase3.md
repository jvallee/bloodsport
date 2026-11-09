# Version 6, phase 3: Legacy XP, the unlock tree and Heat (6.0.0-alpha.3)

Pillar E of `docs/plan-v6-one-more-career.md`: "I lost, but I unlocked X. Again."

## What gets built

1. **Legacy XP** (`careerXp(run)` in `src/legacy.js`, pure). Every career earns XP, win or lose, with a breakdown:
   taking part 10; each arena above the Dirt Pits 15; each Boss beaten 5; each kill 1 (up to 10); each Title 5;
   winning the career 50; the plot's endings (coup 40, martyr 25, the loyalist's road 20); then +20% per Heat level.
2. **Levels.** Level 2 needs 60 XP and each level after needs 10 more than the last (60, 70, 80, …).
   Past careers recorded in Legacy are worth XP once, when the 6.0.0-alpha.3 Legacy first loads (a migration).
3. **The unlock tree** (`LEGACY_LEVELS` in `src/data.js`): one unlock a level, levels 2–12. The unlocks widen choice:
   four relics that are now locked out of the first career (Loaded Dice, Scrolls, the Laurel, Proserpina's Coin), the Hall
   of Legends cards, a starting Oracle, a new patron (the Augur: the career opens with a pick of three rare relics),
   a fourth Fortune card each month, and house colours (cosmetic).
   A career stores what was unlocked when it started (`run.setup.unlocks`), so careers replay and the bots can play
   "first career" or "full Legacy".
4. **Heat** replaces the decree checkboxes: Heat 1–5, each adding one rule to the last (Harsh Judges, a Greedy Emperor,
   Iron Bosses, and two new ones: Lean Fortunes, one card fewer; Hungry Lions, every opponent +1 Power).
   Winning at Heat N unlocks Heat N+1 (a first win unlocks Heat 1, as the champion achievement unlocked the decrees).
   Heat raises the score (the decrees' scores, as before) and Legacy XP.
5. **The Hall of Legends returns:** with its unlock, a retired legend from an earlier career can be dealt as a legendary
   Fortune card, once ("an old champion offers to fight for you one last season"). The career's setup snapshots up to six
   eligible legends; a legend who returned is marked in Legacy and never comes back again.
6. **The end screen:** XP earned with its reasons, the level bar filling, and "New: …" for every unlock gained.
   The Legacy panel shows the level, the bar, every unlock and the next one ("Next, at level 5: …").
7. **The daily challenge's streak:** consecutive days played, on the setup dialog and the daily career's end screen.

## Balance and gates

- The careful, reckless, plot and short bot groups play a **first career** (no unlocks): the plan's target is 15–35%
  for careful (the old 20–45% gate is retargeted; recorded in `docs/fight-rules.md`).
- A new group, **careful with a full Legacy** (every unlock, the Augur as patron), gates at 40–60%.
- A new gate, **unlock cadence:** the careful bot's average first-career XP makes each of the first five levels take
  1–2 careers.
- Measure first with the probes; tune the locked relics, the fourth card and the XP numbers before choosing.

## Review

- **Locking relics lowers the first career.** That's wanted (38% is above 35%), but the plot and short gates move with it.
  Measure all groups together before choosing; the Emperor's relic stays in the pool (the loyalist's edge).
- **Old saves:** a career started before alpha.3 has no `setup.unlocks`, so it plays as a first career from now on (it
  keeps the relics it holds). Acceptable for an alpha; said in the changelog.
- **The daily challenge stays fair:** it never uses unlocks, Heat or legends.
- **Grind:** every unlock is a choice or a cosmetic, except the fourth card and the starting Oracle, which are modest.
  Most of the power comes from more relics in the pool, which still has to be drafted.
- **Text:** the unlock names, Heat rules, legend card and end-screen lines are PLACEHOLDER (section 15 of
  `docs/text-to-rewrite.md`).
