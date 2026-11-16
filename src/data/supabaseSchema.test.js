// Proves the database rules: runs the real migration in an in-process Postgres and
// pokes it as an anonymous visitor, a random signed-in user, and the organizer.

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { addUser, asRole, createTestDatabase } from './testing/pgliteSupabase'

let db
let organizerId
let strangerId

const anon = (fn) => asRole(db, { role: 'anon' }, fn)
const asOrganizer = (fn) => asRole(db, { role: 'authenticated', userId: organizerId }, fn)
const asStranger = (fn) => asRole(db, { role: 'authenticated', userId: strangerId }, fn)

/** Calls a public function the way an anonymous bridesmaid's browser would. */
async function save(name, unavailable = [], token = null) {
  return anon(async () => {
    const { rows } = await db.query('select public.save_response($1, $2, $3::text[]) as r', [token, name, unavailable])
    return rows[0].r
  })
}
async function getMine(token) {
  return anon(async () => {
    const { rows } = await db.query('select public.get_my_response($1) as r', [token])
    return rows[0].r
  })
}
const countAll = async () => (await db.query('select count(*)::int as n from public.responses')).rows[0].n

beforeAll(async () => {
  db = await createTestDatabase()
  organizerId = await addUser(db, { email: 'organizer@example.com', organizer: true })
  strangerId = await addUser(db, { email: 'stranger@example.com' })
}, 30_000)

afterAll(async () => {
  await db?.close()
})

describe('anonymous visitors (bridesmaids)', () => {
  it('cannot read the table, write to it, or reach the organizer list', async () => {
    await expect(anon(() => db.query('select * from public.responses'))).rejects.toThrow(/permission denied/)
    await expect(
      anon(() => db.query("insert into public.responses (name, edit_token) values ('Mallory', 'X-1')")),
    ).rejects.toThrow(/permission denied/)
    await expect(anon(() => db.query('delete from public.responses'))).rejects.toThrow(/permission denied/)
    await expect(anon(() => db.query('select * from public.organizers'))).rejects.toThrow(/permission denied/)
  })

  it('cannot call the private helpers directly', async () => {
    await expect(anon(() => db.query('select private.new_edit_token()'))).rejects.toThrow(/permission denied/)
  })

  it('create a response and receive a server-generated edit token', async () => {
    const result = await save('  Ava   Lee ', ['2027-05-14', '2027-05-14', '2027-06-11', 'nonsense', "'; drop table responses; --"])
    expect(result.ok).toBe(true)
    expect(result.created).toBe(true)
    expect(result.response.name).toBe('Ava Lee') // trimmed, inner whitespace collapsed
    expect(result.response.edit_token).toMatch(/^[A-Z]+-[0-9A-F]{12}$/)
    expect(result.response.unavailable).toEqual(['2027-05-14', '2027-06-11']) // de-duplicated, malformed dropped
  })

  it('load only their own response, forgivingly typed', async () => {
    const created = await save('Bea', ['2027-01-08'])
    const token = created.response.edit_token

    expect((await getMine(token)).name).toBe('Bea')
    expect((await getMine(token.toLowerCase().replace('-', ' '))).name).toBe('Bea')
    expect(await getMine('NOPE-000000000000')).toBeNull()
    expect(await getMine('')).toBeNull()
    expect(await getMine('---')).toBeNull()
  })

  it('REPLACE their answer when editing — no duplicate row', async () => {
    const created = await save('Cleo', ['2027-02-05'])
    const before = await countAll()
    const updated = await save('Cleo', ['2027-03-12', '2027-03-19'], created.response.edit_token)

    expect(updated.ok).toBe(true)
    expect(updated.created).toBe(false)
    expect(updated.response.id).toBe(created.response.id)
    expect(updated.response.edit_token).toBe(created.response.edit_token)
    expect(updated.response.unavailable).toEqual(['2027-03-12', '2027-03-19'])
    expect(await countAll()).toBe(before)
  })

  it('cannot take a name that is already used (case-insensitive), on create or rename', async () => {
    await save('Dana', [])
    expect(await save('dana', [])).toEqual({ ok: false, error: 'NAME_TAKEN' })
    expect(await save('  DANA  ', [])).toEqual({ ok: false, error: 'NAME_TAKEN' })

    const eve = await save('Eve', [])
    expect(await save('Dana', [], eve.response.edit_token)).toEqual({ ok: false, error: 'NAME_TAKEN' })
    expect((await save('Eve B', [], eve.response.edit_token)).ok).toBe(true) // renaming herself is fine
  })

  it('get clear errors for an empty name or an unknown edit token', async () => {
    expect(await save('   ', [])).toEqual({ ok: false, error: 'NAME_REQUIRED' })
    expect(await save(null, [])).toEqual({ ok: false, error: 'NAME_REQUIRED' })
    expect(await save('Zed', [], 'NOPE-000000000000')).toEqual({ ok: false, error: 'CODE_NOT_FOUND' })
  })

  it('cannot edit someone else’s response without their token', async () => {
    const frank = await save('Frank', ['2027-04-02'])
    await save('Grace', [])
    // Guessing a different token changes nothing.
    expect(await save('Grace', ['2027-04-09'], 'PEONY-AAAAAAAAAAAA')).toEqual({ ok: false, error: 'CODE_NOT_FOUND' })
    expect((await getMine(frank.response.edit_token)).unavailable).toEqual(['2027-04-02'])
  })

  it('cap each response at 120 weekends and the whole table at 100 responses', async () => {
    const many = Array.from({ length: 300 }, (_, i) => `2030-01-${String((i % 28) + 1).padStart(2, '0')}`)
    const capped = await save('Hugo', many)
    expect(capped.response.unavailable.length).toBeLessThanOrEqual(28) // only 28 distinct ids exist here

    // Fill the table to the cap, then the next new response is refused…
    const have = await countAll()
    for (let i = have; i < 100; i += 1) await save(`Filler ${i}`, [])
    expect(await save('One too many', [])).toEqual({ ok: false, error: 'LIMIT_REACHED' })
    // …but existing responses can still be edited.
    expect((await save('Hugo', ['2027-07-02'], capped.response.edit_token)).ok).toBe(true)
  })
})

