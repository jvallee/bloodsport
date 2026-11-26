// L3d espionage (7.4, docs/roadmap-v7.md Phase 4): moles, clues and investigation; turned double agents; covert ops.
// Uses its own dice (run.rng.espionage), so the Market, Fortune and fight rolls are the same with or without it.

import { createRng, deriveSeed, next, pick } from '../rng.js';
import { ESPIONAGE, CIRCUITS } from '../data.js';
import { MOLE_CLUES, MOLE_TELLS, AFTERMATH_LINES } from '../quests.js';
import { isTournamentWeek } from '../calendar.js';
import { maxLevel, oracleLevel } from '../ludus.js';
import {
  log, chronicle, findFighter, bumpMorale, monthOf, assertOk, activeModalOrPendingBlocker, changeFavor, removeFighter, isInActiveBracket, talk,
} from './helpers.js';
import { plotActive, changeSuspicion } from './plotEngine.js';
import { houseOf, opponentFor } from './houses.js';
import { isMutinous } from './unrest.js';

const espRng = (run) => (run.rng.espionage ??= createRng(deriveSeed(run.seed, 17)));
export const espState = (run) => (run.espionage ??= { clues: [], suspects: null, opMonth: null, op: null, leak: null });
export const moleOf = (run) => run.roster.find((f) => f.mole && !f.mole.exposed) ?? null;
export const masterName = (run, master) => (master === 'palace' ? 'the palace' : run.houses?.find((h) => h.id === master)?.name ?? 'a rival house');
export const canNarrow = (run) => oracleLevel(run) >= 2 || maxLevel(run, 'gallery') > 0;

// Weekly (advanceWeek, before the week ends): flips, clues and a mole's work. A fight week clears last plans.
export function espionageWeek(run) {
  const st = espState(run);
  if (isTournamentWeek(run.week)) {
    st.leak = null;
    st.op = null;
  }
  if (!moleOf(run)) flipMutineer(run);
  const mole = moleOf(run);
  if (!mole) {
    // The mole is gone (died, released, retired): the whispers stop, and an old suspect list would mislead.
    if (st.clues.length || st.suspects) log(run, 'The whispers in the house have stopped. Whoever was listening has stopped too, or learned to listen more quietly.', 'event');
    st.clues = [];
    st.suspects = null;
    return;
  }
  if (mole.mole.since == null) { // a planted mole starts counting the week they join; a new mole, a new trail
    mole.mole.since = run.week;
    st.clues = [];
    st.suspects = null;
  }
  if (run.week <= mole.mole.since) return; // never acts in their first week
  const r = espRng(run);
  if (next(r) < ESPIONAGE.clue) {
    const text = pick(r, MOLE_CLUES);
    if (/Two Gold/.test(text)) run.gold = Math.max(0, run.gold - 2);
    st.clues = [...st.clues, { week: run.week, text }].slice(-8);
    mole.mole.clues = (mole.mole.clues ?? 0) + 1;
    if (!st.suspects) {
      const other = pick(r, run.roster.filter((f) => f !== mole));
      st.suspects = [mole.id, other?.id].filter(Boolean).sort();
    }
    log(run, `Something is wrong in the house: ${text}`, 'warn');
  }
  if (mole.mole.clues > 0 && next(r) < ESPIONAGE.act) {
    if (mole.mole.master === 'palace') {
      if (plotActive(run)) changeSuspicion(run, ESPIONAGE.palaceLeak);
    } else {
      st.leak = { house: mole.mole.master, week: run.week };
    }
  }
}

// A Mutinous fighter may be bought by a feuding house, or by the palace once it is suspicious enough. Core 5 companions never flip as moles.
function flipMutineer(run) {
  const feuding = (run.houses ?? []).filter((h) => h.feud > 0).sort((a, b) => b.feud - a.feud)[0];
  const master = feuding?.id ?? (plotActive(run) && run.plot.suspicion >= ESPIONAGE.palaceSuspicion ? 'palace' : null);
  if (!master) return;
  for (const f of run.roster.filter((x) => !x.companion && isMutinous(x) && !x.mole && !x.spy)) {
    if (next(espRng(run)) < ESPIONAGE.flip) {
      f.mole = { master, since: run.week, clues: 0 };
      espState(run).clues = [];
      espState(run).suspects = null;
      return;
    }
  }
}

