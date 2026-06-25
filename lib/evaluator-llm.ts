import { evaluateGuidance } from "@/lib/evaluator";
import { buildEvaluationResult, clamp } from "@/lib/evaluator-utils";
import {
  buildSystemPrompt,
  buildUserPrompt,
} from "@/lib/evaluator-llm-prompt";
import {
  buildInstantHarassmentResult,
  findInstantHarassmentWords,
} from "@/lib/instant-harassment";
import type { EvaluationResult, EvaluatorMode, Stage } from "@/types/game";

/** LLMが返すJSONの型（5軸） */
type LlmRawResponse = {
  harassmentScore: number;
  problemClarityScore: number;
  actionSpecificityScore: number;
  dialogueScore: number;
  supportScore: number;
  feedback: string;
  npcReaction: string;
  matchedRiskWords: string[];
  matchedGoodWords: string[];
};

export type LlmEvaluateOptions = {
  /** API失敗時にキーワード判定へフォールバック（デフォルト: true） */
  fallbackToKeyword?: boolean;
  /** リトライ回数（デフォルト: 2 = 最大3回試行） */
  maxRetries?: number;
};

export type LlmEvaluateOutcome = {
  result: EvaluationResult;
  source: EvaluatorMode;
  usedFallback: boolean;
};

const DEFAULT_OPTIONS: Required<LlmEvaluateOptions> = {
  fallbackToKeyword: true,
  maxRetries: 2,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseLlmJson(content: string): LlmRawResponse {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AIの応答からJSONを取得できませんでした。");
  }

  const parsed = JSON.parse(jsonMatch[0]) as LlmRawResponse;

  const requiredKeys: (keyof LlmRawResponse)[] = [
    "harassmentScore",
    "problemClarityScore",
    "actionSpecificityScore",
    "dialogueScore",
    "supportScore",
    "feedback",
    "npcReaction",
    "matchedRiskWords",
    "matchedGoodWords",
  ];

  for (const key of requiredKeys) {
    if (parsed[key] === undefined || parsed[key] === null) {
      throw new Error(`AIの応答に ${key} が含まれていません。`);
    }
  }

  return parsed;
}

function rawToEvaluationResult(raw: LlmRawResponse): EvaluationResult {
  return buildEvaluationResult({
    harassmentScore: clamp(Number(raw.harassmentScore)),
    problemClarityScore: clamp(Number(raw.problemClarityScore)),
    actionSpecificityScore: clamp(Number(raw.actionSpecificityScore)),
    dialogueScore: clamp(Number(raw.dialogueScore)),
    supportScore: clamp(Number(raw.supportScore)),
    matchedRiskWords: Array.isArray(raw.matchedRiskWords)
      ? raw.matchedRiskWords.map(String)
      : [],
    matchedGoodWords: Array.isArray(raw.matchedGoodWords)
      ? raw.matchedGoodWords.map(String)
      : [],
    feedback: String(raw.feedback),
    npcReaction: String(raw.npcReaction),
  });
}

async function callOpenAiApi(
  inputText: string,
  stage: Stage
): Promise<EvaluationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY が設定されていません。.env.local に APIキーを追加してください。"
    );
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(stage, inputText) },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API エラー (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error("AIから応答が返ってきませんでした。");
  }

  return rawToEvaluationResult(parseLlmJson(content));
}

/**
 * OpenAI API を使って指導文を評価する（サーバー専用・リトライ付き）
 */
export async function evaluateGuidanceWithLLM(
  inputText: string,
  stage: Stage,
  options: LlmEvaluateOptions = {}
): Promise<EvaluationResult> {
  const { maxRetries } = { ...DEFAULT_OPTIONS, ...options };
  const text = inputText.trim();

  const instantWords = findInstantHarassmentWords(text);
  if (instantWords.length > 0) {
    return buildInstantHarassmentResult(instantWords);
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await callOpenAiApi(text, stage);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await sleep(400 * (attempt + 1));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("AI評価に失敗しました。");
}

/**
 * LLM評価。失敗時はキーワード判定へフォールバック（ゲーム/API用）
 */
export async function evaluateGuidanceWithLLMSafe(
  inputText: string,
  stage: Stage,
  options: LlmEvaluateOptions = {}
): Promise<LlmEvaluateOutcome> {
  const merged = { ...DEFAULT_OPTIONS, ...options };
  const text = inputText.trim();

  const instantWords = findInstantHarassmentWords(text);
  if (instantWords.length > 0) {
    return {
      result: buildInstantHarassmentResult(instantWords),
      source: "llm",
      usedFallback: false,
    };
  }

  try {
    const result = await evaluateGuidanceWithLLM(text, stage, {
      ...merged,
      fallbackToKeyword: false,
    });
    return { result, source: "llm", usedFallback: false };
  } catch (error) {
    if (!merged.fallbackToKeyword) {
      throw error;
    }

    console.warn(
      "[evaluateGuidanceWithLLMSafe] LLM failed, falling back to keyword:",
      error instanceof Error ? error.message : error
    );

    return {
      result: evaluateGuidance(text),
      source: "keyword",
      usedFallback: true,
    };
  }
}
