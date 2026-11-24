// The browser-only files (they touch the DOM, so no test imports them) must at least parse (7.7: a duplicate import
// once broke src/main.js while every other test passed).
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

for (const file of ['src/main.js', 'src/ui/sound.js']) {
  test(`${file} parses`, () => {
    const r = spawnSync(process.execPath, ['--check', fileURLToPath(new URL(`../${file}`, import.meta.url))], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
  });
}
