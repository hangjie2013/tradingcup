import { createServiceClient } from '@/lib/supabase/server'
import { Cup, CupStatus, CupDbStatus } from '@/types/database'
import { withComputedStatus } from '@/lib/cup/status'
import { storageRepository } from '@/lib/storage'

export interface CupCreateInput {
  name: string
  exchange: string
  pair: string
  start_at?: string | null
  end_at?: string | null
  min_volume_usdt?: number
  min_balance_usdt?: number
  description?: string | null
  rewards?: unknown[]
  created_by: string
}

export interface CupFilters {
  /** 表示用ステータスでフィルタ（scheduled/active/ended は published から算出） */
  status?: CupStatus
}

export const cupRepository = {
  async findAll(filters?: CupFilters): Promise<Cup[]> {
    const supabase = createServiceClient()
    let query = supabase
      .from('cups')
      .select('*')
      .order('created_at', { ascending: false })

    // DB保存値で絞れるものはDB側でフィルタ
    if (filters?.status) {
      const dbStatus = toDbStatusFilter(filters.status)
      if (dbStatus) {
        query = query.eq('status', dbStatus)
      }
    }

    const { data, error } = await query
    if (error) throw error

    // 全件に computed status + 画像URL解決を適用
    const cups = (data ?? []).map((c) => withResolvedCoverImage(withComputedStatus(c)))

    // scheduled/active/ended は published を算出後にフィルタ
    if (filters?.status && ['scheduled', 'active', 'ended'].includes(filters.status)) {
      return cups.filter((c) => c.status === filters.status)
    }

    return cups
  },

  async findById(id: string): Promise<Cup | null> {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('cups')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return withResolvedCoverImage(withComputedStatus(data))
  },

  async create(input: CupCreateInput): Promise<Cup> {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('cups')
      .insert({
        name: input.name,
        exchange: input.exchange ?? 'lbank',
        pair: input.pair ?? 'IZKY/USDT',
        start_at: input.start_at,
        end_at: input.end_at,
        min_volume_usdt: input.min_volume_usdt ?? 100,
        min_balance_usdt: input.min_balance_usdt ?? 10,
        description: input.description,
        rewards: input.rewards ?? [],
        created_by: input.created_by,
        status: 'draft' as CupDbStatus,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, patch: Partial<Cup>): Promise<Cup> {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('cups')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return withComputedStatus(data)
  },

  async delete(id: string): Promise<void> {
    const supabase = createServiceClient()
    const { error } = await supabase.from('cups').delete().eq('id', id)
    if (error) throw error
  },

  /**
   * 開始時刻を迎えたばかりの Cup を取得する。
   * 条件: published AND start_at <= now AND start_at > (now - windowMs)
   * → 大会開始直後に開始資産を取得するために使用
   */
  async findJustStarted(windowMs: number = 5 * 60 * 1000): Promise<Cup[]> {
    const supabase = createServiceClient()
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowMs)

    const { data, error } = await supabase
      .from('cups')
      .select('*')
      .eq('status', 'published')
      .lte('start_at', now.toISOString())
      .gte('start_at', windowStart.toISOString())

    if (error) throw error
    return (data ?? []).map((c) => withResolvedCoverImage(withComputedStatus(c)))
  },

  /**
   * 終了時刻を迎えたばかりの Cup を取得する。
   * 条件: published AND end_at <= now AND end_at > (now - windowMs)
   * → 大会終了直後に最終スナップショットを取得するために使用
   */
  async findJustEnded(windowMs: number = 5 * 60 * 1000): Promise<Cup[]> {
    const supabase = createServiceClient()
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowMs)

    const { data, error } = await supabase
      .from('cups')
      .select('*')
      .eq('status', 'published')
      .lte('end_at', now.toISOString())
      .gte('end_at', windowStart.toISOString())

    if (error) throw error
    return (data ?? []).map((c) => withResolvedCoverImage(withComputedStatus(c)))
  },

  async countParticipants(id: string): Promise<number> {
    const supabase = createServiceClient()
    const { count } = await supabase
      .from('cup_participants')
      .select('*', { count: 'exact', head: true })
      .eq('cup_id', id)
    return count ?? 0
  },
}

/** cover_image_key から公開URLを解決し cover_image_url にセットする */
function withResolvedCoverImage<T extends { cover_image_key?: string | null; cover_image_url?: string | null }>(cup: T): T {
  if (cup.cover_image_key) {
    return { ...cup, cover_image_url: storageRepository.getCupCoverUrl(cup.cover_image_key) }
  }
  return cup
}

/** 表示用ステータスをDB保存値に変換（published系は published で絞る） */
function toDbStatusFilter(status: CupStatus): CupDbStatus | null {
  switch (status) {
    case 'draft': return 'draft'
    case 'finalized': return 'finalized'
    case 'scheduled':
    case 'active':
    case 'ended':
      return 'published'
    default:
      return null
  }
}
