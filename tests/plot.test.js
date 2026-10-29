// v6, the hidden plot (docs/roadmap-v6.md): political prisoners, the thread, rescue requests, suspicion and the endings.
import test from 'node:test';
import assert from 'node:assert/strict';
import { POLITICAL, PLOT } from '../src/data.js';
import { CLUES, PLOT_EVENTS, PLOT_EVENT_BY_ID, coupBonus } from '../src/plot.js';
import { EVENT_BY_ID, EVENTS, stakesText } from '../src/events.js';
import { medbaySlots } from '../src/ludus.js';
import {
  createRun, recruit, advanceWeek, advanceToTournament, chooseEvent, eventChoiceBlocker, markPolitical, createFighter,
  startMatch, finishMatch, choosePerk, drawBrackets, serialize, deserialize, resolveMercy, GRAND_TIER, matchOptions,
} from '../src/run.js';
import { createRng } from '../src/rng.js';

// A career with a political prisoner (a scribe) just bought from the Liaison.
function withPrisoner(seed = 1, cell = 'scribe') {
  const run = createRun(seed);
  run.gold = 100;
  run.prestigeLevel = 3;
  run.buildings.push({ id: 'bl', type: 'liaison', level: 1 });
  recruit(run, run.market[0].id);
  const f = createFighter(createRng(9), { id: 'fp', takenNames: run.roster.map((x) => x.name) });
  Object.assign(f, { political: { cell }, price: 1, origin: 'Condemned convict' });
  run.liaisonOffer = f;
  recruit(run, f.id);
  return { run, f };
}
// Show a plot card now and choose `index`.
function card(run, id, index, extra = {}) {
  const e = PLOT_EVENT_BY_ID[id];
  const t = e.target(run, run.rng.plot);
  run.event = { id, plot: true, ...t, ...extra };
  return chooseEvent(run, index);
}
const play = (run, id, tier, { winner = 'A', reason = 'rounds' } = {}) => {
  for (const x of run.roster) while (x.pendingPerks.length) choosePerk(run, x.id, x.pendingPerks[0][0]);
  const m = startMatch(run, id, tier);
  m.over = true;
  m.result = { winner, reason };
  return finishMatch(run, m);
};

test('political prisoners: about POLITICAL.chance of Liaison offers, with a telling clue and a lower price', () => {
  let political = 0;
  const n = 600;
  for (let seed = 1; seed <= n; seed++) {
    const run = createRun(seed);
    run.politicalOffered = true; // no guarantee: measure the plain chance
    const f = createFighter(createRng(seed), { id: 'x' });
    f.price = 4;
    markPolitical(run, f);
    if (f.political) {
      political++;
      assert.equal(f.price, 4 - POLITICAL.priceCut);
      assert.ok(f.record.some((c) => CLUES.telling.includes(c)), 'a political prisoner always has a telling clue');
    } else {
      assert.ok(!f.record.some((c) => CLUES.telling.includes(c)), 'an ordinary prisoner never has a telling clue');
      assert.equal(f.price, 4);
    }
  }
  assert.ok(Math.abs(political / n - POLITICAL.chance) < 0.05, `${political}/${n}`);
});

test('from Year 2, the first Liaison offer is political if none has been yet', () => {
  const run = createRun(1);
  run.week = 53;
  const f = createFighter(createRng(1), { id: 'x' });
  f.price = 4;
  markPolitical(run, f);
  assert.ok(f.political);
});

test('the plot draws only from its own dice: political prisoners on offer change nothing else', () => {
  const trace = (chance) => {
    const old = POLITICAL.chance;
    POLITICAL.chance = chance;
    const run = createRun(5);
    run.prestigeLevel = 2;
    run.buildings.push({ id: 'bl', type: 'liaison', level: 2 });
    recruit(run, run.market[0].id);
    const seen = [];
    for (let i = 0; i < 40 && run.status === 'active'; i++) {
      if (run.event) chooseEvent(run, 0);
      run.boutPending = false;
      advanceWeek(run);
      seen.push([run.market.map((f) => f.name).join(), run.event?.id ?? '-', run.liaisonOffer?.name ?? '-']);
    }
    POLITICAL.chance = old;
    return seen;
  };
  assert.deepEqual(trace(0), trace(1));
});

test('buying a political prisoner starts the thread: the chalk mark comes within a few weeks', () => {
  const { run, f } = withPrisoner();
  assert.equal(run.plot.stage, 'mark');
  assert.deepEqual(run.plot.cells, ['scribe']);
  let shown = null;
  for (let i = 0; i < PLOT.firstGap[1] + 1 && !shown; i++) {
    if (run.event && !run.event.plot) chooseEvent(run, 0);
    run.boutPending = false;
    advanceWeek(run);
    if (run.event?.plot) shown = run.event;
  }
  assert.equal(shown?.id, 'chalkMark');
  assert.equal(shown.f, f.id);
});

