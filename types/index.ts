export * from './database'

export interface WalletAuthSession {
  wallet_address: string
  profile_id: string
  expires_at: number
}

export interface LBankBalance {
  asset: string
  available: string
  freeze: string
}

export interface LBankTradeInfo {
  symbol: string
  volume: string
  amount: string
  side: string
  time: string
}

export interface RankingEntry {
  rank: number
  user_id: string
  wallet_address: string
  display_name: string | null
  pnl_pct: number
  total_volume_usdt: number
  is_eligible: boolean
  is_disqualified: boolean
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}
