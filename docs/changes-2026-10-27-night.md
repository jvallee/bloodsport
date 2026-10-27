# Overnight changes (2026-10-27)

Live at https://jvallee.github.io/bloodsport/ (v1 is still at `/v1/`). All 189 tests pass and all five balance gates pass (`npm run check`).

## Your requests

| You asked | What changed |
| :--- | :--- |
| Add "Stress" to "at 50+" | How to play now says "at 50+ Stress a fighter is overtrained". |
| A dice animation for who strikes first, to build suspense | Each round opens with **"Who strikes first? Speed + a die"**: both dice tumble for about 1.3 s, land, show each total, and the faster fighter's box lights up. Only then do the score, round winner, tags and story appear, one after another, so nothing is spoiled. Footwork and Concussed show why there's no roll. Reduced-motion settings skip the animation. |
| Injuries disappeared after losing the first Boss: is it a bug? | **Yes, one path was a bug.** Reloading the page mid-fight counted as throwing in the towel, but discarded injuries from rounds already fought (an exploit, too). Fixed: the game records the fight after every round, and a reload keeps those injuries. A regression test reproduces the original bug. In 60 normal Boss losses, injuries always carried over correctly. Note that the Boss who beat you comes back healed; that's intentional. |
| Page through multiple banners | Notifications (the tutorial card and every match result from the week) share one slot with **‹ 1 / 3 ›** arrows. Previously only the last result was kept. |
| Can you only injure if you win? | **No.** Both fighters roll to injure every round, whoever wins. The round loser is much easier to hurt (25% vs 10% at even Power). The Codex "Rounds and matches" entry now says so. |
| Don't punish rookies in the small pits | **Rookies (under 5 Renown) are never jeered.** Only known fighters crushing a much weaker opponent are. |
| Show gold, XP, Morale etc. after a fight | The fight screen ends with **"After the fight"**: Gold, Prestige, Favor, XP (and level-ups), Renown, Morale, new injuries, loot, Titles, Blood Faith, and the crowd's reaction. |
| Does taking the same perk twice stack? | Only **Mighty** (+1 Power) and **Swift** (+3 Speed) can be taken again, and they **stack**. All other perks are once only and never offered again. The perk picker now says "(stacks)" and "you have ×2", and the Codex says the same. |
| Earn "Champion of the Dirt Pits" by winning X fights there; Champions can't go back without steep penalties | **Win 3 matches in an arena (or beat its Boss) to become its Champion** (+1 Power, one Title per arena). A **Champion who fights back in a lower arena** gets no Prestige or Renown, loses 10 Morale, and costs 3 Favor. The fight-day panel warns before you send them. |

## Also fixed
- The forfeit dialog still mentioned Imperial Strikes; it now talks about Favor.
- The UI test suite took 436 seconds; it now takes under 1 (the failure message was being built on every check). The full suite runs in about 5 seconds.

## Balance after these changes (300 careers)
| Gate | Result |
| :--- | :--- |
| Careful win rate 30–45% | 36% ✅ |
| Careful beats reckless | 36% vs 0% ✅ |
| Careful loses far fewer fighters | 0.07× ✅ |
| Reckless loses 1–3 per career | 2.21 ✅ |
| Balanced build best vs 2+ Bosses | 2/4 ✅ |
