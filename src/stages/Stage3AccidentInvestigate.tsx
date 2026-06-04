import React, { useState } from "react";
import { stage3Cases } from "../data/stage3Cases";

type Props = {
  onExit?: () => void;
  onClear?: (score: number) => void;
};

const CLEAR_SCORE = 400;

export default function Stage3AccidentInvestigate({ onExit, onClear }: Props) {
  const [caseIndex, setCaseIndex] = useState(0);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [cleared, setCleared] = useState(false);

  const accidentCase = stage3Cases[caseIndex % stage3Cases.length];
  const puzzle = accidentCase.puzzles[puzzleIndex];
  const isLastPuzzle = puzzleIndex >= accidentCase.puzzles.length - 1;
  const caseClosed = unlocked && isLastPuzzle;

  const handleChoice = (choice: string) => {
    if (selected) return;

    const correct = choice === puzzle.answer;
    const nextScore = Math.max(0, score + (correct ? 50 : -20));

    setSelected(choice);
    setScore(nextScore);

    if (correct) {
      setUnlocked(true);
    }

    if (!cleared && nextScore >= CLEAR_SCORE) {
      setCleared(true);
      onClear?.(nextScore);
    }
  };

  const handleContinue = () => {
    if (!unlocked) {
      setSelected(null);
      return;
    }

    if (isLastPuzzle) {
      setCaseIndex((v) => v + 1);
      setPuzzleIndex(0);
      setSelected(null);
      setUnlocked(false);
      return;
    }

    setPuzzleIndex((v) => v + 1);
    setSelected(null);
    setUnlocked(false);
  };

  return (
    <div className="min-h-[100dvh] w-full overflow-y-auto bg-[#111827] px-2 py-2 text-white">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col pb-28">
        <div className="flex items-start justify-between px-1">
          <div>
            <div className="font-bold text-white/45 text-[clamp(13px,3vw,16px)]">
              ด่าน 3
            </div>
            <h1 className="font-black leading-none text-[clamp(22px,6vw,30px)]">
              Accident Investigate
            </h1>
            <div className="mt-1 font-black leading-none text-yellow-300 text-[clamp(22px,6vw,30px)]">
              
            </div>
          </div>

          <div className="flex items-start gap-3">
            <button
              onClick={onExit}
              className="grid h-14 w-14 place-items-center rounded-2xl border border-white/20 bg-white/10 text-2xl shadow-lg active:scale-95"
            >
              ⏸
            </button>

            <div className="text-right">
              <div className="font-black text-yellow-300 text-[clamp(30px,8vw,42px)]">
                {score}
              </div>
              <div className="font-bold text-white/45 text-[clamp(12px,3vw,15px)]">
                คะแนน
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 h-4 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-[72%] rounded-full bg-green-500" />
        </div>

        <div className="mt-1 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-center font-black text-[clamp(16px,4vw,21px)]">
          🔒 แก้ปริศนาเพื่อเปิดแฟ้มคดี
        </div>

        <div className="relative mt-2 flex-1 overflow-visible rounded-[22px] border border-white/10 bg-black/45 p-2 shadow-2xl">
          <div className="rounded-[22px] border border-yellow-300/30 bg-yellow-300/10 px-3 py-3 text-center">
            <div className="font-black text-yellow-300 text-[clamp(17px,4vw,22px)]">
              🔒 CASE LOCKED
            </div>

            <h2 className="mt-2 font-black leading-tight text-[clamp(20px,5vw,28px)]">
              {accidentCase.title}
            </h2>

            <p className="mt-2 font-bold leading-snug text-white/80 text-[clamp(15px,4vw,19px)]">
              {accidentCase.subtitle}
            </p>

            <div className="mt-3 rounded-2xl bg-black/45 px-3 py-2 font-black text-white/70 text-[clamp(14px,3.6vw,17px)]">
              FILE {puzzleIndex + 1} / {accidentCase.puzzles.length}
            </div>
          </div>

          {!unlocked ? (
            <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-900/90 p-4">
              <div className="text-center font-black text-yellow-300 text-[clamp(17px,4vw,22px)]">
              📄 REDACTED REPORT
              </div>

              <div className="mt-2 rounded-2xl bg-black/55 px-3 py-3 text-center font-black leading-snug text-[clamp(18px,4.5vw,24px)]">
                {puzzle.question}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {puzzle.choices.map((choice) => {
                  const isSelected = selected === choice;
                  const isCorrect = choice === puzzle.answer;

                  return (
                    <button
                      key={choice}
                      onClick={() => handleChoice(choice)}
                      className={[
                        "min-h-[48px] rounded-xl px-2 py-2 font-black shadow-lg active:scale-95 text-[clamp(15px,3.8vw,20px)]",
                        !selected
                          ? "bg-white text-slate-950"
                          : isSelected && isCorrect
                          ? "bg-green-500 text-white"
                          : isSelected && !isCorrect
                          ? "bg-red-500 text-white"
                          : "bg-white/15 text-white/45",
                      ].join(" ")}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>

              {selected && !unlocked ? (
                <button
                  onClick={handleContinue}
                  className="mt-4 w-full rounded-2xl bg-red-600 py-3 font-black shadow-lg active:scale-95 text-[clamp(18px,5vw,25px)]"
                >
                  ลองใหม่ -20
                </button>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 rounded-[24px] border border-green-400/30 bg-green-500/10 p-4 text-center">
              <div className="font-black leading-none text-green-300 text-[clamp(18px,4.5vw,26px)]">
  {puzzle.unlockTitle}
</div>
              <button
  onClick={handleContinue}
  className="mt-3 mb-3 w-full rounded-2xl bg-green-600 py-3 font-black text-white shadow-lg active:scale-95 text-[clamp(18px,5vw,24px)]"
>
  {caseClosed ? "เคสต่อไป ▶" : "ปลดล็อกต่อ ▶"}
</button>
              <div className="mt-3 space-y-2">
                {puzzle.unlockedLines.map((line) => (
                  <div
                    key={line}
                    className="rounded-2xl bg-black/55 px-3 py-3 font-bold leading-snug text-white text-[clamp(15px,4vw,19px)]"
                  >
                    ✓ {line}
                  </div>
                ))}
              </div>

              {caseClosed ? (
                <div className="mt-4 rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-3">
                  <div className="font-black text-yellow-300 text-[clamp(18px,5vw,25px)]">
                    🏆 LESSON LEARNED
                  </div>
                  <p className="mt-2 font-bold leading-snug text-white text-[clamp(15px,4vw,19px)]">
                    {accidentCase.lesson}
                  </p>
                </div>
              ) : null}
            </div>
          )}
                </div>
</div>
</div>
);
}