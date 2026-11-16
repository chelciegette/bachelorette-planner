import { useState } from 'react'
import { repository } from '../../data'
import Button from '../ui/Button'
import { RefreshIcon, Spinner, UsersIcon } from '../ui/icons'
import { CARD } from '../ui/styles'

/** Shown before anyone has replied. */
export default function EmptyState({ onCopyLink, copied }) {
  const [loading, setLoading] = useState(false)
  const canLoadSamples = typeof repository.resetDemoData === 'function'

  async function loadSamples() {
    setLoading(true)
    await repository.resetDemoData()
    setLoading(false)
  }

  return (
    <section className={`${CARD} animate-fade-up px-6 py-14 text-center`}>
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-blush-100 text-berry-600">
        <UsersIcon className="size-6" />
      </span>
      <h2 className="mt-5 text-5xl leading-none">
        No replies <span className="italic text-berry-600">yet</span>
      </h2>
      <p className="mx-auto mt-4 max-w-md text-plum-700">
        Send your bridesmaids the link. As soon as someone submits, their weekends show up here and the rankings update
        by themselves.
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button onClick={onCopyLink}>{copied ? 'Link copied!' : 'Copy bridesmaid link'}</Button>
        {canLoadSamples && (
          <Button variant="outline" onClick={loadSamples} disabled={loading}>
            {loading ? <Spinner className="size-4" /> : <RefreshIcon className="size-4" />}
            Load sample responses
          </Button>
        )}
      </div>
    </section>
  )
}
