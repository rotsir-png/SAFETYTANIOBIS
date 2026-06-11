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
  onFail?: () => void;
};

type CasePage =
  | "locked"
  | "report"
  | "evidence"
  | "rootCause"
  | "prevention";

type AccessPhase = "insert" | "granted" | "miss";
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
];
const CASES_PER_STAGE3_RUN = 5;
const STAGE3_MAX_HP = 5;
const STAGE3_PLAYED_CASE_IDS_KEY = "tanio_stage3_played_case_ids";

function getPlayedCaseIds() {
  try {
    return JSON.parse(
      localStorage.getItem(STAGE3_PLAYED_CASE_IDS_KEY) ?? "[]"
    ) as string[];
  } catch {
    return [];
  }
}

function savePlayedCaseId(caseId: string) {
  const played = getPlayedCaseIds();
  const next = Array.from(new Set([...played, caseId]));
  localStorage.setItem(STAGE3_PLAYED_CASE_IDS_KEY, JSON.stringify(next));
}

function pickRunCaseIds() {
  const allIds = stage3Cases.map((item) => item.id);
  let played = getPlayedCaseIds();

  let available = allIds.filter((id) => !played.includes(id));

  if (available.length < CASES_PER_STAGE3_RUN) {
    localStorage.setItem(STAGE3_PLAYED_CASE_IDS_KEY, "[]");
    available = allIds;
  }

  return shuffle(available).slice(0, CASES_PER_STAGE3_RUN);
}

