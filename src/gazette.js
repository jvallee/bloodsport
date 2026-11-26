// Word in the city (7.11): reactive monthly street headlines derived purely from live career state.
// Zero RNG calls, zero state mutation, British English throughout. PLACEHOLDER lines for the designer.

import { UNREST, PLOT, LOUNGE } from './data.js';
import { isWinter, nextFestival, weeksUntilWinter } from './calendar.js';
import { PREFECT } from './plot.js';
import { arenaName, standings, activePolicies, tributeDue, tributePaid, espState } from './run.js';

export function cityHeadlines(run, limit = 3) {
  if (!run || run.status !== 'active') return [];
  const items = [];
  const add = (tag, icon, text) => {
    if (!items.some((x) => x.tag === tag)) items.push({ tag, icon, text });
  };

  // 1. The hidden rebellion & Prefect Aulus Crassinus.
  const p = run.plot;
  if (p && !p.ended) {
    if (p.stage === 'ready') {
      add('plot', '⛓', 'The broken chain is chalked on every fountain from the Subura to the Palatine. Nobody scrubs it off before noon.');
    } else if (p.suspicion >= PLOT.suspicion.cold) {
      add('plot', '👁', `${PREFECT} turned down three dinner invitations this week. People say he is finishing a very careful report.`);
    } else if (p.suspicion >= PLOT.suspicion.informer) {
      add('plot', '👁', 'Praetorians have been drinking in the wine-shop across from your gate and paying with imperial silver.');
    } else if (p.suspicion >= PLOT.suspicion.watch) {
      add('plot', '👁', `The water-seller says a clerk from ${PREFECT}'s office asked which of your fighters go out after curfew.`);
    }
  } else if (p?.ended === 'loyalist') {
    add('plot', '⚖', 'The city cells are quieter this month. Nobody says your house\'s name aloud in the taverns.');
  }

  // 2. The cousin in the cells.
  const c = run.cousin;
  if (c && !c.done) {
    const left = Math.max(0, c.until - run.week);
    add('cousin', '⛓', `The executioner's slate in the forum lists ${c.name ?? 'an unnamed prisoner'} for ${left === 0 ? 'this week' : `${left} week${left === 1 ? '' : 's'} from now`}.`);
  }

  // 3. Barracks unrest & moles.
  if ((run.unrest ?? 0) >= UNREST.warn) {
    add('unrest', '🔥', 'Wagers are being taken in the alley behind your barracks on whether your chains hold through the month.');
  } else if (espState(run).clues.length > 0) {
    add('mole', '🗝', 'A rival\'s runner was seen trading sealed wax for silver near your back gate.');
  }

  // 4. Recent arena drama from the last 4 weeks.
  const recent = (run.history ?? []).filter((h) => !h.skipped && !h.forfeit && run.week - h.week <= 4);
  const bloodied = [...recent].reverse().find((h) => h.won && h.bloodied);
  const titled = [...recent].reverse().find((h) => h.won && h.title);
  const nemesisBeat = [...recent].reverse().find((h) => h.won && h.nemesis);
  if (nemesisBeat) {
    add('arena', '☠', `Bookmakers took a bath when ${nemesisBeat.fighter} finally brought down ${nemesisBeat.nemesis}.`);
  } else if (bloodied) {
    add('arena', '🩸', `The wine-shops are still retelling ${bloodied.fighter}'s bloodied win in ${arenaName(bloodied.tier)}. Half the street is drinking in your colours.`);
  } else if (titled) {
    add('arena', '🏆', `Hawkers outside ${arenaName(titled.tier)} are selling clay figurines of ${titled.fighter}, ${titled.title}.`);
  }

  // 5. Recent fallen gladiator mourned by the street.
  const fallen = [...(run.fallen ?? [])].reverse().find((f) => f.diedWeek !== undefined && run.week - f.diedWeek <= 4 && !f.spy && !run.roster?.some((r) => r.revenantOf === f.id));
  if (fallen) {
    add('fallen', '⚰', `Someone left two copper coins and a sprig of laurel outside your gate for ${fallen.name}.`);
  }

  // 6. Spared opponent remembered.
  const spared = (run.spared ?? []).at(-1);
  if (spared && run.week - spared.week <= 8) {
    add('spared', '👍', `Word from the arena tunnels: ${spared.name}, whom you spared on the sand, drinks to your house's health every night.`);
  }

  // 7. Lurking nemesis.
  const nemesis = (run.nemeses ?? [])[0];
  if (nemesis) {
    add('nemesis', '☠', `${nemesis.name} ${nemesis.nemesis.epithet} was spotted sharpening steel near ${arenaName(nemesis.nemesis.tier)}, asking if your house still fields fighters.`);
  }

  // 8. Active Senate policy.
  const policies = activePolicies(run);
  if (policies.length) {
    const polName = LOUNGE.policies[policies[0].id]?.name;
    if (polName) add('policy', '🏛', `Town criers read out the Senate's latest act on the forum steps: ${polName}.`);
  }

  // 9. Rival houses: active feud, life owed, or leaderboard leader.
  const houses = run.houses ?? [];
  const feud = houses.find((h) => h.feud > 0);
  const owed = houses.find((h) => h.owed > 0 && !h.feud);
  if (feud) {
    add('house', '⚔', `Men in ${feud.name}'s colours spat in the dust as your steward crossed the forum.`);
  } else if (owed) {
    add('house', '🤝', `Fighters of ${owed.name} stepped aside in the bathhouse to let yours pass first. A life owed is not forgotten.`);
  } else if (houses.length && run.week >= 4) {
    const leader = standings(run)[0];
    if (leader && !leader.you && leader.glory > 0) {
      add('house', '🏟', `${leader.name} sits atop the Glory rolls (${leader.glory}). Their Lanista has already ordered a laurel wreath.`);
    }
  }

  // 10. Coming festival or winter / tribute.
  const fest = nextFestival(run.week);
  if (fest && fest.weeks <= 4) {
    add('season', '🏛', `Priests are already chalking the sand for ${fest.festival.name} (${fest.festival.god}).`);
  } else if (isWinter(run.week)) {
    add('season', '❄', 'The sand is frozen and the stands are shuttered. The city spends winter arguing over last year\'s bouts and paying the Emperor\'s tax.');
  } else if (!tributePaid(run) && weeksUntilWinter(run.week) > 0 && weeksUntilWinter(run.week) <= 6) {
    add('season', '⚖', `Imperial tax-collectors have started chalking doors down the street. Winter's tribute is ${tributeDue(run)} Gold.`);
  }

  // 11. Opening colour (ensures early months feel alive immediately).
  if (items.length < 2) {
    add('opening1', '📣', 'Emperor Silbannacus\'s heralds are drumming up wagers for the Dirt Pits. Nobody in the stands knows your house\'s name yet.');
  }
  if (items.length < 2) {
    add('opening2', '⚓', 'A frontier prison barge docked at the sky-harbour at dawn; the brokers are already sorting its manifests for the Market.');
  }

  return items.slice(0, limit);
}
