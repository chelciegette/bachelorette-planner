// DEMO-ONLY data store: keeps responses in this browser's localStorage so the
// whole experience can be tried with zero setup. It implements the contract in
// ./repository.js — swap it for a real database later without touching the UI.
//
// Not suitable for the real thing: every browser has its own private copy, so
// nothing is shared between bridesmaids' phones and the organizer.

import { generateEditCode, normalizeEditCode, randomId } from '../lib/editCode'
import { buildSeedResponses } from './seed'

const STORAGE_KEY = 'bachelorette-planner:v1:responses'
const MAX_NAME_LENGTH = 40

const wait = (ms) => (ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve())
const cleanName = (value) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH)
const nameKey = (value) => cleanName(value).toLocaleLowerCase()

/** localStorage when usable, otherwise a per-repository in-memory fallback. */
function pickStorage() {
  try {
    const storage = globalThis.localStorage
    if (!storage) throw new Error('localStorage unavailable')
    const probe = '__bachelorette-planner-probe__'
    storage.setItem(probe, '1')
    storage.removeItem(probe)
    return storage
  } catch {
    const memory = new Map()
    return {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => {
        memory.set(key, value)
      },
    }
  }
}

/**
 * @param {object} options
 * @param {Array}  options.weekends  The valid weekends (ids are used to sanitise input).
 * @param {{read:number, write:number}} [options.latency]  Fake network delay in ms, so
 *        loading states behave as they will against a real backend. Use 0 in tests.
 */
export function createLocalStorageRepository({ weekends, latency = { read: 120, write: 450 } }) {
  const validIds = new Set(weekends.map((weekend) => weekend.id))
  const storage = pickStorage()
  const listeners = new Set()
  const notify = () => listeners.forEach((listener) => listener())

  const sanitizeIds = (ids) => [...new Set((ids ?? []).filter((id) => validIds.has(id)))].sort()

  function normalize(raw) {
    if (!raw || typeof raw !== 'object' || !raw.id || !raw.editCode) return null
    const name = cleanName(raw.name)
    if (!name) return null
    return {
      id: String(raw.id),
      name,
      editCode: String(raw.editCode),
      unavailable: sanitizeIds(raw.unavailable),
      submittedAt: raw.submittedAt ?? new Date().toISOString(),
      updatedAt: raw.updatedAt ?? raw.submittedAt ?? new Date().toISOString(),
    }
  }

  function readAll() {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed.map(normalize).filter(Boolean)
      } catch {
        // corrupted → fall through and start from the sample data again
      }
    }
    const seeded = buildSeedResponses(weekends)
    storage.setItem(STORAGE_KEY, JSON.stringify(seeded))
    return seeded
  }

  function writeAll(responses) {
    storage.setItem(STORAGE_KEY, JSON.stringify(responses))
    notify()
  }

  // Other tabs/windows on this browser: keep dashboards live while testing.
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY || event.key === null) notify()
    })
  }

  return {
    meta: { id: 'local-storage', label: 'This browser only (demo)', persistent: false },

    /** Public: a bridesmaid loading her own response from her edit code. */
    async getResponseByEditCode(code) {
      await wait(latency.read)
      const wanted = normalizeEditCode(code)
      if (!wanted) return null
      return readAll().find((r) => normalizeEditCode(r.editCode) === wanted) ?? null
    },

    /**
     * Public: create a response, or — when `editCode` is given — replace that
     * response's name and availability (never creating a duplicate).
     * Resolves to { ok: true, response, created } or { ok: false, error } where
     * error is 'NAME_REQUIRED' | 'NAME_TAKEN' | 'CODE_NOT_FOUND'.
     */
    async saveResponse({ editCode, name, unavailable }) {
      await wait(latency.write)
      const displayName = cleanName(name)
      if (!displayName) return { ok: false, error: 'NAME_REQUIRED' }

      const all = readAll()
      const now = new Date().toISOString()
      const ids = sanitizeIds(unavailable)

      if (editCode) {
        const wanted = normalizeEditCode(editCode)
        const index = all.findIndex((r) => normalizeEditCode(r.editCode) === wanted)
        if (index === -1) return { ok: false, error: 'CODE_NOT_FOUND' }
        if (all.some((r, i) => i !== index && nameKey(r.name) === nameKey(displayName))) {
          return { ok: false, error: 'NAME_TAKEN' }
        }
        const response = { ...all[index], name: displayName, unavailable: ids, updatedAt: now }
        const next = [...all]
        next[index] = response
        writeAll(next)
        return { ok: true, response, created: false }
      }

      if (all.some((r) => nameKey(r.name) === nameKey(displayName))) {
        return { ok: false, error: 'NAME_TAKEN' }
      }
      const used = new Set(all.map((r) => normalizeEditCode(r.editCode)))
      let code = generateEditCode()
      while (used.has(normalizeEditCode(code))) code = generateEditCode()

      const response = { id: randomId(), name: displayName, editCode: code, unavailable: ids, submittedAt: now, updatedAt: now }
      writeAll([...all, response])
      return { ok: true, response, created: true }
    },

    /** Organizer-only (needs real auth once a backend exists): everyone's responses. */
    async listResponses() {
      await wait(latency.read)
      return readAll().sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    },

    /** Organizer-only: remove one response. */
    async deleteResponse(id) {
      await wait(latency.write / 2)
      writeAll(readAll().filter((r) => r.id !== id))
    },

    /** Call `listener` whenever responses change (other tabs included). Returns an unsubscribe function. */
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    // ── Demo-only helpers (a real backend simply doesn't have these) ──────────
    async resetDemoData() {
      await wait(latency.write / 2)
      writeAll(buildSeedResponses(weekends))
    },
    async clearAll() {
      await wait(latency.write / 2)
      writeAll([])
    },
  }
}
