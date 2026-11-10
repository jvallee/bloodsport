# Changes from playtest LLM-14 (version 6, phase 6)

Report: `docs/playtest-llm-14.md` (a first season, seed 14014, on 6.0.0-beta-dev.2: won at the first Grand Tournament
try, 47 weeks, no fighter lost).

## What it said
- **The faster season works for the first four months** (Bronze fell in month 4, with upsets earned through reads),
  then Silver brought a Gold famine.
- **A lost Boss came back weaker**, and the whole rematch bracket with it: the season's extra opponent Power was dropped.
- **Fortune's fighters became the house's best** (Natural 34 and 41 against the house's 5–12, with a full Trainer cap
  still ahead).
- **Reading a faster Feinter was worth nothing;** flat +1 bonuses could switch Underdog off; Speed beat Power from Silver up.
- The crowd now reached its mark in about 9 of 36 fights (1 in 30 in LLM-12).
- Would start another career, "mainly to chase another Natural-41 draft card, which is a warning sign".

## Changed

| Finding | Change | Where |
|---|---|---|
| A lost Boss came back 11 Power weaker in a season (35 → 24), and the rematch bracket with it | One function gives an arena opponent's Power for this career (the table plus a season's, Hungry Lions', Iron Bosses' and the Senate's lions). A lost Boss returns at that +1; the summons and the Championship want read it too. | `arenaPower` in `src/run.js` |
| Drafted fighters outgrew the house | A drafted fighter's catch-up is training done elsewhere: it counts toward the Trainer cap (`trained`, `trainedPower`), like a Liaison prisoner's. A prisoner's prior training now counts in training weeks (a season's give 2 Power), not points. | `keepUp`, `liaisonOffers` in `src/run.js` |
| A correct read against a faster Feinter netted about −7 | A Feint countered by Press loses its +10% first-strike bonus. The suggestion weighs that. | `playRound`, `suggestTactic` in `src/fight.js` |
| The crowd's +1 or a relic could switch off Underdog's +2 | Underdog tops up to the gap, up to +2: +1 at a gap of 1, +2 at 2 or more, nothing at equal Power. A bonus never costs Power. **One test changed on purpose:** "a 1-Power gap is not enough" (playtest #6) now expects +1. | `computePower`, `KINDS` trait text |
| The text port's end screen showed "+108" with no destination | It shows the Legacy level, XP to the next, what unlocked and what's next. | `scripts/play-text.js` |

## Checked and not changed
- **"The Death Gate suggestion should read the tell"** (it's always Guard). Measured over 3,000 rounds at the Death Gate
  (equal Power, two injuries): against a Feint, Guard dies 13.6% of the time, Press 16.7%, Steady and Feint 18.9%. Guard
  rarely wins the round there, but it's the safest choice, which is what the suggestion is for.
- **All In is "free" when far ahead:** when the round is nearly certain to be won, its +20% costs almost nothing; in close
  rounds it's much worse than fighting on. That's a clear rule rather than a bug; making it a gamble in every case (a flat
  chance to fall) is a design call, listed for the designer.
- **The RIVAL label on a Boss who never fought you** is the game's own rule: a Boss who wins the bracket waits for you,
  stronger ("never had to fight you… waiting next time").

## For the designer
- **The Silver-tier Gold famine** (training fees of 4–5 Gold a fighter-week against purses of 6–22). It joins the economy
  curve from LLM-13.
- **Speed beats Power from Silver up** at the season's training rate (+6 Speed a week crosses the first-strike threshold
  fast). The balanced-fighter gate still passes; a hint on the training job would make it a visible choice.
- **The Round 3 pile-up** (the opponent's signature, Closer and humour penalties all land in Round 3).
- Text port: drop the tribute and odds from the post-career screen; the Emperor's intro reprints on week 2.
