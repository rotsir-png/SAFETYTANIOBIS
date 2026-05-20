/**
 * Stage 8: Final Chaos
 * Final boss remix of Stage 1-7 mechanics.
 * - Local score balance
 * - SFX through playSfx()
 * - Clear instantly at 1000
 * - Bigger mobile targets
 * - Stage6-style bigger timing bar
 * - Stage7-style swipe dodge
 */

 import { useState, useEffect, useRef, useCallback } from 'react';
 import TimerBar from '../components/TimerBar';
 import ScorePopupLayer, { useScorePopup } from '../components/ScorePopup';
 import PauseButton, { usePause } from '../components/PauseButton';
 import { swipeCards, ppeItems, hazardItems, POINTS_WRONG } from '../gameData';
 import { playSfx } from '../sound';
 
 interface Props {
   onComplete: (score: number) => void;
   speedMultiplier?: number;
 }
 
 const TOTAL_DURATION = 70;
 const SEGMENT_DURATION = 10;
 
 const STAGE8_CORRECT_SCORE = 30;
 const STAGE8_WRONG_SCORE = POINTS_WRONG;
 const STAGE8_CLEAR_SCORE = 1000;
 const DODGE_SURVIVE_SCORE = 10;
 
 const TIMING_START_ZONE_WIDTH = 48;
 const TIMING_MIN_ZONE_WIDTH = 18;
 const SWIPE_PERFECT_THRESHOLD = 140;
const SWIPE_NEAR_MISS_THRESHOLD = 45;
 const SWIPE_THRESHOLD = 60;
 const DODGE_SWIPE_THRESHOLD = 45;
 
 type SegmentType = 'swipe' | 'ppe' | 'hazard' | 'claw' | 'defense' | 'timing' | 'dodge';
 type Lane = 0 | 1 | 2;
 
 const SEGMENT_ORDER: SegmentType[] = ['swipe', 'ppe', 'hazard', 'claw', 'defense', 'timing', 'dodge'];
 
 const SEGMENT_NAMES: Record<SegmentType, string> = {
   swipe: 'Safety Swipe',
   ppe: 'PPE Rush',
   hazard: 'Whack-a-Danger',
   claw: 'Claw Machine',
   defense: 'Hazard Defense',
   timing: 'Machine Sync',
   dodge: 'Forklift Panic',
 };
 
 const SEGMENT_EMOJIS: Record<SegmentType, string> = {
   swipe: '👆',
   ppe: '⛑️',
   hazard: '🔥',
   claw: '🪝',
   defense: '🛡️',
   timing: '⚙️',
   dodge: '🚜',
 };
 
 const TRANSITION_WORDS = ['เปลี่ยน!', 'สับ!', 'หลอก!', 'ไป!', 'อย่ามึน!'];
 
 const CHAOS_TEXTS = [
   'หัวหน้ามองอยู่!',
   'โรงงานกำลังแตก!',
   'อย่าแพ้ตอนจบ!',
   'โหมดสุดท้ายแล้ว!',
   'Safety ต้องรอด!',
   'ชิบหายวายวอดของจริง!',
 ];
 
 function pickRandom<T>(arr: T[]): T {
   return arr[Math.floor(Math.random() * arr.length)];
 }
 
 function shuffle<T>(arr: T[]): T[] {
   const a = [...arr];
 
   for (let i = a.length - 1; i > 0; i--) {
     const j = Math.floor(Math.random() * (i + 1));
     [a[i], a[j]] = [a[j], a[i]];
   }
 
   return a;
 }
 
 /* ── PPE Rush ───────────────────────────────────────────── */
 
 interface GridItem {
   uid: number;
   emoji: string;
   label: string;
   isCorrect: boolean;
   tapped: boolean;
 }
 
 const FAKE_PPE_ITEMS = [
   { emoji: '🍜', label: 'ราเมง', isCorrect: false },
   { emoji: '🩴', label: 'แตะ', isCorrect: false },
   { emoji: '📱', label: 'มือถือ', isCorrect: false },
   { emoji: '🧸', label: 'ตุ๊กตา', isCorrect: false },
   { emoji: '🧢', label: 'หมวกเท่', isCorrect: false },
 ];
 
 let ppeUid = 5000;
 
 function makePPEGrid(): GridItem[] {
   const corrects = shuffle(ppeItems.filter(i => i.isCorrect)).slice(0, 4);
   const wrongsFromData = ppeItems.filter(i => !i.isCorrect);
   const wrongs = shuffle([...wrongsFromData, ...FAKE_PPE_ITEMS]).slice(0, 5);
 
   return shuffle([...corrects, ...wrongs]).map(i => ({
     uid: ppeUid++,
     emoji: i.emoji,
     label: i.label,
     isCorrect: i.isCorrect,
     tapped: false,
   }));
 }
 
 /* ── Claw Machine ───────────────────────────────────────── */
 
 const CLAW_ITEMS = [
   { emoji: '🪖', label: 'หมวก', isCorrect: true },
   { emoji: '🥽', label: 'แว่น', isCorrect: true },
   { emoji: '🧤', label: 'ถุงมือ', isCorrect: true },
   { emoji: '👞', label: 'รองเท้า', isCorrect: true },
   { emoji: '😷', label: 'หน้ากาก', isCorrect: true },
   { emoji: '🦺', label: 'เสื้อ', isCorrect: true },
   { emoji: '📱', label: 'มือถือ', isCorrect: false },
   { emoji: '🍜', label: 'มาม่า', isCorrect: false },
   { emoji: '🧸', label: 'ตุ๊กตา', isCorrect: false },
   { emoji: '🩴', label: 'แตะ', isCorrect: false },
 ];
 
 interface ClawGridItem {
   id: number;
   emoji: string;
   label: string;
   isCorrect: boolean;
   col: number;
   row: number;
 }
 
 let clawItemId = 8000;
 
 function makeClawGrid(): ClawGridItem[] {
   const shuffled = shuffle(CLAW_ITEMS);
 
   return Array.from({ length: 8 }, (_, i) => {
     const item = shuffled[i % shuffled.length];
 
     return {
       id: clawItemId++,
       emoji: item.emoji,
       label: item.label,
       isCorrect: item.isCorrect,
       col: i % 4,
       row: Math.floor(i / 4),
     };
   });
 }
 
 /* ── Defense ───────────────────────────────────────────── */
 
 interface DefHazard {
   id: number;
   emoji: string;
   x: number;
   y: number;
   vx: number;
   vy: number;
   dead: boolean;
 }
 
 let defId = 9000;
 
 const DEF_HAZARDS = ['🔥', '⚡', '💧', '🧱', '🚧', '📱'];
 
 function spawnDefHazard(sm: number): DefHazard {
   const edge = Math.floor(Math.random() * 4);
   let x = 50;
   let y = 50;
 
   if (edge === 0) {
     x = 10 + Math.random() * 80;
     y = -8;
   } else if (edge === 1) {
     x = 108;
     y = 10 + Math.random() * 80;
   } else if (edge === 2) {
     x = 10 + Math.random() * 80;
     y = 108;
   } else {
     x = -8;
     y = 10 + Math.random() * 80;
   }
 
   const dx = 50 - x;
   const dy = 48 - y;
   const dist = Math.sqrt(dx * dx + dy * dy);
   const spd = (0.22 + Math.random() * 0.12) * sm;
 
   return {
     id: defId++,
     emoji: pickRandom(DEF_HAZARDS),
     x,
     y,
     vx: (dx / dist) * spd,
     vy: (dy / dist) * spd,
     dead: false,
   };
 }
 
 /* ── Dodge ───────────────────────────────────────────── */
 
 interface DodgeItem {
   id: number;
   lane: Lane;
   emoji: string;
   isPickup: boolean;
   y: number;
   dead: boolean;
 }
 
 let dodgeId = 7000;
 
 const DODGE_ITEMS = [
   { emoji: '📦', isPickup: false },
   { emoji: '🔥', isPickup: false },
   { emoji: '💧', isPickup: false },
   { emoji: '⚡', isPickup: false },
   { emoji: '🧱', isPickup: false },
   { emoji: '⛑️', isPickup: true },
   { emoji: '🦺', isPickup: true },
 ];
 
 export default function Stage8FinalChaos({ onComplete, speedMultiplier = 1 }: Props) {
   const [score, setScore] = useState(0);
   const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION);
   const [segmentIdx, setSegmentIdx] = useState(0);
   const [segmentTimeLeft, setSegmentTimeLeft] = useState(SEGMENT_DURATION);
   const [transitioning, setTransitioning] = useState(false);
   const [transMsg, setTransMsg] = useState('');
   const [chaosText, setChaosText] = useState('');
   const [shaking, setShaking] = useState(false);
   const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'clear' | null>(null);
   const [showSiren, setShowSiren] = useState(false);
 
   const scoreRef = useRef(0);
   const doneRef = useRef(false);
   const mountedRef = useRef(true);
   const pausedRef = useRef(false);
   const segIdxRef = useRef(0);
   const fieldRef = useRef<HTMLDivElement>(null);
 
   const correctSfx = useRef(new Audio('/sfx/correct.wav'));
   const wrongSfx = useRef(new Audio('/sfx/wrong.wav'));
   const perfectSfx = useRef(new Audio('/sfx/perfect.wav'));
   const shotSfx = useRef(new Audio('/sfx/shot.wav'));
 
   const { popups, showPopup } = useScorePopup();
 
   const { paused, togglePause, PauseOverlay } = usePause({
     onGiveUp: () => {
       if (doneRef.current) return;
       doneRef.current = true;
       onComplete(0);
     },
   });
 
  /* ── Swipe state ── */
