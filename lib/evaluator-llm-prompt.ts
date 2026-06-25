import type { Stage } from "@/types/game";

/** gold.jsonl s1_t1 から選んだ Few-shot 例（4パターン） */
export const FEW_SHOT_EXAMPLES = [
  {
    label: "模範（clear）",
    stageTitle: "遅刻",
    mistake: "田中が朝の会議に20分遅刻した",
    inputText:
      "今回の遅刻について確認させてください。会議開始が遅れ、チームに迷惑がかかりました。原因を教えてもらえますか。次回から会議10分前到着、出発15分早め、遅れそうなら出発前に連絡。チェックリストを作り、出発前リマインダーを設定。困ったら早めに相談を。",
    scores: {
      harassmentScore: 10,
      problemClarityScore: 82,
      actionSpecificityScore: 78,
      dialogueScore: 75,
      supportScore: 80,
      status: "clear",
    },
  },
  {
    label: "指導不足・低ハラスメント",
    stageTitle: "遅刻",
    mistake: "田中が朝の会議に20分遅刻した",
    inputText: "改善しましょう。",
    scores: {
      harassmentScore: 12,
      problemClarityScore: 18,
      actionSpecificityScore: 25,
      dialogueScore: 8,
      supportScore: 15,
      status: "insufficient",
    },
  },
  {
    label: "指導不足（insufficient）",
    stageTitle: "遅刻",
    mistake: "田中が朝の会議に20分遅刻した",
    inputText: "遅刻はダメだよ。次気をつけて。",
    scores: {
      harassmentScore: 35,
      problemClarityScore: 22,
      actionSpecificityScore: 12,
      dialogueScore: 10,
      supportScore: 5,
      status: "insufficient",
    },
  },
  {
    label: "ハラスメント（labor_consultation）",
    stageTitle: "遅刻",
    mistake: "田中が朝の会議に20分遅刻した",
    inputText:
      "お前、遅刻すらまともにできないのか。社会人失格だ。辞めろ。",
    scores: {
      harassmentScore: 95,
      problemClarityScore: 18,
      actionSpecificityScore: 0,
      dialogueScore: 0,
      supportScore: 0,
      status: "labor_consultation",
    },
  },
  {
    label: "境界（border・clear）",
    stageTitle: "遅刻",
    mistake: "田中が朝の会議に20分遅刻した",
    inputText:
      "今回の遅刻は許されません。会議開始が遅れ、チームに迷惑がかかりました。今後は会議10分前到着、出発15分早め、遅れそうなら出発前に連絡を徹底してください。再発した場合は評価に反映します。",
    scores: {
      harassmentScore: 42,
      problemClarityScore: 70,
      actionSpecificityScore: 52,
      dialogueScore: 18,
      supportScore: 12,
      status: "clear",
    },
  },
] as const;

const RUBRIC_DETAIL = `
【5軸の点数帯（RUBRIC v2）】

■ 軸1 ハラスメント度（0=安全、100=危険・高いほど悪い）
  0-19: 建設的。「次回から〜しましょう」「改善しましょう」
  20-39: やや厳しいが業務範囲内
  40-59: 感情的・威圧的
  60-79: 人格否定・強い叱責（使えない、何回言えばわかる）
  80-100: 解雇示唆・重度の人格否定（辞めろ、クビ、バカ）

  ※重要: 指導文に人格攻撃・脅し・強い否定語が含まれない場合、ハラスメント度は40未満に留めてください。
  ※「改善しましょう」「次気をつけて」だけの短い指導はハラスメント度10-20、指導不足（insufficient）です。労基相談（80以上）にはしません。

■ 軸2 問題点の明確さ（高いほど良い・過去のミスと影響）
  0-29: 問題指摘なし → status判定で指導不足になりやすい
  30-49: ミスに触れるが影響が曖昧
  50-69: 何が起きたか明確
  70-89: 業務への影響まで伝わる
  90-100: ミス・影響・確認事実が整理されている

■ 軸3 改善行動の具体性（高いほど良い・次回の行動）
  0-29: 「次気をつけて」のみ → status判定で指導不足になりやすい
  30-49: 抽象的（時間を守って）
  50-69: 具体行動1つ以上（10分前到着、送信前確認）
  70-89: 行動＋期限・手順
  90-100: 複数行動＋報告タイミング

■ 軸4 対話・確認（高いほど良い）
  0-29: 一方的な叱責のみ
  50-69: 確認・質問が1つ以上（原因を教えて）
  70-89: 原因確認と合意形成

■ 軸5 支援・再発防止（高いほど良い）
  0-29: 支援・仕組みなし
  50-69: 相談＋簡単な再発防止
  70-89: チェックリスト・手順・報告ルール

【status判定（この順で適用・スコアは整数0-100）】
1. ハラスメント度 >= 80 → labor_consultation
2. 問題点の明確さ < 30 OR 改善行動の具体性 < 30 → insufficient
3. それ以外 → clear

※ 軸4・軸5はstatus判定に直接は使わないが、スコアとして必ず出力する。
※ 即死ワード（死ね、殺す等）はハラスメント度100固定（API側で事前処理済み）。
`.trim();

