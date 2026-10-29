// "What should I do next?": the single most useful prompt for the current state. Pure.

import { STRESS, MORALE } from './data.js';
import { arenaName, unlockedTiers, fightBlocker, jobBlocker, tributeDue, tributePaid, marketPrice, boutFor } from './run.js';
import { weeksUntilWinter } from './calendar.js';

export function nextHint(run) {
  if (run.status !== 'active') return null;
  if (!run.roster.length) {
    return run.gold >= marketPrice(run)
      ? { text: 'Recruit a gladiator in the Market.', action: 'tab', tab: 'market', label: 'Go to Market' }
      : { text: 'No gladiators and not enough Gold: build a Liaison or wait for cheaper offers.', tone: 'bad' };
  }
  if (run.event) return { text: 'Something has happened in the Ludus: make your choice on the card below.', tone: 'event' };
  const levelled = run.roster.find((f) => f.pendingPerks.length);
  if (levelled) return { text: `${levelled.name} leveled up: pick a perk on their card.`, tone: 'event' };
  if (run.boutPending) {
    // Nobody can afford the top arena: say so, and point at the way out.
    const bout = boutFor(run, run.topTier);
    if (run.prestige < bout.buyIn) {
      const pits = run.topTier > 1 && run.bouts?.[1] === 'open' && run.roster.some((f) => !fightBlocker(run, f.id, 1));
      return {
        text: `Not enough Prestige for ${arenaName(run.topTier)}: the buy-in is ${bout.buyIn} and you have ${run.prestige}. ${bout.boss ? 'Forfeit the Boss' : 'Skip it'}${pits ? ', and win Prestige back in The Dirt Pits (they take whatever Prestige you have)' : ''}.`,
        tone: 'bad',
      };
    }
    return { text: `Tournament week: send a fighter to ${arenaName(run.topTier)} (or skip it). Odds are on the right.`, tone: 'event' };
  }
  if (run.bouts) {
    const open = unlockedTiers(run).filter((t) => run.bouts[t] === 'open' && run.roster.some((f) => !fightBlocker(run, f.id, t)));
    if (open.length) return { text: `Optional: send a free fighter to ${open.map(arenaName).join(' or ')} for extra Gold and XP, or end the week.` };
  }
  const injured = run.roster.find((f) => f.injuries.length && f.job !== 'medbay' && !jobBlocker(run, f.id, 'medbay'));
  if (injured) return { text: `${injured.name} is injured: set their job to Medbay so they heal.`, tone: 'warn' };
  const due = tributeDue(run);
  const weeks = weeksUntilWinter(run.week);
  if (weeks > 0 && weeks <= 4 && run.gold < due && !tributePaid(run)) return { text: `Save Gold: the ${due} Gold tribute is due in ${weeks} week${weeks === 1 ? '' : 's'} and you have ${run.gold}.`, tone: 'bad' };
  const restless = run.roster.find((f) => f.morale < MORALE.restless);
  if (restless) return { text: `${restless.name} is Discontented (Morale ${restless.morale}): place decor or upgrade their quarters.`, tone: 'warn' };
  const idle = run.roster.find((f) => f.job === 'rest' && f.stress + STRESS.train < STRESS.overtrained && !jobBlocker(run, f.id, 'trainPower'));
  if (idle) return { text: `${idle.name} is resting with Stress ${idle.stress}: they could train this week.` };
  return { text: 'Jobs are set. End the week (Space) or skip to the tournament (T).' };
}
