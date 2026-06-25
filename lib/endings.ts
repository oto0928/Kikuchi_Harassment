import type {
  GameEnding,
  StageHistory,
  TanakaStatus,
} from "@/types/game";
import { MAX_STAGES } from "@/types/game";

export type EndingInfo = {
  id: GameEnding;
  title: string;
  description: string;
};

const ENDING_MAP: Record<GameEnding, EndingInfo> = {
  model_boss: {
    id: "model_boss",
    title: "模範上司エンド",
    description:
      "田中はあなたを完全に信頼するようになった。相談しやすい上司として社内で評判に。",
  },
  growth: {
    id: "growth",
    title: "成長エンド",
    description:
      "田中は着実に成長中。あなたの指導も少しずつ上手くなってきた。",
  },
  survivor: {
    id: "survivor",
    title: "ギリギリサバイバーエンド",
    description:
      "なんとか会社は回っている。だが田中の目には疲れが見える……",
  },
  neglect: {
    id: "neglect",
    title: "放置上司エンド",
    description:
      "田中のミスはエスカレートし続けた。チームの信頼を取り戻すには時間がかかる。",
  },
  tanaka_chaos: {
    id: "tanaka_chaos",
    title: "田中伝説エンド",
    description:
      "スリッパ、煙幕装置、コピー紙の山……田中の伝説が社内Slackで永遠に語り継がれる。",
  },
};

/** ステージ3以降がすべてT4だったか */
function countChaosStages(history: StageHistory[]): number {
  return history
    .filter((h) => h.stageId >= 3 && h.tier === "t4")
    .length;
}

/**
 * 5ステージ完走時のエンディングを判定
 */
export function resolveEnding(
  clearedCount: number,
  averageHarassment: number,
  finalTanaka: TanakaStatus,
  history: StageHistory[]
): EndingInfo {
  const chaosCount = countChaosStages(history);
  const playedStages = history.length;

  if (
    chaosCount >= 3 &&
    playedStages >= MAX_STAGES
  ) {
    return ENDING_MAP.tanaka_chaos;
  }

  if (
    clearedCount === MAX_STAGES &&
    finalTanaka.mentalHealth >= 70 &&
    averageHarassment < 25
  ) {
    return ENDING_MAP.model_boss;
  }

  if (clearedCount >= 4 && finalTanaka.mentalHealth >= 50) {
    return ENDING_MAP.growth;
  }

  if (clearedCount >= 3) {
    return ENDING_MAP.survivor;
  }

  return ENDING_MAP.neglect;
}

export function getEndingInfo(id: GameEnding): EndingInfo {
  return ENDING_MAP[id];
}
