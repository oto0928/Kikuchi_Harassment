type GameHudProps = {
  currentStage: number;
  totalStages: number;
  clearedCount: number;
  stageTitle: string;
};

export default function GameHud({
  currentStage,
  totalStages,
  clearedCount,
  stageTitle,
}: GameHudProps) {
  const progressPercent = ((currentStage) / totalStages) * 100;

  return (
    <div className="mb-4 border-4 border-indigo-800 bg-indigo-900 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="border-2 border-yellow-400 bg-yellow-400 px-2 py-0.5 text-xs font-black tracking-wider text-indigo-900 sm:text-sm">
            STAGE
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

      {/* ステージ進行バー */}
      <div className="mb-3 h-4 overflow-hidden border-2 border-indigo-700 bg-indigo-950">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={currentStage}
          aria-valuemin={1}
          aria-valuemax={totalStages}
          aria-label={`ステージ進行: ${currentStage}/${totalStages}`}
        />
      </div>

      {/* ステージドット */}
      <div className="mb-2 flex justify-between gap-1">
        {Array.from({ length: totalStages }, (_, i) => {
          const stageNum = i + 1;
          const isCurrent = stageNum === currentStage;
          const isPast = stageNum < currentStage;
          return (
            <div
              key={stageNum}
              className={`flex h-6 flex-1 items-center justify-center border-2 text-xs font-bold sm:h-7 sm:text-sm ${
                isCurrent
                  ? "border-yellow-400 bg-yellow-400 text-indigo-900"
                  : isPast
                    ? "border-emerald-500 bg-emerald-600 text-white"
                    : "border-indigo-600 bg-indigo-800 text-indigo-400"
              }`}
              aria-label={`ステージ${stageNum}${isCurrent ? "（現在）" : isPast ? "（通過）" : ""}`}
            >
              {stageNum}
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm font-bold text-yellow-300 sm:text-base">
        {stageTitle}
      </p>

      {/* 危険ライン表示 */}
      <div className="mt-3 flex items-center gap-2 border-2 border-red-500 bg-red-950 px-3 py-2">
        <span className="animate-pulse text-xs font-black text-red-400 sm:text-sm">
          DANGER
        </span>
        <div className="h-2 flex-1 overflow-hidden border border-red-700 bg-red-900">
          <div className="h-full w-[80%] bg-red-500" />
        </div>
        <span className="whitespace-nowrap text-xs font-bold text-red-300">
          80点でGO
        </span>
      </div>
    </div>
  );
}
