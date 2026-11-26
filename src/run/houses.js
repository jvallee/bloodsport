// L1b rival houses, arenas, brackets, opponents, nemeses, archrival, bonds, Patron Lounge, and Emperor's demands.

import { createRng, deriveSeed, int, next, pick } from '../rng.js';
import {
  ECONOMY, STRESS, CIRCUITS, GRAND, STAGES, PERKS, GEAR, HOUSES, BRACKET, NEMESIS, SHORT, DEMAND, DEMANDS,
  BOND, LOUNGE, RIVAL, SUMMONS, DECREES, FAVOR_DEBT, HOUSE_DEBT,
} from '../data.js';
import { relicFight } from '../fortune.js';
import { coupBonus } from '../plot.js';
import { RIVAL_LINES, BOND_LINES } from '../quests.js';
import { createMatch, computePower } from '../fight.js';
import { MOOD_WEEKS } from '../events.js';
import { festivalOn, weeksUntilTournament, isWinter } from '../calendar.js';
import { maxLevel, effectAt, oracleLevel } from '../ludus.js';
import {
  GRAND_TIER, DEBUFF_IDS, COMBAT_PERKS, createFighter, newId, remember, takenNames, log, chronicle,
  monthOf, talk, assertOk, effectivePower, unlockedTiers, arenaName, isShort, hasDecree, lionsPower,
  hasPolicy, idleBlocker, nextStage, changeFavor, gainXp, queueMilestone,
} from './helpers.js';
import { plotActive, changeSuspicion } from './plotEngine.js';

// ---------- Rival houses ----------

export function makeHouses(rng) {
  const pool = [...HOUSES.names];
  return Array.from({ length: HOUSES.rivals }, (_, i) => {
    const h = pool.splice(int(rng, 0, pool.length - 1), 1)[0];
    return { id: `h${i + 1}`, ...h, glory: int(rng, 0, 4), tier: 1, feud: 0, vengeance: 0 };
  });
}

export const houseOf = (run, f) => run.houses?.find((h) => h.id === f?.house) ?? null;
export const houseTier = (h) => 1 + HOUSES.climb.filter((g) => h.glory >= g).length;
const leadingHouse = (run) => [...run.houses].sort((a, b) => b.glory - a.glory)[0];

export function houseForArena(run, tier, rng = run.rng.houses) {
  if (tier === GRAND_TIER) return leadingHouse(run);
  const there = run.houses.filter((h) => h.tier >= tier);
  if (there.some((h) => h.id === run.archrival)) {
    const others = there.filter((h) => h.id !== run.archrival);
    const pool = others.length ? others : run.houses.filter((h) => h.id !== run.archrival);
    if (!pool.length) return archrival(run);
    return next(rng) < RIVAL.oppShare ? archrival(run) : pick(rng, pool);
  }
  return there.length ? pick(rng, there) : leadingHouse(run);
}

export function standings(run) {
  const rows = [{ name: 'Your house', glory: run.glory ?? 0, tier: run.topTier, you: true, color: '#d9b45a' }, ...(run.houses ?? []).map((h) => ({ ...h, you: false }))];
  return rows.sort((a, b) => b.glory - a.glory || (a.you ? -1 : 1));
}

export function debtPenaltyFor(house) {
  if (!house?.debt || !(house.debt.owed > 0)) return null;
  const months = Math.max(0, house.debt.monthsUnpaid ?? 0);
  const idx = Math.min(HOUSE_DEBT.tiers.length - 1, months);
  return { ...HOUSE_DEBT.tiers[idx], months, owed: house.debt.owed, houseName: house.name };
}

export function rivalsCompete(run) {
  const r = run.rng.houses;
  const arch = archrival(run);
  for (const h of run.houses) {
    if (next(r) < 0.5) h.glory += HOUSES.glory.win * h.tier;
    if (h === arch) h.glory += RIVAL.monthGlory * h.tier;
    if (h.debt && h.debt.owed > 0 && run.week - (h.debt.sinceWeek ?? 0) >= 4) {
      h.debt.monthsUnpaid = (h.debt.monthsUnpaid ?? 0) + 1;
      const cap = Math.round(h.debt.principal * HOUSE_DEBT.maxOwedMultiplier);
      const interest = HOUSE_DEBT.monthlyInterestPerTier * Math.min(run.topTier, CIRCUITS.length);
      h.debt.owed = Math.min(cap, h.debt.owed + interest);
      h.glory += HOUSE_DEBT.monthlyGlory;
      const pen = debtPenaltyFor(h);
      log(run, `Unpaid debt to ${h.name} (${h.debt.monthsUnpaid} mo, ${h.debt.owed} Gold owed): their fighters now get +${pen.power} Power and +${pen.win / 1000}% win chance against you.`, 'warn');
    }
    h.tier = h === arch ? Math.max(houseTier(h), Math.min(run.topTier, CIRCUITS.length)) : houseTier(h);
    if (h.since === run.week - 1) continue;
    h.feud = Math.max(0, h.feud - 1);
    h.vengeance = Math.max(0, h.vengeance - 1);
    h.owed = Math.max(0, (h.owed ?? 0) - 1);
  }
}

// ---------- Arenas, bouts, brackets, opponents ----------

