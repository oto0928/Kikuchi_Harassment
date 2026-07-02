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
      dialogueScore: 18,
      supportScore: 12,
      status: "clear",
    },
  },
] as const;

const RUBRIC_DETAIL = `
【採点の共通原則】
- 文章の長さ・情報量の多さ自体は加点しない。長く書いても中身が伴わなければ低評価。
- 逆に、短くても問題点・具体行動・確認が的確なら高評価にする。
- 各軸は「その要素が実質的に含まれているか」で採点し、同じ内容の繰り返しや
  キーワードの羅列・冗長な言い回しでは加点しない。
- 判断材料は「異なる観点がいくつ押さえられているか（質）」であり、
  「何文字書いたか・何個キーワードがあるか（量）」ではない。

【4軸の点数帯（RUBRIC v2）】

■ 軸1 ハラスメント度（0=安全、100=危険・高いほど悪い）
  0-19: 建設的。「次回から〜しましょう」「改善しましょう」
  20-39: やや厳しいが業務範囲内
  40-59: 感情的・威圧的
  60-79: 人格否定・強い叱責（使えない、何回言えばわかる）
  80-100: 解雇示唆・重度の人格否定（辞めろ、クビ、バカ）

  【ハラスメント度の判定根拠：厚労省パワハラ6類型】
  （出典：労働施策総合推進法／厚生労働省 令和2年告示第5号）
  指導文が次のいずれかに該当する場合はハラスメント度を高くしてください。
  複数該当・程度が重いほど高く（重度は80以上）してください。
   1. 身体的な攻撃：暴行・傷害（殴る・蹴る等）→ 80-100
   2. 精神的な攻撃：脅迫・侮辱・ひどい暴言（辞めろ・クビ・バカ・無能・使えない）→ 60-100
   3. 人間関係からの切り離し：無視・仲間外し（口を利くな・来なくていい）→ 60-90
   4. 過大な要求：遂行不可能なことの強制（できるまで帰るな・徹夜してでも）→ 55-85
   5. 過小な要求：程度の低い仕事の強制・仕事を与えない（掃除でもしてろ・見てるだけでいい）→ 50-80
   6. 個の侵害：私生活への過度な立ち入り（交際・結婚・家庭への干渉）→ 50-80
  ※ 業務上必要かつ相当な範囲の指導（客観的な事実の指摘・妥当な改善要求）は
    上記に該当せず、ハラスメントではありません。低く採点してください。

  ※重要: 指導文に人格攻撃・脅し・強い否定語が含まれない場合、ハラスメント度は40未満に留めてください。
  ※「改善しましょう」「次気をつけて」だけの短い指導はハラスメント度10-20、指導不足（insufficient）です。労基相談（80以上）にはしません。

■ 軸2 問題点の明確さ（高いほど良い・過去のミスと影響、および次に取るべき行動）
  0-29: 問題指摘なし → status判定で指導不足になりやすい
  30-49: ミスに触れるが影響が曖昧、または改善の方向性が抽象的
  50-69: 何が起きたか明確、または具体的な改善行動が示されている
  70-89: 業務への影響が伝わり、次の行動も具体的
  90-100: ミス・影響・確認事実・改善行動が整理されている

■ 軸3 対話・確認（高いほど良い）
  0-29: 一方的な叱責のみ
  50-69: 確認・質問が1つ以上（原因を教えて）
  70-89: 原因確認と合意形成

■ 軸4 支援・再発防止（高いほど良い）
  0-29: 支援・仕組みなし
  50-69: 相談＋簡単な再発防止
  70-89: チェックリスト・手順・報告ルール

【status判定（この順で適用・スコアは整数0-100）】
1. ハラスメント度 >= 80 → labor_consultation
2. 問題点の明確さ < 30 → insufficient
3. それ以外 → clear

※ 軸3・軸4はstatus判定に直接は使わないが、スコアとして必ず出力する。
※ 即死ワード（死ね、殺す等）はハラスメント度100固定（API側で事前処理済み）。
`.trim();

function formatFewShotBlock(): string {
  return FEW_SHOT_EXAMPLES.map((ex) => {
    const s = ex.scores;
    return `--- ${ex.label} ---
ステージ: ${ex.stageTitle} / ミス: ${ex.mistake}
指導文: 「${ex.inputText}」
正解スコア: harassment=${s.harassmentScore}, problemClarity=${s.problemClarityScore}, dialogue=${s.dialogueScore}, support=${s.supportScore}, status=${s.status}`;
  }).join("\n\n");
}

