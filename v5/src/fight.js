// 3-Round Power-Delta fight engine (design doc Tab 4 & 6, docs/fight-rules.md).
// Pure: no DOM. Each round returns a structured record; src/narrate.js turns it into text.

import { next, rollE5, d100, d6, pick, createRng } from './rng.js';
import { deltaRow, clampDelta, injuryForScore, INJURY_BY_TAG, INJURY_ROLL, EVASION, GEAR, MORALE, KILL_MARKS, TACTICS, COUNTERS, COUNTER, HUMORS, FESTIVAL_BY_ID, SCARS, AUGMENTS, MATCHUPS, SIGNATURES, SIGNATURE, UNDERDOG } from './data.js';
import { Refused } from './errors.js';

const sum = (mods) => mods.reduce((s, m) => s + m.value, 0);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const other = (side) => (side === 'A' ? 'B' : 'A');
export const FIRST_STRIKE = 10000;

export const effectiveInjuries = (f) => f.injuries.reduce((s, i) => s + i.weight, 0);
// Smelling Salts suppress a wound's effects for the rest of a fight (it still counts toward the Death Gate).
export const hasInjury = (f, tag) => f.injuries.some((i) => i.tag === tag && !i.suppressed);
const countInjury = (f, tag) => f.injuries.filter((i) => i.tag === tag && !i.suppressed).length;
export const hasPerk = (f, perk) => Boolean(f.perks?.includes(perk));
// Injuries at which losing a round can kill (Unbreakable holds out one longer).
// Unbreakable and Iron Will each hold it off one injury longer; lions in the arena bring it one closer.
export const deathGateAt = (f, arena = null) => 2 + (f.kindTrait === 'unbreakable' ? 1 : 0) + (f.perks?.includes('ironWill') ? 1 : 0) - (arena === 'lions' ? 1 : 0);
// A fighter's style for matchups: their weapon if a Fighter, otherwise their class.
export const styleId = (f) => (f.cls === 'fighter' ? f.weapon : f.cls);
// The matchups that favour c against opp (data.js MATCHUPS).
const MATCHUPS_BY_STYLE = MATCHUPS.reduce((map, x) => ({ ...map, [x.style]: [...(map[x.style] ?? []), x] }), {});
const NONE = [];
export function matchupsFor(c, opp) {
  const list = MATCHUPS_BY_STYLE[styleId(c.f)];
  if (!list) return NONE;
  const theirs = styleId(opp.f);
  const armored = Boolean(opp.f.gear?.armor);
  return list.filter((x) => x.vs.some((v) => v === theirs || (v === 'armor' && armored)));
}
export const killMarks = (f) => KILL_MARKS.filter((k) => (f.kills ?? 0) >= k.at);
const hasMark = (f, id) => (f.kills ?? 0) >= KILL_MARKS.find((k) => k.id === id).at;
export const gearOf = (f) => [f.gear?.weapon, f.gear?.armor].filter(Boolean).map((k) => GEAR[k]);

// `arena` is the Boss debuff affecting this fighter (see BOSS_DEBUFFS in data.js).
export function makeCombatant(fighter, side, arena = null) {
  return {
    side,
    arena,
    f: structuredClone(fighter),
    disabled: [], // 'kind' | 'class', for the rest of the match (Distracted, Maimed)
    classDisabledRound: null, // Fists disarm
    analyzed: 0, // Quantum Analyzer stacks
    overclockedRound: null, // Perpetual Motion Machine
    proneRound: null, // Club
    riposteRound: null, // Sword parry
    roundsWon: 0,
    firstInjuryTaken: false, // boss debuff
    stance: null, // this round's tactic (TACTICS); cleared after the round
    lastStance: null,
  };
}

function slotActive(c, slot, round) {
  if (c.disabled.includes(slot)) return false;
  return !(slot === 'class' && c.classDisabledRound === round);
}
export const kindActive = (c, trait, round) => c.f.kindTrait === trait && slotActive(c, 'kind', round);
export const classActive = (c, cls, round) => c.f.cls === cls && slotActive(c, 'class', round);
export const weaponActive = (c, weapon, round) => c.f.cls === 'fighter' && c.f.weapon === weapon && slotActive(c, 'class', round);

// Tactics and humors (roadmap v3 phase A).
const tacticOf = (c) => (c.stance ? TACTICS[c.stance] : null);
const humorOf = (c) => (c.f.humor ? HUMORS[c.f.humor] : null);
const beats = (stance) => Object.keys(COUNTERS).find((k) => COUNTERS[k] === stance); // the tactic that counters `stance`

