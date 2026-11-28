// L1a hidden rebellion plot engine. Every roll uses run.rng.plot so unaffected careers stay deterministic.

import { int, next, pick } from '../rng.js';
import { CIRCUITS, GEAR, SPY, POLITICAL, PLOT, SHORT, FORTUNE } from '../data.js';
import { RELICS, hasRelic } from '../fortune.js';
import { CELL_IDS, CLUES, PLOT_EVENTS, SUSPICION_SIGNS, SUSPICION_LINES, PREFECT_LINES, isArmed } from '../plot.js';
import { prefectPosture } from '../voices.js';
import { MOOD_WEEKS } from '../events.js';
import { dateOf } from '../calendar.js';
import { medbaySlots, maxLevel, effectAt } from '../ludus.js';
import {
  GRAND_TIER, clamp, log, findFighter, chronicle, bumpMorale, isShort, hasPolicy,
  removeFighter, changeFavor, talk, queueMilestone,
} from './helpers.js';

// Some prisoners are secretly political; their record carries clues and they come cheap.
export function markPolitical(run, f, { force = false } = {}) {
  const r = run.rng.plot;
  const year = dateOf(run.week).year;
  const chance = hasPolicy(run, 'purgePrisons') ? 0 : POLITICAL.chance * (hasPolicy(run, 'amnesty') ? 2 : 1);
  const political = next(r) < chance || force || (!hasPolicy(run, 'purgePrisons') && year >= POLITICAL.guaranteeYear && !run.politicalOffered);
  const clues = [];
  if (political) {
    run.politicalOffered = true;
    f.political = { cell: pick(r, CELL_IDS) };
    f.price = Math.max(1, f.price - POLITICAL.priceCut);
    clues.push(pick(r, CLUES.telling));
    if (next(r) < 0.5) clues.push(pick(r, CLUES.ambiguous));
  } else if (next(r) < POLITICAL.falseClue) {
    clues.push(pick(r, CLUES.ambiguous));
  }
  f.record = clues;
  for (const c of clues) chronicle(run, f, `Prison record: ${c}`);
}

export const plotActive = (run) => Boolean(run.plot) && !run.plot.ended;

const isConspiracyListener = (f) => Boolean(f && (f.companion || f.coreId || f.political));

function checkOrcElfSchism(run) {
  if (!plotActive(run)) return;
  const hasOrc = (run.roster ?? []).some((x) => x.coreId === 'orc' && x.alive !== false && x.kind !== 'revenant');
  const hasElf = (run.roster ?? []).some((x) => x.coreId === 'elf' && x.alive !== false && x.kind !== 'revenant');
  if (hasOrc && hasElf && ['favours', 'cause', 'ready'].includes(run.plot.stage)) {
    for (const f of run.roster ?? []) {
      if ((f.coreId === 'orc' || f.coreId === 'elf') && f.alive !== false && f.kind !== 'revenant') {
        queueMilestone(run, f, { id: 'rebel_orc_elf_schism', priority: 82 });
      }
    }
  }
}

export function joinPlot(run, f) {
  if (!f.political) return;
  if (!run.plot) {
    run.plot = { stage: 'mark', trust: 0, suspicion: 0, refusals: 0, seen: [], cells: [], champion: null, freed: [], nextAt: run.week + int(run.rng.plot, ...PLOT.firstGap), ended: null };
  }
  if (!run.plot.cells.includes(f.political.cell)) run.plot.cells.push(f.political.cell);
  checkOrcElfSchism(run);
}

export const changeSuspicion = (run, n) => {
  const before = run.plot.suspicion;
  run.plot.suspicion = clamp(run.plot.suspicion + n, 0, 100);
  suspicionWarnings(run, before);
};
// The first time suspicion crosses the informer and cold lines, someone says so (7.10; cosmetic: talk only). PLACEHOLDER.
function suspicionWarnings(run, before) {
  const p = run.plot;
  const s = PLOT.suspicion;
  const rebel = run.roster.find((f) => f.political);
  const prefect = (key) => ({ speaker: 'prefect', text: PREFECT_LINES[key] });
  if (before < s.watch && p.suspicion >= s.watch) {
    talk(run, 'suspicion-watch', [prefect('watch')]);
    for (const f of run.roster ?? []) queueMilestone(run, f, { id: 'suspicion_watch', priority: 66 });
  }
  if (before < s.informer && p.suspicion >= s.informer) {
    talk(run, 'suspicion-informer', [prefect('informer'), rebel
      ? { speaker: 'rebel', fighterId: rebel.id, text: SUSPICION_LINES.informer }
      : { speaker: 'steward', text: SUSPICION_LINES.informerSteward }]);
    for (const f of run.roster ?? []) queueMilestone(run, f, { id: 'suspicion_informer', priority: 72 });
  }
  if (before < s.cold && p.suspicion >= s.cold) {
    talk(run, 'suspicion-cold', [prefect('cold'), { speaker: 'steward', text: SUSPICION_LINES.cold }]);
    for (const f of run.roster ?? []) queueMilestone(run, f, { id: 'suspicion_cold', priority: 78 });
  }
}