test('no political prisoner, no plot: plot cards never appear', () => {
  const run = createRun(2);
  recruit(run, run.market[0].id);
  for (let i = 0; i < 80 && run.status === 'active'; i++) {
    if (run.event) {
      assert.ok(!run.event.plot);
      chooseEvent(run, 0);
    }
    run.boutPending = false;
    advanceWeek(run);
  }
  assert.equal(run.plot, null);
  assert.ok(EVENTS.every((e) => !e.plot), 'plot cards are never in the ordinary draw');
});

test('helping moves the thread on; refusing twice in a row lets it go cold', () => {
  const { run } = withPrisoner();
  card(run, 'chalkMark', 1);
  assert.deepEqual([run.plot.stage, run.plot.trust], ['favours', 1]);
  card(run, 'pamphlets', 0);
  assert.equal(run.plot.refusals, 1);
  card(run, 'cousinVisit', 1); // helping resets the count
  assert.equal(run.plot.refusals, 0);
  card(run, 'pamphlets', 0);
  card(run, 'hideWounded', 0);
  assert.equal(run.plot.ended, 'cold');
});

test('enough trust and House level 3 bring the Cause', () => {
  const { run } = withPrisoner();
  card(run, 'chalkMark', 1);
  card(run, 'hideWounded', 1);
  assert.equal(run.plot.stage, 'favours');
  card(run, 'cousinVisit', 1);
  assert.equal(run.plot.stage, 'cause', `trust ${run.plot.trust}`);
});

test('hiding the wounded man takes a Medbay bed for two weeks, and pays', () => {
  const { run } = withPrisoner();
  const beds = medbaySlots(run);
  const gold = run.gold;
  card(run, 'hideWounded', 1);
  assert.equal(medbaySlots(run), beds - 1);
  assert.equal(run.gold, gold + 6);
  run.boutPending = false;
  advanceWeek(run);
  advanceWeek(run);
  assert.equal(medbaySlots(run), beds);
});

test('the cousin\'s visit reveals the top arena\'s Boss rule', () => {
  const { run } = withPrisoner();
  card(run, 'cousinVisit', 1);
  assert.equal(run.plot.reveal, run.topTier);
});

test('rescue: buying a brother out of the cells frees him as a contact; refusing costs the asker Morale', () => {
  const { run, f } = withPrisoner();
  card(run, 'chalkMark', 1);
  const gold = run.gold;
  card(run, 'freeFromCells', 1);
  assert.equal(run.gold, gold - PLOT.freeCost);
  assert.equal(run.plot.freed.length, 1);
  assert.ok(run.plot.freed[0].name);
  card(run, 'freeFromCells', 0);
  assert.ok(f.mood.n <= -15);
});

test('rescue: "Free me" lets the asker go as a contact; refused twice, they try to escape', () => {
  const { run, f } = withPrisoner();
  run.plot.trust = 3;
  card(run, 'freeMe', 1, { f: f.id });
  assert.ok(!run.roster.includes(f));
  assert.deepEqual(run.plot.freed.map((c) => [c.name, c.cell, c.how]), [[f.name, 'scribe', 'freed']]);

  const second = withPrisoner(2);
  second.run.plot.trust = 3;
  card(second.run, 'freeMe', 0, { f: second.f.id });
  assert.ok(second.run.roster.includes(second.f), 'one refusal: still here');
  card(second.run, 'freeMe', 0, { f: second.f.id });
  assert.ok(!second.run.roster.includes(second.f), 'two refusals: gone over the wall');
});

test('rescue: the condemned can be saved by clemency (Favor) or a risky escape', () => {
  const { run } = withPrisoner();
  run.plot.stage = 'cause';
  const favor = run.favor;
  card(run, 'freeCondemned', 1, { name: 'Varia' });
  assert.equal(run.favor, favor - PLOT.clemencyFavor);
  assert.equal(run.plot.freed.at(-1).name, 'Varia');
});

test('rescue: a rebel across the sand, beaten and spared, becomes a contact; killed, the rebels turn away', () => {
  for (const [reason, freed] of [['rounds', 1], ['death', 0]]) {
    const { run } = withPrisoner();
    run.plot.stage = 'cause';
    run.plot.trust = 5;
    advanceToTournament(run);
    card(run, 'acrossSand', 1);
    assert.equal(run.arenas[run.topTier].opponent.rebel, true);
    const fighter = run.roster.find((x) => !x.political);
    fighter.power = 40;
    play(run, fighter.id, run.topTier, { reason });
    if (run.mercy) resolveMercy(run, 'spare');
    assert.equal(run.plot.freed.length, freed, reason);
    if (!freed) assert.equal(run.plot.trust, 6 - 3, "promising adds 1 trust, killing them takes 3");
  }
});

