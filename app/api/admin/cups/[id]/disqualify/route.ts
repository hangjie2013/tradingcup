import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cupParticipantRepository } from '@/lib/repositories/cup-participant'
import { DisqualifyReason } from '@/types/database'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: cupId } = await params

    // Admin auth check
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { participant_id, reason } = body as {
      participant_id: string
      reason?: DisqualifyReason
    }

    if (!participant_id) {
      return NextResponse.json({ error: 'participant_id is required' }, { status: 400 })
    }

    // Verify participant belongs to this cup (ownership check)
    const participant = await cupParticipantRepository.findById(participant_id)
    if (!participant || participant.cup_id !== cupId) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }
    if (participant.is_disqualified) {
      return NextResponse.json({ error: 'Already disqualified' }, { status: 400 })
    }

    const disqualifyReason: DisqualifyReason = reason ?? 'admin_forced'
    await cupParticipantRepository.disqualify(participant_id, disqualifyReason)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to disqualify participant' }, { status: 500 })
  }
}
