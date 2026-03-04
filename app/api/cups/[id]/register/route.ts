import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { decrypt } from '@/lib/crypto/encryption'
import { getTotalBalanceUSDT } from '@/lib/lbank/api'
import { cupRepository } from '@/lib/repositories/cup'
import { cupParticipantRepository } from '@/lib/repositories/cup-participant'
import { exchangeApiKeyRepository } from '@/lib/repositories/exchange-api-key'
import { getJwtSecret } from '@/lib/auth/jwt'

const JWT_SECRET = getJwtSecret()

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: cupId } = await params
    const sessionToken = request.cookies.get('wallet_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'ウォレットが接続されていません。ログインしてください。' }, { status: 401 })
    }

    const { payload } = await jwtVerify(sessionToken, JWT_SECRET)
    const profileId = payload.profile_id as string

    // Check cup exists and is accepting registrations
    const cup = await cupRepository.findById(cupId)
    if (!cup) {
      return NextResponse.json({ error: '大会が見つかりません。' }, { status: 404 })
    }

    // 途中参加不可: scheduled（開始前）のみ参加受付（CLAUDE.md 3.2①）
    if (cup.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'この大会は参加受付を終了しています。参加登録は大会開始前までに行ってください。' },
        { status: 400 }
      )
    }

    // Check already registered
    const existing = await cupParticipantRepository.findByUser(cupId, profileId)
    if (existing) {
      return NextResponse.json({ error: 'この大会にはすでに参加登録済みです。' }, { status: 400 })
    }

    // Get user's LBank API key
    const apiKey = await exchangeApiKeyRepository.findByUser(profileId, 'lbank')
    if (!apiKey) {
      return NextResponse.json(
        { error: 'LBankのAPIキーが登録されていません。「API設定」ページから読み取り専用APIキーを登録してください。' },
        { status: 400 }
      )
    }

    // Get current balance as start_balance
    let decryptedKey: string
    let decryptedSecret: string
    try {
      decryptedKey = decrypt(apiKey.encrypted_api_key)
      decryptedSecret = decrypt(apiKey.encrypted_api_secret)
    } catch (e) {
      console.error('API key decryption failed:', e)
      return NextResponse.json(
        { error: 'APIキーの読み込みに失敗しました。APIキーを再登録してください。' },
        { status: 400 }
      )
    }

    // 最低残高チェック（CLAUDE.md 3.2③ 開始総資産が min_balance_usdt 未満は参加不可）
    // ※ start_balance_usdt は大会開始後の初回バッチで記録する（CLAUDE.md 4.1）
    let currentBalance: number
    try {
      const { totalUSDT } = await getTotalBalanceUSDT(decryptedKey, decryptedSecret)
      currentBalance = totalUSDT
    } catch (e) {
      return NextResponse.json(
        { error: '残高の取得に失敗しました。APIキーが有効か確認してください。LBank側で権限（残高照会）が許可されている必要があります。' },
        { status: 400 }
      )
    }

    const minBalance = cup.min_balance_usdt ?? 10
    if (currentBalance < minBalance) {
      return NextResponse.json(
        { error: `残高が不足しています。参加には最低 ${minBalance} USDT が必要です（現在の残高: ${currentBalance.toFixed(2)} USDT）。` },
        { status: 400 }
      )
    }

    // Register participant（start_balance_usdt は null — 大会開始後の初回バッチで設定）
    const participant = await cupParticipantRepository.create({
      cup_id: cupId,
      user_id: profileId,
    })

    return NextResponse.json({ data: participant }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: '参加登録中にエラーが発生しました。時間をおいて再度お試しください。' }, { status: 500 })
  }
}
