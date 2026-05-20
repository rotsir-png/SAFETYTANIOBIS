import { useState, useEffect, useRef, useCallback } from 'react';
import TimerBar from '../components/TimerBar';
import ScorePopupLayer, { useScorePopup } from '../components/ScorePopup';
import PauseButton, { usePause } from '../components/PauseButton';
import { GAME_DURATION, POINTS_WRONG } from '../gameData';
import { playSfx } from '../sound';

interface Props {
  onComplete: (score: number) => void;
  speedMultiplier?: number;
  onDamage?: () => void;
}

interface Spawn {
  id: number;
  emoji: string;
  label: string;
  isHazard: boolean;
  isGolden: boolean;
  x: number;
  y: number;
  lifetime: number;
  born: number;
  alive: boolean;
  escaping: boolean;
}

const MAX_HEARTS = 3;
const GOLDEN_BONUS = 20;
const MAX_ALIVE_SPAWNS = 6;
const STAGE3_CORRECT_SCORE = 20;
const STAGE3_CLEAR_SCORE = 500;

const HAZARDS = [
  { emoji: '🔥', label: 'ไฟไหม้', isHazard: true },
  { emoji: '⚡', label: 'ไฟรั่ว', isHazard: true },
  { emoji: '🧪', label: 'สารเคมี', isHazard: true },
  { emoji: '💧', label: 'พื้นลื่น', isHazard: true },
  { emoji: '🔪', label: 'ของมีคม', isHazard: true },
  { emoji: '🏗️', label: 'ของตก', isHazard: true },
  { emoji: '🚧', label: 'กีดขวาง', isHazard: true },
  { emoji: '📱', label: 'มือถือ', isHazard: true },
];

const DECOYS = [
  { emoji: '🪖', label: 'หมวก', isHazard: false },
  { emoji: '🥽', label: 'แว่นตา', isHazard: false },
  { emoji: '🧤', label: 'ถุงมือ', isHazard: false },
  { emoji: '🦺', label: 'เสื้อสะท้อนแสง', isHazard: false },
  { emoji: '😷', label: 'หน้ากาก', isHazard: false },
  { emoji: '🍌', label: 'กล้วยหลอก', isHazard: false },
  { emoji: '🎃', label: 'ของหลอก', isHazard: false },
];

const GOLDEN_HAZARDS = [
  { emoji: '🚨', label: 'MEGA', isHazard: true },
  { emoji: '💥', label: 'ระเบิด', isHazard: true },
];

const CHAOS_MESSAGES = [
  '⚠️ เจออันตรายให้ตบ!',
  '👷 หัวหน้ากำลังเดินมา!!',
  '🔥 อย่าปล่อยให้โรงงานแตก',
  '💀 แตะ PPE = โดนหักหัวใจ',
  '🚨 HAZARD HUNT MODE',
  '📢 ความปลอดภัยกำลังตะโกน',
];

const HIT_MESSAGES = [
  '🔥 ตบได้สวย!',
  '👷 หัวหน้าพยักหน้า',
  '⚠️ โรงงานยังไม่ระเบิด',
  '📢 SAFETY MOMENT',
];

const WRONG_ROASTS = [
  'นั่น PPE ไม่ใช่ hazard!',
  'ตบผิดชีวิตเปลี่ยน',
  'หัวหน้ามองแรงมาก',
  'ใจเย็น มือไวไปแล้ว',
  'อันนั้นของดี อย่าตบ!',
];

const MISS_ROASTS = [
  'ปล่อย hazard หลุด!',
  'อันตรายหนีไปแล้ว!',
  'โรงงานร้องไห้',
  'ช้าไปนิดเดียว!',
];

const ALL_ITEMS = [...HAZARDS, ...HAZARDS, ...HAZARDS, ...DECOYS];

