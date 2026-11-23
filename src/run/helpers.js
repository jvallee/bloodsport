// L0 shared helpers, fighter factory, stat queries, and canonical invariant helpers. Pure: no DOM or storage.

import { createRng, int, pick } from '../rng.js';
import {
  decorComfort, ECONOMY, STRESS, TRAIN_GAIN, KINDS, CLASSES, WEAPONS, NAMES, CIRCUITS, GRAND, BOSS_DEBUFFS,
  XP, PERKS, MORALE, GEAR, DECOR, FAVOR, HUMORS, AUGMENTS, TITLES, RECRUIT, SHORT, QUESTS, HEAT, CONSUMABLES,
} from '../data.js';
import { relicSum } from '../fortune.js';
import { Refused } from '../errors.js';
import { formatDate, dateOf } from '../calendar.js';
import { prestigeLevelFor, stressRelief } from '../ludus.js';

export const SAVE_VERSION = 6; // 5 (7.1): Temperament decor, f.humourDrift; 6 (7.3): run.unrest (backfilled on load)
export const GRAND_TIER = CIRCUITS.length + 1;
export const JOBS = ['rest', 'trainPower', 'trainSpeed', 'medbay'];
export const NAME_MEMORY = 90;
export const LOG_CAP = 400;
const TALK_MEMORY = 30;

export const KIND_IDS = Object.keys(KINDS).filter((k) => !KINDS[k].exotic);
export const CLASS_IDS = Object.keys(CLASSES).filter((c) => !CLASSES[c].legacy);
export const WEAPON_IDS = Object.keys(WEAPONS);
export const DEBUFF_IDS = Object.keys(BOSS_DEBUFFS);
export const HUMOR_IDS = Object.keys(HUMORS);
export const COMBAT_PERKS = ['thickSkin', 'killer', 'fastStart', 'closer', 'survivor', 'duelist'];

// Fighters from saves made before humors get one from their name, so it never changes between loads.
export const humorFor = (f) => HUMOR_IDS[[...String(f?.name ?? '')].reduce((n, ch) => n + ch.charCodeAt(0), 0) % HUMOR_IDS.length];

export const emptyDecor = () => Object.fromEntries(Object.keys(DECOR).map((k) => [k, 0]));
export const emptyItems = () => Object.fromEntries(Object.keys(CONSUMABLES).map((k) => [k, 0]));

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

export const newId = (run, prefix) => `${prefix}${run.nextId++}`;

export const allOpponents = (run) => [
  ...Object.values(run.arenas ?? {}).flatMap((a) => [a.opponent, a.rival]),
  ...Object.values(run.brackets ?? {}).flatMap((b) => b.foes ?? []),
].filter(Boolean);

export function remember(run, ...fighters) {
  run.recentNames = [...(run.recentNames ?? []), ...fighters.map((f) => f.name)].slice(-NAME_MEMORY);
}

export const takenNames = (run, extra = []) => [
  ...run.roster, ...run.market, ...run.fallen, ...allOpponents(run),
  ...(run.liaisonOffers ?? []), ...(run.nemeses ?? []),
  ...(run.rivalChampion ? [run.rivalChampion.f] : []), ...extra,
].map((f) => f.name).concat(run.graveyard ?? [], run.recentNames ?? [], (run.retired ?? []).map((l) => l.name));

export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const clampStress = (n) => clamp(n, 0, STRESS.max);

export function log(run, text, tone = 'info') {
  run.log.push({ week: run.week, text, tone });
  if (run.log.length > LOG_CAP) run.log.splice(0, run.log.length - LOG_CAP);
}

export const findFighter = (run, id) => run.roster.find((f) => f.id === id);

export function chronicle(run, f, text) {
  f.story = [...(f.story ?? []), { week: run.week, text }].slice(-12);
}

export const bumpMorale = (f, n) => { f.morale = clamp(f.morale + n, 0, 100); };
export const isTraining = (job) => job === 'trainPower' || job === 'trainSpeed';
export const jobCount = (run, job, exceptId) => run.roster.filter((f) => f.id !== exceptId && f.job === job).length;
export const monthOf = (week) => `${dateOf(week).year}-${dateOf(week).month}`;

export function talk(run, key, beats, { now = false } = {}) {
  if ([...(run.talk ?? []), ...(run.talkLater ?? [])].some((t) => t.key === key)) return;
  if (!now && (run.talk ?? []).filter((t) => t.week === run.week).length >= QUESTS.talkPerWeek) {
    run.talkLater = [...(run.talkLater ?? []), { key, beats }];
    return;
  }
  run.talk = [...(run.talk ?? []), { key, week: run.week, beats }].slice(-TALK_MEMORY);
}

export function releaseTalk(run) {
  const later = run.talkLater ?? [];
  run.talkLater = [];
  for (const t of later) talk(run, t.key, t.beats);
}

export function assertOk(reason) {
  if (reason) throw new Refused(reason);
}

// ---------- Stat and economy queries ----------