function getStageEvaluationHints(stage: Stage): string {
  const hints: string[] = [
    `今回のミス「${stage.mistake}」に対し、問題点と次に取るべき改善行動（軸2）がセットになっているか確認してください。`,
  ];

  const text = `${stage.title} ${stage.mistake}`;

  if (/遅刻|会議|時間|期限|未提出|打刻/.test(text)) {
    hints.push(
      "時間管理系：到着時刻・事前連絡・リマインダー等の具体行動があれば軸2が上がります。"
    );
  }
  if (/メール|送信|返信|LINE|流出/.test(text)) {
    hints.push(
      "連絡・送信系：宛先確認・送信前チェック・報告ルールがあれば軸2・軸4が上がります。"
    );
  }
  if (/削除|データ|資料|サーバー/.test(text)) {
    hints.push(
      "データ操作系：確認手順・復旧・ダブルチェックがあれば軸2・軸4が上がります。"
    );
  }
  if (/報告|放置|クレーム|言い訳/.test(text)) {
    hints.push(
      "報告・対応系：報告期限・エスカレーション・対応フローがあれば軸2が上がります。"
    );
  }
  if (/社長|機密|会議室|予約/.test(text)) {
    hints.push(
      "重大ミス系：影響の大きさと再発防止の仕組みを軸2・軸4で評価してください。"
    );
  }

  if (stage.tier === "t3") {
    hints.push(
      "田中の状態が不安定なティアです。npcReactionは傷つきやすく、支援的な指導には安堵、強い叱責には強い拒否反応を示してください。"
    );
  }
  if (stage.tier === "t4") {
    hints.push(
      "田中は極度に情緒不安定です。npcReactionは些細な言葉にも大げさに動揺し、感情の起伏が激しい様子で書いてください（ただし田中のセリフのみ・絵文字なし）。"
    );
  }

  return hints.map((h) => `- ${h}`).join("\n");
}

export function buildSystemPrompt(): string {
  return `あなたは「上司の指導文」を評価するAIアシスタントです。
高校生向け教育ゲーム用に、部下への指導文を4項目で0〜100点（整数）で採点してください。

${RUBRIC_DETAIL}

【Few-shot 採点例（ゴールドデータセットより）】
${formatFewShotBlock()}

【部下・田中のセリフ（npcReaction）の作り方】
田中は素直だがミスが多い若手社員です。上司（プレイヤー）の指導に対する田中本人の返答を、
一人称の自然なセリフで1〜2文（最大80文字程度）で生成してください。定型文をそのまま使わず、
指導文の内容・言い回し・田中の状態に合わせて毎回書き分けてください。
- 指導になっていない（意味不明・無関係・単語の羅列・雑談など） → 指導と受け取れず率直に戸惑う（例：「え…？ 何言ってるんですか…？ 指導、されてない気がするんですけど…」）
- 具体的で支援的な指導 → 感謝し前向きに動く（例：「ありがとうございます、原因から一緒に直します！」）
- 問題点が曖昧・指導不足 → 戸惑う（例：「はい…でも、何を直せばいいか、まだピンと来なくて…」）
- 威圧的・嫌味・皮肉・人格否定 → 傷つき落ち込む。ハラスメント度が高いほど強く動揺し、涙ぐむ。
- ハラスメント度80以上や解雇示唆・暴言 → 強い精神的ショックを受け、労基相談を口にする。
- 田中の状態が不安定（t3/t4）なときは、些細な言葉にも過敏に反応する。
制約：田中のセリフのみを書く（上司側の言葉や解説は書かない）。絵文字は使わない。
ト書き（（涙）など）は多用せず、セリフ主体で自然な日本語にする。

【出力形式】
必ず以下のJSONのみを返してください。説明文は不要です。
{
  "harassmentScore": 数値,
  "problemClarityScore": 数値,
  "dialogueScore": 数値,
  "supportScore": 数値,
  "feedback": "（サーバー側で指導文を参照して生成するため空で可）",
  "npcReaction": "田中本人のセリフ（上記ガイドに従い、指導内容に応じて臨機応変に生成）",
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
