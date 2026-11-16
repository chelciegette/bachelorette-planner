import { useInView } from '../../hooks/useInView'
import { ArrowDownIcon } from '../ui/icons'

/**
 * Phones only: a floating "N blocked — Review & submit" pill while the real
 * summary (and Submit button) is still off-screen, so nobody has to hunt for it.
 */
export default function ReviewBar({ count, targetRef }) {
  const targetVisible = useInView(targetRef)
  if (count === 0 || targetVisible) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 animate-sheet-up px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] md:hidden">
      <button
        type="button"
        onClick={() => targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
        className="pointer-events-auto mx-auto flex w-full max-w-sm items-center justify-between gap-3 rounded-full bg-plum-900/95 py-2.5 pl-5 pr-3 text-cream-50 shadow-lift backdrop-blur"
      >
        <span className="text-sm">
          <strong className="font-semibold">{count}</strong> weekend{count === 1 ? '' : 's'} blocked
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-br from-berry-500 to-berry-600 px-4 py-2 text-sm font-medium">
          Review &amp; submit
          <ArrowDownIcon className="size-4" />
        </span>
      </button>
    </div>
  )
}
