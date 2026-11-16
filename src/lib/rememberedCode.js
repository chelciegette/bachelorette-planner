// Per-device convenience: remember the edit code after submitting so that coming
// back on the same phone/laptop offers a one-tap "update my dates".
// This is deliberately NOT part of the data layer — it stays in the browser even
// after the real database is connected. Everything is wrapped in try/catch
// because storage can be blocked (private windows, strict settings).

const KEY = 'bachelorette-planner:v1:my-edit-code'

export function getRememberedCode() {
  try {
    return window.localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function rememberEditCode(code) {
  try {
    window.localStorage.setItem(KEY, code)
  } catch {
    // ignore — the personal link still works
  }
}

export function forgetEditCode() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
