import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRng } from '../src/rng.js';
import { createMatch, playRound } from '../src/fight.js';
import { createRun, recruit, advanceToTournament, buyDecor, assignDecor, startMatch, arenaPower } from '../src/run.js';
import { SUMMONS, CIRCUITS, INJURY_BY_TAG } from '../src/data.js';
import { fighterCard } from '../src/ui/components.js';
import { fightView, roundTiming, sideCardHtml } from '../src/ui/fightView.js';
import { portrait as fighterPortrait, npcPortrait } from '../src/ui/portrait.js';
import { setSound, sfx, roundSounds, stopAllSounds } from '../src/ui/sound.js';
import { ludusTab, codexTab, helpModal, legacyPanel, topbar } from '../src/ui/views.js';
import { createCodex, ENTRIES, SECTIONS, progress, isUnlocked, hasLore, discover } from '../src/codex.js';
import { nextHint } from '../src/hints.js';
import { GUIDE } from '../src/tutorial.js';
import { createSession } from '../scripts/play-text.js';

const blank = (over = {}) => ({
  id: 'f1', name: 'Test', kind: 'human', kindTrait: null, cls: null, weapon: null,
  power: 5, speed: 3, level: 1, xp: 0, perks: [], pendingPerks: [], gear: { weapon: null, armor: null },
  decor: {}, injuries: [], scars: [], augments: [], titles: [], kills: 0, renown: 0,
  stress: 0, morale: 60, job: 'rest', trained: 0, alive: true, ...over,
});

test('XSS: malicious save fields (tone, id, scar, daily, heat, seed, color, legacy) are escaped or sanitized', () => {
  const run = createRun(1, { short: true });
  const f = recruit(run, run.market[0].id);
  f.id = 'f1" onclick="alert(1)';
  f.scars = [{ id: 'enraged', vs: 'melee"><img src=x onerror=1>' }];
  run.log.push({ week: 1, text: 'hello', tone: 'good" onmouseover="alert(1)' });
  run.setup = { short: true, daily: '2026-01-01"><script>x</script>', heat: '3" onclick="x' };
  run.seed = '123"><svg onload=1>';
  run.houses[0].color = 'red;background:url(javascript:alert(1))';

  const card = fighterCard(f, { run });
  assert.doesNotMatch(card, /<img src=x/);
  assert.doesNotMatch(card, /" onclick="alert/);

  const oddsFor = () => ({ win: 0.5, injury: 0.1, death: 0 });
  const bar = topbar(run, { tab: 'ludus' });
  const ludus = ludusTab(run, oddsFor, { tab: 'ludus', open: new Set(), roomTabs: {} });
  assert.doesNotMatch(bar + ludus, /" onmouseover="alert/);
  assert.doesNotMatch(bar + ludus, /<script>x<\/script>/);
  assert.doesNotMatch(bar + ludus, /<svg onload=1>/);
  assert.doesNotMatch(bar + ludus, /javascript:alert/);

  const leg = legacyPanel({
    level: 1, xp: 0, wins: 0, careers: 1, streak: 0, bestStreak: 0, heat: '2"><img src=x>',
    achievements: [], past: [], hall: [],
  });
  assert.doesNotMatch(leg, /<img src=x>/);
});

test('audio: rejected AudioContext.resume() never triggers unhandled rejection, stopAllSounds stops nodes, noise buffer is cached, and automatic initiative skips dice', async () => {
  let createdBuffers = 0;
  let stoppedNodes = 0;
  let oscCount = 0;
  let resumeCalls = 0;
  const fakeNode = () => ({
    type: '',
    frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
    Q: { value: 1 },
    gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
    buffer: null,
    connect() { return this; },
    start() {},
    stop() { stoppedNodes += 1; },
    onended: null,
  });
  const origAudio = globalThis.AudioContext;
  const origWin = globalThis.window;
  globalThis.window = globalThis;
  globalThis.AudioContext = class FakeAudioContext {
    constructor() {
      this.state = 'suspended';
      this.currentTime = 0;
      this.sampleRate = 8000;
      this.destination = {};
    }
    resume() {
      resumeCalls += 1;
      return Promise.reject(new Error('NotAllowedError'));
    }
    createOscillator() { oscCount += 1; return fakeNode(); }
    createGain() { return fakeNode(); }
    createBiquadFilter() { return fakeNode(); }
    createBuffer(ch, len) {
      createdBuffers += 1;
      return { getChannelData: () => new Float32Array(len) };
    }
    createBufferSource() { return fakeNode(); }
  };

  let unhandled = null;
  const onUnhandled = (err) => { unhandled = err; };
  process.on('unhandledRejection', onUnhandled);
  try {
    setSound(true);
    sfx.miss();
    sfx.hit();
    sfx.hit();
    await new Promise((r) => setTimeout(r, 10));
    assert.equal(unhandled, null, 'rejected resume must be caught internally');
    assert.ok(resumeCalls >= 1);
    assert.equal(createdBuffers, 1, 'noise AudioBuffer should be cached across calls');
    stopAllSounds();
    assert.ok(stoppedNodes >= 1, 'stopAllSounds should stop scheduled nodes');

    // Automatic initiative (concussed) should not trigger dice rattle (6 oscillators)
    const beforeOsc = oscCount;
    const fakeRound = { round: 1, winner: 'A', initiative: { reason: 'concussed', first: 'A' }, checks: [] };
    roundSounds(
      { rounds: [fakeRound], over: false, result: null },
      fakeRound,
      { revealAt: 1.5, blowTimes: [] },
    );
    assert.ok(oscCount - beforeOsc < 6, 'concussed round should skip 6-click dice rattle');
    stopAllSounds();
  } finally {
    process.off('unhandledRejection', onUnhandled);
    setSound(false);
    globalThis.AudioContext = origAudio;
    globalThis.window = origWin;
  }
});