export function arenaPower(run, tier, stage = 2) {
  if (tier === GRAND_TIER) return GRAND.oppPower + (hasDecree(run, 'ironBosses') ? DECREES.ironBosses.power : 0) + lionsPower(run) + (isShort(run) ? SHORT.grandPower : 0);
  return CIRCUITS[tier - 1].oppPower[stage] + lionsPower(run) + (isShort(run) ? SHORT.oppPower[tier - 1] ?? 0 : 0)
    + (stage === 2 && hasDecree(run, 'ironBosses') ? DECREES.ironBosses.power : 0) + (stage === 2 && hasPolicy(run, 'unleashLions') ? 1 : 0);
}

export const summonsPower = (run) => arenaPower(run, SUMMONS.tier, 0);

export function boutFor(run, tier = run.topTier) {
  const top = tier === run.topTier;
  const below = run.topTier - tier;
  const arena = run.arenas[tier];
  if (tier === GRAND_TIER) {
    return { tier, top, below: 0, name: GRAND.name, stage: 3, boss: true, buyIn: GRAND.buyIn, winGold: GRAND.winGold, winPrestige: GRAND.winPrestige, lossGold: GRAND.lossGold, oppPower: arenaPower(run, GRAND_TIER), oppDecor: GRAND.oppDecor, debuff: arena.debuff, conquered: false };
  }
  const c = CIRCUITS[tier - 1];
  const s = arena.stage;
  const from = run.bouts && run.bouts[tier] !== 'open' ? run.week + 1 : run.week;
  const fest = festivalOn(from + weeksUntilTournament(from));
  const pauper = tier === 1 && run.prestige < c.buyIn[s];
  return {
    tier, top, below,
    name: `${c.name} · ${STAGES[s]}`, stage: s, boss: s === 2,
    buyIn: fest?.freeEntry ? 0 : pauper ? Math.max(0, run.prestige) : c.buyIn[s], fullBuyIn: c.buyIn[s], pauper: pauper && !fest?.freeEntry,
    winGold: Math.round(Math.max(Math.ceil(c.winGold[s] * ECONOMY.lowerArenaGold ** below), c.lossGold + ECONOMY.lowerWinOverLoss) * (fest?.gold ?? 1) * (isShort(run) ? SHORT.purse : 1) * (hasPolicy(run, 'breadAndCircuses') ? 1.25 : 1)),
    winPrestige: Math.round(Math.max(below ? ECONOMY.lowerArenaMinPrestige : 0, Math.floor(c.winPrestige[s] * ECONOMY.lowerArenaPrestige ** below)) * (fest?.prestige ?? 1) * (isShort(run) ? SHORT.prestige : 1) * (s === 2 && hasPolicy(run, 'unleashLions') ? 2 : 1)),
    festival: fest?.id ?? null,
    lossGold: c.lossGold, oppPower: arenaPower(run, tier, s), oppDecor: c.oppDecor, debuff: s === 2 && tier > 1 ? arena.debuff : null,
    conquered: arena.conquered,
  };
}

export const currentBout = (run) => boutFor(run, run.topTier);

export function upcomingBouts(run) {
  const tier = run.topTier;
  const out = [];
  let week = run.week;
  if (!(run.bouts && run.boutPending)) week += run.bouts ? 1 : 0;
  let stage = tier === GRAND_TIER ? 2 : run.arenas[tier].stage;
  while (out.length < 4) {
    week += weeksUntilTournament(week);
    out.push({ week, weeks: week - run.week, stage: tier === GRAND_TIER ? 'Grand Tournament' : STAGES[stage], boss: stage === 2, festival: festivalOn(week)?.name ?? null });
    if (stage === 2) break;
    stage = isShort(run) ? 2 : stage + 1;
    week += 1;
  }
  return out;
}

export const hasBracket = (tier) => tier >= BRACKET.fromTier;

export function drawBrackets(run) {
  for (const t of Object.keys(run.bouts ?? {})) bracketFor(run, Number(t));
}

export function bracketFor(run, tier) {
  if (!hasBracket(tier) || !run.bouts?.[tier]) return null;
  run.brackets ??= {};
  if (!run.brackets[tier]) {
    const bout = boutFor(run, tier);
    const foes = [];
    const champ = run.arenas[tier].opponent?.rivalChampion ? run.arenas[tier].opponent : null;
    const finalPower = effectivePower(run.arenas[tier].opponent) - (champ?.rivalBonus ?? 0);
    for (const d of BRACKET.power.slice(0, 2)) {
      const f = createFighter(run.rng.opponents, { id: newId(run, 'o'), power: bout.oppPower + d, decorLevel: bout.oppDecor, takenNames: takenNames(run, foes), classes: run.setup?.classes });
      f.speed = opponentSpeed(run, { ...bout, boss: false });
      seasonOpponent(run, f, { ...bout, boss: false });
      f.power -= effectivePower(f) - (finalPower + d);
      f.house = houseForArena(run, tier).id;
      foes.push(f);
    }
    const k = champ ? int(rivalsRng(run), 0, 2) : 2;
    if (k < 2) {
      const f = foes[k];
      foes[k] = champ;
      if (!RIVAL.earlyAtFinal) champ.power += effectivePower(f) + champ.rivalBonus - effectivePower(champ);
      f.power += finalPower - effectivePower(f);
      run.arenas[tier].opponent = f;
    }
    remember(run, ...foes);
    run.brackets[tier] = { foes, round: 0, fighterId: null, buyIn: 0 };
  }
  return run.brackets[tier];
}

export function crushingGapFor(run, tier) {
  if (!hasBracket(tier) || !run.bouts?.[tier]) return ECONOMY.crushingGap;
  return (bracketOf(run, tier)?.round ?? 0) < 2 ? Infinity : ECONOMY.bracketCrushingGap;
}

