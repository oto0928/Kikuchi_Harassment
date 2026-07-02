import {
  buildEvaluationResult,
  calculateBossRank,
  clamp,
  getStatusLabel,
} from "@/lib/evaluator-utils";
import {
  DIALOGUE_WORDS,
  EVALUATOR_PARAMS,
  EXCESSIVE_DEMAND_WORDS,
  ISOLATION_WORDS,
  MINIMAL_DEMAND_WORDS,
  PERSONAL_ATTACK_WORDS,
  POSITIVE_HARASSMENT_WORDS,
  PRIVACY_INVASION_WORDS,
  PROBLEM_CLARITY_WORDS,
  STRONG_NEGATIVE_WORDS,
  SUPPORT_WORDS,
  THREAT_WORDS,
} from "@/lib/evaluator-params";
import {
  buildInstantHarassmentResult,
  findInstantHarassmentWords,
} from "@/lib/instant-harassment";
import { buildGuidanceAnalysisFeedback } from "@/lib/guidance-feedback";
import { buildNpcReaction } from "@/lib/npc-reaction";
import type { EvaluationResult } from "@/types/game";

function findMatchedWords(text: string, words: string[]): string[] {
  return words.filter((word) => text.includes(word));
}

/**
 * キーワード加点の逓減キャップ。
 * 検出した distinct キーワード数に上限を設けることで、
 * 長文でキーワードを大量に詰め込むほど高得点になる「長文有利」を防ぐ。
 */
function cappedCount(matchCount: number, max: number): number {
  return Math.min(matchCount, max);
}

/** キーワードベースのハラスメント度と検出語（AI判定の校正用） */
export function getHarassmentBaseline(inputText: string): {
  score: number;
  matchedRiskWords: string[];
  matchedGoodWords: string[];
} {
  const text = inputText.trim();
  const instantWords = findInstantHarassmentWords(text);
  if (instantWords.length > 0) {
    return {
      score: 100,
      matchedRiskWords: instantWords,
      matchedGoodWords: [],
    };
  }

  const { score, matchedRiskWords, matchedGoodWords } = calcHarassmentScore(text);
  return { score, matchedRiskWords, matchedGoodWords };
}

/** キーワードベースの「問題点の明確さ」（AI判定の校正用） */
export function getProblemClarityBaseline(inputText: string): number {
  return calcProblemClarityScore(inputText.trim());
}

/** 低シグナル入力と判定されたときに各スコアへ課す上限 */
export const LOW_SIGNAL_SCORE_CAP = 15;

/**
 * 指導として成立していない「低シグナル入力」かどうか。
 * 評価対象の語句（リスク語・良い語・問題点/対話/支援キーワード）や
 * 指導文特有のパターンを一切含まない場合、意味不明・無関係な入力とみなす。
 * AIが空虚な入力に高スコアを付けてしまうのを防ぐために使う。
 */
export function isLowSignalGuidance(inputText: string): boolean {
  const text = inputText.trim();
  if (text.length === 0) return true;

  const anyKeyword =
    findMatchedWords(text, [
      ...THREAT_WORDS,
      ...PERSONAL_ATTACK_WORDS,
      ...STRONG_NEGATIVE_WORDS,
      ...ISOLATION_WORDS,
      ...EXCESSIVE_DEMAND_WORDS,
      ...MINIMAL_DEMAND_WORDS,
      ...PRIVACY_INVASION_WORDS,
      ...POSITIVE_HARASSMENT_WORDS,
      ...PROBLEM_CLARITY_WORDS,
      ...DIALOGUE_WORDS,
      ...SUPPORT_WORDS,
    ]).length > 0;

  const hasGuidancePattern =
    /今回の.{1,16}について/.test(text) ||
    /問題です|問題があります/.test(text) ||
    text.includes("？") ||
    text.includes("?");

  return !anyKeyword && !hasGuidancePattern;
}

/** 指導文に実際に含まれるリスク/良い表現を抽出（表示用・AI/キーワード共通） */
export function getMatchedWordsForDisplay(inputText: string): {
  matchedRiskWords: string[];
  matchedGoodWords: string[];
} {
  const { matchedRiskWords, matchedGoodWords } = getHarassmentBaseline(inputText);
  return { matchedRiskWords, matchedGoodWords };
}

