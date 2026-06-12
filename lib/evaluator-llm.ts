import { buildEvaluationResult, clamp } from "@/lib/evaluator-utils";
import {
  buildInstantHarassmentResult,
  findInstantHarassmentWords,
} from "@/lib/instant-harassment";
import type { EvaluationResult, Stage } from "@/types/game";

/** LLMが返すJSONの型 */
type LlmRawResponse = {
  harassmentScore: number;
  specificityScore: number;
  improvementScore: number;
  satisfactionScore: number;
  feedback: string;
  npcReaction: string;
  matchedRiskWords: string[];
  matchedGoodWords: string[];
};

const SYSTEM_PROMPT = `あなたは「上司の指導文」を評価するAIアシスタントです。
高校生向けの教育ゲーム用に、部下への指導文を4項目で0〜100点で採点してください。

【採点基準】
1. ハラスメント度（0=安全、100=非常に危険）
   - 人格否定・暴言・脅し（クビ、辞めろ等）があれば高得点
   - 「次回から」「一緒に」「相談して」等の建設的表現があれば低得点
2. 指導の具体性（0=曖昧、100=非常に具体的）
   - 期限・手順・確認方法・報告ルール等が明確か
3. 改善提案（0=なし、100=具体的な改善策あり）
   - 次回の行動・再発防止策が示されているか
4. 部下の納得度（0=納得不可、100=納得できる）
   - 支援的で respectful なトーンか

【ゲームルール（参考）】
- ハラスメント度80点以上 → 労基相談エンド
- 具体性または改善提案が30点未満 → 指導不足
- それ以外 → クリア

【出力形式】
必ず以下のJSONのみを返してください。説明文は不要です。
{
  "harassmentScore": 数値,
  "specificityScore": 数値,
  "improvementScore": 数値,
  "satisfactionScore": 数値,
  "feedback": "100文字程度のフィードバック（日本語）",
  "npcReaction": "部下の反応セリフ（日本語、50文字程度）",
  "matchedRiskWords": ["検出したリスク表現の配列"],
  "matchedGoodWords": ["検出した良い表現の配列"]
}`;

function buildUserPrompt(stage: Stage, inputText: string): string {
  const context = stage.contextNote
    ? `\n【田中の状態】${stage.contextNote}`
    : "";

  return `【ステージ】${stage.title}
【ミス内容】${stage.mistake}
【部下の発言】${stage.npcLine}${context}

【上司（プレイヤー）の指導文】
${inputText}

上記の指導文を評価してください。田中の精神状態も考慮して npcReaction を生成してください。`;
}

function parseLlmJson(content: string): LlmRawResponse {
  // ```json ... ``` で囲まれている場合に対応
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AIの応答からJSONを取得できませんでした。");
  }

  const parsed = JSON.parse(jsonMatch[0]) as LlmRawResponse;

  const requiredKeys: (keyof LlmRawResponse)[] = [
    "harassmentScore",
    "specificityScore",
    "improvementScore",
    "satisfactionScore",
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

/**
 * OpenAI API を使って指導文を評価する（サーバー専用）
 */
export async function evaluateGuidanceWithLLM(
  inputText: string,
  stage: Stage
): Promise<EvaluationResult> {
  const text = inputText.trim();

  // 即ハラスメントワードはAPI呼び出し前に判定
  const instantWords = findInstantHarassmentWords(text);
  if (instantWords.length > 0) {
    return buildInstantHarassmentResult(instantWords);
  }

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
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
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

  const raw = parseLlmJson(content);

  return buildEvaluationResult({
    harassmentScore: clamp(Number(raw.harassmentScore)),
    specificityScore: clamp(Number(raw.specificityScore)),
    improvementScore: clamp(Number(raw.improvementScore)),
    satisfactionScore: clamp(Number(raw.satisfactionScore)),
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
