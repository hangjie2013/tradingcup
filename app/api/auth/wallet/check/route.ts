import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { createServiceClient } from '@/lib/supabase/server'

const JWT_SECRET = new TextEncoder().encode(
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'fallback-secret'
)

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('wallet_session')?.value

  if (!sessionToken) {
    return NextResponse.json({ authenticated: false })
  }

  try {
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET)
    const profileId = payload.profile_id as string

    // Verify profile actually exists in DB (handles DB resets)
    const supabase = createServiceClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profileId)
      .single()

    if (!profile) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({
      authenticated: true,
      wallet_address: payload.wallet_address,
      profile_id: profileId,
    })
  } catch {
    return NextResponse.json({ authenticated: false })
  }
}
