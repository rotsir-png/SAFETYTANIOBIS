import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TimerBar from "../components/TimerBar";
import ScorePopupLayer, { useScorePopup } from "../components/ScorePopup";
import PauseButton, { usePause } from "../components/PauseButton";
import { type ObjType, type SceneObject } from "../data/stage2Objects";
import { rand, makeScene } from "../data/stage2Scene";

interface Props {
  onComplete?: (score: number) => void;
}

const GAME_DURATION = 60;
const CLEAR_SCORE = 400;
const POINTS_CORRECT = 30;
const POINTS_WRONG = -30;

export default function Stage2PPERush({ onComplete }: Props) {
  const [showIntro, setShowIntro] = useState(true);
  const [sceneObjects, setSceneObjects] = useState<SceneObject[]>(() => makeScene());
  const [selected, setSelected] = useState<SceneObject | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [msg, setMsg] = useState("หา Hazard ให้หมด แล้วระบบจะสุ่มใหม่");
  const [bgIndex, setBgIndex] = useState(rand(1, 4));
  const [screenShake, setScreenShake] = useState(false);
  const [flashType, setFlashType] = useState<"correct" | "wrong" | null>(null);
  const [removingIds, setRemovingIds] = useState<string[]>([]);

  const scoreRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef(false);
  const pausedRef = useRef(false);

  const { popups, showPopup } = useScorePopup();

  const { paused, togglePause, PauseOverlay } = usePause({
    onGiveUp: () => {
      if (doneRef.current) return;
      doneRef.current = true;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      onComplete?.(0);
    },
  });

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const hazardsLeft = useMemo(
    () => sceneObjects.filter((o) => o.type !== "SAFE").length,
    [sceneObjects]
  );

  const isPanicMode = timeLeft <= 10;

  const selectedMenuStyle = selected
    ? (() => {
        const putRight = selected.x < 55;

        return {
          left: putRight ? "auto" : "10px",
          right: putRight ? "10px" : "auto",
          top: "50%",
          transform: "translateY(-50%)",
        } as React.CSSProperties;
      })()
    : null;

  const clearStage = useCallback(
    (finalScore: number) => {
      if (doneRef.current) return;

      doneRef.current = true;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      onComplete?.(finalScore);
    },
    [onComplete]
  );

  useEffect(() => {
    if (showIntro || doneRef.current) return;

    timerRef.current = setInterval(() => {
      if (pausedRef.current || doneRef.current) return;

      setTimeLeft((t) => {
        if (t <= 0.05) {
          clearStage(scoreRef.current);
          return 0;
        }

        return t - 0.05;
      });
    }, 50);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [showIntro, clearStage]);

  const nextScene = useCallback(() => {
    setSceneObjects(makeScene());
    setSelected(null);
    setBgIndex(rand(1, 4));
    setMsg("Scene ใหม่มาแล้ว หา Hazard ต่อ!");
  }, []);

  useEffect(() => {
    if (showIntro || doneRef.current) return;

    if (hazardsLeft === 0) {

      setMsg("เคลียร์ Scene! ระบบกำลังสุ่มใหม่");

      const id = setTimeout(() => {
        nextScene();
      }, 500);

      return () => clearTimeout(id);
    }
  }, [hazardsLeft, nextScene, showIntro]);

  const answer = (type: ObjType) => {
    if (!selected || pausedRef.current || doneRef.current) return;

    const current = selected;

    if (current.type === "SAFE") {
      const ns = Math.max(0, scoreRef.current + POINTS_WRONG);
      scoreRef.current = ns;
      setScore(ns);
      setMsg("ผิด! อันนี้ปลอดภัยอยู่แล้ว 😂");
      showPopup(`${POINTS_WRONG}`, "#ef4444", 50, 55);

      setFlashType("wrong");
      setScreenShake(true);
      setTimeout(() => setFlashType(null), 180);
      setTimeout(() => setScreenShake(false), 260);
      setSelected(null);
      return;
    }

    if (current.type === type) {
      const ns = scoreRef.current + POINTS_CORRECT;
      scoreRef.current = ns;
      setScore(ns);
      setMsg(`ถูกต้อง! +${POINTS_CORRECT}`);
      showPopup(`+${POINTS_CORRECT}`, "#22c55e", current.x, current.y);

      setFlashType("correct");
      setTimeout(() => setFlashType(null), 160);

      setRemovingIds((prev) => [...prev, current.uid]);
      setSelected(null);

      setTimeout(() => {
        setSceneObjects((prev) => prev.filter((o) => o.uid !== current.uid));
        setRemovingIds((prev) => prev.filter((id) => id !== current.uid));
      }, 180);

      return;
    }

    const ns = Math.max(0, scoreRef.current + POINTS_WRONG);
    scoreRef.current = ns;
    setScore(ns);
    setMsg("ผิดประเภท! ดูดี ๆ ก่อนตอบ");
    showPopup(`${POINTS_WRONG}`, "#fb923c", 50, 55);

    setFlashType("wrong");
    setScreenShake(true);
    setTimeout(() => setFlashType(null), 180);
    setTimeout(() => setScreenShake(false), 260);
    setSelected(null);
  };

  return (
    <>
      {showIntro && (
        <div
          onPointerUp={() => setShowIntro(false)}
          className="absolute inset-0 z-[999] flex flex-col items-center justify-center bg-black/85 px-6 text-center"
        >
          <div className="text-7xl mb-4">🔎</div>

          <div
            className="font-game text-yellow-300 font-bold"
            style={{
              fontSize: "clamp(1.5rem, 7vw, 2.1rem)",
              textShadow: "0 3px 0 rgba(0,0,0,0.45)",
            }}
          >
            ตรวจโรงงาน!
          </div>

          <div
  className="font-game text-white/85 mt-3 leading-relaxed"
  style={{ fontSize: "clamp(0.98rem, 4vw, 1.18rem)" }}
>
  <div>1) จิ้มสิ่งที่ไม่ปลอดภัยในภาพ</div>
  <div>2) เลือกประเภทให้ถูก</div>

  <div className="mt-3 grid grid-cols-2 gap-2">
    <div className="rounded-xl bg-red-500/20 border border-red-400/40 px-2 py-2">
      <div className="text-red-300 font-bold">Unsafe Action</div>
      <div className="text-white/70" style={{ fontSize: "clamp(0.78rem, 3.2vw, 0.95rem)" }}>
        การกระทำไม่ปลอดภัย
      </div>
    </div>

    <div className="rounded-xl bg-orange-500/20 border border-orange-400/40 px-2 py-2">
      <div className="text-orange-300 font-bold">Unsafe Condition</div>
      <div className="text-white/70" style={{ fontSize: "clamp(0.78rem, 3.2vw, 0.95rem)" }}>
        สภาพแวดล้อมไม่ปลอดภัย
      </div>
    </div>
  </div>

  <div className="mt-3 rounded-2xl bg-black/35 border border-white/10 px-3 py-2">
    <div className="text-green-300 font-bold">ตอบถูก +30 คะแนน</div>
    <div className="text-red-300 font-bold">ตอบผิด -30 คะแนน</div>
    <div className="text-yellow-300 font-bold">ผ่านด่านที่ 400 คะแนน</div>
    <div className="text-white/65" style={{ fontSize: "clamp(0.78rem, 3.2vw, 0.95rem)" }}>
      เล่นต่อได้จนหมดเวลา
    </div>
  </div>
</div>

          <div
            className="mt-10 px-5 py-3 rounded-2xl animate-pulse"
            style={{
              background: "rgba(250,204,21,0.16)",
              border: "2px solid rgba(250,204,21,0.45)",
            }}
          >
            <div
              className="font-game text-yellow-300 font-bold"
              style={{ fontSize: "clamp(1.1rem, 5vw, 1.45rem)" }}
            >
              👆 แตะเพื่อเริ่ม!
            </div>
          </div>
        </div>
      )}

      <div
        className={`
          flex flex-col h-full overflow-hidden select-none relative
          bg-gradient-to-b from-slate-800 to-slate-950
          ${screenShake ? "screen-shake" : ""}
          ${isPanicMode ? "panic-mode" : ""}
        `}
      >
        {flashType && (
          <div
            className={`absolute inset-0 z-20 pointer-events-none ${
              flashType === "correct" ? "bg-green-400/10" : "bg-red-500/15"
            }`}
          />
        )}

<div className="flex-shrink-0 px-4 pt-2 pb-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-game text-white/50 text-xs">ด่าน 2</div>

              <div
                className="font-game text-white font-bold leading-tight"
                style={{
                  fontSize: "clamp(1.1rem, 5vw, 1.45rem)",
                  textShadow: "0 2px 0 rgba(0,0,0,0.35)",
                }}
              >
                Inspect Scene
                <div className="text-yellow-300">หา hazard ให้หมด</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <PauseButton paused={paused} onToggle={togglePause} />

              <div className="text-right">
                <div
                  className="font-game text-yellow-400 font-bold"
                  style={{ fontSize: "clamp(1.2rem, 6vw, 1.8rem)" }}
                >
                  {score}
                </div>
                <div className="font-game text-white/40 text-xs">คะแนน</div>
              </div>
            </div>
          </div>

          <TimerBar timeLeft={timeLeft} totalTime={GAME_DURATION} />

          <div className="mt-1 flex justify-center">
            <div
              className="rounded-xl px-3 py-1.5"
              style={{
                background:
                  score >= CLEAR_SCORE
                    ? "rgba(250,204,21,0.22)"
                    : "rgba(255,255,255,0.08)",
                border:
                  score >= CLEAR_SCORE
                    ? "1px solid rgba(250,204,21,0.5)"
                    : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span
                className="font-game font-bold"
                style={{
                  color: score >= CLEAR_SCORE ? "#fde047" : "rgba(255,255,255,0.9)",
                  fontSize: "clamp(0.9rem,4vw,1.1rem)",
                  textShadow: "0 2px 0 rgba(0,0,0,0.45)",
                }}
              >
                {score >= CLEAR_SCORE
                  ? "🚨 คะแนนผ่านแล้ว เล่นต่อเพื่อทำคะแนนเพิ่ม!"
                  : `🎯 อีก ${CLEAR_SCORE - score} คะแนนจะผ่าน!`}
              </span>
            </div>
          </div>

          {msg && (
            <div className="mt-1 flex justify-center">
              <div
                className="px-4 py-2 rounded-2xl bg-black/35 border border-white/10"
                style={{ maxWidth: "94%" }}
              >
                <div
                  className="font-game text-white font-bold text-center leading-snug"
                  style={{
                    fontSize: "clamp(0.95rem, 4.2vw, 1.15rem)",
                    textShadow: "0 2px 0 rgba(0,0,0,0.45)",
                  }}
                >
                  {msg}
                </div>
              </div>
            </div>
          )}

          {isPanicMode && (
            <div className="font-game text-red-300 text-center text-xs mt-1 animate-pulse">
              เหลือเวลาอีกนิดเดียว!
            </div>
          )}
        </div>

        <div className="flex-1 px-1 pb-1 relative min-h-0">
          <div className="relative w-full h-full overflow-hidden rounded-[1.25rem] border-2 border-white/10 bg-slate-950">
            <div className="absolute inset-0 transition-opacity duration-150">
              <img
                src={`/assets/safety-grid/Background/factory-zone-0${bgIndex}.png`}
                alt=""
                draggable={false}
                className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
              />

              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(15,23,42,0.12), rgba(2,6,23,0.18))",
                }}
              />

              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 30%)",
                }}
              />

              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at center, transparent 45%, rgba(0,0,0,0.28) 80%)",
                }}
              />

              <div className="absolute left-0 right-0 bottom-0 h-[30%] bg-black/20 border-t border-white/10" />
              {selected && (
  <div className="absolute inset-0 bg-black/20 pointer-events-none z-[5]" />
)}
              {sceneObjects.map((obj) => {
                const isSelected = selected?.uid === obj.uid;

                return (
                  <button
                    key={obj.uid}
                    onPointerUp={() => {
                      if (selected?.uid === obj.uid) {
                        setSelected(null);
                        return;
                      }

                      setSelected(obj);
                    }}
                    className={`
                      absolute inspect-hit overflow-visible touch-manipulation
                      transition-all duration-150 select-none
                      ${
                        isSelected
                          ? "brightness-125 drop-shadow-[0_0_28px_rgba(255,230,0,0.95)]"
                          : ""
                      }
                      ${selected && !isSelected ? "opacity-25 saturate-50" : ""}
                      ${
                        removingIds.includes(obj.uid)
                          ? "animate-[hazardPop_0.18s_ease-out_forwards]"
                          : ""
                      }
                    `}
                    style={{
                      left: `${obj.x}%`,
                      top: `${obj.y}%`,
                      width:
                        obj.size *
                        (obj.spawn === "HUMAN"
                          ? 0.5
                          : obj.spawn === "GROUND"
                            ? 0.75
                            : 0.58),
                      height:
                        obj.size *
                        (obj.spawn === "HUMAN"
                          ? 0.72
                          : obj.spawn === "GROUND"
                            ? 0.55
                            : 0.68),
                      transform: `translate(-50%, -50%) scale(${
                        isSelected ? 1.08 : isPanicMode ? 1.04 : 1
                      })`,
                      zIndex: isSelected ? 1300 : 10 + Math.round(obj.y),
                    }}
                  >
                    <img
  src={encodeURI(obj.image)}
  alt={obj.label}
  draggable={false}
  loading="eager"
  onError={(e) => {
    console.error("IMAGE FAIL", obj.image, encodeURI(obj.image));
  }}
                      className="absolute left-1/2 top-1/2 object-contain pointer-events-none select-none"
                      style={{
                        width: obj.size,
                        height: obj.size,
                        maxWidth: "none",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  </button>
                );
              })}
            </div>

            <div className="absolute top-3 right-3 px-2.5 py-1.5 rounded-xl bg-black/55 border border-yellow-300/25 backdrop-blur-sm z-40">
              <div
                className="font-game font-bold text-yellow-300 leading-none flex items-baseline gap-1.5"
                style={{ textShadow: "0 2px 0 rgba(0,0,0,0.65)" }}
              >
                <span style={{ fontSize: "clamp(0.7rem, 3vw, 0.9rem)" }}>
                  Hazard เหลือ:
                </span>

                <span style={{ fontSize: "clamp(1.15rem, 5.2vw, 1.65rem)" }}>
                  {hazardsLeft}
                </span>
              </div>
            </div>

            {selected && selectedMenuStyle && (
              <div
              className="absolute z-[1100] w-[clamp(170px,42vw,210px)]"
                style={selectedMenuStyle}
              >
                <div
                  className="rounded-[1.15rem] px-2 py-1.5 border border-white/15 shadow-2xl backdrop-blur-md"
                  style={{
                    background: "rgba(0,0,0,0.78)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <div
                        className="font-game text-white/60 font-bold"
                        style={{ fontSize: "clamp(0.55rem, 2.2vw, 0.7rem)" }}
                      >
                        OBJECT
                      </div>

                      <div
                        className="font-game text-white font-extrabold leading-tight break-words"
                        style={{
                          fontSize: "clamp(1.25rem, 5vw, 1.55rem)",
lineHeight: 1.15,
                          textShadow: "0 2px 0 rgba(0,0,0,0.5)",
                        }}
                      >
                        {selected.label}
                      </div>
                    </div>

                    <button
                      onPointerUp={() => setSelected(null)}
                      className="shrink-0 w-8 h-8 rounded-full bg-white/15 text-white text-lg active:scale-90"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onPointerUp={() => answer("UA")}
                      className="bg-red-600 rounded-xl py-2.5 px-2 font-game font-black text-white active:scale-95 shadow-lg leading-tight"
                      style={{
                        fontSize: "clamp(1.45rem, 6vw, 1.8rem)",
                        textShadow: "0 2px 0 rgba(0,0,0,0.45)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Unsafe
                      <br />
                      Action
                    </button>

                    <button
                      onPointerUp={() => answer("UC")}
                      className="bg-orange-500 rounded-xl py-2.5 px-2 font-game font-black text-white active:scale-95 shadow-lg leading-tight"
                      style={{
                        fontSize: "clamp(1.45rem, 6vw, 1.8rem)",
                        textShadow: "0 2px 0 rgba(0,0,0,0.45)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Unsafe
                      <br />
                      Condition
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isPanicMode && (
              <div className="absolute inset-0 pointer-events-none border-[3px] border-red-500/40 animate-pulse" />
            )}
          </div>
        </div>

        <div className="fixed inset-0 z-[9998] pointer-events-none">
          <ScorePopupLayer popups={popups} />
        </div>

        <div className="relative z-[99999]">{PauseOverlay}</div>
      </div>
    </>
  );
}