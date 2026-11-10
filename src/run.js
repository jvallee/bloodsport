// Career state: weekly schedule, market, fighter growth, Morale, inventory, and the arenas.
// Every arena you've unlocked holds a bout on tournament week (Tournament 1 → 2 → Boss); the highest one is your
// "top" arena, where Bosses decide your standing with the Emperor. After Tier 4 comes the Grand Tournament (tier 5).
// Pure: no DOM. Actions mutate the run and throw on invalid moves; *Blocker() returns why a move is invalid.

import { createRng, deriveSeed, int, next, pick, randomSeed } from './rng.js';
import {
  decorComfort, ECONOMY, STRESS, TRAIN_GAIN, HEAL_WEEKS, KINDS, TRAITS, BUILDINGS, CLASSES, WEAPONS, NAMES, CIRCUITS, GRAND, STAGES, BOSS_DEBUFFS,
  STARTING_BUILDINGS, SPY, XP, PERKS, RENOWN, MORALE, GEAR, DECOR, FAVOR, TRIBUTE, REVOLT, INJURY_BY_TAG, CONSUMABLES, BLOODIED, HUMORS, FESTIVAL_BY_ID, HOUSES, PATRONS,
  SCARS, SCAR_CHANCE, SCAR_AFEARED, SEVERE, AUGMENTS, SURGERY, RETIRE, BRACKET, MERCY, TITLES, POLITICAL, PLOT, LIAISON, RECRUIT, EXHIBITION, NEMESIS, SHORT, BET, DEMAND, DEMANDS, BOND, HYPE, LOUNGE, REANIMATE, QUESTS, FIGHTER_WANTS, RIVAL, REBEL_QUEST, SUMMONS, FEAR, FORTUNE, HEAT, LEGACY, deltaRow,
} from './data.js';
import { RELICS, BOONS, hasRelic, relicSum, relicFight, tagCount, fortuneTitle, fortuneText } from './fortune.js';
import { CELL_IDS, CLUES, PLOT_EVENTS, SUSPICION_SIGNS, isArmed, coupBonus } from './plot.js';
import { STEWARD_TASKS, STEWARD_INTRO, stewardDone, stewardAlready, WANTS, REBEL_QUESTS, RIVAL_LINES, BOND_LINES, SUMMONS_LINES, LIAISON_LINES } from './quests.js';
import { createMatch, kindActive, effectiveInjuries, killMarks, meleeOnly, computePower, deathGateAt, hypeOf, playRound, throwTowel, canThrowTowel, mortalDanger, suggestTactic } from './fight.js';
import { Refused } from './errors.js';
import { estimateOdds } from './odds.js';
import { EVENTS, EVENT_BY_ID, EVENT_CHANCE, MOOD_WEEKS, EVENT_MEMORY, choiceLabel } from './events.js';
import { isTournamentWeek, isMonthStart, formatDate, dateOf, WEEKS_PER_YEAR, festivalOn, weeksUntilTournament, isWinter } from './calendar.js';
import {
  prestigeLevelFor, rosterCap, trainerRooms, trainCap, trainCost, medbaySlots, healRate, decorCap, liaisonLevel, stressRelief,
  maxLevel, effectAt, build, upgrade, oracleLevel,
} from './ludus.js';

export const SAVE_VERSION = 3;
export const GRAND_TIER = CIRCUITS.length + 1;
const KIND_IDS = Object.keys(KINDS).filter((k) => !KINDS[k].exotic); // exotic kinds (Revenants) are never bought or met
const CLASS_IDS = Object.keys(CLASSES).filter((c) => !CLASSES[c].legacy); // legacy classes join via run.setup.classes
const WEAPON_IDS = Object.keys(WEAPONS);
const DEBUFF_IDS = Object.keys(BOSS_DEBUFFS);
const HUMOR_IDS = Object.keys(HUMORS);
// Fighters from saves made before humors get one from their name, so it never changes between loads.
const humorFor = (f) => HUMOR_IDS[[...f.name].reduce((n, ch) => n + ch.charCodeAt(0), 0) % HUMOR_IDS.length];
const COMBAT_PERKS = ['thickSkin', 'killer', 'fastStart', 'closer', 'survivor', 'duelist'];
export const JOBS = ['rest', 'trainPower', 'trainSpeed', 'medbay'];

const emptyDecor = () => Object.fromEntries(Object.keys(DECOR).map((k) => [k, 0]));
const emptyItems = () => Object.fromEntries(Object.keys(CONSUMABLES).map((k) => [k, 0]));

export function createFighter(rng, { id, kind, power, bonusPower = 0, decorLevel = 0, takenNames = [], classes = [] } = {}) {
  kind ??= pick(rng, KIND_IDS);
  const kindTrait = pick(rng, KINDS[kind].traits);
  const cls = pick(rng, [...CLASS_IDS, ...(classes ?? [])]);
  const weapon = cls === 'fighter' ? pick(rng, WEAPON_IDS) : null;
  const free = NAMES.filter((n) => !takenNames.includes(n));
  const name = pick(rng, free.length ? free : NAMES);
  const humor = pick(rng, HUMOR_IDS);
  const decor = emptyDecor();
  if (cls === 'ornitharius') decor.bird = decorLevel;
  if (kindTrait === 'firebug') decor.fireBrazier = decorLevel;
  return {
    id, name, kind, kindTrait, cls, weapon, humor,
    power: (power ?? KINDS[kind].basePower) + bonusPower,
    speed: ECONOMY.startSpeed,
    trained: 0, trainedPower: 0, decor, injuries: [], alive: true,
    stress: 0, job: 'rest', titles: [],
    xp: 0, level: 1, perks: [], pendingPerks: [], renown: 0, morale: MORALE.start, gear: { weapon: null, armor: null }, topStreak: 0,
  };
}

const newId = (run, prefix) => `${prefix}${run.nextId++}`;
// Everyone fighting for or against you: arena opponents, waiting rivals and this week's bracket opponents.
const allOpponents = (run) => [
  ...Object.values(run.arenas).flatMap((a) => [a.opponent, a.rival]),
  ...Object.values(run.brackets ?? {}).flatMap((b) => b.foes),
].filter(Boolean);
// No name comes back soon as someone else: every fighter the game makes (opponents, bracket foes, the Market, the Liaison)
// goes on this list (playtest #8: only arena opponents did, so "Skarn" was three different fighters in three months).
export const NAME_MEMORY = 90;
function remember(run, ...fighters) {
  run.recentNames = [...(run.recentNames ?? []), ...fighters.map((f) => f.name)].slice(-NAME_MEMORY);
}
// A fighter's comfort from the decor in their room.
export const decorComfortOf = (f) => Object.entries(f.decor ?? {}).reduce((n, [k, c]) => n + (DECOR[k] ? decorComfort(DECOR[k]) * c : 0), 0);
const takenNames = (run, extra = []) =>
  [...run.roster, ...run.market, ...run.fallen, ...allOpponents(run), ...(run.liaisonOffers ?? []), ...(run.nemeses ?? []), ...(run.rivalChampion ? [run.rivalChampion.f] : []), ...extra].map((f) => f.name).concat(run.graveyard ?? [], run.recentNames ?? [], (run.retired ?? []).map((l) => l.name));
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const clampStress = (n) => clamp(n, 0, STRESS.max);
// The Stress a week of training adds (Iron Constitution and the Drillmaster's Rod take some off).
export const trainStress = (run, f) => Math.max(0, STRESS.train - (f.perks.includes('ironConstitution') ? 10 : 0) - relicSum(run, 'trainStress'));
const log = (run, text, tone = 'info') => run.log.push({ week: run.week, text, tone });
const findFighter = (run, id) => run.roster.find((f) => f.id === id);
export const effectiveSpeed = (f) => f.speed + [f.gear?.weapon, f.gear?.armor].filter(Boolean).reduce((s, k) => s + (GEAR[k].speed ?? 0), 0);
// Power as the card shows it: trained Power, gear, a Firebug's Fire Braziers and cyborg augments.
export const effectivePower = (f) => powerParts(f).reduce((s, x) => s + x.value, 0);

// Where that Power comes from, for the card's hover. Labels other than the first three match
// computePower's sources, so the fight screen can tell standing Power from this round's changes.
export function powerParts(f) {
  const titles = (f.titles ?? []).filter((t) => t !== 'Master of the Games').length; // each Championship is +1
  const trained = f.trainedPower ?? 0; // counted since the v5 update; older saves fold earlier training into "Natural"
  const perks = f.perkPower ?? 0; // Mighty, Juggernaut
  const known = f.trainedPower !== undefined || !f.trained; // older saves didn't count Power training separately
  const parts = [{ label: known ? 'Natural' : 'Natural and training', value: f.power - trained - titles - perks, base: true }];
  if (trained) parts.push({ label: 'Training', value: trained, base: true });
  if (perks) parts.push({ label: perks === 1 ? 'Perk' : 'Perks', value: perks, base: true });
  if (titles) parts.push({ label: titles === 1 ? 'Title' : 'Titles', value: titles, base: true });
  for (const k of [f.gear?.weapon, f.gear?.armor]) if (k && GEAR[k].power) parts.push({ label: GEAR[k].name, value: GEAR[k].power });
  if (f.kindTrait === 'firebug' && f.decor?.fireBrazier) parts.push({ label: 'Firebug', value: f.decor.fireBrazier });
  if (f.kind === 'basa' && f.decor?.lionCage) parts.push({ label: 'Lion Cage', value: 1 });
  for (const k of f.augments ?? []) if (AUGMENTS[k]?.power) parts.push({ label: AUGMENTS[k].name, value: AUGMENTS[k].power });
  return parts;
}
export const championTitle = (tier) => `Champion of ${arenaName(tier).replace(/^The /, 'the ')}`;
export const isChampionOf = (f, tier) => (f.titles ?? []).includes(championTitle(tier));
// A Championship also crowns the fighter in every arena below it (+1 Power for each Title they didn't hold),
// so a Silver champion never has to go back down to the Dirt Pits for the bonus (playtest #7). Returns the new Titles.
export function crownChampion(f, tier) {
  const won = [];
  for (let t = tier; t >= (TITLES.cascade ? 1 : tier); t--) {
    if (isChampionOf(f, t)) continue;
    f.titles.push(championTitle(t));
    f.power += t === tier ? 1 : TITLES.cascadePower;
    won.push(championTitle(t));
  }
  return won;
}
// Harsh Judges (a decree) makes every Boss loss cost 5 more.
export const bossLossFavor = (tier, run = null) => Math.round(FAVOR.bossLoss[Math.min(tier, FAVOR.bossLoss.length) - 1] * (isShort(run) ? SHORT.bossLoss : 1)) - (hasDecree(run, 'harshJudges') ? 5 : 0);
export const hasDecree = (run, id) => Boolean(run?.setup?.decrees?.includes(id));
// Version 6: what the Legacy had unlocked when this career started (docs/plan-v6-phase3.md). None for a first career.
export const hasUnlock = (run, id) => Boolean(run?.setup?.unlocks?.includes(id));
export const heatDecrees = (heat) => HEAT.decrees.slice(0, Math.max(0, heat ?? 0));
const lionsPower = (run) => (hasDecree(run, 'hungryLions') ? 1 : 0);
// A Patron Lounge policy in force (fun idea #7).
export const hasPolicy = (run, id) => Boolean(run?.policies?.some((p) => p.id === id && p.until > run.week));

// ---------- Arenas and bouts ----------

export const unlockedTiers = (run) => Object.keys(run.arenas).map(Number).sort((a, b) => a - b);
export const isGrand = (run) => run.topTier === GRAND_TIER;
export const circuitInfo = (run) => CIRCUITS[Math.min(run.topTier, CIRCUITS.length) - 1];
export const arenaName = (tier) => (tier === GRAND_TIER ? GRAND.name : CIRCUITS[tier - 1].name);

// The bout an arena holds on tournament week: name, buy-in, rewards, opponent Power, debuff.
// An arena opponent's Power in this career: the table's, plus a season's (SHORT), Hungry Lions and, for a Boss, Iron Bosses
// and the Senate's lions. A lost Boss's return, the summons and the Championship want read this too (playtest LLM-14: they
// read the bare table, so in a season a lost Boss came back 11 Power weaker).
export function arenaPower(run, tier, stage = 2) {
  if (tier === GRAND_TIER) return GRAND.oppPower + (hasDecree(run, 'ironBosses') ? 1 : 0) + lionsPower(run) + (isShort(run) ? SHORT.grandPower : 0);
  return CIRCUITS[tier - 1].oppPower[stage] + lionsPower(run) + (isShort(run) ? SHORT.oppPower[tier - 1] ?? 0 : 0)
    + (stage === 2 && hasDecree(run, 'ironBosses') ? 1 : 0) + (stage === 2 && hasPolicy(run, 'unleashLions') ? 1 : 0);
}
export function boutFor(run, tier = run.topTier) {
  const top = tier === run.topTier;
  const below = run.topTier - tier;
  const arena = run.arenas[tier];
  if (tier === GRAND_TIER) {
    return { tier, top, below: 0, name: GRAND.name, stage: 3, boss: true, buyIn: GRAND.buyIn, winGold: GRAND.winGold, winPrestige: GRAND.winPrestige, lossGold: GRAND.lossGold, oppPower: arenaPower(run, GRAND_TIER), oppDecor: GRAND.oppDecor, debuff: arena.debuff, conquered: false };
  }
  const c = CIRCUITS[tier - 1];
  const s = arena.stage;
  // This tournament week's festival (or the coming one's, for previews).
  // A settled arena previews next month's bout, so it looks past this week.
  // An arena with no open bout this week (settled, or opened mid-tournament) previews next month's (blind playtest #7).
  const from = run.bouts && run.bouts[tier] !== 'open' ? run.week + 1 : run.week;
  const fest = festivalOn(from + weeksUntilTournament(from));
  // The Dirt Pits never turn a house away: one that can't afford the buy-in pays what Prestige it has (even 0),
  // so a career can always win its way back.
  const pauper = tier === 1 && run.prestige < c.buyIn[s];
  return {
    tier, top, below,
    name: `${c.name} · ${STAGES[s]}`, stage: s, boss: s === 2,
    buyIn: fest?.freeEntry ? 0 : pauper ? Math.max(0, run.prestige) : c.buyIn[s], fullBuyIn: c.buyIn[s], pauper: pauper && !fest?.freeEntry,
    // Lower arenas pay less, but a win always pays more than a loss (playtest #6: the Dirt Pits paid 2 either way).
    winGold: Math.round(Math.max(Math.ceil(c.winGold[s] * ECONOMY.lowerArenaGold ** below), c.lossGold + ECONOMY.lowerWinOverLoss) * (fest?.gold ?? 1) * (isShort(run) ? SHORT.purse : 1) * (hasPolicy(run, 'breadAndCircuses') ? 1.25 : 1)),
    winPrestige: Math.round(Math.max(below ? ECONOMY.lowerArenaMinPrestige : 0, Math.floor(c.winPrestige[s] * ECONOMY.lowerArenaPrestige ** below)) * (fest?.prestige ?? 1) * (isShort(run) ? SHORT.prestige : 1) * (s === 2 && hasPolicy(run, 'unleashLions') ? 2 : 1)),
    festival: fest?.id ?? null,
    // The first Boss (the Dirt Pits) fights without an arena rule: a gentler first wall.
    lossGold: c.lossGold, oppPower: arenaPower(run, tier, s), oppDecor: c.oppDecor, debuff: s === 2 && tier > 1 ? arena.debuff : null,
    conquered: arena.conquered,
  };
}
export const currentBout = (run) => boutFor(run, run.topTier);

// The coming tournaments in your top arena, up to its Boss: [{ week, weeks, stage, boss, festival }].
// Assumes each month's bout is settled (a win, loss or skip moves the circuit on).
export function upcomingBouts(run) {
  const tier = run.topTier;
  const out = [];
  let week = run.week;
  if (!(run.bouts && run.boutPending)) week += run.bouts ? 1 : 0; // this week's bout is settled: start from next week
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
// ---------- Brackets: three matches per tournament from the Silver Coliseum up ----------

export const hasBracket = (tier) => tier >= BRACKET.fromTier;

// Draw every open arena's bracket for this tournament week.
export function drawBrackets(run) {
  for (const t of Object.keys(run.bouts ?? {})) bracketFor(run, Number(t));
}

// The bracket for an arena this tournament week: { foes: [quarter, semi], round, fighterId, buyIn }.
function bracketFor(run, tier) {
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
      f.power -= effectivePower(f) - (finalPower + d); // weaker than the Final opponent by d, gear and all
      f.house = houseForArena(run, tier).id;
      foes.push(f);
    }
    // The rival champion can be in any round, not only the Final you rarely reach (playtest LLM-11).
    const k = champ ? int(rivalsRng(run), 0, 2) : 2;
    if (k < 2) {
      const f = foes[k];
      foes[k] = champ;
      if (!RIVAL.earlyAtFinal) champ.power += effectivePower(f) + champ.rivalBonus - effectivePower(champ); // that round's strength, plus their bonus
      f.power += finalPower - effectivePower(f); // the Final keeps its usual strength
      run.arenas[tier].opponent = f;
    }
    remember(run, ...foes);
    run.brackets[tier] = { foes, round: 0, fighterId: null, buyIn: 0 };
  }
  return run.brackets[tier];
}
// How much stronger a known fighter must be to be jeered here: tournament crowds forgive more.
// Returns Infinity for a bracket's Quarter- or Semi-final (beating the field is the point).
export function crushingGapFor(run, tier) {
  if (!hasBracket(tier) || !run.bouts?.[tier]) return ECONOMY.crushingGap;
  return (bracketOf(run, tier)?.round ?? 0) < 2 ? Infinity : ECONOMY.bracketCrushingGap;
}
export const bracketOf = (run, tier) => (hasBracket(tier) && run.bouts?.[tier] ? run.brackets?.[tier] ?? null : null);
export const bracketRound = (run, tier) => BRACKET.rounds[bracketOf(run, tier)?.round ?? 0];
// The bracket as the fight screen shows it: each round's opponent and which round you're on (playtest #7).
export function bracketView(run, tier) {
  const b = bracketOf(run, tier);
  if (!b) return null;
  const foes = [...b.foes, run.arenas[tier].opponent];
  return { round: b.round, rounds: BRACKET.rounds.map((label, i) => ({ label, name: foes[i].name, power: effectivePower(foes[i]) })) };
}

// Who you fight next in this arena: a bracket's Quarter- or Semi-final opponent, else the arena's.
// Read-only (safe to call while rendering): brackets are drawn when the tournament week begins.
export function opponentFor(run, tier = run.topTier) {
  const b = run.bouts?.[tier] === 'open' ? bracketOf(run, tier) : null;
  return b && b.round < 2 ? b.foes[b.round] : run.arenas[tier].opponent;
}

// Opponents get faster as you climb (+1 Speed per tier, +1 more for Bosses), so Speed stays worth training.
export const opponentSpeed = (run, bout = currentBout(run)) => 3 + Math.min(bout.tier, CIRCUITS.length) - 1 + (bout.boss ? 1 : 0);

// Higher tiers field seasoned opponents: perks (tier − 1, +1 for Bosses) and gear from Tier 2.
function seasonOpponent(run, f, bout) {
  const rng = run.rng.opponents;
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

function newOpponent(run, tier) {
  const arena = run.arenas[tier];
  const bout = boutFor(run, tier);
  if (bout.boss && arena.rival) {
    arena.opponent = arena.rival; // a Boss who beat you comes back, stronger
    return;
  }
  const champ = rivalChampionFor(run, bout); // 5.4.0: the archrival's champion
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
  // Every opponent fights for a rival house; the Grand Tournament's champion is the leading rival's.
  f.house = houseForArena(run, tier).id;
  arena.opponent = f;
  remember(run, f);
}

// ---------- The Patron Lounge (fun idea #7) ----------

const monthOf = (week) => `${dateOf(week).year}-${dateOf(week).month}`;
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
  const gain = Math.min(LOUNGE.maxInfluence, 1 + Math.floor((star?.renown ?? 0) / LOUNGE.renownPer));
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
  if (id === 'purgePrisons') run.liaisonOffers = (run.liaisonOffers ?? []).filter((f) => !f.political); // the cells are emptied
}

// ---------- Bonds between fighters (fun idea #5) ----------

