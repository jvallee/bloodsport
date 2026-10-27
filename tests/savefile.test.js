import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, recruit, serialize, deserialize } from '../src/run.js';
import { createCodex } from '../src/codex.js';
import { createLegacy } from '../src/legacy.js';
import { exportSave, importSave } from '../src/savefile.js';

test('a save file round-trips the career, Codex and Legacy', () => {
  const run = createRun(11);
  recruit(run, run.market[0].id);
  const codex = { ...createCodex(), seen: ['kind:orc'] };
  const legacy = { ...createLegacy(), achievements: ['bronze'], careers: 2 };
  const back = importSave(exportSave({ run, codex, legacy, version: 'test' }));
  assert.equal(serialize(deserialize(back.career)), serialize(run));
  assert.deepEqual(back.codex.seen, ['kind:orc']);
  assert.deepEqual(back.legacy.achievements, ['bronze']);
});

test('importing rejects files that are not Bloodsport saves', () => {
  assert.throws(() => importSave('hello'), /not a Bloodsport save/);
  assert.throws(() => importSave('{"kind":"bloodsport-bug-report"}'), /not a Bloodsport save/);
  assert.throws(() => importSave(JSON.stringify({ kind: 'bloodsport-save', career: { version: 1 } })), /older version/);
});