// The tactic an opponent (side B) picks this round, from its humor. Uses the match RNG, so fights replay.
export function opponentTactic(m, round) {
  const h = humorOf(m.b);
  if (!h) return 'steady';
  if (h.adapts && round > 1 && m.a.lastStance && m.a.lastStance !== 'steady' && next(m.rng) * 100 < h.adapts) return beats(m.a.lastStance);
  let roll = next(m.rng) * 100;
  for (const [stance, weight] of Object.entries(h.leans)) {
    if ((roll -= weight) < 0) return stance;
  }
  return 'steady';
}

// What the opponent is likely to do this round, as { tactic: probability }.
export function opponentOdds(m) {
  const h = humorOf(m.b);
  if (!h) return { steady: 1 };
  const round = m.round + 1;
  const leans = Object.fromEntries(Object.entries(h.leans).map(([k, w]) => [k, w / 100]));
  if (h.adapts && round > 1 && m.a.lastStance && m.a.lastStance !== 'steady') {
    const p = h.adapts / 100;
    const out = Object.fromEntries(Object.entries(leans).map(([k, w]) => [k, w * (1 - p)]));
    out[beats(m.a.lastStance)] = (out[beats(m.a.lastStance)] ?? 0) + p;
    return out;
  }
  return leans;
}

// The tactic auto-play (and the careful bot) picks: Guard at the Death Gate; otherwise the best expected value
// against the opponent's habits (counters ±10%, the tactic's own effects with wounds at half weight, festival bonuses).
export function suggestTactic(m) {
  if (mortalDanger(m.a)) return 'guard';
  const round = m.round + 1;
  const fest = m.a.festival?.tactic ?? {};
  if (!humorOf(m.b)) return Object.keys(fest)[0] ?? 'steady'; // nothing to read: take the festival's favour, if any
  const odds = opponentOdds(m);
  const faster = computeSpeed(m.a, round).total - computeSpeed(m.b, round).total;
  const pFirst = faster > 2 ? 0.8 : faster < -2 ? 0.2 : 0.5;
  const value = (k) => {
    const t = TACTICS[k];
    let v = (t.win ?? 0) + 0.5 * (t.injure ?? 0) - 0.5 * (t.self ?? 0) + pFirst * (t.firstStrike ?? 0) + (fest[k] ?? 0);
    for (const [o, p] of Object.entries(odds)) {
      if (COUNTERS[k] === o) v += p * COUNTER.win;
      if (COUNTERS[o] === k) v -= p * COUNTER.win;
    }
    return v;
  };
  return Object.keys(TACTICS).reduce((best, k) => (value(k) > value(best) ? k : best), 'steady');
}

// Scars that apply against this opponent's style, and Battle-Hardened (always).
const styleOf = (c) => (meleeOnly(c) ? 'melee' : 'ranged');
function activeScars(c, opp) {
  return (c.f.scars ?? []).filter((sc) => !sc.vs || sc.vs === styleOf(opp)).map((sc) => ({ ...SCARS[sc.id], label: sc.vs ? `${SCARS[sc.id].name} (${sc.vs})` : SCARS[sc.id].name }));
}

// Iron Rules: decor gives no bonus.
const decorOf = (c, item) => (c.arena === 'ironRules' ? 0 : c.f.decor[item]);

const RANGED_WEAPONS = ['bow', 'gun', 'spear'];
export const meleeOnly = (c) => c.f.cls !== 'sagittarius' && !(c.f.cls === 'fighter' && RANGED_WEAPONS.includes(c.f.weapon));

// Step 1 — Speed and strike order.
export function computeSpeed(c, round) {
  const mods = [];
  if (round === 1 && weaponActive(c, 'spear', round)) mods.push({ source: 'Spear', value: 3 });
  if (c.proneRound === round) mods.push({ source: 'Prone', value: -2 });
  if (c.thornRound === round) mods.push({ source: 'Thorn Lash', value: -2 });
  if (c.netRound === round) mods.push({ source: 'Entangled', value: -3 });
  if (round === 1 && kindActive(c, 'pounce', round)) mods.push({ source: 'Pounce', value: 3 });
  if (c.riposteRound === round) mods.push({ source: 'Riposte', value: 3 });
  if (c.arena === 'rainyMud') mods.push({ source: 'Rainy Mud', value: -2 });
  for (const b of c.boosts ?? []) if (b.round === round && b.speed) mods.push({ source: b.name, value: b.speed });
  for (const g of gearOf(c.f)) if (g.speed) mods.push({ source: g.name, value: g.speed });
  if (tacticOf(c)?.speed) mods.push({ source: tacticOf(c).name, value: tacticOf(c).speed });
  if (humorOf(c)?.speed?.[round]) mods.push({ source: humorOf(c).name, value: humorOf(c).speed[round] });
  return { base: c.f.speed, mods, total: c.f.speed + sum(mods) };
}

