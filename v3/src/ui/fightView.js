// The fight overlay: tarot cards, Delta gauge, tag pills, story/math feed, capitulate decision, breakdown.

import { BOSS_DEBUFFS, GEAR, CONSUMABLES, TACTICS, COUNTERS, HUMORS, FESTIVAL_BY_ID } from '../data.js';

const DIE_FACES = '⚀⚁⚂⚃⚄⚅';

// What this side actually brings to the coming round (everything applied), so the card never misleads.
const statLine = (stats, side) => `<div class="round-stats" title="Power and Speed in Round ${stats.round}, with gear, Titles, items, injuries, Scouted, Challenger and arena rules applied">Round ${stats.round}: <b>Power ${stats[side].power}</b> · <b>Speed ${stats[side].speed}</b></div>`;
import { effectiveInjuries, mortalDanger, canThrowTowel, suggestTactic } from '../fight.js';
import { narrateRound, narrateStory, resultText, adviceFor, fmtPct, signed, modLabel, slotName } from '../narrate.js';
import { esc, fighterCard } from './components.js';
import { roundStats } from '../explain.js';

function tagPills(r) {
  const pills = [];
  const add = (side, mods, percent) => mods.forEach((m) => pills.push({ side, text: modLabel(m, percent) }));
  if (r.initiative.reason === 'footwork') pills.push({ side: r.initiative.first, text: 'Footwork: strikes first' });
  if (r.initiative.reason === 'concussed') pills.push({ side: r.initiative.first === 'A' ? 'B' : 'A', text: 'Concussed: strikes second' });
  for (const side of ['A', 'B']) add(side, r.initiative.speed[side].mods, false);
  add('A', r.power.A.mods, false);
  add('B', r.power.B.mods, false);
  add('A', r.win.modsA, true);
  add('B', r.win.modsB, true);
  for (const c of r.checks) for (const m of c.mods) if (m.value) add(m.side, [m], true);
  const seen = new Set();
  return pills.filter((p) => !seen.has(p.side + p.text) && seen.add(p.side + p.text));
}

// What both sides chose last round, and who read whom.
function tacticLine(m, r) {
  const t = (side) => TACTICS[r.stances?.[side] ?? 'steady'];
  if (!r.stances) return '';
  const who = r.counter ? `${esc((r.counter === 'A' ? m.a : m.b).f.name)} read it: ${t(r.counter).name} beats ${t(r.counter === 'A' ? 'B' : 'A').name} (+10%)` : 'No counter';
  return `<div class="tactic-line ${r.counter ? (r.counter === 'A' ? 'good' : 'bad') : ''}">${t('A').icon} You: <b>${t('A').name}</b> · ${t('B').icon} They: <b>${t('B').name}</b> · ${who}</div>`;
}

// The dice tumble for this long before the round plays out (seconds).
export const DICE_TIME = 1.4;

// Who strikes first: two dice tumble, then land. Footwork and Concussed skip the roll.
function initiativeRoll(m, r, animate) {
  const init = r.initiative;
  const name = (side) => esc((side === 'A' ? m.a : m.b).f.name);
  const cls = animate ? '' : ' still';
  if (init.reason === 'footwork' || init.reason === 'concussed') {
    const why = init.reason === 'footwork' ? `${name(init.first)} is faster and darts in first (Footwork).` : `${name(init.first === 'A' ? 'B' : 'A')} is Concussed and must strike second.`;
    return `<div class="initiative${cls}"><div class="init-title">Who strikes first?</div><div class="init-auto">${why}</div></div>`;
  }
  const side = (s) => {
    const speed = init.speed[s].total;
    const roll = init.rolls[s];
    return `<div class="init-side ${s.toLowerCase()}${init.first === s ? ' first' : ''}">
      <div class="init-name">${name(s)}</div>
      <div class="init-math">Speed ${speed} + <span class="die${cls}" role="img" aria-label="rolled ${roll}"><span class="face">${DIE_FACES[roll - 1]}</span></span> = <b class="reveal${cls}">${speed + roll}</b></div>
    </div>`;
  };
  const tie = init.reason === 'tiebreak' ? ' (tied: a coin flip decides)' : '';
  return `<div class="initiative${cls}"><div class="init-title">Who strikes first? Speed + a die</div>
    <div class="init-sides">${side('A')}<span class="vs">vs</span>${side('B')}</div>
    <div class="init-result reveal${cls}">⚡ ${name(init.first)} strikes first${tie}: +10% to win the round and the first chance to wound.</div></div>`;
}

