// Career state: weekly schedule, market, fighter growth, Morale, inventory, and the arenas.
// Every arena you've unlocked holds a bout on tournament week (Tournament 1 → 2 → Boss); the highest one is your
// "top" arena, where Bosses decide your standing with the Emperor. After Tier 4 comes the Grand Tournament (tier 5).
// Pure: no DOM. Actions mutate the run and throw on invalid moves; *Blocker() returns why a move is invalid.

import { createRng, deriveSeed, int, next, pick, randomSeed } from './rng.js';
import {
  ECONOMY, STRESS, TRAIN_GAIN, HEAL_WEEKS, KINDS, CLASSES, WEAPONS, NAMES, CIRCUITS, GRAND, STAGES, BOSS_DEBUFFS,
  STARTING_BUILDINGS, XP, PERKS, RENOWN, MORALE, GEAR, DECOR, FAVOR, TRIBUTE, REVOLT, INJURY_BY_TAG, CONSUMABLES, BLOODIED, HUMORS, FESTIVAL_BY_ID, HOUSES,
} from './data.js';
import { createMatch, kindActive, effectiveInjuries, killMarks } from './fight.js';
import { Refused } from './errors.js';
import { EVENTS, EVENT_BY_ID, EVENT_CHANCE, choiceLabel } from './events.js';
import { isTournamentWeek, isMonthStart, formatDate, dateOf, WEEKS_PER_YEAR, festivalOn, weeksUntilTournament } from './calendar.js';
import {
  prestigeLevelFor, rosterCap, trainerRooms, trainCap, trainCost, medbaySlots, healRate, decorCap, liaisonLevel, stressRelief,
  maxLevel, effectAt, build,
} from './ludus.js';

export const SAVE_VERSION = 3;
export const GRAND_TIER = CIRCUITS.length + 1;
const KIND_IDS = Object.keys(KINDS);
const CLASS_IDS = Object.keys(CLASSES);
const WEAPON_IDS = Object.keys(WEAPONS);
const DEBUFF_IDS = Object.keys(BOSS_DEBUFFS);
const HUMOR_IDS = Object.keys(HUMORS);
// Fighters from saves made before humors get one from their name, so it never changes between loads.
const humorFor = (f) => HUMOR_IDS[[...f.name].reduce((n, ch) => n + ch.charCodeAt(0), 0) % HUMOR_IDS.length];
const COMBAT_PERKS = ['thickSkin', 'killer', 'fastStart', 'closer', 'survivor', 'duelist'];
export const JOBS = ['rest', 'trainPower', 'trainSpeed', 'medbay'];

const emptyDecor = () => Object.fromEntries(Object.keys(DECOR).map((k) => [k, 0]));
const emptyItems = () => Object.fromEntries(Object.keys(CONSUMABLES).map((k) => [k, 0]));

export function createFighter(rng, { id, kind, power, bonusPower = 0, decorLevel = 0, takenNames = [] } = {}) {
  kind ??= pick(rng, KIND_IDS);
  const kindTrait = pick(rng, KINDS[kind].traits);
  const cls = pick(rng, CLASS_IDS);
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
    trained: 0, decor, injuries: [], alive: true,
    stress: 0, job: 'rest', titles: [],
    xp: 0, level: 1, perks: [], pendingPerks: [], renown: 0, morale: MORALE.start, gear: { weapon: null, armor: null }, topStreak: 0,
  };
}

const newId = (run, prefix) => `${prefix}${run.nextId++}`;
const allOpponents = (run) => Object.values(run.arenas).map((a) => a.opponent).filter(Boolean);
const takenNames = (run, extra = []) =>
  [...run.roster, ...run.market, ...run.fallen, ...allOpponents(run), ...(run.liaisonOffer ? [run.liaisonOffer] : []), ...extra].map((f) => f.name);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const clampStress = (n) => clamp(n, 0, STRESS.max);
const log = (run, text, tone = 'info') => run.log.push({ week: run.week, text, tone });
const findFighter = (run, id) => run.roster.find((f) => f.id === id);
// Power as the card shows it: trained Power plus gear.
export const effectiveSpeed = (f) => f.speed + [f.gear?.weapon, f.gear?.armor].filter(Boolean).reduce((s, k) => s + (GEAR[k].speed ?? 0), 0);
export const effectivePower = (f) => f.power + [f.gear?.weapon, f.gear?.armor].filter(Boolean).reduce((s, k) => s + (GEAR[k].power ?? 0), 0);
export const championTitle = (tier) => `Champion of ${arenaName(tier).replace(/^The /, 'the ')}`;
export const isChampionOf = (f, tier) => (f.titles ?? []).includes(championTitle(tier));
export const bossLossFavor = (tier) => FAVOR.bossLoss[Math.min(tier, FAVOR.bossLoss.length) - 1];

