import { useState, useEffect } from 'react';
import { getProfile, getEndlessHighScore } from '../storage';
import {
  fetchTopEndlessScores,
  fetchDeptParticipation,
  type RemoteEndlessEntry,
  type RemoteDeptParticipation,
} from '../services/leaderboardService';
import type { LeaderboardEntry } from '../types';

interface Props {
  onBack: () => void;
}

type Tab = 'endless' | 'dept';

export default function LeaderboardScreen({ onBack }: Props) {
  const [tab, setTab] = useState<Tab>('endless');
  const [visible, setVisible] = useState(false);
  const [loadingEndless, setLoadingEndless] = useState(true);
  const [loadingDept, setLoadingDept] = useState(true);
  const [remoteEndless, setRemoteEndless] = useState<RemoteEndlessEntry[]>([]);
  const [remoteDept, setRemoteDept] = useState<RemoteDeptParticipation[]>([]);

  const profile = getProfile();
  const localScore = getEndlessHighScore();
  const myLineId = profile?.lineUserId ?? null;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    fetchTopEndlessScores(20)
      .then(setRemoteEndless)
      .catch(() => {})
      .finally(() => setLoadingEndless(false));
    fetchDeptParticipation()
      .then(setRemoteDept)
      .catch(() => {})
      .finally(() => setLoadingDept(false));
  }, []);

  // Merge local high score — identified by lineUserId, falls back to employeeId
  const endlessEntries: LeaderboardEntry[] = (() => {
    const base: RemoteEndlessEntry[] = [...remoteEndless];

    if (profile && localScore > 0) {
      const myKey = myLineId ?? profile.employeeId;
      const idx = base.findIndex(e => (e.lineUserId || e.employeeId) === myKey);
      if (idx === -1) {
        base.push({
          lineUserId:      myLineId ?? 'dev_user',
          employeeId:      profile.employeeId,
          department:      profile.department,
          score:           localScore,
          survivedSeconds: Math.floor(localScore / 35),
        });
      } else if (localScore > base[idx].score) {
        base[idx] = { ...base[idx], score: localScore, survivedSeconds: Math.floor(localScore / 35) };
      }
    }

    return base
      .sort((a, b) => b.score - a.score)
      .map((e, i) => ({
        rank:            i + 1,
        employeeId:      e.employeeId,
        dept:            e.department,
        score:           e.score,
        survivedSeconds: e.survivedSeconds,
        lineUserId:      e.lineUserId,
      }));
  })();

  const isMe = (entry: LeaderboardEntry): boolean => {
    if (!profile) return false;
    if (myLineId && entry.lineUserId) return myLineId === entry.lineUserId;
    return profile.employeeId === entry.employeeId;
  };

  const hasEndlessData = endlessEntries.length > 0;
  const hasDeptData = remoteDept.length > 0;
  const maxParticipation = hasDeptData
  ? Math.max(...remoteDept.map(d => d.percent))
  : 1;

  const medal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-4 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center active:scale-90 transition-transform mr-3"
        >
          <span className="text-white text-xl">←</span>
        </button>
        <h2
          className="font-game text-yellow-400 font-bold"
          style={{ fontSize: 'clamp(1.25rem, 5.5vw, 1.6rem)' }}
        >
          🏆 Leaderboard
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex px-4 mb-4 gap-2 flex-shrink-0">
        <button
          onClick={() => setTab('endless')}
          className="flex-1 py-3 rounded-xl font-game font-bold active:scale-95 transition-all"
          style={{
            background: tab === 'endless'
              ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
              : 'rgba(255,255,255,0.08)',
            color: tab === 'endless' ? 'white' : 'rgba(255,255,255,0.5)',
            boxShadow: tab === 'endless' ? '0 3px 0 #7f1d1d' : 'none',
            fontSize: 'clamp(1rem, 4.2vw, 1.2rem)',
          }}
        >
          ♾️ Top Endless
        </button>
        <button
          onClick={() => setTab('dept')}
          className="flex-1 py-3 rounded-xl font-game font-bold active:scale-95 transition-all"
          style={{
            background: tab === 'dept'
              ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
              : 'rgba(255,255,255,0.08)',
            color: tab === 'dept' ? 'white' : 'rgba(255,255,255,0.5)',
            boxShadow: tab === 'dept' ? '0 3px 0 #1e3a8a' : 'none',
            fontSize: 'clamp(0.8rem, 3.5vw, 1rem)',
          }}
        >
          🏢 Participation
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6" style={{ scrollbarWidth: 'none' }}>
        {tab === 'endless' ? (
          <>
            <div className="font-game text-white/100 text-xs text-center mb-3">
              Top Endless Mode · คะแนนสูงสุด 1 อันดับต่อผู้เล่น
            </div>

            {loadingEndless ? (
              <div className="flex items-center justify-center py-12">
                <div className="font-game text-white/30 text-sm">กำลังโหลด...</div>
              </div>
            ) : !hasEndlessData ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="text-5xl">🏜️</span>
                <div className="font-game text-white/40 text-center text-base">ยังไม่มีคะแนน Endless</div>
                <div className="font-game text-white/25 text-center text-sm">เล่น Endless Mode เพื่อขึ้นบอร์ด!</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {endlessEntries.map((entry, i) => {
                  const mine = isMe(entry);
                  const m = medal(entry.rank);
                  return (
                    <div
                      key={`${entry.lineUserId ?? entry.employeeId}-${i}`}
                      className="flex items-center rounded-2xl px-4 py-4 gap-3"
                      style={{
                        background: mine
                          ? 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.08))'
                          : entry.rank <= 3 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
                        border: mine ? '1.5px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.06)',
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateX(0)' : 'translateX(40px)',
                        transition: `all 0.4s ease ${i * 0.04}s`,
                      }}
                    >
                      <div className="w-8 text-center font-game" style={{ fontSize: '0.9rem' }}>
                        {m ?? <span className="text-white/40" style={{ fontSize: '0.65rem' }}>#{entry.rank}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-game text-white font-bold text-base truncate">
                            {entry.employeeId}
                          </span>
                          {mine && (
                            <span
                              className="font-game text-yellow-400 rounded-full px-2 py-0.5 flex-shrink-0"
                              style={{ fontSize: '0.55rem', background: 'rgba(245,158,11,0.2)' }}
                            >
                              คุณ
                            </span>
                          )}
                        </div>
                        <div className="font-game text-white/55 text-sm truncate">{entry.dept}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-game text-yellow-400 font-bold" style={{ fontSize: 'clamp(1rem, 4vw, 1.2rem)' }}>
                          {entry.score.toLocaleString()}
                        </div>
                        <div className="font-game text-white/30 text-xs">{entry.survivedSeconds} วิ</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="font-game text-white/100 text-xs text-center mb-3">
            Participation Dept ที่จัดกลุ่มไว้ · % คนที่เล่นครบทั้ง 3 ด่าน
            </div>

            {loadingDept ? (
              <div className="flex items-center justify-center py-12">
                <div className="font-game text-white/30 text-sm">กำลังโหลด...</div>
              </div>
            ) : !hasDeptData ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="text-5xl">📊</span>
                <div className="font-game text-white/40 text-center text-base">ยังไม่มีข้อมูลการเข้าร่วม</div>
                <div className="font-game text-white/25 text-center text-sm">ผ่านด่านแรกเพื่อเริ่มนับ!</div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {remoteDept.map((dept, i) => {
                  const relativeWidth = (dept.percent / maxParticipation) * 100;
                  const barColor = i === 0 ? '#22c55e' : i <= 2 ? '#f59e0b' : '#60a5fa';
                  return (
                    <div
                      key={dept.dept}
                      className="rounded-2xl p-4"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateX(0)' : 'translateX(40px)',
                        transition: `all 0.4s ease ${i * 0.06}s`,
                      }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-game text-white font-bold text-base flex-1 min-w-0 pr-2 truncate">
                          {dept.dept}
                        </div>
                        <div className="font-game font-bold flex-shrink-0" style={{ color: barColor, fontSize: 'clamp(1rem, 4vw, 1.2rem)' }}>
                        {dept.percent}%
                        </div>
                      </div>
                      <div className="w-full rounded-full h-3 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: visible ? `${relativeWidth}%` : '0%',
                            background: barColor,
                            transition: `width 0.8s ease ${0.3 + i * 0.06}s`,
                            boxShadow: `0 0 6px ${barColor}80`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
