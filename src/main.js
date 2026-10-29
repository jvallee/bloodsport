// App state, saving, coach tips and event wiring. Game rules live in run.js / fight.js; markup in src/ui/.

import { mortalDanger, canThrowTowel, suggestTactic } from './fight.js';
import { createRun, matchOptions, serialize, deserialize, opponentFor, fightBlocker, bracketView } from './run.js';
import { applyGameAction, isGameAction } from './game.js';
import { buildReport } from './debug.js';
import { VERSION } from './version.js';
import { exportSave, importSave } from './savefile.js';
import { estimateOdds } from './odds.js';
import { topbar, endBanner, summaryBanner, tutorialCard, dialogueModal, ludusTab, estateTab, marketTab, codexTab, helpModal, noticePager, nextBar, bugModal, eventCard, setupModal, legacyPanel, achievementNotice, roomTabs } from './ui/views.js';
import { loadLegacy, checkAchievements, recordCareer, recordLegends, unlockedPatrons, unlockedClasses, decreesUnlocked } from './legacy.js';
import { nextHint } from './hints.js';
import { ENTRIES, SECTIONS, discover, discoverMatch, isUnlocked, hasLore, progress, loadCodex } from './codex.js';
import { STEPS, FIGHT_STEPS, nextStep } from './tutorial.js';
import { SCENES, dueScene } from './dialogue.js';
import { fightView, DICE_TIME, revealTime, roundEndTime } from './ui/fightView.js';
import { roundSounds, setSound, sfx } from './ui/sound.js';

const app = document.getElementById('app');
const fightEl = document.getElementById('fight');
const SAVE_KEY = 'bloodsport.career';
const PREFS_KEY = 'bloodsport.prefs';
const CODEX_KEY = 'bloodsport.codex';
const LEGACY_KEY = 'bloodsport.legacy';
const SCENES_KEY = 'bloodsport.scenes'; // dialogue scenes already played: { seed, seen: [ids] } (cosmetic, not in the career save)

let run = null;
let match = null;
let summaries = []; // this week's match results, newest last
let noticePage = 0;
let tab = 'ludus';
let showHelp = false;
let autoTimer = null;
let roundStartedAt = 0; // when the latest round began playing (auto-play waits for its story to finish, not for a fresh wait)
let keepAuto = false; // auto-play carries on into the next match of a tournament
const ui = { animateRound: 0, showMath: false, auto: false, open: {} }; // open: fold-outs the player opened or closed, by data-key
let prefs = { tutorial: [], showMath: false, introSeen: false, sound: true };
let codex = loadCodex(null);
let codexShownNew = []; // entries highlighted as new while the Codex tab is open
let scene = null; // the dialogue scene showing: { id, beat } (src/dialogue.js)
let legacy = loadLegacy(null);
let achieved = []; // achievements earned this week, shown as notices
let setupChoice = null; // the New career dialog: { patron, decrees } while it's open
// Bug reports: `bug` is null, or { error, where } (error null for a report the player asked for).
let bug = null;
let bugNotes = '';
let bugStatus = '';
let lastAction = null;

// ---------- Storage (every access guarded: private mode or blocked storage must not break the game) ----------

const storage = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
  },
};

function loadPrefs() {
  try { prefs = { ...prefs, ...JSON.parse(storage.get(PREFS_KEY) ?? '{}') }; } catch { /* keep defaults */ }
  if (!Array.isArray(prefs.tutorial)) prefs.tutorial = [];
  ui.showMath = prefs.showMath;
  setSound(prefs.sound !== false);
  codex = loadCodex(storage.get(CODEX_KEY));
  legacy = loadLegacy(storage.get(LEGACY_KEY));
}
const saveLegacy = () => storage.set(LEGACY_KEY, JSON.stringify(legacy));
const saveCodex = () => storage.set(CODEX_KEY, JSON.stringify(codex));
const savePrefs = () => storage.set(PREFS_KEY, JSON.stringify(prefs));
const save = () => run && storage.set(SAVE_KEY, serialize(run));

// ---------- Odds cache (simulating is cheap but not free) ----------

const oddsCache = new Map();
function oddsFor(f, tier = run.topTier, opp = opponentFor(run, tier)) {
  const opts = matchOptions(run, f, tier);
  const key = JSON.stringify([f, opp, opts]);
  if (!oddsCache.has(key)) {
    if (oddsCache.size > 200) oddsCache.clear();
    oddsCache.set(key, estimateOdds(f, opp, { ...opts, n: 400 }));
  }
  return oddsCache.get(key);
}

