# Playtest #2 notes (2026-10-27): bugs, diagnoses and requests

Jason's second human playtest, with diagnoses from reading the code at `22daba4`. Follow CLAUDE.md: fix bugs test-first, keep commits small, run `npm run check` after any balance change, and record rule changes in `docs/fight-rules.md`.

## Bugs (diagnosed)

### 1. Stress drops sharply after a "training" week, and stats don't change
**Cause:** in `advanceWeek` (`src/run.js` ~370–406), when training can't happen because the trainer cap is reached or Gold is short, the code sets `f.job = 'rest'` *before* the rest branch runs. The `else if (f.job === 'rest' …)` check then applies the full Rest (−40 Stress). So the fighter gains no stat and loses 40 Stress. Restless fighters get the same −40. The only signal is a line in the log.
Also: Entertainment Room relief (15 / 30) is applied on top every week, so at level 2 a training week *lowers* Stress (+20 − 30).
**Fix:**
- Decide whether a training week that fails should count as Rest (ask Jason). Whatever you choose, make it explicit, and surface it on the card or in a toast, not just in the log.
- Stop silently resetting `f.job`: after a training week that fails (trainer cap reached or Gold short), the fighter keeps the job they were given, with a visible warning on the job buttons.
- Tests: a capped fighter's Stress, a Gold-short fighter's Stress, and a restless fighter's Stress each change by exactly the chosen rule.

### 2. "Trained twice, stats didn't update"
Most likely the same cause as #1: cap reached, no Gold, or Restless, so the week became Rest. Check with Jason's save if possible.

### 3. Job buttons don't block training that will fail
`jobBlocker` only checks busy rooms and the trainer cap. Add blockers, each with a hover reason (`title`), for:
- Restless ("Restless (Morale 32): won't train. Raise comfort.")
- Overtrained ("Stress 55: must rest first.")
- Not enough Gold for the fee ("Needs 2 Gold; you have 0.")
Note: Gold is only checked at week end, and several trainees are paid in roster order. Show the total fee against current Gold.

### 4. Gear Speed doesn't show on the card
`fighterCard` (`src/ui/components.js`) adds gear Power (`gearPow`) to the badge but shows raw `f.speed`. The fight engine *does* apply gear Speed (`fight.js` line 56), so Light Greaves work in fights. Add an `effectiveSpeed` next to `effectivePower` and use it in the badge, its tooltip ("3 + 2 from gear"), odds, bots and the text port. Also show gear guard and injure bonuses somewhere visible on the card.

### 5. Show story / Show math replays the dice animation
`'toggle-math'` in `src/main.js` re-renders while `ui.animateRound` is still set. Set `ui.animateRound = 0` (or render only the feed) when toggling.

### 6. Equip/unequip closes the "Room, decor & gear" panel
`render()` rebuilds the HTML, so `<details>` elements lose their `open` state. Give each `<details>` a stable key (e.g. `data-key="gear-f12"`), store the open keys in `ui`, and restore them on render.

## Questions answered (no change unless Jason asks)

- **"Crushing mismatch" in the Bronze Arena when not champion there:** intended. The rule applies to any arena *below your top tier* when the fighter has Renown ≥ 5 and +3 effective Power over the opponent. Being champion there is a separate, harsher rule. The warning text should say why: "Lower arena, +3 Power over the opponent: Crushing mismatch…"
- **Zero Gold and trainers:** you can't train with 0 Gold. The fighter rests that week, logged only. Fixed by bugs #1 and #3.

## Requests

1. **Rename "throw in the towel" to "capitulate"** everywhere players see it: UI, narrate, tutorial, Codex, docs, text port. Keep internal ids (`towel`) unless renaming is cheap; save migration isn't needed for text.
2. **Trait/ability text on separate lines:** in the card's `trait-text`, put the kind trait and the class/weapon ability on their own lines (e.g. "Alloyed Skin: …" / "Shield-Breaker: …").
3. **Clearer injury roll text:** "55% to injure, rolled 5.92%. Hit!" reads oddly. Suggest "needs under 55, rolled 6: Hit!" (whole numbers in story mode, exact numbers in math mode).
4. **Birds and Fire Braziers affect Stress:** e.g. each Bird or Fire Brazier also gives −5 Stress per week (whether or not the fighter's trait uses them), and Trophy Racks stay Morale-only. Propose numbers, run `npm run sweep`/`check`, and record them.
5. **Consumables usable during fights (expensive):** propose 4–6, used between rounds at the capitulate prompt, max one per fight. They're bought from the Armourer or Market, are single-use and stored in the house inventory, so bots and the text port need support too. Ideas:
   - Smelling Salts: ignore one injury's effects for the rest of the fight
   - War Paint: +1 Power for one round
   - Adrenaline Draught: +3 Speed for one round, +15 Stress after the fight
   - Blessed Bandage: −10% chance to be injured for one round
   - Crowd Bribe: the next towel/capitulate costs no Favor

   Price them at roughly 1–2 weeks of income. Run a design critique before building, and check the gates afterwards.
6. **A bit more difficult:** Jason's note was cut off. Ask what he meant before tuning. Candidate levers: tribute growth, opponent Power by tier, and Favor losses.
7. **More fun and easier to navigate:**
   - First, run the LLM playtest (`scripts/play-text.js`) and list friction points.
   - Then propose a small set of navigation changes, such as a clear "next thing to do" prompt, fewer clicks to reach jobs, gear and the arena, and keyboard shortcuts.
   - Get Jason's OK on the list before building.
