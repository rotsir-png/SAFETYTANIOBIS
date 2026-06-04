export type Stage3Puzzle = {
    id: string;
    question: string;
    choices: string[];
    answer: string;
    unlockTitle: string;
    unlockedLines: string[];
  };
  
  export type Stage3Case = {
    id: string;
    title: string;
    subtitle: string;
    lesson: string;
    puzzles: Stage3Puzzle[];
  };
  
  export const stage3Cases: Stage3Case[] = [
    {
      id: "case_001",
      title: "Control Cabinet Smoke",
      subtitle: "พบควันออกจากตู้ Control ระบบ Pump Ammonia",
      lesson:
        "แรงสั่นสะเทือนต่อเนื่องและอุปกรณ์ที่เสื่อมสภาพ อาจทำให้จุดต่อไฟฟ้าหลวม เกิดความร้อนสะสม และนำไปสู่อุปกรณ์เสียหายได้",
      puzzles: [
        {
          id: "p1",
          question: "Motor Pump มี ______ ผิดปกติ",
          choices: ["การสั่นสะเทือน", "น้ำรั่ว", "สนิม", "เสียงเตือน"],
          answer: "การสั่นสะเทือน",
          unlockTitle: "📂 EVIDENCE UNLOCKED",
          unlockedLines: [
            "พบ Breaker 2K2 Trip",
            "พบ Contactor หลอมละลาย",
            "Motor Pump มีการสั่นสะเทือนผิดปกติ",
          ],
        },
        {
          id: "p2",
          question: "อุปกรณ์ภายในตู้เกิด ______ สะสม",
          choices: ["ความร้อน", "น้ำ", "ฝุ่น", "แรงดัน"],
          answer: "ความร้อน",
          unlockTitle: "📂 CAUSE UNLOCKED",
          unlockedLines: [
            "แรงสั่นสะเทือนส่งผลต่อตู้ Control",
            "จุดต่อทองแดงเกิดความร้อน",
            "อุปกรณ์มีอายุการใช้งานนาน",
          ],
        },
        {
          id: "p3",
          question: "ควรจัดทำแผน ______ สำหรับตู้ Control",
          choices: ["PM", "OT", "PR", "QA"],
          answer: "PM",
          unlockTitle: "📂 PREVENTION UNLOCKED",
          unlockedLines: [
            "จัดทำแผน PM ตู้ Control",
            "ตรวจสอบแหล่งกำเนิดแรงสั่นสะเทือน",
            "พิจารณาย้ายตู้ Control ไปยังจุดที่เหมาะสม",
          ],
        },
      ],
    },
  ];