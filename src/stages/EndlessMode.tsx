import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PauseButton, { usePause } from "../components/PauseButton";
import DocumentReviewTask from "./endless/DocumentReviewTask";
import {
  generateDocumentReviewCase,
  type DocumentReviewCase,
  type DocumentReviewAction,
} from "../data/endless/documentReviewCases";
import AccidentInvestigateTask from "./endless/AccidentInvestigateTask";
import SpotHazardTask from "./endless/SpotHazardTask";
import SafetySwipeLiteTask from "./endless/SafetySwipeLiteTask";
import ScorePopupLayer, { useScorePopup } from "../components/ScorePopup";

type Props = {
  onComplete: (score: number, highScore: number) => void;
  onExit?: () => void;
};

type Phase = "intro" | "dashboard" | "resolve" | "training" | "gameover";

type TaskType =
  | "LEGAL_CHECK"
  | "JSA"
  | "RISK_ASSESSMENT"
  | "PROJECT_REVIEW"
  | "SAFETY_AUDIT"
  | "SAFETY_MANUAL"
  | "TRAINING"
  | "ENV_MEASURE"
  | "SYSTEM_IMPROVE"
  | "INCIDENT_INVESTIGATION"
  | "STAT_REPORT"
  | "OCC_HEALTH"
  | "OTHER_TASK";

  type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

  type Task = {
    id: string;
    type: TaskType;
    icon: string;
    title: string;
    desc: string;
    priority: TaskPriority;
    timeLeft: number;
    maxTime: number;
    question: string;
    choices: string[];
    answer: number;
  };

  type TrainingId =
  | "ASSISTANT"
  | "SLOW_QUEUE"
  | "EXTRA_TIME"
  | "DISPATCHER"
  | "RISK_ENGINEER"
  | "SAFETY_TRAINER"
  | "FIRST_AID";

type Training = {
  id: TrainingId;
  icon: string;
  title: string;
  desc: string;
};
type WalkingRequest = {
  id: string;
  npc: "WORKER" | "FORKLIFT" | "BOSS";
  icon: string;
  title: string;
  question: string;
  choices: string[];
  answer: number;
};
const MAX_MISTAKES = 5;
const MAX_SAFETY = 100;
const SHIFT_EVERY = 10;
const QUEUE_MAX = 5;

const ENDLESS_INTRO_PAGES = [
  {
    icon: "🏭",
    title: "ENDLESS DUTY",
    subtitle: "คุณรับบทเป็น Safety Officer ประจำโรงงาน",
    body: [
      "งาน Safety จะไหลเข้า Queue เรื่อย ๆ",
      "เลือกงานให้ไว เคลียร์ให้ถูก แล้วพาโรงงานรอดให้นานที่สุด",
    ],
    tip: "เป้าหมาย: ทำคะแนนสูงที่สุดเพื่อรับรางวัล",
  },
  {
    icon: "📋",
    title: "TASK QUEUE",
    subtitle: "งานเข้ามาแล้วต้องจัดลำดับ",
    body: [
      "แตะงานใน Queue เพื่อเข้าไปแก้",
      "งานมีเวลา ถ้าปล่อยค้างนานจะเสีย Safety",
      "งาน HIGH ควรรีบจัดการก่อน เพราะพลาดแล้วเจ็บกว่า",
    ],
    tip: "ดูเวลา + Priority ก่อนเลือกงาน",
  },
  {
    icon: "",
    title: "4 TYPES OF WORK",
    subtitle: "แต่ละงานเล่นไม่เหมือนกัน",
    body: [
      "📄 Work Permit : ตรวจเอกสารก่อนอนุมัติ",
      "🔍 Area Inspection: หา Hazard หน้างาน",
      "🚨 Accident Investigation: หา Root Cause",
      "🎓 Safety Coaching: อบรมพนักงาน Unsafe/Safe",
    ],
    tip: "เลือกงาน → อ่านสถานการณ์ → ตัดสินใจให้ถูก",
  },
  {
    icon: "💥",
    title: "",
    subtitle: "อย่าให้โรงงานพัง",
    body: [
      "Safety เริ่มที่ 100%",
      "ตอบผิด / งานค้าง / Queue แน่น จะทำให้ Safety ลด",
      "Mistake ครบ 5 ครั้ง = โรงงานระเบิดตู้มทันที",
    ],
    tip: "ผิดได้นิดหน่อย แต่อย่าพลาดติดกัน",
  },
  {
    icon: "🎓",
    title: "TRAINING TIME",
    subtitle: "ทุก 10 งาน เลือกทีมช่วยงาน",
    body: [
      "เคลียร์ครบ 10 งาน จะได้เลือก Training 1 อย่าง",
      "บาง Training ช่วยเพิ่มเวลา บางอย่างช่วยจัด Queue",
      "Shift ถัดไปจะยากขึ้น งานจะกดดันขึ้น",
    ],
    tip: "เป็น Powerup เลือกดีๆ",
  },
  {
    icon: "",
    title: "อย่ากดกลับหน้าหลัก ให้กดคำว่ายอมแพ้บันทึก Score",
    subtitle: "เราขอฝากโรงงานไว้กับคุณ",
    body: [
      "ดู Queue ตลอดเวลา",
      "อย่าปล่อยงานแดงค้าง",
      "ตัดสินใจแบบ Safety Officer",
    ],
    tip: "พร้อมแล้วเริ่มงานได้เลย",
  },
  {
    icon: "",
    title: "",
    subtitle: "",
    image: "/assets/endless/endless-dashboard-guide.png",
    body: [],
    tip: "",
  },
];
const DOCUMENT_TASK_TYPES: TaskType[] = [
  "LEGAL_CHECK",
  "JSA",
  "PROJECT_REVIEW",
  "SAFETY_MANUAL",
  "STAT_REPORT",
  "OTHER_TASK",
];

const INSPECTION_TASK_TYPES: TaskType[] = [
  "SAFETY_AUDIT",
  "RISK_ASSESSMENT",
  "ENV_MEASURE",
  "OCC_HEALTH",
];

const INVESTIGATION_TASK_TYPES: TaskType[] = [
  "INCIDENT_INVESTIGATION",
  "SYSTEM_IMPROVE",
];

