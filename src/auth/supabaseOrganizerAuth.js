// Real organizer sign-in (email + password) on Supabase Auth.
//
// Signing in is not enough on its own: the account must also be listed in the
// `organizers` table (see the README → "Go live"). That table is what the database's
// Row Level Security checks, so even a signed-in stranger can't read anyone's answers.
// This adapter mirrors that check so the UI can show a clear message instead of an
// empty dashboard — but the database stays the real gatekeeper.

const friendly = (error) =>
  error?.code === 'invalid_credentials' || /invalid login credentials/i.test(error?.message ?? '')
    ? 'That email and password don’t match.'
    : 'Couldn’t sign in. Check your connection and try again.'

export function createSupabaseOrganizerAuth(client) {
  const toSession = (session) => ({ user: { id: session.user.id, label: session.user.email ?? 'Organizer' } })

  /** The session, but only if it belongs to a listed organizer. */
  async function currentOrganizer() {
    const { data } = await client.auth.getSession()
    if (!data?.session) return null
    const { data: row, error } = await client.from('organizers').select('user_id').maybeSingle()
    if (error || !row) return null
    return toSession(data.session)
  }

  return {
    meta: { kind: 'password', secure: true },

    getSession: currentOrganizer,

    async signIn({ email, password } = {}) {
      if (!email?.trim() || !password) return { ok: false, error: 'Enter your email and password.' }

      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password })
      if (error) return { ok: false, error: friendly(error) }

      if (!(await currentOrganizer())) {
        await client.auth.signOut()
        return { ok: false, error: 'This account isn’t set up as an organizer yet.' }
      }
      return { ok: true }
    },

    async signOut() {
      await client.auth.signOut()
    },

    subscribe(listener) {
      const { data } = client.auth.onAuthStateChange(() => {
        // Don't call back into Supabase from inside this callback (it can deadlock) — defer a tick.
        setTimeout(async () => listener(await currentOrganizer()), 0)
      })
      return () => data.subscription.unsubscribe()
    },
  }
}