const CARD_HEIGHT = 92;

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}
function getUnlockButtonText(page: CasePage) {
  if (page === "evidence") return "เปิดหลักฐานที่ซ่อนอยู่";
  if (page === "rootCause") return "สาเหตุของเหตุการณ์ที่เกิดขึ้น";
  if (page === "prevention") return "มาตรการป้องกันเบื้องต้น";
  return "เปิดข้อมูล";
}
export default function Stage3AccidentInvestigate({ onExit, onClear, onFail }: Props) {
  const { paused, togglePause, PauseOverlay } = usePause({
    onGiveUp: () => {
      onExit?.();
    },
  });

  const [runCaseIds] = useState(() => pickRunCaseIds());
const [runCaseIndex, setRunCaseIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [revealedIndexes, setRevealedIndexes] = useState<number[]>([]);
  const [reportUnlocked, setReportUnlocked] = useState(false);
const [pendingLineIndex, setPendingLineIndex] = useState<number | null>(null);
  const [stageFeedback, setStageFeedback] = useState("");
  const [caseClosed, setCaseClosed] = useState(false);
  const [stageHp, setStageHp] = useState(STAGE3_MAX_HP);
const [hpHit, setHpHit] = useState(false);

  const [accessPhase, setAccessPhase] = useState<AccessPhase>("insert");
const [cardY, setCardY] = useState(0);
const [isDraggingCard, setIsDraggingCard] = useState(false);
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
const [showIntro, setShowIntro] = useState(true);
const touchAreaRef = useRef<HTMLDivElement | null>(null);

const dragStartRef = useRef({
  pointerY: 0,
  startCardY: 0,
});

  const currentCase =
  stage3Cases.find((item) => item.id === runCaseIds[runCaseIndex]) ??
  stage3Cases[0];
  const page = pageOrder[Math.min(pageIndex, pageOrder.length - 1)];

  const getLines = (): Stage3CaseLine[] => {
    if (page === "report") return currentCase.incidentReport;
    if (page === "evidence") return currentCase.evidence;
    if (page === "rootCause") return currentCase.rootCause;
    if (page === "prevention") return currentCase.prevention;
    return [];
  };

  const lines = getLines();
  const allRevealed =
  page === "locked" || revealedIndexes.length >= lines.length;
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
  }, [runCaseIndex, pageIndex]);
  const resetAccessCard = () => {
    setAccessPhase("insert");
    setCardY(0);
    setIsDraggingCard(false);
    setInserted(false);
    setScanMessage("ลากบัตรขึ้นไปเสียบ Reader");
  };

  const missAccess = (message: string) => {
    setAccessPhase("miss");
    setScanMessage(message);
  
    takeStageDamage();
  
    window.setTimeout(() => {
      resetAccessCard();
    }, 850);
  };

  const handleInsertMove = (clientY: number) => {
    if (showIntro) return;
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
  const showStageFeedback = (message: string) => {
    setStageFeedback(message);
  
    window.setTimeout(() => {
      setStageFeedback("");
    }, 650);
  };
  const completeUnlock = () => {
  
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
    if (showIntro) return;
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
        id: `${text}-${index}`,
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
  const takeStageDamage = () => {
    setStageHp((hp) => {
      const nextHp = Math.max(0, hp - 1);
  
      setHpHit(true);
      setScreenShake(true);
  
      window.setTimeout(() => setHpHit(false), 300);
      window.setTimeout(() => setScreenShake(false), 260);
  
      if (nextHp <= 0) {
        onFail?.();
      }
  
      return nextHp;
    });
  };
  const submitRecoverPuzzle = () => {
    if (paused || stageHp <= 0 || unlockMode !== "letterFill" || !phasePuzzle) return;
  
    if (phaseFilledWords.length < phasePuzzle.keywords.length) {
      setRecoverError("❌ เติมคำให้ครบก่อน");
      return;
    }
  
    const normalizeAnswer = (text: string) =>
  text.replace(/[【】()[\]\s]/g, "").trim();

const answerWordsInMaskedOrder = phasePuzzle.keywords;

const isCorrectOrder =
  phaseFilledWords.map(normalizeAnswer).join("|") ===
  answerWordsInMaskedOrder.map(normalizeAnswer).join("|");
  
    if (!isCorrectOrder) {
      setRecoverError("❌ คำยังไม่ตรงช่อง ลองเรียงใหม่อีกครั้ง");
      triggerWrongShake();
      setFlashType("wrong");
      setScreenShake(true);
      takeStageDamage();
      
      window.setTimeout(() => setFlashType(null), 180);
      window.setTimeout(() => setScreenShake(false), 260);
      // ตอบผิด: คงชุดคำเดิมไว้ ไม่สุ่มใหม่
      setRecoverSelected([]);
      setPhaseFilledWords([]);
      setRecoverChoices(
        phasePuzzle.keywords.map((text, index) => ({
          id: `${text}-${index}`,
          text,
        }))
      );
  
      return;
    }
  
    setFlashType("correct");
window.setTimeout(() => setFlashType(null), 180);

showStageFeedback("✅ ถูกต้อง");
  
    resetUnlockState();
    completeUnlock();
  };
  const nextPage = () => {
    if (showIntro) return;
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
  
    if (pageIndex >= pageOrder.length - 1) {
      savePlayedCaseId(currentCase.id);
      setCaseClosed(true);
      return;
    }
  
    setPageIndex((v) => v + 1);
  };
  const goNextCase = () => {
    setCaseClosed(false);
  
    if (runCaseIndex >= runCaseIds.length - 1) {
      onClear?.(runCaseIds.length);
      return;
    }
  
    setRunCaseIndex((v) => v + 1);
    setPageIndex(0);
    setRevealedIndexes([]);
    setReportUnlocked(false);
  
    resetAccessCard();
  };
  const revealedTextList = lines.filter((_, index) =>
  revealedIndexes.includes(index)
);
const reportDetailsReady =
  page === "report" ? allRevealed && !unlockMode : reportUnlocked;
  const fillIndexRef = { current: 0 };
  return (
    <>
      {showIntro && (
        <div
          onPointerUp={() => setShowIntro(false)}
          className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-black/90 px-6 text-center"
        >
          <div className="mb-4 text-7xl">🕵️</div>

          <div
            className="font-game font-black text-yellow-300"
            style={{
              fontSize: "clamp(1.6rem,7vw,2.3rem)",
              textShadow: "0 3px 0 rgba(0,0,0,0.5)",
            }}
          >
            ACCIDENT INVESTIGATION
          </div>

          <div
            className="mt-3 font-game leading-relaxed text-white/85"
            style={{ fontSize: "clamp(0.95rem,4vw,1.15rem)" }}
          >
            <div>🔓 เปิดแฟ้มอุบัติเหตุ</div>
            <div>📋 วิเคราะห์เหตุการณ์ที่เกิดขึ้น</div>
            <div>🔍 ค้นหาหลักฐาน</div>
            <div>⚠️ ระบุสาเหตุ</div>
            <div>✅ เรียนรู้วิธีป้องกัน</div>
          </div>

          <div className="mt-4 grid w-full max-w-[340px] gap-2">
            <div className="rounded-xl border border-red-400/30 bg-red-500/15 px-3 py-2">
              <div className="font-game font-black text-red-300">HP -1</div>
              <div className="text-white/75" style={{ fontSize: "clamp(0.78rem,3.2vw,0.95rem)" }}>
                เสียบบัตรไม่ถึง Reader
              </div>
            </div>

            <div className="rounded-xl border border-red-400/30 bg-red-500/15 px-3 py-2">
              <div className="font-game font-black text-red-300">HP -1</div>
              <div className="text-white/75" style={{ fontSize: "clamp(0.78rem,3.2vw,0.95rem)" }}>
                เติมคำผิด
              </div>
            </div>

            <div className="rounded-xl border border-green-400/30 bg-green-500/15 px-3 py-2">
              <div className="font-game font-black text-green-300">เป้าหมาย</div>
              <div className="text-white/75" style={{ fontSize: "clamp(0.78rem,3.2vw,0.95rem)" }}>
                ปิดคดีให้ครบ 5 เคส
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-yellow-300/40 bg-yellow-300/10 px-3 py-3">
            <div
              className="font-game font-black text-yellow-300"
              style={{ fontSize: "clamp(0.95rem,4vw,1.15rem)" }}
            >
              💀 HP หมด = ภารกิจล้มเหลว
            </div>
          </div>

          <div className="mt-8 animate-pulse rounded-2xl border-2 border-yellow-300/40 bg-yellow-300/10 px-5 py-3">
            <div
              className="font-game font-black text-yellow-300"
              style={{ fontSize: "clamp(1.1rem,5vw,1.45rem)" }}
            >
              👆 แตะเพื่อเริ่มสืบสวน
            </div>
          </div>
        </div>
      )}

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
    {runCaseIndex + 1}/{runCaseIds.length}
  </div>
  <div className="font-game font-bold text-white/45 text-[clamp(10px,3vw,12px)]">
    เคส
  </div>
</div>
  </div>
  </div>

<div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2">
  <span className="font-game font-black text-red-300 text-[clamp(12px,3.2vw,15px)]">
    HP
  </span>

  <div className="flex gap-1.5">
    {Array.from({ length: STAGE3_MAX_HP }, (_, i) => (
      <div
        key={i}
        className={[
          "grid h-6 w-6 place-items-center rounded-full text-[15px] transition-all duration-200",
          i < stageHp
            ? hpHit
              ? "bg-green-500 shadow-[0_0_14px_rgba(248,113,113,0.9)]"
              : "bg-green-400 shadow-[0_0_10px_rgba(248,113,113,0.55)]"
            : "bg-white/10 opacity-40",
        ].join(" ")}
      >
        
      </div>
    ))}
  </div>

  <div className="ml-auto font-game font-black text-white/55 text-[clamp(11px,3vw,13px)]">
    {stageHp}/{STAGE3_MAX_HP}
  </div>
</div>

<div className="arcade-card mt-2 rounded-2xl px-3 py-2">

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
  <div className="arcade-card mt-1 rounded-2xl border-l-4 border-yellow-300 px-3 py-1.5">
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
  py-2
  font-game
  font-black
  leading-tight
  text-slate-950
  shadow-lg
  text-[clamp(17px,4.6vw,22px)]
  leading-snug
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

                  if (accessPhase === "insert") {
                    handleInsertMove(e.clientY);
                    return;
                  }
                }}
                onPointerUp={() => {
                  if (paused) return;

                  if (accessPhase === "insert" && isDraggingCard) {
                    setIsDraggingCard(false);
                    missAccess("❌ MISS เสียบบัตรไม่ถึง Reader");
                    return;
                  }
                }}
                onPointerCancel={() => {
                  if (paused) return;

                  if (accessPhase === "insert" && isDraggingCard) {
                    setIsDraggingCard(false);
                    missAccess("❌ MISS เสียบบัตรไม่ถึง Reader");
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
                  {accessPhase === "insert" ? "INSERT CARD FIRST" : "ACCESS GRANTED"}
                  </div>
                </div>

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
                    height: CARD_HEIGHT,
                    left: 32,
                    right: 32,
                    top: 210,
                    transform: inserted
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
            <div className="arcade-panel mt-1 flex min-h-0 flex-1 flex-col rounded-[1.25rem] p-2 overflow-y-auto">
              <div
  className={
    page === "report"
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
  ? "arcade-text font-game font-black text-yellow-300 text-center leading-tight text-[clamp(14px,3.6vw,18px)]"
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

{revealedTextList.length > 0 && !unlockMode && page !== "report" && (
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
 <div className="mt-0 flex min-h-0 flex-1 flex-col text-center">

<div className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-slate-950 p-0.5 pb-20">

<div className="max-h-[28dvh] space-y-1 overflow-y-auto rounded-xl bg-white/10 px-2 py-2 font-black leading-snug text-white text-[clamp(18px,4.5vw,23px)]">
<div
  className={[
    "rounded-xl bg-black/25 px-3 py-3 text-left leading-snug",
    wrongShake ? "stage3-wrong-shake" : "",
  ].join(" ")}
>
{phasePuzzle?.maskedLines?.map((line, lineIndex) => {
    const displayLine = line.replace(/____/g, () => {
      const word = phaseFilledWords[fillIndexRef.current];
fillIndexRef.current += 1;

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
{recoverSelected.length > 0 && (
  <>
    <div className="mb-1 text-center font-game font-black text-green-300 text-[clamp(13px,3.5vw,16px)]">
    ✕ แตะเพื่อนำคำออก
    </div>

    <div className="mb-2 flex flex-wrap justify-center gap-2">
      {recoverSelected.map((token) => (
        <button
          key={token.id}
          onClick={() => removeRecoverToken(token)}
          className="rounded-full bg-green-400 px-3 py-1.5 font-game font-black text-slate-950 shadow active:scale-95 text-[clamp(16px,4.3vw,20px)]"
        >
          {token.text}
        </button>
      ))}
    </div>
  </>
)}
<div className="mt-1 flex max-h-[22dvh] flex-wrap items-center justify-center gap-1.5 overflow-y-auto px-1 pb-2">
      {recoverChoices.map((token) => (
          <button
            key={token.id}
            onClick={() => selectRecoverToken(token)}
            className="max-w-full rounded-xl bg-yellow-300 px-4 py-2.5 font-game font-black leading-tight text-slate-950 shadow-lg active:scale-95 text-[clamp(18px,5vw,23px)]"
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
      className="mt-1 shrink-0 w-full rounded-xl bg-green-500 py-3 font-game font-black text-white shadow-lg active:scale-95"
style={{
  fontSize: "clamp(1.25rem,5.7vw,1.75rem)",
  textShadow: "0 3px 0 rgba(0,0,0,0.55)",
}}
    >
      ✅ ส่งคำตอบ
    </button>
  </div>
)}

<div className={unlockMode ? "hidden" : "mt-4 space-y-3"}>
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
              
              {allRevealed && !unlockMode && (
  <button
    onClick={nextPage}
    className="mt-5 w-full rounded-2xl bg-green-600 py-4 font-game font-black text-white shadow-lg active:scale-95 text-[clamp(20px,5.5vw,29px)]"
  >
    {page === "report"
  ? "หาหลักฐานเพิ่มเติม"
  : page === "evidence"
  ? "วิเคราะห์สาเหตุ"
  : page === "rootCause"
  ? "ดูวิธีป้องกัน"
  : page === "prevention"
  ? "ปิดเคส / เคสต่อไป"
  : "เปิดหน้าถัดไป ▶"}
  </button>
)}
            </div>
          )}
        </div>
        
        {caseClosed && (
  <div className="fixed inset-0 z-[99998] overflow-y-auto bg-black/80 px-3 py-4">
  <div className="mx-auto w-full max-w-[410px] rounded-[30px] border-4 border-yellow-300 bg-slate-950 p-4 text-center shadow-[0_0_42px_rgba(250,204,21,0.65)]">

      <div
        className="font-game font-black text-yellow-300 text-[clamp(34px,9vw,50px)]"
        style={{ textShadow: "0 4px 0 rgba(0,0,0,0.65)" }}
      >
        📋 สรุปเคส
      </div>
      <div className="mt-2 rounded-2xl border-2 border-yellow-300 bg-yellow-300 px-3 py-2 text-center">
  <div className="font-game font-black text-slate-950 text-[clamp(18px,5vw,26px)]">
    {currentCase.title}
  </div>
</div>

      <div className="mt-3 rounded-2xl border-2 border-orange-300 bg-white px-3 py-3 text-left shadow-lg">
        <div className="font-game font-black text-orange-600 text-[clamp(20px,5.5vw,28px)]">
          ⚠️ สาเหตุ
        </div>

        <div className="mt-1 font-game font-black leading-snug text-slate-950 text-[clamp(20px,5.5vw,28px)]">
          {currentCase.rootCause.map((item) => item.text).join(" ")}
        </div>
      </div>

      <div className="mt-3 rounded-2xl border-2 border-green-400 bg-white px-3 py-3 text-left shadow-lg">
        <div className="font-game font-black text-green-700 text-[clamp(20px,5.5vw,28px)]">
          ✅ การป้องกัน
        </div>

        <div className="mt-2 space-y-2">
          {currentCase.prevention.map((item, index) => (
            <div
              key={`${item.text}-${index}`}
              className="rounded-xl bg-slate-100 px-3 py-2 font-game font-black leading-snug text-slate-950 text-[clamp(19px,5.2vw,26px)]"
            >
              ✓ {item.text}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={goNextCase}
        className="mt-4 w-full rounded-2xl bg-green-600 py-4 font-game font-black text-white shadow-lg active:scale-95"
        style={{
          fontSize: "clamp(1.35rem,6vw,2rem)",
          textShadow: "0 3px 0 rgba(0,0,0,0.55)",
        }}
      >
        เคสถัดไป ▶
      </button>
    </div>
  </div>
)}
      {stageFeedback && (
  <div className="pointer-events-none fixed inset-0 z-[99998] grid place-items-center px-4">
    <div className="animate-bounce rounded-[28px] border-4 border-yellow-300 bg-black px-5 py-4 text-center font-game font-black text-yellow-300 shadow-[0_0_34px_rgba(250,204,21,0.75)] text-[clamp(24px,7vw,38px)]">
      {stageFeedback}
    </div>
  </div>
)}

<div className="relative z-[99999]">{PauseOverlay}</div>
    </div>
    </>
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
  ] as const;
}