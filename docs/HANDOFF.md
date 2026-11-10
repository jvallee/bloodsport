# Blood and Circus (formerly Bloodsport): handoff for the next agent

Last updated 2026-11-02, at **version 5.3.0** (committed locally; the designer pushes it to publish). Read this file first, then `CLAUDE.md` (the project rules), `docs/fight-rules.md` (every rule and number) and `CHANGELOG.md` (what changed, version by version).

## 1. What this is

**Bloodsport** is a gladiator-house management roguelike. You run a ludus (a gladiator school): recruit fighters, train and heal them, equip them, and send them into three-round fights across four arenas and a Grand Tournament. Death is permanent, and Imperial Favor at 0 gets you executed.

- **Repo:** `/Users/jasonvallee/Documents/claude_practice/Blood Sport`. The branch is `main`, pushed to GitHub.
- **Live game:** https://jvallee.github.io/bloodsport/ (GitHub Pages serves `main` as-is).
- **Frozen versions:** `/v1/` to `/v5/`, tags `v1.0`, `v2.2`, `v3.0`, `v4.0`, `v5.0`.
- **Stack:** plain HTML/CSS/JavaScript ES modules. No build step and no dependencies. Saves go to `localStorage`. Tests use `node --test`.
- **The user** is the designer and owner. A local design doc (`Bloodsport — Game Design Document & UE5 Proposal.md`, not committed) holds the original vision.

## 2. How the user likes to work (important)

- **Be autonomous.** Implement worthwhile feedback without asking, then report clearly what changed and why. The user often hands over a batch of requests and goes to sleep. Finish everything, playtest, and leave a clear morning report.
- **Goal:** make the game "very user friendly, fun, addictive and immersive". The user welcomes proactive fun ideas (end reports with a few), and likes it when you go ahead and build the small ones you suggest (2026-11-01).
- **Commit often** with clear messages. Run `npm test` before every commit. **Never weaken, skip or delete a test.** When a deliberate rule change breaks a test, update the expected value and say so.
- **Balance:** every balance or rules change must pass `npm run check` (13 gates; it takes 5–15 minutes, so run it in the background). When a gate fails, sweep the values and pick from a table; don't guess.
- **Docs:** record every number change in `docs/fight-rules.md`, and every player-visible change in `CHANGELOG.md` under "Unreleased" (the user likes a summary of changes between versions).
- **Versions:**
  - A new major version is frozen into `/vN/` with a tag.
  - The user sometimes asks for updates to go into the current version in place ("this can also be a part of v5"). Then refresh `/v5/` with **no new tag**, as was done for v3 (commit `8a7effa`) and v5 (commit `3f1c5f2`).
- **Earlier decisions to respect:**
  - Auctions are on hold.
  - The Power Delta table's "favourite loses → wounds" rule stays as it is.
  - Titles can still be won in lower arenas (a proposed "top-arena-only title Power" change was rejected).
  - The user is fine with lower careful win rates.
  - The user wanted death to be **more** likely.
- **Address the user as they/them.** Their email is only for git authorship.
- **Spelling:** British in everything players read (armour, Favour, colour, favourite). Code names stay as they are, because they're save data: `run.favor`, the gear slot `'armor'`, `egoArmour`.
- **The user writes the story text.** Lines marked PLACEHOLDER (dialogue, demands, plot cards, nemesis epithets, policies) are first drafts for their rewrite. `docs/text-to-rewrite.md` lists every line with its file and line number (regenerate it after big edits). The user edits `src/dialogue.js` and `src/tutorial.js` directly. Check `git status` before editing those, and never overwrite their uncommitted text.
- **When the user lists playtest notes,** fix the bugs, build the agreed features, run `npm run check`, and finish with an LLM playtest (section 6) whose findings you also fix.

## Tried and rejected: a higher training cap for veterans (v5)

The user asked for each level to add +1 week to that fighter's own Trainer cap. It was built (`e26085f`) and reverted (`f80b949`) because it broke the careful-win gate (limit 45%). Careful career win rates, 300 careers each:

