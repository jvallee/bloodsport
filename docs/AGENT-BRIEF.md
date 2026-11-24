# Brief for an agent working on Blood and Circus on the designer's machine

Written 2026-11-23 at the end of a cloud session; current state updated 2026-11-25 (7.10.0). Read this first, then `CLAUDE.md` (the rules) and `docs/HANDOFF.md`
(the designer's preferences and history). Where they disagree with this brief about *current state*, this brief is newer.

## 1. What this is

A turn-based gladiator-house management roguelike: plain HTML/CSS/JS ES modules, no build step, no dependencies, served
as-is by GitHub Pages from `main`.

- Repo: `github.com/jvallee/bloodsport`. Live game: https://jvallee.github.io/bloodsport/ (version **7.10.0**).
- Frozen older versions: `/v1/` … `/v6/` (don't edit them).
- Node 20+ is all you need. `npm test` (about 15 s), `npm run serve` (play at http://localhost:8000), `npm run check`
  (balance gates, about 12 min on 4 cores; run it in the background).

## 2. Where things stand

| Branch | State |
|---|---|
| `main` | **7.10.0, live** (24/24 gates). Tags `v7.0` … `v7.10.0` come from the Action. |
| `v7.0.0` … `v7.10.0` | Release branches, all merged into `main`. The designer agreed to delete them; cloud sessions can't. |

Released since 7.4.1: 7.10.0 (a bolder rebellion: new requests that draw suspicion, a barracks search, the prefect, endings with lead-ins, replies at each rebel stage; a better tutorial), 7.9.1–7.9.2 (a writing pass; a fight-day pop-up), 7.9.0 (Phase 4 balance: Imperial Boss −2, Orc Power 5, cowed revolts, wound items +3% win, cheaper
covert ops; the cousin in the cells), 7.5.0 and 7.5.1 (Phase 1: saves and a fight that survives a reload), Phase 3 tooling (bots, usage
gate, 23 gates), 7.7.0 and 7.8.0 (Phase 2: fight pace, first-strike chance, hints, phone fight screen, one name per rule,
deaths and narration, endings), 7.8.1 (fixes from a code review: two tabs, live bet odds, Blood Drinker wording, a stray
alert, phone spacing).

### The 7.4.1 fixes already on `v7.4.1` (one commit each)
1. No tell at 0% accuracy: a stolen playbook without an Oracle gave a guaranteed-wrong tell in Rounds 2–3 (`src/fight.js`).
2. Raising a body clears `mole` and `humourDrift` (`src/run/roster.js` `reanimate`).
3. Bribe the Armourer needs an opponent wearing armour; 4. no investigating a fighter mid-bracket (`src/run/espionage.js`).
5. A tied Temperament drift shows as paused; 8. Revenants don't drift or meditate, and the room says so.
7. A steered wound against a cyborg is described from the wound that would have landed.
9. A fight summary keeps Battle-Hardened when a scar comes with it (`src/run/tournaments.js`).
10. The Chains Break, Palatine choice: a palace mole as ringleader is unmasked (+15 suspicion) instead of joining the cause.
6. The careful bot's Morale decor fallback skips 0-comfort and Temperament pieces (`scripts/bots.js`).

`CHANGELOG.md` has them under "Unreleased (7.4.1)"; `docs/fight-rules.md` has a "7.4.1 fixes" section.

## 3. How 7.4.1 was released (already done; the same steps for the next release)

1. `git fetch origin && git checkout v7.4.1`
2. `npm test` (expect 750 passing) and `node scripts/text-index.js --check` (expect exit 0; the "Changed?" lines about
   `src/quests.js`, `src/dialogue.js` and `src/ui/fightView.js:1…` are old and harmless).
3. `npm run check` (in the background). **All 22 gates must pass.** If a gate fails, don't guess: sweep the lever and
   show the designer a table (see §5).
4. Record the gate numbers in `docs/roadmap-v2.md` (a "v7.4.1" section like the "v7.4.0" one above it).
5. Release: set `src/version.js` and `package.json` to `7.4.1`; rename the CHANGELOG heading to
   `## 7.4.1 (date): fixes`; commit; merge into `main` (`git merge --no-ff v7.4.1`); push `main`.
   The GitHub Action `.github/workflows/tag-release.yml` then tags `v7.4.1` by itself.
6. Check the live site loads: https://jvallee.github.io/bloodsport/ (no console errors, careers load).
7. **Still to do:** delete the merged branches: `git push origin --delete v7.0.0 v7.1.0 v7.2.0 v7.4.1` (on the designer's machine this
   uses their own GitHub login, so it should work).

## 3b. 7.5.0 (2026-11-24): the review brief's Phase 1, minus 1.4

A five-part review of 7.4.0 produced a phased brief; the designer accepted its recommended answers (D1: a fight survives a
reload; D2: one dry steward voice, the designer writes it; D3: keep difficulty, fix the Grand Tournament (4.1) only, keep
the Heat order; D4: show the hidden intro pages under How to play). Done in 7.5.0: tests run on every push
(`.github/workflows/test.yml`); failed saves warn (1.2); a save that won't load opens a dialog (1.3); only careers in play
count toward the 8 (1.5); two tabs, save import, bracket notice keys (1.7); no key or click past a hidden Death Gate warning
(1.1, `src/ui/keys.js`); `scripts/sweep.js` sweeps Seasons by default and has a `--set` mode on the worker pool (3.3, 3.4).

**Done since:** 1.4 (7.5.1), Phase 3 (findings in `docs/roadmap-v2.md` "v7.6 tooling") and Phase 2 (7.7.0, 7.8.0).
Phase 4 is done in 7.9.0 (see `docs/roadmap-v2.md` "v7.9.0" and `docs/fight-rules.md` "7.9.0"), with the designer's cousin
quest. **Ideas for next:** `docs/ideas-story.md`. **Next, ask the designer:** their voice pass on the PLACEHOLDER text (`docs/text-to-rewrite.md` sections 15–17); first
careers now win 23% (6 points below the 7.6 bots, outside their 1–4 point comfort range, inside the gate); the climax gate
passes by only 3 points.

## 4. Open items after 7.4.1 (ask the designer before starting any)
- **Words:** everything new in 7.1–7.4 is first-draft wording marked PLACEHOLDER, listed in `docs/text-to-rewrite.md`
  sections 15–16, waiting for the designer's rewrite.
- **Balance:** first careers now win 24% (was 34% before 7.2–7.4). That's inside the gate (15–35%) but a bigger drop than
  the designer's "1–4 points"; they should play a few careers. Planted Market moles are the biggest cost (without them, full
  Legacy goes 37% → 44%); `ESPIONAGE.plant` is the lever.
- **Bots:** the careful bot only uses one Temperament piece on purpose (a Rock Garden for Afeared fighters), so the
  "no dominant Temperament decor" gate is weak. A bot that picks Temperament pieces deliberately would test it properly.
- The roadmap for 7.1–7.4 (`docs/roadmap-v7.md`) is done; there is no plan beyond it yet.

## 5. How the designer likes to work (summary; full list in `docs/HANDOFF.md` §2)
- Be autonomous: implement worthwhile feedback, then report clearly what changed and why. End reports with a few fun ideas.
- **Small, focused commits**, tests passing before each one. Fix bugs **test-first**.
- **Never weaken, skip or delete a test** to make it pass. If a deliberate rule change breaks a test, update the expected
  value and say so in the commit message.
- Every balance or rules change must pass `npm run check`. If a gate fails, sweep and show the table; the designer
  chooses. Record numbers in `docs/roadmap-v2.md` and rule changes in `docs/fight-rules.md`.
- Every player-visible change goes in `CHANGELOG.md`, in plain, British-English, player-facing words.
- **Publish to GitHub Pages before finishing** (merge to `main` and push); for unfinished work, a preview folder like
  `/v7-beta/` with its own storage keys (see git history: "7.4 beta preview").
- Keep comments short and plain. Relative paths only (the site lives under `/bloodsport/`).

## 6. Things that bit the cloud session (save yourself the time)
- `--quick` balance runs change the results, not just the speed (weaker bots). Only `npm run check` counts.
- The test bots assume random events are off (`tests/setup.js`), but The Chains Break and the mole card open anyway; a
  scripted test career has to answer `run.event`.
- To compare play before/after a change, hash bot careers on play data (log, gold, favour, history), not the whole `run`
  object: save-format fields change the hash without changing play.
- Workers in `scripts/pool.js` load the code when a check starts, so editing `src/` mid-check doesn't affect that run,
  but the result then describes the old code.
