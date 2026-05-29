import { useState, useCallback } from 'react';
import { isSoundEnabled, toggleSoundEnabled } from '../sound';

interface UsePauseProps {
  onGiveUp?: () => void;
  onGoHome?: () => void;
}

interface UsePauseReturn {
  paused: boolean;
  togglePause: () => void;
  PauseOverlay: JSX.Element | null;
}

export function usePause({
  onGiveUp,
  onGoHome,
}: UsePauseProps = {}): UsePauseReturn {
  const [paused, setPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(isSoundEnabled());

  const togglePause = useCallback(() => {
    setPaused(p => !p);
  }, []);

  const handleToggleSound = useCallback(() => {
    const next = toggleSoundEnabled();
    setSoundEnabled(next);
  }, []);

  const handleGiveUp = useCallback(() => {
    setPaused(false);
    onGiveUp?.();
  }, [onGiveUp]);

  const handleGoHome = useCallback(() => {
    setPaused(false);
    if (onGoHome) onGoHome();
    else window.location.href = '/';
  }, [onGoHome]);

  const PauseOverlay = paused ? (
    <div
    className="fixed inset-0 z-[99999] flex flex-col items-center justify-center gap-6"
      style={{ background: 'rgba(0,0,0,0.88)' }}
    >
      <div
        className="font-game text-white font-bold"
        style={{ fontSize: 'clamp(1.8rem,8vw,2.4rem)' }}
      >
        ⏸ หยุดชั่วคราว
      </div>

      <div className="flex flex-col gap-4 w-full px-8">
        <button
          onClick={togglePause}
          className="rounded-3xl px-10 py-5 font-game font-bold text-white active:scale-95 transition-transform"
          style={{
            background: 'linear-gradient(135deg,#16a34a,#15803d)',
            boxShadow: '0 6px 0 #14532d',
            fontSize: 'clamp(1.2rem,5.5vw,1.6rem)',
          }}
        >
          ▶ เล่นต่อ
        </button>

        <button
          onClick={handleToggleSound}
          className="rounded-3xl px-10 py-5 font-game font-bold text-white active:scale-95 transition-transform"
          style={{
            background: soundEnabled
              ? 'linear-gradient(135deg,#f59e0b,#d97706)'
              : 'linear-gradient(135deg,#64748b,#475569)',
            boxShadow: soundEnabled ? '0 6px 0 #92400e' : '0 6px 0 #334155',
            fontSize: 'clamp(1.2rem,5.5vw,1.6rem)',
          }}
        >
          {soundEnabled ? '🔊 เปิดเสียง' : '🔇 ปิดเสียง'}
        </button>

        <button
          onClick={handleGiveUp}
          className="rounded-3xl px-10 py-5 font-game font-bold text-white active:scale-95 transition-transform"
          style={{
            background: 'linear-gradient(135deg,#dc2626,#991b1b)',
            boxShadow: '0 6px 0 #7f1d1d',
            fontSize: 'clamp(1.2rem,5.5vw,1.6rem)',
          }}
        >
          💀 ยอมแพ้
        </button>

        <button
          onClick={handleGoHome}
          className="rounded-3xl px-10 py-5 font-game font-bold text-white active:scale-95 transition-transform"
          style={{
            background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
            boxShadow: '0 6px 0 #1e3a8a',
            fontSize: 'clamp(1.2rem,5.5vw,1.6rem)',
          }}
        >
          🏠 กลับสู่หน้าหลัก
        </button>
      </div>
    </div>
  ) : null;

  return { paused, togglePause, PauseOverlay };
}

interface PauseButtonProps {
  paused: boolean;
  onToggle: () => void;
}

export default function PauseButton({ paused, onToggle }: PauseButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="rounded-xl flex items-center justify-center active:scale-90 transition-transform"
      style={{
        width: '36px',
        height: '36px',
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.2)',
        fontSize: '1rem',
        color: 'white',
        fontWeight: 'bold',
      }}
    >
      {paused ? '▶' : '⏸'}
    </button>
  );
}