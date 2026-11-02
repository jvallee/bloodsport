# Bloodsport version notes

What changed from version to version, newest first. Each frozen version can still be played at its own address. Rules and exact numbers are in `docs/fight-rules.md`; the reasons behind playtest changes are in `docs/playtest-N-changes.md`.

## 5.4.0 (in progress)

- **Several careers at once:** the new **Careers** button lists every career saved in this browser (up to 8). Play any of them, or delete one. Starting a new career no longer abandons the one you were playing, and importing a save adds it as another career. Your old save carries over as the first one.
- **The Bronze wall is lower:**
  - The Bronze Arena's Boss fights at Power 13 (was 14).
  - Until you reach the Silver Coliseum, training costs at most 2 Gold a week per fighter, however good your Trainer Room. From Silver on, the fee is the Trainer Room's level again.
- **Training picks up again:** a fighter switched to Rest because they were close to overtraining, or the Gold ran short, goes back to the same training once they can. A Rest you choose yourself stays.
- **Fixes from playtest #10:**
  - A Quarter- or Semi-final won with 2+ injuries is a **Bloodied Victory**, with its Favour, Renown, XP and Morale (it can meet the Emperor's demand, too).
  - Withdrawing from a tournament no longer makes a nemesis of an opponent you never fought, and losing a Boss tournament early no longer says the Boss beat you.
  - The thumbs-up choice gives the right reason when a spare earns no Favour, and says when it still meets the Emperor's demand.
  - Event choices name your fighters ("Pertinax: joins the cause", not "the other").
  - A fight's result shows the purse and a won bet separately ("+8 Gold · Bet won: 5 Gold back (+1 profit)").
  - The Ludus says when the cheap training fee will rise ("2 Gold per training week (3 from the Silver Coliseum)").

## 5.3.0

- **The rebel speaks again:** after the first confession, the same prisoner takes you aside at each stage of the rising: when the favours begin, when they need a champion, and when it's ready. They warn you when the Praetorians are watching.
- **The crowd remembers its dead:** a Revenant's first fight back starts with the crowd chanting their name, worth +20 on the hype meter (Renown, and Gold on a win).
- **Fixes from playtest #9:**
  - A **Flesh Wound heals on Rest** too, at half the Medbay's speed, so a light wound no longer waits months for a bed.
  - When an old arena **moves on without you**, the house log says so, and who you'll meet next.
  - The thumbs-up choice says when their house **already owes you a life** (a debt isn't renewed while it runs).
  - **Revenants** keep their record: the Ludus marks them "risen" among the fallen, and their wins from before death still count.
  - **Grave Chill** names whose trait it is in the round-by-round math.
  - A Boss's stakes say its Title goes to a fighter who isn't the arena's Champion yet.
  - Event results start with a capital letter, and a wound reads "is wounded: Flesh Wound".
- **Betting, honestly priced:** odds read as a multiplier ("×1.25: a win returns your stake × 1.25"), and every bet line says what it returns and the profit. A bet too small to win anything at its odds isn't taken (small bets on a clear favourite used to return only the stake).
- **The Emperor's demands work:** a demand now lasts until that month's fight day. (It was judged the moment it was issued, so every demand failed and the Emperor never spoke.) Meeting one now pays +3 Favour and 3 Gold per arena tier; missing one costs 4 Favour, so they're worth chasing.
- **Short careers** start at House level 2, as their head start of Prestige promised. To keep them a challenge, their purses are ×1.75 (was ×2).
- **Fixed:** an Exhibition Ring bout (and hosting the Senate) crashed the page into the bug report box.
- **The rebel speaks:** the first political prisoner in your house takes you aside and tells you, plainly, that there is a rising against the Emperor. What they've heard of you colours it: mercy shown when the crowd wanted blood, fighters you bought and set free, how often your thumb has gone down, and how well your fighters live.
- **Mercy the Emperor wanted:** sparing a beaten opponent earns Favour only when mercy is what's wanted. If the crowd roars for blood, or the Emperor has demanded a death this month, he gives nothing for clemency (the verdict panel says so). Sparing against the crowd still makes their house owe you a life.
- **Feuds say how long they last:** each opponent's card and the house standings show how many months a feud, a debt of mercy or your vengeance has left (3 months, cooling by one at every fight day).
- **The top bar** shows how much Prestige you still need for the next House level ("5 to Lv 2"), not the total.
- **The tutorial month** starts with one gladiator instead of two, and the steward makes plain that someone must be training before you end the week.
- **The Unnatural Temple of Vulcan** takes the Stables' place in the Estate (Prestige level 2, 10 Gold; a career that had the Stables gets the Temple at the same level). Its priests can raise a fighter who was killed in the arena as a **Revenant**, up to 4 weeks after their death (12 weeks at level 2), for 10 Gold (+4 for each arena above the Dirt Pits).
  - A Revenant keeps their name, class, weapon, level, perks, titles and kills. At level 1 the Temple brings them back with 1 less Power; at level 2, at full strength.
  - Revenants feel nothing: their Morale settles at 50 whatever the room. They're never Inspired, and never Discontented.
  - Each Revenant has one of three new traits: **Deathless** (the Death Gate opens one injury later), **Grave Chill** (the opponent has −5% win chance every round) or **Cinder Heart** (+1 Power in Rounds 2 and 3).
  - The same body can't be raised twice, and the Praetorians burn the bodies of anyone executed.
  - Bodies waiting to be raised are in the Market tab, and your steward tells you when one arrives.
- **Basa are in the Market** like every other kind, and you'll meet them in the arena too. The Stables are gone. To keep them fair at Market prices, a Basa's natural Power is 5 (was 6); a Lion Cage in their room still adds +1.
- **Lower arenas move on without you.** If nobody from your house fights in one of your old arenas on fight day, its tournament goes ahead anyway: the circuit moves to its next stage with a new opponent. (They used to wait for you, on the same opponent, for months.)

## 5.2.0 (more fun)

- **Nemeses:** an opponent who beats one of your fighters is remembered with a name for it ("Gorrak the Butcher"). Every few months they come back to your arenas, stronger for every win over your house. Beat them for Renown, Gold and Favour.
- **Short careers and the daily Emperor's Challenge:**
  - A short career goes straight from each arena's tournament to its Boss, with richer purses.
  - The Emperor's Challenge is a short career on the day's seed: the same for everyone that day. Your best score for the day is kept.
- **Betting:** before Round 1, bet Gold on your own fighter at their real odds. Underdogs pay more.
- **The Emperor's demands:** some months the Emperor tells you, in person, what he wants on fight day. Do it for Favour and Gold; miss it and he remembers.
- **Bonds:** fighters who spar in the Exhibition Ring, or both win on the same fight day, become friends. They're happier together, a veteran teaches a rookie, and a death brings grief.
- **The crowd's hype:** a meter on the fight screen fills with upsets, wounds, kills and comebacks. It pays out in Renown, and in Gold on a win.
- **The Patron Lounge:** host the Senate each month for Influence, and pass policies: bigger purses, mercy that pays everywhere, lower tribute, lions for the Bosses, and more. Some please the Emperor; some don't.
- **The Liaison's prisoners** (convicts too) arrive seasoned, above level 1, in later arenas.

## 5.1.1 (interface polish)

- **The Codex, redesigned:** search, jump links, and sections that fold away. Basics and anything new start open. Locked entries are counted ("3 still to discover") instead of shown as rows of "???".
- **Thumbs up or down:** the crowd's wish is shown first, then Spare and Finish side by side, each with exactly what it does and whether it goes with or against the crowd.
- **Gamble results lead with the outcome** ("✔ It went well" / "✘ It went badly") in the result popup.
- **The Cyborg Eye says what it does:** +1 Power in every fight, and a blinding blow becomes a Flesh Wound (the fight story now says so when it happens).
- **The top bar** reads "Lv 1 · next at 12" (it looked like Prestige jumping from 1 to 12).
- **Fight day:** the opponent's card has room below the Withdraw button.

## 5.1.0 (from the designer's playthrough notes)

**Learning the game**
- **A tutorial month:** the steward walks you through your first month one step at a time (recruit two fighters, set a training job, end the week, reach fight day, send a fighter). The button to press glows, and each step is done by doing it.
- **The steward's news:** a short note when your house unlocks new buildings, or when the Market, Liaison or Armourer has new stock.
- **Phones and touch screens:** tap a stat, chip or badge to read its help text (there's no hover on a phone).
- **Event results** now appear in a popup, not just in the house log.

**Rules**
- **Prestige for every tournament win** (+1 for each Quarter- and Semi-final), so losing a Final isn't a total loss. A win in a lower arena always earns at least 1 Prestige.
- **Morale sinks slowly,** a few points a week, instead of dropping all at once. It still climbs at the old speed.
- **Injuries reworked:** Distracted is a passing daze that doesn't count toward the Death Gate; Maimed and Senseless now count as two injuries, like Poisoned.
- **Seasoned recruits:** in later arenas, Market fighters and prisoners of war arrive above level 1 with perks, and cost 2 Gold more per level.
- **Masochist** can't be switched off by an injury. **Blood Faith** Orcs who die also earn the house 5 Gold per arena tier. A new perk, **Merciful**: sparing always wins the crowd over.

**New buildings**
- **Temple of Fortuna:** pay Gold to swap a fighter's level-up perk choices for three new ones.
- **Exhibition Ring:** on tournament day, two fighters who aren't competing can spar for XP, Renown and Gold. Nobody dies in the ring.

**Interface**
- **The fight-day preview** shows the Power each side really fights with (scouting, feuds, festivals and the Challenger bonus included).
- **Answer the Emperor:** at the end of the opening you choose your reply, and he responds.
- **Gear** has its own fold-out on each fighter. Event choices line up in even columns. "Thrown to the beasts" makes clear the prisoner isn't one of your house.

## Unreleased (live game, after the v5 refreshes)

**v6 in progress: the hidden plot** (design: `docs/roadmap-v6.md`)
- **Characters talk to you.**
  - The Emperor pulls you through the portal and tells you the stakes himself. This opening plays at the start of every career, before anything else (Skip is one click).
  - Your steward, a plain and neutral helper, guides you through the game in place of the old tutorial cards.
  - The Emperor drops in at a few turning points: your first Boss win, the first winter's tribute, low Favor, and the Grand Tournament.
- There is a revolt brewing in the empire. Some of the Liaison's prisoners are not what their records say. *(Deliberately vague: the plot is meant to be found.)*
- **The Liaison** is rebalanced: convicts are Market-strength and cost 2 Gold; prisoners of war are near the arena's Power and cost more in higher arenas.
- **Fixes from playtests:**
  - The caravan's War Paint really is half price.
  - Feuds and "owes you a life" last their full months.
  - The crowd calls for blood when a beaten fighter's Death Gate is really open.
  - Capitulation advice no longer says "lost anyway".
  - A festival no longer leaks into a newly opened arena's preview.
  - A Codex entry for Challengers.
- **British spelling throughout:** armour, Imperial Favour, colour, favourite.
- **Long names no longer hide behind the Power and Speed badges** on fighter cards: when a name needs the room, the badges move to their own line.

**From the designer's playtest (#7)**
- **Prisoners of war** still arrive at their arena's Power, but anything above a Market fighter's natural Power counts as training they've already done. They can no longer train a full Trainer cap on top and end up far stronger than everyone else.
- **Championships cascade:** becoming Champion of an arena also crowns the fighter in every arena below it, +1 Power for each Title they didn't hold. A Silver champion no longer has to go back to the Dirt Pits for the bonus.
- **Tougher later arenas** to balance the extra Title Power: the first Silver tournament, the whole Imperial Coliseum and the Grand Tournament are each +1 Power.
- **Tournament bracket on the fight screen:** shows each round's opponent and Power, the current match, and who's up next.
- **Auto-play** starts promptly when you switch it on after playing a round yourself, and stays on into the next match of a tournament.
- **Market:** every section folds away. The Stables have their own section, so the Basa are easy to find, and upgrading the Stables brings the second Basa straight away. Decor shows its comfort (+5 Morale target) and Stress relief.
- **Unequip all gear:** a button in the Storeroom and on the roster returns every fighter's gear at once, so it can be handed out afresh.
- **Tribute:** after paying early, the top bar reads "Tribute paid" and the week panel says the tribute is already paid for this year.
- **Prestige hover** in the top bar: your House level, what the next level unlocks and how far away it is, and how Prestige is won and lost.

## v5 updates (2026-10-28, refreshed into /v5/ with no new tag)

**Fights**
- **Signature moves:** each class has one, unlocked at level 3 and usable once per fight. Bosses use theirs from the Bronze Arena on, and regular opponents only in tournament Finals.
- **Thumbs up or down:** after beating a wounded opponent, the crowd votes and you choose to spare or kill.
  - Sparing against the crowd's wishes means the other house owes you a life.
  - Killing against the crowd's wishes brings infamy.
- **The round winner is revealed with suspense:** a short pause, then a banner. The winner's card glows and the loser's dims. Rolls, stats and wounds stay hidden until the reveal.
- **Live Power on the cards:** cards show ▲/▼ changes each round. Hovering the Power, Speed or Morale badge shows where each point comes from.

**House and Market**
- The Armourer stocks 5, 6 or 8 items, depending on its level.
- Fighter Quarters house 2, 4 or 5 fighters, and House level 1 allows 4 fighters.
- Training switches a fighter to Rest when one more week would overtrain them.
- Morale shows the fighter's target and warns before they become Discontented.

**Tournaments and difficulty**
- No jeers for crushing mismatches in tournament Quarter- and Semi-finals.
- The Bronze Arena is gentler (opponent Power 11/12/14). The Silver Coliseum, Imperial Coliseum and Grand Tournament are tougher.
- Underdog now needs a gap of 2 or more Power. Dreaded comes after 2 kills.

**Economy**
- Item and gear prices were set by measured value per Gold, and most items cost half what they did.
- Lower-arena purses are halved for each tier below your top arena, with a floor on the win purse. Early tournament rounds pay more.

**Fixes from playtest #6:** gaps in the Power and Speed breakdowns, gear text, healing log names, verdict text, and duplicate names.

## v5.0 (2026-10-28): new content
- New kinds: Vampires, and Basa from the new Stables.
- New classes: Retiarius, Ash-Hungry and Blood-Bearer. New weapons: the Axe and Dagger. Weapons now have matchups.
- Five new Apothecary items, Imperial-tier gear (Armourer level 3), new decor and perks, and Boss arena rules such as Lions in the Arena and the Emperor's Gaze.
- Six more weekly events.
- Deaths are more likely. The risk is shown under Mortal Danger, with a warning before Round 1.
- Names are never reused while their fighter lives.

## v4.0 (2026-10-27): tournaments
- Three-match tournaments (Quarter-final, Semi-final, Final) from the Silver Coliseum up. You can withdraw between matches.
- A year-end purse goes to the top two houses.
- Fight items combine, one of each kind per fight.
- You choose which injury the Medbay treats first.
- Fighter panels have Room, Decor and Gear tabs.
- Whole-tournament odds. Poisoned counts as 2 injuries.

## v3.0 (2026-10-27): a living world
- **Tactics:** Steady, Press, Guard or Feint each round. Fighters have one of the Four Humors.
- **Weekly events** with choices, and Gods' Days festivals.
- **Rival houses:** standings by Glory, feuds and vengeance after kills, and a Grand final against the leading rival.
- **Legacy:** achievements across careers, patrons, Emperor's Decrees, an end-of-career score, and the Thorn-Blade and Samnite classes.
- **Fighter stories:** scars, cyborg surgery, chronicles and eulogies, and retirement to the Hall of Champions.
- **Presentation:** generated portraits, sound effects, a phone layout, and save export and import.
- Later refresh: gear dropdown, upcoming schedule, wins chip, and the Liaison under the Market.

## v2.2 (2026-10-27): fixes
- No Prestige soft-lock: the Dirt Pits take whatever Prestige you have.
- Disabled buttons show why. Items can be used before Round 1.
- Bug reports and crash reports.

## v2.0 (2026-10-27): growth and clarity
- Intro story, guided tutorial and the Codex.
- Speed gives evasion. Fighters gain levels and perks, gear, Morale and Renown.
- New buildings: the storeroom and the Armourer.
- Multi-arena weeks and Imperial Favor.
- Fight items: War Paint, Adrenaline Draught, Blessed Bandage and Crowd Bribe.
- Dice for initiative, an after-fight report, Championships and rookie protection.
- New traits (Underdog, Unbreakable, Bloodlust), kill marks and gear selling.
- Next-step bar, keyboard shortcuts and a tribute countdown.

## v1.0 (2026-10-26): first playable career
- Three-round fights decided by the Power difference, with a towel to throw in.
- Weekly calendar, house buildings, four arenas and the Grand Tournament.
- Market, training, tribute and saves.
- Pre-fight odds, fight narration and advice after a loss.
