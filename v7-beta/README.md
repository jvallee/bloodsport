# Blood and Circus: new look (preview)

The interface overhaul from an independent review of 7.10.0 (bloodsport-v7.11.0.patch, applied in full): a one-row
desktop header with icons, a phone layout with a bottom tab bar and a three-pane Ludus, a two-by-two tactic grid in
fights, equal-height Market and Estate cards, and a darker "torchlight" look. Rules and story are the same as the live
7.11.0. Served at https://jvallee.github.io/bloodsport/v7-beta/.

It keeps its careers, Codex and Legacy under separate browser storage keys (`bloodsport.v7beta.*`), so it never reads or
changes the live game's saves. Remove this folder once the designer decides (adopt into the root, or drop).
