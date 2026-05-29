import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TimerBar from "../components/TimerBar";
import ScorePopupLayer, { useScorePopup } from "../components/ScorePopup";
import PauseButton, { usePause } from "../components/PauseButton";

type ObjType = "SAFE" | "UA" | "UC";

type SpawnKind = "GROUND" | "HUMAN" | "OBJECT";
type PlacementZone = "WALL" | "CENTER" | "FLOOR" | "EDGE";

type SafetyObject = {
  id: string;
  label: string;
  image: string;
  type: ObjType;
  spawn: SpawnKind;
  size: number;
  collisionScale?: number;
  zone: PlacementZone;
};

type SceneObject = SafetyObject & {
  uid: string;
  x: number;
  y: number;
  removing?: boolean;
priority?: "PRIMARY" | "SECONDARY";
};

interface Props {
  onComplete?: (score: number) => void;
}

const GAME_DURATION = 90;
const CLEAR_SCORE = 300;
const POINTS_CORRECT = 50;
const POINTS_WRONG = -20;

const OBJECTS: SafetyObject[] = [
  // =========================
  // SAFE
  // =========================
  
  {
  id: "clean_floor",
  label: "พื้นสะอาด",
  image: "/assets/safety-grid/Safe/Clean Floor.png",
  type: "SAFE",
  spawn: "GROUND",
  size: 90,
  zone: "FLOOR",
  },
  
  {
  id: "clean_cable",
  label: "สายไฟเรียบร้อย",
  image: "/assets/safety-grid/Safe/clean-cable.png",
  type: "SAFE",
  spawn: "OBJECT",
  size: 82,
  zone: "EDGE",
  },
  
  {
  id: "emergency_shower",
  label: "ฝักบัวฉุกเฉินพร้อมใช้",
  image: "/assets/safety-grid/Safe/emergency-shower.png",
  type: "SAFE",
  spawn: "OBJECT",
  size: 92,
  zone: "WALL",
  },
  
  {
  id: "exit_door_ok",
  label: "ทางออกโล่ง",
  image: "/assets/safety-grid/Safe/Exit-door-ok.png",
  type: "SAFE",
  spawn: "OBJECT",
  size: 110,
  zone: "WALL",
  },
  
  {
  id: "fire_extinguisher",
  label: "ถังดับเพลิงพร้อมใช้",
  image: "/assets/safety-grid/Safe/fire-extinguisher.png",
  type: "SAFE",
  spawn: "OBJECT",
  size: 88,
  zone: "EDGE",
  },
  
  {
  id: "forklift_safety",
  label: "ขับโฟล์คลิฟท์ปลอดภัย",
  image: "/assets/safety-grid/Safe/Forklift-safety.png",
  type: "SAFE",
  spawn: "HUMAN",
  size: 118,
  zone: "CENTER",
  },
  
  {
  id: "ladder_safety",
  label: "ใช้บันไดถูกต้อง",
  image: "/assets/safety-grid/Safe/Ladder Safety.png",
  type: "SAFE",
  spawn: "HUMAN",
  size: 104,
  zone: "EDGE",
  },
  
  {
  id: "man_helmet",
  label: "ใส่ PPE ครบ",
  image: "/assets/safety-grid/Safe/Man Helmet.png",
  type: "SAFE",
  spawn: "HUMAN",
  size: 100,
  zone: "CENTER",
  },
  
  {
  id: "ppe_shelf",
  label: "ชั้น PPE",
  image: "/assets/safety-grid/Safe/PPE-shelf.png",
  type: "SAFE",
  spawn: "OBJECT",
  size: 92,
  zone: "WALL",
  },
  
  {
  id: "secure_barrel",
  label: "ถังเก็บปลอดภัย",
  image: "/assets/safety-grid/Safe/Secure-barrel.png",
  type: "SAFE",
  spawn: "OBJECT",
  size: 92,
  zone: "FLOOR",
  },
  
  {
  id: "worker_clipboard",
  label: "พนักงานตรวจเช็ก",
  image: "/assets/safety-grid/Safe/worker-checking-clipboard.png",
  type: "SAFE",
  spawn: "HUMAN",
  size: 102,
  zone: "CENTER",
  },
  
  // =========================
  // UNSAFE ACTION
  // =========================
  
  {
  id: "headphone",
  label: "ใส่หูฟังตอนทำงาน",
  image: "/assets/safety-grid/Unsafe Action/headphone.png",
  type: "UA",
  spawn: "HUMAN",
  size: 100,
  zone: "CENTER",
  },
  
  {
  id: "improper_lifting",
  label: "ยกของผิดท่า",
  image: "/assets/safety-grid/Unsafe Action/improper-lifting.png",
  type: "UA",
  spawn: "HUMAN",
  size: 110,
  collisionScale: 1.3,
  zone: "CENTER",
  },
  
  {
  id: "no_helmet",
  label: "ไม่ใส่หมวก",
  image: "/assets/safety-grid/Unsafe Action/No Helmet.png",
  type: "UA",
  spawn: "HUMAN",
  size: 100,
  zone: "CENTER",
  },
  
  {
  id: "phone_worker",
  label: "ใช้มือถือระหว่างทำงาน",
  image: "/assets/safety-grid/Unsafe Action/phone-worker.png",
  type: "UA",
  spawn: "HUMAN",
  size: 100,
  zone: "CENTER",
  },
  
  {
  id: "phone_worker2",
  label: "เดินใช้มือถือ",
  image: "/assets/safety-grid/Unsafe Action/phone-worker2.png",
  type: "UA",
  spawn: "HUMAN",
  size: 100,
  zone: "CENTER",
  },
  
  {
  id: "play_worker",
  label: "เล่นกันในพื้นที่ทำงาน",
  image: "/assets/safety-grid/Unsafe Action/play-worker.png",
  type: "UA",
  spawn: "HUMAN",
  size: 104,
  collisionScale: 1.4,
  zone: "CENTER",
  },
  
  {
  id: "play_worker2",
  label: "เล่นซิ่งในโรงงาน",
  image: "/assets/safety-grid/Unsafe Action/play-worker2.png",
  type: "UA",
  spawn: "HUMAN",
  size: 104,
  collisionScale: 1.4,
  zone: "CENTER",
  },
  
  {
  id: "running",
  label: "วิ่งในโรงงาน",
  image: "/assets/safety-grid/Unsafe Action/Running.png",
  type: "UA",
  spawn: "HUMAN",
  size: 112,
  zone: "CENTER",
  },
  
  {
  id: "sleeping",
  label: "หลับระหว่างงาน",
  image: "/assets/safety-grid/Unsafe Action/sleeping.png",
  type: "UA",
  spawn: "HUMAN",
  size: 108,
  zone: "CENTER",
  },
  
  {
  id: "smoke_man",
  label: "สูบบุหรี่",
  image: "/assets/safety-grid/Unsafe Action/smoke-man.png",
  type: "UA",
  spawn: "HUMAN",
  size: 102,
  zone: "EDGE",
  },
  
  {
  id: "wobbling_chair",
  label: "ยืนบนเก้าอี้",
  image: "/assets/safety-grid/Unsafe Action/wobbling-chair.png",
  type: "UA",
  spawn: "HUMAN",
  size: 110,
  zone: "EDGE",
  },
  
  {
  id: "worker_oncoffee",
  label: "ถือกาแฟตอนทำงาน",
  image: "/assets/safety-grid/Unsafe Action/worker-oncoffee.png",
  type: "UA",
  spawn: "HUMAN",
  size: 100,
  zone: "CENTER",
  },
  
  // =========================
  // UNSAFE CONDITION
  // =========================
  
  {
  id: "chemical_smoke",
  label: "ควันสารเคมี",
  image: "/assets/safety-grid/Unsafe Condition/chemical-smoke.png",
  type: "UC",
  spawn: "OBJECT",
  size: 100,
  zone: "EDGE",
  },
  
  {
  id: "cracked_floor",
  label: "พื้นแตก",
  image: "/assets/safety-grid/Unsafe Condition/cracked-floor.png",
  type: "UC",
  spawn: "GROUND",
  size: 96,
  zone: "FLOOR",
  },
  
  {
  id: "electric_wire",
  label: "สายไฟชำรุด",
  image: "/assets/safety-grid/Unsafe Condition/Electric wire spark.png",
  type: "UC",
  spawn: "OBJECT",
  size: 92,
  zone: "WALL",
  },
  
  {
  id: "exit_blocked",
  label: "ทางออกโดนบัง",
  image: "/assets/safety-grid/Unsafe Condition/exit-door-obs.png",
  type: "UC",
  spawn: "OBJECT",
  size: 116,
  zone: "WALL",
  },
  
  {
  id: "guardrail_broken",
  label: "ราวกันตกพัง",
  image: "/assets/safety-grid/Unsafe Condition/guardrail-broken.png",
  type: "UC",
  spawn: "OBJECT",
  size: 98,
  zone: "EDGE",
  },
  
  {
  id: "ladder_crack",
  label: "บันไดชำรุด",
  image: "/assets/safety-grid/Unsafe Condition/ladder-crack.png",
  type: "UC",
  spawn: "OBJECT",
  size: 98,
  zone: "EDGE",
  },
  
  {
  id: "leak_barrel",
  label: "สารเคมีรั่ว",
  image: "/assets/safety-grid/Unsafe Condition/leak-barrel.png",
  type: "UC",
  spawn: "OBJECT",
  size: 108,
  zone: "FLOOR",
  },
  
  {
  id: "light_broken",
  label: "ไฟเสีย",
  image: "/assets/safety-grid/Unsafe Condition/light-broken.png",
  type: "UC",
  spawn: "OBJECT",
  size: 88,
  zone: "WALL",
  },
  
  {
  id: "oil_spill",
  label: "น้ำมันหก",
  image: "/assets/safety-grid/Unsafe Condition/Oil Spilled.png",
  type: "UC",
  spawn: "GROUND",
  size: 94,
  zone: "FLOOR",
  },
  
  {
  id: "paddle",
  label: "แอ่งน้ำบนพื้น",
  image: "/assets/safety-grid/Unsafe Condition/paddle.png",
  type: "UC",
  spawn: "GROUND",
  size: 92,
  zone: "FLOOR",
  },
  
  {
  id: "unstable",
  label: "ของวางไม่มั่นคง",
  image: "/assets/safety-grid/Unsafe Condition/unstable.png",
  type: "UC",
  spawn: "OBJECT",
  size: 100,
  zone: "EDGE",
  },
  ];
  

