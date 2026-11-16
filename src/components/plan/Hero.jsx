import { monthName, parseISO } from '../../lib/dates'
import { TRIP } from '../../lib/trip'
import { SparkleIcon } from '../ui/icons'
import { EYEBROW } from '../ui/styles'

function rangeLabel() {
  const start = parseISO(TRIP.dateRange.start)
  const end = parseISO(TRIP.dateRange.end)
  const from = monthName(start.getMonth()).slice(0, 3)
  const to = monthName(end.getMonth()).slice(0, 3)
  if (start.getFullYear() === end.getFullYear()) return `${from} – ${to} ${end.getFullYear()}`
  return `${from} ${start.getFullYear()} – ${to} ${end.getFullYear()}`
}

function Squiggle() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      className="absolute -bottom-2 left-0 h-3 w-full text-champagne-500/80"
    >
      <path
        d="M3 6q12-6 24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/** `mode` is 'new' for a first response, or 'edit' with the bridesmaid's first name. */
export default function Hero({ mode = 'new', firstName = '' }) {
  const brand = TRIP.brideName ? `${TRIP.brideName}’s Bachelorette` : 'Bachelorette Weekend'

  return (
    <header className="relative mx-auto max-w-3xl text-center">
      <SparkleIcon className="absolute -left-1 top-10 hidden size-5 animate-float text-champagne-500/80 sm:block" />
      <SparkleIcon
        className="absolute -right-2 top-24 hidden size-3.5 animate-float text-blush-400 sm:block"
        style={{ animationDelay: '-3s' }}
      />

      <p className={`${EYEBROW} animate-fade-up`}>
        {mode === 'edit' ? 'Editing your response' : `${brand} · ${rangeLabel()}`}
      </p>

      <h1
        className="mt-4 animate-fade-up text-balance text-[3.1rem] leading-[0.98] sm:text-7xl"
        style={{ animationDelay: '80ms' }}
      >
        {mode === 'edit' ? (
          <>
            Welcome back,{' '}
            <span className="relative inline-block italic text-berry-600">
              {firstName}
              <Squiggle />
            </span>
            !
          </>
        ) : (
          <>
            Let’s Plan the{' '}
            <span className="relative inline-block italic text-berry-600">
              Bachelorette!
              <Squiggle />
            </span>
          </>
        )}
      </h1>

      <p
        className="mx-auto mt-6 max-w-xl animate-fade-up text-balance text-lg leading-relaxed text-plum-700 sm:text-xl"
        style={{ animationDelay: '160ms' }}
      >
        {mode === 'edit' ? (
          <>Change your name or weekends below. Saving replaces your previous answers — nothing gets duplicated.</>
        ) : (
          <>
            Enter your name and select any weekends you{' '}
            <strong className="font-semibold text-berry-600">CANNOT</strong> attend.
          </>
        )}
      </p>
    </header>
  )
}
