import { NextRequest, NextResponse } from 'next/server'
import { verifyMessage } from 'viem'
import { createServiceClient } from '@/lib/supabase/server'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'fallback-secret'
)

export async function POST(request: NextRequest) {
  try {
    const { wallet_address, message, signature } = await request.json()

    if (!wallet_address || !message || !signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the signature
    const address = wallet_address as `0x${string}`
    const isValid = await verifyMessage({
      address,
      message,
      signature: signature as `0x${string}`,
    })

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Extract nonce and timestamp from message to prevent replay attacks
    const timestampMatch = message.match(/Timestamp: (\d+)/)
    if (timestampMatch) {
      const timestamp = parseInt(timestampMatch[1])
      const now = Date.now()
      if (now - timestamp > 5 * 60 * 1000) {
        return NextResponse.json({ error: 'Signature expired' }, { status: 401 })
      }
    }

    const supabase = createServiceClient()

    // Upsert profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert(
        { wallet_address: wallet_address.toLowerCase() },
        { onConflict: 'wallet_address', ignoreDuplicates: false }
      )
      .select()
      .single()

    if (profileError) {
      console.error('Profile upsert error:', profileError)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    // Create JWT session token
    const token = await new SignJWT({
      wallet_address: wallet_address.toLowerCase(),
      profile_id: profile.id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    const response = NextResponse.json({ success: true, profile })
    response.cookies.set('wallet_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Wallet auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('wallet_session')
  return response
}
