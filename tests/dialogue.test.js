// Dialogue: the Emperor, your steward and the narrator speaking in a dialogue box (src/dialogue.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENES, SPEAKERS, dueScene } from '../src/dialogue.js';
import { INTRO, STEPS, FIGHT_STEPS } from '../src/tutorial.js';
import { FAVOR } from '../src/data.js';
import { WEEKS_PER_YEAR } from '../src/calendar.js';
import { createRun, GRAND_TIER } from '../src/run.js';
import { dialogueModal, tutorialCard } from '../src/ui/views.js';

test('every beat of every scene has a known speaker and something to say', () => {
  for (const [id, beats] of Object.entries(SCENES)) {
    assert.ok(beats.length, id);
    for (const b of beats) {
      assert.ok(SPEAKERS[b.speaker], `${id}: unknown speaker ${b.speaker}`);
      assert.ok(b.text || b.html, `${id}: empty beat`);
    }
  }
});

test('the opening: the designer\'s first intro page, then the Emperor sets the stakes, then the steward takes over', () => {
  const [first, ...rest] = SCENES.opening;
  assert.deepEqual([first.speaker, first.title, first.html], ['narrator', INTRO[0].title, INTRO[0].body]);
  const emperor = rest.filter((b) => b.speaker === 'emperor').map((b) => b.text).join(' ');
  assert.match(emperor, /pulled you here myself/, 'he knows: he pulled you through himself');
  assert.match(emperor, /Grand Tournament/);
  assert.match(emperor, /tribute/);
  assert.match(emperor, /die/);
  assert.equal(rest.at(-1).speaker, 'steward');
});

test('the Emperor returns at turning points, once each per career', () => {
  const run = createRun(1);
  assert.equal(dueScene(run), null, 'nothing on a new career');
  run.history.push({ boss: true, top: true, won: true });
  assert.equal(dueScene(run), 'firstBoss');
  assert.equal(dueScene(run, ['firstBoss']), null, 'never twice');
  run.favor = FAVOR.warning;
  assert.equal(dueScene(run, ['firstBoss']), 'lowFavor');
  run.week = WEEKS_PER_YEAR - 3;
  assert.equal(dueScene(run, ['firstBoss']), 'tribute');
  run.topTier = GRAND_TIER;
  assert.equal(dueScene(run, ['firstBoss']), 'grand', 'the Grand Tournament comes first');
  run.status = 'lost';
  assert.equal(dueScene(run), null, 'not after the career ends');
});

test('the dialogue box shows who is talking, one beat at a time', () => {
  const first = dialogueModal('opening', SCENES.opening, 1);
  assert.match(first, /Emperor Silbannacus/);
  assert.match(first, /aria-label="emperor"/, 'his portrait');
  assert.match(first, /data-action="scene-next"[^>]*>Next</);
  assert.match(first, /data-action="scene-skip"/);
  const last = dialogueModal('opening', SCENES.opening, SCENES.opening.length - 1);
  assert.match(last, /Your steward/);
  assert.match(last, />Enter the Ludus</);
  assert.doesNotMatch(last, /scene-skip/);
  assert.match(dialogueModal('grand', SCENES.grand, SCENES.grand.length - 1), />Continue</);
});

test('the tutorial is the steward talking: a dialogue in the Ludus, inline on the fight screen', () => {
  const ludus = tutorialCard(STEPS[0]);
  assert.match(ludus, /class="modal dialogue tutorial"/);
  assert.match(ludus, /Your steward/);
  assert.match(ludus, /data-action="tutorial-done"/);
  const fight = tutorialCard(FIGHT_STEPS[0], 'fight');
  assert.doesNotMatch(fight, /class="modal/, 'never blocks a fight');
  assert.match(fight, /Your steward: How a round works/);
});

test('the steward announces new buildings at a new House level, and new stock in the Market, Liaison and Armourer', async () => {
  const { newsSnapshot, stewardNews } = await import('../src/dialogue.js');
  const { BUILDINGS } = await import('../src/data.js');
  const run = createRun(1);
  const before = newsSnapshot(run);
  assert.deepEqual(stewardNews(before, newsSnapshot(run), run), [], 'nothing changed, nothing said');
  run.prestigeLevel = 2;
  run.market = run.market.map((f, i) => ({ ...f, id: `new${i}` }));
  run.liaisonOffer = { id: 'p1' };
  run.armourerStock = ['gladius'];
  const news = stewardNews(before, newsSnapshot(run), run).join(' ');
  const opened = Object.values(BUILDINGS).filter((b) => b.req[0] === 2).map((b) => b.name);
  assert.match(news, /level 2/);
  for (const name of opened) assert.match(news, new RegExp(name));
  assert.match(news, /New gladiators have arrived in the Market/);
  assert.match(news, /Liaison has a new prisoner/);
  assert.match(news, /Armourer has new stock/);
});

test('the tutorial month docks at the top, says where to go, and can be skipped', async () => {
  const { guideBar } = await import('../src/ui/views.js');
  const { GUIDE } = await import('../src/tutorial.js');
  const html = guideBar(GUIDE[0], false);
  assert.match(html, /Your steward/);
  assert.match(html, /data-action="tab" data-tab="market">Go to the Market/);
  assert.match(html, /data-action="tutorial-skip"/);
  assert.doesNotMatch(guideBar(GUIDE[0], true), /Go to the Market/);
});
