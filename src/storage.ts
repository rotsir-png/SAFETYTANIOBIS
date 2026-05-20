import type { PlayerProfile, GameProgress } from './types';

// NOTE: All data is stored in localStorage (client-side only).
// This is an MVP approach. Limitations:
//   - localStorage cannot prevent impersonation: any user can type any employeeId.
//   - Participation leaderboard cannot aggregate data across users/devices.
//   - Real anti-impersonation requires:
//       1. LINE LIFF SDK to get verified LINE userId
//       2. Backend API to match LINE userId against employee database
//       3. Server-side session / JWT validation
//   - Real leaderboard requires a backend database (e.g., Supabase) to collect
//     all players' scores and participation records centrally.

const PROFILE_KEY = 'factoryChaos_profile';
const PROGRESS_KEY = 'factoryChaos_progress';
const HIGH_SCORE_KEY = 'factoryChaos_highScore';

export function getProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: PlayerProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(HIGH_SCORE_KEY);
}

export function getProgress(): GameProgress {
  if (import.meta.env.VITE_DEV_MODE === "true") {
    return {
      highestUnlockedStage: 9,
      passedStages: [1, 2, 3, 4, 5, 6, 7, 8],
    };
  }

  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }

  return { highestUnlockedStage: 1, passedStages: [] };
}

export function saveProgress(progress: GameProgress): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function unlockNextStage(passedStage: number): void {
  const progress = getProgress();
  if (!progress.passedStages.includes(passedStage)) {
    progress.passedStages.push(passedStage);
  }
  progress.highestUnlockedStage = Math.max(progress.highestUnlockedStage, passedStage + 1);
  saveProgress(progress);
}

export function getEndlessHighScore(): number {
  const raw = localStorage.getItem(HIGH_SCORE_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

export function saveEndlessHighScore(score: number): void {
  const current = getEndlessHighScore();
  if (score > current) {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  }
}