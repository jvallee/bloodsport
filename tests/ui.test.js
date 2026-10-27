import test from 'node:test';
import assert from 'node:assert/strict';
import { autoPlay, playRound } from '../src/fight.js';
import { rosterCap } from '../src/ludus.js';
import { createRun, recruit, recruitBlocker, setJob, jobBlocker, advanceWeek, startMatch, finishMatch, fightBlocker, skipBlocker, skipBout, forfeitBout, currentBout } from '../src/run.js';
import { topbar, endBanner, summaryBanner, ludusTab, estateTab, marketTab, helpModal } from '../src/ui/views.js';
import { fightView } from '../src/ui/fightView.js';

const BAD = /undefined|NaN|\[object Object\]/;
const fakeOdds = () => ({ win: 0.5, injury: 0.3, death: 0.01 });
const ui = { animateRound: 1, showMath: false, auto: false };

function checkScreens(run) {
  for (const html of [topbar(run, 'ludus'), ludusTab(run, fakeOdds), estateTab(run), marketTab(run), helpModal()]) {
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
          assert.doesNotMatch(summaryBanner(finishMatch(run, m)), BAD);
        } else if (!skipBlocker(run)) skipBout(run);
        else forfeitBout(run);
      } else advanceWeek(run);
      checkScreens(run);
    }
  }
});
