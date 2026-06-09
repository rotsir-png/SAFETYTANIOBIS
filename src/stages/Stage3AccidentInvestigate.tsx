import React, { useEffect, useRef, useState } from "react";
import PauseButton, { usePause } from "../components/PauseButton";
import { stage3Cases, type Stage3CaseLine } from "../data/stage3Cases";

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
type UnlockMode = "letterFill" | "wordRebuild" | "fileScramble";

type RecoverToken = {
  id: string;
  text: string;
};

type RecoverPuzzle = {
  answer: string;
  maskedAnswer: string;
  beforeText: string;
  afterText: string;
  missingLetters: string[];
  choices: RecoverToken[];
};
type RebuildPiece = {
  id: string;
  text: string;
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
function splitThaiGraphemes(text: string) {
  const SegmenterCtor = (globalThis.Intl as any)?.Segmenter;

  if (SegmenterCtor) {
    const segmenter = new SegmenterCtor("th", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (item: any) => item.segment);
  }

  // fallback: กันสระ/วรรณยุกต์ไทยหลุดจากพยัญชนะ
  const marks = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/;
  const result: string[] = [];

  for (const char of Array.from(text)) {
    if (marks.test(char) && result.length > 0) {
      result[result.length - 1] += char;
    } else {
      result.push(char);
    }
  }

  return result;
}
function makeRebuildPieces(parts: string[]) {
  const cleanParts = parts.map((p) => p.trim()).filter(Boolean);

  const pieces = shuffle(cleanParts).map((text, index) => ({
    id: `${text}-${index}-${Math.random()}`,
    text,
  }));

  return {
    pieces,
    correctOrder: cleanParts,
  };
}

function splitKeywordForRebuild(keyword: string) {
  const bySpace = keyword.split(/\s+/).map((p) => p.trim()).filter(Boolean);
  if (bySpace.length >= 2) return bySpace;

  const tokens = splitThaiGraphemes(keyword);

  if (tokens.length <= 4) return [];
  if (tokens.length <= 7) {
    const mid = Math.ceil(tokens.length / 2);
    return [tokens.slice(0, mid).join(""), tokens.slice(mid).join("")];
  }

  const one = Math.ceil(tokens.length / 3);
  const two = Math.ceil((tokens.length * 2) / 3);

  return [
    tokens.slice(0, one).join(""),
    tokens.slice(one, two).join(""),
    tokens.slice(two).join(""),
  ].filter(Boolean);
}

function splitLineForScramble(text: string, keywords: string[]) {
  const keywordParts = keywords
    .filter((keyword) => text.includes(keyword))
    .sort((a, b) => text.indexOf(a) - text.indexOf(b));

  if (keywordParts.length >= 2) return keywordParts;

  const slashParts = text.split(/[\/|]/g).map((p) => p.trim()).filter(Boolean);
  if (slashParts.length >= 2) return slashParts;

  const words = text.split(/\s+/).map((p) => p.trim()).filter(Boolean);
  if (words.length >= 3) return words;

  return [];
}

function canWordRebuild(line: Stage3CaseLine) {
  return line.keywords.some((keyword) => splitKeywordForRebuild(keyword).length >= 2);
}

function canFileScramble(line: Stage3CaseLine) {
  return splitLineForScramble(line.text, line.keywords).length >= 2;
}
function makeRecoverPuzzle(line: Stage3CaseLine): RecoverPuzzle {
  const answer =
    line.keywords.length > 0
      ? line.keywords[Math.floor(Math.random() * line.keywords.length)]
      : line.text.trim().split(/\s+/)[0] || line.text[0] || "";

  const answerIndex = line.text.indexOf(answer);
  const beforeText = answerIndex >= 0 ? line.text.slice(0, answerIndex) : "";
  const afterText =
    answerIndex >= 0 ? line.text.slice(answerIndex + answer.length) : line.text;

  const tokens = splitThaiGraphemes(answer);

  const candidateIndexes = tokens
    .map((token, index) => ({ token, index }))
    .filter((item) => item.token.trim() !== "")
    .filter((item) => item.token !== " ")
    .filter((item) => item.token !== "-");

    let minMissing = 3;
    let maxMissing = 5;
    
    if (candidateIndexes.length <= 4) {
      minMissing = 2;
      maxMissing = 2;
    } else if (candidateIndexes.length <= 6) {
      minMissing = 2;
      maxMissing = 3;
    } else if (candidateIndexes.length <= 9) {
      minMissing = 3;
      maxMissing = 4;
    }
    
    let missingCount =
      minMissing + Math.floor(Math.random() * (maxMissing - minMissing + 1));
    
    missingCount = Math.min(missingCount, candidateIndexes.length);

  let missingIndexes = shuffle(candidateIndexes).slice(0, missingCount);

  missingIndexes = missingIndexes.sort((a, b) => a.index - b.index);

  const missingLetters = missingIndexes.map((item) => item.token);

  const maskedAnswer = tokens
    .map((token, index) =>
      missingIndexes.some((item) => item.index === index) ? "_" : token
    )
    .join("");

  const fallbackDecoys = [
    "ก",
    "ข",
    "ค",
    "ง",
    "จ",
    "ต",
    "ถ",
    "ท",
    "น",
    "บ",
    "ป",
    "พ",
    "ม",
    "ย",
    "ร",
    "ล",
    "ว",
    "ส",
    "อ",
    "ะ",
    "า",
  ];

  const decoys = shuffle([...tokens, ...fallbackDecoys])
    .filter((token) => token.trim() !== "")
    .filter((token) => !missingLetters.includes(token))
    .slice(0, Math.max(0, 10 - missingLetters.length));

  const choiceLetters = shuffle([...missingLetters, ...decoys]);

  const choices = choiceLetters.map((text, index) => ({
    id: `${text}-${index}-${Math.random()}`,
    text,
  }));

  return {
    answer,
    maskedAnswer,
    beforeText,
    afterText,
    missingLetters,
    choices,
  };
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
  const [zoneLeftPx, setZoneLeftPx] = useState(0);
  const [accessResult, setAccessResult] = useState<"perfect" | "good" | null>(null);
  const [scanMessage, setScanMessage] = useState("ลากบัตรขึ้นไปเสียบ Reader");
  const [inserted, setInserted] = useState(false);

  const [unlockMode, setUnlockMode] = useState<UnlockMode | null>(null);
  const [recoverAnswer, setRecoverAnswer] = useState("");
  const [recoverMaskedAnswer, setRecoverMaskedAnswer] = useState("");
  const [recoverBeforeText, setRecoverBeforeText] = useState("");
  const [recoverAfterText, setRecoverAfterText] = useState("");
  const [recoverMissingLetters, setRecoverMissingLetters] = useState<string[]>([]);
  const [recoverChoices, setRecoverChoices] = useState<RecoverToken[]>([]);
  const [recoverSelected, setRecoverSelected] = useState<RecoverToken[]>([]);
const [recoverError, setRecoverError] = useState("");
const [rebuildPieces, setRebuildPieces] = useState<RebuildPiece[]>([]);
const [rebuildCorrectOrder, setRebuildCorrectOrder] = useState<string[]>([]);
const [draggingPieceId, setDraggingPieceId] = useState<string | null>(null);

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
  const page = pageOrder[pageIndex];

  const getLines = (): Stage3CaseLine[] => {
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
      setRevealedCount(0);
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
        setAccessPhase("swipe");
        setInserted(false);
        setCardY(0);
        setCardX(0);
        cardXRef.current = 0;
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

  const startUnlockInfo = () => {
    if (paused || page === "locked" || allRevealed) return;

    const targetLine = lines[revealedCount];
    if (!targetLine) return;

    const puzzle = makeRecoverPuzzle(targetLine);

    setUnlockMode("letterFill");
    setRecoverAnswer(puzzle.answer);
    setRecoverMaskedAnswer(puzzle.maskedAnswer);
    setRecoverBeforeText(puzzle.beforeText);
    setRecoverAfterText(puzzle.afterText);
    setRecoverMissingLetters(puzzle.missingLetters);
    setRecoverChoices(puzzle.choices);
    setRecoverSelected([]);
    setRecoverError("");
  };

  const selectRecoverToken = (token: RecoverToken) => {
    if (recoverSelected.length >= recoverMissingLetters.length) return;

    setRecoverChoices((choices) => choices.filter((item) => item.id !== token.id));
    setRecoverSelected((selected) => [...selected, token]);
    setRecoverError("");
  };

  const removeRecoverToken = (token: RecoverToken) => {
    setRecoverSelected((selected) => selected.filter((item) => item.id !== token.id));
    setRecoverChoices((choices) => [...choices, token]);
    setRecoverError("");
  };

  const submitRecoverPuzzle = () => {
    if (paused || !unlockMode) return;

    if (recoverSelected.length < recoverMissingLetters.length) {
      setRecoverError("❌ เติมตัวอักษรให้ครบก่อน");
      return;
    }

    const playerAnswer = recoverSelected.map((token) => token.text).join("");
    const correctAnswer = recoverMissingLetters.join("");

    if (playerAnswer !== correctAnswer) {
      setRecoverError("❌ ตัวอักษรยังไม่ถูก ลองดูรูปคำอีกที");
      return;
    }

    setUnlockMode(null);
    setRecoverAnswer("");
    setRecoverMaskedAnswer("");
    setRecoverBeforeText("");
    setRecoverAfterText("");
    setRecoverMissingLetters([]);
    setRecoverChoices([]);
    setRecoverSelected([]);
    setRecoverError("");

    setRevealedCount((v) => Math.min(lines.length, v + 1));
    setScore((s) => s + 25);
  };

  const nextPage = () => {
    if (paused) return;
    if (page === "locked") return;

    if (!allRevealed) {
      startUnlockInfo();
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

  const previewAnswer = (() => {
    let slotIndex = 0;
  
    return splitThaiGraphemes(recoverMaskedAnswer)
      .map((token) => {
        if (token !== "_") return token;
  
        const selected = recoverSelected[slotIndex];
        slotIndex += 1;
  
        return selected ? selected.text : "_";
      })
      .join("");
  })();

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
                ref={touchAreaRef}
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

              {unlockMode && (
                <div className="mt-4 rounded-[24px] border border-green-300/30 bg-black/60 p-4 text-center shadow-[0_0_24px_rgba(34,197,94,0.25)]">
                  <div className="font-black text-green-300 text-[clamp(20px,5vw,28px)]">
                    🔡 LETTER RECOVERY
                  </div>

                  <p className="mt-2 font-bold text-white/70 text-[clamp(13px,3.6vw,16px)]">
                    เติมตัวอักษรที่หายไป เพื่อกู้ข้อมูลที่ถูกล็อก
                  </p>

                  <div className="mt-3 rounded-2xl bg-white/10 px-3 py-3 text-left">
                    <div className="font-black text-yellow-300 text-[clamp(13px,3.5vw,16px)]">
                      💡 HINT
                    </div>

                    <div className="mt-1 font-bold leading-snug text-white text-[clamp(15px,4vw,19px)]">
                      อ่านบริบท แล้วเติมตัวอักษรให้คำสำคัญสมบูรณ์
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-3">
                    <div className="mb-2 font-black text-white/50 text-[clamp(12px,3.2vw,15px)]">
                      เติมตัวอักษรที่หายไป
                    </div>

                    <div className="rounded-xl bg-white/10 p-3 font-black leading-snug text-white text-[clamp(16px,4.3vw,21px)]">
                      {recoverBeforeText}
                      <span className="mx-1 rounded-lg bg-yellow-300 px-2 py-1 font-black tracking-widest text-slate-950">
                        {previewAnswer || recoverMaskedAnswer}
                      </span>
                      {recoverAfterText}
                    </div>

                    <div className="mt-3 flex min-h-[48px] flex-wrap items-center justify-center gap-2 rounded-xl bg-white/5 p-2">
                      {recoverSelected.length === 0 ? (
                        <div className="font-bold text-white/35 text-[clamp(13px,3.5vw,16px)]">
                          แตะตัวอักษรด้านล่างเพื่อเติมช่องว่าง
                        </div>
                      ) : (
                        recoverSelected.map((token) => (
                          <button
                            key={token.id}
                            onClick={() => removeRecoverToken(token)}
                            className="rounded-xl bg-green-400 px-3 py-2 font-black text-slate-950 active:scale-95 text-[clamp(15px,4vw,19px)]"
                          >
                            {token.text}
                          </button>
                        ))
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      {recoverChoices.map((token) => (
                        <button
                          key={token.id}
                          onClick={() => selectRecoverToken(token)}
                          className="rounded-xl bg-yellow-300 px-3 py-2 font-black text-slate-950 shadow active:scale-95 text-[clamp(15px,4vw,19px)]"
                        >
                          {token.text}
                        </button>
                      ))}
                    </div>
                  </div>

                  {recoverError && (
                    <div className="mt-3 rounded-xl bg-red-600 px-3 py-2 font-black text-white text-[clamp(13px,3.5vw,16px)]">
                      {recoverError}
                    </div>
                  )}

                  <button
                    onClick={submitRecoverPuzzle}
                    className="mt-4 w-full rounded-2xl bg-green-500 py-4 font-black text-slate-950 shadow-lg active:scale-95 text-[clamp(19px,5vw,27px)]"
                  >
                    ✅ SUBMIT / กู้ข้อมูล
                  </button>
                </div>
              )}

              <div className="mt-4 space-y-3">
                {lines.map((line, index) => {
                  const revealed = index < revealedCount;

                  return (
                    <div
                    key={`${line.text}-${index}`}
                      className={[
                        "rounded-2xl px-4 py-4 font-bold leading-snug shadow-lg transition-all text-[clamp(15px,4vw,19px)]",
                        revealed
                          ? "bg-white text-slate-950"
                          : "bg-black/55 text-white/25 blur-[1px]",
                      ].join(" ")}
                    >
                      {revealed ? line.text : "████████████████████████"}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={unlockMode ? undefined : nextPage}
                disabled={!!unlockMode}
                className={[
                  "mt-5 w-full rounded-2xl py-4 font-black text-white shadow-lg active:scale-95 text-[clamp(20px,5.5vw,29px)]",
                  unlockMode ? "bg-slate-600 opacity-60" : "bg-green-600",
                ].join(" ")}
              >
                {!allRevealed
                  ? "🔦 เปิดข้อมูลถัดไป 🔒"
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