// ---------- Tutorial ----------

// The steward's tips wait for any other dialog, and for the fight screen to close.
const tutorialStep = () => (run.status === 'active' && !scene && !match && !showHelp && !setupChoice && !run.event && !run.mercy ? nextStep(STEPS, prefs.tutorial, run) : null);

// ---------- Dialogue (src/dialogue.js) ----------

function scenesSeen() {
  try {
    const s = JSON.parse(storage.get(SCENES_KEY) ?? 'null');
    return s?.seed === run.seed ? s.seen : [];
  } catch { return []; }
}
function markSceneSeen(id) {
  storage.set(SCENES_KEY, JSON.stringify({ seed: run.seed, seen: [...new Set([...scenesSeen(), id])] }));
}
// The Emperor drops in at turning points, once each per career, when nothing else is on screen.
function checkScene() {
  if (scene || match || setupChoice || showHelp || !scenesSeen().includes('opening')) return; // the Emperor's visits come after the opening
  const id = dueScene(run, scenesSeen());
  if (id) {
    markSceneSeen(id);
    scene = { id, beat: 0 };
  }
}
function closeScene() {
  const then = scene?.then;
  if (scene?.id === 'opening') { prefs.introSeen = true; savePrefs(); markSceneSeen('opening'); }
  scene = null;
  if (then === 'setup') setupChoice = { patron: '', decrees: [] }; // the opening came first; now choose a patron
}
const fightTutorial = () => (match ? nextStep(FIGHT_STEPS, prefs.tutorial, match) : null);

// ---------- Rendering ----------

function render() {
  if (discover(codex, run).length) saveCodex();
  // Legacy: achievements as they happen, and the career once it ends.
  const fresh = checkAchievements(legacy, run);
  if (fresh.length) {
    achieved.push(...fresh);
    noticePage = 0;
  }
  if (fresh.length + (recordCareer(legacy, run) ? 1 : 0) + recordLegends(legacy, run).length) saveLegacy();
  let body;
  if (tab === 'estate') body = estateTab(run);
  else if (tab === 'market') body = marketTab(run);
  else if (tab === 'codex') body = codexTab(codex, ENTRIES, SECTIONS, codexShownNew, progress(codex), isUnlocked, hasLore) + legacyPanel(legacy);
  else body = ludusTab(run, oddsFor);
  checkScene();
  const modal = setupChoice ? setupModal(legacy, setupChoice) : scene ? dialogueModal(scene.id, SCENES[scene.id], scene.beat) : showHelp ? helpModal() : tutorialCard(tutorialStep());
  // Notifications: this week's results (newest first), one page at a time. (The steward's tips open as a dialogue.)
  const notices = [...achieved.map(achievementNotice), ...[...summaries].reverse().map(summaryBanner)].filter(Boolean);
  noticePage = Math.min(noticePage, Math.max(0, notices.length - 1));
  app.innerHTML = `${topbar(run, tab, codex.fresh.length, prefs.sound !== false)}<main>${run.status !== 'active' ? endBanner(run, legacy) : ''}${nextBar(nextHint(run))}${eventCard(run)}${noticePager(notices, noticePage)}${body}</main>${modal}`;
  // Re-rendering rebuilds the page, so restore any fold-outs the player opened or closed.
  for (const d of app.querySelectorAll('details[data-key]')) if (d.dataset.key in ui.open) d.open = ui.open[d.dataset.key];
  renderFight();
}

// Run a game action (recorded for bug reports; see src/game.js) and do the page's bookkeeping.
function act(name, data = {}) {
  const state = { run, match };
  const before = match;
  try {
    const summary = applyGameAction(state, name, data);
    if (summary) {
      if (discoverMatch(codex, before ?? state.match).length) saveCodex();
      summaries.push(summary);
      noticePage = 0;
    }
  } finally {
    run = state.run;
    match = state.match;
  }
}

