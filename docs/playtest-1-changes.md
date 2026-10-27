# Changes from LLM playtest #1

Source: `docs/playtest-llm-1.md`, an LLM new-player run through the text interface (seed 2026, won in Year 2, no deaths). This file records what was changed in response, what wasn't, and how balance was checked.

## Implemented

| Playtest finding | Change |
| :--- | :--- |
| One star fighter carried the whole career; the roster, towel and Death Gate never mattered | **Scouted:** a fighter who fought in your top arena last tournament week faces +1 opponent Power there. Sitting them out of the top arena for a month resets it. Odds, the fight log ("Scouted +1") and the fight-day panel all show it. Swept at caps of +1, +2 and +3; anything above +1 made careful play win under 25% of careers. |
| Losing the first Boss as a "Strong favorite" cut Favor 50 → 20 in month 3 | **Boss losses cost Favor by tier:** −15 / −20 / −25 / −30 (Grand −30); forfeits 5 more. The Boss tutorial now says a "Strong favorite" still loses about one match in four. |
| The lower-arena text said "no Favor at stake" but crushing wins cost Favor; "crushing" was never defined | The arena text now gives the threshold and all three costs: 3+ more Power, gear included; −2 Favor, −10 Morale, no Renown. The odds row warns before you send someone. |
| A "Favored" fighter was jeered as crushing; card Power didn't include gear | Crushing wins and upsets use **Power including gear**, and the card's Power badge shows that number (hover for the split). |
| Trainer upgrades silently raised the weekly fee; the cap's scope was unclear | Trainer text: "each fighter can train up to N points in total", with the fee per fighter-week shown and noted as set by your best room. |
| An Armourer built mid-month had nothing for sale until next month | **The Armourer and Liaison stock up the moment they're built.** |
| A Maimed fighter after a won match went unnoticed for two weeks | The post-match banner lists **new injuries** in red ("Ixa is now Maimed: send them to the Medbay"). |
| "Settled" arenas looked like next month's fights had already happened | "✔ Settled this week. The opponent above is next month's." |
| Max level (6) was never mentioned | The card shows "Lv 6 max", with a tooltip saying XP no longer adds anything. |
| Stripped of Armor was unclear about armor gear | Its text now names Alloyed Skin, Ego Armour *and armor gear*, and says evasion still works. |
| The decor merchant never mentioned the per-Quarters cap | The merchant states the cap. |
| The Market said "build a Liaison (Prestige level 2)" after you'd already reached level 2 | The Liaison text adapts to whether you've reached the level or built it. |
| Names were recycled (two different Vexes, four Unit Kappas) | 80 unique names; nobody shares a name with a living fighter, opponent or the fallen. |
| "beat the The Dirt Pits …" | Fixed. |

The text-interface issues (the tutorial-card queue, gear indexes, settled-arena wording, end-of-career noise) were fixed in the playtest session (`6917043`).

## Not changed (and why)

- **Speed as the obvious first buy.** The balance gate says a Power/Speed mix is the best build against every Boss. Speed being the *first* buy is fine; the playtester did switch to Power once ahead.
- **Entertainment Room making Stress trivial.** Fair, but changing it shifts the whole balance again. It's the first candidate for the next tuning pass.
- **Winter's dead weeks.** "Skip to tournament" already jumps winter in one click. Giving winter its own activity (events, surgery) is roadmap work.
- **A Grand Tournament gauntlet (several fighters).** A good idea; Scouted covers the immediate problem. Kept as a roadmap item.
- **Opponents shown without stats** and **`--last N` printing the intro** are text-interface issues only; the web UI always shows full opponent cards.

## Balance after the changes (`npm run check`, 300 careers)

| Gate | Target | Before | After |
| :--- | :--- | :---: | :---: |
| Careful career win rate | 30–45% | 36% | **33%** ✅ |
| Careful ≥ reckless | yes | 36% vs 0% | **33% vs 0%** ✅ |
| Careful deaths ≤ ½ reckless | yes | 0.05 vs 1.64 | **0.17 vs 2.12** ✅ |
| Reckless deaths per career | 1–3 | 1.64 | **2.12** ✅ |
| Balanced build best vs ≥ 2 Bosses | yes | 2/4 | **2/4** ✅ |

Sweep that chose the values (`npm run sweep -- --scout 150`):

| Scouted max | Tribute/yr | Careful win | Careful deaths | Reckless deaths |
| :---: | :---: | :---: | :---: | :---: |
| 0 | 15 | 55% | 0.05 | 2.58 |
| 0 | 20 | 49% | 0.06 | 2.28 |
| **1** | **15** | **31%** | **0.16** | **1.89** |
| 1 | 20 | 21% | 0.16 | 1.77 |
| 2 | 15 | 22% | 0.18 | 1.60 |
| 3 | 15 | 19% | 0.19 | 1.64 |

Careful careers now lose about three times as many fighters as before (0.17 vs 0.05), because rotating means sending second-string fighters into real danger. That's the depth and Death Gate drama the playtest said was missing, while reckless play still loses many more.

## Suggested next steps

1. **A second LLM playtest** of the same seed, to see whether Scouted creates rotation decisions without feeling like busywork.
2. **Entertainment Room relief** (−15/−30 a week) is probably too strong; sweep it next.
3. **Grand Tournament gauntlet**, and something to do in winter.
