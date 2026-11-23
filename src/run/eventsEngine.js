// L3c weekly events engine (rolling, targets, choice validation, effects, spy handling, and ordered logging).

import { next, pick } from '../rng.js';
import { HEAL_WEEKS, SPY, INJURY_BY_TAG, CONSUMABLES } from '../data.js';
import { EVENTS, EVENT_BY_ID, EVENT_CHANCE, MOOD_WEEKS, EVENT_MEMORY, choiceLabel } from '../events.js';
import { isTournamentWeek, isWinter } from '../calendar.js';
import {
  LOG_CAP, clampStress, findFighter, chronicle, monthOf, assertOk, gainXp,
  activeModalOrPendingBlocker, isInActiveBracket, clearHealedMedbay, removeFighter,
  changeFavor, checkLoss,
} from './helpers.js';
import { plotActive, changeSuspicion, advancePlot, applyPlotEffects } from './plotEngine.js';
import { resolveRevolt } from './unrest.js';

export function eventTargets(run, who) {
  const alive = run.roster.filter((f) => !isInActiveBracket(run, f.id));
  if (!alive.length) return null;
  const r = run.rng.events;
  if (who === 'pair') {
    if (alive.length < 2) return null;
    const f = pick(r, alive);
    return { f: f.id, g: pick(r, alive.filter((x) => x !== f)).id };
  }
  if (who === 'famous') return { f: [...alive].sort((a, b) => b.renown - a.renown)[0].id };
  if (who === 'green') return { f: [...alive].sort((a, b) => a.level - b.level || a.xp - b.xp)[0].id };
  return { f: pick(r, alive).id };
}

export function rollEvent(run) {
  const r = run.rng.events;
  const planning = !isTournamentWeek(run.week) && !isWinter(run.week);
  const curMonth = monthOf(run.week);
  if (planning && run.eventMonth === curMonth) return;
  const chance = isWinter(run.week) ? EVENT_CHANCE.winter : EVENT_CHANCE.season;
  if (!run.roster.length || next(r) >= chance) return;
  const recent = run.recentEvents ?? [];
  const eligible = run.roster.filter((x) => !isInActiveBracket(run, x.id));
  if (!eligible.length) return;
  const options = EVENTS.filter((e) => {
    if (recent.includes(e.id)) return false;
    if (e.when && !e.when(run)) return false;
    if (e.who === 'pair' && eligible.length < 2) return false;
    if (e.target && !e.target(run).some((x) => !isInActiveBracket(run, x.id))) return false;
    return true;
  });
  if (!options.length) return;
  const e = pick(r, options);
  let targets;
  if (e.target) {
    const pool = e.target(run).filter((x) => !isInActiveBracket(run, x.id));
    if (!pool.length) return;
    targets = { f: pick(r, pool).id };
  } else {
    targets = eventTargets(run, e.who);
    if (!targets) return;
  }
  run.event = { id: e.id, ...targets };
  if (planning) run.eventMonth = curMonth;
  run.recentEvents = [...recent, e.id].slice(-EVENT_MEMORY);
}

export function eventNames(run, ev = run.event) {
  const name = (id) => findFighter(run, id)?.name;
  return { f: name(ev?.f), g: name(ev?.g), name: ev?.name, house: ev?.house, opp: ev?.opp, fOdds: ev?.fOdds, gOdds: ev?.gOdds, price: ev?.price, loyal: ev?.loyal, mutineers: ev?.mutineers };
}

export function eventChoiceBlocker(run, index) {
  const blocked = activeModalOrPendingBlocker(run, { allowEvent: true, allowFortune: true });
  if (blocked) return blocked;
  if (!run.event) return 'No event to decide.';
  const choice = EVENT_BY_ID[run.event.id]?.choices[index];
  if (!choice) return 'No such choice.';
  if (choice.cost && run.gold < choice.cost) return `Needs ${choice.cost} Gold.`;
  return choice.needs?.(run, run.event) ?? null;
}

