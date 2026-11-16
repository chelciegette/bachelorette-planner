// The trip's weekends and months, derived once from src/config/trip.js.

import { TRIP } from '../config/trip'
import { buildMonths, generateWeekends, indexWeekendsByDay } from './weekends'

export { TRIP }
export const WEEKENDS = generateWeekends(TRIP)
export const WEEKEND_BY_ID = new Map(WEEKENDS.map((weekend) => [weekend.id, weekend]))
export const WEEKEND_BY_DAY = indexWeekendsByDay(WEEKENDS)
export const MONTHS = buildMonths(TRIP)
export const TOTAL_WEEKENDS = WEEKENDS.length
