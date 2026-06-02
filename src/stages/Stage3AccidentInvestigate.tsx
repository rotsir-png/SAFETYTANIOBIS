import React, { useState } from "react";
import { stage3Accident } from "../data/stage3Accident";

type Props = {
  onExit?: () => void;
  onClear?: (score: number) => void;
};

type Result = null | {
  correct: boolean;
  label: string;
};

const CLEAR_SCORE = 400;

export default function Stage3AccidentInvestigate({ onExit, onClear }: Props) {
  const [caseIndex, setCaseIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<Result>(null);
  const [cleared, setCleared] = useState(false);

  const accidentCase = stage3Accident[caseIndex % stage3Accident.length];

  const handleTapHotspot = (hotspot: (typeof accidentCase.hotspots)[number]) => {
    if (result) return;

    const nextScore = Math.max(0, score + (hotspot.correct ? 30 : -30));

    setScore(nextScore);
    setResult({
      correct: hotspot.correct,
      label: hotspot.label,
    });

    if (!cleared && nextScore >= CLEAR_SCORE) {
      setCleared(true);
      onClear?.(nextScore);
    }
  };

  const handleNext = () => {
    setCaseIndex((v) => v + 1);
    setResult(null);
  };

  return (
    <div className="min-h-screen w-full overflow-hidden bg-[#111827] px-2 py-3 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-1">
          <div>
            <div className="font-bold text-white/45 text-[clamp(13px,3vw,16px)]">
              ด่าน 3
            </div>
            <h1 className="font-black leading-none text-[clamp(22px,6vw,30px)]">
              Accident
            </h1>
            <div className="mt-1 font-black leading-none text-yellow-300 text-[clamp(22px,6vw,30px)]">
              Investigate
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

        {/* Timer mock */}
        <div className="mt-2 h-4 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-[72%] rounded-full bg-green-500" />
        </div>

        <div className="mt-1 flex justify-end pr-1 font-black text-white/80 text-[clamp(13px,3vw,16px)]">
          45s
        </div>

        {/* Goal */}
        <div className="mt-2 mx-auto rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-center font-black shadow-lg text-[clamp(16px,4vw,21px)]">
          🎯 อีก {Math.max(CLEAR_SCORE - score, 0)} คะแนนจะผ่าน!
        </div>

        {/* Instruction */}
        <div className="mt-2 rounded-2xl border border-white/10 bg-black/45 px-4 py-2 text-center font-black text-[clamp(15px,4vw,20px)]">
          🔎 แตะต้นเหตุของเหตุการณ์
        </div>

        {/* Scene */}
        <div className="relative mt-2 flex-1 overflow-hidden rounded-[26px] border border-white/10 bg-black/45 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-950 to-black" />

          {/* factory background blocks */}
          <div className="absolute inset-0 opacity-25">
            <div className="absolute left-4 top-8 h-28 w-20 rounded-2xl bg-orange-900" />
            <div className="absolute right-5 top-12 h-36 w-24 rounded-2xl bg-orange-800" />
            <div className="absolute bottom-9 left-8 h-20 w-28 rounded-2xl bg-yellow-900" />
            <div className="absolute bottom-24 right-8 h-16 w-24 rounded-2xl bg-slate-500" />
          </div>

          <div className="relative flex h-full min-h-[410px] flex-col p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="rounded-2xl border border-yellow-300/30 bg-black/70 px-3 py-2 font-black text-yellow-300 text-[clamp(14px,3.8vw,18px)]">
                {accidentCase.tag} #{String(accidentCase.id).padStart(2, "0")}
              </div>

              <div className="rounded-2xl bg-white/10 px-3 py-2 font-black text-white/70 text-[clamp(12px,3vw,15px)]">
                CASE {caseIndex + 1}
              </div>
            </div>

            <div className="mt-2 rounded-[22px] bg-black/60 px-4 py-3 text-center">
              <h2 className="font-black leading-tight text-[clamp(22px,6vw,31px)]">
                {accidentCase.title}
              </h2>
              <p className="mt-1 font-bold leading-snug text-white/75 text-[clamp(14px,3.7vw,18px)]">
                {accidentCase.description}
              </p>
            </div>

            {/* Tap scene area */}
            <div className="relative mt-3 flex-1 overflow-hidden rounded-[24px] border border-white/10 bg-slate-900/80">
              <div className="absolute inset-x-0 bottom-0 h-[42%] bg-slate-800/80" />
              <div className="absolute left-1/2 top-[18%] -translate-x-1/2 text-[clamp(60px,18vw,90px)] opacity-70">
                {accidentCase.sceneEmoji}
              </div>

              {accidentCase.hotspots.map((hotspot) => (
                <button
                  key={hotspot.id}
                  onClick={() => handleTapHotspot(hotspot)}
                  className={[
                    "absolute -translate-x-1/2 -translate-y-1/2 active:scale-90",
                    "grid place-items-center rounded-full border-4 shadow-2xl",
                    "h-[clamp(62px,17vw,86px)] w-[clamp(62px,17vw,86px)]",
                    result && hotspot.correct
                      ? "border-green-400 bg-green-500/90"
                      : "border-yellow-300 bg-black/70",
                  ].join(" ")}
                  style={{
                    left: `${hotspot.x}%`,
                    top: `${hotspot.y}%`,
                  }}
                >
                  <span className="text-[clamp(30px,9vw,46px)]">
                    {hotspot.emoji}
                  </span>
                </button>
              ))}

              {!result && (
                <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-yellow-400 px-3 py-2 text-center font-black text-black text-[clamp(15px,4vw,20px)]">
                  {accidentCase.prompt}
                </div>
              )}
            </div>

            {/* Result / Lesson */}
            {result ? (
              <div className="mt-3 rounded-[22px] border border-white/10 bg-black/70 p-3 text-center">
                <div
                  className={[
                    "font-black leading-none text-[clamp(28px,8vw,42px)]",
                    result.correct ? "text-green-400" : "text-red-400",
                  ].join(" ")}
                >
                  {result.correct ? "CORRECT! +30" : "WRONG! -30"}
                </div>

                <div className="mt-2 font-black text-yellow-300 text-[clamp(16px,4.5vw,22px)]">
                  LESSON LEARNED
                </div>

                <p className="mt-1 font-bold leading-snug text-white text-[clamp(14px,3.8vw,18px)]">
                  {accidentCase.lesson}
                </p>

                {!result.correct && (
                  <p className="mt-1 font-bold text-red-200 text-[clamp(13px,3.5vw,16px)]">
                    จุดที่ควรแตะคือ:{" "}
                    {accidentCase.hotspots.find((h) => h.correct)?.label}
                  </p>
                )}

                <button
                  onClick={handleNext}
                  className="mt-3 w-full rounded-2xl bg-green-600 py-3 font-black shadow-lg active:scale-95 text-[clamp(20px,5.5vw,28px)]"
                >
                  เคสต่อไป ▶
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}