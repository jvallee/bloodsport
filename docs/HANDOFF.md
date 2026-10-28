# Bloodsport: handoff for the next agent

Last updated 2026-10-28. Read this file first, then `CLAUDE.md` (the project rules) and `docs/fight-rules.md` (every rule and number).

## 1. What this is

**Bloodsport** is a gladiator-house management roguelike. You run a ludus (a gladiator school): recruit fighters, train and heal them, equip them, and send them into three-round fights across four arenas and a Grand Tournament. Death is permanent, and Imperial Favor at 0 gets you executed.

- **Repo:** `/Users/jasonvallee/Documents/claude_practice/Blood Sport`. The branch is `main`, pushed to GitHub.
- **Live game:** https://jvallee.github.io/bloodsport/ (GitHub Pages serves `main` as-is).
- **Frozen versions:** `/v1/` to `/v5/`, tags `v1.0`, `v2.2`, `v3.0`, `v4.0`, `v5.0`.
- **Stack:** plain HTML/CSS/JavaScript ES modules. No build step and no dependencies. Saves go to `localStorage`. Tests use `node --test`.
- **The user** is the designer and owner. A local design doc (`Bloodsport — Game Design Document & UE5 Proposal.md`, not committed) holds the original vision.

## 2. How the user likes to work (important)

- **Be autonomous.** Implement worthwhile feedback without asking, then report clearly what changed and why. The user often hands over a batch of requests and goes to sleep. Finish everything, playtest, and leave a clear morning report.
- **Goal:** make the game "very user friendly, fun, addictive and immersive". The user welcomes proactive fun ideas (end reports with a few).
- **Commit often** with clear messages. Run `npm test` before every commit. **Never weaken, skip or delete a test.** When a deliberate rule change breaks a test, update the expected value and say so.
- **Balance:** every balance or rules change must pass `npm run check` (9 gates). When a gate fails, sweep the values and pick from a table; don't guess.
- **Docs:** record every number change in `docs/fight-rules.md`.
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

## Next task: veterans earn a higher training cap (requested by the user)

**The problem.** The Trainer cap (`trainCap` in `src/ludus.js`; `TRAINER.per = [3, 5, 8, 13, 21]` weeks in `src/data.js`) is house-wide and counts training *weeks* (`f.trained`, checked in `src/run.js` near line 518). Every fighter shares the same ceiling. Market fighters always arrive at level 1, but with bonus natural Power by arena (`marketPower` +0 / +2 / +4 / +6 in `CIRCUITS`). So once both are capped, a fresh Imperial recruit out-powers a Dirt Pits starter who has fought for years. Veterans feel like they fall behind.

**The user's chosen fix.** Each level a fighter gains raises *that fighter's* personal cap by +1 training week: `cap(f) = trainCap(run) + (f.level − 1)`. Levels come from XP (`XP.levels = [3, 8, 15, 25, 40]`, so levels 1–6, up to +5 weeks).

**What to do**
1. Add a tunable (for example `VETERAN_CAP = { perLevel: 1 }` in `src/data.js`) and a single `trainCapFor(run, f)` helper. Use it everywhere the cap is checked or shown: the training blocker, the auto-switch to Rest, `src/tutorial.js` (the `trainerCap` step), the roster and fighter cards, `src/explain.js`, `src/codex.js`, and `scripts/play-text.js`.
2. Make it visible. The card and the Power/Speed hover should show something like "Training 9 / 10 (Trainer 8 + 2 from level 3)". The level-up log line should mention the extra training week. Update the Codex entry for the Trainer Room.
3. The Old Veteran patron (level 3) gets +2 immediately. That is intended.
4. Tests first: write a test per rule (the cap grows with level, a level-1 fighter is unchanged, the blocker message uses the personal cap, the UI shows the breakdown). Don't weaken existing tests; if a deliberate change breaks one, update the expected value and say so.
5. Balance: run `npm run check` in the background. All 9 gates must pass. If one fails, sweep `perLevel` (0, 1, and maybe 1 every 2 levels) and choose from the table. Record the numbers in `docs/fight-rules.md` under a new heading.
6. Bump nothing in `SAVE_VERSION`; old saves already have `level`.
7. Check it in the browser (section 6, "Browser check"), commit in small steps, push, and confirm the live site.
8. Ask the user whether to also refresh `/v5/` in place (section 6) rather than doing it unasked.
9. Report back clearly: what changed, the gate numbers before and after, and a couple of fun ideas.

## 3. Current state (where I stopped)

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
  - Arena Power is now Bronze 11 / 12 / 14, Silver 17 / 18 / 19, Imperial 24 / 25 / 26, Grand 29.
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