test('fightView: animated round hides post-round death/injuries/Power via r.before and reveals them via sideCardHtml; match-end delays stay chronological', () => {
  let found = null;
  for (let seed = 1; seed <= 80; seed++) {
    const a = blank({ id: 'a1', name: 'Aurelia', power: 22 });
    const b = blank({ id: 'b1', name: 'Marcus', power: 4, injuries: [{ tag: 'fleshWound', weight: 1 }, { tag: 'fleshWound', weight: 1 }] });
    const m = createMatch({ a, b, rng: createRng(seed) });
    const r = playRound(m);
    if (!m.b.f.alive && r.before?.b?.alive) {
      found = { m, r };
      break;
    }
  }
  assert.ok(found, 'found a round where opponent dies');
  const { m, r } = found;
  const timing = roundTiming(m, r, false);
  assert.ok(timing.shake > 0 && timing.reveal > 0 && timing.end > timing.reveal);

  const animated = fightView(m, { animateRound: 1, showMath: false }, { name: 'Test', tier: 1, buyIn: 1 });
  const sideBChunk = animated.split('id="side-card-B">')[1].split('</div><div class="')[0];
  assert.doesNotMatch(sideBChunk, /card kind-human dead/, 'dead class must not spoil at t=0s');
  assert.doesNotMatch(animated, /class="tag static"/, 'animated tags should animate');

  const revealedB = sideCardHtml(m, 'B', { animateRound: 1, showMath: false }, { revealed: true });
  assert.match(revealedB, /dead/, 'revealed sideCardHtml shows death');

  const still = fightView(m, { animateRound: 0, showMath: false }, { name: 'Test', tier: 1, buyIn: 1 });
  assert.match(still, /side round-(won|lost) static/, 'non-animated redraw marks side static');

  // Chronological match-end delays: banner < result < report < end-actions
  const bannerDelay = Number(animated.match(/round-banner[^"]*late" style="animation-delay:([\d.]+)s"/)?.[1]);
  const resultDelay = Number(animated.match(/result (?:win|loss) late" style="animation-delay:([\d.]+)s"/)?.[1]);
  const actionsDelay = Number(animated.match(/end-actions late" style="animation-delay:([\d.]+)s"/)?.[1]);
  assert.ok(bannerDelay < resultDelay && resultDelay < actionsDelay, `expected ${bannerDelay} < ${resultDelay} < ${actionsDelay}`);
});

test('portrait: renaming preserves face, Basa has no human ears, unlockable classes render gear, and NPC aria-label is readable', () => {
  const f = blank({ id: 'f42', name: 'Original Name', kind: 'human' });
  const before = fighterPortrait(f);
  f.name = 'Completely Different';
  const after = fighterPortrait(f);
  assert.equal(
    before.replace('Portrait of Original Name', ''),
    after.replace('Portrait of Completely Different', ''),
    'renaming a fighter should not change their generated appearance',
  );

  const basa = fighterPortrait(blank({ id: 'basa1', kind: 'basa', cls: 'samnite' }));
  assert.doesNotMatch(basa, /<ellipse cx="15" cy="33" rx="3" ry="5"/, 'Basa should not render human ears');

  const baseNoClass = fighterPortrait(blank({ id: 'cls0', kind: 'human', cls: null }));
  for (const cls of ['retiarius', 'ashHungry', 'bloodBearer', 'thornBlade', 'samnite']) {
    const svg = fighterPortrait(blank({ id: 'cls0', kind: 'human', cls }));
    assert.notEqual(svg, baseNoClass, `unlockable class ${cls} should render class gear`);
  }

  assert.match(npcPortrait('emperor'), /aria-label="Portrait of Emperor Silbannacus"/);
  assert.match(npcPortrait('steward'), /aria-label="Portrait of your steward"/);
});

test('views/codex/hints/tutorial: summonsPower, standings tier 5, Surgeon display names, Codex locked lore hiding, mercy/fight-day hints', () => {
  const run = createRun(1, { short: true });
  const f = recruit(run, run.market[0].id);
  f.injuries = [{ tag: 'concussed', weight: 1, weeksLeft: 2 }];
  run.buildings.push({ id: 'b9', type: 'medbay', level: 3 });
  run.summons = { week: run.week };
  run.houses[0].tier = 5;

  const html = ludusTab(run, () => ({ win: 0.5, injury: 0.1, death: 0 }), { tab: 'ludus', open: new Set(), roomTabs: {} });
  assert.match(html, new RegExp(`Power ${arenaPower(run, SUMMONS.tier, 0)}`), 'summons uses Season-scaled arenaPower');
  assert.match(html, new RegExp(`Surgeon: ${INJURY_BY_TAG.concussed.name} \\(\\d+ Gold\\)`), 'Surgeon uses display name and Gold');
  assert.doesNotMatch(html, /Surgeon: concussed/, 'Surgeon does not show raw injury tag');
  assert.match(html, /<td>Grand Tournament<\/td>/, 'standingsTable displays tier 5');

  const codex = createCodex();
  discover(codex, run);
  const codexHtml = codexTab(codex, ENTRIES, SECTIONS, [], progress(codex), isUnlocked, hasLore);
  assert.doesNotMatch(codexHtml, /baffled accountant/, 'locked lore must not leak into Codex data-search');

  const help = helpModal(run);
  assert.match(help, /Tournament → Boss/, 'Help reflects Season circuit');
  assert.match(GUIDE.find((s) => s.id === 'tofight').text, /⚔ To fight day/);

  run.mercy = { opp: 'Foe', crowd: 'spare', house: null };
  assert.match(nextHint(run).text, /thumbs up or down/i);
  run.mercy = null;
  run.bouts = { 1: 'done' };
  run.boutPending = false;
  run.summons = { week: run.week };
  assert.match(nextHint(run).text, /summons/i);
  run.summons = null;
  f.injuries = [];
  f.job = 'trainPower';
  assert.doesNotMatch(nextHint(run).text, /Go to fight day \(T\)/, 'do not suggest T on fight day');
});

test('play-text: summonsPower parity, no week-2 opening replay, decor labels, bracket QF/SF display & mid-bracket skip guard', () => {
  const s = createSession(1, { setup: { short: true } });
  s.run.summons = { week: s.run.week };
  const f = recruit(s.run, s.run.market[0].id);
  s.run.gold = 50;
  buyDecor(s.run, 'shrine');
  assignDecor(s.run, f.id, 'shrine');
  const firstLook = s.look();
  assert.match(firstLook, new RegExp(`Power ${arenaPower(s.run, SUMMONS.tier, 0)}`), 'play-text summons uses arenaPower');
  assert.doesNotMatch(firstLook, /Shrine of Mars ×1 \(comfort only\)/, 'Shrine should note Stress relief, not comfort only');
  assert.match(firstLook, /Shrine of Mars ×1 \(−10 Stress\/wk \+ comfort\)/);

  // Skipping intro at week 0 and looking at week 2 should not replay opening scene
  const s2 = createSession(2, { setup: { short: true } });
  s2.run.week = 2;
  const wk2Look = s2.look();
  assert.doesNotMatch(wk2Look, /Awake at last/, 'week 2 look must not replay opening monologue');

  // Legacy/Heat session should not play opening monologue
  const s3 = createSession(3, { setup: { short: true, heat: 1 } });
  assert.doesNotMatch(s3.look(), /Awake at last/, 'Heat session skips opening monologue');

  // Silver bracket QF display and mid-bracket skip guard
  const sb = createSession(4, { setup: { short: true } });
  const bf = recruit(sb.run, sb.run.market[0].id);
  bf.power = 30;
  sb.run.topTier = 3;
  sb.run.prestige = 100;
  sb.run.arenas[3] = { stage: 0, opponent: blank({ id: 'fin', name: 'Finalist', power: 25, speed: 6 }) };
  advanceToTournament(sb.run);
  const qfLook = sb.look();
  assert.match(qfLook, /Quarter-final opponent:/, 'QF opponent shown as primary block');
  assert.match(qfLook, /Speed \d+ vs \d+/, 'bout odds show opponent Speed');
  const m = startMatch(sb.run, bf.id, 3);
  sb.run.brackets[3].round = 1;
  sb.run.brackets[3].fighterId = bf.id;
  sb.run.inMatch = false;
  void m;
  const midLook = sb.look();
  assert.doesNotMatch(midLook, /Or `skip`/, 'mid-bracket must not suggest skip');
});

test('style.css: semantic danger tokens, reduced-motion hit-pop hide, 2-col room-tabs, and focus-visible', () => {
  const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  assert.match(css, /--danger:\s*#[0-9a-f]{6}/i);
  assert.match(css, /:focus-visible\s*\{/);
  assert.match(css, /\.room-tabs\s*\{[^}]*repeat\(2,\s*1fr\)/);
  assert.match(css, /\.hit-pop\s*\{\s*display:\s*none;\s*\}/);
  assert.match(css, /body\[data-house="gold"\]\s*\{[^}]*--accent:/);
  assert.doesNotMatch(css, /body\[data-house="gold"\]\s*\{[^}]*--blood:/);
  assert.match(css, /\.card\.kind-vampire/);
  assert.match(css, /\.card\.kind-basa/);
  assert.match(css, /\.card\.kind-revenant/);
});
