# LLM playtest 4: seed 909 (brackets, purse, items, medbay)

## 1. Summary

- **Seed** 909, text interface (`scripts/play-text.js`). The command file has 517 lines: about 440 actions plus about 75 `look`/`codex`/`houses`/`market` checks.
- **Result:** I was executed in December, week 4 of Year 3, after 127 weeks. The record was 34 wins and 15 losses, and no fighter died. My top arena was the Imperial Coliseum. The Grand Tournament was never reached.
- **Final roster** (all Orcs; trained 13/13 at the Trainer Lv4 cap):

| Fighter | Class | Power / Speed | Notes |
|---|---|---|---|
| Vorath | Fighter, Fists | 23 / 6 | max level, three Titles, the star |
| Xanthe | Cestus | 22 / 9 | max level |
| Mevia | Gun | 22 / 6 | |
| Hector | Ornitharius | 19 / 9 | |

**Shape of the run:**

- **Dirt Pits:** I lost the Boss twice before winning it. The first loss came as a "Strong favorite": 87% and 89.5% rounds, both lost.
- **Bronze:** I lost the Boss once, then won it with Vorath (2–1) in Quintilis of Year 2.
- **Silver (first brackets):**
  - Tournament 1 was lost in the Quarter-final.
  - Xanthe won Tournament 2 through all three matches.
  - The Boss was lost in the Final, then won on the second try in Martius of Year 3.
- **Imperial:** I failed the Boss three times:
  - Iunius, Year 3: lost the **Quarter-final** at a shown ~70%.
  - September, Year 3: lost the **Quarter-final** at ~80%.
  - December, Year 3: lost the **Semi-final** after winning the Quarter-final.
- **Favor across those Imperial attempts:** 58 → 33 → 6 → 0. A `withdraw` from an Imperial Tournament 2 Final cost another −5 along the way.

**Economy:** gold was the bottleneck in Years 1–2; I was at 0–3 Gold for weeks at a time. By the end gold was no longer the constraint (I died holding 48 Gold). Favor was.

## 2. Where I was confused

- **Bracket odds change meaning without saying so.** The match line (`Vorath [f8]: match Favored ~60%`) is computed against the arena's Final opponent in normal weeks, but against the next bracket opponent in tournament week (`opponentFor`, src/run.js:161). Examples:
  - Silver Boss, October Year 2: Vorath read "Underdog ~40%" in week 3, then "Strong favorite ~90%" in week 4.
  - Imperial Boss, December Year 3: after the Quarter-final win, the label read "Underdog ~40%".
  - Neither number is the chance of winning the whole bracket, which is what I actually needed. With that number visible I would have skipped two Imperial Boss attempts.
- **The bracket stage is missing from the fight header.** A bracket fight is labelled `The Silver Coliseum · Tournament 1 · Vorath vs Pugnax`, with no Quarter-final or Semi-final.
  - The `Or skip (+2 Gold, the roster rests)` line stays visible mid-bracket.
  - The `Next:` line keeps saying "send a fighter … (or skip it)" while a fighter is already through to the Semi-final.
- **"Weaker opponents" in the Quarter-final and Semi-final often isn't true:**
  - Imperial Tournament 1 (Quintilis, Year 3): the Semi-final opponent had Power 23, the same as the Final's Power 23.
  - Imperial Boss (September, Year 3): the Quarter-final opponent Zorak had Power 21, the Semi-final opponent Ursa had Power 20, and the Final had 24.
  - Imperial Tournament 2 (Maius, Year 3): the Quarter-final opponent Juno already had Power 20.
  - Gear and perks from `seasonOpponent` swamp the −4/−3 offset.
- **"Scouted: opponent +1 Power (they fought here last month…)"** is ambiguous: "they" reads as the opponent, but it means my fighter (November, Year 1, and every month after).
- **The Boss card promises "Win: a Title (+1 Power)", but a fighter who is already Champion gets nothing.** Vorath beat the Bronze Boss in Quintilis of Year 2 after already becoming Champion there by winning three matches, so the Boss Title gave no +1.
- **The RIVAL tag lands on the wrong fighter.** Morg, the Final opponent, was marked "RIVAL (beat you before, now stronger)" in September of Year 3, but it was the Quarter-final opponent (Vibia) who had beaten me.
- **Phlegmatic "usually Guards first"** opened with Press about half the time (Silver Tournament 2 in Year 2 vs Vibia; Imperial vs Varro).
- **The tactic suggestion can contradict itself.** Against Sanguine Juno, who had just Feinted, it said "Suggested: feint" (Bronze Boss, Aprilis Year 2), even though Press beats Feint.

## 3. Bugs or things that looked wrong

1. **The loss advice is wrong when you were favored.** After losing as "Strong favorite" (Dirt Pits Boss, Maius Year 1; Silver Quarter-final, Sextilis Year 2; Silver Semi-final, November Year 2):
   `Advice: An even fight that went the other way.`
   This is the fallback at src/narrate.js:154, and it never looks at the pre-fight odds. Upset losses need their own line, for example "a 90% fight lost to the dice".
2. **Bracket opponents can share a name.** Imperial Tournament 1, Quintilis week 4 of Year 3:
   `Quarter-final vs Drusus (Power 20) → Semi-final vs Drusus (Power 23)`
   At src/run.js:146, `takenNames(run, run.brackets[tier]?.foes ?? [])` is called inside the `.map` that builds `foes`. At that point `run.brackets[tier]` is still unset, so the Quarter-final opponent's name is not excluded. The fix is to pass the foes generated so far.
