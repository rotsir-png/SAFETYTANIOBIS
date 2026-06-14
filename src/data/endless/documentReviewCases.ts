export type DocumentReviewAction = "approve" | "reject";

export type DocumentReviewCase = {
  id: string;
  title: string;
  type: "HOT_WORK" | "COLD_WORK" | "CONFINED_SPACE";
  location: string;
  contractor: string;
  time: string;
  lines: string[];
  correctAction: DocumentReviewAction;
  reason: string;
};

const contractors = [
  "ABC Engineering",
  "MTP Maintenance",
  "Thai Service Team",
  "K2 Contractor",
  "Plant Support",
];

const times = ["08:30", "09:15", "10:00", "13:30", "14:45", "16:00"];

const hotWorkLocations = [
  "MIBK Tank Area",
  "Boiler 1 Area",
  "Operation Zone",
  "Control Zone Workshop",
  "Chemical Plant",
];

const coldWorkLocations = [
  "Utility Area",
  "Raw Material Area",
  "Workshop",
  "Operation Zone",
  "Substation Area",
];

const confinedLocations = [
  "Tank Cleaning Area",
  "Silo Area",
  "Underground Pit",
  "Process Vessel",
  "Pipe Chamber",
];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 99999)}`;

function makeHotWorkCase(): DocumentReviewCase {
  const defect = pick([
    "NONE",
    "NO_FIRE_WATCH",
    "BAD_LEL",
    "NO_GAS_CHECK",
    "NO_PPE",
    "NO_EXTINGUISHER",
    "NO_JSA",
  ]);

  const lines = [
    defect === "NO_PPE" ? "PPE ยังไม่ครบ" : "PPE ครบ",
    defect === "NO_GAS_CHECK"
      ? "ยังไม่ได้ตรวจแก๊ส"
      : defect === "BAD_LEL"
        ? "LEL = 8%"
        : "LEL = 0%",
    defect === "NO_FIRE_WATCH" ? "ไม่ระบุ Fire Watch" : "Fire Watch ระบุแล้ว",
    defect === "NO_EXTINGUISHER" ? "ไม่มีถังดับเพลิง" : "ถังดับเพลิงพร้อม",
    defect === "NO_JSA" ? "ยังไม่แนบ JSA" : "JSA แนบแล้ว",
  ];

  const reasons: Record<string, string> = {
    NONE: "Hot Work เตรียมมาตรการครบ อนุมัติได้",
    NO_FIRE_WATCH: "Hot Work ต้องมี Fire Watch",
    BAD_LEL: "งาน Hot Work ต้องตรวจสารไวไฟและ LEL ต้องเป็น 0%",
    NO_GAS_CHECK: "Hot Work ต้องมีการตรวจแก๊สก่อนเริ่มงาน",
    NO_PPE: "ต้องระบุ PPE ให้ครบก่อนอนุมัติ",
    NO_EXTINGUISHER: "ต้องมีถังดับเพลิง/อุปกรณ์ดับเพลิงพร้อม",
    NO_JSA: "งานเสี่ยงสูง/งานไม่ประจำต้องมี JSA",
  };

  return {
    id: makeId("hw"),
    title: "Hot Work Permit",
    type: "HOT_WORK",
    location: pick(hotWorkLocations),
    contractor: pick(contractors),
    time: pick(times),
    lines,
    correctAction: defect === "NONE" ? "approve" : "reject",
    reason: reasons[defect],
  };
}

function makeColdWorkCase(): DocumentReviewCase {
  const defect = pick([
    "NONE",
    "NO_ISOLATION",
    "NO_JSA",
    "NO_PPE",
    "AREA_NOT_READY",
    "NO_HSE_ACK",
  ]);

  const lines = [
    defect === "NO_PPE" ? "PPE ไม่ครบ" : "PPE ครบ",
    defect === "NO_ISOLATION" ? "ยังไม่ Isolation" : "Isolation แล้ว",
    defect === "NO_JSA" ? "ยังไม่แนบ JSA" : "JSA แนบแล้ว",
    defect === "AREA_NOT_READY" ? "พื้นที่ยังไม่พร้อม" : "พื้นที่พร้อม",
    defect === "NO_HSE_ACK" ? "HSE ยังไม่รับทราบ" : "HSE รับทราบแล้ว",
  ];

  const reasons: Record<string, string> = {
    NONE: "Cold Work เตรียมเอกสารและพื้นที่ครบ",
    NO_ISOLATION: "ต้องตัดแยก/ปิดกั้นอุปกรณ์ที่เกี่ยวข้องก่อนเริ่มงาน",
    NO_JSA: "งานไม่ประจำควรมี JSA ตามลักษณะความเสี่ยง",
    NO_PPE: "ต้องตรวจ PPE ก่อนอนุมัติ",
    AREA_NOT_READY: "เจ้าของพื้นที่ต้องเตรียมพื้นที่ให้ปลอดภัยก่อนอนุญาต",
    NO_HSE_ACK: "HSE ต้องตรวจสอบและรับทราบก่อนส่งต่อผู้อนุญาต",
  };

  return {
    id: makeId("cw"),
    title: "Cold Work Permit",
    type: "COLD_WORK",
    location: pick(coldWorkLocations),
    contractor: pick(contractors),
    time: pick(times),
    lines,
    correctAction: defect === "NONE" ? "approve" : "reject",
    reason: reasons[defect],
  };
}

function makeConfinedSpaceCase(): DocumentReviewCase {
  const defect = pick([
    "NONE",
    "NO_O2_CHECK",
    "BAD_O2",
    "NO_ATTENDANT",
    "NO_HSE_APPROVAL",
    "NO_PPE",
    "NO_MEDICAL",
  ]);

  const lines = [
    defect === "NO_O2_CHECK"
      ? "ยังไม่มีผลตรวจ O₂"
      : defect === "BAD_O2"
        ? "O₂ ไม่ผ่าน"
        : "O₂ ผ่าน",
    defect === "NO_ATTENDANT" ? "ไม่ระบุผู้ช่วยเหลือ" : "ผู้ช่วยเหลือพร้อม",
    defect === "NO_HSE_APPROVAL" ? "HSE ยังไม่อนุมัติ" : "HSE อนุมัติแล้ว",
    defect === "NO_PPE" ? "PPE ไม่ครบ" : "PPE ครบ",
    defect === "NO_MEDICAL" ? "ไม่มีใบรับรองแพทย์" : "ใบรับรองแพทย์พร้อม",
  ];

  const reasons: Record<string, string> = {
    NONE: "Confined Space เตรียมครบ อนุมัติได้",
    NO_O2_CHECK: "งานอับอากาศต้องตรวจบรรยากาศ/O₂ ก่อนเริ่มงาน",
    BAD_O2: "O₂ ไม่ผ่าน ห้ามอนุมัติ",
    NO_ATTENDANT: "งานอับอากาศต้องมีผู้ช่วยเหลือ/ผู้เฝ้าระวัง",
    NO_HSE_APPROVAL: "งานอับอากาศต้องได้รับอนุมัติจาก HSE",
    NO_PPE: "ต้องตรวจ PPE ให้ครบ",
    NO_MEDICAL: "ผู้ปฏิบัติงานอับอากาศต้องมีความพร้อมตามข้อกำหนด",
  };

  return {
    id: makeId("cs"),
    title: "Confined Space Permit",
    type: "CONFINED_SPACE",
    location: pick(confinedLocations),
    contractor: pick(contractors),
    time: pick(times),
    lines,
    correctAction: defect === "NONE" ? "approve" : "reject",
    reason: reasons[defect],
  };
}

export function generateDocumentReviewCase(): DocumentReviewCase {
  const type = pick(["HOT_WORK", "COLD_WORK", "CONFINED_SPACE"] as const);

  if (type === "HOT_WORK") return makeHotWorkCase();
  if (type === "COLD_WORK") return makeColdWorkCase();
  return makeConfinedSpaceCase();
}

export function generateDocumentReviewCases(count = 70): DocumentReviewCase[] {
  return Array.from({ length: count }, () => generateDocumentReviewCase());
}