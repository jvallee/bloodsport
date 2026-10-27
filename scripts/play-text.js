// Text interface to a Bloodsport career: drives the pure modules in src/ with no DOM, one command per line.
// Usage: node scripts/play-text.js [--seed N] [--last N] < commands.txt
//   --seed N  career seed (default 1). Careers replay exactly, so a player can append commands and re-run.
//   --last N  print only the output of the last N commands (earlier ones still run, unrendered).
// Type `help` for the command list.

import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';
import { STRESS, KINDS, TRAITS, CLASSES, WEAPONS, INJURY_BY_TAG, DECOR, PERKS, GEAR, XP, BUILDINGS, BOSS_DEBUFFS, ECONOMY, FAVOR, PRESTIGE_LEVELS, CONSUMABLES, TACTICS, HUMORS } from '../src/data.js';
import { fighterWarnings, arenaStakes, roundStats } from '../src/explain.js';
import { nextHint } from '../src/hints.js';
import { EVENT_BY_ID, choiceLabel } from '../src/events.js';
import { playRound, throwTowel, mortalDanger, canThrowTowel, effectiveInjuries, suggestTactic } from '../src/fight.js';
import {
  createRun, boutFor, unlockedTiers, arenaName, marketPrice, circuitInfo, recruit, release, setJob, advanceWeek, advanceToTournament,
  advanceBlocker, buyItem, useItem, buyDecor, assignDecor, removeDecor, buyGear, equip, unequip, surgeon, surgeonPrice, choosePerk, moraleTarget, moraleState,
  startMatch, finishMatch, skipBout, forfeitBout, tributeDue, tributePaid, payTribute, sellGear, chooseEvent, eventChoiceBlocker, eventNames, recruitBlocker, fightBlocker, GRAND_TIER,
  matchOptions,
  bossLossFavor,
} from '../src/run.js';
import { build, upgrade, buildBlocker, upgradeBlocker, plotCount, rosterCap, trainCap, trainCost, oracleLevel, maxLevel, levelInfo } from '../src/ludus.js';
import { formatDate, weeksUntilTournament, weeksUntilWinter, isWinter } from '../src/calendar.js';
import { estimateOdds, describeOdds } from '../src/odds.js';
import { narrateStory, narrateRound, resultText, adviceFor, classAbility, slotName } from '../src/narrate.js';
import { INTRO, STEPS, FIGHT_STEPS, nextStep } from '../src/tutorial.js';
import { ENTRIES, SECTIONS, createCodex, discover, discoverMatch, isUnlocked, hasLore, progress, gearText } from '../src/codex.js';

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
  codex [key]                   list unlocked Codex entries, or read one (e.g. codex basics:favor)
  ok                            dismiss the current tutorial card
  recruit <id> | release <id>
  job <id> <rest|trainPower|trainSpeed|medbay>
  perk <id> <perk>              choose a level-up perk
  surgeon <id> <injury#>        Emergency Surgeon: heal one injury now (injury# from 0)
  buy-decor <bird|fireBrazier|trophy>
  buy-item <warPaint|adrenaline|blessedBandage|crowdBribe>   single-use fight items
  use <item>                    during a fight, between rounds: use one item (one per fight)
  place <id> <item> | remove <id> <item>      put decor in a fighter's room, or take it back
  buy-gear <stock#> | equip <id> <storeroom#> | unequip <id> <weapon|armor> | sell-gear <storeroom#> (half price)
  build <type> | upgrade <buildingId>         types: ${Object.keys(BUILDINGS).join(', ')}
  fight <id> [tier]             send a fighter to an arena on tournament week (default: your top arena)
  pay-tribute                   pay this year's tribute early
  choose <n>                    decide this week's event (the week can't end until you do)
  skip | forfeit                skip your top arena's Tournament 1/2, or forfeit its Boss
  next [tactic] | capitulate    during a fight: play the next round with a tactic (steady, press, guard, feint; default: the suggestion), or capitulate ("towel" also works)
  math                          toggle the round-by-round math in fight narration
  end-week | to-tournament      run one week of jobs, or keep ending weeks until the next tournament`;

export function createSession(seed = 1, { oddsSamples = 400 } = {}) {
  const run = createRun(seed);
  const codex = createCodex();
  const done = []; // dismissed tutorial steps
  const oddsCache = new Map();
  let match = null;
  let showMath = false;
  let quiet = false; // replaying unshown commands: skip the (slow) odds simulations
  let shownStep = null; // the tutorial card the player last saw, so a new one is announced when it appears

  function tutorialCard() {
    const step = run.status === 'active' ? nextStep(STEPS, done, run) : null;
    shownStep = step?.id ?? null;
    return step ? `-- Tutorial: ${step.title} (\`ok\` to dismiss) --\n${plain(step.body)}` : '';
  }

  // ---------- Views ----------

  function oddsFor(f, tier) {
    const bout = boutFor(run, tier);
    const opp = run.arenas[tier].opponent;
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
    return [trait, f.cls ? `${classAbility(f)}: ${desc}` : null].filter(Boolean).join(' | ');
  }

  function extras(f) {
    const bits = [];
    if (f.titles.length) bits.push(`Titles: ${f.titles.join(', ')} (+1 Power each)`);
    if (f.perks.length) bits.push(`Perks: ${f.perks.map((p) => PERKS[p].name).join(', ')}`);
    const gear = ['weapon', 'armor'].filter((s) => f.gear[s]).map((s) => `${GEAR[f.gear[s]].name} (${gearText(GEAR[f.gear[s]])})`);
    if (gear.length) bits.push(`Gear: ${gear.join('; ')}`);
    const decor = Object.entries(f.decor).filter(([, n]) => n).map(([k, n]) => `${DECOR[k].name} ×${n}${DECOR[k].helps(f) ? '' : ' (comfort only)'}`);
    if (decor.length) bits.push(`Decor: ${decor.join(', ')}`);
    return bits;
  }

  const injuriesText = (f) => (f.injuries.length
    ? f.injuries.map((i, n) => `#${n} ${injuryName(i.tag)}${i.weight > 1 ? ` ×${i.weight}` : ''}${i.weeksLeft ? ` (${i.weeksLeft}w to heal)` : ''}`).join(', ')
    : 'none');

  function fighterBlock(f) {
    const { target } = moraleTarget(run, f);
    const gate = effectiveInjuries(f);
    const nextXp = XP.levels[f.level - 1];
    const lines = [
      `[${f.id}] ${identity(f)} (XP ${f.xp}${nextXp ? `/${nextXp}` : ', max level'})`,
      `     Power ${f.power} · Speed ${f.speed} · Stress ${f.stress}${f.stress >= STRESS.overtrained ? ' OVERTRAINED' : ''} · Morale ${f.morale} ${moraleState(f).label} (heading to ${target}) · Renown ${f.renown}`,
      `     Job: ${f.job} · trained ${f.trained}/${trainCap(run)} · Injuries: ${injuriesText(f)} · Death Gate ${Math.min(gate, 2)}/2${gate >= 2 ? ' OPEN' : ''}`,
      `     ${abilities(f)}`,
      ...extras(f).map((x) => `     ${x}`),
    ];
    f.pendingPerks.forEach((offer, i) => {
      const opts = offer.map((p) => `${p} (${PERKS[p].name}: ${PERKS[p].desc})`).join(' | ');
      lines.push(`     ${i ? 'Then' : 'LEVEL UP! Choose with `perk ' + f.id + ' <perk>`'}: ${opts}`);
    });
    return lines.join('\n');
  }

  function opponentBlock(f) {
    const bits = [`Power ${f.power}`, `Speed ${f.speed}`, `Renown ${f.renown}`, ...extras(f)];
    return [`     Opponent: ${identity(f)}${f.rival ? ' · RIVAL (beat you before, now stronger)' : ''}`, `       ${bits.join(' · ')}`, `       ${abilities(f)}`].join('\n');
  }

  function arenaBlock(tier) {
    const bout = boutFor(run, tier);
    const arena = run.arenas[tier];
    const state = run.status === 'active' ? run.bouts?.[tier] : null;
    const name = state === 'done' ? `${arenaName(tier)} · settled this week · next month: ${bout.name.split(' · ')[1] ?? bout.name}` : `${bout.name}${state ? ' · OPEN this week' : ''}`;
    const lines = [`${name} · tier ${tier}${bout.top ? ' (your top arena)' : ' (lower arena)'}`];
    lines.push(`     Buy-in ${bout.buyIn} Prestige · Win: +${bout.winGold} Gold, +${bout.winPrestige} Prestige · Loss: +${bout.lossGold} Gold`);
    const stakes = arenaStakes(run, tier);
    if (stakes) lines.push(`     ${stakes}`);
    const ruleId = bout.boss ? bout.debuff : bout.top && oracleLevel(run) >= 2 && tier > 1 ? arena.debuff : null;
    if (ruleId) lines.push(`     ${bout.boss ? 'Boss arena rule' : 'The Oracle foresees the Boss arena rule'}: ${BOSS_DEBUFFS[ruleId].name}. ${BOSS_DEBUFFS[ruleId].desc}`);
    else if (bout.boss && tier === 1) lines.push('     This first Boss fights without an arena rule.');
    lines.push(opponentBlock(arena.opponent));
    if (state === 'done' || quiet || run.status !== 'active') return lines.join('\n');
    for (const f of run.roster) {
      const o = describeOdds(oddsFor(f, tier), oracleLevel(run));
      const pct = (p) => (p ? ` ${p}` : '');
      const warn = fighterWarnings(run, f, tier).map((w) => w.text);
      const blocker = state === 'open' ? fightBlocker(run, f.id, tier) : null;
      lines.push(`     ${f.name} [${f.id}]: match ${o.win}${pct(o.winPct)} · Injury ${o.injury}${pct(o.injuryPct)} · Death ${o.death}${pct(o.deathPct)}${warn.length ? ` · ${warn.join(', ')}` : ''}${blocker ? ` · can't fight: ${blocker}` : ''}`);
    }
    if (bout.top && run.boutPending) lines.push(`     ${bout.boss ? `Bosses can't be skipped: fight or \`forfeit\` (${bossLossFavor(tier) + FAVOR.forfeitExtra} Favor).` : `Or \`skip\` (+${ECONOMY.skipGold} Gold, the roster rests).`}`);
    return lines.join('\n');
  }

  function header() {
    const next = PRESTIGE_LEVELS[run.prestigeLevel];
    const due = tributeDue(run);
    const toTribute = weeksUntilWinter(run.week);
    const tribute = tributePaid(run) ? 'Tribute paid for this year' : toTribute > 0 ? `Tribute ${due} Gold due at the start of winter (in ${plural(toTribute, 'week')})${toTribute <= 4 && run.gold < due ? ` · SHORT by ${due - run.gold}: unpaid tribute takes all your Gold and ${-FAVOR.unpaidTribute} Favor` : ''} (\`pay-tribute\` to pay early)` : 'Tribute collected for this year';
    const when = run.boutPending ? 'TOURNAMENT WEEK: settle your top arena before ending the week.'
      : run.bouts ? 'Your top arena is settled. Send fighters to other open arenas, or end the week.'
        : `${isWinter(run.week) ? 'Winter Dead Season: no tournaments. ' : ''}Next tournament in ${plural(weeksUntilTournament(run.week), 'week')}.`;
    return [
      `=== ${formatDate(run.week)} ===`,
      `Gold ${run.gold} · Prestige ${run.prestige} (House level ${run.prestigeLevel}${next ? `, level ${next.level} at ${next.at}` : ''}) · Imperial Favor ${run.favor}/${FAVOR.max}${run.favor <= FAVOR.warning ? ' (DANGER)' : ''}`,
      tribute,
      when,
    ].join('\n');
  }

  function look() {
    if (match) return fightStatus();
    const out = [header()];
    if (run.status !== 'active') {
      const fought = run.history.filter((h) => !h.skipped && !h.forfeit);
      out.push(`\n*** CAREER OVER: ${run.endReason} ***\nSurvived ${plural(run.week, 'week')} · ${fought.filter((h) => h.won).length} wins, ${fought.filter((h) => !h.won).length} losses · top arena: ${arenaName(run.topTier)} · fallen: ${run.fallen.map((f) => f.name).join(', ') || 'none'}`);
    }
    if (run.event) {
      const e = EVENT_BY_ID[run.event.id];
      const names = eventNames(run);
      out.push(`\n*** EVENT: ${e.title} ***\n${e.text(names)}\n${e.choices.map((c, i) => `  choose ${i}: ${choiceLabel(c, names)}${eventChoiceBlocker(run, i) ? ` (can't: ${eventChoiceBlocker(run, i)})` : ''}`).join('\n')}`);
    }
    out.push(`\n-- Your gladiators ${run.roster.length}/${rosterCap(run)} · training costs ${trainCost(run)} Gold a week --`);
    out.push(run.roster.length ? run.roster.map(fighterBlock).join('\n') : '(none: `market` to see who is for sale)');
    if (run.fallen.length) out.push(`Fallen: ${run.fallen.map((f) => f.name).join(', ')}`);
    out.push(`\n-- ${run.bouts ? 'Fight day' : 'Next bouts'} --`);
    out.push(unlockedTiers(run).sort((a, b) => b - a).map(arenaBlock).join('\n'));
    if (!oracleLevel(run)) out.push('(Build an Oracle to see exact percentages.)');
    out.push(`\nMarket: ${run.market.length} fighters at ${marketPrice(run)} Gold${run.liaisonOffer ? ', plus a Liaison offer' : ''} · Estate: ${run.buildings.length}/${plotCount(run)} plots · Storeroom: ${run.inventory.gear.length} gear`);
    const hint = nextHint(run);
    if (hint) out.push(`\nNext: ${textHint(hint.text)}`);
    const card = tutorialCard();
    if (card) out.push(`\n${card}`);
    out.push(`\n-- House log --\n${run.log.slice(-8).map((l) => `  ${l.text}`).join('\n')}`);
    const blocked = advanceBlocker(run);
    if (blocked && run.status === 'active' && !run.boutPending) out.push(`(Can't end the week: ${blocked})`);
    return out.join('\n');
  }

  function marketView() {
    const out = [`-- Market · ${circuitInfo(run).name} · ${marketPrice(run)} Gold each · roster ${run.roster.length}/${rosterCap(run)} --`];
    out.push('New fighters arrive at the start of every month, stronger as you climb the tiers.');
    for (const f of run.market) {
      const why = recruitBlocker(run, f.id);
      out.push(`[${f.id}] ${identity(f)} · Power ${f.power} · Speed ${f.speed}${why ? ` · can't recruit: ${why}` : ''}\n     ${abilities(f)}`);
    }
    if (!run.market.length) out.push('Sold out until next month.');
    const offer = run.liaisonOffer;
    out.push(offer
      ? `\nLiaison (${offer.origin}, ${offer.price} Gold): [${offer.id}] ${identity(offer)} · Power ${offer.power} · Speed ${offer.speed} · Stress ${offer.stress} · Morale ${offer.morale} · Injuries: ${injuriesText(offer)}\n     ${abilities(offer)}`
      : maxLevel(run, 'liaison') ? '\nLiaison: no prisoner on offer this month.' : `\nLiaison: build one${run.prestigeLevel >= 2 ? ' in the Estate' : ' (Prestige level 2)'} for a cheap monthly prisoner.`);
    out.push('\nDecor merchant:');
    for (const [k, d] of Object.entries(DECOR)) out.push(`  ${k} · ${d.name} · ${d.price} Gold (${run.inventory.decor[k]} in storeroom): ${d.effect}`);
    out.push('\nApothecary (single-use fight items, `buy-item <item>`; use one between rounds with `use <item>`):');
    for (const [k, c] of Object.entries(CONSUMABLES)) out.push(`  ${k} · ${c.name} · ${c.price} Gold (${run.inventory.items?.[k] ?? 0} in storeroom): ${c.desc}`);
    out.push('\nArmourer:');
    if (!maxLevel(run, 'armourer')) out.push('  Build an Armourer (Prestige level 2) to buy weapons and armor. Beaten opponents sometimes drop theirs; Bosses always do.');
    else if (!run.armourerStock.length) out.push('  Sold out until next month.');
    else run.armourerStock.forEach((k, i) => out.push(`  #${i} ${GEAR[k].name} · ${GEAR[k].slot} · ${GEAR[k].price} Gold: ${gearText(GEAR[k])}`));
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
    for (const [type, def] of Object.entries(BUILDINGS)) {
      const why = buildBlocker(run, type);
      out.push(`  ${type} · ${def.name} · ${def.cost[0]} Gold: ${def.effect(def.per[0])}${why ? ` · blocked: ${why}` : ''}`);
    }
    return out.join('\n');
  }

  function storeView() {
    const out = ['-- The Storeroom (everything here belongs to the house) --'];
    out.push('Gear:');
    if (!run.inventory.gear.length) out.push('  No spare gear.');
    run.inventory.gear.forEach((k, i) => out.push(`  #${i} ${GEAR[k].name} · ${GEAR[k].slot}: ${gearText(GEAR[k])}`));
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
      lines.push(`  ${label}: ${c.f.name} · Round ${stats.round}: Power ${stats[side].power} · Speed ${stats[side].speed} (everything applied) · Injuries: ${injuriesText(c.f)}${off}`);
    }
    if (match.debuff) lines.push(`  Arena rule: ${BOSS_DEBUFFS[match.debuff].name}. ${BOSS_DEBUFFS[match.debuff].desc}`);
    if (mortalDanger(match.a)) lines.push(`  MORTAL DANGER: ${match.a.f.name} has ${effectiveInjuries(match.a.f)} injuries and can die if they lose the next round.`);
    const owned = Object.entries(run.inventory.items ?? {}).filter(([, n]) => n > 0);
    if (!match.over) {
      const h = match.b.f.humor ? HUMORS[match.b.f.humor] : null;
      const last = match.rounds.at(-1);
      lines.push(`  Tactics: ${Object.entries(TACTICS).map(([k, t]) => `${k} (${t.desc})`).join('; ')}. Press beats Feint, Feint beats Guard, Guard beats Press (+10% win chance).`);
      lines.push(`  ${match.b.f.name} is ${h ? `${h.name}: ${h.tell}` : 'without clear habits'}.${last ? ` Last round they chose ${last.stances.B}.` : ''} Suggested: ${suggestTactic(match)}.`);
      lines.push(match.itemUsed ? `  Item used this fight: ${CONSUMABLES[match.itemUsed].name}.` : owned.length ? `  Items (one per fight, \`use <item>\`): ${owned.map(([k, n]) => `${k} ×${n} (${CONSUMABLES[k].desc})`).join('; ')}` : '  No fight items (the Apothecary in the `market` sells them).');
    }
    lines.push(match.round === 0 ? '  `next <tactic>` to begin Round 1 (`next` alone uses the suggestion).' : `  \`next <tactic>\` to fight Round ${match.round + 1}${canThrowTowel(match) ? `, or \`capitulate\` (lose the match and ${bout.buyIn} Prestige buy-in; your fighter survives)` : ''}.`);
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
    const bits = [`${s.gold >= 0 ? '+' : ''}${s.gold} Gold`, `${s.prestige >= 0 ? '+' : ''}${s.prestige} Prestige`];
    if (s.favor) bits.push(`${s.favor > 0 ? '+' : ''}${s.favor} Favor`);
    if (!s.died) bits.push(`+${s.xp} XP`);
    if (s.renown) bits.push(`${s.renown > 0 ? '+' : ''}${s.renown} Renown`);
    if (s.bloodied) bits.push('Bloodied Victory (won with 2+ injuries)');
    if (s.kill) bits.push(`a kill${s.mark ? `: earns the mark ${s.mark}` : ''}`);
    if (s.loot) bits.push(`loot: ${GEAR[s.loot].name}`);
    if (s.title) bits.push(`Title: ${s.title}`);
    if (s.levelUp) bits.push(`House level ${s.levelUp}!`);
    if (s.bloodFaith) bits.push('Blood Faith refunds the buy-in');
    out.push(`Result: ${bits.join(' · ')}${s.died ? ` · ${s.fighter} is dead.` : ''}`);
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
    ok: () => {
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
    perk: ([id, perk]) => {
      need([id, perk].filter(Boolean), 2, 'perk <id> <perk>');
      choosePerk(run, id, perk);
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
      return `${run.roster.find((f) => f.id === id).name} equips the ${GEAR[key].name}.`;
    },
    'sell-gear': ([i]) => {
      need([i].filter(Boolean), 1, 'sell-gear <storeroom#>');
      const key = run.inventory.gear[Number(i)];
      const gold = sellGear(run, Number(i));
      return `Sold the ${GEAR[key].name} for ${gold} Gold. Gold ${run.gold}.`;
    },
    unequip: ([id, slot]) => {
      need([id, slot].filter(Boolean), 2, 'unequip <id> <weapon|armor>');
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
    choose: ([i]) => {
      need([i].filter(Boolean), 1, 'choose <number>');
      idle();
      return `${chooseEvent(run, Number(i))}\n\n${look()}`;
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
      return `${plural(weeks, 'week')} pass.\n\n${look()}`;
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
    const fresh = discover(codex, run);
    if (fresh.length) out += `\n(New in the Codex: ${fresh.join(', ')})`;
    const step = run.status === 'active' ? nextStep(STEPS, done, run) : null;
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
  const session = createSession(opt('--seed', 1));
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
