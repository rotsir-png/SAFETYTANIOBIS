export type Stage3UnlockStep =
  | { type: "swipe_card"; title: string }
  | {
      type: "redacted_word";
      title: string;
      question: string;
      revealedText: string;
      answer: string;
      choices: string[];
    }
  | {
      type: "evidence_snap";
      title: string;
      instruction: string;
      correctEvidenceIds: string[];
      evidences: { id: string; label: string; icon: string }[];
    }
  | { type: "security_verify"; title: string };

export type Stage3CaseLine = {
  text: string;
  keywords?: string[];
};

export type Stage3CasePhaseKey =
  | "incidentReport"
  | "evidence"
  | "rootCause"
  | "prevention"
  | "lesson";

export type Stage3PuzzlePhaseKey = Exclude<Stage3CasePhaseKey, "lesson">;

export type Stage3Case = {
  id: string;
  title: string;
  subtitle: string;
  securityLevel: number;
  unlockSteps: Stage3UnlockStep[];
  incidentReport: Stage3CaseLine[];
  evidence: Stage3CaseLine[];
  rootCause: Stage3CaseLine[];
  prevention: Stage3CaseLine[];
  lesson: Stage3CaseLine;
};

export type Stage3PhasePuzzle = {
  lines: string[];
  keywords: string[];
  maskedLines: string[];
};

const STAGE3_STOP_WORDS = new Set([
  "และ",
  "หรือ",
  "ให้",
  "ต้อง",
  "ก่อน",
  "หลัง",
  "การ",
  "จาก",
  "ใน",
  "ที่",
  "ขณะ",
  "อยู่",
  "ทันที",
  "พบ",
  "มี",
  "เป็น",
  "กับ",
  "ของ",
  "ยัง",
  "ได้",
  "ต่อ",
]);

export function getStage3PhaseLines(
  stageCase: Stage3Case,
  phaseKey: Stage3PuzzlePhaseKey
): Stage3CaseLine[] {
  return stageCase[phaseKey];
}
function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}
export function pickStage3KeywordsFromLines(
  lines: Stage3CaseLine[],
  maxKeywords = 3
): string[] {
  const manualKeywords = lines
    .flatMap((line) => line.keywords ?? [])
    .map((word) => word.trim())
    .filter(Boolean);

  const removeOverlappingKeywords = (keywords: string[]) => {
    const sorted = [...keywords].sort((a, b) => b.length - a.length);
    const result: string[] = [];

    sorted.forEach((word) => {
      const isOverlapping = result.some(
        (picked) => picked.includes(word) || word.includes(picked)
      );

      if (!isOverlapping) {
        result.push(word);
      }
    });

    return result;
  };

  if (manualKeywords.length > 0) {
    const uniqueKeywords = removeOverlappingKeywords(
      Array.from(new Set(manualKeywords))
    );

    return shuffle(uniqueKeywords).slice(0, maxKeywords);
  }

  const words =
    lines
      .map((line) => line.text)
      .join(" ")
      .match(/[ก-๙A-Za-z0-9/]+/g) ?? [];

  const candidates = Array.from(new Set(words))
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => word.length >= 3)
    .filter((word) => !STAGE3_STOP_WORDS.has(word));

  const uniqueCandidates = removeOverlappingKeywords(candidates);

  return shuffle(uniqueCandidates).slice(0, maxKeywords);
}

export function buildStage3PhasePuzzle(
  lines: Stage3CaseLine[],
  maxKeywords = 3
): Stage3PhasePuzzle {
  const rawKeywords = pickStage3KeywordsFromLines(lines, maxKeywords);
  const fullText = lines.map((line) => line.text).join(" ");

  const keywords = [...rawKeywords].sort((a, b) => {
    const indexA = fullText.indexOf(a);
    const indexB = fullText.indexOf(b);

    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });

  const maskedLines = lines.map((line) => {
    let maskedText = line.text;

    keywords.forEach((keyword) => {
      if (maskedText.includes(keyword)) {
        maskedText = maskedText.replace(keyword, "____");
      }
    });

    return maskedText;
  });

  return {
    lines: lines.map((line) => line.text),
    keywords,
    maskedLines,
  };
}

