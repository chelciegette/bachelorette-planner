import { useEffect, useState } from 'react'
import { repository } from '../data'

/** Organizer data: everyone's responses, kept live as people submit. */
export function useResponses() {
  const [state, setState] = useState({ status: 'loading', responses: [], error: null })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const responses = await repository.listResponses()
        if (!cancelled) setState({ status: 'ready', responses, error: null })
      } catch (error) {
        if (!cancelled) setState((prev) => ({ ...prev, status: 'error', error }))
      }
    }

    load()
    const unsubscribe = repository.subscribe(load)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return state
}
