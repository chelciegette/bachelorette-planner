import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { repository } from '../../data'
import { firstName } from '../../lib/people'
import { forgetEditCode, getRememberedCode } from '../../lib/rememberedCode'
import { HeartIcon } from '../ui/icons'

/** On a device that already submitted: a gentle "update your dates" nudge instead of a duplicate form. */
export default function WelcomeBack() {
  const [match, setMatch] = useState(null)

  useEffect(() => {
    const code = getRememberedCode()
    if (!code) return undefined
    let cancelled = false
    repository
      .getResponseByEditCode(code)
      .then((response) => {
        if (cancelled) return
        if (response) setMatch({ name: response.name, code: response.editCode })
        else forgetEditCode()
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!match) return null
  const name = firstName(match.name)

  return (
    <div className="mx-auto mt-8 flex max-w-xl animate-fade-up flex-col items-center gap-3 rounded-3xl bg-sage-100/80 px-5 py-4 text-center ring-1 ring-sage-300/60 sm:flex-row sm:text-left">
      <HeartIcon className="size-5 shrink-0 text-sage-700" />
      <p className="flex-1 text-[15px] text-sage-700">
        <strong className="font-semibold">Welcome back, {name}!</strong> You’ve already sent your dates from this
        device.
      </p>
      <div className="flex shrink-0 items-center gap-3">
        <Link
          to={`/edit/${encodeURIComponent(match.code)}`}
          className="rounded-full bg-sage-700 px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
        >
          Update my dates
        </Link>
        <button
          type="button"
          onClick={() => {
            forgetEditCode()
            setMatch(null)
          }}
          className="text-sm text-sage-700 underline underline-offset-4"
        >
          Not {name}?
        </button>
      </div>
    </div>
  )
}
