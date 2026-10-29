// Legacy (roadmap v3, phase D): what carries over between careers. Achievements unlock patrons (starting options),
// legacy classes in the market, and the Emperor's Decrees (harder rules). Stored apart from the career save, like the Codex. Pure.

import { standings, effectivePower } from './run.js';
import { PATRONS, DECREES } from './data.js';

export { PATRONS, DECREES };

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

export const createLegacy = () => ({ achievements: [], careers: 0, best: 0, past: [], hall: [] });

export function loadLegacy(text) {
  try {
    const data = JSON.parse(text ?? 'null');
    if (!data || !Array.isArray(data.achievements)) return createLegacy();
    return { ...createLegacy(), ...data };
  } catch {
    return createLegacy();
  }
}

// Mark anything newly achieved in this career. Returns the new achievements.
export function checkAchievements(legacy, run) {
  const fresh = ACHIEVEMENTS.filter((a) => !legacy.achievements.includes(a.id) && a.check(run));
  legacy.achievements.push(...fresh.map((a) => a.id));
  return fresh;
}

const unlocked = (legacy, key) => [...new Set(ACHIEVEMENTS.filter((a) => legacy.achievements.includes(a.id) && a.unlock?.[key]).map((a) => a.unlock[key]))];
export const unlockedPatrons = (legacy) => unlocked(legacy, 'patron');
export const unlockedClasses = (legacy) => unlocked(legacy, 'cls');
export const decreesUnlocked = (legacy) => unlocked(legacy, 'decrees').length > 0;

// What an achievement unlocks, in words.
export function unlockText(a) {
  if (!a.unlock) return 'Bragging rights.';
  if (a.unlock.patron) return `Unlocks the patron ${PATRONS[a.unlock.patron].name}: ${PATRONS[a.unlock.patron].desc}`;
  if (a.unlock.cls) return `Unlocks a new class in the market: ${a.unlock.cls === 'thornBlade' ? 'Thorn-Blade' : 'Samnite'}.`;
  return "Unlocks the Emperor's Decrees: harder rules for a higher score.";
}

// One number for a career: how far you climbed, your house's Glory, and how it ended.
export function careerScore(run) {
  const decrees = (run.setup?.decrees ?? []).reduce((s, d) => s + (DECREES[d]?.score ?? 0), 0);
  const wins = run.history.filter((h) => h.won).length;
  return (run.glory ?? 0) + 25 * (run.topTier - 1) + 10 * (run.prestigeLevel - 1) + 2 * wins + (run.status === 'won' ? 200 + decrees : 0) + (run.ending === 'coup' ? 100 : 0);
}

// The career's best fighter: most wins, then Renown.
export function bestFighter(run) {
  const wins = (f) => run.history.filter((h) => h.won && h.fighterId === f.id).length;
  return [...allFighters(run)].sort((a, b) => wins(b) - wins(a) || b.renown - a.renown || effectivePower(b) - effectivePower(a))[0] ?? null;
}

// Record a finished career (once).
export function recordCareer(legacy, run) {
  if (run.status === 'active' || legacy.past.some((p) => p.seed === run.seed && p.weeks === run.week)) return null;
  const entry = { seed: run.seed, weeks: run.week, won: run.status === 'won', score: careerScore(run), endReason: run.endReason, topTier: run.topTier };
  legacy.careers += 1;
  legacy.best = Math.max(legacy.best, entry.score);
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
