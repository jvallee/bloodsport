import test from 'node:test';
import assert from 'node:assert/strict';
import { autoPlay, playRound } from '../src/fight.js';
import { rosterCap } from '../src/ludus.js';
import { createRun, recruit, recruitBlocker, setJob, jobBlocker, advanceWeek, advanceToTournament, startMatch, finishMatch, fightBlocker, skipBlocker, skipBout, forfeitBout, boutFor, unlockedTiers, choosePerk, payTribute } from '../src/run.js';
import { topbar, endBanner, summaryBanner, ludusTab, estateTab, marketTab, helpModal, codexTab, introModal, tutorialCard, noticePager, bugModal, eventCard, setupModal, legacyPanel } from '../src/ui/views.js';
import { TRIBUTE } from '../src/data.js';
import { ENTRIES, SECTIONS, createCodex, discover, discoverMatch, isUnlocked, hasLore, progress } from '../src/codex.js';
import { INTRO, STEPS, FIGHT_STEPS } from '../src/tutorial.js';
import { fightView } from '../src/ui/fightView.js';

const BAD = /undefined|NaN|\[object Object\]/;
const fakeOdds = () => ({ win: 0.5, injury: 0.3, death: 0.01 });
const ui = { animateRound: 1, showMath: false, auto: false };

const codex = createCodex();

function checkScreens(run) {
  discover(codex, run);
  const codexHtml = codexTab(codex, ENTRIES, SECTIONS, codex.fresh, progress(codex), isUnlocked, hasLore);
  for (const html of [topbar(run, 'ludus', 3), ludusTab(run, fakeOdds), estateTab(run), marketTab(run), helpModal(), codexHtml]) {
    // Build the failure snippet only on failure: the snippet regex is slow on large pages.
    if (BAD.test(html)) assert.fail(html.slice(Math.max(0, html.search(BAD) - 80), html.search(BAD) + 40));
  }
  if (run.status !== 'active') assert.doesNotMatch(endBanner(run), BAD);
}

test('every screen renders cleanly through whole careers', () => {
  for (let seed = 1; seed <= 6; seed++) {
    const run = createRun(seed);
    checkScreens(run);
    run.gold += 60;
    for (let step = 0; step < 600 && run.status === 'active'; step++) {
      for (const f of run.roster) while (f.pendingPerks.length) choosePerk(run, f.id, f.pendingPerks[0][0]);
      if (run.roster.length < rosterCap(run) && run.market[0] && !recruitBlocker(run, run.market[0].id)) recruit(run, run.market[0].id);
      for (const f of run.roster) {
        const job = f.injuries.length ? 'medbay' : f.stress >= 40 ? 'rest' : 'trainPower';
        if (!jobBlocker(run, f.id, job)) setJob(run, f.id, job);
      }
      if (run.bouts) {
        // Fight in every open arena with whoever is free, top arena last.
        for (const t of unlockedTiers(run)) {
          const f = run.roster.find((x) => !fightBlocker(run, x.id, t));
          if (!f) continue;
          const m = startMatch(run, f.id, t);
          const bout = boutFor(run, t);
          assert.doesNotMatch(fightView(m, ui, bout), BAD);
          playRound(m);
          for (const showMath of [true, false]) assert.doesNotMatch(fightView(m, { ...ui, showMath }, bout), BAD);
          autoPlay(m);
          assert.doesNotMatch(fightView(m, ui, bout), BAD);
          discoverMatch(codex, m);
          assert.doesNotMatch(summaryBanner(finishMatch(run, m)), BAD);
          checkScreens(run);
        }
        if (run.status !== 'active') continue;
        for (const f of run.roster) while (f.pendingPerks.length) choosePerk(run, f.id, f.pendingPerks[0][0]);
        if (!run.boutPending) advanceWeek(run);
        else if (!skipBlocker(run)) skipBout(run);
        else forfeitBout(run);
        continue;
      }
      advanceWeek(run);
      checkScreens(run);
    }
  }
});

test('intro pages and tutorial cards render cleanly', () => {
  INTRO.forEach((_, i) => assert.doesNotMatch(introModal(i, INTRO), BAD));
  for (const step of [...STEPS, ...FIGHT_STEPS]) assert.doesNotMatch(tutorialCard(step), BAD);
  assert.equal(tutorialCard(null), '');
});

test('the Codex shows locked entries as ??? and opened ones with rules', () => {
  const c = createCodex();
  const html = codexTab(c, ENTRIES, SECTIONS, [], progress(c), isUnlocked, hasLore);
  assert.match(html, /\?\?\?/);
  assert.match(html, /The Death Gate/);
  c.seen.push('kind:orc');
  assert.match(codexTab(c, ENTRIES, SECTIONS, ['kind:orc'], progress(c), isUnlocked, hasLore), /Orc <span class="new">new/);
});

