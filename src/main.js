// DOM rendering and event wiring only. Game rules live in run.js and fight.js.

import { KINDS, TRAITS, CLASSES, WEAPONS, INJURY_BY_TAG, DECOR, ECONOMY, TOURNAMENTS, BOSS_DEBUFFS } from './data.js';
import { effectiveInjuries, mortalDanger, playRound, throwTowel, canThrowTowel } from './fight.js';
import {
  createRun, currentTournament, recruit, train, buyDecor, heal, startMatch, finishMatch,
  recruitBlocker, trainBlocker, decorBlocker, healBlocker, fightBlocker,
} from './run.js';
import { narrateRound, resultText, fmtPct, signed, modLabel, classAbility } from './narrate.js';

const app = document.getElementById('app');
const fightEl = document.getElementById('fight');

let run = null;
let match = null;
let lastSummary = null;
let animateRound = 0; // round number whose lines should animate in

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function seedFromUrl() {
  const s = Number(new URLSearchParams(location.search).get('seed'));
  return Number.isInteger(s) && s >= 0 ? s : null;
}

function newRun(seed) {
  run = createRun(seed ?? undefined);
  match = null;
  lastSummary = null;
  const url = new URL(location.href);
  url.searchParams.set('seed', run.seed);
  history.replaceState(null, '', url);
  render();
}

// ---------- Fighter card ----------

function button(label, action, data, blocker, cls = 'btn small') {
  const attrs = Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
  return `<button class="${cls}" data-action="${action}" ${attrs} ${blocker ? `disabled title="${esc(blocker)}"` : ''}>${label}</button>`;
}

function deathGate(f) {
  const n = effectiveInjuries(f);
  const title = n >= 2 ? 'Death Gate open: losing a round can now be fatal.' : 'Death becomes possible at 2 effective injuries.';
  return `<div class="gate" title="${title}">Death Gate <i class="${n >= 1 ? 'on' : ''}"></i><i class="${n >= 2 ? 'on' : ''}"></i> ${n}/2</div>`;
}

function fighterCard(f, { combatant = null, actions = '' } = {}) {
  const off = (slot) => (combatant?.disabled.includes(slot) ? ' off' : '');
  const trait = f.kindTrait ? TRAITS[f.kindTrait] : null;
  const clsName = f.cls ? CLASSES[f.cls].name + (f.weapon ? ` · ${WEAPONS[f.weapon].name}` : '') : '';
  const abilityDesc = f.cls === 'fighter' ? WEAPONS[f.weapon].desc : CLASSES[f.cls]?.desc;
  const injuries = f.injuries.map((i) => {
    const def = INJURY_BY_TAG[i.tag];
    return `<span class="pill injury" title="${esc(def.desc)}">${def.name}${i.weight > 1 ? ' ×' + i.weight : ''}</span>`;
  }).join('');
  const decor = Object.entries(f.decor).filter(([, n]) => n > 0)
    .map(([k, n]) => `<span class="pill decor" title="Feeds ${DECOR[k].feeds}">${DECOR[k].name} ×${n}</span>`).join('');
  const danger = combatant ? mortalDanger(combatant) : effectiveInjuries(f) >= 2 && f.alive;
  return `
    <article class="card${f.alive ? '' : ' dead'}${danger ? ' danger' : ''}">
      <div class="card-head">
        <div><h3>${esc(f.name)}</h3><div class="kind">${KINDS[f.kind].name} · ${clsName}</div></div>
        <div class="badges">
          <div class="badge power"><b>${f.power}</b><small>Power</small></div>
          <div class="badge"><b>${f.speed}</b><small>Speed</small></div>
        </div>
      </div>
      <div class="abilities">
        ${trait ? `<div class="ability${off('kind')}" title="${esc(trait.desc)}"><b>${trait.name}</b> <span>${esc(trait.desc)}</span></div>` : ''}
        ${f.cls ? `<div class="ability${off('class')}" title="${esc(abilityDesc)}"><b>${classAbility(f)}</b> <span>${esc(abilityDesc)}</span></div>` : ''}
      </div>
      ${injuries || decor ? `<div class="pills">${injuries}${decor}</div>` : ''}
      ${deathGate(f)}
      ${actions}
    </article>`;
}

// ---------- Ludus screen ----------

