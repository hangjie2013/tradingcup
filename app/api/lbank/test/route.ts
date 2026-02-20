import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getUserInfo, getUSDTBalance } from '@/lib/lbank/api'

const JWT_SECRET = new TextEncoder().encode(
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'fallback-secret'
)

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('wallet_session')?.value
  if (!sessionToken) {
    return NextResponse.json({ error: 'Not authenticated — please sign in first' }, { status: 401 })
  }

  try {
    await jwtVerify(sessionToken, JWT_SECRET)
  } catch (e) {
    return NextResponse.json(
      { error: `Session invalid — please sign in again (${e instanceof Error ? e.message : 'JWT error'})` },
      { status: 401 }
    )
  }

  let api_key: string, api_secret: string
  try {
    const body = await request.json()
    api_key = (body.api_key ?? '').trim()
    api_secret = (body.api_secret ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!api_key || !api_secret) {
    return NextResponse.json({ error: 'API key and secret required' }, { status: 400 })
  }

  try {
    const userInfo = await getUserInfo(api_key, api_secret)
    const usdtBalance = await getUSDTBalance(api_key, api_secret)
    return NextResponse.json({
      data: { uid: userInfo.uid, usdt_balance: usdtBalance, connected: true },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'LBank connection failed'
    return NextResponse.json({ error: `LBank API error: ${message}` }, { status: 400 })
  }
}
