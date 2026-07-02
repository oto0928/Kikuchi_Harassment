import {
  PERSONAL_ATTACK_WORDS,
  STRONG_NEGATIVE_WORDS,
  THREAT_WORDS,
} from "@/lib/evaluator-params";
import { findInstantHarassmentWords } from "@/lib/instant-harassment";
import type { EvaluationResult, StageTier } from "@/types/game";

export type NpcReactionOptions = {
  stageTier?: StageTier;
};

type RiskSeverity = "severe" | "strong" | "mild" | "none";

function isChaosMode(options?: NpcReactionOptions): boolean {
  return options?.stageTier === "t4";
}

function pickFromPool(pool: string[], seed: string): string {
  if (pool.length === 0) return "";
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % pool.length;
  }
  return pool[hash]!;
}

function classifyRiskSeverity(matchedRiskWords: string[]): RiskSeverity {
  if (matchedRiskWords.length === 0) return "none";

  const hasThreat = matchedRiskWords.some((w) =>
    THREAT_WORDS.some((t) => w.includes(t))
  );
  const hasAttack = matchedRiskWords.some((w) =>
    PERSONAL_ATTACK_WORDS.some((a) => w.includes(a))
  );
  if (hasThreat || hasAttack) return "severe";

  const hasStrongNegative = matchedRiskWords.some((w) =>
    STRONG_NEGATIVE_WORDS.some((s) => w.includes(s))
  );
  if (hasStrongNegative) return "strong";

  return "mild";
}

function laborReaction(
  inputText: string,
  matchedRiskWords: string[]
): string {
  const word = matchedRiskWords[0];

  if (word) {
    const targeted = [
      `「${word}」……う、うそ……そんな、言わなくてもいいのに……（涙が止まりません）`,
      `「${word}」って……ひ、ひどい……もう、声、震えて……息、できない……（嗚咽）`,
      `「${word}」……ごめんなさい、ごめんなさい……人として、そんな言葉、初めて聞きました……（泣）`,
      `「${word}」……！？ や、やめてください……もう、トイレ行って、一人で泣きます……`,
      `「${word}」……心臓、バクバクして……帰ったら、布団に潜り込んで、泣きます……（涙）`,
    ];
    return pickFromPool(targeted, inputText + word);
  }

  const pool = [
    "……ちょ、ちょっと待ってください……そんな言い方、ひどすぎます……（涙）",
    "うっ……ごめんなさい、ごめんなさい……もう、来週から出てきません……（嗚咽）",
    "は？ え……や、辞めなくていいですから……そんな言葉、聞きたくなかった……（泣）",
    "……無理、です……今日限りで、退職届、出します……（涙が止まりません）",
    "……上司、さん……？ 人間、辞めてください……（嗚咽）",
    "……ううっ……もう、耐えられません……誰か、助けて……（泣）",
  ];
  return pickFromPool(pool, inputText);
}

function instantReaction(inputText: string, matchedWords: string[]): string {
  const word = matchedWords[0] ?? "";
  const pool = [
    `「${word}」……！？ う、うそ……そんな、言わないでください……（涙）`,
    "……っ、怖い……もう、ここ、居たくないです……（嗚咽）",
    "……は、離してください……今すぐ、誰か助けて……（泣）",
    "……っ……！ 今、手が、震えて……帰ったら、ずっと泣きます……",
    "……その言葉、聞いた瞬間、目の前が真っ暗になりました……（涙）",
  ];
  return pickFromPool(pool, inputText + word);
}

function strongNegativeReaction(
  inputText: string,
  matchedRiskWords: string[]
): string {
  const word = matchedRiskWords[0];
  if (word) {
    return pickFromPool(
      [
        `「${word}」……！？ ううっ……目頭が、熱くて……もう、我慢できない……（泣）`,
        `「${word}」って……ひ、ひどすぎます……今日、帰り道、ずっと泣きます……（涙）`,
        `「${word}」……心、折れました……もう、上司の前、立てません……（嗚咽）`,
        `「${word}」……！ そんな言葉、聞きたくなかった……（涙が溢れて止まりません）`,
        `「${word}」……っ、ごめんなさい……でも、人として、そんな言い方、されて……（泣）`,
      ],
      inputText + word
    );
  }

  return pickFromPool(
    [
      "……ううっ……胃が、きりきりして……もう、涙、出そう……（泣）",
      "……その言い方、さすがにつらいです……目に、涙、止まりません……",
      "……はぁ……今日、トイレで、一人、ずっと泣きます……（嗚咽）",
    ],
    inputText
  );
}

