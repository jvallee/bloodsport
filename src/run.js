// Career state: weekly schedule, market, circuits (Tournament 1 → 2 → Boss per tier), Grand Tournament.
// Pure: no DOM. Actions mutate the run and throw on invalid moves; *Blocker() returns why a move is invalid.

import { createRng, deriveSeed, int, pick, randomSeed } from './rng.js';
import {
  ECONOMY, STRESS, HEAL_WEEKS, KINDS, CLASSES, WEAPONS, NAMES, CIRCUITS, GRAND, STAGES, BOSS_DEBUFFS, STARTING_BUILDINGS,
} from './data.js';
import { createMatch, kindActive } from './fight.js';
import { isTournamentWeek, isMonthStart, formatDate } from './calendar.js';
import {
  prestigeLevelFor, rosterCap, trainerRooms, trainCap, trainCost, medbaySlots, healRate, decorCap, liaisonLevel, stressRelief,
} from './ludus.js';

export const SAVE_VERSION = 2;
const KIND_IDS = Object.keys(KINDS);
const CLASS_IDS = Object.keys(CLASSES);
const WEAPON_IDS = Object.keys(WEAPONS);
const DEBUFF_IDS = Object.keys(BOSS_DEBUFFS);
export const JOBS = ['rest', 'trainPower', 'trainSpeed', 'medbay'];

export function createFighter(rng, { id, kind, power, bonusPower = 0, decorLevel = 0, takenNames = [] } = {}) {
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
    power: (power ?? KINDS[kind].basePower) + bonusPower,
    speed: ECONOMY.startSpeed,
    trained: 0, decor, injuries: [], alive: true,
    stress: 0, job: 'rest', titles: [],
  };
}

const newId = (run, prefix) => `${prefix}${run.nextId++}`;
const takenNames = (run, extra = []) =>
  [...run.roster, ...run.market, ...(run.opponent ? [run.opponent] : []), ...(run.liaisonOffer ? [run.liaisonOffer] : []), ...extra].map((f) => f.name);
const clampStress = (n) => Math.max(0, Math.min(STRESS.max, n));
const log = (run, text, tone = 'info') => run.log.push({ week: run.week, text, tone });

// ---------- Circuit info ----------

export const circuitInfo = (run) => CIRCUITS[run.tier - 1];

// The bout on the next tournament week: name, buy-in, rewards, opponent Power, debuff.
export function currentBout(run) {
  if (run.grand) return { name: GRAND.name, stage: 3, boss: true, buyIn: GRAND.buyIn, winGold: GRAND.winGold, winPrestige: GRAND.winPrestige, lossGold: GRAND.lossGold, oppPower: GRAND.oppPower, oppDecor: GRAND.oppDecor, debuff: run.debuff };
  const c = circuitInfo(run);
  const s = run.stage;
  return {
    name: `${c.name} · ${STAGES[s]}`, stage: s, boss: s === 2,
    buyIn: c.buyIn[s], winGold: c.winGold[s], winPrestige: c.winPrestige[s], lossGold: c.lossGold,
    oppPower: c.oppPower[s], oppDecor: c.oppDecor, debuff: s === 2 ? run.debuff : null,
  };
}

function refreshMarket(run) {
  const rng = run.rng.market;
  const bonus = run.grand ? CIRCUITS[3].marketPower : circuitInfo(run).marketPower;
  const market = [];
  const make = (kind) => createFighter(rng, { id: newId(run, 'f'), kind, bonusPower: bonus, takenNames: takenNames({ ...run, market: [] }, market) });
  for (let i = 0; i < ECONOMY.marketSize - 1; i++) market.push(make());
  market.splice(int(rng, 0, market.length), 0, make('orc'));
  run.market = market;
}

export const marketPrice = (run) => (run.grand ? CIRCUITS[3].price : circuitInfo(run).price);

// Liaison: Lv 1 offers a cheap weak convict with a Flesh Wound; Lv 2 a strong POW with a Concussion.
function refreshLiaison(run) {
  const lv = liaisonLevel(run);
  run.liaisonOffer = null;
  if (!lv) return;
  const bout = currentBout(run);
  const elite = lv >= 2;
  const f = createFighter(run.rng.market, {
    id: newId(run, 'f'),
    power: Math.max(3, bout.oppPower + (elite ? 1 : -2)),
    takenNames: takenNames(run),
  });
  f.injuries = [{ tag: elite ? 'concussed' : 'fleshWound', weight: 1, weeksLeft: HEAL_WEEKS[elite ? 'concussed' : 'fleshWound'] }];
  f.stress = elite ? 30 : 40;
  f.price = elite ? 4 : 1;
  f.origin = elite ? 'Prisoner of war' : 'Condemned convict';
  run.liaisonOffer = f;
}

