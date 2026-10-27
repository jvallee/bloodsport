// Ludus screens: top bar, week planner, fight day across arenas, estate, market and storeroom, help, Codex.

import { BUILDINGS, DEPARTMENTS, PRESTIGE_LEVELS, BOSS_DEBUFFS, DECOR, ECONOMY, CIRCUITS, STRESS, FAVOR, PERKS, GEAR, XP, MORALE, CONSUMABLES, FESTIVAL_BY_ID, KINDS, CLASSES, PATRONS, DECREES, AUGMENTS, RETIRE } from '../data.js';
import { ACHIEVEMENTS, careerScore, bestFighter, unlockedPatrons, unlockedClasses, decreesUnlocked, unlockText } from '../legacy.js';
import { formatDate, weeksUntilTournament, isWinter, weeksUntilWinter, nextFestival } from '../calendar.js';
import {
  boutFor, unlockedTiers, arenaName, circuitInfo, marketPrice, surgeonPrice, recruitBlocker, jobBlocker, surgeonBlocker, fightBlocker,
  skipBlocker, forfeitBlocker, advanceBlocker, releaseBlocker, perkBlocker, buyDecorBlocker, assignDecorBlocker, removeDecorBlocker,
  buyGearBlocker, equipBlocker, unequipBlocker, sellGearBlocker, sellPrice, eventNames, eventChoiceBlocker, standings, houseOf, augmentBlocker, augmentPrice, retireBlocker, tributeDue, tributePaid, payTributeBlocker, moraleTarget, GRAND_TIER, bossLossFavor, effectivePower, matchOptions,
  isChampionOf, buyItemBlocker,
} from '../run.js';
import {
  plotCount, rosterCap, trainCap, trainCost, oracleLevel, buildBlocker, upgradeBlocker, levelInfo, maxLevel,
} from '../ludus.js';
import { describeOdds } from '../odds.js';
import { fighterWarnings, arenaStakes } from '../explain.js';
import { gearText } from '../codex.js';
import { esc, button, buttonWhy, fighterCard, ICON, BUILDING_ICON } from './components.js';
import { portrait } from './portrait.js';
import { EVENT_BY_ID, choiceLabel, stakesText } from '../events.js';

const JOB_LABELS = { rest: 'Rest', trainPower: '+1 Power', trainSpeed: '+3 Speed', medbay: 'Medbay' };
const JOB_HELP = {
  rest: `Rest: −${-STRESS.rest} Stress.`,
  trainPower: `Train Power: +1 Power this week, +${STRESS.train} Stress.`,
  trainSpeed: `Train Speed: +3 Speed this week, +${STRESS.train} Stress. Speed decides who strikes first and makes you harder to wound.`,
  medbay: 'Medbay: heals injuries over weeks.',
};

// ---------- Top bar ----------

export function topbar(run, tab, codexNew = 0, sound = true) {
  const next = PRESTIGE_LEVELS[run.prestigeLevel];
  const progress = next ? Math.min(100, (run.prestige / next.at) * 100) : 100;
  const tiers = CIRCUITS.map((c) => {
    const cls = c.tier < run.topTier ? 'won' : c.tier === run.topTier ? 'now' : '';
    return `<span class="step ${cls}" title="${esc(c.name)}">${c.tier}</span>`;
  }).join('') + `<span class="step ${run.topTier === GRAND_TIER ? 'now' : ''}" title="The Grand Tournament">👑</span>`;
  const tabBtn = (id, label, badge = '') => `<button class="tab${tab === id ? ' on' : ''}" data-action="tab" data-tab="${id}">${label}${badge}</button>`;
  const marketBadge = run.liaisonOffer || run.armourerStock.length ? '<span class="dot" title="New stock"></span>' : '';
  const codexBadge = codexNew ? `<span class="count" title="New Codex entries">${codexNew}</span>` : '';
  const levelUps = run.roster.filter((f) => f.pendingPerks.length).length;
  const ludusBadge = levelUps ? `<span class="count" title="Fighters waiting to choose a perk">${levelUps}</span>` : '';
  const low = run.favor <= FAVOR.warning;
  return `
    <header class="topbar">
      <h1>BLOODSPORT</h1>
      <div class="stat gold" title="Gold: pays for fighters, training, buildings, gear and tribute.">${ICON.gold}<b>${run.gold}</b></div>
      <div class="stat prestige" title="Prestige: staked as tournament buy-ins. Reaching thresholds raises your House level (kept forever).">${ICON.prestige}<b>${run.prestige}</b>
        <span class="lvl">Lv ${run.prestigeLevel}${next ? `<span class="lvlbar"><span style="width:${progress}%"></span></span><small>${next.at}</small>` : ''}</span></div>
      <div class="favor${low ? ' low' : ''}" title="Imperial Favor: the Emperor's opinion of you. At 0 you are executed. Lost by Boss losses and forfeits in your top arena, capitulating there, crushing weak opponents, and unpaid tribute.">
        <span>Favor</span><span class="favorbar"><span style="width:${run.favor}%"></span></span><b>${run.favor}</b></div>
      ${tributeStat(run)}
      <div class="track" title="Arena tiers">${tiers}</div>
      <div class="spacer"></div>
      <button class="btn small sound" data-action="toggle-sound" title="${sound ? 'Sound on: click to mute' : 'Sound off: click to turn on'}" aria-label="${sound ? 'Mute sound' : 'Turn sound on'}">${sound ? '🔊' : '🔇'}</button>
      <button class="btn small" data-action="help">How to play</button>
      <button class="btn small" data-action="bug-open" title="Something wrong or confusing? Send the developer a report they can replay.">Report a bug</button>
      <button class="btn small" data-action="new-run">New career</button>
    </header>
    <nav class="tabs">${tabBtn('ludus', 'Ludus', ludusBadge)}${tabBtn('estate', 'Estate')}${tabBtn('market', 'Market', marketBadge)}${tabBtn('codex', 'Codex', codexBadge)}</nav>`;
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
  if (tributePaid(run)) return `<div class="stat due paid" title="This year's tribute is paid.">⚖ <b>Paid</b></div>`;
  const short = run.gold < due && weeks <= 4;
  return `<div class="stat due${short ? ' short' : ''}" title="The Emperor's tribute: ${due} Gold, collected at the start of winter. You can pay early from the week panel. If you can't pay, he takes all your Gold and ${-FAVOR.unpaidTribute} Favor (it only ends the career if Favor hits 0).">⚖ <b>${due}</b> <small>in ${weeks} wk${weeks === 1 ? '' : 's'}</small></div>`;
}