function renderFight() {
  if (!match) {
    fightEl.hidden = true;
    fightEl.innerHTML = '';
    return;
  }
  fightEl.hidden = false;
  const nextBlocker = match.summary?.next ? fightBlocker(run, match.a.f.id, match.bout.tier) : null;
  fightEl.innerHTML = fightView(match, ui, match.bout, tutorialCard(fightTutorial(), 'fight'), run.inventory.items, nextBlocker, run.mercy, bracketView(run, match.bout.tier));
  const feed = document.getElementById('feed');
  if (feed) feed.scrollTop = feed.scrollHeight;
}

// Auto-play: one round after another (each once its winner is announced), pausing whenever the capitulate decision really matters.
function scheduleAuto() {
  clearTimeout(autoTimer);
  if (!ui.auto || !match || match.over) return;
  if (match.round > 0 && mortalDanger(match.a) && canThrowTowel(match)) return;
  autoTimer = setTimeout(() => guard('auto-play', () => {
    if (!match || match.over) return;
    const stance = suggestTactic(match);
    lastAction = ['next-round', { stance }];
    act('next-round', { stance });
    roundStartedAt = Date.now();
    ui.animateRound = match.round;
    roundSounds(match, match.rounds.at(-1), { diceTime: DICE_TIME, revealAt: revealTime(match, match.rounds.at(-1), ui.showMath) });
    save();
    render();
    scheduleAuto();
  }), match.round === 0 ? 300 : Math.max(300, roundStartedAt + (roundEndTime(match, match.rounds.at(-1), ui.showMath) + 1.5) * 1000 - Date.now())); // let the round sink in
}

// ---------- Careers ----------

// `opening: false` when the opening has just played (before the patron choice).
function newRun(seed, setup = { classes: unlockedClasses(legacy) }, { opening = true } = {}) {
  run = createRun(seed ?? undefined, setup);
  achieved = [];
  setupChoice = null;
  match = null;
  summaries = [];
  tab = 'market';
  oddsCache.clear();
  scene = opening ? { id: 'opening', beat: 0 } : null; // every career opens with the Emperor pulling you through (skippable)
  if (!opening) markSceneSeen('opening');
  const url = new URL(location.href);
  url.searchParams.set('seed', run.seed);
  history.replaceState(null, '', url);
  save();
  render();
}

function boot() {
  loadPrefs();
  const saved = storage.get(SAVE_KEY);
  const urlSeed = Number(new URLSearchParams(location.search).get('seed'));
  if (saved) {
    try {
      run = deserialize(saved);
      tab = run.roster.length ? 'ludus' : 'market';
      // A career under way has had its opening; a brand-new one (nothing done yet) still gets it.
      if (!scenesSeen().includes('opening')) {
        if (run.week > 0 || run.roster.length) markSceneSeen('opening');
        else scene = { id: 'opening', beat: 0 };
      }
      save();
      render();
      return;
    } catch (err) {
      console.warn('Could not load the saved career:', err.message);
    }
  }
  newRun(Number.isInteger(urlSeed) && urlSeed > 0 ? urlSeed : null);
}

// ---------- Events ----------

