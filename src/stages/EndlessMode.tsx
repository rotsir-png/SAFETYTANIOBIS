import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ScorePopupLayer, { useScorePopup } from "../components/ScorePopup";
import PauseButton, { usePause } from "../components/PauseButton";
import { swipeCards } from "../gameData";
import { type ObjType, type SceneObject } from "../data/stage2Objects";
import { rand, makeScene } from "../data/stage2Scene";
import { stage3Cases } from "../data/stage3Cases";
import { getEndlessHighScore, saveEndlessHighScore } from "../storage";

type Props = {
  onComplete: (score: number, highScore: number) => void;
  onExit?: () => void;
};

type EventType = "PPE" | "HAZARD" | "INCIDENT";
type Phase = "event" | "perk";

type SwipeCard = {
  id: number;
  label: string;
  emoji: string;
  isSafe: boolean;
};

type PerkId =
  | "EXTRA_HEART"
  | "SAFETY_SHIELD"
  | "LAST_GUARD"
  | "PPE_FOCUS"
  | "PPE_FORGIVE"
  | "PPE_FREQ"
  | "SHARP_EYE"
  | "LESS_DECOY"
  | "HAZARD_BONUS"
  | "CASE_READER"
  | "EVIDENCE_SENSE"
  | "CASE_RECOVERY";

type Perk = {
  id: PerkId;
  icon: string;
  title: string;
  desc: string;
};

const MAX_HEARTS = 5;
const PERK_EVERY = 10;
const SWIPE_THRESHOLD = 70;

