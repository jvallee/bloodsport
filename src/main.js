// App state, saving, coach tips and event wiring. Game rules live in run.js / fight.js; markup in src/ui/.

import { mortalDanger, canThrowTowel, suggestTactic, hypeOf } from './fight.js';
import { createRun, matchOptions, serialize, deserialize, opponentFor, fightBlocker, bracketView, betQuote, spareFavorWhy, owedLeft, keepsBuyIn, overtrainedByWeek, demandMet, espionageOdds, freeFightDay, freeDraftPicks, resolveDialogueTree, houseOf, debtPenaltyFor, demandFromEmperor } from './run.js';
import { VILLA_PLOTS, CRYPT_HADES_SLOT, plotById, isPlotUnlocked, resolveEstateSlots, maxLevel, plotsFree } from './ludus.js';
import { applyGameAction, isGameAction } from './game.js';
import { buildReport } from './debug.js';
import { VERSION } from './version.js';
import { exportSave, importSave } from './savefile.js';
import { EVENT_BY_ID } from './events.js';
import { saveFailedBanner, loadFailedModal, summaryKey, otherTabBanner, resultNotice, talkModal, isStageNarrationReply } from './ui/views.js';
import { fightKey } from './ui/keys.js';
import { loadIndex, saveCareer, loadCareerText, removeCareer, newCareerBlocker, freshId, scenesKey, makeRoom, careerKey } from './careers.js';
import { estimateOdds, oddsKey } from './odds.js';
import { topbar, endBanner, summaryBanner, tutorialCard, dialogueModal, resultModal, guideBar, stewardNote, today, ludusTab, estateTab, marketTab, codexTab, helpModal, noticePager, nextBar, bugModal, eventCard, fortunePanel, fortuneDealKey, setupModal, careersModal, overtrainModal, freeFightModal, draftModal, weekDock, legacyPanel, achievementNotice, roomTabs } from './ui/views.js';
import { loadLegacy, checkAchievements, recordCareer, recordLegends, dailySeed, dailySetup, careerSetup } from './legacy.js';
import { nextHint } from './hints.js';
import { ENTRIES, SECTIONS, discover, discoverMatch, isUnlocked, hasLore, progress, loadCodex } from './codex.js';
import { GUIDE, STEPS, FIGHT_STEPS, nextStep, advanceGuide, guideBlocker, guideProgress, migrateTutorialPrefs } from './tutorial.js';
import { SPEAKERS, SCENES, dueScene, dueRebel, rebelScene, dueRebelStage, newsSnapshot, stewardNews, demandMetScene, demandMissedScene, endingScene, returnScene, isStaffId, getStaffActor } from './dialogue.js';
import { DEMANDS, DEMAND, CIRCUITS, SUMMONS } from './data.js';
import { snapshot, monthDigest } from './digest.js';
import { fightView, diceTime, setFightPace, roundTiming, roundEndTime, sideCardHtml } from './ui/fightView.js';
import { roundSounds, setSound, stopAllSounds, sfx } from './ui/sound.js';

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
let draftWarn = null; // End Week 0 with free Core Companion drafts and beds still open (v8.0.1)
let freeFightWarn = null; // End week on fight day with fighters who could still fight: freeFightDay(run) (7.9.2)
let overtrainWarn = null; // End week would overtrain these fighters: [{ id, name, stress }] (asked every time)
let tipWeek = -1; // At most one queued STEPS tutorial tip per week (v8.0.1)
let match = null;
let summaries = []; // this week's match results, newest last
let noticePage = 0;
let tab = 'ludus';
let mobilePane = 'roster'; // mobile Ludus pane: 'roster' | 'bout' | 'week'
const defaultEstateUi = () => ({ mode: 'villa', slot: 'ground-0', fighterId: null, roomSlot: null, movingItem: null, mobileFloor: 'ground' });
let estateUi = defaultEstateUi();
let talkUi = null;
let showHelp = false;
let autoTimer = null;
let revealTimer = null;
// Until when (performance.now()) a round is still being revealed: its controls and any MORTAL DANGER warning aren't
// visible yet, so a key or click only finishes the reveal (7.5, see src/ui/keys.js).
let revealingUntil = 0;
function finishReveal() {
  revealingUntil = 0;
  ui.animateRound = 0;
  clearTimeout(revealTimer);
  render();
}
let roundStartedAt = 0; // when the latest round began playing (auto-play waits for its story to finish, not for a fresh wait)
const reducedMotion = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
const ui = { animateRound: 0, showMath: false, auto: false, open: {} }; // open: fold-outs the player opened or closed, by data-key
let prefs = { tutorial: [], tutorialOff: false, showMath: false, introSeen: false, sound: true };
let codex = loadCodex(null);
let codexShownNew = []; // entries highlighted as new while the Codex tab is open
let scene = null; // the dialogue scene showing: { id, beat } (src/dialogue.js)
let stewardNotes = []; // the steward's news this week (new buildings, new stock): notes at the top, cleared each week
// 7.7: results that decide nothing (an ordinary event's outcome, Fortune's card) wait as notices, not pop-ups.
let resultNotes = [];
let eventIsWeighty = false; // a gamble, The Chains Break or an unmasked mole keeps its pop-up
let scrollAfterRender = null; // a selector to bring into view after the next render
let monthBefore = null; // before To fight day: { snap, mark } for the month's digest
let helpTab = 'play'; // How to play's tab (7.8)
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
  // false when the browser refuses the write (storage full or blocked), so a failed save is never silent.
  set(key, value) {
    try { localStorage.setItem(key, value); return true; } catch { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
  },
};

function loadPrefs() {
  try { prefs = { ...prefs, ...JSON.parse(storage.get(PREFS_KEY) ?? '{}') }; } catch { /* keep defaults */ }
  prefs = migrateTutorialPrefs(prefs);
  ui.showMath = prefs.showMath;
  setFightPace(prefs.pace);
  setSound(prefs.sound !== false);
  codex = loadCodex(storage.get(CODEX_KEY));
  legacy = loadLegacy(storage.get(LEGACY_KEY));
}
const saveLegacy = () => storage.set(LEGACY_KEY, JSON.stringify(legacy));
const saveCodex = () => storage.set(CODEX_KEY, JSON.stringify(codex));
const savePrefs = () => storage.set(PREFS_KEY, JSON.stringify(prefs));
// A failed save shows a lasting warning (render) until a later save works.
let saveFailed = false;
// A saved career that wouldn't load: { id, message }, shown as a dialog with ways out.
let loadFailed = null;
// Another tab saved this career (7.5): this tab stops saving so it can't overwrite that progress.
let otherTab = false;
const save = () => {
  if (!run || !careerId || otherTab) return;
  saveFailed = !saveCareer(storage, careers, careerId, run, Date.now()).ok;
};

