// Version 7 balance and simulation harness tests (Wave 3).
// Fast, deterministic checks covering Season speedSplit, tacticsEdge, Heat 1/3 gate plumbing,
// Season/Long Road Boss curves, and the upgraded careful bot (Oracle, Boss consumables, relic swaps, withdrawBlocker).

import test from 'node:test';
import assert from 'node:assert/strict';
import { CIRCUITS, GRAND, SHORT, BRACKET, PLOT } from '../src/data.js';
import { speedSplit, tacticsEdge, gateJobs, gatesFrom } from '../scripts/checks.js';
import { playCareer } from '../scripts/bots.js';

test('v7 Season speedSplit finds a balanced interior Speed optimum (12–50%) on at least 2 of 4 Bosses', () => {
  const split = speedSplit({ n: 1000 }); // 7.2: at 500 samples the Imperial splits 0–2 are within noise
  assert.equal(split.rows.length, 4);
  assert.ok(split.balanced >= 2, `only ${split.balanced}/4 Bosses had a balanced split`);
  for (const r of split.rows) {
    assert.ok(r.best.speedPoints >= 1 && r.best.speedPoints < r.points, `${r.boss} optimal split was extreme (${r.best.speedPoints}/${r.points})`);
  }
});

test('v7 tacticsEdge: reading the opponent beats both always-Steady and always-Press', () => {
  const t = tacticsEdge({ n: 800 });
  assert.ok(t.smart > t.steady, `expected smart (${t.smart}) > steady (${t.steady})`);
  assert.ok(t.smart > t.press, `expected smart (${t.smart}) > press (${t.press})`);
});

test('v7 gateJobs includes Season defaults plus Heat 1 and Heat 3 Full Legacy groups on matching seeds', () => {
  const jobs = gateJobs({ careers: 20, quick: true });
  const byGroup = (g) => jobs.filter((j) => j.group === g);
  assert.equal(byGroup('careful').length, 20);
  assert.equal(byGroup('careful')[0].opts.setup.short, true);
  assert.equal(byGroup('long')[0].opts.setup.short, false);
  const leg = byGroup('legacy');
  const h1 = byGroup('heat1');
  const h3 = byGroup('heat3');
  assert.ok(h1.length > 0 && h1.length === leg.length, 'heat1 matches legacy job count');
  assert.ok(h3.length > 0 && h3.length === leg.length, 'heat3 matches legacy job count');
  assert.equal(h1[0].opts.setup.heat, 1);
  assert.equal(h3[0].opts.setup.heat, 3);
  assert.deepEqual(h1.map((j) => j.seed), leg.map((j) => j.seed));
  assert.deepEqual(h3.map((j) => j.seed), leg.map((j) => j.seed));
});

test('v7 gatesFrom evaluates Heat 1 and Heat 3 monotonicity gates accurately', () => {
  const mk = (won, extra = {}) => ({
    won,
    deaths: won ? 0 : 1,
    weeks: 60,
    fightMonths: 15,
    months: 15,
    deadMonths: 0,
    relics: [],
    run: {
      roster: [],
      fallen: [],
      retired: [],
      setup: { short: true, heat: 0 },
      topTier: won ? 5 : 3,
      status: won ? 'won' : 'lost',
      history: [{ boss: true, top: true, tier: 1, won: true }, { boss: true, top: true, tier: 5, won }],
      ending: won ? 'won' : 'lost',
      ...extra,
    },
  });
  const batch = (n, wins) => Array.from({ length: n }, (_, i) => mk(i < wins));
  const common = {
    careful: batch(20, 5),
    reckless: batch(20, 2).map((r) => ({ ...r, deaths: 3 })),
    rebel: batch(10, 2),
    loyalist: batch(10, 4),
    long: batch(10, 3).map((r) => ({ ...r, weeks: 120 })),
    split: { balanced: 4, rows: [] },
    tactics: { smart: 0.61, steady: 0.53, press: 0.56 },
  };
  const passRes = gatesFrom({ ...common, legacy: batch(20, 10), heat1: batch(20, 7), heat3: batch(20, 4) });
  const h1Pass = passRes.gates.find((g) => /Heat 1/.test(g.name));
  const h3Pass = passRes.gates.find((g) => /Heat 3/.test(g.name));
  assert.equal(h1Pass?.pass, true);
  assert.equal(h3Pass?.pass, true);

  const failRes = gatesFrom({ ...common, legacy: batch(20, 10), heat1: batch(20, 10), heat3: batch(20, 1) });
  assert.equal(failRes.gates.find((g) => /Heat 1/.test(g.name))?.pass, false);
  assert.equal(failRes.gates.find((g) => /Heat 3/.test(g.name))?.pass, false);
});

test('v7 Boss Power curve climbs smoothly across tiers with a real Grand climax and no QF meatshield profit', () => {
  const seasonBosses = [
    ...CIRCUITS.map((c, i) => c.oppPower[2] + (SHORT.oppPower[i] ?? 0)),
    GRAND.oppPower + SHORT.grandPower,
  ];
  for (let i = 1; i < seasonBosses.length; i++) {
    assert.ok(seasonBosses[i] > seasonBosses[i - 1], `Season tier ${i + 1} Boss (${seasonBosses[i]}) must exceed tier ${i} (${seasonBosses[i - 1]})`);
  }
  const grandGap = seasonBosses[4] - seasonBosses[3];
  assert.ok(grandGap >= 8, `Season Grand climax gap (${grandGap}) should be at least 8 Power above T4 Boss`);
  assert.equal(BRACKET.earlyBossLossGold, 0);
  assert.ok(BRACKET.earlyBossLoss >= 0.5 && BRACKET.earlyBossLoss <= 1);
  assert.ok(PLOT.offerAfter >= 8 && PLOT.offerAfter <= 16);
});

test('v7 careful bot plays Season Heat 0, Heat 1, and Heat 3 careers cleanly without blocker errors', () => {
  for (const heat of [0, 1, 3]) {
    const r = playCareer(1000 + heat, 'careful', { oddsSamples: 25, setup: { short: true, heat } });
    assert.ok(['won', 'lost', 'active'].includes(r.status));
    assert.ok(r.weeks > 0 && r.weeks <= 250);
  }
});
