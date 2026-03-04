import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cupRepository } from '@/lib/repositories/cup'
import { CupStatus } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as CupStatus | null

    const cups = await cupRepository.findAll(status ? { status } : undefined)

    // 各Cupの参加者数を並行取得
    const cupsWithCount = await Promise.all(
      cups.map(async (cup) => {
        const participant_count = await cupRepository.countParticipants(cup.id)
        return { ...cup, participant_count }
      })
    )

    return NextResponse.json({ data: cupsWithCount })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, exchange, pair, start_at, end_at, min_volume_usdt, min_balance_usdt, description, rewards } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (start_at && end_at && new Date(end_at) < new Date(start_at)) {
      return NextResponse.json({ error: 'end_at must be on or after start_at' }, { status: 400 })
    }

    const cup = await cupRepository.create({
      name,
      exchange: exchange ?? 'lbank',
      pair: pair ?? 'IZKY/USDT',
      start_at,
      end_at,
      min_volume_usdt: min_volume_usdt ?? 100,
      min_balance_usdt: min_balance_usdt ?? 10,
      description,
      rewards: rewards ?? [],
      created_by: user.id,
    })

    return NextResponse.json({ data: cup }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create cup' }, { status: 500 })
  }
}
