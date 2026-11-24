# Blood and Circus version notes

What changed from version to version, newest first. Each frozen version can still be played at its own address. Rules and exact numbers are in `docs/fight-rules.md`; the reasons behind playtest changes are in `docs/playtest-N-changes.md`.

## Unreleased (7.8.1)

- A vampire's Blood Drinker closing a Bleeding wound now says so (it used to say a Distraction closed).

## 7.8.0 (2026-11-24): fights with more feeling

- **Last words:** when a career ends, the Emperor (or the narrator) has a final word, different for every way it can end. After The Chains Break, the revolt's leader says what they think of your answer, and an unmasked mole's fate gets a line of its own.
- **Livelier fight stories:** a wound is now described by the weapon or style that dealt it (a club crashes through a guard, a net drags a fighter down), first strikes and deaths have several ways of being told, and a round where nobody draws blood gets a line of its own.
- **Fights on a phone:** your choice for the round (the tactics, Capitulate, and any MORTAL DANGER warning) now stays pinned to the bottom of the screen, and the "Fight day" button no longer floats over the fight.
- **The rules in brief:** How to play has a second tab with how you win, how you lose, and how Power, Speed and luck work (the Power-gap odds among them). These pages were written for the intro but could no longer be reached.
- **A fighter's death is remembered:** when a fighter dies, the fight screen now gives their epitaph and the last chapters of their story. The house log no longer says "lost" straight after "died", and the end of a career shows the names of the fallen under their faces.
- **One name per rule:** giving up a match between rounds is always called capitulating now (the Codex called it forfeiting, which is a different thing: giving up a bout before it starts, and the Emperor's summons called it yielding). British spelling throughout: Humours, maths, the Quantum Analyser.

## 7.7.0 (2026-11-24): quicker and clearer fights

- **Fewer clicks:** the result of an ordinary event or a Fortune card now appears as a notice at the top of the page instead of a pop-up you had to close. Gambles, The Chains Break, an unmasked mole and the month's digest still open their own pop-up.
- **Unrest, moles and covert ops are easier to notice:** the hint bar now warns when a fighter is Mutinous (with the house's unrest), when a mole has left clues, and when your agents could still work on your next opponent before fight day. The Estate tab shows a dot when something waits there, and How to play explains all three.
- **See who strikes first:** before each round the fight screen shows each fighter's chance to strike first (it decides close rounds), counting Speed, Concussions and Footwork.
- **Quick pace for fights:** a "Quick pace" switch beside "Show the math" plays each round in about half the time (about 2.5 seconds instead of 5). The round that decides a match still takes its time. Your choice is remembered.

## 7.5.1 (2026-11-24): a fight survives a reload

- **Reloading during a fight no longer counts as capitulating:** the fight is saved with your career and picks up exactly where it was, with the same dice, so nothing can be undone and nothing is lost. A phone discarding the tab, or a reload before Round 1, no longer costs you the buy-in, Favour or a new nemesis.

## 7.5.0 (2026-11-24): safer saves and fights

- **No accidental rounds at the Death Gate:** while a round is still playing out, Space, Enter or a click only finishes showing it, so you always see the next round's choices (and any MORTAL DANGER warning) before acting. While MORTAL DANGER shows, Space and Enter do nothing: fighting on or capitulating takes a deliberate click.
- **Two tabs on one career:** if you play a career in another tab, the older tab says so and stops saving, so it can't overwrite your newer progress.
- **Importing a save keeps your own Codex and Legacy** unless you choose to replace them.
- **Boss bracket notices:** each of a bracket's results can now be dismissed on its own (dismissing one closed them all).
- **A career that won't load is no longer quietly replaced:** the game tells you why and lets you download that save, report a bug, open your careers, or play a new career. The broken save stays in your browser.
- **A save that fails is no longer silent:** if your browser refuses to store the career (its storage full, for example), a warning stays at the top of the page telling you to export your save, and the career list doesn't claim a fresh save.
- **Finished careers no longer fill your career list:** only careers still in play count toward the limit of 8, and starting a new one makes room by dropping the oldest finished career (its result stays in your Legacy record).

## 7.4.1 (2026-11-23): fixes

- **The Chains Break:** if the ringleader is secretly the palace's mole, turning the revolt on the Palatine now backfires: they run to the palace, are unmasked, and the palace grows more suspicious (they used to join the rebels' cause).
- **After a fight:** a fighter who becomes Battle-Hardened and takes a scar in the same fight now shows both (the scar hid Battle-Hardened).
- **Fight report:** against a fighter with a Cyborg Arm or Eye, a weapon's signature wound is described from the Flesh Wound it would have been (it said "turned a Maimed into Bleeding").
- **Temperament:** a tie between two pieces now shows the change of temper as paused (it still said "Turning"); a Revenant's temper never changes and they don't meditate, as the room already said, and the decor now says so too.
- **Bribe the Armourer** can't be bought against an opponent who wears no armour (you paid for nothing).
- **Investigating** waits until a fighter's bracket is over (it could leave a bracket without its fighter).
- **The Temple of Vulcan:** raising an executed mole no longer brings back a spy, and a fighter who died partway through a change of temper rises without it.
- **Steal the Playbook without an Oracle:** you now get the exact Round 1 tactic and no tell after it (it showed a false tell at "about 0%" in later rounds, and the suggested tactic followed it).

## 7.4.0 (2026-11-23): blood, unrest and knives in the dark (7.2–7.4)

- **Bleeding:** a new wound between a Flesh Wound and a Concussion. It counts as one injury and makes a fighter easier to hit (+10%, or +5% while Guarding) until it heals. A Blessed Bandage staunches it for the fight, and Blood Drinkers can drink it.
- **Every weapon has a signature wound:** Daggers and blades make wounds bleed, Clubs and Cestus fighters Concuss, Axes and Flails Maim, Bows Blind. A style only changes *which* wound lands, never makes it heavier on the Death Gate. The fight report says when a style turned a wound.
- **New fight items:** Blood Thinner (light wounds bleed) and Blinding Powder (a hard hit Blinds). Viper Venom now turns wounds to Poison, and a hard hit can make a lighter wound Poisoned.
- **New Arena Craft decor:** the Viper Terrarium (Poison; soothing for Ash-Hungry and Vampire fighters) and the Whetstone Rack (bladed fighters make wounds bleed).
- **The Cyborg Arm** now turns a Maiming blow into a Flesh Wound, like the Cyborg Eye does for blinding.
- **Unrest replaces the old revolt:** each Mutinous fighter stirs up the barracks (Choleric fighters, convicts, champions and Skull Racks make it worse) and may start a brawl, steal from the strongbox or try to escape. The top bar shows Unrest when there is any. You're warned at 5; at 8, **The Chains Break**: pay to calm them, send in the guards (the card shows both sides' Power: lose, and the Ludus falls), or, if you're with the rebels, turn their fury on the Palatine. Calm every Mutinous fighter in time and it never comes to that.
- **Moles:** a feuding house (or a suspicious palace) can buy an unhappy fighter, and sometimes a cheap Market fighter is a rival's plant (their card says something is off). They leave clues; investigate a fighter to unmask them, then execute, turn or ransom them. An Oracle Lv 2 or the Whispering Gallery narrows the suspects to two.
- **Covert ops:** with a Liaison or the Whispering Gallery, once a month before fight day, work against your next opponent: steal their playbook, doctor their wine, or bribe their armourer. Get caught and it costs Favour, or a feud.
- **Fairer bets:** the bookmakers now price items you've already used and any dirty work done to the opponent, and so do the odds when you choose a fighter.
- **Heat climbs differently:** Heat 2 is now a Greedy Emperor and Heat 3 Hungry Lions (Lean Fortunes moves to Heat 4), so each step of Heat stays harder than the last now that moles are about.
- **Fixes to the new decor:** the Iron Rules Boss debuff now switches off the Spiky Bed and Skull Rack too, as it says ("room decor gives no bonus"); the Spiky Bed only counts wounds taken in that fight, not old ones still healing; taking a piece out of a room ends its change of temper straight away; the fear help text mentions the Rock Garden.

