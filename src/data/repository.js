/**
 * THE DATA CONTRACT
 * ─────────────────
 * The UI talks to storage only through an object shaped like this. Today that is
 * ./localStorageRepository.js. To go live, write another factory with the same
 * methods (Supabase, Firebase, your own API…) and select it in ./index.js —
 * no component needs to change.
 *
 * @typedef {Object} Response
 * @property {string}   id           Opaque unique id.
 * @property {string}   name         Display name (unique, case-insensitive).
 * @property {string}   editCode     Secret the bridesmaid uses to edit her answer.
 * @property {string[]} unavailable  Weekend ids ('YYYY-MM-DD' of the first day) she CANNOT attend.
 * @property {string}   submittedAt  ISO timestamp.
 * @property {string}   updatedAt    ISO timestamp.
 *
 * @typedef {{ ok: true, response: Response, created: boolean }
 *          | { ok: false, error: 'NAME_REQUIRED' | 'NAME_TAKEN' | 'CODE_NOT_FOUND' }} SaveResult
 *
 * @typedef {Object} AvailabilityRepository
 * @property {{ id: string, label: string, persistent: boolean }} meta
 *           `persistent: false` shows the "demo mode" bar in the UI.
 *
 * @property {(code: string) => Promise<Response | null>} getResponseByEditCode
 *           PUBLIC. Lets a bridesmaid load only her own response. Must never reveal anyone else's.
 *
 * @property {(input: { editCode?: string, name: string, unavailable: string[] }) => Promise<SaveResult>} saveResponse
 *           PUBLIC. Without `editCode` it creates a response; with one it REPLACES that response
 *           (same id, same code) instead of adding a duplicate.
 *
 * @property {() => Promise<Response[]>} listResponses
 *           ORGANIZER ONLY. Must be protected by real authentication on the server.
 *
 * @property {(id: string) => Promise<void>} deleteResponse
 *           ORGANIZER ONLY.
 *
 * @property {(listener: () => void) => () => void} subscribe
 *           Calls `listener` when data changes; returns an unsubscribe function.
 *           A real backend can implement this with realtime subscriptions or polling.
 *
 * @property {() => Promise<void>} [resetDemoData]   Demo adapter only.
 * @property {() => Promise<void>} [clearAll]        Demo adapter only.
 */
export {}