export const bondmate = (run, f) => (f.bond ? run.roster.find((x) => x.id === f.bond.id) ?? null : null);
// Two fighters without a bond become bonded (one bond each).
function formBond(run, a, b, how = 'fightDay') {
  if (a.bond || b.bond || a === b) return;
  a.bond = { id: b.id, name: b.name, since: run.week };
  b.bond = { id: a.id, name: a.name, since: run.week };
  for (const [x, y] of [[a, b], [b, a]]) chronicle(run, x, `Bonded with ${y.name}.`);
  log(run, `${a.name} and ${b.name} have become fast friends: each is happier while the other is in the house.`, 'good');
  // 5.4.0 (the designer: say when a friendship forms): a short scene.
  // The pair's lines vary by who they are; the steward explains friendship in full only the first time (playtest LLM-11).
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
// Two fighters who both won on the same fight day may bond.
function bondOverFightDay(run) {
  const winners = [...new Set(run.history.filter((h) => h.week === run.week - 1 && h.won && !h.died).map((h) => h.fighterId))]
    .map((id) => run.roster.find((f) => f.id === id)).filter((f) => f && !f.bond);
  if (winners.length >= 2) formBond(run, winners[0], winners[1]);
}
// Each week: a mentor teaches; a bond whose partner has gone ends (in grief, if they died).
function tendBonds(run) {
  for (const f of run.roster) {
    if (!f.bond) continue;
    const mate = bondmate(run, f);
    if (mate) {
      if (mate.level - f.level >= BOND.mentorGap) gainXp(run, f, BOND.mentorXp);
      continue;
    }
    const dead = run.fallen.some((x) => x.id === f.bond.id);
    if (dead) {
      f.mood = { n: (f.mood?.n ?? 0) + BOND.grief, weeks: MOOD_WEEKS };
      chronicle(run, f, `Grieved for ${f.bond.name}.`);
      log(run, `${f.name} grieves for ${f.bond.name}.`, 'bad');
    }
    delete f.bond;
  }
}

// ---------- The Emperor's demands (fun idea #4) ----------

// Has this month's demand been met? Judged from the fights since it was issued.
const DEMAND_MET = {
  topWin: (h) => h.some((x) => x.top && x.won),
  bloodied: (h) => h.some((x) => x.bloodied || (DEMAND.bloodiedKills && x.won && (x.kill || x.verdict === 'kill'))), // a death counts too (the designer, 5.4.0)
  kill: (h) => h.some((x) => x.verdict === 'kill' || (x.won && x.kill)),
  spare: (h) => h.some((x) => x.verdict === 'spare'),
  twoArenas: (h) => new Set(h.filter((x) => x.won).map((x) => x.tier)).size >= 2,
};
export const demandMet = (run) => Boolean(run.demand) && DEMAND_MET[run.demand.id](run.history.filter((x) => x.week >= run.demand.week));

// At a month's start, the Emperor may set a goal for that month's fight day (its own dice, so nothing else shifts).
function issueDemand(run) {
  if (run.demand || run.week < DEMAND.fromWeek || isWinter(run.week)) return;
  run.rng.emperor ??= createRng(deriveSeed(run.seed, 9));
  if (next(run.rng.emperor) >= DEMAND.chance) return;
  const options = Object.keys(DEMANDS).filter((id) => id !== 'twoArenas' || unlockedTiers(run).length >= 2);
  run.demand = { id: pick(run.rng.emperor, options), week: run.week };
  log(run, `The Emperor demands: ${DEMANDS[run.demand.id].goal}, by the end of this month's fight day.`, 'event');
}

// When the tournament week ends, the Emperor judges.
function judgeDemand(run) {
  if (!run.demand) return;
  const tier = Math.min(run.topTier, CIRCUITS.length);
  const met = demandMet(run);
  if (met) {
    run.gold += DEMAND.goldPerTier * tier;
    changeFavor(run, DEMAND.favor, 'the Emperor\'s demand, met');
    log(run, `The Emperor is pleased: +${DEMAND.goldPerTier * tier} Gold from the palace.`, 'good');
  } else {
    changeFavor(run, DEMAND.missFavor, 'the Emperor\'s demand, unmet');
  }
  // The last judgement, for the page's Emperor scene (the designer, 5.4.0: say when a demand fails).
  run.demandResult = { id: run.demand.id, issued: run.demand.week, met, gold: met ? DEMAND.goldPerTier * tier : 0, favor: met ? DEMAND.favor : DEMAND.missFavor };
  run.demand = null;
}

// ---------- The Emperor's summons (the designer, 5.4.2) ----------

// At a month's start, once a career, before the Imperial Coliseum is open: the Emperor wants one of your fighters there.
function summonsMonth(run) {
  if (run.summons || run.summonsDone || run.week < SUMMONS.fromWeek || run.arenas[SUMMONS.tier] || isWinter(run.week)) return;
  run.rng.summons ??= createRng(deriveSeed(run.seed, 12));
  if (next(run.rng.summons) >= SUMMONS.chance) return;
  run.summons = { week: run.week };
  log(run, `The Emperor summons one of your fighters to ${arenaName(SUMMONS.tier)} on this month's fight day. Send someone, or refuse him (${SUMMONS.refuseFavor} Favour).`, 'warn');
  talk(run, `summons-${run.week}`, [{ speaker: 'emperor', text: SUMMONS_LINES.ask }, { speaker: 'steward', text: SUMMONS_LINES.steward(SUMMONS.refuseFavor) }], { now: true });
}
export const SUMMONS_ORDERS = ['yield', 'death'];
export function summonsBlocker(run, id, order) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!run.summons) return 'The Emperor has summoned nobody.';
  if (!run.bouts) return 'The summons is for fight day.';
  if (!SUMMONS_ORDERS.includes(order)) return 'Tell them to yield at the Death Gate, or to fight to the death.';
  const f = findFighter(run, id);
  if (!f) return 'Choose a fighter from your roster.';
  if (foughtThisWeek(run).includes(id)) return `${f.name} already fought this week.`;
  if (f.pendingPerks.length) return `${f.name} levelled up: choose a perk first.`;
  if (f.morale < MORALE.mutinous) return `${f.name} is mutinous and refuses to fight.`;
  return null;
}
// Sends a fighter: the match is played at once, with the suggested tactic each round; `yield` capitulates at the Death Gate.
export function answerSummons(run, id, order) {
  assertOk(summonsBlocker(run, id, order));
  const fighter = findFighter(run, id);
  const r = run.rng.summons ??= createRng(deriveSeed(run.seed, 12));
  const bout = { tier: SUMMONS.tier, boss: false, oppPower: arenaPower(run, SUMMONS.tier, 0) };
  const opp = createFighter(r, { id: newId(run, 'o'), power: bout.oppPower, decorLevel: CIRCUITS[SUMMONS.tier - 1].oppDecor, takenNames: takenNames(run), classes: run.setup?.classes });
  opp.speed = opponentSpeed(run, bout);
  seasonOpponent(run, opp, bout);
  opp.house = houseForArena(run, SUMMONS.tier).id;
  remember(run, opp);
  // The fighter's own state counts as in any bout: overtrained, the festival, a feud or debt with the opponent's house.
  const house = houseOf(run, opp);
  const m = createMatch({ a: fighter, b: opp, rng: r, overtrained: fighter.stress >= STRESS.overtrained, festival: festivalOn(run.week)?.id ?? null,
    grudge: house?.feud > 0 ? 1 : house?.owed > 0 ? -1 : 0, vengeance: house?.vengeance > 0, relics: relicFight(run, fighter) });
  while (!m.over) {
    if (order === 'yield' && canThrowTowel(m) && mortalDanger(m.a)) throwTowel(m);
    else playRound(m, { stance: suggestTactic(m) });
  }
  const newInjuries = m.a.f.injuries.filter((i) => i.weeksLeft === undefined).map((i) => INJURY_BY_TAG[i.tag].name);
  fighter.injuries = m.a.f.injuries.map(({ suppressed, ...i }) => ({ ...i, weeksLeft: i.weeksLeft ?? HEAL_WEEKS[i.tag] }));
  fighter.alive = m.a.f.alive;
  fighter.stress = clampStress(fighter.stress + STRESS.fight);
  const won = m.result.winner === 'A';
  const reason = m.result.reason;
  const name = `${arenaName(SUMMONS.tier)} · the Emperor's summons`;
  const summary = { week: run.week, tier: SUMMONS.tier, name, summons: true, boss: false, top: false, won, reason, fighter: fighter.name, fighterId: fighter.id, opponent: opp.name, oppPower: effectivePower(opp), died: !fighter.alive, kill: won && reason === 'death', gold: 0, prestige: 0, favor: 0, renown: 0, injuries: fighter.alive ? newInjuries : [] };
  const favorBefore = run.favor;
  let line;
  if (won) {
    changeFavor(run, SUMMONS.winFavor, 'won on the Imperial sand at his summons');
    summary.renown = SUMMONS.winRenown;
    chronicle(run, fighter, `Summoned to ${arenaName(SUMMONS.tier)} by the Emperor, and beat ${opp.name}.`);
    line = SUMMONS_LINES.won(fighter.name);
  } else if (!fighter.alive) {
    chronicle(run, fighter, `Summoned to ${arenaName(SUMMONS.tier)} by the Emperor, and killed by ${opp.name}.`);
    stripFighter(run, fighter);
    run.roster = run.roster.filter((f) => f !== fighter);
    run.fallen.push({ ...fighter, diedWeek: run.week, arena: true }); // a body the Temple of Vulcan could raise
    for (const f of run.roster) bumpMorale(f, MORALE.allyDeath);
    log(run, `${fighter.name} died on the Imperial sand. The house mourns; their gear returns to the storeroom.`, 'bad');
    line = SUMMONS_LINES.died(fighter.name);
  } else if (reason === 'towel') {
    changeFavor(run, SUMMONS.yieldFavor, 'yielded on the Imperial sand');
    chronicle(run, fighter, `Summoned to ${arenaName(SUMMONS.tier)} by the Emperor; yielded to ${opp.name} and lived.`);
    line = SUMMONS_LINES.yielded(fighter.name);
  } else {
    changeFavor(run, SUMMONS.surviveFavor, 'survived three rounds on the Imperial sand');
    summary.renown = SUMMONS.surviveRenown;
    chronicle(run, fighter, `Summoned to ${arenaName(SUMMONS.tier)} by the Emperor; lost to ${opp.name}, but stood to the end.`);
    line = SUMMONS_LINES.survived(fighter.name);
  }
  if (fighter.alive) {
    fighter.renown += summary.renown;
    gainXp(run, fighter, won ? XP.win : XP.loss);
    if (won) faceFear(run, fighter, m.b);
    if (won && reason === 'death') {
      fighter.kills = (fighter.kills ?? 0) + 1;
      run.graveyard = [...(run.graveyard ?? []), opp.name]; // the dead don't come back
    }
  }
  summary.favor = run.favor - favorBefore;
  run.history.push(summary);
  run.summons = null;
  run.summonsDone = true;
  log(run, `The Emperor's summons: ${fighter.name} (Power ${effectivePower(fighter)}) against ${opp.name} (Power ${summary.oppPower}): ${won ? 'won' : !summary.died ? (reason === 'towel' ? 'yielded at the Death Gate' : 'lost, but survived') : 'killed'}${fighter.alive && newInjuries.length ? `, with ${newInjuries.join(', ')}` : ''}.${[summary.favor ? ` Favour ${summary.favor > 0 ? '+' : '−'}${Math.abs(summary.favor)}` : '', summary.renown ? ` +${summary.renown} Renown` : ''].filter(Boolean).join(',')}${summary.favor || summary.renown ? '.' : ''}`, won ? 'good' : summary.died ? 'bad' : 'event');
  talk(run, `summons-done-${run.week}`, [{ speaker: 'emperor', text: line }], { now: true });
  checkLoss(run);
  return summary;
}
export function refuseSummonsBlocker(run) {
  return idleBlocker(run) ?? (run.summons ? null : 'The Emperor has summoned nobody.');
}
export function refuseSummons(run) {
  assertOk(refuseSummonsBlocker(run));
  changeFavor(run, SUMMONS.refuseFavor, 'refused the Emperor\'s summons');
  run.summons = null;
  run.summonsDone = true;
  log(run, `You refuse the Emperor's summons. Favour ${SUMMONS.refuseFavor}.`, 'bad');
  talk(run, `summons-refused-${run.week}`, [{ speaker: 'emperor', text: SUMMONS_LINES.refused }], { now: true });
  checkLoss(run);
}

// ---------- Nemeses (fun idea #1) ----------

