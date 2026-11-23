# Blood and Circus v7 beta (preview)

A playable preview of version 7.0.0 (branch `v7.0.0`), served at https://jvallee.github.io/bloodsport/v7-beta/.
The live game at the repo root is still 6.0.5.

v7 passes all 20 balance gates (`npm run check`); it is a preview until it replaces the root game.

This preview keeps its careers, Codex and Legacy under separate browser storage keys (`bloodsport.v7beta.*`), so it
starts empty and never reads or upgrades the live game's saves. Replace or remove this folder when v7 ships to the root.