export const bracketOf = (run, tier) => (hasBracket(tier) && run.bouts?.[tier] ? run.brackets?.[tier] ?? null : null);
export const bracketRound = (run, tier) => BRACKET.rounds[bracketOf(run, tier)?.round ?? 0];

export function bracketView(run, tier) {
  const b = bracketOf(run, tier);
  if (!b) return null;
  const foes = [...b.foes, run.arenas[tier].opponent];
  return { round: b.round, rounds: BRACKET.rounds.map((label, i) => ({ label, name: foes[i].name, power: effectivePower(foes[i]) })) };
}

export function bracketInfo(run, tier) {
  if (!hasBracket(tier)) return null;
  const b = bracketOf(run, tier);
  const open = Boolean(b && run.bouts?.[tier] === 'open');
  const round = b?.round ?? 0;
  const finalOpponent = run.arenas[tier]?.opponent ?? null;
  const earlyPurse = BRACKET.purse * Math.min(tier, CIRCUITS.length);
  const earlyPrestige = BRACKET.prestigeTopOnly && tier !== run.topTier ? 0 : BRACKET.prestige;
  const bout = boutFor(run, tier);
  const foes = b ? [...b.foes, finalOpponent] : [null, null, finalOpponent];
  const rounds = BRACKET.rounds.map((label, index) => {
    const opponent = foes[index] ?? null;
    return {
      index,
      label,
      opponent,
      power: opponent ? effectivePower(opponent) : null,
      gold: index < 2 ? earlyPurse : bout.winGold,
      prestige: index < 2 ? earlyPrestige : bout.winPrestige,
    };
  });
  return {
    tier,
    open,
    round,
    fighterId: b?.fighterId ?? null,
    earlyPurse,
    earlyPrestige,
    rounds,
    nextOpponent: opponentFor(run, tier),
    finalOpponent,
  };
}

export function opponentFor(run, tier = run.topTier) {
  const b = run.bouts?.[tier] === 'open' ? bracketOf(run, tier) : null;
  return b && b.round < 2 ? b.foes[b.round] : run.arenas[tier].opponent;
}

export const opponentSpeed = (run, bout = currentBout(run)) => 3 + Math.min(bout.tier, CIRCUITS.length) - 1 + (bout.boss ? 1 : 0);

export function seasonOpponent(run, f, bout, rng = run.rng.opponents) {
  const t = Math.min(bout.tier, CIRCUITS.length);
  const perkCount = t - 1 + (bout.boss ? 1 : 0);
  const pool = COMBAT_PERKS.filter((p) => !PERKS[p].req || PERKS[p].req({ ...f, level: 5 }));
  for (let i = 0; i < perkCount && pool.length; i++) f.perks.push(pool.splice(int(rng, 0, pool.length - 1), 1)[0]);
  f.level = 1 + f.perks.length;
  const tierGear = (slot, gearTier) => Object.keys(GEAR).filter((k) => GEAR[k].slot === slot && GEAR[k].tier <= gearTier);
  if (t >= 2) f.gear.weapon = pick(rng, tierGear('weapon', t >= 4 ? 2 : 1));
  if (t >= 3) f.gear.armor = pick(rng, tierGear('armor', t >= 4 ? 2 : 1));
  f.renown = t * 3 + (bout.boss ? 5 : 0);
}

export function newOpponent(run, tier) {
  const arena = run.arenas[tier];
  const bout = boutFor(run, tier);
  if (bout.boss && arena.rival) {
    arena.opponent = arena.rival;
    return;
  }
  const champ = rivalChampionFor(run, bout);
  if (champ) {
    arena.opponent = champ;
    return;
  }
  const back = returningNemesis(run, bout);
  if (back) {
    arena.opponent = back;
    return;
  }
  const f = createFighter(run.rng.opponents, { id: newId(run, 'o'), power: bout.oppPower, decorLevel: bout.oppDecor, takenNames: takenNames(run), classes: run.setup?.classes });
  f.speed = opponentSpeed(run, bout);
  seasonOpponent(run, f, bout);
  f.house = houseForArena(run, tier).id;
  arena.opponent = f;
  remember(run, f);
}

export function openArena(run, tier) {
  run.arenas[tier] = { tier, stage: tier === GRAND_TIER ? 3 : 0, debuff: pick(run.rng.opponents, DEBUFF_IDS), opponent: null, conquered: false, rival: null };
  newOpponent(run, tier);
}

export function restartCircuit(run, tier) {
  const arena = run.arenas[tier];
  arena.stage = 0;
  arena.debuff = pick(run.rng.opponents, DEBUFF_IDS);
  newOpponent(run, tier);
}

export function arenaMovesOn(run, tier) {
  const arena = run.arenas[tier];
  const held = STAGES[arena.stage];
  if (arena.stage < 2) {
    arena.stage = nextStage(run, tier);
    newOpponent(run, tier);
  } else restartCircuit(run, tier);
  log(run, `${arenaName(tier)} held its ${held} without your house. Next month: ${STAGES[arena.stage]}, against ${arena.opponent.name}.`);
}

export function fightPowers(run, f, tier = run.topTier) {
  const m = createMatch({ a: f, b: opponentFor(run, tier), rng: createRng(0), ...matchOptions(run, f, tier) });
  return { mine: computePower(m.a, m.b, 1).total, theirs: computePower(m.b, m.a, 1).total };
}

