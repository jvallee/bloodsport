import test from 'node:test';
import assert from 'node:assert/strict';
import { dateOf, isWinter, isTournamentWeek, isMonthStart, weeksUntilTournament, weeksUntilWinter, formatDate, WEEKS_PER_YEAR } from '../src/calendar.js';

test('a year is 10 months of 4 weeks plus a 4-week winter', () => {
  assert.equal(WEEKS_PER_YEAR, 44);
  assert.deepEqual(dateOf(0), { year: 1, winter: false, month: 'Martius', weekOfMonth: 1 });
  assert.deepEqual(dateOf(39), { year: 1, winter: false, month: 'December', weekOfMonth: 4 });
  assert.deepEqual(dateOf(40), { year: 1, winter: true, month: 'Winter Dead Season', weekOfMonth: 1 });
  assert.deepEqual(dateOf(44), { year: 2, winter: false, month: 'Martius', weekOfMonth: 1 });
});

test('the last week of each month is a tournament week; winter has none', () => {
  const weeks = Array.from({ length: 44 }, (_, w) => w).filter(isTournamentWeek);
  assert.deepEqual(weeks, [3, 7, 11, 15, 19, 23, 27, 31, 35, 39]);
  for (let w = 40; w < 44; w++) assert.ok(isWinter(w) && !isTournamentWeek(w));
});

test('weeksUntilTournament counts across winter', () => {
  assert.equal(weeksUntilTournament(0), 3);
  assert.equal(weeksUntilTournament(3), 0);
  assert.equal(weeksUntilTournament(40), 7); // winter 40–43, then Martius week 4 = 47
});

test('month starts include winter week 1 and formatDate reads naturally', () => {
  assert.ok(isMonthStart(0) && isMonthStart(4) && isMonthStart(40) && !isMonthStart(5));
  assert.equal(formatDate(5), 'Aprilis, week 2 · Year 1');
  assert.equal(formatDate(41), 'Winter, week 2 · Year 1');
});

test('weeksUntilWinter counts down to the tribute, then to next year\'s', () => {
  assert.equal(weeksUntilWinter(0), 40);
  assert.equal(weeksUntilWinter(36), 4);
  assert.equal(weeksUntilWinter(40), 0);
  assert.equal(weeksUntilWinter(41), 43);
});