// ---------- Odds cache (simulating is cheap but not free) ----------

const oddsCache = new Map();
function oddsFor(f, tier = run.topTier, opp = opponentFor(run, tier), legOpts = null) {
  const base = matchOptions(run, f, tier, opp);
  const arenaOpp = run.arenas[tier]?.opponent;
  const isFinalOpp = Boolean(arenaOpp && (opp === arenaOpp || (opp?.id && opp.id === arenaOpp.id)));
  const oppHouse = run.arenas[tier] ? houseOf(run, opp) : null;
  const debt = debtPenaltyFor(oppHouse);
  const opts = {
    ...base,
    earlyRound: isFinalOpp ? false : base.earlyRound,
    grudge: !run.arenas[tier] ? 0 : oppHouse?.feud > 0 ? 1 : oppHouse?.owed > 0 ? -1 : 0,
    vengeance: Boolean(run.arenas[tier]) && oppHouse?.vengeance > 0,
    ...(legOpts ?? {}),
  };
  if (legOpts && Object.hasOwn(legOpts, 'debt')) {
    if (legOpts.debt) opts.debt = legOpts.debt;
    else delete opts.debt;
  } else if (debt) {
    opts.debt = debt;
  } else {
    delete opts.debt;
  }
  // 7.4: stolen plans, a double agent and this month's covert op change the real fight, so the odds include them.
  const spy = espionageOdds(run, opp);
  const key = JSON.stringify([oddsKey(f), spy, opts]); // 7.7: only what a fight reads (a job click keeps the odds)
  if (!oddsCache.has(key)) {
    if (oddsCache.size > 200) oddsCache.clear();
    oddsCache.set(key, estimateOdds(f, spy.opp, { ...opts, boostsA: spy.boostsA, boostsB: spy.boostsB, vengeanceB: spy.vengeanceB, playbook: Boolean(spy.playbook), n: 400 }));
  }
  return oddsCache.get(key);
}

// ---------- Tutorial ----------

