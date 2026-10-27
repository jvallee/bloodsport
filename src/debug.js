// Bug reports: everything needed to reproduce a problem, and the replayer that re-runs one. Pure: no DOM.
// The web UI builds reports (Copy / Download); scripts/replay.js replays them.

import { createRun, serialize, deserialize } from './run.js';
import { applyGameAction } from './game.js';

export const REPORT_KIND = 'bloodsport-bug-report';
export const REPORT_FORMAT = 1;

// A match is plain data apart from its shared RNG; keep what explains the fight.
function matchDigest(match) {
  if (!match) return null;
  const side = (c) => ({ f: c.f, disabled: c.disabled, roundsWon: c.roundsWon, boost: c.boost ?? null });
  return {
    round: match.round, over: match.over, result: match.result, debuff: match.debuff, itemUsed: match.itemUsed ?? null,
    a: side(match.a), b: side(match.b), preMatch: match.preMatch, rounds: match.rounds,
  };
}

const errorInfo = (error) => (error ? { message: String(error.message ?? error), stack: String(error.stack ?? '') } : null);

// `context`: { version, time, url, userAgent, notes, lastAction, where }.
export function buildReport(run, match, error = null, context = {}) {
  return {
    kind: REPORT_KIND,
    format: REPORT_FORMAT,
    version: context.version ?? null,
    time: context.time ?? null,
    url: context.url ?? null,
    userAgent: context.userAgent ?? null,
    notes: context.notes ?? '',
    error: errorInfo(error),
    where: context.where ?? null, // 'action' | 'render' | 'auto-play' | 'boot' | 'window' | null (a manual report)
    lastAction: context.lastAction ?? null,
    seed: run?.seed ?? null,
    week: run?.week ?? null,
    fromSnapshot: Boolean(run?.actionsBase), // older careers record actions from a mid-career snapshot
    actions: run?.actions ?? [],
    match: matchDigest(match),
    save: run ? JSON.parse(serialize(run)) : null,
  };
}

export function parseReport(text) {
  const report = JSON.parse(text);
  if (report?.kind !== REPORT_KIND) throw new Error('This is not a Bloodsport bug report.');
  if (report.format > REPORT_FORMAT) throw new Error(`Report format ${report.format} is newer than this replayer (${REPORT_FORMAT}).`);
  return report;
}

// Re-run a report's career action by action. Errors are caught per action, as the web UI does
// (a refused action shows a message and the game carries on). Stops after `stopAt` actions if given.
export function replay(report, { stopAt = Infinity, onStep = null } = {}) {
  const base = report.save?.actionsBase;
  const state = { run: base ? deserialize(base) : createRun(report.seed, report.save?.setup ?? {}), match: null };
  const errors = [];
  const actions = report.actions.slice(0, stopAt);
  actions.forEach(([name, data], index) => {
    try {
      if (name === 'reload') {
        // The player reloaded mid-fight: the match counts as capitulated (deserialize records the reload again).
        state.run = deserialize(serialize(state.run));
        state.match = null;
      } else {
        applyGameAction(state, name, data ?? {}); // re-recorded, so the replay's actions match the report's
      }
    } catch (err) {
      errors.push({ index, action: name, data: data ?? {}, week: state.run.week, refused: err.name === 'Refused', message: err.message, stack: err.stack });
    }
    onStep?.(state, index);
  });
  return { state, errors };
}

// The fields worth comparing between a replay and the report's save (a mismatch means the replay drifted).
export function stateDigest(run) {
  if (!run) return null;
  return {
    week: run.week, gold: run.gold, prestige: run.prestige, favor: run.favor, status: run.status, topTier: run.topTier,
    roster: run.roster.map((f) => `${f.name} P${f.power} S${f.speed} inj:${f.injuries.map((i) => i.tag).join('+') || '-'}`),
    fallen: run.fallen.map((f) => f.name),
  };
}
