import { NextRequest, NextResponse } from 'next/server'
import { cupRepository } from '@/lib/repositories/cup'
import { processCupRanking } from '@/lib/cron/process-cup-ranking'

/**
 * Cup ライフサイクル cron
 *
 * 数分間隔（推奨: 2〜5分）で実行し、
 * 大会の開始時刻・終了時刻を迎えた Cup を検知してランキングバッチを実行する。
 *
 * - 開始時刻直後: 全参加者の start_balance_usdt を記録（CLAUDE.md 4.1）
 * - 終了時刻直後: 最終スナップショットを取得（CLAUDE.md 4.2）
 *
 * 30分バッチ（/api/cron/ranking）とは別に動作する。
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 直近5分以内に開始/終了した Cup を検知
    const WINDOW_MS = 5 * 60 * 1000

    const [justStarted, justEnded] = await Promise.all([
      cupRepository.findJustStarted(WINDOW_MS),
      cupRepository.findJustEnded(WINDOW_MS),
    ])

    // 重複排除（開始と終了が同時に該当する短い Cup への対応）
    const cupMap = new Map<string, { cup: typeof justStarted[0]; trigger: string }>()
    for (const cup of justStarted) {
      cupMap.set(cup.id, { cup, trigger: 'start' })
    }
    for (const cup of justEnded) {
      const existing = cupMap.get(cup.id)
      cupMap.set(cup.id, { cup, trigger: existing ? 'start+end' : 'end' })
    }

    if (cupMap.size === 0) {
      return NextResponse.json({ message: 'No cups need lifecycle processing' })
    }

    const results = []

    for (const [, { cup, trigger }] of cupMap) {
      console.log(`Cup lifecycle: processing ${cup.id} (${cup.name}) — trigger: ${trigger}`)
      const result = await processCupRanking(cup)
      results.push({ ...result, trigger })
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Cup lifecycle cron error:', error)
    return NextResponse.json({ error: 'Lifecycle processing failed' }, { status: 500 })
  }
}

// Allow GET for manual triggering in development
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 405 })
  }
  return POST(request)
}
