# Version 6, phase 4: fights (crowd, intent, clutch, juice)

Part of `docs/plan-v6-one-more-career.md` (pillar D). Ships as 6.0.0-alpha.4.

## What's there already

A fight is three rounds, first to two. Before each round you pick a tactic (Steady, Press, Guard, Feint; Press beats Feint
beats Guard beats Press, +10% win chance). Opponents pick by their humor. The screen has tumbling initiative dice, a
"Steel meets steel…" pause, a round banner, a shake on wounds, and a hype meter (`hypeOf`) that only pays out at the end.
The capitulate button is the only choice at the Death Gate.

## The changes

### 1. The crowd meter (hype becomes live)
- Hype still fills on upsets, wounds, kills, signature moves, comebacks and Press, and now **Guard drains it**
  (`HYPE.guard`, negative). Press fills a little more. It never drops below 0.
- **The crowd's favour:** when hype is at `HYPE.favour` or more at the start of a round, your fighter fights that round with
  **+1 Power** ("The crowd"). It's re-read every round, so Guarding can lose it. Press vs Guard becomes a visible gamble.
- The meter shows the favour mark, and glows while the crowd is with you. The payout at the end is unchanged.
- `hypeOf` stays pure (read from the rounds). The flag for the coming round (`m.a.roar`) is set at the end of each round,
  so `computePower`, `roundStats` and the fight card all agree.

### 2. The opponent's intent (the tell)
- The opponent's tactic for the coming round is decided before you pick (`opponentIntent(m)`), memoised on the match. It
  uses the same draw from the fight's dice at the same moment as before, so an unread fight replays exactly as it did.
- **With an Oracle you see a tell** ("Varro shifts his weight forward: he means to Press"). It is right most of the time
  (`INTENT.accuracy[level]`), never always: reading the tell against the humor is the skill. Whether the tell is true is
  drawn from a separate stream (`m.tells`, seeded from the fight's dice without drawing from them).
- `suggestTactic` weighs the tell (Bayes over the humor's habits), so auto-play and the careful bot use it too.
- **Free for everyone:** when a seasoned opponent will unleash their signature move this round (already deterministic),
  the screen warns you.

### 3. Clutch: All In at the Death Gate
- When your fighter is in mortal danger, a fourth choice appears beside capitulate: **All In** (`TACTICS.allIn`, `clutch:
  true`): a big win-chance bonus and a better chance to wound, at a higher risk of being wounded (which, at the gate, is
  death). The crowd loves it (`HYPE.allIn`).
- It is never offered outside the Death Gate, never picked by opponents, never suggested, and sits outside the counter
  triangle. The danger alert shows the death risk for fighting on Steady and for All In.
- Bots don't use it (their play is unchanged); a probe measures whether it is a fair gamble.

### 4. Juice (screen and sound only)
- A hit flash and a floating number on the struck card ("−1 wound", "☠").
- The crowd's cheer grows with hype; a roar when the crowd's favour is won.
- A bigger shake on kills; **the decider** (Round 3, or any round that ends the match) gets a slow-motion pause and a
  "Decider!" banner; confetti for a Title.
- All of it respects reduced motion. Auto-play and "Skip to the result" stay.

## Balance

The crowd's +1 Power and the Oracle's tell both help the player. Measure with probes, then `npm run check`:
- the first career (no Oracle for the bots) should barely move;
- the full-Legacy group starts with an Oracle (41%, near its 40% floor) and should rise a little;
- tune `HYPE.favour`, `HYPE.guard`, `HYPE.press` and `INTENT.accuracy` from a probe table, not by guessing.

## Tests (first)
- Guard drains hype, never below 0; Press fills it.
- The crowd's favour sets `m.a.roar` and adds +1 Power in the next round, and is lost when hype falls.
- An unread fight and a read fight (intent peeked every round) play out identically; the intent is the tactic played.
- Tells are right at about the stated accuracy; no tell without an Oracle; a humorless opponent has none.
- All In only at the Death Gate (refused otherwise); its effects apply; it isn't suggested or picked by opponents.

## Review

- **Risk: changing the fight's dice order** would shift every seeded test and the balance baseline. *Mitigation:* the intent
  uses the same draw at the same moment unless the screen peeks early, and tells use their own stream.
- **Risk: the tell is a free +10% every round.** *Mitigation:* it's never certain (the best Oracle reads about 5 in 6),
  and its value is measured.
- **Risk: Press always best** (+hype, +Power). *Mitigation:* the crowd's +1 is small next to Guard's −15% to be wounded at
  the gate; measured by the tactic gate (kept).
- **Risk: All In is a trap or a must.** *Mitigation:* a probe compares All In against Steady at the gate, by survival and
  round wins; tune it to a real gamble (better to take the round, worse to survive).
- **Reading load** (pillar F): the tell and the crowd are one line each; the warning replaces nothing.
- **Text:** the tells, All In and the crowd lines are PLACEHOLDER, listed in `docs/text-to-rewrite.md`.
