#!/usr/bin/env python3
"""
ゴールドデータセット生成

構成:
  ステージ1: T1のみ（1シナリオ）
  ステージ2〜5: T1〜T4（各4シナリオ）
  合計 17シナリオ × 8パターン = 136件
"""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_JSONL = ROOT / "data/evaluation/gold.jsonl"
OUT_CSV = ROOT / "data/evaluation/gold-template.csv"

TIERS = ["t1", "t2", "t3", "t4"]

# lib/stage-templates.ts と同期
STAGE_SLOTS = {
    1: {
        "fixed": True,
        "tiers": {
            "t1": {
                "title": "遅刻",
                "mistake": "田中が朝の会議に20分遅刻した",
                "npcLine": "すみません、電車が遅れていて……",
            },
        },
    },
    2: {
        "tiers": {
            "t1": {
                "title": "メール誤送信",
                "mistake": "田中がお客様宛メールの宛先を1件間違えた",
                "npcLine": "送信前に確認すべきでした……",
            },
            "t2": {
                "title": "報告漏れ",
                "mistake": "田中がトラブルを1時間放置し、上司に報告しなかった",
                "npcLine": "自分で何とかできると思っていました……",
            },
            "t3": {
                "title": "データ全消し",
                "mistake": "田中が共有フォルダの重要資料を誤って削除した",
                "npcLine": "復旧方法を調べます……本当にすみません……",
            },
            "t4": {
                "title": "会議室占拠",
                "mistake": "田中が会議室を「今日は使わない」と誤って予約解除し、取引先の商談会場が消えた",
                "npcLine": "カレンダー、見間違えました……もう終わりです……",
            },
        },
    },
    3: {
        "tiers": {
            "t1": {
                "title": "期限前提出",
                "mistake": "田中が期限前日に気づいたが、完成間に合わず未提出だった",
                "npcLine": "時間管理を見直します……",
            },
            "t2": {
                "title": "同じミス3連発",
                "mistake": "田中が先週指摘した入力ミスを、また同じ箇所で犯した",
                "npcLine": "チェックリストを作ったのに……",
            },
            "t3": {
                "title": "社長室侵入",
                "mistake": "田中が社長室を「会議室」と勘違いし、無断で入ってコーヒーを淹れていた",
                "npcLine": "看板、読めてませんでした……",
            },
            "t4": {
                "title": "スリッパ事件",
                "mistake": "田中が先輩のスリッパを「冷えないように」と懐で温めてロッカーにしまっていた",
                "npcLine": "先輩が喜ぶと思って……（違います）",
            },
        },
    },
    4: {
        "tiers": {
            "t1": {
                "title": "打刻ミス",
                "mistake": "田中が勤怠打刻を1日だけ忘れた",
                "npcLine": "リマインダー設定します……",
            },
            "t2": {
                "title": "言い訳大会",
                "mistake": "田中がミスを認めず、他メンバーのせいにした",
                "npcLine": "指示が曖昧だったんです……",
            },
            "t3": {
                "title": "機密情報流出",
                "mistake": "田中が社外秘資料を個人LINEに誤送信した",
                "npcLine": "送信先、確認してませんでした……",
            },
            "t4": {
                "title": "コピー機反乱",
                "mistake": "田中がコピー機を500枚設定のまま放置し、会議資料が事務所中に散乱。本人は居眠りしていた",
                "npcLine": "夢の中でコピーしてました……",
            },
        },
    },
    5: {
        "tiers": {
            "t1": {
                "title": "準備不足",
                "mistake": "田中がクライアント会議の資料が未完成のまま出席した",
                "npcLine": "前日までに準備する習慣をつけます……",
            },
            "t2": {
                "title": "クレーム放置",
                "mistake": "田中がお客様クレーム対応を1週間放置していた",
                "npcLine": "怖くて触れられなくて……",
            },
            "t3": {
                "title": "全社一斉返信",
                "mistake": "田中が「全社員に返信」すべきメールに全社員全員へ個別返信し、サーバーが一時停止した",
                "npcLine": "丁寧に返そうと思って……",
            },
            "t4": {
                "title": "机の上の煙幕装置",
                "mistake": "田中が科学部の展示用「安全な煙幕装置」を「新商品サンプル」とラベル貼り替え、社長室の机の上に置いた",
                "npcLine": "インパクトがあると思って……科学部は「それ実験未完了です」と言ってます",
            },
        },
    },
}