function topbar() {
  const steps = TOURNAMENTS.map((t, i) => {
    const h = run.history.find((x) => x.tournament === i);
    const cls = h ? (h.won ? 'won' : 'lost') : i === run.tournament && run.status === 'active' ? 'now' : '';
    return `<span class="step ${cls}" title="${esc(t.name)}">${i === 2 ? 'Boss' : 'T' + (i + 1)}</span>`;
  }).join('<span class="seed">→</span>');
  return `
    <header class="topbar">
      <h1>BLOODSPORT</h1>
      <div class="stat gold"><b>${run.gold}</b><span>Gold</span></div>
      <div class="stat"><b>${run.prestige}</b><span>Prestige</span></div>
      <div class="track">${steps}</div>
      <div class="spacer"></div>
      <span class="seed" title="Share this URL to replay the same run">Seed ${run.seed}</span>
      <button class="btn small" data-action="new-run">New run</button>
    </header>`;
}

function summaryBanner() {
  if (run.status !== 'active') {
    const won = run.status === 'won';
    return `<div class="banner ${won ? 'win' : 'loss'}">
      <h2>${won ? 'Victory: Master of the Games' : 'Your house has fallen'}</h2>
      <div>${esc(run.endReason)}</div>
      <div class="row" style="margin-top:10px;display:flex;gap:8px">
        <button class="btn primary" data-action="new-run">New run</button>
        <button class="btn" data-action="replay-seed">Replay seed ${run.seed}</button>
      </div></div>`;
  }
  if (!lastSummary) return '';
  const s = lastSummary;
  const verdict = s.reason === 'towel' ? 'threw in the towel' : s.died ? 'was slain' : s.won ? 'won' : 'lost';
  const bits = [`${signed(s.gold)} Gold`, `${signed(s.prestige)} Prestige`];
  if (s.bloodFaith) bits.push('Blood Faith refunded the buy-in');
  return `<div class="banner ${s.won ? 'win' : 'loss'}"><h2>${esc(s.name)}: ${esc(s.fighter)} ${verdict}</h2><div>${bits.join(' · ')}</div></div>`;
}

function nextBout() {
  const t = currentTournament(run);
  const sendButtons = run.roster.map((f) => button(`Send ${esc(f.name)}`, 'fight', { id: f.id }, fightBlocker(run, f.id), 'btn primary')).join(' ');
  return `
    <section class="panel">
      <h2>Next bout</h2>
      <p class="sub">${esc(t.name)} · Buy-in ${t.buyIn} Prestige · Win: +${t.winGold} Gold, buy-in back ×2 · Loss: +${t.lossGold} Gold</p>
      ${t.bossDebuff ? `<p class="sub" style="color:#f1b3ad"><b>Boss debuff: ${BOSS_DEBUFFS.firstInjuryDouble.name}.</b> ${BOSS_DEBUFFS.firstInjuryDouble.desc}</p>` : ''}
      ${run.status === 'active' ? fighterCard(run.opponent) : ''}
      <div class="actions">
        ${run.status !== 'active' ? '<span class="label">The run is over.</span>' : run.roster.length ? `<span class="label">Choose your gladiator</span>${sendButtons}` : '<span class="label">Recruit a fighter from the market first.</span>'}
      </div>
    </section>`;
}

function rosterPanel() {
  const cards = run.roster.map((f) => {
    const decorButtons = Object.keys(DECOR).map((k) => button(`+${DECOR[k].name}`, 'decor', { id: f.id, item: k }, decorBlocker(run, f.id, k))).join('');
    const healButtons = f.injuries.map((inj, i) => button(`Heal ${INJURY_BY_TAG[inj.tag].name}`, 'heal', { id: f.id, index: i }, healBlocker(run, f.id, i))).join('');
    const actions = `<div class="actions">
      <span class="label">Train (${ECONOMY.trainCost} Gold, ${f.trained}/${ECONOMY.trainCap} used)</span>
      ${button('+1 Power', 'train', { id: f.id, stat: 'power' }, trainBlocker(run, f.id, 'power'))}
      ${button('+1 Speed', 'train', { id: f.id, stat: 'speed' }, trainBlocker(run, f.id, 'speed'))}
      <span class="label">Quarters decor (${ECONOMY.decorCost} Gold each, max ${ECONOMY.decorCap})</span>
      ${decorButtons}
      ${f.injuries.length ? `<span class="label">Medbay (${ECONOMY.healCost} Gold per injury)</span>${healButtons}` : ''}
    </div>`;
    return fighterCard(f, { actions });
  }).join('');
  const fallen = run.fallen.length ? `<p class="sub" style="margin-top:10px">Fallen: ${run.fallen.map((f) => esc(f.name)).join(', ')}</p>` : '';
  return `
    <section class="panel">
      <h2>Your Ludus</h2>
      <p class="sub">${run.roster.length}/${ECONOMY.maxRoster} fighters</p>
      <div class="cards">${cards || '<div class="empty">No gladiators yet.</div>'}</div>
      ${fallen}
    </section>`;
}

