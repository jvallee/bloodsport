// Roman calendar in weeks: 10 months × 4 weeks, then a 4-week Winter Dead Season (44 weeks a year).
// The last week of every month is a tournament week. Pure.

import { MONTHS, CALENDAR, FESTIVALS } from './data.js';

const ACTIVE_WEEKS = MONTHS.length * CALENDAR.weeksPerMonth;
export const WEEKS_PER_YEAR = ACTIVE_WEEKS + CALENDAR.winterWeeks;

export function dateOf(week) {
  const year = Math.floor(week / WEEKS_PER_YEAR) + 1;
  const w = week % WEEKS_PER_YEAR;
  if (w >= ACTIVE_WEEKS) return { year, winter: true, month: 'Winter Dead Season', weekOfMonth: w - ACTIVE_WEEKS + 1 };
  return { year, winter: false, month: MONTHS[Math.floor(w / CALENDAR.weeksPerMonth)], weekOfMonth: (w % CALENDAR.weeksPerMonth) + 1 };
}

export const isWinter = (week) => dateOf(week).winter;
export const isTournamentWeek = (week) => !isWinter(week) && dateOf(week).weekOfMonth === CALENDAR.weeksPerMonth;
export const isMonthStart = (week) => dateOf(week).weekOfMonth === 1;

export function weeksUntilTournament(week) {
  let n = 0;
  while (!isTournamentWeek(week + n)) n++;
  return n;
}

// Weeks until the tribute is collected (the first week of winter).
export const weeksUntilWinter = (week) => {
  const w = week % WEEKS_PER_YEAR;
  const start = WEEKS_PER_YEAR - CALENDAR.winterWeeks;
  return w <= start ? start - w : WEEKS_PER_YEAR - w + start;
};

export const formatDate = (week) => {
  const d = dateOf(week);
  return d.winter ? `Winter, week ${d.weekOfMonth} · Year ${d.year}` : `${d.month}, week ${d.weekOfMonth} · Year ${d.year}`;
};

// The festival held this week, if any (festivals fall on their month's tournament week).
export const festivalOn = (week) => (isTournamentWeek(week) ? FESTIVALS[dateOf(week).month] ?? null : null);

// The next festival from this week on: { festival, weeks } (weeks = 0 if it's this week).
export function nextFestival(week) {
  for (let n = 0; n <= 44; n++) if (festivalOn(week + n)) return { festival: festivalOn(week + n), weeks: n };
  return null;
}