// A nemesis may come back as a new (non-Boss) opponent, stronger for every win over your house.
function returningNemesis(run, bout) {
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

// An opponent who beats one of yours becomes (or grows as) a nemesis.
function recordNemesis(run, opp, tier, fighter, boss) {
  if (boss || opp.rival) return; // a Boss who beats you already comes back (arena.rival)
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
  n.nemesis.beat = [...new Set([...(n.nemesis.beat ?? []), fighter.id])]; // for a fighter's revenge (5.4.0)
  if (!fighter.alive) {
    n.nemesis.kills += 1;
    n.nemesis.victims = [...n.nemesis.victims, fighter.name];
  }
}

// Beating a nemesis: the crowd has waited for this.
function nemesisFalls(run, opp, fighter, tier, summary) {
  const gold = NEMESIS.goldPerTier * Math.min(tier, CIRCUITS.length);
  run.nemeses = (run.nemeses ?? []).filter((n) => n.id !== opp.nemesis.of);
  summary.gold += gold;
  summary.renown += NEMESIS.renown;
  summary.nemesis = `${opp.name} ${opp.nemesis.epithet}`;
  changeFavor(run, NEMESIS.favor, `${opp.name} ${opp.nemesis.epithet} is beaten`);
  chronicle(run, fighter, `Beat the house's nemesis, ${opp.name} ${opp.nemesis.epithet}${opp.nemesis.victims.length ? `, who had killed ${opp.nemesis.victims.join(' and ')}` : ''}.`);
  log(run, `${fighter.name} beats ${opp.name} ${opp.nemesis.epithet}! +${gold} Gold, +${NEMESIS.renown} Renown. The house breathes again.`, 'good');
}

// ---------- Quests (5.4.0, docs/plan-5.4-quests.md) ----------

// Dialogue the rules decide on: the page plays each entry once (by key), the text port prints it. Beats: { speaker, text, fighterId? }.
// At most QUESTS.talkPerWeek scenes a week; the rest wait, in order, for the weeks after (playtest LLM-11: 13 lines in one week).
// `now`: a scene that can't wait (the rival champion on this month's card).
const TALK_MEMORY = 30;
function talk(run, key, beats, { now = false } = {}) {
  if ([...(run.talk ?? []), ...(run.talkLater ?? [])].some((t) => t.key === key)) return;
  if (!now && (run.talk ?? []).filter((t) => t.week === run.week).length >= QUESTS.talkPerWeek) {
    run.talkLater = [...(run.talkLater ?? []), { key, beats }];
    return;
  }
  run.talk = [...(run.talk ?? []), { key, week: run.week, beats }].slice(-TALK_MEMORY);
}
// At a new week's start: the scenes that waited go first.
function releaseTalk(run) {
  const later = run.talkLater ?? [];
  run.talkLater = [];
  for (const t of later) talk(run, t.key, t.beats);
}
const moodShift = (f, n) => { f.mood = { n: (f.mood?.n ?? 0) + n, weeks: MOOD_WEEKS }; };
const questState = (run) => (run.quests ??= { steward: null, stewardIndex: 0, rebel: [] });

// Everything a quest waits on, checked at the end of every week and after every game action (src/game.js). Idempotent.
export function checkQuests(run) {
  if (!run || run.inMatch) return;
  stewardTasks(run);
  if (run.status !== 'active') return;
  checkWants(run);
  checkRebelQuests(run);
}

// The steward's assignments: one at a time, in order; one already done when its turn comes is skipped quietly.
function stewardTasks(run) {
  const q = questState(run);
  if (run.week < QUESTS.stewardFromWeek) return;
  // The list grew in 5.4.1: follow the assignment by its id, so an older save's index lands on the right task.
  if (q.steward && STEWARD_TASKS.some((t) => t.id === q.steward)) q.stewardIndex = STEWARD_TASKS.findIndex((t) => t.id === q.steward);
  if (q.steward) {
    const task = STEWARD_TASKS.find((t) => t.id === q.steward);
    if (!task?.test(run)) return;
    const paid = paySteward(run, [task]);
    q.steward = null;
    q.stewardIndex += 1;
    log(run, `The steward's assignment is done: ${task.goal}.${paid ? ` +${paid}.` : ''}`, 'good');
    talk(run, `steward-done-${task.id}`, [{ speaker: 'steward', text: `${stewardDone(task)}${paid ? ` The house gains ${paid}.` : ''}` }]);
  }
  if (run.status !== 'active') return;
  // Assignments already done count, and pay, together (not those done before the steward's first assignment).
  const already = [];
  while (q.stewardIndex < STEWARD_TASKS.length && STEWARD_TASKS[q.stewardIndex].test(run)) already.push(STEWARD_TASKS[q.stewardIndex++]);
  const late = already.filter((t) => t.id !== 'grand');
  if (late.length && q.introduced) {
    const paid = paySteward(run, late);
    log(run, `The steward's list: already done: ${late.map((t) => t.goal).join('; ')}.${paid ? ` +${paid}.` : ''}`, 'good');
    talk(run, `steward-already-${late[0].id}`, [{ speaker: 'steward', text: `${stewardAlready(late.map((t) => t.goal.charAt(0).toLowerCase() + t.goal.slice(1)))}${paid ? ` The house gains ${paid}.` : ''}` }]);
  }
  const task = STEWARD_TASKS[q.stewardIndex];
  if (!task) return;
  q.steward = task.id;
  log(run, `The steward's assignment: ${task.goal}.`, 'event');
  const reward = stewardRewardText(task);
  talk(run, `steward-${task.id}`, [
    ...(q.stewardIndex === 0 || !q.introduced ? [{ speaker: 'steward', text: STEWARD_INTRO }] : []),
    { speaker: 'steward', text: task.say },
    { speaker: 'steward', text: `Your assignment: ${task.goal}.${reward ? ` Do it, and the house gains ${reward}.` : ''}` },
  ]);
  q.introduced = true;
}
// What an assignment pays: Gold (scaled by QUESTS.goldScale) and QUESTS.prestige Prestige (the Grand Tournament pays nothing).
export const stewardGold = (task) => Math.round((task?.gold ?? 0) * QUESTS.goldScale);
export const stewardPrestige = (task) => (task && task.id !== 'grand' ? QUESTS.prestige : 0);
const rewardText = (gold, prestige) => [gold ? `${gold} Gold` : '', prestige ? `${prestige} Prestige` : ''].filter(Boolean).join(' and ');
export const stewardRewardText = (task) => rewardText(stewardGold(task), stewardPrestige(task));
// Pays for these assignments (and a House level they reach); returns what was paid, in words.
function paySteward(run, tasks) {
  const gold = tasks.reduce((n, t) => n + stewardGold(t), 0);
  const prestige = tasks.reduce((n, t) => n + stewardPrestige(t), 0);
  run.gold += gold;
  run.prestige += prestige;
  const before = run.prestigeLevel;
  run.prestigeLevel = prestigeLevelFor(run.prestige, run.prestigeLevel);
  if (run.prestigeLevel > before) log(run, `House Prestige level ${run.prestigeLevel}! New buildings and room plots unlocked.`, 'event');
  return rewardText(gold, prestige);
}
export const stewardTask = (run) => STEWARD_TASKS.find((t) => t.id === run.quests?.steward) ?? null;

// ---- What fighters want ----

// The want a fighter could have of this kind now (its details), or null.
export function wantFor(run, f, id) {
  if (f.kind === 'revenant') return null;
  if (id === 'revenge') {
    // Not a nemesis fighting in an arena this fighter is Champion of: a win there costs Favour (playtest LLM-11).
    const n = (run.nemeses ?? []).find((x) => (x.nemesis.beat ?? []).includes(f.id) && !isChampionOf(f, x.nemesis.tier));
    return n ? { name: `${n.name} ${n.nemesis.epithet}`, of: n.id } : null;
  }
  // Only a Championship within reach: no more than `titleReach` Power below the arena's Boss (playtest LLM-11).
  if (id === 'title') return f.level >= 3 && run.topTier <= CIRCUITS.length && !isChampionOf(f, run.topTier)
    && effectivePower(f) >= arenaPower(run, run.topTier) - FIGHTER_WANTS.titleReach ? { tier: run.topTier, arena: championTitle(run.topTier).replace(/^Champion of /, '') } : null;
  if (id === 'room') {
    const missing = FIGHTER_WANTS.roomItems.filter((x) => !(f.decor[x] > 0));
    if (!missing.length) return null;
    // Varied by fighter and by month, without a dice roll (playtest LLM-11: always a Bathhouse; wants come at month starts).
    const k = missing[([...f.id].reduce((n, ch) => n + ch.charCodeAt(0), 0) + Math.floor(run.week / 4)) % missing.length];
    return { key: k, item: DECOR[k].name };
  }
  if (id === 'mentor') {
    if ((f.level ?? 1) > 2 || f.bond) return null;
    // Not a pair who both won last fight day: they bond this week anyway (playtest LLM-11: asked and met at once).
    const won = new Set(run.history.filter((h) => h.week === run.week - 1 && h.won && !h.died).map((h) => h.fighterId));
    const g = run.roster.find((x) => x !== f && x.level >= 4 && !x.bond && x.kind !== 'revenant' && !(won.has(f.id) && won.has(x.id)));
    return g ? { name: g.name, of: g.id } : null;
  }
  // Not the house's strongest: a champion mid-climb can't say yes, so the ask was no choice (playtest LLM-13).
  if (id === 'retire') return f.level >= 5 && (f.titles ?? []).length >= 2 && !retireBlocker(run, f.id)
    && run.roster.some((x) => x !== f && effectivePower(x) >= effectivePower(f)) ? {} : null;
  return null;
}
// At a month's start, perhaps a new want (its own dice, so nothing else shifts).
function wantsMonth(run) {
  run.rng.wants ??= createRng(deriveSeed(run.seed, 10));
  const r = run.rng.wants;
  if (run.roster.filter((f) => f.want).length >= FIGHTER_WANTS.max || next(r) >= FIGHTER_WANTS.chance) return;
  const options = [];
  for (const f of run.roster) if (!f.want) for (const id of Object.keys(WANTS)) { const w = wantFor(run, f, id); if (w) options.push({ f, id, w }); }
  if (!options.length) return;
  const { f, id, w } = pick(r, options);
  const def = WANTS[id];
  f.want = { id, ...w, since: run.week, until: def.weeks ? run.week + def.weeks : null };
  log(run, `${f.name} wants something: ${def.label(f.want)}.`, 'event');
  talk(run, `want-${f.id}-${run.week}`, [{ speaker: 'fighter', fighterId: f.id, text: def.ask(f.want) }]);
}
function wantMet(run, f, w) {
  if (w.id === 'revenge') return run.history.some((h) => h.week >= w.since && h.fighterId === f.id && h.won && h.nemesis === w.name);
  if (w.id === 'title') return isChampionOf(f, w.tier);
  if (w.id === 'room') return f.decor[w.key] > 0;
  if (w.id === 'mentor') return f.bond?.id === w.of;
  return false; // retire: met in retire()
}
// A want that can no longer happen goes quietly (no sulk).
function wantImpossible(run, f, w) {
  if (w.id === 'revenge') return !(run.nemeses ?? []).some((n) => n.id === w.of);
  if (w.id === 'mentor') return !run.roster.some((x) => x.id === w.of) || (f.bond && f.bond.id !== w.of);
  return false;
}
function wantDone(run, f) {
  const def = WANTS[f.want.id];
  moodShift(f, FIGHTER_WANTS.metMorale);
  f.renown += FIGHTER_WANTS.metRenown;
  gainXp(run, f, FIGHTER_WANTS.metXp);
  log(run, `${f.name} got what they wanted: ${def.label(f.want)}. +${FIGHTER_WANTS.metRenown} Renown, +${FIGHTER_WANTS.metXp} XP, and their spirits lift.`, 'good');
  chronicle(run, f, `Got what they wanted: ${def.label(f.want)}.`);
  talk(run, `want-done-${f.id}-${f.want.since}`, [{ speaker: 'fighter', fighterId: f.id, text: def.thanks(f.want) }]);
  delete f.want;
}
function checkWants(run) {
  for (const f of run.roster) {
    const w = f.want;
    if (!w) continue;
    if (wantMet(run, f, w)) wantDone(run, f);
    else if (wantImpossible(run, f, w)) delete f.want;
    else if (w.until !== null && run.week > w.until) {
      moodShift(f, FIGHTER_WANTS.missMorale);
      log(run, `${f.name} gives up on what they wanted (${WANTS[w.id].label(w)}).`, 'bad');
      talk(run, `want-lapsed-${f.id}-${w.since}`, [{ speaker: 'fighter', fighterId: f.id, text: WANTS[w.id].sulk(w) }]);
      delete f.want;
    }
  }
}

// ---- The rival house ----

// Your archrival: the house that started with the most Glory (no dice, so older saves agree).
export function archrival(run) {
  if (!run.houses?.length) return null;
  run.archrival ??= [...run.houses].sort((a, b) => b.glory - a.glory)[0].id;
  return run.houses.find((h) => h.id === run.archrival) ?? null;
}
const rivalsRng = (run) => (run.rng.rivals ??= createRng(deriveSeed(run.seed, 11)));

// At a month's start: the archrival names a champion (from Bronze), and may eye the Market's best fighter.
function rivalMonth(run) {
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
// At the end of the month's first week the archrival buys the fighter it eyed, if you didn't.
function rivalPoach(run) {
  if (!run.poach || run.week !== run.poach.week) return;
  const h = archrival(run);
  const f = run.market.find((x) => x.id === run.poach.id);
  if (f && h) {
    run.market = run.market.filter((x) => x !== f);
    log(run, RIVAL_LINES.bought(h.name, f.name), 'bad');
  }
  run.poach = null;
}
// The archrival's champion, ready to face you in this bout (a top-arena regular, not a Boss), or null.
function rivalChampionFor(run, bout) {
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
// After a match against the rival champion.
function rivalChampionResult(run, opp, fighter, tier, won, summary) {
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
// The rival champion died (in the match, or by thumbs down): the house will name another.
function rivalChampionKilled(run, name) {
  const h = archrival(run);
  if (!run.rivalChampion || !h) return;
  run.rivalChampion = null;
  talk(run, `rival-killed-${run.week}-${name}`, [{ speaker: 'rival', text: RIVAL_LINES.killed(h.name, name) }]);
}

// ---- The resistance's requests ----

// At a month's start, while the plot runs: the Gallery first, then lobbying, from REBEL_QUEST.afterMark weeks after the Mark.
function rebelQuestsMonth(run) {
  const p = run.plot;
  if (!plotActive(run) || p.stage === 'mark' || run.week - (p.markWeek ?? run.week) < REBEL_QUEST.afterMark) return;
  const q = questState(run);
  const asker = run.roster.find((f) => f.political);
  const say = (text) => (asker ? { speaker: 'fighter', fighterId: asker.id, text } : { speaker: 'narrator', text: `A note is pushed under your door: "${text}"` });
  if (!p.galleryAsked) {
    p.galleryAsked = true;
    const quest = { id: 'gallery', since: run.week, until: run.week + REBEL_QUESTS.gallery.weeks };
    q.rebel.push(quest);
    log(run, `The cause asks: ${REBEL_QUESTS.gallery.goal(quest)}.`, 'event');
    talk(run, 'rebel-gallery', [say(REBEL_QUESTS.gallery.ask)]);
    return;
  }
  if (!p.lobbyAsked && !q.rebel.some((x) => x.id === 'gallery')) {
    const policy = Object.entries(LOUNGE.policies).find(([id, pol]) => pol.lean === 'reformist' && !hasPolicy(run, id));
    if (!policy) return;
    p.lobbyAsked = true;
    const quest = { id: 'lobby', policy: policy[0], name: policy[1].name, since: run.week, until: run.week + REBEL_QUESTS.lobby.weeks };
    q.rebel.push(quest);
    log(run, `The cause asks: ${REBEL_QUESTS.lobby.goal(quest)}.`, 'event');
    talk(run, 'rebel-lobby', [say(REBEL_QUESTS.lobby.ask(quest, maxLevel(run, 'lounge') > 0))]);
  }
}
function rebelQuestMet(run, quest) {
  if (quest.id === 'gallery') return maxLevel(run, 'gallery') > 0;
  if (quest.id === 'lobby') return hasPolicy(run, quest.policy);
  return false;
}
function checkRebelQuests(run) {
  const q = run.quests;
  if (!q?.rebel?.length) return;
  if (!plotActive(run)) { q.rebel = []; return; }
  const p = run.plot;
  const asker = run.roster.find((f) => f.political);
  const say = (text) => (asker ? { speaker: 'fighter', fighterId: asker.id, text } : { speaker: 'narrator', text });
  for (const quest of [...q.rebel]) {
    const def = REBEL_QUESTS[quest.id];
    if (rebelQuestMet(run, quest)) {
      const trust = quest.id === 'gallery' ? REBEL_QUEST.galleryTrust : REBEL_QUEST.lobbyTrust;
      // Trust past the cap isn't wasted (playtest LLM-11): the cause covers your tracks instead.
      const over = Math.max(0, p.trust + trust - PLOT.maxTrust);
      p.trust = clamp(p.trust + trust, 0, PLOT.maxTrust);
      if (over) changeSuspicion(run, -REBEL_QUEST.overflowSuspicion * over);
      log(run, `The cause's request is done: ${def.goal(quest)}.`, 'good');
      talk(run, `rebel-done-${quest.id}`, [say(typeof def.thanks === 'function' ? def.thanks(quest) : def.thanks)]);
    } else if (run.week > quest.until) {
      p.trust = clamp(p.trust + REBEL_QUEST.missTrust, 0, PLOT.maxTrust);
      log(run, `The cause's request lapsed: ${def.goal(quest)}.`, 'bad');
      talk(run, `rebel-lapsed-${quest.id}`, [say(typeof def.sulk === 'function' ? def.sulk(quest) : def.sulk)]);
    } else continue;
    q.rebel = q.rebel.filter((x) => x !== quest);
    advancePlot(run);
  }
}
// The Whispering Gallery's readout: how much the palace suspects, and what the rising still needs. Null without the Gallery.
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
  // In the player's words, not the stage ids (playtest LLM-11), with a line for when nothing is left to do.
  const label = { mark: 'watching you', favours: 'testing you with small favours', cause: 'gathering for the cause', ready: 'ready: it waits for the Emperor\'s games (the Grand Tournament)', ended: 'over' }[stage] ?? stage;
  const waiting = !needs.length && (stage === 'favours' || stage === 'cause') ? 'everything is in place: the next step comes at the month\'s turn, or with the cause\'s next message' : null;
  return { suspicion: Math.round(p.suspicion), watch: s.watch, informer: s.informer, raid: s.raid, stage, label, needs, waiting };
}

function openArena(run, tier) {
  run.arenas[tier] = { tier, stage: tier === GRAND_TIER ? 3 : 0, debuff: pick(run.rng.opponents, DEBUFF_IDS), opponent: null, conquered: false, rival: null };
  newOpponent(run, tier);
}

function restartCircuit(run, tier) {
  const arena = run.arenas[tier];
  arena.stage = 0;
  arena.debuff = pick(run.rng.opponents, DEBUFF_IDS);
  newOpponent(run, tier);
}

// Everything about a fighter that changes a match: the arena rule, Stress, and how well the opponent has studied them.
// Scouted: +1 opponent Power per consecutive month this fighter has fought in your top arena (max +3).
// Round-1 Power for this fighter and the arena's opponent, with everything that applies before tactics.
export function fightPowers(run, f, tier = run.topTier) {
  const m = createMatch({ a: f, b: opponentFor(run, tier), rng: createRng(0), ...matchOptions(run, f, tier) });
  return { mine: computePower(m.a, m.b, 1).total, theirs: computePower(m.b, m.a, 1).total };
}

export function matchOptions(run, f, tier = run.topTier) {
  return {
    debuff: boutFor(run, tier).debuff,
    boss: boutFor(run, tier).boss,
    earlyRound: (bracketOf(run, tier)?.round ?? 2) < 2,
    festival: boutFor(run, tier).festival,
    overtrained: f.stress >= STRESS.overtrained,
    scouted: tier === run.topTier ? Math.min(ECONOMY.scoutedMax, f.topStreak ?? 0) : 0,
    challenger: tier === run.topTier && tier >= ECONOMY.challengerFromTier ? Math.min(ECONOMY.challengerMax, Math.floor((f.renown ?? 0) / ECONOMY.challengerRenown)) : 0,
    // +1 for a house feuding with you; −1 for a house that owes you a life (you spared one of theirs against the crowd).
    grudge: !run.arenas[tier] ? 0 : houseOf(run, opponentFor(run, tier))?.feud > 0 ? 1 : houseOf(run, opponentFor(run, tier))?.owed > 0 ? -1 : 0,
    vengeance: Boolean(run.arenas[tier]) && houseOf(run, opponentFor(run, tier))?.vengeance > 0,
    // v6: in the coup Final, the people you freed are voices in the crowd for your champion.
    rebels: tier === GRAND_TIER && run.plot?.coup && !run.plot.ended && f.id === run.plot.champion ? coupBonus(run) : 0,
    relics: relicFight(run, f, { boss: boutFor(run, tier).boss }), // version 6
    oracle: oracleLevel(run), // version 6 (phase 4): the opponent's tells
  };
}

// ---------- Market, Liaison, Armourer ----------

// A short career (setup.short): Tournament → Boss in each arena, richer purses (SHORT).
export const isShort = (run) => Boolean(run?.setup?.short);
// A training week's gain, in whole points: a season trains at SHORT.train × (version 6, phase 5).
export const trainGain = (run, stat) => Math.round(TRAIN_GAIN[stat] * (isShort(run) ? SHORT.train : 1));
export const marketPrice = (run) => circuitInfo(run).price;
// What a fighter costs: the Liaison's own price, or the Market's plus RECRUIT.perLevel per level above 1.
export const liaisonOffer = (run, id) => (run.liaisonOffers ?? []).find((f) => f.id === id) ?? null;
export const recruitPrice = (run, f) => Math.max(1, (liaisonOffer(run, f.id) ? f.price : marketPrice(run) + RECRUIT.perLevel * ((f.level ?? 1) - 1)) - relicSum(run, 'recruitDiscount'));

// A seasoned recruit: arrives at a level from RECRUIT.levels for this arena tier, with a perk chosen for each level.
function season(run, rng, f) {
  const level = pick(rng, RECRUIT.levels[Math.min(run.topTier, CIRCUITS.length) - 1]);
  for (let l = 2; l <= level; l++) {
    const pool = Object.keys(PERKS).filter((p) => (PERKS[p].repeatable || !f.perks.includes(p)) && (!PERKS[p].req || PERKS[p].req(f)));
    const perk = pick(rng, pool);
    f.perks.push(perk);
    for (const [stat, n] of Object.entries(PERKS[perk].stat ?? {})) f[stat] += n;
    if (PERKS[perk].stat?.power) f.perkPower = (f.perkPower ?? 0) + PERKS[perk].stat.power;
  }
  Object.assign(f, { level, xp: level > 1 ? XP.levels[level - 2] : 0 });
  return f;
}

function refreshMarket(run) {
  const rng = run.rng.market;
  const bonus = circuitInfo(run).marketPower;
  const market = [];
  const make = (kind) => season(run, rng, createFighter(rng, { id: newId(run, 'f'), kind, bonusPower: bonus, takenNames: takenNames({ ...run, market: [] }, market), classes: run.setup?.classes }));
  for (let i = 0; i < ECONOMY.marketSize - 1; i++) market.push(make());
  market.splice(int(rng, 0, market.length), 0, make('orc'));
  run.market = market;
  remember(run, ...run.market);
}

// Liaison: Lv 1 offers a cheap weak convict with a Flesh Wound; Lv 2 a strong POW with a Concussion.
function refreshLiaison(run) {
  const lv = liaisonLevel(run);
  run.liaisonOffers = [];
  if (!lv) return;
  const elite = lv >= 2;
  // A convict is a Market-strength fighter, wounded and cheap; a prisoner of war is near the arena's Power and costs more
  // (playtest #7: 1-Gold convicts at Power 16 against the Market's 7–10 made the Liaison a no-brainer).
  const natural = (kind) => KINDS[kind].basePower + circuitInfo(run).marketPower;
  for (let i = 0; i < LIAISON.offers[Math.min(lv, LIAISON.offers.length) - 1]; i++) {
    const f = createFighter(run.rng.market, { id: newId(run, 'f'), takenNames: takenNames(run, run.liaisonOffers), classes: run.setup?.classes });
    f.power = elite ? Math.max(natural(f.kind), currentBout(run).oppPower + LIAISON.elitePower) : natural(f.kind);
    // A prisoner arrives at their arena's Power, but anything above a Market fighter's natural Power is training they
    // already did elsewhere: it counts toward the Trainer cap, so they can't train another full cap on top (playtest #7).
    const prior = Math.max(0, f.power - (KINDS[f.kind].basePower + circuitInfo(run).marketPower));
    Object.assign(f, { trained: Math.ceil(prior / trainGain(run, 'power')), trainedPower: prior }); // in training weeks (a season's give 2)
    f.injuries = [{ tag: elite ? 'concussed' : 'fleshWound', weight: 1, weeksLeft: HEAL_WEEKS[elite ? 'concussed' : 'fleshWound'] }];
    f.stress = elite ? 30 : 40;
    f.morale = elite ? 40 : 30;
    // Prisoners arrive seasoned in later arenas, like the Market's fighters (playtest #8: the Liaison only sold level 1s).
    season(run, run.rng.market, f);
    f.price = (elite ? LIAISON.elitePrice + LIAISON.elitePerTier * Math.min(run.topTier, CIRCUITS.length) : LIAISON.convictPrice) + RECRUIT.perLevel * (f.level - 1);
    f.origin = elite ? 'Prisoner of war' : 'Condemned convict';
    // Only the first may be political (its own dice, as before), so the hidden plot starts no more often than it did.
    if (i === 0) markPolitical(run, f);
    else f.record = [];
    run.liaisonOffers.push(f);
  }
  remember(run, ...run.liaisonOffers);
}

// ---------- v6: the hidden plot (docs/roadmap-v6.md; cards in src/plot.js) ----------
// Every roll here uses run.rng.plot, never the other streams, so a career that never meets the plot plays out
// exactly as it would without it.

// Some prisoners are secretly political. Nothing says so: their record carries clues, and they come cheap.
export function markPolitical(run, f) {
  const r = run.rng.plot;
  const year = dateOf(run.week).year;
  const chance = hasPolicy(run, 'purgePrisons') ? 0 : POLITICAL.chance * (hasPolicy(run, 'amnesty') ? 2 : 1);
  const political = next(r) < chance || (!hasPolicy(run, 'purgePrisons') && year >= POLITICAL.guaranteeYear && !run.politicalOffered);
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
  f.record = clues; // the prison record shown on the Liaison's card
  for (const c of clues) chronicle(run, f, `Prison record: ${c}`);
}

const plotActive = (run) => Boolean(run.plot) && !run.plot.ended;

// Buying a political prisoner starts the thread (or adds their cell to it).
function joinPlot(run, f) {
  if (!f.political) return;
  if (!run.plot) {
    run.plot = { stage: 'mark', trust: 0, suspicion: 0, refusals: 0, seen: [], cells: [], champion: null, freed: [], nextAt: run.week + int(run.rng.plot, ...PLOT.firstGap), ended: null };
  }
  if (!run.plot.cells.includes(f.political.cell)) run.plot.cells.push(f.political.cell);
}

const changeSuspicion = (run, n) => { run.plot.suspicion = clamp(run.plot.suspicion + n, 0, 100); };

// A freed prisoner becomes a contact outside the Ludus.
function addContact(run, name, cell, how) {
  run.plot.freed.push({ name, cell, how, week: run.week, caught: false });
  log(run, `${name} slips out of the city.`, 'event');
}

// Is a plot card due this week? Raids and the coup's eve come as soon as they can; the rest wait for nextAt.
function duePlotCard(run) {
  if (!plotActive(run) || !run.roster.length) return null;
  const ok = (e) => e.stages.includes(run.plot.stage) && (!e.when || e.when(run)) && (e.forced || e.repeat || !run.plot.seen.includes(e.id));
  const forced = PLOT_EVENTS.find((e) => e.forced && ok(e));
  if (forced) return forced;
  if (run.week < run.plot.nextAt) return null;
  const options = PLOT_EVENTS.filter((e) => !e.forced && ok(e));
  // In the Cause, what the coup still needs (arms, a champion) comes first, half the time (playtest #7: they took 60 weeks).
  const needed = options.filter((e) => e.needed?.(run));
  if (needed.length && next(run.rng.plot) < 0.5) return pick(run.rng.plot, needed);
  if (options.length) return pick(run.rng.plot, options);
  // Nothing new for this stage: the rebels ask again (never the Mark or the prefect's one-time offer).
  const again = PLOT_EVENTS.filter((e) => !e.forced && e.id !== 'theOffer' && e.stages.includes(run.plot.stage) && (!e.when || e.when(run)));
  return again.length ? pick(run.rng.plot, again) : null;
}

// After the ordinary event roll (so its dice are always drawn the same way), a due plot card takes the week's slot.
function rollPlot(run, recentBefore) {
  const e = duePlotCard(run);
  if (!e) return;
  const t = e.target(run, run.rng.plot);
  if (!t) return;
  if (run.event) run.recentEvents = recentBefore; // the ordinary card it replaces never happened
  run.event = { id: e.id, plot: true, ...t };
  run.plot.seen.push(e.id);
  run.plot.nextAt = run.week + int(run.rng.plot, ...PLOT.gap);
}

// The plot's month: suspicion drifts, contacts pay back, and the thread goes cold if nobody is left to carry it.
function plotMonth(run) {
  if (!plotActive(run)) return;
  const p = run.plot;
  const prisoners = run.roster.filter((f) => f.political).length;
  const contacts = p.freed.filter((c) => !c.caught);
  changeSuspicion(run, PLOT.suspicion.perPrisoner * prisoners + PLOT.suspicion.perContact * contacts.length - PLOT.suspicion.decay
    - (contacts.some((c) => c.cell === 'courier') ? PLOT.suspicion.courier : 0)
    + SPY.perMonth * run.roster.filter((f) => f.spy).length // a spy you kept keeps writing (5.4.0)
    - effectAt('gallery', maxLevel(run, 'gallery'))); // the Whispering Gallery hears the guards first (5.4.0)
  if (contacts.some((c) => c.cell === 'scribe') && !p.pass && next(run.rng.plot) < 1 / 3) {
    p.pass = true;
    log(run, 'A sealed letter arrives with no name on it. Inside: a pass bearing the Emperor\'s seal.', 'event');
  }
  const priest = contacts.find((c) => c.cell === 'priest');
  if (priest) {
    // A blessing lifts spirits: a good mood for the month, or a bad one eased (never prolonged).
    for (const f of run.roster) f.mood = f.mood?.n < 0 ? { ...f.mood, n: Math.min(0, f.mood.n + PLOT.priestMorale) } : { n: Math.max(f.mood?.n ?? 0, PLOT.priestMorale), weeks: MOOD_WEEKS };
    log(run, `A blessing from ${priest.name} reaches the barracks in secret. Spirits lift.`, 'good');
  }
  const courier = contacts.find((c) => c.cell === 'courier');
  if (courier && p.suspicion >= PLOT.suspicion.watch && next(run.rng.plot) < 0.5) log(run, `${courier.name} sends word: the Praetorians are watching another house this month.`, 'good');
  // The signs of suspicion: never a number, only what the house can see.
  if (p.suspicion >= PLOT.suspicion.cold) {
    changeFavor(run, -1, 'the palace grows cold toward your house');
    log(run, pick(run.rng.plot, SUSPICION_SIGNS.high), 'bad');
  } else if (p.suspicion >= PLOT.suspicion.watch && next(run.rng.plot) < 0.5) {
    log(run, pick(run.rng.plot, p.suspicion >= PLOT.suspicion.informer ? SUSPICION_SIGNS.mid : SUSPICION_SIGNS.low), 'warn');
  }
  if (p.stage === 'ready' && next(run.rng.plot) < 0.5) log(run, pick(run.rng.plot, SUSPICION_SIGNS.ready), 'event');
  // A champion who has fallen or left can't strike the blow: the rising looks for another.
  if (p.champion && !run.roster.some((f) => f.id === p.champion)) p.champion = null;
  if (p.stage === 'ready' && !p.champion) p.stage = 'cause';
  if (!prisoners && p.trust < PLOT.survivesAt && !['ready'].includes(p.stage)) return endPlot(run, 'cold');
  advancePlot(run); // trust earned before House level 3 counts once the house gets there
}

function endPlot(run, how) {
  run.plot.ended = how;
}

// The coup is off for this Grand Tournament, but the rebels are still ready for the next one.
function postponeCoup(run) {
  const p = run.plot;
  if (!p.coup) return;
  p.coup = false;
  run.arenas[GRAND_TIER].debuff = p.debuffBefore ?? run.arenas[GRAND_TIER].debuff;
  delete p.debuffBefore;
  p.seen = p.seen.filter((id) => id !== 'coupEve');
}

// Stages move on when the rebels trust you enough.
function advancePlot(run) {
  const p = run.plot;
  if (p.refusals >= PLOT.refusalsToCold) return endPlot(run, 'cold');
  if (p.stage === 'favours' && p.trust >= PLOT.cause.trust && (p.favours ?? 0) >= PLOT.cause.favours && run.week - (p.markWeek ?? 0) >= PLOT.cause.weeks
    && run.prestigeLevel >= PLOT.cause.houseLevel) {
    p.stage = 'cause';
    p.causeWeek = run.week;
  }
  if (p.stage === 'cause' && p.trust >= PLOT.ready.trust && isArmed(run) && run.roster.some((f) => f.id === p.champion)) p.stage = 'ready';
}

// A plot card's hidden effects. `out` collects what the house log may say.
function applyPlotEffects(run, eff, ev, out) {
  const p = run.plot;
  const f = findFighter(run, ev.f);
  if (eff.trust) p.trust = clamp(p.trust + eff.trust, 0, PLOT.maxTrust);
  if (eff.suspicion) changeSuspicion(run, eff.suspicion);
  if (eff.stage) {
    p.stage = eff.stage;
    if (eff.stage === 'favours') p.markWeek = run.week;
  }
  if (eff.reveal) p.reveal = run.topTier;
  if (eff.hide) {
    p.hidden = eff.hide;
    out.push('a stranger sleeps in the Medbay');
    // The stranger's bed is taken from a patient if the Medbay is full (playtest LLM-11: it cost nothing).
    const patients = run.roster.filter((f) => f.job === 'medbay');
    for (const f of patients.slice(medbaySlots(run))) {
      f.job = 'rest';
      out.push(`${f.name} gives up their Medbay bed and rests instead`);
    }
  }
  if (eff.crowd) p.crowdUntil = run.week + eff.crowd;
  if (eff.pass) { p.pass = true; out.push('the pass is hidden in your strongbox'); }
  if (eff.usePass) p.pass = false;
  if (eff.armed) p.armed = true;
  if (eff.giveGear) {
    let left = eff.giveGear - run.inventory.gear.splice(0, eff.giveGear).length;
    for (const x of [...run.roster].sort((a, b) => a.power - b.power)) {
      for (const slot of ['weapon', 'armor']) if (left > 0 && x.gear[slot]) { x.gear[slot] = null; left--; }
    }
  }
  if (eff.champion) {
    const who = findFighter(run, ev[eff.champion]);
    if (who) { p.champion = who.id; chronicle(run, who, 'Swore to strike the blow when the Emperor comes to the games.'); out.push(`${who.name} is with you`); }
  }
  if (eff.cool && f) bumpMorale(f, -eff.cool);
  if (eff.mark) { const o = run.arenas[run.topTier]?.opponent; if (o) o.rebel = true; }
  if (eff.contact === 'new') addContact(run, ev.name, pick(run.rng.plot, CELL_IDS), ev.id);
  if (eff.freeAsker && f) {
    removeFromRoster(run, f);
    addContact(run, f.name, f.political?.cell ?? 'courier', 'freed');
  }
  if (eff.askedFree && f) {
    f.askedFree = (f.askedFree ?? 0) + 1;
    // Asked twice and refused twice: they try to get out on their own.
    if (f.askedFree >= 2) {
      removeFromRoster(run, f);
      if (next(run.rng.plot) < 0.5) addContact(run, f.name, f.political?.cell ?? 'courier', 'escaped');
      else { changeSuspicion(run, 10); log(run, `${f.name} tried to escape over the wall, and was caught by the watch and executed.`, 'bad'); }
    }
  }
  if (eff.execute && f) {
    removeFromRoster(run, f);
    run.fallen.push({ ...f, alive: false, diedWeek: run.week });
    log(run, `${f.name} is taken by the Praetorians and executed in the arena at noon.`, 'bad');
  }
  if (eff.cold) endPlot(run, 'cold');
  if (eff.postpone) log(run, 'Not tonight. The rebels will wait for the next Grand Tournament.', 'event');
  if (eff.coup) {
    p.coup = true;
    p.debuffBefore = run.arenas[run.topTier].debuff;
    run.arenas[run.topTier].debuff = 'emperorsGaze'; // the Emperor watches: no capitulating
  }
  if (eff.betray) betray(run);
  if (eff.treason) {
    endPlot(run, 'treason');
    run.status = 'lost';
    run.ending = 'treason';
    run.endReason = 'The Praetorians break down the gates. Your house is tried for treason, and the sentence is read at the games.';
  }
}

function removeFromRoster(run, f) {
  for (const slot of ['weapon', 'armor']) if (f.gear?.[slot]) run.inventory.gear.push(f.gear[slot]);
  f.gear = { weapon: null, armor: null };
  run.roster = run.roster.filter((x) => x !== f);
  if (run.plot?.champion === f.id) run.plot.champion = null;
}

// The Loyalist: name the names. The Emperor is grateful; the people you freed, and the prisoners you kept, are not spared.
function betray(run) {
  const p = run.plot;
  const victims = [...run.roster.filter((f) => f.political).map((f) => f.name), ...p.freed.filter((c) => !c.caught).map((c) => c.name)];
  for (const f of run.roster.filter((x) => x.political)) {
    chronicle(run, f, 'Named as a traitor by their own house, and executed.');
    removeFromRoster(run, f);
    run.fallen.push({ ...f, alive: false, diedWeek: run.week });
    log(run, `On your word, the Praetorians drag ${f.name} from the barracks. They are executed at noon.`, 'bad');
  }
  for (const c of p.freed.filter((x) => !x.caught)) log(run, `${c.name} is found hiding in the city, and executed.`, 'bad');
  for (const c of p.freed) c.caught = true;
  p.executed = victims;
  changeFavor(run, PLOT.betrayFavor, 'you gave the Emperor the names he wanted');
  const purse = Math.round(PLOT.betrayGold * Math.min(run.topTier, CIRCUITS.length) * (isShort(run) ? SHORT.purse : 1)); // a season's purses pay more (6.0.0-beta)
  if (purse) {
    run.gold += purse;
    log(run, `A purse of ${purse} Gold arrives from the palace, with the Emperor's thanks.`, 'event');
  }
  // Version 6: the Emperor's own gift, a relic for the house (if it has room and doesn't hold it already).
  const gift = PLOT.betrayRelic;
  if (gift && !hasRelic(run, gift) && run.relics.length < FORTUNE.maxRelics) {
    run.relics.push(gift);
    log(run, `With the purse comes a gift from the palace: ${RELICS[gift].name}. ${RELICS[gift].desc}`, 'event');
  }
  run.epilogue = [...(run.epilogue ?? []), victims.length ? `Executed on your word: ${victims.join(', ')}.` : 'You gave the Emperor names. He made sure they were the right ones.'];
  endPlot(run, 'loyalist');
}

// The Grand Tournament with the coup under way: it succeeds only if the recruited champion wins the Final.
// Knocked out before the Final, the champion never gets near the imperial box: the rising waits for another year.
function resolveCoup(run, fighter, won, final) {
  const p = run.plot;
  // Knocked out early, or someone other than the champion lost: the signal is never given.
  if (!won && (!final || fighter.id !== p.champion)) {
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
  } else if (won) {
    endPlot(run, 'cold');
    run.epilogue = [...(run.epilogue ?? []), 'The signal never came: the wrong fighter won the Final, and the moment passed. Somewhere, a chalk mark fades.'];
  } else {
    endPlot(run, 'martyr');
    run.status = 'lost';
    run.ending = 'martyr';
    run.endReason = `${fighter.name} falls in the Final, and the rising dies with them. The broken chain is scrubbed from every door, but the city remembers.`;
  }
}

function refreshArmourer(run) {
  const lv = maxLevel(run, 'armourer');
  if (!lv) {
    run.armourerStock = [];
    return;
  }
  const pool = Object.keys(GEAR).filter((k) => GEAR[k].tier <= lv);
  run.armourerStock = Array.from({ length: effectAt('armourer', lv) }, () => pick(run.rng.market, pool));
}

// Build a room; shops open straight away instead of next month.
export function buildRoom(run, type) {
  const b = build(run, type);
  if (type === 'armourer') refreshArmourer(run);
  if (type === 'liaison') refreshLiaison(run);
  return b;
}

export function upgradeRoom(run, id) {
  return upgrade(run, id);
}

// ---------- Career setup ----------

// Three rival houses with their own seeded stream (so they never shift the fights).
function makeHouses(rng) {
  const pool = [...HOUSES.names];
  return Array.from({ length: HOUSES.rivals }, (_, i) => {
    const h = pool.splice(int(rng, 0, pool.length - 1), 1)[0];
    return { id: `h${i + 1}`, ...h, glory: int(rng, 0, 4), tier: 1, feud: 0, vengeance: 0 };
  });
}

export const houseOf = (run, f) => run.houses?.find((h) => h.id === f?.house) ?? null;
const houseTier = (h) => 1 + HOUSES.climb.filter((g) => h.glory >= g).length;
const leadingHouse = (run) => [...run.houses].sort((a, b) => b.glory - a.glory)[0];

// Who an arena's opponent fights for: a house that has climbed that far (the leader if none has, and for the Grand).
export function houseForArena(run, tier) {
  if (tier === GRAND_TIER) return leadingHouse(run);
  const there = run.houses.filter((h) => h.tier >= tier);
  // The archrival is a special opponent, not the usual one (playtest LLM-11: 73% of opponents were theirs). When it has
  // climbed ahead alone, the other houses still send fighters up to fight there.
  if (there.some((h) => h.id === run.archrival)) {
    const others = there.filter((h) => h.id !== run.archrival);
    const pool = others.length ? others : run.houses.filter((h) => h.id !== run.archrival);
    if (!pool.length) return archrival(run);
    return next(run.rng.houses) < RIVAL.oppShare ? archrival(run) : pick(run.rng.houses, pool);
  }
  return there.length ? pick(run.rng.houses, there) : leadingHouse(run);
}

// Every house by Glory, yours included.
export function standings(run) {
  const rows = [{ name: 'Your house', glory: run.glory ?? 0, tier: run.topTier, you: true, color: '#d9b45a' }, ...(run.houses ?? []).map((h) => ({ ...h, you: false }))];
  return rows.sort((a, b) => b.glory - a.glory || (a.you ? -1 : 1));
}

// After each tournament week the rivals fight their own bouts, climb, and their feuds cool.
function rivalsCompete(run) {
  const r = run.rng.houses;
  const arch = archrival(run);
  for (const h of run.houses) {
    if (next(r) < 0.5) h.glory += HOUSES.glory.win * h.tier;
    if (h === arch) h.glory += RIVAL.monthGlory * h.tier; // 5.4.0: your archrival keeps pace, so the year-end purse is a race
    h.tier = h === arch ? Math.max(houseTier(h), Math.min(run.topTier, CIRCUITS.length)) : houseTier(h);
    if (h.since === run.week - 1) continue; // set during the tournament week just ended: it starts counting next month
    h.feud = Math.max(0, h.feud - 1);
    h.vengeance = Math.max(0, h.vengeance - 1);
    h.owed = Math.max(0, (h.owed ?? 0) - 1);
  }
}

// `setup` (legacy, chosen when a career starts): { patron, decrees: [], classes: [] }. Stored, so careers replay.
export function createRun(seed = randomSeed(), setup = {}) {
  const housesRng = createRng(deriveSeed(seed, 6));
  const run = {
    version: SAVE_VERSION,
    seed,
    setup: {
      patron: setup.patron ?? null, decrees: [...(setup.heat ? heatDecrees(setup.heat) : setup.decrees ?? [])], classes: [...(setup.classes ?? [])], short: Boolean(setup.short), daily: setup.daily ?? null,
      // Version 6 (docs/plan-v6-phase3.md): the Heat level, the Legacy's unlocks, Hall legends who may return, the house colour.
      heat: setup.heat ?? 0, unlocks: [...(setup.unlocks ?? [])], legends: [...(setup.legends ?? [])], colour: setup.colour ?? null,
    },
    gold: ECONOMY.startGold + (setup.short ? SHORT.startGold : 0),
    prestige: ECONOMY.startPrestige + (setup.short ? SHORT.startPrestige : 0),
    prestigeLevel: prestigeLevelFor(ECONOMY.startPrestige + (setup.short ? SHORT.startPrestige : 0), 1), // a short career's head start is House level 2 (playtest #9)
    favor: FAVOR.start,
    week: 0,
    topTier: 1,
    arenas: {},
    bouts: null, // on tournament week: { tier: 'open' | 'done' }
    boutPending: false, // the top arena's bout still needs a decision
    roster: [],
    fallen: [],
    market: [],
    liaisonOffers: [],
    armourerStock: [],
    inventory: { decor: emptyDecor(), gear: [], items: emptyItems() },
    buildings: [],
    status: 'active', // 'active' | 'won' | 'lost'
    endReason: null,
    inMatch: false,
    matchInfo: null,
    revoltWeeks: 0,
    history: [],
    log: [],
    actions: [], // every player choice, for bug reports and scripts/replay.js (see src/game.js)
    nextId: 1,
    rng: {
      market: createRng(deriveSeed(seed, 1)),
      opponents: createRng(deriveSeed(seed, 2)),
      fight: createRng(deriveSeed(seed, 3)),
      growth: createRng(deriveSeed(seed, 4)),
      events: createRng(deriveSeed(seed, 5)),
      houses: housesRng,
      plot: createRng(deriveSeed(seed, 8)), // v6: the hidden plot draws only from here
      fortune: createRng(deriveSeed(seed, 13)), // version 6: the Fortune draft
    },
    relics: [], // version 6: the house's relics (src/fortune.js)
    fortune: null, // version 6: this month's Fortune cards, until one is chosen: { cards, rerolls }
    plot: null, // v6: the hidden plot's state, once a political prisoner joins (docs/roadmap-v6.md)
    houses: makeHouses(housesRng),
    glory: 0,
    event: null, // this week's event card: { id, f, g } (fighter ids), decided before the week can end
  };
  for (const type of STARTING_BUILDINGS) run.buildings.push({ id: newId(run, 'b'), type, level: 1 });
  if (hasUnlock(run, 'oracle')) run.buildings.push({ id: newId(run, 'b'), type: 'oracle', level: 1 }); // a Legacy unlock
  openArena(run, 1);
  refreshMarket(run);
  log(run, `You take charge of a bottom-tier Ludus in ${arenaName(1)}.`);
  applyPatron(run);
  archrival(run); // 5.4.0: your rival house, fixed now (no dice)
  return run;
}

// A patron's gift at the start of a career (seeded on its own stream, so it never shifts the market).
function applyPatron(run) {
  const p = run.setup.patron;
  if (!p || !PATRONS[p]) return;
  const rng = createRng(deriveSeed(run.seed, 7));
  if (p === 'purse') run.gold += 10;
  if (p === 'friend') run.favor = Math.min(FAVOR.max, run.favor + 15);
  if (p === 'warChest') {
    run.inventory.items.warPaint += 2;
    run.inventory.items.blessedBandage += 1;
  }
  if (p === 'veteran' || p === 'defector') {
    const f = createFighter(rng, { id: newId(run, 'f'), bonusPower: p === 'defector' ? 3 : 2, takenNames: takenNames(run), classes: run.setup.classes });
    if (p === 'veteran') Object.assign(f, { level: 3, xp: XP.levels[1], perks: ['thickSkin', 'killer'], speed: f.speed + 3, renown: 4 });
    else Object.assign(f, { renown: 5, origin: pick(rng, run.houses).name });
    run.roster.push(f);
    chronicle(run, f, p === 'veteran' ? 'A veteran sent by your patron.' : `Defected from ${f.origin}.`);
  }
  if (p === 'augur') { // version 6: the career opens with a pick of three rare relics
    const pool = Object.keys(RELICS).filter((r) => RELICS[r].rarity !== 'common' && relicInPool(run, r));
    const cards = [];
    while (cards.length < FORTUNE.cards && pool.length) cards.push({ kind: 'relic', id: pool.splice(int(rng, 0, pool.length - 1), 1)[0] });
    for (const c of cards) c.rarity = RELICS[c.id].rarity;
    run.fortune = { cards, rerolls: 0, augur: true };
  }
  if (p === 'liberator') { // v6: friends of a past rising send one of their own
    const f = createFighter(rng, { id: newId(run, 'f'), takenNames: takenNames(run), classes: run.setup.classes });
    f.political = { cell: pick(run.rng.plot, CELL_IDS) };
    f.origin = 'Sent by friends of the rising';
    run.roster.push(f);
    chronicle(run, f, 'Arrived at night, with a broken chain tattooed on one wrist.');
    joinPlot(run, f);
  }
  log(run, `Your patron: ${PATRONS[p].name}. ${PATRONS[p].desc}`, 'event');
}

// A fighter's chronicle: the moments that make their story (shown on their card, read at their funeral).
function chronicle(run, f, text) {
  f.story = [...(f.story ?? []), { week: run.week, text }].slice(-12);
}

// ---------- Shared checks ----------

function idleBlocker(run) {
  if (run.status !== 'active') return 'The run is over.';
  if (run.inMatch) return 'A match is in progress.';
  if (run.mercy) return 'First decide the beaten opponent\'s fate: thumbs up or down.';
  return null;
}

function assertOk(reason) {
  if (reason) throw new Refused(reason);
}

// Return a fighter's decor and gear to the house storeroom (on death or release).
function stripFighter(run, f) {
  for (const k of Object.keys(DECOR)) {
    run.inventory.decor[k] += f.decor[k] ?? 0;
    f.decor[k] = 0;
  }
  for (const slot of ['weapon', 'armor']) {
    if (f.gear[slot]) run.inventory.gear.push(f.gear[slot]);
    f.gear[slot] = null;
  }
}

// ---------- Recruiting ----------

export function recruitBlocker(run, id) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const fromLiaison = liaisonOffer(run, id);
  if (!fromLiaison && !run.market.some((f) => f.id === id)) return 'That fighter is not for sale.';
  if (run.roster.length >= rosterCap(run)) return `Your quarters are full (${rosterCap(run)} fighters). Build or upgrade Fighter Quarters.`;
  const price = fromLiaison ? fromLiaison.price : recruitPrice(run, run.market.find((f) => f.id === id));
  if (run.gold < price) return `Needs ${price} Gold.`;
  return null;
}

export function recruit(run, id) {
  assertOk(recruitBlocker(run, id));
  let fighter;
  if (liaisonOffer(run, id)) {
    fighter = liaisonOffer(run, id);
    run.gold -= fighter.price;
    run.liaisonOffers = run.liaisonOffers.filter((f) => f !== fighter);
    talk(run, 'liaison-saved', [{ speaker: 'steward', text: LIAISON_LINES.saved(fighter.name) }]); // the first one only (each key plays once)
  } else {
    fighter = run.market.find((f) => f.id === id);
    run.market = run.market.filter((f) => f !== fighter);
    run.gold -= recruitPrice(run, fighter);
  }
  delete fighter.price;
  run.roster.push(fighter);
  chronicle(run, fighter, `Joined the Ludus${fighter.origin ? ` (${fighter.origin})` : ''}.`);
  log(run, `${fighter.name} joins the Ludus.`);
  joinPlot(run, fighter);
  return fighter;
}

export function releaseBlocker(run, id) {
  return idleBlocker(run) ?? (findFighter(run, id) ? null : 'No such fighter.');
}

export function release(run, id) {
  assertOk(releaseBlocker(run, id));
  const f = findFighter(run, id);
  stripFighter(run, f);
  run.roster = run.roster.filter((x) => x !== f);
  run.released = (run.released ?? 0) + 1; // the rebels hear of it (src/dialogue.js, rebelScene)
  log(run, `${f.name} is released from the Ludus. Their gear and decor return to the storeroom.`);
}

// ---------- Weekly jobs ----------

const jobCount = (run, job, exceptId) => run.roster.filter((f) => f.id !== exceptId && f.job === job).length;
const isTraining = (job) => job === 'trainPower' || job === 'trainSpeed';

// Why a fighter can't train this week (or null). Gold covers every trainee's fee, this one included.
export function trainBlocker(run, f, { checkGold = true } = {}) {
  if (f.trained >= trainCap(run)) return `Trainer cap reached (${trainCap(run)} points). Upgrade a Trainer Room.`;
  if (f.morale < MORALE.restless) return `Discontented (Morale ${f.morale}): won't train. Raise their comfort.`;
  if (f.stress >= STRESS.overtrained) return `Stress ${f.stress}: must rest first.`;
  if (checkGold) {
    const trainees = run.roster.filter((x) => x.id !== f.id && isTraining(x.job)).length + 1;
    const fee = trainees * trainCost(run);
    if (run.gold < fee) return trainees > 1 ? `Needs ${fee} Gold for ${trainees} trainees; you have ${run.gold}.` : `Needs ${fee} Gold; you have ${run.gold}.`;
  }
  return null;
}

export function jobBlocker(run, id, job) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!JOBS.includes(job)) return 'Unknown job.';
  if (f.job === job) return null; // keeping the current job is always allowed
  if (isTraining(job)) {
    const busy = run.roster.filter((x) => x.id !== id && isTraining(x.job));
    if (busy.length >= trainerRooms(run)) {
      const who = busy.map((x) => x.name).join(' and ');
      return `${who} ${busy.length > 1 ? 'are' : 'is'} training (${trainerRooms(run)} Trainer Room${trainerRooms(run) > 1 ? 's' : ''}). Set ${busy.length > 1 ? 'one of them' : 'them'} to Rest, or build another Trainer Room.`;
    }
    const cannot = trainBlocker(run, f);
    if (cannot) return cannot;
  }
  if (job === 'medbay') {
    if (jobCount(run, 'medbay', id) >= medbaySlots(run)) return 'The Medbay is full.';
    if (!f.injuries.length) return 'Not injured.';
  }
  return null;
}

