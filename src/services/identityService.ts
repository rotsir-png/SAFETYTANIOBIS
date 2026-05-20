/**
 * Identity service — ties a LINE userId to an employee profile in Supabase.
 *
 * Security model (MVP):
 *   - lineUserId comes from LINE's LIFF SDK and is verified by LINE's OAuth.
 *   - employeeId is self-reported and NOT independently verified here.
 *   - In production, a backend must validate that the given employeeId
 *     belongs to the LINE account via an HR database lookup.
 *   - Document key is lineUserId so one LINE account = one employee record.
 *   - In dev mode, lineUserId is a stable per-device UUID (not LINE-verified).
 *
 * Error handling:
 *   - All Supabase failures emit console.warn, never throw to the caller.
 *   - App continues to work from localStorage if Supabase is unavailable.
 */

import { supabase } from '../lib/supabase';
import type { PlayerProfile } from '../types';

/** Fetch an existing profile from Supabase by lineUserId. Returns null if not found or on error. */
export async function fetchProfileByLineUserId(lineUserId: string): Promise<PlayerProfile | null> {
  if (!supabase) {
    console.warn('[Identity] Supabase not configured. Skipping remote profile fetch.');
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('players')
      .select('employee_id, department, line_user_id, display_name, picture_url, created_at, profile_locked')
      .eq('line_user_id', lineUserId)
      .maybeSingle();

    if (error) {
      console.warn('[Identity] fetchProfileByLineUserId error:', error.message);
      return null;
    }
    if (!data) return null;

    return {
      employeeId:    data.employee_id,
      department:    data.department,
      lineUserId:    data.line_user_id,
      displayName:   data.display_name,
      pictureUrl:    data.picture_url,
      createdAt:     data.created_at,
      profileLocked: data.profile_locked,
    };
  } catch (err) {
    console.warn('[Identity] fetchProfileByLineUserId threw:', err);
    return null;
  }
}

/**
 * Upsert a full player profile keyed on lineUserId.
 * Safe to call after both initial registration and profile edits.
 */
export async function savePlayerToSupabase(profile: PlayerProfile): Promise<void> {
  if (!supabase) {
    console.warn('[Identity] Supabase not configured. Profile saved to localStorage only.');
    return;
  }
  try {
    const { error } = await supabase.from('players').upsert(
      {
        line_user_id:    profile.lineUserId ?? 'dev_user',
        employee_id:     profile.employeeId,
        department:      profile.department,
        display_name:    profile.displayName ?? '',
        picture_url:     profile.pictureUrl ?? '',
        updated_at:      new Date().toISOString(),
        profile_locked:  profile.profileLocked ?? false,
      },
      { onConflict: 'line_user_id' }
    );
    if (error) console.warn('[Identity] savePlayerToSupabase error:', error.message);
  } catch (err) {
    console.warn('[Identity] savePlayerToSupabase threw:', err);
  }
}
