import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PauseButton, { usePause } from "../components/PauseButton";

type Props = {
  onComplete: (score: number, highScore: number) => void;
  onExit?: () => void;
};

type Phase = "dashboard" | "resolve" | "training" | "gameover";

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
const SHIFT_TARGET = 10;
const QUEUE_MAX = 5;

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
  { id: "SAFETY_TRAINER", icon: "🎤", title: "Safety Trainer", desc: "Walking Request ตอบถูกได้คะแนนเพิ่ม" },
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

function pickPriority(): TaskPriority {
  const r = Math.random();
  if (r < 0.2) return "HIGH";
  if (r < 0.55) return "MEDIUM";
  return "LOW";
}

function makeTask(extraTime = 0, shift = 1): Task {
  const base = pick(TASK_BANK);
  const priority = pickPriority();

  const priorityBonus =
    priority === "HIGH" ? -3 : priority === "MEDIUM" ? -1 : 2;

  const shiftPenalty = Math.min(5, Math.floor(shift / 2));
  const maxTime = Math.max(
    6,
    15 + extraTime + priorityBonus - shiftPenalty + Math.floor(Math.random() * 5)
  );

  return {
    ...base,
    priority,
    id: `${base.type}-${Date.now()}-${Math.random()}`,
    timeLeft: maxTime,
    maxTime,
  };
}