// ---------- Arenas and bouts ----------

export const unlockedTiers = (run) => Object.keys(run.arenas).map(Number).sort((a, b) => a - b);
export const isGrand = (run) => run.topTier === GRAND_TIER;
export const circuitInfo = (run) => CIRCUITS[Math.min(run.topTier, CIRCUITS.length) - 1];
export const arenaName = (tier) => (tier === GRAND_TIER ? GRAND.name : CIRCUITS[tier - 1].name);

// The bout an arena holds on tournament week: name, buy-in, rewards, opponent Power, debuff.
export function boutFor(run, tier = run.topTier) {
  const top = tier === run.topTier;
  const below = run.topTier - tier;
  const arena = run.arenas[tier];
  if (tier === GRAND_TIER) {
    return { tier, top, below: 0, name: GRAND.name, stage: 3, boss: true, buyIn: GRAND.buyIn, winGold: GRAND.winGold, winPrestige: GRAND.winPrestige, lossGold: GRAND.lossGold, oppPower: GRAND.oppPower, oppDecor: GRAND.oppDecor, debuff: arena.debuff, conquered: false };
  }
  const c = CIRCUITS[tier - 1];
  const s = arena.stage;
  // This tournament week's festival (or the coming one's, for previews).
  const fest = festivalOn(run.week + weeksUntilTournament(run.week));
  // The Dirt Pits never turn a house away: one that can't afford the buy-in pays what Prestige it has (even 0),
  // so a career can always win its way back.
  const pauper = tier === 1 && run.prestige < c.buyIn[s];
  return {
    tier, top, below,
    name: `${c.name} · ${STAGES[s]}`, stage: s, boss: s === 2,
    buyIn: fest?.freeEntry ? 0 : pauper ? Math.max(0, run.prestige) : c.buyIn[s], fullBuyIn: c.buyIn[s], pauper: pauper && !fest?.freeEntry,
    winGold: Math.round(c.winGold[s] * (fest?.gold ?? 1)),
    winPrestige: Math.round(Math.floor(c.winPrestige[s] * ECONOMY.lowerArenaPrestige ** below) * (fest?.prestige ?? 1)),
    festival: fest?.id ?? null,
    // The first Boss (the Dirt Pits) fights without an arena rule: a gentler first wall.
    lossGold: c.lossGold, oppPower: c.oppPower[s], oppDecor: c.oppDecor, debuff: s === 2 && tier > 1 ? arena.debuff : null,
    conquered: arena.conquered,
  };
}
export const currentBout = (run) => boutFor(run, run.topTier);
export const opponentFor = (run, tier = run.topTier) => run.arenas[tier].opponent;

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
  const f = createFighter(run.rng.opponents, { id: newId(run, 'o'), power: bout.oppPower, decorLevel: bout.oppDecor, takenNames: takenNames(run) });
  f.speed = opponentSpeed(run, bout);
  seasonOpponent(run, f, bout);
  // Every opponent fights for a rival house; the Grand Tournament's champion is the leading rival's.
  f.house = tier === GRAND_TIER ? [...run.houses].sort((a, b) => b.glory - a.glory)[0].id : pick(run.rng.houses, run.houses).id;
  arena.opponent = f;
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
export function matchOptions(run, f, tier = run.topTier) {
  return {
    debuff: boutFor(run, tier).debuff,
    festival: boutFor(run, tier).festival,
    overtrained: f.stress >= STRESS.overtrained,
    scouted: tier === run.topTier ? Math.min(ECONOMY.scoutedMax, f.topStreak ?? 0) : 0,
    challenger: tier === run.topTier && tier >= ECONOMY.challengerFromTier ? Math.min(ECONOMY.challengerMax, Math.floor((f.renown ?? 0) / ECONOMY.challengerRenown)) : 0,
    grudge: houseOf(run, run.arenas[tier]?.opponent)?.feud > 0 ? 1 : 0,
    vengeance: houseOf(run, run.arenas[tier]?.opponent)?.vengeance > 0,
  };
}

// ---------- Market, Liaison, Armourer ----------

export const marketPrice = (run) => circuitInfo(run).price;

function refreshMarket(run) {
  const rng = run.rng.market;
  const bonus = circuitInfo(run).marketPower;
  const market = [];
  const make = (kind) => createFighter(rng, { id: newId(run, 'f'), kind, bonusPower: bonus, takenNames: takenNames({ ...run, market: [] }, market) });
  for (let i = 0; i < ECONOMY.marketSize - 1; i++) market.push(make());
  market.splice(int(rng, 0, market.length), 0, make('orc'));
  run.market = market;
}