let spawnCounter = 0;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeSpawn(speed: number, currentTimeLeft: number): Spawn {
  const goldenChance = currentTimeLeft <= 8 ? 0.1 : 0.05;
  const isGolden = Math.random() < goldenChance;
  const item = isGolden ? pickRandom(GOLDEN_HAZARDS) : pickRandom(ALL_ITEMS);

  const zones = [
    { x: 22, y: 24 },
    { x: 50, y: 22 },
    { x: 78, y: 24 },
    { x: 26, y: 50 },
    { x: 50, y: 50 },
    { x: 74, y: 50 },
    { x: 24, y: 76 },
    { x: 50, y: 74 },
    { x: 76, y: 76 },
  ];

  const zone = pickRandom(zones);

  return {
    id: spawnCounter++,
    emoji: item.emoji,
    label: item.label,
    isHazard: item.isHazard,
    isGolden,
    x: zone.x + (Math.random() * 10 - 5),
    y: zone.y + (Math.random() * 8 - 4),
    lifetime: Math.max(
      850,
      2300 - speed * 160 - (currentTimeLeft <= 8 ? 180 : 0)
    ),
    born: Date.now(),
    alive: true,
    escaping: false,
  };
}

export default function Stage3TapHazard({
  onComplete,
  speedMultiplier = 1,
  onDamage,
}: Props) {
  const [score, setScore] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [spawns, setSpawns] = useState<Spawn[]>([]);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [screenShake, setScreenShake] = useState(false);
  const [hitStop, setHitStop] = useState(false);
  const [flashType, setFlashType] = useState<'correct' | 'wrong' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [chaosMessage, setChaosMessage] = useState(() => pickRandom(CHAOS_MESSAGES));
  const [roast, setRoast] = useState<string | null>(null);

  const { popups, showPopup } = useScorePopup();

  const correctSfx = useRef(new Audio('/sfx/correct.wav'));
  const wrongSfx = useRef(new Audio('/sfx/wrong.wav'));
  const perfectSfx = useRef(new Audio('/sfx/perfect.wav'));

  const scoreRef = useRef(0);
  const heartsRef = useRef(MAX_HEARTS);
  const pausedRef = useRef(false);
  const doneRef = useRef(false);
  const speedRef = useRef(speedMultiplier);
  const timeLeftRef = useRef(GAME_DURATION);

  const finishStage = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setTimeout(() => onComplete(scoreRef.current), 0);
  }, [onComplete]);

  const giveUpStage = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setTimeout(() => onComplete(0), 0);
  }, [onComplete]);

  const failStage = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setGameOver(true);

    setTimeout(() => {
      onComplete(0);
    }, 800);
  }, [onComplete]);

  const clearStage = useCallback(
    (finalScore: number) => {
      if (doneRef.current) return;
      doneRef.current = true;

      perfectSfx.current.currentTime = 0;
      playSfx(perfectSfx.current);

      setFlashType('correct');
      setChaosMessage('🚨 STAGE CLEAR! โรงงานยังไม่แตก!');
      showPopup('STAGE CLEAR!', '#facc15', 50, 42);

      setTimeout(() => {
        onComplete(finalScore);
      }, 750);
    },
    [onComplete, showPopup]
  );

  const damagePlayer = useCallback(
    (message: string) => {
      wrongSfx.current.currentTime = 0;
      playSfx(wrongSfx.current);

      heartsRef.current = Math.max(0, heartsRef.current - 1);
      setHearts(heartsRef.current);

      const nextScore = Math.max(0, scoreRef.current + POINTS_WRONG);
      scoreRef.current = nextScore;
      setScore(nextScore);

      setFlashType('wrong');
      setScreenShake(true);
      setHitStop(true);
      setRoast(message);

      setTimeout(() => setFlashType(null), 260);
      setTimeout(() => setScreenShake(false), 420);
      setTimeout(() => setHitStop(false), 120);
      setTimeout(() => setRoast(null), 800);

      onDamage?.();

      if (heartsRef.current <= 0) {
        failStage();
      }
    },
    [failStage, onDamage]
  );

  const { paused, togglePause, PauseOverlay } = usePause({
    onGiveUp: giveUpStage,
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
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (pausedRef.current || doneRef.current || showIntro) return;

      setTimeLeft(t => {
        const next = Math.max(0, t - 0.05);
        timeLeftRef.current = next;

        if (next <= 0) {
          finishStage();
          return 0;
        }

        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [finishStage, showIntro]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (pausedRef.current || doneRef.current || showIntro) return;
      setChaosMessage(pickRandom(CHAOS_MESSAGES));
    }, 3500);

    return () => clearInterval(interval);
  }, [showIntro]);

  useEffect(() => {
    const spawnRate = Math.max(250, 500 - speedMultiplier * 70);

    const interval = setInterval(() => {
      if (pausedRef.current || doneRef.current || showIntro) return;

      setSpawns(prev => {
        const aliveCount = prev.filter(s => s.alive).length;
        if (aliveCount >= MAX_ALIVE_SPAWNS) return prev;

        return [
          ...prev.slice(-20),
          makeSpawn(speedRef.current, timeLeftRef.current),
        ];
      });
    }, spawnRate);

    return () => clearInterval(interval);
  }, [speedMultiplier, showIntro]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (pausedRef.current || doneRef.current || showIntro) return;

      const now = Date.now();
      let missedHazards = 0;

      setSpawns(prev => {
        const updated = prev.map(spawn => {
          if (!spawn.alive) return spawn;

          const expired = now - spawn.born > spawn.lifetime;
          if (!expired) return spawn;

          if (spawn.isHazard) {
            missedHazards++;
            return { ...spawn, alive: false, escaping: true };
          }

          return { ...spawn, alive: false };
        });

        return updated.filter(
          spawn => spawn.alive || now - spawn.born < spawn.lifetime + 450
        );
      });

      if (missedHazards > 0) {
        setChaosMessage(pickRandom(MISS_ROASTS));
        setFlashType('wrong');
        setScreenShake(true);

        setTimeout(() => setFlashType(null), 180);
        setTimeout(() => setScreenShake(false), 260);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [showIntro]);

  const handleTap = useCallback(
    (spawn: Spawn, e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (!spawn.alive || pausedRef.current || doneRef.current || showIntro) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const xPct = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
      const yPct = ((rect.top + rect.height / 2) / window.innerHeight) * 100;

      setSpawns(prev =>
        prev.map(sp =>
          sp.id === spawn.id ? { ...sp, alive: false } : sp
        )
      );

      if (spawn.isHazard) {
        if (spawn.isGolden) {
          perfectSfx.current.currentTime = 0;
          playSfx(perfectSfx.current);
        } else {
          correctSfx.current.currentTime = 0;
          playSfx(correctSfx.current);
        }

        setHitStop(true);
        setTimeout(() => setHitStop(false), 75);

        const goldenBonus = spawn.isGolden ? GOLDEN_BONUS : 0;
        const gain = STAGE3_CORRECT_SCORE + goldenBonus;

        const nextScore = scoreRef.current + gain;
        scoreRef.current = nextScore;
        setScore(nextScore);

        setFlashType('correct');

        showPopup(
          spawn.isGolden ? `+${gain} MEGA!` : `+${STAGE3_CORRECT_SCORE}`,
          spawn.isGolden ? '#facc15' : '#fbbf24',
          xPct,
          yPct
        );

        if (nextScore >= STAGE3_CLEAR_SCORE) {
          clearStage(nextScore);
          return;
        }

        setChaosMessage(
          spawn.isGolden ? '🚨 MEGA HAZARD BONKED!' : pickRandom(HIT_MESSAGES)
        );

        setTimeout(() => setFlashType(null), 220);
        return;
      }

      showPopup(`${POINTS_WRONG}`, '#ef4444', xPct, yPct);
      damagePlayer(pickRandom(WRONG_ROASTS));
    },
    [damagePlayer, showPopup, clearStage, showIntro]
  );

  const isCritical = timeLeft <= 5;
  const scoreLeft = Math.max(0, STAGE3_CLEAR_SCORE - score);

  return (
    <div
      className={`
        flex flex-col h-full bg-gradient-to-b from-red-950 via-slate-950 to-black overflow-hidden select-none relative
        ${screenShake ? 'screen-shake' : ''}
        ${hitStop ? 'hit-stop' : ''}
      `}
    >
      {flashType && (
        <div
          className={`absolute inset-0 z-20 pointer-events-none ${
            flashType === 'correct' ? 'correct-overlay' : 'wrong-overlay'
          }`}
        />
      )}

      {PauseOverlay}

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
            🚨
          </div>

          <div
            className="font-game text-red-300 font-bold mt-3 bounce-in"
            style={{
              fontSize: 'clamp(1.7rem,7vw,2.4rem)',
              textShadow: '0 3px 0 rgba(0,0,0,0.45)',
              lineHeight: 1,
            }}
          >
            โรงงานกำลังวุ่นวาย!
          </div>

          <div
            className="font-game text-white/90 mt-4 leading-relaxed bounce-in"
            style={{
              fontSize: 'clamp(1rem,4.5vw,1.28rem)',
              animationDelay: '0.1s',
            }}
          >
            มี hazard โผล่ทั่วไลน์ผลิต
            <br />
            หัวหน้ากำลังเดินตรวจอยู่พอดี
          </div>

          <div
            className="mt-5 rounded-2xl px-5 py-4 bounce-in"
            style={{
              background: 'rgba(239,68,68,0.14)',
              border: '2px solid rgba(239,68,68,0.35)',
              animationDelay: '0.15s',
            }}
          >
            <div
              className="font-game text-red-200 font-bold"
              style={{
                fontSize: 'clamp(1rem,4.8vw,1.35rem)',
                lineHeight: 1.3,
                textShadow: '0 2px 0 rgba(0,0,0,0.4)',
              }}
            >
              👊 แตะเฉพาะ HAZARD
              <br />
              🦺 ห้ามตบ PPE เด็ดขาด
            </div>
          </div>

          <div
            className="mt-4 rounded-2xl px-5 py-4 bounce-in"
            style={{
              background: 'rgba(250,204,21,0.12)',
              border: '2px solid rgba(250,204,21,0.28)',
              animationDelay: '0.2s',
            }}
          >
            <div
              className="font-game text-yellow-200 font-bold"
              style={{
                fontSize: 'clamp(0.95rem,4.2vw,1.2rem)',
                lineHeight: 1.35,
              }}
            >
              ⚠️ แตะผิด = เสียหัวใจ
<br />
💥 MEGA HAZARD = โบนัสหนัก
            </div>
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
                fontSize: 'clamp(1.1rem,5vw,1.45rem)',
                textShadow: '0 2px 0 rgba(0,0,0,0.45)',
              }}
            >
              👆 แตะหน้าจอเพื่อเริ่ม!
            </div>
          </div>
        </div>
      )}

      {gameOver && (
        <div
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4"
          style={{ background: 'rgba(0,0,0,0.88)' }}
        >
          <div
            className="font-game text-red-400 font-bold bounce-in"
            style={{ fontSize: 'clamp(2rem,9vw,2.8rem)' }}
          >
            GAME OVER
          </div>

          <div className="font-game text-white/60 text-lg bounce-in">
            หัวใจหมดแล้ว!
          </div>

          <div className="font-game text-yellow-400 font-bold text-2xl bounce-in">
            0 คะแนน
          </div>
        </div>
      )}

      {roast && (
        <div className="absolute top-[34%] left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div
            className="font-game text-white font-bold rounded-2xl px-4 py-3 bounce-in text-center"
            style={{
              background: 'rgba(220,38,38,0.92)',
              boxShadow: '0 8px 0 rgba(127,29,29,0.9)',
              textShadow: '2px 2px 0 rgba(0,0,0,0.35)',
              fontSize: 'clamp(0.9rem,4vw,1.2rem)',
            }}
          >
            {roast}
          </div>
        </div>
      )}

      <div className="flex-shrink-0 px-4 pt-5 pb-2 relative z-30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-game text-white/50 text-xs">ด่าน 3</div>

            <div
              className="font-game text-white font-bold leading-tight"
              style={{
                fontSize: 'clamp(1.25rem,5.5vw,1.65rem)',
                textShadow: '0 2px 0 rgba(0,0,0,0.35)',
              }}
            >
              Whack-a-Danger!
              <div className="text-yellow-300">
                ตบก่อนโรงงานแตก!
              </div>
            </div>

            <div
              className="font-game text-red-200 mt-1 leading-snug"
              style={{ fontSize: 'clamp(0.85rem,3.7vw,1rem)' }}
            >
              แตะ hazard จริงเท่านั้น
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PauseButton paused={paused} onToggle={togglePause} />

            <div className="text-right">
              <div
                className="font-game text-yellow-400 font-bold"
                style={{ fontSize: 'clamp(1.2rem,6vw,1.8rem)' }}
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
                score >= STAGE3_CLEAR_SCORE
                  ? 'rgba(250,204,21,0.22)'
                  : 'rgba(255,255,255,0.08)',
              border:
                score >= STAGE3_CLEAR_SCORE
                  ? '1px solid rgba(250,204,21,0.5)'
                  : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span
              className="font-game font-bold"
              style={{
                color: score >= STAGE3_CLEAR_SCORE ? '#fde047' : 'rgba(255,255,255,0.9)',
                fontSize: 'clamp(1rem,4.5vw,1.2rem)',
                textShadow: '0 2px 0 rgba(0,0,0,0.45)',
              }}
            >
              {score >= STAGE3_CLEAR_SCORE
                ? '🚨 ผ่านแล้ว!'
                : `🎯 อีก ${scoreLeft} คะแนนจะผ่าน!`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 px-4 py-1 flex items-center justify-center relative z-30">
        <div className="flex gap-1.5">
          {Array.from({ length: MAX_HEARTS }, (_, i) => (
            <span
              key={i}
              style={{
                fontSize: 'clamp(1.35rem,6vw,1.75rem)',
                opacity: i < hearts ? 1 : 0.2,
                filter: i < hearts ? 'none' : 'grayscale(1)',
                transition: 'all 0.2s',
              }}
            >
              ❤️
            </span>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 px-4 py-1 text-center relative z-30">
        <div
          className={`inline-block rounded-xl px-4 py-2 ${
            isCritical
              ? 'bg-red-500/30 border border-red-500/50'
              : 'bg-yellow-500/20 border border-yellow-400/30'
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <span
              className={`font-game font-bold ${
                isCritical ? 'text-red-300 timer-critical' : 'text-yellow-300'
              }`}
              style={{
                fontSize: 'clamp(1rem,4.5vw,1.25rem)',
                textShadow: '0 2px 0 rgba(0,0,0,0.45)',
                lineHeight: 1.15,
              }}
            >
              {isCritical ? '⚠️ PANIC TIME!' : 'แตะ HAZARD เท่านั้น'}
            </span>

            <span
              className="font-game text-white/55"
              style={{
                fontSize: 'clamp(0.72rem,3.2vw,0.9rem)',
                lineHeight: 1.15,
              }}
            >
              {chaosMessage}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 z-50 pointer-events-none">
          <ScorePopupLayer popups={popups} />
        </div>

        {spawns.filter(s => s.alive).map(spawn => {
          const age = Date.now() - spawn.born;
          const lifeRatio = Math.min(1, age / spawn.lifetime);
          const dangerSoon = lifeRatio > 0.68;
          const opacity =
            lifeRatio > 0.78
              ? Math.max(0.18, 1 - (lifeRatio - 0.78) / 0.22)
              : 1;

          return (
            <button
              key={spawn.id}
              onClick={(e) => handleTap(spawn, e)}
              className="hazard-item absolute flex flex-col items-center justify-center active:scale-75 transition-transform"
              style={{
                left: `${spawn.x}%`,
                top: `${spawn.y}%`,
                transform: 'translate(-50%, -50%)',
                width: spawn.isGolden ? '132px' : '112px',
                height: spawn.isGolden ? '132px' : '112px',
                background: spawn.isHazard
                  ? spawn.isGolden
                    ? 'radial-gradient(circle, rgba(250,204,21,0.45), rgba(239,68,68,0.08))'
                    : 'radial-gradient(circle, rgba(239,68,68,0.33), rgba(239,68,68,0.05))'
                  : 'radial-gradient(circle, rgba(34,197,94,0.28), rgba(34,197,94,0.05))',
                borderRadius: '50%',
                border: spawn.isHazard
                  ? spawn.isGolden
                    ? '3px solid rgba(250,204,21,0.9)'
                    : '2.5px solid rgba(239,68,68,0.58)'
                  : '2.5px solid rgba(34,197,94,0.48)',
                opacity,
                boxShadow: spawn.isHazard
                  ? spawn.isGolden
                    ? '0 0 26px rgba(250,204,21,0.75)'
                    : dangerSoon
                      ? '0 0 24px rgba(239,68,68,0.75)'
                      : '0 0 18px rgba(239,68,68,0.42)'
                  : '0 0 14px rgba(34,197,94,0.35)',
                zIndex: spawn.isGolden ? 13 : 10,
                animation:
                  dangerSoon && spawn.isHazard
                    ? 'shake 0.35s infinite'
                    : spawn.isGolden
                      ? 'pulse 0.45s infinite'
                      : undefined,
              }}
            >
              {spawn.isGolden && (
                <span className="absolute -top-3 font-game text-yellow-200 text-[10px]">
                  MEGA
                </span>
              )}

              <span
                style={{
                  fontSize: spawn.isGolden ? '3.5rem' : '3rem',
                  lineHeight: 1,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.45))',
                }}
              >
                {spawn.emoji}
              </span>

              <span
                className="font-game text-center whitespace-nowrap"
                style={{
                  fontSize: 'clamp(1.2rem,4.8vw,1.45rem)',
                  color: '#ffffff',
                  background: 'rgba(0,0,0,0.72)',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  marginTop: '6px',
                  fontWeight: 700,
                  textShadow: `
                    0 2px 0 rgba(0,0,0,1),
                    0 0 8px rgba(0,0,0,0.95)
                  `,
                  letterSpacing: '0.01em',
                }}
              >
                {spawn.label}
              </span>

              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: `conic-gradient(
                    transparent ${lifeRatio * 360}deg,
                    rgba(255,255,255,0.16) ${lifeRatio * 360}deg
                  )`,
                  opacity: 0.72,
                }}
              />
            </button>
          );
        })}

        {spawns.filter(s => s.alive).length === 0 && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="font-game text-white/15 text-xl">
              hazard กำลังโผล่...
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 px-4 pb-6 flex justify-center gap-5 relative z-30">
        <div className="text-center">
          <div
            className="font-game text-yellow-400 font-bold"
            style={{ fontSize: 'clamp(1rem,4vw,1.25rem)' }}
          >
            +{STAGE3_CORRECT_SCORE}
          </div>
          <div className="font-game text-white/40 text-xs">ตบ hazard</div>
        </div>

        <div className="w-px bg-white/10" />

        <div className="text-center">
          <div
            className="font-game text-red-400 font-bold"
            style={{ fontSize: 'clamp(1rem,4vw,1.25rem)' }}
          >
            {POINTS_WRONG}
          </div>
          <div className="font-game text-white/40 text-xs">พลาด / แตะผิด</div>
        </div>
      </div>
    </div>
  );
}