export default function EndlessMode({ onComplete, onExit }: Props) {
  const [phase, setPhase] = useState<Phase>("dashboard");
  const [queue, setQueue] = useState<Task[]>(() => [makeTask(0, 1)]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [walkingRequest, setWalkingRequest] = useState<WalkingRequest | null>(null);
  const [score, setScore] = useState(0);
  const [factorySafety, setFactorySafety] = useState(MAX_SAFETY);
  const [mistakes, setMistakes] = useState(0);
  const [tasksDone, setTasksDone] = useState(0);
  const [shift, setShift] = useState(1);
  const [banner, setBanner] = useState("รับบท จป. เคลียร์งาน Safety ให้ทัน!");

  const [extraTime, setExtraTime] = useState(0);
  const [queueSlow, setQueueSlow] = useState(0);
  const [assistCharges, setAssistCharges] = useState(0);
  const [overflowStacks, setOverflowStacks] = useState(0);
  const [queueBonus, setQueueBonus] = useState(0);
const [riskEngineerLevel, setRiskEngineerLevel] = useState(0);
const [walkingBonusLevel, setWalkingBonusLevel] = useState(0);

  const doneRef = useRef(false);
  const pausedRef = useRef(false);

  const { paused, togglePause, PauseOverlay } = usePause({
    onGiveUp: () => finishRun(),
  });

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    if (phase !== "dashboard" || doneRef.current) return;
  
    const spawnWalkingRequest = () => {
      if (pausedRef.current || doneRef.current || walkingRequest) return;
  
      const base = pick(WALKING_REQUESTS);
      setWalkingRequest({
        ...base,
        id: `${base.npc}-${Date.now()}-${Math.random()}`,
      });
  
      setBanner(`${base.icon} มีคนมาถามด่วน! ตอบเร็ว จป.!`);
    };
  
    const delay = Math.max(7000, 15000 - shift * 600);
  
    const timer = window.setInterval(spawnWalkingRequest, delay);
  
    return () => {
      window.clearInterval(timer);
    };
  }, [phase, shift, walkingRequest]);
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

  const damageFactory = useCallback(
    (amount: number, reason: string) => {
      if (doneRef.current) return;
      setFactorySafety((s) => Math.max(0, s - amount));
      setMistakes((m) => {
        const next = m + 1;
        if (next >= MAX_MISTAKES) {
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
    if (phase !== "dashboard" || doneRef.current) return;

    const spawnMs = Math.max(1800, 4200 - shift * 250 + queueSlow);

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
        const maxQueue = Math.min(QUEUE_MAX + queueBonus, 1 + shift + queueBonus);
      
        if (q.length >= maxQueue) {
          setOverflowStacks((stack) => {
            const next = Math.min(3, stack + 1);
            damageFactory(5 * next, `Queue ล้น x${next}`);
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
    setPhase("resolve");
  };

  const answerTask = (choiceIndex: number) => {
    if (!activeTask) return;

    const correct = choiceIndex === activeTask.answer;

    setQueue((q) => q.filter((t) => t.id !== activeTask.id));

    if (correct) {
      setOverflowStacks(0);
      const priorityBonus =
  activeTask.priority === "HIGH" ? 80 :
  activeTask.priority === "MEDIUM" ? 40 :
  0;

const gained = 100 + shift * 10 + priorityBonus;
      const rareRoll = Math.random();
let successBanner = `✅ เคลียร์งาน +${gained}`;

setScore((s) => s + gained);

if (rareRoll < 0.04) {
  setFactorySafety((s) => Math.min(MAX_SAFETY, s + 10));
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
          window.setTimeout(() => setPhase("training"), 350);
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
  
    if (training.id === "SAFETY_TRAINER") {
      setWalkingBonusLevel((x) => Math.min(3, x + 1));
    }
  
    if (training.id === "FIRST_AID") {
      setMistakes((m) => Math.max(0, m - 1));
    }
  
    setBanner(`${training.icon} ${training.title} เข้าทีม Safety แล้ว!`);
    setPhase("dashboard");
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
      const gained = 30 + shift * 5 + walkingBonusLevel * 15;
setScore((s) => s + gained);
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
    setOverflowStacks(0);
  
    const gained = 100 + shift * 10;
    setScore((s) => s + gained);
  
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
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden select-none"
      style={{
        background:
          "radial-gradient(circle at top, #145b6b 0%, #071827 42%, #030712 100%)",
      }}
    >
      <div className="relative z-10 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-game text-white/45 text-xs">SAFETY OFFICER DUTY</div>
            <div className="font-game font-black text-white text-[clamp(1.4rem,6vw,1.9rem)]">
              SHIFT {shift}
            </div>
          </div>

          <div className="flex gap-2">
            <PauseButton paused={paused} onToggle={togglePause} />
            {onExit && (
              <button onClick={onExit} className="rounded-2xl bg-white/10 px-3 py-2 font-game text-white">
                ออก
              </button>
            )}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-5 gap-2">
  <Hud label="SAFETY" value={`${factorySafety}%`} />

  <Hud
    label="MISTAKE"
    value={`${"💥".repeat(Math.min(mistakes, MAX_MISTAKES))}${"·".repeat(
      Math.max(0, MAX_MISTAKES - mistakes)
    )}`}
  />

  <Hud label="SCORE" value={String(score)} />

  <button
    onClick={useAssist}
    disabled={assistCharges <= 0 || phase !== "dashboard"}
    className="rounded-2xl border border-white/10 bg-yellow-300/20 px-2 py-2 text-center disabled:opacity-40 active:scale-95"
  >
    <div className="font-game text-white/45 text-[10px]">
      ASSIST
    </div>

    <div className="font-game font-black text-yellow-300 text-[clamp(0.9rem,4vw,1.25rem)]">
      👷x{assistCharges}
    </div>
  </button>
  <button
  onClick={devClearTask}
  className="rounded-2xl border border-pink-300/40 bg-pink-500/20 px-2 py-2 text-center active:scale-95"
>
  <div className="font-game text-white/45 text-[10px]">
    DEV
  </div>

  <div className="font-game font-black text-pink-200">
    CLEAR
  </div>
</button>

</div>

        <div className="mt-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-center">
          <div className="font-game font-black text-yellow-300 text-[clamp(0.95rem,4vw,1.15rem)]">
            {banner}
          </div>
          <div className="font-game text-white/45 text-xs">
          Task Done {tasksDone} / Next Training {SHIFT_EVERY - (tasksDone % SHIFT_EVERY)}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 min-h-0 px-3 pb-3">
        {phase === "dashboard" && (
          <Dashboard
          queue={queue}
          walkingRequest={walkingRequest}
          onOpen={openTask}
          onAnswerWalkingRequest={answerWalkingRequest}
        />
        )}

        {phase === "resolve" && activeTask && (
          <ResolveTask task={activeTask} onAnswer={answerTask} onBack={() => setPhase("dashboard")} />
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

      {PauseOverlay}
    </div>
  );
}

function Hud({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-2 py-2 text-center">
      <div className="font-game text-white/45 text-[10px]">{label}</div>
      <div className="font-game font-black text-white text-[clamp(0.9rem,4vw,1.25rem)]">{value}</div>
    </div>
  );
}

function Dashboard({
  queue,
  walkingRequest,
  onOpen,
  onAnswerWalkingRequest,
}: {
  queue: Task[];
  walkingRequest: WalkingRequest | null;
  onOpen: (task: Task) => void;
  onAnswerWalkingRequest: (index: number) => void;
}) {
  const urgentTask = queue[0];
  const deskPressure = Math.min(100, (queue.length / 5) * 100);
  const isOverload = queue.length >= 4;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="relative flex-1 overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2DAABE33,transparent_55%)]" />

        <div className="absolute left-3 top-3 z-10 rounded-2xl bg-black/45 px-3 py-2">
          <div className="font-game font-black text-white text-xl">
            FACTORY OFFICE
          </div>
          <div className="font-game text-white/60 text-sm">
            {isOverload ? "DESK OVERLOAD!! งานล้นโต๊ะแล้ว!" : "งานเดินเข้าโต๊ะ จป. แล้ว!"}
          </div>
        </div>

        {isOverload && (
          <div className="absolute left-3 right-3 top-24 z-20 rounded-2xl border-4 border-red-500 bg-red-950/85 px-3 py-2 text-center animate-pulse">
            <div className="font-game font-black text-red-300 text-[clamp(1.1rem,5vw,1.5rem)]">
              🚨 DESK OVERLOAD
            </div>
            <div className="font-game text-white text-sm">
              งานล้นโต๊ะ รีบเลือกงานด่วน!
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-3 right-3 z-10">
          <div className="mb-3 flex items-end justify-between text-5xl">
            <div className="animate-bounce">👷</div>

            <div className="rounded-[24px] border-4 border-yellow-300 bg-black/70 px-4 py-3 text-center shadow-[0_0_25px_rgba(250,204,21,0.35)]">
              <div className="text-4xl">🧑‍💼</div>
              <div className="font-game font-black text-yellow-300 text-xs">
                SAFETY DESK
              </div>
            </div>

            <div className="animate-pulse">🚜</div>
            <div>👔</div>
          </div>

          <div className="relative h-28 rounded-[26px] border border-white/10 bg-black/40 overflow-hidden">
            <div className="absolute left-2 top-2 font-game text-white/45 text-xs">
              LIVE TASK FLOW
            </div>

            {queue.slice(0, 5).map((task, index) => (
              <button
                key={task.id}
                onClick={() => onOpen(task)}
                className={`absolute top-9 rounded-2xl border px-3 py-2 text-left active:scale-95 ${
                  task.priority === "HIGH"
                    ? "border-red-400 bg-red-500/25"
                    : task.priority === "MEDIUM"
                    ? "border-yellow-300/60 bg-yellow-300/20"
                    : "border-white/20 bg-white/15"
                }`}
                style={{
                  left: `${Math.min(72, index * 18)}%`,
                  transform: `translateX(-${index * 6}px)`,
                }}
              >
                <div className="font-game font-black text-white text-[clamp(0.75rem,3.2vw,0.95rem)] whitespace-nowrap">
                  {task.icon} {task.title}
                </div>
                <div className="font-game font-black text-red-300 text-xs">
                  {Math.ceil(task.timeLeft)}s
                </div>
              </button>
            ))}

            {queue.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center font-game font-black text-white/45">
                โต๊ะโล่ง... แปลก ๆ นะ จป.
              </div>
            )}
          </div>
        </div>

        {walkingRequest && (
          <div className="absolute inset-x-3 bottom-36 z-30 rounded-[26px] border-4 border-yellow-300 bg-slate-950/95 p-3 shadow-[0_0_30px_rgba(250,204,21,0.35)] animate-bounce">
            <div className="flex items-center gap-3">
              <div className="text-5xl">{walkingRequest.icon}</div>

              <div className="min-w-0 flex-1">
                <div className="font-game font-black text-yellow-300 text-[clamp(1rem,4.5vw,1.3rem)]">
                  {walkingRequest.title}
                </div>
                <div className="font-game font-black text-white text-[clamp(0.95rem,4vw,1.15rem)] leading-tight">
                  {walkingRequest.question}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {walkingRequest.choices.map((choice, index) => (
                <button
                  key={choice}
                  onClick={() => onAnswerWalkingRequest(index)}
                  className="rounded-2xl bg-[#2DAABE] px-3 py-4 font-game font-black text-white text-[clamp(0.95rem,4vw,1.1rem)] active:scale-95"
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-[26px] border border-white/10 bg-black/45 p-3">
        <div className="mb-2 h-3 overflow-hidden rounded-full bg-black/50">
          <div
            className="h-full rounded-full bg-red-500 transition-all"
            style={{ width: `${deskPressure}%` }}
          />
        </div>

        <div className="mb-2 flex items-center justify-between">
          <div className="font-game font-black text-yellow-300">
            PRIORITY DESK
          </div>
          <div className="font-game text-white/45 text-xs">
            PRESSURE {Math.round(deskPressure)}%
          </div>
        </div>

        {urgentTask && (
          <button
            onClick={() => onOpen(urgentTask)}
            className="mb-2 w-full rounded-[24px] border-4 border-yellow-300 bg-yellow-300/15 p-3 text-left active:scale-95"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-game font-black text-yellow-300 text-lg">
                🔥 NEXT: {urgentTask.icon} {urgentTask.title}
              </div>
              <div className="font-game font-black text-red-300">
                {Math.ceil(urgentTask.timeLeft)}s
              </div>
            </div>
            <div className="font-game text-white/70 text-sm">
              {urgentTask.desc}
            </div>
          </button>
        )}

        <div className="grid gap-2">
          {queue.slice(1).map((task) => (
            <button
              key={task.id}
              onClick={() => onOpen(task)}
              className="rounded-2xl border border-white/10 bg-white/10 p-3 text-left active:scale-95"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-game font-black text-white">
                  {task.icon} {task.title}
                </div>

                <div
                  className={`rounded-full px-2 py-1 font-game text-[10px] font-black ${
                    task.priority === "HIGH"
                      ? "bg-red-500 text-white"
                      : task.priority === "MEDIUM"
                      ? "bg-yellow-300 text-slate-950"
                      : "bg-green-400 text-slate-950"
                  }`}
                >
                  {task.priority}
                </div>

                <div className="font-game font-black text-red-300">
                  {Math.ceil(task.timeLeft)}s
                </div>
              </div>

              <div className="font-game text-white/60 text-sm">
                {task.desc}
              </div>
            </button>
          ))}
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
          className="rounded-[26px] border-2 border-yellow-300/50 bg-slate-950/90 p-4 text-left active:scale-95"
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