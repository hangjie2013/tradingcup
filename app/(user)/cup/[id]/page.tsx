'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Cup, CupParticipant } from '@/types'
import { RegisterModal } from '@/components/cup/RegisterModal'
import { ConnectButton } from '@/components/wallet/ConnectButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowLeft, Calendar, Users, TrendingUp, Trophy, Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from 'sonner'

export default function CupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [cup, setCup] = useState<Cup & { participant_count?: number } | null>(null)
  const [myParticipation, setMyParticipation] = useState<CupParticipant | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRegister, setShowRegister] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [cupRes] = await Promise.all([
          fetch(`/api/cups/${id}`),
        ])
        if (!cupRes.ok) { router.push('/'); return }
        const { data } = await cupRes.json()
        setCup(data)
      } catch {
        toast.error('大会情報の読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!cup) return null

  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: '下書き', color: 'text-muted-foreground' },
    scheduled: { label: '予定', color: 'text-blue-400' },
    active: { label: '開催中', color: 'text-green-400' },
    ended: { label: '終了', color: 'text-muted-foreground' },
    finalized: { label: '確定', color: 'text-primary' },
  }
  const status = statusConfig[cup.status]

  const canRegister = ['scheduled', 'active'].includes(cup.status) && !myParticipation

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Link>
          <ConnectButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Cup header */}
        <div className="space-y-2 mb-8">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${status.color}`}>
              {cup.status === 'active' && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />}
              {status.label}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{cup.pair} on {cup.exchange.toUpperCase()}</span>
          </div>
          <h1 className="text-3xl font-bold">{cup.name}</h1>
          {cup.description && (
            <p className="text-muted-foreground">{cup.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            {
              icon: Users,
              label: '参加者',
              value: `${cup.participant_count ?? 0}人`,
            },
            {
              icon: TrendingUp,
              label: '最小取引量',
              value: `${cup.min_volume_usdt} USDT`,
            },
            {
              icon: Calendar,
              label: '開始',
              value: cup.start_at ? format(new Date(cup.start_at), 'M月d日 HH:mm', { locale: ja }) : '未定',
            },
            {
              icon: Calendar,
              label: '終了',
              value: cup.end_at ? format(new Date(cup.end_at), 'M月d日 HH:mm', { locale: ja }) : '未定',
            },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="border-border/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </div>
                <div className="font-semibold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rules */}
        <Card className="mb-8 border-border/50">
          <CardContent className="pt-5 space-y-3">
            <h2 className="font-semibold">ルール</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                LBankでのIZKY/USDTの取引のみがカウントされます
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                大会期間中の入出金は即座に失格となります
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                賞品対象となるには {cup.min_volume_usdt} USDT 以上の取引量が必要です
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                ランキングは開始時残高からのPNL%に基づきます
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          {myParticipation ? (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <Trophy className="h-4 w-4" />
              登録済みです！
            </div>
          ) : canRegister ? (
            <Button size="lg" onClick={() => setShowRegister(true)}>
              この大会に参加登録
            </Button>
          ) : null}

          <Link href={`/ranking/${cup.id}`}>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              ランキングを見る
            </Button>
          </Link>
        </div>
      </main>

      <RegisterModal
        cupId={cup.id}
        cupName={cup.name}
        open={showRegister}
        onOpenChange={setShowRegister}
        onSuccess={() => setMyParticipation({ cup_id: cup.id } as CupParticipant)}
      />
    </div>
  )
}