// Liaison: Lv 1 offers a cheap weak convict with a Flesh Wound; Lv 2 a strong POW with a Concussion.
function refreshLiaison(run) {
  const lv = liaisonLevel(run);
  run.liaisonOffer = null;
  if (!lv) return;
  const elite = lv >= 2;
  const f = createFighter(run.rng.market, { id: newId(run, 'f'), power: Math.max(3, currentBout(run).oppPower + (elite ? 1 : -2)), takenNames: takenNames(run) });
  f.injuries = [{ tag: elite ? 'concussed' : 'fleshWound', weight: 1, weeksLeft: HEAL_WEEKS[elite ? 'concussed' : 'fleshWound'] }];
  f.stress = elite ? 30 : 40;
  f.morale = elite ? 40 : 30;
  f.price = elite ? 4 : 1;
  f.origin = elite ? 'Prisoner of war' : 'Condemned convict';
  run.liaisonOffer = f;
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

// Every house by Glory, yours included.
export function standings(run) {
  const rows = [{ name: 'Your house', glory: run.glory ?? 0, tier: run.topTier, you: true, color: '#d9b45a' }, ...(run.houses ?? []).map((h) => ({ ...h, you: false }))];
  return rows.sort((a, b) => b.glory - a.glory || (a.you ? -1 : 1));
}

// After each tournament week the rivals fight their own bouts, climb, and their feuds cool.
function rivalsCompete(run) {
  const r = run.rng.houses;
  for (const h of run.houses) {
    if (next(r) < 0.5) h.glory += HOUSES.glory.win * h.tier;
    h.tier = 1 + HOUSES.climb.filter((g) => h.glory >= g).length;
    h.feud = Math.max(0, h.feud - 1);
    h.vengeance = Math.max(0, h.vengeance - 1);
  }
}

export function createRun(seed = randomSeed()) {
  const housesRng = createRng(deriveSeed(seed, 6));
  const run = {
    version: SAVE_VERSION,
    seed,
    gold: ECONOMY.startGold,
    prestige: ECONOMY.startPrestige,
    prestigeLevel: 1,
    favor: FAVOR.start,
    week: 0,
    topTier: 1,
    arenas: {},
    bouts: null, // on tournament week: { tier: 'open' | 'done' }
    boutPending: false, // the top arena's bout still needs a decision
    roster: [],
    fallen: [],
    market: [],
    liaisonOffer: null,
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
    },
    houses: makeHouses(housesRng),
    glory: 0,
    event: null, // this week's event card: { id, f, g } (fighter ids), decided before the week can end
  };
  for (const type of STARTING_BUILDINGS) run.buildings.push({ id: newId(run, 'b'), type, level: 1 });
  openArena(run, 1);
  refreshMarket(run);
  log(run, `You take charge of a bottom-tier Ludus in ${arenaName(1)}.`);
  return run;
}

// ---------- Shared checks ----------

function idleBlocker(run) {
  if (run.status !== 'active') return 'The run is over.';
  if (run.inMatch) return 'A match is in progress.';
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
  const fromLiaison = run.liaisonOffer?.id === id;
  if (!fromLiaison && !run.market.some((f) => f.id === id)) return 'That fighter is not for sale.';
  if (run.roster.length >= rosterCap(run)) return `Your quarters are full (${rosterCap(run)} fighters). Build or upgrade Fighter Quarters.`;
  const price = fromLiaison ? run.liaisonOffer.price : marketPrice(run);
  if (run.gold < price) return `Needs ${price} Gold.`;
  return null;
}

export function recruit(run, id) {
  assertOk(recruitBlocker(run, id));
  let fighter;
  if (run.liaisonOffer?.id === id) {
    fighter = run.liaisonOffer;
    run.gold -= fighter.price;
    run.liaisonOffer = null;
  } else {
    fighter = run.market.find((f) => f.id === id);
    run.market = run.market.filter((f) => f !== fighter);
    run.gold -= marketPrice(run);
  }
  delete fighter.price;
  run.roster.push(fighter);
  log(run, `${fighter.name} joins the Ludus.`);
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
  log(run, `${f.name} is released from the Ludus. Their gear and decor return to the storeroom.`);
}

// ---------- Weekly jobs ----------

const jobCount = (run, job, exceptId) => run.roster.filter((f) => f.id !== exceptId && f.job === job).length;
const isTraining = (job) => job === 'trainPower' || job === 'trainSpeed';

