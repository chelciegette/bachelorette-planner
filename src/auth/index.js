// Picks the organizer sign-in to match the data store (see ../data/index.js):
// real Supabase Auth when Supabase is configured, the demo stand-in otherwise.

import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { demoOrganizerAuth } from './organizerAuth'
import { createSupabaseOrganizerAuth } from './supabaseOrganizerAuth'

export const organizerAuth = isSupabaseConfigured ? createSupabaseOrganizerAuth(getSupabase()) : demoOrganizerAuth
