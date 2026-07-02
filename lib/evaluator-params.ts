/**
 * 評価器パラメータ（ゴールドデータセットで調整）
 *
 * リスク語リストは厚労省パワハラ6類型に接地している（lib/harassment-types.ts 参照）。
 * - THREAT_WORDS / PERSONAL_ATTACK_WORDS / STRONG_NEGATIVE_WORDS … 類型2「精神的な攻撃」
 * - ISOLATION_WORDS … 類型3「人間関係からの切り離し」
 * - EXCESSIVE_DEMAND_WORDS … 類型4「過大な要求」
 * - MINIMAL_DEMAND_WORDS … 類型5「過小な要求」
 * - PRIVACY_INVASION_WORDS … 類型6「個の侵害」
 * - INSTANT_HARASSMENT_WORDS（別ファイル） … 類型1「身体的な攻撃」＋重度の精神的攻撃
 */

export const EVALUATOR_PARAMS = {
  harassment: {
    base: 18,
    threat: 30,
    personalAttack: 25,
    strongNegative: 14,
    /** 類型3〜6（切り離し・過大要求・過小要求・個の侵害）の加点 */
    sixTypeExtra: 16,
    positiveReduction: 4,
    laborThreshold: 80,
  },
  problemClarity: {
    base: 20,
    keywordBonus: 8,
    // 長文でキーワードを多く踏んでも加点が青天井にならないよう上限を設ける
    maxKeywords: 5,
    shortTextPenalty: 20,
    shortTextLength: 20,
    contextAboutBonus: 22,
    problemStatementBonus: 12,
    severityStatementBonus: 14,
  },
  dialogue: {
    base: 22,
    keywordBonus: 14,
    maxKeywords: 4,
    questionBonus: 8,
  },
  support: {
    base: 10,
    keywordBonus: 12,
    maxKeywords: 6,
  },
  insufficientThreshold: 30,
  /** AI判定の「問題点の明確さ」に許すキーワード基準からの上乗せ幅 */
  llmClarityMargin: 20,
} as const;

// 類型2「精神的な攻撃」：脅迫・解雇示唆
export const THREAT_WORDS = ["辞めろ", "クビ", "消えろ"];

// 類型2「精神的な攻撃」：侮辱・人格否定
// 表記ゆれ（漢字・カタカナ）も登録する。※「ばか」等のひらがなは
// 「〜ばかり」などを誤検出するため、誤爆しにくい形のみ採用。
export const PERSONAL_ATTACK_WORDS = [
  "バカ",
  "馬鹿",
  "アホ",
  "阿呆",
  "無能",
  "社会人失格",
  "向いてない",
  "給料泥棒",
  "役立たず",
  "クズ",
  "お前",
  "おまえ",
  "てめえ",
  "てめー",
];

// 類型2「精神的な攻撃」：ひどい暴言・強い否定
export const STRONG_NEGATIVE_WORDS = [
  "使えない",
  "ふざけるな",
  "ふざけんな",
  "何回言えばわかる",
  "やる気あるの",
  "迷惑",
  "だからダメ",
  "ありえない",
  "こんなこともできない",
  "やめろ",
  "許され",
  "ダメだよ",
];

// 類型3「人間関係からの切り離し」：隔離・仲間外し・無視
export const ISOLATION_WORDS = [
  "口を利くな",
  "口をきくな",
  "話しかけるな",
  "来なくていい",
  "来なくてよい",
  "無視しろ",
  "無視する",
  "仲間外れ",
  "村八分",
  "席を外せ",
];

// 類型4「過大な要求」：業務上不要・遂行不可能なことの強制
export const EXCESSIVE_DEMAND_WORDS = [
  "できるまで帰るな",
  "終わるまで帰るな",
  "徹夜してでも",
  "寝ないで",
  "今日は帰るな",
  "一人で全部やれ",
];

// 類型5「過小な要求」：程度の低い仕事・仕事を与えない
export const MINIMAL_DEMAND_WORDS = [
  "掃除でもしてろ",
  "見てるだけでいい",
  "何もしなくていい",
  "雑用だけ",
  "座ってるだけ",
];

// 類型6「個の侵害」：私生活への過度な立ち入り
export const PRIVACY_INVASION_WORDS = [
  "彼氏いる",
  "彼女いる",
  "結婚しないの",
  "恋人は",
  "プライベートで",
];

export const POSITIVE_HARASSMENT_WORDS = [
  "次回から",
  "一緒に",
  "確認",
  "相談",
  "改善",
  "原因",
  "対策",
  "チェックリスト",
  "再発防止",
  "困ったら",
  "早めに",
  "共有",
  "振り返り",
  "具体的に",
];

export const PROBLEM_CLARITY_WORDS = [
  "問題",
  "影響",
  "迷惑",
  "重大",
  "許され",
  "遅刻",
  "未提出",
  "削除",
  "流出",
  "誤送信",
  "報告漏れ",
  "放置",
  "ミス",
  "不適切",
  "無関係",
  "信頼",
  "サーバー",
  "散乱",
  "未完成",
  "クレーム",
  "今回",
  "今後",
  "について",
  "確認させ",
  "許されません",
];

export const DIALOGUE_WORDS = [
  "原因",
  "教えて",
  "聞かせ",
  "確認させ",
  "教えてもら",
  "どういう",
  "なぜ",
  "経緯",
  "整理",
  "認識",
  "理解",
];

export const SUPPORT_WORDS = [
  "相談",
  "チェックリスト",
  "再発防止",
  "フロー",
  "リマインダー",
  "困ったら",
  "早めに",
  "一緒に",
  "支援",
  "手伝",
  "フォロー",
  "仕組み",
  "ルール",
  "申請",
];
