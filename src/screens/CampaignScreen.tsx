import { useState, useEffect } from 'react';
import type { GameProgress } from '../types';

interface Props {
  progress: GameProgress;
  onStage: (stage: number) => void;
  onBack: () => void;
}

const stages = [
  { id: 1, title: 'ด่าน 1', subTitle: 'ปัดซ้ายปัดขวา',        emoji: '👆', desc: 'ปัดเป่าอันตราย',          color: '#16a34a', shadow: '#14532d' },
  { id: 2, title: 'ด่าน 2', subTitle: 'PPE Rush',             emoji: '⛑️', desc: 'แตะ PPE ให้ทัน!',       color: '#f59e0b', shadow: '#92400e' },
  { id: 3, title: 'ด่าน 3', subTitle: 'Whack-a-Danger',           emoji: '🔥', desc: 'แตะอันตราย!',           color: '#dc2626', shadow: '#7f1d1d' },
  { id: 4, title: 'ด่าน 4', subTitle: 'เครื่องจับกาชาปอง', emoji: '🎯', desc: 'คีบ PPE!', color: '#1d4ed8', shadow: '#1e3a8a' },
  { id: 5, title: 'ด่าน 5', subTitle: 'Hazard is Coming', emoji: '🛡️', desc: 'ปกป้อง TANIOBIS!',    color: '#059669', shadow: '#064e3b' },
  { id: 6, title: 'ด่าน 6', subTitle: 'Machine Overheating',     emoji: '⚙️', desc: 'จีบจังหวะลดอุณหภูมิเครื่องจักร',          color: '#d97706', shadow: '#78350f' },
  { id: 7, title: 'ด่าน 7', subTitle: 'Forklift Panic',   emoji: '🚜', desc: 'อย่าชนเด็ดขาด!',         color: '#0891b2', shadow: '#164e63' },
  { id: 8, title: 'ด่าน 8', subTitle: 'Chaos',      emoji: '🌀', desc: 'เอาตัวรอดจากทุกด่าน!',             color: '#be123c', shadow: '#881337' },
];

export default function CampaignScreen({ progress, onStage, onBack }: Props) {
  const [visible, setVisible] = useState(false);
  const [lockedPop, setLockedPop] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const isUnlocked = (id: number) => id <= progress.highestUnlockedStage;
  const isPassed = (id: number) => progress.passedStages.includes(id);

  const handleTap = (stage: typeof stages[0]) => {
    if (!isUnlocked(stage.id)) {
      setLockedPop(stage.id);
      setTimeout(() => setLockedPop(null), 1000);
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
        <h2 className="font-game text-white font-bold" style={{ fontSize: 'clamp(1.1rem, 5vw, 1.4rem)' }}>
          เลือกด่าน
        </h2>
      </div>

      {/* Stage grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-6" style={{ scrollbarWidth: 'none' }}>
        <div className="grid grid-cols-2 gap-3">
          {stages.map((stage, i) => {
            const unlocked = isUnlocked(stage.id);
            const passed = isPassed(stage.id);
            const showLockedPop = lockedPop === stage.id;

            return (
              <button
                key={stage.id}
                onClick={() => handleTap(stage)}
                className="relative rounded-2xl p-4 flex flex-col items-center text-center active:scale-95 transition-transform overflow-hidden"
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
                  minHeight: '170px',
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
                  <div className="absolute inset-0 flex items-center justify-center z-20 rounded-2xl"
                    style={{ background: 'rgba(0,0,0,0.85)' }}>
                    <div className="font-game text-yellow-400 text-center bounce-in"
                      style={{ fontSize: 'clamp(0.75rem, 3vw, 0.9rem)' }}>
                      ยังไม่ปลดล็อก!
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
                <div className="font-game text-white font-bold" style={{ fontSize: 'clamp(1.1rem, 4.5vw, 1.35rem)' }}>
                  {stage.title}
                </div>
                <div className="font-game text-white/80 mt-1"
style={{
  fontSize: 'clamp(0.8rem, 3.4vw, 0.95rem)',
  lineHeight: 1.3,
}}>{stage.subTitle}</div>
                {unlocked && (
                  <div className="font-game text-white/70 mt-2"
                  style={{
                    fontSize: 'clamp(0.75rem, 3vw, 0.9rem)',
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