## 7.1.0 (2026-11-23): living quarters

- **Temperament decor:** four new pieces for a fighter's room, each shaping their temper. Keep one as the room's main piece for 4 weeks and their Humour changes for good: the **Rock Garden** makes them Phlegmatic, the **Spiky Bed** Melancholic, the **Skull Rack** Choleric and the **Wine Amphora** Sanguine. The fighter card shows a change under way ("→ 2/4"), and each piece says what it would do to that fighter.
- **Rock Garden:** −8 Stress a week, and a fighter resting beside it meditates: −10 more Stress, +1 XP, and half a step toward conquering a fear.
- **Spiky Bed:** no comfort at all, but a win taken with even one wound makes them Battle-Hardened.
- **Skull Rack:** a severe wound scars them Enraged, never Afeared.
- **Wine Amphora:** the most comfortable piece, and the crowd warms to them: every fight starts with a little Hype.
- **Decor is grouped** in the shop and the room: Comfort, Temperament and Arena Craft.

## 7.0.0 (2026-11-23): sharper seasons, a fairer Heat, and a full bug sweep

Version 7 smooths the season from start to Grand Tournament, rebalances the weapons, gear and tactics that were too strong or too weak, and fixes a long list of bugs found in a full review. Version 6.0.5 is frozen and playable at `/v6/`, with its own saves, so a career there and one here never overwrite each other. Your current careers carry over to version 7.

