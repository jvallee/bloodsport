# Playtest #7 (LLM) changes: the v6 hidden plot

Two playtests ran on the first build of v6's hidden plot (2026-10-28):

- **Blind** (`docs/playtest-llm-7-blind.md`, seed 7007): told nothing about the plot.
- **Informed** (`docs/playtest-llm-7-plot.md`, seed 7117): told about the plot, and asked to push it toward the coup.

## Discoverability (blind)

The blind tester reached the chalk mark and copied the sign, after building a Liaison late "for completeness". They noticed the odd prison record ("visitors ask for them by a name that isn't on the record"). The budget ran out before the plot went further.

**Fixed:** the text interface listed the hidden "The Rebellion (0/10)" Codex section from turn 3. Hidden sections now stay out of sight there too.

**Added:** a subtle hint on the Liaison: "Read their prison records: not every prisoner is what the guards say."

## Bugs fixed

| Report | Fix |
|---|---|
| Betrayal executed fighters silently | Each execution and each captured contact is logged, and chronicled in the victim's Story. The text interface shows the epilogue. |
| A scrubbed chalk mark left the plot stuck forever | The mark comes back once. Scrubbed twice, the thread goes cold (the Bystander line can appear). |
| The cousin's revealed Boss rule never showed | It shows in the text interface too ("A visitor whispered the Boss arena rule"). |
| "Free me: Free ." | Names are taken before a card's effects remove the fighter. |
| The priest's blessing stacked forever and prolonged bad moods | A good mood of +5 for the month, or a bad mood eased by 5 (never prolonged), with a log line. |
| Freed contacts shared names with arena opponents | `freshName` avoids every arena, rival and bracket opponent, the dead, and the Liaison offer. |
| Champion recruitment felt rigged | Tested: the roll matches the odds. The card now names your two most famous fighters, shows "N% they say yes" on each button, and a refusal costs only 5 Morale (no suspicion). |
| The Codex unmasked political prisoners on purchase | A cell's entry unlocks only when you free someone of that cell. |
| The "cheap" clue couldn't show at Liaison Lv 1 | Convicts cost 2 Gold; political ones 1. |
| Liaison convicts at Power 16 for 1 Gold | Convicts have Market-strength natural Power. Prisoners of war have the top arena's Power − 1 and cost 3 + 2 × tier Gold (`LIAISON` in `src/data.js`). |
| (Blind) The caravan's "half price" War Paint cost 5 Gold (shop price 4) | It costs 2. |
| (Blind) A festival leaked into a newly opened arena's preview | Any arena without an open bout this week previews next month's. |
| (Blind) Capitulating as the stronger fighter got "lost anyway" advice | The capitulation advice comes first. |
| (Blind) The crowd only called for blood at exactly 2 wounds | It calls once the beaten fighter's real Death Gate is open (Lions, Unbreakable, Iron Will). |
| (Blind) "Owes you a life for 3 months" lasted about two tournaments | Feuds, vengeance and lives owed set during a tournament week start counting down the month after. |
| (Blind) The Challenger bonus had no Codex entry | Added under Basics. |

## Pacing and choices (informed)

- **Acts 1–2 took 7 weeks.** The Cause now needs 3 favours done and 12 weeks since the Mark, as well as trust 4 and House level 3.
- **The prefect's offer came first in Act 3.** It now waits 16 weeks into the Cause, so betrayal has something to cost.
- **Act 3 dragged for 61 weeks** waiting for arms and a champion. Those cards now come first half the time until done.
- **Trust piled up to 17.** It's capped at 10.
- **"Ready" was a dead zone.** Favour and rescue cards continue in the ready stage, so contacts can still be gathered for the coup, and the house log has a monthly pulse ("The city is waiting for the Emperor's games").
- **"Nothing happens" on plot buttons:** plot cards show nothing when only hidden things change. Betrayal's real cost shows. Recruitment shows "joins the cause".
- **Hiding the wounded man was a no-brainer.** It pays 3 Gold (was 6) and raises suspicion by 5.
- **Suspicion signs repeated word for word.** They vary and escalate by level (watching, then searching, then the prefect in your box).
- **The forged pass was invisible once bought.** It shows in the Storeroom ("In the strongbox"). The people you freed are listed on the Ludus tab under "Friends outside the walls".
- **"Brother in the cells" from an ordinary fighter felt arbitrary.** Only political prisoners and the sworn champion ask.

## Not changed (noted for the designer)

- **Lower arenas freeze when you never fight in them** (blind): they wait for you. This is unchanged, and worth a decision.
- **Preview odds without an Oracle, the injury-chance breakdown in `math` mode, and a warning before a training-fee rise:** left for a later pass. The Trainer Room's upgrade already names the next fee.
- **The coup at an earlier Boss** (an informed suggestion to shorten the wait): not done. The Grand Tournament keeps the coup as the career's climax.