// The steward's plan (version 6): a sensible job for everyone in one click. The hurt go to the Medbay, the tired rest
// (another training week would overtrain them), the rest train Power while they can (Speed when Power is capped).
// Earlier fighters in the roster get the Trainer Rooms and Medbay beds first. Returns the jobs set: [{ id, job }].
export function stewardPlanBlocker(run) {
  return idleBlocker(run) ?? (run.roster.length ? null : 'No gladiators to plan for.');
}
export function stewardPlan(run) {
  assertOk(stewardPlanBlocker(run));
  for (const f of run.roster) if (f.job !== 'rest' && !jobBlocker(run, f.id, 'rest')) f.job = 'rest'; // free every room first
  const out = [];
  for (const f of run.roster) {
    const hurt = f.injuries.some((i) => i.weight > 0);
    const wants = hurt ? ['medbay', 'rest'] : f.stress + trainStress(run, f) >= STRESS.overtrained ? ['rest'] : ['trainPower', 'trainSpeed', 'rest'];
    const job = wants.find((j) => j === 'rest' || !jobBlocker(run, f.id, j));
    if (job !== f.job) setJob(run, f.id, job);
    out.push({ id: f.id, job });
  }
  return out;
}

export function setJob(run, id, job) {
  assertOk(jobBlocker(run, id, job));
  const f = findFighter(run, id);
  f.job = job;
  f.notice = null;
  delete f.resume;
}

// A fighter can't train after all: they rest this week, and the card says why.
// Unless the cap is reached, they go back to the same training once they can (playtests #9 and #10: training stopped for good).
function switchToRest(run, f, reason) {
  if (isTraining(f.job) && f.trained < trainCap(run)) f.resume = f.job;
  f.job = 'rest';
  f.notice = `Switched to Rest: ${reason}`;
  log(run, `${f.name} switched to Rest: ${reason}`, 'warn');
}

// A fighter switched to Rest goes back to training when it can happen and won't overtrain them next week.
function resumeTraining(run, f) {
  if (f.trained >= trainCap(run)) { delete f.resume; return; }
  const gain = trainStress(run, f);
  if (f.stress + gain >= STRESS.overtrained) return;
  if (run.roster.filter((x) => x !== f && isTraining(x.job)).length >= trainerRooms(run)) return; // every Trainer Room is taken (bug report: two trained in one room)
  f.job = f.resume;
  if (trainBlocker(run, f)) { f.job = 'rest'; return; }
  delete f.resume;
  f.notice = `Back to training: rested and ready.`;
  log(run, `${f.name} goes back to training.`, 'good');
}

// A room's calming decor: its Stress relief a week, capped at STRESS.decorCalm (5.4.0).
export const decorCalm = (f) => Math.min(STRESS.decorCalm, Object.entries(f.decor).reduce((n, [k, count]) => n + (DECOR[k].calm ?? 0) * count, 0));

// ---------- Morale ----------

export const decorCount = (f) => Object.values(f.decor).reduce((s, n) => s + n, 0);

// Where a fighter's Morale is heading: comfort (rooms, decor, entertainment) minus what their fame makes them expect.
// A Revenant feels nothing: their Morale heads for REANIMATE.morale whatever the room.
export function moraleTarget(run, f) {
  if (f.kind === 'revenant') return { target: REANIMATE.morale, comfort: 0, expects: 0, mood: 0, revenant: true };
  const comfort = MORALE.perQuartersLevel * maxLevel(run, 'quarters') + decorComfortOf(f) + (bondmate(run, f) ? BOND.comfort : 0) + (hasPolicy(run, 'grainToLudus') ? 5 : 0) + MORALE.perEntertainmentLevel * maxLevel(run, 'entertainment');
  const expects = Math.min(MORALE.maxExpectation, MORALE.expectationPerRenown * f.renown);
  const mood = f.mood?.n ?? 0; // an event's lasting effect (src/events.js)
  return { target: clamp(MORALE.base + comfort - expects + mood, 0, 100), comfort, expects, mood };
}

export function moraleState(f) {
  if (f.morale >= MORALE.inspired) return { id: 'inspired', label: 'Inspired', desc: '+5% win chance in every round.' };
  if (f.morale < MORALE.mutinous) return { id: 'mutinous', label: 'Mutinous', desc: 'Refuses to fight. Give them decor, a better room, or wins.' };
  if (f.morale < MORALE.restless) return { id: 'restless', label: 'Discontented', desc: "Won't train. Give them decor or a better room." };
  return { id: 'content', label: 'Content', desc: 'No effect.' };
}

const bumpMorale = (f, n) => { f.morale = clamp(f.morale + n, 0, 100); };

// ---------- The week ----------

export function advanceBlocker(run) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (run.event) return `Decide this week's event first: "${EVENT_BY_ID[run.event.id].title}".`;
  if (run.fortune) return 'Choose this month\'s Fortune first.';
  const midBracket = Object.entries(run.brackets ?? {}).find(([t, b]) => b.fighterId && b.round > 0 && run.bouts?.[t] === 'open');
  if (midBracket) return `${findFighter(run, midBracket[1].fighterId)?.name ?? 'Your fighter'} is through to the ${BRACKET.rounds[midBracket[1].round]} in ${arenaName(Number(midBracket[0]))}: fight on, or withdraw.`;
  if (run.summons && run.bouts) return 'The Emperor\'s summons: send a fighter to the Imperial Coliseum, or refuse him.';
  if (run.boutPending) return `Tournament week: send a fighter to ${arenaName(run.topTier)}, or skip the bout first.`;
  if (run.roster.some((f) => f.pendingPerks.length)) return 'A fighter levelled up: choose their perk first.';
  return null;
}

