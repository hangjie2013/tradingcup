import { CupLobby } from '@/components/cup/CupLobby'
import { ConnectButton } from '@/components/wallet/ConnectButton'
import { LobbyHero } from '@/components/lobby/LobbyHero'
import { Trophy, User, Settings, Database, Shield, Scale } from 'lucide-react'
import Link from 'next/link'

export default function LobbyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm shadow-[0px_8px_24px_0px_rgba(17,23,61,0.8)]">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-b from-primary to-accent shrink-0">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-medium text-foreground">トレーディングカップ</span>
              <span className="text-xs text-muted-foreground mt-0.5">IZKYプラットフォーム</span>
            </div>
          </Link>
          <ConnectButton />
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto flex items-stretch px-4">
          <Link
            href="/"
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-primary"
          >
            ロビー
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <User className="h-4 w-4" />
            プロフィール
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <Settings className="h-4 w-4" />
            管理
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-xl space-y-6">
        {/* Hero */}
        <LobbyHero />

        {/* Cups */}
        <CupLobby />

        {/* Features */}
        <div className="grid gap-4">
          <div className="bg-card border border-border rounded-lg p-4 shadow-[0px_8px_24px_0px_rgba(17,23,61,0.8)]">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-foreground">リアルデータ</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              すべての取引は、取引所アカウントへの読み取り専用APIアクセスを使用して検証されます
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 shadow-[0px_8px_24px_0px_rgba(17,23,61,0.8)]">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-foreground">安全</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              APIキーは暗号化され、読み取り専用の権限のみが付与されます
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 shadow-[0px_8px_24px_0px_rgba(17,23,61,0.8)]">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-foreground">フェアプレイ</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              競技中の入出金は失格となります
            </p>
          </div>
        </div>
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
