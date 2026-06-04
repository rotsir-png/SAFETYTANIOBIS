import { useState, useEffect } from 'react';
import type { GameProgress } from '../types';

interface Props {
  progress: GameProgress;
  onStage: (stage: number) => void;
  onBack: () => void;
}
const STAGE_UNLOCK_DATES: Record<number, string> = {
  2: '2026-06-08T08:00:00+07:00',
  3: '2026-06-11T08:00:00+07:00',
};

const isDateUnlocked = (stageId: number) => {
  const unlockDate = STAGE_UNLOCK_DATES[stageId];

  if (!unlockDate) return true;

  return new Date() >= new Date(unlockDate);
};
const stages = [
  {
    id: 1,
    title: 'Safety Swipe',
    subTitle: 'ด่าน 1',
    emoji: '👆',
    desc: 'ปัดแยกปลอดภัย / ไม่ปลอดภัย',
    color: '#16a34a',
    shadow: '#14532d',
  },
  {
    id: 2,
    title: 'Inspect Scene',
    subTitle: 'ด่าน 2',
    emoji: '🔎',
    desc: 'หา Unsafe Action และ Unsafe Condition ในโรงงาน',
    color: '#f59e0b',
    shadow: '#92400e',
  },
  {
    id: 3,
    title: 'Accident Investigate',
    subTitle: 'ด่าน 3',
    emoji: '⛑️',
    desc: 'สืบ หา สาเหตุ',
    color: '#1d4ed8',
    shadow: '#1e3a8a',
  },
];

export default function CampaignScreen({ progress, onStage, onBack }: Props) {
  const [visible, setVisible] = useState(false);
  const [lockedPop, setLockedPop] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const isUnlocked = (id: number) => {
    if (id === 1) return true;
  
    // TEMP LOCK: ยังไม่เปิด Stage 2 และ Stage 3
    if (id === 2 || id === 3) return false;
  
    return false;
  };
  const isPassed = (id: number) => progress.passedStages.includes(id);

  const handleTap = (stage: typeof stages[0]) => {
    if (!isUnlocked(stage.id)) {
      setLockedPop(stage.id);
      setTimeout(() => setLockedPop(null), 3000);
      return;
    }
    onStage(stage.id);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-4 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center active:scale-90 transition-transform mr-3"
        >
          <span className="text-white text-xl">←</span>
        </button>
        <h2 className="font-game text-white font-bold" style={{ fontSize: 'clamp(3.1rem, 5vw, 1.4rem)' }}>
          เลือกด่าน
        </h2>
      </div>

      {/* Stage grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-6" style={{ scrollbarWidth: 'none' }}>
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {stages.map((stage, i) => {
            const unlocked = isUnlocked(stage.id);
            const passed = isPassed(stage.id);
            const showLockedPop = lockedPop === stage.id;

            return (
              <button
  key={stage.id}
  onClick={() => handleTap(stage)}
  className={`relative rounded-2xl p-4 flex flex-col items-center text-center active:scale-95 transition-transform overflow-hidden ${
    stage.id === 3 ? 'col-span-2' : ''
  }`}
  style={{
                  background: unlocked
                    ? `linear-gradient(135deg, ${stage.color}, ${stage.shadow})`
                    : 'linear-gradient(135deg, #374151, #1f2937)',
                  boxShadow: unlocked
                    ? `0 4px 0 ${stage.shadow}, 0 6px 12px rgba(0,0,0,0.4)`
                    : '0 4px 0 #111827',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${i * 0.07}s`,
                  minHeight: '190px',
                }}
              >
                {/* Lock overlay */}
                {!unlocked && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-2xl z-10 gap-1">
                    <span className="text-4xl">🔒</span>
                    <span className="font-game text-white/60 text-sm">ล็อก</span>
                  </div>
                )}

                {/* Locked pop feedback */}
{showLockedPop && (
  <div
    className="absolute inset-0 flex items-center justify-center z-20 rounded-2xl px-4"
    style={{ background: 'rgba(0,0,0,0.9)' }}
  >
    <div
      className="font-game text-yellow-300 text-center bounce-in"
      style={{
        fontSize: 'clamp(2.1rem, 5vw, 1.3rem)',
        lineHeight: 1.35,
        textShadow: '0 2px 4px rgba(0,0,0,0.6)',
      }}
    >
      {stage.id === 2 ? (
        <>
          ด่าน 2 จะเปิด
          <br />
          8 มิ.ย. 2569 และผ่านด่าน 1
        </>
      ) : (
        <>
          ด่าน 3 จะเปิด
          <br />
          11 มิ.ย. 2569 หลังผ่านด่าน 2
        </>
      )}
    </div>
  </div>
)}

                {/* Passed badge */}
                {passed && unlocked && (
                  <div className="absolute top-2 right-2 z-10 bg-white/20 rounded-full w-7 h-7 flex items-center justify-center">
                    <span className="text-sm">✓</span>
                  </div>
                )}

<span
  className="mb-3"
  style={{
    fontSize: 'clamp(3rem, 10vw, 4rem)',
    filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.35))',
  }}
>{unlocked ? stage.emoji : '🔒'}</span>
                <div className="font-game text-white font-bold" style={{ fontSize: 'clamp(1.5rem, 5vw, 1.6rem)' }}>
                  {stage.title}
                </div>
                <div className="font-game text-white mt-2"
style={{
  fontSize: 'clamp(1.05rem, 3.8vw, 1.1rem)',
  lineHeight: 1,
  fontWeight: 700,
}}>{stage.subTitle}</div>
                {unlocked && (
                  <div className="font-game text-white/80 mt-2" 
                  style={{
                    fontSize: 'clamp(1.05rem, 3vw, 0.9rem)',
                    lineHeight: 1.35,
                  }}>{stage.desc}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