export function matchOptions(run, f, tier = run.topTier) {
  const oppHouse = run.arenas[tier] ? houseOf(run, opponentFor(run, tier)) : null;
  const debt = debtPenaltyFor(oppHouse);
  return {
    debuff: boutFor(run, tier).debuff,
    boss: boutFor(run, tier).boss,
    earlyRound: (bracketOf(run, tier)?.round ?? 2) < 2,
    festival: boutFor(run, tier).festival,
    overtrained: f.stress >= STRESS.overtrained,
    scouted: tier === run.topTier ? Math.min(ECONOMY.scoutedMax, f.topStreak ?? 0) : 0,
    challenger: tier === run.topTier && tier >= ECONOMY.challengerFromTier ? Math.min(ECONOMY.challengerMax, Math.floor((f.renown ?? 0) / ECONOMY.challengerRenown)) : 0,
    grudge: !run.arenas[tier] ? 0 : oppHouse?.feud > 0 ? 1 : oppHouse?.owed > 0 ? -1 : 0,
    vengeance: Boolean(run.arenas[tier]) && oppHouse?.vengeance > 0,
    rebels: tier === GRAND_TIER && run.plot?.coup && !run.plot.ended && f.id === run.plot.champion ? coupBonus(run) : 0,
    relics: relicFight(run, f, { boss: boutFor(run, tier).boss }),
    oracle: oracleLevel(run),
    ...(debt ? { debt } : {}),
  };
}

// ---------- Nemeses ----------

export function returningNemesis(run, bout) {
  if (bout.boss || bout.tier === GRAND_TIER || !run.nemeses?.length) return null;
  const ready = run.nemeses.filter((n) => run.week - n.nemesis.lastSeen >= NEMESIS.minWeeks && n.nemesis.tier <= bout.tier);
  if (!ready.length || next(run.rng.opponents) >= NEMESIS.returnChance) return null;
  const n = [...ready].sort((a, b) => b.nemesis.wins - a.nemesis.wins)[0];
  n.nemesis.lastSeen = run.week;
  const bonus = Math.min(NEMESIS.maxBonus, n.nemesis.wins * NEMESIS.powerPerWin);
  const f = { ...structuredClone(n), id: newId(run, 'o'), injuries: [], alive: true, stress: 0 };
  f.power = Math.max(f.power, bout.oppPower) + bonus;
  f.speed = Math.max(f.speed, opponentSpeed(run, bout));
  f.nemesis = { ...n.nemesis, of: n.id, bonus };
  log(run, `${n.name} ${n.nemesis.epithet} is back, in ${arenaName(bout.tier)}. They remember your house.`, 'warn');
  return f;
}

export function recordNemesis(run, opp, tier, fighter, boss) {
  if (boss || opp.rival) return;
  run.nemeses ??= [];
  const id = opp.nemesis?.of ?? opp.id;
  let n = run.nemeses.find((x) => x.id === id);
  if (!n) {
    n = { ...structuredClone(opp), id, injuries: [], nemesis: { epithet: pick(run.rng.opponents, NEMESIS.epithets), wins: 0, kills: 0, victims: [], tier, lastSeen: run.week } };
    delete n.nemesis.of;
    run.nemeses.push(n);
    if (run.nemeses.length > NEMESIS.max) run.nemeses.shift();
    log(run, `${opp.name} will be remembered in your house as ${opp.name} ${n.nemesis.epithet}.`, 'warn');
  }
  n.nemesis.wins += 1;
  n.nemesis.lastSeen = run.week;
  n.nemesis.beat = [...new Set([...(n.nemesis.beat ?? []), fighter.id])];
  if (!fighter.alive) {
    n.nemesis.kills += 1;
    n.nemesis.victims = [...n.nemesis.victims, fighter.name];
  }
}

export function nemesisFalls(run, opp, fighter, tier, summary) {
  const gold = NEMESIS.goldPerTier * Math.min(tier, CIRCUITS.length);
  run.nemeses = (run.nemeses ?? []).filter((n) => n.id !== opp.nemesis.of);
  summary.gold += gold;
  summary.renown += NEMESIS.renown;
  summary.nemesis = `${opp.name} ${opp.nemesis.epithet}`;
  changeFavor(run, NEMESIS.favor, `${opp.name} ${opp.nemesis.epithet} is beaten`);
  chronicle(run, fighter, `Beat the house's nemesis, ${opp.name} ${opp.nemesis.epithet}${opp.nemesis.victims.length ? `, who had killed ${opp.nemesis.victims.join(' and ')}` : ''}.`);
  log(run, `${fighter.name} beats ${opp.name} ${opp.nemesis.epithet}! +${gold} Gold, +${NEMESIS.renown} Renown. The house breathes again.`, 'good');
}

// ---------- Archrival ----------

export function archrival(run) {
  if (!run.houses?.length) return null;
  run.archrival ??= [...run.houses].sort((a, b) => b.glory - a.glory)[0].id;
  return run.houses.find((h) => h.id === run.archrival) ?? null;
}

const rivalsRng = (run) => (run.rng.rivals ??= createRng(deriveSeed(run.seed, 11)));

export function rivalMonth(run) {
  const h = archrival(run);
  if (!h) return;
  const r = rivalsRng(run);
  if (run.topTier >= RIVAL.championFrom && !run.rivalChampion) {
    const f = createFighter(r, { id: newId(run, 'o'), power: 0, takenNames: takenNames(run), classes: run.setup?.classes });
    f.house = h.id;
    run.rivalChampion = { f, wins: 0, losses: 0, lastSeen: run.week };
    remember(run, f);
    log(run, `${h.name} names its champion: ${f.name}.`, 'warn');
    talk(run, `rival-named-${f.id}`, [{ speaker: 'rival', text: RIVAL_LINES.named(h.name, f.name) }]);
  }
  if (run.market.length && next(r) < RIVAL.poachChance) {
    const best = [...run.market].sort((a, b) => effectivePower(b) - effectivePower(a))[0];
    run.poach = { id: best.id, week: run.week };
    log(run, RIVAL_LINES.eyeing(h.name, best.name), 'warn');
  }
}

