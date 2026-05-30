import { useState, useEffect, useRef, useCallback } from 'react';
import TimerBar from '../components/TimerBar';
import ScorePopupLayer, { useScorePopup } from '../components/ScorePopup';
import PauseButton, { usePause } from '../components/PauseButton';
import { swipeCards, GAME_DURATION, POINTS_CORRECT, POINTS_WRONG } from '../gameData';
import { playSfx } from '../sound';

interface Props {
  onComplete: (score: number) => void;
}

interface SwipeCard {
  id: number;
  label: string;
  emoji: string;
  isSafe: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function shuffleBalancedSwipeCards(cards: SwipeCard[]): SwipeCard[] {
  const safe = shuffle(cards.filter((card) => card.isSafe));
  const unsafe = shuffle(cards.filter((card) => !card.isSafe));

  const result: SwipeCard[] = [];
  let safeIndex = 0;
  let unsafeIndex = 0;

  const takeSafe = () => {
    if (safeIndex >= safe.length) return false;
    result.push(safe[safeIndex]);
    safeIndex += 1;
    return true;
  };

  const takeUnsafe = () => {
    if (unsafeIndex >= unsafe.length) return false;
    result.push(unsafe[unsafeIndex]);
    unsafeIndex += 1;
    return true;
  };

  while (safeIndex < safe.length || unsafeIndex < unsafe.length) {
    const lastTwo = result.slice(-2);
    const lastTwoAreSafe = lastTwo.length === 2 && lastTwo.every((card) => card.isSafe);
    const lastTwoAreUnsafe = lastTwo.length === 2 && lastTwo.every((card) => !card.isSafe);

    if (lastTwoAreSafe) {
      if (!takeUnsafe()) takeSafe();
      continue;
    }

    if (lastTwoAreUnsafe) {
      if (!takeSafe()) takeUnsafe();
      continue;
    }

    const safeLeft = safe.length - safeIndex;
    const unsafeLeft = unsafe.length - unsafeIndex;

    if (unsafeLeft > safeLeft) {
      Math.random() < 0.65 ? takeUnsafe() : takeSafe();
    } else if (safeLeft > unsafeLeft) {
      Math.random() < 0.65 ? takeSafe() : takeUnsafe();
    } else {
      Math.random() < 0.5 ? takeSafe() : takeUnsafe();
    }
  }

  return result;
}

const SWIPE_THRESHOLD = 80;
const PERFECT_THRESHOLD = 140;
const NEAR_MISS_THRESHOLD = 45;
const CLEAR_SCORE = 300;

export default function Stage1SafetySwipe({ onComplete }: Props) {
  const [cards] = useState(() => shuffleBalancedSwipeCards(swipeCards));
  const [showIntro, setShowIntro] = useState(true);
  const [cardIndex, setCardIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [cardAnim, setCardAnim] = useState<'in' | 'out-right' | 'out-left'>('in');
  const [screenShake, setScreenShake] = useState(false);
  const [nearMissShake, setNearMissShake] = useState(false);
  const [flashType, setFlashType] = useState<'correct' | 'wrong' | 'perfect' | null>(null);
  const [impactType, setImpactType] = useState<'correct' | 'wrong' | 'perfect' | null>(null);
  const [hitStop, setHitStop] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hint, setHint] = useState<'right' | 'left' | null>(null);

  const correctSfx = useRef(new Audio('/sfx/correct.wav'));
  const wrongSfx = useRef(new Audio('/sfx/wrong.wav'));
  const perfectSfx = useRef(new Audio('/sfx/perfect.wav'));

  const startXRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingRef = useRef(false);
  const scoreRef = useRef(0);
  const pausedRef = useRef(false);
  const doneRef = useRef(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const { popups, showPopup } = useScorePopup();

  const safeTimeout = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter((x) => x !== id);
      if (!doneRef.current) fn();
    }, delay);