export const stage3Cases: Stage3Case[] = [
  {
    id: "case_001",
    title: "ควันออกจากตู้ Control Pump",
    subtitle: "พบควันออกจากตู้ควบคุมระบบ Pump ระหว่างเดินเครื่อง",
    securityLevel: 3,

    unlockSteps: [
      { type: "swipe_card", title: "SCAN ACCESS CARD" },
      {
        type: "redacted_word",
        title: "PASSWORD RECOVERY",
        question: "ตู้ Control มี ███████ ออกมาระหว่างเดินเครื่อง",
        revealedText: "ตู้ Control มีควันออกมาระหว่างเดินเครื่อง",
        answer: "ควัน",
        choices: ["ควัน", "น้ำมัน", "สนิม", "PPE"],
      },
      {
        type: "evidence_snap",
        title: "RECOVER EVIDENCE",
        instruction: "แตะหลักฐานที่เกี่ยวข้องกับคดีนี้",
        correctEvidenceIds: ["smoke", "control"],
        evidences: [
          { id: "smoke", label: "ควัน / กลิ่นไหม้", icon: "💨" },
          { id: "control", label: "ตู้ Control", icon: "⚡" },
          { id: "box", label: "กล่องข้างทาง", icon: "📦" },
          { id: "helmet", label: "หมวกนิรภัย", icon: "⛑️" },
        ],
      },
      { type: "security_verify", title: "SECURITY VERIFICATION" },
    ],

    incidentReport: [
      {
        text: "พบควันออกจากตู้ควบคุมระบบ Pump ระหว่างเดินเครื่อง",
        keywords: ["พบควัน", "ตู้ควบคุมระบบ Pump", "ระหว่างเดินเครื่อง"],
      },
      {
        text: "พนักงานพบความผิดปกติขณะระบบ Pump ยังทำงานอยู่",
        keywords: ["ความผิดปกติ", "ระบบ Pump", "ทำงานอยู่"],
      },
    ],

    evidence: [
      {
        text: "พบควัน / กลิ่นไหม้บริเวณตู้ Control",
        keywords: ["พบควัน", "กลิ่นไหม้", "ตู้ Control"],
      },
      {
        text: "จุดเสี่ยงเกี่ยวข้องกับระบบไฟฟ้าและอุปกรณ์ควบคุม",
        keywords: ["ระบบไฟฟ้า", "อุปกรณ์ควบคุม"],
      },
    ],

    rootCause: [
      {
        text: "อาจเกิดจากความร้อนสะสมหรือจุดต่อไฟฟ้าผิดปกติ",
        keywords: ["ความร้อนสะสม", "จุดต่อไฟฟ้า", "ผิดปกติ"],
      },
    ],

    prevention: [
      {
        text: "หยุดใช้งานทันที",
        keywords: ["ทันที"],
      },
      {
        text: "กั้นพื้นที่ไม่ให้เข้าใกล้ตู้ควบคุม",
        keywords: ["กั้นพื้นที่"],
      },
      {
        text: "แจ้งผู้เกี่ยวข้องให้เข้าตรวจสอบก่อนใช้งานต่อ",
        keywords: ["แจ้งผู้เกี่ยวข้อง"],
      },
    ],

    lesson: {
      text: "พบควันหรือกลิ่นไหม้จากตู้ไฟฟ้า ต้องหยุดใช้งาน กั้นพื้นที่ และแจ้งผู้เกี่ยวข้องทันที",
      keywords: [
        "พบควัน",
        "กลิ่นไหม้",
        "ตู้ไฟฟ้า",
        "หยุดใช้งาน",
        "กั้นพื้นที่",
        "แจ้งผู้เกี่ยวข้อง",
      ],
    },
  },
];