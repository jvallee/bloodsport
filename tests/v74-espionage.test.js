// 7.4 Knives in the dark: moles, investigation, double agents and covert ops (docs/roadmap-v7.md, Phase 4).
import test from 'node:test';
import assert from 'node:assert/strict';
import { ESPIONAGE, HOUSES } from '../src/data.js';
import {
  createRun, recruit, advanceWeek, chooseEvent, espState, moleOf, espionageWeek, plantMole, investigate,
  investigateBlocker, covertOp, covertOpBlocker, opTarget, recruitPrice, advanceToTournament, startMatch, choosePerk,
  buildRoom, SAVE_VERSION, serialize, deserialize, eventChoiceBlocker,
} from '../src/run.js';
import { computePower, computePhase2, opponentTell } from '../src/fight.js';
import { isTournamentWeek } from '../src/calendar.js';

function house(seed = 1, n = 2) {
  const run = createRun(seed);
  run.gold = 60;
  const fs = Array.from({ length: n }, () => recruit(run, run.market[0].id));
  return { run, fs };
}
// Weeks that are not fight weeks (espionageWeek clears plans on fight weeks).
function quietWeek(run) {
  while (isTournamentWeek(run.week)) run.week += 1;
}
const perks = (run) => { for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]); };

test('a mole never acts in their first week, then leaves clues; suspects are named', () => {
  const { run, fs: [a] } = house(1);
  quietWeek(run);
  a.mole = { master: run.houses[0].id, since: run.week, clues: 0 };
  espionageWeek(run);
  assert.equal(espState(run).clues.length, 0, 'first week: nothing');
  for (let i = 0; i < 30 && !espState(run).clues.length; i++) {
    run.week += 1;
    quietWeek(run);
    espionageWeek(run);
  }
  assert.ok(espState(run).clues.length > 0, 'a clue appears');
  assert.ok(espState(run).suspects.includes(a.id), 'the mole is one of the two suspects');
  assert.equal(espState(run).suspects.length, 2);
});

test('investigating: needs a clue and Gold; an innocent fighter is offended; the mole is unmasked', () => {
  const { run, fs: [a, b] } = house(2);
  assert.match(investigateBlocker(run, a.id), /No clues/);
  a.mole = { master: run.houses[0].id, since: 1, clues: 1 };
  espState(run).clues = [{ week: 1, text: 'x' }];
  const morale = b.morale;
  const gold = run.gold;
  assert.equal(investigate(run, b.id), false);
  assert.equal(b.morale, morale + ESPIONAGE.offended);
  assert.equal(run.gold, gold - ESPIONAGE.investigate);
  assert.equal(investigate(run, a.id), true);
  assert.equal(run.event.id, 'moleUnmasked');
});

test('unmasked: execute keeps the body, costs their house Glory and the house Morale', () => {
  const { run, fs: [a, b] } = house(3);
  const h = run.houses[0];
  h.glory = 10;
  a.mole = { master: h.id, since: 1, clues: 1 };
  espState(run).clues = [{ week: 1, text: 'x' }];
  investigate(run, a.id);
  const morale = b.morale;
  chooseEvent(run, 0);
  assert.ok(!run.roster.includes(a));
  assert.ok(run.fallen.some((f) => f.id === a.id));
  assert.equal(h.glory, 10 + ESPIONAGE.executeGlory);
  assert.equal(b.morale, morale + ESPIONAGE.executeMorale);
  assert.equal(espState(run).clues.length, 0);
});

test('unmasked: ransom ends the feud and pays; turn makes a double agent', () => {
  const r1 = house(4);
  const h = r1.run.houses[0];
  h.feud = 3;
  r1.fs[0].mole = { master: h.id, since: 1, clues: 1 };
  espState(r1.run).clues = [{ week: 1, text: 'x' }];
  investigate(r1.run, r1.fs[0].id);
  const gold = r1.run.gold;
  chooseEvent(r1.run, 2);
  assert.equal(h.feud, 0);
  assert.equal(r1.run.gold, gold + ESPIONAGE.ransom);
  assert.ok(!r1.run.roster.includes(r1.fs[0]));

  const r2 = house(5);
  r2.fs[0].mole = { master: r2.run.houses[0].id, since: 1, clues: 1 };
  espState(r2.run).clues = [{ week: 1, text: 'x' }];
  investigate(r2.run, r2.fs[0].id);
  chooseEvent(r2.run, 1);
  assert.ok(r2.fs[0].mole.turned && r2.fs[0].mole.exposed);
  assert.equal(moleOf(r2.run), null, 'no longer a working mole');
});

