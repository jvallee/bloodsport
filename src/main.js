// App state, saving, coach tips and event wiring. Game rules live in run.js / fight.js; markup in src/ui/.

import { mortalDanger, canThrowTowel, suggestTactic, hypeOf } from './fight.js';
import { createRun, matchOptions, serialize, deserialize, opponentFor, fightBlocker, bracketView, betOdds, betCap, spareFavorWhy, owedLeft, keepsBuyIn, overtrainedByWeek, demandMet } from './run.js';
import { applyGameAction, isGameAction } from './game.js';
import { buildReport } from './debug.js';
import { VERSION } from './version.js';
import { exportSave, importSave } from './savefile.js';
import { loadIndex, saveCareer, loadCareerText, removeCareer, newCareerBlocker, freshId, scenesKey } from './careers.js';
import { estimateOdds } from './odds.js';
import { topbar, endBanner, summaryBanner, tutorialCard, dialogueModal, resultModal, guideBar, stewardNote, today, ludusTab, estateTab, marketTab, codexTab, helpModal, noticePager, nextBar, bugModal, eventCard, fortunePanel, fortuneDealKey, setupModal, careersModal, overtrainModal, legacyPanel, achievementNotice, roomTabs } from './ui/views.js';
import { loadLegacy, checkAchievements, recordCareer, recordLegends, dailySeed, dailySetup, careerSetup } from './legacy.js';
import { nextHint } from './hints.js';
import { ENTRIES, SECTIONS, discover, discoverMatch, isUnlocked, hasLore, progress, loadCodex } from './codex.js';
import { GUIDE, STEPS, FIGHT_STEPS, nextStep } from './tutorial.js';
import { SCENES, dueScene, dueRebel, rebelScene, dueRebelStage, newsSnapshot, stewardNews, demandMetScene, demandMissedScene } from './dialogue.js';
import { DEMANDS, DEMAND, CIRCUITS, SUMMONS } from './data.js';
import { snapshot, monthDigest } from './digest.js';
import { fightView, DICE_TIME, revealTime, roundEndTime } from './ui/fightView.js';
import { roundSounds, setSound, sfx } from './ui/sound.js';

const app = document.getElementById('app');
const fightEl = document.getElementById('fight');
const PREFS_KEY = 'bloodsport.prefs';
const CODEX_KEY = 'bloodsport.codex';
const LEGACY_KEY = 'bloodsport.legacy';
// Dialogue scenes already played are kept per career (scenesKey), outside the career save (cosmetic).

let run = null;
let careers = { active: null, list: [] }; // every saved career (src/careers.js); careerId is the one being played
let careerId = null;
let careersOpen = false; // the Careers dialog
let overtrainWarn = null; // End week would overtrain these fighters: [{ id, name, stress }] (asked every time)
let match = null;
let summaries = []; // this week's match results, newest last
let noticePage = 0;
let tab = 'ludus';
let showHelp = false;
let autoTimer = null;
let roundStartedAt = 0; // when the latest round began playing (auto-play waits for its story to finish, not for a fresh wait)
const ui = { animateRound: 0, showMath: false, auto: false, open: {} }; // open: fold-outs the player opened or closed, by data-key
let prefs = { tutorial: [], showMath: false, introSeen: false, sound: true };
let codex = loadCodex(null);
let codexShownNew = []; // entries highlighted as new while the Codex tab is open
let scene = null; // the dialogue scene showing: { id, beat } (src/dialogue.js)
let stewardNotes = []; // the steward's news this week (new buildings, new stock): notes at the top, cleared each week
let scrollAfterRender = null; // a selector to bring into view after the next render
let monthBefore = null; // before To fight day: { snap, mark } for the month's digest
let eventResult = null; // after an event card's choice: { title, lines } shown in a popup
let logMark = 0; // the house log's length before an event choice
let legacy = loadLegacy(null);
let achieved = []; // achievements earned this week, shown as notices
let setupChoice = null; // the New career dialog: { patron, heat, colour } while it's open
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
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
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
const save = () => run && careerId && saveCareer(storage, careers, careerId, run, Date.now());

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

