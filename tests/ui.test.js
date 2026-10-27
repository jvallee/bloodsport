import test from 'node:test';
import assert from 'node:assert/strict';
import { autoPlay, playRound } from '../src/fight.js';
import { rosterCap } from '../src/ludus.js';
import { createRun, recruit, recruitBlocker, setJob, jobBlocker, advanceWeek, startMatch, finishMatch, fightBlocker, skipBlocker, skipBout, forfeitBout, currentBout } from '../src/run.js';
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
    for (let step = 0; step < 400 && run.status === 'active'; step++) {
      if (run.roster.length < rosterCap(run) && run.market[0] && !recruitBlocker(run, run.market[0].id)) recruit(run, run.market[0].id);
      for (const f of run.roster) {
        const job = f.injuries.length ? 'medbay' : f.stress >= 40 ? 'rest' : 'trainPower';
        if (!jobBlocker(run, f.id, job)) setJob(run, f.id, job);
      }
      if (run.boutPending) {
        const f = run.roster.find((x) => !fightBlocker(run, x.id));
        if (f) {
          const m = startMatch(run, f.id);
          assert.doesNotMatch(fightView(m, ui, currentBout(run)), BAD);
          playRound(m);
          for (const showMath of [true, false]) assert.doesNotMatch(fightView(m, { ...ui, showMath }, currentBout(run)), BAD);
          autoPlay(m);
          assert.doesNotMatch(fightView(m, ui, currentBout(run)), BAD);
          discoverMatch(codex, m);
          assert.doesNotMatch(summaryBanner(finishMatch(run, m)), BAD);
        } else if (!skipBlocker(run)) skipBout(run);
        else forfeitBout(run);
      } else advanceWeek(run);
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
