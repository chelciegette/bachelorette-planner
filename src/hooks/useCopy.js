import { useCallback, useEffect, useRef, useState } from 'react'
import { copyText } from '../lib/clipboard'

/** `const [copied, copy] = useCopy()` — `copied` is true for a moment after a successful copy. */
export function useCopy(resetAfterMs = 1800) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback(
    async (text) => {
      const ok = await copyText(text)
      if (ok) {
        setCopied(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), resetAfterMs)
      }
      return ok
    },
    [resetAfterMs],
  )

  return [copied, copy]
}
