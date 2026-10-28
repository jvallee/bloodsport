// Every player choice that changes the career, as one table shared by the web UI and scripts/replay.js.
// Each action is recorded in run.actions before it runs, so a career replays exactly from its seed. Pure: no DOM.

import { playRound, throwTowel, useSignature } from './fight.js';
import {
  boutFor, recruit, release, setJob, advanceWeek, advanceToTournament, buyDecor, surgeon, choosePerk, buildRoom,
  assignDecor, removeDecor, buyGear, equip, unequip, startMatch, finishMatch, skipBout, forfeitBout,
  recordMatchProgress, buyItem, useItem, payTribute, sellGear, chooseEvent, houseOf, augment, retire, treatFirst, withdraw, resolveMercy,
} from './run.js';
import { upgrade } from './ludus.js';

// A finished match is settled at once (the fight screen shows the full report). Returns the summary when it settles.
export function settleMatch(state) {
  const { run, match } = state;
  if (!match) return null;
  recordMatchProgress(run, match);
  if (match.over && !match.summary) {
    match.summary = finishMatch(run, match);
    return match.summary;
  }
  return null;
}

// state = { run, match }. Each returns a match summary when a match settles, otherwise nothing.
export const GAME_ACTIONS = {
  recruit: ({ run }, d) => { recruit(run, d.id); },
  release: ({ run }, d) => { release(run, d.id); },
  job: ({ run }, d) => { setJob(run, d.id, d.job); },
  'buy-decor': ({ run }, d) => { buyDecor(run, d.item); },
  'buy-item': ({ run }, d) => { buyItem(run, d.item); },
  'use-item': ({ run, match }, d) => { useItem(run, match, d.item); },
  signature: ({ match }) => { useSignature(match); },
  mercy: ({ run }, d) => { resolveMercy(run, d.choice); },
  'assign-decor': ({ run }, d) => { assignDecor(run, d.id, d.item); },
  'remove-decor': ({ run }, d) => { removeDecor(run, d.id, d.item); },
  'buy-gear': ({ run }, d) => { buyGear(run, Number(d.index)); },
  'sell-gear': ({ run }, d) => { sellGear(run, Number(d.index)); },
  equip: ({ run }, d) => { equip(run, d.id, Number(d.index)); },
  unequip: ({ run }, d) => { unequip(run, d.id, d.slot); },
  perk: ({ run }, d) => { choosePerk(run, d.id, d.perk); },
  surgeon: ({ run }, d) => { surgeon(run, d.id, Number(d.index)); },
  build: ({ run }, d) => { buildRoom(run, d.type); },
  upgrade: ({ run }, d) => { upgrade(run, d.id); },
  advance: ({ run }) => { advanceWeek(run); },
  'advance-tournament': ({ run }) => { advanceToTournament(run); },
  skip: ({ run }) => { skipBout(run); },
  forfeit: ({ run }) => { forfeitBout(run); },
  'pay-tribute': ({ run }) => { payTribute(run); },
  'event-choice': ({ run }, d) => { chooseEvent(run, Number(d.index)); },
  augment: ({ run }, d) => { augment(run, d.id, Number(d.index)); },
  retire: ({ run }, d) => { retire(run, d.id); },
  'treat-first': ({ run }, d) => { treatFirst(run, d.id, Number(d.index)); },
  withdraw: ({ run }, d) => withdraw(run, Number(d.tier)),
  fight: (state, d) => {
    const { run } = state;
    const tier = Number(d.tier) || run.topTier;
    const bout = boutFor(run, tier); // snapshot before the match changes the arena
    state.match = startMatch(run, d.id, tier);
    state.match.bout = bout;
    const house = houseOf(run, state.match.b.f);
    if (house) state.match.house = { name: house.name, color: house.color };
  },
  'next-round': (state, d) => {
    playRound(state.match, { stance: d.stance });
    return settleMatch(state);
  },
  towel: (state) => {
    throwTowel(state.match);
    return settleMatch(state);
  },
  'leave-fight': (state) => {
    const summary = settleMatch(state); // settles the match if it somehow isn't yet
    state.match = null;
    return summary;
  },
};

export const isGameAction = (name) => Object.hasOwn(GAME_ACTIONS, name);

// Record, then run. Data is copied down to plain strings (what a button's dataset holds).
export function applyGameAction(state, name, data = {}) {
  const d = Object.fromEntries(Object.entries(data).filter(([k, v]) => k !== 'action' && v !== undefined).map(([k, v]) => [k, String(v)]));
  state.run.actions?.push(Object.keys(d).length ? [name, d] : [name]);
  return GAME_ACTIONS[name](state, d);
}
