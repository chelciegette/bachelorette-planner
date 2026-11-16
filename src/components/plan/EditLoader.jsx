import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { repository } from '../../data'
import { rememberEditCode } from '../../lib/rememberedCode'
import PageLoader from '../ui/PageLoader'
import { CARD } from '../ui/styles'
import EditCodeEntry from './EditCodeEntry'
import ResponseForm from './ResponseForm'

/** Opens `#/edit/:code`: loads that bridesmaid's response, or explains what went wrong. */
export default function EditLoader({ code }) {
  const [state, setState] = useState({ status: 'loading', response: null })

  useEffect(() => {
    let cancelled = false
    repository
      .getResponseByEditCode(code)
      .then((response) => {
        if (cancelled) return
        if (response) {
          rememberEditCode(response.editCode) // so this device offers "update" next time too
          setState({ status: 'found', response })
        } else {
          setState({ status: 'missing', response: null })
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', response: null })
      })
    return () => {
      cancelled = true
    }
  }, [code])

  if (state.status === 'loading') return <PageLoader label="Finding your response…" />
  if (state.status === 'found') return <ResponseForm initial={state.response} />

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <div className={`${CARD} animate-fade-up p-8`}>
        <h1 className="text-5xl leading-none">
          Hmm, <span className="italic text-berry-600">that link</span> didn’t work
        </h1>
        <p className="mt-4 text-plum-700">
          {state.status === 'error'
            ? 'We had trouble looking up your response. Please try again in a moment.'
            : 'We couldn’t find a response for that edit code. It may have been mistyped, or the response was removed.'}
        </p>
        <EditCodeEntry defaultOpen className="mt-6" />
        <p className="mt-6 text-sm text-plum-500">
          Haven’t responded yet?{' '}
          <Link to="/" className="font-medium text-berry-600 underline underline-offset-4">
            Start here
          </Link>
        </p>
      </div>
    </div>
  )
}
