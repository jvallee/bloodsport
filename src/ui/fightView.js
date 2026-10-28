// The fight overlay: tarot cards, Delta gauge, tag pills, story/math feed, capitulate decision, breakdown.

import { BOSS_DEBUFFS, GEAR, CONSUMABLES, TACTICS, COUNTERS, HUMORS, FESTIVAL_BY_ID, SIGNATURES, SIGNATURE, MERCY } from '../data.js';

const DIE_FACES = '⚀⚁⚂⚃⚄⚅';

// What this side actually brings to the coming round (everything applied), so the card never misleads.
const statLine = (stats, side) => `<div class="round-stats" title="Power and Speed in Round ${stats.round}, with gear, Titles, items, injuries, Scouted, Challenger and arena rules applied">Round ${stats.round}: <b>Power ${stats[side].power}</b> · <b>Speed ${stats[side].speed}</b></div>`;
import { effectiveInjuries, mortalDanger, canThrowTowel, suggestTactic, deathRisk, signatureOf } from '../fight.js';
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
const LINE_GAP = 0.45;
const SUSPENSE = 1; // the pause ("Steel meets steel…") before the round's winner is announced

// When each line of the round's story appears: the line naming the winner waits a beat of suspense,
// and lands with the banner. `reveal` is that moment; `end` is the last line.
function roundTiming(m, r, showMath = false) {
  const lines = (showMath ? narrateRound : narrateStory)(m, r);
  const rollAt = lines.findIndex((l) => l.type === 'roll');
  const delays = lines.map((l, i) => DICE_TIME + 0.3 + i * LINE_GAP + (rollAt >= 0 && i >= rollAt ? SUSPENSE : 0));
  const reveal = rollAt >= 0 ? delays[rollAt] : DICE_TIME + 0.3 + lines.length * LINE_GAP + SUSPENSE;
  const hurt = lines.findIndex((l, i) => i >= rollAt && l.type === 'injury');
  return { lines, delays, reveal, end: Math.max(reveal, delays.at(-1) ?? 0), shake: hurt >= 0 ? delays[hurt] : reveal };
}
export const revealTime = (m, r, showMath = false) => roundTiming(m, r, showMath).reveal;
// When the round has fully played out (auto-play waits for this, plus a moment to take it in).
export const roundEndTime = (m, r, showMath = false) => roundTiming(m, r, showMath).end;

// The round's winner, big and clear: who took it, and the score it leaves.
function roundBanner(m, r, delay) {
  const late = delay ? ` late" style="animation-delay:${delay}s` : '';
  const ours = r.winner === 'A';
  const who = esc((ours ? m.a : m.b).f.name);
  const text = r.death ? (ours ? `☠ ${esc(m.b.f.name)} falls` : `☠ ${esc(m.a.f.name)} falls`)
    : ours ? `⚔ Round ${r.round} to ${who}!` : `Round ${r.round} to ${who}`;
  return `<div class="round-banner ${ours ? 'win' : 'loss'}${late}" role="status">${text}<small>${m.a.roundsWon}–${m.b.roundsWon}</small></div>`;
}

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
  const pre = m.preMatch.map((p) => `<div class="line warn static">${esc(m.a.f.name)} is overtrained and loses ${esc(p.disabled.map((s) => slotName(m.a.f, s)).join(', ') || 'focus')} for this match.</div>`).join('');
  return pre + m.rounds.map((r) => {
    const animate = r.round === ui.animateRound;
    const { lines: story, delays } = roundTiming(m, r, ui.showMath);
    const lines = story.map((l, i) =>
      `<div class="line ${l.type}${animate ? '' : ' static'}" style="${animate ? `animation-delay:${delays[i]}s` : ''}">${esc(l.text)}</div>`).join('');
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
    s.verdict === 'spare' ? row('Verdict', '👍 Spared: the Emperor approves', 'good') : '',
    s.verdict === 'kill' ? row('Verdict', `👎 Killed${s.mark ? ` · 💀 earned the mark ${esc(s.mark)}` : ''}`, 'bad') : '',
    s.verdict && s.verdict === s.mercy ? row('The crowd', 'roars its approval', 'good') : '',
    s.feud && s.verdict === 'kill' ? row('Feud', esc(s.feud), 'bad') : '',
    s.died ? row('Fallen', `${esc(s.fighter)}'s gear returns to the storeroom`, 'bad') : '',
  ].join('');
  return `<div class="report"><h3>After the fight</h3>${rows}</div>`;
}

