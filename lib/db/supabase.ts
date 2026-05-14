/**
 * Supabase client — server-side only.
 *
 * Uses the SERVICE_ROLE key, which bypasses RLS. This module never runs
 * client-side; do not import from `"use client"` components.
 *
 * If `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` are missing, returns null —
 * the email account store falls back to in-memory. This keeps zero-config dev
 * fast while making prod persistence one env-var away.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    cached = null;
    return null;
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function supabaseAvailable(): boolean {
  return !!getSupabase();
}