function feed(m, ui) {
  const narrate = ui.showMath ? narrateRound : narrateStory;
  const pre = m.preMatch.map((p) => `<div class="line warn static">${esc(m.a.f.name)} is overtrained and loses ${esc(p.disabled.map((s) => slotName(m.a.f, s)).join(', ') || 'focus')} for this match.</div>`).join('');
  return pre + m.rounds.map((r) => {
    const animate = r.round === ui.animateRound;
    const lines = narrate(m, r).map((l, i) =>
      `<div class="line ${l.type}${animate ? '' : ' static'}" style="${animate ? `animation-delay:${DICE_TIME + 0.3 + i * 0.45}s` : ''}">${esc(l.text)}</div>`).join('');
    return `<h4>Round ${r.round}</h4>${lines}`;
  }).join('');
}

// After the match: everything it changed, in one place.
function report(s) {
  if (!s) return '';
  const row = (label, value, tone = '') => `<div class="rep-row ${tone}"><span>${label}</span><b>${value}</b></div>`;
  const plus = (n) => `${n > 0 ? '+' : ''}${n}`;
  const tone = (n) => (n > 0 ? 'good' : n < 0 ? 'bad' : '');
  const rows = [
    row('Gold', plus(s.gold), tone(s.gold)),
    row('Prestige', plus(s.prestige), tone(s.prestige)),
    s.favor ? row('Imperial Favor', plus(s.favor), tone(s.favor)) : '',
    s.died ? '' : row('XP', `${plus(s.xp)}${s.levels ? ` · ⭐ level up! Choose a perk on their card` : ''}`, 'good'),
    s.died ? '' : row('Renown', plus(s.renown), tone(s.renown)),
    s.died ? '' : row('Morale', plus(s.morale), tone(s.morale)),
    s.injuries?.length ? row('New injuries', `${esc(s.injuries.join(', '))}: heal them in the Medbay`, 'bad') : '',
    s.loot ? row('Loot', `${esc(GEAR[s.loot].name)} → storeroom`, 'good') : '',
    s.title ? row('Title', `🏆 ${esc(s.title)}${s.title === 'Master of the Games' ? '' : ' (+1 Power)'}`, 'good') : '',
    s.champion ? row('The crowd', 'boos a champion back in the pits', 'bad') : s.crushing ? row('The crowd', 'jeers the mismatch', 'bad') : '',
    s.bloodFaith ? row('Blood Faith', 'buy-in refunded', 'good') : '',
    s.bribed ? row('Crowd Bribe', 'the crowd forgave the capitulation', 'good') : '',
    s.died ? row('Fallen', `${esc(s.fighter)}'s gear returns to the storeroom`, 'bad') : '',
  ].join('');
  return `<div class="report"><h3>After the fight</h3>${rows}</div>`;
}

function whyTable(m) {
  const rows = m.rounds.map((r) => {
    const mods = (list) => (list.length ? ` <small>(${list.map((x) => esc(modLabel(x, false))).join(', ')})</small>` : '');
    const hurts = r.checks.filter((c) => c.injury).map((c) => `${esc((c.defender === 'A' ? m.a : m.b).f.name)}: ${esc(c.injury.name)}`).join('<br>') || '—';
    return `<tr>
      <td>${r.round}</td>
      <td>${r.power.A.total}${mods(r.power.A.mods)}</td>
      <td>${r.power.B.total}${mods(r.power.B.mods)}</td>
      <td>${signed(r.delta)}</td>
      <td>${fmtPct(r.win.base)} → ${fmtPct(r.win.chance)}</td>
      <td>${fmtPct(r.roll)}</td>
      <td>${esc((r.winner === 'A' ? m.a : m.b).f.name)}</td>
      <td>${hurts}</td>
    </tr>`;
  }).join('');
  return `<details class="why"><summary>Show the round-by-round math</summary><div class="why-scroll"><table>
    <thead><tr><th>Rd</th><th>Your Power</th><th>Their Power</th><th>Delta</th><th>Win chance (base → final)</th><th>Roll</th><th>Round to</th><th>Injuries</th></tr></thead>
    <tbody>${rows}</tbody></table><p class="sub">You win a round when the roll is at or under your win chance.</p></div></details>`;
}

