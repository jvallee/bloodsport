// Turns structured round records from fight.js into readable lines. Pure: no DOM.

import { TRAITS, CLASSES, WEAPONS, TACTICS, deltaRow } from './data.js';

export function fmtPct(e5) {
  const p = e5 / 1000;
  return `${Number.isInteger(p) ? p : +p.toFixed(3)}%`;
}

// A roll on a 1–100 scale, e.g. 5920 → "5.9", 55000 → "55".
export const roll100 = (e5) => `${+(e5 / 1000).toFixed(1)}`;

export const signed = (n) => (n > 0 ? `+${n}` : `${n}`);

export function classAbility(f) {
  if (!f.cls) return null;
  return f.cls === 'fighter' && f.weapon ? WEAPONS[f.weapon].ability : CLASSES[f.cls].ability;
}

export function slotName(f, slot) {
  return slot === 'kind' ? TRAITS[f.kindTrait]?.name : classAbility(f);
}

// "Aurelia Presses; Tigris Guards. Tigris reads it: Guard beats Press." (both narration modes)
const VERB = { steady: 'holds steady', press: 'Presses', guard: 'Guards', feint: 'Feints' };
function tacticText(m, r) {
  if (!r.stances) return null;
  const name = (side) => (side === 'A' ? m.a : m.b).f.name;
  const counter = r.counter ? ` ${name(r.counter)} reads it: ${TACTICS[r.stances[r.counter]].name} beats ${TACTICS[r.stances[r.counter === 'A' ? 'B' : 'A']].name}.` : '';
  return `${name('A')} ${VERB[r.stances.A]}; ${name('B')} ${VERB[r.stances.B]}.${counter}`;
}

// Modifier as a short label: Power mods are raw, percentage mods are ChanceE5.
export const modLabel = (mod, percent) => `${mod.source} ${percent ? signed(mod.value / 1000) + '%' : signed(mod.value)}`;

export function narrateRound(m, r) {
  const name = (side) => (side === 'A' ? m.a : m.b).f.name;
  const fighter = (side) => (side === 'A' ? m.a : m.b).f;
  const lines = [];
  const add = (type, text) => lines.push({ type, text });
  const init = r.initiative;
  if (tacticText(m, r)) add('tactic', tacticText(m, r));
  for (const x of r.signatures ?? []) add('signature', `★ ${name(x.side)} unleashes ${x.name}!`);

  if (init.reason === 'concussed') add('init', `${name(init.first === 'A' ? 'B' : 'A')} is Concussed, so ${name(init.first)} strikes first.`);
  else if (init.reason === 'footwork') add('init', `${name(init.first)}'s Footwork: faster, strikes first.`);
  else {
    const s = init.speed;
    const tie = init.reason === 'tiebreak' ? ' Tied; a coin flip decides.' : '';
    add('init', `Initiative: ${name('A')} ${s.A.total}+${init.rolls.A} vs ${name('B')} ${s.B.total}+${init.rolls.B}.${tie} ${name(init.first)} strikes first.`);
  }

  add('power', `Power ${r.power.A.total} vs ${r.power.B.total}: Delta ${signed(r.delta)}.`);
  const bonuses = [...r.win.modsA.map((x) => `${x.source} ${signed(x.value / 1000)}% (${name('A')})`), ...r.win.modsB.map((x) => `${x.source} ${signed(x.value / 1000)}% (${name('B')})`)];
  add('chance', `${name('A')} wins this round ${fmtPct(r.win.chance)} of the time: ${fmtPct(r.win.base)} from the Delta${bonuses.length ? `. Win-chance bonuses: ${bonuses.join(', ')}` : ''}.`);
  add('roll', `Round roll: ${name('A')} needs ${roll100(r.win.chance)} or less, rolled ${roll100(r.roll)}. ${name(r.winner)} takes Round ${r.round}.`);

  for (const c of r.checks) {
    const att = name(c.attacker);
    const def = name(c.defender);
    const prefix = c.counter ? `${c.label === 'Off-hand strike' ? 'Off-hand!' : 'Elven Eyes!'} ${att} counters` : `${att} strikes at ${def}`;
    const pierce = c.pierced ? ' (armor pierced)' : '';
    add(c.hit ? 'hit' : 'miss', `${prefix}: needs ${roll100(c.chance)} or less to wound${pierce}, rolled ${roll100(c.roll)}. ${c.hit ? 'Hit!' : 'Miss.'}`);
    if (c.drained) add('effect', `${att} drinks deep: their own ${c.drained === 'fleshWound' ? 'Flesh Wound' : 'Distraction'} closes (Blood Drinker).`);
    if (c.parry) add(c.parry.success ? 'parry' : 'hit', c.parry.success ? (c.parry.shield ? `${def} catches it on the shield!` : `${def} parries with the Sword! Riposte: +3 Speed next round.`) : `${def}'s parry fails.`);
    const inj = c.injury;
    if (!inj) continue;
    const severity = inj.raw === inj.score ? `${inj.score}` : `${inj.raw}, capped at ${inj.score}`;
    if (inj.tag === 'death') {
      add('death', `${def} is slain! (severity ${severity})`);
      continue;
    }
    let text = `${def} suffers ${inj.name} (severity ${severity}).`;
    if (inj.doubled) text += ' The arena rule makes it count double.';
    if (inj.disabled?.length) text += ` Disabled: ${inj.disabled.map((s) => slotName(fighter(c.defender), s)).join(', ')}.`;
    add('injury', text);
  }

  // Effects one fighter inflicts on the other read "X is disarmed by Y's Fists"; self effects read "X: overclocked".
  const INFLICTED = ['Club', 'Fists', 'Thorn Lash', 'Net'];
  for (const e of r.endEffects) {
    const by = name(e.side === 'A' ? 'B' : 'A');
    add('effect', INFLICTED.includes(e.source) ? `${name(e.side)} is ${e.text} by ${by}'s ${e.source}.` : `${name(e.side)}: ${e.text} (${e.source}).`);
  }
  return lines;
}