| Variant | Careful wins |
|---|---|
| No bonus (shipped) | 43% |
| +1 week per level | 85% |
| +1 week every 2 levels | 64% |
| +1 per level, from level 4 | 64% |
| +1 per level from level 4, Market Power bonus halved | 61% |
| No bonus, Market Power bonus halved (0/1/2/3) | 37% |

Every fighter is limited by the cap, so any extra cap adds Power across the whole roster. The user's real complaint (a late prisoner far too strong) was fixed at the source instead: see playtest #7 below. Halving the Market's Power bonus is an untried option for keeping veterans ahead of recruits.

## Start here: the current state (5.3.0)

5.3.0 is pushed and live (2026-11-02). 5.4.0 (the Bronze wall) is in progress on top of it. All 482 tests and all 13 gates pass:

| Gate | Value |
|---|---|
| Careful career wins | 41% |
| Careful deaths per career | 0.71 |
| Reckless deaths per career | 2.96 |
| Loyalist wins over careful | +5 points (at the edge of its gate) |
| Coups (share of rebel careers) | 19% |
| Short careers won | 42%, in 80 weeks (full careers 111) |

The demand fix changed the balance: 5.2.0's numbers were measured while every demand silently cost Favour. Demands and short-career purses were re-tuned (tables in `docs/fight-rules.md`).

**What 5.3.0 added** (details in `CHANGELOG.md`; numbers in `docs/fight-rules.md`, section "5.3.0"; tests in `tests/v53.test.js`):
- **The Unnatural Temple of Vulcan** (`BUILDINGS.vulcan`, `REANIMATE`, `reanimate`/`raisable` in `src/run.js`) replaces the Stables. It raises a fighter killed in the arena as a **Revenant** (kind `revenant`, traits Deathless / Grave Chill / Cinder Heart, Morale fixed at 50). The name and all its words are PLACEHOLDERS; other names offered: the Forge of Vulcan, Vulcan's Unhallowed Forge, the Temple of Dis Pater.
- **Basa in the Market** like any kind, base Power 6 → 5 (measured with `scripts/probes/kind-value.js`).
- **Lower arenas move on** when nobody fights there (`arenaMovesOn`), with a log line.
- **The rebel's confession** (`rebelScene`, `houseRecord`, `dueRebel` in `src/dialogue.js`): the first political prisoner tells you about the rising, coloured by your record. All lines PLACEHOLDER. A dialogue beat with `fighter` speaks with that fighter's name and face.
- **The designer's notes:** one starting gladiator in the tutorial month; the top bar shows Prestige to the next level; feuds show months left; sparing earns no Favour when the crowd or the Emperor wanted a death (`spareFavor`).
- **Fun ideas built:** the rebel speaks again at each plot stage (`rebelStageScene`, `dueRebelStage`); a Revenant's first fight back gets the crowd's chant (+20 hype, `HYPE.risen`).
- **A bug report:** game actions that settle no match (exhibition, host, bet) must return nothing; `act` in `src/main.js` reads any result as a match summary.
- **Playtest #9 fixes** (`docs/playtest-llm-9.md`, `docs/playtest-9-changes.md`): demands were judged the moment they were issued (every one failed); betting odds and refusals; short careers start at House level 2; Flesh Wounds heal on Rest at half speed; and more.
- **Bots** now bet (60%+ favourites), build the Patron Lounge last, host and pass policies, and raise the dead. Betting cost the careful bot about 39 Gold a career (it isn't an exploit).
- **Tools:** `npm run text-index` keeps `docs/text-to-rewrite.md`'s links on the right lines (section 13 lists every 5.2.0/5.3.0 first draft); `scripts/probes/bot-options.js` (bot options and tunables as JSON) and `scripts/probes/kind-value.js`.

**Tests changed on purpose** (each in the commit message): the Stables tests became Temple/Basa tests; the tutorial tests start with one fighter; the demand test allows the next month's new demand; the rival-houses test keeps Favour topped up (it never fights, and a missed demand now costs 4).

**Open for the designer:**
- ~~**The Bronze wall**~~ decided 2026-11-02 (5.4.0): the Bronze Boss at Power 13 and training at most 2 Gold below Silver. An earlier Trainer cap failed the careful gate (47–53%). Table in `docs/fight-rules.md`, "5.4.0". Gates after it: careful 43%, loyalist +6 (near its edge again), short 47%.
- **The Temple's name**, and the Revenant's balance: at equal Power a Revenant wins 54% (Grave Chill 58%), the best kind, offset by −1 Power at Temple level 1 and no Inspired Morale.
- **How hidden is the plot now?** The confession makes it explicit once you hold a political prisoner (the designer asked for it).
- **The old tutorial tips**, Renown in the mismatch jeers, autoplay after round 1, and when to freeze v6 (all still open from 5.2.0).
- **The loyalist gate sits at its edge** (+5, limit 5–20). Any change that helps careful careers more than loyalist ones will fail it.

**Good next steps:**
1. The designer pushes `main` (GitHub Pages then serves 5.3.0).
2. The designer's text pass: section 13 of `docs/text-to-rewrite.md` lists every new first draft (the rebel's lines, the Temple, demands, policies, nemesis epithets).
3. The next small fun idea, offered and not yet built: when a bonded partner dies, the survivor fights their next match for them (+1 Power, "for Corvax").
4. A decision on the Bronze wall, then an LLM playtest of the early game.

