import type { DocumentReviewCase, DocumentReviewAction } from "../../data/endless/documentReviewCases";

type Props = {
  caseData: DocumentReviewCase;
  onComplete: (action: DocumentReviewAction) => void;
  onBack: () => void;
};

export default function DocumentReviewTask({ caseData, onComplete, onBack }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <div className="rounded-[32px] border-4 border-yellow-300 bg-slate-950 p-3 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
        <div className="text-center">
          <div className="font-game font-black text-yellow-300 text-[clamp(1.15rem,5vw,1.6rem)]">
            {caseData.title}
          </div>
          <div className="mt-2 h-[2px] w-full rounded-full bg-yellow-300/30" />

        </div>

        <div className="mt-2 rounded-[24px] bg-white p-5 text-slate-950">
          <div className="font-game font-black text-[clamp(1rem,4.5vw,1.25rem)]">
            ตรวจ Permit ก่อนอนุมัติ
          </div>

          <div className="mt-2 grid gap-2">
          {caseData.lines.map((line) => (
  <div
    key={line}
    className="rounded-2xl border-2 border-slate-300 bg-slate-100 px-4 py-4 font-game font-black text-slate-900 text-[clamp(1rem,4.5vw,1.2rem)]"
  >
    • {line}
  </div>
))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => onComplete("reject")}
            className="rounded-[24px] border-4 border-red-400 bg-red-600 px-4 py-4 font-game font-black text-white text-[clamp(1.05rem,5vw,1.35rem)] active:scale-95"
          >
            ← REJECT
          </button>

          <button
            onClick={() => onComplete("approve")}
            className="rounded-[24px] border-4 border-green-300 bg-green-600 px-4 py-4 font-game font-black text-white text-[clamp(1.05rem,5vw,1.35rem)] active:scale-95"
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