'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Cup, CupParticipant, CupParticipantWithProfile } from '@/types'
import { RegisterModal } from '@/components/cup/RegisterModal'
import { ConnectButton } from '@/components/wallet/ConnectButton'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft, Calendar, Users, TrendingUp, Trophy, Loader2, Zap, CheckCircle2, Gift,
} from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from 'sonner'

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function CupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [cup, setCup] = useState<Cup & { participant_count?: number } | null>(null)
  const [myParticipation, setMyParticipation] = useState<CupParticipant | null>(null)
  const [participants, setParticipants] = useState<CupParticipantWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showRegister, setShowRegister] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [cupRes, rankRes] = await Promise.all([
          fetch(`/api/cups/${id}`),
          fetch(`/api/cups/${id}/ranking`),
        ])
        if (!cupRes.ok) { router.push('/'); return }
        const { data } = await cupRes.json()
        setCup(data)
        if (rankRes.ok) {
          const { data: rankData } = await rankRes.json()
          setParticipants(rankData ?? [])
        }
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

  const isActive = cup.status === 'active'
  const isScheduled = cup.status === 'scheduled'
  const isEnded = cup.status === 'ended' || cup.status === 'finalized'
  const canRegister = ['scheduled', 'active'].includes(cup.status) && !myParticipation

  const top10 = participants.slice(0, 10)

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Link>
          <ConnectButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[300px] sm:min-h-[400px] flex items-end overflow-hidden">
        {/* Background */}
        {cup.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cup.cover_image_url}
            alt={cup.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#171f52] via-[#1d2766] to-[#243189]">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Trophy className="h-64 w-64 text-white" />
            </div>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

        {/* Hero content */}
        <div className="relative container mx-auto px-4 pb-10 pt-20 max-w-3xl w-full">
          {/* Status badge */}
          <div className="flex items-center gap-2 mb-3">
            {isActive && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-green-500/20 border border-green-500/40 px-2.5 py-1 text-xs font-medium text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                ライブ開催中
              </span>
            )}
            {isScheduled && (
              <span className="inline-flex items-center rounded-md bg-blue-500/20 border border-blue-500/40 px-2.5 py-1 text-xs font-medium text-blue-400">
                参加受付中
              </span>
            )}
            {isEnded && (
              <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {cup.status === 'finalized' ? '確定' : '終了'}
              </span>
            )}
            <span className="text-sm text-muted-foreground">{cup.pair} on {cup.exchange.toUpperCase()}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">{cup.name}</h1>

          {/* Quick stats */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {cup.participant_count ?? 0}人参加
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              最小取引量 {cup.min_volume_usdt.toLocaleString()} USDT
            </span>
            {cup.start_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {format(new Date(cup.start_at), 'M月d日 HH:mm', { locale: ja })} 〜
              </span>
            )}
          </div>

          {/* CTA */}
          <div className="flex flex-wrap gap-3">
            {myParticipation ? (
              <span className="inline-flex items-center gap-2 text-sm text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                参加登録済み
              </span>
            ) : canRegister ? (
              <Button size="lg" onClick={() => setShowRegister(true)}>
                <Zap className="h-4 w-4 mr-2" />
                この大会に参加登録
              </Button>
            ) : null}
            <Link href={`/ranking/${cup.id}`}>
              <Button size="lg" variant="outline">
                <Trophy className="h-4 w-4 mr-2" />
                ランキングを見る
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10 max-w-3xl space-y-12">

        {/* 大会概要 */}
        {cup.description && (
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-l-4 border-primary pl-3">
              大会概要
            </h2>
            <p className="text-muted-foreground leading-relaxed">{cup.description}</p>
          </section>
        )}

        {/* 大会詳細 */}
        <section>
          <h2 className="text-lg font-bold mb-4 border-l-4 border-primary pl-3">大会詳細</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Users, label: '参加者', value: `${cup.participant_count ?? 0}人` },
              { icon: TrendingUp, label: '最小取引量', value: `${cup.min_volume_usdt.toLocaleString()} USDT` },
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
              <div key={label} className="bg-card border border-border rounded-xl px-4 py-3 shadow-[0px_4px_12px_0px_rgba(17,23,61,0.6)]">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </div>
                <div className="font-semibold text-sm">{value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 報酬 */}
        {cup.rewards?.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 border-l-4 border-primary pl-3 flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              入賞報酬
            </h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-[0px_8px_24px_0px_rgba(17,23,61,0.8)]">
              {cup.rewards.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-5 py-4 ${
                    i < cup.rewards.length - 1 ? 'border-b border-border/60' : ''
                  } ${i === 0 ? 'bg-primary/5' : ''}`}
                >
                  <span className={`font-semibold text-sm ${i === 0 ? 'text-primary' : 'text-foreground'}`}>
                    {r.rank}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">{r.reward}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 現在の順位 */}
        {top10.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 border-l-4 border-primary pl-3">現在の順位</h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-[0px_8px_24px_0px_rgba(17,23,61,0.8)]">
              {top10.map((p, i) => {
                const name = p.profiles?.display_name ?? shortenAddress(p.profiles?.wallet_address ?? '---')
                const pnl = p.pnl_pct != null ? `${p.pnl_pct >= 0 ? '+' : ''}${p.pnl_pct.toFixed(2)}%` : '—'
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 px-5 py-3 ${
                      i < top10.length - 1 ? 'border-b border-border/60' : ''
                    }`}
                  >
                    <span className={`w-6 text-center text-sm font-bold shrink-0 ${
                      i === 0 ? 'text-yellow-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'
                    }`}>
                      {p.rank ?? i + 1}
                    </span>
                    <span className="flex-1 text-sm truncate">{name}</span>
                    <span className={`text-sm font-semibold tabular-nums ${
                      p.pnl_pct != null && p.pnl_pct >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {pnl}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 text-right">
              <Link href={`/ranking/${cup.id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                全順位を見る →
              </Link>
            </div>
          </section>
        )}

        {/* ルール */}
        <section>
          <h2 className="text-lg font-bold mb-4 border-l-4 border-primary pl-3">ルール</h2>
          <div className="bg-card border border-border rounded-xl px-5 py-4 space-y-3 shadow-[0px_8px_24px_0px_rgba(17,23,61,0.8)]">
            {[
              `LBankでのIZKY/USDTの取引のみがカウントされます`,
              `大会期間中の入出金は即座に失格となります`,
              `賞品対象となるには ${cup.min_volume_usdt.toLocaleString()} USDT 以上の取引量が必要です`,
              `ランキングは開始時残高からのPNL%に基づきます`,
              `参加は大会開始時点で締め切ります`,
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="text-primary font-bold mt-0.5 shrink-0">0{i + 1}</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 参加方法 */}
        <section>
          <h2 className="text-lg font-bold mb-4 border-l-4 border-primary pl-3">参加方法</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { step: '01', title: 'LBank登録', desc: 'LBankで口座を開設しIZKY/USDTを準備' },
              { step: '02', title: 'API登録', desc: '読み取り専用APIキーをTradingCupに登録' },
              { step: '03', title: '参加登録', desc: 'この大会に参加登録を完了させる' },
              { step: '04', title: '取引開始', desc: '大会期間中にIZKY/USDTを取引して順位を上げる' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-card border border-border rounded-xl p-4 shadow-[0px_4px_12px_0px_rgba(17,23,61,0.6)]">
                <div className="text-2xl font-black text-primary/30 mb-2 leading-none">{step}</div>
                <div className="text-sm font-semibold mb-1">{title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="flex flex-wrap gap-3 pt-2 pb-4">
          {myParticipation ? (
            <div className="flex-1 rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-400">参加登録済み</p>
                <p className="text-xs text-muted-foreground">大会開始をお待ちください</p>
              </div>
            </div>
          ) : canRegister ? (
            <Button size="lg" onClick={() => setShowRegister(true)} className="flex-1 sm:flex-none">
              <Zap className="h-4 w-4 mr-2" />
              この大会に参加登録
            </Button>
          ) : null}
          <Link href={`/ranking/${cup.id}`}>
            <Button size="lg" variant="outline">
              <Trophy className="h-4 w-4 mr-2" />
              ランキングを見る
            </Button>
          </Link>
        </section>
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
