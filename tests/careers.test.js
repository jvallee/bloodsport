// Several careers at once (5.4.0): saves per career, an index, and the old single save migrated.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, serialize, deserialize, recruit } from '../src/run.js';
import {
  loadIndex, saveCareer, loadCareerText, removeCareer, newCareerBlocker, freshId, careerLabel,
  INDEX_KEY, OLD_SAVE_KEY, careerKey, scenesKey, MAX_CAREERS,
} from '../src/careers.js';

const memory = () => {
  const m = new Map();
  return { m, get: (k) => (m.has(k) ? m.get(k) : null), set: (k, v) => m.set(k, String(v)), remove: (k) => m.delete(k) };
};

test('two careers keep separate saves; loading one gives back exactly that career', () => {
  const s = memory();
  const index = loadIndex(s);
  const a = createRun(11);
  const b = createRun(22);
  recruit(b, b.market[0].id);
  saveCareer(s, index, 'a', a, 1);
  saveCareer(s, index, 'b', b, 2);
  assert.deepEqual(index.list.map((e) => e.id), ['b', 'a'], 'newest first');
  assert.equal(index.active, 'b');
  assert.equal(deserialize(loadCareerText(s, 'a')).seed, 11);
  assert.equal(deserialize(loadCareerText(s, 'b')).roster.length, 1);
  const again = loadIndex(s);
  assert.deepEqual(again, index, 'the index survives a reload');
});

test('the single save from before 5.4.0 becomes the first career, with its played scenes', () => {
  const s = memory();
  const old = createRun(5);
  s.set(OLD_SAVE_KEY, serialize(old));
  s.set('bloodsport.scenes', JSON.stringify({ seed: 5, seen: ['opening', 'rebel'] }));
  const index = loadIndex(s, () => 'first');
  assert.equal(index.active, 'first');
  assert.equal(index.list.length, 1);
  assert.equal(deserialize(s.get(careerKey('first'))).seed, 5);
  assert.deepEqual(JSON.parse(s.get(scenesKey('first'))), ['opening', 'rebel']);
  assert.equal(s.get(OLD_SAVE_KEY), null);
  assert.ok(s.get(INDEX_KEY));
});

test('deleting a career removes its save; the career being played can\'t be deleted', () => {
  const s = memory();
  const index = loadIndex(s);
  saveCareer(s, index, 'a', createRun(1), 1);
  saveCareer(s, index, 'b', createRun(2), 2);
  assert.throws(() => removeCareer(s, index, 'b'));
  removeCareer(s, index, 'a');
  assert.equal(s.get(careerKey('a')), null);
  assert.deepEqual(index.list.map((e) => e.id), ['b']);
});

test('the list holds a limited number of careers, and ids never collide', () => {
  const index = { active: null, list: Array.from({ length: MAX_CAREERS }, (_, i) => ({ id: `c${i}` })) };
  assert.match(newCareerBlocker(index), /delete one first/);
  assert.equal(newCareerBlocker({ list: [] }), null);
  const id = freshId({ list: [{ id: 'cz' }] }, 35);
  assert.notEqual(id, 'cz');
});

test('a career\'s label says its length, arena, date and roster', () => {
  const run = createRun(3, { short: true });
  assert.match(careerLabel(run), /^Short career · The Dirt Pits · Martius, Year 1 · 0 fighters$/);
});
