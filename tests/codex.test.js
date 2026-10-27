import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';
import { createMatch, autoPlay } from '../src/fight.js';
import { createRun, recruit, advanceToTournament } from '../src/run.js';
import { ENTRIES, SECTIONS, createCodex, discover, discoverMatch, isUnlocked, hasLore, progress, loadCodex } from '../src/codex.js';
import { blank } from './helpers.js';

test('every entry has a name, a section and rules text', () => {
  for (const e of ENTRIES) {
    assert.ok(SECTIONS[e.cat], e.key);
    assert.ok(e.name && !/undefined/.test(e.name), e.key);
    assert.ok(e.rules && !/undefined|NaN/.test(e.rules), `${e.key}: ${e.rules}`);
  }
  assert.equal(new Set(ENTRIES.map((e) => e.key)).size, ENTRIES.length, 'keys are unique');
});

test('every Kind, Class and Weapon has lore', () => {
  for (const e of ENTRIES.filter((x) => ['kind', 'class', 'weapon'].includes(x.cat))) assert.ok(e.lore, e.key);
});

test('basics are always unlocked; everything else starts locked', () => {
  const c = createCodex();
  for (const e of ENTRIES) assert.equal(isUnlocked(c, e), e.cat === 'basics', e.key);
});

test('a new career reveals the market, the opponent and level-1 buildings', () => {
  const run = createRun(3);
  const c = createCodex();
  const added = discover(c, run);
  for (const f of [...run.market, run.opponent]) assert.ok(c.seen.includes(`kind:${f.kind}`) && c.seen.includes(`trait:${f.kindTrait}`));
  assert.ok(c.seen.includes('building:trainer'));
  assert.ok(!c.seen.includes('building:oracle'), 'Oracle unlocks at Prestige level 2');
  assert.deepEqual(c.fresh, added);
  assert.deepEqual(discover(c, run), [], 'nothing new the second time');
});

test('the Boss arena rule is revealed only when it is visible', () => {
  const run = createRun(3);
  const c = createCodex();
  discover(c, run);
  assert.ok(!c.seen.includes(`debuff:${run.debuff}`));
  run.stage = 2;
  discover(c, run);
  assert.ok(c.seen.includes(`debuff:${run.debuff}`));
});

test('injuries unlock when seen; lore unlocks only when you defeat that fighter', () => {
  const c = createCodex();
  const opp = blank({ kind: 'orc', kindTrait: 'bloodFaith', cls: 'fighter', weapon: 'gun' });
  const lost = createMatch({ a: blank({ power: 1 }), b: opp, rng: createRng(1) });
  autoPlay(lost);
  lost.result = { winner: 'B', reason: 'rounds' };
  lost.a.f.injuries = [{ tag: 'concussed', weight: 1 }];
  discoverMatch(c, lost);
  assert.ok(c.seen.includes('injury:concussed') && c.seen.includes('weapon:gun'));
  assert.equal(c.lore.length, 0);
  const won = createMatch({ a: blank({ power: 20 }), b: opp, rng: createRng(2) });
  autoPlay(won);
  discoverMatch(c, won);
  assert.deepEqual([...c.lore].sort(), ['class:fighter', 'kind:orc', 'weapon:gun']);
  assert.ok(hasLore(c, ENTRIES.find((e) => e.key === 'kind:orc')));
});

test('progress counts rules and lore entries', () => {
  const c = createCodex();
  const { found, total } = progress(c);
  assert.equal(found, 0);
  assert.equal(total, ENTRIES.filter((e) => !e.always).length + ENTRIES.filter((e) => e.lore).length);
});

test('loading a broken or missing codex starts fresh', () => {
  assert.deepEqual(loadCodex('not json'), createCodex());
  assert.deepEqual(loadCodex(null), createCodex());
  assert.deepEqual(loadCodex(JSON.stringify({ seen: ['kind:orc'], lore: [] })), { seen: ['kind:orc'], lore: [], fresh: [] });
});

test('playing a career keeps discovering entries', () => {
  const run = createRun(5);
  const c = createCodex();
  discover(c, run);
  const before = c.seen.length;
  recruit(run, run.market[0].id);
  advanceToTournament(run);
  discover(c, run);
  assert.ok(c.seen.length >= before);
});
