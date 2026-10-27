// Run state: market, roster, Ludus actions and the Tournament 1 → 2 → Boss circuit.
// Pure: no DOM. Actions mutate the run and throw on invalid moves; *Blocker() returns why a move is invalid.

import { createRng, deriveSeed, int, pick, randomSeed } from './rng.js';
import { ECONOMY, KINDS, CLASSES, WEAPONS, TOURNAMENTS, NAMES } from './data.js';
import { createMatch, kindActive } from './fight.js';

const KIND_IDS = Object.keys(KINDS);
const CLASS_IDS = Object.keys(CLASSES);
const WEAPON_IDS = Object.keys(WEAPONS);

export function createFighter(rng, { id, kind, power, decorLevel = 0, takenNames = [] } = {}) {
  kind ??= pick(rng, KIND_IDS);
  const kindTrait = pick(rng, KINDS[kind].traits);
  const cls = pick(rng, CLASS_IDS);
  const weapon = cls === 'fighter' ? pick(rng, WEAPON_IDS) : null;
  const free = NAMES.filter((n) => !takenNames.includes(n));
  const name = pick(rng, free.length ? free : NAMES);
  const decor = { bird: 0, fireBrazier: 0 };
  if (cls === 'ornitharius') decor.bird = decorLevel;
  if (kindTrait === 'firebug') decor.fireBrazier = decorLevel;
  return {
    id, name, kind, kindTrait, cls, weapon,
    power: power ?? KINDS[kind].basePower,
    speed: ECONOMY.startSpeed,
    trained: 0, decor, injuries: [], alive: true,
  };
}

const newId = (run, prefix) => `${prefix}${run.nextId++}`;

// Names stay unique among everyone currently on screen.
const takenNames = (run, extra = []) => [...run.roster, ...run.market, ...(run.opponent ? [run.opponent] : []), ...extra].map((f) => f.name);

// Each market has 4 fighters including at least one Orc (Blood Faith comeback valve).
function refreshMarket(run) {
  const rng = run.rng.market;
  const market = [];
  const make = (kind) => createFighter(rng, { id: newId(run, 'f'), kind, takenNames: takenNames({ ...run, market: [] }, market) });
  for (let i = 0; i < ECONOMY.marketSize - 1; i++) market.push(make());
  market.splice(int(rng, 0, market.length), 0, make('orc'));
  run.market = market;
}

function makeOpponent(run) {
  const t = TOURNAMENTS[run.tournament];
  return createFighter(run.rng.opponents, { id: newId(run, 'o'), power: t.oppPower, decorLevel: t.oppDecor, takenNames: takenNames({ ...run, opponent: null }) });
}

export function createRun(seed = randomSeed()) {
  const run = {
    seed,
    gold: ECONOMY.startGold,
    prestige: ECONOMY.startPrestige,
    roster: [],
    fallen: [],
    market: [],
    tournament: 0,
    opponent: null,
    status: 'active', // 'active' | 'won' | 'lost'
    endReason: null,
    inMatch: false,
    history: [],
    nextId: 1,
    rng: {
      market: createRng(deriveSeed(seed, 1)),
      opponents: createRng(deriveSeed(seed, 2)),
      fight: createRng(deriveSeed(seed, 3)),
    },
  };
  refreshMarket(run);
  run.opponent = makeOpponent(run);
  return run;
}

export const currentTournament = (run) => TOURNAMENTS[run.tournament];
const findFighter = (run, id) => run.roster.find((f) => f.id === id);

function idleBlocker(run) {
  if (run.status !== 'active') return 'The run is over.';
  if (run.inMatch) return 'A match is in progress.';
  return null;
}

function assertOk(reason) {
  if (reason) throw new Error(reason);
}

export function recruitBlocker(run, id) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!run.market.some((f) => f.id === id)) return 'That fighter is not for sale.';
  if (run.roster.length >= ECONOMY.maxRoster) return `Your roster is full (${ECONOMY.maxRoster} fighters).`;
  if (run.gold < ECONOMY.fighterCost) return 'Not enough Gold.';
  return null;
}

export function recruit(run, id) {
  assertOk(recruitBlocker(run, id));
  const fighter = run.market.find((f) => f.id === id);
  run.market = run.market.filter((f) => f !== fighter);
  run.gold -= ECONOMY.fighterCost;
  run.roster.push(fighter);
  return fighter;
}

