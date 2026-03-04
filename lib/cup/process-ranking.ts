import { decrypt } from '@/lib/crypto/encryption'
import { getTotalBalanceUSDT, getVolumeForPair, getDepositHistory, getWithdrawalHistory } from '@/lib/lbank/api'
import { calculatePNL } from '@/lib/cup/pnl'
import { cupParticipantRepository } from '@/lib/repositories/cup-participant'
import { exchangeApiKeyRepository } from '@/lib/repositories/exchange-api-key'
import { Cup } from '@/types/database'

export interface CupRankingResult {
  cup_id: string
  updated: number
}

/**
 * 1つの Cup に対してランキング処理を実行する。
 * - 入出金チェック（失格判定）
 * - 残高取得・PNL 計算
 * - スナップショット保存
 * - 順位更新
 */
export async function processCupRanking(cup: Cup): Promise<CupRankingResult> {
  const participants = await cupParticipantRepository.findByCupWithApiKeys(cup.id)
  console.log(`[processCupRanking] cup=${cup.id}, participants found: ${participants?.length ?? 0}`)
  if (!participants || participants.length === 0) {
    // デバッグ: findByCupAll で RLS/JOIN の問題を切り分け
    const allParticipants = await cupParticipantRepository.findByCupAll(cup.id)
    console.log(`[processCupRanking] findByCupAll count: ${allParticipants.length}`)
    return { cup_id: cup.id, updated: 0 }
  }

  const startAt = cup.start_at ? new Date(cup.start_at).getTime() : 0
  const updatedParticipants: { user_id: string; pnl_pct: number; volume: number }[] = []

  for (const participant of participants) {
    try {
      const apiKey = await exchangeApiKeyRepository.findByUser(participant.user_id, 'lbank')
      if (!apiKey) continue

      const key = decrypt(apiKey.encrypted_api_key)
      const secret = decrypt(apiKey.encrypted_api_secret)

      // 入出金チェック（CLAUDE.md 3.2② 入出金で失格）
      const now = Date.now()
      try {
        const [deposits, withdrawals] = await Promise.all([
          getDepositHistory(key, secret, startAt, now),
          getWithdrawalHistory(key, secret, startAt, now),
        ])

        if (deposits.length > 0) {
          await cupParticipantRepository.disqualify(participant.id, 'deposit_detected')
          console.log(`Disqualified ${participant.user_id}: deposit detected`)
          continue
        }
        if (withdrawals.length > 0) {
          await cupParticipantRepository.disqualify(participant.id, 'withdrawal_detected')
          console.log(`Disqualified ${participant.user_id}: withdrawal detected`)
          continue
        }
      } catch (dqErr) {
        // 入出金API失敗時はスキップせず処理を続行（失格判定は次回バッチで再試行）
        console.warn(`Deposit/withdrawal check failed for ${participant.user_id}:`, dqErr)
      }

      // CLAUDE.md 4.2: 終了総資産 = USDT残高 + IZKY残高 × 終了時点価格
      const { totalUSDT: currentBalance } = await getTotalBalanceUSDT(key, secret)

      // 出来高取得（失敗しても PNL 計算は続行 — ineligible 扱い）
      let volumeSinceStart = 0
      try {
        volumeSinceStart = await getVolumeForPair(key, secret, startAt)
      } catch (volErr) {
        console.warn(`Volume fetch failed for ${participant.user_id} (treating as 0):`, volErr instanceof Error ? volErr.message : volErr)
      }

      // CLAUDE.md 4.1: 開始総資産は大会開始時刻のAPI取得値
      // start_balance_usdt が未設定 = 大会開始後の初回バッチ → 現在値を開始資産として記録
      let startBalance = participant.start_balance_usdt
      if (!startBalance || startBalance <= 0) {
        startBalance = currentBalance
        await cupParticipantRepository.updateStartBalance(participant.id, startBalance)
        console.log(`Set start_balance_usdt for ${participant.user_id}: ${startBalance}`)
      }

      const { pnl, pnlPct } = calculatePNL(startBalance, currentBalance)
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

  return { cup_id: cup.id, updated: updatedParticipants.length }
}
