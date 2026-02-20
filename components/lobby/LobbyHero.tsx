'use client'

import { useAccount } from 'wagmi'
import { Info, Trophy } from 'lucide-react'

export function LobbyHero() {
  const { isConnected } = useAccount()

  return (
    <div className="rounded-lg bg-gradient-to-b from-primary to-accent p-6 shadow-[0px_8px_24px_0px_rgba(17,23,61,0.8)]">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="h-8 w-8 text-white shrink-0" />
        <h1 className="text-base font-normal text-white leading-tight">IZKYトレーディングカップ</h1>
      </div>
      <p className="text-sm text-white/90 leading-relaxed mb-4">
        世界中のトレーダーと競い合い、賞品を獲得しよう。すべての取引は実際の取引所データで検証されます。
      </p>
      {!isConnected && (
        <div className="border border-accent/50 bg-accent/10 rounded-lg px-4 py-2.5 flex items-center gap-2">
          <Info className="h-4 w-4 text-white shrink-0" />
          <p className="text-sm text-white">
            トレーディングカップに参加するにはウォレットを接続してください
          </p>
        </div>
      )}
    </div>
  )
}