// The tutorial month (GUIDE): the steward's current step, done the moment its goal is met.
function guideStep() {
  if (prefs.tutorialOff || run.status !== 'active' || scene) return null;
  const { step, completed } = advanceGuide(prefs.tutorial, run);
  if (completed.length) { prefs.tutorial.push(...completed); savePrefs(); }
  return step;
}
// The steward's tips wait for the guide, any other dialog, the fight screen, and at most one tip per week.
const tutorialStep = () => (!prefs.tutorialOff && tipWeek !== run.week && run.status === 'active' && !scene && !match && !showHelp && !setupChoice && !run.event && !run.mercy && !guideStep() ? nextStep(STEPS, prefs.tutorial, run) : null);

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
  const replies = b.replies ? b.replies.map((r) => ({ label: r.label, then: r.then.map(talkBeat) })) : undefined;
  if (!b.fighterId) return { speaker: b.speaker, text: b.text, ...(replies ? { replies } : {}) };
  const f = run.roster.find((x) => x.id === b.fighterId) ?? run.fallen.find((x) => x.id === b.fighterId) ?? (run.retired ?? []).find((x) => x.id === b.fighterId);
  const base = f?.kind ? { speaker: 'fighter', fighter: { ...f, injuries: f.injuries ?? [] }, text: b.text } : { speaker: 'narrator', text: f ? `${f.name}: "${b.text}"` : b.text };
  return replies ? { ...base, replies } : base;
}
// The Emperor drops in at turning points, once each per career, when nothing else is on screen.
function checkScene() {
  if (scene || eventResult || match || setupChoice || showHelp || !scenesSeen().includes('opening')) return; // the Emperor's visits come after the opening
  // The career has ended: one last word, once (7.8).
  const ending = endingScene(run);
  if (ending && !scenesSeen().includes('ending')) {
    markSceneSeen('ending');
    scene = { id: 'ending', beat: 0, beats: ending };
    return;
  }
  // The Emperor's demand met, the moment it is; and missed, when its fight day ends (the designer, 5.4.0).
  if (run.demand && demandMet(run) && !scenesSeen().includes(`demand-met-${run.demand.week}`)) {
    markSceneSeen(`demand-met-${run.demand.week}`);
    const isEmperor = (run.demand.tier ?? run.topTier) >= 4;
    const rawBeats = demandMetScene(DEMANDS[run.demand.id].goal, DEMAND.favor, DEMAND.goldPerTier * Math.min(run.topTier, CIRCUITS.length));
    const beats = isEmperor
      ? rawBeats.map((b, i) => (i === 0 && b.speaker === 'rightHand'
        ? { ...b, speaker: 'emperor', text: 'Good. That is what I asked for, and you gave it to me. The throne remembers those who deliver.' }
        : b))
      : rawBeats;
    scene = { id: 'demand-met', beat: 0, beats };
    return;
  }
  const judged = run.demandResult;
  if (judged && !judged.met && !scenesSeen().includes(`demand-missed-${judged.issued}`)) {
    markSceneSeen(`demand-missed-${judged.issued}`);
    const isEmperor = (judged.tier ?? run.topTier) >= 4;
    const rawBeats = demandMissedScene(DEMANDS[judged.id].goal, judged.favor);
    const beats = isEmperor
      ? rawBeats.map((b, i) => (i === 0 && b.speaker === 'rightHand'
        ? { ...b, speaker: 'emperor', text: 'I asked you for one thing, Lanista. One. The month is over, and my box is still waiting.' }
        : b))
      : rawBeats;
    scene = { id: 'demand-missed', beat: 0, beats };
    return;
  }
  // Quests and rivals (5.4.0): what the rules said someone says (run.talk), each once per career.
  const said = (run.talk ?? []).find((t) => !scenesSeen().includes(`talk-${t.key}`));
  if (said) {
    markSceneSeen(`talk-${said.key}`);
    scene = { id: 'talk', beat: 0, beats: said.beats.map(talkBeat) };
    return;
  }
  // A new demand from the Palatine: Legate Cassian Vane delivers Tiers 1-3; Emperor Silbannacus delivers Tier 4+.
  const demandKey = run.demand ? `demand-${run.demand.week}` : null;
  if (demandKey && !scenesSeen().includes(demandKey)) {
    markSceneSeen(demandKey);
    const isEmperor = demandFromEmperor(run);
    const demandSpeaker = isEmperor ? 'emperor' : 'rightHand';
    const demandText = isEmperor ? DEMANDS[run.demand.id].say : (DEMANDS[run.demand.id].sayRightHand ?? DEMANDS[run.demand.id].say);
    const sender = isEmperor ? 'The Emperor\'s demand' : 'Legate Vane\'s Palatine docket';
    scene = { id: 'demand', beat: 0, beats: [{ speaker: demandSpeaker, text: demandText }, { speaker: 'steward', text: `${sender}: ${DEMANDS[run.demand.id].goal}, by the end of this month's fight day. Meet it and the Palatine pays in Favour and Gold; miss it and they remember.` }] };
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
    scene = { id, beat: 0, beats: returnScene(id, run) };
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
const fightTutorial = () => (!prefs.tutorialOff && match ? nextStep(FIGHT_STEPS, prefs.tutorial, match) : null);

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
function isTrainerDismissed(currentRun) {
  const dismissedUntil = currentRun?.staffDialogue?.trainer?.dismissedUntilWeek ?? 0;
  return (currentRun?.week ?? 0) < dismissedUntil;
}
function isTalkUiValid(currentRun, uiState) {
  if (!currentRun || !uiState) return false;
  const fighterId = typeof uiState === 'string' ? uiState : (uiState.fighterId ?? uiState.id ?? null);
  if (isStaffId(fighterId)) {
    const staff = getStaffActor(fighterId);
    if (!staff) return false;
    if (staff.staffKey === 'trainer' && isTrainerDismissed(currentRun) && !(typeof uiState === 'object' && uiState.response)) return false;
    return true;
  }
  if (typeof uiState === 'object' && uiState.kind) return true;
  return Boolean(currentRun.roster?.some((x) => x.id === fighterId || x.coreId === fighterId));
}
function activeModal() {
  if (bug) return 'bug';
  if (loadFailed) return 'loadFailed';
  if (careersOpen) return 'careers';
  if (draftWarn) return 'draft';
  if (freeFightWarn) return 'freefight';
  if (overtrainWarn) return 'overtrain';
  if (setupChoice) return 'setup';
  if (talkUi && isTalkUiValid(run, talkUi)) return 'talk';
  if (scene) return 'scene';
  if (eventResult) return 'result';
  if (showHelp) return 'help';
  if (tutorialStep()) return 'tutorial';
  return null;
}

function resetCareerUiState() {
  otherTab = false; // another tab's saves were of the career being left (7.8.1)
  clearTimeout(autoTimer);
  clearTimeout(revealTimer);
  stopAllSounds();
  match = null;
  summaries = [];
  noticePage = 0;
  stewardNotes = [];
  resultNotes = [];
  achieved = [];
  scene = null;
  talkUi = null;
  eventResult = null;
  draftWarn = null;
  overtrainWarn = null;
  freeFightWarn = null;
  tipWeek = -1;
  setupChoice = null;
  showHelp = false;
  careersOpen = false;
  monthBefore = null;
  dealtHand = null;
  ui.animateRound = 0;
  ui.auto = false;
  ui.open = {};
  estateUi = defaultEstateUi();
  for (const k of Object.keys(roomTabs)) delete roomTabs[k];
  oddsCache.clear();
}

function render() {
  if (discover(codex, run).length) saveCodex();
  if (talkUi && !isTalkUiValid(run, talkUi)) talkUi = null;
  // Legacy: achievements as they happen, and the career once it ends.
  const fresh = checkAchievements(legacy, run);
  if (fresh.length) {
    achieved.push(...fresh);
    noticePage = 0;
  }
  if (fresh.length + (recordCareer(legacy, run) ? 1 : 0) + recordLegends(legacy, run).length) saveLegacy();
  let body;
  if (tab === 'estate') body = estateTab(run, estateUi);
  else if (tab === 'market') body = marketTab(run);
  else if (tab === 'codex') body = codexTab(codex, ENTRIES, SECTIONS, codexShownNew, progress(codex), isUnlocked, hasLore, run.loreRead ?? []) + legacyPanel(legacy);
  else body = ludusTab(run, oddsFor, mobilePane);
  checkScene();
  const guide = guideStep();
  const modal = loadFailed ? loadFailedModal(loadFailed) : careersOpen ? careersModal(careers, careerId) : draftWarn ? draftModal(draftWarn) : freeFightWarn ? freeFightModal(freeFightWarn) : overtrainWarn ? overtrainModal(overtrainWarn) : setupChoice ? setupModal(legacy, setupChoice) : talkUi ? talkModal(run, talkUi) : scene ? dialogueModal(scene.id, sceneBeats(), scene.beat) : eventResult ? resultModal(eventResult.title, eventResult.lines) : showHelp ? helpModal(helpTab) : tutorialCard(tutorialStep());
  // Notifications: this week's results (newest first), one page at a time. (The steward's tips open as a dialogue.)
  const notices = [...resultNotes.map((r, i) => resultNotice(r, i)), ...stewardNotes.map(stewardNote), ...achieved.map(achievementNotice), ...[...summaries].reverse().map(summaryBanner)].filter(Boolean);
  noticePage = Math.min(noticePage, Math.max(0, notices.length - 1));
  const SCROLLERS = '.grid > .panel, .log, .feed';
  const scrollKeys = () => {
    const seen = {};
    return [...app.querySelectorAll(SCROLLERS)].map((el) => {
      const c = [...el.classList].slice(0, 2).join('.');
      seen[c] = (seen[c] ?? 0) + 1;
      return [`${c}#${seen[c]}`, el];
    });
  };
  const scrolled = renderedTab === tab ? Object.fromEntries(scrollKeys().map(([k, el]) => [k, el.scrollTop])) : {};
  const estBaysScroll = renderedTab === tab ? [...app.querySelectorAll('.est-bays')].map((el) => el.scrollLeft) : [];
  const estStripScroll = renderedTab === tab ? (app.querySelector('.est-fighter-strip')?.scrollLeft ?? 0) : 0;
  const estInspScroll = renderedTab === tab ? (app.querySelector('.est-inspector')?.scrollTop ?? 0) : 0;
  renderedTab = tab;
  const fortune = fortunePanel(run, { animate: fortuneDealKey(run) !== dealtHand });
  if (fortune) dealtHand = fortuneDealKey(run);
  document.body.dataset.house = run.setup?.colour ?? '';
  const guideExtra = guide ? { progress: guideProgress(run, prefs.tutorial), blocker: guideBlocker(run, guide) } : null;
  app.innerHTML = `${topbar(run, tab, codex.fresh.length, prefs.sound !== false)}<main>${otherTab ? otherTabBanner() : saveFailed ? saveFailedBanner() : ''}${run.status !== 'active' ? endBanner(run, legacy) : ''}${guide ? guideBar(guide, tab === guide.tab, run, guideExtra) : nextBar(nextHint(run), tab)}${eventCard(run)}${fortune}${noticePager(notices, noticePage)}${body}</main>${weekDock(run, Boolean(match))}${modal}`;
  const stickyHead = app.querySelector('.sticky-head');
  if (stickyHead) document.documentElement.style.setProperty('--head-h', `${stickyHead.offsetHeight + 8}px`);
  for (const d of app.querySelectorAll('details[data-key]')) if (d.dataset.key in ui.open) d.open = ui.open[d.dataset.key];
  for (const [k, el] of scrollKeys()) if (scrolled[k]) el.scrollTop = scrolled[k];
  app.querySelectorAll('.est-bays').forEach((el, i) => { if (estBaysScroll[i]) el.scrollLeft = estBaysScroll[i]; });
  const estStrip = app.querySelector('.est-fighter-strip');
  if (estStrip && estStripScroll) estStrip.scrollLeft = estStripScroll;
  const estInsp = app.querySelector('.est-inspector');
  if (estInsp && estInspScroll) estInsp.scrollTop = estInspScroll;
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
  if (guide?.focus && tab === guide.tab) {
    const litCards = new Set();
    for (const el of app.querySelectorAll(guide.focus)) {
      if (el.disabled) continue;
      const card = el.closest('.card');
      if (card) {
        if (litCards.has(card)) continue;
        litCards.add(card);
      }
      el.classList.add('tut-focus');
    }
  }
  if (modal) {
    const focusTarget = app.querySelector('.modal [autofocus]:not([disabled])')
      ?? app.querySelector('.modal .talk-choice:not([disabled])')
      ?? app.querySelector('.modal .talk-continue:not([disabled])')
      ?? app.querySelector('.modal .talk-topic:not([disabled])')
      ?? app.querySelector('.modal button:not(.close):not([disabled])')
      ?? app.querySelector('.modal button:not([disabled])');
    focusTarget?.focus?.();
  }
  renderFight();
}

// Run a game action (recorded for bug reports; see src/game.js) and do the page's bookkeeping.
function act(name, data = {}) {
  const state = { run, match, codex };
  const before = match;
  try {
    const res = applyGameAction(state, name, data);
    const isDialogueRes = Boolean(res && typeof res === 'object' && ('replySpeaker' in res || 'choiceId' in res));
    if (res && !isDialogueRes) {
      const fought = before ?? state.match; // a withdrawal settles a bracket with no match on screen
      if (fought && discoverMatch(codex, fought).length) saveCodex();
      summaries.push(res);
      noticePage = 0;
    }
    return isDialogueRes ? res : (state.dialogueResult ?? state.lastDialogueResult ?? null);
  } finally {
    run = state.run;
    match = state.match;
  }
}

function renderFight() {
  clearTimeout(revealTimer);
  app.inert = Boolean(match);
  if (!match) {
    fightEl.hidden = true;
    fightEl.innerHTML = '';
    return;
  }
  fightEl.hidden = false;
  // The bookmaker's quote, worked out once per match (it runs the odds simulation).
  match.betQuote = betQuote(run, match); // live: an item used before Round 1 changes the odds (7.8.1)
  const nextBlocker = match.summary?.next ? fightBlocker(run, match.a.f.id, match.bout.tier) : null;
  fightEl.classList.toggle('quick', prefs.pace === 'quick'); // 7.7: Quick pace speeds the dice animation too
  fightEl.innerHTML = fightView(match, ui, { ...match.bout, keepsBuyIn: keepsBuyIn(run, match.bout.tier) }, tutorialCard(fightTutorial(), 'fight'), run.inventory.items, nextBlocker, run.mercy && { ...run.mercy, favorWhy: spareFavorWhy(run), owedLeft: owedLeft(run) }, bracketView(run, match.bout.tier));
  const feed = document.getElementById('feed');
  if (feed) feed.scrollTop = feed.scrollHeight;
  // Swap side cards from pre-round snapshot to post-round state at blow impact so death/wounds never spoil t=0s.
  const last = match.rounds.at(-1);
  revealingUntil = 0;
  if (last && last.round === ui.animateRound && last.before && !reducedMotion()) {
    const timing = roundTiming(match, last, ui.showMath);
    revealingUntil = performance.now() + (timing.end + 0.4) * 1000; // the controls fade in 0.3 s after the last line
    const snapMatch = match;
    const snapRound = last.round;
    revealTimer = setTimeout(() => {
      if (match !== snapMatch || match.rounds.at(-1)?.round !== snapRound) return;
      const aEl = document.getElementById('side-card-A');
      const bEl = document.getElementById('side-card-B');
      if (aEl) aEl.innerHTML = sideCardHtml(match, 'A', ui, { revealed: true });
      if (bEl) bEl.innerHTML = sideCardHtml(match, 'B', ui, { revealed: true });
    }, Math.max(0, Math.round(timing.shake * 1000)));
  }
}

function playRoundSound() {
  if (!match?.rounds.length) return;
  const last = match.rounds.at(-1);
  const timing = roundTiming(match, last, ui.showMath);
  roundSounds(match, last, {
    diceTime: diceTime(),
    revealAt: timing.reveal,
    blowTimes: timing.blowTimes,
    hype: hypeOf(match),
  });
}

// Auto-play: one round after another (each once its winner is announced), pausing whenever the capitulate decision really matters.
function scheduleAuto() {
  clearTimeout(autoTimer);
  if (!ui.auto || !match || match.over) return; // one match only: the next match of a tournament starts paused
  if (match.round > 0 && mortalDanger(match.a) && canThrowTowel(match)) return;
  const wait = match.round === 0 || ui.animateRound === 0 || reducedMotion()
    ? 300
    : Math.max(300, roundStartedAt + (roundEndTime(match, match.rounds.at(-1), ui.showMath) + 1.5) * 1000 - Date.now());
  autoTimer = setTimeout(() => guard('auto-play', () => {
    if (!match || match.over) return;
    const stance = suggestTactic(match);
    lastAction = ['next-round', { stance }];
    act('next-round', { stance });
    roundStartedAt = Date.now();
    ui.animateRound = reducedMotion() ? 0 : match.round;
    if (!reducedMotion()) playRoundSound();
    save();
    render();
    scheduleAuto();
  }), wait);
}

// ---------- Careers ----------

function newRun(seed, setup = careerSetup(legacy), { opening = true } = {}) {
  resetCareerUiState();
  run = createRun(seed ?? undefined, setup);
  careerId = freshId(careers, Date.now());
  tab = 'market';
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
  const broken = careers.active;
  const opened = broken ? openCareer(broken) : null;
  if (opened === true) return;
  newRun(Number.isInteger(urlSeed) && urlSeed > 0 ? urlSeed : null);
  // The saved career wouldn't load: say why and offer the way out, instead of silently starting afresh (its save is kept).
  if (typeof opened === 'string') { loadFailed = { id: broken, message: opened }; render(); }
}

// Switch to a saved career: true, or why it couldn't (the career being played stays as it was).
// It is loaded and drawn before it becomes the active career.
function openCareer(id) {
  const saved = loadCareerText(storage, id);
  if (!saved) return 'Its save is missing from this browser.';
  const before = { run, careerId, tab };
  try {
      const loaded = deserialize(saved);
      resetCareerUiState();
      run = loaded;
      careerId = id;
      match = run.inMatch ? run.matchInfo?.match ?? null : null; // 7.5.1: a fight in progress resumes
      const url = new URL(location.href);
      url.searchParams.set('seed', run.seed);
      history.replaceState(null, '', url);
      tab = run.roster.length ? 'ludus' : 'market';
      // A career under way has had its opening; a brand-new one (nothing done yet) still gets it.
      if (!scenesSeen().includes('opening')) {
        if (run.week > 0 || run.roster.length) markSceneSeen('opening');
        else scene = { id: 'opening', beat: 0 };
      }
      render();
      save();
      return true;
  } catch (err) {
    console.warn('Could not load the saved career:', err.message);
    ({ run, careerId, tab } = before);
    if (run) render();
    return err.message;
  }
}
// A new career needs a free place in the list.
function roomForCareer() {
  const why = newCareerBlocker(careers);
  if (why) { alert(why); careersOpen = true; render(); }
  else makeRoom(storage, careers);
  return !why;
}

// ---------- Events ----------

const actions = {
  'new-run': () => {
    if (!roomForCareer()) return; // the career being played is kept in the Careers list
    careersOpen = false;
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
  'draft-market': () => { draftWarn = null; tab = 'market'; },
  'draft-go': () => {
    const via = draftWarn?.via ?? 'advance';
    draftWarn = null;
    if (via === 'advance-tournament') {
      summaries = []; achieved = []; stewardNotes = []; resultNotes = [];
      monthBefore = { snap: snapshot(run), mark: run.log.length };
      gameAction('advance-tournament');
      return;
    }
    if (endWeekChecks({ drafts: false })) { summaries = []; achieved = []; stewardNotes = []; resultNotes = []; gameAction('advance'); }
  },
  'freefight-back': () => { freeFightWarn = null; mobilePane = 'bout'; scrollAfterRender = '.panel.bout'; },
  'freefight-go': () => { // End the week as asked; the overtraining check still comes next
    freeFightWarn = null;
    if (endWeekChecks({ drafts: false, fights: false })) { summaries = []; achieved = []; stewardNotes = []; resultNotes = []; gameAction('advance'); }
  },
  'overtrain-back': () => { overtrainWarn = null; },
  'overtrain-go': (d) => { // End the week as planned, or with the named fighters resting
    const list = overtrainWarn ?? [];
    overtrainWarn = null;
    if (d.rest) for (const f of list) gameAction('job', { id: f.id, job: 'rest' });
    summaries = []; achieved = []; stewardNotes = []; resultNotes = [];
    gameAction('advance');
  },
  'careers-open': () => { careersOpen = true; showHelp = false; loadFailed = null; },
  'load-failed-close': () => { loadFailed = null; },
  'load-failed-download': () => {
    const text = loadCareerText(storage, loadFailed?.id);
    if (!text) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = `blood-and-circus-save-${loadFailed.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  'jump-bout': () => { tab = 'ludus'; mobilePane = 'bout'; scrollAfterRender = '.panel.bout'; }, // a phone, fight day: switches pane & scrolls to bouts
  'mobile-pane': (d) => { if (['roster', 'bout', 'week'].includes(d.pane)) mobilePane = d.pane; },
  'careers-close': () => { careersOpen = false; },
  'career-load': (d) => {
    careersOpen = false;
    if (d.id !== careerId) {
      const opened = openCareer(d.id);
      if (opened === true) return;
      loadFailed = { id: d.id, message: opened };
      careersOpen = false;
    }
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
  help: () => { showHelp = !showHelp; helpTab = 'play'; },
  'help-tab': (d) => { helpTab = d.tab === 'rules' ? 'rules' : 'play'; },
  'tutorial-done': (d) => { prefs.tutorial.push(d.step); if (STEPS.some((s) => s.id === d.step)) tipWeek = run.week; savePrefs(); },
  'tutorial-skip': () => { prefs.tutorial = [...GUIDE, ...STEPS, ...FIGHT_STEPS].map((s) => s.id); prefs.tutorialOff = true; savePrefs(); },
  'tutorial-replay': () => { prefs.tutorial = []; prefs.tutorialOff = false; tipWeek = -1; showHelp = false; savePrefs(); },
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
  'dismiss-result': (d) => { resultNotes.splice(Number(d.index), 1); },
  'intro-replay': () => { scene = { id: 'opening', beat: 0 }; showHelp = false; },
  'dismiss-summary': (d) => {
    summaries = summaries.filter((s) => summaryKey(s) !== d.key);
  },
  'notice-page': (d) => { noticePage = Number(d.page); },
  'auto-play': () => { ui.auto = !ui.auto; },
  'skip-fight': () => {
    clearTimeout(autoTimer);
    clearTimeout(revealTimer);
    stopAllSounds();
    while (match && !match.over && !(match.round > 0 && mortalDanger(match.a) && canThrowTowel(match))) act('next-round', { stance: suggestTactic(match) });
    ui.animateRound = 0;
  },
  'room-tab': (d) => { roomTabs[d.id] = d.tab; },
  'estate-select-slot': (d) => { estateUi.slot = d.slot; },
  'estate-mode': (d) => {
    estateUi.mode = d.mode === 'room' ? 'room' : 'villa';
    estateUi.movingItem = null;
  },
  'estate-open-room': (d) => {
    tab = 'estate';
    estateUi.mode = 'room';
    estateUi.fighterId = d.id;
    estateUi.roomSlot = null;
    estateUi.movingItem = null;
  },
  'estate-mobile-floor': (d) => {
    if (!['upper', 'ground', 'catacomb'].includes(d.floor)) return;
    estateUi.mobileFloor = d.floor;
    const curFloor = estateUi.slot === CRYPT_HADES_SLOT ? 'catacomb' : plotById(estateUi.slot)?.floor;
    if (curFloor !== d.floor) {
      const bySlot = resolveEstateSlots(run);
      const floorPlots = VILLA_PLOTS.filter((p) => p.floor === d.floor);
      const nextSlot = (d.floor === 'catacomb' && bySlot.has(CRYPT_HADES_SLOT) ? CRYPT_HADES_SLOT : null)
        ?? floorPlots.find((p) => bySlot.has(p.id))?.id
        ?? floorPlots.find((p) => isPlotUnlocked(run, p))?.id
        ?? (d.floor === 'catacomb' && !maxLevel(run, 'hades') && plotsFree(run) <= 0 ? CRYPT_HADES_SLOT : null)
        ?? floorPlots[0]?.id;
      if (nextSlot) estateUi.slot = nextSlot;
    }
  },
  'estate-room-slot': (d) => { estateUi.roomSlot = d.slot; },
  'estate-move-start': (d) => { estateUi.movingItem = d.item; },
  'estate-move-cancel': () => { estateUi.movingItem = null; },
  'talk-open': (d) => {
    const next = { fighterId: d.id, sceneId: d.scene || null, response: null };
    talkUi = isTalkUiValid(run, next) ? next : null;
  },
  'talk-topic': (d) => {
    const next = { fighterId: d.id || talkUi?.fighterId, sceneId: d.scene || null, response: null };
    talkUi = isTalkUiValid(run, next) ? next : null;
  },
  'talk-close': () => { talkUi = null; },
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
        if (!roomForCareer() || !confirm('Load this save as a new career? Your other careers, Codex and Legacy are kept.')) return;
        // Replacing your own Codex and Legacy is opt-in (7.5): Cancel keeps them.
        if (confirm('Also replace your Codex and Legacy with the ones in the file? Cancel keeps yours.')) {
          storage.set(CODEX_KEY, JSON.stringify(data.codex));
          storage.set(LEGACY_KEY, JSON.stringify(data.legacy));
        }
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
  'toggle-pace': () => {
    prefs.pace = prefs.pace === 'quick' ? 'full' : 'quick';
    setFightPace(prefs.pace);
    savePrefs();
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
  let talkReply = null;
  if (name === 'talk-choice') {
    const actor = isStaffId(data.id)
      ? getStaffActor(data.id)
      : run.roster.find((x) => x.id === data.id || x.coreId === data.id);
    const tree = actor ? resolveDialogueTree(run, actor, data.scene) : null;
    const c = tree?.choices?.find((x) => x.id === data.choice);
    if (c && !c.locked) {
      talkReply = {
        fighterId: actor.id,
        actorName: actor.name,
        actorKey: actor.coreId ?? actor.staffKey ?? null,
        choiceReplySpeaker: c.replySpeaker ?? null,
        sceneId: tree.id,
        treeSnapshot: { id: tree.id, title: tree.title, isQueued: Boolean(tree.isQueued), beats: tree.beats },
        text: c.responseText,
      };
    }
  }
  const snap = newsSnapshot(run);
  const dialogueRes = act(name, data);
  if (talkReply) {
    const replyText = dialogueRes?.responseText ?? talkReply.text;
    const rawSpeaker = dialogueRes?.replySpeaker ?? talkReply.choiceReplySpeaker ?? null;
    const isDefaultActor = !rawSpeaker || rawSpeaker === 'fighter' || rawSpeaker === talkReply.actorKey || rawSpeaker === talkReply.actorName;
    const replySpeaker = rawSpeaker === 'narrator' || (isDefaultActor && isStageNarrationReply(replyText, talkReply.actorName))
      ? 'narrator'
      : rawSpeaker;
    let speakerName = talkReply.actorName;
    if (replySpeaker === 'narrator') speakerName = '';
    else if (replySpeaker && replySpeaker !== 'fighter') {
      speakerName = Object.hasOwn(SPEAKERS, replySpeaker) ? (SPEAKERS[replySpeaker].name || talkReply.actorName) : String(replySpeaker);
    }
    talkUi = {
      fighterId: talkReply.fighterId,
      sceneId: talkReply.sceneId,
      treeSnapshot: talkReply.treeSnapshot,
      response: { text: replyText, ...(replySpeaker ? { replySpeaker } : {}), speakerName },
    };
  }
  after[name]?.();
  for (const n of stewardNews(snap, newsSnapshot(run), run)) if (!stewardNotes.includes(n)) stewardNotes.push(n);
}

// Game actions: the page's extras around each one (confirmations, animation, tabs).
const before = {
  'talk-choice': (data) => (data.choice === 'side_with_varok_crush_plot'
    ? confirm('Side with Varok and crush the rising? This permanently ends the rebel plot.')
    : true),
  'event-choice': (data) => {
    logMark = run.log.length;
    const choice = EVENT_BY_ID[run.event?.id]?.choices[Number(data?.index)];
    eventIsWeighty = Boolean(choice?.effects?.chance || EVENT_BY_ID[run.event?.id]?.crisis || run.event?.id === 'moleUnmasked');
    return true;
  },
  fortune: () => { logMark = run.log.length; return true; },
  release: () => confirm('Release this fighter for good?'),
  rename: (data) => {
    const f = run.roster.find((x) => x.id === data.id);
    const name = prompt(`A new name for ${f?.name ?? 'this fighter'}:`, f?.name ?? '');
    if (name === null) return false;
    data.name = name;
    return true;
  },
  retire: () => confirm('Retire this fighter to the Hall of Champions? They leave your roster for good.'),
  forfeit: () => confirm('Forfeit the Boss? It costs more Imperial Favour than losing the fight.'),
  withdraw: () => confirm('Withdraw from the tournament? It counts as capitulating; your fighter is safe.'),
  'unequip-all': () => {
    const worn = run.roster.filter((f) => f.gear.weapon || f.gear.armor);
    return confirm(`Take the gear off ${worn.map((f) => f.name).join(', ')}? It all goes back to the storeroom.`);
  },
  'refuse-summons': () => confirm(`Refuse the Emperor? It costs ${-SUMMONS.refuseFavor} Imperial Favour.`),
  advance: () => {
    if (!endWeekChecks()) return false;
    summaries = []; achieved = []; stewardNotes = []; resultNotes = []; return true;
  },
  'advance-tournament': () => {
    const unusedDraft = freeDraftPicks(run);
    if (unusedDraft) { draftWarn = { ...unusedDraft, via: 'advance-tournament' }; return false; }
    summaries = []; achieved = []; stewardNotes = []; resultNotes = [];
    monthBefore = { snap: snapshot(run), mark: run.log.length };
    return true;
  },
};
// Before ending the week: unused Week-0 free drafts (v8.0.1), fighters left unused on fight day (7.9.2), then fighters a week from Overtrained. True: go ahead.
function endWeekChecks({ drafts = true, fights = true } = {}) {
  const unusedDraft = drafts ? freeDraftPicks(run) : null;
  if (unusedDraft) { draftWarn = { ...unusedDraft, via: 'advance' }; return false; }
  const free = fights ? freeFightDay(run) : null;
  if (free) { freeFightWarn = free; return false; }
  const at = overtrainedByWeek(run);
  if (at.length) { overtrainWarn = at.map((f) => ({ id: f.id, name: f.name, stress: f.stress })); return false; }
  return true;
}
const after = {
  advance: () => { if (run.boutPending) mobilePane = 'bout'; },
  'advance-tournament': () => {
    if (run.boutPending) mobilePane = 'bout';
    if (!monthBefore) return;
    const lines = monthDigest(monthBefore.snap, run, run.log.slice(monthBefore.mark));
    monthBefore = null;
    if (lines.length) eventResult = { title: run.bouts ? 'The month, to fight day' : 'The month so far', lines };
  },
  fight: () => {
    clearTimeout(revealTimer);
    stopAllSounds();
    eventResult = null;
    ui.animateRound = 0;
    ui.auto = false;
  },
  'next-round': () => {
    roundStartedAt = Date.now();
    ui.animateRound = reducedMotion() ? 0 : (match?.round ?? 0);
    if (!reducedMotion()) playRoundSound();
  },
  'event-choice': () => {
    sfx.event();
    const lines = run.log.slice(logMark);
    if (lines.length) {
      const titledIdx = lines.findIndex((l) => l.text.includes(':'));
      const title = titledIdx >= 0 ? lines[titledIdx].text.slice(0, lines[titledIdx].text.indexOf(':')) : 'Event';
      const result = {
        title,
        lines: lines.map((l, i) => ({
          tone: l.tone,
          text: i === titledIdx ? l.text.slice(l.text.indexOf(':') + 1).trim() : l.text,
        })),
      };
      if (eventIsWeighty) eventResult = result;
      else { resultNotes.push(result); noticePage = 0; }
    }
  },
  mercy: () => { sfx.cheer(0); },
  fortune: () => {
    sfx.event();
    const lines = run.log.slice(logMark).map((l) => ({ tone: l.tone, text: l.text.replace(/^Fortune: /, '') }));
    if (lines.length) { resultNotes.push({ title: 'Fortune', lines }); noticePage = 0; }
  },
  'fortune-reroll': () => { sfx.event(); },
  withdraw: () => {
    clearTimeout(autoTimer);
    clearTimeout(revealTimer);
    stopAllSounds();
    match = null;
    ui.auto = false;
    tab = 'ludus';
  },
  'leave-fight': () => {
    clearTimeout(autoTimer);
    clearTimeout(revealTimer);
    stopAllSounds();
    ui.auto = false;
    tab = 'ludus';
    window.scrollTo(0, 0);
  },
  build: () => {
    const built = run.buildings[run.buildings.length - 1];
    const slot = lastAction?.[1]?.slot || built?.slot;
    if (slot) {
      estateUi.slot = slot;
      const floor = slot === CRYPT_HADES_SLOT ? 'catacomb' : plotById(slot)?.floor;
      if (floor) estateUi.mobileFloor = floor;
    }
  },
  'assign-decor': () => {
    estateUi.movingItem = null;
    const f = run.roster.find((x) => x.id === lastAction?.[1]?.id);
    if (f?.roomLayout?.[lastAction?.[1]?.item]) estateUi.roomSlot = f.roomLayout[lastAction[1].item];
  },
  'buy-assign-decor': () => {
    estateUi.movingItem = null;
    const f = run.roster.find((x) => x.id === lastAction?.[1]?.id);
    if (f?.roomLayout?.[lastAction?.[1]?.item]) estateUi.roomSlot = f.roomLayout[lastAction[1].item];
  },
  'move-decor': () => {
    estateUi.movingItem = null;
    if (lastAction?.[1]?.slot) estateUi.roomSlot = lastAction[1].slot;
  },
  'remove-decor': () => {
    estateUi.movingItem = null;
  },
};

const SKIP_SAVE_ACTIONS = new Set([
  'new-run', 'replay-seed', 'start-career', 'daily-challenge', 'bug-reload', 'career-load',
  'bug-copy', 'bug-download', 'export-save', 'import-save', 'mobile-pane',
  'estate-select-slot', 'estate-mode', 'estate-open-room', 'estate-mobile-floor',
  'estate-room-slot', 'estate-move-start', 'estate-move-cancel',
  'talk-open', 'talk-topic', 'talk-close',
]);

document.addEventListener('click', (e) => {
  // Clicking the dimmed backdrop outside a non-critical modal dismisses it cleanly.
  if (e.target.classList?.contains('modal')) {
    const topModal = activeModal();
    if (topModal === 'talk') { talkUi = null; render(); return; }
    if (topModal === 'help') { showHelp = false; render(); return; }
    if (topModal === 'careers') { careersOpen = false; render(); return; }
    if (topModal === 'result') { eventResult = null; render(); return; }
    if (topModal === 'setup') { setupChoice = null; render(); return; }
    if (topModal === 'overtrain') { overtrainWarn = null; render(); return; }
    if (topModal === 'freefight') { freeFightWarn = null; render(); return; }
    if (topModal === 'draft') { draftWarn = null; render(); return; }
    if (topModal === 'bug' && !bug?.error) { bug = null; bugStatus = ''; renderBug(); return; }
    return;
  }
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const name = el.dataset.action;
  if (!actions[name] && !isGameAction(name)) return;
  const data = { ...el.dataset };
  delete data.action;
  let cancelled = false;
  guard('action', () => {
    try {
      if (name !== 'next-round') ui.animateRound = 0; // only a new round plays its animation (not items, toggles...)
      if (isGameAction(name)) {
        if (before[name] && !before[name](data)) { cancelled = true; return; }
        gameAction(name, data);
      } else {
        actions[name](data);
      }
    } catch (err) {
      if (err.name !== 'Refused') throw err; // a real bug: the report box takes over
      alert(err.message);
    }
  });
  if (SKIP_SAVE_ACTIONS.has(name)) {
    if (name === 'mobile-pane' || name.startsWith('estate-') || name.startsWith('talk-')) guard('render', () => render());
    return;
  }
  if (cancelled) {
    if (overtrainWarn || freeFightWarn) guard('render', () => render());
    return;
  }
  guard('render', () => {
    save();
    render();
    scheduleAuto();
  });
});

// Touch screens have no hover: tapping something with help text (a stat, chip or badge) shows it in a small popup.
const touchTip = document.createElement('div');
touchTip.className = 'touch-tip';
touchTip.hidden = true;
document.body.appendChild(touchTip);
const isTouch = () => window.matchMedia?.('(hover: none)').matches;
document.addEventListener('click', (e) => {
  if (!isTouch() && !e.target.closest?.('.tip')) { touchTip.hidden = true; return; }
  const el = e.target.closest?.('[title]');
  if (!el || el.closest('button:not([disabled]), a, summary, select, input, label, [data-action]')) { touchTip.hidden = true; return; }
  touchTip.textContent = el.getAttribute('title');
  touchTip.hidden = false;
  const r = el.getBoundingClientRect();
  const tipH = touchTip.offsetHeight || 60;
  const below = r.bottom + 8 + tipH <= window.innerHeight - 8;
  const top = (below ? r.bottom + 8 : Math.max(8, r.top - tipH - 8)) + window.scrollY;
  touchTip.style.top = `${top}px`;
  touchTip.style.left = `${Math.max(8, Math.min(window.innerWidth - 288, r.left + window.scrollX))}px`;
}, true);
document.addEventListener('scroll', () => { touchTip.hidden = true; }, { passive: true, capture: true });

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

// A click on the fight screen while a round is still being revealed only finishes the reveal (no hidden control fires).
fightEl.addEventListener('click', (e) => {
  if (performance.now() < revealingUntil && e.target.closest?.('[data-action]')) {
    e.preventDefault();
    e.stopPropagation();
    finishReveal();
  }
}, true);

// Two tabs on one career would overwrite each other's saves; the tab that didn't save last steps back.
window.addEventListener('storage', (e) => {
  if (careerId && e.key === careerKey(careerId) && e.newValue !== null) {
    otherTab = true;
    render();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input, textarea, select')) return;
  const topModal = activeModal();
  if (topModal) {
    if (topModal === 'bug') {
      if (e.key === 'Escape' && !bug?.error) { bug = null; bugStatus = ''; renderBug(); }
      return;
    }
    if (topModal === 'loadFailed') {
      if (e.key === 'Escape') { loadFailed = null; render(); }
      return;
    }
    if (topModal === 'careers') {
      if (e.key === 'Escape') { careersOpen = false; render(); }
      return;
    }
    if (topModal === 'freefight') {
      if (e.key === 'Escape') { freeFightWarn = null; render(); }
      return;
    }
    if (topModal === 'overtrain') {
      if (e.key === 'Escape') { overtrainWarn = null; render(); }
      return;
    }
    if (topModal === 'setup') {
      if (e.key === 'Escape') { setupChoice = null; render(); }
      return;
    }
    if (topModal === 'talk') {
      if (e.key === 'Escape') { talkUi = null; render(); }
      return;
    }
    if (topModal === 'scene') {
      if (e.key === 'Escape') { closeScene(); render(); }
      else if ((e.key === ' ' || e.key === 'Enter') && !sceneBeats()[scene.beat].replies) { e.preventDefault(); actions['scene-next'](); render(); }
      return;
    }
    if (topModal === 'result') {
      if ([' ', 'Enter', 'Escape'].includes(e.key)) { e.preventDefault(); eventResult = null; render(); }
      return;
    }
    if (topModal === 'help') {
      if (e.key === 'Escape') { showHelp = false; render(); }
      return;
    }
    if (topModal === 'tutorial') {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        pressButton('.modal.tutorial [data-action=tutorial-done]');
      }
      return;
    }
  }
  if (match) {
    const k = fightKey({ key: e.key, revealing: performance.now() < revealingUntil, danger: !match.over && mortalDanger(match.a), over: match.over });
    if (k === 'finish-reveal') { e.preventDefault(); finishReveal(); return; }
    if (k === 'ignore') { e.preventDefault(); return; }
  }
  if (e.key === 'Escape' && !match && estateUi.movingItem) {
    estateUi.movingItem = null;
    render();
    return;
  }
  if (e.key === ' ' || e.key === 'Enter') {
    if (e.target.closest?.('button, summary')) return; // let focused buttons and fold-outs work as usual
    const roleBtn = e.target.closest?.('[role="button"][data-action]');
    if (roleBtn) {
      e.preventDefault();
      roleBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return;
    }
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
  clearTimeout(revealTimer);
  stopAllSounds();
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
