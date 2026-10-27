import test from 'node:test';
import assert from 'node:assert/strict';
import { autoPlay, playRound } from '../src/fight.js';
import { rosterCap } from '../src/ludus.js';
import { createRun, recruit, recruitBlocker, setJob, jobBlocker, advanceWeek, startMatch, finishMatch, fightBlocker, skipBlocker, skipBout, forfeitBout, boutFor, unlockedTiers, choosePerk } from '../src/run.js';
import { topbar, endBanner, summaryBanner, ludusTab, estateTab, marketTab, helpModal, codexTab, introModal, tutorialCard } from '../src/ui/views.js';
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
    assert.doesNotMatch(html, BAD, html.match(new RegExp(`.{0,80}(${BAD.source}).{0,40}`))?.[0]);
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
  assert.match(html, /tribute of <b>20 Gold<\/b> is due in <b>3<\/b> weeks/);
  assert.match(html, /class="tribute short"/);
  run.week = 10;
  assert.doesNotMatch(ludusTab(run, fakeOdds), /class="tribute/);
});
