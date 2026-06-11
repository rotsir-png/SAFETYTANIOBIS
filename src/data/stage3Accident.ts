export type Stage3AccidentCase = {
  id: number;
  tag: "INCIDENT" | "NEAR MISS";
  title: string;
  description: string;
  prompt: string;
  lesson: string;
  sceneEmoji: string;
  hotspots: {
    id: string;
    label: string;
    emoji: string;
    x: number;
    y: number;
    correct: boolean;
  }[];
};

export const stage3Accident: Stage3AccidentCase[] = [
  {
    id: 1,
    tag: "NEAR MISS",
    title: "ควันออกจากตู้ Control Pump",
    description: "พบควันออกจากตู้ควบคุมระบบ Pump ระหว่างเดินเครื่อง",
    prompt: "แตะต้นเหตุ / จุดเสี่ยงหลักของเหตุการณ์นี้",
    lesson: "พบควันหรือกลิ่นไหม้จากตู้ไฟฟ้า ต้องหยุดใช้งาน กั้นพื้นที่ และแจ้งผู้เกี่ยวข้องทันที",
    sceneEmoji: "🏭",
    hotspots: [
      { id: "control", label: "ตู้ Control มีควัน", emoji: "💨", x: 58, y: 38, correct: true },
      { id: "worker", label: "พนักงานยืนดู", emoji: "👷", x: 30, y: 58, correct: false },
      { id: "box", label: "กล่องวางข้างทาง", emoji: "📦", x: 72, y: 70, correct: false },
    ],
  },
  {
    id: 2,
    tag: "INCIDENT",
    title: "ลื่นล้มจากคราบน้ำมัน",
    description: "พนักงานเดินผ่านพื้นที่ทำงานแล้วลื่นล้ม",
    prompt: "แตะต้นเหตุของอุบัติเหตุ",
    lesson: "คราบน้ำมันต้องรีบทำความสะอาดและกั้นพื้นที่ ห้ามปล่อยให้เป็นทางผ่าน",
    sceneEmoji: "🏭",
    hotspots: [
      { id: "oil", label: "คราบน้ำมันบนพื้น", emoji: "🛢️", x: 50, y: 70, correct: true },
      { id: "helmet", label: "หมวกนิรภัย", emoji: "⛑️", x: 25, y: 36, correct: false },
      { id: "sign", label: "ป้ายเตือน", emoji: "⚠️", x: 76, y: 32, correct: false },
    ],
  },
  {
    id: 3,
    tag: "NEAR MISS",
    title: "งา Forklift ค้างสูง",
    description: "Forklift จอดในพื้นที่ทำงาน โดยงายกค้างอยู่ระดับสูง",
    prompt: "แตะจุดที่อันตรายที่สุด",
    lesson: "เมื่อจอด Forklift ต้องลดงาลงต่ำและจอดในพื้นที่ที่กำหนดเท่านั้น",
    sceneEmoji: "🏭",
    hotspots: [
      { id: "fork", label: "งารถยกค้างสูง", emoji: "🚜", x: 52, y: 48, correct: true },
      { id: "cone", label: "กรวยจราจร", emoji: "🔶", x: 22, y: 74, correct: false },
      { id: "pallet", label: "พาเลท", emoji: "🟫", x: 75, y: 73, correct: false },
    ],
  },
];