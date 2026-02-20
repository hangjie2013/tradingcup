'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface RegisterModalProps {
  cupId: string
  cupName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RegisterModal({
  cupId,
  cupName,
  open,
  onOpenChange,
  onSuccess,
}: RegisterModalProps) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cups/${cupId}/register`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? '登録に失敗しました')
      }

      setDone(true)
      toast.success('参加登録が完了しました！')
      onSuccess?.()
      setTimeout(() => {
        onOpenChange(false)
        setDone(false)
      }, 1500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '登録に失敗しました'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{cupName} に参加</DialogTitle>
          <DialogDescription>
            この取引カップに参加登録します。現在のUSDT残高が開始残高として記録されます。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-sm text-muted-foreground">
            <ul className="space-y-1 list-disc list-inside">
              <li>LBankのAPIキーが認証済みである必要があります</li>
              <li>大会期間中の入出金は即座に失格となります</li>
              <li>賞品対象となるには最小取引量を満たす必要があります</li>
            </ul>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {done && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-400">
              <CheckCircle className="h-4 w-4 shrink-0" />
              参加登録が完了しました！
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleRegister} disabled={loading || done}>
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 登録中...</>
            ) : (
              '登録を確定'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
