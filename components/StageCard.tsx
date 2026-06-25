import NpcDialogue from "@/components/NpcDialogue";
import T4ChaosEffects from "@/components/T4ChaosEffects";
import { getMoodFromTanaka } from "@/lib/stage-generator";
import type { Stage, TanakaStatus } from "@/types/game";

type StageCardProps = {
  stage: Stage;
  currentIndex: number;
  totalStages: number;
  tanakaStatus: TanakaStatus;
};

export default function StageCard({
  stage,
  currentIndex,
  totalStages,
  tanakaStatus,
}: StageCardProps) {
  const mood = getMoodFromTanaka(tanakaStatus);
  const isChaos = stage.tier === "t4";

  return (
    <div className="relative w-full">
      {isChaos && <T4ChaosEffects active variant="stage" />}

      {/* シーン：ミス内容（ナレーション） */}
      <div
        className={`relative mb-4 border-4 p-4 sm:p-5 ${
          isChaos
            ? "border-orange-600 bg-orange-950"
            : "border-gray-700 bg-gray-800"
        }`}
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={`border px-2 py-0.5 text-xs font-bold ${
              isChaos
                ? "border-orange-500 bg-orange-700 text-orange-100"
                : "border-gray-500 bg-gray-700 text-gray-300"
            }`}
          >
            {isChaos ? "CHAOS SCENE" : "SCENE"}
          </span>
          <span
            className={`text-xs font-bold ${
              isChaos ? "text-orange-300" : "text-gray-400"
            }`}
          >
            ステージ {currentIndex + 1} / {totalStages}
          </span>
          {isChaos && (
            <span className="border-2 border-orange-500 bg-orange-600 px-2 py-0.5 text-xs font-black text-white">
              T4 カオス
            </span>
          )}
        </div>
        <p
          className={`text-base leading-relaxed sm:text-lg ${
            isChaos ? "font-bold text-orange-50" : "text-white"
          }`}
        >
          {stage.mistake}
        </p>
        {stage.contextNote && (
          <p
            className={`mt-2 text-xs ${
              isChaos ? "text-orange-300/80" : "text-gray-400"
            }`}
          >
            {stage.contextNote}
          </p>
        )}
      </div>

      {/* 部下キャラ + 吹き出し */}
      <div
        className={`relative border-4 p-4 sm:p-6 ${
          isChaos
            ? "border-orange-500 bg-gradient-to-b from-orange-100 to-orange-200"
            : "border-indigo-300 bg-gradient-to-b from-sky-100 to-indigo-100"
        }`}
      >
        {isChaos && (
          <p className="mb-3 text-center text-xs font-black tracking-wider text-orange-700">
            ※ 田中の精神状態が不安定です ※
          </p>
        )}
        <div className={isChaos ? "animate-[pulse_2s_ease-in-out_infinite]" : ""}>
          <NpcDialogue
            message={stage.npcLine}
            mood={isChaos ? "shocked" : mood}
            speakerLabel="部下・田中"
          />
        </div>
      </div>
    </div>
  );
}
