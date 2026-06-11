import { useState, useEffect, useRef } from 'react';
import type { GameResult } from '../types';
import { playSfx } from '../sound';

interface Props {
  result: GameResult;
  onRetry: () => void;
  onNext: () => void;
  onHome: () => void;
}

const STAGE_PASS_TEXT: Record<number, string> = {
  1: 'Stage 1 ผ่าน',
  2: 'Stage 2 ผ่าน',
  3: 'ปิดเคสครบ 5/5',
  4: 'ด่าน 4 ผ่าน',
  5: 'Hazard is Coming ผ่าน',
  6: 'Machine Sync ผ่าน',
  7: 'Forklift Panic ผ่าน',
  8: 'Final Chaos ผ่าน!',
};

export default function ResultScreen({ result, onRetry, onNext, onHome }: Props) {
  const [visible, setVisible] = useState(false);
  const [scoreDisplay, setScoreDisplay] = useState(0);

  const winSfx = useRef(new Audio('/sfx/win.wav'));
  const loseSfx = useRef(new Audio('/sfx/lose.wav'));

  const isEndless = result.stage === 'endless';
  const isStage3 = result.stage === 3;
  const isStage7 = result.stage === 7;
  const STAGE_PASS_SCORE: Record<number, number> = {
    1: 300,
    2: 400,
    7: 0,
    8: 1000,
  };

  const passed = result.passed;
  const isNewHigh = isEndless && result.highScore !== undefined && result.score >= result.highScore;

  useEffect(() => {
    winSfx.current.volume = 0.65;
    loseSfx.current.volume = 0.7;

    if (passed) {
      playSfx(winSfx.current);
    } else {
      playSfx(loseSfx.current);
    }
  }, [passed]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible || isStage7) return;

    let current = 0;
    const target = result.score;
    const step = Math.max(1, Math.floor(target / 25));

    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      setScoreDisplay(current);
      if (current >= target) clearInterval(interval);
    }, 35);

    return () => clearInterval(interval);
  }, [visible, result.score, isStage7]);

  const bgGradient = passed
    ? 'from-green-700 via-green-600 to-emerald-500'
    : 'from-red-800 via-red-700 to-rose-600';

  return (
    <div className={`flex flex-col items-center justify-between h-full bg-gradient-to-b ${bgGradient} px-6 py-8 overflow-hidden relative`}>
      {passed && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 22 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                left: `${(i * 4.5) % 100}%`,
                top: '-12px',
                background: ['#fbbf24', '#34d399', '#60a5fa', '#f87171', '#fb923c'][i % 5],
                animation: `confettiFall ${1.4 + (i % 5) * 0.2}s ${(i % 7) * 0.12}s ease-in forwards`,
                transform: `rotate(${i * 37}deg)`,
              }}
            />
          ))}
        </div>
      )}

      <div
        className="relative z-10 text-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.4)',
          transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        <div className="text-8xl mb-2">{passed ? '🎉' : '😵'}</div>

        <h1
          className="font-game text-white font-bold leading-tight"
          style={{
            fontSize: 'clamp(1.8rem, 9vw, 3rem)',
            textShadow: '4px 4px 0 rgba(0,0,0,0.3)',
          }}
        >
          {passed ? 'Clear!' : 'Failed!'}
        </h1>

        {isEndless && isNewHigh && (
          <div className="font-game text-yellow-200 text-lg mt-1" style={{ animation: 'bounce 1s infinite' }}>
            HIGH SCORE!
          </div>
        )}

        {!isEndless && passed && typeof result.stage === 'number' && (
          <div className="font-game text-white/90 text-xl mt-2">
            {STAGE_PASS_TEXT[result.stage]}
          </div>
        )}
      </div>

      <div
        className="relative z-10 text-center"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.25s' }}
      >
        {isStage3 ? (
  <>
    <div
      className="font-game text-white font-bold"
      style={{
        fontSize: 'clamp(2.5rem, 14vw, 5rem)',
        textShadow: '4px 4px 0 rgba(0,0,0,0.3)',
      }}
    >
      {passed ? '5/5' : 'ปิดเคสไม่ครบ'}
    </div>

    <div className="font-game text-white/70 text-xl">
    {passed ? 'เคส' : 'ลองใหม่อีกครั้ง'}
    </div>
  </>
) : isStage7 ? (
  <div className="font-game text-white text-6xl mt-4" style={{ textShadow: '3px 3px 0 rgba(0,0,0,0.3)' }}>
    {passed ? 'รอดแล้ว 20 วิ สุดยอดเว่อ!' : 'ไม่รอด ไม่เหลือ!'}
  </div>
) : (
  <>
    <div
      className="font-game text-white font-bold"
      style={{
        fontSize: 'clamp(2.5rem, 14vw, 5rem)',
        textShadow: '4px 4px 0 rgba(0,0,0,0.3)',
      }}
    >
      {scoreDisplay}
    </div>

    <div className="font-game text-white/70 text-xl">คะแนน</div>
  </>
)}
      </div>

<div
  className="relative z-10 w-full max-w-xs flex flex-col gap-3"
  style={{
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(30px)',
    transition: 'all 0.5s ease 0.4s',
  }}
>
        {passed && !isEndless && typeof result.stage === 'number' && result.stage < 3 && (
          <button
            onClick={onNext}
            className="w-full py-5 rounded-2xl font-game font-bold active:scale-95 transition-transform text-white"
            style={{
              fontSize: 'clamp(1.1rem, 5vw, 1.4rem)',
              background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
              boxShadow: '0 6px 0 #1e3a8a',
            }}
          >
            ด่านต่อไป →
          </button>
        )}

        <button
          onClick={onRetry}
          className="w-full py-5 rounded-2xl font-game font-bold active:scale-95 transition-transform text-white"
          style={{
            fontSize: 'clamp(1.1rem, 5vw, 1.4rem)',
            background: 'linear-gradient(135deg, #d97706, #b45309)',
            boxShadow: '0 6px 0 #78350f',
          }}
        >
          🔄 เอาใหม่
        </button>

        <button
          onClick={onHome}
          className="w-full py-4 rounded-2xl font-game font-bold active:scale-95 transition-transform"
          style={{
            fontSize: 'clamp(1rem, 4.5vw, 1.2rem)',
            background: 'rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          🏠 กลับสู่หน้าหลัก
        </button>
      </div>

      <style>{`
        @keyframes confettiFall {
          to { top: 110%; transform: rotate(720deg) scale(0.5); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}