## 5.4.0 so far (2026-11-02)

- **The Bronze wall** is lower (the Boss at 13, training ≤ 2 Gold below Silver) and LLM playtest #10 (`docs/playtest-llm-10.md`, `docs/playtest-10-changes.md`) confirmed it: Bronze took 3 months, not 7.
- **Its fixes are in:** bracket Bloodied Victories, no nemesis from a withdrawal, training resumes after a forced rest (`f.resume`, `resumeTraining`), the spare reason, event stakes with names (`stakesText(eff, sep, names)`), the purse apart from a won bet (`purseGold`).
- **Gates:** all 13 pass. Careful 43%, loyalist +12, short careers 51%. 491 tests.
- **The designer's requests (2026-11-02, later):** careers in slots (`src/careers.js`, a Careers dialog; the old single save migrates), a lost Boss Final keeps its buy-in (Imperial 26/27/28 and the Grand 31 pay for it), the overtraining warning (`overtrainedByWeek`), Emperor scenes for demands met and missed (`run.demandResult`), the rebel's slower reveal (`PLOT.confessTrust`), "Free me" only with two rebels, the Emperor's spy (`emperorsSpy`, `SPY`; an executed spy's body can be raised), auto-play contained to one match, Skip to the result, Ludus columns that scroll on their own. All 13 gates pass (careful 44%, loyalist +9, treason 4%, short 47%). 506 tests.
- **Quests and rivals (2026-11-03, docs/plan-5.4-quests.md):** the steward's assignments, fighters' wants, the archrival house and its champion, the cause's requests and the secret Whispering Gallery, all in `src/quests.js` (words, PLACEHOLDER) and the "Quests" section of `src/run.js`. Dialogue the rules decide on goes through `run.talk` (played once each by the page and the text port). Friendships now get a scene; Afeared is rarer; the spy needs a rebel in place; the Bloodied demand counts kills (demands now pay +2 Favour and 2 Gold × tier, short purses ×1.6, steward Gold ×0.5 to keep the gates). Fixed: a fighter resuming training could share a Trainer Room. All 13 gates pass (careful 44%, loyalist +13, short 53%). 525 tests.
- **5.4.1** (playtest LLM-11, `docs/playtest-llm-11*.md`, `docs/playtest-11-changes.md`) and **5.4.2** (the designer's requests: the Emperor's summons, Afeared rarer and curable, a Liaison line-up of 2–3 prisoners, the steward's drier voice, steward Gold ×0.2, column scroll and Haymaker fixes) are live. All 13 gates pass (numbers in `docs/fight-rules.md`).
- **Version 6** (the designer, 2026-11-09: "make it incredibly addictive and fun; change whatever you want"). Plan: `docs/plan-v6-one-more-career.md`. 5.4.3 was frozen into `/v5/` (own keys `bloodsport.v5.*`). Phase 1 (pace) shipped as 6.0.0-alpha.1: To fight day as the main turn, the month's digest (`src/digest.js`), the steward's plan (`stewardPlan`), a season as the default career, the phone menu and Fight day button. Phase 2 shipped as 6.0.0-alpha.2: the monthly Fortune draft and 21 relics (`src/fortune.js`; `chooseFortune`, `rerollFortune`, `passFortune` in run.js; relic fight bonuses via `matchOptions().relics` → `relicMods` in fight.js), perk tags, and a rebalance to match (tiers 2–4 +3/+3/+4 Power, the Grand 35, Boss win 8 Favour, the Emperor's relic for betrayal). Tests switch the draft off in `tests/setup.js` (`FORTUNE.enabled`); `tests/fortune.test.js` turns it on. Two gate changes, both in docs/fight-rules.md: `speedSplit` keeps the 5.4 gap to each Boss, and the short-career gate compares won careers. Phase 3 shipped as 6.0.0-alpha.3 (docs/plan-v6-phase3.md): Legacy XP and levels (`careerXp`, `levelFor`, `recordCareer` in src/legacy.js; `LEGACY`, `LEGACY_LEVELS` in data.js), the unlock tree (stored per career in `run.setup.unlocks`; `hasUnlock`, `relicInPool`, `fortuneCards` in run.js), Heat (`HEAT`, `setup.heat` → decrees), returning Hall legends (Fortune kind `legend`), the Augur patron, house colours, the daily streak; Silver/Imperial/Grand +1 Power. Bots: the plot, short, careful and reckless groups play a first career; a new 'legacy' group plays with every unlock. Gates now 15 (first career 15–35%, full Legacy 40–60%, unlock cadence; the loyalist gate compares on the same seeds). Phase 4 shipped as 6.0.0-alpha.4 (docs/plan-v6-phase4.md): the live crowd (`hypeOf` floors at 0; Guard drains; at `HYPE.favour` 35 the next round gets +1 Power via `m.a.roar`), the opponent's intent (`opponentIntent`, memoised, same draw as before so Oracle-less fights replay unchanged) and Oracle tells (`m.tells`, `INTENT.accuracy`, `withTell` in `suggestTactic`), All In at the Death Gate (`TACTICS.allIn`, `clutch`; `ROUND_TACTICS` is the triangle), the signature warning (`opponentUnleashesNext`), and screen juice in fightView.js (decider, hit pops, kill shake, confetti, crowd sounds). Tests: tests/fight-drama.test.js. Check: 15/15 (first career 32%, full Legacy 50%). The designer asked to have each tested step pushed as it's made (`-dev.N` versions) so they can playtest live. Next: phase 5 (docs/plan-v6-phase5.md): the gates measure seasons, new gates (season length, dead turns, builds), a shorter season (a won one is ~25 fight months: the Silver and Imperial Bosses take 3 and 4.5 tries), LLM fun playtests.
- **Next (5.x leftovers):** the designer's text pass on section 13 of `docs/text-to-rewrite.md` (now including the steward's new voice, the summons and the Liaison's death-row line). The steward's lines in the tutorial and `src/dialogue.js` were left alone: ask before giving them the new voice. Still open: the Silver wall (both LLM-11 careers stalled at Silver Finals of 19–20); the summons is auto-played and could get a full fight screen.
- **The game is named Blood and Circus** (the designer, 2026-11-02): the title, top bar, intro and download names. Internal names stay `bloodsport` on purpose: storage keys (`bloodsport.*`), the save and bug-report `kind`s, the package name, the repo and its Pages URL (renaming the repo would move the live address). The intro's "an empire of bloodsport" is the designer's text, left as it is.
- **Decor calming is capped at 30 a week** (`STRESS.decorCalm`, `decorCalm`; the designer's choice after a bug report, seed 9754698, where Brutus's room took 80 a week). Still offered: show the weekly Stress change on the fighter card.
- **Open: the Silver wall.** The tester's career stopped at the Trainer cap of 8 against Silver Finals of 18–21, while Silver losses drained Prestige (31 → 5) away from House level 4. Options in `docs/playtest-10-changes.md`. Probe them with a "weeks at Silver" count, as the Bronze table did.

## The state at 5.2.0 (kept for reference)

Everything is committed, pushed and live. All 460 tests and all 13 gates pass.

| Gate | Value |
|---|---|
| Careful career wins | 35% |
| Careful deaths per career | 0.73 |
| Reckless deaths per career | 3.54 |
| Loyalist wins over careful | +6 points |
| Coups (share of rebel careers) | 11% |
| Short careers won | 47%, in 83 weeks (full careers 109) |

**What exists, by release** (details in `CHANGELOG.md`; numbers in `docs/fight-rules.md`):
- **v6 hidden plot** (`docs/roadmap-v6.md`, phases A–F; the Patron Lounge, phase H, now exists too):
  - Political prisoners from the Liaison and a secret thread of event cards, with rescue requests and suspicion.
  - The coup at the Grand Tournament, and the Loyalist, Martyr and Treason endings.
  - Code: `src/plot.js`, plus the "hidden plot" section of `src/run.js`. Tests: `tests/plot.test.js`.
  - The designer chose that the evil (loyalist) road is the easy one.
- **Dialogue** (`src/dialogue.js`):
  - The Emperor's opening plays at the start of every career; he also returns at turning points and sets monthly demands.
  - The steward voices the tutorial, including a guided "tutorial month" (`GUIDE` in `src/tutorial.js`), and gives short news notes.
  - You reply to the Emperor at the end of the opening.
- **5.1.0** (`docs/playtest-llm-8*.md`): Prestige for every tournament win, House levels at 12 / 30 / 60 / 110, Morale that sinks slowly, the injury rework, seasoned recruits, the Temple of Fortuna, the Exhibition Ring, mobile tap-for-help.
- **5.1.1:** the Codex redesign (search, folding sections), the thumbs up or down layout, the result popups.
- **5.2.0** (`tests/fun-ideas.test.js`):
  - Nemeses (`NEMESIS`).
  - Short careers and the daily Emperor's Challenge (`SHORT`, `dailySeed`).
  - Betting (`BET`).
  - The Emperor's demands (`DEMAND`).
  - Bonds (`BOND`).
  - The crowd's hype (`HYPE`, `hypeOf`).
  - The Patron Lounge (`LOUNGE`).
  - Seasoned Liaison prisoners.

**Bots** (`scripts/bots.js`): `opts.plot` is `rebel`, `loyalist` or `bystander`; `opts.setup` (for example `{ short: true }`) sets the career's setup. Bots don't bet, host or use the Temple.

**Open for the designer** (ask before deciding):
- **Lower arenas you never fight in stay frozen** on the same opponent. Three playtests flagged it; the recommendation is to let them advance on their own.
- **The old tutorial tips keep arriving** for a year after the tutorial month. Fold the important ones into the month?
- **The Basa as cyborg centurions?** That overlaps with Androids; the alternative offered was a "Centurion" class.
- **Renown and the mismatch jeers:** should Renown count, or the Power gap alone?
- **The top bar's Prestige bar:** the designer saw a "UI bug" there. It looked correct (★ 7, House Lv 1, bar 7/12, "next at 12"). A clearer label was offered: `★ 7 · House Lv 1 [▬▬▬───] 5 to Lv 2`. Ask what they meant.
- **Autoplay "not working after round 1":** never reproduced, on any build.
- **When to freeze v6** (`/v6/` and tag `v6.0`, see section 6).

**Good next steps:**
1. An LLM playtest of 5.2.0's new features, especially short careers, the daily challenge, nemeses and the Lounge.
2. The designer's text pass on the new placeholder lines.
3. Fighters speaking in ordinary event cards, so that dialogue doesn't give the plot away.

## 3. Earlier state (v5 notes, kept for reference)

The v5 content release is live. On top of it, two batches of v5 updates were made on request.

**Batch 1: done, pushed, live, and copied into `/v5/`** (commits `2ea4309`, `3f1c5f2`)
- **Market and housing:** the Armourer stocks 5 / 6 / 8 items. Fighter Quarters house 2 / 4 / 5, and House level 1 allows 4 fighters.
- **Power breakdown:** hovering the Power badge shows its sources (`powerParts` in `src/run.js`: Natural, Training, Titles, gear, Firebug, Lion Cage, augments). In a fight the badge shows the coming round's Power with ▲/▼ and lists what changed.
- **Tournament jeers:** no jeers in bracket Quarter- or Semi-finals; a bracket Final only jeers at +5 Power (`crushingGapFor`).
- **Fight screen reveal:** the line naming the round winner waits a beat ("Steel meets steel…"), then lands with a banner. The winner's card glows, the loser's dims, and new wound chips appear when the story reaches the blow (`roundTiming` in `src/ui/fightView.js`). Sounds and auto-play follow the same timing.

**Batch 2 and the playtest #6 fixes: done, pushed, live, and copied into `/v5/`** (up to commit `6a00010`).
- **Signature moves** (`SIGNATURES` and `SIGNATURE = { level: 3, bossLevel: 3, opponentLevel: 3 }` in `src/data.js`; `signatureOf`, `useSignature`, `signatureBlocker` and `opponentHasSignature` in `src/fight.js`):
  - Your fighters use one move per fight, for one round, from level 3.
  - Opponents use theirs when behind or in Round 3. In a Boss tournament that applies in every round; otherwise only in a tournament's Final (`earlyRound` comes from `matchOptions`).
  - Opponent cards show the move when the opponent will use it.
- **Thumbs up or down** (`MERCY` in `src/data.js`; `offerMercy`, `resolveMercy` and `mercyBlocker` in `src/run.js`; game action `mercy`):
  - `run.mercy` blocks every other action until the verdict.
  - Spare: +2 Favor, in your top arena only.
  - Kill: +2 Renown and a kill.
  - Following the crowd: +1 Renown and +5 Morale.
  - Killing against a mercy chant: a feud, plus +2 Renown of infamy.
  - Sparing against a call for blood: their house owes you a life (`house.owed`, −1 Power against you for 3 months, applied through a negative `grudge`).
- **Economy:**
  - Gear priced by measured value per Gold.
  - Items at half their earlier price.
  - Lower-arena purses halved per tier below your top arena, but a win always pays at least the loss + 2 Gold.
  - Bracket early wins pay 3 × tier Gold.
- **Playtest #6** (`docs/playtest-llm-6.md`, `docs/playtest-6-changes.md`): every bug fixed and most suggestions applied.
  - Arena Power is now Bronze 11 / 12 / 14, Silver 18 / 18 / 19, Imperial 25 / 26 / 27, Grand 30 (raised in playtest #7 to pay for the Championship cascade).
  - Underdog needs a 2-Power gap; Dreaded comes at 2 kills.
  - The Morale chip shows its target and warns "Discontented soon".
  - Skipping to the tournament no longer overtrains anyone.
  - Breakdown holes fixed; 40 more names.
- **Measured state:**
  - 375 tests pass.
  - All 9 gates pass: careful 43% (near the 45% ceiling), careful deaths 0.55 per career, reckless deaths 3.21.

**Next steps**
1. Report to the user and ask about the open decisions (section 8).
2. When new work arrives, follow sections 5 and 6: test-first fixes, gates, docs, commit, refresh `/v5/` only if asked, then push and verify.
3. Careful win rate sits at 43%. If a new feature makes the player stronger, add matching difficulty (later arenas are the lever that works; see `docs/playtest-6-changes.md`, "Balance").

## 4. Architecture in one screen (details in `CLAUDE.md`)

- **Pure logic, no DOM:**
  - `src/data.js` holds all tables and tunable numbers. Tunables are **objects**, so sweeps can change them in memory.
  - `src/fight.js` is the round engine.
  - `src/run.js` coordinates the career.
  - `src/game.js` holds **every career-changing action**.
  - Also pure: `src/explain.js`, `src/narrate.js`, `src/codex.js`, `src/events.js`, `src/legacy.js`.
- **UI:** the files in `src/ui/*.js` return HTML strings. `src/main.js` holds state, clicks, saving, sound timing, and the `before` / `after` hooks for actions.
- **Replays:** every player action goes through `applyGameAction` and is recorded in `run.actions`, so careers replay exactly (`npm run replay`).
  - Rule refusals throw `Refused` (`src/errors.js`). Anything else opens the bug-report box.
  - New actions must be added to `GAME_ACTIONS` in `src/game.js`.
- **Seeded RNG:** separate streams per system (market, opponents, fight, growth, events, houses, patron). `Math.random` is only allowed in `randomSeed()`. Never roll dice while rendering (e.g. `opponentFor` is read-only; brackets are drawn at the start of the tournament week).
- **Saves:** `SAVE_VERSION` is 3 in `src/run.js`. Migrate old saves rather than break them; new optional fields use `?? default`.
- **Tests:** one file per module, plus feature files such as `tests/signature-mercy.test.js` and `tests/v5-update.test.js`. `tests/setup.js` switches weekly events off; `tests/helpers.js` has `blank()` fighters.
- **Whole-career test loops** live in `tests/run.test.js`, `tests/ui.test.js` and `tests/debug.test.js`. They must resolve any new blocking state (they now resolve `run.mercy`). Add the same handling there if you add another blocking choice.

## 5. Balance and economy toolkit

- **`npm run check`:** 300 careful and 300 reckless bot careers plus Boss simulations, checked against 9 gates (`scripts/checks.js`). It takes about 5–10 minutes, so run it in the background. The gates:
  - careful career win rate 20–45%
  - careful wins at least as often as reckless
  - careful deaths ≤ ½ reckless
  - reckless deaths 1–4 per career
  - a balanced build is best vs ≥ 2 of 4 Bosses
  - the first Boss is won ≥ 55% of the time
  - tactics are worth +3–15 points vs always-Steady
  - always-Press does worse than reading the opponent
  - the Grand Tournament is ≥ 10 points harder than the first Boss
- **`npm run sweep`, plus the probes in `scripts/probes/`:**
  - `item-value.js`: win-rate change per Gold for every fight item and signature move.
  - `gear-value.js`: value per Gold for every gear piece.
  - `gold-flow.js`: Gold held by careful bots, by arena tier.
  - `careful-variant.js`: careful win rate with chosen values. Run several in parallel under `bash -c`; zsh doesn't word-split `$cfg`.
- **Bots** are in `scripts/bots.js` (`playCareer(seed, 'careful'|'reckless', { onWeek })`). When you add a player choice, teach both bots to make it, or the gates measure nothing.
- **Pricing targets used in the economy pass:** tier 1 gear about 1–1.3 win points per Gold, tier 2 about 0.7–1.1, tier 3 about 0.6–0.9. Items about 0.4–0.65 points per Gold, counting an avoided own injury as 3 points per 0.1.

## 6. Recurring procedures

**Refreshing a frozen copy in place** (no new tag, when the user asks)
```
rsync -a --delete src/ v5/src/ && cp style.css v5/style.css
```
Then change the four keys in `v5/src/main.js` back to `bloodsport.v5.career|prefs|codex|legacy`. Check with `diff src/main.js v5/src/main.js`: only those 4 lines may differ. Add a "Refreshed on request" note to `v5/README.md`, then commit with "Refresh /v5/ … (no new tag, on request)".

**Freezing a new major version:** copy into `/vN/` the same way, with keys `bloodsport.vN.*`, add a README, list it in `CLAUDE.md`, then tag `vN.0` and push the tag.

**Balance checks run in parallel** (5.4.1): `npm run check` and `scripts/probes/bot-options.js` spread their careers over every core but one (`scripts/pool.js`, `scripts/career-worker.js`). The results are identical to a one-by-one run; on the designer's 10-core Mac a check takes about 9 minutes (it was about 50). Progress goes to stderr (`careful 180/300 · …`). `node scripts/career-sim.js 300 --check --tune '{"QUESTS.goldScale": 0.2}'` runs the real gates with other values. Probes match the check exactly only with `'{"oddsSamples":150}'` and the check's seeds and counts (first seed 1000; 300 full careers, 150 short); the default probe settings drift by a few points. Don't edit `src/` while a check or probe runs: each batch loads the files as it starts (use a git worktree for parallel work).

**LLM playtest**
- Spawn a general-purpose subagent. It plays with `node scripts/play-text.js --seed N --last 1 < commands.txt`, appending commands to a file in the scratchpad (careers replay from the seed), for a budget of about 350–450 commands.
- The report goes to `docs/playtest-llm-N.md`, in the format of `docs/playtest-llm-5.md`:
  - summary
  - confusions
  - bugs with file:line
  - focus sections
  - top-10 suggestions
- Tell it which new features to stress, and to edit nothing but the report.
- Then fix the findings and write `docs/playtest-N-changes.md`.

**Browser check:** `.claude/launch.json` in `/Users/jasonvallee/Documents/claude_practice` starts a no-cache server on port 8001 (`preview_start` with name `bloodsport`). Check new UI in the browser before reporting it done.

## 7. Gotchas I hit

- **Cloud sessions** (Cowork) can't push to GitHub and the user's VM can't reach it either. Work in a clone, then `git bundle create x.bundle <old>..main`, copy it into the repo folder, `git fetch x.bundle main:refs/remotes/bundle/main && git merge --ff-only bundle/main`, and delete the bundle. Git in the VM needs delete permission for its lock files.
- **`npm run check` takes 45+ minutes on a 2-core container.** Background jobs die when the container is reclaimed: keep the turn alive (sleep and poll) or run it on the user's machine.
- **`pkill -f career-sim`** also kills the shell that launched it if the pattern is in that shell's command line.

- **Bulk `sed` renames** of identifiers break `import { … }` lines (for example `SIGNATURE.level` inside an import). Grep the imports afterwards.
- **zsh doesn't split unquoted variables.** Use `bash -c` for loops over argument lists.
- **Sims are slow** when the machine is throttled (for example overnight). Keep sample sizes modest and run variants in parallel.
- **Rendering must stay pure.** A UI function that creates opponents or rolls dice desyncs replays. `tests/brackets.test.js` checks this.
- **Don't edit `v1/`–`v5/`** unless asked. The live game is the repo root.
- **Effect stacking:**
  - Item boosts live in `c.boosts` (several can stack, one of each item kind per fight).
  - Signature moves reuse that system (`boost` for self, `foe` for the opponent, `ash` for Ash-Hungry).
  - `powerParts` labels must match `computePower`'s source names, or the in-fight ▲/▼ breakdown double-counts.

## 8. Open decisions and backlog (for the user)

- **Speed is a threshold stat, not too strong** (measured 2026-10-28 with `speedSplit`, n=3000, one fighter splitting training weeks between +1 Power and +3 Speed vs each Boss). The best split is 1–3 Speed weeks: just enough to out-speed the opponent. At the Imperial Boss, 3 of 13 weeks on Speed give 64% wins against 50% all-Power, and 19% injured against 53%. Pure Speed collapses to 10–13% wins. Initiative, evasion (capped at 20%) and Feint all plateau once you're about 5–6 Speed ahead. Offered but not chosen: a "Flurry" payoff for Speed beyond that point, and slowing Speed training to +2 a week.
- **The Bronze wall.** Opponents jump in Power while the Trainer cap stays at 5 until House level 3. Bronze Bosses now also have signature moves. Options: unlock the higher Trainer cap earlier, or soften Bronze.
- **New content is rarely seen.** A Fighter is 1 class in 9, then 1 weapon in 9, so the Axe and Dagger are rare. Weighting new content up is an option.
- **Prestige spiral** after repeated Boss losses (raised by an earlier playtest).
- **Late-game Gold** still reaches about 190 at the top. Fun Gold sinks (sponsoring games for Favor, a famous trainer) would beat further cuts.
- **Fun ideas the user hasn't chosen yet:**
  - betting on your own fighter at the shown odds
  - mentors (a veteran trains a rookie, with a bond)
  - a daily Emperor's Challenge seed with a local best-score board
  - a crowd hype meter during fights
  - auctions (on hold by request)
