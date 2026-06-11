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
  keywords: string[];
};

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
        keywords: ["จุดเสี่ยง", "ระบบไฟฟ้า", "อุปกรณ์ควบคุม"],
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
        keywords: ["หยุดใช้งานทันที"],
      },
      {
        text: "กั้นพื้นที่ไม่ให้เข้าใกล้ตู้ควบคุม",
        keywords: ["กั้นพื้นที่", "ตู้ควบคุม"],
      },
      {
        text: "แจ้งผู้เกี่ยวข้องให้เข้าตรวจสอบก่อนใช้งานต่อ",
        keywords: ["แจ้งผู้เกี่ยวข้อง", "ตรวจสอบ", "ใช้งานต่อ"],
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