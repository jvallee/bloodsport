import test from 'node:test';
import assert from 'node:assert/strict';
import { playCareer } from '../scripts/bots.js';
import { rosterCap } from '../src/ludus.js';

test('both balance bots play whole careers to a finish with a valid end state', () => {
  for (const strategy of ['careful', 'reckless']) {
    for (let seed = 1; seed <= 8; seed++) {
      const r = playCareer(seed, strategy, { oddsSamples: 60 });
      assert.ok(['won', 'lost'].includes(r.status), `${strategy} ${seed}: ${r.status}`);
      assert.ok(r.run.gold >= 0 && r.run.prestige >= 0);
      assert.ok(r.run.roster.length <= rosterCap(r.run));
      assert.ok(r.favor >= 0 && r.favor <= 100);
    }
  }
});

test('7.6: a career that ends during the bot\'s own week stops cleanly (the check\'s Heat 1 career, seed 1041)', async () => {
  // A caught Bribe the Armourer took Favour to 0; unmasking a mole later that week judged Favour and ended the career,
  // and the bot then tried to advance a finished career ('The run is over.').
  const { gateJobs } = await import('./../scripts/checks.js');
  // As in the real game and the check (tests/setup.js turns events, the summons and Fortune off).
  const { EVENT_CHANCE } = await import('../src/events.js');
  const { SUMMONS, FORTUNE } = await import('../src/data.js');
  const real = await import('./setup.js');
  const saved = { events: { ...EVENT_CHANCE }, summons: SUMMONS.chance, fortune: { ...FORTUNE } };
  Object.assign(EVENT_CHANCE, real.REAL_EVENT_CHANCE);
  SUMMONS.chance = real.REAL_SUMMONS_CHANCE;
  FORTUNE.enabled = true;
  try {
    const j = gateJobs({ careers: 300 }).find((x) => x.group === 'heat1' && x.seed === 1041);
    const r = playCareer(j.seed, j.strategy, j.opts);
    assert.ok(['won', 'lost'].includes(r.status));
  } finally {
    Object.assign(EVENT_CHANCE, saved.events);
    SUMMONS.chance = saved.summons;
    Object.assign(FORTUNE, saved.fortune);
  }
});
