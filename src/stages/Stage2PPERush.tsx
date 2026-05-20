import { useState, useEffect, useRef, useCallback } from 'react';
import TimerBar from '../components/TimerBar';
import ScorePopupLayer, { useScorePopup } from '../components/ScorePopup';
import PauseButton, { usePause } from '../components/PauseButton';
import { ppeItems, GAME_DURATION, POINTS_WRONG } from '../gameData';
import { playSfx } from '../sound';

interface Props {
  onComplete: (score: number) => void;
}

interface GridItem {
  uid: number;
  id: number;
  emoji: string;
  label: string;
  isCorrect: boolean;
  tapped: boolean;
  shaking: boolean;
}

const STAGE2_CORRECT_SCORE = 20;
const STAGE2_CLEAR_SCORE = 500;

const FAKE_ITEMS = [
  { id: 9991, emoji: '🩲', label: 'กางเกงเซฟตี้', isCorrect: false },
  { id: 9992, emoji: '🍜', label: 'หมวกนิรภัยราเมง', isCorrect: false },
  { id: 9993, emoji: '🥥', label: 'หมวกมะพร้าว', isCorrect: false },
  { id: 9994, emoji: '🛵', label: 'หมวกไรเดอร์', isCorrect: false },
  { id: 9995, emoji: '🪖', label: 'กะละมังยุทธวิธี', isCorrect: false },
  { id: 9996, emoji: '🧢', label: 'หมวกเท่แต่ไม่เซฟ', isCorrect: false },
  { id: 9997, emoji: '🕶️', label: 'แว่นซิ่ง', isCorrect: false },
  { id: 9998, emoji: '🥊', label: 'นวมกันบาด?', isCorrect: false },
  { id: 9999, emoji: '🎧', label: 'หูฟังฟีลชิล', isCorrect: false },
  { id: 10000, emoji: '🧦', label: 'ถุงเท้านิรภัย?', isCorrect: false },
];

const CHAOS_MESSAGES = [
  '⚠️ HR กำลังดูอยู่!!',
  '🔥 หยิบช้า = โดนอบรม',
  '💀 OSHA ไม่ปลื้มสิ่งนี้',
  '📢 หัวหน้าหันมาแล้ว!',
  '🚨 ของหลอกเริ่มเยอะขึ้น!',
];

const WRONG_ROASTS = [
  'ไม่ใช่ PPE โว้ย!',
  'หัวหน้าเห็นนะ!',
  'OSHA กุมขมับ',
  'อันนั้นเอาไว้กิน!',
  'มั่นใจผิดมาก',
];

const WAVE_INTERVAL = 5.2;
const WRONG_TIME_PENALTY = 0.45;

let uidCounter = 0;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function generateGrid(wave: number): GridItem[] {
  const allItems = [...ppeItems, ...FAKE_ITEMS];
  const shuffled = shuffle(allItems);

  const correctCount = wave >= 6 ? 3 : 4;
  const wrongCount = 9 - correctCount;

  const corrects = shuffled.filter(i => i.isCorrect).slice(0, correctCount);
  const wrongs = shuffled.filter(i => !i.isCorrect).slice(0, wrongCount);

  return shuffle([...corrects, ...wrongs]).map(item => ({
    uid: uidCounter++,
    id: item.id,
    emoji: item.emoji,
    label: item.label,
    isCorrect: item.isCorrect,
    tapped: false,
    shaking: false,
  }));
}