# シナリオごとの指導文生成用メタデータ
SCENARIO_GUIDANCE = {
    "s1_t1": {
        "label": "遅刻",
        "short": "遅刻",
        "impact": "会議開始が遅れ、チームに迷惑がかかりました",
        "action": "会議10分前到着、出発15分早め、遅れそうなら出発前に連絡",
        "check": "チェックリストを作り、出発前リマインダーを設定",
        "vague": "時間を守る",
    },
    "s2_t1": {
        "label": "宛先ミス",
        "short": "メール",
        "impact": "お客様への誤送信は信頼に直結します",
        "action": "送信前に宛先・件名・本文を声に出して確認、重要メールは上司確認",
        "check": "送信前チェックリストの作成",
        "vague": "メールに注意",
    },
    "s2_t2": {
        "label": "報告漏れ",
        "short": "報告",
        "impact": "トラブル放置は被害を拡大させます",
        "action": "異常発見から30分以内に報告、自力対処前に必ず相談",
        "check": "報連相フローチャートの共有",
        "vague": "報告して",
    },
    "s2_t3": {
        "label": "データ削除",
        "short": "削除",
        "impact": "共有資料の消失は業務に重大な影響があります",
        "action": "削除前に確認ダイアログを必ず見る、復旧手順を確認してから操作",
        "check": "削除操作のダブルチェック手順",
        "vague": "削除に気をつけて",
    },
    "s2_t4": {
        "label": "予約解除ミス",
        "short": "予約",
        "impact": "取引先の商談会場が消え、信用問題になりました",
        "action": "予約変更前に関係者へ確認、カレンダー操作は必ずダブルチェック",
        "check": "カレンダー変更時の確認リスト",
        "vague": "カレンダー気をつけて",
    },
    "s3_t1": {
        "label": "未提出",
        "short": "期限",
        "impact": "期限未提出はチーム全体のスケジュールに影響します",
        "action": "期限3日前中間報告、前日完成確認、間に合わないときは早めに相談",
        "check": "期限管理カレンダーと中間チェック日",
        "vague": "期限を守って",
    },
    "s3_t2": {
        "label": "同ミス再発",
        "short": "同じミス",
        "impact": "同じミスの繰り返しは品質リスクです",
        "action": "チェックリストを見直し、該当箇所に目印を付け、確認者を1人置く",
        "check": "再発防止チェックリストの更新",
        "vague": "同じミスするな",
    },
    "s3_t3": {
        "label": "社長室無断入室",
        "short": "無断入室",
        "impact": "権限外の場所への入室はセキュリティ上の問題です",
        "action": "入室前に看板・案内を確認、不明な部屋は必ず事前に確認",
        "check": "オフィスマップの再確認",
        "vague": "勝手に入るな",
    },
    "s3_t4": {
        "label": "スリッパ事件",
        "short": "スリッパ",
        "impact": "業務と無関係な私物への介入は職場ルール違反です",
        "action": "私物・備品には触れない、業務手順書の範囲内で行動、不明点は事前確認",
        "check": "職場行動ルールの再確認",
        "vague": "変なことするな",
    },
    "s4_t1": {
        "label": "打刻忘れ",
        "short": "打刻",
        "impact": "勤怠記録は給与計算に直結します",
        "action": "退勤時アラーム設定、忘れたら翌朝すぐ修正申請",
        "check": "打刻リマインダーの設定",
        "vague": "打刻忘れるな",
    },
    "s4_t2": {
        "label": "言い訳",
        "short": "言い訳",
        "impact": "他責にすると改善につながりません",
        "action": "まず自分の落ち度を整理して報告、原因分析を一緒に実施",
        "check": "振り返りシートで自分の改善点を書く",
        "vague": "言い訳するな",
    },
    "s4_t3": {
        "label": "機密流出",
        "short": "機密",
        "impact": "社外秘資料の個人LINE送信は情報漏洩です",
        "action": "社外秘は指定ツールのみ使用、送信前に宛先とファイル名を確認",
        "check": "情報管理チェックリストの遵守",
        "vague": "機密に気をつけて",
    },
    "s4_t4": {
        "label": "コピー機散乱",
        "short": "コピー",
        "impact": "500枚散乱は環境・コスト・情報管理すべてに問題です",
        "action": "コピー枚数は必ず確認、離席時は操作をキャンセル、居眠り時は休憩を取る",
        "check": "コピー操作後の確認手順",
        "vague": "コピー気をつけて",
    },
    "s5_t1": {
        "label": "資料未完成",
        "short": "準備",
        "impact": "未完成資料での会議出席はクライアントへの失礼です",
        "action": "前日17時までに資料完成・上司確認、間に合わないときは早めに相談",
        "check": "会議前日チェックリスト",
        "vague": "準備しろ",
    },
    "s5_t2": {
        "label": "クレーム放置",
        "short": "クレーム",
        "impact": "1週間放置はお客様の不満を拡大させます",
        "action": "受領24時間以内に一次返信、対応方針を上司と確認",
        "check": "クレーム対応フローの確認",
        "vague": "早く対応しろ",
    },
    "s5_t3": {
        "label": "全社返信",
        "short": "返信",
        "impact": "全社員への個別返信でサーバーが停止しました",
        "action": "返信前にTo/CC/BCCを確認、全社宛はReply Allのみ使用",
        "check": "メール返信ルールの再確認",
        "vague": "返信気をつけて",
    },
    "s5_t4": {
        "label": "煙幕装置",
        "short": "装置",
        "impact": "未完了の展示物を社長室に置くのは重大な安全・確認不足です",
        "action": "他部署の物品は触らない、ラベル変更・移動は必ず担当者と上司に確認",
        "check": "物品持ち込み・移動の申請フロー",
        "vague": "勝手に触るな",
    },
}

