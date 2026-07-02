import { EVALUATOR_PARAMS } from "@/lib/evaluator-params";
import type { EvaluationResult } from "@/types/game";

const RISK_PHRASE_COMMENTS: Record<string, string> = {
  ふざけるな: "この言い方は良くないです。感情的な表現は避けましょう。",
  ふざけんな: "この言い方は良くないです。感情的な表現は避けましょう。",
  使えない: "人格を否定する表現です。業務の問題に焦点を当てましょう。",
  何回言えばわかる: "強い叱責になっています。落ち着いて伝えましょう。",
  やる気あるの: "人格を疑う表現です。業務の改善点に焦点を当てましょう。",
  バカ: "人格を否定する表現です。絶対に使わないでください。",
  無能: "人格を否定する表現です。絶対に使わないでください。",
  社会人失格: "人格を否定する表現です。絶対に使わないでください。",
  向いてない: "人格を否定する表現です。業務の改善点に焦点を当てましょう。",
  給料泥棒: "人格を否定する表現です。絶対に使わないでください。",
  役立たず: "人格を否定する表現です。絶対に使わないでください。",
  お前: "二人称が強すぎます。「あなた」や名前で呼びましょう。",
  辞めろ: "解雇を示唆する表現です。絶対に使わないでください。",
  クビ: "解雇を示唆する表現です。絶対に使わないでください。",
  消えろ: "人格を否定する表現です。絶対に使わないでください。",
  ダメだよ: "否定的すぎます。何が問題でどう直すかを伝えましょう。",
  だからダメ: "否定的すぎます。理由と改善策をセットで伝えましょう。",
  ありえない: "感情的な否定です。事実ベースで伝えましょう。",
  許され: "脅しに聞こえることがあります。業務上の影響を説明しましょう。",
  やめろ: "強い否定表現です。落ち着いた言い回しに変えましょう。",
};

const GOOD_PHRASE_COMMENTS: Record<string, string> = {
  次回から: "再発防止の姿勢が伝わります。",
  確認: "確認を促す点は良いです。",
  相談: "相談を促す点は良いです。",
  改善: "前向きな改善姿勢が伝わります。",
  原因: "原因を確認する姿勢は良いです。",
  対策: "対策を示す点は良いです。",
  チェックリスト: "再発防止の仕組みとして良いです。",
  再発防止: "再発防止を意識できています。",
  困ったら: "相談しやすい雰囲気を作れています。",
  早めに: "早めの相談を促す点は良いです。",
  一緒に: "支援の姿勢が伝わります。",
  共有: "情報共有の意識が良いです。",
  振り返り: "振り返りを促す点は良いです。",
  具体的に: "具体性を意識できています。",
  しましょう: "一緒に改善する姿勢として良いです。",
  してください: "丁寧な依頼表現として良いです。",
};

type PhraseHit = {
  index: number;
  phrase: string;
  kind: "risk" | "good" | "imperative";
};

function findPhraseHits(text: string, phrases: string[], kind: PhraseHit["kind"]): PhraseHit[] {
  const hits: PhraseHit[] = [];

  for (const phrase of phrases) {
    let start = 0;
    while (start < text.length) {
      const index = text.indexOf(phrase, start);
      if (index === -1) break;
      hits.push({ index, phrase, kind });
      start = index + phrase.length;
    }
  }

  return hits;
}

function findImperativeHits(text: string): PhraseHit[] {
  const hits: PhraseHit[] = [];
  const regex = /[\u3040-\u9fff\u30a0-\u30ff]{1,14}しろ/g;

  for (const match of text.matchAll(regex)) {
    if (!match[0] || match.index === undefined) continue;
    if (match[0].includes("ふざけ")) continue;
    hits.push({ index: match.index, phrase: match[0], kind: "imperative" });
  }

  return hits;
}

function dedupeHits(hits: PhraseHit[]): PhraseHit[] {
  const sorted = [...hits].sort((a, b) => a.index - b.index || b.phrase.length - a.phrase.length);
  const used: PhraseHit[] = [];

  for (const hit of sorted) {
    const overlaps = used.some(
      (existing) =>
        hit.index >= existing.index &&
        hit.index < existing.index + existing.phrase.length
    );
    if (!overlaps) {
      used.push(hit);
    }
  }

  return used.sort((a, b) => a.index - b.index);
}

function formatPhraseLine(phrase: string, comment: string): string {
  return `「${phrase}」→ ${comment}`;
}

function buildSummaryLines(result: EvaluationResult): string[] {
  const lines: string[] = [];
  const threshold = EVALUATOR_PARAMS.insufficientThreshold;

  if (result.status === "labor_consultation") {
    lines.push("【総評】ハラスメントに該当しうる表現が含まれています。業務上の問題点と改善策に絞って伝えましょう。");
    return lines;
  }

  if (result.problemClarityScore < threshold) {
    lines.push("【総評】今回のミス内容や、チーム・顧客への影響、次に取るべき行動の説明が不足しています。");
  } else if (result.status === "clear") {
    lines.push("【総評】問題点と次の改善行動が伝わっています。");
  }

  if (result.dialogueScore < threshold && result.status !== "clear") {
    lines.push("原因や経緯を確認する質問があると、より良い指導になります。");
  }

  return lines;
}

/** 指導文を参照した AI ANALYSIS テキストを生成 */
export function buildGuidanceAnalysisFeedback(
  inputText: string,
  result: EvaluationResult
): string {
  const text = inputText.trim();
  if (!text) {
    return result.feedback;
  }

  const lines: string[] = [];

  const riskHits = findPhraseHits(text, result.matchedRiskWords, "risk");
  const goodHits = findPhraseHits(
    text,
    result.matchedGoodWords.filter((word) => !result.matchedRiskWords.includes(word)),
    "good"
  );
  const imperativeHits = findImperativeHits(text);

  const allHits = dedupeHits([...riskHits, ...imperativeHits, ...goodHits]);

  for (const hit of allHits) {
    if (hit.kind === "risk") {
      const comment = RISK_PHRASE_COMMENTS[hit.phrase] ?? "この言い方は良くないです。";
      lines.push(formatPhraseLine(hit.phrase, comment));
      continue;
    }

    if (hit.kind === "imperative") {
      lines.push(
        formatPhraseLine(
          hit.phrase,
          "命令口調が強すぎます。「〜してください」と伝えましょう。"
        )
      );
      continue;
    }

    const comment = GOOD_PHRASE_COMMENTS[hit.phrase] ?? "良い表現です。";
    lines.push(formatPhraseLine(hit.phrase, comment));
  }

  if (lines.length === 0) {
    if (result.matchedRiskWords.length === 0 && result.matchedGoodWords.length === 0) {
      lines.push(`「${text.length > 28 ? `${text.slice(0, 28)}…` : text}」`);
    }
  }

  lines.push(...buildSummaryLines(result));

  if (lines.length === 0) {
    return result.feedback;
  }

  return lines.join("\n");
}
