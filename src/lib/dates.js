// Small, dependency-free date helpers. Dates are handled as local-time
// calendar days; the ISO string 'YYYY-MM-DD' is the canonical identifier.

const pad = (n) => String(n).padStart(2, '0')

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** 'YYYY-MM-DD' → local Date (avoids the UTC off-by-one of `new Date('2027-01-01')`). */
export function parseISO(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export const monthName = (monthIndex) => MONTHS_LONG[monthIndex]
export const weekdayShort = (weekdayIndex) => WEEKDAYS_SHORT[weekdayIndex]

/** "Mar 12–14" or "Apr 30 – May 2"; `long` spells the months out. */
export function formatRange(start, end, long = false) {
  const names = long ? MONTHS_LONG : MONTHS_SHORT
  const sameDay = toISO(start) === toISO(end)
  if (sameDay) return `${names[start.getMonth()]} ${start.getDate()}`
  if (start.getMonth() === end.getMonth()) {
    return `${names[start.getMonth()]} ${start.getDate()}–${end.getDate()}`
  }
  return `${names[start.getMonth()]} ${start.getDate()} – ${names[end.getMonth()]} ${end.getDate()}`
}

/** "Friday, March 12 – Sunday, March 14, 2027" (used for screen readers and detail views). */
export function formatLongRange(start, end) {
  const part = (d) => `${WEEKDAYS_LONG[d.getDay()]}, ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}`
  if (toISO(start) === toISO(end)) return `${part(start)}, ${start.getFullYear()}`
  return `${part(start)} – ${part(end)}, ${end.getFullYear()}`
}

/** "just now", "5 min ago", "3 days ago", or "Mar 4" for older timestamps. */
export function formatRelative(isoTimestamp, now = Date.now()) {
  const then = new Date(isoTimestamp)
  if (Number.isNaN(then.getTime())) return ''
  const seconds = Math.max(0, Math.round((now - then.getTime()) / 1000))
  if (seconds < 45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 90) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 36) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  if (days < 14) return `${days} days ago`
  return `${MONTHS_SHORT[then.getMonth()]} ${then.getDate()}`
}
