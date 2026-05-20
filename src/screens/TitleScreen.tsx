import { useState, useEffect, useCallback } from 'react';
import { isSoundEnabled, toggleSoundEnabled } from '../sound';
import type { PlayerProfile, GameProgress } from '../types';

interface Props {
  profile: PlayerProfile;
  progress: GameProgress;
  onCampaign: () => void;
  onEndless: () => void;
  onLeaderboard: () => void;
  onEditProfile?: () => void;
  onResetProfile: () => void;
}

const ENDLESS_REQUIRES_STAGES = [1, 2, 3, 4, 5, 6, 7, 8];

export default function TitleScreen({
  profile,
  progress,
  onCampaign,
  onEndless,
  onLeaderboard,
  onEditProfile = undefined,
  onResetProfile,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [bobbing, setBobbing] = useState(false);
  const [endlessPopFeedback, setEndlessPopFeedback] = useState(false);
  const [versionTaps, setVersionTaps] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(isSoundEnabled());

  const isEndlessUnlocked = ENDLESS_REQUIRES_STAGES.every(s =>
    progress.passedStages.includes(s)
  );

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 50);
    const t2 = setTimeout(() => setBobbing(true), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleEndlessPress = useCallback(() => {
    if (!isEndlessUnlocked) {
      setEndlessPopFeedback(true);
      setTimeout(() => setEndlessPopFeedback(false), 1200);
      return;
    }
    onEndless();
  }, [isEndlessUnlocked, onEndless]);

  const handleToggleSound = useCallback(() => {
    const next = toggleSoundEnabled();
    setSoundEnabled(next);
  }, []);

  const handleVersionTap = useCallback(() => {
    setVersionTaps(n => {
      const next = n + 1;
      if (next >= 5) {
        onResetProfile();
        return 0;
      }
      return next;
    });
  }, [onResetProfile]);

  return (
    <div className="flex flex-col items-center justify-between h-full bg-gradient-to-b from-yellow-400 via-orange-400 to-red-500 px-5 py-6 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['⚙️', '🔧', '⛑️', '🔥', '⚡', '🧤', '💥', '🪜', '📦', '🦺'].map((e, i) => (
          <div
            key={i}
            className="absolute text-4xl opacity-15"
            style={{
              left: `${(i * 11 + 5) % 90}%`,
              top: `${(i * 17 + 8) % 85}%`,
              transform: `rotate(${i * 37}deg)`,
            }}
          >
            {e}
          </div>
        ))}
      </div>

      <div
        className="relative z-10 w-full flex items-center justify-between gap-2"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease 0.3s' }}
      >
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-2.5 flex-1 min-w-0"
          style={{ background: 'rgba(0,0,0,0.22)' }}
        >
          <span className="text-2xl">👷</span>
          <div className="min-w-0">
            <div className="font-game text-white font-bold text-sm leading-tight">
              {profile.employeeId}
            </div>
            <div
              className="font-game text-white/70 text-xs leading-tight"
              style={{
                maxWidth: '160px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {profile.department}
            </div>
          </div>
        </div>

        {onEditProfile && (
          <button
            onClick={onEditProfile}
            className="rounded-2xl px-3 py-2 font-game text-white/80 text-xs active:scale-90 transition-transform"
            style={{ background: 'rgba(0,0,0,0.22)' }}
          >
            ✏️
          </button>
        )}

        <button
          onClick={handleToggleSound}
          className="rounded-2xl px-3 py-2 font-game text-white text-sm active:scale-90 transition-transform"
          style={{ background: 'rgba(0,0,0,0.22)' }}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </div>

      <div
        className="relative z-10 text-center flex-1 flex flex-col items-center justify-center py-4"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s',
        }}
      >
        <div
          className="text-6xl mb-4"
          style={{ animation: bobbing ? 'bob 1.5s ease-in-out infinite alternate' : 'none' }}
        >
          🏭
        </div>

        <div className="flex flex-col items-center gap-0">
          <h1
            className="font-game text-white font-bold text-center leading-tight"
            style={{
              fontSize: 'clamp(2rem, 9vw, 2.8rem)',
              WebkitTextStroke: '2px rgba(180,83,9,0.9)',
              textShadow: '3px 3px 0 #b45309, 5px 5px 0 rgba(0,0,0,0.4)',
              lineHeight: 1.15,
            }}
          >
            โรงงาน
          </h1>

          <h1
            className="font-game text-yellow-200 font-bold text-center leading-tight"
            style={{
              fontSize: 'clamp(2rem, 9vw, 2.8rem)',
              WebkitTextStroke: '2px rgba(120,53,15,0.8)',
              textShadow: '3px 3px 0 #92400e, 5px 5px 0 rgba(0,0,0,0.4)',
              lineHeight: 1.15,
            }}
          >
            สุดป่วน
          </h1>

          <h1
            className="font-game text-red-200 font-bold text-center leading-tight"
            style={{
              fontSize: 'clamp(1.4rem, 6vw, 2rem)',
              WebkitTextStroke: '1.5px rgba(127,29,29,0.9)',
              textShadow: '2px 2px 0 #7f1d1d, 4px 4px 0 rgba(0,0,0,0.4)',
              lineHeight: 1.2,
            }}
          >
            ชิบหายวายวอด
          </h1>
        </div>

        <p
          className="font-game text-white text-center mt-4 px-4 leading-snug"
          style={{
            fontSize: 'clamp(0.85rem, 3.5vw, 1rem)',
            opacity: 0.9,
            textShadow: '1px 1px 0 rgba(0,0,0,0.4)',
          }}
        >
          เพราะความปลอดภัยไม่ใช่เรื่องตลก
        </p>
      </div>

      <div
        className="relative z-10 w-full max-w-xs flex flex-col gap-4"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.25s',
        }}
      >
        <button
          onClick={onCampaign}
          className="w-full py-5 rounded-2xl font-game font-bold active:scale-95 transition-transform text-white"
          style={{
            fontSize: 'clamp(1.1rem, 5vw, 1.4rem)',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            boxShadow: '0 6px 0 #14532d, 0 8px 15px rgba(0,0,0,0.3)',
          }}
        >
          🎮 โหมดผ่านด่าน
        </button>

        <div className="relative">
          <button
            onClick={handleEndlessPress}
            className="w-full py-5 rounded-2xl font-game font-bold active:scale-95 transition-transform text-white"
            style={{
              fontSize: 'clamp(1.1rem, 5vw, 1.4rem)',
              background: isEndlessUnlocked
                ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                : 'linear-gradient(135deg, #475569, #334155)',
              boxShadow: isEndlessUnlocked
                ? '0 6px 0 #7f1d1d, 0 8px 15px rgba(0,0,0,0.3)'
                : '0 6px 0 #1e293b',
              opacity: isEndlessUnlocked ? 1 : 0.8,
            }}
          >
            {isEndlessUnlocked ? '♾️ Endless Mode' : '🔒 Endless Mode'}
          </button>

          {endlessPopFeedback && (
            <div
              className="absolute inset-0 flex items-center justify-center rounded-2xl z-10 pointer-events-none bounce-in"
              style={{ background: 'rgba(0,0,0,0.85)' }}
            >
              <span
                className="font-game text-yellow-400 text-center"
                style={{ fontSize: 'clamp(0.85rem, 4vw, 1rem)' }}
              >
                ผ่านครบ 8 ด่านก่อน!
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onLeaderboard}
          className="w-full py-4 rounded-2xl font-game font-bold active:scale-95 transition-transform text-white"
          style={{
            fontSize: 'clamp(1rem, 4.5vw, 1.2rem)',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            boxShadow: '0 6px 0 #1e3a8a, 0 8px 15px rgba(0,0,0,0.3)',
          }}
        >
          🏆 Leaderboard
        </button>
      </div>

      <button
        onClick={handleVersionTap}
        className="relative z-10 font-game text-white/40 text-xs pt-3 pb-1 active:text-white/60 transition-colors"
        style={{ background: 'none', border: 'none' }}
      >
        v1.0 · Factory Safety Training
        {versionTaps > 0 && versionTaps < 5 && (
          <span className="ml-2 text-white/20">{'·'.repeat(versionTaps)}</span>
        )}
      </button>

      <style>{`
        @keyframes bob {
          from { transform: translateY(0px) rotate(-3deg); }
          to { transform: translateY(-10px) rotate(3deg); }
        }
      `}</style>
    </div>
  );
}