const actions = {
  'new-run': () => {
    if (run.status === 'active' && run.week > 0 && !confirm('Abandon this career and start a new one?')) return;
    // Once a past career has unlocked something, choose a patron and decrees first.
    // The opening plays first, then the patron and decree choice, then the career (without a second opening).
    if (unlockedPatrons(legacy).length || decreesUnlocked(legacy)) {
      scene = { id: 'opening', beat: 0, then: 'setup' };
      render();
    } else {
      newRun();
    }
  },
  'start-career': () => {
    const patron = document.querySelector('input[name=patron]:checked')?.value || null;
    const decrees = [...document.querySelectorAll('input[name=decree]:checked')].map((i) => i.value);
    newRun(null, { patron, decrees, classes: unlockedClasses(legacy) }, { opening: false });
  },
  'setup-cancel': () => { setupChoice = null; },
  'replay-seed': () => newRun(run.seed, run.setup),
  tab: (d) => {
    tab = d.tab;
    showHelp = false;
    if (tab === 'codex') {
      codexShownNew = [...codex.fresh];
      codex.fresh = [];
      saveCodex();
    }
  },
  help: () => { showHelp = !showHelp; },
  'tutorial-done': (d) => { prefs.tutorial.push(d.step); savePrefs(); },
  'tutorial-skip': () => { prefs.tutorial = [...STEPS, ...FIGHT_STEPS].map((s) => s.id); savePrefs(); },
  'tutorial-replay': () => { prefs.tutorial = []; showHelp = false; savePrefs(); },
  'scene-next': () => { if (scene && scene.beat < SCENES[scene.id].length - 1) scene.beat += 1; else closeScene(); },
  'scene-skip': () => closeScene(),
  'intro-replay': () => { scene = { id: 'opening', beat: 0 }; showHelp = false; },
  'dismiss-summary': (d) => {
    summaries = summaries.filter((s) => `${s.week}-${s.tier}-${s.fighterId}` !== d.key);
  },
  'notice-page': (d) => { noticePage = Number(d.page); },
  'auto-play': () => { ui.auto = !ui.auto; },
  'room-tab': (d) => { roomTabs[d.id] = d.tab; },
  'export-save': () => {
    const blob = new Blob([exportSave({ run, codex, legacy, version: VERSION })], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bloodsport-save-${run.seed}-week${run.week}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  'import-save': () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const data = importSave(await file.text());
        if (!confirm('Load this save? It replaces your current career.')) return;
        storage.set(SAVE_KEY, data.career);
        storage.set(CODEX_KEY, JSON.stringify(data.codex));
        storage.set(LEGACY_KEY, JSON.stringify(data.legacy));
        location.reload();
      } catch (err) {
        alert(err.message);
      }
    };
    input.click();
  },
  'toggle-sound': () => {
    prefs.sound = prefs.sound === false;
    setSound(prefs.sound);
    savePrefs();
    if (prefs.sound) sfx.event();
  },
  'toggle-math': () => {
    ui.animateRound = 0; // switching views shouldn't replay the dice
    ui.showMath = !ui.showMath;
    prefs.showMath = ui.showMath;
    savePrefs();
  },
  'bug-open': () => { bug = { error: null, where: null }; bugStatus = ''; showHelp = false; },
  'bug-close': () => { bug = null; bugStatus = ''; },
  'bug-copy': () => copyReport(),
  'bug-download': () => downloadReport(),
  'bug-reload': () => location.reload(),
};

// Game actions: the page's extras around each one (confirmations, animation, tabs).
const before = {
  release: () => confirm('Release this fighter for good?'),
  retire: () => confirm('Retire this fighter to the Hall of Champions? They leave your roster for good.'),
  forfeit: () => confirm('Forfeit the Boss? It costs more Imperial Favour than losing the fight.'),
  withdraw: () => confirm('Withdraw from the tournament? It counts as capitulating; your fighter is safe.'),
  advance: () => { summaries = []; achieved = []; return true; },
  'advance-tournament': () => { summaries = []; achieved = []; return true; },
  fight: () => { keepAuto = ui.auto && Boolean(match?.summary?.next); return true; },
};
const after = {
  fight: () => {
    ui.animateRound = 0;
    ui.auto = keepAuto; // each fight starts paused, except the next match of a tournament you were auto-playing
    keepAuto = false;
  },
  'next-round': () => {
    roundStartedAt = Date.now();
    ui.animateRound = match?.round ?? 0;
    if (match?.rounds.length) roundSounds(match, match.rounds.at(-1), { diceTime: DICE_TIME, revealAt: revealTime(match, match.rounds.at(-1), ui.showMath) });
  },
  'event-choice': () => { sfx.event(); },
  mercy: () => { sfx.cheer(0); },
  withdraw: () => {
    match = null; // the withdrawal is settled: leave the fight screen
    ui.auto = false;
    tab = 'ludus';
  },
  'leave-fight': () => {
    ui.auto = false;
    tab = 'ludus';
    window.scrollTo(0, 0);
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const name = el.dataset.action;
  if (!actions[name] && !isGameAction(name)) return;
  const data = { ...el.dataset };
  delete data.action;
  guard('action', () => {
    try {
      if (name !== 'next-round') ui.animateRound = 0; // only a new round plays its animation (not items, toggles...)
      if (isGameAction(name)) {
        if (before[name] && !before[name]()) return;
        lastAction = [name, data];
        act(name, data);
        after[name]?.();
      } else {
        actions[name](data);
      }
    } catch (err) {
      if (err.name !== 'Refused') throw err; // a real bug: the report box takes over
      alert(err.message);
    }
  });
  if (name === 'new-run' || name === 'replay-seed' || name === 'start-career' || name === 'bug-reload') return;
  guard('render', () => {
    save();
    render();
    scheduleAuto();
  });
});

