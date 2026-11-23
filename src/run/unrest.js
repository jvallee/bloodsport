// L2.5 unrest (7.3, docs/roadmap-v7.md Phase 3): agitation, mutinous fighters' unrest and incidents, and The Chains Break.
// Uses its own dice (run.rng.unrest), so a house that never has a Mutinous fighter rolls exactly as before.

import { createRng, deriveSeed, next, pick } from '../rng.js';
import { UNREST, MORALE, STRESS, HEAL_WEEKS, INJURY_BY_TAG, CIRCUITS } from '../data.js';
import { MOOD_WEEKS } from '../events.js';
import { log, chronicle, bumpMorale, effectivePower, changeFavor, findFighter } from './helpers.js';
import { plotActive, changeSuspicion } from './plotEngine.js';
import { bondmate } from './houses.js';

const unrestRng = (run) => (run.rng.unrest ??= createRng(deriveSeed(run.seed, 15)));
export const isMutinous = (f) => f.morale < MORALE.mutinous;
export const isRestless = (f) => f.morale >= MORALE.mutinous && f.morale < MORALE.restless;
const skullRack = (f) => f.decor?.skullRack > 0;

// Rung 1: a Restless fighter who is Choleric, overtrained or sleeps by a Skull Rack.
export const isAgitated = (f) => isRestless(f) && (f.humor === 'choleric' || f.stress >= STRESS.overtrained || skullRack(f));

// Rung 2: what one Mutinous fighter adds to the house's unrest each week.
export function unrestFrom(f) {
  if (!isMutinous(f)) return 0;
  return 1 + (f.humor === 'choleric' || f.origin === 'Condemned convict' ? 1 : 0)
    + (f.titles?.length || f.level >= 4 ? 1 : 0) + (skullRack(f) ? 1 : 0);
}

// The crisis's ringleader: the strongest Mutinous fighter (or, if none is left, the unhappiest).
export function ringleader(run) {
  const mut = run.roster.filter(isMutinous).sort((a, b) => effectivePower(b) - effectivePower(a));
  return mut[0] ?? [...run.roster].sort((a, b) => a.morale - b.morale)[0] ?? null;
}

// Power on each side if the guards go in: loyal fighters (not the ringleader) plus the garrison, against the mutineers.
export function revoltSides(run, leader = ringleader(run)) {
  const loyal = run.roster.filter((f) => f !== leader && f.morale >= UNREST.loyalMorale).reduce((s, f) => s + effectivePower(f), 0)
    + UNREST.garrisonPerLevel * (run.prestigeLevel ?? 1);
  const mutineers = run.roster.filter((f) => f === leader || f.morale < UNREST.mutineerMorale).reduce((s, f) => s + effectivePower(f), 0);
  return { loyal, mutineers };
}

function palatineBlocker(run, leader) {
  if (run.palatineUsed) return 'Only once a career.';
  if (!plotActive(run) || !['cause', 'ready'].includes(run.plot?.stage)) return 'Only a house already in the rebels\' cause can turn this fury on the Palatine.';
  if (leader?.spy) return 'The ringleader writes to the palace.';
  return null;
}

function incident(run, f) {
  const r = unrestRng(run);
  run.unrestStats.incidents += 1;
  const kind = pick(r, ['brawl', 'theft', 'escape']);
  if (kind === 'brawl') {
    const victim = pick(r, run.roster.filter((x) => x !== f)) ?? f;
    victim.injuries.push({ tag: 'fleshWound', weight: 1, weeksLeft: HEAL_WEEKS.fleshWound });
    log(run, `${f.name} starts a brawl in the barracks; ${victim.name} takes a Flesh Wound.`, 'bad');
  } else if (kind === 'theft') {
    const gold = Math.min(run.gold, UNREST.theftPerTier * Math.min(run.topTier, CIRCUITS.length));
    run.gold -= gold;
    log(run, `${f.name} breaks into the strongbox${gold ? `: ${gold} Gold gone` : ', but it is empty'}.`, 'bad');
  } else {
    f.stress = Math.min(STRESS.max, f.stress + UNREST.escapeStress);
    chronicle(run, f, 'Tried to escape over the wall, and was dragged back.');
    log(run, `${f.name} tries to escape over the wall and is dragged back (+${UNREST.escapeStress} Stress).`, 'bad');
  }
}