// Why a fighter can't train this week (or null). Gold covers every trainee's fee, this one included.
export function trainBlocker(run, f, { checkGold = true } = {}) {
  if (f.trained >= trainCap(run)) return `Trainer cap reached (${trainCap(run)} points). Upgrade a Trainer Room.`;
  if (f.morale < MORALE.restless) return `Restless (Morale ${f.morale}): won't train. Raise their comfort.`;
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

export function setJob(run, id, job) {
  assertOk(jobBlocker(run, id, job));
  const f = findFighter(run, id);
  f.job = job;
  f.notice = null;
}

// A fighter can't train after all: they rest this week, and the card says why.
function switchToRest(run, f, reason) {
  f.job = 'rest';
  f.notice = `Switched to Rest: ${reason}`;
  log(run, `${f.name} switched to Rest: ${reason}`, 'warn');
}

// ---------- Morale ----------

export const decorCount = (f) => Object.values(f.decor).reduce((s, n) => s + n, 0);

// Where a fighter's Morale is heading: comfort (rooms, decor, entertainment) minus what their fame makes them expect.
export function moraleTarget(run, f) {
  const comfort = MORALE.perQuartersLevel * maxLevel(run, 'quarters') + MORALE.perDecor * decorCount(f) + MORALE.perEntertainmentLevel * maxLevel(run, 'entertainment');
  const expects = Math.min(MORALE.maxExpectation, MORALE.expectationPerRenown * f.renown);
  return { target: clamp(MORALE.base + comfort - expects, 0, 100), comfort, expects };
}

export function moraleState(f) {
  if (f.morale >= MORALE.inspired) return { id: 'inspired', label: 'Inspired', desc: '+5% win chance in every round.' };
  if (f.morale < MORALE.mutinous) return { id: 'mutinous', label: 'Mutinous', desc: 'Refuses to fight. Give them decor, a better room, or wins.' };
  if (f.morale < MORALE.restless) return { id: 'restless', label: 'Restless', desc: "Won't train. Give them decor or a better room." };
  return { id: 'content', label: 'Content', desc: 'No effect.' };
}

const bumpMorale = (f, n) => { f.morale = clamp(f.morale + n, 0, 100); };

// ---------- The week ----------

export function advanceBlocker(run) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (run.event) return `Decide this week's event first: "${EVENT_BY_ID[run.event.id].title}".`;
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
      f[stat] += TRAIN_GAIN[stat];
      f.trained += 1;
      run.gold -= cost;
      f.stress = clampStress(f.stress + STRESS.train - (f.perks.includes('ironConstitution') ? 10 : 0));
      log(run, `${f.name} trains: +${TRAIN_GAIN[stat]} ${stat === 'power' ? 'Power' : 'Speed'}.`, 'good');
    }
    if (f.job === 'medbay') {
      let heal = healRate(run);
      while (heal > 0 && f.injuries.length) {
        const inj = f.injuries[0];
        const used = Math.min(heal, inj.weeksLeft);
        inj.weeksLeft -= used;
        heal -= used;
        if (inj.weeksLeft <= 0) {
          f.injuries.shift();
          log(run, `${f.name}'s ${inj.tag === 'fleshWound' ? 'Flesh Wound' : inj.tag} has healed.`, 'good');
        }
      }
      f.stress = clampStress(f.stress + STRESS.medbay);
      if (!f.injuries.length) {
        f.job = 'rest';
        log(run, `${f.name} leaves the Medbay fully healed.`, 'good');
      }
    } else if (f.job === 'rest') {
      f.stress = clampStress(f.stress + STRESS.rest);
    }
    // The Entertainment Room, plus calming decor (Birds, Fire Braziers) in their quarters.
    const calm = Object.entries(f.decor).reduce((n, [k, count]) => n + (DECOR[k].calm ?? 0) * count, 0);
    f.stress = clampStress(f.stress - relief - calm);
    // Morale drifts toward what their room and fame warrant.
    const { target } = moraleTarget(run, f);
    f.morale = f.morale < target ? Math.min(target, f.morale + MORALE.drift) : Math.max(target, f.morale - MORALE.drift);
    // Don't leave a job that will fail next week: switch now, visibly.
    if (isTraining(f.job)) {
      const next = trainBlocker(run, f, { checkGold: false });
      if (next) switchToRest(run, f, next);
    }
    if (f.stress >= STRESS.overtrained) log(run, `${f.name} is overtrained (Stress ${f.stress}). Rest them before a fight.`, 'warn');
    if (f.morale < MORALE.mutinous) log(run, `${f.name} is mutinous and refuses to fight.`, 'bad');
  }
  // A house in despair revolts.
  const avg = run.roster.length ? run.roster.reduce((s, f) => s + f.morale, 0) / run.roster.length : 100;
  run.revoltWeeks = avg < REVOLT.morale ? run.revoltWeeks + 1 : 0;
  if (run.revoltWeeks) log(run, `The gladiators are close to revolt (${run.revoltWeeks}/${REVOLT.weeks} weeks).`, 'bad');

  // Scouting fades for anyone who sat out the top arena this tournament week.
  if (run.bouts) for (const f of run.roster) if (f.foughtTopWeek !== run.week) f.topStreak = 0;
  run.bouts = null;
  run.week += 1;
  const d = dateOf(run.week);
  if (isMonthStart(run.week)) {
    refreshMarket(run);
    refreshLiaison(run);
    refreshArmourer(run);
  }
  if (!d.winter && d.month === 'December' && d.weekOfMonth === 1) if (!tributePaid(run)) log(run, `The Emperor's tribute of ${tributeDue(run)} Gold is due at the start of winter.`, 'warn');
  if (run.week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - 4) collectTribute(run);
  if (isTournamentWeek(run.week)) {
    run.bouts = Object.fromEntries(unlockedTiers(run).map((t) => [t, 'open']));
    run.boutPending = true;
    log(run, `Tournament week in ${unlockedTiers(run).length > 1 ? `${unlockedTiers(run).length} arenas` : arenaName(run.topTier)}.`, 'event');
  }
  if (tournamentEnds) rivalsCompete(run);
  checkLoss(run);
  if (run.status === 'active') rollEvent(run);
}

