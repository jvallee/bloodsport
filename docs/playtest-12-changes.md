# Changes from playtests LLM-12 and LLM-13 (version 6, phase 5)

Reports: `docs/playtest-llm-12.md` (a first career, seed 12012) and `docs/playtest-llm-13.md` (a full Legacy with the Augur at
Heat 1, seed 13013). Both played seasons through `scripts/play-text.js` on 6.0.0-alpha.4.

## What both said
- **The fights are the best part;** reading the opponent's temper against the Oracle's tell creates the tension.
- **The crowd did nothing:** it reached its mark in 1 of ~30 fights (LLM-12) and never in ~90 rounds (LLM-13), because good
  play (reading the opponent) often means Guard, which drains it.
- **All In wasn't a gamble:** it could show a lower death risk than fighting on.
- **The draft went flat at 6 relics:** no relic card was ever dealt again.
- **Fortune fighters were useless from Silver on** (far below the roster).
- **Walls are a Gold timer** and a won season is long (the bots agree: about 24 fight months).

## Changed

| Finding | Change | Where |
|---|---|---|
| The crowd never reached the mark | **The crowd loves a read:** +10 hype in a round where your tactic counters theirs (`HYPE.read`). | `hypeOf`, `src/fight.js` |
| All In safer than fighting on | **All In: win the round or fall.** +20% to win the round (+10% to injure); lose it and your fighter falls. Its death risk is the chance of losing the round, never lower than fighting on. | `TACTICS.allIn.fallOnLoss`, `playRound` |
| "9 in 10" tells misled when against the temper | The tell now comes with **one honest forecast**: "weighing the tell against their temper: about N% they Press" (the same Bayes the suggestion uses). | `tellForecast`; the fight screen and the text port |
| No relic cards at 6/6 | **Relic cards keep coming.** At the limit, taking one lays down a relic you choose ("Lay down …" buttons; `fortune <n> <relic>` in the text port). Bots swap their least rare relic for a rarer one. | `chooseFortune(run, i, drop)`, `fortunePanel`, `scripts/bots.js` |
| Fortune fighters useless later on | A drafted fighter (and a returning legend) arrives **at most 3 Power behind your second-best fighter**, plus the card's rarity bonus (`FORTUNE.fighterBehind`). | `keepUp` in `src/run.js` |
| Heat 1 barely felt | **Harsh Judges** no longer halve the Favour for falling before a Boss Final. | `src/run.js` (`early`), `DECREES.harshJudges` |
| Stripped of Armour left armour's Power | The rule switches the armour piece off entirely (Power, Speed and win bonuses too), as its text says. | `gearFor` in `src/fight.js` |
| "Rutila undefined" | All In has a verb ("goes All In") and its own fall lines. | `src/narrate.js` |
| "87.999%" | Within 0.01 of a whole number, show the whole number (never 0% or 100%: the cap stays 99.999%). | `fmtPct` |
| "three cards" with four dealt | The hint and the text port count the cards; the Augur's gift offers no spin. | `src/hints.js`, `scripts/play-text.js` |
| "a Imperial Gladius" | a/an. | `chooseFortune` |
| "[legendary gear] Leather Vest" | A gear card is labelled by the item it holds. | `fortuneCard` |
| The Augur's "three rare relics" included legendaries | "rare or legendary relics". | `PATRONS.augur`, `LEGACY_LEVELS` |
| The Wolf's Pelt and Distracted | Its text: "while your fighter has an injury that counts toward the Death Gate". | `src/fortune.js` |
| The Fates' Wager's "top bout" | "Win this month's top-arena tournament" (what it always meant). | `fortuneText` |
| The Boss card's Favour | Shows the halved loss for falling before the Final. | `arenaStakes`, `src/explain.js` |
| Text port: no signature warning; a disabled signature offered; the crowd's payout hidden; no Legacy XP at the end; no Hall for `--legacy`; "1 months left" | All fixed. `--legacy` brings a sample Hall of two legends. | `scripts/play-text.js` |

## Not changed (yet), for the designer
- **The economy curve** (a Gold famine in year 1, a glut in year 2): the Trainer fee rising for every trainee is the main
  famine; late Gold sinks would help the glut. Suggestions in LLM-13 section 5, item 6.
- **Counter + Feint + First Strike stacking to +30%** (LLM-13: a +1 Delta Boss Final at 95% with a level-2 tell). The tactics
  gate (reading the opponent beats Steady by 3–15 points) still passes; watch it.
- **Repeated names** across the Market, Fortune and opponents.
- **"Retire with honour" wants from the champion mid-climb** (LLM-13): a pay-off at the end of a career would help.
- **Bracket hype resets each match** (LLM-13 suggests carrying half through a tournament).