export function addContact(run, name, cell, how) {
  run.plot.freed.push({ name, cell, how, week: run.week, caught: false });
  log(run, `${name} slips out of the city.`, 'event');
}

export function duePlotCard(run) {
  if (!plotActive(run) || !run.roster.length) return null;
  const ok = (e) => e.stages.includes(run.plot.stage) && (!e.when || e.when(run)) && (e.forced || e.repeat || !run.plot.seen.includes(e.id));
  const forced = PLOT_EVENTS.find((e) => e.forced && ok(e));
  if (forced) return forced;
  if (run.week < run.plot.nextAt) return null;
  const options = PLOT_EVENTS.filter((e) => !e.forced && ok(e));
  const needed = options.filter((e) => e.needed?.(run));
  if (needed.length && next(run.rng.plot) < 0.5) return pick(run.rng.plot, needed);
  if (options.length) return pick(run.rng.plot, options);
  // Nothing new for this stage: the rebels ask again (never the Mark or the prefect's one-time offer).
  const again = PLOT_EVENTS.filter((e) => !e.forced && e.id !== 'chalkMark' && e.id !== 'theOffer' && e.stages.includes(run.plot.stage) && (!e.when || e.when(run)));
  return again.length ? pick(run.rng.plot, again) : null;
}

export function rollPlot(run, recentBefore, eventMonthBefore) {
  const e = duePlotCard(run);
  if (!e) return;
  const t = e.target(run, run.rng.plot);
  if (!t) return;
  if (run.event) {
    run.recentEvents = recentBefore;
    if (eventMonthBefore !== undefined) run.eventMonth = eventMonthBefore;
    else delete run.eventMonth;
  }
  run.event = { id: e.id, plot: true, ...t };
  run.plot.seen.push(e.id);
  run.plot.nextAt = run.week + int(run.rng.plot, ...PLOT.gap);
}

export function plotMonth(run) {
  if (!plotActive(run)) return;
  const p = run.plot;
  const prisoners = run.roster.filter((f) => f.political).length;
  const contacts = p.freed.filter((c) => !c.caught);
  changeSuspicion(run, PLOT.suspicion.perPrisoner * prisoners + PLOT.suspicion.perContact * contacts.length - PLOT.suspicion.decay
    - (contacts.some((c) => c.cell === 'courier') ? PLOT.suspicion.courier : 0)
    + SPY.perMonth * run.roster.filter((f) => f.spy).length
    - effectAt('gallery', maxLevel(run, 'gallery')));
  if (contacts.some((c) => c.cell === 'scribe') && !p.pass && next(run.rng.plot) < 1 / 3) {
    p.pass = true;
    log(run, "A sealed letter arrives with no name on it. Inside: a pass bearing the Emperor's seal.", 'event');
  }
  const priest = contacts.find((c) => c.cell === 'priest');
  if (priest) {
    for (const f of run.roster) f.mood = f.mood?.n < 0 ? { ...f.mood, n: Math.min(0, f.mood.n + PLOT.priestMorale) } : { n: Math.max(f.mood?.n ?? 0, PLOT.priestMorale), weeks: MOOD_WEEKS };
    log(run, `A blessing from ${priest.name} reaches the barracks in secret. Spirits lift.`, 'good');
  }
  const courier = contacts.find((c) => c.cell === 'courier');
  if (courier && p.suspicion >= PLOT.suspicion.watch && next(run.rng.plot) < 0.5) log(run, `${courier.name} sends word: the Praetorians are watching another house this month.`, 'good');
  if (p.suspicion >= PLOT.suspicion.cold) {
    changeFavor(run, -1, 'the palace grows cold toward your house');
    log(run, pick(run.rng.plot, SUSPICION_SIGNS.high), 'bad');
  } else if (p.suspicion >= PLOT.suspicion.watch && next(run.rng.plot) < 0.5) {
    log(run, pick(run.rng.plot, p.suspicion >= PLOT.suspicion.informer ? SUSPICION_SIGNS.mid : SUSPICION_SIGNS.low), 'warn');
  }
  if (p.stage === 'ready' && next(run.rng.plot) < 0.5) log(run, pick(run.rng.plot, SUSPICION_SIGNS.ready), 'event');
  if (p.champion && !run.roster.some((f) => f.id === p.champion)) p.champion = null;
  if (p.stage === 'ready' && !p.champion) p.stage = 'cause';
  if (!prisoners && p.trust < PLOT.survivesAt && !['ready'].includes(p.stage)) return endPlot(run, 'cold');
  advancePlot(run);
}

