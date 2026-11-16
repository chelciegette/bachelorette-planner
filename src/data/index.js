// The single place the app chooses where data lives.
//
//   • VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY set  → the shared Supabase database
//   • otherwise                                              → demo mode (this browser's localStorage)
//
// Both implement the same contract (./repository.js), so nothing else in the app cares which.

import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { WEEKENDS } from '../lib/trip'
import { createLocalStorageRepository } from './localStorageRepository'
import { createSupabaseRepository } from './supabaseRepository'

/** @type {import('./repository').AvailabilityRepository} */
export const repository = isSupabaseConfigured
  ? createSupabaseRepository({ client: getSupabase(), weekends: WEEKENDS })
  : createLocalStorageRepository({ weekends: WEEKENDS })
