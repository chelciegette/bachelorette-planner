import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { addUser, createFakeSupabase, createTestDatabase } from '../data/testing/pgliteSupabase'
import { createSupabaseOrganizerAuth } from './supabaseOrganizerAuth'

let db
let users

const authFor = () => createSupabaseOrganizerAuth(createFakeSupabase(db, { users }))

beforeAll(async () => {
  db = await createTestDatabase()
  users = {
    'organizer@example.com': { id: await addUser(db, { email: 'organizer@example.com', organizer: true }), password: 'right-password' },
    'stranger@example.com': { id: await addUser(db, { email: 'stranger@example.com' }), password: 'stranger-password' },
  }
}, 30_000)

afterAll(async () => {
  await db?.close()
})

describe('supabase organizer sign-in', () => {
  it('is real, secure sign-in — not the demo', () => {
    expect(authFor().meta).toEqual({ kind: 'password', secure: true })
  })

  it('starts signed out', async () => {
    expect(await authFor().getSession()).toBeNull()
  })

  it('asks for both fields before trying', async () => {
    const auth = authFor()
    expect(await auth.signIn({ email: '', password: 'x' })).toMatchObject({ ok: false })
    expect(await auth.signIn({ email: 'organizer@example.com', password: '' })).toMatchObject({ ok: false })
  })

  it('rejects a wrong password with a friendly message and stays signed out', async () => {
    const auth = authFor()
    const result = await auth.signIn({ email: 'organizer@example.com', password: 'wrong' })
    expect(result).toEqual({ ok: false, error: 'That email and password don’t match.' })
    expect(await auth.getSession()).toBeNull()
  })

  it('refuses a real account that is not listed as an organizer, and signs it out again', async () => {
    const auth = authFor()
    const result = await auth.signIn({ email: 'stranger@example.com', password: 'stranger-password' })
    expect(result).toEqual({ ok: false, error: 'This account isn’t set up as an organizer yet.' })
    expect(await auth.getSession()).toBeNull()
  })

  it('signs the organizer in and out', async () => {
    const auth = authFor()
    const events = []
    const unsubscribe = auth.subscribe((session) => events.push(session?.user.label ?? null))

    // Listeners are told a tick after the change, on purpose (see the adapter), so let it settle.
    const settle = () => new Promise((resolve) => setTimeout(resolve, 100))

    expect(await auth.signIn({ email: ' organizer@example.com ', password: 'right-password' })).toEqual({ ok: true })
    expect((await auth.getSession()).user).toMatchObject({ label: 'organizer@example.com' })
    await settle()
    expect(events.at(-1)).toBe('organizer@example.com')

    await auth.signOut()
    expect(await auth.getSession()).toBeNull()
    await settle()
    expect(events.at(-1)).toBeNull()

    unsubscribe()
  })
})
