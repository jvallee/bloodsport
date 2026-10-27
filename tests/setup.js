// Loaded before every test file (package.json "test"). Weekly events are random cards that block the week;
// they're switched off here so unrelated tests stay deterministic, and tests/events.test.js switches them back on.
import { EVENT_CHANCE } from '../src/events.js';

export const REAL_EVENT_CHANCE = { ...EVENT_CHANCE };
EVENT_CHANCE.season = 0;
EVENT_CHANCE.winter = 0;
