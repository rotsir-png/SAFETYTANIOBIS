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
      employee_id:  profile.employeeId,
      department:   profile.department,
      stage_id:     stageId,
      score,
      cleared_at:   new Date().toISOString(),
    });
    if (error) console.warn('[Leaderboard] recordStageClear error:', error.message);
  } catch (err) {
    console.warn('[Leaderboard] recordStageClear threw:', err);
  }
}

// ── Endless scores ────────────────────────────────────────────────────────────

export async function recordEndlessScore(
  profile: PlayerProfile,
  score: number,
  survivedTime: number
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
      .from('endless_scores')
      .select('line_user_id, employee_id, department, score, survived_time')
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
}