// Runs one week of jobs, then moves the calendar forward.
export function advanceWeek(run) {
  assertOk(advanceBlocker(run));
  const tournamentEnds = Boolean(run.bouts);
  const relief = stressRelief(run);
  for (const f of run.roster) {
    // Training that can't happen counts as Rest, and the card says why (it normally can't be chosen at all).
    if (isTraining(f.job)) {
      const cannot = trainBlocker(run, f, { checkGold: false }) ?? (run.gold < trainCost(run) ? `not enough Gold for the trainer's fee (${trainCost(run)}).` : null);
      if (cannot) switchToRest(run, f, cannot);
    }
    if (isTraining(f.job)) {
      const cost = trainCost(run);
      const stat = f.job === 'trainPower' ? 'power' : 'speed';
      const gain = trainGain(run, stat);
      f[stat] += gain;
      f.trained += 1;
      if (stat === 'power') f.trainedPower = (f.trainedPower ?? 0) + gain;
      run.gold -= cost;
      f.stress = clampStress(f.stress + trainStress(run, f));
      log(run, `${f.name} trains: +${gain} ${stat === 'power' ? 'Power' : 'Speed'}.`, 'good');
    }
    if (f.job === 'medbay') {
      let heal = healRate(run) + relicSum(run, 'heal');
      while (heal > 0 && f.injuries.length) {
        const inj = f.injuries[0];
        const used = Math.min(heal, inj.weeksLeft);
        inj.weeksLeft -= used;
        heal -= used;
        if (inj.weeksLeft <= 0) {
          f.injuries.shift();
          log(run, `${f.name}'s ${INJURY_BY_TAG[inj.tag].name} has healed.`, 'good');
        }
      }
      f.stress = clampStress(f.stress + STRESS.medbay);
      if (!f.injuries.length) {
        f.job = 'rest';
        log(run, `${f.name} leaves the Medbay fully healed.`, 'good');
      }
    } else if (f.job === 'rest') {
      f.stress = clampStress(f.stress + STRESS.rest);
      // A Flesh Wound heals on Rest too, at half speed (playtest #9: a light wound waited months for a Medbay bed).
      const light = f.injuries.find((i) => i.tag === 'fleshWound' && i.weeksLeft !== undefined);
      if (light) {
        light.weeksLeft -= 0.5;
        if (light.weeksLeft <= 0) {
          f.injuries = f.injuries.filter((i) => i !== light);
          log(run, `${f.name}'s Flesh Wound has healed with rest.`, 'good');
        }
      }
    }
    // A daze (Distracted, weight 0) passes on its own, whatever the job (playtest #8: it waited for the Medbay).
    if (f.job !== 'medbay') {
      for (const inj of f.injuries.filter((i) => !i.weight)) inj.weeksLeft -= 1;
      const cleared = f.injuries.filter((i) => !i.weight && i.weeksLeft <= 0);
      if (cleared.length) {
        f.injuries = f.injuries.filter((i) => !cleared.includes(i));
        log(run, `${f.name} shakes off the daze.`, 'good');
      }
    }
    // The Entertainment Room, plus calming decor in their quarters (at most STRESS.decorCalm a week).
    const calm = decorCalm(f);
    f.stress = clampStress(f.stress - relief - calm);
    // Morale drifts toward what their room and fame warrant.
    const { target } = moraleTarget(run, f);
    // Morale climbs quickly but sinks slowly, a few points a week (playtest: Discontent arrived all at once).
    f.morale = f.morale < target ? Math.min(target, f.morale + MORALE.drift) : Math.max(target, f.morale - MORALE.driftDown);
    if (f.mood && --f.mood.weeks <= 0) delete f.mood;
    // Don't leave a job that will fail next week: switch now, visibly.
    if (isTraining(f.job)) {
      const next = trainBlocker(run, f, { checkGold: false });
      if (next) switchToRest(run, f, next);
    } else if (f.job === 'rest' && f.resume) resumeTraining(run, f);
    if (f.stress >= STRESS.overtrained) log(run, `${f.name} is overtrained (Stress ${f.stress}). Rest them before a fight.`, 'warn');
    if (f.morale < MORALE.mutinous) log(run, `${f.name} is mutinous and refuses to fight.`, 'bad');
  }
  tendBonds(run);
  // A house in despair revolts.
  const avg = run.roster.length ? run.roster.reduce((s, f) => s + f.morale, 0) / run.roster.length : 100;
  run.revoltWeeks = avg < REVOLT.morale ? run.revoltWeeks + 1 : 0;
  if (run.revoltWeeks) log(run, `The gladiators are close to revolt (${run.revoltWeeks}/${REVOLT.weeks} weeks).`, 'bad');

  // Scouting fades for anyone who sat out the top arena this tournament week.
  if (run.bouts) for (const f of run.roster) if (f.foughtTopWeek !== run.week) f.topStreak = 0;
  // A lower arena nobody from your house fought in moves on without you: someone else fought its bout (three playtests
  // found the Dirt Pits stuck on one opponent for a year).
  if (run.bouts) for (const tier of unlockedTiers(run)) if (tier < run.topTier && run.bouts[tier] === 'open') arenaMovesOn(run, tier);
  // The month's demand is judged now, before a new month can issue the next one (playtest #9: it was issued and judged at once).
  if (tournamentEnds) judgeDemand(run);
  if (tournamentEnds && run.wager) loseWager(run, 'the house never fought its top-arena tournament');
  rivalPoach(run); // the archrival buys the fighter it eyed, at the end of the month's first week (5.4.0)
  run.bouts = null;
  run.brackets = {};
  run.week += 1;
  releaseTalk(run);
  const d = dateOf(run.week);
  if (isMonthStart(run.week)) {
    refreshMarket(run);
    refreshLiaison(run);
    refreshArmourer(run);
    plotMonth(run);
    issueDemand(run);
    summonsMonth(run);
    wantsMonth(run); // 5.4.0: quests (docs/plan-5.4-quests.md)
    rivalMonth(run);
    rebelQuestsMonth(run);
    fortuneMonth(run);
  }
  if (run.plot?.hidden && --run.plot.hidden <= 0) { delete run.plot.hidden; log(run, 'The stranger in the Medbay slipped away before dawn.', 'event'); }
  if (!d.winter && d.month === 'December' && d.weekOfMonth === 1) if (!tributePaid(run)) log(run, `The Emperor's tribute of ${tributeDue(run)} Gold is due at the start of winter.`, 'warn');
  if (run.week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - 4) {
    payYearPurse(run);
    collectTribute(run);
    for (const f of run.roster) f.topStreak = 0; // a winter apart: the scouts' notes go stale
  }
  if (isTournamentWeek(run.week)) {
    run.bouts = Object.fromEntries(unlockedTiers(run).map((t) => [t, 'open']));
    drawBrackets(run); // now, so rendering never rolls dice
    run.boutPending = true;
    log(run, `Tournament week in ${unlockedTiers(run).length > 1 ? `${unlockedTiers(run).length} arenas` : arenaName(run.topTier)}.`, 'event');
  }
  if (tournamentEnds) rivalsCompete(run);
  if (tournamentEnds) bondOverFightDay(run);
  if (tournamentEnds && plotActive(run) && run.plot.coup) postponeCoup(run); // the champion never fought
  checkQuests(run);
  checkLoss(run);
  if (run.status === 'active') {
    const recentBefore = run.recentEvents;
    rollEvent(run);
    rollPlot(run, recentBefore);
  }
}

// Who this week's training would leave Overtrained (Stress 50+), for the warning on End week (the designer, 5.4.0).
// It plays the week on a copy, so the career itself is untouched.
export function overtrainedByWeek(run) {
  if (advanceBlocker(run)) return [];
  const copy = deserialize(serialize(run));
  try { advanceWeek(copy); } catch { return []; }
  return run.roster.filter((f) => isTraining(f.job) && f.stress < STRESS.overtrained && (findFighter(copy, f.id)?.stress ?? 0) >= STRESS.overtrained);
}

// Advance until the next tournament week (stops early if the run ends or a decision is needed).
// Skipping ahead never lets training overtrain a fighter: a trainee about to cross the line rests instead
// (playtest #6: a three-week skip left fighters Overtrained on fight day).
export function advanceToTournament(run) {
  let weeks = 0;
  const guard = () => {
    for (const f of run.roster) {
      const gain = trainStress(run, f);
      if (isTraining(f.job) && f.stress + gain >= STRESS.overtrained) switchToRest(run, f, `another week of training would overtrain them (Stress ${f.stress}).`);
    }
  };
  while (!run.boutPending && run.status === 'active' && !advanceBlocker(run)) {
    guard();
    advanceWeek(run);
    weeks++;
  }
  if (run.boutPending) guard(); // and fight week too, now that a rested trainee goes back to training (playtest #10)
  return weeks;
}

// ---------- The Fortune draft (version 6, src/fortune.js) ----------

const fortuneRng = (run) => (run.rng.fortune ??= createRng(deriveSeed(run.seed, 13)));
const fortuneTier = (run) => Math.min(run.topTier, CIRCUITS.length);

// A key from { key: weight }, skipping zero weights (null when every weight is zero).
function weighted(rng, weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  let roll = next(rng) * entries.reduce((s, [, w]) => s + w, 0);
  for (const [k, w] of entries) if ((roll -= w) < 0) return k;
  return entries.at(-1)?.[0] ?? null;
}

// From `ids`, one of this rarity if any (else any), not already on the table.
function pickOf(rng, ids, rarityOf, rarity, taken) {
  const free = ids.filter((id) => !taken.includes(id));
  const same = free.filter((id) => rarityOf(id) === rarity);
  return (same.length ? pick(rng, same) : free.length ? pick(rng, free) : null);
}

// A drafted fighter keeps up with the house: at least FORTUNE.fighterBehind below your second-best fighter, plus the rarity bonus.
// The catch-up is training they did elsewhere: it counts toward the Trainer cap, like a prisoner's (playtest LLM-14: as natural
// Power it left a whole cap to train on top, so Fortune's fighters outgrew the house's own).
function keepUp(run, f, rarity) {
  const ranked = run.roster.map(effectivePower).sort((a, b) => b - a);
  const second = ranked[1] ?? ranked[0];
  if (second === undefined) return;
  const floor = second - FORTUNE.fighterBehind + FORTUNE.fighterPower[rarity];
  const gap = floor - effectivePower(f);
  if (gap <= 0) return;
  f.power += gap;
  f.trainedPower = (f.trainedPower ?? 0) + gap;
  f.trained = (f.trained ?? 0) + Math.ceil(gap / trainGain(run, 'power'));
}

function fortuneCard(run, rng, table) {
  const rarity = weighted(rng, FORTUNE.rarity);
  const kinds = { ...FORTUNE.kinds };
  const taken = table.map((c) => c.id);
  // LLM-13: relic cards keep coming once the house holds its fill; taking one lays another down (chooseFortune's `drop`).
  if (run.roster.length >= rosterCap(run)) kinds.fighter = 0;
  if (isWinter(run.week) || run.wager || table.some((c) => c.kind === 'wager')) kinds.wager = 0;
  const legends = returningLegends(run).filter((l) => !table.some((c) => c.id === legendKey(l)));
  if (!legends.length || run.roster.length >= rosterCap(run)) kinds.legend = 0;
  for (const k of Object.keys(kinds)) if (table.filter((c) => c.kind === k).length >= 2) kinds[k] = 0; // variety: at most two of a kind
  const kind = weighted(rng, kinds);
  const tier = fortuneTier(run);
  if (kind === 'relic') {
    const id = pickOf(rng, Object.keys(RELICS).filter((r) => !run.relics.includes(r) && relicInPool(run, r)), (r) => RELICS[r].rarity, rarity, taken);
    if (id) return { kind, id, rarity: RELICS[id].rarity };
  }
  if (kind === 'gear') {
    const gearTier = clamp(tier - 2 + ['common', 'rare', 'legendary'].indexOf(rarity), 1, 3); // mostly a tier below your arena
    const id = pickOf(rng, Object.keys(GEAR).filter((g) => GEAR[g].tier === gearTier), () => rarity, rarity, taken);
    // LLM-13: the card is labelled by the item it holds (a Dirt Pits draw is always tier 1, whatever its luck).
    if (id) return { kind, id, rarity: ['common', 'rare', 'legendary'][gearTier - 1] };
  }
  if (kind === 'fighter') {
    const f = createFighter(rng, { id: newId(run, 'f'), bonusPower: circuitInfo(run).marketPower + FORTUNE.fighterPower[rarity], takenNames: takenNames(run, table.map((c) => c.fighter).filter(Boolean)), classes: run.setup?.classes });
    season(run, rng, f);
    if (rarity === 'legendary') Object.assign(f, { legend: true, renown: FORTUNE.legendRenown, origin: 'A legend of the arena' });
    keepUp(run, f, rarity);
    remember(run, f); // dealt, not only taken: a card passed over must not come back as an opponent (playtest LLM-13)
    return { kind, id: f.id, rarity, fighter: f };
  }
  if (kind === 'legend') {
    const l = pick(rng, legends);
    const f = createFighter(rng, { id: newId(run, 'f'), kind: KINDS[l.kind] ? l.kind : undefined, bonusPower: circuitInfo(run).marketPower + FORTUNE.fighterPower.legendary, classes: run.setup?.classes });
    season(run, rng, f);
    Object.assign(f, { name: l.name, humor: l.humor ?? f.humor, titles: [...(l.titles ?? [])], kills: l.kills ?? 0, renown: Math.max(l.renown ?? 0, FORTUNE.legendRenown), legend: true, returned: legendKey(l), carried: { kills: l.kills ?? 0, titles: l.titles?.length ?? 0 }, origin: 'Returned from the Hall of Champions' });
    if (CLASSES[l.cls]) Object.assign(f, { cls: l.cls, weapon: l.cls === 'fighter' ? f.weapon ?? pick(rng, WEAPON_IDS) : null });
    keepUp(run, f, 'legendary');
    return { kind, id: legendKey(l), rarity: 'legendary', fighter: f, wins: l.wins ?? 0 };
  }
  if (kind === 'wager') {
    const w = FORTUNE.wager;
    return { kind, id: 'wager', rarity: 'rare', tier: run.topTier, winGold: w.winGoldPerTier * tier, winRenown: w.winRenown, lossGold: w.lossGoldPerTier * tier };
  }
  // A boon (also the fallback when nothing else is left to draw).
  const hurt = run.roster.some((f) => f.injuries.length);
  const id = pickOf(rng, Object.keys(BOONS).filter((b) => BOONS[b].needs !== 'hurt' || hurt), (b) => BOONS[b].rarity, rarity, taken) ?? 'gold';
  const b = BOONS[id];
  const card = { kind: 'boon', id, rarity: b.rarity };
  if (b.gold) card.gold = b.gold + b.goldPerTier * tier;
  if (b.prestige) card.prestige = b.prestige + b.prestigePerTier * tier;
  if (b.items) card.items = Array.from({ length: b.items }, () => pick(rng, Object.keys(CONSUMABLES)));
  if (b.one) {
    const f = pick(rng, run.roster);
    if (!f) return { kind: 'boon', id: 'gold', rarity: 'common', gold: BOONS.gold.gold + BOONS.gold.goldPerTier * tier };
    Object.assign(card, { fighterId: f.id, name: f.name });
  }
  return card;
}

// Version 6: what the Legacy unlocks or Heat changes about the draft (docs/plan-v6-phase3.md).
export const relicInPool = (run, id) => !RELICS[id].locked || hasUnlock(run, `relic:${id}`);
export const fortuneCards = (run) => FORTUNE.cards + (hasUnlock(run, 'fourCards') ? 1 : 0) - (hasDecree(run, 'leanFortune') ? 1 : 0);
export const legendKey = (l) => `legend:${l.seed}:${l.id}`;
// Hall legends this career may still deal: unlocked, in the setup's snapshot, and not already returned in this career.
export const returningLegends = (run) => (hasUnlock(run, 'legends') ? run.setup.legends ?? [] : [])
  .filter((l) => ![...run.roster, ...run.fallen, ...(run.retired ?? [])].some((f) => f.returned === legendKey(l)));

function drawFortune(run) {
  const rng = fortuneRng(run);
  const cards = [];
  for (let i = 0; i < fortuneCards(run); i++) cards.push(fortuneCard(run, rng, cards));
  return cards;
}

// At the start of every month (from FORTUNE.fromWeek): the Patron's Purse pays, and three Fortune cards are dealt.
function fortuneMonth(run) {
  const purse = relicSum(run, 'monthGold');
  if (purse) {
    run.gold += purse;
    log(run, `${RELICS.purse.name}: +${purse} Gold.`, 'good');
  }
  if (!FORTUNE.enabled || run.week < FORTUNE.fromWeek || run.status !== 'active') return;
  run.fortune = { cards: drawFortune(run), rerolls: 0 };
}

export const rerollPrice = (run) => FORTUNE.reroll[Math.min(run.fortune?.rerolls ?? 0, FORTUNE.reroll.length - 1)];

export function fortuneBlocker(run, index, drop = null) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const card = run.fortune?.cards[index];
  if (!card) return 'No Fortune card there.';
  if ((card.kind === 'fighter' || card.kind === 'legend') && run.roster.length >= rosterCap(run)) return `Your quarters are full (${rosterCap(run)} fighters).`;
  if (card.kind === 'relic' && run.relics.length >= FORTUNE.maxRelics && !run.relics.includes(drop)) return `The house holds ${FORTUNE.maxRelics} relics: choose one to lay down for it.`;
  if (card.fighterId && !findFighter(run, card.fighterId)) return `${card.name} is no longer in the house.`;
  return null;
}

// `drop`: at the relic limit, the relic the house lays down to take a new one.
export function chooseFortune(run, index, drop = null) {
  assertOk(fortuneBlocker(run, index, drop));
  const card = run.fortune.cards[index];
  run.fortune = null;
  const title = fortuneTitle(card);
  if (card.kind === 'relic') {
    if (run.relics.length >= FORTUNE.maxRelics) {
      run.relics = run.relics.filter((id) => id !== drop);
      log(run, `Fortune: ${RELICS[drop].name} is laid down.`);
    }
    run.relics.push(card.id);
    log(run, `Fortune: ${title} joins the house's relics. ${RELICS[card.id].desc}`, 'good');
  } else if (card.kind === 'gear') {
    run.inventory.gear.push(card.id);
    log(run, `Fortune: ${/^[AEIOU]/i.test(title) ? 'an' : 'a'} ${title} for the storeroom.`, 'good');
  } else if (card.kind === 'fighter' || card.kind === 'legend') {
    const f = card.fighter;
    run.roster.push(f);
    remember(run, f);
    if (f.returned) {
      chronicle(run, f, 'Came back from the Hall of Champions for one last season.');
      log(run, `Fortune: ${f.name} returns from the Hall of Champions to fight for your house one last season.`, 'good');
    } else {
      chronicle(run, f, f.legend ? 'Came to the Ludus by Fortune: a legend of the arena.' : 'Came to the Ludus by Fortune.');
      log(run, `Fortune: ${f.name} joins the Ludus${f.legend ? ', a legend of the arena' : ''}.`, 'good');
    }
    joinPlot(run, f);
  } else if (card.kind === 'wager') {
    run.wager = { winGold: card.winGold, winRenown: card.winRenown, lossGold: card.lossGold };
    log(run, `Fortune: the Fates' wager is made. Win this month's top-arena tournament: +${card.winGold} Gold and +${card.winRenown} Renown. Lose or skip it: −${card.lossGold} Gold.`, 'event');
  } else applyBoon(run, card, title);
  return card;
}

function applyBoon(run, card, title) {
  const b = BOONS[card.id];
  if (card.gold) run.gold += card.gold;
  if (card.prestige) {
    run.prestige += card.prestige;
    run.prestigeLevel = prestigeLevelFor(run.prestige, run.prestigeLevel);
  }
  if (b.favor) changeFavor(run, b.favor, title);
  for (const k of card.items ?? []) run.inventory.items[k] += 1;
  for (const f of run.roster) {
    if (b.one && f.id !== card.fighterId) continue;
    if (b.stress) f.stress = clampStress(f.stress + b.stress);
    if (b.power) f.power += b.power;
    if (b.heal) {
      for (const inj of f.injuries) inj.weeksLeft -= b.heal;
      f.injuries = f.injuries.filter((i) => i.weeksLeft > 0);
    }
  }
  for (const f of run.roster) if (b.xp) gainXp(run, f, b.xp);
  log(run, `Fortune: ${title}. ${fortuneText(card)}`, 'good');
}

export function rerollBlocker(run) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!run.fortune) return 'No Fortune to reroll.';
  if (run.fortune.augur) return "The Augur's gift can't be re-spun.";
  if (run.gold < rerollPrice(run)) return `Needs ${rerollPrice(run)} Gold.`;
  return null;
}

export function rerollFortune(run) {
  assertOk(rerollBlocker(run));
  run.gold -= rerollPrice(run);
  run.fortune = { cards: drawFortune(run), rerolls: run.fortune.rerolls + 1 };
}

export function passFortune(run) {
  assertOk(idleBlocker(run) ?? (run.fortune ? null : 'No Fortune to pass.'));
  run.fortune = null;
  run.gold += FORTUNE.pass;
  log(run, `You let Fortune pass: +${FORTUNE.pass} Gold.`);
}

// What the house's relics add to a won (or any) bout, before the purse is paid.
function relicRewards(run, fighter, won, summary) {
  if (!won) return;
  summary.prestige += relicSum(run, 'winPrestige');
  if (summary.kill) summary.renown += relicSum(run, 'killRenown');
  if (hasRelic(run, 'mask')) summary.renown += RELICS.mask.tagRenown * tagCount(fighter, 'showman');
}

function settleWager(run, won, summary) {
  if (!won) return loseWager(run, 'the top-arena tournament was lost', summary);
  const w = run.wager;
  delete run.wager;
  summary.gold += w.winGold;
  summary.renown += w.winRenown;
  summary.wager = { won: true, gold: w.winGold, renown: w.winRenown };
  log(run, `The Fates pay: +${w.winGold} Gold and +${w.winRenown} Renown.`, 'good');
}

function loseWager(run, why, summary = null) {
  const loss = Math.min(run.gold, run.wager.lossGold);
  delete run.wager;
  run.gold -= loss;
  if (summary) summary.wager = { won: false, gold: -loss };
  log(run, `The Fates collect: −${loss} Gold (${why}).`, 'bad');
}

// ---------- Weekly events (src/events.js) ----------

