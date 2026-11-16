import { describe, expect, it } from 'vitest'
import { TRIP } from '../config/trip'
import { buildSeedResponses } from '../data/seed'
import { computeStats, rankStats } from './availability'
import { heatLevel } from './heat'
import { generateWeekends } from './weekends'

const weekends = generateWeekends(TRIP)
const person = (id, name, unavailable) => ({ id, name, unavailable })

describe('computeStats', () => {
  const responses = [
    person('a', 'Ava', ['2027-01-08', '2027-01-15']),
    person('b', 'Bea', ['2027-01-08']),
    person('c', 'Cleo', []),
  ]
  const stats = computeStats(weekends, responses)
  const stat = (id) => stats.find((s) => s.weekend.id === id)

  it('counts who can and cannot attend', () => {
    const jan8 = stat('2027-01-08')
    expect(jan8.total).toBe(3)
    expect(jan8.availableCount).toBe(1)
    expect(jan8.unavailableCount).toBe(2)
    expect(jan8.available.map((p) => p.name)).toEqual(['Cleo'])
    expect(jan8.unavailable.map((p) => p.name)).toEqual(['Ava', 'Bea'])
  })

  it('flags weekends where everyone is free', () => {
    expect(stat('2027-01-01').isPerfect).toBe(true)
    expect(stat('2027-01-15').isPerfect).toBe(false)
  })

  it('handles zero respondents without dividing by zero', () => {
    const empty = computeStats(weekends, [])
    expect(empty.every((s) => s.total === 0 && s.ratio === 0 && !s.isPerfect)).toBe(true)
  })
})

describe('rankStats', () => {
  const responses = [
    person('a', 'Ava', ['2027-01-08', '2027-01-15']),
    person('b', 'Bea', ['2027-01-08']),
    person('c', 'Cleo', []),
  ]
  const ranked = rankStats(computeStats(weekends, responses))

  it('puts the weekends with the most availability first', () => {
    expect(ranked[0].availableCount).toBe(3)
    expect(ranked.at(-1).weekend.id).toBe('2027-01-08') // only 1 of 3 can come
  })

  it('breaks ties by earliest date and gives tied weekends the same rank', () => {
    const perfect = ranked.filter((s) => s.availableCount === 3)
    expect(perfect.map((s) => s.rank)).toEqual(Array(perfect.length).fill(1))
    expect(perfect[0].weekend.id).toBe('2027-01-01')
    const ids = perfect.map((s) => s.weekend.id)
    expect([...ids].sort()).toEqual(ids)
    // next tier starts at rank = (number of perfect weekends) + 1
    expect(ranked[perfect.length].rank).toBe(perfect.length + 1)
  })
})

describe('heatLevel', () => {
  it('maps availability to colour steps', () => {
    expect(heatLevel(8, 8).key).toBe('everyone')
    expect(heatLevel(7, 8).key).toBe('high')
    expect(heatLevel(6, 8).key).toBe('good')
    expect(heatLevel(5, 8).key).toBe('some')
    expect(heatLevel(4, 8).key).toBe('few')
    expect(heatLevel(2, 8).key).toBe('low')
    expect(heatLevel(0, 0).key).toBe('none')
  })
})

describe('sample data', () => {
  const seeded = buildSeedResponses(weekends)
  const ranked = rankStats(computeStats(weekends, seeded))

  it('has several bridesmaids with believable blocked weekends', () => {
    expect(seeded.length).toBeGreaterThanOrEqual(6)
    for (const r of seeded) expect(r.unavailable.length).toBeGreaterThan(5)
  })

  it('leaves a few weekends where everyone is free, and a spread of the rest', () => {
    const perfect = ranked.filter((s) => s.isPerfect)
    expect(perfect.map((s) => s.weekend.id).sort()).toEqual(['2027-03-12', '2027-05-14', '2027-06-11', '2027-08-20'])
    expect(new Set(ranked.map((s) => s.availableCount)).size).toBeGreaterThanOrEqual(5)
  })

  it('makes holiday weekends the hard ones, so the heatmap has a full range of colours', () => {
    const levels = new Set(ranked.map((s) => heatLevel(s.availableCount, s.total).key))
    expect(levels.has('everyone')).toBe(true)
    expect(levels.has('low')).toBe(true)
    const byId = Object.fromEntries(ranked.map((s) => [s.weekend.id, s]))
    expect(byId['2027-07-02'].availableCount).toBeLessThanOrEqual(3) // July 4th weekend
    expect(byId['2027-05-28'].availableCount).toBeLessThanOrEqual(3) // Memorial Day weekend
  })
})
