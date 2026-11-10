// Ludus screens: top bar, week planner, fight day across arenas, estate, market and storeroom, help, Codex.

import { MAX_CAREERS } from '../careers.js';
import { WANTS, REBEL_QUESTS, GALLERY_INTRO } from '../quests.js';
import { FORTUNE, REANIMATE, LOUNGE, DEMAND, DEMANDS, RENOWN, decorComfort, BUILDINGS, DEPARTMENTS, PRESTIGE_LEVELS, BOSS_DEBUFFS, DECOR, ECONOMY, CIRCUITS, STRESS, FAVOR, PERKS, GEAR, XP, MORALE, CONSUMABLES, FESTIVAL_BY_ID, KINDS, CLASSES, PATRONS, DECREES, AUGMENTS, RETIRE, INJURY_BY_TAG, BRACKET, HOUSES, MERCY, SUMMONS, FEAR } from '../data.js';
import { ACHIEVEMENTS, careerScore, bestFighter, unlockedPatrons, unlockedClasses, unlockText, levelFor, nextUnlock, unlocksAt, heatUnlocked, houseColours, dailyStreak, returningFor, LEGACY_LEVELS, HEAT, HOUSE_COLOURS } from '../legacy.js';
import { formatDate, weeksUntilTournament, isWinter, weeksUntilWinter, nextFestival, dateOf } from '../calendar.js';
import {
  boutFor, unlockedTiers, arenaName, circuitInfo, marketPrice, surgeonPrice, recruitBlocker, jobBlocker, surgeonBlocker, fightBlocker,
  skipBlocker, forfeitBlocker, advanceBlocker, releaseBlocker, perkBlocker, buyDecorBlocker, assignDecorBlocker, removeDecorBlocker,
  buyGearBlocker, equipBlocker, unequipBlocker, unequipAllBlocker, sellGearBlocker, sellPrice, decorCount, eventNames, eventChoiceBlocker, standings, houseOf, augmentBlocker, augmentPrice, retireBlocker, upcomingBouts, hasBracket, bracketOf, bracketRound, withdrawBlocker, opponentFor, tributeDue, tributePaid, payTributeBlocker, moraleTarget, GRAND_TIER, bossLossFavor, effectivePower, matchOptions, fightPowers, recruitPrice, decorComfortOf, demandMet, activePolicies, hostPrice, hostBlocker, enactBlocker, prayPrice, prayBlocker, exhibitionBlocker, summonsBlocker, refuseSummonsBlocker, ritePrice, riteBlocker, stewardPlanBlocker, fortuneBlocker, rerollBlocker, rerollPrice,
  isChampionOf, buyItemBlocker, raisable, reanimatePrice, reanimateBlocker, spareFavor, spareFavorWhy, owedLeft, winsOf, purseGold, stewardTask, stewardRewardText, risingProgress,
  trainGain,
} from '../run.js';
import { stepText } from '../tutorial.js';
import {
  plotCount, rosterCap, trainCap, trainCost, oracleLevel, buildBlocker, buildingKnown, upgradeBlocker, levelInfo, maxLevel, effectAt,
} from '../ludus.js';
import { describeOdds } from '../odds.js';
import { fighterWarnings, arenaStakes } from '../explain.js';
import { gearText, slotLabel } from '../codex.js';
import { esc, button, buttonWhy, fighterCard, ICON, BUILDING_ICON, mercyChoices, gearSpd } from './components.js';
import { portrait, npcPortrait } from './portrait.js';
import { SPEAKERS, tipSpeaker } from '../dialogue.js';
import { EVENT_BY_ID, choiceLabel, stakesText } from '../events.js';
import { RELICS, TAGS, KIND_LABELS, perkTags, fortuneTitle, fortuneText } from '../fortune.js';

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
  }).join('') + `<span class="step ${run.topTier === GRAND_TIER ? 'now' : ''}" title="The Grand Tournament">👑</span>`;
  const tabBtn = (id, label, badge = '') => `<button class="tab${tab === id ? ' on' : ''}" data-action="tab" data-tab="${id}">${label}${badge}</button>`;
  const marketBadge = run.liaisonOffers?.length || run.armourerStock.length ? '<span class="dot" title="New stock"></span>' : '';
  const codexBadge = codexNew ? `<span class="count" title="New Codex entries">${codexNew}</span>` : '';
  const levelUps = run.roster.filter((f) => f.pendingPerks.length).length;
  const ludusBadge = levelUps ? `<span class="count" title="Fighters waiting to choose a perk">${levelUps}</span>` : '';
  const low = run.favor <= FAVOR.warning;
  return `
    <header class="topbar">
      <h1>BLOOD AND CIRCUS</h1>
      <div class="stat gold" title="Gold: pays for fighters, training, buildings, gear and tribute.">${ICON.gold}<b>${run.gold}</b></div>
      <div class="stat prestige" title="${esc(prestigeTip(run))}">${ICON.prestige}<b>${run.prestige}</b>
        <span class="lvl">Lv ${run.prestigeLevel}${next ? `<span class="lvlbar"><span style="width:${progress}%"></span></span><small>${Math.max(0, next.at - run.prestige)} to Lv ${next.level}</small>` : ''}</span></div>
      <div class="favor${low ? ' low' : ''}" title="Imperial Favour: the Emperor's opinion of you. At 0 you are executed. Lost by Boss losses and forfeits in your top arena, capitulating there, crushing weak opponents, and unpaid tribute.">
        <span>Favour</span><span class="favorbar"><span style="width:${run.favor}%"></span></span><b>${run.favor}</b></div>
      ${tributeStat(run)}
      <div class="track" title="Arena tiers">${tiers}</div>
      <div class="spacer"></div>
      <button class="btn small sound" data-action="toggle-sound" title="${sound ? 'Sound on: click to mute' : 'Sound off: click to turn on'}" aria-label="${sound ? 'Mute sound' : 'Turn sound on'}">${sound ? '🔊' : '🔇'}</button>
      <span class="top-actions">
        <button class="btn small" data-action="help">How to play</button>
        <button class="btn small" data-action="bug-open" title="Something wrong or confusing? Send the developer a report they can replay.">Report a bug</button>
        <button class="btn small" data-action="careers-open" title="Your saved careers: switch between them, or delete one">Careers</button>
        <button class="btn small" data-action="new-run" title="Start another career (this one stays in Careers)">New career</button>
      </span>
      <details class="top-menu"><summary class="btn small" aria-label="Menu">☰</summary><div class="top-menu-list">
        <button class="btn small" data-action="help">How to play</button>
        <button class="btn small" data-action="careers-open">Careers</button>
        <button class="btn small" data-action="new-run">New career</button>
        <button class="btn small" data-action="bug-open">Report a bug</button>
      </div></details>
    </header>
    ${run.bouts && run.boutPending && tab === 'ludus' ? '<button class="jump-bout" data-action="jump-bout">⚔ Fight day ↓</button>' : ''}
    <nav class="tabs">${tabBtn('ludus', 'Ludus', ludusBadge)}${tabBtn('estate', 'Estate')}${tabBtn('market', 'Market', marketBadge)}${tabBtn('codex', 'Codex', codexBadge)}</nav>`;
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
  if (tributePaid(run)) return `<div class="stat due paid" title="This year's tribute is already paid. The next one is due next winter.">⚖ <b>Tribute paid</b></div>`;
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
    <div class="end-score">${run.setup?.daily ? `⚜ The Emperor's Challenge, ${run.setup.daily} · ` : run.setup?.short ? 'Short career · ' : ''}${run.setup?.heat ? `🔥 Heat ${run.setup.heat} · ` : ''}Score <b>${score}</b>${run.setup?.daily && legacy ? ` · your best today ${Math.max(legacy.daily?.[run.setup.daily] ?? 0, score)}` : ''}${legacy ? ` · best ever ${Math.max(legacy.best, score)} · career ${legacy.careers}` : ''}</div>
    ${legacy ? legacyGain(legacy.past?.find((p) => p.seed === run.seed && p.weeks === run.week), legacy) : ''}
    <div class="end-grid">
      <div><div class="label">The career</div>${formatDate(run.week)}<br>${wins} won, ${fought.length - wins} lost · ${kills} kill${kills === 1 ? '' : 's'}<br>Top arena: ${esc(arenaName(run.topTier))}<br>House rank: #${rank} of ${standings(run).length} · Glory ${run.glory ?? 0}</div>
      ${best ? `<div class="end-best">${portrait(best, 64)}<div><div class="label">Best fighter</div><b>${esc(best.name)}</b> (${esc(KINDS[best.kind].name)})<br>${bestWins} win${bestWins === 1 ? '' : 's'} · Renown ${best.renown}${best.titles?.length ? `<br>🏆 ${esc(best.titles.join(', '))}` : ''}${best.alive ? '' : '<br>Fell in the arena'}</div></div>` : ''}
      ${deaths ? `<div><div class="label">The fallen</div><div class="fallen-faces">${run.fallen.map((f) => `<span title="${esc(f.name)}">${portrait(f, 40)}</span>`).join('')}</div></div>` : ''}
    </div>
    <div class="row"><button class="btn primary" data-action="new-run">New career</button><button class="btn" data-action="replay-seed">Replay seed ${run.seed}</button></div></div>`;
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
  return `<div class="modal careers" role="dialog" aria-label="Your careers"><div class="modal-body">
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
  return `<div class="modal setup" role="dialog" aria-label="A new career"><div class="modal-body">
    <button class="close" data-action="setup-cancel" aria-label="Close">×</button>
    <h2>A new career</h2>
    <div class="label">Career length</div>
    <label class="opt"><input type="radio" name="length" value="short" ${choice.short === false ? '' : 'checked'}> <b>A season</b> <small>Each arena: Tournament → Boss, with richer purses and a head start. About an hour.</small></label>
    <label class="opt"><input type="radio" name="length" value="full" ${choice.short === false ? 'checked' : ''}> <b>The Long Road</b> <small>Each arena: Tournament 1 → Tournament 2 → Boss. A few hours.</small></label>
    <div class="daily"><b>⚜ The Emperor's Challenge</b>${streak ? ` <span class="chip streak">🔥 ${streak}-day streak</span>` : ''} <small>Today's short career: the same seed for everyone today, with no patron, Heat or Legacy unlocks.${legacy.daily?.[today()] ? ` Your best today: <b>${legacy.daily[today()]}</b>.` : ''}</small>
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
  const past = legacy.past.map((p) => `<li>${p.won ? '👑' : '⚰'} Seed ${p.seed}: score <b>${p.score}</b>, ${p.weeks} weeks${p.endReason ? ` · ${esc(p.endReason)}` : ''}</li>`).join('');
  const hall = (legacy.hall ?? []).map((l) => `<div class="legend" title="${esc((l.story ?? []).map((e) => e.text).join(' '))}">${portrait(l, 48)}<div><b>${esc(l.name)}</b><br><small>${l.wins} win${l.wins === 1 ? '' : 's'} · ${l.kills} kill${l.kills === 1 ? '' : 's'}${l.titles?.length ? ` · ${esc(l.titles.join(', '))}` : ''}</small></div></div>`).join('');
  const { level } = levelFor(legacy.xp ?? 0);
  const tree = LEGACY_LEVELS.map((u, i) => `<li class="${level >= i + 2 ? 'got' : ''}"><b>${level >= i + 2 ? '★' : '☆'} Level ${i + 2}: ${esc(u.name)}</b> <small>${esc(u.desc)}</small></li>`).join('');
  return `<section class="panel legacy"><h2>Legacy <small>level ${level} · ${legacy.achievements.length}/${ACHIEVEMENTS.length} achievements · ${legacy.careers} career${legacy.careers === 1 ? '' : 's'} · best score ${legacy.best}${heatUnlocked(legacy) ? ` · Heat ${heatUnlocked(legacy)} unlocked` : ''}</small></h2>
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
  return `<div class="banner ${s.won ? 'win' : 'loss'}${s.injuries?.length ? ' hurt' : ''}"><button class="close" data-action="dismiss-summary" data-key="${s.week}-${s.tier}-${s.fighterId}" aria-label="Dismiss">×</button>
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
  return `<div class="modal dialogue ${kind}" role="dialog" aria-label="${esc(who.name || beat.title || 'Story')}"><div class="modal-body dialogue-body speaker-${beat.speaker}">
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

