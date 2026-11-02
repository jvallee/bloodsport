# Playtest #10 (LLM) changes: version 5.4.0

The playtest (`docs/playtest-llm-10.md`) played a full career on seed 10010 (about 68 weeks, alive at stop, stuck at the Silver Coliseum) and a short career on seed 10011 (stalled at the Bronze Boss). It was the first playtest of 5.4.0's lower Bronze wall.

## What the tester said about the Bronze change

- **Bronze took 3 months** in the full career (7+ in playtests #5, #8 and #9), and the Boss at Power 13 fell at the first try, 2–1, with three items and a signature move: "a real decision and a real fight".
- **Gold through Bronze ran 0–30**; training happened in about 9 of 12 weeks. The binding limit was the Trainer cap of 5, not Gold.
- **Cheap training rarely applies.** A Trainer Room of level 2 already costs 2 Gold; the cap only bites from level 3 (House level 3, 30 Prestige). It did apply in the short career, where it made Bronze regulars easy while the Boss still held.
- **Silver is the new wall** (below).

## Bugs fixed

| Report | Fix |
|---|---|
| A bracket Quarter- or Semi-final won with 2+ injuries was never a Bloodied Victory, so the Emperor's "Bloodied Victory" demand couldn't be met from Silver up, and those wins missed the Favour, Renown, XP, Morale and Battle-Hardened scar | Bracket wins count, with every effect |
| Withdrawing from a bracket made a nemesis of the next opponent, never fought | A withdrawal marks nobody |
| A Boss bracket lost in its Quarter-final logged "the Boss will remember this" | "never had to fight you. They will be waiting next time, stronger." (the Boss still returns at +1) |
| The spare verdict said "the Emperor wanted blood too" in a lower arena, and in a month he'd demanded a spare | The lower arena first, then the crowd ("the crowd wanted blood"), and it says when the spare still meets the Emperor's demand |
| "A chance: the other: joins the cause" | Event stakes name the fighters, in the text port too ("Pertinax: joins the cause") |
| The Result line counted a won bet's returned stake as purse ("+13 Gold") | Gold is the purse ("+8 Gold"); the bet has its own line ("5 Gold back (+1 profit)") |
| Training stopped for good after a rest for Stress or Gold (also playtest #9) | The fighter goes back to the same training once they can, without overtraining; a Rest the player chose stays |
| The Ludus didn't say the 2-Gold fee rises at Silver | "2 Gold per training week (3 from the Silver Coliseum)" once the Trainer Room's own fee is higher |

## Left for the designer

- **The Silver wall** (the tester's first suggestion). Every fighter stopped at the Trainer cap of 8 (16–18 Power) against Silver Finals of 18–21. Trainer level 4 needs House level 4 (60 Prestige), and Silver buy-ins and losses drained Prestige from 31 to 5. The old 7-month Bronze grind had been building the Prestige that made Silver easy. Options offered:
  - Trainer level 4 at House level 3 once Silver is your top arena.
  - No buy-in lost on a bracket lost after winning a match.
  - Regular Finals 17 / 17 / 19 (the Boss kept).
- **Demands repeat** (four "Bloodied Victory" demands in a row on seed 10010: the dice, not a bug). Not repeating the last demand would change the Emperor's RNG stream, and so the gates.
- **Odds labels against Power** ("Long shot" at 17 vs 17 next to "Underdog" at 16 vs 16): Speed, humours and traits, but confusing without the Oracle.
- **Small text-port things:** echo the new Power after `use <item>`; log every item used in a fight.
