interface Props {
  timeLeft: number;
  totalTime: number;
}

export default function TimerBar({ timeLeft, totalTime }: Props) {
  const pct = (timeLeft / totalTime) * 100;
  const isCritical = timeLeft <= 5;
  const color = timeLeft > 10 ? '#22c55e' : timeLeft > 5 ? '#f59e0b' : '#ef4444';

  return (
    <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden relative">
      <div
        className={`h-full rounded-full transition-all duration-100 ${isCritical ? 'timer-critical' : ''}`}
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <div
        className="absolute right-2 top-1/2 -translate-y-1/2 font-arcade text-white"
        style={{ fontSize: '0.55rem' }}
      >
        {Math.ceil(timeLeft)}s
      </div>
    </div>
  );
}
