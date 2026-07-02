/**
 * 選択肢式（かんたん入力）モード用の指導文パーツ。
 *
 * 文章を思いつかない人でも、カテゴリごとにパーツを選ぶだけで
 * 「問題点 → 対話 → 改善行動 → 支援」という指導の型に沿った
 * 指導文を組み立てられる。ステージ固有のミス名に依存しないよう
 * 「今回の件」など汎用的な言い回しにしている。
 */

export type ChoiceTone = "good" | "neutral" | "bad";

export type GuidanceChoiceOption = {
  id: string;
  /** ボタンに表示する短いラベル */
  label: string;
  /** 実際に指導文へ挿入される文 */
  text: string;
  /** 良い例／ふつう／NG例（色分け用） */
  tone: ChoiceTone;
};

export type GuidanceChoiceCategory = {
  id: string;
  /** カテゴリ名 */
  title: string;
  /** 補足説明 */
  hint: string;
  options: GuidanceChoiceOption[];
};

/** カテゴリは配列順に連結される（問題点→対話→改善行動→支援） */
export const GUIDANCE_CHOICE_CATEGORIES: GuidanceChoiceCategory[] = [
  {
    id: "problem",
    title: "1. 問題点を伝える",
    hint: "何が起きて、どんな影響があったかを伝えます。",
    options: [
      {
        id: "problem_good",
        label: "事実と影響を確認する",
        text: "今回のミスについて確認させてください。チームや業務に影響が出ています。",
        tone: "good",
      },
      {
        id: "problem_neutral",
        label: "問題だと伝える",
        text: "今回の件は問題だと思います。",
        tone: "neutral",
      },
      {
        id: "problem_bad",
        label: "感情的に責める（NG）",
        text: "何回言えばわかるんだ。こんなミスありえないだろう。",
        tone: "bad",
      },
    ],
  },
  {
    id: "dialogue",
    title: "2. 原因を聞く・対話する",
    hint: "一方的に叱らず、相手の話を聞きます。",
    options: [
      {
        id: "dialogue_good",
        label: "原因をたずねる",
        text: "どうしてこうなったのか、原因を教えてもらえますか？",
        tone: "good",
      },
      {
        id: "dialogue_neutral",
        label: "軽くうながす",
        text: "次は気をつけてくれれば大丈夫です。",
        tone: "neutral",
      },
      {
        id: "dialogue_bad",
        label: "話を聞かない（NG）",
        text: "言い訳は聞きたくない。やる気あるのか。",
        tone: "bad",
      },
    ],
  },
  {
    id: "action",
    title: "3. 改善行動を示す",
    hint: "次にどう行動すればよいかを具体的に伝えます。",
    options: [
      {
        id: "action_good",
        label: "具体的な手順を示す",
        text: "次回からは、作業前にチェックリストで確認し、期限の前日までに報告する手順を徹底してください。",
        tone: "good",
      },
      {
        id: "action_neutral",
        label: "抽象的に注意する",
        text: "次はしっかり気をつけてください。",
        tone: "neutral",
      },
      {
        id: "action_bad",
        label: "無理を強いる（NG）",
        text: "終わるまで帰るな。徹夜してでも終わらせろ。",
        tone: "bad",
      },
    ],
  },
  {
    id: "support",
    title: "4. サポートを添える",
    hint: "相談しやすい雰囲気と再発防止の仕組みを伝えます。",
    options: [
      {
        id: "support_good",
        label: "相談と仕組みづくり",
        text: "困ったら早めに相談してください。一緒に再発防止の仕組みを作りましょう。",
        tone: "good",
      },
      {
        id: "support_neutral",
        label: "軽く声かけ",
        text: "何かあれば声をかけてください。",
        tone: "neutral",
      },
      {
        id: "support_bad",
        label: "突き放す（NG）",
        text: "こんなの自分で何とかしろ。使えないな。",
        tone: "bad",
      },
    ],
  },
];

/** 選択状態（カテゴリID → 選択オプションID or null） */
export type GuidanceChoiceSelection = Record<string, string | null>;

/** 選択状態から指導文を組み立てる */
export function buildGuidanceFromChoices(
  selection: GuidanceChoiceSelection
): string {
  return GUIDANCE_CHOICE_CATEGORIES.map((category) => {
    const selectedId = selection[category.id];
    if (!selectedId) return "";
    const option = category.options.find((o) => o.id === selectedId);
    return option?.text ?? "";
  })
    .filter(Boolean)
    .join("");
}
