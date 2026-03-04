/**
 * Apply 004_banners migration via Supabase JS client (service role).
 * Usage: node scripts/apply-004-banners.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

async function run() {
  // Step 1: Check if table exists
  const { error: checkError } = await supabase.from('banners').select('id').limit(1)

  if (checkError?.code === 'PGRST205') {
    console.error('❌ banners テーブルが存在しません。')
    console.error('')
    console.error('Supabase Dashboard の SQL Editor で以下を実行してください:')
    console.error('─────────────────────────────────')
    console.error(`
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_key TEXT NOT NULL,
  link_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON banners FOR SELECT USING (true);
`)
    console.error('─────────────────────────────────')
  } else {
    console.log('✅ banners テーブルは存在します')
  }

  // Step 2: Create storage bucket
  const { error: bucketError } = await supabase.storage.createBucket('banners', {
    public: true,
  })

  if (bucketError) {
    if (bucketError.message?.includes('already exists')) {
      console.log('✅ banners バケットは既に存在します')
    } else {
      console.error('❌ バケット作成エラー:', bucketError.message)
    }
  } else {
    console.log('✅ banners バケットを作成しました')
  }
}

run().catch(console.error)
