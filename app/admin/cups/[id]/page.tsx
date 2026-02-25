'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Cup, CupParticipantWithProfile } from '@/types'
import { FinalizeButton } from '@/components/admin/FinalizeButton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from 'sonner'

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const statusLabels: Record<string, string> = {
  draft: '下書き',
  scheduled: '予定',
  active: '開催中',
  ended: '終了',
  finalized: '確定',
}

export default function AdminCupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
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

  const handleDisqualify = async (participantId: string, _userId: string) => {
    if (!confirm('この参加者を失格にしますか？')) return

    const res = await fetch(`/api/admin/cups/${id}/disqualify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participant_id: participantId, reason: 'admin_forced' }),
    })

    if (!res.ok) {
      toast.error('失格処理に失敗しました')
    } else {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId
            ? { ...p, is_disqualified: true, disqualify_reason: 'admin_forced' }
            : p
        )
      )
      toast.success('参加者を失格にしました')
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    const res = await fetch(`/api/cups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })

    if (res.ok) {
      const { data } = await res.json()
      setCup(data)
      toast.success(`ステータスを「${statusLabels[newStatus]}」に更新しました`)
    } else {
      toast.error('ステータスの更新に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!cup) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/admin/cups" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4" />
            大会一覧に戻る
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{cup.name}</h1>
              <Badge variant="outline">{statusLabels[cup.status] ?? cup.status}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {cup.pair} · {cup.exchange.toUpperCase()} ·{' '}
              {cup.start_at ? format(new Date(cup.start_at), 'M月d日', { locale: ja }) : '日付未定'} –{' '}
              {cup.end_at ? format(new Date(cup.end_at), 'M月d日 yyyy年', { locale: ja }) : '?'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {cup.status === 'ended' && <FinalizeButton cupId={cup.id} />}
          </div>
        </div>

        {/* Status controls */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ステータス管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {['draft', 'scheduled', 'active', 'ended'].map((s) => (
                <Button
                  key={s}
                  variant={cup.status === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(s)}
                  disabled={cup.status === s || cup.status === 'finalized'}
                >
                  {statusLabels[s]}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              参加者 ({participants.length}人)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {participants.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">まだ参加者はいません</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead>順位</TableHead>
                    <TableHead>トレーダー</TableHead>
                    <TableHead className="text-right">PNL %</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">取引量</TableHead>
                    <TableHead className="text-right">ステータス</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((p) => (
                    <TableRow key={p.id} className={`border-border/30 ${p.is_disqualified ? 'opacity-50' : ''}`}>
                      <TableCell className="font-mono text-muted-foreground">
                        {p.rank ?? '—'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {p.profiles?.display_name ?? truncateAddress(p.profiles?.wallet_address ?? '')}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm ${
                        (p.pnl_pct ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(p.pnl_pct ?? 0) >= 0 ? '+' : ''}{(p.pnl_pct ?? 0).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm hidden sm:table-cell">
                        ${(p.total_volume_usdt ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.is_disqualified ? (
                          <Badge variant="destructive" className="text-xs">失格</Badge>
                        ) : p.is_eligible ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">対象</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">対象外</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!p.is_disqualified && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisqualify(p.id, p.user_id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
