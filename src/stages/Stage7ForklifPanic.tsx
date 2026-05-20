import { useState, useEffect, useRef, useCallback } from 'react';
import TimerBar from '../components/TimerBar';
import PauseButton, { usePause } from '../components/PauseButton';
import { playSfx } from '../sound';
const STAGE7_DURATION = 20;
const MAX_HEARTS = 3;

const COLLISION_Y = 78;
const HIT_Y_DISTANCE = 5;
const HIT_X_DISTANCE = 9;
const SWIPE_THRESHOLD = 45;

interface Props {
  onComplete: (score: number) => void;
  speedMultiplier?: number;
  onDamage?: () => void;
}

type Lane = 0 | 1 | 2;

interface FallingItem {
  id: number;
  lane: Lane;
  emoji: string;
  label: string;
  y: number;
  speed: number;
  dead: boolean;
}

const HAZARDS = [
  { emoji: '📦', label: 'กล่องหล่น' },
  { emoji: '🛢️', label: 'ถังน้ำมัน' },
  { emoji: '🔥', label: 'ไฟ!' },
  { emoji: '💧', label: 'พื้นลื่น' },
  { emoji: '⚡', label: 'ไฟฟ้า!' },
  { emoji: '🧱', label: 'กำแพง' },
];

const ITEM_POOL = [...HAZARDS, ...HAZARDS, ...HAZARDS];

let itemIdCounter = 0;
let laneBag: Lane[] = [];

function getNextLane(): Lane {
  if (laneBag.length === 0) {
    laneBag = [0, 1, 2].sort(() => Math.random() - 0.5);
  }

  return laneBag.pop()!;
}

export default function Stage7ForklifPanic({
  onComplete,
  speedMultiplier = 1,
  onDamage,
}: Props) {
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [timeLeft, setTimeLeft] = useState(STAGE7_DURATION);
  const [playerLane, setPlayerLane] = useState<Lane>(1);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [shaking, setShaking] = useState(false);
  const [collisionFlash, setCollisionFlash] = useState(false);

  const doneRef = useRef(false);
  const pausedRef = useRef(false);
  const playerLaneRef = useRef<Lane>(1);
  const speedRef = useRef(speedMultiplier);
  const invincibleRef = useRef(false);
  const correctSfx = useRef(new Audio('/sfx/correct.wav'));
const wrongSfx = useRef(new Audio('/sfx/wrong.wav'));
const perfectSfx = useRef(new Audio('/sfx/perfect.wav'));
  const pointerStartXRef = useRef(0);

  const laneXPct = [16.5, 50, 83.5];
  const isDanger = hearts <= 1;
  const failStage = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setTimeout(() => onComplete(-1), 0);
  }, [onComplete]);

  const clearStage = useCallback(() => {
    if (doneRef.current) return;
  
    doneRef.current = true;
  
    perfectSfx.current.currentTime = 0;
    playSfx(perfectSfx.current);
  
    setCollisionFlash(true);
  
    setTimeout(() => {
      onComplete(0);
    }, 700);
  }, [onComplete]);

  const { paused, togglePause, PauseOverlay } = usePause({
    onGiveUp: failStage,
  });

  const moveLeft = useCallback(() => {
    setPlayerLane(l => {
      const next = Math.max(0, l - 1) as Lane;
      playerLaneRef.current = next;
      return next;
    });
  }, []);

  const moveRight = useCallback(() => {
    setPlayerLane(l => {
      const next = Math.min(2, l + 1) as Lane;
      playerLaneRef.current = next;
      return next;
    });
  }, []);

  const isPointerDownRef = useRef(false);
const hasSwipedRef = useRef(false);

const handlePointerDown = useCallback(
  (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDownRef.current = true;
    hasSwipedRef.current = false;
    pointerStartXRef.current = e.clientX;
  },
  []
);

