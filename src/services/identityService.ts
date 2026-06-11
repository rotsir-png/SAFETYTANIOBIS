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
}export interface RemoteTeamMemberProgress {
  employeeId: string;
  clearedStageCount: number;
  completed: boolean;
}

export async function fetchTeamMembersProgress(
  teamName: string
): Promise<RemoteTeamMemberProgress[]> {
  if (!supabase) return [];

  try {
    const { data: members, error: memberError } = await supabase
      .from('team_members')
      .select('employee_id, team_name')
      .eq('team_name', teamName)
      .order('employee_id', { ascending: true });

    if (memberError || !members) {
      console.warn('[Leaderboard] fetchTeamMembersProgress members error:', memberError?.message);
      return [];
    }

    const employeeIds = members.map((m) => m.employee_id);

    if (employeeIds.length === 0) return [];

    const { data: clears, error: clearError } = await supabase
      .from('stage_clears')
      .select('employee_id, stage_id')
      .in('employee_id', employeeIds)
      .in('stage_id', [1, 2, 3]);

    if (clearError) {
      console.warn('[Leaderboard] fetchTeamMembersProgress clears error:', clearError.message);

      return members.map((m) => ({
        employeeId: m.employee_id,
        clearedStageCount: 0,
        completed: false,
      }));
    }

    const stageMap = new Map<string, Set<number>>();

    (clears ?? []).forEach((row) => {
      if (!stageMap.has(row.employee_id)) {
        stageMap.set(row.employee_id, new Set());
      }

      stageMap.get(row.employee_id)?.add(row.stage_id);
    });

    return members.map((m) => {
      const clearedStageCount = stageMap.get(m.employee_id)?.size ?? 0;

      return {
        employeeId: m.employee_id,
        clearedStageCount,
        completed: clearedStageCount >= 3,
      };
    });
  } catch (err) {
    console.warn('[Leaderboard] fetchTeamMembersProgress threw:', err);
    return [];
  }
}
