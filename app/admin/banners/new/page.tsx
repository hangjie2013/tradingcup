'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Upload, Loader2, ImageIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

export default function AdminBannerNewPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(selected.type)) {
      toast.error('JPEG、PNG、WebP、GIF のみアップロード可能です')
      return
    }

    if (selected.size > 5 * 1024 * 1024) {
      toast.error('ファイルサイズは5MB以下にしてください')
      return
    }

    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error('画像を選択してください')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      if (linkUrl.trim()) {
        formData.append('link_url', linkUrl.trim())
      }

      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || 'Failed to create banner')
      }

      toast.success('バナーを作成しました')
      router.push('/admin/banners')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'バナーの作成に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/admin/banners" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4" />
            バナー一覧に戻る
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h2 className="text-xl font-semibold mb-6">バナー新規作成</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">バナー画像</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {preview ? (
                <div className="relative rounded-lg overflow-hidden border border-border/50">
                  <Image
                    src={preview}
                    alt="Preview"
                    width={800}
                    height={267}
                    className="w-full h-auto object-cover"
                  />
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/50 p-12 cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">クリックして画像を選択</p>
                  <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, GIF（最大5MB）</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
              {preview && (
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  画像を変更
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">リンク先URL（任意）</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                バナークリック時の遷移先。空欄の場合はリンクなし。
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Link href="/admin/banners">
              <Button type="button" variant="outline">キャンセル</Button>
            </Link>
            <Button type="submit" disabled={submitting || !file}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              作成
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