PATTERNS = [
    {
        "suffix": "001",
        "pattern": "clear",
        "gold": {
            "harassmentScore": 10,
            "problemClarityScore": 82,
            "actionSpecificityScore": 78,
            "dialogueScore": 75,
            "supportScore": 80,
            "status": "clear",
            "matchedRiskWords": [],
            "matchedGoodWords": ["確認", "次回から", "相談"],
        },
        "notes": "模範的な指導。問題特定→対話→具体行動→仕組み。",
    },
    {
        "suffix": "002",
        "pattern": "clear",
        "gold": {
            "harassmentScore": 12,
            "problemClarityScore": 65,
            "actionSpecificityScore": 72,
            "dialogueScore": 35,
            "supportScore": 55,
            "status": "clear",
            "matchedRiskWords": [],
            "matchedGoodWords": ["次回から", "相談"],
        },
        "notes": "具体行動は十分。原因確認は弱いがクリア。",
    },
    {
        "suffix": "003",
        "pattern": "insufficient",
        "gold": {
            "harassmentScore": 35,
            "problemClarityScore": 22,
            "actionSpecificityScore": 12,
            "dialogueScore": 10,
            "supportScore": 5,
            "status": "insufficient",
            "matchedRiskWords": [],
            "matchedGoodWords": [],
        },
        "notes": "問題点・改善行動ともに30未満。",
    },
    {
        "suffix": "004",
        "pattern": "insufficient",
        "gold": {
            "harassmentScore": 28,
            "problemClarityScore": 52,
            "actionSpecificityScore": 22,
            "dialogueScore": 15,
            "supportScore": 10,
            "status": "insufficient",
            "matchedRiskWords": [],
            "matchedGoodWords": [],
        },
        "notes": "問題指摘はあるが改善行動が30未満。",
    },
    {
        "suffix": "005",
        "pattern": "harassment",
        "gold": {
            "harassmentScore": 72,
            "problemClarityScore": 28,
            "actionSpecificityScore": 8,
            "dialogueScore": 5,
            "supportScore": 0,
            "status": "insufficient",
            "matchedRiskWords": ["何回言えばわかる", "使えない"],
            "matchedGoodWords": [],
        },
        "notes": "ハラスメント度72。80未満で労基エンドにはならない。",
    },
    {
        "suffix": "006",
        "pattern": "harassment",
        "gold": {
            "harassmentScore": 95,
            "problemClarityScore": 18,
            "actionSpecificityScore": 0,
            "dialogueScore": 0,
            "supportScore": 0,
            "status": "labor_consultation",
            "matchedRiskWords": ["お前", "社会人失格", "辞めろ"],
            "matchedGoodWords": [],
        },
        "notes": "人格否定＋解雇示唆。労基相談エンド。",
    },
    {
        "suffix": "007",
        "pattern": "border",
        "gold": {
            "harassmentScore": 42,
            "problemClarityScore": 70,
            "actionSpecificityScore": 52,
            "dialogueScore": 18,
            "supportScore": 12,
            "status": "clear",
            "matchedRiskWords": [],
            "matchedGoodWords": [],
        },
        "notes": "厳しいが業務範囲内と判断。対話・支援は低め。",
    },
    {
        "suffix": "008",
        "pattern": "border",
        "gold": {
            "harassmentScore": 15,
            "problemClarityScore": 68,
            "actionSpecificityScore": 74,
            "dialogueScore": 22,
            "supportScore": 28,
            "status": "clear",
            "matchedRiskWords": [],
            "matchedGoodWords": ["次回から", "確認"],
        },
        "notes": "対話・支援は低いが問題点と改善行動は基準を満たす。",
    },
]


def iter_scenarios():
    """17シナリオを列挙"""
    for stage_num, slot in STAGE_SLOTS.items():
        if slot.get("fixed"):
            tiers = ["t1"]
        else:
            tiers = TIERS
        for tier in tiers:
            content = slot["tiers"][tier]
            key = f"s{stage_num}_{tier}"
            yield {
                "key": key,
                "stageNumber": stage_num,
                "stageTemplateId": f"stage{stage_num}",
                "tier": tier,
                "title": content["title"],
                "mistake": content["mistake"],
                "npcLine": content["npcLine"],
            }


