import { useState, useEffect, useRef, useCallback } from 'react';
import TimerBar from '../components/TimerBar';
import ScorePopupLayer, { useScorePopup } from '../components/ScorePopup';
import PauseButton, { usePause } from '../components/PauseButton';
import { GAME_DURATION, POINTS_CORRECT, POINTS_WRONG } from '../gameData';
import { playSfx } from '../sound';

interface Props {
  onComplete: (score: number) => void;
  speedMultiplier?: number;
}

type ClawState = 'aiming' | 'extending' | 'retracting';
type MovePattern = 'patrol' | 'float';

interface MineItem {
  id: number;
  emoji: string;
  label: string;
  isCorrect: boolean;
  isBomb?: boolean;
  isShiny?: boolean;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  weight: number;
  driftX: number;
  driftY: number;
  driftSpeed: number;
  phase: number;
  movePattern: MovePattern;
}

const CLEAR_SCORE = 500;

const HOOK_ORIGIN_X = 50;
const HOOK_ORIGIN_Y = 9;
const MIN_ANGLE = -58;
const MAX_ANGLE = 58;
const MAX_ROPE = 84;
const START_ROPE = 10;

const HITBOX_NORMAL = 12;
const HITBOX_SHINY = 13.5;
const NEAR_MISS_MIN = 12;
const NEAR_MISS_MAX = 16;

const PPE_ITEMS = [
  { emoji: '🪖', label: 'หมวก', isCorrect: true },
  { emoji: '🥽', label: 'แว่น', isCorrect: true },
  { emoji: '🧤', label: 'ถุงมือ', isCorrect: true },
  { emoji: '👞', label: 'รองเท้า', isCorrect: true },
  { emoji: '😷', label: 'หน้ากาก', isCorrect: true },
  { emoji: '🦺', label: 'เสื้อ', isCorrect: true },
];

const TRASH_ITEMS = [
  { emoji: '📱', label: 'มือถือ', isCorrect: false },
  { emoji: '🍜', label: 'มาม่า', isCorrect: false },
  { emoji: '🧋', label: 'ชานม', isCorrect: false },
  { emoji: '🩴', label: 'แตะ', isCorrect: false },
  { emoji: '🧸', label: 'ตุ๊กตา', isCorrect: false },
  { emoji: '💣', label: 'บึ้ม', isCorrect: false, isBomb: true },
];

const CHAOS_TEXT = [
  'โรงงานกำลังแตก!!!',
  'เกี่ยวมาให้ถูกก่อน QC ร้อง',
  'ตะขอทรงอย่างแบด',
  'หัวหน้าหันมาแล้ว!',
  'Safety แต่ฟีลเหมืองทอง',
];

