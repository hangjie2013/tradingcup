import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { exchangeApiKeyRepository } from '@/lib/repositories/exchange-api-key'

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

    const keyStatus = await exchangeApiKeyRepository.findStatusByUser(profileId, 'lbank')
    return NextResponse.json({
      connected: !!keyStatus,
      saved_at: keyStatus?.created_at ?? null,
    })
  } catch {
    return NextResponse.json({ connected: false })
  }
}