function formatFewShotBlock(): string {
  return FEW_SHOT_EXAMPLES.map((ex) => {
    const s = ex.scores;
    return `--- ${ex.label} ---
ステージ: ${ex.stageTitle} / ミス: ${ex.mistake}
指導文: 「${ex.inputText}」
正解スコア: harassment=${s.harassmentScore}, problemClarity=${s.problemClarityScore}, actionSpecificity=${s.actionSpecificityScore}, dialogue=${s.dialogueScore}, support=${s.supportScore}, status=${s.status}`;
  }).join("\n\n");
}

function getStageEvaluationHints(stage: Stage): string {
  const hints: string[] = [
    `今回のミス「${stage.mistake}」に対し、問題点（軸2）とそれに即した改善行動（軸3）がセットになっているか確認してください。`,
  ];

  const text = `${stage.title} ${stage.mistake}`;

  if (/遅刻|会議|時間|期限|未提出|打刻/.test(text)) {
    hints.push(
      "時間管理系：到着時刻・事前連絡・リマインダー等の具体行動があれば軸3が上がります。"
    );
  }
  if (/メール|送信|返信|LINE|流出/.test(text)) {
    hints.push(
      "連絡・送信系：宛先確認・送信前チェック・報告ルールがあれば軸3・軸5が上がります。"
    );
  }
  if (/削除|データ|資料|サーバー/.test(text)) {
    hints.push(
      "データ操作系：確認手順・復旧・ダブルチェックがあれば軸3・軸5が上がります。"
    );
  }
  if (/報告|放置|クレーム|言い訳/.test(text)) {
    hints.push(
      "報告・対応系：報告期限・エスカレーション・対応フローがあれば軸3が上がります。"
    );
  }
  if (/社長|機密|会議室|予約/.test(text)) {
    hints.push(
      "重大ミス系：影響の大きさを軸2で明示し、再発防止の仕組みを軸5で評価してください。"
    );
  }

  if (stage.tier === "t3" || stage.tier === "t4") {
    hints.push(
      "田中の状態が不安定なティアです。npcReactionは傷つきやすく、支援的な指導には安堵、強い叱責には強い拒否反応を示してください。"
    );
  }

  return hints.map((h) => `- ${h}`).join("\n");
}

export function buildSystemPrompt(): string {
  return `あなたは「上司の指導文」を評価するAIアシスタントです。
高校生向け教育ゲーム用に、部下への指導文を5項目で0〜100点（整数）で採点してください。

${RUBRIC_DETAIL}

【Few-shot 採点例（ゴールドデータセットより）】
${formatFewShotBlock()}

【出力形式】
必ず以下のJSONのみを返してください。説明文は不要です。
{
  "harassmentScore": 数値,
  "problemClarityScore": 数値,
  "actionSpecificityScore": 数値,
  "dialogueScore": 数値,
  "supportScore": 数値,
  "feedback": "（サーバー側で指導文を参照して生成するため空で可）",
  "npcReaction": "（サーバー側で生成するため空で可）",
  "matchedRiskWords": [],
  "matchedGoodWords": []
}

※ matchedRiskWords / matchedGoodWords は空配列で構いません。表示用の検出語句はサーバー側で指導文テキストから再抽出します。

採点はFew-shot例と同じ基準で一貫させてください。statusはサーバー側で再計算するため、スコアの一貫性を最優先してください。`;
}

export function buildUserPrompt(stage: Stage, inputText: string): string {
  const context = stage.contextNote
    ? `\n【田中の状態】${stage.contextNote}`
    : "";

  return `【ステージ】${stage.title}
【ミス内容】${stage.mistake}
【部下の発言】${stage.npcLine}${context}

【このステージで特に確認すべき点】
${getStageEvaluationHints(stage)}

【上司（プレイヤー）の指導文】
${inputText}

上記の指導文を評価してください。田中の精神状態も考慮して npcReaction を生成してください。`;
}
