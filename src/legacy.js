// Legacy (roadmap v3, phase D): what carries over between careers. Achievements unlock patrons (starting options),
// legacy classes in the market, and the Emperor's Decrees (harder rules). Stored apart from the career save, like the Codex. Pure.

import { standings, effectivePower, winsOf } from './run.js';
import { PATRONS, DECREES, HEAT, LEGACY, LEGACY_LEVELS, HOUSE_COLOURS } from './data.js';

export { PATRONS, DECREES, HEAT, LEGACY_LEVELS, HOUSE_COLOURS };

const allFighters = (run) => [...run.roster, ...run.fallen];

export const ACHIEVEMENTS = [
  { id: 'firstBoss', name: 'First Blood', desc: 'Beat a Boss.', check: (run) => run.history.some((h) => h.boss && h.won), unlock: { patron: 'veteran' } },
  { id: 'bronze', name: 'Into the Bronze', desc: 'Reach the Bronze Arena.', check: (run) => run.topTier >= 2, unlock: { cls: 'thornBlade' } },
  { id: 'bloodied', name: 'Blood and Sand', desc: 'Win a Bloodied Victory (with 2+ injuries).', check: (run) => run.history.some((h) => h.bloodied), unlock: { patron: 'friend' } },
  { id: 'silver', name: 'A Rising House', desc: 'Reach the Silver Coliseum.', check: (run) => run.topTier >= 3, unlock: { patron: 'purse' } },
  { id: 'dreaded', name: 'Dreaded', desc: 'Have a fighter earn a kill mark (3 kills).', check: (run) => allFighters(run).some((f) => (f.kills ?? 0) >= 3), unlock: { patron: 'warChest' } },
  { id: 'festival', name: "The Gods' Favourite", desc: "Win a match on a Gods' Day.", check: (run) => run.history.some((h) => h.festival && h.won), unlock: null },
  { id: 'topHouse', name: 'First Among Houses', desc: 'Top the house standings.', check: (run) => run.glory > 0 && standings(run)[0].you, unlock: { patron: 'defector' } },
  { id: 'imperial', name: 'Imperial Ambitions', desc: 'Reach the Imperial Coliseum.', check: (run) => run.topTier >= 4, unlock: { cls: 'samnite' } },
  { id: 'champion', name: 'Master of the Games', desc: 'Win a career.', check: (run) => run.status === 'won', unlock: { decrees: true } },
  // v6, the hidden plot: secret until earned (the Legacy panel shows them as ???).
  { id: 'chalk', secret: true, name: 'Chalk on the Door', desc: 'Answer the sign.', check: (run) => Boolean(run.plot) && (run.plot.trust > 0 || run.plot.stage !== 'mark'), unlock: null },
  { id: 'coup', secret: true, name: 'Sic Semper Tyrannis', desc: 'Bring down the Emperor.', check: (run) => run.ending === 'coup', unlock: { patron: 'liberator' } },
  { id: 'martyr', secret: true, name: 'Remembered', desc: 'Rise, and fall.', check: (run) => run.ending === 'martyr', unlock: { patron: 'liberator' } },
  { id: 'loyalist', secret: true, name: 'Thirty Pieces', desc: 'Give the Emperor the names he wanted.', check: (run) => run.plot?.ended === 'loyalist', unlock: null },
];
export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

// Version 6: `xp` (Legacy XP, which sets the level and its unlocks), `maxHeat` (the highest Heat you may choose) and
// `returned` (Hall legends who already came back once, by legendKey).
export const createLegacy = () => ({ achievements: [], careers: 0, best: 0, past: [], hall: [], xp: 0, maxHeat: 0, returned: [] });

export function loadLegacy(text) {
  try {
    const data = JSON.parse(text ?? 'null');
    if (!data || !Array.isArray(data.achievements)) return createLegacy();
    const legacy = { ...createLegacy(), ...data };
    if (data.xp === undefined) migrateLegacy(legacy);
    return legacy;
  } catch {
    return createLegacy();
  }
}

// A Legacy from before version 6's XP: past careers are worth XP once (what their records still say), and a career
// win already unlocked the decrees, so it unlocks Heat 1.
export function migrateLegacy(legacy) {
  const x = LEGACY.xp;
  const past = legacy.past ?? [];
  legacy.xp = past.reduce((s, p) => s + x.career + x.arena * Math.max(0, (p.topTier ?? 1) - 1) + (p.won ? x.won : 0), 0)
    + x.career * Math.max(0, (legacy.careers ?? 0) - past.length);
  if (legacy.achievements.includes('champion')) legacy.maxHeat = Math.max(legacy.maxHeat ?? 0, 1);
  return legacy;
}

// ---------- Version 6: Legacy XP, levels and unlocks (docs/plan-v6-phase3.md) ----------

