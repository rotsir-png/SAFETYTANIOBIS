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
  unlockSteps?: Stage3UnlockStep[];
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

  const sortedKeywords = [...rawKeywords].sort((a, b) => {
    const indexA = fullText.indexOf(a);
    const indexB = fullText.indexOf(b);

    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });

  const usedKeywords: string[] = [];

  const maskedLines = lines.map((line) => {
    let maskedText = line.text;

    sortedKeywords.forEach((keyword) => {
      if (usedKeywords.includes(keyword)) return;
      if (!maskedText.includes(keyword)) return;

      maskedText = maskedText.replace(keyword, "____");
      usedKeywords.push(keyword);
    });

    return maskedText;
  });

  return {
    lines: lines.map((line) => line.text),
    keywords: usedKeywords,
    maskedLines,
  };
}

export const stage3Cases: Stage3Case[] = [
  {
    id: "case_001",
    title: "ควันออกจากตู้ Control Pump",
    subtitle: "พบควันออกจากตู้ควบคุมระบบ Pump ระหว่างเดินเครื่อง",
    securityLevel: 3,

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
        text: "พบควันและกลิ่นไหม้บริเวณตู้ Control",
        keywords: ["พบควัน", "กลิ่นไหม้", "ตู้ Control"],
      },
      {
        text: "พบ Breaker Trip และมีรอย Melt ของอุปกรณ์ภายในตู้",
        keywords: ["Breaker Trip", "รอย Melt", "อุปกรณ์ภายในตู้"],
      },
      {
        text: "พบ Motor ของ Pump ร้อนทั้งสองตัว",
        keywords: ["Motor", "Pump", "ร้อน"],
      },
    ],

    rootCause: [
      {
        text: "การสั่นสะเทือนทำให้ตู้ Control สั่นและขั้วสายไฟหลวม",
        keywords: ["การสั่นสะเทือน", "ขั้วสายไฟหลวม"],
      },
      {
        text: "เกิดความร้อนสะสมและการขยายตัวของโลหะทองแดง",
        keywords: ["ความร้อนสะสม", "โลหะทองแดง"],
      },
      {
        text: "ชุดอุปกรณ์ภายในตู้เสื่อมสภาพจากการใช้งานเป็นเวลานาน",
        keywords: ["อุปกรณ์เสื่อมสภาพ", "ใช้งานนาน"],
      },
    ],

    prevention: [
      {
        text: "ตรวจสอบผลกระทบจากการสั่นสะเทือนต่อขั้วสายไฟในตู้ Control",
        keywords: ["ตรวจสอบ", "สั่นสะเทือน", "ขั้วสายไฟ"],
      },
      {
        text: "จัดทำแผน PM สำหรับตรวจสอบตู้ Control และเพิ่มความถี่การตรวจสอบ",
        keywords: ["แผน PM", "ตู้ Control", "เพิ่มความถี่"],
      },
      {
        text: "ย้ายตู้ Control ไปอยู่ในห้องควบคุมไฟฟ้า",
        keywords: ["ย้ายตู้ Control", "ห้องควบคุมไฟฟ้า"],
      },
    ],

    lesson: {
      text: "พบควันหรือกลิ่นไหม้จากตู้ไฟฟ้าต้องหยุดใช้งาน กั้นพื้นที่ และแจ้งผู้เกี่ยวข้องทันที",
      keywords: ["พบควัน", "ตู้ไฟฟ้า", "หยุดใช้งาน"],
    },
  },

  {
    id: "case_002",
    title: "สะเก็ด NaK กระเด็นเข้ารองเท้านิรภัย",
    subtitle: "พนักงานบาดเจ็บหลังเท้าระหว่างสกัดเกลือ NaK",
    securityLevel: 3,

    incidentReport: [
      {
        text: "พนักงานกำลังสกัดเกลือ NaK ด้วย Jack hammer ในห้อง Jaw crusher",
        keywords: ["สกัดเกลือ NaK", "Jack hammer", "Jaw crusher"],
      },
      {
        text: "สะเก็ดเกลือ NaK กระเด็นเข้าไปในรองเท้านิรภัย",
        keywords: ["สะเก็ดเกลือ NaK", "รองเท้านิรภัย"],
      },
    ],

    evidence: [
      {
        text: "พบช่องว่างบริเวณหลังเท้าเนื่องจากผูกเชือกรองเท้าหลวม",
        keywords: ["ช่องว่าง", "หลังเท้า", "เชือกรองเท้าหลวม"],
      },
      {
        text: "พบรอยไหม้และแผลพุพองบริเวณหลังเท้า",
        keywords: ["รอยไหม้", "แผลพุพอง", "หลังเท้า"],
      },
    ],

    rootCause: [
      {
        text: "รองเท้านิรภัยไม่สามารถปิดคลุมช่องว่างบริเวณหลังเท้าได้เพียงพอ",
        keywords: ["รองเท้านิรภัย", "ช่องว่าง", "หลังเท้า"],
      },
      {
        text: "การสวมใส่ PPE ไม่เหมาะสมกับงานที่มีสะเก็ดสารเคมีกระเด็น",
        keywords: ["PPE", "สะเก็ดสารเคมี"],
      },
    ],

    prevention: [
      {
        text: "จัดหาและใช้ถุงคลุมรองเท้าหรือรองเท้าบูทที่ปิดคลุมได้มิดชิด",
        keywords: ["ถุงคลุมรองเท้า", "รองเท้าบูท"],
      },
      {
        text: "ห้ามใช้รองเท้านิรภัยทั่วไปปฏิบัติงานในพื้นที่เสี่ยงดังกล่าว",
        keywords: ["รองเท้านิรภัย", "พื้นที่เสี่ยง"],
      },
      {
        text: "ทบทวนขั้นตอนการสกัดและการสวมใส่ PPE ที่ถูกต้อง",
        keywords: ["ขั้นตอนการสกัด", "PPE"],
      },
    ],

    lesson: {
      text: "งานที่มีสะเก็ดสารเคมีกระเด็นต้องใช้อุปกรณ์ป้องกันที่ปิดคลุมร่างกายได้เหมาะสม",
      keywords: ["สะเก็ดสารเคมี", "อุปกรณ์ป้องกัน"],
    },
  },

  {
    id: "case_003",
    title: "เครื่องดูดฝุ่นระเบิดขณะดูดผง Mg",
    subtitle: "เกิดการระเบิดขณะใช้เครื่องดูดฝุ่นกับผงแมกนีเซียม",
    securityLevel: 5,

    incidentReport: [
      {
        text: "พนักงานต่อสาย Flex ของเครื่องดูดฝุ่นเพื่อทำความสะอาด Motor",
        keywords: ["สาย Flex", "เครื่องดูดฝุ่น", "Motor"],
      },
      {
        text: "หลังเปิด Valve ลมประมาณ 10 วินาที เกิดการระเบิดจากเครื่องดูดฝุ่น",
        keywords: ["Valve ลม", "10 วินาที", "ระเบิด"],
      },
    ],

    evidence: [
      {
        text: "ท่อที่ใช้เป็นท่อสำหรับดูด Ta แต่นำมาใช้กับงานดูดฝุ่น Mg",
        keywords: ["ท่อดูด Ta", "ฝุ่น Mg"],
      },
      {
        text: "พบผง Ta สะสมอยู่ภายในท่อพลาสติก PVDF",
        keywords: ["ผง Ta", "สะสม", "PVDF"],
      },
      {
        text: "จุดคีบสายกราวน์พบว่ากระแสไฟฟ้าไม่ลงกราวน์",
        keywords: ["สายกราวน์", "ไม่ลงกราวน์"],
      },
    ],

    rootCause: [
      {
        text: "ใช้ท่อดูดฝุ่นผิดประเภทกับงานแมกนีเซียม",
        keywords: ["ท่อดูดฝุ่น", "ผิดประเภท", "แมกนีเซียม"],
      },
      {
        text: "มีผง Ta สะสมในท่อและเกิด Electrostatic จากท่อ PVDF",
        keywords: ["ผง Ta", "Electrostatic", "PVDF"],
      },
      {
        text: "ระบบ Ground ไม่สมบูรณ์ทำให้เกิดความเสี่ยงการจุดติดไฟ",
        keywords: ["Ground", "ไม่สมบูรณ์", "จุดติดไฟ"],
      },
    ],

    prevention: [
      {
        text: "จัดหาเครื่องดูดฝุ่นเฉพาะสำหรับดูดแมกนีเซียมเท่านั้น",
        keywords: ["เครื่องดูดฝุ่นเฉพาะ", "แมกนีเซียม"],
      },
      {
        text: "ห้ามนำชิ้นส่วนจากเครื่องอื่นมาใช้งานร่วมกัน",
        keywords: ["ห้ามนำชิ้นส่วน", "ใช้งานร่วมกัน"],
      },
      {
        text: "ติดตั้ง Ground bar เฉพาะและตรวจสอบให้อยู่ในสภาพพร้อมใช้งาน",
        keywords: ["Ground bar", "พร้อมใช้งาน"],
      },
    ],

    lesson: {
      text: "งานที่เกี่ยวข้องกับฝุ่นโลหะต้องควบคุมชนิดอุปกรณ์ การสะสมของฝุ่น และระบบ Ground อย่างเข้มงวด",
      keywords: ["ฝุ่นโลหะ", "ระบบ Ground"],
    },
  },

  {
    id: "case_004",
    title: "Cake F4 รั่วไหลที่ Screw Feed N410",
    subtitle: "ระบบ Screw Feed ทำงานผิดพลาดหลังการตัดแยกระบบ",
    securityLevel: 4,

    incidentReport: [
      {
        text: "พนักงาน WT แจ้งช่างไฟฟ้าให้ใส่ฟิวส์ปั๊ม N410 และถอดฟิวส์ปั๊ม N411",
        keywords: ["ใส่ฟิวส์", "N410", "N411"],
      },
      {
        text: "ต่อมาพนักงานกด Run screw feed และพบ Cake F4 รั่วไหล",
        keywords: ["Run screw feed", "Cake F4", "รั่วไหล"],
      },
    ],

    evidence: [
      {
        text: "การแจ้งงานไม่ได้ระบุเลขรหัสข้างหน้า ทำให้ช่างไฟฟ้าเข้าใจผิด",
        keywords: ["เลขรหัส", "เข้าใจผิด"],
      },
      {
        text: "ระบบรุ่นเก่ายังสามารถกดปุ่ม Panel ได้แม้ถอด Fuse ที่ปลายทาง",
        keywords: ["ระบบรุ่นเก่า", "Panel", "Fuse"],
      },
    ],

    rootCause: [
      {
        text: "สื่อสารรหัสอุปกรณ์ไม่ครบถ้วนก่อนตัดแยกระบบ",
        keywords: ["รหัสอุปกรณ์", "ไม่ครบถ้วน"],
      },
      {
        text: "ตัดแยกระบบไฟฟ้าผิดตำแหน่ง",
        keywords: ["ตัดแยกระบบไฟฟ้า", "ผิดตำแหน่ง"],
      },
      {
        text: "ระบบ Control รุ่นเก่ายังสามารถสั่งงานได้หลังถอด Fuse",
        keywords: ["Control", "รุ่นเก่า", "Fuse"],
      },
    ],

    prevention: [
      {
        text: "อบรมทบทวนขั้นตอน LOTO และการอ่านรหัส AKZ",
        keywords: ["LOTO", "AKZ"],
      },
      {
        text: "ติดสติ๊กเกอร์แสดง Code แบบเต็มที่ตู้ Control",
        keywords: ["Code", "ตู้ Control"],
      },
      {
        text: "ทวนสอบรหัสกับห้อง Control ก่อนตัดแยกระบบไฟฟ้า",
        keywords: ["ทวนสอบรหัส", "ห้อง Control"],
      },
      {
        text: "จัดประชุมส่งต่องานช่วงเปลี่ยนกะ",
        keywords: ["ส่งต่องาน", "เปลี่ยนกะ"],
      },
    ],

    lesson: {
      text: "งานตัดแยกระบบต้องสื่อสารรหัสอุปกรณ์ให้ครบและทวนสอบก่อนเริ่มงานทุกครั้ง",
      keywords: ["ตัดแยกระบบ", "ทวนสอบ"],
    },
  },

  {
    id: "case_005",
    title: "Cooling / Heating Finger แตกในถัง Digester",
    subtitle: "อุปกรณ์แตกเสียหายระหว่าง Test Leak",
    securityLevel: 4,

    incidentReport: [
      {
        text: "หลังซ่อมหน้าแปลนวาล์ว LS01-H411 ได้แจ้งให้ Production ทำ Test Leak",
        keywords: ["LS01-H411", "Production", "Test Leak"],
      },
      {
        text: "Cooling / Heating finger จำนวน 4 เสา แตกเสียหายจากแรงดันสูง",
        keywords: ["Cooling / Heating finger", "4 เสา", "แรงดันสูง"],
      },
    ],

    evidence: [
      {
        text: "พนักงานปิด Manual valve หลัง Steam trap และปิดวาล์ว By Pass steam trap",
        keywords: ["Manual valve", "Steam trap", "By Pass"],
      },
      {
        text: "Pressure สูงขึ้นเป็น 7 Bar ขณะที่ Steam out รับได้เพียง 4.5 Bar",
        keywords: ["7 Bar", "4.5 Bar", "Steam out"],
      },
    ],

    rootCause: [
      {
        text: "ไม่ปฏิบัติตามขั้นตอน Test Leak ที่ถูกต้อง",
        keywords: ["Test Leak", "ไม่ถูกต้อง"],
      },
      {
        text: "ปิดวาล์วผิดลำดับทำให้แรงดันสะสมในระบบ",
        keywords: ["ปิดวาล์ว", "แรงดันสะสม"],
      },
      {
        text: "แรงดันเกินกว่าที่อุปกรณ์ Steam out รองรับได้",
        keywords: ["แรงดันเกิน", "Steam out"],
      },
    ],

    prevention: [
      {
        text: "อบรมทบทวนขั้นตอน Test Leak ให้พนักงานที่เกี่ยวข้อง",
        keywords: ["อบรม", "Test Leak"],
      },
      {
        text: "ตรวจสอบความพร้อมของ Control valve และ Pressure relief valve",
        keywords: ["Control valve", "Pressure relief valve"],
      },
      {
        text: "ติดตั้ง 2nd safety interlock ด้วย Pressure switch",
        keywords: ["Safety interlock", "Pressure switch"],
      },
    ],

    lesson: {
      text: "การ Test Leak ต้องทำตามขั้นตอนและควบคุมแรงดันไม่ให้เกินขีดจำกัดของอุปกรณ์",
      keywords: ["Test Leak", "แรงดัน"],
    },
  },

  {
    id: "case_006",
    title: "พบประกายไฟที่ Flexible ท่อ Waste Gas",
    subtitle: "พบ Spark บริเวณท่อ Waste Gas ขาออกจาก Blower",
    securityLevel: 4,

    incidentReport: [
      {
        text: "พนักงานพบประกายไฟที่ Flexible ของท่อ Waste Gas ขาออกจาก Blower",
        keywords: ["ประกายไฟ", "Flexible", "Waste Gas"],
      },
      {
        text: "จึงแจ้งหัวหน้างานและหยุดระบบ Blower ทั้งหมด",
        keywords: ["หัวหน้างาน", "หยุดระบบ Blower"],
      },
    ],

    evidence: [
      {
        text: "พบสายไฟตรงฉนวนชำรุดและสายดิน Safety ground ไม่ลงกราวน์",
        keywords: ["ฉนวนชำรุด", "Safety ground", "ไม่ลงกราวน์"],
      },
      {
        text: "ช่วงถอดติดตั้งหลัง PM ไม่ได้ตรวจสอบสายกราวน์ให้พร้อมใช้งาน",
        keywords: ["PM", "สายกราวน์", "พร้อมใช้งาน"],
      },
      {
        text: "แท่น Blower มีลูกยางทำให้ตัวโครงสร้างไม่ลงกราวน์",
        keywords: ["แท่น Blower", "ลูกยาง", "ไม่ลงกราวน์"],
      },
    ],

    rootCause: [
      {
        text: "สายไฟฉนวนชำรุดและระบบ Ground ไม่สมบูรณ์ทำให้เกิด Spark",
        keywords: ["ฉนวนชำรุด", "Ground", "Spark"],
      },
      {
        text: "ไม่ได้ตรวจสอบสายกราวน์หลังการถอดติดตั้งอุปกรณ์",
        keywords: ["ตรวจสอบสายกราวน์", "ถอดติดตั้ง"],
      },
      {
        text: "โครงสร้าง Blower ไม่ลงกราวน์จากการมีลูกยางรองรับ",
        keywords: ["Blower", "ลูกยาง", "ไม่ลงกราวน์"],
      },
    ],

    prevention: [
      {
        text: "ตรวจสอบ Ground bar ให้อยู่ในสภาพพร้อมใช้งาน",
        keywords: ["Ground bar", "พร้อมใช้งาน"],
      },
      {
        text: "ติดตั้งสายดินเพิ่มเติมที่ Support ของ Blower และท่อ Stainless",
        keywords: ["สายดิน", "Support", "ท่อ Stainless"],
      },
      {
        text: "ตรวจสอบสายกราวน์ทุกครั้งเมื่อมีการถอด ยก เปลี่ยน หรือซ่อมอุปกรณ์",
        keywords: ["สายกราวน์", "ซ่อมอุปกรณ์"],
      },
    ],

    lesson: {
      text: "อุปกรณ์ที่มีการถอดติดตั้งต้องตรวจสอบ Ground ทุกครั้งก่อนกลับมาใช้งาน",
      keywords: ["ถอดติดตั้ง", "Ground"],
    },
  },

  {
    id: "case_007",
    title: "ท่อ HCl 35% แตกขณะรื้อ Hand Rail",
    subtitle: "ผู้รับเหมาทำ Hand Rail กระแทกท่อสารเคมี",
    securityLevel: 4,

    incidentReport: [
      {
        text: "ผู้รับเหมาเข้ารื้อ Hand Rail โดยใช้เลื่อยมือตัดขา Hand Rail",
        keywords: ["ผู้รับเหมา", "Hand Rail", "เลื่อยมือ"],
      },
      {
        text: "ชิ้นส่วน Hand Rail กระแทกท่อ HCl 35% ทำให้สารเคมีรั่วไหล",
        keywords: ["Hand Rail", "HCl 35%", "รั่วไหล"],
      },
    ],

    evidence: [
      {
        text: "พื้นที่ทำงานค่อนข้างจำกัดขณะยกชิ้นส่วนออกจากพื้นที่",
        keywords: ["พื้นที่จำกัด", "ยกชิ้นส่วน"],
      },
      {
        text: "มีท่อสารเคมีอยู่ใกล้บริเวณที่ทำการรื้อถอน",
        keywords: ["ท่อสารเคมี", "รื้อถอน"],
      },
    ],

    rootCause: [
      {
        text: "ประเมินพื้นที่ทำงานและสิ่งกีดขวางใกล้เคียงไม่เพียงพอ",
        keywords: ["ประเมินพื้นที่", "ไม่เพียงพอ"],
      },
      {
        text: "ไม่มีการป้องกันท่อสารเคมีก่อนเริ่มรื้อ Hand Rail",
        keywords: ["ป้องกันท่อสารเคมี", "Hand Rail"],
      },
      {
        text: "พื้นที่จำกัดทำให้ชิ้นงานกระแทกท่อ HCl ระหว่างเคลื่อนย้าย",
        keywords: ["พื้นที่จำกัด", "ท่อ HCl"],
      },
    ],

    prevention: [
      {
        text: "ติดตั้ง Support สำหรับยึด Line ท่อในบริเวณที่ต้องตัด Hand Rail",
        keywords: ["Support", "Line ท่อ"],
      },
      {
        text: "เจ้าของงานต้องประเมินสารเคมีอันตรายในพื้นที่ก่อนเริ่มงาน",
        keywords: ["สารเคมีอันตราย", "ก่อนเริ่มงาน"],
      },
      {
        text: "จัดทำ JSA สำหรับงานในพื้นที่เสี่ยงสูง",
        keywords: ["JSA", "พื้นที่เสี่ยงสูง"],
      },
    ],

    lesson: {
      text: "งานรื้อถอนใกล้ท่อสารเคมีต้องประเมินพื้นที่และป้องกันท่อก่อนเริ่มงาน",
      keywords: ["รื้อถอน", "ท่อสารเคมี"],
    },
  },

  {
    id: "case_008",
    title: "หกล้มบริเวณ Nitrogen Generator Station",
    subtitle: "พนักงานสะดุดท่อในเวลากลางคืน",
    securityLevel: 2,

    incidentReport: [
      {
        text: "พนักงาน Laboratory เดินออกไปปิด Gas Nitrogen ในเวลากลางคืน",
        keywords: ["Laboratory", "Gas Nitrogen", "กลางคืน"],
      },
      {
        text: "พนักงานมองไม่เห็นท่อบริเวณทางเดินจึงสะดุดล้ม",
        keywords: ["มองไม่เห็นท่อ", "ทางเดิน", "สะดุดล้ม"],
      },
    ],

    evidence: [
      {
        text: "บริเวณทางเดินไป Nitrogen generator station มีแนวท่อกีดขวาง",
        keywords: ["Nitrogen generator", "แนวท่อ", "กีดขวาง"],
      },
      {
        text: "เหตุเกิดเวลากลางคืนทำให้ทัศนวิสัยไม่เพียงพอ",
        keywords: ["กลางคืน", "ทัศนวิสัย"],
      },
    ],

    rootCause: [
      {
        text: "แสงสว่างบริเวณทางเดินไม่เพียงพอ",
        keywords: ["แสงสว่าง", "ไม่เพียงพอ"],
      },
      {
        text: "มีแนวท่อกีดขวางบนเส้นทางเดินไปจุดปฏิบัติงาน",
        keywords: ["แนวท่อ", "กีดขวาง"],
      },
      {
        text: "ไม่มีการทำเครื่องหมายให้เห็นแนวท่อชัดเจนในเวลากลางคืน",
        keywords: ["เครื่องหมาย", "แนวท่อ"],
      },
    ],

    prevention: [
      {
        text: "ติดตั้งไฟส่องสว่างบริเวณทางเดิน",
        keywords: ["ไฟส่องสว่าง", "ทางเดิน"],
      },
      {
        text: "ปรับเส้นทางเข้าให้สะดวกและไม่ต้องผ่านแนวท่อกีดขวาง",
        keywords: ["เส้นทางเข้า", "แนวท่อ"],
      },
      {
        text: "ติดเทปสะท้อนแสงหรือเทปดำเหลืองให้เห็นแนวท่อชัดเจน",
        keywords: ["เทปสะท้อนแสง", "เทปดำเหลือง"],
      },
    ],

    lesson: {
      text: "พื้นที่เดินปฏิบัติงานต้องมีแสงสว่างเพียงพอและไม่มีสิ่งกีดขวางที่มองเห็นยาก",
      keywords: ["แสงสว่าง", "สิ่งกีดขวาง"],
    },
  },

  {
    id: "case_009",
    title: "ประแจตัว F กระแทกหางคิ้ว",
    subtitle: "พนักงานได้รับบาดเจ็บขณะหมุน Valve ที่ฝืด",
    securityLevel: 2,

    incidentReport: [
      {
        text: "พนักงานใช้ประแจตัว F หมุน Valve Drain สารเคมี",
        keywords: ["ประแจตัว F", "Valve Drain", "สารเคมี"],
      },
      {
        text: "ปลายด้ามจับประแจกระแทกบริเวณหางคิ้วข้างขวา",
        keywords: ["ปลายด้ามจับ", "หางคิ้ว"],
      },
    ],

    evidence: [
      {
        text: "Valve มีลักษณะฝืดทำให้ต้องออกแรงหมุนมาก",
        keywords: ["Valve", "ฝืด", "ออกแรง"],
      },
      {
        text: "ขณะก้มลงหมุนประแจ ปลายด้ามจับอยู่ใกล้ใบหน้า",
        keywords: ["ก้มลง", "ประแจ", "ใบหน้า"],
      },
    ],

    rootCause: [
      {
        text: "Valve ฝืดและเปิดปิดไม่สะดวก",
        keywords: ["Valve ฝืด", "เปิดปิดไม่สะดวก"],
      },
      {
        text: "ใช้ประแจตัว F ในท่าทางที่มีโอกาสกระแทกใบหน้า",
        keywords: ["ประแจตัว F", "กระแทกใบหน้า"],
      },
      {
        text: "การบำรุงรักษา Valve ไม่เพียงพอทำให้ต้องใช้แรงมาก",
        keywords: ["บำรุงรักษา", "ใช้แรงมาก"],
      },
    ],

    prevention: [
      {
        text: "ตรวจสอบ Valve ที่ต้องใช้ประแจตัว F ว่ามีจุดใดฝืดหรือเปิดปิดยาก",
        keywords: ["ตรวจสอบ Valve", "ประแจตัว F"],
      },
      {
        text: "บำรุงรักษา Valve ด้วยการหยอดน้ำมันหรืออัดจารบี",
        keywords: ["หยอดน้ำมัน", "อัดจารบี"],
      },
      {
        text: "จัดหาอุปกรณ์ทดแทนประแจตัว F ที่ปลอดภัยกว่า",
        keywords: ["อุปกรณ์ทดแทน", "ปลอดภัยกว่า"],
      },
    ],

    lesson: {
      text: "อุปกรณ์ที่ฝืดหรือเปิดปิดยากต้องแก้ไขก่อนใช้งานเพื่อลดความเสี่ยงจากแรงสะบัดหรือการกระแทก",
      keywords: ["อุปกรณ์ฝืด", "การกระแทก"],
    },
  },
];