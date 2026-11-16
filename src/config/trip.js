/**
 * ✦ Everything you're likely to want to tweak lives right here. ✦
 *
 * The calendar, the dashboard and the sample data all follow this file
 * automatically. After changing the dates or weekend definition, use
 * "Reset demo data" (top bar) so the sample responses are rebuilt to match.
 */
export const TRIP = {
  /** Optional. 'Sam' → "Sam's Bachelorette" in the page eyebrow. Leave '' to keep it generic. */
  brideName: '',

  /** The window bridesmaids choose from — inclusive, 'YYYY-MM-DD'. */
  dateRange: {
    start: '2027-01-01',
    end: '2027-09-30',
  },

  /**
   * What counts as "a weekend".
   *   startDay    0 = Sun, 1 = Mon … 5 = Fri, 6 = Sat
   *   lengthDays  how many days it lasts (1–6)
   *
   * Fri → Sun is { startDay: 5, lengthDays: 3 }.
   * Thu → Sun would be { startDay: 4, lengthDays: 4 }.
   * A weekend is included when its first day falls inside `dateRange`.
   */
  weekend: {
    startDay: 5,
    lengthDays: 3,
  },

  /**
   * First column of the calendar grids. 1 = Monday keeps a Fri–Sun weekend
   * together in a single row; 0 = Sunday first also works (it just wraps).
   */
  weekStartsOn: 1,
}