// Advance until the next tournament week (stops early if the run ends or a decision is needed).
export function advanceToTournament(run) {
  let weeks = 0;
  while (!run.boutPending && run.status === 'active' && !advanceBlocker(run)) {
    advanceWeek(run);
    weeks++;
  }
  return weeks;
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
  const options = EVENTS.filter((e) => e.id !== run.lastEvent && (!e.when || e.when(run)) && (e.who !== 'pair' || run.roster.length >= 2));
  if (!options.length) return;
  const e = pick(r, options);
  run.event = { id: e.id, ...eventTargets(run, e.who) };
  run.lastEvent = e.id;
}

// Names for an event's text: { f, g }.
export function eventNames(run, ev = run.event) {
  const name = (id) => findFighter(run, id)?.name;
  return { f: name(ev?.f), g: name(ev?.g) };
}

export function eventChoiceBlocker(run, index) {
  if (!run.event) return 'No event to decide.';
  const choice = EVENT_BY_ID[run.event.id].choices[index];
  if (!choice) return 'No such choice.';
  if (choice.cost && run.gold < choice.cost) return `Needs ${choice.cost} Gold.`;
  return null;
}

function applyEventEffects(run, eff, ev, out) {
  const targets = (to) => (to === 'all' ? run.roster : (to === 'both' ? [ev.f, ev.g] : [ev[to]]).map((id) => findFighter(run, id)).filter(Boolean));
  if (eff.gold) { run.gold = Math.max(0, run.gold + eff.gold); out.push(`${eff.gold > 0 ? '+' : ''}${eff.gold} Gold`); }
  if (eff.favor) { changeFavor(run, eff.favor, EVENT_BY_ID[ev.id].title.toLowerCase()); out.push(`${eff.favor > 0 ? '+' : ''}${eff.favor} Favor`); }
  if (eff.item) { run.inventory.items[eff.item] = (run.inventory.items[eff.item] ?? 0) + 1; out.push(`+1 ${CONSUMABLES[eff.item].name}`); }
  for (const [key, label] of [['morale', 'Morale'], ['stress', 'Stress'], ['renown', 'Renown']]) {
    if (!eff[key]) continue;
    const fs = targets(eff[key].to);
    for (const f of fs) {
      if (key === 'morale') bumpMorale(f, eff[key].n);
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
      out.push(`${f.name} is ${inj.name}`);
    }
  }
  if (eff.chance) {
    const won = next(run.rng.events) < eff.chance.p;
    out.push(won ? 'it went well' : 'it went badly');
    applyEventEffects(run, won ? eff.chance.win : eff.chance.lose, ev, out);
  }
}

