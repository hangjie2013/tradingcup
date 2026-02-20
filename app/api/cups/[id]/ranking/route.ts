import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: cupId } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('cup_participants')
      .select(`
        *,
        profiles (
          wallet_address,
          display_name
        )
      `)
      .eq('cup_id', cupId)
      .eq('is_disqualified', false)
      .order('rank', { ascending: true, nullsFirst: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ranking' }, { status: 500 })
  }
}
