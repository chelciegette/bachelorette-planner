// The dashboard maths: who can attend each weekend, and which weekends win.
// Pure functions — no React, no storage — so they are easy to test.

const byName = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })

/**
 * One entry per weekend:
 *   { weekend, total, available[], unavailable[], availableCount, unavailableCount,
 *     unavailableIds:Set, ratio, isPerfect }
 * `available` / `unavailable` hold response objects sorted by name.
 */
export function computeStats(weekends, responses) {
  const people = [...responses].sort(byName).map((person) => ({ person, blocked: new Set(person.unavailable) }))
  const total = people.length

  return weekends.map((weekend) => {
    const available = []
    const unavailable = []
    for (const { person, blocked } of people) {
      if (blocked.has(weekend.id)) unavailable.push(person)
      else available.push(person)
    }
    return {
      weekend,
      total,
      available,
      unavailable,
      availableCount: available.length,
      unavailableCount: unavailable.length,
      unavailableIds: new Set(unavailable.map((p) => p.id)),
      ratio: total ? available.length / total : 0,
      isPerfect: total > 0 && unavailable.length === 0,
    }
  })
}

/**
 * Most people available first; ties fall back to the earlier date.
 * Tied weekends share a rank ("1, 1, 1, 4 …") so it's obvious which are equally good.
 */
export function rankStats(stats) {
  const sorted = [...stats].sort(
    (a, b) => b.availableCount - a.availableCount || a.weekend.id.localeCompare(b.weekend.id),
  )
  let previousCount = null
  let previousRank = 0
  return sorted.map((stat, index) => {
    const rank = stat.availableCount === previousCount ? previousRank : index + 1
    previousCount = stat.availableCount
    previousRank = rank
    return { ...stat, rank }
  })
}

/** Sorted-by-name copy of the responses (the dashboard's stable "column order"). */
export const sortPeople = (responses) => [...responses].sort(byName)