export function initiative(A, B, round, rng) {
  const speed = { A: computeSpeed(A, round), B: computeSpeed(B, round) };
  // Samnite shield discipline: Concussed doesn't cost them the first strike.
  const concA = hasInjury(A.f, 'concussed') && !classActive(A, 'samnite', round);
  const concB = hasInjury(B.f, 'concussed') && !classActive(B, 'samnite', round);
  // Concussed (P:55) is resolved before Footwork (P:60) and overrides it.
  if (concA !== concB) return { first: concA ? 'B' : 'A', reason: 'concussed', speed };
  if (!concA) {
    for (const [c, mine, theirs] of [[A, speed.A, speed.B], [B, speed.B, speed.A]]) {
      if (kindActive(c, 'footwork', round) && mine.total > theirs.total) return { first: c.side, reason: 'footwork', speed };
    }
  }
  const rolls = { A: d6(rng), B: d6(rng) };
  const a = speed.A.total + rolls.A;
  const b = speed.B.total + rolls.B;
  if (a !== b) return { first: a > b ? 'A' : 'B', reason: 'roll', rolls, speed };
  return { first: next(rng) < 0.5 ? 'A' : 'B', reason: 'tiebreak', rolls, speed };
}

// Step 2 — Phase 1 Power. `raw` leaves out Underdog (it compares Power before itself).
export function computePower(c, opp, round, raw = false) {
  const f = c.f;
  const mods = [];
  if (kindActive(c, 'masochist', round)) {
    const n = effectiveInjuries(f);
    if (n) mods.push({ source: 'Masochist', value: n });
  }
  if (kindActive(c, 'firebug', round) && decorOf(c, 'fireBrazier')) mods.push({ source: 'Firebug', value: decorOf(c, 'fireBrazier') });
  if (weaponActive(c, 'bow', round) && round <= 2 && !hasInjury(f, 'blinded') && meleeOnly(opp)) mods.push({ source: 'Bow', value: 1 });
  if (kindActive(c, 'quantumAnalyzer', round) && c.analyzed) mods.push({ source: 'Quantum Analyzer', value: c.analyzed });
  const blinded = countInjury(f, 'blinded');
  if (blinded) mods.push({ source: 'Blinded', value: -2 * blinded });
  if (c.side === 'B' && c.arena === 'crowdFavorite') mods.push({ source: 'Crowd Favorite', value: 1 });
  if (c.overtrained) mods.push({ source: 'Overtrained', value: -1 });
  if (c.thornRound === round) mods.push({ source: 'Thorn Lash', value: -1 });
  if (c.scouted) mods.push({ source: 'Scouted', value: c.scouted });
  if (c.challenger) mods.push({ source: 'Challenger', value: c.challenger });
  if (c.grudge) mods.push({ source: c.grudge > 0 ? 'Feud' : 'Owes you a life', value: c.grudge });
  for (const b of c.boosts ?? []) if (b.round === round && b.power) mods.push({ source: b.name, value: b.power });
  for (const g of gearOf(f)) if (g.power) mods.push({ source: g.name, value: g.power });
  if (kindActive(c, 'bloodlust', round) && effectiveInjuries(opp.f) >= 1) mods.push({ source: 'Bloodlust', value: 1 });
  if (kindActive(c, 'nightborn', round) && round === 3) mods.push({ source: 'Nightborn', value: 1 });
  if (kindActive(c, 'rampage', round) && c.rampage) mods.push({ source: 'Rampage', value: c.rampage });
  if (classActive(c, 'ashHungry', round) && c.ash) mods.push({ source: 'Ash Stacks', value: c.ash });
  if (f.kind === 'basa' && decorOf(c, 'lionCage')) mods.push({ source: 'Lion Cage', value: 1 });
  if (humorOf(c)?.power?.[round]) mods.push({ source: humorOf(c).name, value: humorOf(c).power[round] });
  if (c.festival?.ranged && !meleeOnly(c)) mods.push({ source: c.festival.name, value: c.festival.ranged });
  for (const sc of activeScars(c, opp)) if (sc.power) mods.push({ source: sc.label, value: sc.power });
  for (const a of f.augments ?? []) if (AUGMENTS[a]?.power) mods.push({ source: AUGMENTS[a].name, value: AUGMENTS[a].power });
  if (!raw && kindActive(c, 'underdog', round) && computePower(opp, c, round, true).total >= f.power + sum(mods) + UNDERDOG.gap) mods.push({ source: 'Underdog', value: 2 });
  return { base: f.power, mods, total: f.power + sum(mods) };
}

