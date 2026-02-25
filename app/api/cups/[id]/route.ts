import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cupRepository } from '@/lib/repositories/cup'
import { Cup } from '@/types/database'

type Params = { params: Promise<{ id: string }> }

const ALLOWED_PATCH_FIELDS: (keyof Cup)[] = [
  'name', 'description', 'start_at', 'end_at',
  'status', 'min_balance_usdt', 'min_volume_usdt', 'rewards', 'cover_image_url',
] as (keyof Cup)[]

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const cup = await cupRepository.findById(id)
    if (!cup) {
      return NextResponse.json({ error: 'Cup not found' }, { status: 404 })
    }

    const participantCount = await cupRepository.countParticipants(id)
    return NextResponse.json({ data: { ...cup, participant_count: participantCount } })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch cup' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const patch = Object.fromEntries(
      Object.entries(body).filter(([k]) => ALLOWED_PATCH_FIELDS.includes(k as keyof Cup))
    ) as Partial<Cup>

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const cup = await cupRepository.update(id, patch)
    return NextResponse.json({ data: cup })
  } catch {
    return NextResponse.json({ error: 'Failed to update cup' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await cupRepository.delete(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete cup' }, { status: 500 })
  }
}
