# Plan: rival houses, fighters' wants, and quests (5.4.0)

The designer asked for (2026-11-02):
1. Rival houses that compete.
2. Fighters who want things.
3. More dialogue, and quests: the steward's assignments to restore the house; the resistance's requests (lobby for legislation, build a building that tracks the Emperor's suspicion and the rising's progress).

## Goals and limits

- Every new rule is a tunable in `src/data.js`; every new line of dialogue is a PLACEHOLDER first draft in `src/quests.js`, listed in `docs/text-to-rewrite.md`.
- Careers must still replay exactly: new dice come from **new RNG streams** (`rng.wants`, `rng.rivals`), so the fights, the market, the events and the plot draw exactly what they drew before.
- Old saves load: every new field is optional (`?? default`); the archrival is derived when missing.
- The hidden plot stays hidden: nothing about the resistance shows before the player has copied the chalk sign (plot stage `favours`).
- All 13 gates must pass. The careful gate sits at 44% (limit 45%), so rewards start small and are measured.
- The bots must meet the new systems, or the gates measure nothing (CLAUDE.md).

## A. One mechanism for new dialogue: `run.talk`

Quests need characters to speak at moments decided by the rules (a want appears, an assignment is done). Today scenes are chosen by the page (`checkScene`) from rules in `src/dialogue.js`.

- **Design:** the rules append `{ key, week, beats }` to `run.talk` (kept to the last 30). A beat is `{ speaker, text, fighterId? }`. The page plays the first entry whose `key` it hasn't shown (per career, `scenesSeen`), resolving `fighterId` to the fighter's name and face; the text port prints new entries after each command.
- **Why not compute them in `dialogue.js` like the rebel scenes?** A want's lines depend on the moment it was given (who, which nemesis); storing the words keeps them exact even after the fighter or nemesis is gone.
- **Purity:** `run.talk` is written only by game actions and the week, never while rendering. The page reads it and records what it has shown outside the save.

## B. The steward's assignments: "restore the house"

- `STEWARD_TASKS` (14, in order): two gladiators, a first win, decor in a room, Quarters level 2, conquer the Dirt Pits, a new building, four gladiators, conquer Bronze, a fighter with two Titles, House level 3, conquer Silver, House level 4, conquer Imperial, win the Grand.
- One at a time from week 4 (after the tutorial month). An assignment already done when its turn comes is skipped silently (no Gold, no scene).
- Done: its Gold (2 → 10 by stage, 63 in all), a log line, the steward's line. Checked at the end of every week **and** after every game action (so "Build something" completes the moment you build it).
- **Balance:** ~20 Gold arrives before Silver, where Gold is scarce: it could lift careful careers past 45%. Measure; if needed, cut the early Gold or pay Renown/Favour instead.

## C. What fighters want

- At month start, with `FIGHTER_WANTS.chance` (35%), if fewer than 2 wants are open: pick a fighter and a want they're eligible for (`rng.wants`).

| Want | Eligible | Met | Lasts |
|---|---|---|---|
| Revenge | a nemesis beat this fighter (`nemesis.beat`, new) | this fighter beats that nemesis | until the nemesis is gone |
| Title | level 3+, not yet Champion of the top arena | they become its Champion | 24 weeks |
| Room | missing one of Bathhouse, Shrine, Trophy Rack | that item is in their room | 6 weeks |
| Mentor | level ≤ 2, unbonded, and an unbonded level 4+ veteran exists | bonded with that veteran | 12 weeks |
| Retire | level 5+ with 2+ Titles, retirement allowed | you retire them | 12 weeks |

- Met: mood +10 for 4 weeks, +2 Renown, +2 XP, the fighter's thanks, a chronicle line. Retire's reward is the retirement itself plus the thanks.
- Lapsed (or impossible, e.g. the nemesis died elsewhere): mood −10 for 4 weeks and a sulk (not for an impossible one: it just goes).
- Shown: a 💬 chip on the card (tap: what it takes, weeks left), the Quests panel, the Compare table.
- **Review fix:** a fighter who dies, retires or leaves takes the want with them; a Revenant keeps none.

## D. Rival houses compete