const swipeDeck = useRef(shuffle(swipeCards));
const swipeIdx = useRef(0);
const swipeStartX = useRef(0);
const swipeDragRef = useRef(0);

const [swipeDragX, setSwipeDragX] = useState(0);
const [swipeIsDragging, setSwipeIsDragging] = useState(false);
const [swipeHint, setSwipeHint] = useState<'right' | 'left' | null>(null);
const [swipeCardAnim, setSwipeCardAnim] = useState<'in' | 'out-right' | 'out-left'>('in');
const [swipeNearMissShake, setSwipeNearMissShake] = useState(false);
const [miniKey, setMiniKey] = useState(0);
 
   /* ── PPE state ── */
   const [ppeGrid, setPpeGrid] = useState<GridItem[]>(makePPEGrid);
 
   /* ── Hazard tap ── */
   interface HazardTapItem {
     uid: number;
     emoji: string;
     label: string;
     isHazard: boolean;
     x: number;
     y: number;
   }
 
   const [tapItems, setTapItems] = useState<HazardTapItem[]>([]);
 
   /* ── Claw state ── */
   const [clawX, setClawX] = useState(50);
   const [clawY, setClawY] = useState(0);
   const [clawState, setClawState] = useState<'swinging' | 'dropping' | 'rising'>('swinging');
   const [clawGrid, setClawGrid] = useState<ClawGridItem[]>(makeClawGrid);
   const clawXRef = useRef(50);
   const clawDirRef = useRef<1 | -1>(1);
   const clawStateRef = useRef<'swinging' | 'dropping' | 'rising'>('swinging');
   const clawRafRef = useRef<number>(0);
   const clawLastTickRef = useRef(Date.now());
 
   /* ── Defense ── */
   const [defHazards, setDefHazards] = useState<DefHazard[]>([]);
 
   /* ── Timing ── */
   const needleRef = useRef(0);
   const needleDirRef = useRef<1 | -1>(1);
   const [needlePos, setNeedlePos] = useState(0);
   const [zoneCenter, setZoneCenter] = useState(50);
   const [zoneWidth, setZoneWidth] = useState(TIMING_START_ZONE_WIDTH);
   const zoneCenterRef = useRef(50);
   const zoneWidthRef = useRef(TIMING_START_ZONE_WIDTH);
   const timingRafRef = useRef<number>(0);
   const timingLastTickRef = useRef(Date.now());
 
   /* ── Dodge ── */
   const [playerLane, setPlayerLane] = useState<Lane>(1);
   const playerLaneRef = useRef<Lane>(1);
   const [dodgeItems, setDodgeItems] = useState<DodgeItem[]>([]);
   const dodgeSurvivalRef = useRef(0);
   const dodgePointerDownRef = useRef(false);
   const dodgeSwipedRef = useRef(false);
   const dodgeStartXRef = useRef(0);
 
   const laneXPct = [16.5, 50, 83.5];
   const currentSegment = SEGMENT_ORDER[Math.min(segmentIdx, SEGMENT_ORDER.length - 1)];
   const swipeCard = swipeDeck.current[swipeIdx.current % swipeDeck.current.length];
   const segProgress = ((SEGMENT_DURATION - segmentTimeLeft) / SEGMENT_DURATION) * 100;
   const scoreLeft = Math.max(0, STAGE8_CLEAR_SCORE - score);
   let swipeAnimClass = '';