// Weekly (advanceWeek): agitation, unrest and incidents, the warning, and the crisis.
export function unrestWeek(run) {
  run.unrest ??= 0;
  run.unrestStats ??= { incidents: 0, crises: 0 };
  for (const f of run.roster.filter(isAgitated)) {
    const partner = bondmate(run, f);
    if (partner) {
      bumpMorale(partner, UNREST.bondDrag);
      log(run, `${f.name} mutters in the mess hall; ${partner.name} listens (${UNREST.bondDrag} Morale).`, 'warn');
    }
  }
  const mutineers = run.roster.filter(isMutinous);
  for (const f of mutineers) {
    run.unrest += unrestFrom(f);
    if (next(unrestRng(run)) < UNREST.incident) incident(run, f);
  }
  if (!mutineers.length) run.unrest = Math.max(0, run.unrest - UNREST.cool);
  if (run.unrest < UNREST.warn) {
    run.unrestWarned = null;
    return;
  }
  if (run.unrestWarned == null) {
    run.unrestWarned = run.week;
    log(run, `The barracks seethe: unrest ${run.unrest}/${UNREST.threshold}. Calm your Mutinous fighters, or the chains will break.`, 'bad');
    return;
  }
  // The chains break only while someone is still Mutinous (calming them all in time averts it, as the warning says).
  if (run.unrest >= UNREST.threshold && run.unrestWarned < run.week && mutineers.length && !run.event && run.status === 'active') openCrisis(run);
}

export function openCrisis(run) {
  const leader = ringleader(run);
  if (!leader) return;
  const { loyal, mutineers } = revoltSides(run, leader);
  run.event = { id: 'chainsBreak', f: leader.id, price: UNREST.coffersPerFighter * run.roster.length, loyal, mutineers, palatine: palatineBlocker(run, leader) };
  run.unrestStats.crises += 1;
  log(run, `The chains break: ${leader.name} leads a revolt in the barracks.`, 'bad');
}

function calm(run, out) {
  run.unrest = 0;
  run.unrestWarned = null;
  for (const f of run.roster) f.mood = { n: (f.mood?.n ?? 0) + UNREST.calmMood, weeks: MOOD_WEEKS };
  out.push(`the barracks calm: everyone +${UNREST.calmMood} Morale for ${MOOD_WEEKS} weeks`);
}

// The Chains Break: the player's answer (applyEventEffects).
export function resolveRevolt(run, how, ev, out) {
  const leader = findFighter(run, ev.f);
  if (how === 'coffers') {
    run.gold -= ev.price;
    out.push(`−${ev.price} Gold`);
    calm(run, out);
  } else if (how === 'palatine') {
    run.palatineUsed = true;
    run.plot.trust = Math.max(0, run.plot.trust + UNREST.palatineTrust);
    changeSuspicion(run, UNREST.palatineSuspicion);
    if (leader) {
      run.plot.champion = leader.id;
      chronicle(run, leader, 'Led a revolt in the barracks, and turned it toward the Palatine.');
      out.push(`${leader.name} joins the cause`);
    }
    calm(run, out);
  } else if (ev.loyal >= ev.mutineers) {
    const tag = pick(unrestRng(run), ['concussed', 'maimed']);
    if (leader) {
      leader.injuries.push({ tag, weight: INJURY_BY_TAG[tag].weight, weeksLeft: HEAL_WEEKS[tag] });
      chronicle(run, leader, `Led a revolt in the barracks; the guards put it down (${INJURY_BY_TAG[tag].name}).`);
      out.push(`the revolt is put down; ${leader.name} is ${INJURY_BY_TAG[tag].name}`);
    }
    changeFavor(run, UNREST.putDownFavor, 'a revolt in your barracks');
    out.push(`${UNREST.putDownFavor} Favour`);
    run.unrest = UNREST.afterPutDown;
    run.unrestWarned = null;
  } else {
    out.push('the guards are overrun');
    run.status = 'lost';
    run.endReason = 'Killed in a gladiator revolt.';
    run.fortune = null;
  }
}
