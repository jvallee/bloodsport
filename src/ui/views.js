// Ludus screens: top bar, week planner, fight day across arenas, estate, market and storeroom, help, Codex.

import { MAX_CAREERS } from '../careers.js';
import { WANTS, REBEL_QUESTS, GALLERY_INTRO } from '../quests.js';
import { FORTUNE, REANIMATE, LOUNGE, DEMAND, DEMANDS, RENOWN, decorComfort, PRESTIGE_LEVELS, BOSS_DEBUFFS, DECOR, ECONOMY, CIRCUITS, STRESS, FAVOR, PERKS, GEAR, XP, MORALE, CONSUMABLES, FESTIVAL_BY_ID, KINDS, TRAITS, CLASSES, WEAPONS, PATRONS, DECREES, AUGMENTS, RETIRE, RENAME, INJURY_BY_TAG, BRACKET, HOUSES, MERCY, SUMMONS, FEAR, HUMORS, HUMOUR_DRIFT, UNREST, ESPIONAGE, COMPANIONS, FORTUNE_RETUNE, FAVOR_DEBT, HADES } from '../data.js';
import { ACHIEVEMENTS, careerScore, bestFighter, unlockedPatrons, unlockedClasses, unlockText, levelFor, nextUnlock, unlocksAt, heatUnlocked, houseColours, dailyStreak, returningFor, LEGACY_LEVELS, HEAT, HOUSE_COLOURS } from '../legacy.js';
import { formatDate, weeksUntilTournament, isWinter, weeksUntilWinter, nextFestival, dateOf } from '../calendar.js';
import * as runApi from '../run.js';
import {
  boutFor, unlockedTiers, arenaName, arenaPower, circuitInfo, marketPrice, surgeonPrice, recruitBlocker, jobBlocker, surgeonBlocker, fightBlocker,
  skipBlocker, forfeitBlocker, advanceBlocker, releaseBlocker, perkBlocker, buyDecorBlocker, assignDecorBlocker, removeDecorBlocker,
  buyGearBlocker, equipBlocker, unequipBlocker, unequipAllBlocker, sellGearBlocker, sellPrice, decorCount, eventNames, eventChoiceBlocker, standings, houseOf, augmentBlocker, augmentPrice, retireBlocker, upcomingBouts, hasBracket, bracketOf, bracketRound, withdrawBlocker, opponentFor, tributeDue, tributePaid, payTributeBlocker, moraleTarget, GRAND_TIER, bossLossFavor, effectivePower, effectiveSpeed, fightPowers, recruitPrice, decorComfortOf, demandMet, activePolicies, hostPrice, hostBlocker, enactBlocker, prayPrice, prayBlocker, exhibitionBlocker, summonsBlocker, refuseSummonsBlocker, ritePrice, riteBlocker, stewardPlanBlocker, fortuneBlocker, rerollBlocker, rerollPrice,
  buyItemBlocker, raisable, reanimatePrice, reanimateBlocker, spareFavor, spareFavorWhy, owedLeft, winsOf, purseGold, stewardTask, stewardRewardText, risingProgress,
  trainGain, renameBlocker, dominantTemperament, espState, canNarrow, investigateBlocker, opTarget, opChance, covertOpBlocker,
  recruitedCompanionIds, getCompanionPool, companionPrice, companionBlocker,
  retunePrice, retuneBlocker, respecPrice, respecPerkBlocker, matchOptions,
  hadesPrice, reviveHadesPrice, hadesKeepWeeks, hadesRaisable, reviveHadesBlocker, restoreRevenantPrice, restoreRevenantBlocker, vulcanKeepWeeks,
  debtPenaltyFor, favorWritGold, favorLoanPrincipal, borrowFavorBlocker, payFavorDebtBlocker,
  activeHouseDebts, houseLoanPrincipal, borrowHouseBlocker, payHouseDebtBlocker,
  wantGoal, resolveDialogueTree, CORE_COMPANIONS, PERSONAL_TRAITS, LORE_KEEPSAKES,
} from '../run.js';
import { stepText, INTRO } from '../tutorial.js';
import {
  rosterCap, trainCap, trainCost, oracleLevel, maxLevel, effectAt,
} from '../ludus.js';
import { describeOdds } from '../odds.js';
import { fighterWarnings, arenaStakes } from '../explain.js';
import { gearText, slotLabel } from '../codex.js';
import { esc, safeColor, safeTone, button, buttonWhy, fighterCard, ICON, mercyChoices } from './components.js';
import { renderEstatePanel } from './estateView.js';
import { portrait, npcPortrait } from './portrait.js';
import { SPEAKERS, tipSpeaker, isStaffId, getStaffActor } from '../dialogue.js';
import { cityHeadlines } from '../gazette.js';
import { PREFECT } from '../plot.js';
import { EVENT_BY_ID, MOOD_WEEKS, choiceLabel, stakesText } from '../events.js';
import { RELICS, TAGS, KIND_LABELS, perkTags, fortuneTitle, fortuneText } from '../fortune.js';

const getSummonsPower = (run) => (typeof runApi.summonsPower === 'function' ? runApi.summonsPower(run) : arenaPower(run, SUMMONS.tier, 0));
const getIdleBlocker = (run) => (typeof runApi.idleBlocker === 'function'
  ? runApi.idleBlocker(run)
  : run.status !== 'active' ? 'The career is over.' : run.inMatch ? 'Finish the current match first.' : run.mercy ? 'Decide the beaten opponent\'s fate first.' : null);
function getBracketInfo(run, tier) {
  if (typeof runApi.bracketInfo === 'function') return runApi.bracketInfo(run, tier);
  if (!hasBracket(tier)) return null;
  const b = bracketOf(run, tier);
  const finalOpponent = run.arenas[tier].opponent;
  const earlyPurse = BRACKET.purse * tier;
  const earlyPrestige = BRACKET.prestigeTopOnly && tier !== run.topTier ? 0 : BRACKET.prestige;
  const round = b?.round ?? 0;
  const foes = b ? [...b.foes, finalOpponent] : [null, null, finalOpponent];
  const bout = boutFor(run, tier);
  return {
    tier,
    open: Boolean(b),
    round,
    fighterId: b?.fighterId ?? null,
    earlyPurse,
    earlyPrestige,
    rounds: BRACKET.rounds.map((label, index) => ({
      index,
      label,
      opponent: foes[index],
      power: foes[index] ? effectivePower(foes[index]) : null,
      gold: index < 2 ? earlyPurse : bout.winGold,
      prestige: index < 2 ? earlyPrestige : bout.winPrestige,
    })),
    nextOpponent: opponentFor(run, tier),
    finalOpponent,
  };
}

const JOBS = ['rest', 'trainPower', 'trainSpeed', 'medbay'];
// A season trains faster (trainGain), so the training labels name this career's gain.
const jobLabel = (run, job) => ({ rest: 'Rest', trainPower: `+${trainGain(run, 'power')} Power`, trainSpeed: `+${trainGain(run, 'speed')} Speed`, medbay: 'Medbay' })[job] ?? job;
const jobHelp = (run, job) => ({
  rest: `Rest: −${-STRESS.rest} Stress.`,
  trainPower: `Train Power: +${trainGain(run, 'power')} Power this week, +${STRESS.train} Stress.`,
  trainSpeed: `Train Speed: +${trainGain(run, 'speed')} Speed this week, +${STRESS.train} Stress. Speed decides who strikes first and makes you harder to wound.`,
  medbay: 'Medbay: heals injuries over weeks.',
})[job];

// ---------- Top bar ----------

// The Prestige hover: where you stand, what the next House level brings, and how Prestige moves.
function prestigeTip(run) {
  const lv = PRESTIGE_LEVELS[run.prestigeLevel - 1];
  const next = PRESTIGE_LEVELS[run.prestigeLevel];
  return [
    `Prestige ${run.prestige}. House level ${run.prestigeLevel} (kept forever): ${lv.plots} room plots, up to ${lv.maxFighters} fighters.`,
    next ? `Level ${next.level} at ${next.at} Prestige (${Math.max(0, next.at - run.prestige)} more): ${next.plots} plots, up to ${next.maxFighters} fighters, and new buildings.` : 'Your house is at the highest level.',
    'Won by beating your top arena\'s fights (lower arenas pay less). Every bout stakes a buy-in: you get it back with a win and lose it with a loss or capitulation.',
  ].join('\n');
}

export function topbar(run, tab, codexNew = 0, sound = true) {
  const next = PRESTIGE_LEVELS[run.prestigeLevel];
  const progress = next ? Math.min(100, (run.prestige / next.at) * 100) : 100;
  const tiers = CIRCUITS.map((c) => {
    const cls = c.tier < run.topTier ? 'won' : c.tier === run.topTier ? 'now' : '';
    return `<span class="step ${cls}" title="${esc(c.name)}">${c.tier}</span>`;
  }).join('') + `<span class="step crown ${run.topTier === GRAND_TIER ? 'now' : ''}" title="The Grand Tournament">${ICON.crown}</span>`;
  const tabIcon = (id) => (ICON[id] ? `<span class="tab-ico" aria-hidden="true">${ICON[id]}</span>` : '');
  const tabBtn = (id, label, badge = '') => `<button class="tab${tab === id ? ' on' : ''}" data-action="tab" data-tab="${id}">${label}${badge}${tabIcon(id)}</button>`;
  const marketBadge = run.liaisonOffers?.length || run.armourerStock.length ? '<span class="dot" title="New stock"></span>' : '';
  const codexBadge = codexNew ? `<span class="count" title="New Codex entries">${codexNew}</span>` : '';
  const levelUps = run.roster.filter((f) => f.pendingPerks.length).length;
  // 7.7: clues of a mole, or a covert op that could still run, wait in the Estate.
  const estateBadge = espState(run).clues.length || Object.keys(ESPIONAGE.ops).some((k) => !covertOpBlocker(run, k)) ? '<span class="dot" title="Whispers or covert ops waiting"></span>' : '';
  const ludusBadge = levelUps ? `<span class="count" title="Fighters waiting to choose a perk">${levelUps}</span>` : '';
  const low = run.favor <= FAVOR.warning;
  return `
    <div class="sticky-head">
      <header class="topbar">
        <div class="brand-row">
          <h1>BLOOD AND CIRCUS</h1>
          <div class="brand-tools">
            <button class="btn small icon-btn sound" data-action="toggle-sound" title="${sound ? 'Sound on: click to mute' : 'Sound off: click to turn on'}" aria-label="${sound ? 'Mute sound' : 'Turn sound on'}">${sound ? ICON.soundOn : ICON.soundOff}</button>
            <span class="top-actions">
              <button class="btn small" data-action="help">How to play</button>
              <button class="btn small" data-action="careers-open" title="Your saved careers: switch between them, or delete one">Careers</button>
              <button class="btn small" data-action="new-run" title="Start another career (this one stays in Careers)">New career</button>
              <button class="btn small ghost-util" data-action="bug-open" title="Something wrong or confusing? Send the developer a report they can replay.">Bug</button>
            </span>
            <details class="top-menu"><summary class="btn small icon-btn" aria-label="Menu">${ICON.menu}</summary><div class="top-menu-list">
              <button class="btn small" data-action="help">How to play</button>
              <button class="btn small" data-action="careers-open">Careers</button>
              <button class="btn small" data-action="new-run">New career</button>
              <button class="btn small" data-action="bug-open">Report a bug</button>
            </div></details>
          </div>
        </div>
        <div class="stats-strip">
          <div class="stat gold" title="Gold: pays for fighters, training, buildings, gear and tribute.">${ICON.gold}<b>${run.gold}</b></div>
          <div class="stat prestige" title="${esc(prestigeTip(run))}">${ICON.prestige}<b>${run.prestige}</b>
            <span class="lvl">Lv ${run.prestigeLevel}${next ? `<span class="lvlbar"><span style="width:${progress}%"></span></span><small class="lvl-to">${Math.max(0, next.at - run.prestige)} to Lv ${next.level}</small>` : ''}</span></div>
          <div class="favor${low ? ' low' : ''}" title="Imperial Favour: the Emperor's opinion of you. At 0 you are executed. Lost by Boss losses and forfeits in your top arena, capitulating there, crushing weak opponents, and unpaid tribute.">
            <span class="favor-lbl">Favour</span><span class="favorbar"><span style="width:${run.favor}%"></span></span><b>${run.favor}</b></div>
          ${run.unrest > 0 ? `<div class="stat unrest${run.unrest >= UNREST.warn ? ' high' : ''}" title="Unrest in the barracks: every Mutinous fighter adds to it each week, and it cools while nobody is Mutinous. At ${UNREST.warn} you are warned; at ${UNREST.threshold} the chains break and the house revolts.">⛓ <span>Unrest</span> <b>${run.unrest}/${UNREST.threshold}</b></div>` : ''}
          ${tributeStat(run)}
          <div class="track" title="Arena tiers">${tiers}</div>
        </div>
      </header>
      <nav class="tabs" aria-label="Main navigation">${tabBtn('ludus', 'Ludus', ludusBadge)}${tabBtn('estate', 'Estate', estateBadge)}${tabBtn('market', 'Market', marketBadge)}${tabBtn('codex', 'Codex', codexBadge)}</nav>
    </div>
    ${run.bouts && run.boutPending && tab === 'ludus' && !run.inMatch ? '<button class="jump-bout" data-action="jump-bout">⚔ Fight day ↓</button>' : ''}`;
}

// The coming bouts in your top arena, up to its Boss.
function scheduleStrip(run) {
  if (run.status !== 'active') return '';
  const items = upcomingBouts(run).map((b) => `<li class="${b.boss ? 'boss' : ''}${b.weeks === 0 ? ' now' : ''}"><b>${esc(b.stage)}</b><small>${b.weeks === 0 ? 'this week' : `in ${b.weeks} wk${b.weeks === 1 ? '' : 's'}`} · ${esc(dateOf(b.week).month)}${b.festival ? ` · 🏛 ${esc(b.festival)}` : ''}</small></li>`).join('');
  return `<div class="schedule"><div class="label">Coming up in ${esc(arenaName(run.topTier))}</div><ol>${items}</ol></div>`;
}

// The coming Gods' Day: what it favours, so you can plan for it.
function festivalNote(run) {
  const next = nextFestival(run.week);
  if (!next) return '';
  const f = next.festival;
  const when = next.weeks === 0 ? '<b>This tournament week</b>' : `In <b>${next.weeks}</b> week${next.weeks === 1 ? '' : 's'}`;
  return `<div class="festival${next.weeks === 0 ? ' now' : ''}">🏛 ${when}: <b>${esc(f.name)}</b> (${esc(f.god)}). ${esc(f.desc)}</div>`;
}

// Always-visible countdown to the Emperor's tribute.
function tributeStat(run) {
  const due = tributeDue(run);
  const weeks = weeksUntilWinter(run.week);
  if (tributePaid(run)) return '<div class="stat due paid" title="This year\'s tribute is already paid. The next one is due next winter.">⚖ <b>Tribute paid</b></div>';
  const short = run.gold < due && weeks <= 4;
  return `<div class="stat due${short ? ' short' : ''}" title="The Emperor's tribute: ${due} Gold, collected at the start of winter. You can pay early from the week panel. If you can't pay, he takes all your Gold and ${-FAVOR.unpaidTribute} Favour (it only ends the career if Favour hits 0).">⚖ <b>${due}</b> <small>in ${weeks} wk${weeks === 1 ? '' : 's'}</small></div>`;
}

// ---------- Banners ----------

// The end of a career: how it ended, its score, its best fighter, the fallen and the final standings.
// v6's hidden plot: the endings' titles, and a quiet line for a plot that started and went nowhere.
const ENDING_TITLES = { coup: '⛓ The Tyrant Falls', martyr: '⛓ The Rising Fails', treason: '⚖ Tried for Treason' };
function plotAftermath(run) {
  if (run.plot?.ended === 'cold' && !run.ending && !(run.epilogue ?? []).length) return '<p class="epilogue">Some say a different house could have changed the empire.</p>';
  if (run.plot?.ended === 'loyalist') return '<p class="epilogue">The Emperor remembers your loyalty. So does everyone else.</p>';
  return '';
}

