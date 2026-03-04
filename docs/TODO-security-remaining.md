# セキュリティ改善 残タスク

> 作成日: 2026-03-04
> 対応者: 引野

---

## 優先度: 高（近日中）

### 1. GitHub Ruleset に Status Checks を追加
- **条件**: GitHub Actions のログ検索が有効になった後
- **手順**:
  1. GitHub → Settings → Rules → Rulesets → `main` を編集
  2. 「Require status checks to pass」を ✅ ON
  3. 以下3つを検索して追加:
     - `Lint & Type Check`
     - `Test`
     - `Secret Scan`
  4. 「Require branches to be up to date before merging」も ✅ ON
  5. 保存

### 2. Vercel に本番環境変数を設定
- `JWT_SIGNING_SECRET` — Production / Preview / Development 各環境に設定
- `ADMIN_EMAILS` — 管理者メールアドレス
- ⚠️ Production と Preview/Development で**異なる値**を設定すること

---

## 優先度: 中（1〜2週間以内）

### 3. Supabase 環境分離（dev/prod）
- dev用 Supabase プロジェクトを新規作成
- 全マイグレーション（001〜006）を dev で実行
- Vercel の Preview/Development 環境変数を dev 用に差し替え
- ローカル `.env.local` も dev 用に切り替え

### 4. 開発者追加時の対応
- GitHub Ruleset: Required approvals を `0` → `1` に変更
- Vercel: Developer ロールで招待
- Supabase: Developer ロールで招待
- シークレット共有: 1Password / Bitwarden 等で安全に共有

---

## 優先度: 低（余裕がある時）

### 5. JWT_SIGNING_SECRET のローテーション運用
- 現状: SUPABASE_SERVICE_ROLE_KEY からのフォールバックあり（本番では警告ログ出力）
- 対応: 本番で JWT_SIGNING_SECRET 設定後、フォールバック削除を検討

### 6. ENCRYPTION_KEY のローテーション手順整備
- APIキー暗号化キーの更新時は、既存データの再暗号化が必要
- 手順書を作成しておく
