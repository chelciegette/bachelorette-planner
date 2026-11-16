import { Fragment, useMemo } from 'react'
import { TRIP, WEEKEND_BY_DAY, WEEKEND_BY_ID } from '../../lib/trip'
import { buildMonthWeeks, segmentWeek, weekdayHeaders } from '../../lib/weekends'
import { CARD } from '../ui/styles'

const HEADERS = weekdayHeaders(TRIP)

/** Corner rounding for a weekend segment: a weekend wrapping onto the next row is flat where it's cut. */
function segmentRadius(isStart, isEnd) {
  if (isStart && isEnd) return 'rounded-2xl'
  if (isStart) return 'rounded-l-2xl rounded-r-md'
  if (isEnd) return 'rounded-r-2xl rounded-l-md'
  return 'rounded-md'
}

/**
 * One month, drawn as a calendar. The weekend cells are the only interactive
 * part, and what they look like is up to the caller:
 *
 *   renderWeekend({ weekend, cells, span, radius }) → element
 *
 * `badge({ weekendIds })` optionally fills the top-right corner of the card.
 * The same card powers the bridesmaid picker and the organizer heatmap.
 */
export default function MonthCard({ month, renderWeekend, badge, className = '', style }) {
  const weeks = useMemo(() => buildMonthWeeks(month, WEEKEND_BY_DAY, TRIP.weekStartsOn), [month])
  const weekendIds = useMemo(
    () => [...new Set(weeks.flat().map((cell) => cell.weekendId).filter(Boolean))],
    [weeks],
  )

  return (
    <section aria-label={`${month.name} ${month.year}`} className={`${CARD} p-4 sm:p-5 ${className}`} style={style}>
      <header className="mb-3 flex min-h-8 items-center justify-between gap-2">
        <h3 className="text-[1.9rem] leading-none">
          {month.name} <span className="text-plum-300">{month.year}</span>
        </h3>
        {badge?.({ weekendIds })}
      </header>

      <div className="mb-1 grid grid-cols-7 gap-x-1 text-center text-[11px] font-semibold uppercase tracking-wider" aria-hidden="true">
        {HEADERS.map((header) => (
          <span key={header.weekday} className={header.isWeekend ? 'text-berry-600' : 'text-plum-300'}>
            {header.label}
          </span>
        ))}
      </div>

      <div className="space-y-1.5">
        {weeks.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-7 gap-x-1">
            {segmentWeek(row).map((item) => {
              if (item.type === 'day') {
                return (
                  <div
                    key={item.key}
                    className={`grid h-13 place-items-center text-[13px] tabular-nums text-plum-500/80 ${item.cell.inMonth ? '' : 'invisible'}`}
                  >
                    {item.cell.day}
                  </div>
                )
              }
              const weekend = WEEKEND_BY_ID.get(item.weekendId)
              const radius = segmentRadius(
                item.cells[0].iso === weekend.days[0],
                item.cells[item.cells.length - 1].iso === weekend.days[weekend.days.length - 1],
              )
              return (
                <Fragment key={item.key}>
                  {renderWeekend({ weekend, cells: item.cells, span: item.span, radius })}
                </Fragment>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}
