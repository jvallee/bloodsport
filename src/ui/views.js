// Ludus screens: top bar, week planner, next bout, estate, market, help.

import { BUILDINGS, DEPARTMENTS, PRESTIGE_LEVELS, BOSS_DEBUFFS, DECOR, ECONOMY, CIRCUITS, STRESS } from '../data.js';
import { formatDate, weeksUntilTournament, isWinter } from '../calendar.js';
import {
  currentBout, circuitInfo, marketPrice, recruitBlocker, jobBlocker, decorBlocker, surgeonBlocker, fightBlocker,
  skipBlocker, forfeitBlocker, advanceBlocker, releaseBlocker,
} from '../run.js';
import {
  plotCount, rosterCap, trainCap, trainCost, oracleLevel, buildBlocker, upgradeBlocker, levelInfo,
} from '../ludus.js';
import { describeOdds } from '../odds.js';
import { esc, button, fighterCard, ICON, BUILDING_ICON } from './components.js';

const JOB_LABELS = { rest: 'Rest', trainPower: '+Power', trainSpeed: '+Speed', medbay: 'Medbay' };
const JOB_HELP = {
  rest: `Rest: −${-STRESS.rest} Stress.`,
  trainPower: `Train Power: +1 Power this week, +${STRESS.train} Stress.`,
  trainSpeed: `Train Speed: +1 Speed this week, +${STRESS.train} Stress.`,
  medbay: 'Medbay: heals injuries over weeks.',
};

// ---------- Top bar ----------

export function topbar(run, tab) {
  const next = PRESTIGE_LEVELS[run.prestigeLevel];
  const progress = next ? Math.min(100, (run.prestige / next.at) * 100) : 100;
  const strikes = Array.from({ length: ECONOMY.maxStrikes }, (_, i) => `<i class="${i < run.strikes ? 'on' : ''}"></i>`).join('');
  const tiers = CIRCUITS.map((c) => {
    const cls = run.grand || c.tier < run.tier ? 'won' : c.tier === run.tier ? 'now' : '';
    return `<span class="step ${cls}" title="${esc(c.name)}">${c.tier}</span>`;
  }).join('') + `<span class="step ${run.grand ? 'now' : ''}" title="The Grand Tournament">👑</span>`;
  const tabBtn = (id, label, badge = '') => `<button class="tab${tab === id ? ' on' : ''}" data-action="tab" data-tab="${id}">${label}${badge}</button>`;
  const marketBadge = run.liaisonOffer ? '<span class="dot" title="Liaison offer"></span>' : '';
  return `
    <header class="topbar">
      <h1>BLOODSPORT</h1>
      <div class="stat gold" title="Gold: pays for fighters, training, buildings and the surgeon.">${ICON.gold}<b>${run.gold}</b></div>
      <div class="stat prestige" title="Prestige: staked as tournament buy-ins. Reaching thresholds raises your House level (kept forever).">${ICON.prestige}<b>${run.prestige}</b>
        <span class="lvl">Lv ${run.prestigeLevel}${next ? `<span class="lvlbar"><span style="width:${progress}%"></span></span><small>${next.at}</small>` : ''}</span></div>
      <div class="strikes" title="Imperial Strikes: lose a Boss and you get one. Three and you're executed.">${strikes}</div>
      <div class="track" title="Arena tiers">${tiers}</div>
      <div class="spacer"></div>
      <button class="btn small" data-action="help">How to play</button>
      <button class="btn small" data-action="new-run">New career</button>
    </header>
    <nav class="tabs">${tabBtn('ludus', 'Ludus')}${tabBtn('estate', 'Estate')}${tabBtn('market', 'Market', marketBadge)}</nav>`;
}

// ---------- Banners ----------