test('contacts are voices in the crowd at the coup: +3% each, up to +12%', () => {
  const { run } = withPrisoner();
  for (let i = 0; i < 6; i++) run.plot.freed.push({ name: `C${i}`, cell: 'courier', caught: false });
  assert.equal(coupBonus(run), PLOT.contactMax);
  run.plot.freed = run.plot.freed.slice(0, 2);
  assert.equal(coupBonus(run), 2 * PLOT.contactWin);
});

test('suspicion: political prisoners raise it each month; past 80 the Praetorians raid', () => {
  const { run } = withPrisoner();
  card(run, 'chalkMark', 1);
  run.plot.suspicion = 10;
  run.boutPending = false;
  while (run.week % 4 !== 0) advanceWeek(run); // to a month start
  for (let i = 0; i < 6; i++) { if (run.event) chooseEvent(run, 0); run.boutPending = false; advanceWeek(run); }
  assert.ok(run.plot.suspicion !== 10);
  run.plot.suspicion = 85;
  run.event = null;
  run.plot.nextAt = 999;
  advanceWeek(run);
  assert.equal(run.event?.id, 'raid', 'a raid comes at once, whatever the gap');
});

test('raids: hand over a prisoner, pay, show a pass, or bar the gates and risk treason', () => {
  const { run, f } = withPrisoner();
  run.plot.suspicion = 85;
  assert.match(eventChoiceBlocker(run, 2) ?? '', /No event/);
  run.event = { id: 'raid', plot: true, f: f.id };
  assert.equal(eventChoiceBlocker(run, 2), 'You have no forged pass.');
  chooseEvent(run, 1);
  assert.ok(!run.roster.includes(f));
  assert.ok(run.fallen.some((x) => x.id === f.id));
  assert.equal(run.plot.suspicion, 45);

  // Barring the gates and losing is treason: the career ends.
  let treason = false;
  for (let seed = 1; seed <= 20 && !treason; seed++) {
    const r = withPrisoner(seed).run;
    r.plot.suspicion = 85;
    card(r, 'raid', 3);
    if (r.status === 'lost') {
      treason = true;
      assert.equal(r.ending, 'treason');
    }
  }
  assert.ok(treason);
});

test('the Loyalist: naming names executes the political prisoners and the freed, for a lot of Favor', () => {
  const { run, f } = withPrisoner();
  run.plot.stage = 'cause';
  run.plot.freed.push({ name: 'Varia', cell: 'priest', caught: false });
  run.favor = 40;
  card(run, 'theOffer', 1);
  assert.equal(run.plot.ended, 'loyalist');
  assert.equal(run.favor, 40 + PLOT.betrayFavor);
  assert.ok(!run.roster.includes(f));
  assert.match(run.epilogue[0], new RegExp(`${f.name}.*Varia`));
  assert.equal(run.status, 'active', 'the career goes on');
});

test('hidden effects never show on the buttons', () => {
  assert.equal(stakesText(PLOT_EVENT_BY_ID.cousinVisit.choices[1].effects), 'Nothing happens');
  assert.match(stakesText(PLOT_EVENT_BY_ID.hideWounded.choices[1].effects), /\+6 Gold/);
  assert.equal(stakesText(PLOT_EVENT_BY_ID.informer.choices[1].effects), 'A gamble (50%)');
  for (const e of PLOT_EVENTS) assert.ok(EVENT_BY_ID[e.id], `${e.id} can be looked up`);
});

// The Grand Final with the coup under way.
function coupReady(seed = 1) {
  const { run, f } = withPrisoner(seed);
  const champ = run.roster.find((x) => !x.political);
  advanceToTournament(run);
  for (const t of [2, 3, 4]) run.arenas[t] = { ...structuredClone(run.arenas[1]), tier: t, stage: 0, conquered: true };
  run.arenas[1].conquered = true;
  run.arenas[GRAND_TIER] = { ...structuredClone(run.arenas[1]), tier: GRAND_TIER, stage: 3, conquered: false };
  run.topTier = GRAND_TIER;
  run.bouts = { [GRAND_TIER]: 'open' };
  run.boutPending = true;
  run.brackets = {};
  drawBrackets(run);
  run.prestige = 200;
  Object.assign(run.plot, { stage: 'ready', trust: 6, armed: true, champion: champ.id });
  run.plot.freed.push({ name: 'Varia', cell: 'priest', caught: false });
  run.event = null;
  card(run, 'coupEve', 1);
  return { run, champ, f };
}
const playGrand = (run, id, winFinal) => {
  for (let round = 0; round < 3 && run.status === 'active' && run.bouts?.[GRAND_TIER] === 'open'; round++) {
    play(run, id, GRAND_TIER, { winner: round < 2 || winFinal ? 'A' : 'B' });
    if (run.mercy) resolveMercy(run, 'spare');
  }
};

