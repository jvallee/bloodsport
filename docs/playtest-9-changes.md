# Playtest #9 (LLM) changes: version 5.3.0

The playtest (`docs/playtest-llm-9.md`) played a full career on seed 9009 (343 commands, about 69 weeks, stopped alive at the Imperial Coliseum) and a short career on seed 9010 (102 commands, stuck at the Bronze Boss). It was the first playtest of 5.2.0's features and of 5.3.0's.

## What the tester said about the new features

- **Basa in the Market:** works and is fair; a Basa ended as the second-best fighter.
- **The Unnatural Temple of Vulcan:** fun, and fair for the Gold. Raising a fallen Titled fighter was a highlight; finding 14–24 Gold inside the 4-week window was the exciting part.
- **Lower arenas moving on:** works, but it was silent.
- **The rebel's confession:** "the best writing in the game", and it clearly reflected the mercy record.
- **Nemeses:** the best 5.2.0 feature.
- **The Emperor's demands and betting:** broken (below).

## Bugs fixed

| Report | Fix |
|---|---|
| Every Emperor's demand failed the moment it was issued (the new month issued it, then the ended fight day judged it) | Judged when fight day ends, before the new month can issue the next. The Emperor's line now plays, and a demand can be met. |
| Bets on favourites returned only the stake | Odds shown as ×odds with the return and profit; a stake that couldn't win anything is refused |
| Short careers started at House level 1 with 17 Prestige | They start at level 2 |
| The spare choice promised a debt that a house already owing you doesn't renew | It says "already owes you a life (N months left): no new debt" |
| Feud and debt months missing from the text port's opponent line | Shown |
| A lower arena moving on was silent | The house log says which stage it held and who's next |
| A Revenant's chronicle logged a second "First win" | A Revenant's wins from before death count (`winsOf`); the Ludus marks them "risen" among the fallen |
| Grave Chill read as the opponent's own bonus in the math | Labelled with its owner: "Grave Chill (Grosh)" |
| Perks printed twice on text-port fighter cards | Once |
| "it went badly, Dacia is Flesh Wound." | "It went badly, Dacia is wounded: Flesh Wound." |
| A Boss promised a Title to a fighter who already held it | The stakes say the Title goes to a fighter who isn't the arena's Champion yet |
| Flesh Wounds never healed on Rest (also playtest #8) | They heal on Rest at half speed (2 weeks) |

## Left for the designer

- **The Bronze wall** (both careers stalled there; also playtests #5 and #8). Options from the tester: flat 2-Gold training below Silver, or the Bronze Boss at Power 13.
- **Android-style names on other kinds** ("Unit Sigma · Elf").
- **Scouting a Boss you meet once a circuit** reads oddly after a Tournament 2 in the same arena.
