import { useCopy } from '../../hooks/useCopy'
import { editUrl } from '../../lib/links'
import { firstName } from '../../lib/people'
import { TOTAL_WEEKENDS, WEEKEND_BY_ID } from '../../lib/trip'
import Button from '../ui/Button'
import { CheckIcon, CopyIcon, LinkIcon, PencilIcon } from '../ui/icons'
import { CARD, EYEBROW } from '../ui/styles'

function CopyButton({ text, label }) {
  const [copied, copy] = useCopy()
  return (
    <Button variant={copied ? 'soft' : 'outline'} size="sm" onClick={() => copy(text)} className="shrink-0">
      {copied ? <CheckIcon className="size-4 text-sage-700" /> : <CopyIcon className="size-4" />}
      {copied ? 'Copied!' : label}
    </Button>
  )
}

/** The friendly confirmation after submitting, including the personal link for editing later. */
export default function SavedCard({ response, wasUpdate, onEdit }) {
  const weekends = response.unavailable
    .map((id) => WEEKEND_BY_ID.get(id))
    .filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id))
  const link = editUrl(response.editCode)

  return (
    <section className="mx-auto max-w-2xl animate-fade-up text-center" aria-live="polite">
      <div className="mx-auto grid size-24 place-items-center rounded-full bg-sage-100 text-sage-700 ring-8 ring-sage-100/50">
        <svg viewBox="0 0 24 24" className="size-11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="1"
            className="animate-draw"
          />
        </svg>
      </div>

      <p className={`${EYEBROW} mt-8`}>{wasUpdate ? 'Response updated' : 'Response received'}</p>
      <h1 className="mt-3 text-balance text-5xl leading-[1.02] sm:text-6xl">
        {wasUpdate ? 'All updated, ' : 'Thank you, '}
        <span className="italic text-berry-600">{firstName(response.name)}</span>!
      </h1>
      <p className="mx-auto mt-5 max-w-md text-lg text-plum-700">
        {weekends.length === 0
          ? 'We’ve got you down as free for every weekend. Amazing!'
          : `We’ve saved ${weekends.length} unavailable weekend${weekends.length === 1 ? '' : 's'}, which leaves you free for ${TOTAL_WEEKENDS - weekends.length} of ${TOTAL_WEEKENDS}.`}
      </p>

      {weekends.length > 0 && (
        <ul className="mt-5 flex flex-wrap justify-center gap-2">
          {weekends.map((weekend, index) => (
            <li
              key={weekend.id}
              className="animate-scale-in rounded-full bg-blush-100 px-3.5 py-1.5 text-sm font-medium text-berry-700 ring-1 ring-inset ring-blush-300/70"
              style={{ animationDelay: `${300 + index * 40}ms` }}
            >
              {weekend.label}
            </li>
          ))}
        </ul>
      )}

      <div className={`${CARD} mt-10 p-5 text-left sm:p-6`}>
        <h2 className="flex items-center gap-2 text-2xl">
          <LinkIcon className="size-5 text-berry-500" />
          Your personal edit link
        </h2>
        <p className="mt-2 text-[15px] text-plum-700">
          Plans change! Save this link (or the code) to update your dates any time. No account needed — and it
          replaces this answer, so nothing gets duplicated.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            readOnly
            value={link}
            aria-label="Your personal edit link"
            onFocus={(event) => event.target.select()}
            className="h-11 min-w-0 flex-1 rounded-2xl bg-white px-4 text-sm text-plum-700 outline-none ring-1 ring-inset ring-blush-300 focus:ring-2 focus:ring-berry-500"
          />
          <CopyButton text={link} label="Copy link" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-sm text-plum-500">Or use your code:</span>
          <code className="rounded-xl bg-champagne-100 px-3 py-1.5 text-base font-semibold tracking-wider text-champagne-700">
            {response.editCode}
          </code>
          <CopyButton text={response.editCode} label="Copy code" />
        </div>
      </div>

      <Button variant="ghost" className="mt-6" onClick={onEdit}>
        <PencilIcon className="size-4" />
        Change my answers
      </Button>
    </section>
  )
}
