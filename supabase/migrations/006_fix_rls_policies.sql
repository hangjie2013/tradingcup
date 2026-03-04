-- ============================================================
-- 006: RLSポリシー修正
-- ============================================================
-- 問題: authenticated = admin の前提でポリシーが設定されていた
-- 修正: Admin操作はcreateServiceClient()（RLSバイパス）経由に統一し、
--       RLSではユーザー向けポリシーのみ残す
-- ============================================================

-- ----- cups -----
-- 既存の「全authenticatedユーザーが管理可能」ポリシーを削除
DROP POLICY IF EXISTS "Admins can manage cups" ON cups;

-- Cups: 全員閲覧可能（既存の select policy はそのまま維持）
-- Admin操作（INSERT/UPDATE/DELETE）はcreateServiceClient()経由でRLSバイパス
-- → RLSで明示的にINSERT/UPDATE/DELETEを拒否する必要はない
--   （service_role clientはRLSを無視するため）

-- ----- profiles -----
-- 既存の「全員更新可能」を「自分のみ更新可能」に修正
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- 既存の「全員挿入可能」を維持（ウォレット初回登録用、service_role経由）
-- 注: profiles INSERT は service_role client 経由で行われるため実質問題なし

-- ----- exchange_api_keys -----
-- Service role only - 既存ポリシーはそのまま（全操作がservice_role経由）
-- 追加: anon/authenticated ユーザーのアクセスを明示的にブロック
DROP POLICY IF EXISTS "Service role can manage api keys" ON exchange_api_keys;
-- exchange_api_keys は RLS enabled のまま、ポリシーなし = 全拒否
-- service_role client はRLSをバイパスするので影響なし

-- ----- cup_participants -----
-- 既存のパブリック閲覧はそのまま（ランキング表示用）
-- 管理操作はservice_role経由

-- 既存の全操作許可ポリシーを削除し、SELECT のみに制限
DROP POLICY IF EXISTS "Service role can manage participants" ON cup_participants;
-- INSERT/UPDATE/DELETE は service_role client 経由のみ（RLSバイパス）

-- ----- cup_snapshots -----
-- 同上
DROP POLICY IF EXISTS "Service role can manage snapshots" ON cup_snapshots;
-- INSERT/UPDATE/DELETE は service_role client 経由のみ

-- ----- disqualification_log -----
-- 閲覧もadminのみに制限（一般ユーザーには不要）
DROP POLICY IF EXISTS "Admins can view disqualification log" ON disqualification_log;
DROP POLICY IF EXISTS "Service role can manage disqualification log" ON disqualification_log;
-- 全操作をservice_role経由のみに制限（ポリシーなし = 全拒否）

-- ----- banners -----
-- パブリック閲覧はそのまま（公開表示用）
-- 管理操作はservice_role経由（Admin APIで認可チェック済み）