export function endPlot(run, how) {
  run.plot.ended = how;
}

export function postponeCoup(run) {
  const p = run.plot;
  if (!p.coup) return;
  p.coup = false;
  run.arenas[GRAND_TIER].debuff = p.debuffBefore ?? run.arenas[GRAND_TIER].debuff;
  delete p.debuffBefore;
  p.seen = p.seen.filter((id) => id !== 'coupEve');
}

export function advancePlot(run) {
  const p = run.plot;
  if (p.refusals >= PLOT.refusalsToCold) return endPlot(run, 'cold');
  if (p.stage === 'favours' && p.trust >= PLOT.cause.trust && (p.favours ?? 0) >= PLOT.cause.favours && run.week - (p.markWeek ?? 0) >= PLOT.cause.weeks
    && run.prestigeLevel >= PLOT.cause.houseLevel) {
    p.stage = 'cause';
    p.causeWeek = run.week;
    for (const f of run.roster ?? []) if (isConspiracyListener(f)) queueMilestone(run, f, { id: 'rebel_call_accepted', priority: 74 });
    checkOrcElfSchism(run);
  }
  if (p.stage === 'cause' && p.trust >= PLOT.ready.trust && isArmed(run) && run.roster.some((f) => f.id === p.champion)) {
    p.stage = 'ready';
    checkOrcElfSchism(run);
  }
}

export function applyPlotEffects(run, eff, ev, out) {
  const p = run.plot;
  const f = findFighter(run, ev.f);
  if (eff.trust) {
    p.trust = clamp(p.trust + eff.trust, 0, PLOT.maxTrust);
    if (eff.trust > 0) for (const x of run.roster ?? []) if (isConspiracyListener(x)) queueMilestone(run, x, { id: 'rebel_call_accepted', priority: 74 });
  }
  if (eff.suspicion) changeSuspicion(run, eff.suspicion);
  if (eff.stage) {
    p.stage = eff.stage;
    if (eff.stage === 'favours') {
      p.markWeek = run.week;
      for (const x of run.roster ?? []) if (isConspiracyListener(x)) queueMilestone(run, x, { id: 'rebel_call_accepted', priority: 74 });
    }
    checkOrcElfSchism(run);
  }
  if (eff.reveal) p.reveal = run.topTier;
  if (eff.hide) {
    p.hidden = eff.hide;
    out.push('a stranger sleeps in the Medbay');
    const patients = run.roster.filter((x) => x.job === 'medbay');
    for (const x of patients.slice(medbaySlots(run))) {
      x.job = 'rest';
      out.push(`${x.name} gives up their Medbay bed and rests instead`);
    }
  }
  if (eff.crowd) p.crowdUntil = run.week + eff.crowd;
  if (eff.pass) { p.pass = true; out.push('the pass is hidden in your strongbox'); }
  if (eff.usePass) p.pass = false;
  if (eff.armed) p.armed = true;
  if (eff.disarm) { p.armed = false; out.push('the hidden steel is found and carried off'); }
  if (eff.giveGear) {
    run.inventory.gear.sort((a, b) => (GEAR[a]?.price ?? 0) - (GEAR[b]?.price ?? 0));
    let left = eff.giveGear - run.inventory.gear.splice(0, eff.giveGear).length;
    for (const x of [...run.roster].sort((a, b) => a.power - b.power)) {
      for (const slot of ['weapon', 'armor']) if (left > 0 && x.gear[slot]) { x.gear[slot] = null; left--; }
    }
  }
  if (eff.champion) {
    const who = findFighter(run, ev[eff.champion]);
    if (who) { p.champion = who.id; chronicle(run, who, 'Swore to strike the blow when the Emperor comes to the games.'); out.push(`${who.name} is with you`); }
  }
  if (eff.cool && f) bumpMorale(run, f, -eff.cool);
  if (eff.mark) { const o = run.arenas[run.topTier]?.opponent; if (o) o.rebel = true; }
  if (eff.contact === 'new') addContact(run, ev.name, pick(run.rng.plot, CELL_IDS), ev.id);
  if (eff.freeAsker && f) {
    removeFighter(run, f);
    addContact(run, f.name, f.political?.cell ?? 'courier', 'freed');
  }
  if (eff.askedFree && f) {
    f.askedFree = (f.askedFree ?? 0) + 1;
    if (f.askedFree >= 2) {
      removeFighter(run, f);
      if (next(run.rng.plot) < 0.5) addContact(run, f.name, f.political?.cell ?? 'courier', 'escaped');
      else { changeSuspicion(run, 10); log(run, `${f.name} tried to escape over the wall, and was caught by the watch and executed.`, 'bad'); }
    }
  }
  if (eff.execute && f) {
    removeFighter(run, f, { fallen: {} });
    log(run, `${f.name} is taken by the Praetorians and executed in the arena at noon.`, 'bad');
  }
  if (eff.cold) {
    for (const x of run.roster ?? []) if (isConspiracyListener(x)) queueMilestone(run, x, { id: 'rebel_call_refused', priority: 74 });
    endPlot(run, 'cold');
  }
  if (eff.postpone) log(run, 'Not tonight. The rebels will wait for the next Grand Tournament.', 'event');
  if (eff.coup) {
    p.coup = true;
    p.debuffBefore = run.arenas[run.topTier].debuff;
    run.arenas[run.topTier].debuff = 'emperorsGaze';
  }
  if (eff.betray) {
    for (const x of run.roster ?? []) if (isConspiracyListener(x)) queueMilestone(run, x, { id: 'rebel_call_betrayed', priority: 74 });
    betray(run);
  }
  if (eff.treason) {
    endPlot(run, 'treason');
    run.status = 'lost';
    run.ending = 'treason';
    run.endReason = 'The Praetorians break down the gates. Your house is tried for treason, and the sentence is read at the games.';
    run.fortune = null;
  }
}