export function trainBlocker(run, id, stat) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (stat !== 'power' && stat !== 'speed') return 'You can only train Power or Speed.';
  if (f.trained >= ECONOMY.trainCap) return `Trainer cap reached (${ECONOMY.trainCap} points).`;
  if (run.gold < ECONOMY.trainCost) return 'Not enough Gold.';
  return null;
}

export function train(run, id, stat) {
  assertOk(trainBlocker(run, id, stat));
  const f = findFighter(run, id);
  f[stat] += 1;
  f.trained += 1;
  run.gold -= ECONOMY.trainCost;
}

export function decorBlocker(run, id, item) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!(item in f.decor)) return 'Unknown decor item.';
  if (f.decor[item] >= ECONOMY.decorCap) return `At most ${ECONOMY.decorCap} of each item.`;
  if (run.gold < ECONOMY.decorCost) return 'Not enough Gold.';
  return null;
}

export function buyDecor(run, id, item) {
  assertOk(decorBlocker(run, id, item));
  findFighter(run, id).decor[item] += 1;
  run.gold -= ECONOMY.decorCost;
}

export function healBlocker(run, id, index) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!f.injuries[index]) return 'No such injury.';
  if (run.gold < ECONOMY.healCost) return 'Not enough Gold.';
  return null;
}

export function heal(run, id, index) {
  assertOk(healBlocker(run, id, index));
  findFighter(run, id).injuries.splice(index, 1);
  run.gold -= ECONOMY.healCost;
}

export function fightBlocker(run, id) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!findFighter(run, id)) return 'Choose a fighter from your roster.';
  if (run.prestige < currentTournament(run).buyIn) return 'Not enough Prestige for the buy-in.';
  return null;
}

// Pays the buy-in and returns a match for the UI to play round by round.
export function startMatch(run, id) {
  assertOk(fightBlocker(run, id));
  const t = currentTournament(run);
  run.prestige -= t.buyIn;
  run.inMatch = true;
  return createMatch({ a: findFighter(run, id), b: run.opponent, rng: run.rng.fight, bossDebuff: t.bossDebuff });
}

export function finishMatch(run, match) {
  if (!run.inMatch) throw new Error('No match in progress.');
  if (!match.over) throw new Error('The match is not over.');
  const t = currentTournament(run);
  const fighter = findFighter(run, match.a.f.id);
  fighter.injuries = structuredClone(match.a.f.injuries);
  fighter.alive = match.a.f.alive;

  const won = match.result.winner === 'A';
  const summary = { tournament: run.tournament, name: t.name, won, reason: match.result.reason, fighter: fighter.name, died: !fighter.alive, gold: 0, prestige: -t.buyIn, bloodFaith: false };
  if (won) {
    summary.gold = t.winGold;
    summary.prestige += 2 * t.buyIn;
  } else {
    summary.gold = t.lossGold;
    if (!fighter.alive && kindActive(match.a, 'bloodFaith', match.round)) {
      summary.bloodFaith = true;
      summary.prestige += t.buyIn;
    }
  }
  run.gold += summary.gold;
  run.prestige += summary.prestige + t.buyIn; // buy-in was already paid in startMatch
  if (!fighter.alive) {
    run.roster = run.roster.filter((f) => f !== fighter);
    run.fallen.push(fighter);
  }
  run.inMatch = false;
  run.history.push(summary);

  if (run.tournament === TOURNAMENTS.length - 1) {
    run.status = won ? 'won' : 'lost';
    run.endReason = won ? 'You defeated the Boss Tournament. Your house rises.' : 'You fell at the Boss Tournament.';
  } else {
    run.tournament += 1;
    refreshMarket(run);
    run.opponent = makeOpponent(run);
    checkLoss(run);
  }
  return summary;
}

function checkLoss(run) {
  if (!run.roster.length && run.gold < ECONOMY.fighterCost) {
    run.status = 'lost';
    run.endReason = 'No fighters left and not enough Gold to buy one.';
  } else if (run.prestige < currentTournament(run).buyIn) {
    run.status = 'lost';
    run.endReason = `Not enough Prestige for the ${currentTournament(run).name} buy-in.`;
  }
}
