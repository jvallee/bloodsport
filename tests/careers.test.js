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
  // 7.5: only careers in play count toward the limit.
  const index = { active: null, list: Array.from({ length: MAX_CAREERS }, (_, i) => ({ id: `c${i}`, status: 'active' })) };
  assert.match(newCareerBlocker(index), /delete one first/);
  assert.equal(newCareerBlocker({ list: [] }), null);
  const id = freshId({ list: [{ id: 'cz' }] }, 35);
  assert.notEqual(id, 'cz');
});

test('a career\'s label says its length, arena, date and roster', () => {
  const run = createRun(3, { short: true });
  assert.match(careerLabel(run), /^Short career · The Dirt Pits · Martius, Year 1 · 0 fighters$/);
});

// 7.5 (review brief 1.2, 1.5).
test('a save that fails says so, and the career keeps its last good "saved" time', () => {
  const s = memory();
  const index = loadIndex(s);
  const run = createRun(31);
  assert.equal(saveCareer(s, index, 'a', run, 100).ok, true);
  const full = { ...s, set: (k, v) => (k === careerKey('a') ? false : s.set(k, v) && true) };
  const r = saveCareer(full, index, 'a', run, 200);
  assert.equal(r.ok, false);
  assert.equal(index.list.find((e) => e.id === 'a').savedAt, 100);
});

test('only careers still in play count toward the limit; the oldest ended one makes room', async () => {
  const { makeRoom } = await import('../src/careers.js');
  const s = memory();
  const index = loadIndex(s);
  for (let i = 0; i < MAX_CAREERS; i++) {
    const run = createRun(40 + i);
    if (i < 3) run.status = 'lost';
    saveCareer(s, index, `c${i}`, run, i);
  }
  assert.equal(newCareerBlocker(index), null, '5 in play, 3 ended: room for more');
  makeRoom(s, index);
  assert.equal(index.list.length, MAX_CAREERS - 1);
  assert.ok(!index.list.some((e) => e.id === 'c0'), 'the oldest ended career went');
  assert.equal(loadCareerText(s, 'c0'), null);
  for (const e of index.list) e.status = 'active';
  index.list.push({ id: 'x', status: 'active' });
  assert.match(newCareerBlocker(index), /in play/);
});

test('the save-failed banner tells the player to export their save', async () => {
  const { saveFailedBanner } = await import('../src/ui/views.js');
  assert.match(saveFailedBanner(), /role="alert"[^]*not being saved[^]*Export your save/);
});

test('a career that would not load: the dialog gives the reason and four ways out', async () => {
  const { loadFailedModal } = await import('../src/ui/views.js');
  const html = loadFailedModal({ message: 'This save is from a newer version of the game (v9).' });
  assert.match(html, /role="dialog"[^]*newer version of the game \(v9\)/);
  for (const action of ['load-failed-download', 'bug-open', 'careers-open', 'load-failed-close']) assert.match(html, new RegExp(`data-action="${action}"`));
  assert.match(loadFailedModal({ message: '<b>x</b>' }), /&lt;b&gt;x/, 'escaped');
});

test('each notice of a bracket has its own dismiss key; the other-tab warning explains itself', async () => {
  const { summaryKey, otherTabBanner } = await import('../src/ui/views.js');
  const base = { week: 9, tier: 3, fighterId: 'f1' };
  const keys = ['Quarter-final', 'Semi-final', undefined].map((bracket) => summaryKey({ ...base, bracket }));
  assert.equal(new Set(keys).size, 3);
  assert.match(otherTabBanner(), /another tab[^]*no longer saves/);
});
