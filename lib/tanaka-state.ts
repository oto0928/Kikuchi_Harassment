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

/**
 * 評価結果（4つの診断パラメータ）から田中ステータスの変化量を計算する。
 *
 * 固定のステップ値ではなく、各パラメータのスコアに比例した連続的な増減にする
 * ことで、指導の質に応じて上下の幅が出るようにしている。
 *
 * - 精神衛生度（気持ち）：対話・支援で癒え、ハラスメント（威圧・嫌味）で削られる
 * - 意識改善レベル（納得・理解）：問題点の明確さ・支援で高まり、恐怖・萎縮で下がる
 */
export function calcTanakaDelta(result: EvaluationResult): TanakaStatusDelta {
  const h = result.harassmentScore;
  const pc = result.problemClarityScore;
  const dg = result.dialogueScore;
  const sp = result.supportScore;

  // --- 精神衛生度 ---
  let mental = 0;
  mental += (dg - 45) * 0.14; // 話を聞いてもらえた安心感（-6〜+7.7）
  mental += (sp - 45) * 0.12; // 支援・フォローの安心感（-5.4〜+6.6）
  mental += (pc - 50) * 0.04; // 何が問題か腑に落ちる（軽め）
  mental += (25 - h) * 0.2; // 穏やかさ↔威圧の基本影響（h25で±0）
  if (h >= 50) {
    mental -= (h - 50) * 0.4; // 人格否定・強い叱責は追加で大きく削る
  }

  // --- 意識改善レベル ---
  let awareness = 0;
  awareness += (pc - 45) * 0.16; // 何が問題で何を直すか理解（-7.2〜+8.8）
  awareness += (sp - 50) * 0.08; // 再発防止の仕組み
  awareness += (dg - 50) * 0.05; // 双方向のやり取り
  if (h >= 40) {
    awareness -= (h - 40) * 0.25; // 恐怖・萎縮で自発的な改善意欲が削がれる
  } else if (h < 25) {
    awareness += 2; // 安心して受け止められる
  }

  return {
    mentalHealth: Math.round(mental),
    awarenessLevel: Math.round(awareness),
  };
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