export function endBanner(run, legacy = null) {
  const won = run.status === 'won';
  const deaths = run.fallen.length;
  const fought = run.history.filter((h) => !h.skipped && !h.forfeit);
  const wins = fought.filter((h) => h.won).length;
  const score = careerScore(run);
  const best = bestFighter(run);
  const bestWins = best ? winsOf(run, best) : 0;
  const rank = standings(run).findIndex((h) => h.you) + 1;
  const kills = [...run.roster, ...run.fallen].reduce((n, f) => n + (f.kills ?? 0), 0);
  return `<div class="banner end ${won ? 'win' : 'loss'}">
    <h2>${ENDING_TITLES[run.ending] ?? (won ? '👑 Master of the Games' : 'Your house has fallen')}</h2>
    <div>${esc(run.endReason)}</div>
    ${(run.epilogue ?? []).map((line) => `<p class="epilogue">${esc(line)}</p>`).join('')}
    ${plotAftermath(run)}
    <div class="end-score">${run.setup?.daily ? `⚜ The Emperor's Challenge, ${esc(run.setup.daily)} · ` : run.setup?.short ? 'Short career · ' : ''}${run.setup?.heat ? `🔥 Heat ${esc(run.setup.heat)} · ` : ''}Score <b>${score}</b>${run.setup?.daily && legacy ? ` · your best today ${Math.max(legacy.daily?.[run.setup.daily] ?? 0, score)}` : ''}${legacy ? ` · best ever ${Math.max(legacy.best, score)} · career ${esc(legacy.careers)}` : ''}</div>
    ${legacy ? legacyGain(legacy.past?.find((p) => p.seed === run.seed && p.weeks === run.week), legacy) : ''}
    <div class="end-grid">
      <div><div class="label">The career</div>${formatDate(run.week)}<br>${wins} won, ${fought.length - wins} lost · ${kills} kill${kills === 1 ? '' : 's'}<br>Top arena: ${esc(arenaName(run.topTier))}<br>House rank: #${rank} of ${standings(run).length} · Glory ${run.glory ?? 0}</div>
      ${best ? `<div class="end-best">${portrait(best, 64)}<div><div class="label">Best fighter</div><b>${esc(best.name)}</b> (${esc(KINDS[best.kind].name)})<br>${bestWins} win${bestWins === 1 ? '' : 's'} · Renown ${best.renown}${best.titles?.length ? `<br>🏆 ${esc(best.titles.join(', '))}` : ''}${best.alive ? '' : '<br>Fell in the arena'}</div></div>` : ''}
      ${deaths ? `<div><div class="label">The fallen</div><div class="fallen-faces">${run.fallen.map((f) => `<span class="fallen-face">${portrait(f, 40)}<small>${esc(f.name)}</small></span>`).join('')}</div></div>` : ''}
    </div>
    <div class="row"><button class="btn primary" data-action="new-run">New career</button><button class="btn" data-action="replay-seed">Replay seed ${esc(run.seed)}</button></div></div>`;
}

// Choosing how the next career starts (once a past career has unlocked anything).
// Today's date as YYYY-MM-DD (local time): the daily challenge's key.
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// Every saved career (src/careers.js): play another, or delete one for good.
export function careersModal(index, activeId) {
  const when = (t) => (t ? new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');
  const rows = index.list.map((e) => `<div class="career-row${e.id === activeId ? ' current' : ''}">
    <div><b>${esc(e.label)}</b><small>Seed ${esc(e.seed ?? '?')}${e.savedAt ? ` · saved ${esc(when(e.savedAt))}` : ''}</small></div>
    <div class="row">${e.id === activeId ? '<span class="chip">Playing</span>' : `<button class="btn small primary" data-action="career-load" data-id="${esc(e.id)}">Play</button><button class="btn small" data-action="career-delete" data-id="${esc(e.id)}">Delete</button>`}</div>
  </div>`).join('');
  return `<div class="modal careers" role="dialog" aria-modal="true" aria-label="Your careers"><div class="modal-body">
    <button class="close" data-action="careers-close" aria-label="Close">×</button>
    <h2>Your careers</h2>
    <p class="sub">Each career saves on its own, in this browser. Starting a new one keeps the others here. Up to ${MAX_CAREERS}.</p>
    ${rows}
    <div class="row"><button class="btn" data-action="new-run">New career</button><button class="btn small" data-action="careers-close">Close</button></div>
  </div></div>`;
}

export function setupModal(legacy, choice) {
  const patrons = unlockedPatrons(legacy);
  const patronList = [['', { name: 'No patron', desc: 'Start as the game intends.' }], ...patrons.map((p) => [p, PATRONS[p]])]
    .map(([id, p]) => `<label class="opt"><input type="radio" name="patron" value="${id}" ${choice.patron === id ? 'checked' : ''}> <b>${esc(p.name)}</b> <small>${esc(p.desc)}</small></label>`).join('');
  // Version 6: Heat replaces the decree checkboxes. Heat N plays the first N decrees (docs/plan-v6-phase3.md).
  const maxHeat = heatUnlocked(legacy);
  const heatOpt = (h) => {
    const d = h ? DECREES[HEAT.decrees[h - 1]] : null;
    const score = HEAT.decrees.slice(0, h).reduce((t, id) => t + DECREES[id].score, 0);
    return `<label class="opt"><input type="radio" name="heat" value="${h}" ${(choice.heat ?? 0) === h ? 'checked' : ''}> <b>${h ? `🔥 Heat ${h}: ${esc(d.name)}` : 'No Heat'}</b> <small>${h ? `${esc(d.desc)}${h > 1 ? ' And every rule below.' : ''} +${score} score if you win, +${Math.round(100 * HEAT.xpPerHeat * h)}% Legacy XP.` : 'The Emperor\'s usual rules.'}</small></label>`;
  };
  const heat = maxHeat
    ? Array.from({ length: maxHeat + 1 }, (_, h) => heatOpt(maxHeat - h)).join('') + (maxHeat < HEAT.decrees.length ? `<p class="sub">Win at Heat ${maxHeat} to unlock Heat ${maxHeat + 1}.</p>` : '')
    : '<p class="sub">Win a career to unlock Heat: harder rules for a higher score and more Legacy XP.</p>';
  const colours = houseColours(legacy);
  const colourList = colours.length > 1 ? `<div class="label">House colours</div><div class="colours">${colours.map((c) => `<label class="opt colour-opt house-${c}"><input type="radio" name="colour" value="${c}" ${(choice.colour ?? 'crimson') === c ? 'checked' : ''}> <span class="swatch"></span> ${esc(HOUSE_COLOURS[c])}</label>`).join('')}</div>` : '';
  const { level } = levelFor(legacy.xp ?? 0);
  const legends = returningFor(legacy).length;
  const unlocks = unlocksAt(level);
  const streak = dailyStreak(legacy, today());
  const classes = unlockedClasses(legacy);
  return `<div class="modal setup" role="dialog" aria-modal="true" aria-label="A new career"><div class="modal-body">
    <button class="close" data-action="setup-cancel" aria-label="Close">×</button>
    <h2>A new career</h2>
    <div class="label">Career length</div>
    <label class="opt"><input type="radio" name="length" value="short" ${choice.short === false ? '' : 'checked'}> <b>A season</b> <small>Each arena: Tournament → Boss, with richer purses and a head start. About an hour.</small></label>
    <label class="opt"><input type="radio" name="length" value="full" ${choice.short === false ? 'checked' : ''}> <b>The Long Road</b> <small>Each arena: Tournament 1 → Tournament 2 → Boss. A few hours.</small></label>
    <div class="daily"><b>⚜ The Emperor's Challenge</b>${streak ? ` <span class="chip streak">🔥 ${streak}-day streak</span>` : ''} <small>Today's short career: the same seed for everyone today, with no patron, Heat or Legacy unlocks.${legacy.daily?.[today()] ? ` Your best today: <b>${esc(legacy.daily[today()])}</b>.` : ''}</small>
      <button class="btn small" data-action="daily-challenge">Take today's challenge</button></div>
    <div class="label">Patron</div>${patronList}
    <div class="label">Heat</div>${heat}
    ${colourList}
    ${unlocks.length ? `<p class="sub">Legacy level ${level}: ${unlocks.filter((u) => !u.id.startsWith('colour:')).map((u) => esc(u.name)).join(', ')}${legends && unlocks.some((u) => u.id === 'legends') ? ` (${legends} legend${legends > 1 ? 's' : ''} may return)` : ''}.</p>` : ''}
    ${classes.length ? `<p class="sub">Unlocked classes in the market: ${classes.map((c) => esc(CLASSES[c].name)).join(', ')}.</p>` : ''}
    <div class="row"><button class="btn primary" data-action="start-career">Begin</button><button class="btn" data-action="setup-cancel">Cancel</button></div>
  </div></div>`;
}

// Achievements: earned ones and what the rest would unlock.
export function legacyPanel(legacy) {
  const rows = ACHIEVEMENTS.map((a) => {
    const got = legacy.achievements.includes(a.id);
    if (a.secret && !got) return '<li class="secret"><b>☆ ???</b>: a secret of the empire.</li>';
    return `<li class="${got ? 'got' : ''}"><b>${got ? '★' : '☆'} ${esc(a.name)}</b>: ${esc(a.desc)} <small>${esc(unlockText(a))}</small></li>`;
  }).join('');
  const past = legacy.past.map((p) => `<li>${p.won ? '👑' : '⚰'} Seed ${esc(p.seed)}: score <b>${esc(p.score)}</b>, ${esc(p.weeks)} weeks${p.endReason ? ` · ${esc(p.endReason)}` : ''}</li>`).join('');
  const hall = (legacy.hall ?? []).map((l) => `<div class="legend" title="${esc((l.story ?? []).map((e) => e.text).join(' '))}">${portrait(l, 48)}<div><b>${esc(l.name)}</b><br><small>${esc(l.wins)} win${l.wins === 1 ? '' : 's'} · ${esc(l.kills)} kill${l.kills === 1 ? '' : 's'}${l.titles?.length ? ` · ${esc(l.titles.join(', '))}` : ''}</small></div></div>`).join('');
  const { level } = levelFor(legacy.xp ?? 0);
  const tree = LEGACY_LEVELS.map((u, i) => `<li class="${level >= i + 2 ? 'got' : ''}"><b>${level >= i + 2 ? '★' : '☆'} Level ${i + 2}: ${esc(u.name)}</b> <small>${esc(u.desc)}</small></li>`).join('');
  return `<section class="panel legacy"><h2>Legacy <small>level ${level} · ${legacy.achievements.length}/${ACHIEVEMENTS.length} achievements · ${esc(legacy.careers)} career${legacy.careers === 1 ? '' : 's'} · best score ${esc(legacy.best)}${heatUnlocked(legacy) ? ` · Heat ${heatUnlocked(legacy)} unlocked` : ''}</small></h2>
    ${legacyBar(legacy.xp ?? 0)}
    <p class="sub">Every career earns Legacy XP, win or lose, and every level unlocks something for the careers after it. Achievements unlock patrons and classes.</p>
    <h3 class="mini">The Legacy tree</h3><ul class="achievements tree">${tree}</ul>
 ${hall ? `<h3 class="mini">Hall of Champions</h3><div class="hall">${hall}</div>` : ''}
    <ul class="achievements">${rows}</ul>${past ? `<h3 class="mini">Past careers</h3><ul class="past">${past}</ul>` : ''}</section>`;
}

// Version 6: the Legacy level bar. `from` (XP before this career) animates the fill from where it was.
export function legacyBar(xp, from = null) {
  const now = levelFor(xp);
  const before = from === null ? null : levelFor(from);
  const start = before && before.level === now.level ? before.into / before.need : 0;
  const next = nextUnlock({ xp });
  return `<div class="legacy-bar" style="--from:${(100 * start).toFixed(1)}%;--to:${(100 * now.into / now.need).toFixed(1)}%">
    <div class="legacy-level">Legacy level <b>${now.level}</b></div>
    <div class="bar"><div class="fill"></div></div>
    <small>${now.into}/${now.need} XP${next ? ` · next, at level ${next.level}: <b>${esc(next.name)}</b>` : ''}</small></div>`;
}

// Version 6: what this career gave the Legacy (the end screen). `entry` is its record from recordCareer.
function legacyGain(entry, legacy) {
  if (!entry?.xp) return '';
  const unlocked = (entry.unlocked ?? []).map((id) => LEGACY_LEVELS.find((u) => u.id === id)).filter(Boolean);
  const xpAfter = entry.xpBefore + entry.xp;
  const streak = entry.daily ? dailyStreak(legacy, entry.daily) : 0;
  return `<div class="legacy-gain">
    <div class="label">Legacy</div>
    <div class="xp-lines">${entry.xpLines.map((l) => `<span>${esc(l.label)} <b>+${l.xp}</b></span>`).join('')}</div>
    <div class="xp-total">+${entry.xp} Legacy XP${streak > 1 ? ` · 🔥 ${streak}-day streak` : ''}</div>
    ${legacyBar(xpAfter, entry.xpBefore)}
    ${entry.to > entry.from ? `<div class="level-up">Legacy level ${entry.to}!</div>` : ''}
    ${unlocked.map((u) => `<div class="unlock-new">New: <b>${esc(u.name)}</b>. ${esc(u.desc)}</div>`).join('')}
    ${entry.newHeat ? `<div class="unlock-new">New: <b>🔥 Heat ${entry.newHeat}</b>, ${esc(DECREES[HEAT.decrees[entry.newHeat - 1]].name)}. Harder rules, a higher score and more XP.</div>` : ''}
  </div>`;
}

// A notice when something is earned mid-career.
export const achievementNotice = (a) => `<div class="banner achievement"><h2>★ Achievement: ${esc(a.name)}</h2><div>${esc(a.desc)} ${esc(unlockText(a))} (from your next career)</div></div>`;

const plus = (n) => `${n >= 0 ? '+' : ''}${n}`;

export function summaryBanner(s) {
  if (!s) return '';
  const verdict = s.reason === 'towel' ? 'capitulated' : s.died ? 'was slain' : s.won ? 'won' : 'lost';
  const bits = [`${plus(purseGold(s))} Gold`, `${plus(s.prestige)} Prestige`];
  if (s.xp && !s.died) bits.push(`${plus(s.xp)} XP`);
  if (s.renown) bits.push(`${plus(s.renown)} Renown`);
  if (s.favor) bits.push(`${plus(s.favor)} Favour`);
  if (s.title) bits.push(`🏆 ${s.fighter} earns ${s.titlePower > 1 ? 'the titles' : 'the title'} "${s.title}"${s.title === 'Master of the Games' ? '' : ` (+${s.titlePower ?? 1} Power)`}`);
  if (s.nemesis) bits.push(`☠ Nemesis beaten: ${s.nemesis}`);
  if (s.hype?.renown || s.hype?.gold) bits.push(`📣 Crowd hype ${s.hype.hype}`);
  if (s.bet) bits.push(s.bet.won ? `🪙 Bet won: ${s.bet.payout} Gold back (+${s.bet.payout - s.bet.stake} profit)` : `🪙 Bet lost: ${s.bet.stake} Gold`);
  if (s.bloodied) bits.push(`🩸 Bloodied Victory: won with 2+ injuries (extra Favour, Renown, XP and Morale)`);
  if (s.kill) bits.push(`💀 A kill${s.mark ? `: ${s.fighter} earns the mark "${s.mark}"` : ''}`);
  if (s.next) bits.push(`🏟 On to the ${s.next}`);
  if (s.feud) bits.push(`⚔ ${s.feud}`);
  if (s.scar) bits.push(`🩹 ${s.fighter} is scarred: ${s.scar}`);
  if (s.eulogy) bits.push(`⚰ ${s.eulogy}`);
  if (s.saved) bits.push(`🪙 ${s.fighter} fell, but Proserpina's Coin carried them out alive`);
  if (s.wager) bits.push(s.wager.won ? `🎲 The Fates' Wager won: +${s.wager.gold} Gold` : `🎲 The Fates' Wager lost: ${s.wager.gold} Gold`);
  if (s.loot) bits.push(`⚒ Claimed a ${GEAR[s.loot].name}`);
  if (s.injuries?.length) bits.push(`🩸 ${s.fighter} is now ${s.injuries.join(' and ')}: send them to the Medbay`);
  if (s.crushing) bits.push('The crowd jeered the mismatch');
  if (s.bloodFaith) bits.push('Blood Faith refunded the buy-in');
  if (s.refund) bits.push('reaching the Boss returned the buy-in');
  if (s.levelUp) bits.push(`⭐ House Prestige level ${s.levelUp}! Visit the Estate.`);
  return `<div class="banner ${s.won ? 'win' : 'loss'}${s.injuries?.length ? ' hurt' : ''}"><button class="close" data-action="dismiss-summary" data-key="${esc(summaryKey(s))}" aria-label="Dismiss">×</button>
    <h2>${esc(s.name)}: ${esc(s.fighter)} ${verdict}</h2><div>${bits.map(esc).join(' · ')}</div></div>`;
}

// Several notifications share one slot; arrows page through them.
export function noticePager(items, page = 0) {
  if (!items.length) return '';
  if (items.length === 1) return items[0];
  const p = Math.min(page, items.length - 1);
  const nav = `<div class="pager" role="navigation" aria-label="Notifications">
    <button class="btn small" data-action="notice-page" data-page="${(p - 1 + items.length) % items.length}" aria-label="Previous">‹</button>
    <span>${p + 1} / ${items.length} notifications</span>
    <button class="btn small" data-action="notice-page" data-page="${(p + 1) % items.length}" aria-label="Next">›</button></div>`;
  return `<div class="notices">${nav}${items[p]}</div>`;
}

// The tutorial is your steward talking (src/dialogue.js). In the Ludus a tip opens as a dialogue box; on the fight screen it
// stays inline, so it never blocks a fight.
export function tutorialCard(step, where = 'ludus') {
  if (!step) return '';
  const who = SPEAKERS[tipSpeaker];
  const actions = `<button class="btn small primary" data-action="tutorial-done" data-step="${step.id}">Got it</button>
    <button class="link small" data-action="tutorial-skip">Skip tutorial</button>`;
  if (where === 'ludus') return dialogueBox({ speaker: tipSpeaker, title: step.title, html: step.body }, actions, 'tutorial');
  return `<div class="tip tutorial ${where}" role="note">${npcPortrait(who.portrait, 44)}
    <div><div class="tip-title">${esc(who.name)}: ${step.title}</div><div>${step.body}</div></div>
    <div class="tip-actions">${actions}</div></div>`;
}

// A character speaking: portrait, name, and what they say (one beat). `actions` are the buttons.
function dialogueBox(beat, actions, kind = 'scene') {
  // A fighter who speaks (the rebel's confession) shows their own name and face.
  const who = beat.fighter ? { name: beat.fighter.name } : SPEAKERS[beat.speaker] ?? SPEAKERS.narrator;
  const face = beat.fighter ? portrait(beat.fighter, 72) : npcPortrait(who.portrait, 72);
  const body = beat.html ?? `<p>${esc(beat.text)}</p>`;
  return `<div class="modal dialogue ${kind}" role="dialog" aria-modal="true" aria-label="${esc(who.name || beat.title || 'Story')}"><div class="modal-body dialogue-body speaker-${esc(beat.speaker)}">
    <div class="dialogue-speaker">${face}<div>${who.name ? `<div class="dialogue-name">${esc(who.name)}</div>` : ''}${beat.title ? `<h2>${beat.title}</h2>` : ''}</div></div>
    <div class="dialogue-text">${body}</div>
    <div class="dialogue-actions">${actions}</div>
  </div></div>`;
}

// What just happened, after an event card's choice (playtest: the result only went to the house log).
// End week would overtrain someone: the steward asks first, once per career (the designer, 5.4.0).
export function overtrainModal(list) {
  const names = list.map((f) => `<b>${esc(f.name)}</b> (Stress ${f.stress})`);
  const who = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0];
  const html = `<p>Before you end the week: another week of training and ${who} will be <b>Overtrained</b> (Stress ${STRESS.overtrained}+).</p>
    <p>An overtrained fighter can't train, and fights at −1 Power with one ability switched off, until Rest brings their Stress down.</p>`;
  const actions = `<button class="btn small" data-action="overtrain-back">Back</button><span class="ask-choices"><button class="btn" data-action="overtrain-go">Train anyway</button><button class="btn primary" data-action="overtrain-go" data-rest="1" autofocus>Rest ${list.length > 1 ? 'them' : esc(list[0].name)} this week</button></span>`;
  return dialogueBox({ speaker: 'steward', title: 'Overtraining', html }, actions, 'ask');
}