    timeoutsRef.current.push(id);
    return id;
  }, []);

  const { paused, togglePause, PauseOverlay } = usePause({
    onGiveUp: () => {
      if (doneRef.current) return;

      doneRef.current = true;
      processingRef.current = true;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];

      onComplete(0);
    },
  });

  const isPanicMode = timeLeft <= 10;

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    correctSfx.current.volume = 0.5;
    wrongSfx.current.volume = 0.6;
    perfectSfx.current.volume = 0.7;
  }, []);

  useEffect(() => {
    if (showIntro || doneRef.current) return;

    timerRef.current = setInterval(() => {
      if (pausedRef.current || doneRef.current) return;

      setTimeLeft((t) => {
        if (t <= 0.05) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          if (!doneRef.current) {
            doneRef.current = true;
            processingRef.current = true;

            timeoutsRef.current.forEach(clearTimeout);
            timeoutsRef.current = [];

            onComplete(scoreRef.current);
          }

          return 0;
        }

        return t - 0.05;
      });
    }, 50);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [onComplete, showIntro]);

  const clearStage = useCallback(
    (finalScore: number) => {
      if (doneRef.current) return;

      doneRef.current = true;
      processingRef.current = true;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];

      onComplete(finalScore);
    },
    [onComplete]
  );

  const handleSwipe = useCallback(
    (direction: 'left' | 'right', swipePower = 0) => {
      if (processingRef.current || pausedRef.current || doneRef.current) return;

      processingRef.current = true;

      const card = cards[cardIndex % cards.length];
      const isCorrect = direction === 'right' ? card.isSafe : !card.isSafe;
      const isPerfect = swipePower >= PERFECT_THRESHOLD;

      if (isCorrect) {
        const ns = scoreRef.current + POINTS_CORRECT;
        scoreRef.current = ns;
        setScore(ns);

        if (ns >= CLEAR_SCORE) {
          clearStage(ns);
          return;
        }

        setImpactType(isPerfect ? 'perfect' : 'correct');
        safeTimeout(() => setImpactType(null), 350);

        if (isPerfect) {
          perfectSfx.current.currentTime = 0;
          playSfx(perfectSfx.current);
          setFlashType('perfect');
          showPopup(`PERFECT +${POINTS_CORRECT}`, '#facc15', 50, 50);
        } else {
          correctSfx.current.currentTime = 0;
          playSfx(correctSfx.current);
          setFlashType('correct');
          showPopup(`+${POINTS_CORRECT}`, '#22c55e', 50, 55);
        }
      } else {
        const ns = Math.max(0, scoreRef.current + POINTS_WRONG);
        scoreRef.current = ns;
        setScore(ns);

        wrongSfx.current.currentTime = 0;
        playSfx(wrongSfx.current);

        setImpactType('wrong');
        setScreenShake(true);
        setHitStop(true);

        safeTimeout(() => setImpactType(null), 350);
        safeTimeout(() => setHitStop(false), 120);
        safeTimeout(() => setScreenShake(false), 400);

        showPopup(`${POINTS_WRONG}`, '#ef4444', 50, 55);
      }

      setCardAnim(direction === 'right' ? 'out-right' : 'out-left');

      safeTimeout(() => setFlashType(null), 300);

      safeTimeout(
        () => {
          if (doneRef.current) return;

          setDragX(0);
          setCardIndex((i) => i + 1);
          setCardAnim('in');
          processingRef.current = false;
        },
        isPanicMode ? 170 : 220
      );
    },
    [cards, cardIndex, showPopup, isPanicMode, clearStage, safeTimeout]
  );

  const triggerNearMiss = useCallback(() => {
    if (doneRef.current) return;

    setNearMissShake(true);
    showPopup('เกือบแล้ว!', '#fb923c', 50, 60);

    safeTimeout(() => {
      if (doneRef.current) return;
      setNearMissShake(false);
      setDragX(0);
    }, 250);
  }, [showPopup, safeTimeout]);

  const finishDrag = useCallback(() => {
    if (processingRef.current || pausedRef.current || doneRef.current) return;

    setIsDragging(false);
    setHint(null);

    const swipePower = Math.abs(dragX);

    if (swipePower >= SWIPE_THRESHOLD) {
      handleSwipe(dragX > 0 ? 'right' : 'left', swipePower);
    } else if (swipePower >= NEAR_MISS_THRESHOLD) {
      triggerNearMiss();
    } else {
      setDragX(0);
    }
  }, [dragX, handleSwipe, triggerNearMiss]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (processingRef.current || pausedRef.current) return;

    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || processingRef.current || pausedRef.current) return;

      const dx = e.touches[0].clientX - startXRef.current;
      setDragX(dx);
      setHint(dx > 30 ? 'right' : dx < -30 ? 'left' : null);
    },
    [isDragging]
  );

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (processingRef.current || pausedRef.current) return;

    startXRef.current = e.clientX;
    setIsDragging(true);
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || processingRef.current || pausedRef.current) return;

      const dx = e.clientX - startXRef.current;
      setDragX(dx);
      setHint(dx > 30 ? 'right' : dx < -30 ? 'left' : null);
    },
    [isDragging]
  );

  const card = cards[cardIndex % cards.length];
  const rotation = dragX * 0.07;
  const swipePower = Math.abs(dragX);
  const swipeOpacity = Math.min(swipePower / PERFECT_THRESHOLD, 1);
  const isPerfectDragging = isDragging && swipePower >= PERFECT_THRESHOLD;

  let animClass = '';
  if (cardAnim === 'in') animClass = 'card-slide-in';
  else if (cardAnim === 'out-right') animClass = 'card-slide-out-right';
  else if (cardAnim === 'out-left') animClass = 'card-slide-out-left';

  return (
    <>
      {showIntro && (
        <div
          onPointerUp={() => setShowIntro(false)}
          className="absolute inset-0 z-[999] flex flex-col items-center justify-center bg-black/85 px-6 text-center"
        >
          <div
            className="bounce-in"
            style={{
              fontSize: '5rem',
              filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.45))',
            }}
          >
            👷
          </div>

          <div
            className="font-game text-yellow-300 font-bold mt-3 bounce-in"
            style={{
              fontSize: 'clamp(1.6rem, 7vw, 2.2rem)',
              textShadow: '0 3px 0 rgba(0,0,0,0.45)',
            }}
          >
            พนักงานใหม่เข้ากะ!
          </div>

          <div
            className="font-game text-white/85 mt-3 leading-relaxed bounce-in"
            style={{
              fontSize: 'clamp(0.9rem, 4vw, 1.05rem)',
              animationDelay: '0.1s',
            }}
          >
            อ่านสถานการณ์ให้ไว แล้วตัดสินใจ!
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
                  letterSpacing: '0.02em',
                }}
              >
                👆 แตะหน้าจอเพื่อเริ่ม!
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={`
          flex flex-col h-full overflow-hidden select-none relative
          bg-gradient-to-b from-slate-800 to-slate-900
          ${screenShake ? 'screen-shake' : ''}
          ${isPanicMode ? 'panic-mode' : ''}
          ${hitStop ? 'hit-stop' : ''}
        `}
      >
        {flashType && (
          <div
            className={`
              absolute inset-0 z-20 pointer-events-none
              ${flashType === 'correct' ? 'correct-overlay' : ''}
              ${flashType === 'wrong' ? 'wrong-overlay' : ''}
              ${flashType === 'perfect' ? 'perfect-overlay' : ''}
            `}
          />
        )}

        {PauseOverlay}

        {impactType && (
          <div className={`impact-text impact-${impactType}`}>
            {impactType === 'perfect'
              ? 'PERFECT!'
              : impactType === 'correct'
                ? 'ถูกต้อง!'
                : 'ผิด!'}
          </div>
        )}

        <div className="flex-shrink-0 px-4 pt-5 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-game text-white/50 text-xs">ด่าน 1</div>

              <div
                className="font-game text-white font-bold leading-tight"
                style={{
                  fontSize: 'clamp(1.15rem, 5vw, 1.5rem)',
                  textShadow: '0 2px 0 rgba(0,0,0,0.35)',
                }}
              >
                ปัดซ้ายปัดขวา
                <div className="text-yellow-300">ปัดเป่าอันตราย</div>
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
                  score >= CLEAR_SCORE
                    ? 'rgba(250,204,21,0.22)'
                    : 'rgba(255,255,255,0.08)',
                border:
                  score >= CLEAR_SCORE
                    ? '1px solid rgba(250,204,21,0.5)'
                    : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span
                className="font-game font-bold"
                style={{
                  color: score >= CLEAR_SCORE ? '#fde047' : 'rgba(255,255,255,0.9)',
                  fontSize: 'clamp(1rem,4.5vw,1.2rem)',
                  padding: '2px 4px',
                  textShadow: '0 2px 0 rgba(0,0,0,0.45)',
                }}
              >
                {score >= CLEAR_SCORE
                  ? '🚨 ผ่านแล้ว!'
                  : `🎯 อีก ${CLEAR_SCORE - score} คะแนนจะผ่าน!`}
              </span>
            </div>
          </div>

          {isPanicMode && (
            <div className="font-game text-red-300 text-center text-xs mt-2 animate-pulse">
              เหลือเวลาอีกนิดเดียว! รีบตัดสินใจ!
            </div>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center px-4 relative">
          <ScorePopupLayer popups={popups} />

          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 transition-opacity duration-150"
            style={{ opacity: hint === 'left' ? 1 : 0 }}
          >
            <div className="bg-red-500 rounded-2xl px-3 py-3 flex flex-col items-center gap-1 shadow-lg">
              <span className="text-2xl">⚠️</span>
              <span className="font-game text-white text-sm font-bold">ไม่ปลอดภัย</span>
            </div>
          </div>

          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 transition-opacity duration-150"
            style={{ opacity: hint === 'right' ? 1 : 0 }}
          >
            <div className="bg-green-500 rounded-2xl px-3 py-3 flex flex-col items-center gap-1 shadow-lg">
              <span className="text-2xl">✅</span>
              <span className="font-game text-white text-sm font-bold">ปลอดภัย</span>
            </div>
          </div>

          {isPerfectDragging && (
            <div className="absolute top-8 z-20 font-game text-yellow-300 font-bold text-lg animate-pulse">
              PERFECT!
            </div>
          )}

          <div
            key={cardIndex}
            className={`
              swipe-card w-full max-w-[26rem]
              h-[clamp(300px,48vh,430px)] rounded-[2rem]
              px-4 py-6 flex flex-col items-center justify-center gap-5 cursor-grab
              ${animClass}
              ${nearMissShake ? 'near-miss-shake' : ''}
            `}
            style={{
              background:
                'radial-gradient(circle at top, rgba(255,255,255,0.14), rgba(17,24,39,0.96))',
              border:
                isPerfectDragging
                  ? '2px solid rgba(250,204,21,0.9)'
                  : hint === 'right'
                    ? `2px solid rgba(34,197,94,${0.25 + swipeOpacity * 0.6})`
                    : hint === 'left'
                      ? `2px solid rgba(239,68,68,${0.25 + swipeOpacity * 0.6})`
                      : '2px solid rgba(255,255,255,0.15)',
              boxShadow:
                isPerfectDragging
                  ? '0 0 44px rgba(250,204,21,0.8)'
                  : hint === 'right'
                    ? `0 8px 32px rgba(34,197,94,${0.15 + swipeOpacity * 0.35})`
                    : hint === 'left'
                      ? `0 8px 32px rgba(239,68,68,${0.15 + swipeOpacity * 0.35})`
                      : '0 12px 40px rgba(0,0,0,0.55)',
              transform: isDragging
                ? `translateX(${dragX}px) rotate(${rotation}deg) scale(${1 + swipeOpacity * 0.04})`
                : undefined,
              transition: isDragging ? 'none' : 'transform 180ms cubic-bezier(.2,1.4,.4,1)',
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={finishDrag}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={finishDrag}
            onMouseLeave={() => {
              if (isDragging) finishDrag();
            }}
          >
            <div
              className="text-[clamp(4.5rem,18vw,6.5rem)]"
              style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }}
            >
              {card.emoji}
            </div>

            <div
              className="font-game text-white text-center font-black"
              style={{
                fontSize: 'clamp(2rem, 8vw, 2.7rem)',
                lineHeight: 1.12,
                letterSpacing: '-0.02em',
                maxWidth: '98%',
                textShadow: '0 5px 0 rgba(0,0,0,0.6)',
              }}
            >
              {card.label}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-4 pb-6 flex gap-3">
          <button
            onPointerUp={() => handleSwipe('left')}
            className="flex-1 py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #991b1b)',
              boxShadow: '0 6px 0 #450a0a, 0 0 18px rgba(239,68,68,0.38)',
              border: '2px solid rgba(254,202,202,0.85)',
            }}
          >
            <span
              className="font-game text-white font-black"
              style={{
                fontSize: 'clamp(1.8rem,8vw,2.4rem)',
                textShadow: '0 4px 0 rgba(0,0,0,0.55)',
                lineHeight: 1,
              }}
            >
              ←
            </span>
            <span
              className="font-game text-white font-bold"
              style={{
                fontSize: 'clamp(1.25rem,5.7vw,1.75rem)',
                textShadow: '0 3px 0 rgba(0,0,0,0.55)',
              }}
            >
              ไม่ปลอดภัย
            </span>
          </button>

          <button
            onPointerUp={() => handleSwipe('right')}
            className="flex-1 py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(135deg, #22c55e, #14532d)',
              boxShadow: '0 6px 0 #052e16, 0 0 18px rgba(34,197,94,0.38)',
              border: '2px solid rgba(187,247,208,0.85)',
            }}
          >
            <span
              className="font-game text-white font-bold"
              style={{
                fontSize: 'clamp(1.25rem,5.7vw,1.75rem)',
                textShadow: '0 3px 0 rgba(0,0,0,0.55)',
              }}
            >
              ปลอดภัย
            </span>
            <span
              className="font-game text-white font-black"
              style={{
                fontSize: 'clamp(1.8rem,8vw,2.4rem)',
                textShadow: '0 4px 0 rgba(0,0,0,0.55)',
                lineHeight: 1,
              }}
            >
              →
            </span>
          </button>
        </div>
      </div>
    </>
  );
}