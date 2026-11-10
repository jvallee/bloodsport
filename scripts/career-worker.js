// A worker for scripts/pool.js: applies the tunables, then plays each job it is sent and posts the result back.
import { parentPort, workerData } from 'node:worker_threads';
import * as D from '../src/data.js';
import * as F from '../src/fortune.js';
import { playCareer } from './bots.js';
import { speedSplit, tacticsEdge } from './checks.js';

for (const [path, value] of Object.entries(workerData.tunables ?? {})) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((o, k) => o[k], keys[0] in D ? D : F)[last] = value; // data.js tables, or fortune.js's (e.g. RELICS)
}

parentPort.on('message', ({ i, job }) => {
  const result = job.type === 'split' ? speedSplit(job.opts) : job.type === 'tactics' ? tacticsEdge(job.opts) : playCareer(job.seed, job.strategy, job.opts);
  parentPort.postMessage({ i, result });
});