function getTaskGroup(type: TaskType) {
  if (DOCUMENT_TASK_TYPES.includes(type)) return "DOCUMENT";
  if (INSPECTION_TASK_TYPES.includes(type)) return "INSPECTION";
  if (INVESTIGATION_TASK_TYPES.includes(type)) return "INVESTIGATION";
  return "COACHING";
}
const TASK_BANK: Omit<Task, "id" | "priority" | "timeLeft" | "maxTime">[] = [
  {
    type: "LEGAL_CHECK",
    icon: "⚖️",
    title: "LEGAL CHECK",
    desc: "นายจ้างขออนุมัติวิธีทำงาน",
    question: "ผู้จัดการบอกว่า “งานรีบ ไม่ต้อง Lockout ก็ได้” คุณควรทำอย่างไร?",
    choices: ["อนุมัติ", "ไม่อนุมัติ", "ให้ทำเงียบ ๆ"],
    answer: 1,
  },
  {
    type: "JSA",
    icon: "📝",
    title: "JSA",
    desc: "วิเคราะห์งานก่อนเริ่ม",
    question: "งานซ่อมเครื่องจักรควรเริ่มจากอะไร?",
    choices: ["รีบเปิดฝาครอบ", "ชี้บ่งอันตรายและกำหนดขั้นตอนปลอดภัย", "ให้ช่างตัดสินใจเอง"],
    answer: 1,
  },
  {
    type: "RISK_ASSESSMENT",
    icon: "📊",
    title: "RISK ASSESSMENT",
    desc: "ประเมินความเสี่ยง",
    question: "งานที่มีโอกาสบาดเจ็บรุนแรงและเกิดได้บ่อย ควรจัดเป็นระดับใด?",
    choices: ["LOW", "MEDIUM", "HIGH"],
    answer: 2,
  },
  {
    type: "PROJECT_REVIEW",
    icon: "🏗️",
    title: "PROJECT REVIEW",
    desc: "ตรวจแผนงาน/โครงการ",
    question: "โครงการติดตั้งเครื่องใหม่ควรเพิ่มอะไรก่อนอนุมัติ?",
    choices: ["มาตรการความปลอดภัย", "ป้ายสวย ๆ", "เพลงเปิดงาน"],
    answer: 0,
  },
  {
    type: "SAFETY_AUDIT",
    icon: "🔍",
    title: "SAFETY AUDIT",
    desc: "ตรวจตามแผนความปลอดภัย",
    question: "พบพนักงานไม่ใส่แว่นตานิรภัยในพื้นที่เสี่ยง ควรบันทึกเป็นอะไร?",
    choices: ["ผ่าน", "ข้อบกพร่อง", "เรื่องปกติ"],
    answer: 1,
  },
  {
    type: "SAFETY_MANUAL",
    icon: "📘",
    title: "SAFETY MANUAL",
    desc: "แนะนำตามคู่มือ",
    question: "พนักงานไม่เข้าใจคู่มือความปลอดภัย ควรทำอย่างไร?",
    choices: ["ปล่อยไป", "อธิบายและย้ำวิธีปฏิบัติที่ถูกต้อง", "ให้จำเอง"],
    answer: 1,
  },
  {
    type: "TRAINING",
    icon: "🎓",
    title: "TRAINING",
    desc: "อบรมลูกจ้าง",
    question: "การอบรมที่ดีควรทำให้พนักงานทำอะไรได้?",
    choices: ["จำสไลด์", "ทำงานปลอดภัยจริง", "เซ็นชื่ออย่างเดียว"],
    answer: 1,
  },
  {
    type: "ENV_MEASURE",
    icon: "🌡️",
    title: "ENVIRONMENT",
    desc: "ตรวจวัดสภาพแวดล้อม",
    question: "พบเสียงดังเกินเกณฑ์ในพื้นที่ทำงาน ควรทำอะไร?",
    choices: ["ทำเฉย", "ประเมินและกำหนดมาตรการควบคุม", "บอกให้ทน"],
    answer: 1,
  },
  {
    type: "SYSTEM_IMPROVE",
    icon: "🔧",
    title: "SYSTEM IMPROVE",
    desc: "ปรับปรุงระบบความปลอดภัย",
    question: "เกิด Near Miss ซ้ำหลายครั้ง ควรเสนออะไร?",
    choices: ["ปรับปรุงระบบป้องกัน", "ดุพนักงานอย่างเดียว", "ลบรายงาน"],
    answer: 0,
  },
  {
    type: "INCIDENT_INVESTIGATION",
    icon: "📋",
    title: "INCIDENT REVIEW",
    desc: "สอบสวนอุบัติเหตุ",
    question: "หลังเกิดอุบัติเหตุ ควรหาสิ่งใดเป็นหลัก?",
    choices: ["คนผิด", "สาเหตุรากและแนวทางป้องกันซ้ำ", "ข่าวลือ"],
    answer: 1,
  },
  {
    type: "STAT_REPORT",
    icon: "📈",
    title: "STAT REPORT",
    desc: "วิเคราะห์สถิติ",
    question: "อุบัติเหตุเพิ่มขึ้นต่อเนื่อง 3 เดือน ควรทำอะไร?",
    choices: ["รายงานและเสนอแนะมาตรการ", "เก็บไว้ก่อน", "รอสิ้นปี"],
    answer: 0,
  },
  {
    type: "OCC_HEALTH",
    icon: "🫁",
    title: "OCC HEALTH",
    desc: "โรคจากการทำงาน",
    question: "พนักงานสัมผัสฝุ่นเป็นประจำ ควรให้ความรู้เรื่องใด?",
    choices: ["โรคจากการทำงานและการป้องกัน", "แต่งตัวแฟชั่น", "วิธีหลบหัวหน้า"],
    answer: 0,
  },
  {
    type: "OTHER_TASK",
    icon: "🚨",
    title: "URGENT TASK",
    desc: "งานด่วนตามมอบหมาย",
    question: "Contractor จะเข้าทำงานเสี่ยง ควรทำอะไรก่อน?",
    choices: ["ปล่อยเข้าเลย", "ตรวจเอกสาร/มาตรการ/ชี้แจงความปลอดภัย", "ให้รีบทำ"],
    answer: 1,
  },
];