// The tutorial month (GUIDE): the steward's current step, done the moment its goal is met.
function guideStep() {
  if (run.status !== 'active' || scene) return null;
  for (;;) {
    const step = nextStep(GUIDE, prefs.tutorial, run);
    if (!step || !step.goal(run)) return step;
    prefs.tutorial.push(step.id);
    savePrefs();
  }
}
// The steward's tips wait for the tutorial month, any other dialog, and for the fight screen to close.
const tutorialStep = () => (run.status === 'active' && !scene && !match && !showHelp && !setupChoice && !run.event && !run.mercy && !guideStep() ? nextStep(STEPS, prefs.tutorial, run) : null);

// ---------- Dialogue (src/dialogue.js) ----------

function scenesSeen() {
  try {
    const seen = JSON.parse(storage.get(scenesKey(careerId)) ?? '[]');
    return Array.isArray(seen) ? seen : [];
  } catch { return []; }
}
function markSceneSeen(id) {
  storage.set(scenesKey(careerId), JSON.stringify([...new Set([...scenesSeen(), id])]));
}
// A talk beat (src/run.js talk) with its fighter's name and face; a fighter no longer in the house still speaks, by name.
function talkBeat(b) {
  if (!b.fighterId) return { speaker: b.speaker, text: b.text };
  const f = run.roster.find((x) => x.id === b.fighterId) ?? run.fallen.find((x) => x.id === b.fighterId) ?? (run.retired ?? []).find((x) => x.id === b.fighterId);
  return f?.kind ? { speaker: 'fighter', fighter: { ...f, injuries: f.injuries ?? [] }, text: b.text } : { speaker: 'narrator', text: f ? `${f.name}: "${b.text}"` : b.text };
}
// The Emperor drops in at turning points, once each per career, when nothing else is on screen.
function checkScene() {
  if (scene || eventResult || match || setupChoice || showHelp || !scenesSeen().includes('opening')) return; // the Emperor's visits come after the opening
  // The Emperor's demand met, the moment it is; and missed, when its fight day ends (the designer, 5.4.0).
  if (run.demand && demandMet(run) && !scenesSeen().includes(`demand-met-${run.demand.week}`)) {
    markSceneSeen(`demand-met-${run.demand.week}`);
    scene = { id: 'demand-met', beat: 0, beats: demandMetScene(DEMANDS[run.demand.id].goal, DEMAND.favor, DEMAND.goldPerTier * Math.min(run.topTier, CIRCUITS.length)) };
    return;
  }
  const judged = run.demandResult;
  if (judged && !judged.met && !scenesSeen().includes(`demand-missed-${judged.issued}`)) {
    markSceneSeen(`demand-missed-${judged.issued}`);
    scene = { id: 'demand-missed', beat: 0, beats: demandMissedScene(DEMANDS[judged.id].goal, judged.favor) };
    return;
  }
  // Quests and rivals (5.4.0): what the rules said someone says (run.talk), each once per career.
  const said = (run.talk ?? []).find((t) => !scenesSeen().includes(`talk-${t.key}`));
  if (said) {
    markSceneSeen(`talk-${said.key}`);
    scene = { id: 'talk', beat: 0, beats: said.beats.map(talkBeat) };
    return;
  }
  // A new demand from the Emperor (fun idea #4): he says it himself.
  const demandKey = run.demand ? `demand-${run.demand.week}` : null;
  if (demandKey && !scenesSeen().includes(demandKey)) {
    markSceneSeen(demandKey);
    scene = { id: 'demand', beat: 0, beats: [{ speaker: 'emperor', text: DEMANDS[run.demand.id].say }, { speaker: 'steward', text: `The Emperor's demand: ${DEMANDS[run.demand.id].goal}, by the end of this month's fight day. Meet it and he pays in Favour and Gold; miss it and he remembers.` }] };
    return;
  }
  // The first political prisoner tells you about the rising, coloured by your record (src/dialogue.js).
  const rebel = dueRebel(run, scenesSeen());
  if (rebel) {
    markSceneSeen('rebel');
    scene = { id: 'rebel', beat: 0, beats: rebelScene(run, rebel) };
    return;
  }
  // ...and speaks again as the rising grows (one scene per plot stage).
  const stage = dueRebelStage(run, scenesSeen());
  if (stage) {
    markSceneSeen(stage.id);
    scene = { id: stage.id, beat: 0, beats: stage.beats };
    return;
  }
  const id = dueScene(run, scenesSeen());
  if (id) {
    markSceneSeen(id);
    scene = { id, beat: 0 };
  }
}
// A scene's beats, with any reply you chose spliced in.
const sceneBeats = () => scene.beats ?? SCENES[scene.id];
function closeScene() {
  const then = scene?.then;
  if (scene?.id === 'opening') { prefs.introSeen = true; savePrefs(); markSceneSeen('opening'); }
  scene = null;
  if (then === 'setup') setupChoice = { patron: '', heat: 0, colour: run.setup?.colour ?? 'crimson' }; // the opening came first; now choose a patron
}
const fightTutorial = () => (match ? nextStep(FIGHT_STEPS, prefs.tutorial, match) : null);

