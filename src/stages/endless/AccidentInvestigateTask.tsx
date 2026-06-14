import { useMemo, useState } from "react";
import { stage3Cases } from "../../data/stage3Cases";

type Props = {
  onComplete: (correct: boolean) => void;
  onBack: () => void;
};

type Choice = {
  full: string;
  label: string;
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function shortText(text: string, max = 86) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

function rootCauseLabel(text: string) {
  return text
    .split(/\s{2,}|\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .join("\n");
}

export default function AccidentInvestigateTask({ onComplete, onBack }: Props) {
  const [step, setStep] = useState<"incident" | "evidence" | "rootCause">("incident");
const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);

  const caseData = useMemo(() => pick(stage3Cases), []);

  const incidentText = shortText(
    caseData.incidentReport.map((x) => x.text).join(" "),
    110
  );

  const evidence = caseData.evidence.slice(0, 2).map((x) => shortText(x.text, 72));

  const correctRootCause = caseData.rootCause.map((x) => x.text).join(" ");

  const choices: Choice[] = useMemo(() => {
    const wrongChoices = shuffle(
      stage3Cases
        .filter((c) => c.id !== caseData.id)
        .map((c) => c.rootCause.map((x) => x.text).join(" "))
        .filter(Boolean)
    ).slice(0, 2);

    return shuffle([correctRootCause, ...wrongChoices]).map((x) => ({
      full: x,
      label: rootCauseLabel(x),
    }));
  }, [caseData.id, correctRootCause]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gradient-to-b from-slate-800 to-slate-950 px-3 py-3 text-white">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="font-game text-white/45 text-xs">SAFETY OFFICER TASK</div>
          <div className="font-game font-black text-yellow-300 text-[clamp(1.15rem,5.4vw,1.65rem)] leading-none">
            🚨 ACCIDENT INVESTIGATION
          </div>
        </div>

        <button
          onClick={onBack}
          className="shrink-0 rounded-2xl bg-white/10 px-3 py-2 font-game text-white active:scale-95"
        >
          กลับ
        </button>
      </div>

      <div className="mb-2 grid grid-cols-3 gap-2">
  {(["incident", "evidence", "rootCause"] as const).map((s, i) => (
    <div
      key={s}
      className={`rounded-full py-2 text-center font-game font-black text-[11px] ${
        step === s ? "bg-yellow-300 text-slate-950" : "bg-white/10 text-white/45"
      }`}
    >
      <div>{i + 1}</div>
      <div className="text-[9px] leading-none">
        {s === "incident" ? "CASE" : s === "evidence" ? "CLUE" : "CAUSE"}
      </div>
    </div>
  ))}
</div>

      <div className="min-h-0 flex-1 rounded-[28px] border-2 border-yellow-300/40 bg-slate-950/90 p-3">
        {step === "incident" && (
          <div className="flex h-full flex-col justify-between gap-3">
            <div className="rounded-[24px] bg-white p-4 text-slate-950">
              <div className="font-game font-black text-orange-600 text-[clamp(1.1rem,5vw,1.4rem)]">
                รายงานเหตุการณ์
              </div>

              <div className="mt-3 font-game font-black leading-snug text-[clamp(1.15rem,5.3vw,1.45rem)]">
                {incidentText}
              </div>
            </div>

            <button
              onClick={() => setStep("evidence")}
              className="w-full rounded-[24px] bg-yellow-300 py-5 font-game font-black text-slate-950 text-[clamp(1.1rem,5vw,1.4rem)] active:scale-95"
            >
              ดูหลักฐาน →
            </button>
          </div>
        )}

        {step === "evidence" && (
          <div className="flex h-full flex-col justify-between gap-3">
            <div>
              <div className="rounded-2xl bg-blue-500/20 px-3 py-3 text-center font-game font-black text-blue-200 text-[clamp(1.1rem,5vw,1.4rem)]">
                🔍 หลักฐานที่พบ
              </div>

              <div className="mt-3 grid gap-4">
                {evidence.map((text, index) => (
                  <div
                    key={`${text}-${index}`}
                    className="rounded-[24px] border-2 border-blue-300/30 bg-white/10 p-5"
                  >
                    <div className="font-game text-blue-200 text-xs">EVIDENCE {index + 1}</div>
                    <div className="mt-1 font-game font-black leading-tight text-white text-[clamp(1.18rem,5.2vw,1.45rem)]">
                      {text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStep("incident")}
                className="rounded-[24px] bg-white/10 py-5 font-game font-black text-white active:scale-95"
              >
                ← ย้อนกลับ
              </button>

              <button
                onClick={() => setStep("rootCause")}
                className="rounded-[24px] bg-yellow-300 py-5 font-game font-black text-slate-950 active:scale-95"
              >
                เลือก Root Cause →
              </button>
            </div>
          </div>
        )}

        {step === "rootCause" && (
          <div className="flex h-full min-h-0 flex-col">
            <button
              onClick={() => setStep("evidence")}
              className="w-full shrink-0 rounded-[20px] bg-white/10 py-3 font-game font-black text-white active:scale-95"
            >
              ← กลับไปดูหลักฐาน
            </button>

            <div className="mt-3 shrink-0 rounded-2xl bg-black/35 px-3 py-3 text-center">
              <div className="font-game font-black text-yellow-300 text-[clamp(1.15rem,5vw,1.45rem)] leading-tight">
                สาเหตุหลักคืออะไร?
              </div>
            </div>

            <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="grid gap-3 pb-2">
              {choices.map((choice) => (
  <button
    key={choice.full}
    onClick={() => setSelectedChoice(choice)}
    className={`rounded-[22px] border-2 px-5 py-5 text-left font-game font-black leading-[1.5] text-[clamp(1.18rem,5.2vw,1.4rem)] shadow-[0_6px_0_rgba(0,0,0,0.25)] active:scale-95 ${
      selectedChoice?.full === choice.full
        ? "border-yellow-300 bg-yellow-100 text-slate-950"
        : "border-yellow-300/50 bg-white text-slate-950"
    }`}
  >
    <span className="whitespace-pre-line">{choice.label}</span>
  </button>
))}
              </div>
            </div>
          </div>
        )}
      </div>
      {selectedChoice && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full rounded-[30px] border-4 border-yellow-300 bg-slate-950 p-4 shadow-[0_0_35px_rgba(250,204,21,0.35)]">
            <div className="text-center">
              <div className="text-5xl">📋</div>
              <div className="mt-2 font-game font-black text-yellow-300 text-[clamp(1.4rem,7vw,2rem)]">
                ยืนยันคำตอบ?
              </div>
              <div className="font-game text-white/60 text-sm">
                เลือก Root Cause นี้ใช่ไหม
              </div>
            </div>

            <div className="mt-4 max-h-[38vh] overflow-y-auto rounded-[22px] bg-white p-4 font-game font-black leading-[1.45] text-slate-950 text-[clamp(1.05rem,4.8vw,1.25rem)]">
              <span className="whitespace-pre-line">{selectedChoice.label}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedChoice(null)}
                className="rounded-[24px] bg-white/10 py-5 font-game font-black text-white active:scale-95"
              >
                แก้ไข
              </button>

              <button
                onClick={() => onComplete(selectedChoice.full === correctRootCause)}
                className="rounded-[24px] bg-yellow-300 py-5 font-game font-black text-slate-950 active:scale-95"
              >
                ส่งคำตอบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}