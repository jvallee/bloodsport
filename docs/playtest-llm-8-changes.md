# Playtest #8 (LLM) changes: version 5.1.0

The playtest (`docs/playtest-llm-8.md`, seed 8008, 478 commands, about 87 weeks) checked 5.1.0, after the designer's notes. No fighter died; the career was #1 of four houses at House level 5 when the budget ran out.

## What the tester said about the new features

- **Tutorial month:** clear and helpful.
- **Slow Morale decline:** works; there was always time to react.
- **Injuries:** felt fair, maybe too rare.
- **Seasoned recruits:** "not seasoned enough" (left as is: Market fighters are meant to be trained up).
- **Temple of Fortuna:** fun but marginal.
- **The Power preview:** it matched Round 1 every time.
- **The Emperor's dialogue:** lands well.

## Bugs fixed

| Report | Fix |
|---|---|
| A disabled Unbreakable still held the Death Gate open | `deathGateAt` takes the combatant's disabled slots |
| Feed the Ash spent with no effect while Ash Stacks was disabled | No signature while the class ability is disabled |
| Pre-fight odds ignored the Boss and early-round signature rules | `estimateOdds` passes `boss`, `earlyRound` and `rebels` to the match |
| Distracted waited for the Medbay to heal | A daze passes on its own after a week, whatever the job |
| The text Market showed the base price and no perks | Each fighter's price and perks are listed |
| The purse preview left out the fame bonus | "(+ fame)": +1 Gold per Renown step |
| Thumbs-down text left out its Morale | Shown |
| "It went badly" capitalised mid-sentence | Lower case |
| The text port capped the Death Gate count at the gate | The true count |
| One name was three different fighters in three months; "Varro" was a fighter and a house | Every generated fighter's name is remembered (90). The pool grew from 120 to 180. No fighter shares a house's name. |

## Balance

- **Difficulty curve.** The tester felt a Bronze wall and an easy Silver and up. The bots don't show a backwards curve (150 careful careers): Boss win rates are Bronze 27%, Silver 25%, Imperial 21%. The tester's late game rode on three cheap props, now fixed:
  - **Decor:** comfort scales with price (Bird and Fire Brazier +3 up to Lion Cage +7; every item was +5). A 1-Gold Bird no longer keeps a star happy for good.
  - **Owed lives:** sparing no longer renews a life a house still owes you (one house fought at −1 Power for 13 months).
  - **Exhibition Ring:** XP 2 / 1 and 1 Gold × tier (was 3 / 2 and 2 Gold × tier).

## Open for the designer

- **Lower arenas you never fight in stay frozen** on the same opponent (now raised by three playtests).
- **The text port always answers the Emperor "I will."** The reply choice can only be tested in the browser.
- **The old tutorial tips trickle in** for a year after the tutorial month (some arrive late, such as Stress). They could be folded into the month, or shown only when they first matter.

## Gates after these fixes

`npm run check`, 300 careers: all 12 pass.
- Careful 43%, careful deaths 0.85, reckless deaths 3.95 (just under the limit of 4: more deaths came with the injury rework).
- Balanced build best vs 2 of 4 Bosses. First Boss 68%. Tactics +7, always-Press −6. Grand +21 points harder.
- Loyalist +7 over careful. Coup 17% of rebel careers. Treason 1%.