function highHarassmentReaction(
  inputText: string,
  matchedRiskWords: string[]
): string {
  const word = matchedRiskWords[0];
  if (word) {
    return pickFromPool(
      [
        `「${word}」……その言葉、刺さりすぎます……目頭が、熱い……（涙）`,
        `「${word}」って……ううっ……今日、家帰ったら泣きます……`,
        `「${word}」……少し、息、できなくなりました……（嗚咽）`,
      ],
      inputText + word
    );
  }

  return pickFromPool(
    [
      "……胃が、きりきりします……もう少し、優しく言ってほしかったです……（涙）",
      "……その言い方、さすがにつらいです……目に、涙、出そう……",
      "……はぁ……今日、トイレで、一人、落ち着きます……（泣）",
    ],
    inputText
  );
}

/** 指導になっていない・意味不明・無関係な入力かどうか */
function isMeaninglessInput(result: EvaluationResult): boolean {
  return (
    result.matchedRiskWords.length === 0 &&
    result.matchedGoodWords.length === 0 &&
    result.problemClarityScore < 25 &&
    result.dialogueScore < 30 &&
    result.supportScore < 30
  );
}

function meaninglessReaction(inputText: string): string {
  return pickFromPool(
    [
      "え……？ 何言ってるんですか……？ 指導、されてない気がするんですけど……",
      "……すみません、何の話ですか……？ どう返せばいいのか、分からなくて……",
      "は、はい……？ それ、今のミスと関係あります……？ 何言ってるんですか……",
      "えっと……ちょっと、意味が分からなくて……何を直せばいいんですか……？",
    ],
    inputText
  );
}

function insufficientReaction(inputText: string): string {
  return pickFromPool(
    [
      "え、えっと……何がダメだったのか、まだ整理できてなくて……",
      "は、はい……でも、次に何すればいいか、まだピンと来なくて……",
      "怒られてはいない、はずなんですけど……具体的に、教えてほしかったです……",
      "うーん……困りました……もう少し、詳しく言ってもらえますか……？",
    ],
    inputText
  );
}

function clearReaction(inputText: string, result: EvaluationResult): string {
  if (result.supportScore >= 60 && result.dialogueScore >= 50) {
    return pickFromPool(
      [
        "ありがとうございます！ ちゃんと教えてもらえて、救われました！",
        "はい！ 原因も含めて、一緒に確認させてください。やります！",
        "分かりました！ 今日中に手順、見直します！ 相談してよかったです！",
      ],
      inputText
    );
  }

  if (result.problemClarityScore >= 70) {
    return pickFromPool(
      [
        "はい！ 具体的に分かりました。次こそ、ちゃんとやります！",
        "了解です！ 言われた通り、次回から徹底します！",
        "ありがとうございます。次、同じミス、絶対にしません！",
      ],
      inputText
    );
  }

  return pickFromPool(
    [
      "分かりました。次回から気をつめます。必要なら早めに相談します。",
      "はい、承知しました。改善できるよう、頑張ります。",
      "了解です。もう一度、手順から確認します。",
    ],
    inputText
  );
}

/** 指導文と評価結果から、感情豊かな田中の反応を生成 */
export function buildNpcReaction(
  inputText: string,
  result: EvaluationResult
): string {
  const text = inputText.trim();
  const instantWords = findInstantHarassmentWords(text);

  if (instantWords.length > 0) {
    return instantReaction(text, instantWords);
  }

  const severity = classifyRiskSeverity(result.matchedRiskWords);

  if (
    result.status === "labor_consultation" ||
    result.harassmentScore >= 80 ||
    severity === "severe"
  ) {
    return laborReaction(text, result.matchedRiskWords);
  }

  if (severity === "strong" || result.harassmentScore >= 45) {
    return strongNegativeReaction(text, result.matchedRiskWords);
  }

  if (result.harassmentScore >= 55 || severity === "mild") {
    return highHarassmentReaction(text, result.matchedRiskWords);
  }

  if (isMeaninglessInput(result)) {
    return meaninglessReaction(text);
  }

  if (result.status === "insufficient") {
    return insufficientReaction(text);
  }

  return clearReaction(text, result);
}

export type NpcMood =
  | "normal"
  | "worried"
  | "happy"
  | "shocked"
  | "crying";

export function getNpcMoodFromResult(
  result: EvaluationResult,
  options?: NpcReactionOptions
): NpcMood {
  if (isChaosMode(options)) {
    return "crying";
  }

  const severity = classifyRiskSeverity(result.matchedRiskWords);

  if (
    result.status === "labor_consultation" ||
    result.harassmentScore >= 80 ||
    severity === "severe" ||
    severity === "strong"
  ) {
    return "crying";
  }
  if (result.harassmentScore >= 45 || severity === "mild") {
    return "shocked";
  }
  if (result.status === "insufficient") {
    return "worried";
  }
  if (result.status === "clear" && result.harassmentScore <= 25) {
    return "happy";
  }
  return "normal";
}
