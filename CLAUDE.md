# Bloodsport — Web MVP

Turn-based gladiator-house management roguelike, built as a static site and hosted on GitHub Pages (https://jvallee.github.io/bloodsport/).

## Sources of truth
- `docs/fight-rules.md`: MVP rules and placeholder numbers. When code and this doc disagree, ask which one is right; don't silently change either.
- The full design doc (`Bloodsport — Game Design Document & UE5 Proposal.md`) is local only and is not committed (see `.gitignore`). Read it section by section; the end of the file holds large base64 images.
- Tabs 3, 10 and 11 of the design doc describe an Unreal Engine build. Use them for intent, not for architecture.

## Tech
- Plain HTML/CSS/JavaScript (ES modules). No build step: what's in the repo is what Pages serves.
- Keep game logic (fight engine, economy, RNG) in pure modules with no DOM access, so it can be tested in Node.
- Use a seeded RNG for all randomness so careers replay exactly from a seed. `Math.random` is only allowed in `randomSeed()` (choosing a new career's seed).
- Keep the game static: no server, no build step, `localStorage` only. Version the career save format (`SAVE_VERSION` in `src/run.js`) and migrate old saves; the Codex is stored separately and must survive career-format changes.
- Tests use Node's built-in runner: `node --test`. No test framework dependencies.

## Commands
- `npm test`: run all tests (no install needed).
- `npm run serve`: play locally at http://localhost:8000 (ES modules don't load from `file://`).
- `npm run simulate`: build win rates at equal Power, and trained fighters vs each Boss.
- `npm run career [n]`: whole-career balance report (careful and reckless bots).
- `npm run check`: **balance gates** (pass/fail, exits non-zero). Every balance or rules change must pass it before shipping.
- `npm run sweep -- [--evasion | --favor | --fine] [n]`: sweep balance levers and print a table to choose values from.

## Layout
- Pure logic: `src/rng.js` seeded RNG · `src/data.js` all tables and tunable numbers · `src/fight.js` fight engine · `src/calendar.js` weeks · `src/ludus.js` estate · `src/run.js` career coordinator · `src/odds.js` pre-fight odds · `src/narrate.js` text · `src/codex.js` unlockable glossary · `src/tutorial.js` intro and tutorial steps.
- UI: `src/ui/components.js`, `src/ui/views.js`, `src/ui/fightView.js` return HTML strings; `src/main.js` holds state, saving and events.
- `scripts/bots.js`: careful and reckless career bots used by `career-sim.js` and tests.
- Every rules change gets re-checked with `npm run check` before it ships; record the numbers in `docs/roadmap-v2.md`. When a gate fails, sweep the relevant values and show the table rather than guessing.
- `tests/`: one file per module, plus `tests/helpers.js` (blank fighters, scripted RNG).

## Working practices
- **Commit early and often.** Make small, focused commits, each with a clear message, after every working step. Don't batch unrelated changes.
- **Run the tests before every commit.** Don't commit a failing test suite.
- **Test robustly.** Every rule in `docs/fight-rules.md` and every trait or injury gets a test. Test edge cases (Delta clamping at ±10, the 2-injury death gate, Poisoned counting as 2, the towel prompt) and add statistical tests (many seeded fights within tolerance of the Power Delta table).
- **Never delete, skip or weaken a test to make it pass.** If a test fails, fix the code. If the test itself is wrong, explain why and get agreement before changing it.
- **Fix bugs test-first.** Write a failing test that reproduces the bug, then fix it.
- Don't change balance numbers or rules without saying so. Record each new placeholder decision in `docs/fight-rules.md`.
- Current plan: `docs/roadmap-v2.md`. Deferred features stay deferred unless asked.
- `v1/` and `v2/` are frozen copies of tags `v1.0` and `v2.0`. Don't edit them.
- Check that the site works when opened from GitHub Pages (relative paths only, no absolute `/` links).
