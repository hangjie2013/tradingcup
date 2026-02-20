import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { createServiceClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto/encryption'
import { getUserInfo } from '@/lib/lbank/api'

const JWT_SECRET = new TextEncoder().encode(
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'fallback-secret'
)

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('wallet_session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { payload } = await jwtVerify(sessionToken, JWT_SECRET)
    const profileId = payload.profile_id as string
    const walletAddress = payload.wallet_address as string

    // Ensure profile exists (recover from DB resets)
    const supabase = createServiceClient()
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profileId)
      .single()

    if (!existingProfile) {
      // Profile missing — re-upsert by wallet address
      const { data: newProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          { wallet_address: walletAddress.toLowerCase() },
          { onConflict: 'wallet_address', ignoreDuplicates: false }
        )
        .select('id')
        .single()

      if (upsertError || !newProfile) {
        console.error('Profile re-create error:', upsertError)
        return NextResponse.json(
          { error: 'Profile not found — please sign out and sign in again' },
          { status: 401 }
        )
      }

      // If a new profile was created with a different ID, the JWT is stale
      if (newProfile.id !== profileId) {
        return NextResponse.json(
          { error: 'Session expired — please sign out and sign in again' },
          { status: 401 }
        )
      }
    }

    const { api_key, api_secret } = await request.json()

    if (!api_key || !api_secret) {
      return NextResponse.json({ error: 'API key and secret required' }, { status: 400 })
    }

    // Verify the key works before saving
    try {
      await getUserInfo(api_key, api_secret)
    } catch {
      return NextResponse.json({ error: 'Invalid API credentials' }, { status: 400 })
    }

    const encryptedKey = encrypt(api_key)
    const encryptedSecret = encrypt(api_secret)

    const { data, error } = await supabase
      .from('exchange_api_keys')
      .upsert(
        {
          user_id: profileId,
          encrypted_api_key: encryptedKey,
          encrypted_api_secret: encryptedSecret,
          exchange: 'lbank',
          is_verified: true,
        },
        { onConflict: 'user_id,exchange' }
      )
      .select('id, exchange, is_verified, created_at')
      .single()

    if (error) {
      const msg = error.message.includes('foreign key')
        ? 'Profile not found — please sign out and sign in again with your wallet'
        : error.message
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Save key error:', error)
    return NextResponse.json({ error: 'Failed to save API key' }, { status: 500 })
  }
}
