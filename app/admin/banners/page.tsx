'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Plus, Loader2, Trash2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface BannerWithUrl {
  id: string
  image_key: string
  image_url: string
  link_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerWithUrl[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBanners()
  }, [])

  const loadBanners = async () => {
    try {
      const res = await fetch('/api/admin/banners')
      if (!res.ok) throw new Error()
      const { data } = await res.json()
      setBanners(data ?? [])
    } catch {
      toast.error('バナー一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const res = await fetch(`/api/admin/banners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !currentActive }),
    })

    if (res.ok) {
      setBanners((prev) =>
        prev.map((b) => (b.id === id ? { ...b, is_active: !currentActive } : b))
      )
      toast.success(currentActive ? 'バナーを無効にしました' : 'バナーを有効にしました')
    } else {
      toast.error('更新に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このバナーを削除しますか？')) return

    const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setBanners((prev) => prev.filter((b) => b.id !== id))
      toast.success('バナーを削除しました')
    } else {
      toast.error('削除に失敗しました')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">バナー管理</h2>
          <Link href="/admin/banners/new">
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
        ) : banners.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              バナーがありません。{' '}
              <Link href="/admin/banners/new" className="text-primary hover:underline">
                作成する
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead>プレビュー</TableHead>
                  <TableHead>リンク</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="hidden sm:table-cell">作成日</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => (
                  <TableRow key={banner.id} className="border-border/30">
                    <TableCell>
                      <Image
                        src={banner.image_url}
                        alt="Banner preview"
                        width={160}
                        height={53}
                        className="rounded object-cover"
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {banner.link_url || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={banner.is_active ? 'default' : 'secondary'}>
                        {banner.is_active ? '有効' : '無効'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {format(new Date(banner.created_at), 'M月d日 HH:mm', { locale: ja })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(banner.id, banner.is_active)}
                          title={banner.is_active ? '無効にする' : '有効にする'}
                        >
                          {banner.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(banner.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  )
}