// Ending a fight week with fighters who could still fight (7.9.2/7.11, the designer).
const joinList = (items) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items.at(-1)}` : items[0] ?? '');
export function freeFightModal(free) {
  const who = joinList(free.fighters.map((f) => `<b>${esc(f.name)}</b>`));
  const arenas = joinList(free.tiers.map((t) => esc(arenaName(t))));
  const html = `<p>It's still fight day. ${who} could fight in ${arenas}, and ${free.fighters.length > 1 ? "they haven't" : "hasn't"} fought yet.</p>
    <p>Every match pays Gold and XP, even a loss (the buy-in is Prestige). End the week now and today's fights are gone.</p>`;
  const actions = `<button class="btn small" data-action="freefight-back" autofocus>Back to the fights</button><span class="ask-choices"><button class="btn" data-action="freefight-go">End the week anyway</button></span>`;
  return dialogueBox({ speaker: 'steward', title: 'Fighters still free', html }, actions, 'ask');
}

export function resultModal(title, lines) {
  // A gamble's outcome leads, in large type (playtest: "It went badly" was buried mid-sentence).
  const text = lines.map((l) => l.text).join(' ');
  const outcome = /it went well/i.test(text) ? '<div class="outcome good">✔ It went well</div>' : /it went badly/i.test(text) ? '<div class="outcome bad">✘ It went badly</div>' : '';
  lines = lines.map((l) => ({ ...l, text: l.text.replace(/,? ?[Ii]t went (well|badly),? ?/, ' ').replace(/\s+\./, '.').replace(/\s{2,}/g, ' ').trim() }));
  const html = `${outcome}<ul class="result-lines">${lines.map((l) => `<li class="${safeTone(l.tone)}">${esc(l.text)}</li>`).join('')}</ul>`;
  return dialogueBox({ speaker: 'narrator', title: esc(title), html }, '<span></span><button class="btn primary" data-action="result-close" autofocus>Continue</button>', 'result');
}

// A scene from src/dialogue.js, one beat at a time.
export function dialogueModal(scene, beats, index) {
  // A beat with replies: you answer in your own words (each reply's lines play next).
  if (beats[index].replies) {
    const replies = beats[index].replies.map((r, i) => `<button class="btn reply" data-action="scene-reply" data-index="${i}">${esc(r.label)}</button>`).join('');
    return dialogueBox(beats[index], `<span class="dialogue-you">You:</span><span class="row replies">${replies}</span>`);
  }
  const last = index >= beats.length - 1;
  const dots = beats.length > 1 ? `<span class="dots">${beats.map((_, i) => `<i class="${i === index ? 'on' : ''}"></i>`).join('')}</span>` : '';
  const actions = `${dots}<span class="row">${last ? '' : '<button class="link" data-action="scene-skip">Skip</button>'}
    <button class="btn primary" data-action="scene-next" autofocus>${last ? (scene === 'opening' ? 'Enter the Ludus' : 'Continue') : 'Next'}</button></span>`;
  return dialogueBox(beats[index], actions);
}

export function introModal(page, pages) {
  const p = pages[page];
  const dots = pages.map((_, i) => `<i class="${i === page ? 'on' : ''}"></i>`).join('');
  const last = page === pages.length - 1;
  return `<div class="modal intro" role="dialog" aria-modal="true" aria-label="${esc(p.title)}"><div class="modal-body">
    <div class="intro-kicker">Blood and Circus</div>
    <h2>${p.title}</h2>${p.body}
    <div class="intro-nav"><span class="dots">${dots}</span>
      <span class="row">${page > 0 ? '<button class="btn" data-action="intro-back">Back</button>' : '<button class="link" data-action="intro-close">Skip intro</button>'}
      <button class="btn primary" data-action="${last ? 'intro-close' : 'intro-next'}">${last ? 'Enter the Ludus' : 'Next'}</button></span></div>
  </div></div>`;
}

// ---------- Ludus tab ----------

// Quests (5.4.0): the steward's assignment, what fighters want, the cause's requests, and the Whispering Gallery's readout.
function questsPanel(run) {
  const task = stewardTask(run);
  const weeksLeft = (until) => (until === null || until === undefined ? '' : ` <small>· ${Math.max(0, until - run.week)} wk left</small>`);
  const wants = run.roster.filter((f) => f.want).map((f) => `<li>💬 <b>${esc(f.name)}</b> wants: ${esc(wantGoal(f.want))}${weeksLeft(f.want.until)}</li>`);
  const cause = (run.quests?.rebel ?? []).map((q) => `<li>⛓ <b>The cause</b> asks: ${esc(REBEL_QUESTS[q.id].goal(q))}${weeksLeft(q.until)}</li>`);
  const rising = risingProgress(run);
  const gallery = rising ? `<div class="gallery-readout" title="${esc(GALLERY_INTRO)}">👁 <b>Whispering Gallery</b> · the palace's suspicion <b>${rising.suspicion}</b>/100 <small>(watched at ${rising.watch}, informers at ${rising.informer}, a raid at ${rising.raid})</small>
    <span class="susbar"><span style="width:${Math.min(100, rising.suspicion)}%"></span></span>
    <div>The rising: <b>${esc(rising.label)}</b>${rising.needs.length ? ` · still needs ${esc(rising.needs.join(', '))}` : ''}${rising.waiting ? ` · ${esc(rising.waiting)}` : ''}</div>
    ${rising.prefect ? `<div class="prefect-posture">${esc(PREFECT)}: <b>${esc(rising.prefect)}</b></div>` : ''}</div>` : '';
  const items = [
    task ? `<li>🏛 <b>The steward</b> asks: ${esc(task.goal)}${stewardRewardText(task) ? ` <small>· ${stewardRewardText(task)}</small>` : ''}</li>` : '',
    ...wants, ...cause,
  ].filter(Boolean);
  if (!items.length && !gallery) return '';
  return `<details class="more quests" data-key="quests" open><summary>📜 Quests</summary><ul class="quest-list">${items.join('')}</ul>${gallery}</details>`;
}

// Word in the city (7.11): reactive street headlines around the Ludus.
function gazettePanel(run) {
  const headlines = cityHeadlines(run, 3);
  if (!headlines.length) return '';
  return `<details class="more gazette" data-key="gazette" open><summary>📰 Word in the city</summary><ul class="gazette-list">${headlines.map((h) => `<li>${h.icon} ${esc(h.text)}</li>`).join('')}</ul></details>`;
}

// Version 6: the house's relics, one chip each (hover or focus for what it does).
function relicStrip(run) {
  if (!run.relics?.length) return '';
  const chips = run.relics.map((id) => `<span class="relic-chip rarity-${RELICS[id].rarity}" tabindex="0">🏺 ${esc(RELICS[id].name)}<small>${esc(RELICS[id].desc)}</small></span>`).join('');
  return `<div class="relics"><span class="label">Relics ${run.relics.length}/${FORTUNE.maxRelics}</span>${chips}</div>`;
}

// v8.0 Treasury & Credit: Imperial Favour Debt (Legate Cassian Vane & Censor Numerius Gallo) + Rival House Credit.
function treasuryDebtPanel(run) {
  const fDebt = run.favorDebt;
  const hDebts = activeHouseDebts(run);
  const writGold = favorWritGold(run);
  const loanPrincipal = favorLoanPrincipal(run);
  const loanOwed = Math.round(loanPrincipal * FAVOR_DEBT.loanVigourish);
  const activeCount = (fDebt?.owed > 0 ? 1 : 0) + hDebts.length;
  const houseRows = (run.houses ?? []).map((h) => {
    const pen = debtPenaltyFor(h);
    const principal = houseLoanPrincipal(run, h);
    const owed = Math.round(principal * ((h.owed ?? 0) > 0 ? 1 : 1.2));
    return `<div class="shop-row">
      <div><span class="house-dot" style="background:${safeColor(h.color)}"></span><b>${esc(h.name)}</b> ${pen ? `<span class="chip small bad">${esc(pen.label)} · ${h.debt.owed}g owed</span>` : `<small>Advance +${principal}g (${owed}g owed)</small>`}<br>
      <small>${pen ? `Their fighters gain +${pen.power} Power, +${pen.win / 1000}% win${pen.injure ? `, +${pen.injure / 1000}% injure` : ''}${pen.garnish ? ` and garnish ${Math.round(pen.garnish * 100)}% of win purses` : ''} against you.` : 'While indebted, their fighters fight harder against you (+3% win immediately, escalating each unpaid month).'}</small></div>
      <div class="row tight">
        ${pen
          ? button(`Repay (${Math.min(run.gold, h.debt.owed)}g)`, 'pay-house-debt', { id: h.id }, payHouseDebtBlocker(run, h.id), 'btn small primary')
          : button(`Borrow +${principal}g`, 'borrow-house', { id: h.id }, borrowHouseBlocker(run, h.id), 'btn small')}
      </div>
    </div>`;
  }).join('');
  return `<details class="more debt-panel" data-key="debt-panel"${activeCount ? ' open' : ''}>
    <summary>⚖ Palatine &amp; Rival House Credit${activeCount ? ` <span class="chip small warn">${activeCount} active loan${activeCount === 1 ? '' : 's'}</span>` : ''}</summary>
    <div class="debt-box">
      <div class="label">Legate Cassian Vane &amp; Censor Numerius Gallo · Imperial Favour Credit</div>
      ${fDebt?.owed > 0
        ? `<div class="shop-row"><div><b>Active Palatine Loan: ${fDebt.owed} Gold owed</b> <small>(Month ${fDebt.monthsElapsed ?? 0}/${FAVOR_DEBT.termMonths}${fDebt.monthsElapsed > FAVOR_DEBT.termMonths ? ' · OVERDUE' : ''})</small><br><small>Censor Gallo deducts ${fDebt.monthsElapsed >= FAVOR_DEBT.termMonths ? -FAVOR_DEBT.overdueFavorInterest : -FAVOR_DEBT.monthlyFavorInterest} Favour at the start of each month until settled. Repaying on time restores +${FAVOR_DEBT.onTimeRepayFavor} Favour.</small></div>
          ${button(`Repay (${Math.min(run.gold, fDebt.owed)}g)`, 'pay-favor-debt', {}, payFavorDebtBlocker(run), 'btn small primary')}</div>`
        : `<div class="shop-row"><div><b>Palatine Loan</b> · +${loanPrincipal} Gold now (${loanOwed} Gold owed, ${FAVOR_DEBT.loanSealFavor} Favour seal fee)<br><small>${FAVOR_DEBT.termMonths}-month term (${FAVOR_DEBT.monthlyFavorInterest} Favour/mo; ${FAVOR_DEBT.overdueFavorInterest} Favour/mo and arrears if overdue).</small></div>
          ${button(`Borrow +${loanPrincipal}g`, 'borrow-favor', { kind: 'loan' }, borrowFavorBlocker(run, 'loan'), 'btn small')}</div>`}
      <div class="shop-row"><div><b>Sell a Palatine Writ</b> · +${writGold} Gold now for −${FAVOR_DEBT.writFavorCost} Imperial Favour<br><small>Immediate coin with no recurring debt (once a month, requires ${FAVOR_DEBT.writMinFavor}+ Favour).</small></div>
        ${button(`Sell Writ (+${writGold}g)`, 'borrow-favor', { kind: 'writ' }, borrowFavorBlocker(run, 'writ'), 'btn small')}</div>
      <div class="label">Rival House Credit (up to 2 active loans)</div>
      ${houseRows}
    </div>
  </details>`;
}

function weekPanel(run) {
  const until = weeksUntilTournament(run.week);
  const status = run.boutPending
    ? '<div class="when now">⚔ Tournament week!</div>'
    : run.bouts
      ? '<div class="when">Your top arena\'s bout is settled. Send fighters to other open arenas, or end the week.</div>'
      : `<div class="when">${isWinter(run.week) ? '❄ Winter Dead Season: no tournaments. Heal, train and build. ' : ''}Next tournament in <b>${until}</b> week${until === 1 ? '' : 's'}.</div>`;
  const blocked = advanceBlocker(run);
  const toTribute = weeksUntilWinter(run.week);
  const due = tributeDue(run);
  const tribute = toTribute > 0 && toTribute <= 4 && !tributePaid(run)
    ? `<div class="tribute${run.gold < due ? ' short' : ''}">⚖ The Emperor's tribute of <b>${due} Gold</b> is due in <b>${toTribute}</b> week${toTribute === 1 ? '' : 's'}. You have ${run.gold}.${run.gold < due ? ` Short by ${due - run.gold}: if you can't pay, the Emperor takes all your Gold and ${-FAVOR.unpaidTribute} Favour.` : ''}</div>`
    : '';
  const recent = run.log.slice(-9).reverse().map((l) => `<li class="${safeTone(l.tone)}">${esc(l.text)}</li>`).join('');
  return `
    <section class="panel week">
      <h2>${formatDate(run.week)}</h2>
      ${status}
      ${scheduleStrip(run)}
      ${relicStrip(run)}
      ${festivalNote(run)}
      ${tribute}
      ${run.summons ? `<div class="demand summons">⚜ <b>The Emperor's summons:</b> on this month's fight day, send one of your fighters to the Imperial Coliseum against one of its regulars (Power ${getSummonsPower(run)}), or refuse him and lose ${-SUMMONS.refuseFavor} Favour.</div>` : ''}
      ${run.demand ? `<div class="demand${demandMet(run) ? ' met' : ''}">⚜ <b>The Emperor demands:</b> ${esc(DEMANDS[run.demand.id].goal)}, by the end of this month's fight day. ${demandMet(run) ? '✔ Done: he will be pleased.' : `Reward: +${DEMAND.favor} Favour and Gold; missing it costs ${-DEMAND.missFavor} Favour.`}</div>` : ''}
      <div class="row">
        ${run.bouts ? button('End week', 'advance', {}, blocked, 'btn primary') : `${button(`⚔ To fight day <small>(${weeksUntilTournament(run.week)} wk${weeksUntilTournament(run.week) === 1 ? '' : 's'})</small>`, 'advance-tournament', {}, blocked, 'btn primary')}
        ${button('End week', 'advance', {}, blocked, 'btn')}`}
        ${run.roster.length ? button('📋 Steward\'s plan', 'steward-plan', {}, stewardPlanBlocker(run), 'btn', 'Sets everyone\'s job: the hurt to the Medbay, the tired to Rest, the rest to training while there are rooms.') : ''}
      </div>
      ${blocked && !run.boutPending ? `<div class="why-not">${esc(blocked)}</div>` : ''}
      <p class="sub">Each fighter does their job once per week. Jobs stay set until you change them.
        ${tributePaid(run) ? '<span class="good">✔ Tribute already paid for this year.</span> The next one is due next winter.' : `Tribute of <b>${tributeDue(run)} Gold</b> is due in ${toTribute} week${toTribute === 1 ? '' : 's'}. ${buttonWhy('Pay now', 'pay-tribute', {}, payTributeBlocker(run), 'btn small')}`}</p>
      ${questsPanel(run)}
      ${standingsTable(run)}
      ${treasuryDebtPanel(run)}
      ${friendsOutside(run)}
      ${gazettePanel(run)}
      <h3 class="mini">House log</h3>
      <ul class="log">${recent}</ul>
      ${run.log.length > 9 ? `<details class="more" data-key="full-log"><summary>Full house log (${run.log.length} entries)</summary>
        <ul class="log full">${[...run.log].reverse().map((l) => `<li class="${safeTone(l.tone)}"><small>${esc(formatDate(l.week))}</small> ${esc(l.text)}</li>`).join('')}</ul></details>` : ''}
    </section>`;
}

// A nemesis is back: what they've done to your house, and what beating them is worth.
function nemesisNote(f) {
  const n = f.nemesis;
  return `<div class="warn nemesis-note">☠ <b>${esc(f.name)} ${esc(n.epithet)}</b> has beaten your house ${n.wins} time${n.wins === 1 ? '' : 's'}${n.victims.length ? ` and killed ${esc(n.victims.join(' and '))}` : ''}. They fight at +${n.bonus} Power for it. Beat them for Renown, Gold and Favour.</div>`;
}

// A three-match tournament: who waits in each round, and where your fighter is.
function bracketLine(run, tier) {
  const info = getBracketInfo(run, tier);
  if (!info) return '';
  const steps = info.rounds.map((r) => {
    const state = !info.open ? '' : r.index < info.round ? ' done' : r.index === info.round && info.fighterId ? ' now' : '';
    const sub = r.opponent ? `${esc(r.opponent.name)} · Power ${r.power} · Speed ${effectiveSpeed(r.opponent)}` : 'drawn on tournament week';
    return `<li class="${state.trim()}"><b>${esc(r.label)}</b><small>${sub}</small></li>`;
  }).join('');
  const who = info.fighterId && info.round > 0 ? findName(run, info.fighterId) : null;
  const earlyPay = `Early wins: +${info.earlyPurse} Gold${info.earlyPrestige ? `, +${info.earlyPrestige} Prestige` : ''}.`;
  return `<div class="bracket"><div class="label">Three matches: win all three to take the tournament${who ? `. ${esc(who)} is through to the ${esc(BRACKET.rounds[info.round])}` : ''}. <small>${earlyPay}</small></div><ol>${steps}</ol>
    ${who ? buttonWhy(`Withdraw ${esc(who)} (counts as capitulating)`, 'withdraw', { tier }, withdrawBlocker(run, tier), 'btn small danger') : ''}</div>`;
}
const findName = (run, id) => run.roster.find((f) => f.id === id)?.name ?? '';

// "Opponent · House Varro", in the house's colour.
export function houseTag(run, f) {
  const h = houseOf(run, f);
  if (!h) return 'Opponent';
  const left = (n) => `${n} month${n === 1 ? '' : 's'} left`;
  const grudge = h.feud ? ` · ⚔ feud: +1 Power against you, ${left(h.feud)}` : h.owed ? ` · owes you a life: −1 Power against you, ${left(h.owed)}` : '';
  const vengeance = h.vengeance ? ` · vengeance: +5% win chance for you, ${left(h.vengeance)}` : '';
  const pen = debtPenaltyFor(h);
  const debtNote = pen ? ` · 📜 ${esc(pen.label)}: +${pen.power} Power, +${pen.win / 1000}% win (${h.debt.owed}g owed)` : '';
  return `Opponent · <span style="color:${safeColor(h.color)}">${esc(h.name)}</span>${grudge}${vengeance}${debtNote}`;
}

// The rival houses and your place among them.
const CELL_NOTE = { officer: 'an old soldier', scribe: 'a palace clerk', priest: 'a priest', courier: 'a runner' };
function friendsOutside(run) {
  const freed = run.plot?.freed ?? [];
  if (!freed.length) return '';
  return `<h3 class="mini">Friends outside the walls</h3><ul class="log">${freed.map((c) => `<li class="${c.caught ? 'bad' : 'good'}">${esc(c.name)}, ${CELL_NOTE[c.cell] ?? 'a friend'}${c.caught ? ' (taken by the Praetorians)' : ''}</li>`).join('')}</ul>`;
}

export function standingsTable(run) {
  if (!run.houses) return '';
  const rows = standings(run).map((h, i) => {
    const pen = !h.you ? debtPenaltyFor(h) : null;
    const notes = [h.feud ? `<span class="feud" title="You killed one of theirs: their fighters get +1 Power against you">⚔ feud · ${h.feud} month${h.feud === 1 ? '' : 's'} left</span>` : '',
      h.owed && !h.feud ? `<span class="vengeance" title="You spared one of theirs when the crowd wanted blood: their fighters get −1 Power against you">owes you a life · ${h.owed} month${h.owed === 1 ? '' : 's'} left</span>` : '',
      h.vengeance ? `<span class="vengeance" title="They killed one of yours: your fighters get +5% win chance against them">vengeance · ${h.vengeance} month${h.vengeance === 1 ? '' : 's'} left</span>` : '',
      pen ? `<span class="feud" title="${esc(pen.label)}: their fighters gain +${pen.power} Power and +${pen.win / 1000}% win against you until repaid">📜 ${h.debt.owed}g debt (${pen.months} mo)</span>` : ''].join('');
    return `<tr class="${h.you ? 'you' : ''}"><td>${i + 1}</td><td><span class="house-dot" style="background:${safeColor(h.color)}"></span>${esc(h.name)}${h.motto ? `<small title="${esc(h.motto)}"> ❝</small>` : ''} ${notes}</td><td>${esc(arenaName(h.tier).replace('The ', ''))}</td><td><b>${h.glory}</b></td></tr>`;
  }).join('');
  return `<h3 class="mini" title="Glory: a win is worth its arena tier (three times that for a Boss); rivals fight their own bouts every tournament week">The houses</h3>
    <table class="standings"><thead><tr><th>#</th><th>House</th><th>Arena</th><th>Glory</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="sub">Year-end purse (start of winter): ${HOUSES.yearPurse.map((g, i) => `#${i + 1} ${g * dateOf(run.week).year}`).join(' · ')} Gold. You're #${standings(run).findIndex((h) => h.you) + 1}.</p>`;
}

