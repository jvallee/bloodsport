# Playtest LLM-7: the hidden plot (informed), seed 7117

## 1. Summary

- **Seed 7117, about 430 commands on the main career, about 104 weeks** (Martius Y1 to Quintilis Y3). I also played two short branches from the same seed: betraying at the prefect's offer, and scrubbing the first chalk mark. The career had not ended when I stopped.
- **How far the plot got: the `ready` stage.** Every requirement for the coup was met in Aprilis Y3 (week 94): trust 17, barracks armed, Mevia recruited as champion, two contacts freed, and a forged pass in hand. **No ending was reached on the main line.** I never got near the Grand Tournament. I was stuck at the Silver wall (four Silver Boss attempts lost or forfeited, Prestige 21–36, House level 3), so the coup was out of reach within the budget.
- **Endings seen:**
  - **Loyalist** (branch, Dec Y1): I took "Name the names". It gave +30 Favor (to 100), and Unit Theta and Mevia vanished into "Fallen" with no log line.
  - **The plot stalls but never goes "cold"** (branch): I scrubbed the chalk mark and played on for 29 weeks. No other plot card ever came, and the plot never ended either (see Bug 2).
  - Not seen: coup, martyr, treason, raids. The highest suspicion was 69. The informer's gamble twice moved it by ±20.
- **Plot timeline on the main line** (hidden state from a read-only replay probe of my command file; I made all choices through the text UI):

| Week | Card | My choice | Trust / Suspicion after |
|---|---|---|---|
| 24 (Sep Y1) | bought Unit Theta (political officer, Power 9, 1 Gold) | | 0 / 0 |
| 26 | Chalk on the door | copy the sign | 1 / 0 |
| 30 | A cousin at the gate | let him in | 2 / 5 |
| 33 | A bout for the street | let Vorath take the fall | 4 / 4, stage `cause` (House level 3) |
| 39 | The prefect's offer | know nothing | 5 / 3 |
| 43 | Blood at the gate | hide him | 7 / 3 |
| 46 | Pamphlets | leave them | 8 / 8 |
| 50 | My brother is in the cells | free Tetraites (8 Gold) | 10 / 13 |
| 55 | One of ours across the sand | promise to spare Flamma | 11 / 15 |
| 58 | The forged pass | buy (8 Gold) | 12 / 17 |
| 62, 68 | The champion (Unit Theta) | sound out: failed twice | 12 / 33 |
| 71 | Free me (Calyx) | free | 15 / 33 |
| 77 | The champion (Mevia) | failed | 15 / 42 |
| 82 | A curious guest | feed him a story: went well | 15 / 24 |
| 86 (Winter) | Steel for the cause | hand over 2 gear | 16 / 36 |
| 89 | The champion | failed | 16 / 43 |
| 94 | The champion | **succeeded** → `ready` | 17 / 45 |
| 100, 104 | A curious guest ×2 | went badly (69), then went well (49) | |

- **Political prisoners offered:** Unit Theta (officer), Mevia (courier) and Calyx (priest), plus one false clue (Vorath, "Bears an old brand from the legions"). That is 3 out of about 20 Liaison offers.

## 2. Confusions

