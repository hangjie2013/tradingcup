import { Cup, CupStatus, CupDbStatus } from '@/types/database'

/**
 * DB status (draft / published / finalized) と start_at / end_at から
 * 表示用ステータスを算出する。
 *
 * draft     → draft
 * finalized → finalized
 * published → scheduled | active | ended（期間ベース）
 */
export function computeCupStatus(cup: { status: CupDbStatus; start_at: string | null; end_at: string | null }): CupStatus {
  if (cup.status === 'draft') return 'draft'
  if (cup.status === 'finalized') return 'finalized'

  // published の場合: 期間から算出
  const now = new Date()

  if (cup.start_at && now < new Date(cup.start_at)) {
    return 'scheduled'
  }

  if (cup.end_at && now > new Date(cup.end_at)) {
    return 'ended'
  }

  // start_at <= now <= end_at、または日付未設定の場合は active
  return 'active'
}

/**
 * Cup オブジェクトの status を算出値で上書きして返す。
 * DB から取得した Cup をそのまま渡せばよい。
 */
export function withComputedStatus<T extends { status: string; start_at: string | null; end_at: string | null }>(cup: T): T & { status: CupStatus } {
  const computed = computeCupStatus(cup as { status: CupDbStatus; start_at: string | null; end_at: string | null })
  return { ...cup, status: computed }
}