// ---------- Rendering ----------

let renderedTab = null; // the tab the page last drew (scroll positions carry over only within it)
let dealtHand = null; // the Fortune hand last drawn (fortuneDealKey): only a new hand animates in
let clickAnchor = null; // the card a click or choice came from, and where it was on screen: { id, top, tab }
// Before any click or dropdown choice is handled (capture phase), remember the fighter card it was on.
for (const type of ['click', 'change']) {
  document.addEventListener(type, (e) => {
    const card = e.target.closest?.('[id^="card-"]');
    clickAnchor = card ? { id: card.id, top: card.getBoundingClientRect().top, tab } : null;
    setTimeout(() => { clickAnchor = null; }); // only for the render this event causes, never a later one
  }, true);
}
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
  const guide = guideStep();
  const modal = careersOpen ? careersModal(careers, careerId) : overtrainWarn ? overtrainModal(overtrainWarn) : setupChoice ? setupModal(legacy, setupChoice) : scene ? dialogueModal(scene.id, sceneBeats(), scene.beat) : eventResult ? resultModal(eventResult.title, eventResult.lines) : showHelp ? helpModal() : tutorialCard(tutorialStep());
  // Notifications: this week's results (newest first), one page at a time. (The steward's tips open as a dialogue.)
  const notices = [...stewardNotes.map(stewardNote), ...achieved.map(achievementNotice), ...[...summaries].reverse().map(summaryBanner)].filter(Boolean);
  noticePage = Math.min(noticePage, Math.max(0, notices.length - 1));
  // Panels that scroll on their own (the Ludus columns, the logs) keep their place across re-renders on the same tab
  // (the designer: clicking in Your gladiators jumped its column back to the top).
  const SCROLLERS = '.grid > .panel, .log, .feed';
  // Keyed by class and place among elements of that class, so a scroller appearing or vanishing doesn't shift the others.
  const scrollKeys = () => {
    const seen = {};
    return [...app.querySelectorAll(SCROLLERS)].map((el) => {
      const c = [...el.classList].slice(0, 2).join('.'); // e.g. panel.bout, whether or not it's "live" this week
      seen[c] = (seen[c] ?? 0) + 1;
      return [`${c}#${seen[c]}`, el];
    });
  };
  const scrolled = renderedTab === tab ? Object.fromEntries(scrollKeys().map(([k, el]) => [k, el.scrollTop])) : {};
  renderedTab = tab;
  // The Fortune cards deal in once per hand, not on every redraw (the designer: each dialogue Next replayed it).
  const fortune = fortunePanel(run, { animate: fortuneDealKey(run) !== dealtHand });
  if (fortune) dealtHand = fortuneDealKey(run);
  document.body.dataset.house = run.setup?.colour ?? ''; // version 6: the house colour (a Legacy unlock)
  app.innerHTML = `${topbar(run, tab, codex.fresh.length, prefs.sound !== false)}<main>${run.status !== 'active' ? endBanner(run, legacy) : ''}${guide ? guideBar(guide, tab === guide.tab, run) : nextBar(nextHint(run))}${eventCard(run)}${fortune}${noticePager(notices, noticePage)}${body}</main>${modal}`;
  // Re-rendering rebuilds the page, so restore any fold-outs the player opened or closed.
  for (const d of app.querySelectorAll('details[data-key]')) if (d.dataset.key in ui.open) d.open = ui.open[d.dataset.key];
  for (const [k, el] of scrollKeys()) if (scrolled[k]) el.scrollTop = scrolled[k];
  // Then keep the card you clicked where it was on screen: a line appearing on a card above it (a notice, a reason) would
  // otherwise push it away from the pointer (the designer: the Ludus still jumped when clicking).
  if (clickAnchor && renderedTab === clickAnchor.tab) {
    const el = document.getElementById(clickAnchor.id);
    const shift = el ? el.getBoundingClientRect().top - clickAnchor.top : 0;
    if (shift) {
      const box = el.closest(SCROLLERS);
      if (box && box.scrollHeight > box.clientHeight) box.scrollTop += shift;
      else window.scrollBy(0, shift);
    }
  }
  clickAnchor = null;
  if (scrollAfterRender) {
    document.querySelector(scrollAfterRender)?.scrollIntoView({ block: 'start' });
    scrollAfterRender = null;
  }
  // The tutorial month: make the button to press glow.
  if (guide?.focus && tab === guide.tab) for (const el of app.querySelectorAll(guide.focus)) if (!el.disabled) el.classList.add('tut-focus');
  renderFight();
}

