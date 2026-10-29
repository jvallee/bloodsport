# Playtest LLM-7 (blind) — seed 7007

## 1. Summary

- **Seed 7007, about 455 commands, 66 weeks** (Martius wk 1, Y1 to Iunius wk 4, Y2). The career had not ended; I stopped at the command budget. About 60 of the commands were `look`, `market`, `estate`, `codex`, `story` or `ok`.
- **How I played:** blind. I did not read code or docs before or during play. I read the Codex basics entries (about 30) at the start, every card, and every event. I turned on `math` before the first fight and left it on.
- **Result:**
  - Dirt Pits conquered on the first Boss try (Maius Y1, Ignatia vs Eppia, 2–1).
  - Bronze Arena conquered on the second Boss try (November Y1, Ignatia vs Felix, the RIVAL who had beaten her in Sextilis). It was a Bloodied Victory, won on a 56.4 roll against a 57% chance, during Ludi Plebeii.
  - Silver Coliseum: lost T1 in December Y1 (Seren capitulated in the SF). Then I won T2 in Martius Y2, T1 in Maius Y2 and T2 in Iunius Y2, all with Ignatia. The third win made her **Champion of the Silver Coliseum** by the 3-wins rule.
  - Silver Boss (Aprilis Y2): Ignatia won the QF. In the SF she was at 3 injuries with "about 34% chance of death this round", so I capitulated. The Boss, Carpophorus, is now a RIVAL at Power 23.
  - At stop: Gold 74, Prestige 58 (House level 4), Favor 72. #1 of 4 houses, Glory 67 against Varro's 17.
- **Roster at stop:**
  - Ignatia (Orc Sagittarius, Lv 6 max, Power 18, Speed 9, three Titles, Dreaded). She carried the whole run.
  - Seren (Orc Ash-Hungry, Power 18).
  - Pollux (Orc Fighter Bow, Power 17, Champion of Dirt Pits and Bronze).
  - Ashka (Human Cestus, Power 14).
  - Krell (Liaison convict, Power 16, Lv 1).
