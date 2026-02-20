export type CupStatus = 'draft' | 'scheduled' | 'active' | 'ended' | 'finalized'
export type Exchange = 'lbank'
export type DisqualifyReason = 'deposit_detected' | 'withdrawal_detected' | 'admin_forced'

export interface Profile {
  id: string
  wallet_address: string
  display_name: string | null
  created_at: string
}

export interface ExchangeApiKey {
  id: string
  user_id: string
  encrypted_api_key: string
  encrypted_api_secret: string
  exchange: Exchange
  is_verified: boolean
  created_at: string
}

export interface Cup {
  id: string
  name: string
  exchange: Exchange
  pair: string
  status: CupStatus
  start_at: string | null
  end_at: string | null
  min_volume_usdt: number
  description: string | null
  created_by: string | null
  created_at: string
}

export interface CupParticipant {
  id: string
  cup_id: string
  user_id: string
  registered_at: string
  start_balance_usdt: number | null
  end_balance_usdt: number | null
  pnl: number | null
  pnl_pct: number | null
  total_volume_usdt: number
  is_disqualified: boolean
  disqualify_reason: string | null
  rank: number | null
  is_eligible: boolean | null
}

export interface CupSnapshot {
  id: string
  cup_id: string
  user_id: string
  snapshot_at: string
  balance_usdt: number | null
  volume_since_start: number | null
  pnl_pct: number | null
}

export interface DisqualificationLog {
  id: string
  cup_id: string | null
  user_id: string | null
  reason: DisqualifyReason
  detected_at: string
  admin_user_id: string | null
}

// Extended types with joins
export interface CupParticipantWithProfile extends CupParticipant {
  profiles: Pick<Profile, 'wallet_address' | 'display_name'>
}

export interface CupWithParticipantCount extends Cup {
  participant_count?: number
  my_participation?: CupParticipant | null
}
