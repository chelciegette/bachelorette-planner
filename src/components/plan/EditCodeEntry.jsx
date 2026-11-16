import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { repository } from '../../data'
import Button from '../ui/Button'
import { ChevronDownIcon, Spinner } from '../ui/icons'

/** Pulls the code out of a pasted edit link, or returns whatever was typed. */
function extractCode(input) {
  const match = String(input).match(/edit\/([^/?#\s]+)/i)
  if (!match) return String(input).trim()
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

/**
 * "Already responded? Update your dates" — paste an edit link or type the personal code.
 * Deliberately not a <form>: it also appears inside the response form, and forms can't nest.
 */
export default function EditCodeEntry({ defaultOpen = false, className = '' }) {
  const navigate = useNavigate()
  const inputId = useId()
  const [open, setOpen] = useState(defaultOpen)
  const [value, setValue] = useState('')
  const [checking, setChecking] = useState(false)
  const [problem, setProblem] = useState('')

  async function findResponse() {
    if (checking) return
    const code = extractCode(value)
    if (!code) {
      setProblem('Type the code you were given, or paste your whole edit link.')
      return
    }
    setChecking(true)
    setProblem('')
    try {
      const found = await repository.getResponseByEditCode(code)
      if (found) navigate(`/edit/${encodeURIComponent(found.editCode)}`)
      else setProblem('Hmm, we couldn’t find that code. Double-check it, or paste your whole edit link.')
    } catch {
      setProblem('Something went wrong looking that up. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className={`mx-auto max-w-xl text-center ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-plum-700 underline decoration-blush-300 decoration-2 underline-offset-4 transition hover:text-berry-600"
      >
        Already responded? Update your dates
        <ChevronDownIcon className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="group" aria-label="Find your response" className="mt-4 animate-fade-up rounded-3xl bg-cream-50/90 p-4 text-left ring-1 ring-blush-200/70 sm:p-5">
          <label htmlFor={inputId} className="block text-sm font-medium text-plum-700">
            Your personal edit code or link
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id={inputId}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault() // Enter must not submit the response form around us
                  findResponse()
                }
              }}
              placeholder="Paste your link or type your code"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="h-12 min-w-0 flex-1 rounded-2xl bg-white px-4 text-[15px] uppercase tracking-wider outline-none ring-1 ring-inset ring-blush-300 transition placeholder:normal-case placeholder:tracking-normal placeholder:text-plum-300 focus:ring-2 focus:ring-berry-500"
            />
            <Button onClick={findResponse} disabled={checking} className="sm:min-w-40">
              {checking ? <Spinner className="size-4" /> : null}
              Find my response
            </Button>
          </div>
          {problem && (
            <p role="alert" className="mt-3 text-sm text-berry-700">
              {problem}
            </p>
          )}
          <p className="mt-3 text-xs text-plum-500">
            You got this code (and a link) right after submitting. No account needed.
          </p>
        </div>
      )}
    </div>
  )
}
