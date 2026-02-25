import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { createServiceClient } from '@/lib/supabase/server'

const JWT_SECRET = new TextEncoder().encode(
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'fallback-secret'
)

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('wallet_session')?.value
  if (!sessionToken) {
    return NextResponse.json({ connected: false })
  }

  try {
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET)
    const profileId = payload.profile_id as string
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('exchange_api_keys')
      .select('id, created_at')
      .eq('user_id', profileId)
      .eq('exchange', 'lbank')
      .eq('is_verified', true)
      .maybeSingle()

    return NextResponse.json({ connected: !!data, saved_at: data?.created_at ?? null })
  } catch {
    return NextResponse.json({ connected: false })
  }
}