const handlePointerMove = useCallback(
  (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    if (hasSwipedRef.current) return;

    const deltaX = e.clientX - pointerStartXRef.current;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

    hasSwipedRef.current = true;

    if (deltaX > 0) {
      moveRight();
    } else {
      moveLeft();
    }
  },
  [moveLeft, moveRight]
);

const handlePointerUp = useCallback(() => {
  isPointerDownRef.current = false;
  hasSwipedRef.current = false;
}, []);

  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  useEffect(() => {
    playerLaneRef.current = playerLane;
  }, [playerLane]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    correctSfx.current.volume = 0.45;
    wrongSfx.current.volume = 0.7;
    perfectSfx.current.volume = 0.8;
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      if (pausedRef.current || doneRef.current) return;

      setTimeLeft(t => {
        const next = Math.max(0, t - 0.05);
        if (next <= 0) clearStage();
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [clearStage]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (pausedRef.current || doneRef.current) return;
  
      correctSfx.current.currentTime = 0;
      playSfx(correctSfx.current);
    }, 5000);
  
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const spawnRate = Math.max(300, Math.round(700 / speedMultiplier));

    const interval = setInterval(() => {
      if (pausedRef.current || doneRef.current) return;

      const src = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];
      const lane = getNextLane();
      const speed =
        (6 + speedRef.current * 2.2) * (0.85 + Math.random() * 0.25);

      const newItems: FallingItem[] = [
        {
          id: itemIdCounter++,
          lane,
          emoji: src.emoji,
          label: src.label,
          y: -10,
          speed,
          dead: false,
        },
      ];

      if (Math.random() < 0.25) {
        const otherLanes = ([0, 1, 2] as Lane[]).filter(l => l !== lane);
        const lane2 = otherLanes[Math.floor(Math.random() * otherLanes.length)];
        const src2 = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];

        newItems.push({
          id: itemIdCounter++,
          lane: lane2,
          emoji: src2.emoji,
          label: src2.label,
          y: -10,
          speed:
            (6 + speedRef.current * 2.2) * (0.85 + Math.random() * 0.25),
          dead: false,
        });
      }

      setItems(prev => [...prev.slice(-24), ...newItems]);
    }, spawnRate);

    return () => clearInterval(interval);
  }, [speedMultiplier]);

  useEffect(() => {
    const damageThisTickRef = { value: false };

    const tick = setInterval(() => {
      if (pausedRef.current || doneRef.current) return;

      damageThisTickRef.value = false;

      setItems(prev => {
        const pLane = playerLaneRef.current;

        const updated = prev.map(item => {
          if (item.dead) return item;

          const newY = item.y + item.speed * 0.25;

          if (newY > 115) {
            return { ...item, dead: true, y: newY };
          }

          const playerX = laneXPct[pLane];
          const itemX = laneXPct[item.lane];

          const dx = Math.abs(playerX - itemX);
          const dy = Math.abs(newY - COLLISION_Y);

          const hit = dx < HIT_X_DISTANCE && dy < HIT_Y_DISTANCE;

          if (hit) {
            if (!invincibleRef.current) {
              damageThisTickRef.value = true;
            }

            return { ...item, dead: true, y: newY };
          }

          return { ...item, y: newY };
        });

        return updated.filter(i => !i.dead || i.y < 120);
      });

      setTimeout(() => {
        if (!damageThisTickRef.value) return;
        if (invincibleRef.current) return;

        invincibleRef.current = true;
        wrongSfx.current.currentTime = 0;
        playSfx(wrongSfx.current);
        setHearts(prev => {
          const next = Math.max(0, prev - 1);
          if (next <= 0) failStage();
          return next;
        });

        setShaking(true);
        setTimeout(() => setShaking(false), 400);

        setCollisionFlash(true);
        setTimeout(() => setCollisionFlash(false), 300);

        setTimeout(() => {
          invincibleRef.current = false;
        }, 700);

        onDamage?.();
      }, 0);
    }, 40);

    return () => clearInterval(tick);
  }, [onDamage, failStage]);

  return (
    <div
      className={`flex flex-col h-full overflow-hidden select-none relative ${
        shaking ? 'screen-shake' : ''
      }`}
      style={{
        background: isDanger
          ? 'linear-gradient(160deg, #2a0f0f 0%, #450a0a 100%)'
          : 'linear-gradient(160deg, #0c0e1a 0%, #151a2d 100%)'
      }}
    >
      {collisionFlash && (
        <div className="absolute inset-0 z-30 pointer-events-none wrong-overlay" />
      )}

      {PauseOverlay}

      <div className="flex-shrink-0 px-4 pt-5 pb-2 relative z-20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-game text-white/50 text-xs">ด่าน 7</div>
            <div className="font-game text-white text-xl font-bold">
              Forklift Panic!
            </div>
            <div className="font-game text-red-400 text-sm mt-1">
              {'❤️'.repeat(hearts)}
              {'🖤'.repeat(MAX_HEARTS - hearts)}
            </div>
          </div>

          <PauseButton paused={paused} onToggle={togglePause} />
        </div>

        <TimerBar timeLeft={timeLeft} totalTime={STAGE7_DURATION} />
      </div>

      <div className="flex-shrink-0 text-center px-4 py-1">
  <div
    className="inline-block rounded-xl px-4 py-1.5"
    style={{
      background: isDanger
        ? 'rgba(239,68,68,0.22)'
        : 'rgba(239,68,68,0.12)',
      border: isDanger
        ? '1px solid rgba(239,68,68,0.45)'
        : '1px solid transparent',
    }}
  >
    <span
      className={`font-game text-sm font-bold ${
        isDanger ? 'text-red-200 timer-critical' : 'text-red-300'
      }`}
    >
      {isDanger
        ? '⚠️ อีกทีเดียวพัง!'
        : 'ปัด/ลากซ้ายขวา เพื่อหลบอันตรายให้ครบ 20 วิ!'}
    </span>
  </div>
</div>

      <div
        className="flex-1 relative overflow-hidden mx-4 mb-4 rounded-2xl touch-none"
        onPointerDown={handlePointerDown}
onPointerMove={handlePointerMove}
onPointerUp={handlePointerUp}
onPointerCancel={handlePointerUp}
        style={{
          background: 'rgba(0,0,0,0.35)',
          border: '1.5px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}
        >
          <div style={{ borderRight: '1px dashed rgba(255,255,255,0.07)' }} />
          <div style={{ borderRight: '1px dashed rgba(255,255,255,0.07)' }} />
          <div />
        </div>

        {items.filter(i => !i.dead).map(item => (
          <div
            key={item.id}
            className="absolute flex flex-col items-center pointer-events-none"
            style={{
              left: `${laneXPct[item.lane]}%`,
              top: `${item.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
            }}
          >
            <div
              className="rounded-2xl p-2 flex flex-col items-center"
              style={{
                background: 'rgba(239,68,68,0.2)',
                border: '2px solid rgba(239,68,68,0.6)',
                boxShadow: '0 0 12px rgba(239,68,68,0.3)',
              }}
            >
              <span style={{ fontSize: '3rem', lineHeight: 1 }}>
                {item.emoji}
              </span>
            </div>

            <span
              className="font-game text-white/60 text-xs mt-0.5"
              style={{ textShadow: '1px 1px 0 black' }}
            >
              {item.label}
            </span>
          </div>
        ))}

        <div
          className="absolute flex flex-col items-center"
          style={{
            left: `${laneXPct[playerLane]}%`,
            top: `${COLLISION_Y}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'left 0.08s cubic-bezier(0.175,0.885,0.32,1.275)',
            zIndex: 20,
            filter: collisionFlash
  ? 'brightness(0.3)'
  : `
    drop-shadow(0 0 10px rgba(251,191,36,0.9))
    drop-shadow(0 0 22px rgba(251,191,36,0.5))
  `,
          }}
        >
          <span style={{ fontSize: '4.2rem', lineHeight: 1 }}>🚜</span>
        </div>
      </div>
    </div>
  );
}