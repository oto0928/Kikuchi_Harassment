import {
  buildEvaluationResult,
  calculateBossRank,
  clamp,
  getStatusLabel,
} from "@/lib/evaluator-utils";
import {
  ACTION_SPECIFICITY_WORDS,
  DIALOGUE_WORDS,
  EVALUATOR_PARAMS,
  PERSONAL_ATTACK_WORDS,
  POSITIVE_HARASSMENT_WORDS,
  PROBLEM_CLARITY_WORDS,
  STRONG_NEGATIVE_WORDS,
  SUPPORT_WORDS,
  THREAT_WORDS,
} from "@/lib/evaluator-params";
import {
  buildInstantHarassmentResult,
  findInstantHarassmentWords,
} from "@/lib/instant-harassment";
import type { EvaluationResult } from "@/types/game";

function findMatchedWords(text: string, words: string[]): string[] {
  return words.filter((word) => text.includes(word));
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

  const matchedGoodWords = findMatchedWords(text, [...POSITIVE_HARASSMENT_WORDS]);
  score -= matchedGoodWords.length * p.positiveReduction;

  return { score: clamp(score), matchedRiskWords, matchedGoodWords };
}

function calcProblemClarityScore(text: string): number {
  const p = EVALUATOR_PARAMS.problemClarity;
  let score = p.base;
  score += findMatchedWords(text, [...PROBLEM_CLARITY_WORDS]).length * p.keywordBonus;

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

function calcActionSpecificityScore(text: string): number {
  const p = EVALUATOR_PARAMS.actionSpecificity;
  const matches = findMatchedWords(text, [...ACTION_SPECIFICITY_WORDS]);
  let score = p.base + matches.length * p.keywordBonus;
  if (matches.length === 0 && text.trim().length < p.shortTextLength) {
    score -= p.shortNoKeywordPenalty;
  }
  return clamp(score);
}

function calcDialogueScore(text: string): number {
  const p = EVALUATOR_PARAMS.dialogue;
  let score = p.base;
  score += findMatchedWords(text, [...DIALOGUE_WORDS]).length * p.keywordBonus;
  if (text.includes("？") || text.includes("?")) score += p.questionBonus;
  return clamp(score);
}

function calcSupportScore(text: string): number {
  const p = EVALUATOR_PARAMS.support;
  let score = p.base;
  score += findMatchedWords(text, [...SUPPORT_WORDS]).length * p.keywordBonus;
  return clamp(score);
}

/**
 * キーワードベースで指導文を評価する（5軸・RUBRIC v2）
 */
export function evaluateGuidance(inputText: string): EvaluationResult {
  const text = inputText.trim();

  const instantWords = findInstantHarassmentWords(text);
  if (instantWords.length > 0) {
    return buildInstantHarassmentResult(instantWords);
  }

  const { score: harassmentScore, matchedRiskWords, matchedGoodWords } =
    calcHarassmentScore(text);

  return buildEvaluationResult({
    harassmentScore,
    problemClarityScore: calcProblemClarityScore(text),
    actionSpecificityScore: calcActionSpecificityScore(text),
    dialogueScore: calcDialogueScore(text),
    supportScore: calcSupportScore(text),
    matchedRiskWords,
    matchedGoodWords,
  });
}

export { calculateBossRank, getStatusLabel };
