import { createServiceClient } from '@/lib/supabase/server'
import { Cup, CupStatus } from '@/types/database'

export interface CupCreateInput {
  name: string
  exchange: string
  pair: string
  start_at?: string | null
  end_at?: string | null
  min_volume_usdt?: number
  description?: string | null
  rewards?: unknown[]
  created_by: string
}

export interface CupFilters {
  status?: CupStatus
}

export const cupRepository = {
  async findAll(filters?: CupFilters): Promise<Cup[]> {
    const supabase = createServiceClient()
    let query = supabase
      .from('cups')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  async findById(id: string): Promise<Cup | null> {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('cups')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
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
        description: input.description,
        rewards: input.rewards ?? [],
        created_by: input.created_by,
        status: 'draft' as CupStatus,
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
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = createServiceClient()
    const { error } = await supabase.from('cups').delete().eq('id', id)
    if (error) throw error
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
