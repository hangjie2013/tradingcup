'use client'

import { useEffect, useState } from 'react'
import { Cup } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Plus, Loader2, Eye, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from 'sonner'
import { AdminHeader } from '@/components/admin/AdminHeader'

const statusBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; className: string }> = {
  draft:     { label: '下書き', variant: 'outline', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  scheduled: { label: '予定',   variant: 'outline', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  active:    { label: '開催中', variant: 'outline', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  ended:     { label: '終了',   variant: 'outline', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  finalized: { label: '確定',   variant: 'outline', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
}

export default function AdminCupsPage() {
  const [cups, setCups] = useState<Cup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/cups')
        if (!res.ok) throw new Error('取得失敗')
        const { data } = await res.json()
        setCups(data ?? [])
      } catch {
        toast.error('大会一覧の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">大会一覧</h2>
          <Link href="/admin/cups/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              新規作成
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : cups.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              大会がありません。{' '}
              <Link href="/admin/cups/new" className="text-primary hover:underline">
                作成する
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead>名前</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="hidden sm:table-cell">開始</TableHead>
                  <TableHead className="hidden sm:table-cell">終了</TableHead>
                  <TableHead className="hidden sm:table-cell">最低取引量</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cups.map((cup) => {
                  const badge = statusBadge[cup.status]
                  return (
                    <TableRow key={cup.id} className="border-border/30">
                      <TableCell className="font-medium">{cup.name}</TableCell>
                      <TableCell>
                        <Badge variant={badge.variant} className={badge.className}>
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {cup.start_at ? format(new Date(cup.start_at), 'M月d日 HH:mm', { locale: ja }) : '—'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {cup.end_at ? format(new Date(cup.end_at), 'M月d日 HH:mm', { locale: ja }) : '—'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {cup.min_volume_usdt} USDT
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/cups/${cup.id}`}>
                            <Button variant="ghost" size="sm" className="gap-1.5">
                              <Eye className="h-4 w-4" />
                              詳細
                            </Button>
                          </Link>
                          <Link href={`/admin/cups/new?edit=${cup.id}`}>
                            <Button variant="ghost" size="sm" className="gap-1.5">
                              <Pencil className="h-4 w-4" />
                              編集
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  )
}