export const decorComfortOf = (f) => Object.entries(f.decor ?? {}).reduce((n, [k, c]) => n + (DECOR[k] ? decorComfort(DECOR[k]) * c : 0), 0);
// `calmIf` (7.2): the piece only calms the fighters it names (the Viper Terrarium).
export const decorCalm = (f) => Math.min(STRESS.decorCalm, Object.entries(f.decor ?? {}).reduce((n, [k, count]) => n + (DECOR[k] && (!DECOR[k].calmIf || DECOR[k].calmIf(f)) ? DECOR[k].calm ?? 0 : 0) * count, 0));
export const decorCount = (f) => Object.values(f.decor ?? {}).reduce((s, n) => s + n, 0);

export const trainStress = (run, f) => Math.max(0, STRESS.train - (f.perks.includes('ironConstitution') ? 10 : 0) - relicSum(run, 'trainStress'));
export const netTrainStress = (run, f) => trainStress(run, f) - stressRelief(run) - decorCalm(f);

export const effectiveSpeed = (f) => f.speed + [f.gear?.weapon, f.gear?.armor].filter(Boolean).reduce((s, k) => s + (GEAR[k].speed ?? 0), 0);
export const effectivePower = (f) => powerParts(f).reduce((s, x) => s + x.value, 0);

