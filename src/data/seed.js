// Realistic sample bridesmaids so the dashboard has something to show.
// Blocked weekends are written as month-day of the weekend's first day and are
// mapped onto whatever weekends the current config produces, so changing the
// trip dates in src/config/trip.js never breaks the demo data.
//
// Built-in story: holiday weekends are rough (Easter 03-26, Memorial Day 05-28,
// July 4th 07-02, Labor Day 09-03) and four weekends work for everyone:
// 03-12, 05-14, 06-11 and 08-20.

import { findWeekendOnOrAfter } from '../lib/weekends'

const PEOPLE = [
  {
    name: 'Maya',
    editCode: 'ROSE-MAYA2',
    blocked: ['01-01', '01-15', '02-12', '03-26', '04-09', '05-28', '06-18', '07-02', '07-16', '08-06', '09-03', '09-24'],
  },
  {
    name: 'Priya',
    editCode: 'PEONY-PRIYA',
    blocked: ['01-08', '01-22', '02-19', '03-05', '03-26', '04-02', '05-28', '06-25', '07-02', '07-23', '08-27', '09-17'],
  },
  {
    name: 'Jess',
    editCode: 'LILAC-JESS2',
    blocked: ['01-01', '02-05', '02-26', '03-19', '04-30', '05-21', '06-04', '07-02', '07-30', '08-06', '09-03'],
  },
  {
    name: 'Olivia',
    editCode: 'PEARL-OLIVIA',
    blocked: ['01-29', '02-12', '03-05', '03-26', '04-16', '05-07', '05-28', '06-18', '07-02', '07-09', '08-27', '09-24'],
  },
  {
    name: 'Hannah',
    editCode: 'DAISY-HANNAH',
    blocked: ['01-15', '02-19', '03-19', '04-02', '04-23', '05-28', '06-04', '06-25', '07-02', '07-16', '08-06', '09-10'],
  },
  {
    name: 'Camille',
    editCode: 'DOVE-CAMILLE',
    blocked: ['01-22', '02-05', '03-05', '04-16', '04-30', '05-07', '07-02', '07-23', '08-27', '09-03'],
  },
  {
    name: 'Sofia',
    editCode: 'SILK-SOFIA',
    blocked: ['01-08', '01-29', '02-26', '03-26', '04-09', '05-21', '05-28', '06-25', '07-09', '07-30', '08-13'],
  },
  {
    name: 'Brooke',
    editCode: 'LACE-BROOKE',
    blocked: ['01-01', '02-12', '03-19', '04-23', '05-28', '06-18', '07-16', '08-06', '09-03', '09-17'],
  },
]

const HOUR = 60 * 60 * 1000

export function buildSeedResponses(weekends, now = Date.now()) {
  if (weekends.length === 0) return []
  const year = weekends[0].start.getFullYear()

  return PEOPLE.map((person, index) => {
    const ids = person.blocked
      .map((monthDay) => findWeekendOnOrAfter(weekends, `${year}-${monthDay}`)?.id)
      .filter(Boolean)
    const submittedAt = new Date(now - (index * 9 + 4) * HOUR).toISOString()
    return {
      id: `demo-${person.name.toLowerCase()}`,
      name: person.name,
      editCode: person.editCode,
      unavailable: [...new Set(ids)].sort(),
      submittedAt,
      updatedAt: submittedAt,
    }
  })
}

/** Codes of the sample responses, handy for trying the "edit my response" flow. */
export const SEED_EDIT_CODES = Object.fromEntries(PEOPLE.map((p) => [p.name, p.editCode]))