// ---------- Banners ----------

// The end of a career: how it ended, its score, its best fighter, the fallen and the final standings.
export function endBanner(run, legacy = null) {
  const won = run.status === 'won';
  const deaths = run.fallen.length;
  const fought = run.history.filter((h) => !h.skipped && !h.forfeit);
  const wins = fought.filter((h) => h.won).length;
  const score = careerScore(run);
  const best = bestFighter(run);
  const bestWins = best ? run.history.filter((h) => h.won && h.fighterId === best.id).length : 0;
  const rank = standings(run).findIndex((h) => h.you) + 1;
  const kills = [...run.roster, ...run.fallen].reduce((n, f) => n + (f.kills ?? 0), 0);
  return `<div class="banner end ${won ? 'win' : 'loss'}">
    <h2>${won ? '👑 Master of the Games' : 'Your house has fallen'}</h2>
    <div>${esc(run.endReason)}</div>
    <div class="end-score">Score <b>${score}</b>${legacy ? ` · best ever ${Math.max(legacy.best, score)} · career ${legacy.careers}` : ''}</div>
    <div class="end-grid">
      <div><div class="label">The career</div>${formatDate(run.week)}<br>${wins} won, ${fought.length - wins} lost · ${kills} kill${kills === 1 ? '' : 's'}<br>Top arena: ${esc(arenaName(run.topTier))}<br>House rank: #${rank} of ${standings(run).length} · Glory ${run.glory ?? 0}</div>
      ${best ? `<div class="end-best">${portrait(best, 64)}<div><div class="label">Best fighter</div><b>${esc(best.name)}</b> (${esc(KINDS[best.kind].name)})<br>${bestWins} win${bestWins === 1 ? '' : 's'} · Renown ${best.renown}${best.titles?.length ? `<br>🏆 ${esc(best.titles.join(', '))}` : ''}${best.alive ? '' : '<br>Fell in the arena'}</div></div>` : ''}
      ${deaths ? `<div><div class="label">The fallen</div><div class="fallen-faces">${run.fallen.map((f) => `<span title="${esc(f.name)}">${portrait(f, 40)}</span>`).join('')}</div></div>` : ''}
    </div>
    <div class="row"><button class="btn primary" data-action="new-run">New career</button><button class="btn" data-action="replay-seed">Replay seed ${run.seed}</button></div></div>`;
}

// Choosing how the next career starts (once a past career has unlocked anything).
export function setupModal(legacy, choice) {
  const patrons = unlockedPatrons(legacy);
  const patronList = [['', { name: 'No patron', desc: 'Start as the game intends.' }], ...patrons.map((p) => [p, PATRONS[p]])]
    .map(([id, p]) => `<label class="opt"><input type="radio" name="patron" value="${id}" ${choice.patron === id ? 'checked' : ''}> <b>${esc(p.name)}</b> <small>${esc(p.desc)}</small></label>`).join('');
  const decrees = decreesUnlocked(legacy)
    ? Object.entries(DECREES).map(([id, d]) => `<label class="opt"><input type="checkbox" name="decree" value="${id}" ${choice.decrees.includes(id) ? 'checked' : ''}> <b>${esc(d.name)}</b> <small>${esc(d.desc)} (+${d.score} score if you win)</small></label>`).join('')
    : '<p class="sub">Win a career to unlock the Emperor\'s Decrees: harder rules for a higher score.</p>';
  const classes = unlockedClasses(legacy);
  return `<div class="modal setup" role="dialog" aria-label="A new career"><div class="modal-body">
    <button class="close" data-action="setup-cancel" aria-label="Close">×</button>
    <h2>A new career</h2>
    <div class="label">Patron</div>${patronList}
    <div class="label">The Emperor's Decrees</div>${decrees}
    ${classes.length ? `<p class="sub">Unlocked classes in the market: ${classes.map((c) => esc(CLASSES[c].name)).join(', ')}.</p>` : ''}
    <div class="row"><button class="btn primary" data-action="start-career">Begin</button><button class="btn" data-action="setup-cancel">Cancel</button></div>
  </div></div>`;
}

