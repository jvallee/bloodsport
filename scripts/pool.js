// Runs bot careers (and the gates' other simulations) on every core but one. Each job is seeded, so the results are the
// same as running them one after another, in the same order. Tunables (paths into src/data.js, as the probes take them)
// are applied inside every worker before it plays.
//   jobs: [{ type: 'career', seed, strategy, opts }] or [{ type: 'split' | 'tactics', opts }]
import { Worker } from 'node:worker_threads';
import os from 'node:os';

export const THREADS = Math.max(1, (os.availableParallelism?.() ?? os.cpus().length) - 1);

export function runJobs(jobs, { tunables = {}, threads = THREADS, onDone = null } = {}) {
  const results = new Array(jobs.length);
  let next = 0;
  let done = 0;
  const lane = () => new Promise((resolve, reject) => {
    const w = new Worker(new URL('./career-worker.js', import.meta.url), { workerData: { tunables } });
    const give = () => {
      if (next >= jobs.length) { w.terminate().then(resolve); return; }
      const i = next++;
      w.postMessage({ i, job: jobs[i] });
    };
    w.on('message', ({ i, result }) => {
      results[i] = result;
      done += 1;
      onDone?.(jobs[i], done, jobs.length);
      give();
    });
    w.on('error', reject);
    give();
  });
  return Promise.all(Array.from({ length: Math.min(threads, jobs.length) }, lane)).then(() => results);
}

// A one-line progress report, rewritten in place on a terminal and printed every `every` jobs otherwise
// (so a log file shows how far a check has got).
export function progress(label = '', { every = 50 } = {}) {
  const start = Date.now();
  const counts = {};
  const totals = {};
  return {
    expect(jobs) { for (const j of jobs) totals[j.group ?? j.type] = (totals[j.group ?? j.type] ?? 0) + 1; },
    tick(job, done, total) {
      const g = job.group ?? job.type;
      counts[g] = (counts[g] ?? 0) + 1;
      const s = Math.round((Date.now() - start) / 1000);
      const line = `${label}${Object.keys(totals).map((k) => `${k} ${counts[k] ?? 0}/${totals[k]}`).join(' · ')} (${Math.floor(s / 60)}m ${s % 60}s)`;
      if (process.stderr.isTTY) process.stderr.write(`\r${line}${done === total ? '\n' : ''}`);
      else if (done % every === 0 || done === total) process.stderr.write(`${line}\n`);
    },
  };
}
