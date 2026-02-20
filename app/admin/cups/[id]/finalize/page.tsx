'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Cup, CupParticipantWithProfile } from '@/types'
import { FinalizeButton } from '@/components/admin/FinalizeButton'
import { RankingTable } from '@/components/ranking/RankingTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Trophy } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function FinalizeResultsPage() {
  const { id } = useParams<{ id: string }>()
  const [cup, setCup] = useState<Cup | null>(null)
  const [participants, setParticipants] = useState<CupParticipantWithProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [cupRes, rankRes] = await Promise.all([
          fetch(`/api/cups/${id}`),
          fetch(`/api/cups/${id}/ranking`),
        ])
        if (cupRes.ok) setCup((await cupRes.json()).data)
        if (rankRes.ok) setParticipants((await rankRes.json()).data ?? [])
      } catch {
        toast.error('読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href={`/admin/cups/${id}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4" />
            大会に戻る
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">結果を確定</h1>
            <p className="text-muted-foreground text-sm mt-1">{cup?.name}</p>
          </div>
          {cup?.status === 'ended' && <FinalizeButton cupId={id} />}
        </div>

        {cup?.status === 'finalized' && (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-400">
            <Trophy className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">結果が確定しました</p>
              <p className="text-sm opacity-80">ランキングとPNL値がロックされました。</p>
            </div>
          </div>
        )}

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">最終ランキング ({participants.length}人)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <RankingTable participants={participants} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
