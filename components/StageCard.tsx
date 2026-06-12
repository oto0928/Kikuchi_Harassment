import NpcDialogue from "@/components/NpcDialogue";
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

  return (
    <div className="w-full">
      {/* シーン：ミス内容（ナレーション） */}
      <div className="mb-4 border-4 border-gray-700 bg-gray-800 p-4 sm:p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="border border-gray-500 bg-gray-700 px-2 py-0.5 text-xs font-bold text-gray-300">
            SCENE
          </span>
          <span className="text-xs font-bold text-gray-400">
            ステージ {currentIndex + 1} / {totalStages}
          </span>
        </div>
        <p className="text-base leading-relaxed text-white sm:text-lg">
          {stage.mistake}
        </p>
        {stage.contextNote && (
          <p className="mt-2 text-xs text-gray-400">{stage.contextNote}</p>
        )}
      </div>

      {/* 部下キャラ + 吹き出し */}
      <div className="border-4 border-indigo-300 bg-gradient-to-b from-sky-100 to-indigo-100 p-4 sm:p-6">
        <NpcDialogue
          message={stage.npcLine}
          mood={mood}
          speakerLabel="部下・田中"
        />
      </div>
    </div>
  );
}