export function rivalPoach(run) {
  if (!run.poach || run.week !== run.poach.week) return;
  const h = archrival(run);
  const f = run.market.find((x) => x.id === run.poach.id);
  if (f && h) {
    run.market = run.market.filter((x) => x !== f);
    log(run, RIVAL_LINES.bought(h.name, f.name), 'bad');
  }
  run.poach = null;
}

export function rivalChampionFor(run, bout) {
  const c = run.rivalChampion;
  const h = archrival(run);
  if (!c || !h || !bout.top || bout.boss || bout.tier === GRAND_TIER || run.week - c.lastSeen < RIVAL.minWeeks) return null;
  if (next(rivalsRng(run)) >= RIVAL.chance) return null;
  c.lastSeen = run.week;
  const f = { ...structuredClone(c.f), id: newId(run, 'o'), injuries: [], alive: true, stress: 0, house: h.id, rivalChampion: true };
  f.rivalBonus = RIVAL.power + Math.min(RIVAL.maxBonus, c.wins);
  f.power = bout.oppPower + f.rivalBonus;
  f.speed = opponentSpeed(run, bout);
  seasonOpponent(run, f, bout);
  log(run, RIVAL_LINES.arrives(h.name, f.name), 'warn');
  talk(run, `rival-arrives-${f.id}`, [{ speaker: 'rival', text: RIVAL_LINES.arrives(h.name, f.name) }], { now: true });
  return f;
}

export function rivalChampionResult(run, opp, fighter, tier, won, summary) {
  const c = run.rivalChampion;
  const h = archrival(run);
  if (!c || !h) return;
  const t = Math.min(tier, CIRCUITS.length);
  if (won) {
    c.losses += 1;
    const gold = RIVAL.beatGold * t;
    summary.gold += gold;
    summary.renown += RIVAL.beatRenown;
    h.glory = Math.max(0, h.glory - RIVAL.beatGlory);
    summary.rivalChampion = opp.name;
    chronicle(run, fighter, `Beat ${opp.name}, champion of ${h.name}.`);
    log(run, `${fighter.name} beats ${opp.name}, champion of ${h.name}! +${gold} Gold, +${RIVAL.beatRenown} Renown, and ${h.name} loses ${RIVAL.beatGlory} Glory.`, 'good');
    talk(run, `rival-beaten-${opp.id}`, [{ speaker: 'rival', text: RIVAL_LINES.beaten(h.name, opp.name) }]);
  } else {
    c.wins += 1;
    h.glory += RIVAL.winGlory * t;
    talk(run, `rival-wins-${opp.id}`, [{ speaker: 'rival', text: RIVAL_LINES.wins(h.name, opp.name) }]);
  }
}

export function rivalChampionKilled(run, name) {
  const h = archrival(run);
  if (!run.rivalChampion || !h) return;
  run.rivalChampion = null;
  talk(run, `rival-killed-${run.week}-${name}`, [{ speaker: 'rival', text: RIVAL_LINES.killed(h.name, name) }]);
}

// ---------- Bonds ----------

export const bondmate = (run, f) => (f.bond ? run.roster.find((x) => x.id === f.bond.id) ?? null : null);

export function formBond(run, a, b, how = 'fightDay') {
  if (a.bond || b.bond || a === b) return;
  a.bond = { id: b.id, name: b.name, since: run.week };
  b.bond = { id: a.id, name: a.name, since: run.week };
  for (const [x, y] of [[a, b], [b, a]]) chronicle(run, x, `Bonded with ${y.name}.`);
  log(run, `${a.name} and ${b.name} have become fast friends: each is happier while the other is in the house.`, 'good');
  const pairKey = (a.coreId && b.coreId) ? [a.coreId, b.coreId].sort().join('_') : (a.coreId || b.coreId || 'ally');
  queueMilestone(run, a, { id: `bond_formed_${pairKey}`, priority: 68, ctx: { mateId: b.id, mateName: b.name, mateCoreId: b.coreId ?? null, partnerName: b.name, partnerCoreId: b.coreId ?? null, pairKey, how } });
  queueMilestone(run, b, { id: `bond_formed_${pairKey}`, priority: 68, ctx: { mateId: a.id, mateName: a.name, mateCoreId: a.coreId ?? null, partnerName: a.name, partnerCoreId: a.coreId ?? null, pairKey, how } });
  const v = (a.id + b.id).split('').reduce((n, ch) => n + ch.charCodeAt(0), 0);
  const [first, second] = BOND_LINES.pairs[v % BOND_LINES.pairs.length];
  talk(run, `bond-${a.id}-${b.id}`, [
    { speaker: 'narrator', text: BOND_LINES.narrator(a.name, b.name, how) },
    { speaker: 'fighter', fighterId: a.id, text: first(b.name) },
    { speaker: 'fighter', fighterId: b.id, text: second(a.name) },
    { speaker: 'steward', text: run.bondExplained ? BOND_LINES.stewardAgain(a.name, b.name) : BOND_LINES.steward(a.name, b.name, BOND.comfort, BOND.mentorGap) },
  ]);
  run.bondExplained = true;
}