// Thumbs up or down: the beaten opponent's fate, with what the crowd wants.
function mercyPanel(m, mercy, late) {
  const blood = mercy.crowd === 'kill';
  const feud = m.house && !blood ? `; ${esc(m.house.name)} will swear a feud` : ''; // a kill the crowd demanded starts no feud
  return `<div class="mercy${late}">
    <div class="mercy-title">${esc(mercy.opp)} lies beaten in the sand. All eyes turn to you, Lanista.</div>
    <div class="mercy-crowd ${blood ? 'blood' : 'mercy'}">${blood ? '👎 The crowd roars for blood!' : '👍 The crowd chants for mercy.'}</div>
    <div class="row">
      <button class="btn big good" data-action="mercy" data-choice="spare" title="Spare them: +${MERCY.spareFavor} Imperial Favor.${blood ? '' : ` The crowd agrees: +${MERCY.crowdRenown} Renown, +${MERCY.crowdMorale} Morale.`}">👍 Spare them <small>+${MERCY.spareFavor} Favor</small></button>
      <button class="btn big danger" data-action="mercy" data-choice="kill" title="Finish them: +${MERCY.killRenown} Renown and a kill toward the kill marks${feud}.${blood ? ` The crowd agrees: +${MERCY.crowdRenown} Renown, +${MERCY.crowdMorale} Morale.` : ''}">👎 Finish them <small>+${MERCY.killRenown} Renown, a kill${feud}</small></button>
    </div>
    <div class="sub">Give the crowd what it wants for +${MERCY.crowdRenown} Renown and +${MERCY.crowdMorale} Morale.</div>
  </div>`;
}

