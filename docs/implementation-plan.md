# Implementation Plan — Web MVP

Goal: the Core MVP from the design doc (Tab 10, Milestones 1–4) as a static web game. You draft fighters, train and decorate them, fight Tournament 1 → Tournament 2 → Boss in 3-round matches, decide whether to throw in the towel, and see why you won or lost. Rules come from `docs/fight-rules.md`.

## Architecture

```
index.html, style.css      page shell
src/rng.js                 seeded RNG (mulberry32), state is a plain object
src/data.js                tables: Power Delta, injuries, kinds, traits, classes, weapons, economy
src/fight.js               fight engine (pure, no DOM): createMatch, playRound, throwTowel
src/run.js                 run state (pure, no DOM): market, roster, training, decor, Medbay, tournaments
src/narrate.js             turns round records into readable lines (pure)
src/main.js                DOM rendering and event wiring only
tests/*.test.js            node --test
scripts/simulate.js        balance simulator (build vs build win rates)
```

- Game logic never touches the DOM, so all of it runs under `node --test`.
- All randomness goes through `rng.js`. The run seed derives separate streams for market, opponents and fights (the design doc's domain-isolated RNG).
- Percentages use `ChanceE5` integers (`100000` = 100%), as in the design doc.

## Phases (one or more commits each)

1. **Foundation:** `package.json` (`"type": "module"`), `rng.js`, `data.js`, plus tests for determinism, ranges, Delta lookup and mirroring, and injury tier boundaries.
2. **Fight engine:** the 5-step round, best-of-3, death gate, towel, boss debuff, every MVP trait/class/weapon/injury. Tests:
   - unit tests for each modifier and for severity math
   - statistical tests that round-win and injury rates match the table within ±1.5% over 10,000 fixed-seed fights
   - determinism: same seed gives the same match
3. **Run loop:** market (4 fighters, at least one Orc), recruit, train, decor, heal, start and finish a match, rewards, advancing tournaments, win and loss conditions. Tests for each rule and cap.
4. **UI:**
   - Ludus screen: stats bar, market, roster, next bout
   - fight overlay: tarot cards, Delta gauge, tag pills popping in order, round feed, between-round towel modal with the Mortal Danger alert, "Why you won/lost" breakdown
   - end screen
5. **Balance simulator and rules doc:** `scripts/simulate.js`, plus recording any new placeholder decisions.
6. **Push and verify** the site on GitHub Pages.

## Review of this plan — changes made

1. **Narration moved out of the engine.** The first draft had `fight.js` build display text. The engine now returns structured round records, and `narrate.js` turns them into text. This keeps engine tests about numbers, not wording.
2. **Injury chance is computed at the moment of each roll, not once per round.** Otherwise a Flesh Wound or Distracted from Roll 4B wouldn't weaken the 4C retaliation as the rules require. Sagittarius's coin flip is still rolled once per round and stored.
3. **Statistical tests use fixed seeds**, so they can't flake, and the tolerance (±1.5%) is about 3σ at 10,000 samples.
4. **Run actions are locked while a match is in progress** (`inMatch`), so a stray click can't train or heal a fighter mid-fight.
5. **Rule gaps found while planning are recorded in `docs/fight-rules.md`** rather than silently decided in code:
   - how Blood Faith works with no circuit advancement
   - what counts as armor
   - Concussed vs Footwork precedence
   - opponent decor
   - the "no fighters" loss condition, which would otherwise end the run before the first recruit
6. **ES modules don't load from `file://`**, so local play needs a static server. This is documented in `CLAUDE.md`. GitHub Pages serves them fine.
7. **Save/load (localStorage) stays deferred**, as in the design doc. The run state is plain JSON-safe data, so adding it later is easy.