// Where standing Power comes from. Returning Hall legends carry old Titles that were not added to their f.power.
export function powerParts(f) {
  const totalTitles = (f.titles ?? []).filter((t) => t !== 'Master of the Games').length;
  const carriedTitles = f.carried?.titles ?? 0;
  const titles = Math.max(0, totalTitles - carriedTitles);
  const trained = f.trainedPower ?? 0;
  const perks = f.perkPower ?? 0;
  const known = f.trainedPower !== undefined || !f.trained;
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

export const unlockedTiers = (run) => Object.keys(run.arenas).map(Number).sort((a, b) => a - b);
export const isGrand = (run) => run.topTier === GRAND_TIER;
export const circuitInfo = (run) => CIRCUITS[Math.min(run.topTier, CIRCUITS.length) - 1];
export const arenaName = (tier) => (tier === GRAND_TIER ? GRAND.name : CIRCUITS[tier - 1].name);

export const championTitle = (tier) => `Champion of ${arenaName(tier).replace(/^The /, 'the ')}`;
export const isChampionOf = (f, tier) => (f.titles ?? []).includes(championTitle(tier));

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

export const isShort = (run) => Boolean(run?.setup?.short);
export const trainGain = (run, stat) => Math.round(TRAIN_GAIN[stat] * (isShort(run) ? SHORT.train : 1));
export const hasDecree = (run, id) => Boolean(run?.setup?.decrees?.includes(id));
export const hasUnlock = (run, id) => Boolean(run?.setup?.unlocks?.includes(id));
export const heatDecrees = (heat) => HEAT.decrees.slice(0, Math.max(0, heat ?? 0));
export const lionsPower = (run) => (hasDecree(run, 'hungryLions') ? 1 : 0);
export const hasPolicy = (run, id) => Boolean(run?.policies?.some((p) => p.id === id && p.until > run.week));
export const bossLossFavor = (tier, run = null) => Math.round(FAVOR.bossLoss[Math.min(tier, FAVOR.bossLoss.length) - 1] * (isShort(run) ? SHORT.bossLoss : 1)) - (hasDecree(run, 'harshJudges') ? 5 : 0);

export const tierMarketPower = (run) => circuitInfo(run).marketPower + (isShort(run) ? (SHORT.marketPower?.[Math.min(run.topTier, CIRCUITS.length) - 1] ?? 0) : 0);
export const marketPrice = (run) => circuitInfo(run).price;
export const liaisonOffer = (run, id) => (run.liaisonOffers ?? []).find((f) => f.id === id) ?? null;
export const recruitPrice = (run, f) => Math.max(1, (liaisonOffer(run, f.id) ? f.price : marketPrice(run) + RECRUIT.perLevel * ((f.level ?? 1) - 1)) - relicSum(run, 'recruitDiscount'));

export function cheapestRecruitPrice(run) {
  const offers = [
    ...(run.market ?? []),
    ...(run.liaisonOffers ?? []),
  ].map((f) => recruitPrice(run, f));
  if (offers.length) return Math.min(...offers);
  return Math.max(1, marketPrice(run) - relicSum(run, 'recruitDiscount'));
}

export const cleanName = (name) => String(name ?? '').replace(/\s+/g, ' ').trim();
export const winsOf = (run, f) => run.history.filter((h) => h.won && h.fighterId && [f.id, f.revenantOf].includes(h.fighterId)).length;
export const foughtThisWeek = (run) => run.history.filter((h) => h.week === run.week && h.fighterId).map((h) => h.fighterId);

// ---------- XP and perks (shared across layers) ----------

export function xpFor(won, boss, upset) {
  const base = (won ? XP.win : XP.loss) * (boss ? XP.bossMultiplier : 1);
  return base + (won && upset ? XP.upsetBonus : 0);
}

export function perkOffer(run, f) {
  const pool = Object.keys(PERKS).filter((p) => (PERKS[p].repeatable || !f.perks.includes(p)) && (!PERKS[p].req || PERKS[p].req(f)));
  const offer = [];
  while (offer.length < 3 && pool.length) offer.push(pool.splice(int(run.rng.growth, 0, pool.length - 1), 1)[0]);
  return offer;
}

export function gainXp(run, f, amount) {
  f.xp += amount;
  while (f.level <= XP.levels.length && f.xp >= XP.levels[f.level - 1]) {
    f.level += 1;
    f.pendingPerks.push(perkOffer(run, f));
    log(run, `${f.name} reaches level ${f.level}! Choose a perk.`, 'event');
  }
}

// ---------- Canonical invariant helpers ----------

export function activeModalOrPendingBlocker(run, { allowEvent = false, allowMercy = false, allowFortune = true } = {}) {
  if (run.status !== 'active') return 'The run is over.';
  if (run.inMatch) return 'A match is in progress.';
  if (!allowMercy && run.mercy) return "First decide the beaten opponent's fate: thumbs up or down.";
  if (!allowEvent && run.event) return "Decide this week's event first.";
  if (!allowFortune && run.fortune) return "Choose this month's Fortune first.";
  return null;
}

export const idleBlocker = (run) => activeModalOrPendingBlocker(run, { allowEvent: true, allowFortune: true });

export function isInActiveBracket(run, fighterId) {
  if (!fighterId) return null;
  for (const [t, b] of Object.entries(run.brackets ?? {})) {
    const tier = Number(t);
    if (run.bouts?.[tier] === 'open' && b.round > 0 && b.fighterId === fighterId) return { tier, bracket: b };
  }
  return null;
}

export function nextStage(run, tier) {
  return isShort(run) ? 2 : run.arenas[tier].stage + 1;
}

export function addPrestige(run, delta) {
  if (!delta) return 0;
  const before = run.prestigeLevel;
  run.prestige += delta;
  if (delta > 0) run.prestigeLevel = prestigeLevelFor(run.prestige, run.prestigeLevel);
  if (run.prestigeLevel > before) {
    log(run, `House Prestige level ${run.prestigeLevel}! New buildings and room plots unlocked.`, 'event');
  }
  return run.prestigeLevel - before;
}

export function clearHealedMedbay(run, f, { logLeave = false } = {}) {
  if (f.job === 'medbay' && !f.injuries.length) {
    f.job = 'rest';
    if (logLeave) log(run, `${f.name} leaves the Medbay fully healed.`, 'good');
    return true;
  }
  return false;
}

export function removeFighter(run, fighterOrId, { returnDecor = true, returnGear = true, fallen = null, released = false } = {}) {
  const f = typeof fighterOrId === 'string' ? findFighter(run, fighterOrId) : fighterOrId;
  if (!f) return null;
  if (returnDecor) {
    for (const k of Object.keys(DECOR)) {
      run.inventory.decor[k] = (run.inventory.decor[k] ?? 0) + (f.decor?.[k] ?? 0);
      if (f.decor) f.decor[k] = 0;
    }
  }
  if (returnGear) {
    for (const slot of ['weapon', 'armor']) {
      if (f.gear?.[slot]) run.inventory.gear.push(f.gear[slot]);
      if (f.gear) f.gear[slot] = null;
    }
  }
  run.roster = run.roster.filter((x) => x !== f);
  if (run.plot?.champion === f.id) {
    run.plot.champion = null;
    if (run.plot.stage === 'ready') run.plot.stage = 'cause';
    if (run.plot.coup && !run.plot.ended) {
      run.plot.coup = false;
      if (run.arenas?.[GRAND_TIER] && run.plot.debuffBefore !== undefined) {
        run.arenas[GRAND_TIER].debuff = run.plot.debuffBefore;
        delete run.plot.debuffBefore;
      }
      run.plot.seen = (run.plot.seen ?? []).filter((id) => id !== 'coupEve');
    }
  }
  if (fallen) run.fallen.push({ ...f, alive: false, diedWeek: run.week, ...(typeof fallen === 'object' ? fallen : {}) });
  if (released) run.released = (run.released ?? 0) + 1;
  return f;
}

export function changeFavor(run, delta, why) {
  if (!delta) return;
  run.favor = clamp(run.favor + delta, 0, FAVOR.max);
  log(run, `Imperial Favour ${delta > 0 ? '+' : ''}${delta} (${why}): now ${run.favor}.`, delta > 0 ? 'good' : 'bad');
}

export function checkLoss(run) {
  if (run.status !== 'active') {
    run.fortune = null;
    return;
  }
  if (run.favor <= 0) {
    run.status = 'lost';
    run.endReason = `The Emperor's Favour is gone. You are executed in ${formatDate(run.week)}.`;
    run.fortune = null;
    return;
  }
  const cheapest = cheapestRecruitPrice(run);
  if (!run.roster.length && run.gold < cheapest) {
    run.status = 'lost';
    run.endReason = 'No fighters left and not enough Gold to buy one. Your house falls.';
    run.fortune = null;
  }
}