const TRAININGS: Training[] = [
  { id: "ASSISTANT", icon: "👷", title: "Assistant Officer", desc: "ได้ Assist +2 ครั้ง เคลียร์งานเสี่ยงแทนได้" },
  { id: "SLOW_QUEUE", icon: "🧊", title: "Queue Control", desc: "งานใหม่เข้า Queue ช้าลง" },
  { id: "EXTRA_TIME", icon: "⏱️", title: "Better Planning", desc: "Task ใหม่มีเวลาเพิ่ม" },
  { id: "DISPATCHER", icon: "📡", title: "Dispatcher", desc: "เพิ่มขนาด Queue สูงสุด +1" },
  { id: "RISK_ENGINEER", icon: "🛡️", title: "Risk Engineer", desc: "งาน HIGH มีเวลาเพิ่ม ลดไฟไหม้หน้างาน" },
  { id: "FIRST_AID", icon: "🏥", title: "First Aid Team", desc: "ลด Mistake ทันที 1 ครั้ง" },
];
const WALKING_REQUESTS: Omit<WalkingRequest, "id">[] = [
  {
    npc: "WORKER",
    icon: "👷",
    title: "พนักงานถามด่วน!",
    question: "งานเจียรต้องใส่ Face Shield ไหม?",
    choices: ["ต้องใส่", "ไม่ต้อง ใส่แว่นพอ"],
    answer: 0,
  },
  {
    npc: "FORKLIFT",
    icon: "🚜",
    title: "รถยกขอทาง!",
    question: "มีคนเดินตัดหน้ารถยก ควรทำอย่างไร?",
    choices: ["บีบแตรแล้วไปต่อ", "หยุดรถก่อน"],
    answer: 1,
  },
  {
    npc: "BOSS",
    icon: "👔",
    title: "หัวหน้ามาเร่ง!",
    question: "งานรีบมาก ข้าม JSA ได้ไหม?",
    choices: ["ได้ งานด่วน", "ไม่ได้ ต้องทำก่อน"],
    answer: 1,
  },
  {
    npc: "WORKER",
    icon: "👷",
    title: "พนักงานลังเล!",
    question: "ถุงมือขาดนิดหน่อย ใช้ต่อได้ไหม?",
    choices: ["ใช้ต่อได้", "เปลี่ยนใหม่"],
    answer: 1,
  },
  {
    npc: "FORKLIFT",
    icon: "🚜",
    title: "รถยกโหลดเต็ม!",
    question: "ของบังทางมองข้างหน้า ควรขับต่อไหม?",
    choices: ["ไม่ควร ต้องแก้ก่อน", "ขับช้า ๆ ก็พอ"],
    answer: 0,
  },
  {
    npc: "BOSS",
    icon: "👔",
    title: "หัวหน้าขอเร็ว!",
    question: "Lockout Tagout เสียเวลา ข้ามได้ไหม?",
    choices: ["ห้ามข้าม", "ข้ามได้ถ้าช่างเก่ง"],
    answer: 0,
  },
];
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickPriority(shift: number): TaskPriority {
  const r = Math.random();

  // Shift สูง = งานแดงเยอะขึ้น
  const highChance = Math.min(0.5, 0.2 + (shift - 1) * 0.02);
  const mediumChance = Math.min(0.35, 0.35 + (shift - 1) * 0.01);

  if (r < highChance) return "HIGH";
  if (r < highChance + mediumChance) return "MEDIUM";

  return "LOW";
}
function getEndlessTaskDisplay(type: TaskType) {
  const group = getTaskGroup(type);

  if (group === "DOCUMENT") {
    return {
      icon: "📄",
      title: "Work Permit Review",
      desc: "เปิด Work Permit",
    };
  }

  if (group === "INSPECTION") {
    return {
      icon: "🔍",
      title: "Area Inspection",
      desc: "ตรวจสอบหน้างาน",
    };
  }

  if (group === "INVESTIGATION") {
    return {
      icon: "🚨",
      title: "Accident Investigation",
      desc: "สอบสวนอุบัติเหตุ",
    };
  }

  return {
    icon: "🎓",
    title: "Safety Coaching",
    desc: "ตอบคำถามหน้างาน",
  };
}
function makeTask(extraTime = 0, shift = 1): Task {
  const base = pick(TASK_BANK);
  const priority = pickPriority(shift);

  const priorityBonus =
    priority === "HIGH" ? -3 : priority === "MEDIUM" ? -1 : 2;

  const shiftPenalty = Math.min(5, Math.floor(shift / 2));
  const baseTime = 38;
const maxTime = Math.max(
  12,
  baseTime + extraTime + priorityBonus - shiftPenalty * 5 + Math.floor(Math.random() * 5)
);

  const display = getEndlessTaskDisplay(base.type);

return {
  ...base,
  ...display,
  priority,
  id: `${base.type}-${Date.now()}-${Math.random()}`,
  timeLeft: maxTime,
  maxTime,
};
}

