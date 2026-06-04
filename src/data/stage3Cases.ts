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

export type Stage3Case = {
  id: string;
  title: string;
  subtitle: string;
  securityLevel: number;
  unlockSteps: Stage3UnlockStep[];
  incidentReport: string[];
  evidence: string[];
  rootCause: string[];
  prevention: string[];
  lesson: string;
};

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
      "พบควันออกจากตู้ควบคุมระบบ Pump ระหว่างเดินเครื่อง",
      "มีการหยุดใช้งานเพื่อตรวจสอบความปลอดภัย",
    ],
    evidence: ["พบควัน / กลิ่นไหม้บริเวณตู้ Control", "จุดเสี่ยงเกี่ยวข้องกับระบบไฟฟ้า"],
    rootCause: ["อาจมีความร้อนสะสมหรือจุดต่อไฟฟ้าผิดปกติ"],
    prevention: ["หยุดใช้งานทันที", "กั้นพื้นที่", "แจ้งผู้เกี่ยวข้องเพื่อตรวจสอบ"],
    lesson:
      "พบควันหรือกลิ่นไหม้จากตู้ไฟฟ้า ต้องหยุดใช้งาน กั้นพื้นที่ และแจ้งผู้เกี่ยวข้องทันที",
  },
];