**A smoother season**
- **The Silver and Imperial walls are lower:** their opponents are a little weaker, and the Grand Tournament is now the hardest fight of a season, as it should be. A won season takes about 15 fight months.
- **Recruits keep up:** in a season, the Market's and the Liaison's fighters arrive stronger in the higher arenas, so a new recruit is still worth hiring late on.
- **Training costs rise in steps:** 2 Gold a week in the Dirt Pits and Bronze Circuit, 3 in the Silver Coliseum, and the full price from the Imperial Coliseum on (it used to jump straight to full price at Silver).
- **Small purses are worth taking:** the steward's early tasks now pay at least 1 Gold (some paid nothing), a Purse of Coin from Fortune is richer (5 Gold in the Dirt Pits), and hosting the Patron Lounge costs 2 Gold a tier (was 3).
- **Heat climbs in order:** each step of Heat is now harder than the one before. Heat 1 is still Harsh Judges; Lean Fortunes and Hungry Lions now come second and third, then a Greedy Emperor and Iron Bosses.

**Fights**
- **Tactics:** Steady now lowers the chance to be injured (−2.5%). Press gives less win chance (+1.5%, was +3%) and makes you easier to wound (+10%, was +7.5%).
- **Weapons:** the Sword parries more often (25%, was 20%) and a parry also gives +5% win chance next round. The Axe adds +5% chance to injure on top of its worse wounds.
- **Classes and moves:** Birds of Prey (Ornitharius) works from the first blow, not only once your fighter is hurt. Haymaker is safer (+5% to be injured, was +10%), Aimed Shot is stronger (+12% win, was +10%), and Cast the Net is weaker (−4 Speed and −5% win, was −5 and −10%).
- **Blinded counts as two injuries**, like the other wounds that bad.
- **Viper Venom** is stronger: +15% chance to injure and worse wounds next round.
- **Gear:** the Hunter's Bow and Light Greaves trade a point of Speed for win chance or armour and cost 14 Gold (was 12); the Trident, Executioner's Axe, Lorica Segmentata and Lion Pelt are cheaper and/or stronger.
- **The Oracle's tells stay put:** what the Oracle shows you no longer changes how the fight plays out, so a bug report replays the fight exactly.
- **No spoilers in the fight animation:** the fighters' cards show the state before the round until the blow lands, so you no longer see a death or wound before it happens.