function eventTargets(run, who) {
  const alive = run.roster;
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

function rollEvent(run) {
  const r = run.rng.events;
  const chance = dateOf(run.week).winter ? EVENT_CHANCE.winter : EVENT_CHANCE.season;
  if (!run.roster.length || next(r) >= chance) return;
  const recent = run.recentEvents ?? [];
  const options = EVENTS.filter((e) => !recent.includes(e.id) && (!e.when || e.when(run)) && (e.who !== 'pair' || run.roster.length >= 2));
  if (!options.length) return;
  const e = pick(r, options);
  run.event = { id: e.id, ...(e.target ? { f: pick(run.rng.events, e.target(run)).id } : eventTargets(run, e.who)) };
  run.recentEvents = [...recent, e.id].slice(-EVENT_MEMORY);
}

// Names for an event's text: { f, g }.
export function eventNames(run, ev = run.event) {
  const name = (id) => findFighter(run, id)?.name;
  return { f: name(ev?.f), g: name(ev?.g), name: ev?.name, house: ev?.house, opp: ev?.opp, fOdds: ev?.fOdds, gOdds: ev?.gOdds };
}

export function eventChoiceBlocker(run, index) {
  if (!run.event) return 'No event to decide.';
  const choice = EVENT_BY_ID[run.event.id].choices[index];
  if (!choice) return 'No such choice.';
  if (choice.cost && run.gold < choice.cost) return `Needs ${choice.cost} Gold.`;
  return choice.needs?.(run, run.event) ?? null;
}

function applyEventEffects(run, eff, ev, out) {
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
      out.push(`${f.name} is wounded: ${inj.name}`); // playtest #9: "is Flesh Wound"
    }
  }
  if (eff.heal) {
    for (const f of targets(eff.heal.to)) {
      const inj = f.injuries.pop();
      if (inj) out.push(`${f.name}'s ${INJURY_BY_TAG[inj.tag].name} is healed`);
    }
  }
  if (eff.spy) spyFound(run, findFighter(run, ev.f), eff.spy, out);
  if (ev.plot) applyPlotEffects(run, eff, ev, out);
  if (eff.chance) {
    const p = typeof eff.chance.p === 'function' ? eff.chance.p(run, ev) : eff.chance.p;
    const won = next(ev.plot ? run.rng.plot : run.rng.events) < p;
    out.push(won ? 'it went well' : 'it went badly');
    applyEventEffects(run, won ? eff.chance.win : eff.chance.lose, ev, out);
  }
}

// The Emperor's spy (the designer, 5.4.0). Executed: their body is kept for the Temple of Vulcan, and if the hidden plot runs,
// the palace has lost its eyes in your house. Kept: the Emperor hears only good of you, and anything you hide, he hears too.
function spyFound(run, f, choice, out) {
  run.spyFound = true;
  if (!f) return;
  if (choice === 'execute') {
    chronicle(run, f, 'Unmasked as the Emperor\'s spy, and executed in the yard.');
    removeFromRoster(run, f);
    run.fallen.push({ ...f, alive: false, diedWeek: run.week, body: true, spy: true }); // a body the Temple can raise
    if (plotActive(run)) changeSuspicion(run, -SPY.suspicion);
    out.push(`${f.name} is executed in the yard`);
  } else {
    f.spy = true;
    chronicle(run, f, 'Kept on, though you know who they write to.');
    if (plotActive(run)) changeSuspicion(run, SPY.suspicion);
  }
}

// Decide this week's event. Returns what happened, as text.
export function chooseEvent(run, index) {
  assertOk(eventChoiceBlocker(run, index));
  const ev = run.event;
  const e = EVENT_BY_ID[ev.id];
  const choice = e.choices[index];
  const out = [];
  const names = eventNames(run, ev); // before the effects: a freed or executed fighter leaves the roster
  applyEventEffects(run, choice.effects, ev, out);
  if (ev.plot && plotActive(run)) {
    // Once the rising is ready, turning down a favour no longer risks the cause going cold (playtest LLM-11):
    // a careful Lanista can keep their head down until the Grand Tournament.
    if (choice.refuse && run.plot.stage !== 'ready') run.plot.refusals += 1;
    else if (choice.help) {
      run.plot.refusals = 0;
      if (run.plot.stage === 'favours' && ev.id !== 'chalkMark') run.plot.favours = (run.plot.favours ?? 0) + 1;
    }
    advancePlot(run);
  }
  const what = out.join(', ');
  const text = `${e.title}: ${choiceLabel(choice, names)}.${out.length ? ` ${what[0].toUpperCase()}${what.slice(1)}.` : ''}`; // a sentence starts with a capital (playtest #9)
  log(run, text, 'event');
  run.event = null;
  checkLoss(run);
  return text;
}

// ---------- Tribute and Favour ----------

// The year whose tribute comes next: in winter this year's is already settled, so it's next year's.
const tributeYear = (run) => dateOf(run.week).year + (dateOf(run.week).winter ? 1 : 0);
export const tributeDue = (run) => Math.round(TRIBUTE.perYear * tributeYear(run) * (hasDecree(run, 'greedyEmperor') ? 1.5 : 1) * (hasPolicy(run, 'lowerTribute') ? 0.7 : 1));
export const tributePaid = (run) => run.tributePaid === tributeYear(run);

export function payTributeBlocker(run) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (tributePaid(run)) return 'This year\'s tribute is already paid.';
  if (run.gold < tributeDue(run)) return `Needs ${tributeDue(run)} Gold.`;
  return null;
}

// Pay this year's tribute early, so the Gold can't be spent by accident.
export function payTribute(run) {
  assertOk(payTributeBlocker(run));
  const due = tributeDue(run);
  run.gold -= due;
  run.tributePaid = tributeYear(run);
  log(run, `You pay the Emperor's tribute early: ${due} Gold.`, 'event');
}

// The year-end purse: the Emperor rewards the houses by their place in the Glory standings.
function payYearPurse(run) {
  if (!run.houses) return;
  const rank = standings(run).findIndex((h) => h.you);
  const year = dateOf(run.week).year;
  const purse = (HOUSES.yearPurse[rank] ?? 0) * year;
  if (purse) run.gold += purse;
  log(run, `The year-end purse: your house finished #${rank + 1} of ${run.houses.length + 1} in Glory${purse ? ` and is paid ${purse} Gold` : ', and is paid nothing'}.`, purse ? 'good' : 'warn');
}

function collectTribute(run) {
  const year = dateOf(run.week).year;
  const due = Math.round(TRIBUTE.perYear * year * (hasDecree(run, 'greedyEmperor') ? 1.5 : 1) * (hasPolicy(run, 'lowerTribute') ? 0.7 : 1));
  if (run.tributePaid === year) {
    log(run, 'The Emperor\'s collectors find your tribute already paid.', 'event');
  } else if (run.gold >= due) {
    run.gold -= due;
    log(run, `You pay the Emperor's tribute: ${due} Gold.`, 'event');
  } else {
    log(run, `You can't pay the ${due} Gold tribute. The Emperor takes what you have, and remembers.`, 'bad');
    run.gold = 0;
    changeFavor(run, FAVOR.unpaidTribute, 'unpaid tribute');
  }
}

function changeFavor(run, delta, why) {
  if (!delta) return;
  run.favor = clamp(run.favor + delta, 0, FAVOR.max);
  log(run, `Imperial Favour ${delta > 0 ? '+' : ''}${delta} (${why}): now ${run.favor}.`, delta > 0 ? 'good' : 'bad');
}

// ---------- Growth: XP, levels, perks ----------

export function xpFor(won, boss, upset) {
  const base = (won ? XP.win : XP.loss) * (boss ? XP.bossMultiplier : 1);
  return base + (won && upset ? XP.upsetBonus : 0);
}

function perkOffer(run, f) {
  const pool = Object.keys(PERKS).filter((p) => (PERKS[p].repeatable || !f.perks.includes(p)) && (!PERKS[p].req || PERKS[p].req(f)));
  const offer = [];
  while (offer.length < 3 && pool.length) offer.push(pool.splice(int(run.rng.growth, 0, pool.length - 1), 1)[0]);
  return offer;
}

function gainXp(run, f, amount) {
  f.xp += amount;
  while (f.level <= XP.levels.length && f.xp >= XP.levels[f.level - 1]) {
    f.level += 1;
    f.pendingPerks.push(perkOffer(run, f));
    log(run, `${f.name} reaches level ${f.level}! Choose a perk.`, 'event');
  }
}

export function perkBlocker(run, id, perk) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!f.pendingPerks[0]?.includes(perk)) return 'That perk is not on offer.';
  return null;
}

export function choosePerk(run, id, perk) {
  assertOk(perkBlocker(run, id, perk));
  const f = findFighter(run, id);
  f.pendingPerks.shift();
  f.perks.push(perk);
  for (const [stat, n] of Object.entries(PERKS[perk].stat ?? {})) f[stat] += n;
  if (PERKS[perk].stat?.power) f.perkPower = (f.perkPower ?? 0) + PERKS[perk].stat.power;
  log(run, `${f.name} learns ${PERKS[perk].name}.`, 'good');
}

// The Temple of Fortuna: pay to swap a fighter's waiting perk choices for three new ones.
export const prayPrice = (run) => effectAt('temple', maxLevel(run, 'temple'));
export function prayBlocker(run, id) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!maxLevel(run, 'temple')) return 'Build the Temple of Fortuna first.';
  const f = findFighter(run, id);
  if (!f?.pendingPerks.length) return 'No perk choice to pray over.';
  if (run.gold < prayPrice(run)) return `Needs ${prayPrice(run)} Gold.`;
  return null;
}
export function pray(run, id) {
  assertOk(prayBlocker(run, id));
  const f = findFighter(run, id);
  run.gold -= prayPrice(run);
  f.pendingPerks[0] = perkOffer(run, f);
  log(run, `You burn incense to Fortuna for ${f.name}. New paths open: ${f.pendingPerks[0].map((p) => PERKS[p].name).join(', ')}.`, 'event');
}

// ---------- Overcoming fear (the designer, 5.4.2) ----------

// A win against the style a fighter fears counts toward conquering it; FEAR.conquerWins of them, and the scar is gone.
function faceFear(run, f, oppSide) {
  const vs = meleeOnly(oppSide) ? 'melee' : 'ranged';
  const sc = (f.scars ?? []).find((x) => x.id === 'afeared' && x.vs === vs);
  if (!sc) return null;
  sc.faced = (sc.faced ?? 0) + 1;
  if (sc.faced < FEAR.conquerWins) {
    log(run, `${f.name} beat a ${vs} fighter, the kind they fear (${sc.faced}/${FEAR.conquerWins} to conquer it).`, 'event');
    return null;
  }
  f.scars = f.scars.filter((x) => x !== sc);
  chronicle(run, f, `Faced their fear of ${vs} fighters, and beat it.`);
  log(run, `${f.name} has conquered their fear: no longer Afeared of ${vs} fighters.`, 'good');
  return `No longer Afeared (${vs})`;
}
// The Temple of Fortuna's rite: one Afeared scar lifted, for Gold.
export const ritePrice = (run) => FEAR.ritePrice + FEAR.ritePerTier * Math.min(run.topTier, CIRCUITS.length);
export function riteBlocker(run, id) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!maxLevel(run, 'temple')) return 'Build the Temple of Fortuna first.';
  const f = findFighter(run, id);
  if (!f) return 'Choose a fighter from your roster.';
  if (!(f.scars ?? []).some((x) => x.id === 'afeared')) return `${f.name} isn't Afeared.`;
  if (run.gold < ritePrice(run)) return `Needs ${ritePrice(run)} Gold.`;
  return null;
}
export function rite(run, id) {
  assertOk(riteBlocker(run, id));
  const f = findFighter(run, id);
  const sc = f.scars.find((x) => x.id === 'afeared');
  run.gold -= ritePrice(run);
  f.scars = f.scars.filter((x) => x !== sc);
  chronicle(run, f, `Fortuna's priests lifted their fear of ${sc.vs} fighters.`);
  log(run, `The priests of Fortuna lift ${f.name}'s fear: no longer Afeared of ${sc.vs} fighters.`, 'good');
}

// ---------- The Unnatural Temple of Vulcan (5.3.0): raising the dead ----------

export const reanimatePrice = (run) => REANIMATE.price + REANIMATE.perTier * Math.min(run.topTier, CIRCUITS.length);
// The fallen the Temple could raise now: killed in the arena (or a spy you executed: `body`), recently enough, never raised before.
export const raisable = (run) => !maxLevel(run, 'vulcan') ? [] : run.fallen.filter((f) => (f.arena || f.body) && !f.raised && f.kind !== 'revenant' && run.week - f.diedWeek <= effectAt('vulcan', maxLevel(run, 'vulcan')));
export function reanimateBlocker(run, id) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!maxLevel(run, 'vulcan')) return 'Build the Unnatural Temple of Vulcan first.';
  const f = run.fallen.find((x) => x.id === id);
  if (!f) return 'No such fallen fighter.';
  if (!f.arena && !f.body) return `${f.name} was executed; the Praetorians burned the body.`;
  if (f.raised || f.kind === 'revenant') return 'Vulcan cannot kindle the same body twice.';
  const keeps = effectAt('vulcan', maxLevel(run, 'vulcan'));
  if (run.week - f.diedWeek > keeps) return `${f.name} has been dead too long (a body keeps ${keeps} weeks${maxLevel(run, 'vulcan') < BUILDINGS.vulcan.per.length ? '; a bigger Temple keeps them longer' : ''}).`;
  if (run.roster.length >= rosterCap(run)) return `Your quarters are full (${rosterCap(run)} fighters).`;
  if (run.gold < reanimatePrice(run)) return `Needs ${reanimatePrice(run)} Gold.`;
  return null;
}
export function reanimate(run, id) {
  assertOk(reanimateBlocker(run, id));
  const body = run.fallen.find((x) => x.id === id);
  body.raised = true;
  run.gold -= reanimatePrice(run);
  const f = structuredClone(body);
  for (const key of ['diedWeek', 'arena', 'raised', 'bond', 'political', 'record', 'mood', 'nemesisOf']) delete f[key];
  const lost = maxLevel(run, 'vulcan') >= 2 ? 0 : REANIMATE.power;
  Object.assign(f, {
    id: newId(run, 'f'), kind: 'revenant', kindTrait: pick(run.rng.growth, KINDS.revenant.traits), alive: true, injuries: [],
    stress: 0, job: 'rest', morale: REANIMATE.morale, topStreak: 0, pendingPerks: [], revenantOf: body.id, power: body.power + lost, risen: true, // until their first fight back
  });
  run.roster.push(f);
  chronicle(run, f, `Raised from the dead in the Unnatural Temple of Vulcan, ${run.week - body.diedWeek} week${run.week - body.diedWeek === 1 ? '' : 's'} after falling. ${TRAITS[f.kindTrait].name}.`);
  log(run, `The priests of Vulcan work through the night. ${f.name} walks out of the forge: a Revenant, brass where the wounds were${lost ? `, and a little weaker (${lost} Power)` : ''}.`, 'event');
  return f;
}

// The Exhibition Ring: on tournament day, two of your fighters who aren't competing fight each other for the crowd.
export function exhibitionBlocker(run, id, otherId) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!maxLevel(run, 'exhibition')) return 'Build the Exhibition Ring first.';
  if (!run.bouts) return 'Exhibitions happen on tournament day.';
  if (run.exhibitionWeek === run.week) return 'The ring has had its bout this week.';
  const [a, b] = [findFighter(run, id), findFighter(run, otherId)];
  if (!a || !b || a === b) return 'Choose two different fighters.';
  for (const f of [a, b]) {
    if (foughtThisWeek(run).includes(f.id)) return `${f.name} already fought this week.`;
    if (f.injuries.some((i) => i.weight > 0)) return `${f.name} is injured.`;
    if (f.morale < MORALE.mutinous) return `${f.name} is mutinous and refuses to fight.`;
  }
  return null;
}
export function exhibition(run, id, otherId) {
  assertOk(exhibitionBlocker(run, id, otherId));
  const [a, b] = [findFighter(run, id), findFighter(run, otherId)];
  const r = run.rng.fight;
  // One quick bout by the Power table; nobody dies in an exhibition.
  const delta = clamp(effectivePower(a) - effectivePower(b), -10, 10);
  const [winner, loser] = next(r) * 100000 < deltaRow(delta).win ? [a, b] : [b, a];
  const gold = EXHIBITION.goldPerTier * Math.min(run.topTier, CIRCUITS.length);
  run.exhibitionWeek = run.week;
  run.gold += gold;
  winner.renown += EXHIBITION.renown;
  gainXp(run, winner, EXHIBITION.xpWin);
  gainXp(run, loser, EXHIBITION.xpLoss);
  const wound = next(r) < EXHIBITION.woundChance;
  if (wound) loser.injuries.push({ tag: 'fleshWound', weight: 1, weeksLeft: HEAL_WEEKS.fleshWound });
  formBond(run, a, b, 'exhibition');
  log(run, `Exhibition: ${winner.name} beats ${loser.name} in the ring. +${gold} Gold from the crowd${wound ? `; ${loser.name} takes a Flesh Wound` : ''}.`, 'good');
  return { winner: winner.name, loser: loser.name, gold, wound };
}

// ---------- Inventory: decor and gear ----------

export function buyDecorBlocker(run, item) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!DECOR[item]) return 'Unknown decor item.';
  if (run.gold < DECOR[item].price) return `Needs ${DECOR[item].price} Gold.`;
  return null;
}

export function buyDecor(run, item) {
  assertOk(buyDecorBlocker(run, item));
  run.gold -= DECOR[item].price;
  run.inventory.decor[item] += 1;
}

export function assignDecorBlocker(run, id, item) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!DECOR[item]) return 'Unknown decor item.';
  if (!run.inventory.decor[item]) return `No ${DECOR[item].name} in the storeroom. Buy one first.`;
  if (f.decor[item] >= decorCap(run)) return `Quarters fit ${decorCap(run)} of each item. Upgrade Fighter Quarters for more.`;
  return null;
}

export function assignDecor(run, id, item) {
  assertOk(assignDecorBlocker(run, id, item));
  run.inventory.decor[item] -= 1;
  findFighter(run, id).decor[item] += 1;
}

export function removeDecorBlocker(run, id, item) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!f.decor[item]) return 'Nothing to remove.';
  return null;
}

export function removeDecor(run, id, item) {
  assertOk(removeDecorBlocker(run, id, item));
  findFighter(run, id).decor[item] -= 1;
  run.inventory.decor[item] += 1;
}

export function buyGearBlocker(run, index) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const key = run.armourerStock[index];
  if (!key) return 'Not in stock.';
  if (run.gold < GEAR[key].price) return `Needs ${GEAR[key].price} Gold.`;
  return null;
}

export function buyGear(run, index) {
  assertOk(buyGearBlocker(run, index));
  const [key] = run.armourerStock.splice(index, 1);
  run.gold -= GEAR[key].price;
  run.inventory.gear.push(key);
  return key;
}

export function equipBlocker(run, id, index) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!findFighter(run, id)) return 'No such fighter.';
  if (!run.inventory.gear[index]) return 'No such item in the storeroom.';
  return null;
}

// Equip from the storeroom; whatever was in that slot goes back to the storeroom.
export function equip(run, id, index) {
  assertOk(equipBlocker(run, id, index));
  const f = findFighter(run, id);
  const [key] = run.inventory.gear.splice(index, 1);
  const slot = GEAR[key].slot;
  if (f.gear[slot]) run.inventory.gear.push(f.gear[slot]);
  f.gear[slot] = key;
}

export const sellPrice = (key) => Math.floor(GEAR[key].price / 2);

export function sellGearBlocker(run, index) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!run.inventory.gear[index]) return 'No such item in the storeroom.';
  return null;
}

// Sell spare storeroom gear back to the Armourer for half its price.
export function sellGear(run, index) {
  assertOk(sellGearBlocker(run, index));
  const [key] = run.inventory.gear.splice(index, 1);
  run.gold += sellPrice(key);
  log(run, `Sold a ${GEAR[key].name} for ${sellPrice(key)} Gold.`);
  return sellPrice(key);
}

export function unequipBlocker(run, id, slot) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!f.gear[slot]) return 'Nothing equipped.';
  return null;
}

export function unequip(run, id, slot) {
  assertOk(unequipBlocker(run, id, slot));
  const f = findFighter(run, id);
  run.inventory.gear.push(f.gear[slot]);
  f.gear[slot] = null;
}

// Return every fighter's gear to the storeroom at once, so it can be handed out afresh (playtest #7).
export function unequipAllBlocker(run) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!run.roster.some((f) => f.gear.weapon || f.gear.armor)) return 'Nobody has gear equipped.';
  return null;
}

export function unequipAll(run) {
  assertOk(unequipAllBlocker(run));
  const off = [];
  for (const f of run.roster) for (const slot of ['weapon', 'armor']) if (f.gear[slot]) { off.push(`${f.name}'s ${GEAR[f.gear[slot]].name}`); unequip(run, f.id, slot); }
  log(run, `Back to the storeroom: ${off.join(', ')}.`, 'info');
}

// ---------- Surgeon ----------

export const surgeonPrice = (run) => ECONOMY.surgeonCost + ECONOMY.surgeonPerTier * (Math.min(run.topTier, CIRCUITS.length) - 1);

export function surgeonBlocker(run, id, index) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!f.injuries[index]) return 'No such injury.';
  if (run.gold < surgeonPrice(run)) return `The Emergency Surgeon needs ${surgeonPrice(run)} Gold.`;
  return null;
}

export function surgeon(run, id, index) {
  assertOk(surgeonBlocker(run, id, index));
  const f = findFighter(run, id);
  f.injuries.splice(index, 1);
  run.gold -= surgeonPrice(run);
  if (f.job === 'medbay' && !f.injuries.length) f.job = 'rest';
}

// The Medbay heals injuries in order: put the one you want healed first at the front.
export function treatFirstBlocker(run, id, index) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!f.injuries[index]) return 'No such injury.';
  return null;
}

export function treatFirst(run, id, index) {
  assertOk(treatFirstBlocker(run, id, index));
  const f = findFighter(run, id);
  const [inj] = f.injuries.splice(index, 1);
  f.injuries.unshift(inj);
}

// Cyborg surgery: replace a Maimed limb or Blinded eye with an augment (Medbay Lv 2+).
export const augmentPrice = (run) => SURGERY.cost + SURGERY.perTier * (Math.min(run.topTier, 4) - 1);
const augmentFor = (tag) => Object.keys(AUGMENTS).find((k) => AUGMENTS[k].from === tag);

export function augmentBlocker(run, id, index) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  const inj = f.injuries[index];
  if (!inj || !augmentFor(inj.tag)) return 'Only a Maimed or Blinded wound can be replaced.';
  if (maxLevel(run, 'medbay') < SURGERY.medbay) return `Cyborg surgery needs a Medbay level ${SURGERY.medbay}.`;
  if (f.augments?.includes(augmentFor(inj.tag))) return `${f.name} already has a ${AUGMENTS[augmentFor(inj.tag)].name}.`;
  if (run.gold < augmentPrice(run)) return `Needs ${augmentPrice(run)} Gold.`;
  return null;
}

export function augment(run, id, index) {
  assertOk(augmentBlocker(run, id, index));
  const f = findFighter(run, id);
  const [inj] = f.injuries.splice(index, 1);
  const key = augmentFor(inj.tag);
  run.gold -= augmentPrice(run);
  f.augments = [...(f.augments ?? []), key];
  f.renown = Math.max(0, f.renown + SURGERY.renown);
  if (f.job === 'medbay' && !f.injuries.length) f.job = 'rest';
  chronicle(run, f, `Rebuilt with a ${AUGMENTS[key].name}.`);
  log(run, `${f.name} wakes with a ${AUGMENTS[key].name}. The crowd mutters about machines.`, 'event');
}

// Retirement: a veteran leaves for the Hall of Champions; the house gains Prestige and the roster takes heart.
export function retireBlocker(run, id) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (f.level < RETIRE.level && !f.titles?.length) return `Only veterans retire: level ${RETIRE.level} or a Title.`;
  return null;
}