export function bondOverFightDay(run) {
  const winners = [...new Set(run.history.filter((h) => h.week === run.week - 1 && h.won && !h.died).map((h) => h.fighterId))]
    .map((id) => run.roster.find((f) => f.id === id)).filter((f) => f && !f.bond);
  if (winners.length >= 2) formBond(run, winners[0], winners[1]);
}

export function tendBonds(run) {
  for (const f of run.roster) {
    if (!f.bond) continue;
    const mate = bondmate(run, f);
    if (mate) {
      if (mate.level - f.level >= BOND.mentorGap) gainXp(run, f, BOND.mentorXp);
      continue;
    }
    const dead = run.fallen.some((x) => x.id === f.bond.id);
    if (dead) {
      const deadFighter = run.fallen.find((x) => x.id === f.bond.id);
      const pairKey = (f.coreId && deadFighter?.coreId) ? [f.coreId, deadFighter.coreId].sort().join('_') : (f.coreId || 'ally');
      queueMilestone(run, f, { id: `bond_grief_${pairKey}`, priority: 100, ctx: { mateId: f.bond.id, mateName: f.bond.name, mateCoreId: deadFighter?.coreId ?? null, partnerName: f.bond.name, partnerCoreId: deadFighter?.coreId ?? null, pairKey } });
      f.mood = { n: (f.mood?.n ?? 0) + BOND.grief, weeks: MOOD_WEEKS };
      chronicle(run, f, `Grieved for ${f.bond.name}.`);
      log(run, `${f.name} grieves for ${f.bond.name}.`, 'bad');
    }
    delete f.bond;
  }
}

// ---------- Patron Lounge ----------

export const hostPrice = (run) => LOUNGE.hostGold * Math.min(run.topTier, CIRCUITS.length);

export function hostBlocker(run) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!maxLevel(run, 'lounge')) return 'Build the Patron Lounge first.';
  if (run.hostedMonth === monthOf(run.week)) return 'You have hosted the Senate this month.';
  if (run.gold < hostPrice(run)) return `Needs ${hostPrice(run)} Gold.`;
  return null;
}

export function host(run) {
  assertOk(hostBlocker(run));
  const star = [...run.roster].sort((a, b) => b.renown - a.renown)[0];
  const fourthSonBonus = run.roster.some((f) => f.keepsake === 'fourthSonHonour') ? 1 : 0;
  const gain = Math.min(LOUNGE.maxInfluence + fourthSonBonus, 1 + Math.floor((star?.renown ?? 0) / LOUNGE.renownPer) + fourthSonBonus);
  run.gold -= hostPrice(run);
  run.influence = (run.influence ?? 0) + gain;
  run.hostedMonth = monthOf(run.week);
  log(run, `Senators dine at your table${star ? ` and admire ${star.name}` : ''}. +${gain} Influence (now ${run.influence}).`, 'event');
  return gain;
}

export const activePolicies = (run) => (run.policies ?? []).filter((p) => p.until > run.week);

export function enactBlocker(run, id) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const p = LOUNGE.policies[id];
  if (!p) return 'Unknown policy.';
  if (!maxLevel(run, 'lounge')) return 'Build the Patron Lounge first.';
  if (hasPolicy(run, id)) return `${p.name} is already in force.`;
  if (activePolicies(run).length >= effectAt('lounge', maxLevel(run, 'lounge'))) return 'Your Lounge can keep no more policies in force (upgrade it, or wait for one to lapse).';
  if ((run.influence ?? 0) < p.cost) return `Needs ${p.cost} Influence (you have ${run.influence ?? 0}).`;
  return null;
}

export function enact(run, id) {
  assertOk(enactBlocker(run, id));
  const p = LOUNGE.policies[id];
  run.influence -= p.cost;
  run.policies = [...activePolicies(run), { id, until: run.week + LOUNGE.weeks }];
  log(run, `The Senate passes ${p.name}: ${p.desc}`, 'event');
  if (plotActive(run)) changeSuspicion(run, p.lean === 'loyalist' ? LOUNGE.loyalistSuspicion : p.lean === 'reformist' ? LOUNGE.reformistSuspicion : 0);
  if (id === 'purgePrisons') run.liaisonOffers = (run.liaisonOffers ?? []).filter((f) => !f.political);
}

// ---------- The Emperor's demands ----------

const DEMAND_MET = {
  topWin: (h) => h.some((x) => x.top && x.won),
  bloodied: (h) => h.some((x) => x.bloodied || (DEMAND.bloodiedKills && x.won && (x.kill || x.verdict === 'kill'))),
  kill: (h) => h.some((x) => x.verdict === 'kill' || (x.won && x.kill)),
  spare: (h) => h.some((x) => x.verdict === 'spare'),
  twoArenas: (h) => new Set(h.filter((x) => x.won).map((x) => x.tier)).size >= 2,
};

export const demandMet = (run) => Boolean(run.demand) && DEMAND_MET[run.demand.id](run.history.filter((x) => x.week >= run.demand.week));

export function issueDemand(run) {
  if (run.demand || run.week < DEMAND.fromWeek || isWinter(run.week)) return;
  run.rng.emperor ??= createRng(deriveSeed(run.seed, 9));
  if (next(run.rng.emperor) >= DEMAND.chance) return;
  const options = Object.keys(DEMANDS).filter((id) => id !== 'twoArenas' || unlockedTiers(run).length >= 2);
  run.demand = { id: pick(run.rng.emperor, options), week: run.week };
  log(run, `The Emperor demands: ${DEMANDS[run.demand.id].goal}, by the end of this month's fight day.`, 'event');
}

