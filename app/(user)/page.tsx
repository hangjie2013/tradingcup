import { CupLobby } from '@/components/cup/CupLobby'
import { ConnectButton } from '@/components/wallet/ConnectButton'
import { CampaignBanner } from '@/components/lobby/CampaignBanner'
import { Trophy, User, Key } from 'lucide-react'
import Link from 'next/link'
import { LbankStatusBadge } from '@/components/wallet/LbankStatusBadge'

export default function LobbyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm shadow-[0px_8px_24px_0px_rgba(13,13,26,0.8)]">
        <div className="container mx-auto flex h-14 items-center px-4 gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-b from-primary to-accent shrink-0">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-bold text-foreground">TradingCup</span>
          </Link>
          <nav className="flex items-stretch h-full">
            <Link
              href="/"
              className="flex items-center px-3 text-sm font-medium text-foreground border-b-2 border-primary cursor-pointer"
            >
              カップ戦
            </Link>
          </nav>
          <div className="ml-auto flex items-stretch h-full gap-1">
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-3 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-border transition-colors cursor-pointer"
            >
              <User className="h-4 w-4" />
              プロフィール
            </Link>
            <Link
              href="/api-settings"
              className="flex items-center gap-1.5 px-3 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-border transition-colors cursor-pointer"
            >
              <Key className="h-4 w-4" />
              API設定
              <LbankStatusBadge />
            </Link>
            <div className="flex items-center ml-2">
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Campaign Banner */}
        <CampaignBanner />

        {/* Cups */}
        <CupLobby />

      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-6 text-center space-y-1">
          <p className="text-xs text-muted-foreground">© 2026 Trading Cup. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">IZKYトークン トレーディング競技プラットフォーム</p>
        </div>
      </footer>
    </div>
  )
}
