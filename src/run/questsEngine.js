// L3a steward assignments, fighter wants, and resistance requests.

import { createRng, deriveSeed, next, pick } from '../rng.js';
import { CIRCUITS, DECOR, PLOT, LOUNGE, QUESTS, FIGHTER_WANTS, REBEL_QUEST } from '../data.js';
import { STEWARD_TASKS, STEWARD_INTRO, stewardDone, stewardGrandDone, stewardAlready, WANTS, REBEL_QUESTS } from '../quests.js';
import { CORE_WANTS, nextCoreWant, createDialogueState } from '../dialogueTrees.js';
import { MOOD_WEEKS } from '../events.js';
import { maxLevel } from '../ludus.js';
import {
  clamp, log, chronicle, talk, effectivePower, championTitle, isChampionOf, hasPolicy,
  gainXp, addPrestige, winsOf, queueMilestone,
} from './helpers.js';
import { backstoryScene } from '../voices.js';
import { plotActive, changeSuspicion, advancePlot } from './plotEngine.js';
import { arenaPower } from './houses.js';
import { retireBlocker } from './roster.js';

const moodShift = (f, n) => { f.mood = { n: (f.mood?.n ?? 0) + n, weeks: MOOD_WEEKS }; };
const questState = (run) => (run.quests ??= { steward: null, stewardIndex: 0, rebel: [] });
const MAX_BACKSTORIES = 2;

export const wantLabel = (w) => (typeof w?.label === 'string' ? w.label : WANTS[w?.id]?.label?.(w) ?? w?.id ?? '');
export const wantGoal = (w) => (typeof w?.goal === 'string' ? w.goal : WANTS[w?.id]?.goal?.(w) ?? wantLabel(w));
const coreWantDef = (f, w) => (w?.coreWantId && f?.coreId ? (CORE_WANTS[f.coreId] ?? []).find((x) => x.id === w.coreWantId) : null);

// 7.11: once a living fighter reaches level 3, they tell you where the portal took them from (two a career, one per kind).
export function checkBackstories(run) {
  const seen = run.backstories ?? [];
  const kinds = run.backstoryKinds ?? [];
  if (seen.length >= MAX_BACKSTORIES) return;
  const f = run.roster.find((x) => x.level >= 3 && x.kind !== 'revenant' && !seen.includes(x.id) && !kinds.includes(x.kind) && (winsOf(run, x) >= 1 || x.trained >= 1));
  if (!f) return;
  const scene = backstoryScene(f);
  if (!scene) return;
  run.backstories = [...seen, f.id];
  run.backstoryKinds = [...kinds, f.kind];
  chronicle(run, f, scene.memory);
  talk(run, `backstory-${f.id}`, scene.beats);
}

export function checkQuests(run) {
  if (!run || run.inMatch) return;
  stewardTasks(run);
  if (run.status !== 'active') return;
  checkWants(run);
  checkRebelQuests(run);
  checkBackstories(run);
}

