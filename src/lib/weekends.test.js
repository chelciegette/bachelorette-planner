import { describe, expect, it } from 'vitest'
import { TRIP } from '../config/trip'
import { buildMonths, buildMonthWeeks, generateWeekends, indexWeekendsByDay, segmentWeek } from './weekends'

describe('generateWeekends (default config: Jan–Sep 2027, Fri–Sun)', () => {
  const weekends = generateWeekends(TRIP)

  it('finds all 39 weekends', () => {
    expect(weekends).toHaveLength(39)
    expect(weekends[0].id).toBe('2027-01-01')
    expect(weekends.at(-1).id).toBe('2027-09-24')
  })

  it('makes every weekend Friday → Sunday', () => {
    for (const weekend of weekends) {
      expect(weekend.start.getDay()).toBe(5)
      expect(weekend.end.getDay()).toBe(0)
      expect(weekend.days).toHaveLength(3)
    }
  })

  it('labels weekends that cross a month boundary', () => {
    const aprilThirtieth = weekends.find((w) => w.id === '2027-04-30')
    expect(aprilThirtieth.label).toBe('Apr 30 – May 2')
    expect(weekends.find((w) => w.id === '2027-03-12').label).toBe('Mar 12–14')
  })
})

describe('configurable weekend definition', () => {
  it('supports Thursday → Sunday', () => {
    const weekends = generateWeekends({
      ...TRIP,
      weekend: { startDay: 4, lengthDays: 4 },
    })
    expect(weekends[0].start.getDay()).toBe(4)
    expect(weekends[0].days).toHaveLength(4)
  })

  it('respects a custom date range', () => {
    const weekends = generateWeekends({
      ...TRIP,
      dateRange: { start: '2027-03-01', end: '2027-03-31' },
    })
    expect(weekends.map((w) => w.id)).toEqual(['2027-03-05', '2027-03-12', '2027-03-19', '2027-03-26'])
  })
})

describe('months and calendar grids', () => {
  it('covers January through September', () => {
    const months = buildMonths(TRIP)
    expect(months.map((m) => m.name)).toEqual([
      'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
    ])
  })

  it('keeps each weekend in one 3-column segment with a Monday-first grid', () => {
    const byDay = indexWeekendsByDay(generateWeekends(TRIP))
    const month = buildMonths(TRIP)[2] // March
    const weeks = buildMonthWeeks(month, byDay, 1)
    expect(weeks.every((row) => row.length === 7)).toBe(true)
    for (const row of weeks) {
      for (const item of segmentWeek(row)) {
        if (item.type === 'weekend') expect(item.span).toBe(3)
      }
    }
  })

  it('shows a month-straddling weekend in both months', () => {
    const byDay = indexWeekendsByDay(generateWeekends(TRIP))
    const [, , , april, may] = buildMonths(TRIP)
    const ids = (month) => new Set(buildMonthWeeks(month, byDay, 1).flat().map((c) => c.weekendId))
    expect(ids(april).has('2027-04-30')).toBe(true)
    expect(ids(may).has('2027-04-30')).toBe(true)
  })

  it('never shows a weekend twice unless it straddles two months', () => {
    const weekends = generateWeekends(TRIP)
    const byDay = indexWeekendsByDay(weekends)
    const appearances = new Map()
    for (const month of buildMonths(TRIP)) {
      const ids = new Set(buildMonthWeeks(month, byDay, 1).flat().map((c) => c.weekendId).filter(Boolean))
      for (const id of ids) appearances.set(id, (appearances.get(id) ?? 0) + 1)
    }
    // every weekend appears, and only Apr 30–May 2 and Jul 30–Aug 1 appear in two months
    expect(appearances.size).toBe(weekends.length)
    const twice = [...appearances].filter(([, n]) => n > 1).map(([id]) => id)
    expect(twice.sort()).toEqual(['2027-04-30', '2027-07-30'])
  })

  it('splits a weekend across two rows when weeks start on Sunday', () => {
    const byDay = indexWeekendsByDay(generateWeekends(TRIP))
    const march = buildMonths(TRIP)[2]
    const segments = buildMonthWeeks(march, byDay, 0).flatMap(segmentWeek).filter((s) => s.type === 'weekend')
    // Fri+Sat on one row, Sun at the start of the next → more segments than weekends
    expect(segments.length).toBeGreaterThan(4)
    expect(segments.some((s) => s.span === 1)).toBe(true)
  })
})
