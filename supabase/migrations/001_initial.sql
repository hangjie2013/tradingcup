-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- profiles: ウォレットアドレスにリンクされたユーザー
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  wallet_address text unique not null,
  display_name text,
  created_at timestamptz default now()
);

-- exchange_api_keys: 暗号化されたAPIキー
create table exchange_api_keys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  encrypted_api_key text not null,
  encrypted_api_secret text not null,
  exchange text not null default 'lbank',
  is_verified boolean default false,
  created_at timestamptz default now(),
  unique(user_id, exchange)
);

-- cups: トレーディング大会
create table cups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  exchange text not null default 'lbank',
  pair text not null default 'IZKY/USDT',
  status text not null default 'draft',
  start_at timestamptz,
  end_at timestamptz,
  min_volume_usdt numeric not null default 100,
  description text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- cup_participants: 参加者 & 結果
create table cup_participants (
  id uuid primary key default uuid_generate_v4(),
  cup_id uuid references cups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  registered_at timestamptz default now(),
  start_balance_usdt numeric,
  end_balance_usdt numeric,
  pnl numeric,
  pnl_pct numeric,
  total_volume_usdt numeric default 0,
  is_disqualified boolean default false,
  disqualify_reason text,
  rank integer,
  is_eligible boolean,
  unique(cup_id, user_id)
);

-- cup_snapshots: 30分毎スナップショット
create table cup_snapshots (
  id uuid primary key default uuid_generate_v4(),
  cup_id uuid references cups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  snapshot_at timestamptz default now(),
  balance_usdt numeric,
  volume_since_start numeric,
  pnl_pct numeric
);

-- disqualification_log: 失格監査ログ
create table disqualification_log (
  id uuid primary key default uuid_generate_v4(),
  cup_id uuid references cups(id),
  user_id uuid references profiles(id),
  reason text not null,
  detected_at timestamptz default now(),
  admin_user_id uuid references auth.users(id)
);

-- RLS: Row Level Security
alter table profiles enable row level security;
alter table exchange_api_keys enable row level security;
alter table cups enable row level security;
alter table cup_participants enable row level security;
alter table cup_snapshots enable row level security;
alter table disqualification_log enable row level security;

-- profiles policies
create policy "Users can view own profile"
  on profiles for select
  using (true);

create policy "Users can insert own profile"
  on profiles for insert
  with check (true);

create policy "Users can update own profile"
  on profiles for update
  using (true);

-- exchange_api_keys policies (service role only for read - server-side decryption)
create policy "Service role can manage api keys"
  on exchange_api_keys for all
  using (true);

-- cups policies (public read)
create policy "Anyone can view cups"
  on cups for select
  using (true);

create policy "Admins can manage cups"
  on cups for all
  using (auth.role() = 'authenticated');

-- cup_participants policies
create policy "Anyone can view participants"
  on cup_participants for select
  using (true);

create policy "Service role can manage participants"
  on cup_participants for all
  using (true);

-- cup_snapshots policies
create policy "Anyone can view snapshots"
  on cup_snapshots for select
  using (true);

create policy "Service role can manage snapshots"
  on cup_snapshots for all
  using (true);

-- disqualification_log policies
create policy "Admins can view disqualification log"
  on disqualification_log for select
  using (auth.role() = 'authenticated');

create policy "Service role can manage disqualification log"
  on disqualification_log for all
  using (true);

-- pg_cron: 30分バッチ (Supabaseダッシュボードで設定)
-- select cron.schedule('update-rankings', '*/30 * * * *', $$
--   select net.http_post(
--     url := 'https://YOUR_PROJECT.supabase.co/functions/v1/update-rankings',
--     headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
--   )
-- $$);