// Achievements: earned ones and what the rest would unlock.
export function legacyPanel(legacy) {
  const rows = ACHIEVEMENTS.map((a) => {
    const got = legacy.achievements.includes(a.id);
    return `<li class="${got ? 'got' : ''}"><b>${got ? '★' : '☆'} ${esc(a.name)}</b>: ${esc(a.desc)} <small>${esc(unlockText(a))}</small></li>`;
  }).join('');
  const past = legacy.past.map((p) => `<li>${p.won ? '👑' : '⚰'} Seed ${p.seed}: score <b>${p.score}</b>, ${p.weeks} weeks${p.endReason ? ` · ${esc(p.endReason)}` : ''}</li>`).join('');
  const hall = (legacy.hall ?? []).map((l) => `<div class="legend" title="${esc((l.story ?? []).map((e) => e.text).join(' '))}">${portrait(l, 48)}<div><b>${esc(l.name)}</b><br><small>${l.wins} win${l.wins === 1 ? '' : 's'} · ${l.kills} kill${l.kills === 1 ? '' : 's'}${l.titles?.length ? ` · ${esc(l.titles.join(', '))}` : ''}</small></div></div>`).join('');
  return `<section class="panel legacy"><h2>Legacy <small>${legacy.achievements.length}/${ACHIEVEMENTS.length} · ${legacy.careers} career${legacy.careers === 1 ? '' : 's'} · best score ${legacy.best}</small></h2>
    <p class="sub">Achievements carry over between careers and unlock patrons, new classes and the Emperor's Decrees.</p>
 ${hall ? `<h3 class="mini">Hall of Champions</h3><div class="hall">${hall}</div>` : ''}
    <ul class="achievements">${rows}</ul>${past ? `<h3 class="mini">Past careers</h3><ul class="past">${past}</ul>` : ''}</section>`;
}

// A notice when something is earned mid-career.
export const achievementNotice = (a) => `<div class="banner achievement"><h2>★ Achievement: ${esc(a.name)}</h2><div>${esc(a.desc)} ${esc(unlockText(a))} (from your next career)</div></div>`;

const plus = (n) => `${n >= 0 ? '+' : ''}${n}`;

