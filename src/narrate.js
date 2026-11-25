// Turns structured round records from fight.js into readable lines. Pure: no DOM.

import { TRAITS, CLASSES, WEAPONS, TACTICS, deltaRow } from './data.js';
import { styleId } from './fight.js';

export function fmtPct(e5) {
  const p = e5 / 1000;
  // LLM-12/13: the 99.999% cap minus whole bonuses printed "87.999%"; within 0.01 of a whole number, show the whole number.
  // Never 0% or 100%: the cap (99.999%) and the floor stay as they are, because no round is certain.
  const whole = Math.round(p);
  return `${Math.abs(p - whole) < 0.01 && whole > 0 && whole < 100 ? whole : +p.toFixed(3)}%`;
}

// A roll on a 1–100 scale, e.g. 5920 → "5.9", 55000 → "55".
export const roll100 = (e5) => `${+(e5 / 1000).toFixed(1)}`;

// Avoid contradictory "needs 50 or less, rolled 50. Miss." when a miss rounds to the same 1-decimal string.
function rollPair(chance, roll) {
  const c1 = roll100(chance);
  const r1 = roll100(roll);
  if (c1 !== r1 || roll <= chance) return [c1, r1];
  for (const digits of [2, 3]) {
    const cd = `${+(chance / 1000).toFixed(digits)}`;
    const rd = `${+(roll / 1000).toFixed(digits)}`;
    if (cd !== rd) return [cd, rd];
  }
  return [c1, r1];
}

export const signed = (n) => (n > 0 ? `+${n}` : `${n}`);

export function classAbility(f) {
  if (!f.cls) return null;
  return f.cls === 'fighter' && f.weapon ? WEAPONS[f.weapon].ability : CLASSES[f.cls].ability;
}

export function slotName(f, slot) {
  return slot === 'kind' ? TRAITS[f.kindTrait]?.name : classAbility(f);
}

const VERB = { steady: 'holds steady', press: 'Presses', guard: 'Guards', feint: 'Feints', allIn: 'goes All In' };
function tacticText(m, r) {
  if (!r.stances) return null;
  const name = (side) => (side === 'A' ? m.a : m.b).f.name;
  const aVerb = VERB[r.stances.A] ?? 'holds steady';
  const bVerb = VERB[r.stances.B] ?? 'holds steady';
  const otherSide = r.counter === 'A' ? 'B' : 'A';
  const counter = r.counter && TACTICS[r.stances[r.counter]] && TACTICS[r.stances[otherSide]]
    ? ` ${name(r.counter)} reads it: ${TACTICS[r.stances[r.counter]].name} beats ${TACTICS[r.stances[otherSide]].name}.`
    : '';
  return `${name('A')} ${aVerb}; ${name('B')} ${bVerb}.${counter}`;
}

export const modLabel = (mod, percent) => `${mod.source} ${percent ? signed(mod.value / 1000) + '%' : signed(mod.value)}`;