// Monthly (after the Market refresh): some months one Market fighter is a rival's mole, cheap for their Power.
export function plantMole(run) {
  const candidates = (run.market ?? []).filter((f) => !f.companion);
  if (!run.houses?.length || !candidates.length || moleOf(run) || candidates.some((f) => f.mole)) return;
  const r = espRng(run);
  if (next(r) >= ESPIONAGE.plant) return;
  const f = pick(r, candidates);
  const house = pick(r, run.houses);
  f.mole = { master: house.id, since: null, clues: 0, tell: pick(r, MOLE_TELLS), cut: Math.max(1, Math.round(ESPIONAGE.plantDiscount * (CIRCUITS[Math.min(run.topTier, CIRCUITS.length) - 1].price ?? 4))) };
}

// ---------- Investigation ----------

export function investigateBlocker(run, id) {
  const blocked = activeModalOrPendingBlocker(run);
  if (blocked) return blocked;
  if (!espState(run).clues.length) return 'No clues yet: nothing to go on.';
  if (!findFighter(run, id)) return 'No such fighter.';
  if (isInActiveBracket(run, id)) return `${findFighter(run, id).name} is in the middle of a bracket: investigate them after it.`;
  if (run.gold < ESPIONAGE.investigate) return `Needs ${ESPIONAGE.investigate} Gold.`;
  return null;
}

export function investigate(run, id) {
  assertOk(investigateBlocker(run, id));
  const f = findFighter(run, id);
  run.gold -= ESPIONAGE.investigate;
  if (f.mole && !f.mole.exposed) {
    run.event = { id: 'moleUnmasked', f: f.id, house: masterName(run, f.mole.master) };
    log(run, `${f.name} is unmasked: they report to ${masterName(run, f.mole.master)}.`, 'event');
    return true;
  }
  bumpMorale(f, ESPIONAGE.offended);
  log(run, `${f.name} is searched, questioned half the night, and found clean. They don't forget it (${ESPIONAGE.offended} Morale).`, 'warn');
  return false;
}

// The unmasked mole's fate (applyEventEffects, effect `mole`).
export function resolveMole(run, how, ev, out) {
  const f = findFighter(run, ev.f);
  const st = espState(run);
  if (!f?.mole) return;
  const house = run.houses?.find((h) => h.id === f.mole.master) ?? null;
  st.clues = [];
  st.suspects = null;
  if (how === 'turn') {
    run.gold -= ESPIONAGE.turnCost;
    f.mole = { ...f.mole, exposed: true, turned: true };
    chronicle(run, f, `Unmasked as a mole for ${masterName(run, f.mole.master)}, and turned: now they feed their masters lies.`);
    out.push(`−${ESPIONAGE.turnCost} Gold`, `${f.name} now feeds ${masterName(run, f.mole.master)} a false playbook`);
    talk(run, `mole-${f.id}`, [{ speaker: 'fighter', fighterId: f.id, text: AFTERMATH_LINES.turned }]);
    return;
  }
  if (how === 'ransom') {
    run.gold += ESPIONAGE.ransom;
    if (house) house.feud = 0;
    chronicle(run, f, `Unmasked as a mole, and sold back to ${masterName(run, f.mole.master)}.`);
    removeFighter(run, f);
    talk(run, `mole-${f.id}`, [{ speaker: 'narrator', text: AFTERMATH_LINES.ransomed(f.name, masterName(run, f.mole.master)) }]);
    out.push(`+${ESPIONAGE.ransom} Gold`, `${f.name} goes back to ${masterName(run, f.mole.master)}${house ? '; the feud is over' : ''}`);
    return;
  }
  chronicle(run, f, `Unmasked as a mole for ${masterName(run, f.mole.master)}, and executed in the yard.`);
  if (f.mole.master === 'palace') {
    if (plotActive(run)) changeSuspicion(run, ESPIONAGE.executeSuspicion);
  } else if (house) {
    house.glory = Math.max(0, house.glory + ESPIONAGE.executeGlory);
  }
  removeFighter(run, f, { fallen: { body: true, spy: true } });
  for (const x of run.roster) bumpMorale(x, ESPIONAGE.executeMorale);
  talk(run, `mole-${f.id}`, [{ speaker: 'steward', text: AFTERMATH_LINES.executed }]);
  out.push(`${f.name} is executed in the yard`, `everyone ${ESPIONAGE.executeMorale} Morale`);
}

// ---------- Covert ops ----------

export const opTarget = (run) => (run.arenas?.[run.topTier] ? opponentFor(run, run.topTier) : null);
const doubleAgent = (run) => run.roster.some((f) => f.mole?.turned);

