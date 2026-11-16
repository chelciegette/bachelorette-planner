import { useEffect, useRef } from 'react'
import { heatLevel } from '../../lib/heat'
import Avatar from '../ui/Avatar'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, SparkleIcon } from '../ui/icons'
import { EYEBROW } from '../ui/styles'

function PersonChip({ person, tone }) {
  return (
    <li className={`inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-sm font-medium ${tone}`}>
      <Avatar name={person.name} size="sm" />
      {person.name}
    </li>
  )
}

const iconButton =
  'grid size-10 place-items-center rounded-full text-plum-700 ring-1 ring-inset ring-blush-200 transition hover:bg-blush-100 disabled:pointer-events-none disabled:opacity-35'

/**
 * "Who can and can't come?" for one weekend. A bottom sheet on phones, a centred
 * card on larger screens. ← / → step through weekends, Esc closes.
 */
export default function WeekendDialog({ stat, rankCount, onClose, onPrev, onNext }) {
  const dialogRef = useRef(null)
  const { weekend, rank, isPerfect, available, unavailable, availableCount, total } = stat
  const level = heatLevel(availableCount, total)

  // Focus the dialog, lock page scroll, and put focus back where it was on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowLeft' && onPrev) onPrev()
      else if (event.key === 'ArrowRight' && onNext) onNext()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, onPrev, onNext])

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-plum-900/40 backdrop-blur-[3px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="weekend-dialog-title"
        tabIndex={-1}
        className="max-h-[90dvh] w-full animate-sheet-up overflow-y-auto rounded-t-[2rem] bg-cream-50 p-6 pb-[max(2rem,env(safe-area-inset-bottom))] shadow-lift outline-none sm:max-w-lg sm:animate-scale-in sm:rounded-[2rem] sm:p-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button type="button" className={iconButton} onClick={onPrev} disabled={!onPrev} aria-label="Previous weekend">
              <ChevronLeftIcon className="size-5" />
            </button>
            <button type="button" className={iconButton} onClick={onNext} disabled={!onNext} aria-label="Next weekend">
              <ChevronRightIcon className="size-5" />
            </button>
          </div>
          <button type="button" className={iconButton} onClick={onClose} aria-label="Close">
            <CloseIcon className="size-5" />
          </button>
        </div>

        {/* Keyed so the content gently re-animates when stepping between weekends. */}
        <div key={weekend.id} className="animate-fade-in">
          <p className={`${EYEBROW} mt-5`}>
            Ranked #{rank} of {rankCount}
          </p>
          <h2 id="weekend-dialog-title" className="mt-2 text-5xl leading-none">
            {weekend.titleLabel}
          </h2>
          <p className="mt-2 text-sm text-plum-500">{weekend.longLabel}</p>

          <div className="mt-5 rounded-2xl px-5 py-4" style={{ backgroundColor: level.bg, color: level.fg }}>
            <p className="flex items-center gap-2 font-display text-4xl leading-none">
              {isPerfect && <SparkleIcon className="size-6 text-champagne-300" />}
              {total ? `${availableCount} of ${total}` : 'No replies'}
              <span className="font-sans text-base font-medium opacity-80">can come</span>
            </p>
            {isPerfect && <p className="mt-1.5 text-sm opacity-90">Everyone’s free — nobody has this weekend blocked.</p>}
          </div>

          <h3 className="mt-6 flex items-baseline gap-2 text-2xl">
            Can come <span className="font-sans text-sm font-semibold text-sage-700">({availableCount})</span>
          </h3>
          {available.length === 0 ? (
            <p className="mt-2 text-sm text-plum-500">Nobody can make this one.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {available.map((person) => (
                <PersonChip key={person.id} person={person} tone="bg-sage-100 text-sage-700" />
              ))}
            </ul>
          )}

          <h3 className="mt-6 flex items-baseline gap-2 text-2xl">
            Can’t come <span className="font-sans text-sm font-semibold text-berry-600">({unavailable.length})</span>
          </h3>
          {unavailable.length === 0 ? (
            <p className="mt-2 text-sm text-plum-500">Nobody — everyone’s free!</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {unavailable.map((person) => (
                <PersonChip key={person.id} person={person} tone="bg-blush-100 text-berry-700" />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
