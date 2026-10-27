// App state, saving, coach tips and event wiring. Game rules live in run.js / fight.js; markup in src/ui/.

import { mortalDanger, canThrowTowel } from './fight.js';
import { createRun, matchOptions, serialize, deserialize } from './run.js';
import { applyGameAction, isGameAction } from './game.js';
import { buildReport } from './debug.js';
import { VERSION } from './version.js';
import { estimateOdds } from './odds.js';
import { topbar, endBanner, summaryBanner, tutorialCard, introModal, ludusTab, estateTab, marketTab, codexTab, helpModal, noticePager, nextBar, bugModal } from './ui/views.js';
import { nextHint } from './hints.js';
import { ENTRIES, SECTIONS, discover, discoverMatch, isUnlocked, hasLore, progress, loadCodex } from './codex.js';
import { INTRO, STEPS, FIGHT_STEPS, nextStep } from './tutorial.js';
import { fightView } from './ui/fightView.js';

const app = document.getElementById('app');
const fightEl = document.getElementById('fight');
const SAVE_KEY = 'bloodsport.career';
const PREFS_KEY = 'bloodsport.prefs';
const CODEX_KEY = 'bloodsport.codex';

let run = null;
let match = null;
let summaries = []; // this week's match results, newest last
let noticePage = 0;
let tab = 'ludus';
let showHelp = false;
let autoTimer = null;
const ui = { animateRound: 0, showMath: false, auto: false, open: {} }; // open: fold-outs the player opened or closed, by data-key
let prefs = { tutorial: [], showMath: false, introSeen: false };
let codex = loadCodex(null);
let codexShownNew = []; // entries highlighted as new while the Codex tab is open
let introPage = null; // index into INTRO while the intro is showing
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
  codex = loadCodex(storage.get(CODEX_KEY));
}
const saveCodex = () => storage.set(CODEX_KEY, JSON.stringify(codex));
const savePrefs = () => storage.set(PREFS_KEY, JSON.stringify(prefs));
const save = () => run && storage.set(SAVE_KEY, serialize(run));

// ---------- Odds cache (simulating is cheap but not free) ----------

const oddsCache = new Map();
function oddsFor(f, tier = run.topTier) {
  const opp = run.arenas[tier].opponent;
  const opts = matchOptions(run, f, tier);
  const key = JSON.stringify([f, opp, opts]);
  if (!oddsCache.has(key)) {
    if (oddsCache.size > 200) oddsCache.clear();
    oddsCache.set(key, estimateOdds(f, opp, { ...opts, n: 400 }));
  }
  return oddsCache.get(key);
}

// ---------- Tutorial ----------

const tutorialStep = () => (run.status === 'active' && introPage === null ? nextStep(STEPS, prefs.tutorial, run) : null);
const fightTutorial = () => (match ? nextStep(FIGHT_STEPS, prefs.tutorial, match) : null);

// ---------- Rendering ----------

function render() {
  if (discover(codex, run).length) saveCodex();
  let body;
  if (tab === 'estate') body = estateTab(run);
  else if (tab === 'market') body = marketTab(run);
  else if (tab === 'codex') body = codexTab(codex, ENTRIES, SECTIONS, codexShownNew, progress(codex), isUnlocked, hasLore);
  else body = ludusTab(run, oddsFor);
  const modal = introPage !== null ? introModal(introPage, INTRO) : showHelp ? helpModal() : '';
  // Notifications: the tutorial step first, then this week's results (newest first), one page at a time.
  const notices = [tutorialCard(tutorialStep()), ...[...summaries].reverse().map(summaryBanner)].filter(Boolean);
  noticePage = Math.min(noticePage, Math.max(0, notices.length - 1));
  app.innerHTML = `${topbar(run, tab, codex.fresh.length)}<main>${run.status !== 'active' ? endBanner(run) : ''}${nextBar(nextHint(run))}${noticePager(notices, noticePage)}${body}</main>${modal}`;
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
  fightEl.innerHTML = fightView(match, ui, match.bout, tutorialCard(fightTutorial(), 'fight'), run.inventory.items);
  const feed = document.getElementById('feed');
  if (feed) feed.scrollTop = feed.scrollHeight;
}

// Auto-play: one round every ~2.5s, pausing whenever the capitulate decision really matters.
function scheduleAuto() {
  clearTimeout(autoTimer);
  if (!ui.auto || !match || match.over) return;
  if (match.round > 0 && mortalDanger(match.a) && canThrowTowel(match)) return;
  autoTimer = setTimeout(() => guard('auto-play', () => {
    if (!match || match.over) return;
    lastAction = ['next-round'];
    act('next-round');
    ui.animateRound = match.round;
    save();
    render();
    scheduleAuto();
  }), match.round === 0 ? 300 : 3600);
}

// ---------- Careers ----------

function newRun(seed) {
  run = createRun(seed ?? undefined);
  match = null;
  summaries = [];
  tab = 'market';
  oddsCache.clear();
  if (!prefs.introSeen) introPage = 0;
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
    newRun();
  },
  'replay-seed': () => newRun(run.seed),
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
  'intro-next': () => { introPage = Math.min(INTRO.length - 1, introPage + 1); },
  'intro-back': () => { introPage = Math.max(0, introPage - 1); },
  'intro-close': () => { introPage = null; prefs.introSeen = true; savePrefs(); },
  'intro-replay': () => { introPage = 0; showHelp = false; },
  'dismiss-summary': (d) => {
    summaries = summaries.filter((s) => `${s.week}-${s.tier}-${s.fighterId}` !== d.key);
  },
  'notice-page': (d) => { noticePage = Number(d.page); },
  'auto-play': () => { ui.auto = !ui.auto; },
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
  forfeit: () => confirm('Forfeit the Boss? It costs more Imperial Favor than losing the fight.'),
  advance: () => { summaries = []; return true; },
  'advance-tournament': () => { summaries = []; return true; },
};
const after = {
  fight: () => {
    ui.animateRound = 0;
    ui.auto = false; // auto-play is per match: each fight starts paused
  },
  'next-round': () => { ui.animateRound = match?.round ?? 0; },
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
  if (name === 'new-run' || name === 'replay-seed' || name === 'bug-reload') return;
  guard('render', () => {
    save();
    render();
    scheduleAuto();
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
  if (e.key === 'Escape' && (showHelp || introPage !== null)) {
    showHelp = false;
    if (introPage !== null) actions['intro-close']();
    render();
    return;
  }
  if (introPage !== null) return;
  if (e.key === ' ' || e.key === 'Enter') {
    if (e.target.closest?.('button, summary')) return; // let focused buttons and fold-outs work as usual
    const done = match ? pressButton('#fight [data-action=next-round]') || pressButton('#fight [data-action=leave-fight]') : pressButton('#app [data-action=advance]');
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