export function summaryBanner(s) {
  if (!s) return '';
  const verdict = s.reason === 'towel' ? 'capitulated' : s.died ? 'was slain' : s.won ? 'won' : 'lost';
  const bits = [`${plus(s.gold)} Gold`, `${plus(s.prestige)} Prestige`];
  if (s.xp && !s.died) bits.push(`${plus(s.xp)} XP`);
  if (s.renown) bits.push(`${plus(s.renown)} Renown`);
  if (s.favor) bits.push(`${plus(s.favor)} Favor`);
  if (s.title) bits.push(`🏆 ${s.fighter} earns the title "${s.title}"${s.title === 'Master of the Games' ? '' : ' (+1 Power)'}`);
  if (s.bloodied) bits.push(`🩸 Bloodied Victory: won with 2+ injuries (extra Favor, Renown, XP and Morale)`);
  if (s.kill) bits.push(`💀 A kill${s.mark ? `: ${s.fighter} earns the mark "${s.mark}"` : ''}`);
  if (s.feud) bits.push(`⚔ ${s.feud}`);
  if (s.scar) bits.push(`🩹 ${s.fighter} is scarred: ${s.scar}`);
  if (s.eulogy) bits.push(`⚰ ${s.eulogy}`);
  if (s.loot) bits.push(`⚒ Claimed a ${GEAR[s.loot].name}`);
  if (s.injuries?.length) bits.push(`🩸 ${s.fighter} is now ${s.injuries.join(' and ')}: send them to the Medbay`);
  if (s.crushing) bits.push('The crowd jeered the mismatch');
  if (s.bloodFaith) bits.push('Blood Faith refunded the buy-in');
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

export function tutorialCard(step, where = 'ludus') {
  if (!step) return '';
  return `<div class="tip tutorial ${where}" role="note">
    <div><div class="tip-title">📜 ${step.title}</div><div>${step.body}</div></div>
    <div class="tip-actions"><button class="btn small primary" data-action="tutorial-done" data-step="${step.id}">Got it</button>
    <button class="link small" data-action="tutorial-skip">Skip tutorial</button></div></div>`;
}

export function introModal(page, pages) {
  const p = pages[page];
  const dots = pages.map((_, i) => `<i class="${i === page ? 'on' : ''}"></i>`).join('');
  const last = page === pages.length - 1;
  return `<div class="modal intro" role="dialog" aria-label="${esc(p.title)}"><div class="modal-body">
    <div class="intro-kicker">Bloodsport</div>
    <h2>${p.title}</h2>${p.body}
    <div class="intro-nav"><span class="dots">${dots}</span>
      <span class="row">${page > 0 ? '<button class="btn" data-action="intro-back">Back</button>' : '<button class="link" data-action="intro-close">Skip intro</button>'}
      <button class="btn primary" data-action="${last ? 'intro-close' : 'intro-next'}">${last ? 'Enter the Ludus' : 'Next'}</button></span></div>
  </div></div>`;
}

// ---------- Ludus tab ----------

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
    ? `<div class="tribute${run.gold < due ? ' short' : ''}">⚖ The Emperor's tribute of <b>${due} Gold</b> is due in <b>${toTribute}</b> week${toTribute === 1 ? '' : 's'}. You have ${run.gold}.${run.gold < due ? ` Short by ${due - run.gold}: if you can't pay, the Emperor takes all your Gold and ${-FAVOR.unpaidTribute} Favor.` : ''}</div>`
    : '';
  const recent = run.log.slice(-9).reverse().map((l) => `<li class="${l.tone}">${esc(l.text)}</li>`).join('');
  return `
    <section class="panel week">
      <h2>${formatDate(run.week)}</h2>
      ${status}
      ${festivalNote(run)}
      ${tribute}
      <div class="row">
        ${button('End week', 'advance', {}, blocked, 'btn primary')}
        ${button('Skip to tournament', 'advance-tournament', {}, blocked, 'btn')}
      </div>
      ${blocked && !run.boutPending ? `<div class="why-not">${esc(blocked)}</div>` : ''}
      <p class="sub">Each fighter does their job once per week. Jobs stay set until you change them.
        ${tributePaid(run) ? 'This year\'s tribute is paid.' : `Tribute of <b>${tributeDue(run)} Gold</b> is due in ${toTribute} week${toTribute === 1 ? '' : 's'}. ${buttonWhy('Pay now', 'pay-tribute', {}, payTributeBlocker(run), 'btn small')}`}</p>
      ${standingsTable(run)}
      <h3 class="mini">House log</h3>
      <ul class="log">${recent}</ul>
      ${run.log.length > 9 ? `<details class="more" data-key="full-log"><summary>Full house log (${run.log.length} entries)</summary>
        <ul class="log full">${[...run.log].reverse().map((l) => `<li class="${l.tone}"><small>${esc(formatDate(l.week))}</small> ${esc(l.text)}</li>`).join('')}</ul></details>` : ''}
    </section>`;
}

// "Opponent · House Varro", in the house's colour.
export function houseTag(run, f) {
  const h = houseOf(run, f);
  return h ? `Opponent · <span style="color:${esc(h.color)}">${esc(h.name)}</span>` : 'Opponent';
}

