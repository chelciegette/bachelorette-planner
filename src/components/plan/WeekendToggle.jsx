import SegmentDays from '../calendar/SegmentDays'
import { CloseIcon } from '../ui/icons'

/** A weekend on the bridesmaid's calendar: tap to mark "I can't make it", tap again to undo. */
export default function WeekendToggle({ seg, selected, onToggle }) {
  const { weekend, cells, span, radius } = seg

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${weekend.longLabel}. ${selected ? 'Marked as can’t attend. Tap to undo.' : 'Tap if you can’t attend.'}`}
      onClick={() => onToggle(weekend.id)}
      style={{ gridColumn: `span ${span}` }}
      className={[
        'group relative flex h-13 touch-manipulation select-none items-center text-[15px] font-medium',
        'transition duration-200 ease-out active:scale-[0.97]',
        radius,
        selected
          ? 'animate-pop bg-linear-to-br from-berry-500 to-berry-600 text-white shadow-berry'
          : 'bg-white text-plum-900 ring-1 ring-inset ring-blush-200 hover:-translate-y-px hover:bg-blush-50 hover:ring-blush-300',
      ].join(' ')}
    >
      <SegmentDays cells={cells} className="text-center" />
      {selected && (
        <span className="absolute -right-1.5 -top-1.5 z-10 grid size-[18px] animate-badge-in place-items-center rounded-full bg-cream-50 text-berry-600 shadow-sm ring-1 ring-berry-500/30">
          <CloseIcon className="size-2.5" />
        </span>
      )}
    </button>
  )
}
