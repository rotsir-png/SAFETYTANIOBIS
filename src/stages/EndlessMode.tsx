/**
 * Endless Mode: Hearts system, combo multiplier, speed escalation, random chaos switching.
 * 5 hearts max. Any miss/wrong/collision = -1 heart + combo reset.
 * Combo after 3 correct actions: x1.1, x1.2, ... max x2.0 per correct action.
 * Wrong resets to x1.0. Never interrupt Stage 7 mid-segment.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import Stage1SafetySwipe from './Stage1SafetySwipe';
import Stage2PPERush from './Stage2PPERush';
import Stage3TapHazard from './Stage3TapHazard';
import Stage4ClawMachine from './Stage4ClawMachine';
import Stage5HazardDefense from './Stage5HazardDefense';
import Stage6MachineSync from './Stage6MachineSync';
import Stage7ForklifPanic from './Stage7ForklifPanic';
import { saveEndlessHighScore, getEndlessHighScore } from '../storage';

interface Props {
  onComplete: (score: number, highScore: number) => void;
}

type MiniGame = 1 | 2 | 3 | 4 | 5 | 6 | 7;
const ALL_GAMES: MiniGame[] = [1, 2, 3, 4, 5, 6, 7];

const GAME_NAMES: Record<MiniGame, string> = {
  1: 'Safety Swipe', 2: 'PPE Rush', 3: 'Tap Hazard',
  4: 'เครื่องจับกาชาปอง', 5: 'Hazard is Coming', 6: 'Machine Sync', 7: 'Forklift Panic',
};
const GAME_EMOJIS: Record<MiniGame, string> = {
  1: '👆', 2: '⛑️', 3: '🔥', 4: '🎯', 5: '🛡️', 6: '⚙️', 7: '🚜',
};

const TRANSITION_WORDS = ['เปลี่ยน', 'สับ', 'หลอก', 'ไป'];
const MAX_HEARTS = 5;
const SEGMENT_DURATION = 15;

function getRandomGame(exclude?: MiniGame): MiniGame {
  const filtered = ALL_GAMES.filter(g => g !== exclude);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

// Combo multiplier: starts at 1.0, each correct action after 3 adds 0.1, max 2.0
function calcMultiplier(combo: number): number {
  if (combo < 3) return 1.0;
  return Math.min(2.0, 1.0 + (combo - 2) * 0.1);
}

export default function EndlessMode({ onComplete }: Props) {
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [totalScore, setTotalScore] = useState(0);
  const [currentGame, setCurrentGame] = useState<MiniGame>(() => getRandomGame());
  const [round, setRound] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const [transMsg, setTransMsg] = useState('');
  const [showAnnounce, setShowAnnounce] = useState(true);
  const [combo, setCombo] = useState(0);
  const [comboFlashText, setComboFlashText] = useState<string | null>(null);
  const [heartPickupVisible, setHeartPickupVisible] = useState(false);
  const [heartPickupPos, setHeartPickupPos] = useState({ x: 50, y: 50 });
  const [gameOverAnim, setGameOverAnim] = useState(false);

  const heartsRef = useRef(MAX_HEARTS);
  const totalScoreRef = useRef(0);
  const comboRef = useRef(0);
  const prevGameRef = useRef<MiniGame>(currentGame);
  const doneRef = useRef(false);
  const [highScore] = useState(() => getEndlessHighScore());

  useEffect(() => {
    const t = setTimeout(() => setShowAnnounce(false), 1800);
    return () => clearTimeout(t);
  }, [round]);

  // Random heart pickup every ~20s
  useEffect(() => {
    const interval = setInterval(() => {
      if (doneRef.current) return;
      if (heartsRef.current < MAX_HEARTS) {
        setHeartPickupPos({ x: 15 + Math.random() * 70, y: 20 + Math.random() * 60 });
        setHeartPickupVisible(true);
        setTimeout(() => setHeartPickupVisible(false), 4000);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const breakCombo = useCallback(() => {
    comboRef.current = 0;
    setCombo(0);
  }, []);

  const addCombo = useCallback(() => {
    const newCombo = comboRef.current + 1;
    comboRef.current = newCombo;
    setCombo(newCombo);
    const mult = calcMultiplier(newCombo);
    if (newCombo >= 3) {
      setComboFlashText(`COMBO x${mult.toFixed(1)}`);
      setTimeout(() => setComboFlashText(null), 1200);
    }
  }, []);

  const handleDamage = useCallback(() => {
    if (doneRef.current) return;
    const newHearts = Math.max(0, heartsRef.current - 1);
    heartsRef.current = newHearts;
    setHearts(newHearts);
    breakCombo();
    if (newHearts <= 0) {
      doneRef.current = true;
      setGameOverAnim(true);
      const score = totalScoreRef.current;
      saveEndlessHighScore(score);
      const newHigh = Math.max(highScore, score);
      setTimeout(() => onComplete(score, newHigh), 1200);
    }
  }, [highScore, onComplete, breakCombo]);

  const handleRoundComplete = useCallback((roundScore: number) => {
    if (doneRef.current) return;
    const mult = calcMultiplier(comboRef.current);
    const boosted = Math.round(roundScore * mult);
    const newTotal = totalScoreRef.current + boosted;
    totalScoreRef.current = newTotal;
    setTotalScore(newTotal);
    addCombo();

    const newRound = round + 1;
    const newSpeed = Math.min(3.0, 1 + Math.floor(newRound / 2) * 0.15);
    const nextGame = getRandomGame(prevGameRef.current);

    const msg = TRANSITION_WORDS[Math.floor(Math.random() * TRANSITION_WORDS.length)];
    setTransMsg(msg);
    setTransitioning(true);
    setTimeout(() => {
      if (doneRef.current) return;
      setRound(newRound);
      setSpeedMultiplier(newSpeed);
      prevGameRef.current = nextGame;
      setCurrentGame(nextGame);
      setShowAnnounce(true);
      setTransitioning(false);
      setTransMsg('');
    }, 700);
  }, [round, addCombo]);

  const handleStageComplete = useCallback((score: number) => {
    handleRoundComplete(score);
  }, [handleRoundComplete]);

  const handleQuit = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const score = totalScoreRef.current;
    saveEndlessHighScore(score);
    const newHigh = Math.max(highScore, score);
    onComplete(score, newHigh);
  }, [highScore, onComplete]);

  const collectHeartPickup = useCallback(() => {
    setHeartPickupVisible(false);
    const newH = Math.min(MAX_HEARTS, heartsRef.current + 1);
    heartsRef.current = newH;
    setHearts(newH);
  }, []);

  const comboMult = calcMultiplier(combo);
  const gameName = GAME_NAMES[currentGame];
  const gameEmoji = GAME_EMOJIS[currentGame];

  return (
    <div className="relative h-full overflow-hidden">
      {/* Transition overlay */}
      {transitioning && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center gap-3">
          <div className="font-game text-yellow-300 font-bold bounce-in" style={{ fontSize: 'clamp(2rem,10vw,3rem)' }}>
            {transMsg}
          </div>
          <div className="font-game text-white/60 bounce-in text-sm" style={{ animationDelay: '0.1s' }}>
            {GAME_EMOJIS[currentGame]} {GAME_NAMES[currentGame]}
          </div>
        </div>
      )}

      {/* Round announcement */}
      {showAnnounce && !transitioning && (
        <div className="absolute inset-0 z-40 bg-black/85 flex flex-col items-center justify-center pointer-events-none gap-2">
          <div className="text-6xl bounce-in">{gameEmoji}</div>
          <div className="font-game text-yellow-300 text-xl bounce-in font-bold" style={{ animationDelay: '0.08s' }}>
            {gameName}
          </div>
          {speedMultiplier > 1 && (
            <div className="font-game text-red-400 text-base bounce-in" style={{ animationDelay: '0.16s' }}>
              Speed x{speedMultiplier.toFixed(1)}
            </div>
          )}
          {comboMult > 1 && (
            <div className="font-game text-yellow-300 text-sm bounce-in" style={{ animationDelay: '0.24s' }}>
              Combo x{comboMult.toFixed(1)}
            </div>
          )}
        </div>
      )}

      {/* Combo flash */}
      {comboFlashText && (
        <div className="absolute inset-x-0 z-45 flex justify-center pointer-events-none" style={{ top: '22%' }}>
          <div className="font-game text-yellow-300 font-bold bounce-in rounded-2xl px-5 py-2 text-xl"
            style={{ background: 'rgba(0,0,0,0.8)', border: '2px solid rgba(245,158,11,0.6)' }}>
            {comboFlashText}
          </div>
        </div>
      )}

      {/* Heart pickup */}
      {heartPickupVisible && !transitioning && !showAnnounce && !doneRef.current && (
        <button
          onTouchEnd={collectHeartPickup}
          onClick={collectHeartPickup}
          className="absolute z-35 bounce-in active:scale-75 transition-transform"
          style={{ left: `${heartPickupPos.x}%`, top: `${heartPickupPos.y}%`, transform: 'translate(-50%,-50%)' }}
        >
          <div className="rounded-full flex items-center justify-center"
            style={{ width: '52px', height: '52px', background: 'rgba(239,68,68,0.3)', border: '3px solid rgba(239,68,68,0.8)', boxShadow: '0 0 16px rgba(239,68,68,0.5)', fontSize: '1.8rem' }}>
            ❤️
          </div>
        </button>
      )}

      {/* Game Over */}
      {gameOverAnim && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}>
          <div className="font-game text-red-400 font-bold bounce-in" style={{ fontSize: 'clamp(2rem,9vw,2.8rem)' }}>GAME OVER</div>
          <div className="font-game text-white/60 text-lg bounce-in" style={{ animationDelay: '0.1s' }}>หัวใจหมดแล้ว!</div>
          <div className="font-game text-yellow-400 font-bold text-2xl bounce-in" style={{ animationDelay: '0.2s' }}>{totalScoreRef.current} คะแนน</div>
        </div>
      )}

      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-2 pb-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)' }}>
        <div className="flex items-center justify-between">
          {/* Hearts */}
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              {Array.from({ length: MAX_HEARTS }, (_, i) => (
                <span key={i} style={{ fontSize: '1rem', opacity: i < hearts ? 1 : 0.2, filter: i < hearts ? 'none' : 'grayscale(1)', transition: 'all 0.2s' }}>❤️</span>
              ))}
            </div>
            <div className="font-game text-white font-bold text-sm">รวม: {totalScore}</div>
          </div>
          {/* Combo + speed */}
          <div className="text-center">
            {combo >= 3 && (
              <div className="font-game text-yellow-300 font-bold text-xs">
                COMBO x{comboMult.toFixed(1)}
              </div>
            )}
            {speedMultiplier > 1 && (
              <div className="font-game text-red-400 text-xs">
                x{speedMultiplier.toFixed(1)}
              </div>
            )}
            {highScore > 0 && (
              <div className="font-game text-white/30" style={{ fontSize: '0.6rem' }}>
                สูงสุด: {highScore}
              </div>
            )}
          </div>
          {/* Quit */}
          <div className="pointer-events-auto">
            <button onClick={handleQuit}
              className="rounded-xl px-4 py-2 font-game text-white text-sm active:scale-90 transition-transform"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              ออก →
            </button>
          </div>
        </div>
      </div>

      {/* Active mini-game */}
      <div className="h-full">
        {!transitioning && currentGame === 1 && <Stage1SafetySwipe key={`s1-${round}`} onComplete={handleStageComplete} />}
        {!transitioning && currentGame === 2 && <Stage2PPERush key={`s2-${round}`} onComplete={handleStageComplete} />}
        {!transitioning && currentGame === 3 && <Stage3TapHazard key={`s3-${round}`} onComplete={handleStageComplete} speedMultiplier={speedMultiplier} onDamage={handleDamage} />}
        {!transitioning && currentGame === 4 && <Stage4ClawMachine key={`s4-${round}`} onComplete={handleStageComplete} speedMultiplier={speedMultiplier} />}
        {!transitioning && currentGame === 5 && <Stage5HazardDefense key={`s5-${round}`} onComplete={handleStageComplete} speedMultiplier={speedMultiplier} onDamage={handleDamage} />}
        {!transitioning && currentGame === 6 && <Stage6MachineSync key={`s6-${round}`} onComplete={handleStageComplete} speedMultiplier={speedMultiplier} onDamage={handleDamage} />}
        {!transitioning && currentGame === 7 && <Stage7ForklifPanic key={`s7-${round}`} onComplete={handleStageComplete} speedMultiplier={speedMultiplier} onDamage={handleDamage} />}
      </div>
    </div>
  );
}