export function judgeDemand(run) {
  if (!run.demand) return;
  const tier = Math.min(run.topTier, CIRCUITS.length);
  const met = demandMet(run);
  if (met) {
    run.gold += DEMAND.goldPerTier * tier;
    changeFavor(run, DEMAND.favor, "the Emperor's demand, met");
    log(run, `The Emperor is pleased: +${DEMAND.goldPerTier * tier} Gold from the palace.`, 'good');
  } else {
    changeFavor(run, DEMAND.missFavor, "the Emperor's demand, unmet");
  }
  run.demandResult = { id: run.demand.id, issued: run.demand.week, met, gold: met ? DEMAND.goldPerTier * tier : 0, favor: met ? DEMAND.favor : DEMAND.missFavor };
  run.demand = null;
}

// ---------- v8.0 Favour Debt (Legate Cassian Vane & Censor Numerius Gallo) & Rival House Debt ----------

export const favorWritGold = (run) => FAVOR_DEBT.writGoldBase + FAVOR_DEBT.writGoldPerTier * Math.min(run.topTier, CIRCUITS.length);
export const favorLoanPrincipal = (run) => FAVOR_DEBT.loanBase + FAVOR_DEBT.loanPerTier * Math.min(run.topTier, CIRCUITS.length);

export function borrowFavorBlocker(run, kind = 'loan') {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!['writ', 'loan'].includes(kind)) return 'Choose a Palatine Writ or a Palatine Loan.';
  if (kind === 'writ') {
    if (run.writMonth === monthOf(run.week)) return 'You have already sold a Writ of Favour this month.';
    if (run.favor <= FAVOR_DEBT.writFavorCost || run.favor < FAVOR_DEBT.writMinFavor) {
      return `Needs at least ${Math.max(FAVOR_DEBT.writMinFavor, FAVOR_DEBT.writFavorCost + 1)} Imperial Favour to sell a Writ.`;
    }
    return null;
  }
  if (run.favorDebt?.owed > 0) return 'Repay your existing Palatine loan first.';
  if (run.favor < FAVOR_DEBT.loanMinFavor) return `Needs at least ${FAVOR_DEBT.loanMinFavor} Imperial Favour for Legate Vane to underwrite a loan.`;
  return null;
}

export function borrowFavor(run, kind = 'loan') {
  assertOk(borrowFavorBlocker(run, kind));
  if (kind === 'writ') {
    const gold = favorWritGold(run);
    run.gold += gold;
    run.writMonth = monthOf(run.week);
    changeFavor(run, -FAVOR_DEBT.writFavorCost, 'sold a Writ of Favour to Legate Vane');
    log(run, `Legate Cassian Vane countersigns your Writ: +${gold} Gold for −${FAVOR_DEBT.writFavorCost} Imperial Favour.`, 'warn');
    return { kind: 'writ', gold, favor: -FAVOR_DEBT.writFavorCost };
  }
  const principal = favorLoanPrincipal(run);
  const owed = Math.round(principal * FAVOR_DEBT.loanVigourish);
  run.gold += principal;
  run.favorDebt = { principal, owed, sinceWeek: run.week, monthsElapsed: 0 };
  changeFavor(run, FAVOR_DEBT.loanSealFavor, 'seal fee on a Palatine loan from Legate Vane');
  log(run, `Legate Cassian Vane advances you +${principal} Gold from the Palatine chest (${owed} Gold owed; Censor Gallo collects ${-FAVOR_DEBT.monthlyFavorInterest} Favour/month until repaid).`, 'warn');
  return run.favorDebt;
}

export function payFavorDebtBlocker(run, amount = null) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!run.favorDebt || !(run.favorDebt.owed > 0)) return 'You owe no Palatine debt.';
  if ((amount == null || amount === '') && run.gold <= 0) return `Needs ${run.favorDebt.owed} Gold.`;
  const raw = amount == null || amount === '' ? Math.min(run.gold, run.favorDebt.owed) : Number(amount);
  if (!Number.isFinite(raw) || !Number.isInteger(raw) || raw < 1) return 'Enter a whole Gold amount to repay.';
  const pay = Math.min(raw, run.favorDebt.owed);
  if (run.gold < pay) return `Needs ${pay} Gold.`;
  return null;
}

export function payFavorDebt(run, amount = null) {
  assertOk(payFavorDebtBlocker(run, amount));
  const d = run.favorDebt;
  const raw = amount == null || amount === '' ? Math.min(run.gold, d.owed) : Number(amount);
  const pay = Math.min(raw, d.owed);
  run.gold -= pay;
  d.owed -= pay;
  if (d.owed <= 0) {
    const onTime = (d.monthsElapsed ?? 0) <= FAVOR_DEBT.termMonths;
    delete run.favorDebt;
    if (onTime) changeFavor(run, FAVOR_DEBT.onTimeRepayFavor, 'settled the Palatine loan on time');
    log(run, `You pay ${pay} Gold to Censor Gallo and clear your Palatine loan in full${onTime ? ` (+${FAVOR_DEBT.onTimeRepayFavor} Favour)` : ''}.`, 'good');
  } else {
    log(run, `You pay ${pay} Gold toward your Palatine loan (${d.owed} Gold still owed).`, 'good');
  }
  return pay;
}

