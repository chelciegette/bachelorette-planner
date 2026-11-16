import { useId, useState } from 'react'
import Button from '../components/ui/Button'
import { LockIcon, Spinner } from '../components/ui/icons'
import { CARD, EYEBROW } from '../components/ui/styles'
import { organizerAuth } from '.'

const inputClass =
  'h-12 w-full rounded-2xl bg-white px-4 text-[15px] outline-none ring-1 ring-inset ring-blush-300 transition placeholder:text-plum-300 focus:ring-2 focus:ring-berry-500'

/** Real sign-in: email + password (the organizer account lives in Supabase Auth). */
function PasswordForm({ signIn }) {
  const emailId = useId()
  const passwordId = useId()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const result = await signIn({ email, password })
    setBusy(false)
    if (!result.ok) setError(result.error)
    // On success the session listener swaps this screen for the dashboard.
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-3 text-left">
      <div>
        <label htmlFor={emailId} className="mb-1.5 block text-sm font-medium text-plum-700">
          Email
        </label>
        <input
          id={emailId}
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor={passwordId} className="mb-1.5 block text-sm font-medium text-plum-700">
          Password
        </label>
        <input
          id={passwordId}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </div>
      {error && (
        <p role="alert" className="rounded-2xl bg-blush-100 px-4 py-3 text-sm text-berry-700">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="mt-2 w-full" disabled={busy}>
        {busy ? <Spinner className="size-5" /> : null}
        Sign in
      </Button>
    </form>
  )
}

/** Demo mode: no credentials, just a button (see src/auth/organizerAuth.js for why). */
function DemoEntry({ signIn }) {
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    setBusy(true)
    await signIn()
    setBusy(false)
  }

  return (
    <>
      <Button size="lg" className="mt-8 w-full sm:w-auto" onClick={handleClick} disabled={busy}>
        {busy ? <Spinner className="size-5" /> : null}
        Enter the demo dashboard
      </Button>
      <p className="mt-8 rounded-2xl bg-champagne-100 px-4 py-3 text-left text-sm leading-relaxed text-champagne-700">
        <strong className="font-semibold">Demo mode — not secure on purpose.</strong> A password written into
        front-end code can be read by anyone, so there isn’t one. Once Supabase is connected, this becomes a real
        sign-in and the database decides who may see responses.
      </p>
    </>
  )
}

/**
 * The organizer's front door. Which version appears depends on the connected
 * sign-in (src/auth/index.js); the rest of the organizer page doesn't care.
 */
export default function OrganizerSignIn({ signIn }) {
  const isDemo = organizerAuth.meta.kind === 'demo'

  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:px-6 sm:py-24">
      <div className={`${CARD} animate-fade-up p-8 text-center sm:p-10`}>
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-blush-100 text-berry-600">
          <LockIcon className="size-6" />
        </span>
        <p className={`${EYEBROW} mt-6`}>Organizer area</p>
        <h1 className="mt-3 text-balance text-5xl leading-[1.02]">
          Your planning <span className="italic text-berry-600">headquarters</span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-plum-700">
          See who’s replied, which weekends work, and pick the best date for everyone.
        </p>

        {isDemo ? <DemoEntry signIn={signIn} /> : <PasswordForm signIn={signIn} />}
      </div>
    </div>
  )
}
