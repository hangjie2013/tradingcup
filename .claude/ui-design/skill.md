# TradingCup UI デザインスキル

Claude がこのプロジェクトの UI を実装・改善するときに参照するデザインシステムドキュメント。

---

## 1. プロダクトコンセプト

**TradingCup** は、実際の取引所口座を使ってトレーダーが成績を競うコンペティションプラットフォーム。

| 軸 | 参考 | 要点 |
|---|---|---|
| 機能・競わせ方 | [TRADE ISLAND](https://www.trade-island.jp/) | 口座連携（APIキー）→ 戦績自動集計 → ランキングで競う |
| 見た目・UX | PokerStars トーナメントロビー | 大会一覧が並ぶ、参加登録、リアルタイム順位変動 |
| スタイル基盤 | [Tailwind CSS Plus](https://tailwindcss.com/plus) | Application UI / Catalyst コンポーネントを前提 |

**ローンチ戦略**
- Phase 1: IZKY 無料 Cup（LBank のみ）
- Phase 2〜: 上場先取引所（リスティング先）が増えるたびに対応取引所を追加

---

## 2. デザイン原則

### PokerStars ロビー的な体験
- 大会カードが一覧で並ぶ → 参加ボタンを押すだけで完結
- 参加中の大会は「ライブ感」を演出（点滅、カウントダウン）
- 順位変動はアニメーションで可視化
- 情報密度は高く、でもノイズは少なく

### TRADE ISLAND 的な信頼感
- 「実データ」「読み取り専用API」「入出金失格」をしっかり伝える
- 戦績をトレーダーの「実力証明」として位置づける

---

## 3. デザインシステム（現行）

### カラーパレット（ダークモード固定）

```css
/* globals.css .dark セクション */
--background:  #171f52   /* メインBG：深いネイビー */
--card:        #1d2766   /* カードBG：ミッドネイビー */
--primary:     #e51c44   /* アクション色：クリムゾン（IZKYブランド） */
--secondary:   #243189   /* セカンダリ：インディゴ */
--accent:      #495bcc   /* アクセント：ブルー */
--border:      #243189   /* ボーダー：インディゴ */
--foreground:  #dde3f0   /* 本文：ライトブルーホワイト */
--muted-foreground: #abb1cc  /* サブテキスト */
--destructive: #e51c44   /* エラー・警告 */
```

**意図**: PokerStars の深夜ロビーを想起させる深みのある紺色ベース。アクション（参加登録・CTA）は赤で際立たせる。

### カラーの使い分け

| 用途 | クラス | 実例 |
|---|---|---|
| ページ背景 | `bg-background` | 全ページ共通 |
| カード・パネル | `bg-card border border-border` | CupCard, RankingTable |
| CTAボタン | `bg-primary text-primary-foreground` | 「参加登録」ボタン |
| セカンダリボタン | `bg-secondary` または `variant="outline"` | 「ランキングを見る」 |
| ステータス: 開催中 | `text-green-400` + アニメpulse | active バッジ |
| ステータス: 予定 | `text-blue-400` | scheduled バッジ |
| ステータス: 終了 | `text-muted-foreground` | ended バッジ |
| 上昇PNL | `text-green-400` | +12.5% |
| 下降PNL | `text-red-400` | -3.2% |

### シャドウ

```
shadow-[0px_8px_24px_0px_rgba(17,23,61,0.8)]
```

ネイビー系の深いドロップシャドウ。カードに奥行きを与える。全カードに統一適用。

### タイポグラフィ

- フォント: Geist Sans（本文）/ Geist Mono（数値・アドレス）
- 見出し: `text-3xl font-bold`（ページタイトル）
- セクション: `text-sm font-medium`（ラベル、ナビ）
- 数値: `font-semibold`（順位、PNL、取引量）
- サブ情報: `text-xs text-muted-foreground`

### 角丸・スペーシング

- カード: `rounded-lg`（radius: 0.5rem）
- 大きなモーダル: `rounded-xl`
- コンテナ幅: `max-w-xl`（ユーザー画面）/ `max-w-3xl`（詳細・ランキング）
- セクション間隔: `space-y-6`（ページ）/ `gap-3`〜`gap-4`（グリッド）

---

## 4. Tailwind CSS Plus 活用方針

### 使用するカテゴリ

| カテゴリ | 用途 |
|---|---|
| **Application UI / Tables** | ランキングテーブル（RankingTable） |
| **Application UI / Lists / Feeds** | 戦績フィード、最近の取引履歴 |
| **Application UI / Navigation / Navbars** | ヘッダー、タブナビゲーション |
| **Application UI / Overlays / Modal Dialogs** | 参加登録モーダル（RegisterModal） |
| **Application UI / Elements / Badges** | ステータスバッジ（開催中・予定・終了） |
| **Application UI / Elements / Dropdowns** | 取引所フィルター、ソート |
| **Application UI / Navigation / Pagination** | ランキングページネーション |
| **Ecommerce / Incentives** | 賞品・報酬セクション |

### Catalyst UI Kit（shadcn/ui と併用）

現行は `components/ui/` に shadcn/ui が入っている。
Tailwind CSS Plus の Catalyst は同様のスタイルを持つので、
**新規コンポーネントは Catalyst のスタイルパターンを参考に、shadcn ベースで実装**する方針。

---

## 5. 主要画面のコンポーネントパターン

### 5.1 ロビー（Cup 一覧）= PokerStars トーナメントロビー

```
┌─ Header ─────────────────────────────┐
│  🏆 トレーディングカップ   [ウォレット接続] │
└──────────────────────────────────────┘
┌─ Nav ────────────────────────────────┐
│  [ロビー★]  [プロフィール]  [管理]      │
└──────────────────────────────────────┘
┌─ LobbyHero ──────────────────────────┐
│  大会名・開催中バナー or カウントダウン  │
└──────────────────────────────────────┘
┌─ フィルタータブ ──────────────────────┐
│  [すべて] [開催中] [予定] [終了]        │
└──────────────────────────────────────┘
┌─ CupCard × n ────────────────────────┐
│  ● 開催中   IZKY/USDT on LBank        │
│  第1回 IZKY無料カップ                  │
│  参加者: 42人  賞品: 〇〇  残り: 2日   │
│  [詳細を見る]  [今すぐ参加登録]         │
└──────────────────────────────────────┘
```

**CupCard の情報優先度**
1. ステータスバッジ（開催中 🟢 / 予定 🔵 / 終了 ⚪）
2. 大会名
3. 取引ペア + 取引所
4. 参加者数 / 賞品 / 期間（または残り時間）
5. CTA ボタン（参加可能なら primary、終了なら outline）

### 5.2 Cup 詳細ページ

```
┌─ ステータス + 取引ペア ───────────────┐
│  ● 開催中  •  IZKY/USDT on LBANK      │
│  第1回 IZKY無料カップ（h1）            │
│  説明文                                │
└──────────────────────────────────────┘
┌─ Stats グリッド（2×2 or 4列）─────────┐
│  👥 参加者   📈 最小取引量             │
│  📅 開始日   📅 終了日                 │
└──────────────────────────────────────┘
┌─ ルール ──────────────────────────────┐
│  • LBankでのIZKY/USDTのみカウント      │
│  • 入出金 = 即失格                     │
│  • min_volume_usdt 以上で賞品対象      │
│  • 開始時残高からのPNL%でランキング    │
└──────────────────────────────────────┘
[参加登録ボタン] [ランキングを見る]
```

### 5.3 ランキング画面

```
┌─ 自分の順位カード（MyRankCard）───────┐
│  現在の順位: #3  PNL: +8.4%           │
│  取引量: 1,240 USDT                   │
└──────────────────────────────────────┘
┌─ RankingTable ───────────────────────┐
│  順位 │ ユーザー │ PNL%  │ 取引量     │
│   1   │ 0x1a2b… │ +15.2%│ 3,200 USDT│
│   2   │ 0xffee… │ +12.8%│ 5,100 USDT│
│ ▶ 3  │ You     │ +8.4% │ 1,240 USDT│ ← ハイライト
└──────────────────────────────────────┘
```

**ランキングのビジュアルルール**
- 1位: `text-yellow-400` + 🏆 or 王冠アイコン
- 2位: `text-slate-300` + シルバー
- 3位: `text-amber-600` + ブロンズ
- 自分の行: `bg-secondary/40` でハイライト
- PNL+: `text-green-400`、PNL-: `text-red-400`
- ウォレットアドレスは先頭6文字 + `…` + 末尾4文字で表示

### 5.4 ステータスバッジのパターン

```tsx
// 開催中
<span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
  開催中
</span>

// 予定
<span className="text-blue-400 text-sm font-medium">予定</span>

// 終了・確定
<span className="text-muted-foreground text-sm font-medium">終了</span>
```

---

## 6. UI コピー・用語統一

| 英語（コード内） | 表示テキスト（日本語） |
|---|---|
| `cup` | カップ / 大会 |
| `scheduled` | 参加受付中 |
| `active` | 開催中 |
| `ended` | 終了 |
| `finalized` | 結果確定 |
| `pnl` | PNL（損益率） |
| `volume` | 取引量 |
| `participant` | 参加者 |
| `register` | 参加登録 |
| `lobby` | ロビー |
| `ranking` | ランキング |
| `pair` | 取引ペア |
| `exchange` | 取引所 |
| `wallet` | ウォレット |
| API key | APIキー |

---

## 7. アニメーション・インタラクション

- **開催中バッジ**: `animate-pulse`（緑のドット）
- **カードホバー**: `hover:border-accent/60 transition-colors`
- **ローディング**: `<Loader2 className="animate-spin" />`
- **順位変動**: 将来的に数字カウントアップアニメーション
- **参加登録成功**: `toast.success()` + ボタン → 「登録済み ✓」に変化

---

## 8. 成長ロードマップ（UI観点）

### Phase 1 — IZKY 無料 Cup（現在）
- LBank × IZKY/USDT のみ
- ロビー → Cup詳細 → ランキングの基本フロー
- シンプルなカード1種類

### Phase 2 — 取引所拡大時
- CupCard に取引所ロゴバッジを追加
- ロビーにフィルタータブ「取引所別」を追加
- 取引所ごとのブランドカラーをバッジに反映

### Phase 3 — エンゲージメント強化（PokerStars的要素）
- カウントダウンタイマー（開始まで・終了まで）
- 「直近の取引フラッシュ」（誰かが大きな取引をした速報）
- 賞品・報酬セクションの充実（Tailwind Plus Incentives パターン）
- トレーダープロフィール（戦績履歴・過去成績）

---

## 9. 実装時の注意事項

- **ダークモード固定**: `class="dark"` が `<html>` または `<body>` に付与されている前提
- **コンテナ幅**: ユーザー向けは `max-w-xl` で縦積みモバイルファーストを維持
- **shadcn/ui を優先**: `components/ui/` のコンポーネントを先に探し、なければ Tailwind Plus のパターンを参考に新規作成
- **ウォレット認証**: `ConnectButton` コンポーネントを全ページのヘッダーに配置する
- **影の統一**: カードには `shadow-[0px_8px_24px_0px_rgba(17,23,61,0.8)]` を使う

---

Sources:
- [TRADE ISLAND](https://www.trade-island.jp/)
- [PokerStars 新ロビー（2024）](https://rakerace.com/news/poker-rooms/2024/10/24/pokerstars-launches-new-tournament-lobby-and-wants-feedback)
- [Tailwind CSS Plus](https://tailwindcss.com/plus)