export function retire(run, id) {
  assertOk(retireBlocker(run, id));
  const f = findFighter(run, id);
  chronicle(run, f, 'Retired to the Hall of Champions.');
  if (f.want?.id === 'retire') talk(run, `want-done-${f.id}-${f.want.since}`, [{ speaker: 'fighter', fighterId: f.id, text: WANTS.retire.thanks(f.want) }]); // 5.4.0: what they wanted
  stripFighter(run, f);
  run.roster = run.roster.filter((x) => x !== f);
  run.prestige += RETIRE.prestige;
  for (const x of run.roster) bumpMorale(x, RETIRE.morale);
  const legend = { name: f.name, kind: f.kind, humor: f.humor, id: f.id, cls: f.cls, titles: f.titles, kills: f.kills ?? 0, renown: f.renown, level: f.level, wins: winsOf(run, f), story: f.story, seed: run.seed, ...(f.returned ? { returned: f.returned, carried: f.carried } : {}) };
  run.retired = [...(run.retired ?? []), legend];
  log(run, `${f.name} retires to the Hall of Champions. +${RETIRE.prestige} Prestige, and the roster takes heart.`, 'good');
  return legend;
}

// ---------- Tournaments ----------

// A fighter's wins, a Revenant's from before their death included.
export const winsOf = (run, f) => run.history.filter((h) => h.won && h.fighterId && [f.id, f.revenantOf].includes(h.fighterId)).length;
export const foughtThisWeek = (run) => run.history.filter((h) => h.week === run.week && h.fighterId).map((h) => h.fighterId);

export function fightBlocker(run, id, tier = run.topTier) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!run.bouts) return 'Fights happen on tournament weeks.';
  if (run.bouts[tier] !== 'open') return run.bouts[tier] ? 'This arena is settled for the week.' : 'That arena is not open to you.';
  const f = findFighter(run, id);
  if (!f) return 'Choose a fighter from your roster.';
  const bracket = bracketOf(run, tier);
  const midBracket = bracket?.fighterId && bracket.round > 0;
  if (midBracket && bracket.fighterId !== id) return `${findFighter(run, bracket.fighterId)?.name ?? 'Another fighter'} is in the bracket here.`;
  if (!midBracket && foughtThisWeek(run).includes(id)) return `${f.name} already fought this week.`;
  if (f.pendingPerks.length) return `${f.name} levelled up: choose a perk first.`;
  if (f.morale < MORALE.mutinous) return `${f.name} is mutinous and refuses to fight.`;
  if (!midBracket && run.prestige < boutFor(run, tier).buyIn) return `Needs ${boutFor(run, tier).buyIn} Prestige for the buy-in (you have ${run.prestige}).`;
  return null;
}

// Pays the buy-in and returns a match for the UI to play round by round.
export function startMatch(run, id, tier = run.topTier) {
  assertOk(fightBlocker(run, id, tier));
  const bout = boutFor(run, tier);
  const fighter = findFighter(run, id);
  const bracket = bracketFor(run, tier); // normally drawn at the start of the week; created here for older saves
  // A bracket's buy-in is paid once, before the Quarter-final.
  const buyIn = bracket?.round > 0 ? bracket.buyIn : bout.buyIn;
  if (!(bracket?.round > 0)) run.prestige -= buyIn;
  if (bracket) Object.assign(bracket, { fighterId: id, buyIn });
  run.inMatch = true;
  run.matchInfo = { fighterId: id, tier, buyIn }; // what was paid (the Dirt Pits may take less)
  return createMatch({ a: fighter, b: opponentFor(run, tier), rng: run.rng.fight, ...matchOptions(run, fighter, tier) });
}

// Remember the fight so far (call after every round), so a reload mid-match keeps what already happened.
export function recordMatchProgress(run, match) {
  if (run.matchInfo) run.matchInfo.progress = { injuries: structuredClone(match.a.f.injuries), alive: match.a.f.alive };
}

// ---------- Consumables ----------

export function buyItemBlocker(run, key) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!CONSUMABLES[key]) return 'Unknown item.';
  if (run.gold < CONSUMABLES[key].price) return `Needs ${CONSUMABLES[key].price} Gold.`;
  return null;
}

export function buyItem(run, key) {
  assertOk(buyItemBlocker(run, key));
  run.gold -= CONSUMABLES[key].price;
  run.inventory.items[key] = (run.inventory.items[key] ?? 0) + 1;
}

export function useItemBlocker(run, match, key) {
  if (!run.inMatch || !match || match.over) return 'Items are used during a match.';
  if (match.itemsUsed?.includes(key)) return `Already used a ${CONSUMABLES[key]?.name ?? 'that item'} this fight (one of each kind per fight).`;
  if (!CONSUMABLES[key]) return 'Unknown item.';
  if (!run.inventory.items[key]) return `No ${CONSUMABLES[key].name} in the storeroom.`;
  return null;
}

// ---------- Betting on your own fighter (fun idea #3) ----------

// What a bet would pay if your fighter wins: the stake at the bookmaker's odds (from the fighter's real chance to win).
export function betOdds(run, match) {
  const tier = match.bout?.tier ?? run.matchInfo?.tier ?? run.topTier;
  const { win } = estimateOdds(match.a.f, match.b.f, { ...matchOptions(run, match.a.f, tier), n: 400, seed: 777 });
  return Math.min(BET.maxOdds, BET.cut / Math.max(0.01, win));
}
export const betCap = (run, match) => BET.perTier * Math.min(match.bout?.tier ?? run.topTier, CIRCUITS.length);
export function betBlocker(run, match, stake) {
  if (!run.inMatch || !match || match.over) return 'Bets are placed during a match.';
  if (match.round > 0) return 'Bets close when Round 1 begins.';
  if (match.bet) return 'You have already bet on this fight.';
  if (!(stake > 0)) return 'Choose a stake.';
  if (stake > betCap(run, match)) return `The bookmakers take up to ${betCap(run, match)} Gold here.`;
  if (run.gold < stake) return `Needs ${stake} Gold.`;
  // Playtest #9: small bets on a favourite returned only the stake. A bet that can't win anything isn't taken.
  const odds = betOdds(run, match);
  if (betPayout(stake, odds) <= stake) return `At ×${odds.toFixed(2)} a ${stake} Gold bet would win nothing: the bookmakers won't take it. Stake more, or keep your Gold.`;
  return null;
}
// What a winning bet returns, stake included (rounded down: the bookmaker keeps the change).
export const betPayout = (stake, odds) => Math.floor(stake * odds);
export function placeBet(run, match, stake) {
  assertOk(betBlocker(run, match, stake));
  const odds = betOdds(run, match);
  run.gold -= stake;
  match.bet = { stake, odds, payout: betPayout(stake, odds) };
  log(run, `You bet ${stake} Gold on ${match.a.f.name} at ×${odds.toFixed(2)}: a win returns ${match.bet.payout} Gold (+${match.bet.payout - stake}).`, 'event');
  return match.bet;
}

// The crowd's hype pays out with the purse (fun idea #6).
function payHype(run, match, won, tier, summary) {
  const hype = hypeOf(match);
  if (!hype) return;
  const renown = Math.floor(hype / (won ? HYPE.renownPer : HYPE.lossRenownPer));
  const gold = won ? Math.floor(hype / HYPE.goldPer) * Math.min(tier, CIRCUITS.length) : 0;
  summary.hype = { hype, renown, gold };
  summary.renown += renown;
  summary.gold += gold;
}

// A bet is settled with the match's purse: a win pays the payout; a loss (or capitulating) loses the stake.
// A match's purse without a won bet's payout, which the result shows on its own line (playtest #10).
export const purseGold = (s) => s.gold - (s.bet?.won ? s.bet.payout : 0);

function settleBet(run, match, won, summary) {
  if (!match.bet) return;
  summary.bet = { ...match.bet, won };
  if (won) {
    summary.gold += match.bet.payout;
    log(run, `The bookmakers pay out ${match.bet.payout} Gold on your ${match.bet.stake} Gold bet: +${match.bet.payout - match.bet.stake} profit.`, 'good');
    const dice = Math.floor(match.bet.stake * relicSum(run, 'betBonus'));
    if (dice) {
      summary.gold += dice;
      summary.bet.dice = dice;
      log(run, `The Loaded Dice: +${dice} Gold more.`, 'good');
    }
  } else log(run, `The ${match.bet.stake} Gold bet is lost.`, 'bad');
}

// Use an item on your fighter for the next round (or, for the Crowd Bribe, for this fight).
export function useItem(run, match, key) {
  assertOk(useItemBlocker(run, match, key));
  const item = CONSUMABLES[key];
  run.inventory.items[key] -= 1;
  match.itemsUsed = [...(match.itemsUsed ?? []), key];
  if (item.boost) match.a.boosts = [...(match.a.boosts ?? []), { ...item.boost, name: item.name, round: match.round + 1 }];
  if (item.foe) match.b.boosts = [...(match.b.boosts ?? []), { ...item.foe, name: item.name, round: match.round + 1 }];
  if (item.salts) {
    for (const inj of match.a.f.injuries) if (['distracted', 'concussed'].includes(inj.tag)) inj.suppressed = true;
    match.a.disabled = match.a.disabled.filter((slot) => !match.a.distracted?.includes(slot));
  }
  if (item.bribe) match.bribe = true;
  if (item.stressAfter) match.stressAfter = item.stressAfter;
  log(run, `${match.a.f.name} uses ${item.name}.`, 'event');
}

export function skipBlocker(run) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!run.boutPending) return 'No bout to skip this week.';
  if (currentBout(run).boss) return 'Bosses cannot be skipped. Fight or forfeit.';
  return null;
}

// Skip your top arena's Tournament 1 or 2: no buy-in, small Gold reward, the roster recovers.
export function skipBout(run) {
  assertOk(skipBlocker(run));
  run.gold += ECONOMY.skipGold;
  for (const f of run.roster) f.stress = clampStress(f.stress - ECONOMY.skipStressRelief);
  const bout = currentBout(run);
  run.history.push({ week: run.week, tier: bout.tier, name: bout.name, skipped: true });
  log(run, `You skip ${bout.name}: +${ECONOMY.skipGold} Gold, and the roster rests.`);
  settleBout(run, bout.tier);
  run.arenas[bout.tier].stage += 1;
  newOpponent(run, bout.tier);
  checkLoss(run);
}

export function forfeitBlocker(run) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!run.boutPending) return 'No bout this week.';
  if (!currentBout(run).boss) return 'Skip this tournament instead.';
  return null;
}

// Forfeiting your top arena's Boss costs Imperial Favour.
export function forfeitBout(run) {
  assertOk(forfeitBlocker(run));
  const bout = currentBout(run);
  run.history.push({ week: run.week, tier: bout.tier, name: bout.name, won: false, forfeit: true });
  log(run, `You forfeit ${bout.name}.`, 'bad');
  settleBout(run, bout.tier);
  changeFavor(run, bossLossFavor(bout.tier, run) + FAVOR.forfeitExtra, 'forfeited a Boss');
  if (bout.tier === GRAND_TIER) newOpponent(run, bout.tier);
  else restartCircuit(run, bout.tier);
  checkLoss(run);
}

function settleBout(run, tier) {
  if (run.bouts) run.bouts[tier] = 'done';
  if (tier === run.topTier) run.boutPending = false;
}

// The Final of a Boss tournament from the Silver Coliseum up: losing it returns the buy-in (BRACKET.bossFinalRefund).
export const keepsBuyIn = (run, tier) => Boolean(BRACKET.bossFinalRefund) && tier !== GRAND_TIER && hasBracket(tier) && boutFor(run, tier).boss && bracketOf(run, tier)?.round === 2;

export function finishMatch(run, match) {
  if (!run.inMatch) throw new Error('No match in progress.');
  if (!match.over) throw new Error('The match is not over.');
  const { tier } = run.matchInfo;
  const bout = { ...boutFor(run, tier), buyIn: run.matchInfo.buyIn ?? boutFor(run, tier).buyIn };
  const arena = run.arenas[tier];
  const fighter = findFighter(run, match.a.f.id);
  const bracket = bracketOf(run, tier);
  const opp = bracket && bracket.round < 2 ? bracket.foes[bracket.round] : arena.opponent;
  const newInjuries = match.a.f.injuries.filter((i) => i.weeksLeft === undefined).map((i) => INJURY_BY_TAG[i.tag].name);
  fighter.injuries = match.a.f.injuries.map(({ suppressed, ...i }) => ({ ...i, weeksLeft: i.weeksLeft ?? HEAL_WEEKS[i.tag] }));
  fighter.alive = match.a.f.alive;
  const coin = !fighter.alive && hasRelic(run, 'proserpina'); // version 6: the coin pays the ferryman once
  if (coin) {
    fighter.alive = true;
    run.relics = run.relics.filter((id) => id !== 'proserpina');
  }
  fighter.stress = clampStress(fighter.stress + STRESS.fight + (match.stressAfter ?? 0));

  const won = match.result.winner === 'A';
  // A bracket's Quarter- or Semi-final won: a purse and XP, then on to the next match.
  if (bracket && bracket.round < 2 && won && fighter.alive) return finishBracketMatch(run, match, fighter, opp, tier, bracket, newInjuries);
  // Judged on the Power each side actually fought with in Round 1 (decor, augments, feuds, festivals...).
  const r1 = match.rounds?.[0]?.power;
  const gap = r1 ? r1.A.total - r1.B.total : effectivePower(fighter) - effectivePower(opp);
  const upset = gap < 0;
  const champion = tier !== GRAND_TIER && !bout.top && isChampionOf(fighter, tier);
  // Rookies are never jeered: only a known name (5+ Renown) crushing a weak opponent, or a returning champion.
  const crushing = won && !bout.top && !champion && fighter.renown >= ECONOMY.knownRenown && gap >= crushingGapFor(run, tier);
  const moraleBefore = fighter.morale;
  const levelBefore = fighter.level;
  if (bout.top) {
    fighter.topStreak = (fighter.topStreak ?? 0) + 1;
    fighter.foughtTopWeek = run.week;
  }
  const bloodied = won && effectiveInjuries(fighter) >= 2;
  const summary = {
    week: run.week, tier, name: bout.name, boss: bout.boss, top: bout.top, won, reason: match.result.reason,
    fighter: fighter.name, fighterId: fighter.id, died: !fighter.alive, gold: 0, prestige: -bout.buyIn, bloodFaith: false,
    title: null, favor: 0, xp: 0, renown: 0, loot: null, levelUp: null, crushing, champion: won && champion,
    injuries: fighter.alive ? newInjuries : [], morale: 0, levels: 0, bloodied, kill: false, mark: null, festival: bout.festival ?? null, saved: coin,
  };
  if (coin) {
    chronicle(run, fighter, `Fell in ${bout.name} and was carried out alive: Proserpina took the coin instead.`);
    log(run, `${fighter.name} falls, but is carried out alive. Proserpina's Coin is spent.`, 'event');
  }
  const favorBefore = run.favor;

  if (won) {
    const fest = bout.festival ? FESTIVAL_BY_ID[bout.festival] : null;
    summary.gold = bout.winGold + Math.floor(fighter.renown / RENOWN.goldPer);
    if (upset && fest?.upset) summary.gold *= fest.upset;
    summary.prestige += bout.buyIn + (champion ? 0 : bout.winPrestige);
    if (!crushing && !champion) {
      summary.renown = RENOWN.win + (bout.boss ? RENOWN.bossWin : 0) + (upset ? RENOWN.upset : 0) + (fighter.perks.includes('crowdPleaser') ? 1 : 0)
        + (fighter.decor.warBanner ?? 0) * DECOR.warBanner.renown + (bloodied ? BLOODIED.renown : 0) + (fest?.renown ?? 0)
        + (plotActive(run) && run.plot.crowdUntil > run.week ? 1 : 0); // v6: the pamphlets warmed the crowd to your house
    }
    if (bloodied) bumpMorale(fighter, BLOODIED.morale);
    // Kill tally and marks.
    if (match.result.reason === 'death') {
      const before = killMarks(fighter).length;
      fighter.kills = (fighter.kills ?? 0) + 1;
      summary.kill = true;
      const marks = killMarks(fighter);
      if (marks.length > before) {
        summary.mark = marks.at(-1).name;
        log(run, `${fighter.name} has ${fighter.kills} kills and earns the mark ${summary.mark}: ${marks.at(-1).desc}`, 'event');
      }
    }
    bumpMorale(fighter, crushing || champion ? MORALE.crowdJeers : MORALE.win);
    if (champion) {
      log(run, `The crowd boos ${fighter.name}, a champion of this arena picking on its newcomers.`, 'warn');
      changeFavor(run, FAVOR.championReturn, 'a champion fighting back in a lower arena');
    } else if (crushing) {
      log(run, `The crowd jeers ${fighter.name} for crushing a much weaker opponent.`, 'warn');
      changeFavor(run, FAVOR.crushingWin, 'a crushing win in a lower arena');
    }
    if (bout.top && bout.boss) changeFavor(run, FAVOR.bossWin, `beat ${bout.name}`);
    if (upset) changeFavor(run, FAVOR.upsetWin * (fest?.upset ?? 1), fest?.upset ? `an upset at the ${fest.name}` : 'an upset');
    if (bloodied) changeFavor(run, FAVOR.spectacleWin, 'a Bloodied Victory (won with 2+ injuries)');
    // Loot: claim the loser's gear. Only your top arena's Boss always drops it (no farming conquered Bosses).
    claimLoot(run, fighter, opp, summary, bout.boss && bout.top);
    // Championships: beat an arena's Boss, or win there 3 times. One Title (+1 Power) per arena.
    if (tier !== GRAND_TIER) {
      fighter.arenaWins = { ...(fighter.arenaWins ?? {}), [tier]: (fighter.arenaWins?.[tier] ?? 0) + 1 };
      if (!isChampionOf(fighter, tier) && (bout.boss || fighter.arenaWins[tier] >= ECONOMY.titleWins)) {
        const titles = crownChampion(fighter, tier);
        summary.title = titles.join(', ');
        summary.titlePower = titles.length;
      }
    }
    if (tier === GRAND_TIER) {
      fighter.titles.push('Master of the Games');
      summary.title = 'Master of the Games';
    }
  } else {
    summary.gold = bout.lossGold;
    bumpMorale(fighter, match.result.reason === 'towel' ? MORALE.towel : MORALE.loss);
    const bribed = (match.bribe || hasRelic(run, 'referee')) && match.result.reason === 'towel';
    summary.bribed = Boolean(bribed);
    if (match.result.reason === 'towel' && !bribed) summary.renown = RENOWN.towel;
    if (!fighter.alive && kindActive(match.a, 'bloodFaith', match.round)) {
      summary.bloodFaith = true;
      summary.gold += ECONOMY.bloodFaithGold * Math.min(tier, CIRCUITS.length); // the clan honours the sacrifice
      summary.prestige += bout.buyIn;
    }
    // Losing the Final of a Boss tournament from the Silver Coliseum up keeps the buy-in (the designer's request, 5.4.0):
    // reaching the Boss was worth something. Not the Grand Tournament.
    const refund = keepsBuyIn(run, tier) && !summary.bloodFaith ? Math.floor(bout.buyIn * BRACKET.bossFinalRefund) : 0;
    if (refund) {
      summary.prestige += refund;
      summary.refund = refund;
      log(run, `Reaching the Boss earns respect: ${refund === bout.buyIn ? `the ${refund} Prestige buy-in is` : `${refund} of the ${bout.buyIn} Prestige buy-in are`} returned.`, 'event');
    }
    // Losing a Boss bracket before its Final costs half (you never reached the Boss).
    const early = bracket && bracket.round < 2 && !hasDecree(run, 'harshJudges'); // Harsh Judges don't halve an early Boss loss (LLM-13)
    if (bout.top && bout.boss) changeFavor(run, early ? Math.round(bossLossFavor(tier, run) * BRACKET.earlyBossLoss) : bossLossFavor(tier, run), early ? `lost the ${BRACKET.rounds[bracket.round]} of ${bout.name}` : `lost ${bout.name}`);
    else if (bout.top && match.result.reason === 'towel' && !bribed) changeFavor(run, FAVOR.topTowel, 'capitulated in your top arena');
  }
  // Rival houses: Glory changes hands; kills start feuds.
  const house = houseOf(run, opp);
  if (house) {
    summary.house = house.name;
    const t = tier === GRAND_TIER ? 0 : tier;
    if (won) {
      run.glory += tier === GRAND_TIER ? HOUSES.glory.grand : (bout.boss ? HOUSES.glory.boss : HOUSES.glory.win) * t;
      house.glory = Math.max(0, house.glory - HOUSES.glory.beaten);
      if (match.result.reason === 'death') {
        house.feud = HOUSES.feudMonths;
        house.since = run.week;
        run.graveyard = [...(run.graveyard ?? []), opp.name]; // the dead don't come back
        summary.feud = `${house.name} swears revenge: their fighters get +1 Power against you for ${HOUSES.feudMonths} months.`;
        log(run, summary.feud, 'warn');
      }
    } else {
      house.glory += (bout.boss ? HOUSES.glory.boss : HOUSES.glory.win) * Math.max(1, t);
      house.tier = houseTier(house);
      if (!fighter.alive) {
        house.vengeance = HOUSES.feudMonths;
        house.since = run.week;
        summary.feud = `Your house wants vengeance on ${house.name}: +5% win chance against their fighters for ${HOUSES.feudMonths} months.`;
        log(run, summary.feud, 'event');
      }
    }
  }
  if (won && opp.nemesis) nemesisFalls(run, opp, fighter, tier, summary); // before the purse is paid
  if (opp.rivalChampion) {
    rivalChampionResult(run, opp, fighter, tier, won, summary);
    if (won && match.result.reason === 'death') rivalChampionKilled(run, opp.name);
  }
  settleBet(run, match, won, summary);
  payHype(run, match, won, tier, summary);
  relicRewards(run, fighter, won, summary);
  if (bout.top && run.wager) settleWager(run, won, summary);
  if (fighter.risen) { // a Revenant's first fight back (the crowd's chant is in the hype)
    delete fighter.risen;
    summary.risen = true;
    chronicle(run, fighter, `Fought again, back from the dead. The crowd chanted their name.`);
    log(run, `The crowd chants ${fighter.name}'s name: the dead fighter walks the sand again.`, 'event');
  }
  summary.favor = run.favor - favorBefore;
  summary.morale = fighter.morale - moraleBefore;
  run.gold += summary.gold;
  run.prestige += summary.prestige + bout.buyIn; // buy-in was already paid in startMatch
  fighter.renown = Math.max(0, fighter.renown + summary.renown);
  summary.xp = xpFor(won, bout.boss, upset) + (bloodied ? BLOODIED.xp : 0) + relicSum(run, 'fightXp');

  // The chronicle, scars and a eulogy.
  if (won) {
    if (!run.history.some((h) => h.won && [fighter.id, fighter.revenantOf].includes(h.fighterId))) chronicle(run, fighter, `First win, in ${bout.name}.`); // a Revenant's old wins count
    if (summary.kill && fighter.kills === 1) chronicle(run, fighter, `First kill: ${opp.name}${house ? ` of ${house.name}` : ''}.`);
    if (summary.title) chronicle(run, fighter, `Became ${summary.title}.`);
    if (summary.mark) chronicle(run, fighter, `Earned the mark ${summary.mark}.`);
    if (bout.boss && !summary.title) chronicle(run, fighter, `Beat the Boss ${opp.name}.`);
  }
  if (fighter.alive && bloodied && !(fighter.scars ?? []).some((sc) => sc.id === 'hardened')) {
    fighter.scars = [...(fighter.scars ?? []), { id: 'hardened' }];
    summary.scar = 'Battle-Hardened';
    chronicle(run, fighter, `Won bloodied and became Battle-Hardened.`);
  }
  const severe = fighter.alive && newInjuries.length && match.a.f.injuries.some((i) => i.weeksLeft === undefined && SEVERE.includes(i.tag));
  if (severe && next(run.rng.growth) < SCAR_CHANCE) {
    const vs = meleeOnly(match.b ?? { f: opp }) ? 'melee' : 'ranged';
    const afeared = SCAR_AFEARED[fighter.humor] ?? SCAR_AFEARED.other;
    const id = afeared > 0 && next(run.rng.growth) < afeared ? 'afeared' : 'enraged';
    if (!(fighter.scars ?? []).some((sc) => sc.vs === vs)) {
      fighter.scars = [...(fighter.scars ?? []), { id, vs }];
      summary.scar = `${SCARS[id].name} (${vs})`;
      chronicle(run, fighter, `${opp.name}'s blow left a scar: ${SCARS[id].name} against ${vs} fighters.`);
      log(run, `${fighter.name} is scarred: ${SCARS[id].name} against ${vs} fighters.`, 'warn');
    }
  }
  if (!fighter.alive) {
    chronicle(run, fighter, `Fell in ${bout.name}, killed by ${opp.name}.`);
    const fWins = winsOf(run, fighter);
    summary.eulogy = `Here lies ${fighter.name}: ${fWins} win${fWins === 1 ? '' : 's'}${fighter.kills ? `, ${fighter.kills} kill${fighter.kills === 1 ? '' : 's'}` : ''}${fighter.titles.length ? `, ${fighter.titles.join(', ')}` : ''}.`;
    stripFighter(run, fighter);
    run.roster = run.roster.filter((f) => f !== fighter);
    run.fallen.push({ ...fighter, diedWeek: run.week, arena: true }); // a body the Temple of Vulcan could raise
    for (const f of run.roster) bumpMorale(f, MORALE.allyDeath);
    log(run, `${fighter.name} died in ${bout.name}. The house mourns; their gear returns to the storeroom.`, 'bad');
  } else {
    gainXp(run, fighter, summary.xp);
    summary.levels = fighter.level - levelBefore;
    if (won) summary.fearConquered = faceFear(run, fighter, match.b);
  }
  if (fighter.job === 'medbay' && !fighter.injuries.length) fighter.job = 'rest';
  run.inMatch = false;
  run.matchInfo = null;
  if (bracket) {
    summary.bracket = BRACKET.rounds[bracket.round];
    delete run.brackets[tier];
  }
  settleBout(run, tier);
  const before = run.prestigeLevel;
  run.prestigeLevel = prestigeLevelFor(run.prestige, run.prestigeLevel);
  if (run.prestigeLevel > before) {
    summary.levelUp = run.prestigeLevel;
    log(run, `House Prestige level ${run.prestigeLevel}! New buildings and room plots unlocked.`, 'event');
  }
  run.history.push(summary);
  log(run, `${fighter.name} ${won ? 'won' : 'lost'} ${bout.name}.`, won ? 'good' : 'bad');
  const fought = (match.round ?? 0) > 0; // a withdrawal between bracket matches fights nobody (playtest #10)
  if (!won && fought) recordNemesis(run, opp, tier, fighter, bout.boss);
  advanceArena(run, tier, won, arena.opponent, fought && opp === arena.opponent);
  if (tier === GRAND_TIER && plotActive(run) && run.plot.coup) resolveCoup(run, fighter, won, !bracket || bracket.round >= 2);
  offerMercy(run, match, summary, fighter, opp, tier);
  if (won && opp.rebel && plotActive(run)) rebelBeaten(run, opp, match.result.reason === 'death' ? 'kill' : run.mercy ? null : 'spare');
  return summary;
}

