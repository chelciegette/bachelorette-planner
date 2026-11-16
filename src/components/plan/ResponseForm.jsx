import { useCallback, useEffect, useRef, useState } from 'react'
import { repository } from '../../data'
import { firstName } from '../../lib/people'
import { rememberEditCode } from '../../lib/rememberedCode'
import Button from '../ui/Button'
import { Spinner } from '../ui/icons'
import { CARD } from '../ui/styles'
import AvailabilityCalendar from './AvailabilityCalendar'
import EditCodeEntry from './EditCodeEntry'
import Hero from './Hero'
import NameField from './NameField'
import ReviewBar from './ReviewBar'
import SavedCard from './SavedCard'
import SelectionSummary from './SelectionSummary'
import StepHeading from './StepHeading'
import WelcomeBack from './WelcomeBack'

const MESSAGES = {
  NAME_REQUIRED: 'Please add your name so we know who’s who.',
  CODE_NOT_FOUND:
    'We couldn’t find your saved response any more, so we’ll start a fresh one. Tap submit again to send your dates.',
  LIMIT_REACHED: 'This form isn’t accepting new responses right now. Please let the organizer know.',
  GENERIC: 'Something went wrong saving your dates. Please try again in a moment.',
}

/**
 * The whole bridesmaid experience: name → tap weekends → review → submit → confirmation.
 * Pass `initial` (a saved response) to edit instead of creating.
 */
export default function ResponseForm({ initial = null }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [selected, setSelected] = useState(() => new Set(initial?.unavailable ?? []))
  const [editCode, setEditCode] = useState(initial?.editCode ?? null)
  const [phase, setPhase] = useState('editing') // 'editing' | 'saving' | 'saved'
  const [problem, setProblem] = useState(null) // { field: 'name' | 'form', code?, message }
  const [shake, setShake] = useState(false)
  const [saved, setSaved] = useState(null) // { response, wasUpdate }
  const nameRef = useRef(null)
  const summaryRef = useRef(null)
  const isEditing = Boolean(editCode)

  const toggle = useCallback((id) => {
    setSelected((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const remove = useCallback((id) => {
    setSelected((previous) => {
      const next = new Set(previous)
      next.delete(id)
      return next
    })
  }, [])

  function showNameProblem(next) {
    setProblem({ field: 'name', ...next })
    setShake(true)
  }

  // The name field sits at the top of the page and the submit button at the bottom,
  // so a name problem must pull the visitor back up to where the message is. This
  // runs after the message has rendered: scrolling earlier gets cancelled when the
  // browser re-anchors the page around the new content.
  useEffect(() => {
    if (problem?.field !== 'name') return
    nameRef.current?.focus({ preventScroll: true })
    nameRef.current?.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [problem])

  async function handleSubmit(event) {
    event.preventDefault()
    if (phase === 'saving') return
    if (!name.trim()) {
      showNameProblem({ message: MESSAGES.NAME_REQUIRED })
      return
    }

    setPhase('saving')
    setProblem(null)
    try {
      const result = await repository.saveResponse({ editCode, name, unavailable: [...selected] })

      if (!result.ok) {
        setPhase('editing')
        if (result.error === 'NAME_TAKEN') {
          showNameProblem({ code: 'NAME_TAKEN', message: `Someone named “${name.trim()}” has already responded.` })
        } else if (result.error === 'CODE_NOT_FOUND') {
          setEditCode(null)
          setProblem({ field: 'form', message: MESSAGES.CODE_NOT_FOUND })
        } else if (result.error === 'NAME_REQUIRED') {
          showNameProblem({ message: MESSAGES.NAME_REQUIRED })
        } else if (result.error === 'LIMIT_REACHED') {
          setProblem({ field: 'form', message: MESSAGES.LIMIT_REACHED })
        } else {
          setProblem({ field: 'form', message: MESSAGES.GENERIC })
        }
        return
      }

      rememberEditCode(result.response.editCode)
      setEditCode(result.response.editCode)
      setSaved({ response: result.response, wasUpdate: !result.created })
      setPhase('saved')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setPhase('editing')
      setProblem({ field: 'form', message: MESSAGES.GENERIC })
    }
  }

  const wrapper = 'mx-auto max-w-6xl px-4 pb-28 pt-10 sm:px-6 sm:pt-14 md:pb-16'

  if (phase === 'saved' && saved) {
    return (
      <div className={wrapper}>
        <SavedCard
          response={saved.response}
          wasUpdate={saved.wasUpdate}
          onEdit={() => {
            setPhase('editing')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      </div>
    )
  }

  const saving = phase === 'saving'
  const nameProblem = problem?.field === 'name' ? problem : null

  return (
    <div className={wrapper}>
      <Hero mode={initial ? 'edit' : 'new'} firstName={firstName(initial?.name ?? '')} />
      {!initial && <WelcomeBack />}

      <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-8 sm:mt-12">
        <div className="mx-auto max-w-2xl">
          <NameField
            value={name}
            onChange={(value) => {
              setName(value)
              if (problem?.field === 'name') setProblem(null)
            }}
            inputRef={nameRef}
            invalid={Boolean(nameProblem)}
            shake={shake}
            onShakeEnd={() => setShake(false)}
          >
            {nameProblem && (
              <div id="bridesmaid-name-problem" role="alert" className="mt-3 text-sm text-berry-700">
                <p>{nameProblem.message}</p>
                {nameProblem.code === 'NAME_TAKEN' && (
                  <>
                    <p className="mt-1 text-plum-700">
                      If that’s you, use your personal edit code to update your answers. If you’re a different{' '}
                      {firstName(name)}, add a last initial above.
                    </p>
                    <EditCodeEntry defaultOpen className="mt-3 !max-w-none !text-left" />
                  </>
                )}
              </div>
            )}
          </NameField>
        </div>

        <section aria-labelledby="calendar-heading">
          <div className="mb-5">
            <StepHeading number={2}>
              <span id="calendar-heading">Weekends you can’t make</span>
            </StepHeading>
            <p className="-mt-1 text-[15px] text-plum-700 sm:pl-10">
              Tap a weekend to mark it as unavailable. Tap it again to undo. Leave everything else alone — you’ll be
              counted as free.
            </p>
          </div>
          <AvailabilityCalendar selected={selected} onToggle={toggle} />
        </section>

        <div ref={summaryRef} className="mx-auto max-w-2xl scroll-mt-6">
          <section className={`${CARD} p-5 sm:p-6`}>
            <StepHeading number={3}>Review &amp; send</StepHeading>
            <SelectionSummary selected={selected} onRemove={remove} onClear={() => setSelected(new Set())} />

            {problem?.field === 'form' && (
              <p role="alert" className="mt-4 rounded-2xl bg-blush-100 px-4 py-3 text-sm text-berry-700">
                {problem.message}
              </p>
            )}

            <Button type="submit" size="lg" disabled={saving} className="mt-6 w-full">
              {saving ? <Spinner className="size-5" /> : null}
              {saving ? 'Saving…' : isEditing ? 'Update My Dates' : 'Submit My Dates'}
            </Button>
            <p className="mt-3 text-center text-sm text-plum-500">
              {isEditing
                ? 'Saving replaces your previous answers.'
                : 'No account needed — you’ll get a personal link to change your answers later.'}
            </p>
          </section>
        </div>
      </form>

      {!initial && <EditCodeEntry className="mt-10" />}
      <ReviewBar count={selected.size} targetRef={summaryRef} />
    </div>
  )
}