// Version 6: a perk's tags, which relics like the Brute's Chain count.
const perkTagChips = (p) => perkTags(p).map((t) => ` <small class="tag-chip tag-${t}">${esc(TAGS[t].name)}</small>`).join('');

function perkChooser(run, f) {
  if (!f.pendingPerks.length) return '';
  const offer = f.pendingPerks[0].map((p) => `<button class="perk-opt" data-action="perk" data-id="${esc(f.id)}" data-perk="${esc(p)}" ${perkBlocker(run, f.id, p) ? 'disabled' : ''}>
    <b>${esc(PERKS[p].name)}${perkTagChips(p)}${PERKS[p].repeatable ? ' <small class="stacks">(stacks: can be taken again)</small>' : ''}${f.perks.includes(p) ? ` <small class="stacks">you have ×${f.perks.filter((x) => x === p).length}</small>` : ''}</b><small>${esc(PERKS[p].desc)}</small></button>`).join('');
  const temple = maxLevel(run, 'temple') ? `<div class="row">${buttonWhy(`🏛 Pray to Fortuna for three new choices (${prayPrice(run)} Gold)`, 'pray', { id: f.id }, prayBlocker(run, f.id), 'btn small')}</div>` : '';
  return `<div class="perk-choice"><div class="label">⭐ Level ${f.level - f.pendingPerks.length + 1}! Choose a perk:</div><div class="perk-list">${offer}</div>${temple}</div>`;
}

// A dropdown of the storeroom's gear for one slot, each with what it does ('' if nothing fits).
function equipPicker(run, f, slot) {
  const cur = f.gear[slot];
  const options = run.inventory.gear.map((k, i) => (GEAR[k].slot === slot && !equipBlocker(run, f.id, i)
    ? `<option value="${i}">${esc(GEAR[k].name)}: ${esc(gearText(GEAR[k]))}</option>` : '')).join('');
  return options
    ? `<select class="gear-select equip" data-change="equip" data-id="${esc(f.id)}" aria-label="Equip a ${slot === 'weapon' ? 'weapon' : 'piece of armour'}"><option value="">${cur ? 'Swap for…' : 'Equip from the storeroom…'}</option>${options}</select>`
    : '';
}
// On the card, outside the fold-out: an empty slot with spare gear waiting (the designer: gear seemed to vanish).
function spareGearPrompt(run, f) {
  const slots = ['weapon', 'armor'].filter((slot) => !f.gear[slot] && equipPicker(run, f, slot));
  if (!slots.length) return '';
  return `<div class="spare-gear"><span class="label">⚒ No ${slots.map((s) => (s === 'weapon' ? 'weapon' : 'armour')).join(' or ')}, and the storeroom has some:</span> ${slots.map((slot) => equipPicker(run, f, slot)).join(' ')}</div>`;
}
// The storeroom's unworn gear, named, under Your gladiators.
function storeroomLine(run) {
  const counts = run.inventory.gear.reduce((o, k) => ({ ...o, [k]: (o[k] ?? 0) + 1 }), {});
  const items = Object.entries(counts).map(([k, n]) => `${n > 1 ? `${n} × ` : ''}${esc(GEAR[k].name)}`);
  return items.length ? `<p class="sub storeroom-line">🗄 In the storeroom, unworn: ${items.join(', ')}.</p>` : '';
}

// Decor groups in the quarters drawer and the shop (7.1).
export const DECOR_GROUPS = [['comfort', 'Comfort'], ['temperament', 'Temperament'], ['craft', 'Arena Craft']];
const decorByGroup = (render) => DECOR_GROUPS.map(([g, label]) => {
  const rows = Object.entries(DECOR).filter(([, d]) => (d.group ?? 'comfort') === g).map(([k, d]) => render(k, d)).join('');
  return rows ? `<div class="label decor-group">${label}</div>${rows}` : '';
}).join('');

// What a Temperament piece does to this fighter's Humour right now (7.1).
export function temperNote(f, k) {
  const to = DECOR[k].humor;
  if (!to) return '';
  if (f.kind === 'revenant') return 'A Revenant feels nothing: their temper never changes.';
  if (to === f.humor) return `Already ${HUMORS[to].name}: keeps them so.`;
  const drift = f.humourDrift?.to === to ? f.humourDrift.weeks : 0;
  return `Would make them ${HUMORS[to].name} after ${HUMOUR_DRIFT.weeks} weeks as the room's main Temperament piece${drift ? ` (${drift}/${HUMOUR_DRIFT.weeks} so far)` : ''}.`;
}

// The fighter's temper: their Humour and any drift under way (7.1).
export function temperLine(f) {
  const dom = dominantTemperament(f);
  const now = f.humor ? `Temper: <b>${HUMORS[f.humor].name}</b>.` : '';
  if (dom?.tied && f.humourDrift) return `${now} Temperament tied: drift paused (${f.humourDrift.weeks}/${HUMOUR_DRIFT.weeks} weeks).`;
  if (f.humourDrift && HUMORS[f.humourDrift.to]) return `${now} Turning <b>${HUMORS[f.humourDrift.to].name}</b>: ${f.humourDrift.weeks}/${HUMOUR_DRIFT.weeks} weeks.`;
  if (dom?.tied) return `${now} Temperament tied: no piece leads, so their temper holds.`;
  return now;
}

function roomPanel(run, f) {
  const decor = decorByGroup((k, d) => {
    const helps = d.helps(f);
    const temper = temperNote(f, k);
    return `<div class="decor-opt"><div class="row tight"><span><b>${esc(d.name)}</b> ×${f.decor[k]}</span>
      ${button(`+ Place (${run.inventory.decor[k]} in storeroom)`, 'assign-decor', { id: f.id, item: k }, assignDecorBlocker(run, f.id, k))}
      ${button('− Take back', 'remove-decor', { id: f.id, item: k }, removeDecorBlocker(run, f.id, k))}</div>
      <small>${helps ? '✦ ' : ''}${esc(d.effect)}${temper ? ` <b>${esc(temper)}</b>` : ''}</small></div>`;
  });
  const { target, comfort, expects, revenant } = moraleTarget(run, f);
  const gear = ['weapon', 'armor'].map((slot) => {
    const cur = f.gear[slot];
    const picker = equipPicker(run, f, slot);
    return `<div class="gear-slot"><span class="label">${slot === 'weapon' ? 'Weapon' : 'Armour'}:</span> ${cur ? `<b>${esc(GEAR[cur].name)}</b> <small>${esc(gearText(GEAR[cur]))}</small> ${button('Unequip', 'unequip', { id: f.id, slot }, unequipBlocker(run, f.id, slot), 'btn small unequip')}` : '<small>empty</small>'}
      ${picker ? `<div class="row tight">${picker}</div>` : ''}</div>`;
  }).join('');
  const room = revenant ? `<div class="label">A Revenant feels nothing: Morale settles at <b>${target}</b> whatever the room. Decor here does nothing for them, except what it does in a fight.</div>` : `<div class="label">Morale is heading to <b>${target}</b>: comfort ${comfort} vs expectations ${expects} (Renown ${f.renown})${f.mood ? `, mood ${f.mood.n > 0 ? '+' : ''}${f.mood.n} for ${f.mood.weeks} more week${f.mood.weeks === 1 ? '' : 's'}` : ''}.</div>
    <ul class="room-facts"><li>Quarters level ${maxLevel(run, 'quarters')}: +${MORALE.perQuartersLevel * maxLevel(run, 'quarters')} comfort; fits ${maxLevel(run, 'quarters')} of each decor item.</li>
    <li>Decor in the room: ${decorCount(f)} item${decorCount(f) === 1 ? '' : 's'} (${decorComfortOf(f) >= 0 ? `+${decorComfortOf(f)}` : `−${-decorComfortOf(f)}`} comfort).</li>
    ${maxLevel(run, 'entertainment') ? `<li>Entertainment Room: +${MORALE.perEntertainmentLevel * maxLevel(run, 'entertainment')} comfort.</li>` : ''}
    <li>Fame: Renown ${f.renown} sets expectations at ${expects}.</li></ul>`;
  // Two tabs: the room (Morale) and its decor. Gear has its own fold-out (gearPanel).
  const tab = roomTabs[f.id] === 'room' ? 'room' : 'decor';
  const tabs = [['room', 'Room'], ['decor', 'Decor']].map(([k, label]) => `<button class="seg${tab === k ? ' on' : ''}" role="tab" aria-selected="${tab === k}" data-action="room-tab" data-id="${esc(f.id)}" data-tab="${k}">${label}</button>`).join('');
  const body = tab === 'room' ? room : `<div class="decor-list">${f.humor ? `<p class="sub temper-line">${temperLine(f)}</p>` : ''}${decor}</div>`;
  const open2d = `<div class="row tight"><button class="btn small" data-action="estate-open-room" data-id="${esc(f.id)}">🏛 Open 2D Room</button></div>`;
  return { room: `<div class="segs room-tabs" role="tablist">${tabs}</div>${open2d}<div class="room-body">${body}</div>`, gear: `<div class="label">Gear (from the storeroom)</div>${gear}` };
}

// Which tab each fighter's room panel shows (page state only; set by src/main.js).
export const roomTabs = {};

function retuneDrawer(run, f) {
  if (f.kind === 'revenant') return '';
  const lv = maxLevel(run, 'temple');
  const price = retunePrice(run);
  const priceText = price === 0 ? 'Free' : `${price} Gold`;
  const why = retuneBlocker(run, f.id);
  const def = f.coreId ? CORE_COMPANIONS?.[f.coreId] : null;
  const allowedCls = (def?.allowedClasses && lv < 1) ? def.allowedClasses : Object.keys(CLASSES).filter((c) => !CLASSES[c].legacy || (run.setup?.classes ?? []).includes(c));
  const clsBtns = allowedCls.filter((c) => c !== f.cls).map((c) => button(CLASSES[c].name, 'retune-class', { id: f.id, cls: c }, why, 'btn small')).join('');
  const wpnBtns = f.cls === 'fighter'
    ? Object.keys(WEAPONS).filter((w) => w !== f.weapon).map((w) => button(WEAPONS[w].name, 'retune-class', { id: f.id, cls: 'fighter', weapon: w }, why, 'btn small')).join('')
    : '';
  const traitBtns = (KINDS[f.kind]?.traits ?? []).filter((t) => t !== f.kindTrait).map((t) => button(TRAITS[t].name, 'retune-trait', { id: f.id, trait: t }, why, 'btn small')).join('');
  const humorBtns = Object.keys(HUMORS).filter((h) => h !== f.humor).map((h) => button(HUMORS[h].name, 'retune-humor', { id: f.id, humor: h }, why, 'btn small')).join('');
  const focusBtns = FORTUNE_RETUNE.focusTags.map((tag) => `<button class="seg${(f.perkFocus ?? 'any') === tag ? ' on' : ''}" data-action="perk-focus" data-id="${esc(f.id)}" data-focus="${tag}">${tag}</button>`).join('');
  const respecBtns = (f.perks ?? []).map((p) => button(`Unbind ${PERKS[p].name} (${respecPrice(run)}g)`, 'respec-perk', { id: f.id, drop: p }, respecPerkBlocker(run, f.id, p), 'btn small')).join('');
  return `<details class="more" data-key="shrine-${esc(f.id)}">
    <summary>🏛 Shrine of Fortuna: Build &amp; discipline <small>(${priceText})</small></summary>
    <div class="label">Class (${priceText})${lv < 1 ? ' <small>· build Temple of Fortuna for all classes &amp; 2g/Free fee</small>' : ''}</div>
    <div class="row tight">${clsBtns}</div>
    ${wpnBtns ? `<div class="label">Weapon Specialty (${priceText})</div><div class="row tight">${wpnBtns}</div>` : ''}
    <div class="label">Kind Trait (${priceText})</div>
    <div class="row tight">${traitBtns}</div>
    <div class="label">Temperament (${priceText})</div>
    <div class="row tight">${humorBtns}</div>
    <div class="label">Level-up Perk Focus (Free)</div>
    <div class="segs">${focusBtns}</div>
    ${respecBtns ? `<div class="label">Respec a learned perk</div><div class="row tight">${respecBtns}</div>` : ''}
  </details>`;
}