// What Blood Drinker can drain (src/fight.js), by tag.
const DRAINED = { fleshWound: 'Flesh Wound', bleeding: 'Bleeding wound', distracted: 'Distraction' };

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
  const [winNeed, winRoll] = rollPair(r.win.chance, r.roll);
  add('roll', `Round roll: ${name('A')} needs ${winNeed} or less, rolled ${winRoll}. ${name(r.winner)} takes Round ${r.round}.`);

  for (const c of r.checks) {
    const att = name(c.attacker);
    const def = name(c.defender);
    const prefix = c.counter ? `${c.label === 'Off-hand strike' ? 'Off-hand!' : 'Elven Eyes!'} ${att} counters` : `${att} strikes at ${def}`;
    if (c.allIn) {
      add('death', `All In: ${def} lost the round, and with it everything. ${def} falls.`);
      continue;
    }
    const pierce = c.pierced ? ' (armour pierced)' : '';
    const [need, rolled] = rollPair(c.chance, c.roll);
    add(c.hit ? 'hit' : 'miss', `${prefix}: needs ${need} or less to wound${pierce}, rolled ${rolled}. ${c.hit ? 'Hit!' : 'Miss.'}`);
    if (c.parry) add(c.parry.success ? 'parry' : 'hit', c.parry.success ? (c.parry.shield ? `${def} catches it on the shield! Shield Wall: +8% win chance next round.` : `${def} parries with the Sword! Riposte: +3 Speed and +5% win chance next round.`) : `${def}'s parry fails.`);
    const inj = c.injury;
    if (inj) {
      const severity = inj.raw === inj.score ? `${inj.score}` : `${inj.raw}, capped at ${inj.score}`;
      if (inj.tag === 'death') {
        add('death', `${def} is slain! (severity ${severity})`);
      } else {
        let text = `${def} suffers ${inj.name} (severity ${severity}).${inj.steered ? ` ${inj.steered.source} turned a ${inj.steered.from} into ${inj.name}.` : ''}${inj.deflected ? ` The ${inj.deflected} turned it into a Flesh Wound.` : ''}`;
        if (inj.doubled) text += ' The arena rule makes it count double.';
        if (inj.disabled?.length) text += ` Disabled: ${inj.disabled.map((s) => slotName(fighter(c.defender), s)).join(', ')}.`;
        add('injury', text);
      }
    }
    if (c.drained) add('effect', `${att} drinks deep: their own ${DRAINED[c.drained]} closes (Blood Drinker).`);
  }

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
  fleshWound: 'cut, a Flesh Wound',
  bleeding: 'Bleeding, and it will not stop',
  concussed: 'Concussed, the world spinning',
  poisoned: 'Poisoned (counts as two injuries!)',
  maimed: 'Maimed (counts as two injuries!)',
  senseless: 'beaten Senseless (counts as two injuries!)',
  blinded: 'Blinded (counts as two injuries!)',
};

const variant = (r, list, salt = 0) => list[(r.roll + r.round + salt) % list.length];