**Rules that now hold**
- **Losing early to a Boss isn't a cheap way out:** losing in a Boss Quarter- or Semi-final pays no Gold and costs three quarters of the Boss's Favour (was half).
- **The Emperor's summons:** surviving pays only if your fighter lasts all three rounds; being swept 0–2 costs 5 Favour.
- **The Fates' Wager:** if you can't pay a lost wager in full, the rest is taken in Favour.
- **Lower Tribute** discounts one year's tribute, not every year.
- **At most one surprise event a month** while you plan, outside fight days.

**Fixes**
- A fighter in the middle of a Boss bracket can no longer be released, retired or sent away by an event (this could lock up the bracket).
- Reloading in the middle of a fight no longer breaks the save (it did for Orcs with Blood Faith).
- Phlegmatic opponents no longer crash the fight after you go All In.
- Skipping a bout in a season no longer creates a phantom second tournament.
- The Liaison's discount now applies to every recruit, and the game no longer ends your career for being "too poor to recruit" when a discounted fighter was affordable.
- Returning legends from the Hall can no longer be retired and returned again and again.
- A healed fighter leaves the Medbay however they were healed.
- The Emperor's summons shows the opponent's real Power (it showed 18 too few).
- Boss brackets show the opponent you face next, with their Power, Speed and purse, and the Final's opponent below.
- Very old saves (version 2) load again; a damaged or newer save gives a clear message instead of failing.
- Sound: a browser blocking sound no longer opens the error box, and sounds stop when you leave a fight or switch career.
- Easier to read: higher-contrast danger colours, a header that no longer covers the Codex, keyboard focus outlines, screen-reader labels on tabs and portraits, and "reduce motion" respected everywhere.
- A renamed fighter keeps their face; Basa have the right ears; the unlockable classes have their own gear in portraits.
- The Surgeon names each injury properly, and locked Codex entries no longer show up in search.

## 6.0.5

- **Your first victory stands out:** the house's first ever win gets a gold banner above the result, saying what it means and what comes next.

## 6.0.4

- **Rename your fighters:** under a fighter's "rename, retire, release" fold-out. It's free, but about two times in three they resent it: −10 Morale for 4 weeks.

## 6.0.3

- **End week:** the button that plays a single week now says "End week" (it said "One week").

## 6.0.2

- **Fortune's cards deal in once:** the cards' entrance animation played again every time the page redrew (each Next in a dialogue, for one). Now only a new hand animates: a new month or a spin.

## 6.0.1

- **Fight day says who's who:** the list of your fighters under each arena is headed "Your fighters vs" and the opponent's name (it was "Your odds", and read like a list of opponents).

## 6.0.0 (2026-11-10): one more career

Version 6 is built to make you start another career. A month is the turn, and a season (about 21 fight months when won) is the default career. Each month Fortune deals cards: fighters, gear, boons and 21 relics that change how fights go. Every career earns Legacy XP toward an unlock tree, and Heat makes later careers harder. The crowd is live, Oracles read the opponent's tells, and All In is a last gamble at the Death Gate. Frozen and playable at `/v6/`; the notes below (the beta and alpha steps) list every change. Some of the new words are still first drafts, waiting for the designer's rewrite.

## 6.0.0-beta: balance, and what three playtesters found