function newOpponent(run) {
  const bout = currentBout(run);
  run.opponent = createFighter(run.rng.opponents, { id: newId(run, 'o'), power: bout.oppPower, decorLevel: bout.oppDecor, takenNames: takenNames({ ...run, opponent: null }) });
}

function newCircuit(run) {
  run.stage = 0;
  run.debuff = pick(run.rng.opponents, DEBUFF_IDS);
  newOpponent(run);
}

export function createRun(seed = randomSeed()) {
  const run = {
    version: SAVE_VERSION,
    seed,
    gold: ECONOMY.startGold,
    prestige: ECONOMY.startPrestige,
    prestigeLevel: 1,
    strikes: 0,
    week: 0,
    tier: 1,
    stage: 0,
    grand: false,
    debuff: null,
    roster: [],
    fallen: [],
    market: [],
    liaisonOffer: null,
    opponent: null,
    buildings: [],
    boutPending: false,
    status: 'active', // 'active' | 'won' | 'lost'
    endReason: null,
    inMatch: false,
    matchFighterId: null,
    history: [],
    log: [],
    nextId: 1,
    rng: {
      market: createRng(deriveSeed(seed, 1)),
      opponents: createRng(deriveSeed(seed, 2)),
      fight: createRng(deriveSeed(seed, 3)),
    },
  };
  for (const type of STARTING_BUILDINGS) run.buildings.push({ id: newId(run, 'b'), type, level: 1 });
  newCircuit(run);
  refreshMarket(run);
  log(run, `You take charge of a bottom-tier Ludus in ${circuitInfo(run).name}.`);
  return run;
}

// ---------- Shared checks ----------

const findFighter = (run, id) => run.roster.find((f) => f.id === id);

function idleBlocker(run) {
  if (run.status !== 'active') return 'The run is over.';
  if (run.inMatch) return 'A match is in progress.';
  return null;
}

function assertOk(reason) {
  if (reason) throw new Error(reason);
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
  run.roster = run.roster.filter((x) => x !== f);
  log(run, `${f.name} is released from the Ludus.`);
}

// ---------- Weekly jobs ----------

const jobCount = (run, job, exceptId) => run.roster.filter((f) => f.id !== exceptId && f.job === job).length;
const isTraining = (job) => job === 'trainPower' || job === 'trainSpeed';

export function jobBlocker(run, id, job) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!JOBS.includes(job)) return 'Unknown job.';
  if (isTraining(job)) {
    const busy = run.roster.filter((x) => x.id !== id && isTraining(x.job)).length;
    if (busy >= trainerRooms(run)) return `All ${trainerRooms(run)} Trainer Room${trainerRooms(run) > 1 ? 's are' : ' is'} busy.`;
    if (f.trained >= trainCap(run)) return `Trainer cap reached (${trainCap(run)} points). Upgrade a Trainer Room.`;
  }
  if (job === 'medbay') {
    if (jobCount(run, 'medbay', id) >= medbaySlots(run)) return 'The Medbay is full.';
    if (!f.injuries.length) return 'Not injured.';
  }
  return null;
}

export function setJob(run, id, job) {
  assertOk(jobBlocker(run, id, job));
  findFighter(run, id).job = job;
}

export function advanceBlocker(run) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (run.boutPending) return 'Tournament week: send a fighter or skip the bout first.';
  return null;
}

