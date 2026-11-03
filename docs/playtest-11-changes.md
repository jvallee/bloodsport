# Playtest LLM-11: changes (5.4.1)

From `docs/playtest-llm-11.md` (seed 11011, the quests and the rival house) and `docs/playtest-llm-11-plot.md` (seed 11012, the rebel road).

## The rival house

- **The champion was rarely met.** Measured over 40 careful-bot careers: it was put on the card about 4 times a career, but from the Silver Coliseum only as the bracket's Final, which most fighters never reach. Now, when the champion is the arena's opponent and the bracket is drawn, it goes into the Quarter-final, Semi-final or Final with equal odds (`rng.rivals`). The fighter it displaces takes the Final at the Final's usual strength, and the other rounds are measured from the Final without the champion's bonus. A bracket win over the champion pays like any other (`finishBracketMatch`).
- **The archrival was the default opponent:** 73% of the opponents in those 40 careers fought for it, because it climbs ahead of the other houses and is often the only house in your arena. Now only `RIVAL.oppShare` (20%) of the opponents in an arena where the archrival fights come from it; the rest come from the other houses there, or from any other house if none has climbed that far. Measured again: 17%.
- **The champion's name** is now kept off every other fighter (`takenNames`).

## Wants

- **A Championship want** needs the fighter within `FIGHTER_WANTS.titleReach` (3) Power of the arena's Boss (a Power-15 fighter asked for the Imperial Coliseum).
- **Room wants** pick among the items the fighter lacks, varied by fighter and week (no dice, so nothing else shifts). They always asked for a Bathhouse.
- **Mentor wants** skip a pair who both won last fight day, since they become friends that week anyway (one was asked and met in the same week). The goal now says how to meet it.
- **Revenge wants** skip a nemesis fighting in an arena where the fighter is Champion (a win there costs Favour and Morale).
- The revenge want's label now reads "Beat X", as its goal does.

## The steward

- **Assignments already done** were skipped without a word or any Gold (6 in one career, including two Titles and House level 3). They now count: the steward says so in one line and pays their Gold together. Those done before the first assignment (week 4) are still not paid.
- **Five new middle assignments** for the long arenas: upgrade the Trainer Room (level 2, then 3), and win a tournament in the Bronze Arena, the Silver Coliseum and the Imperial Coliseum. 19 assignments in all.

## Talk

- **At most `QUESTS.talkPerWeek` (2) quest, want, rival and friendship scenes a week.** The rest wait in `run.talkLater` and come first in the weeks after, in order. The rival champion's arrival never waits. (One week printed 13 lines.)
- **Friendships:** the pair's lines come from four pairs, chosen by the two fighters; the steward explains friendship in full only the first time.

## The hidden plot

- **The Emperor's spy:** the card now says in words what keeping them costs (the numbers stay hidden), and what executing them gains. A spy you keep is marked 👁 on their card and in their story. The spy is never your most famous fighter, and the rebels never name a kept spy as their champion.
- **The Whispering Gallery request** says it needs a free plot. The readout uses words, not stage ids, says what "ready" waits for, and says when everything is in place and the next step is coming.
- **The cause's rewards:** trust past the cap (10) now lowers suspicion by `REBEL_QUEST.overflowSuspicion` (5) a point instead of being lost. The lobby request no longer tells you to build a Lounge you already have.
- **At the ready stage,** refusing favours no longer counts toward the plot going cold, so a careful player can keep their head down until the Grand Tournament.
- **The hidden stranger** now takes a Medbay bed from a patient when the Medbay is full (it cost nothing).

## Small fixes

- An opponent's card listed "owes you a life" while a feud overrode it; it now shows only the feud.
- The Ludi Apollinares text now says "a Fighter armed with a Bow, Gun or Spear", which is the rule (bow gear doesn't count).
- A one-level building's Codex entry said its effect twice.
- Text port: quests are noticed after every command (as on the page); `help` no longer lists the secret Gallery; the Emperor's met and missed lines now print; "(Can't end the week: …)" after a successful `end-week` now reads "(Before this week can end: …)".

## Not changed (for the designer)

- **The winter tribute line** ("my collectors have knocked on your door") plays even when the tribute was paid early. It's the designer's text, so it's left as it is: perhaps a line that works either way.
- **"You have bought fighters, and then set them free"** counts any release, even one to make room. Also the designer's text.
- **A rescue card names a prisoner** ("Buy Nocturne… in the Liaison's cells") who isn't the Liaison's offer that month. It's a separate deal, paid on the card; the wording could say so.
- **Sparing against the crowd** in your top arena adds hidden suspicion, while the rebel's confession praises it. That's intended tension, but the tester found it contradictory.
- **The Silver wall** came up again in both careers (Power 14–15 against Silver Finals of 19–20). It's the open decision in `docs/playtest-10-changes.md`.

## Tests changed on purpose

- `tests/quests.test.js`: an assignment already done is now paid with a word, not skipped silently (the steward's line may wait a week).
- `tests/houses.test.js`: the opponent is rarely the archrival now, and the other houses may start at 0 Glory, so the test gives its opponent's house some Glory to lose.
- `tests/playtest3.test.js`: "houses that have climbed there fight there" now names a house that isn't the archrival; a new test covers the archrival's share.
- New: `tests/playtest11.test.js`.

## Balance

- The first check after these changes: 12 of 13 gates pass (careful 44%, loyalist +12, coup 22%, treason 1%, Grand +20, first Boss 70%), but **short careers won 60%** (ceiling 55%). 5.4.1 was pushed like that on the designer's request.
- The probes found the cause: the steward's Gold (no steward Gold: short careers 47%). The rival share and the trust overflow made no difference. 5.4.2 pays the steward's assignments ×0.2 (1–2 Gold); all 13 gates pass. The table is in `docs/fight-rules.md`.
