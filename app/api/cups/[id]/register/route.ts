import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { decrypt } from '@/lib/crypto/encryption'
import { getUSDTBalance } from '@/lib/lbank/api'
import { cupRepository } from '@/lib/repositories/cup'
import { cupParticipantRepository } from '@/lib/repositories/cup-participant'
import { exchangeApiKeyRepository } from '@/lib/repositories/exchange-api-key'

const JWT_SECRET = new TextEncoder().encode(
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'fallback-secret'
)

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: cupId } = await params
    const sessionToken = request.cookies.get('wallet_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { payload } = await jwtVerify(sessionToken, JWT_SECRET)
    const profileId = payload.profile_id as string

    // Check cup exists and is accepting registrations
    const cup = await cupRepository.findById(cupId)
    if (!cup) {
      return NextResponse.json({ error: 'Cup not found' }, { status: 404 })
    }

    if (!['scheduled', 'active'].includes(cup.status)) {
      return NextResponse.json(
        { error: 'Cup is not accepting registrations' },
        { status: 400 }
      )
    }

    // Check already registered
    const existing = await cupParticipantRepository.findByUser(cupId, profileId)
    if (existing) {
      return NextResponse.json({ error: 'Already registered' }, { status: 400 })
    }

    // Get user's LBank API key
    const apiKey = await exchangeApiKeyRepository.findByUser(profileId, 'lbank')
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Verified LBank API key required' },
        { status: 400 }
      )
    }

    // Get current balance as start_balance
    const decryptedKey = decrypt(apiKey.encrypted_api_key)
    const decryptedSecret = decrypt(apiKey.encrypted_api_secret)

    let startBalance: number | null = null
    try {
      startBalance = await getUSDTBalance(decryptedKey, decryptedSecret)
    } catch (e) {
      console.warn('Could not fetch balance during registration:', e)
    }

    // Register participant
    const participant = await cupParticipantRepository.create({
      cup_id: cupId,
      user_id: profileId,
      start_balance_usdt: startBalance,
    })

    return NextResponse.json({ data: participant }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