if (swipeCardAnim === 'in') swipeAnimClass = 'card-slide-in';
else if (swipeCardAnim === 'out-right') swipeAnimClass = 'card-slide-out-right';
else if (swipeCardAnim === 'out-left') swipeAnimClass = 'card-slide-out-left';
   useEffect(() => {
     correctSfx.current.volume = 0.5;
     wrongSfx.current.volume = 0.65;
     perfectSfx.current.volume = 0.8;
     shotSfx.current.volume = 0.55;
   }, []);
 
   useEffect(() => {
     mountedRef.current = true;
 
     return () => {
       mountedRef.current = false;
     };
   }, []);
 
   useEffect(() => {
     segIdxRef.current = segmentIdx;
   }, [segmentIdx]);
 
   useEffect(() => {
     playerLaneRef.current = playerLane;
   }, [playerLane]);
 
   useEffect(() => {
     clawStateRef.current = clawState;
   }, [clawState]);
 
   useEffect(() => {
     zoneCenterRef.current = zoneCenter;
   }, [zoneCenter]);
 
   useEffect(() => {
     zoneWidthRef.current = zoneWidth;
   }, [zoneWidth]);
 
   useEffect(() => {
     pausedRef.current = paused;
   }, [paused]);
 
   const clearStage = useCallback((finalScore: number) => {
     if (doneRef.current) return;
 
     doneRef.current = true;
     setFeedback('clear');
     setTransMsg('FINAL CLEAR!');
     setChaosText('โรงงานรอดแบบงง ๆ แต่รอด!');
     setTransitioning(true);
     setShowSiren(true);
 
     perfectSfx.current.currentTime = 0;
     playSfx(perfectSfx.current);
 
     showPopup('STAGE CLEAR!', '#facc15', 50, 42);
 
     setTimeout(() => {
       onComplete(finalScore);
     }, 900);
   }, [onComplete, showPopup]);
 
   const award = useCallback((delta: number, xPct: number, yPct: number, label?: string) => {
     if (doneRef.current) return;
 
     scoreRef.current = Math.max(0, scoreRef.current + delta);
     setScore(scoreRef.current);
 
     if (delta > 0) {
       correctSfx.current.currentTime = 0;
       playSfx(correctSfx.current);
     } else if (delta < 0) {
       wrongSfx.current.currentTime = 0;
       playSfx(wrongSfx.current);
     }
 
     showPopup(
       label ?? (delta > 0 ? `+${delta}` : `${delta}`),
       delta > 0 ? '#4ade80' : '#f87171',
       xPct,
       yPct
     );
 
     setFeedback(delta > 0 ? 'correct' : 'wrong');
 
     if (delta < 0) {
       setShaking(true);
       setTimeout(() => setShaking(false), 350);
     }
 
     setTimeout(() => setFeedback(null), 240);
 
     if (scoreRef.current >= STAGE8_CLEAR_SCORE) {
       clearStage(scoreRef.current);
     }
   }, [clearStage, showPopup]);
 
   /* ── Total timer ── */
   useEffect(() => {
     const interval = setInterval(() => {
       if (pausedRef.current || doneRef.current) return;
 
       setTimeLeft(t => {
         const next = Math.max(0, t - 0.05);
 
         if (next <= 0) {
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
   }, [onComplete]);
 
   /* ── Segment timer ── */
   useEffect(() => {
     setSegmentTimeLeft(SEGMENT_DURATION);
 
     const interval = setInterval(() => {
       if (pausedRef.current || doneRef.current) return;
 
       setSegmentTimeLeft(t => {
         if (t <= 0.1) {
           const nextIdx = segIdxRef.current + 1;
 
           if (nextIdx < SEGMENT_ORDER.length && !doneRef.current) {
             const nextCenter = 35 + Math.random() * 30;
 
             setTransMsg(pickRandom(TRANSITION_WORDS));
             setChaosText(pickRandom(CHAOS_TEXTS));
             setTransitioning(true);
             setShowSiren(true);
 
             perfectSfx.current.currentTime = 0;
             playSfx(perfectSfx.current);
 
             setTimeout(() => setShowSiren(false), 550);
 
             setTimeout(() => {
               if (!mountedRef.current || doneRef.current) return;
 
               setSegmentIdx(nextIdx);
               segIdxRef.current = nextIdx;
               setMiniKey(k => k + 1);
 
               setDodgeItems([]);
               setDefHazards([]);
               setTapItems([]);
               setPpeGrid(makePPEGrid());
               setClawGrid(makeClawGrid());
 
               setClawState('swinging');
               clawStateRef.current = 'swinging';
               setClawY(0);
               setClawX(50);
               clawXRef.current = 50;
 
               setZoneCenter(nextCenter);
               zoneCenterRef.current = nextCenter;
               setZoneWidth(w => Math.max(TIMING_MIN_ZONE_WIDTH, w - 6));
 
               setPlayerLane(1);
               playerLaneRef.current = 1;
               dodgeSurvivalRef.current = 0;
 
               setTransitioning(false);
               setTransMsg('');
               setChaosText('');
             }, 650);
           }
 
           return SEGMENT_DURATION;
         }
 
         return t - 0.1;
       });
     }, 100);
 
     return () => clearInterval(interval);
   }, []);
 
   /* ── Claw animation ── */
   useEffect(() => {
     clawLastTickRef.current = Date.now();
     const period = Math.max(1200, 2200 / speedMultiplier);
 
     const animate = () => {
       if (clawStateRef.current === 'swinging' && !pausedRef.current && !doneRef.current) {
         const now = Date.now();
         const dt = now - clawLastTickRef.current;
         clawLastTickRef.current = now;
         const speed = (100 / (period / 2)) * dt;
 
         let nx = clawXRef.current + clawDirRef.current * speed;
 
         if (nx >= 90) {
           nx = 90;
           clawDirRef.current = -1;
         }
 
         if (nx <= 10) {
           nx = 10;
           clawDirRef.current = 1;
         }
 
         clawXRef.current = nx;
         setClawX(nx);
       } else {
         clawLastTickRef.current = Date.now();
       }
 
       clawRafRef.current = requestAnimationFrame(animate);
     };
 
     clawRafRef.current = requestAnimationFrame(animate);
 
     return () => cancelAnimationFrame(clawRafRef.current);
   }, [speedMultiplier]);
 
   /* ── Timing animation ── */
   useEffect(() => {
     const period = Math.max(850, 2000 / speedMultiplier);
     timingLastTickRef.current = Date.now();
 
     const animate = () => {
       if (!pausedRef.current && !doneRef.current) {
         const now = Date.now();
         const dt = now - timingLastTickRef.current;
         timingLastTickRef.current = now;
         const spd = (100 / (period / 2)) * dt;
 
         let n = needleRef.current + needleDirRef.current * spd;
 
         if (n >= 100) {
           n = 100;
           needleDirRef.current = -1;
         }
 
         if (n <= 0) {
           n = 0;
           needleDirRef.current = 1;
         }
 
         needleRef.current = n;
         setNeedlePos(n);
       } else {
         timingLastTickRef.current = Date.now();
       }
 
       timingRafRef.current = requestAnimationFrame(animate);
     };
 
     timingRafRef.current = requestAnimationFrame(animate);
 
     return () => cancelAnimationFrame(timingRafRef.current);
   }, [speedMultiplier]);
 
   /* ── Hazard tap spawner ── */
   useEffect(() => {
     if (currentSegment !== 'hazard') return;
 
     let uid = 20000;
 
     const spawnOne = () => {
       if (pausedRef.current || doneRef.current) return;
 
       const src = pickRandom(hazardItems);
 
       setTapItems(prev => [
         ...prev.slice(-12),
         {
           uid: uid++,
           emoji: src.emoji,
           label: src.label,
           isHazard: src.isHazard,
           x: 12 + Math.random() * 76,
           y: 20 + Math.random() * 58,
         },
       ]);
     };
 
     spawnOne();
 
     const interval = setInterval(spawnOne, Math.max(520, 950 / speedMultiplier));
 
     return () => clearInterval(interval);
   }, [currentSegment, miniKey, speedMultiplier]);
 
   /* ── Defense spawner ── */
   useEffect(() => {
     if (currentSegment !== 'defense') return;
 
     const spawnInterval = setInterval(() => {
       if (pausedRef.current || doneRef.current) return;
 
       setDefHazards(prev => {
         if (prev.filter(h => !h.dead).length > 8) return prev;
         return [...prev, spawnDefHazard(speedMultiplier)];
       });
     }, Math.max(650, 1250 / speedMultiplier));
 
     return () => clearInterval(spawnInterval);
   }, [currentSegment, miniKey, speedMultiplier]);
 
   /* ── Defense physics ── */
   useEffect(() => {
     if (currentSegment !== 'defense') return;
 
     const tick = setInterval(() => {
       if (pausedRef.current || doneRef.current) return;
 
       setDefHazards(prev => {
         let dmg = 0;
 
         const updated = prev.map(h => {
           if (h.dead) return h;
 
           const nx = h.x + h.vx;
           const ny = h.y + h.vy;
           const dist = Math.sqrt((nx - 50) ** 2 + (ny - 48) ** 2);
 
           if (dist < 12) {
             dmg++;
             return { ...h, dead: true };
           }
 
           return { ...h, x: nx, y: ny };
         });
 
         if (dmg > 0) {
           award(STAGE8_WRONG_SCORE * dmg, 50, 48, `-${Math.abs(STAGE8_WRONG_SCORE * dmg)}`);
         }
 
         return updated.filter(h => !h.dead);
       });
     }, 40);
 
     return () => clearInterval(tick);
   }, [currentSegment, miniKey, award]);
 
   /* ── Dodge spawner ── */
   useEffect(() => {
     if (currentSegment !== 'dodge') return;
 
     const interval = setInterval(() => {
       if (pausedRef.current || doneRef.current) return;
 
       const src = pickRandom(DODGE_ITEMS);
       const lane = Math.floor(Math.random() * 3) as Lane;
 
       setDodgeItems(prev => [
         ...prev.slice(-12),
         {
           id: dodgeId++,
           lane,
           emoji: src.emoji,
           isPickup: src.isPickup,
           y: -10,
           dead: false,
         },
       ]);
     }, Math.max(520, 900 / speedMultiplier));
 
     return () => clearInterval(interval);
   }, [currentSegment, miniKey, speedMultiplier]);
 
   /* ── Dodge physics ── */
   useEffect(() => {
     if (currentSegment !== 'dodge') return;
 
     const tick = setInterval(() => {
       if (pausedRef.current || doneRef.current) return;
 
       setDodgeItems(prev => {
         const pLane = playerLaneRef.current;
         let delta = 0;
 
         const updated = prev.map(item => {
           if (item.dead) return item;
 
           const ny = item.y + (7 + speedMultiplier * 2) * 0.28;
 
           if (ny > 115) return { ...item, dead: true };
 
           if (item.lane === pLane && item.y < 78 && ny >= 70) {
             delta += item.isPickup ? STAGE8_CORRECT_SCORE : STAGE8_WRONG_SCORE;
             return { ...item, dead: true };
           }
 
           return { ...item, y: ny };
         });
 
         if (delta !== 0) {
           award(
             delta,
             [25, 50, 75][pLane],
             65,
             delta > 0 ? `+${delta}` : `${delta}`
           );
         }
 
         return updated.filter(i => !i.dead);
       });
     }, 40);
 
     return () => clearInterval(tick);
   }, [currentSegment, miniKey, speedMultiplier, award]);
 
   /* ── Dodge survival score ── */
   useEffect(() => {
     if (currentSegment !== 'dodge') return;
 
     const interval = setInterval(() => {
       if (pausedRef.current || doneRef.current) return;
 
       dodgeSurvivalRef.current++;
       award(DODGE_SURVIVE_SCORE, 50, 25, `+${DODGE_SURVIVE_SCORE}`);
     }, 1000);
 
     return () => clearInterval(interval);
   }, [currentSegment, miniKey, award]);
 
   const getPos = useCallback((e: React.TouchEvent | React.MouseEvent | React.PointerEvent) => {
     const rect = fieldRef.current?.getBoundingClientRect() ?? document.body.getBoundingClientRect();
 
     let cx = 0;
     let cy = 0;
 
     if ('touches' in e && e.touches[0]) {
       cx = e.touches[0].clientX;
       cy = e.touches[0].clientY;
     } else {
       cx = (e as React.MouseEvent).clientX;
       cy = (e as React.MouseEvent).clientY;
     }
 
     return {
       xPct: ((cx - rect.left) / rect.width) * 100,
       yPct: ((cy - rect.top) / rect.height) * 100,
     };
   }, []);
 
   /* ── Swipe controls ── */
   const finishSwipe = useCallback(() => {
    if (pausedRef.current || doneRef.current) return;
  
    setSwipeIsDragging(false);
    setSwipeHint(null);
  
    const dx = swipeDragRef.current;
    const power = Math.abs(dx);
  
    if (power < SWIPE_THRESHOLD) {
      if (power >= SWIPE_NEAR_MISS_THRESHOLD) {
        setSwipeNearMissShake(true);
        showPopup('เกือบแล้ว!', '#fb923c', 50, 60);
  
        setTimeout(() => {
          setSwipeNearMissShake(false);
          swipeDragRef.current = 0;
          setSwipeDragX(0);
        }, 250);
  
        return;
      }
  
      swipeDragRef.current = 0;
      setSwipeDragX(0);
      return;
    }
  
    const card = swipeDeck.current[swipeIdx.current % swipeDeck.current.length];
    const correct = dx > 0 ? card.isSafe : !card.isSafe;
    const isPerfect = power >= SWIPE_PERFECT_THRESHOLD;
  
    award(
      correct ? STAGE8_CORRECT_SCORE : STAGE8_WRONG_SCORE,
      correct ? 50 : dx > 0 ? 75 : 25,
      correct ? 55 : 60,
      correct && isPerfect ? `PERFECT +${STAGE8_CORRECT_SCORE}` : undefined
    );
  
    setSwipeCardAnim(dx > 0 ? 'out-right' : 'out-left');
  
    setTimeout(() => {
      swipeIdx.current++;
      swipeDragRef.current = 0;
      setSwipeDragX(0);
      setSwipeCardAnim('in');
      setMiniKey(k => k + 1);
    }, 180);
  }, [award, showPopup]);
  
  const onSwipeTouchStart = useCallback((e: React.TouchEvent) => {
    if (pausedRef.current || doneRef.current) return;
  
    swipeStartX.current = e.touches[0].clientX;
    setSwipeIsDragging(true);
  }, []);
  
  const onSwipeTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeIsDragging || pausedRef.current || doneRef.current) return;
  
    const dx = e.touches[0].clientX - swipeStartX.current;
    swipeDragRef.current = dx;
    setSwipeDragX(dx);
    setSwipeHint(dx > 30 ? 'right' : dx < -30 ? 'left' : null);
  }, [swipeIsDragging]);
  
  const onSwipeMouseDown = useCallback((e: React.MouseEvent) => {
    if (pausedRef.current || doneRef.current) return;
  
    swipeStartX.current = e.clientX;
    setSwipeIsDragging(true);
  }, []);
  
  const onSwipeMouseMove = useCallback((e: React.MouseEvent) => {
    if (!swipeIsDragging || pausedRef.current || doneRef.current) return;
  
    const dx = e.clientX - swipeStartX.current;
    swipeDragRef.current = dx;
    setSwipeDragX(dx);
    setSwipeHint(dx > 30 ? 'right' : dx < -30 ? 'left' : null);
  }, [swipeIsDragging]);
  
  const handleSwipeBtn = useCallback((toRight: boolean) => {
    if (pausedRef.current || doneRef.current) return;
  
    const card = swipeDeck.current[swipeIdx.current % swipeDeck.current.length];
    const correct = toRight ? card.isSafe : !card.isSafe;
  
    award(correct ? STAGE8_CORRECT_SCORE : STAGE8_WRONG_SCORE, toRight ? 75 : 25, 60);
  
    swipeIdx.current++;
    swipeDragRef.current = 0;
    setSwipeDragX(0);
    setSwipeHint(null);
    setMiniKey(k => k + 1);
  }, [award]);
 
   /* ── PPE ── */
   const handlePPETap = useCallback((item: GridItem, e: React.TouchEvent | React.MouseEvent) => {
     if (item.tapped || pausedRef.current || doneRef.current) return;
 
     const { xPct, yPct } = getPos(e);
 
     award(item.isCorrect ? STAGE8_CORRECT_SCORE : STAGE8_WRONG_SCORE, xPct, yPct);
 
     setPpeGrid(g => {
       const updated = g.map(gi =>
         gi.uid === item.uid
           ? { ...gi, tapped: true }
           : gi
       );
 
       if (updated.filter(i => i.isCorrect).every(i => i.tapped)) {
         setTimeout(() => {
           if (!doneRef.current) setPpeGrid(makePPEGrid());
         }, 260);
       }
 
       return updated;
     });
   }, [award, getPos]);
 
   /* ── Hazard tap ── */
   const handleHazardTap = useCallback((item: HazardTapItem, e: React.TouchEvent | React.MouseEvent) => {
     e.stopPropagation();
 
     if (pausedRef.current || doneRef.current) return;
 
     const { xPct, yPct } = getPos(e);
 
     award(item.isHazard ? STAGE8_CORRECT_SCORE : STAGE8_WRONG_SCORE, xPct, yPct);
 
     setTapItems(prev => prev.filter(i => i.uid !== item.uid));
   }, [award, getPos]);
 
   /* ── Claw ── */
   const riseClawEmpty = useCallback((dropX: number) => {
     if (!mountedRef.current) return;
 
     setClawState('rising');
     clawStateRef.current = 'rising';
 
     let y = 75;
 
     const rise = setInterval(() => {
       if (!mountedRef.current) {
         clearInterval(rise);
         return;
       }
 
       y -= 12;
       setClawY(Math.max(0, y));
 
       if (y <= 0) {
         clearInterval(rise);
         setClawY(0);
         clawXRef.current = dropX;
         setClawState('swinging');
         clawStateRef.current = 'swinging';
       }
     }, 28);
   }, []);
 
   const handleClawTap = useCallback(() => {
     if (clawStateRef.current !== 'swinging' || pausedRef.current || doneRef.current) return;
 
     const dropX = clawXRef.current;
 
     shotSfx.current.currentTime = 0;
     playSfx(shotSfx.current);
 
     setClawState('dropping');
     clawStateRef.current = 'dropping';
 
     let y = 0;
 
     const drop = setInterval(() => {
       y += 12;
       setClawY(y);
 
       if (y >= 75) {
         clearInterval(drop);
 
         if (!mountedRef.current || doneRef.current) return;
 
         const col = Math.round(((dropX - 10) / 80) * 3);
         const c = Math.max(0, Math.min(3, col));
 
         setClawGrid(prev => {
           const target = prev.find(i => i.col === c);
 
           if (!target) {
             setTimeout(() => riseClawEmpty(dropX), 180);
             return prev;
           }
 
           award(target.isCorrect ? STAGE8_CORRECT_SCORE : STAGE8_WRONG_SCORE, dropX, 60);
 
           const newGrid = prev.filter(i => i.id !== target.id);
 
           setTimeout(() => {
             riseClawEmpty(dropX);
             if (newGrid.length < 2) setClawGrid(makeClawGrid());
           }, 300);
 
           return newGrid;
         });
       }
     }, 28);
   }, [award, riseClawEmpty]);
 
   /* ── Timing ── */
   const handleTimingTap = useCallback(() => {
     if (pausedRef.current || doneRef.current) return;
 
     const pos = needleRef.current;
     const zc = zoneCenterRef.current;
     const zw = zoneWidthRef.current;
     const inZone = pos >= zc - zw / 2 && pos <= zc + zw / 2;
 
     award(inZone ? STAGE8_CORRECT_SCORE : STAGE8_WRONG_SCORE, 50, 60);
   }, [award]);
 
   /* ── Dodge controls ── */
   const moveDodgeLeft = useCallback(() => {
     if (pausedRef.current || doneRef.current) return;
 
     setPlayerLane(l => {
       const n = Math.max(0, l - 1) as Lane;
       playerLaneRef.current = n;
       return n;
     });
   }, []);
 
   const moveDodgeRight = useCallback(() => {
     if (pausedRef.current || doneRef.current) return;
 
     setPlayerLane(l => {
       const n = Math.min(2, l + 1) as Lane;
       playerLaneRef.current = n;
       return n;
     });
   }, []);
 
   const handleDodgePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
     dodgePointerDownRef.current = true;
     dodgeSwipedRef.current = false;
     dodgeStartXRef.current = e.clientX;
   }, []);
 
   const handleDodgePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
     if (!dodgePointerDownRef.current || dodgeSwipedRef.current) return;
 
     const deltaX = e.clientX - dodgeStartXRef.current;
 
     if (Math.abs(deltaX) < DODGE_SWIPE_THRESHOLD) return;
 
     dodgeSwipedRef.current = true;
 
     if (deltaX > 0) moveDodgeRight();
     else moveDodgeLeft();
   }, [moveDodgeLeft, moveDodgeRight]);
 
   const handleDodgePointerUp = useCallback(() => {
     dodgePointerDownRef.current = false;
     dodgeSwipedRef.current = false;
   }, []);
 
   return (
     <div
       ref={fieldRef}
       className={`flex flex-col h-full overflow-hidden select-none relative ${shaking ? 'screen-shake' : ''}`}
       style={{ background: 'linear-gradient(160deg, #1a0028 0%, #2d0a0a 60%, #0a1a2d 100%)' }}
     >
       {feedback === 'correct' && <div className="absolute inset-0 z-30 pointer-events-none correct-overlay" />}
       {feedback === 'wrong' && <div className="absolute inset-0 z-30 pointer-events-none wrong-overlay" />}
       {feedback === 'clear' && <div className="absolute inset-0 z-30 pointer-events-none perfect-overlay" />}
       {showSiren && <div className="absolute inset-0 z-30 pointer-events-none" style={{ background: 'rgba(239,68,68,0.35)' }} />}
 
       {PauseOverlay}
       <ScorePopupLayer popups={popups} />
 
       {transitioning && (
         <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center gap-3">
           <div
             className="font-game text-yellow-300 font-bold bounce-in text-center"
             style={{ fontSize: 'clamp(2rem,10vw,3rem)' }}
           >
             {transMsg}
           </div>
 
           <div
             className="font-game text-white/70 bounce-in text-center px-4"
             style={{ fontSize: 'clamp(0.9rem,4vw,1.1rem)', animationDelay: '0.1s' }}
           >
             {chaosText}
           </div>
 
           {!doneRef.current && (
             <div
               className="font-game text-red-400 bounce-in text-sm"
               style={{ animationDelay: '0.2s' }}
             >
               {SEGMENT_EMOJIS[SEGMENT_ORDER[Math.min(segmentIdx + 1, SEGMENT_ORDER.length - 1)]]}{' '}
               {SEGMENT_NAMES[SEGMENT_ORDER[Math.min(segmentIdx + 1, SEGMENT_ORDER.length - 1)]]}
             </div>
           )}
         </div>
       )}
 
       <div className="flex-shrink-0 px-4 pt-4 pb-1 relative z-20">
         <div className="flex items-center justify-between mb-2">
           <div>
             <div className="font-game text-white/50 text-xs">ด่าน 8</div>
             <div className="font-game text-yellow-300 text-lg font-bold">
               ⚡ Final Chaos
             </div>
           </div>
 
           <div className="text-center">
             <div className="font-game text-white/70 text-xs">
               {SEGMENT_EMOJIS[currentSegment]} {SEGMENT_NAMES[currentSegment]}
             </div>
 
             <div
               className="w-24 rounded-full overflow-hidden mt-0.5"
               style={{ height: '5px', background: 'rgba(255,255,255,0.15)' }}
             >
               <div
                 className="h-full rounded-full"
                 style={{
                   width: `${segProgress}%`,
                   background: '#f59e0b',
                   transition: 'width 0.1s linear',
                 }}
               />
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
               <div className="font-game text-white/40 text-xs">/ {STAGE8_CLEAR_SCORE}</div>
             </div>
           </div>
         </div>
 
         <TimerBar timeLeft={timeLeft} totalTime={TOTAL_DURATION} />
 
         <div className="mt-2 flex justify-center">
           <div
             className="rounded-xl px-3 py-1.5"
             style={{
               background:
                 score >= STAGE8_CLEAR_SCORE
                   ? 'rgba(250,204,21,0.22)'
                   : 'rgba(255,255,255,0.08)',
               border:
                 score >= STAGE8_CLEAR_SCORE
                   ? '1px solid rgba(250,204,21,0.5)'
                   : '1px solid rgba(255,255,255,0.08)',
             }}
           >
             <span
               className="font-game font-bold"
               style={{
                 color: score >= STAGE8_CLEAR_SCORE ? '#fde047' : 'rgba(255,255,255,0.9)',
                 fontSize: 'clamp(0.78rem,3.4vw,0.92rem)',
                 textShadow: '0 2px 0 rgba(0,0,0,0.45)',
               }}
             >
               {score >= STAGE8_CLEAR_SCORE
                 ? '🚨 ผ่านแล้ว!'
                 : `🎯 อีก ${scoreLeft} คะแนนจะชนะ!`}
             </span>
           </div>
         </div>
       </div>
 
       <div className="flex-1 flex flex-col overflow-hidden relative z-10">
       {currentSegment === 'swipe' && !transitioning && (
  <div className="flex-1 flex flex-col">
    <div className="flex-shrink-0 px-4 py-2 flex gap-3 justify-center">
      <div className="flex items-center gap-1 bg-red-500/20 rounded-xl px-3 py-2">
        <span className="text-lg">←</span>
        <span className="font-game text-red-300 text-sm font-bold">ไม่ปลอดภัย</span>
      </div>

      <div className="flex items-center gap-1 bg-green-500/20 rounded-xl px-3 py-2">
        <span className="font-game text-green-300 text-sm font-bold">ปลอดภัย</span>
        <span className="text-lg">→</span>
      </div>
    </div>

    <div key={`sw-${miniKey}`} className="flex-1 flex items-center justify-center px-6 relative">
      <div
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 transition-opacity duration-150"
        style={{ opacity: swipeHint === 'left' ? 1 : 0 }}
      >
        <div className="bg-red-500 rounded-2xl px-3 py-3 flex flex-col items-center gap-1 shadow-lg">
          <span className="text-2xl">⚠️</span>
          <span className="font-game text-white text-sm font-bold">ไม่ปลอดภัย</span>
        </div>
      </div>

      <div
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 transition-opacity duration-150"
        style={{ opacity: swipeHint === 'right' ? 1 : 0 }}
      >
        <div className="bg-green-500 rounded-2xl px-3 py-3 flex flex-col items-center gap-1 shadow-lg">
          <span className="text-2xl">✅</span>
          <span className="font-game text-white text-sm font-bold">ปลอดภัย</span>
        </div>
      </div>

      {swipeIsDragging && Math.abs(swipeDragX) >= SWIPE_PERFECT_THRESHOLD && (
        <div className="absolute top-8 z-20 font-game text-yellow-300 font-bold text-lg animate-pulse">
          PERFECT!
        </div>
      )}

      <div
        className={`
        swipe-card w-full max-w-xs rounded-3xl p-7 flex flex-col items-center gap-5 cursor-grab
        ${swipeAnimClass}
        ${swipeNearMissShake ? 'near-miss-shake' : ''}
      `}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))',
          border:
            Math.abs(swipeDragX) >= SWIPE_PERFECT_THRESHOLD
              ? '2px solid rgba(250,204,21,0.9)'
              : swipeHint === 'right'
                ? '2px solid rgba(34,197,94,0.75)'
                : swipeHint === 'left'
                  ? '2px solid rgba(239,68,68,0.75)'
                  : '2px solid rgba(255,255,255,0.15)',
          boxShadow:
            Math.abs(swipeDragX) >= SWIPE_PERFECT_THRESHOLD
              ? '0 0 44px rgba(250,204,21,0.8)'
              : swipeHint === 'right'
                ? '0 8px 32px rgba(34,197,94,0.45)'
                : swipeHint === 'left'
                  ? '0 8px 32px rgba(239,68,68,0.45)'
                  : '0 8px 32px rgba(0,0,0,0.5)',
          transform: swipeIsDragging
            ? `translateX(${swipeDragX}px) rotate(${swipeDragX * 0.07}deg) scale(${1 + Math.min(Math.abs(swipeDragX) / SWIPE_PERFECT_THRESHOLD, 1) * 0.04})`
            : undefined,
          transition: swipeIsDragging
            ? 'none'
            : 'transform 180ms cubic-bezier(.2,1.4,.4,1)',
          touchAction: 'none',
        }}
        onTouchStart={onSwipeTouchStart}
        onTouchMove={onSwipeTouchMove}
        onTouchEnd={finishSwipe}
        onMouseDown={onSwipeMouseDown}
        onMouseMove={onSwipeMouseMove}
        onMouseUp={finishSwipe}
        onMouseLeave={() => {
          if (swipeIsDragging) finishSwipe();
        }}
      >
        <div
          className="text-7xl"
          style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }}
        >
          {swipeCard.emoji}
        </div>

        <div
          className="font-game text-white text-center font-bold leading-snug"
          style={{
            fontSize: 'clamp(1.1rem, 4.5vw, 1.4rem)',
            textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
          }}
        >
          {swipeCard.label}
        </div>

        <div className="font-game text-white/30 text-xs">
          ลากซ้าย/ขวา หรือกดปุ่มเพื่อตอบ
        </div>
      </div>
    </div>

    <div className="flex-shrink-0 px-4 pb-6 flex gap-3">
      <button
        onTouchEnd={() => handleSwipeBtn(false)}
        onClick={() => handleSwipeBtn(false)}
        className="flex-1 py-5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        style={{
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          boxShadow: '0 5px 0 #7f1d1d',
        }}
      >
        <span className="text-xl">←</span>
        <span className="font-game text-white text-lg font-bold">ไม่ปลอดภัย</span>
      </button>

      <button
        onTouchEnd={() => handleSwipeBtn(true)}
        onClick={() => handleSwipeBtn(true)}
        className="flex-1 py-5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        style={{
          background: 'linear-gradient(135deg, #16a34a, #15803d)',
          boxShadow: '0 5px 0 #14532d',
        }}
      >
        <span className="font-game text-white text-lg font-bold">ปลอดภัย</span>
        <span className="text-xl">→</span>
      </button>
    </div>
  </div>
)}
 
         {currentSegment === 'ppe' && !transitioning && (
           <div className="flex-1 flex flex-col">
             <div className="flex-shrink-0 text-center py-1">
               <span className="font-game text-yellow-300 font-bold text-sm">
                 ⛑️ แตะ PPE เท่านั้น!
               </span>
             </div>
 
             <div className="flex-1 flex items-center justify-center px-4">
               <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                 {ppeGrid.map(item => (
                   <button
                     key={item.uid}
                     onTouchEnd={e => handlePPETap(item, e)}
                     onClick={e => handlePPETap(item, e)}
                     className="aspect-square rounded-2xl flex flex-col items-center justify-center active:scale-90 transition-transform"
                     style={{
                       background: item.tapped
                         ? 'rgba(255,255,255,0.04)'
                         : item.isCorrect
                           ? 'rgba(34,197,94,0.1)'
                           : 'rgba(255,255,255,0.1)',
                       border: item.tapped
                         ? '2px solid rgba(255,255,255,0.06)'
                         : item.isCorrect
                           ? '2px solid rgba(34,197,94,0.22)'
                           : '2px solid rgba(255,255,255,0.14)',
                       opacity: item.tapped ? 0.25 : 1,
                     }}
                   >
                     <span style={{ fontSize: '2.9rem', lineHeight: 1 }}>
                       {item.emoji}
                     </span>
 
                     <span
                       className="font-game text-center whitespace-nowrap"
                       style={{
                         fontSize: '0.78rem',
                         color: '#fff',
                         background: 'rgba(0,0,0,0.65)',
                         padding: '3px 7px',
                         borderRadius: '999px',
                         marginTop: '4px',
                       }}
                     >
                       {item.label}
                     </span>
                   </button>
                 ))}
               </div>
             </div>
           </div>
         )}
 
         {currentSegment === 'hazard' && !transitioning && (
           <div
             className="flex-1 relative overflow-hidden mx-2 rounded-2xl"
             style={{ background: 'rgba(0,0,0,0.3)' }}
           >
             <div className="absolute inset-x-0 top-2 text-center pointer-events-none z-20">
               <span className="font-game text-red-300 font-bold text-sm">
                 🔥 แตะอันตรายเท่านั้น!
               </span>
             </div>
 
             {tapItems.map(item => (
               <button
                 key={item.uid}
                 onTouchStart={e => handleHazardTap(item, e)}
                 onClick={e => handleHazardTap(item, e)}
                 className="absolute flex flex-col items-center active:scale-75 hazard-item"
                 style={{
                   left: `${item.x}%`,
                   top: `${item.y}%`,
                   transform: 'translate(-50%,-50%)',
                   zIndex: 10,
                   touchAction: 'none',
                 }}
               >
                 <div
                   className="rounded-full flex flex-col items-center justify-center"
                   style={{
                     width: item.isHazard ? '112px' : '104px',
                     height: item.isHazard ? '112px' : '104px',
                     background: item.isHazard
                       ? 'radial-gradient(circle, rgba(239,68,68,0.33), rgba(239,68,68,0.05))'
                       : 'radial-gradient(circle, rgba(34,197,94,0.28), rgba(34,197,94,0.05))',
                     border: item.isHazard
                       ? '2.5px solid rgba(239,68,68,0.58)'
                       : '2.5px solid rgba(34,197,94,0.48)',
                   }}
                 >
                   <span style={{ fontSize: '3rem', lineHeight: 1 }}>
                     {item.emoji}
                   </span>
                 </div>
 
                 <span
                   className="font-game text-center whitespace-nowrap"
                   style={{
                     fontSize: '0.95rem',
                     color: '#ffffff',
                     background: 'rgba(0,0,0,0.72)',
                     padding: '5px 10px',
                     borderRadius: '999px',
                     marginTop: '5px',
                     fontWeight: 700,
                   }}
                 >
                   {item.label}
                 </span>
               </button>
             ))}
           </div>
         )}
 
         {currentSegment === 'claw' && !transitioning && (
           <div className="flex-1 flex flex-col">
             <div className="flex-shrink-0 text-center py-1">
               <span className="font-game text-yellow-300 font-bold text-xs">
                 🪝 แตะเพื่อจับ PPE!
               </span>
             </div>
 
             <div
               className="flex-1 relative mx-2 rounded-2xl overflow-hidden"
               style={{
                 background: 'linear-gradient(180deg,#1a1a3e,#0d1530)',
                 border: '2px solid rgba(99,102,241,0.3)',
               }}
             >
               <div
                 className="absolute flex flex-col items-center pointer-events-none"
                 style={{
                   left: `${clawX}%`,
                   top: `${8 + clawY * 0.5}%`,
                   transform: 'translateX(-50%)',
                   zIndex: 20,
                 }}
               >
                 <div style={{ width: '4px', height: `${18 + clawY * 0.45}px`, background: 'rgba(229,231,235,0.8)' }} />
                 <div style={{ fontSize: '2.3rem', filter: 'drop-shadow(0 4px 5px rgba(0,0,0,0.55))' }}>
                   🪝
                 </div>
               </div>
 
               <div
                 className="absolute bottom-4 left-0 right-0 grid px-2"
                 style={{
                   display: 'grid',
                   gridTemplateColumns: 'repeat(4,1fr)',
                   gridTemplateRows: 'repeat(2,1fr)',
                   gap: '8px',
                 }}
               >
                 {Array.from({ length: 2 }, (_, r) =>
                   Array.from({ length: 4 }, (_, c) => {
                     const item = clawGrid.find(i => i.col === c && i.row === r);
 
                     return (
                       <div
                         key={`${r}-${c}`}
                         className="flex items-center justify-center"
                         style={{ minHeight: '76px' }}
                       >
                         {item && (
                           <div
                             className="rounded-full flex flex-col items-center justify-center"
                             style={{
                               width: '74px',
                               height: '74px',
                               background: item.isCorrect
                                 ? 'radial-gradient(circle, rgba(34,197,94,0.26), rgba(34,197,94,0.05))'
                                 : 'radial-gradient(circle, rgba(239,68,68,0.2), rgba(239,68,68,0.04))',
                               border: item.isCorrect
                                 ? '2.5px solid rgba(34,197,94,0.48)'
                                 : '2.5px solid rgba(239,68,68,0.36)',
                             }}
                           >
                             <span style={{ fontSize: '2.65rem', lineHeight: 1 }}>
                               {item.emoji}
                             </span>
 
                             <span
                               className="font-game text-center whitespace-nowrap"
                               style={{
                                 fontSize: '0.7rem',
                                 color: '#fff',
                                 background: 'rgba(0,0,0,0.65)',
                                 padding: '2px 6px',
                                 borderRadius: '999px',
                                 marginTop: '2px',
                               }}
                             >
                               {item.label}
                             </span>
                           </div>
                         )}
                       </div>
                     );
                   })
                 )}
               </div>
             </div>
 
             <div className="flex-shrink-0 px-4 py-3">
               <button
                 onTouchStart={handleClawTap}
                 onClick={handleClawTap}
                 className="w-full py-4 rounded-2xl font-game font-bold text-white active:scale-95"
                 style={{
                   background: clawState === 'swinging'
                     ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
                     : 'linear-gradient(135deg,#374151,#1f2937)',
                   fontSize: 'clamp(1.1rem,5vw,1.4rem)',
                   boxShadow: '0 5px 0 #7f1d1d',
                 }}
               >
                 🪝 {clawState === 'swinging' ? 'ยิงตะขอ!' : 'กำลังจับ...'}
               </button>
             </div>
           </div>
         )}
 
         {currentSegment === 'defense' && !transitioning && (
           <div
             className="flex-1 relative overflow-hidden mx-2 rounded-2xl"
             style={{ background: 'rgba(0,0,0,0.3)' }}
           >
             <div className="absolute inset-x-0 top-2 text-center pointer-events-none z-10">
               <span className="font-game text-red-400 font-bold text-sm">
                 🛡️ ปกป้อง Safety Core!
               </span>
             </div>
 
             <div
               className="absolute"
               style={{ left: '50%', top: '48%', transform: 'translate(-50%,-50%)', zIndex: 10 }}
             >
               <div
                 className="rounded-full flex flex-col items-center justify-center"
                 style={{
                   width: '86px',
                   height: '86px',
                   background: 'radial-gradient(circle,rgba(34,197,94,0.3),rgba(34,197,94,0.1))',
                   border: '3px solid rgba(34,197,94,0.7)',
                   boxShadow: '0 0 24px rgba(34,197,94,0.45)',
                 }}
               >
                 <span style={{ fontSize: '2.4rem' }}>🛡️</span>
               </div>
             </div>
 
             {defHazards.filter(h => !h.dead).map(h => (
               <button
                 key={h.id}
                 onPointerDown={e => {
                   e.stopPropagation();
 
                   if (pausedRef.current || doneRef.current) return;
 
                   award(STAGE8_CORRECT_SCORE, h.x, h.y);
 
                   setDefHazards(p =>
                     p.map(i =>
                       i.id === h.id
                         ? { ...i, dead: true }
                         : i
                     )
                   );
                 }}
                 className="absolute flex items-center justify-center active:scale-75"
                 style={{
                   left: `${h.x}%`,
                   top: `${h.y}%`,
                   transform: 'translate(-50%,-50%)',
                   touchAction: 'none',
                   zIndex: 15,
                   padding: '10px',
                 }}
               >
                 <div
                   className="rounded-full flex items-center justify-center"
                   style={{
                     width: '86px',
                     height: '86px',
                     background: 'radial-gradient(circle, rgba(239,68,68,0.32), rgba(127,29,29,0.08))',
                     border: '3px solid rgba(239,68,68,0.72)',
                     boxShadow: '0 0 20px rgba(239,68,68,0.45)',
                   }}
                 >
                   <span style={{ fontSize: '3rem' }}>{h.emoji}</span>
                 </div>
               </button>
             ))}
           </div>
         )}
 
         {currentSegment === 'timing' && !transitioning && (
           <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
             <div className="font-game text-yellow-300 font-bold text-sm">
               ⚙️ แตะในโซนเขียว!
             </div>
 
             <div
               className="relative w-full max-w-xs rounded-full overflow-hidden"
               style={{
                 height: '78px',
                 background: 'rgba(0,0,0,0.6)',
                 border: '2.5px solid rgba(255,255,255,0.15)',
                 boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
               }}
             >
               <div
                 className="absolute top-0 bottom-0 rounded-sm"
                 style={{
                   left: `${zoneCenter - zoneWidth / 2}%`,
                   width: `${zoneWidth}%`,
                   background: 'rgba(34,197,94,0.35)',
                   border: '1.5px solid rgba(34,197,94,0.7)',
                   boxShadow: '0 0 18px rgba(34,197,94,0.45)',
                   transition: 'left 0.8s ease, width 0.8s ease',
                   animation: 'pulse 1.2s infinite',
                 }}
               />
 
               <div
                 className="absolute top-1/2 font-game text-green-300 font-bold pointer-events-none"
                 style={{
                   left: `${zoneCenter}%`,
                   transform: 'translate(-50%,-50%)',
                   fontSize: '1rem',
                 }}
               >
                 ✓
               </div>
 
               <div
                 className="absolute top-0 bottom-0 w-4 rounded-full"
                 style={{
                   left: `${needlePos}%`,
                   transform: 'translateX(-50%)',
                   background: 'linear-gradient(180deg, white, rgba(255,255,255,0.7))',
                   boxShadow: '0 0 12px rgba(255,255,255,0.9)',
                   transition: 'none',
                 }}
               />
             </div>
 
             <div className="font-game text-white/35 text-[10px]">
               SAFE ZONE {Math.round(zoneWidth)}%
             </div>
 
             <button
               onTouchStart={handleTimingTap}
               onClick={handleTimingTap}
               className="w-full max-w-xs py-6 rounded-3xl font-game font-bold text-white active:scale-95"
               style={{
                 background: 'linear-gradient(135deg,#d97706,#b45309)',
                 boxShadow: '0 6px 0 #78350f',
                 fontSize: 'clamp(1.2rem,5.5vw,1.6rem)',
               }}
             >
               👆 แตะ!
             </button>
           </div>
         )}
 
         {currentSegment === 'dodge' && !transitioning && (
           <div className="flex-1 flex flex-col">
             <div className="flex-shrink-0 text-center py-1">
               <span className="font-game text-red-300 text-sm font-bold">
                 🚜 ปัด/ลากซ้ายขวา เพื่อหลบ!
               </span>
             </div>
 
             <div
               className="flex-1 relative overflow-hidden mx-2 rounded-2xl touch-none"
               onPointerDown={handleDodgePointerDown}
               onPointerMove={handleDodgePointerMove}
               onPointerUp={handleDodgePointerUp}
               onPointerCancel={handleDodgePointerUp}
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
 
               {dodgeItems.filter(i => !i.dead).map(item => (
                 <div
                   key={item.id}
                   className="absolute flex flex-col items-center pointer-events-none"
                   style={{
                     left: `${laneXPct[item.lane]}%`,
                     top: `${item.y}%`,
                     transform: 'translate(-50%,-50%)',
                     zIndex: 10,
                   }}
                 >
                   <div
                     className="rounded-2xl p-2 flex items-center justify-center"
                     style={{
                       background: item.isPickup ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.22)',
                       border: `2px solid ${item.isPickup ? 'rgba(34,197,94,0.65)' : 'rgba(239,68,68,0.65)'}`,
                       boxShadow: item.isPickup ? '0 0 14px rgba(34,197,94,0.4)' : '0 0 14px rgba(239,68,68,0.4)',
                     }}
                   >
                     <span style={{ fontSize: '3rem', lineHeight: 1 }}>
                       {item.emoji}
                     </span>
                   </div>
                 </div>
               ))}
 
               <div
                 className="absolute flex items-center justify-center"
                 style={{
                   left: `${laneXPct[playerLane]}%`,
                   top: '76%',
                   transform: 'translate(-50%,-50%)',
                   transition: 'left 0.09s cubic-bezier(0.175,0.885,0.32,1.275)',
                   zIndex: 20,
                   filter: `
                     drop-shadow(0 0 10px rgba(251,191,36,0.9))
                     drop-shadow(0 0 22px rgba(251,191,36,0.5))
                   `,
                 }}
               >
                 <span style={{ fontSize: '4.2rem', lineHeight: 1 }}>
                   🚜
                 </span>
               </div>
             </div>
 
             <div className="flex-shrink-0 flex gap-3 px-4 py-3">
               <button
                 onTouchStart={moveDodgeLeft}
                 onClick={moveDodgeLeft}
                 className="flex-1 py-5 rounded-2xl font-game font-bold text-white active:scale-95"
                 style={{
                   background: 'linear-gradient(135deg,#1d4ed8,#1e40af)',
                   boxShadow: '0 4px 0 #1e3a8a',
                   fontSize: 'clamp(1rem,4.5vw,1.2rem)',
                 }}
               >
                 ← ซ้าย
               </button>
 
               <button
                 onTouchStart={moveDodgeRight}
                 onClick={moveDodgeRight}
                 className="flex-1 py-5 rounded-2xl font-game font-bold text-white active:scale-95"
                 style={{
                   background: 'linear-gradient(135deg,#1d4ed8,#1e40af)',
                   boxShadow: '0 4px 0 #1e3a8a',
                   fontSize: 'clamp(1rem,4.5vw,1.2rem)',
                 }}
               >
                 ขวา →
               </button>
             </div>
           </div>
         )}
       </div>
     </div>
   );
 }