const PERKS: Perk[] = [
  {
    id: "EXTRA_HEART",
    icon: "❤️",
    title: "+1 HEART",
    desc: "ฟื้นหัวใจทันที 1 ดวง ไม่เกิน 5",
  },
  {
    id: "SAFETY_SHIELD",
    icon: "🛡️",
    title: "SAFETY SHIELD",
    desc: "กันพลาด 1 ครั้ง ใช้แล้วหาย",
  },
  {
    id: "LAST_GUARD",
    icon: "🚨",
    title: "LAST GUARD",
    desc: "ถ้าเหลือ 1 หัวใจ พลาดครั้งถัดไปไม่ตาย",
  },
  {
    id: "PPE_FOCUS",
    icon: "🦺",
    title: "PPE FOCUS",
    desc: "PPE Event ได้คะแนนมากขึ้น",
  },
  {
    id: "PPE_FORGIVE",
    icon: "⛑️",
    title: "PPE FORGIVE",
    desc: "พลาด PPE ครั้งถัดไปไม่ตัด Combo",
  },
  {
    id: "PPE_FREQ",
    icon: "🎯",
    title: "PPE FREQUENCY",
    desc: "PPE Event มีโอกาสออกบ่อยขึ้น",
  },
  {
    id: "SHARP_EYE",
    icon: "🔎",
    title: "SHARP EYE",
    desc: "Hazard ดูเด่นขึ้น แตะง่ายขึ้น",
  },
  {
    id: "LESS_DECOY",
    icon: "👀",
    title: "LESS DECOY",
    desc: "Hazard Event มีของหลอกน้อยลง",
  },
  {
    id: "HAZARD_BONUS",
    icon: "⚠️",
    title: "HAZARD BONUS",
    desc: "Hazard Event ได้คะแนนมากขึ้น",
  },
  {
    id: "CASE_READER",
    icon: "📋",
    title: "CASE READER",
    desc: "Incident Event มีเวลาอ่านเพิ่ม",
  },
  {
    id: "EVIDENCE_SENSE",
    icon: "📌",
    title: "EVIDENCE SENSE",
    desc: "หลักฐานในเคสเด่นขึ้น กดง่ายขึ้น",
  },
  {
    id: "CASE_RECOVERY",
    icon: "🩹",
    title: "CASE RECOVERY",
    desc: "ผ่าน Incident มีโอกาสฟื้นหัวใจ",
  },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hasPerk(perks: PerkId[], id: PerkId) {
  return perks.includes(id);
}

function getComboMultiplier(combo: number) {
  if (combo >= 50) return 1.5;
  if (combo >= 40) return 1.4;
  if (combo >= 30) return 1.3;
  if (combo >= 20) return 1.2;
  if (combo >= 10) return 1.1;
  return 1;
}

function getDifficulty(eventCount: number) {
  if (eventCount >= 60) return 4;
  if (eventCount >= 40) return 3;
  if (eventCount >= 20) return 2;
  return 1;
}

function getEventTime(type: EventType, eventCount: number, perks: PerkId[]) {
  const difficulty = getDifficulty(eventCount);

  if (type === "PPE") return Math.max(4.2, 7.5 - difficulty * 0.7);
  if (type === "HAZARD") return Math.max(6.5, 11 - difficulty * 0.8);

  const bonus = hasPerk(perks, "CASE_READER") ? 4 : 0;
  return Math.max(9, 13 + bonus - difficulty * 0.4);
}

function getBaseScore(type: EventType) {
  if (type === "PPE") return 50;
  if (type === "HAZARD") return 80;
  return 100;
}

function getWeightedEvent(perks: PerkId[], previous?: EventType): EventType {
  const pool: EventType[] = [
    "PPE",
    "PPE",
    "PPE",
    "HAZARD",
    "HAZARD",
    "HAZARD",
    "INCIDENT",
    "INCIDENT",
  ];

  if (hasPerk(perks, "PPE_FREQ")) pool.push("PPE", "PPE", "PPE");

  const filtered = pool.filter((x) => x !== previous);
  return pick(filtered.length ? filtered : pool);
}

export default function EndlessMode({ onComplete, onExit }: Props) {
  const [phase, setPhase] = useState<Phase>("event");
  const [eventType, setEventType] = useState<EventType>("PPE");
  const [previousEventType, setPreviousEventType] = useState<EventType | undefined>();
  const [eventKey, setEventKey] = useState(1);

  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(7);
  const [activePerks, setActivePerks] = useState<PerkId[]>([]);
  const [perkChoices, setPerkChoices] = useState<Perk[]>([]);

  const [shieldCount, setShieldCount] = useState(0);
  const [lastGuardReady, setLastGuardReady] = useState(false);
  const [ppeForgiveReady, setPpeForgiveReady] = useState(false);

  const [screenShake, setScreenShake] = useState(false);
  const [flashType, setFlashType] = useState<"correct" | "wrong" | null>(null);
  const [banner, setBanner] = useState("SURVIVE THE ENDLESS SAFETY RUN");

  const doneRef = useRef(false);
  const pausedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { popups, showPopup } = useScorePopup();

  const { paused, togglePause, PauseOverlay } = usePause({
    onGiveUp: () => {
      if (doneRef.current) return;
      finishRun();
    },
  });

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const difficulty = getDifficulty(eventCount);
  const comboMultiplier = getComboMultiplier(combo);

  const finishRun = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const oldHigh = getEndlessHighScore();
    const highScore = Math.max(oldHigh, score);

    if (score > oldHigh) {
      saveEndlessHighScore(score);
    }

    onComplete(score, highScore);
  }, [onComplete, score]);

  const startNextEvent = useCallback(
    (nextPerks = activePerks) => {
      const next = getWeightedEvent(nextPerks, previousEventType);
      setPreviousEventType(next);
      setEventType(next);
      setTimeLeft(getEventTime(next, eventCount, nextPerks));
      setEventKey((k) => k + 1);
      setPhase("event");

      if (next === "PPE") setBanner("ปัดให้ถูก: SAFE ไปขวา / UNSAFE ไปซ้าย");
      if (next === "HAZARD") setBanner("จิ้ม Hazard แล้วเลือกประเภทให้ถูก");
      if (next === "INCIDENT") setBanner("อ่านเคสสั้น ๆ แล้วเปิดหลักฐานให้ทัน");
    },
    [activePerks, eventCount, previousEventType]
  );

  const openPerkSelect = useCallback(() => {
    const choices = shuffle(PERKS).slice(0, 3);
    setPerkChoices(choices);
    setPhase("perk");
    setBanner("เลือก Perk สำหรับ Run นี้");
  }, []);

  const completeEvent = useCallback(
    (type: EventType, message = "CLEAR") => {
      if (doneRef.current || phase !== "event") return;

      const base = getBaseScore(type);
      const perkBonus =
        (type === "PPE" && hasPerk(activePerks, "PPE_FOCUS")) ||
        (type === "HAZARD" && hasPerk(activePerks, "HAZARD_BONUS"))
          ? 1.5
          : 1;

      const gained = Math.round(base * comboMultiplier * perkBonus);
      const nextScore = score + gained;
      const nextCombo = combo + 1;
      const nextEventCount = eventCount + 1;

      setScore(nextScore);
      setCombo(nextCombo);
      setEventCount(nextEventCount);
      setFlashType("correct");
      setBanner(`${message} +${gained}`);
      showPopup(`+${gained}`, "#22c55e", 50, 50);

      if (
        type === "INCIDENT" &&
        hasPerk(activePerks, "CASE_RECOVERY") &&
        hearts < MAX_HEARTS &&
        Math.random() < 0.35
      ) {
        setHearts((h) => Math.min(MAX_HEARTS, h + 1));
        showPopup("HEART +1", "#fb7185", 50, 62);
      }

      window.setTimeout(() => setFlashType(null), 180);

      window.setTimeout(() => {
        if (doneRef.current) return;

        if (nextEventCount > 0 && nextEventCount % PERK_EVERY === 0) {
          openPerkSelect();
          return;
        }

        startNextEvent();
      }, 420);
    },
    [
      activePerks,
      combo,
      comboMultiplier,
      eventCount,
      hearts,
      openPerkSelect,
      phase,
      score,
      showPopup,
      startNextEvent,
    ]
  );

  const failEvent = useCallback(
    (type: EventType, reason = "MISS") => {
      if (doneRef.current || phase !== "event") return;

      if (type === "PPE" && ppeForgiveReady) {
        setPpeForgiveReady(false);
        setBanner("PPE FORGIVE! Combo ยังไม่แตก");
        showPopup("FORGIVE", "#facc15", 50, 52);
        window.setTimeout(() => startNextEvent(), 450);
        return;
      }

      if (shieldCount > 0) {
        setShieldCount((x) => x - 1);
        setBanner("SAFETY SHIELD กันพลาดให้แล้ว");
        showPopup("SHIELD", "#38bdf8", 50, 52);
        window.setTimeout(() => startNextEvent(), 450);
        return;
      }

      if (hearts <= 1 && lastGuardReady) {
        setLastGuardReady(false);
        setBanner("LAST GUARD! รอดหวุดหวิด");
        showPopup("LAST GUARD", "#facc15", 50, 52);
        window.setTimeout(() => startNextEvent(), 450);
        return;
      }

      const nextHearts = hearts - 1;

      setHearts(nextHearts);
      setCombo(0);
      setFlashType("wrong");
      setScreenShake(true);
      setBanner(`${reason} -1 HEART`);
      showPopup("-1 HEART", "#ef4444", 50, 52);

      window.setTimeout(() => {
        setFlashType(null);
        setScreenShake(false);
      }, 220);

      window.setTimeout(() => {
        if (nextHearts <= 0) {
          finishRun();
          return;
        }

        const nextEventCount = eventCount + 1;
        setEventCount(nextEventCount);

        if (nextEventCount > 0 && nextEventCount % PERK_EVERY === 0) {
          openPerkSelect();
          return;
        }

        startNextEvent();
      }, 520);
    },
    [
      eventCount,
      finishRun,
      hearts,
      lastGuardReady,
      openPerkSelect,
      phase,
      ppeForgiveReady,
      shieldCount,
      showPopup,
      startNextEvent,
    ]
  );

  useEffect(() => {
    if (phase !== "event" || doneRef.current) return;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (pausedRef.current || doneRef.current) return;

      setTimeLeft((t) => {
        if (t <= 0.05) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          window.setTimeout(() => failEvent(eventType, "TIME OUT"), 0);
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
  }, [eventKey, eventType, failEvent, phase]);

  const choosePerk = (perk: Perk) => {
    let nextPerks = activePerks;

    if (perk.id !== "EXTRA_HEART") {
      nextPerks = [...activePerks, perk.id];
      setActivePerks(nextPerks);
    }

    if (perk.id === "EXTRA_HEART") {
      setHearts((h) => Math.min(MAX_HEARTS, h + 1));
    }

    if (perk.id === "SAFETY_SHIELD") {
      setShieldCount((x) => x + 1);
    }

    if (perk.id === "LAST_GUARD") {
      setLastGuardReady(true);
    }

    if (perk.id === "PPE_FORGIVE") {
      setPpeForgiveReady(true);
    }

    setBanner(`${perk.title} พร้อมใช้งาน`);
    startNextEvent(nextPerks);
  };

  useEffect(() => {
    startNextEvent(activePerks);
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden select-none ${
        screenShake ? "screen-shake" : ""
      }`}
      style={{
        background:
          "radial-gradient(circle at top, #145b6b 0%, #071827 42%, #030712 100%)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full"
          style={{ background: "rgba(45,170,190,0.18)", filter: "blur(12px)" }}
        />
        <div
          className="absolute top-24 right-[-90px] h-64 w-64 rounded-full"
          style={{ background: "rgba(255,255,255,0.07)", filter: "blur(14px)" }}
        />
      </div>

      {flashType && (
        <div
          className={`absolute inset-0 z-20 pointer-events-none ${
            flashType === "correct" ? "bg-green-400/10" : "bg-red-500/15"
          }`}
        />
      )}

      <div className="relative z-10 flex-shrink-0 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="font-game text-white/45 text-xs">ENDLESS MODE</div>
            <div
              className="font-game font-black leading-tight text-white"
              style={{
                fontSize: "clamp(1.25rem, 5.5vw, 1.7rem)",
                textShadow: "0 3px 0 rgba(0,0,0,0.55)",
              }}
            >
              SAFETY RUN
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PauseButton paused={paused} onToggle={togglePause} />

            {onExit && (
              <button
                onClick={onExit}
                className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 font-game text-sm font-bold text-white active:scale-95"
              >
                ออก
              </button>
            )}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <HudBox label="HEART" value={"❤️".repeat(hearts) || "💀"} />
          <HudBox label="SCORE" value={score.toString()} />
          <HudBox label="COMBO" value={`x${comboMultiplier.toFixed(1)}`} />
        </div>

        <div className="mt-2 h-3 overflow-hidden rounded-full border border-white/10 bg-black/35">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.max(0, Math.min(100, (timeLeft / getEventTime(eventType, eventCount, activePerks)) * 100))}%`,
              background:
                timeLeft <= 3
                  ? "linear-gradient(90deg,#ef4444,#f97316)"
                  : "linear-gradient(90deg,#22c55e,#2DAABE)",
            }}
          />
        </div>

        <div className="mt-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-center">
          <div
            className="font-game font-black text-yellow-300 leading-snug"
            style={{ fontSize: "clamp(0.95rem,4vw,1.15rem)" }}
          >
            {banner}
          </div>
          <div className="mt-1 font-game text-white/45 text-xs">
            Event {eventCount + 1} • Difficulty {difficulty}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 min-h-0 px-3 pb-3">
        {phase === "perk" ? (
          <PerkSelect choices={perkChoices} onChoose={choosePerk} />
        ) : (
          <div className="h-full">
            {eventType === "PPE" && (
              <PpeEvent
                key={eventKey}
                onSuccess={() => completeEvent("PPE", "PPE CLEAR")}
                onFail={() => failEvent("PPE", "WRONG SWIPE")}
              />
            )}

            {eventType === "HAZARD" && (
              <HazardEvent
                key={eventKey}
                difficulty={difficulty}
                sharpEye={hasPerk(activePerks, "SHARP_EYE")}
                lessDecoy={hasPerk(activePerks, "LESS_DECOY")}
                onSuccess={() => completeEvent("HAZARD", "HAZARD CLEAR")}
                onFail={() => failEvent("HAZARD", "WRONG ANSWER")}
              />
            )}

            {eventType === "INCIDENT" && (
              <IncidentEvent
                key={eventKey}
                evidenceSense={hasPerk(activePerks, "EVIDENCE_SENSE")}
                onSuccess={() => completeEvent("INCIDENT", "CASE CLEAR")}
              />
            )}
          </div>
        )}
      </div>

      <ScorePopupLayer popups={popups} />
      <PauseOverlay />

      <style>{`
        @keyframes endlessPop {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .endless-pop {
          animation: endlessPop 0.18s ease-out both;
        }
      `}</style>
    </div>
  );
}

function HudBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-2 py-2 text-center">
      <div className="font-game text-white/45 text-[10px]">{label}</div>
      <div
        className="font-game font-black text-white leading-tight"
        style={{
          fontSize: "clamp(0.95rem,4.2vw,1.25rem)",
          textShadow: "0 2px 0 rgba(0,0,0,0.45)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PerkSelect({
  choices,
  onChoose,
}: {
  choices: Perk[];
  onChoose: (perk: Perk) => void;
}) {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="text-center">
        <div
          className="font-game font-black text-yellow-300"
          style={{
            fontSize: "clamp(1.55rem,7vw,2.2rem)",
            textShadow: "0 4px 0 rgba(0,0,0,0.6)",
          }}
        >
          เลือก PERK
        </div>
        <div className="font-game text-white/60 text-sm">
          ครบ 10 Event แล้ว เลือก 1 ใบ
        </div>
      </div>

      {choices.map((perk) => (
        <button
          key={perk.id}
          onClick={() => onChoose(perk)}
          className="endless-pop w-full rounded-[24px] border-2 border-yellow-300/50 bg-slate-950/90 p-4 text-left shadow-[0_8px_0_rgba(0,0,0,0.45)] active:scale-95"
        >
          <div className="flex items-center gap-3">
            <div className="text-4xl">{perk.icon}</div>
            <div className="min-w-0">
              <div
                className="font-game font-black text-yellow-300"
                style={{ fontSize: "clamp(1.1rem,5vw,1.45rem)" }}
              >
                {perk.title}
              </div>
              <div
                className="font-game font-bold text-white leading-snug"
                style={{ fontSize: "clamp(0.95rem,4vw,1.1rem)" }}
              >
                {perk.desc}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function PpeEvent({
  onSuccess,
  onFail,
}: {
  onSuccess: () => void;
  onFail: () => void;
}) {
  const card = useMemo(() => pick(swipeCards as SwipeCard[]), []);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);

  const finishSwipe = (x: number) => {
    if (Math.abs(x) < SWIPE_THRESHOLD) {
      setDragX(0);
      return;
    }

    const direction = x > 0 ? "right" : "left";
    const correct = direction === "right" ? card.isSafe : !card.isSafe;

    if (correct) onSuccess();
    else onFail();
  };

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="mb-3 grid w-full grid-cols-2 gap-2">
        <div className="rounded-2xl bg-red-600/80 py-3 text-center font-game font-black text-white shadow-lg">
          ⬅ UNSAFE
        </div>
        <div className="rounded-2xl bg-green-600/80 py-3 text-center font-game font-black text-white shadow-lg">
          SAFE ➡
        </div>
      </div>

      <div
        className="touch-none w-full max-w-[330px] rounded-[32px] border-4 border-white/15 bg-white p-5 text-center shadow-[0_12px_0_rgba(0,0,0,0.45)]"
        style={{
          transform: `translateX(${dragX}px) rotate(${dragX / 16}deg)`,
          transition: dragging ? "none" : "transform 0.15s ease",
        }}
        onPointerDown={(e) => {
          setDragging(true);
          startXRef.current = e.clientX;
        }}
        onPointerMove={(e) => {
          if (!dragging) return;
          setDragX(Math.max(-150, Math.min(150, e.clientX - startXRef.current)));
        }}
        onPointerUp={() => {
          setDragging(false);
          finishSwipe(dragX);
        }}
        onPointerCancel={() => {
          setDragging(false);
          finishSwipe(dragX);
        }}
      >
        <div className="text-7xl mb-3">{card.emoji}</div>
        <div
          className="font-game font-black text-slate-950 leading-tight"
          style={{ fontSize: "clamp(1.8rem,8vw,2.6rem)" }}
        >
          {card.label}
        </div>
      </div>
    </div>
  );
}

function HazardEvent({
  difficulty,
  sharpEye,
  lessDecoy,
  onSuccess,
  onFail,
}: {
  difficulty: number;
  sharpEye: boolean;
  lessDecoy: boolean;
  onSuccess: () => void;
  onFail: () => void;
}) {
  const [objects] = useState<SceneObject[]>(() => {
    const scene = makeScene();
    if (!lessDecoy) return scene;
    return scene.filter((o) => o.type !== "SAFE").concat(scene.filter((o) => o.type === "SAFE").slice(0, 1));
  });

  const [selected, setSelected] = useState<SceneObject | null>(null);
  const [clearedIds, setClearedIds] = useState<string[]>([]);
  const [bgIndex] = useState(rand(1, 4));

  const targets = useMemo(() => {
    const hazards = objects.filter((o) => o.type !== "SAFE");
    return hazards.slice(0, Math.min(hazards.length, difficulty >= 3 ? 2 : 1));
  }, [difficulty, objects]);

  const remaining = targets.filter((x) => !clearedIds.includes(x.uid));

  const answer = (type: ObjType) => {
    if (!selected) return;

    if (selected.type === type && targets.some((t) => t.uid === selected.uid)) {
      const next = [...clearedIds, selected.uid];
      setClearedIds(next);
      setSelected(null);

      if (next.length >= targets.length) {
        onSuccess();
      }

      return;
    }

    onFail();
  };

  return (
    <div className="relative h-full overflow-hidden rounded-[28px] border-2 border-white/10 bg-slate-950">
      <img
        src={`/assets/safety-grid/Background/factory-zone-0${bgIndex}.png`}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-fill"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 to-slate-950/35" />

      <div className="absolute left-3 top-3 z-40 rounded-2xl border border-yellow-300/30 bg-black/60 px-3 py-2">
        <div className="font-game font-black text-yellow-300">
          Hazard เหลือ {remaining.length}
        </div>
      </div>

      {objects.map((obj) => {
        const isTarget = targets.some((t) => t.uid === obj.uid);
        const isCleared = clearedIds.includes(obj.uid);
        const isSelected = selected?.uid === obj.uid;

        if (isCleared) return null;

        return (
          <button
            key={obj.uid}
            onPointerUp={() => setSelected(obj)}
            className={`absolute transition-all active:scale-95 ${
              isSelected ? "brightness-125 drop-shadow-[0_0_25px_rgba(250,204,21,0.95)]" : ""
            }`}
            style={{
              left: `${obj.x}%`,
              top: `${obj.y}%`,
              width: obj.size * (sharpEye && isTarget ? 0.9 : 0.72),
              height: obj.size * (sharpEye && isTarget ? 0.9 : 0.72),
              transform: `translate(-50%, -50%) scale(${isSelected ? 1.12 : 1})`,
              zIndex: isSelected ? 100 : 10 + Math.round(obj.y),
            }}
          >
            <img
              src={obj.image}
              alt={obj.label}
              draggable={false}
              className="absolute left-1/2 top-1/2 pointer-events-none"
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

      {selected && (
        <div className="absolute inset-x-3 bottom-3 z-[200] rounded-[24px] border border-white/15 bg-black/85 p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="font-game font-black text-white text-[clamp(1.2rem,5vw,1.5rem)]">
              {selected.label}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="h-9 w-9 rounded-full bg-white/15 text-white"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onPointerUp={() => answer("UA")}
              className="rounded-2xl bg-red-600 py-4 font-game font-black text-white active:scale-95"
            >
              Unsafe Action
            </button>
            <button
              onPointerUp={() => answer("UC")}
              className="rounded-2xl bg-orange-500 py-4 font-game font-black text-white active:scale-95"
            >
              Unsafe Condition
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function IncidentEvent({
  evidenceSense,
  onSuccess,
}: {
  evidenceSense: boolean;
  onSuccess: () => void;
}) {
  const currentCase = useMemo(() => pick(stage3Cases), []);
  const reportText = currentCase.incidentReport
    .map((line) => line.text)
    .join(" ");

  const evidence = currentCase.evidence.slice(0, 3);

  return (
    <div className="flex h-full flex-col justify-center">
      <div className="rounded-[30px] border-4 border-yellow-300 bg-slate-950 p-4 shadow-[0_0_35px_rgba(250,204,21,0.35)]">
        <div className="text-center">
          <div className="font-game text-white/50 text-xs">INCIDENT FILE</div>
          <div
            className="font-game font-black text-yellow-300 leading-tight"
            style={{
              fontSize: "clamp(1.45rem,7vw,2.2rem)",
              textShadow: "0 4px 0 rgba(0,0,0,0.6)",
            }}
          >
            {currentCase.title}
          </div>
        </div>

        <div
          className="mt-3 rounded-2xl bg-white px-3 py-3 font-game font-black leading-snug text-slate-950"
          style={{ fontSize: "clamp(1.05rem,4.6vw,1.35rem)" }}
        >
          {reportText}
        </div>

        <div className="mt-3 font-game font-black text-white text-center">
          แตะเปิดหลักฐาน
        </div>

        <div className="mt-2 grid gap-2">
          {evidence.map((item, index) => (
            <button
              key={`${item.text}-${index}`}
              onPointerUp={onSuccess}
              className={`rounded-2xl border px-3 py-3 text-left font-game font-black active:scale-95 ${
                evidenceSense
                  ? "border-yellow-300 bg-yellow-300 text-slate-950 shadow-[0_0_18px_rgba(250,204,21,0.45)]"
                  : "border-white/15 bg-white/10 text-white"
              }`}
              style={{ fontSize: "clamp(0.95rem,4vw,1.15rem)" }}
            >
              📌 {item.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}