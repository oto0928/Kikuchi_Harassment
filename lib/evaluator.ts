import {
  buildEvaluationResult,
  calculateBossRank,
  clamp,
  getStatusLabel,
} from "@/lib/evaluator-utils";
import {
  buildInstantHarassmentResult,
  findInstantHarassmentWords,
} from "@/lib/instant-harassment";
import type { EvaluationResult } from "@/types/game";

// ---------------------------------------------------------------------------
// キーワード定義
// ---------------------------------------------------------------------------

const THREAT_WORDS = ["辞めろ", "クビ", "消えろ"];

const PERSONAL_ATTACK_WORDS = [
  "バカ",
  "無能",
  "社会人失格",
  "向いてない",
  "給料泥棒",
  "役立たず",
  "お前",
];

const STRONG_NEGATIVE_WORDS = [
  "使えない",
  "ふざけるな",
  "何回言えばわかる",
  "やる気あるの",
  "迷惑",
  "だからダメ",
  "ありえない",
  "こんなこともできない",
  "やめろ",
];

const POSITIVE_HARASSMENT_WORDS = [
  "次回から",
  "一緒に",
  "確認",
  "相談",
  "改善",
  "原因",
  "対策",
  "チェックリスト",
  "再発防止",
  "困ったら",
  "早めに",
  "共有",
  "振り返り",
  "具体的に",
];

const SPECIFICITY_WORDS = [
  "期限",
  "確認",
  "報告",
  "相談",
  "チェック",
  "原因",
  "次回",
  "手順",
  "共有",
  "メール",
  "資料",
  "会議",
  "バックアップ",
  "再発防止",
];

const IMPROVEMENT_WORDS = [
  "次回から",
  "してください",
  "しましょう",
  "チェックリスト",
  "相談してください",
  "報告してください",
  "確認してください",
  "早めに",
  "一緒に考えよう",
  "手順を決めよう",
  "再発防止",
  "対策",
];

const SATISFACTION_POSITIVE_WORDS = [
  "責めたいわけではない",
  "一緒に",
  "まずは",
  "次に活かす",
  "相談して",
  "困ったら",
  "大丈夫",
  "改善していこう",
  "確認しよう",
  "振り返ろう",
];

const SATISFACTION_NEGATIVE_WORDS = [
  "使えない",
  "無能",
  "バカ",
  "お前",
  "クビ",
  "辞めろ",
  "何回言えばわかる",
  "やる気あるの",
  "社会人失格",
  "だからダメ",
];

function findMatchedWords(text: string, words: string[]): string[] {
  return words.filter((word) => text.includes(word));
}

function calcHarassmentScore(text: string): {
  score: number;
  matchedRiskWords: string[];
  matchedGoodWords: string[];
} {
  let score = 20;
  const matchedRiskWords: string[] = [];

  const threatMatches = findMatchedWords(text, THREAT_WORDS);
  matchedRiskWords.push(...threatMatches);
  score += threatMatches.length * 30;

  const attackMatches = findMatchedWords(text, PERSONAL_ATTACK_WORDS);
  matchedRiskWords.push(...attackMatches);
  score += attackMatches.length * 25;

  const negativeMatches = findMatchedWords(text, STRONG_NEGATIVE_WORDS);
  const uniqueNegative = negativeMatches.filter(
    (w) => !matchedRiskWords.includes(w)
  );
  matchedRiskWords.push(...uniqueNegative);
  score += uniqueNegative.length * 15;

  const matchedGoodWords = findMatchedWords(text, POSITIVE_HARASSMENT_WORDS);
  score -= matchedGoodWords.length * 5;

  return { score: clamp(score), matchedRiskWords, matchedGoodWords };
}

function calcSpecificityScore(text: string): number {
  let score = 20;
  score += findMatchedWords(text, SPECIFICITY_WORDS).length * 10;
  if (text.trim().length < 20) score -= 20;
  return clamp(score);
}

function calcImprovementScore(text: string): number {
  let score = 10;
  const matches = findMatchedWords(text, IMPROVEMENT_WORDS);
  score += matches.length * 15;
  if (matches.length === 0 && text.trim().length < 30) score -= 10;
  return clamp(score);
}

function calcSatisfactionScore(text: string, harassmentScore: number): number {
  let score = 50;
  score += findMatchedWords(text, SATISFACTION_POSITIVE_WORDS).length * 10;
  score -= findMatchedWords(text, SATISFACTION_NEGATIVE_WORDS).length * 15;
  if (harassmentScore >= 80) score -= 40;
  else if (harassmentScore >= 60) score -= 25;
  else if (harassmentScore >= 40) score -= 10;
  return clamp(score);
}

/**
 * キーワードベースで指導文を評価する（クライアントでも使用可）
 */
export function evaluateGuidance(inputText: string): EvaluationResult {
  const text = inputText.trim();

  // 即ハラスメントワードは最優先で判定
  const instantWords = findInstantHarassmentWords(text);
  if (instantWords.length > 0) {
    return buildInstantHarassmentResult(instantWords);
  }

  const { score: harassmentScore, matchedRiskWords, matchedGoodWords } =
    calcHarassmentScore(text);

  return buildEvaluationResult({
    harassmentScore,
    specificityScore: calcSpecificityScore(text),
    improvementScore: calcImprovementScore(text),
    satisfactionScore: calcSatisfactionScore(text, harassmentScore),
    matchedRiskWords,
    matchedGoodWords,
  });
}

export { calculateBossRank, getStatusLabel };