// Your fighters side by side, so you needn't scroll card to card (a phone playtester's note, 5.4.0). A name jumps to its card.
function compareTable(run) {
  if (run.roster.length < 2) return '';
  const rows = [...run.roster].sort((a, b) => effectivePower(b) - effectivePower(a)).map((f) => {
    const wounds = f.injuries.length ? `<span class="bad" title="${esc(f.injuries.map((i) => INJURY_BY_TAG[i.tag].name).join(', '))}">${f.injuries.length}</span>` : '–';
    const stressCls = f.stress >= STRESS.overtrained ? ' class="bad"' : '';
    const moraleCls = f.morale < MORALE.restless ? ' class="bad"' : f.morale >= MORALE.inspired ? ' class="good"' : '';
    return `<tr><td><a href="#card-${esc(f.id)}">${esc(f.name)}</a>${f.want ? ` <span title="${esc(wantGoal(f.want))}">💬</span>` : ''}<small>Lv ${f.level ?? 1}</small></td><td>${effectivePower(f)}</td><td>${effectiveSpeed(f)}</td><td${stressCls}>${f.stress}</td><td${moraleCls}>${f.morale}</td><td>${wounds}</td><td>${f.trained}/${trainCap(run)}</td><td>${jobLabel(run, f.job)}</td></tr>`;
  }).join('');
  return `<details class="more compare" data-key="compare" open><summary>📊 Compare</summary>
    <div class="compare-wrap"><table class="compare-table"><thead><tr><th>Gladiator</th><th title="Power, with gear and Titles">Pow</th><th title="Speed, with gear">Spd</th><th title="Stress (50+: Overtrained)">Str</th><th title="Morale (under ${MORALE.restless}: won't train)">Mor</th><th title="Injuries">Inj</th><th title="Training weeks used of the Trainer cap">Trn</th><th>Job</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
}

function rosterPanel(run) {
  // "Can't train this week" reasons: one shared by several resting fighters is said once, above the cards.
  const noTrain = (f) => (f.job === 'rest' && jobBlocker(run, f.id, 'trainPower') && jobBlocker(run, f.id, 'trainSpeed') ? jobBlocker(run, f.id, 'trainPower') : null);
  const reasons = run.roster.map(noTrain).filter(Boolean);
  const shared = [...new Set(reasons)].filter((r) => reasons.filter((x) => x === r).length > 1);
  const cards = run.roster.map((f) => {
    const fid = esc(f.id);
    const noTrainReason = noTrain(f);
    const rp = roomPanel(run, f);
    const jobs = JOBS.map((job) => {
      const reason = f.job === job ? null : jobBlocker(run, f.id, job);
      return `<button class="seg${f.job === job ? ' on' : ''}" data-action="job" data-id="${fid}" data-job="${job}" ${reason ? `disabled title="${esc(reason)}"` : `title="${esc(jobHelp(run, job))}"`}>${jobLabel(run, job)}</button>`;
    }).join('');
    const surgeon = f.injuries.map((inj, i) => button(`Surgeon: ${esc(INJURY_BY_TAG[inj.tag]?.name ?? inj.tag)} (${surgeonPrice(run)} Gold)`, 'surgeon', { id: f.id, index: i }, surgeonBlocker(run, f.id, i))).join('');
    const augments = f.injuries.map((inj, i) => (['maimed', 'blinded'].includes(inj.tag) ? buttonWhy(`Replace the ${inj.tag === 'maimed' ? 'Maimed limb' : 'Blinded eye'}: ${AUGMENTS[inj.tag === 'maimed' ? 'arm' : 'eye'].name}`, 'augment', { id: f.id, index: i }, augmentBlocker(run, f.id, i)) : '')).join('');
    const queuedTalks = f.dialogue?.queue ?? [];
    const speakBtn = f.kind !== 'revenant' || f.hollowedCompanion
      ? `<div class="row tight talk-row"><button class="btn small${queuedTalks.length ? ' primary has-queue' : ''} talk-btn" data-action="talk-open" data-id="${fid}">💬 Speak${queuedTalks.length ? `: ${esc(queuedTalks[0].title ?? 'New word')} (${queuedTalks.length})` : ''}</button></div>`
      : '';
    const actions = `${perkChooser(run, f)}<div class="actions">
      ${speakBtn}
      <div class="label">This week's job <small>· trained ${f.trained}/${trainCap(run)}, ${trainCost(run)} Gold per training week${maxLevel(run, 'trainer') > trainCost(run) ? ` (${maxLevel(run, 'trainer')} from the Silver Coliseum)` : ''}</small></div>
      <div class="segs">${jobs}</div>
      ${spareGearPrompt(run, f)}
      ${f.injuries.length > 1 ? `<div class="treat"><span class="label">Medbay treats first:</span> <select class="treat-select" data-change="treat-first" data-id="${fid}" aria-label="Which injury the Medbay treats first">${f.injuries.map((inj, i) => `<option value="${i}" ${i === 0 ? 'selected' : ''}>${esc(INJURY_BY_TAG[inj.tag].name)} (${inj.weeksLeft} week${inj.weeksLeft === 1 ? '' : 's'})</option>`).join('')}</select></div>` : ''}
      ${noTrainReason && !shared.includes(noTrainReason) ? `<div class="why-not">Can't train this week: ${esc(noTrainReason)}</div>` : ''}
      <details class="more" data-key="room-${fid}"><summary>Room &amp; decor${Object.keys(DECOR).some((k) => DECOR[k].helps(f)) || f.keepsake ? ' ✦' : ''}</summary>${rp.room}</details>
      <details class="more" data-key="gear-${fid}"><summary>Gear${f.gear.weapon || f.gear.armor ? ` <small>(${[f.gear.weapon, f.gear.armor].filter(Boolean).map((k) => esc(GEAR[k].name)).join(', ')})</small>` : run.inventory.gear.length ? ' <small>(spare gear in the storeroom)</small>' : ''}</summary>${rp.gear}</details>
      ${retuneDrawer(run, f)}
      ${f.story?.length ? `<details class="more" data-key="story-${fid}"><summary>Story</summary><ul class="story">${f.story.map((e) => `<li><small>${esc(formatDate(e.week))}</small> ${esc(e.text)}</li>`).join('')}</ul></details>` : ''}
      <details class="more" data-key="surgeon-${fid}"><summary>Surgeon, cyborg surgery, ${(f.scars ?? []).some((x) => x.id === 'afeared') ? 'fear, ' : ''}rename, retire, release</summary>
        ${surgeon ? `<div class="label">Emergency Surgeon: heals instantly</div><div class="row">${surgeon}</div>` : '<small class="sub">No injuries.</small>'}
        ${(f.scars ?? []).some((x) => x.id === 'afeared') ? `<div class="label">Afeared: win ${FEAR.conquerWins} fights against the style they fear to conquer it (a Rest week beside a Rock Garden counts as half a win), or</div><div class="row">${buttonWhy(`🏛 Fortuna's rite: lift the fear (${ritePrice(run)} Gold)`, 'rite', { id: f.id }, riteBlocker(run, f.id), 'btn small')}</div>` : ''}
        ${augments ? `<div class="label">Cyborg surgery: replace the wound for good (${augmentPrice(run)} Gold, −1 Renown)</div><div class="row">${augments}</div>` : ''}
        <div class="row">${buttonWhy(`✎ Rename (${Math.round(RENAME.chance * 100)}% chance they resent it: −${-RENAME.morale} Morale for ${MOOD_WEEKS} weeks)`, 'rename', { id: f.id }, renameBlocker(run, f.id), 'btn small')}</div>
        <div class="row">${buttonWhy(`Retire to the Hall of Champions (+${RETIRE.prestige} Prestige, roster +${RETIRE.morale} Morale)`, 'retire', { id: f.id }, retireBlocker(run, f.id), 'btn small')}</div>
        <div class="row">${button('Release fighter', 'release', { id: f.id }, releaseBlocker(run, f.id), 'btn small ghost')}</div>
      </details>
      ${espState(run).clues.length ? `<div class="row investigate">${buttonWhy(`🔍 Investigate (${ESPIONAGE.investigate} Gold)${canNarrow(run) && espState(run).suspects?.includes(f.id) ? ' · a suspect' : ''}`, 'investigate', { id: f.id }, investigateBlocker(run, f.id), 'btn small')}</div>` : ''}
    </div>`;
    return fighterCard(f, { actions, morale: moraleTarget(run, f), anchor: true });
  }).join('');
  return `
    <section class="panel roster">
      <h2>Your gladiators <small>${run.roster.length}/${rosterCap(run)}</small></h2>
      ${compareTable(run)}
      ${shared.map((r) => `<div class="why-not">The resting fighters can't train this week: ${esc(r)}</div>`).join('')}
      ${storeroomLine(run)}
      ${unequipAllBlocker(run) === null ? `<div class="row">${button('Unequip all gear', 'unequip-all', {}, null, 'btn small')}<small class="sub">Takes every fighter's gear off, back to the storeroom, ready to hand out afresh.</small></div>` : ''}
      <div class="cards">${cards || '<div class="empty">No gladiators yet. Recruit some in the <button class="link" data-action="tab" data-tab="market">Market</button>.</div>'}</div>
      ${run.fallen.length ? `<p class="sub fallen">⚰ Fallen: ${run.fallen.map((f) => `${esc(f.name)}${f.raised ? ' <small>(risen as a Revenant)</small>' : ''}`).join(', ')}</p>` : ''}
    </section>`;
}

function oddsRow(run, f, tier, oddsFor) {
  const bout = boutFor(run, tier);
  const opp = opponentFor(run, tier);
  const fp = fightPowers(run, f, tier);
  const odds = describeOdds(oddsFor(f, tier), oracleLevel(run));
  const pct = (p) => (p ? ` <small>${p}</small>` : '');
  const warn = fighterWarnings(run, f, tier).map((w) => esc(w.text));
  const tone = odds.win === 'Strong favourite' || odds.win === 'Favoured' ? 'good' : odds.win === 'Even fight' ? '' : 'bad';
  return `<div class="odds-row">
    <div class="who"><b>${esc(f.name)}</b> ${warn.length ? `<span class="warn">${warn.join(' · ')}</span>` : ''}</div>
    <div class="o ${tone}" title="Chance to win ${hasBracket(tier) ? `the next match (against ${esc(opp.name)})` : 'the whole match (best of 3)'}, not one round">${hasBracket(tier) ? `Next (${esc(opp.name)})` : 'Match'}: ${odds.win}${pct(odds.winPct)}</div>
    ${hasBracket(tier) && run.bouts?.[tier] === 'open' ? bracketOdds(run, f, tier, oddsFor, pct) : ''}
    <div class="o" title="Round 1 Power and Speed with everything that applies before tactics: scouting, the Challenger bonus, feuds, festivals, decor and gear">Power ${fp.mine} vs ${fp.theirs} · Speed ${effectiveSpeed(f)} vs ${effectiveSpeed(opp)}</div>
    <div class="o" title="Chance of picking up at least one injury">Injury: ${odds.injury}${pct(odds.injuryPct)}</div>
    <div class="o ${odds.death === 'None' || odds.death === 'Low' ? '' : 'bad'}" title="Chance of dying if you never capitulate">Death: ${odds.death}${pct(odds.deathPct)}</div>
    ${run.bouts?.[tier] === 'open' ? buttonWhy(bracketOf(run, tier)?.fighterId === f.id && bracketOf(run, tier).round > 0 ? `Fight the ${bracketRound(run, tier)}` : `Send (−${bout.buyIn} Prestige)`, 'fight', { id: f.id, tier }, fightBlocker(run, f.id, tier), 'btn primary small') : ''}
  </div>`;
}

function bracketLegOptions(run, f, tier, opp, isFinal) {
  const base = matchOptions(run, f, tier, opp);
  const oppHouse = run.arenas[tier] ? houseOf(run, opp) : null;
  const debt = debtPenaltyFor(oppHouse);
  const opts = {
    ...base,
    earlyRound: !isFinal,
    grudge: !run.arenas[tier] ? 0 : oppHouse?.feud > 0 ? 1 : oppHouse?.owed > 0 ? -1 : 0,
    vengeance: Boolean(run.arenas[tier]) && oppHouse?.vengeance > 0,
  };
  if (debt) opts.debt = debt;
  else delete opts.debt;
  return opts;
}

// Odds of winning every match left in a bracket: the product of each match's odds (injuries carried over aren't
// counted, so it's optimistic).
function bracketOdds(run, f, tier, oddsFor, pct) {
  const b = bracketOf(run, tier);
  if (!b) return '';
  const left = [...b.foes.slice(b.round), run.arenas[tier].opponent];
  if (left.length < 2) return '';
  const p = left.reduce((acc, o, i) => acc * oddsFor(f, tier, o, bracketLegOptions(run, f, tier, o, i === left.length - 1)).win, 1);
  const d = describeOdds({ win: p, injury: 0, death: 0 }, oracleLevel(run));
  return `<div class="o ${p >= 0.55 ? 'good' : p < 0.45 ? 'bad' : ''}" title="Chance to win all ${left.length} remaining matches, multiplied (injuries that carry over aren't counted, so it's optimistic)">Whole tournament: ${d.win}${pct(d.winPct)}</div>`;
}

function arenaBlock(run, tier, oddsFor) {
  const bout = boutFor(run, tier);
  const arena = run.arenas[tier];
  const state = run.bouts?.[tier];
  const bInfo = getBracketInfo(run, tier);
  // The Dirt Pits Boss has no arena rule; the Oracle (Lv 2) previews the top Boss's rule early.
  const revealed = run.plot?.reveal === tier;
  const ruleId = bout.boss ? bout.debuff : bout.top && (oracleLevel(run) >= 2 || revealed) && tier > 1 ? arena.debuff : null;
  const debuff = ruleId ? BOSS_DEBUFFS[ruleId] : null;
  const debuffNote = debuff
    ? `<div class="debuff">☠ ${bout.boss ? 'Boss arena' : revealed && oracleLevel(run) < 2 ? 'A visitor whispered the Boss arena' : 'Oracle foresees the Boss arena'}: <b>${esc(debuff.name)}</b>. ${esc(debuff.desc)}</div>`
    : bout.boss && tier === 1 ? '<div class="sub">This first Boss fights without an arena rule.</div>' : '';
  const stakes = esc(arenaStakes(run, tier));
  const rival = arena.opponent.rival ? '<div class="warn">⚔ A rival returns: this Boss beat you before, and has grown stronger.</div>' : '';
  const rows = state === 'open' || !run.bouts ? run.roster.map((f) => oddsRow(run, f, tier, oddsFor)).join('') : '';
  const choice = bout.top && run.boutPending
    ? `<div class="row">${bout.boss ? button(`Forfeit (${bossLossFavor(tier, run) + FAVOR.forfeitExtra} Favour)`, 'forfeit', {}, forfeitBlocker(run), 'btn danger small') : button(`Skip (+${ECONOMY.skipGold} Gold, roster rests)`, 'skip', {}, skipBlocker(run), 'btn small')}</div>`
    : '';
  const buyIn = bout.pauper ? `Buy-in ${bout.buyIn} Prestige <i>(normally ${bout.fullBuyIn}: the Dirt Pits take whatever Prestige you have)</i>` : `Buy-in ${bout.buyIn} Prestige`;
  const finalCard = `${arena.opponent.nemesis ? nemesisNote(arena.opponent) : ''}${fighterCard(arena.opponent, { compact: true, stress: false, opponent: { boss: bout.boss }, tag: `${arena.opponent.nemesis ? `☠ Nemesis: ${esc(arena.opponent.name)} ${esc(arena.opponent.nemesis.epithet)} · ` : ''}${hasBracket(tier) ? `Final · ${houseTag(run, arena.opponent)}` : houseTag(run, arena.opponent)}` })}`;
  // In an open bracket before the Final, surface the actual QF/SF opponent card first and tuck the Finalist into a fold-out.
  const showEarly = state === 'open' && bInfo?.open && bInfo.round < 2 && bInfo.nextOpponent;
  const opponentSection = showEarly
    ? `${fighterCard(bInfo.nextOpponent, { compact: true, stress: false, opponent: { boss: bout.boss, earlyRound: true }, tag: `${esc(BRACKET.rounds[bInfo.round])} · ${houseTag(run, bInfo.nextOpponent)}` })}
      <details class="more" data-key="final-${tier}"><summary>Final opponent: <b>${esc(arena.opponent.name)}</b> (Power ${effectivePower(arena.opponent)}, Speed ${effectiveSpeed(arena.opponent)})</summary>${finalCard}</details>`
    : finalCard;
  const body = `<p class="sub"><b>${esc(bout.name)}</b> · ${buyIn} · Win: +${bout.winGold} Gold <small title="Famous fighters draw a bigger purse: +1 Gold per ${RENOWN.goldPer} Renown">(+ fame)</small>, +${bout.winPrestige} Prestige · Loss: +${bout.lossGold} Gold</p>
      ${stakes ? `<p class="sub">${stakes}</p>` : ''}${rival}${debuffNote}
      ${bout.festival ? `<div class="festival now">🏛 <b>${esc(FESTIVAL_BY_ID[bout.festival].name)}</b>: ${esc(FESTIVAL_BY_ID[bout.festival].desc)}</div>` : ''}
      ${bracketLine(run, tier)}
      ${opponentSection}
      ${state === 'done' ? '<p class="sub">✔ Settled this week. The opponent above is next month\'s.</p>' : `<h3 class="mini">Your fighters vs ${esc(opponentFor(run, tier).name)}</h3>${rows || '<div class="empty">No fighters to send.</div>'}`}
      ${choice}${!bout.top && state === 'open' ? '<p class="sub">If nobody from your house fights here this week, the tournament goes ahead without you and the arena moves on.</p>' : ''}`;
  if (bout.top) return `<div class="arena-block top"><h3>${esc(arenaName(tier))} <small>your top arena</small></h3>${body}</div>`;
  return `<details class="arena-block" data-key="arena-${tier}"${state === 'open' ? ' open' : ''}><summary><b>${esc(arenaName(tier))}</b> <small>${state === 'open' ? 'open this week' : state === 'done' ? 'settled' : 'lower arena'}</small></summary>${body}</details>`;
}

function boutPanel(run, oddsFor) {
  const tiers = unlockedTiers(run).sort((a, b) => b - a);
  const oracleNote = oracleLevel(run) === 0 ? '<p class="sub">Build an Oracle to see exact percentages.</p>' : '';
  const when = run.bouts ? '' : `<p class="sub">Fight day comes in ${weeksUntilTournament(run.week)} week(s). ${tiers.length > 1 ? 'Every arena you have reached holds a bout; send one fighter to each.' : 'Plan training and rest around it.'}</p>`;
  return `
    <section class="panel bout${run.boutPending ? ' live' : ''}">
      <h2>${run.bouts ? 'Fight day' : 'Next bouts'}</h2>
      ${when}
      ${tiers.map((t) => arenaBlock(run, t, oddsFor)).join('')}
      ${summonsBlock(run)}
      ${exhibitionBlock(run)}
      ${oracleNote}
    </section>`;
}

// The Emperor's summons on fight day: each free fighter's dropdown sends them with an order; a button refuses.
function summonsBlock(run) {
  if (!run.summons || !run.bouts) return '';
  const opp = getSummonsPower(run);
  const rows = run.roster.filter((f) => !summonsBlocker(run, f.id, 'yield')).map((f) => `<div class="row tight"><b>${esc(f.name)}</b> <small>Power ${effectivePower(f)}</small> <select class="gear-select" data-change="summons" data-id="${esc(f.id)}" aria-label="Send ${esc(f.name)} to the Emperor"><option value="">Send them…</option><option value="yield">told to capitulate at the Death Gate</option><option value="death">told to fight to the death</option></select></div>`).join('');
  return `<div class="arena-block summons"><h3>⚜ The Emperor's summons: the Imperial Coliseum</h3><p class="sub">One of your fighters against a regular of the Imperial Coliseum (Power ${opp}), played out at once. Stand to the end of Round 3: +${SUMMONS.surviveFavor} Favour, +${SUMMONS.surviveRenown} Renown. Win: +${SUMMONS.winFavor} Favour, +${SUMMONS.winRenown} Renown. Capitulate at the Death Gate: ${SUMMONS.yieldFavor} Favour. Die: the Temple of Vulcan gets a body.</p>${rows || '<p class="sub">Nobody is free to go.</p>'}<p>${buttonWhy(`Refuse (${SUMMONS.refuseFavor} Favour)`, 'refuse-summons', {}, refuseSummonsBlocker(run), 'btn small')}</p></div>`;
}

// The Exhibition Ring on fight day: pick a fighter's sparring partner from a dropdown (it runs the bout).
function exhibitionBlock(run) {
  if (!maxLevel(run, 'exhibition') || !run.bouts) return '';
  if (run.exhibitionWeek === run.week) return '<div class="arena-block"><h3>⚔ Exhibition Ring</h3><p class="sub">✔ This week\'s exhibition is over.</p></div>';
  const rows = run.roster.map((f) => {
    const partners = run.roster.filter((g) => g !== f && !exhibitionBlocker(run, f.id, g.id));
    if (!partners.length) return '';
    return `<div class="row tight"><b>${esc(f.name)}</b> <select class="gear-select" data-change="exhibition" data-id="${esc(f.id)}" aria-label="Exhibition partner for ${esc(f.name)}"><option value="">Spar against…</option>${partners.map((g) => `<option value="${esc(g.id)}">${esc(g.name)} (Power ${effectivePower(g)})</option>`).join('')}</select></div>`;
  }).join('');
  return `<div class="arena-block"><h3>⚔ Exhibition Ring</h3><p class="sub">Two fighters who aren't competing this week can put on a bout for the crowd: XP for both, Renown and Gold for the winner. Nobody dies in the ring, though the loser may take a Flesh Wound.</p>${rows || '<p class="sub">No two fighters are free and fit to spar.</p>'}</div>`;
}

export function ludusTab(run, oddsFor, mobilePane = 'roster') {
  const pane = ['roster', 'bout', 'week'].includes(mobilePane) ? mobilePane : 'roster';
  const fightLabel = run.bouts ? 'Fight day' : 'Bouts';
  const fightDot = run.boutPending ? '<span class="pane-dot" aria-hidden="true"></span>' : '';
  const nav = `<div class="mobile-ludus-nav" role="tablist" aria-label="Ludus sections">
    <button class="seg${pane === 'roster' ? ' on' : ''}" role="tab" aria-selected="${pane === 'roster'}" data-action="mobile-pane" data-pane="roster">Gladiators <small>(${run.roster.length})</small></button>
    <button class="seg${pane === 'bout' ? ' on' : ''}${run.boutPending ? ' live' : ''}" role="tab" aria-selected="${pane === 'bout'}" data-action="mobile-pane" data-pane="bout">${fightLabel}${fightDot}</button>
    <button class="seg${pane === 'week' ? ' on' : ''}" role="tab" aria-selected="${pane === 'week'}" data-action="mobile-pane" data-pane="week">House &amp; log</button>
  </div>`;
  return `${nav}<div class="grid ludus" data-pane="${pane}">${weekPanel(run)}${rosterPanel(run)}${boutPanel(run, oddsFor)}</div>`;
}

// ---------- Estate tab ----------

export function estateTab(run, estateUi = {}) {
  return `${renderEstatePanel(run, estateUi)}${loungePanel(run)}${espionagePanel(run)}`;
}

// 7.4 Whispers and covert ops: clues of a mole in the house, and at most one covert op a month against the next opponent.
export function espionagePanel(run) {
  const st = espState(run);
  const agents = maxLevel(run, 'liaison') || maxLevel(run, 'gallery');
  if (!st.clues.length && !agents) return '';
  const suspects = canNarrow(run) && st.suspects ? st.suspects.map((id) => run.roster.find((x) => x.id === id)?.name).filter(Boolean) : null;
  const clues = st.clues.length
    ? `<div class="label">Whispers in the house</div><ul>${st.clues.map((c) => `<li><small>${esc(formatDate(c.week))}</small> ${esc(c.text)}</li>`).join('')}</ul>
      <p class="sub">Someone in your house reports to another. Investigate a fighter from their card (${ESPIONAGE.investigate} Gold; an innocent fighter resents it).${suspects ? ` Your ${oracleLevel(run) >= 2 ? 'Oracle' : 'Whispering Gallery'} points at <b>${suspects.map(esc).join('</b> or <b>')}</b>.` : ' An Oracle Lv 2 or the Whispering Gallery would narrow it down.'}</p>`
    : '';
  const target = opTarget(run);
  const op = st.op;
  const ops = agents ? `<div class="label">Covert ops · one a month, before fight day${target ? `, against ${esc(target.name)}` : ''}</div>
    ${op ? `<p class="sub">This month: ${esc(ESPIONAGE.ops[op.type].name)}, ${op.result === 'success' ? 'done: it will tell on fight day' : 'your agent was caught'}.</p>` : ''}
    ${Object.entries(ESPIONAGE.ops).map(([k, o]) => `<div class="shop-row"><div><b>${esc(o.name)}</b> · ${o.cost} Gold · ${Math.round(100 * opChance(run, k))}%<br><small>${esc(o.desc)}</small></div>
      ${buttonWhy('Send agents', 'covert-op', { op: k }, covertOpBlocker(run, k), 'btn small')}</div>`).join('')}` : '';
  return `<section class="panel espionage"><h2>🗡 Knives in the dark</h2>${clues}${ops}</section>`;
}

// The Patron Lounge (fun idea #7): host the Senate for Influence, and spend it on policies.
function loungePanel(run) {
  if (!maxLevel(run, 'lounge')) return '';
  const active = activePolicies(run).map((p) => `<li><b>${esc(LOUNGE.policies[p.id].name)}</b>: ${esc(LOUNGE.policies[p.id].desc)} <small>(${p.until - run.week} weeks left)</small></li>`).join('');
  const lean = { loyalist: 'Loyalist', reformist: 'Reformist', neutral: 'Neutral' };
  const policies = Object.entries(LOUNGE.policies).map(([id, p]) => `<div class="shop-row"><div><b>${esc(p.name)}</b> · ${p.cost} Influence <small class="lean-${p.lean}">${lean[p.lean]}</small><br><small>${esc(p.desc)}</small></div>
    ${button('Enact', 'enact', { policy: id }, enactBlocker(run, id), 'btn small primary')}</div>`).join('');
  return `<section class="panel lounge"><h2>🍷 The Patron Lounge <small>Influence ${run.influence ?? 0}</small></h2>
    <p class="sub">Once a month, host the Senate. Your most famous fighter draws the guests: the more Renown, the more Influence. Spend it on policies that last ${LOUNGE.weeks} weeks.</p>
    <div class="row">${buttonWhy(`Host the Senate (${hostPrice(run)} Gold)`, 'host', {}, hostBlocker(run), 'btn primary')}</div>
    ${active ? `<div class="label">In force</div><ul>${active}</ul>` : ''}
    <div class="label">Policies</div>${policies}</section>`;
}

// ---------- Market tab: fighters, decor, Armourer, storeroom ----------

// A Market section that folds away; the fold state is remembered by data-key (playtest #7).
const fold = (key, title, body, note = '') => `<details class="panel fold" data-key="market-${key}" open><summary><h2>${title}${note ? ` <small>${note}</small>` : ''}</h2></summary>${body}</details>`;

function companionMarketFold(run) {
  const pool = getCompanionPool(run);
  if (!pool.length) return '';
  const draftedCount = recruitedCompanionIds(run).length;
  const freeLeft = Math.max(0, COMPANIONS.startPicks - draftedCount);
  const cards = pool.map((f) => {
    const def = CORE_COMPANIONS[f.coreId];
    const kDef = LORE_KEEPSAKES[def?.keepsake];
    const isFree = freeLeft > 0;
    const price = companionPrice(run, f.coreId, { draft: isFree });
    const why = companionBlocker(run, f.coreId, { draft: isFree });
    const action = isFree ? 'draft-companion' : 'recruit-companion';
    const label = isFree ? '✦ Draft Companion · Free (0 Gold)' : `Recruit Companion · ${price} Gold`;
    const classQuick = (def?.allowedClasses ?? []).map((c) => button(
      `${isFree ? 'Draft' : 'Recruit'} as ${CLASSES[c].name}`,
      action,
      { id: f.coreId, cls: c },
      why,
      `btn small${c === f.cls ? ' primary' : ''}`,
    )).join('');
    return fighterCard(f, {
      stress: false,
      tag: `✦ Core Companion · ${esc(f.handle ?? '')}${f.coreId === 'elf' && maxLevel(run, 'liaison') ? ' · Liaison discount' : ''}`,
      notes: `<div class="record"><div class="label">Chronicle &amp; Keepsake</div><div>${esc(def?.bio ?? '')}</div>${kDef ? `<div class="sub">🏺 <b>${esc(kDef.name)}:</b> ${esc(kDef.desc)}</div>` : ''}</div>`,
      actions: `<div class="actions">
        ${buttonWhy(label, action, { id: f.coreId }, why, 'btn primary btn-block')}
        <div class="row tight">${classQuick}</div>
      </div>`,
    });
  }).join('');
  const sub = freeLeft > 0
    ? `<p class="sub"><b>Founding Companion Draft:</b> Pick up to <b>${freeLeft}</b> more Core Companion${freeLeft === 1 ? '' : 's'} for <b>0 Gold</b> to anchor your starting Ludus. Remaining companions stay pinned here all career to recruit for Gold.</p>`
    : '<p class="sub">Core Companions never expire when the monthly Market refreshes. Recruit them whenever your quarters have room; their builds can be re-tuned at the Shrine or Temple of Fortuna.</p>';
  return fold('companions', 'Core Companions of Palatina', `${sub}<div class="cards two">${cards}</div>`, freeLeft > 0 ? `${freeLeft} free pick${freeLeft === 1 ? '' : 's'}` : `${pool.length} waiting`);
}

export function marketTab(run) {
  const price = marketPrice(run);
  const recruitCard = (f, tag) => fighterCard(f, {
    stress: false, tag,
    notes: f.mole?.tell ? `<div class="record"><div class="label">Something is off</div><div>${esc(f.mole.tell)}.</div></div>` : '',
    actions: `<div class="actions"><button class="btn primary btn-block" data-action="recruit" data-id="${esc(f.id)}" ${recruitBlocker(run, f.id) ? `disabled title="${esc(recruitBlocker(run, f.id))}"` : ''}>Recruit · ${recruitPrice(run, f)} Gold</button></div>`,
  });
  const cards = run.market.map((f) => recruitCard(f)).join('');
  // v8.0 Temple of Hades: true revival within 4 weeks (Lv 1) / 6 weeks (Lv 2).
  const hadesLv = maxLevel(run, 'hades');
  const hadesSouls = hadesLv ? hadesRaisable(run) : [];
  const hollowedRevenants = hadesLv ? run.roster.filter((f) => f.kind === 'revenant' && f.hollowedCompanion) : [];
  const rGold = restoreRevenantPrice(run);
  const rFavor = HADES.restoreFavor ?? 4;
  const hades = !hadesLv
    ? '<p class="sub">Build the <b>Temple of Hades</b> in the Estate (available from House level 1 via the Subterranean Crypt Sanctum) to ransom fallen fighters back whole within 4 weeks of death—keeping their soul, personality, and dialogue.</p>'
    : `<p class="sub">The priests of Hades hold the threshold open for <b>${hadesKeepWeeks(run)} weeks</b> after an arena death (base ${hadesPrice(run)} Gold; +50% tithe per prior revival). Unlike Vulcan's hollow brass forge, a fighter revived at Hades returns <b>whole, living, and themselves</b>${hadesLv >= 2 ? ' (uninjured and +15 Morale)' : ' (with a 2-week Concussion)'}. Take a Palatine or Rival House loan in the Ludus tab if your coffers are short before the window closes.</p>
      ${hadesSouls.length ? `<div class="cards two">${hadesSouls.map((f) => {
        const left = hadesKeepWeeks(run) - (run.week - f.diedWeek);
        const returned = f.hadesReturned ?? 0;
        const soulPrice = reviveHadesPrice(run, f);
        const titheTag = returned > 0 ? ` · <span class="chip small warn">Revived ×${returned} · +${returned * 50}% tithe</span>` : '';
        return fighterCard(f, {
          stress: false,
          tag: `Fell ${run.week - f.diedWeek} week${run.week - f.diedWeek === 1 ? '' : 's'} ago · ${left} week${left === 1 ? '' : 's'} left at the threshold${titheTag}`,
          actions: `<div class="actions">${buttonWhy(`⚱ Revive Whole · ${soulPrice} Gold`, 'revive-hades', { id: f.id }, reviveHadesBlocker(run, f.id), 'btn primary btn-block')}</div>`,
        });
      }).join('')}</div>` : '<p class="sub">No fallen souls await within the threshold window.</p>'}
      ${hollowedRevenants.length ? `<div class="label">Rite of the Whole Soul (${rGold} Gold &amp; ${rFavor} Favour)</div><div class="cards two">${hollowedRevenants.map((f) => fighterCard(f, {
        stress: false,
        tag: 'Hollowed Revenant · restores living kind & dialogue',
        actions: `<div class="actions">${buttonWhy(`⚱ Restore Whole · ${rGold}g, ${rFavor} Favour`, 'restore-revenant', { id: f.id }, restoreRevenantBlocker(run, f.id), 'btn primary btn-block')}</div>`,
      })).join('')}</div>` : ''}`;
  // The Unnatural Temple of Vulcan (5.3.0): raise a fighter killed in the arena as a Revenant.
  const vulcanLv = maxLevel(run, 'vulcan');
  const bodies = vulcanLv ? raisable(run) : [];
  const vulcanBonus = vulcanLv >= 2 ? (COMPANIONS.vulcanLv2BonusWeeks ?? COMPANIONS.vulcanBonusWeeks) : COMPANIONS.vulcanBonusWeeks;
  const vulcan = !vulcanLv
    ? `<p class="sub">Build the Unnatural Temple of Vulcan${run.prestigeLevel >= 2 ? ' in the Estate' : ' (House level 2)'} to raise fighters killed in the arena as Revenants.</p>`
    : `<p class="sub">The priests can raise a fighter killed in the arena up to ${effectAt('vulcan', vulcanLv)} weeks after their death (up to ${effectAt('vulcan', vulcanLv) + vulcanBonus} weeks for Core Companions), for ${reanimatePrice(run)} Gold. A Revenant keeps their class, level, perks and titles${vulcanLv >= 2 ? '' : ', but comes back with 1 less Power'}. They feel nothing: their Morale settles at ${REANIMATE.morale}, never Inspired and never Discontented.</p>
      ${bodies.length ? `<div class="cards two">${bodies.map((f) => fighterCard(f, { stress: false, tag: `Fell ${run.week - f.diedWeek} week${run.week - f.diedWeek === 1 ? '' : 's'} ago · keeps ${vulcanKeepWeeks(run, f) - (run.week - f.diedWeek)} more`, actions: `<div class="actions">${button(`Raise as a Revenant · ${reanimatePrice(run)} Gold`, 'reanimate', { id: f.id }, reanimateBlocker(run, f.id), 'btn primary btn-block')}</div>` })).join('')}</div>` : '<p class="sub">No bodies to raise. The Temple waits.</p>'}`;
  const offers = run.liaisonOffers ?? [];
  const liaison = offers.length
    ? `<div class="cards two">${offers.map((offer) => fighterCard(offer, { tag: offer.id === run.cousin?.f && !run.cousin.done ? `${offer.cousinOf ? `${esc(offer.cousinOf)}'s cousin` : 'The cousin from the gate'} · executed in ${run.cousin.until - run.week} week${run.cousin.until - run.week === 1 ? '' : 's'}` : `Liaison · ${esc(offer.origin)}`, notes: offer.record?.length ? `<div class="record"><div class="label">Prison record</div>${offer.record.map((c) => `<div>“${esc(c)}”</div>`).join('')}</div>` : '', actions: `<div class="actions">${button(`Recruit · ${offer.price} Gold`, 'recruit', { id: offer.id }, recruitBlocker(run, offer.id), 'btn primary btn-block')}</div>` })).join('')}</div>`
    : maxLevel(run, 'liaison') ? '<p class="sub">No prisoners on offer this month.</p>' : `<p class="sub">Build a Liaison${run.prestigeLevel >= 2 ? ' in the Estate' : ' (Prestige level 2)'} for cheap monthly prisoners.</p>`;
  const decorShop = decorByGroup((k, d) => `<div class="shop-row"><div><b>${esc(d.name)}</b> · ${d.price} Gold <small>(${run.inventory.decor[k]} in storeroom)</small> ${decorComfort(d) ? `<span class="chip small good" title="This item adds ${decorComfort(d)} comfort to the room it's in: that fighter's Morale drifts ${decorComfort(d)} points higher.">+${decorComfort(d)} comfort</span>` : '<span class="chip small bad" title="This item adds no comfort: it does nothing for Morale.">no comfort</span>'}${d.calm ? ` <span class="chip small" title="Lowers Stress each week. A room's decor lowers Stress by at most ${STRESS.decorCalm} a week in all.">−${d.calm} Stress/wk</span>` : ''}<br><small>${esc(d.effect)}</small></div>
    ${button('Buy', 'buy-decor', { item: k }, buyDecorBlocker(run, k), 'btn small primary')}</div>`);
  const armourer = maxLevel(run, 'armourer')
    ? run.armourerStock.length
      ? run.armourerStock.map((k, i) => `<div class="shop-row"><div><b>${esc(GEAR[k].name)}</b> · ${GEAR[k].price} Gold <small>${slotLabel(GEAR[k].slot)}</small><br><small>${esc(gearText(GEAR[k]))}</small></div>
        ${button('Buy', 'buy-gear', { index: i }, buyGearBlocker(run, i), 'btn small primary')}</div>`).join('')
      : '<p class="sub">Sold out until next month.</p>'
    : '<p class="sub">Build an Armourer (Prestige level 2) to buy weapons and armour; it stocks up the moment it opens. Beaten opponents sometimes drop theirs, and your top arena\'s Boss always does.</p>';
  const stored = run.inventory.gear.length
    ? run.inventory.gear.map((k, i) => `<div class="shop-row"><div><b>${esc(GEAR[k].name)}</b> <small>${slotLabel(GEAR[k].slot)}</small><br><small>${esc(gearText(GEAR[k]))}</small></div>
      ${button(`Sell · ${sellPrice(k)} Gold`, 'sell-gear', { index: i }, sellGearBlocker(run, i), 'btn small')}</div>`).join('')
    : '<small class="sub">No spare gear.</small>';
  const storedDecor = Object.entries(run.inventory.decor).filter(([, n]) => n).map(([k, n]) => `<span class="chip decor">${esc(DECOR[k].name)} ×${n}</span>`).join(' ') || '<small class="sub">No spare decor.</small>';
  return `
    <div class="grid market">
      <div class="stack">
        ${companionMarketFold(run)}
        ${fold('fighters', 'Market', `<p class="sub">From ${price} Gold (seasoned fighters cost more). New fighters arrive at the start of every month, stronger and more experienced as you climb the tiers. Roster: ${run.roster.length}/${rosterCap(run)}.</p>
          <div class="cards two">${cards || '<div class="empty">Sold out until next month.</div>'}</div>`, circuitInfo(run).name)}
        ${fold('hades', 'The Temple of Hades', hades)}
        ${fold('vulcan', 'The Unnatural Temple of Vulcan', vulcan)}
        ${fold('liaison', 'The Liaison', liaison)}
      </div>
      <div class="stack">
        ${fold('storeroom', 'The Storeroom', `<p class="sub">Everything here belongs to the house. Hand it out from each fighter's "Room &amp; decor" and "Gear" panels. A fallen fighter's things come back here.</p>
          <div class="label">Gear <small>(sells for half price)</small></div><div>${stored}</div>
          <div class="row">${button('Unequip all fighters', 'unequip-all', {}, unequipAllBlocker(run), 'btn small')}<small class="sub">Returns every fighter's weapon and armour here, to hand out afresh.</small></div>
          <div class="label">Decor</div><div class="chips">${storedDecor}</div>
          <div class="label">Fight items</div><div class="chips">${Object.entries(run.inventory.items ?? {}).filter(([, n]) => n).map(([k, n]) => `<span class="chip" title="${esc(CONSUMABLES[k].desc)}">${esc(CONSUMABLES[k].name)} ×${n}</span>`).join(' ') || '<small class="sub">None. The Apothecary sells them.</small>'}</div>
          ${run.plot?.pass && !run.plot.ended ? '<div class="label">In the strongbox</div><div class="chips"><span class="chip" title="A pass bearing the Emperor\'s seal. Good for one visit from the Praetorians.">📜 Forged imperial pass</span></div>' : ''}`)}
        ${fold('apothecary', 'Apothecary', `<p class="sub">Single-use items for a fight. Use them before Round 1 or between rounds: one of each kind per fight.</p>${Object.entries(CONSUMABLES).map(([k, c]) => `<div class="shop-row"><div><b>${esc(c.name)}</b> · ${c.price} Gold <small>(${run.inventory.items?.[k] ?? 0} in storeroom)</small><br><small>${esc(c.desc)}</small></div>
          ${button('Buy', 'buy-item', { item: k }, buyItemBlocker(run, k), 'btn small primary')}</div>`).join('')}`)}
        ${fold('decor', 'Decor merchant', `<p class="sub">Every item adds comfort to the fighter whose room it's in (finer pieces add more): their Morale drifts that much higher. Each room fits up to ${maxLevel(run, 'quarters')} of each item (your best Fighter Quarters level).</p>${decorShop}`)}
        ${fold('armourer', 'The Armourer', `${maxLevel(run, 'armourer') ? '<p class="sub">Buy gear here. Sell your spare gear back from the Storeroom above, for half its price.</p>' : ''}${armourer}`)}
      </div>
    </div>`;
}

// ---------- Help ----------

// How to play: the short list ('play'), or the intro's pages on winning, losing, and Power and Speed ('rules', 7.8).
export function helpModal(tab = 'play') {
  const tabs = [['play', 'How to play'], ['rules', 'The rules in brief']].map(([k, label]) => `<button class="seg${tab === k ? ' on' : ''}" role="tab" aria-selected="${tab === k}" data-action="help-tab" data-tab="${k}">${label}</button>`).join('');
  if (tab === 'rules') {
    return `<div class="modal" role="dialog" aria-modal="true" aria-label="How to play"><div class="modal-body">
    <button class="close" data-action="help" aria-label="Close">×</button>
    <div class="segs help-tabs" role="tablist">${tabs}</div>
    ${INTRO.slice(1).map((p) => `<h3>${esc(p.title)}</h3>${p.body}`).join('')}
  </div></div>`;
  }
  return `<div class="modal" role="dialog" aria-modal="true" aria-label="How to play"><div class="modal-body">
    <button class="close" data-action="help" aria-label="Close">×</button>
    <div class="segs help-tabs" role="tablist">${tabs}</div>
    <h2>How to play</h2>
    <ol>
      <li><b>Recruit</b> gladiators in the Market (and draft up to two Core Companions for free).</li>
      <li><b>Give each a weekly job</b>: train Power or Speed, rest, or heal in the Medbay. Training builds Stress; at 50+ Stress a fighter is overtrained.</li>
      <li><b>End the week.</b> The last week of each month is a tournament. Every arena you've reached holds a bout; send one fighter to each, after checking the odds.</li>
      <li><b>Fight</b> best-of-3 rounds. Between rounds you can capitulate to save a badly hurt fighter.</li>
      <li><b>Grow your fighters.</b> Matches give XP; each level lets you pick a perk. Wins bring Renown, and famous fighters want better rooms: keep their Morale up with decor, Quarters and entertainment.</li>
      <li><b>Equip them</b> from the storeroom: decor and gear belong to the house and pass on when a fighter falls.</li>
      <li><b>Climb</b> four arenas (Tournament → Boss in a season, or Tournament 1 → Tournament 2 → Boss on the Long Road), then win the Grand Tournament. Keep the Emperor's <b>Favour</b> above 0, and pay his tribute each winter. Opponents <b>scout</b> fighters who fight in your top arena two months running (+1 Power against them), so rotate your stars.</li>
      <li><b>Grow the Estate</b>: Prestige levels add room plots and new buildings. Re-tune builds at the Shrine or Temple of Fortuna, and revive fallen fighters whole at the Temple of Hades within 4–6 weeks.</li>
      <li><b>Keep the barracks calm.</b> A <b>Mutinous</b> fighter (Morale under 20) refuses to fight and stirs <b>unrest</b>; at 8 the chains break. Rival houses also plant <b>moles</b>: when clues appear, investigate a fighter from their card. With a Liaison or the Whispering Gallery you can run a <b>covert op</b> on your next opponent before fight day (see the Estate).</li>
      <li><b>Take Fortune's card.</b> Each month offers three: a <b>relic</b> the house keeps (up to 6, and some count a perk's tag, like Brute or Swift), a boon, gear, a fighter, or a wager. Spin again for Gold if none suit.</li>
      <li><b>Every career counts.</b> Win or lose, a career earns <b>Legacy XP</b>, and each Legacy level unlocks something for the careers after it: relics, a patron, house colours, legends who return. Win a career to unlock <b>Heat</b>: harder rules, a higher score, more XP.</li>
    </ol>
    <p class="sub"><b>Shortcuts:</b> Space plays the next round, leaves a finished fight, or ends the week · T goes to fight day · 1–4 switch tabs · ? opens this page.</p>
    <p class="sub">Every rule, trait, perk and item is explained in the <b>Codex</b> tab as you discover it.</p>
    <div class="row"><button class="btn small" data-action="intro-replay">Replay the intro</button><button class="btn small" data-action="tutorial-replay">Restart the tutorial</button><button class="btn small" data-action="tab" data-tab="codex">Open the Codex</button></div>
    <div class="row"><button class="btn small" data-action="export-save" title="Download your career, Codex and Legacy as one file">Export save</button><button class="btn small" data-action="import-save" title="Load a save file as a new career (your other careers are kept)">Import save</button></div>
  </div></div>`;
}

// ---------- Codex tab ----------

// The Codex (playtest #8 redesign): search, jump links, and sections that fold away. Basics and any section with new
// entries start open; the player's own opening and closing is remembered (data-key). Locked entries collapse into one line.
const CODEX_INTRO = {
  basics: 'How the game works: start here.',
  kind: 'The peoples of Palatina, and what each is good at.',
  trait: 'Every fighter has one trait from their kind.',
  class: 'Fighting styles, each with an ability and a signature move.',
  weapon: 'What a Fighter-class gladiator\'s weapon of choice does.',
  injury: 'Wounds, and what they do in a fight.',
  debuff: 'Rules some Boss arenas fight under.',
  building: 'What each room in your Estate does.',
  perk: 'Choices a fighter can learn when they level up.',
  gear: 'Weapons and armour from the Armourer and the arena.',
  rebellion: 'What you have learned of the rising.',
};
const LORE_STUDY_KEYS = new Set(['kind:android', 'kind:orc', 'kind:elf', 'rebellion:mark']);

export function codexTab(codex, entries, sections, fresh, prog, isUnlocked, hasLore, loreRead = []) {
  const noted = Array.isArray(loreRead) ? loreRead : [];
  const groups = Object.entries(sections).map(([cat, title]) => {
    const list = entries.filter((e) => e.cat === cat);
    const open = list.filter((e) => isUnlocked(codex, e));
    if (list.some((e) => e.hidden) && !open.length) return null; // v6: the Rebellion section appears only once something in it is found
    const newHere = open.filter((e) => fresh.includes(e.key)).length;
    const items = open.map((e) => {
      const loreUnlocked = Boolean(e.lore) && hasLore(codex, e);
      const lore = e.lore
        ? loreUnlocked ? `<p class="lore">${esc(e.lore)}</p>` : '<p class="lore locked">🔒 Lore: defeat one in the arena to learn its story.</p>'
        : '';
      const studyEntryUnlocked = cat === 'rebellion' ? isUnlocked(codex, e) : loreUnlocked;
      const canStudy = LORE_STUDY_KEYS.has(e.key) && studyEntryUnlocked;
      const isNoted = noted.includes(e.key);
      const studyRow = canStudy
        ? `<div class="lore-study-row">${isNoted ? '<span class="lore-noted">✓ Studied for dialogue</span>' : `<button class="link small lore-study-btn" data-action="mark-lore" data-key="${esc(e.key)}">📖 Study lore (unlocks dialogue reply)</button>`}</div>`
        : '';
      return `<article class="entry${fresh.includes(e.key) ? ' fresh' : ''}" data-search="${esc(`${e.name} ${e.rules} ${loreUnlocked ? e.lore : ''}`.toLowerCase())}"><h4>${esc(e.name)}${fresh.includes(e.key) ? ' <span class="new">new</span>' : ''}</h4><p>${esc(e.rules)}</p>${lore}${studyRow}</article>`;
    }).join('');
    const locked = list.length - open.length;
    const count = cat === 'basics' ? '' : `<small>${open.length}/${list.length}</small>`;
    return { cat, title, html: `<details class="codex-group" id="codex-${cat}" data-key="codex-${cat}"${cat === 'basics' || newHere ? ' open' : ''}>
      <summary><h3>${title}</h3> ${count}${newHere ? ` <span class="new">${newHere} new</span>` : ''}<span class="codex-sub">${esc(CODEX_INTRO[cat] ?? '')}</span></summary>
      <div class="entries">${items}</div>${locked ? `<p class="sub codex-locked">🔒 ${locked} still to discover. Meet them in the arena or the Market to learn more.</p>` : ''}
    </details>` };
  }).filter(Boolean);
  const jump = groups.map((g) => `<a class="chip" href="#codex-${g.cat}" data-codex-jump="${g.cat}">${g.title}</a>`).join('');
  return `<section class="panel codex"><h2>The Codex <small>${prog.found}/${prog.total} discovered · carries over between careers</small></h2>
    <div class="codex-tools"><input type="search" id="codex-search" placeholder="Search the Codex (e.g. Death Gate, Orc, Speed)" aria-label="Search the Codex"><div class="chips codex-jump">${jump}</div></div>
    <p class="sub codex-empty" hidden>Nothing in your Codex matches that yet.</p>
    ${groups.map((g) => g.html).join('')}</section>`;
}

export { XP };

// ---------- Next step ----------

// The tutorial month: the steward's step, docked at the top (never blocks the page). `onTab`: is the player on the
// step's tab already? If not, a button takes them there.
const TAB_NAMES = { ludus: 'Ludus', estate: 'Estate', market: 'Market', codex: 'Codex' };
// One line of the steward's news, as a notice.
export const stewardNote = (text) => `<div class="tip steward-note" role="status">${npcPortrait('steward', 36)}<div><span class="guide-name">Galen-VII:</span> ${esc(text)}</div></div>`;

export function guideBar(step, onTab, run = null) {
  return `<div class="guide" role="status">${npcPortrait('steward', 44)}<div class="guide-body"><div class="guide-name">Galen-VII</div><div>${stepText(step, run)}</div></div>
    <div class="guide-actions">${onTab ? '' : `<button class="btn small primary" data-action="tab" data-tab="${step.tab}">Go to the ${TAB_NAMES[step.tab]}</button>`}<button class="link small" data-action="tutorial-skip">Skip tutorial</button></div></div>`;
}

// 7.12 (the designer: End week should be easy to find): the week's main action, always on screen (bottom-right on a
// computer, a bar above the tabs on a phone). On fight day with the top arena still open, it jumps to the bouts instead.
export function weekDock(run, inMatch = false) {
  if (!run || run.status !== 'active' || inMatch) return '';
  if (run.bouts && run.boutPending) {
    return '<div class="week-dock"><button class="btn primary big" data-action="jump-bout">⚔ Fight day: send a fighter</button></div>';
  }
  const blocked = advanceBlocker(run);
  const fightDay = run.bouts ? '' : button(`⚔ To fight day <small>(${weeksUntilTournament(run.week)} wk${weeksUntilTournament(run.week) === 1 ? '' : 's'})</small>`, 'advance-tournament', {}, blocked, 'btn big');
  return `<div class="week-dock">${fightDay}${button('End week <small>(Space)</small>', 'advance', {}, blocked, 'btn primary big')}</div>`;
}

export function nextBar(hint, currentTab = null) {
  if (!hint) return '';
  const go = hint.action === 'tab' && hint.tab !== currentTab ? `<button class="btn small primary" data-action="tab" data-tab="${hint.tab}">${esc(hint.label)}</button>` : '';
  return `<div class="nextbar ${hint.tone ?? ''}" role="status"><span class="nextbar-msg">${ICON.arrow} <b>Next:</b> ${esc(hint.text)}</span>${go}<span class="keys" title="Keyboard shortcuts">Space · T · 1–4 · ?</span></div>`;
}

// The bug report box: shown when the game hits an error, or when the player asks for it.
export function bugModal({ crashed, message, notes, status, version }) {
  return `<div class="modal bug" role="dialog" aria-modal="true" aria-label="${crashed ? 'Something went wrong' : 'Report a bug'}"><div class="modal-body">
    ${crashed ? '' : '<button class="close" data-action="bug-close" aria-label="Close">×</button>'}
    <h2>${crashed ? '⚠ Something went wrong' : 'Report a bug'}</h2>
    ${crashed
    ? `<p>The game hit an error it didn't expect. Sorry! Your progress up to your last action is saved.</p><pre class="bug-error">${esc(message)}</pre>`
    : '<p>Something broken, wrong or confusing? Send a report: the developer can replay your career exactly, step by step.</p>'}
    <label class="label" for="bug-notes">What happened? (optional)</label>
    <textarea id="bug-notes" rows="3" placeholder="e.g. I clicked Fight and my fighter's injuries disappeared">${esc(notes)}</textarea>
    <div class="row">
      <button class="btn primary" data-action="bug-copy">Copy bug report</button>
      <button class="btn" data-action="bug-download">Download it</button>
      ${crashed ? '<button class="btn" data-action="bug-reload">Reload the game</button>' : ''}
    </div>
    ${status ? `<p class="bug-status">${esc(status)}</p>` : ''}
    <p class="sub">The report holds your career's seed, your choices, your save${crashed ? ' and the error' : ''}. Nothing is sent automatically. Game version ${esc(version)}.</p>
  </div></div>`;
}

// This week's event: a card with its choices, shown on every tab until decided.
// A verdict still waiting (e.g. the page was reloaded after the fight): thumbs up or down from the Ludus.
function mercyCard(run) {
  const m = run.mercy;
  const f = run.roster.find((x) => x.id === m.fighterId);
  const blood = m.crowd === 'kill';
  const favor = spareFavorWhy(run) ?? `+${spareFavor(run)} Favour`;
  const owes = owedLeft(run);
  const spare = blood ? [favor, owes ? `Their house already owes you a life (${owes} month${owes === 1 ? '' : 's'} left): no new debt` : 'Their house will owe you a life (−1 Power against you)'] : [favor, `+${MERCY.crowdRenown} Renown`, `+${MERCY.crowdMorale} Morale`];
  const kill = blood ? [`+${MERCY.killRenown + MERCY.crowdRenown} Renown`, `+${MERCY.crowdMorale} Morale`, 'A kill toward the kill marks'] : [`+${MERCY.killRenown + MERCY.infamyRenown} Renown (infamy)`, 'A kill toward the kill marks', ...(m.house ? ['Their house will swear a feud'] : [])];
  return `<section class="panel event-card mercy-card"><div class="event-faces">${f ? portrait(f, 56) : ''}</div><div class="event-body">
    <div class="label">The crowd waits</div><h2>${esc(m.opp)}'s fate</h2>
    ${mercyChoices({ title: `${esc(f?.name ?? 'Your fighter')} beat ${esc(m.opp)}.`, blood, spare, kill })}</div></section>`;
}

// A choice's visible stakes; a plot card (v6) shows nothing rather than "Nothing happens" when only hidden things change.
const cardStakes = (run, c, names = {}) => {
  const t = stakesText(c.effects, '; ', { f: names.f, g: names.g });
  return run.event?.plot && t === 'Nothing happens' ? '' : t;
};

export function eventCard(run) {
  if (run.mercy) return mercyCard(run);
  if (!run.event) return '';
  const e = EVENT_BY_ID[run.event.id];
  const names = eventNames(run);
  const who = [run.event.f, run.event.g].map((id) => run.roster.find((f) => f.id === id)).filter(Boolean);
  const faces = who.map((f) => portrait(f, 56)).join('');
  const choices = e.choices.map((c, i) => `<div class="event-choice">${buttonWhy(esc(choiceLabel(c, names)), 'event-choice', { index: i }, eventChoiceBlocker(run, i), 'btn')}<small>${esc(cardStakes(run, c, names))}</small></div>`).join('');
  return `<section class="panel event-card"><div class="event-faces">${faces}</div><div class="event-body">
    <div class="label">This week</div><h2>${esc(e.title)}</h2><p>${esc(e.text(names))}</p>
    <div class="row event-choices">${choices}</div></div></section>`;
}

// ---------- The Fortune draft (version 6) ----------

const KIND_ICON = { relic: '🏺', boon: '✨', gear: '⚔', fighter: '👤', wager: '🎲' };
const RARITY_LABEL = { common: 'Common', rare: 'Rare', legendary: 'Legendary' };

function fortuneFace(card) {
  if (card.kind === 'fighter' || card.kind === 'legend') return portrait(card.fighter, 64);
  return `<span class="fortune-icon">${KIND_ICON[card.kind]}</span>`;
}

// Which hand of cards is on the table: a new month, a spin or the Augur's gift deals a new one. main.js animates the
// cards in only for a new hand, so redraws (a dialogue's Next, a notice) don't replay the deal.
export const fortuneDealKey = (run) => (run.fortune ? `${run.seed}|${run.week}|${run.fortune.rerolls ?? 0}|${run.fortune.augur ? 'augur' : ''}` : null);

// Three cards, pick one; spin again for Gold, or let it pass. PLACEHOLDER words.
export function fortunePanel(run, { animate = true } = {}) {
  if (!run.fortune || run.mercy || run.event) return '';
  const cards = run.fortune.cards.map((c, i) => {
    const why = fortuneBlocker(run, i);
    const kindLine = c.kind === 'relic' && RELICS[c.id].tag ? `${KIND_LABELS[c.kind]} · ${TAGS[RELICS[c.id].tag].name}` : c.kind === 'fighter' && c.fighter.legend ? 'Legendary fighter' : c.kind === 'legend' ? 'From the Hall of Champions' : KIND_LABELS[c.kind];
    return `<div class="fortune-card rarity-${c.rarity}" style="--i:${i}">
      <div class="fortune-rarity">${RARITY_LABEL[c.rarity]} · ${esc(kindLine)}</div>
      <div class="fortune-face">${fortuneFace(c)}</div>
      <h3>${esc(fortuneTitle(c))}</h3>
      <p>${esc(fortuneText(c))}</p>
      ${c.kind === 'relic' && run.relics.length >= FORTUNE.maxRelics
    ? `<div class="swap"><small>Your house holds ${FORTUNE.maxRelics} relics. Lay one down for it:</small>${run.relics.map((id) => button(`Lay down ${esc(RELICS[id].name)}`, 'fortune', { index: i, drop: id }, fortuneBlocker(run, i, id), 'btn small')).join('')}</div>`
    : buttonWhy('Take it', 'fortune', { index: i }, why, 'btn primary')}
    </div>`;
  }).join('');
  const full = run.relics.length >= FORTUNE.maxRelics ? ` Your house holds its ${FORTUNE.maxRelics} relics: a new one takes the place of one you lay down.` : '';
  if (run.fortune.augur) { // version 6: the Augur's opening gift (PLACEHOLDER words)
    return `<section class="panel fortune-draft augur">
    <div class="label">Your patron</div><h2>The Augur reads the birds</h2>
    <p class="sub">Choose one relic for your house, before the first week.</p>
    <div class="fortune-cards${animate ? ' fresh' : ''}">${cards}</div></section>`;
  }
  return `<section class="panel fortune-draft" data-rolls="${run.fortune.rerolls}">
    <div class="label">This month</div><h2>Fortune's wheel turns</h2>
    <p class="sub">Choose one. Relics stay with the house (${run.relics.length}/${FORTUNE.maxRelics}); boons, gear and fighters are yours at once.${full}</p>
    <div class="fortune-cards${animate ? ' fresh' : ''}">${cards}</div>
    <div class="row">${button(`↻ Spin again (${rerollPrice(run)} Gold)`, 'fortune-reroll', {}, rerollBlocker(run), 'btn small')}
      ${button(`Let it pass (+${FORTUNE.pass} Gold)`, 'fortune-pass', {}, getIdleBlocker(run), 'btn small')}</div>
  </section>`;
}

// 7.5: the browser refused to save (storage full or blocked). Stays until a save works again.
export const saveFailedBanner = () => `<div class="banner save-failed" role="alert"><b>⚠ This career is not being saved.</b> Your browser refused to store it (its storage may be full). Export your save now from <b>Careers</b>, or delete an old career to make room; progress since the last save will be lost if you close this page.</div>`;

// 7.5: a saved career that wouldn't load. Its save is kept; the player chooses what to do.
export const loadFailedModal = ({ message }) => `<div class="modal load-failed" role="dialog" aria-modal="true" aria-label="A career couldn't be loaded"><div class="modal-body">
  <h2>This career couldn't be loaded</h2>
  <p>${esc(message)}</p>
  <p class="sub">Its save is still in this browser. Download it to keep it safe or send it with a bug report.</p>
  <div class="actions">
    <button class="btn" data-action="load-failed-download">Download this save</button>
    <button class="btn" data-action="bug-open">Report a bug</button>
    <button class="btn" data-action="careers-open">Your careers</button>
    <button class="btn primary" data-action="load-failed-close">Play the new career</button>
  </div></div></div>`;

// A fight notice's dismiss key: a bracket's Quarter-final, Semi-final and Final each have their own (7.5).
export const summaryKey = (s) => `${s.week}-${s.tier}-${s.fighterId}-${s.bracket ?? ''}`;

// 7.5: this career was saved by another tab; this one stops saving so it can't overwrite that progress.
export const otherTabBanner = () => `<div class="banner save-failed" role="alert"><b>⚠ This career was played in another tab.</b> This tab no longer saves, so it can't overwrite that progress. Reload the page to carry on from the newest save.</div>`;

// 7.7: an event's or Fortune's result as a dismissible notice (not a pop-up to click through).
export const resultNotice = ({ title, lines }, index = 0) => `<div class="banner result-note" role="status"><button class="close" data-action="dismiss-result" data-index="${index}" aria-label="Dismiss">×</button>
  <b>${esc(title)}</b><ul class="result-lines">${lines.map((l) => `<li class="${esc(['good', 'bad', 'warn', 'event'].includes(l.tone) ? l.tone : '')}">${esc(l.text)}</li>`).join('')}</ul></div>`;

// ---------- v8.0 Interactive Branching Companion & Staff Dialogue Modal (talkModal) ----------

const signedDelta = (n) => `${n > 0 ? '+' : '−'}${Math.abs(n)}`;

export function isStageNarrationReply(text, actorName = '') {
  const s = String(text ?? '').trim();
  if (!s) return false;
  if (/^["«“']/.test(s)) return false;
  if (/^\[.*\]/.test(s)) return true;
  const nonAux = /^(?!(?:is|was|were|are|will|won't|can|can't|has|had|would|could|should)\b)[a-z]/;
  if (actorName && s.startsWith(`${actorName} `) && nonAux.test(s.slice(actorName.length + 1))) return true;
  if (/^(?:Unit-non-machine-91|Unit-91|Nona|Tarek|Varok|Solace-4|Vaelen|Galen-VII|Drillmaster Kaeso|Kaeso|Physician Lyra|Lyra)\s+(?!(?:is|was|were|are|will|won't|can|can't|has|had|would|could|should)\b)[a-z]/.test(s)) return true;
  if (/^(?:He|She|They|His|Her|Their)\s+(?!(?:is|was|were|are|will|won't|can|can't|has|had|would|could|should)\b)[a-z]/.test(s)) return true;
  if (/^(?:The old drillmaster|The crimson flicker|From the doorway|For the first evening)\b/.test(s)) return true;
  return false;
}

function resolveReplySpeakerName(replySpeaker, fallbackName) {
  if (!replySpeaker || replySpeaker === 'narrator') return '';
  if (replySpeaker === 'fighter') return fallbackName;
  if (Object.hasOwn(SPEAKERS, replySpeaker)) return SPEAKERS[replySpeaker].name || fallbackName;
  return String(replySpeaker);
}

function formatChoiceEffects(eff = {}) {
  const tags = [];
  if (typeof eff.morale === 'number' && eff.morale !== 0) tags.push(`${signedDelta(eff.morale)} Morale`);
  if (typeof eff.stress === 'number' && eff.stress !== 0) tags.push(`${signedDelta(eff.stress)} Stress`);
  if (typeof eff.trust === 'number' && eff.trust !== 0) tags.push(`${signedDelta(eff.trust)} Trust`);
  if (typeof eff.xp === 'number' && eff.xp !== 0) tags.push(`${signedDelta(eff.xp)} XP`);
  if (typeof eff.renown === 'number' && eff.renown !== 0) tags.push(`${signedDelta(eff.renown)} Renown`);
  if (typeof eff.gold === 'number' && eff.gold !== 0) tags.push(`${signedDelta(eff.gold)} Gold`);
  if (typeof eff.favor === 'number' && eff.favor !== 0) tags.push(`${signedDelta(eff.favor)} Favour`);
  if (typeof eff.plotTrust === 'number' && eff.plotTrust !== 0) tags.push(`${signedDelta(eff.plotTrust)} Cause Trust`);
  if (typeof eff.suspicion === 'number' && eff.suspicion !== 0) tags.push(`${signedDelta(eff.suspicion)} Suspicion`);
  if (typeof eff.staffTraineeMorale === 'number' && eff.staffTraineeMorale !== 0) tags.push(`Trainees ${signedDelta(eff.staffTraineeMorale)} Morale`);
  if (typeof eff.staffTraineeStress === 'number' && eff.staffTraineeStress !== 0) tags.push(`Trainees ${signedDelta(eff.staffTraineeStress)} Stress`);
  if (typeof eff.staffMedbayMorale === 'number' && eff.staffMedbayMorale !== 0) tags.push(`Patients ${signedDelta(eff.staffMedbayMorale)} Morale`);
  if (typeof eff.staffMedbayStress === 'number' && eff.staffMedbayStress !== 0) tags.push(`Patients ${signedDelta(eff.staffMedbayStress)} Stress`);
  if (typeof eff.staffRosterMorale === 'number' && eff.staffRosterMorale !== 0) tags.push(`Roster ${signedDelta(eff.staffRosterMorale)} Morale`);
  if (eff.byCoreId && typeof eff.byCoreId === 'object') {
    for (const [cid, delta] of Object.entries(eff.byCoreId)) {
      if (!delta || typeof delta !== 'object') continue;
      const cName = CORE_COMPANIONS?.[cid]?.name ?? cid;
      const parts = [];
      if (typeof delta.morale === 'number' && delta.morale !== 0) parts.push(`${signedDelta(delta.morale)} Morale`);
      if (typeof delta.stress === 'number' && delta.stress !== 0) parts.push(`${signedDelta(delta.stress)} Stress`);
      if (typeof delta.trust === 'number' && delta.trust !== 0) parts.push(`${signedDelta(delta.trust)} Trust`);
      if (parts.length) tags.push(`${cName}: ${parts.join(' ')}`);
    }
  }
  if (eff.acceptWant) tags.push('Accepts request');
  if (eff.refuseWant) tags.push('Declines request');
  const order = eff.summonsOrder ?? eff.summonsOrderHint;
  if (order) {
    const orderLabel = order === 'yield' ? 'Order: Yield' : order === 'death' ? 'Order: Fight to the death' : `Order: ${order}`;
    tags.push(orderLabel);
  }
  const dismissWks = typeof eff.dismissTrainerWeeks === 'number' && eff.dismissTrainerWeeks > 0
    ? eff.dismissTrainerWeeks
    : (typeof eff.dismissTrainer === 'number' && eff.dismissTrainer > 0 ? eff.dismissTrainer : (eff.dismissTrainer ? 4 : 0));
  if (dismissWks > 0) tags.push(`⚠ Trainer away ${dismissWks} wk`);
  if (eff.setSpyFound || eff.turnTrainer || eff.loreFlag === 'trainer_turned_ally') tags.push('Clears informer threat');
  if (eff.loreFlag === 'orc_barracks_truce') tags.push('Reconciles Barracks Truce');
  if (eff.endPlot) tags.push('⚠ Ends the rebel rising');
  return tags.length ? ` <small class="choice-eff">(${esc(tags.join(', '))})</small>` : '';
}

export function talkModal(run, talkUi = null, sceneOverride = null) {
  if (!run || !talkUi) return '';
  const fighterId = typeof talkUi === 'string' ? talkUi : (talkUi.fighterId ?? talkUi.id ?? null);
  const staffActor = isStaffId(fighterId) ? getStaffActor(fighterId) : null;
  const f = staffActor
    ? staffActor
    : ((typeof talkUi === 'object' && talkUi.kind)
      ? talkUi
      : (run.roster?.find((x) => x.id === fighterId || x.coreId === fighterId) ?? null));
  if (!f) return '';
  const response = typeof talkUi === 'object' ? talkUi.response : null;
  const trainerDismissed = Boolean(
    staffActor?.staffKey === 'trainer'
    && (run.week ?? 0) < (run.staffDialogue?.trainer?.dismissedUntilWeek ?? 0)
  );
  if (trainerDismissed && !response) return '';
  // Pure view: never mutates run or f.dialogue.queue while rendering.
  const requestedScene = sceneOverride ?? (typeof talkUi === 'object' ? talkUi.sceneId ?? null : null);
  const snap = typeof talkUi === 'object' ? talkUi.treeSnapshot : null;
  const liveTree = resolveDialogueTree(run, f, requestedScene);
  const tree = snap ?? liveTree;
  const pTrait = !staffActor && f.personalTrait ? PERSONAL_TRAITS?.[f.personalTrait] : null;
  const keepsake = !staffActor && f.keepsake ? LORE_KEEPSAKES?.[f.keepsake] : null;
  const trust = staffActor ? (run.staffDialogue?.[staffActor.staffKey]?.trust ?? 0) : (f.dialogue?.trust ?? 0);

  const choices = tree.choices ?? [];
  const firstUnlockedIdx = choices.findIndex((c) => !c.locked);
  const focusFirstTopic = !response && firstUnlockedIdx < 0;

  const topicPills = (liveTree.topics ?? []).map((t, idx) => `<button class="chip talk-topic${t.scene === tree.id ? ' on' : ''}${t.queued ? ' queued' : ''}" data-action="talk-topic" data-id="${esc(f.id)}" data-scene="${esc(t.scene)}"${focusFirstTopic && idx === 0 ? ' autofocus' : ''}>${esc(t.label)}</button>`).join('');

  const beatLines = (tree.beats ?? []).map((b) => {
    const isNarrator = b.speaker === 'narrator';
    const whoName = isNarrator ? '' : (b.speakerName || SPEAKERS[b.speaker]?.name || f.name);
    return `<div class="talk-beat ${esc(b.speaker)}">
      ${whoName ? `<div class="dialogue-who">${esc(whoName)}</div>` : ''}
      <p class="dialogue-text">${esc(b.text)}</p>
    </div>`;
  }).join('');

  let replyBlock = '';
  if (response) {
    const rawSpeaker = response.replySpeaker ?? response.speaker ?? null;
    const isDefaultActor = !rawSpeaker || rawSpeaker === 'fighter' || rawSpeaker === f.coreId || rawSpeaker === f.staffKey || rawSpeaker === f.name;
    const isNarratorReply = rawSpeaker === 'narrator' || (isDefaultActor && isStageNarrationReply(response.text, f.name));
    const replyWhoName = isNarratorReply
      ? ''
      : (rawSpeaker ? resolveReplySpeakerName(rawSpeaker, response.speakerName || f.name) : (response.speakerName || f.name));
    const replyActions = trainerDismissed
      ? '<button class="btn primary talk-continue" data-action="talk-close" autofocus>Return to the Ludus</button>'
      : `<button class="btn primary talk-continue" data-action="talk-topic" data-id="${esc(f.id)}" data-scene="" autofocus>Continue speaking</button>
          <button class="btn" data-action="talk-close">Return to the Ludus</button>`;
    replyBlock = `<div class="talk-response${isNarratorReply ? ' narrator' : ''}">
        ${replyWhoName ? `<div class="dialogue-who">${esc(replyWhoName)}</div>` : ''}
        <p class="dialogue-text">${esc(response.text)}</p>
        ${response.effectsHtml ? `<div class="sub">${response.effectsHtml}</div>` : ''}
        <div class="row">
          ${replyActions}
        </div>
      </div>`;
  } else {
    replyBlock = `<div class="dialogue-replies talk-choices">
        ${choices.map((c, idx) => {
          if (c.locked) {
            const reason = c.lockReason || 'Study Codex to unlock';
            return `<button class="btn talk-choice talk-choice-btn talk-choice--locked" disabled title="${esc(reason)}">${esc(c.label)} <small class="choice-lock">🔒 ${esc(reason)}</small></button>`;
          }
          const auto = idx === firstUnlockedIdx ? ' autofocus' : '';
          return `<button class="btn talk-choice talk-choice-btn" data-action="talk-choice" data-id="${esc(f.id)}" data-scene="${esc(tree.id)}" data-choice="${esc(c.id)}"${auto}>${esc(c.label)}${formatChoiceEffects(c.effects)}</button>`;
        }).join('')}
      </div>`;
  }

  const faceHtml = staffActor ? npcPortrait(staffActor.speaker, 72) : portrait(f, 72);
  const staffLocation = staffActor
    ? (staffActor.location || (staffActor.staffKey === 'trainer' ? 'Trainer Room' : staffActor.staffKey === 'doctor' ? 'Medbay' : "Steward's Quarters"))
    : '';
  const subMeta = staffActor
    ? `${esc(staffActor.role)} · ${esc(staffLocation)} · Trust <b>${trust >= 0 ? `+${trust}` : trust}</b>`
    : `${esc(KINDS[f.kind]?.name ?? f.kind)} · ${esc(CLASSES[f.cls]?.name ?? f.cls)} · Morale <b>${f.morale}</b> · Stress <b>${f.stress}</b> · Trust <b>${trust >= 0 ? `+${trust}` : trust}</b>`;

  return `<div class="modal dialogue talk-modal" role="dialog" aria-modal="true" aria-label="Conversation with ${esc(f.name)}">
    <div class="modal-body dialogue-box talk-box">
      <button class="close" data-action="talk-close" aria-label="Close">×</button>
      <div class="talk-head">
        <div class="dialogue-face">${faceHtml}</div>
        <div class="talk-meta">
          <div class="dialogue-who">${esc(f.name)}${f.handle ? ` <small>· ${esc(f.handle)}</small>` : ''}</div>
          <div class="sub">${subMeta}</div>
          <div class="chips">
            ${staffActor ? '<span class="chip personal-trait">House Staff</span>' : ''}
            ${pTrait ? `<span class="chip trait personal-trait">${esc(pTrait.name)}</span>` : ''}
            ${keepsake ? `<span class="chip keepsake">🏺 ${esc(keepsake.name)}</span>` : ''}
          </div>
        </div>
      </div>
      ${topicPills ? `<div class="talk-topics" aria-label="Conversation topics">${topicPills}</div>` : ''}
      <div class="talk-scene-title">${tree.isQueued ? '<span class="new"> Milestone</span> ' : ''}<b>${esc(tree.title)}</b></div>
      <div class="talk-transcript">${beatLines}</div>
      ${replyBlock}
    </div>
  </div>`;
}

