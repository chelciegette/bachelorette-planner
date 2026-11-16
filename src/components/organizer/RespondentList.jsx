import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCopy } from '../../hooks/useCopy'
import { formatRelative } from '../../lib/dates'
import { editUrl } from '../../lib/links'
import { WEEKEND_BY_ID } from '../../lib/trip'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import { CheckIcon, LinkIcon, PencilIcon, SparkleIcon, TrashIcon } from '../ui/icons'
import { CARD } from '../ui/styles'

const CHIP_LIMIT = 8

function RespondentCard({ response, onRemove, index }) {
  const [copied, copy] = useCopy()
  const [expanded, setExpanded] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return undefined
    const timer = setTimeout(() => setConfirming(false), 3500)
    return () => clearTimeout(timer)
  }, [confirming])

  const weekends = response.unavailable
    .map((id) => WEEKEND_BY_ID.get(id))
    .filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id))
  const shown = expanded ? weekends : weekends.slice(0, CHIP_LIMIT)
  const hidden = weekends.length - shown.length

  return (
    <li className={`${CARD} flex animate-fade-up flex-col p-5`} style={{ animationDelay: `${index * 40}ms` }}>
      <div className="flex items-center gap-3">
        <Avatar name={response.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-2xl leading-none">{response.name}</h3>
          <p className="mt-1 text-xs text-plum-500">
            {weekends.length === 0 ? 'Free every weekend' : `${weekends.length} weekend${weekends.length === 1 ? '' : 's'} blocked`}
            {' · '}
            {response.updatedAt !== response.submittedAt ? 'updated' : 'sent'} {formatRelative(response.updatedAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex-1">
        {weekends.length === 0 ? (
          <p className="flex items-center gap-1.5 text-sm text-sage-700">
            <SparkleIcon className="size-3.5 text-champagne-500" />
            Available for every weekend
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {shown.map((weekend) => (
              <li key={weekend.id} className="rounded-full bg-blush-100 px-2.5 py-1 text-xs font-medium text-berry-700">
                {weekend.label}
              </li>
            ))}
            {hidden > 0 && (
              <li>
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="rounded-full px-2.5 py-1 text-xs font-medium text-plum-700 underline underline-offset-2"
                >
                  +{hidden} more
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-blush-200/70 pt-4">
        <Button variant="outline" size="sm" onClick={() => copy(editUrl(response.editCode))}>
          {copied ? <CheckIcon className="size-4 text-sage-700" /> : <LinkIcon className="size-4" />}
          {copied ? 'Copied!' : 'Copy edit link'}
        </Button>
        <Link
          to={`/edit/${encodeURIComponent(response.editCode)}`}
          className="inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium text-plum-700 transition hover:bg-blush-100"
        >
          <PencilIcon className="size-4" />
          Open edit page
        </Link>
        <Button
          variant={confirming ? 'danger' : 'ghost'}
          size="sm"
          className="ml-auto"
          onClick={() => (confirming ? onRemove(response.id) : setConfirming(true))}
        >
          <TrashIcon className="size-4" />
          {confirming ? 'Tap to confirm' : 'Remove'}
        </Button>
      </div>
    </li>
  )
}

/** Everyone who has replied, with what they blocked and tools for the organizer. */
export default function RespondentList({ responses, onRemove }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {responses.map((response, index) => (
        <RespondentCard key={response.id} response={response} onRemove={onRemove} index={index} />
      ))}
    </ul>
  )
}