3. **`math` doesn't list each bonus in text mode.** The tip says the math shows "each bonus", but text mode shows only the result. In the second Dirt Pits Boss fight (Sextilis, Year 1):
   - Round 1: `Power 12 vs 9: Delta +3. Hector wins this round 72%`.
   - Round 2: `Power 11 vs 8: Delta +3. Hector wins this round 52%`.

   The 20-point swing is never explained (src/narrate.js:52-53; the `mods` exist in fight.js).
4. **The match line's injury count is off for Poisoned.** Hector had `Injuries: #0 Poisoned ×2` and `Death Gate 2/3`, but the match line said `Death Some · 1 injury` (Iunius week 1, Year 1).
5. **Death risk looked inverted.** Hector (Unbreakable, gate 3, no injuries) showed `Death Low`, while Vorath (gate 2) showed `Death None` against the same opponent (Iunius, Year 1). I didn't trace this.
6. **The final loss result reads `-6 Favor`** (clamped from −25), and the Boss card had promised −25. That's harmless, but it's confusing on the screen where the career ends.

## 4. Balance

- **Brackets at tier 3 felt good.** Early-match purses (+6/+8 Gold, XP) became my main income, and winning all three matches was a real high (Xanthe, September of Year 2).
- **Brackets on Bosses at tier 4 are too punishing:**
  - Losing a Quarter-final costs the full Boss penalty (−25 Favor), the same as losing the Final.
  - At 70–80% per match, three matches come to about 30–45% overall, and the UI shows the per-match number.
  - Three Imperial attempts fell 58 → 33 → 6 → 0. Two of them ended in the Quarter-final.
  - Fix: a Quarter-final or Semi-final loss in a Boss bracket should cost less (for example −10), or the Boss bracket should be only the Final.
- **The Prestige spiral:**
  - Trainer Lv5 needs Prestige 90 (House level 5).
  - Every Imperial loss burns the buy-in (−8), and losses earn nothing, so Prestige went 78 → 38.
  - The roster stayed capped at 13 trained points against Imperial Finals at Power 24–26.
  - There was no way to climb out.
- **Lower arenas are dead income after tier 2.** Everyone was a Champion there or "Crushing mismatch" against Quarter-final opponents at Power 12–13, which costs Favor. Only the top arena paid.
- **Year-end purse:** 4 / 16 / 12 Gold in Years 1–3, against tribute of 15 / 30 / 45. The purse is a pleasant bump and makes `houses` worth checking, but it never changed a decision. Brass Lions overtook me in the last month, since Glory from early bracket wins is small.
- **Tactics:**
  - Opponents mostly play their humor, and the suggestion is right almost every time. I typed `next` for most rounds.
  - Net value is small: Guard vs Press is −5% then +10%, a net +5%, before Press's +3%.
  - It's flavour more than a decision. Phlegmatic is the only humor that makes you think.
- **Fight items:** combining War Paint and Blessed Bandage in one fight worked and felt good. At 10 Gold each they are a late-game sink; early on I could never afford them.
- **Medbay:** `treat <id> <injury#>` worked as described. I never had two injuries at once, so I couldn't test whether choosing the order matters.
- **Gold early on:** trainer fees (1 → 4 Gold per fighter per week) plus tribute meant weeks of "switched to Rest: not enough Gold". By Year 3 there was surplus and nothing worth buying.

## 5. What was fun / boring

**Fun:**

- Bracket nights with `fight fX 3`, deciding whether to buy an item between matches, and watching injuries carry over.
- Rotating fighters to dodge Scouting.
- Gods' Days timing: free entry at Saturnalia, Floralia's Gold bonus.
- Vorath's chronicle (`story`), and the race against Brass Lions in Glory.

**Boring:**

- Weekly events fire almost every week. There are about 10 repeats ("A stray at the gate" ×4, "Senator's offer" ×3), and most have an obvious answer.
- Dead weeks once everyone is capped: nothing to train, nowhere to fight.
- Winter.
- Tactic picking is rote.

## 6. Top 10 suggestions (most valuable first)

1. **Cap the Boss-bracket penalty for early-round losses.** Charge the full Boss Favor penalty only for losing the Final, and a smaller one (about −10) for a Quarter-final or Semi-final loss. Or make the Boss a single match.
2. **Show whole-bracket odds** ("Bracket ~35% · next match ~80%") and name the opponent each number refers to. Keep this the same in every week.
3. **Make the Quarter-final and Semi-final really weaker.** Apply the −4/−3 after gear and perks, or roll their gear from a lower tier.
4. **Fix the loss advice** (narrate.js:154): when you were favored, say so ("a 90% fight went against you").
5. **Fix the duplicate bracket names** (run.js:146).
6. **Give a way out of the late-game Prestige spiral.** Options: a Prestige trickle for Quarter-final and Semi-final wins, a smaller buy-in in Boss brackets, or a lower Trainer Lv5 requirement.
7. **Make lower arenas usable again.** Let lower-tier brackets field opponents near your fighter's Power, or exempt Quarter-finals from the Crushing-mismatch jeer.
8. **Label bracket fights** "Quarter-final (1/3)" in the fight header, and hide `skip` mid-bracket.
9. **Make the `math` text itemize modifiers** (strike first, tactic, read, humor, perks, items), the way the UI does.
10. **Cut weekly event frequency** to about one in three weeks, and rotate the pool. Also make humor tactic choice less predictable, or show only odds-based hints, so tactics become a decision.
