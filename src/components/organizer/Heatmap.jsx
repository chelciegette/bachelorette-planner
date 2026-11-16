import { useCallback } from 'react'
import { HEAT_LEVELS, heatLevel } from '../../lib/heat'
import { MONTHS } from '../../lib/trip'
import MonthCard from '../calendar/MonthCard'
import SegmentDays from '../calendar/SegmentDays'
import { SparkleIcon } from '../ui/icons'

function HeatWeekend({ seg, stat, active, onOpen }) {
  const { weekend, cells, span, radius } = seg
  const level = heatLevel(stat.availableCount, stat.total)

  return (
    <button
      type="button"
      onClick={() => onOpen(weekend.id)}
      aria-haspopup="dialog"
      aria-label={`${weekend.longLabel}: ${stat.availableCount} of ${stat.total} can attend. Open details.`}
      style={{ gridColumn: `span ${span}`, backgroundColor: level.bg, color: level.fg }}
      className={[
        'relative flex h-13 touch-manipulation select-none flex-col items-center justify-center gap-1',
        'transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]',
        radius,
        level.key === 'none' ? 'ring-1 ring-inset ring-blush-200' : '',
        active ? 'ring-2 ring-plum-900 ring-offset-2 ring-offset-cream-50' : '',
      ].join(' ')}
    >
      <SegmentDays cells={cells} className="text-center text-[10px] leading-none opacity-75" />
      <span className="text-[15px] font-semibold leading-none tabular-nums">
        {stat.total ? `${stat.availableCount}/${stat.total}` : '–'}
      </span>
      {stat.isPerfect && (
        <SparkleIcon className="absolute -right-1.5 -top-1.5 z-10 size-4 text-champagne-500 drop-shadow-[0_1px_0_rgb(255_255_255/0.9)]" />
      )}
    </button>
  )
}

export function HeatLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-plum-700" aria-label="Colour legend">
      <div className="flex items-center gap-2">
        <span>Fewer can come</span>
        <span className="flex gap-0.5" aria-hidden="true">
          {[...HEAT_LEVELS].reverse().map((level) => (
            <span key={level.key} title={level.label} className="h-3.5 w-6 first:rounded-l-md last:rounded-r-md" style={{ backgroundColor: level.bg }} />
          ))}
        </span>
        <span>Everyone</span>
      </div>
      <div className="flex items-center gap-1.5">
        <SparkleIcon className="size-3.5 text-champagne-500" />
        Perfect — nobody’s busy
      </div>
    </div>
  )
}

/** The whole trip as a calendar, each weekend coloured by how many bridesmaids can come. */
export default function Heatmap({ statsById, openId, onOpen }) {
  const renderWeekend = useCallback(
    (seg) => (
      <HeatWeekend seg={seg} stat={statsById.get(seg.weekend.id)} active={openId === seg.weekend.id} onOpen={onOpen} />
    ),
    [statsById, openId, onOpen],
  )

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {MONTHS.map((month, index) => (
        <MonthCard
          key={month.key}
          month={month}
          renderWeekend={renderWeekend}
          badge={({ weekendIds }) => {
            const perfect = weekendIds.filter((id) => statsById.get(id)?.isPerfect).length
            if (perfect === 0) return null
            return (
              <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2.5 py-1 text-xs font-semibold text-sage-700">
                <SparkleIcon className="size-3 text-champagne-500" />
                {perfect} perfect
              </span>
            )
          }}
          className="animate-fade-up"
          style={{ animationDelay: `${index * 45}ms` }}
        />
      ))}
    </div>
  )
}
