import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cupRepository } from '@/lib/repositories/cup'
import { Cup, CupDbStatus } from '@/types/database'

type Params = { params: Promise<{ id: string }> }

const ALLOWED_PATCH_FIELDS: (keyof Cup)[] = [
  'name', 'description', 'start_at', 'end_at',
  'status', 'min_balance_usdt', 'min_volume_usdt', 'rewards', 'cover_image_url',
] as (keyof Cup)[]

const VALID_DB_STATUSES: CupDbStatus[] = ['draft', 'published', 'finalized']

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

    // 確定済みカップは変更不可（CLAUDE.md: 確定後は順位変更不可）
    const currentCup = await cupRepository.findById(id)
    if (!currentCup) {
      return NextResponse.json({ error: 'Cup not found' }, { status: 404 })
    }
    if (currentCup.status === 'finalized') {
      return NextResponse.json(
        { error: 'Finalized cup cannot be modified' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const patch = Object.fromEntries(
      Object.entries(body).filter(([k]) => ALLOWED_PATCH_FIELDS.includes(k as keyof Cup))
    ) as Partial<Cup>

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // status は DB保存値（draft / published / finalized）のみ受け付ける
    if (patch.status && !VALID_DB_STATUSES.includes(patch.status as CupDbStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${VALID_DB_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // 終了日時 >= 開始日時 バリデーション
    const effectiveStartAt = patch.start_at ?? currentCup.start_at
    const effectiveEndAt = patch.end_at ?? currentCup.end_at
    if (effectiveStartAt && effectiveEndAt && new Date(effectiveEndAt) < new Date(effectiveStartAt)) {
      return NextResponse.json(
        { error: 'end_at must be on or after start_at' },
        { status: 400 }
      )
    }

    let cup
    try {
      cup = await cupRepository.update(id, patch)
    } catch (dbError) {
      // min_balance_usdt カラム未適用時のフォールバック: 該当フィールドを除外して再試行
      const dbMsg = dbError instanceof Error ? dbError.message : String(dbError)
      if (dbMsg.includes('min_balance_usdt')) {
        const { min_balance_usdt: _, ...safePatch } = patch as Record<string, unknown>
        if (Object.keys(safePatch).length === 0) {
          return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
        }
        cup = await cupRepository.update(id, safePatch as Partial<Cup>)
      } else {
        throw dbError
      }
    }
    return NextResponse.json({ data: cup })
  } catch (error) {
    console.error('Failed to update cup:', error)
    const message = error instanceof Error ? error.message : 'Failed to update cup'
    return NextResponse.json({ error: message }, { status: 500 })
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
