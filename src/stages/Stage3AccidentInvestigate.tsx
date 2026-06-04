import React, { useState } from "react";
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

const CARD_WIDTH = 118;

function randomSwipeZone() {
  return 0.45 + Math.random() * 0.35;
}

export default function Stage3AccidentInvestigate({ onExit }: Props) {
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
  const [scanMessage, setScanMessage] = useState(
    "ลากบัตรขึ้นไปเสียบในเครื่องอ่าน"
  );

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
    setSwipeZone(randomSwipeZone());
    setScanMessage("ลากบัตรขึ้นไปเสียบในเครื่องอ่าน");
  };

  const missAccess = (message: string) => {
    setScore((s) => Math.max(0, s - 10));
    setAccessPhase("miss");
    setScanMessage(message);

    window.setTimeout(() => {
      resetAccessCard();
    }, 700);
  };

  const grantAccess = () => {
    setAccessPhase("granted");
    setScanMessage("✅ ACCESS GRANTED");
    setScore((s) => s + 75);

    window.setTimeout(() => {
      setPageIndex(1);
      setRevealedCount(0);
      resetAccessCard();
    }, 700);
  };

  const handleInsertMove = (clientY: number, areaTop: number) => {
    if (accessPhase !== "insert" || !isDraggingCard) return;

    const rawY = clientY - areaTop - 215;
    const nextY = Math.max(-115, Math.min(20, rawY));

    setCardY(nextY);
    setScanMessage("⬆️ ลากขึ้นไปเสียบช่อง CARD READER");

    if (nextY <= -95) {
      setAccessPhase("swipe");
setIsDraggingCard(false);
setCardY(0);
setCardX(0);
setScanMessage("STEP 2: แตะบัตร แล้วรูดจากซ้ายไปขวาให้เส้นแดงอยู่ในช่องเขียว");
    }
  };

  const handleSwipeMove = (
    clientX: number,
    trackLeft: number,
    trackWidth: number
  ) => {
    if (accessPhase !== "swipe" || !isDraggingCard) return;

    const maxX = Math.max(1, trackWidth - CARD_WIDTH - 24);
    const nextX = Math.max(
      0,
      Math.min(maxX, clientX - trackLeft - CARD_WIDTH / 2)
    );

    setMaxCardX(maxX);
    setCardX(nextX);
    setScanMessage("➡️ รูดไปทางขวา แล้วปล่อยให้ตรงช่องเขียว");
  };

  const handleSwipeEnd = () => {
    if (accessPhase !== "swipe" || !isDraggingCard) return;

    setIsDraggingCard(false);

    const scanLineRatio = (cardX + CARD_WIDTH * 0.5) / (maxCardX + CARD_WIDTH);
const min = swipeZone - 0.1;
const max = swipeZone + 0.1;

if (scanLineRatio >= min && scanLineRatio <= max) {
  grantAccess();
} else {
  missAccess("❌ MISS -10 ต้องให้เส้นแดงบนบัตรอยู่ในช่องเขียว");
}
  };

  const nextPage = () => {
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

  return (
    <div className="min-h-[100dvh] w-full overflow-y-auto bg-[#111827] px-2 py-2 text-white">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col pb-6">
        <div className="flex items-start justify-between px-1">
          <div>
            <div className="font-bold text-white/45 text-[clamp(13px,3vw,16px)]">
              ด่าน 3
            </div>
            <h1 className="font-black leading-none text-[clamp(22px,5.8vw,30px)]">
              🔒 CASE LOCKED
            </h1>
            <div className="mt-1 font-black text-yellow-300 text-[clamp(15px,4vw,20px)]">
              Interactive Case File
            </div>
          </div>

          <div className="flex shrink-0 items-start gap-3">
            <button
              onClick={onExit}
              className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/10 text-2xl shadow-lg active:scale-95"
            >
              ⏸
            </button>

            <div className="text-right">
              <div className="font-black text-yellow-300 text-[clamp(28px,7vw,38px)]">
                {score}
              </div>
              <div className="font-bold text-white/45 text-[clamp(12px,3vw,15px)]">
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
            <div className="font-black text-yellow-300 text-[clamp(15px,3.8vw,19px)]">
              CASE FILE #{currentCase.id}
            </div>
            <h2 className="mt-1 font-black leading-tight text-[clamp(20px,5vw,27px)]">
              {currentCase.title}
            </h2>
            <p className="mt-1 font-bold leading-snug text-white/80 text-[clamp(13px,3.5vw,16px)]">
              {currentCase.subtitle}
            </p>
          </div>

          {page === "locked" ? (
            <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-900/90 p-4 text-center">
              <div className="font-black text-yellow-300 text-[clamp(24px,6vw,34px)]">
                FILE LOCKED
              </div>

              <p className="mt-2 font-bold leading-snug text-white/75 text-[clamp(15px,4vw,18px)]">
                ลากบัตรขึ้นเข้า Reader แล้วรูดให้ตรงช่องเขียว
              </p>

              <div
                className="relative mt-4 h-[390px] overflow-hidden rounded-[28px] border border-white/10 bg-black/45 p-3 touch-none select-none"
                onPointerMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();

                  if (accessPhase === "insert") {
                    handleInsertMove(e.clientY, rect.top);
                    return;
                  }

                  if (accessPhase === "swipe") {
                    handleSwipeMove(e.clientX, rect.left, rect.width);
                  }
                }}
                onPointerUp={() => {
                  if (accessPhase === "insert" && isDraggingCard) {
                    setIsDraggingCard(false);
                    missAccess("❌ MISS -10 เสียบบัตรไม่ถึงช่อง Reader");
                    return;
                  }

                  handleSwipeEnd();
                }}
                onPointerCancel={() => {
                  if (accessPhase === "insert" && isDraggingCard) {
                    setIsDraggingCard(false);
                    missAccess("❌ MISS -10 เสียบบัตรไม่ถึงช่อง Reader");
                    return;
                  }

                  handleSwipeEnd();
                }}
              >
                <div className="mx-auto rounded-3xl border border-green-300/30 bg-green-500/10 px-3 py-4">
                  <div className="font-black text-green-300 text-[clamp(18px,4.8vw,25px)]">
                    CARD READER
                  </div>
                  <div className="mx-auto mt-3 h-5 w-44 rounded-full bg-green-300 shadow-[0_0_20px_rgba(134,239,172,0.75)]" />
                  <div className="mt-2 font-black text-white/55 text-[clamp(12px,3vw,14px)]">
                    INSERT CARD FIRST
                  </div>
                </div>

                {accessPhase === "swipe" || accessPhase === "granted" ? (
                  <div className="absolute left-3 right-3 top-[150px] rounded-[24px] border border-white/15 bg-slate-950 p-3">
                    <div className="mb-2 text-center font-black text-green-300 text-[clamp(13px,3.4vw,16px)]">
  STEP 2: รูดบัตร → ให้เส้นแดงอยู่ในช่อง ACCESS
                      <div className="absolute left-3 right-3 top-1/2 h-7 -translate-y-1/2 rounded-full bg-white/10" />

                      <div
                        className="absolute top-1/2 h-20 w-[20%] -translate-y-1/2 rounded-2xl border border-green-300/60 bg-green-500/35 shadow-[0_0_22px_rgba(134,239,172,0.45)]"
                        style={{
                          left: `${Math.min(78, Math.max(8, swipeZone * 100 - 8))}%`,
                        }}
                      >
                        <div className="grid h-full place-items-center font-black text-green-200 text-[clamp(11px,2.8vw,14px)]">
                          ACCESS
                        </div>
                      </div>

                      <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-white/35 text-[clamp(20px,5vw,28px)]">
                        →
                      </div>

                      <div
                        onPointerDown={(e) => {
                          if (accessPhase !== "swipe") return;
                          e.currentTarget.setPointerCapture(e.pointerId);
                          setIsDraggingCard(true);
                          setScanMessage(
                            "➡️ รูดไปทางขวา แล้วปล่อยให้ตรงช่องเขียว"
                          );
                        }}
                        style={{
                          width: CARD_WIDTH,
                          transform: `translateX(${cardX}px)`,
                        }}
                        className={[
                          "absolute left-3 top-[20px] h-[76px] cursor-grab rounded-2xl border-2 p-2 text-left shadow-2xl transition-colors active:cursor-grabbing",
                          accessPhase === "granted"
                            ? "border-green-300 bg-green-500 text-white"
                            : "border-yellow-300/60 bg-yellow-300 text-slate-950",
                        ].join(" ")}
                      >
                        <MiniCard />
                      </div>
                    </div>
                  </div>
                ) : null}

                {accessPhase === "insert" || accessPhase === "miss" ? (
                  <div
                    onPointerDown={(e) => {
                      if (accessPhase !== "insert") return;
                      e.currentTarget.setPointerCapture(e.pointerId);
                      setIsDraggingCard(true);
                      setScanMessage("⬆️ ลากขึ้นไปเสียบช่อง CARD READER");
                    }}
                    style={{
                      transform: `translateY(${cardY}px)`,
                    }}
                    className={[
                      "absolute left-8 right-8 top-[235px] cursor-grab rounded-[22px] border-2 p-3 text-left shadow-2xl transition-colors active:cursor-grabbing",
                      accessPhase === "miss"
                        ? "border-red-300 bg-red-500 text-white"
                        : "border-yellow-300/60 bg-yellow-300 text-slate-950",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[clamp(30px,9vw,48px)]">🪪</div>
                      <div className="text-right">
                        <div className="font-black text-[clamp(15px,4vw,20px)]">
                          ACCESS CARD
                        </div>
                        <div className="font-black opacity-70 text-[clamp(11px,3vw,14px)]">
                          TANIOBIS SAFETY
                        </div>
                      </div>
                    </div>

                    <div className="relative mt-2 h-3 rounded-full bg-black/25">
  <div className="absolute left-1/2 top-[-42px] h-[64px] w-1 -translate-x-1/2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
  <div className="h-full w-2/3 rounded-full bg-black/45" />
</div>
                  </div>
                ) : null}

                <div
                  className={[
                    "absolute bottom-3 left-3 right-3 rounded-2xl px-3 py-3 font-black text-[clamp(15px,4vw,20px)]",
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
    </div>
  );
}

function MiniCard() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute left-1/2 top-[-16px] z-20 h-[108px] w-1 -translate-x-1/2 rounded-full bg-red-500 shadow-[0_0_14px_rgba(239,68,68,1)]" />

      <div className="flex items-center gap-2">
        <div className="text-[32px]">🪪</div>
        <div className="min-w-0">
          <div className="truncate font-black text-[13px]">ACCESS</div>
          <div className="truncate font-black opacity-70 text-[10px]">
            TANIOBIS
          </div>
        </div>
      </div>

      <div className="mt-2 h-2 rounded-full bg-black/25">
        <div className="h-full w-2/3 rounded-full bg-black/45" />
      </div>

      <div className="mt-1 text-center font-black text-[9px] text-red-700">
        ALIGN RED LINE
      </div>
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