export function favorDebtMonth(run) {
  const d = run.favorDebt;
  if (!d || !(d.owed > 0)) return;
  if (run.week - (d.sinceWeek ?? 0) < 4) return;
  d.monthsElapsed = (d.monthsElapsed ?? 0) + 1;
  if (d.monthsElapsed >= FAVOR_DEBT.termMonths && run.gold >= d.owed) {
    const paid = d.owed;
    const onTime = d.monthsElapsed <= FAVOR_DEBT.termMonths;
    run.gold -= paid;
    delete run.favorDebt;
    if (onTime) changeFavor(run, FAVOR_DEBT.onTimeRepayFavor, 'settled the Palatine loan on time');
    log(run, `Censor Numerius Gallo collects ${paid} Gold from your strongbox and clears your Palatine loan in full${onTime ? ` (+${FAVOR_DEBT.onTimeRepayFavor} Favour)` : ''}.`, 'good');
    return;
  }
  const tier = Math.min(run.topTier, CIRCUITS.length);
  const overdue = d.monthsElapsed > FAVOR_DEBT.termMonths;
  const rawFavorCost = overdue ? FAVOR_DEBT.overdueFavorInterest : FAVOR_DEBT.monthlyFavorInterest;
  const safeFavorCost = (run.favor + rawFavorCost <= 0) ? -Math.max(0, run.favor - 1) : rawFavorCost;
  if (safeFavorCost !== 0) {
    changeFavor(run, safeFavorCost, overdue ? 'overdue Palatine debt audit by Censor Gallo' : 'monthly interest on Palatine loan');
  }
  if (overdue) {
    const cap = Math.ceil((d.principal ?? d.owed) * (FAVOR_DEBT.maxOwedMultiplier ?? 2.5));
    const fine = Math.max(0, Math.min(FAVOR_DEBT.overdueGoldStep * tier, cap - d.owed));
    d.owed += fine;
    log(run, `Censor Numerius Gallo audits your overdue Palatine loan: ${fine ? `+${fine} Gold in arrears (now ${d.owed} Gold owed)` : `${d.owed} Gold owed (at maximum arrears)`}.`, 'bad');
    if (plotActive(run)) changeSuspicion(run, FAVOR_DEBT.overdueSuspicion);
  }
}

export const activeHouseDebts = (run) => (run.houses ?? []).filter((h) => h.debt?.owed > 0);

export function houseLoanPrincipal(run, houseOrId) {
  const h = typeof houseOrId === 'string' ? run.houses?.find((x) => x.id === houseOrId) : houseOrId;
  const tier = Math.min(CIRCUITS.length, Math.max(run.topTier ?? 1, h?.tier ?? 1));
  return HOUSE_DEBT.loanBase + HOUSE_DEBT.loanPerTier * tier;
}

export function borrowHouseBlocker(run, houseId) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const h = run.houses?.find((x) => x.id === houseId);
  if (!h) return 'No such rival house.';
  if (h.debt?.owed > 0) return `You already owe ${h.name} ${h.debt.owed} Gold.`;
  if (h.lastLoanMonth === monthOf(run.week)) return `${h.name} has already extended you credit this month.`;
  if (h.feud > 0) return `${h.name} is in a blood feud with your house and refuses to lend you a copper.`;
  if (activeHouseDebts(run).length >= HOUSE_DEBT.maxActive) return `At most ${HOUSE_DEBT.maxActive} rival houses will extend you credit at once.`;
  return null;
}

export function borrowHouse(run, houseId) {
  assertOk(borrowHouseBlocker(run, houseId));
  const h = run.houses.find((x) => x.id === houseId);
  const principal = houseLoanPrincipal(run, h);
  const rate = (h.owed ?? 0) > 0 ? 1 : HOUSE_DEBT.usury;
  const owed = Math.round(principal * rate);
  run.gold += principal;
  h.lastLoanMonth = monthOf(run.week);
  h.debt = { principal, owed, sinceWeek: run.week, monthsUnpaid: 0 };
  log(run, `You borrow +${principal} Gold from ${h.name} (${owed} Gold owed${rate === 1 ? ', usury waived for the life-debt they owe you' : ''}). Until repaid, their fighters fight harder against you.`, 'warn');
  return h.debt;
}

export function payHouseDebtBlocker(run, houseId, amount = null) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const h = run.houses?.find((x) => x.id === houseId);
  if (!h) return 'No such rival house.';
  if (!h.debt || !(h.debt.owed > 0)) return `You owe ${h.name} nothing.`;
  if ((amount == null || amount === '') && run.gold <= 0) return `Needs ${h.debt.owed} Gold.`;
  const raw = amount == null || amount === '' ? Math.min(run.gold, h.debt.owed) : Number(amount);
  if (!Number.isFinite(raw) || !Number.isInteger(raw) || raw < 1) return 'Enter a whole Gold amount to repay.';
  const pay = Math.min(raw, h.debt.owed);
  if (run.gold < pay) return `Needs ${pay} Gold.`;
  return null;
}

export function payHouseDebt(run, houseId, amount = null) {
  assertOk(payHouseDebtBlocker(run, houseId, amount));
  const h = run.houses.find((x) => x.id === houseId);
  const raw = amount == null || amount === '' ? Math.min(run.gold, h.debt.owed) : Number(amount);
  const pay = Math.min(raw, h.debt.owed);
  run.gold -= pay;
  h.debt.owed -= pay;
  if (h.debt.owed <= 0) {
    delete h.debt;
    log(run, `You pay ${pay} Gold to ${h.name} and clear your debt in full.`, 'good');
  } else {
    log(run, `You pay ${pay} Gold toward your debt to ${h.name} (${h.debt.owed} Gold still owed).`, 'good');
  }
  return pay;
}

