/**
 * Stage 6: Machine Sync — Timing / Rhythm
 * Correct timing +50. Wrong timing -50 + heat.
 * Heat 100% = game over. Reach 500 = instant clear.
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
 
 const BAR_WIDTH = 100;
 const START_ZONE_WIDTH = 36;
const MIN_ZONE_WIDTH = 20;
 const BASE_PERIOD = 2400;
 const MIN_PERIOD = 900;
 const STAGE6_CORRECT_SCORE = 50;
 const STAGE6_CLEAR_SCORE = 500;
 
 const MACHINE_PROMPTS = [
   'ปล่อยแรงดัน!',
   'หยุดเครื่อง!',
   'ซิงก์จังหวะ!',
   'เครื่องร้อนเกิน!',
   'ระบบเริ่มพัง!',
 ];
 
 export default function Stage6MachineSync({
   onComplete,
   speedMultiplier = 1,
   onDamage,
 }: Props) {
   const [score, setScore] = useState(0);
   const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
   const [needlePos, setNeedlePos] = useState(0);
   const [hitFeedback, setHitFeedback] = useState<'perfect' | 'miss' | null>(null);
   const [shaking, setShaking] = useState(false);
   const [period, setPeriod] = useState(BASE_PERIOD / speedMultiplier);
   const [zoneCenter, setZoneCenter] = useState(50);
   const [zoneWidth, setZoneWidth] = useState(START_ZONE_WIDTH);
   const [machinePrompt, setMachinePrompt] = useState(MACHINE_PROMPTS[0]);
   const [heatLevel, setHeatLevel] = useState(20);
   const [warningLight, setWarningLight] = useState(false);
   const [gameOver, setGameOver] = useState(false);
 
   const scoreRef = useRef(0);
   const doneRef = useRef(false);
   const pausedRef = useRef(false);
   const needleRef = useRef(0);
   const dirRef = useRef<1 | -1>(1);
   const lastTickRef = useRef(Date.now());
   const rafRef = useRef<number>(0);
   const periodRef = useRef(period);
   const zoneCenterRef = useRef(50);
   const zoneWidthRef = useRef(START_ZONE_WIDTH);
   const promptIdxRef = useRef(0);
   const heatRef = useRef(20);
 
   const correctSfx = useRef(new Audio('/sfx/correct.wav'));
   const wrongSfx = useRef(new Audio('/sfx/wrong.wav'));
   const perfectSfx = useRef(new Audio('/sfx/perfect.wav'));
 
   const { popups, showPopup } = useScorePopup();
 
   const { paused, togglePause, PauseOverlay } = usePause({
     onGiveUp: () => {
       if (doneRef.current) return;
       doneRef.current = true;
       onComplete(0);
     },
   });
 
   useEffect(() => {
     periodRef.current = period;
   }, [period]);
 
   useEffect(() => {
     zoneCenterRef.current = zoneCenter;
   }, [zoneCenter]);
 
   useEffect(() => {
     zoneWidthRef.current = zoneWidth;
   }, [zoneWidth]);
 
   useEffect(() => {
     pausedRef.current = paused;
   }, [paused]);
 
   useEffect(() => {
     correctSfx.current.volume = 0.5;
     wrongSfx.current.volume = 0.65;
     perfectSfx.current.volume = 0.75;
   }, []);
 
   useEffect(() => {
     const interval = setInterval(() => {
       if (pausedRef.current || doneRef.current) return;
 
       setPeriod(p => Math.max(MIN_PERIOD, p - 250));
       setZoneCenter(35 + Math.random() * 30);
       setZoneWidth(w => Math.max(MIN_ZONE_WIDTH, w - 5));
 
       promptIdxRef.current = (promptIdxRef.current + 1) % MACHINE_PROMPTS.length;
       setMachinePrompt(MACHINE_PROMPTS[promptIdxRef.current]);
       setWarningLight(w => !w);
     }, 6000);
 
     return () => clearInterval(interval);
   }, []);
 
   useEffect(() => {
     lastTickRef.current = Date.now();
 
     const animate = () => {
       if (!pausedRef.current && !doneRef.current) {
         const now = Date.now();
         const dt = now - lastTickRef.current;
         lastTickRef.current = now;
 
         const speed = (BAR_WIDTH / (periodRef.current / 2)) * dt;
         let next = needleRef.current + dirRef.current * speed;
 
         if (next >= BAR_WIDTH) {
           next = BAR_WIDTH;
           dirRef.current = -1;
         }
 
         if (next <= 0) {
           next = 0;
           dirRef.current = 1;
         }
 
         needleRef.current = next;
         setNeedlePos(next);
       } else {
         lastTickRef.current = Date.now();
       }
 
       rafRef.current = requestAnimationFrame(animate);
     };
 
     rafRef.current = requestAnimationFrame(animate);
 
     return () => cancelAnimationFrame(rafRef.current);
   }, []);
 
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
 
   const handleTap = useCallback(() => {
     if (doneRef.current || pausedRef.current) return;
 
     const pos = needleRef.current;
     const zc = zoneCenterRef.current;
     const zw = zoneWidthRef.current;
     const inZone = pos >= zc - zw / 2 && pos <= zc + zw / 2;
 
     if (inZone) {
       correctSfx.current.currentTime = 0;
       playSfx(correctSfx.current);
 
       scoreRef.current += STAGE6_CORRECT_SCORE;
       setScore(scoreRef.current);
 
       showPopup(`+${STAGE6_CORRECT_SCORE}`, '#4ade80', 50, 60);
       setHitFeedback('perfect');
 
       heatRef.current = Math.max(0, heatRef.current - 10);
       setHeatLevel(heatRef.current);
 
       if (scoreRef.current >= STAGE6_CLEAR_SCORE && !doneRef.current) {
         doneRef.current = true;
 
         perfectSfx.current.currentTime = 0;
         playSfx(perfectSfx.current);
 
         showPopup('STAGE CLEAR!', '#facc15', 50, 42);
 
         setTimeout(() => {
           onComplete(scoreRef.current);
         }, 650);
       }
     } else {
       wrongSfx.current.currentTime = 0;
       playSfx(wrongSfx.current);
 
       scoreRef.current = Math.max(0, scoreRef.current + POINTS_WRONG);
       setScore(scoreRef.current);
 
       showPopup('-50', '#f87171', 50, 60);
       setHitFeedback('miss');
       setShaking(true);
 
       setTimeout(() => setShaking(false), 400);
 
       onDamage?.();
 
       const heatIncrease = 10 + Math.floor(Math.random() * 31);
       heatRef.current = Math.min(100, heatRef.current + heatIncrease);
       setHeatLevel(heatRef.current);
 
       if (heatRef.current >= 100 && !doneRef.current) {
         doneRef.current = true;
         setGameOver(true);
 
         setTimeout(() => {
           onComplete(scoreRef.current);
         }, 900);
       }
     }
 
     setTimeout(() => setHitFeedback(null), 350);
   }, [showPopup, onComplete, onDamage]);
 
   const zoneLeft = zoneCenter - zoneWidth / 2;
   const heatColor = heatLevel > 75 ? '#ef4444' : heatLevel > 50 ? '#f59e0b' : '#22c55e';
 
   return (
     <div
       className={`flex flex-col h-full overflow-hidden select-none relative ${shaking ? 'screen-shake' : ''}`}
       style={{ background: 'linear-gradient(160deg, #1a1205 0%, #2d200a 100%)' }}
     >
       {hitFeedback === 'perfect' && <div className="absolute inset-0 z-30 pointer-events-none correct-overlay" />}
       {hitFeedback === 'miss' && <div className="absolute inset-0 z-30 pointer-events-none wrong-overlay" />}
 
       {PauseOverlay}
       <ScorePopupLayer popups={popups} />
 
       {gameOver && (
         <div
           className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4"
           style={{ background: 'rgba(0,0,0,0.88)' }}
         >
           <div
             className="font-game text-red-400 font-bold bounce-in"
             style={{ fontSize: 'clamp(2rem,9vw,2.8rem)' }}
           >
             OVERHEAT!
           </div>
 
           <div className="font-game text-white/60 text-lg bounce-in">
             เครื่องจักรระเบิด!
           </div>
 
           <div className="font-game text-yellow-400 font-bold text-2xl bounce-in">
             {scoreRef.current} คะแนน
           </div>
         </div>
       )}
 
       <div className="flex-shrink-0 px-4 pt-5 pb-2">
         <div className="flex items-center justify-between mb-3">
           <div>
             <div className="font-game text-white/50 text-xs">ด่าน 6</div>
             <div className="font-game text-white text-xl font-bold">Machine Sync</div>
           </div>
 
           <div className="flex items-center gap-3">
             <div
               style={{
                 width: '16px',
                 height: '16px',
                 borderRadius: '50%',
                 background: warningLight ? '#ef4444' : '#374151',
                 boxShadow: warningLight ? '0 0 12px #ef4444' : 'none',
                 transition: 'all 0.3s',
               }}
             />
 
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
                 score >= STAGE6_CLEAR_SCORE
                   ? 'rgba(250,204,21,0.22)'
                   : 'rgba(255,255,255,0.08)',
               border:
                 score >= STAGE6_CLEAR_SCORE
                   ? '1px solid rgba(250,204,21,0.5)'
                   : '1px solid rgba(255,255,255,0.08)',
             }}
           >
             <span
               className="font-game font-bold"
               style={{
                 color: score >= STAGE6_CLEAR_SCORE ? '#fde047' : 'rgba(255,255,255,0.9)',
                 fontSize: 'clamp(0.8rem,3.5vw,0.95rem)',
                 textShadow: '0 2px 0 rgba(0,0,0,0.45)',
               }}
             >
               {score >= STAGE6_CLEAR_SCORE
                 ? '🚨 ผ่านแล้ว!'
                 : `🎯 อีก ${Math.max(0, STAGE6_CLEAR_SCORE - score)} คะแนนจะผ่าน!`}
             </span>
           </div>
         </div>
       </div>
 
       <div className="flex-shrink-0 px-4 py-1">
         <div
           className="rounded-xl px-3 py-2"
           style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
         >
           <div className="flex items-center justify-between mb-1">
             <span className="font-game text-white/60 text-xs">ความร้อนเครื่องจักร</span>
             <span className="font-game font-bold text-xs" style={{ color: heatColor }}>
               {Math.round(heatLevel)}%
             </span>
           </div>
 
           <div
             className="w-full rounded-full overflow-hidden"
             style={{ height: '10px', background: 'rgba(255,255,255,0.1)' }}
           >
             <div
               className="h-full rounded-full transition-all duration-300"
               style={{
                 width: `${heatLevel}%`,
                 background:
                   heatLevel > 75
                     ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                     : heatLevel > 50
                       ? '#f59e0b'
                       : '#22c55e',
                 boxShadow: `0 0 8px ${heatColor}`,
               }}
             />
           </div>
 
           {heatLevel > 75 && (
             <div className="font-game text-red-400 text-xs mt-0.5 timer-critical">
               ⚠️ ใกล้ระเบิด!
             </div>
           )}
         </div>
       </div>
 
       <div className="flex-shrink-0 px-4 py-2 text-center">
         <div
           className="inline-block rounded-xl px-4 py-2"
           style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}
         >
           <span className="font-game text-yellow-300 font-bold text-sm">
             ⚙️ {machinePrompt}
           </span>
         </div>
       </div>
 
       <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
         <div className="w-full max-w-xs flex flex-col items-center gap-3">
           <div className="flex items-center gap-3 mb-1">
             <span
               style={{
                 fontSize: '1.6rem',
                 opacity: 0.4,
                 animation: `${period < 1500 ? 'spin 1s linear infinite' : 'spin 2s linear infinite'}`,
               }}
             >
               ⚙️
             </span>
 
             <div className="font-game text-white/40 text-xs">SYNC METER</div>
 
             <span
               style={{
                 fontSize: '1.6rem',
                 opacity: 0.4,
                 animation: 'spin 1.5s linear infinite reverse',
               }}
             >
               ⚙️
             </span>
           </div>
 
           <div
             className="relative w-full rounded-full overflow-hidden"
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
                 left: `${zoneLeft}%`,
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
                 left: `${zoneLeft + zoneWidth / 2}%`,
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
 
           <div className="w-full flex justify-between px-1">
             <span className="font-game text-white/20 text-xs">←</span>
             <span className="font-game text-white/20 text-xs">→</span>
           </div>
         </div>
 
         <button
           onTouchStart={handleTap}
           onClick={handleTap}
           className="w-full max-w-xs rounded-3xl py-7 font-game font-bold text-white active:scale-95 transition-transform flex flex-col items-center gap-2"
           style={{
             background: 'linear-gradient(135deg, #d97706, #b45309)',
             boxShadow: '0 8px 0 #78350f, 0 10px 25px rgba(0,0,0,0.4)',
             fontSize: 'clamp(1.3rem,6vw,1.8rem)',
             touchAction: 'manipulation',
           }}
         >
           <span className="text-5xl">👆</span>
           <span>แตะ!</span>
         </button>
 
         {hitFeedback === 'perfect' && (
           <div
             className="absolute pointer-events-none font-game text-green-300 font-bold bounce-in"
             style={{
               fontSize: 'clamp(1.2rem,6vw,1.6rem)',
               top: '58%',
               left: '50%',
               transform: 'translateX(-50%)',
             }}
           >
             SYNC! ✅
           </div>
         )}
 
         {hitFeedback === 'miss' && (
           <div
             className="absolute pointer-events-none font-game text-red-400 font-bold bounce-in"
             style={{
               fontSize: 'clamp(1.2rem,6vw,1.6rem)',
               top: '58%',
               left: '50%',
               transform: 'translateX(-50%)',
             }}
           >
             MISS! ❌
           </div>
         )}
       </div>
 
       <div className="flex-shrink-0 px-4 pb-4 text-center">
         <div className="font-game text-white/25 text-xs">
           แตะในโซนเขียว +{STAGE6_CORRECT_SCORE} · พลาด -50 +ความร้อน · 100% = GAME OVER
         </div>
       </div>
 
       <style>
         {`
           @keyframes spin {
             from { transform: rotate(0deg); }
             to { transform: rotate(360deg); }
           }
         `}
       </style>
     </div>
   );
 }