// Text interface to a Blood and Circus career: drives the pure modules in src/ with no DOM, one command per line.
// Usage: node scripts/play-text.js [--seed N] [--long] [--legacy] [--heat N] [--patron ID] [--daily YYYY-MM-DD] [--last N] < commands.txt
//   A season by default (Tournament → Boss in each arena); --long: the Long Road. --daily DAY: that day's Emperor's Challenge.
//   --legacy: every Legacy unlock (the relics, legends, the Oracle, the fourth Fortune card); --heat N: Heat 1–5; --patron ID.
//   --seed N  career seed (default 1). Careers replay exactly, so a player can append commands and re-run.
//   --last N  print only the output of the last N commands (earlier ones still run, unrendered).
// Type `help` for the command list.

import { createInterface } from 'node:readline';
import { dailySeed, dailySetup, ALL_UNLOCKS, careerXp } from '../src/legacy.js';
import { pathToFileURL } from 'node:url';
import { FORTUNE, LOUNGE, DEMANDS, DEMAND, CIRCUITS, SUMMONS, RENOWN, STRESS, MORALE, KINDS, TRAITS, CLASSES, WEAPONS, INJURY_BY_TAG, DECOR, PERKS, GEAR, XP, BUILDINGS, BOSS_DEBUFFS, ECONOMY, FAVOR, PRESTIGE_LEVELS, CONSUMABLES, TACTICS, HUMORS, SCARS, AUGMENTS, BRACKET, HOUSES, SIGNATURES, SIGNATURE, MERCY, ROUND_TACTICS, HYPE } from '../src/data.js';
import { fighterWarnings, arenaStakes, roundStats } from '../src/explain.js';
import { nextHint } from '../src/hints.js';
import { EVENT_BY_ID, choiceLabel, stakesText } from '../src/events.js';
import { RELICS, TAGS, perkTags, fortuneTitle, fortuneText } from '../src/fortune.js';
import { playRound, throwTowel, mortalDanger, canThrowTowel, effectiveInjuries, suggestTactic, deathGateAt, deathRisk, signatureOf, useSignature, opponentHasSignature, hypeOf, opponentTell, tellForecast, opponentUnleashesNext, signatureBlocker } from '../src/fight.js';
import {
  createRun, boutFor, unlockedTiers, arenaName, marketPrice, circuitInfo, recruit, release, setJob, advanceWeek, advanceToTournament,
  advanceBlocker, buyItem, useItem, buyDecor, assignDecor, removeDecor, buyGear, equip, unequip, surgeon, surgeonPrice, choosePerk, moraleTarget, moraleState,
  startMatch, finishMatch, skipBout, forfeitBout, tributeDue, tributePaid, payTribute, sellGear, chooseEvent, eventChoiceBlocker, eventNames, houseOf, standings, augment, retire, upcomingBouts, treatFirst, opponentFor, hasBracket, bracketOf, withdraw, effectivePower, recruitBlocker, fightBlocker, GRAND_TIER, resolveMercy, powerParts, effectiveSpeed, chooseFortune, fortuneBlocker, rerollFortune, rerollPrice, passFortune,
  matchOptions, pray, exhibition, recruitPrice, placeBet, host, enact, hostPrice, hostBlocker, enactBlocker, activePolicies, demandMet,
  bossLossFavor, raisable, reanimate, reanimateBlocker, reanimatePrice, spareFavor, spareFavorWhy, owedLeft, purseGold, keepsBuyIn, stewardTask, stewardRewardText, risingProgress, archrival, checkQuests, answerSummons, refuseSummons, rite,
} from '../src/run.js';
import { build, upgrade, buildBlocker, buildingKnown, upgradeBlocker, plotCount, rosterCap, trainCap, trainCost, oracleLevel, maxLevel, levelInfo, effectAt } from '../src/ludus.js';
import { formatDate, weeksUntilTournament, weeksUntilWinter, isWinter, nextFestival, dateOf } from '../src/calendar.js';
import { estimateOdds, describeOdds } from '../src/odds.js';
import { narrateStory, narrateRound, resultText, adviceFor, classAbility, slotName } from '../src/narrate.js';
import { INTRO, GUIDE, STEPS, FIGHT_STEPS, nextStep } from '../src/tutorial.js';
import { SCENES, SPEAKERS, dueScene, dueRebel, rebelScene, dueRebelStage, demandMetScene, demandMissedScene } from '../src/dialogue.js';
import { WANTS, REBEL_QUESTS } from '../src/quests.js';
import { ENTRIES, SECTIONS, createCodex, discover, discoverMatch, isUnlocked, hasLore, progress, gearText, slotLabel } from '../src/codex.js';

// A card choice's visible stakes. Plot cards (v6) show nothing rather than "Nothing happens" when only hidden things change.
const plotStakes = (run, c, names = {}) => {
  const t = stakesText(c.effects, '; ', { f: names.f, g: names.g });
  return run.event?.plot && t === 'Nothing happens' ? '' : ` → ${t}`;
};

// Web-only phrasing ("hover", "on the right", key shortcuts) translated for the text port.
const textHint = (t) => t
  .replace(/\s*\(Space\)/g, ' (`end-week`)').replace(/\s*\(T\)/g, ' (`to-tournament`)')
  .replace(/Odds are on the right\./g, 'Odds are listed under each arena.')
  .replace(/hover over (them|any trait)[^.]*\./gi, 'use `codex` to read what they do.');
const plain = (html) => textHint(html.replace(/<\/p>\s*<p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s*\n\s*/g, '\n').trim());
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const injuryName = (tag) => INJURY_BY_TAG[tag].name;

export const HELP = `Commands (ids like f3 and b2 are shown in brackets):
  look                          show the house again
  market | estate | store       the Market (fighters, decor, Armourer, Liaison), the Estate (buildings), the storeroom
  codex [key]                   list unlocked Codex entries, or read one (e.g. codex basics:favour)
  skip-tutorial                 stop the steward's tutorial (the tutorial month and the tips)
  ok                            dismiss the current tutorial card
  recruit <id> | release <id>
  job <id> <rest|trainPower|trainSpeed|medbay>
  perk <id> <perk>              choose a level-up perk
  pray <id>                     Temple of Fortuna: pay Gold for three new perk choices
  rite <id>                     Temple of Fortuna: lift a fighter's Afeared scar for Gold (or win twice against what they fear)
  raise <id>                    Unnatural Temple of Vulcan: raise a fighter killed in the arena as a Revenant (see \`market\`)
  spar <id> <id>                Exhibition Ring (fight day): two free fighters spar for XP, Renown and Gold
  surgeon <id> <injury#>        Emergency Surgeon: heal one injury now (injury# from 0)
  buy-decor <${Object.keys(DECOR).join('|')}>
  buy-item <${Object.keys(CONSUMABLES).join('|')}>   single-use fight items
  signature                     during a fight (level 3+): unleash your fighter's signature move next round, once per fight
  spare | kill                  thumbs up or down: decide a beaten, wounded opponent's fate after a win
  use <item>                    during a fight, before Round 1 or between rounds: one of each kind per fight
  bet <gold>                    during a fight, before Round 1: back your fighter at their real odds
  lounge / host / enact <id>    the Patron Lounge: see policies, host the Senate (Influence), pass a policy
  place <id> <item> | remove <id> <item>      put decor in a fighter's room, or take it back
  buy-gear <stock#> | equip <id> <storeroom#> | unequip <id> <weapon|armour> | sell-gear <storeroom#> (half price)
  build <type> | upgrade <buildingId>         types: ${Object.keys(BUILDINGS).filter((k) => !BUILDINGS[k].secret).join(', ')}
  fight <id> [tier]             send a fighter to an arena on tournament week (default: your top arena)
  pay-tribute                   pay this year's tribute early
  summons <id> <yield|death>    the Emperor's summons (on fight day): send a fighter to the Imperial Coliseum
  refuse-summons                refuse the Emperor's summons (costs Favour)
  houses                        the rival houses' standings
  quests                        the steward's assignment, what your fighters want, and any other requests
  story <id> | retire <id>      a fighter's chronicle; retire a veteran (level 4+ or a Title) to the Hall of Champions
  treat <id> <injury#>          choose which injury the Medbay heals first
  augment <id> <injury#>        cyborg surgery on a Maimed or Blinded wound (Medbay level 2+)
  withdraw <tier>               leave a three-match tournament between matches (counts as capitulating)
  choose <n>                    decide this week's event (the week can't end until you do)
  fortune <n> [drop] | spin | pass  this month's Fortune: take card n (at the relic limit, name a relic id to lay down), spin again for Gold, or let it pass
  relics                        the house's relics and what each does
  skip | forfeit                skip your top arena's Tournament 1/2, or forfeit its Boss
  next [tactic] | capitulate    during a fight: play the next round with a tactic (steady, press, guard, feint; default: the suggestion), or capitulate ("towel" also works)
  math                          toggle the round-by-round math in fight narration
  end-week | to-tournament      run one week of jobs, or keep ending weeks until the next tournament`;