// 7.8 (review brief 2.9): how a blow lands, by the attacker's style (styleId: weapon for a Fighter, else class).
// PLACEHOLDER words for the designer (docs/text-to-rewrite.md).
const own = (n) => `${n}'${/s$/.test(n) ? '' : 's'}`;
const STRIKES = {
  club: (a, d) => [`${own(a)} club crashes through ${own(d)} guard`, `${a} swings the club two-handed and something in ${d} gives`],
  fists: (a, d) => [`${a} gets inside and hammers ${d}`, `${a} ducks a swing and buries a fist in ${own(d)} ribs`],
  bow: (a, d) => [`${own(a)} arrow finds ${d}`, `${a} looses before ${d} can close, and the shaft goes home`],
  spear: (a, d) => [`${own(a)} spear darts past ${own(d)} reach`, `${a} keeps ${d} at the end of the spear, then lunges`],
  sword: (a, d) => [`${own(a)} blade opens ${own(d)} guard`, `${a} feints high, cuts low, and ${d} is too slow`],
  flail: (a, d) => [`${own(a)} flail whips round ${own(d)} guard`, `the chain of ${own(a)} flail wraps ${own(d)} shield, and the head comes round after it`],
  gun: (a, d) => [`${own(a)} volley tears into ${d}`, `smoke, a crack like thunder, and ${d} staggers`],
  axe: (a, d) => [`${own(a)} axe bites deep into ${d}`, `${a} brings the axe down like a woodsman, and ${d} takes it`],
  dagger: (a, d) => [`${a} slips the dagger in under ${own(d)} arm`, `${a} is inside ${own(d)} guard before anyone sees the blade`],
  cestus: (a, d) => [`${own(a)} iron fists rock ${d}`, `${own(a)} studded glove snaps ${own(d)} head back`],
  sagittarius: (a, d) => [`${own(a)} shaft takes ${d} mid-stride`, `${a} draws, waits a heartbeat too long for comfort, and doesn't miss`],
  ornitharius: (a, d) => [`${own(a)} birds dive at ${d}`, `a storm of feathers and talons drives ${d} back, and ${a} follows it in`],
  retiarius: (a, d) => [`${own(a)} net drags ${d} down, and the trident follows`, `${a} casts, ${d} tangles, and the trident finds the gap`],
  ashHungry: (a, d) => [`${a} comes through the ash at ${d}`, `${a} breathes out cinders and hits ${d} like a falling wall`],
  bloodBearer: (a, d) => [`${own(a)} blade drinks from ${d}`, `${own(a)} red blade opens ${d}, and seems to sigh`],
  thornBlade: (a, d) => [`${own(a)} thorned edge rakes ${d}`, `${a} drags the thorned blade across ${d}, and it catches`],
  samnite: (a, d) => [`${a} drives the shield's rim into ${d}`, `${a} walks the big shield forward, then the short sword comes out from behind it`],
};
const strikeClause = (r, styleId, a, d) => {
  const lines = STRIKES[styleId]?.(a, d) ?? [`${a} lands a brutal blow`, `${a} breaks through`, `${a} catches ${d} cleanly`, `${a} finds a gap and makes ${d} pay for it`];
  const text = variant(r, lines, 2);
  return text.charAt(0).toUpperCase() + text.slice(1);
};

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
  else add('init', variant(r, [`${name(init.first)} strikes first.`, `${name(init.first)} is first off the mark.`, `${name(init.first)} gets there first.`, `${name(init.first)} moves before ${second} can.`], 1));

  const winnerChance = r.winner === 'A' ? r.win.chance : 100000 - r.win.chance;
  if (winnerChance < 40000) add('roll', `Against the odds, ${name(r.winner)} takes Round ${r.round}!`);
  else if (winnerChance >= 75000) add('roll', variant(r, [`${name(r.winner)} dominates Round ${r.round}.`, `${name(r.winner)} overpowers the opposition in Round ${r.round}.`, `Round ${r.round} is ${own(name(r.winner))} from the first exchange.`, `${name(r.winner)} makes Round ${r.round} look easy. The crowd notices.`]));
  else add('roll', variant(r, [`${name(r.winner)} edges out Round ${r.round}.`, `${name(r.winner)} wins a hard-fought Round ${r.round}.`, `${name(r.winner)} takes Round ${r.round}.`, `Round ${r.round} goes to ${name(r.winner)}, just.`, `${name(r.winner)} grinds out Round ${r.round}, breathing hard.`]));

  for (const c of r.checks) {
    const att = name(c.attacker);
    const def = name(c.defender);
    if (c.allIn) {
      add('death', `${def} gave everything, and it was not enough. ${def} falls and does not rise.`);
      continue;
    }
    if (c.counter && c.hit) add('hit', c.label === 'Off-hand strike' ? `${att}'s off-hand blade finds a gap!` : `${att}'s elven eyes spot an opening: a swift counter!`);
    if (c.parry?.success) add('parry', c.parry.shield ? `${def} catches ${att}'s blow on the shield!` : `${def} parries ${att}'s blow and ripostes!`);
    const inj = c.injury;
    if (inj) {
      if (inj.tag === 'death') {
        add('death', variant(r, [`${att} lands a killing blow. ${def} falls and does not rise.`, `${att} finds the opening. ${def} goes down and does not get up.`,
          `The crowd is on its feet: ${def} is dead before they hit the sand.`, `${att} ends it. ${def} lies still, and the arena goes quiet.`,
          `${def} takes one more step, then the sand has them. ${att} does not look back.`, `It is over in a breath. ${att} stands; ${def} never will again.`], 3));
      } else {
        let text = inj.deflected ? `${att} lands a crippling blow, but ${def}'s ${inj.deflected} takes it: only a Flesh Wound.` : `${strikeClause(r, styleId((c.attacker === 'A' ? m.a : m.b).f), att, def)}${inj.steered ? ` (${inj.steered.source})` : ''}: ${def} is ${INJURY_STORY[inj.tag]}.`;
        if (inj.doubled) text += ' First blood counts double!';
        if (inj.disabled?.length) text += ` ${def} loses ${inj.disabled.map((s) => slotName((c.defender === 'A' ? m.a : m.b).f, s)).join(' and ')} for this match.`;
        add('injury', text);
      }
    }
    if (c.drained) add('effect', `${att} drinks deep: their ${DRAINED[c.drained]} closes.`);
  }
  // A round where nobody draws blood still gets a line (7.8).
  if (!r.checks.some((c) => c.injury || c.parry?.success || (c.counter && c.hit) || c.allIn)) {
    add('quiet', variant(r, ['Neither draws blood. They walk back to their marks.', 'Steel rings on steel, and no one bleeds.', 'They part, both still standing, both still whole.', 'The crowd wants blood and gets sweat. Both fighters are still whole.', 'A long, careful exchange, and nothing to show for it but sand in the air.'], 4));
  }
  for (const e of r.endEffects) add('effect', `${name(e.side)} is ${e.text}.`);
  return lines;
}