export function betray(run) {
  const p = run.plot;
  const victims = [...run.roster.filter((f) => f.political).map((f) => f.name), ...p.freed.filter((c) => !c.caught).map((c) => c.name)];
  for (const f of run.roster.filter((x) => x.political)) {
    chronicle(run, f, 'Named as a traitor by their own house, and executed.');
    removeFighter(run, f, { fallen: {} });
    log(run, `On your word, the Praetorians drag ${f.name} from the barracks. They are executed at noon.`, 'bad');
  }
  for (const c of p.freed.filter((x) => !x.caught)) log(run, `${c.name} is found hiding in the city, and executed.`, 'bad');
  for (const c of p.freed) c.caught = true;
  p.executed = victims;
  changeFavor(run, PLOT.betrayFavor, 'you gave the Emperor the names he wanted');
  const purse = Math.round(PLOT.betrayGold * Math.min(run.topTier, CIRCUITS.length) * (isShort(run) ? SHORT.purse : 1));
  if (purse) {
    run.gold += purse;
    log(run, `A purse of ${purse} Gold arrives from the palace, with the Emperor's thanks.`, 'event');
  }
  const gift = PLOT.betrayRelic;
  if (gift && !hasRelic(run, gift)) {
    if (run.relics.length >= FORTUNE.maxRelics) {
      const rank = { common: 0, rare: 1, legendary: 2 };
      const drop = [...run.relics].sort((a, b) => (rank[RELICS[a]?.rarity] ?? 0) - (rank[RELICS[b]?.rarity] ?? 0))[0];
      if (drop) {
        run.relics = run.relics.filter((id) => id !== drop);
        log(run, `${RELICS[drop].name} is laid down to make room for the Emperor's gift.`, 'event');
      }
    }
    run.relics.push(gift);
    log(run, `With the purse comes a gift from the palace: ${RELICS[gift].name}. ${RELICS[gift].desc}`, 'event');
  }
  run.epilogue = [...(run.epilogue ?? []), victims.length ? `Executed on your word: ${victims.join(', ')}.` : 'You gave the Emperor names. He made sure they were the right ones.'];
  // 7.10/7.11: a callback to the cousin in the cells (handles living asker, steward ask, or lost asker). PLACEHOLDER.
  if (run.cousin?.done === 'saved' && victims.includes(run.cousin.name)) {
    const asker = run.cousin.asker ? findFighter(run, run.cousin.asker) : null;
    const watcher = asker ? ` ${asker.name}, who begged you for his life, watched from the barracks window.`
      : !run.cousin.asker ? ' The woman from the gate did not come back.' : '';
    run.epilogue.push(`${run.cousin.name} was among them: the cousin you once bought out of the cells.${watcher}`);
  }
  endPlot(run, 'loyalist');
}

