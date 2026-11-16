import { beforeEach, describe, expect, it } from 'vitest'
import { TRIP } from '../config/trip'
import { generateWeekends } from '../lib/weekends'
import { createLocalStorageRepository } from './localStorageRepository'

const weekends = generateWeekends(TRIP)
let repo

beforeEach(() => {
  repo = createLocalStorageRepository({ weekends, latency: { read: 0, write: 0 } })
})

describe('local storage repository', () => {
  it('starts with sample responses', async () => {
    const list = await repo.listResponses()
    expect(list.length).toBeGreaterThanOrEqual(6)
  })

  it('creates a response with a personal edit code', async () => {
    const result = await repo.saveResponse({ name: '  Zoe  ', unavailable: ['2027-05-14', '2027-05-14', 'not-a-weekend'] })
    expect(result.ok).toBe(true)
    expect(result.created).toBe(true)
    expect(result.response.name).toBe('Zoe')
    expect(result.response.editCode).toMatch(/^[A-Z]+-[A-Z0-9]{5}$/)
    expect(result.response.unavailable).toEqual(['2027-05-14']) // deduped, invalid ids dropped
    expect(await repo.getResponseByEditCode(result.response.editCode)).toMatchObject({ name: 'Zoe' })
  })

  it('replaces the previous answer when editing instead of creating a duplicate', async () => {
    const before = await repo.listResponses()
    const first = await repo.saveResponse({ name: 'Zoe', unavailable: ['2027-05-14'] })
    const second = await repo.saveResponse({
      editCode: first.response.editCode,
      name: 'Zoe',
      unavailable: ['2027-06-11', '2027-06-18'],
    })
    expect(second.ok).toBe(true)
    expect(second.created).toBe(false)
    expect(second.response.id).toBe(first.response.id)
    expect(second.response.unavailable).toEqual(['2027-06-11', '2027-06-18'])

    const after = await repo.listResponses()
    expect(after).toHaveLength(before.length + 1)
    expect(after.filter((r) => r.name === 'Zoe')).toHaveLength(1)
  })

  it('finds a response from a sloppily typed code', async () => {
    const maya = await repo.getResponseByEditCode('  rose maya2 ')
    expect(maya?.name).toBe('Maya')
    expect(await repo.getResponseByEditCode('NOPE-00000')).toBeNull()
  })

  it('refuses a second response under the same name (case-insensitive)', async () => {
    const result = await repo.saveResponse({ name: 'maya', unavailable: [] })
    expect(result).toEqual({ ok: false, error: 'NAME_TAKEN' })
  })

  it('refuses edits with an unknown code and empty names', async () => {
    expect(await repo.saveResponse({ editCode: 'NOPE-00000', name: 'Zoe', unavailable: [] })).toEqual({
      ok: false,
      error: 'CODE_NOT_FOUND',
    })
    expect(await repo.saveResponse({ name: '   ', unavailable: [] })).toEqual({ ok: false, error: 'NAME_REQUIRED' })
  })

  it('lets someone rename herself, but not into another bridesmaid’s name', async () => {
    const zoe = await repo.saveResponse({ name: 'Zoe', unavailable: [] })
    const taken = await repo.saveResponse({ editCode: zoe.response.editCode, name: 'Priya', unavailable: [] })
    expect(taken).toEqual({ ok: false, error: 'NAME_TAKEN' })
    const renamed = await repo.saveResponse({ editCode: zoe.response.editCode, name: 'Zoe B', unavailable: [] })
    expect(renamed.ok).toBe(true)
  })

  it('notifies subscribers, deletes, clears and resets', async () => {
    let calls = 0
    const unsubscribe = repo.subscribe(() => {
      calls += 1
    })
    await repo.saveResponse({ name: 'Zoe', unavailable: [] })
    expect(calls).toBe(1)

    const zoe = (await repo.listResponses()).find((r) => r.name === 'Zoe')
    await repo.deleteResponse(zoe.id)
    expect((await repo.listResponses()).some((r) => r.name === 'Zoe')).toBe(false)

    await repo.clearAll()
    expect(await repo.listResponses()).toHaveLength(0)

    await repo.resetDemoData()
    expect((await repo.listResponses()).length).toBeGreaterThanOrEqual(6)

    unsubscribe()
    const before = calls
    await repo.clearAll()
    expect(calls).toBe(before)
  })
})