- **The archrival:** the house that starts with most Glory (no dice, so old saves agree). It climbs with you (its tier is at least your top arena's) and gains `RIVAL.monthGlory` × tier Glory every fight day, so the year-end purse is a race.
- **Its champion:** named (from `rng.rivals`) once your top arena is Bronze. They come back as a top-arena opponent (Tournament 1 or 2, or a bracket Final; never a Boss) after 12 weeks, 35% a time, at the bout's Power + 1 + their wins over you (up to +2).
  - Beaten: 4 Gold × tier, +3 Renown, their house −5 Glory. Beats you: their house +3 × tier Glory, +1 win. Killed (in the match or by thumbs down): a new champion is named later.
  - The rival Lanista speaks (taunt, arrival, defeat).
- **Poaching:** some months (25%, `rng.rivals`) the archrival eyes the Market's best fighter at the month's start and buys them at the end of week 1 unless you do (logged both times).
- **Review fix:** the champion uses `rng.rivals` for its own dice, but `seasonOpponent` (perks, gear) draws on `rng.opponents`, which shifts every later opponent. That is acceptable (the gates are rerun), but it means old careers diverge from their replays only if replayed on new code, which is already true of any rules change.

## E. The resistance's requests

- Given by the political prisoner (or a note under the door if none is in the house) at a month's start, while the plot runs, from 4 weeks after the Mark.
  1. **Build the Whispering Gallery** (16 weeks): +1 trust. Asking reveals the building in the Estate (`secret` until then).
  2. **Lobby:** pass a reformist policy (Edict of Mercy, Lower the Tribute or Amnesty, the first not in force) at the Patron Lounge (16 weeks): +2 trust.
  - Lapsed: −1 trust and a sulk.
- **The Whispering Gallery** (unique, Prestige level 2, 10 Gold, one level): the Ludus shows the palace's suspicion (with the watch, informer, raid marks) and the rising's progress (stage; trust, favours and weeks still needed for the next). Suspicion −2 a month.
- **Hidden plot:** the building is absent from the Estate, the Codex and the steward's "new in the Estate" news until the rebels ask. The Quests panel shows "The cause" only once a request exists.
- **Bots:** the rebel bot builds the Gallery and passes the asked policy when it can (the loyalist and bystander don't).

## F. Interface

- **Quests panel** (Ludus, under the week): the steward's assignment and its reward; each fighter's want; the cause's requests; the Gallery's readout.
- **Card chip** 💬 for a want; **Compare** table gains a "Wants" mark.
- **Text port:** `quests` command; new talk printed after each command.

## G. Tests

- Steward: chain order, skip-if-done, Gold paid once, checked after an action.
- Wants: each type's eligibility, met and lapsed; dies/retires cleanly; old saves.
- Rivals: archrival without dice; climbs with you; champion appears, wins/losses, killed; poaching; old saves.
- Resistance: asked only after the Mark; gallery hidden until asked; met/lapsed trust; gallery suspicion; readout.
- Talk: keys unique; capped at 30; resolves fighters.

## H. Order of work

1. `run.talk` + the page/text port showing it.
2. Steward assignments + panel.
3. Wants + chip.
4. Rival house + champion + poaching.
5. Resistance requests + Gallery + bots.
6. `npm run check`; tune; docs; text index; browser check; commit after each step that passes the tests.

## Review (before building)

- **Spoilers:** the Codex auto-unlocks buildings by House level (`codex.js:184`) and the steward lists new buildings by level (`dialogue.js:241`). Both must skip `secret` buildings, or the Gallery gives the plot away. Fixed in the plan (E).
- **Too many dialogues at once:** a first load of an old save, or a busy fight day, could queue three scenes. Each plays on its own; that's acceptable, but the steward's skipped assignments must stay silent (B).
- **Bots:** the careful bot meets steward assignments naturally (it builds, wins, recruits). Wants are passive except Retire, which no bot does (fine: it lapses). The rebel bot needs the Gallery and lobbying (E).
- **Balance risk is mostly Gold:** steward Gold (63) and champion purses. Watch the careful gate; the first lever is steward Gold.
- **Replays:** every new draw is on a new stream, and `run.talk` is part of the save, so bug-report replays still match.
- **Lapse versus impossible:** a want that becomes impossible (nemesis killed by someone else, mentor gone) is dropped silently, never a sulk.
- **Mercy kill of the champion** happens in `resolveMercy`, after `finishMatch`: the mercy record must carry `rivalChampion` so a thumbs-down counts as a kill.
