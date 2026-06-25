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

/** 評価結果から田中ステータスの変化量を計算（5軸） */
export function calcTanakaDelta(result: EvaluationResult): TanakaStatusDelta {
  let mentalHealth = 0;
  let awarenessLevel = 0;

  switch (result.status) {
    case "clear":
      mentalHealth += 10 + Math.floor(result.dialogueScore / 15);
      awarenessLevel += 12 + Math.floor(result.actionSpecificityScore / 12);
      break;
    case "insufficient":
      mentalHealth -= 15;
      awarenessLevel -= 10;
      break;
    case "labor_consultation":
      mentalHealth -= 50;
      awarenessLevel -= 18;
      break;
  }

  if (result.harassmentScore >= 60) {
    mentalHealth -= Math.floor((result.harassmentScore - 50) / 3);
    awarenessLevel -= Math.floor((result.harassmentScore - 55) / 5);
  } else if (result.harassmentScore >= 40) {
    mentalHealth -= 8;
    awarenessLevel -= 4;
  } else if (result.harassmentScore < 25) {
    mentalHealth += 8;
  }

  if (result.dialogueScore >= 60) {
    mentalHealth += 8;
  }

  if (result.problemClarityScore >= 60) {
    awarenessLevel += 8;
  }

  if (result.supportScore >= 50) {
    mentalHealth += 6;
    awarenessLevel += 6;
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
      return "田中のメンタルが0になりました。メンタル崩壊で退職届が提出されました……";
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
