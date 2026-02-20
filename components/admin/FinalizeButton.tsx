'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Trophy } from 'lucide-react'
import { toast } from 'sonner'

interface FinalizeButtonProps {
  cupId: string
}

export function FinalizeButton({ cupId }: FinalizeButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleFinalize = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/cups/${cupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'finalized' }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? '確定に失敗しました')
      }

      toast.success('大会結果を確定しました！')
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '確定に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Trophy className="h-4 w-4" />
        結果を確定
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>大会結果を確定</DialogTitle>
            <DialogDescription>
              大会結果を永久に確定します。ランキングとPNL値がロックされます。この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleFinalize} disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 確定中...</>
              ) : (
                '確定する'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