function calcHarassmentScore(text: string): {
  score: number;
  matchedRiskWords: string[];
  matchedGoodWords: string[];
} {
  const p = EVALUATOR_PARAMS.harassment;
  let score = p.base;
  const matchedRiskWords: string[] = [];

  const threatMatches = findMatchedWords(text, [...THREAT_WORDS]);
  matchedRiskWords.push(...threatMatches);
  score += threatMatches.length * p.threat;

  const attackMatches = findMatchedWords(text, [...PERSONAL_ATTACK_WORDS]);
  matchedRiskWords.push(...attackMatches);
  score += attackMatches.length * p.personalAttack;

  const negativeMatches = findMatchedWords(text, [...STRONG_NEGATIVE_WORDS]);
  const uniqueNegative = negativeMatches.filter(
    (w) => !matchedRiskWords.includes(w)
  );
  matchedRiskWords.push(...uniqueNegative);
  score += uniqueNegative.length * p.strongNegative;

  // 類型3〜6（切り離し・過大要求・過小要求・個の侵害）
  const sixTypeMatches = findMatchedWords(text, [
    ...ISOLATION_WORDS,
    ...EXCESSIVE_DEMAND_WORDS,
    ...MINIMAL_DEMAND_WORDS,
    ...PRIVACY_INVASION_WORDS,
  ]).filter((w) => !matchedRiskWords.includes(w));
  matchedRiskWords.push(...sixTypeMatches);
  score += sixTypeMatches.length * p.sixTypeExtra;

  const matchedGoodWords = findMatchedWords(text, [...POSITIVE_HARASSMENT_WORDS]);
  score -= matchedGoodWords.length * p.positiveReduction;

  return { score: clamp(score), matchedRiskWords, matchedGoodWords };
}

function calcProblemClarityScore(text: string): number {
  const p = EVALUATOR_PARAMS.problemClarity;
  let score = p.base;
  const matchCount = findMatchedWords(text, [...PROBLEM_CLARITY_WORDS]).length;
  score += cappedCount(matchCount, p.maxKeywords) * p.keywordBonus;

  if (/今回の.{1,16}について/.test(text)) {
    score += p.contextAboutBonus;
  }
  if (/問題です|問題があります/.test(text)) {
    score += p.problemStatementBonus;
  }
  if (/許されません|許されない|重大/.test(text)) {
    score += p.severityStatementBonus;
  }

  if (text.trim().length < p.shortTextLength) score -= p.shortTextPenalty;
  return clamp(score);
}

function calcDialogueScore(text: string): number {
  const p = EVALUATOR_PARAMS.dialogue;
  let score = p.base;
  const matchCount = findMatchedWords(text, [...DIALOGUE_WORDS]).length;
  score += cappedCount(matchCount, p.maxKeywords) * p.keywordBonus;
  if (text.includes("？") || text.includes("?")) score += p.questionBonus;
  return clamp(score);
}

function calcSupportScore(text: string): number {
  const p = EVALUATOR_PARAMS.support;
  let score = p.base;
  const matchCount = findMatchedWords(text, [...SUPPORT_WORDS]).length;
  score += cappedCount(matchCount, p.maxKeywords) * p.keywordBonus;
  return clamp(score);
}

/**
 * キーワードベースで指導文を評価する（5軸・RUBRIC v2）
 */
export function evaluateGuidance(inputText: string): EvaluationResult {
  const text = inputText.trim();

  const instantWords = findInstantHarassmentWords(text);
  if (instantWords.length > 0) {
    const result = buildInstantHarassmentResult(instantWords);
    return {
      ...result,
      feedback: buildGuidanceAnalysisFeedback(text, result),
      npcReaction: buildNpcReaction(text, result),
    };
  }

  const { score: harassmentScore, matchedRiskWords, matchedGoodWords } =
    calcHarassmentScore(text);

  const result = buildEvaluationResult({
    harassmentScore,
    problemClarityScore: calcProblemClarityScore(text),
    dialogueScore: calcDialogueScore(text),
    supportScore: calcSupportScore(text),
    matchedRiskWords,
    matchedGoodWords,
  });

  return {
    ...result,
    feedback: buildGuidanceAnalysisFeedback(text, result),
    npcReaction: buildNpcReaction(text, result),
  };
}

export { calculateBossRank, getStatusLabel };
