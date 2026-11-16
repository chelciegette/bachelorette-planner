/**
 * ORGANIZER AUTH BOUNDARY
 * ───────────────────────
 * The organizer page asks ./index.js "who is signed in?" and nothing else. Two
 * adapters implement the same shape:
 *
 *   • this file             — DEMO mode: no password, nothing is protected.
 *                             Intentional: a password checked in frontend code can be
 *                             read by anyone with dev tools, so it would be theatre.
 *   • supabaseOrganizerAuth — REAL sign-in (used automatically once Supabase is
 *                             configured). The database's Row Level Security — not the
 *                             page — decides who may read everyone's responses.
 *
 * The contract:
 *   getSession(): Promise<{ user: { id, label } } | null>
 *   signIn(credentials?): Promise<{ ok: boolean, error?: string }>
 *   signOut(): Promise<void>
 *   subscribe(listener): unsubscribe
 *   meta: { kind: 'demo' | 'password' | …, secure: boolean }
 */

const KEY = 'bachelorette-planner:v1:demo-organizer'
const listeners = new Set()

function readFlag() {
  try {
    return window.sessionStorage.getItem(KEY) === '1'
  } catch {
    return memoryFlag
  }
}

let memoryFlag = false

function writeFlag(value) {
  memoryFlag = value
  try {
    if (value) window.sessionStorage.setItem(KEY, '1')
    else window.sessionStorage.removeItem(KEY)
  } catch {
    // keep the in-memory flag
  }
}

const session = () => (readFlag() ? { user: { id: 'demo-organizer', label: 'Demo organizer' } } : null)

export const demoOrganizerAuth = {
  meta: { kind: 'demo', secure: false },

  async getSession() {
    return session()
  },

  async signIn() {
    writeFlag(true)
    listeners.forEach((listener) => listener(session()))
    return { ok: true }
  },

  async signOut() {
    writeFlag(false)
    listeners.forEach((listener) => listener(session()))
  },

  subscribe(listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