const ROAST_TEXT = [
  'เกี่ยวอะไร๊!!!',
  'PPE อยู่ตรงนู้นนน',
  'โดน HR มองแรง',
  'อันนี้ไม่ใช่อุปกรณ์เซฟตี้',
  'ตะขอพาเข้าดงดราม่า',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function makeItemFromAngle(
  angleDeg: number,
  distance: number,
  index: number,
  score: number,
  forcePPE = false
): MineItem {
  const roll = Math.random();
  const bombChance = score >= 350 ? 0.09 : 0.035;
  const correctChance = score >= 300 ? 0.48 : 0.55;

  const src = forcePPE
    ? pickRandom(PPE_ITEMS)
    : roll < bombChance
      ? TRASH_ITEMS.find(i => i.isBomb) ?? TRASH_ITEMS[0]
      : roll < correctChance
        ? pickRandom(PPE_ITEMS)
        : pickRandom(TRASH_ITEMS.filter(i => !i.isBomb));

  const shinyChance = score >= 250 ? 0.14 : 0.065;
  const isShiny = src.isCorrect && Math.random() < shinyChance;

  const angleRad = (angleDeg * Math.PI) / 180;
  const baseX = clamp(HOOK_ORIGIN_X + Math.sin(angleRad) * distance, 10, 90);
  const baseY = clamp(HOOK_ORIGIN_Y + Math.cos(angleRad) * distance + 10, 48, 90);

  return {
    ...src,
    emoji: isShiny ? '✨' : src.emoji,
    label: isShiny ? 'PPE วิ้ง' : src.label,
    isShiny,
    id: Date.now() + index + Math.random() * 100000,
    x: baseX,
    y: baseY,
    baseX,
    baseY,
    size: isShiny ? 76 : src.isBomb ? 78 : src.isCorrect ? 72 : 70,
    weight: isShiny ? 2 : src.isBomb ? 2.7 : src.isCorrect ? 1.7 : 1.45,
    driftX: src.isBomb ? 2.5 : 3 + Math.random() * 5,
    driftY: src.isBomb ? 1.5 : 2 + Math.random() * 4,
    driftSpeed: src.isBomb ? 0.65 : 0.55 + Math.random() * 0.45,
    phase: Math.random() * Math.PI * 2,
    movePattern: pickRandom(['patrol', 'float']),
  };
}

function generateItems(score = 0): MineItem[] {
  const guaranteedAngles = [-48, -30, -13, 8, 25, 44];

  const guaranteed = guaranteedAngles.map((angle, index) =>
  makeItemFromAngle(angle, index % 2 === 0 ? 48 : 58, index, score, true)
);

  const extraAngles = [-55, -38, -20, -5, 14, 32, 50, -28, 24, 42];

  const extras = extraAngles.map((angle, index) =>
    makeItemFromAngle(
      angle + (Math.random() * 6 - 3),
      70 + (index % 3) * 6 + Math.random() * 4,
      100 + index,
      score,
      false
    )
  );

  return [...guaranteed, ...extras];
}

export default function Stage4ClawMachine({ onComplete, speedMultiplier = 1 }: Props) {
  const [showIntro, setShowIntro] = useState(true);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [items, setItems] = useState<MineItem[]>(() => generateItems());
  const [clawState, setClawState] = useState<ClawState>('aiming');
  const [angle, setAngle] = useState(0);
  const [ropeLength, setRopeLength] = useState(START_ROPE);
  const [grabbedItem, setGrabbedItem] = useState<MineItem | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [chaosText, setChaosText] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [hitStop, setHitStop] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'shiny' | 'clear' | null>(null);

  const { popups, showPopup } = useScorePopup();

  const correctSfx = useRef(new Audio('/sfx/correct.wav'));
  const wrongSfx = useRef(new Audio('/sfx/wrong.wav'));
  const perfectSfx = useRef(new Audio('/sfx/perfect.wav'));

  const scoreRef = useRef(0);
  const timeLeftRef = useRef(GAME_DURATION);
  const doneRef = useRef(false);
  const mountedRef = useRef(true);
  const pausedRef = useRef(false);
  const showIntroRef = useRef(true);

  const angleRef = useRef(0);
  const angleDirRef = useRef(1);
  const ropeRef = useRef(START_ROPE);
  const stateRef = useRef<ClawState>('aiming');
  const grabbedRef = useRef<MineItem | null>(null);
  const itemsRef = useRef<MineItem[]>(items);
  const nearMissCooldownRef = useRef(0);

  const rafRef = useRef<number>(0);
  const lastTickRef = useRef(Date.now());
  const animTimeRef = useRef(0);

  const hookX = HOOK_ORIGIN_X + Math.sin((angle * Math.PI) / 180) * ropeLength;
  const hookY = HOOK_ORIGIN_Y + Math.cos((angle * Math.PI) / 180) * ropeLength;
  const panicMode = timeLeft <= 8;
  const scoreLeft = Math.max(0, CLEAR_SCORE - score);

  const giveUpStage = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setTimeout(() => onComplete(0), 0);
  }, [onComplete]);

  const { paused, togglePause, PauseOverlay } = usePause({
    onGiveUp: giveUpStage,
  });

  useEffect(() => {
    showIntroRef.current = showIntro;
  }, [showIntro]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    stateRef.current = clawState;
  }, [clawState]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    correctSfx.current.volume = 0.5;
    wrongSfx.current.volume = 0.62;
    perfectSfx.current.volume = 0.72;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const flashText = (text: string, duration = 780) => {
    setChaosText(text);
    setTimeout(() => setChaosText(null), duration);
  };

  const hitShake = (duration = 380) => {
    setShaking(true);
    setTimeout(() => setShaking(false), duration);
  };

  const microHitStop = (duration = 70) => {
    setHitStop(true);
    setTimeout(() => setHitStop(false), duration);
  };

  const finishFeedback = (duration = 650) => {
    setTimeout(() => {
      setFeedback(null);
      setResultText(null);
    }, duration);
  };

  const resetHook = () => {
    grabbedRef.current = null;
    setGrabbedItem(null);
    ropeRef.current = START_ROPE;
    setRopeLength(START_ROPE);
    setClawState('aiming');
    stateRef.current = 'aiming';
  };

  const clearStage = useCallback((finalScore: number) => {
    if (doneRef.current) return;

    doneRef.current = true;
    setFeedback('clear');
    setResultText('🚨 STAGE CLEARED 🚨');
    flashText('ผ่านแล้ว! โรงงานยังไม่แตก!', 1200);

    perfectSfx.current.currentTime = 0;
    playSfx(perfectSfx.current);

    setTimeout(() => {
      onComplete(finalScore);
    }, 900);
  }, [onComplete]);

  useEffect(() => {
    const animate = () => {
      if (!pausedRef.current && !doneRef.current && !showIntroRef.current) {
        const now = Date.now();
        const dt = Math.min(34, now - lastTickRef.current);
        lastTickRef.current = now;
        animTimeRef.current += dt;

        const movedItems = itemsRef.current.map(item => {
          if (grabbedRef.current?.id === item.id) return item;

          const t = animTimeRef.current / 1000 + item.phase;
          let x = item.baseX;
          let y = item.baseY;

          if (item.movePattern === 'patrol') {
            x = item.baseX + Math.sin(t * item.driftSpeed) * item.driftX;
          }

          if (item.movePattern === 'float') {
            y = item.baseY + Math.sin(t * item.driftSpeed) * item.driftY;
          }

          return {
            ...item,
            x: clamp(x, 7, 93),
            y: clamp(y, 29, 89),
          };
        });

        itemsRef.current = movedItems;
        setItems(movedItems);

        if (stateRef.current === 'aiming') {
          const panicBoost = timeLeftRef.current <= 8 ? 1.28 : 1;
          const scoreBoost = Math.min(scoreRef.current / 11500, 0.035);
          const speed = (0.082 + scoreBoost) * speedMultiplier * panicBoost;
          let nextAngle = angleRef.current + angleDirRef.current * dt * speed;

          if (nextAngle >= MAX_ANGLE) {
            nextAngle = MAX_ANGLE;
            angleDirRef.current = -1;
          }

          if (nextAngle <= MIN_ANGLE) {
            nextAngle = MIN_ANGLE;
            angleDirRef.current = 1;
          }

          angleRef.current = nextAngle;
          setAngle(nextAngle);
        }

        if (stateRef.current === 'extending') {
          const nextRope = ropeRef.current + dt * 0.145 * speedMultiplier;
          ropeRef.current = nextRope;
          setRopeLength(nextRope);

          const hx = HOOK_ORIGIN_X + Math.sin((angleRef.current * Math.PI) / 180) * nextRope;
          const hy = HOOK_ORIGIN_Y + Math.cos((angleRef.current * Math.PI) / 180) * nextRope;

          const hit = itemsRef.current.find(item => {
            const dx = hx - item.x;
            const dy = hy - item.y;
            const hitbox = item.isShiny ? HITBOX_SHINY : HITBOX_NORMAL;
            return Math.sqrt(dx * dx + dy * dy) < hitbox;
          });

          if (hit) {
            grabbedRef.current = hit;
            setGrabbedItem(hit);
            setClawState('retracting');
            stateRef.current = 'retracting';
            microHitStop(55);
          } else {
            const nearMiss = itemsRef.current.find(item => {
              const dx = hx - item.x;
              const dy = hy - item.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              return dist >= NEAR_MISS_MIN && dist <= NEAR_MISS_MAX;
            });

            if (nearMiss && now - nearMissCooldownRef.current > 700) {
              nearMissCooldownRef.current = now;
              flashText('เฉียดดดด!');
            }
          }

          if (nextRope >= MAX_ROPE || hx < 3 || hx > 97 || hy > 96) {
            setResultText('เกี่ยวอากาศแบบมั่นใจ');
            if (Math.random() < 0.65) flashText('ตะขอกลับมาพร้อมความว่างเปล่า');
            setClawState('retracting');
            stateRef.current = 'retracting';
            finishFeedback(520);
          }
        }

        if (stateRef.current === 'retracting') {
          const weight = grabbedRef.current?.weight ?? 1;
          const nextRope = ropeRef.current - dt * 0.165 * speedMultiplier / weight;
          ropeRef.current = Math.max(START_ROPE, nextRope);
          setRopeLength(Math.max(START_ROPE, nextRope));

          if (nextRope <= START_ROPE) {
            const target = grabbedRef.current;

            if (target) {
              const delta = target.isShiny ? 80 : target.isCorrect ? POINTS_CORRECT : -20;
              const nextScore = Math.max(0, scoreRef.current + delta);

              scoreRef.current = nextScore;
              setScore(nextScore);

              showPopup(
                target.isShiny
                  ? '+100 ✨'
                  : delta > 0
                    ? `+${POINTS_CORRECT}`
                    : `-20`,
                target.isShiny ? '#facc15' : delta > 0 ? '#4ade80' : '#f87171',
                50,
                17
              );

              if (target.isShiny) {
                perfectSfx.current.currentTime = 0;
                playSfx(perfectSfx.current);

                setFeedback('shiny');
                setResultText('✨ PPE วิ้ง JACKPOT!');
                flashText('บุญหล่นใส่สายเซฟตี้');
                microHitStop(95);
              } else if (target.isCorrect) {
                correctSfx.current.currentTime = 0;
                playSfx(correctSfx.current);

                setFeedback('correct');
                setResultText(`${target.emoji} ${target.label}!`);
                if (Math.random() < 0.42) flashText(pickRandom(CHAOS_TEXT));
                microHitStop(65);
              } else {
                wrongSfx.current.currentTime = 0;
                playSfx(wrongSfx.current);

                setFeedback('wrong');
                setResultText(`${target.emoji} ${pickRandom(ROAST_TEXT)}`);

                if (target.isBomb || Math.random() < 0.45) {
                  flashText(target.isBomb ? '💣 ประกันไม่จ่ายนะจ๊ะ' : pickRandom(ROAST_TEXT));
                }

                hitShake(target.isBomb ? 560 : 360);
                microHitStop(target.isBomb ? 115 : 85);
              }

              finishFeedback();

              const nextItems = itemsRef.current.filter(i => i.id !== target.id);
              itemsRef.current = nextItems;
              setItems(nextItems);

              if (nextScore >= CLEAR_SCORE) {
                clearStage(nextScore);
                return;
              }

              if (nextItems.filter(i => i.isCorrect).length < 3 || nextItems.length < 8) {
                setTimeout(() => {
                  if (!mountedRef.current || doneRef.current || showIntroRef.current) return;

                  const fresh = generateItems(scoreRef.current);
                  itemsRef.current = fresh;
                  setItems(fresh);
                  flashText('เติมของใหม่แบบไม่ถามเซฟตี้');
                }, 260);
              }
            }

            resetHook();
          }
        }
      } else {
        lastTickRef.current = Date.now();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [clearStage, showPopup, speedMultiplier]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (pausedRef.current || doneRef.current || showIntro) return;

      setTimeLeft(t => {
        const next = Math.max(0, t - 0.05);
        timeLeftRef.current = next;

        if (next <= 0) {
          clearInterval(interval);

          if (!doneRef.current) {
            doneRef.current = true;
            onComplete(scoreRef.current);
          }

          return 0;
        }

        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete, showIntro]);

  const handleTap = useCallback(() => {
    if (doneRef.current || pausedRef.current || showIntroRef.current) return;
    if (stateRef.current !== 'aiming') return;

    setClawState('extending');
    stateRef.current = 'extending';
    grabbedRef.current = null;
    setGrabbedItem(null);
  }, []);

  const ropeRotation = -angle;
  const hookRotation = -angle;

  return (
    <div
      className={`
        flex flex-col h-full overflow-hidden select-none relative
        ${shaking ? 'screen-shake' : ''}
        ${hitStop ? 'hit-stop' : ''}
      `}
      style={{
        background: panicMode
          ? 'radial-gradient(circle at top, #7f1d1d 0%, #1a0a2e 42%, #050510 100%)'
          : 'linear-gradient(160deg, #0d0d1a 0%, #1a0a2e 50%, #0d1a1a 100%)',
      }}
    >
      {feedback === 'correct' && <div className="absolute inset-0 z-30 pointer-events-none correct-overlay" />}
      {feedback === 'wrong' && <div className="absolute inset-0 z-30 pointer-events-none wrong-overlay" />}
      {feedback === 'shiny' && (
        <div className="absolute inset-0 z-30 pointer-events-none" style={{ background: 'rgba(250,204,21,0.16)' }} />
      )}
      {feedback === 'clear' && <div className="absolute inset-0 z-30 pointer-events-none correct-overlay" />}

      {PauseOverlay}

      {showIntro && (
        <div
          onClick={() => setShowIntro(false)}
          onTouchStart={() => setShowIntro(false)}
          className="absolute inset-0 z-[999] flex flex-col items-center justify-center bg-black/90 px-6 text-center"
        >
          <div className="bounce-in" style={{ fontSize: '5rem' }}>
            🪝
          </div>

          <div
            className="font-game text-yellow-300 font-bold mt-3 bounce-in"
            style={{
              fontSize: 'clamp(1.7rem,7vw,2.4rem)',
              textShadow: '0 3px 0 rgba(0,0,0,0.45)',
              lineHeight: 1,
            }}
          >
            ตู้คีบ PPE หน้าไลน์ผลิต!
          </div>

          <div
            className="font-game text-white/90 mt-4 leading-relaxed bounce-in"
            style={{ fontSize: 'clamp(1rem,4.5vw,1.28rem)' }}
          >
            หัวหน้าสั่งให้หยิบอุปกรณ์เซฟตี้
            <br />
            แต่ตู้ดันปนของมั่วมาเต็มไปหมด
          </div>

          <div
            className="mt-5 rounded-2xl px-5 py-4 bounce-in"
            style={{
              background: 'rgba(250,204,21,0.14)',
              border: '2px solid rgba(250,204,21,0.35)',
            }}
          >
            <div
              className="font-game text-yellow-200 font-bold"
              style={{ fontSize: 'clamp(1rem,4.8vw,1.35rem)', lineHeight: 1.35 }}
            >
              🪖 คีบ PPE = ได้คะแนน
              <br />
              📱 ของมั่ว = โดนหักคะแนน
            </div>
          </div>

          <div
            className="mt-4 rounded-2xl px-5 py-4 bounce-in"
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '2px solid rgba(239,68,68,0.28)',
            }}
          >
            <div
              className="font-game text-red-200 font-bold"
              style={{ fontSize: 'clamp(0.95rem,4.2vw,1.2rem)', lineHeight: 1.35 }}
            >
              ✨ PPE วิ้ง = โบนัสหนัก
              <br />
              💣 ระวังของบึ้ม หัวหน้ามองอยู่
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
              style={{ fontSize: 'clamp(1.1rem,5vw,1.45rem)' }}
            >
              👆 แตะหน้าจอเพื่อเริ่ม!
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 z-50 pointer-events-none">
        <ScorePopupLayer popups={popups} />
      </div>

      <div className="flex-shrink-0 px-4 pt-5 pb-2 relative z-30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-game text-white/50 text-xs">ด่าน 4</div>

            <div
              className="font-game text-white font-bold leading-tight"
              style={{
                fontSize: 'clamp(1.25rem,5.5vw,1.65rem)',
                textShadow: '0 2px 0 rgba(0,0,0,0.35)',
              }}
            >
              Claw Machine
              <div className="text-yellow-300">คีบ PPE!</div>
            </div>

            <div
              className="font-game text-yellow-200 mt-1 leading-snug"
              style={{ fontSize: 'clamp(0.85rem,3.7vw,1rem)' }}
            >
              คีบ PPE จริงเท่านั้น
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
              background: score >= CLEAR_SCORE ? 'rgba(250,204,21,0.22)' : 'rgba(255,255,255,0.08)',
              border: score >= CLEAR_SCORE ? '1px solid rgba(250,204,21,0.5)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span
              className="font-game font-bold"
              style={{
                color: score >= CLEAR_SCORE ? '#fde047' : 'rgba(255,255,255,0.9)',
                fontSize: 'clamp(1rem,4.5vw,1.2rem)',
                textShadow: '0 2px 0 rgba(0,0,0,0.45)',
              }}
            >
              {score >= CLEAR_SCORE ? '🚨 ผ่านแล้ว!' : `🎯 อีก ${scoreLeft} คะแนนจะผ่าน!`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 px-4 py-1 text-center relative z-30">
        <div
          className={`inline-block rounded-xl px-4 py-2 ${
            panicMode ? 'bg-red-500/30 border border-red-500/50' : 'bg-yellow-500/20 border border-yellow-400/30'
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <span
              className={`font-game font-bold ${panicMode ? 'text-red-300 timer-critical' : 'text-yellow-300'}`}
              style={{
                fontSize: 'clamp(1rem,4.5vw,1.25rem)',
                textShadow: '0 2px 0 rgba(0,0,0,0.45)',
                lineHeight: 1.15,
              }}
            >
              {panicMode ? '🚨 FINAL CHAOS!' : 'เล็งแล้วกดยิงตะขอ'}
            </span>

            <span
              className="font-game text-white/55"
              style={{ fontSize: 'clamp(0.72rem,3.2vw,0.9rem)', lineHeight: 1.15 }}
            >
              PPE +{POINTS_CORRECT} · ✨ +80 · ของมั่ว -20
            </span>
          </div>
        </div>
      </div>

      <div
        className="flex-1 relative mx-4 rounded-2xl overflow-hidden"
        style={{
          background: panicMode
            ? 'linear-gradient(180deg, #450a0a 0%, #111827 48%, #1f1308 100%)'
            : 'linear-gradient(180deg, #172554 0%, #111827 52%, #1f1308 100%)',
          border: panicMode ? '3px solid rgba(248,113,113,0.72)' : '3px solid rgba(99,102,241,0.4)',
          boxShadow: panicMode
            ? '0 0 36px rgba(248,113,113,0.36), inset 0 0 20px rgba(0,0,0,0.55)'
            : '0 0 30px rgba(99,102,241,0.2), inset 0 0 20px rgba(0,0,0,0.55)',
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            left: `${HOOK_ORIGIN_X}%`,
            top: `${HOOK_ORIGIN_Y}%`,
            width: 38,
            height: 24,
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(180deg, #f3f4f6, #6b7280)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.45)',
            zIndex: 15,
          }}
        />

        {clawState === 'aiming' && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${HOOK_ORIGIN_X}%`,
              top: `${HOOK_ORIGIN_Y}%`,
              width: '3px',
              height: `${MAX_ROPE}%`,
              transformOrigin: 'top center',
              transform: `translateX(-50%) rotate(${ropeRotation}deg)`,
              zIndex: 9,
              background: 'repeating-linear-gradient(to bottom, rgba(251,191,36,0.78) 0 9px, transparent 9px 16px)',
              filter: 'drop-shadow(0 0 7px rgba(251,191,36,0.5))',
              opacity: 0.9,
            }}
          />
        )}

        <div
          className="absolute"
          style={{
            left: `${HOOK_ORIGIN_X}%`,
            top: `${HOOK_ORIGIN_Y}%`,
            width: '4px',
            height: `${ropeLength}%`,
            background: 'rgba(229,231,235,0.84)',
            transformOrigin: 'top center',
            transform: `translateX(-50%) rotate(${ropeRotation}deg)`,
            borderRadius: 999,
            zIndex: 12,
          }}
        />

        <div
          className="absolute flex flex-col items-center pointer-events-none"
          style={{
            left: `${hookX}%`,
            top: `${hookY}%`,
            transform: `translate(-50%, -50%) rotate(${hookRotation}deg)`,
            zIndex: 24,
          }}
        >
          <div style={{ fontSize: '2.45rem' }}>🪝</div>

          {grabbedItem && (
            <div
              className="absolute"
              style={{
                top: '34px',
                fontSize: grabbedItem.isShiny ? '3.15rem' : '2.85rem',
                filter: 'drop-shadow(0 4px 5px rgba(0,0,0,0.55))',
                animation: 'bounceIn 0.18s ease-out',
              }}
            >
              {grabbedItem.emoji}
            </div>
          )}
        </div>

        {items.map(item => (
          <div
            key={item.id}
            className="absolute rounded-full flex flex-col items-center justify-center"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: item.size,
              height: item.size,
              transform: 'translate(-50%, -50%)',
              opacity: grabbedItem?.id === item.id ? 0 : 1,
              background: item.isShiny
                ? 'radial-gradient(circle, rgba(250,204,21,0.45), rgba(250,204,21,0.06))'
                : item.isBomb
                  ? 'radial-gradient(circle, rgba(239,68,68,0.34), rgba(127,29,29,0.06))'
                  : item.isCorrect
                    ? 'radial-gradient(circle, rgba(34,197,94,0.26), rgba(34,197,94,0.05))'
                    : 'radial-gradient(circle, rgba(239,68,68,0.20), rgba(239,68,68,0.04))',
              border: item.isShiny
                ? '3px solid rgba(250,204,21,0.9)'
                : item.isBomb
                  ? '2.5px solid rgba(248,113,113,0.72)'
                  : item.isCorrect
                    ? '2.5px solid rgba(34,197,94,0.48)'
                    : '2.5px solid rgba(239,68,68,0.36)',
              boxShadow: item.isShiny
                ? '0 0 26px rgba(250,204,21,0.72)'
                : item.isBomb
                  ? '0 0 20px rgba(248,113,113,0.48)'
                  : item.isCorrect
                    ? '0 0 15px rgba(34,197,94,0.32)'
                    : '0 0 12px rgba(239,68,68,0.22)',
              transition: 'opacity 0.12s ease',
              animation: item.isShiny ? 'pulse 0.52s infinite' : item.isBomb ? 'shake 0.7s infinite' : undefined,
              zIndex: item.isShiny ? 13 : item.isBomb ? 12 : 10,
            }}
          >
            <span
              style={{
                fontSize: item.isShiny ? '3.15rem' : item.isBomb ? '3rem' : '2.8rem',
                lineHeight: 1,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.45))',
              }}
            >
              {item.emoji}
            </span>

            <span
              className="font-game text-center whitespace-nowrap"
              style={{
                fontSize: '0.86rem',
                color: '#ffffff',
                background: 'rgba(0,0,0,0.72)',
                padding: '4px 9px',
                borderRadius: '999px',
                marginTop: '3px',
                fontWeight: 700,
                textShadow: '0 2px 0 rgba(0,0,0,1), 0 0 7px rgba(0,0,0,0.9)',
                maxWidth: '92px',
              }}
            >
              {item.label}
            </span>
          </div>
        ))}

        {resultText && (
          <div className="absolute inset-x-0 pointer-events-none flex justify-center bounce-in" style={{ top: '35%', zIndex: 36 }}>
            <div
              className="font-game font-bold text-white rounded-2xl px-4 py-2 text-center"
              style={{
                background: 'rgba(0,0,0,0.88)',
                fontSize: 'clamp(1rem,4.5vw,1.35rem)',
                textShadow: '0 2px 0 rgba(0,0,0,1)',
                boxShadow: '0 8px 0 rgba(0,0,0,0.45)',
              }}
            >
              {resultText}
            </div>
          </div>
        )}

        {chaosText && (
          <div className="absolute inset-x-3 pointer-events-none text-center bounce-in" style={{ top: '18%', zIndex: 37 }}>
            <div
              className="font-game font-bold rounded-2xl px-3 py-2 inline-block"
              style={{
                background: panicMode ? 'rgba(239,68,68,0.95)' : 'rgba(239,68,68,0.88)',
                color: 'white',
                fontSize: 'clamp(0.9rem,3.8vw,1.1rem)',
                boxShadow: '0 8px 18px rgba(0,0,0,0.35)',
                textShadow: '0 2px 0 rgba(0,0,0,0.55)',
              }}
            >
              {chaosText}
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 px-4 py-3 relative z-30">
        <button
          onTouchStart={handleTap}
          onClick={handleTap}
          disabled={clawState !== 'aiming'}
          className="w-full rounded-3xl py-4 font-game font-bold text-white active:scale-95 transition-transform flex items-center justify-center gap-3"
          style={{
            background: clawState === 'aiming'
              ? panicMode
                ? 'linear-gradient(135deg, #f97316, #dc2626)'
                : 'linear-gradient(135deg, #dc2626, #b91c1c)'
              : 'linear-gradient(135deg, #374151, #1f2937)',
            boxShadow: clawState === 'aiming'
              ? panicMode ? '0 6px 0 #7c2d12' : '0 6px 0 #7f1d1d'
              : '0 6px 0 #111827',
            fontSize: 'clamp(1.25rem,5.8vw,1.75rem)',
            opacity: clawState === 'aiming' ? 1 : 0.62,
            touchAction: 'manipulation',
          }}
        >
          <span className="text-4xl">{panicMode ? '🚨' : '🪝'}</span>
          <span>
            {clawState === 'aiming'
              ? panicMode ? 'ยิงเดี๋ยวนี้!' : 'ยิงตะขอ!'
              : clawState === 'extending'
                ? 'กำลังเกี่ยว...'
                : grabbedItem
                  ? 'ลากของกลับ!'
                  : 'ดึงกลับ...'}
          </span>
        </button>
      </div>

      <div className="flex-shrink-0 px-4 pb-6 flex justify-center gap-5 relative z-30">
        <div className="text-center">
          <div
            className="font-game text-green-400 font-bold"
            style={{ fontSize: 'clamp(1rem,4vw,1.25rem)' }}
          >
            +{POINTS_CORRECT}
          </div>
          <div className="font-game text-white/40 text-xs">PPE</div>
        </div>

        <div className="w-px bg-white/10" />

        <div className="text-center">
          <div
            className="font-game text-yellow-300 font-bold"
            style={{ fontSize: 'clamp(1rem,4vw,1.25rem)' }}
          >
            +80
          </div>
          <div className="font-game text-white/40 text-xs">วิ้ง</div>
        </div>

        <div className="w-px bg-white/10" />

        <div className="text-center">
          <div
            className="font-game text-red-400 font-bold"
            style={{ fontSize: 'clamp(1rem,4vw,1.25rem)' }}
          >
            -20
          </div>
          <div className="font-game text-white/40 text-xs">ของมั่ว</div>
        </div>
      </div>
    </div>
  );
}