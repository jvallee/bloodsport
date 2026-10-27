// The fight overlay: tarot cards, Delta gauge, tag pills, story/math feed, towel decision, breakdown.

import { BOSS_DEBUFFS } from '../data.js';
import { effectiveInjuries, mortalDanger, canThrowTowel } from '../fight.js';
import { narrateRound, narrateStory, resultText, adviceFor, fmtPct, signed, modLabel, slotName } from '../narrate.js';
import { esc, fighterCard } from './components.js';

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

function feed(m, ui) {
  const narrate = ui.showMath ? narrateRound : narrateStory;
  const pre = m.preMatch.map((p) => `<div class="line warn static">${esc(m.a.f.name)} is overtrained and loses ${esc(p.disabled.map((s) => slotName(m.a.f, s)).join(', ') || 'focus')} for this match.</div>`).join('');
  return pre + m.rounds.map((r) => {
    const animate = r.round === ui.animateRound;
    const lines = narrate(m, r).map((l, i) =>
      `<div class="line ${l.type}${animate ? '' : ' static'}" style="${animate ? `animation-delay:${0.3 + i * 0.4}s` : ''}">${esc(l.text)}</div>`).join('');
    return `<h4>Round ${r.round}</h4>${lines}`;
  }).join('');
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

function controls(m, ui, bout) {
  if (m.over) {
    const won = m.result.winner === 'A';
    const advice = adviceFor(m);
    return `<div class="result ${won ? 'win' : 'loss'}">${won ? 'Victory' : m.result.reason === 'towel' ? 'Towel thrown' : m.result.reason === 'death' ? 'Slain' : 'Defeat'}</div>
      <div>${esc(resultText(m))}</div>
      ${advice ? `<div class="advice">💡 ${esc(advice)}</div>` : ''}
      ${whyTable(m)}
      <button class="btn primary big" data-action="leave-fight">Return to the Ludus</button>`;
  }
  if (m.round === 0) {
    return `<div class="row"><button class="btn primary big" data-action="next-round">Begin Round 1</button>
      <button class="btn big" data-action="auto-play">${ui.auto ? 'Auto-play: on' : 'Auto-play'}</button></div>`;
  }
  const danger = mortalDanger(m.a);
  const alert = danger ? `<div class="alert">⚠ MORTAL DANGER: ${esc(m.a.f.name)} has ${effectiveInjuries(m.a.f)} injuries and can die if they lose the next round.</div>` : '';
  const paused = ui.auto && danger ? '<div class="sub">Auto-play paused: your call.</div>' : '';
  return `${alert}${paused}
    <div>Score ${m.a.roundsWon}–${m.b.roundsWon}. First to two wins. Your call, Lanista.</div>
    <div class="row">
      <button class="btn primary big" data-action="next-round">Fight on: Round ${m.round + 1}</button>
      ${canThrowTowel(m) ? `<button class="btn danger big" data-action="towel" title="Forfeit the match and the buy-in. Your fighter is guaranteed to survive.">Throw in the towel (lose ${bout.buyIn} Prestige)</button>` : ''}
      <button class="btn big" data-action="auto-play">${ui.auto ? 'Auto-play: on' : 'Auto-play'}</button>
    </div>`;
}

export function fightView(m, ui, bout) {
  const last = m.rounds.at(-1);
  const delta = last ? last.delta : 0;
  const pills = last ? tagPills(last) : [];
  const shook = last && last.round === ui.animateRound && last.checks.some((c) => c.injury) ? ' shake' : '';
  const debuff = m.debuff ? BOSS_DEBUFFS[m.debuff] : null;
  return `
    <div class="fight">
      <div class="fight-head">
        <div><h2>${esc(bout.name)}</h2>${debuff ? `<div class="debuff" title="${esc(debuff.desc)}">☠ ${esc(debuff.name)}: ${esc(debuff.desc)}</div>` : ''}</div>
        <div class="score" aria-label="Score"><span class="a">${m.a.roundsWon}</span> – <span class="b">${m.b.roundsWon}</span></div>
      </div>
      <div class="arena${shook}">
        <div><div class="side-label a">Your gladiator</div>${fighterCard(m.a.f, { combatant: m.a, compact: true })}</div>
        <div class="center">
          <div class="gauge-labels"><span>They're stronger</span><span>Power Delta ${last ? signed(delta) : '0'}</span><span>You're stronger</span></div>
          <div class="gauge"><div class="needle" style="left:${((delta + 10) / 20) * 100}%"></div></div>
          ${last ? `<div class="odds"><span>Your round chance <b>${fmtPct(last.win.chance)}</b></span><span>Round ${last.round} → <b>${esc((last.winner === 'A' ? m.a : m.b).f.name)}</b></span></div>` : '<div class="odds"><span>The crowd roars. Three rounds; first to two wins.</span></div>'}
          <div class="tags">${pills.map((p, i) => `<span class="tag ${p.side.toLowerCase()}" style="animation-delay:${last.round === ui.animateRound ? i * 0.25 : 0}s">${esc(p.text)}</span>`).join('')}</div>
          <div class="feed-head"><span>${ui.showMath ? 'Every roll' : 'The story'}</span><button class="link" data-action="toggle-math">${ui.showMath ? 'Show the story' : 'Show the math'}</button></div>
          <div class="feed" id="feed">${feed(m, ui)}</div>
        </div>
        <div><div class="side-label b">Opponent</div>${fighterCard(m.b.f, { combatant: m.b, compact: true, stress: false })}</div>
      </div>
      <div class="controls">${controls(m, ui, bout)}</div>
    </div>`;
}