// Step 3 — Phase 2 percentages. Evaluated again at each injury roll so mid-round injuries count.
// `self` mods change this fighter's chance to BE injured; `armor: true` ones are negated by Gun/Flail.
export function computePhase2(c, opp, round, volley = {}) {
  const f = c.f;
  const eff = effectiveInjuries(f);
  const blind = hasInjury(f, 'blinded');
  const win = [];
  const enemy = [];
  const self = [];
  if (classActive(c, 'cestus', round)) {
    win.push({ source: 'Progressive Overload', value: 3000 * round });
    enemy.push({ source: 'Progressive Overload', value: 5000 * round });
  }
  if (classActive(c, 'sagittarius', round) && !blind && volley[c.side]) {
    (volley[c.side] === 'win' ? win : enemy).push({ source: 'First Volley', value: 10000 });
  }
  if (classActive(c, 'ornitharius', round) && eff >= 1 && decorOf(c, 'bird')) enemy.push({ source: 'Birds of Prey', value: 5000 * decorOf(c, 'bird') });
  if (kindActive(c, 'hateful', round)) enemy.push({ source: 'Hateful', value: 10000 });
  if (kindActive(c, 'mesmerize', round) && round === 1) win.push({ source: 'Mesmerize', value: 5000 });
  if (kindActive(c, 'thickHide', round)) self.push({ source: 'Thick Hide', value: -10000, armor: true });
  if (classActive(c, 'ashHungry', round) && c.ash) enemy.push({ source: 'Ash Stacks', value: 5000 * c.ash });
  if (classActive(c, 'bloodBearer', round)) win.push({ source: 'Off-Hand', value: 5000 });
  for (const x of matchupsFor(c, opp)) {
    if (x.win) win.push({ source: `${x.why}`, value: x.win });
    if (x.injure) enemy.push({ source: `${x.why}`, value: x.injure });
  }
  if (kindActive(c, 'perpetualMotion', round) && c.overclockedRound === round) {
    win.push({ source: 'Overclocked', value: 10000 });
    self.push({ source: 'Overheating', value: 5000 });
  }
  if (c.proneRound === round) win.push({ source: 'Prone', value: -5000 });
  const gunActive = weaponActive(c, 'gun', round) && round % 2 === 1 && !blind;
  if (gunActive) enemy.push({ source: 'Armor-Piercing Volley', value: 15000 });
  if (kindActive(c, 'alloyedSkin', round)) self.push({ source: 'Alloyed Skin', value: -10000, armor: true });
  if (kindActive(c, 'egoArmour', round) && eff === 0) {
    win.push({ source: 'Ego Armour', value: 5000 });
    self.push({ source: 'Ego Armour', value: -10000, armor: true });
  }
  const fleshWounds = countInjury(f, 'fleshWound');
  if (fleshWounds) enemy.push({ source: 'Flesh Wound', value: -10000 * fleshWounds });
  if (hasInjury(f, 'senseless')) self.push({ source: 'Senseless', value: 10000 * eff });
  if (c.arena === 'bloodMoon') self.push({ source: 'Blood Moon', value: 10000 });
  for (const b of c.boosts ?? []) {
    if (b.round !== round) continue;
    if (b.guard) self.push({ source: b.name, value: -b.guard });
    if (b.win) win.push({ source: b.name, value: b.win });
    if (b.injure) enemy.push({ source: b.name, value: b.injure });
    if (b.self) self.push({ source: b.name, value: b.self });
  }
  // Gear.
  for (const g of gearOf(f)) {
    if (g.injure) enemy.push({ source: g.name, value: g.injure });
    if (g.guard) self.push({ source: g.name, value: -g.guard, armor: true });
    if (g.win) win.push({ source: g.name, value: g.win });
  }
  // Perks.
  if (hasPerk(f, 'thickSkin')) self.push({ source: 'Thick Skin', value: -5000 });
  if (hasPerk(f, 'juggernaut')) self.push({ source: 'Juggernaut', value: -5000 });
  if (hasPerk(f, 'killer')) enemy.push({ source: 'Killer Instinct', value: 5000 });
  if (hasPerk(f, 'bloodthirsty') && effectiveInjuries(opp.f) >= 1) enemy.push({ source: 'Bloodthirsty', value: 10000 });
  if (hasPerk(f, 'counterpuncher') && c.lostRound === round - 1) win.push({ source: 'Counterpuncher', value: 10000 });
  if (hasPerk(f, 'fastStart') && round === 1) win.push({ source: 'Fast Starter', value: 5000 });
  if (hasPerk(f, 'closer') && round === 3) win.push({ source: 'Closer', value: 5000 });
  if (hasPerk(f, 'survivor') && eff >= 1) self.push({ source: 'Survivor', value: eff >= 2 ? -20000 : -10000 });
  if (hasMark(f, 'dreaded')) win.push({ source: 'Dreaded', value: 5000 });
  if (hasMark(f, 'reaper')) enemy.push({ source: 'Reaper', value: 5000 });
  if (hasPerk(f, 'duelist')) {
    win.push({ source: 'Duelist', value: 5000 });
    enemy.push({ source: 'Duelist', value: 5000 });
  }
  // Tactics and humor.
  const t = tacticOf(c);
  if (t?.win) win.push({ source: t.name, value: t.win });
  if (t?.injure) enemy.push({ source: t.name, value: t.injure });
  if (t?.self) self.push({ source: t.name, value: t.self });
  if (c.stance && COUNTERS[c.stance] === opp.stance) win.push({ source: `Counter (${t.name} beats ${TACTICS[opp.stance].name})`, value: COUNTER.win });
  if (c.vengeance) win.push({ source: 'Vengeance', value: 5000 });
  for (const sc of activeScars(c, opp)) {
    if (sc.enemy) enemy.push({ source: sc.label, value: sc.enemy });
    if (sc.self) self.push({ source: sc.label, value: sc.self });
  }
  if (c.festival?.tactic?.[c.stance]) win.push({ source: c.festival.name, value: c.festival.tactic[c.stance] });
  const h = humorOf(c);
  if (h?.win?.[round]) win.push({ source: h.name, value: h.win[round] });
  if (h?.self) self.push({ source: h.name, value: h.self });
  // Morale: an inspired fighter fights better.
  if (f.morale >= MORALE.inspired) win.push({ source: 'Inspired', value: MORALE.inspiredWin });
  // Speed as evasion: faster fighters are harder to wound.
  const faster = computeSpeed(c, round).total - computeSpeed(opp, round).total;
  if (faster > 0) self.push({ source: 'Evasion', value: -Math.min(EVASION.max, EVASION.perPoint * faster) });
  const armorWorks = c.arena !== 'noArmor';
  const flail = weaponActive(c, 'flail', round);
  return { win, enemy, self: armorWorks ? self : self.filter((m) => !m.armor), piercing: gunActive || flail, ignoresParry: flail };
}