export function opChance(run, type) {
  const op = ESPIONAGE.ops[type];
  return op.chance + (op.galleryBonus && maxLevel(run, 'gallery') ? op.galleryBonus : 0) + (op.agentBonus && doubleAgent(run) ? op.agentBonus : 0);
}

export function covertOpBlocker(run, type) {
  const blocked = activeModalOrPendingBlocker(run);
  if (blocked) return blocked;
  const op = ESPIONAGE.ops[type];
  if (!op) return 'Unknown covert op.';
  if (!maxLevel(run, 'liaison') && !maxLevel(run, 'gallery')) return 'Needs a Liaison or the Whispering Gallery.';
  if (espState(run).opMonth === monthOf(run.week)) return 'One covert op a month.';
  if (isTournamentWeek(run.week) || run.bouts) return 'Plan it before fight day.';
  if (!opTarget(run)) return 'No opponent to work on yet.';
  if (type === 'armourer' && !opTarget(run).gear?.armor) return `${opTarget(run).name} wears no armour to sabotage.`;
  if (run.gold < op.cost) return `Needs ${op.cost} Gold.`;
  return null;
}

export function covertOp(run, type) {
  assertOk(covertOpBlocker(run, type));
  const op = ESPIONAGE.ops[type];
  const st = espState(run);
  const target = opTarget(run);
  const r = espRng(run);
  run.gold -= op.cost;
  st.opMonth = monthOf(run.week);
  const success = next(r) < opChance(run, type);
  if (success) {
    st.op = { type, oppId: target.id, result: 'success', variant: type === 'wine' ? pick(r, ['bleeding', 'sluggish']) : null };
    log(run, `${op.name}: it worked, and nobody saw a thing. ${target.name} will not know what hit them.`, 'good');
    return st.op;
  }
  st.op = { type, oppId: target.id, result: 'caught' };
  if (type !== 'playbook') changeFavor(run, ESPIONAGE.caughtFavor, `your agents were caught (${op.name})`);
  const house = houseOf(run, target);
  if (type === 'wine' && house) house.feud = Math.max(house.feud, ESPIONAGE.feudMonths);
  log(run, `${op.name}: your agent was caught${type === 'playbook' ? `. ${target.name} will fight for vengeance` : `. ${ESPIONAGE.caughtFavor} Favour`}${type === 'wine' && house ? `, and ${house.name} swears a feud` : ''}.`, 'bad');
  return st.op;
}

// At the start of a match (startMatch): stolen plans, a double agent's false playbook, and this month's covert op.
export function espionageAtMatch(run, m, { consume = true } = {}) {
  const st = espState(run);
  const opp = m.b.f;
  const house = houseOf(run, opp);
  if (st.leak && house && house.id === st.leak.house) {
    m.b.boosts = [...(m.b.boosts ?? []), ...[1, 2, 3].map((round) => ({ power: ESPIONAGE.leakPower, round, name: 'Stolen plans' }))];
  }
  if (house && run.roster.some((f) => f.mole?.turned && f.mole.master === house.id)) {
    m.a.boosts = [...(m.a.boosts ?? []), { win: ESPIONAGE.falsePlaybook, round: 1, name: 'False Playbook' }];
  }
  const op = st.op;
  if (!op || op.oppId !== opp.id) return;
  if (consume) st.op = null;
  if (op.result === 'caught') {
    if (op.type === 'playbook') m.b.vengeance = true;
    return;
  }
  if (op.type === 'playbook') {
    m.playbook = true;
    m.tellSeed ??= deriveSeed(m.intentSeed ?? 0, 41);
  } else if (op.type === 'wine') {
    if (op.variant === 'bleeding') m.b.f.injuries.push({ tag: 'bleeding', weight: 1 });
    else m.b.boosts = [...(m.b.boosts ?? []), ...[1, 2, 3].map((round) => ({ power: -1, round, name: 'Doctored wine' }))];
  } else if (op.type === 'armourer') {
    m.b.f.gear = { ...(m.b.f.gear ?? {}), armor: null };
  }
}

// What espionage would do to a fight against `opp`, for the odds shown before choosing a fighter (nothing is used up).
export function espionageOdds(run, opp) {
  const m = { a: { boosts: [] }, b: { f: structuredClone(opp), boosts: [] } };
  espionageAtMatch(run, m, { consume: false });
  return { opp: m.b.f, boostsA: m.a.boosts, boostsB: m.b.boosts, vengeanceB: Boolean(m.b.vengeance), playbook: Boolean(m.playbook) };
}
