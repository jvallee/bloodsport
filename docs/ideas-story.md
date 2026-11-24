# Making Blood and Circus more fun and more of a story: ideas

Written 2026-11-24 for the designer, after the 7.10 rebellion pass. Ideas only, nothing here is decided. Ordered roughly by
how much story each idea buys for the work it costs. ★ marks the ones I'd do first.

## What already works
- The bones of a great story are there: the portal, the Emperor who pulled you through, a ruined house to restore, a
  steward with a dry voice, a hidden rising that you can join or betray, seven endings.
- Fighters already have lives: wants, bonds, feuds, scars, stories, eulogies.
- What's thin: **the middle of a career**. Between the first Boss and the Grand Tournament, the story mostly happens in
  log lines. Characters rarely come back, choices are seldom remembered, and suspicion (the rising's danger) has no face.

## 1. Faces for the forces ★
Give each pressure on the player a recurring character who speaks, remembers and escalates.
- **The Praetorian prefect** (suspicion): a named officer who first visits at suspicion 20 ("just a courtesy call"),
  dines at your table at 40, searches the barracks at 60 and leads the raid at 80. Polite, patient, always one step
  closer. If you betray the rising, the prefect is who you hand the names to; if the coup succeeds, the prefect's fate is
  an epilogue choice.
- **The rival Lanista** (already exists in a few lines): give them a name, a grudge and a three-act arc: sneers, then
  respect, then (at the Grand Tournament) either a handshake or a knife.
- **The rebel prisoner** already does this. More beats in the long middle (see 3).

## 2. Choices that come back ★
The most powerful story trick in roguelikes is the callback: something you did ten weeks ago returns.
- A spared opponent turns up later as a Liaison prisoner, a rebel contact, or a fighter who refuses to face you.
- The cousin you bought out of the cells is in the crowd at the coup, or among the executed if you named the names.
- A fighter you sold, released or retired writes to the house; one of them comes back for the Grand Tournament.
- A mole you ransomed fights for their old house, and knows your fighters.
- Implementation: a small `memory` list on the run (who, what, when), and cards and scenes that look for entries.

## 3. A spine for the long middle
- **Acts with turning points**, each a short scene: arriving (Dirt Pits), being noticed (first Boss), being courted (the
  Senate, the rising, the rival), being tested (the Emperor's summons, a raid), the climax (the Grand Tournament).
- **Monthly city news**: three headlines on the month's first page, written from what happened ("The Dirt Pits' new
  favourite, Kroth, undefeated in four"; "Broken chains chalked in the Subura again"; "Praetorians search a ludus").
  It makes the world react without new rules.
- **Festivals as set pieces**: each festival (already in the calendar) gets one special bout or event with its own
  flavour: a night fight for Floralia, a chariot interlude, a god's omen.

## 4. The rising, round two ★ (partly done in 7.10)
- Done in 7.10: bolder requests that draw suspicion, a barracks search, replies at each stage, warnings, the rebel's
  whisper before the Grand, lead-ins for every ending.
- Next:
  - **A visible conspiracy board** (in the Estate, once you're in the Cause): your contacts as cards, what each cell
    gives, and suspicion shown as the prefect's mood rather than a number.
  - **Missions instead of single cards**: a two- or three-step request (get the guard rota, then copy the key, then
    open a gate) with a choice of fighter, where the fighter's traits matter.
  - **After the coup**: one last choice. Who takes the throne: you, the rebels' council, or the Senate? Each gives a
    different epilogue and a different Legacy unlock.
  - **The Emperor's paranoia**: as the rising grows, his visits change tone. He tests your loyalty with a demand that
    hurts the rebels (execute a prisoner in the arena), which you can obey, dodge, or defy.

## 5. Fighters as protagonists
- **A backstory reveal** at level 3: each fighter tells you, in one short scene, where the portal took them from. Kinds
  already suggest worlds (the android's factory, the elf's forest, the orc's war camp).
- **Fighter-to-fighter scenes**: bonds and feuds get dialogue, not just log lines; a bonded pair can ask to fight as a
  team once.
- **Last words**: when a fighter dies, one line from them (written from their wants and story), then the eulogy.

## 6. The Lanista's reputation
- Track how you play (merciful or brutal, loyal or rebellious, generous or greedy) in a few hidden axes. Fighters,
  rebels, rivals and the Emperor greet you differently. The rebel scene already does this with your record; widen it.
- The Legacy remembers how each career ended: the next career's Emperor mentions "the last Lanista from your world".

## 7. Fun outside the story
- **Daily Challenge with a twist**: a fixed seed plus a modifier ("all fighters are Orcs", "no Medbay").
- **Photo-mode for deaths and wins**: a shareable card (portrait, name, record, epitaph) for social posts.
- **Steam/iPhone polish**: haptics on hits, a short theme tune.

## Suggested order
1. The prefect (1) and the city news (3): cheap, and they make suspicion and fame felt every month.
2. Callbacks (2), starting with spared opponents and the cousin.
3. The coup's last choice and the Emperor's paranoia (4).
4. Fighter backstories (5).