export function applyEventEffects(run, eff, ev, out) {
  const targets = (to) => (to === 'all' ? run.roster : (to === 'both' ? [ev.f, ev.g] : [ev[to]]).map((id) => findFighter(run, id)).filter(Boolean));
  if (eff.gold) { run.gold = Math.max(0, run.gold + eff.gold); out.push(`${eff.gold > 0 ? '+' : ''}${eff.gold} Gold`); }
  if (eff.favor) { changeFavor(run, eff.favor, EVENT_BY_ID[ev.id].title.toLowerCase().replace(/^the /, '')); out.push(`${eff.favor > 0 ? '+' : ''}${eff.favor} Favour`); }
  if (eff.item) { run.inventory.items[eff.item] = (run.inventory.items[eff.item] ?? 0) + 1; out.push(`+1 ${CONSUMABLES[eff.item].name}`); }
  for (const [key, label] of [['morale', 'Morale'], ['stress', 'Stress'], ['renown', 'Renown']]) {
    if (!eff[key]) continue;
    const fs = targets(eff[key].to);
    for (const f of fs) {
      if (key === 'morale') f.mood = { n: (f.mood?.n ?? 0) + eff[key].n, weeks: MOOD_WEEKS };
      else if (key === 'stress') f.stress = clampStress(f.stress + eff[key].n);
      else f.renown = Math.max(0, f.renown + eff[key].n);
    }
    if (fs.length) out.push(`${eff[key].to === 'all' ? 'everyone' : fs.map((f) => f.name).join(' and ')} ${eff[key].n > 0 ? '+' : ''}${eff[key].n} ${label}`);
  }
  if (eff.xp) for (const f of targets(eff.xp.to)) { gainXp(run, f, eff.xp.n); out.push(`${f.name} +${eff.xp.n} XP`); }
  if (eff.injury) {
    for (const f of targets(eff.injury.to)) {
      const inj = INJURY_BY_TAG[eff.injury.tag];
      f.injuries.push({ tag: inj.tag, weight: inj.weight, weeksLeft: HEAL_WEEKS[inj.tag] });
      out.push(`${f.name} is wounded: ${inj.name}`);
    }
  }
  if (eff.heal) {
    for (const f of targets(eff.heal.to)) {
      const inj = f.injuries.pop();
      if (inj) out.push(`${f.name}'s ${INJURY_BY_TAG[inj.tag].name} is healed`);
      clearHealedMedbay(run, f);
    }
  }
  if (eff.spy) spyFound(run, findFighter(run, ev.f), eff.spy, out);
  if (eff.revolt) resolveRevolt(run, eff.revolt, ev, out);
  if (ev.plot) applyPlotEffects(run, eff, ev, out);
  if (eff.chance) {
    const p = typeof eff.chance.p === 'function' ? eff.chance.p(run, ev) : eff.chance.p;
    const won = next(ev.plot ? run.rng.plot : run.rng.events) < p;
    out.push(won ? 'it went well' : 'it went badly');
    applyEventEffects(run, won ? eff.chance.win : eff.chance.lose, ev, out);
  }
}

export function spyFound(run, f, choice, out) {
  run.spyFound = true;
  if (!f) return;
  if (choice === 'execute') {
    chronicle(run, f, "Unmasked as the Emperor's spy, and executed in the yard.");
    removeFighter(run, f, { fallen: { body: true, spy: true } });
    if (plotActive(run)) changeSuspicion(run, -SPY.suspicion);
    out.push(`${f.name} is executed in the yard`);
  } else {
    f.spy = true;
    chronicle(run, f, 'Kept on, though you know who they write to.');
    if (plotActive(run)) changeSuspicion(run, SPY.suspicion);
  }
}

export function chooseEvent(run, index) {
  assertOk(eventChoiceBlocker(run, index));
  const ev = run.event;
  const e = EVENT_BY_ID[ev.id];
  const choice = e.choices[index];
  const out = [];
  const names = eventNames(run, ev);
  const before = run.log[run.log.length - 1];
  const insertAt = run.log.length;
  applyEventEffects(run, choice.effects, ev, out);
  if (ev.plot && plotActive(run)) {
    if (choice.refuse && run.plot.stage !== 'ready') run.plot.refusals += 1;
    else if (choice.help) {
      run.plot.refusals = 0;
      if (run.plot.stage === 'favours' && ev.id !== 'chalkMark') run.plot.favours = (run.plot.favours ?? 0) + 1;
    }
    advancePlot(run);
  }
  const what = out.join(', ');
  const text = `${e.title}: ${choiceLabel(choice, names)}.${out.length ? ` ${what[0].toUpperCase()}${what.slice(1)}.` : ''}`;
  const entry = { week: run.week, text, tone: 'event' };
  const idx = before ? run.log.indexOf(before) : -1;
  const pos = idx >= 0 ? idx + 1 : Math.min(insertAt, run.log.length);
  run.log.splice(pos, 0, entry);
  if (run.log.length > LOG_CAP) run.log.splice(0, run.log.length - LOG_CAP);
  run.event = null;
  checkLoss(run);
  return text;
}