export function stewardTasks(run) {
  const q = questState(run);
  if (run.week < QUESTS.stewardFromWeek) return;
  if (q.steward && STEWARD_TASKS.some((t) => t.id === q.steward)) q.stewardIndex = STEWARD_TASKS.findIndex((t) => t.id === q.steward);
  if (q.steward) {
    const task = STEWARD_TASKS.find((t) => t.id === q.steward);
    if (!task?.test(run)) return;
    const paid = paySteward(run, [task]);
    q.steward = null;
    q.stewardIndex += 1;
    log(run, `The steward's assignment is done: ${task.goal}.${paid ? ` +${paid}.` : ''}`, 'good');
    talk(run, `steward-done-${task.id}`, [{ speaker: 'steward', text: task.id === 'grand' ? stewardGrandDone(run) : `${stewardDone(task)}${paid ? ` The house gains ${paid}.` : ''}` }]);
  }
  if (run.status !== 'active') return;
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

// Minimum 1 Gold whenever a task specifies a positive base gold reward.
export const stewardGold = (task) => (task?.gold > 0 ? Math.max(1, Math.round(task.gold * QUESTS.goldScale)) : 0);
export const stewardPrestige = (task) => (task && task.id !== 'grand' ? QUESTS.prestige : 0);
const rewardText = (gold, prestige) => [gold ? `${gold} Gold` : '', prestige ? `${prestige} Prestige` : ''].filter(Boolean).join(' and ');
export const stewardRewardText = (task) => rewardText(stewardGold(task), stewardPrestige(task));

export function paySteward(run, tasks) {
  const gold = tasks.reduce((n, t) => n + stewardGold(t), 0);
  const prestige = tasks.reduce((n, t) => n + stewardPrestige(t), 0);
  run.gold += gold;
  addPrestige(run, prestige);
  return rewardText(gold, prestige);
}

export const stewardTask = (run) => STEWARD_TASKS.find((t) => t.id === run.quests?.steward) ?? null;

// ---------- Fighter wants ----------

export function wantFor(run, f, id) {
  if (f.kind === 'revenant') return null;
  if (id === 'revenge') {
    const n = (run.nemeses ?? []).find((x) => (x.nemesis.beat ?? []).includes(f.id) && !isChampionOf(f, x.nemesis.tier));
    return n ? { name: `${n.name} ${n.nemesis.epithet}`, of: n.id } : null;
  }
  if (id === 'title') {
    return f.level >= 3 && run.topTier <= CIRCUITS.length && !isChampionOf(f, run.topTier)
      && effectivePower(f) >= arenaPower(run, run.topTier) - FIGHTER_WANTS.titleReach
      ? { tier: run.topTier, arena: championTitle(run.topTier).replace(/^Champion of /, '') } : null;
  }
  if (id === 'room') {
    const missing = FIGHTER_WANTS.roomItems.filter((x) => !(f.decor[x] > 0));
    if (!missing.length) return null;
    const k = missing[([...f.id].reduce((n, ch) => n + ch.charCodeAt(0), 0) + Math.floor(run.week / 4)) % missing.length];
    return { key: k, item: DECOR[k].name };
  }
  if (id === 'mentor') {
    if ((f.level ?? 1) > 2 || f.bond) return null;
    const won = new Set(run.history.filter((h) => h.week === run.week - 1 && h.won && !h.died).map((h) => h.fighterId));
    const g = run.roster.find((x) => x !== f && x.level >= 4 && !x.bond && x.kind !== 'revenant' && !(won.has(f.id) && won.has(x.id)));
    return g ? { name: g.name, of: g.id } : null;
  }
  if (id === 'retire') {
    return f.level >= 5 && (f.titles ?? []).length >= 2 && !retireBlocker(run, f.id)
      && run.roster.some((x) => x !== f && effectivePower(x) >= effectivePower(f)) ? {} : null;
  }
  return null;
}

export function wantsMonth(run) {
  run.rng.wants ??= createRng(deriveSeed(run.seed, 10));
  const r = run.rng.wants;
  if (run.roster.filter((f) => f.want).length >= FIGHTER_WANTS.max || next(r) >= FIGHTER_WANTS.chance) return;
  const options = [];
  for (const f of run.roster) {
    if (f.want) continue;
    if (f.coreId && CORE_WANTS[f.coreId]) {
      const cw = nextCoreWant(run, f);
      if (cw && !cw.test(run, f)) options.push({ f, coreWant: cw });
      continue;
    }
    for (const id of Object.keys(WANTS)) {
      const w = wantFor(run, f, id);
      if (w) options.push({ f, id, w });
    }
  }
  if (!options.length) return;
  const picked = pick(r, options);
  if (picked.coreWant) {
    const { f, coreWant: cw } = picked;
    f.want = {
      id: cw.key ? 'room' : cw.id,
      coreWantId: cw.id,
      label: cw.label,
      goal: cw.goal,
      key: cw.key ?? null,
      item: cw.item ?? null,
      since: run.week,
      until: cw.weeks ? run.week + cw.weeks : null,
    };
    queueMilestone(run, f, { id: `want_asked_${cw.id}`, priority: 65, ctx: { wantId: cw.id, label: cw.label, goal: cw.goal } });
    log(run, `${f.name} wants something: ${cw.label}.`, 'event');
    talk(run, `want-${f.id}-${run.week}`, [{ speaker: 'fighter', fighterId: f.id, text: cw.ask }]);
    return;
  }
  const { f, id, w } = picked;
  const def = WANTS[id];
  f.want = { id, ...w, since: run.week, until: def.weeks ? run.week + def.weeks : null };
  log(run, `${f.name} wants something: ${def.label(f.want)}.`, 'event');
  talk(run, `want-${f.id}-${run.week}`, [{ speaker: 'fighter', fighterId: f.id, text: def.ask(f.want) }]);
}

export function wantMet(run, f, w) {
  const cw = coreWantDef(f, w);
  if (cw?.test) return Boolean(cw.test(run, f));
  if (w.id === 'revenge') return run.history.some((h) => h.week >= w.since && h.fighterId === f.id && h.won && h.nemesis === w.name);
  if (w.id === 'title') return isChampionOf(f, w.tier);
  if (w.id === 'room') return f.decor[w.key] > 0;
  if (w.id === 'mentor') return f.bond?.id === w.of;
  return false;
}

export function wantImpossible(run, f, w) {
  if (w.coreWantId) return false;
  if (w.id === 'revenge') return !(run.nemeses ?? []).some((n) => n.id === w.of);
  if (w.id === 'mentor') return !run.roster.some((x) => x.id === w.of) || (f.bond && f.bond.id !== w.of);
  return false;
}

export function wantDone(run, f) {
  const w = f.want;
  const cw = coreWantDef(f, w);
  const def = WANTS[w.id];
  const label = cw ? cw.label : def?.label(w) ?? wantLabel(w);
  const thanks = cw ? cw.thanks : def?.thanks(w) ?? 'Thank you, Lanista.';
  moodShift(f, FIGHTER_WANTS.metMorale);
  f.renown += FIGHTER_WANTS.metRenown;
  gainXp(run, f, FIGHTER_WANTS.metXp);
  if (cw) {
    f.dialogue ??= createDialogueState(f.coreId);
    f.dialogue.queue = (f.dialogue.queue ?? []).filter((q) => q.id !== `want_asked_${cw.id}`);
    f.dialogue.wantChain ??= { index: 0, completed: [], refused: [] };
    if (!f.dialogue.wantChain.completed.includes(cw.id)) f.dialogue.wantChain.completed.push(cw.id);
    const idx = (CORE_WANTS[f.coreId] ?? []).findIndex((x) => x.id === cw.id);
    if (idx >= 0 && f.dialogue.wantChain.index <= idx) f.dialogue.wantChain.index = idx + 1;
    queueMilestone(run, f, { id: `want_fulfilled_${cw.id}`, priority: 72, ctx: { wantId: cw.id, label: cw.label, goal: cw.goal } });
  }
  log(run, `${f.name} got what they wanted: ${label}. +${FIGHTER_WANTS.metRenown} Renown, +${FIGHTER_WANTS.metXp} XP, and their spirits lift.`, 'good');
  chronicle(run, f, `Got what they wanted: ${label}.`);
  talk(run, `want-done-${f.id}-${w.since}`, [{ speaker: 'fighter', fighterId: f.id, text: thanks }]);
  delete f.want;
}

export function checkWants(run) {
  for (const f of run.roster) {
    const w = f.want;
    if (!w) continue;
    if (wantMet(run, f, w)) wantDone(run, f);
    else if (wantImpossible(run, f, w)) delete f.want;
    else if (w.until !== null && run.week > w.until) {
      const cw = coreWantDef(f, w);
      const label = cw ? cw.label : WANTS[w.id]?.label(w) ?? wantLabel(w);
      const sulk = cw ? cw.sulk : WANTS[w.id]?.sulk(w) ?? '';
      moodShift(f, FIGHTER_WANTS.missMorale);
      if (cw) {
        f.dialogue ??= createDialogueState(f.coreId);
        f.dialogue.queue = (f.dialogue.queue ?? []).filter((q) => q.id !== `want_asked_${cw.id}`);
        f.dialogue.wantChain ??= { index: 0, completed: [], refused: [] };
        if (!f.dialogue.wantChain.refused.includes(cw.id)) f.dialogue.wantChain.refused.push(cw.id);
        const idx = (CORE_WANTS[f.coreId] ?? []).findIndex((x) => x.id === cw.id);
        if (idx >= 0 && f.dialogue.wantChain.index <= idx) f.dialogue.wantChain.index = idx + 1;
        queueMilestone(run, f, { id: `want_refused_${cw.id}`, priority: 65, ctx: { wantId: cw.id, label: cw.label, goal: cw.goal } });
      }
      log(run, `${f.name} gives up on what they wanted (${label}).`, 'bad');
      if (sulk) talk(run, `want-lapsed-${f.id}-${w.since}`, [{ speaker: 'fighter', fighterId: f.id, text: sulk }]);
      delete f.want;
    }
  }
}

// ---------- Resistance requests ----------

export function rebelQuestsMonth(run) {
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

export function rebelQuestMet(run, quest) {
  if (quest.id === 'gallery') return maxLevel(run, 'gallery') > 0;
  if (quest.id === 'lobby') return hasPolicy(run, quest.policy);
  return false;
}

export function checkRebelQuests(run) {
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
