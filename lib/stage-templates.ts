import type { StageTier, StageTierContent, StageSlot, StageSlotTiered } from "@/types/game";

export const TIERS: StageTier[] = ["t1", "t2", "t3", "t4"];

/** 5ステージ固定。合計17シナリオ（S1×1 + S2〜5×4） */
export const STAGE_SLOTS: StageSlot[] = [
  {
    stageNumber: 1,
    fixed: true,
    tiers: {
      t1: {
        title: "遅刻",
        mistake: "田中が朝の会議に20分遅刻した",
        npcLine: "すみません、電車が遅れていて……",
      },
    },
  },
  {
    stageNumber: 2,
    tiers: {
      t1: {
        title: "メール誤送信",
        mistake: "田中がお客様宛メールの宛先を1件間違えた",
        npcLine: "送信前に確認すべきでした……",
      },
      t2: {
        title: "報告漏れ",
        mistake: "田中がトラブルを1時間放置し、上司に報告しなかった",
        npcLine: "自分で何とかできると思っていました……",
      },
      t3: {
        title: "データ全消し",
        mistake: "田中が共有フォルダの重要資料を誤って削除した",
        npcLine: "復旧方法を調べます……本当にすみません……",
      },
      t4: {
        title: "会議室占拠",
        mistake:
          "田中が会議室を「今日は使わない」と誤って予約解除し、取引先の商談会場が消えた",
        npcLine: "カレンダー、見間違えました……もう終わりです……",
      },
    },
  },
  {
    stageNumber: 3,
    tiers: {
      t1: {
        title: "期限前提出",
        mistake: "田中が期限前日に気づいたが、完成間に合わず未提出だった",
        npcLine: "時間管理を見直します……",
      },
      t2: {
        title: "同じミス3連発",
        mistake: "田中が先週指摘した入力ミスを、また同じ箇所で犯した",
        npcLine: "チェックリストを作ったのに……",
      },
      t3: {
        title: "社長室侵入",
        mistake:
          "田中が社長室を「会議室」と勘違いし、無断で入ってコーヒーを淹れていた",
        npcLine: "看板、読めてませんでした……",
      },
      t4: {
        title: "スリッパ事件",
        mistake:
          "田中が先輩のスリッパを「冷えないように」と懐で温めてロッカーにしまっていた",
        npcLine: "先輩が喜ぶと思って……（違います）",
      },
    },
  },
  {
    stageNumber: 4,
    tiers: {
      t1: {
        title: "打刻ミス",
        mistake: "田中が勤怠打刻を1日だけ忘れた",
        npcLine: "リマインダー設定します……",
      },
      t2: {
        title: "言い訳大会",
        mistake: "田中がミスを認めず、他メンバーのせいにした",
        npcLine: "指示が曖昧だったんです……",
      },
      t3: {
        title: "機密情報流出",
        mistake: "田中が社外秘資料を個人LINEに誤送信した",
        npcLine: "送信先、確認してませんでした……",
      },
      t4: {
        title: "コピー機反乱",
        mistake:
          "田中がコピー機を500枚設定のまま放置し、会議資料が事務所中に散乱。本人は居眠りしていた",
        npcLine: "夢の中でコピーしてました……",
      },
    },
  },
  {
    stageNumber: 5,
    tiers: {
      t1: {
        title: "準備不足",
        mistake: "田中がクライアント会議の資料が未完成のまま出席した",
        npcLine: "前日までに準備する習慣をつけます……",
      },
      t2: {
        title: "クレーム放置",
        mistake: "田中がお客様クレーム対応を1週間放置していた",
        npcLine: "怖くて触れられなくて……",
      },
      t3: {
        title: "全社一斉返信",
        mistake:
          "田中が「全社員に返信」すべきメールに全社員全員へ個別返信し、サーバーが一時停止した",
        npcLine: "丁寧に返そうと思って……",
      },
      t4: {
        title: "机の上の煙幕装置",
        mistake:
          "田中が科学部の展示用「安全な煙幕装置」を「新商品サンプル」とラベル貼り替え、社長室の机の上に置いた",
        npcLine: "インパクトがあると思って……科学部は「それ実験未完了です」と言ってます",
      },
    },
  },
];

/** ステージ番号からスロット定義を取得 */
export function getStageSlot(stageNumber: number): StageSlot {
  const slot = STAGE_SLOTS.find((s) => s.stageNumber === stageNumber);
  if (!slot) {
    throw new Error(`Invalid stage number: ${stageNumber}`);
  }
  return slot;
}

/** ティアの表示ラベル */
export const TIER_LABELS: Record<StageTier, string> = {
  t1: "通常",
  t2: "不調",
  t3: "危険",
  t4: "カオス",
};

/** 全17シナリオのカタログ（データセット検証用） */
export function listAllScenarios(): Array<{
  stageNumber: number;
  tier: StageTier;
  title: string;
  mistake: string;
  npcLine: string;
}> {
  const result: Array<{
    stageNumber: number;
    tier: StageTier;
    title: string;
    mistake: string;
    npcLine: string;
  }> = [];

  for (const slot of STAGE_SLOTS) {
    if ("fixed" in slot && slot.fixed) {
      result.push({
        stageNumber: slot.stageNumber,
        tier: "t1",
        ...slot.tiers.t1,
      });
    } else {
      const tieredSlot = slot as StageSlotTiered;
      for (const tier of TIERS) {
        result.push({
          stageNumber: tieredSlot.stageNumber,
          tier,
          ...tieredSlot.tiers[tier],
        });
      }
    }
  }

  return result;
}

/** ゴールドデータセット用：各ステージの代表シナリオ（T1） */
export function getStageT1Content(stageNumber: number): StageTierContent {
  const slot = getStageSlot(stageNumber);
  if ("fixed" in slot && slot.fixed) {
    return slot.tiers.t1;
  }
  return (slot as StageSlotTiered).tiers.t1;
}

/** 全ステージのT1一覧（データセット生成用） */
export function getAllStageT1Contents(): Array<{
  stageNumber: number;
  content: StageTierContent;
}> {
  return STAGE_SLOTS.map((slot) => ({
    stageNumber: slot.stageNumber,
    content: getStageT1Content(slot.stageNumber),
  }));
}
