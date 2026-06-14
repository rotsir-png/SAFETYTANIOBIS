import React, { useMemo, useState } from "react";
import { type ObjType, type SceneObject } from "../../data/stage2Objects";
import { rand, makeScene } from "../../data/stage2Scene";

type Props = {
  onComplete: (correct: boolean) => void;
  onBack: () => void;
};

const TARGET_HAZARDS = 3;

export default function SpotHazardTask({ onComplete, onBack }: Props) {
  const [sceneObjects, setSceneObjects] = useState<SceneObject[]>(() => makeScene());
  const [selected, setSelected] = useState<SceneObject | null>(null);
  const [bgIndex] = useState(rand(1, 4));
  const [foundCount, setFoundCount] = useState(0);
  const [msg, setMsg] = useState("ตรวจหน้างาน หา Hazard ให้ครบ 3 จุด");
  const [screenShake, setScreenShake] = useState(false);
  const [flashType, setFlashType] = useState<"correct" | "wrong" | null>(null);
  const [removingIds, setRemovingIds] = useState<string[]>([]);

  const hazardsLeft = useMemo(
    () => sceneObjects.filter((o) => o.type !== "SAFE").length,
    [sceneObjects]
  );

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

  const finishCorrect = () => {
    window.setTimeout(() => {
      onComplete(true);
    }, 220);
  };

  const answer = (type: ObjType) => {
    if (!selected) return;

    const current = selected;

    if (current.type === "SAFE") {
      setMsg("ผิด! อันนี้ปลอดภัยอยู่แล้ว");
      setFlashType("wrong");
      setScreenShake(true);

      window.setTimeout(() => setFlashType(null), 180);
      window.setTimeout(() => setScreenShake(false), 260);

      setSelected(null);
      onComplete(false);
      return;
    }

    if (current.type !== type) {
      setMsg("ผิดประเภท! ดูให้ดีว่าเป็น Action หรือ Condition");
      setFlashType("wrong");
      setScreenShake(true);

      window.setTimeout(() => setFlashType(null), 180);
      window.setTimeout(() => setScreenShake(false), 260);

      setSelected(null);
      onComplete(false);
      return;
    }

    setMsg("ถูกต้อง! ควบคุม Hazard แล้ว");
    setFlashType("correct");
    window.setTimeout(() => setFlashType(null), 160);

    setRemovingIds((prev) => [...prev, current.uid]);
    setSelected(null);

    const nextFound = foundCount + 1;
    setFoundCount(nextFound);

    window.setTimeout(() => {
      setSceneObjects((prev) => prev.filter((o) => o.uid !== current.uid));
      setRemovingIds((prev) => prev.filter((id) => id !== current.uid));

      if (nextFound >= TARGET_HAZARDS) {
        finishCorrect();
      }
    }, 180);
  };

  return (
    <div
      className={`
        flex h-full flex-col overflow-hidden select-none relative
        bg-gradient-to-b from-slate-800 to-slate-950
        ${screenShake ? "screen-shake" : ""}
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
            <div className="font-game text-white/50 text-xs">SAFETY OFFICER TASK</div>

            <div
              className="font-game text-white font-bold leading-tight"
              style={{
                fontSize: "clamp(1.1rem, 5vw, 1.45rem)",
                textShadow: "0 2px 0 rgba(0,0,0,0.35)",
              }}
            >
              🔍 AREA INSPECTION
              <div className="text-yellow-300">ตรวจหน้างาน</div>
            </div>
          </div>

          <div className="text-right">
            <div
              className="font-game text-yellow-400 font-bold"
              style={{ fontSize: "clamp(1.2rem, 6vw, 1.8rem)" }}
            >
              {foundCount}/{TARGET_HAZARDS}
            </div>
            <div className="font-game text-white/40 text-xs">FOUND</div>
          </div>
        </div>

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

            {selected && <div className="absolute inset-0 bg-black/20 pointer-events-none z-[5]" />}

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
                    transform: `translate(-50%, -50%) scale(${isSelected ? 1.08 : 1})`,
                    zIndex: isSelected ? 1300 : 10 + Math.round(obj.y),
                  }}
                >
                  <img
                    src={obj.image}
                    alt={obj.label}
                    draggable={false}
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
                Hazard:
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
        </div>
      </div>

      <button
        onClick={onBack}
        className="mx-3 mb-3 rounded-2xl bg-white/10 py-3 font-game text-white active:scale-95"
      >
        กลับไป Queue
      </button>
    </div>
  );
}