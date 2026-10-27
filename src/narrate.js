// Turns structured round records from fight.js into readable lines. Pure: no DOM.

import { TRAITS, CLASSES, WEAPONS } from './data.js';

export function fmtPct(e5) {
  const p = e5 / 1000;
  return `${Number.isInteger(p) ? p : +p.toFixed(3)}%`;
}

export const signed = (n) => (n > 0 ? `+${n}` : `${n}`);

export function classAbility(f) {
  if (!f.cls) return null;
  return f.cls === 'fighter' && f.weapon ? WEAPONS[f.weapon].ability : CLASSES[f.cls].ability;
}

export function slotName(f, slot) {
  return slot === 'kind' ? TRAITS[f.kindTrait]?.name : classAbility(f);
}

// Modifier as a short label: Power mods are raw, percentage mods are ChanceE5.
export const modLabel = (mod, percent) => `${mod.source} ${percent ? signed(mod.value / 1000) + '%' : signed(mod.value)}`;

export function narrateRound(m, r) {
  const name = (side) => (side === 'A' ? m.a : m.b).f.name;
  const fighter = (side) => (side === 'A' ? m.a : m.b).f;
  const lines = [];
  const add = (type, text) => lines.push({ type, text });
  const init = r.initiative;

  if (init.reason === 'concussed') add('init', `${name(init.first === 'A' ? 'B' : 'A')} is Concussed, so ${name(init.first)} strikes first.`);
  else if (init.reason === 'footwork') add('init', `${name(init.first)}'s Footwork: faster, strikes first.`);
  else {
    const s = init.speed;
    const tie = init.reason === 'tiebreak' ? ' Tied; a coin flip decides.' : '';
    add('init', `Initiative: ${name('A')} ${s.A.total}+${init.rolls.A} vs ${name('B')} ${s.B.total}+${init.rolls.B}.${tie} ${name(init.first)} strikes first.`);
  }

  add('power', `Power ${r.power.A.total} vs ${r.power.B.total}: Delta ${signed(r.delta)}.`);
  add('chance', `${name('A')} wins this round ${fmtPct(r.win.chance)} of the time.`);
  add('roll', `Rolled ${fmtPct(r.roll)} against ${fmtPct(r.win.chance)}: ${name(r.winner)} takes Round ${r.round}.`);

  for (const c of r.checks) {
    const att = name(c.attacker);
    const def = name(c.defender);
    const prefix = c.counter ? `Elven Eyes! ${att} counters` : `${att} strikes at ${def}`;
    const pierce = c.pierced ? ' (armor pierced)' : '';
    add(c.hit ? 'hit' : 'miss', `${prefix}: ${fmtPct(c.chance)} to injure${pierce}, rolled ${fmtPct(c.roll)}. ${c.hit ? 'Hit!' : 'Miss.'}`);
    if (c.parry) add(c.parry.success ? 'parry' : 'hit', c.parry.success ? `${def} parries with the Sword! Riposte: +3 Speed next round.` : `${def}'s parry fails.`);
    const inj = c.injury;
    if (!inj) continue;
    const severity = inj.raw === inj.score ? `${inj.score}` : `${inj.raw}, capped at ${inj.score}`;
    if (inj.tag === 'death') {
      add('death', `${def} is slain! (severity ${severity})`);
      continue;
    }
    let text = `${def} suffers ${inj.name} (severity ${severity}).`;
    if (inj.doubled) text += ' The Boss debuff makes it count double.';
    if (inj.disabled?.length) text += ` Disabled: ${inj.disabled.map((s) => slotName(fighter(c.defender), s)).join(', ')}.`;
    add('injury', text);
  }

  for (const e of r.endEffects) add('effect', `${name(e.side)}: ${e.text} (${e.source}).`);
  return lines;
}

export function resultText(m) {
  const { winner, reason } = m.result;
  const you = m.a.f.name;
  const them = m.b.f.name;
  if (reason === 'towel') return `You threw in the towel. ${you} lives to fight another day.`;
  if (reason === 'death') return winner === 'A' ? `${them} died in the arena. ${you} wins.` : `${you} died in the arena.`;
  return winner === 'A' ? `${you} wins ${m.a.roundsWon}–${m.b.roundsWon}.` : `${you} loses ${m.a.roundsWon}–${m.b.roundsWon}.`;
}
