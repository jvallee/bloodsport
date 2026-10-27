// Save files (roadmap v3, phase F3): the career, Codex and Legacy in one JSON file, to move between
// devices or share with a tester. Pure; src/main.js does the download and the file picker.

import { serialize, deserialize } from './run.js';
import { loadCodex } from './codex.js';
import { loadLegacy } from './legacy.js';

export const SAVE_FILE_KIND = 'bloodsport-save';

export function exportSave({ run, codex, legacy, version }) {
  return JSON.stringify({ kind: SAVE_FILE_KIND, version, exported: new Date().toISOString(), career: JSON.parse(serialize(run)), codex, legacy }, null, 1);
}

// Returns { career (save text), codex, legacy }. Throws a readable error for anything that isn't a valid save.
export function importSave(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not a Bloodsport save.');
  }
  if (data?.kind !== SAVE_FILE_KIND || !data.career) throw new Error('That file is not a Bloodsport save.');
  const career = JSON.stringify(data.career);
  deserialize(career); // throws if the career can't be loaded
  return { career, codex: loadCodex(JSON.stringify(data.codex ?? null)), legacy: loadLegacy(JSON.stringify(data.legacy ?? null)) };
}