// Escalating Injury Table roll with the 2-Injury Death Gate.
export function injurySeverity(roll, priorInjuries, opponentAdvantage, defenderWonRound, gate = 2) {
  const raw = roll + INJURY_ROLL.perInjury * priorInjuries + INJURY_ROLL.perPowerGap * opponentAdvantage;
  const canDie = priorInjuries >= gate && !defenderWonRound;
  const score = canDie ? raw : Math.min(raw, 99);
  return { roll, raw, score, canDie, injury: injuryForScore(score) };
}

function disableRandom(c, n, rng) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const open = ['kind', 'class'].filter((s) => (s === 'kind' ? c.f.kindTrait : c.f.cls) && !c.disabled.includes(s));
    if (!open.length) break;
    const slot = pick(rng, open);
    c.disabled.push(slot);
    out.push(slot);
  }
  return out;
}

function inflictInjury(m, X, Y, r) {
  const prior = effectiveInjuries(Y.f);
  const advantage = Math.max(0, clampDelta(r.power[X.side].total - r.power[Y.side].total));
  const cleave = weaponActive(X, 'axe', r.round) ? 15 : 0; // Axe: wounds land harder
  const sev = injurySeverity(d100(m.rng) + cleave, prior, advantage, r.winner === Y.side, deathGateAt(Y.f, Y.arena));
  const result = { ...sev, tag: sev.injury.tag, name: sev.injury.name, advantage, prior };
  delete result.injury;
  if (result.tag === 'death') {
    Y.f.alive = false;
    return result;
  }
  // A cyborg eye can't be Blinded: the blow lands as a Flesh Wound.
  if (result.tag === 'blinded' && Y.f.augments?.includes('eye')) {
    Object.assign(result, { tag: 'fleshWound', name: 'Flesh Wound', deflected: 'Cyborg Eye' });
    sev.injury = INJURY_BY_TAG.fleshWound;
  }
  let weight = sev.injury.weight;
  if (Y.arena === 'firstInjuryDouble' && !Y.firstInjuryTaken) {
    weight += 1;
    result.doubled = true;
  }
  Y.firstInjuryTaken = true;
  Y.f.injuries.push({ tag: result.tag, weight });
  result.weight = weight;
  if (result.tag === 'distracted') {
    result.disabled = disableRandom(Y, 1, m.rng);
    Y.distracted = [...(Y.distracted ?? []), ...result.disabled]; // Smelling Salts can restore these
  }
  if (result.tag === 'maimed') result.disabled = disableRandom(Y, effectiveInjuries(Y.f), m.rng);
  return result;
}