- **Most plot buttons say "Nothing happens".** "Copy the sign onto another door → Nothing happens", "Let him in → Nothing happens", "Leave them where they are → Nothing happens", and worst of all "Name the names → Nothing happens", which then executed two of my fighters. Hiding trust and suspicion is the design, but "Nothing happens" is a false statement, not silence. The cautious and the risky options look identical.
- **"Sound Mevia out → A chance: nothing; otherwise: −10 Morale".** Success, the thing I wanted, is described as "nothing". Even with an Oracle, the odds show only as "A chance", while the informer's card shows "A gamble (50%)". I had to read the code to learn that the odds were the champion's Morale.
- **The forged pass is invisible after you buy it.** "Buy it (8 Gold) → −8 Gold", and then it appears nowhere: not in `store`, not in `look`. A player who buys it will forget they have it, or never know the raid card will accept it.
- **The cousin's visit promised something and gave nothing I could see.** It is meant to reveal the next Boss rule, but Boss rules are already printed on the Boss card in Boss week, Oracle or not. Nothing visible changed (see Bug 3).
- **"Blood at the gate": the purse is paid twice in text.** The choice pays "+6 Gold" at once. Two weeks later the log says "The stranger in the Medbay is gone before dawn, leaving a purse", and no Gold arrives.
- **"My brother is in the cells".** The title says brother, but the text never does. Vorath (not political) asks for "Tetraites", who is not on the Liaison's offer that month. A month later a *Tetraites* (Power 15) was my Silver Coliseum Quarter-final opponent. I couldn't tell whether that was the man I freed, now fighting for a rival house (see Bug 6).
- **Is the coup ready?** Nothing on screen told me I had reached `ready`, except a new Codex entry ("rebellion:coup"). After that the plot went quiet except for the informer. Without the probe I would not have known whether to keep waiting or keep helping.
- **The "most famous fighter" rule for the champion is invisible.** The card switched from Unit Theta to Mevia once Mevia's Renown passed Theta's. I could only steer it by managing Renown, and nothing said so.

## 3. Bugs or things that looked wrong

(Line numbers as of 18:20 on 2026-10-28. `src/plot.js` and `src/data.js` were being edited during my session; `armedWin` appeared mid-run.)

