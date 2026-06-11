import React, { useEffect, useRef, useState } from "react";
import PauseButton, { usePause } from "../components/PauseButton";
import {
  buildStage3PhasePuzzle,
  stage3Cases,
  type Stage3CaseLine,
} from "../data/stage3Cases";

type Props = {
  onExit?: () => void;
  onClear?: (score: number) => void;
};

type CasePage =
  | "locked"
  | "report"
  | "evidence"
  | "rootCause"
  | "prevention"
  | "lesson";

  type AccessPhase = "insert" | "granted";
type UnlockMode = "letterFill";

type RecoverToken = {
  id: string;
  text: string;
};
type PhaseRecoverPuzzle = {
  lines: string[];
  maskedLines: string[];
  keywords: string[];
};
const pageOrder: CasePage[] = [
  "locked",
  "report",
  "evidence",
  "rootCause",
  "prevention",
  "lesson",
];

const CARD_WIDTH = 150;
const CARD_HEIGHT = 92;
const MIN_SWIPE_DISTANCE = 80;

const PERFECT_DISTANCE_PX = 18;
const GOOD_DISTANCE_PX = 42;

const ACCESS_ZONE_WIDTH = 76;
const CARD_START_X = 24;
const TRACK_INSET_X = 16;

function randomSwipeZone() {
  return 0.18 + Math.random() * 0.64;
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}
function getUnlockButtonText(page: CasePage) {
  if (page === "evidence") return "เปิดหลักฐานที่ซ่อนอยู่";
  if (page === "rootCause") return "สาเหตุของเหตุการณ์ที่เกิดขึ้น";
  if (page === "prevention") return "มาตรการป้องกันเบื้องต้น";
  if (page === "lesson") return "บทเรียน";
  return "เปิดข้อมูล";
}
export default function Stage3AccidentInvestigate({ onExit }: Props) {
  const { paused, togglePause, PauseOverlay } = usePause({
    onGiveUp: () => {
      onExit?.();
    },
  });

  const [caseIndex, setCaseIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [revealedIndexes, setRevealedIndexes] = useState<number[]>([]);
  const [reportUnlocked, setReportUnlocked] = useState(false);
const [pendingLineIndex, setPendingLineIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [stageFeedback, setStageFeedback] = useState("");

  const [accessPhase, setAccessPhase] = useState<AccessPhase>("insert");
  const [cardY, setCardY] = useState(0);
  const [cardX, setCardX] = useState(0);
  const [maxCardX, setMaxCardX] = useState(1);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [swipeZone, setSwipeZone] = useState(() => randomSwipeZone());
  const [zoneLeftPx, setZoneLeftPx] = useState(0);
  const [accessResult, setAccessResult] = useState<"perfect" | "good" | null>(null);
  const [scanMessage, setScanMessage] = useState("ลากบัตรขึ้นไปเสียบ Reader");
  const [inserted, setInserted] = useState(false);

  const [unlockMode, setUnlockMode] = useState<UnlockMode | null>(null);
  const [recoverMissingLetters, setRecoverMissingLetters] = useState<string[]>([]);
  const [recoverChoices, setRecoverChoices] = useState<RecoverToken[]>([]);
  const [recoverSelected, setRecoverSelected] = useState<RecoverToken[]>([]);
  const [phasePuzzle, setPhasePuzzle] = useState<PhaseRecoverPuzzle | null>(null);
const [phaseFilledWords, setPhaseFilledWords] = useState<string[]>([]);
const [wrongShake, setWrongShake] = useState(false);
const [recoverError, setRecoverError] = useState("");
const [screenShake, setScreenShake] = useState(false);
const [flashType, setFlashType] = useState<"correct" | "wrong" | null>(null);

  const zoneOffsetRef = useRef(0);
  const zoneCenterPxRef = useRef(0);
  const cardXRef = useRef(0);

  const touchAreaRef = useRef<HTMLDivElement | null>(null);
  const swipeTrackRef = useRef<HTMLDivElement | null>(null);

  const dragStartRef = useRef({
    pointerY: 0,
    startCardY: 0,
  });

  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const updateZonePosition = (activeZone: number) => {
    const touchEl = touchAreaRef.current;
    const trackEl = swipeTrackRef.current;
    if (!touchEl || !trackEl) return;

    const touchWidth = touchEl.getBoundingClientRect().width;
    const trackWidth = trackEl.getBoundingClientRect().width;

    const maxX = Math.max(1, touchWidth - CARD_WIDTH - 48);
    const scanMinX = CARD_START_X + CARD_WIDTH * 0.5;
    const scanMaxX = CARD_START_X + maxX + CARD_WIDTH * 0.5;

    const clampedZone = Math.max(0, Math.min(1, activeZone));
    const zoneCenterX = scanMinX + (scanMaxX - scanMinX) * clampedZone;

    const nextLeft = Math.max(
      4,
      Math.min(
        trackWidth - ACCESS_ZONE_WIDTH - 4,
        zoneCenterX - TRACK_INSET_X - ACCESS_ZONE_WIDTH * 0.5
      )
    );

    zoneCenterPxRef.current = nextLeft + TRACK_INSET_X + ACCESS_ZONE_WIDTH * 0.5;
    setZoneLeftPx(nextLeft);
  };

  const getSwipeDistanceFromCardX = (nextCardX: number) => {
    const scanCenterX = CARD_START_X + nextCardX + CARD_WIDTH * 0.5;
    return Math.abs(scanCenterX - zoneCenterPxRef.current);
  };

  useEffect(() => {
    if (accessPhase !== "swipe") {
      zoneOffsetRef.current = 0;
      zoneCenterPxRef.current = 0;
      setZoneLeftPx(0);
      return;
    }

    let frame = 0;

    window.requestAnimationFrame(() => {
      zoneOffsetRef.current = 0;
      updateZonePosition(swipeZone);
    });

    const id = window.setInterval(() => {
      frame += 1;
      const nextOffset = Math.sin(frame * 0.08) * 0.03;
      zoneOffsetRef.current = nextOffset;
      updateZonePosition(swipeZone + nextOffset);
    }, 30);

    return () => window.clearInterval(id);
  }, [accessPhase, swipeZone]);

  const currentCase = stage3Cases[caseIndex % stage3Cases.length];
  const page = pageOrder[Math.min(pageIndex, pageOrder.length - 1)];

  const getLines = (): Stage3CaseLine[] => {
    if (page === "report") return currentCase.incidentReport;
    if (page === "evidence") return currentCase.evidence;
    if (page === "rootCause") return currentCase.rootCause;
    if (page === "prevention") return currentCase.prevention;
    if (page === "lesson") return [currentCase.lesson];
    return [];
  };

  const lines = getLines();
  const allRevealed =
  page === "locked" || page === "lesson" || revealedIndexes.length >= lines.length;
  useEffect(() => {
    if (page === "locked" || lines.length === 0) return;
  
    setPendingLineIndex(null);
    setUnlockMode(null);
    setRecoverError("");
  
    if (page === "report") {
      setRevealedIndexes([]);
      return;
    }
    
    setRevealedIndexes([]);
  }, [caseIndex, pageIndex]);
  const resetAccessCard = () => {
    zoneOffsetRef.current = 0;
    zoneCenterPxRef.current = 0;
    cardXRef.current = 0;

    setAccessPhase("insert");
    setCardY(0);
    setCardX(0);
    setMaxCardX(1);
    setIsDraggingCard(false);
    setInserted(false);
    setSwipeZone(randomSwipeZone());
    setZoneLeftPx(0);
    setAccessResult(null);
    setScanMessage("ลากบัตรขึ้นไปเสียบ Reader");
  };

  const missAccess = (message: string) => {
    setScore((s) => Math.max(0, s - 10));
    setAccessPhase("miss");
    setScanMessage(message);

    window.setTimeout(() => {
      resetAccessCard();
    }, 850);
  };

  const grantAccess = (perfect: boolean) => {
    setAccessResult(perfect ? "perfect" : "good");
    setAccessPhase("granted");
    setScanMessage(perfect ? "🎯 PERFECT ACCESS" : "✅ ACCESS GRANTED");
    setScore((s) => s + (perfect ? 100 : 75));

    window.setTimeout(() => {
      setPageIndex(1);
      setAccessResult(null);
      resetAccessCard();
    }, 900);
  };

  const handleInsertMove = (clientY: number) => {
    if (paused || accessPhase !== "insert" || !isDraggingCard) return;

    const deltaY = clientY - dragStartRef.current.pointerY;
    const nextY = Math.max(
      -105,
      Math.min(24, dragStartRef.current.startCardY + deltaY)
    );

    setCardY(nextY);
    setScanMessage("⬆️ ลากบัตรขึ้นไปให้ถึงช่อง Reader");

    if (nextY <= -86) {
      setIsDraggingCard(false);
      setInserted(true);
      setCardY(-112);
      setScanMessage("✅ INSERTED! กำลังอ่านบัตร...");

      window.setTimeout(() => {
        setAccessPhase("granted");
        setScanMessage("✅ ACCESS GRANTED");
      
        window.setTimeout(() => {
          setPageIndex(1);
          resetAccessCard();
        }, 450);
      }, 250);
    }
  };

  const handleSwipeMove = (
    clientX: number,
    trackLeft: number,
    trackWidth: number
  ) => {
    if (paused || accessPhase !== "swipe" || !isDraggingCard) return;

    const maxX = Math.max(1, trackWidth - CARD_WIDTH - 48);
    const nextX = Math.max(
      0,
      Math.min(maxX, clientX - trackLeft - dragOffsetRef.current.x - 24)
    );

    setMaxCardX(maxX);
    setCardX(nextX);
    cardXRef.current = nextX;

    updateZonePosition(swipeZone + zoneOffsetRef.current);

    const distance = getSwipeDistanceFromCardX(nextX);

    if (nextX < MIN_SWIPE_DISTANCE) {
      setScanMessage("➡️ รูดต่ออีกนิด ให้ผ่าน Reader ก่อน");
    } else if (distance <= PERFECT_DISTANCE_PX) {
      setScanMessage("🎯 PERFECT! ปล่อยนิ้วเลย!");
    } else if (distance <= GOOD_DISTANCE_PX) {
      setScanMessage("✅ ACCESS ได้แล้ว ปล่อยนิ้วได้");
    } else {
      setScanMessage("➡️ รูดให้เส้นแดงเข้า ACCESS ZONE");
    }
  };

  const handleSwipeEnd = () => {
    if (paused || accessPhase !== "swipe" || !isDraggingCard) return;

    setIsDraggingCard(false);

    const finalCardX = cardXRef.current;

    if (finalCardX < MIN_SWIPE_DISTANCE) {
      missAccess("❌ รูดสั้นไป! ต้องรูดผ่าน Reader ให้สุดกว่านี้");
      return;
    }

    updateZonePosition(swipeZone + zoneOffsetRef.current);

    const distance = getSwipeDistanceFromCardX(finalCardX);

    if (distance <= PERFECT_DISTANCE_PX) {
      grantAccess(true);
      return;
    }

    if (distance <= GOOD_DISTANCE_PX) {
      grantAccess(false);
      return;
    }

    missAccess("❌ MISS -10 เส้นแดงยังไม่ตรง ACCESS ZONE");
  };
  const showStageFeedback = (message: string) => {
    setStageFeedback(message);
  
    window.setTimeout(() => {
      setStageFeedback("");
    }, 650);
  };
  const completeUnlock = () => {
    setScore((s) => s + 25);
  
    if (pendingLineIndex === null) return;
  
    setRevealedIndexes(lines.map((_, index) => index));
    setPendingLineIndex(null);
  
    if (page === "report") {
      setReportUnlocked(true);
    }
  };
  const resetUnlockState = () => {
    setUnlockMode(null);
    setRecoverMissingLetters([]);
    setRecoverChoices([]);
    setRecoverSelected([]);
    setPhasePuzzle(null);
setPhaseFilledWords([]);
  
    setRecoverError("");
  };
  const startUnlockInfo = (lineIndex?: number) => {
    if (paused || page === "locked" || allRevealed) return;
  
    const targetIndex =
      typeof lineIndex === "number"
        ? lineIndex
        : lines.findIndex((_, index) => !revealedIndexes.includes(index));
  
    if (targetIndex < 0) return;
  
    setPendingLineIndex(targetIndex);
  
    const sourceLines = page === "report" ? currentCase.incidentReport : lines;
    const puzzle = buildStage3PhasePuzzle(sourceLines, 3);
  
    setUnlockMode("letterFill");
    setPhasePuzzle(puzzle);
    setPhaseFilledWords([]);
    setRecoverMissingLetters(puzzle.keywords);
    setRecoverChoices(
      shuffle(puzzle.keywords).map((text, index) => ({
        id: `${text}-${index}-${Math.random()}`,
        text,
      }))
    );
    setRecoverSelected([]);
    setRecoverError("");
  };

  const selectRecoverToken = (token: RecoverToken) => {
    if (recoverSelected.length >= recoverMissingLetters.length) return;
  
    setRecoverChoices((choices) => choices.filter((item) => item.id !== token.id));
    setRecoverSelected((selected) => [...selected, token]);
    setPhaseFilledWords((words) => [...words, token.text]);
    setRecoverError("");
  };

  const removeRecoverToken = (token: RecoverToken) => {
    setRecoverSelected((selected) =>
      selected.filter((item) => item.id !== token.id)
    );
  
    setRecoverChoices((choices) => [...choices, token]);
  
    setPhaseFilledWords((words) => {
      const removeIndex = words.findIndex((word) => word === token.text);
      if (removeIndex < 0) return words;
  
      return words.filter((_, index) => index !== removeIndex);
    });
  
    setRecoverError("");
  };
  const triggerWrongShake = () => {
    setWrongShake(false);
  
    window.requestAnimationFrame(() => {
      setWrongShake(true);
  
      window.setTimeout(() => {
        setWrongShake(false);
      }, 320);
    });
  };
  const submitRecoverPuzzle = () => {
    if (paused || unlockMode !== "letterFill" || !phasePuzzle) return;
  
    if (phaseFilledWords.length < phasePuzzle.keywords.length) {
      setRecoverError("❌ เติมคำให้ครบก่อน");
      return;
    }
  
    const isCorrectOrder =
      phaseFilledWords.join("|") === phasePuzzle.keywords.join("|");
  
    if (!isCorrectOrder) {
      setRecoverError("❌ คำยังไม่ตรงช่อง ลองเรียงใหม่อีกครั้ง");
      triggerWrongShake();
      setFlashType("wrong");
      setScreenShake(true);
      
      window.setTimeout(() => setFlashType(null), 180);
      window.setTimeout(() => setScreenShake(false), 260);
      const selectedBack = [...recoverSelected];
  
      setRecoverSelected([]);
      setPhaseFilledWords([]);
      setRecoverChoices((choices) => shuffle([...choices, ...selectedBack]));
  
      return;
    }
  
    setFlashType("correct");
window.setTimeout(() => setFlashType(null), 180);

showStageFeedback("✅+25");
  
    resetUnlockState();
    completeUnlock();
  };
  const nextPage = () => {
    if (paused) return;
    if (page === "locked") return;
  
    // ถ้ามินิเกมเปิดอยู่ ห้ามเปิดซ้อน
    if (unlockMode) return;
  
    if (!allRevealed) {
      try {
        startUnlockInfo();
      } catch (err) {
        console.error("[Stage3 startUnlockInfo failed]", err);
        setUnlockMode(null);
        setRecoverError("");
      }
      return;
    }
  
    if (page === "lesson" || pageIndex >= pageOrder.length - 1) {
      setCaseIndex((v) => v + 1);
      setPageIndex(0);
      setRevealedIndexes([]);
      setReportUnlocked(false);
      resetAccessCard();
      return;
    }
  
    setPageIndex((v) => v + 1);
  };

  const isSwipeMode = false;
  const revealedTextList = lines.filter((_, index) =>
  revealedIndexes.includes(index)
);
const reportDetailsReady =
  page === "report" ? allRevealed && !unlockMode : reportUnlocked;
  let globalFillIndex = 0;
  return (
    <div
  className={[
    "h-[100dvh] w-full overflow-hidden bg-gradient-to-b from-slate-800 to-slate-950 px-2 py-2 text-white",
    screenShake ? "screen-shake" : "",
  ].join(" ")}
>
{flashType && (
  <div
    className={[
      "pointer-events-none fixed inset-0 z-[9997]",
      flashType === "correct" ? "correct-overlay" : "wrong-overlay",
    ].join(" ")}
  />
)}
      <div className="mx-auto flex h-full w-full max-w-[430px] flex-col">
      <div className="flex items-center justify-between px-1">
  <div className="min-w-0">
    <div className="font-game font-bold text-white/45 text-[clamp(11px,3vw,13px)]">
      ด่าน 3
    </div>

    <h1 className="arcade-text font-game font-black leading-none text-white text-[clamp(21px,5.6vw,29px)]">
  ACCIDENT INVESTIGATION
</h1>
  </div>

  <div className="flex shrink-0 items-center gap-2">
    <PauseButton paused={paused} onToggle={togglePause} />

    <div className="text-right">
      <div className="font-game font-black text-yellow-300 text-[clamp(22px,6vw,30px)]">
        {score}
      </div>
      <div className="font-game font-bold text-white/45 text-[clamp(10px,3vw,12px)]">
        คะแนน
      </div>
    </div>
  </div>
</div>

<div className="arcade-card mt-2 rounded-2xl px-3 py-2">
  <div className="mb-1 text-center font-game font-black text-white/55 text-[clamp(10px,2.8vw,12px)]">
    ตอนนี้อยู่ขั้นตอน
  </div>

  <div className="flex flex-wrap justify-center gap-1.5">
    {getInvestigationSteps().map((step) => {
      const stepIndex = pageOrder.indexOf(step.page);
      const isCurrent = page === step.page;
      const isDone = pageIndex > stepIndex;

      return (
        <div
          key={step.page}
          className={[
            "rounded-full px-2.5 py-1 font-game font-black text-[clamp(11px,3vw,13px)]",
            isCurrent
  ? "bg-yellow-300 text-slate-950 ring-2 ring-yellow-200 shadow-[0_0_18px_rgba(250,204,21,0.8)]"
              : isDone
              ? "bg-green-500 text-white"
              : "bg-white/10 text-white/45",
          ].join(" ")}
        >
          {isDone ? "✓ " : isCurrent ? "● " : ""}
          {step.label}
        </div>
      );
    })}
  </div>
</div>
{(page === "locked" || page === "report" || reportUnlocked) && (
  <div className="arcade-card mt-2 rounded-2xl border-l-4 border-yellow-300 px-3 py-2">
  <div className="arcade-text font-game font-black text-yellow-300 text-[clamp(16px,4.2vw,21px)]">
    รายละเอียดเหตุการณ์
  </div>

  {reportDetailsReady ? (
    <div
    className="
  mt-2
  rounded-xl
  bg-white
  px-3
  py-3
  font-game
  font-black
  leading-tight
  text-slate-950
  shadow-lg
  text-[clamp(17px,4.6vw,22px)]
"
  >
    ✅{" "}
    {currentCase.incidentReport
      .map((line) => line.text)
      .join("  ")}
  </div>
  ) : (
    <div className="mt-2 rounded-xl bg-black/35 px-3 py-3 font-game font-black text-white/35 text-[clamp(14px,3.8vw,18px)]">
      ███████████████████
    </div>
  )}
</div>
)}
          {page === "locked" ? (
            <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-900/90 p-3 text-center">
              <div className="font-black text-yellow-300 text-[clamp(24px,6vw,32px)]">
                FILE LOCKED
              </div>

              <p className="mt-2 font-bold leading-snug text-white/75 text-[clamp(14px,3.8vw,17px)]">
              ลากบัตรขึ้นเสียบ Card Reader เพื่อเปิดเคส
              </p>

              <div
                ref={touchAreaRef}
                className="relative mt-3 h-[330px] overflow-hidden rounded-[28px] border border-white/10 bg-black/45 p-3 touch-none select-none"
                onPointerMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();

                  if (accessPhase === "insert") {
                    handleInsertMove(e.clientY);
                    return;
                  }
                }}
                onPointerUp={() => {
                  if (paused) return;

                  if (accessPhase === "insert" && isDraggingCard) {
                    setIsDraggingCard(false);
                    missAccess("❌ MISS -10 เสียบบัตรไม่ถึง Reader");
                    return;
                  }
                }}
                onPointerCancel={() => {
                  if (paused) return;

                  if (accessPhase === "insert" && isDraggingCard) {
                    setIsDraggingCard(false);
                    missAccess("❌ MISS -10 เสียบบัตรไม่ถึง Reader");
                    return;
                  }
                }}
              >
                <div className="mx-auto rounded-3xl border border-green-300/30 bg-green-500/10 px-3 py-3">
                  <div className="font-black text-green-300 text-[clamp(18px,4.8vw,24px)]">
                    CARD READER
                  </div>
                  <div className="mx-auto mt-2 h-5 w-44 rounded-full bg-green-300 shadow-[0_0_20px_rgba(134,239,172,0.75)]" />
                  <div className="mt-1 font-black text-white/55 text-[clamp(11px,3vw,13px)]">
                    {accessPhase === "insert"
                      ? "INSERT CARD FIRST"
                      : "SWIPE TO UNLOCK"}
                  </div>
                </div>

                {isSwipeMode && (
                  <div
                    ref={swipeTrackRef}
                    className="absolute left-4 right-4 top-[128px] h-[72px] rounded-[22px] border border-white/15 bg-slate-950/90"
                  >
                    <div className="absolute left-4 right-4 top-1/2 h-5 -translate-y-1/2 rounded-full bg-white/15" />

                    <div
                      className={[
                        "absolute top-1/2 h-16 w-[76px] -translate-y-1/2 rounded-2xl border shadow-[0_0_22px_rgba(134,239,172,0.5)]",
                        accessResult === "perfect"
                          ? "border-yellow-200 bg-yellow-300/45"
                          : accessResult === "good"
                          ? "border-green-200 bg-green-400/45"
                          : "border-green-300/70 bg-green-500/35",
                      ].join(" ")}
                      style={{ left: `${zoneLeftPx}px` }}
                    >
                      <div className="grid h-full place-items-center text-center">
                        <div>
                          <div className="font-black text-[12px]">ACCESS</div>
                          <div className="font-black text-[12px]">ZONE</div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute left-3 top-1 font-black text-green-300 text-[12px]">
                      ⬅️ รูดบัตร ➡️
                    </div>
                  </div>
                )}

                <div
                  onPointerDown={(e) => {
                    if (paused) return;
                    if (accessPhase !== "insert") return;

                    e.currentTarget.setPointerCapture(e.pointerId);
                    setIsDraggingCard(true);

                    if (accessPhase === "insert") {
                      dragStartRef.current = {
                        pointerY: e.clientY,
                        startCardY: cardY,
                      };

                      setScanMessage("⬆️ ลากบัตรขึ้นไปเสียบ Reader");
                      return;
                    }
                  }}
                  style={{
                    width: isSwipeMode ? CARD_WIDTH : undefined,
                    height: CARD_HEIGHT,
                    left: isSwipeMode ? CARD_START_X : 32,
                    right: isSwipeMode ? "auto" : 32,
                    top: isSwipeMode ? 146 : 210,
                    transform: isSwipeMode
                      ? `translateX(${cardX}px)`
                      : inserted
                      ? `translateY(-112px) scale(0.92)`
                      : `translateY(${cardY}px)`,
                    transition: inserted ? "transform 180ms ease-out" : undefined,
                  }}
                  className={[
                    "absolute cursor-grab rounded-[20px] border-2 p-2 text-left shadow-2xl active:cursor-grabbing",
                    accessPhase === "miss"
                      ? "border-red-300 bg-red-500 text-white"
                      : accessPhase === "granted"
                      ? "border-green-300 bg-green-500 text-white"
                      : "border-yellow-300/60 bg-yellow-300 text-slate-950",
                  ].join(" ")}
                >
                  <div className="relative h-full w-full overflow-hidden rounded-[14px]">
                    <div className="text-center">
                      <div className="font-black leading-none text-[clamp(18px,5vw,24px)]">
                        ACCESS
                      </div>
                      <div className="mt-1 font-black leading-none text-[clamp(18px,5vw,24px)]">
                        CARD
                      </div>
                      <div className="mt-1 font-black opacity-70 text-[clamp(10px,3vw,13px)]">
                        TANIOBIS SAFETY
                      </div>
                    </div>

                    <div className="absolute bottom-1 left-3 right-3 h-3 rounded-full bg-black/20">
                      <div className="h-full w-2/3 rounded-full bg-black/45" />
                    </div>
                  </div>
                </div>

                <div
                  className={[
                    "absolute bottom-3 left-3 right-3 rounded-2xl px-3 py-3 font-black leading-tight text-[clamp(14px,3.8vw,18px)]",
                    accessPhase === "granted"
                      ? "bg-green-500 text-white"
                      : accessPhase === "miss"
                      ? "bg-red-600 text-white"
                      : "bg-black/55 text-white",
                  ].join(" ")}
                >
                  {scanMessage}
                </div>
              </div>
            </div>
          ) : (
            <div className="arcade-panel mt-2 flex min-h-0 flex-1 flex-col rounded-[1.25rem] p-3">
              <div
  className={
    page === "report"
      ? "px-1 py-0 text-left"
      : page === "lesson"
      ? "px-1 py-1 text-left"
      : unlockMode
      ? "px-1 py-1 text-left"
      : "rounded-2xl bg-black/35 border border-white/10 px-3 py-3 text-left"
  }
>
{page !== "report" && (
  <div
    className={
      unlockMode
      ? "arcade-text font-game font-black text-yellow-300 text-center leading-tight text-[clamp(15px,4vw,20px)]"
      : "arcade-text font-game font-black text-yellow-300 text-[clamp(16px,4.2vw,21px)]"
    }
  >
    {getPageStory(page).title}
  </div>
)}

{page !== "report" && !unlockMode && (
  <div className="mt-1 font-game font-bold text-white/85 leading-snug text-[clamp(14px,3.8vw,17px)]">
    {getPageStory(page).body}
  </div>
)}

{revealedTextList.length > 0 && !unlockMode && page !== "report" && page !== "lesson" && (
  <div className="mt-2 rounded-xl bg-white px-3 py-3 font-game font-black leading-snug text-slate-950 text-[clamp(16px,4.3vw,20px)]">
    {revealedTextList.map((line, index) => (
      <div key={`${line.text}-${index}`} className={index > 0 ? "mt-1.5" : ""}>
        <span className="mr-2 text-yellow-500">{index + 1}.</span>
        {line.text}
      </div>
    ))}
  </div>
)}
</div>

              {unlockMode === "letterFill" && (
 <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden text-center">

<div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-slate-950 p-1">

<div className="max-h-[30dvh] space-y-1.5 overflow-y-auto rounded-xl bg-white/10 px-2 py-2 font-black leading-tight text-white text-[clamp(19px,5vw,25px)]">
<div
  className={[
    "rounded-xl bg-black/25 px-3 py-3 text-left leading-snug",
    wrongShake ? "stage3-wrong-shake" : "",
  ].join(" ")}
>
{phasePuzzle?.maskedLines?.map((line, lineIndex) => {
    const displayLine = line.replace(/____/g, () => {
      const word = phaseFilledWords[globalFillIndex];
      globalFillIndex += 1;

      return word ? `【${word}】` : "____";
    });

    return (
      <span key={`${line}-${lineIndex}`}>
        {displayLine}
        {lineIndex < (phasePuzzle?.maskedLines.length ?? 0) - 1 ? " " : ""}
      </span>
    );
  })}
</div>
</div>

<div className="mt-1 min-h-[44px] rounded-xl bg-white/5 px-2 py-2">
  {recoverSelected.length === 0 ? (
    <div className="text-center font-game font-black text-white/45 text-[clamp(12px,3vw,14px)]">
      แตะคำด้านล่างเพื่อเติมช่องว่าง
    </div>
  ) : (
    <div className="flex flex-wrap justify-center gap-2">
      {recoverSelected.map((token) => (
        <button
          key={token.id}
          onClick={() => removeRecoverToken(token)}
          className="rounded-lg bg-green-400 px-2 py-1 font-game font-black text-slate-950 text-[clamp(14px,3.8vw,18px)]"
        >
          {token.text}
        </button>
      ))}
    </div>
  )}
</div>

      <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 overflow-hidden">
      {recoverChoices.map((token) => (
          <button
            key={token.id}
            onClick={() => selectRecoverToken(token)}
            className="rounded-xl bg-yellow-300 px-3 py-2 font-game font-black leading-none text-slate-950 shadow active:scale-95 text-[clamp(18px,5vw,24px)]"
          >
            {token.text}
          </button>
        ))}
      </div>
    </div>

    {recoverError && (
      <div className="mt-1 rounded-xl bg-red-600 px-3 py-1.5 font-black text-white text-[clamp(12px,3.2vw,15px)]">
        {recoverError}
      </div>
    )}

    <button
      onClick={submitRecoverPuzzle}
      className="mt-1 shrink-0 w-full rounded-xl bg-green-500 py-2 font-game font-black text-slate-950 shadow-lg active:scale-95 text-[clamp(15px,4vw,20px)]"
    >
      ✅ ส่งคำตอบ
    </button>
  </div>
)}

<div className={unlockMode || page === "lesson" ? "hidden" : "mt-4 space-y-3"}>
{!allRevealed && !unlockMode && (
  <button
    onClick={() => startUnlockInfo(0)}
    className="w-full rounded-2xl border-2 border-yellow-200 bg-yellow-300 px-4 py-5 text-center font-game font-black leading-tight text-slate-950 shadow-lg active:scale-95 text-[clamp(19px,5vw,26px)]"
  >
    <div className="flex items-center justify-center gap-2">
      <span className="text-[24px]">🔓</span>
      <span>{getUnlockButtonText(page)}</span>
    </div>
  </button>
)}
              </div>
              {page === "lesson" && !unlockMode && (
  <div className="mt-2 rounded-2xl border-2 border-green-300 bg-green-500 px-4 py-4">
    <div className="mb-3 text-center font-game font-black text-white text-[clamp(18px,5vw,24px)]">
      จากเหตุการณ์นี้
    </div>

    <div className="font-game font-black leading-snug text-white text-[clamp(18px,4.8vw,24px)]">
      {currentCase.lesson.text}
    </div>
  </div>
)}
              {allRevealed && !unlockMode && (
  <button
    onClick={nextPage}
    className="mt-5 w-full rounded-2xl bg-green-600 py-4 font-game font-black text-white shadow-lg active:scale-95 text-[clamp(20px,5.5vw,29px)]"
  >
    {page === "lesson"
  ? "ปิดเคส / เคสต่อไป"
  : page === "report"
  ? "หาหลักฐานเพิ่มเติม"
  : page === "evidence"
  ? "วิเคราะห์สาเหตุ"
  : page === "rootCause"
  ? "ดูวิธีป้องกัน"
  : page === "prevention"
  ? "สรุป"
  : "เปิดหน้าถัดไป ▶"}
  </button>
)}
            </div>
          )}
        </div>

      {stageFeedback && (
  <div className="pointer-events-none fixed inset-0 z-[99998] grid place-items-center px-4">
    <div className="animate-bounce rounded-[28px] border-4 border-yellow-300 bg-black px-5 py-4 text-center font-game font-black text-yellow-300 shadow-[0_0_34px_rgba(250,204,21,0.75)] text-[clamp(24px,7vw,38px)]">
      {stageFeedback}
    </div>
  </div>
)}

<div className="relative z-[99999]">{PauseOverlay}</div>
    </div>
  );
}

