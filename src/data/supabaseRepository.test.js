// The real Supabase repository + the real SQL: every call goes through the adapter into
// an in-process Postgres running the actual migration, as anon or as the organizer.

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { TRIP } from '../config/trip'
import { generateWeekends } from '../lib/weekends'
import { createSupabaseRepository } from './supabaseRepository'
import { addUser, createFakeSupabase, createTestDatabase } from './testing/pgliteSupabase'

const weekends = generateWeekends(TRIP)
let db
let users

/** A repository acting as an anonymous bridesmaid, or signed in as the given account. */
async function repoFor(email = null) {
  const client = createFakeSupabase(db, { users })
  if (email) await client.auth.signInWithPassword({ email, password: users[email].password })
  return createSupabaseRepository({ client, weekends })
}

beforeAll(async () => {
  db = await createTestDatabase()
  users = {
    'organizer@example.com': { id: await addUser(db, { email: 'organizer@example.com', organizer: true }), password: 'pw-organizer' },
    'stranger@example.com': { id: await addUser(db, { email: 'stranger@example.com' }), password: 'pw-stranger' },
  }
}, 30_000)

afterAll(async () => {
  await db?.close()
})

describe('supabase repository — bridesmaid side (anonymous)', () => {
  it('declares itself persistent, so the demo bar disappears', async () => {
    expect((await repoFor()).meta).toMatchObject({ id: 'supabase', persistent: true })
  })

  it('creates a response and maps it into the app’s shape', async () => {
    const bridesmaid = await repoFor()
    const result = await bridesmaid.saveResponse({ name: 'Ava', unavailable: ['2027-05-14', '2027-05-15', '2027-06-11'] })

    expect(result.ok).toBe(true)
    expect(result.created).toBe(true)
    expect(result.response).toMatchObject({ name: 'Ava', unavailable: ['2027-05-14', '2027-06-11'] }) // 05-15 isn't a weekend id
    expect(result.response.editCode).toMatch(/^[A-Z]+-[0-9A-F]{12}$/)
    expect(result.response.id).toBeTruthy()
    expect(new Date(result.response.submittedAt).toString()).not.toBe('Invalid Date')
  })

  it('replaces her answer when editing, and finds it again from a loosely typed code', async () => {
    const bridesmaid = await repoFor()
    const first = await bridesmaid.saveResponse({ name: 'Bea', unavailable: ['2027-01-08'] })
    const second = await bridesmaid.saveResponse({
      editCode: first.response.editCode,
      name: 'Bea',
      unavailable: ['2027-02-05', '2027-02-12'],
    })

    expect(second).toMatchObject({ ok: true, created: false })
    expect(second.response.id).toBe(first.response.id)
    expect(second.response.unavailable).toEqual(['2027-02-05', '2027-02-12'])

    const loose = first.response.editCode.toLowerCase().replace('-', ' ')
    expect((await bridesmaid.getResponseByEditCode(loose)).unavailable).toEqual(['2027-02-05', '2027-02-12'])
    expect(await bridesmaid.getResponseByEditCode('NOPE-000000000000')).toBeNull()
  })

  it('passes the database’s refusals through as the same error codes as demo mode', async () => {
    const bridesmaid = await repoFor()
    await bridesmaid.saveResponse({ name: 'Cleo', unavailable: [] })
    expect(await bridesmaid.saveResponse({ name: 'cleo', unavailable: [] })).toEqual({ ok: false, error: 'NAME_TAKEN' })
    expect(await bridesmaid.saveResponse({ name: '  ', unavailable: [] })).toEqual({ ok: false, error: 'NAME_REQUIRED' })
    expect(await bridesmaid.saveResponse({ editCode: 'NOPE-000000000000', name: 'Zed', unavailable: [] })).toEqual({
      ok: false,
      error: 'CODE_NOT_FOUND',
    })
  })

  it('cannot list or delete responses — those calls fail rather than return data', async () => {
    const bridesmaid = await repoFor()
    await expect(bridesmaid.listResponses()).rejects.toThrow(/permission denied/)
    await expect(bridesmaid.deleteResponse('00000000-0000-0000-0000-000000000000')).rejects.toThrow(/permission denied/)
  })
})

describe('supabase repository — organizer side', () => {
  it('lists every response, mapped and sorted by name regardless of case', async () => {
    const bridesmaid = await repoFor()
    await bridesmaid.saveResponse({ name: 'dora', unavailable: ['2027-03-12'] })
    await bridesmaid.saveResponse({ name: 'Eli', unavailable: [] })

    const organizer = await repoFor('organizer@example.com')
    const all = await organizer.listResponses()
    const names = all.map((r) => r.name)

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })))
    expect(names).toEqual(expect.arrayContaining(['Ava', 'Bea', 'Cleo', 'dora', 'Eli']))
    const dora = all.find((r) => r.name === 'dora')
    expect(dora.unavailable).toEqual(['2027-03-12'])
    expect(dora.editCode).toMatch(/^[A-Z]+-[0-9A-F]{12}$/) // organizers can resend edit links
  })

  it('a signed-in non-organizer gets an empty list and cannot delete anything', async () => {
    const stranger = await repoFor('stranger@example.com')
    expect(await stranger.listResponses()).toEqual([])

    const organizer = await repoFor('organizer@example.com')
    const [first] = await organizer.listResponses()
    await expect(stranger.deleteResponse(first.id)).rejects.toThrow(/Nothing was removed/)
    expect((await organizer.listResponses()).some((r) => r.id === first.id)).toBe(true)
  })

  it('deletes a response and tells subscribers straight away', async () => {
    const organizer = await repoFor('organizer@example.com')
    const calls = []
    const unsubscribe = organizer.subscribe(() => calls.push('changed'))

    const target = (await organizer.listResponses()).find((r) => r.name === 'Eli')
    await organizer.deleteResponse(target.id)

    expect(calls).toEqual(['changed'])
    expect((await organizer.listResponses()).some((r) => r.id === target.id)).toBe(false)

    unsubscribe()
    const other = (await organizer.listResponses())[0]
    await organizer.deleteResponse(other.id)
    expect(calls).toHaveLength(1) // unsubscribed listeners aren't called any more
  })
})