const others = (run) => [...run.roster, ...run.fallen, ...(run.retired ?? [])];
// What a career earned, win or lose: { total, lines: [{ label, xp }] }. Pure, so the end screen can show it again.
export function careerXp(run) {
  const x = LEGACY.xp;
  const lines = [];
  const add = (label, xp) => { if (xp > 0) lines.push({ label, xp }); };
  add('A career', x.career);
  if (run.topTier > 1) add(`${run.topTier - 1} arena${run.topTier > 2 ? 's' : ''} climbed`, x.arena * (run.topTier - 1));
  const bosses = new Set(run.history.filter((h) => h.boss && h.won).map((h) => h.tier)).size; // each arena's Boss once
  if (bosses) add(`${bosses} Boss${bosses > 1 ? 'es' : ''} beaten`, x.boss * bosses);
  // A legend who returned brings their old kills and Titles; only new ones count.
  const kills = others(run).reduce((n, f) => n + Math.max(0, (f.kills ?? 0) - (f.carried?.kills ?? 0)), 0);
  if (kills) add(`${kills} kill${kills > 1 ? 's' : ''}`, x.kill * Math.min(kills, x.maxKills));
  // Each Title once, whoever holds it (a Boss can be beaten again by another fighter for the same Title).
  const titles = new Set(others(run).flatMap((f) => (f.titles ?? []).slice(f.carried?.titles ?? 0))).size;
  if (titles) add(`${titles} Title${titles > 1 ? 's' : ''}`, x.title * Math.min(titles, x.maxTitles));
  if (run.status === 'won') add('Master of the Games', x.won);
  if (run.ending === 'coup') add('The tyrant fell', x.coup);
  if (run.ending === 'martyr') add('Remembered', x.martyr);
  if (run.plot?.ended === 'loyalist') add("The Emperor's friend", x.loyalist);
  const base = lines.reduce((s, l) => s + l.xp, 0);
  const heat = run.setup?.heat ?? 0;
  if (heat) add(`Heat ${heat}`, Math.round(base * HEAT.xpPerHeat * heat));
  return { total: lines.reduce((s, l) => s + l.xp, 0), lines };
}

// XP needed to go from `level` to the next one.
export const levelCost = (level) => LEGACY.first + LEGACY.step * (level - 1);
// { level, into, need }: the Legacy level for this much XP, the XP into it, and the XP the next level needs.
export function levelFor(xp) {
  let level = 1;
  let left = xp;
  while (left >= levelCost(level)) left -= levelCost(level++);
  return { level, into: left, need: levelCost(level) };
}
// The unlocks a level has (level 1 has none).
export const unlocksAt = (level) => LEGACY_LEVELS.slice(0, Math.max(0, level - 1));
export const legacyUnlocks = (legacy) => unlocksAt(levelFor(legacy.xp ?? 0).level).map((u) => u.id);
export const nextUnlock = (legacy) => { const { level } = levelFor(legacy.xp ?? 0); return LEGACY_LEVELS[level - 1] ? { level: level + 1, ...LEGACY_LEVELS[level - 1] } : null; };
export const houseColours = (legacy) => ['crimson', ...legacyUnlocks(legacy).filter((id) => id.startsWith('colour:')).map((id) => id.slice(7))];
// Every unlock, for a career that should play with a full Legacy (the bots' "full Legacy" group).
export const ALL_UNLOCKS = LEGACY_LEVELS.map((u) => u.id);

// Hall legends who may return in the next career (once each).
export const legendKeyOf = (l) => `legend:${l.seed}:${l.id}`;
export const returningFor = (legacy) => (legacy.hall ?? []).filter((l) => !(legacy.returned ?? []).includes(legendKeyOf(l))).slice(0, LEGACY.legendsKept);

// The setup for a new career from the Legacy and the New career dialog's choices.
export function careerSetup(legacy, { patron = null, heat = 0, short = true, colour = null } = {}) {
  return {
    patron, heat: Math.min(heat, legacy.maxHeat ?? 0), classes: unlockedClasses(legacy), short,
    unlocks: legacyUnlocks(legacy), legends: returningFor(legacy), colour: houseColours(legacy).includes(colour) ? colour : null,
  };
}