test('a planted Market mole is cheap for their Power, and tells on themselves', () => {
  const saved = ESPIONAGE.plant;
  ESPIONAGE.plant = 1;
  try {
    const run = createRun(6);
    plantMole(run);
    const mole = run.market.find((f) => f.mole);
    assert.ok(mole, 'planted');
    const unplanted = { ...mole, mole: undefined };
    assert.ok(mole.mole.cut >= 1);
    assert.equal(recruitPrice(run, mole), Math.max(1, recruitPrice(run, unplanted) - mole.mole.cut));
    assert.ok(mole.mole.tell);
  } finally {
    ESPIONAGE.plant = saved;
  }
});

test('a feuding house buys a Mutinous fighter', () => {
  const saved = ESPIONAGE.flip;
  ESPIONAGE.flip = 1;
  try {
    const { run, fs: [a] } = house(7);
    run.houses[1].feud = 2;
    a.morale = 0;
    quietWeek(run);
    espionageWeek(run);
    assert.equal(a.mole?.master, run.houses[1].id);
  } finally {
    ESPIONAGE.flip = saved;
  }
});

function atFight(seed, type, { success = true } = {}) {
  const { run, fs: [a] } = house(seed, 1);
  perks(run);
  run.buildings.push({ id: 'b99', type: 'liaison', level: 1 });
  quietWeek(run);
  const saved = ESPIONAGE.ops[type].chance;
  ESPIONAGE.ops[type].chance = success ? 1 : 0;
  try {
    assert.equal(covertOpBlocker(run, type), null);
    covertOp(run, type);
  } finally {
    ESPIONAGE.ops[type].chance = saved;
  }
  assert.match(covertOpBlocker(run, type), /One covert op a month/);
  const target = opTarget(run);
  advanceToTournament(run);
  perks(run);
  return { run, a, target, m: startMatch(run, a.id, run.topTier) };
}

test('covert op: Steal the Playbook makes the Round-1 tell exact; caught, they fight with Vengeance', () => {
  const { m, target } = atFight(8, 'playbook');
  assert.equal(m.b.f.id, target.id);
  assert.ok(m.playbook);
  assert.equal(opponentTell(m), m.b.intent.stance);
  const caught = atFight(9, 'playbook', { success: false }).m;
  assert.ok(computePhase2(caught.b, caught.a, 1).win.some((x) => x.source === 'Vengeance' && x.value === HOUSES.vengeanceWin));
});

test('covert op: Bribe the Armourer strips the opponent\'s armour; caught costs Favour', () => {
  const { m } = atFight(10, 'armourer');
  assert.equal(m.b.f.gear?.armor ?? null, null);
  const { run } = house(11, 1);
  run.buildings.push({ id: 'b99', type: 'liaison', level: 1 });
  quietWeek(run);
  const favor = run.favor;
  const saved = ESPIONAGE.ops.armourer.chance;
  ESPIONAGE.ops.armourer.chance = 0;
  try { covertOp(run, 'armourer'); } finally { ESPIONAGE.ops.armourer.chance = saved; }
  assert.equal(run.favor, favor + ESPIONAGE.caughtFavor);
});

test('covert op: Doctor the Wine leaves the opponent Bleeding or sluggish', () => {
  const { m } = atFight(12, 'wine');
  const bleeding = m.b.f.injuries.some((i) => i.tag === 'bleeding');
  const sluggish = (m.b.boosts ?? []).some((b) => b.name === 'Doctored wine' && b.power === -1);
  assert.ok(bleeding !== sluggish, 'exactly one of the two');
});

test('covert ops need a Liaison or the Whispering Gallery', () => {
  const { run } = house(13, 1);
  quietWeek(run);
  assert.match(covertOpBlocker(run, 'playbook'), /Liaison or the Whispering Gallery/);
});

test('stolen plans: a leaking mole gives their house\'s fighters +1 Power against you', () => {
  const { run, fs: [a] } = house(14, 1);
  perks(run);
  advanceToTournament(run);
  perks(run);
  const target = opTarget(run);
  if (!target.house) target.house = run.houses[0].id;
  espState(run).leak = { house: target.house, week: run.week };
  const m = startMatch(run, a.id, run.topTier);
  assert.ok((m.b.boosts ?? []).filter((b) => b.name === 'Stolen plans').length === 3);
  assert.ok(computePower(m.b, m.a, 1).mods.some((x) => x.source === 'Stolen plans'));
});

