import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { jwtVerify } from 'jose'
import { decrypt } from '@/lib/crypto/encryption'
import { getUSDTBalance } from '@/lib/lbank/api'

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

    const supabase = createServiceClient()

    // Check cup exists and is accepting registrations
    const { data: cup, error: cupError } = await supabase
      .from('cups')
      .select('*')
      .eq('id', cupId)
      .single()

    if (cupError || !cup) {
      return NextResponse.json({ error: 'Cup not found' }, { status: 404 })
    }

    if (!['scheduled', 'active'].includes(cup.status)) {
      return NextResponse.json(
        { error: 'Cup is not accepting registrations' },
        { status: 400 }
      )
    }

    // Check already registered
    const { data: existing } = await supabase
      .from('cup_participants')
      .select('id')
      .eq('cup_id', cupId)
      .eq('user_id', profileId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already registered' }, { status: 400 })
    }

    // Get user's LBank API key
    const { data: apiKey, error: keyError } = await supabase
      .from('exchange_api_keys')
      .select('*')
      .eq('user_id', profileId)
      .eq('exchange', 'lbank')
      .eq('is_verified', true)
      .single()

    if (keyError || !apiKey) {
      return NextResponse.json(
        { error: 'Verified LBank API key required' },
        { status: 400 }
      )
    }

    // Get current balance as start_balance
    const decryptedKey = decrypt(apiKey.encrypted_api_key)
    const decryptedSecret = decrypt(apiKey.encrypted_api_secret)

    let startBalance = null
    try {
      startBalance = await getUSDTBalance(decryptedKey, decryptedSecret)
    } catch (e) {
      console.warn('Could not fetch balance during registration:', e)
    }

    // Register participant
    const { data: participant, error: regError } = await supabase
      .from('cup_participants')
      .insert({
        cup_id: cupId,
        user_id: profileId,
        start_balance_usdt: startBalance,
      })
      .select()
      .single()

    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 })
    }

    return NextResponse.json({ data: participant }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