- **Deaths:** none of mine. Hessa (the Dirt Pits Boss, House Varro) died to Seren's blow, which started a Varro feud.
- **Kills:** 3 (Eppia and Tetraites at the crowd's call, plus Hessa in the arena). I spared everyone else, mostly to keep "owes you a life" running against House Varro, which fields almost every Silver opponent.
- **Hidden layer:** at the very first `codex` I saw a category **"The Rebellion (0/10)"**. Nothing touched it for 15 months. Building a Liaison in Maius Y2 brought **Krell**, a 1-Gold "condemned convict" at Power 16. His prison record says visitors ask for him by a name not on the record. Next week a **broken chain** was chalked on his door. I copied the sign, and three Rebellion Codex entries unlocked (mark, political, officer). I stopped there (section 4.1).

## 2. Where I was confused

- **Week 2, Y1: changing who trains.** `job f8 trainPower` was refused while Pollux held the only Trainer Room, so I set Pollux to rest. That cost a whole week of training. The refusal says what to do, but jobs are evaluated in command order, so you must clear the room before you assign it.
- **Gold 1 with Trainer Lv2 (Maius Y1).** I upgraded the Trainer Room to my last Gold. The fee doubled to 2 per week, and I couldn't train anyone for the 3 weeks before the Boss. Nothing warned me at upgrade time that the fee rises (the Trainer-cap tutorial says so, but it only appears later).
- **"Favored" in the preview, 27% in the ring.**
  - Bronze T1, September Y1. The preview said Ignatia was **Favored** against Kastra (scouted and feud both listed).
  - Round 1 was 27% and Round 2 was 39%, even with Aimed Shot.
  - Kastra won the first strike, took his own First Volley and had a correct read. Still, nothing in the preview had suggested a coin flip at best.
  - After I built the Oracle (Iunius Y2), the "~90%" numbers felt much more trustworthy.
- **Phlegmatic "Guards first."** Tetraites (R1 Press), Kastra (R1 Feint) and Glabra (R1 Feint) did not guard first, and Juno guarded in R2 instead of countering. That is 3 of 9 Phlegmatic opponents in Round 1. The data (`leans guard 70`) makes it a 70% habit, but the tooltip reads like a rule.
- **Injury chance is a bare number.** Win chance gets a full breakdown in `math` mode; injure chance is only "needs 65 or less".
  - Mordra needed 65 to wound Seren in a round where Seren had Power +5 and Guarded (Silver T1 QF, December Y1). I still can't explain that number.
  - First Volley's "+10% injure" side and Hawk Strike's −3 Speed never appear by name. Ignatia's initiative dropped from 9 to 6 with no line saying why.
- **"Challenger".** In the Silver SFs and Finals a "+1 Challenger" appeared in the opponent's Power line. There is no Codex entry (`codex basics:challenger` → no entry). The preview later explained it ("famous fighters draw tougher opponents"), but the bracket line "Final vs Glabra (Power 19)" still shows 19 when she fought at 20.
- **Lower arenas stop paying off.** By Silver, every fighter of mine was either a Champion of the lower arena (−3 Favor, no Prestige) or a "Crushing mismatch" (−2 Favor). I didn't know whether to keep sending them for the Gold.
- **Year rollover.** The calendar went December wk 4 → "Winter, week 1 · Year 1" (4 weeks) → Martius Y2. The tribute line moved to "30 Gold, in 43 weeks" at Winter wk 2, but the year label only changed at Martius.
- **Kill vs. spare wording.** The prompt says "kill: +3 Renown" when the crowd wants blood, and the Codex says "+2 Renown" (the extra +1 is the crowd bonus). It's fine once you read `codex basics:mercy`, but the two don't line up at a glance.

## 3. Bugs or things that looked wrong

1. **The caravan sells War Paint at "half price" for more than full price.**
   - `src/events.js:71` says "selling War Paint at half price".
   - `src/events.js:74` charges 5 Gold.
   - `src/data.js:386` lists War Paint at 4 Gold in the Apothecary.
   - Seen in September Y1, week 3.
2. **The festival purse leaks into next month's preview for a newly opened arena.**
   - On Floralia week (Maius wk 4, Y1), after I beat the Dirt Pits Boss, the new Bronze Arena showed "Tournament 1 · Win: +15 Gold". The next week it showed +10.
   - `src/run.js:127–128` uses `from = run.bouts?.[tier] === 'done' ? run.week + 1 : run.week`. An arena that opened this week has no `run.bouts[tier]`, so `from` stays on the festival week and Floralia's ×1.5 is applied to a bout a month away.
3. **Capitulating gives "lost anyway" advice.**
   - Seren capitulated in the Silver T1 SF at Delta +3. The advice was "Seren was the stronger fighter (Delta +3) and lost anyway: favourites still lose now and then. Keep sending them…".
   - `src/narrate.js:158` (the `avgDelta >= 2` branch) runs before the `reason === 'towel'` check at `:162`.
4. **The crowd's call for blood ignores the real Death Gate.**
   - `src/run.js:1767`: `blood = … || wounds >= 2`, which is hard-coded.
   - Felix in Lions in the Arena had 1 wound, so his gate was open, but the crowd "chants for mercy". The same happened with Nyx, whose Unbreakable was disabled.
   - `deathGateAt` in `src/fight.js:20` already handles Lions, Unbreakable and Iron Will, and the Codex says "a fighter left at the Death Gate".
5. **"Owes you a life for 3 months" lasts about 2 tournaments.**
   - `house.owed = HOUSES.feudMonths` is set during the tournament week (`src/run.js:1812`). `rivalsCompete` decrements it at the end of that same week (`src/run.js:612`).
   - Corvinus, spared in Martius Y1, had stopped owing by Iunius wk 1.
   - Feuds (`h.feud`, same function) probably have the same off-by-one.
6. **Unattended lower arenas freeze.**
   - The Dirt Pits showed "Tournament 1 vs Marcus (Android Fighter, Power 6)" in December Y1, Martius Y2, Maius Y2 and Iunius Y2.
   - The header listed Silver/Bronze on "Tournament 2" while the Dirt Pits was on "Tournament 1".
   - `advanceArena` (`src/run.js:1880`) only runs for a bout that was fought or skipped, so an arena you never visit keeps the same opponent and stage forever. Probably intended, but it looks broken.
7. **Names are reused across different fighters.**
   - Carpophorus: Orc Ornitharius (market, September Y1), Orc Ash-Hungry (market, November Y1), then Elf Cestus (Silver Boss).
   - Ennia: Orc Retiarius (market), Human Ornitharius (market), Silver QF opponent.
   - Orsk: Android Sagittarius (market), then Elf Blood-Bearer (Dirt Pits Boss).
   - Briseis: Orc Fighter (market), then an Elf in the Silver SF.
   - Rusta and Elowen were both beaten Silver opponents, then reappeared at Lv 1 in the Iunius Y2 market as other kinds.
   - At first I read this as a hidden story thread; after the third case I decided it was the name pool. (LLM-6 noted the same, bug 9.)
8. **Bosses "always drop" gear, but three didn't.**
   - The Armourer text says "Bosses always do".
   - Eppia, Hessa and Orsk dropped nothing. None of them carried gear, so this is a wording issue, not logic. It still made me expect loot.
9. **Odd fighter loadouts.**
   - Nonia is a "Human Fighter (Club)" equipped with a Hunter's Bow.
   - Zenna (Retiarius with a Hunter's Bow) still counted as "melee-only" for Pollux's Pin at Range (+1 Bow).
   - Seren wore a Hunter's Bow, and Kroth is an orcish name on an Elf. None of this is broken, but it reads oddly.
10. **"99.999%" round chances.** These show whenever bonuses push past 100, with "needs 100 or less". Displaying "certain", or capping at 99%, would read better.

## 4. Focus sections

### 4.1 Anything strange or unexplained

In the order I noticed them, with what I did about each:

- **"The Rebellion (0/10)" in the very first `codex` listing (Martius wk 1, Y1).** Every other category had something discovered; this one was empty and had a loaded name. I noted it and moved on, because there was nothing to click and the brief said not to dig in the code.
- **"The Red Hand" (Martius wk 4, Y1).** It is a rival house name that doesn't fit the Roman "House X" pattern of Corvinus and Varro. I suspected it was connected to the Rebellion. Nothing came of it: they stayed bottom-tier all run.
- **"Kaeso · Blood Faith: If this fighter dies in a match, the Prestige buy-in is refunded."** This is an opponent's trait whose effect only matters to its owner's house. I didn't act on it.
- **Recurring names** (bug 7). My first thought was "the same people keep coming back as different things". I watched for a story and found none, so I filed it as the name pool.
- **The Liaison convict, Krell (Iunius wk 1, Y2).** I built the Liaison mostly because the brief said to use every building. Krell came for 1 Gold:
  - Power 16 with "+7 Training" already on him, more than any 7-Gold Silver recruit (Power 9–10).
  - Morale 30, with a Flesh Wound.
  - Prison record: "The guards say visitors ask for them by a name that isn't on the record."
  - That is plainly a hook, and a 1-Gold Power-16 fighter is also strangely generous. I recruited him at once.
- **"Chalk on the door" (Iunius wk 2, Y2).** "Someone had chalked a sign on Krell's door: a broken chain. Krell says nothing, and watches to see what you'll do."
  - Both options read "Nothing happens", which is itself a signal.
  - I chose **Copy the sign onto another door**. That unlocked `rebellion:mark`, `rebellion:political` and `rebellion:officer`.
  - `rebellion:political` says the Liaison's political prisoners "always come cheap: someone pays to place them in a house", which explains Krell's price and training.
  - `rebellion:officer` says a freed officer "arms your barracks for the rising".
  - I ran out of budget two weeks later, so I never saw where the rising goes.
- **The Emperor theme.** The envoy, the senator's "The Emperor's spies are everywhere" and the "Imperial Favor: at 0 you are executed" rule all read differently once the Rebellion shows up. I accepted the senator's purse, lost 8 Favor (the "35%: nothing" was the good branch), and wondered whether that counts for anything with the rebels.
- **Ignatia's chronicle** (`story f8`) is a neat history: first kill, Dreaded mark, and Felix's blow leaving a scar ("Enraged against ranged fighters"). The scar was a real mechanic I'd never have found otherwise. It gave her +1 Power against the Sagittarius Boss who scarred her, and I won the rematch partly because of it.

**Honest timeline:** I noticed the Rebellion category on turn 3 and the odd names by Aprilis Y2. I only engaged with the hidden layer in the last 30 commands, because nothing pointed at the Liaison as the door. The Liaison's description ("Monthly 1-Gold condemned convict") reads as a cheap-fodder building, and I skipped it for 14 months in favour of Trainer and Medbay upgrades.

### 4.2 Fun and pacing

**Where it was exciting**

- **The Bronze Boss rematch** (November Y1) was the high point.
  - The Lions rule meant my 1-injury fighter faced an open Death Gate.
  - I put the mushroom and War Paint into R1 and Aimed Shot plus Iron Tonic into R2.
  - In R2: "★ Ignatia unleashes Aimed Shot! ★ Felix unleashes Aimed Shot!", then a 56.4 roll on a 57% chance.
  - The win came with a Bloodied Victory, a Title, a Ludi Plebeii upset bonus and House level 3.
- **The Silver T2 Final** (Iunius Y2) was decided by a 53.8 roll on a 55% chance in Round 3, after the signature. Becoming Champion of the Silver Coliseum without beating its Boss was a nice surprise.
- **Items and signatures matter at Silver.** Stacking +3 Power from items with a signature turned 18-vs-21 Finals into coin flips. That is the right feel for a "spend to push" decision.
- **Capitulate is a real decision.** I used it twice (Seren in December, Ignatia at "34% chance of death"). Both times the MORTAL DANGER line gave me exactly what I needed.
- **Events are short and flavourful.** The lion hunt, the spy, the sparring and the stray dog all fit. The gamble ones (60%/55%/70%) made me think about who was fighting that week.

**Where it dragged**

- **Gold-starved stretches.** I was at Gold 0–5 for most of Maius–Sextilis Y1 and again in Winter, ending week after week with nothing to decide. The Trainer fee (1 → 2 → 3 Gold per fighter-week) eats most of a Bronze purse.
- **Winter is 4–6 weeks of `end-week`.** Training is the only lever, and the cap stops it early.
- **Lower arenas become dead weight.** From Bronze on, every fighter I had was either a Champion or a "Crushing mismatch" in the lower arenas. Three arenas' worth of preview text (about 60 lines per `look`) was mostly options I'd never take.
- **The same opponent for six months** in the Dirt Pits (bug 6).
- **The Silver Boss wall.** Carpophorus went from Power 22 to 23, while my best fighter peaked at 18 with Trainer Lv3 capped. Trainer Lv4 needs House level 4, which I only reached in the last week.

### 4.3 Clarity (things I had to guess)

- What "Senseless" does. The Codex entry unlocked, but the fight never showed an effect: it disabled no trait, unlike Distracted and Maimed.
- Why the opponent's Speed or my initiative changed mid-fight (Hawk Strike −3 Speed and Rainy Mud −2 Speed are only visible as smaller initiative numbers).
- That killing or beating a house's fighter lowers their Glory (`src/run.js:1640,1748`). The Red Hand's Glory went 2 → 1 with no log line, and `codex basics:houses` doesn't mention it.
- Whether Entertainment Room adds comfort (the Codex and Estate only mention Stress).
- Whether a Hunter's Bow on a non-Sagittarius makes them "ranged" for Pin at Range, Enraged-vs-ranged and Ludi Apollinares.
- Style matchups such as "Shoots before the net flies +5%" (bow vs Retiarius). These are not in the Codex as far as I found.
- That the Silver Champion title by 3 wins doesn't open the next arena (I assume only the Boss does). The result line said "Title: Champion of the Silver Coliseum · House level 4!" and nothing else.
- What an Armourer upgrade adds. "Stocks fine (tier 2) gear" only appears in the Estate row after Lv 2, so I never knew whether it would sell +2 Power weapons.
- The Liaison's real purpose (section 4.1).

## 5. Top-10 suggestions

1. **Point a light at the Rebellion door.** Give the Liaison description or a mid-game event one hook, for example "Some prisoners have more interesting records than others." I had the Codex category from turn 3 and no idea what unlocked it until month 15.
2. **Fix the crowd/Death Gate mismatch** (bug 4). Use `deathGateAt` in `offerMercy`, so Lions, Unbreakable and Iron Will match the Codex.
3. **Fix the "owes a life" and feud duration off-by-one** (bug 5): decrement before checking, or set feudMonths + 1.
4. **Fix the caravan price** (bug 1): 2 Gold for "half price", or drop the claim.
5. **Fix the festival preview leak** (bug 2) and the capitulation advice (bug 3). Check `reason === 'towel'` first.
6. **Show injury chance as a breakdown** in `math` mode, like win chance, including First Volley's injure side, Blood Moon and Spiked Gauntlet. Also add one-line narration for Speed changes ("Hawk Strike: Ignatia −3 Speed").
7. **Make the preview odds trustworthy without an Oracle.** Either show rough % on every preview, or include Challenger and first-strike odds in the bracket "(Power N)" line, so "Favored" doesn't turn into 27%.
8. **Keep lower arenas useful late.** Rotate a stronger "visitor" there, or let Champions take exhibition bouts for Gold with no Favor penalty. Collapse the repeated "Lower arena:" paragraph, and let untouched arenas advance their schedule (bug 6).
9. **Smooth the Gold curve around training.** Warn when an upgrade will raise the training fee beyond current Gold. Or make Trainer Lv2 cost the same per week and charge the fee only on the cap.
10. **Codex gaps:** add Challenger, the style matchups, Glory loss for beaten houses, Senseless's effect, and whether gear changes a fighter's ranged/melee status. Document the Phlegmatic tell as "usually (7 in 10)".