// One concrete suggestion after a loss, based on what swung the match.
export function adviceFor(m) {
  if (m.result.winner === 'A') return null;
  const you = m.a.f.name;
  if (m.result.reason === 'death') {
    if (m.rounds.some((r) => r.checks?.some((c) => c.allIn && c.defender === 'A'))) {
      return `${you} went All In at the Death Gate and lost the round. Guarding or capitulating is safer when the Death Gate is open.`;
    }
    if (m.debuff === 'emperorsGaze') {
      return `${you} fell at the Death Gate under The Emperor's Gaze, where capitulating is forbidden. Guard at the Death Gate, or enter fully healed.`;
    }
    if (m.debuff === 'firstInjuryDouble' && m.rounds.length <= 1) {
      return `First Blood Counts Double opened the Death Gate on ${you}'s first wound. Bring armour, evasion, or Blessed Bandage against that rule.`;
    }
    return `${you} fought on with the Death Gate open. When the Death Gate is open, capitulating or healing first keeps fighters alive.`;
  }
  if (m.preMatch.some((p) => p.source === 'Overtrained')) return `${you} entered overtrained (−1 Power, one ability lost). Rest the week before a fight to keep Stress under 50.`;
  if (m.result.reason === 'towel') return 'You saved your fighter. Heal them in the Medbay before the next bout.';
  const chance = m.rounds.reduce((n, r) => n + (r.win?.chance ?? deltaRow(r.delta).win), 0) / Math.max(1, m.rounds.length);
  const worst = Math.min(...m.rounds.map((r) => r.delta));
  const avgDelta = m.rounds.reduce((n, r) => n + r.delta, 0) / Math.max(1, m.rounds.length);
  if (avgDelta >= 2) return `${you} was the stronger fighter (Delta +${Math.round(avgDelta)}) and lost anyway: favourites still lose now and then. Keep sending them, and read the tactics to tip the odds further.`;
  if (chance >= 60000) return `${you} was favoured in the rounds (about ${Math.round(chance / 1000)}% each) and lost anyway: the dice turned. Keep sending them.`;
  if (worst <= -2 && chance < 45000) return `${you} was out-powered (Delta ${worst}). Train Power, add Titles, or send a stronger fighter.`;
  if (m.rounds.some((r) => r.checks.some((c) => c.pierced && c.defender === 'A'))) return `Their weapon pierced your armour. Against Gun or Flail fighters, armour won't save you; win the rounds instead.`;
  return 'An even fight that went the other way. Small edges add up: training, decor and fighting rested.';
}
