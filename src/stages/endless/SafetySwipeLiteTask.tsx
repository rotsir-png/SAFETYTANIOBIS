import { useMemo, useRef, useState } from "react";
import { swipeCards } from "../../gameData";

type Props = {
  onComplete: (correctCount: number) => void;
  onBack: () => void;
};

type Direction = "left" | "right";
type Feedback = "correct" | "wrong" | null;

const TOTAL_CARDS = 5;
const SWIPE_THRESHOLD = 80;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function SafetySwipeLiteTask({ onComplete, onBack }: Props) {
  const cards = useMemo(() => shuffle(swipeCards).slice(0, TOTAL_CARDS), []);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [screenShake, setScreenShake] = useState(false);

  const startXRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const lockedRef = useRef(false);

  const card = cards[index];
  const hint = dragX > 30 ? "right" : dragX < -30 ? "left" : null;
  const swipePower = Math.min(Math.abs(dragX) / 140, 1);

  const answer = (direction: Direction) => {
    if (!card || lockedRef.current) return;
    lockedRef.current = true;

    const correct = direction === "right" ? card.isSafe : !card.isSafe;
    const nextCorrect = correct ? correctCount + 1 : correctCount;

    setCorrectCount(nextCorrect);
    setFeedback(correct ? "correct" : "wrong");
    setDragX(direction === "right" ? 320 : -320);

    if (!correct) {
      setScreenShake(true);
      window.setTimeout(() => setScreenShake(false), 260);
    }

    if (!correct) {
      window.setTimeout(() => {
        onComplete(0);
      }, 220);
      return;
    }
    
    window.setTimeout(() => {
      if (index >= TOTAL_CARDS - 1) {
        onComplete(nextCorrect);
        return;
      }
    
      setIndex((x) => x + 1);
      setDragX(0);
      setFeedback(null);
      lockedRef.current = false;
    }, 220);
  };

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-slate-800 to-slate-950 px-3 py-3 text-white ${
        screenShake ? "screen-shake" : ""
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="font-game text-white/45 text-xs">SAFETY COACHING</div>
          <div className="font-game font-black text-yellow-300 text-[clamp(1.35rem,6vw,2rem)]">
            Safety Swipe
          </div>
        </div>

        <button
          onClick={onBack}
          className="rounded-2xl bg-white/10 px-3 py-2 font-game text-white active:scale-95"
        >
          กลับ
        </button>
      </div>

      <div className="mb-2 rounded-2xl bg-black/35 px-3 py-2 text-center font-game font-black text-white">
        Card {index + 1}/{TOTAL_CARDS} • พลาดไม่ได้
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
        <div
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 transition-opacity duration-150"
          style={{ opacity: hint === "left" ? 1 : 0 }}
        >
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-red-500 px-3 py-3 shadow-lg">
            <span className="text-2xl">⚠️</span>
            <span className="font-game text-sm font-bold text-white">ไม่ปลอดภัย</span>
          </div>
        </div>

        <div
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 transition-opacity duration-150"
          style={{ opacity: hint === "right" ? 1 : 0 }}
        >
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-green-500 px-3 py-3 shadow-lg">
            <span className="text-2xl">✅</span>
            <span className="font-game text-sm font-bold text-white">ปลอดภัย</span>
          </div>
        </div>

        <div
          key={index}
          className="swipe-card flex h-[clamp(300px,48vh,430px)] w-full max-w-[34rem] touch-none select-none flex-col items-center justify-center gap-5 rounded-[2rem] px-4 py-6"
          style={{
            background:
              "radial-gradient(circle at top, rgba(255,255,255,0.14), rgba(17,24,39,0.96))",
            border:
              hint === "right"
                ? `2px solid rgba(34,197,94,${0.25 + swipePower * 0.6})`
                : hint === "left"
                ? `2px solid rgba(239,68,68,${0.25 + swipePower * 0.6})`
                : "2px solid rgba(255,255,255,0.15)",
            boxShadow:
              hint === "right"
                ? `0 8px 32px rgba(34,197,94,${0.15 + swipePower * 0.35})`
                : hint === "left"
                ? `0 8px 32px rgba(239,68,68,${0.15 + swipePower * 0.35})`
                : "0 12px 40px rgba(0,0,0,0.55)",
            transform: `translateX(${dragX}px) rotate(${dragX * 0.07}deg) scale(${
              1 + swipePower * 0.04
            })`,
            transition: lockedRef.current
              ? "transform 180ms cubic-bezier(.2,1.4,.4,1)"
              : "none",
          }}
          onPointerDown={(e) => {
            if (lockedRef.current) return;
            pointerIdRef.current = e.pointerId;
            startXRef.current = e.clientX;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (lockedRef.current || pointerIdRef.current !== e.pointerId) return;
            setDragX(e.clientX - startXRef.current);
          }}
          onPointerUp={(e) => {
            if (lockedRef.current || pointerIdRef.current !== e.pointerId) return;
            pointerIdRef.current = null;

            if (Math.abs(dragX) >= SWIPE_THRESHOLD) {
              answer(dragX > 0 ? "right" : "left");
            } else {
              setDragX(0);
            }
          }}
          onPointerCancel={() => {
            pointerIdRef.current = null;
            setDragX(0);
          }}
        >
          {feedback && (
            <div
              className={`absolute inset-0 z-20 grid place-items-center rounded-[2rem] font-game font-black text-[clamp(2rem,9vw,3rem)] ${
                feedback === "correct" ? "bg-green-500/75" : "bg-red-600/75"
              }`}
            >
              {feedback === "correct" ? "ถูกต้อง!" : "ผิด!"}
            </div>
          )}

          <div className="text-[clamp(4.5rem,18vw,6.5rem)]">{card.emoji}</div>

          <div className="max-w-[98%] text-center font-game font-black leading-tight text-white text-[clamp(2rem,8vw,2.7rem)] [text-shadow:0_5px_0_rgba(0,0,0,0.6)]">
            {card.label}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 gap-3 px-1 pb-2">
        <button
          onPointerUp={() => answer("left")}
          className="flex flex-1 items-center justify-center gap-3 rounded-2xl border-2 border-red-200 bg-red-600 py-5 font-game font-black text-white active:scale-95 text-[clamp(1.15rem,5vw,1.55rem)]"
        >
          ← ไม่ปลอดภัย
        </button>

        <button
          onPointerUp={() => answer("right")}
          className="flex flex-1 items-center justify-center gap-3 rounded-2xl border-2 border-green-200 bg-green-600 py-5 font-game font-black text-white active:scale-95 text-[clamp(1.15rem,5vw,1.55rem)]"
        >
          ปลอดภัย →
        </button>
      </div>
    </div>
  );
}