1. **Betrayal executes fighters silently.** In `betray()` (`src/run.js:509–520`), political prisoners go to `run.fallen` with no `log()` call and no chronicle entry. The only log line is "Imperial Favor +30 (you gave the Emperor the names he wanted)". Unit Theta's `story` still ends at "Earned the mark Dreaded", with no death. The "Executed on your word" line goes to `run.epilogue`, which only shows at career end, and the text UI never shows it (`scripts/play-text.js:222–224` prints `endReason` but not `epilogue`).
2. **Scrubbing the chalk mark leaves the plot stuck forever.** Refusing `chalkMark` keeps `stage: 'mark'` with `refusals: 1`. No other non-forced card has stage `mark`, and the "ask again" fallback excludes `chalkMark` (`src/run.js:384`), so no card can ever fire again. The thread also never ends `cold`: with a political prisoner on the roster, `plotMonth` (`src/run.js:419`) never ends it, so the Bystander line can't appear. Buying more political prisoners doesn't restart it. In my branch, 29 weeks passed with no card. The doc says "refusing twice in a row ends it", but here one refusal ends it silently.
3. **`cousinVisit`'s `reveal` does nothing.** `src/run.js:452` sets `p.reveal`, and nothing reads it (grep finds no other use).
4. **The "Free me" log loses the name.** The log reads "Free me: Free ." `chooseEvent` builds the label with `eventNames(run, ev)` *after* the effects run (`src/run.js:1068`), so a fighter removed by `freeAsker` (or by the raid's `execute`, or by `askedFree` ×2) has no name. Compute the names before applying effects.
5. **The priest contact's payback is invisible and can extend bad moods.** `src/run.js:412` adds +3 to `f.mood.n` and resets `weeks` to 4 every month. That keeps any negative event mood alive too, for example a −15 from a refused rescue. The +3 also doesn't appear in the card's "heading to X (comfort +…, fame expects −…)" breakdown, and there is no log line. Two freed priests (Tetraites and Calyx were both priests) don't stack. That's fine, but nothing tells you.
6. **Freed contacts' names collide with arena opponents.** `freshName` (`src/plot.js:50`) avoids your roster, market, fallen and freed names, but not rival houses' fighters or bracket opponents. "Tetraites", freed in Aprilis Y2, was a Silver Quarter-final opponent in Maius Y2.
7. **Possibly: champion recruitment fails too often.** Four failures in a row at displayed Morale of about 69, 59, 51 and 44 (`p = morale/100`, `src/plot.js` `recruitChampion`). That's about a 3.5% chance. Each failure also costs −10 Morale and +5 suspicion, so it may just be seed luck, but it's worth a unit test of the roll.
8. **The Codex unmasks political prisoners.** Once trust > 0, recruiting a political prisoner immediately prints "(New in the Codex: rebellion:courier)" (or priest, and so on) (`src/codex.js:193`). It's a perfect detector, and it beats reading clues. Vorath, the false-clue prisoner, unlocked nothing, which confirmed he was ordinary.
9. **The "cheap" clue can't show at Liaison level 1.** Political prisoners get `price − 2` (`src/run.js:343`), but level 1 convicts always cost 1 Gold, so the price is clamped to 1 and looks the same as everyone else's.
10. **Liaison convicts are far stronger than the Market (not plot code, but it drives the plot).** `refreshLiaison` uses `oppPower − 2` (`src/run.js:318`). In Silver, the Liaison sold Power 16–17 fighters for 1 Gold, while the Market sold Power 7–10 for 7 Gold. Every political prisoner I bought became a starter: Mevia was my best fighter. That makes buying them a no-brainer, and the plot's start nearly automatic for anyone who builds a Liaison.
11. **Non-plot: "A merchant caravan… War Paint at half price" costs 5 Gold.** The Apothecary sells War Paint for 4.

## 4. The plot's pacing

- **Cadence: good.** 19 plot cards in 78 weeks (weeks 26–104), every 3–6 weeks as designed. They blended well with ordinary events. Cards also came in Winter (Steel for the cause, Winter wk 3), which is a nice quiet-season beat.
- **Acts 1–2 are far too fast.** Chalk mark (wk 26), then `cause` by wk 33: 7 weeks and 3 cards. The yard bout's +2 trust plus House level 3 skipped most of Act 2. The prefect's offer, meant as a late temptation, was the very first Act 3 card (wk 39), before I'd done anything big for the rebels. Refusing it cost nothing, and betraying would have cost very little.
- **Act 3 drags.** `cause` lasted 61 weeks (wk 33–94). The two must-haves come randomly from the pool:
  - "Steel for the cause" didn't appear until week 86, after the champion card had come up 3 times.
  - The champion card came 5 times in all, and failed 4.
  - Between them came one-off favours that no longer mattered: trust was already 15, nearly three times the 6 needed.
- **Trust saturates.** I reached 6 by week 43 and finished at 17. After that, every "help" choice gave nothing new, so the favours stopped feeling like progress.
- **`ready` is a dead zone.** Once ready, the only card left is the informer (at suspicion 40+), until the Grand Tournament, which for me was years away. Suspicion keeps climbing about 2 a month (2 prisoners plus 2 contacts minus decay), so the late plot is "wait and gamble on the informer". There's no new story, no countdown, and no sign that the rebels know you're ready.
- **It's tied to the hardest part of the game.** The payoff needs a Grand Tournament run. A player who reaches `ready` at Silver (as I did, and as LLM-6 did) waits through the Silver and Imperial walls with nothing to do in the plot. Consider letting the coup trigger at the current top arena's Boss when the Emperor visits, or adding Act 3½ cards while you wait.

## 5. Choices and stakes

- **No-brainers:**
  - **Blood at the gate:** "Hide him → +6 Gold, one Medbay bed for 2 weeks" against "Call the watch → +2 Favor". Helping pays, the bed cost is trivial, and the risk is hidden. Everyone will help.
  - **A bout for the street:** the cost (−2 Renown, −5 Morale) falls on the named fighter. Vorath had 0 Renown, so it was free.
  - **Political prisoners themselves:** Power 16 for 1 Gold. See Bug 10.
  - **Free me:** −1 fighter, but they become a contact (+5% in the coup Final, and the cell's payback). Fine as a real choice, but the asker was Calyx, a 16-Power starter, so it did cost something. This was the best-weighted card in the set.
- **Traps:**
  - **Name the names** says "Nothing happens" and kills your political fighters, possibly your best ones (mine were Theta and Mevia). The Loyalist road is meant to be the easy one, but as written it reads like a free +30 Favor.
  - **Scrubbing the chalk mark** permanently and silently ends the plot (Bug 2).
  - **Sound your champion out** is a Morale spiral. The target is always your most famous fighter, whose fame expectation makes high Morale hardest to hold. Each failure costs −10 Morale (and +5 suspicion), which lowers the next try's odds. Mevia was "Mutinous 19" when the card first named her. I spent about 45 Gold on decor just to make the roll worth taking.
- **Honest stakes:** "a prisoner goes free", "leaves your house for good", "one Medbay bed taken", "2 pieces of gear handed over" and "executed" are all good, concrete and honest.
- **Dishonest or empty stakes:** "Nothing happens" on help buttons. "A chance: nothing" for the success case. "−8 Gold" for the pass, which says nothing about getting a pass. Suggestion: never print "Nothing happens" on a plot card. Print a deniable, visible line instead ("the sign stays on the door", "a stranger knows your name").

## 6. Suspicion and danger

- **Could I sense it? Partly.**
  - "A Praetorian watched training today, and wrote something down" appeared from about week 60 (suspicion 20+). It's good: clear, ominous and in-world. But it repeats word for word almost every month, so it became wallpaper.
  - "A curious guest" at 40+ is a good second step.
  - "Favor −1 (the palace grows cold toward your house)" at 60+ is good, and names the cause.
  - There was no sign between 45 and 69. The informer's gamble jumped me 49 → 69 → 49 within a month, so the single most important danger roll is a coin flip worth ±20.
- **The informer is a hidden-stakes coin flip.**
  - "Say nothing → Nothing happens" against "Feed him a story → A gamble (50%)". After the roll, "It went badly" with no visible effect.
  - In the `ready` stage it repeats (twice in 4 weeks for me). Each bad roll is a quarter of the way to a raid.
  - The safe choice is free, so the only reason to gamble is to bleed off suspicion. Fine, but the player should see *something* when it goes badly, such as "He leaves early, without finishing his wine."
- **Raids: not reached** (highest 69). I can't judge their fairness from play. From the card text:
  - The four options are clear.
  - "Bar the gates" is a 50% chance of losing the whole career ("treason"), and the button will presumably show only "A gamble (50%)". The career-ending stake should be on the button.
- **Suspicion as a resource:**
  - My suspicion came from the cousin (+5), the pamphlets (+5), freeing Tetraites (+5), arming the barracks (+10) and failed champion rolls (+5 each, +20 in total).
  - The failed recruitments were the largest single source, and the player can't see that.

## 7. Rescue requests

- **They feel personal when the asker is political.** Calyx's "Free me" was the best card of the run. I had fought with her for six months, she was strong, and losing her hurt. That is the design working.
- **They feel less personal when an ordinary fighter asks.** Vorath (an ordinary convict I'd owned for 5 months) asking for "my brother" Tetraites felt arbitrary: no backstory, and the brother wasn't in the cells I could see. Tie the name to the Liaison's actual offer, or to the asker's chronicle ("Vorath's brother, taken the same night").
- **Not seen:** "Thrown to the beasts" (`freeCondemned`) never fired, because it needs a plot card due during a tournament week. Neither did a refused "Free me" or an escape attempt.
- **"One of ours across the sand":**
  - Flamma was the Final opponent; I lost the Semi-final, so I never met her. The mark then sits on that opponent.
  - Nothing reminded me of the promise when the bracket showed "Final vs Flamma". The opponent card should carry a small mark ("a chalk sign on their shield") or Mevia should whisper before the match.
- **Contacts' payback: not noticeable.**
  - Both my contacts were priests (Tetraites by random roll, Calyx by cell), which pay +3 Morale a month, invisibly (Bug 5).
  - No log line, and no entry in the Morale breakdown.
  - The scribe's letter ("A sealed letter arrives…") is the only payback with a visible beat.
  - Contacts should "check in" now and then with a line naming them ("A priest's blessing reaches the barracks from Calyx").
  - The Codex lists each contact's +5% coup bonus, but I could not see a list of my contacts anywhere. Add a "contacts" or "friends outside the walls" line to `look` or `story` once the plot is under way.

## 8. Text and tone

Worst lines to rewrite first:

- **"Free me: Free ."** (Bug 4).
- **"→ Nothing happens"** on any plot help choice, and especially on "Name the names".
- **"The stranger in the Medbay is gone before dawn, leaving a purse."** A purse with no Gold, after you were already paid.
- **"A Praetorian watched training today, and wrote something down."** Fine once, but 8+ identical repeats. It needs 4–5 variants and an escalation at higher suspicion ("Two Praetorians now. They don't bother hiding the tablets.").
- **The cards say "rebels" outright.** "The rebels want the city to see one of their own beat a gladiator of your house" (A bout for the street, my third card) and "The rebels want Unit Theta…". The design says cards should read like ordinary Ludus life. After the chalk mark, "the rebels" is fine in an informed run, but for blind discovery the second favour already says it plainly.
- **Pronouns.** "Buy them, then let them go. They're worth more…" and "Vorath lowers their voice". The generic "them/their" for a named brother reads as machine text. Gendered or named pronouns per fighter would help the personal cards most.
- **The officer is never named.** "An old centurion asks for weapons" when my officer, Unit Theta, was standing right there. Use the officer cell's prisoner as the speaker when you have one.
- **"Unit Theta", a Vampire.** An android-style name on a vampire undercuts a "political prisoner arrested in the Forum".
- **What works:**
  - "Chalk on the door".
  - The jackal pamphlet.
  - "Blood at the gate".
  - "Steel for the cause" ("Two blades will do.").
  - The Codex entry for Silbannacus ("feared knives ever since").
  - "Every door in the city has a broken chain on it" (the coup's eve).

## 9. Top-10 suggestions

1. **Never show "Nothing happens" on a plot card.** Give every choice a small, visible, deniable consequence line. Show "Name the names" honestly (for example "your political prisoners will hang").
2. **Log the betrayal as it happens** (who is taken, one line each, plus a chronicle death entry), and show `run.epilogue` in the text UI's end screen.
3. **Fix the scrubbed-mark dead end.** Either a second chalk mark later (on a different prisoner), or end the thread `cold` so the Bystander line appears.
4. **Pace Act 2 properly.** Require a minimum number of favours or weeks before `cause` (not just trust 4), and move the prefect's offer to after the barracks are armed or the champion is recruited, when betrayal costs most.
5. **Make the Act 3 requirements arrive reliably.** Give "Steel for the cause" and "The champion" priority over one-off favours once trust ≥ 6, and cap trust's usefulness, or turn excess trust into a visible benefit.
6. **Rework champion recruitment.**
   - Show the odds, or say "Mevia seems unsure".
   - Let the player choose among the top 2–3 fighters.
   - Make a failure cost less Morale, or none after the first.
   - Unit-test the roll (Bug 7).
7. **Give `ready` a pulse.** A card saying the rebels are waiting, a hint at how far the Grand Tournament is, and maybe a "dress rehearsal" Boss-week card. Or allow the coup at your top arena's Boss when the Emperor attends.
8. **Make contacts visible:** a "Friends outside the walls" list in `look`, and a named log line when each contact's payback lands. Give the priest's Morale its own line in the Morale breakdown.
9. **Fix the leaks and the clue:** don't unlock `rebellion:<cell>` Codex entries on recruitment. Make the "cheap" clue visible at Liaison level 1 (for example, ordinary convicts cost 2). Lower Liaison convicts' Power so political prisoners aren't free starters.
10. **Make suspicion legible without numbers:** vary the Praetorian log lines and escalate them by band. Show a visible line when the informer gamble fails. Put "treason: your house falls" on the "Bar the gates" button.