// Choose this round's tactic: each button plays the round. The suggestion (what auto-play would do) is marked.
function tacticPicker(m) {
  const round = m.round + 1;
  const suggested = suggestTactic(m);
  const h = m.b.f.humor ? HUMORS[m.b.f.humor] : null;
  const buttons = Object.entries(TACTICS).map(([k, t]) => `<button class="btn big tactic${k === suggested ? ' primary' : ''}" data-action="next-round" data-stance="${k}" title="${esc(t.desc)}">
      ${t.icon} ${t.name}${k === suggested ? ' <small>★ suggested</small>' : ''}</button>`).join('');
  const last = m.rounds.at(-1);
  const read = h ? `${esc(m.b.f.name)} is <b>${h.name}</b>: ${esc(h.tell)}.${last ? ` Last round they chose <b>${TACTICS[last.stances.B].name}</b>.` : ''}` : `${esc(m.b.f.name)} has no clear habits.`;
  return `<div class="tactics"><div class="label">Round ${round}: choose your tactic</div>
    <div class="row tactic-row">${buttons}</div>
    <div class="sub">${read} <span class="counters">🗡 Press beats ↯ Feint · ↯ Feint beats 🛡 Guard · 🛡 Guard beats 🗡 Press (+10% win chance)</span></div></div>`;
}

function controls(m, ui, bout, items = {}) {
  if (m.over) {
    const won = m.result.winner === 'A';
    const advice = adviceFor(m);
    const late = m.rounds.at(-1)?.round === ui.animateRound ? ` late" style="animation-delay:${DICE_TIME + 1.8}s` : '';
    return `<div class="result ${won ? 'win' : 'loss'}${late}">${won ? 'Victory' : m.result.reason === 'towel' ? 'Capitulated' : m.result.reason === 'death' ? 'Slain' : 'Defeat'}</div>
      <div class="${late ? 'late' : ''}" ${late ? `style="animation-delay:${DICE_TIME + 1.9}s"` : ''}>${esc(resultText(m))}</div>
      <div class="${late ? 'late' : ''}" ${late ? `style="animation-delay:${DICE_TIME + 2.1}s"` : ''}>${report(m.summary)}</div>
      ${advice ? `<div class="advice">💡 ${esc(advice)}</div>` : ''}
      ${whyTable(m)}
      <button class="btn primary big" data-action="leave-fight">Return to the Ludus</button>`;
  }
  const owned = Object.entries(items).filter(([, n]) => n > 0);
  const itemRow = m.itemUsed
    ? `<div class="sub">Used this fight: ${esc(CONSUMABLES[m.itemUsed].name)}.</div>`
    : owned.length
      ? `<div class="items-row"><span class="sub">Use an item (one per fight):</span>${owned.map(([k, n]) => `<button class="btn small" data-action="use-item" data-item="${k}" title="${esc(CONSUMABLES[k].desc)}">${esc(CONSUMABLES[k].name)} ×${n}</button>`).join('')}</div>`
      : '';
  if (m.round === 0) {
    return `${itemRow}${tacticPicker(m)}<div class="row"><button class="btn big" data-action="auto-play" title="Plays every round with the suggested tactic, pausing at the Death Gate">${ui.auto ? 'Auto-play: on' : 'Auto-play'}</button></div>`;
  }
  const danger = mortalDanger(m.a);
  const alert = danger ? `<div class="alert">⚠ MORTAL DANGER: ${esc(m.a.f.name)} has ${effectiveInjuries(m.a.f)} injuries and can die if they lose the next round.</div>` : '';
  const paused = ui.auto && danger ? '<div class="sub">Auto-play paused: your call.</div>' : '';
  return `${alert}${paused}
    <div>Score ${m.a.roundsWon}–${m.b.roundsWon}. First to two wins. Your call, Lanista.</div>
    ${itemRow}
    ${tacticPicker(m)}
    <div class="row">
      ${canThrowTowel(m) ? `<button class="btn danger big" data-action="towel" title="Forfeit the match and the buy-in. Your fighter is guaranteed to survive.">Capitulate (lose ${bout.buyIn} Prestige)</button>` : ''}
      <button class="btn big" data-action="auto-play">${ui.auto ? 'Auto-play: on' : 'Auto-play'}</button>
    </div>`;
}