export function resultModal(title, lines) {
  // A gamble's outcome leads, in large type (playtest: "It went badly" was buried mid-sentence).
  const text = lines.map((l) => l.text).join(' ');
  const outcome = /it went well/i.test(text) ? '<div class="outcome good">✔ It went well</div>' : /it went badly/i.test(text) ? '<div class="outcome bad">✘ It went badly</div>' : '';
  lines = lines.map((l) => ({ ...l, text: l.text.replace(/,? ?[Ii]t went (well|badly),? ?/, ' ').replace(/\s+\./, '.').replace(/\s{2,}/g, ' ').trim() }));
  const html = `${outcome}<ul class="result-lines">${lines.map((l) => `<li class="${l.tone}">${esc(l.text)}</li>`).join('')}</ul>`;
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
  return `<div class="modal intro" role="dialog" aria-label="${esc(p.title)}"><div class="modal-body">
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
  const wants = run.roster.filter((f) => f.want).map((f) => `<li>💬 <b>${esc(f.name)}</b> wants: ${esc(WANTS[f.want.id].goal(f.want))}${weeksLeft(f.want.until)}</li>`);
  const cause = (run.quests?.rebel ?? []).map((q) => `<li>⛓ <b>The cause</b> asks: ${esc(REBEL_QUESTS[q.id].goal(q))}${weeksLeft(q.until)}</li>`);
  const rising = risingProgress(run);
  const gallery = rising ? `<div class="gallery-readout" title="${esc(GALLERY_INTRO)}">👁 <b>Whispering Gallery</b> · the palace's suspicion <b>${rising.suspicion}</b>/100 <small>(watched at ${rising.watch}, informers at ${rising.informer}, a raid at ${rising.raid})</small>
    <span class="susbar"><span style="width:${Math.min(100, rising.suspicion)}%"></span></span>
    <div>The rising: <b>${esc(rising.label)}</b>${rising.needs.length ? ` · still needs ${esc(rising.needs.join(', '))}` : ''}${rising.waiting ? ` · ${esc(rising.waiting)}` : ''}</div></div>` : '';
  const items = [
    task ? `<li>🏛 <b>The steward</b> asks: ${esc(task.goal)}${stewardRewardText(task) ? ` <small>· ${stewardRewardText(task)}</small>` : ''}</li>` : '',
    ...wants, ...cause,
  ].filter(Boolean);
  if (!items.length && !gallery) return '';
  return `<details class="more quests" data-key="quests" open><summary>📜 Quests</summary><ul class="quest-list">${items.join('')}</ul>${gallery}</details>`;
}

// Version 6: the house's relics, one chip each (hover or tap for what it does).
function relicStrip(run) {
  if (!run.relics?.length) return '';
  const chips = run.relics.map((id) => `<span class="relic-chip rarity-${RELICS[id].rarity}" title="${esc(RELICS[id].desc)}" tabindex="0">🏺 ${esc(RELICS[id].name)}<small>${esc(RELICS[id].desc)}</small></span>`).join('');
  return `<div class="relics"><span class="label">Relics ${run.relics.length}/${FORTUNE.maxRelics}</span>${chips}</div>`;
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
  const recent = run.log.slice(-9).reverse().map((l) => `<li class="${l.tone}">${esc(l.text)}</li>`).join('');
  return `
    <section class="panel week">
      <h2>${formatDate(run.week)}</h2>
      ${status}
      ${scheduleStrip(run)}
      ${relicStrip(run)}
      ${festivalNote(run)}
      ${tribute}
      ${run.summons ? `<div class="demand summons">⚜ <b>The Emperor's summons:</b> on this month's fight day, send one of your fighters to the Imperial Coliseum against one of its regulars (Power ${CIRCUITS[SUMMONS.tier - 1].oppPower[0]}), or refuse him and lose ${-SUMMONS.refuseFavor} Favour.</div>` : ''}
      ${run.demand ? `<div class="demand${demandMet(run) ? ' met' : ''}">⚜ <b>The Emperor demands:</b> ${esc(DEMANDS[run.demand.id].goal)}, by the end of this month's fight day. ${demandMet(run) ? '✔ Done: he will be pleased.' : `Reward: +${DEMAND.favor} Favour and Gold; missing it costs ${-DEMAND.missFavor} Favour.`}</div>` : ''}
      <div class="row">
        ${run.bouts ? button('End week', 'advance', {}, blocked, 'btn primary') : `${button(`⚔ To fight day <small>(${weeksUntilTournament(run.week)} wk${weeksUntilTournament(run.week) === 1 ? '' : 's'})</small>`, 'advance-tournament', {}, blocked, 'btn primary')}
        ${button('One week', 'advance', {}, blocked, 'btn')}`}
        ${run.roster.length ? button('📋 Steward\'s plan', 'steward-plan', {}, stewardPlanBlocker(run), 'btn', 'Sets everyone\'s job: the hurt to the Medbay, the tired to Rest, the rest to training while there are rooms.') : ''}
      </div>
      ${blocked && !run.boutPending ? `<div class="why-not">${esc(blocked)}</div>` : ''}
      <p class="sub">Each fighter does their job once per week. Jobs stay set until you change them.
        ${tributePaid(run) ? '<span class="good">✔ Tribute already paid for this year.</span> The next one is due next winter.' : `Tribute of <b>${tributeDue(run)} Gold</b> is due in ${toTribute} week${toTribute === 1 ? '' : 's'}. ${buttonWhy('Pay now', 'pay-tribute', {}, payTributeBlocker(run), 'btn small')}`}</p>
      ${questsPanel(run)}
      ${standingsTable(run)}
      ${friendsOutside(run)}
      <h3 class="mini">House log</h3>
      <ul class="log">${recent}</ul>
      ${run.log.length > 9 ? `<details class="more" data-key="full-log"><summary>Full house log (${run.log.length} entries)</summary>
        <ul class="log full">${[...run.log].reverse().map((l) => `<li class="${l.tone}"><small>${esc(formatDate(l.week))}</small> ${esc(l.text)}</li>`).join('')}</ul></details>` : ''}
    </section>`;
}

// A nemesis is back: what they've done to your house, and what beating them is worth.
function nemesisNote(f) {
  const n = f.nemesis;
  return `<div class="warn nemesis-note">☠ <b>${esc(f.name)} ${esc(n.epithet)}</b> has beaten your house ${n.wins} time${n.wins === 1 ? '' : 's'}${n.victims.length ? ` and killed ${esc(n.victims.join(' and '))}` : ''}. They fight at +${n.bonus} Power for it. Beat them for Renown, Gold and Favour.</div>`;
}

// A three-match tournament: who waits in each round, and where your fighter is.
function bracketLine(run, tier) {
  if (!hasBracket(tier)) return '';
  const b = bracketOf(run, tier);
  const final = run.arenas[tier].opponent;
  const foes = b ? [...b.foes, final] : [null, null, final];
  const steps = BRACKET.rounds.map((r, i) => {
    const f = foes[i];
    const state = !b ? '' : i < b.round ? ' done' : i === b.round && b.fighterId ? ' now' : '';
    return `<li class="${state.trim()}"><b>${r}</b><small>${f ? `${esc(f.name)} · Power ${effectivePower(f)}` : 'drawn on tournament week'}</small></li>`;
  }).join('');
  const who = b?.fighterId && b.round > 0 ? findName(run, b.fighterId) : null;
  return `<div class="bracket"><div class="label">Three matches: win all three to take the tournament${who ? `. ${esc(who)} is through to the ${BRACKET.rounds[b.round]}` : ''}</div><ol>${steps}</ol>
    ${who ? buttonWhy(`Withdraw ${esc(who)} (counts as capitulating)`, 'withdraw', { tier }, withdrawBlocker(run, tier), 'btn small danger') : ''}</div>`;
}
const findName = (run, id) => run.roster.find((f) => f.id === id)?.name ?? '';

// "Opponent · House Varro", in the house's colour.
export function houseTag(run, f) {
  const h = houseOf(run, f);
  if (!h) return 'Opponent';
  // How long a grudge has left (playtest: "how long do feuds last?"): each one cools by a month at every fight day.
  const left = (n) => `${n} month${n === 1 ? '' : 's'} left`;
  const grudge = h.feud ? ` · ⚔ feud: +1 Power against you, ${left(h.feud)}` : h.owed ? ` · owes you a life: −1 Power against you, ${left(h.owed)}` : '';
  const vengeance = h.vengeance ? ` · vengeance: +5% win chance for you, ${left(h.vengeance)}` : '';
  return `Opponent · <span style="color:${esc(h.color)}">${esc(h.name)}</span>${grudge}${vengeance}`;
}

// The rival houses and your place among them.
// v6: the people you freed (contacts), once there are any. Only the player's own memory of who they freed: no numbers.
const CELL_NOTE = { officer: 'an old soldier', scribe: 'a palace clerk', priest: 'a priest', courier: 'a runner' };
function friendsOutside(run) {
  const freed = run.plot?.freed ?? [];
  if (!freed.length) return '';
  return `<h3 class="mini">Friends outside the walls</h3><ul class="log">${freed.map((c) => `<li class="${c.caught ? 'bad' : 'good'}">${esc(c.name)}, ${CELL_NOTE[c.cell] ?? 'a friend'}${c.caught ? ' (taken by the Praetorians)' : ''}</li>`).join('')}</ul>`;
}

export function standingsTable(run) {
  if (!run.houses) return '';
  const rows = standings(run).map((h, i) => {
    const notes = [h.feud ? `<span class="feud" title="You killed one of theirs: their fighters get +1 Power against you">⚔ feud · ${h.feud} month${h.feud === 1 ? '' : 's'} left</span>` : '',
      h.owed && !h.feud ? `<span class="vengeance" title="You spared one of theirs when the crowd wanted blood: their fighters get −1 Power against you">owes you a life · ${h.owed} month${h.owed === 1 ? '' : 's'} left</span>` : '', // a feud overrides the debt (playtest LLM-11)
      h.vengeance ? `<span class="vengeance" title="They killed one of yours: your fighters get +5% win chance against them">vengeance · ${h.vengeance} month${h.vengeance === 1 ? '' : 's'} left</span>` : ''].join('');
    return `<tr class="${h.you ? 'you' : ''}"><td>${i + 1}</td><td><span class="house-dot" style="background:${esc(h.color)}"></span>${esc(h.name)}${h.motto ? `<small title="${esc(h.motto)}"> ❝</small>` : ''} ${notes}</td><td>${esc(arenaName(Math.min(h.tier, 4)).replace('The ', ''))}</td><td><b>${h.glory}</b></td></tr>`;
  }).join('');
  return `<h3 class="mini" title="Glory: a win is worth its arena tier (three times that for a Boss); rivals fight their own bouts every tournament week">The houses</h3>
    <table class="standings"><thead><tr><th>#</th><th>House</th><th>Arena</th><th>Glory</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="sub">Year-end purse (start of winter): ${HOUSES.yearPurse.map((g, i) => `#${i + 1} ${g * dateOf(run.week).year}`).join(' · ')} Gold. You're #${standings(run).findIndex((h) => h.you) + 1}.</p>`;
}