function marketPanel() {
  const cards = run.market.map((f) => fighterCard(f, {
    actions: `<div class="actions">${button(`Recruit · ${ECONOMY.fighterCost} Gold`, 'recruit', { id: f.id }, recruitBlocker(run, f.id), 'btn primary small')}</div>`,
  })).join('');
  return `
    <section class="panel">
      <h2>Market</h2>
      <p class="sub">Fixed price. New fighters arrive after each tournament.</p>
      <div class="cards">${cards || '<div class="empty">Sold out until the next tournament.</div>'}</div>
    </section>`;
}

function helpBlock() {
  return `
    <details class="help">
      <summary>How to play</summary>
      <ul>
        <li>Recruit up to 3 gladiators, then train them, decorate their quarters, and heal them in the Medbay.</li>
        <li>Fight Tournament 1, then Tournament 2, then the Boss. Each costs Prestige to enter. Beat the Boss to win the run.</li>
        <li>A match is best of 3 rounds. Each round, the Power difference (Delta) sets the odds; traits and weapons tilt them.</li>
        <li>Fighters with fewer than 2 injuries can't die. At 2+ injuries, losing a round can be fatal, so think about throwing in the towel between rounds.</li>
        <li>Injuries stay until healed. Hover over traits and injuries for details.</li>
      </ul>
      ${run.history.length ? `<ol class="history">${run.history.map((h) => `<li>${esc(h.name)}: ${esc(h.fighter)} ${h.won ? 'won' : h.died ? 'died' : 'lost'}</li>`).join('')}</ol>` : ''}
    </details>`;
}

function render() {
  app.innerHTML = `${topbar()}<main>${summaryBanner()}<div class="grid">${nextBout()}${rosterPanel()}${marketPanel()}</div>${helpBlock()}</main>`;
  renderFight();
}

// ---------- Fight overlay ----------

function tagPills(r) {
  const pills = [];
  const add = (side, mods, percent) => mods.forEach((m) => pills.push({ side, text: modLabel(m, percent) }));
  if (r.initiative.reason === 'footwork' || r.initiative.reason === 'concussed') {
    pills.push({ side: r.initiative.first, text: r.initiative.reason === 'footwork' ? 'Footwork: strikes first' : 'Opponent Concussed' });
  }
  for (const side of ['A', 'B']) add(side, r.initiative.speed[side].mods, false);
  add('A', r.power.A.mods, false);
  add('B', r.power.B.mods, false);
  add('A', r.win.modsA, true);
  add('B', r.win.modsB, true);
  for (const c of r.checks) for (const m of c.mods) if (m.value) add(m.side, [m], true);
  const seen = new Set();
  return pills.filter((p) => !seen.has(p.side + p.text) && seen.add(p.side + p.text));
}