// Roll 4B / 4C: X tries to injure Y. A counter (Elven Eyes) is a flat 15% check.
export function injuryCheck(m, X, Y, r, label, counter = false) {
  const round = r.round;
  const pX = computePhase2(X, Y, round, r.volley);
  const pY = computePhase2(Y, X, round, r.volley);
  let base = 15000;
  let mods = [];
  if (!counter) {
    base = r.winner === Y.side ? r.row.winnerInjury : r.row.loserInjury;
    mods = [
      ...pX.enemy.map((mod) => ({ ...mod, side: X.side })),
      ...pY.self.filter((mod) => !(mod.armor && pX.piercing)).map((mod) => ({ ...mod, side: Y.side })),
    ];
    if (weaponActive(X, 'dagger', round) && r.initiative.first === X.side) mods.push({ source: 'Backstab', value: 10000, side: X.side });
  }
  const chance = clamp(base + sum(mods), 0, 100000);
  const roll = rollE5(m.rng);
  const check = { label, attacker: X.side, defender: Y.side, base, mods, chance, roll, hit: roll <= chance, counter };
  if (pX.piercing && pY.self.some((mod) => mod.armor) && !counter) check.pierced = true;
  r.checks.push(check);
  if (check.hit) {
    if (weaponActive(Y, 'sword', round) && !pX.ignoresParry) {
      const parryRoll = rollE5(m.rng);
      check.parry = { roll: parryRoll, chance: 20000, success: parryRoll <= 20000 };
      if (check.parry.success) {
        Y.riposteRound = round + 1;
        return check;
      }
    } else if (classActive(Y, 'samnite', round) && !pX.ignoresParry) {
      const parryRoll = rollE5(m.rng);
      check.parry = { roll: parryRoll, chance: 20000, success: parryRoll <= 20000, shield: true };
      if (check.parry.success) return check;
    }
    check.injury = inflictInjury(m, X, Y, r);
    if (check.injury.tag !== 'death') {
      if (classActive(X, 'ashHungry', round)) X.ash = (X.ash ?? 0) + 1;
      // Blood Drinker: drinking the opponent's blood closes this fighter's newest light wound from this fight.
      if (kindActive(X, 'bloodDrinker', round)) {
        const i = X.f.injuries.findLastIndex((inj) => inj.weeksLeft === undefined && ['fleshWound', 'distracted'].includes(inj.tag));
        if (i >= 0) check.drained = X.f.injuries.splice(i, 1)[0].tag;
      }
    }
  } else if (!counter && roll - chance >= 50000 && kindActive(Y, 'elvenEyes', round)) {
    injuryCheck(m, Y, X, r, 'Elven Eyes counter', true);
  }
  return check;
}

// Debuffs hit your fighter (A); Blood Moon hits both; Crowd Favorite boosts the opponent (B).
const BOTH_SIDES = ['bloodMoon', 'crowdFavorite', 'lions', 'emperorsGaze'];

export function createMatch({ a, b, rng, debuff = null, overtrained = false, scouted = 0, challenger = 0, festival = null, grudge = 0, vengeance = false, boss = false, earlyRound = false }) {
  const m = {
    a: makeCombatant(a, 'A', debuff),
    b: makeCombatant(b, 'B', BOTH_SIDES.includes(debuff) ? debuff : null),
    rng, debuff, boss, earlyRound, round: 0, rounds: [], over: false, result: null, preMatch: [],
  };
  // A Gods' Day favours a style, for both fighters.
  if (festival) {
    m.festival = festival;
    m.a.festival = m.b.festival = FESTIVAL_BY_ID[festival];
  }
  // Feuds between houses: theirs fights you harder after you killed one of them; yours fights for vengeance.
  if (grudge) m.b.grudge = grudge;
  if (vengeance) m.a.vengeance = true;
  // Scouted: opponents who have studied your fighter fight them with extra Power.
  if (scouted) m.b.scouted = scouted;
  // Challenger: famous fighters draw tougher opponents in your top arena.
  if (challenger) m.b.challenger = challenger;
  // Stress: an overtrained fighter loses one random ability and fights at −1 Power.
  if (overtrained) {
    m.a.overtrained = true;
    m.preMatch.push({ side: 'A', source: 'Overtrained', disabled: disableRandom(m.a, 1, rng) });
  }
  return m;
}

