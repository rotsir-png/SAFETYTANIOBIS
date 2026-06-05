export type Screen =
  | 'register'
  | 'title'
  | 'campaign'
  | 'stage1'
  | 'stage2'
  | 'stage3'
  | 'endless'
  | 'result'
  | 'leaderboard';

export interface PlayerProfile {
  employeeId: string;
  department: string;
  createdAt: string;
  // LINE LIFF identity fields — populated after LIFF login.
  // lineUserId is verified by LINE's OAuth; employeeId is self-reported.
  lineUserId?: string;
  displayName?: string;
  pictureUrl?: string;
  /** When true, normal users cannot edit the profile. Only the hidden dev reset clears it. */
  profileLocked?: boolean;
}

export interface GameProgress {
  highestUnlockedStage: number;
  passedStages: number[];
}

export interface GameResult {
  score: number;
  stage: number | 'endless';
  passed: boolean;
  highScore?: number;
  passScore?: number;
}

export interface SwipeCard {
  id: number;
  label: string;
  emoji: string;
  isSafe: boolean;
}

export interface PPEItem {
  id: number;
  emoji: string;
  label: string;
  isCorrect: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  employeeId: string;
  dept: string;
  score: number;
  survivedSeconds: number;
  lineUserId?: string;
}

export interface DeptParticipation {
  dept: string;
  participants: number;
  totalEmployees: number;
}
