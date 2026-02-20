import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/crypto/encryption'
import { getUSDTBalance, getVolumeForPair } from '@/lib/lbank/api'

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  try {
    // Get all active cups
    const { data: cups, error: cupsError } = await supabase
      .from('cups')
      .select('*')
      .eq('status', 'active')

    if (cupsError) throw cupsError
    if (!cups || cups.length === 0) {
      return NextResponse.json({ message: 'No active cups' })
    }

    const results = []

    for (const cup of cups) {
      const now = new Date()
      const endAt = cup.end_at ? new Date(cup.end_at) : null

      // Auto-end cup if past end time
      if (endAt && now > endAt) {
        await supabase
          .from('cups')
          .update({ status: 'ended' })
          .eq('id', cup.id)
        results.push({ cup_id: cup.id, action: 'ended' })
        continue
      }

      // Get all non-disqualified participants
      const { data: participants } = await supabase
        .from('cup_participants')
        .select(`
          *,
          profiles!inner(id)
        `)
        .eq('cup_id', cup.id)
        .eq('is_disqualified', false)

      if (!participants || participants.length === 0) continue

      const startAt = cup.start_at ? new Date(cup.start_at).getTime() : 0
      const updatedParticipants = []

      for (const participant of participants) {
        try {
          // Get API key for this user
          const { data: apiKey } = await supabase
            .from('exchange_api_keys')
            .select('encrypted_api_key, encrypted_api_secret')
            .eq('user_id', participant.user_id)
            .eq('exchange', 'lbank')
            .single()

          if (!apiKey) continue

          const key = decrypt(apiKey.encrypted_api_key)
          const secret = decrypt(apiKey.encrypted_api_secret)

          const currentBalance = await getUSDTBalance(key, secret)
          const volumeSinceStart = await getVolumeForPair(key, secret, startAt)

          const startBalance = participant.start_balance_usdt ?? currentBalance
          const pnl = currentBalance - startBalance
          const pnlPct = startBalance > 0 ? (pnl / startBalance) * 100 : 0
          const isEligible = volumeSinceStart >= (cup.min_volume_usdt ?? 100)

          // Save snapshot
          await supabase.from('cup_snapshots').insert({
            cup_id: cup.id,
            user_id: participant.user_id,
            balance_usdt: currentBalance,
            volume_since_start: volumeSinceStart,
            pnl_pct: pnlPct,
          })

          // Update participant
          await supabase
            .from('cup_participants')
            .update({
              total_volume_usdt: volumeSinceStart,
              pnl: pnl,
              pnl_pct: pnlPct,
              is_eligible: isEligible,
            })
            .eq('id', participant.id)

          updatedParticipants.push({
            user_id: participant.user_id,
            pnl_pct: pnlPct,
            volume: volumeSinceStart,
          })
        } catch (err) {
          console.error(`Error processing participant ${participant.user_id}:`, err)
        }
      }

      // Update rankings (sort by pnl_pct for eligible participants)
      const eligibleSorted = updatedParticipants
        .sort((a, b) => b.pnl_pct - a.pnl_pct)

      for (let i = 0; i < eligibleSorted.length; i++) {
        await supabase
          .from('cup_participants')
          .update({ rank: i + 1 })
          .eq('cup_id', cup.id)
          .eq('user_id', eligibleSorted[i].user_id)
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
