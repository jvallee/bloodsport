// The designer's requests after 6.0.2 (2026-11-13): End week, a clearer first victory, renaming, and the cousin in the cells.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, recruit } from '../src/run.js';

test('the week\'s second button says "End week", not "One week" (the designer)', async () => {
  const { ludusTab } = await import('../src/ui/views.js');
  const run = createRun(5);
  recruit(run, run.market[0].id);
  const html = ludusTab(run, () => ({ win: 0.5, injury: 0.3, death: 0, n: 1 }));
  assert.ok(html.includes('End week'));
  assert.ok(!html.includes('One week'));
});