// The daily challenge's streak: days in a row with a daily career, up to `day` (or to yesterday, while today is unplayed).
export function dailyStreak(legacy, day) {
  const played = legacy.daily ?? {};
  const d = new Date(`${day}T12:00:00`);
  const key = () => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (played[key()] === undefined) d.setDate(d.getDate() - 1);
  let n = 0;
  while (played[key()] !== undefined) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

// Mark anything newly achieved in this career. Returns the new achievements.
export function checkAchievements(legacy, run) {
  const fresh = ACHIEVEMENTS.filter((a) => !legacy.achievements.includes(a.id) && a.check(run));
  legacy.achievements.push(...fresh.map((a) => a.id));
  return fresh;
}

const unlocked = (legacy, key) => [...new Set(ACHIEVEMENTS.filter((a) => legacy.achievements.includes(a.id) && a.unlock?.[key]).map((a) => a.unlock[key]))];
export const unlockedPatrons = (legacy) => [...unlocked(legacy, 'patron'), ...(legacyUnlocks(legacy).includes('patron:augur') ? ['augur'] : [])];
export const unlockedClasses = (legacy) => unlocked(legacy, 'cls');
export const decreesUnlocked = (legacy) => unlocked(legacy, 'decrees').length > 0;
export const heatUnlocked = (legacy) => legacy.maxHeat ?? 0;

// What an achievement unlocks, in words.
export function unlockText(a) {
  if (!a.unlock) return 'Bragging rights.';
  if (a.unlock.patron) return `Unlocks the patron ${PATRONS[a.unlock.patron].name}: ${PATRONS[a.unlock.patron].desc}`;
  if (a.unlock.cls) return `Unlocks a new class in the market: ${a.unlock.cls === 'thornBlade' ? 'Thorn-Blade' : 'Samnite'}.`;
  return 'Unlocks Heat 1: harder rules for a higher score and more Legacy XP.';
}

// One number for a career: how far you climbed, your house's Glory, and how it ended.
export function careerScore(run) {
  const decrees = (run.setup?.decrees ?? []).reduce((s, d) => s + (DECREES[d]?.score ?? 0), 0);
  const wins = run.history.filter((h) => h.won).length;
  return (run.glory ?? 0) + 25 * (run.topTier - 1) + 10 * (run.prestigeLevel - 1) + 2 * wins + (run.status === 'won' ? 200 + decrees : 0) + (run.ending === 'coup' ? 100 : 0);
}

// The career's best fighter: most wins, then Renown.
export function bestFighter(run) {
  const wins = (f) => winsOf(run, f);
  return [...allFighters(run)].sort((a, b) => wins(b) - wins(a) || b.renown - a.renown || effectivePower(b) - effectivePower(a))[0] ?? null;
}

// The daily Emperor's Challenge (fun idea #2): everyone gets the same short career on a given day. `day` is "YYYY-MM-DD".
export function dailySeed(day) {
  return [...`emperor:${day}`].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261) % 2147483647 || 1;
}
export const dailySetup = (day) => ({ patron: null, decrees: [], classes: [], short: true, daily: day }); // no unlocks, Heat or legends: the same for everyone

// Record a finished career (once).
export function recordCareer(legacy, run) {
  if (run.status === 'active' || legacy.past.some((p) => p.seed === run.seed && p.weeks === run.week)) return null;
  const entry = { seed: run.seed, weeks: run.week, won: run.status === 'won', score: careerScore(run), endReason: run.endReason, topTier: run.topTier, short: Boolean(run.setup?.short), daily: run.setup?.daily ?? null };
  // Version 6: Legacy XP, the levels it reaches, what they unlock, and the next Heat for a win.
  const gained = careerXp(run);
  const from = levelFor(legacy.xp ?? 0).level;
  legacy.xp = (legacy.xp ?? 0) + gained.total;
  const to = levelFor(legacy.xp).level;
  const heat = run.setup?.heat ?? 0;
  const heatBefore = legacy.maxHeat ?? 0;
  if (entry.won && !entry.daily) legacy.maxHeat = Math.min(HEAT.decrees.length, Math.max(heatBefore, heat + 1));
  Object.assign(entry, { heat, xp: gained.total, xpLines: gained.lines, xpBefore: legacy.xp - gained.total, from, to, unlocked: LEGACY_LEVELS.slice(from - 1, to - 1).map((u) => u.id), newHeat: legacy.maxHeat > heatBefore ? legacy.maxHeat : null });
  legacy.returned = [...new Set([...(legacy.returned ?? []), ...others(run).map((f) => f.returned).filter(Boolean)])];
  legacy.careers += 1;
  legacy.best = Math.max(legacy.best, entry.score);
  if (entry.daily) legacy.daily = { ...(legacy.daily ?? {}), [entry.daily]: Math.max(legacy.daily?.[entry.daily] ?? 0, entry.score) };
  legacy.past = [entry, ...legacy.past].slice(0, 10);
  return entry;
}

// Retired legends join the Hall of Champions, which outlives every career.
export function recordLegends(legacy, run) {
  const hall = legacy.hall ?? (legacy.hall = []);
  const fresh = (run.retired ?? []).filter((l) => !hall.some((h) => h.seed === l.seed && h.id === l.id));
  hall.unshift(...fresh);
  legacy.hall = hall.slice(0, 24);
  return fresh;
}