// Decide this week's event. Returns what happened, as text.
export function chooseEvent(run, index) {
  assertOk(eventChoiceBlocker(run, index));
  const ev = run.event;
  const e = EVENT_BY_ID[ev.id];
  const choice = e.choices[index];
  const out = [];
  applyEventEffects(run, choice.effects, ev, out);
  const text = `${e.title}: ${choiceLabel(choice, eventNames(run, ev))}.${out.length ? ` ${out.join(', ')}.` : ''}`;
  log(run, text, 'event');
  run.event = null;
  checkLoss(run);
  return text;
}

// ---------- Tribute and Favor ----------

// The year whose tribute comes next: in winter this year's is already settled, so it's next year's.
const tributeYear = (run) => dateOf(run.week).year + (dateOf(run.week).winter ? 1 : 0);
export const tributeDue = (run) => TRIBUTE.perYear * tributeYear(run);
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

function collectTribute(run) {
  const year = dateOf(run.week).year;
  const due = TRIBUTE.perYear * year;
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
  log(run, `Imperial Favor ${delta > 0 ? '+' : ''}${delta} (${why}): now ${run.favor}.`, delta > 0 ? 'good' : 'bad');
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
  log(run, `${f.name} learns ${PERKS[perk].name}.`, 'good');
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

// ---------- Tournaments ----------

export const foughtThisWeek = (run) => run.history.filter((h) => h.week === run.week && h.fighterId).map((h) => h.fighterId);

export function fightBlocker(run, id, tier = run.topTier) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!run.bouts) return 'Fights happen on tournament weeks.';
  if (run.bouts[tier] !== 'open') return run.bouts[tier] ? 'This arena is settled for the week.' : 'That arena is not open to you.';
  const f = findFighter(run, id);
  if (!f) return 'Choose a fighter from your roster.';
  if (foughtThisWeek(run).includes(id)) return `${f.name} already fought this week.`;
  if (f.pendingPerks.length) return `${f.name} levelled up: choose a perk first.`;
  if (f.morale < MORALE.mutinous) return `${f.name} is mutinous and refuses to fight.`;
  if (run.prestige < boutFor(run, tier).buyIn) return `Needs ${boutFor(run, tier).buyIn} Prestige for the buy-in (you have ${run.prestige}).`;
  return null;
}

// Pays the buy-in and returns a match for the UI to play round by round.
export function startMatch(run, id, tier = run.topTier) {
  assertOk(fightBlocker(run, id, tier));
  const bout = boutFor(run, tier);
  const fighter = findFighter(run, id);
  run.prestige -= bout.buyIn;
  run.inMatch = true;
  run.matchInfo = { fighterId: id, tier, buyIn: bout.buyIn }; // what was paid (the Dirt Pits may take less)
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
  if (match.itemUsed) return 'Only one item per fight.';
  if (!CONSUMABLES[key]) return 'Unknown item.';
  if (!run.inventory.items[key]) return `No ${CONSUMABLES[key].name} in the storeroom.`;
  return null;
}