// Dropdowns (gear): choosing an option runs the action, like a button would.
document.addEventListener('change', (e) => {
  const el = e.target.closest?.('select[data-change]');
  if (!el || el.value === '') return;
  const name = el.dataset.change;
  const data = { id: el.dataset.id, index: el.value };
  guard('action', () => {
    try {
      lastAction = [name, data];
      act(name, data);
    } catch (err) {
      if (err.name !== 'Refused') throw err;
      alert(err.message);
    }
  });
  guard('render', () => {
    save();
    render();
  });
});

// The bug report box keeps what the tester types across re-renders.
document.addEventListener('input', (e) => {
  if (e.target.id === 'bug-notes') bugNotes = e.target.value;
});

document.addEventListener('toggle', (e) => {
  if (e.target.matches?.('details[data-key]')) ui.open[e.target.dataset.key] = e.target.open;
}, true);

// Keyboard shortcuts: Space = the main action (next round / leave the fight / end the week),
// T = skip to the tournament, 1–4 = tabs, ? = How to play, Escape = close dialogs.
const pressButton = (selector) => {
  const b = document.querySelector(selector);
  if (b && !b.disabled) b.click();
  return Boolean(b && !b.disabled);
};

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input, textarea, select')) return;
  if (e.key === 'Escape' && (showHelp || scene)) {
    showHelp = false;
    if (scene) closeScene();
    render();
    return;
  }
  if (scene) { // a character is talking: Space or Enter goes on
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); actions['scene-next'](); render(); }
    return;
  }
  if (e.key === ' ' || e.key === 'Enter') {
    if (e.target.closest?.('button, summary')) return; // let focused buttons and fold-outs work as usual
    const done = match ? pressButton('#fight [data-action=next-round].primary') || pressButton('#fight [data-action=next-round]') || pressButton('#fight [data-action=leave-fight]') : pressButton('#app [data-action=advance]');
    if (done) e.preventDefault();
  } else if ((e.key === 't' || e.key === 'T') && !match) pressButton('#app [data-action=advance-tournament]');
  else if (/^[1-4]$/.test(e.key) && !match) pressButton(`#app [data-action=tab][data-tab=${['ludus', 'estate', 'market', 'codex'][Number(e.key) - 1]}]`);
  else if (e.key === '?') pressButton('#app [data-action=help]');
});


// ---------- Bug reports ----------

const bugEl = document.createElement('div');
bugEl.id = 'bug';
document.body.appendChild(bugEl);

function reportText() {
  const report = buildReport(run, match, bug?.error ?? null, {
    version: VERSION, time: new Date().toISOString(), url: location.href, userAgent: navigator.userAgent,
    notes: bugNotes, lastAction, where: bug?.where ?? null,
  });
  return JSON.stringify(report, null, 1);
}

function copyReport() {
  const text = reportText();
  const done = () => { bugStatus = 'Copied. Paste it into a message to the developer.'; renderBug(); };
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, () => downloadReport());
  else downloadReport();
}

function downloadReport() {
  const blob = new Blob([reportText()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `bloodsport-bug-${run?.seed ?? 'x'}-week${run?.week ?? 0}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  bugStatus = 'Downloaded. Send the file to the developer.';
  renderBug();
}

// Drawn on its own, so it still works when the main page fails to render.
function renderBug() {
  bugEl.innerHTML = bug ? bugModal({ crashed: Boolean(bug.error), message: bug.error?.message ?? '', notes: bugNotes, status: bugStatus, version: VERSION }) : '';
}

function crash(err, where) {
  console.error(err);
  clearTimeout(autoTimer);
  if (bug?.error) return; // keep the first error: later ones are usually knock-on effects
  bug = { error: err, where };
  bugStatus = '';
  try { renderBug(); } catch (e) { console.error(e); }
}

// Run page code; anything thrown opens the bug report box.
function guard(where, fn) {
  try {
    fn();
    renderBug();
  } catch (err) {
    crash(err, where);
  }
}

window.addEventListener('error', (e) => crash(e.error ?? new Error(e.message), 'window'));
window.addEventListener('unhandledrejection', (e) => crash(e.reason instanceof Error ? e.reason : new Error(String(e.reason)), 'window'));

guard('boot', boot);