test('the week panel warns about tribute in the last month, in red when you are short', () => {
  const run = createRun(4);
  run.week = 37;
  run.gold = 3;
  const html = ludusTab(run, fakeOdds);
  assert.match(html, new RegExp(`tribute of <b>${TRIBUTE.perYear} Gold</b> is due in <b>3</b> weeks`));
  assert.match(html, /class="tribute short"/);
  run.week = 10;
  assert.doesNotMatch(ludusTab(run, fakeOdds), /class="tribute/);
});

test('the notification pager shows one item at a time with page controls', () => {
  assert.equal(noticePager([]), '');
  assert.equal(noticePager(['<b>a</b>']), '<b>a</b>');
  const html = noticePager(['<b>a</b>', '<b>b</b>', '<b>c</b>'], 1);
  assert.match(html, /2 \/ 3 notifications/);
  assert.match(html, /<b>b<\/b>/);
  assert.doesNotMatch(html, /<b>a<\/b>|<b>c<\/b>/);
  assert.match(html, /data-page="0"/);
  assert.match(html, /data-page="2"/);
});

test('each round shows who strikes first with dice, and the end of a match shows a full report', () => {
  const run = createRun(8);
  const f = recruit(run, run.market[0].id);
  for (let i = 0; i < 6 && !run.bouts; i++) advanceWeek(run);
  const bout = boutFor(run, run.topTier);
  const m = startMatch(run, f.id);
  m.bout = bout;
  playRound(m);
  const round = fightView(m, { ...ui, animateRound: 1 }, bout);
  assert.match(round, /Who strikes first/);
  if (m.rounds[0].initiative.rolls) assert.match(round, /class="die"/);
  assert.doesNotMatch(round, BAD);
  autoPlay(m);
  m.summary = finishMatch(run, m);
  const end = fightView(m, ui, bout);
  assert.match(end, /After the fight/);
  for (const label of ['Gold', 'Prestige']) assert.match(end, new RegExp(`<span>${label}</span>`));
  if (!m.summary.died) for (const label of ['XP', 'Renown', 'Morale']) assert.match(end, new RegExp(`<span>${label}</span>`));
  assert.doesNotMatch(end, BAD);
});

test('the next-step bar renders the hint and a shortcut reminder', async () => {
  const { nextBar } = await import('../src/ui/views.js');
  const { nextHint } = await import('../src/hints.js');
  const html = nextBar(nextHint(createRun(3)));
  assert.match(html, /Next:/);
  assert.match(html, /data-tab="market"/);
  assert.equal(nextBar(null), '');
});

test('the top bar always counts down to tribute, and the week panel can pay it early', () => {
  const run = createRun(4);
  recruit(run, run.market[0].id);
  run.week = 10;
  run.gold = 40;
  assert.match(topbar(run), new RegExp(`class="stat due"[^>]*>⚖ <b>${TRIBUTE.perYear}</b> <small>in 30 wks</small>`));
  assert.match(ludusTab(run, fakeOdds), /data-action="pay-tribute"\s*>Pay now/);
  payTribute(run);
  assert.match(topbar(run), /⚖ <b>Paid<\/b>/);
  assert.doesNotMatch(ludusTab(run, fakeOdds), /data-action="pay-tribute"/);
});

test('the bug report box: a crash shows the error and a reload; a manual report can be closed', () => {
  const crashed = bugModal({ crashed: true, message: 'x is <undefined>', notes: 'I clicked', status: '', version: '9.9.9' });
  assert.match(crashed, /Something went wrong/);
  assert.match(crashed, /x is &lt;undefined&gt;/);
  assert.match(crashed, /data-action="bug-reload"/);
  assert.match(crashed, />I clicked<\/textarea>/);
  assert.doesNotMatch(crashed, /bug-close/);
  const manual = bugModal({ crashed: false, message: '', notes: '', status: 'Copied.', version: '9.9.9' });
  assert.match(manual, /data-action="bug-close"/);
  assert.match(manual, /data-action="bug-copy"/);
  assert.match(manual, /Copied\./);
  assert.match(topbar(createRun(1)), /data-action="bug-open"/);
});

test('the week panel offers the full house log once it outgrows the recent list', () => {
  const run = createRun(2);
  for (let i = 0; i < 12; i++) run.log.push({ week: 0, text: `entry ${i}`, tone: 'info' });
  assert.match(ludusTab(run, fakeOdds), /Full house log \(13 entries\)/);
});

test('a blocked Send button says why on the page, not only on hover', () => {
  const run = createRun(1);
  recruit(run, run.market[0].id);
  advanceToTournament(run);
  run.topTier = 2;
  run.arenas[2] = { ...structuredClone(run.arenas[1]), tier: 2 };
  run.bouts = { 1: 'open', 2: 'open' };
  run.prestige = 0;
  const html = ludusTab(run, fakeOdds);
  assert.match(html, /<small class="why-not">Needs 2 Prestige for the buy-in \(you have 0\)\.<\/small>/);
  assert.match(html, /Buy-in 0 Prestige <i>\(normally 1: the Dirt Pits take whatever Prestige you have\)/);
});

test('fight items can be used before Round 1', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  const m = startMatch(run, f.id);
  const html = fightView(m, { animateRound: 0, showMath: false, auto: false }, boutFor(run, 1), '', { warPaint: 1 });
  assert.match(html, /data-action="use-item" data-item="warPaint"/);
  assert.match(html, /Round 1: choose your tactic/);
});

