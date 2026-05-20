import { useState, useCallback } from 'react';

interface Popup {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
}

let nextId = 0;

export function useScorePopup() {
  const [popups, setPopups] = useState<Popup[]>([]);

  const showPopup = useCallback((text: string, color: string, x?: number, y?: number) => {
    const id = nextId++;
    const popup: Popup = {
      id,
      text,
      color,
      x: x ?? 50,
      y: y ?? 50,
    };
    setPopups(p => [...p, popup]);
    setTimeout(() => {
      setPopups(p => p.filter(pp => pp.id !== id));
    }, 800);
  }, []);

  return { popups, showPopup };
}

interface Props {
  popups: Popup[];
}

export default function ScorePopupLayer({ popups }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {popups.map(p => (
        <div
          key={p.id}
          className="score-pop absolute font-arcade font-bold"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            color: p.color,
            fontSize: 'clamp(1.2rem, 6vw, 1.8rem)',
            textShadow: '2px 2px 0 rgba(0,0,0,0.5)',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {p.text}
        </div>
      ))}
    </div>
  );
}
