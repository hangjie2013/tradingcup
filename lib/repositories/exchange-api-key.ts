import { createServiceClient } from '@/lib/supabase/server'
import { ExchangeApiKey, Exchange } from '@/types/database'

export interface ExchangeApiKeyInput {
  user_id: string
  encrypted_api_key: string
  encrypted_api_secret: string
  exchange: Exchange
  is_verified: boolean
}

export const exchangeApiKeyRepository = {
  async findByUser(
    userId: string,
    exchange: Exchange
  ): Promise<ExchangeApiKey | null> {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('exchange_api_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('exchange', exchange)
      .eq('is_verified', true)
      .maybeSingle()
    return data ?? null
  },

  async findStatusByUser(
    userId: string,
    exchange: Exchange
  ): Promise<{ id: string; created_at: string } | null> {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('exchange_api_keys')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('exchange', exchange)
      .eq('is_verified', true)
      .maybeSingle()
    return data ?? null
  },

  async upsert(
    input: ExchangeApiKeyInput
  ): Promise<Pick<ExchangeApiKey, 'id' | 'exchange' | 'is_verified' | 'created_at'>> {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('exchange_api_keys')
      .upsert(
        {
          user_id: input.user_id,
          encrypted_api_key: input.encrypted_api_key,
          encrypted_api_secret: input.encrypted_api_secret,
          exchange: input.exchange,
          is_verified: input.is_verified,
        },
        { onConflict: 'user_id,exchange' }
      )
      .select('id, exchange, is_verified, created_at')
      .single()

    if (error) throw error
    return data
  },
}
