// 7.1 Living quarters: Temperament decor shapes a fighter's Humour, the Rock Garden's meditation, the Spiky Bed,
// the Skull Rack and the Wine Amphora (docs/roadmap-v7.md, Phase 1).
import test from 'node:test';
import assert from 'node:assert/strict';
import { DECOR, decorComfort, HUMORS, HUMOUR_DRIFT, MEDITATION, FEAR, SCAR_AFEARED, AMPHORA_HYPE } from '../src/data.js';
import {
  createRun, recruit, advanceWeek, advanceToTournament, skipBout, startMatch, finishMatch, choosePerk,
  dominantTemperament, driftHumour, meditate, serialize, deserialize, SAVE_VERSION, buyDecor, assignDecor,
} from '../src/run.js';
import { createMatch, hypeOf } from '../src/fight.js';
import { createRng } from '../src/rng.js';

const TEMPERAMENT = ['rockGarden', 'spikyBed', 'skullRack', 'wineAmphora'];

function fighter(seed = 1, humor = 'choleric') {
  const run = createRun(seed);
  const f = recruit(run, run.market[0].id);
  f.humor = humor;
  return { run, f };
}

test('four Temperament pieces, one per Humour, with their own comfort', () => {
  assert.deepEqual(TEMPERAMENT.map((k) => DECOR[k].humor).sort(), Object.keys(HUMORS).sort());
  for (const k of TEMPERAMENT) assert.equal(DECOR[k].group, 'temperament');
  assert.deepEqual(TEMPERAMENT.map((k) => decorComfort(DECOR[k])), [5, 0, 3, 7]);
  assert.deepEqual(TEMPERAMENT.map((k) => DECOR[k].price), [3, 2, 3, 3]);
  assert.equal(DECOR.rockGarden.calm, 8);
  // The older items keep their comfort (2 + price) and now sit in a group.
  for (const k of ['bird', 'fireBrazier', 'trophy', 'shrine', 'bathhouse', 'lionCage', 'warBanner']) {
    assert.equal(decorComfort(DECOR[k]), 2 + DECOR[k].price);
    assert.ok(['comfort', 'craft'].includes(DECOR[k].group));
  }
});

test('the dominant Temperament piece: none, one, or a tie', () => {
  const { f } = fighter();
  assert.equal(dominantTemperament(f), null);
  f.decor.bird = 3; // not a Temperament piece
  assert.equal(dominantTemperament(f), null);
  f.decor.spikyBed = 2;
  f.decor.wineAmphora = 1;
  assert.deepEqual(dominantTemperament(f), { item: 'spikyBed', humor: 'melancholic' });
  f.decor.wineAmphora = 2;
  assert.deepEqual(dominantTemperament(f), { tied: true });
});

test(`a dominant piece turns the Humour after ${HUMOUR_DRIFT.weeks} weeks, for good`, () => {
  const { run, f } = fighter(2, 'choleric');
  f.decor.spikyBed = 1;
  for (let w = 1; w < HUMOUR_DRIFT.weeks; w++) {
    driftHumour(run, f);
    assert.deepEqual(f.humourDrift, { to: 'melancholic', weeks: w });
    assert.equal(f.humor, 'choleric');
  }
  driftHumour(run, f);
  assert.equal(f.humor, 'melancholic');
  assert.equal(f.humourDrift, undefined);
  assert.ok(f.story.some((e) => /Spiky Bed changed their temper: now Melancholic/.test(e.text)));
  // Permanent: removing the bed doesn't turn them back.
  f.decor.spikyBed = 0;
  driftHumour(run, f);
  assert.equal(f.humor, 'melancholic');
});

test('a tie pauses the drift; a new leader restarts it; their own Humour clears it', () => {
  const { run, f } = fighter(3, 'choleric');
  f.decor.rockGarden = 1;
  driftHumour(run, f);
  driftHumour(run, f);
  f.decor.wineAmphora = 1; // tie
  driftHumour(run, f);
  assert.deepEqual(f.humourDrift, { to: 'phlegmatic', weeks: 2 }, 'paused');
  f.decor.wineAmphora = 2; // the Amphora leads now
  driftHumour(run, f);
  assert.deepEqual(f.humourDrift, { to: 'sanguine', weeks: 1 }, 'restarted');
  f.decor = { ...f.decor, rockGarden: 0, wineAmphora: 0, skullRack: 1 }; // their own Humour (Choleric)
  driftHumour(run, f);
  assert.equal(f.humourDrift, undefined);
});

test('the drift runs every week in advanceWeek', () => {
  const { run, f } = fighter(4, 'sanguine');
  f.decor.skullRack = 1;
  for (let w = 0; w < HUMOUR_DRIFT.weeks; w++) {
    for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
    run.fortune = null;
    for (const [tier, state] of Object.entries(run.bouts ?? {})) if (state === 'open') skipBout(run, Number(tier));
    advanceWeek(run);
  }
  assert.equal(f.humor, 'choleric');
});