export function resultText(m) {
  const { winner, reason } = m.result;
  const you = m.a.f.name;
  const them = m.b.f.name;
  if (reason === 'towel') return `You capitulated. ${you} lives to fight another day.`;
  if (reason === 'death') return winner === 'A' ? `${them} died in the arena. ${you} wins.` : `${you} died in the arena.`;
  return winner === 'A' ? `${you} wins ${m.a.roundsWon}–${m.b.roundsWon}.` : `${you} loses ${m.a.roundsWon}–${m.b.roundsWon}.`;
}

// ---------- Story mode: the drama, without the math ----------

const INJURY_STORY = {
  distracted: 'rattled and Distracted',
  fleshWound: 'bleeding from a Flesh Wound',
  concussed: 'Concussed, the world spinning',
  poisoned: 'Poisoned (it counts as two injuries!)',
  maimed: 'Maimed',
  senseless: 'beaten Senseless',
  blinded: 'Blinded',
};

const variant = (r, list) => list[(r.roll + r.round) % list.length];

export function narrateStory(m, r) {
  const name = (side) => (side === 'A' ? m.a : m.b).f.name;
  const lines = [];
  const add = (type, text) => lines.push({ type, text });
  const init = r.initiative;
  if (tacticText(m, r)) add('tactic', tacticText(m, r));
  for (const x of r.signatures ?? []) add('signature', `★ ${name(x.side)} unleashes ${x.name}!`);
  const second = name(init.first === 'A' ? 'B' : 'A');
  if (init.reason === 'concussed') add('init', `${second} is still dazed. ${name(init.first)} moves first.`);
  else if (init.reason === 'footwork') add('init', `${name(init.first)} darts in first on quick feet.`);
  else add('init', `${name(init.first)} strikes first.`);

  const winnerChance = r.winner === 'A' ? r.win.chance : 100000 - r.win.chance;
  if (winnerChance < 35000) add('roll', `Against the odds, ${name(r.winner)} takes Round ${r.round}!`);
  else if (winnerChance >= 75000) add('roll', variant(r, [`${name(r.winner)} dominates Round ${r.round}.`, `${name(r.winner)} overpowers the opposition in Round ${r.round}.`]));
  else add('roll', variant(r, [`${name(r.winner)} edges out Round ${r.round}.`, `${name(r.winner)} wins a hard-fought Round ${r.round}.`, `${name(r.winner)} takes Round ${r.round}.`]));

  for (const c of r.checks) {
    const att = name(c.attacker);
    const def = name(c.defender);
    if (c.counter && c.hit) add('hit', c.label === 'Off-hand strike' ? `${att}'s off-hand blade finds a gap!` : `${att}'s elven eyes spot an opening: a swift counter!`);
    if (c.parry?.success) add('parry', `${def} parries ${att}'s blow and ripostes!`);
    const inj = c.injury;
    if (!inj) continue;
    if (inj.tag === 'death') {
      add('death', `${att} lands a killing blow. ${def} falls and does not rise.`);
      continue;
    }
    let text = `${att} lands a brutal blow: ${def} is ${INJURY_STORY[inj.tag]}.`;
    if (inj.doubled) text += ' First blood counts double!';
    if (inj.disabled?.length) text += ` ${def} loses ${inj.disabled.map((s) => slotName((c.defender === 'A' ? m.a : m.b).f, s)).join(' and ')} for this match.`;
    add('injury', text);
  }
  for (const e of r.endEffects) add('effect', `${name(e.side)} is ${e.text}.`);
  return lines;
}

