import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cupRepository } from '@/lib/repositories/cup'
import { CupStatus } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as CupStatus | null

    const cups = await cupRepository.findAll(status ? { status } : undefined)
    return NextResponse.json({ data: cups })
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
    const { name, exchange, pair, start_at, end_at, min_volume_usdt, description, rewards } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const cup = await cupRepository.create({
      name,
      exchange: exchange ?? 'lbank',
      pair: pair ?? 'IZKY/USDT',
      start_at,
      end_at,
      min_volume_usdt: min_volume_usdt ?? 100,
      description,
      rewards: rewards ?? [],
      created_by: user.id,
    })

    return NextResponse.json({ data: cup }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create cup' }, { status: 500 })
  }
}