export function resolveCoup(run, fighter, won, final, reason = null) {
  const p = run.plot;
  if (!won && (!final || fighter.id !== p.champion || reason === 'towel')) {
    postponeCoup(run);
    log(run, 'The signal is never given. The rebels melt back into the crowd, to wait for another day of games.', 'warn');
    return;
  }
  if (won && fighter.id === p.champion) {
    endPlot(run, 'coup');
    run.ending = 'coup';
    run.endReason = `${fighter.name} wins the Final, turns, and climbs into the imperial box. Silbannacus falls on the sand he filled with blood. The empire is yours to remake.`;
    const freed = p.freed.filter((c) => !c.caught).map((c) => c.name);
    if (freed.length) run.epilogue = [...(run.epilogue ?? []), `In the crowd, the people you freed were the first to cheer: ${freed.join(', ')}.`];
    // 7.10/7.11: a callback to the cousin in the cells (handles champion, fallen, or living cousin). PLACEHOLDER.
    if (run.cousin?.done === 'saved' && run.cousin.name) {
      const cousinDead = (run.fallen ?? []).some((x) => x.id === run.cousin.f || x.name === run.cousin.name);
      const line = fighter.id === run.cousin.f
        ? `${run.cousin.name}, the cousin you once bought out of the cells, was the one who climbed into the imperial box.`
        : cousinDead
          ? `When the crowd poured into the box, someone raised a cup to ${run.cousin.name}, the cousin you once bought out of the cells, who did not live to see it.`
          : `${run.cousin.name}, the cousin you once bought out of the cells, was the first over the rail of the imperial box.`;
      run.epilogue = [...(run.epilogue ?? []), line];
    }
    const spared = (run.spared ?? []).at(-1);
    if (spared) {
      run.epilogue = [...(run.epilogue ?? []), `Under the stands, ${spared.name}, whom you once spared on the sand, unlocked the tunnel gate and looked the other way.`];
    }
  } else if (won) {
    endPlot(run, 'cold');
    run.epilogue = [...(run.epilogue ?? []), 'The signal never came: the wrong fighter won the Final, and the moment passed. Somewhere, a chalk mark fades.'];
  } else {
    endPlot(run, 'martyr');
    run.status = 'lost';
    run.ending = 'martyr';
    run.endReason = `${fighter.name} falls in the Final, and the rising dies with them. The broken chain is scrubbed from every door, but the city remembers.`;
    run.fortune = null;
  }
}

export function risingProgress(run) {
  const p = run.plot;
  if (!maxLevel(run, 'gallery') || !p) return null;
  const s = PLOT.suspicion;
  const needs = [];
  if (p.stage === 'favours') {
    if (p.trust < PLOT.cause.trust) needs.push(`trust ${p.trust}/${PLOT.cause.trust}`);
    if ((p.favours ?? 0) < PLOT.cause.favours) needs.push(`favours ${p.favours ?? 0}/${PLOT.cause.favours}`);
    const weeks = PLOT.cause.weeks - (run.week - (p.markWeek ?? run.week));
    if (weeks > 0) needs.push(`${weeks} more week${weeks === 1 ? '' : 's'}`);
    if (run.prestigeLevel < PLOT.cause.houseLevel) needs.push(`House level ${PLOT.cause.houseLevel}`);
  } else if (p.stage === 'cause') {
    if (p.trust < PLOT.ready.trust) needs.push(`trust ${p.trust}/${PLOT.ready.trust}`);
    if (!isArmed(run)) needs.push('the barracks armed');
    if (!run.roster.some((f) => f.id === p.champion)) needs.push('a champion sworn');
  }
  const stage = p.ended ? 'ended' : p.stage;
  const label = { mark: 'watching you', favours: 'testing you with small favours', cause: 'gathering for the cause', ready: "ready: it waits for the Emperor's games (the Grand Tournament)", ended: 'over' }[stage] ?? stage;
  const waiting = !needs.length && (stage === 'favours' || stage === 'cause') ? "everything is in place: the next step comes at the month's turn, or with the cause's next message" : null;
  return { suspicion: Math.round(p.suspicion), prefect: prefectPosture(p.suspicion), watch: s.watch, informer: s.informer, raid: s.raid, stage, label, needs, waiting };
}