test('the coup: the Emperor watches (no capitulating), and the freed cheer the champion on', () => {
  const { run, champ, f } = coupReady();
  assert.equal(run.plot.coup, true);
  assert.equal(run.arenas[GRAND_TIER].debuff, 'emperorsGaze');
  assert.equal(matchOptions(run, champ, GRAND_TIER).rebels, PLOT.contactWin);
  assert.equal(matchOptions(run, f, GRAND_TIER).rebels, 0, 'only for the champion');
});

test('the coup succeeds when the champion wins the Final: a secret victory', () => {
  const { run, champ } = coupReady();
  playGrand(run, champ.id, true);
  assert.deepEqual([run.status, run.ending, run.plot.ended], ['won', 'coup', 'coup']);
  assert.match(run.endReason, /Silbannacus falls/);
  assert.match(run.epilogue.join(' '), /Varia/);
});

test('the Martyr: the champion falls in the Final and the career ends', () => {
  const { run, champ } = coupReady();
  playGrand(run, champ.id, false);
  assert.deepEqual([run.status, run.ending], ['lost', 'martyr']);
});

test('another fighter winning the Final is a normal win, and the moment passes', () => {
  const { run, f } = coupReady();
  playGrand(run, f.id, true);
  assert.equal(run.status, 'won');
  assert.equal(run.ending ?? null, null);
  assert.equal(run.plot.ended, 'cold');
});

test('saves keep the plot, and older saves load without one', () => {
  const { run } = withPrisoner();
  card(run, 'chalkMark', 1);
  const back = deserialize(serialize(run));
  assert.equal(back.plot.stage, 'favours');
  const old = JSON.parse(serialize(createRun(3)));
  delete old.plot;
  delete old.rng.plot;
  const loaded = deserialize(JSON.stringify(old));
  assert.equal(loaded.plot, null);
  assert.ok(loaded.rng.plot);
});

test('the Liaison card shows the prisoner\'s record; the end screen names the plot\'s endings', async () => {
  const { marketTab, endBanner } = await import('../src/ui/views.js');
  const run = createRun(1);
  run.buildings.push({ id: 'bl', type: 'liaison', level: 1 });
  const f = createFighter(createRng(1), { id: 'px' });
  Object.assign(f, { price: 1, origin: 'Condemned convict', record: [CLUES.telling[0]] });
  run.liaisonOffer = f;
  assert.match(marketTab(run), /Prison record.*Refuses to salute/s);
  const { run: won, champ } = coupReady();
  playGrand(won, champ.id, true);
  assert.match(endBanner(won), /The Tyrant Falls[\s\S]*Varia/);
});

test('Legacy: the plot\'s achievements stay secret until earned; the coup and the Martyr unlock a patron', async () => {
  const { ACHIEVEMENTS, createLegacy, checkAchievements, unlockedPatrons, careerScore } = await import('../src/legacy.js');
  const { legacyPanel } = await import('../src/ui/views.js');
  const legacy = createLegacy();
  assert.doesNotMatch(legacyPanel(legacy), /Sic Semper|Thirty Pieces/);
  assert.match(legacyPanel(legacy), /\?\?\?/);
  const { run, champ } = coupReady();
  playGrand(run, champ.id, true);
  const got = checkAchievements(legacy, run).map((a) => a.id);
  assert.ok(got.includes('coup') && got.includes('chalk'));
  assert.ok(unlockedPatrons(legacy).includes('liberator'));
  assert.equal(unlockedPatrons(legacy).filter((p) => p === 'liberator').length, 1);
  assert.ok(ACHIEVEMENTS.filter((a) => a.secret).length >= 4);
  assert.ok(careerScore(run) >= 300);
});

test('the Liberator patron starts the career with a political prisoner and the thread begun', () => {
  const run = createRun(4, { patron: 'liberator', decrees: [], classes: [] });
  assert.ok(run.roster.some((f) => f.political));
  assert.equal(run.plot.stage, 'mark');
});

test('the Codex\'s Rebellion section is hidden until the plot is found', async () => {
  const { createCodex, discover, ENTRIES, SECTIONS, progress, isUnlocked, hasLore } = await import('../src/codex.js');
  const { codexTab } = await import('../src/ui/views.js');
  const codex = createCodex();
  const plain = createRun(1);
  discover(codex, plain);
  assert.doesNotMatch(codexTab(codex, ENTRIES, SECTIONS, [], progress(codex), isUnlocked, hasLore), /The Rebellion/);
  const { run } = withPrisoner();
  card(run, 'chalkMark', 1);
  discover(codex, run);
  const html = codexTab(codex, ENTRIES, SECTIONS, [], progress(codex), isUnlocked, hasLore);
  assert.match(html, /The Rebellion/);
  assert.match(html, /The broken chain/);
  assert.match(html, /The Scribe/);
});