function getPageStory(page: CasePage) {
  if (page === "report") {
    return {
      title: "⚠️ เกิดอะไรขึ้น",
      body: "มาดูเหตุการณ์ที่เกิดขึ้นจริงจากหน้างาน",
    };
  }

  if (page === "evidence") {
    return {
      title: "หลักฐานที่พบ",
      body: "",
    };
  }

  if (page === "rootCause") {
    return {
      title: "สาเหตุที่เกิดเหตุการณ์นี้",
      body: "",
    };
  }

  if (page === "prevention") {
    return {
      title: "หากอยู่หน้างานให้ดำเนินการ",
      body: "",
    };
  }

  if (page === "lesson") {
    return {
      title: "ดังนั้น",
      body: "",
    };
  }

  return {
    title: "🔒 เริ่มการตรวจสอบเหตุการณ์",
    body: "ปลดล็อกข้อมูลเพื่อดูว่าอุบัติเหตุนี้เกิดขึ้นได้อย่างไร",
  };
}
function getInvestigationSteps() {
  return [
    { page: "report", label: "เหตุการณ์" },
    { page: "evidence", label: "หลักฐาน" },
    { page: "rootCause", label: "สาเหตุ" },
    { page: "prevention", label: "ป้องกัน" },
    { page: "lesson", label: "บทเรียน" },
  ] as const;
}