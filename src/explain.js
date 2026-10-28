// Player-facing explanations shared by the web UI and the text port, so both always say the same thing. Pure.

import { ECONOMY, FAVOR, MORALE, STRESS } from './data.js';
import { computePower, computeSpeed, effectiveInjuries } from './fight.js';
import { boutFor, matchOptions, fightPowers, isChampionOf, bossLossFavor, GRAND_TIER, houseOf, opponentFor, crushingGapFor, hasBracket } from './run.js';

// Warnings about sending this fighter to this arena. Each has text and a tone ('warn' | 'bad' | 'info').
export function fighterWarnings(run, f, tier) {
  const bout = boutFor(run, tier);
  const opp = opponentFor(run, tier);
  const out = [];
  if (f.stress >= STRESS.overtrained) out.push({ tone: 'bad', text: `Overtrained (Stress ${f.stress}): −1 Power and one ability lost` });
  const hurt = effectiveInjuries(f); // Poisoned counts as two
  if (hurt) out.push({ tone: 'warn', text: `${hurt} injur${hurt === 1 ? 'y' : 'ies'}` });
  if (!bout.top && tier !== GRAND_TIER) {
    const { mine, theirs } = fightPowers(run, f, tier);
    const gap = mine - theirs;
    if (isChampionOf(f, tier)) out.push({ tone: 'bad', text: `Champion here: a win earns no Prestige or Renown, and costs ${-FAVOR.championReturn} Favor and ${-MORALE.crowdJeers} Morale` });
    else if (f.renown >= ECONOMY.knownRenown && gap >= crushingGapFor(run, tier)) out.push({ tone: 'bad', text: `Crushing mismatch (+${gap} Power, ${f.renown} Renown): a win costs ${-FAVOR.crushingWin} Favor and ${-MORALE.crowdJeers} Morale` });
    else if (f.renown < ECONOMY.knownRenown) out.push({ tone: 'info', text: 'Rookie: the crowd won\'t jeer them here' });
  }
  const opts = matchOptions(run, f, tier);
  if (opts.scouted) out.push({ tone: 'warn', text: `Scouted: opponent +${opts.scouted} Power (they fought here last month; a month out of the top arena resets it)` });
  if (opts.grudge) out.push({ tone: 'bad', text: `Feud: ${houseOf(run, opp).name} wants revenge (opponent +${opts.grudge} Power)` });
  if (opts.vengeance) out.push({ tone: 'info', text: `Vengeance on ${houseOf(run, opp).name}: +5% win chance` });
  if (opts.challenger) out.push({ tone: 'warn', text: `Challenger: opponent +${opts.challenger} Power (famous fighters draw tougher opponents)` });
  return out;
}

// What's at stake in this arena, in plain words.
export function arenaStakes(run, tier) {
  const bout = boutFor(run, tier);
  if (!bout.top) {
    return `Lower arena: no Favor for winning; Prestige and the purse are halved per tier below your top arena. Rookies (under ${ECONOMY.knownRenown} Renown) fight here freely. `
      + `A known fighter winning with ${ECONOMY.crushingGap}+ more Power is jeered (${FAVOR.crushingWin} Favor, ${MORALE.crowdJeers} Morale, no Renown)${hasBracket(tier) ? `; in a tournament only the Final is judged, at ${ECONOMY.bracketCrushingGap}+` : ''}; `
      + `a Champion of this arena gets no Prestige or Renown and costs ${FAVOR.championReturn} Favor. `
      + `Win ${ECONOMY.titleWins} times here (or beat the Boss) to become its Champion. Upsets and Bloodied Victories (wins with 2+ injuries) still earn Favor.`;
  }
  if (!bout.boss) return '';
  if (tier === GRAND_TIER) return `Win: the career. Lose: ${bossLossFavor(tier, run)} Favor and try again next month.`;
  return `Win: a Title (+1 Power), +${FAVOR.bossWin} Favor and the next arena. Lose: ${bossLossFavor(tier, run)} Favor. Forfeit: ${bossLossFavor(tier, run) + FAVOR.forfeitExtra} Favor.`;
}

// The Power and Speed each side brings to the next round (everything included: gear, Titles,
// Scouted, Challenger, items, injuries, arena rules).
export function roundStats(match) {
  const round = Math.min(3, match.round + (match.over ? 0 : 1)) || 1;
  const side = (c, o) => {
    const p = computePower(c, o, round);
    return { power: p.total, speed: computeSpeed(c, round).total, mods: p.mods };
  };
  return { round, A: side(match.a, match.b), B: side(match.b, match.a) };
}