// Runs one week of jobs, then moves the calendar forward.
export function advanceWeek(run) {
  assertOk(advanceBlocker(run));
  const relief = stressRelief(run);
  for (const f of run.roster) {
    if (isTraining(f.job)) {
      const cost = trainCost(run);
      if (f.trained >= trainCap(run)) {
        f.job = 'rest';
        log(run, `${f.name} has learned all this trainer can teach.`);
      } else if (run.gold < cost) {
        f.job = 'rest';
        log(run, `Not enough Gold to pay the trainer; ${f.name} rests instead.`, 'warn');
      } else {
        const stat = f.job === 'trainPower' ? 'power' : 'speed';
        f[stat] += 1;
        f.trained += 1;
        run.gold -= cost;
        f.stress = clampStress(f.stress + STRESS.train);
        log(run, `${f.name} trains: +1 ${stat === 'power' ? 'Power' : 'Speed'}.`, 'good');
      }
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
    f.stress = clampStress(f.stress - relief);
    if (f.stress >= STRESS.overtrained) log(run, `${f.name} is overtrained (Stress ${f.stress}). Rest them before a fight.`, 'warn');
  }
  run.week += 1;
  if (isMonthStart(run.week)) {
    refreshMarket(run);
    refreshLiaison(run);
  }
  if (isTournamentWeek(run.week)) {
    run.boutPending = true;
    log(run, `Tournament week: ${currentBout(run).name}.`, 'event');
  }
  checkLoss(run);
}

// Advance until the next tournament week (stops early if the run ends).
export function advanceToTournament(run) {
  let weeks = 0;
  while (!run.boutPending && run.status === 'active') {
    advanceWeek(run);
    weeks++;
  }
  return weeks;
}

// ---------- Decor and surgeon ----------

export function decorBlocker(run, id, item) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!(item in f.decor)) return 'Unknown decor item.';
  if (f.decor[item] >= decorCap(run)) return `Quarters allow ${decorCap(run)} of each item. Upgrade Fighter Quarters for more.`;
  if (run.gold < ECONOMY.decorCost) return 'Not enough Gold.';
  return null;
}

export function buyDecor(run, id, item) {
  assertOk(decorBlocker(run, id, item));
  findFighter(run, id).decor[item] += 1;
  run.gold -= ECONOMY.decorCost;
}

export function surgeonBlocker(run, id, index) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  const f = findFighter(run, id);
  if (!f) return 'No such fighter.';
  if (!f.injuries[index]) return 'No such injury.';
  if (run.gold < ECONOMY.surgeonCost) return `The Emergency Surgeon needs ${ECONOMY.surgeonCost} Gold.`;
  return null;
}

export function surgeon(run, id, index) {
  assertOk(surgeonBlocker(run, id, index));
  const f = findFighter(run, id);
  f.injuries.splice(index, 1);
  run.gold -= ECONOMY.surgeonCost;
  if (f.job === 'medbay' && !f.injuries.length) f.job = 'rest';
}

// ---------- Tournaments ----------

export function fightBlocker(run, id) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!run.boutPending) return 'Fights happen on tournament weeks.';
  if (!findFighter(run, id)) return 'Choose a fighter from your roster.';
  if (run.prestige < currentBout(run).buyIn) return `Needs ${currentBout(run).buyIn} Prestige for the buy-in.`;
  return null;
}

// Pays the buy-in and returns a match for the UI to play round by round.
export function startMatch(run, id) {
  assertOk(fightBlocker(run, id));
  const bout = currentBout(run);
  const fighter = findFighter(run, id);
  run.prestige -= bout.buyIn;
  run.inMatch = true;
  run.matchFighterId = id;
  return createMatch({ a: fighter, b: run.opponent, rng: run.rng.fight, debuff: bout.debuff, overtrained: fighter.stress >= STRESS.overtrained });
}

export function skipBlocker(run) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!run.boutPending) return 'No bout this week.';
  if (currentBout(run).boss) return 'Bosses cannot be skipped. Fight or forfeit.';
  return null;
}

// Skip Tournament 1 or 2: no buy-in, small Gold reward, the roster recovers.
export function skipBout(run) {
  assertOk(skipBlocker(run));
  run.gold += ECONOMY.skipGold;
  for (const f of run.roster) f.stress = clampStress(f.stress - ECONOMY.skipStressRelief);
  const bout = currentBout(run);
  run.history.push({ week: run.week, name: bout.name, skipped: true });
  log(run, `You skip ${bout.name}: +${ECONOMY.skipGold} Gold, the roster recovers.`);
  run.boutPending = false;
  advanceCircuit(run, null);
}

export function forfeitBlocker(run) {
  const idle = idleBlocker(run);
  if (idle) return idle;
  if (!run.boutPending) return 'No bout this week.';
  if (!currentBout(run).boss) return 'Skip this tournament instead.';
  return null;
}

// Forfeiting a Boss (no fighter or no Prestige) counts as a Boss loss.
export function forfeitBout(run) {
  assertOk(forfeitBlocker(run));
  const bout = currentBout(run);
  run.history.push({ week: run.week, name: bout.name, won: false, forfeit: true });
  log(run, `You forfeit ${bout.name}.`, 'bad');
  run.boutPending = false;
  advanceCircuit(run, false);
}

