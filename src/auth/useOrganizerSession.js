import { useCallback, useEffect, useState } from 'react'
import { organizerAuth } from '.'

/** { status: 'loading' | 'ready', user, signIn, signOut } for the organizer page. */
export function useOrganizerSession() {
  const [state, setState] = useState({ status: 'loading', user: null })

  useEffect(() => {
    let cancelled = false
    organizerAuth.getSession().then((session) => {
      if (!cancelled) setState({ status: 'ready', user: session?.user ?? null })
    })
    const unsubscribe = organizerAuth.subscribe((session) => {
      setState({ status: 'ready', user: session?.user ?? null })
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const signIn = useCallback((credentials) => organizerAuth.signIn(credentials), [])
  const signOut = useCallback(() => organizerAuth.signOut(), [])

  return { ...state, signIn, signOut }
}
