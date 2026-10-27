// App state, saving, coach tips and event wiring. Game rules live in run.js / fight.js; markup in src/ui/.

import { STRESS } from './data.js';
import { playRound, throwTowel, mortalDanger, canThrowTowel } from './fight.js';
import {
  createRun, boutFor, recruit, release, setJob, advanceWeek, advanceToTournament, buyDecor, surgeon, choosePerk, matchOptions, buildRoom,
  assignDecor, removeDecor, buyGear, equip, unequip,
  startMatch, finishMatch, skipBout, forfeitBout, serialize, deserialize, recordMatchProgress,
} from './run.js';
import { upgrade } from './ludus.js';
import { estimateOdds } from './odds.js';
import { topbar, endBanner, summaryBanner, tutorialCard, introModal, ludusTab, estateTab, marketTab, codexTab, helpModal, noticePager } from './ui/views.js';
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
const ui = { animateRound: 0, showMath: false, auto: false };
let prefs = { tutorial: [], showMath: false, introSeen: false };
let codex = loadCodex(null);
let codexShownNew = []; // entries highlighted as new while the Codex tab is open
let introPage = null; // index into INTRO while the intro is showing

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
  app.innerHTML = `${topbar(run, tab, codex.fresh.length)}<main>${run.status !== 'active' ? endBanner(run) : ''}${noticePager(notices, noticePage)}${body}</main>${modal}`;
  renderFight();
}

// A finished match is settled at once, so the fight screen can show the full report.
function afterRound() {
  if (!match) return;
  recordMatchProgress(run, match);
  if (match.over && !match.summary) {
    if (discoverMatch(codex, match).length) saveCodex();
    match.summary = finishMatch(run, match);
    summaries.push(match.summary);
    noticePage = 0;
  }
}

function renderFight() {
  if (!match) {
    fightEl.hidden = true;
    fightEl.innerHTML = '';
    return;
  }
  fightEl.hidden = false;
  fightEl.innerHTML = fightView(match, ui, match.bout, tutorialCard(fightTutorial(), 'fight'));
  const feed = document.getElementById('feed');
  if (feed) feed.scrollTop = feed.scrollHeight;
}

// Auto-play: one round every ~2.5s, pausing whenever the towel decision really matters.
function scheduleAuto() {
  clearTimeout(autoTimer);
  if (!ui.auto || !match || match.over) return;
  if (match.round > 0 && mortalDanger(match.a) && canThrowTowel(match)) return;
  autoTimer = setTimeout(() => {
    if (!match || match.over) return;
    ui.animateRound = playRound(match).round;
    afterRound();
    save();
    render();
    scheduleAuto();
  }, match.round === 0 ? 300 : 3600);
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
  recruit: (d) => recruit(run, d.id),
  release: (d) => { if (confirm('Release this fighter for good?')) release(run, d.id); },
  job: (d) => setJob(run, d.id, d.job),
  'buy-decor': (d) => buyDecor(run, d.item),
  'assign-decor': (d) => assignDecor(run, d.id, d.item),
  'remove-decor': (d) => removeDecor(run, d.id, d.item),
  'buy-gear': (d) => buyGear(run, Number(d.index)),
  equip: (d) => equip(run, d.id, Number(d.index)),
  unequip: (d) => unequip(run, d.id, d.slot),
  perk: (d) => choosePerk(run, d.id, d.perk),
  surgeon: (d) => surgeon(run, d.id, Number(d.index)),
  build: (d) => buildRoom(run, d.type),
  upgrade: (d) => upgrade(run, d.id),
  advance: () => { summaries = []; advanceWeek(run); },
  'advance-tournament': () => { summaries = []; advanceToTournament(run); },
  skip: () => skipBout(run),
  forfeit: () => { if (confirm('Forfeit the Boss? It costs more Imperial Favor than losing the fight.')) forfeitBout(run); },
  fight: (d) => {
    const tier = Number(d.tier) || run.topTier;
    const bout = boutFor(run, tier); // snapshot before the match changes the arena
    match = startMatch(run, d.id, tier);
    match.bout = bout;
    ui.animateRound = 0;
  },
  'next-round': () => {
    ui.animateRound = playRound(match).round;
    afterRound();
  },
  towel: () => {
    throwTowel(match);
    afterRound();
  },
  'auto-play': () => { ui.auto = !ui.auto; },
  'toggle-math': () => {
    ui.showMath = !ui.showMath;
    prefs.showMath = ui.showMath;
    savePrefs();
  },
  'leave-fight': () => {
    afterRound(); // settles the match if it somehow isn't yet
    match = null;
    tab = 'ludus';
    window.scrollTo(0, 0);
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const handler = actions[el.dataset.action];
  if (!handler) return;
  try {
    handler(el.dataset);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
  if (el.dataset.action === 'new-run' || el.dataset.action === 'replay-seed') return;
  save();
  render();
  scheduleAuto();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && (showHelp || introPage !== null)) {
    showHelp = false;
    if (introPage !== null) actions['intro-close']();
    render();
  }
});

boot();
