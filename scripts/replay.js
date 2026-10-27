// Replay a playtester's bug report: re-runs their career from its seed, action by action.
//   npm run replay -- report.json            replay everything, show the original error and whether it reproduces
//   npm run replay -- report.json --stop N   stop after N actions and print the state there
//   npm run replay -- report.json --steps    also list every action as it replays

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { parseReport, replay, stateDigest } from '../src/debug.js';

const show = (label, value) => console.log(`${label.padEnd(14)}${value}`);

// The commit that was live when the report was made, so stack line numbers match (GitHub Pages serves main).
function liveCommit(time) {
  if (!time) return null;
  try {
    return execFileSync('git', ['log', '-1', `--before=${time}`, '--format=%h %s', 'main'], { encoding: 'utf8' }).trim() || null;
  } catch {
    return null;
  }
}

export function main(argv = process.argv.slice(2)) {
  const file = argv.find((a) => !a.startsWith('--') && !/^\d+$/.test(a));
  if (!file) {
    console.log('Usage: npm run replay -- <report.json> [--stop N] [--steps]');
    process.exitCode = 1;
    return;
  }
  const stopIndex = argv.indexOf('--stop');
  const stopAt = stopIndex >= 0 ? Number(argv[stopIndex + 1]) : Infinity;
  const report = parseReport(readFileSync(file, 'utf8'));

  console.log('== Bug report');
  show('Made', `${report.time ?? '?'} (game version ${report.version ?? '?'})`);
  const commit = liveCommit(report.time);
  if (commit) show('Live commit', `${commit}   (git checkout it if the stack's line numbers look off)`);
  show('Page', report.url ?? '?');
  show('Browser', report.userAgent ?? '?');
  show('Career', `seed ${report.seed}, week ${report.week}, ${report.actions.length} actions${report.fromSnapshot ? ' (recorded from a mid-career snapshot: an older save)' : ''}`);
  if (report.notes) show('Tester says', report.notes);
  if (report.error) {
    show('Error', `${report.error.message}  [during ${report.where ?? '?'}${report.lastAction ? `: ${JSON.stringify(report.lastAction)}` : ''}]`);
    console.log(report.error.stack.split('\n').map((l) => `    ${l}`).join('\n'));
  } else {
    console.log('No error attached: a manual report (look at the notes and the state below).');
  }

  console.log(`\n== Replaying${Number.isFinite(stopAt) ? ` the first ${stopAt} actions` : ''}`);
  const onStep = argv.includes('--steps')
    ? (state, i) => console.log(`  #${i} week ${state.run.week}: ${JSON.stringify(report.actions[i])}`)
    : null;
  const { state, errors } = replay(report, { stopAt, onStep });
  for (const e of errors) console.log(`  action #${e.index} (week ${e.week}) ${e.action} ${JSON.stringify(e.data)}: ${e.refused ? 'refused' : 'CRASH'}: ${e.message}`);
  if (!errors.length) console.log('  Every action ran without an error.');
  else if (errors.every((e) => e.refused)) console.log('  (Refusals are normal: the game said no and carried on, as it did for the player.)');

  if (report.error && report.where === 'action' && Number.isFinite(stopAt) === false) {
    const last = errors.find((e) => e.index === report.actions.length - 1);
    if (last && last.message === report.error.message) {
      console.log('\n== Reproduced. Local stack:');
      console.log(last.stack.split('\n').map((l) => `    ${l}`).join('\n'));
    } else {
      console.log('\n== Not reproduced by the replay (the error may depend on the page, not the game rules).');
    }
  } else if (report.error && report.where !== 'action') {
    console.log(`\n== The error happened during ${report.where}, which is page code: the replay rebuilds the game state it happened in (below).`);
  }

  console.log('\n== State');
  const replayed = stateDigest(state.run);
  console.log(JSON.stringify(replayed, null, 2));
  if (!Number.isFinite(stopAt) && report.save) {
    const same = JSON.stringify(replayed) === JSON.stringify(stateDigest(report.save));
    console.log(same ? 'Matches the report\'s save.' : `DIFFERS from the report's save:\n${JSON.stringify(stateDigest(report.save), null, 2)}`);
  }
  if (state.match) console.log(`A match is in progress: round ${state.match.round}, ${state.match.over ? 'over' : 'not over'}.`);
  return { report, state, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