export function endBanner(run) {
  const won = run.status === 'won';
  const deaths = run.fallen.length;
  const wins = run.history.filter((h) => h.won).length;
  return `<div class="banner ${won ? 'win' : 'loss'}">
    <h2>${won ? '👑 Master of the Games' : 'Your house has fallen'}</h2>
    <div>${esc(run.endReason)}</div>
    <div class="sub">${formatDate(run.week)} · ${wins} bouts won · ${deaths} gladiator${deaths === 1 ? '' : 's'} lost · Prestige level ${run.prestigeLevel}</div>
    <div class="row"><button class="btn primary" data-action="new-run">New career</button><button class="btn" data-action="replay-seed">Replay seed ${run.seed}</button></div></div>`;
}

export function summaryBanner(s) {
  if (!s) return '';
  const verdict = s.reason === 'towel' ? 'threw in the towel' : s.died ? 'was slain' : s.won ? 'won' : 'lost';
  const bits = [`${s.gold >= 0 ? '+' : ''}${s.gold} Gold`, `${s.prestige >= 0 ? '+' : ''}${s.prestige} Prestige`];
  if (s.title) bits.push(`🏆 ${s.fighter} earns the title "${s.title}" (+1 Power)`);
  if (s.bloodFaith) bits.push('Blood Faith refunded the buy-in');
  if (s.strike) bits.push('⚠ Imperial Strike');
  if (s.levelUp) bits.push(`⭐ House Prestige level ${s.levelUp}! Visit the Estate.`);
  return `<div class="banner ${s.won ? 'win' : 'loss'}"><button class="close" data-action="dismiss-summary" aria-label="Dismiss">×</button>
    <h2>${esc(s.name)}: ${esc(s.fighter)} ${verdict}</h2><div>${bits.map(esc).join(' · ')}</div></div>`;
}

export function tipBanner(tip) {
  return tip ? `<div class="tip"><span>💡 ${tip.text}</span><button class="btn small" data-action="dismiss-tip" data-tip="${tip.id}">Got it</button></div>` : '';
}

// ---------- Ludus tab ----------

function weekPanel(run) {
  const until = weeksUntilTournament(run.week);
  const status = run.boutPending
    ? '<div class="when now">⚔ Tournament week!</div>'
    : until === 0
      ? '<div class="when">This week\'s bout is settled. End the week to carry on.</div>'
      : `<div class="when">${isWinter(run.week) ? '❄ Winter Dead Season: no tournaments. Heal, train and build. ' : ''}Next tournament in <b>${until}</b> week${until === 1 ? '' : 's'}.</div>`;
  const blocked = advanceBlocker(run);
  const recent = run.log.slice(-8).reverse().map((l) => `<li class="${l.tone}">${esc(l.text)}</li>`).join('');
  return `
    <section class="panel week">
      <h2>${formatDate(run.week)}</h2>
      ${status}
      <div class="row">
        ${button('End week', 'advance', {}, blocked, 'btn primary')}
        ${button('Skip to tournament', 'advance-tournament', {}, blocked, 'btn')}
      </div>
      <p class="sub">Each fighter does their job once per week. Jobs stay set until you change them.</p>
      <h3 class="mini">House log</h3>
      <ul class="log">${recent}</ul>
    </section>`;
}

