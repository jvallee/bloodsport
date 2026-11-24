// Several careers at once (designer's request, 5.4.0): every career keeps its own save in the browser, listed in
// an index; one is active. Pure: `storage` is any { get, set, remove } over strings (src/main.js wraps localStorage).

import { serialize, arenaName } from './run.js';
import { dateOf } from './calendar.js';

export const INDEX_KEY = 'bloodsport.v7beta.careers';
export const OLD_SAVE_KEY = 'bloodsport.v7beta.career'; // the single save before 5.4.0
export const careerKey = (id) => `bloodsport.v7beta.career.${id}`;
export const scenesKey = (id) => `bloodsport.v7beta.scenes.${id}`;
export const MAX_CAREERS = 8; // browser storage is small, and a long career's save is large

// The index: { active: id or null, list: [entry] }. An old single save becomes the first career.
export function loadIndex(storage, newId = () => 'c1') {
  let index = null;
  try { index = JSON.parse(storage.get(INDEX_KEY) ?? 'null'); } catch { index = null; }
  if (!index || !Array.isArray(index.list)) index = { active: null, list: [] };
  const old = storage.get(OLD_SAVE_KEY);
  if (old && !index.list.length) {
    const id = newId();
    storage.set(careerKey(id), old);
    let seed = null;
    try { seed = JSON.parse(old).seed ?? null; } catch { /* unreadable: listed anyway, it fails on load */ }
    index.list.push({ id, seed, label: 'Your career', savedAt: 0 });
    index.active = id;
    // The dialogue scenes already played were kept for one seed; they belong to this career now.
    try {
      const scenes = JSON.parse(storage.get('bloodsport.v7beta.scenes') ?? 'null');
      if (scenes?.seed === seed) storage.set(scenesKey(id), JSON.stringify(scenes.seen ?? []));
    } catch { /* none */ }
    storage.remove(OLD_SAVE_KEY);
    saveIndex(storage, index);
  }
  return index;
}
export const saveIndex = (storage, index) => storage.set(INDEX_KEY, JSON.stringify(index));

// What the careers list shows for a career.
export function careerLabel(run) {
  const d = dateOf(run.week);
  const where = run.status === 'active' ? arenaName(run.topTier) : run.status === 'won' ? 'Won' : 'Ended';
  const kind = run.setup?.daily ? 'Daily challenge' : run.setup?.short ? 'Short career' : 'Full career';
  return `${kind} · ${where} · ${d.month}, Year ${d.year} · ${run.roster.length} fighter${run.roster.length === 1 ? '' : 's'}`;
}

// Save a career into its slot and refresh its entry (newest first).
// `ok: false` when the browser refused the write (storage full): the entry keeps its last good "saved" time.
export function saveCareer(storage, index, id, run, now = 0) {
  if (storage.set(careerKey(id), serialize(run)) === false) {
    return { ...(index.list.find((e) => e.id === id) ?? { id }), ok: false };
  }
  const entry = { id, seed: run.seed, label: careerLabel(run), status: run.status, savedAt: now };
  index.list = [entry, ...index.list.filter((e) => e.id !== id)];
  index.active = id;
  saveIndex(storage, index);
  return { ...entry, ok: true };
}

export const loadCareerText = (storage, id) => storage.get(careerKey(id));

// Why a new career can't be started (or null): only careers still in play count (ended ones make room, see makeRoom).
export const newCareerBlocker = (index) => (index.list.filter((e) => e.status === 'active').length >= MAX_CAREERS
  ? `You can have ${MAX_CAREERS} careers in play at most: finish or delete one first.` : null);

// Before a new career: if the list is full, drop the oldest ended career (its result is kept in the Legacy record).
export function makeRoom(storage, index) {
  while (index.list.length >= MAX_CAREERS) {
    const ended = index.list.filter((e) => e.status !== 'active' && e.id !== index.active).sort((a, b) => (a.savedAt ?? 0) - (b.savedAt ?? 0));
    if (!ended.length) return;
    removeCareer(storage, index, ended[0].id);
  }
}

// Delete a career's save for good (never the one being played).
export function removeCareer(storage, index, id) {
  if (id === index.active) throw new Error('That career is being played.');
  storage.remove(careerKey(id));
  storage.remove(scenesKey(id));
  index.list = index.list.filter((e) => e.id !== id);
  saveIndex(storage, index);
}

// A fresh id that isn't taken.
export function freshId(index, stamp) {
  let id = `c${stamp.toString(36)}`;
  while (index.list.some((e) => e.id === id)) id += 'x';
  return id;
}