function shuffle<T>(arr: T[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getYBySpawn(spawn: SpawnKind) {
  if (spawn === "GROUND") return rand(70, 84);
  if (spawn === "HUMAN") return rand(48, 72);
  return rand(35, 68);
}
const ZONE_SLOTS: Record<PlacementZone, { x: number; y: number }[]> = {
  WALL: [
    { x: 50, y: 18 }, // EXIT ONLY
  
    { x: 24, y: 22 },
    { x: 76, y: 22 },
  ],

  CENTER: [
    { x: 24, y: 45 },
    { x: 50, y: 48 },
    { x: 76, y: 45 },
    { x: 36, y: 58 },
    { x: 64, y: 58 },
  ],

  FLOOR: [
    { x: 24, y: 74 },
    { x: 50, y: 76 },
    { x: 76, y: 74 },
  ],

  EDGE: [
    { x: 16, y: 42 },
    { x: 84, y: 42 },
    { x: 18, y: 64 },
    { x: 82, y: 64 },
  ],
};

function getFootprint(obj: SafetyObject) {
  const wideIds = ["play_worker", "play_worker2", "forklift_safety", "exit_blocked"];

  const base =
    obj.spawn === "HUMAN"
      ? 15
      : obj.spawn === "GROUND"
      ? 17
      : 14;

  const extra = wideIds.includes(obj.id) ? 7 : 0;

  return {
    w: base + extra,
    h: obj.spawn === "GROUND" ? 13 : 16,
  };
}

function isOverlapping(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
) {
  return (
    Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
    Math.abs(a.y - b.y) < (a.h + b.h) / 2
  );
}

function makeScene(): SceneObject[] {
  const exitObjects = shuffle(
    OBJECTS.filter((o) => o.id === "exit_door_ok" || o.id === "exit_blocked")
  );
  
  const pickedExit = exitObjects[0];
  
  const safePool = shuffle(
    OBJECTS.filter((o) => o.type === "SAFE" && o.id !== "exit_door_ok")
  );
  
  const uaPool = shuffle(OBJECTS.filter((o) => o.type === "UA"));
  
  const ucPool = shuffle(
    OBJECTS.filter((o) => o.type === "UC" && o.id !== "exit_blocked")
  );
  
  const picked: SafetyObject[] = shuffle([
    pickedExit,
    ...safePool.slice(0, 2),
    ...uaPool.slice(0, 2),
    ...ucPool.slice(0, 1),
  ]);

  const placed: { x: number; y: number; w: number; h: number }[] = [];
  const result: SceneObject[] = [];

  picked.forEach((obj, index) => {
    const fp = getFootprint(obj);
    const slots =
  obj.id === "exit_door_ok" ||
  obj.id === "exit_blocked"
    ? [{ x: 50, y: 18 }]
    : obj.id === "fire_extinguisher"
    ? [
        { x: 18, y: 24 },
        { x: 82, y: 24 },
      ]
    : ZONE_SLOTS[obj.zone];

    let best = slots[index % slots.length];
    let found = false;

    for (let i = 0; i < 50; i++) {
      const base = slots[rand(0, slots.length - 1)];

      const x = base.x + rand(-4, 4);
      const y = base.y + rand(-3, 3);

      const box = { x, y, w: fp.w, h: fp.h };

      if (!placed.some((p) => isOverlapping(box, p))) {
        best = { x, y };
        placed.push(box);
        found = true;
        break;
      }
    }

    if (!found) {
      placed.push({
        x: best.x,
        y: best.y,
        w: fp.w,
        h: fp.h,
      });
    }

    const baseScale =
      obj.type === "SAFE"
        ? rand(125, 145) / 100
        : rand(145, 165) / 100;

    result.push({
      ...obj,
      priority: obj.type === "SAFE" ? "SECONDARY" : "PRIMARY",
      uid: `${obj.id}-${Date.now()}-${index}`,
      x: best.x,
      y: best.y,
      size: obj.size * baseScale,
    });
  });

  return result;
}

export default function InspectGridPrototype({ onComplete }: Props) {
  const [showIntro, setShowIntro] = useState(true);
  const [sceneObjects, setSceneObjects] = useState<SceneObject[]>(() => makeScene());
  const [selected, setSelected] = useState<SceneObject | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [msg, setMsg] = useState("หา Hazard ให้หมด แล้วระบบจะสุ่ม Scene ใหม่");
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
  
    setMsg("");
  }, []);

  useEffect(() => {
    if (showIntro || doneRef.current) return;

    if (hazardsLeft === 0) {
      const id = setTimeout(() => {
        nextScene();
      }, 500);

      return () => clearTimeout(id);
    }
  }, [hazardsLeft, nextScene, showIntro]);

  const answer = (type: ObjType) => {
    if (!selected || pausedRef.current || doneRef.current) return;

    if (selected.type === "SAFE") {
      const ns = Math.max(0, scoreRef.current + POINTS_WRONG);
      scoreRef.current = ns;
      setScore(ns);
      setMsg("ผิด! อันนี้ปลอดภัยอยู่แล้ว 😂");
      showPopup(`${POINTS_WRONG}`, "#ef4444", 50, 55);

      setFlashType("wrong");
      setScreenShake(true);
      setTimeout(() => setFlashType(null), 180);
      setTimeout(() => setScreenShake(false), 260);
    } else if (selected.type === type) {
      const ns = scoreRef.current + POINTS_CORRECT;
      scoreRef.current = ns;
      setScore(ns);
      setMsg(`ถูกต้อง! +${POINTS_CORRECT}`);
      showPopup(`+${POINTS_CORRECT}`, "#22c55e", selected.x, selected.y);

      setFlashType("correct");
      setTimeout(() => setFlashType(null), 160);

      setRemovingIds((prev) => [...prev, selected.uid]);

setTimeout(() => {
  setSceneObjects((prev) =>
    prev.filter((o) => o.uid !== selected.uid)
  );

  setRemovingIds((prev) =>
    prev.filter((id) => id !== selected.uid)
  );
}, 180);

      if (ns >= CLEAR_SCORE) {
        clearStage(ns);
        return;
      }
    } else {
      const ns = Math.max(0, scoreRef.current + POINTS_WRONG);
      scoreRef.current = ns;
      setScore(ns);
      setMsg("ผิดประเภท! ดูดี ๆ ก่อนตอบ");
      showPopup(`${POINTS_WRONG}`, "#fb923c", 50, 55);

      setFlashType("wrong");
      setScreenShake(true);
      setTimeout(() => setFlashType(null), 180);
      setTimeout(() => setScreenShake(false), 260);
    }

    setSelected(null);
  };

  const isPanicMode = timeLeft <= 10;

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
            style={{ fontSize: "clamp(1.4rem, 4vw, 1.05rem)" }}
          >
            จิ้มสิ่งที่ไม่ปลอดภัย แล้วเลือกให้ถูกว่าเป็น
            <div className="text-red-400 mt-2">Unsafe Action</div>
            <div className="text-orange-400">Unsafe Condition</div>
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
        <ScorePopupLayer popups={popups} />

        {flashType && (
          <div
            className={`absolute inset-0 z-20 pointer-events-none ${
              flashType === "correct" ? "bg-green-400/10" : "bg-red-500/15"
            }`}
          />
        )}

        <div className="flex-shrink-0 px-4 pt-5 pb-2">
          <div className="flex items-center justify-between mb-3">
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
            <button
  onPointerUp={() => {
    setSceneObjects(makeScene());
    setSelected(null);
  
    setBgIndex(rand(1, 4));
  
    setMsg("");
  }}
  className="
    px-5
    py-3
    rounded-2xl
    bg-cyan-500/20
    border
    border-cyan-400/40
    text-cyan-200
    font-game
    text-lg
    active:scale-95
    shadow-lg
  "
>
  🎲
</button>

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

          <div className="mt-2 flex justify-center">
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
                  ? "🚨 ผ่านแล้ว!"
                  : `🎯 อีก ${CLEAR_SCORE - score} คะแนนจะผ่าน!`}
              </span>
            </div>
          </div>

          {msg && (
  <div className="mt-3 flex justify-center">
    <div
      className="px-4 py-2 rounded-2xl bg-black/35 border border-white/10"
      style={{
        maxWidth: "92%",
      }}
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
<div className="flex-1 px-3 pb-3 relative">
  <div
    className={`
      relative
      w-full
      h-full
      overflow-hidden
      rounded-[2rem]
      border-2
      border-white/10
      transition-all
      duration-300
      ${isPanicMode ? "scale-[1.01]" : ""}
    `}
    style={{
      background: "#020617",
    }}
    
  >
    <img
  src={`/assets/safety-grid/Background/factory-zone-0${bgIndex}.png`}
  alt=""
  draggable={false}
  className="
    absolute
    inset-0
    w-full
    h-full
    object-fill
    pointer-events-none
    select-none
  "
/>

{/* DARK OVERLAY */}
<div
  className="absolute inset-0 pointer-events-none"
  style={{
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.12), rgba(2,6,23,0.18))",
  }}