// The rival houses and your place among them.
export function standingsTable(run) {
  if (!run.houses) return '';
  const rows = standings(run).map((h, i) => {
    const notes = [h.feud ? `<span class="feud" title="You killed one of theirs: their fighters get +1 Power against you">feud ${h.feud}</span>` : '',
      h.vengeance ? `<span class="vengeance" title="They killed one of yours: your fighters get +5% win chance against them">vengeance ${h.vengeance}</span>` : ''].join('');
    return `<tr class="${h.you ? 'you' : ''}"><td>${i + 1}</td><td><span class="house-dot" style="background:${esc(h.color)}"></span>${esc(h.name)}${h.motto ? `<small title="${esc(h.motto)}"> ❝</small>` : ''} ${notes}</td><td>${esc(arenaName(Math.min(h.tier, 4)).replace('The ', ''))}</td><td><b>${h.glory}</b></td></tr>`;
  }).join('');
  return `<h3 class="mini" title="Glory: a win is worth its arena tier (three times that for a Boss); rivals fight their own bouts every tournament week">The houses</h3>
    <table class="standings"><thead><tr><th>#</th><th>House</th><th>Arena</th><th>Glory</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function perkChooser(run, f) {
  if (!f.pendingPerks.length) return '';
  const offer = f.pendingPerks[0].map((p) => `<button class="perk-opt" data-action="perk" data-id="${f.id}" data-perk="${p}" ${perkBlocker(run, f.id, p) ? 'disabled' : ''}>
    <b>${esc(PERKS[p].name)}${PERKS[p].repeatable ? ' <small class="stacks">(stacks: can be taken again)</small>' : ''}${f.perks.includes(p) ? ` <small class="stacks">you have ×${f.perks.filter((x) => x === p).length}</small>` : ''}</b><small>${esc(PERKS[p].desc)}</small></button>`).join('');
  return `<div class="perk-choice"><div class="label">⭐ Level ${f.level - f.pendingPerks.length + 1}! Choose a perk:</div><div class="perk-list">${offer}</div></div>`;
}

function roomPanel(run, f) {
  const decor = Object.entries(DECOR).map(([k, d]) => {
    const helps = d.helps(f);
    return `<div class="decor-opt"><div class="row tight"><span><b>${esc(d.name)}</b> ×${f.decor[k]}</span>
      ${button(`+ Place (${run.inventory.decor[k]} in storeroom)`, 'assign-decor', { id: f.id, item: k }, assignDecorBlocker(run, f.id, k))}
      ${button('− Take back', 'remove-decor', { id: f.id, item: k }, removeDecorBlocker(run, f.id, k))}</div>
      <small>${helps ? '✦ ' : ''}${esc(d.effect)}</small></div>`;
  }).join('');
  const { target, comfort, expects } = moraleTarget(run, f);
  const gear = ['weapon', 'armor'].map((slot) => {
    const cur = f.gear[slot];
    const options = run.inventory.gear.map((k, i) => {
      if (GEAR[k].slot !== slot) return '';
      const why = equipBlocker(run, f.id, i);
      return `<button class="btn small equip" data-action="equip" data-id="${f.id}" data-index="${i}" title="${esc(why ?? `${GEAR[k].name}: ${gearText(GEAR[k])}`)}" ${why ? 'disabled' : ''}>Equip ${esc(GEAR[k].name)} <small>(${esc(gearText(GEAR[k]))})</small></button>`;
    }).join('');
    return `<div class="gear-slot"><span class="label">${slot === 'weapon' ? 'Weapon' : 'Armor'}:</span> ${cur ? `<b>${esc(GEAR[cur].name)}</b> <small>${esc(gearText(GEAR[cur]))}</small> ${button('Unequip', 'unequip', { id: f.id, slot }, unequipBlocker(run, f.id, slot), 'btn small unequip')}` : '<small>empty</small>'}
      ${options ? `<div class="row tight">${options}</div>` : ''}</div>`;
  }).join('');
  return `<div class="label">Morale is heading to <b>${target}</b>: comfort ${comfort} vs expectations ${expects} (Renown ${f.renown})${f.mood ? `, mood ${f.mood.n > 0 ? '+' : ''}${f.mood.n} for ${f.mood.weeks} more week${f.mood.weeks === 1 ? '' : 's'}` : ''}.</div>
    <div class="decor-list">${decor}</div>
    <div class="label">Gear (from the storeroom)</div>${gear}`;
}

function rosterPanel(run) {
  const cards = run.roster.map((f) => {
    const jobs = Object.keys(JOB_LABELS).map((job) => {
      const reason = f.job === job ? null : jobBlocker(run, f.id, job);
      return `<button class="seg${f.job === job ? ' on' : ''}" data-action="job" data-id="${f.id}" data-job="${job}" ${reason ? `disabled title="${esc(reason)}"` : `title="${esc(JOB_HELP[job])}"`}>${JOB_LABELS[job]}</button>`;
    }).join('');
    const surgeon = f.injuries.map((inj, i) => button(`Surgeon: ${esc(inj.tag === 'fleshWound' ? 'Flesh Wound' : inj.tag)} (${surgeonPrice(run)}g)`, 'surgeon', { id: f.id, index: i }, surgeonBlocker(run, f.id, i))).join('');
    const augments = f.injuries.map((inj, i) => (['maimed', 'blinded'].includes(inj.tag) ? buttonWhy(`Replace the ${inj.tag === 'maimed' ? 'Maimed limb' : 'Blinded eye'}: ${AUGMENTS[inj.tag === 'maimed' ? 'arm' : 'eye'].name}`, 'augment', { id: f.id, index: i }, augmentBlocker(run, f.id, i)) : '')).join('');
    const actions = `${perkChooser(run, f)}<div class="actions">
      <div class="label">This week's job <small>· trained ${f.trained}/${trainCap(run)}, ${trainCost(run)} Gold per training week</small></div>
      <div class="segs">${jobs}</div>
      ${f.job === 'rest' && jobBlocker(run, f.id, 'trainPower') && jobBlocker(run, f.id, 'trainSpeed') ? `<div class="why-not">Can't train this week: ${esc(jobBlocker(run, f.id, 'trainPower'))}</div>` : ''}
      <details class="more" data-key="room-${f.id}"><summary>Room, decor &amp; gear${Object.keys(DECOR).some((k) => DECOR[k].helps(f)) ? ' ✦' : ''}</summary>${roomPanel(run, f)}</details>
      ${f.story?.length ? `<details class="more" data-key="story-${f.id}"><summary>Story</summary><ul class="story">${f.story.map((e) => `<li><small>${esc(formatDate(e.week))}</small> ${esc(e.text)}</li>`).join('')}</ul></details>` : ''}
      <details class="more" data-key="surgeon-${f.id}"><summary>Surgeon, cyborg surgery, retire, release</summary>
        ${surgeon ? `<div class="label">Emergency Surgeon: heals instantly</div><div class="row">${surgeon}</div>` : '<small class="sub">No injuries.</small>'}
        ${augments ? `<div class="label">Cyborg surgery: replace the wound for good (${augmentPrice(run)} Gold, −1 Renown)</div><div class="row">${augments}</div>` : ''}
        <div class="row">${buttonWhy(`Retire to the Hall of Champions (+${RETIRE.prestige} Prestige, roster +${RETIRE.morale} Morale)`, 'retire', { id: f.id }, retireBlocker(run, f.id), 'btn small')}</div>
        <div class="row">${button('Release fighter', 'release', { id: f.id }, releaseBlocker(run, f.id), 'btn small ghost')}</div>
      </details>
    </div>`;
    return fighterCard(f, { actions });
  }).join('');
  return `
    <section class="panel">
      <h2>Your gladiators <small>${run.roster.length}/${rosterCap(run)}</small></h2>
      <div class="cards">${cards || '<div class="empty">No gladiators yet. Recruit some in the <button class="link" data-action="tab" data-tab="market">Market</button>.</div>'}</div>
      ${run.fallen.length ? `<p class="sub fallen">⚰ Fallen: ${run.fallen.map((f) => esc(f.name)).join(', ')}</p>` : ''}
    </section>`;
}

function oddsRow(run, f, tier, oddsFor) {
  const bout = boutFor(run, tier);
  const odds = describeOdds(oddsFor(f, tier), oracleLevel(run));
  const pct = (p) => (p ? ` <small>${p}</small>` : '');
  const warn = fighterWarnings(run, f, tier).map((w) => esc(w.text));
  const tone = odds.win === 'Strong favorite' || odds.win === 'Favored' ? 'good' : odds.win === 'Even fight' ? '' : 'bad';
  return `<div class="odds-row">
    <div class="who"><b>${esc(f.name)}</b> ${warn.length ? `<span class="warn">${warn.join(' · ')}</span>` : ''}</div>
    <div class="o ${tone}" title="Chance to win the whole match (best of 3), not one round">Match: ${odds.win}${pct(odds.winPct)}</div>
    <div class="o" title="Chance of picking up at least one injury">Injury: ${odds.injury}${pct(odds.injuryPct)}</div>
    <div class="o ${odds.death === 'None' || odds.death === 'Low' ? '' : 'bad'}" title="Chance of dying if you never capitulate">Death: ${odds.death}${pct(odds.deathPct)}</div>
    ${run.bouts?.[tier] === 'open' ? buttonWhy(`Send (−${bout.buyIn} Prestige)`, 'fight', { id: f.id, tier }, fightBlocker(run, f.id, tier), 'btn primary small') : ''}
  </div>`;
}

function arenaBlock(run, tier, oddsFor) {
  const bout = boutFor(run, tier);
  const arena = run.arenas[tier];
  const state = run.bouts?.[tier];
  // The Dirt Pits Boss has no arena rule; the Oracle (Lv 2) previews the top Boss's rule early.
  const ruleId = bout.boss ? bout.debuff : bout.top && oracleLevel(run) >= 2 && tier > 1 ? arena.debuff : null;
  const debuff = ruleId ? BOSS_DEBUFFS[ruleId] : null;
  const debuffNote = debuff
    ? `<div class="debuff">☠ ${bout.boss ? 'Boss arena' : 'Oracle foresees the Boss arena'}: <b>${esc(debuff.name)}</b>. ${esc(debuff.desc)}</div>`
    : bout.boss && tier === 1 ? '<div class="sub">This first Boss fights without an arena rule.</div>' : '';
  const stakes = esc(arenaStakes(run, tier));
  const rival = arena.opponent.rival ? '<div class="warn">⚔ A rival returns: this Boss beat you before, and has grown stronger.</div>' : '';
  const rows = state === 'open' || !run.bouts ? run.roster.map((f) => oddsRow(run, f, tier, oddsFor)).join('') : '';
  const choice = bout.top && run.boutPending
    ? `<div class="row">${bout.boss ? button(`Forfeit (${bossLossFavor(tier, run) + FAVOR.forfeitExtra} Favor)`, 'forfeit', {}, forfeitBlocker(run), 'btn danger small') : button(`Skip (+${ECONOMY.skipGold} Gold, roster rests)`, 'skip', {}, skipBlocker(run), 'btn small')}</div>`
    : '';
  const buyIn = bout.pauper ? `Buy-in ${bout.buyIn} Prestige <i>(normally ${bout.fullBuyIn}: the Dirt Pits take whatever Prestige you have)</i>` : `Buy-in ${bout.buyIn} Prestige`;
  const body = `<p class="sub"><b>${esc(bout.name)}</b> · ${buyIn} · Win: +${bout.winGold} Gold, +${bout.winPrestige} Prestige · Loss: +${bout.lossGold} Gold</p>
      ${stakes ? `<p class="sub">${stakes}</p>` : ''}${rival}${debuffNote}
      ${bout.festival ? `<div class="festival now">🏛 <b>${esc(FESTIVAL_BY_ID[bout.festival].name)}</b>: ${esc(FESTIVAL_BY_ID[bout.festival].desc)}</div>` : ''}
      ${fighterCard(arena.opponent, { compact: true, stress: false, tag: houseTag(run, arena.opponent) })}
      ${state === 'done' ? '<p class="sub">✔ Settled this week. The opponent above is next month\'s.</p>' : `<h3 class="mini">Your odds</h3>${rows || '<div class="empty">No fighters to send.</div>'}`}
      ${choice}`;
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
      ${oracleNote}
    </section>`;
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
  const options = Object.entries(BUILDINGS).map(([type, def]) => {
    const reason = buildBlocker(run, type);
    return `<button class="build-opt" data-action="build" data-type="${type}" ${reason ? `disabled title="${esc(reason)}"` : ''}>
      <span>${BUILDING_ICON[def.icon]} <b>${esc(def.name)}</b> · ${def.cost[0]} Gold</span><small>${esc(def.effect(def.per[0]))}${reason ? ` · ${esc(reason)}` : ''}</small></button>`;
  }).join('');
  return `<details class="room empty-plot"><summary>+ Empty plot: build here</summary><div class="build-list">${options}</div></details>`;
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
    </section>`;
}

// ---------- Market tab: fighters, decor, Armourer, storeroom ----------

export function marketTab(run) {
  const price = marketPrice(run);
  const cards = run.market.map((f) => fighterCard(f, {
    stress: false,
    actions: `<div class="actions">${button(`Recruit · ${price} Gold`, 'recruit', { id: f.id }, recruitBlocker(run, f.id), 'btn primary small')}</div>`,
  })).join('');
  const offer = run.liaisonOffer;
  const liaison = offer
    ? fighterCard(offer, { tag: `Liaison · ${esc(offer.origin)}`, actions: `<div class="actions">${button(`Recruit · ${offer.price} Gold`, 'recruit', { id: offer.id }, recruitBlocker(run, offer.id), 'btn primary small')}</div>` })
    : maxLevel(run, 'liaison') ? '<p class="sub">No prisoner on offer this month.</p>' : `<p class="sub">Build a Liaison${run.prestigeLevel >= 2 ? ' in the Estate' : ' (Prestige level 2)'} for a cheap monthly prisoner.</p>`;
  const decorShop = Object.entries(DECOR).map(([k, d]) => `<div class="shop-row"><div><b>${esc(d.name)}</b> · ${d.price} Gold <small>(${run.inventory.decor[k]} in storeroom)</small><br><small>${esc(d.effect)}</small></div>
    ${button('Buy', 'buy-decor', { item: k }, buyDecorBlocker(run, k), 'btn small primary')}</div>`).join('');
  const armourer = maxLevel(run, 'armourer')
    ? run.armourerStock.length
      ? run.armourerStock.map((k, i) => `<div class="shop-row"><div><b>${esc(GEAR[k].name)}</b> · ${GEAR[k].price} Gold <small>${GEAR[k].slot}</small><br><small>${esc(gearText(GEAR[k]))}</small></div>
        ${button('Buy', 'buy-gear', { index: i }, buyGearBlocker(run, i), 'btn small primary')}</div>`).join('')
      : '<p class="sub">Sold out until next month.</p>'
    : '<p class="sub">Build an Armourer (Prestige level 2) to buy weapons and armor; it stocks up the moment it opens. Beaten opponents sometimes drop theirs, and your top arena\'s Boss always does.</p>';
  const stored = run.inventory.gear.length
    ? run.inventory.gear.map((k, i) => `<div class="shop-row"><div><b>${esc(GEAR[k].name)}</b> <small>${GEAR[k].slot}</small><br><small>${esc(gearText(GEAR[k]))}</small></div>
      ${button(`Sell · ${sellPrice(k)} Gold`, 'sell-gear', { index: i }, sellGearBlocker(run, i), 'btn small')}</div>`).join('')
    : '<small class="sub">No spare gear.</small>';
  const storedDecor = Object.entries(run.inventory.decor).filter(([, n]) => n).map(([k, n]) => `<span class="chip decor">${esc(DECOR[k].name)} ×${n}</span>`).join(' ') || '<small class="sub">No spare decor.</small>';
  return `
    <div class="grid market">
      <section class="panel"><h2>Market <small>${circuitInfo(run).name}</small></h2>
        <p class="sub">${price} Gold each. New fighters arrive at the start of every month, stronger as you climb the tiers. Roster: ${run.roster.length}/${rosterCap(run)}.</p>
        <div class="cards two">${cards || '<div class="empty">Sold out until next month.</div>'}</div></section>
      <div class="stack">
        <section class="panel"><h2>The Storeroom</h2>
          <p class="sub">Everything here belongs to the house. Hand it out from each fighter's "Room, decor &amp; gear" panel. A fallen fighter's things come back here.</p>
          <div class="label">Gear <small>(sells for half price)</small></div><div>${stored}</div>
          <div class="label">Decor</div><div class="chips">${storedDecor}</div>
          <div class="label">Fight items</div><div class="chips">${Object.entries(run.inventory.items ?? {}).filter(([, n]) => n).map(([k, n]) => `<span class="chip" title="${esc(CONSUMABLES[k].desc)}">${esc(CONSUMABLES[k].name)} ×${n}</span>`).join(' ') || '<small class="sub">None. The Apothecary sells them.</small>'}</div></section>
        <section class="panel"><h2>Apothecary</h2><p class="sub">Single-use items for a fight. Use one before Round 1 or between rounds, at most one per fight.</p>${Object.entries(CONSUMABLES).map(([k, c]) => `<div class="shop-row"><div><b>${esc(c.name)}</b> · ${c.price} Gold <small>(${run.inventory.items?.[k] ?? 0} in storeroom)</small><br><small>${esc(c.desc)}</small></div>
          ${button('Buy', 'buy-item', { item: k }, buyItemBlocker(run, k), 'btn small primary')}</div>`).join('')}</section>
        <section class="panel"><h2>Decor merchant</h2><p class="sub">Each fighter's quarters fit up to ${maxLevel(run, 'quarters')} of each item (your best Fighter Quarters level).</p>${decorShop}</section>
        <section class="panel"><h2>The Armourer</h2>${armourer}</section>
        <section class="panel"><h2>The Liaison</h2>${liaison}</section>
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
      <li><b>Climb</b> four arenas (Tournament 1 → Tournament 2 → Boss), then win the Grand Tournament. Keep the Emperor's <b>Favor</b> above 0, and pay his tribute each winter. Opponents <b>scout</b> fighters who fight in your top arena two months running (+1 Power against them), so rotate your stars.</li>
      <li><b>Grow the Estate</b>: Prestige levels add room plots and new buildings.</li>
    </ol>
    <p class="sub"><b>Shortcuts:</b> Space plays the next round, leaves a finished fight, or ends the week · T skips to the tournament · 1–4 switch tabs · ? opens this page.</p>
    <p class="sub">Every rule, trait, perk and item is explained in the <b>Codex</b> tab as you discover it.</p>
    <div class="row"><button class="btn small" data-action="intro-replay">Replay the intro</button><button class="btn small" data-action="tutorial-replay">Restart the tutorial</button><button class="btn small" data-action="tab" data-tab="codex">Open the Codex</button></div>
    <div class="row"><button class="btn small" data-action="export-save" title="Download your career, Codex and Legacy as one file">Export save</button><button class="btn small" data-action="import-save" title="Load a save file (replaces your current career)">Import save</button></div>
  </div></div>`;
}

// ---------- Codex tab ----------

export function codexTab(codex, entries, sections, fresh, prog, isUnlocked, hasLore) {
  const groups = Object.entries(sections).map(([cat, title]) => {
    const list = entries.filter((e) => e.cat === cat);
    const open = list.filter((e) => isUnlocked(codex, e)).length;
    const items = list.map((e) => {
      if (!isUnlocked(codex, e)) return `<div class="entry locked"><b>???</b><small>Meet one in the arena to learn more.</small></div>`;
      const lore = e.lore
        ? hasLore(codex, e) ? `<p class="lore">${esc(e.lore)}</p>` : '<p class="lore locked">🔒 Lore: defeat one in the arena to learn its story.</p>'
        : '';
      return `<div class="entry${fresh.includes(e.key) ? ' fresh' : ''}"><b>${esc(e.name)}${fresh.includes(e.key) ? ' <span class="new">new</span>' : ''}</b><p>${esc(e.rules)}</p>${lore}</div>`;
    }).join('');
    return `<section class="codex-group"><h3>${title} <small>${cat === 'basics' ? '' : `${open}/${list.length}`}</small></h3><div class="entries">${items}</div></section>`;
  }).join('');
  return `<section class="panel codex"><h2>The Codex <small>${prog.found}/${prog.total} discovered · carries over between careers</small></h2>
    <p class="sub">Entries unlock the first time you see something. Defeat a Kind, Class or weapon in the arena to unlock its lore.</p>${groups}</section>`;
}

export { XP };

// ---------- Next step ----------

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
export function eventCard(run) {
  if (!run.event) return '';
  const e = EVENT_BY_ID[run.event.id];
  const names = eventNames(run);
  const who = [run.event.f, run.event.g].map((id) => run.roster.find((f) => f.id === id)).filter(Boolean);
  const faces = who.map((f) => portrait(f, 56)).join('');
  const choices = e.choices.map((c, i) => `<div class="event-choice">${buttonWhy(esc(choiceLabel(c, names)), 'event-choice', { index: i }, eventChoiceBlocker(run, i), 'btn')}<small>${esc(stakesText(c.effects).replace(/\bthem\b/g, names.f ?? 'them').replace(/\bthe other\b/g, names.g ?? 'the other'))}</small></div>`).join('');
  return `<section class="panel event-card"><div class="event-faces">${faces}</div><div class="event-body">
    <div class="label">This week</div><h2>${esc(e.title)}</h2><p>${esc(e.text(names))}</p>
    <div class="row event-choices">${choices}</div></div></section>`;
}
