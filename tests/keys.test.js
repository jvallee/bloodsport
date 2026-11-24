// 7.5 (review brief 1.1): a key press can't play a round past a Death Gate warning that hasn't appeared yet.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fightKey } from '../src/ui/keys.js';

test('during a round\'s reveal, Space or Enter only finishes the reveal (never plays the next round)', () => {
  for (const key of [' ', 'Enter']) {
    assert.equal(fightKey({ key, revealing: true, danger: false, over: false }), 'finish-reveal');
    assert.equal(fightKey({ key, revealing: true, danger: true, over: false }), 'finish-reveal');
  }
});

test('while MORTAL DANGER shows, Space and Enter do nothing: fighting on takes a click', () => {
  for (const key of [' ', 'Enter']) assert.equal(fightKey({ key, revealing: false, danger: true, over: false }), 'ignore');
  assert.equal(fightKey({ key: ' ', revealing: false, danger: true, over: true }), 'press', 'a finished match can be left');
});

test('otherwise Space and Enter press the next control; other keys are not fight keys', () => {
  assert.equal(fightKey({ key: 'Enter', revealing: false, danger: false, over: false }), 'press');
  assert.equal(fightKey({ key: 'x', revealing: true, danger: true, over: false }), 'other');
});