export default function Stage2PPERush({ onComplete }: Props) {
  const [score, setScore] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [wave, setWave] = useState(0);
  const [grid, setGrid] = useState<GridItem[]>(() => generateGrid(0));
  const [screenShake, setScreenShake] = useState(false);
  const [flashType, setFlashType] = useState<'correct' | 'wrong' | 'perfect' | null>(null);
  const [waveCountdown, setWaveCountdown] = useState(WAVE_INTERVAL);
  const [chaosMessage, setChaosMessage] = useState(() => pickRandom(CHAOS_MESSAGES));
  const [roast, setRoast] = useState<string | null>(null);

  const { popups, showPopup } = useScorePopup();

  const correctSfx = useRef(new Audio('/sfx/correct.wav'));
  const wrongSfx = useRef(new Audio('/sfx/wrong.wav'));
  const perfectSfx = useRef(new Audio('/sfx/perfect.wav'));

  const scoreRef = useRef(0);
  const pausedRef = useRef(false);
  const doneRef = useRef(false);
  const waveRef = useRef(0);

  const finishStage = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setTimeout(() => onComplete(scoreRef.current), 0);
  }, [onComplete]);

  const clearStage = useCallback((finalScore: number) => {
    if (doneRef.current) return;

    doneRef.current = true;

    perfectSfx.current.currentTime = 0;
    playSfx(perfectSfx.current);

    setFlashType('perfect');
    showPopup('STAGE CLEAR!', '#facc15', 50, 42);

    setTimeout(() => {
      onComplete(finalScore);
    }, 750);
  }, [onComplete, showPopup]);

  const nextWave = useCallback(() => {
    if (doneRef.current) return;

    perfectSfx.current.currentTime = 0;
    playSfx(perfectSfx.current);

    waveRef.current += 1;

    setWave(waveRef.current);
    setGrid(generateGrid(waveRef.current));
    setWaveCountdown(WAVE_INTERVAL);
    setChaosMessage(pickRandom(CHAOS_MESSAGES));
  }, []);

  const { paused, togglePause, PauseOverlay } = usePause({
    onGiveUp: () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setTimeout(() => onComplete(0), 0);
    },
  });

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    correctSfx.current.volume = 0.5;
    wrongSfx.current.volume = 0.6;
    perfectSfx.current.volume = 0.7;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (pausedRef.current || doneRef.current || showIntro) return;

      setTimeLeft(t => {
        const next = Math.max(0, t - 0.05);
        if (next <= 0) finishStage();
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [finishStage, showIntro]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (pausedRef.current || doneRef.current || showIntro) return;

      setWaveCountdown(w => {
        const next = Math.max(0, w - 0.1);

        if (next <= 0) {
          nextWave();
          return WAVE_INTERVAL;
        }

        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [nextWave, showIntro]);

  useEffect(() => {
    const correctItems = grid.filter(i => i.isCorrect);

    if (correctItems.length > 0 && correctItems.every(i => i.tapped)) {
      setTimeout(() => {
        if (!doneRef.current) nextWave();
      }, 240);
    }
  }, [grid, nextWave]);

  const handleTap = useCallback((item: GridItem, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (item.tapped || pausedRef.current || doneRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
    const yPct = ((rect.top + rect.height / 2) / window.innerHeight) * 100;

    if (item.isCorrect) {
      correctSfx.current.currentTime = 0;
      playSfx(correctSfx.current);
      const gained = STAGE2_CORRECT_SCORE;
      const nextScore = scoreRef.current + gained;

      scoreRef.current = nextScore;
      setScore(nextScore);

      setFlashType('correct');
      showPopup(`+${gained}`, '#22c55e', xPct, yPct);

      setTimeout(() => setFlashType(null), 160);

      setGrid(g =>
        g.map(gi =>
          gi.uid === item.uid
            ? { ...gi, tapped: true }
            : gi
        )
      );

      if (nextScore >= STAGE2_CLEAR_SCORE) {
        clearStage(nextScore);
      }

      return;
    }

    wrongSfx.current.currentTime = 0;
    playSfx(wrongSfx.current);
    const nextScore = Math.max(0, scoreRef.current + POINTS_WRONG);

    scoreRef.current = nextScore;
    setScore(nextScore);

    setTimeLeft(t => Math.max(0, t - WRONG_TIME_PENALTY));

    setRoast(pickRandom(WRONG_ROASTS));
    setFlashType('wrong');
    setScreenShake(true);
    showPopup(`${POINTS_WRONG}`, '#ef4444', xPct, yPct);

    setGrid(g =>
      g.map(gi =>
        gi.uid === item.uid
          ? { ...gi, shaking: true }
          : gi
      )
    );

    setTimeout(() => setFlashType(null), 220);
    setTimeout(() => setScreenShake(false), 360);
    setTimeout(() => setRoast(null), 650);

    setTimeout(() => {
      setGrid(g =>
        g.map(gi =>
          gi.uid === item.uid
            ? { ...gi, shaking: false }
            : gi
        )
      );
    }, 400);
  }, [showPopup, clearStage]);

  const isCritical = timeLeft <= 5;
  const correctLeft = grid.filter(i => i.isCorrect && !i.tapped).length;
  const waveDanger = wave >= 5;
  const scoreLeft = Math.max(0, STAGE2_CLEAR_SCORE - score);

    return (
      <div
        className={`flex flex-col h-full bg-gradient-to-b from-amber-900 via-orange-950 to-slate-950 overflow-hidden select-none relative ${screenShake ? 'screen-shake' : ''}`}
      >
    
        {showIntro && (
          <div
            onClick={() => setShowIntro(false)}
            onTouchStart={() => setShowIntro(false)}
            className="absolute inset-0 z-[999] flex flex-col items-center justify-center bg-black/90 px-6 text-center"
          >
            <div
              className="bounce-in"
              style={{
                fontSize: '5rem',
                filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.45))',
              }}
            >
              ⛑️
            </div>
    
            <div
              className="font-game text-yellow-300 font-bold mt-3 bounce-in"
              style={{
                fontSize: 'clamp(1.6rem, 7vw, 2.25rem)',
                textShadow: '0 3px 0 rgba(0,0,0,0.45)',
              }}
            >
              หัวหน้าจะตรวจ PPE!
            </div>
    
            <div
              className="font-game text-white/90 mt-3 leading-relaxed bounce-in"
              style={{
                fontSize: 'clamp(1rem, 4.5vw, 1.25rem)',
                animationDelay: '0.1s',
              }}
            >
              แตะเฉพาะอุปกรณ์ป้องกันจริง
              <br />
              อย่ากดของหลอกเด็ดขาด!
            </div>
    
            <div
              className="mt-10 px-5 py-3 rounded-2xl animate-pulse"
              style={{
                background: 'rgba(250,204,21,0.16)',
                border: '2px solid rgba(250,204,21,0.45)',
                boxShadow: '0 0 24px rgba(250,204,21,0.2)',
              }}
            >
              <div
                className="font-game text-yellow-300 font-bold"
                style={{
                  fontSize: 'clamp(1.1rem, 5vw, 1.45rem)',
                  textShadow: '0 2px 0 rgba(0,0,0,0.45)',
                }}
              >
                👆 แตะหน้าจอเพื่อเริ่ม!
              </div>
            </div>
          </div>
        )}
      {flashType && (
        <div
          className={`absolute inset-0 z-20 pointer-events-none ${
            flashType === 'correct'
              ? 'correct-overlay'
              : flashType === 'perfect'
                ? 'perfect-overlay'
                : 'wrong-overlay'
          }`}
        />
      )}

      {PauseOverlay}

      <div className="flex-shrink-0 px-4 pt-5 pb-2 relative z-30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-game text-white/50 text-xs">ด่าน 2</div>
            <div
  className="font-game text-white font-bold leading-tight"
  style={{
    fontSize: 'clamp(1.25rem, 5.5vw, 1.65rem)',
    textShadow: '0 2px 0 rgba(0,0,0,0.35)',
  }}
>
  รีบหา PPE
  <div className="text-yellow-300">
    ก่อนหัวหน้าด่า!
  </div>
</div>

<div
  className="font-game text-orange-200 mt-1 leading-snug"
  style={{ fontSize: 'clamp(0.85rem, 3.7vw, 1rem)' }}
>
  แตะ PPE จริงเท่านั้น
</div>
          </div>

          <div className="flex items-center gap-2">
            <PauseButton paused={paused} onToggle={togglePause} />

            <div className="text-right">
              <div
                className="font-game text-yellow-400 font-bold"
                style={{ fontSize: 'clamp(1.2rem, 6vw, 1.8rem)' }}
              >
                {score}
              </div>
              <div className="font-game text-white/40 text-xs">คะแนน</div>
            </div>
          </div>
        </div>

        <TimerBar timeLeft={timeLeft} totalTime={GAME_DURATION} />

        <div className="mt-2 flex justify-center">
          <div
            className="rounded-xl px-3 py-1.5"
            style={{
              background:
                score >= STAGE2_CLEAR_SCORE
                  ? 'rgba(250,204,21,0.22)'
                  : 'rgba(255,255,255,0.08)',
              border:
                score >= STAGE2_CLEAR_SCORE
                  ? '1px solid rgba(250,204,21,0.5)'
                  : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span
              className="font-game font-bold"
              style={{
                color: score >= STAGE2_CLEAR_SCORE ? '#fde047' : 'rgba(255,255,255,0.9)',
                fontSize: 'clamp(1rem,4.5vw,1.2rem)',
                textShadow: '0 2px 0 rgba(0,0,0,0.45)',
              }}
            >
              {score >= STAGE2_CLEAR_SCORE
                ? '🚨 ผ่านแล้ว!'
                : `🎯 อีก ${scoreLeft} คะแนนจะผ่าน!`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 px-4 py-1 flex items-center gap-2 relative z-30">
        <span className="font-game text-white/40 text-xs">เปลี่ยนใน:</span>

        <div
          className="flex-1 rounded-full overflow-hidden"
          style={{ height: '6px', background: 'rgba(255,255,255,0.1)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${(waveCountdown / WAVE_INTERVAL) * 100}%`,
              background: waveCountdown <= 1.5 ? '#ef4444' : '#f59e0b',
              boxShadow: waveCountdown <= 1.5
                ? '0 0 10px rgba(239,68,68,0.8)'
                : '0 0 6px rgba(245,158,11,0.5)',
            }}
          />
        </div>

        <span className="font-game text-amber-400 font-bold text-xs">
          {waveCountdown.toFixed(1)}s
        </span>
      </div>

      <div className="flex-shrink-0 px-4 py-1 text-center relative z-30">
      <div
  className={`inline-block rounded-xl px-4 py-2 ${
    isCritical
      ? 'bg-red-500/30 border border-red-500/50'
      : waveDanger
        ? 'bg-red-500/20 border border-red-400/35'
        : 'bg-yellow-500/20'
  }`}
>
          <div className="flex flex-col items-center gap-1">
          <span
  className={`font-game font-bold ${
    isCritical
      ? 'text-red-300 timer-critical'
      : 'text-yellow-300'
  }`}
  style={{
    fontSize: 'clamp(1rem,4.5vw,1.25rem)',
    textShadow: '0 2px 0 rgba(0,0,0,0.45)',
  }}
>
  {isCritical
    ? '⚠️ รีบเลย! หัวหน้ากำลังเดินมา!'
    : `เหลือ PPE จริง ${correctLeft} ชิ้น`}
</span>

            <span className="font-game text-[10px] text-white/55">
              {chaosMessage}
            </span>
          </div>
        </div>
      </div>

      {roast && (
        <div className="absolute top-[34%] left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div
            className="font-game text-white font-bold rounded-2xl px-4 py-3 bounce-in text-center"
            style={{
              background: 'rgba(220,38,38,0.92)',
              boxShadow: '0 8px 0 rgba(127,29,29,0.9)',
              textShadow: '2px 2px 0 rgba(0,0,0,0.35)',
              fontSize: 'clamp(0.9rem, 4vw, 1.2rem)',
            }}
          >
            {roast}
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 relative">
        <ScorePopupLayer popups={popups} />

        <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
        {grid.map(item => (
  <button
    key={item.uid}
    onClick={(e) => handleTap(item, e)}
    className="aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-150 relative overflow-hidden active:scale-95"
    style={{
      background: item.tapped
        ? 'rgba(255,255,255,0.04)'
        : item.isCorrect
          ? 'rgba(34,197,94,0.08)'
          : 'rgba(255,255,255,0.105)',

      border: item.tapped
        ? '2px solid rgba(255,255,255,0.05)'
        : item.isCorrect
          ? '2px solid rgba(34,197,94,0.18)'
          : '2px solid rgba(255,255,255,0.14)',

      boxShadow: item.tapped
        ? 'none'
        : '0 4px 10px rgba(0,0,0,0.32)',

      transform: item.shaking
        ? 'scale(0.92) rotate(-3deg)'
        : item.tapped
          ? 'scale(0.84)'
          : 'scale(1)',

      opacity: item.tapped ? 0.22 : 1,

      animation: item.shaking
        ? 'shake 0.4s ease-in-out'
        : undefined,
    }}
  >
    {item.tapped && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
        <span className="text-3xl">
          {item.isCorrect ? '✅' : '💢'}
        </span>
      </div>
    )}

    <span
      className="text-5xl"
      style={{
        filter: item.tapped
          ? 'grayscale(1)'
          : 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
      }}
    >
      {item.emoji}
    </span>

    <span
      className="font-game text-center mt-2 leading-tight"
      style={{
        color: '#fff',
        fontSize: 'clamp(0.78rem,3.3vw,0.95rem)',
        background: 'rgba(0,0,0,0.55)',
        padding: '3px 6px',
        borderRadius: '999px',
        textShadow: '0 1px 0 rgba(0,0,0,0.7)',
      }}
    >
      {item.label}
    </span>
  </button>
))}
        </div>
      </div>

      <div className="flex-shrink-0 px-4 pb-6 flex justify-center gap-5 relative z-30">
        <div className="text-center">
        <div
  className="font-game text-green-400 font-bold"
  style={{ fontSize: 'clamp(1rem,4vw,1.25rem)' }}
>
            +{STAGE2_CORRECT_SCORE}
          </div>
          <div className="font-game text-white/40 text-xs">PPE จริง</div>
        </div>

        <div className="w-px bg-white/10" />

        <div className="text-center">
        <div
  className="font-game text-red-400 font-bold"
  style={{ fontSize: 'clamp(1rem,4vw,1.25rem)' }}
>
            {POINTS_WRONG}
          </div>
          <div className="font-game text-white/40 text-xs">ผิด -เวลา</div>
        </div>
      </div>
    </div>
  );
}