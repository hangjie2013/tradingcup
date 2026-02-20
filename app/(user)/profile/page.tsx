'use client'

import { useAccount } from 'wagmi'
import { ConnectButton } from '@/components/wallet/ConnectButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Key, User, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

function truncateAddress(address: string) {
  return `${address.slice(0, 10)}...${address.slice(-8)}`
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount()
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Link>
          <ConnectButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-xl">
        <h1 className="text-2xl font-bold mb-6">プロフィール</h1>

        {!isConnected ? (
          <Card className="border-border/50">
            <CardContent className="pt-6 text-center space-y-4">
              <User className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground">プロフィールを表示するにはウォレットを接続してください</p>
              <ConnectButton />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">ウォレット</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">
                    {address ? truncateAddress(address) : '—'}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">API設定</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  取引カップに参加するにはLBankアカウントを接続してください。
                </p>
                <Link href="/api-settings">
                  <Button variant="outline" className="gap-2">
                    <Key className="h-4 w-4" />
                    APIキー管理
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
