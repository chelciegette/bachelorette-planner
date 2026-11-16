// The real, shared data store: implements the contract in ./repository.js on top of
// Supabase. The access rules live in the database (supabase/migrations), not here:
//   • bridesmaids only ever call the two public functions get_my_response / save_response
//   • listing and deleting go straight to the table and only work for the signed-in organizer
//
// `client` is a Supabase client (or anything shaped like one — the tests pass a fake).

const COLUMNS = 'id, name, edit_token, unavailable, created_at, updated_at'
const POLL_MS = 30_000 // safety net in case Realtime isn't enabled or drops

const byName = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })

export function createSupabaseRepository({ client, weekends }) {
  const validIds = new Set(weekends.map((weekend) => weekend.id))
  const sanitizeIds = (ids) => [...new Set((ids ?? []).filter((id) => validIds.has(id)))].sort()
  const listeners = new Set()

  // Database row (snake_case) → the shape the UI uses.
  const toResponse = (row) => ({
    id: row.id,
    name: row.name,
    editCode: row.edit_token,
    unavailable: sanitizeIds(row.unavailable),
    submittedAt: row.created_at,
    updatedAt: row.updated_at,
  })

  return {
    meta: { id: 'supabase', label: 'Supabase', persistent: true },

    async getResponseByEditCode(code) {
      const { data, error } = await client.rpc('get_my_response', { p_token: String(code ?? '') })
      if (error) throw error
      return data ? toResponse(data) : null
    },

    async saveResponse({ editCode, name, unavailable }) {
      const { data, error } = await client.rpc('save_response', {
        p_token: editCode ?? null,
        p_name: name,
        p_unavailable: sanitizeIds(unavailable),
      })
      if (error) throw error
      if (!data?.ok) return { ok: false, error: data?.error ?? 'UNKNOWN' }
      return { ok: true, created: Boolean(data.created), response: toResponse(data.response) }
    },

    async listResponses() {
      const { data, error } = await client.from('responses').select(COLUMNS).order('name')
      if (error) throw error
      return data.map(toResponse).sort(byName)
    },

    async deleteResponse(id) {
      const { data, error } = await client.from('responses').delete().eq('id', id).select('id')
      if (error) throw error
      // Row Level Security doesn't raise an error for rows you may not touch — it just matches none.
      if (!data?.length) throw new Error('Nothing was removed. Are you signed in as the organizer?')
      listeners.forEach((listener) => listener())
    },

    subscribe(listener) {
      listeners.add(listener)
      const channel = client
        .channel(`responses-${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'responses' }, () => listener())
        .subscribe()
      const timer = setInterval(listener, POLL_MS)
      return () => {
        listeners.delete(listener)
        clearInterval(timer)
        client.removeChannel(channel)
      }
    },
  }
}
