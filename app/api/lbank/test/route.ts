import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import {
  getUserInfo, getUSDTBalance, getAccountBalance, getAccountBalanceRaw,
  getTransactionHistoryRaw, getVolumeForPair, getTotalBalanceUSDT,
} from '@/lib/lbank/api'
import { getJwtSecret } from '@/lib/auth/jwt'

const JWT_SECRET = getJwtSecret()

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
    const rawBalance = await getAccountBalanceRaw(api_key, api_secret)
    const allBalances = await getAccountBalance(api_key, api_secret)
    const usdtBalance = await getUSDTBalance(api_key, api_secret)
    const { totalUSDT, izkyPrice } = await getTotalBalanceUSDT(api_key, api_secret)

    // 保有アセットから IZKY 系のシンボル候補を推定
    const izkyAsset = allBalances.find((b) =>
      b.asset.toLowerCase().includes('izky') || b.asset.toLowerCase().includes('izakaya')
    )

    // 取引履歴: エラーでも他の結果は返す
    let rawTrades: unknown = null
    let tradesError: string | null = null
    let volume = 0
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    try {
      rawTrades = await getTransactionHistoryRaw(api_key, api_secret, 'izky_usdt', thirtyDaysAgo, 10)
      volume = await getVolumeForPair(api_key, api_secret, thirtyDaysAgo)
    } catch (e) {
      tradesError = e instanceof Error ? e.message : String(e)
    }

    return NextResponse.json({
      data: {
        uid: userInfo.uid,
        usdt_balance: usdtBalance,
        total_balance_usdt: totalUSDT,
        izky_price: izkyPrice,
        balances: allBalances,
        izky_asset_found: izkyAsset ?? null,
        volume_usdt_30d: volume,
        trades_error: tradesError,
        _debug_raw_balance: rawBalance,
        _debug_raw_trades: rawTrades,
        connected: true,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'LBank connection failed'
    return NextResponse.json({ error: `LBank API error: ${message}` }, { status: 400 })
  }
}
