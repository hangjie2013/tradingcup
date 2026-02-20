'use client'

import { Cup } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow, format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Users, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface CupCardProps {
  cup: Cup & { participant_count?: number }
}

const statusConfig: Record<string, string> = {
  draft: 'Draft',
  scheduled: '予定',
  active: 'ライブ',
  ended: '終了',
  finalized: '確定',
}

export function CupCard({ cup }: CupCardProps) {
  const statusLabel = statusConfig[cup.status] ?? cup.status

  return (
    <div className="bg-card border border-border rounded-xl shadow-[0px_8px_24px_0px_rgba(17,23,61,0.8)] overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground leading-tight">{cup.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {cup.exchange.toUpperCase()} · {cup.pair}
            </p>
          </div>
          {cup.status === 'active' ? (
            <span className="shrink-0 inline-flex items-center rounded-md bg-[#32bd50] px-2.5 py-0.5 text-xs font-medium text-white">
              ライブ
            </span>
          ) : (
            <Badge variant="secondary" className="shrink-0">
              {statusLabel}
            </Badge>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span className="text-sm">
              {cup.status === 'active' && cup.end_at
                ? formatDistanceToNow(new Date(cup.end_at), { locale: ja, addSuffix: true })
                : cup.status === 'scheduled' && cup.start_at
                ? formatDistanceToNow(new Date(cup.start_at), { locale: ja, addSuffix: true })
                : cup.start_at
                ? format(new Date(cup.start_at), 'M/d')
                : '—'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 shrink-0" />
            <span className="text-sm">{cup.participant_count ?? 0}人</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2">
          <TrendingUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            最小取引量: {cup.min_volume_usdt.toLocaleString()} USDT
          </span>
        </div>

        {cup.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{cup.description}</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 mt-2">
        <Link href={`/cup/${cup.id}`}>
          <Button className="w-full bg-primary hover:bg-primary/90 text-white" size="sm">
            大会の詳細を見る
          </Button>
        </Link>
      </div>
    </div>
  )
}