// The signature move (level 3+): ready, used, or how to unlock it.
function signatureRow(m) {
  const sig = signatureOf(m.a.f);
  if (!sig) return SIGNATURES[m.a.f.cls] ? `<div class="sub">★ Signature move <b>${esc(SIGNATURES[m.a.f.cls].name)}</b> unlocks at level ${SIGNATURE.level}.</div>` : '';
  if (m.a.sigRound) return `<div class="sub">★ ${esc(sig.name)} ${m.a.sigRound > m.round ? 'will be unleashed this round' : 'has been used this fight'}.</div>`;
  return `<div class="items-row"><button class="btn signature" data-action="signature" title="${esc(sig.desc)}">★ ${esc(sig.name)} <small>${esc(sig.desc)} Once per fight.</small></button></div>`;
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

function controls(m, ui, bout, items = {}, nextBlocker = null, mercy = null) {
  if (m.over) {
    const won = m.result.winner === 'A';
    const advice = adviceFor(m);
    const last = m.rounds.at(-1);
    const at = last?.round === ui.animateRound ? roundEndTime(m, last, ui.showMath) : 0;
    const late = at ? ` late" style="animation-delay:${at + 0.6}s` : '';
    return `<div class="result ${won ? 'win' : 'loss'}${late}">${won ? 'Victory' : m.result.reason === 'towel' ? 'Capitulated' : m.result.reason === 'death' ? 'Slain' : 'Defeat'}</div>
      <div class="${late ? 'late' : ''}" ${late ? `style="animation-delay:${at + 0.8}s"` : ''}>${esc(resultText(m))}</div>
      <div class="${late ? 'late' : ''}" ${late ? `style="animation-delay:${at + 1}s"` : ''}>${report(m.summary)}</div>
      ${advice ? `<div class="advice">💡 ${esc(advice)}</div>` : ''}
      ${whyTable(m)}
      ${mercy ? mercyPanel(m, mercy, late) : `${m.summary?.next ? `<div class="row"><button class="btn primary big" data-action="fight" data-id="${m.a.f.id}" data-tier="${bout.tier}" ${nextBlocker ? `disabled title="${esc(nextBlocker)}"` : ''}>On to the ${m.summary.next}</button>
        <button class="btn danger big" data-action="withdraw" data-tier="${bout.tier}" title="Leave the tournament now: it counts as capitulating, and your fighter is safe">Withdraw</button></div>
        ${nextBlocker ? `<div class="why-not">${esc(nextBlocker)} ${/perk/.test(nextBlocker) ? '(on their card, back in the Ludus)' : ''}</div>` : ''}` : ''}
      <button class="btn ${m.summary?.next ? '' : 'primary '}big" data-action="leave-fight">${m.summary?.next ? 'Back to the Ludus (fight on later this week)' : 'Return to the Ludus'}</button>`}`;
  }
  const owned = Object.entries(items).filter(([, n]) => n > 0);
  // One of each kind per fight: items already used drop out of the row.
  const used = m.itemsUsed ?? [];
  const usable = owned.filter(([k]) => !used.includes(k));
  const itemRow = `${used.length ? `<div class="sub">Used this fight: ${used.map((k) => esc(CONSUMABLES[k].name)).join(', ')}.</div>` : ''}${usable.length
    ? `<div class="items-row"><span class="sub">Use an item (one of each kind per fight):</span>${usable.map(([k, n]) => `<button class="btn small" data-action="use-item" data-item="${k}" title="${esc(CONSUMABLES[k].desc)}">${esc(CONSUMABLES[k].name)} ×${n}</button>`).join('')}</div>`
    : ''}`;
  if (m.round === 0) {
    // A fighter who walks in with the Death Gate open is warned before Round 1 too.
    const pre = mortalDanger(m.a) ? `<div class="alert">⚠ MORTAL DANGER from the first round: ${esc(m.a.f.name)} enters with ${effectiveInjuries(m.a.f)} injur${effectiveInjuries(m.a.f) === 1 ? 'y' : 'ies'}. Losing Round 1: about <b>${Math.round(deathRisk(m) * 100)}%</b> chance of death. Capitulating is only possible between rounds.</div>` : '';
    return `${pre}${signatureRow(m)}${itemRow}${tacticPicker(m)}<div class="row"><button class="btn big" data-action="auto-play" title="Plays every round with the suggested tactic, pausing at the Death Gate">${ui.auto ? 'Auto-play: on' : 'Auto-play'}</button></div>`;
  }
  const danger = mortalDanger(m.a);
  const alert = danger ? `<div class="alert">⚠ MORTAL DANGER: ${esc(m.a.f.name)} has ${effectiveInjuries(m.a.f)} injur${effectiveInjuries(m.a.f) === 1 ? 'y' : 'ies'} and can die if they lose the next round. Fighting on: about <b>${Math.round(deathRisk(m) * 100)}%</b> chance of death this round${canThrowTowel(m) ? '' : ' (and the Emperor forbids capitulating)'}.</div>` : '';
  const paused = ui.auto && danger ? '<div class="sub">Auto-play paused: your call.</div>' : '';
  return `${alert}${paused}
    <div>Score ${m.a.roundsWon}–${m.b.roundsWon}. First to two wins. Your call, Lanista.</div>
    ${signatureRow(m)}
    ${itemRow}
    ${tacticPicker(m)}
    <div class="row">
      ${canThrowTowel(m) ? `<button class="btn danger big" data-action="towel" title="Forfeit the match and the buy-in. Your fighter is guaranteed to survive.">Capitulate (lose ${bout.buyIn} Prestige)</button>` : ''}
      <button class="btn big" data-action="auto-play">${ui.auto ? 'Auto-play: on' : 'Auto-play'}</button>
    </div>`;
}

// `nextBlocker`: why the bracket's next match can't start yet (e.g. a perk to choose), or null.
// `mercy`: the pending thumbs-up-or-down verdict (run.mercy), if any.
export function fightView(m, ui, bout, tutorial = '', items = {}, nextBlocker = null, mercy = null) {
  const last = m.rounds.at(-1);
  const delta = last ? last.delta : 0;
  const pills = last ? tagPills(last) : [];
  const animate = Boolean(last) && last.round === ui.animateRound;
  const shook = animate && last.checks.some((c) => c.injury) ? ' shake' : '';
  const debuff = m.debuff ? BOSS_DEBUFFS[m.debuff] : null;
  const stats = roundStats(m);
  // While the dice roll and the round plays out, hold back the score and the winner so the result isn't spoiled.
  const timing = animate ? roundTiming(m, last, ui.showMath) : null;
  const reveal = timing?.reveal ?? 0;
  const hold = (delay) => (animate ? ` late" style="animation-delay:${delay}s` : '');
  // The round's winner glows; the loser's card dims a little.
  const sideCls = (side) => (last && last.winner !== 'towel' ? (last.winner === side ? ' round-won' : ' round-lost') : '');
  const sideStyle = animate ? ` style="--reveal:${reveal}s"` : '';
  // This round's new wounds wait for the story to reach the blow.
  const fresh = (side) => (animate ? { fresh: last.checks.filter((c) => c.defender === side && c.injury && c.injury.tag !== 'death').length, freshAt: timing.shake } : {});
  return `
    <div class="fight">
      <div class="fight-head">
        <div><h2>${esc(bout.name)}</h2>${debuff ? `<div class="debuff" title="${esc(debuff.desc)}">☠ ${esc(debuff.name)}: ${esc(debuff.desc)}</div>` : ''}${m.festival ? `<div class="festival now">🏛 ${esc(FESTIVAL_BY_ID[m.festival].name)}: ${esc(FESTIVAL_BY_ID[m.festival].desc)}</div>` : ''}</div>
        <div class="score${hold(reveal)}" aria-label="Score"><span class="a">${m.a.roundsWon}</span> – <span class="b">${m.b.roundsWon}</span></div>
      </div>
      <div class="arena${shook}"${shook ? ` style="animation-delay:${timing?.shake ?? 0}s"` : ''}>
        <div class="side${sideCls('A')}"${sideStyle}><div class="side-label a">Your gladiator</div>${fighterCard(m.a.f, { combatant: m.a, live: stats.A, ...fresh('A'), compact: true })}<div class="${hold(reveal)}">${statLine(stats, 'A')}</div></div>
        <div class="center">
          <div class="gauge-labels"><span>You're stronger</span><span>Power Delta ${last ? signed(delta) : '0'}</span><span>They're stronger</span></div>
          <div class="gauge" title="Leans towards the stronger side: yours on the left, theirs on the right"><div class="needle" style="left:${((10 - delta) / 20) * 100}%"></div></div>
          ${last ? initiativeRoll(m, last, animate) : ''}
          ${last ? tacticLine(m, last) : ''}
          ${last ? `<div class="odds"><span>Your round chance <b>${fmtPct(last.win.chance)}</b></span>${animate ? `<span class="suspense" style="--from:${reveal - SUSPENSE}s;--reveal:${reveal}s">Steel meets steel…</span>` : ''}</div>${roundBanner(m, last, reveal)}` : '<div class="odds"><span>The crowd roars. Three rounds; first to two wins.</span></div>'}
          <div class="tags">${pills.map((p, i) => `<span class="tag ${p.side.toLowerCase()}" style="animation-delay:${animate ? DICE_TIME + i * 0.2 : 0}s">${esc(p.text)}</span>`).join('')}</div>
          <div class="feed-head"><span>${ui.showMath ? 'Every roll' : 'The story'}</span><button class="link" data-action="toggle-math">${ui.showMath ? 'Show the story' : 'Show the math'}</button></div>
          <div class="feed" id="feed">${feed(m, ui)}</div>
        </div>
        <div class="side${sideCls('B')}"${sideStyle}><div class="side-label b">${m.house ? `Opponent · <span style="color:${esc(m.house.color)}">${esc(m.house.name)}</span>` : 'Opponent'}</div>${fighterCard(m.b.f, { combatant: m.b, live: stats.B, ...fresh('B'), compact: true, stress: false })}<div class="${hold(reveal)}">${statLine(stats, 'B')}</div></div>
      </div>
      ${tutorial}
      <div class="controls${hold((timing?.end ?? 0) + 0.3)}">${controls(m, ui, bout, items, nextBlocker, mercy)}</div>
    </div>`;
}
