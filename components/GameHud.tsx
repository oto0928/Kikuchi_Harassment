type GameHudProps = {
  currentStage: number;
  totalStages: number;
  clearedCount: number;
  tier?: string;
};

export default function GameHud({
  currentStage,
  totalStages,
  clearedCount,
  tier,
}: GameHudProps) {
  const isChaos = tier === "t4";

  return (
    <div
      className={`mb-4 border-4 p-3 sm:p-4 ${
        isChaos
          ? "border-orange-600 bg-orange-950"
          : "border-indigo-800 bg-indigo-900"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`border-2 px-2 py-0.5 text-xs font-black tracking-wider sm:text-sm ${
              isChaos
                ? "border-orange-400 bg-orange-500 text-white"
                : "border-yellow-400 bg-yellow-400 text-indigo-900"
            }`}
          >
            {isChaos ? "CHAOS" : "STAGE"}
          </span>
          <span className="text-xl font-black tabular-nums text-white sm:text-2xl">
            {currentStage}
            <span className="text-sm font-bold text-indigo-300">
              {" "}
              / {totalStages}
            </span>
          </span>
        </div>
        <span className="text-sm font-bold text-indigo-200 sm:text-base">
          クリア {clearedCount} ステージ
        </span>
      </div>
    </div>
  );
}