describe('signed-in users', () => {
  it('a signed-in user who is NOT an organizer sees nothing and deletes nothing', async () => {
    expect(await asStranger(async () => (await db.query('select * from public.responses')).rows)).toEqual([])
    const deleted = await asStranger(() => db.query('delete from public.responses returning id'))
    expect(deleted.rows).toHaveLength(0)
    expect(await countAll()).toBeGreaterThan(0)
  })

  it('cannot make themselves an organizer, or insert/update responses directly', async () => {
    await expect(asStranger(() => db.query('insert into public.organizers (user_id) values ($1)', [strangerId]))).rejects.toThrow(
      /permission denied/,
    )
    await expect(asStranger(() => db.query("update public.responses set name = 'x'"))).rejects.toThrow(/permission denied/)
    await expect(
      asOrganizer(() => db.query("insert into public.responses (name, edit_token) values ('Direct', 'D-1')")),
    ).rejects.toThrow(/permission denied/) // even the organizer goes through the functions
  })

  it('the organizer sees every response (with edit tokens) and can remove one', async () => {
    const rows = await asOrganizer(async () => (await db.query('select id, name, edit_token from public.responses order by name')).rows)
    expect(rows.length).toBe(await countAll())
    expect(rows.map((r) => r.name)).toContain('Ava Lee')
    expect(rows.every((r) => /^[A-Z]+-[0-9A-F]{12}$/.test(r.edit_token))).toBe(true)

    const target = rows.find((r) => r.name === 'Frank')
    const removed = await asOrganizer(() => db.query('delete from public.responses where id = $1 returning id', [target.id]))
    expect(removed.rows).toHaveLength(1)
    expect(await getMine(target.edit_token)).toBeNull()
  })

  it('the organizer can only see their own organizers row', async () => {
    const rows = await asOrganizer(async () => (await db.query('select user_id from public.organizers')).rows)
    expect(rows).toEqual([{ user_id: organizerId }])
  })
})