// Use an item on your fighter for the next round (or, for the Crowd Bribe, for this fight).
export function useItem(run, match, key) {
  assertOk(useItemBlocker(run, match, key));
  const item = CONSUMABLES[key];
  run.inventory.items[key] -= 1;
  match.itemUsed = key;
  if (item.boost) match.a.boost = { ...item.boost, name: item.name, round: match.round + 1 };
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
  log(run, `You skip ${bout.name}: +${ECONOMY.skipGold} Gold, the roster recovers.`);
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

// Forfeiting your top arena's Boss costs Imperial Favor.
export function forfeitBout(run) {
  assertOk(forfeitBlocker(run));
  const bout = currentBout(run);
  run.history.push({ week: run.week, tier: bout.tier, name: bout.name, won: false, forfeit: true });
  log(run, `You forfeit ${bout.name}.`, 'bad');
  settleBout(run, bout.tier);
  changeFavor(run, bossLossFavor(bout.tier) + FAVOR.forfeitExtra, 'forfeited a Boss');
  if (bout.tier === GRAND_TIER) newOpponent(run, bout.tier);
  else restartCircuit(run, bout.tier);
  checkLoss(run);
}

function settleBout(run, tier) {
  if (run.bouts) run.bouts[tier] = 'done';
  if (tier === run.topTier) run.boutPending = false;
}

export function finishMatch(run, match) {
  if (!run.inMatch) throw new Error('No match in progress.');
  if (!match.over) throw new Error('The match is not over.');
  const { tier } = run.matchInfo;
  const bout = { ...boutFor(run, tier), buyIn: run.matchInfo.buyIn ?? boutFor(run, tier).buyIn };
  const arena = run.arenas[tier];
  const fighter = findFighter(run, match.a.f.id);
  const opp = arena.opponent;
  const newInjuries = match.a.f.injuries.filter((i) => i.weeksLeft === undefined).map((i) => INJURY_BY_TAG[i.tag].name);
  fighter.injuries = match.a.f.injuries.map((i) => ({ ...i, weeksLeft: i.weeksLeft ?? HEAL_WEEKS[i.tag] }));
  fighter.alive = match.a.f.alive;
  fighter.stress = clampStress(fighter.stress + STRESS.fight + (match.stressAfter ?? 0));

  const won = match.result.winner === 'A';
  const upset = effectivePower(opp) > effectivePower(fighter);
  const champion = tier !== GRAND_TIER && !bout.top && isChampionOf(fighter, tier);
  // Rookies are never jeered: only a known name (5+ Renown) crushing a weak opponent, or a returning champion.
  const crushing = won && !bout.top && !champion && fighter.renown >= ECONOMY.knownRenown && effectivePower(fighter) - effectivePower(opp) >= ECONOMY.crushingGap;
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
    injuries: fighter.alive ? newInjuries : [], morale: 0, levels: 0, bloodied, kill: false, mark: null,
  };
  const favorBefore = run.favor;

  if (won) {
    const fest = bout.festival ? FESTIVAL_BY_ID[bout.festival] : null;
    summary.gold = bout.winGold + Math.floor(fighter.renown / RENOWN.goldPer);
    if (upset && fest?.upset) summary.gold *= fest.upset;
    summary.prestige += bout.buyIn + (champion ? 0 : bout.winPrestige);
    if (!crushing && !champion) {
      summary.renown = RENOWN.win + (bout.boss ? RENOWN.bossWin : 0) + (upset ? RENOWN.upset : 0) + (fighter.perks.includes('crowdPleaser') ? 1 : 0)
        + (fighter.decor.warBanner ?? 0) * DECOR.warBanner.renown + (bloodied ? BLOODIED.renown : 0) + (fest?.renown ?? 0);
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
    // Loot: claim the loser's gear.
    const drops = [opp.gear.weapon, opp.gear.armor].filter(Boolean);
    // Only your top arena's Boss always drops gear; anything else is a chance (no farming conquered Bosses).
    if (drops.length && ((bout.boss && bout.top) || next(run.rng.growth) < ECONOMY.lootChance)) {
      summary.loot = pick(run.rng.growth, drops);
      run.inventory.gear.push(summary.loot);
      log(run, `${fighter.name} claims a ${GEAR[summary.loot].name} from the defeated ${opp.name}.`, 'good');
    }
    // Championships: beat an arena's Boss, or win there 3 times. One Title (+1 Power) per arena.
    if (tier !== GRAND_TIER) {
      fighter.arenaWins = { ...(fighter.arenaWins ?? {}), [tier]: (fighter.arenaWins?.[tier] ?? 0) + 1 };
      if (!isChampionOf(fighter, tier) && (bout.boss || fighter.arenaWins[tier] >= ECONOMY.titleWins)) {
        const title = championTitle(tier);
        fighter.titles.push(title);
        fighter.power += 1;
        summary.title = title;
      }
    }
    if (tier === GRAND_TIER) {
      fighter.titles.push('Master of the Games');
      summary.title = 'Master of the Games';
    }
  } else {
    summary.gold = bout.lossGold;
    bumpMorale(fighter, match.result.reason === 'towel' ? MORALE.towel : MORALE.loss);
    const bribed = match.bribe && match.result.reason === 'towel';
    summary.bribed = Boolean(bribed);
    if (match.result.reason === 'towel' && !bribed) summary.renown = RENOWN.towel;
    if (!fighter.alive && kindActive(match.a, 'bloodFaith', match.round)) {
      summary.bloodFaith = true;
      summary.prestige += bout.buyIn;
    }
    if (bout.top && bout.boss) changeFavor(run, bossLossFavor(tier), `lost ${bout.name}`);
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
        summary.feud = `${house.name} swears revenge: their fighters get +1 Power against you for ${HOUSES.feudMonths} months.`;
        log(run, summary.feud, 'warn');
      }
    } else {
      house.glory += (bout.boss ? HOUSES.glory.boss : HOUSES.glory.win) * Math.max(1, t);
      if (!fighter.alive) {
        house.vengeance = HOUSES.feudMonths;
        summary.feud = `Your house wants vengeance on ${house.name}: +5% win chance against their fighters for ${HOUSES.feudMonths} months.`;
        log(run, summary.feud, 'event');
      }
    }
  }
  summary.favor = run.favor - favorBefore;
  summary.morale = fighter.morale - moraleBefore;
  run.gold += summary.gold;
  run.prestige += summary.prestige + bout.buyIn; // buy-in was already paid in startMatch
  fighter.renown = Math.max(0, fighter.renown + summary.renown);
  summary.xp = xpFor(won, bout.boss, upset) + (bloodied ? BLOODIED.xp : 0);

  if (!fighter.alive) {
    stripFighter(run, fighter);
    run.roster = run.roster.filter((f) => f !== fighter);
    run.fallen.push({ ...fighter, diedWeek: run.week });
    for (const f of run.roster) bumpMorale(f, MORALE.allyDeath);
    log(run, `${fighter.name} died in ${bout.name}. The house mourns; their gear returns to the storeroom.`, 'bad');
  } else {
    gainXp(run, fighter, summary.xp);
    summary.levels = fighter.level - levelBefore;
  }
  if (fighter.job === 'medbay' && !fighter.injuries.length) fighter.job = 'rest';
  run.inMatch = false;
  run.matchInfo = null;
  settleBout(run, tier);
  const before = run.prestigeLevel;
  run.prestigeLevel = prestigeLevelFor(run.prestige, run.prestigeLevel);
  if (run.prestigeLevel > before) {
    summary.levelUp = run.prestigeLevel;
    log(run, `House Prestige level ${run.prestigeLevel}! New buildings and room plots unlocked.`, 'event');
  }
  run.history.push(summary);
  log(run, `${fighter.name} ${won ? 'won' : 'lost'} ${bout.name}.`, won ? 'good' : 'bad');
  advanceArena(run, tier, won, opp);
  return summary;
}