/>

{/* ambient */}
<div
  className="absolute inset-0 pointer-events-none"
  style={{
    background:
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 30%)",
  }}
/>

{/* vignette */}
<div
  className="absolute inset-0 pointer-events-none"
  style={{
    background:
      "radial-gradient(circle at center, transparent 45%, rgba(0,0,0,0.28) 80%)",
  }}
/>
    <div
  className="
    absolute
    top-3
    right-3
    px-2.5
    py-1.5
    rounded-xl
    bg-black/45
    border
    border-yellow-300/25
    backdrop-blur-sm
    z-40
  "
>
  <div
    className="font-game font-bold text-yellow-300 leading-none flex items-baseline gap-1.5"
    style={{
      textShadow: "0 2px 0 rgba(0,0,0,0.65)",
    }}
  >
    <span
      style={{
        fontSize: "clamp(0.7rem, 3vw, 0.9rem)",
      }}
    >
      Hazard เหลือ:
    </span>

    <span
      style={{
        fontSize: "clamp(1.15rem, 5.2vw, 1.65rem)",
      }}
    >
      {hazardsLeft}
    </span>
  </div>
</div>
    {/* floor */}
    <div className="absolute left-0 right-0 bottom-0 h-[30%] bg-black/20 border-t border-white/10" />
    {/* objects */}
    {sceneObjects.map((obj) => {
      const isSelected = selected?.uid === obj.uid;
      const isDimmed =
        selected && selected.uid !== obj.uid;

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
    absolute
    inspect-hit
    overflow-visible
    touch-manipulation
    transition-all
    duration-150
    select-none

    ${
      selected?.uid === obj.uid
  ? `
      z-50
      scale-[1.08]
      brightness-125
      drop-shadow-[0_0_22px_rgba(250,204,21,0.55)]
    `
        : `
            z-10
          `
    }

    ${
      selected &&
      selected.uid !== obj.uid
        ? "opacity-75"
        : ""
    }

    ${
      removingIds.includes(obj.uid)
        ? "animate-[hazardPop_0.18s_ease-out_forwards]"
        : ""
    }
  `}
  style={{
    left: `${obj.x}%`,
    top: `${obj.y}%`,
    width: obj.size,
    height: obj.size,
    transform: `translate(-50%, -50%) ${
      isPanicMode ? "scale(1.04)" : "scale(1)"
    }`,
    zIndex: selected?.uid === obj.uid ? 50 : 10 + Math.round(obj.y),
  }}
>
  {/* SMALLER HITBOX */}
  <div
    className="
      absolute
      left-1/2
      top-1/2
      -translate-x-1/2
      -translate-y-1/2
    "
    style={{
      width:
        obj.size *
        (obj.spawn === "HUMAN"
          ? 0.62
          : obj.spawn === "GROUND"
          ? 0.82
          : 0.72),

      height:
        obj.size *
        (obj.spawn === "HUMAN"
          ? 0.62
          : obj.spawn === "GROUND"
          ? 0.82
          : 0.72),
    }}
  />

  {/* IMAGE */}
  <img
    src={obj.image}
    alt={obj.label}
    draggable={false}
    className="
      absolute
      inset-0
      w-full
      h-full
      overflow-visible
      object-contain
      pointer-events-none
      select-none
    "
  />

</button>
      );
    })}

    {/* panic overlay */}
    {isPanicMode && (
      <div className="absolute inset-0 pointer-events-none border-[3px] border-red-500/40 animate-pulse" />
    )}
  </div>
</div>
{selected && (
  <div className="flex-shrink-0 px-4 pb-3 pt-2 animate-[menuUp_0.16s_ease-out]">
    <div className="bg-black/85 rounded-3xl p-3 border border-white/15 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between mb-2">
      <div className="flex flex-col">
  <div
    className="font-game text-white/70 font-bold"
    style={{
      fontSize: "clamp(0.8rem, 3.6vw, 0.95rem)",
    }}
  >
    OBJECT
  </div>

  <div
    className="font-game text-white font-extrabold leading-tight"
    style={{
      fontSize: "clamp(1.05rem, 4.8vw, 1.35rem)",
      textShadow: "0 2px 0 rgba(0,0,0,0.5)",
    }}
  >
    {selected.label}
  </div>
</div>

        <button
          onPointerUp={() => setSelected(null)}
          className="w-9 h-9 rounded-full bg-white/10 text-white text-lg active:scale-90"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onPointerUp={() => answer("UA")}
          className="bg-red-600 rounded-2xl py-4 px-2 font-game font-black text-white active:scale-95 shadow-lg"
          style={{
            fontSize: "clamp(1rem, 4.8vw, 1.28rem)",
            textShadow: "0 2px 0 rgba(0,0,0,0.45)",
          }}
        >
          Unsafe
          <br />
          Action
        </button>

        <button
          onPointerUp={() => answer("UC")}
          className="bg-orange-500 rounded-2xl py-4 px-2 font-game font-black text-white active:scale-95 shadow-lg"
          style={{
            fontSize: "clamp(1rem, 4.8vw, 1.28rem)",
            textShadow: "0 2px 0 rgba(0,0,0,0.45)",
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
<div className="relative z-[99999]">
  {PauseOverlay}
</div>
      </div>
    </>
  );
}