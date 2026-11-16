// The one Supabase client, created from two build-time env vars (see .env.example).
// Leave them unset and the app runs in demo mode on localStorage — nothing else changes.
//
// The "publishable" key is designed to be public (it ships in the browser bundle).
// What protects the data is the database's Row Level Security, never this key.
// NEVER put a `service_role` / secret key in a VITE_ variable: those go to the browser.

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(url && key)

if (Boolean(url) !== Boolean(key)) {
  console.warn(
    '[bachelorette-planner] Only one of VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY is set, so the app is running in demo mode. Set both to connect Supabase.',
  )
}

let client = null

export function getSupabase() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured')
  if (!client) {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Sign-in is email + password, so there are never tokens in the URL — and this
        // keeps the client from touching the #/hash that the router relies on.
        detectSessionInUrl: false,
      },
    })
  }
  return client
}