export function fightView(m, ui, bout, tutorial = '', items = {}) {
  const last = m.rounds.at(-1);
  const delta = last ? last.delta : 0;
  const pills = last ? tagPills(last) : [];
  const animate = Boolean(last) && last.round === ui.animateRound;
  const shook = animate && last.checks.some((c) => c.injury) ? ' shake' : '';
  const debuff = m.debuff ? BOSS_DEBUFFS[m.debuff] : null;
  const stats = roundStats(m);
  // While the dice roll, hold back the score and the round winner so the result isn't spoiled.
  const hold = (delay) => (animate ? ` late" style="animation-delay:${delay}s` : '');
  return `
    <div class="fight">
      <div class="fight-head">
        <div><h2>${esc(bout.name)}</h2>${debuff ? `<div class="debuff" title="${esc(debuff.desc)}">☠ ${esc(debuff.name)}: ${esc(debuff.desc)}</div>` : ''}${m.festival ? `<div class="festival now">🏛 ${esc(FESTIVAL_BY_ID[m.festival].name)}: ${esc(FESTIVAL_BY_ID[m.festival].desc)}</div>` : ''}</div>
        <div class="score${hold(DICE_TIME + 1.2)}" aria-label="Score"><span class="a">${m.a.roundsWon}</span> – <span class="b">${m.b.roundsWon}</span></div>
      </div>
      <div class="arena${shook}">
        <div><div class="side-label a">Your gladiator</div>${fighterCard(m.a.f, { combatant: m.a, compact: true })}${statLine(stats, 'A')}</div>
        <div class="center">
          <div class="gauge-labels"><span>They're stronger</span><span>Power Delta ${last ? signed(delta) : '0'}</span><span>You're stronger</span></div>
          <div class="gauge"><div class="needle" style="left:${((delta + 10) / 20) * 100}%"></div></div>
          ${last ? initiativeRoll(m, last, animate) : ''}
          ${last ? tacticLine(m, last) : ''}
          ${last ? `<div class="odds"><span>Your round chance <b>${fmtPct(last.win.chance)}</b></span><span class="${hold(DICE_TIME + 1.2)}">Round ${last.round} → <b>${esc((last.winner === 'A' ? m.a : m.b).f.name)}</b></span></div>` : '<div class="odds"><span>The crowd roars. Three rounds; first to two wins.</span></div>'}
          <div class="tags">${pills.map((p, i) => `<span class="tag ${p.side.toLowerCase()}" style="animation-delay:${animate ? DICE_TIME + i * 0.2 : 0}s">${esc(p.text)}</span>`).join('')}</div>
          <div class="feed-head"><span>${ui.showMath ? 'Every roll' : 'The story'}</span><button class="link" data-action="toggle-math">${ui.showMath ? 'Show the story' : 'Show the math'}</button></div>
          <div class="feed" id="feed">${feed(m, ui)}</div>
        </div>
        <div><div class="side-label b">${m.house ? `Opponent · <span style="color:${esc(m.house.color)}">${esc(m.house.name)}</span>` : 'Opponent'}</div>${fighterCard(m.b.f, { combatant: m.b, compact: true, stress: false })}${statLine(stats, 'B')}</div>
      </div>
      ${tutorial}
      <div class="controls${hold(DICE_TIME + 1.4)}">${controls(m, ui, bout, items)}</div>
    </div>`;
}