def build_guidance(scenario_key: str, pattern_suffix: str) -> str:
    m = SCENARIO_GUIDANCE[scenario_key]
    label = m["label"]
    if pattern_suffix == "001":
        return (
            f"今回の{label}について確認させてください。{m['impact']}。"
            f"原因を教えてもらえますか。次回から{m['action']}。"
            f"{m['check']}。困ったら早めに相談を。"
        )
    if pattern_suffix == "002":
        return (
            f"今回の{label}について、次回から{m['action']}。"
            f"困ったら早めに相談してください。"
        )
    if pattern_suffix == "003":
        return f"{m['short']}はダメだよ。次気をつけて。"
    if pattern_suffix == "004":
        return f"今回の{label}は問題です。今後は{m['vague']}ように。"
    if pattern_suffix == "005":
        return f"何回言えばわかるんだ。{m['short']}もできないのか。使えないな。"
    if pattern_suffix == "006":
        return f"お前、{m['short']}すらまともにできないのか。社会人失格だ。辞めろ。"
    if pattern_suffix == "007":
        return (
            f"今回の{label}は許されません。{m['impact']}。"
            f"今後は{m['action']}を徹底してください。再発した場合は評価に反映します。"
        )
    if pattern_suffix == "008":
        return f"{label}、問題です。次回から{m['action']}。以上。"
    raise ValueError(f"Unknown pattern: {pattern_suffix}")


def build_entries():
    entries = []
    for scenario in iter_scenarios():
        for pat in PATTERNS:
            suffix_num = pat["suffix"]
            guidance = build_guidance(scenario["key"], suffix_num)
            entry_id = f"{scenario['key']}_{pat['suffix']}"
            tags = [pat["pattern"], f"stage{scenario['stageNumber']}", scenario["tier"]]
            if pat["gold"]["status"] == "labor_consultation":
                tags.append("labor_consultation")
            entries.append(
                {
                    "id": entry_id,
                    "stageNumber": scenario["stageNumber"],
                    "stageTemplateId": scenario["stageTemplateId"],
                    "tier": scenario["tier"],
                    "stageTitle": scenario["title"],
                    "mistake": scenario["mistake"],
                    "npcLine": scenario["npcLine"],
                    "tanakaStatus": {"mentalHealth": 75, "awarenessLevel": 40},
                    "inputText": guidance,
                    "pattern": pat["pattern"],
                    "gold": pat["gold"],
                    "tags": tags,
                    "notes": pat["notes"],
                    "annotator": "rubric_seed",
                    "annotatedAt": "2026-06-12",
                }
            )
    return entries


def to_csv_row(entry: dict) -> list:
    g = entry["gold"]
    t = entry["tanakaStatus"]
    return [
        entry["id"],
        entry["stageTemplateId"],
        str(entry["stageNumber"]),
        entry["tier"],
        entry["stageTitle"],
        entry["mistake"],
        entry["npcLine"],
        str(t["mentalHealth"]),
        str(t["awarenessLevel"]),
        entry["inputText"],
        entry["pattern"],
        str(g["harassmentScore"]),
        str(g["problemClarityScore"]),
        str(g["actionSpecificityScore"]),
        str(g["dialogueScore"]),
        str(g["supportScore"]),
        g["status"],
        "|".join(g["matchedRiskWords"]),
        "|".join(g["matchedGoodWords"]),
        "|".join(entry["tags"]),
        entry["notes"],
        entry["annotator"],
        entry["annotatedAt"],
    ]


def main():
    entries = build_entries()
    scenario_count = len(list(iter_scenarios()))
    assert len(entries) == scenario_count * 8, (
        f"Expected {scenario_count * 8} entries, got {len(entries)}"
    )

    OUT_JSONL.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_JSONL, "w", encoding="utf-8") as f:
        for e in entries:
            f.write(json.dumps(e, ensure_ascii=False) + "\n")

    headers = [
        "id",
        "stageTemplateId",
        "stageNumber",
        "tier",
        "stageTitle",
        "mistake",
        "npcLine",
        "tanakaStatus_mentalHealth",
        "tanakaStatus_awarenessLevel",
        "inputText",
        "pattern",
        "harassmentScore",
        "problemClarityScore",
        "actionSpecificityScore",
        "dialogueScore",
        "supportScore",
        "status",
        "matchedRiskWords",
        "matchedGoodWords",
        "tags",
        "notes",
        "annotator",
        "annotatedAt",
    ]
    with open(OUT_CSV, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for e in entries:
            writer.writerow(to_csv_row(e))

    print(f"シナリオ数: {scenario_count}")
    print(f"データセット: {len(entries)}件 ({scenario_count} × 8)")
    print(f"  {OUT_JSONL}")
    print(f"  {OUT_CSV}")


if __name__ == "__main__":
    main()
