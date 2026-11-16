import { useState } from 'react'
import { heatLevel } from '../../lib/heat'
import { ChevronDownIcon, SparkleIcon } from '../ui/icons'
import PersonPips from './PersonPips'

const INITIAL_ROWS = 10

const FILTERS = [
  { key: 'all', label: 'All weekends', test: () => true },
  { key: 'everyone', label: 'Everyone free', test: (s) => s.isPerfect },
  { key: 'one', label: 'Miss at most 1', test: (s) => s.total > 0 && s.unavailableCount <= 1 },
]

/** Every weekend, best first. Click a row for the who-can-come breakdown. */
export default function RankedList({ ranked, people, filter, onFilter, openId, onOpen }) {
  const [expanded, setExpanded] = useState(false)
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0]
  const filtered = ranked.filter(active.test)
  const visible = expanded ? filtered : filtered.slice(0, INITIAL_ROWS)

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter weekends">
        {FILTERS.map((f) => {
          const count = ranked.filter(f.test).length
          const on = f.key === filter
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={on}
              onClick={() => onFilter(f.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                on ? 'bg-plum-900 text-cream-50' : 'bg-white text-plum-700 ring-1 ring-inset ring-blush-300 hover:bg-blush-50'
              }`}
            >
              {f.label} <span className={on ? 'opacity-70' : 'text-plum-500'}>{count}</span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-white/70 px-5 py-6 text-center text-plum-500 ring-1 ring-blush-200/60">
          No weekends match yet.
        </p>
      ) : (
        <ol className="mt-4 space-y-1.5">
          {visible.map((stat) => {
            const level = heatLevel(stat.availableCount, stat.total)
            const isOpen = openId === stat.weekend.id
            return (
              <li key={stat.weekend.id}>
                <button
                  type="button"
                  onClick={() => onOpen(stat.weekend.id)}
                  aria-label={`Rank ${stat.rank}: ${stat.weekend.longLabel}. ${stat.availableCount} of ${stat.total} can attend.`}
                  className={`grid w-full grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-cream-50/90 px-3 py-2.5 text-left ring-1 transition hover:bg-white hover:shadow-soft sm:gap-4 sm:px-4 ${
                    isOpen ? 'ring-2 ring-plum-900' : 'ring-blush-200/70'
                  }`}
                >
                  <span
                    className={`grid size-9 place-items-center rounded-full text-sm font-semibold tabular-nums ${
                      stat.isPerfect ? 'bg-sage-700 text-white' : 'bg-blush-100 text-berry-700'
                    }`}
                  >
                    {stat.rank}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-medium">{stat.weekend.label}</span>
                      {stat.isPerfect && <SparkleIcon className="size-3.5 shrink-0 text-champagne-500" />}
                    </span>
                    <PersonPips people={people} stat={stat} className="mt-1.5 max-w-xs" />
                  </span>
                  <span className="flex items-center gap-2 text-sm tabular-nums">
                    <span className="size-3 rounded-full ring-1 ring-black/5" style={{ backgroundColor: level.bg }} aria-hidden="true" />
                    <strong className="font-semibold">
                      {stat.availableCount}/{stat.total}
                    </strong>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      )}

      {filtered.length > INITIAL_ROWS && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mx-auto mt-4 flex items-center gap-1.5 text-sm font-medium text-berry-600 underline decoration-blush-300 decoration-2 underline-offset-4"
        >
          {expanded ? 'Show fewer' : `Show all ${filtered.length} weekends`}
          <ChevronDownIcon className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
      <p className="mt-4 text-center text-xs text-plum-500">
        Ranked by how many can come; ties share a rank and fall back to the earlier date. Each bar is one bridesmaid
        (alphabetical) — green can come, pink can’t.
      </p>
    </div>
  )
}
