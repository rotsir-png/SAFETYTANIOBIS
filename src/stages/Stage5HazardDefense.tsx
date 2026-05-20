/**
 * Stage 5: Hazard is Coming — Hazard Defense
 */
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
 
 interface Hazard {
   id: number;
   emoji: string;
   label: string;
   x: number;
   y: number;
   vx: number;
   vy: number;
   dead: boolean;
   hp: number;
   maxHp: number;
 }
 
 const HAZARD_TYPES = [
   { emoji: '🔥', label: 'ไฟไหม้' },
   { emoji: '⚡', label: 'ไฟฟ้ารั่ว' },
   { emoji: '💧', label: 'น้ำหก' },
   { emoji: '📱', label: 'เล่นมือถือ' },
   { emoji: '🚧', label: 'ของกีดขวาง' },
   { emoji: '🔪', label: 'ของมีคม' },
 ];
 
 const CENTER_X = 50;
 const CENTER_Y = 50;
 const CORE_RADIUS = 11;
 const TANIOBIS_MAX_HP = 3;
 const STAGE5_KILL_SCORE = 50;
 const STAGE5_CLEAR_SCORE = 500;
 
 let hazardId = 0;
 
 function spawnHazard(speedMultiplier: number): Hazard {
   const src = HAZARD_TYPES[Math.floor(Math.random() * HAZARD_TYPES.length)];
   const edge = Math.floor(Math.random() * 4);
 
   let x = CENTER_X;
   let y = CENTER_Y;
 
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
 
   const hp = 1 + Math.floor(Math.random() * 5);
   const dx = CENTER_X - x;
   const dy = CENTER_Y - y;
   const dist = Math.sqrt(dx * dx + dy * dy);
   const baseSpeed = (0.35 - (hp - 1) * 0.05) * speedMultiplier;
   const speed = Math.max(0.08, baseSpeed);
 
   return {
     id: hazardId++,
     emoji: src.emoji,
     label: src.label,
     x,
     y,
     vx: (dx / dist) * speed,
     vy: (dy / dist) * speed,
     dead: false,
     hp,
     maxHp: hp,
   };
 }
 
 export default function Stage5HazardDefense({
   onComplete,
   speedMultiplier = 1,
   onDamage,
 }: Props) {
   const [showIntro, setShowIntro] = useState(true);
   const [score, setScore] = useState(0);
   const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
   const [hazards, setHazards] = useState<Hazard[]>([]);
   const [shaking, setShaking] = useState(false);
   const [coreHit, setCoreHit] = useState(false);
   const [killFlash, setKillFlash] = useState(false);
   const [taniobisHp, setTaniobisHp] = useState(TANIOBIS_MAX_HP);
   const [gameOver, setGameOver] = useState(false);
 
   const scoreRef = useRef(0);
   const doneRef = useRef(false);
   const pausedRef = useRef(false);
   const showIntroRef = useRef(true);
   const speedRef = useRef(speedMultiplier);
   const coreDamageRef = useRef(0);
   const hazardsRef = useRef<Hazard[]>([]);
   const taniobisHpRef = useRef(TANIOBIS_MAX_HP);
 
   const { popups, showPopup } = useScorePopup();
 
   const correctSfx = useRef(new Audio('/sfx/correct.wav'));
   const wrongSfx = useRef(new Audio('/sfx/wrong.wav'));
   const perfectSfx = useRef(new Audio('/sfx/perfect.wav'));
   const shotSfx = useRef(new Audio('/sfx/shot.wav'));
 
   const { paused, togglePause, PauseOverlay } = usePause({
     onGiveUp: () => {
       if (!doneRef.current) {
         doneRef.current = true;
         onComplete(scoreRef.current);
       }
     },
   });
 
   const scoreLeft = Math.max(0, STAGE5_CLEAR_SCORE - score);
   const coreColor =
     taniobisHp >= 3 ? '#22c55e' : taniobisHp === 2 ? '#f59e0b' : '#ef4444';
 
   useEffect(() => {
     speedRef.current = speedMultiplier;
   }, [speedMultiplier]);
 
   useEffect(() => {
     pausedRef.current = paused;
   }, [paused]);
 
   useEffect(() => {
     showIntroRef.current = showIntro;
   }, [showIntro]);
 
   useEffect(() => {
     correctSfx.current.volume = 0.5;
     wrongSfx.current.volume = 0.65;
     perfectSfx.current.volume = 0.75;
     shotSfx.current.volume = 0.55;
   }, []);
 
   useEffect(() => {
     const interval = setInterval(() => {
       if (pausedRef.current || doneRef.current || showIntroRef.current) return;
 
       setTimeLeft((t) => {
         const next = Math.max(0, t - 0.05);
 
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
   }, [onComplete]);
 
   useEffect(() => {
     let elapsed = 0;
 
     const interval = setInterval(() => {
       if (pausedRef.current || doneRef.current || showIntroRef.current) return;
 
       elapsed += 100;
       const rateMs = Math.max(800, 2200 - elapsed * 2) / speedRef.current;
 
       if (Math.random() < 100 / rateMs) {
         if (hazardsRef.current.filter((h) => !h.dead).length <= 10) {
           const h = spawnHazard(speedRef.current);
           hazardsRef.current = [...hazardsRef.current, h];
           setHazards([...hazardsRef.current]);
         }
       }
     }, 100);
 
     return () => clearInterval(interval);
   }, []);
 
   useEffect(() => {
     const tick = setInterval(() => {
       if (pausedRef.current || doneRef.current || showIntroRef.current) return;
 
       hazardsRef.current = hazardsRef.current
         .map((h) => {
           if (h.dead) return h;
 
           const nx = h.x + h.vx;
           const ny = h.y + h.vy;
           const dist = Math.sqrt((nx - CENTER_X) ** 2 + (ny - CENTER_Y) ** 2);
 
           if (dist < CORE_RADIUS) {
             coreDamageRef.current++;
             return { ...h, dead: true, x: nx, y: ny };
           }
 
           return { ...h, x: nx, y: ny };
         })
         .filter((h) => !h.dead);
 
       setHazards([...hazardsRef.current]);
 
       if (coreDamageRef.current > 0) {
         wrongSfx.current.currentTime = 0;
         playSfx(wrongSfx.current);
 
         const dmg = coreDamageRef.current;
         coreDamageRef.current = 0;
 
         scoreRef.current = Math.max(0, scoreRef.current + POINTS_WRONG * dmg);
         setScore(scoreRef.current);
 
         showPopup(`-${dmg * 50}`, '#f87171', CENTER_X, CENTER_Y);
 
         setShaking(true);
         setTimeout(() => setShaking(false), 500);
 
         setCoreHit(true);
         setTimeout(() => setCoreHit(false), 400);
 
         taniobisHpRef.current = Math.max(0, taniobisHpRef.current - dmg);
         setTaniobisHp(taniobisHpRef.current);
 
         for (let i = 0; i < dmg; i++) onDamage?.();
 
         if (taniobisHpRef.current <= 0 && !doneRef.current) {
           doneRef.current = true;
           setGameOver(true);
           setTimeout(() => onComplete(scoreRef.current), 900);
         }
       }
     }, 40);
 
     return () => clearInterval(tick);
   }, [showPopup, onComplete, onDamage]);
 
   const handleHazardTap = useCallback(
     (hazard: Hazard, e: React.PointerEvent) => {
       e.preventDefault();
       e.stopPropagation();
 
       if (pausedRef.current || doneRef.current || showIntroRef.current) return;
 
       const live = hazardsRef.current.find((h) => h.id === hazard.id && !h.dead);
       if (!live) return;
 
       const newHp = live.hp - 1;
 
       if (newHp <= 0) {
         correctSfx.current.currentTime = 0;
         playSfx(correctSfx.current);
 
         hazardsRef.current = hazardsRef.current.filter((h) => h.id !== hazard.id);
         setHazards([...hazardsRef.current]);
 
         const earnedScore = live.maxHp * 10;

scoreRef.current += earnedScore;
setScore(scoreRef.current);

showPopup(`+${earnedScore}`, '#4ade80', hazard.x, hazard.y);
 
         setShaking(true);
         setTimeout(() => setShaking(false), 300);
 
         setKillFlash(true);
         setTimeout(() => setKillFlash(false), 200);
 
         if (scoreRef.current >= STAGE5_CLEAR_SCORE && !doneRef.current) {
           doneRef.current = true;
 
           perfectSfx.current.currentTime = 0;
           playSfx(perfectSfx.current);
 
           setTimeout(() => onComplete(scoreRef.current), 650);
         }
 
         return;
       }
 
       shotSfx.current.currentTime = 0;
       playSfx(shotSfx.current);
 
       hazardsRef.current = hazardsRef.current.map((h) =>
         h.id === hazard.id ? { ...h, hp: newHp } : h
       );
 
       setHazards([...hazardsRef.current]);
     },
     [showPopup, onComplete]
   );
 
   return (
     <div
       className={`flex flex-col h-full overflow-hidden select-none relative ${
         shaking ? 'screen-shake' : ''
       }`}
       style={{
         background: 'linear-gradient(160deg, #0f1520 0%, #1a1a2e 60%, #0f1520 100%)',
       }}
     >
       {coreHit && <div className="absolute inset-0 z-30 pointer-events-none wrong-overlay" />}
       {killFlash && <div className="absolute inset-0 z-30 pointer-events-none correct-overlay" />}
 
       {PauseOverlay}
 
       <div className="absolute inset-0 z-50 pointer-events-none">
         <ScorePopupLayer popups={popups} />
       </div>
 
       {showIntro && (
         <div
           onClick={() => setShowIntro(false)}
           onTouchStart={() => setShowIntro(false)}
           className="absolute inset-0 z-[999] flex flex-col items-center justify-center bg-black/90 px-6 text-center"
         >
           <div className="bounce-in" style={{ fontSize: '5rem' }}>
             🛡️
           </div>
 
           <div
             className="font-game text-yellow-300 font-bold mt-3 bounce-in"
             style={{
               fontSize: 'clamp(1.7rem,7vw,2.4rem)',
               textShadow: '0 3px 0 rgba(0,0,0,0.45)',
               lineHeight: 1,
             }}
           >
             Hazard is Coming!
           </div>
 
           <div
             className="font-game text-white/90 mt-4 leading-relaxed bounce-in"
             style={{ fontSize: 'clamp(1rem,4.5vw,1.28rem)' }}
           >
             อันตรายบุกเข้าแกน TANIOBIS
             <br />
             แตะทำลายก่อนถึงกลางจอ
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
               🔥 ทำลาย Hazard = +{STAGE5_KILL_SCORE}
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
               ตัวเลือดเยอะต้องตบหลายที
               <br />
               หลุดถึงกลาง = หักคะแนนหักหัวใจ
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
 
       {gameOver && (
         <div
           className="absolute inset-0 z-[900] flex flex-col items-center justify-center gap-4"
           style={{ background: 'rgba(0,0,0,0.88)' }}
         >
           <div
             className="font-game text-red-400 font-bold bounce-in"
             style={{ fontSize: 'clamp(2rem,9vw,2.8rem)' }}
           >
             GAME OVER
           </div>
 
           <div
             className="font-game text-white/70 bounce-in"
             style={{
               animationDelay: '0.1s',
               fontSize: 'clamp(1rem,4.5vw,1.3rem)',
             }}
           >
             TANIOBIS ถูกทำลาย!
           </div>
 
           <div
             className="font-game text-yellow-400 font-bold bounce-in"
             style={{
               animationDelay: '0.2s',
               fontSize: 'clamp(1.4rem,6vw,2rem)',
             }}
           >
             {scoreRef.current} คะแนน
           </div>
         </div>
       )}
 
       {/* Header */}
       <div className="flex-shrink-0 px-4 pt-5 pb-2 relative z-30">
         <div className="flex items-center justify-between mb-3">
           <div>
             <div className="font-game text-white/50 text-xs">ด่าน 5</div>
 
             <div
               className="font-game text-white font-bold leading-tight"
               style={{
                 fontSize: 'clamp(1.25rem,5.5vw,1.65rem)',
                 textShadow: '0 2px 0 rgba(0,0,0,0.35)',
               }}
             >
               Hazard is Coming
               <div className="text-yellow-300">ป้องกัน TANIOBIS!</div>
             </div>
 
             <div
               className="font-game text-yellow-200 mt-1 leading-snug"
               style={{ fontSize: 'clamp(0.85rem,3.7vw,1rem)' }}
             >
               แตะทำลายก่อนถึงแกนกลาง
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
                 score >= STAGE5_CLEAR_SCORE
                   ? 'rgba(250,204,21,0.22)'
                   : 'rgba(255,255,255,0.08)',
               border:
                 score >= STAGE5_CLEAR_SCORE
                   ? '1px solid rgba(250,204,21,0.5)'
                   : '1px solid rgba(255,255,255,0.08)',
             }}
           >
             <span
               className="font-game font-bold"
               style={{
                 color: score >= STAGE5_CLEAR_SCORE ? '#fde047' : 'rgba(255,255,255,0.9)',
                 fontSize: 'clamp(1rem,4.5vw,1.2rem)',
                 textShadow: '0 2px 0 rgba(0,0,0,0.45)',
               }}
             >
               {score >= STAGE5_CLEAR_SCORE
                 ? '🚨 ผ่านแล้ว!'
                 : `🎯 อีก ${scoreLeft} คะแนนจะผ่าน!`}
             </span>
           </div>
         </div>
       </div>
 
       {/* TANIOBIS HP bar */}
       <div className="flex-shrink-0 px-4 py-1 relative z-30">
         <div className="flex items-center gap-2">
           <span
             className="font-game font-bold text-sm"
             style={{ color: coreColor }}
           >
             TANIOBIS
           </span>
 
           <div className="flex gap-1">
             {Array.from({ length: TANIOBIS_MAX_HP }, (_, i) => (
               <div
                 key={i}
                 className="rounded-full transition-all duration-200"
                 style={{
                   width: '14px',
                   height: '14px',
                   background: i < taniobisHp ? coreColor : 'rgba(255,255,255,0.15)',
                   boxShadow: i < taniobisHp ? `0 0 6px ${coreColor}` : 'none',
                 }}
               />
             ))}
           </div>
 
           <div
             className="flex-1 rounded-full overflow-hidden"
             style={{ height: '6px', background: 'rgba(255,255,255,0.1)' }}
           >
             <div
               className="h-full rounded-full transition-all duration-300"
               style={{
                 width: `${(taniobisHp / TANIOBIS_MAX_HP) * 100}%`,
                 background: coreColor,
                 boxShadow: `0 0 6px ${coreColor}`,
               }}
             />
           </div>
 
           <span className="font-game text-white/50 text-xs">
             {taniobisHp}/{TANIOBIS_MAX_HP}
           </span>
         </div>
       </div>
 
       {/* Play field */}
       <div
         className="flex-1 relative overflow-hidden mx-2 mb-2 rounded-2xl"
         style={{
           background: 'rgba(15,20,35,0.8)',
           border: '1px solid rgba(255,255,255,0.08)',
         }}
       >
         {[28, 48, 68].map((r, i) => (
           <div
             key={i}
             className="absolute rounded-full pointer-events-none"
             style={{
               width: `${r}%`,
               height: `${r}%`,
               left: `${CENTER_X - r / 2}%`,
               top: `${CENTER_Y - r / 2}%`,
               border: `1px solid rgba(100,150,200,${0.1 - i * 0.025})`,
             }}
           />
         ))}
 
         <div
           className="absolute flex flex-col items-center justify-center"
           style={{
             left: `${CENTER_X}%`,
             top: `${CENTER_Y}%`,
             transform: 'translate(-50%,-50%)',
             zIndex: 10,
           }}
         >
           <div
             className="rounded-full flex flex-col items-center justify-center"
             style={{
              width: '86px',
              height: '86px',
               background: coreHit
                 ? 'radial-gradient(circle, #7f1d1d, #450a0a)'
                 : `radial-gradient(circle, ${coreColor}30, ${coreColor}10)`,
               border: `3px solid ${coreHit ? '#ef4444' : coreColor}`,
               boxShadow: `0 0 ${coreHit ? 40 : 20}px ${
                 coreHit ? '#ef444488' : coreColor + '44'
               }`,
               transition: 'all 0.2s ease',
             }}
           >
             <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>🛡️</span>
             <span
  className="font-game font-bold"
  style={{
    fontSize: 'clamp(0.72rem,2.8vw,0.9rem)',
    color: coreColor,
    letterSpacing: '0.03em',
    textShadow: '0 2px 0 rgba(0,0,0,0.75)',
  }}
>
  TANIOBIS
</span>
           </div>
         </div>
 
         {hazards
           .filter((h) => !h.dead)
           .map((h) => {
             const hpPct = h.hp / h.maxHp;
             const hColor = h.hp <= 1 ? '#ef4444' : h.hp <= 3 ? '#f59e0b' : '#ef4444';
 
             return (
               <button
                 key={h.id}
                 onPointerDown={(e) => handleHazardTap(h, e)}
                 className="absolute flex flex-col items-center active:scale-75 transition-transform"
                 style={{
                   left: `${h.x}%`,
                   top: `${h.y}%`,
                   transform: 'translate(-50%,-50%)',
                   zIndex: 15,
                   touchAction: 'none',
                   padding: '14px',
                 }}
               >
                 <div
                   className="rounded-full flex flex-col items-center justify-center relative"
                   style={{
                    width: `${54 + h.maxHp * 7}px`,
                    height: `${54 + h.maxHp * 7}px`,
                     background:
                       'radial-gradient(circle, rgba(239,68,68,0.32), rgba(127,29,29,0.08))',
                     border: '3px solid rgba(239,68,68,0.72)',
                     boxShadow: '0 0 20px rgba(239,68,68,0.45)',
                   }}
                 >
                   <span
                     style={{
                      fontSize: `${2.05 + h.maxHp * 0.12}rem`,
                       lineHeight: 1,
                       filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.45))',
                     }}
                   >
                     {h.emoji}
                   </span>
 
                   {h.maxHp > 1 && (
                     <div
                       className="absolute bottom-1 left-2 right-2 rounded-full overflow-hidden"
                       style={{
                         height: '7px',
                         background: 'rgba(0,0,0,0.45)',
                       }}
                     >
                       <div
                         className="h-full rounded-full"
                         style={{
                           width: `${hpPct * 100}%`,
                           background: hColor,
                           boxShadow: `0 0 6px ${hColor}`,
                         }}
                       />
                     </div>
                   )}
                 </div>
 
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
                   {h.label} {h.maxHp > 1 ? `(${h.hp})` : ''}
                 </span>
               </button>
             );
           })}
 
         <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none px-2">
           <span
             className="font-game text-white/45"
             style={{ fontSize: 'clamp(0.75rem,3.4vw,0.95rem)' }}
           >
             1HP = +10 · 5HP = +50 · ถึง TANIOBIS -50 / -❤️
           </span>
         </div>
       </div>
     </div>
   );
 }