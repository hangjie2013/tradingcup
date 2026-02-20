'use client'

import { CupParticipant } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react'

interface MyRankCardProps {
  participant: CupParticipant
  totalParticipants: number
}

export function MyRankCard({ participant, totalParticipants }: MyRankCardProps) {
  const pnlPct = participant.pnl_pct ?? 0
  const rank = participant.rank
  const isOutOfRange = !rank || rank > 10

  if (!isOutOfRange) return null

  return (
    <div className="sticky bottom-4 px-4">
      <Card className="border-primary/30 bg-card/90 backdrop-blur shadow-lg">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">自分の順位</div>
              <div className="font-bold text-lg">
                {rank ? `#${rank}` : '圏外'}
                <span className="text-sm text-muted-foreground font-normal ml-1">
                  / {totalParticipants}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                {pnlPct >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span className={`font-mono font-semibold ${pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground hidden sm:flex">
                <BarChart2 className="h-4 w-4" />
                <span className="text-sm font-mono">
                  ${(participant.total_volume_usdt ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <Badge variant={participant.is_eligible ? 'default' : 'secondary'} className="text-xs">
                {participant.is_eligible ? '対象' : '対象外'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