test('a Rest week with a Rock Garden: meditation for Stress, XP and fear', () => {
  const { run, f } = fighter(5);
  f.decor.rockGarden = 1;
  f.scars = [{ id: 'afeared', vs: 'ranged' }];
  f.job = 'rest';
  f.stress = 50;
  const xp = f.xp;
  meditate(run, f);
  assert.equal(f.stress, 50 - MEDITATION.stress);
  assert.equal(f.xp, xp + MEDITATION.xp);
  assert.equal(f.scars[0].faced, MEDITATION.fear);
  const needed = FEAR.conquerWins / MEDITATION.fear;
  for (let i = 1; i < needed; i++) meditate(run, f);
  assert.ok(!f.scars.some((x) => x.id === 'afeared'), 'conquered after enough meditation');
});

test('no meditation without the garden, or when not resting', () => {
  const { run, f } = fighter(6);
  f.job = 'rest';
  f.stress = 50;
  meditate(run, f);
  assert.equal(f.stress, 50);
  f.decor.rockGarden = 1;
  f.job = 'medbay';
  meditate(run, f);
  assert.equal(f.stress, 50);
});

function winWith(run, f, injuries) {
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  advanceToTournament(run);
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  const m = startMatch(run, f.id, 1);
  m.a.f.injuries = injuries;
  m.over = true;
  m.result = { winner: 'A', reason: 'rounds' };
  const s = finishMatch(run, m);
  run.mercy = null;
  return s;
}

test('Spiky Bed: a win with one wound makes them Battle-Hardened; without it, it takes two', () => {
  const plain = fighter(7);
  winWith(plain.run, plain.f, [{ tag: 'fleshWound', weight: 1 }]);
  assert.ok(!plain.f.scars?.some((x) => x.id === 'hardened'));
  const spiky = fighter(7);
  spiky.f.decor.spikyBed = 1;
  const s = winWith(spiky.run, spiky.f, [{ tag: 'fleshWound', weight: 1 }]);
  assert.ok(spiky.f.scars.some((x) => x.id === 'hardened'));
  assert.equal(s.scar, 'Battle-Hardened');
  assert.ok(spiky.f.story.some((e) => /spikes/.test(e.text)));
});

test('Skull Rack: a severe wound scars them Enraged, never Afeared', () => {
  const saved = SCAR_AFEARED.melancholic;
  SCAR_AFEARED.melancholic = 1; // every scar would be Afeared
  try {
    const scars = { rack: [], none: [] };
    for (let seed = 1; seed <= 30; seed++) {
      for (const key of ['rack', 'none']) {
        const { run, f } = fighter(100 + seed, 'melancholic');
        if (key === 'rack') f.decor.skullRack = 1;
        winWith(run, f, [{ tag: 'concussed', weight: 1 }]);
        scars[key].push(...(f.scars ?? []).filter((x) => x.vs).map((x) => x.id));
      }
    }
    assert.ok(scars.rack.length > 0 && scars.none.length > 0, 'some scars happened');
    assert.ok(scars.rack.every((id) => id === 'enraged'));
    assert.ok(scars.none.every((id) => id === 'afeared'));
  } finally {
    SCAR_AFEARED.melancholic = saved;
  }
});

test('Wine Amphora: the fight starts with +5 Hype (not under Iron Rules)', () => {
  const { f } = fighter(8);
  const opp = structuredClone(f);
  assert.equal(hypeOf(createMatch({ a: f, b: opp, rng: createRng(1) })), 0);
  f.decor.wineAmphora = 1;
  assert.equal(hypeOf(createMatch({ a: f, b: opp, rng: createRng(1) })), AMPHORA_HYPE);
  assert.equal(hypeOf(createMatch({ a: f, b: opp, rng: createRng(1), debuff: 'ironRules' })), 0);
});

test('the new pieces are bought and placed like any decor', () => {
  const { run, f } = fighter(9);
  run.gold = 20;
  for (const k of TEMPERAMENT) {
    buyDecor(run, k);
    assignDecor(run, f.id, k);
    assert.equal(f.decor[k], 1);
  }
});

test('save version 5: a version-4 career loads with the new decor slots', () => {
  assert.equal(SAVE_VERSION, 6);
  const { run, f } = fighter(10);
  const old = JSON.parse(serialize(run));
  old.version = 4;
  for (const x of [...old.roster, ...old.market]) for (const k of TEMPERAMENT) delete x.decor[k];
  for (const k of TEMPERAMENT) delete old.inventory.decor[k];
  const loaded = deserialize(JSON.stringify(old));
  assert.equal(loaded.version, SAVE_VERSION);
  const g = loaded.roster.find((x) => x.id === f.id);
  for (const k of TEMPERAMENT) {
    assert.equal(g.decor[k], 0);
    assert.equal(loaded.inventory.decor[k], 0);
  }
});

