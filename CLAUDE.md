# Blood and Circus (formerly Bloodsport) — Web MVP

Turn-based gladiator-house management roguelike, built as a static site and hosted on GitHub Pages (https://jvallee.github.io/bloodsport/).

## Sources of truth
- `docs/HANDOFF.md`: current state, the user's working preferences, next steps and open decisions. Read it first when picking up the project.
- `docs/fight-rules.md`: MVP rules and placeholder numbers. When code and this doc disagree, ask which one is right; don't silently change either.
- The full design doc (`Bloodsport — Game Design Document & UE5 Proposal.md`) is local only and is not committed (see `.gitignore`). Read it section by section; the end of the file holds large base64 images.
- Tabs 3, 10 and 11 of the design doc describe an Unreal Engine build. Use them for intent, not for architecture.

## Tech
- Plain HTML/CSS/JavaScript (ES modules). No build step: what's in the repo is what Pages serves.
- Keep game logic (fight engine, economy, RNG) in pure modules with no DOM access, so it can be tested in Node.
- Use a seeded RNG for all randomness so careers replay exactly from a seed. `Math.random` is only allowed in `randomSeed()` (choosing a new career's seed).
- Keep the game static: no server, no build step, `localStorage` only. Version the career save format (`SAVE_VERSION = 7` in `src/run/helpers.js`, re-exported by `src/run.js`) and migrate old saves in `src/run/migrations.js`; the Codex and Legacy are stored separately and must survive career-format changes.
- Tests use Node's built-in runner: `node --test`. No test framework dependencies.

## Commands
- `npm test`: run all tests (no install needed).
- `npm run serve`: play locally at http://localhost:8000 (ES modules don't load from `file://`).
- `npm run simulate`: build win rates at equal Power, and trained fighters vs each Boss.
- `npm run career [n]`: whole-career balance report (careful and reckless bots; pass `--quick` for a faster local check).
- `npm run check`: **balance gates** (24 Season/Long Road/Heat/decor/unrest/usage/climax gates; pass/fail, exits non-zero). Every balance or rules change must pass it before shipping.
- `npm run sweep -- [--evasion | --favor | --fine] [n]`: sweep balance levers and print a table to choose values from. Seasons by default (`--long` for the Long Road). `--set PATH=v1,v2 [--groups careful,legacy,heat1,...] [n]` sweeps any table value on every core with the gates' own groups and seeds, printing each rate with its 95% interval.
- `npm run replay -- report.json [--stop N] [--steps]`: replay a playtester's bug report (see `docs/bug-reports.md`).
- `npm run text-index -- [--check]`: refresh or verify `docs/text-to-rewrite.md` source links.

## Layout
- Pure logic:
  - Core & combat: `src/rng.js` seeded RNG · `src/data.js` all tables and tunable numbers · `src/fight.js` fight engine · `src/odds.js` pre-fight odds · `src/narrate.js` fight narration · `src/explain.js` pre-fight stakes and warnings · `src/calendar.js` weeks and festivals · `src/ludus.js` estate and buildings · `src/errors.js` `Refused` rule-error type · `src/version.js` version string.
  - Career engine (`src/run.js` pure re-export barrel over 10 strictly acyclic layers in `src/run/`): `helpers.js` (L0 constants, fighter factory, canonical blockers/helpers, `SAVE_VERSION = 7`), `plotEngine.js` (L1a hidden plot), `houses.js` (L1b rival houses, arenas, brackets, `summonsPower`, `bracketInfo`, Patron Lounge), `roster.js` (L2 recruitment, training, gear, decor, medbay, retirement, Vulcan/Fortuna rites), `questsEngine.js` (L3a steward tasks, wants, rebel quests), `fortuneEngine.js` (L3b Fortune's wheel, boons, relics, Fates' Wager), `eventsEngine.js` (L3c weekly events), `tournaments.js` (L4 bouts, brackets, betting, mercy, Emperor's summons), `weekly.js` (L5 `createRun`, weekly progression, tribute), `migrations.js` (L6 serialization, `validateRun`, v2 → v3 → … → v7 migrations), `unrest.js` (L2.5 7.3 unrest and The Chains Break), `espionage.js` (L3d 7.4 moles and covert ops).
  - Meta, story & persistence: `src/events.js` weekly event cards · `src/plot.js` hidden plot cards · `src/quests.js` steward/want/summons tables · `src/fortune.js` relics and boons · `src/dialogue.js` Emperor/steward/rebel scenes · `src/digest.js` monthly digest · `src/hints.js` contextual next-step bar · `src/codex.js` unlockable glossary · `src/tutorial.js` intro and tutorial steps · `src/legacy.js` Legacy XP, unlocks, Heat, achievements, score · `src/careers.js` multi-career index · `src/savefile.js` save export/import · `src/game.js` every player action (recorded for replays) · `src/debug.js` bug reports and replay.
- UI & text port: `src/ui/components.js`, `src/ui/views.js`, `src/ui/fightView.js`, `src/ui/portrait.js` (generated SVG faces), `src/ui/estateView.js` (7.14: the villa cross-section and room decorator) return HTML strings (pure, no DOM); `src/ui/sound.js` plays synthesized WebAudio effects; `src/main.js` holds UI state, `localStorage` persistence, and DOM events; `scripts/play-text.js` is the playable CLI text port. Every career-changing action goes through `applyGameAction` in `src/game.js` (never call `src/run.js` directly from `src/main.js`), so careers stay replayable. Rule refusals throw `Refused` (`src/errors.js`); anything else thrown opens the bug report box.
- `scripts/bots.js`: careful, reckless and brawler (7.6: fights well, neglects the house) career bots used by `career-sim.js`, `checks.js`, `probes/`, and tests.
- Every rules change gets re-checked with `npm run check` before it ships; record the numbers in `docs/roadmap-v2.md`. When a gate fails, sweep the relevant values and show the table rather than guessing.
- `tests/`: per-module and release test suites, plus `tests/helpers.js` (blank fighters, scripted RNG). `tests/setup.js` (loaded by `npm test`) switches weekly events off so unrelated tests stay deterministic; `tests/events.test.js` switches them back on.

## Working practices
- **Commit early and often.** Make small, focused commits, each with a clear message, after every working step. Don't batch unrelated changes.
- **Run the tests before every commit.** Don't commit a failing test suite.
- **Test robustly.** Every rule in `docs/fight-rules.md` and every trait or injury gets a test. Test edge cases (Delta clamping at ±10, the 2-injury death gate, Poisoned counting as 2, the towel prompt) and add statistical tests (many seeded fights within tolerance of the Power Delta table).
- **Never delete, skip or weaken a test to make it pass.** If a test fails, fix the code. If the test itself is wrong, explain why and get agreement before changing it.
- **Fix bugs test-first.** Write a failing test that reproduces the bug, then fix it.
- **Version notes:** add every player-visible change to `CHANGELOG.md` (newest first, in plain player-facing language) in the same commit. When freezing a version, move the "Unreleased" notes under the new version's heading.
- Don't change balance numbers or rules without saying so. Record each new placeholder decision in `docs/fight-rules.md`.
- Current plan: `docs/roadmap-v2.md`. Deferred features stay deferred unless asked.
- `v1/` to `v6/` are frozen playable archives (`v1.0`, `v2.2`, `v3.0`, `v4.0`, `v5.4.3`, `v6.0.5`) with isolated `localStorage` keys (`bloodsport.v6.*`, etc.). Don't edit them unless the user asks.
- Check that the site works when opened from GitHub Pages (relative paths only, no absolute `/` links).
- Tags are made by GitHub, not pushed: `.github/workflows/tag-release.yml` tags `main` as `v<VERSION>` whenever `src/version.js` changes, and can tag any commit by hand from the Actions tab (Claude sessions can push branches but not tags).