export default function EndlessMode({ onComplete, onExit }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
const [introPage, setIntroPage] = useState(0);
  const [queue, setQueue] = useState<Task[]>(() => [makeTask(0, 1)]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeDocumentCase, setActiveDocumentCase] = useState<DocumentReviewCase | null>(null);
  const [activeAccidentTask, setActiveAccidentTask] = useState(false);
  const [activeSpotHazardTask, setActiveSpotHazardTask] = useState(false);
  const [activeSafetySwipeTask, setActiveSafetySwipeTask] = useState(false);
  const [walkingRequest, setWalkingRequest] = useState<WalkingRequest | null>(null);
  const [score, setScore] = useState(0);
  const [factorySafety, setFactorySafety] = useState(MAX_SAFETY);
  const [mistakes, setMistakes] = useState(0);
  const [tasksDone, setTasksDone] = useState(0);
  const [shift, setShift] = useState(1);
  const [banner, setBanner] = useState("รับบท จป. เคลียร์งาน Safety ให้ทัน!");
  const [screenShake, setScreenShake] = useState(false);
  const [safetyFlash, setSafetyFlash] = useState(false);
  const [mistakeFlash, setMistakeFlash] = useState(false);
  const [scoreFlash, setScoreFlash] = useState(false);
  const { popups, showPopup } = useScorePopup();
  const [extraTime, setExtraTime] = useState(0);
  const [queueSlow, setQueueSlow] = useState(0);
  const [assistCharges, setAssistCharges] = useState(0);
  const [queueBonus, setQueueBonus] = useState(0);
const [riskEngineerLevel, setRiskEngineerLevel] = useState(0);
const [overflowCount, setOverflowCount] = useState(0);

  const doneRef = useRef(false);
  const pausedRef = useRef(false);

  const { paused, togglePause, PauseOverlay } = usePause({
    onGiveUp: () => finishRun(),
  });

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  // Walking Request disabled for Endless V1.
// It was too distracting during queue/task gameplay.
// Keep the state/render code for later, but do not spawn it tonight.
useEffect(() => {
  setWalkingRequest(null);
}, []);
  const finishRun = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;

    const oldHigh = Number(localStorage.getItem("tanibis_endless_high_score") || 0);
    const highScore = Math.max(oldHigh, score);

    if (score > oldHigh) {
      localStorage.setItem("tanibis_endless_high_score", String(score));
    }

    onComplete(score, highScore);
  }, [onComplete, score]);
  const pop = (text: string, type: "good" | "bad") => {
    showPopup(
      text,
      type === "good" ? "#22c55e" : "#ef4444",
      50,
      type === "good" ? 52 : 58
    );
  
    if (type === "good") {
      setScoreFlash(true);
      window.setTimeout(() => setScoreFlash(false), 350);
    }
  };
  const healSafety = (amount: number) => {
    setFactorySafety((s) => Math.min(MAX_SAFETY, s + amount));
    showPopup(`Safety +${amount}%`, "#22c55e", 50, 64);
  };
  const damageFactory = useCallback(
    (amount: number, reason: string) => {
      if (doneRef.current) return;
  
      setFactorySafety((s) => Math.max(0, s - amount));
      setSafetyFlash(true);
window.setTimeout(() => setSafetyFlash(false), 450);
pop(`Mistake +1 / Safety -${amount}%`, "bad");
  
      setMistakes((m) => {
        const next = m + 1;
  
        setScreenShake(true);
        window.setTimeout(() => setScreenShake(false), 320);
        setMistakeFlash(true);
window.setTimeout(() => setMistakeFlash(false), 500);
        if (next >= MAX_MISTAKES) {
          pop("โรงงานระเบิด", "bad");
          setBanner("💥 โรงงานระเบิด! Safety Rating พังแล้ว!");
          setPhase("gameover");
          window.setTimeout(() => finishRun(), 900);
        } else {
          setBanner(`${reason} -${amount} Safety`);
        }
        return Math.min(next, MAX_MISTAKES);
      });
    },
    [finishRun]
  );

  useEffect(() => {
    if ((phase !== "dashboard" && phase !== "resolve") || doneRef.current) return;

    const spawnMs = Math.max(1200, 2600 - shift * 220 + queueSlow);

    const interval = window.setInterval(() => {
      if (pausedRef.current || doneRef.current) return;

      setQueue((q) => {
        let next = q
          .map((task) => ({ ...task, timeLeft: task.timeLeft - 1 }))
          .filter((task) => {
            if (task.timeLeft <= 0) {
              damageFactory(task.priority === "HIGH" ? 10 : 5, "งานค้าง");
              return false;
            }
            return true;
          });

        return next;
      });
    }, 1000);

    const spawn = window.setInterval(() => {
      if (pausedRef.current || doneRef.current) return;

      setQueue((q) => {
        const maxQueue = Math.min(QUEUE_MAX + queueBonus, 4 + Math.floor(shift / 2) + queueBonus);
      
        if (q.length >= maxQueue) {
          setFactorySafety((s) => Math.max(0, s - 2));
        
          setOverflowCount((count) => {
            const next = count + 1;
        
            if (next >= 3) {
              damageFactory(0, "Queue Overflow สะสม");
        
              setBanner(
                "💥 Queue Overflow x3 → Mistake +1"
              );
        
              return 0;
            }
        
            setBanner(
              `⚠️ Queue เต็ม! (${next}/3) / Safety -2`
            );
        
            return next;
          });
        
          return q;
        }
      
        const newTask = makeTask(extraTime, shift);

if (newTask.priority === "HIGH" && riskEngineerLevel > 0) {
  const bonus = riskEngineerLevel * 2;
  newTask.timeLeft += bonus;
  newTask.maxTime += bonus;
}

return [...q, newTask];
      });
    }, spawnMs);

    return () => {
      window.clearInterval(interval);
      window.clearInterval(spawn);
    };
  }, [damageFactory, extraTime, phase, queueBonus, queueSlow, riskEngineerLevel, shift]);

  const openTask = (task: Task) => {
    setActiveTask(task);
  
    setActiveDocumentCase(null);
setActiveAccidentTask(false);
setActiveSpotHazardTask(false);
setActiveSafetySwipeTask(false);
  
    const group = getTaskGroup(task.type);
  
    if (group === "DOCUMENT") {
      setActiveDocumentCase(generateDocumentReviewCase());
    }
  
    if (group === "INSPECTION") {
      setActiveSpotHazardTask(true);
    }
  
    if (group === "INVESTIGATION") {
      setActiveAccidentTask(true);
    }
    if (group === "COACHING") {
      setActiveSafetySwipeTask(true);
    }
    setScreenShake(true);
window.setTimeout(() => setScreenShake(false), 120);
    setPhase("resolve");
  };
  const getSafetyMultiplier = () => {
    if (factorySafety >= 90) return 1.5;
    if (factorySafety >= 70) return 1.3;
    if (factorySafety >= 50) return 1.1;
    if (factorySafety >= 30) return 1.0;
    return 0.8;
  };
  const answerAccidentTask = (correct: boolean) => {
    if (!activeTask) return;
  
    setQueue((q) => q.filter((t) => t.id !== activeTask.id));
  
    if (correct) {
      const gained = Math.round((200 + shift * 10) * getSafetyMultiplier());
      setScore((s) => s + gained);
      pop(`+${gained}`, "good");
      healSafety(3);
  
      setTasksDone((d) => {
        const next = d + 1;
        setBanner(`📋 ROOT CAUSE FOUND! +${gained} / Safety +3`);
  
        if (next > 0 && next % SHIFT_EVERY === 0) {
          setShift((sh) => sh + 1);
          window.setTimeout(() => setPhase("training"), 180);
        } else {
          setPhase("dashboard");
        }
        return next;
      });
    } else {
      damageFactory(10, "สรุปสาเหตุผิด");
      setPhase("dashboard");
    }
  
    setActiveTask(null);
    setActiveAccidentTask(false);
  };
  const answerSpotHazardTask = (correct: boolean) => {
    if (!activeTask) return;
  
    setQueue((q) => q.filter((t) => t.id !== activeTask.id));
  
    if (correct) {
      const gained = Math.round(
        (150 + shift * 10) * getSafetyMultiplier()
      );
  
      setScore((s) => s + gained);
      pop(`+${gained}`, "good");
      healSafety(2);
  
      setTasksDone((d) => {
        const next = d + 1;
  
        setBanner(`🔍 HAZARD CONTROLLED! +${gained} / Safety +2`);
  
        if (next > 0 && next % SHIFT_EVERY === 0) {
          setShift((sh) => sh + 1);
          window.setTimeout(() => setPhase("training"), 180);
        } else {
          setPhase("dashboard");
        }
  
        return next;
      });
    } else {
      damageFactory(10, "ตรวจหน้างานผิด");
      setPhase("dashboard");
    }
  
    setActiveTask(null);
    setActiveDocumentCase(null);
    setActiveAccidentTask(false);
    setActiveSpotHazardTask(false);
    setActiveSafetySwipeTask(false);
  };
  const answerTask = (choiceIndex: number) => {
    if (!activeTask) return;

    const correct = choiceIndex === activeTask.answer;

    setQueue((q) => q.filter((t) => t.id !== activeTask.id));

    if (correct) {
      
      const priorityBonus =
  activeTask.priority === "HIGH" ? 80 :
  activeTask.priority === "MEDIUM" ? 40 :
  0;

const safetyMultiplier =
  factorySafety >= 90 ? 1.5 :
  factorySafety >= 70 ? 1.3 :
  factorySafety >= 50 ? 1.1 :
  factorySafety >= 30 ? 1.0 :
  0.8;

const gained = Math.round(
  (100 + shift * 10 + priorityBonus) * safetyMultiplier
);
      const rareRoll = Math.random();
      let successBanner = `✅ เคลียร์งาน +${gained} / Safety +1`;

setScore((s) => s + gained);
pop(`+${gained}`, "good");
healSafety(1);

if (rareRoll < 0.04) {
  healSafety(10);
  successBanner = "🎉 Safety Campaign! Factory Safety +10";
}

if (rareRoll >= 0.04 && rareRoll < 0.07) {
  setMistakes((m) => Math.max(0, m - 1));
  successBanner = "🏥 First Aid Team! ลบ Mistake 1 ครั้ง";
}
      setTasksDone((d) => {
        const next = d + 1;

        setBanner(successBanner);

        if (next > 0 && next % SHIFT_EVERY === 0) {
          setShift((sh) => sh + 1);
          window.setTimeout(() => setPhase("training"), 180);
        } else {
          setPhase("dashboard");
        }

        return next;
      });
    } else {
      damageFactory(activeTask.priority === "HIGH" ? 15 : 10, "ตอบผิด");
      setPhase("dashboard");
    }

    setActiveTask(null);
  };
  const answerDocumentReview = (action: DocumentReviewAction) => {
    if (!activeTask || !activeDocumentCase) return;
  
    const correct = action === activeDocumentCase.correctAction;
  
    setQueue((q) => q.filter((t) => t.id !== activeTask.id));
  
    if (correct) {
      
  
      const priorityBonus =
        activeTask.priority === "HIGH" ? 80 :
        activeTask.priority === "MEDIUM" ? 40 :
        0;
  
      const safetyMultiplier =
  factorySafety >= 90 ? 1.5 :
  factorySafety >= 70 ? 1.3 :
  factorySafety >= 50 ? 1.1 :
  factorySafety >= 30 ? 1.0 :
  0.8;

const gained = Math.round(
  (100 + shift * 10 + priorityBonus) * safetyMultiplier
);
  
      setScore((s) => s + gained);
      pop(`+${gained}`, "good");
      healSafety(2);
  
      setTasksDone((d) => {
        const next = d + 1;
  
        setBanner(`✅ Permit ผ่าน! ${activeDocumentCase.reason} +${gained} / Safety +2`);
  
        if (next > 0 && next % SHIFT_EVERY === 0) {
          setShift((sh) => sh + 1);
          window.setTimeout(() => setPhase("training"), 180);
        } else {
          setPhase("dashboard");
        }
  
        return next;
      });
    } else {
      damageFactory(activeTask.priority === "HIGH" ? 15 : 10, activeDocumentCase.reason);
      setPhase("dashboard");
    }
  
    setActiveTask(null);
    setActiveDocumentCase(null);
  };
  const chooseTraining = (training: Training) => {
    if (training.id === "ASSISTANT") {
      setAssistCharges((x) => x + 2);
    }
  
    if (training.id === "SLOW_QUEUE") {
      setQueueSlow((x) => x + 350);
    }
  
    if (training.id === "EXTRA_TIME") {
      setExtraTime((x) => x + 2);
    }
  
    if (training.id === "DISPATCHER") {
      setQueueBonus((x) => Math.min(3, x + 1));
    }
  
    if (training.id === "RISK_ENGINEER") {
      setRiskEngineerLevel((x) => Math.min(3, x + 1));
    }
  
    if (training.id === "FIRST_AID") {
      setMistakes((m) => Math.max(0, m - 1));
    }
  
    pop(`${training.icon} ${training.title}`, "good");
setBanner(`${training.icon} ${training.title} เข้าทีม Safety แล้ว!`);

window.setTimeout(() => {
  setPhase("dashboard");
}, 220);
  };

  const trainingChoices = useMemo(
    () => [...TRAININGS].sort(() => Math.random() - 0.5).slice(0, 3),
    [shift]
  );
  const useAssist = () => {
    if (assistCharges <= 0 || queue.length === 0 || phase !== "dashboard") {
      return;
    }
  
    const rank = {
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };
  
    const sorted = [...queue].sort(
      (a, b) => rank[b.priority] - rank[a.priority]
    );
  
    const target = sorted[0];
  
    setQueue((q) => q.filter((task) => task.id !== target.id));
    setAssistCharges((x) => x - 1);
    setScore((s) => s + 50);
  
    setBanner(`👷 Assistant เคลียร์ ${target.title} ให้แล้ว +50`);
  };
  
  const answerWalkingRequest = (choiceIndex: number) => {
    if (!walkingRequest) return;
  
    const correct = choiceIndex === walkingRequest.answer;
  
    if (correct) {
      const gained = 30 + shift * 5;
setScore((s) => s + gained);
pop(`+${gained}`, "good");
setBanner(`✅ ${walkingRequest.icon} ตอบไวมาก! +${gained}`);
    } else {
      damageFactory(5, "ตอบ Walking Request ผิด");
    }
  
    setWalkingRequest(null);
  };
  const devClearTask = () => {
    if (phase !== "dashboard" || queue.length === 0 || doneRef.current) {
      return;
    }
  
    const target = queue[0];
  
    setQueue((q) => q.slice(1));
    
  
    const gained = 100 + shift * 10;
    setScore((s) => s + gained);
    pop(`+${gained}`, "good");
  
    setTasksDone((d) => {
      const next = d + 1;
  
      setBanner(`🧪 DEV CLEAR: ${target.title} +${gained}`);
  
      if (next > 0 && next % SHIFT_EVERY === 0) {
        setShift((sh) => sh + 1);
        window.setTimeout(() => setPhase("training"), 250);
      }
  
      return next;
    });
  };
  const safetyStatus =
  factorySafety <= 25
    ? "CRITICAL"
    : factorySafety <= 50
    ? "DANGER"
    : factorySafety <= 75
    ? "CAUTION"
    : "STABLE";
    const criticalAlarm =
  factorySafety <= 15
    ? "💀 FACTORY COLLAPSING"
    : factorySafety <= 25
    ? "🚨 FACTORY CRITICAL"
    : "";
  return (
    <div
    className={`relative flex h-full flex-col overflow-hidden select-none ${
      screenShake ? "screen-shake" : ""
    }`}
      style={{
        background:
  factorySafety <= 25
    ? "radial-gradient(circle at top, #7f1d1d 0%, #111827 45%, #030712 100%)"
    : factorySafety <= 50
    ? "radial-gradient(circle at top, #78350f 0%, #071827 45%, #030712 100%)"
    : "radial-gradient(circle at top, #145b6b 0%, #071827 42%, #030712 100%)",
      }}
    >
      {phase === "intro" && (
  <EndlessIntro
    page={introPage}
    total={ENDLESS_INTRO_PAGES.length}
    data={ENDLESS_INTRO_PAGES[introPage]}
    onNext={() => {
      if (introPage >= ENDLESS_INTRO_PAGES.length - 1) {
        setPhase("dashboard");
        return;
      }

      setIntroPage((p) => p + 1);
    }}
    onBack={() => setIntroPage((p) => Math.max(0, p - 1))}
    onSkip={() => setPhase("dashboard")}
  />
)}
{phase === "dashboard" && (
  <div className="relative z-10 px-4 pt-3 pb-2">
    <div className="flex items-center justify-between">
      <div>
        <div className="font-game text-white/45 text-xs">Endless Mode</div>
        <div className="flex items-center gap-2">
  <div className="font-game font-black text-white text-[clamp(1.4rem,6vw,1.9rem)]">
    SHIFT {shift}
  </div>

  <div
    className={`rounded-full px-2 py-1 font-game font-black text-[10px] ${
      safetyStatus === "CRITICAL"
        ? "animate-pulse bg-red-600 text-white"
        : safetyStatus === "DANGER"
        ? "bg-orange-500 text-white"
        : safetyStatus === "CAUTION"
        ? "bg-yellow-300 text-slate-950"
        : "bg-green-500 text-white"
    }`}
  >
    {safetyStatus}
  </div>
</div>
      </div>

      <div className="flex gap-2">
        <PauseButton paused={paused} onToggle={togglePause} />
      </div>
    </div>

    <div className="mt-2 grid grid-cols-4 gap-2">
    <Hud
  label="SAFETY"
  value={`${factorySafety}%`}
  flash={safetyFlash}
/>
<MistakeHud mistakes={mistakes} maxMistakes={MAX_MISTAKES} flash={mistakeFlash} />
<Hud
  label="SCORE"
  value={String(score)}
  flash={scoreFlash}
/>

      <button
        onClick={useAssist}
        disabled={assistCharges <= 0 || phase !== "dashboard"}
        className="rounded-2xl border border-white/10 bg-yellow-300/20 px-2 py-2 text-center disabled:opacity-40 active:scale-95"
      >
        <div className="font-game text-white/45 text-[10px]">ASSIST</div>
        <div className="font-game font-black text-yellow-300 text-[clamp(0.9rem,4vw,1.25rem)]">
          👷x{assistCharges}
        </div>
      </button>


    </div>

    <div className="mt-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-center">
      <div className="font-game font-black text-yellow-300 text-[clamp(0.95rem,4vw,1.15rem)]">
        {banner}
      </div>
      {criticalAlarm && (
  <div className="mt-1 animate-pulse font-game font-black text-red-300 text-[clamp(1rem,4.5vw,1.35rem)]">
    {criticalAlarm}
  </div>
)}
      <div className="font-game text-white/45 text-xs">
  Task Done {tasksDone} / Next Training {SHIFT_EVERY - (tasksDone % SHIFT_EVERY)}
</div>

    </div>
  </div>
)}
<div
  className={`relative z-10 flex-1 min-h-0 ${
    phase === "dashboard" ? "px-3 pb-3" : "px-0 pb-0"
  }`}
>
        
        {phase === "dashboard" && (
          <Dashboard
          queue={queue}
          maxQueue={Math.min(QUEUE_MAX + queueBonus, 4 + Math.floor(shift / 2) + queueBonus)}
          walkingRequest={walkingRequest}
          onOpen={openTask}
          onAnswerWalkingRequest={answerWalkingRequest}
        />
        )}
        {phase === "resolve" && queue.length > 0 && (
  <div className="absolute left-3 right-3 top-2 z-40 text-center pointer-events-none">
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-game font-black text-[clamp(0.75rem,3.2vw,0.95rem)] ${
        Math.min(...queue.map((t) => t.timeLeft)) <= 10
          ? "animate-pulse border-red-300 bg-red-600 text-white shadow-[0_0_18px_rgba(248,113,113,0.75)]"
          : Math.min(...queue.map((t) => t.timeLeft)) <= 20
          ? "border-yellow-300 bg-yellow-300 text-slate-950"
          : "border-white/20 bg-black/45 text-white"
      }`}
    >
      <span>⏰ Mistake in</span>
      <span>{Math.ceil(Math.min(...queue.map((t) => t.timeLeft)))}s</span>
    </div>
  </div>
)}
{phase === "resolve" && activeTask && activeDocumentCase && (
  
  <DocumentReviewTask
    caseData={activeDocumentCase}
    onComplete={answerDocumentReview}
    onBack={() => {
      setActiveTask(null);
      setActiveDocumentCase(null);
      setActiveAccidentTask(false);
      setActiveSpotHazardTask(false);
      setPhase("dashboard");
    }}
  />
)}

{phase === "resolve" && activeTask && activeSpotHazardTask && (
  <SpotHazardTask
    onComplete={answerSpotHazardTask}
    onBack={() => {
      setActiveTask(null);
      setActiveDocumentCase(null);
      setActiveAccidentTask(false);
      setActiveSpotHazardTask(false);
      setPhase("dashboard");
    }}
  />
)}

{phase === "resolve" && activeTask && activeAccidentTask && (
  <AccidentInvestigateTask
    onComplete={answerAccidentTask}
    onBack={() => {
      setActiveTask(null);
      setActiveDocumentCase(null);
      setActiveAccidentTask(false);
      setActiveSpotHazardTask(false);
      setPhase("dashboard");
    }}
  />
)}
{phase === "resolve" && activeTask && activeSafetySwipeTask && (
  <SafetySwipeLiteTask
    onComplete={(correctCount) => {
      const success = correctCount >= 5;

      setQueue((q) => q.filter((t) => t.id !== activeTask.id));

      if (success) {
        const gained = Math.round(
          (120 + shift * 10) *
          getSafetyMultiplier()
        );

        setScore((s) => s + gained);
        pop(`+${gained}`, "good");
        healSafety(1);

        setTasksDone((d) => {
          const next = d + 1;

          setBanner(
            `🦺 Safety Coaching ${correctCount}/5 +${gained} / Safety +1`
          );

          if (next > 0 && next % SHIFT_EVERY === 0) {
            setShift((sh) => sh + 1);
            window.setTimeout(() => setPhase("training"), 180);
          } else {
            setPhase("dashboard");
          }

          return next;
        });
      } else {
        damageFactory(10, `Safety Coaching ${correctCount}/5`);
        setPhase("dashboard");
      }

      setActiveTask(null);
      setActiveSafetySwipeTask(false);
    }}
    onBack={() => {
      setActiveTask(null);
      setActiveDocumentCase(null);
      setActiveAccidentTask(false);
      setActiveSpotHazardTask(false);
      setActiveSafetySwipeTask(false);
      setPhase("dashboard");
    }}
  />
)}
{phase === "resolve" &&
  activeTask &&
  !activeDocumentCase &&
  !activeSpotHazardTask &&
  !activeAccidentTask &&
!activeSafetySwipeTask && (
    <ResolveTask
      task={activeTask}
      onAnswer={answerTask}
      onBack={() => setPhase("dashboard")}
    />
  )}

        {phase === "training" && (
          <TrainingSelect choices={trainingChoices} onChoose={chooseTraining} />
        )}

        {phase === "gameover" && (
          <div className="flex h-full items-center justify-center text-center">
            <div className="rounded-[32px] border-4 border-red-500 bg-black/80 p-6">
              <div className="text-7xl">💥</div>
              <div className="font-game font-black text-red-400 text-[clamp(2rem,9vw,3rem)]">
                FACTORY BOOM
              </div>
              <div className="font-game text-white">พลาดครบ 5 ครั้ง</div>
            </div>
          </div>
        )}
      </div>
      <ScorePopupLayer popups={popups} />
      {PauseOverlay}
    </div>
  );
}
function EndlessIntro({
  page,
  total,
  data,
  onNext,
  onBack,
  onSkip,
}: {
  page: number;
  total: number;
  data: {
    icon: string;
    title: string;
    subtitle: string;
    image?: string;
    body: string[];
    tip: string;
  };
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const isLast = page >= total - 1;
  if (data.image) {
    return (
      <div className="absolute inset-0 z-[999] flex h-full flex-col overflow-hidden bg-black">
        <img
          src={data.image}
          alt="Endless Dashboard Guide"
          draggable={false}
          className="min-h-0 flex-1 object-contain"
        />
  
        <div className="shrink-0 px-4 pb-4 pt-2">
          <button
            onPointerUp={onNext}
            className="w-full rounded-2xl border-2 border-yellow-300 bg-yellow-300 py-3 font-game font-black text-slate-950 active:scale-95"
            style={{ fontSize: "clamp(1.15rem, 5vw, 1.5rem)" }}
          >
            เข้าใจแล้ว! เริ่มอ่านคำแนะนำต่อ 👆
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onPointerUp={onNext}
      className="absolute inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden bg-black/85 px-6 text-center"
    >
      <button
        onPointerUp={(e) => {
          e.stopPropagation();
          onSkip();
        }}
        className="absolute right-4 top-4 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 font-game font-black text-white/70 active:scale-95"
        style={{ fontSize: "clamp(0.75rem, 3.2vw, 0.95rem)" }}
      >
        SKIP
      </button>

      <div className="mb-3 font-game font-black text-white/45 text-xs">
        ENDLESS MODE · {page + 1}/{total}
      </div>

      <div className="mb-4 text-[clamp(4rem,18vw,6.5rem)] leading-none">
        {data.icon}
      </div>

      <div
        className="font-game font-black text-yellow-300 leading-none"
        style={{
          fontSize: "clamp(1.7rem, 8vw, 2.45rem)",
          textShadow: "0 3px 0 rgba(0,0,0,0.45)",
        }}
      >
        {data.title}
      </div>

      <div
        className="mt-3 font-game font-black text-white leading-snug"
        style={{
          fontSize: "clamp(1.05rem, 4.8vw, 1.35rem)",
          textShadow: "0 2px 0 rgba(0,0,0,0.45)",
        }}
      >
        {data.subtitle}
      </div>

      <div
        className="mt-5 w-full rounded-3xl border border-white/10 bg-black/35 px-4 py-4 font-game font-black text-white/85 leading-relaxed"
        style={{
          fontSize: "clamp(0.98rem, 4.1vw, 1.18rem)",
          maxHeight: "42dvh",
        }}
      >
        {data.body.map((line) => (
          <div key={line} className="mb-2 last:mb-0">
            {line}
          </div>
        ))}
      </div>

      <div
        className="mt-4 rounded-2xl border border-yellow-300/45 bg-yellow-300/15 px-4 py-3 font-game font-black text-yellow-300"
        style={{ fontSize: "clamp(0.92rem, 3.8vw, 1.08rem)" }}
      >
        💡 {data.tip}
      </div>

      <div className="mt-8 flex w-full items-center gap-2">
        <button
          onPointerUp={(e) => {
            e.stopPropagation();
            onBack();
          }}
          disabled={page === 0}
          className="w-[32%] rounded-2xl border border-white/15 bg-white/10 py-3 font-game font-black text-white disabled:opacity-25 active:scale-95"
          style={{ fontSize: "clamp(0.95rem, 4vw, 1.15rem)" }}
        >
          BACK
        </button>

        <button
          onPointerUp={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="flex-1 rounded-2xl border-2 border-yellow-300/55 bg-yellow-300/20 py-3 font-game font-black text-yellow-300 animate-pulse active:scale-95"
          style={{ fontSize: "clamp(1.05rem, 4.8vw, 1.35rem)" }}
        >
          {isLast ? "👆 แตะเพื่อเริ่ม!" : "👆 แตะเพื่อไปต่อ"}
        </button>
      </div>
    </div>
  );
}
function Hud({
  label,
  value,
  flash = false,
}: {
  label: string;
  value: string;
  flash?: boolean;
}) {
  return (
    <div
  className={`rounded-2xl border px-2 py-2 text-center transition-all duration-150 ${
    flash
      ? "border-red-400 bg-red-500/30 scale-110"
      : "border-white/10 bg-white/10"
  }`}
>
      <div className="font-game text-white/45 text-[10px]">{label}</div>
      <div className="font-game font-black text-white text-[clamp(0.9rem,4vw,1.25rem)]">
  {value}
</div>

{label === "SAFETY" && (
  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/40">
    <div
      className={`h-full rounded-full ${
        Number(value.replace("%", "")) <= 25
          ? "bg-red-500"
          : Number(value.replace("%", "")) <= 50
          ? "bg-orange-400"
          : Number(value.replace("%", "")) <= 75
          ? "bg-yellow-300"
          : "bg-green-500"
      }`}
      style={{
        width: value,
      }}
    />
  </div>
)}
    </div>
  );
}
function MistakeHud({
  mistakes,
  maxMistakes,
  flash = false,
}: {
  mistakes: number;
  maxMistakes: number;
  flash?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-2 py-2 text-center transition-all duration-150 ${
        flash
          ? "scale-110 border-red-400 bg-red-500/30"
          : mistakes >= maxMistakes - 1
          ? "border-red-400 bg-red-500/20"
          : "border-white/10 bg-white/10"
      }`}
    >
      <div className="font-game text-white/45 text-[10px]">MISTAKE</div>
      <div className="font-game font-black text-[clamp(0.8rem,3.5vw,1.05rem)] leading-none">
        {Array.from({ length: maxMistakes }).map((_, i) => (
          <span key={i} className={i < mistakes ? "text-red-400" : "text-white/25"}>
            {i < mistakes ? "💥" : "□"}
          </span>
        ))}
      </div>
    </div>
  );
}

