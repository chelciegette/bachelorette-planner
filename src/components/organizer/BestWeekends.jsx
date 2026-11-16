import { SparkleIcon } from '../ui/icons'
import { EYEBROW } from '../ui/styles'
import PersonPips from './PersonPips'

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/70 px-4 py-3 text-center ring-1 ring-blush-200/60">
      <dd className="font-display text-4xl leading-none tabular-nums">{value}</dd>
      <dt className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-plum-500">{label}</dt>
    </div>
  )
}

function names(list) {
  if (list.length <= 3) return list.map((p) => p.name).join(', ')
  return `${list
    .slice(0, 2)
    .map((p) => p.name)
    .join(', ')} +${list.length - 2} more`
}

function PickCard({ stat, people, onOpen, index }) {
  const { weekend, rank, isPerfect } = stat
  return (
    <li className="animate-fade-up" style={{ animationDelay: `${120 + index * 80}ms` }}>
      <button
        type="button"
        onClick={() => onOpen(weekend.id)}
        className="group flex h-full w-full flex-col rounded-3xl bg-cream-50 p-5 text-left ring-1 ring-blush-200 shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-lift"
      >
        <div className="flex items-center justify-between">
          <span
            className={`grid size-8 place-items-center rounded-full text-sm font-semibold ${
              isPerfect ? 'bg-sage-700 text-white' : 'bg-blush-100 text-berry-700'
            }`}
          >
            {rank}
          </span>
          {isPerfect && (
            <span className="inline-flex items-center gap-1 rounded-full bg-champagne-100 px-2.5 py-1 text-xs font-semibold text-champagne-700">
              <SparkleIcon className="size-3 text-champagne-500" />
              Everyone free
            </span>
          )}
        </div>
        <p className="mt-4 font-display text-4xl leading-none">{weekend.titleLabel}</p>
        <p className="mt-1.5 text-sm text-plum-500">
          {weekend.start.toLocaleDateString('en-US', { weekday: 'long' })} –{' '}
          {weekend.end.toLocaleDateString('en-US', { weekday: 'long' })}
        </p>

        <PersonPips people={people} stat={stat} className="mt-5" />
        <p className="mt-2 text-sm">
          <strong className="font-semibold">
            {stat.availableCount} of {stat.total}
          </strong>{' '}
          can come
        </p>
        <p className="mt-1 text-[13px] text-plum-500">
          {isPerfect ? 'Nobody’s busy — lock it in!' : `Can’t: ${names(stat.unavailable)}`}
        </p>
      </button>
    </li>
  )
}

/** The headline: how many weekends work for everyone, plus the top three picks. */
export default function BestWeekends({ ranked, people, total, onOpen, onShowEveryone }) {
  const perfect = ranked.filter((s) => s.isPerfect)
  const top = ranked.slice(0, 3)
  const best = ranked[0]

  return (
    <section
      aria-labelledby="best-heading"
      className="rounded-[2rem] bg-linear-to-br from-blush-100 via-cream-50 to-champagne-100 p-5 ring-1 ring-blush-200/70 shadow-soft sm:p-8"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className={EYEBROW}>The short list</p>
          <h2 id="best-heading" className="mt-3 text-balance text-4xl leading-[1.04] sm:text-5xl">
            {perfect.length > 0 ? (
              <>
                <span className="italic text-sage-700">
                  {perfect.length} weekend{perfect.length === 1 ? '' : 's'}
                </span>{' '}
                {perfect.length === 1 ? 'works' : 'work'} for everyone
              </>
            ) : (
              <>
                No weekend works for <span className="italic text-berry-600">everyone</span> — yet
              </>
            )}
          </h2>
          <p className="mt-3 text-plum-700">
            {perfect.length > 0
              ? `All ${total} bridesmaids are free on ${perfect.length === 1 ? 'this one' : 'these'}. Here are the top picks.`
              : `The closest is ${best.weekend.label}, with ${best.availableCount} of ${total} able to come.`}
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:w-[26rem]">
          <Stat label="Replies" value={total} />
          <Stat label="Perfect" value={perfect.length} />
          <Stat label="Best turnout" value={`${best.availableCount}/${total}`} />
        </dl>
      </div>

      <ol className="mt-7 grid gap-3 md:grid-cols-3">
        {top.map((stat, index) => (
          <PickCard key={stat.weekend.id} stat={stat} people={people} onOpen={onOpen} index={index} />
        ))}
      </ol>

      {perfect.length > 3 && (
        <p className="mt-5 text-center text-sm text-plum-700">
          Plus {perfect.length - 3} more where everyone’s free.{' '}
          <button
            type="button"
            onClick={onShowEveryone}
            className="font-medium text-berry-600 underline decoration-blush-300 decoration-2 underline-offset-4"
          >
            See them all
          </button>
        </p>
      )}
    </section>
  )
}
