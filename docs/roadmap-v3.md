# Roadmap v3: From Systems to a Game

*Drafted 2026-10-27, after v2.2. Status: proposal, awaiting the user's go-ahead and order.*

## Why it feels incomplete

v2 has solid systems: the fight engine, injuries and the Death Gate, growth, gear, arenas, Favor, balance gates and bug reports. What's missing is what turns systems into a game you remember. Measured against the design doc's pillars and the playtests:

1. **Fights are mostly watched, not played.** One real choice per fight (capitulate), plus an item. The design doc calls for a between-round "Trigger a Tactic" call and Four Humors pacing; neither exists.
2. **The world is static.** No other houses, no events, no festivals, no politics. Nothing happens that you didn't cause, so every month feels the same. (Design pillars: "imperial politics and deity festivals"; Gods' Days; rival houses.)
3. **Fighters are stat blocks.** No faces, temperaments, scars or memories. Losing one costs numbers, not a character. (Pillar: "Mortal Risk Management": injuries as *narrative* tags; traumas; cyborg augments.)
4. **A career is not yet a roguelike run.** When it ends there's little to show for it and no reason to start differently next time: no end-of-run story, no unlocks, no run variety.
5. **No sound, no art.** The page is clear but silent and faceless.

The plan tackles these in the order that most changes how the game *feels*, smallest valuable slice first. Every phase ends with a playtest (LLM or human) and passes the balance gates.

## Phase A: Every round is a decision *(highest impact, M)*

- **A1. Tactics between rounds.** Before each round pick a stance: *Press* (+win chance, +injury taken), *Guard* (−injury taken, −win chance), *Feint* (+first-strike chance), and one unlocked by class/weapon (e.g. Sagittarius *Volley*). Opponents pick too, shown after the reveal. Replaces "click Fight on" with a read-the-opponent choice every round.
- **A2. Four Humors.** Every fighter (yours and opponents') gets a temperament from the design doc: Choleric (fast start, fades), Sanguine (tempo), Melancholic (late anchor, stoic), Phlegmatic (studies, then strikes). It shapes which tactic works when, and gives fighters personality you can read on the card.
- **A3. Opponent "tells".** The Oracle reveals an opponent's humor and favourite tactic, so scouting matters.
- **Gate:** a smart-tactics bot must beat an always-Press bot by a clear margin (choices matter), without beating it by more than ~15 points (not mandatory micro-management). Keep auto-play: it picks a sensible tactic.

## Phase B: A world that moves *(M–L)*

- **B1. Weekly events.** About 1 week in 3, an event card with a choice: a fighter picks a fight in the barracks, a senator offers Gold to throw a match, plague in the city, a famous trainer passes through, a fan sends gifts. Each choice has visible stakes. Seeded, so careers still replay.
- **B2. Gods' Days.** Named festivals on the calendar (Mars, Fortuna, Saturnalia in winter…). Each favours a style (e.g. Mars: Power +payouts; Fortuna: upsets pay double), and some open a higher arena to you for one day.
- **B3. Rival houses.** Two or three named AI houses climb the same arenas. A standings table, their champions as recurring opponents and Bosses, grudges after kills, and the Grand Tournament as a final against the top house. Turns "opponent of the week" into rivals with names.
- **Gate:** events must not swing the careful win rate by more than ±5 points; no event can end a career on its own.

## Phase C: Fighters with stories *(M)*

- **C1. Scars and traumas.** Surviving a bad injury can leave a lasting tag: *Afeared* or *Enraged* against that opponent's style, or *Cowardly* (may beg not to go back in between rounds). Comebacks give *Battle-Hardened*.
- **C2. Cyborg surgery.** A Medbay Lv 2+ can replace a Maimed limb or Blinded eye with an augment: clears the injury, adds a tag, costs Gold and a little Renown.
- **C3. A fighter's chronicle.** Each fighter keeps a short history (recruited, first kill, titles, scars, rivals beaten). Shown on their card, and read out as a eulogy when they die.
- **C4. Retirement and the Hall of Champions.** Veterans can retire for a lasting house bonus; legends are remembered across careers.

## Phase D: A real roguelike run *(M)*

- **D1. End-of-career screen.** Stats, the best fighter, the house's story in a few lines, a score, and "what killed you".
- **D2. Legacy unlocks.** Achievements across careers unlock new starting options: patrons (start with +Gold, a veteran, or an Oracle), new kinds and classes in the market (the design doc's Tier 2 classes: Thorn-Blade, Samnite, Ash-Hungry…), new decor and gear. Stored with the Codex, so it survives career resets.
- **D3. Emperor's Decrees (difficulty levels).** Optional run modifiers after your first win, like Balatro's stakes: tougher Bosses, costlier tribute, permadeath for capitulating… Long-term replay value.

## Phase E: Getting fighters *(M)*

- **E1. Blind auctions** against the rival houses (sealed bids, lots in rising Desirability), replacing the fixed-price market for most fighters. Needs B3.
- **E2. The Stables:** exotic species and beasts (Basa, living armaments).
- **E3. Liaison Lv 2:** elite death-row prisoners: strong, but arrive with traumas.

## Phase F: Look and sound *(S–M each, can be interleaved early)*

- **F1. Portraits.** Layered SVG faces generated from the seed (kind, scars, cyborg parts, titles), as the design doc's layered-portrait plan. Static, no art pipeline needed.
- **F2. Sound.** Dice rolls, hits, crowd roar, death toll; one short ambient loop. Off by default or with a clear mute.
- **F3. Phone layout and save export/import** (also lets testers share saves).

## Later / needs a decision

- **Alternate victory: "Breaking the Cycle"**: build an Embassy, gather rebel gladiators, overthrow the Emperor. A big second win condition; best after B3 and C.
- **Inter-house poaching and sabotage.**

## Suggested order

1. **A (tactics + humors)**: the core loop is fights, so making each round a choice changes the game most. ~1–2 sessions.
2. **F1 portraits** alongside A: cheap, and makes fighters people.
3. **B1 events + B2 Gods' Days**: variety from week to week.
4. **D1 + D2**: reasons to play again.
5. **B3 rival houses → E1 auctions**: the biggest build; the world becomes competitive.
6. **C**, **F2/F3**, then the alternate victory.

Each step: write the rules into `docs/fight-rules.md` first, tests and gates, a playtest, then a short report.

## What "complete" means for v3

- Every round offers a meaningful choice, and good choices measurably win more.
- No two months feel the same (events, festivals, rivals).
- Losing a fighter is losing someone with a face and a history.
- A career ends with a story and unlocks something for the next one.
- A new player can learn it all from the game itself (tutorial + Codex), on a phone or desktop, with sound.
