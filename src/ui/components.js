// Shared UI pieces: escaping, buttons, icons, the fighter card. Returns HTML strings.

import { KINDS, TRAITS, CLASSES, WEAPONS, INJURY_BY_TAG, DECOR, STRESS, PERKS, GEAR, XP, MORALE, KILL_MARKS, HUMORS, SCARS, AUGMENTS, CIRCUITS } from '../data.js';

const HUMOR_ICON = { choleric: '🔥', sanguine: '💨', melancholic: '🪨', phlegmatic: '💧' };
import { effectiveInjuries, mortalDanger, deathGateAt, killMarks } from '../fight.js';
import { classAbility } from '../narrate.js';
import { portrait } from './portrait.js';

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const svg = (path, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
export const ICON = {
  power: svg('<path d="M20.5 2.5 21.5 3.5 11 14l-1-1z M5.5 13.5l5 5-1.5 1.5-1.5-1.5-3 3-1-1 3-3-1.5-1.5z M8 11l5 5-1 1-5-5z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>', 'i-power'),
  speed: svg('<path d="M3 12h11M5 7h11M7 17h9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="m16 5 6 7-6 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>', 'i-speed'),
  gold: svg('<circle cx="12" cy="12" r="8" fill="currentColor"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/>', 'i-gold'),
  prestige: svg('<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" fill="currentColor"/>', 'i-prestige'),
  strike: svg('<path d="M5 5l14 14M19 5 5 19" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>', 'i-strike'),
  stress: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor"/>', 'i-stress'),
  injury: svg('<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" fill="currentColor"/>', 'i-injury'),
};

export const BUILDING_ICON = {
  bed: '🛏', lyre: '🎭', dumbbell: '🏋', cross: '⚕', eye: '👁', chain: '⛓', anvil: '⚒',
};

export function button(label, action, data = {}, blocker = null, cls = 'btn small') {
  const attrs = Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
  return `<button class="${cls}" data-action="${action}" ${attrs} ${blocker ? `disabled title="${esc(blocker)}"` : ''}>${label}</button>`;
}

// A button that, when blocked, says why on the page (not only on hover: touchscreens can't hover).
export function buttonWhy(label, action, data = {}, blocker = null, cls = 'btn small') {
  return `<span class="btn-why">${button(label, action, data, blocker, cls)}${blocker ? `<small class="why-not">${esc(blocker)}</small>` : ''}</span>`;
}

export function deathGate(f) {
  const n = effectiveInjuries(f);
  const gate = deathGateAt(f);
  const title = n >= gate ? 'Death Gate open: losing a round can now be fatal.' : `Fighters can only die once they have ${gate} effective injuries${gate > 2 ? ' (Unbreakable)' : ''}.`;
  const pips = Array.from({ length: gate }, (_, i) => `<i class="${n > i ? 'on' : ''}"></i>`).join('');
  return `<span class="gate" title="${title}">${pips}</span>`;
}

function stressBar(f) {
  const hot = f.stress >= STRESS.overtrained;
  return `<div class="stress${hot ? ' hot' : ''}" title="Stress ${f.stress}/100. At ${STRESS.overtrained}+ a fighter is overtrained: can't train, and fights at −1 Power with one ability lost. Rest lowers it.">
    ${ICON.stress}<div class="bar"><span style="width:${f.stress}%"></span></div><small>${hot ? 'Overtrained' : f.stress}</small></div>`;
}

export function fighterCard(f, { combatant = null, actions = '', tag = '', compact = false, stress = true } = {}) {
  const off = (slot) => (combatant?.disabled.includes(slot) ? ' off' : '');
  const trait = f.kindTrait ? TRAITS[f.kindTrait] : null;
  const clsName = f.cls ? CLASSES[f.cls].name + (f.weapon ? ` · ${WEAPONS[f.weapon].name}` : '') : '';
  const abilityDesc = f.cls === 'fighter' ? WEAPONS[f.weapon].desc : CLASSES[f.cls]?.desc;
  const injuries = f.injuries.map((i) => {
    const def = INJURY_BY_TAG[i.tag];
    const weeks = i.weeksLeft ? ` · ${i.weeksLeft}w` : '';
    return `<span class="chip injury" title="${esc(def.desc)}${i.weeksLeft ? ` Heals in ${i.weeksLeft} Medbay week(s).` : ''}">${ICON.injury}${def.name}${i.weight > 1 ? ' ×' + i.weight : ''}${weeks}</span>`;
  }).join('');
  const decor = Object.entries(f.decor).filter(([, n]) => n > 0)
    .map(([k, n]) => `<span class="chip decor" title="${esc(DECOR[k].effect)}">${DECOR[k].name} ×${n}</span>`).join('');
  // Titles won in your top arena gave +1 Power; lower-arena ones paid Renown and Gold (older saves: all gave Power).
  const titles = (f.titles ?? []).map((t) => `<span class="chip title" title="${t === 'Master of the Games' ? 'Winner of the Grand Tournament' : !f.powerTitles || f.powerTitles.includes(t) ? '+1 Power (won in your top arena)' : 'Won in a lower arena: Renown and Gold, no Power'}">🏆 ${esc(t)}</span>`).join('');
  const scars = (f.scars ?? []).map((sc) => `<span class="chip scar" title="${esc(SCARS[sc.id].desc)}">🩹 ${esc(SCARS[sc.id].name)}${sc.vs ? ` (${sc.vs})` : ''}</span>`).join('');
  const augs = (f.augments ?? []).map((k) => `<span class="chip augment" title="${esc(AUGMENTS[k].desc)}">⚙ ${esc(AUGMENTS[k].name)}</span>`).join('');
  const perks = (f.perks ?? []).map((p) => `<span class="chip perk" title="${esc(PERKS[p].desc)}">⭐ ${esc(PERKS[p].name)}</span>`).join('');
  const gear = [f.gear?.weapon, f.gear?.armor].filter(Boolean).map((k) => `<span class="chip gear" title="${esc(gearSummary(GEAR[k]))}">⚒ ${esc(GEAR[k].name)}</span>`).join('');
  const nextXp = XP.levels[(f.level ?? 1) - 1];
  const levelLine = f.level ? `<span class="lvl-chip" title="XP ${f.xp}${nextXp ? ` / ${nextXp} for the next level` : ' (max level reached; XP no longer adds anything)'}">Lv ${f.level}${nextXp ? '' : ' max'}</span>` : '';
  const danger = combatant ? mortalDanger(combatant) : f.alive && effectiveInjuries(f) >= deathGateAt(f);
  const marks = killMarks(f).map((k) => `<span class="chip mark" title="${esc(k.desc)}">💀 ${esc(k.name)}</span>`).join('');
  const winsBy = Object.entries(f.arenaWins ?? {}).filter(([, n]) => n > 0);
  const totalWins = winsBy.reduce((n, [, w]) => n + w, 0) + ((f.titles ?? []).includes('Master of the Games') ? 1 : 0);
  const wins = totalWins ? `<span class="chip wins" title="Wins by arena: ${esc(winsBy.map(([t, n]) => `${CIRCUITS[t - 1]?.name ?? 'Grand Tournament'}: ${n}`).join(' · '))}">🏅 ${totalWins} win${totalWins === 1 ? '' : 's'}</span>` : '';
  const kills = f.kills ? `<span class="chip kills" title="Opponents killed in the arena. ${KILL_MARKS.map((k) => `${k.at} kills: ${k.name} (${k.desc})`).join(' ')}">💀 ${f.kills}</span>` : '';
  return `
    <article class="card kind-${f.kind}${f.alive ? '' : ' dead'}${danger ? ' danger' : ''}${compact ? ' compact' : ''}">
      ${tag ? `<div class="card-tag">${tag}</div>` : ''}
      <div class="card-head">
        <div class="id-row">${portrait(f, compact ? 44 : 52)}<div class="who"><h3><span class="nm">${esc(f.name)}</span></h3><div class="kind">${levelLine} ${KINDS[f.kind].name} · ${clsName}</div></div></div>
        <div class="badges">
          <div class="badge power" title="Power decides who wins rounds. ${f.power}${gearPow(f) ? ` + ${gearPow(f)} from gear` : ''}${decorPow(f) ? ` + ${decorPow(f)} from Fire Braziers (Firebug)` : ''}${augPow(f) ? ` + ${augPow(f)} from augments` : ''}. Each point of difference shifts the odds a lot.">${ICON.power}<b>${f.power + gearPow(f) + decorPow(f) + augPow(f)}</b></div>
          <div class="badge speed" title="Speed decides who strikes first (Speed + d6) and makes them harder to wound. ${f.speed}${gearSpd(f) ? ` ${gearSpd(f) > 0 ? '+' : '−'} ${Math.abs(gearSpd(f))} from gear` : ''}.">${ICON.speed}<b>${f.speed + gearSpd(f)}</b></div>
        </div>
      </div>
      <div class="traits">
        ${trait ? `<span class="chip trait${off('kind')}" title="${esc(trait.desc)}">${trait.name}</span>` : ''}
        ${f.cls ? `<span class="chip ability${off('class')}" title="${esc(abilityDesc)}">${classAbility(f)}</span>` : ''}
        ${f.humor ? `<span class="chip humor" title="${esc(HUMORS[f.humor].desc)}">${HUMOR_ICON[f.humor]} ${HUMORS[f.humor].name}</span>` : ''}
        ${wins}${titles}${marks}${scars}${augs}${perks}${gear}${kills}
      </div>
      ${compact ? '' : `<div class="trait-text">${trait ? `<div><b>${trait.name}:</b> ${esc(trait.desc)}</div>` : ''}${f.cls ? `<div><b>${classAbility(f)}:</b> ${esc(abilityDesc)}</div>` : ''}${gearBonus(f) ? `<div><b>Gear:</b> ${esc(gearBonus(f))}</div>` : ''}${f.humor ? `<div><b>${HUMORS[f.humor].name}:</b> ${esc(HUMORS[f.humor].desc)}</div>` : ''}</div>`}
      ${f.notice ? `<div class="notice">⚠ ${esc(f.notice)}</div>` : ''}
      <div class="status-row">
        <span class="gate-wrap">Death Gate ${deathGate(f)}</span>
        ${stress && f.stress !== undefined ? stressBar(f) : ''}
        ${stress && f.morale !== undefined ? moraleChip(f) : ''}
        ${f.renown ? `<span class="renown" title="Renown: fame from wins. +1 Gold per 5 on wins, but famous fighters expect better rooms.">★ ${f.renown}</span>` : ''}
      </div>
      ${injuries || decor ? `<div class="chips">${injuries}${decor}</div>` : ''}
      ${actions}
    </article>`;
}

function gearSummary(g) {
  const bits = [];
  if (g.power) bits.push(`${g.power > 0 ? '+' : '−'}${Math.abs(g.power)} Power`);
  if (g.speed) bits.push(`${g.speed > 0 ? '+' : '−'}${Math.abs(g.speed)} Speed`);
  if (g.injure) bits.push(`+${g.injure / 1000}% to injure`);
  if (g.guard) bits.push(`−${g.guard / 1000}% to be injured`);
  return bits.join(', ');
}

function moraleChip(f) {
  const state = f.morale >= MORALE.inspired ? ['inspired', 'Inspired: +5% win chance'] : f.morale < MORALE.mutinous ? ['mutinous', 'Mutinous: refuses to fight'] : f.morale < MORALE.restless ? ['restless', "Discontented: won't train"] : ['content', 'Content'];
  return `<span class="morale ${state[0]}" title="Morale ${f.morale}/100. ${state[1]}. Comfort (Quarters, decor, Entertainment Room) raises it; fame raises expectations.">☺ ${f.morale} <small>${state[1].split(':')[0]}</small></span>`;
}

const gearPow = (f) => [f.gear?.weapon, f.gear?.armor].filter(Boolean).reduce((n, k) => n + (GEAR[k].power ?? 0), 0);
// Power that's always on: Firebug's braziers (+1 each) and cyborg augments.
const decorPow = (f) => (f.kindTrait === 'firebug' ? f.decor?.fireBrazier ?? 0 : 0);
const augPow = (f) => (f.augments ?? []).reduce((n, k) => n + (AUGMENTS[k]?.power ?? 0), 0);
const gearSpd = (f) => [f.gear?.weapon, f.gear?.armor].filter(Boolean).reduce((n, k) => n + (GEAR[k].speed ?? 0), 0);
// Gear effects that the badges don't show: injure chance and armor.
function gearBonus(f) {
  const items = [f.gear?.weapon, f.gear?.armor].filter(Boolean).map((k) => GEAR[k]);
  const injure = items.reduce((n, g) => n + (g.injure ?? 0), 0);
  const guard = items.reduce((n, g) => n + (g.guard ?? 0), 0);
  return [injure ? `+${injure / 1000}% to injure` : '', guard ? `−${guard / 1000}% to be injured (armor)` : ''].filter(Boolean).join(', ');
}
