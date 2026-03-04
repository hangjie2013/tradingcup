'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'

export default function AdminAccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    load()
  }, [])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      toast.error('パスワードは8文字以上にしてください')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('パスワードが一致しません')
      return
    }

    setUpdating(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('パスワードを変更しました')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'パスワードの変更に失敗しました')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <h2 className="text-xl font-semibold">アカウント情報</h2>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">メールアドレス</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">{user?.email ?? '—'}</span>
                {user?.email_confirmed_at && (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">ユーザーID</Label>
              <p className="text-sm font-mono text-muted-foreground">{user?.id ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">最終ログイン</Label>
              <p className="text-sm text-muted-foreground">
                {user?.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleString('ja-JP')
                  : '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">パスワード変更</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">新しいパスワード</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8文字以上"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">パスワード確認</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="もう一度入力"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" disabled={updating || !newPassword || !confirmPassword}>
                {updating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                パスワードを変更
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
