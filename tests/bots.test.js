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
