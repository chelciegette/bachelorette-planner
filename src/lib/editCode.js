// Personal edit codes: how a bridesmaid gets back to her own response without an account.
// e.g. "PEONY-K7M2Q". The same code powers the edit link: #/edit/PEONY-K7M2Q

const WORDS = ['ROSE', 'PEONY', 'LILAC', 'PEARL', 'DAISY', 'BLUSH', 'SILK', 'DOVE', 'IVORY', 'LACE', 'PETAL', 'HONEY']
// No 0/O/1/I/L so a code is easy to read aloud and type from a screenshot.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function randomBytes(length) {
  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)
  return bytes
}

/**
 * Demo-grade code generation. When you move to a real database, generate the
 * secret on the server instead (a long random token, rate-limited lookups).
 */
export function generateEditCode() {
  const bytes = randomBytes(6)
  const word = WORDS[bytes[0] % WORDS.length]
  const suffix = Array.from(bytes.slice(1), (b) => ALPHABET[b % ALPHABET.length]).join('')
  return `${word}-${suffix}`
}

/** Ignores case, spaces and hyphens, so "peony k7m2q" matches "PEONY-K7M2Q". */
export function normalizeEditCode(input) {
  return String(input ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

/** Opaque id for a stored response (getRandomValues works on plain-http LAN addresses too). */
export function randomId() {
  return Array.from(randomBytes(12), (b) => b.toString(16).padStart(2, '0')).join('')
}