const sideOf = (m, side) => (side === 'A' ? m.a : m.b);

export function applyRoundEnd(m, r) {
  const W = sideOf(m, r.winner);
  const L = sideOf(m, other(r.winner));
  const round = r.round;
  const effects = [];
  if (weaponActive(W, 'club', round)) {
    L.proneRound = round + 1;
    effects.push({ source: 'Club', side: L.side, text: 'knocked Prone' });
  }
  if (classActive(W, 'retiarius', round)) {
    L.netRound = round + 1;
    effects.push({ source: 'Net', side: L.side, text: 'entangled (−3 Speed next round)' });
  }
  if (kindActive(W, 'rampage', round)) {
    W.rampage = (W.rampage ?? 0) + 1;
    effects.push({ source: 'Rampage', side: W.side, text: `rampaging (+${W.rampage} Power)` });
  }
  L.lostRound = round; // Counterpuncher
  if (classActive(W, 'thornBlade', round)) {
    L.thornRound = round + 1;
    effects.push({ source: 'Thorn Lash', side: L.side, text: 'lashed (−2 Speed, −1 Power next round)' });
  }
  if (weaponActive(W, 'fists', round)) {
    L.classDisabledRound = round + 1;
    effects.push({ source: 'Fists', side: L.side, text: 'disarmed' });
  }
  if (kindActive(W, 'perpetualMotion', round)) {
    W.overclockedRound = round + 1;
    effects.push({ source: 'Perpetual Motion Machine', side: W.side, text: 'overclocked' });
  }
  if (kindActive(L, 'quantumAnalyzer', round)) {
    L.analyzed += 1;
    effects.push({ source: 'Quantum Analyzer', side: L.side, text: `analyzing (+${L.analyzed} Power)` });
  }
  r.endEffects = effects;
}

// ---------- Signature moves (level 3+, once per fight, for one round) ----------

export const signatureOf = (f) => ((f.level ?? 1) >= SIGNATURE.level ? SIGNATURES[f.cls] ?? null : null);

export function signatureBlocker(m) {
  if (!m || m.over) return 'Signature moves are used during a match.';
  const sig = signatureOf(m.a.f);
  if (!sig) return SIGNATURES[m.a.f.cls] ? `Signature moves unlock at level ${SIGNATURE.level}.` : 'This fighter has no signature move.';
  if (m.a.sigRound) return `${sig.name} has already been used this fight.`;
  return null;
}

function applySignature(c, opp, round) {
  const sig = SIGNATURES[c.f.cls];
  c.sigRound = round;
  if (sig.boost) c.boosts = [...(c.boosts ?? []), { ...sig.boost, name: sig.name, round }];
  if (sig.foe) opp.boosts = [...(opp.boosts ?? []), { ...sig.foe, name: sig.name, round }];
  if (sig.ash) c.ash = (c.ash ?? 0) + sig.ash;
}

// Your fighter unleashes their signature move in the next round.
export function useSignature(m) {
  const why = signatureBlocker(m);
  if (why) throw new Refused(why);
  applySignature(m.a, m.b, m.round + 1);
}

// Seasoned opponents keep theirs for when it counts: once they fall behind, or in Round 3.
// Outside Boss tournaments, regulars save theirs for the Final (`earlyRound`: a bracket's Quarter- or Semi-final).
export const opponentHasSignature = (f, boss = false, earlyRound = false) => Boolean(SIGNATURES[f.cls]) && (boss ? (f.level ?? 1) >= SIGNATURE.bossLevel : !earlyRound && (f.level ?? 1) >= SIGNATURE.opponentLevel);
const opponentUnleashes = (m, round) => opponentHasSignature(m.b.f, m.boss, m.earlyRound) && !m.b.sigRound && (m.b.roundsWon < m.a.roundsWon || round === 3);

