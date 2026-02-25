-- Migration: cover_image_url → cover_image_key
-- Phase 3: Storage URL直保存廃止、object_key管理へ移行
-- cover_image_url に保存されている値が既に object_key の場合はそのまま移設

ALTER TABLE cups ADD COLUMN IF NOT EXISTS cover_image_key TEXT;

-- 既存データを移設（cover_image_url の値が object_key 形式の場合）
UPDATE cups
SET cover_image_key = cover_image_url
WHERE cover_image_url IS NOT NULL;

-- cover_image_url は互換用に残す（Phase 3b で廃止予定）
-- TODO: Phase 3b — cover_image_url カラムを DROP する
