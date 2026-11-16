import { TOTAL_WEEKENDS, WEEKEND_BY_ID } from '../../lib/trip'
import { CloseIcon, SparkleIcon } from '../ui/icons'

/** "Your unavailable weekends" — removable chips, sorted by date. */
export default function SelectionSummary({ selected, onRemove, onClear }) {
  const weekends = [...selected]
    .map((id) => WEEKEND_BY_ID.get(id))
    .filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id))
  const free = TOTAL_WEEKENDS - weekends.length

  return (
    <div aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-2xl">
          Your unavailable weekends{' '}
          <span className="font-sans text-base text-berry-600">({weekends.length})</span>
        </h3>
        {weekends.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-plum-500 underline decoration-blush-300 underline-offset-4 transition hover:text-berry-600"
          >
            Clear all
          </button>
        )}
      </div>

      {weekends.length === 0 ? (
        <p className="mt-3 flex items-start gap-2 rounded-2xl bg-sage-100/70 px-4 py-3 text-[15px] text-sage-700">
          <SparkleIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            Nothing selected — that means you’re free for <strong className="font-semibold">every</strong> weekend. If
            that’s not right, tap any weekend you can’t make above.
          </span>
        </p>
      ) : (
        <>
          <ul className="mt-3 flex flex-wrap gap-2">
            {weekends.map((weekend) => (
              <li key={weekend.id} className="animate-scale-in">
                <button
                  type="button"
                  onClick={() => onRemove(weekend.id)}
                  aria-label={`Remove ${weekend.label}`}
                  className="group inline-flex items-center gap-1.5 rounded-full bg-blush-100 py-1.5 pl-3.5 pr-2.5 text-sm font-medium text-berry-700 ring-1 ring-inset ring-blush-300/70 transition hover:bg-blush-200"
                >
                  {weekend.label}
                  <CloseIcon className="size-3.5 opacity-60 transition group-hover:opacity-100" />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-plum-500">
            That leaves you free for {free} of {TOTAL_WEEKENDS} weekends.
          </p>
        </>
      )}
    </div>
  )
}
