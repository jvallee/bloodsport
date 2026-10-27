# Bug reports from playtesters

## What testers do
- **If the game crashes**, a "Something went wrong" box opens by itself.
- **For anything else** (wrong numbers, confusing behaviour), click **Report a bug** in the top bar.

Either way: type what happened, click **Copy bug report** (or **Download it**), and send it to you. Nothing is sent automatically.

## What a report holds
- The error message and its traceback, and what the game was doing (a button action, drawing the page, auto-play, startup).
- The game version (`src/version.js`), the time, the page URL and the browser.
- The career seed and **every choice the player made** (`run.actions`, recorded by `src/game.js`), plus their save.
- If a fight was on, its round-by-round record.

## Replaying one
Save the report as a file, then:

```
npm run replay -- report.json            # replay it all: shows the error, whether it reproduces, and the final state
npm run replay -- report.json --stop 40  # stop after 40 actions, to see the state just before the problem
npm run replay -- report.json --steps    # list each action as it replays
```

Reading the output:
- **"Live commit"** is the commit GitHub Pages was serving when the report was made. Check it out if the traceback's line numbers don't match your code.
- **"Matches the report's save"** means the replay rebuilt the player's exact game. A crash in page code (drawing the screen) won't reproduce in Node, but you get the exact game state it happened in.
- **"refused"** lines are normal: the game said no (e.g. not enough Gold), just as it did for the player.

Then write a failing test from the replayed state and fix the bug (CLAUDE.md: bugs are fixed test-first).

## Notes
- Careers started before version 2.1.0 have no recorded choices. They start recording on first load, from a snapshot of that moment.
- Bump `VERSION` in `src/version.js` together with `package.json`'s `"version"` (a test checks they match).
