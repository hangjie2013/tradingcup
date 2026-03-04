'use client'

import { CupParticipantWithProfile } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Clock, Trophy } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

interface RankingTableProps {
  participants: CupParticipantWithProfile[]
  currentUserWallet?: string
  lastUpdated?: Date | null
}

const medalColors = ['text-yellow-400', 'text-slate-300', 'text-amber-600']

const top3RowBg = [
  'bg-yellow-400/5',
  'bg-slate-300/5',
  'bg-amber-600/5',
]

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function RankingTable({ participants, currentUserWallet, lastUpdated }: RankingTableProps) {
  if (participants.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>まだランキングはありません。大会が開始されていないか、参加者がいません。</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 更新ノートバー */}
      <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {lastUpdated
            ? <span>{formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ja })}に更新</span>
            : <span>更新中...</span>
          }
        </div>
        <span>次回更新: 30分ごと</span>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 bg-muted/20">
              <TableHead className="w-16 text-center">順位</TableHead>
              <TableHead>トレーダー</TableHead>
              <TableHead className="text-right">PNL %</TableHead>
              <TableHead className="text-right hidden sm:table-cell">取引量 (USDT)</TableHead>
              <TableHead className="text-right hidden sm:table-cell">ステータス</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((p, idx) => {
              const rank = p.rank ?? idx + 1
              const isCurrentUser = currentUserWallet &&
                p.profiles?.wallet_address === currentUserWallet.toLowerCase()
              const isTopThree = rank <= 3

              return (
                <TableRow
                  key={p.id}
                  className={`border-border/30 transition-colors ${
                    isCurrentUser
                      ? 'bg-primary/8 border-l-2 border-primary'
                      : isTopThree
                      ? top3RowBg[rank - 1]
                      : ''
                  }`}
                >
                  <TableCell className="text-center font-mono">
                    {isTopThree ? (
                      <span className={`text-lg font-bold ${medalColors[rank - 1]}`}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{rank}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {p.profiles?.display_name ??
                          truncateAddress(p.profiles?.wallet_address ?? '')}
                      </span>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs py-0 h-5">自分</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={
                      (p.pnl_pct ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }>
                      {(p.pnl_pct ?? 0) >= 0 ? '+' : ''}
                      {(p.pnl_pct ?? 0).toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell text-muted-foreground font-mono text-sm">
                    ${(p.total_volume_usdt ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    {p.is_eligible ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        対象
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        対象外
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
