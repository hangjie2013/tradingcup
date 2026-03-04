import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { createServiceClient } from '@/lib/supabase/server'
import { getJwtSecret } from '@/lib/auth/jwt'

const JWT_SECRET = getJwtSecret()

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('wallet_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ data: [] })
    }

    const { payload } = await jwtVerify(sessionToken, JWT_SECRET)
    const profileId = payload.profile_id as string

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('cup_participants')
      .select('cup_id')
      .eq('user_id', profileId)

    if (error) throw error

    const cupIds = (data ?? []).map((p) => p.cup_id)
    return NextResponse.json({ data: cupIds })
  } catch {
    return NextResponse.json({ data: [] })
  }
}