// Version 6: a perk's tags, which relics like the Brute's Chain count.
const perkTagChips = (p) => perkTags(p).map((t) => ` <small class="tag-chip tag-${t}">${esc(TAGS[t].name)}</small>`).join('');

function perkChooser(run, f) {
  if (!f.pendingPerks.length) return '';
  const offer = f.pendingPerks[0].map((p) => `<button class="perk-opt" data-action="perk" data-id="${f.id}" data-perk="${p}" ${perkBlocker(run, f.id, p) ? 'disabled' : ''}>
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
    ? `<select class="gear-select equip" data-change="equip" data-id="${f.id}" aria-label="Equip a ${slot === 'weapon' ? 'weapon' : 'piece of armour'}"><option value="">${cur ? 'Swap for…' : 'Equip from the storeroom…'}</option>${options}</select>`
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

function roomPanel(run, f) {
  const decor = Object.entries(DECOR).map(([k, d]) => {
    const helps = d.helps(f);
    return `<div class="decor-opt"><div class="row tight"><span><b>${esc(d.name)}</b> ×${f.decor[k]}</span>
      ${button(`+ Place (${run.inventory.decor[k]} in storeroom)`, 'assign-decor', { id: f.id, item: k }, assignDecorBlocker(run, f.id, k))}
      ${button('− Take back', 'remove-decor', { id: f.id, item: k }, removeDecorBlocker(run, f.id, k))}</div>
      <small>${helps ? '✦ ' : ''}${esc(d.effect)}</small></div>`;
  }).join('');
  const { target, comfort, expects, revenant } = moraleTarget(run, f);
  const gear = ['weapon', 'armor'].map((slot) => {
    const cur = f.gear[slot];
    const picker = equipPicker(run, f, slot);
    return `<div class="gear-slot"><span class="label">${slot === 'weapon' ? 'Weapon' : 'Armour'}:</span> ${cur ? `<b>${esc(GEAR[cur].name)}</b> <small>${esc(gearText(GEAR[cur]))}</small> ${button('Unequip', 'unequip', { id: f.id, slot }, unequipBlocker(run, f.id, slot), 'btn small unequip')}` : '<small>empty</small>'}
      ${picker ? `<div class="row tight">${picker}</div>` : ''}</div>`;
  }).join('');
  const room = revenant ? `<div class="label">A Revenant feels nothing: Morale settles at <b>${target}</b> whatever the room. Decor here does nothing for them, except what it does in a fight.</div>` : `<div class="label">Morale is heading to <b>${target}</b>: comfort ${comfort} vs expectations ${expects} (Renown ${f.renown})${f.mood ? `, mood ${f.mood.n > 0 ? '+' : ''}${f.mood.n} for ${f.mood.weeks} more week${f.mood.weeks === 1 ? '' : 's'}` : ''}.</div>
    <ul class="room-facts"><li>Quarters level ${maxLevel(run, 'quarters')}: +${MORALE.perQuartersLevel * maxLevel(run, 'quarters')} comfort; fits ${maxLevel(run, 'quarters')} of each decor item.</li>
    <li>Decor in the room: ${decorCount(f)} item${decorCount(f) === 1 ? '' : 's'} (+${decorComfortOf(f)} comfort).</li>
    ${maxLevel(run, 'entertainment') ? `<li>Entertainment Room: +${MORALE.perEntertainmentLevel * maxLevel(run, 'entertainment')} comfort.</li>` : ''}
    <li>Fame: Renown ${f.renown} sets expectations at ${expects}.</li></ul>`;
  // Two tabs: the room (Morale) and its decor. Gear has its own fold-out (gearPanel).
  const tab = roomTabs[f.id] === 'room' ? 'room' : 'decor';
  const tabs = [['room', 'Room'], ['decor', 'Decor']].map(([k, label]) => `<button class="seg${tab === k ? ' on' : ''}" data-action="room-tab" data-id="${f.id}" data-tab="${k}" aria-pressed="${tab === k}">${label}</button>`).join('');
  const body = tab === 'room' ? room : `<div class="decor-list">${decor}</div>`;
  return { room: `<div class="segs room-tabs" role="tablist">${tabs}</div><div class="room-body">${body}</div>`, gear: `<div class="label">Gear (from the storeroom)</div>${gear}` };
}

// Which tab each fighter's room panel shows (page state only; set by src/main.js).
export const roomTabs = {};

// Your fighters side by side, so you needn't scroll card to card (a phone playtester's note, 5.4.0). A name jumps to its card.
function compareTable(run) {
  if (run.roster.length < 2) return '';
  const rows = [...run.roster].sort((a, b) => effectivePower(b) - effectivePower(a)).map((f) => {
    const wounds = f.injuries.length ? `<span class="bad" title="${esc(f.injuries.map((i) => INJURY_BY_TAG[i.tag].name).join(', '))}">${f.injuries.length}</span>` : '–';
    const stressCls = f.stress >= STRESS.overtrained ? ' class="bad"' : '';
    const moraleCls = f.morale < MORALE.restless ? ' class="bad"' : f.morale >= MORALE.inspired ? ' class="good"' : '';
    return `<tr><td><a href="#card-${esc(f.id)}">${esc(f.name)}</a>${f.want ? ` <span title="${esc(WANTS[f.want.id].goal(f.want))}">💬</span>` : ''}<small>Lv ${f.level ?? 1}</small></td><td>${effectivePower(f)}</td><td>${f.speed + gearSpd(f)}</td><td${stressCls}>${f.stress}</td><td${moraleCls}>${f.morale}</td><td>${wounds}</td><td>${f.trained}/${trainCap(run)}</td><td>${jobLabel(run, f.job)}</td></tr>`;
  }).join('');
  return `<details class="more compare" data-key="compare" open><summary>📊 Compare</summary>
    <div class="compare-wrap"><table class="compare-table"><thead><tr><th>Gladiator</th><th title="Power, with gear and Titles">Pow</th><th title="Speed, with gear">Spd</th><th title="Stress (50+: Overtrained)">Str</th><th title="Morale (under ${MORALE.restless}: won't train)">Mor</th><th title="Injuries">Inj</th><th title="Training points used of the Trainer cap">Trn</th><th>Job</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
}

function rosterPanel(run) {
  // "Can't train this week" reasons: one shared by several resting fighters is said once, above the cards.
  const noTrain = (f) => (f.job === 'rest' && jobBlocker(run, f.id, 'trainPower') && jobBlocker(run, f.id, 'trainSpeed') ? jobBlocker(run, f.id, 'trainPower') : null);
  const reasons = run.roster.map(noTrain).filter(Boolean);
  const shared = [...new Set(reasons)].filter((r) => reasons.filter((x) => x === r).length > 1);
  const cards = run.roster.map((f) => {
    const jobs = JOBS.map((job) => {
      const reason = f.job === job ? null : jobBlocker(run, f.id, job);
      return `<button class="seg${f.job === job ? ' on' : ''}" data-action="job" data-id="${f.id}" data-job="${job}" ${reason ? `disabled title="${esc(reason)}"` : `title="${esc(jobHelp(run, job))}"`}>${jobLabel(run, job)}</button>`;
    }).join('');
    const surgeon = f.injuries.map((inj, i) => button(`Surgeon: ${esc(inj.tag === 'fleshWound' ? 'Flesh Wound' : inj.tag)} (${surgeonPrice(run)}g)`, 'surgeon', { id: f.id, index: i }, surgeonBlocker(run, f.id, i))).join('');
    const augments = f.injuries.map((inj, i) => (['maimed', 'blinded'].includes(inj.tag) ? buttonWhy(`Replace the ${inj.tag === 'maimed' ? 'Maimed limb' : 'Blinded eye'}: ${AUGMENTS[inj.tag === 'maimed' ? 'arm' : 'eye'].name}`, 'augment', { id: f.id, index: i }, augmentBlocker(run, f.id, i)) : '')).join('');
    const actions = `${perkChooser(run, f)}<div class="actions">
      <div class="label">This week's job <small>· trained ${f.trained}/${trainCap(run)}, ${trainCost(run)} Gold per training week${maxLevel(run, 'trainer') > trainCost(run) ? ` (${maxLevel(run, 'trainer')} from the Silver Coliseum)` : ''}</small></div>
      <div class="segs">${jobs}</div>
      ${spareGearPrompt(run, f)}
      ${f.injuries.length > 1 ? `<div class="treat"><span class="label">Medbay treats first:</span> <select class="treat-select" data-change="treat-first" data-id="${f.id}" aria-label="Which injury the Medbay treats first">${f.injuries.map((inj, i) => `<option value="${i}" ${i === 0 ? 'selected' : ''}>${esc(INJURY_BY_TAG[inj.tag].name)} (${inj.weeksLeft} week${inj.weeksLeft === 1 ? '' : 's'})</option>`).join('')}</select></div>` : ''}
      ${noTrain(f) && !shared.includes(noTrain(f)) ? `<div class="why-not">Can't train this week: ${esc(noTrain(f))}</div>` : ''}
      <details class="more" data-key="room-${f.id}"><summary>Room &amp; decor${Object.keys(DECOR).some((k) => DECOR[k].helps(f)) ? ' ✦' : ''}</summary>${roomPanel(run, f).room}</details>
      <details class="more" data-key="gear-${f.id}"><summary>Gear${f.gear.weapon || f.gear.armor ? ` <small>(${[f.gear.weapon, f.gear.armor].filter(Boolean).map((k) => esc(GEAR[k].name)).join(', ')})</small>` : run.inventory.gear.length ? ' <small>(spare gear in the storeroom)</small>' : ''}</summary>${roomPanel(run, f).gear}</details>
      ${f.story?.length ? `<details class="more" data-key="story-${f.id}"><summary>Story</summary><ul class="story">${f.story.map((e) => `<li><small>${esc(formatDate(e.week))}</small> ${esc(e.text)}</li>`).join('')}</ul></details>` : ''}
      <details class="more" data-key="surgeon-${f.id}"><summary>Surgeon, cyborg surgery, ${(f.scars ?? []).some((x) => x.id === 'afeared') ? 'fear, ' : ''}retire, release</summary>
        ${surgeon ? `<div class="label">Emergency Surgeon: heals instantly</div><div class="row">${surgeon}</div>` : '<small class="sub">No injuries.</small>'}
        ${(f.scars ?? []).some((x) => x.id === 'afeared') ? `<div class="label">Afeared: win ${FEAR.conquerWins} fights against the style they fear to conquer it, or</div><div class="row">${buttonWhy(`🏛 Fortuna's rite: lift the fear (${ritePrice(run)} Gold)`, 'rite', { id: f.id }, riteBlocker(run, f.id), 'btn small')}</div>` : ''}
        ${augments ? `<div class="label">Cyborg surgery: replace the wound for good (${augmentPrice(run)} Gold, −1 Renown)</div><div class="row">${augments}</div>` : ''}
        <div class="row">${buttonWhy(`Retire to the Hall of Champions (+${RETIRE.prestige} Prestige, roster +${RETIRE.morale} Morale)`, 'retire', { id: f.id }, retireBlocker(run, f.id), 'btn small')}</div>
        <div class="row">${button('Release fighter', 'release', { id: f.id }, releaseBlocker(run, f.id), 'btn small ghost')}</div>
      </details>
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
  const odds = describeOdds(oddsFor(f, tier), oracleLevel(run));
  const pct = (p) => (p ? ` <small>${p}</small>` : '');
  const warn = fighterWarnings(run, f, tier).map((w) => esc(w.text));
  const tone = odds.win === 'Strong favourite' || odds.win === 'Favoured' ? 'good' : odds.win === 'Even fight' ? '' : 'bad';
  return `<div class="odds-row">
    <div class="who"><b>${esc(f.name)}</b> ${warn.length ? `<span class="warn">${warn.join(' · ')}</span>` : ''}</div>
    <div class="o ${tone}" title="Chance to win ${hasBracket(tier) ? `the next match (against ${esc(opponentFor(run, tier).name)})` : 'the whole match (best of 3)'}, not one round">${hasBracket(tier) ? `Next (${esc(opponentFor(run, tier).name)})` : 'Match'}: ${odds.win}${pct(odds.winPct)}</div>
    ${hasBracket(tier) && run.bouts?.[tier] === 'open' ? bracketOdds(run, f, tier, oddsFor, pct) : ''}
    <div class="o" title="Round 1 Power with everything that applies before tactics: scouting, the Challenger bonus, feuds, festivals, decor and gear">Power ${fightPowers(run, f, tier).mine} vs ${fightPowers(run, f, tier).theirs}</div>
    <div class="o" title="Chance of picking up at least one injury">Injury: ${odds.injury}${pct(odds.injuryPct)}</div>
    <div class="o ${odds.death === 'None' || odds.death === 'Low' ? '' : 'bad'}" title="Chance of dying if you never capitulate">Death: ${odds.death}${pct(odds.deathPct)}</div>
    ${run.bouts?.[tier] === 'open' ? buttonWhy(bracketOf(run, tier)?.fighterId === f.id && bracketOf(run, tier).round > 0 ? `Fight the ${bracketRound(run, tier)}` : `Send (−${bout.buyIn} Prestige)`, 'fight', { id: f.id, tier }, fightBlocker(run, f.id, tier), 'btn primary small') : ''}
  </div>`;
}

// Odds of winning every match left in a bracket: the product of each match's odds (injuries carried over aren't
// counted, so it's optimistic).
function bracketOdds(run, f, tier, oddsFor, pct) {
  const b = bracketOf(run, tier);
  if (!b) return '';
  const left = [...b.foes.slice(b.round), run.arenas[tier].opponent];
  if (left.length < 2) return '';
  const p = left.reduce((acc, o) => acc * oddsFor(f, tier, o).win, 1);
  const d = describeOdds({ win: p, injury: 0, death: 0 }, oracleLevel(run));
  return `<div class="o ${p >= 0.55 ? 'good' : p < 0.45 ? 'bad' : ''}" title="Chance to win all ${left.length} remaining matches, multiplied (injuries that carry over aren't counted, so it's optimistic)">Whole tournament: ${d.win}${pct(d.winPct)}</div>`;
}

function arenaBlock(run, tier, oddsFor) {
  const bout = boutFor(run, tier);
  const arena = run.arenas[tier];
  const state = run.bouts?.[tier];
  // The Dirt Pits Boss has no arena rule; the Oracle (Lv 2) previews the top Boss's rule early.
  const revealed = run.plot?.reveal === tier; // v6: a rebel's visitor knew the Boss's arena rule
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
  const body = `<p class="sub"><b>${esc(bout.name)}</b> · ${buyIn} · Win: +${bout.winGold} Gold <small title="Famous fighters draw a bigger purse: +1 Gold per ${RENOWN.goldPer} Renown">(+ fame)</small>, +${bout.winPrestige} Prestige · Loss: +${bout.lossGold} Gold</p>
      ${stakes ? `<p class="sub">${stakes}</p>` : ''}${rival}${debuffNote}
      ${bout.festival ? `<div class="festival now">🏛 <b>${esc(FESTIVAL_BY_ID[bout.festival].name)}</b>: ${esc(FESTIVAL_BY_ID[bout.festival].desc)}</div>` : ''}
      ${bracketLine(run, tier)}
      ${arena.opponent.nemesis ? nemesisNote(arena.opponent) : ''}${fighterCard(arena.opponent, { compact: true, stress: false, opponent: { boss: boutFor(run, tier).boss }, tag: `${arena.opponent.nemesis ? `☠ Nemesis: ${esc(arena.opponent.name)} ${esc(arena.opponent.nemesis.epithet)} · ` : ''}${hasBracket(tier) ? `Final · ${houseTag(run, arena.opponent)}` : houseTag(run, arena.opponent)}` })}
      ${state === 'done' ? '<p class="sub">✔ Settled this week. The opponent above is next month\'s.</p>' : `<h3 class="mini">Your odds</h3>${rows || '<div class="empty">No fighters to send.</div>'}`}
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

// The Emperor's summons on fight day (5.4.2): each free fighter's dropdown sends them with an order; a button refuses.
function summonsBlock(run) {
  if (!run.summons || !run.bouts) return '';
  const opp = CIRCUITS[SUMMONS.tier - 1].oppPower[0];
  const rows = run.roster.filter((f) => !summonsBlocker(run, f.id, 'yield')).map((f) => `<div class="row tight"><b>${esc(f.name)}</b> <small>Power ${effectivePower(f)}</small> <select class="gear-select" data-change="summons" data-id="${f.id}" aria-label="Send ${esc(f.name)} to the Emperor"><option value="">Send them…</option><option value="yield">told to yield at the Death Gate</option><option value="death">told to fight to the death</option></select></div>`).join('');
  return `<div class="arena-block summons"><h3>⚜ The Emperor's summons: the Imperial Coliseum</h3><p class="sub">One of your fighters against a regular of the Imperial Coliseum (Power ${opp}), played out at once. Stand to the end of Round 3: +${SUMMONS.surviveFavor} Favour, +${SUMMONS.surviveRenown} Renown. Win: +${SUMMONS.winFavor} Favour, +${SUMMONS.winRenown} Renown. Yield at the Death Gate: ${SUMMONS.yieldFavor} Favour. Die: the Temple of Vulcan gets a body.</p>${rows || '<p class="sub">Nobody is free to go.</p>'}<p>${buttonWhy(`Refuse (${SUMMONS.refuseFavor} Favour)`, 'refuse-summons', {}, refuseSummonsBlocker(run), 'btn small')}</p></div>`;
}

// The Exhibition Ring on fight day: pick a fighter's sparring partner from a dropdown (it runs the bout).
function exhibitionBlock(run) {
  if (!maxLevel(run, 'exhibition') || !run.bouts) return '';
  if (run.exhibitionWeek === run.week) return '<div class="arena-block"><h3>⚔ Exhibition Ring</h3><p class="sub">✔ This week\'s exhibition is over.</p></div>';
  const rows = run.roster.map((f) => {
    const partners = run.roster.filter((g) => g !== f && !exhibitionBlocker(run, f.id, g.id));
    if (!partners.length) return '';
    return `<div class="row tight"><b>${esc(f.name)}</b> <select class="gear-select" data-change="exhibition" data-id="${f.id}" aria-label="Exhibition partner for ${esc(f.name)}"><option value="">Spar against…</option>${partners.map((g) => `<option value="${g.id}">${esc(g.name)} (Power ${effectivePower(g)})</option>`).join('')}</select></div>`;
  }).join('');
  return `<div class="arena-block"><h3>⚔ Exhibition Ring</h3><p class="sub">Two fighters who aren't competing this week can put on a bout for the crowd: XP for both, Renown and Gold for the winner. Nobody dies in the ring, though the loser may take a Flesh Wound.</p>${rows || '<p class="sub">No two fighters are free and fit to spar.</p>'}</div>`;
}

export function ludusTab(run, oddsFor) {
  return `<div class="grid ludus">${weekPanel(run)}${rosterPanel(run)}${boutPanel(run, oddsFor)}</div>`;
}

// ---------- Estate tab ----------

function buildingCard(run, b) {
  const def = BUILDINGS[b.type];
  const pips = def.cost.map((_, i) => `<i class="${i < b.level ? 'on' : ''}"></i>`).join('');
  const nextLevel = b.level < def.cost.length ? b.level + 1 : null;
  const extra = def.extra ? `<div class="sub">${esc(def.extra(b.level))}</div>` : '';
  const up = nextLevel
    ? `<div class="next">Next: ${esc(def.effect(def.per[b.level]))}${def.extra ? `; ${esc(def.extra(nextLevel))}` : ''}</div>${button(`Upgrade · ${def.cost[b.level]} Gold`, 'upgrade', { id: b.id }, upgradeBlocker(run, b.id), 'btn small primary')}${upgradeBlocker(run, b.id) ? `<div class="why-not">${esc(upgradeBlocker(run, b.id))}</div>` : ''}`
    : '<div class="next">Fully upgraded</div>';
  return `<div class="room built dept-${def.dept}">
    <div class="room-head"><span class="room-icon">${BUILDING_ICON[def.icon]}</span><b>${esc(def.name)}</b><span class="pips">${pips}</span></div>
    <div>${esc(def.effect(def.per[b.level - 1]))}</div>${extra}${up}</div>`;
}

function emptyPlot(run) {
  const options = Object.entries(BUILDINGS).filter(([type]) => buildingKnown(run, type)).map(([type, def]) => {
    const reason = buildBlocker(run, type);
    return `<button class="build-opt" data-action="build" data-type="${type}" ${reason ? `disabled title="${esc(reason)}"` : ''}>
      <span>${BUILDING_ICON[def.icon]} <b>${esc(def.name)}</b> · ${def.cost[0]} Gold</span><small>${esc(def.effect(def.per[0]))}${reason ? ` · ${esc(reason)}` : ''}</small></button>`;
  }).join('');
  const last = plotCount(run) - run.buildings.length === 1;
  return `<details class="room empty-plot"><summary>+ Empty plot: build here</summary>${last ? '<div class="why-not">⚠ This is your last free plot: buildings can\'t be torn down, so choose carefully. The next House level brings more.</div>' : ''}<div class="build-list">${options}</div></details>`;
}

export function estateTab(run) {
  const free = plotCount(run) - run.buildings.length;
  const order = Object.keys(DEPARTMENTS);
  const built = [...run.buildings].sort((a, b) => order.indexOf(BUILDINGS[a.type].dept) - order.indexOf(BUILDINGS[b.type].dept));
  const next = PRESTIGE_LEVELS[run.prestigeLevel];
  const locked = next ? Array.from({ length: next.plots - plotCount(run) }, () => `<div class="room locked">🔒 Unlocks at Prestige level ${next.level} (${next.at} Prestige)</div>`).join('') : '';
  const legend = order.map((d) => `<span class="legend dept-${d}">${DEPARTMENTS[d]}</span>`).join('');
  return `
    <section class="panel estate">
      <h2>The Estate <small>${run.buildings.length}/${plotCount(run)} plots · up to ${levelInfo(run.prestigeLevel).maxFighters} fighters at this level</small></h2>
      <p class="sub">Plots are limited, so every building is a trade-off. Better Quarters and an Entertainment Room keep famous fighters happy. Reaching new Prestige levels adds plots and unlocks new buildings.</p>
      <div class="legends">${legend}</div>
      <div class="villa">
        <div class="roof"></div>
        <div class="rooms">${built.map((b) => buildingCard(run, b)).join('')}${Array.from({ length: free }, () => emptyPlot(run)).join('')}${locked}</div>
      </div>
    </section>${loungePanel(run)}`;
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

export function marketTab(run) {
  const price = marketPrice(run);
  const recruitCard = (f, tag) => fighterCard(f, {
    stress: false, tag,
    actions: `<div class="actions">${button(`Recruit · ${recruitPrice(run, f)} Gold`, 'recruit', { id: f.id }, recruitBlocker(run, f.id), 'btn primary small')}</div>`,
  });
  const cards = run.market.map((f) => recruitCard(f)).join('');
  // The Unnatural Temple of Vulcan (5.3.0): raise a fighter killed in the arena as a Revenant.
  const vulcanLv = maxLevel(run, 'vulcan');
  const bodies = vulcanLv ? raisable(run) : [];
  const vulcan = !vulcanLv
    ? `<p class="sub">Build the Unnatural Temple of Vulcan${run.prestigeLevel >= 2 ? ' in the Estate' : ' (Prestige level 2)'} to raise fighters killed in the arena as Revenants.</p>`
    : `<p class="sub">The priests can raise a fighter killed in the arena up to ${effectAt('vulcan', vulcanLv)} weeks after their death, for ${reanimatePrice(run)} Gold. A Revenant keeps their class, level, perks and titles${vulcanLv >= 2 ? '' : ', but comes back with 1 less Power'}. They feel nothing: their Morale settles at ${REANIMATE.morale}, never Inspired and never Discontented.</p>
      ${bodies.length ? `<div class="cards two">${bodies.map((f) => fighterCard(f, { stress: false, tag: `Fell ${run.week - f.diedWeek} week${run.week - f.diedWeek === 1 ? '' : 's'} ago · keeps ${effectAt('vulcan', vulcanLv) - (run.week - f.diedWeek)} more`, actions: `<div class="actions">${button(`Raise as a Revenant · ${reanimatePrice(run)} Gold`, 'reanimate', { id: f.id }, reanimateBlocker(run, f.id), 'btn primary small')}</div>` })).join('')}</div>` : '<p class="sub">No bodies to raise. The Temple waits.</p>'}`;
  const offers = run.liaisonOffers ?? [];
  const liaison = offers.length
    ? `<div class="cards two">${offers.map((offer) => fighterCard(offer, { tag: `Liaison · ${esc(offer.origin)}`, notes: offer.record?.length ? `<div class="record"><div class="label">Prison record</div>${offer.record.map((c) => `<div>“${esc(c)}”</div>`).join('')}</div>` : '', actions: `<div class="actions">${button(`Recruit · ${offer.price} Gold`, 'recruit', { id: offer.id }, recruitBlocker(run, offer.id), 'btn primary small')}</div>` })).join('')}</div>`
    : maxLevel(run, 'liaison') ? '<p class="sub">No prisoners on offer this month.</p>' : `<p class="sub">Build a Liaison${run.prestigeLevel >= 2 ? ' in the Estate' : ' (Prestige level 2)'} for cheap monthly prisoners.</p>`;
  const decorShop = Object.entries(DECOR).map(([k, d]) => `<div class="shop-row"><div><b>${esc(d.name)}</b> · ${d.price} Gold <small>(${run.inventory.decor[k]} in storeroom)</small> <span class="chip small good" title="This item adds ${decorComfort(d)} comfort to the room it's in: that fighter's Morale drifts ${decorComfort(d)} points higher.">+${decorComfort(d)} comfort</span>${d.calm ? ` <span class="chip small" title="Lowers Stress each week. A room's decor lowers Stress by at most ${STRESS.decorCalm} a week in all.">−${d.calm} Stress/wk</span>` : ''}<br><small>${esc(d.effect)}</small></div>
    ${button('Buy', 'buy-decor', { item: k }, buyDecorBlocker(run, k), 'btn small primary')}</div>`).join('');
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
        ${fold('fighters', 'Market', `<p class="sub">From ${price} Gold (seasoned fighters cost more). New fighters arrive at the start of every month, stronger and more experienced as you climb the tiers. Roster: ${run.roster.length}/${rosterCap(run)}.</p>
          <div class="cards two">${cards || '<div class="empty">Sold out until next month.</div>'}</div>`, circuitInfo(run).name)}
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

export function helpModal() {
  return `<div class="modal" role="dialog" aria-label="How to play"><div class="modal-body">
    <button class="close" data-action="help" aria-label="Close">×</button>
    <h2>How to play</h2>
    <ol>
      <li><b>Recruit</b> gladiators in the Market.</li>
      <li><b>Give each a weekly job</b>: train Power or Speed, rest, or heal in the Medbay. Training builds Stress; at 50+ Stress a fighter is overtrained.</li>
      <li><b>End the week.</b> The last week of each month is a tournament. Every arena you've reached holds a bout; send one fighter to each, after checking the odds.</li>
      <li><b>Fight</b> best-of-3 rounds. Between rounds you can capitulate to save a badly hurt fighter.</li>
      <li><b>Grow your fighters.</b> Matches give XP; each level lets you pick a perk. Wins bring Renown, and famous fighters want better rooms: keep their Morale up with decor, Quarters and entertainment.</li>
      <li><b>Equip them</b> from the storeroom: decor and gear belong to the house and pass on when a fighter falls.</li>
      <li><b>Climb</b> four arenas (Tournament 1 → Tournament 2 → Boss), then win the Grand Tournament. Keep the Emperor's <b>Favour</b> above 0, and pay his tribute each winter. Opponents <b>scout</b> fighters who fight in your top arena two months running (+1 Power against them), so rotate your stars.</li>
      <li><b>Grow the Estate</b>: Prestige levels add room plots and new buildings.</li>
      <li><b>Take Fortune's card.</b> Each month offers three: a <b>relic</b> the house keeps (up to 6, and some count a perk's tag, like Brute or Swift), a boon, gear, a fighter, or a wager. Spin again for Gold if none suit.</li>
      <li><b>Every career counts.</b> Win or lose, a career earns <b>Legacy XP</b>, and each Legacy level unlocks something for the careers after it: relics, a patron, house colours, legends who return. Win a career to unlock <b>Heat</b>: harder rules, a higher score, more XP.</li>
    </ol>
    <p class="sub"><b>Shortcuts:</b> Space plays the next round, leaves a finished fight, or plays one week · T goes to fight day · 1–4 switch tabs · ? opens this page.</p>
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
  kind: 'The peoples of Battleworld, and what each is good at.',
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
export function codexTab(codex, entries, sections, fresh, prog, isUnlocked, hasLore) {
  const groups = Object.entries(sections).map(([cat, title]) => {
    const list = entries.filter((e) => e.cat === cat);
    const open = list.filter((e) => isUnlocked(codex, e));
    if (list.some((e) => e.hidden) && !open.length) return null; // v6: the Rebellion section appears only once something in it is found
    const newHere = open.filter((e) => fresh.includes(e.key)).length;
    const items = open.map((e) => {
      const lore = e.lore
        ? hasLore(codex, e) ? `<p class="lore">${esc(e.lore)}</p>` : '<p class="lore locked">🔒 Lore: defeat one in the arena to learn its story.</p>'
        : '';
      return `<article class="entry${fresh.includes(e.key) ? ' fresh' : ''}" data-search="${esc(`${e.name} ${e.rules} ${e.lore ?? ''}`.toLowerCase())}"><h4>${esc(e.name)}${fresh.includes(e.key) ? ' <span class="new">new</span>' : ''}</h4><p>${esc(e.rules)}</p>${lore}</article>`;
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
export const stewardNote = (text) => `<div class="tip steward-note" role="status">${npcPortrait('steward', 36)}<div><span class="guide-name">Your steward:</span> ${esc(text)}</div></div>`;

export function guideBar(step, onTab, run = null) {
  return `<div class="guide" role="status">${npcPortrait('steward', 44)}<div class="guide-body"><div class="guide-name">Your steward</div><div>${stepText(step, run)}</div></div>
    <div class="guide-actions">${onTab ? '' : `<button class="btn small primary" data-action="tab" data-tab="${step.tab}">Go to the ${TAB_NAMES[step.tab]}</button>`}<button class="link small" data-action="tutorial-skip">Skip tutorial</button></div></div>`;
}

export function nextBar(hint) {
  if (!hint) return '';
  const go = hint.action === 'tab' ? `<button class="btn small primary" data-action="tab" data-tab="${hint.tab}">${esc(hint.label)}</button>` : '';
  return `<div class="nextbar ${hint.tone ?? ''}" role="status"><span>➜ <b>Next:</b> ${esc(hint.text)}</span>${go}<span class="keys" title="Keyboard shortcuts">Space · T · 1–4 · ?</span></div>`;
}

// The bug report box: shown when the game hits an error, or when the player asks for it.
export function bugModal({ crashed, message, notes, status, version }) {
  return `<div class="modal bug" role="dialog" aria-label="${crashed ? 'Something went wrong' : 'Report a bug'}"><div class="modal-body">
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

// Three cards, pick one; spin again for Gold, or let it pass. PLACEHOLDER words.
export function fortunePanel(run) {
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
    ? `<div class="swap"><small>Your house holds ${FORTUNE.maxRelics} relics. Lay one down for it:</small>${run.relics.map((id) => button(`Lay down ${RELICS[id].name}`, 'fortune', { index: i, drop: id }, null, 'btn small')).join('')}</div>`
    : buttonWhy('Take it', 'fortune', { index: i }, why, 'btn primary')}
    </div>`;
  }).join('');
  const full = run.relics.length >= FORTUNE.maxRelics ? ` Your house holds its ${FORTUNE.maxRelics} relics: a new one takes the place of one you lay down.` : '';
  if (run.fortune.augur) { // version 6: the Augur's opening gift (PLACEHOLDER words)
    return `<section class="panel fortune-draft augur">
    <div class="label">Your patron</div><h2>The Augur reads the birds</h2>
    <p class="sub">Choose one relic for your house, before the first week.</p>
    <div class="fortune-cards">${cards}</div></section>`;
  }
  return `<section class="panel fortune-draft" data-rolls="${run.fortune.rerolls}">
    <div class="label">This month</div><h2>Fortune's wheel turns</h2>
    <p class="sub">Choose one. Relics stay with the house (${run.relics.length}/${FORTUNE.maxRelics}); boons, gear and fighters are yours at once.${full}</p>
    <div class="fortune-cards">${cards}</div>
    <div class="row">${button(`↻ Spin again (${rerollPrice(run)} Gold)`, 'fortune-reroll', {}, rerollBlocker(run), 'btn small')}
      ${button(`Let it pass (+${FORTUNE.pass} Gold)`, 'fortune-pass', {}, null, 'btn small')}</div>
  </section>`;
}