export function finishMatch(run, match) {
  if (!run.inMatch) throw new Error('No match in progress.');
  if (!match.over) throw new Error('The match is not over.');
  const bout = currentBout(run);
  const fighter = findFighter(run, match.a.f.id);
  fighter.injuries = match.a.f.injuries.map((i) => ({ ...i, weeksLeft: i.weeksLeft ?? HEAL_WEEKS[i.tag] }));
  fighter.alive = match.a.f.alive;
  fighter.stress = clampStress(fighter.stress + STRESS.fight);

  const won = match.result.winner === 'A';
  const summary = {
    week: run.week, name: bout.name, boss: bout.boss, won, reason: match.result.reason, fighter: fighter.name,
    died: !fighter.alive, gold: 0, prestige: -bout.buyIn, bloodFaith: false, title: null, strike: false, levelUp: null,
  };
  if (won) {
    summary.gold = bout.winGold;
    summary.prestige += bout.buyIn + bout.winPrestige;
    if (bout.boss) {
      const title = run.grand ? 'Master of the Games' : `Champion of ${circuitInfo(run).name.replace(/^The /, 'the ')}`;
      fighter.titles.push(title);
      fighter.power += 1;
      summary.title = title;
    }
  } else {
    summary.gold = bout.lossGold;
    if (!fighter.alive && kindActive(match.a, 'bloodFaith', match.round)) {
      summary.bloodFaith = true;
      summary.prestige += bout.buyIn;
    }
  }
  run.gold += summary.gold;
  run.prestige += summary.prestige + bout.buyIn; // buy-in was already paid in startMatch
  if (!fighter.alive) {
    run.roster = run.roster.filter((f) => f !== fighter);
    run.fallen.push({ ...fighter, diedWeek: run.week });
    log(run, `${fighter.name} died in ${bout.name}.`, 'bad');
  }
  if (fighter.job === 'medbay' && !fighter.injuries.length) fighter.job = 'rest';
  run.inMatch = false;
  run.matchFighterId = null;
  run.boutPending = false;
  const before = run.prestigeLevel;
  run.prestigeLevel = prestigeLevelFor(run.prestige, run.prestigeLevel);
  if (run.prestigeLevel > before) {
    summary.levelUp = run.prestigeLevel;
    log(run, `House Prestige level ${run.prestigeLevel}! New buildings and room plots unlocked.`, 'event');
  }
  run.history.push(summary);
  log(run, `${fighter.name} ${won ? 'won' : 'lost'} ${bout.name}.`, won ? 'good' : 'bad');
  advanceCircuit(run, bout.boss ? won : null);
  summary.strike = bout.boss && !won;
  return summary;
}

// bossWon: null for Tournament 1/2, true/false for a Boss or the Grand Tournament.
function advanceCircuit(run, bossWon) {
  if (run.grand) {
    if (bossWon) {
      run.status = 'won';
      run.endReason = 'You won the Grand Tournament. The Emperor names you Master of the Games.';
      return;
    }
    strike(run);
    newOpponent(run);
  } else if (bossWon === null) {
    run.stage += 1;
    newOpponent(run);
  } else if (bossWon) {
    log(run, `${circuitInfo(run).name} conquered!`, 'event');
    if (run.tier === CIRCUITS.length) {
      run.grand = true;
      run.debuff = pick(run.rng.opponents, DEBUFF_IDS);
      newOpponent(run);
      log(run, 'The Grand Tournament awaits.', 'event');
    } else {
      run.tier += 1;
      newCircuit(run);
    }
  } else {
    strike(run);
    newCircuit(run);
  }
  checkLoss(run);
}

function strike(run) {
  run.strikes += 1;
  log(run, `The Emperor is displeased. Imperial Strike ${run.strikes}/${ECONOMY.maxStrikes}.`, 'bad');
}

function checkLoss(run) {
  if (run.status !== 'active') return;
  if (run.strikes >= ECONOMY.maxStrikes) {
    run.status = 'lost';
    run.endReason = `Three Imperial Strikes. The Emperor has you executed in ${formatDate(run.week)}.`;
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

export function deserialize(text) {
  const run = JSON.parse(text);
  if (run?.version !== SAVE_VERSION) throw new Error('This save is from an older version of the game.');
  // A match in progress isn't saved. Reloading mid-fight counts as throwing in the towel,
  // so quitting can't be used to escape a losing fight for free.
  if (run.inMatch) {
    const f = findFighter(run, run.matchFighterId);
    finishMatch(run, { over: true, round: 0, result: { winner: 'B', reason: 'towel' }, a: { f: structuredClone(f) } });
  }
  return run;
}