// Run a game action (recorded for bug reports; see src/game.js) and do the page's bookkeeping.
function act(name, data = {}) {
  const state = { run, match };
  const before = match;
  try {
    const summary = applyGameAction(state, name, data);
    if (summary) {
      const fought = before ?? state.match; // a withdrawal settles a bracket with no match on screen
      if (fought && discoverMatch(codex, fought).length) saveCodex();
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
  // The bookmaker's quote, worked out once per match (it runs the odds simulation).
  if (match.round === 0 && !match.over && !match.bet && !match.betQuote) match.betQuote = { odds: betOdds(run, match), cap: betCap(run, match) };
  if (match.betQuote) match.betQuote.gold = run.gold;
  const nextBlocker = match.summary?.next ? fightBlocker(run, match.a.f.id, match.bout.tier) : null;
  fightEl.innerHTML = fightView(match, ui, { ...match.bout, keepsBuyIn: keepsBuyIn(run, match.bout.tier) }, tutorialCard(fightTutorial(), 'fight'), run.inventory.items, nextBlocker, run.mercy && { ...run.mercy, favorWhy: spareFavorWhy(run), owedLeft: owedLeft(run) }, bracketView(run, match.bout.tier));
  const feed = document.getElementById('feed');
  if (feed) feed.scrollTop = feed.scrollHeight;
}

// Auto-play: one round after another (each once its winner is announced), pausing whenever the capitulate decision really matters.
function scheduleAuto() {
  clearTimeout(autoTimer);
  if (!ui.auto || !match || match.over) return; // one match only: the next match of a tournament starts paused
  if (match.round > 0 && mortalDanger(match.a) && canThrowTowel(match)) return;
  autoTimer = setTimeout(() => guard('auto-play', () => {
    if (!match || match.over) return;
    const stance = suggestTactic(match);
    lastAction = ['next-round', { stance }];
    act('next-round', { stance });
    roundStartedAt = Date.now();
    ui.animateRound = match.round;
    roundSounds(match, match.rounds.at(-1), { diceTime: DICE_TIME, revealAt: revealTime(match, match.rounds.at(-1), ui.showMath), hype: hypeOf(match) });
    save();
    render();
    scheduleAuto();
  }), match.round === 0 ? 300 : Math.max(300, roundStartedAt + (roundEndTime(match, match.rounds.at(-1), ui.showMath) + 1.5) * 1000 - Date.now())); // let the round sink in
}

// ---------- Careers ----------

// `opening: false` when the opening has just played (before the patron choice).
// Every new career gets its own save; the one before stays in the Careers list.
// Version 6: a new career is a season (the short shape) unless the player chooses the Long Road.
function newRun(seed, setup = careerSetup(legacy), { opening = true } = {}) {
  run = createRun(seed ?? undefined, setup);
  careerId = freshId(careers, Date.now());
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
  careers = loadIndex(storage, () => freshId({ list: [] }, Date.now()));
  const urlSeed = Number(new URLSearchParams(location.search).get('seed'));
  if (careers.active && openCareer(careers.active)) return;
  newRun(Number.isInteger(urlSeed) && urlSeed > 0 ? urlSeed : null);
}

// Switch to a saved career (false if its save can't be read).
function openCareer(id) {
  const saved = loadCareerText(storage, id);
  if (saved) {
    try {
      run = deserialize(saved);
      careerId = id;
      match = null;
      summaries = [];
      stewardNotes = [];
      achieved = [];
      scene = null;
      oddsCache.clear();
      const url = new URL(location.href);
      url.searchParams.set('seed', run.seed);
      history.replaceState(null, '', url);
      tab = run.roster.length ? 'ludus' : 'market';
      // A career under way has had its opening; a brand-new one (nothing done yet) still gets it.
      if (!scenesSeen().includes('opening')) {
        if (run.week > 0 || run.roster.length) markSceneSeen('opening');
        else scene = { id: 'opening', beat: 0 };
      }
      save();
      render();
      return true;
    } catch (err) {
      console.warn('Could not load the saved career:', err.message);
    }
  }
  return false;
}
// A new career needs a free place in the list.
function roomForCareer() {
  const why = newCareerBlocker(careers);
  if (why) { alert(why); careersOpen = true; render(); }
  return !why;
}

// ---------- Events ----------

const actions = {
  'new-run': () => {
    if (!roomForCareer()) return; // the career being played is kept in the Careers list
    careersOpen = false;
    // Once a past career has unlocked something, choose a patron and decrees first.
    // The opening plays first, then the patron and decree choice, then the career (without a second opening).
    // Every new career offers its length and the daily challenge now (fun idea #2), so the dialog always follows.
    scene = { id: 'opening', beat: 0, then: 'setup' };
    render();
  },
  'start-career': () => {
    const patron = document.querySelector('input[name=patron]:checked')?.value || null;
    const heat = Number(document.querySelector('input[name=heat]:checked')?.value ?? 0);
    const colour = document.querySelector('input[name=colour]:checked')?.value ?? null;
    const short = document.querySelector('input[name=length]:checked')?.value === 'short';
    newRun(null, careerSetup(legacy, { patron, heat, short, colour }), { opening: false });
  },
  'daily-challenge': () => {
    if (!roomForCareer()) return;
    const day = today();
    newRun(dailySeed(day), dailySetup(day), { opening: false });
  },
  'setup-cancel': () => { setupChoice = null; },
  'replay-seed': () => { if (roomForCareer()) newRun(run.seed, run.setup); },
  'overtrain-back': () => { overtrainWarn = null; },
  'overtrain-go': (d) => { // End the week as planned, or with the named fighters resting
    const list = overtrainWarn ?? [];
    overtrainWarn = null;
    if (d.rest) for (const f of list) gameAction('job', { id: f.id, job: 'rest' });
    summaries = []; achieved = []; stewardNotes = [];
    gameAction('advance');
  },
  'careers-open': () => { careersOpen = true; showHelp = false; },
  'jump-bout': () => { scrollAfterRender = '.panel.bout'; }, // a phone, fight day: scrolled to once the page is redrawn
  'careers-close': () => { careersOpen = false; },
  'career-load': (d) => {
    careersOpen = false;
    if (d.id !== careerId && openCareer(d.id)) return;
    if (d.id !== careerId) alert('That save could not be loaded.');
    render();
  },
  'career-delete': (d) => {
    const entry = careers.list.find((e) => e.id === d.id);
    if (!entry || !confirm(`Delete this career for good?\n${entry.label}`)) return;
    removeCareer(storage, careers, d.id);
  },
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
  'tutorial-skip': () => { prefs.tutorial = [...GUIDE, ...STEPS, ...FIGHT_STEPS].map((s) => s.id); savePrefs(); },
  'tutorial-replay': () => { prefs.tutorial = []; showHelp = false; savePrefs(); },
  'scene-next': () => { if (scene && scene.beat < sceneBeats().length - 1) scene.beat += 1; else closeScene(); },
  'scene-reply': (d) => { // your answer: its lines play next
    const beats = sceneBeats();
    const reply = beats[scene.beat].replies?.[Number(d.index)];
    if (!reply) return;
    scene.beats = [...beats.slice(0, scene.beat), { ...beats[scene.beat], replies: null }, ...reply.then, ...beats.slice(scene.beat + 1)];
    scene.beat += 1;
  },
  'scene-skip': () => closeScene(),
  'result-close': () => { eventResult = null; },
  'intro-replay': () => { scene = { id: 'opening', beat: 0 }; showHelp = false; },
  'dismiss-summary': (d) => {
    summaries = summaries.filter((s) => `${s.week}-${s.tier}-${s.fighterId}` !== d.key);
  },
  'notice-page': (d) => { noticePage = Number(d.page); },
  'auto-play': () => { ui.auto = !ui.auto; },
  // Skip the animation: the rest of the match at once, with the suggested tactic (the designer, 5.4.0). Like auto-play,
  // it stops when the Death Gate is open and capitulating is still possible, so a death is never skipped past.
  'skip-fight': () => {
    clearTimeout(autoTimer);
    while (match && !match.over && !(match.round > 0 && mortalDanger(match.a) && canThrowTowel(match))) act('next-round', { stance: suggestTactic(match) });
    ui.animateRound = 0;
  },
  'room-tab': (d) => { roomTabs[d.id] = d.tab; },
  'export-save': () => {
    const blob = new Blob([exportSave({ run, codex, legacy, version: VERSION })], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `blood-and-circus-save-${run.seed}-week${run.week}.json`;
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
        if (!roomForCareer() || !confirm('Load this save as a new career? Your Codex and Legacy are replaced by the file\'s; your other careers are kept.')) return;
        storage.set(CODEX_KEY, JSON.stringify(data.codex));
        storage.set(LEGACY_KEY, JSON.stringify(data.legacy));
        const id = freshId(careers, Date.now());
        saveCareer(storage, careers, id, deserialize(data.career), Date.now());
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

// A game action with the page's bookkeeping around it (the `after` hook and the steward's news).
function gameAction(name, data = {}) {
  lastAction = [name, data];
  const snap = newsSnapshot(run);
  act(name, data);
  after[name]?.();
  for (const n of stewardNews(snap, newsSnapshot(run), run)) if (!stewardNotes.includes(n)) stewardNotes.push(n);
}

// Game actions: the page's extras around each one (confirmations, animation, tabs).
const before = {
  'event-choice': () => { logMark = run.log.length; return true; },
  fortune: () => { logMark = run.log.length; return true; },
  release: () => confirm('Release this fighter for good?'),
  retire: () => confirm('Retire this fighter to the Hall of Champions? They leave your roster for good.'),
  forfeit: () => confirm('Forfeit the Boss? It costs more Imperial Favour than losing the fight.'),
  withdraw: () => confirm('Withdraw from the tournament? It counts as capitulating; your fighter is safe.'),
  // Unequip all strips everyone (the designer's bug report: it looked like gear vanished): say who first.
  'unequip-all': () => {
    const worn = run.roster.filter((f) => f.gear.weapon || f.gear.armor);
    return confirm(`Take the gear off ${worn.map((f) => f.name).join(', ')}? It all goes back to the storeroom.`);
  },
  'refuse-summons': () => confirm(`Refuse the Emperor? It costs ${-SUMMONS.refuseFavor} Imperial Favour.`),
  advance: () => {
    // Whenever End week would overtrain someone, the steward checks first (the designer: 5.4.0 asked once a career, 5.4.3 every time).
    const at = overtrainedByWeek(run);
    if (at.length) { overtrainWarn = at.map((f) => ({ id: f.id, name: f.name, stress: f.stress })); return false; }
    summaries = []; achieved = []; stewardNotes = []; return true;
  },
  'advance-tournament': () => {
    summaries = []; achieved = []; stewardNotes = [];
    monthBefore = { snap: snapshot(run), mark: run.log.length }; // for the month's digest (version 6)
    return true;
  },
};
const after = {
  // Version 6, the month is the turn: what the weeks did, in one popup (training summed, news kept).
  'advance-tournament': () => {
    if (!monthBefore) return;
    const lines = monthDigest(monthBefore.snap, run, run.log.slice(monthBefore.mark));
    monthBefore = null;
    if (lines.length) eventResult = { title: run.bouts ? 'The month, to fight day' : 'The month so far', lines };
  },
  fight: () => {
    ui.animateRound = 0;
    ui.auto = false; // every match starts paused: auto-play covers one match (the designer, 5.4.0)
  },
  'next-round': () => {
    roundStartedAt = Date.now();
    ui.animateRound = match?.round ?? 0;
    if (match?.rounds.length) roundSounds(match, match.rounds.at(-1), { diceTime: DICE_TIME, revealAt: revealTime(match, match.rounds.at(-1), ui.showMath), hype: hypeOf(match) });
  },
  'event-choice': () => {
    sfx.event();
    // Show everything the choice changed, from the house log (the first line is "Title: choice. Effects.").
    const lines = run.log.slice(logMark);
    if (lines.length) eventResult = { title: lines[0].text.split(':')[0], lines: lines.map((l, i) => ({ tone: l.tone, text: i ? l.text : l.text.slice(l.text.indexOf(':') + 1).trim() })) };
  },
  mercy: () => { sfx.cheer(0); },
  // Version 6: the Fortune card taken, said once in a popup (its log lines, without the "Fortune: " prefix).
  fortune: () => {
    sfx.event();
    const lines = run.log.slice(logMark).map((l) => ({ tone: l.tone, text: l.text.replace(/^Fortune: /, '') }));
    if (lines.length) eventResult = { title: 'Fortune', lines };
  },
  'fortune-reroll': () => { sfx.event(); },
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
        gameAction(name, data);
      } else {
        actions[name](data);
      }
    } catch (err) {
      if (err.name !== 'Refused') throw err; // a real bug: the report box takes over
      alert(err.message);
    }
  });
  if (name === 'new-run' || name === 'replay-seed' || name === 'start-career' || name === 'daily-challenge' || name === 'bug-reload' || name === 'career-load') return;
  guard('render', () => {
    save();
    render();
    scheduleAuto();
  });
});

