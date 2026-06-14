import type { DocumentReviewCase, DocumentReviewAction } from "../../data/endless/documentReviewCases";

type Props = {
  caseData: DocumentReviewCase;
  onComplete: (action: DocumentReviewAction) => void;
  onBack: () => void;
};

export default function DocumentReviewTask({ caseData, onComplete, onBack }: Props) {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="rounded-[32px] border-4 border-yellow-300 bg-slate-950 p-4 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
        <div className="text-center">
          <div className="text-5xl">📄</div>
          <div className="font-game font-black text-yellow-300 text-[clamp(1.35rem,6vw,2rem)]">
            {caseData.title}
          </div>
          <div className="font-game text-white/60 text-sm">
            {caseData.location} • {caseData.time}
          </div>
          <div className="font-game text-white/45 text-xs">
            Contractor: {caseData.contractor}
          </div>
        </div>

        <div className="mt-4 rounded-[24px] bg-white p-4 text-slate-950">
          <div className="font-game font-black text-[clamp(1rem,4.5vw,1.25rem)]">
            ตรวจ Permit ก่อนอนุมัติ
          </div>

          <div className="mt-3 grid gap-2">
            {caseData.lines.map((line) => {
              const bad =
                line.includes("ไม่") ||
                line.includes("ยัง") ||
                line.includes("ไม่มี") ||
                line.includes("8%") ||
                line.includes("12%");

              return (
                <div
                  key={line}
                  className={`rounded-2xl px-3 py-2 font-game font-black text-[clamp(0.95rem,4vw,1.15rem)] ${
                    bad ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  }`}
                >
                  {bad ? "✗" : "✓"} {line}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => onComplete("reject")}
            className="rounded-[24px] border-4 border-red-400 bg-red-600 px-4 py-5 font-game font-black text-white text-[clamp(1.05rem,5vw,1.35rem)] active:scale-95"
          >
            ← REJECT
          </button>

          <button
            onClick={() => onComplete("approve")}
            className="rounded-[24px] border-4 border-green-300 bg-green-600 px-4 py-5 font-game font-black text-white text-[clamp(1.05rem,5vw,1.35rem)] active:scale-95"
          >
            APPROVE →
          </button>
        </div>

        <button
          onClick={onBack}
          className="mt-3 w-full rounded-2xl bg-white/10 py-3 font-game text-white"
        >
          กลับไป Queue
        </button>
      </div>
    </div>
  );
}