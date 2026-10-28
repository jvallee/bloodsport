# Changes from LLM playtest #4 (docs/playtest-llm-4.md)

## Fixed (with tests)
- **Advice for beaten favourites:** a fighter who was the stronger side (average Delta +2 or more) and lost is told so, not "an even fight that went the other way".
- **Bracket opponents never share a name.** Each one's name is excluded from the next.
- **The `math` narration lists every win-chance bonus,** e.g. First Strike +10%, Press +3%, Counter +10%, with whose bonus each is.
- **Poisoned counts as two injuries** on the odds line.

## Balance
- **Early bracket opponents are truly weaker:** their total Power, gear included, is the Final opponent's −4 and −3. Gear used to cancel the gap.
- **Losing a Boss bracket before the Final costs half the Boss-loss Favor.** It used to cost the full −25.
- **Whole-tournament odds:** a bracket arena's odds line names the next opponent and adds the odds of winning every remaining match. They're multiplied and ignore carried-over injuries, so they're optimistic.
- **Tried and dropped: a Prestige reward for early bracket wins** (a way out of the Prestige spiral). It took careful careers from 41% to 54%.

## Not changed
- **The Prestige spiral at the Imperial Coliseum** (buy-ins and losses drain Prestige, blocking Trainer level 5). Still open.
- **"Tactics are mostly rote"** (humors play to type 70% of the time). Playtest #3 found 50–60% too random, so 70% stays as the middle ground.
- **Events "almost every week"** (they fire 30% of weeks, never repeating within 5).
- **Lower arenas stop paying after tier 2,** because of Champion and crushing-win penalties.

## Balance snapshot (`npm run check`, 300 careers)
All 9 gates pass:
- careful win 41%, careful vs reckless +41 points, careful deaths 0.07× reckless
- reckless deaths 2.97
- balanced build best vs 2 of 4 Bosses
- first Boss won 67%
- reading opponents beats always-Steady by +8 and always-Press by +6
- the Grand Tournament is 15 points harder than the first Boss
