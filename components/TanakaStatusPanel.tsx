import ScoreBar from "@/components/ScoreBar";
import {
  getAwarenessLabel,
  getMentalHealthLabel,
  getMoodFromTanaka,
} from "@/lib/stage-generator";
import { getMentalHealthWarning } from "@/lib/tanaka-state";
import type { TanakaStatus, TanakaStatusDelta } from "@/types/game";

type TanakaStatusPanelProps = {
  status: TanakaStatus;
  delta?: TanakaStatusDelta | null;
  compact?: boolean;
};

function DeltaBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span
      className={`ml-1 text-xs font-black ${isPositive ? "text-emerald-400" : "text-red-400"}`}
    >
      {isPositive ? "+" : ""}
      {value}
    </span>
  );
}

export default function TanakaStatusPanel({
  status,
  delta,
  compact = false,
}: TanakaStatusPanelProps) {
  const warning = getMentalHealthWarning(status.mentalHealth);
  const mood = getMoodFromTanaka(status);
  const shouldAnimate = Boolean(delta);
  const prevMental = delta
    ? status.mentalHealth - delta.mentalHealth
    : status.mentalHealth;
  const prevAwareness = delta
    ? status.awarenessLevel - delta.awarenessLevel
    : status.awarenessLevel;

  const moodLabel = {
    normal: "普通",
    worried: "不安",
    happy: "やる気",
    shocked: "限界",
  }[mood];

  return (
    <div
      className={`mb-4 border-4 border-indigo-600 bg-indigo-900 ${
        compact ? "p-3" : "p-4 sm:p-5"
      } ${warning === "danger" ? "border-red-500 bg-red-950" : warning === "caution" ? "border-amber-500" : ""}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="border-2 border-sky-400 bg-sky-500 px-2 py-0.5 text-xs font-black text-white">
            STATUS
          </span>
          <span className="text-sm font-black text-white sm:text-base">
            田中
          </span>
        </div>
        <span
          className={`text-xs font-bold ${
            mood === "shocked"
              ? "text-red-400"
              : mood === "worried"
                ? "text-amber-400"
                : mood === "happy"
                  ? "text-emerald-400"
                  : "text-indigo-300"
          }`}
        >
          状態: {moodLabel}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-200">
              メンタル
              {delta && <DeltaBadge value={delta.mentalHealth} />}
            </span>
            <span className="text-xs text-indigo-300">
              {getMentalHealthLabel(status.mentalHealth)}
            </span>
          </div>
          <ScoreBar
            label=""
            score={status.mentalHealth}
            lowIsBad
            hideLabel
            animateScore={shouldAnimate}
            animateFrom={shouldAnimate ? prevMental : undefined}
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-200">
              意識改善レベル
              {delta && <DeltaBadge value={delta.awarenessLevel} />}
            </span>
            <span className="text-xs text-indigo-300">
              {getAwarenessLabel(status.awarenessLevel)}
            </span>
          </div>
          <ScoreBar
            label=""
            score={status.awarenessLevel}
            hideLabel
            animateScore={shouldAnimate}
            animateFrom={shouldAnimate ? prevAwareness : undefined}
          />
        </div>
      </div>

      {warning === "danger" && (
        <p className="mt-2 text-xs font-bold text-red-400">
          警告: メンタルが危険域です。0になるとゲームオーバー！
        </p>
      )}
      {warning === "caution" && (
        <p className="mt-2 text-xs font-bold text-amber-400">
          田中のメンタルが不安定です。支援的な指導を心がけましょう。
        </p>
      )}
    </div>
  );
}
