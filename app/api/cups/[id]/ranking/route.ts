import { NextRequest, NextResponse } from 'next/server'
import { cupParticipantRepository } from '@/lib/repositories/cup-participant'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: cupId } = await params

    const participants = await cupParticipantRepository.findByCup(cupId)
    return NextResponse.json({ data: participants })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch ranking' }, { status: 500 })
  }
}
