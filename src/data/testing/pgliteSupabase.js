// TEST HELPER — not part of the app bundle.
//
// Runs the real migration (supabase/migrations/*.sql) inside an in-process Postgres
// (PGlite), with stand-ins for what Supabase itself provides: the `anon` and
// `authenticated` roles, auth.users and auth.uid(). That lets the tests prove the
// access rules for real — e.g. that an anonymous visitor really cannot read the table.

import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const MIGRATION = readFileSync(
  new URL('../../../supabase/migrations/20261116000000_bachelorette_planner.sql', import.meta.url),
  'utf8',
)

const SUPABASE_STUBS = `
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema public to anon, authenticated;

  create schema auth;
  grant usage on schema auth to anon, authenticated;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant execute on function auth.uid() to anon, authenticated;

  -- Supabase hands new public tables to anon/authenticated by default; reproduce that
  -- so the migration's explicit revokes are what's being tested.
  alter default privileges in schema public grant all on tables to anon, authenticated;
`

export async function createTestDatabase() {
  const db = new PGlite()
  await db.exec(SUPABASE_STUBS)
  await db.exec(MIGRATION)
  return db
}

/** Adds a Supabase Auth user and returns its id. Pass `organizer: true` to list them in public.organizers. */
export async function addUser(db, { email, organizer = false }) {
  const { rows } = await db.query('insert into auth.users (email) values ($1) returning id', [email])
  const id = rows[0].id
  if (organizer) await db.query('insert into public.organizers (user_id) values ($1)', [id])
  return id
}

// PGlite is a single connection and the role is session state, so two overlapping
// role-scoped calls would clobber each other. (Real PostgREST gives each request its
// own transaction.) Queue them per database so each runs alone.
const queues = new WeakMap()

/** Runs `fn` as the given database role, the way PostgREST would for a request. */
export function asRole(db, { role, userId = null }, fn) {
  const run = (queues.get(db) ?? Promise.resolve()).then(async () => {
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? ''])
    await db.exec(`set role ${role}`)
    try {
      return await fn()
    } finally {
      await db.exec('reset role')
      await db.query("select set_config('request.jwt.claim.sub', '', false)")
    }
  })
  queues.set(db, run.catch(() => {}))
  return run
}

/**
 * A minimal stand-in for the Supabase client, backed by the test database. It starts
 * as `anon` and becomes a signed-in user after auth.signInWithPassword(). It supports
 * exactly the calls the app makes:
 *   rpc(), from(t).select().order(), from(t).select().maybeSingle(),
 *   from(t).delete().eq().select(), auth.{signInWithPassword,getSession,signOut,onAuthStateChange}
 * Results look like PostgREST's: { data, error }, with dates as ISO strings.
 *
 * @param {object} [options]
 * @param {Record<string, { id: string, password: string }>} [options.users]  email → account
 */
export function createFakeSupabase(db, { users = {} } = {}) {
  let identity = { role: 'anon', userId: null, email: null }
  const authListeners = new Set()
  const asIdentity = (fn) => asRole(db, identity, fn)
  const toJson = (rows) => JSON.parse(JSON.stringify(rows))
  const emitAuth = (event) => authListeners.forEach((listener) => listener(event, null))

  async function settle(work) {
    try {
      return { data: await work(), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  return {
    auth: {
      async signInWithPassword({ email, password }) {
        const account = users[email]
        if (!account || account.password !== password) {
          return { data: null, error: { code: 'invalid_credentials', message: 'Invalid login credentials' } }
        }
        identity = { role: 'authenticated', userId: account.id, email }
        emitAuth('SIGNED_IN')
        return { data: { session: { user: { id: account.id, email } } }, error: null }
      },
      async getSession() {
        const session = identity.userId ? { user: { id: identity.userId, email: identity.email } } : null
        return { data: { session }, error: null }
      },
      async signOut() {
        identity = { role: 'anon', userId: null, email: null }
        emitAuth('SIGNED_OUT')
        return { error: null }
      },
      onAuthStateChange(callback) {
        authListeners.add(callback)
        return { data: { subscription: { unsubscribe: () => authListeners.delete(callback) } } }
      },
    },

    rpc: (fn, args = {}) =>
      settle(() =>
        asIdentity(async () => {
          const keys = Object.keys(args)
          const params = keys.map((key, i) => `${key} => $${i + 1}${Array.isArray(args[key]) ? '::text[]' : ''}`)
          const { rows } = await db.query(`select public.${fn}(${params.join(', ')}) as result`, keys.map((k) => args[k]))
          return toJson(rows[0].result)
        }),
      ),

    from: (table) => {
      const query = { op: 'select', columns: '*', orderBy: null, eq: null, single: false }
      const builder = {
        select(columns = '*') {
          query.columns = columns
          return builder
        },
        maybeSingle() {
          query.single = true
          return builder
        },
        order(column) {
          query.orderBy = column
          return builder
        },
        delete() {
          query.op = 'delete'
          return builder
        },
        eq(column, value) {
          query.eq = [column, value]
          return builder
        },
        then(resolve, reject) {
          return settle(() =>
            asIdentity(async () => {
              if (query.op === 'delete') {
                const [column, value] = query.eq
                const { rows } = await db.query(`delete from public.${table} where ${column} = $1 returning ${query.columns}`, [value])
                return toJson(rows)
              }
              const order = query.orderBy ? ` order by ${query.orderBy}` : ''
              const { rows } = await db.query(`select ${query.columns} from public.${table}${order}`)
              return query.single ? (toJson(rows)[0] ?? null) : toJson(rows)
            }),
          ).then(resolve, reject)
        },
      }
      return builder
    },

    // Realtime isn't simulated; the repository falls back to polling anyway.
    channel: () => ({ on() { return this }, subscribe() { return this } }),
    removeChannel: () => {},
  }
}