export function createSession(seed = 1, { oddsSamples = 400, setup = {} } = {}) {
  const run = createRun(seed, setup);
  const codex = createCodex();
  // Dialogue scenes (src/dialogue.js), as text: the opening once, then the Emperor's visits as they come due.
  const scenesSeen = [];
  // (The intro's pages already print at the start, so the opening's narrator page is skipped here.)
  // Replies (your answers) play the first answer, and list the others.
  const withReplies = (beats) => beats.flatMap((b) => (b.replies ? [b, { speaker: 'narrator', text: `(You could answer: ${b.replies.map((r) => `"${r.label}"`).join(' / ')}. You say: "${b.replies[0].label}")` }, ...b.replies[0].then] : [b]));
  const sceneText = (id, beats = SCENES[id]) => `\n${withReplies(beats).filter((b) => b.speaker !== 'narrator' || !b.title).map((b) => `${(b.fighter?.name ?? SPEAKERS[b.speaker].name) ? `${b.fighter?.name ?? SPEAKERS[b.speaker].name}: ` : ''}${b.title ? `[${b.title}] ` : ''}${(b.text ?? b.html).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()}`).join('\n')}`;
  const done = []; // dismissed tutorial steps
  const oddsCache = new Map();
  let match = null;
  let showMath = false;
  let quiet = false; // replaying unshown commands: skip the (slow) odds simulations
  let shownStep = null; // the tutorial card the player last saw, so a new one is announced when it appears

  // The tutorial month (GUIDE) comes first: each step is done when its goal is met. Then the steward's tips (STEPS).
  function guideNow() {
    if (run.status !== 'active') return null;
    for (;;) {
      const g = nextStep(GUIDE, done, run);
      if (!g || !g.goal(run)) return g;
      done.push(g.id);
    }
  }
  const currentStep = () => (run.status !== 'active' ? null : guideNow() ?? nextStep(STEPS, done, run));
  function tutorialCard() {
    const step = currentStep();
    shownStep = step?.id ?? null;
    if (!step) return '';
    return step.goal ? `-- Your steward (tutorial month) --\n${plain(step.text)}` : `-- Tutorial: ${step.title} (\`ok\` to dismiss) --\n${plain(step.body)}`;
  }

  // ---------- Views ----------

  function oddsFor(f, tier, opp = opponentFor(run, tier)) {
    const bout = boutFor(run, tier);
    const opts = matchOptions(run, f, tier);
    const key = JSON.stringify([f, opp, opts]);
    if (!oddsCache.has(key)) {
      if (oddsCache.size > 400) oddsCache.clear();
      oddsCache.set(key, estimateOdds(f, opp, { ...opts, n: oddsSamples }));
    }
    return oddsCache.get(key);
  }

  function identity(f) {
    const cls = f.cls ? `${CLASSES[f.cls].name}${f.weapon ? ` (${WEAPONS[f.weapon].name})` : ''}` : 'no class';
    return `${f.name} · ${KINDS[f.kind].name} ${cls} · Lv ${f.level}`;
  }

  function abilities(f) {
    const trait = f.kindTrait ? `${TRAITS[f.kindTrait].name}: ${TRAITS[f.kindTrait].desc}` : null;
    const desc = f.cls === 'fighter' ? WEAPONS[f.weapon].desc : CLASSES[f.cls]?.desc;
    const perks = f.perks?.length ? `Perks: ${f.perks.map((p) => `${PERKS[p].name}${perkTags(p).length ? ` [${perkTags(p).map((t) => TAGS[t].name).join('/')}]` : ''}`).join(', ')}` : null;
    return [trait, f.cls ? `${classAbility(f)}: ${desc}` : null, perks].filter(Boolean).join(' | ');
  }

  function extras(f) {
    const bits = [];
    if (f.titles.length) bits.push(`Titles: ${f.titles.join(', ')} (+1 Power each)`);
    if (f.spy) bits.push('writes to the palace (the spy you kept)');
    const gear = ['weapon', 'armor'].filter((s) => f.gear[s]).map((s) => `${GEAR[f.gear[s]].name} (${gearText(GEAR[f.gear[s]])})`);
    if (gear.length) bits.push(`Gear: ${gear.join('; ')}`);
    const decor = Object.entries(f.decor).filter(([, n]) => n).map(([k, n]) => `${DECOR[k].name} ×${n}${DECOR[k].helps(f) ? '' : ' (comfort only)'}`);
    if (decor.length) bits.push(`Decor: ${decor.join(', ')}`);
    if (f.augments?.length) bits.push(`Augments: ${f.augments.map((k) => `${AUGMENTS[k].name} (${AUGMENTS[k].desc})`).join(', ')}`);
    return bits;
  }

  const injuriesText = (f) => (f.injuries.length
    ? f.injuries.map((i, n) => `#${n} ${injuryName(i.tag)}${i.weight > 1 ? ` ×${i.weight}` : ''}${i.weeksLeft ? ` (${Math.ceil(i.weeksLeft)}w to heal${i.tag === 'fleshWound' ? ' in the Medbay, twice that on Rest' : ''})` : ''}`).join(', ')
    : 'none');

  function fighterBlock(f) {
    const { target } = moraleTarget(run, f);
    const gate = effectiveInjuries(f);
    const nextXp = XP.levels[f.level - 1];
    const lines = [
      `[${f.id}] ${identity(f)} (XP ${f.xp}${nextXp ? `/${nextXp}` : ', max level'})`,
      `     Power ${effectivePower(f)} (${powerParts(f).map((x, i) => (i ? `${x.value >= 0 ? '+' : ''}${x.value} ${x.label}` : `${x.label} ${x.value}`)).join(', ')}) · Speed ${effectiveSpeed(f)}${effectiveSpeed(f) !== f.speed ? ` (${f.speed} + ${effectiveSpeed(f) - f.speed} gear)` : ''} · Stress ${f.stress}${f.stress >= STRESS.overtrained ? ' OVERTRAINED' : ''} · Morale ${f.morale} ${moraleState(f).label} (heading to ${target}: comfort +${moraleTarget(run, f).comfort}, fame expects −${moraleTarget(run, f).expects}${f.morale >= MORALE.restless && target < MORALE.restless ? '; WILL TURN DISCONTENTED and stop training: more comfort needed' : ''}) · Renown ${f.renown}`,
      `     Job: ${f.job} · trained ${f.trained}/${trainCap(run)} · Injuries: ${injuriesText(f)} · Death Gate ${gate}/${deathGateAt(f)}${gate >= deathGateAt(f) ? ' OPEN' : ''}`,
      ...(f.humor ? [`     Humor: ${HUMORS[f.humor].name} (${HUMORS[f.humor].desc})`] : []),
      ...((f.scars?.length || f.augments?.length) ? [`     Scars: ${(f.scars ?? []).map((sc) => `${SCARS[sc.id].name}${sc.vs ? ` vs ${sc.vs}` : ''}`).join(', ') || 'none'} · Augments: ${(f.augments ?? []).map((k) => AUGMENTS[k].name).join(', ') || 'none'}`] : []),
      `     ${abilities(f)}`,
      ...extras(f).map((x) => `     ${x}`),
    ];
    f.pendingPerks.forEach((offer, i) => {
      const opts = offer.map((p) => `${p} (${PERKS[p].name}${perkTags(p).length ? ` [${perkTags(p).map((t) => TAGS[t].name).join('/')}]` : ''}: ${PERKS[p].desc})`).join(' | ');
      lines.push(`     ${i ? 'Then' : 'LEVEL UP! Choose with `perk ' + f.id + ' <perk>`'}: ${opts}`);
    });
    return lines.join('\n');
  }

  function opponentBlock(f, boss = false) {
    const bits = [`Power ${effectivePower(f)}${effectivePower(f) !== f.power ? ` (${powerParts(f).map((x, i) => (i ? `${x.value >= 0 ? '+' : ''}${x.value} ${x.label}` : `${x.label} ${x.value}`)).join(', ')})` : ''}`, `Speed ${effectiveSpeed(f)}`, ...(opponentHasSignature(f, boss) ? [`Signature: ${SIGNATURES[f.cls].name} (${SIGNATURES[f.cls].desc} Used when behind, or in Round 3)`] : []), `Renown ${f.renown}`, ...(f.humor ? [`${HUMORS[f.humor].name}: ${HUMORS[f.humor].tell}`] : []), ...extras(f)];
    const house = houseOf(run, f);
    return [`     Opponent: ${identity(f)}${house ? ` · fights for ${house.name}${house.feud ? ` (FEUD: +1 Power against you, ${plural(house.feud, 'month')} left)` : ''}${house.owed && !house.feud ? ` (OWES YOU A LIFE: −1 Power against you, ${plural(house.owed, 'month')} left)` : ''}${house.vengeance ? ` (your VENGEANCE: +5% win chance, ${plural(house.vengeance, 'month')} left)` : ''}` : ''}${f.rival ? ' · RIVAL (beat you before, now stronger)' : ''}${f.nemesis ? ` · NEMESIS ${f.nemesis.epithet} (beat your house ${f.nemesis.wins}×${f.nemesis.victims.length ? `, killed ${f.nemesis.victims.join(' and ')}` : ''}; +${f.nemesis.bonus} Power)` : ''}`, `       ${bits.join(' · ')}`, `       ${abilities(f)}`].join('\n');
  }

  function arenaBlock(tier) {
    const bout = boutFor(run, tier);
    const arena = run.arenas[tier];
    const state = run.status === 'active' ? run.bouts?.[tier] : null;
    const name = state === 'done' ? `${arenaName(tier)} · settled this week · next month: ${bout.name.split(' · ')[1] ?? bout.name}` : `${bout.name}${state ? ' · OPEN this week' : ''}`;
    const lines = [`${name} · tier ${tier}${bout.top ? ' (your top arena)' : ' (lower arena)'}`];
    lines.push(`     Buy-in ${bout.buyIn} Prestige · Win: +${bout.winGold} Gold (+1 per ${RENOWN.goldPer} Renown of your fighter), +${bout.winPrestige} Prestige · Loss: +${bout.lossGold} Gold`);
    const stakes = arenaStakes(run, tier);
    // The long lower-arena rules print once per screen; later lower arenas point back to them.
    if (stakes) lines.push(!bout.top && tier !== GRAND_TIER && lowerShown++ ? '     Lower arena: same rules as above.' : `     ${stakes}`);
    const revealed = run.plot?.reveal === tier; // v6: a rebel visitor whispered it
    const ruleId = bout.boss ? bout.debuff : bout.top && (oracleLevel(run) >= 2 || revealed) && tier > 1 ? arena.debuff : null;
    if (ruleId) lines.push(`     ${bout.boss ? 'Boss arena rule' : revealed && oracleLevel(run) < 2 ? 'A visitor whispered the Boss arena rule' : 'The Oracle foresees the Boss arena rule'}: ${BOSS_DEBUFFS[ruleId].name}. ${BOSS_DEBUFFS[ruleId].desc}`);
    else if (bout.boss && tier === 1) lines.push('     This first Boss fights without an arena rule.');
    if (hasBracket(tier)) {
      const b = bracketOf(run, tier);
      const foes = [...(b?.foes ?? [null, null]), arena.opponent];
      lines.push(`     THREE MATCHES: ${BRACKET.rounds.map((r, i) => `${r}${foes[i] ? ` vs ${foes[i].name} (Power ${effectivePower(foes[i])})` : ''}${b && i < b.round ? ' [won]' : ''}`).join(' → ')}`);
      if (b?.fighterId && b.round > 0 && state === 'open') lines.push(`     ${run.roster.find((x) => x.id === b.fighterId)?.name} is through to the ${BRACKET.rounds[b.round]}: \`fight ${b.fighterId} ${tier}\` to fight on, or \`withdraw ${tier}\` (counts as capitulating).`);
      lines.push('     The Final:');
    }
    lines.push(opponentBlock(arena.opponent, bout.boss));
    if (state === 'done' || quiet || run.status !== 'active') return lines.join('\n');
    for (const f of run.roster) {
      const o = describeOdds(oddsFor(f, tier), oracleLevel(run));
      const pct = (p) => (p ? ` ${p}` : '');
      const warn = fighterWarnings(run, f, tier).map((w) => w.text);
      const blocker = state === 'open' ? fightBlocker(run, f.id, tier) : null;
      // In a bracket, the match odds are for the next match only; the whole tournament is every match left, multiplied.
      const b = hasBracket(tier) && state === 'open' ? bracketOf(run, tier) : null;
      const left = b ? [...b.foes.slice(b.round), arena.opponent] : [];
      const whole = left.length > 1 ? describeOdds({ win: left.reduce((p, x) => p * oddsFor(f, tier, x).win, 1), injury: 0, death: 0 }, oracleLevel(run)) : null;
      lines.push(`     ${f.name} [${f.id}]: ${b ? `next match (${BRACKET.rounds[b.round]})` : 'match'} ${o.win}${pct(o.winPct)}${whole ? ` · whole tournament ${whole.win}${pct(whole.winPct)}` : ''} · Injury ${o.injury}${pct(o.injuryPct)} · Death ${o.death}${pct(o.deathPct)}${warn.length ? ` · ${warn.join(', ')}` : ''}${blocker ? ` · can't fight: ${blocker}` : ''}`);
    }
    if (bout.top && run.boutPending) lines.push(`     ${bout.boss ? `Bosses can't be skipped: fight or \`forfeit\` (${bossLossFavor(tier, run) + FAVOR.forfeitExtra} Favour).` : `Or \`skip\` (+${ECONOMY.skipGold} Gold, the roster rests).`}`);
    return lines.join('\n');
  }

  function header() {
    const next = PRESTIGE_LEVELS[run.prestigeLevel];
    const due = tributeDue(run);
    const toTribute = weeksUntilWinter(run.week);
    const fest = nextFestival(run.week);
    const festival = fest ? `Next Gods' Day: ${fest.festival.name} (${fest.festival.god}) ${fest.weeks ? `in ${plural(fest.weeks, 'week')}` : 'THIS tournament week'}: ${fest.festival.desc}` : '';
    const tribute = tributePaid(run) ? 'Tribute paid for this year' : toTribute > 0 ? `Tribute ${due} Gold due at the start of winter (in ${plural(toTribute, 'week')})${toTribute <= 4 && run.gold < due ? ` · SHORT by ${due - run.gold}: unpaid tribute takes all your Gold and ${-FAVOR.unpaidTribute} Favour` : ''} (\`pay-tribute\` to pay early)` : 'Tribute collected for this year';
    const when = run.boutPending ? 'TOURNAMENT WEEK: settle your top arena before ending the week.'
      : run.bouts ? 'Your top arena is settled. Send fighters to other open arenas, or end the week.'
        : `${isWinter(run.week) ? 'Winter Dead Season: no tournaments. ' : ''}Next tournament in ${plural(weeksUntilTournament(run.week), 'week')}.`;
    return [
      `=== ${formatDate(run.week)} ===`,
      `Gold ${run.gold} · Prestige ${run.prestige} (House level ${run.prestigeLevel}${next ? `, level ${next.level} at ${next.at}` : ''}) · Imperial Favour ${run.favor}/${FAVOR.max}${run.favor <= FAVOR.warning ? ' (DANGER)' : ''}`,
      tribute,
      `Coming up in ${arenaName(run.topTier)}: ${upcomingBouts(run).map((b) => `${b.stage} ${b.weeks ? `in ${plural(b.weeks, 'week')}` : 'THIS WEEK'} (${dateOf(b.week).month}${b.festival ? `, ${b.festival}` : ''})`).join(' → ')}`,
      festival,
      when,
    ].join('\n');
  }

  function mercyText() {
    const v = run.mercy;
    const blood = v.crowd === 'kill';
    const favor = spareFavorWhy(run) ?? `+${spareFavor(run)} Favour`;
    const owes = owedLeft(run);
    const spare = blood ? `${favor}; ${owes ? `their house already owes you a life (${plural(owes, 'month')} left): no new debt` : `their house will owe you a life (−1 Power against you for ${HOUSES.feudMonths} months)`}` : `${favor}, +${MERCY.crowdRenown} Renown, +${MERCY.crowdMorale} Morale`;
    const kill = blood ? `+${MERCY.killRenown + MERCY.crowdRenown} Renown, +${MERCY.crowdMorale} Morale, a kill` : `+${MERCY.killRenown + MERCY.infamyRenown} Renown (infamy), a kill${v.house ? '; their house swears a feud (+1 Power against you)' : ''}`;
    return `*** THUMBS UP OR DOWN: ${v.opp} lies beaten. ${blood ? 'The crowd roars for blood!' : 'The crowd chants for mercy.'} ***\n`
      + `  \`spare\`: ${spare}\n  \`kill\`: ${kill}\n  Nothing else can happen until you decide.`;
  }

  let lowerShown = 0;
  function look() {
    if (match) return fightStatus();
    lowerShown = 0;
    const out = [header()];
    if (run.summons) out.push(`\n⚜ THE EMPEROR SUMMONS one of your fighters to the Imperial Coliseum (a regular, Power ${CIRCUITS[SUMMONS.tier - 1].oppPower[0]}) on this month's fight day: \`summons <id> <yield|death>\` then, or \`refuse-summons\` (${SUMMONS.refuseFavor} Favour).`);
    if (run.demand) out.push(`\n⚜ THE EMPEROR DEMANDS: ${DEMANDS[run.demand.id].goal}, by the end of this month's fight day.${demandMet(run) ? ' (done)' : ''}`);
    // The Emperor's word on a demand met, and on one missed (as on the page; playtest LLM-11: only the page had them).
    if (run.demand && demandMet(run) && !scenesSeen.includes(`demand-met-${run.demand.week}`)) {
      scenesSeen.push(`demand-met-${run.demand.week}`);
      out.push(sceneText('demand-met', demandMetScene(DEMANDS[run.demand.id].goal, DEMAND.favor, DEMAND.goldPerTier * Math.min(run.topTier, CIRCUITS.length))));
    }
    const judged = run.demandResult;
    if (judged && !judged.met && !scenesSeen.includes(`demand-missed-${judged.issued}`)) {
      scenesSeen.push(`demand-missed-${judged.issued}`);
      out.push(sceneText('demand-missed', demandMissedScene(DEMANDS[judged.id].goal, judged.favor)));
    }
    const due = scenesSeen.includes('opening') ? dueScene(run, scenesSeen) : 'opening';
    if (due) {
      scenesSeen.push(due);
      out.push(sceneText(due));
    }
    const rebel = scenesSeen.includes('opening') && dueRebel(run, scenesSeen);
    if (rebel) {
      scenesSeen.push('rebel');
      out.push(sceneText('rebel', rebelScene(run, rebel)));
    }
    const stage = dueRebelStage(run, scenesSeen);
    if (stage) {
      scenesSeen.push(stage.id);
      out.push(sceneText(stage.id, stage.beats));
    }
    // Quests and rivals (5.4.0): what the rules said someone says, once each.
    for (const t of run.talk ?? []) {
      if (scenesSeen.includes(`talk-${t.key}`)) continue;
      scenesSeen.push(`talk-${t.key}`);
      out.push(sceneText('talk', t.beats.map((b) => {
        const f = b.fighterId && [...run.roster, ...run.fallen, ...(run.retired ?? [])].find((x) => x.id === b.fighterId);
        return f ? { speaker: 'fighter', fighter: f, text: b.text } : { speaker: b.speaker, text: b.text };
      })));
    }
    if (run.mercy) out.push(`\n${mercyText()}`);
    if (run.status !== 'active') {
      const fought = run.history.filter((h) => !h.skipped && !h.forfeit);
      for (const line of run.epilogue ?? []) out.push(`\n${line}`);
      out.push(`\n*** CAREER OVER: ${run.endReason} ***\nSurvived ${plural(run.week, 'week')} · ${fought.filter((h) => h.won).length} wins, ${fought.filter((h) => !h.won).length} losses · top arena: ${arenaName(run.topTier)} · fallen: ${run.fallen.map((f) => f.name).join(', ') || 'none'}`);
      // LLM-13: the end of a career showed no Legacy XP in the text port (the game's end screen does).
      const xp = careerXp(run);
      out.push(`Legacy XP: +${xp.total} (${xp.lines.map((l) => `${l.label} +${l.xp}`).join(', ')}).`);
    }
    if (run.relics?.length) out.push(`Relics (${run.relics.length}/${FORTUNE.maxRelics}): ${run.relics.map((id) => RELICS[id].name).join(', ')}`);
    if (run.fortune && !run.event) {
      out.push(`\n*** FORTUNE'S WHEEL TURNS: choose one (the month can't go on until you do) ***\n${run.fortune.cards.map((c, i) => `  fortune ${i}: [${c.rarity} ${c.kind}${c.kind === 'relic' && RELICS[c.id].tag ? `, ${TAGS[RELICS[c.id].tag].name}` : ''}] ${fortuneTitle(c)}: ${fortuneText(c)}${c.kind === 'relic' && run.relics.length >= FORTUNE.maxRelics ? ` (lay one down: \`fortune ${i} <${run.relics.join('|')}>\`)` : fortuneBlocker(run, i) ? ` (can't: ${fortuneBlocker(run, i)})` : ''}`).join('\n')}\n  ${run.fortune.augur ? '' : `spin: ${run.fortune.cards.length} new cards for ${rerollPrice(run)} Gold · `}pass: take nothing, +${FORTUNE.pass} Gold`);
    }
    if (run.event) {
      const e = EVENT_BY_ID[run.event.id];
      const names = eventNames(run);
      out.push(`\n*** EVENT: ${e.title} ***\n${e.text(names)}\n${e.choices.map((c, i) => `  choose ${i}: ${choiceLabel(c, names)}${plotStakes(run, c, names)}${eventChoiceBlocker(run, i) ? ` (can't: ${eventChoiceBlocker(run, i)})` : ''}`).join('\n')}`);
    }
    out.push(`\n-- Your gladiators ${run.roster.length}/${rosterCap(run)} · training costs ${trainCost(run)} Gold a week${maxLevel(run, 'trainer') > trainCost(run) ? ` (${maxLevel(run, 'trainer')} from the Silver Coliseum)` : ''} --`);
    out.push(run.roster.length ? run.roster.map(fighterBlock).join('\n') : '(none: `market` to see who is for sale)');
    if (run.fallen.length) out.push(`Fallen: ${run.fallen.map((f) => `${f.name}${f.raised ? ' (risen as a Revenant)' : ''}`).join(', ')}`);
    out.push(`\n-- ${run.bouts ? 'Fight day' : 'Next bouts'} --`);
    out.push(unlockedTiers(run).sort((a, b) => b - a).map(arenaBlock).join('\n'));
    if (!oracleLevel(run)) out.push('(Build an Oracle to see exact percentages.)');
    out.push(`\nMarket: ${run.market.length} fighters at ${marketPrice(run)} Gold${run.liaisonOffers?.length ? `, plus ${plural(run.liaisonOffers.length, 'Liaison prisoner')}` : ''} · Estate: ${run.buildings.length}/${plotCount(run)} plots · Storeroom: ${run.inventory.gear.length} gear`);
    const hint = nextHint(run);
    if (hint) out.push(`\nNext: ${textHint(hint.text)}`);
    const card = tutorialCard();
    if (card) out.push(`\n${card}`);
    out.push(`\n-- House log --\n${run.log.slice(-8).map((l) => `  ${l.text}`).join('\n')}`);
    const blocked = advanceBlocker(run);
    if (blocked && run.status === 'active' && !run.boutPending) out.push(`(Before this week can end: ${blocked})`);
    return out.join('\n');
  }

  function marketView() {
    const out = [`-- Market · ${circuitInfo(run).name} · from ${marketPrice(run)} Gold (seasoned fighters cost more) · roster ${run.roster.length}/${rosterCap(run)} --`];
    out.push('New fighters arrive at the start of every month, stronger as you climb the tiers.');
    for (const f of run.market) {
      const why = recruitBlocker(run, f.id);
      out.push(`[${f.id}] ${identity(f)} · ${recruitPrice(run, f)} Gold · Power ${f.power} · Speed ${f.speed}${why ? ` · can't recruit: ${why}` : ''}\n     ${abilities(f)}`);
    }
    if (!run.market.length) out.push('Sold out until next month.');
    const offers = run.liaisonOffers ?? [];
    out.push(offers.length
      ? offers.map((offer) => `\nLiaison (${offer.origin}, ${offer.price} Gold): [${offer.id}] ${identity(offer)} · Power ${offer.power} · Speed ${offer.speed} · Stress ${offer.stress} · Morale ${offer.morale} · Injuries: ${injuriesText(offer)}\n     ${abilities(offer)}${offer.record?.length ? `\n     Prison record: ${offer.record.map((c) => `"${c}"`).join(' ')}` : ''}`).join('')
      : maxLevel(run, 'liaison') ? '\nLiaison: no prisoners on offer this month.' : `\nLiaison: build one${run.prestigeLevel >= 2 ? ' in the Estate' : ' (Prestige level 2)'} for cheap monthly prisoners.`);
    const lv = maxLevel(run, 'vulcan');
    out.push(!lv
      ? `\nUnnatural Temple of Vulcan: build it${run.prestigeLevel >= 2 ? ' in the Estate' : ' (Prestige level 2)'} to raise fighters killed in the arena as Revenants.`
      : `\nUnnatural Temple of Vulcan (\`raise <id>\`, ${reanimatePrice(run)} Gold; bodies keep ${plural(effectAt('vulcan', lv), 'week')}${lv < 2 ? '; Revenants come back with 1 less Power' : ''}; their Morale holds at 50):`);
    for (const f of raisable(run)) {
      const why = reanimateBlocker(run, f.id);
      out.push(`  [${f.id}] ${identity(f)} · Power ${f.power} · fell ${plural(run.week - f.diedWeek, 'week')} ago${why ? ` · can't raise: ${why}` : ''}`);
    }
    if (lv && !raisable(run).length) out.push('  No bodies to raise.');
    out.push('\nDecor merchant:');
    for (const [k, d] of Object.entries(DECOR)) out.push(`  ${k} · ${d.name} · ${d.price} Gold (${run.inventory.decor[k]} in storeroom): ${d.effect}`);
    out.push('\nApothecary (single-use fight items, `buy-item <item>`; use one between rounds with `use <item>`):');
    for (const [k, c] of Object.entries(CONSUMABLES)) out.push(`  ${k} · ${c.name} · ${c.price} Gold (${run.inventory.items?.[k] ?? 0} in storeroom): ${c.desc}`);
    out.push('\nArmourer:');
    if (!maxLevel(run, 'armourer')) out.push('  Build an Armourer (Prestige level 2) to buy weapons and armour. Beaten opponents sometimes drop theirs; Bosses always do.');
    else if (!run.armourerStock.length) out.push('  Sold out until next month.');
    else run.armourerStock.forEach((k, i) => out.push(`  #${i} ${GEAR[k].name} · ${slotLabel(GEAR[k].slot)} · ${GEAR[k].price} Gold: ${gearText(GEAR[k])}`));
    return out.join('\n');
  }

  function estateView() {
    const out = [`-- The Estate · ${run.buildings.length}/${plotCount(run)} plots · up to ${levelInfo(run.prestigeLevel).maxFighters} fighters at House level ${run.prestigeLevel} --`];
    for (const b of run.buildings) {
      const def = BUILDINGS[b.type];
      const extra = def.extra ? `; ${def.extra(b.level)}` : '';
      const up = b.level < def.cost.length
        ? `Upgrade to Lv ${b.level + 1} (${def.effect(def.per[b.level])}) for ${def.cost[b.level]} Gold${upgradeBlocker(run, b.id) ? ` · blocked: ${upgradeBlocker(run, b.id)}` : ''}`
        : 'Fully upgraded';
      out.push(`[${b.id}] ${def.name} Lv ${b.level}: ${def.effect(def.per[b.level - 1])}${extra}\n     ${up}`);
    }
    out.push('\nBuild on a free plot:');
    for (const [type, def] of Object.entries(BUILDINGS).filter(([t]) => buildingKnown(run, t))) {
      const why = buildBlocker(run, type);
      out.push(`  ${type} · ${def.name} · ${def.cost[0]} Gold: ${def.effect(def.per[0])}${why ? ` · blocked: ${why}` : ''}`);
    }
    return out.join('\n');
  }

  function storeView() {
    const out = ['-- The Storeroom (everything here belongs to the house) --'];
    out.push('Gear:');
    if (!run.inventory.gear.length) out.push('  No spare gear.');
    run.inventory.gear.forEach((k, i) => out.push(`  #${i} ${GEAR[k].name} · ${slotLabel(GEAR[k].slot)}: ${gearText(GEAR[k])}`));
    const decor = Object.entries(run.inventory.decor).filter(([, n]) => n).map(([k, n]) => `${DECOR[k].name} ×${n}`);
    out.push(`Decor: ${decor.join(', ') || 'none'}`);
    return out.join('\n');
  }

  function codexView(key) {
    if (!key) {
      const { found, total } = progress(codex);
      const out = [`-- The Codex · ${found}/${total} discovered · read one with \`codex <key>\` --`];
      for (const [cat, title] of Object.entries(SECTIONS)) {
        const list = ENTRIES.filter((e) => e.cat === cat);
        const open = list.filter((e) => isUnlocked(codex, e));
        if (list.some((e) => e.hidden) && !open.length) continue; // v6: hidden until something in it is found
        out.push(`${title} (${open.length}/${list.length}): ${open.map((e) => e.key).join(', ') || '—'}`);
      }
      return out.join('\n');
    }
    const e = ENTRIES.find((x) => x.key === key);
    if (!e) return `No Codex entry "${key}". Type \`codex\` for the list.`;
    if (!isUnlocked(codex, e)) return '???: Meet one in the arena to learn more.';
    const lore = e.lore ? (hasLore(codex, e) ? `\nLore: ${e.lore}` : '\nLore: locked (defeat one in the arena to learn its story).') : '';
    return `${e.name}: ${e.rules}${lore}`;
  }

  // ---------- Fights ----------

  const fightTutorial = () => {
    const step = nextStep(FIGHT_STEPS, done, match);
    if (!step) return null;
    done.push(step.id); // the fight overlay is modal, so each fight tip shows once
    const hint = step.id === 'fight-over' ? ' (Here: `math` shows every number in the narration.)' : '';
    return `-- Tip: ${step.title} --\n${plain(step.body)}${hint}`;
  };

  function fightStatus() {
    const bout = boutFor(run, run.matchInfo.tier);
    const lines = [`-- ${bout.name} · ${match.a.f.name} vs ${match.b.f.name} · score ${match.a.roundsWon}–${match.b.roundsWon} (first to two) --`];
    const stats = roundStats(match);
    for (const [label, c, side] of [['You', match.a, 'A'], ['Them', match.b, 'B']]) {
      const off = c.disabled.length ? ` · lost for this match: ${c.disabled.map((s) => slotName(c.f, s)).join(', ')}` : '';
      const mods = stats[side].mods.filter((x) => x.value).map((x) => `${x.value > 0 ? '+' : ''}${x.value} ${x.source}`);
      lines.push(`  ${label}: ${c.f.name} · Round ${stats.round}: Power ${stats[side].power} (${c.f.power} base${mods.length ? `, ${mods.join(', ')}` : ''}) · Speed ${stats[side].speed} · Injuries: ${injuriesText(c.f)}${off}`);
    }
    if (match.debuff) lines.push(`  Arena rule: ${BOSS_DEBUFFS[match.debuff].name}. ${BOSS_DEBUFFS[match.debuff].desc}`);
    if (mortalDanger(match.a)) lines.push(`  MORTAL DANGER: ${match.a.f.name} has ${effectiveInjuries(match.a.f)} injur${effectiveInjuries(match.a.f) === 1 ? 'y' : 'ies'} and can die if they lose the next round. Fighting on: about ${Math.round(deathRisk(match) * 100)}% chance of death this round.`);
    const owned = Object.entries(run.inventory.items ?? {}).filter(([, n]) => n > 0);
    if (!match.over) {
      const h = match.b.f.humor ? HUMORS[match.b.f.humor] : null;
      const last = match.rounds.at(-1);
      lines.push(`  Tactics: ${ROUND_TACTICS.map((k) => `${k} (${TACTICS[k].desc})`).join('; ')}. Press beats Feint, Feint beats Guard, Guard beats Press (+10% win chance).`);
      if (mortalDanger(match.a)) lines.push(`  At the Death Gate you can also go allIn (${TACTICS.allIn.desc}): about ${Math.round(deathRisk(match, 'allIn') * 100)}% chance of death this round.`);
      const hype = hypeOf(match);
      lines.push(`  The crowd: ${hype}/${HYPE.max}. ${match.a.roar ? `The crowd is with ${match.a.f.name}: +${HYPE.favourPower} Power this round.` : `At ${HYPE.favour} the crowd is with your fighter (+${HYPE.favourPower} Power that round).`} Press and drama fill it; Guard drains it.`);
      const tell = opponentTell(match);
      if (tell) lines.push(`  Your Oracle reads a tell: ${match.b.f.name} means to ${TACTICS[tell].name}. Weighing the tell against their temper: about ${tellForecast(match)}% they ${TACTICS[tell].name}.`);
      if (opponentUnleashesNext(match)) lines.push(`  WARNING: ${match.b.f.name} is gathering for ${SIGNATURES[match.b.f.cls].name}: it comes this round.`);
      lines.push(`  ${match.b.f.name} is ${h ? `${h.name}: ${h.tell}` : 'without clear habits'}.${last ? ` Last round they chose ${last.stances.B}.` : ''} Suggested: ${suggestTactic(match)}.`);
      const usable = owned.filter(([k]) => !(match.itemsUsed ?? []).includes(k));
      if (match.itemsUsed?.length) lines.push(`  Items used this fight: ${match.itemsUsed.map((k) => CONSUMABLES[k].name).join(', ')}.`);
      const sig = signatureOf(match.a.f);
      // LLM-12: a signature the fighter can't use (its class ability is off) was offered as usable.
      if (sig) lines.push(match.a.sigRound ? `  Signature move ${sig.name}: ${match.a.sigRound > match.round ? 'ready for the next round' : 'used this fight'}.` : signatureBlocker(match) ? `  Signature move ${sig.name}: can't be used (${signatureBlocker(match)})` : `  Signature move (\`signature\`, once per fight): ${sig.name}. ${sig.desc}`);
      else if (SIGNATURES[match.a.f.cls]) lines.push(`  Signature move ${SIGNATURES[match.a.f.cls].name} unlocks at level ${SIGNATURE.level}.`);
      lines.push(usable.length ? `  Items (one of each kind per fight, \`use <item>\`): ${usable.map(([k, n]) => `${k} ×${n} (${CONSUMABLES[k].desc})`).join('; ')}` : owned.length ? '  No other fight items to use.' : '  No fight items (the Apothecary in the `market` sells them).');
    }
    lines.push(match.round === 0 ? '  `next <tactic>` to begin Round 1 (`next` alone uses the suggestion).' : `  \`next <tactic>\` to fight Round ${match.round + 1}${canThrowTowel(match) ? `, or \`capitulate\` (lose the match${keepsBuyIn(run, run.matchInfo.tier) ? '; the buy-in comes back' : ` and ${bout.buyIn} Prestige buy-in`}; your fighter survives)` : ''}.`);
    const tip = fightTutorial();
    if (tip) lines.push(tip);
    return lines.join('\n');
  }

  function endFight() {
    const out = [resultText(match)];
    const advice = adviceFor(match);
    if (advice) out.push(`Advice: ${advice}`);
    const tip = fightTutorial();
    if (tip) out.push(tip);
    discoverMatch(codex, match);
    const s = finishMatch(run, match);
    match = null;
    if (s.next) out.push(`${s.fighter} wins the ${s.bracket} and is through to the ${s.next}. \`fight ${s.fighterId} ${s.tier}\` to fight on, or \`withdraw ${s.tier}\`.`);
    const purse = purseGold(s);
    const bits = [`${purse >= 0 ? '+' : ''}${purse} Gold`, `${s.prestige >= 0 ? '+' : ''}${s.prestige} Prestige`];
    if (s.bet) bits.push(s.bet.won ? `bet won: ${s.bet.payout} Gold back (+${s.bet.payout - s.bet.stake} profit)` : `bet lost: ${s.bet.stake} Gold`);
    if (s.favor) bits.push(`${s.favor > 0 ? '+' : ''}${s.favor} Favour`);
    if (!s.died) bits.push(`+${s.xp} XP`);
    if (s.renown) bits.push(`${s.renown > 0 ? '+' : ''}${s.renown} Renown`);
    if (s.hype?.hype) bits.push(`the crowd's hype ${s.hype.hype}${s.hype.renown ? `: +${s.hype.renown} Renown` : ''}${s.hype.gold ? `, +${s.hype.gold} Gold` : ''}`);
    if (s.bloodied) bits.push('Bloodied Victory (won with 2+ injuries)');
    if (s.kill) bits.push(`a kill${s.mark ? `: earns the mark ${s.mark}` : ''}`);
    if (s.loot) bits.push(`loot: ${GEAR[s.loot].name}`);
    if (s.title) bits.push(`Title: ${s.title}`);
    if (s.levelUp) bits.push(`House level ${s.levelUp}!`);
    if (s.bloodFaith) bits.push('Blood Faith refunds the buy-in');
    if (s.refund) bits.push('reaching the Boss returned the buy-in');
    out.push(`Result: ${bits.join(' · ')}${s.died ? ` · ${s.fighter} is dead.` : ''}`);
    if (run.mercy) out.push(mercyText());
    return out.join('\n');
  }

  function playNext(tactic) {
    if (!match) throw new Error('No match in progress.');
    if (match.over) throw new Error('The match is over.');
    if (tactic && !TACTICS[tactic]) throw new Error(`Unknown tactic "${tactic}". Choose: ${Object.keys(TACTICS).join(', ')}.`);
    const r = playRound(match, { stance: tactic ?? suggestTactic(match) });
    const narrate = showMath ? narrateRound : narrateStory;
    const out = [`Round ${r.round}:`, ...narrate(match, r).map((l) => `  ${l.text}`)];
    if (match.over) out.push('', endFight(), '', look());
    else out.push('', fightStatus());
    return out.join('\n');
  }

  // ---------- Commands ----------

  const need = (args, n, usage) => {
    if (args.length < n) throw new Error(`Usage: ${usage}`);
  };
  const idle = () => {
    if (match) throw new Error('A match is in progress: `next` or `capitulate`.');
  };

  const commands = {
    help: () => HELP,
    look: () => look(),
    market: () => marketView(),
    estate: () => estateView(),
    store: () => storeView(),
    codex: ([key]) => codexView(key),
    math: () => {
      showMath = !showMath;
      return `Fight narration: ${showMath ? 'every roll' : 'the story'}.`;
    },
    'skip-tutorial': () => {
      done.push(...[...GUIDE, ...STEPS, ...FIGHT_STEPS].map((x) => x.id));
      shownStep = null;
      return 'Tutorial skipped.';
    },
    ok: () => {
      if (guideNow()) return 'The steward is waiting for you to do it (or `skip-tutorial`).';
      const step = nextStep(STEPS, done, run);
      if (!step) return 'No tutorial card to dismiss.';
      done.push(step.id);
      const card = tutorialCard();
      return `Dismissed "${step.title}".${card ? `\n${card}` : ''}`;
    },
    recruit: ([id]) => {
      need([id], 1, 'recruit <id>');
      idle();
      const f = recruit(run, id);
      return `${f.name} joins the Ludus. Gold ${run.gold}.`;
    },
    release: ([id]) => {
      need([id], 1, 'release <id>');
      idle();
      release(run, id);
      return run.log.at(-1).text;
    },
    job: ([id, job]) => {
      need([id, job].filter(Boolean), 2, 'job <id> <rest|trainPower|trainSpeed|medbay>');
      setJob(run, id, job);
      return `${run.roster.find((f) => f.id === id).name}'s job: ${job}.`;
    },
    raise: ([id]) => {
      need([id].filter(Boolean), 1, 'raise <id>');
      const f = reanimate(run, id);
      return `${f.name} rises from the forge as a Revenant [${f.id}]: ${TRAITS[f.kindTrait].name} (${TRAITS[f.kindTrait].desc}) Power ${f.power}.`;
    },
    rite: ([id]) => {
      idle();
      rite(run, id);
      return `${run.log.at(-1).text}\n\n${look()}`;
    },
    pray: ([id]) => {
      pray(run, id);
      const f = run.roster.find((x) => x.id === id);
      return `Fortuna answers. ${f.name}'s new choices: ${f.pendingPerks[0].map((p) => `${p} (${PERKS[p].name})`).join(', ')}.`;
    },
    spar: ([a, b]) => {
      const r = exhibition(run, a, b);
      return `Exhibition: ${r.winner} beats ${r.loser}. +${r.gold} Gold${r.wound ? `; ${r.loser} takes a Flesh Wound` : ''}.`;
    },
    perk: ([id, perk]) => {
      need([id, perk].filter(Boolean), 2, 'perk <id> <perk>');
      choosePerk(run, id, perk);
      return run.log.at(-1).text;
    },
    story: ([id]) => {
      need([id].filter(Boolean), 1, 'story <id>');
      const f = run.roster.find((x) => x.id === id) ?? run.fallen.find((x) => x.id === id);
      if (!f) throw new Error('No such fighter.');
      return [`-- The story of ${f.name} --`, ...(f.story ?? []).map((e) => `  ${formatDate(e.week)}: ${e.text}`)].join('\n');
    },
    treat: ([id, i]) => {
      need([id, i].filter(Boolean), 2, 'treat <id> <injury#>');
      treatFirst(run, id, Number(i));
      const f = run.roster.find((x) => x.id === id);
      return `The Medbay will treat ${f.name}'s ${injuryName(f.injuries[0].tag)} first.`;
    },
    augment: ([id, i = '0']) => {
      need([id].filter(Boolean), 1, 'augment <id> <injury#>');
      augment(run, id, Number(i));
      return `${run.log.at(-1).text} Gold ${run.gold}.`;
    },
    retire: ([id]) => {
      need([id].filter(Boolean), 1, 'retire <id>');
      retire(run, id);
      return run.log.at(-1).text;
    },
    surgeon: ([id, i = '0']) => {
      need([id].filter(Boolean), 1, 'surgeon <id> <injury#>');
      const price = surgeonPrice(run);
      const tag = run.roster.find((f) => f.id === id)?.injuries[Number(i)]?.tag;
      surgeon(run, id, Number(i));
      return `The Emergency Surgeon heals the ${injuryName(tag)} for ${price} Gold. Gold ${run.gold}.`;
    },
    'buy-item': ([item]) => {
      need([item].filter(Boolean), 1, 'buy-item <item>');
      idle();
      buyItem(run, item);
      return `Bought ${CONSUMABLES[item].name}. You have ${run.inventory.items[item]}. ${CONSUMABLES[item].desc}`;
    },
    bet: ([amount]) => {
      need([amount].filter(Boolean), 1, 'bet <gold>');
      if (!match) throw new Error('Bets are placed during a match, before Round 1.');
      const b = placeBet(run, match, Number(amount));
      return `You bet ${b.stake} Gold on ${match.a.f.name} at ×${b.odds.toFixed(2)}: a win returns ${b.payout} Gold (+${b.payout - b.stake}).`;
    },
    host: () => {
      const gain = host(run);
      return `The Senate dines with you: +${gain} Influence (now ${run.influence}).`;
    },
    enact: ([id]) => {
      need([id].filter(Boolean), 1, 'enact <policy>');
      enact(run, id);
      return `${LOUNGE.policies[id].name} is in force for ${LOUNGE.weeks} weeks: ${LOUNGE.policies[id].desc}`;
    },
    lounge: () => {
      if (!maxLevel(run, 'lounge')) return 'Build the Patron Lounge (Prestige level 3) to host the Senate and pass policies.';
      return [`-- Patron Lounge · Influence ${run.influence ?? 0} · host for ${hostPrice(run)} Gold${hostBlocker(run) ? ` (can't now: ${hostBlocker(run)})` : ''} --`,
        ...activePolicies(run).map((p) => `IN FORCE: ${LOUNGE.policies[p.id].name} (${p.until - run.week} weeks left)`),
        ...Object.entries(LOUNGE.policies).map(([id, p]) => `  ${id} · ${p.name} · ${p.cost} Influence · ${p.lean}: ${p.desc}${enactBlocker(run, id) ? ` (can't: ${enactBlocker(run, id)})` : ''}`)].join('\n');
    },
    use: ([item]) => {
      need([item].filter(Boolean), 1, 'use <item>');
      if (!match) throw new Error('Items are used during a match, before Round 1 or between rounds.');
      useItem(run, match, item);
      return `${match.a.f.name} uses ${CONSUMABLES[item].name}: ${CONSUMABLES[item].desc}`;
    },
    'buy-decor': ([item]) => {
      need([item].filter(Boolean), 1, 'buy-decor <item>');
      buyDecor(run, item);
      return `Bought a ${DECOR[item].name} for the storeroom. Gold ${run.gold}.`;
    },
    place: ([id, item]) => {
      need([id, item].filter(Boolean), 2, 'place <id> <item>');
      assignDecor(run, id, item);
      const f = run.roster.find((x) => x.id === id);
      return `${DECOR[item].name} placed in ${f.name}'s room. Morale heading to ${moraleTarget(run, f).target}.`;
    },
    remove: ([id, item]) => {
      need([id, item].filter(Boolean), 2, 'remove <id> <item>');
      removeDecor(run, id, item);
      return `${DECOR[item].name} returned to the storeroom.`;
    },
    'buy-gear': ([i]) => {
      need([i].filter(Boolean), 1, 'buy-gear <stock#>');
      const key = buyGear(run, Number(i));
      return `Bought a ${GEAR[key].name}: storeroom #${run.inventory.gear.length - 1}. Gold ${run.gold}.`;
    },
    equip: ([id, i]) => {
      need([id, i].filter(Boolean), 2, 'equip <id> <storeroom#>');
      const key = run.inventory.gear[Number(i)];
      equip(run, id, Number(i));
      const left = run.inventory.gear.map((k, n) => `#${n} ${GEAR[k].name}`).join(', ') || 'empty';
      return `${run.roster.find((f) => f.id === id).name} equips the ${GEAR[key].name}. Storeroom now (numbers changed): ${left}.`;
    },
    'sell-gear': ([i]) => {
      need([i].filter(Boolean), 1, 'sell-gear <storeroom#>');
      const key = run.inventory.gear[Number(i)];
      const gold = sellGear(run, Number(i));
      return `Sold the ${GEAR[key].name} for ${gold} Gold. Gold ${run.gold}.`;
    },
    unequip: ([id, slot]) => {
      need([id, slot].filter(Boolean), 2, 'unequip <id> <weapon|armour>');
      unequip(run, id, slot);
      return 'Returned to the storeroom.';
    },
    build: ([type]) => {
      need([type].filter(Boolean), 1, 'build <type>');
      const b = build(run, type);
      return `Built: ${BUILDINGS[type].name} [${b.id}]. Gold ${run.gold}.`;
    },
    upgrade: ([id]) => {
      need([id].filter(Boolean), 1, 'upgrade <buildingId>');
      const b = upgrade(run, id);
      return `${BUILDINGS[b.type].name} is now level ${b.level}. Gold ${run.gold}.`;
    },
    fight: ([id, tier]) => {
      need([id].filter(Boolean), 1, 'fight <id> [tier]');
      idle();
      const t = tier ? Number(tier) : run.topTier;
      match = startMatch(run, id, t);
      const pre = match.preMatch.map((p) => `${match.a.f.name} is overtrained and loses ${p.disabled.map((s) => slotName(match.a.f, s)).join(', ') || 'focus'} for this match.`);
      return [`${match.a.f.name} walks into ${arenaName(t)} to face ${match.b.f.name}. The crowd roars.`, ...pre, fightStatus()].join('\n');
    },
    next: ([tactic]) => playNext(tactic),
    towel: () => {
      if (!match) throw new Error('No match in progress.');
      throwTowel(match);
      return ['You capitulate.', '', endFight(), '', look()].join('\n');
    },
    capitulate: (...args) => commands.towel(...args),
    signature: () => {
      if (!match) throw new Error('Signature moves are used during a match.');
      useSignature(match);
      const sig = signatureOf(match.a.f);
      return `${match.a.f.name} readies ${sig.name} for Round ${match.round + 1}: ${sig.desc}`;
    },
    spare: () => {
      const v = resolveMercy(run, 'spare');
      const gains = [v.favor && `+${v.favor} Favour`, v.renown && `+${v.renown} Renown`, v.morale && `+${v.morale} Morale`].filter(Boolean);
      return `Thumbs up.${gains.length ? ` ${gains.join(', ')}.` : ''}${v.crowd === 'spare' ? ' The crowd roars its approval.' : ''}${v.owed ? ` ${v.owed}` : ''}\n\n${look()}`;
    },
    kill: () => {
      const v = resolveMercy(run, 'kill');
      return `Thumbs down. +${v.renown} Renown${v.morale ? `, +${v.morale} Morale` : ''}${v.mark ? `, earns the mark ${v.mark}` : ''}.${v.feud ? ` ${v.feud}` : ''}${v.crowd === 'kill' ? ' The crowd roars its approval.' : ''}\n\n${look()}`;
    },
    quests: () => {
      const task = stewardTask(run);
      const lines = ['-- Quests --'];
      if (task) lines.push(`  The steward asks: ${task.goal}${stewardRewardText(task) ? ` (${stewardRewardText(task)})` : ''}.`);
      for (const f of run.roster.filter((x) => x.want)) lines.push(`  ${f.name} [${f.id}] wants: ${WANTS[f.want.id].goal(f.want)}${f.want.until != null ? ` (${Math.max(0, f.want.until - run.week)} weeks left)` : ''}.`);
      for (const q of run.quests?.rebel ?? []) lines.push(`  The cause asks: ${REBEL_QUESTS[q.id].goal(q)} (${Math.max(0, q.until - run.week)} weeks left).`);
      const rising = risingProgress(run);
      if (rising) lines.push(`  Whispering Gallery: suspicion ${rising.suspicion}/100 (watched at ${rising.watch}, informers at ${rising.informer}, raid at ${rising.raid}); the rising: ${rising.label}${rising.needs.length ? `, still needs ${rising.needs.join(', ')}` : ''}${rising.waiting ? `; ${rising.waiting}` : ''}.`);
      const c = run.rivalChampion;
      const arch = archrival(run);
      if (arch) lines.push(`  Your rival house: ${arch.name} (Glory ${arch.glory})${c ? `, champion ${c.f.name} (${c.wins} wins and ${c.losses} losses against you)` : ''}.`);
      return lines.length > 1 ? lines.join('\n') : '-- Quests --\n  Nothing asked of you yet.';
    },
    houses: () => [`-- The houses (Glory: a win is worth its arena tier, ×3 for a Boss; year-end purse ${HOUSES.yearPurse.map((g) => g * dateOf(run.week).year).join('/')} Gold by place) --`, ...standings(run).map((h, i) => `  ${i + 1}. ${h.name}${h.you ? ' (you)' : ''} · ${arenaName(Math.min(h.tier, 4))} · Glory ${h.glory}${h.feud ? ` · feud ${h.feud} months` : ''}${h.vengeance ? ` · vengeance ${h.vengeance} months` : ''}`)].join('\n'),
    withdraw: ([tier]) => {
      need([tier].filter(Boolean), 1, 'withdraw <tier>');
      idle();
      const s = withdraw(run, Number(tier));
      return `${s.fighter} withdraws from ${s.name}. It counts as capitulating.\n\n${look()}`;
    },
    choose: ([i]) => {
      need([i].filter(Boolean), 1, 'choose <number>');
      idle();
      return `${chooseEvent(run, Number(i))}\n\n${look()}`;
    },
    fortune: ([i, drop]) => {
      need([i].filter(Boolean), 1, 'fortune <number> [relic to lay down]');
      idle();
      chooseFortune(run, Number(i), drop ?? null);
      return `${run.log.at(-1).text}\n\n${look()}`;
    },
    spin: () => {
      idle();
      rerollFortune(run);
      return look();
    },
    pass: () => {
      idle();
      passFortune(run);
      return `${run.log.at(-1).text}\n\n${look()}`;
    },
    relics: () => (run.relics?.length ? run.relics.map((id) => `${RELICS[id].name} (${RELICS[id].rarity}): ${RELICS[id].desc}`).join('\n') : 'The house holds no relics yet. One may come with Fortune at the start of a month.'),
    summons: ([id, order]) => {
      need([id, order].filter(Boolean), 2, 'summons <id> <yield|death>');
      idle();
      answerSummons(run, id, order);
      return `${run.log.at(-1).text}\n\n${look()}`;
    },
    'refuse-summons': () => {
      idle();
      refuseSummons(run);
      return `${run.log.at(-1).text}\n\n${look()}`;
    },
    'pay-tribute': () => {
      idle();
      payTribute(run);
      return `${run.log.at(-1).text}\n\n${look()}`;
    },
    skip: () => {
      idle();
      skipBout(run);
      return `${run.log.at(-1).text}\n\n${look()}`;
    },
    forfeit: () => {
      idle();
      forfeitBout(run);
      return look();
    },
    'end-week': () => {
      idle();
      advanceWeek(run);
      return look();
    },
    'to-tournament': () => {
      idle();
      const weeks = advanceToTournament(run);
      if (!weeks) throw new Error(advanceBlocker(run) ?? 'Already at a tournament.');
      return `${plural(weeks, 'week')} ${weeks === 1 ? 'passes' : 'pass'}.\n\n${look()}`;
    },
  };

  // Runs one command and returns its output. Every command, even an invalid one, also unlocks Codex entries in view.
  function exec(line, { quiet: q = false } = {}) {
    quiet = q;
    const [cmd, ...args] = line.trim().split(/\s+/);
    if (!cmd) return '';
    const handler = commands[cmd];
    let out;
    if (!handler) out = `Unknown command "${cmd}". Type \`help\`.`;
    else {
      try {
        out = handler(args);
      } catch (err) {
        out = `Can't do that: ${err.message}`;
      }
    }
    checkQuests(run); // as the page does after every game action (playtest LLM-11: quests waited for end-week)
    const fresh = discover(codex, run);
    if (fresh.length) out += `\n(New in the Codex: ${fresh.join(', ')})`;
    const step = currentStep();
    if ((step?.id ?? null) !== shownStep) {
      const card = tutorialCard();
      if (card) out += `\n${card}`;
    }
    return out;
  }

  const intro = () => {
    discover(codex, run);
    return `${INTRO.map((p) => `== ${p.title} ==\n${plain(p.body)}`).join('\n\n')}\n\n${HELP}\n\n${look()}\n\n${marketView()}`;
  };

  return { run, codex, exec, look, intro, get match() { return match; } };
}

// ---------- CLI ----------

async function main() {
  const argv = process.argv.slice(2);
  const opt = (name, fallback) => {
    const i = argv.indexOf(name);
    return i >= 0 ? Number(argv[i + 1]) : fallback;
  };
  const dailyAt = argv.indexOf('--daily');
  const day = dailyAt >= 0 ? argv[dailyAt + 1] : null;
  const str = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
  // Version 6: a season by default, as in the game (--long for the Long Road); --legacy plays with every Legacy unlock.
  // --legacy also brings a sample Hall of two retired legends, so legend cards can be dealt (LLM-13: they never could be).
  const hall = [
    { seed: 1, id: 'h1', name: 'Gaius the Elder', kind: 'human', cls: 'retiarius', humor: 'phlegmatic', titles: ['Champion of the Bronze Arena'], kills: 3, renown: 9, wins: 14 },
    { seed: 2, id: 'h2', name: 'Velia Ironhand', kind: 'orc', cls: 'cestus', humor: 'choleric', titles: ['Champion of the Dirt Pits', 'Champion of the Silver Coliseum'], kills: 6, renown: 12, wins: 19 },
  ];
  const setup = { short: !argv.includes('--long'), heat: opt('--heat', 0), patron: str('--patron'), ...(argv.includes('--legacy') ? { unlocks: ALL_UNLOCKS, legends: hall } : {}) };
  const session = day ? createSession(dailySeed(day), { setup: dailySetup(day) }) : createSession(opt('--seed', 1), { setup });
  const last = opt('--last', Infinity);
  const lines = [];
  for await (const line of createInterface({ input: process.stdin })) {
    if (line.trim() && !line.trim().startsWith('#')) lines.push(line.trim());
  }
  if (last === Infinity) console.log(session.intro());
  lines.forEach((line, i) => {
    const shown = i >= lines.length - last;
    const out = session.exec(line, { quiet: !shown });
    if (shown) console.log(`\n> ${line}\n${out}`);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
