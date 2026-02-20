'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Cup, CupParticipantWithProfile, CupParticipant } from '@/types'
import { RankingTable } from '@/components/ranking/RankingTable'
import { MyRankCard } from '@/components/ranking/MyRankCard'
import { ConnectButton } from '@/components/wallet/ConnectButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RefreshCw, Loader2, Trophy } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'

export default function RankingPage() {
  const { id } = useParams<{ id: string }>()
  const { address } = useAccount()

  const [cup, setCup] = useState<Cup | null>(null)
  const [participants, setParticipants] = useState<CupParticipantWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchRanking = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const [cupRes, rankRes] = await Promise.all([
        fetch(`/api/cups/${id}`),
        fetch(`/api/cups/${id}/ranking`),
      ])

      if (cupRes.ok) {
        const { data } = await cupRes.json()
        setCup(data)
      }
      if (rankRes.ok) {
        const { data } = await rankRes.json()
        setParticipants(data ?? [])
        setLastUpdated(new Date())
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    fetchRanking()
    const interval = setInterval(() => fetchRanking(true), 30 * 1000)
    return () => clearInterval(interval)
  }, [fetchRanking])

  const myParticipant = address
    ? participants.find(
        (p) => p.profiles?.wallet_address === address.toLowerCase()
      ) as CupParticipant | undefined
    : undefined

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href={`/cup/${id}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4" />
            大会に戻る
          </Link>
          <ConnectButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Title */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">{cup?.name ?? 'ランキング'}</h1>
              {cup?.status === 'active' && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                  開催中
                </Badge>
              )}
            </div>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ja })}に更新
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRanking(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <RankingTable participants={participants} currentUserWallet={address} />
      </main>

      {myParticipant && (
        <MyRankCard participant={myParticipant} totalParticipants={participants.length} />
      )}
    </div>
  )
}
