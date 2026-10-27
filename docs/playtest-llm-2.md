# Playtest (LLM) #2: seed 4242, text interface

## 1. Summary

- **Seed:** 4242, played through `node scripts/play-text.js --seed 4242 --last N < cmds.txt`. I kept appending commands to a file and replaying it.
- **Length:** 373 commands, 107 in-game weeks, from Martius, Year 1 to Quintilis week 4, Year 3.
- **Result:** **Won.** *"CAREER OVER: You won the Grand Tournament. The Emperor names you Master of the Games."* Record: 26 wins, 14 losses, no fighters lost. Favor finished at 92/100.
- **Roster:** three Orc Sagittarii (Unit Kappa, Torq, Krell) and one Elf Ornitharius (Grosh) that I added in Year 2. Unit Kappa won every top-arena Boss from the Dirt Pits on, plus the Grand Tournament.
- **Shape of the run:** the Dirt Pits took 14 months and 4 Boss attempts, and Favor fell from 50 to 20 ("DANGER"). After that it sped up: Bronze took 6 months and 2 Boss attempts, Silver 5 months and 1 attempt, Imperial 3 months and 1 attempt, and the Grand Tournament was won on the first try.

## 2. Where I was confused

- **Before starting: `--help`.** Running `node scripts/play-text.js --help` ignores the flag. It starts a seed-1 career and prints the intro and command list. Saving and replaying are only explained in the header comment of the script (`--seed`, `--last`). A new player wouldn't know that a career is just a list of commands you replay.
- **Martius wk1 Y1: no "Next:" hint anywhere.** The "Next:" hint the brief asks about doesn't exist in the text interface. `src/hints.js#nextHint` is only used by `src/main.js`, and `play-text.js` never calls it. The tutorial cards do some of that job, but they arrive late: the Stress card ("Watch the Stress bar") appeared only after Unit Kappa was already at Stress 60 and overtrained on fight day.
- **Martius wk1 Y1: "trained 0/3".** I didn't understand this until Kappa hit "Trainer cap reached (3 points)" two weeks later. The tutorial never says each fighter can only ever gain 3 training points at the start. I also had to test to learn that a +3 Speed week costs only 1 of those points, which makes Speed training three times as efficient per point.
- **Martius wk4 Y1, first fight:** the fight header said `You: Unit Kappa · Power 9`, but the math showed `Power 8 vs 7`. Overtraining (−1) and the opponent's Masochist (+1) are applied silently. This happened all game: the header shows **base** stats. In the Grand Tournament it said `Power 25 · Speed 9` while the round used `Power 26 vs 27` and Initiative `13+1`.
- **Maius wk1 Y1: stuck at 0 Gold.** I upgraded Quarters and recruited a third fighter, and that left me with 0 Gold. Training then failed: "Can't do that: Needs 1 Gold; you have 0." For a full month the house could do nothing but wait for fight day. Nothing warns you that spending your last Gold blocks training.
- **Maius wk4 Y1, first Boss:** the odds line said `Torq [f8]: Favored`, but Round 1 showed "Power 8 vs 10: Delta -2" and Torq lost 0–2. I couldn't tell where the boss's +2 came from: Crowd Favorite and Killer Instinct? The rule text "The champion fights with +1 Power" is ambiguous, since my fighter could also be "the champion". The same thing happened in Sextilis and November of Y1. Three "Favored" Boss labels in a row lost with round odds of 30–40%.
- **Boss lines say "`forfeit` (undefined Favor)".** This is a bug. `play-text.js:152` uses `FAVOR.forfeit`, which doesn't exist. So I never learned what forfeiting costs.
- **Sextilis wk4 Y1, items:** the Codex says items come from "the Apothecary (in the Market)", but `market` never lists an Apothecary or any item prices. I found the prices by failing: "Can't do that: Needs 12 Gold" (Crowd Bribe), 8 (Adrenaline), 10 (Blessed Bandage). The first `buy-item warPaint` spent all 10 of my Gold without warning. The between-rounds prompt also never mentions `use`. It only offers "`next` … or `capitulate`".
- **Septembris wk4 Y1, Scouted:** Torq had fought the Boss the month before. His odds line and match header showed the opponent at `Power 6`, but the round math showed `Power 8 vs 7`. Scouting is applied, but nothing marks it in the text interface. The Codex says "+1 opponent Power". The code comment says "+1 per consecutive month … (max +3)", and the Codex doesn't mention that it stacks.
- **"RIVAL (beat you before, now stronger)".** The Dirt Pits Boss Unit Sigma had this tag in Sextilis and again in November, and showed Power 9 both times. Later, in Sextilis Y2, a lower-arena boss also called "Unit Sigma" appeared as an Orc Sagittarius; the original was a Human Ornitharius. That looks like a name-reuse bug.
- **Aprilis wk4 Y2: Boss win with an existing title.** Kappa was already Champion of the Dirt Pits from 3 wins. The stakes promised "win a Title (+1 Power)", but beating the Boss gave nothing extra. The Codex does say "one Title per arena", but the stakes line should account for that.
- **Bosses always drop gear?** The Codex says "Bosses always do". I beat Unit Sigma, who had no gear, and the storeroom stayed empty.
- **"crushing mismatch: the crowd will jeer".** This warning appears on nearly every lower-arena odds line. Sometimes nothing happened (Torq and Krell at Renown under 5 in the Dirt Pits). Sometimes it cost Favor ("Imperial Favor -2 (a crushing win in a lower arena)" for Krell at Renown 5, Nov Y2). The Codex only describes the rookie exemption ("Rookies (under 5 Renown) are never jeered") under Championships, so I thought it applied only to Champions. The warning still showed for rookies.
- **Iunius wk4 Y3: Krell was booed for the win that made him Champion.** He won the Silver Coliseum lower Boss and got "The crowd boos Krell, a champion of this arena picking on its newcomers" (−3 Favor) in the same fight that gave him the title.
- **"Lower arena: no Favor at stake".** This is printed on every lower bout, but Grosh's lower-arena Boss win gave "+5 Favor (an upset)", and lower-arena jeers cost Favor. So Favor *is* at stake there.
- **Job blockers.** "Can't do that: All 1 Trainer Room is busy." doesn't say *who* is using it. In Nov Y2 I tried to train Kappa and Torq, but Krell was still on `trainPower` from the week before. I lost two weeks before I realised jobs persist until you change them. A message like "(Krell is training)" would fix it.

