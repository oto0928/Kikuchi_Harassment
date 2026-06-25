/** 評価器パラメータ（ゴールドデータセットで調整） */

export const EVALUATOR_PARAMS = {
  harassment: {
    base: 18,
    threat: 30,
    personalAttack: 25,
    strongNegative: 14,
    positiveReduction: 4,
    laborThreshold: 80,
  },
  problemClarity: {
    base: 20,
    keywordBonus: 8,
    shortTextPenalty: 20,
    shortTextLength: 20,
    contextAboutBonus: 22,
    problemStatementBonus: 12,
    severityStatementBonus: 14,
  },
  actionSpecificity: {
    base: 12,
    keywordBonus: 13,
    shortNoKeywordPenalty: 12,
    shortTextLength: 28,
  },
  dialogue: {
    base: 22,
    keywordBonus: 14,
    questionBonus: 8,
  },
  support: {
    base: 10,
    keywordBonus: 12,
  },
  insufficientThreshold: 30,
} as const;

export const THREAT_WORDS = ["辞めろ", "クビ", "消えろ"];

export const PERSONAL_ATTACK_WORDS = [
  "バカ",
  "無能",
  "社会人失格",
  "向いてない",
  "給料泥棒",
  "役立たず",
  "お前",
];

export const STRONG_NEGATIVE_WORDS = [
  "使えない",
  "ふざけるな",
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

export const ACTION_SPECIFICITY_WORDS = [
  "次回から",
  "次回",
  "してください",
  "しましょう",
  "徹底",
  "手順",
  "期限",
  "10分前",
  "15分",
  "17時",
  "30分以内",
  "24時間",
  "リマインダー",
  "ダブルチェック",
  "チェックリスト",
  "確認",
  "報告",
  "連絡",
  "設定",
  "フロー",
  "ルール",
  "以上",
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
