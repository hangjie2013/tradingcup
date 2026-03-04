-- 最低残高条件カラムを追加（CLAUDE.md 3.2③ 最低残高条件）
ALTER TABLE cups ADD COLUMN min_balance_usdt numeric NOT NULL DEFAULT 10;
