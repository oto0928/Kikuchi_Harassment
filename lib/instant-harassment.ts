import { buildEvaluationResult } from "@/lib/evaluator-utils";
import type { EvaluationResult } from "@/types/game";

/**
 * 検出された時点でハラスメント度80点以上（即ゲームオーバー）となる表現
 * ※ UIには例として大量表示しない（ユーザー入力の検出のみ）
 */
export const INSTANT_HARASSMENT_WORDS = [
  "死ね",
  "死ねよ",
  "シネ",
  "しね",
  "殺す",
  "殺して",
  "殺してやる",
  "ぶっ殺",
  "消え失せろ",
  "くたばれ",
  "自殺しろ",
  "氏ね",
  "潰す",
  "殴る",
  "蹴る",
  "吊る",
] as const;

/** 即ハラスメントワードが含まれるか検出 */
export function findInstantHarassmentWords(text: string): string[] {
  const normalized = text.trim();
  return INSTANT_HARASSMENT_WORDS.filter((word) => normalized.includes(word));
}

/** 即ハラスメント判定かどうか */
export function hasInstantHarassment(text: string): boolean {
  return findInstantHarassmentWords(text).length > 0;
}

/**
 * 即ハラスメントワード検出時の評価結果を生成
 * キーワード判定・AI判定の両方から利用
 */
export function buildInstantHarassmentResult(
  matchedWords: string[]
): EvaluationResult {
  return buildEvaluationResult({
    harassmentScore: 100,
    specificityScore: 0,
    improvementScore: 0,
    satisfactionScore: 0,
    matchedRiskWords: matchedWords,
    matchedGoodWords: [],
    feedback:
      "命や身体の安全を脅かすような表現、または極めて暴力的な言葉が含まれています。これは指導ではなくハラスメント・パワハラに該当する可能性が非常に高く、絶対に使用してはいけません。",
    npcReaction:
      "……その言葉、さすがに耐えられません。今すぐ労基に相談します。",
  });
}
