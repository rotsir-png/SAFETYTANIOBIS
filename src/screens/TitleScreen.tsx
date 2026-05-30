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

const ENDLESS_REQUIRES_STAGES = [1, 2, 3];

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
  const [endlessPopFeedback, setEndlessPopFeedback] = useState(false);
  const [versionTaps, setVersionTaps] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(isSoundEnabled());

  const isEndlessUnlocked = ENDLESS_REQUIRES_STAGES.every(s =>
    progress.passedStages.includes(s)
  );

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t1);
  }, []);

  const handleEndlessPress = useCallback(() => {
    if (!isEndlessUnlocked) {
      setEndlessPopFeedback(true);
      setTimeout(() => setEndlessPopFeedback(false), 2000);
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
    <div
      className="flex flex-col items-center h-full px-5 py-6 overflow-hidden relative"
      style={{
        background:
          'radial-gradient(circle at top, #145b6b 0%, #071827 40%, #030712 100%)',
      }}
    >
      {/* Soft background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full"
          style={{ background: 'rgba(45,170,190,0.18)', filter: 'blur(12px)' }}
        />
        <div
          className="absolute top-24 right-[-90px] w-64 h-64 rounded-full"
          style={{ background: 'rgba(255,255,255,0.07)', filter: 'blur(14px)' }}
        />
      </div>

      {/* Top profile bar */}
      <div
        className="relative z-10 w-full flex items-center justify-between gap-2"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease 0.2s' }}
      >
        <div
          className="rounded-2xl px-5 py-3 flex-1 min-w-0 border border-white/10"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <div className="font-game text-white font-bold text-base leading-tight">
            {profile.employeeId}
          </div>
          <div
            className="font-game text-white/70 text-sm leading-tight"
            style={{
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {profile.department}
          </div>
        </div>

        {onEditProfile && (
          <button
            onClick={onEditProfile}
            className="rounded-2xl px-4 py-3 font-game text-white text-sm active:scale-90 transition-transform border border-white/10"
            style={{ background: 'rgba(200,200,200,0.08)' }}
          >
            แก้ไขข้อมูล ✏️
          </button>
        )}

        <button
          onClick={handleToggleSound}
          className="rounded-2xl px-4 py-3 font-game text-white text-sm active:scale-90 transition-transform border border-white/10"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          {soundEnabled ? 'เสียงเปิด 🔊' : 'เสียงปิด🔇'}
        </button>
      </div>

      {/* Hero */}
      <div
        className="relative z-10 text-center w-full flex flex-col items-center"
        style={{
          marginTop: 'clamp(44px, 9vh, 76px)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-18px)',
          transition: 'all 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.05s',
        }}
      >
        <h1
          className="font-game text-white font-bold text-center leading-none"
          style={{
            fontSize: 'clamp(3.3rem, 16vw, 5.4rem)',
            letterSpacing: '0.02em',
            textShadow:
              '0 5px 0 rgba(0,0,0,0.6), 0 0 26px rgba(45,170,190,0.5)',
          }}
        >
          TANIOBIS
        </h1>

        <h2
          className="font-game font-bold text-center mt-4"
          style={{
            color: '#2DAABE',
            fontSize: 'clamp(1.85rem, 8vw, 3rem)',
            lineHeight: 1,
            textShadow:
              '0 4px 0 rgba(0,0,0,0.65), 0 0 20px rgba(45,170,190,0.55)',
          }}
        >
          SAFETY GAME EVENT
        </h2>

        <p
          className="font-game text-white text-center mt-5 px-4 leading-snug"
          style={{
            fontSize: 'clamp(1rem, 4vw, 1.25rem)',
            textShadow: '0 2px 5px rgba(0,0,0,0.55)',
          }}
        >
          For Safety Month 2026
        </p>
      </div>

      {/* Buttons */}
      <div
        className="relative z-10 w-full max-w-xs flex flex-col gap-4 mt-8"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s',
        }}
      >
        <button
          onClick={onCampaign}
          className="w-full py-5 rounded-2xl font-game font-bold active:scale-95 transition-transform text-white"
          style={{
            fontSize: 'clamp(1.45rem, 5vw, 1.7rem)',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            boxShadow: '0 7px 0 #14532d, 0 12px 20px rgba(0,0,0,0.38)',
          }}
        >
          🎮โหมดผ่านด่าน
        </button>

        <div className="relative">
          <button
            onClick={handleEndlessPress}
            className="w-full py-5 rounded-2xl font-game font-bold active:scale-95 transition-transform text-white"
            style={{
              fontSize: 'clamp(1.35rem, 5vw, 1.65rem)',
              background: isEndlessUnlocked
                ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                : 'linear-gradient(135deg, #7f1d1d, #450a0a)',
              boxShadow: isEndlessUnlocked
                ? '0 7px 0 #7f1d1d, 0 12px 20px rgba(0,0,0,0.38)'
                : '0 7px 0 #1f0303, 0 12px 20px rgba(0,0,0,0.38)',
              opacity: isEndlessUnlocked ? 1 : 0.9,
            }}
          >
            ♾️Endless Mode
          </button>

          {endlessPopFeedback && (
            <div
              className="absolute inset-0 flex items-center justify-center rounded-2xl z-10 pointer-events-none bounce-in"
              style={{ background: 'rgba(0,0,0,0.9)' }}
            >
              <span
                className="font-game text-yellow-300 text-center px-4"
                style={{ fontSize: 'clamp(1.15rem, 4.5vw, 1.4rem)' }}
              >
                ผ่านครบ 3 ด่านก่อน!
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onLeaderboard}
          className="w-full py-4 rounded-2xl font-game font-bold active:scale-95 transition-transform text-white"
          style={{
            fontSize: 'clamp(1.25rem, 4.5vw, 1.5rem)',
            background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
            boxShadow: '0 7px 0 #2e1065, 0 12px 20px rgba(0,0,0,0.38)',
          }}
        >
          🏆Leaderboard
        </button>
      </div>

      <button
        onClick={handleVersionTap}
        className="relative z-10 mt-auto font-game text-white/35 text-xs pt-3 pb-1 active:text-white/60 transition-colors"
        style={{ background: 'none', border: 'none' }}
      >
        By TANIOBIS HSE Department
        {versionTaps > 0 && versionTaps < 5 && (
          <span className="ml-2 text-white/20">{'·'.repeat(versionTaps)}</span>
        )}
      </button>
    </div>
  );
}