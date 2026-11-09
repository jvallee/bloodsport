// Loaded before every test file (package.json "test"). Weekly events are random cards that block the week;
// they're switched off here so unrelated tests stay deterministic, and tests/events.test.js switches them back on.
import { EVENT_CHANCE } from '../src/events.js';
import { SUMMONS, FORTUNE } from '../src/data.js';

export const REAL_EVENT_CHANCE = { ...EVENT_CHANCE };
EVENT_CHANCE.season = 0;
EVENT_CHANCE.winter = 0;
// The Emperor's summons (5.4.2) also blocks a fight week until answered: off too (tests/summons.test.js turns it on).
export const REAL_SUMMONS_CHANCE = SUMMONS.chance;
SUMMONS.chance = 0;
// Version 6's monthly Fortune draft blocks the month until a card is chosen: off too (tests/fortune.test.js turns it on).
FORTUNE.enabled = false;