// Touch screens have no hover: tapping something with help text (a stat, chip or badge) shows it in a small popup.
// Buttons, links, fold-outs and form controls work as usual; tapping anywhere else closes the popup.
const touchTip = document.createElement('div');
touchTip.className = 'touch-tip';
touchTip.hidden = true;
document.body.appendChild(touchTip);
const isTouch = () => window.matchMedia?.('(hover: none)').matches;
// Chips marked ⓘ (.tip) open their popup on a click with a mouse too (5.4.0: the descriptions moved off the cards).
document.addEventListener('click', (e) => {
  if (!isTouch() && !e.target.closest?.('.tip')) { touchTip.hidden = true; return; }
  const el = e.target.closest?.('[title]');
  if (!el || el.closest('button:not([disabled]), a, summary, select, input, label, [data-action]')) { touchTip.hidden = true; return; }
  touchTip.textContent = el.getAttribute('title');
  touchTip.hidden = false;
  const r = el.getBoundingClientRect();
  const top = r.bottom + 8 + window.scrollY;
  touchTip.style.top = `${top}px`;
  touchTip.style.left = `${Math.max(8, Math.min(window.innerWidth - 288, r.left + window.scrollX))}px`;
}, true);
document.addEventListener('scroll', () => { touchTip.hidden = true; }, { passive: true, capture: true }); // the Ludus columns scroll on their own

