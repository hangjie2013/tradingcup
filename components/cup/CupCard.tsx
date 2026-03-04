'use client'

import { Cup } from '@/types'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Users, Trophy, Gift, CalendarRange, Coins, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface CupCardProps {
  cup: Cup & { participant_count?: number }
  isRegistered?: boolean
}

export function CupCard({ cup, isRegistered = false }: CupCardProps) {
  const isActive    = cup.status === 'active'
  const isScheduled = cup.status === 'scheduled'
  const isEnded     = cup.status === 'ended' || cup.status === 'finalized'

  const formatDate = (d: string | null) =>
    d ? format(new Date(d), 'yyyy.MM.dd', { locale: ja }) : '—'

  const rewardSummary = cup.rewards?.length
    ? cup.rewards.slice(0, 2).map((r) => `${r.rank}: ${r.reward}`).join(' / ')
      + (cup.rewards.length > 2 ? ' …' : '')
    : null

  return (
    <Link
      href={`/cup/${cup.id}`}
      className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-[0px_8px_24px_0px_rgba(17,23,61,0.8)] transition-all hover:-translate-y-0.5 hover:border-accent/60 cursor-pointer"
    >

      {/* Live accent line */}
      {isActive && (
        <div className="h-0.5 w-full bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 shrink-0" />
      )}

      {/* Cover image */}
      <div className="relative aspect-video overflow-hidden bg-card">
        {cup.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cup.cover_image_url}
            alt={cup.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Trophy className="h-14 w-14 text-primary/20" />
          </div>
        )}

        {/* Status badge overlay */}
        <div className="absolute top-3 right-3">
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/20 backdrop-blur-sm border border-green-500/40 px-3 py-1.5 text-xs font-medium text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              ライブ
            </span>
          ) : isScheduled ? (
            <span className="inline-flex items-center rounded-lg bg-blue-500/20 backdrop-blur-sm border border-blue-500/40 px-3 py-1.5 text-xs font-medium text-blue-400">
              受付中
            </span>
          ) : (
            <span className="inline-flex items-center rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {cup.status === 'finalized' ? '確定' : '終了'}
            </span>
          )}
        </div>

        {/* Participant count overlay */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/50 backdrop-blur-sm px-3 py-1.5 text-xs text-white/80">
            <Users className="h-3.5 w-3.5" />
            {cup.participant_count ?? 0}人参加
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-5 gap-4">
        <h2 className="font-bold text-base leading-snug text-foreground line-clamp-2">
          {cup.name}
        </h2>

        {/* Metadata */}
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2.5">
            <CalendarRange className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-muted-foreground">
              {formatDate(cup.start_at)} ～ {formatDate(cup.end_at)}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Coins className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-foreground font-medium">{cup.pair}</span>
            <span className="text-muted-foreground">on {cup.exchange.toUpperCase()}</span>
          </div>
          {rewardSummary && (
            <div className="flex items-start gap-2.5">
              <Gift className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="text-foreground">{rewardSummary}</span>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          {isEnded ? (
            <>
              <span
                role="button"
                onClick={(e) => { e.preventDefault(); window.location.href = `/ranking/${cup.id}` }}
                className="flex-1"
              >
                <Button variant="outline" className="w-full gap-1.5" size="sm">
                  <Trophy className="h-4 w-4" />
                  ランキング
                </Button>
              </span>
              <span className="flex-1">
                <Button variant="ghost" className="w-full" size="sm">
                  詳細を見る
                </Button>
              </span>
            </>
          ) : isRegistered ? (
            <>
              <span className="flex-1">
                <Button
                  variant="outline"
                  className="w-full gap-1.5 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                  size="sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  参加済み
                </Button>
              </span>
              {/* 参加受付中(scheduled)のときはランキング非表示 */}
              {!isScheduled && (
                <span
                  role="button"
                  onClick={(e) => { e.preventDefault(); window.location.href = `/ranking/${cup.id}` }}
                >
                  <Button variant="outline" className="gap-1.5" size="sm">
                    <Trophy className="h-4 w-4" />
                    ランキング
                  </Button>
                </span>
              )}
            </>
          ) : (
            <>
              <span className="flex-1">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white" size="sm">
                  参加登録
                </Button>
              </span>
              {/* 参加受付中(scheduled)のときはランキング非表示 */}
              {!isScheduled && (
                <span
                  role="button"
                  onClick={(e) => { e.preventDefault(); window.location.href = `/ranking/${cup.id}` }}
                >
                  <Button variant="outline" className="gap-1.5" size="sm">
                    <Trophy className="h-4 w-4" />
                    ランキング
                  </Button>
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
