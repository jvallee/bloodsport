# Changes from playtest #2

Notes: `docs/playtest-2-notes.md`. All changes are live at https://jvallee.github.io/bloodsport/. 207 tests pass, and `npm run check` passes all five gates.

## Bugs fixed (each with a test)
| # | Bug | Fix |
| :-: | :--- | :--- |
| 1–3 | A "training" week silently became a Rest week (−40 Stress, no stat) | **Training can't be chosen when it can't happen**: trainer cap, Restless, Stress 50+, or Gold short for every trainee's fee. The reason is shown under the job buttons. If training still can't happen when the week ends, it **counts as Rest** (your call). A fighter who becomes unable to train switches to Rest at the end of the week. Either way the card says "Switched to Rest: …". |
| 4 | Gear Speed missing from the card | The card's Speed includes gear (hover for the split), and gear's injure and armor bonuses are listed on the card. |
| 5 | Story/math toggle replayed the dice | Fixed. |
| 6 | Equip/unequip closed the gear panel | Fold-out panels keep their open or closed state. |

## Requests
| Request | Done |
| :--- | :--- |
| "Throw in the towel" → "capitulate" | Everywhere players see it, including the text interface (`capitulate`; `towel` still works). |
| Traits on separate lines | Kind trait, class ability and gear each get their own line. |
| Clearer injury rolls | "needs 55 or less to wound, rolled 5.9. Hit!" (a 1–100 scale). |
| Birds and Braziers affect Stress | **−5 Stress a week each.** Trophy Racks stay Morale only. |
| Consumables | **Apothecary** in the Market: War Paint (+1 Power next round, 10 Gold), Adrenaline Draught (+3 Speed next round, +15 Stress after, 8), Blessed Bandage (−10% to be injured next round, 10), Crowd Bribe (no Favor or Renown lost for capitulating, 12). Use one between rounds after Round 1, one per fight. Design critique: no item removes injuries (that would undercut the Death Gate), and Smelling Salts was cut as too hard to explain. |
| Only the end fights harder | Imperial Coliseum opponents +2 Power (19/20/21), Grand Tournament 24. Boss-loss Favor eased by 5 (10/15/20/25), so only the end gets harder. A fully trained fighter's odds against the Imperial Boss drop from 58% to 43%. |
| Better UI/UX | A **next-step bar** on every screen tells you the most useful thing to do now. **Keyboard shortcuts:** Space plays the next round, leaves a finished fight, or ends the week; T skips to the tournament; 1–4 switch tabs; ? opens How to play. |

## Balance (300 careers)
| Gate | Result |
| :--- | :--- |
| Careful win rate 30–45% | 33% ✅ |
| Careful beats reckless | 33% vs 0% ✅ |
| Careful loses far fewer fighters | 0.06× ✅ |
| Reckless loses 1–3 per career | 2.75 ✅ |
| Balanced build best vs 2+ Bosses | 2/4 ✅ |

Sweep for the finale (`npm run sweep -- --late 150`):

| Extra opponent Power (T1–T4) | Boss-loss Favor | Careful win |
| :--- | :--- | :---: |
| 0/0/0/0 | −15/−20/−25/−30 | 41% |
| 0/0/0/2 | −15/−20/−25/−30 | 28% |
| **0/0/0/2** | **−10/−15/−20/−25** | **41%** (300-career check: 33%) |
| 0/0/1/1 | −10/−15/−20/−25 | 34% |

## Not done
- **Bots don't use fight items**, so the gates measure balance without them. Items make human players a little stronger than the gates suggest.
- **An LLM playtest of the new navigation** hasn't been run yet; it's the natural next step (`scripts/play-text.js` supports items and `capitulate`).