// Dropdowns (gear): choosing an option runs the action, like a button would.
document.addEventListener('change', (e) => {
  const el = e.target.closest?.('select[data-change]');
  if (!el || el.value === '') return;
  const name = el.dataset.change;
  const data = { id: el.dataset.id, index: el.value };
  guard('action', () => {
    try {
      lastAction = [name, data];
      const mark = run.log.length;
      act(name, data);
      // An exhibition bout's result pops up, like an event's.
      if (name === 'exhibition') eventResult = { title: 'Exhibition Ring', lines: run.log.slice(mark).map((l) => ({ tone: l.tone, text: l.text.replace(/^Exhibition: /, '') })) };
      if (name === 'summons') eventResult = { title: 'The Emperor\'s summons', lines: run.log.slice(mark).map((l) => ({ tone: l.tone, text: l.text.replace(/^The Emperor's summons: /, '') })) };
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
  if (e.target.id === 'codex-search') filterCodex(e.target.value);
});

// The Codex search filters in place (no re-render, so the box keeps its focus): matching entries show, and sections
// with a match open.
function filterCodex(query) {
  const q = query.trim().toLowerCase();
  let any = false;
  for (const group of app.querySelectorAll('.codex-group')) {
    let hits = 0;
    for (const entry of group.querySelectorAll('.entry')) {
      const show = !q || entry.dataset.search.includes(q);
      entry.hidden = !show;
      if (show) hits++;
    }
    group.hidden = Boolean(q) && !hits;
    if (q && hits) group.open = true;
    any ||= hits > 0;
  }
  const empty = app.querySelector('.codex-empty');
  if (empty) empty.hidden = !q || any;
}
// Jump links open the section they point to.
document.addEventListener('click', (e) => {
  const jump = e.target.closest?.('[data-codex-jump]');
  if (jump) { const g = document.getElementById(`codex-${jump.dataset.codexJump}`); if (g) g.open = true; }
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
  if (overtrainWarn || careersOpen) { // the overtraining question and the Careers list: Escape closes them
    if (e.key === 'Escape') { overtrainWarn = null; careersOpen = false; render(); }
    return;
  }
  if (eventResult) { // the result popup: any of Space, Enter or Escape closes it
    if ([' ', 'Enter', 'Escape'].includes(e.key)) { e.preventDefault(); eventResult = null; render(); }
    return;
  }
  if (scene) { // a character is talking: Space or Enter goes on (unless you're asked to answer)
    if ((e.key === ' ' || e.key === 'Enter') && !sceneBeats()[scene.beat].replies) { e.preventDefault(); actions['scene-next'](); render(); }
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
  a.download = `blood-and-circus-bug-${run?.seed ?? 'x'}-week${run?.week ?? 0}.json`;
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
