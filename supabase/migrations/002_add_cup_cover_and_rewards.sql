-- cups テーブルにカバー画像URLと報酬カラムを追加

alter table cups
  add column if not exists cover_image_url text,
  add column if not exists rewards jsonb not null default '[]';

-- cup-covers バケット（画像アップロード用）
-- ※ Supabase ダッシュボード > Storage > New bucket から手動で作成することも可
insert into storage.buckets (id, name, public)
values ('cup-covers', 'cup-covers', true)
on conflict (id) do nothing;

-- Storage ポリシー: 認証済みユーザー（管理者）のみアップロード可
create policy "Admins can upload cup covers"
  on storage.objects for insert
  with check (
    bucket_id = 'cup-covers'
    and auth.role() = 'authenticated'
  );

-- Storage ポリシー: 誰でも参照可（public bucket）
create policy "Anyone can view cup covers"
  on storage.objects for select
  using (bucket_id = 'cup-covers');
