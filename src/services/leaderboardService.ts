/**
 * Leaderboard service — score writes and leaderboard reads via Supabase.
 *
 * Player identity:
 *   - lineUserId (from LINE LIFF) is the primary identity for all records.
 *   - employeeId is display/metadata only.
 *   - In dev mode, lineUserId is a stable per-device UUID (see liff.ts).
 *
 * Deduplication rules:
 *   - Endless leaderboard: best score per lineUserId (one row per player).
 *   - Participation: unique lineUserId per department, regardless of how
 *     many stages or how many times they were cleared.
 *
 * Error handling:
 *   - All Supabase failures emit console.warn, never throw to the caller.
 *   - App continues to work with localStorage fallback if Supabase is down.
 */

import { supabase } from '../lib/supabase';
import type { PlayerProfile } from '../types';

export { savePlayerToSupabase as upsertPlayer } from './identityService';

// ── Identity helper ───────────────────────────────────────────────────────────

/** Returns the primary identity key for a profile. Always prefer lineUserId. */
function primaryId(profile: PlayerProfile): string {
  return profile.lineUserId ?? profile.employeeId;
}
// ── Stage clears ──────────────────────────────────────────────────────────────

export async function recordStageClear(
  profile: PlayerProfile,
  stageId: number,
  score: number
): Promise<void> {
  if (!supabase) {
    console.warn('[Leaderboard] Supabase not configured. Stage clear not persisted remotely.');
    return;
  }

  try {
    const { error } = await supabase.from('stage_clears').insert({
      line_user_id: primaryId(profile),
      employee_id: profile.employeeId,
      department: profile.department,
      stage_id: stageId,
      score,
      cleared_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('[Leaderboard] recordStageClear error:', error.message);
    }
  } catch (err) {
    console.warn('[Leaderboard] recordStageClear threw:', err);
  }
}

// ── Endless scores ────────────────────────────────────────────────────────────

// ── Endless scores ────────────────────────────────────────────────────────────

export async function recordEndlessScore(
  profile: PlayerProfile,
  score: number,
  survivedTime = 0
): Promise<void> {
  if (!supabase) {
    console.warn('[Leaderboard] Supabase not configured. Endless score not persisted remotely.');
    return;
  }
  try {
    const { error } = await supabase.from('endless_scores').insert({
      line_user_id:  primaryId(profile),
      employee_id:   profile.employeeId,
      department:    profile.department,
      score,
      survived_time: survivedTime,
      created_at:    new Date().toISOString(),
    });
    if (error) console.warn('[Leaderboard] recordEndlessScore error:', error.message);
  } catch (err) {
    console.warn('[Leaderboard] recordEndlessScore threw:', err);
  }
}

// ── Leaderboard reads ─────────────────────────────────────────────────────────

export interface RemoteEndlessEntry {
  lineUserId: string;
  employeeId: string;
  displayName?: string | null;
  department: string;
  score: number;
  survivedSeconds: number;
}

/**
 * Returns the best score per lineUserId, sorted descending.
 *
 * Fetches a larger batch (limit × 10) to account for repeat plays, then
 * deduplicates client-side — Supabase REST doesn't support DISTINCT ON.
 */
export async function fetchTopEndlessScores(limit = 20): Promise<RemoteEndlessEntry[]> {
  if (!supabase) {
    console.warn('[Leaderboard] Supabase not configured. Returning empty endless scores.');
    return [];
  }
  try {
    const { data, error } = await supabase
    .from('endless_scores_with_names')
    .select('line_user_id, employee_id, display_name, department, score, survived_time')
      .order('score', { ascending: false })
      .limit(limit * 10);

    if (error) {
      console.warn('[Leaderboard] fetchTopEndlessScores error:', error.message);
      return [];
    }
    if (!data) return [];

    // Keep only the best score per player (primary key: lineUserId, fallback: employeeId)
    const best = new Map<string, RemoteEndlessEntry>();
    for (const row of data) {
      const key = row.line_user_id || row.employee_id;
      const existing = best.get(key);
      if (!existing || row.score > existing.score) {
        best.set(key, {
          lineUserId:      row.line_user_id,
          employeeId:      row.employee_id,
          displayName:     row.display_name ?? null,
          department:      row.department,
          score:           row.score,
          survivedSeconds: row.survived_time,
        });
      }
    }

    // Sort by best score descending and return top N
    return Array.from(best.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (err) {
    console.warn('[Leaderboard] fetchTopEndlessScores threw:', err);
    return [];
  }
}
/**
 * Counts unique players per department.
 *
 * Uses stage_clears as the source so only players who actually completed
 * at least one stage are counted. A player who clears multiple stages,
 * or replays the same stage, is counted only once for their department.
 */
 export interface RemoteDeptParticipation {
  dept: string;
  participants: number;
  totalMembers: number;
  percent: number;
}

const DEPT_LABELS: Record<string, string> = {
  A: 'ทีม A',
  B: 'ทีม B',
  C: 'ทีม C',
  D: 'ทีม D',
};

export async function fetchDeptParticipation(): Promise<RemoteDeptParticipation[]> {
  if (!supabase) {
    console.warn('[Leaderboard] Supabase not configured.');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('department_participation')
      .select(`
        department,
        total_members,
        completed_members,
        participation_percent
      `)
      .order('participation_percent', { ascending: false });

    if (error) {
      console.warn('[Leaderboard] fetchDeptParticipation error:', error.message);
      return [];
    }

    return (data ?? []).map((row) => ({
      dept: DEPT_LABELS[row.department] ?? row.department,
      participants: row.completed_members,
      totalMembers: row.total_members,
      percent: row.participation_percent,
    }));
  } catch (err) {
    console.warn('[Leaderboard] fetchDeptParticipation threw:', err);
    return [];
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
}