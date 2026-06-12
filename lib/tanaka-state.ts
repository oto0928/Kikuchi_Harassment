import { clampStat } from "@/lib/stage-generator";
import type {
  EvaluationResult,
  GameOverReason,
  TanakaStatus,
  TanakaStatusDelta,
} from "@/types/game";

/** ゲーム開始時の田中ステータス */
export const INITIAL_TANAKA_STATUS: TanakaStatus = {
  mentalHealth: 75,
  awarenessLevel: 40,
};

/** 評価結果から田中ステータスの変化量を計算 */
export function calcTanakaDelta(result: EvaluationResult): TanakaStatusDelta {
  let mentalHealth = 0;
  let awarenessLevel = 0;

  switch (result.status) {
    case "clear":
      mentalHealth += 5 + Math.floor(result.satisfactionScore / 25);
      awarenessLevel += 8 + Math.floor(result.improvementScore / 20);
      break;
    case "insufficient":
      mentalHealth -= 8;
      awarenessLevel -= 4;
      break;
    case "labor_consultation":
      mentalHealth -= 45;
      awarenessLevel -= 12;
      break;
  }

  // ハラスメント度による追加ペナルティ
  if (result.harassmentScore >= 60) {
    mentalHealth -= Math.floor((result.harassmentScore - 50) / 4);
  } else if (result.harassmentScore < 25) {
    mentalHealth += 4;
  }

  // 納得度が高いと精神衛生回復
  if (result.satisfactionScore >= 70) {
    mentalHealth += 5;
  }

  // 具体性が高いと意識レベル上昇
  if (result.specificityScore >= 70) {
    awarenessLevel += 5;
  }

  return { mentalHealth, awarenessLevel };
}

/** ステータスを更新 */
export function applyTanakaDelta(
  current: TanakaStatus,
  delta: TanakaStatusDelta
): TanakaStatus {
  return {
    mentalHealth: clampStat(current.mentalHealth + delta.mentalHealth),
    awarenessLevel: clampStat(current.awarenessLevel + delta.awarenessLevel),
  };
}

/** ゲームオーバー判定 */
export function checkGameOver(
  result: EvaluationResult,
  tanakaAfter: TanakaStatus
): GameOverReason {
  if (result.status === "labor_consultation") {
    return "harassment";
  }
  if (tanakaAfter.mentalHealth <= 0) {
    return "mental_breakdown";
  }
  return null;
}

/** ゲームオーバー理由の日本語メッセージ */
export function getGameOverMessage(reason: GameOverReason): string {
  switch (reason) {
    case "harassment":
      return "ハラスメント度が80点を超えました。田中が労基に相談する事態に……";
    case "mental_breakdown":
      return "田中の精神衛生度が0になりました。メンタル崩壊で退職届が提出されました……";
    default:
      return "";
  }
}

/** 精神衛生度の警告レベル */
export function getMentalHealthWarning(
  value: number
): "none" | "caution" | "danger" {
  if (value <= 20) return "danger";
  if (value <= 40) return "caution";
  return "none";
}