test('espionage has its own dice: the Market, Fortune and fight rolls are untouched', () => {
  const plain = createRun(15);
  const spied = createRun(15);
  const savedPlant = ESPIONAGE.plant;
  for (const run of [plain, spied]) {
    ESPIONAGE.plant = run === spied ? 0.999 : 0; // the same rolls happen either way; only the outcome differs
    for (let w = 0; w < 12; w++) {
      run.boutPending = false;
      run.bouts = null;
      run.fortune = null;
      run.event = null;
      advanceWeek(run);
    }
  }
  ESPIONAGE.plant = savedPlant;
  for (const k of ['market', 'fight', 'fortune', 'opponents', 'events']) assert.deepEqual(spied.rng[k], plain.rng[k], k);
});

test('save version 7: a version-6 career loads with empty espionage', () => {
  assert.equal(SAVE_VERSION, 7);
  const { run } = house(16, 1);
  const old = JSON.parse(serialize(run));
  old.version = 6;
  delete old.espionage;
  const loaded = deserialize(JSON.stringify(old));
  assert.equal(loaded.version, 7);
  assert.deepEqual(loaded.espionage, { clues: [], suspects: null, opMonth: null, op: null, leak: null });
});

test('UI: whispers, suspects, covert ops; the investigate button; a planted mole\'s market tell', async () => {
  const { espionagePanel, ludusTab, marketTab } = await import('../src/ui/views.js');
  const { run, fs: [a, b] } = house(20);
  assert.equal(espionagePanel(run), '', 'nothing to show yet');
  run.buildings.push({ id: 'b98', type: 'liaison', level: 1 });
  quietWeek(run);
  assert.match(espionagePanel(run), /Steal the Playbook[^]*Send agents/);
  espState(run).clues = [{ week: run.week, text: 'A letter half-burned in the brazier.' }];
  espState(run).suspects = [a.id, b.id].sort();
  let html = espionagePanel(run);
  assert.match(html, /Whispers in the house[^]*half-burned/);
  assert.match(html, /would narrow it down/);
  run.buildings.push({ id: 'b97', type: 'gallery', level: 1 });
  html = espionagePanel(run);
  assert.match(html, new RegExp(`points at <b>(${a.name}|${b.name})</b> or <b>(${a.name}|${b.name})</b>`));
  assert.match(ludusTab(run, () => ({ win: 0.5, injury: 0.2, death: 0 })), /data-action="investigate"/);
  run.market[0].mole = { master: run.houses[0].id, since: null, clues: 0, tell: 'suspiciously cheap for their Power', cut: 2 };
  assert.match(marketTab(run), /Something is off[^]*suspiciously cheap for their Power/);
});

// Review fixes (7.2–7.4 review).
test('when the mole is gone, the whispers stop and the suspects are cleared', () => {
  const { run, fs: [a] } = house(40);
  quietWeek(run);
  espState(run).clues = [{ week: 1, text: 'x' }];
  espState(run).suspects = [a.id, 'gone'];
  espionageWeek(run); // no mole in the house
  assert.deepEqual(espState(run).clues, []);
  assert.equal(espState(run).suspects, null);
});

test('a palace mole cannot be "turned" (the palace sends no fighters to fool)', () => {
  const { run, fs: [a] } = house(41);
  a.mole = { master: 'palace', since: 1, clues: 1 };
  espState(run).clues = [{ week: 1, text: 'x' }];
  investigate(run, a.id);
  assert.match(eventChoiceBlocker(run, 1), /palace/);
  assert.equal(eventChoiceBlocker(run, 0), null);
});

test('bets are priced on the real fight: stolen plans and doctored wine move the odds', async () => {
  const { betOdds } = await import('../src/run.js');
  const { run, fs: [a] } = house(42, 1);
  perks(run);
  advanceToTournament(run);
  perks(run);
  const m = startMatch(run, a.id, run.topTier);
  const fair = betOdds(run, m);
  m.b.boosts = [1, 2, 3].map((round) => ({ power: -3, round, name: 'Doctored wine' }));
  assert.ok(betOdds(run, m) < fair, 'a weakened opponent pays less');
});

test('a palace mole cannot be turned even from an older save\'s event, and the reason beats the Gold cost', () => {
  const { run, fs: [a] } = house(43);
  a.mole = { master: 'palace', since: 1, clues: 1, exposed: false };
  run.event = { id: 'moleUnmasked', f: a.id, house: 'the palace' }; // no palace flag
  run.gold = 0;
  assert.match(eventChoiceBlocker(run, 1), /palace/);
});