function rosterPanel(run) {
  const cards = run.roster.map((f) => {
    const jobs = Object.keys(JOB_LABELS).map((job) => {
      const reason = f.job === job ? null : jobBlocker(run, f.id, job);
      return `<button class="seg${f.job === job ? ' on' : ''}" data-action="job" data-id="${f.id}" data-job="${job}" ${reason ? `disabled title="${esc(reason)}"` : `title="${esc(JOB_HELP[job])}"`}>${JOB_LABELS[job]}</button>`;
    }).join('');
    const decor = Object.keys(DECOR).map((k) => button(`+${DECOR[k].name}`, 'decor', { id: f.id, item: k }, decorBlocker(run, f.id, k))).join('');
    const surgeon = f.injuries.map((inj, i) => button(`Surgeon: ${esc(inj.tag === 'fleshWound' ? 'Flesh Wound' : inj.tag)} (${ECONOMY.surgeonCost}g)`, 'surgeon', { id: f.id, index: i }, surgeonBlocker(run, f.id, i))).join('');
    const actions = `<div class="actions">
      <div class="label">This week's job <small>· trained ${f.trained}/${trainCap(run)}, ${trainCost(run)} Gold per training week</small></div>
      <div class="segs">${jobs}</div>
      <details class="more"><summary>Decor, surgeon, release</summary>
        <div class="label">Quarters decor (${ECONOMY.decorCost} Gold each)</div><div class="row">${decor}</div>
        ${surgeon ? `<div class="label">Emergency Surgeon: heals instantly</div><div class="row">${surgeon}</div>` : ''}
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

function oddsRow(run, f, oddsFor) {
  const bout = currentBout(run);
  const odds = describeOdds(oddsFor(f), oracleLevel(run));
  const pct = (p) => (p ? ` <small>${p}</small>` : '');
  const warn = [];
  if (f.stress >= STRESS.overtrained) warn.push('Overtrained');
  if (f.injuries.length) warn.push(`${f.injuries.length} injur${f.injuries.length === 1 ? 'y' : 'ies'}`);
  const tone = odds.win === 'Strong favorite' || odds.win === 'Favored' ? 'good' : odds.win === 'Even fight' ? '' : 'bad';
  return `<div class="odds-row">
    <div class="who"><b>${esc(f.name)}</b> ${warn.length ? `<span class="warn">${warn.join(' · ')}</span>` : ''}</div>
    <div class="o ${tone}" title="Chance to win the match">${odds.win}${pct(odds.winPct)}</div>
    <div class="o" title="Chance of picking up at least one injury">Injury: ${odds.injury}${pct(odds.injuryPct)}</div>
    <div class="o ${odds.death === 'None' || odds.death === 'Low' ? '' : 'bad'}" title="Chance of dying if you never throw in the towel">Death: ${odds.death}${pct(odds.deathPct)}</div>
    ${run.boutPending ? button(`Send (−${bout.buyIn} Prestige)`, 'fight', { id: f.id }, fightBlocker(run, f.id), 'btn primary small') : ''}
  </div>`;
}

function boutPanel(run, oddsFor) {
  const bout = currentBout(run);
  const showDebuff = bout.boss || oracleLevel(run) >= 2;
  const debuff = BOSS_DEBUFFS[run.debuff];
  const debuffNote = showDebuff
    ? `<div class="debuff">☠ ${bout.boss ? 'Boss arena' : 'Oracle foresees the Boss arena'}: <b>${esc(debuff.name)}</b>. ${esc(debuff.desc)}</div>`
    : '<div class="sub">The Boss arena rule stays hidden until the Boss (an Oracle Lv 2 reveals it early).</div>';
  const rows = run.roster.map((f) => oddsRow(run, f, oddsFor)).join('');
  const oracleNote = oracleLevel(run) === 0 ? '<p class="sub">Build an Oracle to see exact percentages.</p>' : '';
  const choice = run.boutPending
    ? `<div class="row">${bout.boss ? button('Forfeit (Strike)', 'forfeit', {}, forfeitBlocker(run), 'btn danger small') : button(`Skip (+${ECONOMY.skipGold} Gold, roster rests)`, 'skip', {}, skipBlocker(run), 'btn small')}</div>`
    : `<p class="sub">${weeksUntilTournament(run.week) === 0 ? 'This is the next opponent on the circuit.' : `Fight day comes in ${weeksUntilTournament(run.week)} week(s). Plan training and rest around it.`}</p>`;
  return `
    <section class="panel bout${run.boutPending ? ' live' : ''}">
      <h2>${run.boutPending ? 'Fight day' : 'Next bout'}</h2>
      <p class="sub"><b>${esc(bout.name)}</b> · Buy-in ${bout.buyIn} Prestige · Win: +${bout.winGold} Gold, +${bout.winPrestige} Prestige${bout.boss ? ', a Title (+1 Power)' : ''} · Loss: +${bout.lossGold} Gold${bout.boss ? ', an Imperial Strike' : ''}</p>
      ${debuffNote}
      ${fighterCard(run.opponent, { compact: true, stress: false, tag: 'Opponent' })}
      <h3 class="mini">Your odds</h3>
      ${rows || '<div class="empty">No fighters to send.</div>'}
      ${oracleNote}
      ${choice}
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
      <p class="sub">Plots are limited, so every building is a trade-off. Reaching new Prestige levels adds plots and unlocks new buildings.</p>
      <div class="legends">${legend}</div>
      <div class="villa">
        <div class="roof"></div>
        <div class="rooms">${built.map((b) => buildingCard(run, b)).join('')}${Array.from({ length: free }, () => emptyPlot(run)).join('')}${locked}</div>
      </div>
    </section>`;
}

// ---------- Market tab ----------

export function marketTab(run) {
  const price = marketPrice(run);
  const cards = run.market.map((f) => fighterCard(f, {
    stress: false,
    actions: `<div class="actions">${button(`Recruit · ${price} Gold`, 'recruit', { id: f.id }, recruitBlocker(run, f.id), 'btn primary small')}</div>`,
  })).join('');
  const offer = run.liaisonOffer;
  const liaison = offer
    ? fighterCard(offer, { tag: `Liaison · ${esc(offer.origin)}`, actions: `<div class="actions">${button(`Recruit · ${offer.price} Gold`, 'recruit', { id: offer.id }, recruitBlocker(run, offer.id), 'btn primary small')}</div>` })
    : '<p class="sub">Build a Liaison (Prestige level 2) for a cheap monthly prisoner.</p>';
  return `
    <div class="grid market">
      <section class="panel"><h2>Slave market <small>${circuitInfo(run).name}</small></h2>
        <p class="sub">${price} Gold each. New fighters arrive at the start of every month, stronger as you climb the tiers. Roster: ${run.roster.length}/${rosterCap(run)}.</p>
        <div class="cards two">${cards || '<div class="empty">Sold out until next month.</div>'}</div></section>
      <section class="panel"><h2>The Liaison</h2>${liaison}</section>
    </div>`;
}

// ---------- Help ----------

export function helpModal() {
  return `<div class="modal" role="dialog" aria-label="How to play"><div class="modal-body">
    <button class="close" data-action="help" aria-label="Close">×</button>
    <h2>How to play</h2>
    <ol>
      <li><b>Recruit</b> gladiators in the Market.</li>
      <li><b>Give each a weekly job</b>: train Power or Speed, rest, or heal in the Medbay. Training builds Stress; fighters at 50+ Stress enter the arena overtrained.</li>
      <li><b>End the week.</b> The last week of each month is a tournament. Check the odds, then send a fighter or skip.</li>
      <li><b>Fight</b> best-of-3 rounds. Between rounds you can throw in the towel to save a badly hurt fighter.</li>
      <li><b>Climb</b> four arena tiers: Tournament 1 → Tournament 2 → Boss. Win the Grand Tournament to win the game. Each Boss loss is an Imperial Strike; three and you're executed.</li>
      <li><b>Grow the Estate</b>: Prestige levels add room plots and new buildings.</li>
    </ol>
    <h2>Glossary</h2>
    <dl>
      <dt>Power</dt><dd>Decides who wins rounds. The difference (Delta) matters: +1 is 55%, +3 is 70%, +5 is 95% per round.</dd>
      <dt>Speed</dt><dd>Decides who strikes first. The first striker rolls to injure before the other can hit back.</dd>
      <dt>Death Gate</dt><dd>Fighters with fewer than 2 injuries can't die. At 2+ injuries, losing a round can be fatal. Poisoned counts as 2.</dd>
      <dt>Stress</dt><dd>Training and fighting raise it; rest lowers it. At 50+ the fighter starts the next fight Distracted.</dd>
      <dt>Armor</dt><dd>Alloyed Skin and Ego Armour lower your chance to be injured. Gun and Flail ignore it.</dd>
      <dt>Prestige</dt><dd>Your reputation. Staked as buy-ins, won back with interest. Thresholds raise your House level for good.</dd>
      <dt>Imperial Strike</dt><dd>Given for every Boss loss or forfeit. Three ends your career.</dd>
    </dl>
  </div></div>`;
}