function Dashboard({
  queue,
  maxQueue,
  walkingRequest,
  onOpen,
  onAnswerWalkingRequest,
}: {
  queue: Task[];
  maxQueue: number;
  walkingRequest: WalkingRequest | null;
  onOpen: (task: Task) => void;
  onAnswerWalkingRequest: (index: number) => void;
}) {
  const deskPressure = Math.min(100, (queue.length / maxQueue) * 100);
const dangerQueue = queue.length >= maxQueue - 1;
const criticalQueue = queue.length >= maxQueue;
const mostUrgentTime = queue.length > 0 ? Math.min(...queue.map((task) => task.timeLeft)) : 999;
const queueStatus =
  criticalQueue
    ? "OVERLOAD"
    : dangerQueue
    ? "BUSY"
    : mostUrgentTime <= 8
    ? "URGENT"
    : "OK";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
  className={`flex min-h-0 flex-1 flex-col rounded-[26px] border bg-black/45 p-3 ${
    criticalQueue
  ? "border-red-300 bg-red-950/45 shadow-[0_0_30px_rgba(248,113,113,0.55)]"
  : dangerQueue
  ? "border-red-400 shadow-[0_0_24px_rgba(248,113,113,0.35)]"
  : "border-white/10"
  }`}
>

<div className="mb-2 flex shrink-0 items-start justify-between">
  <div className="font-game font-black text-yellow-300 text-[clamp(1rem,4.5vw,1.25rem)]">
    QUEUE
  </div>

  <div className="text-right leading-none">
    <div
      className={`font-game font-black text-[clamp(2rem,9vw,3rem)] ${
        criticalQueue
          ? "text-red-300 animate-pulse"
          : dangerQueue
          ? "text-yellow-300"
          : "text-white"
      }`}
    >
      {queue.length}/{maxQueue}
    </div>

    <div
      className={`mt-1 font-game font-black text-[10px] ${
        criticalQueue
          ? "text-red-300 animate-pulse"
          : dangerQueue
          ? "text-yellow-300"
          : "text-green-300"
      }`}
    >
      {queueStatus}
    </div>
  </div>
</div>

        <div className="min-h-0 flex-1 overflow-y-scroll overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">
          <div className="grid gap-2 pb-6">
          {queue.map((task, index) => {
  const isMostUrgent = task.timeLeft === mostUrgentTime;
  const isCritical = task.timeLeft <= 8;

  return (
    <button
                key={task.id}
                onClick={() => onOpen(task)}
                className={`w-full rounded-[24px] p-3 text-left transition-all duration-150 active:scale-95 ${
                  isCritical
                  ? "border-2 border-red-400 bg-red-500/15 shadow-[0_0_18px_rgba(248,113,113,0.35)]"
  : isMostUrgent
  ? "border-2 border-yellow-300 bg-yellow-300/15 shadow-[0_0_16px_rgba(250,204,21,0.28)]"
  : "border border-white/10 bg-white/10 hover:bg-white/15"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`font-game font-black ${
                      isCritical ? "text-red-300 text-lg" : isMostUrgent ? "text-yellow-300 text-lg" : "text-white"
                    }`}
                  >
                    {task.icon} {task.title}
                  </div>

                  <div
  className={`rounded-full px-2 py-1 font-game font-black ${
    task.timeLeft <= 8
      ? "animate-pulse bg-red-600 text-white"
      : task.timeLeft <= 16
      ? "bg-yellow-300 text-slate-950"
      : "bg-white/10 text-white"
  }`}
>
  {Math.ceil(task.timeLeft)}s
</div>
                </div>

                <div className="font-game text-white/70 text-sm">
                  {task.desc}
                </div>
              </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
function ResolveTask({
  task,
  onAnswer,
  onBack,
}: {
  task: Task;
  onAnswer: (index: number) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="rounded-[30px] border-4 border-yellow-300 bg-slate-950 p-4 shadow-[0_0_30px_rgba(250,204,21,0.25)]">
        <div className="text-center">
          <div className="text-5xl">{task.icon}</div>
          <div className="font-game font-black text-yellow-300 text-[clamp(1.4rem,7vw,2rem)]">
            {task.title}
          </div>
          <div className="font-game text-white/60 text-sm">{task.desc}</div>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-4 font-game font-black text-slate-950 text-[clamp(1.05rem,4.8vw,1.35rem)]">
          {task.question}
        </div>

        <div className="mt-3 grid gap-2">
          {task.choices.map((choice, index) => (
            <button
              key={choice}
              onClick={() => onAnswer(index)}
              className="rounded-2xl bg-[#2DAABE] px-4 py-4 text-left font-game font-black text-white active:scale-95"
            >
              {choice}
            </button>
          ))}
        </div>

        <button onClick={onBack} className="mt-3 w-full rounded-2xl bg-white/10 py-3 font-game text-white">
          กลับไป Queue
        </button>
      </div>
    </div>
  );
}

function TrainingSelect({
  choices,
  onChoose,
}: {
  choices: Training[];
  onChoose: (training: Training) => void;
}) {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="text-center">
        <div className="font-game font-black text-yellow-300 text-[clamp(1.8rem,8vw,2.5rem)]">
          TRAINING TIME
        </div>
        <div className="font-game text-white/60">จบ Shift แล้ว เลือกทีมช่วยงาน 1 อย่าง</div>
      </div>

      {choices.map((t) => (
        <button
          key={t.id}
          onClick={() => onChoose(t)}
          className="rounded-[26px] border-2 border-yellow-300/50 bg-slate-950/90 p-4 text-left transition-all duration-150 active:scale-95 active:bg-yellow-300/20 shadow-[0_0_18px_rgba(250,204,21,0.18)]"
        >
          <div className="flex items-center gap-3">
            <div className="text-5xl">{t.icon}</div>
            <div>
              <div className="font-game font-black text-yellow-300 text-xl">{t.title}</div>
              <div className="font-game font-bold text-white">{t.desc}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}