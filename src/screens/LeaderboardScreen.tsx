import { useState, useEffect } from 'react';
import { getProfile, getEndlessHighScore } from '../storage';
import {
  fetchTopEndlessScores,
  fetchDeptParticipation,
  fetchTeamMembersProgress,
  type RemoteEndlessEntry,
  type RemoteDeptParticipation,
  type RemoteTeamMemberProgress,
} from '../services/leaderboardService';
import type { LeaderboardEntry } from '../types';

interface Props {
  onBack: () => void;
  initialTab?: 'endless' | 'dept';
}

type Tab = 'endless' | 'dept';

export default function LeaderboardScreen({ onBack, initialTab = 'dept' }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [visible, setVisible] = useState(false);
  const [loadingEndless, setLoadingEndless] = useState(true);
  const [loadingDept, setLoadingDept] = useState(true);
  const [remoteEndless, setRemoteEndless] = useState<RemoteEndlessEntry[]>([]);
  const [remoteDept, setRemoteDept] = useState<RemoteDeptParticipation[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<RemoteDeptParticipation | null>(null);
  const [teamMembers, setTeamMembers] = useState<RemoteTeamMemberProgress[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);

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

  const endlessEntries: LeaderboardEntry[] = (() => {
    const base: RemoteEndlessEntry[] = [...remoteEndless];

    if (profile && localScore > 0) {
      const myKey = myLineId ?? profile.employeeId;
      const idx = base.findIndex((e) => (e.lineUserId || e.employeeId) === myKey);

      if (idx === -1) {
        base.push({
          lineUserId: myLineId ?? 'dev_user',
          employeeId: profile.employeeId,
          department: profile.department,
          score: localScore,
          survivedSeconds: Math.floor(localScore / 35),
        });
      } else if (localScore > base[idx].score) {
        base[idx] = {
          ...base[idx],
          score: localScore,
          survivedSeconds: Math.floor(localScore / 35),
        };
      }
    }

    return base
      .sort((a, b) => b.score - a.score)
      .map((e, i) => ({
        rank: i + 1,
        employeeId: e.employeeId,
        displayName: e.displayName ?? null,
        dept: e.department,
        score: e.score,
        survivedSeconds: e.survivedSeconds,
        lineUserId: e.lineUserId,
      }));
  })();

  const isMe = (entry: LeaderboardEntry): boolean => {
    if (!profile) return false;
    if (myLineId && entry.lineUserId) return myLineId === entry.lineUserId;
    return profile.employeeId === entry.employeeId;
  };

  const hasEndlessData = endlessEntries.length > 0;
  const hasDeptData = remoteDept.length > 0;

  const medal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank === 4) return '⭐';
    if (rank === 5) return '⭐';
    return null;
  };

  const openTeamDetail = async (dept: RemoteDeptParticipation) => {
    setSelectedTeam(dept);
    setTeamMembers([]);
    setLoadingTeamMembers(true);

    try {
      const members = await fetchTeamMembersProgress(dept.dept);
      setTeamMembers(members);
    } catch {
      setTeamMembers([]);
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 overflow-hidden">
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

      <div className="flex px-4 mb-4 gap-2 flex-shrink-0">
        <button
          onClick={() => setTab('endless')}
          className="flex-1 py-3 rounded-xl font-game font-bold active:scale-95 transition-all"
          style={{
            background:
              tab === 'endless'
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
            background:
              tab === 'dept'
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
                <div className="font-game text-white/40 text-center text-base">
                  ยังไม่มีคะแนน Endless
                </div>
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
                          : entry.rank <= 5
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(255,255,255,0.04)',
                        border: mine
                          ? '1.5px solid rgba(245,158,11,0.5)'
                          : '1px solid rgba(255,255,255,0.06)',
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateX(0)' : 'translateX(40px)',
                        transition: `all 0.4s ease ${i * 0.04}s`,
                      }}
                    >
                      <div className="w-8 text-center font-game" style={{ fontSize: '0.9rem' }}>
                        {m ?? <span className="text-white/40 text-xs">#{entry.rank}</span>}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-game text-white font-bold text-base truncate">
                        {entry.employeeId}
{entry.displayName ? ` · ${entry.displayName}` : ''}
                        </div>
                        <div className="font-game text-white/55 text-sm truncate">{entry.dept}</div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="font-game text-yellow-400 font-bold">
                          {entry.score.toLocaleString()}
                        </div>
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
  Participation Team · % สมาชิกทีมที่เล่นครบทั้ง 3 ด่าน
</div>

<div
  className="font-game text-center text-yellow-300 mb-3"
  style={{
    fontSize: 'clamp(0.8rem,3vw,0.95rem)',
    lineHeight: 1.45,
  }}
>
  🎁 Gift Card 1,500 / 1,000 / 500 บาท
  <br />
  มอบให้ทีมที่มี % สมาชิกเล่นครบ 3 ด่านสูงที่สุด
  <br />
  🎲 หากหลายทีมมี % เท่ากัน จะใช้การจับสลากตัดสินรางวัล
</div>

{loadingDept ? (
              <div className="flex items-center justify-center py-12">
                <div className="font-game text-white/30 text-sm">กำลังโหลด...</div>
              </div>
            ) : !hasDeptData ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="text-5xl">📊</span>
                <div className="font-game text-white/40 text-center text-base">
                  ยังไม่มีข้อมูลการเข้าร่วม
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {remoteDept.map((dept, i) => {
                  const relativeWidth = Math.max(0, Math.min(100, dept.percent));
                  const barColor = '#22c55e';

                  return (
                    <button
                      key={dept.dept}
                      type="button"
                      onClick={() => openTeamDetail(dept)}
                      className="w-full rounded-2xl p-4 text-left active:scale-95 transition-transform"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateX(0)' : 'translateX(40px)',
                        transition: `all 0.4s ease ${i * 0.06}s`,
                      }}
                    >
                      <div className="mb-2">
  <div className="flex items-start justify-between gap-2">
    <div className="min-w-0 flex-1">
      <div
        className="font-game text-white font-bold leading-tight break-words"
        style={{
          fontSize: 'clamp(1.15rem,4vw,1.4rem)',
        }}
      >
        {dept.dept}
      </div>

      {i < 5 && (
        <div
          className="mt-1 inline-block rounded-full px-2 py-1 font-game font-black"
          style={{
            background: '#2563eb',
color: '#fff',
            fontSize: 'clamp(0.7rem,2.8vw,0.85rem)',
          }}
        >
          {i === 0
  ? '🎁 ลุ้นรับรางวัล'
  : i === 1
  ? '🎁 ลุ้นรับรางวัล'
  : '🎁 ลุ้นรับรางวัล'}
        </div>
      )}
    </div>

    <div
      className="font-game font-bold shrink-0"
      style={{
        color: barColor,
        fontSize: 'clamp(1rem, 4vw, 1.2rem)',
      }}
    >
      {dept.percent}%
    </div>
  </div>
</div>

                      <div
                        className="mb-2 font-game text-white/45"
                        style={{ fontSize: 'clamp(0.7rem, 3vw, 0.85rem)' }}
                      >
                        
                      </div>

                      <div
                        className="w-full rounded-full h-3 overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.08)' }}
                      >
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
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {selectedTeam && (
        <div className="fixed inset-0 z-[99999] bg-black/80 px-4 py-6">
          <div className="mx-auto flex h-full max-w-[390px] flex-col rounded-[28px] border-2 border-blue-400 bg-slate-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-game text-blue-300 font-bold text-sm">TEAM DETAIL</div>
                <div
  className="font-game text-white font-black leading-tight break-words"
  style={{
    fontSize: 'clamp(1.4rem, 5vw, 2rem)',
    lineHeight: 1.1,
  }}
>
  {selectedTeam.dept}
</div>
                <div className="font-game text-white/60 text-sm mt-1">
                  ผ่านครบ {selectedTeam.participants}/{selectedTeam.totalMembers} คน ·{' '}
                  {selectedTeam.percent}%
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedTeam(null);
                  setTeamMembers([]);
                }}
                className="h-11 w-11 shrink-0 rounded-xl bg-white/10 text-2xl text-white active:scale-90"
              >
                ×
              </button>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto space-y-2">
              {loadingTeamMembers ? (
                <div className="py-10 text-center font-game text-white/40">กำลังโหลด...</div>
              ) : teamMembers.length === 0 ? (
                <div className="py-10 text-center font-game text-white/40">ไม่พบสมาชิกทีม</div>
              ) : (
                teamMembers.map((member) => (
                  <div
                    key={member.employeeId}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
                  >
                    <div>
                      <div className="font-game font-black text-white text-lg">
                        {member.employeeId}
                      </div>
                      <div className="font-game text-white/45 text-xs">
                        ผ่านแล้ว {member.clearedStageCount}/3 ด่าน
                      </div>
                    </div>

                    <div
                      className={[
                        'rounded-full px-3 py-1 font-game font-black text-sm',
                        member.completed
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-white/45',
                      ].join(' ')}
                    >
                      {member.completed ? 'ครบแล้ว' : 'ยังไม่ครบ'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}