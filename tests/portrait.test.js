import test from 'node:test';
import assert from 'node:assert/strict';
import { portrait } from '../src/ui/portrait.js';
import { blank } from './helpers.js';

test('a portrait is a stable SVG for the same fighter, different for another', () => {
  const a = portrait(blank({ name: 'Tigris', kind: 'elf', humor: 'choleric' }));
  assert.match(a, /^<svg class="portrait"/);
  assert.equal(a, portrait(blank({ name: 'Tigris', kind: 'elf', humor: 'choleric' })));
  assert.notEqual(a, portrait(blank({ name: 'Brakk', kind: 'elf', humor: 'choleric' })));
});

test('portraits show kind, wounds, titles and death', () => {
  assert.match(portrait(blank({ name: 'Grosh', kind: 'orc' })), /#f2ead2/, 'orc tusks');
  assert.match(portrait(blank({ name: 'Sol-9', kind: 'android' })), /#6fd3ff/, 'android visor');
  const hurt = portrait(blank({ name: 'Vex', injuries: [{ tag: 'fleshWound', weight: 1 }, { tag: 'concussed', weight: 1 }] }));
  assert.equal(hurt.match(/stroke="#c0362c"/g).length, 2);
  assert.match(portrait(blank({ name: 'Vex', titles: ['Champion of the Dirt Pits'] })), /stroke-dasharray/, 'laurel');
  assert.match(portrait(blank({ name: 'Vex', alive: false })), /opacity="0.55"/);
  assert.doesNotMatch(portrait(blank({ name: '<script>' })), /<script>/);
});