test('UI: decor is grouped, and Temperament pieces say what they would do to this fighter', async () => {
  const { marketTab, temperNote, temperLine } = await import('../src/ui/views.js');
  const html = marketTab(createRun(11));
  const order = ['Comfort', 'Temperament', 'Arena Craft'].map((g) => html.indexOf(`<div class="label decor-group">${g}</div>`));
  assert.ok(order.every((i) => i > 0) && order[0] < order[1] && order[1] < order[2]);
  assert.match(html, /Spiky Bed<\/b>[^<]*<small>[^<]*<\/small> <span class="chip small bad"[^>]*>no comfort/);
  const { f } = fighter(11, 'choleric');
  assert.equal(temperNote(f, 'skullRack'), 'Already Choleric: keeps them so.');
  assert.match(temperNote(f, 'spikyBed'), /Would make them Melancholic after 4 weeks/);
  assert.equal(temperNote(f, 'bird'), '');
  f.humourDrift = { to: 'melancholic', weeks: 2 };
  assert.match(temperNote(f, 'spikyBed'), /\(2\/4 so far\)/);
  assert.match(temperLine(f), /Turning <b>Melancholic<\/b>: 2\/4 weeks/);
  delete f.humourDrift;
  f.decor.spikyBed = 1;
  f.decor.rockGarden = 1;
  assert.match(temperLine(f), /Temperament tied/);
});

test('UI: the fighter card shows a drift under way', async () => {
  const { fighterCard } = await import('../src/ui/components.js');
  const { f } = fighter(12, 'choleric');
  assert.doesNotMatch(fighterCard(f), /chip small drift/);
  f.humourDrift = { to: 'sanguine', weeks: 3 };
  assert.match(fighterCard(f), /chip small drift[^>]*>→ \S+ 3\/4/);
});

// Review fixes (7.1 follow-up).
test('Iron Rules turns the Spiky Bed and Skull Rack off, like the rest of the decor', () => {
  const { run, f } = fighter(20);
  f.decor.spikyBed = 1;
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  advanceToTournament(run);
  const m = startMatch(run, f.id, 1);
  m.a.arena = 'ironRules';
  m.a.f.injuries = [{ tag: 'fleshWound', weight: 1 }];
  m.over = true;
  m.result = { winner: 'A', reason: 'rounds' };
  finishMatch(run, m);
  assert.ok(!f.scars?.some((x) => x.id === 'hardened'));
});

test('Spiky Bed: an old wound carried into the fight does not count', () => {
  const { run, f } = fighter(21);
  f.decor.spikyBed = 1;
  winWith(run, f, [{ tag: 'fleshWound', weight: 1, weeksLeft: 2 }]);
  assert.ok(!f.scars?.some((x) => x.id === 'hardened'));
});

test('Spiky Bed also hardens in a Boss bracket Quarter-final', async () => {
  const { drawBrackets } = await import('../src/run.js');
  const run = createRun(22);
  const f = recruit(run, run.market[0].id);
  recruit(run, run.market[0].id);
  advanceToTournament(run);
  run.arenas[2] = { ...structuredClone(run.arenas[1]), tier: 2 };
  for (const t of [1, 2]) run.arenas[t].conquered = true;
  run.topTier = 3;
  run.arenas[3] = { ...structuredClone(run.arenas[1]), tier: 3, stage: 0, conquered: false };
  run.bouts = { 1: 'open', 2: 'open', 3: 'open' };
  run.boutPending = true;
  drawBrackets(run);
  run.prestige = 50;
  f.decor.spikyBed = 1;
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  const m = startMatch(run, f.id, 3);
  m.a.f.injuries = [{ tag: 'fleshWound', weight: 1 }];
  m.over = true;
  m.result = { winner: 'A', reason: 'rounds' };
  const s = finishMatch(run, m);
  assert.ok(s.bracket, 'a bracket round');
  assert.ok(f.scars.some((x) => x.id === 'hardened'));
  assert.equal(s.scar, 'Battle-Hardened');
});

test('taking the leading piece back ends the drift at once (a tie only pauses it)', () => {
  const { run, f } = fighter(23, 'choleric');
  run.gold = 30;
  for (const k of ['wineAmphora', 'rockGarden']) buyDecor(run, k);
  assignDecor(run, f.id, 'wineAmphora');
  driftHumour(run, f);
  driftHumour(run, f);
  assignDecor(run, f.id, 'rockGarden'); // tie
  assert.deepEqual(f.humourDrift, { to: 'sanguine', weeks: 2 });
  return import('../src/run.js').then(({ removeDecor }) => {
    removeDecor(run, f.id, 'wineAmphora'); // the Rock Garden leads now
    assert.equal(f.humourDrift, undefined);
  });
});

test('a bad drift target in a save does not break the room panel', async () => {
  const { temperLine } = await import('../src/ui/views.js');
  const { f } = fighter(24, 'choleric');
  f.humourDrift = { to: 'bogus', weeks: 2 };
  assert.match(temperLine(f), /Choleric/);
});
