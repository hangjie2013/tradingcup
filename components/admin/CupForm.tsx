'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Cup } from '@/types'

interface CupFormProps {
  cup?: Partial<Cup>
  mode?: 'create' | 'edit'
}

export function CupForm({ cup, mode = 'create' }: CupFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: cup?.name ?? '',
    description: cup?.description ?? '',
    pair: cup?.pair ?? 'IZKY/USDT',
    exchange: cup?.exchange ?? 'lbank',
    min_volume_usdt: cup?.min_volume_usdt?.toString() ?? '100',
    start_at: cup?.start_at ? new Date(cup.start_at).toISOString().slice(0, 16) : '',
    end_at: cup?.end_at ? new Date(cup.end_at).toISOString().slice(0, 16) : '',
    status: cup?.status ?? 'draft',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...form,
        min_volume_usdt: parseFloat(form.min_volume_usdt),
        start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
        end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
      }

      const url = mode === 'edit' && cup?.id
        ? `/api/cups/${cup.id}`
        : '/api/cups'
      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? '保存に失敗しました')
      }

      toast.success(mode === 'create' ? '大会を作成しました！' : '変更を保存しました！')
      router.push('/admin/cups')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">大会名 *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="IZKY Trading Cup #1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="大会の説明とルール..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pair">取引ペア</Label>
              <Input
                id="pair"
                value={form.pair}
                onChange={(e) => setForm({ ...form, pair: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exchange">取引所</Label>
              <Select
                value={form.exchange}
                onValueChange={(v) => setForm({ ...form, exchange: v as 'lbank' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lbank">LBank</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_volume">最小取引量 (USDT)</Label>
            <Input
              id="min_volume"
              type="number"
              min="0"
              step="1"
              value={form.min_volume_usdt}
              onChange={(e) => setForm({ ...form, min_volume_usdt: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_at">開始日時</Label>
              <Input
                id="start_at"
                type="datetime-local"
                value={form.start_at}
                onChange={(e) => setForm({ ...form, start_at: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_at">終了日時</Label>
              <Input
                id="end_at"
                type="datetime-local"
                value={form.end_at}
                onChange={(e) => setForm({ ...form, end_at: e.target.value })}
              />
            </div>
          </div>

          {mode === 'edit' && (
            <div className="space-y-2">
              <Label htmlFor="status">ステータス</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as import('@/types').CupStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">下書き</SelectItem>
                  <SelectItem value="scheduled">予定</SelectItem>
                  <SelectItem value="active">開催中</SelectItem>
                  <SelectItem value="ended">終了</SelectItem>
                  <SelectItem value="finalized">確定</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 保存中...</>
          ) : (
            mode === 'create' ? '大会を作成' : '変更を保存'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          キャンセル
        </Button>
      </div>
    </form>
  )
}
