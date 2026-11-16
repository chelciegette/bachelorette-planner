import { useCallback, useMemo, useRef, useState } from 'react'
import { repository } from '../../data'
import { useCopy } from '../../hooks/useCopy'
import { useResponses } from '../../hooks/useResponses'
import { computeStats, rankStats, sortPeople } from '../../lib/availability'
import { shareUrl } from '../../lib/links'
import { WEEKENDS } from '../../lib/trip'
import Button from '../ui/Button'
import { CheckIcon, LinkIcon } from '../ui/icons'
import PageLoader from '../ui/PageLoader'
import { EYEBROW } from '../ui/styles'
import BestWeekends from './BestWeekends'
import EmptyState from './EmptyState'
import Heatmap, { HeatLegend } from './Heatmap'
import RankedList from './RankedList'
import RespondentList from './RespondentList'
import WeekendDialog from './WeekendDialog'

function Section({ id, eyebrow, title, aside, children, innerRef }) {
  return (
    <section id={id} ref={innerRef} className="mt-14 scroll-mt-6 sm:mt-16" aria-labelledby={`${id}-title`}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className={EYEBROW}>{eyebrow}</p>
          <h2 id={`${id}-title`} className="mt-2 text-4xl leading-none sm:text-5xl">
            {title}
          </h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

/** Everything the organizer sees once signed in. */
export default function Dashboard({ signOut }) {
  const { status, responses } = useResponses()
  const [openId, setOpenId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [copied, copy] = useCopy()
  const [removeError, setRemoveError] = useState('')
  const rankingRef = useRef(null)

  const people = useMemo(() => sortPeople(responses), [responses])
  // Every weekend with its counts and rank; recomputed whenever a response changes.
  const ranked = useMemo(() => rankStats(computeStats(WEEKENDS, responses)), [responses])
  const statsById = useMemo(() => new Map(ranked.map((s) => [s.weekend.id, s])), [ranked])

  const openWeekend = useCallback((id) => setOpenId(id), [])
  const closeWeekend = useCallback(() => setOpenId(null), [])

  const openIndex = openId ? WEEKENDS.findIndex((w) => w.id === openId) : -1
  const prevId = openIndex > 0 ? WEEKENDS[openIndex - 1].id : null
  const nextId = openIndex >= 0 && openIndex < WEEKENDS.length - 1 ? WEEKENDS[openIndex + 1].id : null
  const goPrev = useCallback(() => prevId && setOpenId(prevId), [prevId])
  const goNext = useCallback(() => nextId && setOpenId(nextId), [nextId])

  const removeResponse = useCallback(async (id) => {
    setRemoveError('')
    try {
      await repository.deleteResponse(id)
    } catch (error) {
      setRemoveError(error?.message || 'Couldn’t remove that response. Please try again.')
    }
  }, [])

  if (status === 'loading') return <PageLoader label="Gathering replies…" />
  if (status === 'error') {
    return (
      <p className="px-4 py-24 text-center text-berry-700" role="alert">
        We couldn’t load the responses. Please refresh and try again.
      </p>
    )
  }

  const total = responses.length
  const openStat = openId ? statsById.get(openId) : null
  const copyLink = () => copy(shareUrl())

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="animate-fade-up">
          <p className={EYEBROW}>Organizer dashboard</p>
          <h1 className="mt-3 text-balance text-5xl leading-[1] sm:text-6xl">
            Find the <span className="italic text-berry-600">perfect</span> weekend
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 animate-fade-up" style={{ animationDelay: '80ms' }}>
          <Button variant="outline" onClick={copyLink}>
            {copied ? <CheckIcon className="size-4 text-sage-700" /> : <LinkIcon className="size-4" />}
            {copied ? 'Link copied!' : 'Copy bridesmaid link'}
          </Button>
          <Button variant="ghost" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>

      <div className="mt-8">
        {total === 0 ? (
          <EmptyState onCopyLink={copyLink} copied={copied} />
        ) : (
          <BestWeekends
            ranked={ranked}
            people={people}
            total={total}
            onOpen={openWeekend}
            onShowEveryone={() => {
              setFilter('everyone')
              rankingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          />
        )}
      </div>

      <Section
        id="calendar"
        eyebrow="At a glance"
        title="Availability heatmap"
        aside={<HeatLegend />}
      >
        <Heatmap statsById={statsById} openId={openId} onOpen={openWeekend} />
        <p className="mt-3 text-center text-xs text-plum-500">
          Each weekend shows how many bridesmaids can come. Tap any weekend to see exactly who.
        </p>
      </Section>

      {total > 0 && (
        <Section id="ranking" eyebrow="Best to worst" title="Weekend ranking" innerRef={rankingRef}>
          <RankedList
            ranked={ranked}
            people={people}
            filter={filter}
            onFilter={setFilter}
            openId={openId}
            onOpen={openWeekend}
          />
        </Section>
      )}

      {total > 0 && (
        <Section
          id="people"
          eyebrow={`${total} ${total === 1 ? 'reply' : 'replies'}`}
          title="Who’s responded"
        >
          {removeError && (
            <p role="alert" className="mb-4 rounded-2xl bg-blush-100 px-4 py-3 text-sm text-berry-700">
              {removeError}
            </p>
          )}
          <RespondentList responses={responses} onRemove={removeResponse} />
        </Section>
      )}

      {openStat && (
        <WeekendDialog
          stat={openStat}
          rankCount={WEEKENDS.length}
          onClose={closeWeekend}
          onPrev={prevId ? goPrev : null}
          onNext={nextId ? goNext : null}
        />
      )}
    </div>
  )
}
