'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ImageIcon, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Cup, RewardTier } from '@/types'

interface CupFormProps {
  cup?: Partial<Cup>
  mode?: 'create' | 'edit'
}

export function CupForm({ cup, mode = 'create' }: CupFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(cup?.cover_image_url ?? null)
  const [rewards, setRewards] = useState<RewardTier[]>(
    cup?.rewards?.length ? cup.rewards : [
      { rank: '1位', reward: '' },
      { rank: '2位', reward: '' },
      { rank: '3位', reward: '' },
    ]
  )
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('画像ファイルを選択してください')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('画像は5MB以内にしてください')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...form,
        min_volume_usdt: parseFloat(form.min_volume_usdt),
        start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
        end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
        rewards: rewards.filter(r => r.rank.trim() && r.reward.trim()),
      }

      const url = mode === 'edit' && cup?.id ? `/api/cups/${cup.id}` : '/api/cups'
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

      const { data: savedCup } = await res.json()

      if (imageFile) {
        const cupId = mode === 'edit' ? cup!.id! : savedCup.id
        const fd = new FormData()
        fd.append('file', imageFile)
        const imgRes = await fetch(`/api/cups/${cupId}/cover-image`, { method: 'POST', body: fd })
        if (!imgRes.ok) {
          const err = await imgRes.json()
          throw new Error(err.error ?? '画像のアップロードに失敗しました')
        }
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
      {/* Cover image */}
      <Card>
        <CardHeader>
          <CardTitle>カバー画像</CardTitle>
          <CardDescription>16:9 推奨。JPG / PNG、5MB以内。</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="cursor-pointer block">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <div className="relative aspect-video rounded-lg overflow-hidden border border-dashed border-border bg-muted/20 flex items-center justify-center hover:bg-muted/30 transition-colors">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="カバー画像プレビュー" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">クリックして画像を選択</p>
                  <p className="text-xs mt-1 opacity-60">16:9 推奨</p>
                </div>
              )}
            </div>
          </label>
          {imagePreview && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              画像を削除
            </button>
          )}
        </CardContent>
      </Card>

      {/* Rewards */}
      <Card>
        <CardHeader>
          <CardTitle>報酬設定</CardTitle>
          <CardDescription>各順位の報酬を設定します（任意）。空欄の行は保存されません。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rewards.map((r, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                placeholder="順位 (例: 1位)"
                value={r.rank}
                onChange={(e) => {
                  const next = [...rewards]
                  next[i] = { ...next[i], rank: e.target.value }
                  setRewards(next)
                }}
                className="w-28 shrink-0"
              />
              <Input
                placeholder="報酬 (例: 10,000 IZKY)"
                value={r.reward}
                onChange={(e) => {
                  const next = [...rewards]
                  next[i] = { ...next[i], reward: e.target.value }
                  setRewards(next)
                }}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => setRewards(rewards.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRewards([...rewards, { rank: '', reward: '' }])}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            行を追加
          </Button>
        </CardContent>
      </Card>

      {/* Cup details */}
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
