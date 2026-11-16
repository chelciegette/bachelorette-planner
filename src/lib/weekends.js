// Turns the trip config into weekends, months and calendar grids.
// Everything takes the config as a parameter so it can be unit-tested.

import { TRIP } from '../config/trip'
import { addDays, formatLongRange, formatRange, monthName, parseISO, toISO } from './dates'

const pad = (n) => String(n).padStart(2, '0')
const clamp = (n, low, high) => Math.min(high, Math.max(low, n))

function makeWeekend(first, lengthDays) {
  const days = Array.from({ length: lengthDays }, (_, i) => toISO(addDays(first, i)))
  const last = addDays(first, lengthDays - 1)
  return {
    id: days[0], // the first day's ISO date identifies the weekend everywhere
    start: first,
    end: last,
    days,
    label: formatRange(first, last), // "Mar 12–14"
    titleLabel: formatRange(first, last, true), // "March 12–14"
    longLabel: formatLongRange(first, last), // "Friday, March 12 – Sunday, March 14, 2027"
  }
}

/** Every weekend whose first day falls inside the configured date range. */
export function generateWeekends(config = TRIP) {
  const lengthDays = clamp(Math.round(config.weekend.lengthDays), 1, 6)
  const rangeStart = parseISO(config.dateRange.start)
  const rangeEnd = parseISO(config.dateRange.end)
  const offset = (config.weekend.startDay - rangeStart.getDay() + 7) % 7

  const weekends = []
  for (let first = addDays(rangeStart, offset); first <= rangeEnd; first = addDays(first, 7)) {
    weekends.push(makeWeekend(first, lengthDays))
  }
  return weekends
}

/** Calendar months touched by the date range, in order. */
export function buildMonths(config = TRIP) {
  const start = parseISO(config.dateRange.start)
  const end = parseISO(config.dateRange.end)
  const months = []
  let year = start.getFullYear()
  let monthIndex = start.getMonth()
  while (year < end.getFullYear() || (year === end.getFullYear() && monthIndex <= end.getMonth())) {
    months.push({ key: `${year}-${pad(monthIndex + 1)}`, year, monthIndex, name: monthName(monthIndex) })
    monthIndex += 1
    if (monthIndex > 11) {
      monthIndex = 0
      year += 1
    }
  }
  return months
}

/** Map of 'YYYY-MM-DD' → weekend, for every day that belongs to a weekend. */
export function indexWeekendsByDay(weekends) {
  const byDay = new Map()
  for (const weekend of weekends) {
    for (const day of weekend.days) byDay.set(day, weekend)
  }
  return byDay
}

/** Column headers for the calendar grid, e.g. M T W T F S S, flagging weekend columns. */
export function weekdayHeaders(config = TRIP) {
  const lengthDays = clamp(Math.round(config.weekend.lengthDays), 1, 6)
  const weekendDays = new Set(Array.from({ length: lengthDays }, (_, i) => (config.weekend.startDay + i) % 7))
  const letters = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  return Array.from({ length: 7 }, (_, i) => {
    const weekday = (config.weekStartsOn + i) % 7
    return { weekday, label: letters[weekday], isWeekend: weekendDays.has(weekday) }
  })
}

/**
 * The rows of one month's grid. Each cell: { iso, day, inMonth, weekendId }.
 * Weekends that straddle a month boundary keep their weekendId in both months,
 * so they can be shown (and toggled) from either side.
 */
export function buildMonthWeeks(month, weekendByDay, weekStartsOn = TRIP.weekStartsOn) {
  const first = new Date(month.year, month.monthIndex, 1)
  const last = new Date(month.year, month.monthIndex + 1, 0)
  const lead = (first.getDay() - weekStartsOn + 7) % 7
  const lastWeekday = (weekStartsOn + 6) % 7
  const trail = (lastWeekday - last.getDay() + 7) % 7
  const gridStart = addDays(first, -lead)
  const rows = (lead + last.getDate() + trail) / 7

  const grid = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: 7 }, (_, col) => {
      const date = addDays(gridStart, row * 7 + col)
      const iso = toISO(date)
      return {
        iso,
        day: date.getDate(),
        inMonth: date.getMonth() === month.monthIndex,
        weekendId: weekendByDay.get(iso)?.id ?? null,
      }
    }),
  )

  // A weekend belongs in this month's grid only if at least one of its days is
  // in the month. Otherwise the spill-over days in the last row would show next
  // month's first weekend a second time.
  const visible = new Set(grid.flat().filter((cell) => cell.inMonth && cell.weekendId).map((cell) => cell.weekendId))
  return grid.map((row) => row.map((cell) => (cell.weekendId && !visible.has(cell.weekendId) ? { ...cell, weekendId: null } : cell)))
}

/**
 * Splits a week row into plain days and weekend segments. A weekend that fits
 * in the row becomes one segment spanning 3 columns; one that wraps onto the
 * next row becomes two segments that share the same weekendId.
 */
export function segmentWeek(row) {
  const items = []
  let i = 0
  while (i < row.length) {
    const cell = row[i]
    if (!cell.weekendId) {
      items.push({ type: 'day', key: cell.iso, cell })
      i += 1
      continue
    }
    let j = i
    while (j + 1 < row.length && row[j + 1].weekendId === cell.weekendId) j += 1
    const cells = row.slice(i, j + 1)
    items.push({ type: 'weekend', key: `${cell.weekendId}@${cells[0].iso}`, weekendId: cell.weekendId, cells, span: cells.length })
    i = j + 1
  }
  return items
}

/** The weekend containing `iso`, or the next one after it (null if past the range). */
export function findWeekendOnOrAfter(weekends, iso) {
  return weekends.find((w) => w.days.includes(iso)) ?? weekends.find((w) => w.id > iso) ?? null
}
