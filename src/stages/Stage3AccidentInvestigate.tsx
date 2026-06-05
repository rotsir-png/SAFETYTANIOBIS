import React, { useRef, useState } from "react";
import PauseButton, { usePause } from "../components/PauseButton";
import { stage3Cases } from "../data/stage3Cases";

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

type AccessPhase = "insert" | "swipe" | "miss" | "granted";

const pageOrder: CasePage[] = [
  "locked",
  "report",
  "evidence",
  "rootCause",
  "prevention",
  "lesson",
];

const CARD_WIDTH = 170;
const CARD_HEIGHT = 92;
const MIN_SWIPE_DISTANCE = 95;

function randomSwipeZone() {
  return 0.45 + Math.random() * 0.32;
}

export default function Stage3AccidentInvestigate({ onExit }: Props) {
  const { paused, togglePause, PauseOverlay } = usePause({
    onGiveUp: () => {
      onExit?.();
    },
  });

  const [caseIndex, setCaseIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [score, setScore] = useState(0);

  const [accessPhase, setAccessPhase] = useState<AccessPhase>("insert");
  const [cardY, setCardY] = useState(0);
  const [cardX, setCardX] = useState(0);
  const [maxCardX, setMaxCardX] = useState(1);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [swipeZone, setSwipeZone] = useState(() => randomSwipeZone());
  const [scanMessage, setScanMessage] = useState("ลากบัตรขึ้นไปเสียบ Reader");
  const [inserted, setInserted] = useState(false);

  const dragStartRef = useRef({
    pointerY: 0,
    startCardY: 0,
  });

  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const currentCase = stage3Cases[caseIndex % stage3Cases.length];
  const page = pageOrder[pageIndex];

  const getLines = () => {
    if (page === "report") return currentCase.incidentReport;
    if (page === "evidence") return currentCase.evidence;
    if (page === "rootCause") return currentCase.rootCause;
    if (page === "prevention") return currentCase.prevention;
    if (page === "lesson") return [currentCase.lesson];
    return [];
  };

  const lines = getLines();
  const allRevealed = page === "locked" || revealedCount >= lines.length;

  const resetAccessCard = () => {
    setAccessPhase("insert");
    setCardY(0);
    setCardX(0);
    setMaxCardX(1);
    setIsDraggingCard(false);
    setInserted(false);
    setSwipeZone(randomSwipeZone());
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

  const grantAccess = () => {
    setAccessPhase("granted");
    setScanMessage("✅ ACCESS GRANTED");
    setScore((s) => s + 75);

    window.setTimeout(() => {
      setPageIndex(1);
      setRevealedCount(0);
      resetAccessCard();
    }, 850);
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
        setAccessPhase("swipe");
        setInserted(false);
        setCardY(0);
        setCardX(0);
        setScanMessage("STEP 2: แตะบัตร แล้วรูดให้เส้นแดงตรงช่องเขียว");
      }, 350);
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

    const scanLineRatio = (nextX + CARD_WIDTH * 0.5) / (maxX + CARD_WIDTH);
    const distance = Math.abs(scanLineRatio - swipeZone);

    if (nextX < MIN_SWIPE_DISTANCE) {
      setScanMessage("➡️ รูดต่ออีกนิด ให้ผ่าน Reader ก่อน");
    } else if (distance <= 0.04) {
      setScanMessage("🎯 ตรงแล้ว! ปล่อยนิ้วได้เลย");
    } else if (distance <= 0.1) {
      setScanMessage("🟢 ใกล้แล้ว รูดช้า ๆ");
    } else {
      setScanMessage("➡️ รูดให้เส้นแดงเข้า ACCESS ZONE");
    }
  };

  const handleSwipeEnd = () => {
    if (paused || accessPhase !== "swipe" || !isDraggingCard) return;

    setIsDraggingCard(false);

    if (cardX < MIN_SWIPE_DISTANCE) {
      missAccess("❌ รูดสั้นไป! ต้องรูดผ่าน Reader ให้สุดกว่านี้");
      return;
    }

    const scanLineRatio = (cardX + CARD_WIDTH * 0.5) / (maxCardX + CARD_WIDTH);
    const min = swipeZone - 0.1;
    const max = swipeZone + 0.1;

    if (scanLineRatio >= min && scanLineRatio <= max) {
      grantAccess();
    } else {
      missAccess("❌ MISS -10 เส้นแดงยังไม่ตรง ACCESS ZONE");
    }
  };

  const nextPage = () => {
    if (paused) return;
    if (page === "locked") return;

    if (!allRevealed) {
      setRevealedCount((v) => Math.min(lines.length, v + 1));
      setScore((s) => s + 25);
      return;
    }

    if (pageIndex >= pageOrder.length - 1) {
      setCaseIndex((v) => v + 1);
      setPageIndex(0);
      setRevealedCount(0);
      resetAccessCard();
      setScore((s) => s + 150);
      return;
    }

    setPageIndex((v) => v + 1);
    setRevealedCount(0);
  };

  const pageProgress = Math.round((pageIndex / (pageOrder.length - 1)) * 100);
  const isSwipeMode = accessPhase === "swipe" || accessPhase === "granted";

  return (
    <div className="h-[100dvh] w-full overflow-y-auto bg-[#111827] px-2 py-2 text-white">
      <div className="mx-auto flex w-full max-w-[430px] flex-col pb-5">
        <div className="flex items-start justify-between px-1">
          <div>
            <div className="font-bold text-white/45 text-[clamp(12px,3vw,15px)]">
              ด่าน 3
            </div>
            <h1 className="font-black leading-none text-[clamp(21px,5.6vw,29px)]">
              🔒 CASE LOCKED
            </h1>
            <div className="mt-1 font-black text-yellow-300 text-[clamp(14px,3.8vw,19px)]">
              Interactive Case File
            </div>
          </div>

          <div className="flex shrink-0 items-start gap-3">
            <PauseButton paused={paused} onToggle={togglePause} />

            <div className="text-right">
              <div className="font-black text-yellow-300 text-[clamp(27px,7vw,36px)]">
                {score}
              </div>
              <div className="font-bold text-white/45 text-[clamp(11px,3vw,14px)]">
                คะแนน
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-black/45 p-3">
          <div className="flex justify-between font-black text-[clamp(13px,3.4vw,16px)]">
            <span>CASE PROGRESS</span>
            <span className="text-green-300">{pageProgress}%</span>
          </div>
          <div className="mt-2 h-4 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${pageProgress}%` }}
            />
          </div>
        </div>

        <div className="mt-3 rounded-[24px] border border-yellow-300/20 bg-black/45 p-3 shadow-2xl">
          <div className="rounded-[20px] border border-yellow-300/30 bg-yellow-300/10 px-3 py-3 text-center">
            <div className="font-black text-yellow-300 text-[clamp(14px,3.8vw,18px)]">
              CASE FILE #{currentCase.id}
            </div>
            <h2 className="mt-1 font-black leading-tight text-[clamp(20px,5vw,26px)]">
              {currentCase.title}
            </h2>
            <p className="mt-1 font-bold leading-snug text-white/80 text-[clamp(12px,3.4vw,15px)]">
              {currentCase.subtitle}
            </p>
          </div>

          {page === "locked" ? (
            <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-900/90 p-3 text-center">
              <div className="font-black text-yellow-300 text-[clamp(24px,6vw,32px)]">
                FILE LOCKED
              </div>

              <p className="mt-2 font-bold leading-snug text-white/75 text-[clamp(14px,3.8vw,17px)]">
                ลากบัตรขึ้นเข้า Reader แล้วรูดให้เส้นแดงตรงช่องเขียว
              </p>

              <div
                className="relative mt-3 h-[330px] overflow-hidden rounded-[28px] border border-white/10 bg-black/45 p-3 touch-none select-none"
                onPointerMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();

                  if (accessPhase === "insert") {
                    handleInsertMove(e.clientY);
                    return;
                  }

                  if (accessPhase === "swipe") {
                    handleSwipeMove(e.clientX, rect.left, rect.width);
                  }
                }}
                onPointerUp={() => {
                  if (paused) return;

                  if (accessPhase === "insert" && isDraggingCard) {
                    setIsDraggingCard(false);
                    missAccess("❌ MISS -10 เสียบบัตรไม่ถึง Reader");
                    return;
                  }

                  handleSwipeEnd();
                }}
                onPointerCancel={() => {
                  if (paused) return;

                  if (accessPhase === "insert" && isDraggingCard) {
                    setIsDraggingCard(false);
                    missAccess("❌ MISS -10 เสียบบัตรไม่ถึง Reader");
                    return;
                  }

                  handleSwipeEnd();
                }}
              >
                <div className="mx-auto rounded-3xl border border-green-300/30 bg-green-500/10 px-3 py-3">
                  <div className="font-black text-green-300 text-[clamp(18px,4.8vw,24px)]">
                    CARD READER
                  </div>
                  <div className="mx-auto mt-2 h-5 w-44 rounded-full bg-green-300 shadow-[0_0_20px_rgba(134,239,172,0.75)]" />
                  <div className="mt-1 font-black text-white/55 text-[clamp(11px,3vw,13px)]">
                    {accessPhase === "insert" ? "INSERT CARD FIRST" : "SWIPE TO UNLOCK"}
                  </div>
                </div>

                {isSwipeMode && (
                  <div className="absolute left-4 right-4 top-[128px] h-[72px] rounded-[22px] border border-white/15 bg-slate-950/90">
                    <div className="absolute left-4 right-4 top-1/2 h-5 -translate-y-1/2 rounded-full bg-white/15" />

                    <div
                      className="absolute top-1/2 h-16 w-[76px] -translate-y-1/2 rounded-2xl border border-green-300/70 bg-green-500/35 shadow-[0_0_22px_rgba(134,239,172,0.5)]"
                      style={{
                        left: `${Math.min(70, Math.max(8, swipeZone * 100 - 10))}%`,
                      }}
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
                    if (accessPhase !== "insert" && accessPhase !== "swipe") return;

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

                    if (accessPhase === "swipe") {
                      const cardRect = e.currentTarget.getBoundingClientRect();

                      dragOffsetRef.current = {
                        x: e.clientX - cardRect.left,
                        y: 0,
                      };

                      setScanMessage("➡️ รูดบัตรไปทางขวา");
                    }
                  }}
                  style={{
                    width: isSwipeMode ? CARD_WIDTH : undefined,
                    height: CARD_HEIGHT,
                    left: isSwipeMode ? 24 : 32,
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
                    <div className="absolute left-1/2 top-[-12px] z-20 h-[120px] w-2 -translate-x-1/2 rounded-full bg-red-600 shadow-[0_0_16px_rgba(239,68,68,1)]" />

                    <div className="absolute left-1/2 top-1 z-30 -translate-x-1/2 rounded-full bg-red-700 px-2 py-[2px] text-[10px] font-black text-white">
                      SCAN
                    </div>

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
            <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-900/90 p-4">
              <div className="text-center font-black text-yellow-300 text-[clamp(20px,5vw,28px)]">
                {getPageTitle(page)}
              </div>

              <div className="mt-4 space-y-3">
                {lines.map((line, index) => {
                  const revealed = index < revealedCount;

                  return (
                    <div
                      key={`${line}-${index}`}
                      className={[
                        "rounded-2xl px-4 py-4 font-bold leading-snug shadow-lg transition-all text-[clamp(15px,4vw,19px)]",
                        revealed
                          ? "bg-white text-slate-950"
                          : "bg-black/55 text-white/25 blur-[1px]",
                      ].join(" ")}
                    >
                      {revealed ? line : "████████████████████████"}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={nextPage}
                className="mt-5 w-full rounded-2xl bg-green-600 py-4 font-black text-white shadow-lg active:scale-95 text-[clamp(20px,5.5vw,29px)]"
              >
                {!allRevealed
                  ? "🔦 เปิดข้อมูลถัดไป"
                  : page === "lesson"
                  ? "✅ CASE CLOSED / เคสต่อไป"
                  : "เปิดหน้าถัดไป ▶"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-[99999]">{PauseOverlay}</div>
    </div>
  );
}

function getPageTitle(page: CasePage) {
  if (page === "report") return "📄 INCIDENT REPORT";
  if (page === "evidence") return "📁 EVIDENCE";
  if (page === "rootCause") return "🔎 ROOT CAUSE";
  if (page === "prevention") return "🛡 PREVENTION";
  if (page === "lesson") return "🏆 LESSON LEARNED";
  return "🔒 CASE LOCKED";
}