## 3. Rules the tutorial or Codex didn't explain

- The per-fighter training cap ("trained x/3") and that it's a **lifetime** total, raised only by Trainer upgrades. This turned out to be the main growth limit.
- A Speed week (+3) uses 1 cap point, the same as a Power week (+1).
- The training fee goes up with the **best** Trainer Room: 1 → 2 → 3 → 4 → 5 Gold per fighter-week. The upgrade I bought to fix my power problem also doubled my running costs. (The Estate does say "your best Trainer Room sets the cap and the fee", but the tutorial doesn't.)
- Jobs persist from week to week, including during tournament week.
- Losing a Boss restarts the circuit (T1 → T2 → Boss), so each failure costs 3 months.
- Boss arena rules are re-rolled for each attempt: Crowd Favorite, then Blood Moon, then Stripped of Armor.
- What lower arenas do when you don't send anyone: the bout just stays put (the Dirt Pits sat at "Tournament 2 · Ennia" for 2 months).
- Lower arenas get their own Bosses, and those pay Gold and can give Favor.
- Two level-ups at once (Grosh, Aprilis Y3) means picking perks twice, with a blocker in between.
- Max level is 6 ("XP 41, max level"). This is never mentioned beforehand.
- The odds label is a match-win estimate, but it often disagreed with the per-round numbers. For example, "Strong favorite ~80%" against a round showing "wins this round 50%" (Torq vs Ennia, Sept Y2). Without an Oracle, the five label words have no stated thresholds.
- What Blessed Bandage and Crowd Bribe do. I only learned War Paint and Adrenaline by buying them.

## 4. Meaningful decisions vs busywork

**Meaningful:**
- **Which fighter goes to the top arena.** Scouting makes this a real rotation puzzle: I kept my best fighter out of T2 so he'd be fresh for the Boss.
- **Capitulating** at MORTAL DANGER (Krell, Sextilis Y2, Dirt Pits boss at 1–1 while Poisoned). The warning was clear: "MORTAL DANGER: Krell has 2 injuries and can die if they lose the next round." It was a real trade-off.
- **War Paint before Bosses.** At 10 Gold it's a big decision early on. I used it on 3 Boss wins and the Grand final, and Delta +1 in the deciding round felt important.
- **Gold: Trainer upgrades versus the tribute.** Tribute is 15/30/45 a year, so I ran some careful "can I still pay if I lose every fight this month" maths. That was tense in a good way.
- **Spreading wins for Championships.** Getting Kappa a third Dirt Pits win for +1 Power is what finally beat the first Boss.

**Busywork:**
- **Winter.** Seven weeks with nothing to do, often with 1 Gold, so I couldn't even train. `to-tournament` handles it in one command, but it's dead time.
- **Restarting the 3-month Dirt Pits circuit** after each Boss loss, when all fighters were already at the training cap. Nothing changed between attempts except luck and the Boss's rule.
- **Re-setting jobs** every week because a capped fighter auto-switches to Rest but a trainable one keeps training.
- **Lower-arena fights** where every fighter is marked "crushing mismatch". You either accept −2/−3 Favor or leave the slot empty. I mostly left it empty, so those arenas were noise in the `look` output (4 arenas × 4 fighters = 16 odds lines).
- **Perk picks** felt mostly obvious: Mighty or Swift whenever offered. Closer, Crowd Pleaser and Iron Constitution rarely mattered.

## 5. Pacing, and whether the end was harder and fair

- **Year 1 was the hardest part of the game, and it shouldn't be.** With a 3-point training cap, every fighter peaks at Power 9. The Boss had 8 base plus a buff (+1 or +2), plus +1 from Scouting if you reuse a fighter. I lost three Bosses in a row and Favor went 50 → 40 → 30 → 20 ("DANGER"). One more loss and I'd have been close to execution, mostly because of luck in the very first arena. Reaching House level 2 (Prestige 10) is what unlocks the Trainer upgrade, and Boss losses cost Prestige, so the trap fed itself.
- **The Bronze Boss loss** (Unit Kappa at "Favored ~70%", round odds 65% and 75%, lost 0–2) cost −15 Favor, which hurt. But the climb from Bronze to Silver was the best part of the game: more arenas, more Gold, and real roster choices.
- **The Imperial Coliseum was a clear step up:** T1 opponent Power 19 versus Silver Boss Power 15. All my fighters were "Underdog" or "Long shot" until I bought Trainer Lv4 (cap 13), and then Lv5 (cap 21) before the Grand Tournament. That felt fair, because the Estate showed exactly what I needed.
- **The Grand Tournament** (Naevius, Power 24 plus a War Maul, so 27 in the round) was harder than the Imperial Boss, but with Trainer Lv5, 4 Titles, Mighty×2 and Juggernaut, Kappa was "Favored 59%". I won 2–0 on the first try. **The end felt easier than the start.** Once Gold flowed from four arenas, the snowball took over. I finished with 62 Gold, 92 Favor and the 45-Gold tribute still 21 weeks away.
- **Overall:** the start is a coin-flip gauntlet with harsh Favor penalties, the middle is satisfying, and the end comes quickly.

## 6. What won or lost the career

- **What won it:** stacking everything on one fighter. Unit Kappa ended at Power 25 (base) from training (21 cap), **4 Titles** (Championships in all four arenas), Mighty ×2 and Juggernaut. Add +1 or +2 from gear and War Paint, and he had a 1–3 Power edge in every late Boss fight.
- **Hunter's Bow drops** (+2 Speed) from Bronze opponents gave everyone first strike, worth +10% a round.
- **Rotating fighters** so the Boss fighter was never Scouted.
- **The Entertainment Room** (−15 Stress a week) made it possible to train every week with no overtraining. It was the best 8 Gold I spent.
- **What nearly lost it:** Year 1. I tried to fight the Dirt Pits Boss three times with fighters capped at Power 8–9, and I overtrained Kappa before his first fight because the Stress tutorial came too late. Morale also took Kappa out of training twice ("Switched to Rest: Restless (Morale 39): won't train. Raise their comfort."). Fame raises expectations faster than cheap decor can keep up.

## 7. Top 5 suggestions

1. **Make the first Boss beatable without luck.** Raise the Lv1 Trainer cap to about 5, or make the first Dirt Pits Boss loss cost less Favor. Year 1 currently decides the career and is mostly dice.
2. **Show effective stats and modifiers before and during fights.** The match header and odds lines should show the Power actually used, with tags such as "Scouted +1", "Crowd Favorite +1", "Overtrained −1" and "Gear +1". Players can't learn from "Power 9" when the round uses 8.
3. **Bring the "Next:" hint and the item shop into the text interface.** Print `nextHint` under each `look`. List the Apothecary items with prices and effects in `market`. Add "`use <item>`" to the between-rounds prompt whenever the player holds an item.
4. **Make the blockers and warnings accurate.**
   - Fix "`forfeit` (undefined Favor)".
   - Name who is blocking the Trainer Room ("busy: Krell").
   - Don't show "the crowd will jeer" for rookies under 5 Renown.
   - Don't boo the fight that *earns* the title.
   - Reword "no Favor at stake" in lower arenas, since upsets and jeers change Favor.
5. **Teach the training cap and its economy early.** Add one tutorial line ("each fighter can be trained 3 points ever; upgrade the Trainer Room to raise it, but the weekly fee rises too") and say that a Speed week costs one point. Also warn before you spend your last Gold when anyone is on a training job.

## 8. Text-interface issues (separate from game issues)

- `--help` isn't handled. It silently runs seed 1 and reads stdin. Saving and replaying through a command file is only documented in the script's header comment.
- **Fight state is lost if you chain commands without reading.** Since each run replays the whole file, sending `next next` in one batch twice walked a fighter past a MORTAL DANGER warning: Krell in Martius Y2 and Kappa at the Silver Boss. That's my mistake, but a `--stop-on-danger` option, or making `next` refuse once after a MORTAL DANGER line unless repeated, would protect script players.
- The tutorial text refers to GUI elements: "hover over them", "On the right you can see the opponent", "Check the house log on the left", "Open 'Show the round-by-round math'", "End week (Space)".
- The "Fight day" tutorial card kept coming back on later tournament weeks after I'd moved on. `ok` sometimes answered "No tutorial card to dismiss" when one had just been shown.
- `look` output gets very long by Year 3: 4 arenas × 4 fighters of odds lines plus full fighter cards. A compact mode, or hiding lower-arena lines where every option is a jeer, would help.
- `math` mode prints only the final percentage ("wins this round 60% of the time"), not the breakdown (base for Delta, first strike, traits, perks). The tip says "Nothing is hidden", but the parts that make up the total are.
- Storeroom indices (`equip f5 4`) shift after each equip. Equipping two items means running `store` again or equipping from the highest index first.
- The months mix Roman and modern names: "Quintilis" and "Sextilis", then "September", "October" and so on. That's probably intended, but it looked odd.
- `store` doesn't list fight items you own (only gear and decor).
