import { useCallback } from 'react'
import { MONTHS } from '../../lib/trip'
import MonthCard from '../calendar/MonthCard'
import { CloseIcon } from '../ui/icons'
import WeekendToggle from './WeekendToggle'

function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-plum-700" aria-label="Legend">
      <li className="flex items-center gap-2">
        <span className="h-5 w-9 rounded-md bg-white ring-1 ring-inset ring-blush-300" aria-hidden="true" />
        I’m free
      </li>
      <li className="flex items-center gap-2">
        <span className="relative h-5 w-9 rounded-md bg-linear-to-br from-berry-500 to-berry-600" aria-hidden="true">
          <span className="absolute -right-1 -top-1 grid size-3.5 place-items-center rounded-full bg-cream-50 text-berry-600 ring-1 ring-berry-500/30">
            <CloseIcon className="size-2" />
          </span>
        </span>
        Can’t make it
      </li>
    </ul>
  )
}

function BlockedBadge({ count }) {
  if (count === 0) return null
  return (
    <span className="animate-scale-in rounded-full bg-berry-500/10 px-2.5 py-1 text-xs font-semibold text-berry-700">
      {count} blocked
    </span>
  )
}

/** All the months, with weekends the bridesmaid can tap. `selected` is a Set of weekend ids. */
export default function AvailabilityCalendar({ selected, onToggle }) {
  const renderWeekend = useCallback(
    (seg) => <WeekendToggle seg={seg} selected={selected.has(seg.weekend.id)} onToggle={onToggle} />,
    [selected, onToggle],
  )

  return (
    <div>
      <div className="mb-4">
        <Legend />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MONTHS.map((month, index) => (
          <MonthCard
            key={month.key}
            month={month}
            renderWeekend={renderWeekend}
            badge={({ weekendIds }) => <BlockedBadge count={weekendIds.filter((id) => selected.has(id)).length} />}
            className="animate-fade-up"
            style={{ animationDelay: `${280 + index * 45}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