// One concrete suggestion after a loss, based on what swung the match.
export function adviceFor(m) {
  if (m.result.winner === 'A') return null;
  const you = m.a.f.name;
  if (m.result.reason === 'death') return `${you} fought on with the Death Gate open. When the Death Gate is open, capitulating or healing first keeps fighters alive.`;
  if (m.preMatch.some((p) => p.source === 'Overtrained')) return `${you} entered overtrained (−1 Power, one ability lost). Rest the week before a fight to keep Stress under 50.`;
  // Judge by the round chances actually faced (Speed, tactics and bonuses included), not the Power gap alone.
  const chance = m.rounds.reduce((n, r) => n + (r.win?.chance ?? deltaRow(r.delta).win), 0) / Math.max(1, m.rounds.length);
  const worst = Math.min(...m.rounds.map((r) => r.delta));
  const avgDelta = m.rounds.reduce((n, r) => n + r.delta, 0) / Math.max(1, m.rounds.length);
  if (m.result.reason === 'towel') return 'You saved your fighter. Heal them in the Medbay before the next bout.'; // capitulated: not "lost anyway"
  if (avgDelta >= 2) return `${you} was the stronger fighter (Delta +${Math.round(avgDelta)}) and lost anyway: favorites still lose now and then. Keep sending them, and read the tactics to tip the odds further.`;
  if (chance >= 60000) return `${you} was favored in the rounds (about ${Math.round(chance / 1000)}% each) and lost anyway: the dice turned. Keep sending them.`;
  if (worst <= -2 && chance < 45000) return `${you} was out-powered (Delta ${worst}). Train Power, add Titles, or send a stronger fighter.`;
  if (m.rounds.some((r) => r.checks.some((c) => c.pierced && c.defender === 'A'))) return `Their weapon pierced your armor. Against Gun or Flail fighters, armor won't save you; win the rounds instead.`;
  if (m.result.reason === 'towel') return 'You saved your fighter. Heal them in the Medbay before the next bout.';
  const avg = m.rounds.reduce((n, r) => n + r.delta, 0) / Math.max(1, m.rounds.length);
  if (avg >= 2) return `${you} was the stronger fighter (Delta +${Math.round(avg)}) and lost anyway: favorites still lose now and then. Keep sending them, and read the tactics to tip the odds further.`;
  return 'An even fight that went the other way. Small edges add up: training, decor and fighting rested.';
}
