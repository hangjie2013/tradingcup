import { NextRequest, NextResponse } from 'next/server'
import { cupRepository } from '@/lib/repositories/cup'
import { processCupRanking } from '@/lib/cron/process-cup-ranking'

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // computedStatus='active' のcupを取得（期間ベースで自動判定）
    const cups = await cupRepository.findAll({ status: 'active' })

    if (!cups || cups.length === 0) {
      return NextResponse.json({ message: 'No active cups' })
    }

    const results = []

    for (const cup of cups) {
      const result = await processCupRanking(cup)
      results.push(result)
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Cron ranking error:', error)
    return NextResponse.json({ error: 'Batch processing failed' }, { status: 500 })
  }
}

// Allow GET for manual triggering in development
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 405 })
  }
  return POST(request)
}