// A won match may claim one piece of the loser's gear (always, for your top arena's Boss).
function claimLoot(run, fighter, opp, summary, always) {
  const drops = [opp.gear?.weapon, opp.gear?.armor].filter(Boolean);
  if (!drops.length || !(always || next(run.rng.growth) < ECONOMY.lootChance)) return;
  summary.loot = pick(run.rng.growth, drops);
  run.inventory.gear.push(summary.loot);
  log(run, `${fighter.name} claims a ${GEAR[summary.loot].name} from the defeated ${opp.name}.`, 'good');
}

function finishBracketMatch(run, match, fighter, opp, tier, bracket, newInjuries) {
  const bout = boutFor(run, tier);
  const round = BRACKET.rounds[bracket.round];
  const next = BRACKET.rounds[bracket.round + 1];
  const kill = match.result.reason === 'death';
  const bloodied = effectiveInjuries(fighter) >= 2; // playtest #10: bracket wins were never Bloodied Victories
  const summary = {
    week: run.week, tier, name: `${bout.name} · ${round}`, boss: false, top: bout.top, won: true, reason: match.result.reason, bloodied,
    fighter: fighter.name, fighterId: fighter.id, died: false, gold: BRACKET.purse * Math.min(tier, 4), prestige: BRACKET.prestigeTopOnly && !bout.top ? 0 : BRACKET.prestige, favor: 0,
    xp: XP.win, renown: 1, injuries: newInjuries, morale: 0, levels: 0, bracket: round, next, kill, house: houseOf(run, opp)?.name ?? null,
  };
  const levelBefore = fighter.level;
  if (bloodied) {
    summary.renown += BLOODIED.renown;
    summary.xp += BLOODIED.xp;
    bumpMorale(fighter, BLOODIED.morale);
    const favorBefore = run.favor;
    changeFavor(run, FAVOR.spectacleWin, 'a Bloodied Victory (won with 2+ injuries)');
    summary.favor = run.favor - favorBefore;
    if (!(fighter.scars ?? []).some((sc) => sc.id === 'hardened')) {
      fighter.scars = [...(fighter.scars ?? []), { id: 'hardened' }];
      summary.scar = 'Battle-Hardened';
      chronicle(run, fighter, `Won bloodied and became Battle-Hardened.`);
    }
  }
  if (opp.rivalChampion) { // before the purse is paid
    rivalChampionResult(run, opp, fighter, tier, true, summary);
    if (kill) rivalChampionKilled(run, opp.name);
  }
  settleBet(run, match, true, summary);
  relicRewards(run, fighter, true, summary);
  summary.xp += relicSum(run, 'fightXp');
  run.gold += summary.gold;
  run.prestige += summary.prestige;
  fighter.renown += summary.renown;
  gainXp(run, fighter, summary.xp);
  summary.levels = fighter.level - levelBefore;
  summary.fearConquered = faceFear(run, fighter, match.b);
  if (kill) {
    fighter.kills = (fighter.kills ?? 0) + 1;
    run.graveyard = [...(run.graveyard ?? []), opp.name];
  }
  claimLoot(run, fighter, opp, summary, false); // as for any other win (the designer's bug report: early rounds never dropped gear)
  const house = houseOf(run, opp);
  if (house) {
    run.glory += HOUSES.glory.win * Math.min(tier, 4);
    house.glory = Math.max(0, house.glory - HOUSES.glory.beaten);
  }
  bracket.round += 1;
  run.inMatch = false;
  run.matchInfo = null;
  run.history.push(summary);
  log(run, `${fighter.name} wins the ${round} of ${bout.name}. On to the ${next}.`, 'good');
  offerMercy(run, match, summary, fighter, opp, tier);
  return summary;
}

// ---------- Thumbs up or down ----------

// After a win over a wounded opponent who still lives, their fate is yours (resolveMercy).
// The crowd calls for blood against a feuding house or a fighter left at the Death Gate, otherwise for mercy.
function offerMercy(run, match, summary, fighter, opp, tier) {
  if (!summary.won || !fighter.alive || summary.kill || run.status !== 'active') return;
  const wounds = effectiveInjuries(match.b.f);
  if (wounds < MERCY.minInjuries) return;
  const house = houseOf(run, opp);
  // The crowd smells blood once the beaten fighter's Death Gate is open (Lions, Unbreakable and Iron Will move it).
  const blood = Boolean(house?.feud || house?.vengeance) || wounds >= deathGateAt(match.b.f, match.b.arena);
  run.mercy = { fighterId: fighter.id, opp: opp.name, house: house?.id ?? null, crowd: blood ? 'kill' : 'spare', tier, top: Boolean(summary.top), at: run.history.length - 1, ...(opp.rivalChampion ? { rivalChampion: true } : {}) };
  summary.mercy = run.mercy.crowd;
}

// The Favour a spare earns now. Only your top arena counts (or any arena under the Edict of Mercy), and only when mercy is
// what's wanted: the Emperor approves of clemency the crowd asks for, not of sparing a fighter the crowd, or he, wanted dead
// (the designer's note, 2026-11-01: "why does the Emperor approve when you spare when instructed to kill?").
export function spareFavor(run, mercy = run.mercy) {
  if (!mercy || mercy.crowd === 'kill' || run.demand?.id === 'kill') return 0;
  return mercy.top !== false || hasPolicy(run, 'edictOfMercy') ? MERCY.spareFavor : 0;
}
// Why a spare earns no Favour (for the verdict panels), or null when it does.
export function spareFavorWhy(run, mercy = run.mercy) {
  if (spareFavor(run, mercy)) return null;
  // Playtest #10: the lower arena first, and the crowd (not the Emperor) wanting blood; a spare still meets a spare demand.
  if (run.demand?.id === 'kill') return 'no Favour: the Emperor demanded a death this month';
  const why = mercy?.top === false && !hasPolicy(run, 'edictOfMercy') ? 'no Favour in a lower arena' : 'no Favour: the crowd wanted blood';
  return run.demand?.id === 'spare' ? `${why} (it still meets the Emperor's demand)` : why;
}

// Months a house that's being spared already owes you (a debt isn't renewed while it runs), or 0.
export const owedLeft = (run, mercy = run.mercy) => run.houses?.find((h) => h.id === mercy?.house)?.owed ?? 0;

export function mercyBlocker(run, choice) {
  if (!run.mercy) return 'There is no beaten opponent waiting on your verdict.';
  if (!['spare', 'kill'].includes(choice)) return 'Thumbs up (spare) or thumbs down (kill).';
  return null;
}

// Spare: +Favour (the Emperor likes clemency). Kill: Renown, a kill toward the marks, and their house's feud.
// Doing what the crowd wants adds Renown and Morale. Returns what changed.
// v6: you promised to spare a rebel fighting for another house. Spared, they join your contacts; killed, the rebels know.
function rebelBeaten(run, opp, verdict) {
  if (!verdict) { run.mercy.rebel = true; return; } // the thumbs decide
  if (verdict === 'spare') addContact(run, opp.name, pick(run.rng.plot, CELL_IDS), 'spared');
  else {
    run.plot.trust = Math.max(0, run.plot.trust - 3);
    log(run, `Overnight, every chalk mark on your doors is washed away.`, 'warn');
  }
}

export function resolveMercy(run, choice) {
  assertOk(mercyBlocker(run, choice));
  const { fighterId, opp, house: houseId, crowd, at, rebel = false, rivalChampion = false } = run.mercy;
  if (rivalChampion && choice === 'kill') rivalChampionKilled(run, opp); // 5.4.0
  const top = run.mercy.top ?? true;
  const favorFor = spareFavor(run);
  if (rebel && plotActive(run)) rebelBeaten(run, { name: opp }, choice);
  // v6: sparing against the crowd's call for blood in your top arena draws the palace's eye.
  if (choice === 'spare' && crowd === 'kill' && top && plotActive(run)) changeSuspicion(run, 5);
  run.mercy = null;
  const fighter = findFighter(run, fighterId);
  const house = run.houses?.find((h) => h.id === houseId) ?? null;
  const out = { verdict: choice, crowd, favor: 0, renown: 0, morale: 0, kill: false, mark: null, feud: null, owed: null };
  if (choice === 'spare') {
    if (favorFor) {
      const before = run.favor;
      changeFavor(run, favorFor, `spared ${opp}`);
      out.favor = run.favor - before;
    }
    log(run, `Thumbs up: ${fighter.name} spares ${opp}.${out.favor ? ' The Emperor approves of clemency.' : crowd === 'kill' && top ? ' In the imperial box, the Emperor\'s thumb stays down.' : ''}`, 'good');
    // Against a call for blood, mercy is remembered: their house owes you a life.
    if (crowd === 'kill' && house && !(house.owed > 0)) { // a life owed isn't renewed while it's still being paid (playtest #8)
      house.feud = 0;
      house.owed = HOUSES.feudMonths;
      house.since = run.week;
      out.owed = `${house.name} owes you a life: their fighters get −1 Power against you for ${HOUSES.feudMonths} months.`;
      log(run, out.owed, 'good');
    }
  } else {
    out.renown = MERCY.killRenown + (crowd === 'spare' ? MERCY.infamyRenown : 0); // killing against a mercy chant: infamy
    const marksBefore = killMarks(fighter).length;
    fighter.kills = (fighter.kills ?? 0) + 1;
    out.kill = true;
    log(run, `Thumbs down: ${fighter.name} finishes ${opp}.`, 'warn');
    if (fighter.kills === 1) chronicle(run, fighter, `First kill: ${opp}${house ? ` of ${house.name}` : ''}, ${crowd === 'kill' ? 'at the crowd\'s demand' : 'though the crowd begged mercy'}.`);
    const marks = killMarks(fighter);
    if (marks.length > marksBefore) {
      out.mark = marks.at(-1).name;
      chronicle(run, fighter, `Earned the mark ${out.mark}.`);
      log(run, `${fighter.name} has ${fighter.kills} kills and earns the mark ${out.mark}: ${marks.at(-1).desc}`, 'event');
    }
    run.graveyard = [...(run.graveyard ?? []), opp]; // the dead don't come back
    if (house && crowd !== 'kill') { // a kill the crowd demanded is the crowd's will: no feud
      house.feud = HOUSES.feudMonths;
      house.since = run.week;
      out.feud = `${house.name} swears revenge: their fighters get +1 Power against you for ${HOUSES.feudMonths} months.`;
      log(run, out.feud, 'warn');
    }
  }
  if (choice === crowd || (choice === 'spare' && fighter.perks.includes('merciful'))) {
    out.renown += MERCY.crowdRenown;
    out.morale = MERCY.crowdMorale;
    bumpMorale(fighter, MERCY.crowdMorale);
    log(run, `The crowd roars its approval for ${fighter.name}.`, 'good');
  }
  fighter.renown += out.renown;
  const summary = run.history[at];
  if (summary) {
    Object.assign(summary, {
      verdict: choice, owed: out.owed, kill: summary.kill || out.kill, mark: out.mark ?? summary.mark ?? null, feud: out.feud ?? summary.feud,
      renown: (summary.renown ?? 0) + out.renown, favor: (summary.favor ?? 0) + out.favor, morale: (summary.morale ?? 0) + out.morale,
    });
  }
  return out;
}

// Withdraw from a bracket between matches: it counts as capitulating (the fighter is safe, the tournament lost).
export function withdrawBlocker(run, tier) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const b = bracketOf(run, tier);
  if (!b?.fighterId || b.round === 0) return 'Nothing to withdraw from.';
  return null;
}

export function withdraw(run, tier) {
  assertOk(withdrawBlocker(run, tier));
  const b = bracketOf(run, tier);
  const f = structuredClone(findFighter(run, b.fighterId));
  run.inMatch = true;
  run.matchInfo = { fighterId: f.id, tier, buyIn: b.buyIn };
  return finishMatch(run, { over: true, round: 0, rounds: [], result: { winner: 'B', reason: 'towel' }, a: { f } });
}

function advanceArena(run, tier, won, opp, beatYou = true) {
  const arena = run.arenas[tier];
  if (tier === GRAND_TIER) {
    if (won) {
      run.status = 'won';
      run.endReason = 'You won the Grand Tournament. The Emperor names you Master of the Games.';
      return;
    }
    newOpponent(run, tier);
  } else if (arena.stage < 2) {
    arena.stage = isShort(run) ? 2 : arena.stage + 1; // a short career goes straight from the tournament to the Boss
    newOpponent(run, tier);
  } else if (won) {
    arena.rival = null;
    if (!arena.conquered) {
      arena.conquered = true;
      log(run, `${arenaName(tier)} conquered!`, 'event');
      const nextTier = tier + 1;
      run.topTier = nextTier;
      for (const f of run.roster) f.topStreak = 0; // a new arena hasn't scouted anyone yet
      openArena(run, nextTier);
      log(run, nextTier === GRAND_TIER ? 'The Grand Tournament awaits.' : `${arenaName(nextTier)} opens its gates to you. Your old arenas still hold bouts every month.`, 'event');
    }
    restartCircuit(run, tier);
  } else {
    if (tier === run.topTier) {
      // The rival returns at the arena's Boss Power +1, however often they beat you: no compounding death spiral.
      const basePower = arenaPower(run, tier);
      arena.rival = { ...structuredClone(opp), power: basePower + 1, renown: opp.renown + 2, rival: true, injuries: [], alive: true };
      log(run, beatYou ? `${opp.name} will remember this, and will be waiting for you.` : `${opp.name} never had to fight you. They will be waiting next time, stronger.`, 'warn');
    }
    // Version 6 (phase 5): in a season with SHORT.rematch, the lost Boss comes back next month (no new circuit).
    if (isShort(run) && SHORT.rematch && tier === run.topTier) {
      arena.debuff = pick(run.rng.opponents, DEBUFF_IDS);
      newOpponent(run, tier);
    } else restartCircuit(run, tier);
  }
  checkLoss(run);
}

// An unvisited lower arena's tournament goes ahead without you: the next stage, with a new opponent (after its Boss, a new circuit).
function arenaMovesOn(run, tier) {
  const arena = run.arenas[tier];
  const held = STAGES[arena.stage];
  if (arena.stage < 2) {
    arena.stage = isShort(run) ? 2 : arena.stage + 1;
    newOpponent(run, tier);
  } else restartCircuit(run, tier);
  log(run, `${arenaName(tier)} held its ${held} without your house. Next month: ${STAGES[arena.stage]}, against ${arena.opponent.name}.`); // playtest #9: it moved on silently
}

function checkLoss(run) {
  if (run.status !== 'active') return;
  if (run.favor <= 0) {
    run.status = 'lost';
    run.endReason = `The Emperor's Favour is gone. You are executed in ${formatDate(run.week)}.`;
    return;
  }
  if (run.revoltWeeks >= REVOLT.weeks) {
    run.status = 'lost';
    run.endReason = 'Your gladiators revolt and burn the Ludus.';
    return;
  }
  const cheapest = Math.min(marketPrice(run), ...(run.liaisonOffers ?? []).map((f) => f.price));
  if (!run.roster.length && run.gold < cheapest) {
    run.status = 'lost';
    run.endReason = 'No fighters left and not enough Gold to buy one. Your house falls.';
  }
}

// ---------- Save / load ----------

export const serialize = (run) => JSON.stringify(run);

// v2 careers (save version 2) upgrade in place: Strikes become Favour, the single circuit becomes arenas.
function migrateV2(run) {
  const fighters = [...run.roster, ...run.market, ...run.fallen, ...(run.liaisonOffer ? [run.liaisonOffer] : []), ...(run.opponent ? [run.opponent] : [])];
  for (const f of fighters) {
    Object.assign(f, { xp: 0, level: 1, perks: [], pendingPerks: [], renown: 3 * (f.titles?.length ?? 0), morale: MORALE.start, gear: { weapon: null, armor: null } });
    f.decor = { ...emptyDecor(), ...f.decor };
  }
  const topTier = run.grand ? GRAND_TIER : run.tier;
  run.rng.growth = createRng(deriveSeed(run.seed, 4));
  run.favor = clamp(FAVOR.start - 15 * (run.strikes ?? 0), 1, FAVOR.max);
  run.topTier = topTier;
  run.arenas = {};
  run.inventory = { decor: emptyDecor(), gear: [] };
  run.armourerStock = [];
  run.revoltWeeks = 0;
  run.matchInfo = run.inMatch ? { fighterId: run.matchFighterId, tier: topTier } : null;
  run.arenas[topTier] = { tier: topTier, stage: run.grand ? 3 : run.stage, debuff: run.debuff, opponent: run.opponent, conquered: false, rival: null };
  for (let t = 1; t < topTier; t++) {
    openArena(run, t);
    run.arenas[t].conquered = true;
  }
  run.bouts = run.boutPending ? Object.fromEntries(unlockedTiers(run).map((t) => [t, 'open'])) : null;
  for (const h of run.history) h.tier ??= topTier;
  for (const key of ['tier', 'stage', 'grand', 'debuff', 'opponent', 'strikes', 'matchFighterId']) delete run[key];
  run.version = SAVE_VERSION;
  return run;
}

export function deserialize(text) {
  let run = JSON.parse(text);
  if (run?.version === 2) run = migrateV2(run);
  if (run?.version !== SAVE_VERSION) throw new Error('This save is from an older version of the game.');
  run.inventory.items = { ...emptyItems(), ...(run.inventory.items ?? {}) }; // saves from before consumables
  run.rng.events ??= createRng(deriveSeed(run.seed, 5)); // saves from before events
  run.rng.plot ??= createRng(deriveSeed(run.seed, 8)); // saves from before v6's hidden plot
  run.plot ??= null;
  run.event ??= null;
  run.relics ??= []; // saves from before version 6's relics
  run.fortune ??= null;
  run.setup ??= { patron: null, decrees: [], classes: [] };
  run.setup.heat ??= 0; // version 6: careers from before Heat and the Legacy's unlocks play as a first career
  run.setup.unlocks ??= [];
  run.setup.legends ??= [];
  run.setup.colour ??= null;
  if (!run.houses) { // saves from before rival houses
    run.rng.houses = createRng(deriveSeed(run.seed, 6));
    run.houses = makeHouses(run.rng.houses);
    run.glory = 0;
  }
  run.inventory.decor = { ...emptyDecor(), ...run.inventory.decor }; // saves from before new decor
  for (const b of run.buildings) if (b.type === 'stables') b.type = 'vulcan'; // 5.3.0: the Temple of Vulcan takes the Stables' place
  for (const f of run.roster) f.decor = { ...emptyDecor(), ...f.decor };
  // 5.4.2: the Liaison offers several prisoners (an older save's one offer becomes a list of one).
  if (!Array.isArray(run.liaisonOffers)) run.liaisonOffers = run.liaisonOffer ? [run.liaisonOffer] : [];
  delete run.liaisonOffer;
  for (const f of [...run.roster, ...run.market, ...allOpponents(run), ...run.liaisonOffers]) f.humor ??= humorFor(f);
  // Careers from before action recording: start recording now, from a snapshot of this point.
  if (!Array.isArray(run.actions)) {
    run.actions = [];
    run.actionsBase = JSON.stringify(run);
  }
  // A match in progress isn't saved. Reloading mid-fight counts as capitulating,
  // so quitting can't be used to escape a losing fight for free.
  if (run.inMatch) {
    run.actions.push(['reload']);
    const f = structuredClone(findFighter(run, run.matchInfo.fighterId));
    const progress = run.matchInfo.progress;
    if (progress) Object.assign(f, { injuries: progress.injuries, alive: progress.alive });
    finishMatch(run, { over: true, round: 0, result: { winner: 'B', reason: progress?.alive === false ? 'death' : 'towel' }, a: { f } });
  }
  return run;
}