function feed(m) {
  return m.rounds.map((r) => {
    const animate = r.round === animateRound;
    const lines = narrateRound(m, r).map((l, i) =>
      `<div class="line ${l.type}${animate ? '' : ' static'}" style="${animate ? `animation-delay:${0.4 + i * 0.35}s` : ''}">${esc(l.text)}</div>`).join('');
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
  return `<div class="why"><table>
    <thead><tr><th>Rd</th><th>Your Power</th><th>Their Power</th><th>Delta</th><th>Base → final win %</th><th>Roll</th><th>Round winner</th><th>Injuries</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

function controls(m) {
  if (m.over) {
    const won = m.result.winner === 'A';
    return `<div class="result ${won ? 'win' : 'loss'}">${won ? 'Victory' : m.result.reason === 'towel' ? 'Towel thrown' : 'Defeat'}</div>
      <div>${esc(resultText(m))}</div>
      <h3 style="color:var(--gold)">Why you ${won ? 'won' : 'lost'}</h3>
      ${whyTable(m)}
      <button class="btn primary" data-action="leave-fight">Return to the Ludus</button>`;
  }
  if (m.round === 0) {
    return `<div class="row"><button class="btn primary" data-action="next-round">Begin Round 1</button></div>`;
  }
  const alert = mortalDanger(m.a)
    ? `<div class="alert">⚠ MORTAL DANGER (${effectiveInjuries(m.a.f)} injuries): ${esc(m.a.f.name)} can die if they lose the next round.</div>`
    : '';
  return `${alert}
    <div>Score ${m.a.roundsWon}–${m.b.roundsWon}. Your call, Lanista.</div>
    <div class="row">
      <button class="btn primary" data-action="next-round">Fight on: Round ${m.round + 1}</button>
      ${canThrowTowel(m) ? `<button class="btn danger" data-action="towel">Throw in the towel (forfeit ${currentTournament(run).buyIn} Prestige)</button>` : ''}
    </div>`;
}

function renderFight() {
  if (!match) {
    fightEl.hidden = true;
    fightEl.innerHTML = '';
    return;
  }
  const m = match;
  const last = m.rounds.at(-1);
  const delta = last ? last.delta : 0;
  const pills = last ? tagPills(last) : [];
  const t = currentTournament(run);
  const shook = last && last.round === animateRound && last.checks.some((c) => c.injury) ? ' shake' : '';
  fightEl.hidden = false;
  fightEl.innerHTML = `
    <div class="fight">
      <div class="fight-head">
        <h2>${esc(t.name)}${t.bossDebuff ? ` · ${BOSS_DEBUFFS.firstInjuryDouble.name}` : ''}</h2>
        <div class="score"><span class="a">${m.a.roundsWon}</span> – <span class="b">${m.b.roundsWon}</span></div>
      </div>
      <div class="arena${shook}">
        <div><div class="side-label a">Your gladiator</div>${fighterCard(m.a.f, { combatant: m.a })}</div>
        <div class="center">
          <div class="gauge-labels"><span>−10</span><span>Power Delta ${last ? signed(delta) : ''}</span><span>+10</span></div>
          <div class="gauge"><div class="needle" style="left:${((delta + 10) / 20) * 100}%"></div></div>
          ${last ? `<div class="odds"><span>Win chance <b>${fmtPct(last.win.chance)}</b></span><span>Round ${last.round} to <b>${esc((last.winner === 'A' ? m.a : m.b).f.name)}</b></span></div>` : '<div class="odds"><span>The crowd roars. Three rounds; first to two wins.</span></div>'}
          <div class="tags">${pills.map((p, i) => `<span class="tag ${p.side.toLowerCase()}" style="animation-delay:${last.round === animateRound ? i * 0.25 : 0}s">${esc(p.text)}</span>`).join('')}</div>
          <div class="feed" id="feed">${feed(m)}</div>
        </div>
        <div><div class="side-label b">Opponent</div>${fighterCard(m.b.f, { combatant: m.b })}</div>
      </div>
      <div class="controls">${controls(m)}</div>
    </div>`;
  const feedEl = document.getElementById('feed');
  if (feedEl) feedEl.scrollTop = feedEl.scrollHeight;
}

// ---------- Events ----------

const actions = {
  'new-run': () => newRun(),
  'replay-seed': () => newRun(run.seed),
  recruit: (d) => recruit(run, d.id),
  train: (d) => train(run, d.id, d.stat),
  decor: (d) => buyDecor(run, d.id, d.item),
  heal: (d) => heal(run, d.id, Number(d.index)),
  fight: (d) => {
    match = startMatch(run, d.id);
    animateRound = 0;
  },
  'next-round': () => {
    const r = playRound(match);
    animateRound = r.round;
  },
  towel: () => throwTowel(match),
  'leave-fight': () => {
    lastSummary = finishMatch(run, match);
    match = null;
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
  render();
});

newRun(seedFromUrl());
