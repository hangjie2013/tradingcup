import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/crypto/encryption'
import { getUSDTBalance, getVolumeForPair } from '@/lib/lbank/api'
import { cupRepository } from '@/lib/repositories/cup'
import { cupParticipantRepository } from '@/lib/repositories/cup-participant'
import { exchangeApiKeyRepository } from '@/lib/repositories/exchange-api-key'

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cups = await cupRepository.findAll({ status: 'active' })

    if (!cups || cups.length === 0) {
      return NextResponse.json({ message: 'No active cups' })
    }

    const results = []

    for (const cup of cups) {
      const now = new Date()
      const endAt = cup.end_at ? new Date(cup.end_at) : null

      // Auto-end cup if past end time
      if (endAt && now > endAt) {
        await cupRepository.update(cup.id, { status: 'ended' })
        results.push({ cup_id: cup.id, action: 'ended' })
        continue
      }

      // Get all non-disqualified participants
      const participants = await cupParticipantRepository.findByCupWithApiKeys(cup.id)
      if (!participants || participants.length === 0) continue

      const startAt = cup.start_at ? new Date(cup.start_at).getTime() : 0
      const updatedParticipants: { user_id: string; pnl_pct: number; volume: number }[] = []

      for (const participant of participants) {
        try {
          // Get API key for this user
          const apiKey = await exchangeApiKeyRepository.findByUser(participant.user_id, 'lbank')
          if (!apiKey) continue

          const key = decrypt(apiKey.encrypted_api_key)
          const secret = decrypt(apiKey.encrypted_api_secret)

          const currentBalance = await getUSDTBalance(key, secret)
          const volumeSinceStart = await getVolumeForPair(key, secret, startAt)

          const startBalance = participant.start_balance_usdt ?? currentBalance
          const pnl = currentBalance - startBalance
          const pnlPct = startBalance > 0 ? (pnl / startBalance) * 100 : 0
          const isEligible = volumeSinceStart >= (cup.min_volume_usdt ?? 100)

          // Save snapshot (event-sourced record — never overwritten)
          await cupParticipantRepository.saveSnapshot({
            cup_id: cup.id,
            user_id: participant.user_id,
            balance_usdt: currentBalance,
            volume_since_start: volumeSinceStart,
            pnl_pct: pnlPct,
          })

          // Update cached stats on participant row
          await cupParticipantRepository.updateStats(participant.id, {
            pnl,
            pnl_pct: pnlPct,
            total_volume_usdt: volumeSinceStart,
            is_eligible: isEligible,
          })

          updatedParticipants.push({
            user_id: participant.user_id,
            pnl_pct: pnlPct,
            volume: volumeSinceStart,
          })
        } catch (err) {
          console.error(`Error processing participant ${participant.user_id}:`, err)
        }
      }

      // Update rankings (sort by pnl_pct)
      const sorted = [...updatedParticipants].sort((a, b) => b.pnl_pct - a.pnl_pct)
      for (let i = 0; i < sorted.length; i++) {
        await cupParticipantRepository.updateRank(cup.id, sorted[i].user_id, i + 1)
      }

      results.push({ cup_id: cup.id, updated: updatedParticipants.length })
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
