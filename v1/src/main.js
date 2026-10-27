// App state, saving, coach tips and event wiring. Game rules live in run.js / fight.js; markup in src/ui/.

import { STRESS } from './data.js';
import { playRound, throwTowel, mortalDanger, canThrowTowel } from './fight.js';
import {
  createRun, currentBout, recruit, release, setJob, advanceWeek, advanceToTournament, buyDecor, surgeon,
  startMatch, finishMatch, skipBout, forfeitBout, serialize, deserialize,
} from './run.js';
import { build, upgrade } from './ludus.js';
import { estimateOdds } from './odds.js';
import { topbar, endBanner, summaryBanner, tipBanner, ludusTab, estateTab, marketTab, helpModal } from './ui/views.js';
import { fightView } from './ui/fightView.js';

const app = document.getElementById('app');
const fightEl = document.getElementById('fight');
const SAVE_KEY = 'bloodsport.v1.career'; // separate from the live game's save
const PREFS_KEY = 'bloodsport.v1.prefs';

let run = null;
let match = null;
let lastSummary = null;
let tab = 'ludus';
let showHelp = false;
let autoTimer = null;
const ui = { animateRound: 0, showMath: false, auto: false };
let prefs = { tips: [], showMath: false };

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
  ui.showMath = prefs.showMath;
}
const savePrefs = () => storage.set(PREFS_KEY, JSON.stringify(prefs));
const save = () => run && storage.set(SAVE_KEY, serialize(run));

// ---------- Odds cache (simulating is cheap but not free) ----------

const oddsCache = new Map();
function oddsFor(f) {
  const bout = currentBout(run);
  const key = JSON.stringify([f, run.opponent.id, bout.debuff, f.stress >= STRESS.overtrained]);
  if (!oddsCache.has(key)) {
    if (oddsCache.size > 200) oddsCache.clear();
    oddsCache.set(key, estimateOdds(f, run.opponent, { debuff: bout.debuff, overtrained: f.stress >= STRESS.overtrained, n: 400 }));
  }
  return oddsCache.get(key);
}

// ---------- Coach tips: one at a time, shown once ----------

const TIPS = [
  { id: 'recruit', when: (r) => !r.roster.length, text: 'Welcome, Lanista. Start by recruiting two gladiators in the <b>Market</b> tab. Orcs are sturdy; hover over any trait to see what it does.' },
  { id: 'jobs', when: (r) => r.roster.length > 0 && !r.boutPending && r.week < 3, text: 'Give each fighter a <b>weekly job</b>, then press <b>End week</b>. Training raises a stat but adds Stress. Rest them the week before a fight.' },
  { id: 'bout', when: (r) => r.boutPending, text: '<b>Fight day!</b> Check each fighter\'s odds, then send one. Tournaments 1 and 2 can be skipped; Bosses can\'t.' },
  { id: 'injury', when: (r) => r.roster.some((f) => f.injuries.length), text: 'Injuries stay until healed. Put the fighter in the <b>Medbay</b> job. Two injuries open the <b>Death Gate</b>.' },
  { id: 'stress', when: (r) => r.roster.some((f) => f.stress >= STRESS.overtrained), text: 'A fighter is <b>overtrained</b> (Stress 50+): they can\'t train, and they\'d fight at −1 Power with an ability lost. Let them Rest.' },
  { id: 'estate', when: (r) => r.prestigeLevel >= 2, text: 'Your house grew! New <b>plots</b> and buildings are open in the <b>Estate</b> tab.' },
];
const currentTip = () => (run.status === 'active' ? TIPS.find((t) => !prefs.tips.includes(t.id) && t.when(run)) : null);

// ---------- Rendering ----------

function render() {
  let body;
  if (tab === 'estate') body = estateTab(run);
  else if (tab === 'market') body = marketTab(run);
  else body = ludusTab(run, oddsFor);
  app.innerHTML = `${topbar(run, tab)}<main>${run.status !== 'active' ? endBanner(run) : ''}${summaryBanner(lastSummary)}${tipBanner(currentTip())}${body}</main>${showHelp ? helpModal() : ''}`;
  renderFight();
}

function renderFight() {
  if (!match) {
    fightEl.hidden = true;
    fightEl.innerHTML = '';
    return;
  }
  fightEl.hidden = false;
  fightEl.innerHTML = fightView(match, ui, currentBout(run));
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
    save();
    renderFight();
    scheduleAuto();
  }, match.round === 0 ? 300 : 2600);
}

// ---------- Careers ----------

function newRun(seed) {
  run = createRun(seed ?? undefined);
  match = null;
  lastSummary = null;
  tab = 'market';
  oddsCache.clear();
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
  tab: (d) => { tab = d.tab; },
  help: () => { showHelp = !showHelp; },
  'dismiss-tip': (d) => { prefs.tips.push(d.tip); savePrefs(); },
  'dismiss-summary': () => { lastSummary = null; },
  recruit: (d) => recruit(run, d.id),
  release: (d) => { if (confirm('Release this fighter for good?')) release(run, d.id); },
  job: (d) => setJob(run, d.id, d.job),
  decor: (d) => buyDecor(run, d.id, d.item),
  surgeon: (d) => surgeon(run, d.id, Number(d.index)),
  build: (d) => build(run, d.type),
  upgrade: (d) => upgrade(run, d.id),
  advance: () => { lastSummary = null; advanceWeek(run); },
  'advance-tournament': () => { lastSummary = null; advanceToTournament(run); },
  skip: () => skipBout(run),
  forfeit: () => { if (confirm('Forfeit the Boss? You get an Imperial Strike.')) forfeitBout(run); },
  fight: (d) => {
    match = startMatch(run, d.id);
    ui.animateRound = 0;
  },
  'next-round': () => { ui.animateRound = playRound(match).round; },
  towel: () => throwTowel(match),
  'auto-play': () => { ui.auto = !ui.auto; },
  'toggle-math': () => {
    ui.showMath = !ui.showMath;
    prefs.showMath = ui.showMath;
    savePrefs();
  },
  'leave-fight': () => {
    lastSummary = finishMatch(run, match);
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
  if (e.key === 'Escape' && showHelp) {
    showHelp = false;
    render();
  }
});

boot();
