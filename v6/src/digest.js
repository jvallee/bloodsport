// The month's digest (version 6, "the month is the turn"): what changed in the house between two moments, in a few lines.
// Pure: compare two snapshots of the roster, and keep the log lines that matter (training and healing are summed instead).

import { INJURY_BY_TAG } from './data.js';

// What the digest compares, per fighter.
export function snapshot(run) {
  return Object.fromEntries(run.roster.map((f) => [f.id, {
    name: f.name, power: f.power, speed: f.speed, stress: f.stress, morale: Math.round(f.morale), level: f.level,
    injuries: f.injuries.map((i) => i.tag),
  }]));
}

// Log lines the per-fighter changes already say (or that only mark the calendar).
const SUMMED = [/ trains: \+\d+ (Power|Speed)\.$/, /'s .+ has healed( with rest)?\.$/, / leaves the Medbay fully healed\.$/, /^Tournament week in /];

const sign = (n) => (n > 0 ? `+${n}` : `−${-n}`);

// { tone, text } lines: one per fighter whose numbers moved, then the rest of the log (newest last), without repeats.
export function monthDigest(before, run, logLines) {
  const out = [];
  for (const f of run.roster) {
    const b = before[f.id];
    if (!b) { out.push({ tone: 'good', text: `${f.name} joined the house.` }); continue; }
    const bits = [];
    if (f.power !== b.power) bits.push(`${sign(f.power - b.power)} Power`);
    if (f.speed !== b.speed) bits.push(`${sign(f.speed - b.speed)} Speed`);
    if (f.level !== b.level) bits.push(`level ${f.level}`);
    const healed = b.injuries.filter((t) => !f.injuries.some((i) => i.tag === t));
    if (healed.length) bits.push(`healed: ${healed.map((t) => INJURY_BY_TAG[t]?.name ?? t).join(', ')}`);
    if (Math.abs(f.stress - b.stress) >= 5) bits.push(`Stress ${b.stress} → ${f.stress}`);
    if (Math.abs(Math.round(f.morale) - b.morale) >= 5) bits.push(`Morale ${b.morale} → ${Math.round(f.morale)}`);
    if (bits.length) out.push({ tone: f.power > b.power || healed.length ? 'good' : f.stress >= 50 ? 'warn' : 'info', text: `${f.name}: ${bits.join(', ')}.` });
  }
  for (const id of Object.keys(before)) if (!run.roster.some((f) => f.id === id)) out.push({ tone: 'bad', text: `${before[id].name} has left the house.` });
  const seen = new Set();
  for (const l of logLines) {
    if (SUMMED.some((re) => re.test(l.text)) || seen.has(l.text)) continue;
    seen.add(l.text);
    out.push({ tone: l.tone, text: l.text });
  }
  return out;
}
