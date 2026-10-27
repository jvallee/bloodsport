# Changes from LLM playtest #3 (docs/playtest-llm-3.md)

## Bugs fixed (each with a test in tests/playtest3.test.js unless noted)
- **Odds now include Gods' Days, feuds and vengeance.** `estimateOdds` didn't receive them.
- **Event choices show their stakes** under each button: "−2 Gold; Vex: +15 Morale for 4 weeks, −10 Stress". Gambles read "60%: +6 Gold, Vex: +2 Renown; otherwise: Vex: Flesh Wound". Same in the text interface.
- **Scouting fades** over the winter and when you move up an arena.
- **A settled festival week** previews next month's bout without the festival.
- **Upsets and crushing wins** are judged on the Power each side fought with in Round 1 (decor, augments, feuds, festivals), and so are the crushing warnings.
- **Names of the dead never return** (`run.graveyard`).
- **Houses:** an arena's opponents fight for a house that has climbed that far (or the leader), and a house's tier updates as soon as its Glory changes.
- **Disarm narration names who did it:** "Gannicus is disarmed by Decima's Fists."
- **Text interface fixes** (no tests): the doubled retirement line, "1 week passes", and `help` now lists all five decor items. Opponents show their humor, and fighters their augments.

## Balance and design
- **Event Morale is a mood that lasts 4 weeks.** A one-off bump drifted away within the week, which made "Punish them both" and "Sell the lot" strictly better.
- **Events can't repeat until 5 others have passed.** The spy came up five times in one career.
- **Humors are easier to read.** Each one picks its favourite tactic 70% of the time (was 50–60%). The playtester saw tells hold only about half the time.
- **The ★ suggestion uses expected value.** It weighs:
  - the counter odds against the opponent's habits;
  - the tactic's own effects;
  - Feint × the chance to strike first;
  - festival bonuses (it now Presses during the Armilustrium).
- **Mid-game difficulty.** Bronze and Silver opponents get +3 Power (Bronze 12/13/14, Silver 16/17/18). The playtester called Dirt Pits to Silver "too easy" and found a wall at the Imperial; the steps are now even. Careful careers win 28%. Reckless deaths fall to 2.89, so that gate is back at its original limit of 3 (it was briefly raised to 3.5).
- **Cyborg surgery** costs 10 Gold + 4 per tier above 1 and 1 Renown. It was 15 + 5 per tier and 2 Renown, and never worth it.
- **Juggernaut** gives +1 Power and −5% chance to be injured. It used to duplicate Mighty.
- **The balance check's Speed model** now gives the synthetic fighter its tier's market bonus (+2, +4, +6 Power), like a fighter you'd actually buy there. Against the stronger Bosses, the old base-5 fighter was hopeless at every split (16–28%).

## Not changed: needs the user's decision
- **A favourite who loses a round is wounded like an underdog.** The Power Delta table (from the design doc) sets the round loser's injury chance by the size of the Power gap, whichever side is stronger. Example: at Delta ±7, a Power-21 fighter who loses a round to a 14 faces a 90% wound check. Options:
  - **(a)** Keep it: fights stay dangerous.
  - **(b)** Use the winner's lower injury chance when the stronger side loses a round.
  - **(c)** Use a middle value.
- **Lower-arena Titles are nearly free.** Every fighter collected 2–3, each worth +1 Power.
- **Winter has no income.** Possible fix: a winter exhibition bout or a stipend.
- **The rival houses work as a fight modifier more than as a race.** Possible fix: a house that wins the Grand Tournament first ends your career, or takes your top-arena slot for a season.

## Balance snapshot after these changes (`npm run check`, 300 careers)
All 9 gates pass:
- careful win 28%
- careful vs reckless +28 points
- careful deaths 0.07× reckless
- reckless deaths 2.89
- balanced build best vs 2 of 4 Bosses
- first Boss won 66%
- reading opponents beats always-Steady by +8 and always-Press by +6
- the Grand Tournament is 25 points harder than the first Boss