- **The crowd loves a read:** a round where your tactic counters the opponent's now fills the hype meter too (+10), so good play can win the crowd, not only pressing.
- **All In is a true gamble:** +20% to take the round, but lose it and your fighter falls. The button shows that chance.
- **Honest tells:** with an Oracle, the tell comes with one forecast that weighs it against the opponent's temper ("about 66% they Press").
- **Relics never stop coming:** once your house holds six, a relic card can still be taken by laying down one you choose.
- **Fortune's fighters keep up with your house:** a drafted fighter or returning legend arrives no more than 2 Power behind your second-best fighter (closer for rarer cards).
- **Heat 1 bites:** under Harsh Judges, falling before a Boss Final costs the full Favour.
- **Stripped of Armour** now switches your armour piece off entirely, as it says.
- **A quicker season:** in a season, a training week gives double (+2 Power or +6 Speed) and the arenas' opponents grow to match, so a won season is about four to five months shorter. The Long Road keeps its pace.
- **Legacy levels come at a steadier pace:** an arena climbed is worth 5 Legacy XP (was 10) and a Boss beaten 3 (was 5), while the first levels cost a little less (60 XP, then 15 more each level). Up to level 6 every level comes as soon as or sooner than before; later levels need a little more.
- **The Emperor's purse for the names is a little richer** (22 Gold an arena, was 20), and in a season it pays like the season's other purses (×1.6).
- **A Boss who beats you comes back stronger, as promised:** in a season, a lost Boss (and the whole rematch bracket) returned weaker than before. Fixed, along with the Emperor's summons and the Championship wants.
- **Fortune's fighters arrive trained, not gifted:** a drafted fighter's catch-up to your house counts as training they've already done, so they can't train a whole Trainer cap on top and outgrow your own fighters.
- **Reading a Feint pays:** a Feint countered by Press loses its first-strike bonus.
- **Underdog never backfires:** it now closes the gap, up to +2 (+1 when the opponent has 1 more Power), so a +1 from the crowd or a relic can't switch it off.
- **A season's arenas, re-balanced after those fixes:** the Dirt Pits are a touch harder (+2 Power over the Long Road's, was +1), the Bronze Circuit gentler (+3, was +6), the Silver and Imperial arenas a little gentler too (+10 and +17, the Grand +18), and a lost Boss costs a fifth more Favour (12 in the Bronze Circuit, up to 30 at the top). A won season is about 21–22 fight months.
- **Fewer repeated names:** a fighter Fortune deals you and you pass over no longer turns up next month as someone else.
- **"Retire with honour" is a real choice:** only a veteran behind your strongest fighter asks to retire, never your champion mid-climb.
- Fixes: "undefined" when going All In; "87.999%"; "three cards" when four were dealt; "a Imperial"; a legendary label on a Dirt Pits vest; the Augur's relics are "rare or legendary"; the Wolf's Pelt and the Fates' Wager say what they do (its house log line too); the Boss card shows the halved Favour for an early loss.

## 6.0.0-alpha.4: fights with a crowd

- **The crowd is live.** Press and drama fill the hype meter (Press fills it three times faster than before), and now **Guard drains it**. When a round starts with the crowd past the mark on the meter, your fighter fights it with **the crowd behind them: +1 Power**, and the meter glows.
- **Reading the opponent:** with an Oracle, the opponent gives away what they mean to do each round (a tell). It's usually right (7 in 10; 8–9 in 10 with a better Oracle), never always. Auto-play's suggestion weighs it.
- **A warning when a seasoned opponent is about to unleash their signature move** (for everyone).
- **All In** at the Death Gate: a last-ditch round with +15% to win it and +10% to wound, at a much higher risk of being wounded (which, at the gate, can kill). The button shows the chance of death.
- **Fight-day juice:** the round that decides the match plays slower, with a "Decider!" banner; a blow flashes and names the wound on the card it lands on; kills shake the arena harder; Titles get confetti; the crowd cheers louder as hype builds, and roars when it takes your side.

## 6.0.0-alpha.3: every career counts

