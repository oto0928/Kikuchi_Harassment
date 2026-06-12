import { evaluateGuidanceWithLLM } from "@/lib/evaluator-llm";
import type { Stage } from "@/types/game";
import { NextResponse } from "next/server";

type EvaluateRequestBody = {
  inputText: string;
  stage: Stage;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EvaluateRequestBody;
    const inputText = body.inputText?.trim();

    if (!inputText) {
      return NextResponse.json(
        { error: "指導文を入力してください。" },
        { status: 400 }
      );
    }

    if (!body.stage?.title || !body.stage?.mistake) {
      return NextResponse.json(
        { error: "ステージ情報が不正です。" },
        { status: 400 }
      );
    }

    const result = await evaluateGuidanceWithLLM(inputText, body.stage);

    return NextResponse.json({
      result,
      source: "llm" as const,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "評価中にエラーが発生しました。";
    console.error("[evaluate API]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** AI評価が利用可能かどうか */
export async function GET() {
  const available = Boolean(process.env.OPENAI_API_KEY);
  return NextResponse.json({
    available,
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  });
}
