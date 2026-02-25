import { createServiceClient } from '@/lib/supabase/server'
import { CupParticipant, CupParticipantWithProfile, DisqualifyReason } from '@/types/database'

export interface CupParticipantCreateInput {
  cup_id: string
  user_id: string
  start_balance_usdt?: number | null
}

export interface RankingUpdate {
  user_id: string
  pnl: number
  pnl_pct: number
  total_volume_usdt: number
  is_eligible: boolean
  rank?: number
}

export const cupParticipantRepository = {
  async findByUser(cupId: string, userId: string): Promise<CupParticipant | null> {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('cup_participants')
      .select('*')
      .eq('cup_id', cupId)
      .eq('user_id', userId)
      .single()
    return data ?? null
  },

  async findById(participantId: string): Promise<CupParticipant | null> {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('cup_participants')
      .select('*')
      .eq('id', participantId)
      .single()
    return data ?? null
  },

  async findByCup(cupId: string): Promise<CupParticipantWithProfile[]> {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('cup_participants')
      .select(`
        *,
        profiles (
          wallet_address,
          display_name
        )
      `)
      .eq('cup_id', cupId)
      .eq('is_disqualified', false)
      .order('rank', { ascending: true, nullsFirst: false })

    if (error) throw error
    return (data ?? []) as CupParticipantWithProfile[]
  },

  async findByCupAll(cupId: string): Promise<CupParticipant[]> {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('cup_participants')
      .select('*')
      .eq('cup_id', cupId)

    if (error) throw error
    return data ?? []
  },

  async findByCupWithApiKeys(cupId: string): Promise<CupParticipant[]> {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('cup_participants')
      .select(`*, profiles!inner(id)`)
      .eq('cup_id', cupId)
      .eq('is_disqualified', false)

    if (error) throw error
    return data ?? []
  },

  async create(input: CupParticipantCreateInput): Promise<CupParticipant> {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('cup_participants')
      .insert({
        cup_id: input.cup_id,
        user_id: input.user_id,
        start_balance_usdt: input.start_balance_usdt,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async disqualify(participantId: string, reason: DisqualifyReason): Promise<void> {
    const supabase = createServiceClient()
    const { error } = await supabase
      .from('cup_participants')
      .update({ is_disqualified: true, disqualify_reason: reason })
      .eq('id', participantId)
    if (error) throw error
  },

  async updateStats(
    participantId: string,
    stats: Pick<RankingUpdate, 'pnl' | 'pnl_pct' | 'total_volume_usdt' | 'is_eligible'>
  ): Promise<void> {
    const supabase = createServiceClient()
    const { error } = await supabase
      .from('cup_participants')
      .update({
        total_volume_usdt: stats.total_volume_usdt,
        pnl: stats.pnl,
        pnl_pct: stats.pnl_pct,
        is_eligible: stats.is_eligible,
      })
      .eq('id', participantId)
    if (error) throw error
  },

  async updateRank(cupId: string, userId: string, rank: number): Promise<void> {
    const supabase = createServiceClient()
    const { error } = await supabase
      .from('cup_participants')
      .update({ rank })
      .eq('cup_id', cupId)
      .eq('user_id', userId)
    if (error) throw error
  },

  async saveSnapshot(snapshot: {
    cup_id: string
    user_id: string
    balance_usdt: number
    volume_since_start: number
    pnl_pct: number
  }): Promise<void> {
    const supabase = createServiceClient()
    const { error } = await supabase.from('cup_snapshots').insert(snapshot)
    if (error) throw error
  },
}
