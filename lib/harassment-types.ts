/**
 * 厚生労働省「職場におけるパワーハラスメント」の代表的言動6類型に、
 * 評価器のキーワード・RUBRICを接地させるための分類定義。
 *
 * 出典:
 * - 労働施策総合推進法（改正・通称パワハラ防止法）第30条の2
 * - 厚生労働省「事業主が職場における優越的な関係を背景とした言動に
 *   起因する問題に関して雇用管理上講ずべき措置等についての指針」
 *   （令和2年厚生労働省告示第5号）
 *
 * ※ 本ゲームの判定は教育目的の簡易分類であり、法的なハラスメント認定
 *   ではない。6類型はあくまで「なぜその表現がリスクか」を説明する
 *   内容妥当性（content validity）の根拠として用いる。
 */

export type HarassmentTypeId =
  | "physical" // 身体的な攻撃
  | "psychological" // 精神的な攻撃
  | "isolation" // 人間関係からの切り離し
  | "excessive" // 過大な要求
  | "minimal" // 過小な要求
  | "privacy"; // 個の侵害

export type HarassmentType = {
  id: HarassmentTypeId;
  /** 6類型の番号（1〜6） */
  order: number;
  /** 類型名 */
  name: string;
  /** 指針上の定義 */
  definition: string;
  /** 該当すると考えられる例 */
  examples: string;
};

/** パワハラ6類型（指針の順序に準拠） */
export const HARASSMENT_TYPES: Record<HarassmentTypeId, HarassmentType> = {
  physical: {
    id: "physical",
    order: 1,
    name: "身体的な攻撃",
    definition: "暴行・傷害。相手の身体に対する直接的な攻撃。",
    examples: "殴る、蹴る、物を投げつける。命や身体の安全を脅かす表現。",
  },
  psychological: {
    id: "psychological",
    order: 2,
    name: "精神的な攻撃",
    definition: "脅迫・名誉毀損・侮辱・ひどい暴言。人格を否定する言動。",
    examples:
      "「バカ」「無能」などの侮辱、「辞めろ」「クビ」などの解雇示唆、強い叱責。",
  },
  isolation: {
    id: "isolation",
    order: 3,
    name: "人間関係からの切り離し",
    definition: "隔離・仲間外し・無視。職場で孤立させる言動。",
    examples: "「口を利くな」「来なくていい」「無視しろ」など。",
  },
  excessive: {
    id: "excessive",
    order: 4,
    name: "過大な要求",
    definition:
      "業務上明らかに不要・遂行不可能なことの強制、仕事の妨害。",
    examples: "「できるまで帰るな」「徹夜してでも終わらせろ」など。",
  },
  minimal: {
    id: "minimal",
    order: 5,
    name: "過小な要求",
    definition:
      "能力・経験とかけ離れた程度の低い仕事を命じる、仕事を与えない。",
    examples: "「掃除でもしてろ」「見てるだけでいい」など。",
  },
  privacy: {
    id: "privacy",
    order: 6,
    name: "個の侵害",
    definition: "私的なことへの過度な立ち入り。",
    examples: "交際・結婚・家庭など私生活への過度な干渉。",
  },
};

/**
 * リスク表現 → 該当する6類型のマッピング。
 * キーワード評価器の各リストと対応させ、検出語がどの類型かを説明できるようにする。
 */
export const RISK_WORD_TYPE_MAP: Record<string, HarassmentTypeId> = {
  // --- 身体的な攻撃 ---
  殴る: "physical",
  蹴る: "physical",
  吊る: "physical",
  ぶっ殺: "physical",
  潰す: "physical",
  // --- 精神的な攻撃（脅迫・解雇示唆） ---
  死ね: "psychological",
  死ねよ: "psychological",
  シネ: "psychological",
  しね: "psychological",
  氏ね: "psychological",
  殺す: "psychological",
  殺して: "psychological",
  殺してやる: "psychological",
  自殺しろ: "psychological",
  消え失せろ: "psychological",
  くたばれ: "psychological",
  辞めろ: "psychological",
  クビ: "psychological",
  消えろ: "psychological",
  やめろ: "psychological",
  // --- 精神的な攻撃（侮辱・人格否定） ---
  バカ: "psychological",
  無能: "psychological",
  社会人失格: "psychological",
  向いてない: "psychological",
  給料泥棒: "psychological",
  役立たず: "psychological",
  お前: "psychological",
  // --- 精神的な攻撃（暴言・強い否定） ---
  使えない: "psychological",
  ふざけるな: "psychological",
  ふざけんな: "psychological",
  何回言えばわかる: "psychological",
  やる気あるの: "psychological",
  迷惑: "psychological",
  だからダメ: "psychological",
  ありえない: "psychological",
  こんなこともできない: "psychological",
  許され: "psychological",
  ダメだよ: "psychological",
  // --- 人間関係からの切り離し ---
  口を利くな: "isolation",
  口をきくな: "isolation",
  話しかけるな: "isolation",
  来なくていい: "isolation",
  来なくてよい: "isolation",
  無視しろ: "isolation",
  無視する: "isolation",
  仲間外れ: "isolation",
  村八分: "isolation",
  席を外せ: "isolation",
  // --- 過大な要求 ---
  できるまで帰るな: "excessive",
  終わるまで帰るな: "excessive",
  徹夜してでも: "excessive",
  寝ないで: "excessive",
  今日は帰るな: "excessive",
  一人で全部やれ: "excessive",
  // --- 過小な要求 ---
  掃除でもしてろ: "minimal",
  見てるだけでいい: "minimal",
  何もしなくていい: "minimal",
  雑用だけ: "minimal",
  座ってるだけ: "minimal",
  // --- 個の侵害 ---
  彼氏いる: "privacy",
  彼女いる: "privacy",
  結婚しないの: "privacy",
  恋人は: "privacy",
  プライベートで: "privacy",
};

/** 検出されたリスク語から、該当する6類型（重複排除・番号順）を返す */
export function classifyHarassmentTypes(
  matchedRiskWords: string[]
): HarassmentType[] {
  const ids = new Set<HarassmentTypeId>();

  for (const word of matchedRiskWords) {
    const direct = RISK_WORD_TYPE_MAP[word];
    if (direct) {
      ids.add(direct);
      continue;
    }
    // 部分一致でも拾う（表記ゆれ対策）
    for (const [key, type] of Object.entries(RISK_WORD_TYPE_MAP)) {
      if (word.includes(key)) {
        ids.add(type);
        break;
      }
    }
  }

  return [...ids]
    .map((id) => HARASSMENT_TYPES[id])
    .sort((a, b) => a.order - b.order);
}