- **Legacy XP after every career, win or lose.** The end screen shows what you earned and why (a career, each arena climbed, each Boss beaten, kills, Titles, a win, how the plot ended), fills your **Legacy level** bar, and shows what the new level unlocks.
- **The Legacy tree:** each level unlocks something for every career after it. Relics that a first career never sees (the Loaded Dice, the Scrolls, the Gilded Laurel, Proserpina's Coin, the Eagle Standard), **legends who return**, a starting **Oracle**, a new patron (**the Augur**: open the career with a pick of three rare relics), **a fourth Fortune card** each month, and **house colours**. The Codex's Legacy panel shows the whole tree and what's next.
- **Heat** replaces the Emperor's Decrees: choose Heat 1–5 before a career, each adding one rule to the last (Harsh Judges, a Greedy Emperor, Iron Bosses, and two new ones: **Lean Fortunes**, one card fewer; **Hungry Lions**, every opponent +1 Power). Higher Heat: a higher score and +20% Legacy XP a level. **Win at Heat N to unlock Heat N+1.** Your first career win unlocks Heat 1.
- **The Hall remembers:** once unlocked, a legend who retired in an earlier career can be dealt as a Fortune card, once, to fight for your house one last season.
- **The Emperor's Challenge keeps a streak:** days in a row, shown when you start a career and at the end of a daily one. The daily career never uses unlocks or Heat, so it's the same for everyone.
- Your Legacy from earlier versions counts: past careers it recorded are worth XP, and a past win unlocks Heat 1. A career started before this version plays on as a first career (it keeps its relics).
- **The upper arenas are a little harder:** the Silver and Imperial Coliseums and the Grand Tournament fight with 1 more Power, so a first career is a real climb and the Legacy's unlocks matter.

## 6.0.0-alpha.2: Fortune's wheel

- **Every month, Fortune deals three cards: take one.** A **relic** your house keeps for good, a **boon** (Gold, Prestige, Favour, XP, a surgeon's visit, a day at the baths…), a free piece of **gear**, a free **fighter** (sometimes a legend of the arena), or **the Fates' Wager** (win your top bout this month for a purse; lose it and pay). Cards are common, rare or legendary. Don't like them? **Spin again** for a little Gold, or let Fortune pass.
- **21 relics, up to 6 at once**, each bending one rule: Mars's Whetstone (+1 Power in Round 1), the Nets of Nemi (opponents −2 Speed), a Bribed Referee (capitulating costs nothing), the Eagle Standard (stronger in Boss fights), Proserpina's Coin (once, a fighter who dies is carried out alive)… They're on the Ludus page under the calendar.
- **Perk tags:** every perk is Brute, Guarded, Swift or Showman, shown when you choose one. Some relics count them: the Brute's Chain adds injure chance for each Brute perk, Mercury's Sandals Speed for each Swift one. Build around them.
- **The arenas are harder to match:** from the Bronze Arena up, opponents fight with 3 more Power (4 in the Imperial Coliseum and the Grand Tournament), and a Boss win earns 8 Favour (was 15). Fortune's cards are how you keep up.
- **Betraying the plot** now also brings a gift from the palace: the Eagle Standard relic.
- **Fight results** say when Proserpina's Coin saved a life and how the Fates' Wager went.

## 6.0.0-alpha.1: the month is the turn

Version 6's brief: make the game as addictive and fun as possible (the plan: `docs/plan-v6-one-more-career.md`). 5.4.3 stays playable at `/v5/`. This first step is about pace.

- **⚔ To fight day is the main button:** a month is one turn. Set the jobs, shop, decide, then go. "One week" is still there when you want it.
- **The month's digest:** going to fight day shows one short summary of the month (each fighter's Power, Speed, healing, Stress and Morale changes, then the month's news) instead of a scroll of weekly lines.
- **📋 The steward's plan:** one click sets everyone's job: the hurt to the Medbay, the tired to Rest, the rest to training while there are rooms.
- **A new career is a season by default** (each arena: Tournament → Boss, about an hour). The old length is still there as "The Long Road".
- **On a phone:** a floating "⚔ Fight day" button on tournament weeks takes you straight to the bouts, and the top bar's extra buttons fold into a ☰ menu.
- **Fewer repeated lines:** when several resting fighters can't train for the same reason, it's said once above the cards.

## 5.4.3

- **Quarter- and Semi-final wins can take the loser's gear** (35%, like any other win). They never could, so from the Silver Coliseum two of every three wins dropped nothing.
- **The overtraining warning comes every time** End week would leave someone Overtrained, not just the first time.
- **Spare gear stays in sight:** Your gladiators lists what's unworn in the storeroom, and a fighter with an empty weapon or armour slot gets an "Equip from the storeroom" choice right on their card when there's something that fits.
- **"Unequip all gear" asks first** (it takes the gear off every fighter), and the house log lists what came off whom.

- **Fixed (a code review):** winning the Emperor's summons no longer counts as winning an Imperial Coliseum tournament on the steward's list; the summons fight now accounts for an overtrained fighter, the festival and feuds; saves from 5.4.0 follow the steward's list correctly; a fighter missing two room items no longer always asks for the same one; and the summons result no longer reads "killed. .".
- **Fixed: the Ludus no longer jumps when you click.** A new line appearing on a card above the one you clicked (like "Can't train this week") used to push your card away from the pointer; the card you clicked now stays where it is, in the columns and on a phone.

## 5.4.2

- **The steward pays less:** 1–2 Gold for each of his assignments (it was up to 4). The extra assignments in 5.4.1 made short careers too easy.
- **The Emperor's summons:** once a career, before you've reached the Imperial Coliseum, a month may start with the Emperor ordering one of your fighters onto the Imperial sand on that month's fight day. Send someone against one of its regulars (Power 26), telling them either to yield at the Death Gate or to fight to the death, or refuse him and lose 40 Imperial Favour. Stand to the end of Round 3: +5 Favour and +3 Renown. Win: +15 Favour and +8 Renown. Yield: −5 Favour. Die: the Temple of Vulcan gets a body. The fight is played out at once.
- **Afeared is rarer again:** about 1 scar in 10 (a Melancholic fighter a quarter of the time, Sanguine and Phlegmatic ones 1 in 20, Choleric never).
- **Conquer your fear:** two wins against the style a fighter fears lift their Afeared scar. Or pay the Temple of Fortuna's priests to lift it (6 Gold + 2 per arena tier); the button is under "Surgeon, cyborg surgery, fear, retire, release" on their card.
- **The Liaison has a line-up:** 2 prisoners on offer each month (3 once the Liaison is level 2), instead of one. At most one of them is ever a political prisoner. The first prisoner you buy, the steward has a word about it.
- **The steward has found his voice:** drier, and a little resigned to still being here.
- **Fixed:** a long note above an opponent's card (a house that owes you a life) covered their name on a phone.
- **Fixed:** clicking anything in the Your gladiators or Fight day column (a job, a fold-out) no longer jumps that column back to the top.
- **Fixed:** a signature move that can't be used this match (Haymaker for an overtrained Cestus, who has lost the class ability it needs) is now a greyed-out button that says why, instead of a button that pops up an error.

## 5.4.1

From two playtests of the quests and the rival house (`docs/playtest-11-changes.md`).

- **The rival champion shows up:** from the Silver Coliseum it can be drawn into any round of a tournament, not only the Final you rarely reach. Beating them in a Quarter- or Semi-final pays like any other win over them.
- **Your archrival is special, not everywhere:** only about 1 opponent in 5 now fights for the archrival (it was nearly 3 in 4, so their name was on almost every card).
- **Wants you can meet:** a fighter only asks to become Champion of an arena they could realistically win (within 3 Power of its Boss). Room wants vary (Bathhouse, Shrine of Mars or Trophy Rack) instead of always asking for a Bathhouse. A fighter no longer asks to learn from a veteran they are about to befriend anyway, or for revenge on a nemesis in an arena where they are Champion (a win there costs Favour). The mentor want now says how to meet it.
- **The steward keeps up:** tasks you'd already done are no longer skipped in silence. The steward says so and pays their Gold. Five new assignments fill the long middle of each arena: upgrade the Trainer Room (twice), and win a tournament in the Bronze Arena, the Silver Coliseum and the Imperial Coliseum.
- **Fewer scenes at once:** at most two quest, rival or friendship scenes play in a week; the rest wait for the weeks after, in order.
- **Friendships vary:** new friends say one of several pairs of lines, and the steward explains friendship in full only the first time.
- **The Emperor's spy:** the card now says what keeping them costs (the palace hears whatever your house hides, every month they stay). A spy you keep is marked 👁 on their card and in their story. The spy is never your most famous fighter.
- **Fixed:** the rival champion's name could be reused for another fighter; an opponent's card listed "owes you a life" while a feud overrode it; the Ludi Apollinares' text promised +1 to anyone with a bow (it's Sagittarii, and Fighters armed with a Bow, Gun or Spear); a one-level building's Codex entry repeated itself.

## 5.4.0

- **The steward's assignments:** the house was great once. From your second month, the steward hands you one task at a time to restore it (a second gladiator, a first win, decor, new buildings, each arena conquered, House levels...), with a little Gold for each (1 to 5).
- **Fighters want things:** some months a gladiator asks for something: revenge on the nemesis who beat them, a Championship, a Bathhouse or Shrine in their room, a veteran to learn from, or to retire with honour. Give it to them and their spirits lift (+2 Renown, +2 XP); leave it too long and they sulk. A 💬 chip on the card shows what they want.
- **Your rival house:** one house is your archrival. It climbs the arenas with you, so the year-end purse is a race. From the Bronze Arena it names a champion who turns up on your card (stronger for every win over you); beat them for Gold, Renown and their house's Glory. Some months it eyes the Market's best fighter and buys them at the end of the first week, unless you do.
- **The 📜 Quests panel** in the Ludus lists the steward's assignment, what your fighters want, and anything else asked of you.
- **Fewer words on the fighter cards** (a phone playtester): the long descriptions of each trait, class and humour are folded under "ⓘ What they do". Chips marked ⓘ show their description when you tap or click them.
- **Compare your gladiators:** a small table at the top of Your gladiators lists everyone's Power, Speed, Stress, Morale, injuries, training and job side by side. Tap a name to jump to their card.
- **The game is now called Blood and Circus.** Your saves, Codex and Legacy carry over unchanged.
- **Auto-play covers one match:** the next match of a tournament always starts paused (it used to stay on when you went on to the next match).
- **Skip to the result:** a new button on the fight screen plays the rest of the match at once with the suggested tactic. Like auto-play, it stops at the Death Gate while you can still capitulate.
- **The Emperor's spy:** once a career, when you have a rebel in your house, you may find one of your fighters has been reporting to the palace. Let them be (the Emperor is pleased), or execute them, and the priests of Vulcan can have the body.
- **A rebel asks to be freed only while you hold two:** the last political prisoner in your house never asks to leave.
- **The Ludus scrolls in columns:** on a wide screen, Your gladiators and Fight day each scroll on their own.
- **A Boss Final lost keeps your Prestige:** from the Silver Coliseum up, losing (or capitulating in) the Final of a Boss tournament returns its buy-in. Reaching the Boss was worth something. (Not the Grand Tournament.) To keep the finish hard, the Imperial Coliseum's fighters are 1 Power stronger (26 / 27 / 28), and so is the Grand Tournament's champion (31).
- **The steward warns you before overtraining:** the first time in a career that End week would leave someone Overtrained, the steward asks first: rest them this week, or train anyway.
- **The Emperor reacts to his demands:** he speaks up the moment you meet one, and again when its fight day ends and you haven't.
- **The rebel takes their time:** a political prisoner no longer tells you everything the week you buy them. After you copy the chalk sign they say a guarded word; the full confession comes only once they trust you, a few favours in.
- **Afeared is rarer:** most scars now leave a fighter Enraged. A Melancholic fighter turns Afeared half the time, Sanguine and Phlegmatic ones only now and then, and a Choleric one never (about 1 scar in 5, down from 1 in 2).
- **Friendships are announced:** when two fighters become friends (sparring in the Exhibition Ring, or both winning on one fight day), they say so, and the steward explains what it means.
- **The Emperor's "Bloodied Victory" demand** is also met by any win where your opponent dies, in the fight or by your thumbs down. Because demands are now met more often, each one met pays +2 Favour and 2 Gold per arena tier (was +3 and 3), and short careers' purses are ×1.6 (was ×1.75).
- **Scrolling the Ludus columns:** when a column reaches its end, the page scrolls on, so the bottom of the column always comes into view.
- **Fixed:** a fighter going back to training after a forced rest could take a Trainer Room another fighter was already using, so two trained in one room. They now wait for a free room. (Bug reports were also still labelled 5.3.0; they now say 5.4.0.)
- **Calming decor has a limit:** a room's Birds, Braziers, Shrines and Bathhouses lower Stress by at most 30 a week together. (A fully furnished room used to take 80 a week, so training never built up any Stress.)
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
