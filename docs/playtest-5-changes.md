# Changes from LLM playtest #5 (docs/playtest-llm-5.md)

## Fixed (with tests)
- **Names are never reused while their owner lives.** That covers waiting rival Bosses, bracket opponents and the last 30 opponents (e.g. "Morg" was a Boss and a Dirt Pits fighter at the same time).
- **The match-deciding round leaves no "next round" effects** (the net "entangling" after the match was over).
- **Advice is judged on the round chances actually faced,** not the Power gap alone. Losing rounds you were 75% to win is the dice, not "out-powered".
- **Mortal Danger shows the chance of dying,** both between rounds and before Round 1 when a fighter enters already hurt. It's simulated on copies of the match, so the real fight's dice are untouched.
- **Text fixes:**
  - the Lions in the Arena tips
  - "1 injury" wording
  - `help` lists every item
  - the storeroom reprints after equipping, so `sell-gear` numbers stay right

## Changed
- **The new items are cheaper:** Iron Tonic 6, Viper Venom 7, Berserker Mushroom 8, Throwing Net 5, Smelling Salts 6.
- **Events fire 25% of weeks** (was 30%).
- **Last-plot warning:** the Estate warns before you build on your last free plot.

## For the user to decide
- **Speed may be too strong.** It trains +3 a point (Power +1). High Speed gives First Strike, the Feint bonus and evasion together. The balanced-build gate still passes, but a human playtester found Speed builds dominant.
- **The Bronze wall:** opponents jump from about 8 to about 14 Power, while the Trainer cap stays at 5 until House level 3. One option is to unlock Trainer cap 8 earlier, or to smooth the Bronze opponents.
- **New weapons and perks are rarely seen:** a Fighter is 1 class in 9, and then 1 weapon in 9. One option is to weight the new content up for a while.

## Balance snapshot (`npm run check`, 300 careers)
All 9 gates pass:
- careful win 38%, careful vs reckless +38 points
- careful deaths 0.08× reckless; reckless deaths 3.18 (gate 1–4)
- balanced build best vs 2 of 4 Bosses
- first Boss won 67%
- reading opponents beats always-Steady by +8 and always-Press by +7
- the Grand Tournament is 18 points harder than the first Boss