function advanceArena(run, tier, won, opp) {
  const arena = run.arenas[tier];
  if (tier === GRAND_TIER) {
    if (won) {
      run.status = 'won';
      run.endReason = 'You won the Grand Tournament. The Emperor names you Master of the Games.';
      return;
    }
    newOpponent(run, tier);
  } else if (arena.stage < 2) {
    arena.stage += 1;
    newOpponent(run, tier);
  } else if (won) {
    arena.rival = null;
    if (!arena.conquered) {
      arena.conquered = true;
      log(run, `${arenaName(tier)} conquered!`, 'event');
      const nextTier = tier + 1;
      run.topTier = nextTier;
      openArena(run, nextTier);
      log(run, nextTier === GRAND_TIER ? 'The Grand Tournament awaits.' : `${arenaName(nextTier)} opens its gates to you. Your old arenas still hold bouts every month.`, 'event');
    }
    restartCircuit(run, tier);
  } else {
    if (tier === run.topTier) {
      // The rival returns at the arena's Boss Power +1, however often they beat you: no compounding death spiral.
      const basePower = tier === GRAND_TIER ? GRAND.oppPower : CIRCUITS[tier - 1].oppPower[2];
      arena.rival = { ...structuredClone(opp), power: basePower + 1, renown: opp.renown + 2, rival: true, injuries: [], alive: true };
      log(run, `${opp.name} will remember this, and will be waiting for you.`, 'warn');
    }
    restartCircuit(run, tier);
  }
  checkLoss(run);
}

function checkLoss(run) {
  if (run.status !== 'active') return;
  if (run.favor <= 0) {
    run.status = 'lost';
    run.endReason = `The Emperor's Favor is gone. You are executed in ${formatDate(run.week)}.`;
    return;
  }
  if (run.revoltWeeks >= REVOLT.weeks) {
    run.status = 'lost';
    run.endReason = 'Your gladiators revolt and burn the Ludus.';
    return;
  }
  const cheapest = Math.min(marketPrice(run), run.liaisonOffer?.price ?? Infinity);
  if (!run.roster.length && run.gold < cheapest) {
    run.status = 'lost';
    run.endReason = 'No fighters left and not enough Gold to buy one. Your house falls.';
  }
}

// ---------- Save / load ----------

export const serialize = (run) => JSON.stringify(run);

// v2 careers (save version 2) upgrade in place: Strikes become Favor, the single circuit becomes arenas.
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
  run.event ??= null;
  if (!run.houses) { // saves from before rival houses
    run.rng.houses = createRng(deriveSeed(run.seed, 6));
    run.houses = makeHouses(run.rng.houses);
    run.glory = 0;
  }
  run.inventory.decor = { ...emptyDecor(), ...run.inventory.decor }; // saves from before new decor
  for (const f of run.roster) f.decor = { ...emptyDecor(), ...f.decor };
  for (const f of [...run.roster, ...run.market, ...allOpponents(run), ...(run.liaisonOffer ? [run.liaisonOffer] : [])]) f.humor ??= humorFor(f);
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