export function playRound(m, { stance = 'steady' } = {}) {
  if (m.over) throw new Error('The match is over.');
  const round = (m.round += 1);
  const { a: A, b: B, rng } = m;
  const r = { round, checks: [], endEffects: [] };
  if (opponentUnleashes(m, round)) applySignature(B, A, round);
  r.signatures = [A, B].filter((c) => c.sigRound === round).map((c) => ({ side: c.side, name: SIGNATURES[c.f.cls].name }));

  // Step 0 — tactics: yours as chosen, the opponent's from its humor.
  A.stance = TACTICS[stance] ? stance : 'steady';
  B.stance = opponentTactic(m, round);
  r.stances = { A: A.stance, B: B.stance };
  r.counter = COUNTERS[A.stance] === B.stance ? 'A' : COUNTERS[B.stance] === A.stance ? 'B' : null;

  // Step 1 — strike order.
  r.initiative = initiative(A, B, round, rng);
  const first = sideOf(m, r.initiative.first);
  const second = sideOf(m, other(r.initiative.first));

  // Step 2 — Power and Delta.
  r.power = { A: computePower(A, B, round), B: computePower(B, A, round) };
  r.row = deltaRow(r.power.A.total - r.power.B.total);
  r.delta = r.row.delta;

  // Step 3 — percentage modifiers. Sagittarius flips its coin once per round.
  r.volley = {};
  for (const c of [A, B]) {
    if (classActive(c, 'sagittarius', round) && !hasInjury(c.f, 'blinded')) r.volley[c.side] = next(rng) < 0.5 ? 'win' : 'injury';
  }
  const p2 = { A: computePhase2(A, B, round, r.volley), B: computePhase2(B, A, round, r.volley) };
  // First Strike: striking first is worth +10% to win the round (+15% with the Tactician perk).
  const firstStriker = sideOf(m, r.initiative.first).f;
  p2[r.initiative.first].win.push({ source: 'First Strike', value: FIRST_STRIKE + (hasPerk(firstStriker, 'tactician') ? 5000 : 0) });
  // Feint pays off only for the side that strikes first (so it rewards Speed).
  const firstSide = sideOf(m, r.initiative.first);
  if (tacticOf(firstSide)?.firstStrike) p2[r.initiative.first].win.push({ source: tacticOf(firstSide).name, value: tacticOf(firstSide).firstStrike });
  r.win = { base: r.row.win, modsA: p2.A.win, modsB: p2.B.win };
  r.win.chance = clamp(r.row.win + sum(p2.A.win) - sum(p2.B.win), 1, 99999);

  // Roll 4A — round winner.
  r.roll = rollE5(rng);
  r.winner = r.roll <= r.win.chance ? 'A' : 'B';

  // Roll 4B — first striker; Roll 4C — retaliation if both still stand.
  injuryCheck(m, first, second, r, 'First strike');
  if (first.f.alive && second.f.alive) injuryCheck(m, second, first, r, 'Retaliation');
  // Blood-Bearer: losing the round, the off-hand blade strikes back (a flat 15% check).
  const loser = sideOf(m, other(r.winner));
  if (A.f.alive && B.f.alive && classActive(loser, 'bloodBearer', round)) injuryCheck(m, loser, sideOf(m, r.winner), r, 'Off-hand strike', true);

  sideOf(m, r.winner).roundsWon += 1;
  m.rounds.push(r);
  for (const c of [A, B]) {
    c.lastStance = c.stance;
    c.stance = null;
  }

  // Step 5 — round end and match result.
  const dead = [A, B].find((c) => !c.f.alive);
  if (dead) {
    r.death = dead.side;
    m.over = true;
    m.result = { winner: other(dead.side), reason: 'death' };
  } else if (A.roundsWon === 2 || B.roundsWon === 2) {
    r.endEffects = []; // the match is decided: no "next round" effects
    m.over = true;
    m.result = { winner: A.roundsWon === 2 ? 'A' : 'B', reason: 'rounds' };
  } else {
    applyRoundEnd(m, r);
  }
  return r;
}

// The chance your fighter dies in the next round if you fight on: the round simulated on copies of the match
// with its own dice (the real fight's dice are untouched).
export function deathRisk(m, stance = 'steady', n = 400) {
  if (m.over || !mortalDanger(m.a)) return 0;
  const { rng, ...rest } = m;
  const base = structuredClone(rest);
  const dice = createRng(9000 + m.round);
  let deaths = 0;
  for (let i = 0; i < n; i++) {
    const copy = { ...structuredClone(base), rng: dice };
    playRound(copy, { stance });
    if (!copy.a.f.alive) deaths++;
  }
  return deaths / n;
}

export const canThrowTowel = (m) => !m.over && m.round >= 1 && m.debuff !== 'emperorsGaze';
export const mortalDanger = (c) => c.f.alive && effectiveInjuries(c.f) >= deathGateAt(c.f, c.arena);

export function throwTowel(m) {
  if (!canThrowTowel(m)) throw new Error('You can only capitulate between rounds.');
  m.over = true;
  m.result = { winner: 'B', reason: 'towel' };
}

// Plays a whole match without capitulate decisions (simulator and tests). `tactic(m)` picks your tactic each round.
export function autoPlay(m, tactic = () => 'steady') {
  while (!m.over) playRound(m, { stance: tactic(m) });
  return m.result;
}