test('the fight shows a tactic for each round, marks the suggestion, and reads the opponent', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  advanceToTournament(run);
  const m = startMatch(run, f.id);
  m.b.f.humor = 'choleric';
  const ui = { animateRound: 0, showMath: false, auto: false };
  let html = fightView(m, ui, boutFor(run, 1));
  for (const t of ['steady', 'press', 'guard', 'feint']) assert.match(html, new RegExp(`data-action="next-round" data-stance="${t}"`));
  assert.match(html, /btn big tactic primary" data-action="next-round" data-stance="guard"/);
  assert.match(html, /is <b>Choleric<\/b>: loves to Press/);
  playRound(m, { stance: 'guard' });
  if (m.over) return;
  html = fightView(m, ui, boutFor(run, 1));
  assert.match(html, /You: <b>Guard<\/b>/);
  assert.match(html, /Last round they chose <b>/);
});

test('a pending event shows as a card with its choices; a costly one says why it is blocked', () => {
  const run = createRun(1);
  recruit(run, run.market[0].id);
  recruit(run, run.market[0].id);
  run.event = { id: 'trainer', f: run.roster[0].id };
  run.gold = 1;
  const html = eventCard(run);
  assert.match(html, /A wandering lanista/);
  assert.match(html, new RegExp(`lessons for ${run.roster[0].name}`));
  assert.match(html, /data-action="event-choice" data-index="0" disabled/);
  assert.match(html, /Needs 6 Gold/);
  assert.match(html, /data-action="event-choice" data-index="1"/);
  assert.equal(eventCard({ ...run, event: null }), '');
});

test('the week panel names the coming Gods\' Day, and a festival tournament shows its banner', () => {
  const run = createRun(1);
  recruit(run, run.market[0].id);
  run.week = 8; // Maius, week 1: Floralia in 3 weeks
  assert.match(ludusTab(run, fakeOdds), /In <b>3<\/b> weeks: <b>Floralia<\/b> \(Flora\)/);
  run.week = 11;
  run.bouts = { 1: 'open' };
  run.boutPending = true;
  assert.match(ludusTab(run, fakeOdds), /<b>This tournament week<\/b>: <b>Floralia<\/b>/);
  assert.match(ludusTab(run, fakeOdds), /class="festival now">🏛 <b>Floralia<\/b>: wins pay|class="festival now">🏛 <b>Floralia<\/b>:/);
});

test('the end of a career shows its score, best fighter and the fallen', () => {
  const run = createRun(3);
  const f = recruit(run, run.market[0].id);
  run.history.push({ won: true, fighterId: f.id });
  run.fallen.push({ ...run.market[0], alive: false });
  run.status = 'lost';
  run.endReason = 'Executed by the Emperor.';
  const html = endBanner(run, { best: 12, careers: 2 });
  assert.match(html, /Your house has fallen/);
  assert.match(html, /Score <b>\d+<\/b> · best ever/);
  assert.match(html, new RegExp(`Best fighter</div><b>${f.name}</b>`));
  assert.match(html, /The fallen/);
});

test('the new-career dialog offers unlocked patrons, and decrees only after a win', () => {
  const legacy = { achievements: ['firstBoss', 'bronze'], careers: 1, best: 0, past: [] };
  const html = setupModal(legacy, { patron: '', decrees: [] });
  assert.match(html, /value="veteran"/);
  assert.doesNotMatch(html, /value="purse"/);
  assert.match(html, /Win a career to unlock the Emperor/);
  assert.match(html, /Unlocked classes in the market: Thorn-Blade/);
  assert.match(setupModal({ ...legacy, achievements: ['champion'] }, { patron: '', decrees: [] }), /value="ironBosses"/);
  assert.match(legacyPanel(legacy), /★ First Blood/);
  assert.match(legacyPanel(legacy), /☆ Master of the Games/);
});

test('event choices show their stakes under each button', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  run.event = { id: 'injuredDog', f: f.id };
  run.gold = 10;
  assert.match(eventCard(run), new RegExp(`−2 Gold; ${f.name}: \\+15 Morale for 4 weeks, −10 Stress`));
});

test('gear is equipped from a dropdown that says what each item does', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  run.inventory.gear = ['gladius', 'leatherVest'];
  const html = ludusTab(run, fakeOdds);
  assert.match(html, new RegExp(`<select class="gear-select equip" data-change="equip" data-id="${f.id}"`));
  assert.match(html, /<option value="0">Gladius: \+1 Power\.<\/option>/);
  assert.match(html, /<option value="1">Leather Vest: −5% chance to be injured \(armor\)\.<\/option>/);
});

test('a fighter card counts their wins, with the wins in each arena on hover', () => {
  const run = createRun(1);
  const f = recruit(run, run.market[0].id);
  f.arenaWins = { 1: 3, 2: 2 };
  assert.match(ludusTab(run, fakeOdds), /title="Wins by arena: The Dirt Pits: 3 · The Bronze Arena: 2">🏅 5 wins<\/span>/);
});
