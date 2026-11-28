import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createRun, draftCompanion, createFighter, serialize, resolveDialogueTree, queueMilestone, ensureDialogueState,
} from '../src/run.js';
import { createRng } from '../src/rng.js';
import { lastWordsFor, backstoryScene } from '../src/voices.js';
import { demandMetScene } from '../src/dialogue.js';
import { estateTab } from '../src/ui/views.js';
import { createSession } from '../scripts/play-text.js';

test('v8.0.1 Slice 3: lore contradictions fixed (Varok brothers canon, Vaelen Revolution canon)', () => {
  const run = createRun(17);
  const orc = draftCompanion(run, 'orc');
  const elf = draftCompanion(run, 'elf');

  const orcPast = resolveDialogueTree(run, orc, 'ask_past');
  const orcText = orcPast.beats.map((b) => b.text).join(' ');
  assert.match(orcText, /second took the legion, the third took the priesthood/i);
  assert.doesNotMatch(orcText, /took the forge/i);

  queueMilestone(run, elf, { id: 'tourney_win_t2', priority: 90, ctx: { tier: 2, won: true } });
  const elfWin = resolveDialogueTree(run, elf, 'tourney_win_t2');
  const elfText = elfWin.beats.map((b) => b.text).join(' ');
  assert.match(elfText, /Sib's Revolution broke our sky-spires/);
  assert.doesNotMatch(elfText, /Sib's machine/);
});

test('v8.0.1 Slice 3: Android voices match Choir of Ephemera register, zero voiced exclamation marks in voices.js', () => {
  const run = createRun(19);
  const humors = ['choleric', 'melancholic', 'phlegmatic', 'sanguine'];
  const kinds = ['human', 'basa', 'orc', 'android', 'elf', 'vampire'];

  const androidLines = [];
  for (const humor of humors) {
    const f = createFighter(createRng(7), { id: `and_${humor}`, kind: 'android' });
    f.humor = humor;
    androidLines.push(lastWordsFor(run, f));
  }
  const andScene = backstoryScene(createFighter(createRng(8), { id: 'and_bs', kind: 'android' }));
  for (const b of andScene.beats) {
    if (b.text) androidLines.push(b.text);
    for (const r of b.replies ?? []) for (const t of r.then ?? []) androidLines.push(t.text);
  }
  const joinedAndroid = androidLines.join(' ');
  assert.doesNotMatch(joinedAndroid, /Combat loop|Probability of survival|Power cells|diagnostic standby|servos calibrated/i);

  const orcScene = backstoryScene(createFighter(createRng(9), { id: 'orc_bs', kind: 'orc' }));
  const orcText = orcScene.beats.map((b) => b.text ?? '').join(' ');
  assert.doesNotMatch(orcText, /Fourth sons sell themselves/);

  const allVoiceLines = [];
  for (const kind of kinds) {
    for (const humor of humors) {
      const f = createFighter(createRng(11), { id: `${kind}_${humor}`, kind });
      f.humor = humor;
      allVoiceLines.push(lastWordsFor(run, f));
    }
    const sc = backstoryScene(createFighter(createRng(12), { id: `${kind}_bs`, kind }));
    for (const b of sc.beats) {
      if (b.text) allVoiceLines.push(b.text);
      for (const r of b.replies ?? []) for (const t of r.then ?? []) allVoiceLines.push(t.text);
    }
  }
  assert.doesNotMatch(allVoiceLines.join('\n'), /!/, 'no voiced exclamation marks in voices.js');
});

test('v8.0.1 Slice 3: keepsake hints have no em dashes and demand scenes are tier-aware', () => {
  const run = createRun(21);
  const f = draftCompanion(run, 'unit91');
  const html = estateTab(run, { mode: 'room', fighterId: f.id, slot: 'ground-0' });
  assert.doesNotMatch(html, /Something still and quiet—/);

  const met = demandMetScene('win a bout', 3, 6);
  assert.match(met[1].text, /the Palatine pays/);
  assert.doesNotMatch(met[1].text, /he pays/);

  const s = createSession(1, { oddsSamples: 20 });
  s.run.demand = { id: 'topWin', week: 1 }; // as issueDemand makes it; the sender follows the top tier (v801-fixes)
  assert.match(s.exec('look'), /THE PALATINE DEMANDS/);
});

test('v8.0.1 Slice 3: auxiliaries get kind-specific lines for hub, ask_arena, and ask_past with zero RNG drift', () => {
  const run = createRun(31);
  const before = serialize(run);
  const kinds = ['human', 'basa', 'orc', 'android', 'elf', 'vampire'];
  const hubs = new Set();
  const arenas = new Set();
  const pasts = new Set();

  for (const kind of kinds) {
    const aux = createFighter(createRng(42), { id: `aux_${kind}`, kind });
    const h = resolveDialogueTree(run, aux, 'hub');
    const a = resolveDialogueTree(run, aux, 'ask_arena');
    const p = resolveDialogueTree(run, aux, 'ask_past');
    hubs.add(h.beats.at(-1).text);
    arenas.add(a.beats.at(-1).text);
    pasts.add(p.beats.at(-1).text);
    for (const tree of [h, a, p]) {
      for (const b of tree.beats) assert.doesNotMatch(b.text, /!|—|undefined|NaN/);
      for (const c of tree.choices) assert.doesNotMatch(c.responseText ?? '', /nods and returns to the yard/);
    }
  }
  assert.equal(hubs.size, 6, 'all 6 auxiliary kinds have distinct hub greetings');
  assert.equal(arenas.size, 6, 'all 6 auxiliary kinds have distinct ask_arena readings');
  assert.equal(pasts.size, 6, 'all 6 auxiliary kinds have distinct ask_past replies');
  assert.equal(serialize(run), before, 'resolving auxiliary trees mutates zero run state or RNG');
});

const KINDS = ['human', 'basa', 'orc', 'android', 'elf', 'vampire'];
const lastLine = (tree) => tree.beats.at(-1).text;

test('8.0.1: every kind of auxiliary has its own first-fight and tournament-result lines', () => {
  const run = createRun(33);
  const before = serialize(run);
  for (const scene of ['first_fight_win', 'first_fight_loss', 'tourney_win_t2', 'tourney_loss_t2']) {
    const lines = new Set();
    for (const kind of KINDS) {
      const aux = createFighter(createRng(42), { id: `aux_${kind}`, kind });
      const text = lastLine(resolveDialogueTree(run, aux, scene));
      assert.doesNotMatch(text, /!|—|undefined|NaN|Aethelgard|Salt-Reach/, `${scene} / ${kind}`);
      lines.add(text);
    }
    assert.equal(lines.size, 6, `${scene}: six kinds, six lines`);
  }
  assert.equal(serialize(run), before, 'resolving the scenes changes no run state and draws no RNG');
});

test('8.0.1: auxiliary past lines differ by kind at both trust levels and never name a companion\'s home or use a rebel\'s word', () => {
  const run = createRun(34);
  for (const trust of [0, 10]) {
    const lines = new Set();
    for (const kind of KINDS) {
      const aux = createFighter(createRng(42), { id: `aux_${kind}`, kind });
      ensureDialogueState(aux).trust = trust;
      const text = lastLine(resolveDialogueTree(run, aux, 'ask_past'));
      assert.doesNotMatch(text, /!|—|undefined|NaN|Aethelgard|Salt-Reach|\bSib\b/, `${kind} at trust ${trust}`);
      lines.add(text);
    }
    assert.equal(lines.size, 6, `trust ${trust}: six kinds, six lines`);
  }
});

test('8.0.1: each companion has three hub greetings, chosen from Morale, trust and the week without touching the run', () => {
  for (const coreId of ['unit91', 'basa', 'orc', 'android', 'elf']) {
    const run = createRun(35);
    const f = draftCompanion(run, coreId);
    const greet = () => lastLine(resolveDialogueTree(run, f, 'hub'));
    const usual = greet();

    f.morale = 30;
    const low = greet();
    f.morale = 60;
    ensureDialogueState(f).trust = 10;
    run.week = 1;
    const trusted = greet();
    run.week = 2;
    assert.equal(greet(), usual, `${coreId}: the first greeting still turns up on other weeks`);

    assert.equal(new Set([usual, low, trusted]).size, 3, `${coreId}: three different greetings`);
    for (const text of [usual, low, trusted]) assert.doesNotMatch(text, /!|—|undefined|NaN/);

    const before = serialize(run);
    greet();
    assert.equal(serialize(run), before, `${coreId}: reading the greeting changes nothing`);
  }
});
